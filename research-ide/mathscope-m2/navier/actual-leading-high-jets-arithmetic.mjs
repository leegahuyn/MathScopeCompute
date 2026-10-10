/** Finite, exact arithmetic for the higher-jet source estimates.
 * These universal calculations do not authenticate any supplied function.
 * The source-specific producer, in actual-leading-high-jets.mjs, supplies
 * the actual functions, positive denominators, domains and selected scales.
 */
import {rational as rat,qadd,qmul,qpow,qcompare,qtext,factorial,fail} from './actual-continuation-arithmetic.mjs';

const binomial=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const bits=n=>n===0n?0:n.toString(2).length;
const add=(a,b)=>{const r=new Map(a);for(const [k,v] of b)r.set(k,(r.get(k)??0n)+v);return r;};
const scale=(a,c)=>new Map([...a].map(([k,v])=>[k,v*c]).filter(([,v])=>v));
const mul=(a,b)=>{const r=new Map();for(const [i,u] of a)for(const [j,v] of b)r.set(i+j,(r.get(i+j)??0n)+u*v);return r;};
const monomial=(n,c=1n)=>new Map([[n,c]]),zero=()=>new Map();
const serialize=a=>[...a].sort(([i],[j])=>i-j).map(([power,coefficient])=>({power,coefficient:String(coefficient)}));
const degree=a=>a.size?Math.max(...a.keys()):-1;
const coefficientSum=a=>[...a.values()].reduce((s,x)=>s+x,0n);
const serialSummary=a=>({polynomial:serialize(a),degree:degree(a),coefficientSum:String(coefficientSum(a)),coefficientBits:bits(coefficientSum(a))});

/** A multivariable total Taylor norm can be majorized by one positive t
 * series: collect coefficients of equal total degree. This routine solves
 * the resulting coefficient inequality for F(x,w(x))=0. F_00=0 and the
 * F_01*w_n term have already been removed and inverted. Both the remaining
 * Taylor coefficients and the inverse slope are bounded by H.
 */
export function implicitTotalJetMajorant(order=6){
  if(!Number.isSafeInteger(order)||order<1||order>12)fail('INVALID_INPUT','The implicit jet arithmetic supports orders 1 through 12.');
  const w=Array.from({length:order+1},zero),one=monomial(0);
  const convolution=(a,b,n)=>Array.from({length:n+1},(_,k)=>{let r=zero();for(let j=0;j<=k;j++)r=add(r,mul(a[j]??zero(),b[k-j]??zero()));return r;});
  for(let n=1;n<=order;n++){
    let s=zero(),wp=[one,...Array.from({length:n},zero)];
    for(let j=0;j<=n;j++){
      if(j)wp=convolution(wp,w,n);
      for(let i=0;i+j<=n;i++){
        if((i===0&&j===0)||(i===0&&j===1))continue;
        s=add(s,wp[n-i]??zero());
      }
    }
    w[n]=mul(monomial(2),s);
  }
  return {schema:'MathScope.ImplicitTotalJetMajorant/1',order,convention:'sum of absolute Taylor coefficients of each total parameter degree',coefficientAndInverseSlopeUpper:'H',zeroConstantUnknown:true,linearUnknownCoefficientRemoved:true,rows:w.slice(1).map((a,i)=>({order:i+1,...serialSummary(a)})),universalArithmeticOnly:true};
}

/** A+2 mu Qdiag diag(z) is the actual B.8 Jacobian. Its inverse after
 * preconditioning has norm <2. The matrix and Q are eta-independent.
 * This is the ordinary-derivative recurrence, with the binomial factors.
 */
export function fixedQuadraticJetMajorant({order=8,rhsPower=4131}={}){
  if(!Number.isSafeInteger(order)||order<1||order>12||!Number.isSafeInteger(rhsPower)||rhsPower<1||rhsPower>100000)fail('INVALID_INPUT','Invalid fixed quadratic derivative budget.');
  const w=[zero()];
  for(let n=1;n<=order;n++){
    let s=monomial(rhsPower);
    for(let k=1;k<n;k++)s=add(s,scale(mul(w[k],w[n-k]),binomial(n,k)));
    w.push(scale(s,2n));
  }
  return {schema:'MathScope.FixedQuadraticJetMajorant/1',order,rhsPower,recurrence:'b_m=2*(C^rhsPower+sum_(1<=k<m) binom(m,k)b_k*b_(m-k))',jacobianAlreadyContainsZerothRoot:true,rows:w.slice(1).map((a,i)=>({order:i+1,...serialSummary(a)})),universalArithmeticOnly:true};
}

