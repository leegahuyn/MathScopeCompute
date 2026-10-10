/** Constructive radial tail of the ACTUAL nonlinear B_rho solution.
 * The returned rational is scaled by Q*rho^-m, not a machine-sized error.
 * No comparison-function displacement or pressure approximation is used.
 */
import {rational as q,readRational,qadd,qsub,qmul,qdiv,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';

const factorial=n=>{let out=1n;for(let k=2;k<=n;k++)out*=BigInt(k);return out;};
const falling=(n,k)=>k>n?0n:factorial(n)/factorial(n-k);
const binomial=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const power=(x,n)=>{let a=q(1);for(let k=0;k<n;k++)a=qmul(a,x);return a;};

export function actualNaturalScaledTail(input={}){
  for(const key of Object.keys(input))if(!['sourceProfile','degree','Y','radialOrder','etaOrder'].includes(key))fail('INVALID_INPUT','Unknown actual radial-tail input '+key);
  const profile=assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID),N=input.degree??8,k=input.radialOrder??0,m=input.etaOrder??0,Y=readRational(input.Y??'41/10');
  if(!Number.isSafeInteger(N)||N<0||N>10000||!Number.isSafeInteger(k)||k<0||k>12||!Number.isSafeInteger(m)||m<0||m>12)fail('RESOURCE_LIMIT','The explicit rational tail supports 0<=N<=10000 and derivative orders 0..12.');
  if(qcompare(Y,q(0))<0||qcompare(Y,q(5))>0)fail('INVALID_INPUT','This uniform actual-core tail uses 0<=Y<=5.');
  if(N<k)fail('INVALID_INPUT','The retained degree must include the requested radial derivative.');
  const n=N+1;
  const ratio=qmul(qdiv(Y,q(20)),q(N+2+m,N+2-k));
  if(qcompare(ratio,q(1))>=0)fail('INSUFFICIENT_DEGREE','Increase the retained degree until the complete positive tail ratio is below one.');
  const first=qmul(q(factorial(m)*binomial(n+m,m)*falling(n,k),BigInt((m+1)**2)*20n**BigInt(n)*BigInt((n+1)**2)),power(Y,n-k));
  const bound=qdiv(first,qsub(q(1),ratio));
  return {schema:'MathScope.ActualNaturalScaledTail/1',profileId:profile.id,parameterExpressionSHA256:profile.parameterExpressionSHA256,degree:N,Y:qtext(Y),radialOrder:k,etaOrder:m,firstTerm:qtext(first),ratioUpper:qtext(ratio),scaledTailUpper:qtext(bound),scale:'Q*rho^(-etaOrder)',completeTailUpperExpression:{product:[{ref:'Q'},{power:[{ref:'rho'},-m]},{rational:qtext(bound)}]},sourceEquation:'SAME_DATUM_ANALYTIC_AXIS.md (20), with ||(Phi,u)||_rho <= Q',finiteCoefficientEnclosureErrorIncluded:false,fixedPositiveApproximationFloor:false,wholeFunctionNumericallyEvaluated:false};
}

/** A genuine (enormous) source modulus for every derivative used downstream.
 * For n>=65 and k,m<=4, binom(n+m,m)*(n)_k/(n+1)^2 <= 2^n.
 * Therefore on 0<=Y<=5 the complete tail after N>=64 is <=Q^(m+1)2^-N.
 */
export function actualNaturalRefinementModulus(input={}){
  for(const key of Object.keys(input))if(!['sourceProfile','bits','radialOrder','etaOrder'].includes(key))fail('INVALID_INPUT','Unknown actual refinement input '+key);
  const profile=assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID),bits=input.bits??128,k=input.radialOrder??0,m=input.etaOrder??0;
  if(!Number.isSafeInteger(bits)||bits<1||bits>100000||!Number.isSafeInteger(k)||k<0||k>4||!Number.isSafeInteger(m)||m<0||m>4)fail('RESOURCE_LIMIT','The simple uniform modulus supports bits 1..100000 and radial/eta orders 0..4.');
  const at65=69n**8n<=2n**65n,ratioAfter65=70n**8n<=2n*69n**8n;
  const qConstant=4000000n<2n**22n,exponentSlack=128040+282<131072;
  if(!at65||!ratioAfter65||!qConstant||!exponentSlack)fail('INTERNAL_VALIDATION','Actual radial modulus integer proof failed.');
  return {schema:'MathScope.ActualNaturalRefinementModulus/1',profileId:profile.id,parameterExpressionSHA256:profile.parameterExpressionSHA256,bits,radialOrder:k,etaOrder:m,YRange:['0','5'],
    retainedDegreeExpression:{sum:[{ceil:{product:[{integer:(m+1)*131072},{ref:'T'}]}},{integer:bits}]},
    retainedDegreeFormula:`ceil(${(m+1)*131072}*T)+${bits}`,tailUpperExpression:{power:[{integer:2},-bits]},
    proof:{firstPolynomialBoundAt65:at65,polynomialRatioAfter65:ratioAfter65,rhoInverseAtMostQ:true,logQBound:'Q=2^260*4000000*exp(64020*T) < 2^(131072*T); e<4, T>=1',qConstantProof:qConstant,exponentSlackProof:exponentSlack,tail:'For N>=64, the differentiated radial tail is <=Q^(m+1)*2^-N <=2^-bits.',coefficientNormSource:'Actual nonlinear fixed point, SAME_DATUM_ANALYTIC_AXIS.md sections 6–8'},
    costs:{degreeIsFarBeyondBinary64IntegerRange:true,degreeMaterialized:false,finiteCoefficientEvaluationErrorsStillNeedTheirOwnBudget:true,abstractConvergenceHasNoFixedErrorFloor:true},
    sameFunctionForEveryRefinement:true,observationPointChangesWithPrecision:false,actualGlobalMomentValuesAvailable:false};
}
