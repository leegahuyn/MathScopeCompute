import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildActualBackgroundJets,evaluateBackgroundJetOracle} from '../actual-background-jets.mjs';
import {actualBackgroundMajorant,auditPicardTailInequality} from '../actual-background-majorant.mjs';
import {actualBackgroundAxisObservations,verifyActualBackgroundAxisObservations} from '../actual-background-observations.mjs';
import {ACTUAL_BACKGROUND_INPUTS} from '../actual-background-data.mjs';
import {actualBackgroundMomentFunctionals} from '../actual-background-moments.mjs';
import {actualBackgroundConstruction} from '../actual-background.mjs';
import {actualBackgroundPointEnclosures,verifyActualBackgroundPointEnclosures} from '../actual-background-points.mjs';

const parameters={h:1/100,j0:1/50,Lambda:40,sigmaStar:3/1000};
const pressure=[-3,0,5,0,2,0,3,0,1,0,1,0,0,0,0,0,0,0,0,0];
const oracle=(graph,p=parameters)=>evaluateBackgroundJetOracle(graph,{parameters:p,pressureDerivatives:pressure,amplitudeAtEta:1/5});
const close=(a,b,tol=1e-11)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);

test('all imported actual source files retain their exact SHA-256 and byte count',()=>{
  const base=new URL('../../../',import.meta.url);
  for(const input of Object.values(ACTUAL_BACKGROUND_INPUTS.inputs)){
    const bytes=readFileSync(fileURLToPath(new URL(input.path,base)));
    assert.equal(bytes.length,input.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),input.sha256);
  }
  assert.equal(ACTUAL_BACKGROUND_INPUTS.pressure.sourceReceiptPass,true);
});

test('actual source recurrence constructs positive order one with exactly zero axis datum',()=>{
  const g=buildActualBackgroundJets({radialDegree:3});
  assert.equal(g.nodes[g.positive.F[0]].args[0],'0');assert.equal(g.nodes[g.positive.U[0]].args[0],'0');assert.equal(g.nodes[g.positive.Pi[0]].args[0],'0');
  assert.equal(g.leading.F[0],g.fixed.g);assert.equal(g.leading.U[0],g.fixed.Ustar);assert.equal(g.leading.Pi[0],g.fixed.P);
  assert.equal(g.scope.actualPositiveOrderRadialJetGenerated,true);assert.equal(g.scope.nextOrderSourceAllowed,false);
  assert.equal(g.nodes.some(n=>n.op==='user_supplied_profile_jet'),false);
});

test('coefficient prefix is independent of the requested later radial truncation',()=>{
  const a=oracle(buildActualBackgroundJets({radialDegree:2})),b=oracle(buildActualBackgroundJets({radialDegree:4}));
  for(const field of ['F','U','Pi','K','V'])for(let i=0;i<a.positive[field].length;i++)close(a.positive[field][i],b.positive[field][i]);
});

test('n=1 first axis slopes agree with independent differentiation of the axis datum',()=>{
  for(const p of [parameters,{h:1/20,j0:1/5,Lambda:9,sigmaStar:1/50},{h:1/40,j0:2/5,Lambda:5,sigmaStar:1/10}]){
    const a=oracle(buildActualBackgroundJets({radialDegree:1}),p),A=.5+p.h,b=-1-p.h,B=4.5-p.h,den=p.j0*p.j0+p.sigmaStar*p.sigmaStar;
    const zeta=-p.j0/den,zetaPrime=B*(p.j0*p.j0-p.sigmaStar*p.sigmaStar)/(den*den);
    close(a.positive.F[1],-.2*(2*b+p.Lambda*zetaPrime+p.Lambda*p.Lambda*zeta*zeta)/4);
    close(a.positive.U[1],A*p.j0);
    close(a.positive.Pi[1],-12+2*A*pressure[0]-pressure[2]/2);
  }
});

