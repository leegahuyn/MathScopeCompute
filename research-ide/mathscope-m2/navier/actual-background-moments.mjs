/** Exact order-one moment dependencies and a nonzero actual outer forcing test.
 *
 * The five functionals below are generated from (5.10)--(5.15), in X rather
 * than R.  Their unresolved global Omega integrals stay explicit.  This
 * module does not relabel a core-only moment or an arbitrary supplied debt
 * as the full same-profile repair.
 */
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';
import {actualBackgroundMajorant} from './actual-background-majorant.mjs';
import {nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';

const q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);if(d<0n){n=-n;d=-d;}let a=n<0n?-n:n,b=d;while(b)[a,b]=[b,a%b];return [n/a,d/a];};
const qa=(a,b)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),qm=(a,b)=>q(a[0]*b[0],a[1]*b[1]),qi=a=>q(a[1],a[0]),qs=a=>a[1]===1n?String(a[0]):a[0]+'/'+a[1];
function oneMinusExpMinusFive(){let term=q(1),s=q(1);const degree=64;for(let k=1;k<=degree;k++){term=qm(term,q(5,k));s=qa(s,term);}const next=qm(term,q(5,degree+1)),tail=qm(next,q(degree+2,degree+2-5)),lo=qa(q(1),qm(q(-1),qi(s))),hi=qa(q(1),qm(q(-1),qi(qa(s,tail))));return {lower:qs(lo),upper:qs(hi),width:qs(qa(hi,qm(q(-1),lo))),display:[nextDown(Number(lo[0])/Number(lo[1])),nextUp(Number(hi[0])/Number(hi[1]))],derivation:{method:'Exact positive Taylor sum for exp(5), with geometric upper bound for its entire positive tail, then reciprocal monotonicity.',degree,expFiveLower:qs(s),expFiveUpper:qs(qa(s,tail))}};}

