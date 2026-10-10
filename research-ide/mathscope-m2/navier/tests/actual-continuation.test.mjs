import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {directedArithmetic,rational as q,qcompare,readRational,qsub,qtext} from '../actual-continuation-arithmetic.mjs';
import {evaluateActualCoreMoments,integrateIntervalPolynomial} from '../actual-continuation-moments.mjs';
import {evaluateActualB22Reference,actualB22CollarBudget,integrateReferenceRegular} from '../actual-continuation-reference.mjs';
import {compileActualA2AxialProgram} from '../actual-continuation-a2-program.mjs';
import {actualContinuationOmegaComparison,evaluateActualAxialContinuationCell,ACTUAL_CONTINUATION_COMPARISON_SOURCES} from '../actual-continuation-comparison.mjs';
import {evaluateSourceProgramDiagnostic} from '../actual-global-source-expressions.mjs';
import {getPinnedSourceProfile} from '../source-profile.mjs';
import {actualContinuationConstruction} from '../actual-continuation-construction.mjs';

const core=evaluateActualCoreMoments(),reference=evaluateActualB22Reference({XInterval:['1','100']}),program=compileActualA2AxialProgram(),comparison=actualContinuationOmegaComparison();
const contains=(box,x)=>qcompare(readRational(box.lower),readRational(x))<=0&&qcompare(readRational(box.upper),readRational(x))>=0;
const width=box=>qsub(readRational(box.upper),readRational(box.lower));
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} is not close to ${b}`);

test('whole nonlinear core integrals are source-bound, with both distinct errors retained',()=>{
  assert.equal(core.rows.length,21);assert.equal(core.normalizedMomentRows.length,3);
  assert.equal(core.method.wholeRadialCellEnclosed,true);assert.equal(core.method.pointSamplingUsedAsIntegralProof,false);
  assert.equal(core.errors.uniformProductErrorIncludesBothCrossTermsAndErrorProduct,true);
  for(const row of core.rows){assert.ok(row.positiveNonlinearErrorRetained);assert.ok(qcompare(readRational(row.analyticIntegralErrorUpper),q(0))>0);assert.ok(qcompare(width(row.actualInterval),q(0))>0);}
  assert.equal(core.restoration.gNumericallyEvaluated,false);assert.equal(core.restoration.physicalMomentEtaDerivativesAlreadyAssembled,false);
  assert.equal(core.scope.fullGlobalOmegaMomentsClosed,false);
});
test('radial scaling before squaring prevents coefficient-roundoff amplification',()=>{
  for(const key of ['phiSquared','yPhiSquared','yUOverKPhi']){
    const row=core.rows.find(r=>r.id===key&&r.etaDerivativeOrder===0);
    assert.ok(qcompare(width(row.actualInterval),q(1,1n<<140n))<0,key);
  }
});
test('zero integration interval is exactly zero, whereas Y>4 is natural input only',()=>{
  const zero=evaluateActualCoreMoments({Y:'0'}),extended=evaluateActualCoreMoments({Y:'41/10',etaOrder:0});
  for(const row of zero.rows){assert.equal(row.actualInterval.lower,'0');assert.equal(row.actualInterval.upper,'0');assert.equal(row.positiveNonlinearErrorRetained,false);}
  assert.equal(extended.sourceCell.actualUnmodifiedCore,false);assert.equal(extended.sourceCell.naturalInputOnlyAboveFour,true);assert.equal(extended.sourceCell.actualB26CollarIntegrated,false);
});
test('source interval operations reject fake profile, bad eta, extra certificates and cancelled work',()=>{
  assert.throws(()=>evaluateActualCoreMoments({sourceProfile:'fixture'}));
  assert.throws(()=>evaluateActualCoreMoments({eta:{kind:'DIRECT_RATIONAL',value:'1001/1000'}}));
  assert.throws(()=>evaluateActualCoreMoments({sameProfileCertificate:true}));
  let checks=0;assert.throws(()=>evaluateActualCoreMoments({}, {checkCancelled(){if(++checks>3)throw Error('cancelled');}}),/cancelled/);
  assert.throws(()=>evaluateActualB22Reference({X:'1',XInterval:['1','2']}));
  assert.throws(()=>evaluateActualB22Reference({X:'0'}));
  assert.throws(()=>actualContinuationOmegaComparison({delta:'0'}));
});
test('B22 retains the actual positive width and computes a reference rather than relabeling B26',()=>{
  const budget=actualB22CollarBudget();assert.ok(budget.arithmeticChecks.factorial40BelowTwo260);assert.ok(budget.arithmeticChecks.strictlyBelowRequestedError);
  assert.equal(budget.widthReplacedByZero,false);assert.equal(budget.positiveWidthRetained,true);
  assert.ok(qcompare(readRational(reference.referenceEndpoint.Yc.upper),q(4))>0);
  assert.ok(contains(reference.referenceEndpoint.Yc,'4'));
  assert.equal(reference.scope.actualB22ReferenceAndMomentsEnclosed,true);
  assert.equal(reference.scope.actualB26ShearReductionIntegrated,false);assert.equal(reference.scope.referenceIntegralIsGlobalActualOmegaDebt,false);
  assert.equal(reference.regularIntegrals.momentPrimitiveOffsetRetained,true);assert.equal(Object.keys(reference.regularIntegrals.values).length,10);
});
test('ordinary source eta derivatives remain distinct from j-normalized coefficient derivatives',()=>{
  const normalized=reference.values.U[1].interval,ordinary=reference.ordinaryEtaValues[1].U;
  assert.ok(contains(ordinary,'4'));assert.ok(!contains(normalized,'4'));assert.ok(qcompare(width(normalized),q(1,1000))<0);
  const a=reference.regularValues;assert.ok(contains(a.v,'-7/2'));assert.ok(contains(a.vEta,'4'));
});
test('nonzero primitive-offset algorithm retains every logarithmic and eta product term',()=>{
  const A=directedArithmetic(192),r=integrateReferenceRegular(A,{left:q(1),right:q(4),U:A.point(11),Ueta:A.point(13),a:A.point(2),b:A.point(3),ae:A.point(5),be:A.point(7)}),v=r.values;
  const mid=x=>(x.displayEnclosure[0]+x.displayEnclosure[1])/2,l=Math.log(4);
  close(mid(v.Jminus1),6+3*l);close(mid(v.Jzero),24);close(mid(v.Jminus1Eta),15+7*l);
  close(mid(v.Hminus1Eta),13*(6+3*l)+11*(15+7*l));close(mid(v.Kminus2),12+12*l+27/4);close(mid(v.Kminus1),30+36+9*l);
  assert.ok(Math.abs(mid(v.Jminus1)-6)>4,'Dropping the source primitive b/X must fail.');
  assert.ok(Math.abs(mid(v.Hminus1Eta)-11*(15+7*l))>100,'Dropping U_eta in the moment derivative must fail.');
});
test('actual B8 root bound is applied with exact M matching and all comparison coefficients pass',()=>{
  assert.equal(comparison.arithmeticChecks.length,10);assert.ok(comparison.arithmeticChecks.every(r=>r.verified));
  assert.equal(comparison.supportAndMass.primitiveDifferenceExactlyZeroAfterPatch,true);assert.match(comparison.supportAndMass.primitiveVanishingReason,/Equal U alone would not/);
  assert.equal(comparison.regularQuantities.axisBoundary.omitted,false);assert.equal(comparison.regularQuantities.axisBoundary.difference,'2A eta*j0/L');
  assert.equal(comparison.actualInnerBound.actualRootCoefficients.rootValuesNumericallySolved,false);
  assert.equal(comparison.scope.fullGlobalOmegaMomentValuesAvailable,false);assert.equal(comparison.scope.etaDerivativeFamilyOfMomentRemainderCertified,false);
});
test('actual whole inner axial cells retain C12/primitive error and finite directed geometry',()=>{
  for(const eta of ['-1','0','1/4','1']){
    const out=evaluateActualAxialContinuationCell({eta,XInterval:['0','110']});
    assert.equal(out.rows.length,10);assert.equal(out.error.includesActualC12AndI1Repair,true);assert.equal(out.scope.actualUEquals4Eta,false);assert.equal(out.scope.radialDerivativesEnclosed,false);
    for(const row of out.rows){assert.ok(qcompare(width(row.actualInterval),q(0))>=0);assert.ok(row.actualInterval.displayEnclosure.every(Number.isFinite));}
    if(eta==='0')assert.ok(contains(out.rows.find(x=>x.id==='VOverX'&&x.etaDerivativeOrder===0).actualInterval,'-4'));
  }
  assert.throws(()=>evaluateActualAxialContinuationCell({eta:'2'}));assert.throws(()=>evaluateActualAxialContinuationCell({XInterval:['2','1']}));
  assert.throws(()=>evaluateActualAxialContinuationCell({N5ShearOrPhaseCertificate:true}));
});
test('literal A2 graph closes every axial stage without field/root oracle leaves',()=>{
  assert.deepEqual(program.parametersExactExpressions,getPinnedSourceProfile().parametersExactExpressions);
  assert.ok(program.nodes.length>4000&&program.nodes.length<20000);
  for(const node of program.nodes)assert.ok(!/oracle|unknown|source_field|placeholder/.test(node.op),node.op);
  assert.equal(program.scope.completeLiteralA2AxialDefinitionCompiled,true);assert.equal(program.scope.actualNonlinearSourceReplacedByA2,false);assert.equal(program.scope.wholeA2WeightedIntegralsNumericallyEnclosed,false);
  assert.equal(program.integration.axisBoundaryRetained,true);assert.equal(program.integration.etaDerivativeOrderForValues,2);
  for(const root of ['A2U','A2M','A2V','A2vEta','A2MEtaEta','A2POverXR','A2FOverXR2'])assert.ok(Number.isInteger(program.roots[root]));
});
const overrides={XR:2,T:Math.exp(1.2)+10,Md:1.2,BOuter:.1,lambda:.2,h:.01,Pstar:3,logP:Math.log(3),Tf:1,co:.01};
const diagnose=(root,X,eta=.25)=>evaluateSourceProgramDiagnostic(program,root,{coordinates:{X,eta},parameterOverrides:overrides,quadratureCells:128,maxOperations:10000000});
test('A2 axis branch is regular and finite diagnostics never become source certificates',()=>{
  close(diagnose('A2M',0).value,0);close(diagnose('A2U',0).value,1);close(diagnose('A2UEta',0).value,4);
  for(const eta of [-.5,0,.25,.8]){
    const x=diagnose('A2v',0,eta),expected=((8+8*.01)*eta*eta-4)/(1-2*.01*eta*eta);
    close(x.value,expected);assert.equal(x.sameProfileCertificate,false);assert.equal(x.intervalCertified,false);
  }
});
test('A2 cumulative mass derivative matches its actual decay formula; mean and final branches persist',()=>{
  const eXR=2*Math.E;
  for(const s of [.3,.7,1.5]){
    const X=eXR*Math.exp(s),eps=1e-5*X,numerical=(diagnose('A2M',X+eps).value-diagnose('A2M',X-eps).value)/(2*eps);
    close(numerical,diagnose('A2U',X).value,2e-6);close(diagnose('A2MEtaEta',X).value,0);
  }
  const Xp=2*Math.exp(overrides.T+2+60*overrides.BOuter),X=Xp/2;
  close(diagnose('A2U',X).value,0);const c=diagnose('mConst',X).value;
  close(diagnose('A2V',X).value,-c,2e-8);
  const Xv=Xp*Math.exp(13/overrides.lambda);close(diagnose('A2U',2*Xv).value,0);close(diagnose('A2M',2*Xv).value,0);close(diagnose('A2V',2*Xv).value,0);
});
test('complete actual scales fail explicitly in binary64 instead of silently using the comparator',()=>{
  assert.throws(()=>evaluateSourceProgramDiagnostic(program,'A2POverXR',{coordinates:{eta:.25},maxOperations:100000}),e=>['EXACT_SOURCE_SCALE_NOT_REPRESENTABLE','RESOURCE_LIMIT'].includes(e.code));
  assert.equal(comparison.weightedRemainder.centersNumericallyEvaluated,false);assert.ok(readRational(comparison.weightedRemainder.final.POverXR)[0]>0n);
});
test('the imported actual debt, continuation and derivative proofs are pinned to their exact files',()=>{
  const root=new URL('../../../../',import.meta.url);
  for(const item of Object.values(ACTUAL_CONTINUATION_COMPARISON_SOURCES)){
    const bytes=fs.readFileSync(new URL(item.path,root));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256,item.path);
  }
});
test('public construction exposes executed cells and blocks exact debt cancellation from a remainder midpoint',()=>{
  const out=actualContinuationConstruction();assert.equal(out.computed.actualCoreIntegralIntervals,21);assert.equal(out.computed.referenceRegularIntegralIntervals,10);assert.equal(out.computed.actualAxialCellIntervals,10);
  assert.equal(out.nextOrderGate.allowed,false);assert.equal(out.nextOrderGate.midpointOrA2SubstitutionAllowed,false);assert.equal(out.scope.actualN1MomentRepairConstructed,false);
  assert.ok(out.remaining.every(r=>r.completed===false));assert.doesNotThrow(()=>JSON.stringify(out));
  assert.throws(()=>actualContinuationConstruction({exactActualRemainder:'0'}));
  assert.throws(()=>actualContinuationConstruction({nextOrderSourceAllowed:true}));
});