test('actual A.21 intervals produce three finite normalized source observations with analytic uncertainty',()=>{
  const x=actualBackgroundAxisObservations();assert.equal(verifyActualBackgroundAxisObservations(x).pass,true);assert.equal(x.samples.length,3);
  assert.ok(x.samples[0].value>.999&&x.samples[0].value<1);assert.equal(x.samples[1].value,.5);assert.ok(x.samples[1].displayEnclosure[1]>.5);assert.ok(x.samples[2].value<0);
  for(const row of x.samples){assert.ok(row.normalizedInterval.width!=='0');assert.ok(row.displayEnclosure.every(Number.isFinite));assert.equal(row.physicalValueUnderflowOrOverflowNotSubstituted,true);}
  assert.equal(x.scope.nonzeroRadiusPicardSolutionEvaluated,false);
});

test('forged interval values, source hashes, coordinates, and zero-parameter claims fail verification',()=>{
  for(const mutate of [x=>x.samples[2].normalizedInterval.lower='0',x=>x.sourceInputs.pressure.sha256='0'.repeat(64),x=>x.domain.XExact='1',x=>x.smallParameterEnclosure.allActualParametersStrictlyPositive=false,x=>x.scope.globalMomentRepairComplete=true]){
    const x=actualBackgroundAxisObservations();mutate(x);assert.equal(verifyActualBackgroundAxisObservations(x).pass,false);
  }
});

test('same-source norm graph is closed, acyclic, and keeps the original common collar',()=>{
  const m=actualBackgroundMajorant({bits:96}),seen=new Set(),active=new Set();
  function visit(name){assert.ok(Object.hasOwn(m.exactExpressions,name),'Unknown reference '+name);if(seen.has(name))return;assert.equal(active.has(name),false);active.add(name);walk(m.exactExpressions[name]);active.delete(name);seen.add(name);}
  function walk(x){if(!x||typeof x!=='object')return;if(Array.isArray(x)){x.forEach(walk);return;}if(x.ref)visit(x.ref);else Object.values(x).forEach(walk);}
  Object.keys(m.exactExpressions).forEach(visit);
  assert.deepEqual(m.commonInterval.X,['0','Xa*exp(t1/16)']);assert.equal(m.commonInterval.independentOfOrder,true);assert.equal(m.scope.actualCommonCollarCovered,true);
  assert.equal(m.analyticStrip.source,'dist(eta,[-1,1])<delta/4');assert.equal(m.picard.tailUpperExact,'1/2^96');assert.equal(m.picard.truncationActuallyEvaluated,false);
});

test('universal factorial tail bound is checked against actual term magnitudes',()=>{
  for(const [A,deltaLoss,bits] of [[.05,.1,32],[.2,.5,24],[.6,.25,32],[1,1,32]]){
    const a=auditPicardTailInequality({A,deltaLoss,bits});assert.equal(a.pass,true);
    for(let k=a.K;k<a.K+20;k++){
      let logFact=0;for(let j=2;j<=k+1;j++)logFact+=Math.log(j);
      const p=Math.ceil(k/2),logTerm=(k+1)*Math.log(A)-logFact+p*Math.log(Math.max(1,p/deltaLoss));
      assert.ok(logTerm<=-(k+1)*Math.log(4)+1e-10);
    }
    assert.equal(auditPicardTailInequality({A,deltaLoss,bits,K:1}).pass,false);
  }
});

test('uncompleted higher orders, alternate source profiles, and missing derivative oracles are rejected',()=>{
  assert.throws(()=>buildActualBackgroundJets({order:2}),/moment repair/);assert.throws(()=>actualBackgroundMajorant({order:2}),/preceding/);
  assert.throws(()=>buildActualBackgroundJets({profileId:'fixture'}),/exact accepted/);assert.throws(()=>buildActualBackgroundJets({radialDegree:7}),/1 to 6/);
  assert.throws(()=>evaluateBackgroundJetOracle(buildActualBackgroundJets(),{parameters,pressureDerivatives:[-3],amplitudeAtEta:.2}),/Missing pressure derivative/);
  assert.throws(()=>actualBackgroundMajorant({bits:0}),/16 to 4096/);assert.throws(()=>auditPicardTailInequality({A:1,deltaLoss:0}),/positive audit/);
});

