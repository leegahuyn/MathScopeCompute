/** Exact integration-by-parts reduction of the two full Omega_0 debts.
 * The source U/M is still an indispensable input. Five endpoint moments do
 * not determine the six integrals below. No field value is inferred from
 * those endpoint moments or from a source norm bound.
 */
import {assertSourceProfile,SOURCE_PROFILE_ID,sourceExponentContract} from './source-profile.mjs';
import {iadd,isub,imul,idiv,iscale,point,nextUp} from '../../mathscope-m1/navier/numerics.mjs';

const coefficientBounds={U:1,M:1,U_eta:1,M_eta:1,M_etaeta:2};
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
const q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);if(!d)throw Error('A nonzero exact denominator is required.');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return [n/g,d/g];};
const parse=x=>{if(typeof x!=='string'||!/^[-+]?\d+(\/\d+)?$/.test(x))throw Error('Exact operator inputs must be integer or rational strings.');const[n,d='1']=x.split('/');return q(n,d);};
const add=(...xs)=>xs.reduce((a,b)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),q(0));
const mul=(...xs)=>xs.reduce((a,b)=>q(a[0]*b[0],a[1]*b[1]),q(1));
const neg=a=>q(-a[0],a[1]),sub=(a,b)=>add(a,neg(b)),div=(a,b)=>mul(a,q(b[1],b[0])),serial=a=>a[1]===1n?String(a[0]):a[0]+'/'+a[1];

/** Exact arithmetic implementation, intentionally separate from a source receipt.
 * The caller must supply actual integrals before it can be used on the source.
 * Tests use independent polynomial fields and cannot issue a source certificate.
 */
export function evaluateExactOmegaReducedMoments(input){
  const keys=['h','eta','Jminus1Eta','Jzero','JzeroEta','Hminus1','Hminus1Eta','Hzero','HzeroEta','Kminus2','Kminus1','axisVX'];
  if(!input||keys.some(k=>!Object.hasOwn(input,k))||Object.keys(input).some(k=>!keys.includes(k)))throw Error('All exact reduced moments, eta derivatives, and the axis boundary must be supplied.');
  const v=Object.fromEntries(keys.map(k=>[k,parse(input[k])])),h=v.h,e=v.eta,A=add(q(1,2),h),D=sub(q(1,2),h),L=sub(q(1),mul(q(2),h,e,e)),dd=sub(q(1),mul(e,e));
  const P=add(div(add(mul(D,e,v.Jminus1Eta),mul(dd,v.Hminus1Eta),neg(mul(q(2),A,e,v.Hminus1))),mul(q(2),L)),mul(q(1,4),v.Kminus2),v.axisVX);
  const F=sub(div(add(mul(D,e,v.JzeroEta),neg(v.Jzero),mul(dd,v.HzeroEta),mul(q(2),D,e,v.Hzero)),mul(q(2),L)),mul(q(1,4),v.Kminus1));
  return {P:serial(P),F:serial(F),globalPressureDebt:serial(neg(P)),globalFluxDebt:serial(F),arithmetic:'EXACT_BIGINT_RATIONAL',sourceIntegralProvenanceVerified:false,sameProfileCertificate:false};
}

