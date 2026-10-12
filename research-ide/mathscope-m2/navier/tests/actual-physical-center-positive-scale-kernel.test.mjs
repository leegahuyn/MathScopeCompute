import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {recomputePhysicalCenterPositiveScales} from '../actual-physical-center-positive-scale-kernel.mjs';
import {encloseActualPositiveProfileLogs} from '../actual-positive-profile-log-enclosure.mjs';
import {encloseTerminalTargetRegularCoefficient} from '../actual-terminal-target-coefficient-kernel.mjs';
import {rational as Q,readRational,qcompare,qsub,qtext} from '../actual-continuation-arithmetic.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

// This immutable intermediate target certificate was produced before the
// enclosing source attempt failed at a later program-array seal. It is used
// ONLY as a comparison fixture; no whole-source success or private authority
// is recovered from these serialized bytes.
const fixtureURL=new URL('../research/evidence/physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt1-target-certificate.json',import.meta.url),
  fixtureText=fs.readFileSync(fixtureURL,'utf8'),
  fixtureHash='a0ed95d6df4f42b09968865694da43616fb560baa45b0d15532d040d083cec70',
  stored=JSON.parse(fixtureText),premises={roots:stored.source.roots,scaleBounds:stored.source.scaleBounds},
  controls={precisionBits:192,tolerance:'1/1000000000000'};
let freshPromise;
function fresh(){
  return freshPromise??=(async()=>{
    const profile=await encloseActualPositiveProfileLogs({precisionBits:controls.precisionBits,logCoordinateTolerance:controls.tolerance}),
      coefficient=encloseTerminalTargetRegularCoefficient({precisionBits:controls.precisionBits,tolerance:controls.tolerance,maxCells:1024}),
      result=recomputePhysicalCenterPositiveScales(profile,coefficient,premises,controls);
    return {profile,coefficient,result};
  })();
}
const targetSpec={Ac:[4,false,'Ac'],tau:[4,true,'tau'],g:[4,true,'g'],F:[3,true,'F'],
  profileX:[3,false,'X'],profileRadius:[3,false,'r'],gamma:[2,true,'gamma']};
function leafOfEndpoint(node,height,small){
  assert.deepEqual(Object.keys(node),['exp']);node=node.exp;
  if(small){assert.deepEqual(Object.keys(node),['neg']);node=node.neg;}
  for(let j=1;j<height;j++){assert.deepEqual(Object.keys(node),['exp']);node=node.exp;}
  assert.deepEqual(Object.keys(node),['rational']);readRational(node.rational);return node.rational;
}

test('the original retained target fixture has the separately recorded exact bytes',()=>{
  assert.equal(createHash('sha256').update(fixtureText).digest('hex'),fixtureHash);
  assert.equal(stored.schema,'MathScope.ActualPhysicalCenterTargetEnclosureCertificate/1');
  assert.equal(stored.pass,true);assert.equal(stored.numerics.rows.length,7);
  assert.ok(stored.checks.every(row=>row.pass));
});

test('fresh profile and target arithmetic reproduce all original seven add rows and fifteen profile endpoints',async()=>{
  const {profile,coefficient,result}=await fresh();
  assert.deepEqual(profile.rows,stored.numerics.profile.rows);
  assert.deepEqual(coefficient.actualCoefficientIfSourcePremisesBound,stored.numerics.coefficient.actualCoefficientIfSourcePremisesBound);
  assert.equal(result.rows.length,22);assert.equal(new Set(result.rows.map(row=>row.name)).size,22);
  for(const original of stored.numerics.rows){
    const row=result.rows.find(row=>row.name===original.name);
    for(const key of ['sourceRoot','sourceInequality','interval','logCoordinateInterval','logCoordinateWidth','toleranceMet'])
      assert.deepEqual(row[key],original[key],original.name+' '+key);
  }
  for(const original of profile.rows){
    const row=result.rows.find(row=>row.name===original.name);
    assert.deepEqual(row.interval,original.interval);assert.deepEqual(row.logCoordinateInterval,original.logCoordinateInterval);
  }
  assert.ok(result.checks.every(row=>row.pass));assert.equal(result.scope.sourceAuthenticated,false);
});