export function actualBackgroundMomentFunctionals({profileId=SOURCE_PROFILE_ID,bits=128}={}){
  const source=assertSourceProfile(profileId),majorant=actualBackgroundMajorant({profileId,bits});
  const nodes={},node=(id,op,args,extra={})=>{nodes[id]={op,args,...extra};return id;};
  node('X','coordinate',['X']);
  node('zero','rational',['0','1']);node('two','rational',['2','1']);node('minusTwo','rational',['-2','1']);node('half','rational',['1','2']);node('minusHalf','rational',['-1','2']);
  node('Xcut','sourceParameterExpression',[{product:[{ref:'Xa'},{exp:{quotient:[{ref:'t1'},{integer:32}]}}]}]);
  node('Xv','sameSourceAxialSupportEndpoint',[],{source:source.inputs.specification,computationalAdapterInstalled:false,definition:'The actual source radius after which U0=V0=0, as used in (5.18). It is not the core endpoint or the end of Ipos.'});
  node('cutoff','smoothStepComplement',['log(X/Xa)','t1/64','t1/32'],{exactDefinition:'1-sigma((log(X/Xa)-t1/64)/(t1/32-t1/64)); sigma is the literal source flat step',etaIndependent:true,supportRight:'Xa*exp(t1/32)',equalsOneThrough:'Xa*exp(t1/64)'});
  node('F0','sameSourceLeadingField',['F0=E0/sqrt(2X)'],{domain:['0','Xa*exp(t1/32)'],sourceDefinition:'Actual nonlinear B.14/B.15 Picard limit on Y<=4, followed by the literal B.26 first activation. Later modifications are absent on this interval.'});
  node('U0','sameSourceLeadingField',['U0'],{domain:['0','Xa*exp(t1/32)'],sourceDefinition:'The same actual nonlinear axis and B.26 activation as F0.'});
  node('F1in','sameSourceInnerPicardCoordinate',[0],{solution:'W1=sum_(k>=0) [G(A0+A1*deta)]^k G f1',scaling:'F1=phi1/CSelected',quantitativeMajorant:majorant.derivedConstants});
  node('U1in','sameSourceInnerPicardCoordinate',[1]);
  node('Ftilde','multiply',['cutoff','F1in']);node('Utilde','multiply',['cutoff','U1in']);
  node('localM1Integrand','identity',['Utilde']);
  node('localM2Integrand','multiply',['two','X','Ftilde']);
  node('localM3Integrand','multiply',['two','F0','Ftilde']);
  node('U0F1','multiply',['U0','Ftilde']);node('U1F0','multiply',['Utilde','F0']);node('flux','add',['U0F1','U1F0']);node('localM4Integrand','multiply',['two','X','flux']);
  node('UU','multiply',['two','U0','Utilde']);node('FF','multiply',['minusTwo','X','F0','Ftilde']);node('localM5Integrand','add',['UU','FF']);
  for(let k=1;k<=5;k++)node('localM'+k,'definiteIntegral',['localM'+k+'Integrand','X','zero','Xcut']);
  node('globalU0','sameSourceGlobalLeadingField',['U0'],{recipe:source.inputs.specification,computationalAdapterInstalled:false,reason:'The immutable actual full continuation, B.8 correction, heat compensation, C.12 modulation and I1 repair recipe is present; its complete global function evaluator is not yet compiled on this M2 path.'});
  node('globalV0','forwardReconstruction',['globalU0'],{identity:'V0=X/L*(2*eta*U0-2*D*eta*A_X(U0)-d*deta(A_X(U0)))'});
  node('globalOmega0','differentialPolynomial',['globalU0','globalV0'],{identity:'T_0 V0+V0*(V0_X-V0/(2X))+U0*Z_0 V0-2X*V0_XX',sourceEquation:'5.6',smoothAtAxisAfterDivisionByX:true});
  node('negativeHalfOmega','multiply',['minusHalf','globalOmega0']);node('globalPressureIntegrand','divide',['negativeHalfOmega','X']);node('globalFluxIntegrand','multiply',['half','globalOmega0']);
  node('globalPressureDebt','definiteIntegral',['globalPressureIntegrand','X','zero','Xv'],{fullLeadingAxialSupportRequired:true,coreOnlySubstitutionRejected:true});
  node('globalFluxDebt','definiteIntegral',['globalFluxIntegrand','X','zero','Xv'],{fullLeadingAxialSupportRequired:true,coreOnlySubstitutionRejected:true});
  const roots={m1:'localM1',m2:'localM2',m3:node('m3','add',['localM3','globalPressureDebt']),m4:'localM4',m5:node('m5','add',['localM5','globalFluxDebt'])};
  node('eStarTimesf','actualIposPowerLawAmplitude',[],{definition:'E0(R,eta)*R^(1+2*lambda), independent of R throughout the preserved Ipos patch; strictly positive by the pinned source.'});node('twiceAmplitude','multiply',['two','eStarTimesf']);
  node('UdebtSecond','divide',[roots.m4,'eStarTimesf']);node('EdebtSecond','divide',[roots.m3,'twiceAmplitude']);node('negativeM5','negative',[roots.m5]);node('EdebtThird','divide',['negativeM5','eStarTimesf']);
  node('Udebt','vector',[roots.m1,'UdebtSecond']);node('Edebt','vector',[roots.m2,'EdebtSecond','EdebtThird']);
  node('BU','exactFixedBumpIntegralMatrix',[],{exponents:['1','1-2*lambda'],entry:'integral R^p_i*bU_j(R) dR',bumpSupports:'The two source Ipos axial bumps.'});
  node('BE','exactFixedBumpIntegralMatrix',[],{exponents:['2','-2-2*lambda','-2*lambda'],entry:'integral R^s_i*bE_j(R) dR',bumpSupports:'The three source Ipos swirl bumps.'});
  node('alpha','negativeExactLinearSolve',['BU','Udebt']);node('beta','negativeExactLinearSolve',['BE','Edebt']);
  const c=oneMinusExpMinusFive(),imean={
    id:'actual-Imean-omission-control',sourceProfileId:profileId,sourceFields:{U0:'0',M:'eta*mConst',V0:'-mConst',mConst:'XR*exp(1)*(4+integral_0^T exp(s)*k(s) ds)',k:'4*(1-sigma(log(1+s)/Md))',mConstStrictlyPositive:true},
    interval:{left:'X0Imean',right:'X0Imean*exp(5)',sourceGraphLeft:source.parametersExactExpressions.X0Imean,sourceGraphRight:source.parametersExactExpressions.ImeanRight},
    exactOmega:'-mConst^2/(2X)',exactPressureDerivative:'mConst^2/(4X^2)',
    sourceIdentityDerivation:['U0=0 and M=eta*mConst in the unchanged reserved Imean patch.','By (4.7), V0=-(2D*eta^2+d)*mConst/L=-mConst since 2D*eta^2+d=L.','V0 is constant in X and eta, so T_0 V0=Z_0 V0=V0_XX=0; (5.6) reduces to -V0^2/(2X).','Order-one cutoff and correction bumps end before Imean. Thus F1=U1=0 there while Pi1_X=-Omega0/(2X)>0.'],
    normalizedContributions:[
      {id:'Imean-pressure-debt',moment:'m3',quantity:'(4*X0Imean/mConst^2) * integral_Imean Pi1_X dX',exact:'1-exp(-5)',normalizedInterval:{lower:c.lower,upper:c.upper,width:c.width},displayEnclosure:c.display,value:(c.display[0]+c.display[1])/2,normalization:'4*X0Imean/mConst^2',unnormalized:'mConst^2/(4*X0Imean)*(1-exp(-5))',strictSign:'positive',sourceField:'actualSource.moments.imeanOmissionControl.normalizedContributions[0].normalizedInterval'},
      {id:'Imean-flux-debt',moment:'m5',quantity:'(1/mConst^2) * integral_Imean Omega0/2 dX',exact:'-5/4',normalizedInterval:{lower:'-5/4',upper:'-5/4',width:'0'},displayEnclosure:[-1.25,-1.25],value:-1.25,normalization:'1/mConst^2',unnormalized:'-5*mConst^2/4',strictSign:'negative',sourceField:'actualSource.moments.imeanOmissionControl.normalizedContributions[1].normalizedInterval'},
    ],
    intervalArithmetic:c.derivation,
    negativeControl:{proposedOmission:'Set Omega0=0 after the core or Ipos.',wouldProduceNormalizedContribution:[0,0],actualContributionsExcludeZero:true,rejected:true},
    scope:'These are two actual source contributions to the order-one total moment debts; they are not the complete total debts or their correction coefficients.',
    sourceInputs:{specification:source.inputs.specification,assembly:source.inputs.assembly,formalConnectionReview:source.inputs.formalConnectionReview},
  };
  return {schema:'MathScope.ActualOrderOneMomentFunctionals/1',profileId,parameterExpressionSHA256:source.parameterExpressionSHA256,coordinate:'X=R^2/2',nodes,roots,correctionRoots:{alpha:'alpha',beta:'beta'},matrixDefinition:{BU:{exponents:['1','1-2*lambda'],entry:'integral R^p_i*bU_j(R) dR'},BE:{exponents:['2','-2-2*lambda','-2*lambda'],entry:'integral R^s_i*bE_j(R) dR'},bumps:'The five fixed, ordered, disjoint unit-integral source Ipos bumps. Matrix inverses refer to the exact integrals, not to inverses of their midpoint enclosures.',debtSmallnessRequired:false},support:{currentOrderOneStress:['Xa*exp(t1/128)','Xb'],laterOrderStress:['Xa*exp(t1/128)','Xplus'],XplusMustExceedActualLeadingAxialSupportAndAllBumps:true},imeanOmissionControl:imean,missingComputationalPrimitives:[{node:'globalU0',required:'A fully compiled evaluator of the same pinned global source recipe through Xv, including its accepted nonlinear roots and rapid shear modulation, with the derivatives needed by Omega0.',newUserParameterNeeded:false},{nodes:['globalPressureDebt','globalFluxDebt'],required:'Evaluate or exactly close both retained full-source weighted integrals before using the five correction coefficients at the next order.',inferredFromCoreOnly:false}],scope:{exactFiveMomentFunctionalDAGGenerated:true,localInnerFunctionNumericallyEvaluated:false,localMomentValuesEvaluated:false,completeFunctionalDAGExecutable:false,actualImeanContributionsEvaluated:true,actualTotalMomentDebtsClosed:false,exactMatrixInverseAppliedToCompleteActualDebts:false,actualGlobalCorrectedOrderOneConstructed:false,nextOrderSourceAllowed:false,N4_04_Complete:false,N4_05_Complete:false},sourceEquations:['4.7','5.6','5.10','5.11','5.14','5.15','5.16']};
}
