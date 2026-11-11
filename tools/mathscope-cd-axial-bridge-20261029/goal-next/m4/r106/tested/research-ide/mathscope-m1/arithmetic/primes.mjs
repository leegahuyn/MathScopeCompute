import {bigint,small,fail,isqrt,powmod,gcd,hash,canonical,meter as makeMeter} from './exact.mjs';

export const PRIME_DOMAIN=Object.freeze({schema:'MathScope.PrimeDomain/1',kind:'SYMBOLIC_INFINITE_SET',definition:'{ n : Nat | Nat.Prime n }',enumeration:'Every completed request covers only its stated finite interval.',leanDefinition:'MathScope.M1.Arithmetic.PrimeSet'});
export function trialPrime(n,meter=null) {n=bigint(n);if(n<2n)return false;if(n===2n)return true;if(n%2n===0n)return false;for(let d=3n;d*d<=n;d+=2n){meter?.tick();if(n%d===0n)return false;}return true;}
export function baseSieve(bound,meter=null) {
  const n=small(bound,'basePrimeBound',0,2000000),mark=new Uint8Array(n+1);mark.fill(1,2);
  for(let p=2;p*p<=n;p++)if(mark[p])for(let k=p*p;k<=n;k+=p){mark[k]=0;meter?.tick();}
  const primes=[];for(let p=2;p<=n;p++)if(mark[p])primes.push(BigInt(p));return primes;
}
/* Independent Euler/least-prime-factor oracle, not a segmented Eratosthenes replay. */
export function linearPrimeOracle(bound,meter=null) {const n=small(bound,'oracleBound',0,2000000),lp=new Uint32Array(n+1),ps=[];for(let i=2;i<=n;i++){if(!lp[i]){lp[i]=i;ps.push(i);}for(const p of ps){if(p>lp[i]||p*i>n)break;lp[p*i]=p;meter?.tick();}}return ps.map(String);}
function normalizedInterval(a,b) {a=bigint(a,'a');b=bigint(b,'b');if(a<0n||b<0n)fail('INPUT_RANGE','Prime interval endpoints must be nonnegative.');return {a:a<=b?a:b,b:a<=b?b:a,reversed:a>b};}
export async function segmentedPrimes(input={},budget={},context={}) {
  const m=context.meter??makeMeter(budget,context),range=normalizedInterval(input.a??2,input.b??1000);
  const segmentSize=small(input.segmentSize??1048576,'segmentSize',1,1048576);
  const maxIntegers=small(budget.maxIntegers??2097152,'maxIntegers',1,8388608);
  const maxBase=small(budget.maxBasePrime??2000000,'maxBasePrime',2,2000000);
  if(range.b-range.a+1n>BigInt(maxIntegers))fail('RESOURCE_LIMIT','This finite interval exceeds the request width budget.',{maxIntegers,next:'Request consecutive tiles; the symbolic prime domain has no final endpoint.'});
  const bound=isqrt(range.b);if(bound>BigInt(maxBase))fail('RESOURCE_LIMIT','The complete base-prime table exceeds the request budget.',{requiredBaseBound:bound.toString(),maxBasePrime:maxBase,alternative:'primeCertificate or nextPrime with a certificate budget'});
  const base=baseSieve(bound,m),baseStrings=base.map(String),baseHash=await hash(baseStrings);
  const checkpoint=input.checkpoint??null,segments=[];let next=range.a;
  if(checkpoint){if(checkpoint.schema!=='MathScope.PrimeCheckpoint/1'||checkpoint.a!==range.a.toString()||checkpoint.b!==range.b.toString())fail('CHECKPOINT_MISMATCH','Checkpoint belongs to a different normalized interval.');const verified=await verifyPrimeSegments(checkpoint.segments,range.a,BigInt(checkpoint.next)-1n,{requireFull:true,meter:m});if(!verified.pass)fail('CHECKPOINT_INVALID','Checkpoint prefix failed completeness verification.',verified);segments.push(...checkpoint.segments);next=BigInt(checkpoint.next);if(next<range.a||next>range.b+1n)fail('CHECKPOINT_INVALID','Checkpoint cursor is outside the interval.');}
  for(let lo=next;lo<=range.b;){m.tick(0);const hi=lo+BigInt(segmentSize)-1n<range.b?lo+BigInt(segmentSize)-1n:range.b;const flags=new Uint8Array(Number(hi-lo+1n));flags.fill(1);
    if(lo===0n){flags[0]=0;if(hi>=1n)flags[1]=0;}else if(lo===1n)flags[0]=0;
    for(const p of base){if(p*p>hi)break;let start=((lo+p-1n)/p)*p;if(start<p*p)start=p*p;for(let n=start;n<=hi;n+=p){flags[Number(n-lo)]=0;m.tick();}}
    const primes=[];for(let i=0;i<flags.length;i++){m.tick();if(flags[i])primes.push((lo+BigInt(i)).toString());}
    const payload={schema:'MathScope.PrimeSegment/1',a:lo.toString(),b:hi.toString(),basePrimeBound:bound.toString(),basePrimeHash:baseHash,primes};
    const segment={...payload,hash:await hash(payload)};segments.push(segment);lo=hi+1n;
    await m.checkpoint({schema:'MathScope.PrimeCheckpoint/1',a:range.a.toString(),b:range.b.toString(),next:lo.toString(),segments});
  }
  const primes=segments.flatMap(s=>s.primes),rawHash=await hash({a:range.a.toString(),b:range.b.toString(),primes});
  return {schema:'MathScope.PrimeIntervalResult/1',domain:PRIME_DOMAIN,normalizedInterval:{a:range.a.toString(),b:range.b.toString(),inputReversed:range.reversed},status:'COMPLETE_FINITE_INTERVAL',intervalCount:{kind:'INTEGER',value:String(primes.length)},piAtUpper:range.a<=2n?{kind:'INTEGER',value:String(primes.length)}:null,primes,segments,baseCertificate:{bound:bound.toString(),primes:baseStrings,hash:baseHash,method:'ERATOSTHENES_COMPLETE_TABLE',rule:'Any composite n has a prime divisor at most floor(sqrt(n)).'},rawHash,operations:m.operations,coverage:{completed:[[range.a.toString(),range.b.toString()]],uncomputed:'PrimeSet outside the completed finite interval'}};
}
export async function verifyPrimeSegments(segments,a,b,{requireFull=true,meter=null}={}) {
  a=bigint(a);b=bigint(b);if(!Array.isArray(segments))return{pass:false,reason:'segments missing'};
  if(b<a)return{pass:segments.length===0,method:'EMPTY_PREFIX'};
  const oracle=b<=2000000n?new Set(linearPrimeOracle(b,meter)):null;let next=a,total=0;
  for(const s of segments){if(s.schema!=='MathScope.PrimeSegment/1'||bigint(s.a)!==next||bigint(s.b)<next||bigint(s.b)>b)return{pass:false,reason:'Gap, overlap, or wrong interval'};
    const{hash:digest,...payload}=s;if(await hash(payload)!==digest)return{pass:false,reason:'Segment hash mismatch'};
    if(bigint(s.basePrimeBound)<isqrt(bigint(s.b)))return{pass:false,reason:'Incomplete square-root base-prime range'};
    const expected=[];for(let n=bigint(s.a);n<=bigint(s.b);n++){meter?.tick();if(oracle?oracle.has(String(n)):trialPrime(n,meter))expected.push(String(n));}
    if(canonical(expected)!==canonical(s.primes))return{pass:false,reason:'Prime omissions, composites, duplicates, or wrong order'};total+=expected.length;next=bigint(s.b)+1n;
  }
  return {pass:!requireFull||next===b+1n,reason:requireFull&&next!==b+1n?'Missing terminal segment':null,count:total,method:oracle?'INDEPENDENT_LINEAR_SIEVE':'INDEPENDENT_TRIAL_DIVISION'};
}
export async function* streamInterval(input,budget={},context={}) {const range=normalizedInterval(input.a??2,input.b??1000),width=small(input.segmentSize??1048576,'segmentSize',1,1048576);if(input.checkpoint)fail('UNSUPPORTED_CHECKPOINT_MODE','Use segmentedPrimes for prefix checkpoint resume; the lazy iterator yields one independent tile at a time.');for(let lo=range.a;lo<=range.b;){const hi=lo+BigInt(width)-1n<range.b?lo+BigInt(width)-1n:range.b;const result=await segmentedPrimes({...input,a:String(lo),b:String(hi),segmentSize:width},budget,context);yield result.segments[0];lo=hi+1n;}}

