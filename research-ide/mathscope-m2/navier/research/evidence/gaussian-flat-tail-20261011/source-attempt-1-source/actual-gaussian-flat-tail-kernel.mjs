/** Exact scalar calculus and summability used by the original pulse tail.
 * These are generic lemmas until a private source constructor binds their
 * arguments. A Gaussian reference alone is not an amplitude estimate.
 */
import {factorial,fail} from './actual-continuation-arithmetic.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';

const root=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G?.nodes?.[x];
const integer=(x,name)=>{if(!Number.isSafeInteger(x)||x<0)fail('INVALID_INPUT',name+' is a nonnegative safe integer.');return x;};
const choose=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const same=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:100000});
const positive=(G,x,name)=>{if(!root(G,x)||G.isq(x)&&G.fraction(x)[0]<=0n)fail('INVALID_INPUT',name+' must be an exact positive expression.');};

export function originalPulseTimeCutoff(G,v,length){
  if(!root(G,v))fail('INVALID_INPUT','Retain the pulse coordinate.');positive(G,length,'length');
  const tau=G.div(v,length),scaled=G.div(G.mul(G.q(20),v),length),left=G.sub(scaled,G.q(4)),right=G.sub(G.q(16),scaled);
  return {tau,left,right,psi:G.mul(G.step(left),G.step(right)),
    support:['1/5','4/5'],plateau:['1/4','3/4'],tailDistanceFromMidpoint:'1/4',
    definition:'sigma_2(20*v/L-4)*sigma_2(16-20*v/L)',sourceAuthenticated:false};
}

/** No supplied jet arrays: every derivative comes from the retained body.
 * The finite budget is explicit; there is no mathematical order cutoff.
 */
export function differentiatedOriginalPulseTail(G,input={}){
  const keys=['v','length','psi','forcing','amplitude','order','maxWork'];
  if(!input||Object.keys(input).some(k=>!keys.includes(k)))fail('INVALID_INPUT','Use original scalar bodies and an explicit finite work budget.');
  const {v,length,psi,forcing,amplitude}=input,order=integer(input.order??2,'order'),maxWork=integer(input.maxWork??10000,'maxWork');
  if((order+2)*(order+3)>maxWork)fail('RESOURCE_LIMIT','The requested tail derivative expansion exceeds the finite work budget.');
  if(G.nodes[v]?.op!=='coordinate'||![length,psi,forcing,amplitude].every(x=>root(G,x))||G.dependsOn(length,v))fail('INVALID_INPUT','Use a coordinate, v-independent length, and three retained scalar bodies.');
  const original=originalPulseTimeCutoff(G,v,length),binding=same(G,psi,original.psi);
  if(!binding.pass)fail('INVALID_SOURCE_CONSTRUCTION','The temporal cutoff differs from the original two-step body.');
  const jets=(body,n)=>{const a=[body];for(let j=1;j<=n;j++)a.push(G.derivative(a.at(-1),v));return a;};
  const pj=jets(psi,order+1),fj=jets(forcing,order),tj=jets(amplitude,order),body=G.add(G.mul(G.sub(G.one,psi),forcing),G.mul(pj[1],amplitude)),direct=jets(body,order),rows=[];
  for(let m=0;m<=order;m++){
    const fTerms=[],tTerms=[];
    for(let j=0;j<=m;j++){
      fTerms.push(G.mul(G.q(choose(m,j)),j?G.neg(pj[j]):G.sub(G.one,psi),fj[m-j]));
      tTerms.push(G.mul(G.q(choose(m,j)),pj[j+1],tj[m-j]));
    }
    const forcingTail=G.add(...fTerms),cutoffDerivativeTail=G.add(...tTerms),expected=G.add(forcingTail,cutoffDerivativeTail),identity=same(G,direct[m],expected);
    if(!identity.pass)fail('INTERNAL_VALIDATION','A retained temporal cutoff derivative term is missing.');
    rows.push({order:m,direct:direct[m],forcingTail,cutoffDerivativeTail,expected,identity});
  }
  return {schema:'MathScope.ExactOriginalPulseTailDerivatives/1',order,original,binding,body,psiJets:pj,forcingJets:fj,amplitudeJets:tj,rows,
    supportProof:'On the open plateau [L/4,3L/4], 1-psi and every positive psi derivative vanish. All retained tail terms are therefore supported where |v-L/2|>=L/4 inside [0,L].',
    equation:'D_v^m[(1-psi)f+psi_prime*t]=sum_j binom(m,j)[D_v^j(1-psi)D_v^(m-j)f+D_v^(j+1)psi D_v^(m-j)t]',
    arbitraryForcingZeroExtensionRequiresItsOwnBoundaryHypothesis:true,sourceAuthenticated:false,actualAmplitudeGaussianBoundDerived:false,pass:true};
}

/** Actual fixed smooth-step norms, as finite positive integral expressions.
 * Sup |sigma^(j)| <= 1+Integral(sigma^(j+1))^2 for j>=1 follows from FTC
 * and Cauchy-Schwarz on [0,1]; sigma^(j)(0)=0. No quadrature is used.
 */