/** The actual outer amplitude solves a0(eta)+a1(eta)A+a2(eta)A^2=0,
 * |A|<=2, partial_A F>=7/20. All coefficient Taylor jets <=C^p.
 * Translate A=A(eta0)+w, with w(0)=0, before extracting degree m.
 * |F_m(A0)|<=7C^p, |(partial_A F)_m|<=5C^p, |(a2)_m|<=C^p.
 */
export function variableQuadraticJetMajorant({order=8,coefficientPower=50}={}){
  if(!Number.isSafeInteger(order)||order<1||order>12||!Number.isSafeInteger(coefficientPower)||coefficientPower<1||coefficientPower>100000)fail('INVALID_INPUT','Invalid varying quadratic derivative budget.');
  const w=[zero()];
  for(let n=1;n<=order;n++){
    let s=monomial(0,7n);
    for(let i=1;i<n;i++)s=add(s,scale(w[i],5n));
    for(let i=1;i<n;i++)for(let j=1;i+j<=n;j++)s=add(s,mul(w[i],w[j]));
    w.push(scale(mul(monomial(coefficientPower),s),3n));
  }
  return {schema:'MathScope.VariableQuadraticJetMajorant/1',order,coefficientPower,rows:w.slice(1).map((a,i)=>({order:i+1,...serialSummary(a)})),derivativeConvention:'Taylor; multiply the m-th row by m! for the ordinary eta derivative',positiveBranchDerivativeLower:'7/20',universalArithmeticOnly:true};
}

/** Execute the exact recurrence f^(k)=f P_k(1/t) for the *same* source
 * step. This extends its old eight-derivative estimate, not its definition.
 */
export function actualStepHighDerivativeAudit(order=12){
  if(!Number.isSafeInteger(order)||order<0||order>12)fail('INVALID_INPUT','The source-step audit supports orders 0 through 12.');
  let p=new Map([[0,1n]]);const polynomials=[];
  const exponentialBound=18n**18n,F=1n<<160n,G=2n*F,reciprocal=[128n],sigma=[];
  for(let k=0;k<=order;k++){
    const absSum=[...p.values()].reduce((s,v)=>s+(v<0n?-v:v),0n);
    polynomials.push({order:k,terms:[...p].sort(([a],[b])=>a-b).map(([power,c])=>({power,coefficient:String(c)})),degree:Math.max(...p.keys()),absoluteCoefficientSum:String(absSum),fDerivativeUpper:String(absSum*exponentialBound),fBoundPass:absSum*exponentialBound<F});
    const next=new Map();for(const [m,c] of p){next.set(m+3,(next.get(m+3)??0n)+2n*c);if(m)next.set(m+1,(next.get(m+1)??0n)-BigInt(m)*c);}p=next;
    if(k){let s=0n;for(let j=1;j<=k;j++)s+=G*reciprocal[k-j];reciprocal.push(128n*s);}
    const ordinary=factorial(k)*F*reciprocal.slice(0,k+1).reduce((s,x)=>s+x,0n);
    sigma.push({order:k,ordinaryUpper:String(ordinary),upperBits:bits(ordinary),pass:ordinary<(1n<<4096n)});
  }
  return {schema:'MathScope.ActualStepHighDerivativeAudit/1',order,polynomials,reciprocalTaylorBounds:reciprocal.map(String),sigma,commonOrdinaryDerivativeUpper:'2^4096',sourceDefinitionUnchanged:true,denominatorLowerProof:'f(t)+f(1-t)>=exp(-4)>1/128; e^4<3^4=81<128.',powerExponentialBound:'sup_(z>=0) z^m exp(-z^2) <=18^18 for 0<=m<=36',pass:polynomials.every(p=>p.fBoundPass)&&sigma.every(s=>s.pass)};
}

