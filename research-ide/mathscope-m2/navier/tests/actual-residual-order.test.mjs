import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {actualResidualOrderCertificate,verifyActualResidualOrderCertificate,ACTUAL_RESIDUAL_DOMAIN_ID} from '../actual-residual-order.mjs';
import {actualResidualOrderBounds,evaluateResidualNormAudit} from '../actual-residual-order-bounds.mjs';
import {buildActualResidualOrderProgram} from '../actual-residual-order-algebra.mjs';
import {ACTUAL_BACKGROUND_INPUTS} from '../actual-background-data.mjs';
import {rational as q,readRational,cmpR,unpackI,mulR} from '../actual-residual-order-rational.mjs';

const first=actualResidualOrderCertificate();

test('the actual pressure, axis, analytic norm, and continuation sources match their frozen bytes',()=>{
  const root=new URL('../../../',import.meta.url);
  for(const input of Object.values(ACTUAL_BACKGROUND_INPUTS.inputs)){
    const bytes=readFileSync(fileURLToPath(new URL(input.path,root)));
    assert.equal(bytes.length,input.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),input.sha256);
  }
  assert.equal(first.sourceProfile,'same-profile-2026-10-10.3');
  assert.equal(first.pass,true);assert.equal(first.sourceErrorLedger.smallParameters.actualHPositive,true);
});

test('actual residual generator retains all three components, pressure shift, and both radial higher terms',()=>{
  const g=buildActualResidualOrderProgram();
  assert.deepEqual(Object.keys(g.retainedResidualCoefficients),['theta0','z0','pressure0','theta1','z1','pressure1']);
  assert.equal(g.omega.length,3);assert.ok(g.nodes.length>g.leading.F.length);
  for(const group of Object.values(g.remainderCoefficients))for(const field of ['theta','z','radial','radialNext'])assert.ok(group[field].length>1);
  assert.equal(g.scope.finiteRadialJetIsFullSolution,false);
  assert.equal(g.nodes[g.axisRoots.z1Axis].args[0],'0');assert.notEqual(g.axisRoots.z1FirstX,g.axisRoots.z1Axis);
});

test('source norm DAG executes Cauchy losses without supplied constants or missing high derivatives',()=>{
  const b=actualResidualOrderBounds({maxDerivativeOrder:6}),nodes=b.positiveNormGraph.nodes;
  const sourceNames=new Set();
  for(let i=0;i<nodes.length;i++){
    const n=nodes[i];assert.ok(['rational','source_expression','add','multiply','inverse_positive','sqrt_positive'].includes(n.op));
    if(n.op==='source_expression'){sourceNames.add(n.args[0]);assert.ok(Object.hasOwn(b.exactExpressions,n.args[0]));}
    else if(n.op!=='rational')for(const id of n.args)assert.ok(Number.isInteger(id)&&id>=0&&id<i);
  }
  assert.deepEqual([...sourceNames].sort(),['residualEtaRadius','residualFieldNorm','residualRadialRadius']);
  assert.equal(Object.keys(b.positiveNormGraph.coefficientNorms).length,8);
  const audit=evaluateResidualNormAudit(b,{residualRadialRadius:.5,residualEtaRadius:.25,residualFieldNorm:2});
  const values=audit.values,majorant=values[b.positiveNormGraph.residualNormNode];
  for(const id of Object.values(b.positiveNormGraph.coefficientNorms))assert.ok(values[id]>0&&values[id]<majorant);
  assert.equal(audit.actualSourceCertificate,false);
  assert.ok(b.derivativeConstants.every(x=>x.Km===2+x.m&&x.N.join(',')==='0,1'&&values[x.CNmNode]>=8*majorant));
});

