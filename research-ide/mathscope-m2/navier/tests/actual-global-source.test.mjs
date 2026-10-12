import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  ActualSourceExpressions,evaluateSourceProgramDiagnostic,actualGlobalSourceConstruction,
  actualGlobalOmegaReduction,actualModulationOmegaRemainder,compileActualOuterAxialProgram,
  actualOuterPulseObservations,evaluateExactOmegaReducedMoments,evaluateExactRegularOmegaJet,
  fiveMomentsDoNotDetermineOmega
} from '../actual-global-source.mjs';
import {ACTUAL_OUTER_PULSE_RECEIPT} from '../actual-global-source-observations.mjs';
import {getPinnedSourceProfile} from '../source-profile.mjs';

const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} is not close to ${b}`);
const program=compileActualOuterAxialProgram();
const algebraIntegral=()=>{const d=new ActualSourceExpressions(),e=d.var('eta'),s=d.fresh('s'),body=d.add(d.pow(s,3),d.mul(e,s)),v=d.integral(body,s,d.zero,d.pow(e,2));return {d,e,program:d.pack({v,first:d.derivative(v,e),second:d.derivative(d.derivative(v,e),e)})};};

test('outer source program preserves the exact selected parameter graph and has no field/root oracle leaves',()=>{
  assert.deepEqual(program.parametersExactExpressions,getPinnedSourceProfile().parametersExactExpressions);
  assert.ok(program.nodes.length>3000&&program.nodes.length<20000);
  for(const node of program.nodes)assert.ok(!/oracle|source_field|unknown|supremum|root_limit/.test(node.op),node.op);
  assert.equal(program.scope.noNamedRootOrFieldOrDerivativeOracle,true);
  assert.equal(program.scope.completeActualGlobalU0Compiled,false);
  assert.equal(program.scope.outerTailIntegralsNumericallyEvaluated,false);
  assert.equal(program.energyNormalization.equalsFinalGlobalESquaredIntegral,false);
});
test('actual tail support includes the complete original late pulse and compact end corrections',()=>{
  assert.equal(program.support.XvExpression,'Xp*exp(13/lambda)');
  assert.equal(program.support.tailStartExpression,'I1Right=Xp*exp(-20)');
  assert.equal(program.support.UAndMAndVIdenticallyZeroAfterXv,true);
  assert.ok(program.equations.pulse.coefficients.length===2);
  assert.ok(program.equations.angular.coefficients.length===2);
  assert.equal(program.equations.pulse.sourceDerivativeFloor,'7/20');
});
test('Leibniz expansion includes the moving upper endpoint and second derivative',()=>{
  const {program:p}=algebraIntegral();
  for(const eta of [.2,.5,.7]){
    close(evaluateSourceProgramDiagnostic(p,'v',{coordinates:{eta}}).value,eta**8/4+eta**5/2);
    close(evaluateSourceProgramDiagnostic(p,'first',{coordinates:{eta}}).value,2*eta**7+2.5*eta**4);
    close(evaluateSourceProgramDiagnostic(p,'second',{coordinates:{eta}}).value,14*eta**6+10*eta**3);
  }
});
test('nested integral differentiation preserves the distinct bound variables',()=>{
  const d=new ActualSourceExpressions(),e=d.var('eta'),s=d.fresh('s'),t=d.fresh('t'),inner=d.integral(d.mul(e,s),s,d.zero,t),v=d.integral(inner,t,d.zero,e),p=d.pack({v,first:d.derivative(v,e)});
  for(const eta of [.3,.8]){close(evaluateSourceProgramDiagnostic(p,'v',{coordinates:{eta}}).value,eta**4/6);close(evaluateSourceProgramDiagnostic(p,'first',{coordinates:{eta}}).value,2*eta**3/3);}
});
test('literal flat step, exact central pulse primitive, and their derivatives are executed',()=>{
  const d=new ActualSourceExpressions(),x=d.var('x'),s=d.step(x),p=d.pack({s,ds:d.derivative(s,x),dds:d.derivative(d.derivative(s,x),x)});
  close(evaluateSourceProgramDiagnostic(p,'s',{coordinates:{x:.5}}).value,.5,1e-14);
  close(evaluateSourceProgramDiagnostic(p,'ds',{coordinates:{x:.5}}).value,8,1e-14);
  close(evaluateSourceProgramDiagnostic(p,'dds',{coordinates:{x:.5}}).value,0,1e-14);
  for(const xi of [1/50,.5,1,5,10])close(evaluateSourceProgramDiagnostic(program,'R0',{coordinates:{xi}}).value,xi-.01);
});
test('source pulse diagnostic resolves the separate collars and converges to the pinned continuous Kb enclosure',()=>{
  const low=evaluateSourceProgramDiagnostic(program,'Kb',{quadratureCells:128,maxOperations:5000000}),high=evaluateSourceProgramDiagnostic(program,'Kb',{quadratureCells:512,maxOperations:10000000});
  const k=ACTUAL_OUTER_PULSE_RECEIPT.Kb,lo=Number(k.lowerNumerator)/2**88,hi=Number(k.upperNumerator)/2**88;
  assert.ok(high.value>=lo&&high.value<=hi);
  assert.ok(Math.abs(high.value-(lo+hi)/2)<Math.abs(low.value-(lo+hi)/2)+1e-10);
  assert.equal(high.intervalCertified,false);assert.equal(high.sameProfileCertificate,false);
});
test('the whole actual source scale cannot silently become a finite diagnostic field',()=>{
  assert.throws(()=>evaluateSourceProgramDiagnostic(program,'Xv'),e=>e.code==='EXACT_SOURCE_SCALE_NOT_REPRESENTABLE');
  assert.throws(()=>evaluateSourceProgramDiagnostic(program,'amplitude',{maxOperations:100000}),e=>['EXACT_SOURCE_SCALE_NOT_REPRESENTABLE','RESOURCE_LIMIT'].includes(e.code));
});
test('exact jet operator is regular at X=0 and retains eta derivatives of the radial average',()=>{
  const out=evaluateExactRegularOmegaJet({X:'0',eta:'0',h:'1/100',U:'1/10',Ueta:'4',average:'1/10',averageEta:'4',averageEtaEta:'0'});
  assert.equal(out.v,'-4');assert.equal(out.vEta,'51/500');assert.equal(out.Kminus2,'16');assert.equal(out.Kminus1,'0');
  assert.equal(out.sourceJetProvenanceVerified,false);assert.equal(out.sameProfileCertificate,false);
  const dropped=evaluateExactRegularOmegaJet({X:'0',eta:'0',h:'1/100',U:'1/10',Ueta:'4',average:'1/10',averageEta:'0',averageEtaEta:'0'});
  assert.notEqual(dropped.v,out.v);
});
test('actual pressure boundary at eta zero is exactly minus four and never omitted',()=>{
  const a=actualGlobalOmegaReduction({eta:0});assert.deepEqual(a.axisBoundary.valueInterval,[-4,-4]);assert.ok(a.functionals.P.reduced.endsWith('+V0_X(0,eta)'));
  const input={h:'1/100',eta:'0',Jminus1Eta:'0',Jzero:'0',JzeroEta:'0',Hminus1:'0',Hminus1Eta:'0',Hzero:'0',HzeroEta:'0',Kminus2:'0',Kminus1:'0',axisVX:'-4'},r=evaluateExactOmegaReducedMoments(input);
  assert.equal(r.P,'-4');assert.equal(r.globalPressureDebt,'4');assert.equal(r.F,'0');
  assert.notEqual(evaluateExactOmegaReducedMoments({...input,axisVX:'0'}).P,r.P);
});
test('source C12 remainder retains N, its actual local support, and only the justified eta value order',()=>{
  const r=actualModulationOmegaRemainder(),p=getPinnedSourceProfile().parametersExactExpressions;
  assert.deepEqual(r.NExact,p.radialFrequencyN);assert.deepEqual(r.RExact,p.C12EnvelopeR);
  assert.equal(r.sourceDifferences.globalXvBoundByRRequired,false);
  assert.deepEqual(r.uniformFinalBound.etaDerivativeOrders,[0]);
  assert.equal(r.scope.functionalEtaDerivativeFamilyCertified,false);
  assert.equal(r.scope.N5PhaseOrGrowthCertificate,false);
  assert.equal(r.uniformFinalBound.exactUpper,'1/'+String(1n<<260n));
});
test('actual amplitude rectangle is pinned to the continuous integral receipt',()=>{
  const url=new URL('../../../mathscope-m1/navier/followup-20261010-outer-reselection/actual-main-pulse-integral.json',import.meta.url),buf=fs.readFileSync(url),receipt=JSON.parse(buf);
  assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),ACTUAL_OUTER_PULSE_RECEIPT.sha256);
  assert.equal(receipt.uniformAmplitude.bracket.lowerNumerator,ACTUAL_OUTER_PULSE_RECEIPT.amplitude.lowerNumerator);
  assert.equal(receipt.uniformAmplitude.bracket.upperNumerator,ACTUAL_OUTER_PULSE_RECEIPT.amplitude.upperNumerator);
});
test('actual positive axial observations are source-bound at every selected full-domain eta',()=>{
  for(const eta of [-1,-.25,0,.25,1]){
    const r=actualOuterPulseObservations({eta,xi:[.02,.5,1,5,10]});
    assert.equal(r.scope.actualSameProfilePositiveAxialValuesEnclosed,true);
    for(const row of r.rows){assert.ok(row.actualUIsNonzero);assert.equal(row.XBinary64,null);assert.match(row.xiExact,/^\d+(\/\d+)?$/);for(const v of row.values){assert.ok(v.interval[0]<=v.value&&v.value<=v.interval[1]);assert.ok(v.interval.every(Number.isFinite));assert.match(v.sourceField,/^globalSource\.outerObservations\.rows\[/);}}
    assert.equal(r.scope.fullAxialPulseIntegralsEvaluated,false);
  }
});
test('the exact five-moment insufficiency counterexample is separate from the actual source',()=>{
  const c=fiveMomentsDoNotDetermineOmega();assert.match(c.scope,/not the actual N3 field/);assert.match(c.distinctFlux,/> 0/);assert.match(c.atEtaZero.Omega,/2\*U/);
});
test('construction rejects profile substitution, bad coordinates, and false completion input',()=>{
  assert.throws(()=>actualGlobalSourceConstruction({profileId:'fixture'}));
  assert.throws(()=>actualGlobalSourceConstruction({eta:1.01}));
  assert.throws(()=>actualGlobalSourceConstruction({xi:[11]}));
  assert.throws(()=>actualGlobalSourceConstruction({actualGlobalU0V0EverywhereEvaluated:true}));
  const out=actualGlobalSourceConstruction();assert.equal(out.status,'PARTIAL');assert.equal(out.scope.actualFullMomentDebtsClosed,false);assert.equal(out.scope.higherOrderInductionEnabled,false);assert.equal(out.scope.N4_04_Complete,false);assert.ok(out.remaining.every(x=>x.completed===false));
});