export function evaluateExactRegularOmegaJet(input){
  const keys=['X','eta','h','U','Ueta','average','averageEta','averageEtaEta'];if(!input||keys.some(k=>!Object.hasOwn(input,k))||Object.keys(input).some(k=>!keys.includes(k)))throw Error('All source-average jets must be supplied to the exact operator.');
  const s=Object.fromEntries(keys.map(k=>[k,parse(input[k])])),e=s.eta,h=s.h,D=sub(q(1,2),h),L=sub(q(1),mul(q(2),h,e,e)),Le=mul(q(-4),h,e),dd=sub(q(1),mul(e,e));
  const n=sub(sub(mul(q(2),e,s.U),mul(q(2),D,e,s.average)),mul(dd,s.averageEta));
  const ne=add(mul(q(2),s.U),mul(q(2),e,s.Ueta),neg(mul(q(2),D,add(s.average,mul(e,s.averageEta)))),mul(q(2),e,s.averageEta),neg(mul(dd,s.averageEtaEta)));
  const v=div(n,L),ve=div(sub(mul(ne,L),mul(n,Le)),mul(L,L)),uv=mul(s.U,v),uve=add(mul(s.Ueta,v),mul(s.U,ve));
  return {...Object.fromEntries(Object.entries({v,vEta:ve,Jminus1:v,Jminus1Eta:ve,Jzero:mul(s.X,v),JzeroEta:mul(s.X,ve),Hminus1:uv,Hminus1Eta:uve,Hzero:mul(s.X,uv),HzeroEta:mul(s.X,uve),Kminus2:mul(v,v),Kminus1:mul(s.X,v,v)}).map(([k,x])=>[k,serial(x)])),arithmetic:'EXACT_BIGINT_RATIONAL',sourceJetProvenanceVerified:false,sameProfileCertificate:false};
}

export function actualGlobalOmegaReduction({profileId=SOURCE_PROFILE_ID,eta=0}={}){
  const source=assertSourceProfile(profileId);if(!Number.isFinite(eta)||Math.abs(eta)>1)throw Error('The actual eta coordinate must lie in [-1,1].');
  const h=sourceExponentContract().binary64Enclosure,j=[0,2**-1000],e=point(eta),e2=imul(e,e),L=isub(point(1),iscale(imul(h,e2),2)),A=iadd(point(.5),h),Ustar=iadd(iscale(e,4),j),dd=isub(point(1),e2);
  const axis=eta===0?[-4,-4]:idiv(isub(iscale(imul(imul(A,e),Ustar),2),iscale(dd,4)),L);
  return {
    schema:'MathScope.ActualGlobalOmegaReduction/1',profileId,parameterExpressionSHA256:source.parameterExpressionSHA256,
    coefficients:{h:source.parametersExactExpressions.h,A:'1/2+h',D:'1/2-h',d:'1-eta^2',L:'1-2*h*eta^2'},
    radialAverage:{definition:'ubar(X,eta)=integral_0^1 U0(s*X,eta) ds',equivalentForPositiveX:'M0(X,eta)/X',axisValue:'U0(0,eta)',noDivisionByZeroAtAxis:true},
    normalizedRadial:{name:'v',definition:'(2*eta*U0-2*D*eta*ubar-d*ubar_eta)/L',identity:'V0=X*v',derivedFrom:'Original equation (4.7) and M0_X=U0'},
    regularIntegrands:[
      {id:'Jminus1',integrand:'v',meaning:'integral V0/X dX'},
      {id:'Jzero',integrand:'X*v',meaning:'integral V0 dX'},
      {id:'Hminus1',integrand:'U0*v',meaning:'integral U0*V0/X dX'},
      {id:'Hzero',integrand:'X*U0*v',meaning:'integral U0*V0 dX'},
      {id:'Kminus2',integrand:'v^2',meaning:'integral V0^2/X^2 dX'},
      {id:'Kminus1',integrand:'X*v^2',meaning:'integral V0^2/X dX'}
    ].map(x=>({...x,domain:['0','Xv'],smoothAtAxis:true,actualSourceValuesEvaluated:false})),
    functionals:{
      P:{definition:'integral_0^Xv Omega0/(2X) dX',reduced:'(D*eta*deta(Jminus1)+d*deta(Hminus1)-2*A*eta*Hminus1)/(2*L)+Kminus2/4+V0_X(0,eta)',momentDebtSign:'global m3 pressure debt equals -P'},
      F:{definition:'integral_0^Xv Omega0/2 dX',reduced:'(D*eta*deta(Jzero)-Jzero+d*deta(Hzero)+2*D*eta*Hzero)/(2*L)-Kminus1/4',momentDebtSign:'global m5 flux debt equals +F'}
    },
    arbitraryFixedSubinterval:{domain:'[a,b], with eta-independent endpoints; use axis limits when a=0',
      pressureBoundary:'[V/(2L)-eta*U*V/L+V^2/(2X)-V_X]_a^b',
      fluxBoundary:'[X*V/(2L)-eta*X*U*V/L+V^2/2-X*V_X+V]_a^b',
      movingEndpointsRequireAdditionalLeibnizTerms:true,subintervalBoundaryTermsMustNotBeDropped:true},
    derivation:[
      'V_X=(2*A*eta*U-d*U_eta+2*eta*X*U_X)/L follows by differentiating the exact radial reconstruction.',
      'U*Z_0(V)=[d*deta(UV)-2*A*eta*UV-2*eta*X*dX(UV)]/L+V*V_X.',
      'Thus Omega0=[D*eta*V_eta+X*V_X+d*deta(UV)-2*A*eta*UV-2*eta*X*dX(UV)]/L+2*V*V_X-V^2/(2X)-2*X*V_XX.',
      'Integrate each radial derivative exactly. V=O(X) at the axis, while U=M=V=V_X=0 at Xv. The pressure functional retains V_X(0).',
      'Substitute V=X*v so every remaining radial integrand is nonsingular. Differentiation in eta may pass under these fixed compact integrals.'
    ],
    axisBoundary:{eta,exactExpression:'[2*(1/2+h)*eta*(4*eta+j0)-4*(1-eta^2)]/(1-2*h*eta^2)',sourceDatum:'U0(0,eta)=4*eta+j0',valueInterval:axis,value:(axis[0]+axis[1])/2,etaZeroExact:'-4',sourceField:'globalSource.reduction.axisBoundary.valueInterval',observationKind:'ACTUAL_AXIS_BOUNDARY_TERM_FOR_GLOBAL_OMEGA_INTEGRAL',positiveHAndJNotReplacedByZero:true},
    hypotheses:{fullAxialSupport:'U0=M0=V0=0 after Xv=XR*exp(T+2+60*BOuter+13/lambda)',axisSmoothness:'The actual nonlinear source has smooth U0 and M0(0)=0.',etaDerivativeOrderForFunctionalValues:2,etaDerivativeOrderForFunctionalDerivativeOfOrderM:'m+2',globalRadialDerivativesOfURequiredAfterReduction:0},
    executableOperators:{integrands:'evaluateExactRegularOmegaJet',reducedIntegrals:'evaluateExactOmegaReducedMoments',arithmetic:'BigInt rational; independent of diagnostic quadrature',actualGlobalInputsStillRequired:true},
    scope:{universalExactReductionAppliesToPinnedSource:true,actualAxisBoundaryEvaluated:true,sixActualGlobalIntegralsEvaluated:false,actualGlobalMomentDebtsClosed:false,fiveEndpointMomentsSufficient:false,N4_04_Complete:false},
    sources:{paper:{sha256:source.sourcePaperSHA256,equations:['4.7','5.6','5.10','5.11']},assembly:source.inputs.assembly,specification:source.inputs.specification}
  };
}