/* Lucas/Pratt certificates use a complete factorization of n-1 and checked child certificates. */
export function verifyPrimeCertificate(cert,{maxNodes=4096,maxDepth=64,meter=null}={}) {
  let nodes=0;const visit=(c,depth)=>{if(++nodes>maxNodes||depth>maxDepth)return false;if(!c||c.scheme!=='LUCAS_PRATT')return false;let n;try{n=bigint(c.n,'certificate n',256);}catch{return false;}if(n===2n)return c.base===true;
    if(n<3n||n%2n===0n||!Array.isArray(c.factors)||c.factors.length===0)return false;let product=1n;const seen=new Set();for(const f of c.factors){let q,e;try{q=bigint(f.q,'q',256);e=small(f.exponent,'exponent',1,4096);}catch{return false;}if(seen.has(String(q))||q>=n||q<2n||f.certificate?.n!==String(q)||!visit(f.certificate,depth+1))return false;seen.add(String(q));product*=q**BigInt(e);if(product>n-1n)return false;}
    if(product!==n-1n)return false;let w;try{w=bigint(c.witness,'witness',256);}catch{return false;}if(w<2n||w>=n||powmod(w,n-1n,n,meter)!==1n)return false;return c.factors.every(f=>gcd(powmod(w,(n-1n)/BigInt(f.q),n,meter)-1n,n)===1n);};
  const pass=visit(cert,0);return {pass,status:pass?'PRIME_CERTIFIED':'UNKNOWN',scheme:'LUCAS_PRATT',checkedNodes:nodes,scope:'Exact integer certificate verification; a failed certificate alone is not a compositeness proof.'};
}
export function generatePrimeCertificate(n,{meter=null,maxTrialDivisor=100000,maxWitness=256}={}) {
  n=bigint(n,'n',256);const cache=new Map();const rec=(x,depth=0)=>{if(depth>48)fail('RESOURCE_LIMIT','Pratt recursion depth exhausted.');if(cache.has(String(x)))return cache.get(String(x));if(x===2n)return{scheme:'LUCAS_PRATT',n:'2',base:true};if(x<2n||x%2n===0n)return null;
    let rest=x-1n;const factors=[];for(let d=2n;d*d<=rest;d=d===2n?3n:d+2n){meter?.tick();if(d>BigInt(maxTrialDivisor))return null;if(rest%d===0n){let e=0;do{rest/=d;e++;}while(rest%d===0n);const child=rec(d,depth+1);if(!child)return null;factors.push({q:String(d),exponent:e,certificate:child});}}
    if(rest>1n){const child=rec(rest,depth+1);if(!child)return null;factors.push({q:String(rest),exponent:1,certificate:child});}
    for(let a=2n;a<x&&a<=BigInt(maxWitness);a++){meter?.tick();if(powmod(a,x-1n,x,meter)!==1n)continue;if(factors.every(f=>gcd(powmod(a,(x-1n)/BigInt(f.q),x,meter)-1n,x)===1n)){const c={scheme:'LUCAS_PRATT',n:String(x),witness:String(a),factors};cache.set(String(x),c);return c;}}return null;};
  if(n<2n)return{status:'COMPOSITE',reason:'n < 2',certificate:null};for(let d=2n;d<=1000n&&d*d<=n;d=d===2n?3n:d+2n){meter?.tick();if(n%d===0n)return{status:'COMPOSITE',divisor:String(d),certificate:null};}
  const certificate=rec(n);if(certificate){const check=verifyPrimeCertificate(certificate,{meter});if(!check.pass)fail('INTERNAL_CERTIFICATE','Generated primality certificate failed its independent verifier.');return{status:'PRIME_CERTIFIED',certificate,verification:check};}
  return{status:'UNKNOWN',certificate:null,reason:'Complete n-1 factorization or Lucas witness not obtained within the certificate budget.'};
}
export function nextPrime(after,budget={},context={}) {let n=bigint(after)+1n;const m=context.meter??makeMeter(budget,context),limit=small(budget.maxCandidates??1000,'maxCandidates',1,100000);for(let i=0;i<limit;i++,n++){m.tick();const result=generatePrimeCertificate(n,{meter:m});if(result.status==='PRIME_CERTIFIED')return{n:String(n),...result,checkedCandidates:i+1};if(result.status==='UNKNOWN')return{status:'UNKNOWN',nextUnresolved:String(n),reason:'Cannot certify that no prime was skipped.'};}return{status:'RESOURCE_LIMIT',nextUnresolved:String(n),reason:'Candidate budget exhausted.'};}

