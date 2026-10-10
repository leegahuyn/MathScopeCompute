/** Quantitative pulse prerequisites on the actual, preserved Imean velocity only. */
import {iadd,isub,imul,idiv,iscale,ipower,ilog,point,nextUp,nextDown} from '../../mathscope-m1/navier/numerics.mjs';
import {PINNED_N3} from './source-profile-data.mjs';
import {SOURCE_PROFILE_ID} from './source-profile.mjs';
import {ACTUAL_PULSE_BINDINGS,getActualPulsePrerequisites,actualPulseScalarThreshold,actualPulseConeChoice} from './actual-pulse-source.mjs';
import {actualMeanPatchDefinitions,evaluateActualMeanPatchJet,boundActualMeanPatchJets} from './actual-pulse-meanpatch.mjs';

const invalid=message=>{throw Object.assign(Error(message),{code:'INVALID_INPUT'});};
const zero=()=>point(0);
const positiveSymbol=expression=>({expression,strictlyPositive:true,binary64:null,underflowNotZero:true});

/** The label's explicit tie rule; actual giant frequencies remain expressions. */
export function nearestNonzeroPulseInteger(value){
  if(!Number.isFinite(value)||Math.abs(value)>Number.MAX_SAFE_INTEGER-.5||value===0)invalid('A nonzero finite exactly supported phase-rounding input is required.');
  return Math.sign(value)*Math.max(1,Math.floor(Math.abs(value)+.5));
}

function exponentCheck(terms,power){
  const M=1n<<50n;
  // Divide by M^power. Negative exponent comparisons use one common denominator.
  const largest=Math.max(power,...terms.map(t=>t.power));
  let numerator=0n;for(const t of terms){if(!Number.isSafeInteger(t.coefficient)||t.coefficient<0||!Number.isSafeInteger(t.power)||t.power<0)throw Error('Invalid positive exponent budget.');numerator+=BigInt(t.coefficient)*M**BigInt(t.power);}
  return {pass:numerator<M**BigInt(power),terms,upperPower:power,minimumM:'2^50',uniformProof:terms.every(t=>t.power<=power)?'After division by M^upperPower every term is nonincreasing for M>=2^50.':'Only the displayed endpoint is checked; not an accepted uniform budget.',uniform:largest===power};
}

