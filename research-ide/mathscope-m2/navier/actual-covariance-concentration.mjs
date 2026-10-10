/** Quantitative Gaussian/cone lemma for the actual two-column assembly.
 *
 * This module supplies an algebraic positive-constant recipe, not a source
 * field certificate. Its caller must bind E, d-dref, the moving frame and
 * Ls/S to the actual completed background before using any conclusion.
 * It never accepts an externally supplied completion flag.
 */
import {rational as Q,qadd,qsub,qmul,qdiv,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';

const keys=['h','kappa','u','lambdaLower','lambdaUpper','absoluteC0','operatorError','dampingError','unitFrameError','slopeError','lengthRatioLower','lengthRatioUpper'];

/** Every numeric-looking value in this receipt is a node of the caller's
 * exact positive expression graph. No source parameter is materialized as
 * binary64, and neither H nor its unknown incoming target is fabricated.
 */
export function covarianceConcentrationRecipe(G,input){
  if(!G||typeof G.q!=='function'||!Array.isArray(G.nodes)||!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k))||keys.some(k=>!Number.isSafeInteger(input[k])||!G.nodes[input[k]]))fail('INVALID_INPUT','Provide the complete exact-expression constants for the conditional covariance lemma.');
  const q=(n,d=1)=>G.q(n,d),one=G.one,{h,kappa,u,lambdaLower,lambdaUpper,absoluteC0,operatorError:E,dampingError:Ed,unitFrameError:Ef,slopeError:Es,lengthRatioLower:Lmin,lengthRatioUpper:Lmax}=input;
  const Ac=G.mul(absoluteC0,G.sqrt(G.add(one,G.pow(u,2)))),lambdaFloor=G.div(lambdaLower,G.mul(q(2),u));
  const coneK=G.div(G.mul(q(4),E),lambdaFloor),logRatioBound=G.mul(G.add(G.mul(q(2),E),Ed),Lmax);
  const amplitudeLower=G.mul(q(1,2),G.exp(G.neg(logRatioBound))),amplitudeUpper=G.mul(q(2),G.exp(logRatioBound));
  const gaussianLower=G.div(lambdaLower,G.mul(q(4),u)),gaussianUpper=G.div(G.mul(q(15),lambdaUpper),G.mul(q(2),u)),centralRadiusDenominator=G.maximum(one,G.mul(q(2),gaussianUpper));
  const massLowerCoefficient=G.div(G.pow(amplitudeLower,2),G.mul(q(15),centralRadiusDenominator));
  const absoluteMomentUpper=G.div(G.pow(amplitudeUpper,2),G.mul(q(2),gaussianLower));
  const concentrationK=G.div(absoluteMomentUpper,massLowerCoefficient);
  const normalColumnError=G.add(G.mul(q(6),coneK),G.mul(G.add(q(2),G.div(G.mul(q(2),u),Ac)),Ef));
  const tangentColumnError=G.add(G.div(Es,u),G.mul(G.add(q(2),G.div(G.mul(q(5),Ac),u)),Ef)),frameColumnK=G.maximum(normalColumnError,tangentColumnError);
  const columnBudget=G.div(kappa,q(128)),halfBudget=G.div(kappa,q(256));
  const conditions=[
    {id:'positive-unit-band-scale',lower:one,inequality:'S >= 1'},
    {id:'cone-ratio-at-most-one-half',lower:G.mul(q(2),coneK),inequality:'coneK/S <= 1/2'},
    {id:'pulse-length-at-least-one',lower:G.inv(Lmin),inequality:'Ls >= Lmin*S >= 1'},
    {id:'actual-slope-at-most-two-u',lower:G.div(G.mul(q(2),Es),u),inequality:'|s_a-s| <= u/2'},
    {id:'normalized-frame-column-budget',lower:G.div(frameColumnK,halfBudget),inequality:'frameColumnK/S <= kappa/256'},
    {id:'normalized-concentration-budget',lower:G.div(G.pow(G.div(concentrationK,halfBudget),2),Lmin),inequality:'concentrationK/sqrt(Ls) <= kappa/256'},
  ];
  const Sminimum=G.maximum(...conditions.map(c=>c.lower)),frequencyBandMinimum=G.pow(G.div(q(64),h),2);
  const ellMinimum=G.ceiling(G.maximum(q(8),Sminimum,frequencyBandMinimum)),qStar=G.exp(G.neg(G.mul(G.add(ellMinimum,q(4)),G.log(q(2)))));
  return {schema:'MathScope.CovarianceConcentrationRecipe/1',input:{...input},
    premises:{sourceBindingRequired:true,parameters:'0<h<1, 0<kappa<=1, u=2/kappa>=2, 0<lambdaLower<=lambda0<=lambdaUpper, c0=-absoluteC0<0, E,Ed,Ef,Es>=0, 0<Lmin<=Ls/S<=Lmax',
      negativeC0Required:true,c0Root:G.neg(absoluteC0),
      exactSolution:'z_prime=(diag(lambda,-lambda)+E_actual-d*I)z; z(0)=(P(0),0); |E_actual_ij|<=E/S, |d-dref|<=Ed/S',
      exactFrame:'t=Bz, x=t_r=z_plus+z_minus, B=[e_r-s_a*K_a+c0*sqrt(1+s^2)*N_a, e_r-s_a*K_a-c0*sqrt(1+s^2)*N_a]',
      frameBounds:'N,K and N_a,K_a are oriented orthonormal pairs; |K_a-K|,|N_a-N|<=Ef/S, |s_a-s|<=Es/S',
      cutoffs:'0<=psi<=1 and psi=1 on [Ls/4,3Ls/4]; 0<=v<=Ls, s=sign*(u/2+u*v/Ls)',
      actualGlobalBackgroundRequired:true},
    cone:{lambdaFloor,coneK,ratio:'|z_minus/z_plus|<=coneK/S<=1/2',logRatioBound,amplitudeLower,amplitudeUpper,
      amplitude:'amplitudeLower*P <= x <= amplitudeUpper*P',
      inwardProof:'r_prime=E21+(-2*lambda+E22-E11)*r-E12*r^2. At r=+beta, beta=4E/(lambdaFloor*S)<=1, r_prime<=(E/S)*(1-8+2*beta+beta^2)<=-4E/S; the lower boundary is symmetric. E=0 gives r=0 exactly.',
      positivity:'z_plus is the positive exponential solution of its scalar equation after the invariant ratio is inserted; x=(1+r)*z_plus>0.'},
    gaussian:{lower:gaussianLower,upper:gaussianUpper,
      bounds:'exp(-gaussianUpper*(v-Ls/2)^2/Ls) <= P(v) <= exp(-gaussianLower*(v-Ls/2)^2/Ls)',
      derivativeIdentity:'-Ls*(lambda-dref)_prime = lambda0*u*|s|*((1+s^2)^(-3/2)+2*(1+u^2)^(-3/2))',
      continuousProof:'u>=2 and u/2<=|s|<=3u/2 give lambdaLower/(2u) <= -Ls*(lambda-dref)_prime <= 7*lambdaUpper/u <= 15*lambdaUpper/u. The lower bound uses (5/4)^3<4. Integrate from the exact zero at v=Ls/2.'},
    mass:{centralRadiusDenominator,massLowerCoefficient,absoluteMomentUpper,concentrationK,
      I0:'Integral_0^Ls psi^2*x^2 dv >= massLowerCoefficient*sqrt(Ls)',
      I1:'Integral_0^Ls (|v-Ls/2|/Ls)*psi^2*x^2 dv <= absoluteMomentUpper',
      ratio:'I1/I0 <= concentrationK/sqrt(Ls)',
      lowerProof:'For |v-Ls/2|<=sqrt(Ls)/(10a), a=max(1,2*gaussianUpper), psi=1 and P^2>=exp(-1/100)>1/3. Integrate over the interval of length sqrt(Ls)/(5a).',
      upperProof:'Extend the nonnegative integrand to the real line and set w=2*gaussianLower*(v-Ls/2)^2/Ls. The absolute first moment equals amplitudeUpper^2/(2*gaussianLower).',
      noGaussianLimitSubstituted:true},
    columns:{Ac,normalColumnError,tangentColumnError,frameColumnK,columnBudget,
      exactH:'H_sign=(|det(v_r,v_t)|/2)*(Integral chi^2 dxi)*c_i*Integral psi^2*x*t_tan dv',
      exactPositiveMass:'h_sign=(|det(v_r,v_t)|/2)*(Integral chi^2 dxi)*c_i*Integral psi^2*x^2 dv > 0',
      normalizedRows:'C_1sign=-(N dot H_sign)/(Ac*h_sign); C_2sign=(K dot H_sign)/(u*h_sign)',
      idealColumns:'[[1,1],[-1,1]] for sign=+1,-1',
      error:'max_ij |C_ij-Cideal_ij| <= concentrationK/sqrt(Ls)+frameColumnK/S <= kappa/128',
      normalProof:'|(1-r)/(1+r)-1|<=4*beta; sqrt(1+s^2)/sqrt(1+u^2)<=3/2; |s_a|<=2u. Normal-row error <=6*beta+(2+2u/Ac)*Ef/S.',
      tangentProof:'Tangent-row error <=Es/(u*S)+(2+5*Ac/u)*Ef/S. Both reference normalized rows differ from their midpoint value by at most |v-Ls/2|/Ls; the factor u cancels.',
      signsAreColumnsInsideOneSlowBox:true,angularHalfIncluded:true,haarJacobianIncluded:true},
    selection:{conditions,Sminimum,frequencyBandMinimum,ellMinimum,qStar,
      bandProof:'ell>=ellMinimum>=Sminimum>=1 implies S=ell^2>=Sminimum. For ell>=(64/h)^2, log(3)+4log(ell)-(h*log(2)/2)*ell<0, using log(2)>=1/2 and log(ell)<=sqrt(ell). Hence S^2*(epsilon+epsilon^2+k^-1)<=3ell^4*2^(-h*ell/2)<1.',
      activeBandBuffer:4,higherDerivativeOrdersChangeQStar:false,
      additionalSourceConditionsMustBeMerged:true},
    scope:{conditionalAnalyticLemma:true,actualOperatorBoundsProducedHere:false,actualUniformHColumnsCertified:false,sourceUniformQStarCertified:false,originalN506Complete:false,numericQuadratureExecuted:false,formalKernelProof:false}};
}

