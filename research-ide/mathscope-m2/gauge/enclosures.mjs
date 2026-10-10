/** Directed binary64 enclosures of positive series; no Math.exp oracle. */
import {check} from './contracts.mjs';
const bits=new DataView(new ArrayBuffer(8));
export function nextUp(x){if(x===Infinity)return x;if(x===0)return Number.MIN_VALUE;bits.setFloat64(0,x);let u=bits.getBigUint64(0);u+=x>0?1n:-1n;bits.setBigUint64(0,u);return bits.getFloat64(0);}
export const nextDown=x=>-nextUp(-x);
export const point=x=>({lower:x,upper:x});
export const add=(a,b)=>({lower:nextDown(a.lower+b.lower),upper:nextUp(a.upper+b.upper)});
export const sub=(a,b)=>({lower:nextDown(a.lower-b.upper),upper:nextUp(a.upper-b.lower)});
export function mul(a,b){const p=[a.lower*b.lower,a.lower*b.upper,a.upper*b.lower,a.upper*b.upper];return {lower:nextDown(Math.min(...p)),upper:nextUp(Math.max(...p))};}
export function div(a,b){check(b.lower>0||b.upper<0,'INVALID_INPUT','A certified denominator interval contains zero.');return mul(a,{lower:nextDown(1/b.upper),upper:nextUp(1/b.lower)});}
export function pow(a,n){check(Number.isInteger(n)&&n>=0&&n<=1000,'INVALID_INPUT','Bounded nonnegative interval exponent required.');let b=point(1);for(let k=0;k<n;k++)b=mul(b,a);return b;}
export const midpoint=a=>(a.lower+a.upper)/2;
export const radius=a=>nextUp(Math.max(Math.abs(midpoint(a)-a.lower),Math.abs(a.upper-midpoint(a))));
export function sqrt(a){
  check(a.lower>=0&&Number.isFinite(a.upper),'INVALID_INPUT','A square-root enclosure requires a finite nonnegative interval.');
  let lower=a.lower===0?0:nextDown(Math.sqrt(a.lower)),upper=a.upper===0?0:nextUp(Math.sqrt(a.upper));
  while(lower>0&&mul(point(lower),point(lower)).upper>a.lower)lower=nextDown(lower);
  while(upper>0&&mul(point(upper),point(upper)).lower<a.upper)upper=nextUp(upper);
  return {lower,upper};
}
export function expEnclosure(x){
  check(Number.isFinite(x)&&Math.abs(x)<=100,'INVALID_INPUT','Certified exponential input must be in [-100,100].');
  if(x===0)return point(1);if(x<0)return div(point(1),expEnclosure(-x));
  let term=point(1),sum=point(1),terms=0,tail=Infinity;
  for(let n=1;n<=512;n++){
    term=div(mul(term,point(x)),point(n));sum=add(sum,term);terms=n;
    const next=div(mul(term,point(x)),point(n+1)),ratio=nextUp(x/(n+2));
    if(ratio<1){tail=nextUp(next.upper/nextDown(1-ratio));if(tail<Math.max(1,sum.lower)*1e-17)break;}
  }
  check(Number.isFinite(tail),'BUDGET_EXCEEDED','Positive exponential series did not reach a finite remainder.');
  return {lower:Math.max(0,sum.lower),upper:nextUp(sum.upper+tail),seriesTerms:terms,tailUpper:tail};
}
export function besselI(n,x){
  check(Number.isInteger(n)&&n>=0&&n<=128&&Number.isFinite(x)&&x>=0&&x<=20,'INVALID_INPUT','Integer modified-Bessel order 0..128 and x in [0,20] required.');
  if(x===0)return {...point(n===0?1:0),terms:1,tailUpper:0};
  const half=point(x/2),quarterSquare=mul(half,half);let term=point(1);
  for(let j=1;j<=n;j++)term=div(mul(term,half),point(j));
  let sum=term,tail=Infinity,terms=1;
  for(let k=0;k<512;k++){
    const next=div(mul(term,quarterSquare),point((k+1)*(n+k+1))),ratio=nextUp(quarterSquare.upper/((k+2)*(n+k+2)));
    if(ratio<1){tail=nextUp(next.upper/nextDown(1-ratio));if(tail<Math.max(Number.MIN_VALUE,sum.lower)*1e-16)break;}
    term=next;sum=add(sum,term);terms++;
  }
  check(Number.isFinite(tail),'BUDGET_EXCEEDED','Bessel series failed its explicit tail bound.');
  return {lower:Math.max(0,sum.lower),upper:nextUp(sum.upper+tail),terms,tailUpper:tail,method:'I_n(x)=sum_k (x/2)^(n+2k)/(k!(n+k)!), outward arithmetic plus a geometric positive-tail bound'};
}
export function su2Reference(beta){
  check(Number.isFinite(beta)&&beta>=0&&beta<=20,'INVALID_INPUT','SU2 reference beta must be in [0,20].');
  if(beta===0)return {partition:point(1),meanTrace:point(0),secondMoment:point(.25),beta,method:'Exact normalized SU2 Haar moments'};
  const i1=besselI(1,beta),i2=besselI(2,beta),i3=besselI(3,beta),ratio=div(i2,i1);
  // d/d beta log(I1/beta)=I2/I1; cos²(theta)=(1+chi_1)/4.
  return {partition:mul(expEnclosure(-beta),div(mul(point(2),i1),point(beta))),meanTrace:ratio,secondMoment:div(add(point(1),mul(point(3),div(i3,i1))),point(4)),beta,coefficients:{i1,i2,i3},method:'Positive modified-Bessel series with outward geometric remainders; independent of the Markov transition and matrix multiplication'};
}
export function characterEigenvalue(twoJ,beta){
  check(Number.isInteger(twoJ)&&twoJ>=0&&twoJ<=64,'INVALID_INPUT','2j cutoff must be an integer in [0,64].');
  check(Number.isFinite(beta)&&beta>=0&&beta<=20,'INVALID_INPUT','Character-kernel beta must lie in [0,20].');
  if(twoJ===0)return point(1);if(beta===0)return point(0);
  return div(besselI(twoJ+1,beta),besselI(1,beta));
}
export function characterTailBound(firstOmittedTwoJ,beta){
  const n=firstOmittedTwoJ+1;
  if(beta===0)return 0;
  if(n<beta/2)return 1;
  // For m>=n: I_m <= (beta/2)^m/m! exp(beta²/[4(m+1)]).
  // The displayed majorant decreases once m>=beta/2.
  let leading=point(1);for(let j=1;j<=n;j++)leading=div(mul(leading,point(beta/2)),point(j));
  return Math.min(1,div(mul(leading,expEnclosure(nextUp(beta*beta/(4*(n+1))))),besselI(1,beta)).upper);
}
export function weightedSpinMajorant(beta){
  // n! >= 2^(n-1) and I1>=beta/2 give kappa_j <= q^(2j).
  if(beta===0)return 0;
  return Math.min(1,mul(point(beta/4),expEnclosure(nextUp(beta*beta/12))).upper);
}
export function taylorExponentialTail(norm,degree=28){
  check(norm>=0&&norm<=100&&Number.isInteger(degree)&&degree>=0,'INVALID_INPUT','Bounded matrix exponential tail required.');
  let first=point(1);for(let j=1;j<=degree+1;j++)first=div(mul(first,point(norm)),point(j));
  const ratio=nextUp(norm/(degree+2));
  return ratio<1?nextUp(first.upper/nextDown(1-ratio)):mul(expEnclosure(norm),first).upper;
}
export const ENCLOSURE_POLICY={arithmetic:'IEEE-754 binary64 +,-,*,/ with one representable number of outward rounding at every operation',transcendentals:'Exponential and integer-order modified Bessel values are enclosed by explicit positive series and remainder inequalities, independently of platform transcendental functions.',notExactRational:'Bounds are directed floating enclosures; no Lean kernel certificate is asserted.'};