/** Concrete local C/Sstar estimates; all primitive bounds come from the actual Imean formulas. */
export function actualMeanPatchPhaseBounds(){
  const jets=boundActualMeanPatchJets(3),scalar=actualPulseScalarThreshold(),cone=actualPulseConeChoice();
  const checks=[
    {id:'same-profile-scalar-threshold',pass:scalar.pass},
    {id:'same-profile-cone-selection',pass:cone.frozenPointConeCertified},
    {id:'actual-uniform-third-jet',pass:jets.pass&&jets.normalizedBounds.FMax<2**17&&jets.normalizedBounds.VMax<2**21&&jets.normalizedBounds.bMax<32},
    {id:'actual-Fscale-lower',pass:2*64016>120009,proof:'logC>64016*T, logFscale>-5logC-120009*T, hence Fscale>C^-7.'},
    {id:'actual-F-positive-on-closed-patch',pass:8*3**10<2**19&&260>19,proof:'F/Fscale>2^-19>C^-1, hence F>C^-8.'},
    {id:'actual-radial-moment-upper',pass:2*64016>29,proof:'mConst<440*e*C^10*exp(21T)<C^12; log(440)+1<8 and T>1.'},
    {id:'actual-lambda-inverse',pass:64016>1000,proof:'lambda^-1=exp(1000T)<Q<C.'},
    {id:'Bs-lower',...exponentCheck([{coefficient:12,power:4}],6),proof:'Bs^2>=1/(12 M^4)>M^-6.'},
    {id:'phase-normal-error',...exponentCheck([{coefficient:16,power:5},{coefficient:8,power:4}],10)},
    {id:'normal-gap-at-selected-band',...exponentCheck([{coefficient:2,power:13}],200),proof:'2 M^13<Sstar, so M^10/Sstar<Bs/2.'},
    {id:'frame-operator-error',...exponentCheck([{coefficient:6,power:38},{coefficient:4,power:34}],64)},
    {id:'damping-error',...exponentCheck([{coefficient:20,power:16}],20)},
    {id:'riccati-bound-under-one-quarter',...exponentCheck([{coefficient:4,power:68}],200)},
    {id:'riccati-inward-boundary',...exponentCheck([{coefficient:2,power:64}],65),proof:'At |r|=M^68/Sstar, -2 lambda_min |r| + (M^64/Sstar)(1+|r|)^2<0.'},
    {id:'growing-log-comparison',...exponentCheck([{coefficient:3,power:64},{coefficient:1,power:0}],66)},
    {id:'cutoff-collar-tail',...exponentCheck([{coefficient:50,power:71}],200),proof:'M^67-Sstar/(25 M^4)<=-Sstar/(50 M^4).'}
  ];
  const budgets=[
    {object:'R, R^-1, F, F^-1, |g0|, |g0|^-1, lambda0, lambda0^-1, |c0|, |c0|^-1, u_star',bound:'M',source:'Actual field formulas, Fscale bounds, normalized jet box, and u_star=2 R_env^10.'},
    {object:'all ordinary slow derivatives of F through order 3; (b/epsilon) through order 3',bound:'M',source:'Outward mean-patch jets; b/epsilon=-mConst/R and mConst<C^12.'},
    {object:'L_s/Sstar',bound:'1/M <= L_s/Sstar <= 1',source:'r0=2^-34, c_i in (1/(T_g*Sstar),1/Sstar], T_g<6, M>2^50.'},
    {object:'B_s',bound:'M^-3 <= B_s <= M',source:'1<=epsilon*k^2<=4 and lambda0/(epsilon*k^2*(1+u_star^2)^(3/2)).'},
    {object:'|p|, |p_z|',bound:'M^2',source:'Imean K_theta=0; |p-p_tilde|<=1/k; Sstar>=M^200.'},
    {object:'|n-n_ref|+|n_prime|',bound:'M^10/Sstar',source:'Affine normal (7.4), slow diameter <=4*Sstar^-3, actual F derivatives, and scalar epsilon inequality.'},
    {object:'|n_tan|, |n|',bound:'>=M^-4',source:'B_s minus the preceding normal error.'},
    {object:'|K_a-K|, |N_a-N|; |s_a-s|',bound:'M^15/Sstar; M^16/Sstar',source:'Normalized tangential vector and scalar quotient; their denominators are bounded below.'},
    {object:'|U-U_ref|, |B-B_ref|, |B_left-B_ref_left|',bound:'M^18/Sstar; M^22/Sstar; M^19/Sstar',source:'Explicit matrices (7.7)-(7.8), with the same frozen c0 and s.'},
    {object:'|A_phi-A_ref|',bound:'M^26/Sstar',source:'Projection difference, actual shear difference, and -n*n_prime^T/|n|^2.'},
    {object:'|B_prime|',bound:'M^29/Sstar',source:'Differentiate U*M; both derivatives of the normal and M_prime are retained.'},
    {object:'|B_left*(A_phi*B-B_prime)-diag(lambda,-lambda)|',bound:'M^64/Sstar',source:'Three product differences plus -B_left*B_prime; explicit exponent budget above.'},
    {object:'|d-d_ref|',bound:'M^20/Sstar <= M^64/Sstar',source:'epsilon*k^2*(|n|^2-|n_ref|^2).'},
    {object:'lambda(v)',bound:'>=M^-3',source:'lambda0/sqrt(1+s(v)^2), with |s(v)|<=3*u_star/2.'}
  ];
  return {
    schema:'MathScope.ActualMeanPatchPhaseBounds/1',profileId:SOURCE_PROFILE_ID,sourceHash:PINNED_N3.inputs.assembly.sha256,
    fixedM:'C12EnvelopeR^100',minimumM:'2^50',
    threshold:{ellLocalExact:'ceil(C12EnvelopeR^10000*h^-4)',QBoundExact:'2^(-ceil(C12EnvelopeR^10000*h^-4))',SstarLower:'M^200',
      qStarGlobalCertified:false,localSourceDomainCertified:true,integerCarrierMaterialized:false},
    domain:{sourcePatch:'Imean only',representativeY:[.25,4.75],boundingY:[0,5],eta:[-1,1],qOverQ:[.5,2],maxSlowCoordinateDistance:'4*Sstar^-3',relativeToTauBoundary:true},
    budgets,checks,pass:checks.every(c=>c.pass&&(c.uniform??true)),
    localPhaseNormalAndFrameBoundCertified:checks.every(c=>c.pass&&(c.uniform??true)),
    proofLevel:'Written analytic derivation with actual source normalization, executed outward third-jet bounds and exact integer exponent absorptions.',
    globalPhaseCertified:false,actualNonlinearBackgroundOutsidePatchConstructed:false,slowStressDirectionVariationCertified:false
  };
}