/** This is a source-bound error for the two Omega functional VALUES.
 * It avoids numerical summation of the N rapid phases without replacing N,
 * its loop, or its final moment repair. Eta derivatives need stronger bounds.
 */
export function actualModulationOmegaRemainder({profileId=SOURCE_PROFILE_ID}={}){
  const source=assertSourceProfile(profileId),p=source.parametersExactExpressions;
  if(!p.C12EnvelopeR||!p.radialFrequencyN||!p.sourceJLeft||!p.sourceJRight)throw Error('The pinned source is missing its actual C.12 envelope, frequency, or support.');
  const twoToMinus260=2**-260;
  return {
    schema:'MathScope.ActualC12OmegaFunctionalRemainder/1',profileId,parameterExpressionSHA256:source.parameterExpressionSHA256,
    sameActualNRetained:true,RExact:p.C12EnvelopeR,NExact:p.radialFrequencyN,R:'exp(sourceEnvelopeS^256)',N:'1+ceil(R^50)',
    sourceDifferences:{objects:['final U0 - pre-C12 U','final M0 - pre-C12 M'],includes:'The original C.12 primitives and the complete continuous I1 moment restoration.',factorialEtaNormOrder:2,epsilon:'R^22/N',support:{left:p.sourceJLeft,right:p.sourceJRight},identicallyZeroOutsideJ:true,sourceRangeOnlyOnJ:'1/R <= X <= R',globalXvBoundByRRequired:false,coefficientBounds},
    estimates:[
      {quantity:'V,V_eta',upper:'32*R^2'},
      {quantity:'Delta V,Delta V_eta',upper:'32*R*epsilon'},
      {quantity:'Delta(UV),deta Delta(UV)',upper:'128*R^2*epsilon'},
      {quantity:'Delta(V^2)',upper:'2048*R^3*epsilon'},
      {quantity:'Delta P',upper:'R^7*epsilon=R^29/N'},
      {quantity:'Delta F',upper:'R^6*epsilon=R^28/N'}
    ],
    uniformFinalBound:{P:'abs(P_final-P_preC12) < R^30/N < R^-20 <= 2^-260',F:'abs(F_final-F_preC12) < R^30/N < R^-20 <= 2^-260',exactUpper:'1/'+String(1n<<260n),displayEnclosure:[0,nextUp(twoToMinus260)],absoluteError:true,relativeError:false,etaDomain:[-1,1],etaDerivativeOrders:[0]},
    arithmeticChecks:{RMinimum:'8192=2^13',NStrictlyGreaterThanRPow50:true,exponentDifference:30-50,dyadicExponent:13*20,strictSmallnessFollowsFromActualPositiveR:true},
    scope:{actualNReplacedOrAveraged:false,sourceDefinedOmissionWithQuantitativeRemainder:true,preC12ActualOmegaValuesStillNeeded:true,functionalEtaDerivativeFamilyCertified:false,allOrderBackgroundInductionAllowed:false,smallRadialShearDifferenceClaimed:false,N5PhaseOrGrowthCertificate:false,finalGlobalMomentDebtsEvaluated:false,N4_04_Complete:false},
    source:{path:'research-ide/mathscope-m1/navier/followup-20261010-symbolic-gluing/C12_FREQUENCY_CONTRACT.md',sha256:'1740353222f1a5ca727c2c8a2c7063bba8a990f9a4393754256d5c82f49f7a16',sections:[1,2,3,4],sourceAssembly:source.inputs.assembly},
    missingForNextOrder:'To bound eta derivatives of P and F of order m, propagate actual source and C.12/I1 differences in C_eta^(m+2); the present value bound cannot be reused as that derivative bound.'
  };
}

