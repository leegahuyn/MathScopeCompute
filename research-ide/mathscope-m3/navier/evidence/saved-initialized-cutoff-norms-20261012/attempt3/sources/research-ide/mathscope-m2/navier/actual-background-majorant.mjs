/** Quantitative same-N3 order-one bounds on the original common inner collar.
 * All constants below are derived from retained source inequalities.  There
 * is no user-supplied C_n, strip, exponent, or leading-profile replacement.
 */
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';
import {ACTUAL_BACKGROUND_INPUTS} from './actual-background-data.mjs';

const integer=n=>({integer:String(n)}),ref=name=>({ref:name}),mul=(...a)=>({product:a}),pow=(a,n)=>({power:[a,n]}),div=(a,b)=>({quotient:[a,b]}),sum=(...a)=>({sum:a});

export function actualBackgroundMajorant({profileId=SOURCE_PROFILE_ID,order=1,bits=128}={}){
  const source=assertSourceProfile(profileId);
  if(order!==1)throw Error('The derived source norm is for n=1. Higher n requires the actual preceding finalized coefficients.');
  if(!Number.isSafeInteger(bits)||bits<16||bits>4096)throw Error('bits must be an integer from 16 to 4096.');
  const quantities={
    delta:div(ref('rho'),mul(integer(1024),ref('Q'))),
    aSquared:mul(ref('Xa'),{exp:div(ref('t1'),integer(16))}),
    a:{sqrt:ref('aSquared')},
    radialBaseBound:div(mul(integer(4096),pow(ref('Lambda'),2),pow(ref('Q'),3)),ref('t1')),
    vOverXBound:div(mul(integer(28),ref('radialBaseBound')),ref('delta')),
    omegaOverXBound:div(mul(integer(4096),pow(ref('radialBaseBound'),2)),pow(ref('delta'),2)),
    matrixInfinityNormBound:div(mul(integer(512),ref('radialBaseBound')),ref('delta')),
    forcingInfinityNormBound:div(mul(integer(65536),pow(ref('radialBaseBound'),2)),pow(ref('delta'),2)),
    C1:div(mul(integer(262144),pow(ref('radialBaseBound'),2)),pow(ref('delta'),2)),
    sourceStripRadius:div(ref('delta'),integer(4)),
    solutionStripRadius:div(ref('delta'),integer(8)),
    cauchyRadiusLoss:div(ref('delta'),integer(8)),
    picardA:mul(ref('C1'),ref('a')),
    truncationIndex:{max:[integer(1),{ceil:div(mul(integer(72),pow(ref('picardA'),2)),ref('cauchyRadiusLoss'))},integer(Math.ceil(bits/2))]},
    tailUpper:pow(integer(2),-bits),
  };
  const derivation=[
    {id:'actual-B-rho',input:'same actual nonlinear infinite Phi,u; ||Phi||_B_rho,||u||_B_rho <= Q',result:'For |Y|<=5, dist(eta,I)<=rho/4: |dY^k deta^m f| <= Q*2^(k+m+1)*(k+m)!/(20^k*rho^m).',source:ACTUAL_BACKGROUND_INPUTS.inputs.axisProof},
    {id:'nonzero-Phi-on-selected-strip',input:'actual Phi(Y,eta)>=1/4 on real 0<=Y<=4.1; |Phi_eta|<=4Q/rho',result:'On dist(eta,[-1,1])<=delta=rho/(1024Q): |Phi|>=1/4-1/256=63/256>1/8; |1/Phi|<8.'},
    {id:'actual-activation-not-natural-extension',input:'0<=y<=t1/16<t1; reference in B.26 still equals the natural profile',result:'F_s=g*Phi(4)*exp(integral_0^y kappa(s)*[Y*Phi_Y/Phi](4 exp(s),eta) ds); U_s=U_nat(4)+Lambda^-1*integral_0^y kappa(s)*Y*u_Y(4 exp(s),eta) ds; kappa=1-(1-t1)*sigma(y/t1).'},
    {id:'fixed-collar-nonvanishing',input:'C>=Q, t1=C^-120; 4 exp(t1/16)<4.1; 8Q*t1<1',result:'On the whole common interval and S_delta: |F|<=6Q, |U|<=6, |Pi|<=2Q; no later loop or correction modifies this interval.'},
    {id:'actual-radial-derivatives',input:'|Y Phi_Y/Phi|<=8Q; |d_y(Y Phi_Y/Phi)|<=80Q^2; |sigmaPrime|<9; X>=4/Lambda in activation',result:'|F_XX|<=2048 Lambda^2 Q^3/t1; |U_XX|<=2 Lambda Q/t1; |Pi_X|=|F^2|<=36Q^2; |Pi_XX|<=144 Lambda Q^3. B=4096 Lambda^2 Q^3/t1 bounds X derivatives 0..2 of F,U,Pi on S_delta.',source:ACTUAL_BACKGROUND_INPUTS.inputs.stepDerivative},
    {id:'reconstructed-radial-field',input:'v=V0/X=[2 eta U0-2D eta A_XU0-d*deta(A_XU0)]/L; |L^-1|<=2; radial average is a contraction',result:'On S_(delta/2), |dX^k v|<=28B/delta (k=0,1,2). On S_(delta/4), |deta v|<=112B/delta^2. No division by X at the axis is evaluated.'},
    {id:'actual-order-one-forcing',input:'Omega0/X= L^-1[D eta v_eta+v+Xv_X]+v*(v/2+Xv_X)+U0*L^-1[d v_eta-2 eta(v+Xv_X)]-2*(2v_X+Xv_XX)',result:'|Omega0/X|<=4096B^2/delta^2. For b=-A-1/2 and c=-A, |Z_(b-D) Z_b F0|, |Z_(c-D) Z_c U0|<=4096B/delta^2. Hence ||f1||_infty<=65536B^2/delta^2.'},
    {id:'six-component-system',input:'W=(F1,U1,K1,Pi1,d_xi F1,d_xi U1), F1=phi1/C; original diagonal (0,0,2,0,3,1)',result:'All A0/A1 row sums <=512B/delta. A1 and all eta derivatives map coordinates 1..4 to 5..6 and kill 5..6. C1=2^18 B^2/delta^2 exceeds twice both matrix and forcing norms.'},
    {id:'Picard-remainder-without-smallness-assumption',input:'A=C1*a, Delta=delta/8, p_k=ceil(k/2); B_k=A^(k+1)/(k+1)! * max(1,p_k/Delta)^p_k',result:'For k>=1, B_k <= [3A/sqrt(2 Delta (k+1))]^(k+1), using (k+1)! >= ((k+1)/3)^(k+1). If k>=K and K>=ceil(72A^2/Delta), then B_k<=4^(-k-1). Thus sum_(k>=K) B_k<=4^(-K)/3<=2^(-bits).'},
  ];
  return {schema:'MathScope.ActualOrderOnePicardMajorant/1',profileId,parameterExpressionSHA256:source.parameterExpressionSHA256,sourceInputs:ACTUAL_BACKGROUND_INPUTS.inputs,order,unknownScaling:'The six-component system is conjugated by diag(1/C,1,1,1,1/C,1); no leading amplitude or h is changed.',exactExpressions:{...source.parametersExactExpressions,...quantities},derivedConstants:quantities,commonInterval:{X:['0','Xa*exp(t1/16)'],xi:['0','sqrt(Xa*exp(t1/16))'],independentOfOrder:true,parameterIndependent:true,extendsStrictlyIntoActualActivation:true,endsBeforeAnyModulation:true},analyticStrip:{source:'dist(eta,[-1,1])<delta/4',solution:'dist(eta,[-1,1])<delta/8',loss:'delta/8',nonvanishingPhiLower:'63/256'},picard:{diagonal:[0,0,2,0,3,1],zeroAxisDatum:[0,0,0,0,0,0],term:'K^k G f1',inverse:'(Gg)_i(xi)=xi*integral_0^1 t^c_i*g_i(t*xi) dt',atMostEtaDerivatives:'ceil(k/2)',tailBeginsAt:'K',tailUpperExact:`1/2^${bits}`,truncationIndexExpression:quantities.truncationIndex,truncationActuallyEvaluated:false,arithmeticEncoding:'EXACT_FINITE_INTEGER_EXPRESSION; not materialized as an enormous decimal integer'},derivation,scope:{sameProfileSourceNormBoundDerived:true,actualCommonCollarCovered:true,actualOrderOneForcingBoundDerived:true,convergentPicardDefinitionAndTailDerived:true,numericalPicardTruncationCompleted:false,higherOrdersDerived:false,globalFiveMomentRepairComplete:false,finiteBackgroundResidualDecayVerified:false,newLeanKernelExecution:false},sourceEquations:['5.7','5.8','B.26','B.6'],certificateType:'WRITTEN_ANALYTIC_DERIVATION_WITH_EXECUTED_EXACT_ARITHMETIC_CHECKS; not a Lean proof or a evaluated K-term numerical solution'};
}