/** The actual fixed u_star is enormous; work with its *positive* inverse in every displayed coefficient. */
export function actualLeftGrowingDatum({samples=32}={}){
  if(!Number.isSafeInteger(samples)||samples<4||samples>256)invalid('Reference datum samples must be an integer from 4 through 256.');
  const cone=actualPulseConeChoice(),d=cone.inverseUStarEnclosure,d2=[0,nextUp(d[1]*d[1])],den=ipower(iadd(point(1),d2),1.5),root1=ipower(iadd(point(1),d2),.5),gamma=idiv(point(.5),den);
  const rows=Array.from({length:samples+1},(_,i)=>{
    const xi=i/samples,a=.5+xi,A=point(a),rootA=ipower(iadd(imul(A,A),d2),.5),ratio=idiv(iadd(A,rootA),iadd(point(1),root1));
    const polynomial=idiv(iadd(iscale(d2,a-1),iscale(isub(imul(imul(A,A),A),point(1)),1/3)),den);
    const logP=i*2===samples?zero():isub(ilog(ratio),polynomial),upper=iscale(gamma,-((xi-.5)**2));
    return {xi,sOverU:a,normalizedLogPInterval:logP,normalizedGaussianUpperInterval:upper,
      normalization:'u_star*log(P(v))/(lambda0*L_s)',sourcePath:'result.results.growingDatum.rows['+i+']',sourceHash:PINNED_N3.inputs.assembly.sha256};
  });
  return {
    schema:'MathScope.ActualLeftGrowingDatum/1',profileId:SOURCE_PROFILE_ID,sourceHash:PINNED_N3.inputs.assembly.sha256,
    observationKind:'NORMALIZED_REFERENCE_LOG_ENVELOPE',
    sourceEquation:'Lemma 7.4, (7.12), (7.17), (7.21)',
    frozenConeChoice:cone,
    initial:{location:'v=0',frameCoordinates:['P(0)','0'],dividedByP0:[1,0],logP0CoefficientInterval:rows[0].normalizedLogPInterval,
      positiveLogScale:positiveSymbol('lambda0*L_s/u_star'),logP0Exact:'(lambda0*L_s/u_star)*f(1/2,1/u_star)',
      physicalInitialVector:'B(0)*(P(0),0)^T',midpointUnitSeedUsed:false},
    scaledReferenceFormula:'f(a,delta)=log((a+sqrt(a^2+delta^2))/(1+sqrt(1+delta^2)))-((a-1)*delta^2+(a^3-1)/3)/(1+delta^2)^(3/2)',
    referenceGaussianCoefficient:gamma,rows,
    normalizedEvolution:{
      variables:['r=z_minus/z_plus','w=log(z_plus/P)'],initial:[0,0],
      ratioRhs:'E21+(-2*lambda+E22-E11)*r-E12*r^2',
      logRhs:'-(d-d_ref)+E11+E12*r',
      reconstruction:['x=P*exp(w)*(1+r)','y=c0*sqrt(1+s(v)^2)*P*exp(w)*(1-r)','t=x*(e_r-s_a*K_a)+y*N_a'],
      allDampingTermsRetained:true,pressure:'i*(n dot Kt-n_prime dot t)/(k*|n|^2) for m=1, f=0'
    },
    referenceOnly:true,actualAmplitudePointValuesEvaluated:false,actualSourceHRetained:true,positiveAmplitudeUnderflowNotZero:true,
    pass:rows[0].normalizedLogPInterval[1]<0&&rows.at(-1).normalizedLogPInterval[1]<0&&gamma[0]>0
  };
}

