/** The actual n=2 stress: both components end at the common Xplus.
 * Unlike n=1, its lower axial viscosity acts on the compact positive-order
 * coefficient. No exterior leading heat moment is silently substituted.
 */
import {prepareActualSecondOrderGlobalProgram,assertActualSecondOrderCompleted} from './actual-continuation-exact-order-two.mjs';
import {attachActualHeatLeading} from './actual-continuation-exact-heat.mjs';
import {sourceScaledOperators} from './actual-continuation-exact-order-two-source.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';
import {actualSupportOrderProof,checkActualExteriorZeros} from './actual-continuation-exact-support.mjs';

export function attachActualSecondOrderStress(completed,{heatIterations=0}={},context={}){
  const gate=assertActualSecondOrderCompleted(completed),heat=attachActualHeatLeading(completed.originalLeading,{iterations:heatIterations},context),{G,orderOne:r1,orderTwo:r2}=completed,{X,eta}=completed.constants,q=(n,d=1)=>G.q(n,d),z=G.zero,{A,d,L}=G.core,h=G.parameter('h'),{Z,T}=sourceScaledOperators(G,X,eta);
  const F=[heat.heat.finalF,r1.F1,r2.F2],U=[completed.finalU,r1.U1,r2.U2],v=[completed.finalv,r1.v1,r2.v2],nu=[z,G.mul(q(2),h),G.mul(q(4),h)],b=G.neg(G.add(A,q(1,2))),c=G.neg(A),Fx=F.map(f=>G.derivative(f,X)),Ux=U.map(f=>G.derivative(f,X));
  const angularTerms=[T(G.add(b,nu[2]),F[2])],axialTerms=[T(G.add(c,nu[2]),U[2])];
  for(let i=0;i<=2;i++){context.checkCancelled?.();const j=2-i;
    angularTerms.push(G.mul(v[i],G.add(G.mul(X,Fx[j]),F[j])),G.mul(U[i],Z(G.add(b,nu[j]),F[j])));
    axialTerms.push(G.mul(X,v[i],Ux[j]),G.mul(U[i],Z(G.add(c,nu[j]),U[j])));
  }
  const angularViscosity=Z(G.sub(G.add(b,nu[1]),G.core.D),Z(G.add(b,nu[1]),F[1])),axialViscosity=Z(G.sub(G.add(c,nu[1]),G.core.D),Z(G.add(c,nu[1]),U[1]));
  angularTerms.push(G.mul(q(-2),G.add(G.mul(X,G.derivative(Fx[2],X)),G.mul(q(2),Fx[2]))),G.neg(angularViscosity));
  // Pi_X is its exact reconstructed integrand. The Pi graph itself remains
  // available for the independent derivative/axis checks.
  const pressureSystem=G.defineExpressionFunction({name:'ActualOrderTwoPressure',parameters:[X,eta],body:r2.Pi2,derivativeLimits:[3,6]}),pressureEta=G.expressionValue(pressureSystem,[X,eta],[0,1]);
  const pressureZ=G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(G.add(G.mul(q(-2),A),nu[2]),r2.Pi2),G.mul(X,r2.pressureDerivative))),G.mul(d,pressureEta)),L);
  axialTerms.push(pressureZ,G.mul(q(-2),G.add(G.mul(X,G.derivative(Ux[2],X)),Ux[2])),G.neg(axialViscosity));
  const angular=G.add(...angularTerms),axial=G.add(...axialTerms),{Xminus,Xplus,Xb}=r2,angularSupported=G.choose(X,Xminus,Xplus,z,angular,z),axialSupported=G.choose(X,Xminus,Xplus,z,axial,z);
  const integralFunctions=new Map();
  const integrate=(body,left,right,prefix)=>{const t=G.fresh(prefix);let system=integralFunctions.get(body);if(system===undefined){system=G.defineExpressionFunction({name:prefix+'_integrand',parameters:[X,eta],body,derivativeLimits:[4,6]});integralFunctions.set(body,system);}return G.integral(G.expressionValue(system,[t,eta]),t,left,right);},thetaBody=G.mul(q(2),X,angularSupported);
  const thetaForward=G.neg(G.div(integrate(thetaBody,Xminus,X,'actual_n2_Ttheta_forward'),G.mul(q(2),X))),zForward=G.neg(G.div(integrate(axialSupported,Xminus,X,'actual_n2_Tz_forward'),G.sqrt(G.mul(q(2),X))));
  const thetaBackward=G.div(integrate(thetaBody,X,Xplus,'actual_n2_Ttheta_backward'),G.mul(q(2),X)),zBackward=G.div(integrate(axialSupported,X,Xplus,'actual_n2_Tz_backward'),G.sqrt(G.mul(q(2),X))),Ttheta=G.choose(X,Xminus,Xplus,z,thetaForward,z),Tz=G.choose(X,Xminus,Xplus,z,zForward,z);
  const totalAngular=integrate(thetaBody,Xminus,Xplus,'actual_n2_total_R2_residual'),totalAxial=integrate(axialSupported,Xminus,Xplus,'actual_n2_total_R_residual');
  const supportOrder=actualSupportOrderProof(completed.completedOrderOne),exteriorAngular=checkActualExteriorZeros(G,angularTerms,supportOrder),exteriorAxial=checkActualExteriorZeros(G,axialTerms,supportOrder);
  const sourceAssertions={sameProfile:heat.program.profileId===gate.profileId&&heat.program.parameterExpressionSHA256===gate.parameterExpressionSHA256,
    actualFirstOrderFiveMomentIdentity:completed.completedOrderOne.program.momentRepair.universalLinearIdentity.pass,
    actualSecondOrderFiveMomentIdentity:completed.program.momentRepair.universalLinearIdentity.pass,
    actualSecondOrderInnerSourceAndTail:completed.program.scope.actualOrderTwoSourceMajorantDerived&&completed.program.innerOrderTwo.actualLowerRestriction,
    actualLowerAxialViscosityOrderOne:F[1]===r1.F1&&U[1]===r1.U1&&nu[1]===completed.inner.lambda1&&nu[2]===completed.secondInner.lambda2,
    positiveOrderPressureReconstructedFromWholeSupport:completed.program.momentRepair.knownNonlinearMomentsRestrictedToCore===false,
    actualSourceEndpointOrdering:supportOrder.pass,actualAngularZeroExterior:exteriorAngular.pass,actualAxialZeroExterior:exteriorAxial.pass};
  // Boundary values of intermediate nested patches may retain an unevaluated
  // branch when exact source ordering is not an algebraic node equality.
  // The explicit zero-support constructor of each positive field is checked
  // below without inventing a comparison of its enormous coordinates.
  const supportDefinitions={F1:[r1.Xcut,r1.X0,r1.IposRight],U1:[r1.Xcut,r1.X0,r1.IposRight],F2:[r2.Xcut,r2.X0,r2.IposRight],U2:[r2.Xcut,r2.X0,r2.IposRight],v2LastAxialBump:supportOrder.endpoints.lastU,Pi2End:Xplus,
    sourceOrdering:'Xcut<a^2<IposRight<ImeanLeft<Xv<Xplus; all derivative jets vanish on the exterior of the listed closed supports.'};
  if(!Object.values(sourceAssertions).every(Boolean))fail('INTERNAL_VALIDATION','The actual n=2 stress support premises failed.');
  const roots={...completed.roots,...heat.roots,actualOrderTwoAngularResidualDividedByR:angular,actualOrderTwoAxialResidual:axial,actualOrderTwoAngularLowerViscosity:angularViscosity,actualOrderTwoAxialLowerViscosity:axialViscosity,
    actualOrderTwoTtheta:Ttheta,actualOrderTwoTz:Tz,actualOrderTwoTthetaForward:thetaForward,actualOrderTwoTzForward:zForward,actualOrderTwoTthetaBackward:thetaBackward,actualOrderTwoTzBackward:zBackward,actualOrderTwoTotalR2Residual:totalAngular,actualOrderTwoTotalRResidual:totalAxial};
  const program=G.pack(roots,{construction:'Actual n=2 tangential stress from its reconstructed coefficient and full finalized lower tuple, with the common compact support required for n>=2.',order:2,previousOrderGate:completed.program.previousOrderGate,innerOrderTwo:completed.program.innerOrderTwo,momentRepair:completed.program.momentRepair,
    orderTwoStress:{rawAngularDividedByR:angular,rawAxial:axial,angularTerms,axialTerms,angularSupported,axialSupported,Ttheta,Tz,forward:[thetaForward,zForward],backward:[thetaBackward,zBackward],totalResidualIntegrals:[totalAngular,totalAxial],sourceAssertions,supportDefinitions,
      supportOrder,exteriorZeroChecks:{angular:exteriorAngular,axial:exteriorAxial},
      conservativeCancellation:{source:'Original (5.20)-(5.21), Lemma5.2',currentMoments:'Actual corrected n=2 moments1,2,4,5 cancel all conservative time/transport/pressure totals.',lowerAngular:'The actual n=1 second total moment integral R^2 E1 is zero, so its lower axial-viscosity moment vanishes.',lowerAxial:'The actual n=1 first total moment integral R U1 is zero, so its lower axial-viscosity moment vanishes.',totalValues:[0,0],totalValuesAreAnalyticIdentitiesNotQuadratureResults:true},
      sourceLowerViscosity:'Z_(b+2h-D) Z_(b+2h) F1 and Z_(c+2h-D) Z_(c+2h) U1',leadingHeatViscosityUsedForOrderTwo:false,numericalPointValuesEnclosed:false},
    support:{...completed.program.support,directActualOrderTwoStressGraphGenerated:true,orderTwoComponents:{theta:[Xminus,Xplus],z:[Xminus,Xplus]},orderOneContrast:{thetaEnd:Xb,zEnd:Xplus},actualOrderOneAndOrderTwoEndpointsDifferent:supportOrder.pass,allLaterOrdersConstructed:false},
    scope:{...completed.program.scope,actualOrderTwoTangentialResidualsCompiled:true,actualOrderTwoStressPrimitivesCompiled:true,actualOrderTwoStressSupportChecked:true,actualOrderTwoNumericStressValuesEnclosed:false,allOrdersConstructed:false,originalN404Complete:false,originalN405Complete:false}});
  return {...completed,G,program,roots,completedOrderTwo:completed,actualHeat:heat,stressTwo:{angular,axial,Ttheta,Tz,thetaForward,zForward,thetaBackward,zBackward,totalAngular,totalAxial,angularViscosity,axialViscosity,sourceAssertions,supportOrder,exteriorAngular,exteriorAxial}};
}
export function prepareActualSecondOrderStressProgram(input={},context={}){
  for(const k of Object.keys(input))if(!['sourceProfile','terms','bits','etaOrder','heatIterations'].includes(k))fail('INVALID_INPUT','Unknown actual n=2 stress input '+k);
  const {heatIterations=0,...core}=input;return attachActualSecondOrderStress(prepareActualSecondOrderGlobalProgram(core,context),{heatIterations},context);
}
export function compileActualSecondOrderStressProgram(input={},context={}){return prepareActualSecondOrderStressProgram(input,context).program;}