test('actual N0 and N1 component intervals have correct distinct physical q powers and nonzero source data',()=>{
  const witness=first.pointRows.filter(r=>r.XMultiplierExact==='1');
  assert.equal(witness.length,6);
  const row=(N,c)=>witness.find(r=>r.N===N&&r.component===c);
  assert.ok(row(0,'theta').displayEnclosure[1]<0);
  assert.ok(row(0,'z').displayEnclosure[0]>.99);
  assert.ok(row(0,'radial').displayEnclosure[0]>19);
  assert.ok(row(1,'z').displayEnclosure[0]>4.49);
  assert.equal(row(0,'radial').physicalScale.qExponent.hCoefficient,0);
  assert.equal(row(1,'radial').physicalScale.qExponent.hCoefficient,2);
  assert.equal(row(0,'z').physicalScale.qExponent.hCoefficient,1);
  assert.equal(row(1,'z').physicalScale.qExponent.hCoefficient,3);
  for(const c of ['theta','radial']){assert.equal(row(1,c).intervalZeroCenterIsNotAnExactZero,true);assert.notEqual(row(1,c).normalizedInterval.width,'0');}
});

test('actual whole-fixed-domain norm improvement uses a positive measured witness and a computed source uniform bound',()=>{
  assert.equal(first.timeRows.length,4);
  for(const t of first.timeRows){
    assert.ok(cmpR(readRational(t.N0NormLowerExact),q(1))>0);
    assert.ok(cmpR(readRational(t.actualNormRatioUpperExact),q(1,1n<<BigInt(t.k)))<0);
    assert.equal(t.lowerIsEvaluatedSourceWitness,true);assert.equal(t.upperIsSourceDerivedUniformNorm,true);
    assert.equal(t.qStrictlyPositive,true);assert.equal(t.qBinary64,null);assert.equal(t.domainId,ACTUAL_RESIDUAL_DOMAIN_ID);
  }
});

test('the certified compact and physical derivative domains stay inside the unchanged source core',()=>{
  assert.equal(first.domain.angularDomain,'all theta');assert.equal(first.domain.normWitnessTheta,'0');
  assert.equal(first.restrictionProof.sameFinalizedInnerCoefficientRestriction,true);
  assert.equal(first.restrictionProof.stressAndAllDerivativesExactlyZeroOnObservationNeighborhood,true);
  assert.equal(first.restrictionProof.qCutoffNotApplied,true);
  const b=first.sourceNorms;assert.deepEqual(b.scope.etaDomain,['-1','1']);
  assert.equal(b.scope.entireRealEtaLineCovered,false);assert.equal(b.scope.fullSourceEtaIntervalCovered,true);
  assert.equal(b.physicalDerivativeProof.baseCartesianScalarSummandsUpper,8);
  assert.equal(b.physicalDerivativeProof.complexPolydisc.cartesianRadius,'sqrt(R)/32 per s_i');
  assert.match(b.physicalDerivativeProof.axialOperator,/q\^\(a-D\)/);
});

test('arithmetic precision changes neither the source coordinates nor q nor the analytic error floor',()=>{
  const low=actualResidualOrderCertificate({bits:96}),high=actualResidualOrderCertificate({bits:512});
  assert.deepEqual(low.exactExpressions,high.exactExpressions);
  assert.deepEqual(low.pointRows.map(r=>r.XExactExpression),high.pointRows.map(r=>r.XExactExpression));
  assert.deepEqual(low.timeRows.map(r=>r.qExactExpression),high.timeRows.map(r=>r.qExactExpression));
  for(let i=0;i<low.pointRows.length;i++){
    const a=unpackI(low.pointRows[i].normalizedInterval),b=unpackI(high.pointRows[i].normalizedInterval);
    assert.ok(cmpR(a[0],b[0])<=0&&cmpR(b[1],a[1])<=0);
    assert.equal(low.pointRows[i].analyticRemainderUpperExact,high.pointRows[i].analyticRemainderUpperExact);
    assert.ok(cmpR(readRational(high.pointRows[i].normalizedInterval.width),mulR(q(2),readRational(high.pointRows[i].analyticRemainderUpperExact)))>=0);
  }
});