/** Small exact inequalities used by the continuum proof. They are not
 * samples of the source annulus or of its pulse amplitude.
 */
export function covarianceConcentrationScalarAudit(){
  const rows=[],add=(id,left,relation,right)=>{const c=qcompare(left,right),pass=relation==='<'?c<0:relation==='<='?c<=0:relation==='>'?c>0:c===0;rows.push({id,left:qtext(left),relation,right:qtext(right),pass});};
  add('lower-growth-root-removal',Q(125,64),'<',Q(4));
  add('upper-growth-two-terms',qadd(Q(4),Q(3)),'<=',Q(15));
  add('riccati-inward-at-unit-boundary',qadd(qsub(Q(1),Q(8)),qadd(Q(2),Q(1))),'=',Q(-4));
  add('positive-radial-factor',qsub(Q(1),Q(1,2)),'=',Q(1,2));
  add('amplitude-factor-upper',qadd(Q(1),Q(1,2)),'<',Q(2));
  add('central-cutoff-radius',Q(1,10),'<',Q(1,4));
  add('gaussian-central-square-lower',qsub(Q(1),Q(1,100)),'>',Q(1,3));
  add('mass-lower-factor',qmul(Q(1,5),Q(1,3)),'=',Q(1,15));
  add('normal-cone-factor',qmul(Q(3,2),Q(4)),'=',Q(6));
  add('tangent-frame-factor',qmul(Q(3,2),Q(3)),'<',Q(5));
  add('two-error-budgets',qadd(Q(1,256),Q(1,256)),'=',Q(1,128));
  add('band-linear-absorption',qsub(qdiv(Q(64),Q(4)),Q(4)),'=',Q(12));
  return {schema:'MathScope.CovarianceConcentrationScalarAudit/1',checks:rows,pass:rows.every(r=>r.pass),sourceFieldCertificate:false};
}
