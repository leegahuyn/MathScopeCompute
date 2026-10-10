/** Actual n=2 Lemma5.2 five-moment completion and reconstruction.
 * The lower-order nonlinear terms use the finalized global n=1 tuple.
 * They are integrated over their whole support, including the Ipos repair.
 */
import {prepareActualSecondOrderInnerProgram,assertActualSecondOrderInner,buildActualOmegaCoefficientOverX} from './actual-continuation-exact-order-two-source.mjs';
import {verifyActualMomentLinearIdentities} from './actual-continuation-exact-linear.mjs';
import {assertActualFirstOrderCompleted} from './actual-continuation-exact-order-one.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const completedSecondOrders=new WeakMap();
export function attachActualSecondOrderExtension(prepared,context={}){
  assertActualSecondOrderInner(prepared);
  const {G,secondInner:s,orderOne:lower}=prepared,{X,eta}=prepared.constants,q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,{D,d,L}=G.core;
  const {Xminus,Xkeep,Xcut,Xplus,Xb,X0,IposRight,Rbase,ef,normalizedR,bump,supports,Umat,Emat,Uinverse,Einverse}=lower,lambda=prepared.constants.lambda,C=G.parameter('CSelected');
  const at=(v,x)=>G.substitute(v,X,x),integralSystems=new Map();
  const integrate=(body,left,right,prefix)=>{
    // The full actual body is retained once. Reusing it inside an outer
    // integral avoids copying the same completed lower coefficient at each
    // bound coordinate or mixed derivative; no integrand is replaced.
    let system=integralSystems.get(body);
    if(system===undefined){system=G.defineExpressionFunction({name:prefix+'_integrand',parameters:[X,eta],body,derivativeLimits:[4,6]});integralSystems.set(body,system);}
    const t=G.fresh(prefix);return G.integral(G.expressionValue(system,[t,eta]),t,left,right);
  };
  const cutoff=G.sub(o,G.step(G.div(G.sub(G.log(G.div(X,G.parameter('Xa'))),G.div(G.parameter('t1'),q(64))),G.div(G.parameter('t1'),q(64))))),Fr=s.F2at(X),Ur=s.U2at(X);
  const Ft=G.choose(X,Xkeep,Xcut,Fr,G.mul(cutoff,Fr),z),Ut=G.choose(X,Xkeep,Xcut,Ur,G.mul(cutoff,Ur),z),F0=prepared.inner.F0,U0=prepared.inner.U0;
  const localBodies=[Ut,G.mul(q(2),X,Ft),G.mul(q(2),F0,Ft),G.mul(q(2),X,G.add(G.mul(U0,Ft),G.mul(Ut,F0))),G.sub(G.mul(q(2),U0,Ut),G.mul(q(2),X,F0,Ft))];
  const localMoments=localBodies.map((body,j)=>integrate(body,z,Xcut,'actual_n2_local_m'+j));
  const globalOmega=buildActualOmegaCoefficientOverX(G,{order:1,X,eta,U:[prepared.finalU,lower.U1],v:[prepared.finalv,lower.v1]}),omegaOverX=G.choose(X,prepared.inner.aSquared,Xplus,s.localOmega.value,globalOmega.value,z);
  const pressureOmega=G.mul(q(1,2),integrate(omegaOverX,z,Xplus,'actual_global_Omega1_pressure')),fluxOmega=G.mul(q(1,2),integrate(G.mul(X,omegaOverX),z,Xplus,'actual_global_Omega1_flux'));
  const lowerBodies=[G.pow(lower.F1,2),G.mul(q(2),X,lower.U1,lower.F1),G.sub(G.pow(lower.U1,2),G.mul(X,G.pow(lower.F1,2)))],lowerMoments=lowerBodies.map((body,j)=>integrate(body,z,Xplus,'actual_n2_lower_m'+j));
  const actualMomentBodies=[localMoments[0],localMoments[1],G.add(localMoments[2],lowerMoments[0],G.neg(pressureOmega)),G.add(localMoments[3],lowerMoments[1]),G.add(localMoments[4],lowerMoments[2],fluxOmega)];
  const momentSystems=actualMomentBodies.map((body,j)=>G.defineExpressionFunction({name:'ActualOrderTwoTotalMoment'+j,parameters:[eta],body,derivativeLimits:[6]})),moments=momentSystems.map(system=>G.expressionValue(system,[eta]));
  const power=(v,exponent)=>G.exp(G.mul(exponent,G.log(v))),R1=power(Rbase,G.sub(o,G.mul(q(2),lambda))),Rp=power(Rbase,G.sub(q(-2),G.mul(q(2),lambda))),Rz=power(Rbase,G.mul(q(-2),lambda)),dot=(a,b)=>G.add(...a.map((v,j)=>G.mul(v,b[j])));
  const Urhs=[G.neg(G.div(moments[0],Rbase)),G.div(G.add(G.neg(G.div(moments[0],Rbase)),G.div(moments[3],G.mul(ef,R1))),G.mul(q(2),lambda))];
  const Erhs=[G.neg(G.div(moments[1],G.pow(Rbase,2))),G.neg(G.div(moments[2],G.mul(q(2),ef,Rp))),G.div(moments[4],G.mul(ef,Rz))],alpha=Uinverse.map(row=>dot(row,Urhs)),beta=Einverse.map(row=>dot(row,Erhs));
  const sqrt2X=G.sqrt(G.mul(q(2),X)),dU=G.choose(X,X0,IposRight,z,G.div(G.add(...alpha.map((v,j)=>G.mul(v,bump(normalizedR,j)))),Rbase),z),dF=G.choose(X,X0,IposRight,z,G.div(G.add(...beta.map((v,j)=>G.mul(v,bump(normalizedR,j+2)))),G.mul(Rbase,sqrt2X)),z);
  const U2=G.add(Ut,dU),F2=G.add(Ft,dF),phi2=G.mul(C,F2),E2=G.mul(sqrt2X,F2);
  const correctionMass=G.mul(Rbase,G.add(...alpha.map((v,j)=>{const t=G.fresh('actual_n2_mass_bump');return G.mul(v,G.choose(normalizedR,...supports[j],z,G.integral(G.mul(t,bump(t,j)),t,supports[j][0],normalizedR),Umat[0][j]));})));
  const localMassPartial=integrate(Ut,z,X,'actual_n2_local_mass'),localMass=G.choose(X,Xkeep,Xcut,localMassPartial,localMassPartial,localMoments[0]),unclosedM=G.add(localMass,correctionMass),lastU=G.mul(X0,G.pow(supports[1][1],2));
  const t=G.fresh('actual_n2_axis_average'),axisAverage=G.integral(s.U2at(G.mul(t,X)),t,z,o),M2=G.choose(X,Xkeep,lastU,G.mul(X,axisAverage),unclosedM,z),M2overX=G.choose(X,Xkeep,lastU,axisAverage,G.div(M2,X),z);
  const v2=G.div(G.sub(G.sub(G.mul(q(2),eta,U2),G.mul(q(2),eta,G.add(D,s.lambda2),M2overX)),G.mul(d,G.derivative(M2overX,eta))),L),V2=G.mul(X,v2);
  const localPressurePartial=integrate(localBodies[2],z,X,'actual_n2_local_pressure'),localPressure=G.choose(X,Xkeep,Xcut,localPressurePartial,localPressurePartial,localMoments[2]);
  const correctionPressure=G.mul(q(2),ef,Rp,G.add(...beta.map((v,j)=>{const t=G.fresh('actual_n2_pressure_bump'),weight=power(t,G.sub(q(-2),G.mul(q(2),lambda)));return G.mul(v,G.choose(normalizedR,...supports[j+2],z,G.integral(G.mul(weight,bump(t,j+2)),t,supports[j+2][0],normalizedR),Emat[1][j]));})));
  const lowerPressureBody=G.sub(lowerBodies[0],G.mul(q(1,2),omegaOverX)),lowerPressurePrefix=integrate(lowerPressureBody,z,X,'actual_n2_full_lower_pressure_prefix'),unclosedPi=G.add(localPressure,correctionPressure,lowerPressurePrefix),Pi2=G.choose(X,Xkeep,Xplus,G.picardEven(s.system,3,X,eta),unclosedPi,z);
  const F0pos=G.mul(ef,power(sqrt2X,G.sub(q(-2),G.mul(q(2),lambda)))),F0F2=G.add(G.choose(X,Xkeep,Xcut,G.mul(F0,Fr),G.mul(F0,Ft),z),G.choose(X,X0,IposRight,z,G.mul(F0pos,dF),z)),pressureDerivative=G.add(G.mul(q(2),F0F2),lowerPressureBody);
  const originalUrows=[Umat[0],Umat[0].map((v,j)=>G.sub(v,G.mul(q(2),lambda,Umat[1][j])))],correctionMoments=[G.mul(Rbase,dot(originalUrows[0],alpha)),G.mul(G.pow(Rbase,2),dot(Emat[0],beta)),G.mul(q(2),ef,Rp,dot(Emat[1],beta)),G.mul(ef,R1,dot(originalUrows[1],alpha)),G.neg(G.mul(ef,Rz,dot(Emat[2],beta)))],residuals=moments.map((v,j)=>G.add(v,correctionMoments[j]));
  const roots={...prepared.roots,actualOrderTwoF:F2,actualOrderTwoPhi:phi2,actualOrderTwoE:E2,actualOrderTwoU:U2,actualOrderTwoStream:M2,actualOrderTwoStreamOverX:M2overX,actualOrderTwoV:V2,actualOrderTwoVOverX:v2,actualOrderTwoPi:Pi2,actualOrderTwoPressureDerivative:pressureDerivative,
    actualOrderTwoGlobalOmegaOneOverX:omegaOverX,actualOrderTwoGlobalOmegaOnePressure:pressureOmega,actualOrderTwoGlobalOmegaOneFlux:fluxOmega};
  moments.forEach((v,j)=>{roots['actualOrderTwoIncomingMoment'+j]=v;roots['actualOrderTwoCorrectionMoment'+j]=correctionMoments[j];roots['actualOrderTwoMomentResidual'+j]=residuals[j];});
  alpha.forEach((v,j)=>roots['actualOrderTwoAlpha'+j]=v);beta.forEach((v,j)=>roots['actualOrderTwoBeta'+j]=v);
  const identity=verifyActualMomentLinearIdentities(),program=G.pack(roots,{construction:'Actual finalized n=2 coefficient from its actual inner source, all lower nonlinear global moments, and the same continuous Ipos inverse.',order:2,previousOrderGate:prepared.program.previousOrderGate,innerOrderTwo:prepared.program.innerOrderTwo,
    momentRepair:{inputMoments:moments,actualMomentBodies,momentSystems,localIntegrands:localBodies,localIntegrals:localMoments,knownLowerIntegrands:lowerBodies,knownLowerIntegrals:lowerMoments,globalOmegaPressure:pressureOmega,globalOmegaFlux:fluxOmega,globalOmegaOverX:omegaOverX,
      knownLowerOrder:1,finalizedGlobalLowerFieldsUsed:true,knownNonlinearMomentsRestrictedToCore:false,lowerViscosityShiftRetained:true,
      U:{matrix:Umat,inverse:Uinverse,rhs:Urhs,solution:alpha},E:{matrix:Emat,inverse:Einverse,rhs:Erhs,solution:beta},proof:lower.proof,correctionMoments,residualExpressions:residuals,universalLinearIdentity:identity,
      zeroIdentity:'Same two continuous matrices, actual n=2 incoming debts; A adj(A)=det(A) I and the physical row conversion cancel the five functions of eta exactly.',exactZeroValues:[0,0,0,0,0],finiteNumericalMomentsEvaluated:false,callerSuppliedDebtUsed:false},
    reconstruction:{F:F2,U:U2,M:M2,average:M2overX,V:V2,Pi:Pi2,pressureDerivative,axisDatum:[0,0,0],exactInnerRestrictionThrough:Xkeep,outerZeroUsesExactMoments:true},
    support:{...prepared.program.support,Xminus,Xkeep,Xcut,Xplus,Xb,order:2,stress:[Xminus,Xplus],leadingOrderOneStressEnd:Xb,allEndpointsIndependentOfEta:true,directActualOrderTwoStressGraphGenerated:false},
    scope:{...prepared.program.scope,actualOrderTwoFiveMomentsCorrected:true,actualOrderTwoGlobalProfilesCompiled:true,actualOrderTwoStressSupportChecked:false,nextPositiveOrderAllowed:true,allOrdersConstructed:false,originalN404Complete:false,originalN405Complete:false}});
  const result={...prepared,G,program,roots,preparedSecondInner:prepared,orderTwo:{F2,phi2,E2,U2,M2,M2overX,v2,V2,Pi2,pressureDerivative,F0F2,omegaOverX,globalOmega,pressureOmega,fluxOmega,lowerBodies,lowerMoments,moments,actualMomentBodies,momentSystems,localBodies,localMoments,alpha,beta,Urhs,Erhs,correctionMoments,residuals,identity,Xminus,Xkeep,Xcut,Xplus,Xb,X0,IposRight}};
  completedSecondOrders.set(result,{G,prefix:JSON.stringify(G.nodes),nodes:G.nodes.length,definitions:G.captureFunctionDefinitions(),data:JSON.stringify(result.orderTwo),prepared});return result;
}

export function assertActualSecondOrderCompleted(prepared){
  const r=completedSecondOrders.get(prepared);
  if(!r||prepared.G!==r.G||JSON.stringify(r.G.nodes.slice(0,r.nodes))!==r.prefix||!r.G.functionDefinitionsUnchanged(r.definitions)||JSON.stringify(prepared.orderTwo)!==r.data)fail('PREVIOUS_ORDER_INCOMPLETE','Complete the actual n=2 five moments before requesting any n=3 source. A copied or modified report does not authorize induction.');
  assertActualSecondOrderInner(r.prepared);return {order:2,nextOrder:3,profileId:prepared.program.profileId,parameterExpressionSHA256:prepared.program.parameterExpressionSHA256,authority:'PRIVATE_LIVE_MATHEMATICAL_CONSTRUCTION',actualContinuousFiveMomentIdentity:true,numericValuesClaimed:false};
}
export function prepareActualSecondOrderGlobalProgram(input={},context={}){return attachActualSecondOrderExtension(prepareActualSecondOrderInnerProgram(input,context),context);}
export function compileActualSecondOrderGlobalProgram(input={},context={}){return prepareActualSecondOrderGlobalProgram(input,context).program;}