test('nested spatial meshes cover the same positive compact and reproduce every shared source point',()=>{
  const coarse=actualResidualOrderCertificate({mesh:4}),fine=actualResidualOrderCertificate({mesh:32});
  assert.deepEqual(coarse.domain,fine.domain);assert.deepEqual(coarse.exactExpressions,fine.exactExpressions);
  for(const r of coarse.pointRows){const s=fine.pointRows.find(x=>x.id===r.id);assert.ok(s);assert.deepEqual(r.normalizedInterval,s.normalizedInterval);assert.deepEqual(r.XExactExpression,s.XExactExpression);}
  assert.equal(coarse.refinement.meshSamplesAreObservationsNotAReplacementForTheAnalyticSupremumBound,true);
});

test('all exact expression references are closed and no q or radius is materialized as zero',()=>{
  const seen=new Set(),active=new Set(),expressions=first.exactExpressions;
  function visit(name){assert.ok(Object.hasOwn(expressions,name),name);if(seen.has(name))return;assert.equal(active.has(name),false);active.add(name);walk(expressions[name]);active.delete(name);seen.add(name);}
  function walk(x){if(!x||typeof x!=='object')return;if(Array.isArray(x))x.forEach(walk);else if(x.ref)visit(x.ref);else if(x.positiveNormGraphNode!==undefined)assert.ok(first.sourceNorms.positiveNormGraph.nodes[x.positiveNormGraphNode]);else Object.values(x).forEach(walk);}
  Object.keys(expressions).forEach(visit);
  assert.ok(first.pointRows.every(r=>r.XStrictlyPositive&&r.XBinary64===null));
  assert.ok(first.pointRows.every(r=>r.displayEnclosure.every(Number.isFinite)));
});

test('replay rejects forged source pressure, absent viscosity, reduced C, moving coordinates, erased error, and global claims',()=>{
  const mutations=[
    r=>r.sourceInputs.pressure.sha256='0'.repeat(64),
    r=>r.residualProgram.remainderCoefficients.N0.z.fill(0),
    r=>r.sourceNorms.positiveNormGraph.nodes[r.sourceNorms.positiveNormGraph.residualNormNode]={op:'rational',args:['1','1']},
    r=>r.exactExpressions.residualXUnit={integer:'0'},
    r=>r.pointRows[0].analyticRemainderUpperExact='0',
    r=>r.pointRows[0].normalizedInterval={lower:'0',upper:'0',width:'0'},
    r=>r.timeRows[0].qBinary64=0,
    r=>r.scope.wholeProfileResidualComplete=true,
    r=>r.restrictionProof.qCutoffNotApplied=false,
  ];
  for(const mutate of mutations){const r=structuredClone(first);mutate(r);assert.equal(verifyActualResidualOrderCertificate(r).pass,false);}
  assert.equal(verifyActualResidualOrderCertificate(first).pass,true);
});

test('invalid precision, moving radius, alternate profile, and user-declared C are rejected at input',()=>{
  for(const x of [{bits:80},{bits:513},{mesh:5},{sourceProfile:'toy'},{C:1},{XUnit:'1/1000'},{locationScaleBits:128},{N:2},{timeIndices:[4,4]},{timeIndices:[0]},{maxDerivativeOrder:7}])assert.throws(()=>actualResidualOrderCertificate(x));
});

test('extreme finite observation settings preserve intervals and the finite-only source scope',()=>{
  const c=actualResidualOrderCertificate({bits:512,mesh:32,maxDerivativeOrder:6,timeIndices:[1,256]});
  assert.equal(c.pass,true);assert.ok(c.pointRows.every(r=>r.normalizedInterval.width!=='0'));
  assert.ok(c.timeRows.every(r=>r.displayEnclosure.every(Number.isFinite)));
  assert.equal(c.scope.globalN1MomentRepairComplete,false);assert.equal(c.scope.allNResidualComplete,false);assert.equal(c.scope.wholeProfileResidualComplete,false);
  assert.equal(c.scope.sourceCoefficientPointsAtEtaZeroOnly,true);assert.equal(c.scope.uniformEtaDomainCertified,true);
});