function localGrowingComparison(phase){
  return {
    schema:'MathScope.ActualMeanPatchGrowingComparison/1',profileId:SOURCE_PROFILE_ID,
    premiseSourceHash:phase.sourceHash,premiseChecksPass:phase.pass,
    sourceSystem:'Actual Imean K, affine n from (7.4), projected A_phi, d=epsilon*k^2*|n|^2; the rounded label is held fixed.',
    datum:'z_plus(0)=P(0)>0, z_minus(0)=0',
    ratioBound:'|z_minus/z_plus| <= M^68/Sstar < 1/4',
    invariantBarrier:'-2*M^-3*(M^68/Sstar)+(M^64/Sstar)*(1+M^68/Sstar)^2<0',
    logComparison:'|log(z_plus/P)| <= 3*M^64; |log(x/P)| <= M^66',
    actualValueGaussianUpper:'|t(v)| <= exp(M^67-M^-3*(v-L_s/2)^2/L_s)',
    actualRadialComparison:['exp(-M^66)*P(v) <= x(v)','x(v) <= exp(M^66)*P(v)'],
    cutoffCollar:'|v-L_s/2|>=L_s/5 implies log|t(v)| <= -Sstar/(50*M^4)',
    proofUsesFiniteSampling:false,
    actualLocalValueComparisonProved:phase.pass,
    proofLevel:'Local analytic invariant-barrier and Gaussian implication for the specified actual mean-patch velocity, with explicit constants. This is not numerical integration of amplitude values.',
    actualAmplitudeNumericallyIntegrated:false,allSlowDerivativeGaussianBoundsCertified:false,globalN505Certified:false
  };
}

export function actualMeanPatchPulseConstruction(input={},context={}){
  const known=['sourceProfile','y','eta','s','order','samples'];for(const k of Object.keys(input))if(!known.includes(k))invalid('Unknown actual pulse input: '+k);
  const {samples=32,...fieldInput}=input;context.checkCancelled?.();
  const meanPatch=evaluateActualMeanPatchJet(fieldInput),uniformJets=boundActualMeanPatchJets(fieldInput.order??3),phaseBounds=actualMeanPatchPhaseBounds(),growingDatum=actualLeftGrowingDatum({samples}),definitions=actualMeanPatchDefinitions();
  const phase={
    sourceProfile:SOURCE_PROFILE_ID,fieldSource:'meanPatch.jets',domain:'Actual Imean velocity only',
    exactFrozenParameters:{F0:'F at the chosen source representative',g0:'(-(2+2*lambda)*F0,0)',N:['-1','0'],K:['0','-1'],lambda0:'2*F0*sqrt(lambda)',c0:'-sqrt(lambda)',uStar:'2*C12EnvelopeR^10'},
    labelRounding:{k:'ceil(epsilon^-1/2)',pTilde:'sigma*R0*B_s*u_star/(L_s*(2+2*lambda)*F0)',kp:'sigma*max(1,floor(abs(k*pTilde)+1/2))',p:'kp/k',pz:'-B_s',ties:'Away from zero; replace zero by the sign of pTilde.',error:'|p-pTilde|<=1/k',materialized:false},
    normal:['sigma*B_s*u_star/2-v*p*F_R','p/R','-B_s-epsilon*v*p*F_Z'],
    normalDerivative:['-p*F_R','0','-epsilon*p*F_Z'],
    shearMatrix:[['0','-2*F','0'],['-2*lambda*F','0','0'],['0','0','0']],
    radialBackground:'b=-epsilon*mConst/R, with the actual positive pre-pulse cumulative moment',
    phaseDefect:'epsilon*v*p*F_T+b*n_r (G=0)',
    nonzeroAngularFrequencyByConstruction:true,zeroAxialNormalDerivativeAssumed:false,
    actualMatrixEntriesRepresentedBySourceExpressions:true,actualRoundedIntegerEvaluated:false
  };
  const growingComparison=localGrowingComparison(phaseBounds);
  return {schema:'MathScope.ActualMeanPatchPulseConstruction/1',profileId:SOURCE_PROFILE_ID,sourceHash:PINNED_N3.inputs.assembly.sha256,
    sourceBindings:structuredClone(ACTUAL_PULSE_BINDINGS),definitions,meanPatch,uniformJets,phase,phaseBounds,growingDatum,growingComparison,
    scalarThreshold:actualPulseScalarThreshold(),prerequisites:getActualPulsePrerequisites(),
    checks:[{id:'actual-local-field-jets',pass:uniformJets.pass&&meanPatch.normalizedValues.FOverFscale[0]>0},{id:'actual-local-phase-bound',pass:phaseBounds.pass},{id:'source-left-datum',pass:growingDatum.pass},{id:'actual-local-growing-value-bound',pass:growingComparison.actualLocalValueComparisonProved}],
    scope:{actualSourceRestriction:true,otherProfileOrToyHUsed:false,globalPhaseCertified:false,globalHomogeneousPulseCertified:false,globalCovarianceMatched:false,allOriginalN5CriteriaComplete:false},
    status:'PARTIAL',
    remaining:'This actual local field and pulse comparison covers Imean only. The completed background on the whole annulus, every required slow derivative Gaussian bound, and the actual heat-prepared T0 and covariance integrals remain unconstructed.'};
}