test('actual Imean forcing excludes a core-only or Ipos-only moment reconstruction',()=>{
  const m=actualBackgroundMomentFunctionals(),c=m.imeanOmissionControl;
  assert.equal(c.sourceFields.mConstStrictlyPositive,true);assert.equal(c.exactOmega,'-mConst^2/(2X)');
  assert.ok(c.normalizedContributions[0].displayEnclosure[0]>.99);assert.deepEqual(c.normalizedContributions[1].displayEnclosure,[-1.25,-1.25]);
  assert.equal(c.negativeControl.rejected,true);assert.equal(m.nodes.globalPressureDebt.fullLeadingAxialSupportRequired,true);assert.equal(m.nodes.globalFluxDebt.fullLeadingAxialSupportRequired,true);
  assert.equal(m.scope.actualTotalMomentDebtsClosed,false);assert.equal(m.scope.nextOrderSourceAllowed,false);
  assert.deepEqual(m.roots,{m1:'localM1',m2:'localM2',m3:'m3',m4:'localM4',m5:'m5'});
});

test('public construction keeps generated local data separate from unclosed global criteria',()=>{
  const x=actualBackgroundConstruction({radialDegree:2,bits:64});
  assert.equal(x.status,'PARTIAL');assert.equal(x.allOriginalBackgroundCriteriaComplete,false);
  assert.equal(x.jets.scope.actualPositiveOrderRadialJetGenerated,true);assert.equal(x.majorant.scope.sameProfileSourceNormBoundDerived,true);
  assert.equal(x.axisObservations.scope.actualPositiveOrderValuesEnclosed,true);assert.equal(x.moments.scope.exactMatrixInverseAppliedToCompleteActualDebts,false);
  assert.equal(x.remaining.includes('EVALUATE_FINITE_SOURCE_Fslow_AND_CN_m_REFINEMENT'),true);
});

test('actual nonzero core enclosures retain positive exact radii and distinct observation types',()=>{
  const x=actualBackgroundPointEnclosures({locationScaleBits:64});assert.equal(x.samples.length,15);assert.equal(verifyActualBackgroundPointEnclosures(x).pass,true);
  assert.equal(x.domain.observationCauchyRadiusX,'3/Lambda');assert.equal(x.domain.commonPicardIntervalUnchanged.X[1],'Xa*exp(t1/16)');
  for(const row of x.samples){assert.equal(row.XStrictlyPositive,true);assert.equal(row.XBinary64,null);assert.equal(row.observationKind,'ACTUAL_NONZERO_RADIUS_NORMALIZED_DIFFERENCE_QUOTIENT');assert.equal(row.analyticRemainderUpperExact,'1/2^64');assert.ok(row.displayEnclosure[0]<=row.value&&row.value<=row.displayEnclosure[1]);}
  assert.equal(x.scope.completeInnerCollarEvaluator,false);assert.equal(x.scope.localMomentIntegralsEvaluated,false);assert.equal(x.scope.fixedPointRefinement,false);assert.equal(x.scope.precisionChangesObservationPoint,true);
});

test('point enclosures reject false zero radii, altered remainder bounds, and residual completion claims',()=>{
  for(const mutate of [x=>x.samples[0].XBinary64=0,x=>x.samples[0].normalizedInterval.lower='0',x=>x.samples[0].analyticRemainderUpperExact='0',x=>x.scope.N4_05_ResidualEvidence=true]){
    const x=actualBackgroundPointEnclosures();mutate(x);assert.equal(verifyActualBackgroundPointEnclosures(x).pass,false);
  }
  const a=actualBackgroundPointEnclosures({locationScaleBits:32}),b=actualBackgroundPointEnclosures({locationScaleBits:64});
  assert.notDeepEqual(a.derivedExpressions.observationXUnit,b.derivedExpressions.observationXUnit);
});
