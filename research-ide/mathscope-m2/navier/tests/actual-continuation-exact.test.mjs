import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {compileActualNaturalCoreProgram,prepareActualNaturalCoreProgram} from '../actual-continuation-exact-core.mjs';
import {actualNaturalScaledTail,actualNaturalRefinementModulus,materializeActualNaturalSeries,ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {compileActualPregluingProgram} from '../actual-continuation-exact-pregluing.mjs';
import {compileActualB8Program,prepareActualB8Program,actualB8ContractionProof} from '../actual-continuation-exact-b8.mjs';
import {ACTUAL_B8_PRECONDITIONER} from '../actual-continuation-exact-b8-data.mjs';
import {evaluateSourceProgramDiagnostic} from '../actual-global-source-expressions.mjs';
import {readRational,qcompare,rational as q} from '../actual-continuation-arithmetic.mjs';

const core=compileActualNaturalCoreProgram({degree:4}),pre=compileActualPregluingProgram({etaDerivativeOrder:2}),b8=compileActualB8Program({etaDerivativeOrder:2,rootIterations:3});
const diagnostic={XR:2,T:Math.exp(1)+10,Md:1,BOuter:Math.log(200),lambda:.005,h:.0001,Pstar:3,logP:Math.log(3),Tf:64,co:.005,j0:.03,Lambda:48,sigmaStar:.2,CSelected:Math.exp(16)};
const ev=(program,root,eta=0)=>evaluateSourceProgramDiagnostic(program,root,{coordinates:{eta,Y:4},parameterOverrides:diagnostic,quadratureCells:128,maxOperations:10000000});
const near=(a,b,tol=2e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);

function reachable(program,start){const seen=new Set();function walk(id){if(seen.has(id))return;seen.add(id);const {op,args}=program.nodes[id];let child=[];if(['add','multiply'].includes(op))child=args;else if(['inverse','integer_power','exp','log_positive','sqrt_positive','source_step_derivative'].includes(op))child=[args[0]];else if(op==='definite_integral'||op==='smooth_piecewise')child=args;else if(op==='actual_natural_series')child=[args[1],args[2]];else if(op==='actual_quadratic_root')child=[args[2]];for(const x of child)walk(x);}walk(start);return [...seen].map(id=>({id,...program.nodes[id]}));}

test('actual core finite coefficients retain complete A21 pressure and positive g operands',()=>{
  assert.equal(core.coefficients.Phi.length,5);assert.equal(core.coefficients.u.length,5);
  assert.equal(core.pressureProgram.stages.length,12);assert.equal(core.pressureProgram.definition.fullExteriorTailIncluded,true);
  assert.equal(core.pressureProgram.definition.pressureApproximationUsed,false);
  assert.equal(core.scope.actualPositiveGDefinitionFullyExpanded,true);
  assert.equal(core.recurrence.higherEtaDerivativeTruncated,false);
  assert.ok(core.nodes.every(n=>!['new_A21_pressure','new_positive_normalized_amplitude_squared','eta_derivative'].includes(n.op)));
  assert.ok(reachable(core,core.coefficients.u[2]).some(n=>n.op==='definite_integral'));
  assert.equal(core.scope.wholeNaturalFunctionNumericallyEvaluated,false);
});
test('axis first coefficients independently match the source equations including j0 and Lambda',()=>{
  const phi1=ev(core,core.coefficients.Phi[1]),u1=ev(core,core.coefficients.u[1]);
  const h=diagnostic.h,j=diagnostic.j0,s=diagnostic.sigmaStar,Lambda=diagnostic.Lambda;
  near(phi1.value,(-j*j/(j*j+s*s)+(-3+h)/Lambda)/4);
  near(u1.value,j*(4.5+h)/2);
  assert.ok(Math.abs(phi1.value+j*j/(j*j+s*s)/4)>1e-3,'Dropping the nonlinear source must fail.');
  assert.ok(u1.value>0,'The actual positive j0 axis datum must not be replaced by zero.');
  assert.equal(phi1.sameProfileCertificate,false);assert.equal(u1.intervalCertified,false);
});
test('actual analytic tails shrink without a fixed Bessel or pressure error floor',()=>{
  for(const m of [0,1,2,4])for(const k of [0,1,2]){
    const a=actualNaturalScaledTail({degree:8,etaOrder:m,radialOrder:k,Y:'4'}),b=actualNaturalScaledTail({degree:16,etaOrder:m,radialOrder:k,Y:'4'});
    assert.ok(qcompare(readRational(a.scaledTailUpper),readRational(b.scaledTailUpper))>0);
    assert.equal(b.scale,'Q*rho^(-etaOrder)');assert.equal(b.fixedPositiveApproximationFloor,false);
  }
  const zero=actualNaturalScaledTail({degree:4,Y:'0',radialOrder:2});assert.equal(zero.scaledTailUpper,'0');
  assert.throws(()=>actualNaturalScaledTail({degree:0,radialOrder:1}));
  assert.throws(()=>actualNaturalScaledTail({degree:2,etaOrder:12,Y:'5'}),/Increase/);
});
test('source convergence modulus retains the actual astronomical degree and one fixed function',()=>{
  const r=actualNaturalRefinementModulus({etaOrder:4,radialOrder:4,bits:192});
  assert.equal(r.retainedDegreeFormula,'ceil(655360*T)+192');
  assert.equal(r.sameFunctionForEveryRefinement,true);assert.equal(r.observationPointChangesWithPrecision,false);
  assert.equal(r.costs.degreeMaterialized,false);assert.equal(r.costs.finiteCoefficientEvaluationErrorsStillNeedTheirOwnBudget,true);
  assert.ok(r.proof.firstPolynomialBoundAt65&&r.proof.polynomialRatioAfter65&&r.proof.qConstantProof&&r.proof.exponentSlackProof);
  assert.equal(r.actualGlobalMomentValuesAvailable,false);
});
test('natural functional derivatives invoke generated derivative coefficients rather than zero padding',()=>{
  const G=new ActualConvergentExpressions(),Y=G.var('Y'),e=G.core.eta,root=G.natural('u',G.mul(Y,G.exp(e)),e),first=G.derivative(root,e),second=G.derivative(first,e);
  const nodes=reachable(G.pack({second}),second).filter(n=>n.op==='actual_natural_series');
  assert.ok(nodes.some(n=>n.args[3]===2));assert.ok(nodes.some(n=>n.args[4]===2));
  const partial=materializeActualNaturalSeries({degree:4,radialOrder:1,etaOrder:2,Y:'4'});
  assert.ok(Number.isInteger(partial.roots.actualUniformError));assert.ok(partial.nodes[partial.roots.actualPartial]);
  assert.equal(partial.approximation.finiteNumericAccuracyClaimed,false);
});
test('fixed-endpoint derivative does not evaluate a removable inactive endpoint',()=>{
  const G=new ActualConvergentExpressions(),t=G.var('test_x'),e=G.core.eta;
  const body=G.choose(t,G.zero,G.one,e,G.div(e,t),G.div(e,t)),whole=G.integral(body,t,G.zero,G.one);
  assert.doesNotThrow(()=>G.derivative(whole,e));
  const varying=G.integral(G.mul(e,t),t,G.zero,e),d=G.derivative(varying,e),p=G.pack({d});
  near(ev(p,'d',.25).value,3*.25**2/2,1e-12);
});
test('actual B22/B26/B34 debts include all five moment histories and ordinary eta derivatives',()=>{
  assert.equal(pre.actualIncomingDebt.everyMomentHistoryIncluded,true);assert.equal(pre.actualIncomingDebt.callerSuppliedDebt,false);assert.equal(pre.actualIncomingDebt.intervalMidpointUsed,false);
  assert.equal(pre.reference.cutoffPositiveWidthRetained,true);assert.equal(pre.reference.naturalExtensionAboveFourIsReferenceInputOnly,true);
  for(let j=0;j<5;j++){
    const nodes=reachable(pre,pre.roots['B8scaledDebt'+j]);
    assert.ok(nodes.some(n=>n.op==='actual_natural_series'));
    assert.ok(nodes.some(n=>n.op==='definite_integral'));
    assert.ok(pre.nodes[pre.roots['B8scaledDebt'+j+'_eta2']]);
  }
  assert.equal(pre.scope.actualB8RootsSolved,false);assert.equal(pre.scope.originalN404Complete,false);
});
test('B8 exact rational preconditioner is pinned and is never promoted to the continuous inverse',()=>{
  const path=new URL('../../../'+ACTUAL_B8_PRECONDITIONER.sourcePath,import.meta.url),bytes=fs.readFileSync(path);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),ACTUAL_B8_PRECONDITIONER.sourceSHA256);
  assert.equal(ACTUAL_B8_PRECONDITIONER.isExactInverseOfContinuousMatrix,false);
  assert.ok(Object.values(actualB8ContractionProof().checks).every(Boolean));
  const s=b8.quadraticSystems[0];assert.equal(s.continuousMatrixReplacedByPreconditioner,false);
  assert.ok(reachable(b8,s.linear[4][4]).some(n=>n.op==='definite_integral'));
});
test('B8 iteration is actual debt dependent, converges to the same root, and retains a positive finite-iterate tail',()=>{
  for(let j=0;j<5;j++){
    const nodes=reachable(b8,b8.roots['B8iterate'+j]);
    assert.ok(nodes.some(n=>n.op==='actual_natural_series'));
    assert.ok(!nodes.some(n=>n.op==='actual_quadratic_root'));
  }
  const proof=b8.B8.proof;assert.equal(proof.convenientLipschitzUpper,'1/4');assert.equal(proof.sameRootForEveryRefinement,true);
  assert.equal(b8.B8.cancellation.finiteIterateDeclaredExactRoot,false);
  const d=ev(b8,'B8rootTail');near(d.value,1e-6/64,1e-16);assert.ok(d.value>0);
});
test('implicit B8 derivatives include the actual continuous Jacobian and higher eta source terms',()=>{
  const nodes=reachable(b8,b8.roots.B8root4_eta2);
  assert.ok(nodes.some(n=>n.op==='actual_quadratic_root'));
  assert.ok(nodes.some(n=>n.op==='actual_natural_series'&&n.args[4]>=2));
  assert.ok(nodes.some(n=>n.op==='inverse'));
  assert.equal(b8.globalAxialScope.positiveAxisDatumJ0Retained,true);
  assert.equal(b8.globalAxialScope.finalC12Field,false);assert.equal(b8.scope.actualN1MomentRepairComplete,false);
});
test('generic quadratic kernel refuses eta-dependent coefficients whose derivative would be missing',()=>{
  const G=new ActualConvergentExpressions();assert.throws(()=>G.defineQuadraticSystem({linear:[[G.core.eta]],quadraticDiagonal:[[G.zero]],rhs:[G.one],scale:G.one}),/eta-independent/);
});
test('forged completion flags, changed profile, budgets and cancellation are rejected',()=>{
  assert.throws(()=>compileActualB8Program({sourceProfile:'different'}));assert.throws(()=>compileActualB8Program({actualN1MomentRepairComplete:true}));assert.throws(()=>compileActualB8Program({etaDerivativeOrder:3}));assert.throws(()=>compileActualB8Program({rootIterations:-1}));
  assert.throws(()=>compileActualNaturalCoreProgram({degree:2},{checkCancelled(){throw Error('cancelled');}}),/cancelled/);
  assert.equal(b8.scope.actualFinalOmegaMomentsAvailable,false);assert.equal(b8.scope.originalN404Complete,false);assert.doesNotThrow(()=>JSON.stringify(b8));
});
