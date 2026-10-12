/** Actual same-N3 pulse inputs. This does not supply the missing Proposition 5.5 background. */
import {PINNED_N3} from './source-profile-data.mjs';
import {assertSourceProfile,SOURCE_PROFILE_ID,sourceExponentContract} from './source-profile.mjs';

export const ACTUAL_PULSE_BINDINGS=Object.freeze({
  schema:'MathScope.ActualPulseSourceBindings/1',
  profileId:SOURCE_PROFILE_ID,
  paper:{url:'https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf',sha256:PINNED_N3.sourcePaperSHA256,equations:['4.7','4.26','4.30','5.44','6.1','6.11','7.2','7.4','7.6','7.8','7.12','7.17','7.21','7.27']},
  assembly:PINNED_N3.inputs.assembly,
  parameterExpressionSHA256:PINNED_N3.parameterExpressionSHA256,
  profileEvidenceSHA256:PINNED_N3.profileEvidenceSHA256,
  sourceFiles:[
    {path:'mathscope-m1/navier/followup-construction/outer.mjs',sha256:'4c0213f892a32611c79655fbe065cebbaca0fc9acdd0cf2dd057d2506a10c087',use:'Literal A.2 stage definitions only; the old finite parameter defaults are never used.'},
    {path:'mathscope-m1/navier/followup-20261010-symbolic-gluing/ONE_PROFILE_SPECIFICATION.md',sha256:'38d8a88220094cf2e6b2571f214f38361783669b646c0c08eb206eb2b9100bdd',use:'Selected parameters and unchanged Imean interval.'},
    {path:'mathscope-m1/navier/followup-20261010-final-stress-audit/GLOBAL_STRESS_ASSEMBLY_EN.md',sha256:'3c89af370fb2728bc407f5192493eb7474666051289626c57b73f19da7e59516',use:'Same-profile closed annulus margin and preserved fields; cumulative stress is not inferred from local fields.'},
    {path:'mathscope-m1/navier/followup-20261010-outer-reselection/OUTER_DERIVATION.md',sha256:'ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81',use:'Actual continuous outer datum and ordering of the pre-pulse reserved patches.'},
    {path:'mathscope-m1/navier/followup-20261010-same-datum-axis/GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md',sha256:'f27e8d640e9b8e49805c0128c987f043d5667c298b2029dd061b820ae9e3117b',use:'Premodulation real mixed derivative order four. Not a bound for the completed background.'},
    {path:'mathscope-m1/navier/followup-20261010-symbolic-gluing/LOOP_DERIVATIVE_ENVELOPE.md',sha256:'531e5addbe900564c22e0b44406c9c024e7d279c03a7188ea17431a567fe1250',use:'Fixed N3 loop derivative bounds, before constructing M2 coefficients.'},
    {path:'mathscope-m1/navier/followup-20261010-symbolic-gluing/C12_FREQUENCY_CONTRACT.md',sha256:'1740353222f1a5ca727c2c8a2c7063bba8a990f9a4393754256d5c82f49f7a16',use:'Same finite N3 modulation frequency and final direction margin.'}
  ]
});

export function getActualPulsePrerequisites(){
  return {
    schema:'MathScope.ActualPulsePrerequisites/1',profileId:SOURCE_PROFILE_ID,
    sourceHash:PINNED_N3.inputs.assembly.sha256,
    available:[
      {id:'selected-positive-h',type:'EXACT_EXPRESSION',source:'parametersExactExpressions.h'},
      {id:'selected-positive-lambda',type:'EXACT_EXPRESSION',source:'parametersExactExpressions.lambda'},
      {id:'closed-annulus-direction-margin',type:'ATTACHED_WRITTEN_ANALYTIC_BOUND',value:'C12EnvelopeR^-10',source:'attachedAnalyticConclusions.wholeClosedAnnulusDirectionalMargin'},
      {id:'unchanged-mean-patch-fields',type:'ACTUAL_LOCAL_EXPRESSION_AND_INTERVAL_JETS',source:'ONE_PROFILE_SPECIFICATION.md §4; GLOBAL_STRESS_ASSEMBLY_EN.md §6'},
      {id:'actual-core-mixed-comparison',type:'LIMITED_SOURCE_COMPARISON',domain:'|eta|<=rho/4; source finite mixed comparison is not a full annulus evaluator'}
    ],
    missing:[
      {id:'realized-background',criterion:'N5-04',requires:['N4-03','N4-04','N4-05'],type:'ACTUAL_BACKGROUND_JET_WITH_UNIFORM_BOUND',requiredDomain:'[Xlo,Xhi] x [-1,1] x (0,q_star)',reason:'Section 7 uses F,G of the Proposition 5.5 background, including its actual positive-order coefficient sequence and the constants in (5.42).'},
      {id:'phase-comparison-constant',criterion:'N5-04',type:'SOURCE_DERIVED_BOUND',requiredDomain:'Whole original annulus; the new Imean-only bounds do not supply this global input.',requiredQuantities:['normalErrorCoefficient','frameErrorCoefficient','dampingErrorCoefficient','slowDerivativeMajorants'],reason:'The scalar epsilon inequality alone supplies none of these coefficients.'},
      {id:'homogeneous-amplitude',criterion:'N5-05',type:'VALIDATED_ACTUAL_ODE_SOLUTION',requiredDatum:'z_plus(0)=P(0), z_minus(0)=0',reason:'The installed reference curve is not the solution of the actual projected system.'},
      {id:'actual-stress-covariance',criterion:'N5-06',type:'SAME_SOURCE_STRESS_AND_PULSE_QUADRATURE',requiredQuantities:['heatPreparedPrefixMoments','T0_star','Hcov','positiveWeights','globalSquaredPartition'],reason:'E,U on Imean alone do not determine its cumulative stress.'}
    ],
    completedBackgroundSupplied:false,wholeAnnulusPhaseCertified:false,actualHomogeneousPulseCertified:false,actualCovarianceMatched:false,
    canPromoteN504:false,canPromoteN505:false,canPromoteN506:false
  };
}

