/** Actual order-one tangential residuals and their signed stress primitives.
 * The complete I2-compensated E0 is used, including between the inner cutoff
 * and Ipos and in the heat collar. No mean-patch stress is substituted here.
 */
import {prepareActualFirstOrderGlobalProgram,assertActualFirstOrderCompleted} from './actual-continuation-exact-order-one.mjs';
import {attachActualHeatLeading,assertActualHeatLeading} from './actual-continuation-exact-heat.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';
import {actualHeatExteriorIdentity} from './actual-continuation-exact-identities.mjs';
import {actualSupportOrderProof,checkActualExteriorZeros} from './actual-continuation-exact-support.mjs';

export function attachActualOrderOneStress(completed,{heatIterations=1}={},context={},preparedHeat=null){
  const gate=assertActualFirstOrderCompleted(completed);
  if(preparedHeat)assertActualHeatLeading(preparedHeat);
  const heat=preparedHeat??attachActualHeatLeading(completed.originalLeading,{iterations:heatIterations},context),G=completed.G,r=completed.orderOne,{X,eta}=completed.constants,q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,{A,D,d,L}=G.core;
  if(heat.G!==G||heat.program.parameterExpressionSHA256!==gate.parameterExpressionSHA256)fail('INVALID_SOURCE_CONSTRUCTION','The actual leading heat field and finalized order one must share one graph.');
  const F0=heat.heat.finalF,U0=completed.finalU,v0=completed.finalv,{F1,U1,v1,Pi1,Xminus,Xplus,Xb}=r,lambda1=completed.inner.lambda1,b=G.neg(G.add(A,q(1,2))),c=G.neg(A);
  const Z=(a,f)=>G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(a,f),G.mul(X,G.derivative(f,X)))),G.mul(d,G.derivative(f,eta))),L);
  const T=(a,f)=>G.div(G.add(G.neg(G.mul(a,f)),G.mul(D,eta,G.derivative(f,eta)),G.mul(X,G.derivative(f,X))),L);
  const F1x=G.derivative(F1,X),F1xx=G.derivative(F1x,X),U1x=G.derivative(U1,X),U1xx=G.derivative(U1x,X),F0x=G.derivative(F0,X),U0x=G.derivative(U0,X);
  const angularViscosity=Z(G.sub(b,D),Z(b,F0)),axialViscosity=Z(G.sub(c,D),Z(c,U0));
  const angularTerms=[T(G.add(b,lambda1),F1),G.mul(v0,G.add(G.mul(X,F1x),F1)),G.mul(U0,Z(G.add(b,lambda1),F1)),G.mul(v1,G.add(G.mul(X,F0x),F0)),G.mul(U1,Z(b,F0)),G.mul(q(-2),G.add(G.mul(X,F1xx),G.mul(q(2),F1x)))];
  const axialTerms=[T(G.add(c,lambda1),U1),G.mul(X,v0,U1x),G.mul(U0,Z(G.add(c,lambda1),U1)),G.mul(X,v1,U0x),G.mul(U1,Z(c,U0)),Z(G.add(G.mul(q(-2),A),lambda1),Pi1),G.mul(q(-2),G.add(G.mul(X,U1xx),U1x)),G.neg(axialViscosity)];
  const angular=G.add(...angularTerms,G.neg(angularViscosity)),axial=G.add(...axialTerms);
  // The actual inner solution solves the coefficient equations exactly.
  // The raw residual graph is retained independently of this zero branch.
  const angularSupported=G.choose(X,Xminus,Xb,z,angular,z),axialSupported=G.choose(X,Xminus,Xplus,z,axial,z);
  const integralFunctions=new Map();
  const integrate=(body,left,right,prefix)=>{const s=G.fresh(prefix);let system=integralFunctions.get(body);if(system===undefined){system=G.defineExpressionFunction({name:prefix+'_integrand',parameters:[X,eta],body,derivativeLimits:[4,6]});integralFunctions.set(body,system);}return G.integral(G.expressionValue(system,[s,eta]),s,left,right);};
  const thetaBody=G.mul(q(2),X,angularSupported),thetaForward=G.neg(G.div(integrate(thetaBody,Xminus,X,'actual_n1_Ttheta_forward'),G.mul(q(2),X))),zForward=G.neg(G.div(integrate(axialSupported,Xminus,X,'actual_n1_Tz_forward'),G.sqrt(G.mul(q(2),X))));
  const thetaBackward=G.div(integrate(thetaBody,X,Xb,'actual_n1_Ttheta_backward'),G.mul(q(2),X)),zBackward=G.div(integrate(axialSupported,X,Xplus,'actual_n1_Tz_backward'),G.sqrt(G.mul(q(2),X)));
  const Ttheta=G.choose(X,Xminus,Xb,z,thetaForward,z),Tz=G.choose(X,Xminus,Xplus,z,zForward,z);
  const totalAngular=integrate(thetaBody,Xminus,Xb,'actual_n1_total_R2_residual'),totalAxial=integrate(axialSupported,Xminus,Xplus,'actual_n1_total_R_residual');
  const exteriorIdentity=actualHeatExteriorIdentity(G,{X,eta,argument:heat.heat.heatArgument,amplitude:heat.heat.exteriorAmplitude,exponent:heat.heat.exteriorExponent});
  const supportOrder=actualSupportOrderProof(completed),exteriorAngular=checkActualExteriorZeros(G,angularTerms,supportOrder,{endpoint:Xb}),exteriorAxial=checkActualExteriorZeros(G,axialTerms,supportOrder);
  const sourceAssertions={sameProfileAndParameters:heat.program.profileId===gate.profileId&&heat.program.parameterExpressionSHA256===gate.parameterExpressionSHA256,
    actualIposFiveMomentIdentity:completed.program.momentRepair.universalLinearIdentity.pass,
    actualHeatRootWithFullThreeDebts:heat.program.scope.actualI2ContinuousRootCompiled&&heat.program.heat.tailTruncated===false,
    actualI2Contraction: Object.values(heat.heat.proof.checks).every(Boolean),
    actualInnerSystemAndZeroDatum:completed.program.scope.actualOrderOneForcingFullySpecified&&completed.program.picardSystems[completed.inner.system].zeroAxisDatum.every(x=>x===0),
    positiveOrderCutoffIndependentOfEta:G.derivative(Xminus,eta)===z&&G.derivative(Xplus,eta)===z&&G.derivative(Xb,eta)===z,
    actualHeatExteriorChainIdentity:exteriorIdentity.pass,
    terminalAmplitudeIndependentOfEta:heat.program.heat.exterior.amplitudeEtaDerivative===z,
    distinctOrderOneAndLaterSupports:supportOrder.pass,
    actualAngularExteriorTermsZero:exteriorAngular.pass,actualAxialExteriorTermsZero:exteriorAxial.pass};
  if(!Object.values(sourceAssertions).every(Boolean))fail('INTERNAL_VALIDATION','The actual stress-support premises did not bind: '+Object.entries(sourceAssertions).filter(([,v])=>!v).map(([k])=>k).join(', ')+'; exterior axial checks='+JSON.stringify(exteriorAxial.checks));
  const roots={...completed.roots,...heat.roots,actualOrderOneAngularResidualDividedByR:angular,actualOrderOneAxialResidual:axial,actualOrderOneAngularAxialViscosity:angularViscosity,actualOrderOneAxialAxialViscosity:axialViscosity,
    actualOrderOneTtheta:Ttheta,actualOrderOneTz:Tz,actualOrderOneTthetaForward:thetaForward,actualOrderOneTthetaBackward:thetaBackward,actualOrderOneTzForward:zForward,actualOrderOneTzBackward:zBackward,actualOrderOneTotalR2Residual:totalAngular,actualOrderOneTotalRResidual:totalAxial};
  const program=G.pack(roots,{construction:'Actual order-one signed stress from (5.9), using the full heat-prepared leading field and the corrected order-one profiles.',order:1,inner:completed.program.inner,momentRepair:completed.program.momentRepair,heat:heat.program.heat,I2:heat.program.I2,leading:heat.program.leading,
    orderOneStress:{rawAngularDividedByR:angular,rawAxial:axial,angularTerms,axialTerms,angularSupported,axialSupported,Ttheta,Tz,supportOrder,exteriorZeroChecks:{angularNonHeatTerms:exteriorAngular,axial:exteriorAxial},
      forward:[thetaForward,zForward],backward:[thetaBackward,zBackward],totalResidualIntegrals:[totalAngular,totalAxial],sourceAssertions,
      coordinate:'X=R^2/2; theta integrand R^2*rtheta*dR becomes 2*X*(rtheta/R)*dX, and R*rz*dR becomes rz*dX.',
      conservativeCancellation:{source:'Original (5.19)-(5.21), Lemma 5.2 steps 4-5',
        angularCurrent:'The exact moments m1,2=m1,4=0 cancel the time and axial flux terms.',
        angularLower:'The actual I2 root adds -D_I to the complete heat change D_I, so the same leading subtracted angular moment (5.19) is the zero function of eta.',
        axialCurrent:'The exact m1,1=m1,5=0 cancel the axial time and pressure-flux moments, with pressure integrated by parts.',
        axialLower:'The actual leading B8/C12/I1 restoration and outer pulse give the exact zero U0 flux.',
        totalValues:[0,0],totalValuesAreAnalyticIdentitiesNotQuadratureResults:true},
      exteriorHeatIdentity:{...exteriorIdentity,sourceExterior:heat.program.heat.exterior,exactlyZero:true,doesNotRequireHeatValuesAtSamples:true},
      numericalPointValuesEnclosed:false},
    support:{...completed.program.support,directActualOrderOneStressGraphGenerated:true,orderOneComponents:{theta:[Xminus,Xb],z:[Xminus,Xplus]},
      laterOrderMechanism:'For every finalized n>=2, every product and axial-viscosity operand outside Xplus has a finalized positive-order factor. The same conservative five-moment cancellation gives the backward stress primitive with zero exterior tail.',
      laterOrderSupportImplementationPending:true,allLaterActualCoefficientsConstructed:false},
    scope:{...completed.program.scope,actualGlobalE0Compiled:true,actualI2ContinuousRootCompiled:true,actualOrderOneTangentialResidualsCompiled:true,actualOrderOneStressPrimitivesCompiled:true,actualOrderOneStressSupportPremisesVerified:true,actualOrderOneNumericStressValuesEnclosed:false,actualOrderTwoSourceGenerated:false,allOrdersConstructed:false,originalN404Complete:false,originalN405Complete:false,newLeanKernelProof:false}});
  return {...completed,G,program,roots,completedOrderOne:completed,actualHeat:heat,stress:{angular,axial,Ttheta,Tz,thetaForward,zForward,thetaBackward,zBackward,totalAngular,totalAxial,sourceAssertions,exteriorIdentity,supportOrder,exteriorAngular,exteriorAxial,Z,T}};
}

export function prepareActualOrderOneStressProgram(input={},context={}){
  for(const key of Object.keys(input))if(!['sourceProfile','terms','bits','heatIterations'].includes(key))fail('INVALID_INPUT','Unknown actual stress construction input '+key);
  const completed=prepareActualFirstOrderGlobalProgram({sourceProfile:input.sourceProfile,terms:input.terms??1,bits:input.bits??128,etaOrder:0},context);
  return attachActualOrderOneStress(completed,{heatIterations:input.heatIterations??1},context);
}
export function compileActualOrderOneStressProgram(input={},context={}){return prepareActualOrderOneStressProgram(input,context).program;}