/** A useful exact failure control: the five leading endpoint moments do not
 * determine either next-order weighted Omega integral. This is not an
 * alternative or approximate N3 source. */
export function fiveMomentsDoNotDetermineOmega(){return {
  schema:'MathScope.EndpointMomentInsufficiency/1',scope:'INDEPENDENT_COUNTEREXAMPLE_TO_A_PROPOSED_SHORTCUT; not the actual N3 field',
  construction:'Take a nonzero smooth compactly supported phi in (0,1), U_a(X,eta)=phiSecond(X-a), M_a=phiPrime(X-a), and a common E=c*sqrt(2X) on both translated bump supports.',
  unchangedOriginalEndpointMoments:['M=integral U=0','I and Cp depend only on the common E','J=2*c*integral X*phiSecond(X-a)=0','S changes by integral (phiSecond)^2, which is translation invariant'],
  atEtaZero:{V:'0',V_eta:'2*X*U-2*D*M',Omega:'2*U*(X*U-D*M)',F:'integral X*U^2 dX',P:'integral U^2 dX-(D/2)*integral M^2/X^2 dX'},
  distinctFlux:'F_b-F_a=(b-a)*integral (phiSecond)^2 > 0 when b>a',distinctPressure:'P_b>P_a for b>a and D>0 because the translated 1/X^2 weight strictly decreases.',
  invalidShortcutRejected:'Replacing the actual six global integrals by only the five restored endpoint moments is not mathematically valid.'
};}