const ceilDiv=(a,b)=>(a+b-1n)/b;
function logReduced(n,d,bits) {const scale=1n<<BigInt(bits),zn=n-d,zd=n+d,zlo=zn*scale/zd,zhi=ceilDiv(zn*scale,zd),sqlo=zlo*zlo/scale,sqhi=ceilDiv(zhi*zhi,scale);let plo=zlo,phi=zhi,lo=0n,hi=0n;const terms=Math.ceil((bits+8)/3)+2;for(let j=0;j<terms;j++){const odd=BigInt(2*j+1);lo+=plo/odd;hi+=ceilDiv(phi,odd);plo=plo*sqlo/scale;phi=ceilDiv(phi*sqhi,scale);}return{lo:2n*lo,hi:2n*hi+ceilDiv(scale,3n**BigInt(2*terms)),terms};}
export function logIntegerInterval(n,bits=64) {n=bigint(n);bits=small(bits,'logBits',24,128);if(n<1n)fail('LOG_DOMAIN','Integer logarithm requires n >= 1.');if(n===1n)return{lo:0n,hi:0n,bits};const e=n.toString(2).length-1,d=1n<<BigInt(e),a=logReduced(n,d,bits),two=logReduced(2n,1n,bits);return{lo:a.lo+BigInt(e)*two.lo,hi:a.hi+BigInt(e)*two.hi,bits};}
export function primeStatistics(result,input={},meter=null) {
  const cutoffUpper=BigInt(result.normalizedInterval.b),a=BigInt(result.normalizedInterval.a);if(a>2n) return{intervalCount:result.intervalCount,piAtUpper:null,psi:null,reason:'Global counting functions require coverage from 2.'};
  const xs=String(input.statisticsAt??cutoffUpper);if(!/^\d+(\.\d+)?$/.test(xs))fail('INPUT_RANGE','statisticsAt must be a nonnegative decimal real.');const b=BigInt(xs.split('.')[0]);if(b>cutoffUpper)fail('INSUFFICIENT_PRIME_COVERAGE','statisticsAt requires prime coverage from 2 through floor(x).');const included=result.primes.filter(p=>BigInt(p)<=b);
  if(b<2n)return{x:xs,pi:{kind:'INTEGER',value:'0'},psi:{kind:'EXACT_LOG_LINEAR_COMBINATION',terms:[],exactValue:'0'},Li2:{status:'UNSUPPORTED_DOMAIN',definition:'Li2(x) is supported for x >= 2'},xOverLogX:null};
  const terms=[];let lower=0n,upper=0n;const bits=small(input.logBits??64,'logBits',24,128);
  if(input.includePsi!==false){for(const s of included){const p=BigInt(s);let power=p,weight=0;while(power<=b){weight++;if(power>b/p)break;power*=p;}const q=logIntegerInterval(p,bits);lower+=BigInt(weight)*q.lo;upper+=BigInt(weight)*q.hi;terms.push({prime:s,weight});meter?.tick(64);}}
  const denominator=(1n<<BigInt(bits)).toString(),x=Number(xs),steps=small(input.liSteps??512,'liSteps',16,4096);let li2=0;
  if(x>=2){const n=steps+(steps%2),h=(x-2)/n;let s=1/Math.log(2)+1/Math.log(x);for(let i=1;i<n;i++)s+=(i%2?4:2)/Math.log(2+i*h);li2=s*h/3;}
  return{x:xs,pi:{kind:'INTEGER',value:String(included.length)},psi:input.includePsi===false?null:{kind:'EXACT_LOG_LINEAR_COMBINATION',terms,ball:{kind:'REAL_INTERVAL',lower:{kind:'RATIONAL',numerator:String(lower),denominator},upper:{kind:'RATIONAL',numerator:String(upper),denominator},certified:true,certification:'EXACT_FIXED_POINT_LOG_SERIES_WITH_TAIL'},bound:'The atanh series uses 0 <= z <= 1/3; interval arithmetic includes every rounding and the positive tail.'},Li2:{definition:'Li2(x) = integral from 2 to x of dt/log(t), x >= 2',normalization:'li(x) = Li2(x) + li(2); the principal-value constant is not set to zero.',value:{kind:'FLOAT64',value:li2,certified:false},method:`composite Simpson, ${steps+(steps%2)} panels`,error:{status:'UNBOUNDED_APPROXIMATION',reason:'No quadrature enclosure is claimed.'}},xOverLogX:x>1?{kind:'FLOAT64',value:x/Math.log(x),certified:false}:null};
}
export function primeView(result,{mode='gap',maxPoints=20000,residueModulus=6,zAxis='interval',camera=null}={}) {
  maxPoints=small(maxPoints,'maxPoints',1,20000);if(!['gap','count','normalized_error'].includes(mode)||!['interval','cutoff','residue_class'].includes(zAxis))fail('UNSUPPORTED_VIEW','Unsupported prime view semantics.');const stride=Math.max(1,Math.ceil(result.primes.length/maxPoints));const points=[];for(let i=0;i<result.primes.length;i+=stride){const p=Number(result.primes[i]),prev=i?Number(result.primes[i-1]):p;points.push({index:i,prime:result.primes[i],x:p,y:mode==='gap'?p-prev:mode==='count'?i+1:(i+1)*Math.log(p)/p,z:zAxis==='residue_class'?Number(BigInt(result.primes[i])%BigInt(small(residueModulus,'residueModulus',2,1000))):zAxis==='cutoff'?Number(result.normalizedInterval.b):Number(result.normalizedInterval.a)});}
  return{schema:'MathScope.PrimeView/1',sourceHash:result.rawHash,intervalCount:result.intervalCount,points,representation:{mode,zAxis,axisTypes:{x:'INTEGER_LOCATION',y:mode==='gap'?'WITHIN_INTERVAL_PREVIOUS_PRIME_GAP':mode==='count'?'INTERVAL_ORDINAL':'INTERVAL_ORDINAL_TIMES_LOG_P_OVER_P',z:'LAYOUT_OR_ARITHMETIC_ATTRIBUTE'},sampled:stride>1,stride,maxPoints,camera,proofClaim:null,warning:'Finite sampled data are not a proof of the prime number theorem or an enumeration of all primes.'}};
}