/** Formula (16), including Stirling expansion of (Y partial_Y)^r. */
export function actualNaturalMixedCoefficientAudit(order=12){
  if(!Number.isSafeInteger(order)||order<0||order>12)fail('INVALID_INPUT','The actual natural coefficient audit supports total orders 0 through 12.');
  const stirling=Array.from({length:order+1},()=>[]);stirling[0][0]=1n;
  for(let n=1;n<=order;n++)for(let k=0;k<=n;k++)stirling[n][k]=BigInt(k)*(stirling[n-1][k]??0n)+(k?stirling[n-1][k-1]??0n:0n);
  const rows=[];
  for(let r=0;r<=order;r++)for(let m=0;m+r<=order;m++){
    let coefficient=rat(0);
    for(let k=0;k<=r;k++){
      const a=stirling[r][k]??0n;if(!a)continue;
      coefficient=qadd(coefficient,qmul(rat(a*factorial(m+k),BigInt((m+1)**2)),qmul(qpow(rat(41,200),k),qpow(rat(200,159),m+k+1))));
    }
    rows.push({radialLogOrder:r,etaOrder:m,coefficient:qtext(coefficient),qPower:m+2,pass:qcompare(coefficient,rat(1n<<260n))<0});
  }
  return {schema:'MathScope.ActualNaturalMixedCoefficientAudit/1',order,source:'SAME_DATUM_ANALYTIC_AXIS.md (16)',realDomain:'0<=Y<=41/10, eta in [-1,1]',formula:'Q*rho^(-m)*sum_k S(r,k)*(41/200)^k*(m+k)!/(m+1)^2*(200/159)^(m+k+1)',QMinimum:'2^260',rhoInverseAtMostQ:true,rows,commonQPower:order+2,pass:rows.every(r=>r.pass)};
}

export function polynomialAbsorption(row,{baseBits=260,ordinaryOrder=0}={}){
  const sum=BigInt(row.coefficientSum)*factorial(ordinaryOrder),reserve=Math.max(1,Math.ceil(bits(sum)/baseBits));
  return {degree:row.degree,coefficientSumAfterFactorial:String(sum),coefficientBits:bits(sum),baseBits,reserve,strictPower:row.degree+reserve,pass:sum<(1n<<BigInt(baseBits*reserve))};
}

/** E_a^d times a fixed coefficient is <E_(a+1), E_a=exp(S^a).
 * log(coefficient)<=bitLength(coefficient) and S>=2^20 are enough.
 */
export function exponentialJetAbsorption(row,{from=22,to=23,Smin=1n<<20n}={}){
  Smin=BigInt(Smin);if(!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<1||to<=from||Smin<2n)fail('INVALID_INPUT','Invalid exponential jet scale.');
  const multiplier=BigInt(row.degree+row.coefficientBits+1),available=Smin**BigInt(to-from);
  return {from,to,multiplier:String(multiplier),available:String(available),pass:multiplier<available};
}

/** A deliberately enclosing template for one displayed loop-jet stage.
 * For H>=1 the finite jet norms of reciprocal, square root (with its
 * positive value and inverse bounded by H), and composition with at most
 * three inputs are all bounded by J(H)=H*sum_(k=0)^6(3H^2)^k.
 * Every displayed stage uses at most three nested such operations, at most
 * eight products, and a fixed coefficient factor less than2^80. This
 * template computes its exact degree and sum of coefficients without
 * serializing the large, irrelevant expanded polynomial.
 */
export function finiteLoopJetStageAudit(){
  const n=6,j=x=>{let sum=0n;for(let k=0;k<=n;k++)sum+=(3n*x*x)**BigInt(k);return x*sum;};
  let sum=1n,degree=1;
  for(let i=0;i<3;i++){sum=j(sum);degree*=2*n+1;}
  sum=(1n<<80n)*sum**8n;degree*=8;
  const coefficientBits=bits(sum),logMultiplier=degree+coefficientBits+1;
  return {schema:'MathScope.FiniteLoopJetStageAudit/1',order:n,template:'2^80*[J(J(J(H)))]^8; J(H)=H*sum_(k=0)^6(3H^2)^k',nestedOperations:3,productFactors:8,degree,coefficientSum:String(sum),coefficientBits,logMultiplier,strictMultiplierUpper:65536,pass:logMultiplier<65536,meaning:'If H=exp(S^a), the template is <exp(65536*S^a)<exp(S^(a+1)) at S>=2^20.'};
}

/** exp(C^200000) dominates a specified *computed* finite C power. */
export function finitePowerBelowInputExponential(power){
  if(!Number.isSafeInteger(power)||power<0||power>1000000000)fail('RESOURCE_LIMIT','Invalid finite source power.');
  const m=Math.ceil((power+2)/200000)+1,f=factorial(m),reserve=Math.max(1,Math.ceil(bits(f)/260)),remaining=200000*m-reserve;
  return {power,expSeriesTerm:m,factorialBits:bits(f),factorialReserveInC:reserve,remainingPower:remaining,pass:f<(1n<<BigInt(260*reserve))&&remaining>=power,proof:'exp(C^200000)>(C^200000)^m/m!; C>2^260.'};
}

export function evaluatePositiveJetPolynomial(row,at){
  at=BigInt(at);if(at<0n)fail('INVALID_INPUT','A positive majorant argument must be nonnegative.');
  return row.polynomial.reduce((s,{power,coefficient})=>s+BigInt(coefficient)*at**BigInt(power),0n);
}
