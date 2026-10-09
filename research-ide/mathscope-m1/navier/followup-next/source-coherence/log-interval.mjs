/** Directed logarithms, exponentials and the actual A.5 step.
 * Integer range reduction occurs before any fixed-point conversion, so tiny
 * positive rationals never become zero merely because their logarithm is wanted.
 */
import {createDyadic} from './dyadic.mjs';

export function createLogIntervals(bits=1024) {
  let operations=0;
  const D=createDyadic(bits,()=>{if(++operations>3000000)throw new Error('Log interval operation limit exceeded');});
  const logSeries=z=>{
    // 0 <= z <= 1/3. The positive series has a geometric upper remainder.
    const zz=D.mul(z,z);let term=z,sum=z;
    const N=Math.ceil(bits/3)+16;
    for(let k=1;k<=N;k++){term=D.mul(term,zz);sum=D.add(sum,D.scaleBy(term,`1/${2*k+1}`));}
    const next=D.mul(term,zz);
    const tail=D.div(D.scaleBy(next,`1/${2*N+3}`),D.sub(D.one,zz));
    return D.scaleBy([sum[0],D.add(sum,tail)[1]],2);
  };
  const ln2=logSeries(D.q('1/3'));
  function logQ(v) {
    let [n,d]=D.rat(v);if(n<=0n||d<=0n)throw new Error('A logarithm needs a strictly positive exact rational');
    let k=n.toString(2).length-d.toString(2).length;
    let a=k>=0?n:n<<BigInt(-k),b=k>=0?d<<BigInt(k):d;
    if(a<b){a*=2n;k--;}else if(a>=2n*b){b*=2n;k++;}
    if(!(a>=b&&a<2n*b))throw new Error('Logarithmic range reduction failed');
    const z=D.q(`${a-b}/${a+b}`);
    return D.add(logSeries(z),D.scaleBy(ln2,k));
  }
  const logI=a=>{
    if(a[0]<=0n)throw new Error('Positive lower interval endpoint required for logarithm');
    return [logQ(`${a[0]}/${D.scale}`)[0],logQ(`${a[1]}/${D.scale}`)[1]];
  };
  function expQ(v) {
    let [n,d]=D.rat(v);if(d<=0n)throw new Error('Positive denominator required');
    if(n<0n)return D.inv(expQ(`${-n}/${d}`));
    if(n>BigInt(bits)*d)throw new Error('Exponential is too large; retain its exact logarithm instead');
    let k=0;while(8n*n>d){d*=2n;k++;}
    const x=D.q(`${n}/${d}`);let term=D.one,sum=D.one;
    const N=Math.ceil(bits/8)+24;
    for(let j=1;j<=N;j++){term=D.scaleBy(D.mul(term,x),`1/${j}`);sum=D.add(sum,term);}
    const next=D.scaleBy(D.mul(term,x),`1/${N+1}`);
    const tail=D.div(next,D.sub(D.one,D.scaleBy(x,`1/${N+2}`)));
    let out=[sum[0],D.add(sum,tail)[1]];
    for(let j=0;j<k;j++)out=D.mul(out,out);
    return out;
  }
  const expI=a=>[expQ(`${a[0]}/${D.scale}`)[0],expQ(`${a[1]}/${D.scale}`)[1]];
  function step(v) {
    const [n,d]=D.rat(v);if(d<=0n)throw new Error('Positive denominator required');
    if(n<=0n)return D.zero;if(n>=d)return D.one;
    const aNum=d*d*(n*n-(d-n)*(d-n)),aDen=n*n*(d-n)*(d-n);
    const positive=aNum>=0n,abs=positive?aNum:-aNum;
    const small=abs>=BigInt(bits)*aDen?[0n,1n]:expQ(`${-abs}/${aDen}`);
    return positive?D.inv(D.add(D.one,small)):D.div(small,D.add(D.one,small));
  }
  function logStep(v) {
    const [n,d]=D.rat(v);if(d<=0n||n<=0n||n>=d)throw new Error('The interior log-step requires 0 < t < 1');
    const an=d*d*(n*n-(d-n)*(d-n)),ad=n*n*(d-n)*(d-n),positive=an>=0n,abs=positive?an:-an;
    const small=abs>=BigInt(bits)*ad?[0n,1n]:expQ(`${-abs}/${ad}`);
    const correction=D.neg(logI(D.add(D.one,small)));
    // log sigma = a - log(1+exp(a)) for a<0; retaining a separately
    // preserves resolution arbitrarily close to the flat endpoint.
    return {offsetExact:positive?'0':`${an}/${ad}`,remainder:correction};
  }
  return {D,logQ,logI,expQ,expI,step,logStep,operations:()=>operations,
    method:'Exact integer range reduction, positive Taylor series, geometric remainder, and outward dyadic arithmetic; binary64 values are display only.'};
}
