import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {actualMeanPulseCovariance} from '../actual-pulse-covariance-integrals.mjs';
import {evaluateActualMeanStress} from '../actual-mean-stress.mjs';
import {actualMeanPulseMatchedStress,canonicalActualSourceExpression,exactPulseCovarianceAlgebra,verifyActualPulseMatchingInputs} from '../actual-pulse-covariance-matching.mjs';
import {actualMeanPulsePointwiseAssembly,verifyActualPulsePointwiseAssembly,sourcePulseSquaredPartitionAtOffset} from '../actual-pulse-covariance-partition.mjs';

const request={cells:64,cutoffCells:64,bits:128};
const actual=actualMeanPulseMatchedStress(request),assembly=actualMeanPulsePointwiseAssembly(request);

test('actual same-profile source stress and covariance produce positive weights',()=>{
  assert.ok(actual.pass);assert.equal(actual.bindings.sourceFCanonical,'IDENTICAL_FLATTENED_EXACT_SOURCE_EXPRESSION');
  assert.ok(actual.checks.every(c=>c.pass));assert.equal(actual.rows.length,2);
  assert.deepEqual(actual.rows[0].normalizedSquaredAmplitude,actual.rows[1].normalizedSquaredAmplitude);
  assert.ok(actual.rows[0].normalizedSquaredAmplitude[0]>0);
  assert.equal(actual.weights.sourceScale.strictlyPositive,true);assert.equal(actual.weights.sourceScale.binary64,null);
  assert.equal(actual.weights.normalizationDoesNotChangeOriginalGrowingDatum,true);
  assert.equal(actual.meanStress.normalizedTarget.zExact,'0');
  assert.equal(actual.meanStress.bounds.heatCompensation.debtSetToZero,false);
  assert.deepEqual(actual.localIdentity.identicallyZeroResidual,{theta:[],z:[]});
});

test('actual y endpoints and quadrature refinement stay joined to the requested source',()=>{
  for(const y of [.25,4.75]){const r=actualMeanPulseMatchedStress({...request,y});assert.ok(r.pass);assert.equal(r.observedDomain.y,y);assert.equal(r.meanStress.input.y,y);assert.equal(r.pulseCovariance.phaseProgram.representative.y,y);}
  const fine=actualMeanPulseMatchedStress({cells:512,bits:512});
  assert.ok(fine.rows[0].normalizedSquaredAmplitude[0]>actual.rows[0].normalizedSquaredAmplitude[0]);
  assert.ok(fine.rows[0].normalizedSquaredAmplitude[1]<actual.rows[0].normalizedSquaredAmplitude[1]);
  assert.equal(fine.meanStress.bounds.bits,512);assert.equal(fine.pulseCovariance.integrals.tail.tailNotSetToZero,true);
});

test('source root equality compares expressions rather than display intervals',()=>{
  const a=canonicalActualSourceExpression(actual.pulseCovariance.phaseProgram,'F0'),b=canonicalActualSourceExpression(actual.meanStress.program,'F');assert.deepEqual(a,b);
  const changed=structuredClone(actual.meanStress.program);changed.roots.F=changed.roots.X;
  assert.notDeepEqual(canonicalActualSourceExpression(changed,'F'),a);
});

test('source receipt replay rejects changed y, forged target and altered covariance',()=>{
  const c=actualMeanPulseCovariance({cells:64,cutoffCells:64}),t=evaluateActualMeanStress({bits:128});
  assert.ok(verifyActualPulseMatchingInputs(c,t).pass);
  for(const mutate of [r=>{r.request.y=1;},r=>{r.integrals.A[0]=.01;},r=>{r.parity.exact=false;},r=>{r.sourceHash='00';}]){const changed=structuredClone(c);mutate(changed);assert.equal(verifyActualPulseMatchingInputs(changed,t).pass,false);}
  for(const mutate of [r=>{r.normalizedTarget.z=[.01,.01];},r=>{r.normalizedTarget.theta=[1,1];},r=>{r.program.roots.F=r.program.roots.theta;}]){const changed=structuredClone(t);mutate(changed);assert.equal(verifyActualPulseMatchingInputs(c,changed).pass,false);}
  assert.equal(verifyActualPulseMatchingInputs(c,evaluateActualMeanStress({y:1,bits:128})).pass,false);
});

test('exact source inverse and physical scale algebra expose three wrong conventions',()=>{
  const right=exactPulseCovarianceAlgebra();assert.ok(right.pass);assert.deepEqual(right.thetaResidual,[]);assert.deepEqual(right.zResidual,[]);
  assert.deepEqual(right.scaleIdentity.QExponent,{constant:'0',h:'0'});assert.deepEqual(right.scaleIdentity.qExponent,{constant:'-1',h:'-1'});
  assert.equal(exactPulseCovarianceAlgebra({omitInverseHalf:true}).pass,false);
  assert.equal(exactPulseCovarianceAlgebra({omitEpsilon:true}).pass,false);
  assert.equal(exactPulseCovarianceAlgebra({duplicateSigns:true}).pass,false);
});