test('each exact endpoint has its declared tower height and the correct reversed order for small positive scales',async()=>{
  const {result}=await fresh();
  for(const row of result.rows){
    const {interval}=row,{height,small}=interval,lower=readRational(row.logCoordinateInterval.lower),upper=readRational(row.logCoordinateInterval.upper);
    assert.ok(qcompare(lower,upper)<=0);
    assert.equal(qtext(qsub(upper,lower)),row.logCoordinateWidth);
    assert.ok(qcompare(qsub(upper,lower),readRational(controls.tolerance))<=0);
    assert.equal(leafOfEndpoint(interval.lower,height,small),small?interval.coordinate.upper:interval.coordinate.lower);
    assert.equal(leafOfEndpoint(interval.upper,height,small),small?interval.coordinate.lower:interval.coordinate.upper);
    assert.equal(interval.coordinate.lower,row.logCoordinateInterval.lower);
    assert.equal(interval.coordinate.upper,row.logCoordinateInterval.upper);
    assert.equal(interval.strictlyPositiveLower,true);assert.equal(interval.originalValueRelativeErrorGuaranteed,false);
    if(targetSpec[row.name]){
      const [expectedHeight,expectedSmall,rootName]=targetSpec[row.name];
      assert.equal(height,expectedHeight);assert.equal(small,expectedSmall);
      assert.equal(row.sourceRoot,premises.roots[rootName]);assert.deepEqual(row.sourceInequality,premises.scaleBounds[rootName]);
    }
  }
});

test('changed source inequalities or a missing/invalid root descriptor cannot pass the fixed premise contract',async()=>{
  const {profile,coefficient}=await fresh();
  for(const name of Object.keys(premises.scaleBounds).filter(name=>['Ac','tau','g','F','X','r','gamma'].includes(name))){
    const changed=structuredClone(premises);changed.scaleBounds[name]=[...changed.scaleBounds[name]].reverse();
    assert.throws(()=>recomputePhysicalCenterPositiveScales(profile,coefficient,changed,controls),{code:'INVALID_SOURCE_CONSTRUCTION'},name);
  }
  for(const value of [-1,Number.MAX_SAFE_INTEGER+1,undefined]){
    const changed=structuredClone(premises);changed.roots.Ac=value;
    assert.throws(()=>recomputePhysicalCenterPositiveScales(profile,coefficient,changed,controls),{code:'INVALID_SOURCE_CONSTRUCTION'});
  }
});

test('the strict target margin and actual logarithm tolerance are enforced',async()=>{
  const {profile,coefficient}=await fresh();
  for(const box of [{lower:'7',upper:'15/2'},{lower:'15/2',upper:'8'},{lower:'-1',upper:'15/2'}]){
    const changed={...coefficient,actualCoefficientIfSourcePremisesBound:box};
    assert.throws(()=>recomputePhysicalCenterPositiveScales(profile,changed,premises,controls),{code:'PRECISION_REQUIRED'});
  }
  assert.throws(()=>recomputePhysicalCenterPositiveScales(profile,{...coefficient,pass:false},premises,controls),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>recomputePhysicalCenterPositiveScales(profile,coefficient,premises,{...controls,tolerance:qtext(Q(1,10n**90n))}),{code:'PRECISION_REQUIRED'});
});

test('a distinct precision makes fresh log intervals and retains positive reserves',async()=>{
  const changedControls={precisionBits:256,tolerance:'1/100000000'},
    profile=await encloseActualPositiveProfileLogs({precisionBits:256,logCoordinateTolerance:changedControls.tolerance}),
    coefficient=encloseTerminalTargetRegularCoefficient({precisionBits:256,tolerance:changedControls.tolerance,maxCells:1024}),
    result=recomputePhysicalCenterPositiveScales(profile,coefficient,premises,changedControls),
    previous=(await fresh()).result;
  assert.equal(result.arithmetic.precisionBits,256);assert.equal(result.rows.length,22);
  assert.notDeepEqual(result.rows[0].logCoordinateInterval,previous.rows[0].logCoordinateInterval);
  for(const row of result.rows){
    assert.ok(qcompare(readRational(row.logCoordinateWidth),Q(0))>0);
    assert.ok(qcompare(readRational(row.logCoordinateWidth),readRational(changedControls.tolerance))<=0);
  }
  assert.equal(result.scope.originalPositiveHRetained,true);
  assert.equal(result.scope.originalValueRelativeErrorClaimed,false);
});

test('pure recomputation neither mutates its inputs nor creates source authority from stored premises',async()=>{
  const {profile,coefficient}=await fresh(),before=canonicalStringify({profile,coefficient,premises}),
    result=recomputePhysicalCenterPositiveScales(profile,coefficient,premises,controls);
  assert.equal(canonicalStringify({profile,coefficient,premises}),before);
  result.rows[0].interval.coordinate.lower='0';
  result.rows.find(row=>row.name==='Ac').sourceInequality[0]='changed';
  assert.equal(canonicalStringify({profile,coefficient,premises}),before);
  assert.equal(result.scope.sourceAuthenticated,false);assert.equal(result.scope.selectorAndPaletteScalesIncluded,false);
  assert.equal(result.scope.wholeGNUMComplete,false);assert.ok(result.rows.every(row=>row.sourceAuthenticated===false));
});
