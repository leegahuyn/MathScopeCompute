import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {prepareActualLoopProgram} from '../actual-continuation-exact-loop.mjs';
import {prepareActualGlobalLeadingProgram,actualI1ContractionProof,assertActualGlobalLeadingPrepared} from '../actual-continuation-exact-global.mjs';
import {attachActualFirstOrderInner,assertActualFirstOrderInnerPrepared} from '../actual-continuation-exact-inner.mjs';
import {attachActualFirstOrderExtension,prepareActualFirstOrderGlobalProgram,actualIposContinuousInverseProof,assertActualFirstOrderCompleted} from '../actual-continuation-exact-order-one.mjs';
import {verifyActualMomentLinearIdentities} from '../actual-continuation-exact-linear.mjs';
import {evaluateSourceProgramDiagnostic} from '../actual-global-source-expressions.mjs';

const leading=prepareActualGlobalLeadingProgram({etaDerivativeOrder:0,rootIterations:2});
const inner=attachActualFirstOrderInner(leading,{terms:1,bits:128,etaOrder:2});
const full=attachActualFirstOrderExtension(inner),{G,program:p,orderOne:r}=full;
const near=(a,b,tol=2e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const ev=(root,parameterOverrides={},program=p,coordinates={eta:0,X:1})=>evaluateSourceProgramDiagnostic(program,root,{parameterOverrides,coordinates,quadratureCells:128,maxOperations:10000000});
function reachable(program,start,includeDefinitions=false){
  const seen=new Set(),systems=new Set();
  function walk(id){if(seen.has(id))return;seen.add(id);const {op,args}=program.nodes[id];let children=[];
    if(['add','multiply','maximum'].includes(op))children=args;
    else if(['inverse','integer_power','exp','log_positive','sqrt_positive','source_step_derivative','sine','cosine','ceiling'].includes(op))children=[args[0]];
    else if(['definite_integral','smooth_piecewise'].includes(op))children=args;
    else if(op==='actual_natural_series')children=[args[1],args[2]];
    else if(op==='actual_quadratic_root'){
      children=[args[2]];const key='Q'+args[0];if(includeDefinitions&&!systems.has(key)){systems.add(key);const s=program.quadraticSystems[args[0]];children.push(...s.rhs,...s.linear.flat(),...s.quadraticDiagonal.flat(),s.scale);}
    }else if(op==='actual_monotone_root'){
      children=args.slice(1);const key='M'+args[0];if(includeDefinitions&&!systems.has(key)){systems.add(key);const s=program.monotoneSystems[args[0]];children.push(s.body,s.left,s.right,s.derivativeLower,s.derivativeUpper);}
    }else if(op==='actual_background_picard'||op==='actual_background_even_profile'){
      children=[args[2],args[3]];const key='P'+args[0];if(includeDefinitions&&!systems.has(key)){systems.add(key);const s=program.picardSystems[args[0]];children.push(...s.A0.flat(),...s.A1.flat(),...s.forcing);}
    }
    for(const x of children)walk(x);
  }walk(start);return [...seen].map(id=>({id,...program.nodes[id]}));
}

test('actual C12 function operations contain the original phase and both exact inverses',()=>{
  const l=leading.loop.program;
  assert.equal(l.monotoneSystems.length,2);
  assert.ok(l.operations.includes('sine')&&l.operations.includes('cosine'));
  for(const name of ['deltaE','deltaU']){
    const nodes=reachable(p,leading.loop[name],true);
    assert.ok(nodes.some(n=>n.op==='actual_monotone_root'));
    assert.ok(nodes.some(n=>n.op==='source_parameter'&&n.args[0]==='radialFrequencyN'));
    assert.ok(nodes.some(n=>n.op==='definite_integral'));
  }
});
test('monotone iteration is an executable convergent operation, not a finite-root equality',()=>{
  const H=new ActualConvergentExpressions(),a=H.core.eta,z=H.var('quadratic_monotone_z');
  const sys=H.defineMonotoneSystem({parameters:[a],variable:z,body:H.sub(H.pow(z,2),H.add(H.q(2),a)),left:H.one,right:H.q(2),derivativeLower:H.q(2),derivativeUpper:H.q(4)});
  const t0=H.monotoneIterate(sys,[a],0),t8=H.monotoneIterate(sys,[a],8),pp=H.pack({x:t8.value,e:t8.error,e0:t0.error});
  const value=ev('x',{},pp,{eta:0}).value,error=ev('e',{},pp,{eta:0}).value;
  assert.ok(Math.abs(value-Math.sqrt(2))<=error);assert.ok(error<ev('e0',{},pp,{eta:0}).value);assert.equal(t8.numericRootEvaluated,false);
  assert.throws(()=>H.monotoneIterate(sys,[a],-1));
});
test('the exact C2 rows retain lambda^-2 and actual full modulation debts',()=>{
  for(const debt of leading.normalizedDebts){const nodes=reachable(p,debt,true);assert.ok(nodes.some(n=>n.op==='actual_monotone_root'));assert.ok(nodes.some(n=>n.op==='actual_natural_series'));}
  assert.equal(leading.program.I1?.secondDebtRowLambdaMinusTwoRetained??p.quadraticSystems.at(-1).secondDebtRowLambdaMinusTwoRetained,true);
  const checks=actualI1ContractionProof();assert.ok(Object.values(checks.checks).every(Boolean));assert.match(checks.normConvention,/4r\^2/);assert.match(checks.normConvention,/8r/);
  assert.equal(checks.approximateMatrixInverseUsed,false);
});
test('the n=1 Picard operator uses actual forcing, the common collar and the nilpotent A1 mask',()=>{
  const s=p.picardSystems[0];assert.equal(s.order,1);assert.deepEqual(s.diagonal,[0,0,2,0,3,1]);
  for(let i=0;i<6;i++)for(let j=0;j<6;j++)if(i<4||j>=4)assert.equal(s.A1[i][j],G.zero);
  assert.equal(s.callerSuppliedForcing,false);assert.equal(s.leadingReferenceSubstitution,false);
  for(const index of [3,4,5])assert.ok(reachable(p,s.forcing[index],true).some(n=>n.op==='actual_natural_series'));
  assert.ok(s.tail.K!==s.tail.Kprecision,'The analytic large-term condition is retained in K.');
  assert.equal(s.tail.tailIsForTheCertifiedIndexNotForDisplayedTerms,true);
  assert.equal(p.inner.partial.finitePartialSumIsExactSolution,false);
});
test('Picard diagonal inversion and even-X derivatives preserve actual nonzero axis slopes',()=>{
  const H=new ActualConvergentExpressions(),xi=H.var('test_xi'),eta=H.core.eta,zero=H.zero;
  const A0=Array.from({length:6},()=>Array(6).fill(zero)),A1=A0.map(row=>[...row]);A0[0][4]=H.one;A0[1][5]=H.one;
  const sys=H.definePicardSystem({xi,eta,diagonal:[0,0,2,0,3,1],A0,A1,forcing:[zero,zero,zero,zero,H.q(8),H.q(12)],tail:{testFixture:true}});
  const partial=H.picardPartialSum(sys,2),Fx=H.picardEven(sys,0,zero,eta,1),Ux=H.picardEven(sys,1,zero,eta,1),pp=H.pack({F:partial.sum[0],U:partial.sum[1],Fx,Ux});
  near(ev('F',{},pp,{eta:0,test_xi:.3}).value,.09,1e-11);near(ev('U',{},pp,{eta:0,test_xi:.3}).value,.27,1e-11);
  near(ev('Fx',{},pp,{eta:0}).value,1,1e-11);near(ev('Ux',{},pp,{eta:0}).value,3,1e-11);
  assert.throws(()=>H.picardEven(sys,4,H.one));
});
test('all five actual n=1 total debts include the positive-order solution and the correct global Omega operands',()=>{
  assert.equal(p.momentRepair.globalOmegaPressure,leading.pressureOmega);assert.equal(p.momentRepair.globalOmegaFlux,leading.fluxOmega);
  for(const debt of r.moments){const nodes=reachable(p,debt,true);assert.ok(nodes.some(n=>n.op==='actual_background_even_profile'));assert.ok(nodes.some(n=>n.op==='definite_integral'));}
  for(const j of [2,4])assert.ok(reachable(p,r.moments[j],true).some(n=>n.op==='actual_monotone_root'));
  assert.equal(p.momentRepair.callerSuppliedDebtUsed,false);assert.equal(p.momentRepair.finitePicardIterateUsedAsInput,false);
});
test('Ipos continuous matrices are nonsingular with original positive lambda and physical scales',()=>{
  const lambda=.005,U=r.Umat.map(row=>row.map(v=>ev(v,{lambda}).value)),E=r.Emat.map(row=>row.map(v=>ev(v,{lambda}).value));
  const determinant=a=>a.length===1?a[0][0]:a[0].reduce((s,v,j)=>s+(j%2?-1:1)*v*determinant(a.slice(1).map(row=>row.filter((_,k)=>k!==j))),0);
  assert.ok(determinant(U)>1/32);assert.ok(Math.abs(determinant(E))>1/131072);
  assert.ok(Object.values(actualIposContinuousInverseProof().checks).every(Boolean));
  const identity=verifyActualMomentLinearIdentities();assert.equal(identity.matrixChecks.length,13);assert.equal(identity.physicalMomentChecks.length,5);assert.equal(identity.pass,true);
  for(let j=0;j<2;j++)assert.ok(U[1][j]>0&&U[1][j]<U[0][j]*Math.log(j===0?1.501:2.001));
});
test('global pressure primitive keeps the nonzero axis boundary and the actual Imean tail',()=>{
  const nodes=reachable(p,p.roots.actualOrderOneGlobalPressurePrefix,true);
  assert.ok(nodes.some(n=>n.op==='actual_monotone_root'));
  assert.ok(nodes.some(n=>n.op==='source_parameter'&&n.args[0]==='j0'));
  assert.equal(p.support.leadingAxialEndpoint,leading.constants.Xv);
  assert.equal(p.support.orderOneStress[1],r.Xb);assert.equal(p.support.laterOrderStress[1],r.Xplus);assert.notEqual(r.Xplus,r.Xb);
  assert.equal(p.support.directActualOrderOneStressGraphGenerated,false);
});
test('same-source induction gate rejects copied flags, changed functions and changed graph operands',()=>{
  assert.equal(assertActualFirstOrderCompleted(full).nextOrder,2);
  assert.throws(()=>assertActualFirstOrderCompleted({...full}),/before requesting order two/);
  assert.throws(()=>assertActualFirstOrderCompleted({program:{scope:{nextPositiveOrderAllowed:true}}}));
  assert.throws(()=>assertActualFirstOrderInnerPrepared({...inner}));assert.throws(()=>assertActualGlobalLeadingPrepared({...leading}));
  const old=G.nodes[0].args;G.nodes[0].args=['1','1'];try{assert.throws(()=>assertActualFirstOrderCompleted(full));}finally{G.nodes[0].args=old;}
  assert.equal(assertActualFirstOrderCompleted(full).actualContinuousFiveMomentIdentity,true);
});
test('public source input cannot supply an arbitrary leading field, moment receipt or completion flag',()=>{
  for(const key of ['moments','leading','actualOrderOneIposRepairComplete'])assert.throws(()=>prepareActualFirstOrderGlobalProgram({[key]:true}));
  assert.throws(()=>attachActualFirstOrderInner({...leading}));
  assert.equal(p.scope.originalN404Complete,false);assert.equal(p.scope.originalN405Complete,false);
  assert.equal(p.scope.actualGlobalTranscendentalValuesNumericallyEnclosed,false);assert.equal(p.scope.allOrdersConstructed,false);
});