test('explicit smooth translated partition enumerates the whole active set',()=>{
  for(const offset of [-.5,-.4,-.25,-.1,0,.1,.25,.4,.5]){
    const r=sourcePulseSquaredPartitionAtOffset(offset);assert.ok(r.pass);assert.equal(r.allActiveIndicesEnumerated,true);assert.equal(r.exactSquaredSum,'1');
    assert.ok(r.rows.length<=2);assert.ok(r.intervalSquaredSum[0]<=1&&r.intervalSquaredSum[1]>=1);
    for(let n=-20;n<=20;n++)if(Math.abs(offset-n)<.75)assert.ok(r.rows.some(row=>row.relativeIndex===n));
    if(Math.abs(offset)<=.25){assert.equal(r.rows.length,1);assert.deepEqual(r.rows[0].squaredWeight,[1,1]);}
    assert.equal(r.definition.positiveDenominatorLowerExact,'1/4');
  }
  assert.throws(()=>sourcePulseSquaredPartitionAtOffset(.5001),{code:'INVALID_INPUT'});
});

test('actual complete physical sum includes two source signs in one source box',()=>{
  assert.ok(assembly.pass);assert.equal(assembly.partition.activeBands.length,1);assert.equal(assembly.partition.activeBoxes.length,1);assert.equal(assembly.rows.length,1);
  assert.equal(assembly.labels.rectangleLabels,2);assert.equal(assembly.labels.slowBoxMultiplicity,1);assert.ok(assembly.labels.checks.every(c=>c.pass));
  assert.equal(assembly.partition.band.lowerBandIndex,'ell0=ell_actual-1');assert.equal(assembly.partition.band.qBigObservation,'3*Q/2');
  assert.equal(assembly.partition.origin.yExact,assembly.labels.plusProgram.representative.yExact);
  assert.equal(assembly.labels.minusProgram.representative.sign,-1);assert.equal(assembly.labels.plusProgram.representative.sign,1);
  assert.equal(assembly.partition.productSquaredWeightExact,'1');assert.deepEqual(assembly.physicalIdentity.exactResidual,[0,0]);
  assert.equal(assembly.physicalIdentity.globalIdentityAtThisActualPointVerified,true);assert.equal(assembly.physicalIdentity.pointwisePhysicalVelocityEqualsHaarAverage,false);
});

test('whole-family and common q-star claims remain separate from actual finite assembly',()=>{
  assert.equal(assembly.scope.actualPointwiseEquation730Verified,true);assert.equal(assembly.scope.globalSquaredPartitionConstructed,true);
  assert.equal(assembly.scope.wholeAnnulusCovarianceMatched,false);assert.equal(assembly.scope.allSlowNeighborhoodsMatched,false);
  assert.equal(assembly.partition.scope.sourceUniformQStarCertified,false);assert.equal(assembly.partition.singleActiveInterior.covarianceCertifiedThroughoutInterior,false);
  assert.equal(assembly.scope.allOriginalN5PackageComplete,false);assert.equal(assembly.status,'PARTIAL');
});

test('full active-set replay rejects omission, double counting and source changes',()=>{
  assert.ok(verifyActualPulsePointwiseAssembly(assembly).pass);
  for(const mutate of [r=>{r.partition.activeBoxes=[];},r=>{r.rows.push(structuredClone(r.rows[0]));},r=>{r.rows[0].squaredCutoffExact='1/2';},r=>{r.partition.origin.yExact='1/1';},r=>{r.localMatch.meanStress.normalizedTarget.z=[1,1];},r=>{r.scope.wholeAnnulusCovarianceMatched=true;}]){const changed=structuredClone(assembly);mutate(changed);assert.equal(verifyActualPulsePointwiseAssembly(changed).pass,false);}
});

test('input contracts reject hypothetical replacement data and support cancellation',()=>{
  for(const x of [{h:0},{eta:.1},{sign:1},{target:[1,0]},{weights:[1,1]},{grid:[0,0,0]},{y:5},{cells:100},{bits:15},{sourceProfile:'different-profile'}])assert.throws(()=>actualMeanPulsePointwiseAssembly(x));
  assert.throws(()=>actualMeanPulsePointwiseAssembly({}, {checkCancelled(){throw Object.assign(Error('cancelled'),{code:'CANCELLED'});}}),{code:'CANCELLED'});
});

test('all source-path observations resolve to actual nested output objects',()=>{
  const root={result:{results:assembly}},paths=[];
  const walk=v=>{if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object'){if(typeof v.sourcePath==='string')paths.push(v.sourcePath);Object.values(v).forEach(walk);}};walk(assembly);
  for(const path of paths){let value=root;for(const token of path.replace(/\[(\d+)\]/g,'.$1').split('.'))value=value?.[token];assert.notEqual(value,undefined,path);}
  assert.ok(paths.length>100);
});

test('the actual covariance, target and phase inputs remain frozen',()=>{
  const hashes={
    'actual-pulse-covariance-integrals.mjs':'6690a62a744195fa733f8a3b3f61f90b291a88c9cbb490e94e96d4963e3065c5',
    'actual-mean-stress.mjs':'7dc194a8a33ff5a3882c1bedf82cf1d26efe3220f0bd66a1e550482369ccad71',
    'actual-pulse-amplitude-phase.mjs':'0ed21e490d93a59caa578d91a4dd3df3791a0e9a07a845740a15cd7578c98224',
    'actual-pulse-amplitude-integrator.mjs':'096eea803e7c17481c4926b4a8b811ddf54ddc4df615253477092780c3d1b60d'
  };
  for(const[path,hash]of Object.entries(hashes))assert.equal(createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),hash,path);
});