/** Ordinary-size evaluation of the universal tail inequality, for independent
 * positive and negative controls.  It never accepts a source C1 override.
 */
export function auditPicardTailInequality({A,deltaLoss,bits=32,K=null}={}){
  if(!(Number.isFinite(A)&&A>0&&Number.isFinite(deltaLoss)&&deltaLoss>0&&deltaLoss<=1))throw Error('Use finite positive audit A and 0<Delta<=1.');
  if(!Number.isSafeInteger(bits)||bits<1||bits>1000)throw Error('Invalid audit precision.');
  const needed=Math.max(1,Math.ceil(72*A*A/deltaLoss),Math.ceil(bits/2));
  const k=K??needed;if(!Number.isSafeInteger(k)||k<1)throw Error('Finite positive audit truncation index required.');
  return {scope:'UNIVERSAL_TAIL_ARITHMETIC_AUDIT_ONLY',sameProfileNumericalSolution:false,K:k,needed,ratioBase:3*A/Math.sqrt(2*deltaLoss*(k+1)),condition:k>=needed,tailLog2Upper:-2*k-Math.log2(3),targetLog2:-bits,pass:k>=needed&&3*A/Math.sqrt(2*deltaLoss*(k+1))<=.25&&-2*k-Math.log2(3)<=-bits};
}