/** Prove the explicit scalar smallness condition for the *actual* h, for all subsequent bands. */
export function actualPulseScalarThreshold({sourceProfile=SOURCE_PROFILE_ID}={}){
  assertSourceProfile(sourceProfile);
  const L=8002n;
  const polynomial=8n*(4n+16n*L)-9n*L*L;
  const checks=[
    {id:'actual-positive-h',pass:sourceExponentContract().positive&&PINNED_N3.parametersExactExpressions.h.exp.product[0].integer===-8002},
    {id:'endpoint-log-majorant-negative',pass:polynomial<0n,exactNumerator:String(polynomial),denominator:'8'},
    {id:'endpoint-log-majorant-decreasing',pass:64n-9n*L<0n,exactNumerator:String(64n-9n*L),denominator:'4'},
    {id:'all-later-bands-monotone',pass:9n*L*L>32n,proof:'e^(3L)>=9L^2/2>16, so 4/ell-(h*log(2))/2<0 when ell>=h^-4.'},
    {id:'finite-observation-window-excluded',pass:900n<(1n<<4096n)&&8n**4n>2n,proof:'ell*h<1 on 8..900, hence epsilon>1/2 and ell^4*(epsilon+epsilon^2+1/k)>1.'}
  ];
  return {
    schema:'MathScope.ActualPulseScalarThreshold/1',profileId:SOURCE_PROFILE_ID,sourceHash:PINNED_N3.inputs.assembly.sha256,
    h:sourceExponentContract(),
    definitions:{L:'log(1/h)=8002*T',ellScalar:{ceil:{power:[{ref:'h'},-4]}},ellScalarExact:'ceil(h^(-4))',logEllBounds:['4*log(1/h)','4*log(1/h)+log(2)'],QScalarExact:'2^(-ceil(h^(-4)))',epsilon:'2^(-h*ell)',carrier:'ceil(2^(h*ell/2))',Sstar:'ell^2'},
    theorem:{domain:'Every integer ell >= ceil(h^-4)',inequality:'ell^4*(epsilon+epsilon^2+1/k) <= 1',usesFiniteSampling:false,positiveScalesMaterialized:false,
      proof:[
        'For epsilon in (0,1), epsilon+epsilon^2+1/k <= 3*sqrt(epsilon).',
        'At ell0=ceil(exp(4L)), ell0<=2*exp(4L), h*ell0>=exp(3L), and log(2)>1/2.',
        'Thus log(3*ell0^4*sqrt(epsilon)) <= log(48)+16L-exp(3L)/4 < 4+16L-9L^2/8.',
        'The last polynomial is negative and decreasing for L>=8002, as verified by exact integer arithmetic.',
        'The logarithmic derivative of ell^4*exp(-h*log(2)*ell/2) is negative for all ell>=ell0.'
      ]},
    checks,pass:checks.every(c=>c.pass),
    qStarCertified:false,
    scope:'One necessary scalar estimate from Lemma 7.1, now quantified at the actual h. The additional source normal, frame, stress-direction and completed-background conditions have not been certified by this estimate.'
  };
}

/** A legitimate fixed choice of u_star from the accepted *actual* cone margin. */
export function actualPulseConeChoice(){
  const p=PINNED_N3.parametersExactExpressions;
  const literal=JSON.stringify(p.directionalMarginKappa)===JSON.stringify({power:[{ref:'C12EnvelopeR'},-10]});
  return {
    schema:'MathScope.ActualPulseConeChoice/1',profileId:SOURCE_PROFILE_ID,sourceHash:PINNED_N3.inputs.assembly.sha256,
    kappaExact:'C12EnvelopeR^(-10)',uStarExact:'2*C12EnvelopeR^10',inverseUStarExact:'C12EnvelopeR^(-10)/2',
    inverseUStarEnclosure:[0,2**-1000],strictlyPositive:true,zeroIsEnclosureEndpointOnly:true,
    sourceInequality:'|c0*(T0_star dot K)/(T0_star dot N)|^2 <= 1-kappa/2',
    selectedDirectionRatioSquared:'u_star^2/(1+u_star^2)=4/(4+kappa^2)',
    exactSquaredMarginLower:'kappa/4',
    proof:'4/(4+kappa^2)-(1-kappa/2)=kappa/2-kappa^2/(4+kappa^2)>=kappa/4 for 0<kappa<=1.',
    envelopeProof:'C12EnvelopeR=exp(S^256), S=CSelected^100000, CSelected>2, hence 0<kappa/2<2^-1000.',
    frozenPointConeCertified:literal&&PINNED_N3.attachedAnalyticConclusions.wholeClosedAnnulusDirectionalMargin==='R^-10',
    slowNeighborhoodConeCertified:false,globalPulseConstructionCertified:false
  };
}