export function originalPulseTimeCutoffBounds(G,{order=2,maxWork=10000}={}){
  integer(order,'order');integer(maxWork,'maxWork');if((order+3)**2>maxWork)fail('RESOURCE_LIMIT','The cutoff bound expansion exceeds its finite work budget.');
  const x=G.fresh('original_pulse_sigma_bound_x'),sigma=G.step(x),sigmaJets=[sigma],stepBounds=[G.one];
  for(let j=1;j<=order+2;j++)sigmaJets.push(G.derivative(sigmaJets.at(-1),x));
  for(let j=1;j<=order+1;j++)stepBounds.push(G.add(G.one,G.integral(G.pow(sigmaJets[j+1],2),x,G.zero,G.one)));
  const rows=Array.from({length:order+2},(_,m)=>({order:m,coefficient:G.mul(G.q(20n**BigInt(m)),G.add(...Array.from({length:m+1},(_,j)=>G.mul(G.q(choose(m,j)),stepBounds[j],stepBounds[m-j])))),lengthPower:-m}));
  return {schema:'MathScope.OriginalPulseTimeCutoffBounds/1',x,sigma,sigmaJets,stepBounds,rows,
    estimate:'sup_[0,L] |D_v^m psi| <= rows[m].coefficient * L^(-m)',
    proof:'Leibniz for the two original step factors; their inner slopes are +20/L and -20/L. Each step derivative is zero outside [0,1], and the FTC square integral bounds it inside.',
    boundsIndependentOfBandAndRepresentative:true,originalStepNotReplaced:true,numericalQuadratureExecuted:false,sourceAuthenticated:false};
}

/** If a>0, ell>=1, b,p,N>=0 and q in[2^(-ell-1),2^(-ell+1)],
 * ell^b * 2^(p*ell) * exp(-a*ell^2) <= C_N*q^N.
 * Every unknown amplitude/physical prefactor remains outside this lemma.
 */
export function gaussianFlatSummabilityRecipe(G,input={}){
  const keys=['gaussian','polynomialOrder','powerLoss','flatOrder','firstBand'];
  if(!input||Object.keys(input).some(k=>!keys.includes(k)))fail('INVALID_INPUT','Use the exact Gaussian exponent and the finite polynomial/power orders.');
  const a=input.gaussian,J=input.firstBand,b=integer(input.polynomialOrder??0,'polynomialOrder'),p=integer(input.powerLoss??0,'powerLoss'),N=integer(input.flatOrder??0,'flatOrder');
  positive(G,a,'gaussian');positive(G,J,'firstBand');
  if(G.isq(J)&&(G.fraction(J)[0]<G.fraction(J)[1]||G.fraction(J)[1]!==1n))fail('INVALID_INPUT','The first band must be an integer at least one.');
  const q=(n,d=1)=>G.q(n,d),log2=G.log(q(2)),linear=G.add(q(b),G.mul(G.add(q(p),q(N)),log2)),constant=G.mul(G.exp(G.mul(q(N),log2)),G.exp(G.div(G.pow(linear,2),G.mul(q(2),a)))),
    halfGaussian=G.div(a,q(2)),first=G.exp(G.neg(G.mul(halfGaussian,G.pow(J,2)))),ratio=G.exp(G.neg(G.mul(halfGaussian,G.add(G.mul(q(2),J),G.one)))),
    summabilityLinear=G.add(q(b),G.mul(q(p),log2)),summabilityConstant=G.exp(G.div(G.pow(summabilityLinear,2),G.mul(q(2),a))),tail=G.div(G.mul(summabilityConstant,first),G.sub(G.one,ratio));
  const ell=G.fresh('gaussian_flat_ell'),d=G.fresh('gaussian_flat_tail_offset'),youngLeft=G.sub(G.add(G.mul(halfGaussian,G.pow(ell,2)),G.div(G.pow(linear,2),G.mul(q(2),a))),G.mul(linear,ell)),youngRight=G.div(G.pow(G.sub(G.mul(a,ell),linear),2),G.mul(q(2),a)),
    gapLeft=G.sub(G.sub(G.pow(G.add(J,d),2),G.pow(J,2)),G.mul(G.add(G.mul(q(2),J),G.one),d)),gapRight=G.mul(d,G.sub(d,G.one)),
    checks=[{id:'retained-Young-square',...same(G,youngLeft,youngRight)},{id:'integer-Gaussian-tail-gap',...same(G,gapLeft,gapRight)}];
  if(!checks.every(r=>r.pass))fail('INTERNAL_VALIDATION','The exact Gaussian flatness or geometric tail identity failed.');
  return {schema:'MathScope.GaussianFlatSummabilityRecipe/1',input:{gaussian:a,polynomialOrder:b,powerLoss:p,flatOrder:N,firstBand:J},roots:{linear,constant,halfGaussian,first,ratio,summabilityConstant,tail},checks,
    bound:'ell^b*2^(p*ell)*exp(-a*ell^2) <= constant*q^N*exp(-a*ell^2/2) <= constant*q^N',
    tail:'sum_(ell>=J) ell^b*2^(p*ell)*exp(-a*ell^2) <= tail',
    proof:'log(ell)<=ell for ell>=1. q^(-N)<=2^(N*(ell+1)). Complete the nonnegative Young square. For integer d>=0, (J+d)^2>=J^2+(2J+1)d, so the remaining positive Gaussian sum is geometric with 0<ratio<1.',
    sourceAuthenticated:false,amplitudeBoundsAuthenticated:false,actualGlobalResidualFlatnessProved:false,thresholdDependsOnFlatOrder:false,pass:true};
}
