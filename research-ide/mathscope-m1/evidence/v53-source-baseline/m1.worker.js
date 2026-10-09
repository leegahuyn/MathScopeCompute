/* MathScope M1 — static audited-domain application bundle. */
(()=>{
"use strict";
const __m1_0 = (()=>{
/* Exact arithmetic used by the M1 arithmetic worker. No ambient application state. */
class ArithmeticError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'ArithmeticError'; this.code = code; this.details = details; }
}
const fail = (code, message, details) => { throw new ArithmeticError(code, message, details); };
function bigint(value, name = 'integer', maxDigits = 4096) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) fail('INVALID_EXACT_INTEGER', `${name}: unsafe Number; use a decimal string.`);
  if (!['string','number','bigint'].includes(typeof value) || !/^-?\d+$/.test(String(value)) || String(value).replace('-','').length > maxDigits) fail('INVALID_EXACT_INTEGER', `${name}: expected a bounded decimal integer.`);
  return BigInt(value);
}
function small(value, name, lower, upper) { const n = bigint(value, name); if (n < BigInt(lower) || n > BigInt(upper)) fail('INPUT_RANGE', `${name} must be in [${lower},${upper}].`); return Number(n); }
const abs = x => x < 0n ? -x : x;
const mod = (x,m) => { if (m <= 0n) fail('INVALID_MODULUS','Positive modulus required.'); return ((x%m)+m)%m; };
function gcd(a,b) { a=abs(a);b=abs(b);while(b){[a,b]=[b,a%b];}return a; }
function isqrt(n) { n=bigint(n); if(n<0n)fail('INPUT_RANGE','Square root requires a nonnegative integer.'); if(n<2n)return n; let x=1n<<BigInt(Math.ceil(n.toString(2).length/2)); for(;;){const y=(x+n/x)>>1n;if(y>=x)return x;x=y;} }
function powmod(a,e,m,tracker=null) { a=mod(a,m); if(e<0n)fail('INPUT_RANGE','Nonnegative exponent required.'); let r=1n%m;while(e){tracker?.tick();if(e&1n)r=r*a%m;a=a*a%m;e>>=1n;}return r; }
function inverseUnit(a,m) { let x=mod(a,m),y=m,u=1n,v=0n;while(y){const q=x/y;[x,y]=[y,x-q*y];[u,v]=[v,u-q*v];}if(x!==1n)fail('NONUNIT_DIVISION','The denominator is not a unit; finite p-power rings are not fields.');return mod(u,m); }
function valuation(a,p,cap=100000) { a=abs(a);if(a===0n)return cap;let v=0;while(v<cap&&a%p===0n){a/=p;v++;}return v; }
function canonical(value) {
  const seen=new Set();let nodes=0;
  const rec=(v,d=0)=>{if(++nodes>2000000||d>80)fail('SERIALIZATION_LIMIT','JSON exceeds the arithmetic bound.');if(v===null||typeof v==='boolean'||typeof v==='string')return JSON.stringify(v);if(typeof v==='number'){if(!Number.isFinite(v)||(Number.isInteger(v)&&!Number.isSafeInteger(v)))fail('NON_CANONICAL_NUMBER','Unsafe or nonfinite JSON Number.');return JSON.stringify(v);}if(typeof v!=='object'||seen.has(v))fail('NON_CANONICAL_JSON','JSON must be acyclic; encode BigInt as a decimal string.');seen.add(v);let s;if(Array.isArray(v)){for(let i=0;i<v.length;i++)if(!Object.hasOwn(v,i))fail('NON_CANONICAL_JSON','Sparse JSON array.');s='['+v.map(x=>rec(x,d+1)).join(',')+']';}else{if(Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)fail('NON_CANONICAL_JSON','Plain JSON objects required.');s='{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+rec(v[k],d+1)).join(',')+'}';}seen.delete(v);return s;};return rec(value);
}
const clone=v=>JSON.parse(canonical(v));
async function hash(value) { if(!globalThis.crypto?.subtle)fail('CRYPTO_UNAVAILABLE','A WebCrypto SHA-256 implementation is required.');const b=new TextEncoder().encode(typeof value==='string'?value:canonical(value));const d=await globalThis.crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join(''); }
function meter(budget={},context={}) {
  const maxOperations=small(budget.maxOperations??50000000,'maxOperations',1,500000000);
  const maxMillis=small(budget.maxMillis??30000,'maxMillis',1,60000);
  const start=Date.now();let operations=0,last=0;
  return {tick(n=1){operations+=n;if(operations>maxOperations)fail('RESOURCE_LIMIT','Arithmetic operation budget exhausted.',{operations,maxOperations});if(operations-last>=512||n===0){last=operations;if(context.signal?.aborted||context.isCancelled?.())fail('CANCELLED','Calculation cancelled.');context.checkCancelled?.();if(Date.now()-start>maxMillis)fail('TIMEOUT','Arithmetic time budget exhausted.',{maxMillis});}},checkpoint:async data=>{context.checkCancelled?.();await context.onCheckpoint?.(clone(data));},get operations(){return operations;},maxOperations,maxMillis};
}
function matrix(rows,cols,entries=[]) {
  if(!Number.isSafeInteger(rows)||!Number.isSafeInteger(cols)||rows<0||cols<0||rows>4096||cols>4096)fail('MATRIX_SHAPE','Invalid sparse matrix dimensions.');
  const m=new Map();for(const e of entries){if(!Array.isArray(e)||e.length!==3)fail('MATRIX_ENTRY','Triplet required.');const [r,c,v]=e;if(!Number.isInteger(r)||!Number.isInteger(c)||r<0||r>=rows||c<0||c>=cols)fail('MATRIX_ENTRY','Sparse index outside matrix.');const k=r*cols+c;m.set(k,(m.get(k)??0n)+bigint(v));}
  return {rows,cols,entries:[...m].filter(([,v])=>v!==0n).sort(([a],[b])=>a-b).map(([k,v])=>[Math.floor(k/cols),k%cols,v.toString()])};
}
const identity=n=>matrix(n,n,Array.from({length:n},(_,i)=>[i,i,'1']));
const zero=(r,c)=>matrix(r,c);
function multiply(a,b,meter=null,modulus=null) {
  a=matrix(a.rows,a.cols,a.entries);b=matrix(b.rows,b.cols,b.entries);if(a.cols!==b.rows)fail('MATRIX_SHAPE','Matrix composition has incompatible dimensions.');const byRow=new Map();for(const [r,c,v]of b.entries){if(!byRow.has(r))byRow.set(r,[]);byRow.get(r).push([c,BigInt(v)]);}const out=new Map();for(const[r,k,v]of a.entries)for(const[c,w]of byRow.get(k)??[]){meter?.tick();const key=r*b.cols+c;out.set(key,(out.get(key)??0n)+BigInt(v)*w);}return matrix(a.rows,b.cols,[...out].map(([k,v])=>[Math.floor(k/b.cols),k%b.cols,modulus?mod(v,modulus):v]));
}
function addMatrix(a,b,sign=1n) {if(a.rows!==b.rows||a.cols!==b.cols)fail('MATRIX_SHAPE','Matrix addition requires the same dimensions.');return matrix(a.rows,a.cols,[...a.entries,...b.entries.map(([r,c,v])=>[r,c,sign*BigInt(v)])]);}
const equalMatrix=(a,b)=>canonical(matrix(a.rows,a.cols,a.entries))===canonical(matrix(b.rows,b.cols,b.entries));
const reduceMatrix=(a,m)=>matrix(a.rows,a.cols,a.entries.map(([r,c,v])=>[r,c,mod(BigInt(v),m)]));
function dense(a) {a=matrix(a.rows,a.cols,a.entries);if(a.rows*a.cols>65536)fail('RESOURCE_LIMIT','Dense matrix view exceeds 65,536 cells.');const d=Array.from({length:a.rows},()=>Array(a.cols).fill(0n));for(const[r,c,v]of a.entries)d[r][c]=BigInt(v);return d;}
const fromDense=(a,columns=a[0]?.length??0)=>matrix(a.length,columns,a.flatMap((row,r)=>row.map((v,c)=>[r,c,v])));
function determinant(a) {const b=dense(a);if(a.rows!==a.cols||a.rows>32)fail('MATRIX_SHAPE','Determinant requires a square matrix of size at most 32.');if(!a.rows)return 1n;let prev=1n,sign=1n;for(let k=0;k<a.rows-1;k++){let pivot=k;while(pivot<a.rows&&b[pivot][k]===0n)pivot++;if(pivot===a.rows)return 0n;if(pivot!==k){[b[pivot],b[k]]=[b[k],b[pivot]];sign=-sign;}const p=b[k][k];for(let i=k+1;i<a.rows;i++)for(let j=k+1;j<a.rows;j++){const numerator=b[i][j]*p-b[i][k]*b[k][j];if(numerator%prev!==0n)fail('INTERNAL_CERTIFICATE','Nonexact Bareiss division.');b[i][j]=numerator/prev;}for(let i=k+1;i<a.rows;i++)b[i][k]=0n;prev=p;}return sign*b[a.rows-1][a.rows-1];}

return {ArithmeticError,fail,bigint,small,abs,mod,gcd,isqrt,powmod,inverseUnit,valuation,canonical,clone,hash,meter,matrix,identity,zero,multiply,addMatrix,equalMatrix,reduceMatrix,dense,fromDense,determinant};
})();
const __m1_1 = (()=>{
const {bigint,small,fail,isqrt,powmod,gcd,hash,canonical,meter: makeMeter} = __m1_0;
const PRIME_DOMAIN=Object.freeze({schema:'MathScope.PrimeDomain/1',kind:'SYMBOLIC_INFINITE_SET',definition:'{ n : Nat | Nat.Prime n }',enumeration:'Every completed request covers only its stated finite interval.',leanDefinition:'MathScope.M1.Arithmetic.PrimeSet'});
function trialPrime(n,meter=null) {n=bigint(n);if(n<2n)return false;if(n===2n)return true;if(n%2n===0n)return false;for(let d=3n;d*d<=n;d+=2n){meter?.tick();if(n%d===0n)return false;}return true;}
function baseSieve(bound,meter=null) {
  const n=small(bound,'basePrimeBound',0,2000000),mark=new Uint8Array(n+1);mark.fill(1,2);
  for(let p=2;p*p<=n;p++)if(mark[p])for(let k=p*p;k<=n;k+=p){mark[k]=0;meter?.tick();}
  const primes=[];for(let p=2;p<=n;p++)if(mark[p])primes.push(BigInt(p));return primes;
}
/* Independent Euler/least-prime-factor oracle, not a segmented Eratosthenes replay. */
function linearPrimeOracle(bound,meter=null) {const n=small(bound,'oracleBound',0,2000000),lp=new Uint32Array(n+1),ps=[];for(let i=2;i<=n;i++){if(!lp[i]){lp[i]=i;ps.push(i);}for(const p of ps){if(p>lp[i]||p*i>n)break;lp[p*i]=p;meter?.tick();}}return ps.map(String);}
function normalizedInterval(a,b) {a=bigint(a,'a');b=bigint(b,'b');if(a<0n||b<0n)fail('INPUT_RANGE','Prime interval endpoints must be nonnegative.');return {a:a<=b?a:b,b:a<=b?b:a,reversed:a>b};}
async function segmentedPrimes(input={},budget={},context={}) {
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
async function verifyPrimeSegments(segments,a,b,{requireFull=true,meter=null}={}) {
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
async function* streamInterval(input,budget={},context={}) {const range=normalizedInterval(input.a??2,input.b??1000),width=small(input.segmentSize??1048576,'segmentSize',1,1048576);if(input.checkpoint)fail('UNSUPPORTED_CHECKPOINT_MODE','Use segmentedPrimes for prefix checkpoint resume; the lazy iterator yields one independent tile at a time.');for(let lo=range.a;lo<=range.b;){const hi=lo+BigInt(width)-1n<range.b?lo+BigInt(width)-1n:range.b;const result=await segmentedPrimes({...input,a:String(lo),b:String(hi),segmentSize:width},budget,context);yield result.segments[0];lo=hi+1n;}}

/* Lucas/Pratt certificates use a complete factorization of n-1 and checked child certificates. */
function verifyPrimeCertificate(cert,{maxNodes=4096,maxDepth=64,meter=null}={}) {
  let nodes=0;const visit=(c,depth)=>{if(++nodes>maxNodes||depth>maxDepth)return false;if(!c||c.scheme!=='LUCAS_PRATT')return false;let n;try{n=bigint(c.n,'certificate n',256);}catch{return false;}if(n===2n)return c.base===true;
    if(n<3n||n%2n===0n||!Array.isArray(c.factors)||c.factors.length===0)return false;let product=1n;const seen=new Set();for(const f of c.factors){let q,e;try{q=bigint(f.q,'q',256);e=small(f.exponent,'exponent',1,4096);}catch{return false;}if(seen.has(String(q))||q>=n||q<2n||f.certificate?.n!==String(q)||!visit(f.certificate,depth+1))return false;seen.add(String(q));product*=q**BigInt(e);if(product>n-1n)return false;}
    if(product!==n-1n)return false;let w;try{w=bigint(c.witness,'witness',256);}catch{return false;}if(w<2n||w>=n||powmod(w,n-1n,n,meter)!==1n)return false;return c.factors.every(f=>gcd(powmod(w,(n-1n)/BigInt(f.q),n,meter)-1n,n)===1n);};
  const pass=visit(cert,0);return {pass,status:pass?'PRIME_CERTIFIED':'UNKNOWN',scheme:'LUCAS_PRATT',checkedNodes:nodes,scope:'Exact integer certificate verification; a failed certificate alone is not a compositeness proof.'};
}
function generatePrimeCertificate(n,{meter=null,maxTrialDivisor=100000,maxWitness=256}={}) {
  n=bigint(n,'n',256);const cache=new Map();const rec=(x,depth=0)=>{if(depth>48)fail('RESOURCE_LIMIT','Pratt recursion depth exhausted.');if(cache.has(String(x)))return cache.get(String(x));if(x===2n)return{scheme:'LUCAS_PRATT',n:'2',base:true};if(x<2n||x%2n===0n)return null;
    let rest=x-1n;const factors=[];for(let d=2n;d*d<=rest;d=d===2n?3n:d+2n){meter?.tick();if(d>BigInt(maxTrialDivisor))return null;if(rest%d===0n){let e=0;do{rest/=d;e++;}while(rest%d===0n);const child=rec(d,depth+1);if(!child)return null;factors.push({q:String(d),exponent:e,certificate:child});}}
    if(rest>1n){const child=rec(rest,depth+1);if(!child)return null;factors.push({q:String(rest),exponent:1,certificate:child});}
    for(let a=2n;a<x&&a<=BigInt(maxWitness);a++){meter?.tick();if(powmod(a,x-1n,x,meter)!==1n)continue;if(factors.every(f=>gcd(powmod(a,(x-1n)/BigInt(f.q),x,meter)-1n,x)===1n)){const c={scheme:'LUCAS_PRATT',n:String(x),witness:String(a),factors};cache.set(String(x),c);return c;}}return null;};
  if(n<2n)return{status:'COMPOSITE',reason:'n < 2',certificate:null};for(let d=2n;d<=1000n&&d*d<=n;d=d===2n?3n:d+2n){meter?.tick();if(n%d===0n)return{status:'COMPOSITE',divisor:String(d),certificate:null};}
  const certificate=rec(n);if(certificate){const check=verifyPrimeCertificate(certificate,{meter});if(!check.pass)fail('INTERNAL_CERTIFICATE','Generated primality certificate failed its independent verifier.');return{status:'PRIME_CERTIFIED',certificate,verification:check};}
  return{status:'UNKNOWN',certificate:null,reason:'Complete n-1 factorization or Lucas witness not obtained within the certificate budget.'};
}
function nextPrime(after,budget={},context={}) {let n=bigint(after)+1n;const m=context.meter??makeMeter(budget,context),limit=small(budget.maxCandidates??1000,'maxCandidates',1,100000);for(let i=0;i<limit;i++,n++){m.tick();const result=generatePrimeCertificate(n,{meter:m});if(result.status==='PRIME_CERTIFIED')return{n:String(n),...result,checkedCandidates:i+1};if(result.status==='UNKNOWN')return{status:'UNKNOWN',nextUnresolved:String(n),reason:'Cannot certify that no prime was skipped.'};}return{status:'RESOURCE_LIMIT',nextUnresolved:String(n),reason:'Candidate budget exhausted.'};}

const ceilDiv=(a,b)=>(a+b-1n)/b;
function logReduced(n,d,bits) {const scale=1n<<BigInt(bits),zn=n-d,zd=n+d,zlo=zn*scale/zd,zhi=ceilDiv(zn*scale,zd),sqlo=zlo*zlo/scale,sqhi=ceilDiv(zhi*zhi,scale);let plo=zlo,phi=zhi,lo=0n,hi=0n;const terms=Math.ceil((bits+8)/3)+2;for(let j=0;j<terms;j++){const odd=BigInt(2*j+1);lo+=plo/odd;hi+=ceilDiv(phi,odd);plo=plo*sqlo/scale;phi=ceilDiv(phi*sqhi,scale);}return{lo:2n*lo,hi:2n*hi+ceilDiv(scale,3n**BigInt(2*terms)),terms};}
function logIntegerInterval(n,bits=64) {n=bigint(n);bits=small(bits,'logBits',24,128);if(n<1n)fail('LOG_DOMAIN','Integer logarithm requires n >= 1.');if(n===1n)return{lo:0n,hi:0n,bits};const e=n.toString(2).length-1,d=1n<<BigInt(e),a=logReduced(n,d,bits),two=logReduced(2n,1n,bits);return{lo:a.lo+BigInt(e)*two.lo,hi:a.hi+BigInt(e)*two.hi,bits};}
function primeStatistics(result,input={},meter=null) {
  const cutoffUpper=BigInt(result.normalizedInterval.b),a=BigInt(result.normalizedInterval.a);if(a>2n) return{intervalCount:result.intervalCount,piAtUpper:null,psi:null,reason:'Global counting functions require coverage from 2.'};
  const xs=String(input.statisticsAt??cutoffUpper);if(!/^\d+(\.\d+)?$/.test(xs))fail('INPUT_RANGE','statisticsAt must be a nonnegative decimal real.');const b=BigInt(xs.split('.')[0]);if(b>cutoffUpper)fail('INSUFFICIENT_PRIME_COVERAGE','statisticsAt requires prime coverage from 2 through floor(x).');const included=result.primes.filter(p=>BigInt(p)<=b);
  if(b<2n)return{x:xs,pi:{kind:'INTEGER',value:'0'},psi:{kind:'EXACT_LOG_LINEAR_COMBINATION',terms:[],exactValue:'0'},Li2:{status:'UNSUPPORTED_DOMAIN',definition:'Li2(x) is supported for x >= 2'},xOverLogX:null};
  const terms=[];let lower=0n,upper=0n;const bits=small(input.logBits??64,'logBits',24,128);
  if(input.includePsi!==false){for(const s of included){const p=BigInt(s);let power=p,weight=0;while(power<=b){weight++;if(power>b/p)break;power*=p;}const q=logIntegerInterval(p,bits);lower+=BigInt(weight)*q.lo;upper+=BigInt(weight)*q.hi;terms.push({prime:s,weight});meter?.tick(64);}}
  const denominator=(1n<<BigInt(bits)).toString(),x=Number(xs),steps=small(input.liSteps??512,'liSteps',16,4096);let li2=0;
  if(x>=2){const n=steps+(steps%2),h=(x-2)/n;let s=1/Math.log(2)+1/Math.log(x);for(let i=1;i<n;i++)s+=(i%2?4:2)/Math.log(2+i*h);li2=s*h/3;}
  return{x:xs,pi:{kind:'INTEGER',value:String(included.length)},psi:input.includePsi===false?null:{kind:'EXACT_LOG_LINEAR_COMBINATION',terms,ball:{kind:'REAL_INTERVAL',lower:{kind:'RATIONAL',numerator:String(lower),denominator},upper:{kind:'RATIONAL',numerator:String(upper),denominator},certified:true,certification:'EXACT_FIXED_POINT_LOG_SERIES_WITH_TAIL'},bound:'The atanh series uses 0 <= z <= 1/3; interval arithmetic includes every rounding and the positive tail.'},Li2:{definition:'Li2(x) = integral from 2 to x of dt/log(t), x >= 2',normalization:'li(x) = Li2(x) + li(2); the principal-value constant is not set to zero.',value:{kind:'FLOAT64',value:li2,certified:false},method:`composite Simpson, ${steps+(steps%2)} panels`,error:{status:'UNBOUNDED_APPROXIMATION',reason:'No quadrature enclosure is claimed.'}},xOverLogX:x>1?{kind:'FLOAT64',value:x/Math.log(x),certified:false}:null};
}
function primeView(result,{mode='gap',maxPoints=20000,residueModulus=6,zAxis='interval',camera=null}={}) {
  maxPoints=small(maxPoints,'maxPoints',1,20000);if(!['gap','count','normalized_error'].includes(mode)||!['interval','cutoff','residue_class'].includes(zAxis))fail('UNSUPPORTED_VIEW','Unsupported prime view semantics.');const stride=Math.max(1,Math.ceil(result.primes.length/maxPoints));const points=[];for(let i=0;i<result.primes.length;i+=stride){const p=Number(result.primes[i]),prev=i?Number(result.primes[i-1]):p;points.push({index:i,prime:result.primes[i],x:p,y:mode==='gap'?p-prev:mode==='count'?i+1:(i+1)*Math.log(p)/p,z:zAxis==='residue_class'?Number(BigInt(result.primes[i])%BigInt(small(residueModulus,'residueModulus',2,1000))):zAxis==='cutoff'?Number(result.normalizedInterval.b):Number(result.normalizedInterval.a)});}
  return{schema:'MathScope.PrimeView/1',sourceHash:result.rawHash,intervalCount:result.intervalCount,points,representation:{mode,zAxis,axisTypes:{x:'INTEGER_LOCATION',y:mode==='gap'?'WITHIN_INTERVAL_PREVIOUS_PRIME_GAP':mode==='count'?'INTERVAL_ORDINAL':'INTERVAL_ORDINAL_TIMES_LOG_P_OVER_P',z:'LAYOUT_OR_ARITHMETIC_ATTRIBUTE'},sampled:stride>1,stride,maxPoints,camera,proofClaim:null,warning:'Finite sampled data are not a proof of the prime number theorem or an enumeration of all primes.'}};
}

return {PRIME_DOMAIN,trialPrime,baseSieve,linearPrimeOracle,segmentedPrimes,verifyPrimeSegments,verifyPrimeCertificate,generatePrimeCertificate,nextPrime,logIntegerInterval,primeStatistics,primeView};
})();
const __m1_2 = (()=>{
const {bigint,small,fail,mod,inverseUnit,valuation,powmod,matrix,dense,fromDense,identity,multiply,reduceMatrix,equalMatrix,determinant,canonical} = __m1_0;
const {trialPrime} = __m1_1;
function primeBase(p,meter=null) {p=bigint(p,'p');if(p>2000000n||!trialPrime(p,meter))fail('INVALID_PRIME','This arithmetic base requires a certified prime p <= 2,000,000.');return p;}
function padic(p,residue,N) {p=primeBase(p);N=small(N,'N',1,256);return{kind:'PADIC_BALL',p:String(p),residue:String(mod(bigint(residue),p**BigInt(N))),digits:N,interpretation:'A residue-class observation of Z_p, not an independent prism.'};}
function sameBase(a,b){if(a?.kind!=='PADIC_BALL'||b?.kind!=='PADIC_BALL'||String(a.p)!==String(b.p))fail('PADIC_BASE_MISMATCH','Different primes do not share coefficient arithmetic.');return[padic(a.p,a.residue,a.digits),padic(b.p,b.residue,b.digits)];}
function reducePadic(a,N){a=padic(a.p,a.residue,a.digits);N=small(N,'target N',1,a.digits);return padic(a.p,a.residue,N);}
function addPadic(a,b){[a,b]=sameBase(a,b);return{value:padic(a.p,BigInt(a.residue)+BigInt(b.residue),Math.min(a.digits,b.digits)),precision:{operation:'addition',lossDigits:0,inputDigits:[a.digits,b.digits],outputDigits:Math.min(a.digits,b.digits)}};}
function multiplyPadic(a,b){[a,b]=sameBase(a,b);const p=BigInt(a.p),va=valuation(BigInt(a.residue),p,a.digits),vb=valuation(BigInt(b.residue),p,b.digits),N=Math.min(256,a.digits+vb,b.digits+va);return{value:padic(p,BigInt(a.residue)*BigInt(b.residue),N),precision:{operation:'multiplication',inputDigits:[a.digits,b.digits],valuationLowerBounds:[va,vb],outputDigits:N,formula:'min(N_a+v_p(b), N_b+v_p(a)); valuation of zero is only a lower bound'}};}
function divideByInteger(a,denominator,targetN){a=padic(a.p,a.residue,a.digits);const p=BigInt(a.p),d=bigint(denominator);if(!d)fail('DIVISION_BY_ZERO','Nonzero denominator required.');const v=valuation(d,p),N=targetN===undefined?a.digits-v:small(targetN,'target N',1,256);if(N<1||a.digits<N+v)fail('PRECISION_REQUIRED','Division by p^v requires v additional input digits.',{operation:'division',requiredDigits:N+v,availableDigits:a.digits,lossDigits:v});const pv=p**BigInt(v);if(BigInt(a.residue)%pv)fail('NONINTEGRAL_QUOTIENT','The requested quotient is outside Z_p.');const m=p**BigInt(N),u=d/pv;return{value:padic(p,BigInt(a.residue)/pv*inverseUnit(u,m),N),precision:{operation:'division_by_exact_integer',lossDigits:v,inputDigits:a.digits,outputDigits:N,divisorValuation:v,unitDivisionOnlyAfterExtractingKnownPower:true}};}
function deltaPadic(input,targetN,{exactInteger}={}) {
  input=padic(input.p,input.residue,input.digits);const p=BigInt(input.p),N=small(targetN??Math.max(1,input.digits-1),'target N',1,255);let a=input,upgraded=false;
  if(a.digits<N+1){if(exactInteger===undefined)fail('PRECISION_REQUIRED','delta modulo p^N requires an input modulo p^(N+1).',{requiredDigits:N+1,availableDigits:a.digits,lossDigits:1});const exact=bigint(exactInteger);if(mod(exact,p**BigInt(a.digits))!==BigInt(a.residue))fail('EXACT_SOURCE_MISMATCH','The exact source does not reduce to the supplied observation.');a=padic(p,exact,N+1);upgraded=true;}
  const workingMod=p**BigInt(N+1),r=mod(BigInt(a.residue),workingMod),numerator=mod(r-powmod(r,p,workingMod),workingMod);if(numerator%p)fail('INTERNAL_CERTIFICATE','Frobenius lift numerator is not divisible by p.');
  return{value:padic(p,numerator/p,N),precision:{operation:'delta',formula:'delta(a)=(a-a^p)/p on Z_p with phi_A=id',inputDigits:input.digits,workingDigits:a.digits,outputDigits:N,lossDigits:1,guardDigits:1,autoIncreasedFromExactSource:upgraded,exactSourceUsed:upgraded?String(exactInteger):null}};
}
function precisionFailureFixture(p=3,N=3) {p=primeBase(p);N=small(N,'N',1,255);const a=0n,b=p**BigInt(N);return{p:String(p),N,inputsEqualModuloPN:true,residues:[String(mod(a,b)),String(mod(b,b))],deltaAtN:[deltaPadic(padic(p,a,N+1),N).value,deltaPadic(padic(p,b,N+1),N).value],conclusion:'The same p^N residue has two distinct delta residues modulo p^N. An unknown guard digit cannot be invented.'};}
function crystallinePrism(p) {
  p=primeBase(p);return{schema:'MathScope.ArithmeticBase/1',kind:'SYMBOLIC_CRYSTALLINE_PRISM',p:String(p),A:'Z_'+p,I:'(p)',phi:{kind:'IDENTITY_RING_ENDOMORPHISM',formula:'phi_A(a)=a'},delta:'(a-a^p)/p',finiteObservationIsPrism:false,assumptions:[{id:'base-p-prime',statement:`${p} is prime`,status:'EXACT_FINITE_CHECK'},{id:'base-torsionfree',statement:'Z_p is p-torsionfree',status:'STANDARD_MATHEMATICAL_CONSTRUCTION'},{id:'base-complete',statement:'Z_p = inverse_limit_N Z/p^N is p-adically complete',status:'STANDARD_MATHEMATICAL_CONSTRUCTION'},{id:'base-cartier',statement:'p is a nonzerodivisor and I=(p) is Cartier',status:'STANDARD_MATHEMATICAL_CONSTRUCTION'},{id:'base-prism',statement:'p belongs to I+phi(I)A and A/I has bounded p-power torsion',status:'EXTERNAL_THEOREM_APPLICATION'}],source:{id:'S01',locator:'Definition 1.1, Example 1.3(1), Definition 1.4',status:'THEOREM_REFERENCE'},admissions:[],formalComplete:false};
}
function validatePrismBase(value) {const errors=[];if(value?.kind!=='SYMBOLIC_CRYSTALLINE_PRISM')errors.push('The admitted base is symbolic Z_p, not Z/p^N.');try{primeBase(value?.p);}catch(e){errors.push(e.message);}if(value?.A!=='Z_'+String(value?.p))errors.push('Coefficient ring and prime index disagree.');if(value?.finiteObservationIsPrism!==false)errors.push('Finite observation must not be promoted to a prism.');if(value?.phi?.kind!=='IDENTITY_RING_ENDOMORPHISM'||value?.phi?.formula!=='phi_A(a)=a'||value?.delta!=='(a-a^p)/p')errors.push('This backend only implements the specified identity Frobenius lift.');if(value?.I!=='(p)')errors.push('Wrong prism ideal.');for(const id of ['base-p-prime','base-torsionfree','base-complete','base-cartier','base-prism'])if(!value?.assumptions?.some(x=>x.id===id&&!['UNVERIFIED','UNKNOWN','USER_AXIOM'].includes(x.status)))errors.push('Missing or unverified assumption '+id);if(value?.formalComplete!==false)errors.push('The base admission is not a complete Lean formalization.');return{pass:errors.length===0,errors};}

/* Smith diagonalization over Z/p^N. Every division used for row/column operations is by a unit.
   A representative divisible by p^v may be divided as an integer to choose an elimination coefficient;
   p^v is never treated as an invertible ring element. */
function finiteRingModule(a,p,N,meter=null) {
  p=primeBase(p);N=small(N,'N',1,256);a=matrix(a.rows,a.cols,a.entries);if(a.rows>16||a.cols>16)fail('RESOURCE_LIMIT','Module certificates currently support matrices up to 16 x 16.');const modulus=p**BigInt(N),B=dense(reduceMatrix(a,modulus)),U=dense(identity(a.rows)),V=dense(identity(a.cols)),ops=[];
  const rowSwap=(i,j)=>{[B[i],B[j]]=[B[j],B[i]];[U[i],U[j]]=[U[j],U[i]];ops.push({kind:'row_swap',i,j});};
  const colSwap=(i,j)=>{for(const r of B)[r[i],r[j]]=[r[j],r[i]];for(const r of V)[r[i],r[j]]=[r[j],r[i]];ops.push({kind:'column_swap',i,j});};
  const rowScale=(i,u)=>{B[i]=B[i].map(x=>mod(x*u,modulus));U[i]=U[i].map(x=>mod(x*u,modulus));ops.push({kind:'row_unit_scale',i,unit:String(u)});};
  const rowAdd=(i,k,c)=>{B[i]=B[i].map((x,j)=>mod(x+c*B[k][j],modulus));U[i]=U[i].map((x,j)=>mod(x+c*U[k][j],modulus));ops.push({kind:'row_add',i,k,c:String(c)});};
  const colAdd=(j,k,c)=>{for(const row of B)row[j]=mod(row[j]+c*row[k],modulus);for(const row of V)row[j]=mod(row[j]+c*row[k],modulus);ops.push({kind:'column_add',j,k,c:String(c)});};
  const vals=[];for(let k=0;k<Math.min(a.rows,a.cols);k++){let best=N,br=-1,bc=-1;for(let i=k;i<a.rows;i++)for(let j=k;j<a.cols;j++){meter?.tick();const v=valuation(B[i][j],p,N);if(v<best){best=v;br=i;bc=j;}}if(br<0)break;if(br!==k)rowSwap(br,k);if(bc!==k)colSwap(bc,k);const pv=p**BigInt(best),unit=B[k][k]/pv;rowScale(k,inverseUnit(unit,modulus));for(let i=k+1;i<a.rows;i++)if(B[i][k]){if(B[i][k]%pv)fail('INTERNAL_CERTIFICATE','DVR pivot valuation is not minimal.');rowAdd(i,k,-B[i][k]/pv);}for(let j=k+1;j<a.cols;j++)if(B[k][j]){if(B[k][j]%pv)fail('INTERNAL_CERTIFICATE','DVR pivot valuation is not minimal.');colAdd(j,k,-B[k][j]/pv);}vals.push(best);}
  const certificate={schema:'MathScope.DVRSmithCertificate/1',ring:{kind:'FINITE_P_POWER_RING',p:String(p),N,modulus:String(modulus)},original:a,U:fromDense(U),V:fromDense(V),diagonal:fromDense(B,a.cols),valuations:vals,operations:ops};
  const checked=verifyFiniteRingModule(certificate);if(!checked.pass)fail('INTERNAL_CERTIFICATE','DVR normal-form certificate failed independent verification.',checked);
  const factors=vals.filter(v=>v>0).map(v=>({kind:'CYCLIC_P_POWER_MODULE',p:String(p),exponent:v}));
  return{certificate,verification:checked,module:{kernel:{cyclic:factors,freeRank:a.cols-vals.length,generators:'Columns of V scaled by p^(N-v_i); zero columns give free generators.'},cokernel:{cyclic:factors,freeRank:a.rows-vals.length,presentation:'Diagonal presentation in the U-transformed codomain.'},image:{cyclic:vals.map(v=>({kind:'CYCLIC_P_POWER_MODULE',p:String(p),exponent:N-v})),freeRank:0},fieldRank:null},precision:{operation:'basis_reduction',inputDigits:N,outputDigits:N,lossDigits:0,reason:'Verified unit row and column transformations; no inverse of a nonunit.'}};
}
function verifyFiniteRingModule(c) {try{const p=primeBase(c.ring.p),N=small(c.ring.N,'N',1,256),m=p**BigInt(N);if(c.ring.modulus!==String(m))return{pass:false,reason:'Ring modulus mismatch'};const A=matrix(c.original.rows,c.original.cols,c.original.entries),U=matrix(c.U.rows,c.U.cols,c.U.entries),V=matrix(c.V.rows,c.V.cols,c.V.entries),S=matrix(c.diagonal.rows,c.diagonal.cols,c.diagonal.entries);if(U.rows!==A.rows||U.cols!==A.rows||V.rows!==A.cols||V.cols!==A.cols)return{pass:false,reason:'Basis dimensions mismatch'};if(mod(determinant(U),p)===0n||mod(determinant(V),p)===0n)return{pass:false,reason:'Basis map is not a unit'};if(!equalMatrix(multiply(multiply(U,A,null,m),V,null,m),reduceMatrix(S,m)))return{pass:false,reason:'U A V differs from S'};const vals=c.valuations;if(!Array.isArray(vals)||vals.some((v,i)=>!Number.isInteger(v)||v<0||v>=N||(i&&v<vals[i-1])))return{pass:false,reason:'Invalid invariant valuations'};const expected=matrix(A.rows,A.cols,vals.map((v,i)=>[i,i,p**BigInt(v)]));if(!equalMatrix(reduceMatrix(S,m),expected))return{pass:false,reason:'Not the declared Smith diagonal'};return{pass:true,method:'Independent transformation product + exact Bareiss determinant unit check',coefficientScope:`mod ${p}^${N}`};}catch(e){return{pass:false,reason:e.message};}}
function determinantPadic(a,p,N) {p=primeBase(p);N=small(N,'N',1,256);const d=determinant(a);return{value:padic(p,d,N),integerLiftDeterminant:String(d),precision:{operation:'determinant',inputDigits:N,outputDigits:N,lossDigits:0,reason:'The determinant is an integral polynomial in entries. Fraction-free computation on integer lifts does not consume p-adic digits.'}};}
function derivedReductionFixture(p,N=3) {p=primeBase(p);N=small(N,'N',1,256);return{schema:'MathScope.DerivedReductionFixture/1',source:{ring:'Z_'+p,degrees:[0,1],differential:String(p),cohomology:{H0:'0',H1:'Z/p'}},derivedBaseChange:{method:'Tensor the bounded free complex, which is K-flat',ring:'F_'+p,differential:'0',cohomology:{H0:'F_'+p,H1:'F_'+p}},ordinaryCohomologyTensor:{H0:'0',H1:'F_'+p},finiteModule:finiteRingModule(matrix(1,1,[[0,0,p]]),p,N),reason:'Tor contributes in degree 0; taking cohomology before base change loses it.',formalScope:'The vanishing reduced differential and finite module identities have separate kernel-checked fixtures; the general derived-category theorem is an external mathematical construction.'};}

return {primeBase,padic,reducePadic,addPadic,multiplyPadic,divideByInteger,deltaPadic,precisionFailureFixture,crystallinePrism,validatePrismBase,finiteRingModule,verifyFiniteRingModule,determinantPadic,derivedReductionFixture};
})();
const __m1_3 = (()=>{
const {small,bigint,fail,matrix,zero,identity,multiply,addMatrix,equalMatrix,reduceMatrix,hash,canonical} = __m1_0;
const {primeBase,crystallinePrism,validatePrismBase} = __m1_2;
function p1Complex(D=1) {
  D=small(D,'D',1,256);const basis=[[],[],[]],a=[],b=[];
  for(const chart of ['U0','U1'])for(let j=0;j<=D;j++)basis[0].push({id:`${chart}:function:${j}`,chart,coordinate:chart==='U0'?'t':'s',exponent:j,formDegree:0,cechDegree:0,cohomologicalDegree:0,laurentWeight:chart==='U0'?j:-j});
  for(const chart of ['U0','U1'])for(let j=0;j<D;j++)basis[1].push({id:`${chart}:form:${j}`,chart,coordinate:chart==='U0'?'t':'s',exponent:j,formDegree:1,cechDegree:0,cohomologicalDegree:1,laurentWeight:chart==='U0'?j+1:-j-1});
  for(let k=-D;k<=D;k++)basis[1].push({id:`U01:function:${k}`,chart:'U01',coordinate:'t',exponent:k,formDegree:0,cechDegree:1,cohomologicalDegree:1,laurentWeight:k});
  for(let j=-D-1;j<D;j++)basis[2].push({id:`U01:form:${j}`,chart:'U01',coordinate:'t',exponent:j,formDegree:1,cechDegree:1,cohomologicalDegree:2,laurentWeight:j+1});
  for(let j=0;j<=D;j++){if(j){a.push([j-1,j,j]);a.push([D+j-1,D+1+j,j]);}a.push([3*D+j,j,-1]);a.push([3*D-j,D+1+j,1]);}
  for(let j=0;j<D;j++){b.push([D+1+j,j,-1]);b.push([D-j-1,D+j,-1]);}
  for(let k=-D;k<=D;k++)if(k)b.push([D+k,3*D+k,-k]);
  return{schema:'MathScope.IntegralCechDeRhamComplex/1',kind:'P1_CECH_DE_RHAM_SUBCOMPLEX',D,coefficientRing:{kind:'INTEGER_RING'},dims:[2*D+2,4*D+1,2*D+1],basis,differentials:[matrix(4*D+1,2*D+2,a),matrix(2*D+1,4*D+1,b)],convention:{columns:'source',rows:'target',d0:'(df0, df1, f1-f0)',d1:'omega1-omega0-dg',transition:'s=t^(-1); s^j ds = -t^(-j-2) dt'},multiplicativeStructure:{closedUnderProduct:false,certifiedEInfinity:false}};
}
function p1Retraction(C) {
  const D=C.D,h1=[],h2=[];for(let k=-D;k<=D;k++){h1.push([k>0?k:D+1-k,3*D+k,k>0?-1:1]);if(k)h2.push([k>0?k-1:D-k-1,D+k,-1]);}
  return{schema:'MathScope.StrongDeformationRetract/1',K:{dims:[1,0,1],differentials:[zero(0,1),zero(1,0)],basis:[['1'],[],['dt/t']]},i:[matrix(C.dims[0],1,[[0,0,1],[D+1,0,1]]),zero(C.dims[1],0),matrix(C.dims[2],1,[[D,0,1]])],r:[matrix(1,C.dims[0],[[0,0,1]]),zero(0,C.dims[1]),matrix(1,C.dims[2],[[0,D,1]])],h:[zero(0,C.dims[0]),matrix(C.dims[0],C.dims[1],h1),matrix(C.dims[1],C.dims[2],h2)],identity:'r i=id_K and id_C-i r=d h+h d',denominators:[],uniformCoefficientBound:'Every h,i,r entry is 0, 1, or -1; maps preserve p^N divisibility for every p,N.'};
}
function checkComplex(C,meter=null,modulus=null) {
  try {
    if(!C||!Array.isArray(C.dims)||C.dims.length<1||C.dims.length>64||!Array.isArray(C.differentials)||C.differentials.length!==C.dims.length-1)return{pass:false,reason:'Wrong complex length'};
    if(C.dims.some(d=>!Number.isSafeInteger(d)||d<0||d>4096))return{pass:false,reason:'Invalid finite free dimensions'};
    if(modulus!==null&&(typeof modulus!=='bigint'||modulus<=0n))return{pass:false,reason:'Positive integer modulus required'};
    const differentials=C.differentials.map((d,k)=>{if(!d||!Array.isArray(d.entries)||d.cols!==C.dims[k]||d.rows!==C.dims[k+1])fail('MATRIX_SHAPE','Differential shape or entries mismatch');return matrix(d.rows,d.cols,d.entries);});
    for(let k=0;k+1<differentials.length;k++)if(multiply(differentials[k+1],differentials[k],meter,modulus).entries.length)return{pass:false,reason:`d_${k+1} d_${k} != 0`};
    return{pass:true,scope:modulus?`mod ${modulus}`:'INTEGER_IDENTITY'};
  }catch(e){return{pass:false,reason:e.message};}
}
function checkRetraction(C,R,meter=null,modulus=null) {
  const normalize=a=>modulus?reduceMatrix(a,modulus):a,checks=[];
  for(let k=0;k<3;k++){const ir=multiply(R.i[k],R.r[k],meter,modulus),ri=multiply(R.r[k],R.i[k],meter,modulus);let rhs=zero(C.dims[k],C.dims[k]);if(k>0)rhs=addMatrix(rhs,multiply(C.differentials[k-1],R.h[k],meter,modulus));if(k<2)rhs=addMatrix(rhs,multiply(R.h[k+1],C.differentials[k],meter,modulus));checks.push({degree:k,retraction:equalMatrix(normalize(ri),identity(R.K.dims[k])),homotopy:equalMatrix(normalize(addMatrix(identity(C.dims[k]),ir,-1n)),normalize(rhs))});}
  const iChain=checkChainMap(R.K,C,R.i,{meter,modulus}),rChain=checkChainMap(C,R.K,R.r,{meter,modulus});return{pass:checks.every(x=>x.retraction&&x.homotopy)&&iChain.pass&&rChain.pass,checks,iChain,rChain,coefficientScope:modulus?`mod ${modulus}`:'Z'};
}
function checkChainMap(source,target,maps,{meter=null,modulus=null,sigma='identity'}={}) {
  if(sigma!=='identity')return{pass:false,reason:'Unsupported coefficient Frobenius: this base has phi_A=id.'};if(maps.length!==source.dims.length||maps.length!==target.dims.length)return{pass:false,reason:'Wrong number of component maps'};
  try{for(let k=0;k<maps.length;k++)if(maps[k].rows!==target.dims[k]||maps[k].cols!==source.dims[k])return{pass:false,reason:`Map ${k} has the wrong source/target`};for(let k=0;k<source.differentials.length;k++){const lhs=multiply(target.differentials[k],maps[k],meter,modulus),rhs=multiply(maps[k+1],source.differentials[k],meter,modulus);if(!equalMatrix(lhs,rhs))return{pass:false,reason:`D_target_${k} F_${k} != F_${k+1} sigma(D_source_${k})`};}return{pass:true,formula:'D_target,k F_k = F_(k+1) sigma(D_source,k)',sigma:'IDENTITY_ON_Z_P',scope:modulus?`mod ${modulus}`:'INTEGER_IDENTITY'};}catch(e){return{pass:false,reason:e.message};}
}
function weightContraction(k) {
  k=bigint(k,'Laurent weight');if(!k)fail('ZERO_WEIGHT','Weight zero contains the surviving H0 and H2; it is not contractible.');
  return{weight:String(k),chart:k>0n?'U0':'U1',a:matrix(2,1,[[0,0,k>0n?k:-k],[1,0,k>0n?-1:1]]),b:matrix(1,2,[[0,0,-1],[0,1,-k]]),h1:matrix(1,2,[[0,1,k>0n?-1:1]]),h2:matrix(2,1,[[0,0,-1]]),universalProof:'MathScope.M1.Arithmetic.positive_weight_contractible / negative_weight_contractible',divisionByWeight:false};
}
function verifyWeightContraction(w) {return{pass:!multiply(w.b,w.a).entries.length&&equalMatrix(multiply(w.h1,w.a),identity(1))&&equalMatrix(addMatrix(multiply(w.a,w.h1),multiply(w.h2,w.b)),identity(2))&&equalMatrix(multiply(w.b,w.h2),identity(1)),scope:'Z, with an arbitrary integer k in the universal Lean proof'};}
function permutationMinor(a,rows,cols) {const rowIndex=new Map(rows.map((r,i)=>[r,i])),colIndex=new Map(cols.map((c,i)=>[c,i])),e=a.entries.filter(([r,c])=>rowIndex.has(r)&&colIndex.has(c));const rowCount=Array(rows.length).fill(0),colCount=Array(cols.length).fill(0);for(const[r,c,v]of e){if(v!=='1'&&v!=='-1')return{pass:false};rowCount[rowIndex.get(r)]++;colCount[colIndex.get(c)]++;}return{pass:rows.length===cols.length&&rowCount.every(x=>x===1)&&colCount.every(x=>x===1),rows,cols,absoluteDeterminant:'1',method:'Signed permutation minor'};}
function p1SmithCertificate(C) {const D=C.D;return{d0:{nonzeroInvariantFactors:Array(2*D+1).fill('1'),unitMinor:permutationMinor(C.differentials[0],Array.from({length:2*D+1},(_,i)=>2*D+i),Array.from({length:2*D+1},(_,i)=>i+1)),rankUpperBound:2*D+1,upperBoundReason:'The nonzero diagonal-constant vector lies in the kernel.'},d1:{nonzeroInvariantFactors:Array(2*D).fill('1'),unitMinor:permutationMinor(C.differentials[1],Array.from({length:2*D+1},(_,i)=>i).filter(i=>i!==D),Array.from({length:2*D},(_,i)=>i)),rankUpperBound:2*D,upperBoundReason:'The row of dt/t is zero.'},cohomology:{H0:{freeRank:1,torsion:[],generator:'diagonal constant (1,1)'},H1:{freeRank:0,torsion:[]},H2:{freeRank:1,torsion:[],generator:'[dt/t]'}},coefficientIndependence:'The integral strong deformation retract, not field-rank subtraction, proves these modules after arbitrary coefficient base change.'};}
function p1Frobenius(source,p,{targetD,meter=null}={}) {
  p=primeBase(p);const expected=BigInt(source.D)*p;if(expected>256n)fail('RESOURCE_LIMIT','Frobenius target D*p exceeds the explicit sparse-complex bound.',{requiredTargetD:String(expected),maximumTargetD:256});if(targetD!==undefined&&BigInt(targetD)!==expected)fail('FROBENIUS_TARGET_MISMATCH','The geometric pullback requires target C(pD); arbitrary cropping is not this pullback.',{sourceD:source.D,p:String(p),requiredTargetD:String(expected)});const target=p1Complex(Number(expected)),lookup=target.basis.map(b=>new Map(b.map((x,i)=>[x.id,i])));
  const maps=source.basis.map((b,k)=>matrix(target.dims[k],source.dims[k],b.map((x,col)=>{const j=x.formDegree===0?Number(p)*x.exponent:Number(p)*(x.exponent+1)-1;const id=`${x.chart}:${x.formDegree?'form':'function'}:${j}`;const row=lookup[k].get(id);if(row===undefined)fail('INTERNAL_CERTIFICATE','Frobenius target basis omits an image.');return[row,col,x.formDegree?String(p):'1'];})));
  const verification=checkChainMap(source,target,maps,{meter});if(!verification.pass)fail('INTERNAL_CERTIFICATE','Frobenius is not a chain map.',verification);const R=p1Retraction(source),T=p1Retraction(target),transported=maps.map((F,k)=>multiply(multiply(T.r[k],F,meter),R.i[k],meter));return{target,maps,verification,transported,cohomologyFrobenius:[{degree:0,multiplier:'1'},{degree:2,multiplier:String(p)}],precision:{operation:'frobenius_pullback',coefficientFrobenius:'identity',coordinateDegree:{source:source.D,target:Number(expected)},lossDigits:0,formCoefficient:String(p),reason:'Integral pullback; multiplication by p does not lose input p-adic digits.'}};
}
const COMPLETED_MODEL_PROOF=Object.freeze({
  schema:'MathScope.CompletedWeightCertificate/1',support:'The p-adic completion of the algebraic direct sum consists of Laurent coefficient families tending to zero p-adically as |k| tends to infinity. At every N only finitely many coefficients are nonzero modulo p^N.',
  positiveWeight:{a:'x -> (k*x,-x)',b:'(u,v) -> -u-k*v',h1:'(u,v) -> -v',h2:'w -> (-w,0)'},
  negativeWeight:{a:'x -> (-k*x,x)',b:'(u,v) -> -u-k*v',h1:'(u,v) -> v',h2:'w -> (-w,0)'},
  zeroWeight:{d0:'(a,b) -> b-a',r0:'(a,b) -> a',i0:'a -> (a,a)',h1:'c -> (0,c)',H2:'overlap form dt/t'},
  proof:'Each nonzero weight has h1*a=id, a*h1+h2*b=id and b*h2=id. Every h,i,r coefficient is 0 or +/-1. Thus the maps preserve p^N divisibility for every N, preserve restricted coefficient families, and extend continuously to the p-adic completion. The identities hold in every coefficient modulo p^N and hence in the separated inverse limit. No k is inverted, including p|k.',
  scope:'The underlying A-module complex and Frobenius; no claim of multiplicative or E-infinity formality.',
  allWeights:'UNIVERSAL_INTEGER_IDENTITIES',completion:'EXPLICIT_CONTINUOUS_EXTENSION_ARGUMENT',finiteCutoffIsJustifiedBy:'Uniform strong deformation retract, not stability of sampled Betti numbers.',
  leanTargets:['positive_weight_contractible','negative_weight_contractible','restricted_neg','restricted_mul_weight','restricted_select','inverse_system_identity'],
});
function subcomplexByBasis(C,allowed,{name='SUBCOMPLEX'}={}) {
  if(!Array.isArray(allowed)||allowed.length!==C.dims.length)fail('INVALID_FILTRATION','One basis selector per cochain degree is required.');const look=allowed.map((xs,k)=>{if(!Array.isArray(xs)||new Set(xs).size!==xs.length||xs.some(i=>!Number.isInteger(i)||i<0||i>=C.dims[k]))fail('INVALID_FILTRATION','Invalid basis indices.');return new Map(xs.map((x,i)=>[x,i]));});
  for(let k=0;k<C.differentials.length;k++)for(const[r,c,v]of C.differentials[k].entries)if(look[k].has(c)&&!look[k+1].has(r)&&v!=='0')fail('NOT_SUBCOMPLEX','The differential leaves the selected subspace.',{degree:k,row:r,column:c});
  const dims=allowed.map(x=>x.length),differentials=C.differentials.map((a,k)=>matrix(dims[k+1],dims[k],a.entries.filter(([r,c])=>look[k].has(c)&&look[k+1].has(r)).map(([r,c,v])=>[look[k+1].get(r),look[k].get(c),v])));return{kind:name,dims,differentials,basis:allowed.map((xs,k)=>xs.map(i=>C.basis[k][i])),inclusion:allowed.map((xs,k)=>matrix(C.dims[k],xs.length,xs.map((i,j)=>[i,j,1]))),subcomplex:true};
}
function filtration(C,{kind='stupid',r=1}={}) {r=small(r,'filtration index',-2,4);if(kind==='nygaard')return{kind:'NYGAARD',status:'UNSUPPORTED',reason:'A derived Nygaard filtration requires its Frobenius twist and descent comparison. Cochain degree or divisibility in an arbitrary splitting is not substituted.'};if(kind==='stupid'||kind==='hodge'){const allowed=C.basis.map((b,k)=>b.map((x,i)=>({x,i})).filter(({x})=>kind==='stupid'?k>=r:x.formDegree>=r).map(({i})=>i));return{...subcomplexByBasis(C,allowed,{name:kind==='stupid'?'DECREASING_COCHAIN_DEGREE':'DE_RHAM_FORM_DEGREE_HODGE'}),r,cohomologyDimensions:null,explanation:'Returned dimensions are cochain groups, not filtered cohomology dimensions.'};}if(kind==='naive_below'){return subcomplexByBasis(C,C.basis.map((b,k)=>k<=r?b.map((_,i)=>i):[]),{name:'REQUESTED_NAIVE_BELOW'});}if(kind==='quotient_below'){const dims=C.dims.map((d,k)=>k<=r?d:0);return{kind:'QUOTIENT_TRUNCATION',r,dims,differentials:C.differentials.map((d,k)=>k+1<=r?d:zero(dims[k+1],dims[k])),subcomplex:false,reason:'The quotient by degrees greater than r, with the outgoing top differential set to zero.'};}if(kind==='smart_below'){if(r<0)return{kind:'SMART_TRUNCATION',r,dims:[0,0,0],differentials:[zero(0,0),zero(0,0)]};if(r===0)return{kind:'SMART_TRUNCATION',r,dims:[1,0,0],differentials:[zero(0,1),zero(0,0)],topKernelGenerators:p1Retraction(C).i[0]};if(r===1){const D=C.D,n=2*D+1,entries=[...Array.from({length:n},(_,i)=>[i,i+1,1]),[D,0,-1]];return{kind:'SMART_TRUNCATION',r,dims:[C.dims[0],n,0],differentials:[matrix(n,C.dims[0],entries),zero(0,n)],topKernelGenerators:matrix(C.dims[1],n,C.differentials[0].entries.filter(([,c])=>c>0).map(([row,c,v])=>[row,c-1,v])),reason:'ker d1 = im d0; the omitted constant column equals the negative of the U1 constant column.'};}return{kind:'SMART_TRUNCATION',r,dims:C.dims,differentials:C.differentials};}fail('UNSUPPORTED_FILTRATION','Unknown filtration or truncation kind.');}
function comparisonApplication(model,p) {
  if(!['point','P1'].includes(model))fail('UNSUPPORTED_MODEL','Only the point and projective line have this comparison application.');
  return{schema:'MathScope.PrismaticComparisonApplication/1',model,base:crystallinePrism(p),objectIdentity:'PRISMATIC_VIA_COMPARISON',geometry:{specialFiber:model==='point'?'Spec(F_p)':'P1/F_p',lift:model==='point'?'Spec(Z_p)':'P1/Z_p',smooth:true,proper:true,cover:model==='point'?['Spec(Z_p)']:['Spec(Z_p[t])','Spec(Z_p[s])'],overlap:model==='point'?null:'Spec(Z_p[t,t^-1]), s=t^-1',completion:'p-adic completion of the Cech-de Rham coefficient modules'},arrows:[{id:'explicit-replacement',from:'finite-perfect K',to:'completed Cech-de Rham',method:model==='point'?'identity':'integral strong deformation retract and uniformly continuous weight contraction',status:'EXPLICIT_MATHEMATICAL_CONSTRUCTION',formalCoverage:'Universal block identities plus finite matrix fixtures; see the actual Lean audit.'},{id:'de-rham-crystalline',from:'completed Cech-de Rham',to:'RΓ_crys(X/Z_p)',source:'S02',locator:'Theorem 3.6 and Corollary 3.8',hypotheses:['proper smooth lift over Z_p','special fiber X over F_p','completed de Rham hypercohomology'],status:'THEOREM_REFERENCE',leanImport:null},{id:'crystalline-prismatic',from:'RΓ_crys(X/Z_p)',to:'RΓ_Delta(X/Z_p) completed-tensor_(Z_p,phi) Z_p',source:'S01',locator:'Theorem 1.8(1), Theorem 5.2',hypotheses:['bounded prism (Z_p,(p))','smooth X/F_p','phi_A=id'],twist:'The base-change is along the identity, so no nontrivial coefficient twist remains.',frobeniusCompatible:true,status:'THEOREM_REFERENCE',leanImport:null}],multiplicativeCertification:'NOT_CLAIMED_FOR_THE_EXPLICIT_FINITE_REPLACEMENT',formalComplete:false,nativePrismaticSiteImplementation:false,remainingFormalization:['Scheme/formal-scheme geometry and Cech descent in Lean','The exact exported S02 and S01 comparison theorems are not imported into this Lean project.']};
}
function reduceFreeComplex(C,p,N,meter=null) {
  p=primeBase(p);N=small(N,'N',1,256);if(!C||!Array.isArray(C.dims)||C.dims.length<1||C.dims.length>16||C.dims.some(d=>!Number.isInteger(d)||d<0||d>4096))fail('INVALID_COMPLEX','A bounded complex with explicit finite free dimensions is required.');
  const sourceRing=C.coefficientRing;if(!sourceRing||!['INTEGER_RING','FINITE_P_POWER_RING'].includes(sourceRing.kind))fail('UNSUPPORTED_BASE_CHANGE','Supply an integer free complex or an explicitly typed finite p-power free complex.');let sourceMod=null;
  if(sourceRing.kind==='FINITE_P_POWER_RING'){if(String(sourceRing.p)!==String(p))fail('PADIC_BASE_MISMATCH','This reduction does not identify different prime bases.');const M=small(sourceRing.N,'source N',1,256);if(N>M)fail('PRECISION_REQUIRED','Coefficient reduction cannot create missing digits.',{availableDigits:M,requiredDigits:N});sourceMod=p**BigInt(M);if(sourceRing.modulus!==String(sourceMod))fail('INVALID_MODULUS','Source ring modulus mismatch.');}
  const sourceCheck=checkComplex(C,meter,sourceMod);if(!sourceCheck.pass)fail('NOT_COMPLEX','The source differential does not square to zero in its coefficient ring.',sourceCheck);
  const modulus=p**BigInt(N),result={schema:'MathScope.BoundedFreeComplex/1',kind:'BOUNDED_FREE_COMPLEX',dims:C.dims.slice(),basis:C.basis??C.dims.map((d,k)=>Array.from({length:d},(_,i)=>({id:`C${k}:e${i}`}))),coefficientRing:{kind:'FINITE_P_POWER_RING',p:String(p),N,modulus:String(modulus)},differentials:C.differentials.map(d=>reduceMatrix(d,modulus))};
  if(result.basis.some((basis,k)=>!Array.isArray(basis)||basis.length!==result.dims[k]))fail('INVALID_BASIS','Ordered basis dimensions do not match the complex.');
  return{operation:'derived_base_change',sourceRing,targetRing:result.coefficientRing,result,checks:[{name:'source d squared',...sourceCheck},{name:'reduced d squared',...checkComplex(result,meter,modulus)}],justification:{KFlatReason:'A bounded complex of explicitly free modules is K-flat; tensoring its terms computes derived tensor.',cohomologyBeforeTensor:false,geometricComparison:'NOT_INFERRED_FROM_AN_ARBITRARY_INPUT_COMPLEX'},precision:{operation:'coefficient_reduction',outputDigits:N,lossDigits:sourceRing.kind==='FINITE_P_POWER_RING'?sourceRing.N-N:0,rounding:'0',map:'same-prime residue reduction'}};
}
async function p1Model({p=3,N=4,D=1,filtrationKind='stupid',filtrationIndex=1,targetD}={},meter=null) {
  p=primeBase(p,meter);N=small(N,'N',1,256);D=small(D,'D',1,32);const C=p1Complex(D),R=p1Retraction(C),dSquared=checkComplex(C,meter),homotopy=checkRetraction(C,R,meter),F=p1Frobenius(C,p,{targetD,meter}),S=p1SmithCertificate(C),comparison=comparisonApplication('P1',p);if(!dSquared.pass||!homotopy.pass||!S.d0.unitMinor.pass||!S.d1.unitMinor.pass)fail('INTERNAL_CERTIFICATE','P1 exact model verification failed.');
  const modulus=p**BigInt(N),reduced={...C,coefficientRing:{kind:'FINITE_P_POWER_RING',p:String(p),N,modulus:String(modulus)},differentials:C.differentials.map(d=>reduceMatrix(d,modulus))},reducedR={...R,i:R.i.map(a=>reduceMatrix(a,modulus)),r:R.r.map(a=>reduceMatrix(a,modulus)),h:R.h.map(a=>reduceMatrix(a,modulus))},raw={complex:C,retraction:R,frobenius:{sourceD:D,targetD:F.target.D,maps:F.maps,transported:F.transported},p:String(p),N,comparison};
  const rawHash=await hash(raw);return{schema:'MathScope.PrismaticModelResult/1',object:{kind:'PRISMATIC_VIA_COMPARISON',model:'P1',p:String(p),relativeDimension:1,cohomologicalDegrees:[0,1,2]},scope:{arithmetic:'EXACT_INTEGER_CONSTRUCTION_AND_MOD_PN_OBSERVATION',geometricModels:['P1/F_p with its standard smooth proper Z_p lift'],precision:{N,D,targetD:F.target.D,cechDegree:1,cohomologicalDegree:2,rootDepth:null,qOrUDegree:null},proof:'FINITE_AND_UNIVERSAL_ALGEBRA_KERNEL_CHECKS_PLUS_EXTERNAL_COMPARISON_THEOREMS'},complex:C,finiteObservation:reduced,retraction:R,completedWeightCertificate:COMPLETED_MODEL_PROOF,frobenius:F,smith:S,comparison,filtration:filtration(C,{kind:filtrationKind,r:filtrationIndex}),checks:[{name:'integer d^2=0',...dSquared},{name:'integer strong deformation retract',...homotopy},{name:'Frobenius chain map',...F.verification},{name:'mod p^N homotopy',...checkRetraction(reduced,reducedR,meter,modulus)},{name:'unit Smith minors',pass:S.d0.unitMinor.pass&&S.d1.unitMinor.pass}],error:{rounding:'0',omittedCoordinates:'Eliminated by the explicit all-weight contraction; not by numeric convergence.',pAdic:'An exact residue class modulo p^N; no extra unknown digits.'},rawHash,integrityPayload:raw,formalComplete:false};
}
async function pointModel({p=3,N=4}={}) {p=primeBase(p);N=small(N,'N',1,256);const base=crystallinePrism(p),comparison=comparisonApplication('point',p),data={p:String(p),N,complex:{ring:'Z_p',dims:[1],differentials:[],basis:[['1']]},finiteObservation:{ring:{kind:'FINITE_P_POWER_RING',p:String(p),N,modulus:String(p**BigInt(N))},dims:[1],differentials:[]},frobenius:{maps:[identity(1)],cohomology:[{degree:0,multiplier:'1'}]},cohomology:[{degree:0,module:'Z/p^N',freeRank:1,torsion:[]}],comparison};return{schema:'MathScope.PrismaticModelResult/1',object:{kind:'PRISMATIC_VIA_COMPARISON',model:'point',p:String(p),relativeDimension:0},...data,base,scope:{arithmetic:'EXACT_MOD_PN',geometricModel:'Spec(F_p)',precision:{N},proof:'THEOREM_REFERENCE_WITH_FINITE_IDENTITY_CHECK'},checks:[{name:'base prism admission',...validatePrismBase(base)},{name:'point differential and Frobenius',pass:true}],rawHash:await hash(data),integrityPayload:data,formalComplete:false};}
async function verifyModel(result) {
  try {
    if(result?.object?.kind!=='PRISMATIC_VIA_COMPARISON'||!['P1','point'].includes(result.object.model))return{pass:false,reason:'Unsupported geometric object identity'};
    if(result.formalComplete!==false||result.comparison?.formalComplete!==false)return{pass:false,reason:'External comparison cannot claim complete Lean formalization'};
    if(result.comparison?.multiplicativeCertification!=='NOT_CLAIMED_FOR_THE_EXPLICIT_FINITE_REPLACEMENT')return{pass:false,reason:'Unsupported multiplicative formality claim'};
    if(!validatePrismBase(result.comparison.base).pass)return{pass:false,reason:'Invalid base prism'};
    if(await hash(result.integrityPayload)!==result.rawHash)return{pass:false,reason:'Raw-data hash mismatch'};
    const canonicalComparison=comparisonApplication(result.object.model,result.object.p);
    if(canonical(result.comparison)!==canonical(canonicalComparison))return{pass:false,reason:'Comparison assumptions, geometry, or theorem adapters were modified'};
    if(result.object.model==='P1') {
      const p=primeBase(result.object.p),N=small(result.scope.precision.N,'N',1,256),C=p1Complex(result.scope.precision.D),R=p1Retraction(C),F=p1Frobenius(C,p),S=p1SmithCertificate(C),modulus=p**BigInt(N);
      const finite={...C,coefficientRing:{kind:'FINITE_P_POWER_RING',p:String(p),N,modulus:String(modulus)},differentials:C.differentials.map(d=>reduceMatrix(d,modulus))};
      const raw={complex:C,retraction:R,frobenius:{sourceD:C.D,targetD:F.target.D,maps:F.maps,transported:F.transported},p:String(p),N,comparison:canonicalComparison};
      if(canonical(raw)!==canonical(result.integrityPayload)||canonical(C)!==canonical(result.complex)||canonical(R)!==canonical(result.retraction)||canonical(result.completedWeightCertificate)!==canonical(COMPLETED_MODEL_PROOF))return{pass:false,reason:'Basis, matrices, or all-weight contraction differs from the admitted model'};
      if(canonical(finite)!==canonical(result.finiteObservation)||canonical(S)!==canonical(result.smith))return{pass:false,reason:'Finite coefficient observation or cohomology modules were altered'};
      if(canonical(F)!==canonical(result.frobenius))return{pass:false,reason:'Wrong geometric Frobenius, transported action, or target cutoff'};
      if(!checkComplex(result.complex).pass||!checkRetraction(result.complex,result.retraction).pass)return{pass:false,reason:'Algebraic certificate failed'};
      if(result.filtration?.subcomplex&&(!checkComplex(result.filtration).pass||!checkChainMap(result.filtration,C,result.filtration.inclusion).pass))return{pass:false,reason:'Filtration is not the declared subcomplex'};
    } else {
      const expected=await pointModel({p:result.object.p,N:result.N});
      for(const key of ['complex','finiteObservation','frobenius','cohomology','base','integrityPayload'])if(canonical(result[key])!==canonical(expected[key]))return{pass:false,reason:'Point model or finite observation was altered: '+key};
    }
    return{pass:true,scope:'Explicit model and its exact certificate; literature comparison remains THEOREM_REFERENCE'};
  } catch(e) {return{pass:false,reason:e.message};}
}

return {p1Complex,p1Retraction,checkComplex,checkRetraction,checkChainMap,weightContraction,verifyWeightContraction,p1SmithCertificate,p1Frobenius,COMPLETED_MODEL_PROOF,subcomplexByBasis,filtration,comparisonApplication,reduceFreeComplex,p1Model,pointModel,verifyModel};
})();
const __m1_4 = (()=>{
const {bigint,small,fail,mod,inverseUnit,valuation,hash} = __m1_0;
const {primeBase,crystallinePrism,padic,reducePadic} = __m1_2;
const {p1Complex,p1Frobenius} = __m1_3;
function integerModel(input={}) {const kind=input.model??'P1';if(kind==='point'||kind==='P1')return{kind,base:'Spec(Z)',equations:kind==='point'?[]:['P1=Proj Z[X0,X1]'],badPrimes:[],smoothProperOverZ:true};if(kind==='elliptic'){const a=bigint(input.a??'-1','a'),b=bigint(input.b??'0','b'),discriminant=-16n*(4n*a*a*a+27n*b*b);if(!discriminant)fail('SINGULAR_CURVE','The rational cubic has discriminant zero; it is not an elliptic curve.');return{kind,a:String(a),b:String(b),equation:'y^2=x^3+a*x+b',base:'Spec(Z)',discriminant:String(discriminant),minimalModelClaim:false};}fail('UNSUPPORTED_MODEL','Only point, P1 and short Weierstrass elliptic inputs are admitted.');}
function classifyReduction(model,p) {p=primeBase(p);if(model.kind==='point'||model.kind==='P1')return{prime:String(p),modelSmooth:true,curveGoodReduction:true,status:'GOOD',reason:'Standard projective space or identity point is smooth and proper over Z.'};const d=BigInt(model.discriminant),v=valuation(d,p),smooth=mod(d,p)!==0n;if(smooth)return{prime:String(p),modelSmooth:true,curveGoodReduction:true,status:'GOOD',discriminantValuation:0,minimality:'A unit discriminant is already minimal.',certificate:{discriminant:model.discriminant,residue:String(mod(d,p))}};
  const a=BigInt(model.a),b=BigInt(model.b);if(a%(p**4n)===0n&&b%(p**6n)===0n)return{prime:String(p),modelSmooth:false,curveGoodReduction:null,status:'MINIMIZATION_REQUIRED',discriminantValuation:v,transformation:{x:`${p}^2*x'`,y:`${p}^3*y'`,aPrime:String(a/(p**4n)),bPrime:String(b/(p**6n))},reason:'A singular displayed model may define a curve with good reduction after an integral minimal-model computation.'};
  if(v<12)return{prime:String(p),modelSmooth:false,curveGoodReduction:false,status:'BAD_REDUCTION',discriminantValuation:v,minimality:'Any discriminant-lowering integral Weierstrass transformation lowers v_p(Delta) by 12e. Since 0<v_p(Delta)<12, no integral model can lower it.',localFactorStatus:'UNKNOWN_UNTIL_BAD_REDUCTION_ALGORITHM_OR_CERTIFICATE'};
  return{prime:String(p),modelSmooth:false,curveGoodReduction:null,status:'MINIMIZATION_REQUIRED',discriminantValuation:v,reason:'This backend does not implement a general Tate/minimal-model algorithm.'};
}
function countProjectiveLine(p,meter=null) {p=primeBase(p);if(p>257n)fail('RESOURCE_LIMIT','The independent normalized-pair oracle is limited to p <= 257.');const set=new Set();for(let x=0n;x<p;x++)for(let y=0n;y<p;y++){meter?.tick();if(x===0n&&y===0n)continue;if(x!==0n)set.add(`1:${mod(y*inverseUnit(x,p),p)}`);else set.add('0:1');}return{count:String(set.size),method:'Enumerate nonzero F_p^2 vectors and identify scalar multiples by normalization',chartCount:String(p+1n),pass:BigInt(set.size)===p+1n};}
function countElliptic(model,p,meter=null) {p=primeBase(p);if(p>257n)fail('RESOURCE_LIMIT','Direct elliptic point enumeration is limited to p <= 257.');const reduction=classifyReduction(model,p);if(reduction.status!=='GOOD')fail('BAD_OR_UNVERIFIED_REDUCTION','The smooth-crystalline local path requires good reduction.',reduction);let count=1n;const a=BigInt(model.a),b=BigInt(model.b);for(let x=0n;x<p;x++)for(let y=0n;y<p;y++){meter?.tick();if(mod(y*y-x*x*x-a*x-b,p)===0n)count++;}const residues=new Map();for(let y=0n;y<p;y++){const r=String(y*y%p);residues.set(r,(residues.get(r)??0)+1);}let independent=1n;for(let x=0n;x<p;x++)independent+=BigInt(residues.get(String(mod(x*x*x+a*x+b,p)))??0);return{count:String(count),aP:String(p+1n-count),independentCount:String(independent),checks:[{name:'full pair enumeration vs square-residue multiplicities',pass:count===independent}],scope:'Exact finite-field point count; no integral elliptic prismatic complex or MW matrix is inferred.'};}
async function localFactorBundle(input={},precision={},meter=null) {
  const model=integerModel(input),modelHash=await hash(model),ps=input.primes??['2','3','5','7'];if(!Array.isArray(ps)||ps.length<1||ps.length>64)fail('INPUT_RANGE','Provide 1 to 64 prime places.');const seen=new Set();for(const p of ps){const q=String(primeBase(p));if(seen.has(q))fail('DUPLICATE_PRIME','Duplicate local places are not allowed.');seen.add(q);}const levels=precision.levels??[1,2,4,8];if(!Array.isArray(levels)||levels.length<1||levels.length>16)fail('INPUT_RANGE','Provide 1 to 16 precision levels.');const Ns=[...new Set(levels.map(n=>small(n,'precision level',1,256)))].sort((a,b)=>a-b);if(Ns.length!==levels.length)fail('DUPLICATE_PRECISION','Precision levels must be unique.');const places=[];
  for(const place of ps){meter?.tick(0);const p=primeBase(place),reduction=classifyReduction(model,p),base=crystallinePrism(p);let factor,oracle=null,frobenius=null;
    if(reduction.status!=='GOOD')factor={kind:'UNRESOLVED_LOCAL_FACTOR',status:'UNKNOWN',reason:reduction.reason??reduction.localFactorStatus};
    else if(model.kind==='point'){frobenius=[{degree:0,eigenvalue:'1'}];factor={kind:'SCHEME_ZETA_LOCAL_FACTOR',numerator:['1'],denominator:['1','-1'],variable:'T',status:'EXACT_FINITE_POLYNOMIAL',formula:'1/(1-T)'};oracle={count:'1',frobeniusTrace:'1',pass:true};}
    else if(model.kind==='P1'){const F=p1Frobenius(p1Complex(1),p,{meter});frobenius=F.cohomologyFrobenius;oracle=countProjectiveLine(p,meter);factor={kind:'SCHEME_ZETA_LOCAL_FACTOR',numerator:['1'],denominator:['1',String(-p-1n),String(p)],variable:'T',status:'EXACT_FINITE_POLYNOMIAL',formula:'1/((1-T)(1-p*T))',cohomologyDeterminants:[{degree:0,coefficients:['1','-1']},{degree:2,coefficients:['1',String(-p)]}]};oracle.frobeniusTrace=String(1n+p);oracle.pass=oracle.pass&&oracle.count===oracle.frobeniusTrace;}
    else{oracle=countElliptic(model,p,meter);factor={kind:'ELLIPTIC_L_LOCAL_FACTOR',numerator:['1'],denominator:['1',String(-BigInt(oracle.aP)),String(p)],variable:'T',substitution:'T=p^(-s)',status:'EXACT_FINITE_POLYNOMIAL',formula:'1/(1-a_p*T+p*T^2)',cohomologyOrigin:'H1 Frobenius characteristic polynomial from the good-reduction trace theorem; not a computed integral prismatic matrix.',source:{id:'S08',locator:'pp.1-2',status:'THEOREM_REFERENCE'}};}
    const tower=Ns.map(N=>({N,coefficientRing:{kind:'FINITE_P_POWER_RING',p:String(p),N,modulus:String(p**BigInt(N))},modelHash,cohomologyFrobenius:frobenius?.map(f=>({degree:f.degree,multiplier:padic(p,f.multiplier??f.eigenvalue,N)}))??null}));
    const arrows=Ns.slice(1).map((N,i)=>({source:{p:String(p),N},target:{p:String(p),N:Ns[i]},kind:'COEFFICIENT_REDUCTION',method:'Termwise reduction of a bounded free replacement; derived tensor is computed on the complex.',crossPrime:false}));places.push({prime:String(p),modelHash,reduction,base,precisionTower:{levels:tower,arrows},factor,oracle,frobeniusConvention:'Geometric Frobenius on etale/rational cohomology; the crystalline pullback convention is fixed to have H2(P1) eigenvalue p.',conductor:{status:model.kind==='elliptic'?'UNKNOWN':'TRIVIAL_FOR_STANDARD_MODEL',value:model.kind==='elliptic'?null:'1'},sources:model.kind==='elliptic'?['S08']:['S01','S02','S07']});
  }
  const unresolved=places.filter(x=>x.factor.status==='UNKNOWN').map(x=>x.prime),archimedean=model.kind==='elliptic'?{kind:'ELLIPTIC_COMPLETED_FACTOR',gamma:'(2*pi)^(-s)*Gamma(s)',conductor:'UNKNOWN',normalization:'Lambda_E=N_E^(s/2)*(2*pi)^(-s)*Gamma(s)*L(E,s)',status:'INCOMPLETE_LOCAL_DATA'}:{kind:'PROJECTIVE_ZETA_COMPLETION',gamma:model.kind==='point'?'Gamma_R(s)':'Gamma_R(s)*Gamma_R(s-1)',GammaR:'pi^(-s/2)*Gamma(s/2)',conductor:'1',status:'SYMBOLIC_NORMALIZATION'};
  return{schema:'MathScope.PrimeIndexedArithmeticPackage/1',model,modelHash,primeDomain:{kind:'SYMBOLIC_PRIME_INDEX_SET',definition:'{ n : Nat | Nat.Prime n }'},places,coverage:{finitePrimePlaces:[...seen],unresolvedFinitePlaces:unresolved,uncomputed:'Every prime outside the finite place list'},globalBundle:{kind:model.kind==='elliptic'?'FINITE_INCOMPLETE_ELLIPTIC_EULER_PRODUCT':'FINITE_SCHEME_ZETA_EULER_PRODUCT',status:'INCOMPLETE_LOCAL_DATA',isCompleteGlobalLFunction:false,goodOnlyNotation:model.kind==='elliptic'?'L^S finite product':null,archimedean,analyticContinuation:null,rootNumber:null,reason:'Finite local data do not certify an infinite Euler product. Unresolved bad places and conductor remain explicit.'},checks:places.flatMap(x=>x.oracle?[{name:`local count/trace p=${x.prime}`,pass:x.oracle.pass??x.oracle.checks.every(c=>c.pass)}]:[]),crossPrimeArithmetic:'REJECTED; p indexes a family, not a coefficient-ring identification.'};
}
function verifyTowerReduction(p,values,N1,N2) {p=primeBase(p);if(N1<N2)fail('INPUT_RANGE','Precision reduction cannot increase N.');return values.map(value=>({original:padic(p,value,N1),reduced:reducePadic(padic(p,value,N1),N2),direct:padic(p,value,N2),pass:reducePadic(padic(p,value,N1),N2).residue===padic(p,value,N2).residue}));}

return {integerModel,classifyReduction,countProjectiveLine,countElliptic,localFactorBundle,verifyTowerReduction};
})();
const __m1_5 = (()=>{
const SOURCES = Object.freeze([
  {id:'S01',title:'Bhatt–Scholze, Prisms and Prismatic Cohomology',url:'https://people.mpim-bonn.mpg.de/scholze/prisms.pdf',locator:'Definition 1.1; Example 1.3(1); Definition 1.4; Theorem 1.8(1), printed pp.2–4; Theorem 5.2',accessed:'2026-10-09',role:'Bounded crystalline prism and Frobenius-compatible crystalline comparison',status:'THEOREM_REFERENCE',leanImport:null},
  {id:'S02',title:'Bhatt–de Jong, Crystalline cohomology and de Rham cohomology',url:'https://arxiv.org/html/1110.5001v1',locator:'Theorem 3.6 and Corollary 3.8',accessed:'2026-10-09',role:'De Rham hypercohomology of a proper smooth Z_p lift computes crystalline cohomology of its special fiber.',status:'THEOREM_REFERENCE',leanImport:null},
  {id:'S07',title:'Deligne, La conjecture de Weil I',url:'https://www.numdam.org/item/PMIHES_1974__43__273_0.pdf',locator:'(1.5.1)–(1.5.4), printed pp.275–276',accessed:'2026-10-09',role:'Finite-field trace and alternating determinant convention; not a classical RH bridge.',status:'THEOREM_REFERENCE',leanImport:null},
  {id:'S08',title:'Wiles, The Birch and Swinnerton-Dyer Conjecture',url:'https://www.claymath.org/wp-content/uploads/2022/05/birchswin.pdf',locator:'pp.1–2, good elliptic Euler factors and the BSD statement',accessed:'2026-10-09',role:'Local H1 L-factor and distinction from the scheme zeta factor.',status:'THEOREM_REFERENCE',leanImport:null},
  {id:'S10',title:'NIST DLMF §25.16 Mathematical Applications',url:'https://dlmf.nist.gov/25.16',locator:'§25.16(i), equations 25.16.1–25.16.4',accessed:'2026-10-09',role:'Chebyshev psi, prime counting, PNT/RH scope.',status:'THEOREM_REFERENCE',leanImport:null},
  {id:'MATHLIB-LUCAS',title:'mathlib Lucas primality theorem',url:'https://github.com/leanprover-community/mathlib4/blob/d13f23b723b8a846827a245b89c10fc7d3f11612/Mathlib/NumberTheory/LucasPrimality.lean',locator:'lucas_primality, reverse_lucas_primality',accessed:'2026-10-09',role:'The library theorem is imported by the arithmetic Lean adapter. The JavaScript Pratt certificate checker is separately tested.',status:'LEAN_IMPORT_CHECKED',leanImport:'MathScope.M1.Arithmetic.lucas_certificate_sound',audit:'evidence/lean-audit.json'},
  {id:'S14',title:'SageMath, Isomorphisms between Weierstrass models',url:'https://doc.sagemath.org/html/en/reference/arithmetic_curves/sage/schemes/elliptic_curves/weierstrass_morphism.html',locator:'WeierstrassIsomorphism: explicit (u,r,s,t) coordinate and coefficient transformation formulas',accessed:'2026-10-09',role:'A displayed singular nonminimal model is distinguished from the reduction of the curve; x=u^2*x_new, y=u^3*y_new rescales short coefficients by u^4 and u^6.',status:'THEOREM_REFERENCE',leanImport:null},
]);
const LOCAL_DESIGN_SOURCES=Object.freeze(['blueprint-work/arithmetic-stages.json: P1-01..P3-08','blueprint-work/arithmetic-design.md: §§3–5, §§9–11','blueprint-work/appendix-arithmetic.tex: A1–A4','blueprint-work/platform-stages.json: I1-03,I1-07,I3-02,I3-04']);

return {SOURCES,LOCAL_DESIGN_SOURCES};
})();
const __m1_6 = (()=>{
const {ArithmeticError,bigint,small,fail,canonical,hash,meter,matrix,reduceMatrix} = __m1_0;
const {PRIME_DOMAIN,segmentedPrimes,primeStatistics,primeView,generatePrimeCertificate,verifyPrimeCertificate,nextPrime,verifyPrimeSegments} = __m1_1;
const {padic,addPadic,multiplyPadic,divideByInteger,deltaPadic,precisionFailureFixture,finiteRingModule,verifyFiniteRingModule,determinantPadic,derivedReductionFixture,crystallinePrism,validatePrismBase} = __m1_2;
const {pointModel,p1Model,verifyModel,weightContraction,verifyWeightContraction,checkComplex,checkChainMap,checkRetraction,p1Complex,p1Retraction,filtration,reduceFreeComplex} = __m1_3;
const {localFactorBundle} = __m1_4;
const {SOURCES,LOCAL_DESIGN_SOURCES} = __m1_5;
const VERSION='1.0.0';
const KINDS=['arithmetic.primes','arithmetic.primeCertificate','arithmetic.padic','arithmetic.point','arithmetic.p1','arithmetic.localFactors','arithmetic.verify'];
function getCapabilities(){return{schema:'MathScope.ArithmeticCapabilities/1',version:VERSION,kinds:KINDS,primeDomain:PRIME_DOMAIN,limits:{maxPrimeIntervalWidth:8388608,defaultPrimeIntervalWidth:2097152,segmentIntegers:1048576,maxBasePrime:2000000,chartPoints:20000,primeCertificateIntegerDigits:256,padicDigits:256,p1SourceD:32,p1FrobeniusTargetD:256,moduleMatrixDimension:16,determinantDimension:32},supported:['exact bounded segmented enumeration and Lucas/Pratt certificates','Z_p observations, guard-digit delta, exact integer division, finite-ring Smith certificates','point and P1 crystalline/prismatic comparison models with integral all-weight contraction','explicit P1 chain Frobenius and good finite elliptic point-count Euler factors','decreasing cochain and de Rham Hodge subcomplexes, quotient and smart truncation'],unsupported:['arbitrary native prismatic-site computation','general Tate/minimal-model algorithm or complete elliptic L function','Nygaard descent certificate','general q/Breuil–Kisin/A_inf arithmetic','classical RH or general BSD proof'],externalTheoremAdapters:SOURCES.filter(x=>x.status==='THEOREM_REFERENCE'),formalComplete:false};}
function validateRequest(request){const errors=[];try{canonical(request);if(!request||typeof request!=='object'||Array.isArray(request))fail('INVALID_REQUEST','An object is required.');if(!KINDS.includes(request.kind))fail('UNSUPPORTED_KIND','Unsupported arithmetic job kind.');for(const key of Object.keys(request))if(!['kind','input','precision','budget'].includes(key))fail('UNKNOWN_REQUEST_FIELD','Unknown request field '+key);for(const field of ['input','precision','budget'])if(request[field]!==undefined&&(!request[field]||typeof request[field]!=='object'||Array.isArray(request[field])))fail('INVALID_REQUEST',field+' must be an object.');for(const key of ['N','D'])if(request.precision?.[key]!==undefined)small(request.precision[key],key,1,key==='D'?32:256);if(request.input?.allPrimesComputed!==undefined)fail('INVALID_DOMAIN','There is no finite all-primes-computed state.');if(request.budget)meter(request.budget);}
catch(e){errors.push({code:e.code??'INVALID_REQUEST',message:e.message,details:e.details??{}});}return{ok:errors.length===0,valid:errors.length===0,errors};}
function padicJob(input,precision,m){const p=input.p??3,N=precision.N??input.N??4,operation=input.operation??'delta',a=input.a?.kind?input.a:padic(p,input.residue??17,input.inputDigits??N);if(operation==='delta')return{operation,...deltaPadic(a,N,{exactInteger:input.exactInteger}),guardDigitCounterexample:precisionFailureFixture(p,Math.min(N,8))};if(operation==='add')return{operation,...addPadic(a,input.b)};if(operation==='multiply')return{operation,...multiplyPadic(a,input.b)};if(operation==='divide')return{operation,...divideByInteger(a,input.denominator,N)};if(operation==='module')return{operation,...finiteRingModule(input.matrix??matrix(1,1,[[0,0,p]]),p,N,m)};if(operation==='determinant')return{operation,...determinantPadic(input.matrix,p,N)};if(operation==='baseChange')return reduceFreeComplex(input.complex,p,N,m);if(operation==='derivedReduction')return{operation,...derivedReductionFixture(p,N)};if(operation==='prism')return{operation,base:crystallinePrism(p),checks:[{name:'prism admission',...validatePrismBase(crystallinePrism(p))}]};fail('UNSUPPORTED_OPERATION','Unsupported p-adic operation.');}
async function verifyJob(input,m){switch(input.type){case'primeCertificate':return verifyPrimeCertificate(input.certificate,{meter:m});case'primeSegments':return verifyPrimeSegments(input.segments,input.a,input.b,{meter:m});case'module':return verifyFiniteRingModule(input.certificate);case'model':return verifyModel(input.result);case'weight':{const w=weightContraction(input.k);return{weight:w,...verifyWeightContraction(w)};}case'complex':return checkComplex(input.complex,m);case'chainMap':return checkChainMap(input.source,input.target,input.maps,{meter:m,sigma:input.sigma??'identity',modulus:input.modulus?bigint(input.modulus):null});case'filtration':return filtration(p1Complex(input.D??1),input);default:fail('UNSUPPORTED_VERIFICATION','Unknown arithmetic verifier type.');}}
function visualization(kind,data,input){if(kind==='arithmetic.primes'){const view=primeView(data,input.view??{});return{points:view.points.map(x=>({pos:[x.x,x.y,x.z],label:`p=${x.prime}`,value:{prime:x.prime,index:x.index}})),lines:[],axes:[{label:'정수 위치',type:'ARITHMETIC_LOCATION'},{label:view.representation.axisTypes.y,type:'COUNT_OR_GAP'},{label:view.representation.zAxis,type:'LAYOUT_ATTRIBUTE'}],description:'완료한 유한 구간의 소수 관측',coordinateMeaning:'좌표는 소수·간격·구간 속성이다. 물리 공간이나 소수집합과 동형인 공간이 아니다.',lostInformation:view.representation.sampled?['표시 예산에 따라 일부 점을 생략한다. 원래 소수 목록과 정확한 개수는 보존한다.']:[],manifest:view.representation,sourceHash:data.rawHash};}if(kind==='arithmetic.p1'){const points=data.complex.basis.flatMap((basis,k)=>basis.map((b,i)=>({pos:[k,i,b.laurentWeight],label:b.id,value:{cohomologicalDegree:k,basisIndex:i,laurentWeight:b.laurentWeight,formDegree:b.formDegree,cechDegree:b.cechDegree}})));const lines=[];for(let k=0;k<2;k++)for(const[r,c,v]of data.complex.differentials[k].entries)lines.push({points:[[k,c,data.complex.basis[k][c].laurentWeight],[k+1,r,data.complex.basis[k+1][r].laurentWeight]],label:`d${k}: ${v}`,value:v});return{points,lines,axes:[{label:'cohomological degree k',type:'DEGREE'},{label:'ordered basis index',type:'CATEGORICAL'},{label:'Laurent weight',type:'INTEGER_WEIGHT'}],description:'P¹의 실제 Čech–de Rham 비교 모델과 미분',coordinateMeaning:'고차원 복합체의 관계를 배치한 3D 도식이다. 공간의 물리적 사영이 아니다.',lostInformation:['무한 weight는 전체 contraction 공식으로 다룬다. 화면에는 요청한 유한 D만 표시한다.','배치 거리·각도는 p-adic 거리나 cohomological 불변량이 아니다.'],sourceHash:data.rawHash};}if(kind==='arithmetic.localFactors')return{points:data.places.filter(x=>x.oracle).map(x=>({pos:[Number(x.prime),Number(x.oracle.count),Number(x.oracle.aP??0)],label:`p=${x.prime}`,value:x.factor})),lines:[],axes:[{label:'prime p',type:'PRIME_INDEX'},{label:'#X(F_p)',type:'EXACT_POINT_COUNT'},{label:'a_p (elliptic only)',type:'TRACE_ATTRIBUTE'}],description:'소수별 점계수와 국소 Euler 인자',coordinateMeaning:'p는 서로 다른 계수환의 지표이다. 서로 다른 p 사이의 ring 연산을 뜻하지 않는다.',lostInformation:['유한 목록 밖의 소수와 미확정 bad factors는 계산되지 않았다.']};return{points:[],lines:[],axes:[],description:'정확한 산술 값은 결과 표와 원자료에 표시한다.',coordinateMeaning:'산술 결과를 물리적 3D 구조로 해석하지 않는다.',lostInformation:[]};}
async function runJob(request,context={}) {
  const valid=validateRequest(request);if(!valid.ok)throw new ArithmeticError(valid.errors[0].code,valid.errors[0].message,valid.errors[0].details);const{kind,input={},precision={},budget={}}=request,m=meter(budget,context);m.tick(0);let data;
  if(kind==='arithmetic.primes'){if(input.operation==='nextPrime')data=nextPrime(input.after??2,budget,{...context,meter:m});else{data=await segmentedPrimes(input,budget,{...context,meter:m});data.statistics=primeStatistics(data,input,m);}}
  else if(kind==='arithmetic.primeCertificate')data=input.certificate?verifyPrimeCertificate(input.certificate,{meter:m}):generatePrimeCertificate(input.n??97,{meter:m,maxTrialDivisor:small(input.maxTrialDivisor??100000,'maxTrialDivisor',2,1000000),maxWitness:small(input.maxWitness??256,'maxWitness',2,4096)});
  else if(kind==='arithmetic.padic')data=padicJob(input,precision,m);
  else if(kind==='arithmetic.point')data=await pointModel({...input,N:precision.N??input.N??4});
  else if(kind==='arithmetic.p1')data=await p1Model({...input,N:precision.N??input.N??4,D:precision.D??input.D??1},m);
  else if(kind==='arithmetic.localFactors')data=await localFactorBundle(input,precision,m);
  else data=await verifyJob(input,m);
  m.tick(0);const object=data.object??{kind:kind==='arithmetic.primes'?'PRIME_QUERY':kind==='arithmetic.localFactors'?'PRIME_INDEXED_LOCAL_FACTOR_FAMILY':kind==='arithmetic.padic'?'PADIC_ARITHMETIC':'EXACT_FINITE_CERTIFICATE',p:input.p===undefined?null:String(input.p)},checks=data.checks??(data.verification?[{name:'independent certificate verifier',...data.verification}]:typeof data.pass==='boolean'?[{name:'requested verifier',pass:data.pass}]:[]),scope=data.scope??{finite:true,description:'Only the requested bounded input and explicitly supported operations are computed.',infiniteDomain:kind==='arithmetic.primes'?PRIME_DOMAIN:null};
  const payload={schema:'MathScope.M1.ArithmeticResult/1',version:VERSION,kind,status:'COMPLETED',object,request:JSON.parse(canonical(request)),scope,results:data,checks,precisionLedger:data.precision??data.frobenius?.precision??{requested:precision,roundingError:'0 for exact integer/modular operations; each numerical approximation is separately tagged.'},evidence:{calculation:kind==='arithmetic.primes'?'EXACT_CORE_WITH_SEPARATELY_TAGGED_APPROXIMATION':'EXACT_FINITE_OR_EXACT_MODULAR',geometricComparison:data.comparison?'THEOREM_REFERENCE':null,lean:'See separately hashed static Lean audit; this browser job is not a kernel execution.',formalComplete:false},provenance:{sources:SOURCES,localDesign:LOCAL_DESIGN_SOURCES,algorithmVersion:VERSION,assumptions:data.comparison?.base?.assumptions??[],operations:m.operations},visualization:kind==='arithmetic.primes'&&input.operation==='nextPrime'?{points:[],lines:[],axes:[],description:'증명서가 있는 다음 소수',coordinateMeaning:'정확한 정수 결과',lostInformation:[]}:visualization(kind,data,input)};
  payload.resultHash=await hash(payload);return payload;
}
function getExamples(){return[
  {id:'prime-1000',label:'소수 구간 [2,1000] · π, ψ, Li₂',request:{kind:'arithmetic.primes',input:{a:'2',b:'1000'},precision:{},budget:{maxOperations:50000000}}},
  {id:'prime-million',label:'백만까지 정확한 소수 78,498개',request:{kind:'arithmetic.primes',input:{a:'2',b:'1000000',includePsi:false,segmentSize:65536},precision:{},budget:{maxIntegers:1048576,maxOperations:50000000,maxMillis:60000}}},
  {id:'prime-large-certificate',label:'Number 안전 범위를 넘는 Lucas 인증',request:{kind:'arithmetic.primeCertificate',input:{n:'18446744069414584321'},precision:{},budget:{maxOperations:50000000}}},
  {id:'point-p3',label:'점의 실제 crystalline/prismatic 비교 모델',request:{kind:'arithmetic.point',input:{p:'3'},precision:{N:4},budget:{}}},
  {id:'p1-p3',label:'P¹ · 두 chart · 전체 contraction · Frobenius',request:{kind:'arithmetic.p1',input:{p:'3'},precision:{N:4,D:1},budget:{}}},
  {id:'p1-p5-d2',label:'P¹ · p=5, D=2 → 10',request:{kind:'arithmetic.p1',input:{p:'5',filtrationKind:'hodge',filtrationIndex:1},precision:{N:8,D:2},budget:{}}},
  {id:'delta-guard',label:'δ의 한 자리 손실과 정확 원본 증액',request:{kind:'arithmetic.padic',input:{p:'3',operation:'delta',residue:'17',inputDigits:4,exactInteger:'17'},precision:{N:4},budget:{}}},
  {id:'padic-torsion',label:'Z/27 위 ×3: kernel/cokernel = Z/3',request:{kind:'arithmetic.padic',input:{p:'3',operation:'module',matrix:matrix(1,1,[[0,0,'3']])},precision:{N:3},budget:{}}},
  {id:'derived-reduction',label:'derived mod p: 사라지지 않는 Tor',request:{kind:'arithmetic.padic',input:{p:'3',operation:'derivedReduction'},precision:{N:3},budget:{}}},
  {id:'p1-local-factors',label:'p별 P¹ Frobenius·점계수·Euler 인자',request:{kind:'arithmetic.localFactors',input:{model:'P1',primes:['2','3','5','7']},precision:{levels:[1,2,4,8]},budget:{}}},
  {id:'elliptic-good-bad',label:'E:y²=x³−x · good/bad 국소 인자',request:{kind:'arithmetic.localFactors',input:{model:'elliptic',a:'-1',b:'0',primes:['2','3','5','7','13']},precision:{levels:[1,2,4]},budget:{}}}
];}

return {VERSION,getCapabilities,validateRequest,runJob,getExamples,PRIME_DOMAIN,SOURCES,ArithmeticError};
})();
const __m1_7 = (()=>{
/** Small dense complex matrices. No DOM, network, ambient randomness or eval. */
const matrix=(n)=>({n,re:new Float64Array(n*n),im:new Float64Array(n*n)});
function identity(n){const a=matrix(n);for(let i=0;i<n;i++)a.re[i*n+i]=1;return a;}
const clone=a=>({n:a.n,re:a.re.slice(),im:a.im.slice()});
function rationalNumber(s){if(typeof s==='number')return s;const [a,b]=s.split('/').map(Number);return b===undefined?a:a/b;}
function fromSparse(s){const a=matrix(s.n);for(const [i,j,re,im] of s.entries){a.re[i*s.n+j]=rationalNumber(re);a.im[i*s.n+j]=rationalNumber(im);}return a;}
function add(a,b){const c=clone(a);return addTo(c,b);}
function addTo(a,b,s=1){if(a.n!==b.n)throw new Error('MATRIX_DIMENSION_MISMATCH');for(let k=0;k<a.re.length;k++){a.re[k]+=s*b.re[k];a.im[k]+=s*b.im[k];}return a;}
function scale(a,s,t=0){const b=matrix(a.n);for(let k=0;k<a.re.length;k++){b.re[k]=a.re[k]*s-a.im[k]*t;b.im[k]=a.re[k]*t+a.im[k]*s;}return b;}
function multiply(a,b){if(a.n!==b.n)throw new Error('MATRIX_DIMENSION_MISMATCH');const n=a.n,c=matrix(n);for(let i=0;i<n;i++)for(let k=0;k<n;k++){const x=i*n+k,ar=a.re[x],ai=a.im[x];if(ar===0&&ai===0)continue;for(let j=0;j<n;j++){const y=k*n+j,z=i*n+j,br=b.re[y],bi=b.im[y];c.re[z]+=ar*br-ai*bi;c.im[z]+=ar*bi+ai*br;}}return c;}
const commutator=(a,b)=>addTo(multiply(a,b),multiply(b,a),-1);
function dagger(a){const b=matrix(a.n);for(let i=0;i<a.n;i++)for(let j=0;j<a.n;j++){b.re[i*a.n+j]=a.re[j*a.n+i];b.im[i*a.n+j]=-a.im[j*a.n+i];}return b;}
function transpose(a){const b=matrix(a.n);for(let i=0;i<a.n;i++)for(let j=0;j<a.n;j++){b.re[i*a.n+j]=a.re[j*a.n+i];b.im[i*a.n+j]=a.im[j*a.n+i];}return b;}
function trace(a){let re=0,im=0;for(let i=0;i<a.n;i++){re+=a.re[i*a.n+i];im+=a.im[i*a.n+i];}return {re,im};}
function traceProduct(a,b){let re=0,im=0;for(let i=0;i<a.n;i++)for(let j=0;j<a.n;j++){const x=i*a.n+j,y=j*a.n+i;re+=a.re[x]*b.re[y]-a.im[x]*b.im[y];im+=a.re[x]*b.im[y]+a.im[x]*b.re[y];}return {re,im};}
function frobenius(a){let s=0;for(let k=0;k<a.re.length;k++)s+=a.re[k]**2+a.im[k]**2;return Math.sqrt(s);}
const distance=(a,b)=>frobenius(addTo(clone(a),b,-1));
const relativeDistance=(a,b)=>distance(a,b)/Math.max(1,frobenius(a),frobenius(b));
function norm1(a){let max=0;for(let j=0;j<a.n;j++){let s=0;for(let i=0;i<a.n;i++)s+=Math.hypot(a.re[i*a.n+j],a.im[i*a.n+j]);max=Math.max(max,s);}return max;}
function linearCombination(basis,coeff){const a=matrix(basis[0].n);for(let i=0;i<basis.length;i++)if(coeff[i])addTo(a,basis[i],coeff[i]);return a;}
function exponential(a){const mag=norm1(a);if(!Number.isFinite(mag)||mag>1e5)throw new Error('EXPONENT_NORM_OUT_OF_BOUNDS');const k=Math.max(0,Math.ceil(Math.log2(Math.max(1,mag))));const b=scale(a,2**(-k));let term=identity(a.n),sum=identity(a.n);for(let i=1;i<=28;i++){term=scale(multiply(term,b),1/i);addTo(sum,term);if(frobenius(term)<2e-17)break;}for(let j=0;j<k;j++)sum=multiply(sum,sum);return sum;}
const conjugate=(u,a)=>multiply(multiply(u,a),dagger(u));
function determinant(a){const b=clone(a),n=a.n;let dr=1,di=0;for(let k=0;k<n;k++){let p=k;for(let i=k+1;i<n;i++)if(Math.hypot(b.re[i*n+k],b.im[i*n+k])>Math.hypot(b.re[p*n+k],b.im[p*n+k]))p=i;if(Math.hypot(b.re[p*n+k],b.im[p*n+k])<1e-30)return {re:0,im:0};if(p!==k){for(let j=k;j<n;j++){const x=k*n+j,y=p*n+j;[b.re[x],b.re[y]]=[b.re[y],b.re[x]];[b.im[x],b.im[y]]=[b.im[y],b.im[x]];}dr=-dr;di=-di;}const pr=b.re[k*n+k],pi=b.im[k*n+k],[nr,ni]=[dr*pr-di*pi,dr*pi+di*pr];dr=nr;di=ni;for(let i=k+1;i<n;i++){const x=i*n+k,den=pr*pr+pi*pi,fr=(b.re[x]*pr+b.im[x]*pi)/den,fi=(b.im[x]*pr-b.re[x]*pi)/den;for(let j=k+1;j<n;j++){const y=i*n+j,z=k*n+j;b.re[y]-=fr*b.re[z]-fi*b.im[z];b.im[y]-=fr*b.im[z]+fi*b.re[z];}}}return {re:dr,im:di};}
function unitaryResidual(u){return distance(multiply(dagger(u),u),identity(u.n));}
function jsonMatrix(a){return {n:a.n,re:Array.from(a.re),im:Array.from(a.im)};}
function inverseReal(a){const n=a.length,b=a.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>+(i===j))]);for(let j=0;j<n;j++){let p=j;for(let i=j+1;i<n;i++)if(Math.abs(b[i][j])>Math.abs(b[p][j]))p=i;if(Math.abs(b[p][j])<1e-15)throw new Error('SINGULAR_GRAM');[b[p],b[j]]=[b[j],b[p]];const v=b[j][j];for(let k=0;k<2*n;k++)b[j][k]/=v;for(let i=0;i<n;i++)if(i!==j){const v=b[i][j];for(let k=0;k<2*n;k++)b[i][k]-=v*b[j][k];}}return b.map(r=>r.slice(n));}

return {matrix,identity,clone,rationalNumber,fromSparse,add,addTo,scale,multiply,commutator,dagger,transpose,trace,traceProduct,frobenius,distance,relativeDistance,norm1,linearCombination,exponential,conjugate,determinant,unitaryResidual,jsonMatrix,inverseReal};
})();
const __m1_8 = (()=>{
// Generated by generate_groups.py; exact rational entries, not a classification proof.
const GROUP_DATA = [{"id":"SU2","family":"SU","parameter":2,"name":"SU(2)","rank":1,"dimension":3,"matrixDimension":2,"globalForm":{"form":"SIMPLY_CONNECTED","cover":"SU(2)","kernel":["1"],"description":"Actual defining SU(2); center mu_2. No quotient identification."},"center":{"order":2,"generators":["exp(2 pi i/2) I"],"representationDescendsToAdjoint":false},"representation":{"kind":"MATRIX","name":"compact defining complex matrices","dimension":2,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1) Re Tr(XY)"},"rootDatum":{"type":"A","rank":1,"cartan":[[2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"fundamental weights omega_i","cocharacterBasis":"simple coroots alpha_i^vee","pairing":[[1]],"simpleRootCharacters":[[2]],"simpleCorootCocharacters":[[1]],"roots":[{"simple":[-1],"corootSimple":[-1],"character":[-2],"cocharacter":[-1],"lengthSquared":"2"},{"simple":[1],"corootSimple":[1],"character":[2],"cocharacter":[1],"lengthSquared":"2"}]},"basis":{"names":["A01","B01","H0"],"matrices":[{"n":2,"entries":[[0,1,"1","0"],[1,0,"-1","0"]]},{"n":2,"entries":[[0,1,"0","1"],[1,0,"0","1"]]},{"n":2,"entries":[[0,0,"0","1"],[1,1,"0","-1"]]}],"compactRealForm":true},"structureConstants":[[0,1,2,"2"],[0,2,1,"-2"],[1,2,0,"2"]],"gram":[["2","0","0"],["0","2","0"],["0","0","2"]],"chevalley":{"names":["h1","e(1,)","f(1,)"],"matrices":[{"n":2,"entries":[[0,0,"1","0"],[1,1,"-1","0"]]},{"n":2,"entries":[[0,1,"1","0"]]},{"n":2,"entries":[[1,0,"1","0"]]}],"structureConstants":[[0,1,1,2],[0,2,2,-2],[1,2,0,1]],"compactToChevalley":[[["0","0"],["0","0"],["0","1"]],[["1","0"],["0","1"],["0","0"]],[["-1","0"],["0","1"],["0","0"]]],"simpleGeneratorCount":1,"fullBasisCount":3,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":2,"entries":[[0,1,"0","-1/2"],[1,0,"0","-1/2"]]},{"n":2,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"]]},{"n":2,"entries":[[0,0,"0","-1/2"],[1,1,"0","1/2"]]}],"compactCoordinates":[["0","-1/2","0"],["-1/2","0","0"],["0","0","-1/2"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":3,"gramPositiveLDL":["2","2","2"],"bracketPairs":3,"jacobiDistinctTriples":1,"jacobiFullOrderedTriples":27,"adInvariantMetricOrderedTriples":27,"chevalleyIntegralBracketPairs":3,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED"},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":2,"entries":[[0,1,"0","-1/2"],[1,0,"0","-1/2"]]},{"n":2,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"]]},{"n":2,"entries":[[0,0,"0","-1/2"],[1,1,"0","1/2"]]}],"compactCoordinates":[["0","-1/2","0"],["-1/2","0","0"],["0","0","-1/2"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"}],"dataSha256":"d85db95e7235eac71846b0e2b435f582971c13849cb8e3ba6fef78abc87eab70"},{"id":"SU3","family":"SU","parameter":3,"name":"SU(3)","rank":2,"dimension":8,"matrixDimension":3,"globalForm":{"form":"SIMPLY_CONNECTED","cover":"SU(3)","kernel":["1"],"description":"Actual defining SU(3); center mu_3. No quotient identification."},"center":{"order":3,"generators":["exp(2 pi i/3) I"],"representationDescendsToAdjoint":false},"representation":{"kind":"MATRIX","name":"compact defining complex matrices","dimension":3,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1) Re Tr(XY)"},"rootDatum":{"type":"A","rank":2,"cartan":[[2,-1],[-1,2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"fundamental weights omega_i","cocharacterBasis":"simple coroots alpha_i^vee","pairing":[[1,0],[0,1]],"simpleRootCharacters":[[2,-1],[-1,2]],"simpleCorootCocharacters":[[1,0],[0,1]],"roots":[{"simple":[-1,-1],"corootSimple":[-1,-1],"character":[-1,-1],"cocharacter":[-1,-1],"lengthSquared":"2"},{"simple":[-1,0],"corootSimple":[-1,0],"character":[-2,1],"cocharacter":[-1,0],"lengthSquared":"2"},{"simple":[0,-1],"corootSimple":[0,-1],"character":[1,-2],"cocharacter":[0,-1],"lengthSquared":"2"},{"simple":[0,1],"corootSimple":[0,1],"character":[-1,2],"cocharacter":[0,1],"lengthSquared":"2"},{"simple":[1,0],"corootSimple":[1,0],"character":[2,-1],"cocharacter":[1,0],"lengthSquared":"2"},{"simple":[1,1],"corootSimple":[1,1],"character":[1,1],"cocharacter":[1,1],"lengthSquared":"2"}]},"basis":{"names":["A01","B01","A02","B02","A12","B12","H0","H1"],"matrices":[{"n":3,"entries":[[0,1,"1","0"],[1,0,"-1","0"]]},{"n":3,"entries":[[0,1,"0","1"],[1,0,"0","1"]]},{"n":3,"entries":[[0,2,"1","0"],[2,0,"-1","0"]]},{"n":3,"entries":[[0,2,"0","1"],[2,0,"0","1"]]},{"n":3,"entries":[[1,2,"1","0"],[2,1,"-1","0"]]},{"n":3,"entries":[[1,2,"0","1"],[2,1,"0","1"]]},{"n":3,"entries":[[0,0,"0","1"],[1,1,"0","-1"]]},{"n":3,"entries":[[1,1,"0","1"],[2,2,"0","-1"]]}],"compactRealForm":true},"structureConstants":[[0,1,6,"2"],[0,2,4,"-1"],[0,3,5,"-1"],[0,4,2,"1"],[0,5,3,"1"],[0,6,1,"-2"],[0,7,1,"1"],[1,2,5,"1"],[1,3,4,"-1"],[1,4,3,"1"],[1,5,2,"-1"],[1,6,0,"2"],[1,7,0,"-1"],[2,3,6,"2"],[2,3,7,"2"],[2,4,0,"-1"],[2,5,1,"1"],[2,6,3,"-1"],[2,7,3,"-1"],[3,4,1,"-1"],[3,5,0,"-1"],[3,6,2,"1"],[3,7,2,"1"],[4,5,7,"2"],[4,6,5,"1"],[4,7,5,"-2"],[5,6,4,"-1"],[5,7,4,"2"]],"gram":[["2","0","0","0","0","0","0","0"],["0","2","0","0","0","0","0","0"],["0","0","2","0","0","0","0","0"],["0","0","0","2","0","0","0","0"],["0","0","0","0","2","0","0","0"],["0","0","0","0","0","2","0","0"],["0","0","0","0","0","0","2","-1"],["0","0","0","0","0","0","-1","2"]],"chevalley":{"names":["h1","h2","e(0, 1)","e(1, 0)","e(1, 1)","f(0, 1)","f(1, 0)","f(1, 1)"],"matrices":[{"n":3,"entries":[[0,0,"1","0"],[1,1,"-1","0"]]},{"n":3,"entries":[[1,1,"1","0"],[2,2,"-1","0"]]},{"n":3,"entries":[[1,2,"1","0"]]},{"n":3,"entries":[[0,1,"1","0"]]},{"n":3,"entries":[[0,2,"1","0"]]},{"n":3,"entries":[[2,1,"1","0"]]},{"n":3,"entries":[[1,0,"1","0"]]},{"n":3,"entries":[[2,0,"1","0"]]}],"structureConstants":[[0,2,2,-1],[0,3,3,2],[0,4,4,1],[0,5,5,1],[0,6,6,-2],[0,7,7,-1],[1,2,2,2],[1,3,3,-1],[1,4,4,1],[1,5,5,-2],[1,6,6,1],[1,7,7,-1],[2,3,4,-1],[2,5,1,1],[2,7,6,1],[3,6,0,1],[3,7,5,-1],[4,5,3,1],[4,6,2,-1],[4,7,0,1],[4,7,1,1],[5,6,7,1]],"compactToChevalley":[[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"]],[["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"]],[["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"]],[["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"]]],"simpleGeneratorCount":2,"fullBasisCount":8,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":3,"entries":[[0,1,"0","-1/2"],[1,0,"0","-1/2"]]},{"n":3,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"]]},{"n":3,"entries":[[0,0,"0","-1/2"],[1,1,"0","1/2"]]}],"compactCoordinates":[["0","-1/2","0","0","0","0","0","0"],["-1/2","0","0","0","0","0","0","0"],["0","0","0","0","0","0","-1/2","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":8,"gramPositiveLDL":["2","2","2","2","2","2","2","3/2"],"bracketPairs":28,"jacobiDistinctTriples":56,"jacobiFullOrderedTriples":512,"adInvariantMetricOrderedTriples":512,"chevalleyIntegralBracketPairs":28,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED"},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":3,"entries":[[0,1,"0","-1/2"],[1,0,"0","-1/2"]]},{"n":3,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"]]},{"n":3,"entries":[[0,0,"0","-1/2"],[1,1,"0","1/2"]]}],"compactCoordinates":[["0","-1/2","0","0","0","0","0","0"],["-1/2","0","0","0","0","0","0","0"],["0","0","0","0","0","0","-1/2","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"}],"dataSha256":"269be4af190d9f882a0dcc22f228cd56be2fde06fd3aee7ec2290ad26cfd7e85"},{"id":"SU4","family":"SU","parameter":4,"name":"SU(4)","rank":3,"dimension":15,"matrixDimension":4,"globalForm":{"form":"SIMPLY_CONNECTED","cover":"SU(4)","kernel":["1"],"description":"Actual defining SU(4); center mu_4. No quotient identification."},"center":{"order":4,"generators":["exp(2 pi i/4) I"],"representationDescendsToAdjoint":false},"representation":{"kind":"MATRIX","name":"compact defining complex matrices","dimension":4,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1) Re Tr(XY)"},"rootDatum":{"type":"A","rank":3,"cartan":[[2,-1,0],[-1,2,-1],[0,-1,2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"fundamental weights omega_i","cocharacterBasis":"simple coroots alpha_i^vee","pairing":[[1,0,0],[0,1,0],[0,0,1]],"simpleRootCharacters":[[2,-1,0],[-1,2,-1],[0,-1,2]],"simpleCorootCocharacters":[[1,0,0],[0,1,0],[0,0,1]],"roots":[{"simple":[-1,-1,-1],"corootSimple":[-1,-1,-1],"character":[-1,0,-1],"cocharacter":[-1,-1,-1],"lengthSquared":"2"},{"simple":[-1,-1,0],"corootSimple":[-1,-1,0],"character":[-1,-1,1],"cocharacter":[-1,-1,0],"lengthSquared":"2"},{"simple":[-1,0,0],"corootSimple":[-1,0,0],"character":[-2,1,0],"cocharacter":[-1,0,0],"lengthSquared":"2"},{"simple":[0,-1,-1],"corootSimple":[0,-1,-1],"character":[1,-1,-1],"cocharacter":[0,-1,-1],"lengthSquared":"2"},{"simple":[0,-1,0],"corootSimple":[0,-1,0],"character":[1,-2,1],"cocharacter":[0,-1,0],"lengthSquared":"2"},{"simple":[0,0,-1],"corootSimple":[0,0,-1],"character":[0,1,-2],"cocharacter":[0,0,-1],"lengthSquared":"2"},{"simple":[0,0,1],"corootSimple":[0,0,1],"character":[0,-1,2],"cocharacter":[0,0,1],"lengthSquared":"2"},{"simple":[0,1,0],"corootSimple":[0,1,0],"character":[-1,2,-1],"cocharacter":[0,1,0],"lengthSquared":"2"},{"simple":[0,1,1],"corootSimple":[0,1,1],"character":[-1,1,1],"cocharacter":[0,1,1],"lengthSquared":"2"},{"simple":[1,0,0],"corootSimple":[1,0,0],"character":[2,-1,0],"cocharacter":[1,0,0],"lengthSquared":"2"},{"simple":[1,1,0],"corootSimple":[1,1,0],"character":[1,1,-1],"cocharacter":[1,1,0],"lengthSquared":"2"},{"simple":[1,1,1],"corootSimple":[1,1,1],"character":[1,0,1],"cocharacter":[1,1,1],"lengthSquared":"2"}]},"basis":{"names":["A01","B01","A02","B02","A03","B03","A12","B12","A13","B13","A23","B23","H0","H1","H2"],"matrices":[{"n":4,"entries":[[0,1,"1","0"],[1,0,"-1","0"]]},{"n":4,"entries":[[0,1,"0","1"],[1,0,"0","1"]]},{"n":4,"entries":[[0,2,"1","0"],[2,0,"-1","0"]]},{"n":4,"entries":[[0,2,"0","1"],[2,0,"0","1"]]},{"n":4,"entries":[[0,3,"1","0"],[3,0,"-1","0"]]},{"n":4,"entries":[[0,3,"0","1"],[3,0,"0","1"]]},{"n":4,"entries":[[1,2,"1","0"],[2,1,"-1","0"]]},{"n":4,"entries":[[1,2,"0","1"],[2,1,"0","1"]]},{"n":4,"entries":[[1,3,"1","0"],[3,1,"-1","0"]]},{"n":4,"entries":[[1,3,"0","1"],[3,1,"0","1"]]},{"n":4,"entries":[[2,3,"1","0"],[3,2,"-1","0"]]},{"n":4,"entries":[[2,3,"0","1"],[3,2,"0","1"]]},{"n":4,"entries":[[0,0,"0","1"],[1,1,"0","-1"]]},{"n":4,"entries":[[1,1,"0","1"],[2,2,"0","-1"]]},{"n":4,"entries":[[2,2,"0","1"],[3,3,"0","-1"]]}],"compactRealForm":true},"structureConstants":[[0,1,12,"2"],[0,2,6,"-1"],[0,3,7,"-1"],[0,4,8,"-1"],[0,5,9,"-1"],[0,6,2,"1"],[0,7,3,"1"],[0,8,4,"1"],[0,9,5,"1"],[0,12,1,"-2"],[0,13,1,"1"],[1,2,7,"1"],[1,3,6,"-1"],[1,4,9,"1"],[1,5,8,"-1"],[1,6,3,"1"],[1,7,2,"-1"],[1,8,5,"1"],[1,9,4,"-1"],[1,12,0,"2"],[1,13,0,"-1"],[2,3,12,"2"],[2,3,13,"2"],[2,4,10,"-1"],[2,5,11,"-1"],[2,6,0,"-1"],[2,7,1,"1"],[2,10,4,"1"],[2,11,5,"1"],[2,12,3,"-1"],[2,13,3,"-1"],[2,14,3,"1"],[3,4,11,"1"],[3,5,10,"-1"],[3,6,1,"-1"],[3,7,0,"-1"],[3,10,5,"1"],[3,11,4,"-1"],[3,12,2,"1"],[3,13,2,"1"],[3,14,2,"-1"],[4,5,12,"2"],[4,5,13,"2"],[4,5,14,"2"],[4,8,0,"-1"],[4,9,1,"1"],[4,10,2,"-1"],[4,11,3,"1"],[4,12,5,"-1"],[4,14,5,"-1"],[5,8,1,"-1"],[5,9,0,"-1"],[5,10,3,"-1"],[5,11,2,"-1"],[5,12,4,"1"],[5,14,4,"1"],[6,7,13,"2"],[6,8,10,"-1"],[6,9,11,"-1"],[6,10,8,"1"],[6,11,9,"1"],[6,12,7,"1"],[6,13,7,"-2"],[6,14,7,"1"],[7,8,11,"1"],[7,9,10,"-1"],[7,10,9,"1"],[7,11,8,"-1"],[7,12,6,"-1"],[7,13,6,"2"],[7,14,6,"-1"],[8,9,13,"2"],[8,9,14,"2"],[8,10,6,"-1"],[8,11,7,"1"],[8,12,9,"1"],[8,13,9,"-1"],[8,14,9,"-1"],[9,10,7,"-1"],[9,11,6,"-1"],[9,12,8,"-1"],[9,13,8,"1"],[9,14,8,"1"],[10,11,14,"2"],[10,13,11,"1"],[10,14,11,"-2"],[11,13,10,"-1"],[11,14,10,"2"]],"gram":[["2","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","2","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","2","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","2","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","2","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","2","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","2","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","2","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","2","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","2","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","2","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","2","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","2","-1","0"],["0","0","0","0","0","0","0","0","0","0","0","0","-1","2","-1"],["0","0","0","0","0","0","0","0","0","0","0","0","0","-1","2"]],"chevalley":{"names":["h1","h2","h3","e(0, 0, 1)","e(0, 1, 0)","e(1, 0, 0)","e(0, 1, 1)","e(1, 1, 0)","e(1, 1, 1)","f(0, 0, 1)","f(0, 1, 0)","f(1, 0, 0)","f(0, 1, 1)","f(1, 1, 0)","f(1, 1, 1)"],"matrices":[{"n":4,"entries":[[0,0,"1","0"],[1,1,"-1","0"]]},{"n":4,"entries":[[1,1,"1","0"],[2,2,"-1","0"]]},{"n":4,"entries":[[2,2,"1","0"],[3,3,"-1","0"]]},{"n":4,"entries":[[2,3,"1","0"]]},{"n":4,"entries":[[1,2,"1","0"]]},{"n":4,"entries":[[0,1,"1","0"]]},{"n":4,"entries":[[1,3,"1","0"]]},{"n":4,"entries":[[0,2,"1","0"]]},{"n":4,"entries":[[0,3,"1","0"]]},{"n":4,"entries":[[3,2,"1","0"]]},{"n":4,"entries":[[2,1,"1","0"]]},{"n":4,"entries":[[1,0,"1","0"]]},{"n":4,"entries":[[3,1,"1","0"]]},{"n":4,"entries":[[2,0,"1","0"]]},{"n":4,"entries":[[3,0,"1","0"]]}],"structureConstants":[[0,4,4,-1],[0,5,5,2],[0,6,6,-1],[0,7,7,1],[0,8,8,1],[0,10,10,1],[0,11,11,-2],[0,12,12,1],[0,13,13,-1],[0,14,14,-1],[1,3,3,-1],[1,4,4,2],[1,5,5,-1],[1,6,6,1],[1,7,7,1],[1,9,9,1],[1,10,10,-2],[1,11,11,1],[1,12,12,-1],[1,13,13,-1],[2,3,3,2],[2,4,4,-1],[2,6,6,1],[2,7,7,-1],[2,8,8,1],[2,9,9,-2],[2,10,10,1],[2,12,12,-1],[2,13,13,1],[2,14,14,-1],[3,4,6,-1],[3,7,8,-1],[3,9,2,1],[3,12,10,1],[3,14,13,1],[4,5,7,-1],[4,10,1,1],[4,12,9,-1],[4,13,11,1],[5,6,8,1],[5,11,0,1],[5,13,10,-1],[5,14,12,-1],[6,9,4,1],[6,10,3,-1],[6,12,1,1],[6,12,2,1],[6,14,11,1],[7,10,5,1],[7,11,4,-1],[7,13,0,1],[7,13,1,1],[7,14,9,-1],[8,9,7,1],[8,11,6,-1],[8,12,5,1],[8,13,3,-1],[8,14,0,1],[8,14,1,1],[8,14,2,1],[9,10,12,1],[9,13,14,1],[10,11,13,1],[11,12,14,-1]],"compactToChevalley":[[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]]],"simpleGeneratorCount":3,"fullBasisCount":15,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":4,"entries":[[0,1,"0","-1/2"],[1,0,"0","-1/2"]]},{"n":4,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"]]},{"n":4,"entries":[[0,0,"0","-1/2"],[1,1,"0","1/2"]]}],"compactCoordinates":[["0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0"],["-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","-1/2","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":15,"gramPositiveLDL":["2","2","2","2","2","2","2","2","2","2","2","2","2","3/2","4/3"],"bracketPairs":105,"jacobiDistinctTriples":455,"jacobiFullOrderedTriples":3375,"adInvariantMetricOrderedTriples":3375,"chevalleyIntegralBracketPairs":105,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED"},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":4,"entries":[[0,1,"0","-1/2"],[1,0,"0","-1/2"]]},{"n":4,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"]]},{"n":4,"entries":[[0,0,"0","-1/2"],[1,1,"0","1/2"]]}],"compactCoordinates":[["0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0"],["-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","-1/2","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"}],"dataSha256":"f5cf917c1b4970b3773fb6612d5430bd9c4f4773c5d8cff95086420703d7a546"},{"id":"SU5","family":"SU","parameter":5,"name":"SU(5)","rank":4,"dimension":24,"matrixDimension":5,"globalForm":{"form":"SIMPLY_CONNECTED","cover":"SU(5)","kernel":["1"],"description":"Actual defining SU(5); center mu_5. No quotient identification."},"center":{"order":5,"generators":["exp(2 pi i/5) I"],"representationDescendsToAdjoint":false},"representation":{"kind":"MATRIX","name":"compact defining complex matrices","dimension":5,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1) Re Tr(XY)"},"rootDatum":{"type":"A","rank":4,"cartan":[[2,-1,0,0],[-1,2,-1,0],[0,-1,2,-1],[0,0,-1,2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"fundamental weights omega_i","cocharacterBasis":"simple coroots alpha_i^vee","pairing":[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],"simpleRootCharacters":[[2,-1,0,0],[-1,2,-1,0],[0,-1,2,-1],[0,0,-1,2]],"simpleCorootCocharacters":[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],"roots":[{"simple":[-1,-1,-1,-1],"corootSimple":[-1,-1,-1,-1],"character":[-1,0,0,-1],"cocharacter":[-1,-1,-1,-1],"lengthSquared":"2"},{"simple":[-1,-1,-1,0],"corootSimple":[-1,-1,-1,0],"character":[-1,0,-1,1],"cocharacter":[-1,-1,-1,0],"lengthSquared":"2"},{"simple":[-1,-1,0,0],"corootSimple":[-1,-1,0,0],"character":[-1,-1,1,0],"cocharacter":[-1,-1,0,0],"lengthSquared":"2"},{"simple":[-1,0,0,0],"corootSimple":[-1,0,0,0],"character":[-2,1,0,0],"cocharacter":[-1,0,0,0],"lengthSquared":"2"},{"simple":[0,-1,-1,-1],"corootSimple":[0,-1,-1,-1],"character":[1,-1,0,-1],"cocharacter":[0,-1,-1,-1],"lengthSquared":"2"},{"simple":[0,-1,-1,0],"corootSimple":[0,-1,-1,0],"character":[1,-1,-1,1],"cocharacter":[0,-1,-1,0],"lengthSquared":"2"},{"simple":[0,-1,0,0],"corootSimple":[0,-1,0,0],"character":[1,-2,1,0],"cocharacter":[0,-1,0,0],"lengthSquared":"2"},{"simple":[0,0,-1,-1],"corootSimple":[0,0,-1,-1],"character":[0,1,-1,-1],"cocharacter":[0,0,-1,-1],"lengthSquared":"2"},{"simple":[0,0,-1,0],"corootSimple":[0,0,-1,0],"character":[0,1,-2,1],"cocharacter":[0,0,-1,0],"lengthSquared":"2"},{"simple":[0,0,0,-1],"corootSimple":[0,0,0,-1],"character":[0,0,1,-2],"cocharacter":[0,0,0,-1],"lengthSquared":"2"},{"simple":[0,0,0,1],"corootSimple":[0,0,0,1],"character":[0,0,-1,2],"cocharacter":[0,0,0,1],"lengthSquared":"2"},{"simple":[0,0,1,0],"corootSimple":[0,0,1,0],"character":[0,-1,2,-1],"cocharacter":[0,0,1,0],"lengthSquared":"2"},{"simple":[0,0,1,1],"corootSimple":[0,0,1,1],"character":[0,-1,1,1],"cocharacter":[0,0,1,1],"lengthSquared":"2"},{"simple":[0,1,0,0],"corootSimple":[0,1,0,0],"character":[-1,2,-1,0],"cocharacter":[0,1,0,0],"lengthSquared":"2"},{"simple":[0,1,1,0],"corootSimple":[0,1,1,0],"character":[-1,1,1,-1],"cocharacter":[0,1,1,0],"lengthSquared":"2"},{"simple":[0,1,1,1],"corootSimple":[0,1,1,1],"character":[-1,1,0,1],"cocharacter":[0,1,1,1],"lengthSquared":"2"},{"simple":[1,0,0,0],"corootSimple":[1,0,0,0],"character":[2,-1,0,0],"cocharacter":[1,0,0,0],"lengthSquared":"2"},{"simple":[1,1,0,0],"corootSimple":[1,1,0,0],"character":[1,1,-1,0],"cocharacter":[1,1,0,0],"lengthSquared":"2"},{"simple":[1,1,1,0],"corootSimple":[1,1,1,0],"character":[1,0,1,-1],"cocharacter":[1,1,1,0],"lengthSquared":"2"},{"simple":[1,1,1,1],"corootSimple":[1,1,1,1],"character":[1,0,0,1],"cocharacter":[1,1,1,1],"lengthSquared":"2"}]},"basis":{"names":["A01","B01","A02","B02","A03","B03","A04","B04","A12","B12","A13","B13","A14","B14","A23","B23","A24","B24","A34","B34","H0","H1","H2","H3"],"matrices":[{"n":5,"entries":[[0,1,"1","0"],[1,0,"-1","0"]]},{"n":5,"entries":[[0,1,"0","1"],[1,0,"0","1"]]},{"n":5,"entries":[[0,2,"1","0"],[2,0,"-1","0"]]},{"n":5,"entries":[[0,2,"0","1"],[2,0,"0","1"]]},{"n":5,"entries":[[0,3,"1","0"],[3,0,"-1","0"]]},{"n":5,"entries":[[0,3,"0","1"],[3,0,"0","1"]]},{"n":5,"entries":[[0,4,"1","0"],[4,0,"-1","0"]]},{"n":5,"entries":[[0,4,"0","1"],[4,0,"0","1"]]},{"n":5,"entries":[[1,2,"1","0"],[2,1,"-1","0"]]},{"n":5,"entries":[[1,2,"0","1"],[2,1,"0","1"]]},{"n":5,"entries":[[1,3,"1","0"],[3,1,"-1","0"]]},{"n":5,"entries":[[1,3,"0","1"],[3,1,"0","1"]]},{"n":5,"entries":[[1,4,"1","0"],[4,1,"-1","0"]]},{"n":5,"entries":[[1,4,"0","1"],[4,1,"0","1"]]},{"n":5,"entries":[[2,3,"1","0"],[3,2,"-1","0"]]},{"n":5,"entries":[[2,3,"0","1"],[3,2,"0","1"]]},{"n":5,"entries":[[2,4,"1","0"],[4,2,"-1","0"]]},{"n":5,"entries":[[2,4,"0","1"],[4,2,"0","1"]]},{"n":5,"entries":[[3,4,"1","0"],[4,3,"-1","0"]]},{"n":5,"entries":[[3,4,"0","1"],[4,3,"0","1"]]},{"n":5,"entries":[[0,0,"0","1"],[1,1,"0","-1"]]},{"n":5,"entries":[[1,1,"0","1"],[2,2,"0","-1"]]},{"n":5,"entries":[[2,2,"0","1"],[3,3,"0","-1"]]},{"n":5,"entries":[[3,3,"0","1"],[4,4,"0","-1"]]}],"compactRealForm":true},"structureConstants":[[0,1,20,"2"],[0,2,8,"-1"],[0,3,9,"-1"],[0,4,10,"-1"],[0,5,11,"-1"],[0,6,12,"-1"],[0,7,13,"-1"],[0,8,2,"1"],[0,9,3,"1"],[0,10,4,"1"],[0,11,5,"1"],[0,12,6,"1"],[0,13,7,"1"],[0,20,1,"-2"],[0,21,1,"1"],[1,2,9,"1"],[1,3,8,"-1"],[1,4,11,"1"],[1,5,10,"-1"],[1,6,13,"1"],[1,7,12,"-1"],[1,8,3,"1"],[1,9,2,"-1"],[1,10,5,"1"],[1,11,4,"-1"],[1,12,7,"1"],[1,13,6,"-1"],[1,20,0,"2"],[1,21,0,"-1"],[2,3,20,"2"],[2,3,21,"2"],[2,4,14,"-1"],[2,5,15,"-1"],[2,6,16,"-1"],[2,7,17,"-1"],[2,8,0,"-1"],[2,9,1,"1"],[2,14,4,"1"],[2,15,5,"1"],[2,16,6,"1"],[2,17,7,"1"],[2,20,3,"-1"],[2,21,3,"-1"],[2,22,3,"1"],[3,4,15,"1"],[3,5,14,"-1"],[3,6,17,"1"],[3,7,16,"-1"],[3,8,1,"-1"],[3,9,0,"-1"],[3,14,5,"1"],[3,15,4,"-1"],[3,16,7,"1"],[3,17,6,"-1"],[3,20,2,"1"],[3,21,2,"1"],[3,22,2,"-1"],[4,5,20,"2"],[4,5,21,"2"],[4,5,22,"2"],[4,6,18,"-1"],[4,7,19,"-1"],[4,10,0,"-1"],[4,11,1,"1"],[4,14,2,"-1"],[4,15,3,"1"],[4,18,6,"1"],[4,19,7,"1"],[4,20,5,"-1"],[4,22,5,"-1"],[4,23,5,"1"],[5,6,19,"1"],[5,7,18,"-1"],[5,10,1,"-1"],[5,11,0,"-1"],[5,14,3,"-1"],[5,15,2,"-1"],[5,18,7,"1"],[5,19,6,"-1"],[5,20,4,"1"],[5,22,4,"1"],[5,23,4,"-1"],[6,7,20,"2"],[6,7,21,"2"],[6,7,22,"2"],[6,7,23,"2"],[6,12,0,"-1"],[6,13,1,"1"],[6,16,2,"-1"],[6,17,3,"1"],[6,18,4,"-1"],[6,19,5,"1"],[6,20,7,"-1"],[6,23,7,"-1"],[7,12,1,"-1"],[7,13,0,"-1"],[7,16,3,"-1"],[7,17,2,"-1"],[7,18,5,"-1"],[7,19,4,"-1"],[7,20,6,"1"],[7,23,6,"1"],[8,9,21,"2"],[8,10,14,"-1"],[8,11,15,"-1"],[8,12,16,"-1"],[8,13,17,"-1"],[8,14,10,"1"],[8,15,11,"1"],[8,16,12,"1"],[8,17,13,"1"],[8,20,9,"1"],[8,21,9,"-2"],[8,22,9,"1"],[9,10,15,"1"],[9,11,14,"-1"],[9,12,17,"1"],[9,13,16,"-1"],[9,14,11,"1"],[9,15,10,"-1"],[9,16,13,"1"],[9,17,12,"-1"],[9,20,8,"-1"],[9,21,8,"2"],[9,22,8,"-1"],[10,11,21,"2"],[10,11,22,"2"],[10,12,18,"-1"],[10,13,19,"-1"],[10,14,8,"-1"],[10,15,9,"1"],[10,18,12,"1"],[10,19,13,"1"],[10,20,11,"1"],[10,21,11,"-1"],[10,22,11,"-1"],[10,23,11,"1"],[11,12,19,"1"],[11,13,18,"-1"],[11,14,9,"-1"],[11,15,8,"-1"],[11,18,13,"1"],[11,19,12,"-1"],[11,20,10,"-1"],[11,21,10,"1"],[11,22,10,"1"],[11,23,10,"-1"],[12,13,21,"2"],[12,13,22,"2"],[12,13,23,"2"],[12,16,8,"-1"],[12,17,9,"1"],[12,18,10,"-1"],[12,19,11,"1"],[12,20,13,"1"],[12,21,13,"-1"],[12,23,13,"-1"],[13,16,9,"-1"],[13,17,8,"-1"],[13,18,11,"-1"],[13,19,10,"-1"],[13,20,12,"-1"],[13,21,12,"1"],[13,23,12,"1"],[14,15,22,"2"],[14,16,18,"-1"],[14,17,19,"-1"],[14,18,16,"1"],[14,19,17,"1"],[14,21,15,"1"],[14,22,15,"-2"],[14,23,15,"1"],[15,16,19,"1"],[15,17,18,"-1"],[15,18,17,"1"],[15,19,16,"-1"],[15,21,14,"-1"],[15,22,14,"2"],[15,23,14,"-1"],[16,17,22,"2"],[16,17,23,"2"],[16,18,14,"-1"],[16,19,15,"1"],[16,21,17,"1"],[16,22,17,"-1"],[16,23,17,"-1"],[17,18,15,"-1"],[17,19,14,"-1"],[17,21,16,"-1"],[17,22,16,"1"],[17,23,16,"1"],[18,19,23,"2"],[18,22,19,"1"],[18,23,19,"-2"],[19,22,18,"-1"],[19,23,18,"2"]],"gram":[["2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","-1","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","-1","2","-1","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","-1","2","-1"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","-1","2"]],"chevalley":{"names":["h1","h2","h3","h4","e(0, 0, 0, 1)","e(0, 0, 1, 0)","e(0, 1, 0, 0)","e(1, 0, 0, 0)","e(0, 0, 1, 1)","e(0, 1, 1, 0)","e(1, 1, 0, 0)","e(0, 1, 1, 1)","e(1, 1, 1, 0)","e(1, 1, 1, 1)","f(0, 0, 0, 1)","f(0, 0, 1, 0)","f(0, 1, 0, 0)","f(1, 0, 0, 0)","f(0, 0, 1, 1)","f(0, 1, 1, 0)","f(1, 1, 0, 0)","f(0, 1, 1, 1)","f(1, 1, 1, 0)","f(1, 1, 1, 1)"],"matrices":[{"n":5,"entries":[[0,0,"1","0"],[1,1,"-1","0"]]},{"n":5,"entries":[[1,1,"1","0"],[2,2,"-1","0"]]},{"n":5,"entries":[[2,2,"1","0"],[3,3,"-1","0"]]},{"n":5,"entries":[[3,3,"1","0"],[4,4,"-1","0"]]},{"n":5,"entries":[[3,4,"1","0"]]},{"n":5,"entries":[[2,3,"1","0"]]},{"n":5,"entries":[[1,2,"1","0"]]},{"n":5,"entries":[[0,1,"1","0"]]},{"n":5,"entries":[[2,4,"1","0"]]},{"n":5,"entries":[[1,3,"1","0"]]},{"n":5,"entries":[[0,2,"1","0"]]},{"n":5,"entries":[[1,4,"1","0"]]},{"n":5,"entries":[[0,3,"1","0"]]},{"n":5,"entries":[[0,4,"1","0"]]},{"n":5,"entries":[[4,3,"1","0"]]},{"n":5,"entries":[[3,2,"1","0"]]},{"n":5,"entries":[[2,1,"1","0"]]},{"n":5,"entries":[[1,0,"1","0"]]},{"n":5,"entries":[[4,2,"1","0"]]},{"n":5,"entries":[[3,1,"1","0"]]},{"n":5,"entries":[[2,0,"1","0"]]},{"n":5,"entries":[[4,1,"1","0"]]},{"n":5,"entries":[[3,0,"1","0"]]},{"n":5,"entries":[[4,0,"1","0"]]}],"structureConstants":[[0,6,6,-1],[0,7,7,2],[0,9,9,-1],[0,10,10,1],[0,11,11,-1],[0,12,12,1],[0,13,13,1],[0,16,16,1],[0,17,17,-2],[0,19,19,1],[0,20,20,-1],[0,21,21,1],[0,22,22,-1],[0,23,23,-1],[1,5,5,-1],[1,6,6,2],[1,7,7,-1],[1,8,8,-1],[1,9,9,1],[1,10,10,1],[1,11,11,1],[1,15,15,1],[1,16,16,-2],[1,17,17,1],[1,18,18,1],[1,19,19,-1],[1,20,20,-1],[1,21,21,-1],[2,4,4,-1],[2,5,5,2],[2,6,6,-1],[2,8,8,1],[2,9,9,1],[2,10,10,-1],[2,12,12,1],[2,14,14,1],[2,15,15,-2],[2,16,16,1],[2,18,18,-1],[2,19,19,-1],[2,20,20,1],[2,22,22,-1],[3,4,4,2],[3,5,5,-1],[3,8,8,1],[3,9,9,-1],[3,11,11,1],[3,12,12,-1],[3,13,13,1],[3,14,14,-2],[3,15,15,1],[3,18,18,-1],[3,19,19,1],[3,21,21,-1],[3,22,22,1],[3,23,23,-1],[4,5,8,-1],[4,9,11,-1],[4,12,13,-1],[4,14,3,1],[4,18,15,1],[4,21,19,1],[4,23,22,1],[5,6,9,-1],[5,10,12,-1],[5,15,2,1],[5,18,14,-1],[5,19,16,1],[5,22,20,1],[6,7,10,-1],[6,8,11,1],[6,16,1,1],[6,19,15,-1],[6,20,17,1],[6,21,18,-1],[7,9,12,1],[7,11,13,1],[7,17,0,1],[7,20,16,-1],[7,22,19,-1],[7,23,21,-1],[8,10,13,-1],[8,14,5,1],[8,15,4,-1],[8,18,2,1],[8,18,3,1],[8,21,16,1],[8,23,20,1],[9,15,6,1],[9,16,5,-1],[9,19,1,1],[9,19,2,1],[9,21,14,-1],[9,22,17,1],[10,16,7,1],[10,17,6,-1],[10,20,0,1],[10,20,1,1],[10,22,15,-1],[10,23,18,-1],[11,14,9,1],[11,16,8,-1],[11,18,6,1],[11,19,4,-1],[11,21,1,1],[11,21,2,1],[11,21,3,1],[11,23,17,1],[12,15,10,1],[12,17,9,-1],[12,19,7,1],[12,20,5,-1],[12,22,0,1],[12,22,1,1],[12,22,2,1],[12,23,14,-1],[13,14,12,1],[13,17,11,-1],[13,18,10,1],[13,20,8,-1],[13,21,7,1],[13,22,4,-1],[13,23,0,1],[13,23,1,1],[13,23,2,1],[13,23,3,1],[14,15,18,1],[14,19,21,1],[14,22,23,1],[15,16,19,1],[15,20,22,1],[16,17,20,1],[16,18,21,-1],[17,19,22,-1],[17,21,23,-1],[18,20,23,1]],"compactToChevalley":[[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]]],"simpleGeneratorCount":4,"fullBasisCount":24,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":5,"entries":[[0,1,"0","-1/2"],[1,0,"0","-1/2"]]},{"n":5,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"]]},{"n":5,"entries":[[0,0,"0","-1/2"],[1,1,"0","1/2"]]}],"compactCoordinates":[["0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","-1/2","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":24,"gramPositiveLDL":["2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","3/2","4/3","5/4"],"bracketPairs":276,"jacobiDistinctTriples":2024,"jacobiFullOrderedTriples":13824,"adInvariantMetricOrderedTriples":13824,"chevalleyIntegralBracketPairs":276,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED"},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":5,"entries":[[0,1,"0","-1/2"],[1,0,"0","-1/2"]]},{"n":5,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"]]},{"n":5,"entries":[[0,0,"0","-1/2"],[1,1,"0","1/2"]]}],"compactCoordinates":[["0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","-1/2","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"}],"dataSha256":"e6926510fe73792f954e04c6ce2a5d732584cf0cb276821baae41c419bdad616"},{"id":"SU6","family":"SU","parameter":6,"name":"SU(6)","rank":5,"dimension":35,"matrixDimension":6,"globalForm":{"form":"SIMPLY_CONNECTED","cover":"SU(6)","kernel":["1"],"description":"Actual defining SU(6); center mu_6. No quotient identification."},"center":{"order":6,"generators":["exp(2 pi i/6) I"],"representationDescendsToAdjoint":false},"representation":{"kind":"MATRIX","name":"compact defining complex matrices","dimension":6,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1) Re Tr(XY)"},"rootDatum":{"type":"A","rank":5,"cartan":[[2,-1,0,0,0],[-1,2,-1,0,0],[0,-1,2,-1,0],[0,0,-1,2,-1],[0,0,0,-1,2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"fundamental weights omega_i","cocharacterBasis":"simple coroots alpha_i^vee","pairing":[[1,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0],[0,0,0,0,1]],"simpleRootCharacters":[[2,-1,0,0,0],[-1,2,-1,0,0],[0,-1,2,-1,0],[0,0,-1,2,-1],[0,0,0,-1,2]],"simpleCorootCocharacters":[[1,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0],[0,0,0,0,1]],"roots":[{"simple":[-1,-1,-1,-1,-1],"corootSimple":[-1,-1,-1,-1,-1],"character":[-1,0,0,0,-1],"cocharacter":[-1,-1,-1,-1,-1],"lengthSquared":"2"},{"simple":[-1,-1,-1,-1,0],"corootSimple":[-1,-1,-1,-1,0],"character":[-1,0,0,-1,1],"cocharacter":[-1,-1,-1,-1,0],"lengthSquared":"2"},{"simple":[-1,-1,-1,0,0],"corootSimple":[-1,-1,-1,0,0],"character":[-1,0,-1,1,0],"cocharacter":[-1,-1,-1,0,0],"lengthSquared":"2"},{"simple":[-1,-1,0,0,0],"corootSimple":[-1,-1,0,0,0],"character":[-1,-1,1,0,0],"cocharacter":[-1,-1,0,0,0],"lengthSquared":"2"},{"simple":[-1,0,0,0,0],"corootSimple":[-1,0,0,0,0],"character":[-2,1,0,0,0],"cocharacter":[-1,0,0,0,0],"lengthSquared":"2"},{"simple":[0,-1,-1,-1,-1],"corootSimple":[0,-1,-1,-1,-1],"character":[1,-1,0,0,-1],"cocharacter":[0,-1,-1,-1,-1],"lengthSquared":"2"},{"simple":[0,-1,-1,-1,0],"corootSimple":[0,-1,-1,-1,0],"character":[1,-1,0,-1,1],"cocharacter":[0,-1,-1,-1,0],"lengthSquared":"2"},{"simple":[0,-1,-1,0,0],"corootSimple":[0,-1,-1,0,0],"character":[1,-1,-1,1,0],"cocharacter":[0,-1,-1,0,0],"lengthSquared":"2"},{"simple":[0,-1,0,0,0],"corootSimple":[0,-1,0,0,0],"character":[1,-2,1,0,0],"cocharacter":[0,-1,0,0,0],"lengthSquared":"2"},{"simple":[0,0,-1,-1,-1],"corootSimple":[0,0,-1,-1,-1],"character":[0,1,-1,0,-1],"cocharacter":[0,0,-1,-1,-1],"lengthSquared":"2"},{"simple":[0,0,-1,-1,0],"corootSimple":[0,0,-1,-1,0],"character":[0,1,-1,-1,1],"cocharacter":[0,0,-1,-1,0],"lengthSquared":"2"},{"simple":[0,0,-1,0,0],"corootSimple":[0,0,-1,0,0],"character":[0,1,-2,1,0],"cocharacter":[0,0,-1,0,0],"lengthSquared":"2"},{"simple":[0,0,0,-1,-1],"corootSimple":[0,0,0,-1,-1],"character":[0,0,1,-1,-1],"cocharacter":[0,0,0,-1,-1],"lengthSquared":"2"},{"simple":[0,0,0,-1,0],"corootSimple":[0,0,0,-1,0],"character":[0,0,1,-2,1],"cocharacter":[0,0,0,-1,0],"lengthSquared":"2"},{"simple":[0,0,0,0,-1],"corootSimple":[0,0,0,0,-1],"character":[0,0,0,1,-2],"cocharacter":[0,0,0,0,-1],"lengthSquared":"2"},{"simple":[0,0,0,0,1],"corootSimple":[0,0,0,0,1],"character":[0,0,0,-1,2],"cocharacter":[0,0,0,0,1],"lengthSquared":"2"},{"simple":[0,0,0,1,0],"corootSimple":[0,0,0,1,0],"character":[0,0,-1,2,-1],"cocharacter":[0,0,0,1,0],"lengthSquared":"2"},{"simple":[0,0,0,1,1],"corootSimple":[0,0,0,1,1],"character":[0,0,-1,1,1],"cocharacter":[0,0,0,1,1],"lengthSquared":"2"},{"simple":[0,0,1,0,0],"corootSimple":[0,0,1,0,0],"character":[0,-1,2,-1,0],"cocharacter":[0,0,1,0,0],"lengthSquared":"2"},{"simple":[0,0,1,1,0],"corootSimple":[0,0,1,1,0],"character":[0,-1,1,1,-1],"cocharacter":[0,0,1,1,0],"lengthSquared":"2"},{"simple":[0,0,1,1,1],"corootSimple":[0,0,1,1,1],"character":[0,-1,1,0,1],"cocharacter":[0,0,1,1,1],"lengthSquared":"2"},{"simple":[0,1,0,0,0],"corootSimple":[0,1,0,0,0],"character":[-1,2,-1,0,0],"cocharacter":[0,1,0,0,0],"lengthSquared":"2"},{"simple":[0,1,1,0,0],"corootSimple":[0,1,1,0,0],"character":[-1,1,1,-1,0],"cocharacter":[0,1,1,0,0],"lengthSquared":"2"},{"simple":[0,1,1,1,0],"corootSimple":[0,1,1,1,0],"character":[-1,1,0,1,-1],"cocharacter":[0,1,1,1,0],"lengthSquared":"2"},{"simple":[0,1,1,1,1],"corootSimple":[0,1,1,1,1],"character":[-1,1,0,0,1],"cocharacter":[0,1,1,1,1],"lengthSquared":"2"},{"simple":[1,0,0,0,0],"corootSimple":[1,0,0,0,0],"character":[2,-1,0,0,0],"cocharacter":[1,0,0,0,0],"lengthSquared":"2"},{"simple":[1,1,0,0,0],"corootSimple":[1,1,0,0,0],"character":[1,1,-1,0,0],"cocharacter":[1,1,0,0,0],"lengthSquared":"2"},{"simple":[1,1,1,0,0],"corootSimple":[1,1,1,0,0],"character":[1,0,1,-1,0],"cocharacter":[1,1,1,0,0],"lengthSquared":"2"},{"simple":[1,1,1,1,0],"corootSimple":[1,1,1,1,0],"character":[1,0,0,1,-1],"cocharacter":[1,1,1,1,0],"lengthSquared":"2"},{"simple":[1,1,1,1,1],"corootSimple":[1,1,1,1,1],"character":[1,0,0,0,1],"cocharacter":[1,1,1,1,1],"lengthSquared":"2"}]},"basis":{"names":["A01","B01","A02","B02","A03","B03","A04","B04","A05","B05","A12","B12","A13","B13","A14","B14","A15","B15","A23","B23","A24","B24","A25","B25","A34","B34","A35","B35","A45","B45","H0","H1","H2","H3","H4"],"matrices":[{"n":6,"entries":[[0,1,"1","0"],[1,0,"-1","0"]]},{"n":6,"entries":[[0,1,"0","1"],[1,0,"0","1"]]},{"n":6,"entries":[[0,2,"1","0"],[2,0,"-1","0"]]},{"n":6,"entries":[[0,2,"0","1"],[2,0,"0","1"]]},{"n":6,"entries":[[0,3,"1","0"],[3,0,"-1","0"]]},{"n":6,"entries":[[0,3,"0","1"],[3,0,"0","1"]]},{"n":6,"entries":[[0,4,"1","0"],[4,0,"-1","0"]]},{"n":6,"entries":[[0,4,"0","1"],[4,0,"0","1"]]},{"n":6,"entries":[[0,5,"1","0"],[5,0,"-1","0"]]},{"n":6,"entries":[[0,5,"0","1"],[5,0,"0","1"]]},{"n":6,"entries":[[1,2,"1","0"],[2,1,"-1","0"]]},{"n":6,"entries":[[1,2,"0","1"],[2,1,"0","1"]]},{"n":6,"entries":[[1,3,"1","0"],[3,1,"-1","0"]]},{"n":6,"entries":[[1,3,"0","1"],[3,1,"0","1"]]},{"n":6,"entries":[[1,4,"1","0"],[4,1,"-1","0"]]},{"n":6,"entries":[[1,4,"0","1"],[4,1,"0","1"]]},{"n":6,"entries":[[1,5,"1","0"],[5,1,"-1","0"]]},{"n":6,"entries":[[1,5,"0","1"],[5,1,"0","1"]]},{"n":6,"entries":[[2,3,"1","0"],[3,2,"-1","0"]]},{"n":6,"entries":[[2,3,"0","1"],[3,2,"0","1"]]},{"n":6,"entries":[[2,4,"1","0"],[4,2,"-1","0"]]},{"n":6,"entries":[[2,4,"0","1"],[4,2,"0","1"]]},{"n":6,"entries":[[2,5,"1","0"],[5,2,"-1","0"]]},{"n":6,"entries":[[2,5,"0","1"],[5,2,"0","1"]]},{"n":6,"entries":[[3,4,"1","0"],[4,3,"-1","0"]]},{"n":6,"entries":[[3,4,"0","1"],[4,3,"0","1"]]},{"n":6,"entries":[[3,5,"1","0"],[5,3,"-1","0"]]},{"n":6,"entries":[[3,5,"0","1"],[5,3,"0","1"]]},{"n":6,"entries":[[4,5,"1","0"],[5,4,"-1","0"]]},{"n":6,"entries":[[4,5,"0","1"],[5,4,"0","1"]]},{"n":6,"entries":[[0,0,"0","1"],[1,1,"0","-1"]]},{"n":6,"entries":[[1,1,"0","1"],[2,2,"0","-1"]]},{"n":6,"entries":[[2,2,"0","1"],[3,3,"0","-1"]]},{"n":6,"entries":[[3,3,"0","1"],[4,4,"0","-1"]]},{"n":6,"entries":[[4,4,"0","1"],[5,5,"0","-1"]]}],"compactRealForm":true},"structureConstants":[[0,1,30,"2"],[0,2,10,"-1"],[0,3,11,"-1"],[0,4,12,"-1"],[0,5,13,"-1"],[0,6,14,"-1"],[0,7,15,"-1"],[0,8,16,"-1"],[0,9,17,"-1"],[0,10,2,"1"],[0,11,3,"1"],[0,12,4,"1"],[0,13,5,"1"],[0,14,6,"1"],[0,15,7,"1"],[0,16,8,"1"],[0,17,9,"1"],[0,30,1,"-2"],[0,31,1,"1"],[1,2,11,"1"],[1,3,10,"-1"],[1,4,13,"1"],[1,5,12,"-1"],[1,6,15,"1"],[1,7,14,"-1"],[1,8,17,"1"],[1,9,16,"-1"],[1,10,3,"1"],[1,11,2,"-1"],[1,12,5,"1"],[1,13,4,"-1"],[1,14,7,"1"],[1,15,6,"-1"],[1,16,9,"1"],[1,17,8,"-1"],[1,30,0,"2"],[1,31,0,"-1"],[2,3,30,"2"],[2,3,31,"2"],[2,4,18,"-1"],[2,5,19,"-1"],[2,6,20,"-1"],[2,7,21,"-1"],[2,8,22,"-1"],[2,9,23,"-1"],[2,10,0,"-1"],[2,11,1,"1"],[2,18,4,"1"],[2,19,5,"1"],[2,20,6,"1"],[2,21,7,"1"],[2,22,8,"1"],[2,23,9,"1"],[2,30,3,"-1"],[2,31,3,"-1"],[2,32,3,"1"],[3,4,19,"1"],[3,5,18,"-1"],[3,6,21,"1"],[3,7,20,"-1"],[3,8,23,"1"],[3,9,22,"-1"],[3,10,1,"-1"],[3,11,0,"-1"],[3,18,5,"1"],[3,19,4,"-1"],[3,20,7,"1"],[3,21,6,"-1"],[3,22,9,"1"],[3,23,8,"-1"],[3,30,2,"1"],[3,31,2,"1"],[3,32,2,"-1"],[4,5,30,"2"],[4,5,31,"2"],[4,5,32,"2"],[4,6,24,"-1"],[4,7,25,"-1"],[4,8,26,"-1"],[4,9,27,"-1"],[4,12,0,"-1"],[4,13,1,"1"],[4,18,2,"-1"],[4,19,3,"1"],[4,24,6,"1"],[4,25,7,"1"],[4,26,8,"1"],[4,27,9,"1"],[4,30,5,"-1"],[4,32,5,"-1"],[4,33,5,"1"],[5,6,25,"1"],[5,7,24,"-1"],[5,8,27,"1"],[5,9,26,"-1"],[5,12,1,"-1"],[5,13,0,"-1"],[5,18,3,"-1"],[5,19,2,"-1"],[5,24,7,"1"],[5,25,6,"-1"],[5,26,9,"1"],[5,27,8,"-1"],[5,30,4,"1"],[5,32,4,"1"],[5,33,4,"-1"],[6,7,30,"2"],[6,7,31,"2"],[6,7,32,"2"],[6,7,33,"2"],[6,8,28,"-1"],[6,9,29,"-1"],[6,14,0,"-1"],[6,15,1,"1"],[6,20,2,"-1"],[6,21,3,"1"],[6,24,4,"-1"],[6,25,5,"1"],[6,28,8,"1"],[6,29,9,"1"],[6,30,7,"-1"],[6,33,7,"-1"],[6,34,7,"1"],[7,8,29,"1"],[7,9,28,"-1"],[7,14,1,"-1"],[7,15,0,"-1"],[7,20,3,"-1"],[7,21,2,"-1"],[7,24,5,"-1"],[7,25,4,"-1"],[7,28,9,"1"],[7,29,8,"-1"],[7,30,6,"1"],[7,33,6,"1"],[7,34,6,"-1"],[8,9,30,"2"],[8,9,31,"2"],[8,9,32,"2"],[8,9,33,"2"],[8,9,34,"2"],[8,16,0,"-1"],[8,17,1,"1"],[8,22,2,"-1"],[8,23,3,"1"],[8,26,4,"-1"],[8,27,5,"1"],[8,28,6,"-1"],[8,29,7,"1"],[8,30,9,"-1"],[8,34,9,"-1"],[9,16,1,"-1"],[9,17,0,"-1"],[9,22,3,"-1"],[9,23,2,"-1"],[9,26,5,"-1"],[9,27,4,"-1"],[9,28,7,"-1"],[9,29,6,"-1"],[9,30,8,"1"],[9,34,8,"1"],[10,11,31,"2"],[10,12,18,"-1"],[10,13,19,"-1"],[10,14,20,"-1"],[10,15,21,"-1"],[10,16,22,"-1"],[10,17,23,"-1"],[10,18,12,"1"],[10,19,13,"1"],[10,20,14,"1"],[10,21,15,"1"],[10,22,16,"1"],[10,23,17,"1"],[10,30,11,"1"],[10,31,11,"-2"],[10,32,11,"1"],[11,12,19,"1"],[11,13,18,"-1"],[11,14,21,"1"],[11,15,20,"-1"],[11,16,23,"1"],[11,17,22,"-1"],[11,18,13,"1"],[11,19,12,"-1"],[11,20,15,"1"],[11,21,14,"-1"],[11,22,17,"1"],[11,23,16,"-1"],[11,30,10,"-1"],[11,31,10,"2"],[11,32,10,"-1"],[12,13,31,"2"],[12,13,32,"2"],[12,14,24,"-1"],[12,15,25,"-1"],[12,16,26,"-1"],[12,17,27,"-1"],[12,18,10,"-1"],[12,19,11,"1"],[12,24,14,"1"],[12,25,15,"1"],[12,26,16,"1"],[12,27,17,"1"],[12,30,13,"1"],[12,31,13,"-1"],[12,32,13,"-1"],[12,33,13,"1"],[13,14,25,"1"],[13,15,24,"-1"],[13,16,27,"1"],[13,17,26,"-1"],[13,18,11,"-1"],[13,19,10,"-1"],[13,24,15,"1"],[13,25,14,"-1"],[13,26,17,"1"],[13,27,16,"-1"],[13,30,12,"-1"],[13,31,12,"1"],[13,32,12,"1"],[13,33,12,"-1"],[14,15,31,"2"],[14,15,32,"2"],[14,15,33,"2"],[14,16,28,"-1"],[14,17,29,"-1"],[14,20,10,"-1"],[14,21,11,"1"],[14,24,12,"-1"],[14,25,13,"1"],[14,28,16,"1"],[14,29,17,"1"],[14,30,15,"1"],[14,31,15,"-1"],[14,33,15,"-1"],[14,34,15,"1"],[15,16,29,"1"],[15,17,28,"-1"],[15,20,11,"-1"],[15,21,10,"-1"],[15,24,13,"-1"],[15,25,12,"-1"],[15,28,17,"1"],[15,29,16,"-1"],[15,30,14,"-1"],[15,31,14,"1"],[15,33,14,"1"],[15,34,14,"-1"],[16,17,31,"2"],[16,17,32,"2"],[16,17,33,"2"],[16,17,34,"2"],[16,22,10,"-1"],[16,23,11,"1"],[16,26,12,"-1"],[16,27,13,"1"],[16,28,14,"-1"],[16,29,15,"1"],[16,30,17,"1"],[16,31,17,"-1"],[16,34,17,"-1"],[17,22,11,"-1"],[17,23,10,"-1"],[17,26,13,"-1"],[17,27,12,"-1"],[17,28,15,"-1"],[17,29,14,"-1"],[17,30,16,"-1"],[17,31,16,"1"],[17,34,16,"1"],[18,19,32,"2"],[18,20,24,"-1"],[18,21,25,"-1"],[18,22,26,"-1"],[18,23,27,"-1"],[18,24,20,"1"],[18,25,21,"1"],[18,26,22,"1"],[18,27,23,"1"],[18,31,19,"1"],[18,32,19,"-2"],[18,33,19,"1"],[19,20,25,"1"],[19,21,24,"-1"],[19,22,27,"1"],[19,23,26,"-1"],[19,24,21,"1"],[19,25,20,"-1"],[19,26,23,"1"],[19,27,22,"-1"],[19,31,18,"-1"],[19,32,18,"2"],[19,33,18,"-1"],[20,21,32,"2"],[20,21,33,"2"],[20,22,28,"-1"],[20,23,29,"-1"],[20,24,18,"-1"],[20,25,19,"1"],[20,28,22,"1"],[20,29,23,"1"],[20,31,21,"1"],[20,32,21,"-1"],[20,33,21,"-1"],[20,34,21,"1"],[21,22,29,"1"],[21,23,28,"-1"],[21,24,19,"-1"],[21,25,18,"-1"],[21,28,23,"1"],[21,29,22,"-1"],[21,31,20,"-1"],[21,32,20,"1"],[21,33,20,"1"],[21,34,20,"-1"],[22,23,32,"2"],[22,23,33,"2"],[22,23,34,"2"],[22,26,18,"-1"],[22,27,19,"1"],[22,28,20,"-1"],[22,29,21,"1"],[22,31,23,"1"],[22,32,23,"-1"],[22,34,23,"-1"],[23,26,19,"-1"],[23,27,18,"-1"],[23,28,21,"-1"],[23,29,20,"-1"],[23,31,22,"-1"],[23,32,22,"1"],[23,34,22,"1"],[24,25,33,"2"],[24,26,28,"-1"],[24,27,29,"-1"],[24,28,26,"1"],[24,29,27,"1"],[24,32,25,"1"],[24,33,25,"-2"],[24,34,25,"1"],[25,26,29,"1"],[25,27,28,"-1"],[25,28,27,"1"],[25,29,26,"-1"],[25,32,24,"-1"],[25,33,24,"2"],[25,34,24,"-1"],[26,27,33,"2"],[26,27,34,"2"],[26,28,24,"-1"],[26,29,25,"1"],[26,32,27,"1"],[26,33,27,"-1"],[26,34,27,"-1"],[27,28,25,"-1"],[27,29,24,"-1"],[27,32,26,"-1"],[27,33,26,"1"],[27,34,26,"1"],[28,29,34,"2"],[28,33,29,"1"],[28,34,29,"-2"],[29,33,28,"-1"],[29,34,28,"2"]],"gram":[["2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","-1","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","-1","2","-1","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","-1","2","-1","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","-1","2","-1"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","-1","2"]],"chevalley":{"names":["h1","h2","h3","h4","h5","e(0, 0, 0, 0, 1)","e(0, 0, 0, 1, 0)","e(0, 0, 1, 0, 0)","e(0, 1, 0, 0, 0)","e(1, 0, 0, 0, 0)","e(0, 0, 0, 1, 1)","e(0, 0, 1, 1, 0)","e(0, 1, 1, 0, 0)","e(1, 1, 0, 0, 0)","e(0, 0, 1, 1, 1)","e(0, 1, 1, 1, 0)","e(1, 1, 1, 0, 0)","e(0, 1, 1, 1, 1)","e(1, 1, 1, 1, 0)","e(1, 1, 1, 1, 1)","f(0, 0, 0, 0, 1)","f(0, 0, 0, 1, 0)","f(0, 0, 1, 0, 0)","f(0, 1, 0, 0, 0)","f(1, 0, 0, 0, 0)","f(0, 0, 0, 1, 1)","f(0, 0, 1, 1, 0)","f(0, 1, 1, 0, 0)","f(1, 1, 0, 0, 0)","f(0, 0, 1, 1, 1)","f(0, 1, 1, 1, 0)","f(1, 1, 1, 0, 0)","f(0, 1, 1, 1, 1)","f(1, 1, 1, 1, 0)","f(1, 1, 1, 1, 1)"],"matrices":[{"n":6,"entries":[[0,0,"1","0"],[1,1,"-1","0"]]},{"n":6,"entries":[[1,1,"1","0"],[2,2,"-1","0"]]},{"n":6,"entries":[[2,2,"1","0"],[3,3,"-1","0"]]},{"n":6,"entries":[[3,3,"1","0"],[4,4,"-1","0"]]},{"n":6,"entries":[[4,4,"1","0"],[5,5,"-1","0"]]},{"n":6,"entries":[[4,5,"1","0"]]},{"n":6,"entries":[[3,4,"1","0"]]},{"n":6,"entries":[[2,3,"1","0"]]},{"n":6,"entries":[[1,2,"1","0"]]},{"n":6,"entries":[[0,1,"1","0"]]},{"n":6,"entries":[[3,5,"1","0"]]},{"n":6,"entries":[[2,4,"1","0"]]},{"n":6,"entries":[[1,3,"1","0"]]},{"n":6,"entries":[[0,2,"1","0"]]},{"n":6,"entries":[[2,5,"1","0"]]},{"n":6,"entries":[[1,4,"1","0"]]},{"n":6,"entries":[[0,3,"1","0"]]},{"n":6,"entries":[[1,5,"1","0"]]},{"n":6,"entries":[[0,4,"1","0"]]},{"n":6,"entries":[[0,5,"1","0"]]},{"n":6,"entries":[[5,4,"1","0"]]},{"n":6,"entries":[[4,3,"1","0"]]},{"n":6,"entries":[[3,2,"1","0"]]},{"n":6,"entries":[[2,1,"1","0"]]},{"n":6,"entries":[[1,0,"1","0"]]},{"n":6,"entries":[[5,3,"1","0"]]},{"n":6,"entries":[[4,2,"1","0"]]},{"n":6,"entries":[[3,1,"1","0"]]},{"n":6,"entries":[[2,0,"1","0"]]},{"n":6,"entries":[[5,2,"1","0"]]},{"n":6,"entries":[[4,1,"1","0"]]},{"n":6,"entries":[[3,0,"1","0"]]},{"n":6,"entries":[[5,1,"1","0"]]},{"n":6,"entries":[[4,0,"1","0"]]},{"n":6,"entries":[[5,0,"1","0"]]}],"structureConstants":[[0,8,8,-1],[0,9,9,2],[0,12,12,-1],[0,13,13,1],[0,15,15,-1],[0,16,16,1],[0,17,17,-1],[0,18,18,1],[0,19,19,1],[0,23,23,1],[0,24,24,-2],[0,27,27,1],[0,28,28,-1],[0,30,30,1],[0,31,31,-1],[0,32,32,1],[0,33,33,-1],[0,34,34,-1],[1,7,7,-1],[1,8,8,2],[1,9,9,-1],[1,11,11,-1],[1,12,12,1],[1,13,13,1],[1,14,14,-1],[1,15,15,1],[1,17,17,1],[1,22,22,1],[1,23,23,-2],[1,24,24,1],[1,26,26,1],[1,27,27,-1],[1,28,28,-1],[1,29,29,1],[1,30,30,-1],[1,32,32,-1],[2,6,6,-1],[2,7,7,2],[2,8,8,-1],[2,10,10,-1],[2,11,11,1],[2,12,12,1],[2,13,13,-1],[2,14,14,1],[2,16,16,1],[2,21,21,1],[2,22,22,-2],[2,23,23,1],[2,25,25,1],[2,26,26,-1],[2,27,27,-1],[2,28,28,1],[2,29,29,-1],[2,31,31,-1],[3,5,5,-1],[3,6,6,2],[3,7,7,-1],[3,10,10,1],[3,11,11,1],[3,12,12,-1],[3,15,15,1],[3,16,16,-1],[3,18,18,1],[3,20,20,1],[3,21,21,-2],[3,22,22,1],[3,25,25,-1],[3,26,26,-1],[3,27,27,1],[3,30,30,-1],[3,31,31,1],[3,33,33,-1],[4,5,5,2],[4,6,6,-1],[4,10,10,1],[4,11,11,-1],[4,14,14,1],[4,15,15,-1],[4,17,17,1],[4,18,18,-1],[4,19,19,1],[4,20,20,-2],[4,21,21,1],[4,25,25,-1],[4,26,26,1],[4,29,29,-1],[4,30,30,1],[4,32,32,-1],[4,33,33,1],[4,34,34,-1],[5,6,10,-1],[5,11,14,-1],[5,15,17,-1],[5,18,19,-1],[5,20,4,1],[5,25,21,1],[5,29,26,1],[5,32,30,1],[5,34,33,1],[6,7,11,-1],[6,12,15,-1],[6,16,18,-1],[6,21,3,1],[6,25,20,-1],[6,26,22,1],[6,30,27,1],[6,33,31,1],[7,8,12,-1],[7,10,14,1],[7,13,16,-1],[7,22,2,1],[7,26,21,-1],[7,27,23,1],[7,29,25,-1],[7,31,28,1],[8,9,13,-1],[8,11,15,1],[8,14,17,1],[8,23,1,1],[8,27,22,-1],[8,28,24,1],[8,30,26,-1],[8,32,29,-1],[9,12,16,1],[9,15,18,1],[9,17,19,1],[9,24,0,1],[9,28,23,-1],[9,31,27,-1],[9,33,30,-1],[9,34,32,-1],[10,12,17,-1],[10,16,19,-1],[10,20,6,1],[10,21,5,-1],[10,25,3,1],[10,25,4,1],[10,29,22,1],[10,32,27,1],[10,34,31,1],[11,13,18,-1],[11,21,7,1],[11,22,6,-1],[11,26,2,1],[11,26,3,1],[11,29,20,-1],[11,30,23,1],[11,33,28,1],[12,22,8,1],[12,23,7,-1],[12,27,1,1],[12,27,2,1],[12,30,21,-1],[12,31,24,1],[12,32,25,-1],[13,14,19,1],[13,23,9,1],[13,24,8,-1],[13,28,0,1],[13,28,1,1],[13,31,22,-1],[13,33,26,-1],[13,34,29,-1],[14,20,11,1],[14,22,10,-1],[14,25,7,1],[14,26,5,-1],[14,29,2,1],[14,29,3,1],[14,29,4,1],[14,32,23,1],[14,34,28,1],[15,21,12,1],[15,23,11,-1],[15,26,8,1],[15,27,6,-1],[15,30,1,1],[15,30,2,1],[15,30,3,1],[15,32,20,-1],[15,33,24,1],[16,22,13,1],[16,24,12,-1],[16,27,9,1],[16,28,7,-1],[16,31,0,1],[16,31,1,1],[16,31,2,1],[16,33,21,-1],[16,34,25,-1],[17,20,15,1],[17,23,14,-1],[17,25,12,1],[17,27,10,-1],[17,29,8,1],[17,30,5,-1],[17,32,1,1],[17,32,2,1],[17,32,3,1],[17,32,4,1],[17,34,24,1],[18,21,16,1],[18,24,15,-1],[18,26,13,1],[18,28,11,-1],[18,30,9,1],[18,31,6,-1],[18,33,0,1],[18,33,1,1],[18,33,2,1],[18,33,3,1],[18,34,20,-1],[19,20,18,1],[19,24,17,-1],[19,25,16,1],[19,28,14,-1],[19,29,13,1],[19,31,10,-1],[19,32,9,1],[19,33,5,-1],[19,34,0,1],[19,34,1,1],[19,34,2,1],[19,34,3,1],[19,34,4,1],[20,21,25,1],[20,26,29,1],[20,30,32,1],[20,33,34,1],[21,22,26,1],[21,27,30,1],[21,31,33,1],[22,23,27,1],[22,25,29,-1],[22,28,31,1],[23,24,28,1],[23,26,30,-1],[23,29,32,-1],[24,27,31,-1],[24,30,33,-1],[24,32,34,-1],[25,27,32,1],[25,31,34,1],[26,28,33,1],[28,29,34,-1]],"compactToChevalley":[[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]]],"simpleGeneratorCount":5,"fullBasisCount":35,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":6,"entries":[[0,1,"0","-1/2"],[1,0,"0","-1/2"]]},{"n":6,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"]]},{"n":6,"entries":[[0,0,"0","-1/2"],[1,1,"0","1/2"]]}],"compactCoordinates":[["0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","-1/2","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":35,"gramPositiveLDL":["2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","2","3/2","4/3","5/4","6/5"],"bracketPairs":595,"jacobiDistinctTriples":6545,"jacobiFullOrderedTriples":42875,"adInvariantMetricOrderedTriples":42875,"chevalleyIntegralBracketPairs":595,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED"},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":6,"entries":[[0,1,"0","-1/2"],[1,0,"0","-1/2"]]},{"n":6,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"]]},{"n":6,"entries":[[0,0,"0","-1/2"],[1,1,"0","1/2"]]}],"compactCoordinates":[["0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","-1/2","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"}],"dataSha256":"2c6986f51ff01690f283fdd67d36a3be5427dd3f2463554a92de99e22659aedb"},{"id":"SO3","family":"SO","parameter":3,"name":"SO(3)","rank":1,"dimension":3,"matrixDimension":3,"globalForm":{"form":"ADJOINT","cover":"Spin(3) (not the stored matrix group)","kernel":["+1","-1"],"description":"Actual faithful SO(3) vector group. Spin(3) is only the specified universal cover."},"center":{"order":1,"generators":[],"representationDescendsToAdjoint":true},"representation":{"kind":"MATRIX","name":"defining real matrices","dimension":3,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1/4","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1/4) Re Tr(XY)"},"rootDatum":{"type":"A","rank":1,"cartan":[[2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"integer rotation characters e_i","cocharacterBasis":"integer 2pi rotations e_i","pairing":[[1]],"simpleRootCharacters":[[1]],"simpleCorootCocharacters":[[2]],"roots":[{"simple":[-1],"corootSimple":[-1],"character":[-1],"cocharacter":[-2],"lengthSquared":"2"},{"simple":[1],"corootSimple":[1],"character":[1],"cocharacter":[2],"lengthSquared":"2"}]},"basis":{"names":["A01","A02","A12"],"matrices":[{"n":3,"entries":[[0,1,"1","0"],[1,0,"-1","0"]]},{"n":3,"entries":[[0,2,"1","0"],[2,0,"-1","0"]]},{"n":3,"entries":[[1,2,"1","0"],[2,1,"-1","0"]]}],"compactRealForm":true},"structureConstants":[[0,1,2,"-1"],[0,2,1,"1"],[1,2,0,"-1"]],"gram":[["1/2","0","0"],["0","1/2","0"],["0","0","1/2"]],"chevalley":{"names":["h1","e(1,)","f(1,)"],"matrices":[{"n":3,"entries":[[0,1,"0","-2"],[1,0,"0","2"]]},{"n":3,"entries":[[0,2,"1","0"],[1,2,"0","1"],[2,0,"-1","0"],[2,1,"0","-1"]]},{"n":3,"entries":[[0,2,"-1","0"],[1,2,"0","1"],[2,0,"1","0"],[2,1,"0","-1"]]}],"structureConstants":[[0,1,1,2],[0,2,2,-2],[1,2,0,1]],"compactToChevalley":[[["0","1/2"],["0","0"],["0","0"]],[["0","0"],["1/2","0"],["0","-1/2"]],[["0","0"],["-1/2","0"],["0","-1/2"]]],"simpleGeneratorCount":1,"fullBasisCount":3,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":3,"entries":[[1,2,"-1","0"],[2,1,"1","0"]]},{"n":3,"entries":[[0,2,"1","0"],[2,0,"-1","0"]]},{"n":3,"entries":[[0,1,"-1","0"],[1,0,"1","0"]]}],"compactCoordinates":[["0","0","-1"],["0","1","0"],["-1","0","0"]],"index":"1","globalKernel":["+1","-1"],"integration":"Adjoint SU(2) double cover"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":3,"gramPositiveLDL":["1/2","1/2","1/2"],"bracketPairs":3,"jacobiDistinctTriples":1,"jacobiFullOrderedTriples":27,"adInvariantMetricOrderedTriples":27,"chevalleyIntegralBracketPairs":3,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED"},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":3,"entries":[[1,2,"-1","0"],[2,1,"1","0"]]},{"n":3,"entries":[[0,2,"1","0"],[2,0,"-1","0"]]},{"n":3,"entries":[[0,1,"-1","0"],[1,0,"1","0"]]}],"compactCoordinates":[["0","0","-1"],["0","1","0"],["-1","0","0"]],"index":"1","globalKernel":["+1","-1"],"integration":"Adjoint SU(2) double cover"}],"dataSha256":"fcf300a28ab90df297fe15982fc4941a66ab0c607afc15ac5c6eec7e4cda56c2"},{"id":"SO5","family":"SO","parameter":5,"name":"SO(5)","rank":2,"dimension":10,"matrixDimension":5,"globalForm":{"form":"ADJOINT","cover":"Spin(5) (not the stored matrix group)","kernel":["+1","-1"],"description":"Actual faithful SO(5) vector group. Spin(5) is only the specified universal cover."},"center":{"order":1,"generators":[],"representationDescendsToAdjoint":true},"representation":{"kind":"MATRIX","name":"defining real matrices","dimension":5,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1/2","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1/2) Re Tr(XY)"},"rootDatum":{"type":"B","rank":2,"cartan":[[2,-1],[-2,2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"integer rotation characters e_i","cocharacterBasis":"integer 2pi rotations e_i","pairing":[[1,0],[0,1]],"simpleRootCharacters":[[1,-1],[0,1]],"simpleCorootCocharacters":[[1,-1],[0,2]],"roots":[{"simple":[-1,-2],"corootSimple":[-1,-1],"character":[-1,-1],"cocharacter":[-1,-1],"lengthSquared":"2"},{"simple":[-1,-1],"corootSimple":[-2,-1],"character":[-1,0],"cocharacter":[-2,0],"lengthSquared":"1"},{"simple":[-1,0],"corootSimple":[-1,0],"character":[-1,1],"cocharacter":[-1,1],"lengthSquared":"2"},{"simple":[0,-1],"corootSimple":[0,-1],"character":[0,-1],"cocharacter":[0,-2],"lengthSquared":"1"},{"simple":[0,1],"corootSimple":[0,1],"character":[0,1],"cocharacter":[0,2],"lengthSquared":"1"},{"simple":[1,0],"corootSimple":[1,0],"character":[1,-1],"cocharacter":[1,-1],"lengthSquared":"2"},{"simple":[1,1],"corootSimple":[2,1],"character":[1,0],"cocharacter":[2,0],"lengthSquared":"1"},{"simple":[1,2],"corootSimple":[1,1],"character":[1,1],"cocharacter":[1,1],"lengthSquared":"2"}]},"basis":{"names":["A01","A02","A03","A04","A12","A13","A14","A23","A24","A34"],"matrices":[{"n":5,"entries":[[0,1,"1","0"],[1,0,"-1","0"]]},{"n":5,"entries":[[0,2,"1","0"],[2,0,"-1","0"]]},{"n":5,"entries":[[0,3,"1","0"],[3,0,"-1","0"]]},{"n":5,"entries":[[0,4,"1","0"],[4,0,"-1","0"]]},{"n":5,"entries":[[1,2,"1","0"],[2,1,"-1","0"]]},{"n":5,"entries":[[1,3,"1","0"],[3,1,"-1","0"]]},{"n":5,"entries":[[1,4,"1","0"],[4,1,"-1","0"]]},{"n":5,"entries":[[2,3,"1","0"],[3,2,"-1","0"]]},{"n":5,"entries":[[2,4,"1","0"],[4,2,"-1","0"]]},{"n":5,"entries":[[3,4,"1","0"],[4,3,"-1","0"]]}],"compactRealForm":true},"structureConstants":[[0,1,4,"-1"],[0,2,5,"-1"],[0,3,6,"-1"],[0,4,1,"1"],[0,5,2,"1"],[0,6,3,"1"],[1,2,7,"-1"],[1,3,8,"-1"],[1,4,0,"-1"],[1,7,2,"1"],[1,8,3,"1"],[2,3,9,"-1"],[2,5,0,"-1"],[2,7,1,"-1"],[2,9,3,"1"],[3,6,0,"-1"],[3,8,1,"-1"],[3,9,2,"-1"],[4,5,7,"-1"],[4,6,8,"-1"],[4,7,5,"1"],[4,8,6,"1"],[5,6,9,"-1"],[5,7,4,"-1"],[5,9,6,"1"],[6,8,4,"-1"],[6,9,5,"-1"],[7,8,9,"-1"],[7,9,8,"1"],[8,9,7,"-1"]],"gram":[["1","0","0","0","0","0","0","0","0","0"],["0","1","0","0","0","0","0","0","0","0"],["0","0","1","0","0","0","0","0","0","0"],["0","0","0","1","0","0","0","0","0","0"],["0","0","0","0","1","0","0","0","0","0"],["0","0","0","0","0","1","0","0","0","0"],["0","0","0","0","0","0","1","0","0","0"],["0","0","0","0","0","0","0","1","0","0"],["0","0","0","0","0","0","0","0","1","0"],["0","0","0","0","0","0","0","0","0","1"]],"chevalley":{"names":["h1","h2","e(0, 1)","e(1, 0)","e(1, 1)","e(1, 2)","f(0, 1)","f(1, 0)","f(1, 1)","f(1, 2)"],"matrices":[{"n":5,"entries":[[0,1,"0","-1"],[1,0,"0","1"],[2,3,"0","1"],[3,2,"0","-1"]]},{"n":5,"entries":[[2,3,"0","-2"],[3,2,"0","2"]]},{"n":5,"entries":[[2,4,"1","0"],[3,4,"0","1"],[4,2,"-1","0"],[4,3,"0","-1"]]},{"n":5,"entries":[[0,2,"1/2","0"],[0,3,"0","-1/2"],[1,2,"0","1/2"],[1,3,"1/2","0"],[2,0,"-1/2","0"],[2,1,"0","-1/2"],[3,0,"0","1/2"],[3,1,"-1/2","0"]]},{"n":5,"entries":[[0,4,"1","0"],[1,4,"0","1"],[4,0,"-1","0"],[4,1,"0","-1"]]},{"n":5,"entries":[[0,2,"1/2","0"],[0,3,"0","1/2"],[1,2,"0","1/2"],[1,3,"-1/2","0"],[2,0,"-1/2","0"],[2,1,"0","-1/2"],[3,0,"0","-1/2"],[3,1,"1/2","0"]]},{"n":5,"entries":[[2,4,"-1","0"],[3,4,"0","1"],[4,2,"1","0"],[4,3,"0","-1"]]},{"n":5,"entries":[[0,2,"-1/2","0"],[0,3,"0","-1/2"],[1,2,"0","1/2"],[1,3,"-1/2","0"],[2,0,"1/2","0"],[2,1,"0","-1/2"],[3,0,"0","1/2"],[3,1,"1/2","0"]]},{"n":5,"entries":[[0,4,"-1","0"],[1,4,"0","1"],[4,0,"1","0"],[4,1,"0","-1"]]},{"n":5,"entries":[[0,2,"-1/2","0"],[0,3,"0","1/2"],[1,2,"0","1/2"],[1,3,"1/2","0"],[2,0,"1/2","0"],[2,1,"0","-1/2"],[3,0,"0","-1/2"],[3,1,"-1/2","0"]]}],"structureConstants":[[0,2,2,-1],[0,3,3,2],[0,4,4,1],[0,6,6,1],[0,7,7,-2],[0,8,8,-1],[1,2,2,2],[1,3,3,-2],[1,5,5,2],[1,6,6,-2],[1,7,7,2],[1,9,9,-2],[2,3,4,-1],[2,4,5,2],[2,6,1,1],[2,8,7,2],[2,9,8,-1],[3,7,0,1],[3,8,6,-1],[4,6,3,2],[4,7,2,-1],[4,8,0,2],[4,8,1,1],[4,9,6,1],[5,6,4,-1],[5,8,2,1],[5,9,0,1],[5,9,1,1],[6,7,8,1],[6,8,9,-2]],"compactToChevalley":[[["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1/2"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","-1/2"]],[["0","0"],["1/2","0"],["0","1/2"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["1/2","0"],["0","0"],["0","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"]],[["0","0"],["1/2","0"],["0","-1/2"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","-1/2"]],[["0","0"],["-1/2","0"],["0","1/2"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","0"],["0","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"]],[["0","0"],["-1/2","0"],["0","-1/2"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"]]],"simpleGeneratorCount":2,"fullBasisCount":10,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":5,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"],[2,3,"-1/2","0"],[3,2,"1/2","0"]]},{"n":5,"entries":[[0,2,"-1/2","0"],[1,3,"1/2","0"],[2,0,"1/2","0"],[3,1,"-1/2","0"]]},{"n":5,"entries":[[0,3,"-1/2","0"],[1,2,"-1/2","0"],[2,1,"1/2","0"],[3,0,"1/2","0"]]}],"compactCoordinates":[["-1/2","0","0","0","0","0","0","-1/2","0","0"],["0","-1/2","0","0","0","1/2","0","0","0","0"],["0","0","-1/2","0","-1/2","0","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":10,"gramPositiveLDL":["1","1","1","1","1","1","1","1","1","1"],"bracketPairs":45,"jacobiDistinctTriples":120,"jacobiFullOrderedTriples":1000,"adInvariantMetricOrderedTriples":1000,"chevalleyIntegralBracketPairs":45,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED"},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":5,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"],[2,3,"-1/2","0"],[3,2,"1/2","0"]]},{"n":5,"entries":[[0,2,"-1/2","0"],[1,3,"1/2","0"],[2,0,"1/2","0"],[3,1,"-1/2","0"]]},{"n":5,"entries":[[0,3,"-1/2","0"],[1,2,"-1/2","0"],[2,1,"1/2","0"],[3,0,"1/2","0"]]}],"compactCoordinates":[["-1/2","0","0","0","0","0","0","-1/2","0","0"],["0","-1/2","0","0","0","1/2","0","0","0","0"],["0","0","-1/2","0","-1/2","0","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"}],"dataSha256":"caea74cd24f25da02922e06f28791fae908fc26434a75a76724dd506bf11166b"},{"id":"SO6","family":"SO","parameter":6,"name":"SO(6)","rank":3,"dimension":15,"matrixDimension":6,"globalForm":{"form":"QUOTIENT","cover":"Spin(6) (not the stored matrix group)","kernel":["+1","-1"],"description":"Actual faithful SO(6) vector group. Spin(6) is only the specified universal cover."},"center":{"order":2,"generators":["-I"],"representationDescendsToAdjoint":false},"representation":{"kind":"MATRIX","name":"defining real matrices","dimension":6,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1/2","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1/2) Re Tr(XY)"},"rootDatum":{"type":"D","rank":3,"cartan":[[2,-1,-1],[-1,2,0],[-1,0,2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"integer rotation characters e_i","cocharacterBasis":"integer 2pi rotations e_i","pairing":[[1,0,0],[0,1,0],[0,0,1]],"simpleRootCharacters":[[1,-1,0],[0,1,-1],[0,1,1]],"simpleCorootCocharacters":[[1,-1,0],[0,1,-1],[0,1,1]],"roots":[{"simple":[-1,-1,-1],"corootSimple":[-1,-1,-1],"character":[-1,-1,0],"cocharacter":[-1,-1,0],"lengthSquared":"2"},{"simple":[-1,-1,0],"corootSimple":[-1,-1,0],"character":[-1,0,1],"cocharacter":[-1,0,1],"lengthSquared":"2"},{"simple":[-1,0,-1],"corootSimple":[-1,0,-1],"character":[-1,0,-1],"cocharacter":[-1,0,-1],"lengthSquared":"2"},{"simple":[-1,0,0],"corootSimple":[-1,0,0],"character":[-1,1,0],"cocharacter":[-1,1,0],"lengthSquared":"2"},{"simple":[0,-1,0],"corootSimple":[0,-1,0],"character":[0,-1,1],"cocharacter":[0,-1,1],"lengthSquared":"2"},{"simple":[0,0,-1],"corootSimple":[0,0,-1],"character":[0,-1,-1],"cocharacter":[0,-1,-1],"lengthSquared":"2"},{"simple":[0,0,1],"corootSimple":[0,0,1],"character":[0,1,1],"cocharacter":[0,1,1],"lengthSquared":"2"},{"simple":[0,1,0],"corootSimple":[0,1,0],"character":[0,1,-1],"cocharacter":[0,1,-1],"lengthSquared":"2"},{"simple":[1,0,0],"corootSimple":[1,0,0],"character":[1,-1,0],"cocharacter":[1,-1,0],"lengthSquared":"2"},{"simple":[1,0,1],"corootSimple":[1,0,1],"character":[1,0,1],"cocharacter":[1,0,1],"lengthSquared":"2"},{"simple":[1,1,0],"corootSimple":[1,1,0],"character":[1,0,-1],"cocharacter":[1,0,-1],"lengthSquared":"2"},{"simple":[1,1,1],"corootSimple":[1,1,1],"character":[1,1,0],"cocharacter":[1,1,0],"lengthSquared":"2"}]},"basis":{"names":["A01","A02","A03","A04","A05","A12","A13","A14","A15","A23","A24","A25","A34","A35","A45"],"matrices":[{"n":6,"entries":[[0,1,"1","0"],[1,0,"-1","0"]]},{"n":6,"entries":[[0,2,"1","0"],[2,0,"-1","0"]]},{"n":6,"entries":[[0,3,"1","0"],[3,0,"-1","0"]]},{"n":6,"entries":[[0,4,"1","0"],[4,0,"-1","0"]]},{"n":6,"entries":[[0,5,"1","0"],[5,0,"-1","0"]]},{"n":6,"entries":[[1,2,"1","0"],[2,1,"-1","0"]]},{"n":6,"entries":[[1,3,"1","0"],[3,1,"-1","0"]]},{"n":6,"entries":[[1,4,"1","0"],[4,1,"-1","0"]]},{"n":6,"entries":[[1,5,"1","0"],[5,1,"-1","0"]]},{"n":6,"entries":[[2,3,"1","0"],[3,2,"-1","0"]]},{"n":6,"entries":[[2,4,"1","0"],[4,2,"-1","0"]]},{"n":6,"entries":[[2,5,"1","0"],[5,2,"-1","0"]]},{"n":6,"entries":[[3,4,"1","0"],[4,3,"-1","0"]]},{"n":6,"entries":[[3,5,"1","0"],[5,3,"-1","0"]]},{"n":6,"entries":[[4,5,"1","0"],[5,4,"-1","0"]]}],"compactRealForm":true},"structureConstants":[[0,1,5,"-1"],[0,2,6,"-1"],[0,3,7,"-1"],[0,4,8,"-1"],[0,5,1,"1"],[0,6,2,"1"],[0,7,3,"1"],[0,8,4,"1"],[1,2,9,"-1"],[1,3,10,"-1"],[1,4,11,"-1"],[1,5,0,"-1"],[1,9,2,"1"],[1,10,3,"1"],[1,11,4,"1"],[2,3,12,"-1"],[2,4,13,"-1"],[2,6,0,"-1"],[2,9,1,"-1"],[2,12,3,"1"],[2,13,4,"1"],[3,4,14,"-1"],[3,7,0,"-1"],[3,10,1,"-1"],[3,12,2,"-1"],[3,14,4,"1"],[4,8,0,"-1"],[4,11,1,"-1"],[4,13,2,"-1"],[4,14,3,"-1"],[5,6,9,"-1"],[5,7,10,"-1"],[5,8,11,"-1"],[5,9,6,"1"],[5,10,7,"1"],[5,11,8,"1"],[6,7,12,"-1"],[6,8,13,"-1"],[6,9,5,"-1"],[6,12,7,"1"],[6,13,8,"1"],[7,8,14,"-1"],[7,10,5,"-1"],[7,12,6,"-1"],[7,14,8,"1"],[8,11,5,"-1"],[8,13,6,"-1"],[8,14,7,"-1"],[9,10,12,"-1"],[9,11,13,"-1"],[9,12,10,"1"],[9,13,11,"1"],[10,11,14,"-1"],[10,12,9,"-1"],[10,14,11,"1"],[11,13,9,"-1"],[11,14,10,"-1"],[12,13,14,"-1"],[12,14,13,"1"],[13,14,12,"-1"]],"gram":[["1","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","1","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","1","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","1","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","1","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","1","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","1","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","1","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","1","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","1","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","1","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","1","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","1","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","1","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","1"]],"chevalley":{"names":["h1","h2","h3","e(0, 0, 1)","e(0, 1, 0)","e(1, 0, 0)","e(1, 0, 1)","e(1, 1, 0)","e(1, 1, 1)","f(0, 0, 1)","f(0, 1, 0)","f(1, 0, 0)","f(1, 0, 1)","f(1, 1, 0)","f(1, 1, 1)"],"matrices":[{"n":6,"entries":[[0,1,"0","-1"],[1,0,"0","1"],[2,3,"0","1"],[3,2,"0","-1"]]},{"n":6,"entries":[[2,3,"0","-1"],[3,2,"0","1"],[4,5,"0","1"],[5,4,"0","-1"]]},{"n":6,"entries":[[2,3,"0","-1"],[3,2,"0","1"],[4,5,"0","-1"],[5,4,"0","1"]]},{"n":6,"entries":[[2,4,"1/2","0"],[2,5,"0","1/2"],[3,4,"0","1/2"],[3,5,"-1/2","0"],[4,2,"-1/2","0"],[4,3,"0","-1/2"],[5,2,"0","-1/2"],[5,3,"1/2","0"]]},{"n":6,"entries":[[2,4,"1/2","0"],[2,5,"0","-1/2"],[3,4,"0","1/2"],[3,5,"1/2","0"],[4,2,"-1/2","0"],[4,3,"0","-1/2"],[5,2,"0","1/2"],[5,3,"-1/2","0"]]},{"n":6,"entries":[[0,2,"1/2","0"],[0,3,"0","-1/2"],[1,2,"0","1/2"],[1,3,"1/2","0"],[2,0,"-1/2","0"],[2,1,"0","-1/2"],[3,0,"0","1/2"],[3,1,"-1/2","0"]]},{"n":6,"entries":[[0,4,"1/2","0"],[0,5,"0","1/2"],[1,4,"0","1/2"],[1,5,"-1/2","0"],[4,0,"-1/2","0"],[4,1,"0","-1/2"],[5,0,"0","-1/2"],[5,1,"1/2","0"]]},{"n":6,"entries":[[0,4,"1/2","0"],[0,5,"0","-1/2"],[1,4,"0","1/2"],[1,5,"1/2","0"],[4,0,"-1/2","0"],[4,1,"0","-1/2"],[5,0,"0","1/2"],[5,1,"-1/2","0"]]},{"n":6,"entries":[[0,2,"1/2","0"],[0,3,"0","1/2"],[1,2,"0","1/2"],[1,3,"-1/2","0"],[2,0,"-1/2","0"],[2,1,"0","-1/2"],[3,0,"0","-1/2"],[3,1,"1/2","0"]]},{"n":6,"entries":[[2,4,"-1/2","0"],[2,5,"0","1/2"],[3,4,"0","1/2"],[3,5,"1/2","0"],[4,2,"1/2","0"],[4,3,"0","-1/2"],[5,2,"0","-1/2"],[5,3,"-1/2","0"]]},{"n":6,"entries":[[2,4,"-1/2","0"],[2,5,"0","-1/2"],[3,4,"0","1/2"],[3,5,"-1/2","0"],[4,2,"1/2","0"],[4,3,"0","-1/2"],[5,2,"0","1/2"],[5,3,"1/2","0"]]},{"n":6,"entries":[[0,2,"-1/2","0"],[0,3,"0","-1/2"],[1,2,"0","1/2"],[1,3,"-1/2","0"],[2,0,"1/2","0"],[2,1,"0","-1/2"],[3,0,"0","1/2"],[3,1,"1/2","0"]]},{"n":6,"entries":[[0,4,"-1/2","0"],[0,5,"0","1/2"],[1,4,"0","1/2"],[1,5,"1/2","0"],[4,0,"1/2","0"],[4,1,"0","-1/2"],[5,0,"0","-1/2"],[5,1,"-1/2","0"]]},{"n":6,"entries":[[0,4,"-1/2","0"],[0,5,"0","-1/2"],[1,4,"0","1/2"],[1,5,"-1/2","0"],[4,0,"1/2","0"],[4,1,"0","-1/2"],[5,0,"0","1/2"],[5,1,"1/2","0"]]},{"n":6,"entries":[[0,2,"-1/2","0"],[0,3,"0","1/2"],[1,2,"0","1/2"],[1,3,"1/2","0"],[2,0,"1/2","0"],[2,1,"0","-1/2"],[3,0,"0","-1/2"],[3,1,"-1/2","0"]]}],"structureConstants":[[0,3,3,-1],[0,4,4,-1],[0,5,5,2],[0,6,6,1],[0,7,7,1],[0,9,9,1],[0,10,10,1],[0,11,11,-2],[0,12,12,-1],[0,13,13,-1],[1,4,4,2],[1,5,5,-1],[1,6,6,-1],[1,7,7,1],[1,8,8,1],[1,10,10,-2],[1,11,11,1],[1,12,12,1],[1,13,13,-1],[1,14,14,-1],[2,3,3,2],[2,5,5,-1],[2,6,6,1],[2,7,7,-1],[2,8,8,1],[2,9,9,-2],[2,11,11,1],[2,12,12,-1],[2,13,13,1],[2,14,14,-1],[3,5,6,-1],[3,7,8,1],[3,9,2,1],[3,12,11,1],[3,14,13,-1],[4,5,7,-1],[4,6,8,1],[4,10,1,1],[4,13,11,1],[4,14,12,-1],[5,11,0,1],[5,12,9,-1],[5,13,10,-1],[6,9,5,1],[6,11,3,-1],[6,12,0,1],[6,12,2,1],[6,14,10,1],[7,10,5,1],[7,11,4,-1],[7,13,0,1],[7,13,1,1],[7,14,9,1],[8,9,7,-1],[8,10,6,-1],[8,12,4,1],[8,13,3,1],[8,14,0,1],[8,14,1,1],[8,14,2,1],[9,11,12,1],[9,13,14,-1],[10,11,13,1],[10,12,14,-1]],"compactToChevalley":[[["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"]],[["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1/2"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","-1/2"],["0","-1/2"],["-1/2","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","1/2"],["0","-1/2"],["1/2","0"],["0","0"]],[["0","0"],["1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","-1/2"],["0","-1/2"],["1/2","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","1/2"],["0","-1/2"],["-1/2","0"],["0","0"]],[["0","0"],["-1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["-1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]]],"simpleGeneratorCount":3,"fullBasisCount":15,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":6,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"],[2,3,"-1/2","0"],[3,2,"1/2","0"]]},{"n":6,"entries":[[0,2,"-1/2","0"],[1,3,"1/2","0"],[2,0,"1/2","0"],[3,1,"-1/2","0"]]},{"n":6,"entries":[[0,3,"-1/2","0"],[1,2,"-1/2","0"],[2,1,"1/2","0"],[3,0,"1/2","0"]]}],"compactCoordinates":[["-1/2","0","0","0","0","0","0","0","0","-1/2","0","0","0","0","0"],["0","-1/2","0","0","0","0","1/2","0","0","0","0","0","0","0","0"],["0","0","-1/2","0","0","-1/2","0","0","0","0","0","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":15,"gramPositiveLDL":["1","1","1","1","1","1","1","1","1","1","1","1","1","1","1"],"bracketPairs":105,"jacobiDistinctTriples":455,"jacobiFullOrderedTriples":3375,"adInvariantMetricOrderedTriples":3375,"chevalleyIntegralBracketPairs":105,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED"},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":6,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"],[2,3,"-1/2","0"],[3,2,"1/2","0"]]},{"n":6,"entries":[[0,2,"-1/2","0"],[1,3,"1/2","0"],[2,0,"1/2","0"],[3,1,"-1/2","0"]]},{"n":6,"entries":[[0,3,"-1/2","0"],[1,2,"-1/2","0"],[2,1,"1/2","0"],[3,0,"1/2","0"]]}],"compactCoordinates":[["-1/2","0","0","0","0","0","0","0","0","-1/2","0","0","0","0","0"],["0","-1/2","0","0","0","0","1/2","0","0","0","0","0","0","0","0"],["0","0","-1/2","0","0","-1/2","0","0","0","0","0","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"}],"dataSha256":"45e6c5b045b25bee8545ec08b3f2e87d1bd71494af85efa6e76684f76a0eea0d"},{"id":"SO7","family":"SO","parameter":7,"name":"SO(7)","rank":3,"dimension":21,"matrixDimension":7,"globalForm":{"form":"ADJOINT","cover":"Spin(7) (not the stored matrix group)","kernel":["+1","-1"],"description":"Actual faithful SO(7) vector group. Spin(7) is only the specified universal cover."},"center":{"order":1,"generators":[],"representationDescendsToAdjoint":true},"representation":{"kind":"MATRIX","name":"defining real matrices","dimension":7,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1/2","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1/2) Re Tr(XY)"},"rootDatum":{"type":"B","rank":3,"cartan":[[2,-1,0],[-1,2,-1],[0,-2,2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"integer rotation characters e_i","cocharacterBasis":"integer 2pi rotations e_i","pairing":[[1,0,0],[0,1,0],[0,0,1]],"simpleRootCharacters":[[1,-1,0],[0,1,-1],[0,0,1]],"simpleCorootCocharacters":[[1,-1,0],[0,1,-1],[0,0,2]],"roots":[{"simple":[-1,-2,-2],"corootSimple":[-1,-2,-1],"character":[-1,-1,0],"cocharacter":[-1,-1,0],"lengthSquared":"2"},{"simple":[-1,-1,-2],"corootSimple":[-1,-1,-1],"character":[-1,0,-1],"cocharacter":[-1,0,-1],"lengthSquared":"2"},{"simple":[-1,-1,-1],"corootSimple":[-2,-2,-1],"character":[-1,0,0],"cocharacter":[-2,0,0],"lengthSquared":"1"},{"simple":[-1,-1,0],"corootSimple":[-1,-1,0],"character":[-1,0,1],"cocharacter":[-1,0,1],"lengthSquared":"2"},{"simple":[-1,0,0],"corootSimple":[-1,0,0],"character":[-1,1,0],"cocharacter":[-1,1,0],"lengthSquared":"2"},{"simple":[0,-1,-2],"corootSimple":[0,-1,-1],"character":[0,-1,-1],"cocharacter":[0,-1,-1],"lengthSquared":"2"},{"simple":[0,-1,-1],"corootSimple":[0,-2,-1],"character":[0,-1,0],"cocharacter":[0,-2,0],"lengthSquared":"1"},{"simple":[0,-1,0],"corootSimple":[0,-1,0],"character":[0,-1,1],"cocharacter":[0,-1,1],"lengthSquared":"2"},{"simple":[0,0,-1],"corootSimple":[0,0,-1],"character":[0,0,-1],"cocharacter":[0,0,-2],"lengthSquared":"1"},{"simple":[0,0,1],"corootSimple":[0,0,1],"character":[0,0,1],"cocharacter":[0,0,2],"lengthSquared":"1"},{"simple":[0,1,0],"corootSimple":[0,1,0],"character":[0,1,-1],"cocharacter":[0,1,-1],"lengthSquared":"2"},{"simple":[0,1,1],"corootSimple":[0,2,1],"character":[0,1,0],"cocharacter":[0,2,0],"lengthSquared":"1"},{"simple":[0,1,2],"corootSimple":[0,1,1],"character":[0,1,1],"cocharacter":[0,1,1],"lengthSquared":"2"},{"simple":[1,0,0],"corootSimple":[1,0,0],"character":[1,-1,0],"cocharacter":[1,-1,0],"lengthSquared":"2"},{"simple":[1,1,0],"corootSimple":[1,1,0],"character":[1,0,-1],"cocharacter":[1,0,-1],"lengthSquared":"2"},{"simple":[1,1,1],"corootSimple":[2,2,1],"character":[1,0,0],"cocharacter":[2,0,0],"lengthSquared":"1"},{"simple":[1,1,2],"corootSimple":[1,1,1],"character":[1,0,1],"cocharacter":[1,0,1],"lengthSquared":"2"},{"simple":[1,2,2],"corootSimple":[1,2,1],"character":[1,1,0],"cocharacter":[1,1,0],"lengthSquared":"2"}]},"basis":{"names":["A01","A02","A03","A04","A05","A06","A12","A13","A14","A15","A16","A23","A24","A25","A26","A34","A35","A36","A45","A46","A56"],"matrices":[{"n":7,"entries":[[0,1,"1","0"],[1,0,"-1","0"]]},{"n":7,"entries":[[0,2,"1","0"],[2,0,"-1","0"]]},{"n":7,"entries":[[0,3,"1","0"],[3,0,"-1","0"]]},{"n":7,"entries":[[0,4,"1","0"],[4,0,"-1","0"]]},{"n":7,"entries":[[0,5,"1","0"],[5,0,"-1","0"]]},{"n":7,"entries":[[0,6,"1","0"],[6,0,"-1","0"]]},{"n":7,"entries":[[1,2,"1","0"],[2,1,"-1","0"]]},{"n":7,"entries":[[1,3,"1","0"],[3,1,"-1","0"]]},{"n":7,"entries":[[1,4,"1","0"],[4,1,"-1","0"]]},{"n":7,"entries":[[1,5,"1","0"],[5,1,"-1","0"]]},{"n":7,"entries":[[1,6,"1","0"],[6,1,"-1","0"]]},{"n":7,"entries":[[2,3,"1","0"],[3,2,"-1","0"]]},{"n":7,"entries":[[2,4,"1","0"],[4,2,"-1","0"]]},{"n":7,"entries":[[2,5,"1","0"],[5,2,"-1","0"]]},{"n":7,"entries":[[2,6,"1","0"],[6,2,"-1","0"]]},{"n":7,"entries":[[3,4,"1","0"],[4,3,"-1","0"]]},{"n":7,"entries":[[3,5,"1","0"],[5,3,"-1","0"]]},{"n":7,"entries":[[3,6,"1","0"],[6,3,"-1","0"]]},{"n":7,"entries":[[4,5,"1","0"],[5,4,"-1","0"]]},{"n":7,"entries":[[4,6,"1","0"],[6,4,"-1","0"]]},{"n":7,"entries":[[5,6,"1","0"],[6,5,"-1","0"]]}],"compactRealForm":true},"structureConstants":[[0,1,6,"-1"],[0,2,7,"-1"],[0,3,8,"-1"],[0,4,9,"-1"],[0,5,10,"-1"],[0,6,1,"1"],[0,7,2,"1"],[0,8,3,"1"],[0,9,4,"1"],[0,10,5,"1"],[1,2,11,"-1"],[1,3,12,"-1"],[1,4,13,"-1"],[1,5,14,"-1"],[1,6,0,"-1"],[1,11,2,"1"],[1,12,3,"1"],[1,13,4,"1"],[1,14,5,"1"],[2,3,15,"-1"],[2,4,16,"-1"],[2,5,17,"-1"],[2,7,0,"-1"],[2,11,1,"-1"],[2,15,3,"1"],[2,16,4,"1"],[2,17,5,"1"],[3,4,18,"-1"],[3,5,19,"-1"],[3,8,0,"-1"],[3,12,1,"-1"],[3,15,2,"-1"],[3,18,4,"1"],[3,19,5,"1"],[4,5,20,"-1"],[4,9,0,"-1"],[4,13,1,"-1"],[4,16,2,"-1"],[4,18,3,"-1"],[4,20,5,"1"],[5,10,0,"-1"],[5,14,1,"-1"],[5,17,2,"-1"],[5,19,3,"-1"],[5,20,4,"-1"],[6,7,11,"-1"],[6,8,12,"-1"],[6,9,13,"-1"],[6,10,14,"-1"],[6,11,7,"1"],[6,12,8,"1"],[6,13,9,"1"],[6,14,10,"1"],[7,8,15,"-1"],[7,9,16,"-1"],[7,10,17,"-1"],[7,11,6,"-1"],[7,15,8,"1"],[7,16,9,"1"],[7,17,10,"1"],[8,9,18,"-1"],[8,10,19,"-1"],[8,12,6,"-1"],[8,15,7,"-1"],[8,18,9,"1"],[8,19,10,"1"],[9,10,20,"-1"],[9,13,6,"-1"],[9,16,7,"-1"],[9,18,8,"-1"],[9,20,10,"1"],[10,14,6,"-1"],[10,17,7,"-1"],[10,19,8,"-1"],[10,20,9,"-1"],[11,12,15,"-1"],[11,13,16,"-1"],[11,14,17,"-1"],[11,15,12,"1"],[11,16,13,"1"],[11,17,14,"1"],[12,13,18,"-1"],[12,14,19,"-1"],[12,15,11,"-1"],[12,18,13,"1"],[12,19,14,"1"],[13,14,20,"-1"],[13,16,11,"-1"],[13,18,12,"-1"],[13,20,14,"1"],[14,17,11,"-1"],[14,19,12,"-1"],[14,20,13,"-1"],[15,16,18,"-1"],[15,17,19,"-1"],[15,18,16,"1"],[15,19,17,"1"],[16,17,20,"-1"],[16,18,15,"-1"],[16,20,17,"1"],[17,19,15,"-1"],[17,20,16,"-1"],[18,19,20,"-1"],[18,20,19,"1"],[19,20,18,"-1"]],"gram":[["1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1"]],"chevalley":{"names":["h1","h2","h3","e(0, 0, 1)","e(0, 1, 0)","e(1, 0, 0)","e(0, 1, 1)","e(1, 1, 0)","e(0, 1, 2)","e(1, 1, 1)","e(1, 1, 2)","e(1, 2, 2)","f(0, 0, 1)","f(0, 1, 0)","f(1, 0, 0)","f(0, 1, 1)","f(1, 1, 0)","f(0, 1, 2)","f(1, 1, 1)","f(1, 1, 2)","f(1, 2, 2)"],"matrices":[{"n":7,"entries":[[0,1,"0","-1"],[1,0,"0","1"],[2,3,"0","1"],[3,2,"0","-1"]]},{"n":7,"entries":[[2,3,"0","-1"],[3,2,"0","1"],[4,5,"0","1"],[5,4,"0","-1"]]},{"n":7,"entries":[[4,5,"0","-2"],[5,4,"0","2"]]},{"n":7,"entries":[[4,6,"1","0"],[5,6,"0","1"],[6,4,"-1","0"],[6,5,"0","-1"]]},{"n":7,"entries":[[2,4,"1/2","0"],[2,5,"0","-1/2"],[3,4,"0","1/2"],[3,5,"1/2","0"],[4,2,"-1/2","0"],[4,3,"0","-1/2"],[5,2,"0","1/2"],[5,3,"-1/2","0"]]},{"n":7,"entries":[[0,2,"1/2","0"],[0,3,"0","-1/2"],[1,2,"0","1/2"],[1,3,"1/2","0"],[2,0,"-1/2","0"],[2,1,"0","-1/2"],[3,0,"0","1/2"],[3,1,"-1/2","0"]]},{"n":7,"entries":[[2,6,"1","0"],[3,6,"0","1"],[6,2,"-1","0"],[6,3,"0","-1"]]},{"n":7,"entries":[[0,4,"1/2","0"],[0,5,"0","-1/2"],[1,4,"0","1/2"],[1,5,"1/2","0"],[4,0,"-1/2","0"],[4,1,"0","-1/2"],[5,0,"0","1/2"],[5,1,"-1/2","0"]]},{"n":7,"entries":[[2,4,"1/2","0"],[2,5,"0","1/2"],[3,4,"0","1/2"],[3,5,"-1/2","0"],[4,2,"-1/2","0"],[4,3,"0","-1/2"],[5,2,"0","-1/2"],[5,3,"1/2","0"]]},{"n":7,"entries":[[0,6,"1","0"],[1,6,"0","1"],[6,0,"-1","0"],[6,1,"0","-1"]]},{"n":7,"entries":[[0,4,"1/2","0"],[0,5,"0","1/2"],[1,4,"0","1/2"],[1,5,"-1/2","0"],[4,0,"-1/2","0"],[4,1,"0","-1/2"],[5,0,"0","-1/2"],[5,1,"1/2","0"]]},{"n":7,"entries":[[0,2,"1/2","0"],[0,3,"0","1/2"],[1,2,"0","1/2"],[1,3,"-1/2","0"],[2,0,"-1/2","0"],[2,1,"0","-1/2"],[3,0,"0","-1/2"],[3,1,"1/2","0"]]},{"n":7,"entries":[[4,6,"-1","0"],[5,6,"0","1"],[6,4,"1","0"],[6,5,"0","-1"]]},{"n":7,"entries":[[2,4,"-1/2","0"],[2,5,"0","-1/2"],[3,4,"0","1/2"],[3,5,"-1/2","0"],[4,2,"1/2","0"],[4,3,"0","-1/2"],[5,2,"0","1/2"],[5,3,"1/2","0"]]},{"n":7,"entries":[[0,2,"-1/2","0"],[0,3,"0","-1/2"],[1,2,"0","1/2"],[1,3,"-1/2","0"],[2,0,"1/2","0"],[2,1,"0","-1/2"],[3,0,"0","1/2"],[3,1,"1/2","0"]]},{"n":7,"entries":[[2,6,"-1","0"],[3,6,"0","1"],[6,2,"1","0"],[6,3,"0","-1"]]},{"n":7,"entries":[[0,4,"-1/2","0"],[0,5,"0","-1/2"],[1,4,"0","1/2"],[1,5,"-1/2","0"],[4,0,"1/2","0"],[4,1,"0","-1/2"],[5,0,"0","1/2"],[5,1,"1/2","0"]]},{"n":7,"entries":[[2,4,"-1/2","0"],[2,5,"0","1/2"],[3,4,"0","1/2"],[3,5,"1/2","0"],[4,2,"1/2","0"],[4,3,"0","-1/2"],[5,2,"0","-1/2"],[5,3,"-1/2","0"]]},{"n":7,"entries":[[0,6,"-1","0"],[1,6,"0","1"],[6,0,"1","0"],[6,1,"0","-1"]]},{"n":7,"entries":[[0,4,"-1/2","0"],[0,5,"0","1/2"],[1,4,"0","1/2"],[1,5,"1/2","0"],[4,0,"1/2","0"],[4,1,"0","-1/2"],[5,0,"0","-1/2"],[5,1,"-1/2","0"]]},{"n":7,"entries":[[0,2,"-1/2","0"],[0,3,"0","1/2"],[1,2,"0","1/2"],[1,3,"1/2","0"],[2,0,"1/2","0"],[2,1,"0","-1/2"],[3,0,"0","-1/2"],[3,1,"-1/2","0"]]}],"structureConstants":[[0,4,4,-1],[0,5,5,2],[0,6,6,-1],[0,7,7,1],[0,8,8,-1],[0,9,9,1],[0,10,10,1],[0,13,13,1],[0,14,14,-2],[0,15,15,1],[0,16,16,-1],[0,17,17,1],[0,18,18,-1],[0,19,19,-1],[1,3,3,-1],[1,4,4,2],[1,5,5,-1],[1,6,6,1],[1,7,7,1],[1,10,10,-1],[1,11,11,1],[1,12,12,1],[1,13,13,-2],[1,14,14,1],[1,15,15,-1],[1,16,16,-1],[1,19,19,1],[1,20,20,-1],[2,3,3,2],[2,4,4,-2],[2,7,7,-2],[2,8,8,2],[2,10,10,2],[2,12,12,-2],[2,13,13,2],[2,16,16,2],[2,17,17,-2],[2,19,19,-2],[3,4,6,-1],[3,6,8,2],[3,7,9,-1],[3,9,10,2],[3,12,2,1],[3,15,13,2],[3,17,15,-1],[3,18,16,2],[3,19,18,-1],[4,5,7,-1],[4,10,11,1],[4,13,1,1],[4,15,12,-1],[4,16,14,1],[4,20,19,-1],[5,6,9,1],[5,8,10,1],[5,14,0,1],[5,16,13,-1],[5,18,15,-1],[5,19,17,-1],[6,9,11,2],[6,12,4,2],[6,13,3,-1],[6,15,1,2],[6,15,2,1],[6,17,12,1],[6,18,14,2],[6,20,18,-1],[7,8,11,-1],[7,13,5,1],[7,14,4,-1],[7,16,0,1],[7,16,1,1],[7,18,12,-1],[7,20,17,1],[8,12,6,-1],[8,15,3,1],[8,17,1,1],[8,17,2,1],[8,19,14,1],[8,20,16,-1],[9,12,7,2],[9,14,6,-1],[9,15,5,2],[9,16,3,-1],[9,18,0,2],[9,18,1,2],[9,18,2,1],[9,19,12,1],[9,20,15,1],[10,12,9,-1],[10,14,8,-1],[10,17,5,1],[10,18,3,1],[10,19,0,1],[10,19,1,1],[10,19,2,1],[10,20,13,1],[11,13,10,-1],[11,15,9,-1],[11,16,8,1],[11,17,7,-1],[11,18,6,1],[11,19,4,1],[11,20,0,1],[11,20,1,2],[11,20,2,1],[12,13,15,1],[12,15,17,-2],[12,16,18,1],[12,18,19,-2],[13,14,16,1],[13,19,20,-1],[14,15,18,-1],[14,17,19,-1],[15,18,20,-2],[16,17,20,1]],"compactToChevalley":[[["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1/2"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","-1/2"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","1/2"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","0"],["0","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","-1/2"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","-1/2"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","1/2"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["-1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","0"],["0","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","-1/2"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["-1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]]],"simpleGeneratorCount":3,"fullBasisCount":21,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":7,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"],[2,3,"-1/2","0"],[3,2,"1/2","0"]]},{"n":7,"entries":[[0,2,"-1/2","0"],[1,3,"1/2","0"],[2,0,"1/2","0"],[3,1,"-1/2","0"]]},{"n":7,"entries":[[0,3,"-1/2","0"],[1,2,"-1/2","0"],[2,1,"1/2","0"],[3,0,"1/2","0"]]}],"compactCoordinates":[["-1/2","0","0","0","0","0","0","0","0","0","0","-1/2","0","0","0","0","0","0","0","0","0"],["0","-1/2","0","0","0","0","0","1/2","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","-1/2","0","0","0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":21,"gramPositiveLDL":["1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1"],"bracketPairs":210,"jacobiDistinctTriples":1330,"jacobiFullOrderedTriples":9261,"adInvariantMetricOrderedTriples":9261,"chevalleyIntegralBracketPairs":210,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED"},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":7,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"],[2,3,"-1/2","0"],[3,2,"1/2","0"]]},{"n":7,"entries":[[0,2,"-1/2","0"],[1,3,"1/2","0"],[2,0,"1/2","0"],[3,1,"-1/2","0"]]},{"n":7,"entries":[[0,3,"-1/2","0"],[1,2,"-1/2","0"],[2,1,"1/2","0"],[3,0,"1/2","0"]]}],"compactCoordinates":[["-1/2","0","0","0","0","0","0","0","0","0","0","-1/2","0","0","0","0","0","0","0","0","0"],["0","-1/2","0","0","0","0","0","1/2","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","-1/2","0","0","0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"}],"dataSha256":"b10aa5a6f4a922f95bf0e1e7ec006fdee8d44a9d4c98260e4171bfb649d29fc0"},{"id":"SO8","family":"SO","parameter":8,"name":"SO(8)","rank":4,"dimension":28,"matrixDimension":8,"globalForm":{"form":"QUOTIENT","cover":"Spin(8) (not the stored matrix group)","kernel":["+1","-1"],"description":"Actual faithful SO(8) vector group. Spin(8) is only the specified universal cover."},"center":{"order":2,"generators":["-I"],"representationDescendsToAdjoint":false},"representation":{"kind":"MATRIX","name":"defining real matrices","dimension":8,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1/2","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1/2) Re Tr(XY)"},"rootDatum":{"type":"D","rank":4,"cartan":[[2,-1,0,0],[-1,2,-1,-1],[0,-1,2,0],[0,-1,0,2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"integer rotation characters e_i","cocharacterBasis":"integer 2pi rotations e_i","pairing":[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],"simpleRootCharacters":[[1,-1,0,0],[0,1,-1,0],[0,0,1,-1],[0,0,1,1]],"simpleCorootCocharacters":[[1,-1,0,0],[0,1,-1,0],[0,0,1,-1],[0,0,1,1]],"roots":[{"simple":[-1,-2,-1,-1],"corootSimple":[-1,-2,-1,-1],"character":[-1,-1,0,0],"cocharacter":[-1,-1,0,0],"lengthSquared":"2"},{"simple":[-1,-1,-1,-1],"corootSimple":[-1,-1,-1,-1],"character":[-1,0,-1,0],"cocharacter":[-1,0,-1,0],"lengthSquared":"2"},{"simple":[-1,-1,-1,0],"corootSimple":[-1,-1,-1,0],"character":[-1,0,0,1],"cocharacter":[-1,0,0,1],"lengthSquared":"2"},{"simple":[-1,-1,0,-1],"corootSimple":[-1,-1,0,-1],"character":[-1,0,0,-1],"cocharacter":[-1,0,0,-1],"lengthSquared":"2"},{"simple":[-1,-1,0,0],"corootSimple":[-1,-1,0,0],"character":[-1,0,1,0],"cocharacter":[-1,0,1,0],"lengthSquared":"2"},{"simple":[-1,0,0,0],"corootSimple":[-1,0,0,0],"character":[-1,1,0,0],"cocharacter":[-1,1,0,0],"lengthSquared":"2"},{"simple":[0,-1,-1,-1],"corootSimple":[0,-1,-1,-1],"character":[0,-1,-1,0],"cocharacter":[0,-1,-1,0],"lengthSquared":"2"},{"simple":[0,-1,-1,0],"corootSimple":[0,-1,-1,0],"character":[0,-1,0,1],"cocharacter":[0,-1,0,1],"lengthSquared":"2"},{"simple":[0,-1,0,-1],"corootSimple":[0,-1,0,-1],"character":[0,-1,0,-1],"cocharacter":[0,-1,0,-1],"lengthSquared":"2"},{"simple":[0,-1,0,0],"corootSimple":[0,-1,0,0],"character":[0,-1,1,0],"cocharacter":[0,-1,1,0],"lengthSquared":"2"},{"simple":[0,0,-1,0],"corootSimple":[0,0,-1,0],"character":[0,0,-1,1],"cocharacter":[0,0,-1,1],"lengthSquared":"2"},{"simple":[0,0,0,-1],"corootSimple":[0,0,0,-1],"character":[0,0,-1,-1],"cocharacter":[0,0,-1,-1],"lengthSquared":"2"},{"simple":[0,0,0,1],"corootSimple":[0,0,0,1],"character":[0,0,1,1],"cocharacter":[0,0,1,1],"lengthSquared":"2"},{"simple":[0,0,1,0],"corootSimple":[0,0,1,0],"character":[0,0,1,-1],"cocharacter":[0,0,1,-1],"lengthSquared":"2"},{"simple":[0,1,0,0],"corootSimple":[0,1,0,0],"character":[0,1,-1,0],"cocharacter":[0,1,-1,0],"lengthSquared":"2"},{"simple":[0,1,0,1],"corootSimple":[0,1,0,1],"character":[0,1,0,1],"cocharacter":[0,1,0,1],"lengthSquared":"2"},{"simple":[0,1,1,0],"corootSimple":[0,1,1,0],"character":[0,1,0,-1],"cocharacter":[0,1,0,-1],"lengthSquared":"2"},{"simple":[0,1,1,1],"corootSimple":[0,1,1,1],"character":[0,1,1,0],"cocharacter":[0,1,1,0],"lengthSquared":"2"},{"simple":[1,0,0,0],"corootSimple":[1,0,0,0],"character":[1,-1,0,0],"cocharacter":[1,-1,0,0],"lengthSquared":"2"},{"simple":[1,1,0,0],"corootSimple":[1,1,0,0],"character":[1,0,-1,0],"cocharacter":[1,0,-1,0],"lengthSquared":"2"},{"simple":[1,1,0,1],"corootSimple":[1,1,0,1],"character":[1,0,0,1],"cocharacter":[1,0,0,1],"lengthSquared":"2"},{"simple":[1,1,1,0],"corootSimple":[1,1,1,0],"character":[1,0,0,-1],"cocharacter":[1,0,0,-1],"lengthSquared":"2"},{"simple":[1,1,1,1],"corootSimple":[1,1,1,1],"character":[1,0,1,0],"cocharacter":[1,0,1,0],"lengthSquared":"2"},{"simple":[1,2,1,1],"corootSimple":[1,2,1,1],"character":[1,1,0,0],"cocharacter":[1,1,0,0],"lengthSquared":"2"}]},"basis":{"names":["A01","A02","A03","A04","A05","A06","A07","A12","A13","A14","A15","A16","A17","A23","A24","A25","A26","A27","A34","A35","A36","A37","A45","A46","A47","A56","A57","A67"],"matrices":[{"n":8,"entries":[[0,1,"1","0"],[1,0,"-1","0"]]},{"n":8,"entries":[[0,2,"1","0"],[2,0,"-1","0"]]},{"n":8,"entries":[[0,3,"1","0"],[3,0,"-1","0"]]},{"n":8,"entries":[[0,4,"1","0"],[4,0,"-1","0"]]},{"n":8,"entries":[[0,5,"1","0"],[5,0,"-1","0"]]},{"n":8,"entries":[[0,6,"1","0"],[6,0,"-1","0"]]},{"n":8,"entries":[[0,7,"1","0"],[7,0,"-1","0"]]},{"n":8,"entries":[[1,2,"1","0"],[2,1,"-1","0"]]},{"n":8,"entries":[[1,3,"1","0"],[3,1,"-1","0"]]},{"n":8,"entries":[[1,4,"1","0"],[4,1,"-1","0"]]},{"n":8,"entries":[[1,5,"1","0"],[5,1,"-1","0"]]},{"n":8,"entries":[[1,6,"1","0"],[6,1,"-1","0"]]},{"n":8,"entries":[[1,7,"1","0"],[7,1,"-1","0"]]},{"n":8,"entries":[[2,3,"1","0"],[3,2,"-1","0"]]},{"n":8,"entries":[[2,4,"1","0"],[4,2,"-1","0"]]},{"n":8,"entries":[[2,5,"1","0"],[5,2,"-1","0"]]},{"n":8,"entries":[[2,6,"1","0"],[6,2,"-1","0"]]},{"n":8,"entries":[[2,7,"1","0"],[7,2,"-1","0"]]},{"n":8,"entries":[[3,4,"1","0"],[4,3,"-1","0"]]},{"n":8,"entries":[[3,5,"1","0"],[5,3,"-1","0"]]},{"n":8,"entries":[[3,6,"1","0"],[6,3,"-1","0"]]},{"n":8,"entries":[[3,7,"1","0"],[7,3,"-1","0"]]},{"n":8,"entries":[[4,5,"1","0"],[5,4,"-1","0"]]},{"n":8,"entries":[[4,6,"1","0"],[6,4,"-1","0"]]},{"n":8,"entries":[[4,7,"1","0"],[7,4,"-1","0"]]},{"n":8,"entries":[[5,6,"1","0"],[6,5,"-1","0"]]},{"n":8,"entries":[[5,7,"1","0"],[7,5,"-1","0"]]},{"n":8,"entries":[[6,7,"1","0"],[7,6,"-1","0"]]}],"compactRealForm":true},"structureConstants":[[0,1,7,"-1"],[0,2,8,"-1"],[0,3,9,"-1"],[0,4,10,"-1"],[0,5,11,"-1"],[0,6,12,"-1"],[0,7,1,"1"],[0,8,2,"1"],[0,9,3,"1"],[0,10,4,"1"],[0,11,5,"1"],[0,12,6,"1"],[1,2,13,"-1"],[1,3,14,"-1"],[1,4,15,"-1"],[1,5,16,"-1"],[1,6,17,"-1"],[1,7,0,"-1"],[1,13,2,"1"],[1,14,3,"1"],[1,15,4,"1"],[1,16,5,"1"],[1,17,6,"1"],[2,3,18,"-1"],[2,4,19,"-1"],[2,5,20,"-1"],[2,6,21,"-1"],[2,8,0,"-1"],[2,13,1,"-1"],[2,18,3,"1"],[2,19,4,"1"],[2,20,5,"1"],[2,21,6,"1"],[3,4,22,"-1"],[3,5,23,"-1"],[3,6,24,"-1"],[3,9,0,"-1"],[3,14,1,"-1"],[3,18,2,"-1"],[3,22,4,"1"],[3,23,5,"1"],[3,24,6,"1"],[4,5,25,"-1"],[4,6,26,"-1"],[4,10,0,"-1"],[4,15,1,"-1"],[4,19,2,"-1"],[4,22,3,"-1"],[4,25,5,"1"],[4,26,6,"1"],[5,6,27,"-1"],[5,11,0,"-1"],[5,16,1,"-1"],[5,20,2,"-1"],[5,23,3,"-1"],[5,25,4,"-1"],[5,27,6,"1"],[6,12,0,"-1"],[6,17,1,"-1"],[6,21,2,"-1"],[6,24,3,"-1"],[6,26,4,"-1"],[6,27,5,"-1"],[7,8,13,"-1"],[7,9,14,"-1"],[7,10,15,"-1"],[7,11,16,"-1"],[7,12,17,"-1"],[7,13,8,"1"],[7,14,9,"1"],[7,15,10,"1"],[7,16,11,"1"],[7,17,12,"1"],[8,9,18,"-1"],[8,10,19,"-1"],[8,11,20,"-1"],[8,12,21,"-1"],[8,13,7,"-1"],[8,18,9,"1"],[8,19,10,"1"],[8,20,11,"1"],[8,21,12,"1"],[9,10,22,"-1"],[9,11,23,"-1"],[9,12,24,"-1"],[9,14,7,"-1"],[9,18,8,"-1"],[9,22,10,"1"],[9,23,11,"1"],[9,24,12,"1"],[10,11,25,"-1"],[10,12,26,"-1"],[10,15,7,"-1"],[10,19,8,"-1"],[10,22,9,"-1"],[10,25,11,"1"],[10,26,12,"1"],[11,12,27,"-1"],[11,16,7,"-1"],[11,20,8,"-1"],[11,23,9,"-1"],[11,25,10,"-1"],[11,27,12,"1"],[12,17,7,"-1"],[12,21,8,"-1"],[12,24,9,"-1"],[12,26,10,"-1"],[12,27,11,"-1"],[13,14,18,"-1"],[13,15,19,"-1"],[13,16,20,"-1"],[13,17,21,"-1"],[13,18,14,"1"],[13,19,15,"1"],[13,20,16,"1"],[13,21,17,"1"],[14,15,22,"-1"],[14,16,23,"-1"],[14,17,24,"-1"],[14,18,13,"-1"],[14,22,15,"1"],[14,23,16,"1"],[14,24,17,"1"],[15,16,25,"-1"],[15,17,26,"-1"],[15,19,13,"-1"],[15,22,14,"-1"],[15,25,16,"1"],[15,26,17,"1"],[16,17,27,"-1"],[16,20,13,"-1"],[16,23,14,"-1"],[16,25,15,"-1"],[16,27,17,"1"],[17,21,13,"-1"],[17,24,14,"-1"],[17,26,15,"-1"],[17,27,16,"-1"],[18,19,22,"-1"],[18,20,23,"-1"],[18,21,24,"-1"],[18,22,19,"1"],[18,23,20,"1"],[18,24,21,"1"],[19,20,25,"-1"],[19,21,26,"-1"],[19,22,18,"-1"],[19,25,20,"1"],[19,26,21,"1"],[20,21,27,"-1"],[20,23,18,"-1"],[20,25,19,"-1"],[20,27,21,"1"],[21,24,18,"-1"],[21,26,19,"-1"],[21,27,20,"-1"],[22,23,25,"-1"],[22,24,26,"-1"],[22,25,23,"1"],[22,26,24,"1"],[23,24,27,"-1"],[23,25,22,"-1"],[23,27,24,"1"],[24,26,22,"-1"],[24,27,23,"-1"],[25,26,27,"-1"],[25,27,26,"1"],[26,27,25,"-1"]],"gram":[["1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","1"]],"chevalley":{"names":["h1","h2","h3","h4","e(0, 0, 0, 1)","e(0, 0, 1, 0)","e(0, 1, 0, 0)","e(1, 0, 0, 0)","e(0, 1, 0, 1)","e(0, 1, 1, 0)","e(1, 1, 0, 0)","e(0, 1, 1, 1)","e(1, 1, 0, 1)","e(1, 1, 1, 0)","e(1, 1, 1, 1)","e(1, 2, 1, 1)","f(0, 0, 0, 1)","f(0, 0, 1, 0)","f(0, 1, 0, 0)","f(1, 0, 0, 0)","f(0, 1, 0, 1)","f(0, 1, 1, 0)","f(1, 1, 0, 0)","f(0, 1, 1, 1)","f(1, 1, 0, 1)","f(1, 1, 1, 0)","f(1, 1, 1, 1)","f(1, 2, 1, 1)"],"matrices":[{"n":8,"entries":[[0,1,"0","-1"],[1,0,"0","1"],[2,3,"0","1"],[3,2,"0","-1"]]},{"n":8,"entries":[[2,3,"0","-1"],[3,2,"0","1"],[4,5,"0","1"],[5,4,"0","-1"]]},{"n":8,"entries":[[4,5,"0","-1"],[5,4,"0","1"],[6,7,"0","1"],[7,6,"0","-1"]]},{"n":8,"entries":[[4,5,"0","-1"],[5,4,"0","1"],[6,7,"0","-1"],[7,6,"0","1"]]},{"n":8,"entries":[[4,6,"1/2","0"],[4,7,"0","1/2"],[5,6,"0","1/2"],[5,7,"-1/2","0"],[6,4,"-1/2","0"],[6,5,"0","-1/2"],[7,4,"0","-1/2"],[7,5,"1/2","0"]]},{"n":8,"entries":[[4,6,"1/2","0"],[4,7,"0","-1/2"],[5,6,"0","1/2"],[5,7,"1/2","0"],[6,4,"-1/2","0"],[6,5,"0","-1/2"],[7,4,"0","1/2"],[7,5,"-1/2","0"]]},{"n":8,"entries":[[2,4,"1/2","0"],[2,5,"0","-1/2"],[3,4,"0","1/2"],[3,5,"1/2","0"],[4,2,"-1/2","0"],[4,3,"0","-1/2"],[5,2,"0","1/2"],[5,3,"-1/2","0"]]},{"n":8,"entries":[[0,2,"1/2","0"],[0,3,"0","-1/2"],[1,2,"0","1/2"],[1,3,"1/2","0"],[2,0,"-1/2","0"],[2,1,"0","-1/2"],[3,0,"0","1/2"],[3,1,"-1/2","0"]]},{"n":8,"entries":[[2,6,"1/2","0"],[2,7,"0","1/2"],[3,6,"0","1/2"],[3,7,"-1/2","0"],[6,2,"-1/2","0"],[6,3,"0","-1/2"],[7,2,"0","-1/2"],[7,3,"1/2","0"]]},{"n":8,"entries":[[2,6,"1/2","0"],[2,7,"0","-1/2"],[3,6,"0","1/2"],[3,7,"1/2","0"],[6,2,"-1/2","0"],[6,3,"0","-1/2"],[7,2,"0","1/2"],[7,3,"-1/2","0"]]},{"n":8,"entries":[[0,4,"1/2","0"],[0,5,"0","-1/2"],[1,4,"0","1/2"],[1,5,"1/2","0"],[4,0,"-1/2","0"],[4,1,"0","-1/2"],[5,0,"0","1/2"],[5,1,"-1/2","0"]]},{"n":8,"entries":[[2,4,"1/2","0"],[2,5,"0","1/2"],[3,4,"0","1/2"],[3,5,"-1/2","0"],[4,2,"-1/2","0"],[4,3,"0","-1/2"],[5,2,"0","-1/2"],[5,3,"1/2","0"]]},{"n":8,"entries":[[0,6,"1/2","0"],[0,7,"0","1/2"],[1,6,"0","1/2"],[1,7,"-1/2","0"],[6,0,"-1/2","0"],[6,1,"0","-1/2"],[7,0,"0","-1/2"],[7,1,"1/2","0"]]},{"n":8,"entries":[[0,6,"1/2","0"],[0,7,"0","-1/2"],[1,6,"0","1/2"],[1,7,"1/2","0"],[6,0,"-1/2","0"],[6,1,"0","-1/2"],[7,0,"0","1/2"],[7,1,"-1/2","0"]]},{"n":8,"entries":[[0,4,"1/2","0"],[0,5,"0","1/2"],[1,4,"0","1/2"],[1,5,"-1/2","0"],[4,0,"-1/2","0"],[4,1,"0","-1/2"],[5,0,"0","-1/2"],[5,1,"1/2","0"]]},{"n":8,"entries":[[0,2,"1/2","0"],[0,3,"0","1/2"],[1,2,"0","1/2"],[1,3,"-1/2","0"],[2,0,"-1/2","0"],[2,1,"0","-1/2"],[3,0,"0","-1/2"],[3,1,"1/2","0"]]},{"n":8,"entries":[[4,6,"-1/2","0"],[4,7,"0","1/2"],[5,6,"0","1/2"],[5,7,"1/2","0"],[6,4,"1/2","0"],[6,5,"0","-1/2"],[7,4,"0","-1/2"],[7,5,"-1/2","0"]]},{"n":8,"entries":[[4,6,"-1/2","0"],[4,7,"0","-1/2"],[5,6,"0","1/2"],[5,7,"-1/2","0"],[6,4,"1/2","0"],[6,5,"0","-1/2"],[7,4,"0","1/2"],[7,5,"1/2","0"]]},{"n":8,"entries":[[2,4,"-1/2","0"],[2,5,"0","-1/2"],[3,4,"0","1/2"],[3,5,"-1/2","0"],[4,2,"1/2","0"],[4,3,"0","-1/2"],[5,2,"0","1/2"],[5,3,"1/2","0"]]},{"n":8,"entries":[[0,2,"-1/2","0"],[0,3,"0","-1/2"],[1,2,"0","1/2"],[1,3,"-1/2","0"],[2,0,"1/2","0"],[2,1,"0","-1/2"],[3,0,"0","1/2"],[3,1,"1/2","0"]]},{"n":8,"entries":[[2,6,"-1/2","0"],[2,7,"0","1/2"],[3,6,"0","1/2"],[3,7,"1/2","0"],[6,2,"1/2","0"],[6,3,"0","-1/2"],[7,2,"0","-1/2"],[7,3,"-1/2","0"]]},{"n":8,"entries":[[2,6,"-1/2","0"],[2,7,"0","-1/2"],[3,6,"0","1/2"],[3,7,"-1/2","0"],[6,2,"1/2","0"],[6,3,"0","-1/2"],[7,2,"0","1/2"],[7,3,"1/2","0"]]},{"n":8,"entries":[[0,4,"-1/2","0"],[0,5,"0","-1/2"],[1,4,"0","1/2"],[1,5,"-1/2","0"],[4,0,"1/2","0"],[4,1,"0","-1/2"],[5,0,"0","1/2"],[5,1,"1/2","0"]]},{"n":8,"entries":[[2,4,"-1/2","0"],[2,5,"0","1/2"],[3,4,"0","1/2"],[3,5,"1/2","0"],[4,2,"1/2","0"],[4,3,"0","-1/2"],[5,2,"0","-1/2"],[5,3,"-1/2","0"]]},{"n":8,"entries":[[0,6,"-1/2","0"],[0,7,"0","1/2"],[1,6,"0","1/2"],[1,7,"1/2","0"],[6,0,"1/2","0"],[6,1,"0","-1/2"],[7,0,"0","-1/2"],[7,1,"-1/2","0"]]},{"n":8,"entries":[[0,6,"-1/2","0"],[0,7,"0","-1/2"],[1,6,"0","1/2"],[1,7,"-1/2","0"],[6,0,"1/2","0"],[6,1,"0","-1/2"],[7,0,"0","1/2"],[7,1,"1/2","0"]]},{"n":8,"entries":[[0,4,"-1/2","0"],[0,5,"0","1/2"],[1,4,"0","1/2"],[1,5,"1/2","0"],[4,0,"1/2","0"],[4,1,"0","-1/2"],[5,0,"0","-1/2"],[5,1,"-1/2","0"]]},{"n":8,"entries":[[0,2,"-1/2","0"],[0,3,"0","1/2"],[1,2,"0","1/2"],[1,3,"1/2","0"],[2,0,"1/2","0"],[2,1,"0","-1/2"],[3,0,"0","-1/2"],[3,1,"-1/2","0"]]}],"structureConstants":[[0,6,6,-1],[0,7,7,2],[0,8,8,-1],[0,9,9,-1],[0,10,10,1],[0,11,11,-1],[0,12,12,1],[0,13,13,1],[0,14,14,1],[0,18,18,1],[0,19,19,-2],[0,20,20,1],[0,21,21,1],[0,22,22,-1],[0,23,23,1],[0,24,24,-1],[0,25,25,-1],[0,26,26,-1],[1,4,4,-1],[1,5,5,-1],[1,6,6,2],[1,7,7,-1],[1,8,8,1],[1,9,9,1],[1,10,10,1],[1,14,14,-1],[1,15,15,1],[1,16,16,1],[1,17,17,1],[1,18,18,-2],[1,19,19,1],[1,20,20,-1],[1,21,21,-1],[1,22,22,-1],[1,26,26,1],[1,27,27,-1],[2,5,5,2],[2,6,6,-1],[2,8,8,-1],[2,9,9,1],[2,10,10,-1],[2,11,11,1],[2,12,12,-1],[2,13,13,1],[2,14,14,1],[2,17,17,-2],[2,18,18,1],[2,20,20,1],[2,21,21,-1],[2,22,22,1],[2,23,23,-1],[2,24,24,1],[2,25,25,-1],[2,26,26,-1],[3,4,4,2],[3,6,6,-1],[3,8,8,1],[3,9,9,-1],[3,10,10,-1],[3,11,11,1],[3,12,12,1],[3,13,13,-1],[3,14,14,1],[3,16,16,-2],[3,18,18,1],[3,20,20,-1],[3,21,21,1],[3,22,22,1],[3,23,23,-1],[3,24,24,-1],[3,25,25,1],[3,26,26,-1],[4,6,8,-1],[4,9,11,1],[4,10,12,-1],[4,13,14,1],[4,16,3,1],[4,20,18,1],[4,23,21,-1],[4,24,22,1],[4,26,25,-1],[5,6,9,-1],[5,8,11,1],[5,10,13,-1],[5,12,14,1],[5,17,2,1],[5,21,18,1],[5,23,20,-1],[5,25,22,1],[5,26,24,-1],[6,7,10,-1],[6,14,15,1],[6,18,1,1],[6,20,16,-1],[6,21,17,-1],[6,22,19,1],[6,27,26,-1],[7,8,12,1],[7,9,13,1],[7,11,14,1],[7,19,0,1],[7,22,18,-1],[7,24,20,-1],[7,25,21,-1],[7,26,23,-1],[8,13,15,1],[8,16,6,1],[8,18,4,-1],[8,20,1,1],[8,20,3,1],[8,23,17,1],[8,24,19,1],[8,27,25,-1],[9,12,15,1],[9,17,6,1],[9,18,5,-1],[9,21,1,1],[9,21,2,1],[9,23,16,1],[9,25,19,1],[9,27,24,-1],[10,11,15,-1],[10,18,7,1],[10,19,6,-1],[10,22,0,1],[10,22,1,1],[10,24,16,-1],[10,25,17,-1],[10,27,23,1],[11,16,9,-1],[11,17,8,-1],[11,20,5,1],[11,21,4,1],[11,23,1,1],[11,23,2,1],[11,23,3,1],[11,26,19,1],[11,27,22,-1],[12,16,10,1],[12,19,8,-1],[12,20,7,1],[12,22,4,-1],[12,24,0,1],[12,24,1,1],[12,24,3,1],[12,26,17,1],[12,27,21,1],[13,17,10,1],[13,19,9,-1],[13,21,7,1],[13,22,5,-1],[13,25,0,1],[13,25,1,1],[13,25,2,1],[13,26,16,1],[13,27,20,1],[14,16,13,-1],[14,17,12,-1],[14,19,11,-1],[14,23,7,1],[14,24,5,1],[14,25,4,1],[14,26,0,1],[14,26,1,1],[14,26,2,1],[14,26,3,1],[14,27,18,1],[15,18,14,-1],[15,20,13,-1],[15,21,12,-1],[15,22,11,1],[15,23,10,-1],[15,24,9,1],[15,25,8,1],[15,26,6,1],[15,27,0,1],[15,27,1,2],[15,27,2,1],[15,27,3,1],[16,18,20,1],[16,21,23,-1],[16,22,24,1],[16,25,26,-1],[17,18,21,1],[17,20,23,-1],[17,22,25,1],[17,24,26,-1],[18,19,22,1],[18,26,27,-1],[19,20,24,-1],[19,21,25,-1],[19,23,26,-1],[20,25,27,-1],[21,24,27,-1],[22,23,27,1]],"compactToChevalley":[[["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"]],[["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1/2"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","-1/2"],["0","-1/2"],["-1/2","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","1/2"],["0","-1/2"],["1/2","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","-1/2"],["0","-1/2"],["1/2","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","1/2"],["0","-1/2"],["-1/2","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["-1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["-1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["-1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["-1/2","0"],["0","-1/2"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1/2"],["1/2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]]],"simpleGeneratorCount":4,"fullBasisCount":28,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":8,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"],[2,3,"-1/2","0"],[3,2,"1/2","0"]]},{"n":8,"entries":[[0,2,"-1/2","0"],[1,3,"1/2","0"],[2,0,"1/2","0"],[3,1,"-1/2","0"]]},{"n":8,"entries":[[0,3,"-1/2","0"],[1,2,"-1/2","0"],[2,1,"1/2","0"],[3,0,"1/2","0"]]}],"compactCoordinates":[["-1/2","0","0","0","0","0","0","0","0","0","0","0","0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","-1/2","0","0","0","0","0","0","1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","-1/2","0","0","0","0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":28,"gramPositiveLDL":["1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1"],"bracketPairs":378,"jacobiDistinctTriples":3276,"jacobiFullOrderedTriples":21952,"adInvariantMetricOrderedTriples":21952,"chevalleyIntegralBracketPairs":378,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED"},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":8,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"],[2,3,"-1/2","0"],[3,2,"1/2","0"]]},{"n":8,"entries":[[0,2,"-1/2","0"],[1,3,"1/2","0"],[2,0,"1/2","0"],[3,1,"-1/2","0"]]},{"n":8,"entries":[[0,3,"-1/2","0"],[1,2,"-1/2","0"],[2,1,"1/2","0"],[3,0,"1/2","0"]]}],"compactCoordinates":[["-1/2","0","0","0","0","0","0","0","0","0","0","0","0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","-1/2","0","0","0","0","0","0","1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","-1/2","0","0","0","0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"}],"dataSha256":"512ee6810ae267a0dd17b3b25b4f98e1dc7adb9525fc78b33c023aa701de8623"},{"id":"Sp1","family":"Sp","parameter":1,"name":"Sp(1)","rank":1,"dimension":3,"matrixDimension":2,"globalForm":{"form":"SIMPLY_CONNECTED","cover":"Sp(1)","kernel":["1"],"description":"Actual compact USp(2), not split Sp(2, R); center +/-I."},"center":{"order":2,"generators":["-I"],"representationDescendsToAdjoint":false},"representation":{"kind":"MATRIX","name":"compact defining complex matrices","dimension":2,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1) Re Tr(XY)"},"rootDatum":{"type":"C","rank":1,"cartan":[[2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"fundamental weights omega_i","cocharacterBasis":"simple coroots alpha_i^vee","pairing":[[1]],"simpleRootCharacters":[[2]],"simpleCorootCocharacters":[[1]],"roots":[{"simple":[-1],"corootSimple":[-1],"character":[-2],"cocharacter":[-1],"lengthSquared":"2"},{"simple":[1],"corootSimple":[1],"character":[2],"cocharacter":[1],"lengthSquared":"2"}]},"basis":{"names":["aH0","bR00","bI00"],"matrices":[{"n":2,"entries":[[0,0,"0","1"],[1,1,"0","-1"]]},{"n":2,"entries":[[0,1,"1","0"],[1,0,"-1","0"]]},{"n":2,"entries":[[0,1,"0","1"],[1,0,"0","1"]]}],"compactRealForm":true},"structureConstants":[[0,1,2,"2"],[0,2,1,"-2"],[1,2,0,"2"]],"gram":[["2","0","0"],["0","2","0"],["0","0","2"]],"chevalley":{"names":["h1","e(1,)","f(1,)"],"matrices":[{"n":2,"entries":[[0,0,"1","0"],[1,1,"-1","0"]]},{"n":2,"entries":[[0,1,"1","0"]]},{"n":2,"entries":[[1,0,"1","0"]]}],"structureConstants":[[0,1,1,2],[0,2,2,-2],[1,2,0,1]],"compactToChevalley":[[["0","1"],["0","0"],["0","0"]],[["0","0"],["1","0"],["0","1"]],[["0","0"],["-1","0"],["0","1"]]],"simpleGeneratorCount":1,"fullBasisCount":3,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":2,"entries":[[0,1,"0","-1/2"],[1,0,"0","-1/2"]]},{"n":2,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"]]},{"n":2,"entries":[[0,0,"0","-1/2"],[1,1,"0","1/2"]]}],"compactCoordinates":[["0","0","-1/2"],["0","-1/2","0"],["-1/2","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":3,"gramPositiveLDL":["2","2","2"],"bracketPairs":3,"jacobiDistinctTriples":1,"jacobiFullOrderedTriples":27,"adInvariantMetricOrderedTriples":27,"chevalleyIntegralBracketPairs":3,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED"},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":2,"entries":[[0,1,"0","-1/2"],[1,0,"0","-1/2"]]},{"n":2,"entries":[[0,1,"-1/2","0"],[1,0,"1/2","0"]]},{"n":2,"entries":[[0,0,"0","-1/2"],[1,1,"0","1/2"]]}],"compactCoordinates":[["0","0","-1/2"],["0","-1/2","0"],["-1/2","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"}],"dataSha256":"3c983095ee18bc57a73d0b5d55707d334463815ab0cdfb926fc9e4e6cd5a880c"},{"id":"Sp2","family":"Sp","parameter":2,"name":"Sp(2)","rank":2,"dimension":10,"matrixDimension":4,"globalForm":{"form":"SIMPLY_CONNECTED","cover":"Sp(2)","kernel":["1"],"description":"Actual compact USp(4), not split Sp(4, R); center +/-I."},"center":{"order":2,"generators":["-I"],"representationDescendsToAdjoint":false},"representation":{"kind":"MATRIX","name":"compact defining complex matrices","dimension":4,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1) Re Tr(XY)"},"rootDatum":{"type":"C","rank":2,"cartan":[[2,-2],[-1,2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"fundamental weights omega_i","cocharacterBasis":"simple coroots alpha_i^vee","pairing":[[1,0],[0,1]],"simpleRootCharacters":[[2,-1],[-2,2]],"simpleCorootCocharacters":[[1,0],[0,1]],"roots":[{"simple":[-2,-1],"corootSimple":[-1,-1],"character":[-2,0],"cocharacter":[-1,-1],"lengthSquared":"2"},{"simple":[-1,-1],"corootSimple":[-1,-2],"character":[0,-1],"cocharacter":[-1,-2],"lengthSquared":"1"},{"simple":[-1,0],"corootSimple":[-1,0],"character":[-2,1],"cocharacter":[-1,0],"lengthSquared":"1"},{"simple":[0,-1],"corootSimple":[0,-1],"character":[2,-2],"cocharacter":[0,-1],"lengthSquared":"2"},{"simple":[0,1],"corootSimple":[0,1],"character":[-2,2],"cocharacter":[0,1],"lengthSquared":"2"},{"simple":[1,0],"corootSimple":[1,0],"character":[2,-1],"cocharacter":[1,0],"lengthSquared":"1"},{"simple":[1,1],"corootSimple":[1,2],"character":[0,1],"cocharacter":[1,2],"lengthSquared":"1"},{"simple":[2,1],"corootSimple":[1,1],"character":[2,0],"cocharacter":[1,1],"lengthSquared":"2"}]},"basis":{"names":["aA01","aB01","aH0","aH1","bR00","bI00","bR01","bI01","bR11","bI11"],"matrices":[{"n":4,"entries":[[0,1,"1","0"],[1,0,"-1","0"],[2,3,"1","0"],[3,2,"-1","0"]]},{"n":4,"entries":[[0,1,"0","1"],[1,0,"0","1"],[2,3,"0","-1"],[3,2,"0","-1"]]},{"n":4,"entries":[[0,0,"0","1"],[2,2,"0","-1"]]},{"n":4,"entries":[[1,1,"0","1"],[3,3,"0","-1"]]},{"n":4,"entries":[[0,2,"1","0"],[2,0,"-1","0"]]},{"n":4,"entries":[[0,2,"0","1"],[2,0,"0","1"]]},{"n":4,"entries":[[0,3,"1","0"],[1,2,"1","0"],[2,1,"-1","0"],[3,0,"-1","0"]]},{"n":4,"entries":[[0,3,"0","1"],[1,2,"0","1"],[2,1,"0","1"],[3,0,"0","1"]]},{"n":4,"entries":[[1,3,"1","0"],[3,1,"-1","0"]]},{"n":4,"entries":[[1,3,"0","1"],[3,1,"0","1"]]}],"compactRealForm":true},"structureConstants":[[0,1,2,"2"],[0,1,3,"-2"],[0,2,1,"-1"],[0,3,1,"1"],[0,4,6,"-1"],[0,5,7,"-1"],[0,6,4,"2"],[0,6,8,"-2"],[0,7,5,"2"],[0,7,9,"-2"],[0,8,6,"1"],[0,9,7,"1"],[1,2,0,"1"],[1,3,0,"-1"],[1,4,7,"1"],[1,5,6,"-1"],[1,6,5,"2"],[1,6,9,"2"],[1,7,4,"-2"],[1,7,8,"-2"],[1,8,7,"1"],[1,9,6,"-1"],[2,4,5,"2"],[2,5,4,"-2"],[2,6,7,"1"],[2,7,6,"-1"],[3,6,7,"1"],[3,7,6,"-1"],[3,8,9,"2"],[3,9,8,"-2"],[4,5,2,"2"],[4,6,0,"-1"],[4,7,1,"1"],[5,6,1,"-1"],[5,7,0,"-1"],[6,7,2,"2"],[6,7,3,"2"],[6,8,0,"-1"],[6,9,1,"1"],[7,8,1,"-1"],[7,9,0,"-1"],[8,9,3,"2"]],"gram":[["4","0","0","0","0","0","0","0","0","0"],["0","4","0","0","0","0","0","0","0","0"],["0","0","2","0","0","0","0","0","0","0"],["0","0","0","2","0","0","0","0","0","0"],["0","0","0","0","2","0","0","0","0","0"],["0","0","0","0","0","2","0","0","0","0"],["0","0","0","0","0","0","4","0","0","0"],["0","0","0","0","0","0","0","4","0","0"],["0","0","0","0","0","0","0","0","2","0"],["0","0","0","0","0","0","0","0","0","2"]],"chevalley":{"names":["h1","h2","e(0, 1)","e(1, 0)","e(1, 1)","e(2, 1)","f(0, 1)","f(1, 0)","f(1, 1)","f(2, 1)"],"matrices":[{"n":4,"entries":[[0,0,"1","0"],[1,1,"-1","0"],[2,2,"-1","0"],[3,3,"1","0"]]},{"n":4,"entries":[[1,1,"1","0"],[3,3,"-1","0"]]},{"n":4,"entries":[[1,3,"1","0"]]},{"n":4,"entries":[[0,1,"1","0"],[3,2,"-1","0"]]},{"n":4,"entries":[[0,3,"1","0"],[1,2,"1","0"]]},{"n":4,"entries":[[0,2,"1","0"]]},{"n":4,"entries":[[3,1,"1","0"]]},{"n":4,"entries":[[1,0,"1","0"],[2,3,"-1","0"]]},{"n":4,"entries":[[2,1,"1","0"],[3,0,"1","0"]]},{"n":4,"entries":[[2,0,"1","0"]]}],"structureConstants":[[0,2,2,-2],[0,3,3,2],[0,5,5,2],[0,6,6,2],[0,7,7,-2],[0,9,9,-2],[1,2,2,2],[1,3,3,-1],[1,4,4,1],[1,6,6,-2],[1,7,7,1],[1,8,8,-1],[2,3,4,-1],[2,6,1,1],[2,8,7,1],[3,4,5,2],[3,7,0,1],[3,8,6,-2],[3,9,8,-1],[4,6,3,1],[4,7,2,-2],[4,8,0,1],[4,8,1,2],[4,9,7,1],[5,7,4,-1],[5,8,3,1],[5,9,0,1],[5,9,1,1],[6,7,8,1],[7,8,9,-2]],"compactToChevalley":[[["0","0"],["0","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","1"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"]],[["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"]],[["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"]]],"simpleGeneratorCount":2,"fullBasisCount":10,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":4,"entries":[[0,2,"0","-1/2"],[2,0,"0","-1/2"]]},{"n":4,"entries":[[0,2,"-1/2","0"],[2,0,"1/2","0"]]},{"n":4,"entries":[[0,0,"0","-1/2"],[2,2,"0","1/2"]]}],"compactCoordinates":[["0","0","0","0","0","-1/2","0","0","0","0"],["0","0","0","0","-1/2","0","0","0","0","0"],["0","0","-1/2","0","0","0","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":10,"gramPositiveLDL":["4","4","2","2","2","2","4","4","2","2"],"bracketPairs":45,"jacobiDistinctTriples":120,"jacobiFullOrderedTriples":1000,"adInvariantMetricOrderedTriples":1000,"chevalleyIntegralBracketPairs":45,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED"},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":4,"entries":[[0,2,"0","-1/2"],[2,0,"0","-1/2"]]},{"n":4,"entries":[[0,2,"-1/2","0"],[2,0,"1/2","0"]]},{"n":4,"entries":[[0,0,"0","-1/2"],[2,2,"0","1/2"]]}],"compactCoordinates":[["0","0","0","0","0","-1/2","0","0","0","0"],["0","0","0","0","-1/2","0","0","0","0","0"],["0","0","-1/2","0","0","0","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"}],"dataSha256":"cc5c8dd369b06e98e0babacdb59cc92f352c1885a445016cf15f70fd14271b61"},{"id":"Sp3","family":"Sp","parameter":3,"name":"Sp(3)","rank":3,"dimension":21,"matrixDimension":6,"globalForm":{"form":"SIMPLY_CONNECTED","cover":"Sp(3)","kernel":["1"],"description":"Actual compact USp(6), not split Sp(6, R); center +/-I."},"center":{"order":2,"generators":["-I"],"representationDescendsToAdjoint":false},"representation":{"kind":"MATRIX","name":"compact defining complex matrices","dimension":6,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1) Re Tr(XY)"},"rootDatum":{"type":"C","rank":3,"cartan":[[2,-1,0],[-1,2,-2],[0,-1,2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"fundamental weights omega_i","cocharacterBasis":"simple coroots alpha_i^vee","pairing":[[1,0,0],[0,1,0],[0,0,1]],"simpleRootCharacters":[[2,-1,0],[-1,2,-1],[0,-2,2]],"simpleCorootCocharacters":[[1,0,0],[0,1,0],[0,0,1]],"roots":[{"simple":[-2,-2,-1],"corootSimple":[-1,-1,-1],"character":[-2,0,0],"cocharacter":[-1,-1,-1],"lengthSquared":"2"},{"simple":[-1,-2,-1],"corootSimple":[-1,-2,-2],"character":[0,-1,0],"cocharacter":[-1,-2,-2],"lengthSquared":"1"},{"simple":[-1,-1,-1],"corootSimple":[-1,-1,-2],"character":[-1,1,-1],"cocharacter":[-1,-1,-2],"lengthSquared":"1"},{"simple":[-1,-1,0],"corootSimple":[-1,-1,0],"character":[-1,-1,1],"cocharacter":[-1,-1,0],"lengthSquared":"1"},{"simple":[-1,0,0],"corootSimple":[-1,0,0],"character":[-2,1,0],"cocharacter":[-1,0,0],"lengthSquared":"1"},{"simple":[0,-2,-1],"corootSimple":[0,-1,-1],"character":[2,-2,0],"cocharacter":[0,-1,-1],"lengthSquared":"2"},{"simple":[0,-1,-1],"corootSimple":[0,-1,-2],"character":[1,0,-1],"cocharacter":[0,-1,-2],"lengthSquared":"1"},{"simple":[0,-1,0],"corootSimple":[0,-1,0],"character":[1,-2,1],"cocharacter":[0,-1,0],"lengthSquared":"1"},{"simple":[0,0,-1],"corootSimple":[0,0,-1],"character":[0,2,-2],"cocharacter":[0,0,-1],"lengthSquared":"2"},{"simple":[0,0,1],"corootSimple":[0,0,1],"character":[0,-2,2],"cocharacter":[0,0,1],"lengthSquared":"2"},{"simple":[0,1,0],"corootSimple":[0,1,0],"character":[-1,2,-1],"cocharacter":[0,1,0],"lengthSquared":"1"},{"simple":[0,1,1],"corootSimple":[0,1,2],"character":[-1,0,1],"cocharacter":[0,1,2],"lengthSquared":"1"},{"simple":[0,2,1],"corootSimple":[0,1,1],"character":[-2,2,0],"cocharacter":[0,1,1],"lengthSquared":"2"},{"simple":[1,0,0],"corootSimple":[1,0,0],"character":[2,-1,0],"cocharacter":[1,0,0],"lengthSquared":"1"},{"simple":[1,1,0],"corootSimple":[1,1,0],"character":[1,1,-1],"cocharacter":[1,1,0],"lengthSquared":"1"},{"simple":[1,1,1],"corootSimple":[1,1,2],"character":[1,-1,1],"cocharacter":[1,1,2],"lengthSquared":"1"},{"simple":[1,2,1],"corootSimple":[1,2,2],"character":[0,1,0],"cocharacter":[1,2,2],"lengthSquared":"1"},{"simple":[2,2,1],"corootSimple":[1,1,1],"character":[2,0,0],"cocharacter":[1,1,1],"lengthSquared":"2"}]},"basis":{"names":["aA01","aB01","aA02","aB02","aA12","aB12","aH0","aH1","aH2","bR00","bI00","bR01","bI01","bR02","bI02","bR11","bI11","bR12","bI12","bR22","bI22"],"matrices":[{"n":6,"entries":[[0,1,"1","0"],[1,0,"-1","0"],[3,4,"1","0"],[4,3,"-1","0"]]},{"n":6,"entries":[[0,1,"0","1"],[1,0,"0","1"],[3,4,"0","-1"],[4,3,"0","-1"]]},{"n":6,"entries":[[0,2,"1","0"],[2,0,"-1","0"],[3,5,"1","0"],[5,3,"-1","0"]]},{"n":6,"entries":[[0,2,"0","1"],[2,0,"0","1"],[3,5,"0","-1"],[5,3,"0","-1"]]},{"n":6,"entries":[[1,2,"1","0"],[2,1,"-1","0"],[4,5,"1","0"],[5,4,"-1","0"]]},{"n":6,"entries":[[1,2,"0","1"],[2,1,"0","1"],[4,5,"0","-1"],[5,4,"0","-1"]]},{"n":6,"entries":[[0,0,"0","1"],[3,3,"0","-1"]]},{"n":6,"entries":[[1,1,"0","1"],[4,4,"0","-1"]]},{"n":6,"entries":[[2,2,"0","1"],[5,5,"0","-1"]]},{"n":6,"entries":[[0,3,"1","0"],[3,0,"-1","0"]]},{"n":6,"entries":[[0,3,"0","1"],[3,0,"0","1"]]},{"n":6,"entries":[[0,4,"1","0"],[1,3,"1","0"],[3,1,"-1","0"],[4,0,"-1","0"]]},{"n":6,"entries":[[0,4,"0","1"],[1,3,"0","1"],[3,1,"0","1"],[4,0,"0","1"]]},{"n":6,"entries":[[0,5,"1","0"],[2,3,"1","0"],[3,2,"-1","0"],[5,0,"-1","0"]]},{"n":6,"entries":[[0,5,"0","1"],[2,3,"0","1"],[3,2,"0","1"],[5,0,"0","1"]]},{"n":6,"entries":[[1,4,"1","0"],[4,1,"-1","0"]]},{"n":6,"entries":[[1,4,"0","1"],[4,1,"0","1"]]},{"n":6,"entries":[[1,5,"1","0"],[2,4,"1","0"],[4,2,"-1","0"],[5,1,"-1","0"]]},{"n":6,"entries":[[1,5,"0","1"],[2,4,"0","1"],[4,2,"0","1"],[5,1,"0","1"]]},{"n":6,"entries":[[2,5,"1","0"],[5,2,"-1","0"]]},{"n":6,"entries":[[2,5,"0","1"],[5,2,"0","1"]]}],"compactRealForm":true},"structureConstants":[[0,1,6,"2"],[0,1,7,"-2"],[0,2,4,"-1"],[0,3,5,"-1"],[0,4,2,"1"],[0,5,3,"1"],[0,6,1,"-1"],[0,7,1,"1"],[0,9,11,"-1"],[0,10,12,"-1"],[0,11,9,"2"],[0,11,15,"-2"],[0,12,10,"2"],[0,12,16,"-2"],[0,13,17,"-1"],[0,14,18,"-1"],[0,15,11,"1"],[0,16,12,"1"],[0,17,13,"1"],[0,18,14,"1"],[1,2,5,"1"],[1,3,4,"-1"],[1,4,3,"1"],[1,5,2,"-1"],[1,6,0,"1"],[1,7,0,"-1"],[1,9,12,"1"],[1,10,11,"-1"],[1,11,10,"2"],[1,11,16,"2"],[1,12,9,"-2"],[1,12,15,"-2"],[1,13,18,"1"],[1,14,17,"-1"],[1,15,12,"1"],[1,16,11,"-1"],[1,17,14,"1"],[1,18,13,"-1"],[2,3,6,"2"],[2,3,8,"-2"],[2,4,0,"-1"],[2,5,1,"1"],[2,6,3,"-1"],[2,8,3,"1"],[2,9,13,"-1"],[2,10,14,"-1"],[2,11,17,"-1"],[2,12,18,"-1"],[2,13,9,"2"],[2,13,19,"-2"],[2,14,10,"2"],[2,14,20,"-2"],[2,17,11,"1"],[2,18,12,"1"],[2,19,13,"1"],[2,20,14,"1"],[3,4,1,"-1"],[3,5,0,"-1"],[3,6,2,"1"],[3,8,2,"-1"],[3,9,14,"1"],[3,10,13,"-1"],[3,11,18,"1"],[3,12,17,"-1"],[3,13,10,"2"],[3,13,20,"2"],[3,14,9,"-2"],[3,14,19,"-2"],[3,17,12,"1"],[3,18,11,"-1"],[3,19,14,"1"],[3,20,13,"-1"],[4,5,7,"2"],[4,5,8,"-2"],[4,7,5,"-1"],[4,8,5,"1"],[4,11,13,"-1"],[4,12,14,"-1"],[4,13,11,"1"],[4,14,12,"1"],[4,15,17,"-1"],[4,16,18,"-1"],[4,17,15,"2"],[4,17,19,"-2"],[4,18,16,"2"],[4,18,20,"-2"],[4,19,17,"1"],[4,20,18,"1"],[5,7,4,"1"],[5,8,4,"-1"],[5,11,14,"1"],[5,12,13,"-1"],[5,13,12,"1"],[5,14,11,"-1"],[5,15,18,"1"],[5,16,17,"-1"],[5,17,16,"2"],[5,17,20,"2"],[5,18,15,"-2"],[5,18,19,"-2"],[5,19,18,"1"],[5,20,17,"-1"],[6,9,10,"2"],[6,10,9,"-2"],[6,11,12,"1"],[6,12,11,"-1"],[6,13,14,"1"],[6,14,13,"-1"],[7,11,12,"1"],[7,12,11,"-1"],[7,15,16,"2"],[7,16,15,"-2"],[7,17,18,"1"],[7,18,17,"-1"],[8,13,14,"1"],[8,14,13,"-1"],[8,17,18,"1"],[8,18,17,"-1"],[8,19,20,"2"],[8,20,19,"-2"],[9,10,6,"2"],[9,11,0,"-1"],[9,12,1,"1"],[9,13,2,"-1"],[9,14,3,"1"],[10,11,1,"-1"],[10,12,0,"-1"],[10,13,3,"-1"],[10,14,2,"-1"],[11,12,6,"2"],[11,12,7,"2"],[11,13,4,"-1"],[11,14,5,"1"],[11,15,0,"-1"],[11,16,1,"1"],[11,17,2,"-1"],[11,18,3,"1"],[12,13,5,"-1"],[12,14,4,"-1"],[12,15,1,"-1"],[12,16,0,"-1"],[12,17,3,"-1"],[12,18,2,"-1"],[13,14,6,"2"],[13,14,8,"2"],[13,17,0,"-1"],[13,18,1,"1"],[13,19,2,"-1"],[13,20,3,"1"],[14,17,1,"-1"],[14,18,0,"-1"],[14,19,3,"-1"],[14,20,2,"-1"],[15,16,7,"2"],[15,17,4,"-1"],[15,18,5,"1"],[16,17,5,"-1"],[16,18,4,"-1"],[17,18,7,"2"],[17,18,8,"2"],[17,19,4,"-1"],[17,20,5,"1"],[18,19,5,"-1"],[18,20,4,"-1"],[19,20,8,"2"]],"gram":[["4","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","4","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","4","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","4","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","4","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","4","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","4","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","4","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","4","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","4","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","4","0","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","4","0","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2","0"],["0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","2"]],"chevalley":{"names":["h1","h2","h3","e(0, 0, 1)","e(0, 1, 0)","e(1, 0, 0)","e(0, 1, 1)","e(1, 1, 0)","e(0, 2, 1)","e(1, 1, 1)","e(1, 2, 1)","e(2, 2, 1)","f(0, 0, 1)","f(0, 1, 0)","f(1, 0, 0)","f(0, 1, 1)","f(1, 1, 0)","f(0, 2, 1)","f(1, 1, 1)","f(1, 2, 1)","f(2, 2, 1)"],"matrices":[{"n":6,"entries":[[0,0,"1","0"],[1,1,"-1","0"],[3,3,"-1","0"],[4,4,"1","0"]]},{"n":6,"entries":[[1,1,"1","0"],[2,2,"-1","0"],[4,4,"-1","0"],[5,5,"1","0"]]},{"n":6,"entries":[[2,2,"1","0"],[5,5,"-1","0"]]},{"n":6,"entries":[[2,5,"1","0"]]},{"n":6,"entries":[[1,2,"1","0"],[5,4,"-1","0"]]},{"n":6,"entries":[[0,1,"1","0"],[4,3,"-1","0"]]},{"n":6,"entries":[[1,5,"1","0"],[2,4,"1","0"]]},{"n":6,"entries":[[0,2,"1","0"],[5,3,"-1","0"]]},{"n":6,"entries":[[1,4,"1","0"]]},{"n":6,"entries":[[0,5,"1","0"],[2,3,"1","0"]]},{"n":6,"entries":[[0,4,"1","0"],[1,3,"1","0"]]},{"n":6,"entries":[[0,3,"1","0"]]},{"n":6,"entries":[[5,2,"1","0"]]},{"n":6,"entries":[[2,1,"1","0"],[4,5,"-1","0"]]},{"n":6,"entries":[[1,0,"1","0"],[3,4,"-1","0"]]},{"n":6,"entries":[[4,2,"1","0"],[5,1,"1","0"]]},{"n":6,"entries":[[2,0,"1","0"],[3,5,"-1","0"]]},{"n":6,"entries":[[4,1,"1","0"]]},{"n":6,"entries":[[3,2,"1","0"],[5,0,"1","0"]]},{"n":6,"entries":[[3,1,"1","0"],[4,0,"1","0"]]},{"n":6,"entries":[[3,0,"1","0"]]}],"structureConstants":[[0,4,4,-1],[0,5,5,2],[0,6,6,-1],[0,7,7,1],[0,8,8,-2],[0,9,9,1],[0,11,11,2],[0,13,13,1],[0,14,14,-2],[0,15,15,1],[0,16,16,-1],[0,17,17,2],[0,18,18,-1],[0,20,20,-2],[1,3,3,-2],[1,4,4,2],[1,5,5,-1],[1,7,7,1],[1,8,8,2],[1,9,9,-1],[1,10,10,1],[1,12,12,2],[1,13,13,-2],[1,14,14,1],[1,16,16,-1],[1,17,17,-2],[1,18,18,1],[1,19,19,-1],[2,3,3,2],[2,4,4,-1],[2,6,6,1],[2,7,7,-1],[2,9,9,1],[2,12,12,-2],[2,13,13,1],[2,15,15,-1],[2,16,16,1],[2,18,18,-1],[3,4,6,-1],[3,7,9,-1],[3,12,2,1],[3,15,13,1],[3,18,16,1],[4,5,7,-1],[4,6,8,2],[4,9,10,1],[4,13,1,1],[4,15,12,-2],[4,16,14,1],[4,17,15,-1],[4,19,18,-1],[5,6,9,1],[5,8,10,1],[5,10,11,2],[5,14,0,1],[5,16,13,-1],[5,18,15,-1],[5,19,17,-2],[5,20,19,-1],[6,7,10,-1],[6,12,4,1],[6,13,3,-2],[6,15,1,1],[6,15,2,2],[6,17,13,1],[6,18,14,1],[6,19,16,1],[7,9,11,2],[7,13,5,1],[7,14,4,-1],[7,16,0,1],[7,16,1,1],[7,18,12,-2],[7,19,15,-1],[7,20,18,-1],[8,13,6,-1],[8,15,4,1],[8,17,1,1],[8,17,2,1],[8,19,14,1],[9,12,7,1],[9,14,6,-1],[9,15,5,1],[9,16,3,-2],[9,18,0,1],[9,18,1,1],[9,18,2,2],[9,19,13,1],[9,20,16,1],[10,13,9,-1],[10,14,8,-2],[10,15,7,1],[10,16,6,-1],[10,17,5,1],[10,18,4,1],[10,19,0,1],[10,19,1,2],[10,19,2,2],[10,20,14,1],[11,14,10,-1],[11,16,9,-1],[11,18,7,1],[11,19,5,1],[11,20,0,1],[11,20,1,1],[11,20,2,1],[12,13,15,1],[12,16,18,1],[13,14,16,1],[13,15,17,-2],[13,18,19,-1],[14,15,18,-1],[14,17,19,-1],[14,19,20,-2],[15,16,19,1],[16,18,20,-2]],"compactToChevalley":[[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1"],["0","1"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"]],[["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"]],[["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"]],[["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"]],[["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1","0"],["0","1"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]]],"simpleGeneratorCount":3,"fullBasisCount":21,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":6,"entries":[[0,3,"0","-1/2"],[3,0,"0","-1/2"]]},{"n":6,"entries":[[0,3,"-1/2","0"],[3,0,"1/2","0"]]},{"n":6,"entries":[[0,0,"0","-1/2"],[3,3,"0","1/2"]]}],"compactCoordinates":[["0","0","0","0","0","0","0","0","0","0","-1/2","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","-1/2","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":21,"gramPositiveLDL":["4","4","4","4","4","4","2","2","2","2","2","4","4","4","4","2","2","4","4","2","2"],"bracketPairs":210,"jacobiDistinctTriples":1330,"jacobiFullOrderedTriples":9261,"adInvariantMetricOrderedTriples":9261,"chevalleyIntegralBracketPairs":210,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED"},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":6,"entries":[[0,3,"0","-1/2"],[3,0,"0","-1/2"]]},{"n":6,"entries":[[0,3,"-1/2","0"],[3,0,"1/2","0"]]},{"n":6,"entries":[[0,0,"0","-1/2"],[3,3,"0","1/2"]]}],"compactCoordinates":[["0","0","0","0","0","0","0","0","0","0","-1/2","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","0","-1/2","0","0","0","0","0","0","0","0","0","0","0"],["0","0","0","0","0","0","-1/2","0","0","0","0","0","0","0","0","0","0","0","0","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"}],"dataSha256":"d8ec5357767f600af8442f15d455d229098b9a3ec73207e7311bddc448baea6c"},{"id":"G2","family":"G2","parameter":2,"name":"G2","rank":2,"dimension":14,"matrixDimension":7,"globalForm":{"form":"ADJOINT","cover":"compact G2 = Aut(O), simply connected and adjoint","kernel":["1"],"description":"Actual stabilizer of the positive octonion 3-form in SO(7); center is trivial."},"center":{"order":1,"generators":[],"representationDescendsToAdjoint":true},"representation":{"kind":"MATRIX","name":"defining real matrices","dimension":7,"faithful":true,"convention":"anti-Hermitian Lie algebra; D=d+A; compact real form"},"metricTraceFactor":"1/2","invariantInnerProduct":{"normalization":"basic invariant form; long roots squared length 2 (SO(3) uses A1 normalization)","formula":"-(1/2) Re Tr(XY)"},"rootDatum":{"type":"G","rank":2,"cartan":[[2,-3],[-1,2]],"cartanConvention":"A_ij=<alpha_j,alpha_i^vee>; row=coroot","characterBasis":"fundamental weights omega_i","cocharacterBasis":"simple coroots alpha_i^vee","pairing":[[1,0],[0,1]],"simpleRootCharacters":[[2,-1],[-3,2]],"simpleCorootCocharacters":[[1,0],[0,1]],"roots":[{"simple":[-3,-2],"corootSimple":[-1,-2],"character":[0,-1],"cocharacter":[-1,-2],"lengthSquared":"2"},{"simple":[-3,-1],"corootSimple":[-1,-1],"character":[-3,1],"cocharacter":[-1,-1],"lengthSquared":"2"},{"simple":[-2,-1],"corootSimple":[-2,-3],"character":[-1,0],"cocharacter":[-2,-3],"lengthSquared":"2/3"},{"simple":[-1,-1],"corootSimple":[-1,-3],"character":[1,-1],"cocharacter":[-1,-3],"lengthSquared":"2/3"},{"simple":[-1,0],"corootSimple":[-1,0],"character":[-2,1],"cocharacter":[-1,0],"lengthSquared":"2/3"},{"simple":[0,-1],"corootSimple":[0,-1],"character":[3,-2],"cocharacter":[0,-1],"lengthSquared":"2"},{"simple":[0,1],"corootSimple":[0,1],"character":[-3,2],"cocharacter":[0,1],"lengthSquared":"2"},{"simple":[1,0],"corootSimple":[1,0],"character":[2,-1],"cocharacter":[1,0],"lengthSquared":"2/3"},{"simple":[1,1],"corootSimple":[1,3],"character":[-1,1],"cocharacter":[1,3],"lengthSquared":"2/3"},{"simple":[2,1],"corootSimple":[2,3],"character":[1,0],"cocharacter":[2,3],"lengthSquared":"2/3"},{"simple":[3,1],"corootSimple":[1,1],"character":[3,-1],"cocharacter":[1,1],"lengthSquared":"2"},{"simple":[3,2],"corootSimple":[1,2],"character":[0,1],"cocharacter":[1,2],"lengthSquared":"2"}]},"basis":{"names":["D0","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","D11","D12","D13"],"matrices":[{"n":7,"entries":[[0,6,"-1","0"],[1,3,"1","0"],[3,1,"-1","0"],[6,0,"1","0"]]},{"n":7,"entries":[[0,5,"1","0"],[1,4,"1","0"],[4,1,"-1","0"],[5,0,"-1","0"]]},{"n":7,"entries":[[0,4,"-1","0"],[1,5,"1","0"],[4,0,"1","0"],[5,1,"-1","0"]]},{"n":7,"entries":[[0,3,"1","0"],[1,6,"1","0"],[3,0,"-1","0"],[6,1,"-1","0"]]},{"n":7,"entries":[[0,5,"1","0"],[2,3,"1","0"],[3,2,"-1","0"],[5,0,"-1","0"]]},{"n":7,"entries":[[0,6,"1","0"],[2,4,"1","0"],[4,2,"-1","0"],[6,0,"-1","0"]]},{"n":7,"entries":[[0,3,"-1","0"],[2,5,"1","0"],[3,0,"1","0"],[5,2,"-1","0"]]},{"n":7,"entries":[[0,4,"-1","0"],[2,6,"1","0"],[4,0,"1","0"],[6,2,"-1","0"]]},{"n":7,"entries":[[1,2,"-1","0"],[2,1,"1","0"],[3,4,"1","0"],[4,3,"-1","0"]]},{"n":7,"entries":[[0,2,"1","0"],[2,0,"-1","0"],[3,5,"1","0"],[5,3,"-1","0"]]},{"n":7,"entries":[[0,1,"-1","0"],[1,0,"1","0"],[3,6,"1","0"],[6,3,"-1","0"]]},{"n":7,"entries":[[0,1,"1","0"],[1,0,"-1","0"],[4,5,"1","0"],[5,4,"-1","0"]]},{"n":7,"entries":[[0,2,"1","0"],[2,0,"-1","0"],[4,6,"1","0"],[6,4,"-1","0"]]},{"n":7,"entries":[[1,2,"1","0"],[2,1,"-1","0"],[5,6,"1","0"],[6,5,"-1","0"]]}],"compactRealForm":true},"structureConstants":[[0,1,8,"-1"],[0,1,13,"-1"],[0,2,9,"-1"],[0,2,12,"1"],[0,3,10,"-2"],[0,4,13,"-1"],[0,6,10,"1"],[0,7,12,"1"],[0,8,1,"1"],[0,8,4,"-1"],[0,9,2,"1"],[0,9,7,"-1"],[0,10,3,"2"],[0,11,3,"-1"],[0,12,7,"-1"],[0,13,4,"1"],[1,2,11,"-2"],[1,3,9,"1"],[1,3,12,"-1"],[1,5,13,"-1"],[1,6,9,"-1"],[1,7,11,"-1"],[1,8,0,"-1"],[1,8,5,"-1"],[1,9,6,"1"],[1,10,2,"-1"],[1,11,2,"2"],[1,12,3,"1"],[1,12,6,"1"],[1,13,5,"1"],[2,3,8,"-1"],[2,3,13,"-1"],[2,4,11,"1"],[2,5,12,"1"],[2,6,8,"1"],[2,8,6,"-1"],[2,9,0,"-1"],[2,9,5,"-1"],[2,10,1,"1"],[2,11,1,"-2"],[2,12,5,"-1"],[2,13,3,"1"],[2,13,6,"1"],[3,4,9,"-1"],[3,5,10,"-1"],[3,7,8,"1"],[3,8,7,"-1"],[3,9,4,"1"],[3,10,0,"-2"],[3,11,0,"1"],[3,12,1,"-1"],[3,12,4,"1"],[3,13,2,"-1"],[3,13,7,"1"],[4,5,8,"-1"],[4,5,13,"-1"],[4,6,9,"-2"],[4,7,10,"-1"],[4,7,11,"-1"],[4,8,0,"1"],[4,8,5,"1"],[4,9,6,"2"],[4,10,2,"-1"],[4,10,7,"1"],[4,11,2,"1"],[4,12,6,"1"],[4,13,0,"-1"],[5,6,10,"-1"],[5,6,11,"-1"],[5,7,12,"-2"],[5,8,1,"1"],[5,8,4,"-1"],[5,9,7,"1"],[5,10,3,"-1"],[5,11,3,"1"],[5,11,6,"1"],[5,12,7,"2"],[5,13,1,"-1"],[6,7,8,"-1"],[6,7,13,"-1"],[6,8,2,"1"],[6,9,4,"-2"],[6,10,0,"1"],[6,11,0,"-1"],[6,11,5,"-1"],[6,12,4,"-1"],[6,13,2,"-1"],[6,13,7,"1"],[7,8,3,"1"],[7,9,5,"-1"],[7,10,1,"1"],[7,10,4,"-1"],[7,11,1,"-1"],[7,12,5,"-2"],[7,13,3,"-1"],[7,13,6,"-1"],[8,9,11,"-1"],[8,10,12,"-1"],[8,11,9,"1"],[8,12,10,"1"],[9,10,13,"-1"],[9,11,8,"-1"],[9,13,10,"1"],[10,12,8,"-1"],[10,13,9,"-1"],[11,12,13,"-1"],[11,13,12,"1"],[12,13,11,"-1"]],"gram":[["2","0","0","0","0","-1","0","0","0","0","0","0","0","0"],["0","2","0","0","1","0","0","0","0","0","0","0","0","0"],["0","0","2","0","0","0","0","1","0","0","0","0","0","0"],["0","0","0","2","0","0","-1","0","0","0","0","0","0","0"],["0","1","0","0","2","0","0","0","0","0","0","0","0","0"],["-1","0","0","0","0","2","0","0","0","0","0","0","0","0"],["0","0","0","-1","0","0","2","0","0","0","0","0","0","0"],["0","0","1","0","0","0","0","2","0","0","0","0","0","0"],["0","0","0","0","0","0","0","0","2","0","0","0","0","-1"],["0","0","0","0","0","0","0","0","0","2","0","0","1","0"],["0","0","0","0","0","0","0","0","0","0","2","-1","0","0"],["0","0","0","0","0","0","0","0","0","0","-1","2","0","0"],["0","0","0","0","0","0","0","0","0","1","0","0","2","0"],["0","0","0","0","0","0","0","0","-1","0","0","0","0","2"]],"chevalley":{"names":["h1","h2","e(0, 1)","e(1, 0)","e(1, 1)","e(2, 1)","e(3, 1)","e(3, 2)","f(0, 1)","f(1, 0)","f(1, 1)","f(2, 1)","f(3, 1)","f(3, 2)"],"matrices":[{"n":7,"entries":[[0,1,"0","2"],[1,0,"0","-2"],[3,6,"0","-1"],[4,5,"0","1"],[5,4,"0","-1"],[6,3,"0","1"]]},{"n":7,"entries":[[0,1,"0","-1"],[1,0,"0","1"],[3,6,"0","1"],[6,3,"0","-1"]]},{"n":7,"entries":[[0,3,"1","0"],[0,6,"0","-1"],[1,3,"0","1"],[1,6,"1","0"],[3,0,"-1","0"],[3,1,"0","-1"],[6,0,"0","1"],[6,1,"-1","0"]]},{"n":7,"entries":[[0,2,"0","2"],[1,2,"2","0"],[2,0,"0","-2"],[2,1,"-2","0"],[3,4,"-1","0"],[3,5,"0","1"],[4,3,"1","0"],[4,6,"0","1"],[5,3,"0","-1"],[5,6,"1","0"],[6,4,"0","-1"],[6,5,"-1","0"]]},{"n":7,"entries":[[0,4,"2","0"],[0,5,"0","-2"],[1,4,"0","2"],[1,5,"2","0"],[2,3,"0","-4"],[2,6,"-4","0"],[3,2,"0","4"],[4,0,"-2","0"],[4,1,"0","-2"],[5,0,"0","2"],[5,1,"-2","0"],[6,2,"4","0"]]},{"n":7,"entries":[[0,3,"4","0"],[0,6,"0","-4"],[1,3,"0","-4"],[1,6,"-4","0"],[2,4,"0","-8"],[2,5,"-8","0"],[3,0,"-4","0"],[3,1,"0","4"],[4,2,"0","8"],[5,2,"8","0"],[6,0,"0","4"],[6,1,"4","0"]]},{"n":7,"entries":[[0,4,"8","0"],[0,5,"0","-8"],[1,4,"0","-8"],[1,5,"-8","0"],[4,0,"-8","0"],[4,1,"0","8"],[5,0,"0","8"],[5,1,"8","0"]]},{"n":7,"entries":[[3,4,"-16","0"],[3,5,"0","16"],[4,3,"16","0"],[4,6,"0","-16"],[5,3,"0","-16"],[5,6,"-16","0"],[6,4,"0","16"],[6,5,"16","0"]]},{"n":7,"entries":[[0,3,"-1/4","0"],[0,6,"0","-1/4"],[1,3,"0","1/4"],[1,6,"-1/4","0"],[3,0,"1/4","0"],[3,1,"0","-1/4"],[6,0,"0","1/4"],[6,1,"1/4","0"]]},{"n":7,"entries":[[0,2,"0","1/2"],[1,2,"-1/2","0"],[2,0,"0","-1/2"],[2,1,"1/2","0"],[3,4,"1/4","0"],[3,5,"0","1/4"],[4,3,"-1/4","0"],[4,6,"0","1/4"],[5,3,"0","-1/4"],[5,6,"-1/4","0"],[6,4,"0","-1/4"],[6,5,"1/4","0"]]},{"n":7,"entries":[[0,4,"-1/8","0"],[0,5,"0","-1/8"],[1,4,"0","1/8"],[1,5,"-1/8","0"],[2,3,"0","-1/4"],[2,6,"1/4","0"],[3,2,"0","1/4"],[4,0,"1/8","0"],[4,1,"0","-1/8"],[5,0,"0","1/8"],[5,1,"1/8","0"],[6,2,"-1/4","0"]]},{"n":7,"entries":[[0,3,"-1/16","0"],[0,6,"0","-1/16"],[1,3,"0","-1/16"],[1,6,"1/16","0"],[2,4,"0","-1/8"],[2,5,"1/8","0"],[3,0,"1/16","0"],[3,1,"0","1/16"],[4,2,"0","1/8"],[5,2,"-1/8","0"],[6,0,"0","1/16"],[6,1,"-1/16","0"]]},{"n":7,"entries":[[0,4,"-1/32","0"],[0,5,"0","-1/32"],[1,4,"0","-1/32"],[1,5,"1/32","0"],[4,0,"1/32","0"],[4,1,"0","1/32"],[5,0,"0","1/32"],[5,1,"-1/32","0"]]},{"n":7,"entries":[[3,4,"1/64","0"],[3,5,"0","1/64"],[4,3,"-1/64","0"],[4,6,"0","-1/64"],[5,3,"0","-1/64"],[5,6,"1/64","0"],[6,4,"0","1/64"],[6,5,"-1/64","0"]]}],"structureConstants":[[0,2,2,-3],[0,3,3,2],[0,4,4,-1],[0,5,5,1],[0,6,6,3],[0,8,8,3],[0,9,9,-2],[0,10,10,1],[0,11,11,-1],[0,12,12,-3],[1,2,2,2],[1,3,3,-1],[1,4,4,1],[1,6,6,-1],[1,7,7,1],[1,8,8,-2],[1,9,9,1],[1,10,10,-1],[1,12,12,1],[1,13,13,-1],[2,3,4,-1],[2,6,7,1],[2,8,1,1],[2,10,9,1],[2,13,12,-1],[3,4,5,2],[3,5,6,3],[3,9,0,1],[3,10,8,-3],[3,11,10,-2],[3,12,11,-1],[4,5,7,-3],[4,8,3,1],[4,9,2,-3],[4,10,0,1],[4,10,1,3],[4,11,9,2],[4,13,11,1],[5,9,4,-2],[5,10,3,2],[5,11,0,2],[5,11,1,3],[5,12,9,1],[5,13,10,-1],[6,9,5,-1],[6,11,3,1],[6,12,0,1],[6,12,1,1],[6,13,8,1],[7,8,6,-1],[7,10,5,1],[7,11,4,-1],[7,12,2,1],[7,13,0,1],[7,13,1,2],[8,9,10,1],[8,12,13,-1],[9,10,11,-2],[9,11,12,-3],[10,11,13,3]],"compactToChevalley":[[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","-1"],["0","-1"],["0","0"],["0","0"]],[["0","-1/2"],["0","0"],["0","0"],["1/2","0"],["0","0"],["0","1/4"],["-1/4","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/4","0"],["0","-1/4"],["0","0"],["0","0"],["0","-1/4"],["1/4","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","1/8"],["0","0"],["0","0"],["-1/8","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","1/16"],["-1/16","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","1/16"],["-1/16","0"],["0","0"],["0","1/32"],["0","0"],["0","0"],["-1/32","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["-1/64","0"],["0","-1/64"],["0","0"],["0","0"],["0","1/64"],["-1/64","0"]],[["0","-2"],["0","0"],["0","0"],["-2","0"],["0","0"],["0","1"],["1","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["1","0"],["0","-1"],["0","0"],["0","0"],["0","-1"],["-1","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","2"],["0","0"],["0","0"],["2","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","4"],["4","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","16"],["16","0"],["0","0"],["0","8"],["0","0"],["0","0"],["8","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"]],[["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["0","0"],["16","0"],["0","-16"],["0","0"],["0","0"],["0","16"],["16","0"]]],"simpleGeneratorCount":2,"fullBasisCount":14,"verified":"exact integral Chevalley bracket table, Cartan and Serre relations"},"embedding":{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":7,"entries":[[3,4,"-1/2","0"],[4,3,"1/2","0"],[5,6,"-1/2","0"],[6,5,"1/2","0"]]},{"n":7,"entries":[[3,5,"-1/2","0"],[4,6,"1/2","0"],[5,3,"1/2","0"],[6,4,"-1/2","0"]]},{"n":7,"entries":[[3,6,"-1/2","0"],[4,5,"-1/2","0"],[5,4,"1/2","0"],[6,3,"1/2","0"]]}],"compactCoordinates":[["0","0","0","0","0","0","0","0","-1/2","0","0","0","0","-1/2"],["0","0","0","0","0","0","0","0","0","-1/2","0","0","1/2","0"],["0","0","0","0","0","0","0","0","0","0","-1/2","-1/2","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},"certificate":{"arithmetic":"Python fractions.Fraction over Q(i)","compactBasisRank":14,"gramPositiveLDL":["2","2","2","2","3/2","3/2","3/2","3/2","2","2","2","3/2","3/2","3/2"],"bracketPairs":91,"jacobiDistinctTriples":364,"jacobiFullOrderedTriples":2744,"adInvariantMetricOrderedTriples":2744,"chevalleyIntegralBracketPairs":91,"embeddingBracketRelations":3,"embeddingGramIdentity":true,"longRootLengthSquared":"2","customAxioms":[],"classificationStatus":"THEOREM_REFERENCE","kernelStatus":"EXACT_RATIONAL_GENERATOR_CHECKED; finite selected fixtures separately LEAN_KERNEL_CHECKED","additionalExactEmbedding":{"id":"short-root-su2","index":"3","bracketRelations":3,"phiPreservation":true,"gramPullback":true}},"embeddings":[{"id":"canonical-su2","domain":"SU(2)","matrixGenerators":[{"n":7,"entries":[[3,4,"-1/2","0"],[4,3,"1/2","0"],[5,6,"-1/2","0"],[6,5,"1/2","0"]]},{"n":7,"entries":[[3,5,"-1/2","0"],[4,6,"1/2","0"],[5,3,"1/2","0"],[6,4,"-1/2","0"]]},{"n":7,"entries":[[3,6,"-1/2","0"],[4,5,"-1/2","0"],[5,4,"1/2","0"],[6,3,"1/2","0"]]}],"compactCoordinates":[["0","0","0","0","0","0","0","0","-1/2","0","0","0","0","-1/2"],["0","0","0","0","0","0","0","0","0","-1/2","0","0","1/2","0"],["0","0","0","0","0","0","0","0","0","0","-1/2","-1/2","0","0"]],"index":"1","globalKernel":["1"],"integration":"Injective quaternion or fundamental block SU(2) homomorphism"},{"id":"short-root-su2","domain":"SU(2)","matrixGenerators":[{"n":7,"entries":[[1,2,"-1","0"],[2,1,"1","0"],[3,4,"1/2","0"],[4,3,"-1/2","0"],[5,6,"-1/2","0"],[6,5,"1/2","0"]]},{"n":7,"entries":[[0,2,"1","0"],[2,0,"-1","0"],[3,5,"1/2","0"],[4,6,"1/2","0"],[5,3,"-1/2","0"],[6,4,"-1/2","0"]]},{"n":7,"entries":[[0,1,"-1","0"],[1,0,"1","0"],[3,6,"1/2","0"],[4,5,"-1/2","0"],[5,4,"1/2","0"],[6,3,"-1/2","0"]]}],"compactCoordinates":[["0","0","0","0","0","0","0","0","1/2","0","0","0","0","-1/2"],["0","0","0","0","0","0","0","0","0","1/2","0","0","1/2","0"],["0","0","0","0","0","0","0","0","0","0","1/2","-1/2","0","0"]],"index":"3","globalKernel":["1"],"integration":"Injective (a,b)->(u a u^-1,b u^-1), u in unit quaternions; short-root SU2 index 3"}],"octonions":{"convention":"(a,b)(c,d)=(ac-conj(d)b, da+b conj(c)); basis (i,0),(j,0),(k,0),(0,1),(0,i),(0,j),(0,k)","phi":[[0,1,2,1],[0,3,4,1],[0,5,6,-1],[1,3,5,1],[1,4,6,1],[2,3,6,1],[2,4,5,-1]],"stabilizerConstraintRank":7,"stabilizerDimension":14},"dataSha256":"f51896a729486e41c81cd9822b3457f0e6a2e056123932fd6108b36d1ccce839"}];

return {GROUP_DATA};
})();
const __m1_9 = (()=>{
/** Exact Q certificates, isolated from floating point evaluation. */
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b];}return a;};
function rational(s){if(Array.isArray(s))return s;const [p,q='1']=String(s).split('/');let n=BigInt(p),d=BigInt(q);if(d===0n)throw new Error('ZERO_DENOMINATOR');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return [n/g,d/g];}
const ZERO=[0n,1n];
// Normalize every operation: intermediate integer growth remains bounded for the certified tables.
function norm(n,d){if(n===0n)return ZERO;const g=gcd(n,d);return [n/g,d/g];}
const qadd=(a,b)=>norm(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const qmul=(a,b)=>norm(a[0]*b[0],a[1]*b[1]);
const qneg=a=>[-a[0],a[1]];
const qeq=(a,b)=>a[0]*b[1]===b[0]*a[1];
const qstring=a=>a[1]===1n?String(a[0]):`${a[0]}/${a[1]}`;
function verifyExactTable(data,{corrupt=false}={}){
 const d=data.dimension,table=Array.from({length:d},()=>Array.from({length:d},()=>[]));
 const rows=data.structureConstants.map(x=>x.slice());if(corrupt&&rows.length)rows[0][3]=qstring(qadd(rational(rows[0][3]),rational(1)));
 for(const [a,b,k,v] of rows){table[a][b].push([k,rational(v)]);table[b][a].push([k,qneg(rational(v))]);}
 const gram=data.gram.map(row=>row.map(rational));let jacobiTriples=0,metricTriples=0;
 for(let a=0;a<d;a++)for(let b=a+1;b<d;b++)for(let c=b+1;c<d;c++){
   const s=new Map();for(const [x,y,z] of [[a,b,c],[b,c,a],[c,a,b]])for(const [k,v] of table[y][z])for(const [l,w] of table[x][k])s.set(l,qadd(s.get(l)||ZERO,qmul(v,w)));
   if([...s.values()].some(v=>v[0]!==0n))return {ok:false,code:'JACOBI_FAILED',witness:[a,b,c]};jacobiTriples++;
 }
 for(let a=0;a<d;a++)for(let b=0;b<d;b++)for(let c=0;c<d;c++){
   let x=ZERO,y=ZERO;for(const [k,v] of table[a][b])x=qadd(x,qmul(v,gram[k][c]));for(const [k,v] of table[b][c])y=qadd(y,qmul(v,gram[a][k]));
   if(!qeq(x,y))return {ok:false,code:'AD_INVARIANCE_FAILED',witness:[a,b,c],left:qstring(x),right:qstring(y)};metricTriples++;
 }
 return {ok:true,arithmetic:'BigInt exact reduced rationals',jacobiDistinctTriples:jacobiTriples,jacobiFullOrderedTriples:d**3,metricTriples};
}

return {rational,qadd,qmul,qneg,qeq,qstring,verifyExactTable};
})();
const __m1_10 = (()=>{
const { GROUP_DATA } = __m1_8;
const M = __m1_7;
const { verifyExactTable } = __m1_9;
const byId=new Map(GROUP_DATA.map(d=>[d.id,d]));
const cache=new Map();
class GaugeInputError extends Error {constructor(code,message,path=null){super(message);this.name='GaugeInputError';this.code=code;this.path=path;}}
function requireCondition(ok,code,message,path){if(!ok)throw new GaugeInputError(code,message,path);}
function normalizeGroupSpec(spec){
 requireCondition(spec&&typeof spec==='object'&&!Array.isArray(spec),'GROUP_SPEC_REQUIRED','Actual group request needs family, parameter, globalForm and representation.','input.group');
 requireCondition(['SU','SO','Sp','G2'].includes(spec.family),'GROUP_NOT_IMPLEMENTED','Supported constructive adapters: SU(2..6), SO(3,5..8), compact Sp(1..3), compact G2. Spin, F4, E6/E7/E8 and arbitrary quotients have no adapter.','input.group.family');
 requireCondition(Number.isInteger(spec.parameter),'GROUP_PARAMETER_REQUIRED','Group parameter is required; G2 uses parameter 2.','input.group.parameter');
 const id=spec.family==='G2'?'G2':`${spec.family}${spec.parameter}`,data=byId.get(id);
 requireCondition(data&&data.parameter===spec.parameter,'GROUP_BOUNDS','Requested group is outside the certified matrix bounds; SO(4) is excluded because its Lie algebra is not simple.','input.group.parameter');
 requireCondition(spec.globalForm===data.globalForm.form,'GLOBAL_FORM_NOT_IMPLEMENTED',`The actual stored group is ${data.name}, globalForm ${data.globalForm.form}. A cover or quotient is a distinct group and cannot be selected by changing its label.`,'input.group.globalForm');
 const rep=spec.family==='G2'?'REAL_7':'DEFINING';
 requireCondition(spec.representation===rep,'REPRESENTATION_NOT_IMPLEMENTED',`The actual faithful representation for this adapter is ${rep}.`,'input.group.representation');
 if(spec.quotient!==undefined)requireCondition(spec.quotient===null,'CENTRAL_QUOTIENT_NOT_IMPLEMENTED','Nontrivial central quotients require a new character lattice and descended representation; this adapter rejects them.','input.group.quotient');
 return {family:spec.family,parameter:spec.parameter,globalForm:spec.globalForm,representation:rep,quotient:null};
}
function createGroup(spec){
 const normalized=normalizeGroupSpec(spec),id=normalized.family==='G2'?'G2':`${normalized.family}${normalized.parameter}`;
 if(cache.has(id))return cache.get(id);
 const data=byId.get(id),basis=data.basis.matrices.map(M.fromSparse),embedding=data.embedding.matrixGenerators.map(M.fromSparse),metricTraceFactor=M.rationalNumber(data.metricTraceFactor),gram=data.gram.map(r=>r.map(M.rationalNumber));
 const result={id,data,spec:normalized,basis,embedding,gram,gramInverse:M.inverseReal(gram),metricTraceFactor,dimension:data.dimension,matrixDimension:data.matrixDimension,rank:data.rank,index:M.rationalNumber(data.embedding.index)};
 cache.set(id,result);return result;
}
function groupDescriptor(g){const d=g.data;return {schema:'MathScope.GaugeGroupSpec/1',id:`gauge-${g.id}`,revision:'m1-1',sourceRefs:[],assumptionRefs:[],name:d.name,compact:true,simple:true,lieAlgebra:{family:d.rootDatum.type,rank:d.rank,dimension:d.dimension,basis:`${d.dimension} exact compact matrices; complete integral Chevalley basis`,bracket:'[X,Y]=XY-YX; full sparse rational structure constants'},globalForm:{...structuredClone(d.globalForm),kernel:'{'+d.globalForm.kernel.join(', ')+'}'},representation:structuredClone(d.representation),invariantInnerProduct:structuredClone(d.invariantInnerProduct)};}
function detailedDescriptor(g){return {id:g.id,family:g.spec.family,parameter:g.spec.parameter,rank:g.rank,dimension:g.dimension,matrixDimension:g.matrixDimension,globalForm:g.data.globalForm,center:g.data.center,representation:g.data.representation,invariantInnerProduct:g.data.invariantInnerProduct,rootDatum:g.data.rootDatum,basisNames:g.data.basis.names,embedding:g.data.embedding,embeddings:g.data.embeddings,exactDataSha256:g.data.dataSha256,classificationStatus:'THEOREM_REFERENCE',simpleMeaning:'The compact real Lie algebra is simple; a group with nontrivial center is not declared an abstract simple group.'};}
function selectEmbedding(g,id){const e=g.data.embeddings.find(x=>x.id===id);requireCondition(e,'EMBEDDING_NOT_IMPLEMENTED','No exact supported SU2 homomorphism exists for this embedding ID.');return {...g,embedding:e.matrixGenerators.map(M.fromSparse),index:M.rationalNumber(e.index),selectedEmbedding:e};}
const inner=(g,a,b)=>-g.metricTraceFactor*M.traceProduct(a,b).re;
function coordinates(g,x){const rhs=g.basis.map(t=>inner(g,t,x));return g.gramInverse.map(row=>row.reduce((s,v,k)=>s+v*rhs[k],0));}
function fromCoordinates(g,c){requireCondition(c.length===g.dimension,'COORDINATE_DIMENSION','One real coefficient per compact basis vector is required.');return M.linearCombination(g.basis,c);}
const permSign=(a,b,c)=>a===b||b===c||a===c?0:(a-b)*(b-c)*(a-c)<0?1:-1;
function phiTensor(g){if(!g.data.octonions)return null;const phi=Array.from({length:7},()=>Array.from({length:7},()=>Array(7).fill(0)));for(const [a,b,c,s] of g.data.octonions.phi)for(const [i,j,k] of [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]])phi[i][j][k]=s*permSign(i,j,k);return phi;}
function groupElementResidual(g,u){
 const unitarity=M.unitaryResidual(u),det=M.determinant(u),determinant=Math.hypot(det.re-1,det.im);let real=0,symplectic=0,phi=0;
 if(g.spec.family==='SO'||g.spec.family==='G2')real=Math.max(...Array.from(u.im,Math.abs));
 if(g.spec.family==='Sp'){const n=g.spec.parameter,j=M.matrix(2*n);for(let i=0;i<n;i++){j.re[i*2*n+n+i]=1;j.re[(n+i)*2*n+i]=-1;}symplectic=M.distance(M.multiply(M.multiply(M.transpose(u),j),u),j);}
 if(g.spec.family==='G2'){const p=phiTensor(g);for(let i=0;i<7;i++)for(let j=i+1;j<7;j++)for(let k=j+1;k<7;k++){let value=0;for(let a=0;a<7;a++)for(let b=0;b<7;b++)for(let c=0;c<7;c++)if(p[a][b][c])value+=p[a][b][c]*u.re[a*7+i]*u.re[b*7+j]*u.re[c*7+k];phi=Math.max(phi,Math.abs(value-p[i][j][k]));}}
 return {unitarity,determinant,real,symplectic,phi,max:Math.max(unitarity,determinant,real,symplectic,phi)};
}
function verifyGroup(g,{exact=true,tolerance=1e-10}={}){
 let antiHermitian=0,traceless=0,closure=0,embeddingBracket=0,embeddingGram=0,metric=0;const d=g.dimension;
 const table=new Map();for(const [a,b,k,v] of g.data.structureConstants){const key=`${a}:${b}`;if(!table.has(key))table.set(key,Array(d).fill(0));table.get(key)[k]=M.rationalNumber(v);}
 for(const x of g.basis){antiHermitian=Math.max(antiHermitian,M.frobenius(M.add(x,M.dagger(x))));const t=M.trace(x);traceless=Math.max(traceless,Math.hypot(t.re,t.im));}
 for(let a=0;a<d;a++)for(let b=a+1;b<d;b++)closure=Math.max(closure,M.distance(M.commutator(g.basis[a],g.basis[b]),fromCoordinates(g,table.get(`${a}:${b}`)||Array(d).fill(0))));
 for(let i=0;i<3;i++){embeddingBracket=Math.max(embeddingBracket,M.distance(M.commutator(g.embedding[i],g.embedding[(i+1)%3]),g.embedding[(i+2)%3]));for(let j=0;j<3;j++)embeddingGram=Math.max(embeddingGram,Math.abs(inner(g,g.embedding[i],g.embedding[j])-(i===j?g.index/2:0)));}
 for(let i=0;i<d;i++)for(let j=0;j<d;j++)metric=Math.max(metric,Math.abs(inner(g,g.basis[i],g.basis[j])-g.gram[i][j]));
 const x=fromCoordinates(g,Array.from({length:d},(_,i)=>Math.sin(i+1)/Math.sqrt(d))),u=M.exponential(M.scale(x,0.37));
 const element=groupElementResidual(g,u);const exactCertificate=exact?verifyExactTable(g.data):{ok:null,status:'NOT_REQUESTED'};
 const max=Math.max(antiHermitian,traceless,closure,embeddingBracket,embeddingGram,metric,element.max);
 return {ok:max<=tolerance&&exactCertificate.ok!==false,tolerance,floatingResiduals:{antiHermitian,traceless,closure,embeddingBracket,embeddingGram,metric,exponentialMembership:element,max},exactCertificate,generatorCertificate:g.data.certificate,scope:'The exact finite matrices and their relations are checked. Classification, compact connected global integration and center facts retain THEOREM_REFERENCE status.'};
}
function availableGroups(){return GROUP_DATA.map(d=>({id:d.id,label:d.name,spec:{family:d.family,parameter:d.parameter,globalForm:d.globalForm.form,representation:d.family==='G2'?'REAL_7':'DEFINING'},dimension:d.dimension,rank:d.rank,matrixDimension:d.matrixDimension}));}

return {GaugeInputError,requireCondition,normalizeGroupSpec,createGroup,groupDescriptor,detailedDescriptor,selectEmbedding,inner,coordinates,fromCoordinates,phiTensor,groupElementResidual,verifyGroup,availableGroups,GROUP_DATA};
})();
const __m1_11 = (()=>{
const M = __m1_7;
const {requireCondition,inner,fromCoordinates,groupElementResidual,selectEmbedding,coordinates} = __m1_10;
const vec4=(x,name)=>requireCondition(Array.isArray(x)&&x.length===4&&x.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e4),'FOUR_DIMENSIONAL_VECTOR_REQUIRED',`${name} must contain four finite real coordinates.`,name);
const finitePositive=(x,name)=>requireCondition(Number.isFinite(x)&&x>=1e-4&&x<=1e4,'POSITIVE_PARAMETER_REQUIRED',`${name} must lie in [1e-4,1e4] for the bounded Float64 field engine.`,name);
const near=(a,b)=>Math.abs(a-b)<1e-13;
function seedGenerator(seed){let h=2166136261;for(let i=0;i<seed.length;i++)h=Math.imul(h^seed.charCodeAt(i),16777619);if(h===0)h=0x9e3779b9;return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return (h>>>0)/4294967296;};}
function normalizeDomain(d){
 requireCondition(d&&typeof d==='object','DOMAIN_REQUIRED','A 4D domain and actual boundary condition are required.','input.field.domain');
 if(d.kind==='R4_WINDOW'){
  requireCondition(d.boundary==='OPEN_RESTRICTION','BPST_BOUNDARY_CONVENTION','R4_WINDOW is a finite observation window of an R4 field, with no periodic identification.','input.field.domain.boundary');
  requireCondition(Array.isArray(d.bounds)&&d.bounds.length===4&&d.bounds.every(b=>Array.isArray(b)&&b.length===2&&b.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e4)&&b[0]<b[1]),'FOUR_DIMENSIONAL_BOUNDS','Four ordered finite coordinate intervals are required.','input.field.domain.bounds');
  return {kind:d.kind,bounds:d.bounds.map(x=>x.slice()),boundary:d.boundary};
 }
 requireCondition(d.kind==='PERIODIC_TORUS'&&d.boundary==='PERIODIC','DOMAIN_NOT_IMPLEMENTED','Only R4_WINDOW/open restriction and a periodic trivial-bundle torus are implemented.','input.field.domain');
 vec4(d.periods,'domain.periods');requireCondition(d.periods.every(x=>x>0),'PERIODS_POSITIVE','All torus periods must be positive.');vec4(d.origin,'domain.origin');
 return {kind:d.kind,periods:d.periods.slice(),origin:d.origin.slice(),boundary:d.boundary,bundle:'TRIVIAL'};
}
function normalizeFieldSpec(g,s){
 requireCondition(s&&typeof s==='object','FIELD_SPEC_REQUIRED','Group and Delta alone do not specify a field. Supply construction, coefficients, scales, domain, coupling and units.','input.field');
 requireCondition(['EMBEDDED_BPST','FULL_BASIS_TRIAL','BPST_PLUS_PERTURBATION'].includes(s.kind),'FIELD_CONSTRUCTION_NOT_IMPLEMENTED','Only the three explicit classical field constructions are implemented in M1.','input.field.kind');
 requireCondition(s.gaugeConvention==='D=d+A','GAUGE_CONVENTION_REQUIRED','The implemented anti-Hermitian convention is D=d+A and F=dA+A wedge A.','input.field.gaugeConvention');
 vec4(s.center,'field.center');const domain=normalizeDomain(s.domain);
 requireCondition(s.coupling&&s.coupling.normalization==='BASIC_FORM','COUPLING_NORMALIZATION_REQUIRED','Coupling must specify BASIC_FORM and g.','input.field.coupling');finitePositive(s.coupling.g,'field.coupling.g');
 requireCondition(s.units&&typeof s.units.length==='string'&&s.units.length.length>0,'UNITS_REQUIRED','An explicit length unit label is required.','input.field.units');finitePositive(s.units.hbarC,'field.units.hbarC');
 const bpst=s.kind!=='FULL_BASIS_TRIAL';
 if(bpst){finitePositive(s.rho,'field.rho');requireCondition(g.data.embeddings.some(e=>e.id===s.embedding),'EMBEDDING_NOT_IMPLEMENTED','Select an exact supported matrix embedding ID (canonical-su2, or short-root-su2 for G2).','input.field.embedding');requireCondition(domain.kind==='R4_WINDOW','BPST_CANNOT_BE_NAIVELY_PERIODIC','A single regular-gauge BPST field cannot be naively periodically copied; use an R4 window or implement bundle transition data.','input.field.domain');}
 else requireCondition(s.embedding===null&&s.rho===null,'UNUSED_BPST_PARAMETERS','A pure full-basis field must declare embedding:null and rho:null.','input.field');
 let perturbation=null;
 if(s.kind!=='EMBEDDED_BPST'){
  const p=s.perturbation;requireCondition(p&&typeof p==='object','COEFFICIENT_RULE_REQUIRED','Full-basis construction requires its finite coefficient rule.','input.field.perturbation');
  requireCondition(Number.isFinite(p.amplitude)&&Math.abs(p.amplitude)<=3,'PERTURBATION_AMPLITUDE_BOUNDS','Signed dimensionless amplitude must be in [-3,3].');finitePositive(p.length,'perturbation.length');
  requireCondition(typeof p.seed==='string'&&p.seed.length>0&&p.seed.length<=256,'SEED_REQUIRED','A deterministic seed must be recorded.','input.field.perturbation.seed');
  requireCondition(['GAUSSIAN_POLYNOMIAL','FOURIER'].includes(p.kind),'TRIAL_FUNCTION_NOT_IMPLEMENTED','Choose explicit Gaussian polynomial or finite Fourier basis.');
  if(domain.kind==='PERIODIC_TORUS')requireCondition(p.kind==='FOURIER','PERIODICITY_MISMATCH','Periodic fields require finite integer Fourier modes.');
  requireCondition(Array.isArray(p.modes)&&p.modes.length>0&&p.modes.length<=12,'MODE_BUDGET','Between 1 and 12 explicitly listed modes are required.');
  const modes=p.modes.map((m,index)=>{
   if(p.kind==='GAUSSIAN_POLYNOMIAL'){requireCondition(Array.isArray(m)&&m.length===4&&m.every(v=>Number.isInteger(v)&&v>=0&&v<=3)&&m.reduce((a,b)=>a+b,0)<=4,'POLYNOMIAL_MODE_BOUNDS',`Invalid polynomial mode ${index}.`);return m.slice();}
   requireCondition(m&&['SIN','COS'].includes(m.parity)&&Number.isFinite(m.phase),'FOURIER_MODE_REQUIRED','A Fourier mode requires parity, phase and four integer wave numbers.');vec4(m.wave,'Fourier.wave');requireCondition(m.wave.every(v=>Number.isInteger(v)&&Math.abs(v)<=5),'FOURIER_MODE_BOUNDS','Integer Fourier wave numbers must be in [-5,5].');return {wave:m.wave.slice(),phase:m.phase,parity:m.parity};
  });
  let coefficients;
  if(p.coefficients!==undefined){requireCondition(Array.isArray(p.coefficients)&&p.coefficients.length===4&&p.coefficients.every(v=>Array.isArray(v)&&v.length===g.dimension&&v.every(w=>Array.isArray(w)&&w.length===modes.length&&w.every(c=>Number.isFinite(c)&&Math.abs(c)<=10))),'COEFFICIENT_SHAPE','Coefficients must have shape [4][dim(g)][modeCount], entries in [-10,10].');coefficients=p.coefficients.map(x=>x.map(y=>y.slice()));}
  else {const rng=seedGenerator(p.seed);coefficients=Array.from({length:4},()=>Array.from({length:g.dimension},()=>Array.from({length:modes.length},()=> (2*rng()-1)/Math.sqrt(g.dimension*modes.length))));}
  perturbation={kind:p.kind,length:p.length,amplitude:p.amplitude,seed:p.seed,modes,coefficients,coefficientRule:p.coefficients===undefined?'xorshift32(FNV-1a UTF-16 seed, zero state -> 0x9e3779b9), full basis, explicit coefficients persisted':'explicit persisted coefficients'};
 }
 else requireCondition(s.perturbation===null,'UNUSED_PERTURBATION','EMBEDDED_BPST requires perturbation:null.');
 return {kind:s.kind,embedding:bpst?s.embedding:null,rho:bpst?s.rho:null,center:s.center.slice(),gaugeConvention:s.gaugeConvention,coupling:{g:s.coupling.g,normalization:'BASIC_FORM'},domain,units:{length:s.units.length,hbarC:s.units.hbarC},perturbation,scope:s.kind==='EMBEDDED_BPST'?'CLASSICAL_SELF_DUAL_R4_FIELD':'CLASSICAL_OFF_SHELL_TEST_FIELD',quantumState:false};
}
function createField(g,s){const spec=normalizeFieldSpec(g,s);return {group:spec.embedding?selectEmbedding(g,spec.embedding):g,spec};}
function eps3(a,b,c){if(a===b||b===c||a===c)return 0;return (a-b)*(b-c)*(a-c)<0?1:-1;}
function eta(a,mu,nu){if(mu===nu)return 0;if(mu<3&&nu<3)return eps3(a,mu,nu);if(nu===3)return +(a===mu);return -(a===nu);}
function polynomial(y,p){return p.reduce((v,n,i)=>v*y[i]**n,1);}
function polyDerivative(y,p,j,k=null){let f=p[j];if(k===j)f*=p[j]-1;else if(k!==null)f*=p[k];if(!f)return 0;const ex=p.slice();ex[j]--;if(k!==null)ex[k]--;return f*polynomial(y,ex);}
function scalarMode(field,x,m,order){const s=field.spec,p=s.perturbation,ell=p.length,y=x.map((v,j)=>(v-s.center[j])/ell);let v,d=Array(4).fill(0),dd=Array.from({length:4},()=>Array(4).fill(0));
 if(p.kind==='GAUSSIAN_POLYNOMIAL'){
  const gauss=Math.exp(-y.reduce((a,b)=>a+b*b,0)/2),poly=polynomial(y,m);v=gauss*poly;
  if(order>0)for(let j=0;j<4;j++)d[j]=gauss*(polyDerivative(y,m,j)-y[j]*poly)/ell;
  if(order>1)for(let j=0;j<4;j++)for(let k=0;k<4;k++)dd[j][k]=gauss*(polyDerivative(y,m,j,k)-(j===k?poly:0)-y[j]*polyDerivative(y,m,k)-y[k]*polyDerivative(y,m,j)+y[j]*y[k]*poly)/(ell*ell);
 }else{
  const periods=s.domain.kind==='PERIODIC_TORUS'?s.domain.periods:Array(4).fill(2*Math.PI*ell),wave=m.wave.map((w,j)=>2*Math.PI*w/periods[j]),phase=m.phase+wave.reduce((a,w,j)=>a+w*(x[j]-s.center[j]),0),sin=Math.sin(phase),cos=Math.cos(phase);v=m.parity==='SIN'?sin:cos;
  if(order>0)for(let j=0;j<4;j++)d[j]=wave[j]*(m.parity==='SIN'?cos:-sin);
  if(order>1)for(let j=0;j<4;j++)for(let k=0;k<4;k++)dd[j][k]=-wave[j]*wave[k]*v;
 }
 return {v,d,dd};
}
function evaluateJet(field,x,{order=2}={}){
 requireCondition(Array.isArray(x)&&x.length===4&&x.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e8),'FOUR_DIMENSIONAL_VECTOR_REQUIRED','Internal field evaluation requires four finite coordinates in [-1e8,1e8].');requireCondition([0,1,2].includes(order),'DERIVATIVE_ORDER','Order must be 0, 1 or 2.');const {group:g,spec:s}=field,n=g.matrixDimension;
 const A=Array.from({length:4},()=>M.matrix(n)),dA=order>0?Array.from({length:4},()=>Array.from({length:4},()=>M.matrix(n))):null,ddA=order>1?Array.from({length:4},()=>Array.from({length:4},()=>Array.from({length:4},()=>M.matrix(n)))):null;
 if(s.kind!=='FULL_BASIS_TRIAL'){
  const z=x.map((v,i)=>v-s.center[i]),D=z.reduce((a,b)=>a+b*b,s.rho*s.rho);
  for(let a=0;a<3;a++)for(let mu=0;mu<4;mu++){
   let N=0;for(let nu=0;nu<4;nu++)N+=2*eta(a,mu,nu)*z[nu];M.addTo(A[mu],g.embedding[a],N/D);
   if(order>0)for(let j=0;j<4;j++)M.addTo(dA[j][mu],g.embedding[a],2*eta(a,mu,j)/D-2*z[j]*N/(D*D));
   if(order>1)for(let j=0;j<4;j++)for(let k=0;k<4;k++){const nj=2*eta(a,mu,j),nk=2*eta(a,mu,k);M.addTo(ddA[k][j][mu],g.embedding[a],(-2*nj*z[k]-2*(j===k?N:0)-2*z[j]*nk)/(D*D)+8*z[j]*z[k]*N/(D*D*D));}
  }
 }
 if(s.perturbation){const p=s.perturbation,modes=p.modes.map(m=>scalarMode(field,x,m,order)),amp=p.amplitude/p.length;
  for(let mu=0;mu<4;mu++)for(let a=0;a<g.dimension;a++){
   let value=0;for(let k=0;k<modes.length;k++)value+=p.coefficients[mu][a][k]*modes[k].v;M.addTo(A[mu],g.basis[a],amp*value);
   if(order>0)for(let j=0;j<4;j++){let value=0;for(let k=0;k<modes.length;k++)value+=p.coefficients[mu][a][k]*modes[k].d[j];M.addTo(dA[j][mu],g.basis[a],amp*value);}
   if(order>1)for(let j=0;j<4;j++)for(let l=0;l<4;l++){let value=0;for(let k=0;k<modes.length;k++)value+=p.coefficients[mu][a][k]*modes[k].dd[j][l];M.addTo(ddA[j][l][mu],g.basis[a],amp*value);}
  }
 }
 return {x:x.slice(),A,dA,ddA,order};
}
function curvatureFromJet(jet){requireCondition(jet.dA,'DERIVATIVES_REQUIRED','Curvature needs first derivatives.');const n=jet.A[0].n,F=Array.from({length:4},()=>Array.from({length:4},()=>M.matrix(n)));for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){F[mu][nu]=M.addTo(M.addTo(M.clone(jet.dA[mu][nu]),jet.dA[nu][mu],-1),M.commutator(jet.A[mu],jet.A[nu]));F[nu][mu]=M.scale(F[mu][nu],-1);}return F;}
function dualCurvature(F){const dual=Array.from({length:4},()=>Array.from({length:4},()=>M.matrix(F[0][0].n)));for(const [a,b,c,d,sign] of [[0,1,2,3,1],[0,2,1,3,-1],[0,3,1,2,1]]){dual[a][b]=M.scale(F[c][d],sign);dual[c][d]=M.scale(F[a][b],sign);dual[b][a]=M.scale(dual[a][b],-1);dual[d][c]=M.scale(dual[c][d],-1);}return dual;}
function densities(field,F){const star=dualCurvature(F);let sum=0,q=0,self=0,anti=0;for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){sum+=inner(field.group,F[mu][nu],F[mu][nu]);q+=inner(field.group,F[mu][nu],star[mu][nu]);self+=M.distance(F[mu][nu],star[mu][nu])**2;anti+=M.distance(F[mu][nu],M.scale(star[mu][nu],-1))**2;}return {actionDensity:sum/field.spec.coupling.g**2,topologicalDensity:q/(8*Math.PI**2),curvatureNormSquared:sum,selfDualResidual:Math.sqrt(self),antiSelfDualResidual:Math.sqrt(anti),units:{actionDensity:`${field.spec.units.length}^-4`,topologicalDensity:`${field.spec.units.length}^-4`},normalization:'S=integral(sum_{mu<nu} B(F_mu_nu,F_mu_nu)/g^2); q4=sum B(F,*F)/(8 pi^2)'};}
function referenceBPST(field,x){const s=field.spec;requireCondition(s.kind==='EMBEDDED_BPST','NOT_PURE_BPST','Closed BPST reference density is valid only for the unperturbed embedded BPST field.');const r2=x.reduce((v,y,i)=>v+(y-s.center[i])**2,0),D=r2+s.rho**2,q4=field.group.index*6*s.rho**4/(Math.PI**2*D**4),F=Array.from({length:4},()=>Array.from({length:4},()=>M.matrix(field.group.matrixDimension)));for(let mu=0;mu<4;mu++)for(let nu=0;nu<4;nu++)for(let a=0;a<3;a++)M.addTo(F[mu][nu],field.group.embedding[a],-4*s.rho*s.rho*eta(a,mu,nu)/(D*D));return {F,q4,actionDensity:8*Math.PI**2*q4/s.coupling.g**2};}
function evaluateField(field,x,{residuals=false,includeMatrices=false}={}){
 const jet=evaluateJet(field,x,{order:residuals?2:1}),F=curvatureFromJet(jet),density=densities(field,F);let equations=null;
 if(residuals){const g=field.group,n=g.matrixDimension,D=Array.from({length:4},()=>Array.from({length:4},()=>Array.from({length:4},()=>M.matrix(n))));for(let j=0;j<4;j++)for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){
   let df=M.addTo(M.clone(jet.ddA[j][mu][nu]),jet.ddA[j][nu][mu],-1);M.addTo(df,M.commutator(jet.dA[j][mu],jet.A[nu]));M.addTo(df,M.commutator(jet.A[mu],jet.dA[j][nu]));M.addTo(df,M.commutator(jet.A[j],F[mu][nu]));D[j][mu][nu]=df;D[j][nu][mu]=M.scale(df,-1);
  }
  let ym2=0,bianchi2=0;for(let nu=0;nu<4;nu++){const v=M.matrix(n);for(let mu=0;mu<4;mu++)M.addTo(v,D[mu][mu][nu]);ym2+=M.frobenius(v)**2;}
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<4;c++){const v=M.addTo(M.add(D[a][b][c],D[b][c][a]),D[c][a][b]);bianchi2+=M.frobenius(v)**2;}
  const denom=Math.max(1,Math.sqrt(density.curvatureNormSquared)/(field.spec.rho||field.spec.perturbation.length));equations={yangMillsFrobenius:Math.sqrt(ym2),bianchiFrobenius:Math.sqrt(bianchi2),relativeYangMills:Math.sqrt(ym2)/denom,relativeBianchi:Math.sqrt(bianchi2)/denom,expectedYangMillsZero:field.spec.kind==='EMBEDDED_BPST',interpretation:field.spec.kind==='EMBEDDED_BPST'?'Classical self-dual solution residual':'No Yang-Mills equation is imposed on this trial field; its residual is reported whether zero or nonzero. Bianchi remains an identity.'};
 }
 const result={x:x.slice(),density,equations};if(includeMatrices){result.A=jet.A.map(M.jsonMatrix);result.F=F.map(row=>row.map(M.jsonMatrix));}return result;
}
function normalizeGauge(g,s){requireCondition(s&&Number.isInteger(s.generator)&&s.generator>=0&&s.generator<g.dimension,'GAUGE_GENERATOR_REQUIRED','A compact-basis generator index is required.');requireCondition(Array.isArray(s.wave)&&s.wave.length===4&&s.wave.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e6),'GAUGE_WAVE_VECTOR','Four finite gauge wave numbers in [-1e6,1e6] are required.');requireCondition(Number.isFinite(s.amplitude)&&Math.abs(s.amplitude)<=3&&Number.isFinite(s.phase),'GAUGE_FUNCTION_BOUNDS','Gauge amplitude in [-3,3] and finite phase required.');return {generator:s.generator,wave:s.wave.slice(),amplitude:s.amplitude,phase:s.phase};}
function gaugeAt(field,x,gauge){const s=normalizeFieldGauge(field.group,field.spec,gauge),phase=s.phase+s.wave.reduce((v,k,j)=>v+k*x[j],0),theta=s.amplitude*Math.sin(phase),d=s.wave.map(k=>s.amplitude*k*Math.cos(phase)),dd=s.wave.map(k=>s.wave.map(l=>-s.amplitude*k*l*Math.sin(phase))),T=field.group.basis[s.generator],u=M.exponential(M.scale(T,theta));return {u,T,theta,d,dd,spec:s};}
function transformedJet(field,x,gauge,{order=1}={}){const jet=evaluateJet(field,x,{order:Math.max(1,order)}),a=gaugeAt(field,x,gauge);const A=jet.A.map((v,mu)=>M.addTo(M.conjugate(a.u,v),a.T,-a.d[mu]));const dA=Array.from({length:4},(_,j)=>jet.A.map((v,mu)=>M.addTo(M.conjugate(a.u,M.addTo(M.clone(jet.dA[j][mu]),M.commutator(a.T,v),a.d[j])),a.T,-a.dd[j][mu])));return {x:x.slice(),A,dA,ddA:null,order:1,u:a.u};}
function finiteDifferenceCurvature(field,x,h,{gauge=null}={}){requireCondition(Number.isFinite(h)&&h>0&&h<=1e4,'FINITE_DIFFERENCE_STEP','Difference step must be finite and positive.');const evaluate=y=>gauge?transformedJet(field,y,gauge,{order:0}).A:evaluateJet(field,y,{order:0}).A;const A=evaluate(x),dA=Array.from({length:4},()=>null);for(let j=0;j<4;j++){const xp=x.slice(),xm=x.slice();xp[j]+=h;xm[j]-=h;const ap=evaluate(xp),am=evaluate(xm);dA[j]=ap.map((v,mu)=>M.scale(M.addTo(M.clone(v),am[mu],-1),1/(2*h)));}return curvatureFromJet({A,dA});}
function verifyFieldAt(field,x,{h=1e-3,gauge=null}={}){
 gauge=gauge??{generator:0,wave:field.spec.domain.kind==='PERIODIC_TORUS'?field.spec.domain.periods.map((L,j)=>2*Math.PI*[1,-1,0,1][j]/L):[0.3,-0.2,0.1,0.4],amplitude:0.4,phase:0.2};
 const jet=evaluateJet(field,x),F=curvatureFromJet(jet),Fh=finiteDifferenceCurvature(field,x,h),Fhalf=finiteDifferenceCurvature(field,x,h/2);let errorH=0,errorHalf=0,reference=0;
 const ref=field.spec.kind==='EMBEDDED_BPST'?referenceBPST(field,x):null;
 for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){errorH+=M.distance(F[mu][nu],Fh[mu][nu])**2;errorHalf+=M.distance(F[mu][nu],Fhalf[mu][nu])**2;if(ref)reference+=M.distance(F[mu][nu],ref.F[mu][nu])**2;}
 const trans=transformedJet(field,x,gauge),Ft=curvatureFromJet(trans),Ftf=finiteDifferenceCurvature(field,x,h/2,{gauge});let covariance=0,covarianceFD=0;
 for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){const target=M.conjugate(trans.u,F[mu][nu]);covariance+=M.distance(Ft[mu][nu],target)**2;covarianceFD+=M.distance(Ftf[mu][nu],target)**2;}
 const before=densities(field,F),after=densities(field,Ft),equations=evaluateField(field,x,{residuals:true}).equations;
 return {point:x.slice(),finiteDifference:{h,error:Math.sqrt(errorH),halfStepError:Math.sqrt(errorHalf),observedErrorRatio:Math.sqrt(errorHalf)>1e-30?Math.sqrt(errorH/errorHalf):null,method:'independent central differences of evaluated A; analytic jet is not used in this curvature'},bpstReference:ref?{curvatureResidual:Math.sqrt(reference),q4Residual:Math.abs(before.topologicalDensity-ref.q4)}:null,gauge:{spec:normalizeGauge(field.group,gauge),membership:groupElementResidual(field.group,trans.u),curvatureCovariance:Math.sqrt(covariance),independentDifferenceCovariance:Math.sqrt(covarianceFD),actionDensityDifference:Math.abs(before.actionDensity-after.actionDensity),topologicalDensityDifference:Math.abs(before.topologicalDensity-after.topologicalDensity),openConnectionComponentsAreNotInvariant:true},equations};
}
function bpstMarginal(group,rho,x3,center3=[0,0,0]){const r2=x3.reduce((s,x,i)=>s+(x-center3[i])**2,0);return group.index*15*rho**4/(8*Math.PI*(r2+rho*rho)**3.5);}
function bpstBallMass(group,rho,R){const u=R*R,v=rho*rho;return group.index*u*u*(u+3*v)/(u+v)**3;}
function simpson(f,a,b,n=512){requireCondition(Number.isInteger(n)&&n>=2&&n<=16384&&n%2===0,'QUADRATURE_BUDGET','Simpson panels must be even, 2..16384.');const h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;}
function verifyDensityQuadrature(field,{x3=[0.4,-0.2,0.3],panels=512}={}){requireCondition(field.spec.kind==='EMBEDDED_BPST','PURE_BPST_QUADRATURE','Closed marginal certificate is for pure embedded BPST.');const s=field.spec,rho=s.rho,r2=x3.reduce((v,x,i)=>v+(x-s.center[i])**2,0),scale=Math.sqrt(r2+rho*rho);const transformed=u=>{if(Math.abs(u)===Math.PI/2)return 0;const t=scale*Math.tan(u),jac=scale/Math.cos(u)**2;const x=[...x3,s.center[3]+t];return evaluateField(field,x).density.topologicalDensity*jac;};const q3=simpson(transformed,-Math.PI/2,Math.PI/2,panels),q3fine=simpson(transformed,-Math.PI/2,Math.PI/2,panels*2),analytic=bpstMarginal(field.group,rho,x3,s.center.slice(0,3));const radial=u=>{if(u===Math.PI/2||u===0)return 0;const r=rho*Math.tan(u),jac=rho/Math.cos(u)**2;return 2*Math.PI**2*r**3*evaluateField(field,[s.center[0]+r,...s.center.slice(1)]).density.topologicalDensity*jac;};const mass=simpson(radial,0,Math.PI/2,panels),massFine=simpson(radial,0,Math.PI/2,panels*2);return {method:'Independent Simpson integration of dA+[A,A] matrix density, tangent compactification of R and radial R4 measure',panels,refinedPanels:panels*2,marginal:{numeric:q3,refined:q3fine,analytic,absoluteError:Math.abs(q3fine-analytic),refinementDifference:Math.abs(q3fine-q3),units:`${s.units.length}^-3`},totalCharge:{numeric:mass,refined:massFine,expected:field.group.index,absoluteError:Math.abs(massFine-field.group.index)},exactInfiniteIntegralIs:'THEOREM_REFERENCE; numerical quadrature is not an exact integration proof'};}

/** Independent Lie-coordinate evaluation uses the sparse structure table, not matrix commutators. */
function coefficientCurvature(field,x){
 const {group:g,spec:s}=field,d=g.dimension,A=Array.from({length:4},()=>Array(d).fill(0)),dA=Array.from({length:4},()=>Array.from({length:4},()=>Array(d).fill(0)));
 if(s.kind!=='FULL_BASIS_TRIAL'){
  const z=x.map((v,i)=>v-s.center[i]),D=z.reduce((v,w)=>v+w*w,s.rho*s.rho),ec=g.selectedEmbedding.compactCoordinates.map(row=>row.map(M.rationalNumber));
  for(let a=0;a<3;a++)for(let mu=0;mu<4;mu++){
   const N=z.reduce((v,w,j)=>v+2*eta(a,mu,j)*w,0);
   for(let b=0;b<d;b++){A[mu][b]+=ec[a][b]*N/D;for(let j=0;j<4;j++)dA[j][mu][b]+=ec[a][b]*(2*eta(a,mu,j)/D-2*z[j]*N/(D*D));}
  }
 }
 if(s.perturbation){const p=s.perturbation,modes=p.modes.map(m=>scalarMode(field,x,m,1)),amp=p.amplitude/p.length;for(let mu=0;mu<4;mu++)for(let a=0;a<d;a++)for(let k=0;k<modes.length;k++){const c=amp*p.coefficients[mu][a][k];A[mu][a]+=c*modes[k].v;for(let j=0;j<4;j++)dA[j][mu][a]+=c*modes[k].d[j];}}
 const F=Array.from({length:4},()=>Array.from({length:4},()=>Array(d).fill(0)));
 for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){
  for(let a=0;a<d;a++)F[mu][nu][a]=dA[mu][nu][a]-dA[nu][mu][a];
  for(const [a,b,c,v] of g.data.structureConstants)F[mu][nu][c]+=M.rationalNumber(v)*(A[mu][a]*A[nu][b]-A[mu][b]*A[nu][a]);
  F[nu][mu]=F[mu][nu].map(v=>-v);
 }
 return {A,dA,F};
}
function verifyCoordinateCurvature(field,x){const cc=coefficientCurvature(field,x),jet=evaluateJet(field,x,{order:1}),F=curvatureFromJet(jet);let connection=0,curvature=0;for(let mu=0;mu<4;mu++){connection=Math.max(connection,M.distance(jet.A[mu],fromCoordinates(field.group,cc.A[mu])));for(let nu=mu+1;nu<4;nu++)curvature=Math.max(curvature,M.distance(F[mu][nu],fromCoordinates(field.group,cc.F[mu][nu])));}return {connectionResidual:connection,curvatureResidual:curvature,method:'direct scalar coefficients + exact sparse f_ab^c, independently compared to matrix products',fullBasisDimension:field.group.dimension,activeCoefficientDirections:cc.A[0].map((v,i)=>cc.A.some(row=>Math.abs(row[i])>1e-14)?i:null).filter(v=>v!==null)};}
function verifyPeriodicSeam(field,x){requireCondition(field.spec.domain.kind==='PERIODIC_TORUS','NOT_PERIODIC','Seam verification requires a periodic Fourier source.');const base=evaluateJet(field,x,{order:1}),F=curvatureFromJet(base);let Ares=0,Fres=0;for(let j=0;j<4;j++){const xp=x.slice();xp[j]+=field.spec.domain.periods[j];const jet=evaluateJet(field,xp,{order:1}),Fp=curvatureFromJet(jet);for(let mu=0;mu<4;mu++){Ares=Math.max(Ares,M.distance(base.A[mu],jet.A[mu]));for(let nu=mu+1;nu<4;nu++)Fres=Math.max(Fres,M.distance(F[mu][nu],Fp[mu][nu]));}}return {point:x.slice(),connectionResidual:Ares,curvatureResidual:Fres,periods:field.spec.domain.periods,scope:'Finite integer Fourier modes define a smooth periodic connection on the trivial bundle; no nontrivial bundle transition is claimed.'};}

function normalizeFieldGauge(g,fieldSpec,s){const out=normalizeGauge(g,s);if(fieldSpec.domain.kind==='PERIODIC_TORUS'&&out.amplitude!==0)requireCondition(out.wave.every((k,j)=>Math.abs(k*fieldSpec.domain.periods[j]/(2*Math.PI)-Math.round(k*fieldSpec.domain.periods[j]/(2*Math.PI)))<1e-10),'GAUGE_NOT_PERIODIC','The gauge transformation must descend to the torus: every k_j L_j/(2pi) is an integer. A nonperiodic gauge function cannot be silently used as a global torus gauge transformation.');return out;}

return {seedGenerator,normalizeFieldSpec,createField,eta,evaluateJet,curvatureFromJet,dualCurvature,densities,referenceBPST,evaluateField,normalizeGauge,gaugeAt,transformedJet,finiteDifferenceCurvature,verifyFieldAt,bpstMarginal,bpstBallMass,simpson,verifyDensityQuadrature,coefficientCurvature,verifyCoordinateCurvature,verifyPeriodicSeam,normalizeFieldGauge};
})();
const __m1_12 = (()=>{
const {requireCondition,groupDescriptor} = __m1_10;
const {createField,normalizeFieldSpec} = __m1_11;
function positive(x,name){requireCondition(Number.isFinite(x)&&x>0&&x>=1e-4&&x<=1e4,'DELTA_OR_SCALE_BOUNDS',`${name} must lie in [1e-4,1e4].`,name);}
function canonical(value){if(value===null||typeof value!=='object'){if(typeof value==='number'&&!Number.isFinite(value))throw new Error('NONFINITE_HASH_INPUT');return JSON.stringify(value);}if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';}
async function sha256(value){const data=typeof value==='string'?value:canonical(value),digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(data));return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');}
function normalizeFamily(s){
 requireCondition(s&&typeof s==='object','STATE_FAMILY_REQUIRED','A state family needs a declared Delta role and reference scale.','input.family');
 requireCondition(['ASSUMED_BOUND','UNITS','CLASSICAL_SCALE','EFFECTIVE_MODEL'].includes(s.mode),'DELTA_ROLE_NOT_IMPLEMENTED','Choose ASSUMED_BOUND, UNITS, CLASSICAL_SCALE or EFFECTIVE_MODEL. Ensemble estimates are not constructed in M1.','input.family.mode');
 positive(s.delta,'family.delta');positive(s.referenceDelta,'family.referenceDelta');requireCondition(typeof s.energyUnits==='string'&&s.energyUnits.length>0,'ENERGY_UNITS_REQUIRED','Delta energy units are required.');
 if(s.mode==='EFFECTIVE_MODEL'){positive(s.rhoOverEll,'family.rhoOverEll');requireCondition(typeof s.assumptionId==='string'&&s.assumptionId.length>0,'EFFECTIVE_MODEL_ASSUMPTION_REQUIRED','The effective relation ell=hbarC/Delta must name its explicit model assumption.');}
 return {mode:s.mode,delta:s.delta,referenceDelta:s.referenceDelta,energyUnits:s.energyUnits,assumptionId:s.assumptionId??'declared-gap-lower-bound',...(s.mode==='EFFECTIVE_MODEL'?{rhoOverEll:s.rhoOverEll}:{}),quantumExistenceClaim:false};
}
function physicalSource(spec){const p=spec.perturbation;return {kind:spec.kind,embedding:spec.embedding,rho:spec.rho,center:spec.center,gaugeConvention:spec.gaugeConvention,domain:spec.domain,units:spec.units,coupling:spec.coupling,perturbation:p?{kind:p.kind,length:p.length,amplitude:p.amplitude,modes:p.modes,coefficients:p.coefficients,seed:p.seed}:null};}
async function createStateFamily(group,baseInput,familyInput){
 const base=normalizeFieldSpec(group,baseInput),family=normalizeFamily(familyInput),selected=structuredClone(base);let lengthDisplayFactor=1,interpretation,modelAssumptions=[],fieldChanged=false;
 if(family.mode==='ASSUMED_BOUND'){
  interpretation='Delta changes only the declared spectral lower-bound assumption. It does not determine or alter this classical 4D connection.';
  modelAssumptions=[{id:family.assumptionId,statement:`If a separate specified Hamiltonian has spectrum outside (0,${family.delta}), the declared gap exclusions follow. No Hamiltonian is obtained from this classical field.`}];
 }else if(family.mode==='UNITS'){
  lengthDisplayFactor=family.delta/family.referenceDelta;
  interpretation='Physical field and physical coordinates are fixed. One displayed length unit is Lunit=Delta/referenceDelta base length units: x_display=x/Lunit, A_display=Lunit A, F_display=Lunit^2 F, q4_display=Lunit^4 q4. Delta is a unit label, not a changed physical energy.';
 }else if(family.mode==='CLASSICAL_SCALE'){
  const lambda=family.delta/family.referenceDelta;if(selected.rho!==null)selected.rho/=lambda;if(selected.perturbation)selected.perturbation.length/=lambda;
  if(selected.domain.kind==='PERIODIC_TORUS'){selected.domain.periods=selected.domain.periods.map(v=>v/lambda);selected.domain.origin=selected.domain.origin.map((v,j)=>selected.center[j]+(v-selected.center[j])/lambda);}
  interpretation='Actual classical dilation A_lambda(x)=lambda A(center+lambda(x-center)), lambda=Delta/referenceDelta. Rho and all trial-function lengths are divided by lambda. On a torus the physical periods are also rescaled. This chosen use of Delta is not a quantum mass-gap conclusion.';fieldChanged=lambda!==1;
 }else{
  const ell=base.units.hbarC/family.delta;if(selected.rho!==null)selected.rho=family.rhoOverEll*ell;if(selected.perturbation)selected.perturbation.length=ell;
  requireCondition(selected.domain.kind==='R4_WINDOW','EFFECTIVE_TORUS_RULE_REQUIRED','The shipped effective family is defined on R4; a torus family must additionally specify how volume changes.');
  interpretation='Explicit assumed effective family: ell=hbarC/Delta, rho=kappa ell, and A_trial=(epsilon/ell) sum c phi((x-center)/ell) T. The actual 4D connection is recomputed, including the recorded perturbation. This relation is a model definition, not a Yang-Mills spectral theorem.';
  modelAssumptions=[{id:family.assumptionId,statement:'The effective inverse energy-length relation ell=hbarC/Delta and rho=kappa ell is selected by the user as a model definition.'}];fieldChanged=true;
 }
 const field=createField(group,selected),basePhysical=physicalSource(base),selectedPhysical=physicalSource(field.spec),groupPart={spec:group.spec,dataSha256:group.data.dataSha256};
 const basePhysicalFieldHash=await sha256({group:groupPart,field:basePhysical}),physicalFieldHash=await sha256({group:groupPart,field:selectedPhysical}),assumptionHash=await sha256({family,modelAssumptions}),displayHash=await sha256({physicalFieldHash,lengthDisplayFactor});
 const stateId='state-'+(await sha256({physicalFieldHash,assumptionHash,displayHash})).slice(0,16),groupDescriptorHash=await sha256(groupDescriptor(group));
 const assumptionRecords=modelAssumptions.map(a=>({schema:'MathScope.AssumptionSpec/1',id:'gauge-assumption-'+assumptionHash.slice(0,16),revision:'m1-1',statement:a.statement,reason:family.mode==='ASSUMED_BOUND'?'A declared lower bound of a separately specified spectrum does not generate a classical connection.':'An explicit effective scale relation defines a selected family; it is not a spectral theorem.',origin:family.mode==='ASSUMED_BOUND'?'HYPOTHESIS':'DEFINITION',status:'DECLARED',sourceRefs:[],usedBy:[stateId],introducedBy:'normalized explicit MathScope M1 request'}));
 const assumptionRefs=[];for(const a of assumptionRecords)assumptionRefs.push({id:a.id,revision:a.revision,hash:await sha256(a)});
 return {field,stateId,groupDescriptorHash,assumptionRecords,assumptionRefs,baseFieldSpec:base,fieldSpec:field.spec,familySpec:family,physicalFieldHash,basePhysicalFieldHash,displayHash,assumptionHash,lengthDisplayFactor,modelAssumptions,interpretation,fieldChanged:physicalFieldHash!==basePhysicalFieldHash,displayTransform:{lengthDisplayFactor,coordinateScale:1/lengthDisplayFactor,connectionScale:lengthDisplayFactor,curvatureScale:lengthDisplayFactor**2,q4Scale:lengthDisplayFactor**4,q3Scale:lengthDisplayFactor**3},quantumState:false};
}
function stateFamilyDescriptor(group,state){group=state.field.group;const s=state.fieldSpec,f=state.familySpec,kind=s.kind==='EMBEDDED_BPST'?'EMBEDDED_BPST':'LIE_ALGEBRA_EXPANSION';const mode={ASSUMED_BOUND:'ASSUMED_BOUND',UNITS:'UNIT_RESCALE',CLASSICAL_SCALE:'EFFECTIVE_FAMILY',EFFECTIVE_MODEL:'EFFECTIVE_FAMILY'}[f.mode];
 return {schema:'MathScope.StateFamilySpec/1',id:state.stateId,revision:'m1-1',sourceRefs:[],assumptionRefs:state.assumptionRefs,gaugeGroupRef:{id:`gauge-${group.id}`,revision:'m1-1',hash:state.groupDescriptorHash},fieldConstruction:{kind,rule:s.kind,gaugeConvention:s.gaugeConvention,parameters:{completeFieldSpec:s,completeFamilySpec:f,...state.displayTransform},...(s.embedding?{embedding:{domain:'SU(2)',codomainRef:{id:`gauge-${group.id}`,revision:'m1-1',hash:state.groupDescriptorHash},formula:'exact '+s.embedding+' generators and compact coordinates in group descriptor',index:group.index,certificateStatus:'THEOREM_REFERENCE',sourceRefs:[]}}:{})},delta:{mode,value:f.delta,units:f.energyUnits,role:state.interpretation},coupling:s.coupling,lattice:null,seed:s.perturbation?.seed??null,channels:[{id:'classical-action-density',kind:'LOCAL_GAUGE_INVARIANT_SCALAR',definition:'sum_{mu<nu} B(F_mu_nu,F_mu_nu)/g^2; this is not a quantum spectral channel'}],scope:{kind:'FINITE',spatial:{bounds:s.domain.kind==='R4_WINDOW'?s.domain.bounds:s.domain.origin.map((v,i)=>[v,v+s.domain.periods[i]])},finite:{description:'Finite matrix Lie basis and finite observation window of the explicit classical source formula',itemCount:group.dimension},description:s.scope},energyInterpretation:{ASSUMED_BOUND:'DECLARED_BOUND',UNITS:'UNIT_CONVENTION',CLASSICAL_SCALE:'EFFECTIVE_MODEL',EFFECTIVE_MODEL:'EFFECTIVE_MODEL'}[f.mode]};
}
function finiteSpectralModel(s){requireCondition(s&&Number.isFinite(s.delta)&&s.delta>0&&s.delta<=1e4,'SPECTRAL_MODEL_REQUIRED','A positive finite energy Delta and explicit energies/weights are required.');requireCondition(Array.isArray(s.offsets)&&s.offsets.length>=1&&s.offsets.length<=32&&s.offsets.every(e=>Number.isFinite(e)&&e>=0&&e<=1e4),'SPECTRAL_OFFSETS','Offsets must be a nonempty finite list in [0,10000].');requireCondition(Array.isArray(s.weights)&&s.weights.length===s.offsets.length&&s.weights.every(w=>Number.isFinite(w)&&w>=0)&&s.weights.some(w=>w>0),'POSITIVE_CHANNEL_WEIGHTS','Channel weights must be nonnegative and not all zero.');requireCondition(Array.isArray(s.times)&&s.times.length>=2&&s.times.length<=256&&s.times.every(t=>Number.isFinite(t)&&t>=0&&t<=1e4),'SPECTRAL_TIMES','Provide 2..256 finite nonnegative physical time coordinates.');requireCondition(Number.isFinite(s.hbar)&&s.hbar>0,'SPECTRAL_UNITS','Positive hbar is required so exp(-E t/hbar) is dimensionless.');requireCondition(typeof s.assumptionId==='string'&&s.assumptionId.length>0,'SPECTRAL_ASSUMPTION_PROVENANCE','Name the explicit finite-model assumption.');
 const energies=s.offsets.map(e=>s.delta+e),dimension=energies.length+1,gap=Math.min(...energies),channelMass=Math.min(...energies.filter((e,i)=>s.weights[i]>0)),C0=s.weights.reduce((a,b)=>a+b,0),samples=s.times.map(t=>{const correlation=energies.reduce((v,e,i)=>v+s.weights[i]*Math.exp(-e*t/s.hbar),0),upperBound=C0*Math.exp(-s.delta*t/s.hbar);return {time:t,correlation,upperBound,boundResidual:Math.max(0,correlation-upperBound)};});
 return {model:{kind:'DECLARED_FINITE_DIAGONAL_HAMILTONIAN',dimension,diagonal:[0,...energies],vacuumIndex:0,weights:s.weights.slice(),hbar:s.hbar,declaredLowerBound:s.delta,assumptionId:s.assumptionId},gap,channelMass,channelMassInequality:'Delta <= actual finite-H gap <= channel mass; a channel can miss the lowest excitation.',samples,assumptions:[{id:s.assumptionId,statement:'This finite diagonal Hamiltonian and this positive spectral channel measure are explicitly constructed model choices, not inferred from the rendered 4D classical field.'}],finiteSemigroup:'exp(-tH/hbar) is constructed from the displayed diagonal energies for t>=0; finite sums require no limit exchange.',continuumAssumptionsRequired:['A specified self-adjoint nonnegative Hamiltonian on a Hilbert space with a normalized vacuum.','A projection off the full vacuum subspace, with spectral support on [Delta,infinity).','For a bounded O, C(t)=<v,exp(-tH/hbar)v>, v=(I-P0)O Omega; the spectral measure is finite positive.','For unbounded operators, specify a common invariant domain and finite vector norms before using this formula.','Four-dimensional quantum Yang-Mills reconstruction, continuum and infinite-volume limits are separate hypotheses and not implemented here.'],scope:'EXACTLY_SPECIFIED_FINITE_MODEL_WITH_FLOAT64_EVALUATION; NO_QUANTUM_YM_EXISTENCE_CLAIM'};
}

return {canonical,sha256,normalizeFamily,createStateFamily,stateFamilyDescriptor,finiteSpectralModel};
})();
const __m1_13 = (()=>{
const {requireCondition} = __m1_10;
const {evaluateField,bpstMarginal,simpson} = __m1_11;
function intervals(x,n,name){requireCondition(Array.isArray(x)&&x.length===n&&x.every(v=>Array.isArray(v)&&v.length===2&&v.every(w=>Number.isFinite(w)&&Math.abs(w)<=1e4)&&v[0]<v[1]),'OBSERVATION_BOUNDS',`${name} needs ${n} finite ordered intervals.`);return x.map(v=>v.slice());}
function det3(a){return a[0][0]*(a[1][1]*a[2][2]-a[1][2]*a[2][1])-a[0][1]*(a[1][0]*a[2][2]-a[1][2]*a[2][0])+a[0][2]*(a[1][0]*a[2][1]-a[1][1]*a[2][0]);}
function normalizeObservation(s,fieldSpec){
 requireCondition(s&&typeof s==='object','OBSERVATION_REQUIRED','Specify a slice, marginal or actual 3x4 linear observation.','input.observation');
 requireCondition(['SLICE','FINITE_MARGINAL','BPST_INFINITE_MARGINAL','LINEAR_PROJECTION'].includes(s.kind),'OBSERVATION_NOT_IMPLEMENTED','Unsupported observation construction.');
 requireCondition(['actionDensity','topologicalDensity','curvatureNormSquared'].includes(s.quantity),'OBSERVATION_QUANTITY','Choose a gauge-invariant density. Connection components are not accepted as an invariant scalar.');
 requireCondition(Number.isInteger(s.samplesPerAxis)&&s.samplesPerAxis>=2&&s.samplesPerAxis<=13,'OBSERVATION_GRID','samplesPerAxis must be an integer from 2 through 13.');
 const out={kind:s.kind,quantity:s.quantity,samplesPerAxis:s.samplesPerAxis,bounds:intervals(s.bounds,s.kind==='LINEAR_PROJECTION'?4:3,'observation.bounds')};
 if(s.kind==='SLICE'){requireCondition(Number.isFinite(s.slice),'SLICE_COORDINATE','Explicit x4 slice is required.');out.slice=s.slice;}
 if(s.kind==='FINITE_MARGINAL'){out.fibre=intervals([s.fibre],1,'observation.fibre')[0];requireCondition(Number.isInteger(s.panels)&&s.panels>=4&&s.panels<=64&&s.panels%2===0,'MARGINAL_QUADRATURE_BUDGET','Finite marginal panels must be an even number in 4..64.');out.panels=s.panels;}
 if(s.kind==='BPST_INFINITE_MARGINAL')requireCondition(fieldSpec.kind==='EMBEDDED_BPST','MARGINAL_FORMULA_MODEL_MISMATCH','The infinite closed marginal formula is only valid for unperturbed embedded BPST.');
 if(s.kind==='LINEAR_PROJECTION'){
  requireCondition(Array.isArray(s.matrix)&&s.matrix.length===3&&s.matrix.every(v=>Array.isArray(v)&&v.length===4&&v.every(x=>Number.isFinite(x)&&Math.abs(x)<=10)),'PROJECTION_MATRIX','A finite 3x4 matrix with entries in [-10,10] is required.');
  const kernel=Array.from({length:4},(_,j)=>((-1)**j)*det3(s.matrix.map(row=>row.filter((v,k)=>j!==k)))),norm=Math.hypot(...kernel);requireCondition(norm>1e-10,'PROJECTION_RANK','The observation matrix must have row rank 3.');out.matrix=s.matrix.map(v=>v.slice());out.fibreKernelDirection=kernel.map(v=>v/norm);
 }
 if(fieldSpec.domain.kind==='R4_WINDOW'){
  const d=fieldSpec.domain.bounds;for(let i=0;i<out.bounds.length;i++)requireCondition(out.bounds[i][0]>=d[i][0]&&out.bounds[i][1]<=d[i][1],'OBSERVATION_OUTSIDE_WINDOW','Observation samples must lie inside the recorded R4 window.');
  if(s.kind==='SLICE')requireCondition(s.slice>=d[3][0]&&s.slice<=d[3][1],'SLICE_OUTSIDE_WINDOW','Slice lies outside the recorded observation window.');
  if(s.kind==='FINITE_MARGINAL')requireCondition(out.fibre[0]>=d[3][0]&&out.fibre[1]<=d[3][1],'MARGINAL_OUTSIDE_WINDOW','The finite marginal interval must lie inside the recorded window.');
 }
 return out;
}
function observationCost(s){const samples=s.samplesPerAxis**(s.kind==='LINEAR_PROJECTION'?4:3),evaluations=s.kind==='FINITE_MARGINAL'?samples*(s.panels+1):s.kind==='BPST_INFINITE_MARGINAL'?0:samples;return {samples,evaluations};}
function cartesian(bounds,n){let rows=[[]];for(const [a,b] of bounds){const next=[];for(const row of rows)for(let j=0;j<n;j++)next.push([...row,a+(b-a)*j/(n-1)]);rows=next;}return rows;}
function sampleObservation(state,observation){
 const field=state.field,g=field.group,s=field.spec,o=normalizeObservation(observation,s),grid=cartesian(o.bounds,o.samplesPerAxis),samples=[],points=[],lengthFactor=state.lengthDisplayFactor,integrated=o.kind.includes('MARGINAL'),densityScale=integrated?lengthFactor**3:lengthFactor**4;
 for(let i=0;i<grid.length;i++){
  const p=grid[i];let value,position,x4=null,source;
  if(o.kind==='SLICE'){x4=[...p,o.slice];const r=evaluateField(field,x4);value=r.density[o.quantity];position=p;source={x4,density:r.density};}
  else if(o.kind==='LINEAR_PROJECTION'){x4=p;const r=evaluateField(field,x4);value=r.density[o.quantity];position=o.matrix.map(row=>row.reduce((v,w,j)=>v+w*p[j],0));source={x4,density:r.density};}
  else if(o.kind==='FINITE_MARGINAL'){
   value=simpson(t=>evaluateField(field,[...p,t]).density[o.quantity],o.fibre[0],o.fibre[1],o.panels);position=p;source={x3:p,fibre:{coordinate:3,interval:o.fibre,panels:o.panels,rule:'composite Simpson'},integratedQuantity:o.quantity,value};
  }else{value=bpstMarginal(g,s.rho,p,s.center.slice(0,3));if(o.quantity==='actionDensity')value*=8*Math.PI**2/s.coupling.g**2;else if(o.quantity==='curvatureNormSquared')value*=8*Math.PI**2;position=p;source={x3:p,fibre:{coordinate:3,domain:'R',center:s.center[3]},integratedQuantity:o.quantity,value,formulaStatus:'THEOREM_REFERENCE with independent matrix quadrature checked in evidence'};}
  samples.push(source);points.push({pos:position.map(v=>v/lengthFactor),value:value*densityScale,label:`${o.quantity} #${i}`,sourceIndex:i});
 }
 const descriptions={SLICE:`Actual pullback to x4=${o.slice}; scalar values are evaluated from the recorded 4D matrix curvature.`,LINEAR_PROJECTION:'The displayed point is P x for the explicit rank-three 3x4 matrix. Every 4D source coordinate and scalar sample is retained.',FINITE_MARGINAL:'Each displayed value is the finite integral of a gauge-invariant density along x4, using the recorded quadrature and interval.',BPST_INFINITE_MARGINAL:'The analytic infinite x4 integral of the embedded BPST scalar density; Dynkin index and length^-3 units are explicit.'};
 return {observation:o,sourceSamples:samples,visualization:{points,lines:[],axes:[0,1,2].map(i=>({label:o.kind==='LINEAR_PROJECTION'?`(P x)${i+1}`:`x${i+1}`,unit:s.units.length,direction:[+(i===0),+(i===1),+(i===2)]})),description:descriptions[o.kind]+(s.domain.kind==='PERIODIC_TORUS'?' Coordinates are lift coordinates of the periodic source; points separated by a period represent the same torus point.':''),coordinateMeaning:o.kind==='LINEAR_PROJECTION'?'P:R4 -> R3, shown in the declared display length unit':'The first three physical coordinates, expressed in the declared display length unit',valueMeaning:`${o.quantity}${integrated?' integrated along x4':''}`,valueUnits:`${s.units.length}^-${integrated?3:4}`,lostInformation:o.kind==='SLICE'?['Values away from the selected x4 slice','The slice alone cannot reconstruct a 4D connection or a quantum state']:o.kind==='LINEAR_PROJECTION'?['Position along each affine fibre x+ker(P)','Overlapping displayed points can have distinct 4D positions and field values','A 3D projection does not transfer a mass-gap theorem']:['The profile along the integrated x4 fibre','Gauge-dependent connection data',...(o.kind==='FINITE_MARGINAL'?['Tail outside the finite integration interval is omitted and is not bounded for an arbitrary off-shell field']:[])],normalization:{dynkinIndex:g.index,lengthDisplayFactor:lengthFactor,densityScale},sourceDimension:4,displayDimension:3},cost:observationCost(o)};
}

return {normalizeObservation,observationCost,sampleObservation};
})();
const __m1_14 = (()=>{
const M = __m1_7;
const {requireCondition,groupElementResidual} = __m1_10;
const {evaluateJet,transformedJet,gaugeAt,normalizeGauge} = __m1_11;
function normalizePath(path){requireCondition(Array.isArray(path)&&path.length>=2&&path.length<=33&&path.every(p=>Array.isArray(p)&&p.length===4&&p.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e4)),'PATH_REQUIRED','A piecewise linear path needs 2..33 explicit 4D vertices.','input.path');return path.map(p=>p.slice());}
function linkTransport(field,x,y,steps,{gauge=null}={}){
 requireCondition(Number.isInteger(steps)&&steps>=1&&steps<=256,'HOLONOMY_STEPS','Midpoint steps per edge must be 1..256.');let u=M.identity(field.group.matrixDimension);const dx=y.map((v,j)=>(v-x[j])/steps);
 for(let k=0;k<steps;k++){const p=x.map((v,j)=>v+(k+.5)*dx[j]),A=gauge?transformedJet(field,p,gauge,{order:0}).A:evaluateJet(field,p,{order:0}).A,h=M.matrix(u.n);for(let mu=0;mu<4;mu++)M.addTo(h,A[mu],dx[mu]);u=M.multiply(u,M.exponential(h));}
 return u;
}
function pathHolonomy(field,path,steps,{gauge=null}={}){path=normalizePath(path);let product=M.identity(field.group.matrixDimension);const links=[];for(let i=0;i<path.length-1;i++){const u=linkTransport(field,path[i],path[i+1],steps,{gauge});links.push(u);product=M.multiply(product,u);}return {matrix:product,links};}
function wilsonLoop(field,path,{steps=16,gauge={generator:0,wave:[0.2,-0.1,0.3,0.15],amplitude:0.4,phase:0.2}}={}){
 path=normalizePath(path);requireCondition(Number.isInteger(steps)&&steps>=1&&steps<=128,'HOLONOMY_REFINEMENT_BUDGET','For two-level convergence, base steps must be 1..128.');const closed=path[0].every((v,j)=>v===path.at(-1)[j]);gauge=normalizeGauge(field.group,gauge);
 const coarse=pathHolonomy(field,path,steps),fine=pathHolonomy(field,path,2*steps),transformed=pathHolonomy(field,path,2*steps,{gauge});const omegas=path.map(x=>gaugeAt(field,x,gauge).u);
 let discrete=M.identity(field.group.matrixDimension),maxLinkMembership=0;
 for(let i=0;i<fine.links.length;i++){const l=fine.links[i],lp=M.multiply(M.multiply(omegas[i],l),M.dagger(omegas[i+1]));discrete=M.multiply(discrete,lp);maxLinkMembership=Math.max(maxLinkMembership,groupElementResidual(field.group,l).max);}
 const expected=M.multiply(M.multiply(omegas[0],fine.matrix),M.dagger(omegas.at(-1))),trace=M.trace(fine.matrix),d=field.group.matrixDimension,normalizedRealTrace=trace.re/d;
 const beta=2*d*field.group.metricTraceFactor/field.spec.coupling.g**2,tw=M.trace(discrete),tc=M.trace(transformed.matrix);
 return {path,closed,stepsPerEdge:steps,refinedStepsPerEdge:2*steps,orientation:'U_xy maps the fibre at y to x; midpoint ordered products exp(+A_mu dx_mu); U_xy -> Omega_x U_xy Omega_y^dagger',matrix:M.jsonMatrix(fine.matrix),links:fine.links.map(M.jsonMatrix),normalizedTrace:{re:normalizedRealTrace,im:trace.im/d},wilsonPlaquetteTerm:closed?beta*(1-normalizedRealTrace):null,beta,normalization:'beta=2 dim(R) c/g^2 when B=-c ReTr_R; this is the stated basic-form convention',gaugeInvariantObservable:closed?'normalized closed Wilson trace':'NONE: open-path trace is not gauge invariant',membership:groupElementResidual(field.group,fine.matrix),maxLinkMembership,convergence:{matrixDifference:M.distance(coarse.matrix,fine.matrix),normalizedTraceDifference:Math.abs(M.trace(coarse.matrix).re/d-normalizedRealTrace),interpretation:'two midpoint resolutions; no certified continuum error bound'},gaugeCheck:{spec:gauge,discreteEndpointCovariance:M.distance(discrete,expected),continuumConnectionIntegrationCovariance:M.distance(transformed.matrix,expected),closedDiscreteTraceDifference:closed?Math.hypot(tw.re-trace.re,tw.im-trace.im)/d:null,closedContinuumTraceDifference:closed?Math.hypot(tc.re-trace.re,tc.im-trace.im)/d:null},scope:'Finite deterministic transport of the specified classical field. This is not a sampled quantum Wilson ensemble.'};
}
function plaquettePath(origin,mu,nu,spacing){requireCondition(Array.isArray(origin)&&origin.length===4&&origin.every(Number.isFinite)&&Number.isInteger(mu)&&Number.isInteger(nu)&&mu>=0&&nu>=0&&mu<4&&nu<4&&mu!==nu&&Number.isFinite(spacing)&&spacing>0,'PLAQUETTE_INPUT','An origin, two distinct axes and positive spacing are required.');const p=origin.slice(),q=origin.slice(),r=origin.slice();p[mu]+=spacing;q[mu]+=spacing;q[nu]+=spacing;r[nu]+=spacing;return [origin.slice(),p,q,r,origin.slice()];}

return {normalizePath,linkTransport,pathHolonomy,wilsonLoop,plaquettePath};
})();
const __m1_15 = (()=>{
/** MathScope M1 gauge facade. Pure bounded worker API; JSON-safe output. */
const M = __m1_7;
const {GaugeInputError,requireCondition,normalizeGroupSpec,createGroup,availableGroups,groupDescriptor,detailedDescriptor,verifyGroup} = __m1_10;
const {createField,normalizeFieldSpec,verifyFieldAt,verifyDensityQuadrature,evaluateField,normalizeGauge,bpstBallMass,verifyCoordinateCurvature,verifyPeriodicSeam,normalizeFieldGauge} = __m1_11;
const {normalizeFamily,createStateFamily,canonical,sha256,stateFamilyDescriptor,finiteSpectralModel} = __m1_12;
const {normalizeObservation,observationCost,sampleObservation} = __m1_13;
const {normalizePath,wilsonLoop,plaquettePath} = __m1_14;
const KINDS=['gauge.group','gauge.field','gauge.family','gauge.holonomy','gauge.spectral'];
const SOURCES=[{"id":"YM-R01","title":"Quantum Yang–Mills Theory / Yang–Mills & the Mass Gap","authors":"Arthur Jaffe; Edward Witten; Clay Mathematics Institute","url":"https://www.claymath.org/wp-content/uploads/2022/06/yangmills.pdf","locator":"인쇄 p. 6 §4: 존재·스펙트럼 간극 정의; p. 7 §5: 부피에 균일한 간극과 무한 부피 문제","status":"THEOREM_REFERENCE","role":"compact simple G, nontrivial R⁴ quantum theory, QFT axioms, positive spectral gap의 동시 요구. 현재 공식 상태 Unsolved.","leanImport":null,"kernelReceipt":null},{"id":"YM-R02","title":"Math 210C. Compact Lie Groups","authors":"Brian Conrad; Aaron Landesman","url":"https://math.stanford.edu/~conrad/210CPage/handouts/lie_groups_notes.pdf","locator":"§§17–18 pp.75–83; §26 p.114 이하; Appendices K,V,Y","status":"THEOREM_REFERENCE","role":"rank-one subgroup, character/cocharacter lattice, normal subgroup, global group center/fundamental group를 분리하는 구조 설계","leanImport":null,"kernelReceipt":null},{"id":"YM-R05","title":"Matter representations from geometry: under the spell of Dynkin","authors":"Mboyo Esole; Monica Jinwoo Kang","url":"https://arxiv.org/pdf/2012.13401","locator":"§2.5 pp.15–16(현재 PDF 페이지 16), Dynkin index of an embedding","status":"THEOREM_REFERENCE","role":"기본 불변형의 정규화에 대한 Lie algebra embedding index. 본 설계의 B_G(ιX,ιY)=IιB_SU2(X,Y) convention을 독립 명시.","leanImport":null,"kernelReceipt":null},{"id":"YM-R06","title":"Lectures on instantons","authors":"Stefan Vandoren; Peter van Nieuwenhuizen","url":"https://arxiv.org/pdf/0802.1862","locator":"§2 pp.7–13; eqs.(2.12)–(2.15) BPST, eq.(2.20) SU(N) embedding","status":"THEOREM_REFERENCE","role":"anti-Hermitian SU(2) conventions, BPST A/F와 밀도, SU(N) embedding 기준. 정확 marginal 식은 이 밀도를 적분한 설계 계산.","leanImport":null,"kernelReceipt":null},{"id":"YM-R07","title":"Gauge Theory — Chapter 4: Lattice Gauge Theory","authors":"David Tong","url":"https://davidtong.org/pdfs/teaching/gauge-theory/gauge4.pdf","locator":"§4.1; 인쇄 p.202 이하; link gauge transform eq.(4.8)","status":"THEOREM_REFERENCE","role":"4D Euclidean lattice, group links, Wilson loops와 작용 및 격자 cutoff의 의미","leanImport":null,"kernelReceipt":null},{"id":"YM-R08","title":"Construction of a selfadjoint, strictly positive transfer matrix for Euclidean lattice gauge theories","authors":"Martin Lüscher","url":"https://link.springer.com/article/10.1007/BF01614090","locator":"출판사 초록과 서지사항; 실제 선택한 모델의 가정 대응은 Y4-06/Y7-06의 후속 작업","status":"THEOREM_REFERENCE","role":"Wilson lattice gauge theory의 physical positivity와 transfer matrix 구성 근거","leanImport":null,"kernelReceipt":null},{"id":"YM-R09","title":"Gauge field theories on a lattice","authors":"Konrad Osterwalder; Erhard Seiler","url":"https://www.sciencedirect.com/science/article/abs/pii/0003491678900398","locator":"출판사 초록·서지사항; Euclidean lattice construction 및 positivity","status":"THEOREM_REFERENCE","role":"유클리드 격자 gauge theory의 positivity/constructive framework. continuum 존재 증명으로 확장하지 않음.","leanImport":null,"kernelReceipt":null},{"id":"YM-R13","title":"The Lean Language Reference — Axioms","authors":"Lean FRO contributors","url":"https://lean-lang.org/doc/reference/latest/Axioms/","locator":"axiom declaration, consistency 및 #print axioms","status":"THEOREM_REFERENCE","role":"사용자 axiom의 논리적 지위·의존성 감사. 기존 Lean 4.34.1 결과는 로컬 source/hash/log로 별도 증빙.","leanImport":null,"kernelReceipt":null},{"id":"YM-R14","title":"The Octonions","authors":"John C. Baez","url":"https://math.ucr.edu/home/baez/octonions/node14.html","locator":"§4.1 G2; Theorem 4, compact Der(O) subset so(Im O); 7-dimensional faithful representation and invariant cross product","status":"THEOREM_REFERENCE","role":"Compact G2 as octonion automorphisms/positive 3-form stabilizer, not split G2. The generator uses its explicitly documented equivalent Cayley–Dickson convention.","leanImport":null,"kernelReceipt":null},{"id":"YM-R15","title":"Math 249B. Root systems for split classical groups","authors":"Brian Conrad","url":"https://virtualmath1.stanford.edu/~conrad/249BW16Page/handouts/classicalgps.pdf","locator":"§§2–5 (8-page PDF), roots/coroots/character lattices for A/B/C/D; use complexification to connect with the separately constructed compact real form","status":"THEOREM_REFERENCE","role":"Classical root and coroot integer data. This split-algebra reference alone is not a proof of the compact form, which is constructed and checked separately.","leanImport":null,"kernelReceipt":null}];
function jsonSafe(value){if(value===null||typeof value==='string'||typeof value==='boolean')return value;if(typeof value==='number'){requireCondition(Number.isFinite(value),'NONFINITE_RESULT','Calculation left the finite Float64 domain.');return Number.isInteger(value)&&!Number.isSafeInteger(value)?{kind:'FLOAT64',value}:value;}if(typeof value==='bigint')return value.toString();if(ArrayBuffer.isView(value))return Array.from(value,jsonSafe);if(Array.isArray(value))return value.map(jsonSafe);if(typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k,jsonSafe(v)]));return null;}
function normalizePrecision(p){if(p===undefined)p={mode:'FLOAT64',tolerance:1e-9};requireCondition(p&&['FLOAT64','EXACT_RATIONAL_WITH_FLOAT64'].includes(p.mode),'PRECISION_MODE','Gauge field arithmetic is Float64; exact rational mode verifies the finite algebra table separately.');requireCondition(Number.isFinite(p.tolerance)&&p.tolerance>=1e-12&&p.tolerance<=1e-3,'TOLERANCE_BOUNDS','Tolerance must be in [1e-12,1e-3].');return {mode:p.mode,tolerance:p.tolerance};}
function normalizeBudget(b){b=b??{maxSamples:2200,maxEvaluations:12000,maxMatrixDimension:8};for(const [k,min,max] of [['maxSamples',1,5000],['maxEvaluations',1,50000],['maxMatrixDimension',2,8]])requireCondition(Number.isInteger(b[k])&&b[k]>=min&&b[k]<=max,'JOB_BUDGET',`${k} must be an integer in [${min},${max}].`,`budget.${k}`);return {maxSamples:b.maxSamples,maxEvaluations:b.maxEvaluations,maxMatrixDimension:b.maxMatrixDimension};}
function validateRequest(request){try{
 requireCondition(request&&typeof request==='object'&&KINDS.includes(request.kind),'GAUGE_JOB_KIND','Unsupported gauge job kind.');requireCondition(request.input&&typeof request.input==='object','JOB_INPUT_REQUIRED','Job input is required.');
 const precision=normalizePrecision(request.precision),budget=normalizeBudget(request.budget),input=request.input;let normalizedInput,cost={samples:0,evaluations:0};
 if(request.kind==='gauge.spectral'){finiteSpectralModel(input.model);normalizedInput={model:structuredClone(input.model)};cost={samples:input.model.times.length,evaluations:input.model.times.length*input.model.offsets.length};}
 else{
  const groupSpec=normalizeGroupSpec(input.group),group=createGroup(groupSpec);requireCondition(group.matrixDimension<=budget.maxMatrixDimension,'MATRIX_DIMENSION_BUDGET','The requested actual representation exceeds the matrix-dimension budget.');normalizedInput={group:groupSpec};
  if(request.kind==='gauge.group'){normalizedInput.exact=input.exact??true;requireCondition(typeof normalizedInput.exact==='boolean','EXACT_FLAG','exact must be a boolean.');}
  else{
   const fieldSpec=normalizeFieldSpec(group,input.field),familySpec=normalizeFamily(input.family);normalizedInput.field=fieldSpec;normalizedInput.family=familySpec;
   // Validation uses the same physical-scale rule as the asynchronous normalizer, before sampling.
   const observationField=structuredClone(fieldSpec);if(familySpec.mode==='CLASSICAL_SCALE'&&observationField.domain.kind==='PERIODIC_TORUS'){const lambda=familySpec.delta/familySpec.referenceDelta;observationField.domain.periods=observationField.domain.periods.map(v=>v/lambda);}
   if(familySpec.mode==='EFFECTIVE_MODEL')requireCondition(fieldSpec.domain.kind==='R4_WINDOW','EFFECTIVE_TORUS_RULE_REQUIRED','Effective-model torus volume rule is not implemented.');
   if(familySpec.mode==='CLASSICAL_SCALE'||familySpec.mode==='EFFECTIVE_MODEL'){
 const factor=familySpec.mode==='CLASSICAL_SCALE'?familySpec.referenceDelta/familySpec.delta:null;
 if(observationField.rho!==null)observationField.rho=factor===null?familySpec.rhoOverEll*fieldSpec.units.hbarC/familySpec.delta:observationField.rho*factor;
 if(observationField.perturbation)observationField.perturbation.length=factor===null?fieldSpec.units.hbarC/familySpec.delta:observationField.perturbation.length*factor;
 normalizeFieldSpec(group,observationField);
 }
   if(request.kind==='gauge.holonomy'){
    normalizedInput.path=normalizePath(input.path);requireCondition(Number.isInteger(input.steps)&&input.steps>=1&&input.steps<=128,'HOLONOMY_STEPS','Explicit midpoint steps per edge must be 1..128.');normalizedInput.steps=input.steps;normalizedInput.gauge=normalizeFieldGauge(group,observationField,input.gauge);cost={samples:input.path.length,evaluations:(input.path.length-1)*input.steps*5};
   }else{
    normalizedInput.observation=normalizeObservation(input.observation,observationField);cost=observationCost(normalizedInput.observation);
    if(request.kind==='gauge.family'){
     requireCondition(Array.isArray(input.compareDeltas)&&input.compareDeltas.length>=2&&input.compareDeltas.length<=8&&input.compareDeltas.every(x=>Number.isFinite(x)&&x>=1e-4&&x<=1e4),'FAMILY_COMPARISON_VALUES','Supply 2..8 comparison Delta values in [1e-4,1e4].');requireCondition(Array.isArray(input.probe)&&input.probe.length===4&&input.probe.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e4),'FAMILY_PROBE','An explicit four-coordinate probe is required.');normalizedInput.compareDeltas=input.compareDeltas.slice();normalizedInput.probe=input.probe.slice();
     for(const delta of normalizedInput.compareDeltas)if(familySpec.mode==='CLASSICAL_SCALE'||familySpec.mode==='EFFECTIVE_MODEL'){
      const selected=structuredClone(fieldSpec),factor=familySpec.mode==='CLASSICAL_SCALE'?familySpec.referenceDelta/delta:null;
      if(selected.rho!==null)selected.rho=factor===null?familySpec.rhoOverEll*fieldSpec.units.hbarC/delta:selected.rho*factor;
      if(selected.perturbation)selected.perturbation.length=factor===null?fieldSpec.units.hbarC/delta:selected.perturbation.length*factor;
      normalizeFieldSpec(group,selected);
     }cost.evaluations+=input.compareDeltas.length;
    }
    normalizedInput.verify={field:input.verify?.field??true,densityQuadrature:input.verify?.densityQuadrature??false};requireCondition(Object.values(normalizedInput.verify).every(x=>typeof x==='boolean'),'VERIFY_FLAGS','Verification flags must be boolean.');if(normalizedInput.verify.field)cost.evaluations+=52;if(normalizedInput.verify.densityQuadrature){requireCondition(fieldSpec.kind==='EMBEDDED_BPST','QUADRATURE_REFERENCE_NOT_AVAILABLE','The independent closed-density reference check is available only for pure BPST.');cost.evaluations+=1540;}
   }
  }
 }
 requireCondition(cost.samples<=budget.maxSamples,'SAMPLE_BUDGET_EXCEEDED',`Requested ${cost.samples} samples exceed maxSamples=${budget.maxSamples}; there is no silent downsampling.`);requireCondition(cost.evaluations<=budget.maxEvaluations,'EVALUATION_BUDGET_EXCEEDED',`Estimated ${cost.evaluations} field/scalar evaluations exceed maxEvaluations=${budget.maxEvaluations}.`);
 return {ok:true,normalizedRequest:{kind:request.kind,input:normalizedInput,precision,budget},estimate:cost};
 }catch(e){return {ok:false,errors:[{code:e.code??'INVALID_REQUEST',message:e.message,path:e.path??null}]};}}
async function runJob(request){
 const validation=validateRequest(request);if(!validation.ok)throw new GaugeInputError(validation.errors[0].code,validation.errors[0].message,validation.errors[0].path);
 const req=validation.normalizedRequest,start=performance.now(),{kind,input,precision}=req;let result;
 if(kind==='gauge.spectral'){
  const finite=finiteSpectralModel(input.model);result={group:null,groupSpec:null,fieldSpec:null,stateFamilySpec:null,spectral:finite,visualization:{points:[],lines:[],axes:[],description:'This is a finite diagonal spectral model, with no associated 4D Yang-Mills field or spatial 3D geometry.',coordinateMeaning:'Spectral time and energy are displayed in the numeric table.',lostInformation:[]},models:{kind:'FINITE_DIAGONAL_SPECTRAL_MODEL',quantumYangMills:false}};
 }else{
  const group=createGroup(input.group),descriptor=detailedDescriptor(group),groupSpec=groupDescriptor(group);result={group:descriptor,groupSpec,normalizedGroupInput:input.group};if(precision.mode==='EXACT_RATIONAL_WITH_FLOAT64'&&kind!=='gauge.group')result.groupVerification=verifyGroup(group,{exact:true,tolerance:precision.tolerance});
  if(kind==='gauge.group'){
   result.verification=verifyGroup(group,{exact:input.exact,tolerance:precision.tolerance});result.exactAlgebra={basis:group.data.basis,structureConstants:group.data.structureConstants,gram:group.data.gram,chevalley:group.data.chevalley,octonions:group.data.octonions??null};result.models={kind:'CONSTRUCTED_COMPACT_MATRIX_LIE_ALGEBRA',quantumYangMills:false};result.visualization={points:[],lines:[],axes:[],description:'Actual finite matrix algebra, exact root datum and full Chevalley table are returned. Root rank greater than three is not placed into an arbitrary 3D cloud.',coordinateMeaning:'Exact matrices, integer roots and bracket tables; no fictitious spatial coordinates.',lostInformation:[]};
  }else{
   const state=await createStateFamily(group,input.field,input.family);result.fieldSpec=state.fieldSpec;result.baseFieldSpec=state.baseFieldSpec;result.familySpec=state.familySpec;result.assumptionRecords=state.assumptionRecords;result.stateFamilySpec=stateFamilyDescriptor(group,state);result.hashes={physicalField:state.physicalFieldHash,basePhysicalField:state.basePhysicalFieldHash,display:state.displayHash,assumptions:state.assumptionHash};result.stateMeaning={interpretation:state.interpretation,fieldChanged:state.fieldChanged,displayTransform:state.displayTransform,modelAssumptions:state.modelAssumptions,quantumState:false};result.selectedEmbedding=state.fieldSpec.embedding?{...state.field.group.selectedEmbedding}:null;result.models={kind:state.fieldSpec.scope,fieldConstruction:state.fieldSpec.kind,deltaRole:state.familySpec.mode,quantumYangMills:false};
   if(kind==='gauge.holonomy'){
    const loop=wilsonLoop(state.field,input.path,{steps:input.steps,gauge:input.gauge});result.holonomy=loop;result.visualization={points:input.path.map((p,i)=>({pos:p.slice(0,3).map(v=>v/state.lengthDisplayFactor),label:`path vertex ${i}`,sourceIndex:i})),lines:[{points:input.path.map(p=>p.slice(0,3).map(v=>v/state.lengthDisplayFactor))}],axes:[{label:'x1'},{label:'x2'},{label:'x3'}],description:'First-three-coordinate projection of the actual specified four-dimensional transport path. Holonomy is evaluated along its full 4D vertices.',coordinateMeaning:'P(x1,x2,x3,x4)=(x1,x2,x3), expressed in the display length unit',lostInformation:['The x4 coordinate of each vertex is present in holonomy.path but absent from this spatial projection','Holonomy matrices are not reconstructible from the projected curve alone']};result.sourceSamples=input.path.map(x=>({x4:x}));
   }else{
    Object.assign(result,sampleObservation(state,input.observation));
    if(input.verify.field){const center=state.fieldSpec.center,ell=state.fieldSpec.rho??state.fieldSpec.perturbation.length,x=center.map((v,i)=>v+[0.2,-0.3,0.4,0.1][i]*ell);result.verification=verifyFieldAt(state.field,x,{h:1e-3*ell});result.verification.coordinateCurvature=verifyCoordinateCurvature(state.field,x);if(state.fieldSpec.domain.kind==='PERIODIC_TORUS')result.verification.periodicSeam=verifyPeriodicSeam(state.field,x);}
    if(input.verify.densityQuadrature)result.densityQuadrature=verifyDensityQuadrature(state.field,{panels:256,x3:state.fieldSpec.center.slice(0,3).map((v,i)=>v+[0.4,-0.2,0.3][i]*state.fieldSpec.rho)});
    if(state.fieldSpec.kind==='EMBEDDED_BPST'){const rho=state.fieldSpec.rho,R=5*rho,selectedGroup=state.field.group,inscribedRadius=Math.max(0,Math.min(...state.fieldSpec.domain.bounds.flatMap((b,j)=>[state.fieldSpec.center[j]-b[0],b[1]-state.fieldSpec.center[j]]))),tail=selectedGroup.index-bpstBallMass(selectedGroup,rho,inscribedRadius);result.topology={dynkinIndex:selectedGroup.index,chargeOnR4:selectedGroup.index,actionOnR4:8*Math.PI**2*selectedGroup.index/state.fieldSpec.coupling.g**2,windowTail:{inscribedBallRadius:inscribedRadius,omittedChargeUpperBound:tail,omittedActionUpperBound:8*Math.PI**2*tail/state.fieldSpec.coupling.g**2,method:'positivity of pure BPST density and an inscribed 4D ball; this is a conservative bound for the rectangular window'},finiteBall:{radius:R,charge:bpstBallMass(selectedGroup,rho,R),omittedPositiveTail:selectedGroup.index-bpstBallMass(selectedGroup,rho,R)},status:'CLASSICAL_BPST_REFERENCE_FORMULA; infinite integrals are not Lean-proved by finite sample checks'};}
    if(kind==='gauge.family'){
     result.comparison=[];for(const delta of input.compareDeltas){const other=await createStateFamily(group,input.field,{...input.family,delta});const at=evaluateField(other.field,input.probe);result.comparison.push({delta,probe:input.probe,physicalFieldHash:other.physicalFieldHash,displayHash:other.displayHash,assumptionHash:other.assumptionHash,rho:other.fieldSpec.rho,trialLength:other.fieldSpec.perturbation?.length??null,physicalDensity:at.density,displayDensityScale:other.displayTransform.q4Scale,fieldChangedFromBase:other.fieldChanged});}
     result.comparisonInterpretation='Hashes identify the full normalized G and source construction, not a gauge-orbit canonical form. ASSUMED_BOUND and UNITS preserve the physical source hash; actual scale/effective rules recompute it.';
    }
   }
  }
 }
 return jsonSafe({schema:'MathScope.M1.GaugeResult/1',status:'COMPLETED',kind,request:req,requestHash:await sha256(req),estimate:validation.estimate,...result,references:SOURCES,proofBoundary:{finiteAlgebra:'Exact rational construction; selected finite statements additionally checked by the shipped Lean source audit.',numericalFields:'Float64 evaluation of explicit classical connections, with independent checks as recorded.',continuumQuantumYM:'NOT_CONSTRUCTED_NOT_PROVED',externalReferences:'THEOREM_REFERENCE is separate from an imported Lean theorem or a kernel audit.',browserKernelRerun:false}});
}
function getCapabilities(){return {domain:'gauge',version:'m1-1',kinds:KINDS,supportedGroups:availableGroups(),matrixBounds:{SU:[2,6],SO:[3,5,6,7,8],Sp:[1,3],G2:7},deltaModes:['ASSUMED_BOUND','UNITS','CLASSICAL_SCALE','EFFECTIVE_MODEL'],observations:['SLICE','FINITE_MARGINAL','BPST_INFINITE_MARGINAL','LINEAR_PROJECTION'],fieldConstructions:['EMBEDDED_BPST','FULL_BASIS_TRIAL','BPST_PLUS_PERTURBATION'],boundaries:['R4_WINDOW:OPEN_RESTRICTION','PERIODIC_TORUS:PERIODIC (finite Fourier, trivial bundle)'],unsupported:[{item:'Spin and nontrivial central quotients',reason:'No faithful storage adapter/descended representation has been implemented.'},{item:'F4, E6, E7, E8',reason:'No concrete matrix adapter is shipped; no label-only proxy.'},{item:'SO(4)',reason:'Its Lie algebra is not simple.'},{item:'Quantum Wilson ensemble / empirical gap estimate',reason:'M1 constructs deterministic classical links, not a Gibbs sampler or transfer-matrix continuum limit.'},{item:'Continuum quantum Yang-Mills / OS reconstruction / infinite-volume mass gap',reason:'Separate analytic construction and hypotheses; no existence claim.'}],leanAuditPath:'gauge/lean/lean-audit.json',numericArithmetic:'Float64 with explicit tolerance; BigInt rational finite bracket verification',references:SOURCES};}
function baseField(){return {kind:'EMBEDDED_BPST',embedding:'canonical-su2',rho:1,center:[0,0,0,0],gaugeConvention:'D=d+A',coupling:{g:1,normalization:'BASIC_FORM'},domain:{kind:'R4_WINDOW',bounds:[[-4,4],[-4,4],[-4,4],[-4,4]],boundary:'OPEN_RESTRICTION'},units:{length:'ell0',hbarC:1},perturbation:null};}
function trial(){return {kind:'GAUSSIAN_POLYNOMIAL',amplitude:0.2,length:1.2,seed:'mathscope-m1-gauge-2026',modes:[[0,0,0,0],[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],[1,1,0,0]]};}
const family=mode=>({mode,delta:1,referenceDelta:1,energyUnits:'hbar*c/ell0',assumptionId:mode==='EFFECTIVE_MODEL'?'effective-rho-gap-choice':'declared-gap-lower-bound',...(mode==='EFFECTIVE_MODEL'?{rhoOverEll:1}: {})});
const observation=()=>({kind:'SLICE',quantity:'actionDensity',samplesPerAxis:7,bounds:[[-2,2],[-2,2],[-2,2]],slice:0});
function getExamples(){
 const precision={mode:'FLOAT64',tolerance:1e-9},budget={maxSamples:2200,maxEvaluations:12000,maxMatrixDimension:8},su3={family:'SU',parameter:3,globalForm:'SIMPLY_CONNECTED',representation:'DEFINING'},g2={family:'G2',parameter:2,globalForm:'ADJOINT',representation:'REAL_7'};
 const request=(kind,input)=>({kind,input,precision:structuredClone(precision),budget:structuredClone(budget)}),fieldInput=(group=su3,mode='ASSUMED_BOUND')=>({group,field:baseField(),family:family(mode),observation:observation(),verify:{field:true,densityQuadrature:false}});
 const a=fieldInput();a.verify.densityQuadrature=true;const b=fieldInput(g2);b.field.kind='BPST_PLUS_PERTURBATION';b.field.perturbation=trial();
 const c=fieldInput({family:'Sp',parameter:2,globalForm:'SIMPLY_CONNECTED',representation:'DEFINING'});c.field.kind='FULL_BASIS_TRIAL';c.field.rho=null;c.field.embedding=null;c.field.perturbation=trial();
 const projected=structuredClone(b);projected.observation={kind:'LINEAR_PROJECTION',quantity:'topologicalDensity',samplesPerAxis:5,bounds:[[-2,2],[-2,2],[-2,2],[-1,1]],matrix:[[1,0,0,0.3],[0,1,0,-0.2],[0,0,1,0.4]]};
 const marginal=fieldInput(g2);marginal.observation={kind:'BPST_INFINITE_MARGINAL',quantity:'topologicalDensity',samplesPerAxis:7,bounds:[[-2,2],[-2,2],[-2,2]]};marginal.verify.densityQuadrature=true;
 const periodic=fieldInput({family:'SO',parameter:3,globalForm:'ADJOINT',representation:'DEFINING'});periodic.field.kind='FULL_BASIS_TRIAL';periodic.field.rho=null;periodic.field.embedding=null;periodic.field.domain={kind:'PERIODIC_TORUS',periods:[4,4,4,4],origin:[-2,-2,-2,-2],boundary:'PERIODIC'};periodic.field.perturbation={...trial(),kind:'FOURIER',modes:[{wave:[1,0,0,0],phase:0,parity:'SIN'},{wave:[0,1,0,0],phase:0.3,parity:'COS'},{wave:[0,0,1,1],phase:0.1,parity:'SIN'}]};
 const examples=[{id:'su3-bpst',label:'SU(3): 실제 BPST 곡률·독립 적분',request:request('gauge.field',a)},{id:'g2-full-color',label:'G2: 실제 7×7 BPST + 전 기저 섭동',request:request('gauge.field',b)},{id:'sp2-full-basis',label:'Sp(2): 전 기저 4D off-shell 장',request:request('gauge.field',c)},{id:'g2-projection',label:'G2: 실제 R4 → R3 선형 투영',request:request('gauge.field',projected)},{id:'g2-marginal',label:'G2: x4 적분 q3 · 지수 정규화',request:request('gauge.field',marginal)},{id:'so3-periodic',label:'SO(3): 주기적 4D Fourier 시험장',request:request('gauge.field',periodic)}];
 for(const mode of ['ASSUMED_BOUND','UNITS','CLASSICAL_SCALE','EFFECTIVE_MODEL']){const input=fieldInput(g2,mode);input.field.kind='BPST_PLUS_PERTURBATION';input.field.perturbation=trial();input.compareDeltas=[0.5,1,2];input.probe=[0.2,-0.3,0.4,0.1];examples.push({id:`delta-${mode.toLowerCase()}`,label:`Δ 상태족: ${mode}`,request:request('gauge.family',input)});}
 const index3=fieldInput(g2);index3.field.embedding='short-root-su2';index3.verify.densityQuadrature=true;examples.push({id:'g2-index-three',label:'G2: short-root SU(2) · Dynkin index 3',request:request('gauge.field',index3)});
 examples.push({id:'g2-wilson',label:'G2: 4D Wilson loop · 게이지 검사',request:request('gauge.holonomy',{group:g2,field:b.field,family:family('ASSUMED_BOUND'),path:plaquettePath([0.2,-0.3,0.1,0.4],0,3,0.4),steps:16,gauge:{generator:4,wave:[0.2,-0.1,0.3,0.15],amplitude:0.4,phase:0.2}})});
 examples.push({id:'finite-spectrum',label:'유한 H: 양의 채널 상관함수 · 조건 범위',request:request('gauge.spectral',{model:{delta:1,offsets:[0,0.4,1.2],weights:[0,0.7,0.3],times:Array.from({length:25},(_,i)=>i/8),hbar:1,assumptionId:'explicit-finite-diagonal-H-model'}})});
 for(const item of availableGroups())examples.push({id:`algebra-${item.id}`,label:`${item.label}: 정확 행렬 · 근 자료 · Chevalley`,request:request('gauge.group',{group:item.spec,exact:true})});
 return examples;
}

return {validateRequest,runJob,getCapabilities,getExamples,createGroup,createField,createStateFamily,evaluateField,verifyGroup,verifyFieldAt,verifyDensityQuadrature,sampleObservation,wilsonLoop,canonical,sha256};
})();
const __m1_16 = (()=>{
/** Real interval arithmetic and finite computation budgets. IEEE-754 endpoints.
 * exp/log enclosures use Taylor/atanh remainders, never Math.exp/log as certificates.
 * A certificate is arithmetic, quadrature, or series-specific; it is not a PDE proof.
 */
class ComputeError extends Error {
  constructor(code, message, detail={}) { super(message); this.name='ComputeError'; this.code=code; this.detail=detail; }
}
const buf=new ArrayBuffer(8), view=new DataView(buf);
function nextUp(x) {
  if(Number.isNaN(x)||x===Infinity) return x;
  if(x===0) return Number.MIN_VALUE;
  view.setFloat64(0,x); let n=view.getBigUint64(0); n=x>0?n+1n:n-1n;
  view.setBigUint64(0,n); return view.getFloat64(0);
}
const nextDown=x=>-nextUp(-x);
const point=x=>{if(!Number.isFinite(x)) throw new ComputeError('PRECISION_REQUIRED','Nonfinite interval input',{x});return [x,x];};
const interval=(lo,hi)=>{if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo>hi)throw new ComputeError('INVALID_INPUT','Invalid interval',{lo,hi});return [lo,hi];};
const arithmeticBox=(lo,hi)=>{if(!Number.isFinite(lo)||!Number.isFinite(hi))throw new ComputeError('PRECISION_REQUIRED','Interval arithmetic overflow; use a higher-precision or logarithmic evaluator');return [lo,hi];};
const iadd=(a,b)=>arithmeticBox(nextDown(a[0]+b[0]),nextUp(a[1]+b[1]));
const ineg=a=>[-a[1],-a[0]];
const isub=(a,b)=>iadd(a,ineg(b));
function imul(a,b){const v=[a[0]*b[0],a[0]*b[1],a[1]*b[0],a[1]*b[1]];return arithmeticBox(nextDown(Math.min(...v)),nextUp(Math.max(...v)));}
function idiv(a,b){if(b[0]<=0&&b[1]>=0)throw new ComputeError('PRECISION_REQUIRED','Divisor enclosure contains zero',{divisor:b});return imul(a,[nextDown(1/b[1]),nextUp(1/b[0])]);}
const iscale=(a,b)=>imul(a,Array.isArray(b)?b:point(b));
function ipow(a,n){if(!Number.isInteger(n)||n<0)throw new ComputeError('INVALID_INPUT','Nonnegative integer exponent required');let out=point(1),b=a;while(n){if(n%2)out=imul(out,b);n=Math.floor(n/2);if(n)b=imul(b,b);}return out;}
const radius=a=>nextUp((a[1]-a[0])/2);
const midpoint=a=>a[0]+(a[1]-a[0])/2;
const maxabs=a=>Math.max(Math.abs(a[0]),Math.abs(a[1]));
const ball=a=>({type:'real-ball',lower:a[0],upper:a[1],midpoint:midpoint(a),radius:radius(a),precisionBits:53,rounding:'outward IEEE-754 operations; elementary functions by bounded series'});
function expScalar(x){
  if(x>709)throw new ComputeError('PRECISION_REQUIRED','exp overflows binary64; use log representation',{x});
  if(x<-746)return [0,Number.MIN_VALUE];
  if(x<-700){const a=expScalar(x/2),b=imul(a,a);return [Math.max(0,b[0]),b[1]];}
  if(x<0)return idiv(point(1),expScalar(-x));
  let k=0,t=x;while(t>.125){t*=.5;k++;}
  let term=point(1),s=point(1);const ti=point(t),N=18;
  for(let n=1;n<=N;n++){term=idiv(imul(term,ti),point(n));s=iadd(s,term);}
  const first=idiv(imul(term,ti),point(N+1));
  const rem=idiv(first,isub(point(1),idiv(ti,point(N+2))));
  s=[Math.max(0,s[0]),nextUp(s[1]+rem[1])];
  for(let i=0;i<k;i++)s=imul(s,s);
  return s;
}
const iexp=a=>[expScalar(a[0])[0],expScalar(a[1])[1]];
function atanhLog(m){
  const y=idiv(isub(m,point(1)),iadd(m,point(1))),y2=imul(y,y);
  let term=y,s=point(0);const N=32;
  for(let n=0;n<N;n++){s=iadd(s,idiv(term,point(2*n+1)));term=imul(term,y2);}
  const rem=idiv(iscale(term,2),imul(point(2*N+1),isub(point(1),y2)));
  return [nextDown(2*s[0]),nextUp(2*s[1]+Math.max(0,rem[1]))];
}
const LOG2=atanhLog(point(2));
function logScalar(x){
  if(!(x>0))throw new ComputeError('INVALID_INPUT','log enclosure needs positive input',{x});
  let k=Math.floor(Math.log2(x)),m=x*2**(-k);
  if(!Number.isFinite(m)){k=-1022;m=x*2**1022;while(m<1){m*=2;k--;}}
  while(m<1){m*=2;k--;}while(m>=2){m*=.5;k++;}
  return iadd(atanhLog(point(m)),iscale(LOG2,k));
}
const ilog=a=>{if(!(a[0]>0))throw new ComputeError('PRECISION_REQUIRED','log interval touches zero',{a});return [logScalar(a[0])[0],logScalar(a[1])[1]];};
const ipower=(a,b)=>iexp(imul(ilog(a),Array.isArray(b)?b:point(b)));
function makeBudget(budget={},hooks={}){
  const started=Date.now();let operations=0;
  const bound=(value,name,fallback,ceiling)=>{
    value=value??fallback;
    if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1)
      throw new ComputeError('INVALID_INPUT',`${name} must be a positive safe integer`);
    return Math.min(ceiling,value);
  };
  const maxOps=bound(budget.maxOperations,'maxOperations',2e6,5e7);
  const maxMs=bound(budget.maxMilliseconds,'maxMilliseconds',20000,120000);
  const maxPoints=bound(budget.maxPoints,'maxPoints',4096,16384);
  return {maxOps,maxMs,maxPoints,tick(n=1){
    if(hooks.isCancelled?.())throw new ComputeError('CANCELLED','Job cancelled');
    if(!Number.isSafeInteger(n)||n<0)throw new ComputeError('INVALID_INPUT','Operation charge must be a nonnegative safe integer');
    if(n>maxOps-operations)throw new ComputeError('RESOURCE_LIMIT','Operation budget exceeded',{operations,requestedCharge:n,maxOps});
    if(Date.now()-started>maxMs)throw new ComputeError('RESOURCE_LIMIT','Time budget exceeded',{maxMs});
    operations+=n;
  },progress(v){hooks.progress?.(v);},snapshot(){return {operations,elapsedMilliseconds:Date.now()-started,maxOperations:maxOps,maxMilliseconds:maxMs,maxPoints};}};
}
function validatePrecision(precision={}){
  const absoluteTolerance=Number(precision.absoluteTolerance??1e-8),relativeTolerance=Number(precision.relativeTolerance??1e-8);
  if(!(absoluteTolerance>0&&relativeTolerance>0)||!Number.isFinite(absoluteTolerance+relativeTolerance))throw new ComputeError('INVALID_INPUT','Positive finite error targets required');
  const bits=precision.bits===undefined?53:precision.bits;
  if(typeof bits!=='number'||!Number.isSafeInteger(bits)||bits<1)throw new ComputeError('INVALID_INPUT','precision.bits must be a positive safe integer');
  if(bits>53)throw new ComputeError('PRECISION_REQUIRED','Browser evaluator provides outward binary64 balls; high precision reference fixtures are computed separately',{requestedBits:bits,availableBits:53});
  if(absoluteTolerance<2e-14)throw new ComputeError('PRECISION_REQUIRED','Target is below this binary64 interval evaluator floor',{absoluteTolerance,minimumAbsoluteTolerance:2e-14});
  return {bits:53,absoluteTolerance,relativeTolerance};
}
function finiteNumber(x,name){x=Number(x);if(!Number.isFinite(x))throw new ComputeError('INVALID_INPUT',`${name} must be finite`);return x;}
function positive(x,name){x=finiteNumber(x,name);if(!(x>0))throw new ComputeError('INVALID_INPUT',`${name} must be positive`);return x;}
function boundedInteger(x,name,lo,hi){x=Number(x);if(!Number.isInteger(x)||x<lo||x>hi)throw new ComputeError('INVALID_INPUT',`${name} must be an integer in [${lo},${hi}]`);return x;}
function integrate(f,a,b,tolerance=1e-10,budget=makeBudget()){
  if(a===b)return {value:0,errorEstimate:0,evaluations:0,certified:false};
  if(a>b){const r=integrate(f,b,a,tolerance,budget);return {...r,value:-r.value};}
  let evaluations=0;
  const ev=x=>{budget.tick();evaluations++;const y=f(x);if(!Number.isFinite(y))throw new ComputeError('PRECISION_REQUIRED','Nonfinite integrand',{x,y});return y;};
  function rec(l,r,fl,fm,fr,old,tol,depth){
    const m=(l+r)/2,lm=(l+m)/2,rm=(m+r)/2,flm=ev(lm),frm=ev(rm),left=(m-l)*(fl+4*flm+fm)/6,right=(r-m)*(fm+4*frm+fr)/6,delta=left+right-old;
    if(depth===0||Math.abs(delta)<=15*tol)return {value:left+right+delta/15,errorEstimate:Math.abs(delta)/15,depthLimited:depth===0};
    const x=rec(l,m,fl,flm,fm,left,tol/2,depth-1),y=rec(m,r,fm,frm,fr,right,tol/2,depth-1);
    return {value:x.value+y.value,errorEstimate:x.errorEstimate+y.errorEstimate,depthLimited:x.depthLimited||y.depthLimited};
  }
  const m=(a+b)/2,fa=ev(a),fm=ev(m),fb=ev(b),r=rec(a,b,fa,fm,fb,(b-a)*(fa+4*fm+fb)/6,tolerance,20);
  return {...r,evaluations,certified:false,method:'adaptive Simpson/Richardson estimate'};
}
// Interval Taylor jets contain Taylor coefficients f^(n)/n!, not raw derivatives.
const jconst=(a,n=4)=>[Array.isArray(a)?a:point(a),...Array.from({length:n},()=>point(0))];
const jvar=(a,n=4)=>[a,point(1),...Array.from({length:n-1},()=>point(0))];
const jadd=(a,b)=>a.map((x,i)=>iadd(x,b[i]));
const jneg=a=>a.map(ineg);
const jsub=(a,b)=>jadd(a,jneg(b));
const jscale=(a,b)=>a.map(x=>iscale(x,b));
function jmul(a,b){return a.map((_,n)=>{let v=point(0);for(let i=0;i<=n;i++)v=iadd(v,imul(a[i],b[n-i]));return v;});}
function jinv(a){const r=[idiv(point(1),a[0])];for(let n=1;n<a.length;n++){let v=point(0);for(let i=1;i<=n;i++)v=iadd(v,imul(a[i],r[n-i]));r.push(ineg(idiv(v,a[0])));}return r;}
const jdiv=(a,b)=>jmul(a,jinv(b));
function jexp(a){const r=[iexp(a[0])];for(let n=1;n<a.length;n++){let v=point(0);for(let i=1;i<=n;i++)v=iadd(v,iscale(imul(a[i],r[n-i]),i));r.push(idiv(v,point(n)));}return r;}
function jlog(a){const inv=jinv(a),r=[ilog(a[0])];for(let n=1;n<a.length;n++){let v=point(0);for(let i=1;i<=n;i++)v=iadd(v,iscale(imul(a[i],inv[n-i]),i));r.push(idiv(v,point(n)));}return r;}
function certifiedSimpson(fBall,fFourth,a,b,tolerance,budget=makeBudget()){
  let cells=0,evaluations=0;const cache=new Map();
  const ev=x=>{const key=String(x);if(cache.has(key))return cache.get(key);budget.tick();evaluations++;const v=fBall(point(x));cache.set(key,v);return v;};
  function rec(l,r,tol,depth){
    budget.tick();cells++;const width=isub(point(r),point(l)),m=(l+r)/2;
    const fm=fBall(iscale(iadd(point(l),point(r)),.5));evaluations++;
    const S=idiv(imul(width,iadd(iadd(ev(l),iscale(fm,4)),ev(r))),point(6));
    const M=maxabs(fFourth(interval(l,r)));
    const e=idiv(imul(ipow(width,5),point(M)),point(2880))[1];
    if((e<=tol&&radius(S)<=tol)||depth===0){if(depth===0&&e>tol)throw new ComputeError('PRECISION_REQUIRED','Certified quadrature subdivision exhausted',{e,tol,l,r});return {box:[nextDown(S[0]-e),nextUp(S[1]+e)],quadrature:e};}
    const x=rec(l,m,tol/2,depth-1),y=rec(m,r,tol/2,depth-1);return {box:iadd(x.box,y.box),quadrature:nextUp(x.quadrature+y.quadrature)};
  }
  const r=rec(a,b,tolerance,18);return {...r,cells,evaluations,method:'interval composite Simpson; fourth derivative enclosure; explicit remainder'};
}
function solveLinear(A,b){
  const n=b.length,M=A.map((r,i)=>[...r,b[i]]);let pivotMin=Infinity,pivotMax=0;
  for(let k=0;k<n;k++){let p=k;for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[p][k]))p=i;
    const v=Math.abs(M[p][k]);if(!(v>1e-15))throw new ComputeError('SINGULAR_SYSTEM','Linear pivot too small',{k,pivot:v});pivotMin=Math.min(pivotMin,v);pivotMax=Math.max(pivotMax,v);[M[k],M[p]]=[M[p],M[k]];
    for(let i=k+1;i<n;i++){const r=M[i][k]/M[k][k];for(let j=k;j<=n;j++)M[i][j]-=r*M[k][j];}
  }
  const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let v=M[i][n];for(let j=i+1;j<n;j++)v-=M[i][j]*x[j];x[i]=v/M[i][i];}
  return {solution:x,pivotMin,pivotRatio:pivotMax/pivotMin,residual:Math.max(...A.map((r,i)=>Math.abs(r.reduce((s,v,j)=>s+v*x[j],0)-b[i])))};
}
function canonical(value){if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')}}`;return JSON.stringify(value);}
async function sha256(value){const bytes=typeof value==='string'?new TextEncoder().encode(value):value;const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}

return {ComputeError,nextUp,nextDown,point,interval,iadd,ineg,isub,imul,idiv,iscale,ipow,radius,midpoint,maxabs,ball,iexp,ilog,ipower,makeBudget,validatePrecision,finiteNumber,positive,boundedInteger,integrate,jconst,jvar,jadd,jneg,jsub,jscale,jmul,jinv,jdiv,jexp,jlog,certifiedSimpson,solveLinear,canonical,sha256};
})();
const __m1_17 = (()=>{
const provenance = {
  "sources": [
    {
      "id": "N00",
      "url": "https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf",
      "attachmentSha256": "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
      "pages": [
        1,
        166
      ]
    },
    {
      "id": "N01",
      "url": "https://openai.com/index/navier-stokes-solution/",
      "publicationDate": "2026-09-08",
      "updateDate": "2026-09-10",
      "retrievedDate": "2026-10-09",
      "status": "ANNOUNCEMENT",
      "claim": "OpenAI reports an analytical and Lean proof for forced alternatives C/D. This record is an attributed publication claim."
    },
    {
      "id": "N02",
      "url": "https://www.claymath.org/news/navier-stokes-announcement/",
      "publicationDate": "2026-09-11",
      "retrievedDate": "2026-10-09",
      "status": "INSTITUTIONAL_ANNOUNCEMENT",
      "claim": "Clay describes the problem as apparently settled and explains that evaluation and attribution follow a deliberate process. No final prize adjudication is inferred."
    },
    {
      "id": "N03",
      "url": "https://github.com/openai/NavierStokesAndEuler",
      "commit": "f9e8bc5b38b6e212696e8a30e3e91517af887bbd"
    },
    {
      "id": "N04",
      "url": "https://www.claymath.org/wp-content/uploads/2022/06/navierstokes.pdf"
    }
  ],
  "lock": {
    "schemaVersion": 1,
    "attachment": {
      "fileName": "01-navier-stokes.pdf",
      "pageCount": 166,
      "sha256": "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
      "title": "Finite Time Blowup for Navier–Stokes",
      "author": "OpenAI",
      "date": "2026-09-08"
    },
    "repository": {
      "url": "https://github.com/openai/NavierStokesAndEuler",
      "commit": "f9e8bc5b38b6e212696e8a30e3e91517af887bbd",
      "toolchain": "leanprover/lean4:v4.34.0-rc2",
      "files": [
        {
          "path": "lean-toolchain",
          "sha256": "8190e75a201741065fe508b28955dd64dd72d090babe5f70ce6848879d68ae88"
        },
        {
          "path": "lakefile.toml",
          "sha256": "97b2804da5b9a2cd0aaf44ce42b7c39e9947beff9d2ac01a11e0d3d867af1c09"
        },
        {
          "path": "lake-manifest.json",
          "sha256": "5ec1dc8e009008d0efb9601cd38f6ba54e753fd538b0e5f8c3e6c5ec72ee1e09"
        },
        {
          "path": "NavierStokes.lean",
          "sha256": "aa93efae7c7d7e44f2bb421d85587e7e9610e03ce67e15a15ed86acad2d014a1"
        },
        {
          "path": "NavierStokes/ComparatorSolution.lean",
          "sha256": "52950d5d618a8d34c9bfbdb16641c81c276e97b6d7fd2a76c08577353f0b0227"
        },
        {
          "path": "NavierStokes/ComparatorR3Theorem.lean",
          "sha256": "d05cd1c55e78709dabe1996546eb6ddaaa46e602d2ef1b05c6e2085320781207"
        },
        {
          "path": "NavierStokes/ComparatorTheorem.lean",
          "sha256": "629c992327e531611c20165eb14db24edcabcf8f646a1d2689be9ac6fe2a9c68"
        },
        {
          "path": "NavierStokes/Flatness.lean",
          "sha256": "550606d4d1e14fb16612375de57d837df325a7b2265de6ed056c935ff96b2bc6"
        },
        {
          "path": "NavierStokes/ProblemStatement.lean",
          "sha256": "d2f5cdf24a060acd41011b50492e89058991965e18d2cb797c58d915f95af633"
        },
        {
          "path": "ComparatorChallenges/NavierStokes.lean",
          "sha256": "0cd193b8d5cbd0266e6e2f72e68dd5abcdcf2430ebd435dd9289737e9aa7da61"
        },
        {
          "path": "ComparatorChallenges/NavierStokes.json",
          "sha256": "7610ecead7b390d80ff7f4229a3ff8f18d630e046f7ad1de4f92c7e8e76845b8"
        }
      ],
      "originalFullBuild": {
        "schemaVersion": 2,
        "attempted": true,
        "performed": false,
        "performedMeaning": "Compatibility field: the entire original defaultTargets build completed successfully with exit 0. It does not mean merely invoking the command; attempted records that separately.",
        "wholeDefaultBuildPassed": false,
        "requiredDefaultTargets": [
          "NavierStokes",
          "Euler",
          "ComparatorChallenges"
        ],
        "exitCode": -15,
        "startedAt": "2026-10-09T15:23:30.991157+00:00",
        "completedAt": "2026-10-09T15:37:13.760832+00:00",
        "terminationReason": "Explicit stop request",
        "scope": "Original default lake build using the pinned official rc2 kernel through the separately audited explicit-path shell entry.",
        "reason": "The original default invocation was recorded and then explicitly stopped to prioritize NS C/D dependencies after unrelated Euler compilation started. Its result is not counted as whole-default success.",
        "vanillaCLIStatus": "ENVIRONMENT_PATH_DETECTION_FAILED",
        "vanillaCLIResults": "official-validation/official-command-results.json",
        "cacheProfile": {
          "status": "FINISHED",
          "exitCode": 0,
          "entry": "Original Cache.Main CLI body with explicit pinned CacheM context only",
          "cacheAlgorithmsChanged": false,
          "unsafeFlagsUsed": false,
          "endpoint": "https://lakecache.blob.core.windows.net/mathlib4-master",
          "lastProgress": {
            "downloaded": 8747,
            "attempted": 8747,
            "requested": 8747
          },
          "log": "cache-context-explicit.log",
          "logSHA256": "6e01f287ffad23379ad402dd872baeb7f38032d059e90fe4795a6553359273f1"
        },
        "defaultLog": "official-validation/lake-build-full-pinned.log",
        "defaultLogSHA256": "6e05a1754e2110c57701e554b70c6f0fcc94d7dd333c3c7f5152def81a012929",
        "transitionRecord": "official-validation/priority-transition.json",
        "additionalPinnedDeclarationAudit": "repository.pinnedRc2Validation",
        "auditFile": "official-validation/official-audit-summary.json",
        "auditSHA256": "48b6adab5d50078b974baba02b01db5e771dfe8c18b99de4040823f3bed9e8ff"
      },
      "pinnedRc2Validation": {
        "schemaVersion": 1,
        "sourceCommit": "f9e8bc5b38b6e212696e8a30e3e91517af887bbd",
        "checkedAt": "2026-10-09T16:06:24.537829+00:00",
        "scope": "The two exact C/D exported Lean declaration types at the original pinned rc2 commit. Separate from the 14:39 Lean4.34.1 component receipt, full default build, full paper-to-formal equivalence, and numerical profile certification.",
        "toolchain": "leanprover/lean4:v4.34.0-rc2",
        "kernelCommit": "6a10ac8c22beadecabdbb0919c2b50214762f91d",
        "executionProfile": {
          "kind": "PINNED_OFFICIAL_KERNEL_EXPLICIT_PATH_ENTRY",
          "vanillaCLIOutcome": "Environment path detection failed; exact vanilla commands and exits are separately logged.",
          "entrySourceUnchangedFromPreviouslyApprovedDriver": true,
          "driverSHA256": "a187c5263205d221e47724bbaf729cd377f40683b2670a543e3b7e6495108682",
          "officialSharedLibrarySHA256": "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5",
          "taskManagerWorkers": 1,
          "logicalOptionsReplaced": false,
          "proofSourcesChanged": false,
          "manifestChanged": false,
          "originalReleaseBytesChanged": false
        },
        "nsSubmissionBuild": {
          "target": "NavierStokes.ComparatorSolution",
          "exitCode": 0,
          "passed": true,
          "staticLocalSourceDependencyCount": 609,
          "reportedLakeJobs": 9371,
          "log": {
            "file": "official-validation/lake-build-ns-priority-pinned.log",
            "sha256": "f5ca33d2c60d99d59dbc9752bb614bf75964288e2533647584a9e264138192d5"
          },
          "commandReceipt": {
            "file": "official-validation/full-pinned-command-results.json",
            "sha256": "bf992d41b39bdd257ecb9b46e5caf1b6cff634466b6a05052f4d27333f346274",
            "stage": "lake-build-ns-priority-pinned"
          }
        },
        "submittedDeclarations": {
          "names": [
            "NavierStokes.Comparator.navier_stokes_breakdown_R3",
            "NavierStokes.Comparator.navier_stokes_breakdown_periodic"
          ],
          "entrySourceSHA256": "b0cf547fcf21a5760c90e326489a2cacdc890c71bfc4d51ecceccb826893f43d",
          "exitCode": 0,
          "kernelCommandAccepted": true,
          "passed": true,
          "axiomClosureRecordedForBothTargets": true,
          "permittedAxioms": [
            "Classical.choice",
            "Quot.sound",
            "propext"
          ],
          "unpermittedAxioms": [],
          "axioms": [
            {
              "declaration": "NavierStokes.Comparator.navier_stokes_breakdown_R3",
              "report": "[propext, Classical.choice, Quot.sound]",
              "axioms": [
                "propext",
                "Classical.choice",
                "Quot.sound"
              ]
            },
            {
              "declaration": "NavierStokes.Comparator.navier_stokes_breakdown_periodic",
              "report": "[propext, Classical.choice, Quot.sound]",
              "axioms": [
                "propext",
                "Classical.choice",
                "Quot.sound"
              ]
            }
          ],
          "originalSourceFile": "NavierStokes/ComparatorSolution.lean",
          "sourceURL": "https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/ComparatorSolution.lean",
          "sourceSHA256": "52950d5d618a8d34c9bfbdb16641c81c276e97b6d7fd2a76c08577353f0b0227",
          "oleanSHA256": "5025fa4e63160cea4fff8dd8f8350acabd3478cdc08563f383484fd01620de76",
          "oleanSizeBytes": 147272,
          "exactNormalTypes": "NavierStokes.Comparator.navier_stokes_breakdown_R3 : ∀ nu > 0,\n  ∃ u₀ f,\n    NavierStokes.Comparator.InitialVelocityConditionDecay u₀ ∧\n      NavierStokes.Comparator.ForceConditionDecay f ∧\n        ¬∃ v p, NavierStokes.Comparator.NavierStokesExistenceAndSmoothnessRn nu u₀ f v p\nNavierStokes.Comparator.navier_stokes_breakdown_periodic : ∀ nu > 0,\n  ∃ u₀ f,\n    NavierStokes.Comparator.InitialVelocityConditionPeriodic u₀ ∧\n      NavierStokes.Comparator.ForceConditionPeriodic f ∧\n        ¬∃ v p, NavierStokes.Comparator.NavierStokesExistenceAndSmoothnessPeriodic nu u₀ f v p",
          "sourceCopy": {
            "file": "official-validation/OfficialComparatorSolution.lean",
            "sha256": "52950d5d618a8d34c9bfbdb16641c81c276e97b6d7fd2a76c08577353f0b0227"
          },
          "entrySource": {
            "file": "official-validation/PinnedDeclarations.lean",
            "sha256": "b0cf547fcf21a5760c90e326489a2cacdc890c71bfc4d51ecceccb826893f43d"
          },
          "log": {
            "file": "official-validation/ns-pinned-declarations.log",
            "sha256": "4fc376bfe81caf561a1fd501d13f4ea2d9e2d6d41ee9fa687b82f2649ebb3a08"
          },
          "commandReceipt": {
            "file": "official-validation/full-pinned-command-results.json",
            "sha256": "bf992d41b39bdd257ecb9b46e5caf1b6cff634466b6a05052f4d27333f346274",
            "stage": "ns-pinned-declarations"
          }
        },
        "comparator": {
          "status": "BLOCKED",
          "passed": false,
          "exitCode": 1,
          "reachedComparatorProcess": false,
          "blocker": "Required systemd user guard cannot start: no user bus. Session UID 0 also fails the documented unprivileged-user guarantee. Comparator was not reached. No sandbox guard omitted or replaced.",
          "configSHA256": "7610ecead7b390d80ff7f4229a3ff8f18d630e046f7ad1de4f92c7e8e76845b8",
          "guardBypassUsed": false,
          "alternateWeakerPathCountedAsSuccess": false,
          "commandReceipt": {
            "file": "official-validation/comparator-pinned-guarded.json",
            "sha256": "cb7dda2f8777f5419a03777a7ff4a4dd4b504c8c2292f699ac93287e6578e276"
          },
          "log": {
            "file": "official-validation/comparator-pinned-guarded.log",
            "sha256": "746707a49085d66703eb45f2baea0df38a88bab7346195ece161e8e14ef2a3d1"
          },
          "independentEnvironment": {
            "file": "official-validation/comparator-environment-independent.json",
            "sha256": "f7b8b6f2baa8061c0b08a772fa6ce47c85bb098cf27ea4509f801b4f3b18230a"
          }
        },
        "wholeDefaultBuildPassed": false,
        "remainingBuildScope": {
          "submittedLocalDependencyClosure": {
            "sourceModules": 609,
            "oleanArtifactsPresent": 609,
            "oleanArtifactsMissing": 0
          },
          "navierStokesRootSourceClosure": {
            "sourceModules": 753,
            "oleanArtifactsPresent": 692,
            "oleanArtifactsMissing": 61
          },
          "navierStokesWholeLibrary": {
            "sourceModules": 817,
            "oleanArtifactsPresent": 702,
            "oleanArtifactsMissing": 115
          },
          "eulerWholeLibrary": {
            "sourceModules": 1840,
            "oleanArtifactsPresent": 23,
            "oleanArtifactsMissing": 1817
          },
          "comparatorChallenges": {
            "sourceModules": 2,
            "oleanArtifactsPresent": 0,
            "oleanArtifactsMissing": 2
          },
          "grade": "POST_BUILD_ARTIFACT_INVENTORY_ONLY",
          "receipt": {
            "file": "official-validation/remaining-build-scope.json",
            "sha256": "4824f6c994416743f8682e22f6d941713cf0965b20f33183d29ce9529eaf4e20"
          }
        },
        "pinnedEntryKernelControls": {
          "file": "official-validation/pinned-entry-kernel-controls.json",
          "sha256": "83360471e078eaa0c76e2dc06f223a4ac0b62e937b8c309ce7611500ee884a10"
        },
        "originalTrackedSourcesUnchanged": true,
        "completeNumericalPaperProfileCertified": false,
        "browserKernelRerun": false,
        "browserSourceValidationPromotesKernelPass": false,
        "historicalComponentAuditAutomaticallyPromoted": false,
        "numericFieldInstantiatesExistentialWitness": false,
        "auditFile": "official-validation/official-audit-summary.json",
        "auditSHA256": "48b6adab5d50078b974baba02b01db5e771dfe8c18b99de4040823f3bed9e8ff",
        "historicalComponentAudit": {
          "file": "evidence/lean-validation.json",
          "sha256": "90f162823a56035559a584476854a27b2ed135f373183c43593ed47439d8ffe1",
          "checkedAt": "2026-10-09T14:39:01.694607+00:00",
          "toolchain": "Lean/mathlib4.34.1",
          "targetCount": 13,
          "unchanged": true
        }
      }
    },
    "publicStatus": [
      {
        "id": "N01",
        "url": "https://openai.com/index/navier-stokes-solution/",
        "publicationDate": "2026-09-08",
        "updateDate": "2026-09-10",
        "retrievedDate": "2026-10-09",
        "status": "ANNOUNCEMENT",
        "claim": "OpenAI reports an analytical and Lean proof for forced alternatives C/D. This record is an attributed publication claim."
      },
      {
        "id": "N02",
        "url": "https://www.claymath.org/news/navier-stokes-announcement/",
        "publicationDate": "2026-09-11",
        "retrievedDate": "2026-10-09",
        "status": "INSTITUTIONAL_ANNOUNCEMENT",
        "claim": "Clay describes the problem as apparently settled and explains that evaluation and attribution follow a deliberate process. No final prize adjudication is inferred."
      }
    ],
    "scope": "User attachment and pinned source definitions. Unforced A/B are not claimed by this module."
  },
  "contract": {
    "schemaVersion": 1,
    "paper": "N00",
    "theorem": "Theorem1.1",
    "references": [
      {
        "pages": [
          1
        ],
        "statement": "Theorem1.1"
      },
      {
        "pages": [
          120,
          123,
          124,
          125,
          126
        ],
        "statement": "Lemma10.3; Corollary10.6; final viscosity/periodic comparison"
      }
    ],
    "quantifiers": [
      {
        "name": "nu",
        "domain": "real",
        "condition": "nu>0",
        "quantifier": "for every"
      },
      {
        "name": "f",
        "domain": "C_c^infinity(R^3 x (0,infinity);R^3)",
        "quantifier": "there exists",
        "divergenceFreeRequired": false,
        "divergenceNote": "Global cutoff force is not in general divergence free; source p118."
      },
      {
        "name": "u,p",
        "domain": "smooth on R^3 x [0,1)",
        "quantifier": "there exist",
        "fixedCompactSpatialSupport": true
      }
    ],
    "initialVelocity": "u(x,0)=0",
    "equation": "partial_t u+(u dot grad)u-nu Delta u+grad p=f; div u=0",
    "boundedEnergy": "sup_{0<=t<1} integral_{R^3}|u(x,t)|^2 dx < infinity",
    "blowup": "limsup_{t -> 1-} ||u(t)||_infinity = infinity",
    "forbiddenPromotions": [
      "f=0",
      "smooth velocity at t=1",
      "numerical plot proves theorem",
      "standalone exterior has finite R3 energy",
      "N1-N3 leading candidate is a full Navier-Stokes solution"
    ],
    "formalGrade": "THEOREM_REFERENCE",
    "mainTheoremKernelCheckedLocally": false
  },
  "map": {
    "sections": [
      {
        "id": "1",
        "title": "Introduction",
        "firstPage": 1,
        "lastPage": 2,
        "role": "Main forced theorem 1.1, literature and exact Clay scope."
      },
      {
        "id": "2",
        "title": "Physical description of the blowup",
        "firstPage": 3,
        "lastPage": 6,
        "role": "Inward swirl, axial outflow, anisotropic contraction, pulses and heat exterior."
      },
      {
        "id": "3",
        "title": "Proof outline",
        "firstPage": 6,
        "lastPage": 24,
        "role": "Coordinate relation, stress matching, divergence-free pulses, correction cycle, summation and localization."
      },
      {
        "id": "4",
        "title": "Constructing the leading order flow",
        "firstPage": 24,
        "lastPage": 45,
        "role": "Leading radial/axial profiles, moments and admissible stress cone; Theorem 4.6."
      },
      {
        "id": "5",
        "title": "Correcting the base flow to every order",
        "firstPage": 45,
        "lastPage": 62,
        "role": "Higher-order coefficient induction; divergence-preserving cutoff summation; Proposition 5.5."
      },
      {
        "id": "6",
        "title": "Auxiliary torus and separation of oscillatory supports",
        "firstPage": 62,
        "lastPage": 73,
        "role": "Dyadic charts, auxiliary T², support separation and coefficient algebra."
      },
      {
        "id": "7",
        "title": "Oscillatory realization and correction of the residual stress",
        "firstPage": 73,
        "lastPage": 88,
        "role": "Phase and amplitude equations, covariance matching, curls and retained remainders."
      },
      {
        "id": "8",
        "title": "Compactly supported mean corrections",
        "firstPage": 88,
        "lastPage": 100,
        "role": "Pressure reconstruction, auxiliary-time inversion, two conserved moments and three defect constraints."
      },
      {
        "id": "9",
        "title": "Residual improvement and the local field",
        "firstPage": 100,
        "lastPage": 116,
        "role": "Fixed-order correction cycle; sigma_j=1/5+j/10; common-domain all-order summation."
      },
      {
        "id": "10",
        "title": "Compact forcing and whole-space breakdown",
        "firstPage": 116,
        "lastPage": 126,
        "role": "Localization, smooth force extension, energy estimate, comparison, viscosity scaling and periodic corollary."
      },
      {
        "id": "A",
        "title": "Matching radial moments and constructing the heat exterior",
        "firstPage": 126,
        "lastPage": 144,
        "role": "Moment invertibility and nonlinear correction; explicit heat profile (A.32)–(A.37)."
      },
      {
        "id": "B",
        "title": "Analytic profiles near the axis and their continuation",
        "firstPage": 144,
        "lastPage": 157,
        "role": "Analytic axis profiles, continuation, shear bounds and exact matching of five moments."
      },
      {
        "id": "C",
        "title": "Realizing the admissible stress cone",
        "firstPage": 157,
        "lastPage": 165,
        "role": "Periodic loops of shear, radial oscillations and restoration of five moments."
      },
      {
        "id": "References",
        "title": "References",
        "firstPage": 165,
        "lastPage": 166,
        "role": "22 cited works."
      }
    ],
    "pageCoverage": [
      {
        "page": 1,
        "sections": [
          "1"
        ],
        "characters": 3354,
        "textSha256": "1b24d58a211d340682c55ed340878c1371964cbdc9ca7754c51890e6bf1cf08d",
        "namedStatements": [
          "Theorem 1.1",
          "Corollary 10.6"
        ]
      },
      {
        "page": 2,
        "sections": [
          "1"
        ],
        "characters": 4190,
        "textSha256": "9ca3e01ce56a5077f4a46b4315521f368680c6123802d2113076b05df835df76",
        "namedStatements": []
      },
      {
        "page": 3,
        "sections": [
          "2"
        ],
        "characters": 3575,
        "textSha256": "506a09520e3d5877f889a9b982881a8acd67770257c60287f5ed0098bb577524",
        "namedStatements": [
          "Theorem 1.1"
        ]
      },
      {
        "page": 4,
        "sections": [
          "2"
        ],
        "characters": 2385,
        "textSha256": "eb0fbae4226535b1ddcd3497cb20ebff39d86bf4706ef574e85dd03e867bf092",
        "namedStatements": []
      },
      {
        "page": 5,
        "sections": [
          "2"
        ],
        "characters": 3773,
        "textSha256": "7d48042d70cbc0533df35f7f2f639cacba7492b0cc4d573f697a83e08b03e97c",
        "namedStatements": []
      },
      {
        "page": 6,
        "sections": [
          "2",
          "3"
        ],
        "characters": 3935,
        "textSha256": "29c8d5b90145ba0124d5b016be3950c5724badc54b2d2bb2d3c84e3e4630c754",
        "namedStatements": []
      },
      {
        "page": 7,
        "sections": [
          "3"
        ],
        "characters": 3720,
        "textSha256": "b411b65fc3d22456bc1f6041ac204aa8a88955b9f8e989c3549abf6e130d83d3",
        "namedStatements": [
          "Proposition 5.5",
          "Proposition 7.5",
          "Proposition 9.6",
          "Theorem 1.1",
          "Lemma 10.3",
          "Lemma 4.1"
        ]
      },
      {
        "page": 8,
        "sections": [
          "3"
        ],
        "characters": 3746,
        "textSha256": "e078cb481ba6f64cdbd3b3caec5857dc3a188b907ae208c9789a0733d9703ae9",
        "namedStatements": [
          "Theorem 4.6",
          "Proposition B.2",
          "Proposition 10.1"
        ]
      },
      {
        "page": 9,
        "sections": [
          "3"
        ],
        "characters": 4876,
        "textSha256": "f5c3cf4f29719d1d1a2a7c5faa851f78e130ac7ec47ff73a16bc070c4f057bcb",
        "namedStatements": [
          "Theorem 4.6",
          "Lemma 4.5",
          "Proposition 7.5",
          "Lemma A.8",
          "Lemma 4.4"
        ]
      },
      {
        "page": 10,
        "sections": [
          "3"
        ],
        "characters": 3528,
        "textSha256": "24c74843238d719003204366948a3e188c122c3d81d7f247185e0f48491f3d46",
        "namedStatements": [
          "Proposition 7.5",
          "Proposition A.4",
          "Lemma A.6",
          "Proposition A.7",
          "Proposition B.2",
          "Corollary B.10",
          "Proposition B.8",
          "Lemma 4.4",
          "Lemma A.8",
          "Proposition C.2",
          "Proposition C.3"
        ]
      },
      {
        "page": 11,
        "sections": [
          "3"
        ],
        "characters": 3420,
        "textSha256": "cac403e220a06671425c4c9da401fd6ae7e35b7a14859756d88a517ccd059dc6",
        "namedStatements": [
          "Proposition 5.5",
          "Lemma 7.7"
        ]
      },
      {
        "page": 12,
        "sections": [
          "3"
        ],
        "characters": 4099,
        "textSha256": "cc16a4af40f79839ad63fdd40824e687f6d4b5547049bd196c67df715647b87e",
        "namedStatements": [
          "Lemma 6.1",
          "Lemma 7.7",
          "Corollary 7.8"
        ]
      },
      {
        "page": 13,
        "sections": [
          "3"
        ],
        "characters": 3273,
        "textSha256": "92a934e8dd06c85292e42c1826621fd2bf0ff6900cda77d79418a450a7c04fd8",
        "namedStatements": [
          "Theorem 4.6",
          "Proposition 5.5",
          "Lemma 7.4",
          "Proposition 7.5",
          "Lemma 7.7",
          "Proposition 9.6",
          "Proposition 9.5"
        ]
      },
      {
        "page": 14,
        "sections": [
          "3"
        ],
        "characters": 3872,
        "textSha256": "0163ea0f9f100a88693986d6da5d54e8316c1ecea4e9780df8aab8d2e2cd2aaf",
        "namedStatements": [
          "Proposition 9.6",
          "Proposition 9.1",
          "Lemma 9.2",
          "Proposition 7.6",
          "Lemma 9.7",
          "Proposition 9.9"
        ]
      },
      {
        "page": 15,
        "sections": [
          "3"
        ],
        "characters": 3439,
        "textSha256": "52ee8c6b2e7d1a9854e5923fb4aad610879d893c88f9470b87ca48d6aef3290b",
        "namedStatements": [
          "Proposition 9.3",
          "Proposition 9.6",
          "Lemma 5.4",
          "Proposition 9.9",
          "Theorem 1.1",
          "Theorem 3.1"
        ]
      },
      {
        "page": 16,
        "sections": [
          "3"
        ],
        "characters": 3772,
        "textSha256": "e3a0098a7442a27a56d21038deb9ca6aa6cd3362502e360ae35c575221e59291",
        "namedStatements": [
          "Proposition 10.1",
          "Theorem 3.1",
          "Lemma 10.2",
          "Lemma 10.3"
        ]
      },
      {
        "page": 17,
        "sections": [
          "3"
        ],
        "characters": 4263,
        "textSha256": "8df1204c60aa7d7924098a237931d2d2bfa6c9cde1b51137db86f020285caacd",
        "namedStatements": [
          "Lemma 10.4",
          "Lemma 10.5",
          "Theorem 1.1",
          "Corollary 10.6"
        ]
      },
      {
        "page": 18,
        "sections": [
          "3"
        ],
        "characters": 3273,
        "textSha256": "51bc9b71b4f2a59759c82369943168c40442ea59f9e1a86d982cfc6cbe73bc5a",
        "namedStatements": [
          "Definition 3.2",
          "Definition 3.3"
        ]
      },
      {
        "page": 19,
        "sections": [
          "3"
        ],
        "characters": 3523,
        "textSha256": "0746de42c3e9124227b4c51158aba8ad61d6b712123277758efbf471a43d27c1",
        "namedStatements": [
          "Lemma 4.4",
          "Proposition 5.5",
          "Proposition 4.2"
        ]
      },
      {
        "page": 20,
        "sections": [
          "3"
        ],
        "characters": 3466,
        "textSha256": "f8bd8e020ca34698343dd05e3ccd2964f3e6ba2525e69d4211afd5b009ec3774",
        "namedStatements": [
          "Proposition 5.5",
          "Proposition 8.1",
          "Definition 9.4",
          "Theorem 3.1",
          "Lemma 4.1"
        ]
      },
      {
        "page": 21,
        "sections": [
          "3"
        ],
        "characters": 3886,
        "textSha256": "8cac9dbf7b0703169b7b98c4d5dfc2cc54e06a54f6d9b20145d2135599b8544d",
        "namedStatements": [
          "Theorem 4.6",
          "Lemma 5.2",
          "Proposition 8.3"
        ]
      },
      {
        "page": 22,
        "sections": [
          "3"
        ],
        "characters": 3672,
        "textSha256": "756799b36df467b9a372af016660c8abaf49052fd5b52145d29182748e62f1c0",
        "namedStatements": [
          "Proposition 7.5",
          "Definition 9.4"
        ]
      },
      {
        "page": 23,
        "sections": [
          "3"
        ],
        "characters": 3816,
        "textSha256": "ca106a3ac8d233e8b22b97cb91564201739b1234a7d44116f672992139e375b1",
        "namedStatements": [
          "Definition 6.5",
          "Definition 6.4"
        ]
      },
      {
        "page": 24,
        "sections": [
          "3",
          "4"
        ],
        "characters": 3866,
        "textSha256": "625ce5cec71f9f03c0fc4d30d632498eec95a2e49b50312fb917f0de27656292",
        "namedStatements": [
          "Proposition 9.6",
          "Lemma 5.4",
          "Proposition 7.5",
          "Theorem 4.6",
          "Lemma 4.4",
          "Proposition 4.2",
          "Theorem 3.1"
        ]
      },
      {
        "page": 25,
        "sections": [
          "4"
        ],
        "characters": 3860,
        "textSha256": "6830925a0eacd17663ccf1f07748ae70b80b7a49853499921e4ea898fa2956fa",
        "namedStatements": [
          "Lemma 4.1",
          "Theorem 4.6",
          "Definition 3.2"
        ]
      },
      {
        "page": 26,
        "sections": [
          "4"
        ],
        "characters": 4380,
        "textSha256": "5a1ab04764ad24e5cfd75b62998971bf920dbad4b84ae15c52ac710dfd636dca",
        "namedStatements": [
          "Proposition 4.2"
        ]
      },
      {
        "page": 27,
        "sections": [
          "4"
        ],
        "characters": 4125,
        "textSha256": "8544b6b3c0536ce30e2d849e48fac597d88b5e446bcfec526092083883cfcee9",
        "namedStatements": [
          "Proposition 7.5",
          "Proposition 4.2",
          "Definition 3.2"
        ]
      },
      {
        "page": 28,
        "sections": [
          "4"
        ],
        "characters": 3967,
        "textSha256": "cd8ebf541f1f22cd8ddfefbb1ad8d9ffcaa01644b363e383e02e88748a4819fc",
        "namedStatements": [
          "Lemma 4.4",
          "Lemma 4.3"
        ]
      },
      {
        "page": 29,
        "sections": [
          "4"
        ],
        "characters": 3921,
        "textSha256": "a33c276f5579a995c5375fa628d7d2e660f7409a2e2e9a3b30b850248d22e9fb",
        "namedStatements": []
      },
      {
        "page": 30,
        "sections": [
          "4"
        ],
        "characters": 4537,
        "textSha256": "9040966739690169b90a4bb869a94de42799f32c6229203f3507768adf929040",
        "namedStatements": [
          "Proposition C.2",
          "Lemma A.8",
          "Proposition 7.5",
          "Lemma 4.5"
        ]
      },
      {
        "page": 31,
        "sections": [
          "4"
        ],
        "characters": 3733,
        "textSha256": "b8fca4ec5f20f5ec8963b721ff7c094bc754b66a22c13de49a9b25d3b530da54",
        "namedStatements": [
          "Proposition 7.5",
          "Proposition A.4",
          "Lemma 4.5"
        ]
      },
      {
        "page": 32,
        "sections": [
          "4"
        ],
        "characters": 3589,
        "textSha256": "5132b8be272b61c17807ff180f52337bb46b416252c8f7170bc65e3fcfbe2776",
        "namedStatements": [
          "Theorem 4.6",
          "Proposition 7.5",
          "Proposition 7.6",
          "Lemma 4.4",
          "Lemma 4.5"
        ]
      },
      {
        "page": 33,
        "sections": [
          "4"
        ],
        "characters": 4135,
        "textSha256": "055e2293cb22f53212927cea519c6f08d217660dd601e81dd43aaa3d872686d1",
        "namedStatements": [
          "Proposition 4.2",
          "Lemma 5.2",
          "Lemma 8.7"
        ]
      },
      {
        "page": 34,
        "sections": [
          "4"
        ],
        "characters": 3668,
        "textSha256": "5c63a3edefb3d5e4b7dc0f6e9883e9fc76d7c0f2836fa0adc2310e22c2071d4d",
        "namedStatements": [
          "Lemma 4.7",
          "Lemma 4.8",
          "Proposition 4.10",
          "Lemma 4.11",
          "Theorem 4.6"
        ]
      },
      {
        "page": 35,
        "sections": [
          "4"
        ],
        "characters": 3375,
        "textSha256": "5fb49cb9ee06a57c4b5a969c744dcaa1e833348a640880c315266f451af7b631",
        "namedStatements": [
          "Lemma 4.8",
          "Lemma 4.4"
        ]
      },
      {
        "page": 36,
        "sections": [
          "4"
        ],
        "characters": 4334,
        "textSha256": "40dfa68da613f4306e076a8291a41fb0fb323f83f9bb947f88feec88f0bdab22",
        "namedStatements": [
          "Proposition A.4",
          "Lemma A.5",
          "Lemma A.6",
          "Proposition A.7",
          "Lemma 4.9",
          "Lemma 4.8",
          "Lemma A.8",
          "Proposition A.10",
          "Proposition 4.10"
        ]
      },
      {
        "page": 37,
        "sections": [
          "4"
        ],
        "characters": 4794,
        "textSha256": "c502bb236014ae00d110aa12f24032990c91249fe4c234674b3a55025610f9a2",
        "namedStatements": [
          "Proposition B.2",
          "Proposition B.3",
          "Lemma 4.8",
          "Proposition B.5",
          "Corollary B.6"
        ]
      },
      {
        "page": 38,
        "sections": [
          "4"
        ],
        "characters": 3955,
        "textSha256": "ee4afb37d12c1fc854db587d806803583010baab48f22792fc76745386b142a2",
        "namedStatements": [
          "Lemma B.7",
          "Proposition B.8",
          "Lemma 4.11"
        ]
      },
      {
        "page": 39,
        "sections": [
          "4"
        ],
        "characters": 3749,
        "textSha256": "b2a3d940ce308238486a60d67bc127e4dad8d11e9cdc3b4cccb27f8e3a662171",
        "namedStatements": [
          "Lemma C.1",
          "Lemma 4.5",
          "Theorem 4.6",
          "Lemma 4.8",
          "Proposition 4.10",
          "Lemma 4.11",
          "Lemma 4.7",
          "Lemma 4.9"
        ]
      },
      {
        "page": 40,
        "sections": [
          "4"
        ],
        "characters": 4060,
        "textSha256": "b2d8a5ab0a0291e35e0f1643126eaea5e145878fbef1235e43d210273ea1dba3",
        "namedStatements": [
          "Definition 3.3",
          "Proposition 4.10",
          "Lemma 4.4",
          "Lemma 4.8",
          "Lemma 4.9"
        ]
      },
      {
        "page": 41,
        "sections": [
          "4"
        ],
        "characters": 4268,
        "textSha256": "65c9369455e512ab3a133ce641cc9b18f14b063f8b9d8c9ff842cac1d865e4f5",
        "namedStatements": [
          "Lemma 4.11"
        ]
      },
      {
        "page": 42,
        "sections": [
          "4"
        ],
        "characters": 3990,
        "textSha256": "b9cdec7927ef36bf19d3efee5c2dac7313a19facdd2af242db6266f40ab3a97d",
        "namedStatements": [
          "Lemma 4.4",
          "Lemma 4.11",
          "Lemma 4.7"
        ]
      },
      {
        "page": 43,
        "sections": [
          "4"
        ],
        "characters": 3991,
        "textSha256": "619c41db5587ea732d78dfe786c4e099f373259df59778749f0b20bc054ea5cd",
        "namedStatements": [
          "Lemma 4.7",
          "Lemma 4.4",
          "Proposition 4.10",
          "Proposition 4.2"
        ]
      },
      {
        "page": 44,
        "sections": [
          "4"
        ],
        "characters": 3766,
        "textSha256": "21537223bc8fd16995a5ad6a4004cf992761a8ef7e01e2c47cd3406854bfa31d",
        "namedStatements": [
          "Lemma 4.9",
          "Proposition 4.10"
        ]
      },
      {
        "page": 45,
        "sections": [
          "4",
          "5"
        ],
        "characters": 3629,
        "textSha256": "fe8d51f01117a0952203d6087e328274342e9e1c4a3ca7668eda75c19bf02f10",
        "namedStatements": [
          "Lemma 4.8",
          "Theorem 4.6",
          "Proposition 5.5",
          "Lemma 5.1",
          "Lemma 5.2",
          "Proposition 5.3",
          "Lemma 5.4"
        ]
      },
      {
        "page": 46,
        "sections": [
          "5"
        ],
        "characters": 4326,
        "textSha256": "d53190a953003430a619dc798d00a7875e4eefb6a087d2822cb8ce5125924b2f",
        "namedStatements": [
          "Lemma 5.2"
        ]
      },
      {
        "page": 47,
        "sections": [
          "5"
        ],
        "characters": 4248,
        "textSha256": "dd8389d653f50950c013c9d2a83818c8c27fef892b225c30bf54e88d74965c93",
        "namedStatements": [
          "Lemma 5.1",
          "Theorem 4.6",
          "Proposition B.2"
        ]
      },
      {
        "page": 48,
        "sections": [
          "5"
        ],
        "characters": 3750,
        "textSha256": "46b0ce7ecacc1a8d66ab8f2c9a4455816e5e1f59ea503fbb36ceb227a3548900",
        "namedStatements": []
      },
      {
        "page": 49,
        "sections": [
          "5"
        ],
        "characters": 4413,
        "textSha256": "485b61f50bc30be917110baab32ad436fe7aed7347d481a7bf75f035eee16f91",
        "namedStatements": [
          "Lemma 5.1",
          "Lemma 5.2"
        ]
      },
      {
        "page": 50,
        "sections": [
          "5"
        ],
        "characters": 3863,
        "textSha256": "a20bb467d68d4ec0730761f7573a2b1b15b553012f88c1dc33925b4c2ef2aedd",
        "namedStatements": [
          "Theorem 4.6",
          "Lemma 5.2",
          "Lemma 5.1"
        ]
      },
      {
        "page": 51,
        "sections": [
          "5"
        ],
        "characters": 4196,
        "textSha256": "dd5efa2ae666c13ceb277731b23acb8a18e63e8123b31b4dc0ec49ead114671f",
        "namedStatements": [
          "Lemma 5.1"
        ]
      },
      {
        "page": 52,
        "sections": [
          "5"
        ],
        "characters": 3762,
        "textSha256": "e16a63dc60f5c1c0616142b6c8df77c96075c7bbeb77b6a14f1c7357753c3566",
        "namedStatements": [
          "Lemma A.1"
        ]
      },
      {
        "page": 53,
        "sections": [
          "5"
        ],
        "characters": 6250,
        "textSha256": "4b2b556ced847fc931009bf527e65d0c4b7121af1694e60e6853bf1264f15656",
        "namedStatements": []
      },
      {
        "page": 54,
        "sections": [
          "5"
        ],
        "characters": 4176,
        "textSha256": "b4f5869d39184bdecf8afa2a0af737e68303adccffc3df5af259cca30af74c6d",
        "namedStatements": [
          "Lemma A.9",
          "Lemma 5.1",
          "Lemma 5.2"
        ]
      },
      {
        "page": 55,
        "sections": [
          "5"
        ],
        "characters": 3725,
        "textSha256": "32677cc3be4efd7f1e3d12f725890097627cb101d2fb9e93ff279c1e48b60993",
        "namedStatements": [
          "Proposition 5.3",
          "Theorem 4.6",
          "Lemma 5.1",
          "Lemma 5.2",
          "Proposition 4.2"
        ]
      },
      {
        "page": 56,
        "sections": [
          "5"
        ],
        "characters": 3788,
        "textSha256": "84a6d0a5bf1dcbbcec09452e7536ac6c21e7a2496d8a9ed43c017977c9620fc4",
        "namedStatements": [
          "Proposition 5.3",
          "Lemma 5.4",
          "Lemma 5.2"
        ]
      },
      {
        "page": 57,
        "sections": [
          "5"
        ],
        "characters": 4420,
        "textSha256": "45f6de6ba6b40f44b3af93518a0cdca8f73d8d0b040e6eecaecd9f47af983a56",
        "namedStatements": [
          "Lemma 5.4"
        ]
      },
      {
        "page": 58,
        "sections": [
          "5"
        ],
        "characters": 3655,
        "textSha256": "305d8636aa4626b61a6d5f645b16836583eccfd77492e298835cd219d703c035",
        "namedStatements": []
      },
      {
        "page": 59,
        "sections": [
          "5"
        ],
        "characters": 3756,
        "textSha256": "84172a1d380ee1be8ba3177b95c215028474f6e24e0d1455b45e4fee8efc0f4d",
        "namedStatements": []
      },
      {
        "page": 60,
        "sections": [
          "5"
        ],
        "characters": 3941,
        "textSha256": "dedbaeec527a32959d3ed27253c2e36b0799af49beb7431d4138287470ce491b",
        "namedStatements": [
          "Proposition 5.3",
          "Lemma 5.4",
          "Proposition 5.5",
          "Theorem 4.6",
          "Lemma 5.2"
        ]
      },
      {
        "page": 61,
        "sections": [
          "5"
        ],
        "characters": 3847,
        "textSha256": "b86382275b24ba891cb52e20c1a5d832d54bc27967405efd7045664c6adafe74",
        "namedStatements": [
          "Proposition 5.3",
          "Lemma 5.4",
          "Lemma 5.2"
        ]
      },
      {
        "page": 62,
        "sections": [
          "5",
          "6"
        ],
        "characters": 3750,
        "textSha256": "317090fdfdf126583eed6af06fb9db581753bcf887508c469eb567f898c79742",
        "namedStatements": [
          "Proposition 7.5",
          "Lemma 6.1",
          "Lemma 6.2",
          "Proposition 6.6"
        ]
      },
      {
        "page": 63,
        "sections": [
          "6"
        ],
        "characters": 4037,
        "textSha256": "5c53cae12853a93ef2f4673e6a6e5f759912ca2d28e9282de6108bc1e08ccaca",
        "namedStatements": []
      },
      {
        "page": 64,
        "sections": [
          "6"
        ],
        "characters": 3868,
        "textSha256": "1cbcb157d46580008cc36bb07313225c58777625ee656d1a22ca971571aace83",
        "namedStatements": [
          "Lemma 8.2",
          "Lemma 6.1"
        ]
      },
      {
        "page": 65,
        "sections": [
          "6"
        ],
        "characters": 4632,
        "textSha256": "7ee460a998c06cf95bb1207418a67668d3556aa3ff157ec4aebd9061e2c35d1c",
        "namedStatements": [
          "Proposition 5.5",
          "Lemma 6.1"
        ]
      },
      {
        "page": 66,
        "sections": [
          "6"
        ],
        "characters": 3604,
        "textSha256": "dc9194767d232a9007e270be87d47377cb5e7665ce2e69e29d829efd0e4f9eb4",
        "namedStatements": [
          "Lemma 6.1",
          "Lemma 6.2"
        ]
      },
      {
        "page": 67,
        "sections": [
          "6"
        ],
        "characters": 3818,
        "textSha256": "a37296a76f6573a7c3fc302abe73ccfbfe4dc6fc678310702f88ff56478794a7",
        "namedStatements": [
          "Lemma 6.2"
        ]
      },
      {
        "page": 68,
        "sections": [
          "6"
        ],
        "characters": 3695,
        "textSha256": "324309a20dcacfc39eb2d10f24ac55c256e4659dc911343c402a81358fc0cc02",
        "namedStatements": [
          "Lemma 6.3"
        ]
      },
      {
        "page": 69,
        "sections": [
          "6"
        ],
        "characters": 3791,
        "textSha256": "0716363f30b70a58b54c30bd9857c175a0441f7091e71ee541c4a7273eb6d70e",
        "namedStatements": [
          "Proposition 7.2",
          "Proposition 6.6",
          "Theorem 4.6",
          "Definition 6.4"
        ]
      },
      {
        "page": 70,
        "sections": [
          "6"
        ],
        "characters": 3319,
        "textSha256": "dfe6a57c6ff2eeeb58400942c043636681284b326dc91c280689e5b1abaafb49",
        "namedStatements": [
          "Definition 6.5"
        ]
      },
      {
        "page": 71,
        "sections": [
          "6"
        ],
        "characters": 3241,
        "textSha256": "0b2b44bf3c59984d78112e392343f98f98d79036b4335e741aa88ee22701d77e",
        "namedStatements": [
          "Proposition 6.6"
        ]
      },
      {
        "page": 72,
        "sections": [
          "6"
        ],
        "characters": 3739,
        "textSha256": "18d9386422f1048628392e17c91bc0433056120e053748ec2f3bae6028923122",
        "namedStatements": [
          "Lemma 6.1",
          "Lemma 6.2",
          "Proposition 7.2"
        ]
      },
      {
        "page": 73,
        "sections": [
          "6",
          "7"
        ],
        "characters": 3896,
        "textSha256": "a0093288069561fde6369974e889ed67f274d49ba7fee4ab2c6135d7e65aa712",
        "namedStatements": [
          "Proposition 9.6",
          "Proposition 5.5",
          "Lemma 6.1",
          "Proposition 7.2",
          "Proposition 7.6",
          "Lemma 7.4",
          "Proposition 7.5",
          "Lemma 7.7",
          "Corollary 7.8"
        ]
      },
      {
        "page": 74,
        "sections": [
          "7"
        ],
        "characters": 4384,
        "textSha256": "ab3bdfee6290dffdc6afd97b645f68390e0edd39e6891a2bf8d5e721a497fb12",
        "namedStatements": [
          "Theorem 4.6",
          "Lemma 4.5"
        ]
      },
      {
        "page": 75,
        "sections": [
          "7"
        ],
        "characters": 4191,
        "textSha256": "ae9738a4b6617e5b7bf5265f1967122ccafd77eb9798efcec25c96605012c3b5",
        "namedStatements": [
          "Proposition 9.1",
          "Lemma 7.1"
        ]
      },
      {
        "page": 76,
        "sections": [
          "7"
        ],
        "characters": 3892,
        "textSha256": "7306b5d34ba70a5aac38d52d5f49a3d5d15a15056cd78a5d7a9e9fbe1cf0e762",
        "namedStatements": []
      },
      {
        "page": 77,
        "sections": [
          "7"
        ],
        "characters": 3945,
        "textSha256": "2dbc96b26ddfd4330c4705a0f893b003935be2f4fb8c60eb7443beec58c7c160",
        "namedStatements": [
          "Lemma 7.1",
          "Proposition 7.2",
          "Lemma 7.4",
          "Lemma 6.2"
        ]
      },
      {
        "page": 78,
        "sections": [
          "7"
        ],
        "characters": 3940,
        "textSha256": "82c205ce65ae132d3be6066111a5af3ed79e28538b18369147bee6a475ae0c1a",
        "namedStatements": [
          "Lemma 7.1",
          "Proposition 7.2"
        ]
      },
      {
        "page": 79,
        "sections": [
          "7"
        ],
        "characters": 4072,
        "textSha256": "56d2ffb79e1464f878a14e48cf4489a844f9bf4a0d475acf59f4e6aca857b439",
        "namedStatements": []
      },
      {
        "page": 80,
        "sections": [
          "7"
        ],
        "characters": 3598,
        "textSha256": "18abcdd70f7076b377a87019f2577721d32df72177a8c6414a80be4de1631caa",
        "namedStatements": [
          "Proposition 5.5",
          "Corollary 7.3",
          "Lemma 7.1",
          "Lemma 7.4"
        ]
      },
      {
        "page": 81,
        "sections": [
          "7"
        ],
        "characters": 4285,
        "textSha256": "1f2b011c6a91533b05bc62bc0ae3a9d3369267937b4f14fbfc69649a9794ce7c",
        "namedStatements": [
          "Lemma 7.4",
          "Proposition 7.5",
          "Proposition 7.6"
        ]
      },
      {
        "page": 82,
        "sections": [
          "7"
        ],
        "characters": 4190,
        "textSha256": "9b419b9e08645d5f8637993c22be1e23a39c146401378068ec7fe54f248509dc",
        "namedStatements": [
          "Lemma 6.2",
          "Proposition 7.5",
          "Lemma 7.4",
          "Lemma 7.1"
        ]
      },
      {
        "page": 83,
        "sections": [
          "7"
        ],
        "characters": 4372,
        "textSha256": "a161fc6a2ebc8f989beac0f7e27bfae74c65b4894c09109dc7351c17bbc2b588",
        "namedStatements": [
          "Lemma 7.4"
        ]
      },
      {
        "page": 84,
        "sections": [
          "7"
        ],
        "characters": 3758,
        "textSha256": "e949fc67708f39b80410a10ff29e1ff4737b73ee9b86d6a681f30ee9a1674d3e",
        "namedStatements": [
          "Proposition 7.5",
          "Proposition 7.6",
          "Lemma 7.4"
        ]
      },
      {
        "page": 85,
        "sections": [
          "7"
        ],
        "characters": 3894,
        "textSha256": "1da0ea21bf2fd951c7df948029ccd38b0fe8f4209a8f6ce727e559179a6d6360",
        "namedStatements": [
          "Definition 6.5",
          "Proposition 7.6",
          "Lemma 7.7",
          "Corollary 7.8"
        ]
      },
      {
        "page": 86,
        "sections": [
          "7"
        ],
        "characters": 3765,
        "textSha256": "f51350161bc7ec03e6dae801dcc6228f023583409b54937eb3f652e798ed9569",
        "namedStatements": [
          "Lemma 7.7",
          "Lemma 7.1",
          "Proposition 7.2"
        ]
      },
      {
        "page": 87,
        "sections": [
          "7"
        ],
        "characters": 3581,
        "textSha256": "b25351f0e0aff8f5f040cb418583fb18f0e15ae7e93c07f52d41d3bf38fb40c0",
        "namedStatements": [
          "Corollary 7.8",
          "Lemma 7.7"
        ]
      },
      {
        "page": 88,
        "sections": [
          "7",
          "8"
        ],
        "characters": 4121,
        "textSha256": "11da2ed1cfc2d4004ec9ef8c42af8b8b4c2cc01ddfcecbaa02adf720b773d68f",
        "namedStatements": [
          "Proposition 7.2",
          "Proposition 8.1",
          "Proposition 8.3",
          "Corollary 8.5",
          "Lemma 8.2",
          "Lemma 8.6",
          "Lemma 8.7",
          "Lemma 8.8",
          "Proposition 9.6",
          "Lemma 6.2",
          "Definition 6.4",
          "Proposition 8.4"
        ]
      },
      {
        "page": 89,
        "sections": [
          "8"
        ],
        "characters": 3709,
        "textSha256": "fe1c78a00ffe502ce8da53d3b085402e155f89064a99ab02b524db9b1dbf68cc",
        "namedStatements": [
          "Proposition 8.1",
          "Lemma 8.2"
        ]
      },
      {
        "page": 90,
        "sections": [
          "8"
        ],
        "characters": 4396,
        "textSha256": "e0017f57efded900dc78d20d6c54db140ac2568fea5ac815bc9e6454d4d26e98",
        "namedStatements": [
          "Lemma 8.2"
        ]
      },
      {
        "page": 91,
        "sections": [
          "8"
        ],
        "characters": 3984,
        "textSha256": "439a2c38ee5b3d4e87a612e979d478f5b6b10853dfe9abd1f875a781b50bd8dc",
        "namedStatements": [
          "Lemma 6.2"
        ]
      },
      {
        "page": 92,
        "sections": [
          "8"
        ],
        "characters": 3848,
        "textSha256": "2d6d77d8a096f1b07b98adf70a7117aabd182fb46990b3dfd3aee01cdb6f8a66",
        "namedStatements": [
          "Lemma 8.2",
          "Proposition 8.3",
          "Theorem 4.6"
        ]
      },
      {
        "page": 93,
        "sections": [
          "8"
        ],
        "characters": 3784,
        "textSha256": "fde3a5813fa0c3a0e3cc76e141a62b008ef81ee2938e96fed7e9095325208484",
        "namedStatements": [
          "Lemma 8.2",
          "Corollary 8.5"
        ]
      },
      {
        "page": 94,
        "sections": [
          "8"
        ],
        "characters": 4406,
        "textSha256": "815fb41626588a67a40d0f62a96e8e22dc9b0eb8191ed9d5e7a127bd5521f0ed",
        "namedStatements": [
          "Proposition 8.4"
        ]
      },
      {
        "page": 95,
        "sections": [
          "8"
        ],
        "characters": 3709,
        "textSha256": "1f3bc3f0c4af7dd137011412663442c14f7ed7b020d0428572ada6283d654125",
        "namedStatements": [
          "Corollary 8.5",
          "Proposition 8.4",
          "Lemma 8.2",
          "Lemma 8.6"
        ]
      },
      {
        "page": 96,
        "sections": [
          "8"
        ],
        "characters": 4063,
        "textSha256": "ff8e68de317bf547a32754a84d7db668cd0a8dfbfc3dc50616ab93142556cb2d",
        "namedStatements": [
          "Proposition 8.3",
          "Lemma 8.2",
          "Corollary 8.5",
          "Lemma 8.6"
        ]
      },
      {
        "page": 97,
        "sections": [
          "8"
        ],
        "characters": 3752,
        "textSha256": "0203b0e90e89064fa5dd278c45abc253d4027ff25272ce530e00c41e4e14ce9b",
        "namedStatements": [
          "Proposition 5.5",
          "Lemma 8.7",
          "Lemma 8.8"
        ]
      },
      {
        "page": 98,
        "sections": [
          "8"
        ],
        "characters": 3883,
        "textSha256": "23d5f6f99820d7aaddc6399456fb7d5ddc01ee10e598582fe7e122aa2baf23e3",
        "namedStatements": [
          "Lemma 8.2",
          "Lemma 8.8",
          "Lemma 8.7"
        ]
      },
      {
        "page": 99,
        "sections": [
          "8"
        ],
        "characters": 4134,
        "textSha256": "5f301af18378620fa349ef0eec7f21d82acdbabec2e8101559e73fab492e4444",
        "namedStatements": [
          "Lemma 8.7",
          "Lemma 6.2"
        ]
      },
      {
        "page": 100,
        "sections": [
          "8",
          "9"
        ],
        "characters": 3797,
        "textSha256": "d74c2d853cf4f26d518cf6a3e11ded7c0f8799c70f27d8b338fda6b43971d180",
        "namedStatements": [
          "Proposition 9.6",
          "Theorem 3.1",
          "Proposition 5.5",
          "Lemma 7.7",
          "Proposition 7.2",
          "Lemma 9.7",
          "Proposition 9.9"
        ]
      },
      {
        "page": 101,
        "sections": [
          "9"
        ],
        "characters": 3681,
        "textSha256": "82f6b7735ca270319c5024c5b46497b3dd12801c7ea48a9c6eadca836cc9d310",
        "namedStatements": [
          "Lemma 7.7",
          "Proposition 9.1",
          "Lemma 9.2",
          "Proposition 9.6",
          "Proposition 7.2"
        ]
      },
      {
        "page": 102,
        "sections": [
          "9"
        ],
        "characters": 3520,
        "textSha256": "2b0c37e017f7088c510a8196d07db32d32d1fca669750be6f4257b512e7ed60a",
        "namedStatements": [
          "Proposition 7.2",
          "Lemma 9.2"
        ]
      },
      {
        "page": 103,
        "sections": [
          "9"
        ],
        "characters": 4019,
        "textSha256": "60db3d0f3ada32ffa8f7377da94f35355db1bb587e6b1ee9296a2817dd9b4260",
        "namedStatements": [
          "Lemma 6.1",
          "Proposition 9.1",
          "Lemma 9.2",
          "Proposition 7.2",
          "Proposition 9.3"
        ]
      },
      {
        "page": 104,
        "sections": [
          "9"
        ],
        "characters": 4289,
        "textSha256": "0c092af9f1e67ae3d927ac459d0374d4a7ccfa3fe072c1197c5f1ddc0b07f6c8",
        "namedStatements": [
          "Lemma 9.2",
          "Proposition 7.6"
        ]
      },
      {
        "page": 105,
        "sections": [
          "9"
        ],
        "characters": 3961,
        "textSha256": "2ce96c78e6df4d2d08b1798fbbbb0858981e620dec6d8de165d28772a603d53a",
        "namedStatements": [
          "Proposition 7.6",
          "Proposition 7.2",
          "Lemma 6.2",
          "Proposition 9.1",
          "Lemma 8.2",
          "Proposition 8.1"
        ]
      },
      {
        "page": 106,
        "sections": [
          "9"
        ],
        "characters": 3894,
        "textSha256": "8b20c7454e8a3b20d03994fffbf08f1fcf8843d7033c50a0586432ed18dea7bd",
        "namedStatements": [
          "Proposition 9.5",
          "Proposition 9.6",
          "Definition 9.4",
          "Proposition 9.3",
          "Proposition 8.3"
        ]
      },
      {
        "page": 107,
        "sections": [
          "9"
        ],
        "characters": 4352,
        "textSha256": "b8a8ee16e6165a2e997149f2150fb499d23f2a5fb2c3060ebdb51f3571298f57",
        "namedStatements": [
          "Proposition 7.5",
          "Proposition 9.6",
          "Definition 9.4"
        ]
      },
      {
        "page": 108,
        "sections": [
          "9"
        ],
        "characters": 3613,
        "textSha256": "f24850b4935e39ae0fab85f4a862f32055f14bd616b1305729906ca94318808d",
        "namedStatements": [
          "Proposition 7.2",
          "Proposition 9.1",
          "Lemma 9.2"
        ]
      },
      {
        "page": 109,
        "sections": [
          "9"
        ],
        "characters": 4248,
        "textSha256": "efaa8b1c48bf85f759d0f077c11f23b23e16a45f41cbf7b9c5b215f8d226b2c6",
        "namedStatements": [
          "Proposition 9.3",
          "Lemma 7.7",
          "Corollary 7.8"
        ]
      },
      {
        "page": 110,
        "sections": [
          "9"
        ],
        "characters": 3481,
        "textSha256": "e8b0f06d88886831a551755eadcefbd283af4fa05301a7110a1c371e3778fdb4",
        "namedStatements": [
          "Lemma 8.6"
        ]
      },
      {
        "page": 111,
        "sections": [
          "9"
        ],
        "characters": 3832,
        "textSha256": "b18c9b020febb29a51ccb1a9f5446a088268119861c5fbe052c4bedeb2e11afa",
        "namedStatements": [
          "Proposition 9.3",
          "Lemma 5.4",
          "Lemma 9.7",
          "Lemma 9.8"
        ]
      },
      {
        "page": 112,
        "sections": [
          "9"
        ],
        "characters": 3713,
        "textSha256": "c5bea2a89aeff26d21c246328a0337616e75441cff9034c8e954868d00575d1c",
        "namedStatements": [
          "Corollary 7.3",
          "Lemma 8.7"
        ]
      },
      {
        "page": 113,
        "sections": [
          "9"
        ],
        "characters": 3867,
        "textSha256": "f2f17addefe6d3071fc8b60f6f50097b4ac3b80eccf4a159279f43c4c22116ab",
        "namedStatements": [
          "Lemma 9.8"
        ]
      },
      {
        "page": 114,
        "sections": [
          "9"
        ],
        "characters": 3826,
        "textSha256": "d3728ee90e196028fcab0176aaf5ee0f0528eae110622238754a4172a02545a3",
        "namedStatements": [
          "Lemma 5.4",
          "Proposition 9.9",
          "Theorem 3.1",
          "Lemma 9.7",
          "Lemma 9.8"
        ]
      },
      {
        "page": 115,
        "sections": [
          "9"
        ],
        "characters": 3693,
        "textSha256": "2d73ffcd646b538140a8259eb561675fba83011e3418485bc4505127628a2e6e",
        "namedStatements": [
          "Lemma 5.4",
          "Theorem 3.1",
          "Theorem 4.6",
          "Proposition 5.5"
        ]
      },
      {
        "page": 116,
        "sections": [
          "9",
          "10"
        ],
        "characters": 3611,
        "textSha256": "b37cff2794d7ac739e0ddd9feca4dfb8388e94c3f8adc01763de5f105cc5513e",
        "namedStatements": [
          "Theorem 3.1",
          "Lemma A.6",
          "Theorem 1.1"
        ]
      },
      {
        "page": 117,
        "sections": [
          "10"
        ],
        "characters": 3725,
        "textSha256": "b61dcb1cd2644c6d04c4aa487fde98c5ebbd6886bb0db4aef121a1b49c795635",
        "namedStatements": [
          "Proposition 10.1",
          "Lemma 10.3",
          "Lemma 10.2",
          "Lemma 10.4",
          "Lemma 10.5",
          "Theorem 1.1",
          "Corollary 10.6",
          "Theorem 3.1",
          "Proposition 5.5"
        ]
      },
      {
        "page": 118,
        "sections": [
          "10"
        ],
        "characters": 3578,
        "textSha256": "5332dc3c925254de6333cbf485211d162fb6df10fe88835bdbeb50499e8ce2aa",
        "namedStatements": [
          "Theorem 3.1",
          "Lemma 10.2",
          "Lemma 10.3"
        ]
      },
      {
        "page": 119,
        "sections": [
          "10"
        ],
        "characters": 4586,
        "textSha256": "75a1e892d4d4ed39d6d87456cbfe7a243d587dbfa8026387c3ec735e0888b78d",
        "namedStatements": [
          "Theorem 3.1",
          "Proposition 9.9"
        ]
      },
      {
        "page": 120,
        "sections": [
          "10"
        ],
        "characters": 4714,
        "textSha256": "e743a15a9302cb7d2a7e226f0ec8a4d87ab45cea3f0a29b0b794a38b189eb840",
        "namedStatements": [
          "Lemma 10.3"
        ]
      },
      {
        "page": 121,
        "sections": [
          "10"
        ],
        "characters": 3582,
        "textSha256": "d306092b6108977f856fd208c62791f265b4dfe270a165d56d2b0b490104ed16",
        "namedStatements": [
          "Lemma 10.3",
          "Lemma 10.4",
          "Lemma 10.5",
          "Proposition 10.1"
        ]
      },
      {
        "page": 122,
        "sections": [
          "10"
        ],
        "characters": 4080,
        "textSha256": "8b9248a4889172872a564415887513275c939ec9be580ca232e5efce65e3f0c0",
        "namedStatements": []
      },
      {
        "page": 123,
        "sections": [
          "10"
        ],
        "characters": 3718,
        "textSha256": "25d99dc29af4d8065a47378456cd34cb90db3a2d530d42c3326b4716594be9a9",
        "namedStatements": [
          "Lemma 10.3",
          "Theorem 3.1",
          "Lemma 10.5"
        ]
      },
      {
        "page": 124,
        "sections": [
          "10"
        ],
        "characters": 3974,
        "textSha256": "610c472fbdee84d0aa1839d9cc02fe9637a499c492ddbfe5b578cc986ae9fb8d",
        "namedStatements": [
          "Theorem 1.1",
          "Lemma 10.3",
          "Lemma 10.4",
          "Theorem 3.1",
          "Lemma 10.5"
        ]
      },
      {
        "page": 125,
        "sections": [
          "10"
        ],
        "characters": 3273,
        "textSha256": "6de87a02ffcd8089161e287fb79191d4e4a6728fbc34626e27c5168855041843",
        "namedStatements": [
          "Proposition 10.1",
          "Lemma 10.3",
          "Corollary 10.6"
        ]
      },
      {
        "page": 126,
        "sections": [
          "10",
          "A"
        ],
        "characters": 3547,
        "textSha256": "22dfb839a10032dd4d6a7db7886197f8021d12f4187821f81614d35fd301cc91",
        "namedStatements": [
          "Theorem 4.6",
          "Lemma A.5",
          "Lemma A.8",
          "Proposition B.8",
          "Proposition C.2",
          "Proposition A.7",
          "Lemma A.1",
          "Lemma A.2",
          "Lemma 4.4"
        ]
      },
      {
        "page": 127,
        "sections": [
          "A"
        ],
        "characters": 3922,
        "textSha256": "0c15847edcfa316c2cc5ef42205565360eff2edab4dcb5dd178add15df747dde",
        "namedStatements": [
          "Lemma A.2"
        ]
      },
      {
        "page": 128,
        "sections": [
          "A"
        ],
        "characters": 3395,
        "textSha256": "7ab1b04158d62214e7f98afcc2984d23f775cd7456c17cf6202f2e63b3529660",
        "namedStatements": [
          "Corollary A.3",
          "Lemma A.1",
          "Lemma 4.4"
        ]
      },
      {
        "page": 129,
        "sections": [
          "A"
        ],
        "characters": 3802,
        "textSha256": "0ac04a725e5241e73931a56e0617e943bea148a1ee6ac2163a5d226654f4f76c",
        "namedStatements": [
          "Definition 3.3"
        ]
      },
      {
        "page": 130,
        "sections": [
          "A"
        ],
        "characters": 4041,
        "textSha256": "50cee327ff112326be662171dadd851bb0848e6dd9c20ab6a58ef2602349d99a",
        "namedStatements": [
          "Proposition A.4"
        ]
      },
      {
        "page": 131,
        "sections": [
          "A"
        ],
        "characters": 4250,
        "textSha256": "499a511975ad82687614ecfcc7e6fc88e2b182ef6f5ead6e372d2f3dc86f7c5c",
        "namedStatements": [
          "Proposition A.4"
        ]
      },
      {
        "page": 132,
        "sections": [
          "A"
        ],
        "characters": 4163,
        "textSha256": "e2498af4e162c3f18175dea60df6788f472ece08287ead9a11f660aaf74defe7",
        "namedStatements": [
          "Lemma A.2"
        ]
      },
      {
        "page": 133,
        "sections": [
          "A"
        ],
        "characters": 4019,
        "textSha256": "d8661b5f427440c6f204757acc900d723a87cd2b4fe16ddd6cdc6583ec5f074f",
        "namedStatements": [
          "Lemma A.2",
          "Proposition B.2",
          "Lemma A.5"
        ]
      },
      {
        "page": 134,
        "sections": [
          "A"
        ],
        "characters": 3989,
        "textSha256": "cfdf145368a3b37c90fd7ef1c9b3887fe28dee40fde7a75c83390bfe6d767f13",
        "namedStatements": [
          "Lemma 4.4",
          "Proposition A.4",
          "Lemma 4.5"
        ]
      },
      {
        "page": 135,
        "sections": [
          "A"
        ],
        "characters": 3917,
        "textSha256": "4630ffa71cfaf1353d2d16f3177669f29f08212cc21417764caf20532b5391ad",
        "namedStatements": []
      },
      {
        "page": 136,
        "sections": [
          "A"
        ],
        "characters": 3750,
        "textSha256": "dcedcee3622ce1230c5af4fba5ff114d5835eafbf61990601541c975a84e9b84",
        "namedStatements": []
      },
      {
        "page": 137,
        "sections": [
          "A"
        ],
        "characters": 4219,
        "textSha256": "f0b098ccc864eba2bbc31d8b88bf4b9fff0ca90ff833dec6f6fe1bbc18fc6e39",
        "namedStatements": [
          "Proposition A.4",
          "Lemma A.6",
          "Proposition A.7",
          "Proposition 4.2",
          "Lemma A.8",
          "Proposition A.10"
        ]
      },
      {
        "page": 138,
        "sections": [
          "A"
        ],
        "characters": 3778,
        "textSha256": "af52d5ed70d8b58ec59bc6735968346a1a550b0e9bcd9bfbf009839b576872d7",
        "namedStatements": [
          "Lemma A.6"
        ]
      },
      {
        "page": 139,
        "sections": [
          "A"
        ],
        "characters": 4491,
        "textSha256": "e1fc6a81874736d108870f20ab3819ea8b46e3823ff24a44801d2dde54ee1b3c",
        "namedStatements": [
          "Proposition A.4",
          "Proposition A.7"
        ]
      },
      {
        "page": 140,
        "sections": [
          "A"
        ],
        "characters": 4607,
        "textSha256": "a0b7778debe6a759b336b523b46526137e0a1c2adc75763e453878ae53ec3a6e",
        "namedStatements": [
          "Lemma A.1",
          "Lemma A.2",
          "Proposition A.4",
          "Lemma A.8",
          "Proposition A.10",
          "Proposition B.2",
          "Corollary B.10"
        ]
      },
      {
        "page": 141,
        "sections": [
          "A"
        ],
        "characters": 5038,
        "textSha256": "764ca0418005bde49f39793e322068a93f4afd3e486147692e2b1b13bddafd6d",
        "namedStatements": [
          "Lemma A.6",
          "Lemma A.9"
        ]
      },
      {
        "page": 142,
        "sections": [
          "A"
        ],
        "characters": 4119,
        "textSha256": "091773eb19b4d6e64eb4b9bc2f10ba873961f9cb20b47ff479f2e2b3e2bffca2",
        "namedStatements": [
          "Proposition A.10",
          "Lemma A.8",
          "Lemma A.6"
        ]
      },
      {
        "page": 143,
        "sections": [
          "A"
        ],
        "characters": 3903,
        "textSha256": "78e5909a501075c2dc292b1e82cbfddc289cb2b6648e6a4f1120d19d187013d7",
        "namedStatements": [
          "Lemma A.9"
        ]
      },
      {
        "page": 144,
        "sections": [
          "A",
          "B"
        ],
        "characters": 3391,
        "textSha256": "c369e9bfd847806633ef2b8bac41b3121ac0c1c4d4f979c030ed7d41188d90b1",
        "namedStatements": [
          "Proposition B.2",
          "Lemma A.5",
          "Corollary B.10",
          "Proposition B.3"
        ]
      },
      {
        "page": 145,
        "sections": [
          "B"
        ],
        "characters": 4048,
        "textSha256": "414b9e6fc0f48ce552fc7f51ed22ab4487e4c7f2d3a20e5f8c6c5251d78df2bb",
        "namedStatements": [
          "Lemma B.1",
          "Proposition B.2"
        ]
      },
      {
        "page": 146,
        "sections": [
          "B"
        ],
        "characters": 3853,
        "textSha256": "33ae4af9bd70434a1539db6f9e629ae7924a3612277d949c7654c3ef1b73fce3",
        "namedStatements": [
          "Proposition B.2"
        ]
      },
      {
        "page": 147,
        "sections": [
          "B"
        ],
        "characters": 3449,
        "textSha256": "f887f0f2d5b418757b7543d2ffa470584ec970603c078cb137b07c226b02ffcb",
        "namedStatements": [
          "Lemma B.1"
        ]
      },
      {
        "page": 148,
        "sections": [
          "B"
        ],
        "characters": 3778,
        "textSha256": "52e63ae9c76635db28b3e27769c9cbbd3750d3af7d6a5816192b546fa374ed61",
        "namedStatements": [
          "Proposition B.3",
          "Lemma B.4"
        ]
      },
      {
        "page": 149,
        "sections": [
          "B"
        ],
        "characters": 3672,
        "textSha256": "7d3fe8e9f6c47230e57ea88c2a7a4444d946235865039891825652b9cee16924",
        "namedStatements": []
      },
      {
        "page": 150,
        "sections": [
          "B"
        ],
        "characters": 3857,
        "textSha256": "b762a81b371b8537ba92d99bc020a04ef2e051a5a89d9ccb8f47003ccb242fdc",
        "namedStatements": [
          "Proposition B.2",
          "Lemma A.5",
          "Lemma B.4",
          "Proposition B.5",
          "Proposition B.3"
        ]
      },
      {
        "page": 151,
        "sections": [
          "B"
        ],
        "characters": 4255,
        "textSha256": "0e48e571d71ee6172d2759b165a1e1868390b8020bf131b56cc8132c38c13d72",
        "namedStatements": [
          "Lemma B.4",
          "Proposition B.5"
        ]
      },
      {
        "page": 152,
        "sections": [
          "B"
        ],
        "characters": 3864,
        "textSha256": "7a18658b35398de4686bb5a949d844345c29721f1516e588a3421f089ede0fdd",
        "namedStatements": [
          "Lemma B.4",
          "Lemma 4.5",
          "Lemma A.9"
        ]
      },
      {
        "page": 153,
        "sections": [
          "B"
        ],
        "characters": 4066,
        "textSha256": "caa940b43c6a921a6e4ded5829fc32ebbdb2f17e6264903757acf19a7d82ad6b",
        "namedStatements": [
          "Lemma B.4",
          "Proposition B.2",
          "Proposition B.5"
        ]
      },
      {
        "page": 154,
        "sections": [
          "B"
        ],
        "characters": 3609,
        "textSha256": "d96eb095bf43c0abb0c70514336d70086bab16c45ad9e140379be5960b053d27",
        "namedStatements": [
          "Proposition B.8",
          "Lemma B.7",
          "Proposition B.5",
          "Lemma B.4"
        ]
      },
      {
        "page": 155,
        "sections": [
          "B"
        ],
        "characters": 4342,
        "textSha256": "0a112ece194bf3302897af4a8e6da2be1232c25905a0481eefdec9d412483826",
        "namedStatements": [
          "Proposition B.8",
          "Lemma 4.4",
          "Proposition B.5"
        ]
      },
      {
        "page": 156,
        "sections": [
          "B"
        ],
        "characters": 4109,
        "textSha256": "892acd57f05169753cf6058cc0b6fe75cbf8d4c7374291050ad40c86e704efbe",
        "namedStatements": []
      },
      {
        "page": 157,
        "sections": [
          "B",
          "C"
        ],
        "characters": 4053,
        "textSha256": "d52d995f0f6a49c3c2682d87cb97b4693de455075184e447515097d447d36102",
        "namedStatements": [
          "Corollary A.3",
          "Lemma A.2",
          "Lemma 4.4",
          "Lemma B.7",
          "Corollary B.10",
          "Proposition B.2",
          "Corollary B.6"
        ]
      },
      {
        "page": 158,
        "sections": [
          "C"
        ],
        "characters": 4031,
        "textSha256": "df93e2df128d6dac1564f9b61e4c0aaee7a3e11d0b26b9ac9b202d42e4afe928",
        "namedStatements": [
          "Lemma 4.5",
          "Lemma C.1",
          "Proposition C.2",
          "Corollary B.10",
          "Proposition A.4",
          "Proposition A.7",
          "Proposition B.8",
          "Lemma A.8",
          "Corollary B.6"
        ]
      },
      {
        "page": 159,
        "sections": [
          "C"
        ],
        "characters": 4183,
        "textSha256": "20244dbba2be2b3a5f51891c0763e729df1f3747f15cc2786da02866cb8e9077",
        "namedStatements": []
      },
      {
        "page": 160,
        "sections": [
          "C"
        ],
        "characters": 3591,
        "textSha256": "3f12cc6d979263d30937c3af99b9da50e6205704bebffcee8c72488b0f1ddce2",
        "namedStatements": []
      },
      {
        "page": 161,
        "sections": [
          "C"
        ],
        "characters": 4498,
        "textSha256": "7c4100dc914f0b26474e73ad3d9480f3df99b92e8532a9604e6f7ad5ca7bd5fc",
        "namedStatements": [
          "Lemma C.1",
          "Proposition C.2"
        ]
      },
      {
        "page": 162,
        "sections": [
          "C"
        ],
        "characters": 4067,
        "textSha256": "dbe61305d23a293236d0d643d421850b88d42454229b99f344ae998053931440",
        "namedStatements": [
          "Lemma C.1",
          "Lemma A.1",
          "Corollary A.3",
          "Lemma A.2"
        ]
      },
      {
        "page": 163,
        "sections": [
          "C"
        ],
        "characters": 4199,
        "textSha256": "16b743e4e859f7cace2c6872a497c7420c8a9a512c28c65c2416b6c037eaadde",
        "namedStatements": [
          "Lemma 4.4",
          "Proposition C.2",
          "Proposition C.3",
          "Theorem 4.6",
          "Proposition 4.10",
          "Proposition B.5",
          "Lemma A.8"
        ]
      },
      {
        "page": 164,
        "sections": [
          "C"
        ],
        "characters": 3888,
        "textSha256": "d04db8407bf2f878ce414ac2bfebc283ce0eda89d331ca1e2745de12a57e3a35",
        "namedStatements": [
          "Proposition A.10",
          "Theorem 4.6",
          "Proposition B.2",
          "Corollary B.6",
          "Proposition C.2",
          "Lemma A.6",
          "Lemma A.5",
          "Proposition 4.2"
        ]
      },
      {
        "page": 165,
        "sections": [
          "C",
          "References"
        ],
        "characters": 4797,
        "textSha256": "bcce45290cadd6ec5b3a811f31766feb15ead2a3afd8fe7f1e4906020df9d47b",
        "namedStatements": [
          "Proposition A.4",
          "Proposition C.2",
          "Theorem 4.6"
        ]
      },
      {
        "page": 166,
        "sections": [
          "References"
        ],
        "characters": 1304,
        "textSha256": "a5d94c77247600bb82cf649b07e9c0b774a3a6c004bb7961008e313af90a49c6",
        "namedStatements": []
      }
    ],
    "coveragePass": true,
    "dependencyPath": [
      "Theorem4.6",
      "Proposition5.5",
      "Proposition7.5",
      "Proposition9.6",
      "Proposition9.9",
      "Proposition10.1",
      "Lemma10.3",
      "Theorem1.1"
    ],
    "claimGraph": [
      {
        "id": "leading",
        "label": "Axisymmetric leading profile",
        "references": [
          "Theorem 4.6",
          "Appendices A–C"
        ],
        "dependsOn": []
      },
      {
        "id": "background",
        "label": "All-order corrected background + annular stress",
        "references": [
          "Proposition 5.5"
        ],
        "dependsOn": [
          "leading"
        ]
      },
      {
        "id": "waves",
        "label": "Two pulse families and covariance matching",
        "references": [
          "Lemma 7.4",
          "Proposition 7.5",
          "Lemma 7.7"
        ],
        "dependsOn": [
          "background"
        ]
      },
      {
        "id": "moments",
        "label": "Pressure and five moment corrections",
        "references": [
          "Proposition 8.3",
          "Lemma 8.7",
          "Lemma 8.8"
        ],
        "dependsOn": [
          "waves"
        ]
      },
      {
        "id": "iteration",
        "label": "Recompute and improve full residual",
        "references": [
          "Propositions 9.3, 9.5, 9.6"
        ],
        "dependsOn": [
          "moments"
        ]
      },
      {
        "id": "summation",
        "label": "Locally finite summation, flat residual",
        "references": [
          "Lemma 5.4",
          "Proposition 9.9",
          "Theorem 3.1"
        ],
        "dependsOn": [
          "iteration"
        ]
      },
      {
        "id": "localization",
        "label": "Smooth compact force, energy and breakdown",
        "references": [
          "Proposition 10.1",
          "Lemmas 10.2–10.5",
          "Theorem 1.1"
        ],
        "dependsOn": [
          "summation"
        ]
      },
      {
        "id": "periodic",
        "label": "Periodic counterpart",
        "references": [
          "Corollary 10.6"
        ],
        "dependsOn": [
          "localization"
        ]
      }
    ],
    "implementationMap": [
      {
        "module": "coordinates.mjs",
        "pages": [
          24,
          25
        ],
        "references": [
          "4.1",
          "4.2"
        ]
      },
      {
        "module": "profile.mjs",
        "pages": [
          25,
          26,
          27,
          34,
          35,
          36,
          37
        ],
        "references": [
          "4.4",
          "4.5",
          "4.6",
          "4.10",
          "4.13",
          "Theorem4.6"
        ]
      },
      {
        "module": "radial.mjs",
        "pages": [
          129,
          130,
          133,
          139,
          155,
          156,
          157,
          161,
          162,
          163
        ],
        "references": [
          "A.5-A.13",
          "A.21",
          "B.35-B.40",
          "C.12",
          "C.17",
          "C.18"
        ]
      },
      {
        "module": "axis-series.mjs",
        "pages": [
          144,
          145,
          146,
          147,
          148
        ],
        "references": [
          "B.1-B.16",
          "PropositionB.2"
        ]
      },
      {
        "module": "heat.mjs",
        "pages": [
          138,
          139
        ],
        "references": [
          "LemmaA.6",
          "A.32-A.38"
        ]
      }
    ],
    "audit": "All166 page text and section/statement structure mapped. This is not a line-by-line independent proof audit."
  },
  "analyticContracts": [
    {
      "id": "AXIS_B_RHO",
      "operator": "nonlinear axis fixed point and all eta derivatives",
      "norm": "||a||_{B_rho}=sup_{alpha,beta} |a_alpha_beta|/w_alpha_beta; w=20^(-alpha)rho^(-beta) beta! binom(alpha+beta,beta)/((alpha+1)^2(beta+1)^2)",
      "domain": "Y=Lambda X complex analytic neighborhood; eta in a common complex neighborhood Omega of [-1,1]",
      "quantifiers": "There exist rho>0, invariant radius R, and contraction constant 0<=k<1 such that F maps the closed ball into itself and ||F(a)-F(b)||<=k||a-b|| for all a,b in the ball. Banach completeness is required.",
      "requiredBounds": [
        "sup_Omega |g|<=1",
        "holomorphic coefficients and denominators separated from zero",
        "uniform all-eta coefficient/tail and derivative bounds"
      ],
      "status": "THEOREM_REFERENCE_UNINSTANTIATED",
      "sources": [
        "N00 pp145-148 B.11-B.16"
      ]
    },
    {
      "id": "DERIVATIVE_LIMIT_EXCHANGE",
      "operator": "partial_eta of infinite reconstruction / derivative of uniform limit",
      "norm": "uniform convergence of derivative on an open real set s; pointwise convergence of functions at each x in s",
      "domain": "s subset R is open; f_n,fp_n,g,gp:s->R",
      "quantifiers": "TendstoUniformlyOn fp gp atTop s; eventually for every x in s HasDerivAt(f_n)(fp_n x)x; for every x in s f_n x tends to g x. Then for each x in s HasDerivAt g(gp x)x.",
      "leanTarget": "MathScope.Navier.Analytic.uniform_derivative_exchange",
      "status": "LOCAL_ADAPTER_BUILD_STATUS_IN_LEAN_LEDGER",
      "limitation": "No array sample establishes these universal convergence hypotheses."
    },
    {
      "id": "HEAT_DOMINATED_DIFFERENTIATION",
      "operator": "derivatives of H under the infinite integral",
      "domain": "Z>=0, 0<h<.01; each fixed derivative order m>=0",
      "norm": "L1(0,infinity) in v",
      "quantifiers": "For each fixed m, abs(partial_Z^m integrand) <= (h)_m exp(-v)v^(h+m), an integrable majorant uniform over Z>=0. Gamma(1+h)>0.",
      "status": "ANALYTIC_REFERENCE_PLUS_EXPLICIT_FINITE_INTERVAL_QUADRATURE",
      "sources": [
        "N00 p138 A.32-A.35"
      ],
      "limitation": "Implemented derivative orders0..4; unbounded m cannot be inferred from finite output."
    },
    {
      "id": "HEAT_TAYLOR",
      "operator": "finite Taylor expansion at Z=0",
      "domain": "Z>=0,h>0,finiteN",
      "norm": "absolute scalar remainder <= (h)_(N+1)(1+h)_(N+1) Z^(N+1)/(N+1)!",
      "quantifiers": "For every finite N the Taylor remainder bound follows from the derivative majorant. The infinite Taylor series has radius0 for h>0.",
      "status": "FINITE_REMAINDER_EVALUATOR",
      "sources": [
        "N00 p138 A.35"
      ]
    },
    {
      "id": "BOREL_CUTOFF",
      "operator": "background and all-order correction synthesis beyond M1",
      "domain": "common local physical domain with cutoffs epsilon_k selected per derivative seminorm",
      "norm": "C^m seminorms weighted by q powers; for each fixed m,sum_k norm_m(term_k)<infinity",
      "quantifiers": "For every derivative order m choose all sufficiently late cutoff thresholds so term_k is bounded by2^-k in that seminorm; common supports and divergence-preserving construction are required.",
      "status": "THEOREM_REFERENCE_OUT_OF_M1",
      "sources": [
        "N00 pp59-62 Proposition5.5",
        "N00 pp111-116 Proposition9.9"
      ]
    },
    {
      "id": "SEMIGROUP",
      "operator": "Fourier diffusion exp(-nu|k|^2 t)",
      "domain": "nu>=0,t>=0,k in Z^3; L2(T3) for contraction",
      "norm": "abs multiplier<=1; coefficient ell2 contraction",
      "quantifiers": "For every nonnegative rate and time,exp(-rate*time)<=1. Infinite-dimensional norm estimate additionally requires Parseval and summability.",
      "leanTarget": "MathScope.Navier.Analytic.diffusion_semigroup_bound",
      "status": "LOCAL_ADAPTER_BUILD_STATUS_IN_LEAN_LEDGER"
    },
    {
      "id": "RESIDUAL_STABILITY",
      "operator": "residual to solution error",
      "domain": "specified time interval, normed PDE class, initial/boundary errors and admissible constants",
      "norm": "||u-u_approx|| <= C_stab (||R|| + initialError + boundaryError)",
      "quantifiers": "A stability bound with finite explicitly supplied C_stab is a separate hypothesis; if totalResidual<=epsilon and C_stab>=0 then error<=C_stab epsilon.",
      "leanTarget": "MathScope.Navier.Analytic.stable_residual_budget",
      "status": "LOCAL_CONDITIONAL_ADAPTER",
      "limitation": "No global C_stab is provided for the candidate profile; residual is not reported as a solution-error bound."
    },
    {
      "id": "SPECTRAL_CONTINUUM",
      "operator": "Galerkin limit beyond finite FFT fixture",
      "domain": "solenoidal Fourier fields on T3; fixednu>0,time interval before any asserted singularity",
      "norm": "specified Hs convergence sufficient to multiply and differentiate; e.g. s>5/2 for3D product/control, with separate time regularity",
      "quantifiers": "A uniform-in-cutoff stability/compactness argument and convergence of nonlinear terms are required; finite dealiased convolution identity supplies neither.",
      "status": "THEOREM_REFERENCE_NO_CONTINUUM_LIMIT_CLAIM"
    },
    {
      "id": "SPECTRAL_MEASURE",
      "operator": "general infinite-dimensional spectral interpretation",
      "domain": "a densely defined self-adjoint nonnegative operator on a specified Hilbert space",
      "norm": "spectral measure integral exp(-t lambda); Hilbert norm",
      "quantifiers": "Requires self-adjointness, positivity and spectral theorem hypotheses; the scalar diffusion adapter does not certify these for arbitraryPDE operators.",
      "status": "NOT_USED_BY_CURRENT_NS_NUMERICS"
    }
  ],
  "evidenceGrades": {
    "THEOREM_REFERENCE": "Citation and precise statement, no local kernel proof of the full source claim.",
    "SOURCE_FORMULA": "Direct source expression, evaluated with stated normalization and domain.",
    "VERIFIED_NUMERICAL_ENCLOSURE": "Finite real interval quadrature/series and explicit error budget, without full PDE theorem.",
    "FINITE_NUMERICAL_FIXTURE": "Independent finite numerical consistency checks.",
    "FORMAL_NONLINEAR_AXIS_COEFFICIENTS": "Actual finite nonlinear recurrence coefficients; invariant ball, radius and tail are not certified.",
    "PARTIAL_CANDIDATE_WITH_BLOCKERS": "Source axis/exterior components and explicitly unverified continuation; full theorem gate remains closed.",
    "KERNEL_CHECKED_COMPONENTS": "Only exact named imported/local theorem types and their listed axioms pass the local unchanged kernel.",
    "FULL_CERTIFIED_PROFILE": "Reserved; no current computation may emit this grade."
  },
  "officialValidation": {
    "schemaVersion": 1,
    "sourceCommit": "f9e8bc5b38b6e212696e8a30e3e91517af887bbd",
    "checkedAt": "2026-10-09T16:06:24.537829+00:00",
    "scope": "The two exact C/D exported Lean declaration types at the original pinned rc2 commit. Separate from the 14:39 Lean4.34.1 component receipt, full default build, full paper-to-formal equivalence, and numerical profile certification.",
    "toolchain": "leanprover/lean4:v4.34.0-rc2",
    "kernelCommit": "6a10ac8c22beadecabdbb0919c2b50214762f91d",
    "executionProfile": {
      "kind": "PINNED_OFFICIAL_KERNEL_EXPLICIT_PATH_ENTRY",
      "vanillaCLIOutcome": "Environment path detection failed; exact vanilla commands and exits are separately logged.",
      "entrySourceUnchangedFromPreviouslyApprovedDriver": true,
      "driverSHA256": "a187c5263205d221e47724bbaf729cd377f40683b2670a543e3b7e6495108682",
      "officialSharedLibrarySHA256": "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5",
      "taskManagerWorkers": 1,
      "logicalOptionsReplaced": false,
      "proofSourcesChanged": false,
      "manifestChanged": false,
      "originalReleaseBytesChanged": false
    },
    "nsSubmissionBuild": {
      "target": "NavierStokes.ComparatorSolution",
      "exitCode": 0,
      "passed": true,
      "staticLocalSourceDependencyCount": 609,
      "reportedLakeJobs": 9371,
      "log": {
        "file": "official-validation/lake-build-ns-priority-pinned.log",
        "sha256": "f5ca33d2c60d99d59dbc9752bb614bf75964288e2533647584a9e264138192d5"
      },
      "commandReceipt": {
        "file": "official-validation/full-pinned-command-results.json",
        "sha256": "bf992d41b39bdd257ecb9b46e5caf1b6cff634466b6a05052f4d27333f346274",
        "stage": "lake-build-ns-priority-pinned"
      }
    },
    "submittedDeclarations": {
      "names": [
        "NavierStokes.Comparator.navier_stokes_breakdown_R3",
        "NavierStokes.Comparator.navier_stokes_breakdown_periodic"
      ],
      "entrySourceSHA256": "b0cf547fcf21a5760c90e326489a2cacdc890c71bfc4d51ecceccb826893f43d",
      "exitCode": 0,
      "kernelCommandAccepted": true,
      "passed": true,
      "axiomClosureRecordedForBothTargets": true,
      "permittedAxioms": [
        "Classical.choice",
        "Quot.sound",
        "propext"
      ],
      "unpermittedAxioms": [],
      "axioms": [
        {
          "declaration": "NavierStokes.Comparator.navier_stokes_breakdown_R3",
          "report": "[propext, Classical.choice, Quot.sound]",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ]
        },
        {
          "declaration": "NavierStokes.Comparator.navier_stokes_breakdown_periodic",
          "report": "[propext, Classical.choice, Quot.sound]",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ]
        }
      ],
      "originalSourceFile": "NavierStokes/ComparatorSolution.lean",
      "sourceURL": "https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/ComparatorSolution.lean",
      "sourceSHA256": "52950d5d618a8d34c9bfbdb16641c81c276e97b6d7fd2a76c08577353f0b0227",
      "oleanSHA256": "5025fa4e63160cea4fff8dd8f8350acabd3478cdc08563f383484fd01620de76",
      "oleanSizeBytes": 147272,
      "exactNormalTypes": "NavierStokes.Comparator.navier_stokes_breakdown_R3 : ∀ nu > 0,\n  ∃ u₀ f,\n    NavierStokes.Comparator.InitialVelocityConditionDecay u₀ ∧\n      NavierStokes.Comparator.ForceConditionDecay f ∧\n        ¬∃ v p, NavierStokes.Comparator.NavierStokesExistenceAndSmoothnessRn nu u₀ f v p\nNavierStokes.Comparator.navier_stokes_breakdown_periodic : ∀ nu > 0,\n  ∃ u₀ f,\n    NavierStokes.Comparator.InitialVelocityConditionPeriodic u₀ ∧\n      NavierStokes.Comparator.ForceConditionPeriodic f ∧\n        ¬∃ v p, NavierStokes.Comparator.NavierStokesExistenceAndSmoothnessPeriodic nu u₀ f v p",
      "sourceCopy": {
        "file": "official-validation/OfficialComparatorSolution.lean",
        "sha256": "52950d5d618a8d34c9bfbdb16641c81c276e97b6d7fd2a76c08577353f0b0227"
      },
      "entrySource": {
        "file": "official-validation/PinnedDeclarations.lean",
        "sha256": "b0cf547fcf21a5760c90e326489a2cacdc890c71bfc4d51ecceccb826893f43d"
      },
      "log": {
        "file": "official-validation/ns-pinned-declarations.log",
        "sha256": "4fc376bfe81caf561a1fd501d13f4ea2d9e2d6d41ee9fa687b82f2649ebb3a08"
      },
      "commandReceipt": {
        "file": "official-validation/full-pinned-command-results.json",
        "sha256": "bf992d41b39bdd257ecb9b46e5caf1b6cff634466b6a05052f4d27333f346274",
        "stage": "ns-pinned-declarations"
      }
    },
    "comparator": {
      "status": "BLOCKED",
      "passed": false,
      "exitCode": 1,
      "reachedComparatorProcess": false,
      "blocker": "Required systemd user guard cannot start: no user bus. Session UID 0 also fails the documented unprivileged-user guarantee. Comparator was not reached. No sandbox guard omitted or replaced.",
      "configSHA256": "7610ecead7b390d80ff7f4229a3ff8f18d630e046f7ad1de4f92c7e8e76845b8",
      "guardBypassUsed": false,
      "alternateWeakerPathCountedAsSuccess": false,
      "commandReceipt": {
        "file": "official-validation/comparator-pinned-guarded.json",
        "sha256": "cb7dda2f8777f5419a03777a7ff4a4dd4b504c8c2292f699ac93287e6578e276"
      },
      "log": {
        "file": "official-validation/comparator-pinned-guarded.log",
        "sha256": "746707a49085d66703eb45f2baea0df38a88bab7346195ece161e8e14ef2a3d1"
      },
      "independentEnvironment": {
        "file": "official-validation/comparator-environment-independent.json",
        "sha256": "f7b8b6f2baa8061c0b08a772fa6ce47c85bb098cf27ea4509f801b4f3b18230a"
      }
    },
    "wholeDefaultBuildPassed": false,
    "remainingBuildScope": {
      "submittedLocalDependencyClosure": {
        "sourceModules": 609,
        "oleanArtifactsPresent": 609,
        "oleanArtifactsMissing": 0
      },
      "navierStokesRootSourceClosure": {
        "sourceModules": 753,
        "oleanArtifactsPresent": 692,
        "oleanArtifactsMissing": 61
      },
      "navierStokesWholeLibrary": {
        "sourceModules": 817,
        "oleanArtifactsPresent": 702,
        "oleanArtifactsMissing": 115
      },
      "eulerWholeLibrary": {
        "sourceModules": 1840,
        "oleanArtifactsPresent": 23,
        "oleanArtifactsMissing": 1817
      },
      "comparatorChallenges": {
        "sourceModules": 2,
        "oleanArtifactsPresent": 0,
        "oleanArtifactsMissing": 2
      },
      "grade": "POST_BUILD_ARTIFACT_INVENTORY_ONLY",
      "receipt": {
        "file": "official-validation/remaining-build-scope.json",
        "sha256": "4824f6c994416743f8682e22f6d941713cf0965b20f33183d29ce9529eaf4e20"
      }
    },
    "pinnedEntryKernelControls": {
      "file": "official-validation/pinned-entry-kernel-controls.json",
      "sha256": "83360471e078eaa0c76e2dc06f223a4ac0b62e937b8c309ce7611500ee884a10"
    },
    "originalTrackedSourcesUnchanged": true,
    "completeNumericalPaperProfileCertified": false,
    "browserKernelRerun": false,
    "browserSourceValidationPromotesKernelPass": false,
    "historicalComponentAuditAutomaticallyPromoted": false,
    "numericFieldInstantiatesExistentialWitness": false,
    "auditFile": "official-validation/official-audit-summary.json",
    "auditSHA256": "48b6adab5d50078b974baba02b01db5e771dfe8c18b99de4040823f3bed9e8ff",
    "historicalComponentAudit": {
      "file": "evidence/lean-validation.json",
      "sha256": "90f162823a56035559a584476854a27b2ed135f373183c43593ed47439d8ffe1",
      "checkedAt": "2026-10-09T14:39:01.694607+00:00",
      "toolchain": "Lean/mathlib4.34.1",
      "targetCount": 13,
      "unchanged": true
    }
  }
};

return {provenance};
})();
const __m1_18 = (()=>{
const fixtures = {
  "schemaVersion": 1,
  "method": "mpmath 100 decimal digits; direct original v-integral, mp.diff and exact decimal inputs",
  "precisionDigits": 100,
  "precisionBitsAtLeast": 330,
  "sourceSha256": "5fde9242b7467db31ab84f088b817605342087279664a75753556eb03352ddf5",
  "heat": [
    {
      "Z": "0",
      "h": "0.005",
      "derivatives": [
        "1.0",
        "-0.005025",
        "0.010125500625"
      ],
      "odeResidual": "-1.116198624299096662320101121391934530714755854319139317592896331276984996002674e-103"
    },
    {
      "Z": "0.1",
      "h": "0.005",
      "derivatives": [
        "0.99954018482290153508075127741323928972580469763160613767579415349593194013713027",
        "-0.0042342641576764553728695503622948407305425833194733078925327779707220609435623372",
        "0.006266182463434268903555481611457628650947396108862193711100072152013719402928738"
      ],
      "odeResidual": "-5.5809931214954833116005056069596726535737792715956965879644816563849249800133701e-104"
    },
    {
      "Z": "1",
      "h": "0.005",
      "derivatives": [
        "0.99701297020271104112174337212122016059846602614065124898599556086667235860387085",
        "-0.002016617759123284147913756689997426934165608621055667982606754694729900301195596",
        "0.0010600292796924623035836471919831237648311901680207881014917039377819713046142928"
      ],
      "odeResidual": "1.674297936448644993480151682087901796072133781478708976389344496915477494004011e-102"
    },
    {
      "Z": "10",
      "h": "0.005",
      "derivatives": [
        "0.98995973114771910568149804280806144912483458087026291823557680993934945774780536",
        "-0.00039546397188582142976424684800389523113531987224639957583313772049018032427528582",
        "0.000033697421577735436619760808277716805951029555355259598859454324323975738170258089"
      ],
      "odeResidual": "0.0"
    }
  ],
  "coordinates": [
    {
      "input": {
        "viscosity": "0.1",
        "tau": "0.1",
        "h": "0.005",
        "X": "0.37",
        "eta": "-0.8",
        "theta": "0.7"
      },
      "position": [
        "0.10965702121629172766127162890922635873473010772023013365741265555200100669170676",
        "0.092362834806675901767429233562475132373128400337407560779877058854714688913082321",
        "-0.13419002973037698224174311102247024649016415840590217602681623241107942537293733"
      ],
      "q": "0.27777777777777777777777777777777777777777777777777777777777777777777777777777778"
    },
    {
      "input": {
        "viscosity": "0.1",
        "tau": "0.1",
        "h": "0.005",
        "X": "0.37",
        "eta": "0",
        "theta": "0.7"
      },
      "position": [
        "0.065794212729775036596762977345535815240838064632138080194447593331200604015024053",
        "0.055417700884005541060457540137485079423877040202444536467926235312828813347849392",
        "0.0"
      ],
      "q": "0.1"
    },
    {
      "input": {
        "viscosity": "0.1",
        "tau": "0.1",
        "h": "0.005",
        "X": "0.37",
        "eta": "0.62",
        "theta": "0.7"
      },
      "position": [
        "0.083856819987984427591420931997039329925480407920594844207183740167881094684501021",
        "0.070631625098463392903021427886237901148269650519122829168678115395208597309833993",
        "0.079742321877644535083491541398577054917090513940340308763314724168159043854200258"
      ],
      "q": "0.16244314489928525016244314489928525016244314489928525016244314489928525016244314"
    },
    {
      "input": {
        "viscosity": "1",
        "tau": "0.1",
        "h": "0.005",
        "X": "0.37",
        "eta": "-0.8",
        "theta": "0.7"
      },
      "position": [
        "0.34676594847288933440743101729057125340921703400508514732247608727777066127007255",
        "0.29207692913897361544576822303285293416976857236111247439134614870739846956970346",
        "-0.42434613323370178188819350051782914495055387366923589862735089545135006225634598"
      ],
      "q": "0.27777777777777777777777777777777777777777777777777777777777777777777777777777778"
    },
    {
      "input": {
        "viscosity": "1",
        "tau": "0.1",
        "h": "0.005",
        "X": "0.37",
        "eta": "0",
        "theta": "0.7"
      },
      "position": [
        "0.20805956908373360064445861037434275204553022040305108839348565236666239676204353",
        "0.17524615748338416926746093381971176050186114341666748463480768922443908174182207",
        "0.0"
      ],
      "q": "0.1"
    },
    {
      "input": {
        "viscosity": "1",
        "tau": "0.1",
        "h": "0.005",
        "X": "0.37",
        "eta": "0.62",
        "theta": "0.7"
      },
      "position": [
        "0.26517854850076437913336630300953225951496527877085856557496802148561499526614017",
        "0.2233568101502589935571027574745990928906108765737332588427921373383173409368537",
        "0.2521673630436315256054100773785047760578280412175743349804587327332689689664536"
      ],
      "q": "0.16244314489928525016244314489928525016244314489928525016244314489928525016244314"
    },
    {
      "input": {
        "viscosity": "3",
        "tau": "0.1",
        "h": "0.005",
        "X": "0.37",
        "eta": "-0.8",
        "theta": "0.7"
      },
      "position": [
        "0.60061624108985566353681895962207533741920449984515825686578113805487938430271338",
        "0.50589208098739699873493755430484208860074528015780960010769061567150181130083865",
        "-0.73498906275616357070960895790017232119857100233891257969722641513616289620748372"
      ],
      "q": "0.27777777777777777777777777777777777777777777777777777777777777777777777777777778"
    },
    {
      "input": {
        "viscosity": "3",
        "tau": "0.1",
        "h": "0.005",
        "X": "0.37",
        "eta": "0",
        "theta": "0.7"
      },
      "position": [
        "0.36036974465391339812209137577324520245152269990709495411946868283292763058162803",
        "0.30353524859243819924096253258290525316044716809468576006461436940290108678050319",
        "0.0"
      ],
      "q": "0.1"
    },
    {
      "input": {
        "viscosity": "3",
        "tau": "0.1",
        "h": "0.005",
        "X": "0.37",
        "eta": "0.62",
        "theta": "0.7"
      },
      "position": [
        "0.45930271908069163796745256943904769468847947020121609685707609228737919825127334",
        "0.38686534339676449869879062353364950301517871037486829710513010861408334631223801",
        "0.4367666848022362471397057843497840851397485817745403280348305144650199457706219"
      ],
      "q": "0.16244314489928525016244314489928525016244314489928525016244314489928525016244314"
    }
  ],
  "exterior": [
    {
      "viscosity": "0.1",
      "tau": "0.3",
      "r": "1.2",
      "K": "0.11664829532077700075418607684135738339257720092907360937291699617869233259366144",
      "dr": "-0.098108604790898813163522152892331453041537565865911646355489191500585957736946309",
      "drr": "0.16417047338028073314058691642188350894598037052128920913953006814862641744742828",
      "dt": "0.00014075420817699160916892356495535596109648983211728306676522723296017772543747933",
      "cylindricalResidual": "-8.7203017523366926743757900108744885212090301118682759186945025881014452812708908e-104"
    },
    {
      "viscosity": "1",
      "tau": "0.3",
      "r": "1.2",
      "K": "1.1773379518721098078053692040200517043930774814373910250074158366593105456575367",
      "dr": "-0.98729843424213428111447834289162007646252988006900234743037671357590971945304666",
      "drr": "1.6475998456134155483703198184074550745728104846706270319044159346624659580904772",
      "dt": "0.0072553505004496142434148076505135494699540002816035305683965645580199796174267516",
      "cylindricalResidual": "-6.4739520209347606414565865040732202781455839550510080420387987214065129768155093e-102"
    },
    {
      "viscosity": "3",
      "tau": "0.3",
      "r": "1.2",
      "K": "3.5421968814687380826682907861245135080747120959482265944939842033093204436457978",
      "dr": "-2.9641798042739126337003692696557138351421032720124542748789236608534597286376047",
      "drr": "4.9414549407786232538558044208545081548841557324704046589000452209639456229059913",
      "dt": "0.034338475257883838424217617331503401641558817487939550973692753863769956195216934",
      "cylindricalResidual": "-2.5895808083739042565826346016292881112582335820204032168155194885626051907262037e-101"
    }
  ],
  "comparison": {
    "z": "4.1",
    "f0": "0.27111405540366438410279651499926797189639754554107052643309722382585993975143215"
  },
  "notClaimed": "Independent high precision numerical reference; not interval-certified mpmath or full source proof."
};

return {fixtures};
})();
const __m1_19 = (()=>{
const leanEvidence = {
  "schemaVersion": 1,
  "status": "KERNEL_CHECKED_COMPONENTS",
  "checkedAt": "2026-10-09T14:39:01.694607+00:00",
  "environment": {
    "leanVersion": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)",
    "mathlibCommit": "d13f23b723b8a846827a245b89c10fc7d3f11612",
    "driverSha256": "0e3f7d16718c0d2b6bf5bf80f26c66358b0468b35607d6ef0d921857b50440aa",
    "runtimeLibrarySha256": "6b30cc963d065fc9d2f87f7e9cbe0682b23000ae5425bccd769c5d477fa74f13",
    "kernelModified": false,
    "runtimeModified": false,
    "verifierGuardModified": false
  },
  "external": {
    "repository": "https://github.com/openai/NavierStokesAndEuler",
    "commit": "f9e8bc5b38b6e212696e8a30e3e91517af887bbd",
    "originalToolchain": "leanprover/lean4:v4.34.0-rc2",
    "componentValidationToolchain": "Lean/mathlib 4.34.1",
    "fullOriginalBuildPerformed": false,
    "comparatorMainTheoremsKernelChecked": false
  },
  "records": [
    {
      "module": "NavierStokes.Flatness",
      "sourceFile": "sources/official-repo/NavierStokes/Flatness.lean",
      "sourceSha256": "550606d4d1e14fb16612375de57d837df325a7b2265de6ed056c935ff96b2bc6",
      "command": [
        "/tmp/mathscope-lean-embed",
        "/workspace/scratch/afa9cd11a21b/lean-4.34.1-linux",
        "-o",
        "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/lean/.lake/build/lib/lean/NavierStokes/Flatness.olean",
        "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/sources/official-repo/NavierStokes/Flatness.lean"
      ],
      "exitCode": 0,
      "logFile": "lean-Flatness.log",
      "logSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "log": "",
      "targets": [],
      "executionMetrics": {
        "elapsedSeconds": 1.8305278360021475
      },
      "oleanSha256": "b4abb5b8c1594e65d4156bbd998003f94fe2151a16a2f1a63bb1c00c7b76fe1e",
      "externalSourceUnchanged": true
    },
    {
      "module": "NavierStokes.ProblemStatement",
      "sourceFile": "sources/official-repo/NavierStokes/ProblemStatement.lean",
      "sourceSha256": "d2f5cdf24a060acd41011b50492e89058991965e18d2cb797c58d915f95af633",
      "command": [
        "/tmp/mathscope-lean-embed",
        "/workspace/scratch/afa9cd11a21b/lean-4.34.1-linux",
        "-o",
        "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/lean/.lake/build/lib/lean/NavierStokes/ProblemStatement.olean",
        "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/sources/official-repo/NavierStokes/ProblemStatement.lean"
      ],
      "exitCode": 0,
      "logFile": "lean-ProblemStatement.log",
      "logSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "log": "",
      "targets": [],
      "executionMetrics": {
        "elapsedSeconds": 2.1579556920005416
      },
      "oleanSha256": "500d108ff387f3f9f041f58619de887b0db0f66a65d08d862fe5b4da4d6b1f9a",
      "externalSourceUnchanged": true
    },
    {
      "module": "MathScope.Navier.Analytic",
      "sourceFile": "lean/MathScope/Navier/Analytic.lean",
      "sourceSha256": "2709cac41470cb0c87aafd3ac431eed9ed4adf393db6046f7dd5e58fd8176ff3",
      "command": [
        "/tmp/mathscope-lean-embed",
        "/workspace/scratch/afa9cd11a21b/lean-4.34.1-linux",
        "-o",
        "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/lean/.lake/build/lib/lean/MathScope/Navier/Analytic.olean",
        "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/lean/MathScope/Navier/Analytic.lean"
      ],
      "exitCode": 0,
      "logFile": "lean-Analytic.log",
      "logSha256": "b0d2ef01934e7a1753c9a788b38c58f54492e76792a6e3532526e24cde2d0bff",
      "log": "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/lean/MathScope/Navier/Analytic.lean:45:23: warning: Variable name `hp1` is not explicitly referenced.\n\nHint: The binding can be removed (if unused) or named `_` (if used implicitly). Alternatively, prefix the name with `_` to silence this warning:\n  [apply] _hp1\n\nNote: This linter can be disabled with `set_option linter.unusedVariables false`\nMathScope.Navier.Analytic.scale_exponents (h : ℝ) : 1 / 2 + h + (1 / 2 - h) = 1\n'MathScope.Navier.Analytic.scale_exponents' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.Navier.Analytic.core_energy_exponent (h : ℝ) : 1 + (1 / 2 - h) - 2 * (1 / 2 + h) = 1 / 2 - 3 * h\n'MathScope.Navier.Analytic.core_energy_exponent' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.Navier.Analytic.coordinate_denominator_positive (h eta : ℝ) (hh : 0 ≤ h) (hh' : h < 1 / 2)\n  (heta : |eta| ≤ 1) : 0 < 1 - 2 * h * eta ^ 2\n'MathScope.Navier.Analytic.coordinate_denominator_positive' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.Navier.Analytic.uniform_derivative_exchange (f fp : ℕ → ℝ → ℝ) (g gp : ℝ → ℝ) (s : Set ℝ) (hs : IsOpen s)\n  (hfp : TendstoUniformlyOn fp gp Filter.atTop s)\n  (hf : ∀ᶠ (n : ℕ) in Filter.atTop, ∀ x ∈ s, HasDerivAt (f n) (fp n x) x)\n  (hfg : ∀ x ∈ s, Filter.Tendsto (fun n => f n x) Filter.atTop (𝓝 (g x))) (x : ℝ) (hx : x ∈ s) : HasDerivAt g (gp x) x\n'MathScope.Navier.Analytic.uniform_derivative_exchange' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.Navier.Analytic.diffusion_semigroup_bound (rate time : ℝ) (hr : 0 ≤ rate) (ht : 0 ≤ time) :\n  Real.exp (-rate * time) ≤ 1\n'MathScope.Navier.Analytic.diffusion_semigroup_bound' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.Navier.Analytic.stable_residual_budget (err residual C epsilon : ℝ) (hC : 0 ≤ C) (hr : residual ≤ epsilon)\n  (hStability : |err| ≤ C * residual) : |err| ≤ C * epsilon\n'MathScope.Navier.Analytic.stable_residual_budget' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.Navier.Analytic.rational_cone_strip (a p : ℝ) (ha0 : 29 / 10 ≤ a) (ha1 : a ≤ 31 / 10) (hp0 : 49 / 10 ≤ p)\n  (hp1 : p ≤ 51 / 10) : 2 < a ∧ a < p ∧ (a - 2) * 0 ^ 2 < 2 * (p - a) ^ 2\n'MathScope.Navier.Analytic.rational_cone_strip' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.Navier.Analytic.solenoidal_reconstruction_cancellation (U UX Ueta eta X A D d q L : ℝ) (hAD : A + D = 1) :\n  (2 * eta * U + 2 * eta * X * UX - 2 * D * eta * U - d * Ueta) / (q * L) +\n      (-2 * A * eta * U + d * Ueta - 2 * eta * X * UX) / (q * L) =\n    0\n'MathScope.Navier.Analytic.solenoidal_reconstruction_cancellation' depends on axioms: [propext,\n Classical.choice,\n Quot.sound]\n",
      "targets": [
        {
          "target": "MathScope.Navier.Analytic.scale_exponents",
          "targetType": "MathScope.Navier.Analytic.scale_exponents (h : ℝ) : 1 / 2 + h + (1 / 2 - h) = 1",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ],
          "customAxioms": []
        },
        {
          "target": "MathScope.Navier.Analytic.core_energy_exponent",
          "targetType": "MathScope.Navier.Analytic.core_energy_exponent (h : ℝ) : 1 + (1 / 2 - h) - 2 * (1 / 2 + h) = 1 / 2 - 3 * h",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ],
          "customAxioms": []
        },
        {
          "target": "MathScope.Navier.Analytic.coordinate_denominator_positive",
          "targetType": "MathScope.Navier.Analytic.coordinate_denominator_positive (h eta : ℝ) (hh : 0 ≤ h) (hh' : h < 1 / 2)\n  (heta : |eta| ≤ 1) : 0 < 1 - 2 * h * eta ^ 2",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ],
          "customAxioms": []
        },
        {
          "target": "MathScope.Navier.Analytic.uniform_derivative_exchange",
          "targetType": "MathScope.Navier.Analytic.uniform_derivative_exchange (f fp : ℕ → ℝ → ℝ) (g gp : ℝ → ℝ) (s : Set ℝ) (hs : IsOpen s)\n  (hfp : TendstoUniformlyOn fp gp Filter.atTop s)\n  (hf : ∀ᶠ (n : ℕ) in Filter.atTop, ∀ x ∈ s, HasDerivAt (f n) (fp n x) x)\n  (hfg : ∀ x ∈ s, Filter.Tendsto (fun n => f n x) Filter.atTop (𝓝 (g x))) (x : ℝ) (hx : x ∈ s) : HasDerivAt g (gp x) x",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ],
          "customAxioms": []
        },
        {
          "target": "MathScope.Navier.Analytic.diffusion_semigroup_bound",
          "targetType": "MathScope.Navier.Analytic.diffusion_semigroup_bound (rate time : ℝ) (hr : 0 ≤ rate) (ht : 0 ≤ time) :\n  Real.exp (-rate * time) ≤ 1",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ],
          "customAxioms": []
        },
        {
          "target": "MathScope.Navier.Analytic.stable_residual_budget",
          "targetType": "MathScope.Navier.Analytic.stable_residual_budget (err residual C epsilon : ℝ) (hC : 0 ≤ C) (hr : residual ≤ epsilon)\n  (hStability : |err| ≤ C * residual) : |err| ≤ C * epsilon",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ],
          "customAxioms": []
        },
        {
          "target": "MathScope.Navier.Analytic.rational_cone_strip",
          "targetType": "MathScope.Navier.Analytic.rational_cone_strip (a p : ℝ) (ha0 : 29 / 10 ≤ a) (ha1 : a ≤ 31 / 10) (hp0 : 49 / 10 ≤ p)\n  (hp1 : p ≤ 51 / 10) : 2 < a ∧ a < p ∧ (a - 2) * 0 ^ 2 < 2 * (p - a) ^ 2",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ],
          "customAxioms": []
        },
        {
          "target": "MathScope.Navier.Analytic.solenoidal_reconstruction_cancellation",
          "targetType": "MathScope.Navier.Analytic.solenoidal_reconstruction_cancellation (U UX Ueta eta X A D d q L : ℝ) (hAD : A + D = 1) :\n  (2 * eta * U + 2 * eta * X * UX - 2 * D * eta * U - d * Ueta) / (q * L) +\n      (-2 * A * eta * U + d * Ueta - 2 * eta * X * UX) / (q * L) =\n    0",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ],
          "customAxioms": []
        }
      ],
      "executionMetrics": {
        "elapsedSeconds": 2.43672901500031
      },
      "oleanSha256": "9e6b058c2e32f01e22eb73faefd9af32e48b395eedf2b7f2262b176709cc08a8",
      "externalSourceUnchanged": false
    },
    {
      "module": "MathScope.Navier.Finite",
      "sourceFile": "lean/MathScope/Navier/Finite.lean",
      "sourceSha256": "3cd442a6f1c86b77da319fa102e298e4add593dcfb1d92d7049a1b90473eb537",
      "command": [
        "/tmp/mathscope-lean-embed",
        "/workspace/scratch/afa9cd11a21b/lean-4.34.1-linux",
        "-o",
        "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/lean/.lake/build/lib/lean/MathScope/Navier/Finite.olean",
        "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/lean/MathScope/Navier/Finite.lean"
      ],
      "exitCode": 0,
      "logFile": "lean-Finite.log",
      "logSha256": "a4d0fe82677d31de18db570562e242f50ecbde26bd2cd5bb7b25181463ae73a6",
      "log": "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/lean/MathScope/Navier/Finite.lean:5:0: warning: \n'Mathlib.Data.Real.Basic' has been deprecated: please replace this import by\n\nimport Mathlib.Basic.Real.Basic\nMathScope.Navier.Finite.comparison_at_zero : MathScope.Navier.Finite.comparisonPartial 0 8 = 1\n'MathScope.Navier.Finite.comparison_at_zero' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.Navier.Finite.comparison_finite_bracket :\n  271 / 1000 < MathScope.Navier.Finite.comparisonPartial (41 / 10) 12 ∧\n    MathScope.Navier.Finite.comparisonPartial (41 / 10) 12 < 272 / 1000\n'MathScope.Navier.Finite.comparison_finite_bracket' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.Navier.Finite.quadratic_increment (u du : ℝ) : (u + du) ^ 2 - u ^ 2 = 2 * u * du + du ^ 2\n'MathScope.Navier.Finite.quadratic_increment' depends on axioms: [propext, Classical.choice, Quot.sound]\n",
      "targets": [
        {
          "target": "MathScope.Navier.Finite.comparison_at_zero",
          "targetType": "MathScope.Navier.Finite.comparison_at_zero : MathScope.Navier.Finite.comparisonPartial 0 8 = 1",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ],
          "customAxioms": []
        },
        {
          "target": "MathScope.Navier.Finite.comparison_finite_bracket",
          "targetType": "MathScope.Navier.Finite.comparison_finite_bracket :\n  271 / 1000 < MathScope.Navier.Finite.comparisonPartial (41 / 10) 12 ∧\n    MathScope.Navier.Finite.comparisonPartial (41 / 10) 12 < 272 / 1000",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ],
          "customAxioms": []
        },
        {
          "target": "MathScope.Navier.Finite.quadratic_increment",
          "targetType": "MathScope.Navier.Finite.quadratic_increment (u du : ℝ) : (u + du) ^ 2 - u ^ 2 = 2 * u * du + du ^ 2",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ],
          "customAxioms": []
        }
      ],
      "executionMetrics": {
        "elapsedSeconds": 1.8727173619990936
      },
      "oleanSha256": "fc3a1d7657c752b9afc3cd8f7bae22ecb6f019ce15a42310b4b5587b14e44b34",
      "externalSourceUnchanged": false
    },
    {
      "module": "MathScope.Navier.SourceAdapter",
      "sourceFile": "lean/MathScope/Navier/SourceAdapter.lean",
      "sourceSha256": "dbc7fd472913259338338e0dae9dbe3a4dac5ab7913dd0351c8254f0658274f5",
      "command": [
        "/tmp/mathscope-lean-embed",
        "/workspace/scratch/afa9cd11a21b/lean-4.34.1-linux",
        "-o",
        "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/lean/.lake/build/lib/lean/MathScope/Navier/SourceAdapter.olean",
        "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/lean/MathScope/Navier/SourceAdapter.lean"
      ],
      "exitCode": 0,
      "logFile": "lean-SourceAdapter.log",
      "logSha256": "fc243dc391045d661bcd34ddeaf54240071c352a52cd1f8333f07cfdc2b5b40e",
      "log": "NavierStokes.ProblemStatement.navierStokesResidual (u : NavierStokes.ProblemStatement.VelocityField)\n  (p : NavierStokes.ProblemStatement.PressureField) (t : ℝ) (x : NavierStokes.ProblemStatement.Space) :\n  NavierStokes.ProblemStatement.Space\nNavierStokes.ProblemStatement.CandidateProperties (u : NavierStokes.ProblemStatement.VelocityField)\n  (p : NavierStokes.ProblemStatement.PressureField) (f : NavierStokes.ProblemStatement.VelocityField) : Prop\nMathScope.Navier.SourceAdapter.imported_flatness_fixed_loss.{u_1} {alpha : Type u_1} {l : Filter alpha}\n  {q f : alpha → ℝ} (hf : NavierStokes.Flatness.PowerFlat l q f) (hq : ∀ᶠ (x : alpha) in l, q x ≠ 0) (loss : ℕ) :\n  NavierStokes.Flatness.PowerFlat l q fun x => f x / q x ^ loss\n'MathScope.Navier.SourceAdapter.imported_flatness_fixed_loss' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.Navier.SourceAdapter.imported_zero_velocity_negative_control :\n  ¬NavierStokes.ProblemStatement.SpeedUnboundedAtOne fun x => 0\n'MathScope.Navier.SourceAdapter.imported_zero_velocity_negative_control' depends on axioms: [propext,\n Classical.choice,\n Quot.sound]\n",
      "targets": [
        {
          "target": "MathScope.Navier.SourceAdapter.imported_flatness_fixed_loss",
          "targetType": "MathScope.Navier.SourceAdapter.imported_flatness_fixed_loss.{u_1} {alpha : Type u_1} {l : Filter alpha}\n  {q f : alpha → ℝ} (hf : NavierStokes.Flatness.PowerFlat l q f) (hq : ∀ᶠ (x : alpha) in l, q x ≠ 0) (loss : ℕ) :\n  NavierStokes.Flatness.PowerFlat l q fun x => f x / q x ^ loss",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ],
          "customAxioms": []
        },
        {
          "target": "MathScope.Navier.SourceAdapter.imported_zero_velocity_negative_control",
          "targetType": "MathScope.Navier.SourceAdapter.imported_zero_velocity_negative_control :\n  ¬NavierStokes.ProblemStatement.SpeedUnboundedAtOne fun x => 0",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ],
          "customAxioms": []
        }
      ],
      "executionMetrics": {
        "elapsedSeconds": 1.973426782002207
      },
      "oleanSha256": "2b60a9373167046669ed2cf4baefb4f501c99d0da7d66b34a891acbd3b01aa1c",
      "externalSourceUnchanged": false
    }
  ],
  "negativeControls": [
    {
      "name": "NegativeFalse",
      "sourceSha256": "4d616ee6bf0a607f5a0ab91e51fd8dd7528bd3c433a809b6afc75e3e6708e61a",
      "exitCode": 1,
      "rejected": true,
      "logFile": "NegativeFalse.log",
      "logSha256": "b1324af23e3962841ab6de200dc37a8b14c11e0dd5a4526914aec46bd8691b1c",
      "log": "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/lean/NegativeFalse.lean:2:28: error: Tactic `rfl` failed: The left-hand side\n  0\nis not definitionally equal to the right-hand side\n  1\n\n⊢ 0 = 1\n"
    },
    {
      "name": "NegativeQuadratic",
      "sourceSha256": "cf3d67198bf1851fd7e102c9f8718420d4d97c68220b30058241f93c8b9dfbe5",
      "exitCode": 1,
      "rejected": true,
      "logFile": "NegativeQuadratic.log",
      "logSha256": "5fc6d465ca731a99d5b06589042146bbbd8e7f38c51b06e56b57190e36429120",
      "log": "/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/lean/NegativeQuadratic.lean:2:0: warning: \n'Mathlib.Data.Real.Basic' has been deprecated: please replace this import by\n\nimport Mathlib.Basic.Real.Basic\nTry this:\n  [apply] ring_nf\n  \n  The `ring` tactic failed to close the goal. Use `ring_nf` to obtain a normal form.\n    \n  Note that `ring` works primarily in *commutative* rings. If you have a noncommutative ring, abelian group or module, consider using `noncomm_ring`, `abel` or `module` instead.\n/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/lean/NegativeQuadratic.lean:3:46: error: unsolved goals\nu du : ℝ\n⊢ u * du * 2 + du ^ 2 = u * du * 2\n"
    }
  ],
  "scope": "Exact selected source files and adapter types only. Full C/D proof, B.2 analytic hypotheses and complete Theorem 4.6 numeric instantiation are not certified."
};

return {leanEvidence};
})();
const __m1_20 = (()=>{
const {ComputeError,positive,finiteNumber} = __m1_16;
function parameters(input={}){
  const tau=positive(input.tau??.1,'tau'),h=finiteNumber(input.h??.005,'h'),viscosity=positive(input.viscosity??1,'viscosity');
  if(!(h>0&&h<.01))throw new ComputeError('INVALID_INPUT','h must lie in (0,.01)');
  return {tau,h,viscosity,A:.5+h,D:.5-h};
}
function fromSimilarity({X,eta,theta=0},input={}){
  const o=parameters(input);X=finiteNumber(X,'X');eta=finiteNumber(eta,'eta');theta=finiteNumber(theta,'theta');
  if(X<0||Math.abs(eta)>=1)throw new ComputeError('INVALID_INPUT','X>=0 and |eta|<1 required');
  const q=o.tau/(1-eta*eta),r=Math.sqrt(2*o.viscosity*q*X),z=Math.sqrt(o.viscosity)*q**o.D*eta;
  if(![q,r,z].every(Number.isFinite))throw new ComputeError('PRECISION_REQUIRED','Forward similarity coordinates overflow binary64');
  return {position:[r*Math.cos(theta),r*Math.sin(theta),z],q,X,eta,theta,L:1-2*o.h*eta*eta,lowerUniquenessBound:1-2*o.h};
}
function toSimilarity(position,input={}){
  const o=parameters(input);if(!Array.isArray(position)||position.length!==3)throw new ComputeError('INVALID_INPUT','Three coordinates required');position.forEach((v,i)=>finiteNumber(v,`coordinate ${i}`));
  const rootNu=Math.sqrt(o.viscosity),z=position[2]/rootNu,D=o.D;
  let lo=Math.max(o.tau,Math.abs(z)**(1/D)),hi=2*lo;
  const f=q=>q-z*z*q**(2*o.h)-o.tau;
  if(!Number.isFinite(hi))throw new ComputeError('PRECISION_REQUIRED','Coordinate scale overflows binary64');
  let it=0;while(f(hi)<0){hi*=2;if(++it>1024||!Number.isFinite(hi))throw new ComputeError('PRECISION_REQUIRED','Could not bracket coordinate root');}
  for(let i=0;i<90;i++){const mid=lo+(hi-lo)/2;if(mid===lo||mid===hi)break;if(f(mid)>0)hi=mid;else lo=mid;}
  const q=lo+(hi-lo)/2,eta=z/q**D,X=(position[0]**2+position[1]**2)/(2*o.viscosity*q),L=1-2*o.h*eta*eta;
  return {q,eta,X,theta:Math.atan2(position[1],position[0]),L,rootBracket:[lo,hi],rootResidual:f(q),rootErrorBound:Math.abs(f(q))/(1-2*o.h),lowerUniquenessBound:1-2*o.h,bracketGrade:'monotone bisection with floating-point endpoints; cross-checked by high-precision fixtures'};
}
function transformedDerivative({q,X,eta}, {b,value,dX,dEta},input={}){
  const o=parameters(input),L=1-2*o.h*eta*eta,d=1-eta*eta;
  return {dt:q**(b-1)*(-b*value+o.D*eta*dEta+X*dX)/L,dz:q**(b-o.D)*(2*b*eta*value+d*dEta-2*eta*X*dX)/(L*Math.sqrt(o.viscosity))};
}
function monomialJet(position,{b=.3,radialPower=2,axialPower=3,...input}={}){
  const p=toSimilarity(position,input),a=radialPower,c=axialPower,value=p.X**a*p.eta**c,dX=a===0?0:a*p.X**(a-1)*p.eta**c,dEta=c===0?0:c*p.X**a*p.eta**(c-1);
  return {...p,value:p.q**b*value,...transformedDerivative(p,{b,value,dX,dEta},input)};
}
function coordinateFieldSample(input={},budget){
  const X=input.X??.6,eta=input.eta??-.35,theta=input.theta??.4,p=fromSimilarity({X,eta,theta},input),inverse=toSimilarity(p.position,input),j=monomialJet(p.position,input);
  return {model:'paper-similarity-coordinates',input:parameters(input),forward:p,inverse,monomial:j,roundtrip:{X:Math.abs(inverse.X-X),eta:Math.abs(inverse.eta-eta)},sources:[{source:'N00',pages:[24,25],equations:['4.1','4.2']}],budget:budget?.snapshot()};
}

return {parameters,fromSimilarity,toSimilarity,transformedDerivative,monomialJet,coordinateFieldSample};
})();
const __m1_21 = (()=>{
const {ComputeError,point,interval,iadd,isub,imul,idiv,iscale,ipow,iexp,ilog,ipower,ball,midpoint,maxabs,nextUp,nextDown,jvar,jconst,jadd,jsub,jmul,jscale,jexp,jlog,certifiedSimpson,integrate,makeBudget,positive,finiteNumber} = __m1_16;
const validateH=h=>{h=finiteNumber(h,'h');if(!(h>0&&h<.01))throw new ComputeError('INVALID_INPUT','0 < h < .01 required');return h;};
const rising=(h,m)=>{let v=1;for(let i=0;i<m;i++)v*=h+i;return v;};
const risingI=(h,m)=>{let v=point(1);for(let i=0;i<m;i++)v=imul(v,iadd(point(h),point(i)));return v;};
function integrandJet(y,Z,h,m){
  const yj=jvar(y),v=jexp(yj),a=iadd(point(h),point(m)),ap1=iadd(a,point(1));
  return jexp(jsub(jsub(jscale(yj,ap1),v),jscale(jlog(jadd(jconst(1),jscale(v,Z))),a)));
}
function integrandBall(y,Z,h,m){const v=iexp(y),a=iadd(point(h),point(m)),ap1=iadd(a,point(1));return iexp(isub(isub(iscale(y,ap1),v),iscale(ilog(iadd(point(1),iscale(v,Z))),a)));}
function derivativeFourth(y,Z,h,m){return iscale(integrandJet(y,Z,h,m)[4],24);}
function heatIntegralCertificate({Z=1,h=.005,derivativeOrder=2,tolerance=1e-8}={},budget=makeBudget()){
  Z=finiteNumber(Z,'Z');if(Z<0)throw new ComputeError('INVALID_INPUT','Z >= 0 required');h=validateH(h);
  if(!Number.isInteger(derivativeOrder)||derivativeOrder<0||derivativeOrder>4)throw new ComputeError('UNSUPPORTED','Derivative orders 0..4 are supported');
  const L=-40,R=6,vLow=iexp(point(L)),V=iexp(point(R));
  const integrateMoment=(z,m)=>{
    const a=iadd(point(h),point(m)),ap1=iadd(a,point(1)),quad=certifiedSimpson(y=>integrandBall(y,z,h,m),y=>derivativeFourth(y,z,h,m),L,R,tolerance/48,budget);
    const left=idiv(ipower(vLow,ap1),ap1);
    const upper=idiv(imul(ipower(V,a),iexp([-V[1],-V[0]])),isub(point(1),idiv(a,V)));
    const tail=nextUp(left[1]+upper[1]);
    return {...quad,box:[Math.max(0,quad.box[0]),nextUp(quad.box[1]+tail)],leftTail:left[1],upperTail:upper[1],tail};
  };
  const denominator=integrateMoment(0,0);const derivatives=[],errors=[];
  for(let m=0;m<=derivativeOrder;m++){
    const numerator=Z===0&&m===0?denominator:integrateMoment(Z,m),factor=risingI(h,m),ratio=idiv(numerator.box,denominator.box);
    let value=imul(factor,ratio);if(m%2)value=[-value[1],-value[0]];
    derivatives.push(ball(value));errors.push({order:m,quadratureNumerator:numerator.quadrature,tailNumerator:numerator.tail,quadratureDenominator:denominator.quadrature,tailDenominator:denominator.tail,cells:numerator.cells,roundingAndPropagationIncluded:true});
  }
  if(Z===0)derivatives[0]=ball(point(1));
  const H=derivatives[0],dH=derivatives[1],ddH=derivatives[2];let odeEnclosure=null;
  if(ddH){const a=x=>[x.lower,x.upper],hi=point(h),zi=point(Z);odeEnclosure=ball(iadd(iadd(imul(a(ddH),imul(zi,zi)),imul(a(dH),iadd(point(1),imul(iadd(point(2),iscale(hi,2)),zi)))),imul(a(H),imul(hi,iadd(point(1),hi)))));}
  const complete=derivatives.every(x=>x.radius<=tolerance);
  return {status:complete?'VERIFIED_NUMERICAL_ENCLOSURE':'PRECISION_REQUIRED',model:'paper-heat-factor',Z,h,derivatives,H:H.midpoint,dH:dH?.midpoint,ddH:ddH?.midpoint,odeEnclosure,
    certificate:{kind:'REAL_INTERVAL_QUADRATURE',method:'log-variable integral; outward arithmetic; bounded exp/log series; Simpson fourth derivative enclosure',domain:'Z>=0, 0<h<.01; finite input parameters',tolerance,logIntegrationDomain:[L,R],vIntegrationDomain:[vLow[0],V[1]],gammaNormalization:ball(denominator.box),errors,notClaimed:'No full PDE solution error or global profile theorem is inferred.'},
    sources:[{source:'N00',pages:[138],equations:['A.32','A.35','A.38']}],budget:budget.snapshot()};
}
const cache=new Map();
function heatFast(Z,h=.005,tolerance=2e-11,budget=makeBudget()){
  Z=finiteNumber(Z,'Z');if(Z<0)throw new ComputeError('INVALID_INPUT','Z >= 0');h=validateH(h);const key=`${Z}:${h}:${tolerance}`;
  if(cache.has(key))return {...cache.get(key)};
  const moments=[];let maxError=0;
  const den=integrate(y=>Math.exp((h+1)*y-Math.exp(y)),-40,6,tolerance,budget);
  for(let m=0;m<=2;m++){const a=h+m,r=integrate(y=>{const v=Math.exp(y);return Math.exp((a+1)*y-v-a*Math.log1p(Z*v));},-40,6,tolerance,budget);moments.push((m%2?-1:1)*rising(h,m)*r.value/den.value);maxError=Math.max(maxError,r.errorEstimate);}
  if(Z===0)moments[0]=1;
  const r={H:moments[0],dH:moments[1],ddH:moments[2],estimatedQuadratureError:maxError,certified:false,method:'independent adaptive Simpson value path in log coordinate'};
  if(cache.size>2048)cache.clear();cache.set(key,r);return {...r};
}
function exteriorJet(r,{tau=.1,h=.005,viscosity=1,cInfinity=1,tolerance=2e-11}={},budget=makeBudget()){
  r=positive(r,'r');tau=positive(tau,'tau');viscosity=positive(viscosity,'viscosity');cInfinity=positive(cInfinity,'cInfinity');h=validateH(h);
  const rootNu=Math.sqrt(viscosity),rn=r/rootNu,m=1+2*h,C=cInfinity*2**(.5+h),Z=4*tau/(rn*rn),P=heatFast(Z,h,tolerance,budget);
  const K0=C*rn**(-m)*P.H,dr0=C*rn**(-m-1)*(-m*P.H-2*Z*P.dH),drr0=C*rn**(-m-2)*(m*(m+1)*P.H+(4*m+6)*Z*P.dH+4*Z*Z*P.ddH),dt0=-4*C*rn**(-m-2)*P.dH;
  if(![rootNu*K0,dr0,drr0/rootNu,rootNu*dt0,(rootNu*K0)**2/r].every(Number.isFinite))throw new ComputeError('PRECISION_REQUIRED','Exterior velocity or derivative exceeds the finite binary64 range; use logarithmic coordinates or higher precision');
  return {K:rootNu*K0,dr:dr0,drr:drr0/rootNu,dt:rootNu*dt0,pressureRadial:(rootNu*K0)**2/r,Z,heat:P,domain:{excludeAxis:true,finiteEnergyR3:false},normalization:{cInfinity,proofSelected:false}};
}
function exteriorPoint(position,options={},budget=makeBudget()){
  const [x,y,z]=position,r=Math.hypot(x,y);if(!(r>0))throw new ComputeError('EXCLUDED_DOMAIN','The exterior component excludes the cylindrical axis',{position});
  const j=exteriorJet(r,options,budget);return {position:[x,y,z],velocity:[-j.K*y/r,j.K*x/r,0],pressureGradient:[j.pressureRadial*x/r,j.pressureRadial*y/r,0],vorticity:[0,0,j.dr+j.K/r],speed:Math.abs(j.K),jet:j,scope:'Actual paper exterior formula; standalone component; no core/global gluing or compact force.'};
}
function taylorGreenPoint([x,y,z],{time=0,viscosity=1,amplitude=1,waveNumber=1,pressureSign=1}={}){
  viscosity=positive(viscosity,'viscosity');time=finiteNumber(time,'time');const k=positive(waveNumber,'waveNumber'),a=amplitude*Math.exp(-2*viscosity*k*k*time),sx=Math.sin(k*x),cx=Math.cos(k*x),sy=Math.sin(k*y),cy=Math.cos(k*y);
  return {position:[x,y,z],velocity:[a*sx*cy,-a*cx*sy,0],pressure:pressureSign*a*a/4*(Math.cos(2*k*x)+Math.cos(2*k*y)),pressureGradient:pressureSign===0?[0,0,0]:[-pressureSign*a*a*k/2*Math.sin(2*k*x),-pressureSign*a*a*k/2*Math.sin(2*k*y),0],vorticity:[0,0,2*a*k*sx*sy],speed:Math.hypot(a*sx*cy,a*cx*sy),meanEnergy:a*a/4,meanEnstrophy:a*a*k*k/2,meanDissipation:viscosity*a*a*k*k,scope:'Separate exact periodic fixture; not the source blowup construction.'};
}
function heatTaylorFinite(Z,h=.005,N=8){
  validateH(h);if(!(Z>=0)||!Number.isInteger(N)||N<0||N>100)throw new ComputeError('INVALID_INPUT','Taylor inputs outside bounds');
  let term=point(1),sum=point(1);
  for(let n=0;n<N;n++){const a=iadd(point(h),point(n));term=iscale(idiv(imul(imul(term,a),iadd(point(1),a)),point(n+1)),-Z);sum=iadd(sum,term);}
  const a=iadd(point(h),point(N)),first=idiv(imul(imul(term,a),iadd(point(1),a)),point(N+1));const error=imul(point(maxabs(first)),point(Z))[1];
  return {sum:ball(sum),remainderBound:error,enclosure:ball([nextDown(sum[0]-error),nextUp(sum[1]+error)]),N,Z,h,convergentInfiniteSeries:false,radiusOfConvergence:0,reason:'Absolute coefficient ratio (h+n)(1+h+n)/(n+1) tends to infinity for h>0.',source:{source:'N00',page:138,equation:'A.35'}};
}

return {heatIntegralCertificate,heatFast,exteriorJet,exteriorPoint,taylorGreenPoint,heatTaylorFinite};
})();
const __m1_22 = (()=>{
const {ComputeError,integrate,makeBudget,finiteNumber,positive,boundedInteger,point,iadd,isub,idiv,imul,iscale,nextUp,nextDown,ball} = __m1_16;
// Real Taylor coefficients in eta. These are formal finite jets, not a tail proof.
const jetC=(x,n)=>[x,...Array(n).fill(0)];
const jetVar=(x,n)=>[x,1,...Array(Math.max(0,n-1)).fill(0)];
const jetAdd=(a,b)=>a.map((x,i)=>x+(b[i]??0));
const jetScale=(a,s)=>a.map(x=>x*s);
const jetSub=(a,b)=>jetAdd(a,jetScale(b,-1));
function jetMul(a,b){return a.map((_,n)=>{let s=0;for(let k=0;k<=n;k++)s+=a[k]*b[n-k];return s;});}
function jetInv(a){if(!a[0])throw new ComputeError('SINGULAR_SYSTEM','Taylor jet denominator has zero constant term');const r=[1/a[0]];for(let n=1;n<a.length;n++){let s=0;for(let k=1;k<=n;k++)s+=a[k]*r[n-k];r.push(-s/a[0]);}return r;}
const jetDiv=(a,b)=>jetMul(a,jetInv(b));
const jetDeriv=a=>[...a.slice(1).map((x,i)=>(i+1)*x),0];
function jetExp(a){const r=[Math.exp(a[0])];for(let n=1;n<a.length;n++){let s=0;for(let k=1;k<=n;k++)s+=k*a[k]*r[n-k];r.push(s/n);}return r;}
function jetLog(a){if(!(a[0]>0))throw new ComputeError('INVALID_INPUT','Positive constant term required for log jet');const b=jetMul(jetDeriv(a),jetInv(a));return [Math.log(a[0]),...b.slice(0,-1).map((x,i)=>x/(i+1))];}
const jetPow=(a,p)=>jetExp(jetScale(jetLog(a),p));
const jetEval=(a,x)=>a.reduceRight((s,v)=>s*x+v,0);
function comparisonSeries(z,N=24){
  z=finiteNumber(z,'z');if(z<0||z>20)throw new ComputeError('UNSUPPORTED','Comparison certificate supports 0 <= z <= 20');N=boundedInteger(N,'N',2,100);
  let term=point(1),sum=point(1);for(let n=1;n<=N;n++){term=idiv(iscale(term,-z/2),point(n*(n+1)));sum=iadd(sum,term);}
  const next=idiv(iscale(term,-z/2),point((N+1)*(N+2))),ratio=idiv(point(z),point(2*(N+2)*(N+3)));
  const tail=idiv(point(Math.max(Math.abs(next[0]),Math.abs(next[1]))),isub(point(1),ratio))[1];
  return {value:(sum[0]+sum[1])/2,enclosure:ball([nextDown(sum[0]-tail),nextUp(sum[1]+tail)]),N,z,tailBound:tail,radiusOfConvergence:'infinity',proof:'ratio of successive absolute terms is z/[2(n+1)(n+2)]; geometric tail after N',scope:'Scalar comparison f0, not the nonlinear axis profile',source:{source:'N00',pages:[146],equation:'B.11'}};
}
function axisData(eta,o,pressureJet,etaOrder=20,budget=makeBudget()){
  const h=o.h??.005,D=.5-h,A=.5+h,j0=o.j0??.03,sigma=o.sigmaStar??.2,Lambda=o.Lambda??48,n=etaOrder;
  const e=jetVar(eta,n),one=jetC(1,n),d=jetSub(one,jetMul(e,e)),L=jetSub(one,jetScale(jetMul(e,e),2*h)),Us=jetAdd(jetScale(e,4),jetC(j0,n)),Hs=jetAdd(jetScale(e,D),jetMul(d,Us)),Ws=jetSub(jetSub(one,jetScale(d,4)),jetScale(jetMul(e,Us),2*D)),Hs2=jetMul(Hs,Hs),den=jetAdd(Hs2,jetC(sigma*sigma,n)),chi=jetDiv(Hs2,den),zeta=jetScale(jetDiv(jetMul(L,Hs),den),-1),Pi=pressureJet(eta,n),PiEta=jetDeriv(Pi);
  const Zs=jetAdd(jetSub(jetSub(jetScale(jetMul(jetSub(one,jetScale(jetMul(e,Us),2)),Us),-A),jetScale(Hs,4)),jetMul(d,PiEta)),jetScale(jetMul(e,Pi),4*A));
  const zetaValue=t=>{const dt=1-t*t,Lt=1-2*h*t*t,H=D*t+dt*(4*t+j0);return -Lt*H/(H*H+sigma*sigma);};
  const logPhi=Lambda*integrate(zetaValue,0,eta,2e-11,budget).value;
  const logC=o.logC??20,lg=[logPhi-logC,...zeta.slice(0,n).map((x,k)=>Lambda*x/(k+1))],g=jetExp(lg);
  return {e,one,d,L,Us,Hs,Ws,Zs,chi,zeta,Pi,g,logPhi,logC,Lambda,A,D,eta,etaOrder:n,realNormalizationPass:logPhi<=logC};
}
function solveAxisCoefficients(eta,options,pressureJet,budget=makeBudget()){
  const N=boundedInteger(options.axisOrder??10,'axisOrder',2,24),M=2*N+6,a=axisData(eta,options,pressureJet,M,budget),zero=()=>jetC(0,M),phi=[jetC(1,M)],u=[zero()],g2=jetMul(a.g,a.g),invL=jetInv(a.L);
  const rmul=(x,y,n)=>{let out=zero();for(let k=0;k<=n;k++)out=jetAdd(out,jetMul(x[k]??zero(),y[n-k]??zero()));return out;};
  let maximumSource=0;
  for(let n=0;n<N;n++){
    budget.tick((n+1)*M*M);const AX=u.map((v,k)=>jetScale(v,1/(k+1))),B=AX.map(v=>jetSub(jetScale(jetMul(a.e,v),-2*a.D),jetMul(a.d,jetDeriv(v)))),W=B.map((v,k)=>jetAdd(jetScale(v,1/a.Lambda),k===0?a.Ws:zero())),U=u.map((v,k)=>jetAdd(jetScale(v,1/a.Lambda),k===0?a.Us:zero())),Hc=u.map((v,k)=>jetAdd(jetScale(jetMul(a.d,v),1/a.Lambda),k===0?a.Hs:zero()));
    const angularPref=W.map((v,k)=>jetAdd(jetAdd(v,jetScale(jetSub(k===0?a.one:zero(),jetScale(jetMul(a.e,U[k]),2)),options.h??.005)),jetMul(jetMul(a.d,u[k]),a.zeta)));
    const DXphi=phi.map((v,k)=>jetScale(v,k)),DXu=u.map((v,k)=>jetScale(v,k)),phiEta=phi.map(jetDeriv),uEta=u.map(jetDeriv);
    let R1=jetMul(invL,jetAdd(jetAdd(rmul(angularPref,phi,n),rmul(W,DXphi,n)),rmul(Hc,phiEta,n)));
    const p=[zero()];for(let k=1;k<=n;k++)p.push(jetScale(jetMul(g2,rmul(phi,phi,k-1)),1/k));
    const alpha=jetAdd(jetScale(jetSub(a.one,jetScale(jetMul(a.e,a.Us),4)),a.A),jetScale(a.d,4));
    let R2=jetMul(alpha,u[n]);
    R2=jetAdd(R2,jetScale(jetMul(a.e,rmul(u,u,n)),-2*a.A/a.Lambda));
    R2=jetAdd(R2,rmul(W,DXu,n));R2=jetAdd(R2,jetMul(a.Hs,uEta[n]));
    R2=jetAdd(R2,jetScale(jetMul(a.d,rmul(u,uEta,n)),1/a.Lambda));
    R2=jetAdd(R2,jetScale(jetMul(a.e,p[n]??zero()),-4*a.A));R2=jetAdd(R2,jetMul(a.d,jetDeriv(p[n]??zero())));R2=jetAdd(R2,jetScale(jetMul(a.e,p[n]??zero()),-2*n));R2=jetMul(invL,R2);
    const np=jetScale(jetAdd(jetScale(jetMul(a.chi,phi[n]),-1),jetScale(R1,1/a.Lambda)),1/(2*(n+1)*(n+2))),nu=jetScale(jetAdd(n===0?jetScale(jetMul(a.Zs,invL),-1):zero(),jetScale(R2,1/a.Lambda)),1/(2*(n+1)*(n+1)));
    phi.push(np);u.push(nu);maximumSource=Math.max(maximumSource,Math.abs(R1[0]),Math.abs(R2[0]));
  }
  if(phi.some(v=>v.some(x=>!Number.isFinite(x)))||u.some(v=>v.some(x=>!Number.isFinite(x))))throw new ComputeError('PRECISION_REQUIRED','Axis formal coefficient arithmetic overflow',{eta,axisOrder:N,Lambda:a.Lambda});
  const p=[zero()];for(let k=1;k<=2*N+1;k++)p.push(jetScale(jetMul(g2,rmul(phi,phi,k-1)),1/k));
  return {eta,axisOrder:N,etaJetOrder:M,phi,u,pressureIncrement:p,data:a,maximumSource,status:'FORMAL_NONLINEAR_AXIS_COEFFICIENTS',certifiedAnalyticRadius:null,certifiedTailBound:null,
    blockers:[{id:'B2_COMPLEX_DOMAIN','criterion':'N3-03',reason:'The selected numerical data have no certified complex neighborhood, B_rho invariant ball, or contraction Lipschitz constant.'},{id:'B2_NONLINEAR_TAIL','criterion':'N3-03',reason:'Computed coefficients solve the finite degree recursion; scalar f0 tail is not a tail bound for these nonlinear coefficients.'}],
    equations:['B.12','B.14','B.15','B.16'],sourcePages:[145,146,147,148]};
}
function evaluateAxis(solution,X){
  const {data:a,phi,u,pressureIncrement:p,axisOrder:N}=solution,Y=a.Lambda*X;
  const poly=(rows,etaDeriv=0,radialDeriv=0)=>{let v=0;for(let k=N;k>=radialDeriv;k--){let f=1;for(let j=0;j<radialDeriv;j++)f*=k-j;v=v*Y+(rows[k]?.[etaDeriv]??0)*f;}return v;};
  const Phi=poly(phi),PhiEta=poly(phi,1),PhiY=poly(phi,0,1),PhiYY=poly(phi,0,2),Us=poly(u)/a.Lambda+a.Us[0],Ueta=poly(u,1)/a.Lambda+a.Us[1],UX=poly(u,0,1),UXX=poly(u,0,2)*a.Lambda,g=a.g[0],F=g*Phi,Feta=a.g[1]*Phi+g*PhiEta,FX=g*a.Lambda*PhiY;
  let avgU=a.Us[0],avgUeta=a.Us[1];for(let k=1;k<=N;k++){avgU+=u[k][0]*Y**k/((k+1)*a.Lambda);avgUeta+=u[k][1]*Y**k/((k+1)*a.Lambda);}
  let Pi=a.Pi[0],PiEta=a.Pi[1];for(let k=1;k<p.length;k++){Pi+=p[k][0]*Y**k/a.Lambda;PiEta+=p[k][1]*Y**k/a.Lambda;}
  const eta=a.eta,d=1-eta*eta,L=1-2*(.5-a.D)*eta*eta,VoverX=(2*eta*Us-2*a.D*eta*avgU-d*avgUeta)/L,E=Math.sqrt(2*X)*F;
  const W=1-2*a.D*eta*avgU-d*avgUeta,Hc=a.D*eta+d*Us,l=1+(F===0?0:X*FX/F),Sq=-W*l-(.5-a.D)*(1-2*eta*Us)-Hc*(F===0?0:Feta/F),Sn=-W*X*UX-a.A*(1-2*eta*Us)*Us-Hc*Ueta-d*PiEta+4*a.A*eta*Pi+2*eta*X*F*F;
  const residualAngular=Phi===0?null:-2*L*(X*a.Lambda*a.Lambda*PhiYY+2*a.Lambda*PhiY)/Phi-Sq,residualAxial=-2*L*(X*UXX+UX)-Sn;
  return {X,Y,eta,E,U:Us,F,FX,Feta,Ueta,UX,UXX,Pi,PiEta,PiX:F*F,V0:X*VoverX,VoverX,avgU,avgUeta,Phi,comparison:comparisonSeries(Math.max(0,Math.min(20,Y*a.chi[0]))).value,leadingResidual:{angular:residualAngular,axial:residualAxial},positive:E>0||X===0,finite:Object.values({E,Us,F,Pi,VoverX}).every(Number.isFinite),grade:'FINITE_NONLINEAR_AXIS_APPROXIMATION_UNCERTIFIED_TAIL'};
}

return {jetC,jetVar,jetAdd,jetScale,jetSub,jetMul,jetInv,jetDiv,jetDeriv,jetExp,jetLog,jetPow,jetEval,comparisonSeries,axisData,solveAxisCoefficients,evaluateAxis};
})();
const __m1_23 = (()=>{
const {ComputeError,integrate,makeBudget,solveLinear,positive,boundedInteger,point,interval,iadd,isub,imul,idiv,ipow,ipower,ball} = __m1_16;
const {heatFast} = __m1_21;
const {jetC,jetVar,jetAdd,jetScale,jetMul,jetInv,jetLog,jetExp} = __m1_22;
function smoothStep(y){if(y<=0)return 0;if(y>=1)return 1;const z=-1/(y*y)+1/((1-y)**2);return z>0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));}
function smoothStepDerivative(y){if(y<=0||y>=1)return 0;const s=smoothStep(y);return s*(1-s)*(2/y**3+2/(1-y)**3);}
function compactBump(x,a,b){if(!(a<b))throw new ComputeError('INVALID_SUPPORT','Bump support must have positive width');if(x<=a||x>=b)return 0;return smoothStepDerivative((x-a)/(b-a))/(b-a);}
const sigmaIntegral=y=>y<=0?0:y>=1?y-.5:integrate(smoothStep,0,y,1e-11).value;
function parameterOrder(input={}){
  const Md=positive(input.Md??.2,'Md'),Td=Math.exp(Md)+10,logP=Number(input.logP??Math.log(input.PStar??2)),lambda=positive(input.lambda??.08,'lambda'),h=positive(input.h??.005,'h'),Lambda=positive(input.Lambda??48,'Lambda'),j0=positive(input.j0??.03,'j0'),sigmaStar=positive(input.sigmaStar??.2,'sigmaStar'),XR=positive(input.XR??1e5,'XR'),logC=Number(input.logC??16),frequency=boundedInteger(input.frequency??32,'frequency',2,512);
  if(!(h<.01&&lambda<.5&&j0<=.05))throw new ComputeError('INVALID_INPUT','Require h<.01, lambda<.5, j0<=.05');
  const ordered=[{name:'Md',value:Md},{name:'Td',value:Td,depends:['Md']},{name:'PStar',logValue:logP,depends:['Td']},{name:'lambda',value:lambda,depends:['PStar']},{name:'h',value:h,depends:['lambda','Td']},{name:'matchingTolerance,j0',value:j0,depends:['outerDatum']},{name:'deltaStar,sigmaStar,Lambda',value:Lambda,depends:['j0','outerDatum']},{name:'Tsh',value:null,depends:['Lambda']},{name:'C,XR',logC,XR,depends:['Tsh']},{name:'activationWidths',value:null,depends:['XR']},{name:'N',value:frequency,depends:['allPreviousFiniteParameters']}];
  const checks=[{name:'PStar_gt_exp_Td',pass:logP>Td,actual:logP,required:`log(PStar)>${Td}`},{name:'h_lt_lambda',pass:h<lambda},{name:'h_lt_exp_minus_Td',pass:Math.log(h)<-Td},{name:'j0_range',pass:j0>0&&j0<=.05},{name:'four_reserved_patches_fit',pass:60*Math.log(1/lambda)>25}];
  return {Md,Td,logP,PStar:Math.exp(logP),lambda,h,Lambda,j0,sigmaStar,XR,logC,frequency,ordered,checks,fullyCertified:false,
    blockers:[{id:'OUTER_QUANTITATIVE_THRESHOLDS',criterion:'N3-01',reason:'A.6 requires sufficiently large Md and sufficiently small lambda/h after earlier choices. Necessary displayed inequalities are executable; the unstated proof constants and all derivative smallness thresholds remain uninstantiated.'},{id:'B40_CONTINUATION_CONSTANTS',criterion:'N3-01',reason:'B_k, T_sh, activation widths, complex-domain normalization, and uniform moment tolerance have not been quantitatively extracted.'}],source:{source:'N00',pages:[18,129,157],equations:['A.6','B.40']}};
}
/** Literal unedited E schedule from A.2, on logarithmic radius y=log(X/XR).
 * A.11 angular moment bumps and A.7 heat compensation are separately pending.
 */
function buildOuterSchedule(o,budget=makeBudget()){
  const stages=[];let y=0,logA=o.logP;
  function add(name,length,delta,theta=1,extra={}){const s={name,start:y,end:y+length,logAStart:logA,theta,...extra};stages.push(s);y+=length;logA+=delta(length);s.logAEnd=logA;s.delta=delta;return s;}
  add('initial-slope',1,t=>.1*t-.6*sigmaIntegral(t));
  add('axial-decay',o.Td,t=>-.5*t);
  add('intermediate-entry',1,t=>-.5*t-o.lambda*sigmaIntegral(t));
  const Tw=60*Math.log(1/o.lambda),power=add('reserved-power',Tw,t=>-(.5+o.lambda)*t);
  const reserved=[[Tw-25,Tw-20],[Tw-20,Tw-15],[Tw-14,Tw-9],[Tw-8,Tw-3]].map((v,i)=>({id:['cone-repair','heat-repair','Ipos','Imean'][i],logRelativeStart:power.start+v[0],logRelativeEnd:power.start+v[1],purpose:['C.2 moment restoration','A.7 heat moment compensation','higher background moments','phase mean moments'][i]}));
  const pulse=add('axial-pulse',13/o.lambda,t=>-(.5+o.lambda)*t);
  const Tf=64,interp=add('parameter-interpolation',Tf,t=>-(.5+o.lambda)*t,1,{Tf});
  logA-=Math.log(2);interp.logAEnd=logA;
  add('angular-moment-patch',30*Math.log(1/o.lambda),t=>-(.5+o.lambda)*t,0);
  const transitionStart=y;
  add('exterior-steepen',1,t=>-(.5+o.lambda)*t-(1-o.lambda)*sigmaIntegral(t),0);
  add('steep-power',4*Math.log(1/o.h),t=>-1.5*t,0);
  add('exterior-flatten',1,t=>-1.5*t+(1-o.h)*sigmaIntegral(t),0);
  const co=.005,rho=co*o.h,fo=t=>1-rho*(1-smoothStep((t-1)/2)),foPrime=t=>rho*smoothStepDerivative((t-1)/2)/2;
  const Qp=integrate(t=>Math.exp((1-o.h)*t)*foPrime(t)/fo(0),0,3,1e-12,budget).value;
  let Q=(o.lambda-o.h)/(1-o.lambda);const end=y,steps=2000,dy=(end-transitionStart)/steps;
  const ellAt=yy=>{const s=stages.find(s=>yy>=s.start&&yy<=s.end);if(!s)return -.5;const t=yy-s.start;if(s.name==='exterior-steepen')return -o.lambda-(1-o.lambda)*smoothStep(t);if(s.name==='steep-power')return -1;if(s.name==='exterior-flatten')return -1+(1-o.h)*smoothStep(t);return -o.lambda;};
  const ode=(yy,q)=>{const l=ellAt(yy);return -(1+l)*q-l-o.h;};
  for(let i=0;i<steps;i++){const yy=transitionStart+i*dy,k1=ode(yy,Q),k2=ode(yy+dy/2,Q+dy*k1/2),k3=ode(yy+dy/2,Q+dy*k2/2),k4=ode(yy+dy,Q+dy*k3);Q+=dy*(k1+2*k2+2*k3+k4)/6;}
  const wait=Q>Qp&&Qp>0?Math.log(Q/Qp)/(1-o.h):0;
  add('terminal-wait',wait,t=>-(.5+o.h)*t,0);
  add('terminal-flat-collar',3,t=>-(.5+o.h)*t+Math.log(fo(t)/fo(0)),0);
  const logCInfinity=logA+(.5+o.h)*(y+Math.log(o.XR));
  function component(yValue,eta,{heat=true}={}){
    const f=1/(1+eta*eta);let logE,theta=1,stage,U;
    if(yValue<=0){logE=o.logP+Math.log(f)+.1*yValue;stage='reference-inner';U=4*eta;}
    else if(yValue>=y){const logX=yValue+Math.log(o.XR),Z=logX>700?0:2*(1-eta*eta)*Math.exp(-logX),H=heat?heatFast(Math.max(0,Z),o.h).H:1;logE=logCInfinity-(.5+o.h)*logX+Math.log(H);stage='heat-exterior';theta=0;U=0;}
    else {const s=stages.find(s=>yValue>=s.start&&yValue<=s.end),t=yValue-s.start;stage=s.name;theta=s.theta;
      if(stage==='parameter-interpolation'){theta=1-smoothStep(t/Tf);logE=s.logAStart-(.5+o.lambda)*t+theta*Math.log(f)-(1-theta)*Math.log(2);}
      else logE=s.logAStart+s.delta(t)+theta*Math.log(f);
      if(stage==='initial-slope')U=4*eta;
      else if(stage==='axial-decay')U=4*(1-smoothStep(Math.log1p(t)/o.Md))*eta;
      else if(stage==='axial-pulse'){const xi=o.lambda*t,phiB=xi<=.02?.02*sigmaIntegral(xi/.02):xi-.01,R0=phiB*(1-smoothStep(xi-10));U=Math.exp(logE)*(1.05*R0);}
      else U=0;
    }
    return {y:yValue,logX:yValue+Math.log(o.XR),eta,logE,E:logE<-700?0:logE>700?null:Math.exp(logE),U:Number.isFinite(U)?U:null,theta,stage,underflow:logE<-700,scope:'A.2 unedited radial E schedule; axial pulse Amp=1.05 is an explicit uncalibrated candidate; A.8/A.11/A.7 repairs pending'};
  }
  let pressureScalar=null,pressureAudit=null;
  function pressureJet(eta,n){
    const e=jetVar(eta,n),f=jetInv(jetAdd(jetC(1,n),jetMul(e,e)));
    if(pressureScalar===null){const cut=Math.min(40,interp.start),N=800,integral=n=>{const dy=cut/n;let sum=0;for(let i=0;i<=n;i++){const yy=i*dy,v=component(yy,0,{heat:false}),w=i===0||i===n?1:i%2?4:2;sum+=w*Math.exp(2*v.logE);}return dy*sum/6;},coarse=integral(N),fine=integral(2*N);pressureScalar=-2.5*o.PStar**2-fine;const endE=component(cut,0,{heat:false});pressureAudit={reference:'A.21 reference pressure datum before all required moment restorations',logRadiusIntegral:[0,cut],innerAnalyticContribution:-2.5*o.PStar**2,outerFiniteIntegral:-fine,quadratureDifferenceEstimate:Math.abs(fine-coarse)/15,tailScaleEstimate:Math.exp(2*endE.logE)/(4*.49),tailHypothesis:'The omitted E log-slope is at most -0.49; this hypothesis and all eta derivatives are not interval certified.',heatAndMomentRepairsApplied:false,certified:false};}
    return jetScale(jetMul(f,f),pressureScalar);
  }
  return {stages:stages.map(({delta,...s})=>s),reserved,terminalLogRadius:y,logCInfinity,logNormalization:'CInfinity stored as log because outer radii may exceed binary64',QAtWaitStart:Q,Qp,wait,component,pressureJet,pressureAudit:()=>{pressureJet(0,0);return pressureAudit;},
    checks:[{name:'reserved_patches_disjoint',pass:reserved.every((r,i)=>i===0||reserved[i-1].logRelativeEnd<r.logRelativeStart||reserved[i-1].logRelativeEnd===r.logRelativeStart)},{name:'terminal_wait_positive',pass:Q>=Qp&&Qp>0}],
    blockers:[{id:'A8_AXIAL_AMPLITUDE',criterion:'N3-02',reason:'The source Amp(eta), two end corrections imposing M=J=0, and S=0 have not been calibrated on the entire exponentially long schedule.'},{id:'A11_ANGULAR_PRESSURE_MOMENTS',criterion:'N3-02',reason:'Two relative E bumps imposing angular moment and pressure increment preservation are not yet applied.'},{id:'A7_HEAT_COMPENSATION',criterion:'N3-02',reason:'Heat replacement is evaluated exactly in the far branch; its five-moment compensation and exact common pressure datum require the completed A.7 solve.'}],source:{source:'N00',pages:[129,130,133,138,139],equations:['A.5','A.7','A.9','A.10','A.12','A.13','A.21','A.32']}};
}
function fiveMoments(profile,a,b,N=600){
  N=2*Math.ceil(N/2);const h=(b-a)/N,s=[0,0,0,0,0];for(let i=0;i<=N;i++){const x=a+i*h,{E,U}=profile(x),H=Math.sqrt(2*x)*E,w=(i===0||i===N?1:i%2?4:2)*h/3;const v=[U,H,U*H,U*U-E*E/2,E*E/(2*x)];v.forEach((v,k)=>s[k]+=w*v);}return s;
}
function solveFiveMomentRepair({eta=.2,PStar=2,lambda=.08,patch=[Math.exp(-6),Math.exp(-5)],discrepancy=null,base='inner-reference',omitQuadratic=false,overlap=false,iterations=20}={},budget=makeBudget()){
  iterations=boundedInteger(iterations,'iterations',1,40);PStar=positive(PStar,'PStar');lambda=positive(lambda,'lambda');if(!(Math.abs(eta)<=1))throw new ComputeError('INVALID_INPUT','Moment eta requires |eta|<=1');if(discrepancy!==null&&(!Array.isArray(discrepancy)||discrepancy.length!==5||!discrepancy.every(Number.isFinite)))throw new ComputeError('INVALID_INPUT','Five finite moment discrepancies are required');
  const [a,b]=patch;if(!(a>0&&b>a))throw new ComputeError('INVALID_SUPPORT','Require positive radial patch a<b');
  const width=(b-a)/16,centers=Array.from({length:5},(_,j)=>a+(j+1)*(b-a)/6),supports=centers.map(c=>[c-width/2,c+width/2]);if(overlap)supports[1]=[...supports[0]];
  if(supports.some((s,i)=>i>0&&s[0]<=supports[i-1][1]))throw new ComputeError('INVALID_SUPPORT','Ordered bump supports overlap',{supports});
  const ideal=x=>({E:PStar/(1+eta*eta)*x**(base==='inner-reference'?.1:-.5-lambda),U:base==='inner-reference'?4*eta:0});
  const bumps=x=>supports.map(([l,r])=>compactBump(x,l,r)*width),scale=fiveMoments(ideal,a,b,800).map(x=>Math.max(Math.abs(x),1e-8));
  const N=800,dx=(b-a)/N,rows=[];for(let i=0;i<=N;i++){const x=a+i*dx,w=(i===0||i===N?1:i%2?4:2)*dx/3;rows.push({x,w,...ideal(x),b:bumps(x)});}
  const plantedCoefficients=[.001,-.0008,.0004,-.0005,.0003];
  if(discrepancy===null){const ref=fiveMoments(ideal,a,b,3200),planted=x=>{const p=ideal(x),v=bumps(x),c=plantedCoefficients;return {E:p.E+c[2]*v[2]+c[3]*v[3]+c[4]*v[4],U:p.U+c[0]*v[0]+c[1]*v[1]};},target=fiveMoments(planted,a,b,3200);discrepancy=target.map((x,k)=>ref[k]-x);}
  const evalMap=c=>{const F=Array(5).fill(0),J=Array.from({length:5},()=>Array(5).fill(0));for(const r of rows){const dU=c[0]*r.b[0]+c[1]*r.b[1],dE=c[2]*r.b[2]+c[3]*r.b[3]+c[4]*r.b[4],U=r.U+dU,E=r.E+dE,sqrt=Math.sqrt(2*r.x),quad=omitQuadratic?0:1;
    const delta=[dU,sqrt*dE,(r.U*dE+r.E*dU+quad*dU*dE)*sqrt,2*r.U*dU-r.E*dE+quad*(dU*dU-dE*dE/2),(2*r.E*dE+quad*dE*dE)/(2*r.x)];
    for(let k=0;k<5;k++)F[k]+=r.w*delta[k];
    for(let j=0;j<5;j++){const du=j<2?r.b[j]:0,de=j>=2?r.b[j]:0,v=[du,sqrt*de,sqrt*(E*du+U*de),2*U*du-E*de,E*de/r.x];for(let k=0;k<5;k++)J[k][j]+=r.w*v[k];}}
    return {F:F.map((v,k)=>(v+discrepancy[k])/scale[k]),J:J.map((row,k)=>row.map(x=>x/scale[k]))};};
  let c=Array(5).fill(0),history=[],last;
  for(let it=0;it<iterations;it++){budget.tick(rows.length*25);last=evalMap(c);const residual=Math.max(...last.F.map(Math.abs));history.push(residual);if(residual<2e-12)break;const solve=solveLinear(last.J,last.F.map(x=>-x));let fac=1;for(let j=0;j<28;j++){const trial=c.map((x,k)=>x+fac*solve.solution[k]);if(Math.max(...evalMap(trial).F.map(Math.abs))<residual){c=trial;break;}fac/=2;}}
  const corrected=x=>{const v=ideal(x),bs=bumps(x);return {E:v.E+c[2]*bs[2]+c[3]*bs[3]+c[4]*bs[4],U:v.U+c[0]*bs[0]+c[1]*bs[1]};};
  const m0=fiveMoments(ideal,a,b,3200),m1=fiveMoments(corrected,a,b,3200),physicalResidual=m1.map((x,k)=>x-m0[k]+discrepancy[k]),scaled=Math.max(...physicalResidual.map((x,k)=>Math.abs(x)/scale[k])),positiveE=rows.every(r=>corrected(r.x).E>0),J=evalMap(c).J,invColumns=Array.from({length:5},(_,j)=>solveLinear(J,Array.from({length:5},(_,k)=>j===k?1:0)).solution),inverseNorm=Math.max(...Array.from({length:5},(_,i)=>invColumns.reduce((s,col)=>s+Math.abs(col[i]),0))),newtonStep=solveLinear(J,evalMap(c).F.map(x=>-x)).solution;
  return {status:scaled<1e-8&&positiveE&&!omitQuadratic?'NUMERICAL_MOMENT_MATCH':'REJECTED_MOMENT_MATCH',eta,patch,supports,coefficients:c,momentOrder:['M','I','J','S','Cp'],targetDiscrepancy:discrepancy,residual:physicalResidual,normalizedResidual:scaled,quadratureNodes:{solve:801,independentCheck:3201},jacobian:J,inverseInfinityNorm:inverseNorm,lastNewtonStep:Math.max(...newtonStep.map(Math.abs)),history,positive:positiveE,intervalNewtonCertified:false,
    acceptance:{finiteNumericalMatch:scaled<1e-8&&positiveE,continuousFiveMomentsCertified:false,uniformEtaDerivativesCertified:false},blockers:[{id:'CONTINUOUS_MOMENT_NEWTON_BOUND',criterion:'N3-05',reason:'The finite nonlinear system is solved and independently reintegrated. A continuous quadrature enclosure, an interval-Newton inclusion, and uniform eta-derivative control are still required.'}],profileSamples:Array.from({length:81},(_,i)=>{const x=a+(b-a)*i/80;return {x,...corrected(x)};}),source:{source:'N00',pages:[155,156,157,162],equations:['B.35','B.36','C.17']}};
}
function coneMargins({a,bs,ps}){
  if(!(a>0))return {pass:false,reason:'a must be positive',a,bs,ps};const ts=-bs/a,vs=a+bs*bs/a,Pc=ps[0]+ts*ps[1],Jc=ps[1]-ts*ps[0],T=[ps[0]-a,ps[1]+bs],norm=Math.hypot(...T);
  if(!(norm>0))return {pass:false,reason:'stress vanishes; do not divide by zero; endpoint factorization required',a,bs,ps,vs,Pc,Jc,T};
  const n=T.map(x=>x/norm),projection=n[0]+ts*n[1],cross=n[1]-ts*n[0],quadratic=projection>0?2-(vs-2)*cross*cross/(projection*projection):-Infinity;
  return {a,bs,ps,ts,vs,Pc,Jc,T,n,projection,quadratic,pass:vs>2&&projection>0&&quadratic>0,sampledKappa:Math.min(1.999,projection,quadratic),fullIntervalCertified:false};
}
/** A true whole-box arithmetic enclosure, independent of the incomplete profile.
 * It certifies every input tuple in this finite box, not C.1's loop existence.
 */
function certifiedConeBox(input={}){
  const box=input.box??{a:[2.9,3.1],bs:[-.05,.05],p1:[4.9,5.1],p2:[-.05,.05]},b={};
  for(const k of ['a','bs','p1','p2']){if(!Array.isArray(box[k])||box[k].length!==2)throw new ComputeError('INVALID_INPUT',`Cone box ${k} requires [lower,upper]`);b[k]=interval(...box[k]);}
  if(b.a[0]<=0)return {status:'REJECTED_CONE_BOX',pass:false,box,reason:'The a enclosure must be strictly positive.'};
  const ts=idiv([-b.bs[1],-b.bs[0]],b.a),vs=iadd(b.a,idiv(ipow(b.bs,2),b.a)),Pc=iadd(b.p1,imul(ts,b.p2)),Jc=isub(b.p2,imul(ts,b.p1)),gap=isub(Pc,vs),vsGap=isub(vs,point(2));
  if(gap[0]<=0||vsGap[0]<=0)return {status:'REJECTED_CONE_BOX',pass:false,box,reason:'vs>2 and Pc>vs are not certified throughout the box.',vs:ball(vs),gap:ball(gap)};
  const T1=isub(b.p1,b.a),T2=iadd(b.p2,b.bs),normSq=iadd(ipow(T1,2),ipow(T2,2));
  if(normSq[0]<=0)return {status:'REJECTED_CONE_BOX',pass:false,box,reason:'Stress norm enclosure touches zero.'};
  const projection=idiv(gap,ipower(normSq,.5)),quadratic=isub(point(2),idiv(imul(vsGap,ipow(Jc,2)),ipow(gap,2))),kappaLower=Math.min(projection[0],quadratic[0],1.999),pass=kappaLower>0;
  return {status:pass?'VERIFIED_WHOLE_PARAMETER_BOX':'REJECTED_CONE_BOX',pass,box,vs:ball(vs),Pc:ball(Pc),Jc:ball(Jc),projection:ball(projection),quadraticMargin:ball(quadratic),kappaLower,quantifier:'For every real (a,bs,p1,p2) in the stated Cartesian box, inequalities (4.26) hold with any 0<kappa<=kappaLower.',method:'Outward binary64 interval arithmetic, including bounded-series square root via exp(log/2).',fullProfileConeCertified:false,source:{source:'N00',pages:[32,33],equations:['4.20','4.25','4.26']}};
}
function coneModulationFixture({N=32,amplitude=.12,Xa=1,Xb=4}={}){
  N=boundedInteger(N,'N',2,512);if(!(0<Xa&&Xa<Xb))throw new ComputeError('INVALID_SUPPORT','0<Xa<Xb required');
  const f=(X,n)=>{const y=Math.log(X/Xa)/Math.log(Xb/Xa),cut=smoothStep(4*y)*smoothStep(4*(1-y)),A=amplitude*cut*Math.sin(n*Math.log(X)),B=amplitude*cut*Math.cos(n*Math.log(X)),E=X**(-.6);return {E:E*Math.exp(A/n),U:B/n,baseE:E,A,B};};
  const samples=Array.from({length:201},(_,i)=>{const X=Xa+(Xb-Xa)*i/200,p=f(X,N),q=f(X,2*N),dx=1e-5*X,d=(f(X+dx,N).E-f(X-dx,N).E)/(2*dx),baseD=-.6*X**(-1.6);return {X,EN:p.E,UN:p.U,valueChange:p.E-p.baseE,twiceNValueChange:q.E-q.baseE,radialDerivativeChange:X*(d-baseD)};});
  const maxValue=Math.max(...samples.map(p=>Math.abs(p.valueChange))),maxDerivative=Math.max(...samples.map(p=>Math.abs(p.radialDerivativeChange)));
  const weight=X=>X<=Xa||X>=Xb?0:Math.exp(-(.1**2)/Math.log(X/Xa)**2-4/Math.log(Xb/X)**2);
  return {status:'MODULATION_OPERATOR_FIXTURE',formula:'E_N=E exp(A(X,eta,N log X)/N); U_N=U+B(X,eta,N log X)/N',N,amplitude,samples,maxValueChange:maxValue,maxLogRadialDerivativeChange:maxDerivative,edgeValues:{Xa:weight(Xa),Xb:weight(Xb),inside:weight(Math.sqrt(Xa*Xb))},fullConeRealization:false,scope:'The C.12 operator is executed on explicit smooth compact periodic primitives. These arbitrary primitives are not the admissible shear loop required by Lemma C.1.',source:{source:'N00',pages:[161,163],equations:['C.12','C.13','C.18']}};
}

return {smoothStep,smoothStepDerivative,compactBump,parameterOrder,buildOuterSchedule,fiveMoments,solveFiveMomentRepair,coneMargins,certifiedConeBox,coneModulationFixture};
})();
const __m1_24 = (()=>{
const {exteriorPoint,exteriorJet,heatFast,taylorGreenPoint} = __m1_21;
const {fromSimilarity,toSimilarity,monomialJet,parameters} = __m1_20;
const {ComputeError,makeBudget} = __m1_16;
const {parameterOrder,buildOuterSchedule} = __m1_23;
const {solveAxisCoefficients,evaluateAxis} = __m1_22;
const offsets=[-3,-2,-1,0,1,2,3],D1=[-1/60,3/20,-3/4,0,3/4,-3/20,1/60],D2=[1/90,-3/20,3/2,-49/18,3/2,-3/20,1/90];
const norm=a=>Math.hypot(...a),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
function derivative(f,x,h,order=1){const w=order===1?D1:D2;return offsets.reduce((s,k,i)=>s+w[i]*f(x+k*h),0)/h**order;}
function coordinateChecks(input={}){
  const o=parameters(input),positions=[fromSimilarity({X:.37,eta:-.48,theta:.7},o).position,fromSimilarity({X:1.3,eta:.62,theta:1.2},o).position],checks=[];
  for(const [i,position] of positions.entries())for(const powers of [{b:.3,radialPower:2,axialPower:3},{b:-.8,radialPower:1,axialPower:0},{b:1.2,radialPower:0,axialPower:2}]){
    const p={...o,...powers},v=monomialJet(position,p),ht=Math.min(.0008,o.tau/10),hz=.0008*Math.sqrt(o.viscosity),dt=derivative(tau=>monomialJet(position,{...p,tau}).value,o.tau,ht)*(-1),dz=derivative(z=>monomialJet([position[0],position[1],z],p).value,position[2],hz),err=Math.max(Math.abs(dt-v.dt)/(1+Math.abs(v.dt)),Math.abs(dz-v.dz)/(1+Math.abs(v.dz)));
    checks.push({name:`coordinate_chain_${i}_${powers.radialPower}_${powers.axialPower}`,pass:err<1e-10,error:err,tolerance:1e-10,independentPaths:['paper T_b/Z_b analytic operator','seven-point physical-coordinate finite difference through inverse root solve']});
  }return checks;
}
function pdeFD(field,position,input={},options={}){
  const h=options.step??.002,ht=Math.min(h,(input.tau??.3)/10),value=field(position,input),u=value.velocity,grad=Array.from({length:3},()=>Array(3).fill(0)),lap=[0,0,0],dt=[0,0,0],pg=[0,0,0];
  for(let c=0;c<3;c++){
    dt[c]=derivative(t=>field(position,{...input,[options.timeKey??'time']:t}).velocity[c],input[options.timeKey??'time']??0,ht)*(options.timeKey==='tau'?-1:1);
    for(let j=0;j<3;j++){
      const f=s=>{const p=[...position];p[j]=s;return field(p,input).velocity[c];};
      grad[c][j]=derivative(f,position[j],h);lap[c]+=derivative(f,position[j],h,2);
    }
  }
  if(value.pressure!==undefined&&value.pressure!==null){for(let j=0;j<3;j++)pg[j]=derivative(s=>{const p=[...position];p[j]=s;return field(p,input).pressure;},position[j],h);}else pg.splice(0,3,...value.pressureGradient);
  const advection=grad.map(g=>dot(u,g)),residual=dt.map((x,i)=>x+advection[i]-(input.viscosity??1)*lap[i]+pg[i]),denominator=1+norm(dt)+norm(advection)+(input.viscosity??1)*norm(lap)+norm(pg);
  return {residual,normalizedResidual:norm(residual)/denominator,normalization:'1+||dt u||2+||(u·grad)u||2+nu||lap u||2+||grad p||2',divergence:grad[0][0]+grad[1][1]+grad[2][2],terms:{dt,advection,laplacian:lap,pressureGradient:pg},derivativeMethod:'seven-point centered physical finite differences; not copied analytic jets',step:h,solutionErrorBound:null};
}
function exactPDEChecks(input={},budget=makeBudget()){
  const checks=[],point=[.71,.43,.27],time=.19;
  for(const viscosity of [.1,1,3]){
    budget.tick();const p={time,viscosity},r=pdeFD(taylorGreenPoint,point,p),fine=pdeFD(taylorGreenPoint,point,p,{step:.003});
    checks.push({name:`taylor_green_fd_nu_${viscosity}`,pass:r.normalizedResidual<1e-9&&fine.normalizedResidual<1e-9,value:r,refinedValue:fine,tolerance:1e-9});
    const bad=pdeFD(taylorGreenPoint,point,{...p,pressureSign:-1});checks.push({name:`negative_pressure_sign_nu_${viscosity}`,pass:bad.normalizedResidual>1e-3,negativeControl:true,observedResidual:bad.normalizedResidual});
  }
  const o={tau:.3,h:.005,viscosity:1,cInfinity:1},r=1.2,j=exteriorJet(r,o,budget),hm=heatFast(j.Z,o.h),ode=j.Z*j.Z*hm.ddH+(1+(2+2*o.h)*j.Z)*hm.dH+o.h*(1+o.h)*hm.H;
  checks.push({name:'heat_ode_independent_integrals',pass:Math.abs(ode)<1e-10,residual:ode,tolerance:1e-10});
  const fdDt=-derivative(tau=>exteriorJet(r,{...o,tau},budget).K,o.tau,.002),fdDr=derivative(x=>exteriorJet(x,o,budget).K,r,.004),fdDrr=derivative(x=>exteriorJet(x,o,budget).K,r,.004,2),correct=fdDt-(fdDrr+fdDr/r-j.K/(r*r)),wrongSign=fdDt-(fdDrr+fdDr/r+j.K/(r*r));
  checks.push({name:'heat_cylindrical_fd',pass:Math.abs(correct)/(1+Math.abs(fdDt)+Math.abs(fdDrr)+Math.abs(fdDr/r)+Math.abs(j.K/(r*r)))<1e-9,residual:correct,tolerance:1e-9});
  checks.push({name:'negative_heat_angular_laplacian_sign',pass:Math.abs(wrongSign)>.1,negativeControl:true,residual:wrongSign});
  const ext=(p,o)=>exteriorPoint(p,o,budget),e=pdeFD(ext,[1.1,.5,.2],o,{timeKey:'tau',step:.004});checks.push({name:'exterior_full_momentum_with_pressure',pass:e.normalizedResidual<1e-9,value:e,tolerance:1e-9});
  const noPressure=(p,o)=>({...ext(p,o),pressureGradient:[0,0,0]}),np=pdeFD(noPressure,[1.1,.5,.2],o,{timeKey:'tau',step:.004});checks.push({name:'negative_missing_exterior_pressure',pass:np.normalizedResidual>1e-3,negativeControl:true,value:np});
  const wrongNu=(p,o)=>ext(p,{...o,viscosity:1}),wn=pdeFD(wrongNu,[1.1,.5,.2],{...o,viscosity:3},{timeKey:'tau',step:.004});checks.push({name:'negative_inconsistent_viscosity',pass:wn.normalizedResidual>1e-4,negativeControl:true,value:wn});
  return checks;
}
function coreReconstructionChecks(input={},budget=makeBudget()){
  const o={...parameterOrder({logC:0}),...parameters({tau:.3}),axisOrder:8},outer=buildOuterSchedule(o,budget),cache=new Map();
  const coeff=eta=>{if(!cache.has(eta))cache.set(eta,solveAxisCoefficients(eta,o,outer.pressureJet,budget));return cache.get(eta);};
  const field=(position,options)=>{const c=toSimilarity(position,options),p=evaluateAxis(coeff(c.eta),c.X),q=c.q,nu=options.viscosity,[x,y]=position;return {velocity:[p.VoverX*x/(2*q)-q**(-1-options.h)*p.F*y,p.VoverX*y/(2*q)+q**(-1-options.h)*p.F*x,Math.sqrt(nu)*q**(-.5-options.h)*p.U],pressure:nu*q**(-1-2*options.h)*p.Pi,position};};
  const position=fromSimilarity({X:.1/o.Lambda,eta:0,theta:.7},o).position,r=pdeFD(field,position,o,{timeKey:'tau',step:.00025}),p=evaluateAxis(coeff(0),.1/o.Lambda),axis=field([0,0,0],o),denominator=1+Math.hypot(...r.terms.advection)+Math.hypot(...r.terms.dt),divErr=Math.abs(r.divergence)/denominator;
  const base=solveAxisCoefficients(.2,{...o,axisOrder:4},outer.pressureJet,budget),fine=solveAxisCoefficients(.2,{...o,axisOrder:8},outer.pressureJet,budget),a=evaluateAxis(base,.4/o.Lambda),b=evaluateAxis(fine,.4/o.Lambda);
  return [{name:'actual_core_Cartesian_divergence_FD',pass:divErr<1e-8,normalizedDivergence:divErr,divergence:r.divergence,tolerance:1e-8,point:position,independentPaths:['source radial integral average reconstruction','seven-point Cartesian finite difference with separate inverse coordinate solves'],fullNSResidual:r.normalizedResidual,fullNSResidualMustVanish:false,reason:'The source leading profile omits axial viscosity from its leading tangential system; this finite truncation is not a full NS solution.'},{name:'actual_core_axis_regular_representation',pass:[...axis.velocity,axis.pressure,p.F,p.VoverX].every(Number.isFinite),axisValue:axis,representation:'u_xy=VoverX*(x,y)/(2q)+q^(-1-h)F*(-y,x); no division by r on the axis.'},{name:'nonlinear_axis_recurrence_order_refinement',pass:Math.abs(b.leadingResidual.angular)<Math.abs(a.leadingResidual.angular)&&Math.abs(b.Phi-b.comparison)>1e-4,coarse:a.leadingResidual,refined:b.leadingResidual,nonlinearPhi:b.Phi,scalarComparison:b.comparison,certifiedNonlinearTail:false}];
}
const cadd=(a,b)=>[a[0]+b[0],a[1]+b[1]],cmul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],cscale=(a,s)=>[a[0]*s,a[1]*s];
function fft(a,inverse=false){
  const n=a.length;if(n===1)return [a[0]];let p=2;while(p<n&&n%p)p++;const m=n/p;
  const subs=Array.from({length:p},(_,j)=>fft(Array.from({length:m},(_,r)=>a[j+p*r]),inverse));
  return Array.from({length:n},(_,k)=>{let s=[0,0];for(let j=0;j<p;j++){const angle=(inverse?1:-1)*2*Math.PI*j*k/n;s=cadd(s,cmul(subs[j][k%m],[Math.cos(angle),Math.sin(angle)]));}return s;});
}
function transform3(a,n,inverse){let data=a.map(x=>[...x]);for(let axis=0;axis<3;axis++)for(let i=0;i<n;i++)for(let j=0;j<n;j++){
  const ids=Array.from({length:n},(_,k)=>axis===0?(k*n+i)*n+j:axis===1?(i*n+k)*n+j:(i*n+j)*n+k),v=fft(ids.map(id=>data[id]),inverse);ids.forEach((id,k)=>data[id]=v[k]);
}if(inverse)data=data.map(x=>cscale(x,1/n**3));return data;}
const idx=(k,n)=>((k[0]%n+n)%n*n+(k[1]%n+n)%n)*n+(k[2]%n+n)%n;
function spectralConvolutionCheck(input={},budget=makeBudget()){
  const baseN=6,paddedN=9,retained=2,seeds=[{k:[2,0,0],v:[0,.3,.2],phase:.2},{k:[2,1,0],v:[.2,-.4,.1],phase:.8},{k:[0,2,0],v:[.1,0,.3],phase:-.3},{k:[0,0,1],v:[.2,.1,0],phase:.5}],modes=[];
  for(const s of seeds){const z=[Math.cos(s.phase)/2,Math.sin(s.phase)/2],u=s.v.map(x=>cscale(z,x));modes.push({k:s.k,u},{k:s.k.map(x=>-x),u:u.map(([a,b])=>[a,-b])});}
  const direct=new Map();
  for(const p of modes)for(const q of modes){budget.tick();const k=p.k.map((x,i)=>x+q.k[i]);if(k.some(x=>Math.abs(x)>retained))continue;let qp=[0,0];for(let j=0;j<3;j++)qp=cadd(qp,cscale(p.u[j],q.k[j]));const v=q.u.map(x=>cmul([0,1],cmul(qp,x))),key=k.join(',');if(!direct.has(key))direct.set(key,[[0,0],[0,0],[0,0]]);direct.set(key,direct.get(key).map((x,i)=>cadd(x,v[i])));}
  function pseudo(n){budget.tick(15*n**3);const grids=[],grads=[];for(let c=0;c<3;c++){const coeff=Array.from({length:n**3},()=>[0,0]);for(const m of modes)coeff[idx(m.k,n)]=cscale(m.u[c],n**3);grids[c]=transform3(coeff,n,true).map(x=>x[0]);grads[c]=[];for(let j=0;j<3;j++){const d=Array.from({length:n**3},()=>[0,0]);for(const m of modes)d[idx(m.k,n)]=cscale(cmul([0,m.k[j]],m.u[c]),n**3);grads[c][j]=transform3(d,n,true).map(x=>x[0]);}}
    const nonlinear=Array.from({length:3},(_,c)=>Array.from({length:n**3},(_,i)=>grids.reduce((s,g,j)=>s+g[i]*grads[c][j][i],0))),hat=nonlinear.map(a=>transform3(a.map(x=>[x,0]),n,false).map(x=>cscale(x,1/n**3)));let defect=0;for(let i=0;i<n**3;i++)for(let c=0;c<3;c++)defect+=grids[c][i]*nonlinear[c][i]/n**3;return {hat,energyCancellation:defect};}
  const padded=pseudo(paddedN),aliased=pseudo(baseN);let error=0,badError=0,scale=0;
  for(let x=-retained;x<=retained;x++)for(let y=-retained;y<=retained;y++)for(let z=-retained;z<=retained;z++){const k=[x,y,z],d=direct.get(k.join(','))??[[0,0],[0,0],[0,0]];for(let c=0;c<3;c++){error=Math.max(error,Math.hypot(...padded.hat[c][idx(k,paddedN)].map((v,j)=>v-d[c][j])));badError=Math.max(badError,Math.hypot(...aliased.hat[c][idx(k,baseN)].map((v,j)=>v-d[c][j])));scale=Math.max(scale,Math.hypot(...d[c]));}}
  return {model:'independent-Fourier-convolution-fixture',pass:error/(1+scale)<1e-11&&Math.abs(padded.energyCancellation)<1e-11&&badError>1e-3,checks:[{name:'FFT_vs_direct_convolution',pass:error/(1+scale)<1e-11,error,normalizedError:error/(1+scale),tolerance:1e-11},{name:'dealiased_energy_cancellation',pass:Math.abs(padded.energyCancellation)<1e-11,value:padded.energyCancellation},{name:'negative_aliasing_without_padding',pass:badError>1e-3,negativeControl:true,error:badError}],grid:{baseN,paddedN,paddingFactor:1.5,retainedModes:'each k_j in [-2,2]; all base Nyquist modes excluded',complexSymmetry:'u(-k)=conj(u(k))'},independentPaths:['nested finite mode convolution in coefficient space','mixed-radix 3D FFT, 3/2 zero padding, physical product'],solutionErrorBound:null,budget:budget.snapshot()};
}

return {coordinateChecks,pdeFD,exactPDEChecks,coreReconstructionChecks,spectralConvolutionCheck};
})();
const __m1_25 = (()=>{
const {ComputeError,integrate,makeBudget,boundedInteger,positive} = __m1_16;
const {parameters,fromSimilarity,toSimilarity} = __m1_20;
const {solveAxisCoefficients,evaluateAxis} = __m1_22;
const {buildOuterSchedule,parameterOrder,smoothStep,compactBump,solveFiveMomentRepair,coneMargins,coneModulationFixture} = __m1_23;
/** Executable candidate, not Theorem 4.6 certification.
 * The nonlinear axis coefficients and outer unedited schedule are source formulae.
 * The intervening C-infinity diagnostic continuation is identified as such; the
 * paper's uniformly certified B.5/C.1 coupling remains an explicit blocker. Separate component jobs implement those source operators.
 */
function constructLeadingCandidate(input={},budget=makeBudget()){
  const o={...parameterOrder(input),...parameters(input),axisOrder:input.axisOrder??8},outer=buildOuterSchedule(o,budget),etaCount=boundedInteger(input.etaCount??7,'etaCount',3,21),radialCount=boundedInteger(input.radialCount??25,'radialCount',8,80),Ycore=Math.min(1.8,positive(input.Ycore??1.2,'Ycore')),X0=Ycore/o.Lambda,X1=1.25*X0,Xend=o.XR*Math.exp(-8),patch=[Math.exp(-6),Math.exp(-5)],cache=new Map(),sliceReports=[];
  if(!(Xend>X1))throw new ComputeError('INVALID_SUPPORT','Axis interval overlaps the restoration region; increase XR or shorten axis interval',{X1,Xend});
  function makeSlice(eta,match=true){
    const key=`${eta}:${match}`;if(cache.has(key))return cache.get(key);
    const axis=solveAxisCoefficients(eta,o,outer.pressureJet,budget),anchor=evaluateAxis(axis,X0),f=1/(1+eta*eta);
    const axisValue=X=>evaluateAxis(axis,X);
    const raw=X=>{
      if(X<=X0){const p=axisValue(X);return {E:p.E,U:p.U,F:p.F,stage:'nonlinear-axis-finite-series'};}
      const referenceE=o.PStar*f*(X/o.XR)**.1,powerE=anchor.E*(X/X0)**.1;
      if(X<X1){const c=smoothStep((X-X0)/(X1-X0)),p=axisValue(X),E=(1-c)*p.E+c*powerE;return {E,U:(1-c)*p.U+c*anchor.U,F:E/Math.sqrt(2*X),stage:'diagnostic-axis-collar'};}
      if(X<Xend){const c=smoothStep(Math.log(X/X1)/Math.log(Xend/X1)),E=Math.exp((1-c)*Math.log(Math.max(powerE,Number.MIN_VALUE))+c*Math.log(referenceE));return {E,U:(1-c)*anchor.U+c*4*eta,F:E/Math.sqrt(2*X),stage:'diagnostic-continuation'};}
      const p=outer.component(Math.log(X/o.XR),eta);return {E:p.E??0,U:p.U??0,F:(p.E??0)/Math.sqrt(2*X),stage:p.stage,underflow:p.underflow};
    };
    let repair=null,discrepancy=null;
    if(match){
      const xend=Xend/o.XR,actual=[];
      for(let k=0;k<5;k++)actual.push(integrate(logx=>{const x=Math.exp(logx),p=raw(o.XR*x),H=Math.sqrt(2*x)*p.E;return x*[p.U,H,p.U*H,p.U*p.U-p.E*p.E/2,p.E*p.E/(2*x)][k];},Math.log(X0/o.XR)-28,Math.log(xend),2e-10,budget).value);
      const I=Math.SQRT2*o.PStar*f*xend**1.6/1.6,ideal=[4*eta*xend,I,4*eta*I,16*eta*eta*xend-o.PStar**2*f*f*xend**1.2/2.4,2.5*o.PStar**2*f*f*xend**.2];discrepancy=actual.map((v,k)=>v-ideal[k]);
      try{repair=solveFiveMomentRepair({eta,PStar:o.PStar,lambda:o.lambda,patch,discrepancy},budget);}catch(e){repair={status:'REJECTED_MOMENT_MATCH',error:{code:e.code??'ERROR',message:e.message},coefficients:[0,0,0,0,0],supports:[],acceptance:{continuousFiveMomentsCertified:false}};}
    }
    const value=X=>{const p=raw(X),x=X/o.XR;if(repair?.status==='NUMERICAL_MOMENT_MATCH'&&x>patch[0]&&x<patch[1]){const width=(patch[1]-patch[0])/16,b=repair.supports.map(([l,r])=>compactBump(x,l,r)*width),c=repair.coefficients;const E=p.E+c[2]*b[2]+c[3]*b[3]+c[4]*b[4];return {...p,E,U:p.U+c[0]*b[0]+c[1]*b[1],F:E/Math.sqrt(2*X),stage:'finite-five-moment-repair'};}return p;};
    const s={eta,axis,anchor,raw,value,repair,discrepancy};cache.set(key,s);return s;
  }
  const etaValues=Array.from({length:etaCount},(_,i)=>-.9+1.8*i/(etaCount-1)),slices=etaValues.map((eta,i)=>{budget.progress({phase:'axis-and-moment-candidate',completed:i,total:etaCount});const s=makeSlice(eta);sliceReports.push({eta,axisStatus:s.axis.status,realNormalizationPass:s.axis.data.realNormalizationPass,axisAnchorPhi:s.anchor.Phi,axisAnchorResidual:s.anchor.leadingResidual,discrepancy:s.discrepancy,momentStatus:s.repair?.status,momentResidual:s.repair?.normalizedResidual,positivity:s.repair?.positive,blockers:s.axis.blockers});return s;});
  const Xmax=Math.min(o.XR*Math.exp(-4.5),input.Xmax??Math.max(2,4*X0)),Xsamples=[0,...Array.from({length:radialCount-1},(_,i)=>Math.exp(Math.log(X0/30)+(Math.log(Xmax)-Math.log(X0/30))*i/(radialCount-2)))],points=[],profiles=[];
  const derivativeEta=eta=>{const h=2e-5,sp=makeSlice(eta+h,true),sm=makeSlice(eta-h,true);return {sp,sm,h};};
  for(const s of slices){
    const ed=derivativeEta(s.eta);for(const X of Xsamples){budget.tick();const p=s.value(X),raw=s.raw(X),dx=Math.max(1e-8,X*1e-4),Ex=X===0?0:(s.value(X+dx).E-s.value(Math.max(0,X-dx)).E)/(X+dx-Math.max(0,X-dx)),Ux=X===0?s.anchor.UX:(s.value(X+dx).U-s.value(Math.max(0,X-dx)).U)/(X+dx-Math.max(0,X-dx));
      const average=(slice)=>X===0?slice.value(0).U:integrate(t=>slice.value(X*t).U,0,1,2e-8,budget).value,avgU=average(s),avgUp=average(ed.sp),avgUm=average(ed.sm),avgEta=(avgUp-avgUm)/(2*ed.h),L=1-2*o.h*s.eta*s.eta,d=1-s.eta*s.eta,VoverX=(2*s.eta*p.U-2*(.5-o.h)*s.eta*avgU-d*avgEta)/L;
      const Pi=outer.pressureJet(s.eta,0)[0]+(X===0?0:integrate(t=>{const xx=X*t;if(t===0)return s.value(0).F**2;const v=s.value(xx);return v.F*v.F;},0,1,2e-8,budget).value*X);
      profiles.push({X,eta:s.eta,E:p.E,U:p.U,F:p.F,Pi,V0:X*VoverX,radialPressureBalance:p.F*p.F,stage:p.stage,positivity:p.E>0||X===0,radialDerivativeE:Ex,radialDerivativeU:Ux,continuationGrade:p.stage.startsWith('diagnostic')?'UNVERIFIED_CONTINUATION':'SOURCE_FORMULA_OR_NUMERICAL_COMPONENT'});
      for(let k=0;k<6;k++){if(points.length>=budget.maxPoints)break;const theta=2*Math.PI*k/6,c=fromSimilarity({X,eta:s.eta,theta},o),[x,y,z]=c.position,q=c.q,rootNu=Math.sqrt(o.viscosity),x1=x/rootNu,x2=y/rootNu,v=[rootNu*(VoverX*x1/(2*q)-q**(-1-o.h)*p.F*x2),rootNu*(VoverX*x2/(2*q)+q**(-1-o.h)*p.F*x1),rootNu*q**(-.5-o.h)*p.U];
        if(![...c.position,...v].every(Number.isFinite))throw new ComputeError('PRECISION_REQUIRED','Candidate position or velocity exceeds the finite binary64 range',{X,eta:s.eta,tau:o.tau});points.push({pos:c.position,position:c.position,velocity:v,vector:v,value:Math.hypot(...v),label:`eta=${s.eta.toFixed(2)}, X=${X.toPrecision(3)}, ${p.stage}`,stage:p.stage});}
    }
  }
  const trace=Array.from({length:121},(_,i)=>outer.component(-8+(outer.terminalLogRadius+10)*i/120,0));
  const theoremClauses=[{clause:'4.6(i)',status:'PARTIAL',evidence:'Regular Cartesian axis factors and finite nonlinear series evaluated. Separate rational-datum axis bounds certify a local rectangle; they are not linked to these finite eta jets or to this global candidate.'},{clause:'4.6(ii)',status:'PARTIAL',evidence:'Pressure primitive and solenoidal radial reconstruction executed; source leading stress support and exact zero-residual axis remain unverified.'},{clause:'4.6(iii)',status:'BLOCKED',evidence:'Separate jobs compute B.5 continuation and C.1 admissible loops. This older candidate has no certified coupling to them and no all-eta all-radius kappa certificate.'},{clause:'4.6(iv)',status:'PARTIAL',evidence:'Exact flat weights and endpoint exclusion are implemented as independent operators; factorization of the actual reconstructed stress is not established.'},{clause:'4.6(v)',status:'PARTIAL',evidence:'Actual heat exterior and finite five-moment repair are available. A separate source-outer job computes A.8/A.11/A.7 repairs; uniform exact moment calibration and coupling to this candidate remain pending.'},{clause:'4.6(vi)',status:'PARTIAL',evidence:'Four disjoint source log patches generated; no complete certified profile propagated across them.'}];
  const blockers=[...o.blockers,...outer.blockers,{id:'B5_CONTROLLED_CONTINUATION',criterion:'N3-05',reason:'The displayed intermediate field uses an explicit smooth diagnostic continuation, not a verified solution of the controlled continuation and edge activation in B.5--B.7.'},{id:'C1_ADMISSIBLE_LOOP',criterion:'N3-06',reason:'The separate ns.admissible-loop operation computes actual C.1 loops for supplied states. This candidate has not been coupled to a uniformly certified source loop and its subsequent moment restoration.'},{id:'FULL_STRESS_ENDPOINT_FACTOR',criterion:'N3-07',reason:'Actual T0/|T0| collar limits and stress support require certified coupling of controlled continuation, cone realization and all outer moment repairs. Computing those separate components does not establish the coupling.'},{id:'UNIFORM_ETA_GLUE',criterion:'N3-05',reason:'Moment repairs are solved at sampled eta values; uniform analytic eta dependence, interval Newton inclusion, and the repaired field derivative must be certified before PDE use.'}];
  return {status:'PARTIAL_CANDIDATE_WITH_BLOCKERS',evidenceGrade:'NUMERICAL_COMPONENTS_AND_EXPLICIT_UNVERIFIED_CONTINUATION',model:'paper-leading-profile-candidate',parameters:{...o,ordered:undefined,blockers:undefined},parameterOrder:o.ordered,necessaryParameterChecks:o.checks,points,profiles,sliceReports,outer:{stages:outer.stages,reservedPatches:outer.reserved,logCInfinity:outer.logCInfinity,pressureAudit:outer.pressureAudit(),trace},theoremClauses,blockers,
    fullCertifiedProfile:false,fullNavierStokesSolution:false,scope:'N1--N3 candidate laboratory. N4--N8 background, pulses, full residual iteration, compact force and final construction are not implemented by this result.',
    profileDataContract:{sharedParameterHash:'The envelope parameterHash binds all profiles, derivatives, moment residuals and source version in this result.',leadingConeMargin:null,certifiedStressSupport:null,certifiedGlobalError:null,missingEvidence:'Uniform controlled continuation, all corrected moments and C.1 admissible loop must be supplied before the three missing certificates can be computed.',theoremClausesAccountedFor:theoremClauses.length===6},
    derivativeCaveat:'3D radial velocity uses a finite eta-difference of independently repaired continuation averages. A switch between accepted and rejected neighboring repairs is not a differentiable gluing. Uniform eta dependence and a rigorous derivative error remain unverified; no exact divergence-free gluing claim is made.',
    visualization:{points:points.map(({pos,label,value})=>({pos,label,value})),arrows:points.map(({pos,vector})=>({pos,vector})),lines:[],axes:['x','y','z'],description:'Computed nonlinear axis and explicitly unverified continuation samples; full outer schedule is supplied as a separate log-radius trace.',coordinateMeaning:'physical Cartesian x,y,z for tau>0, with sqrt(nu) rescaling; arrows contain physical velocity components before UI normalization',lostInformation:['Finite viewing window omits the enormous outer radius range.','The continuation is a diagnostic candidate and lacks the paper cone certificate.','Field values do not certify a singularity or global theorem.']},
    diagnostics:{pointCount:points.length,profileCount:profiles.length,finite:points.every(p=>[...p.pos,...p.vector].every(Number.isFinite)),sourceMatchedGaussian:false,maxSpeed:points.length?Math.max(...points.map(p=>p.value)):0},budget:budget.snapshot()};
}

return {constructLeadingCandidate};
})();
const __m1_26 = (()=>{
const {ComputeError,makeBudget} = __m1_16;
/** Exact upper-bound certificates for the actual Appendix-B coefficient space.
 * All arithmetic deciding a certificate is rational/BigInt. Plot coordinates are
 * explicitly approximate. This does not identify the datum with the completed
 * outgoing schedule, and does not identify an existing finite eta jet with the
 * fixed point. No caller-supplied norm, tail or theorem-truth flag is accepted.
 */
const axisCertificateSources = Object.freeze({
  repositoryCommit:'f9e8bc5b38b6e212696e8a30e3e91517af887bbd',
  paper:{sha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',pages:[144,145,146,147,148,157],equations:['B.1','B.2','B.4','B.5','B.9','B.10','B.11','B.12','B.14','B.15','B.16','B.40']},
  originalTheorems:[
    {file:'AxisOperators.lean',names:['norm_product_le','norm_average_le','norm_primitive_le','norm_regularInverse_le','norm_parameterPrimitive_le','norm_mulY_le','norm_inverseMixed_le','norm_inverseParamProduct_le','norm_inverseDotProduct_le']},
    {file:'AxisResolvent.lean',names:['naturalOperator_pow_bound','naturalResolvent_norm_le']},
    {file:'AxisContraction.lean',names:['exists_fixedPoint_of_controlled','norm_naturalRemainder_le','naturalRemainder_sub_le','exists_unique_natural_fixedPoint']},
    {file:'AnalyticCoefficientBounds.lean',names:['cauchy_bound_le_weight','normalizedExp_unitHolomorphic']},
    {file:'NaturalAxisData.lean',names:['exists_root_with_positive_Z','low_Z_has_H_margin','exists_sigma']},
    {file:'NaturalAxisBridge.lean',names:['exists_scaled_profiles']}
  ].map(x=>({...x,url:`https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/${x.file}`}))
});

const abs=n=>n<0n?-n:n;
function gcd(a,b){a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t;}return a||1n;}
function Q(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw new ComputeError('INVALID_INPUT','Zero rational denominator');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
const add=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d);
const neg=a=>Q(-a.n,a.d);
const sub=(a,b)=>add(a,neg(b));
const mul=(a,b)=>Q(a.n*b.n,a.d*b.d);
const div=(a,b)=>Q(a.n*b.d,a.d*b.n);
const pow=(a,n)=>Q(a.n**BigInt(n),a.d**BigInt(n));
const cmp=(a,b)=>a.n*b.d<b.n*a.d?-1:a.n*b.d>b.n*a.d?1:0;
const min=(a,b)=>cmp(a,b)<=0?a:b;
const max=(a,b)=>cmp(a,b)>=0?a:b;
const mag=a=>Q(abs(a.n),a.d);
const z=Q(0),one=Q(1),two=Q(2);
const ceil=a=>a.n>=0n?(a.n+a.d-1n)/a.d:a.n/a.d;
const qs=a=>a.d===1n?String(a.n):`${a.n}/${a.d}`;
const qi=a=>({numerator:String(a.n),denominator:String(a.d),exact:qs(a)});
function asNumber(a){if(!a.n)return 0;const n=abs(a.n).toString(),d=a.d.toString(),kn=Math.min(16,n.length),kd=Math.min(16,d.length);return (a.n<0n?-1:1)*(Number(n.slice(0,kn))/Number(d.slice(0,kd)))*10**(n.length-kn-d.length+kd);}
function log10q(a){if(a.n<=0n)return null;const f=n=>{const s=n.toString(),k=Math.min(15,s.length);return s.length-k+Math.log10(Number(s.slice(0,k)));};return f(a.n)-f(a.d);}
const nonnegative=a=>a.n>=0n;
const positive=a=>a.n>0n;
function parse(v,name){
  if(typeof v==='number'){if(!Number.isSafeInteger(v))throw new ComputeError('INVALID_INPUT',`${name}: exact constants must be safe integers or rational strings`);return Q(BigInt(v));}
  if(typeof v!=='string'||v.length>600||!/^[-+]?(?:\d+(?:\.\d+)?|\d+\/\d+)$/.test(v))throw new ComputeError('INVALID_INPUT',`${name}: use an exact rational or decimal string`);
  if(v.includes('/')){const [a,b]=v.split('/');return Q(BigInt(a),BigInt(b));}
  if(v.includes('.')){let [a,b]=v.split('.');const sign=a.startsWith('-')?-1n:1n;return Q(BigInt(a)*10n**BigInt(b.length)+sign*BigInt(b),10n**BigInt(b.length));}
  return Q(BigInt(v));
}
function integer(v,name,lo,hi){if(!Number.isSafeInteger(v)||v<lo||v>hi)throw new ComputeError('INVALID_INPUT',`${name} must be an integer in [${lo},${hi}]`);return v;}
function object(v,name){if(!v||typeof v!=='object'||Array.isArray(v)||Object.getPrototypeOf(v)!==Object.prototype)throw new ComputeError('INVALID_INPUT',`${name} must be a plain JSON object`);}
function keys(v,allowed,name){for(const k of Object.keys(v))if(!allowed.includes(k))throw new ComputeError('INVALID_INPUT',`${name}: unsupported field ${k}; unverified norm/tail claims are not accepted`);}
function normalize(input){
  object(input,'input');
  keys(input,['pressure','h','j0','sigmaMode','lambdaMode','lambdaMultiplier','coefficientRadiusRatio','tailDegree','radialDerivativeOrder','etaDerivativeOrder','sampleEta','sampleCount','maxY','boundBits'],'input');
  const pressure=input.pressure??{family:'rational',K:'10'};object(pressure,'pressure');keys(pressure,['family','K'],'pressure');
  if(pressure.family!=='rational')throw new ComputeError('UNSUPPORTED_PRESSURE_DATUM','Only the exact datum P(eta)=-K/(1+eta^2)^2 has an implemented analytic proof contract; a completed outgoing pressure datum needs its own verified producer.');
  const K=parse(pressure.K??'10','pressure.K'),h=parse(input.h??'1/200','h'),j=parse(input.j0??'3/100','j0');
  if(cmp(K,Q(4))<0||cmp(K,Q(1000000))>0||!positive(h)||cmp(h,Q(1,100))>0||!positive(j)||cmp(j,Q(1,20))>0)throw new ComputeError('INVALID_INPUT','Require 4<=K<=1000000, 0<h<=1/100, 0<j0<=1/20');
  if((input.sigmaMode??'computed-cutoff')!=='computed-cutoff'||(input.lambdaMode??'computed-threshold')!=='computed-threshold')throw new ComputeError('INVALID_INPUT','sigma and Lambda are selected from proved bounds, not caller-supplied thresholds');
  const ratio=parse(input.coefficientRadiusRatio??'1/16','coefficientRadiusRatio'),eta=parse(input.sampleEta??'1/5','sampleEta'),Y=parse(input.maxY??'41/10','maxY');
  if(!positive(ratio)||cmp(ratio,Q(1,2))>0||cmp(mag(eta),one)>0||!positive(Y)||cmp(Y,Q(41,10))>0)throw new ComputeError('INVALID_INPUT','Require 0<coefficientRadiusRatio<=1/2, |sampleEta|<=1, 0<maxY<=41/10');
  const N=integer(input.tailDegree??24,'tailDegree',2,128),kr=integer(input.radialDerivativeOrder??2,'radialDerivativeOrder',0,4),ke=integer(input.etaDerivativeOrder??2,'etaDerivativeOrder',0,4);
  if(N<kr)throw new ComputeError('INVALID_INPUT','tailDegree must be at least radialDerivativeOrder');
  return {K,h,j,ratio,eta,Y,N,kr,ke,multiplier:integer(input.lambdaMultiplier??2,'lambdaMultiplier',1,1024),samples:integer(input.sampleCount??17,'sampleCount',3,65),bits:integer(input.boundBits??128,'boundBits',64,512)};
}
function validateAxisInput(input={}){try{const a=normalize(input);return {valid:true,pressureFamily:'rational',exactInput:{K:qs(a.K),h:qs(a.h),j0:qs(a.j)},finiteLimits:{tailDegree:128,derivativeOrder:4,samples:65}};}catch(e){return {valid:false,status:e.code??'INVALID_INPUT',message:e.message,detail:e.detail??{}};}}

const box=a=>[a,a];
const iadd=(a,b)=>[add(a[0],b[0]),add(a[1],b[1])];
const ineg=a=>[neg(a[1]),neg(a[0])];
const isub=(a,b)=>iadd(a,ineg(b));
function imul(a,b){const v=[mul(a[0],b[0]),mul(a[0],b[1]),mul(a[1],b[0]),mul(a[1],b[1])];return [v.reduce(min),v.reduce(max)];}
function isq(a){if(a[0].n<=0n&&a[1].n>=0n)return [z,max(pow(a[0],2),pow(a[1],2))];return [min(pow(a[0],2),pow(a[1],2)),max(pow(a[0],2),pow(a[1],2))];}
function idiv(a,b){if(b[0].n<=0n&&b[1].n>=0n)throw new ComputeError('PRECISION_REQUIRED','Rational interval divisor includes zero');return imul(a,[div(one,b[1]),div(one,b[0])]);}
const iscale=(a,k)=>imul(a,box(k));
const ibox=a=>({lower:qs(a[0]),upper:qs(a[1])});
const absLower=a=>a[0].n>0n?a[0]:a[1].n<0n?neg(a[1]):z;
function realData(a,e){
  const D=sub(Q(1,2),a.h),A=add(Q(1,2),a.h),d=isub(box(one),isq(e)),U=iadd(iscale(e,Q(4)),box(a.j)),H=iadd(iscale(e,D),imul(d,U));
  const den=iadd(box(one),isq(e)),P=ineg(idiv(box(a.K),isq(den))),Pd=idiv(iscale(e,mul(Q(4),a.K)),imul(isq(den),den));
  const Z=iadd(isub(isub(iscale(imul(isub(box(one),iscale(imul(e,U),two)),U),neg(A)),iscale(H,Q(4))),imul(d,Pd)),iscale(imul(e,P),mul(Q(4),A)));
  return {H,Z,P,Pd};
}
function cutoffCertificate(a,budget){
  const delta=div(a.j,Q(10)),queue=[[neg(one),one]],leaves=[];let margin=null;
  while(queue.length){
    budget.tick(100);if(queue.length+leaves.length>budget.maxPoints)throw new ComputeError('RESOURCE_LIMIT','All-eta interval cover exceeds maxPoints');
    const e=queue.pop(),v=realData(a,e),excluded=cmp(absLower(v.Z),delta)>0,Hsq=isq(v.H);
    if(excluded||positive(Hsq[0])){leaves.push({eta:ibox(e),Z:ibox(v.Z),H2:ibox(Hsq),reason:excluded?'abs(Z)>delta':'H2>=positive-margin'});if(!excluded)margin=margin===null?Hsq[0]:min(margin,Hsq[0]);}
    else {const mid=div(add(e[0],e[1]),two);if(cmp(sub(e[1],e[0]),Q(1,1n<<80n))<0)throw new ComputeError('PRECISION_REQUIRED','Root/low-Z separation requires a finer validated cover');queue.push([mid,e[1]],[e[0],mid]);}
  }
  if(margin===null)margin=one;
  const sigma=div(min(one,margin),Q(20));
  if(cmp(pow(sigma,2),div(margin,Q(400)))>0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Cutoff inequality failed');
  return {sigma,delta,margin,record:{domain:['-1','1'],delta:qs(delta),positiveH2Margin:qs(margin),sigma:qs(sigma),sigmaSquared:qs(pow(sigma,2)),chiLowerOnLowZ:'400/401',chiLowerGreaterThan:'99/100',cells:leaves,coveredWholeInterval:true,method:'Exact rational interval subdivision covers every eta; each cell either excludes |Z|<=delta or proves H^2>=m. sigma=min(1,m)/20.'}};
}
function complexBounds(a,sigma,r){
  const W=Q(11,10),t=mul(two,r),Z=add(W,t),D=sub(Q(1,2),a.h),A=add(Q(1,2),a.h);
  const Hreal=add(add(mul(Q(4),pow(W,3)),mul(a.j,pow(W,2))),add(mul(sub(Q(9,2),a.h),W),a.j));
  const Hd=mul(t,add(add(mul(Q(4),add(add(mul(Q(3),pow(W,2)),mul(Q(3),mul(W,t))),pow(t,2))),mul(a.j,add(mul(two,W),t))),sub(Q(9,2),a.h)));
  const Hup=add(Hreal,Hd),qdev=mul(Hd,add(mul(two,Hreal),Hd)),s2=pow(sigma,2),qlo=sub(s2,qdev);
  const fdev=mul(t,add(mul(two,W),t)),flo=sub(one,fdev),Llo=sub(sub(one,mul(mul(two,a.h),pow(W,2))),mul(mul(two,a.h),fdev));
  if(!positive(qlo)||!positive(flo)||!positive(Llo)||cmp(qdev,div(s2,Q(4)))>0)return null;
  const Lup=add(one,mul(mul(two,a.h),pow(Z,2))),d=add(one,pow(Z,2)),U=add(mul(Q(4),Z),a.j),P=div(a.K,pow(flo,2)),Pd=div(mul(mul(Q(4),a.K),Z),pow(flo,3));
  const w=add(add(one,mul(Q(4),d)),mul(mul(mul(two,D),Z),U));
  const gradient=div(mul(Lup,Hup),qlo),chi=min(div(pow(Hup,2),qlo),add(one,div(qdev,qlo)));
  const zstar=add(add(mul(mul(A,add(one,mul(mul(two,Z),U))),U),mul(Q(4),Hup)),add(mul(d,Pd),mul(mul(mul(Q(4),A),Z),P)));
  const fields={one,eta:Z,d,inverseL:div(one,Llo),uStar:U,uStarEta:Q(4),wStar:w,hStar:Hup,normalizedGradient:gradient,zStar:zstar};
  return {fields,chi,zOverL:div(zstar,Llo),phase:ceil(mul(Z,gradient)),qdev,qlo,s2,Llo,flo,Hd,Z,outerRadius:t};
}
function tubeCertificate(a,sigma,budget){
  let r=Q(1,64),bounds=null;for(let i=0;i<256;i++){budget.tick(50);bounds=complexBounds(a,sigma,r);if(bounds)break;r=div(r,two);}
  if(!bounds)throw new ComputeError('PRECISION_REQUIRED','Cannot enclose a nonvanishing common complex tube within the supported radius budget');
  const epsilon=mul(r,a.ratio),loss=div(add(one,a.ratio),pow(sub(one,a.ratio),3));
  const norms=Object.fromEntries(Object.entries(bounds.fields).map(([k,v])=>[k,ceil(mul(v,loss))]));
  return {r,epsilon,loss,norms,chiNorm:ceil(mul(bounds.chi,loss)),bounds,
    record:{realCoefficientWindow:['-11/10','11/10'],complexDomain:'convex open tube about the real coefficient window; all radius-r Cauchy circles lie in its compact interior',outerTubeRadius:qs(bounds.outerRadius),cauchyRadius:qs(r),coefficientRadius:qs(epsilon),radiusRatio:qs(a.ratio),radiusLoss:qs(loss),radiusLossIdentity:'sum_(m>=0) (m+1)^2 q^m=(1+q)/(1-q)^3',denominatorLowerBounds:{'1+z^2':qs(bounds.flo),'L(z)':qs(bounds.Llo),'H(z)^2+sigma^2':qs(bounds.qlo)},denominatorPerturbation:qs(bounds.qdev),sigmaSquared:qs(bounds.s2),complexSuprema:Object.fromEntries(Object.entries(bounds.fields).map(([k,v])=>[k,qs(v)])),coefficientNormUpper:Object.fromEntries(Object.entries(norms).map(([k,v])=>[k,String(v)])),chiComplexSupremum:qs(bounds.chi),chiNormUpper:String(ceil(mul(bounds.chi,loss))),phaseRealPartUpper:String(bounds.phase),allEtaDerivativeOrders:true,jetConvention:'weight uses actual eta derivatives; Cauchy estimates include m!, not just Taylor coefficients'}};
}

function sqrtCeil(n){if(n<0n)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Negative square root');if(n<2n)return n;let x=1n<<BigInt(Math.ceil(n.toString(2).length/2));for(;;){const y=(x+n/x)/2n;if(y>=x)return x*x===n?x:x+1n;x=y;}}
const divUp=(n,d)=>(n+d-1n)/d;
function positiveSeries(K,bits,weighted,budget){
  const cut=Number(2n*sqrtCeil(ceil(K))+32n);if(!Number.isSafeInteger(cut)||cut>10000)throw new ComputeError('RESOURCE_LIMIT','Factorial majorant cutoff exceeds 10000');
  const scale=1n<<BigInt(bits);let lo=scale,hi=scale,slo=0n,shi=0n;
  for(let n=0;n<=cut;n++){
    budget.tick(20);const w=weighted?BigInt((n+1)**2):1n;slo+=lo*w;shi+=hi*w;
    const den=K.d*BigInt((n+1)*(n+2));lo=lo*K.n/den;hi=divUp(hi*K.n,den);
  }
  const weightNext=weighted?BigInt((cut+2)**2):1n,nextUpper=hi*weightNext;
  const ratio=weighted?div(mul(K,Q(cut+3)),Q(BigInt(cut+2)**3n)):div(K,Q((cut+2)*(cut+3)));
  if(cmp(ratio,one)>=0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Factorial tail ratio does not contract');
  const tail=divUp(nextUpper*ratio.d,ratio.d-ratio.n),upper=shi+tail,B=divUp(upper,scale);
  return {bound:B,record:{K:qs(K),weightedBy:weighted?'(n+1)^2':'1',termsThrough:cut,scaleBits:bits,scale:String(scale),partialSumLowerScaled:String(slo),partialSumUpperScaled:String(shi),nextTermUpperScaled:String(nextUpper),tailRatioUpper:qs(ratio),tailUpperScaled:String(tail),totalUpperScaled:String(upper),integerUpper:String(B),method:'Every positive recurrence step is rounded down/up with exact integer division; the omitted infinite tail is bounded by next/(1-q).'}};
}
function controlled(a,tube,S,center,budget){
  const ce=q=>ceil(q),R=center+1n,nn=tube.norms,e=tube.epsilon;
  const O={product:64n,average:1n,primitive:80n,parameterPrimitive:ce(div(Q(80),e)),mulY:80n,j1:80n,j2:80n,param1:ce(div(Q(5120),e)),param2:ce(div(Q(5120),e)),dot1:5120n,dot2:5120n,mixed1:ce(div(Q(5120),e)),mixed2:ce(div(Q(5120),e))};
  const C=b=>({b,l:0n}),sum=(x,y)=>({b:x.b+y.b,l:x.l+y.l}),lin=(op,x)=>({b:op*x.b,l:op*x.l}),bil=(op,x,y)=>({b:op*x.b*y.b,l:op*(x.l*y.b+x.b*y.l)}),m=(x,y)=>bil(O.product,x,y),sc=(q,x)=>lin(ce(mag(q)),x);
  // Positive upper fields reproduce Controlled.add/sub, linear, bilinear, pair.
  const d=Object.fromEntries(Object.entries(nn).map(([k,v])=>[k,C(v)])),phi={b:R,l:1n},u={b:R,l:1n},bu=lin(O.average,u),A=add(Q(1,2),a.h),D=sub(Q(1,2),a.h);
  const angLinear=sum(sum(d.wStar,sc(a.h,d.one)),sc(mul(two,a.h),m(d.eta,d.uStar))),angQuad=m(d.d,d.normalizedGradient),avg=sc(mul(two,D),d.eta),slow=sc(mul(two,a.h),d.eta),axLinear=sum(sum(sc(A,d.one),sc(mul(Q(4),A),m(d.eta,d.uStar))),m(d.d,d.uStarEta)),axQuad=sc(mul(two,A),d.eta);
  const lin1=sum(sum(lin(O.j2,m(angLinear,phi)),bil(O.dot2,d.wStar,phi)),bil(O.param2,phi,d.hStar));
  const quad1=lin(O.j2,m(m(angQuad,u),phi));
  const slow1=sum(sum(sum(sum(lin(O.j2,m(sum(m(avg,bu),m(slow,u)),phi)),bil(O.param2,bu,m(d.d,phi))),bil(O.dot2,m(avg,bu),phi)),m(d.d,bil(O.mixed2,bu,phi))),bil(O.param2,phi,m(d.d,u)));
  const lin2=sum(sum(lin(O.j1,m(axLinear,u)),bil(O.dot1,d.wStar,u)),bil(O.param1,u,d.hStar));
  const slow2=sum(sum(sum(lin(O.j1,m(axQuad,m(u,u))),bil(O.dot1,m(avg,bu),u)),m(d.d,bil(O.mixed1,bu,u))),bil(O.param1,u,m(d.d,u)));
  const amp=C(ceil(tube.loss)),source=m(m(amp,amp),m(phi,phi));
  const pressure=lin(O.j1,sum(sum(m(sc(mul(Q(4),A),d.eta),lin(O.primitive,source)),m(d.d,lin(O.parameterPrimitive,source))),m(sc(two,d.eta),lin(O.mulY,source))));
  const first=lin(S,m(d.inverseL,sum(sum(lin1,quad1),slow1))),second=m(d.inverseL,sum(sum(lin2,slow2),pressure)),out=sum(first,second);
  budget.tick(500);if(out.b.toString().length>10000||out.l.toString().length>10000)throw new ComputeError('PRECISION_REQUIRED','Bound certificate exceeds the supported digit budget');
  return {B:out.b,L:out.l,R,record:{ballRadius:'1',centerNormUpper:String(center),argumentNormUpper:String(R),amplitudeNormUpper:String(ceil(tube.loss)),operatorNormUpper:Object.fromEntries(Object.entries(O).map(([k,v])=>[k,String(v)])),remainderBound:String(out.b),remainderLipschitz:String(out.l),angularComponent:{bound:String(first.b),lip:String(first.l)},axialComponent:{bound:String(second.b),lip:String(second.l)},construction:'Every term of AxisContraction.controlledRemainder is included. Subtraction uses a triangle upper bound; |1/Lambda|<=1. Product norm on the pair is bounded by the sum of component upper bounds.',quantifiers:'All elements x,y in the infinite compatible coefficient space with ||x||,||y||<=argumentNormUpper, and every radially constant normalized amplitude of norm at most amplitudeNormUpper.'}};
}
function factorial(n){let a=1n;for(let i=2;i<=n;i++)a*=BigInt(i);return a;}
function choose(n,k){if(k>n)return 0n;k=Math.min(k,n-k);let a=1n;for(let i=1;i<=k;i++)a=a*BigInt(n-k+i)/BigInt(i);return a;}
function tailBound(M,epsilon,Y,N,k,m){
  if(!positive(Y))return z;
  const n=N+1,q=div(Y,Q(20));
  const coeff=Q(factorial(m)*choose(n+m,m)*factorial(n)/factorial(n-k),BigInt((m+1)**2*(n+1)**2));
  const first=mul(mul(mul(M,div(one,pow(epsilon,m))),coeff),div(pow(q,n),pow(Y,k)));
  const ratio=mul(q,Q(n+1+m,n+1-k));
  if(cmp(ratio,one)>=0)throw new ComputeError('PRECISION_REQUIRED','Tail cutoff is too small for the requested derivative/radius');
  return div(first,sub(one,ratio));
}
function comparisonBox(x,N=32){
  let t=one,s=one;for(let n=1;n<=N;n++){t=div(mul(neg(div(x,two)),t),Q(n*(n+1)));s=add(s,t);}
  const next=mag(div(mul(div(x,two),t),Q((N+1)*(N+2)))),ratio=div(x,Q(2*(N+2)*(N+3))),tail=div(next,sub(one,ratio));return [sub(s,tail),add(s,tail)];
}
function chiAt(a,sigma,eta){const H=realData(a,box(eta)).H[0];return div(pow(H,2),add(pow(H,2),pow(sigma,2)));}

function certifyAxis(input={},budget=makeBudget()){
  try{
    budget.tick();const a=normalize(input);if(a.samples>budget.maxPoints)throw new ComputeError('RESOURCE_LIMIT','Visualization sample count exceeds maxPoints');
    const cut=cutoffCertificate(a,budget),tube=tubeCertificate(a,cut.sigma,budget);
    const resolvent=positiveSeries(Q(2560n*tube.chiNorm),a.bits,false,budget),phiRef=positiveSeries(mul(Q(10),tube.bounds.chi),a.bits,true,budget);
    const phiNorm=ceil(mul(tube.loss,Q(phiRef.bound))),uNorm=40n*ceil(mul(tube.loss,tube.bounds.zOverL)),center=phiNorm>uNorm?phiNorm:uNorm;
    const b=controlled(a,tube,resolvent.bound,center,budget),threshold=1n+b.B+b.L,positiveThreshold=100n*b.B,base=threshold>positiveThreshold?threshold:positiveThreshold,Lambda=base*BigInt(a.multiplier);
    const lambda=Q(Lambda),normError=Q(b.B,2n*Lambda),lip=Q(b.L,2n*Lambda),logC=Lambda*tube.bounds.phase+1n;
    const evaluationFactor=div(one,sub(one,div(Q(41,10),Q(20)))),uniformError=mul(normError,evaluationFactor),positiveLower=sub(Q(305719,1152000),uniformError);
    if(cmp(lip,Q(1,2))>0||cmp(normError,one)>0||cmp(positiveLower,Q(1,4))<=0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Derived finite scalar gate did not pass');
    const totalNorm=add(Q(center),normError),tails=[],points=[],lowerLine=[],upperLine=[],chi=chiAt(a,cut.sigma,a.eta);
    for(let i=0;i<a.samples;i++){
      budget.tick(200);const Y=mul(a.Y,Q(i,a.samples-1)),tail=tailBound(totalNorm,tube.epsilon,Y,a.N,0,0),mixed=tailBound(totalNorm,tube.epsilon,Y,a.N,a.kr,a.ke),comp=comparisonBox(mul(Y,chi)),err=div(normError,sub(one,div(Y,Q(20)))),enclosure=[sub(comp[0],err),add(comp[1],err)],yc=asNumber(Y),lo=asNumber(enclosure[0]),hi=asNumber(enclosure[1]),mid=(lo+hi)/2;
      tails.push({Y:qs(Y),X:qs(div(Y,lambda)),truncationDegree:a.N,phiTailUpper:qs(tail),mixedDerivative:{radial:a.kr,eta:a.ke,upper:qs(mixed)},normalizedProfileEnclosure:ibox(enclosure),comparisonEnclosure:ibox(comp),nonlinearDeviationUpper:qs(err)});
      points.push({pos:[yc,mid,Math.max(-320,log10q(tail)??-320)],value:mid,valueInterval:{lower:lo,upper:hi},label:`Y=${yc.toPrecision(4)}; Phi in [${lo.toPrecision(7)}, ${hi.toPrecision(7)}]; log10 tail bound`});lowerLine.push([yc,lo,0]);upperLine.push([yc,hi,0]);
    }
    const record={
      schema:'MathScope.Navier.AxisBoundCertificate/1',status:'VERIFIED_LOCAL_BOUND_CERTIFICATE',evidenceGrade:'EXACT_BOUND_CERTIFICATE_WITH_THEOREM_REFERENCE',certificateScope:'unique nonlinear Appendix-B axis fixed point for the explicitly defined rational pressure datum',
      inputModel:{pressure:{family:'rational',K:qs(a.K),formula:'P(eta)=-K/(1+eta^2)^2',completedOutgoingPressure:false},h:qs(a.h),j0:qs(a.j),sampleEta:qs(a.eta),UStar:'4*eta+j0',phiStar:'exp(Lambda*integral_0^eta zetaStar)',normalizedAmplitude:'g=exp(Lambda*phase-logC)',source:'Explicit analytic datum satisfying the pressure sign/smoothness hypotheses; equality with the original outer schedule is neither assumed nor established.'},
      selectedParameters:{h:qs(a.h),j0:qs(a.j),sigmaStar:qs(cut.sigma),deltaStar:qs(cut.delta),Lambda:String(Lambda),lambdaMode:'computed-threshold',lambdaMultiplier:a.multiplier,logC:String(logC),C:{kind:'EXACT_POSITIVE_EXPONENTIAL',log: String(logC)},X0:qs(div(Q(4),lambda)),XMax:qs(div(Q(41,10),lambda)),coefficientRadius:qs(tube.epsilon)},
      cutoff:cut.record,complexInput:tube.record,resolvent:resolvent.record,
      reference:{phi0:'f0(Y*chi)',u0:'-Y*ZStar/(2*L)',phiNormUpper:String(phiNorm),uNormUpper:String(uNorm),phiSeriesNormMajorant:phiRef.record,phiNormProof:'Cauchy on chi(z)^n plus the exact B_rho weight; division by binom(n+m,m)>=1 and summation of all positive radial majorants bounds the supremum.',comparisonWholeInterval:{domain:['0','41/10'],lower:'305719/1152000',cubicLower:'1-z/4+z^2/48-z^3/1152',proof:'The alternating remainder after the cubic is nonnegative. The cubic decreases on the whole interval, so its exact endpoint value bounds every z. This bound is not inferred from sampled values.',derivativeUpper:'-19/240',derivativeProof:'The derivative alternating terms decrease because their first magnitude ratio z/6<=41/60<1. Thus f0prime(z)<=-1/4+z/24<=-19/240<0; consequently f0(z)>=f0(41/10).'}},
      controlled:b.record,
      bounds:{contractionThreshold:String(threshold),positivityThreshold:String(positiveThreshold),selfMapDisplacementUpper:qi(normError),contractionLipschitzUpper:qi(lip),uniformPhiError:qi(uniformError),uniformPhiPositiveLower:qi(positiveLower),complexAmplitudeNormUpper:String(ceil(tube.loss)),phaseRealPartUpper:String(tube.bounds.phase),normalizationMargin:'1',allRadialCoefficients:true,allEtaDerivativeOrders:true,fullRealAxisRectangle:{Y:['0','41/10'],eta:['-1','1']},commonAnalyticEtaRadiusLower:qs(div(mul(tube.epsilon,sub(one,div(Q(5),Q(20)))),two))},
      tails:{solutionNormUpper:qs(totalNorm),degree:a.N,rows:tails,meaning:'These are bounds for the tail of the theorem-defined unique infinite coefficient sequence. They do not certify the rounding error or identity of a separately computed finite eta jet.',formula:'M*m!*rho^(-m)/(m+1)^2 * sum_(n>N) binom(n+m,m)*n!/(n-k)! * Y^(n-k)/(20^n*(n+1)^2)',geometricRatioUpper:'For n>=N+1: (Y/20)*(N+2+m)/(N+2-k); the omitted square factor is <=1.'},
      gates:{exactRationalArithmetic:true,pressureAnalyticContract:true,wholeEtaCutoffCover:true,complexDenominatorsSeparated:true,normalizedComplexAmplitude:true,invariantBall:true,lipschitzBelowOne:true,uniformPositivePhi:true,infiniteCoefficientTail:true,existingFiniteJetLinked:false,completedOuterPressureLinked:false,fullOriginalParameterOrder:false,globalWitness:false,fullProfileCertified:false,fullCertificateKernelChecked:false},
      proofBoundary:{grade:'THEOREM_REFERENCE plus exact executable bound certificates',formalPass:false,originalTheorems:'Exact exported statements are listed in sources; a static or separately audited import is not a kernel proof of every generated numerical/analytic premise.',conditionalOn:['The published original coefficient-space/operator/bridge theorems applied to the specified mathematical functions.','Correspondence of this bound propagation and analytic-input producer with those definitions; the full generated analytic premise bundle has not been exported as a Lean proof.'],notInferred:['Equality of the rational pressure with the completed original outer profile','Identity or tail error of the existing IEEE754 eta-jet arrays','B.3 endpoint shear margin, B.5 continuation, A.7/A.8/A.11 moment completion','N3 overall PASS or a global Navier-Stokes solution']},
      limitations:['The automatic bounds are conservative; selected Lambda and logC may be enormous. C is represented by its exact logarithm, not an overflowed float.','A numerical evaluator that underflows exp(Lambda*phase-logC) to zero does not preserve the strict positivity certificate.','Only the declared rational analytic pressure family has a checked input producer. Caller-supplied norm/tail/pressure-truth claims are rejected.'],
      visualization:{points,lines:[{points:lowerLine},{points:upperLine}],arrows:[],axes:['Y=Lambda X','normalized Phi enclosure center','log10 absolute radial-tail upper bound'],description:'Exact bound certificate for the unique local analytic profile; approximate plot of interval centers and tail bounds.',coordinateMeaning:'The first axis is the scaled radius Y; X=Y/Lambda is retained exactly in each row. The second axis is a certified enclosure center, not the old finite eta-jet value. The third is a nonphysical log bound; zero tails at Y=0 are displayed at -320.',lostInformation:['Full coefficient functions and phase variation across all eta are not rendered.','The completed outgoing pressure, global witness and physical velocity amplitude are not represented.','Plot floating-point coordinates do not replace the exact rational certificate fields.']},sources:axisCertificateSources,execution:budget.snapshot()
    };
    return record;
  }catch(e){return {schema:'MathScope.Navier.AxisBoundCertificate/1',status:e.code??'COMPUTATION_ERROR',message:e.message,detail:e.detail??{},evidenceGrade:'NO_CERTIFICATE',gates:{globalWitness:false,fullProfileCertified:false,fullCertificateKernelChecked:false},execution:budget.snapshot?.()??null};}
}

function axisExampleInput(){return {pressure:{family:'rational',K:'10'},h:'1/200',j0:'3/100',sigmaMode:'computed-cutoff',lambdaMode:'computed-threshold',lambdaMultiplier:2,tailDegree:24,sampleEta:'1/5',sampleCount:17};}
function getAxisExamples(){return [
  {id:'ns-axis-exact-bounds',label:'실제 Bρ 국소 수렴·양성·tail 상계',request:{kind:'ns.axis-certificate',input:axisExampleInput()}},
  {id:'ns-axis-untrusted-pressure',label:'미검증 pressure/norm 입력 거부',request:{kind:'ns.axis-certificate',input:{pressure:{family:'external',K:'10'}}}}
];}

return {axisCertificateSources,validateAxisInput,certifyAxis,axisExampleInput,getAxisExamples};
})();
const __m1_27 = (()=>{
const {
  ComputeError, makeBudget, boundedInteger, finiteNumber, positive,
  point, interval, iadd, isub, imul, idiv, ipow, ipower, iexp,
  nextDown, nextUp, midpoint, maxabs, ball,
} = __m1_16;
const {smoothStep} = __m1_23;
const TWO_PI=2*Math.PI;
const SOURCE={attachment:'01-navier-stokes.pdf',sha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',pages:[38,158,159,160,161],equations:['4.35','C.4','C.5','C.6','C.9','C.10','C.11','C.12']};
const scalar=v=>point(v);
const safe=value=>{
  if(typeof value==='number'){
    if(!Number.isFinite(value))throw new ComputeError('PRECISION_REQUIRED','Nonfinite C.1 result');
    return Number.isInteger(value)&&!Number.isSafeInteger(value)?{kind:'FLOAT64',value:value.toExponential(17),precisionBits:53}:Object.is(value,-0)?0:value;
  }
  if(Array.isArray(value))return value.map(safe);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined&&typeof v!=='function').map(([k,v])=>[k,safe(v)]));
  return value;
};
function budgetFor(budget){return budget?.tick?budget:makeBudget(budget??{});}
function addPositiveTail(sum,next,ratio){
  if(!(ratio[1]<1))return null;
  const tail=idiv(next,isub(point(1),ratio));
  return {box:[sum[0],nextUp(sum[1]+tail[1])],tailUpper:tail[1]};
}

/** Me(z)=I0(z), bounded by its positive entire series, not a quadrature fit. */
function meanExponentialCertificate(z,budgetInput={}){
  const budget=budgetFor(budgetInput),raw=Array.isArray(z)?interval(...z):point(finiteNumber(z,'z'));
  const abs=raw[0]<=0&&raw[1]>=0?[0,maxabs(raw)]:[Math.min(Math.abs(raw[0]),Math.abs(raw[1])),maxabs(raw)];
  if(abs[1]>300)throw new ComputeError('PRECISION_REQUIRED','C.1 positive-series evaluator supports |z|<=300 without exponent rescaling',{z:raw});
  const q=idiv(ipow(abs,2),point(4));let term=point(1),sum=point(1);
  if(abs[1]===0)return {value:point(1),midpoint:1,tailUpper:0,terms:1,method:'Positive I0 series with a geometric tail'};
  for(let k=0;k<2000;k++){
    budget.tick(12);
    const next=idiv(imul(term,q),point((k+1)**2));
    const ratio=idiv(q,point((k+2)**2));
    const bound=addPositiveTail(sum,next,ratio);
    if(bound&&bound.tailUpper<=2e-15*Math.max(1,sum[0]))return {...bound,value:bound.box,midpoint:midpoint(bound.box),terms:k+1,method:'Positive I0 series; outward arithmetic and positive geometric remainder'};
    term=next;sum=iadd(sum,term);
  }
  throw new ComputeError('BUDGET_EXCEEDED','I0 positive series did not reach its tail criterion');
}

/** Stable identity, also at p=0:
 * V=d0^2 mu^2 B(mu p)/I0(mu p)^2,
 * B(z)=sum_{n>=1}(1-binomial(2n,n)/4^n) z^(2n-2)/(n!)^2.
 */
function varianceCertificate(mu,p,d0,budgetInput={}){
  const budget=budgetFor(budgetInput);mu=finiteNumber(mu,'mu');p=finiteNumber(p,'p2');d0=positive(d0,'d0');
  if(mu<0)throw new ComputeError('INVALID_INPUT','mu must be nonnegative');
  if(mu===0)return {value:point(0),midpoint:0,terms:1,tailUpper:0};
  if(p===0){const value=idiv(imul(ipow(point(d0),2),ipow(point(mu),2)),point(2));return {value,midpoint:midpoint(value),terms:1,tailUpper:0,removableBranch:true};}
  const z=imul(point(mu),point(p)),M=meanExponentialCertificate(z,budget),z2=ipow(z,2);
  let n=1,central=point(.5),term=point(1),sum=point(.5),B=null,tailUpper=0;
  for(;n<2000;n++){
    budget.tick(16);
    const nextTerm=idiv(imul(term,z2),point((n+1)**2));
    const ratio=idiv(z2,point((n+2)**2));
    // 0 < 1-binomial(2n,n)/4^n < 1, so the raw next term bounds it.
    const bound=addPositiveTail(sum,nextTerm,ratio);
    if(bound&&bound.tailUpper<=2e-15*Math.max(1,sum[0])){B=bound.box;tailUpper=bound.tailUpper;break;}
    central=imul(central,idiv(point(2*n+1),point(2*n+2)));
    term=nextTerm;sum=iadd(sum,imul(isub(point(1),central),term));
  }
  if(!B)throw new ComputeError('BUDGET_EXCEEDED','Variance positive series did not reach its tail criterion');
  const value=idiv(imul(imul(ipow(point(d0),2),ipow(point(mu),2)),B),ipow(M.value,2));
  return {value,midpoint:midpoint(value),terms:n,tailUpper,removableBranch:false,method:'Cancellation-free positive variance series with geometric tail'};
}

function coneGaps({a,bs,ps}){
  const t=-bs/a,v=a+bs*bs/a,c=ps[0]+ps[1]*t,j=ps[1]-ps[0]*t;
  return {t,v,c,j,gaps:[a,v-2,c-v,2*(c-v)**2-(v-2)*j*j]};
}
function intervalGaps(a,bs,ps){
  const t=idiv([-bs[1],-bs[0]],a),v=iadd(a,idiv(ipow(bs,2),a));
  const c=iadd(ps[0],imul(ps[1],t)),j=isub(ps[1],imul(ps[0],t)),gap=isub(c,v);
  return [a,isub(v,point(2)),gap,isub(imul(point(2),ipow(gap,2)),imul(isub(v,point(2)),ipow(j,2)))];
}
function parseState(value,index=0){
  const a=positive(value.a,'a'),bs=finiteNumber(value.bs??0,'bs');
  if(!Array.isArray(value.ps)||value.ps.length!==2)throw new ComputeError('INVALID_INPUT','ps must be [p1,p2]');
  const ps=value.ps.map((x,i)=>finiteNumber(x,`ps[${i}]`)),g=coneGaps({a,bs,ps});
  const tBox=idiv(point(-bs),point(a)),vBox=iadd(point(a),idiv(ipow(point(bs),2),point(a))),cBox=iadd(point(ps[0]),imul(point(ps[1]),tBox)),jBox=isub(point(ps[1]),imul(point(ps[0]),tBox));
  const gap=isub(cBox,vBox),vMinusTwo=isub(vBox,point(2));
  const relaxedQuadratic=isub(imul(point(2),ipow(gap,2)),imul([Math.max(0,vMinusTwo[0]),Math.max(0,vMinusTwo[1])],ipow(jBox,2)));
  if(!(cBox[0]>2&&gap[0]>0&&relaxedQuadratic[0]>0))throw new ComputeError('INVALID_INPUT','Input strict relaxed cone condition is not certified',{index,...g,cBox,gap,relaxedQuadratic});
  if(value.boundary&&vBox[0]<=2)throw new ComputeError('INVALID_INPUT','A claimed unchanged boundary collar must already have certified v>2',{index});
  return {a,bs,ps,...g,tBox,vBox,cBox,jBox,index,X:value.X===undefined?index+1:positive(value.X,'X'),eta:finiteNumber(value.eta??0,'eta'),boundary:!!value.boundary};
}
function tRange(state,mu,d0,budget){
  const zBox=imul(point(mu),point(state.ps[1])),z=maxabs(zBox);
  if(z<1e-3){
    // |I1(z)/I0(z)|<=|z|/2 follows term by term from the positive series.
    // The integral identity for the removable quotient then avoids 1/p loss.
    const variation=imul(imul(point(d0),point(mu)),imul(iexp(point(z)),iadd(point(1),idiv(point(z),point(2)))))[1];
    return iadd(state.tBox,[-variation,variation]);
  }
  const M=meanExponentialCertificate(zBox,budget);
  const normalized=idiv([iexp(point(-z))[0],iexp(point(z))[1]],M.value);
  return iadd(state.tBox,idiv(imul(point(d0),isub(normalized,point(1))),point(state.ps[1])));
}
function upperRootGapLower(PcLower,Jmax){
  const A=isub(point(PcLower),point(2)),j=point(Jmax),j2=ipow(j,2);
  const denominator=iadd(iadd(imul(point(4),A),j2),imul(j,ipower(iadd(j2,imul(point(8),A)),.5)));
  return idiv(imul(point(4),ipow(A,2)),denominator)[0];
}
function solveMu(state,targetInput,d0,upper,budget){
  const targetBox=Array.isArray(targetInput)?targetInput:point(targetInput),target=midpoint(targetBox);
  if(targetBox[1]===0)return {lower:0,upper:0,midpoint:0,target:0,targetInterval:targetBox,valueAtLower:[0,0],valueAtUpper:[0,0],exactZero:true};
  let lo=0,hi=upper,loValue=point(0),hiValue=varianceCertificate(hi,state.ps[1],d0,budget).value;
  if(!(hiValue[0]>targetBox[1]))throw new ComputeError('INVALID_INPUT','mu upper bracket does not exceed target variance');
  let unresolvedWidth=false;
  for(let k=0;k<90;k++){
    budget.tick();const mid=lo+(hi-lo)/2,v=varianceCertificate(mid,state.ps[1],d0,budget).value;
    if(v[1]<targetBox[0]){lo=mid;loValue=v;}
    else if(v[0]>targetBox[1]){hi=mid;hiValue=v;}
    else {unresolvedWidth=true;break;}
    if(hi-lo<2e-12*Math.max(1,mid))break;
  }
  return {lower:lo,upper:hi,midpoint:lo+(hi-lo)/2,target,targetInterval:targetBox,valueAtLower:loValue,valueAtUpper:hiValue,
    bracketCertified:loValue[1]<=targetBox[0]&&hiValue[0]>=targetBox[1],
    uniquenessBasis:'Strict monotonicity (C.6), including the p2=0 removable branch; source theorem reference, not a new Lean run',roundoffStoppedRefinement:unresolvedWidth};
}
function stepBox(box){
  const one=x=>{
    if(x<=0)return point(0);if(x>=1)return point(1);
    const A=iexp(idiv(point(-1),ipow(point(x),2))),B=iexp(idiv(point(-1),ipow(isub(point(1),point(x)),2)));
    return idiv(A,iadd(A,B));
  };
  return [Math.max(0,one(box[0])[0]),Math.min(1,one(box[1])[1])];
}
function stateEvaluator(state,mu,d0,v,budget){
  const p=state.ps[1],z=mu*p,M=meanExponentialCertificate(z,budget).midpoint;
  // Keep I0(z)-1 separate from its unit constant when computing log I0.
  // This is the drawing evaluator; the root/certificates use the positive
  // outward series above and do not depend on this floating-point sum.
  let logM=Math.log(M);
  if(Math.abs(z)<1e-3){
    const q=z*z/4;let term=q,tail=q;
    for(let n=2;n<=12;n++){term*=q/(n*n);tail+=term;}
    logM=Math.log1p(tail);
  }
  return theta=>{
    let t;
    if(p===0)t=state.t+d0*mu*Math.sin(theta);
    else t=state.t+d0*Math.expm1(z*Math.sin(theta)-logM)/p;
    const aL=v/(1+t*t),bL=-aL*t,dphi=state.a*(1+t*t)/(TWO_PI*v);
    return {theta,t,aL,bL,dphi,...coneGaps({a:aL,bs:bL,ps:state.ps})};
  };
}
function makeSamples(state,root,d0,v,sampleCount,budget){
  const evalTheta=stateEvaluator(state,root.midpoint,d0,v,budget);
  const n=Math.max(512,sampleCount*4),step=TWO_PI/n,thetaRows=[],cumPhi=[0],cumT=[0];
  for(let i=0;i<=n;i++){
    budget.tick(12);thetaRows.push(evalTheta(i*step));
    if(i){cumPhi.push(cumPhi[i-1]+step*(thetaRows[i-1].dphi+thetaRows[i].dphi)/2);cumT.push(cumT[i-1]+step*(thetaRows[i-1].t+thetaRows[i].t)/2);}
  }
  const rawPeriod=cumPhi[n],samples=[];let j=0;
  for(let i=0;i<=sampleCount;i++){
    const phase=i/sampleCount,target=phase*rawPeriod;
    while(j<n-1&&cumPhi[j+1]<target)j++;
    const f=(target-cumPhi[j])/(cumPhi[j+1]-cumPhi[j]),theta=(j+f)*step,row=evalTheta(theta);
    const integralT=cumT[j]+f*(cumT[j+1]-cumT[j]);
    const A=.5*state.a*(target-theta/TWO_PI);
    const BOverE=-state.a*integralT/(2*TWO_PI)-state.bs*target/2;
    samples.push({phase,theta,t:row.t,aL:row.aL,bL:row.bL,gaps:row.gaps,A,BOverE});
  }
  let meanA=0,meanB=0,meanPrimitiveA=0,meanPrimitiveB=0;
  for(let i=0;i<sampleCount;i++){
    meanA+=(samples[i].aL+samples[i+1].aL)/(2*sampleCount);
    meanB+=(samples[i].bL+samples[i+1].bL)/(2*sampleCount);
    meanPrimitiveA+=(samples[i].A+samples[i+1].A)/(2*sampleCount);
    meanPrimitiveB+=(samples[i].BOverE+samples[i+1].BOverE)/(2*sampleCount);
  }
  const primitiveClosure={A:samples.at(-1).A-samples[0].A,BOverE:samples.at(-1).BOverE-samples[0].BOverE};
  for(const sample of samples){sample.A-=meanPrimitiveA;sample.BOverE-=meanPrimitiveB;}
  const wrongUniformThetaMean={a:thetaRows.slice(0,n).reduce((s,r)=>s+r.aL,0)/n,bs:thetaRows.slice(0,n).reduce((s,r)=>s+r.bL,0)/n};
  return {samples,diagnostics:{rawLiftPeriod:rawPeriod,rawLiftPeriodError:rawPeriod-1,
    numericPhaseMean:{a:meanA,bs:meanB},numericMeanError:{a:meanA-state.a,bs:meanB-state.bs},
    thetaMeanT:cumT[n]/TWO_PI,thetaMeanTError:cumT[n]/TWO_PI-state.t,
    wrongUniformThetaMean,primitiveClosure,numericLiftNormalizedForSampling:true,
    quadratureNodes:n+1,phaseSamples:sampleCount+1,
    numericalRealizationCertified:false,
    limitation:'Displayed inverse lift and zero-mean primitives use finite quadrature/interpolation. Exact means apply to the source formula at the unique variance root; these arrays retain their measured defects.'}};
}

function validateLoopInput(input={}){
  try{
    if(!input||typeof input!=='object'||Array.isArray(input))throw new ComputeError('INVALID_INPUT','Loop input must be an object');
    const raw=input.points??[{a:input.a??.8,bs:input.bs??0,ps:input.ps??[5,0],X:input.X??1,eta:input.eta??0,boundary:input.boundary??false}];
    if(!Array.isArray(raw)||!raw.length||raw.length>32)throw new ComputeError('INVALID_INPUT','points must contain 1..32 explicit cone states');
    const states=raw.map(parseState),phaseSamples=boundedInteger(input.phaseSamples??256,'phaseSamples',32,2048);
    return {valid:true,states,phaseSamples};
  }catch(error){return {valid:false,status:error.code??'INVALID_INPUT',message:error.message,detail:error.detail??{}};}
}

/** Literal C.1 construction at supplied fixed cone states; never a full-profile witness. */
function runAdmissibleLoop(input={},budgetInput={}){
  const budget=budgetFor(budgetInput),valid=validateLoopInput(input);
  if(!valid.valid)return safe({...valid,status:['PRECISION_REQUIRED','UNSUPPORTED'].includes(valid.status)?valid.status:'FAILED',domainStatus:valid.status,fullProfileCertified:false});
  try{
    const {states,phaseSamples}=valid;
    if(states.length*(phaseSamples+1)>budget.maxPoints)throw new ComputeError('BUDGET_EXCEEDED','Requested loop samples exceed the point budget',{requested:states.length*(phaseSamples+1),maxPoints:budget.maxPoints});
    const d0=Math.min(...states.map(s=>isub(s.cBox,point(2))[0]/4));
    const minA=Math.min(...states.map(s=>s.a)),varianceThreshold=idiv(point(3),point(minA))[1];
    // Starting below one can be essential when d0 is large. The source still
    // requires one common muMax for the complete finite family and 3/min a.
    let muMax=Math.min(1,Math.sqrt(8/minA)/d0);
    if(!(muMax>0&&Number.isFinite(muMax)))throw new ComputeError('PRECISION_REQUIRED','The C.7 initial variance scale is outside binary64 range');
    for(let attempts=0;;attempts++){
      if(attempts>30)throw new ComputeError('BUDGET_EXCEEDED','Could not bracket the finite C.7 variance');
      if(states.every(s=>varianceCertificate(muMax,s.ps[1],d0,budget).value[0]>varianceThreshold))break;
      muMax*=2;
    }
    let delta=Math.min(1,...states.map(s=>s.boundary?isub(s.vBox,point(2))[0]:1));
    const familyBounds=states.map(s=>{
      const t=tRange(s,muMax,d0,budget),PcLower=isub(s.cBox,point(d0))[0],Jmax=iadd(point(Math.abs(s.ps[1])),imul(point(Math.abs(s.ps[0])),point(maxabs(t))))[1];
      const gap=upperRootGapLower(PcLower,Jmax);delta=Math.min(delta,gap);
      return {t,PcLower,Jmax,upperRootGapLower:gap};
    });
    delta/=4;
    if(!(delta>1e-13))throw new ComputeError('PRECISION_REQUIRED','Certified C.8 slack is too small for this binary64 realization',{delta});
    const loops=states.map((state,index)=>{
      const zeta=1-smoothStep((state.v-(2+delta/8))/(delta/8));
      const rho=zeta===0?0:zeta*zeta*(2+delta/2-state.v),v=state.v+rho;
      const zetaBox=isub(point(1),stepBox(idiv(isub(state.vBox,iadd(point(2),point(delta/8))),point(delta/8))));
      const rawDifference=isub(iadd(point(2),point(delta/2)),state.vBox);
      let rhoBox=imul(ipow([Math.max(0,zetaBox[0]),Math.min(1,zetaBox[1])],2),[Math.max(0,rawDifference[0]),Math.max(0,rawDifference[1])]);
      rhoBox=[Math.max(0,rhoBox[0]),Math.max(0,rhoBox[1])];
      if(state.vBox[0]>=iadd(point(2),point(delta/4))[1])rhoBox=point(0);
      const certifiedZeroBranch=rhoBox[0]===0&&rhoBox[1]===0;
      const targetBox=certifiedZeroBranch?point(0):idiv(rhoBox,point(state.a));
      const root=solveMu(state,[Math.max(0,targetBox[0]),Math.max(0,targetBox[1])],d0,muMax,budget);
      let gapBounds;
      if(certifiedZeroBranch)gapBounds=intervalGaps(point(state.a),point(state.bs),state.ps.map(point));
      else{
        const f=familyBounds[index],tmax=maxabs(f.t),vmax=iadd(point(2),point(delta/2))[1],cgap=isub(point(f.PcLower),point(vmax));
        gapBounds=[idiv(point(2),iadd(point(1),ipow(point(tmax),2))),
          point(nextDown(Math.min(delta/8,delta/2))),cgap,
          isub(imul(point(2),ipow(cgap,2)),imul(point(vmax-2),ipow(point(f.Jmax),2)))];
      }
      const phaseMargin=Math.min(...gapBounds.map(x=>x[0])),computed=makeSamples(state,root,d0,v,phaseSamples,budget);
      return {input:{a:state.a,bs:state.bs,ps:state.ps,X:state.X,eta:state.eta,boundary:state.boundary},
        d0,muMax,delta,zeta,rho,v,muRoot:root,certifiedZeroBranch,
        phaseCertificate:{pass:phaseMargin>0&&!!(root.bracketCertified||root.exactZero),
          quantifier:'All phase values for this fixed supplied state and the exact unique root in muRoot; not all unsupplied X/eta states.',
          gapOrder:['aL','v-2','Pc-v','2(Pc-v)^2-(v-2)Jc^2'],gapLowerBounds:gapBounds.map(x=>x[0]),
          kappaLower:phaseMargin,method:'Positive-series interval root bracket and conservative algebraic bounds over the complete t range.',
          analyticBasis:'C.4-C.10 continuity/strict monotonicity and the source circle reparametrization; no new Lean kernel run.'},
        boundaryUnchanged:state.boundary?certifiedZeroBranch:null,...computed};
    });
    return safe({status:'PARTIAL',domainStatus:'SOURCE_C1_LOOPS_COMPUTED',sourceReferences:[SOURCE],
      inputContract:{family:'explicit-relaxed-cone-states',inputIsJSON:true,arbitraryCodeAllowed:false},
      construction:'Actual exponential-tilt ratio, prescribed variance root, and weighted circle reparametrization of Appendix C.1.',
      sharedParameters:{d0,muMax,delta},loops,
      certifiedConditions:[{id:'C1_PHASE_GAPS',pass:loops.every(l=>l.phaseCertificate.pass),scope:'Every phase of each supplied fixed cone state'},
        {id:'C3_MARKED_BOUNDARIES',pass:loops.every(l=>l.boundaryUnchanged!==false),scope:'Only the supplied states explicitly marked boundary'}],
      missingConditions:['Uniform certified input profile over the full radial/eta rectangle is not supplied by point arrays.',
        'Displayed inverse-lift/primitives have finite numerical errors, reported separately.',
        'C.12 derivatives in X/eta, actual post-modulation moments and the C.2 exact five-moment restoration are not certified here.'],
      fullProfileCertified:false,fullNavierStokesSolution:false,
      visualization:{points:loops.flatMap((l,i)=>l.samples.map(s=>({pos:[s.aL,-s.bL,s.phase],value:Math.min(...s.gaps),label:`C.1 loop ${i+1}, phase ${s.phase.toFixed(4)}`}))),
        lines:loops.map(l=>({points:l.samples.map(s=>[s.aL,-s.bL,s.phase])})),arrows:[],axes:['a_L','−b_L','loop phase φ'],
        description:'Actual C.1 exponential-tilt admissible shear loops after the prescribed-mean reparametrization.',
        coordinateMeaning:'Shear-state coordinates and auxiliary loop phase, not physical-space fluid velocity.',
        lostInformation:['No whole X/eta profile or post-modulation ps reconstruction is certified.','Finite display samples approximate an analytically defined periodic loop.']}});
  }catch(error){return safe({status:error.code==='RESOURCE_LIMIT'?'BUDGET_EXCEEDED':['CANCELLED','PRECISION_REQUIRED','BUDGET_EXCEEDED'].includes(error.code)?error.code:'FAILED',domainStatus:error.code??'COMPUTATION_ERROR',message:error.message,detail:error.detail??{},sourceReferences:[SOURCE],fullProfileCertified:false});}
}

function getLoopExamples(){return [
  {id:'ns-loop-zero-p2',label:'원문 C.1 · p₂=0의 제거 가능 분기',request:{kind:'ns.admissible-loop',input:{a:.8,bs:0,ps:[5,0],phaseSamples:256},budget:{maxOperations:3000000,maxPoints:2048}}},
  {id:'ns-loop-tilted',label:'원문 C.1 · 비영 p₂와 위상 재매개화',request:{kind:'ns.admissible-loop',input:{a:.9,bs:.12,ps:[5,.2],phaseSamples:256},budget:{maxOperations:3000000,maxPoints:2048}}},
];}

return {meanExponentialCertificate,varianceCertificate,coneGaps,validateLoopInput,runAdmissibleLoop,getLoopExamples};
})();
const __m1_28 = (()=>{
/**
 * Source outer construction, Appendix A.2--A.7 of the pinned 166-page paper.
 * Separate from the frozen v50 implementation. All computations are finite,
 * pointwise numerical evaluations. No whole-eta or paper-witness certificate is
 * issued. Very small nonzero corrections retain a signed logarithmic value.
 */
const {ComputeError, integrate, makeBudget, solveLinear} = __m1_16;
const ROOT = 'https://github.com/openai/NavierStokesAndEuler/tree/f9e8bc5b38b6e212696e8a30e3e91517af887bbd';
const OUTER_SOURCES = Object.freeze([
  {id:'A2',title:'Finite Time Blowup for Navier–Stokes',pages:[127,128],locator:'Lemma A.2, Corollary A.3; normalized quadratic moment maps',url:ROOT},
  {id:'A_SCHEDULE',title:'Finite Time Blowup for Navier–Stokes',pages:[129,130,131,132,133],locator:'A.5--A.23, Proposition A.4, Lemma A.5',url:ROOT},
  {id:'A_HEAT',title:'Finite Time Blowup for Navier–Stokes',pages:[138,139,140],locator:'A.32--A.43, Proposition A.7; three additive E bumps',url:ROOT},
  {id:'A_STRESS',title:'Finite Time Blowup for Navier–Stokes',pages:[140,141,142,143],locator:'Lemma A.8, Proposition A.10; conditional exterior stress recovery',url:ROOT}
]);

function plainJSON(value, path='input', depth=0) {
  if(depth>12) throw new ComputeError('INVALID_INPUT','JSON nesting exceeds 12',{path});
  if(value===null||typeof value==='string'||typeof value==='boolean') return;
  if(typeof value==='number') { if(!Number.isFinite(value)) throw new ComputeError('INVALID_INPUT','Finite numbers required',{path}); return; }
  if(Array.isArray(value)) { if(value.length>1024) throw new ComputeError('INVALID_INPUT','Array exceeds supported size',{path}); value.forEach((x,i)=>plainJSON(x,`${path}[${i}]`,depth+1)); return; }
  if(typeof value!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(value))) throw new ComputeError('INVALID_INPUT','Only plain JSON input is allowed',{path});
  for(const [k,v] of Object.entries(value)) plainJSON(v,`${path}.${k}`,depth+1);
}
function bounded(x,name,lo,hi,integer=false) {
  if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi||(integer&&!Number.isInteger(x))) throw new ComputeError('INVALID_INPUT',`${name} outside supported bounds`,{name,lo,hi,integer});
  return x;
}
const softplus=x=>x>0?x+Math.log1p(Math.exp(-x)):Math.log1p(Math.exp(x));
function sourceStep(x) {if(x<=0)return 0;if(x>=1)return 1;const a=-1/(x*x)+1/((1-x)**2);return a>=0?1/(1+Math.exp(-a)):Math.exp(a)/(1+Math.exp(a));}
function logStep(x) {if(x<=0)return -Infinity;if(x>=1)return 0;return -softplus(1/(x*x)-1/((1-x)**2));}
function logOneMinusStep(x) {if(x<=0)return 0;if(x>=1)return -Infinity;return -softplus(-1/(x*x)+1/((1-x)**2));}
function logStepPrime(x) {if(x<=0||x>=1)return -Infinity;return logStep(x)+logOneMinusStep(x)+Math.log(2/x**3+2/(1-x)**3);}
const sourceStepPrime=x=>Math.exp(logStepPrime(x));
const ZERO=()=>({sign:0,logAbs:-Infinity});
const sl=x=>x===0?ZERO():({sign:Math.sign(x),logAbs:Math.log(Math.abs(x))});
const signed=(sign,logAbs)=>sign===0||logAbs===-Infinity?ZERO():({sign:Math.sign(sign),logAbs});
function addSL(a,b) {
  if(!a.sign)return {...b};if(!b.sign)return {...a};
  if(a.logAbs<b.logAbs)return addSL(b,a);
  const d=b.logAbs-a.logAbs;
  if(a.sign===b.sign)return signed(a.sign,a.logAbs+Math.log1p(Math.exp(d)));
  if(d===0)return ZERO();
  return signed(a.sign,a.logAbs+Math.log(-Math.expm1(d)));
}
const negSL=a=>({...a,sign:-a.sign});
const mulSL=(a,b)=>!a.sign||!b.sign?ZERO():signed(a.sign*b.sign,a.logAbs+b.logAbs);
const scaleSL=(a,x)=>mulSL(a,sl(x));
const shiftSL=(a,x)=>a.sign?signed(a.sign,a.logAbs+x):ZERO();
const sumSL=xs=>xs.reduce(addSL,ZERO());
function packSL(a) {
  if(!a.sign)return {kind:'SIGNED_LOG',sign:0,logAbs:null,float64:0,zeroInComputedRepresentation:true,mathematicalZeroCertified:false};
  if(!Number.isFinite(a.logAbs))throw new ComputeError('PRECISION_REQUIRED','Nonfinite signed logarithmic result');
  const v=a.logAbs<Math.log(Number.MIN_VALUE)||a.logAbs>Math.log(Number.MAX_VALUE)?null:a.sign*Math.exp(a.logAbs);
  return {kind:'SIGNED_LOG',sign:a.sign,logAbs:a.logAbs,float64:v,underflowAvoided:v===null&&a.logAbs<0,overflowAvoided:v===null&&a.logAbs>0};
}
function asFloat(a) {return a.sign? a.sign*Math.exp(a.logAbs):0;}
const relativeSL=(a,scale)=>a.sign?a.sign*Math.exp(a.logAbs-scale):0;
function unpackSL(a) {return a.sign?signed(a.sign,a.logAbs):ZERO();}
function bump(y,center,width) {return sourceStepPrime((y-center)/width+.5)/width;}
function logBump(y,center,width) {return logStepPrime((y-center)/width+.5)-Math.log(width);}

function outerExampleInput() {
  return {parameters:{Md:1,logP:14,lambda:.0002,h:1e-8,logXR:20,Tf:64,co:.005},etas:[-.5,0,.5],samplesPerEta:48,pressureOrder:4,tolerance:2e-8,heatOrder:3};
}
function normalizeParameters(input={}) {
  plainJSON(input,'parameters');
  if(!input||typeof input!=='object'||Array.isArray(input))throw new ComputeError('INVALID_INPUT','parameters must be a JSON object');
  const allowed=['Md','logP','lambda','h','logXR','Tf','co'];
  for(const k of Object.keys(input))if(!allowed.includes(k))throw new ComputeError('INVALID_INPUT','Unknown outer parameter',{key:k});
  const p={...outerExampleInput().parameters,...input};
  bounded(p.Md,'Md',.2,4);bounded(p.logP,'logP',0,100);bounded(p.lambda,'lambda',5e-5,.005);bounded(p.h,'h',1e-12,.001);
  bounded(p.logXR,'logXR',0,100);bounded(p.Tf,'Tf',64,512);bounded(p.co,'co',1e-5,.01);
  if(!(p.h<p.lambda/2))throw new ComputeError('INVALID_INPUT','The source tail requires 2h < lambda');
  return {...p,Td:Math.exp(p.Md)+10};
}
function normalizeOuterInput(input={},maxPoints=16384) {
  plainJSON(input);
  if(!input||typeof input!=='object'||Array.isArray(input))throw new ComputeError('INVALID_INPUT','Outer input must be a JSON object');
  const allowed=['parameters','etas','samplesPerEta','pressureOrder','tolerance','heatOrder'];
  for(const k of Object.keys(input))if(!allowed.includes(k))throw new ComputeError('INVALID_INPUT','Unknown source outer input key',{key:k});
  const defaults=outerExampleInput(),normalized={...defaults,...input,parameters:normalizeParameters(Object.hasOwn(input,'parameters')?input.parameters:defaults.parameters)};
  bounded(normalized.samplesPerEta,'samplesPerEta',24,256,true);bounded(normalized.pressureOrder,'pressureOrder',0,54,true);
  bounded(normalized.heatOrder,'heatOrder',1,5,true);bounded(normalized.tolerance,'tolerance',1e-11,1e-3);
  const etas=normalized.etas;if(!Array.isArray(etas)||etas.length<1||etas.length>16)throw new ComputeError('INVALID_INPUT','etas must contain 1 to 16 real points');
  etas.forEach(x=>bounded(x,'eta',-1,1));
  if(normalized.samplesPerEta*etas.length>maxPoints)throw new ComputeError('RESOURCE_LIMIT','Outer samples exceed maxPoints',{count:normalized.samplesPerEta*etas.length,maxPoints});
  delete normalized.parameters.Td;return normalized;
}
/** Pure structural validation: no ODE, quadrature or field computation. */
function validateOuterInput(input={},budget={}) {
  try {const normalizedInput=normalizeOuterInput(input,budget.maxPoints??16384);return {valid:true,normalizedInput,
    requirements:{sourceParameterSmallness:'Not certified by structural validation',entireEtaProfile:'Not certified',jsonOnly:true},
    sampleCount:normalizedInput.samplesPerEta*normalizedInput.etas.length};}
  catch(e){return {valid:false,status:e.code??'INVALID_INPUT',message:e.message,detail:e.detail??{}};}
}
function checkedQuad(schedule,f,a,b,tol=schedule.tolerance/64) {
  const q=integrate(f,a,b,tol,schedule.budget);
  if(q.depthLimited)throw new ComputeError('PRECISION_REQUIRED','Outer quadrature exhausted its subdivision depth',{a,b,errorEstimate:q.errorEstimate});
  schedule.quadratureEvaluations+=q.evaluations;
  schedule.maxLocalQuadratureEstimate=Math.max(schedule.maxLocalQuadratureEstimate,q.errorEstimate);
  return q.value;
}
function logQuad(schedule,logf,a,b,tolerance=schedule.tolerance/64,relativeLog=null) {
  if(a===b)return ZERO();
  // Locate the maximum in known smooth source subintervals, then make it an
  // integration endpoint. This avoids silently missing a narrow positive pulse.
  const N=64;let k=0,m=-Infinity;
  for(let i=0;i<=N;i++){schedule.budget.tick();const v=logf(a+(b-a)*i/N);if(v>m){m=v;k=i;}}
  if(m===-Infinity)return ZERO();
  let l=a+(b-a)*Math.max(0,k-1)/N,r=a+(b-a)*Math.min(N,k+1)/N;
  const golden=(Math.sqrt(5)-1)/2;let x1=r-golden*(r-l),x2=l+golden*(r-l),f1=logf(x1),f2=logf(x2);
  for(let i=0;i<65;i++){schedule.budget.tick();if(f1<f2){l=x1;x1=x2;f1=f2;x2=l+golden*(r-l);f2=logf(x2);}else{r=x2;x2=x1;f2=f1;x1=r-golden*(r-l);f1=logf(x1);}}
  const x=f1>f2?x1:x2;m=Math.max(m,f1,f2);
  const bias=relativeLog?logf(x)-m:0;
  const ev=t=>{const z=relativeLog?relativeLog(t,x)+bias:logf(t)-m;return z===-Infinity?0:Math.exp(z);};
  // Resolve exponential boundary layers whose width is O(lambda), even when
  // their source interval has length O(1). A dyadic mesh around the located
  // maximum prevents the adaptive local error test from spending all depth on
  // a single, initially enormous interval.
  const cuts=[a,x,b];for(let j=1;j<=20;j++){schedule.budget.tick();const d=(b-a)*2**(-j);if(x-d>a)cuts.push(x-d);if(x+d<b)cuts.push(x+d);}
  const mesh=[...new Set(cuts)].sort((u,v)=>u-v);let v=0;
  for(let j=0;j<mesh.length-1;j++)v+=checkedQuad(schedule,ev,mesh[j],mesh[j+1],tolerance);
  return v>0?signed(1,m+Math.log(v)):ZERO();
}
function sigmaPrimitive(schedule,t) {
  if(t<=0)return 0;if(t>=1)return t-.5;
  if(!schedule.stepCache.has(t))schedule.stepCache.set(t,checkedQuad(schedule,sourceStep,0,t,Math.min(schedule.tolerance/128,1e-11)));
  return schedule.stepCache.get(t);
}
function rAdvanceVariable(schedule,r,length,lAt) {
  // Independent test uses high-precision integrating factors, not this RK4.
  const solve=N=>{const h=length/N;let q=r;for(let i=0;i<N;i++){schedule.budget.tick(8);const t=i*h,fn=(v,w)=>1-(1+lAt(v))*w,k1=fn(t,q),k2=fn(t+h/2,q+h*k1/2),k3=fn(t+h/2,q+h*k2/2),k4=fn(t+h,q+h*k3);q+=h*(k1+2*k2+2*k3+k4)/6;}return q;};
  const a=solve(256),b=solve(512);schedule.ratioRKErrorEstimate=Math.max(schedule.ratioRKErrorEstimate,Math.abs(a-b)/15);return b;
}
function qAdvanceVariable(schedule,q0,lAt) {
  const solve=N=>{let q=q0;const dt=1/N,h=schedule.params.h;for(let i=0;i<N;i++){schedule.budget.tick(8);const t=i*dt,fn=(v,w)=>-(1+lAt(v))*w-lAt(v)-h,k1=fn(t,q),k2=fn(t+dt/2,q+dt*k1/2),k3=fn(t+dt/2,q+dt*k2/2),k4=fn(t+dt,q+dt*k3);q+=dt*(k1+2*k2+2*k3+k4)/6;}return q;};
  const a=solve(256),b=solve(512);schedule.terminalRKErrorEstimate=Math.max(schedule.terminalRKErrorEstimate,Math.abs(a-b)/15);return b;
}

function prepareOuterSchedule(parameters={},budget=makeBudget(),options={}) {
  const params=normalizeParameters(parameters),tolerance=bounded(options.tolerance??2e-8,'tolerance',1e-11,1e-3);
  const s={params,budget,tolerance,stages:[],stepCache:new Map(),quadratureEvaluations:0,maxLocalQuadratureEstimate:0,ratioRKErrorEstimate:0,terminalRKErrorEstimate:0};
  const {lambda:l,h,Td,Tf,co}=params;let y=0,logA=0,energyLog=0;
  function add(name,length,delta,energyDelta,theta=1,constantSlope=null) {
    const v={name,start:y,end:y+length,length,logAStart:logA,energyLogStart:energyLog,theta,constantSlope,delta,energyDelta};
    s.stages.push(v);y+=length;logA+=delta(length);energyLog+=energyDelta(length);v.logAEnd=logA;v.energyLogEnd=energyLog;return v;
  }
  s.initial=add('initial-slope',1,t=>.1*t-.6*sigmaPrimitive(s,t),t=>1.2*t-1.2*sigmaPrimitive(s,t));
  s.decay=add('axial-decay',Td,t=>-.5*t,()=>0,1,-.5);
  s.entry=add('intermediate-entry',1,t=>-.5*t-l*sigmaPrimitive(s,t),t=>-2*l*sigmaPrimitive(s,t));
  const Tw=60*Math.log(1/l);s.power=add('reserved-power',Tw,t=>(-.5-l)*t,t=>-2*l*t,1,-.5-l);
  s.reserved=[[Tw-25,Tw-20],[Tw-20,Tw-15],[Tw-14,Tw-9],[Tw-8,Tw-3]].map((a,i)=>({id:['I1-cone','I2-heat','Ipos','Imean'][i],start:s.power.start+a[0],end:s.power.start+a[1],interval:'OPEN'}));
  if(s.reserved[0].start<=s.power.start)throw new ComputeError('INVALID_INPUT','The four reserved patches do not fit the source power interval');
  s.pulse=add('axial-pulse',13/l,t=>(-.5-l)*t,t=>-2*l*t,1,-.5-l);
  s.interpolation=add('parameter-interpolation',Tf,t=>(-.5-l)*t-Math.log(2)*sourceStep(t/Tf),t=>-2*l*t-2*Math.log(2)*sourceStep(t/Tf),'interpolation');
  s.angular=add('angular-moment-patch',30*Math.log(1/l),t=>(-.5-l)*t,t=>-2*l*t,0,-.5-l);
  s.steepen=add('exterior-steepen',1,t=>(-.5-l)*t-(1-l)*sigmaPrimitive(s,t),t=>-2*l*t-2*(1-l)*sigmaPrimitive(s,t),0);
  s.hold=add('steep-power',4*Math.log(1/h),t=>-1.5*t,t=>-2*t,0,-1.5);
  s.flatten=add('exterior-flatten',1,t=>-1.5*t+(1-h)*sigmaPrimitive(s,t),t=>-2*t+2*(1-h)*sigmaPrimitive(s,t),0);
  s.rho=co*h;s.fo=t=>1-s.rho*(1-sourceStep((t-1)/2));
  s.logFo=t=>Math.log1p(-s.rho*(1-sourceStep((t-1)/2)));
  s.foPrime=t=>s.rho*sourceStepPrime((t-1)/2)/2;
  let Q=(l-h)/(1-l);Q=qAdvanceVariable(s,Q,t=>-l-(1-l)*sourceStep(t));Q+=(1-h)*s.hold.length;Q=qAdvanceVariable(s,Q,t=>-1+(1-h)*sourceStep(t));
  const Qp=checkedQuad(s,t=>Math.exp((1-h)*t)*s.foPrime(t)/(1-s.rho),1,3,Math.max(1e-26,h*tolerance/64));
  if(!(Q>Qp&&Qp>0))throw new ComputeError('INVALID_INPUT','Source terminal wait has no positive solution',{Q,Qp});
  const wait=Math.log(Q/Qp)/(1-h);s.terminalWait=add('terminal-wait',wait,t=>(-.5-h)*t,t=>-2*h*t,0,-.5-h);
  const foRatio=t=>Math.log1p(s.rho*sourceStep((t-1)/2)/(1-s.rho));
  s.terminal=add('terminal-flat-collar',3,t=>(-.5-h)*t+foRatio(t),t=>-2*h*t+2*foRatio(t),0);
  s.end=y;s.logEndA=logA;s.logEndEnergy=energyLog;s.logEPowTail=params.logP+s.terminal.logAStart-Math.log1p(-s.rho);
  s.logXtail=params.logXR+s.terminal.start;s.logCInfinity=params.logP+s.logEndA+(.5+h)*(params.logXR+s.end);
  s.terminalAudit={QBeforeWait:Q,Qp,wait,modelQAtTerminalStart:Q*Math.exp(-(1-h)*wait),estimatedRKError:s.terminalRKErrorEstimate,conditionalOnAngularMomentRestoration:true};
  let r=rAdvanceVariable(s,1/1.6,1,t=>.6*(1-sourceStep(t)));r=1+(r-1)*Math.exp(-Td);r=rAdvanceVariable(s,r,1,t=>-l*sourceStep(t));
  s.rIPulseStartTransient=shiftSL(sl(r-1/(1-l)),-(1-l)*Tw);
  s.rIInterpolationStartTransient=shiftSL(s.rIPulseStartTransient,-(1-l)*s.pulse.length);
  s.necessaryParameterChecks=[{name:'logP > Td',pass:params.logP>Td},{name:'h < exp(-Td)',pass:Math.log(h)<-Td},{name:'2h < lambda',pass:2*h<l}];
  s.upstreamContracts={required:'Definition 3.3 and A.6 sufficiently large/small choices; uniform finite derivative bounds and cone margins',certified:false,reason:'Necessary scalar inequalities and pointwise equations do not instantiate the upstream uniform constants.'};
  return s;
}

function stageAt(s,y) {return s.stages.find(v=>y>=v.start&&y<=v.end);}
function rawShape(s,y,eta) {
  const f=1/(1+eta*eta),lf=Math.log(f);
  if(y<=0)return {logE:s.params.logP+lf+.1*y,logShape:.1*y+lf,theta:1,stage:'reference-inner',l:.6};
  if(y>=s.end)return {logE:s.params.logP+s.logEndA-(.5+s.params.h)*(y-s.end),logShape:s.logEndA-(.5+s.params.h)*(y-s.end),theta:0,stage:'power-exterior',l:-s.params.h};
  const g=stageAt(s,y),t=y-g.start,theta=g.theta==='interpolation'?1-sourceStep(t/s.params.Tf):g.theta;
  return {logE:s.params.logP+g.logAStart+g.delta(t)+theta*lf,logShape:g.logAStart+g.delta(t)+theta*lf,theta,stage:g.name};
}
function pulseR0(s,xi) {
  if(xi<=0||xi>=11)return 0;
  const phi=xi>=.02?xi-.01:.02*checkedQuad(s,sourceStep,0,xi/.02);
  return phi*Math.exp(logOneMinusStep(xi-10));
}
function pulseLogR0(s,xi) {
  if(xi<=0||xi>=11)return -Infinity;
  const phi=xi>=.02?xi-.01:.02*checkedQuad(s,sourceStep,0,xi/.02);
  return phi>0?Math.log(phi)+logOneMinusStep(xi-10):-Infinity;
}
function exponentialBumpIntegral(s,exponent,offset=0,square=false,width=.3) {
  // The pulse rows have slope difference lambda, so their inverse costs
  // O(1/lambda). A generic field quadrature tolerance is insufficient here.
  return checkedQuad(s,t=>Math.exp(exponent*t)*(square?bump(t,0,width)**2:bump(t,0,width)),-width/2,width/2,Math.min(1e-13,s.tolerance/4096))*Math.exp(exponent*offset);
}
function pulseEndCorrections(s,eta) {
  const {lambda:l,logP,Md}=s.params,f=1/(1+eta*eta),lf=Math.log(f),end=s.pulse.length,centers=[end-3,end-1],k=t=>4*(1-sourceStep(Math.log1p(t)/Md)),cut=Math.exp(Md)-1;
  const K1=checkedQuad(s,t=>k(t)*Math.exp(t),0,cut),K2=checkedQuad(s,t=>k(t)**2*Math.exp(t),0,cut);
  const Jinit=checkedQuad(s,t=>Math.exp(1.6*t-.6*sigmaPrimitive(s,t)),0,1);
  const Mshape=4*Math.E+Math.E*K1,Jshape=4/1.6+4*Jinit+Math.exp(1.3)*K1,U2shape=16*Math.E+Math.E*K2;
  const slopes=[.5-l,.5-2*l];
  const B=slopes.map(a=>centers.map(c=>exponentialBumpIntegral(s,a,c-centers[0])));
  const zeroDebt=[eta===0?ZERO():signed(Math.sign(eta),Math.log(Math.abs(eta))+Math.log(Mshape)-s.pulse.start-logP-s.pulse.logAStart-lf),eta===0?ZERO():signed(Math.sign(eta),Math.log(Math.abs(eta))+Math.log(Jshape)-logP-1.5*s.pulse.start-2*s.pulse.logAStart-lf)];
  const d0=zeroDebt.map((v,i)=>shiftSL(negSL(v),-slopes[i]*centers[0]));
  const da=slopes.map(a=>{
    const first=logQuad(s,xi=>a/l*(xi-13)+3*a+pulseLogR0(s,xi)-Math.log(l),0,.02);
    // On [.02,10], R0(xi)=xi-.01, so integrate this weighted polynomial exactly.
    const anti=xi=>scaleSL(signed(1,a/l*(xi-13)+3*a),(xi-.01)/a-l/a**2);
    const middle=addSL(anti(10),negSL(anti(.02)));
    // On [10,11], use local t=xi-10 and a log ratio to the peak. This avoids
    // subtracting two log moments of size 1/lambda inside adaptive quadrature.
    const tail=logQuad(s,t=>a/l*(t-3)+3*a+Math.log(t+9.99)+logOneMinusStep(t)-Math.log(l),0,1,1e-14,
      (t,u)=>a/l*(t-u)+Math.log1p((t-u)/(u+9.99))+logOneMinusStep(t)-logOneMinusStep(u));
    return negSL(sumSL([first,middle,tail]));
  });
  function solveDebt(d) {const scale=Math.max(...d.filter(x=>x.sign).map(x=>x.logAbs));if(!Number.isFinite(scale))return {scale:0,c:[0,0],values:[ZERO(),ZERO()]};const solution=solveLinear(B,d.map(v=>relativeSL(v,scale)));return {scale,c:solution.solution,values:solution.solution.map(v=>shiftSL(sl(v),scale)),linearResidual:solution.residual};}
  const constant=solveDebt(d0),amplitude=solveDebt(da);
  return {centers,width:.3,slopes,matrix:B,constant,amplitude,normalizedDebts:{constant:d0,amplitude:da},U2shape,
    coefficientsAt:A=>constant.values.map((v,i)=>addSL(v,scaleSL(amplitude.values[i],A)))};
}

function solveQuadraticMap(s,B,Q,debt,tolerance=s.tolerance) {
  const nonzero=debt.filter(x=>x.sign),scale=nonzero.length?Math.max(...nonzero.map(x=>x.logAbs)):0,d=debt.map(x=>relativeSL(x,scale)),eps=Math.exp(scale);
  if(!Number.isFinite(eps))throw new ComputeError('PRECISION_REQUIRED','Normalized correction scale overflow');
  let c=solveLinear(B,d).solution;const history=[];
  for(let it=0;it<8;it++){s.budget.tick(B.length**3);const F=B.map((row,i)=>row.reduce((v,b,j)=>v+b*c[j]+eps*Q[i][j]*c[j]**2,0)-d[i]),r=Math.max(...F.map(Math.abs));history.push(r);if(r<tolerance/20)break;
    const J=B.map((row,i)=>row.map((b,j)=>b+2*eps*Q[i][j]*c[j])),step=solveLinear(J,F.map(x=>-x)).solution;c=c.map((x,i)=>x+step[i]);}
  const residual=B.map((row,i)=>row.reduce((v,b,j)=>v+b*c[j]+eps*Q[i][j]*c[j]**2,0)-d[i]);
  const inverseColumns=B.map((_,j)=>solveLinear(B,B.map((__,i)=>i===j?1:0)).solution),inverseNorm=Math.max(...B.map((_,i)=>inverseColumns.reduce((a,col)=>a+Math.abs(col[i]),0)));
  return {scale,c,values:c.map(x=>shiftSL(sl(x),scale)),debt,residual,normalizedResidual:Math.max(...residual.map(Math.abs)),history,inverseNorm,
    quadraticScaleUnderflow:scale<Math.log(Number.MIN_VALUE),quadraticScale:packSL(signed(1,scale)),quadraticRemainderLogUpper:scale+Math.log(Math.max(1e-300,...Q.map(row=>row.reduce((a,q,j)=>a+Math.abs(q)*c[j]**2,0))))};
}

function angularReset(s,eta) {
  const l=s.params.lambda,a=1-l,T=s.params.Tf,b=Math.log(2/(1+eta*eta));
  const incoming=shiftSL(s.rIInterpolationStartTransient,-a*T+b);
  const forced=b===0?ZERO():logQuad(s,z=>logStepPrime(z)+Math.log(b/a)-a*T*(1-z)+b*(1-sourceStep(z)),0,1);
  const atStart=addSL(incoming,forced),centers=[s.angular.length-3,s.angular.length-1];
  const debt=shiftSL(negSL(atStart),-a*centers[0]);
  const B=[centers.map(c=>exponentialBumpIntegral(s,a,c-centers[0])),centers.map(c=>2*exponentialBumpIntegral(s,-1-2*l,c-centers[0]))];
  const Q=[centers.map(()=>0),centers.map(c=>exponentialBumpIntegral(s,-1-2*l,c-centers[0],true))];
  const solved=solveQuadraticMap(s,B,Q,[debt,ZERO()]);
  const logPerturbationUpper=solved.values.some(v=>v.sign)?Math.max(...solved.values.map(v=>v.sign?v.logAbs+Math.log(64/.3):-Infinity))+Math.log(2):-Infinity;
  return {...solved,centers,width:.3,matrix:B,quadratic:Q,source:'A.11',pointwisePositiveBound:logPerturbationUpper<0,logRelativePerturbationUpper:Number.isFinite(logPerturbationUpper)?logPerturbationUpper:null};
}

function stageEnergyIntegral(s,g,eta) {
  const lf=Math.log(1/(1+eta*eta));
  if(g.constantSlope!==null){const rate=2*g.constantSlope+1,v=rate===0?g.length:Math.expm1(rate*g.length)/rate;return signed(1,g.energyLogStart+2*g.theta*lf+Math.log(v));}
  const v=checkedQuad(s,t=>{const theta=g.theta==='interpolation'?1-sourceStep(t/s.params.Tf):g.theta;return Math.exp(g.energyDelta(t)+2*theta*lf);},0,g.length);
  return signed(1,g.energyLogStart+Math.log(v));
}
function amplitudeEquation(s,eta,end,angular) {
  const {lambda:l,h,logP}=s.params,f=1/(1+eta*eta),lf=Math.log(f),normal=s.pulse.energyLogStart+2*lf;
  const energyTerms=[signed(1,2*lf-Math.log(1.2)),...s.stages.map(g=>stageEnergyIntegral(s,g,eta)),signed(1,s.logEndEnergy-Math.log(2*h))];
  // A.11 changes E^2 in its compact patch; pressure preservation does not make
  // its X-weighted S increment zero.
  for(let i=0;i<2;i++){
    const c=angular.values[i],center=angular.centers[i],base=s.angular.energyLogStart-2*l*center;
    const w1=exponentialBumpIntegral(s,-2*l),w2=exponentialBumpIntegral(s,-2*l,0,true);
    energyTerms.push(shiftSL(scaleSL(c,2*w1),base),shiftSL(scaleSL(mulSL(c,c),w2),base));
  }
  const eTotal=sumSL(energyTerms);
  let c0=scaleSL(shiftSL(eTotal,-normal),-.5*l),c1=ZERO();
  const innerU2=eta===0?ZERO():signed(1,2*Math.log(Math.abs(eta))+Math.log(end.U2shape)-2*logP-normal);
  c0=addSL(c0,scaleSL(innerU2,l));
  const Kb=[[0,.02],[.02,10],[10,11]].reduce((v,[a,b])=>v+checkedQuad(s,x=>Math.exp(-2*x)*pulseR0(s,x)**2,a,b),0);
  let c2=sl(Kb);
  for(let i=0;i<2;i++){
    const w=l*Math.exp(-2*l*end.centers[i])*exponentialBumpIntegral(s,-2*l,0,true),a=end.constant.values[i],b=end.amplitude.values[i];
    c0=addSL(c0,scaleSL(mulSL(a,a),w));c1=addSL(c1,scaleSL(mulSL(a,b),2*w));c2=addSL(c2,scaleSL(mulSL(b,b),w));
  }
  const coefficients=[c0,c1,c2],v=coefficients.map(asFloat),at=A=>v[0]+A*(v[1]+A*v[2]),deriv=A=>v[1]+2*A*v[2];
  const omitted=coefficients.flatMap((c,i)=>c.sign&&v[i]===0?[{power:i,coefficient:packSL(c),bracketContributionUpper:packSL(scaleSL(signed(1,c.logAbs),1.2**i))}]:[]);
  const bracket=[.9,1.2],endpointValues=bracket.map(at),minimumDerivative=Math.min(...bracket.map(deriv));
  const bracketPass=endpointValues[0]<0&&endpointValues[1]>0&&minimumDerivative>=.36;
  if(!bracketPass)return {source:'A.19',status:'SOURCE_BRACKET_NOT_ESTABLISHED',amplitude:null,coefficients:coefficients.map(packSL),coefficientValues:v,float64OmittedCoefficientTerms:omitted,Kb,endpointValues,minimumDerivative,requiredDerivativeFloor:.36,bracket,pointwiseNumericalSuccess:false};
  let a=.9,b=1.2;for(let i=0;i<70&&b-a>s.tolerance/16;i++){s.budget.tick();const m=(a+b)/2;if(at(m)>0)b=m;else a=m;}
  const A=(a+b)/2;
  const physicalSNormalizationLog=s.params.logXR+2*logP+normal-Math.log(l);
  return {source:'A.19',status:'POINTWISE_NUMERICAL_ROOT',amplitude:A,coefficients:coefficients.map(packSL),coefficientValues:v,float64OmittedCoefficientTerms:omitted,Kb,endpointValues,minimumDerivative,requiredDerivativeFloor:.36,bracket:[a,b],normalizedSMomentResidual:at(A),pointwiseNumericalSuccess:true,
    physicalSNormalizationLog,physicalSMomentResidualEstimate:packSL(shiftSL(sl(at(A)),physicalSNormalizationLog)),
    derivativeScope:'The .36 source estimate applies to the principal expression. This record evaluates the full corrected quadratic separately.',uniformEtaCertified:false,intervalArithmeticCertified:false};
}

function heatTaylorCoefficients(h,n) {
  const a=[1];for(let k=1;k<=n;k++)a.push(-a[k-1]*(h+(k-1))*(1+h+(k-1))/k);return a;
}
function heatMomentIntegral(s,p,foPower,chiPower) {
  if(!(p>0))throw new ComputeError('INVALID_INPUT','A.7 heat difference is integrable only with a positive decay exponent',{p});
  const key=`${p}/${foPower}/${chiPower}`;s.heatIntegralCache??=new Map();
  if(s.heatIntegralCache.has(key))return s.heatIntegralCache.get(key);
  const fn=t=>Math.exp(-p*t+foPower*s.logFo(t))*sourceStep((t-.2)/.3)**chiPower;
  // The potentially very slow n=1 angular tail has the exact integral
  // exp(-3 h)/h. No finite cutoff is used for the 1/h contribution.
  const v=checkedQuad(s,fn,.2,.5)+checkedQuad(s,fn,.5,1)+checkedQuad(s,fn,1,3)+Math.exp(-3*p)/p;
  s.heatIntegralCache.set(key,v);return v;
}
function momentMapAudit(s,B,Q,values,debt,normalizations,commonScale,factoredCoefficients=null,labels=['Cp','S','I']) {
  return B.map((row,i)=>{
    const terms=row.flatMap((b,j)=>[scaleSL(values[j],b),scaleSL(mulSL(values[j],values[j]),Q[i][j])]);
    let increment=sumSL(terms),residual=addSL(increment,negSL(debt[i]));
    if(factoredCoefficients){
      // Keep the common scale outside the cancellation. A nonzero debt below
      // binary64 range is retained as an extra signed-log residual term.
      const linear=row.reduce((v,b,j)=>v+b*factoredCoefficients[j],0),quadratic=Q[i].reduce((v,q,j)=>v+q*factoredCoefficients[j]**2,0);
      const target=relativeSL(debt[i],commonScale),qTerm=shiftSL(sl(quadratic),2*commonScale);
      increment=addSL(shiftSL(sl(linear),commonScale),qTerm);
      residual=addSL(shiftSL(sl(linear-target),commonScale),qTerm);
      if(target===0&&debt[i].sign)residual=addSL(residual,negSL(debt[i]));
    }
    const sumAbs=sumSL([...terms,debt[i]].map(v=>signed(v.sign?1:0,v.logAbs)));
    const roundingScale=scaleSL(sumAbs,128*Number.EPSILON);
    return {row:labels[i],increment:packSL(increment),target:packSL(debt[i]),residual:packSL(residual),
      residualInCommonScale:relativeSL(residual,commonScale),physicalResidual:packSL(shiftSL(residual,normalizations[i])),
      floatingRoundoffScale:packSL(roundingScale),physicalFloatingRoundoffScale:packSL(shiftSL(roundingScale,normalizations[i])),
      roundoffScope:'128*machineEpsilon*sum(abs(terms)) is a diagnostic scale only. It excludes quadrature, matrix-entry, logarithm/exponential and source-parameter errors; it is not a certified bound.',
      exactEqualityCertified:false};
  });
}

function heatCompensation(s,eta,order=3) {
  const {lambda:l,h,logP,logXR}=s.params,d=1-eta*eta,f=1/(1+eta*eta),alpha=-.5-l;
  const patch=s.reserved.find(x=>x.id==='I2-heat'),yStar=patch.start,logXStar=logXR+yStar;
  const logEStar=logP+s.power.logAStart+alpha*(yStar-s.power.start);
  const norm=[2*logEStar,logXStar+2*logEStar,1.5*logXStar+logEStar];
  const centers=[Math.exp(1),Math.exp(2.5),Math.exp(4)],widths=centers.map(c=>.15*c);
  const B=[[],[],[]],Q=[[],[],[]];
  for(let i=0;i<3;i++){
    const c=centers[i],w=widths[i],at=(fn,square=false)=>checkedQuad(s,x=>fn(x)*(square?bump(x,c,w)**2:bump(x,c,w)),c-w/2,c+w/2);
    B[0].push(at(x=>f*x**(alpha-1)));B[1].push(at(x=>-f*x**alpha));B[2].push(at(x=>Math.SQRT2*Math.sqrt(x)));
    Q[0].push(at(x=>.5/x,true));Q[1].push(at(()=>-.5,true));Q[2].push(0);
  }
  const coeff=heatTaylorCoefficients(h,order+1),logZ=d===0?-Infinity:Math.log(2*d)-s.logXtail;
  const changes=[[],[],[]],tails=[[],[],[]];
  if(d>0){
    for(let n=1;n<=order;n++){
      s.budget.tick();
      changes[0].push(signed(Math.sign(coeff[n]),2*s.logEPowTail+n*logZ+Math.log(Math.abs(coeff[n])*heatMomentIntegral(s,n+1+2*h,2,1))-norm[0]));
      changes[1].push(signed(-Math.sign(coeff[n]),s.logXtail+2*s.logEPowTail+n*logZ+Math.log(Math.abs(coeff[n])*heatMomentIntegral(s,n+2*h,2,1))-norm[1]));
      changes[2].push(signed(Math.sign(coeff[n]),1.5*s.logXtail+s.logEPowTail+n*logZ+Math.log(Math.SQRT2*Math.abs(coeff[n])*heatMomentIntegral(s,n-1+h,1,1))-norm[2]));
      for(let m=1;m<=order;m++){
        s.budget.tick();const a=.5*coeff[n]*coeff[m],k=n+m;
        changes[0].push(signed(Math.sign(a),2*s.logEPowTail+k*logZ+Math.log(Math.abs(a)*heatMomentIntegral(s,k+1+2*h,2,2))-norm[0]));
        changes[1].push(signed(-Math.sign(a),s.logXtail+2*s.logEPowTail+k*logZ+Math.log(Math.abs(a)*heatMomentIntegral(s,k+2*h,2,2))-norm[1]));
      }
    }
    const n=order+1,an=Math.abs(coeff[n]);
    const smallnessLog=Math.log(coeff.slice(1).reduce((v,a)=>v+Math.abs(a),0))+logZ;
    if(!(logZ<=0&&smallnessLog<Math.log(.25)))throw new ComputeError('PRECISION_REQUIRED','Supported heat remainder estimate requires Z_tail <= 1 and a small finite Taylor correction',{logZ,smallnessLog});
    // Taylor's finite remainder follows from A.34--A.35, for Z >= 0.
    // If |D_N|+|R| < 1/4, the error in the half-square moment is bounded
    // by 1.5 |R| E_cl^2. I is linear. The numerical integrals are not interval certified.
    tails[0].push(signed(1,2*s.logEPowTail+n*logZ+Math.log(1.5*an*heatMomentIntegral(s,n+1+2*h,2,1))-norm[0]));
    tails[1].push(signed(1,s.logXtail+2*s.logEPowTail+n*logZ+Math.log(1.5*an*heatMomentIntegral(s,n+2*h,2,1))-norm[1]));
    tails[2].push(signed(1,1.5*s.logXtail+s.logEPowTail+n*logZ+Math.log(Math.SQRT2*an*heatMomentIntegral(s,n-1+h,1,1))-norm[2]));
  }
  const change=changes.map(sumSL),debt=change.map(negSL),remainder=tails.map(sumSL),solved=solveQuadraticMap(s,B,Q,debt);
  const perturbationUpper=sumSL(solved.values.map((v,i)=>scaleSL(signed(v.sign?1:0,v.logAbs),64/widths[i])));
  const lowerLog=Math.log(f)+alpha*5,logRelative=perturbationUpper.sign?perturbationUpper.logAbs-lowerLog:-Infinity;
  const audit=momentMapAudit(s,B,Q,solved.values,debt,norm,solved.scale,solved.c);
  return {...solved,source:'A.7 / A.39--A.43',patch,logXStar,logEStar,alpha,f,centers,widths,matrix:B,quadratic:Q,normalizationLogs:norm,
    heatOrder:order,heatCoefficients:coeff,logZTail:logZ,heatChanges:change,heatRemainderBounds:remainder,
    heatTerms:changes,momentAudit:audit,pointwisePositiveBound:logRelative<0,logRelativePerturbationUpper:Number.isFinite(logRelative)?logRelative:null,
    exactMomentsCertified:false,allEtaCertified:false,
    remainderContract:{formula:'|H(Z)-sum_{n=0}^N (-1)^n(h)_n(1+h)_n Z^n/n!| <= (h)_(N+1)(1+h)_(N+1) Z^(N+1)/(N+1)!',domain:'Z >= 0, h > 0',kind:'FINITE_TAYLOR_BOUND',boundEvaluation:'FLOAT64_WITH_SIGNED_LOG_SCALE',intervalCertified:false},
    uniformHeatValueBound:{formula:'0 <= 1-H(2(1-eta^2)/X) <= 2 h(1+h)/X',domain:'X >= Xtail, |eta| <= 1, h > 0',
      relativeChangeLogUpperAtXtail:Math.log(2)+Math.log(h)+Math.log1p(h)-s.logXtail,derivativeOrdersCovered:0,
      source:'A.34 and the finite first-order Taylor bound',sourceFormulaOnly:true,intervalArithmeticCertified:false},
    limits:['The polynomial is a finite Taylor approximation to the original gamma-integral heat factor, with an explicit remainder.',
      'Three moment increments are evaluated as 2 E deltaE + deltaE^2 and linear deltaE, not by subtracting rounded fields.',
      'At extreme scale separation, a common-scale residual can be small while its ratio to a much smaller individual heat debt is large. No exact moment equality is certified.']};
}

function etaPowerJet(eta,a,n,budget=null) {
  budget?.tick(n+1);
  const b=1+eta*eta,c=[b**(-a)];
  for(let k=0;k<n;k++)c.push(-(2*eta*(k+a)*c[k]+(k? (k-1+2*a)*c[k-1]:0))/(b*(k+1)));
  return c;
}
function pressureStageJet(s,g,eta,n) {
  if(g.constantSlope!==null){
    const rate=2*g.constantSlope,v=Math.expm1(rate*g.length)/rate,jet=etaPowerJet(eta,2*g.theta,n,s.budget);
    return jet.map(c=>shiftSL(sl(-.5*v*c),2*g.logAStart));
  }
  const terms=[];
  for(let k=0;k<=n;k++){
    const val=checkedQuad(s,t=>{const theta=g.theta==='interpolation'?1-sourceStep(t/s.params.Tf):g.theta;
      return Math.exp(2*g.delta(t))*etaPowerJet(eta,2*theta,n,s.budget)[k];},0,g.length);
    terms.push(shiftSL(sl(-.5*val),2*g.logAStart));
  }
  return terms;
}

/** Actual A.21 Taylor coefficients Pi^(k)(eta)/k!, not a fitted rational datum. */
function pressureJet(schedule,eta,order=4) {
  const s=schedule;bounded(eta,'eta',-1,1);bounded(order,'pressureOrder',0,54,true);
  const parts=[{stage:'reference-inner',values:etaPowerJet(eta,2,order,s.budget).map(v=>sl(-2.5*v))}];
  for(const g of s.stages){s.budget.tick();parts.push({stage:g.name,values:pressureStageJet(s,g,eta,order)});}
  const tail=Array.from({length:order+1},(_,k)=>k?ZERO():signed(-1,2*s.logEndA-Math.log(2*(1+2*s.params.h))));
  parts.push({stage:'infinite-power-tail',values:tail});
  const norm=Array.from({length:order+1},(_,k)=>sumSL(parts.map(x=>x.values[k]))),full=norm.map(v=>shiftSL(v,2*s.params.logP));
  const coefficients=full.map(asFloat);if(coefficients.some(x=>!Number.isFinite(x)))throw new ComputeError('PRECISION_REQUIRED','Pressure jet cannot be represented as finite Taylor coefficients');
  const coefficientTerms=Array.from({length:order+1},(_,k)=>parts.map(p=>({stage:p.stage,value:packSL(shiftSL(p.values[k],2*s.params.logP))})).filter(p=>p.value.sign));
  return {family:'source-outer-A21',eta,order,coefficients,coefficientConvention:'Pi^(k)(eta)/k!',normalizedByPSquared:norm.map(asFloat),signedLogCoefficients:full.map(packSL),coefficientTerms,
    analyticDefinition:'Pi0(eta) = -1/2 integral_R E_id,sched(y,eta)^2 dy',source:'A.21--A.23',
    derivativeRecurrence:'c[k+1] = -(2 eta (k+a)c[k] + (k-1+2a)c[k-1])/((1+eta^2)(k+1)), a=2 theta',
    innerAndExteriorInfiniteIntegrals:'ANALYTIC_EXPONENTIAL_INTEGRATION',independentOfXR:true,exactEvenFamilyByDefinition:true,
    globalHolomorphicCertificate:false,commonComplexNeighborhoodRadius:null,uniformJetErrorCertified:false,
    datumStatus:'SOURCE_DEFINED_NUMERICAL_JET',laterMomentRestorationExact:false};
}
function pressureDatum(schedule,eta) {return pressureJet(schedule,eta,0);}

function packCorrection(c,kind) {
  const out={source:kind,centers:c.centers,width:c.width??null,widths:c.widths??null,matrix:c.matrix,quadratic:c.quadratic??null,
    values:c.values.map(packSL),factoredValues:c.c.map(mantissa=>({logScale:c.scale,mantissa})),normalizingLogScale:c.scale,normalizedCoefficients:c.c,normalizedResidual:c.normalizedResidual,
    normalizedResidualRows:c.residual,inverseInfinityNorm:c.inverseNorm,iterationResiduals:c.history,
    pointwisePositiveBound:c.pointwisePositiveBound,logRelativePerturbationUpper:c.logRelativePerturbationUpper,
    quadraticScaleUnderflow:c.quadraticScaleUnderflow,quadraticScale:c.quadraticScale,quadraticRemainderLogUpper:c.quadraticRemainderLogUpper,
    certificate:'NONE_POINTWISE_NUMERICS',exactMomentEquality:false,allEtaCertified:false,momentAudit:c.momentAudit??null};
  return out;
}

/** Internal computational slice, with closures; runOuterConstruction exports only data. */
function solveOuterSlice(schedule,eta,options={}) {
  const s=schedule;bounded(eta,'eta',-1,1);const order=bounded(options.heatOrder??3,'heatOrder',1,5,true);
  const end=pulseEndCorrections(s,eta),angular=angularReset(s,eta),amplitude=amplitudeEquation(s,eta,end,angular);
  const yc=s.angular.start+angular.centers[0],logEc=s.params.logP+s.angular.logAStart+(-.5-s.params.lambda)*angular.centers[0];
  angular.momentAudit=momentMapAudit(s,angular.matrix,angular.quadratic,angular.values,angular.debt,
    [1.5*(s.params.logXR+yc)+Math.log(2)/2+logEc,2*logEc],angular.scale,angular.c,['I','2Cp']);
  if(!amplitude.pointwiseNumericalSuccess)return {schedule:s,eta,end,angular,amplitude,heat:null,status:'PRECISION_OR_PARAMETER_CONTRACT_REQUIRED'};
  const heat=heatCompensation(s,eta,order),coeff=end.coefficientsAt(amplitude.amplitude);
  const logXp=s.params.logXR+s.pulse.start,logEp=s.params.logP+s.pulse.logAStart-Math.log(1+eta*eta);
  const momentNorm=[logXp+logEp+end.slopes[0]*end.centers[0],1.5*logXp+Math.log(2)/2+2*logEp+end.slopes[1]*end.centers[0]];
  const endRows=end.matrix.map((row,i)=>{
    const debt=addSL(end.normalizedDebts.constant[i],scaleSL(end.normalizedDebts.amplitude[i],amplitude.amplitude));
    const inc=sumSL(row.map((b,j)=>scaleSL(coeff[j],b))),res=addSL(inc,negSL(debt));
    const common=Math.max(inc.logAbs,debt.logAbs),sumAbs=sumSL([...row.map((b,j)=>scaleSL(signed(coeff[j].sign?1:0,coeff[j].logAbs),Math.abs(b))),signed(debt.sign?1:0,debt.logAbs)]);
    return {row:['M','J'][i],increment:packSL(inc),target:packSL(debt),residual:packSL(res),relativeCommonResidual:relativeSL(res,common),
      physicalNormalizationLog:momentNorm[i],physicalResidualEstimate:packSL(shiftSL(res,momentNorm[i])),
      roundoffScale:packSL(scaleSL(sumAbs,128*Number.EPSILON)),exactEqualityCertified:false};
  });
  return {schedule:s,eta,end,angular,amplitude,heat,endCoefficients:coeff,endRows,status:'POINTWISE_COMPONENTS_EVALUATED'};
}

function heatAt(s,heat,eta,t) {
  const d=1-eta*eta,chi=sourceStep((t-.2)/.3);
  if(d===0||chi===0)return {relative:ZERO(),remainder:ZERO(),terms:[],polynomialODEResidual:t>=3?ZERO():null};
  const logZ=Math.log(2*d)-s.logXtail-t,terms=[];
  for(let k=1;k<=heat.heatOrder;k++)terms.push(shiftSL(sl(chi*heat.heatCoefficients[k]),k*logZ));
  const n=heat.heatOrder+1,remainder=shiftSL(sl(chi*Math.abs(heat.heatCoefficients[n])),n*logZ);
  const polynomialODEResidual=t>=3?shiftSL(sl(-n*heat.heatCoefficients[n]),heat.heatOrder*logZ):null;
  return {relative:sumSL(terms),remainder,terms,polynomialODEResidual};
}

function evaluateOuterSlice(slice,point) {
  const s=slice.schedule;plainJSON(point);const y=bounded(point.logXOverXR,'logXOverXR',-100,s.end+100),eta=slice.eta;
  if(!slice.amplitude.pointwiseNumericalSuccess)throw new ComputeError('UNCERTIFIED_PARAMETERS','A valid source bracket is required before field evaluation');
  s.budget.tick(10);const raw=rawShape(s,y,eta);let E=signed(1,raw.logE),U=ZERO(),angularEdit=ZERO(),patchEdit=ZERO(),heatEdit=ZERO(),heatRemainder=ZERO(),heatPolynomialODEResidual=null;
  if(y<=s.initial.end)U=sl(4*eta);
  else if(y<=s.decay.end){const t=y-s.decay.start;U=scaleSL(signed(1,Math.log(4)+logOneMinusStep(Math.log1p(t)/s.params.Md)),eta);}
  if(y>=s.pulse.start&&y<=s.pulse.end){
    const t=y-s.pulse.start,rb=[shiftSL(sl(slice.amplitude.amplitude),pulseLogR0(s,s.params.lambda*t))];
    for(let i=0;i<2;i++)rb.push(shiftSL(slice.endCoefficients[i],logBump(t,slice.end.centers[i],slice.end.width)));
    U=shiftSL(sumSL(rb),raw.logE);
  }
  if(y>=s.angular.start&&y<=s.angular.end){
    const t=y-s.angular.start;angularEdit=sumSL(slice.angular.values.map((v,i)=>shiftSL(v,logBump(t,slice.angular.centers[i],slice.angular.width))));
    E=addSL(E,shiftSL(angularEdit,raw.logE));
  }
  const heat=slice.heat;
  if(y>=heat.patch.start&&y<=heat.patch.end){
    const x=Math.exp(y-heat.patch.start);patchEdit=shiftSL(sumSL(heat.values.map((v,i)=>shiftSL(v,logBump(x,heat.centers[i],heat.widths[i])))),heat.logEStar);E=addSL(E,patchEdit);
  }
  if(y>=s.terminal.start+.2){
    const ht=heatAt(s,heat,eta,y-s.terminal.start);heatEdit=shiftSL(ht.relative,raw.logE);heatRemainder=shiftSL(ht.remainder,raw.logE);heatPolynomialODEResidual=ht.polynomialODEResidual;E=addSL(E,heatEdit);
  }
  if(E.sign!==1)throw new ComputeError('PRECISION_REQUIRED','Computed positive E lost positivity');
  return {eta,logXOverXR:y,stage:raw.stage,physicalX:packSL(signed(1,s.params.logXR+y)),physicalE:packSL(E),physicalU:packSL(U),
    logEOverP:E.logAbs-s.params.logP,baseE:packSL(signed(1,raw.logE)),
    corrections:{angularRelative:packSL(angularEdit),heatPatchAdditiveE:packSL(patchEdit),tailHeatAdditiveE:packSL(heatEdit),tailHeatRemainderUpper:packSL(heatRemainder)},
    heatPolynomialODE:heatPolynomialODEResidual?{residual:packSL(heatPolynomialODEResidual),operator:'Z^2 H_Ndd + (1+2(1+h)Z) H_Nd + h(1+h) H_N',
      formula:'-(N+1) a[N+1] Z^N',scope:'Residual of the finite Taylor polynomial, not of the exact gamma-integral heat factor',certifiedStressVanishing:false}:null,
    heatFactor:'A.32 finite Taylor approximation with remainder',exactFieldCertified:false};
}

function sampleCoordinates(s,slice,count) {
  const critical=[-1,0,...s.stages.flatMap(g=>[g.start,g.end])];
  for(const c of slice.end.centers)critical.push(s.pulse.start+c);
  for(const c of slice.angular.centers)critical.push(s.angular.start+c);
  for(const c of slice.heat.centers)critical.push(slice.heat.patch.start+Math.log(c));
  critical.push(s.terminal.start+.2,s.terminal.start+.5,s.terminal.start+1,s.terminal.start+2,s.end+5);
  // Include the pulse maximum region and both compact end corrections even when
  // the full log interval has length > 10^5. This is a nonuniform displayed mesh.
  for(const x of [.02,.5,1,2,4,8,10,10.5,11])critical.push(s.pulse.start+x/s.params.lambda);
  let v=[...new Set(critical)].sort((a,b)=>a-b);
  if(v.length>count){const keep=new Set([0,v.length-1]);for(let k=1;k<count-1;k++)keep.add(Math.round(k*(v.length-1)/(count-1)));v=[...keep].sort((a,b)=>a-b).map(i=>v[i]);}
  while(v.length<count){s.budget.tick(v.length);let best=0;for(let i=1;i<v.length-1;i++)if(v[i+1]-v[i]>v[best+1]-v[best])best=i;v.splice(best+1,0,(v[best]+v[best+1])/2);}
  return v;
}
function packSlice(slice,pressure,samples) {
  const e=slice.end,a=slice.amplitude;
  const result={eta:slice.eta,status:slice.status,amplitude:a,pressure,samples,
    pulseEndCorrection:{source:'A.15',centers:e.centers,width:e.width,slopes:e.slopes,matrix:e.matrix,
      affineConstant:e.constant.values.map(packSL),affineAmplitude:e.amplitude.values.map(packSL),
      values:slice.endCoefficients?.map(packSL)??null,momentRows:slice.endRows??null,exactEqualityCertified:false},
    angularReset:packCorrection(slice.angular,'A.11'),heatCompensation:null};
  if(slice.heat){const h=slice.heat;result.heatCompensation={...packCorrection(h,'A.7'),patch:h.patch,alpha:h.alpha,f:h.f,
    logXStar:h.logXStar,logEStar:h.logEStar,normalizationLogs:h.normalizationLogs,heatOrder:h.heatOrder,
    heatTaylorCoefficients:h.heatCoefficients,logZTail:Number.isFinite(h.logZTail)?h.logZTail:null,
    heatChanges:h.heatChanges.map(packSL),heatRemainderBounds:h.heatRemainderBounds.map(packSL),
    heatIncrementTerms:h.heatTerms.map(a=>a.map(packSL)),momentAudit:h.momentAudit,remainderContract:h.remainderContract,uniformHeatValueBound:h.uniformHeatValueBound,limits:h.limits};}
  return result;
}
function jsonFinite(value,path='result') {
  if(typeof value==='number'&&!Number.isFinite(value))throw new ComputeError('PRECISION_REQUIRED','Nonfinite result',{path});
  if(typeof value==='function'||typeof value==='undefined'||typeof value==='bigint')throw new ComputeError('INTERNAL_ERROR','Result is not plain serializable JSON',{path});
  if(Array.isArray(value))value.forEach((x,i)=>jsonFinite(x,`${path}[${i}]`));
  else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))jsonFinite(v,`${path}.${k}`);
}

/** Public bounded, JSON-only facade used by ns.source-outer. */
function runOuterConstruction(input={},budget=makeBudget()) {
  const normalized=normalizeOuterInput(input,budget.maxPoints),count=normalized.samplesPerEta,order=normalized.pressureOrder,heatOrder=normalized.heatOrder,etaValues=normalized.etas;
  const pars=normalized.parameters;
  const s=prepareOuterSchedule(pars,budget,{tolerance:normalized.tolerance}),slices=[];
  for(const eta of etaValues){budget.tick();const slice=solveOuterSlice(s,eta,{heatOrder}),p=pressureJet(s,eta,order);
    const samples=slice.amplitude.pointwiseNumericalSuccess?sampleCoordinates(s,slice,count).map(logXOverXR=>evaluateOuterSlice(slice,{logXOverXR})):[];
    slices.push(packSlice(slice,p,samples));}
  const allPointwise=slices.every(x=>x.amplitude.pointwiseNumericalSuccess&&Math.abs(x.amplitude.normalizedSMomentResidual)<=s.tolerance&&x.pulseEndCorrection.momentRows.every(r=>Math.abs(r.relativeCommonResidual)<=s.tolerance)&&x.angularReset.pointwisePositiveBound&&x.angularReset.normalizedResidual<=s.tolerance&&x.heatCompensation?.pointwisePositiveBound&&x.heatCompensation.normalizedResidual<=s.tolerance&&x.heatCompensation.momentAudit.every(r=>Math.abs(r.residualInCommonScale)<=s.tolerance)),points=slices.flatMap(x=>x.samples.map(p=>({pos:[p.logXOverXR,p.eta,p.logEOverP],value:p.logEOverP,label:`${p.stage}; eta=${p.eta}`})));
  const result={schema:'MathScope.SourceOuterConstruction/1',kind:'ns.source-outer',status:'PARTIAL',normalizedInput:{...normalized,parameters:pars},
    source:OUTER_SOURCES,model:{family:'Original scheduled ideal outer profile A.2--A.7',coordinate:'y=log(X/XR), X=r^2/(2L)',
      upstreamParametersCertified:false,regularAxisAttached:false,controlledContinuationAttached:false,stressFieldConstructed:false,originalGlobalWitnessCertified:false},
    stages:s.stages.map(({name,start,end,length,theta,logAStart,logAEnd,energyLogStart,energyLogEnd,constantSlope})=>({name,start,end,length,theta,logAStart,logAEnd,energyLogStart,energyLogEnd,constantSlope})),
    reservedPatches:s.reserved,terminal:{...s.terminalAudit,logXtail:s.logXtail,logCInfinity:s.logCInfinity,logEPowAtTail:s.logEPowTail,
      rho:s.rho,exactTerminalMomentCertified:false},necessaryParameterChecks:s.necessaryParameterChecks,upstreamContracts:s.upstreamContracts,slices,
    componentStatus:{scheduledField:'COMPUTED',amplitude:allPointwise?'POINTWISE_NUMERICAL_ROOTS':'PARAMETER_OR_PRECISION_FAILURE',
      affineMJ:'SIGNED_LOG_NUMERICAL_SOLVE',angularReset:'NORMALIZED_NUMERICAL_SOLVE',heatCompensation:'FINITE_TAYLOR_REMAINDER_AND_NORMALIZED_NUMERICAL_SOLVE',
      pressure:'ACTUAL_A21_JETS',stressSupport:'CONDITIONAL_SOURCE_REQUIREMENTS_ONLY'},
    certifiedConditions:{entireEtaInterval:false,sourceParameterSmallness:false,exactFiveMoments:false,strictStressCone:false,analyticAxisMatched:false,
      globalNavierStokesWitness:false},
    numericalAudit:{quadratureEvaluations:s.quadratureEvaluations,maxLocalQuadratureEstimate:s.maxLocalQuadratureEstimate,ratioRKErrorEstimate:s.ratioRKErrorEstimate,
      terminalRKErrorEstimate:s.terminalRKErrorEstimate,method:'adaptive Simpson, RK4 refinement, signed-log arithmetic, finite Taylor remainder',intervalArithmetic:false,
      pointwiseFiniteResidualChecksPassed:allPointwise,requestedNormalizedTolerance:s.tolerance,
      residualMeaning:'Pointwise finite computation. Small or rounded-zero residuals do not prove exact identities.'},
    stressSupport:{axialSupportEndsAtLogXOverXR:s.pulse.end,heatEditBeginsAtLogXOverXR:s.terminal.start+.2,
      pureHeatFactorBeyondLogXOverXR:s.end,exactExteriorStressVanishingCertified:false,source:'Lemma A.8',
      structuralChecks:{pulseBumpsStrictlyInsidePulse:s.pulse.length-3-.15>0&&s.pulse.length-1+.15<s.pulse.length,
        angularBumpsStrictlyInsideAngularPatch:s.angular.length-3-.15>0&&s.angular.length-1+.15<s.angular.length,
        heatCompensationStrictlyBeforeTerminal:s.reserved[1].end<s.terminal.start+.2,
        threeHeatBumpsStrictlyInsideReservedPatch:[1,2.5,4].every(t=>t+Math.log(1-.075)>0&&t+Math.log(1+.075)<5)},
      structuralCheckScope:'Support placement of the source formulas only; not a proof that the reconstructed stress exists or vanishes.',
      missing:['Regular smooth axis and the exact five matching moment conditions','Uniform eta bounds and strict stress-cone margins','Exact heat factor or a certified error transfer to the stress']},
    visualization:{points,lines:slices.filter(x=>x.samples.length).map(x=>({points:x.samples.map(p=>[p.logXOverXR,p.eta,p.logEOverP])})),arrows:[],
      axes:['log(X/XR)','eta','log(E/P*)'],description:'Actual sampled source outer profile in logarithmic graph coordinates, including recorded corrections.',
      coordinateMeaning:'The scene is a graph of the computed profile, not a Cartesian projection of a spatial flow. Physical X, E and U are stored in each sample as signed logarithms.',
      lostInformation:['Only finitely many eta slices are sampled.','Very small edits are preserved numerically in signed-log records but may be visually indistinguishable.','Finite Taylor approximation and quadrature uncertainty are not displayed as proof bounds.']},
    limits:['No pointwise calculation is promoted to an all-eta source-profile certificate.',
      'No exact nonlinear moment identity follows from a Float64 residual, even if subtraction rounds to zero.',
      'Small dimensionless residuals may correspond to large dimensional moment errors because the scheduled radii are extremely large; physical residual scales are therefore retained.',
      'The ideal inner reference is not the regular-axis solution required for the paper witness.',
      'Sufficiently-small and sufficiently-large upstream choices have not been supplied with uniform quantitative certificates.']};
  jsonFinite(result);return result;
}

return {OUTER_SOURCES,sourceStep,sourceStepPrime,outerExampleInput,validateOuterInput,prepareOuterSchedule,pressureJet,pressureDatum,solveOuterSlice,evaluateOuterSlice,runOuterConstruction};
})();
const __m1_29 = (()=>{
const {ComputeError,makeBudget,positive,finiteNumber,boundedInteger,point,iadd,imul,idiv,iexp,ilog} = __m1_16;
const {smoothStep} = __m1_23;
const {solveAxisCoefficients,jetC,jetVar,jetAdd,jetSub,jetScale,jetMul,jetDiv,jetInv,jetLog,jetExp,jetDeriv} = __m1_22;
const {coneGaps} = __m1_27;
const outer = __m1_28;
const SOURCE={attachment:'01-navier-stokes.pdf',sha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',pages:[28,29,150,151,152,153],equations:['4.15','4.16','B.22','B.24','B.25','B.26','B.27']};
const take=(a,n)=>Array.from({length:n+1},(_,i)=>a[i]??0);
const zero=n=>jetC(0,n);
const safe=value=>{
  if(typeof value==='number'){
    if(!Number.isFinite(value))throw new ComputeError('PRECISION_REQUIRED','Nonfinite controlled-continuation result');
    return Number.isInteger(value)&&!Number.isSafeInteger(value)?{kind:'FLOAT64',value:value.toExponential(17),precisionBits:53}:Object.is(value,-0)?0:value;
  }
  if(Array.isArray(value))return value.map(safe);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined&&typeof v!=='function').map(([k,v])=>[k,safe(v)]));
  return value;
};
const budgetFor=b=>b?.tick?b:makeBudget(b??{});
function requireFinite(v,message){if(!Number.isFinite(v))throw new ComputeError('PRECISION_REQUIRED',message);return v;}
function evalRows(rows,Y,n,denominatorOffset=0){
  let result=zero(n);
  for(let k=rows.length-1;k>=0;k--)result=jetAdd(jetScale(result,Y),jetScale(take(rows[k],n),denominatorOffset?1/(k+denominatorOffset):1));
  return result;
}
function multiplyRows(a,b,n){
  const result=Array.from({length:a.length+b.length-1},()=>zero(n));
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)result[i+j]=jetAdd(result[i+j],jetMul(take(a[i],n),take(b[j],n)));
  return result;
}
function addState(a,b,factor=1){return a.map((row,i)=>jetAdd(row,jetScale(b[i],factor)));}
function rk4(state,t,dt,rhs,budget){
  budget.tick(state.length*state[0].length*12);
  const k1=rhs(t,state),k2=rhs(t+dt/2,addState(state,k1,dt/2)),k3=rhs(t+dt/2,addState(state,k2,dt/2)),k4=rhs(t+dt,addState(state,k3,dt));
  return state.map((row,i)=>row.map((value,j)=>value+dt*(k1[i][j]+2*k2[i][j]+2*k3[i][j]+k4[i][j])/6));
}
function cubicState(left,right,leftDerivative,rightDerivative,h,t){
  const h00=(2*t-3)*t*t+1,h10=((t-2)*t+1)*t,h01=(-2*t+3)*t*t,h11=(t-1)*t*t;
  return left.map((r,i)=>r.map((v,j)=>h00*v+h10*h*leftDerivative[i][j]+h01*right[i][j]+h11*h*rightDerivative[i][j]));
}

async function pressureFamily(spec,budget){
  const family=spec?.family??'rational';
  if(family==='rational'){
    const K=positive(spec?.K??10,'pressure.K');
    return {description:{family,K,definition:'Pi0(eta)=-K/(1+eta^2)^2',outerBindingCertified:false},
      jet:(eta,n)=>{const e=jetVar(eta,n),f=jetInv(jetAdd(jetC(1,n),jetMul(e,e)));return jetScale(jetMul(f,f),-K);}};
  }
  if(family==='source-outer-A21'){
    const schedule=outer.prepareOuterSchedule(spec.parameters??{},budget);
    return {description:{family,parameters:spec.parameters??{},definition:'Actual A.21 schedule pressure datum and numerical Taylor coefficients',
      outerDatumComputed:true,outerBindingCertified:false,pressureQuadratureCertified:false},
      jet:(eta,n)=>{
        const result=outer.pressureJet(schedule,eta,n);
        if(result instanceof Promise)throw new ComputeError('UNSUPPORTED','Synchronous pressureJet coefficients are required by the finite axis recurrence');
        const c=result.coefficients;
        if(!Array.isArray(c)||c.length<n+1||!c.every(Number.isFinite))throw new ComputeError('PRECISION_REQUIRED','A.21 pressure jet is outside the finite axis numerical range',{order:n});
        return c;
      }};
  }
  throw new ComputeError('UNSUPPORTED','Only explicit rational or source-outer-A21 pressure families are supported');
}

/** Exact finite-polynomial moments of the computed nonlinear axis coefficients. */
function axisEvaluator(solution,n){
  const a=solution.data,Lambda=a.Lambda;
  const Frows=solution.phi.map(row=>jetMul(take(a.g,n),take(row,n)));
  const Urows=solution.u.map((row,i)=>jetAdd(jetScale(take(row,n),1/Lambda),i===0?take(a.Us,n):zero(n)));
  const UF=multiplyRows(Urows,Frows,n),UU=multiplyRows(Urows,Urows,n),FF=multiplyRows(Frows,Frows,n);
  const pressure=take(a.Pi,n);
  const at=X=>{
    const Y=Lambda*X,F=evalRows(Frows,Y,n),U=evalRows(Urows,Y,n);
    if(!(F[0]>0&&Number.isFinite(F[0])))throw new ComputeError('INVALID_PROFILE','The selected finite nonlinear axis is not positive/finite',{eta:a.eta,X,F:F[0]});
    const logF=jetLog(F),M=jetScale(evalRows(Urows,Y,n,1),X),I=jetScale(evalRows(Frows,Y,n,2),2*X*X),J=jetScale(evalRows(UF,Y,n,2),2*X*X);
    const S=jetSub(jetScale(evalRows(UU,Y,n,1),X),jetScale(evalRows(FF,Y,n,2),X*X));
    const Cp=jetScale(evalRows(FF,Y,n,1),X);
    const Fderivative=Frows.slice(1).map((row,k)=>jetScale(row,k+1)),Uderivative=Urows.slice(1).map((row,k)=>jetScale(row,k+1));
    const logFSlope=jetScale(jetDiv(evalRows(Fderivative,Y,n),F),Y),USlope=jetScale(evalRows(Uderivative,Y,n),Y);
    return {state:[logF,U,M,I,J,S,Cp],logFSlope,USlope,pressure,X};
  };
  return {at,pressure,eta:a.eta,Lambda,n};
}

function momentRHS(X,state,logFSlope,USlope){
  const n=state[0].length-1,F=jetExp(state[0]),U=state[1],F2=jetMul(F,F),U2=jetMul(U,U);
  if(!(F[0]>0&&Number.isFinite(F[0])))throw new ComputeError('PRECISION_REQUIRED','Scaled angular factor underflows or overflows during continuation');
  return [logFSlope,USlope,jetScale(U,X),jetScale(F,2*X*X),jetScale(jetMul(U,F),2*X*X),
    jetSub(jetScale(U2,X),jetScale(F2,X*X)),jetScale(F2,X)];
}

/** Equations (4.16)/(B.35), evaluated from actual five moment jets. */
function integratedState(X,eta,state,pressure,options){
  const n=state[0].length-1,e=jetVar(eta,n),one=jetC(1,n),d=jetSub(one,jetMul(e,e));
  const h=options.h,D=.5-h,A=.5+h,L=jetSub(one,jetScale(jetMul(e,e),2*h));
  const [logF,U,M,I,J,S,Cp]=state,F=jetExp(logF),E=jetScale(F,Math.sqrt(2*X)),H=jetScale(F,2*X),Pi=jetAdd(take(pressure,n),Cp);
  const W=jetSub(jetSub(one,jetScale(jetMul(e,M),2*D/X)),jetScale(jetMul(d,jetDeriv(M)),1/X));
  const angular=jetAdd(jetSub(jetSub(jetScale(I,1-h),jetScale(jetMul(e,jetDeriv(I)),D)),jetMul(d,jetDeriv(J))),jetScale(jetMul(e,J),2*(h-D)));
  const Qs=jetAdd(jetScale(W,-1),jetScale(jetDiv(angular,H),1/X));
  // Source (4.16): integrating Sn gives -X*W*U, so division by X
  // leaves -W*U outside the normalized moment numerator.
  const axialMoments=jetSub(jetAdd(jetScale(jetSub(M,jetMul(e,jetDeriv(M))),D),jetScale(jetMul(e,S),4*h)),jetMul(d,jetDeriv(S)));
  const Ns=jetAdd(jetAdd(jetAdd(jetScale(jetMul(W,U),-1),jetScale(axialMoments,1/X)),jetScale(jetMul(e,Pi),4*A)),jetScale(jetMul(d,jetDeriv(Pi)),-1));
  const p1=jetScale(jetDiv(Qs,L),X),ns=jetDiv(Ns,L),p2=jetScale(jetDiv(ns,E),X);
  const VoverX=jetDiv(jetSub(jetSub(jetScale(jetMul(e,U),2),jetScale(jetMul(e,M),2*D/X)),jetScale(jetMul(d,jetDeriv(M)),1/X)),L);
  for(const value of [E[0],U[0],Pi[0],p1[0],p2[0],ns[0],VoverX[0]])requireFinite(value,'Nonfinite reference integrated state');
  return {E,U,Pi,p1,p2,ns,W,Qs,Ns,VoverX,F,logF,L,moments:[M,I,J,S,Cp]};
}

function buildReference(axis,options,budget){
  const X0=4/options.Lambda,t1=options.t1,yStart=t1,yEnd=2*t1,N=options.referenceSteps,dy=t1/N;
  const initial=axis.at(X0*Math.exp(t1)).state;
  const rhs=(y,state)=>{
    const X=X0*Math.exp(y),nat=axis.at(X),cut=1-smoothStep((y-t1)/t1);
    return momentRHS(X,state,jetScale(nat.logFSlope,cut),jetScale(nat.USlope,cut));
  };
  const nodes=[{y:yStart,state:initial,rhs:rhs(yStart,initial)}];
  let state=initial;
  for(let i=0;i<N;i++){
    const y=yStart+i*dy;state=rk4(state,y,dy,rhs,budget);
    nodes.push({y:y+dy,state,rhs:rhs(y+dy,state)});
  }
  const end=nodes.at(-1),Xend=X0*Math.exp(yEnd),Fend=jetExp(end.state[0]),Uend=end.state[1],F2=jetMul(Fend,Fend),U2=jetMul(Uend,Uend),UF=jetMul(Uend,Fend);
  function at(X){
    const y=Math.log(X/X0);let result;
    if(y<=t1)result=axis.at(X).state;
    else if(y<yEnd){
      const k=Math.min(N-1,Math.max(0,Math.floor((y-yStart)/dy))),left=nodes[k],right=nodes[k+1];
      result=cubicState(left.state,right.state,left.rhs,right.rhs,dy,(y-left.y)/dy);
    }else{
      const dx=X-Xend,dx2=X*X-Xend*Xend;
      result=[end.state[0],Uend,
        jetAdd(end.state[2],jetScale(Uend,dx)),jetAdd(end.state[3],jetScale(Fend,dx2)),
        jetAdd(end.state[4],jetScale(UF,dx2)),jetAdd(end.state[5],jetSub(jetScale(U2,dx),jetScale(F2,dx2/2))),
        jetAdd(end.state[6],jetScale(F2,dx))];
    }
    return {state:result,...integratedState(X,axis.eta,result,axis.pressure,options)};
  }
  return {at,X0,Xend,nodes,method:'B.22 cutoff integrated by RK4; Hermite dense output only inside the short cutoff, exact finite constant-profile moment primitives after it.',interpolationCertified:false};
}

function controls(X,reference,options,kappa0,actualDegree){
  const y=Math.log(X/reference.X0),yB=Math.log(100/reference.X0),r=reference.at(X),p1=take(r.p1,actualDegree),ns=take(r.ns,actualDegree);
  // Preserve a very small positive kappa0 after the flat activation; subtracting
  // (1-kappa0)*1 from 1 would round it to zero in binary64.
  let kappa=kappa0+(1-kappa0)*(1-smoothStep(y/options.t1)),beta=1,a;
  if(y<=yB)a=jetScale(p1,kappa);
  else if(y<=yB+options.axialWidth){kappa=kappa0;beta=1-smoothStep((y-yB)/options.axialWidth);a=jetScale(p1,kappa0);}
  else{
    kappa=kappa0;beta=0;
    const s=smoothStep((y-yB-options.axialWidth)/options.shearWidth);
    a=jetAdd(jetScale(p1,kappa0*(1-s)),jetC(.8*s,actualDegree));
  }
  const logFSlope=jetScale(a,-.5),USlope=jetScale(ns,-kappa*beta*X/2);
  return {a,logFSlope,USlope,kappa,beta,reference:r,stage:y<=options.t1?'B26-flat-activation':y<=yB?'B26-small-shear':beta>0?'B5-axial-cutoff':y<yB+options.axialWidth+options.shearWidth?'B5-shear-interpolation':'B5-final-a-0.8'};
}

function continueSlice(axis,reference,options,kappa0,budget){
  const degree=options.etaJetOrder,X0=reference.X0;
  let state=axis.at(X0).state.map(row=>take(row,degree));
  const yB=Math.log(100/X0),yEnd=Math.log(110/X0);
  const knots=[0,options.t1,2*options.t1,yB,yB+options.axialWidth,yB+options.axialWidth+options.shearWidth,yEnd].sort((a,b)=>a-b);
  const rhs=(y,s)=>{const X=X0*Math.exp(y),c=controls(X,reference,options,kappa0,degree);return momentRHS(X,s,c.logFSlope,c.USlope);};
  const nodes=[{y:0,state,rhs:rhs(0,state)}];
  for(let segment=0;segment<knots.length-1;segment++){
    const left=knots[segment],right=knots[segment+1];if(right<=left)continue;
    const short=right-left<.2,steps=short?options.transitionSteps:Math.max(8,Math.ceil(options.radialSteps*(right-left)/yEnd)),dy=(right-left)/steps;
    for(let i=0;i<steps;i++){
      const y=left+i*dy;state=rk4(state,y,dy,rhs,budget);nodes.push({y:y+dy,state,rhs:rhs(y+dy,state)});
    }
  }
  function at(X){
    const y=Math.log(X/X0);let lo=0,hi=nodes.length-1;
    while(hi-lo>1){const m=(lo+hi)>>1;if(nodes[m].y<=y)lo=m;else hi=m;}
    const l=nodes[lo],r=nodes[hi],h=r.y-l.y;
    const s=y<=0?nodes[0].state:y>=yEnd?nodes.at(-1).state:cubicState(l.state,r.state,l.rhs,r.rhs,h,(y-l.y)/h);
    const c=controls(X,reference,options,kappa0,degree),v=integratedState(X,axis.eta,s,axis.pressure,options),bs=2*c.USlope[0]/v.E[0],g=coneGaps({a:c.a[0],bs,ps:[v.p1[0],v.p2[0]]});
    const relaxed=g.c>2&&g.c>g.v&&2*(g.c-g.v)**2>Math.max(0,g.v-2)*g.j*g.j;
    return {X,logX:Math.log(X),eta:axis.eta,E:v.E[0],logE:v.logF[0]+.5*Math.log(2*X),U:v.U[0],Pi:v.Pi[0],V0:X*v.VoverX[0],
      a:c.a[0],bs,ps:[v.p1[0],v.p2[0]],referencePs:[c.reference.p1[0],c.reference.p2[0]],
      kappa:c.kappa,beta:c.beta,stage:c.stage,cone:{...g,relaxed,admissible:g.gaps.every(x=>x>0)},
      referenceE:c.reference.E[0],referenceU:c.reference.U[0],moments:v.moments.map(row=>row[0]),
      momentEtaJets:v.moments.map(row=>take(row,Math.min(2,degree))),
      etaJets:{logF:take(v.logF,degree),U:take(v.U,degree),Pi:take(v.Pi,degree)},
      derivatives:{dYLogE:.5+c.logFSlope[0],dYU:c.USlope[0]},state:s};
  }
  return {at,nodes,X0,Xi:110};
}

function validateContinuationInput(input={}){
  try{
    const axis=input.axis??{},rawEtas=input.etaValues??[input.eta??0];
    if(!Array.isArray(rawEtas)||rawEtas.length<1||rawEtas.length>9)throw new ComputeError('INVALID_INPUT','etaValues must contain 1..9 explicit values');
    const etaValues=rawEtas.map(x=>finiteNumber(x,'eta'));
    if(etaValues.some(x=>Math.abs(x)>1))throw new ComputeError('INVALID_INPUT','Each eta must lie in [-1,1]');
    const outerH=input.pressure?.family==='source-outer-A21'?(input.pressure.parameters?.h??1e-8):null;
    const options={h:positive(axis.h??outerH??.005,'h'),j0:positive(axis.j0??.03,'j0'),sigmaStar:positive(axis.sigmaStar??.2,'sigmaStar'),Lambda:positive(axis.Lambda??48,'Lambda'),
      logC:finiteNumber(axis.logC??16,'logC'),axisOrder:boundedInteger(axis.axisOrder??10,'axisOrder',4,20),
      etaJetOrder:boundedInteger(input.etaJetOrder??4,'etaJetOrder',2,6),t1:positive(input.t1??.004,'t1'),
      axialWidth:positive(input.axialWidth??.02,'axialWidth'),shearWidth:positive(input.shearWidth??.02,'shearWidth'),
      referenceSteps:boundedInteger(input.referenceSteps??48,'referenceSteps',16,256),transitionSteps:boundedInteger(input.transitionSteps??24,'transitionSteps',8,128),
      radialSteps:boundedInteger(input.radialSteps??192,'radialSteps',32,2048),samples:boundedInteger(input.samples??161,'samples',33,1025)};
    if(!(options.h<.01&&options.j0<=.05&&options.Lambda>1&&options.logC>=0))throw new ComputeError('INVALID_INPUT','Require 0<h<.01, 0<j0<=.05, Lambda>1 and logC>=0');
    if(options.logC>600)throw new ComputeError('PRECISION_REQUIRED','The current finite continuation supports logC<=600; a valid much larger certified constant requires a scaled arbitrary-precision construction',{supportedLogCMaximum:600});
    if(outerH!==null&&options.h!==Number(outerH))throw new ComputeError('INVALID_INPUT','Outer and axis constructions must use the same h parameter');
    const cutoffEdge=imul(point(4),iexp(imul(point(2),point(options.t1)))),axisEdge=idiv(point(41),point(10));
    if(!(cutoffEdge[1]<axisEdge[0]))throw new ComputeError('INVALID_INPUT','B.22 requires certified 4 exp(2 t1)<4.1');
    const transitionLength=iadd(point(options.axialWidth),point(options.shearWidth)),availableLength=ilog(idiv(point(11),point(10)));
    if(!(transitionLength[1]<availableLength[0]))throw new ComputeError('INVALID_SUPPORT','Final cutoff/interpolation must fit strictly between Xb=100 and Xi=110');
    const kappa0=input.kappa0===undefined?null:positive(input.kappa0,'kappa0');
    if(kappa0!==null&&kappa0>=.5)throw new ComputeError('INVALID_INPUT','Require 0<kappa0<1/2');
    return {valid:true,options,etaValues,kappa0,pressure:input.pressure??{family:'rational',K:10}};
  }catch(error){return {valid:false,status:error.code??'INVALID_INPUT',message:error.message,detail:error.detail??{}};}
}

/** Actual B.22/B.26 operations applied to an explicitly finite nonlinear axis input. */
async function runControlledContinuation(input={},budgetInput={}){
  const budget=budgetFor(budgetInput),valid=validateContinuationInput(input);
  if(!valid.valid)return safe({status:['PRECISION_REQUIRED','UNSUPPORTED'].includes(valid.status)?valid.status:'FAILED',domainStatus:valid.status,message:valid.message,detail:valid.detail,fullProfileCertified:false});
  try{
    const {options,etaValues}=valid;
    if((options.samples+13)*etaValues.length>budget.maxPoints)throw new ComputeError('BUDGET_EXCEEDED','Requested continuation samples plus construction checkpoints exceed the point budget');
    const pressure=await pressureFamily(valid.pressure,budget),prepared=[];
    let referenceVmax=0,referenceP1max=0,referencePositive=true;
    for(const eta of etaValues){
      const solution=solveAxisCoefficients(eta,options,pressure.jet,budget),axis=axisEvaluator(solution,options.etaJetOrder+2),reference=buildReference(axis,options,budget);
      const initial=axis.at(reference.X0),p0=reference.at(reference.X0),slopeDefect=p0.p1[0]+2*initial.logFSlope[0];
      for(let i=0;i<=160;i++){
        const X=reference.X0*Math.exp(Math.log(110/reference.X0)*i/160),r=reference.at(X);
        if(!(r.p1[0]>0))referencePositive=false;
        else referenceVmax=Math.max(referenceVmax,r.p1[0]+r.p2[0]**2/r.p1[0]);
        referenceP1max=Math.max(referenceP1max,r.p1[0]);
      }
      prepared.push({eta,axis,reference,slopeDefect});
    }
    if(!referencePositive)throw new ComputeError('INVALID_PROFILE','Reference p1 is not positive at the diagnostic nodes; B.26 input hypotheses fail');
    const kappa0=valid.kappa0??Math.min(.1,.1/referenceVmax,.4/referenceP1max);
    if(!(kappa0>0&&Number.isFinite(kappa0)))throw new ComputeError('PRECISION_REQUIRED','Reference shear bound is outside the finite kappa range');
    const slices=[];
    for(const p of prepared){
      const result=continueSlice(p.axis,p.reference,options,kappa0,budget),samples=[];
      for(let i=0;i<options.samples;i++){
        const X=i===options.samples-1?110:result.X0*Math.exp(Math.log(110/result.X0)*i/(options.samples-1)),row=result.at(X);delete row.state;samples.push(row);
      }
      const atInitial=result.at(result.X0),atEnd=result.at(110);
      const yB=Math.log(100/result.X0),yEnd=Math.log(110/result.X0);
      const diagnosticYs=[0,options.t1/4,options.t1/2,3*options.t1/4,options.t1,1.5*options.t1,2*options.t1,
        yB,yB+options.axialWidth/2,yB+options.axialWidth,yB+options.axialWidth+options.shearWidth/2,
        yB+options.axialWidth+options.shearWidth,yEnd];
      const constructionCheckpoints=diagnosticYs.map(y=>{const r=result.at(result.X0*Math.exp(y));delete r.state;return r;});
      const checkX=100/Math.exp(.3),dy=1e-5,left=result.at(checkX*Math.exp(-dy)),right=result.at(checkX*Math.exp(dy)),center=result.at(checkX);
      const derivativeCheck={X:checkX,
        logarithmicAngularFD:(right.logE-left.logE)/(2*dy),logarithmicAngularRHS:center.derivatives.dYLogE,
        axialFD:(right.U-left.U)/(2*dy),axialRHS:center.derivatives.dYU};
      slices.push({eta:p.eta,samples,constructionCheckpoints,diagnostics:{finiteAxisSlopeDefectAtX0:p.slopeDefect,
        initialStateAgreement:{logE:atInitial.logE-(p.axis.at(result.X0).state[0][0]+.5*Math.log(2*result.X0)),U:atInitial.U-p.axis.at(result.X0).state[1][0]},
        terminalShear:{a:atEnd.a,bs:atEnd.bs,targetA:.8,targetBs:0},
        derivativeCheck,relaxedConePassingSamples:samples.filter(s=>s.cone.relaxed).length,admissibleConePassingSamples:samples.filter(s=>s.cone.admissible).length,
        totalSamples:samples.length,referenceCutoffMethod:p.reference.method,continuationRKNodes:result.nodes.length,
        fullStressFlatFactorCertified:false,continuousQuadratureCertified:false,uniformEtaCertificate:false}});
    }
    const allSamples=slices.flatMap(s=>s.samples);
    return safe({status:'PARTIAL',domainStatus:'SOURCE_CONTROLLED_CONTINUATION_COMPUTED',sourceReferences:[SOURCE],parameters:{...options,etaValues,kappa0},
      inputContract:{axisFamily:'finite nonlinear B.12-B.15 coefficients',pressure:pressure.description,arbitraryCodeAllowed:false},
      construction:'Reference B.22 cutoff and actual B.26 shear-controlled log(phi)/U integration, five forward moment integrals, and final axial/shear transitions before Xi=110.',
      kappaSelection:{mode:valid.kappa0===null?'diagnostic sampled-reference bound':'explicit user value',sampledReferenceVmax:referenceVmax,sampledReferenceP1max:referenceP1max,uniformBoundCertified:false},
      slices,
      certifiedConditions:[{id:'SOURCE_DOMAIN_AND_SUPPORT_INPUTS',pass:true,scope:'Finite input parameter inequalities and transition placement only'},
        {id:'FINITE_POLYNOMIAL_AXIS_MOMENTS',pass:false,scope:'The algebraic finite-polynomial integration is implemented, but this binary64 evaluation has no interval rounding certificate'}],
      computedConditions:[{id:'B22_REFERENCE',pass:true},{id:'B26_CONTROLLED_ODE',pass:true},{id:'FINITE_POLYNOMIAL_AXIS_MOMENTS',pass:true},{id:'B5_TERMINAL_SHEAR',pass:slices.every(s=>s.diagnostics.terminalShear.a===.8&&s.diagnostics.terminalShear.bs===0)}],
      missingConditions:['The finite axis array has no certified nonlinear tail or full source outer-datum binding.',
        'The reference-family Vmax and kappa/t1 selection are sampled diagnostics, not the uniform bounds of Lemma B.4.',
        'RK4 and Hermite realization errors, all eta derivatives, and continuous moments are not interval-certified.',
        'The measured axis slope mismatch prevents asserting the exact B.30 flat stress factor for this finite approximation.',
        'B.8 exact five-moment gluing to the outer profile and C.2 global modulation/restoration remain separate operations.'],
      fullProfileCertified:false,fullNavierStokesSolution:false,
      visualization:{points:allSamples.map(s=>({pos:[s.logX,s.eta,s.logE],value:s.U,label:`B.26 X=${s.X.toPrecision(5)}, eta=${s.eta}`})),
        lines:slices.map(s=>({points:s.samples.map(p=>[p.logX,p.eta,p.logE])})),arrows:[],axes:['log X','η','log E'],
        description:'Computed B.22 reference and B.26 controlled continuation of an explicitly finite nonlinear axis profile.',
        coordinateMeaning:'Similarity-profile coordinates; the height is log of the actual computed angular profile E, not a physical spatial axis.',
        lostInformation:['No certified nonlinear infinite tail or whole-profile witness.','Intermediate curves are numerical reconstructions with stated errors and open conditions.']}});
  }catch(error){return safe({status:error.code==='RESOURCE_LIMIT'?'BUDGET_EXCEEDED':['CANCELLED','PRECISION_REQUIRED','BUDGET_EXCEEDED','UNSUPPORTED'].includes(error.code)?error.code:'FAILED',domainStatus:error.code??'COMPUTATION_ERROR',message:error.message,detail:error.detail??{},sourceReferences:[SOURCE],fullProfileCertified:false});}
}

function getContinuationExamples(){return [
  {id:'ns-controlled-axis',label:'원문 B.22/B.26 · 실제 controlled continuation',request:{kind:'ns.controlled-continuation',input:{etaValues:[0,.2],pressure:{family:'rational',K:10},axis:{Lambda:48,logC:16,axisOrder:10},samples:161},budget:{maxOperations:20000000,maxMilliseconds:30000,maxPoints:2048}}},
  {id:'ns-controlled-source-datum',label:'실제 A.21 압력을 연결한 유한 continuation 후보',request:{kind:'ns.controlled-continuation',input:{etaValues:[0],pressure:{family:'source-outer-A21',parameters:{Md:1,logP:0,lambda:.0002,h:1e-8,logXR:20,Tf:64,co:.005}},axis:{Lambda:48,logC:2,axisOrder:10},samples:161},budget:{maxOperations:40000000,maxMilliseconds:30000,maxPoints:2048}}},
];}

return {validateContinuationInput,runControlledContinuation,getContinuationExamples};
})();
const __m1_30 = (()=>{
/** Exact rational scalar bounds for the actual source A.21 pressure datum.
 * No supplied norm, quadrature value, or theorem-truth flag is accepted.
 * The mathematical target is the unedited ideal schedule, not the numerically
 * repaired field. The full generated analytic premise bundle is not Lean checked.
 */
const {ComputeError,makeBudget} = __m1_16;
const {outerExampleInput} = __m1_28;
const OUTER_SHA='4c0213f892a32611c79655fbe065cebbaca0fc9acdd0cf2dd057d2506a10c087';
const REPO='https://github.com/openai/NavierStokesAndEuler/tree/f9e8bc5b38b6e212696e8a30e3e91517af887bbd';
const sourcePressureAnalyticSources=Object.freeze({repositoryCommit:'f9e8bc5b38b6e212696e8a30e3e91517af887bbd',
  paperSha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',outerSourceSha256:OUTER_SHA,
  references:[{url:REPO,pages:[129,130],locator:'A.5--A.13: step, source schedule, terminal linear ODE'},
    {url:REPO,pages:[133,134],locator:'Lemma A.5, A.21--A.23: positive mixture, holomorphic pressure, domination'},
    {url:REPO,pages:[144,145,146],locator:'B.1--B.4: axis pressure datum and analytic coefficient norm'}]});

function plain(v,name){if(!v||typeof v!=='object'||Array.isArray(v)||Object.getPrototypeOf(v)!==Object.prototype)throw new ComputeError('INVALID_INPUT',`${name} must be a plain JSON object`);}
function only(v,allowed,name){for(const k of Object.keys(v))if(!allowed.includes(k))throw new ComputeError('INVALID_INPUT',`${name}.${k}: unsupported field; supplied norms, masses and truth flags are not accepted`);}
function integer(v,name,lo,hi){if(!Number.isSafeInteger(v)||v<lo||v>hi)throw new ComputeError('INVALID_INPUT',`${name} must be an integer in [${lo},${hi}]`);return v;}

function rationalArithmetic(budget=null){
  const tick=(n=1)=>budget?.tick(n),abs=n=>n<0n?-n:n;
  function gcd(a,b){a=abs(a);b=abs(b);while(b){tick();const t=a%b;a=b;b=t;}return a||1n;}
  function Q(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw new ComputeError('INVALID_INPUT','Zero rational denominator');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
  const add=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d),neg=a=>Q(-a.n,a.d),sub=(a,b)=>add(a,neg(b)),mul=(a,b)=>Q(a.n*b.n,a.d*b.d),div=(a,b)=>Q(a.n*b.d,a.d*b.n);
  const pow=(a,n)=>{tick(n+1);return Q(a.n**BigInt(n),a.d**BigInt(n));},cmp=(a,b)=>a.n*b.d<b.n*a.d?-1:a.n*b.d>b.n*a.d?1:0;
  const min=(a,b)=>cmp(a,b)<=0?a:b,max=(a,b)=>cmp(a,b)>=0?a:b,mag=a=>Q(abs(a.n),a.d);
  const qs=a=>a.d===1n?String(a.n):`${a.n}/${a.d}`,floor=a=>a.n>=0n?a.n/a.d:-((-a.n+a.d-1n)/a.d),ceil=a=>-floor(neg(a));
  function fromNumber(x){
    if(!Number.isFinite(x))throw new ComputeError('INVALID_INPUT','Finite numeric parameters required');
    if(x===0)return Q(0);const buffer=new ArrayBuffer(8),view=new DataView(buffer);view.setFloat64(0,x,false);const b=view.getBigUint64(0,false),e=Number((b>>52n)&2047n);
    let m=b&((1n<<52n)-1n);if(e)m+=1n<<52n;if(b>>63n)m=-m;const shift=(e?e-1023:1-1023)-52;
    return shift>=0?Q(m<<BigInt(shift)):Q(m,1n<<BigInt(-shift));
  }
  function parse(v,name){
    if(typeof v==='number')return fromNumber(v);
    if(typeof v!=='string'||v.length>180)throw new ComputeError('INVALID_INPUT',`${name}: finite number or exact rational/decimal string required`);
    if(/^[-+]?\d+\/\d+$/.test(v)){const [n,d]=v.split('/');return Q(n,d);}
    const m=/^([-+]?)(\d+)(?:\.(\d+))?(?:[eE]([-+]?\d+))?$/.exec(v);
    if(!m)throw new ComputeError('INVALID_INPUT',`${name}: invalid exact rational/decimal string`);
    const exponent=Number(m[4]??0);if(!Number.isSafeInteger(exponent)||Math.abs(exponent)>400)throw new ComputeError('INVALID_INPUT',`${name}: decimal exponent exceeds 400`);
    const frac=m[3]??'',n=BigInt(`${m[1]}${m[2]}${frac}`),power=exponent-frac.length;
    return power>=0?Q(n*10n**BigInt(power)):Q(n,10n**BigInt(-power));
  }
  const number=a=>{const v=Number(a.n)/Number(a.d);if(Number.isFinite(v))return v;const n=abs(a.n).toString(),d=a.d.toString(),kn=Math.min(16,n.length),kd=Math.min(16,d.length);return (a.n<0n?-1:1)*Number(n.slice(0,kn))/Number(d.slice(0,kd))*10**(n.length-kn-d.length+kd);};
  const interval=a=>[a,a],iadd=(a,b)=>[add(a[0],b[0]),add(a[1],b[1])],ineg=a=>[neg(a[1]),neg(a[0])];
  const isub=(a,b)=>iadd(a,ineg(b));
  function imul(a,b){const v=[mul(a[0],b[0]),mul(a[0],b[1]),mul(a[1],b[0]),mul(a[1],b[1])];return [v.reduce(min),v.reduce(max)];}
  function idiv(a,b){if(b[0].n<=0n&&b[1].n>=0n)throw new ComputeError('INVALID_INPUT','Interval denominator contains zero');return imul(a,[div(Q(1),b[1]),div(Q(1),b[0])]);}
  const isq=a=>a[0].n<=0n&&a[1].n>=0n?[Q(0),max(pow(a[0],2),pow(a[1],2))]:[min(pow(a[0],2),pow(a[1],2)),max(pow(a[0],2),pow(a[1],2))];
  const ibox=a=>({lower:qs(a[0]),upper:qs(a[1])});
  return {Q,add,neg,sub,mul,div,pow,cmp,min,max,mag,qs,floor,ceil,fromNumber,parse,number,interval,iadd,ineg,isub,imul,idiv,isq,ibox,tick};
}

function sourcePressureAnalyticExampleInput(){return {parameters:outerExampleInput().parameters,boundBits:128,realWindow:'11/10',tubeRadius:'1/64',coefficientRadiusRatio:'1/16'};}
function normalize(input,budget=null){
  plain(input,'input');only(input,['parameters','boundBits','realWindow','tubeRadius','coefficientRadiusRatio'],'input');
  const R=rationalArithmetic(budget),{Q,parse,cmp,div,mul,qs,fromNumber,number,min,max}=R,defaults=sourcePressureAnalyticExampleInput();
  const supplied=Object.hasOwn(input,'parameters')?input.parameters:defaults.parameters;plain(supplied,'parameters');only(supplied,Object.keys(defaults.parameters),'parameters');
  const original={...defaults.parameters,...supplied},p=Object.fromEntries(Object.entries(original).map(([k,v])=>[k,parse(v,`parameters.${k}`)]));
  const numeric=Object.fromEntries(Object.entries(p).map(([k,v])=>[k,typeof original[k]==='number'?original[k]:number(v)]));
  const ranges={Md:['0.2','4'],logP:['0','100'],lambda:['0.00005','0.005'],h:['1e-12','0.001'],logXR:['0','100'],Tf:['64','512'],co:['0.00001','0.01']};
  for(const [k,[ls,us]] of Object.entries(ranges)){
    // Admit each written decimal endpoint and its actual binary64 endpoint.
    // These comparisons are exact and never evaluate exp(Md) in validation.
    const lo=min(parse(ls,k),fromNumber(Number(ls))),hi=max(parse(us,k),fromNumber(Number(us)));
    if(cmp(p[k],lo)<0||cmp(p[k],hi)>0)throw new ComputeError('INVALID_INPUT',`${k} outside the supported frozen-schedule parameter range`,{lower:qs(lo),upper:qs(hi)});
  }
  // Broad exact inequalities contain every supported binary64 parameter. They
  // are the inequalities used below, so tiny decimal/binary differences never
  // substitute a different real h or an unproved scalar comparison.
  if(!(p.lambda.n>0n&&cmp(p.lambda,Q(1,100))<0&&p.h.n>0n&&cmp(p.h,div(p.lambda,Q(2)))<0&&cmp(p.h,Q(1,100))<0&&p.co.n>0n&&cmp(mul(p.co,p.h),Q(1,100))<0&&p.logP.n>=0n))throw new ComputeError('INVALID_INPUT','Exact source inequalities require 0<h<lambda/2, lambda<1/100, h<1/100, 0<co*h<1/100 and logP>=0');
  const W=parse(input.realWindow??defaults.realWindow,'realWindow'),radius=parse(input.tubeRadius??defaults.tubeRadius,'tubeRadius'),ratio=parse(input.coefficientRadiusRatio??defaults.coefficientRadiusRatio,'coefficientRadiusRatio');
  if(cmp(W,Q(1))<0||cmp(W,Q(2))>0||radius.n<=0n||cmp(radius,Q(1,2))>=0||ratio.n<=0n||cmp(ratio,Q(1,2))>0)throw new ComputeError('INVALID_INPUT','Require 1<=realWindow<=2, 0<tubeRadius<1/2, 0<coefficientRadiusRatio<=1/2');
  const bits=integer(input.boundBits??128,'boundBits',64,256),binding=Object.fromEntries(Object.entries(p).map(([k,v])=>[k,{exact:qs(v),inputKind:typeof original[k]==='number'?'EXACT_BINARY64_VALUE':'EXACT_TEXT_RATIONAL',numericApproximation:numeric[k],numericApproximationIsIdentical:cmp(v,fromNumber(numeric[k]))===0}]));
  return {R,p,W,radius,ratio,bits,binding,normalizedInput:{parameters:Object.fromEntries(Object.entries(p).map(([k,v])=>[k,qs(v)])),boundBits:bits,realWindow:qs(W),tubeRadius:qs(radius),coefficientRadiusRatio:qs(ratio)}};
}
function validateSourcePressureAnalyticInput(input={}){
  try {const a=normalize(input);return {valid:true,normalizedInput:a.normalizedInput,parametersExact:a.normalizedInput.parameters,parameterHExact:a.R.qs(a.p.h),inputBinding:a.binding,analyticComputationPerformed:false};}
  catch(e){return {valid:false,status:e.code??'INVALID_INPUT',message:e.message,detail:e.detail??{},analyticComputationPerformed:false};}
}

function exponentialEncloser(R,bits){
  const {Q,add,sub,mul,div,pow,cmp,neg,qs,floor,ceil,tick,ibox}=R,one=Q(1),scale=1n<<BigInt(bits),traces=[],cache=new Map();
  const down=a=>Q(floor(mul(a,Q(scale))),scale),up=a=>Q(ceil(mul(a,Q(scale))),scale);
  function exp(x){
    const key=qs(x);if(cache.has(key))return cache.get(key);
    if(x.n<0n){const pos=exp(neg(x)),v=[div(one,pos[1]),div(one,pos[0])];cache.set(key,v);traces.push({argument:key,enclosure:ibox(v),method:'Exact rational reciprocal of a positive exponential enclosure'});return v;}
    if(cmp(x,Q(220))>0)throw new ComputeError('RESOURCE_LIMIT','Exponential argument exceeds supported 220');
    let small=x,k=0;while(cmp(small,Q(1,8))>0){tick();small=div(small,Q(2));k++;}
    const N=24;let term=one,sum=one;
    for(let n=1;n<=N;n++){tick(10);term=div(mul(term,small),Q(n));sum=add(sum,term);}
    const next=div(mul(term,small),Q(N+1)),ratio=div(small,Q(N+2)),tail=div(next,sub(one,ratio));
    let v=[down(sum),up(add(sum,tail))];const smallBox=ibox(v),squares=[];
    for(let n=0;n<k;n++){tick(10);v=[down(pow(v[0],2)),up(pow(v[1],2))];squares.push(ibox(v));}
    const trace={argument:key,enclosure:ibox(v),method:'Positive finite Taylor sum plus geometric remainder, followed by outward dyadic squaring',
      reducedArgument:qs(small),rangeReductionPowerOfTwo:k,termsThrough:N,scaleBits:bits,smallPartialSum:qs(sum),firstOmittedTerm:qs(next),tailRatioUpper:qs(ratio),tailUpper:qs(tail),smallEnclosure:smallBox,squaringEnclosures:squares};
    traces.push(trace);cache.set(key,v);return v;
  }
  return {exp,traces};
}

function buildProducer(input,budget){
  const a=normalize(input,budget),{R,p,bits,W,radius,ratio}=a,{Q,add,sub,mul,div,pow,cmp,min,max,mag,neg,qs,floor,ceil,parse,number,interval,iadd,ineg,isub,imul,idiv,isq,ibox,tick}=R;
  const z=Q(0),one=Q(1),two=Q(2),E=exponentialEncloser(R,bits),rho=mul(p.co,p.h),oneMinusRho=sub(one,rho),foFactor=div(one,pow(oneMinusRho,2));
  const expOne=E.exp(one);if(cmp(expOne[0],two)<=0||cmp(expOne[1],Q(3))>=0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Exact exp(1) comparison did not prove 2<e<3');
  const pSquared=E.exp(mul(two,p.logP)),initialExp=E.exp(Q(1,5)),endpointExp=E.exp(Q(-2,5));
  const massShapeUpper=add(mul(Q(5,2),initialExp[1]),mul(Q(1,2),mul(endpointExp[1],foFactor)));
  const innerLo=mul(Q(5,2),pSquared[0]),innerHi=mul(Q(5,2),pSquared[1]);
  const totalLo=innerLo,totalHi=mul(massShapeUpper,pSquared[1]);
  const pulseExponent=div(Q(13),p.lambda),tailBits=Number(min(Q(512),Q(floor(pulseExponent))).n);
  if(tailBits<1)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','No positive exact mixed-tail decay exponent');
  const mixedTail=mul(mul(Q(1,2),pSquared[1]),mul(foFactor,Q(1,1n<<BigInt(tailBits))));

  // Establish a finite positive terminal waiting interval without evaluating
  // the original ODE numerically. h<.01 and e<3 imply log(1/h)>4.
  const q0=div(sub(p.lambda,p.h),sub(one,p.lambda)),oneMinusH=sub(one,p.h);
  const qFirstLo=mul(E.exp(neg(sub(one,p.lambda)))[0],q0),qFirstHi=add(q0,oneMinusH);
  const holdLo=Q(16),holdHi=mul(Q(4),sub(div(one,p.h),one));
  const qHoldLo=add(qFirstLo,mul(oneMinusH,holdLo)),qHoldHi=add(qFirstHi,mul(oneMinusH,holdHi));
  const qBeforeLo=mul(E.exp(neg(div(oneMinusH,two)))[0],qHoldLo),qBeforeHi=add(qHoldHi,oneMinusH);
  const qpFactor=div(rho,oneMinusRho),qpLo=mul(qpFactor,E.exp(oneMinusH)[0]),qpHi=mul(qpFactor,E.exp(mul(Q(3),oneMinusH))[1]);
  if(qpLo.n<=0n||cmp(qBeforeLo,qpHi)<=0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Source terminal waiting interval positivity was not established from analytic bounds');
  const waitUpper=div(sub(div(qBeforeHi,qpLo),one),oneMinusH);

  const tdExp=E.exp(p.Md),td=[add(tdExp[0],Q(10)),add(tdExp[1],Q(10))],hThresholdLo=E.exp(neg(td[1]))[0],hThresholdHi=E.exp(neg(td[0]))[1];
  const checkLargeP=cmp(p.logP,td[1])>0?'PROVED':cmp(p.logP,td[0])<=0?'DISPROVED':'UNDECIDED';
  const checkSmallH=cmp(p.h,hThresholdLo)<0?'PROVED':cmp(p.h,hThresholdHi)>=0?'DISPROVED':'UNDECIDED';

  function realBounds(etaBox){
    if(!Array.isArray(etaBox)||etaBox.length!==2)throw new ComputeError('INVALID_INPUT','etaBox must have two exact rational endpoints');
    const box=etaBox.map((v,i)=>parse(v,`etaBox[${i}]`));if(cmp(box[0],box[1])>0||cmp(box[0],neg(W))<0||cmp(box[1],W)>0)throw new ComputeError('INVALID_INPUT','Real interval lies outside the certified coefficient window');
    tick(200);const F=iadd(interval(one),isq(box)),f2=[div(one,pow(F[1],2)),div(one,pow(F[0],2))],f3=[div(one,pow(F[1],3)),div(one,pow(F[0],3))];
    const simpleP=[neg(totalHi),neg(mul(totalLo,f2[0]))],J=[mul(innerLo,f3[0]),div(totalHi,F[0])],simplePrime=imul(imul(interval(Q(4)),box),J);
    // P=-C/F^2 plus a nonpositive mixed-theta remainder on the real line.
    const tailPressure=mul(mixedTail,sub(one,f2[0]));
    const improvedP=[neg(add(mul(totalHi,f2[1]),tailPressure)),neg(mul(totalLo,f2[0]))];
    // Pprime=4 eta C/F^3 plus a mixed-tail remainder of magnitude <=4|eta| T/Fmin.
    const maxEta=max(mag(box[0]),mag(box[1])),tailDerivative=div(mul(Q(4),mul(maxEta,mixedTail)),F[0]);
    const mainPrime=imul(imul(interval(Q(4)),box),imul([totalLo,totalHi],f3)),improvedPrime=iadd(mainPrime,[neg(tailDerivative),tailDerivative]);
    const intersection=(x,y)=>{const v=[max(x[0],y[0]),min(x[1],y[1])];if(cmp(v[0],v[1])>0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Independent source pressure enclosures have empty intersection');return v;};
    return {eta:ibox(box),P:ibox(intersection(simpleP,improvedP)),Pprime:ibox(intersection(simplePrime,improvedPrime)),
      F:ibox(F),positiveDerivativeIntegral:ibox(J),simpleMixtureBounds:{P:ibox(simpleP),Pprime:ibox(simplePrime)},
      mixedRemainderUpper:{pressure:qs(tailPressure),derivative:qs(tailDerivative)},wholeInputInterval:true,
      method:'Exact rational interval propagation from the positive mixture, known theta=1 inner mass, and an analytic upper bound on the mixed-theta suffix.'};
  }
  function complexBounds(options={}){
    plain(options,'complex options');only(options,['realWindow','tubeRadius'],'complex options');const w=options.realWindow===undefined?W:parse(options.realWindow,'realWindow'),r=options.tubeRadius===undefined?radius:parse(options.tubeRadius,'tubeRadius');
    if(cmp(w,one)<0||cmp(w,W)>0||r.n<=0n||cmp(r,Q(1,2))>=0)throw new ComputeError('INVALID_INPUT','Complex request needs 1<=realWindow<=the coefficient window and 0<tubeRadius<1/2');
    tick(100);const delta=sub(one,pow(r,2)),absZ=add(w,r),P=div(totalHi,pow(delta,2)),Pd=div(mul(Q(4),mul(absZ,totalHi)),pow(delta,3));
    return {realWindow:qs(w),tubeRadius:qs(r),domain:'dist(z,[-W,W]) < tubeRadius',denominatorRealPartLower:qs(delta),denominatorAbsLower:qs(delta),absZUpper:qs(absZ),
      pressureAbsUpper:qs(P),pressureDerivativeAbsUpper:qs(Pd),branch:'Principal Log on Re(1+z^2)>0',
      nonintegerPowerDefinition:'(1+z^2)^(-2 theta)=exp(-2 theta PrincipalLog(1+z^2))',thetaInterval:['0','1'],
      domination:{measure:'dmu(y)=E_id,sched(y,0)^2 dy/2, positive and finite',integrandAbsUpper:qs(div(one,pow(delta,2))),
        derivativeIntegrandAbsUpper:qs(div(mul(Q(4),absZ),pow(delta,3))),massUpper:qs(totalHi),independentOfY:true},
      analyticJustification:'For z=x+iv in the tube, Re(1+z^2)=1+x^2-v^2>1-r^2. Principal Log is holomorphic there. These y-independent majorants are integrable against finite mu, so the holomorphic integral and differentiation under the integral are valid.',
      quadratureUsed:false,exactRationalScalarBounds:true,fullPremiseBundleLeanChecked:false};
  }
  function bindAxisH(value){
    try {const actual=parse(value,'axis.h'),same=cmp(actual,p.h)===0;return {matches:same,parameterHExact:qs(p.h),axisHExact:qs(actual),status:same?'EXACT_H_MATCH':'AXIS_H_MISMATCH'};}
    catch(e){return {matches:false,parameterHExact:qs(p.h),axisHExact:null,status:e.code??'INVALID_INPUT',message:e.message};}
  }
  const cb=complexBounds(),cauchyRadius=div(radius,two),coefficientRadius=mul(cauchyRadius,ratio),loss=div(add(one,ratio),pow(sub(one,ratio),3));
  const cauchyDelta=sub(one,pow(radius,2)),rawPUpper=div(totalHi,pow(cauchyDelta,2)),rawPdUpper=div(mul(Q(4),mul(add(W,radius),totalHi)),pow(cauchyDelta,3));
  const pNorm=ceil(mul(rawPUpper,loss)),pdNorm=ceil(mul(rawPdUpper,loss));
  // These are certified interval observations, not sampled point evaluations
  // of the defining integral. Keep their exact numerators/denominators in the
  // table; binary64 coordinates are display-only projections of that table.
  if(budget.maxPoints<51)throw new ComputeError('RESOURCE_LIMIT','The fixed pressure visualization needs 51 point/line vertices',{requiredVertices:51,maxPoints:budget.maxPoints});
  const internalQ=s=>{const [n,d='1']=s.split('/');return Q(n,d);};
  const observed=[],points=[],lowerLine=[],upperLine=[];
  for(let k=0;k<=16;k++){
    tick(100);const eta=Q(k-8,8),b=realBounds([qs(eta),qs(eta)]),raw=[internalQ(b.P.lower),internalQ(b.P.upper)],normalized=idiv(raw,pSquared);
    const center=div(add(normalized[0],normalized[1]),two),halfWidth=div(sub(normalized[1],normalized[0]),two),e=number(eta),c=number(center),w=number(halfWidth);
    if(![e,c,w,number(normalized[0]),number(normalized[1])].every(Number.isFinite))throw new ComputeError('PRECISION_REQUIRED','A pressure display coordinate is not finite');
    observed.push({eta:qs(eta),P:b.P,Pprime:b.Pprime,normalizedPressure:ibox(normalized),normalizedCenter:qs(center),normalizedHalfWidth:qs(halfWidth),normalizer:'mass.pStarSquared',method:'Exact interval division of raw P by the positive enclosure of exp(2 logP).'});
    points.push({pos:[e,c,w],value:c,label:`eta=${qs(eta)}; P/P*^2 certified interval center; height=half-width`});
    lowerLine.push([e,number(normalized[0]),0]);upperLine.push([e,number(normalized[1]),0]);
  }
  const certificate={schema:'MathScope.Navier.SourcePressureAnalyticCertificate/1',status:'VERIFIED_ANALYTIC_PRESSURE_BOUND_CERTIFICATE',evidenceGrade:'EXACT_RATIONAL_BOUNDS_WITH_ANALYTIC_THEOREM_ARGUMENT',
    target:'Actual A.21 unedited ideal scheduled pressure datum',pressureFamily:'source-outer-A21',pressureFormula:'P(z)=-integral (1+z^2)^(-2 theta(y)) dmu(y)',
    thetaInterval:['0','1'],normalizedInput:a.normalizedInput,parametersExact:a.normalizedInput.parameters,parameterHExact:qs(p.h),inputBinding:a.binding,
    totalMassLower:qs(totalLo),totalMassUpper:qs(totalHi),innerThetaOneMassLower:qs(innerLo),innerThetaOneMassUpper:qs(innerHi),
    innerThetaOneMass:{exactExpression:`(5/2)*exp(${qs(mul(two,p.logP))})`,lower:qs(innerLo),upper:qs(innerHi),theta:'1',support:'y<=0',isRationalValueClaim:false},
    mass:{definition:'C=(1/2) integral_R E_id,sched(y,0)^2 dy',pStarSquared:{exactExpression:`exp(${qs(mul(two,p.logP))})`,...ibox(pSquared)},
      lower:qs(totalLo),upper:qs(totalHi),normalizedUpper:qs(massShapeUpper),normalizedUpperApproximation:number(massShapeUpper),
      initialUnitUpper:'P*^2 (exp(1/5)-1)*(5/2)',initialEndpointIdentity:'E_id,sched(1,0)=P* exp(-1/5)',
      allLaterEnvelope:'E_id,sched(y,0)^2 <= P*^2 exp(-2/5) exp(-(y-1))/(1-rho_o)^2 for every y>=1',
      totalUpperFormula:'C/P*^2 <= (5/2)exp(1/5)+(1/2)exp(-2/5)/(1-rho_o)^2',
      proof:'On 0<=y<=1, 0<=integral_0^y sigma<=y and E=P*exp(y/10-(3/5)integral sigma). Step symmetry gives integral_0^1 sigma=1/2. Every later constant/transition segment has l<=0 before the terminal collar, and the collar multiplies the reference exponential by at most 1/(1-rho_o). Integrating the two infinite exponential envelopes gives the stated finite bound.',
      bothInfiniteEndsIncluded:true,finiteCutoffUsed:false,quadratureUsed:false},
    mixedThetaSuffix:{definition:'Positive measure of y after the axial pulse; the earlier part has theta=1',upper:qs(mixedTail),
      exponentialUpper:'mu_mixed <= P*^2 exp(-13/lambda)/(2(1-rho_o)^2)',rationalDecayBits:tailBits,rationalDecayUpper:qs(Q(1,1n<<BigInt(tailBits))),
      proof:'At pulse end E(0)^2<=P*^2 exp(-13/lambda). The later envelope integrates to at most 1/[2(1-rho_o)^2]. Since 2<e and k<=13/lambda, exp(-13/lambda)<=2^(-k); k is capped at 512 conservatively, never set to infinity.',nonzeroUpperRetained:true},
    scheduleExistence:{terminalQBeforeWait:{lower:qs(qBeforeLo),upper:qs(qBeforeHi)},terminalQp:{lower:qs(qpLo),upper:qs(qpHi)},
      wait:{strictlyPositive:true,finiteUpper:qs(waitUpper),formula:'wait=log(Q_before/Qp)/(1-h)'},
      inequalities:{qBeforeLowerGreaterThanQpUpper:true,positiveQpLower:true,positiveFo:oneMinusRho.n>0n},
      proof:'Linear ODE integrating-factor comparisons; the hold length 4 log(1/h) is between 16 and 4(1/h-1); the flattening loss is at most exp(-(1-h)/2). Qp lies between rho exp(1-h)/(1-rho) and rho exp(3(1-h))/(1-rho), since sigma prime integrates to one.',numericalODEUsed:false},
    sourceParameterContract:{necessaryLogPGreaterThanTd:checkLargeP,necessaryHBelowExpMinusTd:checkSmallH,twiceHLessThanLambda:true,
      fullSufficientlySmallLargeOrderCertified:false,reason:'The source pressure is well defined and bounded for these finite parameters; the full A.6 choices needed for the complete corrected profile are separate.'},
    realBounds:realBounds(['-1','1']),complexBounds:cb,
    observations:{kind:'EXACT_INTERVAL_ENCLOSURES_OF_A21_TARGET',sampleCount:17,etaWindow:['-1','1'],samples:observed,
      normalization:{exactExpression:`P*^2=exp(${qs(mul(two,p.logP))})`,...ibox(pSquared),appliedBy:'Exact rational interval division; the exponential is not treated as a rational exact value.'},
      intervalsContainEntirePointValue:true,displayCoordinatesApproximate:true},
    visualization:{points,lines:[{points:lowerLine},{points:upperLine}],arrows:[],axes:['eta','certified P/P*^2 interval center','certified normalized interval half-width'],
      description:'Seventeen certified A.21 target-pressure enclosures; lower and upper boundary curves lie in the zero-height plane.',
      coordinateMeaning:'The horizontal axis is eta. The second coordinate is the center of an exact normalized pressure enclosure; the third is its half-width. These are interval-graph coordinates, not a spatial fluid field or an evaluated exact pressure curve. P/P*^2 is enclosed by dividing the raw P enclosure by a separately enclosed positive exp(2 logP).',
      lostInformation:['Only 17 interval observations are drawn; whole-eta validity comes from the analytic inequalities, not interpolation of these points.','The exact target value inside each enclosure is not computed.','Plot coordinates are approximate binary64 values; exact raw and normalized rational intervals remain in observations.samples.','Exact equality of this target pressure with the numerically repaired outer field remains unproved.']},
    coefficientNorm:{realCoefficientWindow:[qs(neg(W)),qs(W)],cauchyRadius:qs(cauchyRadius),coefficientRadius:qs(coefficientRadius),radiusRatio:qs(ratio),radiusLoss:qs(loss),
      pressureNormUpper:String(pNorm),pressureDerivativeNormUpper:String(pdNorm),allEtaDerivativeOrders:true,
      derivativeConvention:'Actual derivatives; |P^(m)| <= m! M/r^m, not just Taylor coefficients',
      B_rhoFormula:'For radial degree zero: norm <= M sum_(m>=0)(m+1)^2 q^m = M(1+q)/(1-q)^3, q=rho/r<1',
      derivativeBoundFormula:'|P^(m)(eta)|<=m!*pressureAbsUpper/cauchyRadius^m on the real coefficient window'},
    exponentialAudit:E.traces,
    gates:{positiveFiniteMixtureMass:true,wholeEtaRealBounds:true,principalLogBranchSeparated:true,integrableHolomorphicMajorants:true,
      pressureDerivativeUnderIntegral:true,allEtaCauchyBounds:true,callerSuppliedNormAccepted:false,quadratureTruthAccepted:false,
      exactPressureEqualityWithRepairedE:false,existingFiniteJetsCertified:false,globalWitness:false,fullOriginalParameterOrder:false,fullPremiseBundleLeanChecked:false},
    proofBoundary:{arithmetic:'Exact BigInt rational operations and outward dyadic exponential enclosures',analytic:'Source formula identities and the stated positive-mixture/dominated-holomorphic-integral/Cauchy arguments',
      lean:'This generated analytic premise bundle has not been exported as a Lean proof. Existing scalar Lean targets do not automatically certify it.',
      repairedField:'The actual analytic A.21 target is now bounded; exact pressure/moment equality for the numerical repaired E remains unproved.'},sources:sourcePressureAnalyticSources};
  return {certificate,parameterHExact:qs(p.h),realBounds,complexBounds,bindAxisH};
}

/** Internal adapter factory: recomputes all bounds from source parameters. */
function createSourcePressureAnalyticProducer(input={},budget=makeBudget()){budget.tick();return buildProducer(input,budget);}
/** JSON-only high-level operation. */
function certifySourcePressureAnalytic(input={},budget=makeBudget()){
  try{return createSourcePressureAnalyticProducer(input,budget).certificate;}
  catch(e){return {schema:'MathScope.Navier.SourcePressureAnalyticCertificate/1',status:e.code??'COMPUTATION_ERROR',message:e.message,detail:e.detail??{},evidenceGrade:'NO_CERTIFICATE',gates:{globalWitness:false,exactPressureEqualityWithRepairedE:false,fullPremiseBundleLeanChecked:false}};}
}

return {sourcePressureAnalyticSources,sourcePressureAnalyticExampleInput,validateSourcePressureAnalyticInput,createSourcePressureAnalyticProducer,certifySourcePressureAnalytic};
})();
const __m1_31 = (()=>{
// Generated by derive-axis-source.py from a SHA-pinned rational-datum module.
const {ComputeError,makeBudget} = __m1_16;
const {createSourcePressureAnalyticProducer,validateSourcePressureAnalyticInput} = __m1_30;
const {outerExampleInput} = __m1_28;
/** Exact upper-bound certificates for the actual Appendix-B coefficient space.
 * All arithmetic deciding a certificate is rational/BigInt. Plot coordinates are
 * explicitly approximate. This does not identify the datum with the completed
 * outgoing schedule, and does not identify an existing finite eta jet with the
 * fixed point. No caller-supplied norm, tail or theorem-truth flag is accepted.
 */
const axisSourceCertificateSources = Object.freeze({
  repositoryCommit:'f9e8bc5b38b6e212696e8a30e3e91517af887bbd',
  paper:{sha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',pages:[144,145,146,147,148,157],equations:['B.1','B.2','B.4','B.5','B.9','B.10','B.11','B.12','B.14','B.15','B.16','B.40']},
  originalTheorems:[
    {file:'AxisOperators.lean',names:['norm_product_le','norm_average_le','norm_primitive_le','norm_regularInverse_le','norm_parameterPrimitive_le','norm_mulY_le','norm_inverseMixed_le','norm_inverseParamProduct_le','norm_inverseDotProduct_le']},
    {file:'AxisResolvent.lean',names:['naturalOperator_pow_bound','naturalResolvent_norm_le']},
    {file:'AxisContraction.lean',names:['exists_fixedPoint_of_controlled','norm_naturalRemainder_le','naturalRemainder_sub_le','exists_unique_natural_fixedPoint']},
    {file:'AnalyticCoefficientBounds.lean',names:['cauchy_bound_le_weight','normalizedExp_unitHolomorphic']},
    {file:'NaturalAxisData.lean',names:['exists_root_with_positive_Z','low_Z_has_H_margin','exists_sigma']},
    {file:'NaturalAxisBridge.lean',names:['exists_scaled_profiles']}
  ].map(x=>({...x,url:`https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/${x.file}`}))
});

const abs=n=>n<0n?-n:n;
function gcd(a,b){a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t;}return a||1n;}
function Q(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw new ComputeError('INVALID_INPUT','Zero rational denominator');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
const add=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d);
const neg=a=>Q(-a.n,a.d);
const sub=(a,b)=>add(a,neg(b));
const mul=(a,b)=>Q(a.n*b.n,a.d*b.d);
const div=(a,b)=>Q(a.n*b.d,a.d*b.n);
const pow=(a,n)=>Q(a.n**BigInt(n),a.d**BigInt(n));
const cmp=(a,b)=>a.n*b.d<b.n*a.d?-1:a.n*b.d>b.n*a.d?1:0;
const min=(a,b)=>cmp(a,b)<=0?a:b;
const max=(a,b)=>cmp(a,b)>=0?a:b;
const mag=a=>Q(abs(a.n),a.d);
const z=Q(0),one=Q(1),two=Q(2);
const ceil=a=>a.n>=0n?(a.n+a.d-1n)/a.d:a.n/a.d;
const qs=a=>a.d===1n?String(a.n):`${a.n}/${a.d}`;
const qi=a=>({numerator:String(a.n),denominator:String(a.d),exact:qs(a)});
function asNumber(a){if(!a.n)return 0;const n=abs(a.n).toString(),d=a.d.toString(),kn=Math.min(16,n.length),kd=Math.min(16,d.length);return (a.n<0n?-1:1)*(Number(n.slice(0,kn))/Number(d.slice(0,kd)))*10**(n.length-kn-d.length+kd);}
function log10q(a){if(a.n<=0n)return null;const f=n=>{const s=n.toString(),k=Math.min(15,s.length);return s.length-k+Math.log10(Number(s.slice(0,k)));};return f(a.n)-f(a.d);}
const nonnegative=a=>a.n>=0n;
const positive=a=>a.n>0n;
function parse(v,name){
  if(typeof v==='number'){if(!Number.isSafeInteger(v))throw new ComputeError('INVALID_INPUT',`${name}: exact constants must be safe integers or rational strings`);return Q(BigInt(v));}
  if(typeof v!=='string'||v.length>600||!/^[-+]?(?:\d+(?:\.\d+)?|\d+\/\d+)$/.test(v))throw new ComputeError('INVALID_INPUT',`${name}: use an exact rational or decimal string`);
  if(v.includes('/')){const [a,b]=v.split('/');return Q(BigInt(a),BigInt(b));}
  if(v.includes('.')){let [a,b]=v.split('.');const sign=a.startsWith('-')?-1n:1n;return Q(BigInt(a)*10n**BigInt(b.length)+sign*BigInt(b),10n**BigInt(b.length));}
  return Q(BigInt(v));
}
function integer(v,name,lo,hi){if(!Number.isSafeInteger(v)||v<lo||v>hi)throw new ComputeError('INVALID_INPUT',`${name} must be an integer in [${lo},${hi}]`);return v;}
function object(v,name){if(!v||typeof v!=='object'||Array.isArray(v)||Object.getPrototypeOf(v)!==Object.prototype)throw new ComputeError('INVALID_INPUT',`${name} must be a plain JSON object`);}
function keys(v,allowed,name){for(const k of Object.keys(v))if(!allowed.includes(k))throw new ComputeError('INVALID_INPUT',`${name}: unsupported field ${k}; unverified norm/tail claims are not accepted`);}
// Internal producer output may contain more digits than a public input string.
// It is parsed separately so the public input-size contract stays unchanged.
function parseBound(v,name){
  if(typeof v!=='string'||v.length>4096||!/^[-+]?\d+(?:\/\d+)?$/.test(v))
    throw new ComputeError('PRECISION_REQUIRED',`${name}: generated rational enclosure exceeds the supported scalar size`);
  const [n,d='1']=v.split('/');return Q(BigInt(n),BigInt(d));
}
function normalize(input,budget=null){
  object(input,'input');
  keys(input,['pressure','h','j0','sigmaMode','lambdaMode','lambdaMultiplier','coefficientRadiusRatio','tailDegree','radialDerivativeOrder','etaDerivativeOrder','sampleEta','sampleCount','maxY','boundBits'],'input');
  const pressure=input.pressure??{family:'source-outer-A21',parameters:outerExampleInput().parameters};
  object(pressure,'pressure');keys(pressure,['family','parameters'],'pressure');
  if(pressure.family!=='source-outer-A21')throw new ComputeError('UNSUPPORTED_PRESSURE_DATUM','This certificate requires the actual A.21 target pressure producer. Caller-supplied masses, norms and truth flags are not accepted.');
  const bits=integer(input.boundBits??128,'boundBits',64,256);
  const sourceInput={parameters:pressure.parameters??outerExampleInput().parameters,boundBits:bits};
  const checked=validateSourcePressureAnalyticInput(sourceInput);
  if(!checked.valid)throw new ComputeError(checked.status??'INVALID_INPUT',checked.message??'A.21 pressure source input was rejected',checked.detail??{});
  const sourceH=parse(checked.parameterHExact,'source pressure h');
  const h=parse(input.h??checked.parameterHExact,'h'),j=parse(input.j0??'3/100','j0');
  if(cmp(h,sourceH)!==0)throw new ComputeError('AXIS_H_MISMATCH','Axis h must equal the exact h of the actual A.21 target pressure',{parameterHExact:qs(sourceH),axisHExact:qs(h)});
  if(!positive(h)||cmp(h,Q(1,100))>0||!positive(j)||cmp(j,Q(1,20))>0)throw new ComputeError('INVALID_INPUT','Require 0<h<=1/100 and 0<j0<=1/20');
  if((input.sigmaMode??'computed-cutoff')!=='computed-cutoff'||(input.lambdaMode??'computed-threshold')!=='computed-threshold')throw new ComputeError('INVALID_INPUT','sigma and Lambda are selected from derived bounds, not caller thresholds');
  const ratio=parse(input.coefficientRadiusRatio??'1/16','coefficientRadiusRatio'),eta=parse(input.sampleEta??'1/5','sampleEta'),Y=parse(input.maxY??'41/10','maxY');
  if(!positive(ratio)||cmp(ratio,Q(1,2))>0||cmp(mag(eta),one)>0||!positive(Y)||cmp(Y,Q(41,10))>0)throw new ComputeError('INVALID_INPUT','Require 0<coefficientRadiusRatio<=1/2, |sampleEta|<=1, 0<maxY<=41/10');
  const N=integer(input.tailDegree??24,'tailDegree',2,128),kr=integer(input.radialDerivativeOrder??2,'radialDerivativeOrder',0,4),ke=integer(input.etaDerivativeOrder??2,'etaDerivativeOrder',0,4);
  if(N<kr)throw new ComputeError('INVALID_INPUT','tailDegree must be at least radialDerivativeOrder');
  const a={h,j,ratio,eta,Y,N,kr,ke,bits,multiplier:integer(input.lambdaMultiplier??2,'lambdaMultiplier',1,1024),samples:integer(input.sampleCount??17,'sampleCount',3,65),sourceInput,parameterHExact:qs(sourceH)};
  // Validation has no transcendental quadrature or analytic certificate run.
  if(!budget)return a;
  const producer=createSourcePressureAnalyticProducer(sourceInput,budget),c=producer.certificate;
  const binding=producer.bindAxisH(qs(h));
  if(!binding.matches)throw new ComputeError('AXIS_H_MISMATCH','A.21 pressure and axis use different exact h',binding);
  const K=parseBound(c.totalMassUpper,'A.21 total mass upper bound');
  const inner=parseBound(c.innerThetaOneMassLower,'A.21 theta-one mass lower bound');
  if(cmp(inner,Q(4))<0)throw new ComputeError('UNSUPPORTED_PRESSURE_SIZE','The supported axis branch requires its derived theta-one mass lower bound to be at least 4. No user mass assertion can replace it.');
  if(K.n.toString().length>600||K.d.toString().length>600)throw new ComputeError('PRECISION_REQUIRED','A.21 mass enclosure exceeds the supported exact integer size');
  return {...a,K,producer,binding};
}
function validateAxisSourceInput(input={}){
  try{const a=normalize(input);return {valid:true,pressureFamily:'source-outer-A21',parameterHExact:a.parameterHExact,exactInput:{h:qs(a.h),j0:qs(a.j)},scope:'Structural and exact input binding checks; analytic bounds are produced by the budgeted run.'};}
  catch(e){return {valid:false,status:e.code??'INVALID_INPUT',message:e.message,detail:e.detail??{}};}
}

const box=a=>[a,a];
const iadd=(a,b)=>[add(a[0],b[0]),add(a[1],b[1])];
const ineg=a=>[neg(a[1]),neg(a[0])];
const isub=(a,b)=>iadd(a,ineg(b));
function imul(a,b){const v=[mul(a[0],b[0]),mul(a[0],b[1]),mul(a[1],b[0]),mul(a[1],b[1])];return [v.reduce(min),v.reduce(max)];}
function isq(a){if(a[0].n<=0n&&a[1].n>=0n)return [z,max(pow(a[0],2),pow(a[1],2))];return [min(pow(a[0],2),pow(a[1],2)),max(pow(a[0],2),pow(a[1],2))];}
function idiv(a,b){if(b[0].n<=0n&&b[1].n>=0n)throw new ComputeError('PRECISION_REQUIRED','Rational interval divisor includes zero');return imul(a,[div(one,b[1]),div(one,b[0])]);}
const iscale=(a,k)=>imul(a,box(k));
const ibox=a=>({lower:qs(a[0]),upper:qs(a[1])});
const absLower=a=>a[0].n>0n?a[0]:a[1].n<0n?neg(a[1]):z;
function realData(a,e){
  const D=sub(Q(1,2),a.h),A=add(Q(1,2),a.h),d=isub(box(one),isq(e)),U=iadd(iscale(e,Q(4)),box(a.j)),H=iadd(iscale(e,D),imul(d,U));
  const pressure=a.producer.realBounds([qs(e[0]),qs(e[1])]);
  const P=[parseBound(pressure.P.lower,'P lower'),parseBound(pressure.P.upper,'P upper')],Pd=[parseBound(pressure.Pprime.lower,'Pprime lower'),parseBound(pressure.Pprime.upper,'Pprime upper')];
  const Z=iadd(isub(isub(iscale(imul(isub(box(one),iscale(imul(e,U),two)),U),neg(A)),iscale(H,Q(4))),imul(d,Pd)),iscale(imul(e,P),mul(Q(4),A)));
  return {H,Z,P,Pd};
}
function cutoffCertificate(a,budget){
  const delta=div(a.j,Q(10)),queue=[[neg(one),one]],leaves=[];let margin=null;
  while(queue.length){
    budget.tick(100);if(queue.length+leaves.length>budget.maxPoints)throw new ComputeError('RESOURCE_LIMIT','All-eta interval cover exceeds maxPoints');
    const e=queue.pop(),v=realData(a,e),excluded=cmp(absLower(v.Z),delta)>0,Hsq=isq(v.H);
    if(excluded||positive(Hsq[0])){leaves.push({eta:ibox(e),Z:ibox(v.Z),H2:ibox(Hsq),reason:excluded?'abs(Z)>delta':'H2>=positive-margin'});if(!excluded)margin=margin===null?Hsq[0]:min(margin,Hsq[0]);}
    else {const mid=div(add(e[0],e[1]),two);if(cmp(sub(e[1],e[0]),Q(1,1n<<80n))<0)throw new ComputeError('PRECISION_REQUIRED','Root/low-Z separation requires a finer validated cover');queue.push([mid,e[1]],[e[0],mid]);}
  }
  if(margin===null)margin=one;
  const sigma=div(min(one,margin),Q(20));
  if(cmp(pow(sigma,2),div(margin,Q(400)))>0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Cutoff inequality failed');
  return {sigma,delta,margin,record:{domain:['-1','1'],delta:qs(delta),positiveH2Margin:qs(margin),sigma:qs(sigma),sigmaSquared:qs(pow(sigma,2)),chiLowerOnLowZ:'400/401',chiLowerGreaterThan:'99/100',cells:leaves,coveredWholeInterval:true,method:'Exact rational interval subdivision covers every eta; each cell either excludes |Z|<=delta or proves H^2>=m. sigma=min(1,m)/20.'}};
}
function complexBounds(a,sigma,r){
  const W=Q(11,10),t=mul(two,r),Z=add(W,t),D=sub(Q(1,2),a.h),A=add(Q(1,2),a.h);
  const Hreal=add(add(mul(Q(4),pow(W,3)),mul(a.j,pow(W,2))),add(mul(sub(Q(9,2),a.h),W),a.j));
  const Hd=mul(t,add(add(mul(Q(4),add(add(mul(Q(3),pow(W,2)),mul(Q(3),mul(W,t))),pow(t,2))),mul(a.j,add(mul(two,W),t))),sub(Q(9,2),a.h)));
  const Hup=add(Hreal,Hd),qdev=mul(Hd,add(mul(two,Hreal),Hd)),s2=pow(sigma,2),qlo=sub(s2,qdev);
  const fdev=mul(t,add(mul(two,W),t)),flo=sub(one,fdev),Llo=sub(sub(one,mul(mul(two,a.h),pow(W,2))),mul(mul(two,a.h),fdev));
  if(!positive(qlo)||!positive(flo)||!positive(Llo)||cmp(qdev,div(s2,Q(4)))>0)return null;
  const Lup=add(one,mul(mul(two,a.h),pow(Z,2))),d=add(one,pow(Z,2)),U=add(mul(Q(4),Z),a.j),P=div(a.K,pow(flo,2)),Pd=div(mul(mul(Q(4),a.K),Z),pow(flo,3));
  const w=add(add(one,mul(Q(4),d)),mul(mul(mul(two,D),Z),U));
  const gradient=div(mul(Lup,Hup),qlo),chi=min(div(pow(Hup,2),qlo),add(one,div(qdev,qlo)));
  const zstar=add(add(mul(mul(A,add(one,mul(mul(two,Z),U))),U),mul(Q(4),Hup)),add(mul(d,Pd),mul(mul(mul(Q(4),A),Z),P)));
  const fields={one,eta:Z,d,inverseL:div(one,Llo),uStar:U,uStarEta:Q(4),wStar:w,hStar:Hup,normalizedGradient:gradient,zStar:zstar};
  return {fields,chi,zOverL:div(zstar,Llo),phase:ceil(mul(Z,gradient)),qdev,qlo,s2,Llo,flo,Hd,Z,outerRadius:t};
}
function tubeCertificate(a,sigma,budget){
  let r=Q(1,64),bounds=null;for(let i=0;i<256;i++){budget.tick(50);bounds=complexBounds(a,sigma,r);if(bounds)break;r=div(r,two);}
  if(!bounds)throw new ComputeError('PRECISION_REQUIRED','Cannot enclose a nonvanishing common complex tube within the supported radius budget');
  const epsilon=mul(r,a.ratio),loss=div(add(one,a.ratio),pow(sub(one,a.ratio),3));
  const norms=Object.fromEntries(Object.entries(bounds.fields).map(([k,v])=>[k,ceil(mul(v,loss))]));
  return {r,epsilon,loss,norms,chiNorm:ceil(mul(bounds.chi,loss)),bounds,
    record:{realCoefficientWindow:['-11/10','11/10'],complexDomain:'convex open tube about the real coefficient window; all radius-r Cauchy circles lie in its compact interior',outerTubeRadius:qs(bounds.outerRadius),cauchyRadius:qs(r),coefficientRadius:qs(epsilon),radiusRatio:qs(a.ratio),radiusLoss:qs(loss),radiusLossIdentity:'sum_(m>=0) (m+1)^2 q^m=(1+q)/(1-q)^3',denominatorLowerBounds:{'1+z^2':qs(bounds.flo),'L(z)':qs(bounds.Llo),'H(z)^2+sigma^2':qs(bounds.qlo)},denominatorPerturbation:qs(bounds.qdev),sigmaSquared:qs(bounds.s2),complexSuprema:Object.fromEntries(Object.entries(bounds.fields).map(([k,v])=>[k,qs(v)])),coefficientNormUpper:Object.fromEntries(Object.entries(norms).map(([k,v])=>[k,String(v)])),chiComplexSupremum:qs(bounds.chi),chiNormUpper:String(ceil(mul(bounds.chi,loss))),phaseRealPartUpper:String(bounds.phase),allEtaDerivativeOrders:true,jetConvention:'weight uses actual eta derivatives; Cauchy estimates include m!, not just Taylor coefficients'}};
}

function sqrtCeil(n){if(n<0n)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Negative square root');if(n<2n)return n;let x=1n<<BigInt(Math.ceil(n.toString(2).length/2));for(;;){const y=(x+n/x)/2n;if(y>=x)return x*x===n?x:x+1n;x=y;}}
const divUp=(n,d)=>(n+d-1n)/d;
function positiveSeries(K,bits,weighted,budget){
  const cut=Number(2n*sqrtCeil(ceil(K))+32n);if(!Number.isSafeInteger(cut)||cut>10000)throw new ComputeError('RESOURCE_LIMIT','Factorial majorant cutoff exceeds 10000');
  const scale=1n<<BigInt(bits);let lo=scale,hi=scale,slo=0n,shi=0n;
  for(let n=0;n<=cut;n++){
    budget.tick(20);const w=weighted?BigInt((n+1)**2):1n;slo+=lo*w;shi+=hi*w;
    const den=K.d*BigInt((n+1)*(n+2));lo=lo*K.n/den;hi=divUp(hi*K.n,den);
  }
  const weightNext=weighted?BigInt((cut+2)**2):1n,nextUpper=hi*weightNext;
  const ratio=weighted?div(mul(K,Q(cut+3)),Q(BigInt(cut+2)**3n)):div(K,Q((cut+2)*(cut+3)));
  if(cmp(ratio,one)>=0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Factorial tail ratio does not contract');
  const tail=divUp(nextUpper*ratio.d,ratio.d-ratio.n),upper=shi+tail,B=divUp(upper,scale);
  return {bound:B,record:{K:qs(K),weightedBy:weighted?'(n+1)^2':'1',termsThrough:cut,scaleBits:bits,scale:String(scale),partialSumLowerScaled:String(slo),partialSumUpperScaled:String(shi),nextTermUpperScaled:String(nextUpper),tailRatioUpper:qs(ratio),tailUpperScaled:String(tail),totalUpperScaled:String(upper),integerUpper:String(B),method:'Every positive recurrence step is rounded down/up with exact integer division; the omitted infinite tail is bounded by next/(1-q).'}};
}
function controlled(a,tube,S,center,budget){
  const ce=q=>ceil(q),R=center+1n,nn=tube.norms,e=tube.epsilon;
  const O={product:64n,average:1n,primitive:80n,parameterPrimitive:ce(div(Q(80),e)),mulY:80n,j1:80n,j2:80n,param1:ce(div(Q(5120),e)),param2:ce(div(Q(5120),e)),dot1:5120n,dot2:5120n,mixed1:ce(div(Q(5120),e)),mixed2:ce(div(Q(5120),e))};
  const C=b=>({b,l:0n}),sum=(x,y)=>({b:x.b+y.b,l:x.l+y.l}),lin=(op,x)=>({b:op*x.b,l:op*x.l}),bil=(op,x,y)=>({b:op*x.b*y.b,l:op*(x.l*y.b+x.b*y.l)}),m=(x,y)=>bil(O.product,x,y),sc=(q,x)=>lin(ce(mag(q)),x);
  // Positive upper fields reproduce Controlled.add/sub, linear, bilinear, pair.
  const d=Object.fromEntries(Object.entries(nn).map(([k,v])=>[k,C(v)])),phi={b:R,l:1n},u={b:R,l:1n},bu=lin(O.average,u),A=add(Q(1,2),a.h),D=sub(Q(1,2),a.h);
  const angLinear=sum(sum(d.wStar,sc(a.h,d.one)),sc(mul(two,a.h),m(d.eta,d.uStar))),angQuad=m(d.d,d.normalizedGradient),avg=sc(mul(two,D),d.eta),slow=sc(mul(two,a.h),d.eta),axLinear=sum(sum(sc(A,d.one),sc(mul(Q(4),A),m(d.eta,d.uStar))),m(d.d,d.uStarEta)),axQuad=sc(mul(two,A),d.eta);
  const lin1=sum(sum(lin(O.j2,m(angLinear,phi)),bil(O.dot2,d.wStar,phi)),bil(O.param2,phi,d.hStar));
  const quad1=lin(O.j2,m(m(angQuad,u),phi));
  const slow1=sum(sum(sum(sum(lin(O.j2,m(sum(m(avg,bu),m(slow,u)),phi)),bil(O.param2,bu,m(d.d,phi))),bil(O.dot2,m(avg,bu),phi)),m(d.d,bil(O.mixed2,bu,phi))),bil(O.param2,phi,m(d.d,u)));
  const lin2=sum(sum(lin(O.j1,m(axLinear,u)),bil(O.dot1,d.wStar,u)),bil(O.param1,u,d.hStar));
  const slow2=sum(sum(sum(lin(O.j1,m(axQuad,m(u,u))),bil(O.dot1,m(avg,bu),u)),m(d.d,bil(O.mixed1,bu,u))),bil(O.param1,u,m(d.d,u)));
  const amp=C(ceil(tube.loss)),source=m(m(amp,amp),m(phi,phi));
  const pressure=lin(O.j1,sum(sum(m(sc(mul(Q(4),A),d.eta),lin(O.primitive,source)),m(d.d,lin(O.parameterPrimitive,source))),m(sc(two,d.eta),lin(O.mulY,source))));
  const first=lin(S,m(d.inverseL,sum(sum(lin1,quad1),slow1))),second=m(d.inverseL,sum(sum(lin2,slow2),pressure)),out=sum(first,second);
  budget.tick(500);if(out.b.toString().length>10000||out.l.toString().length>10000)throw new ComputeError('PRECISION_REQUIRED','Bound certificate exceeds the supported digit budget');
  return {B:out.b,L:out.l,R,record:{ballRadius:'1',centerNormUpper:String(center),argumentNormUpper:String(R),amplitudeNormUpper:String(ceil(tube.loss)),operatorNormUpper:Object.fromEntries(Object.entries(O).map(([k,v])=>[k,String(v)])),remainderBound:String(out.b),remainderLipschitz:String(out.l),angularComponent:{bound:String(first.b),lip:String(first.l)},axialComponent:{bound:String(second.b),lip:String(second.l)},construction:'Every term of AxisContraction.controlledRemainder is included. Subtraction uses a triangle upper bound; |1/Lambda|<=1. Product norm on the pair is bounded by the sum of component upper bounds.',quantifiers:'All elements x,y in the infinite compatible coefficient space with ||x||,||y||<=argumentNormUpper, and every radially constant normalized amplitude of norm at most amplitudeNormUpper.'}};
}
function factorial(n){let a=1n;for(let i=2;i<=n;i++)a*=BigInt(i);return a;}
function choose(n,k){if(k>n)return 0n;k=Math.min(k,n-k);let a=1n;for(let i=1;i<=k;i++)a=a*BigInt(n-k+i)/BigInt(i);return a;}
function tailBound(M,epsilon,Y,N,k,m){
  if(!positive(Y))return z;
  const n=N+1,q=div(Y,Q(20));
  const coeff=Q(factorial(m)*choose(n+m,m)*factorial(n)/factorial(n-k),BigInt((m+1)**2*(n+1)**2));
  const first=mul(mul(mul(M,div(one,pow(epsilon,m))),coeff),div(pow(q,n),pow(Y,k)));
  const ratio=mul(q,Q(n+1+m,n+1-k));
  if(cmp(ratio,one)>=0)throw new ComputeError('PRECISION_REQUIRED','Tail cutoff is too small for the requested derivative/radius');
  return div(first,sub(one,ratio));
}
function comparisonBox(x,N=32){
  let t=one,s=one;for(let n=1;n<=N;n++){t=div(mul(neg(div(x,two)),t),Q(n*(n+1)));s=add(s,t);}
  const next=mag(div(mul(div(x,two),t),Q((N+1)*(N+2)))),ratio=div(x,Q(2*(N+2)*(N+3))),tail=div(next,sub(one,ratio));return [sub(s,tail),add(s,tail)];
}
function chiAt(a,sigma,eta){const H=realData(a,box(eta)).H[0];return div(pow(H,2),add(pow(H,2),pow(sigma,2)));}

function certifyAxisSource(input={},budget=makeBudget()){
  try{
    budget.tick();const a=normalize(input,budget);if(a.samples>budget.maxPoints)throw new ComputeError('RESOURCE_LIMIT','Visualization sample count exceeds maxPoints');
    const cut=cutoffCertificate(a,budget),tube=tubeCertificate(a,cut.sigma,budget);
    const resolvent=positiveSeries(Q(2560n*tube.chiNorm),a.bits,false,budget),phiRef=positiveSeries(mul(Q(10),tube.bounds.chi),a.bits,true,budget);
    const phiNorm=ceil(mul(tube.loss,Q(phiRef.bound))),uNorm=40n*ceil(mul(tube.loss,tube.bounds.zOverL)),center=phiNorm>uNorm?phiNorm:uNorm;
    const b=controlled(a,tube,resolvent.bound,center,budget),threshold=1n+b.B+b.L,positiveThreshold=100n*b.B,base=threshold>positiveThreshold?threshold:positiveThreshold,Lambda=base*BigInt(a.multiplier);
    const lambda=Q(Lambda),normError=Q(b.B,2n*Lambda),lip=Q(b.L,2n*Lambda),logC=Lambda*tube.bounds.phase+1n;
    const evaluationFactor=div(one,sub(one,div(Q(41,10),Q(20)))),uniformError=mul(normError,evaluationFactor),positiveLower=sub(Q(305719,1152000),uniformError);
    if(cmp(lip,Q(1,2))>0||cmp(normError,one)>0||cmp(positiveLower,Q(1,4))<=0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Derived finite scalar gate did not pass');
    const totalNorm=add(Q(center),normError),tails=[],points=[],lowerLine=[],upperLine=[],chi=chiAt(a,cut.sigma,a.eta);
    for(let i=0;i<a.samples;i++){
      budget.tick(200);const Y=mul(a.Y,Q(i,a.samples-1)),tail=tailBound(totalNorm,tube.epsilon,Y,a.N,0,0),mixed=tailBound(totalNorm,tube.epsilon,Y,a.N,a.kr,a.ke),comp=comparisonBox(mul(Y,chi)),err=div(normError,sub(one,div(Y,Q(20)))),enclosure=[sub(comp[0],err),add(comp[1],err)],yc=asNumber(Y),lo=asNumber(enclosure[0]),hi=asNumber(enclosure[1]),mid=(lo+hi)/2;
      tails.push({Y:qs(Y),X:qs(div(Y,lambda)),truncationDegree:a.N,phiTailUpper:qs(tail),mixedDerivative:{radial:a.kr,eta:a.ke,upper:qs(mixed)},normalizedProfileEnclosure:ibox(enclosure),comparisonEnclosure:ibox(comp),nonlinearDeviationUpper:qs(err)});
      points.push({pos:[yc,mid,Math.max(-320,log10q(tail)??-320)],value:mid,valueInterval:{lower:lo,upper:hi},label:`Y=${yc.toPrecision(4)}; Phi in [${lo.toPrecision(7)}, ${hi.toPrecision(7)}]; log10 tail bound`});lowerLine.push([yc,lo,0]);upperLine.push([yc,hi,0]);
    }
    const record={
      schema:'MathScope.Navier.SourceAxisBoundCertificate/1',status:'VERIFIED_LOCAL_BOUND_CERTIFICATE',evidenceGrade:'EXACT_BOUND_CERTIFICATE_WITH_THEOREM_REFERENCE',certificateScope:'unique nonlinear Appendix-B axis fixed point for the actual A.21 target pressure, with source-generated analytic bounds',
      inputModel:{pressure:{family:'source-outer-A21',formula:'P(z)=-integral (1+z^2)^(-2*theta(y)) dmu(y)',completedOutgoingPressure:false,targetPressureAnalyticBounds:true,sourceParameters:a.sourceInput.parameters},h:qs(a.h),j0:qs(a.j),sampleEta:qs(a.eta),UStar:'4*eta+j0',phiStar:'exp(Lambda*integral_0^eta zetaStar)',normalizedAmplitude:'g=exp(Lambda*phase-logC)',source:'Actual A.21 target pressure. Equality with a numerically repaired outer field still requires exact outer-moment certification.'},
      sourcePressureCertificate:a.producer.certificate,pressureAxisBinding:a.binding,
      sourcePressureOnCoefficientTube:a.producer.complexBounds({realWindow:'11/10',tubeRadius:qs(tube.bounds.outerRadius)}),
      derivedFrom:{rationalModuleSha256:'7bff5106ded0223d0e7ff14d4431a240de160bdcc6be17c1072189206312495d',unchanged:'cutoff, Cauchy, resolvent, controlled remainder, positivity and infinite-tail calculation kernels',rationalDefaultScalarLeanAuditAppliesToThisInstance:false},
      selectedParameters:{h:qs(a.h),j0:qs(a.j),sigmaStar:qs(cut.sigma),deltaStar:qs(cut.delta),Lambda:String(Lambda),lambdaMode:'computed-threshold',lambdaMultiplier:a.multiplier,logC:String(logC),C:{kind:'EXACT_POSITIVE_EXPONENTIAL',log: String(logC)},X0:qs(div(Q(4),lambda)),XMax:qs(div(Q(41,10),lambda)),coefficientRadius:qs(tube.epsilon)},
      cutoff:cut.record,complexInput:tube.record,resolvent:resolvent.record,
      reference:{phi0:'f0(Y*chi)',u0:'-Y*ZStar/(2*L)',phiNormUpper:String(phiNorm),uNormUpper:String(uNorm),phiSeriesNormMajorant:phiRef.record,phiNormProof:'Cauchy on chi(z)^n plus the exact B_rho weight; division by binom(n+m,m)>=1 and summation of all positive radial majorants bounds the supremum.',comparisonWholeInterval:{domain:['0','41/10'],lower:'305719/1152000',cubicLower:'1-z/4+z^2/48-z^3/1152',proof:'The alternating remainder after the cubic is nonnegative. The cubic decreases on the whole interval, so its exact endpoint value bounds every z. This bound is not inferred from sampled values.',derivativeUpper:'-19/240',derivativeProof:'The derivative alternating terms decrease because their first magnitude ratio z/6<=41/60<1. Thus f0prime(z)<=-1/4+z/24<=-19/240<0; consequently f0(z)>=f0(41/10).'}},
      controlled:b.record,
      bounds:{contractionThreshold:String(threshold),positivityThreshold:String(positiveThreshold),selfMapDisplacementUpper:qi(normError),contractionLipschitzUpper:qi(lip),uniformPhiError:qi(uniformError),uniformPhiPositiveLower:qi(positiveLower),complexAmplitudeNormUpper:String(ceil(tube.loss)),phaseRealPartUpper:String(tube.bounds.phase),normalizationMargin:'1',allRadialCoefficients:true,allEtaDerivativeOrders:true,fullRealAxisRectangle:{Y:['0','41/10'],eta:['-1','1']},commonAnalyticEtaRadiusLower:qs(div(mul(tube.epsilon,sub(one,div(Q(5),Q(20)))),two))},
      tails:{solutionNormUpper:qs(totalNorm),degree:a.N,rows:tails,meaning:'These are bounds for the tail of the theorem-defined unique infinite coefficient sequence. They do not certify the rounding error or identity of a separately computed finite eta jet.',formula:'M*m!*rho^(-m)/(m+1)^2 * sum_(n>N) binom(n+m,m)*n!/(n-k)! * Y^(n-k)/(20^n*(n+1)^2)',geometricRatioUpper:'For n>=N+1: (Y/20)*(N+2+m)/(N+2-k); the omitted square factor is <=1.'},
      gates:{exactRationalArithmetic:true,pressureAnalyticContract:true,wholeEtaCutoffCover:true,complexDenominatorsSeparated:true,normalizedComplexAmplitude:true,invariantBall:true,lipschitzBelowOne:true,uniformPositivePhi:true,infiniteCoefficientTail:true,existingFiniteJetLinked:false,sourceA21TargetPressureLinked:true,completedOuterPressureLinked:false,fullOriginalParameterOrder:false,globalWitness:false,fullProfileCertified:false,fullCertificateKernelChecked:false},
      proofBoundary:{grade:'THEOREM_REFERENCE plus exact executable bound certificates',formalPass:false,originalTheorems:'Exact exported statements are listed in sources; a static or separately audited import is not a kernel proof of every generated numerical/analytic premise.',conditionalOn:['The published original coefficient-space/operator/bridge theorems applied to the specified mathematical functions.','Correspondence of this bound propagation and analytic-input producer with those definitions; the full generated analytic premise bundle has not been exported as a Lean proof.'],notInferred:['Equality of this exact A.21 target pressure with the numerically repaired outer field','Identity or tail error of the existing IEEE754 eta-jet arrays','B.3 endpoint shear margin, B.5 continuation, A.7/A.8/A.11 moment completion','N3 overall PASS or a global Navier-Stokes solution']},
      limitations:['The automatic bounds are conservative; selected Lambda and logC may be enormous. C is represented by its exact logarithm, not an overflowed float.','A numerical evaluator that underflows exp(Lambda*phase-logC) to zero does not preserve the strict positivity certificate.','This A.21 input is constructed from the actual source schedule and the stated principal Log branch. Caller-supplied mass/norm/tail/truth claims are rejected.'],
      visualization:{points,lines:[{points:lowerLine},{points:upperLine}],arrows:[],axes:['Y=Lambda X','normalized Phi enclosure center','log10 absolute radial-tail upper bound'],description:'Exact bound certificate for the unique local analytic profile; approximate plot of interval centers and tail bounds.',coordinateMeaning:'The first axis is the scaled radius Y; X=Y/Lambda is retained exactly in each row. The second axis is a certified enclosure center, not the old finite eta-jet value. The third is a nonphysical log bound; zero tails at Y=0 are displayed at -320.',lostInformation:['Full coefficient functions and phase variation across all eta are not rendered.','The A.21 target has certified local bounds, but equality with the repaired outer field, a global witness and physical velocity amplitude are not represented.','Plot floating-point coordinates do not replace the exact rational certificate fields.']},sources:axisSourceCertificateSources,execution:budget.snapshot()
    };
    return record;
  }catch(e){return {schema:'MathScope.Navier.SourceAxisBoundCertificate/1',status:e.code??'COMPUTATION_ERROR',message:e.message,detail:e.detail??{},evidenceGrade:'NO_CERTIFICATE',gates:{globalWitness:false,fullProfileCertified:false,fullCertificateKernelChecked:false},execution:budget.snapshot?.()??null};}
}

function axisSourceExampleInput(){return {pressure:{family:'source-outer-A21',parameters:outerExampleInput().parameters},j0:'3/100',sigmaMode:'computed-cutoff',lambdaMode:'computed-threshold',lambdaMultiplier:2,tailDegree:24,sampleEta:'1/5',sampleCount:17,boundBits:128};}
function getAxisSourceExamples(){return [{id:'ns-axis-source-exact-bounds',label:'실제 A.21 압력과 연결된 국소 축 상계',request:{kind:'ns.axis-source-certificate',input:axisSourceExampleInput(),budget:{maxOperations:20000000,maxMillis:60000,maxMilliseconds:60000,maxPoints:2048}}}];}

return {axisSourceCertificateSources,validateAxisSourceInput,certifyAxisSource,axisSourceExampleInput,getAxisSourceExamples};
})();
const __m1_32 = (()=>{
const {ComputeError,makeBudget,finiteNumber,positive,boundedInteger,solveLinear} = __m1_16;
const {smoothStep,smoothStepDerivative,compactBump} = __m1_23;
const {runAdmissibleLoop,coneGaps} = __m1_27;
const TAU=2*Math.PI,SOURCE={attachment:'01-navier-stokes.pdf',sha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',pages:[28,158,159,160,161,162,163],equations:['4.15','4.16','C.4','C.5','C.9','C.10','C.11','C.12','C.13','C.14','C.15','C.16']};
const bf=b=>b?.tick?b:makeBudget(b??{});
const safe=x=>{
  if(typeof x==='number'){
    if(!Number.isFinite(x))throw new ComputeError('PRECISION_REQUIRED','Nonfinite source modulation output');
    return Number.isInteger(x)&&!Number.isSafeInteger(x)?{kind:'FLOAT64',value:x.toExponential(17),precisionBits:53}:Object.is(x,-0)?0:x;
  }
  if(Array.isArray(x))return x.map(safe);
  if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([,v])=>v!==undefined&&typeof v!=='function').map(([k,v])=>[k,safe(v)]));
  return x;
};
const zeros=n=>Array(n).fill(0),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),maxabs=a=>Math.max(...a.map(Math.abs));
function failStatus(e){return e.code==='RESOURCE_LIMIT'?'BUDGET_EXCEEDED':['PRECISION_REQUIRED','UNSUPPORTED','BUDGET_EXCEEDED','CANCELLED'].includes(e.code)?e.code:'FAILED';}
const gaussCache=new Map();
function gaussRule(n){
  if(gaussCache.has(n))return gaussCache.get(n);
  const out=[];
  for(let i=1;i<=n;i++){
    let z=Math.cos(Math.PI*(i-.25)/(n+.5)),dp=0;
    for(let j=0;j<16;j++){
      let p0=1,p1=z;for(let k=2;k<=n;k++){const p=((2*k-1)*z*p1-(k-1)*p0)/k;p0=p1;p1=p;}
      dp=n*(z*p1-p0)/(z*z-1);const d=p1/dp;z-=d;if(Math.abs(d)<2e-16)break;
    }
    let p0=1,p1=z;for(let k=2;k<=n;k++){const p=((2*k-1)*z*p1-(k-1)*p0)/k;p0=p1;p1=p;}
    dp=n*(z*p1-p0)/(z*z-1);out.push([z,2/((1-z*z)*dp*dp)]);
  }
  gaussCache.set(n,out);return out;
}
function quadVector(f,a,b,n,budget){
  if(a===b)return zeros(f(a).length);
  let sum=null;const m=(a+b)/2,h=(b-a)/2;
  for(const [z,w] of gaussRule(n)){
    budget.tick();const v=f(m+h*z);if(!sum)sum=zeros(v.length);
    for(let j=0;j<v.length;j++)sum[j]+=w*h*v[j];
  }
  return sum;
}
function powerDifference(a,b,p){return Math.exp(p*Math.log(a))*Math.expm1(p*Math.log(b/a))/p;}

function validateRadialModulationInput(input={}){
  try{
    if(!input||typeof input!=='object'||Array.isArray(input))throw new ComputeError('INVALID_INPUT','Modulation input must be a JSON object');
    if(input.family!==undefined&&input.family!=='explicit-power-annulus')throw new ComputeError('UNSUPPORTED','This implementation accepts the explicit power-annulus family, not an unbound full paper witness');
    const p={h:positive(input.h??1e-8,'h'),lambda:positive(input.lambda??.2,'lambda'),innerAmplitude:positive(input.innerAmplitude??40,'innerAmplitude'),
      powerAmplitude:positive(input.powerAmplitude??1,'powerAmplitude'),modulationInterval:input.modulationInterval??[3,6],patch:input.patch??[8,16],
      N:boundedInteger(input.N??512,'N',2,2048),phaseNodes:boundedInteger(input.phaseNodes??512,'phaseNodes',128,2048),
      samples:boundedInteger(input.samples??97,'samples',33,1025),quadratureOrder:boundedInteger(input.quadratureOrder??12,'quadratureOrder',6,24),
      etaDerivativeOrder:boundedInteger(input.etaDerivativeOrder??1,'etaDerivativeOrder',1,2),
      detailMode:input.detailMode??'compact',
      etaStep:positive(input.etaStep??2e-4,'etaStep'),logRadialStep:positive(input.logRadialStep??1e-4,'logRadialStep'),
      etaValues:input.etaValues??[0],includeIndependentQuadrature:input.includeIndependentQuadrature??true};
    if(!(p.h<.001&&p.lambda>=.0001&&p.lambda<=.5&&p.h<p.lambda/2&&p.innerAmplitude<=100&&p.powerAmplitude<=10))throw new ComputeError('INVALID_INPUT','Require 0<h<.001, 1e-4<=lambda<=.5, 2h<lambda, innerAmplitude<=100 and powerAmplitude<=10');
    if(p.phaseNodes%2)throw new ComputeError('INVALID_INPUT','phaseNodes must be even');
    if(typeof p.includeIndependentQuadrature!=='boolean')throw new ComputeError('INVALID_INPUT','includeIndependentQuadrature must be a boolean');
    if(!['compact','dense'].includes(p.detailMode))throw new ComputeError('INVALID_INPUT','detailMode must be compact or dense');
    if(!(p.etaStep>=1e-6&&p.etaStep<=.005&&p.logRadialStep>=1e-6&&p.logRadialStep<=.002))throw new ComputeError('INVALID_INPUT','Finite-difference steps are outside the supported accuracy range');
    for(const [name,v] of [['modulationInterval',p.modulationInterval],['patch',p.patch]]){
      if(!Array.isArray(v)||v.length!==2||!v.every(Number.isFinite)||!(v[0]>0&&v[1]>v[0]))throw new ComputeError('INVALID_SUPPORT',name+' must contain two ordered positive radii');
    }
    if(!(p.modulationInterval[0]>2.1&&p.modulationInterval[1]<=20&&p.patch[0]>p.modulationInterval[1]&&p.patch[1]<=100))throw new ComputeError('INVALID_SUPPORT','Modulation must follow the inner transition and precede the disjoint first power-law patch');
    if(!Array.isArray(p.etaValues)||!p.etaValues.length||p.etaValues.length>3||p.etaValues.some(x=>typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>1))throw new ComputeError('INVALID_INPUT','etaValues must contain 1..3 finite values in [-1,1]');
    return {valid:true,parameters:p};
  }catch(e){return {valid:false,status:failStatus(e),domainStatus:e.code??'INVALID_INPUT',message:e.message,detail:e.detail??{}};}
}

/** Explicit positive finite-moment profile. It is smooth on the annulus but is
 * not the original regular-axis/outer witness. U=0, and the first patch is an
 * exact E=K X^(-1/2-lambda) branch as required by the C.2 correction operator. */
function makeProfile(p,budget){
  const alpha=.1,beta=-.5-p.lambda,[left,right]=p.modulationInterval,yl=Math.log(left),yr=Math.log(right),width=yr-yl;
  const jump=(alpha-beta)*width/8,K=p.powerAmplitude,Kout=K*Math.exp(jump),A=p.innerAmplitude;
  function field(X){
    const y=Math.log(X);let logE,slope;
    if(X<=1){logE=Math.log(A)+alpha*y;slope=alpha;}
    else if(X<2){
      const s=y/Math.LN2,c=smoothStep(s),dc=smoothStepDerivative(s)/Math.LN2;
      const f=Math.log(A)+alpha*y,g=Math.log(K)+beta*y;
      logE=(1-c)*f+c*g;slope=(1-c)*alpha+c*beta+dc*(g-f);
    }else{
      const s=(y-yl)/width;logE=Math.log(K)+beta*y+jump*smoothStep(s);
      slope=beta+jump/width*smoothStepDerivative(s);
    }
    return {X,logE,E:Math.exp(logE),U:0,slope,a:1-2*slope};
  }
  const foundation=[Math.SQRT2*A/(alpha+1.5),-.5*A*A/(2*alpha+1),A*A/(4*alpha)];
  const integrand=y=>{const X=Math.exp(y),E=field(X).E;return [X*Math.sqrt(2*X)*E,-X*E*E/2,E*E/2];};
  const drop=quadVector(integrand,0,Math.LN2,48,budget),atTwo=foundation.map((v,j)=>v+drop[j]);
  const power=(k,a,b)=>[Math.SQRT2*k*powerDifference(a,b,beta+1.5),-.5*k*k*powerDifference(a,b,2*beta+1),.5*k*k*powerDifference(a,b,2*beta)];
  const pre=power(K,2,left),atLeft=atTwo.map((v,j)=>v+pre[j]),central=quadVector(integrand,yl,yr,48,budget),atRight=atLeft.map((v,j)=>v+central[j]);
  const pressureTailAtRight=Kout*Kout*Math.exp(2*beta*yr)/(-4*beta),axisPressure=-atRight[2]-pressureTailAtRight;
  const cache=new Map();
  function radial(X){
    const key=String(X);if(cache.has(key))return cache.get(key);
    const f=field(X);let moments,Pi;
    if(X<left-1e-10)throw new ComputeError('UNSUPPORTED','Radial residual evaluation is restricted to the modulation and later patch');
    if(X>=right){const v=power(Kout,right,X);moments=atRight.map((x,j)=>x+v[j]);Pi=-Kout*Kout*Math.exp(2*beta*Math.log(X))/(-4*beta);}
    else{
      const v=quadVector(integrand,yl,Math.log(X),32,budget);moments=atLeft.map((x,j)=>x+v[j]);
      Pi=-quadVector(integrand,Math.log(X),yr,32,budget)[2]-pressureTailAtRight;
    }
    const value={...f,I:moments[0],S:moments[1],Cp:moments[2],Pi};cache.set(key,value);return value;
  }
  function state(X,eta){
    const r=radial(X),L=1-2*p.h*eta*eta,AA=.5+p.h;
    const Q=-1+(1-p.h)*r.I/(X*Math.sqrt(2*X)*r.E),N=4*p.h*eta*r.S/X+4*AA*eta*r.Pi;
    const ps=[X*Q/L,X*N/(L*r.E)];return {...r,eta,ps,bs:0,...coneGaps({a:r.a,bs:0,ps})};
  }
  return {field,radial,state,left,right,yl,yr,width,alpha,beta,jump,Kout,axisPressure,atLeft,atRight,
    contract:{family:'explicit-power-annulus',formula:'log E blends log(A)+0.1 log X into log(K)+beta log X on 1<X<2, then adds jump*sigma((log X-log Xminus)/width)',
      beta,jump,axisPressure,angularProfileIndependentOfEta:true,axialProfile:'U=0',firstPatchExactPowerLaw:true,
      regularCartesianAxisCertified:false,originalPaperProfile:false}};
}

function floatMeanAndVariance(mu,p,d0,budget){
  const z=mu*p;if(Math.abs(z)>300)throw new ComputeError('PRECISION_REQUIRED','C.12 loop concentration exceeds the supported |mu p2| range');
  if(!p)return {M:1,logM:0,V:d0*d0*mu*mu/2};
  const q=z*z/4;let term=1,M=1,tail=0;
  for(let n=1;n<2000;n++){budget.tick();term*=q/(n*n);M+=term;tail+=term;if(term<1e-16*M)break;}
  const z2=z*z;let raw=1,central=.5,B=.5;
  for(let n=1;n<2000;n++){
    budget.tick();raw*=z2/((n+1)*(n+1));central*=(2*n+1)/(2*n+2);const add=(1-central)*raw;B+=add;if(add<1e-16*B)break;
  }
  return {M,logM:Math.abs(z)<1e-3?Math.log1p(tail):Math.log(M),V:d0*d0*mu*mu*B/(M*M)};
}
function hermite(v0,v1,d0,d1,h,s){return ((2*s-3)*s*s+1)*v0+((s-2)*s+1)*s*h*d0+(-2*s+3)*s*s*v1+(s-1)*s*s*h*d1;}
function primitiveFamily(profile,p,budget){
  const points=[];
  for(const f of [0,.25,.5,.75,1])for(const eta of [-1,0,1]){
    const X=Math.exp(profile.yl+f*profile.width),s=profile.state(X,eta);
    points.push({a:s.a,bs:0,ps:s.ps,X,eta,boundary:f===0||f===1});
  }
  const selected=runAdmissibleLoop({points,phaseSamples:32},budget);
  if(selected.status!=='PARTIAL'||!selected.loops?.every(l=>l.phaseCertificate.pass))throw new ComputeError(['PRECISION_REQUIRED','BUDGET_EXCEEDED','CANCELLED','UNSUPPORTED'].includes(selected.status)?selected.status:'INVALID_PROFILE','The explicit profile does not supply the checked finite C.1 parameter-selection states',{selectionStatus:selected.status,message:selected.message});
  const {d0,muMax,delta}=selected.sharedParameters,cache=new Map(),cutoffBreakpoints=[];
  // A radial cutoff may be far narrower than a phase quarter-period. Resolve
  // its actual source thresholds before quadrature instead of hoping a grid
  // samples this smooth but narrow transition.
  for(const threshold of [2+delta/8,2+delta/4]){
    let lo=0,hi=.5;
    for(let j=0;j<60;j++){
      const m=(lo+hi)/2,a=profile.field(Math.exp(profile.yl+m*profile.width)).a;
      if(a>threshold)lo=m;else hi=m;
    }
    const t=(lo+hi)/2;cutoffBreakpoints.push(profile.yl+t*profile.width,profile.yl+(1-t)*profile.width);
  }
  cutoffBreakpoints.sort((a,b)=>a-b);
  const radialStencilStep=Math.min(p.logRadialStep,(cutoffBreakpoints[1]-cutoffBreakpoints[0])/128,(cutoffBreakpoints[3]-cutoffBreakpoints[2])/128);
  if(!(radialStencilStep>1e-10))throw new ComputeError('PRECISION_REQUIRED','The C.1 radial cutoff is too narrow for this Float64 differentiation path');
  const stats={families:0,closedRemovableFamilies:0,outsideCutoffFamilies:0,numericalUnderflowZeroFamilies:0,maxPeriodDefect:0,maxRootVarianceDefect:0};
  function at(X,eta){
    if(X<=profile.left||X>=profile.right)return {value:()=>({A:0,B:0,Ap:0,Bp:0,aL:profile.field(X).a,bL:0}),maxA:0,maxB:0,zero:true};
    const key=X+'|'+eta;if(cache.has(key))return cache.get(key);
    if(cache.size>=100000)throw new ComputeError('BUDGET_EXCEEDED','Loop-family cache limit reached');
    const s=profile.state(X,eta),a=s.a,p2=s.ps[1],pc=s.ps[0];
    if(!(a>0&&pc>Math.max(2,a)&&d0<(pc-2)/2))throw new ComputeError('INVALID_PROFILE','A queried annular state fails the C.1 hypotheses or common d0 condition',{X,eta,a,pc,d0});
    const cutoffArgument=(a-(2+delta/8))/(delta/8),zeta=1-smoothStep(cutoffArgument),rho=zeta*zeta*Math.max(0,2+delta/2-a),v=a+rho;
    if(rho===0){
      const outside=a>=2+delta/4;stats[outside?'outsideCutoffFamilies':'numericalUnderflowZeroFamilies']++;
      const result={value:()=>({A:0,B:0,Ap:0,Bp:0,aL:a,bL:0}),maxA:0,maxB:0,zero:true,numericOnlyZero:!outside};
      if(eta!==0)cache.set(key,result);return result;
    }
    const target=rho/a;let mu;
    if(p2===0)mu=Math.sqrt(2*target)/d0;
    else{
      let lo=0,hi=muMax;if(floatMeanAndVariance(hi,p2,d0,budget).V<=target)throw new ComputeError('INVALID_PROFILE','Selected common muMax does not bracket a queried state');
      for(let k=0;k<55;k++){const m=(lo+hi)/2;if(floatMeanAndVariance(m,p2,d0,budget).V<target)lo=m;else hi=m;}
      mu=(lo+hi)/2;
    }
    const mv=floatMeanAndVariance(mu,p2,d0,budget),z=mu*p2;
    stats.maxRootVarianceDefect=Math.max(stats.maxRootVarianceDefect,Math.abs(mv.V-target));
    if(p2===0){
      // Exact removable-branch primitives of C.5/C.11. The inverse circle lift
      // is one monotone scalar equation, not a sampled surrogate loop.
      const T=d0*mu,c=rho/(4*Math.PI*v),meanAp=a*a*T**3/(24*Math.PI*v*d0);
      function value(phase){
        const q=phase-Math.floor(phase);let th=q*TAU,lo=0,hi=TAU;
        for(let j=0;j<50;j++){
          budget.tick();const f=th/TAU-c*Math.sin(2*th)-q,df=1/TAU-2*c*Math.cos(2*th);
          if(Math.abs(f)<8e-16)break;if(f<0)lo=th;else hi=th;
          const next=th-f/df;th=next>lo&&next<hi?next:(lo+hi)/2;
        }
        const st=Math.sin(th),ct=Math.cos(th),tt=T*st,aa=v/(1+tt*tt),bb=-aa*tt;
        const primitiveF=-ct/4+ct**3/6+1/12,phiP=a*T**3*primitiveF/(Math.PI*v*d0),phiTheta=a*(1+tt*tt)/(TAU*v),thetaP=-phiP/phiTheta;
        return {A:-a*rho*Math.sin(2*th)/(8*Math.PI*v),B:s.E*a*T*ct/(4*Math.PI),aL:aa,bL:bb,
          Ap:-a*thetaP/(4*Math.PI)-meanAp,
          Bp:s.E*(a*T*T*Math.sin(2*th)/(32*Math.PI*d0)-a*T*st*thetaP/(4*Math.PI))};
      }
      stats.closedRemovableFamilies++;
      return {value,maxA:a*rho/(8*Math.PI*v),maxB:s.E*a*T/(4*Math.PI),zero:false,mu,period:1,closedRemovable:true};
    }
    const n=p.phaseNodes,h=TAU/n,phi=new Float64Array(n+1),tIntegral=new Float64Array(n+1),ts=new Float64Array(n+1),ds=new Float64Array(n+1),phiMid=new Float64Array(n),tMidIntegral=new Float64Array(n),tMid=new Float64Array(n),dMid=new Float64Array(n);
    const t=th=>p2===0?d0*mu*Math.sin(th):d0*Math.expm1(z*Math.sin(th)-mv.logM)/p2;
    for(let i=0;i<=n;i++){
      budget.tick(10);ts[i]=t(i*h);ds[i]=a*(1+ts[i]*ts[i])/(TAU*v);
      if(i){
        const tm=t((i-.5)*h),dm=a*(1+tm*tm)/(TAU*v),tq=t((i-.75)*h),dq=a*(1+tq*tq)/(TAU*v);
        tMid[i-1]=tm;dMid[i-1]=dm;
        phiMid[i-1]=phi[i-1]+h*(ds[i-1]+4*dq+dm)/12;
        tMidIntegral[i-1]=tIntegral[i-1]+h*(ts[i-1]+4*tq+tm)/12;
        phi[i]=phi[i-1]+h*(ds[i-1]+4*dm+ds[i])/6;
        tIntegral[i]=tIntegral[i-1]+h*(ts[i-1]+4*tm+ts[i])/6;
      }
    }
    const period=phi[n];stats.maxPeriodDefect=Math.max(stats.maxPeriodDefect,Math.abs(period-1));
    if(Math.abs(period-1)>2e-6)throw new ComputeError('PRECISION_REQUIRED','Numerical loop phase resolution is insufficient',{X,eta,periodDefect:period-1,phaseNodes:n});
    let meanA=0,meanB=0,maxA=0,maxB=0;
    const rawA=i=>.5*a*(phi[i]-i/n),rawB=i=>-s.E*a*tIntegral[i]/(2*TAU);
    for(let i=1;i<=n;i++){
      const am=.5*a*(phiMid[i-1]-(i-.5)/n),bm=-s.E*a*tMidIntegral[i-1]/(2*TAU);
      meanA+=h*(rawA(i-1)*ds[i-1]+4*am*dMid[i-1]+rawA(i)*ds[i])/(6*period);
      meanB+=h*(rawB(i-1)*ds[i-1]+4*bm*dMid[i-1]+rawB(i)*ds[i])/(6*period);
    }
    for(let i=0;i<=n;i++){maxA=Math.max(maxA,Math.abs(rawA(i)-meanA));maxB=Math.max(maxB,Math.abs(rawB(i)-meanB));}
    function value(phase){
      const q=phase-Math.floor(phase),target=q*period;let lo=0,hi=n;
      while(hi-lo>1){const m=(lo+hi)>>1;if(phi[m]<=target)lo=m;else hi=m;}
      let u=(target-phi[lo])/(phi[hi]-phi[lo]),l=0,r=1;
      for(let k=0;k<45;k++){
        const val=hermite(phi[lo],phi[hi],ds[lo],ds[hi],h,u);
        if(val<target)l=u;else r=u;
        if(Math.abs(val-target)<1e-14)break;u=(l+r)/2;
      }
      const theta=(lo+u)*h,tt=t(theta),aa=v/(1+tt*tt),bb=-aa*tt;
      const it=hermite(tIntegral[lo],tIntegral[hi],ts[lo],ts[hi],h,u);
      return {A:.5*a*(target-theta/TAU)-meanA,B:-s.E*a*it/(2*TAU)-meanB,aL:aa,bL:bb};
    }
    const result={value,maxA,maxB,zero:false,mu,period};cache.set(key,result);stats.families++;return result;
  }
  function fields(X,eta,N=p.N,withRadial=false){
    const base=profile.radial(Math.min(Math.max(X,profile.left),p.patch[1])),phase=N*Math.log(X),center=at(X,eta).value(phase),ep=p.etaStep;
    let Ae,Be,Aee,Bee,etaMethod;
    if(eta===0&&p.etaDerivativeOrder===1){
      const dp=(4*p.h*base.S+4*(.5+p.h)*X*base.Pi)/base.E;
      Ae=center.Ap*dp;Be=center.Bp*dp;etaMethod='Analytic first derivative of the C.5 removable branch and its normalized C.11 primitives';
    }else{
      const plus=at(X,eta+ep).value(phase),minus=at(X,eta-ep).value(phase),plus2=at(X,eta+2*ep).value(phase),minus2=at(X,eta-2*ep).value(phase);
      Ae=(minus2.A-8*minus.A+8*plus.A-plus2.A)/(12*ep);Be=(minus2.B-8*minus.B+8*plus.B-plus2.B)/(12*ep);
      if(p.etaDerivativeOrder>=2){Aee=(-plus2.A+16*plus.A-30*center.A+16*minus.A-minus2.A)/(12*ep*ep);Bee=(-plus2.B+16*plus.B-30*center.B+16*minus.B-minus2.B)/(12*ep*ep);}
      etaMethod='Five-point finite difference at fixed phase';
    }
    const E=base.E*Math.exp(center.A/N),deltaE=base.E*Math.expm1(center.A/N),U=center.B/N;
    const result={X,eta,phase:phase-Math.floor(phase),E,U,deltaE,baseE:base.E,baseU:0,A:center.A,B:center.B,Aeta:Ae,Beta:Be,AetaEta:Aee,BetaEta:Bee,
      Eeta:E*Ae/N,Ueta:Be/N,EetaEta:Aee===undefined?undefined:E*(Aee/N+(Ae/N)**2),UetaEta:Bee===undefined?undefined:Bee/N,aL:center.aL,bL:center.bL,etaDerivativeOrder:p.etaDerivativeOrder,etaDerivativeMethod:etaMethod};
    if(withRadial){
      const e=radialStencilStep,yp=at(X*Math.exp(e),eta).value(phase),ym=at(X*Math.exp(-e),eta).value(phase),yp2=at(X*Math.exp(2*e),eta).value(phase),ym2=at(X*Math.exp(-2*e),eta).value(phase),
        Ay=(ym2.A-8*ym.A+8*yp.A-yp2.A)/(12*e),By=(ym2.B-8*ym.B+8*yp.B-yp2.B)/(12*e);
      result.DXA=Ay;result.DXB=By;result.radialStencilStep=e;result.aN=center.aL-2*Ay/N;result.bN=Math.exp(-center.A/N)*(center.bL+2*By/(N*base.E));
      result.DXE=E*(1-result.aN)/2;result.DXU=E*result.bN/2;
    }
    return result;
  }
  return {at,fields,stats,parameters:{d0,muMax,delta},selectionPoints:points,cutoffBreakpoints,radialStencilStep,selectionScope:'Finite source-state probes, not a uniform analytic profile certificate'};
}

function momentDifferenceRows(f){
  const second=f.EetaEta!==undefined&&f.UetaEta!==undefined,X=f.X,E=f.E,U=f.U,de=f.deltaE,E0=f.baseE,Ee=f.Eeta,Ue=f.Ueta,Eee=f.EetaEta??0,Uee=f.UetaEta??0,H=Math.sqrt(2*X)*E,He=Math.sqrt(2*X)*Ee,Hee=Math.sqrt(2*X)*Eee;
  return [U,Math.sqrt(2*X)*de,U*H,U*U-E0*de-de*de/2,(E0*de+de*de/2)/X,
    Ue,He,Ue*H+U*He,2*U*Ue-E*Ee,E*Ee/X,
    ...(second?[Uee,Hee,Uee*H+2*Ue*He+U*Hee,2*Ue*Ue+2*U*Uee-Ee*Ee-E*Eee,(Ee*Ee+E*Eee)/X]:zeros(5))];
}
function integrateDebt(profile,loops,p,eta,to,order,budget){
  const end=Math.min(to,profile.right);if(end<=profile.left)return {moments:zeros(5),eta:zeros(5),etaEta:p.etaDerivativeOrder>=2?zeros(5):null};
  const a=profile.yl,b=Math.log(end),cuts=[a,b];
  // Split into quarter-period intervals before high-order Gaussian integration.
  for(let k=Math.floor(4*p.N*a)+1;k<4*p.N*b;k++)cuts.push(k/(4*p.N));
  for(const y of loops.cutoffBreakpoints)if(y>a&&y<b)cuts.push(y);
  cuts.sort((x,y)=>x-y);const sum=zeros(15);
  for(let i=0;i<cuts.length-1;i++){
    const v=quadVector(y=>{const X=Math.exp(y);return momentDifferenceRows(loops.fields(X,eta)).map(t=>t*X);},cuts[i],cuts[i+1],order,budget);
    for(let j=0;j<15;j++)sum[j]+=v[j];
  }
  return {moments:sum.slice(0,5),eta:sum.slice(5,10),etaEta:p.etaDerivativeOrder>=2?sum.slice(10,15):null,nodes:order*(cuts.length-1),phaseQuarterCells:cuts.length-1};
}

function integrateDebtPath(profile,loops,p,eta,radii,order,budget){
  const ys=radii.map(Math.log),cutSet=new Set(ys),a=profile.yl,b=profile.yr;
  cutSet.add(a);cutSet.add(b);
  for(let k=Math.floor(4*p.N*a)+1;k<4*p.N*b;k++)cutSet.add(k/(4*p.N));
  for(const y of loops.cutoffBreakpoints)if(y>a&&y<b)cutSet.add(y);
  const cuts=[...cutSet].sort((x,y)=>x-y),sum=zeros(15),rows=new Map(),snapshot=()=>({moments:sum.slice(0,5),eta:sum.slice(5,10),etaEta:p.etaDerivativeOrder>=2?sum.slice(10,15):null});
  rows.set(cuts[0],snapshot());
  for(let i=0;i<cuts.length-1;i++){
    const v=quadVector(y=>{const X=Math.exp(y);return momentDifferenceRows(loops.fields(X,eta)).map(t=>t*X);},cuts[i],cuts[i+1],order,budget);
    for(let j=0;j<15;j++)sum[j]+=v[j];rows.set(cuts[i+1],snapshot());
  }
  return {values:ys.map(y=>rows.get(y)),total:{...snapshot(),nodes:order*(cuts.length-1),partitionCells:cuts.length-1},method:'Forward prefix integration split at requested radii, phase quarters and actual cutoff thresholds'};
}

function correctionMap(profile,p,budget,order=128){
  const [a,b]=p.patch,w=b-a,centers=[.1,.3,.5,.7,.9],supports=centers.map(t=>[a+w*(t-.065),a+w*(t+.065)]);
  if(supports.some((s,i)=>i&&s[0]<=supports[i-1][1]))throw new ComputeError('INVALID_SUPPORT','Correction bump supports overlap');
  const A=Array.from({length:5},()=>zeros(5)),Q=Array.from({length:5},()=>Array.from({length:5},()=>zeros(5)));
  const values=X=>supports.map(([l,r])=>compactBump(X,l,r));
  for(const [l,r] of supports)for(const [z,weight] of gaussRule(order)){
    budget.tick(100);const X=(l+r)/2+(r-l)*z/2,wq=weight*(r-l)/2,E=profile.field(X).E,H=Math.sqrt(2*X)*E,v=values(X);
    for(let i=0;i<5;i++){
      if(i<2){A[0][i]+=wq*v[i];A[2][i]+=wq*H*v[i];}
      else{A[1][i]+=wq*Math.sqrt(2*X)*v[i];A[3][i]-=wq*E*v[i];A[4][i]+=wq*E/X*v[i];}
      for(let j=0;j<5;j++){
        const q=wq*v[i]*v[j];
        if(i<2&&j<2)Q[3][i][j]+=q;
        if(i>=2&&j>=2){Q[3][i][j]-=q/2;Q[4][i][j]+=q/(2*X);}
        if((i<2)!==(j<2))Q[2][i][j]+=q*Math.sqrt(2*X)/2;
      }
    }
  }
  const apply=c=>A.map((row,k)=>dot(row,c)+Q[k].reduce((s,q,i)=>s+c[i]*dot(q,c),0));
  const jacobian=c=>A.map((row,k)=>row.map((x,i)=>x+2*dot(Q[k][i],c)));
  return {A,Q,apply,jacobian,values,supports,order};
}
function solveRepair(map,debt,budget){
  const scales=map.A.map(row=>Math.max(1e-20,row.reduce((s,x)=>s+Math.abs(x),0))),norm=v=>maxabs(v.map((x,i)=>x/scales[i]));
  let c=zeros(5),history=[];
  for(let n=0;n<20;n++){
    budget.tick(1000);const residual=map.apply(c).map((x,k)=>x+debt.moments[k]),size=norm(residual);history.push(size);
    if(size<2e-13)break;
    const J=map.jacobian(c),step=solveLinear(J.map((row,k)=>row.map(x=>x/scales[k])),residual.map((x,k)=>-x/scales[k])).solution;
    let factor=1,accepted=false;
    for(let j=0;j<16;j++){
      const next=c.map((x,i)=>x+factor*step[i]),r=map.apply(next).map((x,k)=>x+debt.moments[k]);
      if(norm(r)<size){c=next;accepted=true;break;}factor/=2;
    }
    if(!accepted)throw new ComputeError('SINGULAR_SYSTEM','First-patch Newton iteration did not reduce the actual nonlinear moment residual',{history});
  }
  const J=map.jacobian(c),eta=solveLinear(J,debt.eta.map(x=>-x)).solution;
  const hessian=map.Q.map(Q=>2*Q.reduce((s,row,i)=>s+eta[i]*dot(row,eta),0));
  const etaEta=debt.etaEta?solveLinear(J,debt.etaEta.map((x,k)=>-x-hessian[k])).solution:null;
  const inverseColumns=Array.from({length:5},(_,i)=>solveLinear(J,Array.from({length:5},(_,j)=>i===j?1:0)).solution);
  const inverseInfinityNorm=Math.max(...Array.from({length:5},(_,i)=>inverseColumns.reduce((s,col)=>s+Math.abs(col[i]),0)));
  const residual=map.apply(c).map((x,k)=>x+debt.moments[k]);
  return {coefficients:c,coefficientEta:eta,coefficientEtaEta:etaEta,residual,normalizedResidual:norm(residual),jacobian:J,inverseInfinityNorm,history,
    continuousIntervalNewtonCertified:false,finiteNonlinearSystemSolved:norm(residual)<2e-11};
}
function correctedPoint(profile,map,repair,X){
  const r=profile.field(X),v=map.values(X),u=dot(v.slice(0,2),repair.coefficients.slice(0,2)),de=dot(v.slice(2),repair.coefficients.slice(2)),ue=dot(v.slice(0,2),repair.coefficientEta.slice(0,2)),ee=dot(v.slice(2),repair.coefficientEta.slice(2));
  return {X,E:r.E+de,U:u,deltaE:de,baseE:r.E,baseU:0,Eeta:ee,Ueta:ue,
    EetaEta:repair.coefficientEtaEta?dot(v.slice(2),repair.coefficientEtaEta.slice(2)):undefined,UetaEta:repair.coefficientEtaEta?dot(v.slice(0,2),repair.coefficientEtaEta.slice(0,2)):undefined};
}
function bumpDerivative(X,a,b){
  if(X<=a||X>=b)return 0;const t=(X-a)/(b-a);if(t<1e-8||t>1-1e-8)return 0;
  const s=smoothStep(t),zp=2/t**3+2/(1-t)**3,zpp=-6/t**4+6/(1-t)**4;
  return s*(1-s)*((1-2*s)*zp*zp+zpp)/(b-a)**2;
}
function correctionThrough(profile,map,repair,X,budget){
  const sum=zeros(15);
  for(const [a,b] of map.supports){
    if(X<=a)continue;const v=quadVector(x=>momentDifferenceRows(correctedPoint(profile,map,repair,x)),a,Math.min(b,X),128,budget);
    for(let j=0;j<15;j++)sum[j]+=v[j];
  }
  return {moments:sum.slice(0,5),eta:sum.slice(5,10),etaEta:sum.slice(10,15)};
}
function independentCorrection(profile,map,repair,p,budget){
  const sum=zeros(15);
  for(const [a,b] of map.supports){const v=quadVector(X=>momentDifferenceRows(correctedPoint(profile,map,repair,X)),a,b,192,budget);for(let j=0;j<15;j++)sum[j]+=v[j];}
  return {moments:sum.slice(0,5),eta:sum.slice(5,10),etaEta:sum.slice(10,15)};
}
function integratedAfter(profile,p,eta,X,field,debt){
  const base=profile.radial(X),m=[0,base.I,0,base.S,base.Cp].map((x,j)=>x+debt.moments[j]),[M,I,J,S,Cp]=m,[Me,Ie,Je,Se,Cpe]=debt.eta;
  const D=.5-p.h,A=.5+p.h,d=1-eta*eta,L=1-2*p.h*eta*eta,Pi=base.Pi+debt.moments[4],H=Math.sqrt(2*X)*field.E;
  const W=1-(2*D*eta*M+d*Me)/X;
  const Q=-W+((1-p.h)*I-D*eta*Ie-d*Je+2*(p.h-D)*eta*J)/(X*H);
  // Source (4.16)/(B.35): -W*U is not divided by the radius.
  const N=-W*field.U+(D*(M-eta*Me)+4*p.h*eta*S-d*Se)/X+4*A*eta*Pi-d*Cpe;
  return {moments:m,momentEta:debt.eta.slice(),Pi,PiEta:Cpe,V0:X/L*(2*eta*field.U-2*D*eta*M/X-d*Me/X),ps:[X*Q/L,X*N/(L*field.E)]};
}

async function runRadialModulation(input={},budgetInput={}){
  const budget=bf(budgetInput),valid=validateRadialModulationInput(input);if(!valid.valid)return safe({...valid,fullProfileCertified:false});
  try{
    const p=valid.parameters,profile=makeProfile(p,budget),loops=primitiveFamily(profile,p,budget),map=correctionMap(profile,p,budget);
    const regularSampleCount=Math.max(p.samples,Math.ceil(12*p.N*profile.width)+1),sampleSet=new Set(Array.from({length:regularSampleCount},(_,i)=>i===0?profile.left:i===regularSampleCount-1?profile.right:Math.exp(profile.yl+profile.width*i/(regularSampleCount-1))));
    for(const j of [0,2])for(let k=0;k<=16;k++)sampleSet.add(Math.exp(loops.cutoffBreakpoints[j]+(loops.cutoffBreakpoints[j+1]-loops.cutoffBreakpoints[j])*k/16));
    const sampleXs=[...sampleSet].sort((a,b)=>a-b),sampleCount=sampleXs.length,slices=[];
    if((sampleCount+65)*p.etaValues.length>budget.maxPoints)throw new ComputeError('BUDGET_EXCEEDED','Modulated, narrow-cutoff and correction-patch samples exceed maxPoints');
    for(const eta of p.etaValues){
      const momentPath=integrateDebtPath(profile,loops,p,eta,sampleXs,p.quadratureOrder,budget),debt=momentPath.total,repair=solveRepair(map,debt,budget);
      const independentDebt=p.includeIndependentQuadrature?integrateDebt(profile,loops,p,eta,profile.right,p.quadratureOrder+4,budget):debt;
      const correction=independentCorrection(profile,map,repair,p,budget),postResidual=independentDebt.moments.map((v,j)=>v+correction.moments[j]),postEtaResidual=independentDebt.eta.map((v,j)=>v+correction.eta[j]);
      const samples=[],scaling=[p.N,2*p.N].map(N=>({N,maxAngularValueChange:0,maxAxialValueChange:0,maxRadialAngularChange:0,maxRadialAxialChange:0}));
      for(let i=0;i<sampleCount;i++){
        budget.tick();const X=sampleXs[i],f=loops.fields(X,eta,p.N,true),base=profile.state(X,eta),post=integratedAfter(profile,p,eta,X,f,momentPath.values[i]);
        samples.push({...f,baseA:base.a,basePs:base.ps,loopConeGaps:coneGaps({a:f.aL,bs:f.bL,ps:base.ps}).gaps,
          postMoments:post.moments,postMomentEta:post.momentEta,Pi:post.Pi,PiEta:post.PiEta,V0:post.V0,postPs:post.ps,postConeGaps:coneGaps({a:f.aN,bs:f.bN,ps:post.ps}).gaps});
        for(let k=0;k<2;k++){
          const g=k?loops.fields(X,eta,2*p.N,true):f,s=scaling[k];
          s.maxAngularValueChange=Math.max(s.maxAngularValueChange,Math.abs(g.deltaE));s.maxAxialValueChange=Math.max(s.maxAxialValueChange,Math.abs(g.U));
          s.maxRadialAngularChange=Math.max(s.maxRadialAngularChange,Math.abs(g.DXE-base.E*base.slope));s.maxRadialAxialChange=Math.max(s.maxRadialAxialChange,Math.abs(g.DXU));
        }
      }
      const checkpointXs=[profile.left,Math.sqrt(profile.left*profile.right),profile.right],momentCheckpoints=[];
      for(const X of checkpointXs){const local=X===profile.right?debt:integrateDebt(profile,loops,p,eta,X,p.quadratureOrder,budget),f=loops.fields(X,eta,p.N,true),integrated=integratedAfter(profile,p,eta,X,f,local);momentCheckpoints.push({X,...integrated,a:f.aN,bs:f.bN,coneGaps:coneGaps({a:f.aN,bs:f.bN,ps:integrated.ps}).gaps});}
      const patchSamples=Array.from({length:65},(_,i)=>{
        const X=p.patch[0]+(p.patch[1]-p.patch[0])*i/64,f=correctedPoint(profile,map,repair,X),partial=correctionThrough(profile,map,repair,X,budget),cumulative={moments:debt.moments.map((v,j)=>v+partial.moments[j]),eta:debt.eta.map((v,j)=>v+partial.eta[j])};
        const bprime=map.supports.map(([a,b])=>bumpDerivative(X,a,b)),Eprime=profile.field(X).E*profile.beta/X+dot(bprime.slice(2),repair.coefficients.slice(2)),Uprime=dot(bprime.slice(0,2),repair.coefficients.slice(0,2));
        const a=1-2*X*Eprime/f.E,bs=2*X*Uprime/f.E,post=integratedAfter(profile,p,eta,X,f,cumulative);
        return {...f,a,bs,postMoments:post.moments,postMomentEta:post.momentEta,Pi:post.Pi,PiEta:post.PiEta,V0:post.V0,postPs:post.ps,postConeGaps:coneGaps({a,bs,ps:post.ps}).gaps};
      });
      const y=(profile.yl+profile.yr)/2+.031,N=p.N,X=Math.exp(y),e=Math.min(loops.radialStencilStep,5e-4/N),fc=loops.fields(X,eta,N,true),fp=loops.fields(X*Math.exp(e),eta,N),fm=loops.fields(X*Math.exp(-e),eta,N),fp2=loops.fields(X*Math.exp(2*e),eta,N),fm2=loops.fields(X*Math.exp(-2*e),eta,N);
      const fdA=1-2*(Math.log(fm2.E)-8*Math.log(fm.E)+8*Math.log(fp.E)-Math.log(fp2.E))/(12*e),fdB=2*(fm2.U-8*fm.U+8*fp.U-fp2.U)/(12*e*fc.E);
      const finalBase=profile.radial(p.patch[1]),postDebt={moments:postResidual,eta:postEtaResidual},final=integratedAfter(profile,p,eta,p.patch[1],{E:finalBase.E,U:0},postDebt);
      slices.push({eta,samples,scaling,momentCheckpoints,patchSamples,momentPathMethod:momentPath.method,
        primitiveDerivativeConvention:'DX differentiates log radius with phase fixed; eta differences also hold phase fixed; total C.12 radial derivatives include N*d/dphase',
        shearIdentityCheck:{X,logRadialStep:e,sourceC13:{a:fc.aN,bs:fc.bN},independentTotalFiniteDifference:{a:fdA,bs:fdB},defect:{a:fdA-fc.aN,bs:fdB-fc.bN},certified:false},
        momentDebt:debt,repair:{...repair,supports:map.supports,momentOrder:['M','I','J','S','Cp'],linearMap:map.A,quadraticTermsIncluded:true},
        independentMomentCheck:{modulationQuadratureOrder:p.includeIndependentQuadrature?p.quadratureOrder+4:null,correctionQuadratureOrder:192,
          modulationDifference:independentDebt.moments.map((v,j)=>v-debt.moments[j]),postResidual,postEtaResidual,continuousMomentsCertified:false},
        afterPatch:{X:p.patch[1],...final,basePs:profile.state(p.patch[1],eta).ps},
        positiveAtPatchSamples:patchSamples.every(s=>s.E>0),
        sampledCone:{modulatedPassing:samples.filter(s=>s.postConeGaps.every(v=>v>0)).length,modulatedTotal:samples.length,
          patchPassing:patchSamples.filter(s=>s.postConeGaps.every(v=>v>0)).length,patchTotal:patchSamples.length,
          minimumModulatedGaps:Array.from({length:4},(_,j)=>Math.min(...samples.map(s=>s.postConeGaps[j]))),minimumPatchGaps:Array.from({length:4},(_,j)=>Math.min(...patchSamples.map(s=>s.postConeGaps[j])))},
        globalConeCertified:false});
    }
    const all=slices.flatMap(s=>s.samples),allPatch=slices.flatMap(s=>s.patchSamples.map(v=>({...v,eta:s.eta}))),denseLines=slices.map(s=>({points:s.samples.map(v=>[Math.log(v.X),s.eta,p.N*v.deltaE])}));
    for(const slice of slices){
      const original=slice.samples,indices=new Set([0,original.length-1]);
      if(p.detailMode==='compact'){
        for(let j=0;j<p.samples;j++)indices.add(Math.round((original.length-1)*j/(p.samples-1)));
        for(let i=0;i<original.length;i++){
          const y=Math.log(original[i].X);if(loops.cutoffBreakpoints.some((v,k)=>k%2===0&&y>=v-1e-14&&y<=loops.cutoffBreakpoints[k+1]+1e-14))indices.add(i);
        }
        for(let k=0;k<4;k++){let j=0;for(let i=1;i<original.length;i++)if(original[i].postConeGaps[k]<original[j].postConeGaps[k])j=i;indices.add(j);}
        slice.samples=[...indices].sort((a,b)=>a-b).map(i=>original[i]);
      }
      slice.sampleSelection={mode:p.detailMode,denseDiagnosticCount:original.length,returnedDetailedRows:slice.samples.length,
        denseVisualizationPreserved:true,rule:'Compact table keeps requested radial rows, every narrow-cutoff row and each worst gap row; dense mode returns all fields'};
    }
    const sampledConePass=slices.every(s=>s.sampledCone.modulatedPassing===s.sampledCone.modulatedTotal&&s.sampledCone.patchPassing===s.sampledCone.patchTotal);
    return safe({status:'PARTIAL',domainStatus:sampledConePass?'SOURCE_C12_AND_FIRST_PATCH_COMPUTED':'SOURCE_C12_FIRST_PATCH_WITH_CONE_VIOLATIONS',sourceReferences:[SOURCE],parameters:p,
      inputContract:profile.contract,loopParameters:loops.parameters,loopSelectionScope:loops.selectionScope,loopDiagnostics:loops.stats,
      supportContract:{modulationInterval:p.modulationInterval,firstCorrectionPatch:p.patch,fieldsUnchangedBefore:profile.left,fieldsUnchangedAfter:p.patch[1],
        integratedFieldsExactlyRestored:false,originalPaperReservedPatchesInherited:false,cutoffQuadratureBreakpoints:loops.cutoffBreakpoints.map(Math.exp)},
      construction:'C.11/C.12/C.13 with fixed finite-family loop parameters, actual accumulated moment debt, and the source first-patch linear-plus-quadratic moment solve',
      slices,certifiedConditions:[],computedConditions:[{id:'ACTUAL_C12_FIELDS',pass:true},{id:'C13_CHAIN_RULE_SEPARATED',pass:true},{id:'ACTUAL_FIVE_MOMENT_DEBT',pass:true},{id:'FIRST_PATCH_NONLINEAR_SYSTEM',pass:slices.every(s=>s.repair.finiteNonlinearSystemSolved)},{id:'SAMPLED_POST_CONE',pass:sampledConePass,scope:'Only computed finite diagnostic samples; never all-domain certification'}],
      missingConditions:['The supplied explicit annulus is not the regular-axis/full outer profile of Corollary B.10.',
        'Loop parameters are checked at finite states; a uniform complete (X,eta) certificate is not supplied.',
        'Primitive inversion, X/eta differentiation and oscillatory quadrature have numerical errors, not a complete interval enclosure.',
        'The exact continuous moment map has not received a uniform interval-Newton certificate; finite and independently reintegrated residuals are reported.',
        'The finite N construction is computed, but the complete post-modulation/post-repair cone has no all-domain positive kappa certificate.'],
      fullProfileCertified:false,fullNavierStokesSolution:false,newLeanKernelRun:false,
      visualization:{points:[...all.map(s=>({pos:[Math.log(s.X),s.eta,p.N*s.deltaE],value:p.N*s.deltaE,label:'C.12: N times actual angular-field change'})),...allPatch.map(s=>({pos:[Math.log(s.X),s.eta,p.N*s.deltaE],value:p.N*s.deltaE,label:'C.2: N times actual first-patch correction'}))],
        lines:[...denseLines,...slices.map(s=>({points:s.patchSamples.map(v=>[Math.log(v.X),s.eta,p.N*v.deltaE])}))],arrows:[],axes:['log X','eta','N (E_N - E)'],
        valueMeaning:'N(E_N−E), the same quantity and scale on the modulation and correction patch',
        description:'Actual C.12 angular-field change multiplied by N, followed by the computed five-moment correction. This explicit scaling makes the O(1/N) values visible.',coordinateMeaning:'Similarity radial coordinate, parameter eta and N times the angular-profile difference; not a 3D physical-space solution.',
        lostInformation:['No certified original full profile or full-domain cone.','The vertical axis is explicitly multiplied by N; unscaled fields are in the detailed table.','Compact detail mode keeps selected rows while preserving every dense visualization point and cone diagnostic.','Displayed fields and moment identities have the recorded numerical defects.']}});
  }catch(e){return safe({status:failStatus(e),domainStatus:e.code??'COMPUTATION_ERROR',message:e.message,detail:e.detail??{},sourceReferences:[SOURCE],fullProfileCertified:false});}
}

function getRadialModulationExamples(){return [
  {id:'ns-source-radial-modulation',label:'원문 C.12 · 실제 변조와 첫 patch 복원 (N=512)',request:{kind:'ns.radial-modulation',input:{family:'explicit-power-annulus',N:512,etaValues:[0],samples:97},budget:{maxOperations:50000000,maxMilliseconds:60000,maxPoints:8192}}},
  {id:'ns-source-radial-small-frequency',label:'작은 N=8 · 실제 cone 위반을 확인하는 대조',request:{kind:'ns.radial-modulation',input:{family:'explicit-power-annulus',N:8,etaValues:[0],samples:97},budget:{maxOperations:50000000,maxMilliseconds:60000,maxPoints:4096}}}
];}

return {validateRadialModulationInput,runRadialModulation,getRadialModulationExamples};
})();
const __m1_33 = (()=>{
/** Actual B.34/B.8 operations on the output of the finite B.26 construction.
 * Numerical equalities are never promoted to continuous or uniform certificates.
 * Every five-moment discrepancy below is measured from that computed input;
 * this module does not accept a user-supplied or planted discrepancy.
 */
const {ComputeError,makeBudget,finiteNumber,positive,boundedInteger,solveLinear} = __m1_16;
const {smoothStep,smoothStepDerivative} = __m1_23;
const {runControlledContinuation,validateContinuationInput,getContinuationExamples} = __m1_29;
const {validateOuterInput} = __m1_28;
const SOURCE={attachment:'01-navier-stokes.pdf',sha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',pages:[28,127,128,154,155,156,157],equations:['4.15','4.16','A.7','B.32','B.33','B.34','B.35','B.36','B.37','B.38','B.39','B.40'],statements:['Lemma A.2','Corollary A.3','Proposition B.8']};
const bf=b=>b?.tick?b:makeBudget(b??{}),zeros=n=>Array(n).fill(0),maxabs=a=>Math.max(...a.map(Math.abs));
const clean=x=>{
  if(typeof x==='number'){
    if(!Number.isFinite(x))throw new ComputeError('PRECISION_REQUIRED','A gluing output is not finite');
    return Number.isInteger(x)&&!Number.isSafeInteger(x)?{kind:'FLOAT64',value:x.toExponential(17),precisionBits:53}:Object.is(x,-0)?0:x;
  }
  if(Array.isArray(x))return x.map(clean);
  if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([,v])=>v!==undefined&&typeof v!=='function').map(([k,v])=>[k,clean(v)]));
  return x;
};
const num=x=>typeof x==='number'?x:x?.kind==='FLOAT64'?Number(x.value):NaN;
const Z=()=>({sign:0,logAbs:-Infinity}),SL=x=>x===0?Z():({sign:Math.sign(x),logAbs:Math.log(Math.abs(x))});
const sgn=(sign,logAbs)=>sign===0||logAbs===-Infinity?Z():({sign:Math.sign(sign),logAbs});
function add(a,b){if(!a.sign)return {...b};if(!b.sign)return {...a};if(a.logAbs<b.logAbs)return add(b,a);const d=b.logAbs-a.logAbs;if(a.sign===b.sign)return sgn(a.sign,a.logAbs+Math.log1p(Math.exp(d)));if(d===0)return Z();return sgn(a.sign,a.logAbs+Math.log(-Math.expm1(d)));}
const shift=(a,v)=>a.sign?sgn(a.sign,a.logAbs+v):Z(),scale=(a,v)=>v===0?Z():sgn(a.sign*Math.sign(v),a.logAbs+Math.log(Math.abs(v))),sub=(a,b)=>add(a,scale(b,-1));
const sum=a=>a.reduce(add,Z()),asFloat=a=>a.sign?a.sign*Math.exp(a.logAbs):0;
function pack(a){if(!a.sign)return {kind:'SIGNED_LOG',sign:0,logAbs:null,float64:0,mathematicalZeroCertified:false};const v=asFloat(a),ok=Number.isFinite(v)&&v!==0;return {kind:'SIGNED_LOG',sign:a.sign,logAbs:a.logAbs,float64:ok?v:null,underflowAvoided:!ok&&a.logAbs<0,overflowAvoided:!ok&&a.logAbs>0};}
const addv=(a,b)=>a.map((v,i)=>add(v,b[i])),subv=(a,b)=>a.map((v,i)=>sub(v,b[i]));
const rules=new Map();
function gauss(n){if(rules.has(n))return rules.get(n);const out=[];for(let i=1;i<=n;i++){let z=Math.cos(Math.PI*(i-.25)/(n+.5)),dp=0;for(let j=0;j<18;j++){let a=1,b=z;for(let k=2;k<=n;k++){const v=((2*k-1)*z*b-(k-1)*a)/k;a=b;b=v;}dp=n*(z*b-a)/(z*z-1);const d=b/dp;z-=d;if(Math.abs(d)<2e-16)break;}let a=1,b=z;for(let k=2;k<=n;k++){const v=((2*k-1)*z*b-(k-1)*a)/k;a=b;b=v;}dp=n*(z*b-a)/(z*z-1);out.push([z,2/((1-z*z)*dp*dp)]);}rules.set(n,out);return out;}
function quadSL(f,a,b,n,budget){let out=null;if(a===b)return f(a).map(Z);const half=(b-a)/2,mid=(a+b)/2;for(const [z,w] of gauss(n)){budget.tick();const vals=f(mid+half*z);if(!out)out=vals.map(Z);out=addv(out,vals.map(v=>scale(v,w*half)));}return out;}
function quad(f,a,b,n,budget){let out=null;if(a===b)return f(a).map(()=>0);const half=(b-a)/2,mid=(a+b)/2;for(const [z,w] of gauss(n)){budget.tick();const vals=f(mid+half*z);if(!out)out=vals.map(()=>0);for(let i=0;i<vals.length;i++)out[i]+=w*half*vals[i];}return out;}
function plain(value,depth=0){if(depth>10)throw new ComputeError('INVALID_INPUT','Input nesting exceeds 10');if(value===null||typeof value==='string'||typeof value==='boolean')return;if(typeof value==='number'){if(!Number.isFinite(value))throw new ComputeError('INVALID_INPUT','All numeric inputs must be finite');return;}if(Array.isArray(value)){if(value.length>128)throw new ComputeError('INVALID_INPUT','Input array is too large');value.forEach(v=>plain(v,depth+1));return;}if(!value||typeof value!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new ComputeError('INVALID_INPUT','Only plain JSON input is supported');for(const v of Object.values(value))plain(v,depth+1);}
function defaults(){const c=structuredClone(getContinuationExamples()[1].request.input);Object.assign(c.axis,{logC:80,Lambda:1024,j0:1e-6});c.samples=33;return {continuation:c,etaValues:[0],etaStep:2e-5,Tsh:640,samples:97,quadratureOrder:64,transitionSegments:64,newtonIterations:24,tolerance:1e-9};}
function validateInnerGluingInput(input={}){
  try{
    plain(input);if(!input||typeof input!=='object'||Array.isArray(input))throw new ComputeError('INVALID_INPUT','Gluing input must be an object');
    const d=defaults();for(const key of Object.keys(input))if(!Object.hasOwn(d,key))throw new ComputeError('INVALID_INPUT','Unknown gluing input; terminal moments and correction debts cannot be supplied',{key});
    const p={...d,...input,continuation:{...d.continuation,...input.continuation,axis:{...d.continuation.axis,...input.continuation?.axis}}};
    for(const key of Object.keys(p.continuation))if(!['etaValues','eta','pressure','axis','etaJetOrder','t1','axialWidth','shearWidth','referenceSteps','transitionSteps','radialSteps','samples','kappa0'].includes(key))throw new ComputeError('INVALID_INPUT','Unknown upstream continuation input',{key});
    for(const key of Object.keys(p.continuation.axis))if(!['h','j0','sigmaStar','Lambda','logC','axisOrder'].includes(key))throw new ComputeError('INVALID_INPUT','Unknown upstream axis input',{key});
    if(p.continuation.pressure?.family!=='source-outer-A21')throw new ComputeError('UNSUPPORTED','The B.8 source gluing job requires the actual A.21 pressure family');
    for(const key of Object.keys(p.continuation.pressure))if(!['family','parameters'].includes(key))throw new ComputeError('INVALID_INPUT','Unknown source pressure input',{key});
    const pv=validateOuterInput({parameters:p.continuation.pressure.parameters??{}});if(!pv.valid)throw new ComputeError(pv.status,pv.message,pv.detail);
    if(!Array.isArray(p.etaValues)||p.etaValues.length<1||p.etaValues.length>3||p.etaValues.some(x=>typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>=1))throw new ComputeError('INVALID_INPUT','etaValues must contain 1..3 interior points of [-1,1]');
    p.etaStep=positive(p.etaStep,'etaStep');if(p.etaStep<1e-7||p.etaStep>.001||p.etaValues.some(x=>Math.abs(x)+p.etaStep>=1))throw new ComputeError('INVALID_INPUT','Each central eta stencil must fit strictly inside [-1,1]');
    p.Tsh=positive(p.Tsh,'Tsh');if(p.Tsh>4000)throw new ComputeError('PRECISION_REQUIRED','Tsh above 4000 requires an extended numerical integration profile');
    p.samples=boundedInteger(p.samples,'samples',33,257);p.quadratureOrder=boundedInteger(p.quadratureOrder,'quadratureOrder',16,64);p.transitionSegments=boundedInteger(p.transitionSegments,'transitionSegments',16,256);p.newtonIterations=boundedInteger(p.newtonIterations,'newtonIterations',1,40);
    p.tolerance=positive(p.tolerance,'tolerance');if(p.tolerance<1e-12||p.tolerance>1e-5)throw new ComputeError('INVALID_INPUT','Supported numerical residual tolerance is 1e-12..1e-5');
    const etas=[...new Set(p.etaValues.flatMap(e=>[e-p.etaStep,e,e+p.etaStep]))].sort((a,b)=>a-b);p.continuation={...p.continuation,etaValues:etas,samples:33};const v=validateContinuationInput(p.continuation);if(!v.valid)throw new ComputeError(v.domainStatus??v.status,v.message,v.detail);
    const logP=finiteNumber(p.continuation.pressure.parameters?.logP??14,'logP'),logXR=Math.log(110)+10*(v.options.logC+logP),logXsep=Math.log(110)+p.Tsh,logxsep=logXsep-logXR;
    if(!(logxsep<-8))throw new ComputeError('INVALID_SUPPORT','B.38 requires xsep<exp(-8); increase logC after fixing Tsh',{logXR,logXsep,logxsep});
    return {valid:true,parameters:p,continuationParameters:v.options,etaStencil:etas,scales:{Xi:110,logC:v.options.logC,logP,logXR,logXsep,logxsep},requirements:{uniformB33BoundCertified:false,intervalNewtonCertified:false,wholeProfileCertified:false}};
  }catch(e){return {valid:false,status:['PRECISION_REQUIRED','UNSUPPORTED'].includes(e.code)?e.code:'FAILED',domainStatus:e.code??'INVALID_INPUT',message:e.message,detail:e.detail??{}};}
}
function ideal(eta,logP,y){const f=1/(1+eta*eta),U=4*eta,logE=logP+Math.log(f)+.1*y,E=Math.exp(logE),x=Math.exp(y);return {x,y,E,U,logE,f,a:.8,bs:0};}
function idealMomentSL(eta,logP,y){const logK=logP-Math.log1p(eta*eta),U=4*eta,I=sgn(1,Math.log(Math.SQRT2/1.6)+logK+1.6*y);return [sgn(Math.sign(U),Math.log(Math.abs(U))+y),I,scale(I,U),sub(sgn(U?1:0,2*Math.log(Math.abs(U))+y),sgn(1,2*logK+1.2*y-Math.log(2.4))),sgn(1,Math.log(2.5)+2*logK+.2*y)];}
function idealDerivatives(eta,logP,y){const m=idealMomentSL(eta,logP,y).map(asFloat),x=Math.exp(y),U=4*eta,k=-2*eta/(1+eta*eta),energy=Math.exp(2*(logP-Math.log1p(eta*eta))+1.2*y)/2.4;return [4*x,k*m[1],4*m[1]+U*k*m[1],8*U*x-2*k*energy,2*k*m[4]];}
function secondStep(t){if(t<=0||t>=1)return 0;const s=smoothStep(t),ds=smoothStepDerivative(t),z1=2/t**3+2/(1-t)**3,z2=-6/t**4+6/(1-t)**4;return ds*(1-2*s)*z1+s*(1-s)*z2;}
function supportData(){const a=Math.exp(-6),b=Math.exp(-5),width=(b-a)/16,centers=Array.from({length:5},(_,i)=>a+(i+1)*(b-a)/6);return {patch:[a,b],logPatch:[-6,-5],width,centers,supports:centers.map(c=>[c-width/2,c+width/2]),definition:'b_j(x)=sigmaPrime((x-left_j)/(right_j-left_j)); sigma is the pinned exp(-1/t^2) flat step',supportAssignment:['U','U','E','E','E'],disjoint:true};}
function bumpValues(data,x){return data.supports.map(([a,b])=>smoothStepDerivative((x-a)/(b-a)));}
function bumpDerivatives(data,x){return data.supports.map(([a,b])=>secondStep((x-a)/(b-a))/(b-a));}
const rawToBlock=(v,eta)=>[v[0],v[2]-4*eta*v[1],v[1],v[3]-8*eta*v[0],v[4]];
/** Representation check only. This does not accept replacement job moments. */
function assessInnerGluingDebtRepresentation(values){
  if(!Array.isArray(values)||values.length!==5||values.some(v=>!v||![0,1,-1].includes(v.sign)||(v.sign!==0&&!Number.isFinite(v.logAbs))))throw new ComputeError('INVALID_INPUT','Five signed logarithmic moment values are required');
  const floats=values.map(asFloat),underflowRows=values.map((v,i)=>v.sign&&floats[i]===0?i:null).filter(x=>x!==null),overflowRows=floats.map((v,i)=>!Number.isFinite(v)?i:null).filter(x=>x!==null);
  return {representable:underflowRows.length===0&&overflowRows.length===0,underflowRows,overflowRows,values:underflowRows.length||overflowRows.length?null:floats};
}
function prepareSlice(end,valid,budget){
  const {parameters:p,scales:s}=valid,eta=end.eta,Gi=num(end.U),ell=s.logC+end.logE,logf=-Math.log1p(eta*eta),inner=end.moments.map(num),Pi0=num(end.Pi)-inner[4],Pi0Eta=num(end.etaJets.Pi[1])-num(end.momentEtaJets[4][1]);
  if(![Gi,ell,Pi0,Pi0Eta,...inner].every(Number.isFinite))throw new ComputeError('PRECISION_REQUIRED','The actual finite continuation endpoint is not representable');
  const initial=inner.map((v,i)=>shift(SL(v),-[1,1.5,1.5,1,0][i]*s.logXR));
  const transitionField=yi=>{const t=yi/p.Tsh,cut=smoothStep(t),logE=-s.logC+.1*yi+(1-cut)*ell+cut*logf,slope=.1+smoothStepDerivative(t)/p.Tsh*(logf-ell);return {yi,logx:Math.log(110)-s.logXR+yi,logX:Math.log(110)+yi,logE,U:Gi,a:1-2*slope,bs:0};};
  const density=yi=>{const v=transitionField(yi),y=v.logx,L=v.logE;return [sgn(Math.sign(Gi),Math.log(Math.abs(Gi))+y),sgn(1,Math.log(Math.SQRT2)+L+1.5*y),sgn(Math.sign(Gi),Math.log(Math.abs(Gi))+Math.log(Math.SQRT2)+L+1.5*y),sub(sgn(Gi?1:0,2*Math.log(Math.abs(Gi))+y),sgn(1,2*L+y-Math.log(2))),sgn(1,2*L-Math.log(2))];};
  let cumulative=initial,coarse=initial;const prefix=[{yi:0,moments:initial}];
  for(let i=0;i<p.transitionSegments;i++){const a=p.Tsh*i/p.transitionSegments,b=p.Tsh*(i+1)/p.transitionSegments;cumulative=addv(cumulative,quadSL(density,a,b,p.quadratureOrder,budget));coarse=addv(coarse,quadSL(density,a,b,Math.max(8,p.quadratureOrder/2|0),budget));prefix.push({yi:b,moments:cumulative});}
  const targetSep=idealMomentSL(eta,s.logP,s.logxsep),debtSep=subv(cumulative,targetSep),U0=4*eta,du=Gi-U0;
  function beforeRestore(y){const cur=idealMomentSL(eta,s.logP,y),xDelta=sub(sgn(1,y),sgn(1,s.logxsep)),iDelta=sub(cur[1],targetSep[1]);return addv(debtSep,[scale(xDelta,du),Z(),scale(iDelta,du),scale(xDelta,Gi*Gi-U0*U0),Z()]);}
  const restoreDensity=y=>{const f=ideal(eta,s.logP,y),U=Gi+(U0-Gi)*smoothStep(y+8),delta=U-U0;return [delta*f.x,0,delta*Math.sqrt(2*f.x)*f.E*f.x,(U*U-U0*U0)*f.x,0];};
  const debtAtMinus8=beforeRestore(-8),restore=quad(restoreDensity,-8,-7,p.quadratureOrder*2,budget),debtBeforePatch=addv(debtAtMinus8,restore.map(SL));
  function debtBefore(y){if(y<=-8)return beforeRestore(y);if(y<-7)return addv(debtAtMinus8,quad(restoreDensity,-8,y,p.quadratureOrder*2,budget).map(SL));return debtBeforePatch;}
  const shapeAt=y=>{const f=ideal(eta,s.logP,y);if(y<-7){f.U=Gi+(U0-Gi)*smoothStep(y+8);f.bs=2*(U0-Gi)*smoothStepDerivative(y+8)/f.E;}return f;};
  return {eta,Gi,ell,Pi0,Pi0Eta,initial,cumulative,coarse,debtSep,debtAtMinus8,debtBeforePatch,debtBefore,shapeAt,transitionField,prefix,
    endpoint:{eta,Xi:110,ell_i:ell,Gi,logE:end.logE,moments:inner,momentEtaJets:end.momentEtaJets,pressureDatum:Pi0,pressureDatumEta:Pi0Eta},
    b34:{endpoint:transitionField(p.Tsh),normalizationLogEqualityDefect:transitionField(p.Tsh).logE-ideal(eta,s.logP,s.logxsep).logE,numericalQuadratureDifference:subv(cumulative,coarse).map(pack),initialNormalizedMoments:initial.map(pack),atXsepNormalizedMoments:cumulative.map(pack),idealXsepMoments:targetSep.map(pack),actualXsepDiscrepancy:debtSep.map(pack)}};
}
function solvePatch(slice,valid,budget){
  const {parameters:p,scales:s}=valid,data=supportData(),L=Array.from({length:5},()=>zeros(5)),Q=Array.from({length:5},()=>Array.from({length:5},()=>zeros(5))),eta=slice.eta,momentOrder=Math.max(128,2*p.quadratureOrder),reintegratedOrder=momentOrder+64;
  for(const [a,b] of data.supports){const v=quad(x=>{budget.tick(150);const base=ideal(eta,s.logP,Math.log(x)),bs=bumpValues(data,x),sqrt=Math.sqrt(2*x),flat=[];for(let row=0;row<5;row++)for(let j=0;j<5;j++){const du=j<2?bs[j]:0,de=j>=2?bs[j]:0;flat.push([du,sqrt*de,sqrt*(base.E*du+base.U*de),2*base.U*du-base.E*de,base.E*de/x][row]);}for(let row=0;row<5;row++)for(let j=0;j<5;j++)for(let k=0;k<5;k++){const uj=j<2?bs[j]:0,uk=k<2?bs[k]:0,ej=j>=2?bs[j]:0,ek=k>=2?bs[k]:0;flat.push([0,0,sqrt*(uj*ek+uk*ej)/2,uj*uk-ej*ek/2,ej*ek/(2*x)][row]);}return flat;},a,b,momentOrder,budget);let k=0;for(let r=0;r<5;r++)for(let j=0;j<5;j++)L[r][j]+=v[k++];for(let r=0;r<5;r++)for(let j=0;j<5;j++)for(let m=0;m<5;m++)Q[r][j][m]+=v[k++];}
  const representation=assessInnerGluingDebtRepresentation(slice.debtBeforePatch),underflowDebtRows=representation.underflowRows;
  if(!representation.representable)throw new ComputeError('PRECISION_REQUIRED','A nonzero actual moment discrepancy cannot be converted into the current Float64 Newton coordinates',{eta,underflowDebtRows,overflowDebtRows:representation.overflowRows,actualDebt:slice.debtBeforePatch.map(pack)});
  const debt=representation.values;
  const blockL=Array.from({length:5},()=>zeros(5));for(let j=0;j<5;j++){const c=rawToBlock(L.map(row=>row[j]),eta);for(let r=0;r<5;r++)blockL[r][j]=c[r];}
  const normalization=blockL.map(r=>Math.max(maxabs(r),1e-300));
  const rawMap=c=>debt.map((d,r)=>d+L[r].reduce((s,v,j)=>s+v*c[j],0)+Q[r].reduce((s,row,j)=>s+row.reduce((ss,v,k)=>ss+v*c[j]*c[k],0),0));
  const jacobian=c=>L.map((row,r)=>row.map((v,j)=>v+Q[r].reduce((s,rr,k)=>s+(Q[r][j][k]+Q[r][k][j])*c[k],0)));
  const normF=c=>rawToBlock(rawMap(c),eta).map((v,r)=>v/normalization[r]);
  const normJ=c=>{const J=jacobian(c),out=Array.from({length:5},()=>zeros(5));for(let j=0;j<5;j++){const col=rawToBlock(J.map(r=>r[j]),eta);for(let r=0;r<5;r++)out[r][j]=col[r]/normalization[r];}return out;};
  const field=(x,c)=>{const f=ideal(eta,s.logP,Math.log(x)),b=bumpValues(data,x),db=bumpDerivatives(data,x),dU=c[0]*b[0]+c[1]*b[1],dE=c.slice(2).reduce((ss,v,j)=>ss+v*b[j+2],0),U=f.U+dU,E=f.E+dE,Ux=c[0]*db[0]+c[1]*db[1],Ex=.1*f.E/x+c.slice(2).reduce((ss,v,j)=>ss+v*db[j+2],0);return {x,y:Math.log(x),E,U,logE:E>0?Math.log(E):null,a:1-2*x*Ex/E,bs:2*x*Ux/E,dU,dE};};
  const positivityNodes=data.supports.flatMap(([a,b])=>gauss(p.quadratureOrder).map(([z])=>(a+b)/2+(b-a)*z/2));
  const positive=c=>positivityNodes.every(x=>field(x,c).E>0);
  let c=zeros(5),history=[],numericalStatus='ITERATION_LIMIT',linearFailure=null;
  for(let iteration=0;iteration<p.newtonIterations;iteration++){budget.tick(500);const F=normF(c),residual=maxabs(F);history.push({iteration,scaledResidual:residual});if(residual<p.tolerance){numericalStatus='NUMERICAL_ROOT';break;}let step;try{step=solveLinear(normJ(c),F.map(x=>-x)).solution;}catch(e){linearFailure={code:e.code,message:e.message};numericalStatus='SINGULAR_JACOBIAN';break;}let accepted=false;for(let power=0;power<28;power++){budget.tick();const factor=2**(-power),trial=c.map((v,j)=>v+factor*step[j]);if(positive(trial)&&maxabs(normF(trial))<residual){c=trial;history.at(-1).acceptedStepFactor=factor;accepted=true;break;}}if(!accepted){numericalStatus='LINE_SEARCH_FAILED';break;}}
  const integratedChange=y=>{const xEnd=Math.exp(y),out=zeros(5);for(const [a,b] of data.supports){if(xEnd<=a)continue;const v=quad(x=>{const f0=ideal(eta,s.logP,Math.log(x)),f1=field(x,c),du=f1.dU,de=f1.dE,sqrt=Math.sqrt(2*x);return [du,sqrt*de,sqrt*(f0.U*de+f0.E*du+du*de),2*f0.U*du-f0.E*de+du*du-de*de/2,(2*f0.E*de+de*de)/(2*x)];},a,Math.min(b,xEnd),reintegratedOrder,budget);for(let j=0;j<5;j++)out[j]+=v[j];}return out;};
  const independentChange=integratedChange(-5),independentResidual=independentChange.map((v,j)=>v+debt[j]),independentScaled=maxabs(rawToBlock(independentResidual,eta).map((v,j)=>v/normalization[j]));
  const finalJ=normJ(c);let inverseInfinityNorm=null;try{const columns=Array.from({length:5},(_,j)=>solveLinear(finalJ,zeros(5).map((_,k)=>j===k?1:0)).solution);inverseInfinityNorm=Math.max(...Array.from({length:5},(_,r)=>columns.reduce((sum,col)=>sum+Math.abs(col[r]),0)));}catch{}
  const match=independentScaled<p.tolerance&&positive(c);
  const cache=new Map();
  function debtAt(y){if(cache.has(y))return cache.get(y);const d=y<=-6?slice.debtBefore(y):addv(slice.debtBeforePatch,integratedChange(y).map(SL));cache.set(y,d);return d;}
  function at(y){return y<=-6?slice.shapeAt(y):field(Math.exp(y),c);}
  return {at,debtAt,field,c,match,record:{eta,status:match?'NUMERICAL_FIVE_MOMENT_MATCH':numericalStatus,actualDebt:slice.debtBeforePatch.map(pack),actualDebtFloat64:debt,actualDebtSource:'Measured B.26 endpoint, integrated B.34 transition, exact power segment, and actual Gi-to-4eta restoration; no planted coefficients or requested discrepancy.',...data,coefficients:c,momentOrder:['M','I','J','S','Cp'],blockMomentOrder:['M','J-4eta I','I','S-8eta M','Cp'],linearMap:L,quadraticMap:Q,transformedLinearMap:blockL,rowNormalization:normalization,rawJacobian:jacobian(c),normalizedJacobian:finalJ,rawPolynomialResidual:rawMap(c),independentIntegralChange:independentChange,independentResidual,independentScaledResidual:independentScaled,polynomialScaledResidual:maxabs(normF(c)),inverseInfinityNorm,history,linearFailure,quadratureOrders:{map:momentOrder,reintegrated:reintegratedOrder},analyticBumpMassAudit:[0,1].map(j=>({column:j,exactMass:data.width,computedMass:L[0][j],relativeError:(L[0][j]-data.width)/data.width})),positiveAtQuadratureNodes:positive(c),finiteNumericalMomentMatch:match,intervalNewtonCertified:false,continuousMomentsCertified:false,uniformEtaDerivativesCertified:false,underflowDebtRows,finalNormalizedMoments:addv(idealMomentSL(eta,s.logP,-5),independentResidual.map(SL)).map(pack)}};
}
function stateAt(slice,patch,minus,plus,valid,y){
  const {parameters:p,scales:s,continuationParameters:{h}}=valid,e=slice.eta,x=Math.exp(y),field=patch.at(y),m0=idealMomentSL(e,s.logP,y).map(asFloat),debt=patch.debtAt(y).map(asFloat),mp=plus.debtAt(y).map(asFloat),mm=minus.debtAt(y).map(asFloat),m=m0.map((v,i)=>v+debt[i]),dm=idealDerivatives(e,s.logP,y).map((v,i)=>v+(mp[i]-mm[i])/(2*p.etaStep));
  const [M,I,J,S,Cp]=m,[Me,Ie,Je,Se,Cpe]=dm,D=.5-h,A=.5+h,d=1-e*e,L=1-2*h*e*e,H=Math.sqrt(2*x)*field.E,Pi=slice.Pi0+Cp,PiEta=slice.Pi0Eta+Cpe;
  const W=1-2*D*e*M/x-d*Me/x,Qs=-W+((1-h)*I-D*e*Ie-d*Je+2*(h-D)*e*J)/(x*H);
  // B.35: -W U is outside the 1/x moment fraction.
  const Ns=-W*field.U+(D*(M-e*Me)+4*h*e*S-d*Se)/x+4*A*e*Pi-d*PiEta;
  const a=field.a,bs=field.bs,logScale=s.logXR+y-Math.log(L),invScale=Math.exp(-logScale),cOverScale=Qs-bs*Ns/(a*field.E),jOverScale=Ns/field.E+bs*Qs/a,v=a+bs*bs/a;
  const relaxed=field.E>0&&a>0&&cOverScale>Math.max(2,v)*invScale&&2*(cOverScale-v*invScale)**2>Math.max(0,v-2)*jOverScale*jOverScale;
  return {logx:y,logX:s.logXR+y,eta:e,E:field.E,logE:field.logE,U:field.U,a,bs,Pi,W,Qs,Ns,moments:m,momentEtaDerivatives:dm,momentDiscrepancy:debt,
    p1:pack(shift(SL(Qs),logScale)),p2:pack(shift(SL(Ns/field.E),logScale)),cone:{a,v,cOverScale,jOverScale,logScale,relaxed,strictRelaxedConePointwiseDiagnostic:relaxed,uniformCertificate:false}};
}
async function runInnerGluing(input={},budgetInput={}){
  const budget=bf(budgetInput),valid=validateInnerGluingInput(input);if(!valid.valid)return clean({...valid,fullProfileCertified:false});
  try{
    const {parameters:p,scales:s}=valid;if((p.samples+17)*p.etaValues.length+46*valid.etaStencil.length>budget.maxPoints)throw new ComputeError('BUDGET_EXCEEDED','Gluing visualization and upstream stencils exceed the point budget');
    const upstream=await runControlledContinuation(p.continuation,budget);if(upstream.status!=='PARTIAL'||!upstream.slices)throw new ComputeError(upstream.domainStatus??upstream.status,upstream.message??'The actual upstream continuation did not produce endpoints',{upstreamStatus:upstream.status,upstreamDetail:upstream.detail??{}});
    const all=upstream.slices.map(v=>prepareSlice(v.samples.at(-1),valid,budget)),patches=all.map(v=>solvePatch(v,valid,budget)),find=e=>{const i=all.findIndex(v=>Math.abs(v.eta-e)<1e-12);if(i<0)throw new ComputeError('INVALID_INPUT','Required computed eta stencil is absent');return i;};
    const slices=p.etaValues.map(eta=>{const i=find(eta),slice=all[i],patch=patches[i],minus=patches[find(eta-p.etaStep)],plus=patches[find(eta+p.etaStep)],samples=[];for(let j=0;j<p.samples;j++)samples.push(stateAt(slice,patch,minus,plus,valid,-8+3*j/(p.samples-1)));const transition=Array.from({length:17},(_,j)=>({...slice.transitionField(p.Tsh*j/16),eta})),b33Sampled=20*8*(Math.abs(slice.ell)+Math.LN2);return {eta,upstreamEndpoint:slice.endpoint,B34:slice.b34,transitionSamples:transition,transitionShearRange:[Math.min(...transition.map(v=>v.a)),Math.max(...transition.map(v=>v.a))],TshSelection:{value:p.Tsh,finiteEndpointDiagnosticThreshold:b33Sampled,passesDisplayedDiagnostic:p.Tsh>=b33Sampled,sourceSigmaPrimeSupremumCandidate:8,uniformB0AndStepSupremumCertified:false,chosenBeforeAmplitude:false},restoration:{logInterval:[-8,-7],Gi:slice.Gi,targetU:4*eta,formula:'U=Gi+(4eta-Gi)*sigma(log x+8), E=Pstar*f*x^(1/10)'},momentCorrection:patch.record,samples,finiteEtaStencil:{values:[eta-p.etaStep,eta,eta+p.etaStep],step:p.etaStep,sharedKappa0:upstream.parameters.kappa0,method:'Central difference of the actual independently solved discrepancy; exact derivatives of the ideal A.7 moments are added separately.',uniformDerivativeBoundCertified:false},diagnostics:{numericalMomentMatch:patch.match,relaxedConePassingSamples:samples.filter(v=>v.cone.relaxed).length,totalConeSamples:samples.length,failedConeSamples:samples.filter(v=>!v.cone.relaxed).map(v=>({logx:v.logx,a:v.a,bs:v.bs,Qs:v.Qs,Ns:v.Ns,cone:v.cone})),boundaryFieldMatch:{E:samples.at(-1).E-ideal(eta,s.logP,-5).E,U:samples.at(-1).U-4*eta},terminalNormalizedMomentResidual:patch.record.independentResidual}};});
    const matches=patches.every(v=>v.match),conePass=slices.every(v=>v.diagnostics.relaxedConePassingSamples===v.diagnostics.totalConeSamples),domainStatus=!matches?'SOURCE_INNER_GLUING_NUMERICAL_MATCH_FAILED':conePass?'SOURCE_INNER_GLUING_COMPUTED':'SOURCE_INNER_GLUING_WITH_CONE_VIOLATIONS';
    return clean({status:'PARTIAL',domainStatus,sourceReferences:[SOURCE],parameters:p,scales:{...s,XR:pack(sgn(1,s.logXR)),Xsep:pack(sgn(1,s.logXsep)),xsep:pack(sgn(1,s.logxsep)),exactDefiningRelation:'log XR = log Xi + 10(log C + log Pstar)',pressureScaleInvariance:{sameA21Datum:true,reason:'A.21 integrates E^2/(2X) dX; X=XR exp(y) cancels XR. The upstream schedule normalization is retained for its pressure calculation, and the joined physical XR is shown separately.'}},
      inputContract:{upstream:'Actual runControlledContinuation using the pinned source-outer-A21 pressure producer',externalEndpointAllowed:false,externalMomentDebtAllowed:false,syntheticMomentDebt:false,finiteNonlinearAxis:true,fullInfiniteAxisCertified:false},sourceParameterDiagnostics:{logPAboveTd:s.logP>Math.exp(p.continuation.pressure.parameters?.Md??1)+10,necessaryScalarChecksAreNotSufficient:true,defaultScope:'The logP=0 example is an executable A.21/B.34/B.8 component candidate. It does not meet the sufficiently-large-Pstar paper hierarchy; larger-Pstar finite-axis failures are retained separately.'},slices,etaStencilCorrections:patches.map(v=>v.record),
      computedConditions:[{id:'B34_LOG_ANGULAR_TRANSITION',pass:true},{id:'B38_RADIAL_SCALE_PLACEMENT',pass:true},{id:'B8_AXIAL_RESTORATION',pass:true},{id:'B8_ACTUAL_FIVE_MOMENT_DEBT',pass:true},{id:'B8_QUADRATIC_FIVE_VARIABLE_SOLVE',pass:matches},{id:'B35_CORRECT_NORMALIZED_FIELDS',pass:true},{id:'RELAXED_CONE_AT_DISPLAYED_NODES',pass:conePass}],
      missingConditions:['The upstream B.26 profile still uses finite nonlinear axis coefficients, numerical pressure jets, RK4 integration and sampled kappa selection.','B.33/B.40 require common bounds and the mathematical order of choices before the final amplitude; the displayed finite-point diagnostics do not establish them.','The five actual moment equations are solved numerically and independently reintegrated; a continuous quadrature enclosure and uniform parameter interval-Newton inclusion are not available.','Central eta differences are diagnostics and have no certified uniform truncation bound.','Any displayed relaxed-cone violations are retained. The full B.36 tolerance, exact moment gluing, global admissible-cone realization and flat stress factor remain unproved for this candidate.'],
      fullProfileCertified:false,fullNavierStokesSolution:false,formalPass:false,evidenceGrade:'SOURCE_FORMULA_NUMERICAL_COMPONENT',sourceConstructionScope:{criterion:'N3-05',pointwiseNumericalCandidate:true,entireEtaIntervalCertified:false},
      visualization:{points:slices.flatMap(v=>[...v.transitionSamples.map(q=>({pos:[q.logX,q.eta,q.logE],value:q.U,label:'B.34 logarithmic transition'})),...v.samples.map(q=>({pos:[q.logX,q.eta,q.logE],value:q.U,label:q.cone.relaxed?'B.8 sampled relaxed cone passes':'B.8 sampled relaxed cone fails'}))]),lines:slices.map(v=>({points:[...v.transitionSamples.map(q=>[q.logX,q.eta,q.logE]),...v.samples.map(q=>[q.logX,q.eta,q.logE])]})),arrows:[],axes:['log X','eta','log E'],description:'Actual finite-axis endpoint, B.34 angular interpolation, Gi-to-4eta restoration, and five-variable quadratic moment correction.',coordinateMeaning:'Similarity-profile graph coordinates. Colors encode U; cone diagnostics remain separate.',lostInformation:['Logarithmic radius is required because the physical joining scale can exceed binary64.','No whole-eta, exact nonlinear-tail, interval-Newton or global stress certificate.']}});
  }catch(e){return clean({status:e.code==='RESOURCE_LIMIT'?'BUDGET_EXCEEDED':['BUDGET_EXCEEDED','CANCELLED','PRECISION_REQUIRED','UNSUPPORTED'].includes(e.code)?e.code:'FAILED',domainStatus:e.code??'COMPUTATION_ERROR',message:e.message,detail:e.detail??{},sourceReferences:[SOURCE],fullProfileCertified:false,formalPass:false});}
}
function getInnerGluingExamples(){return [{id:'ns-source-inner-gluing',label:'원문 B.34/B.8 · 실제 inner–outer 모멘트 접합 후보',request:{kind:'ns.source-inner-gluing',input:defaults(),budget:{maxOperations:40000000,maxMilliseconds:60000,maxPoints:2048}}}];}

return {validateInnerGluingInput,assessInnerGluingDebtRepresentation,runInnerGluing,getInnerGluingExamples};
})();
const __m1_34 = (()=>{
/** Additional source constructions, kept separate from the frozen v50 modules.
 * A local bound or a computed source component is not a completed global witness.
 */
const {ComputeError} = __m1_16;
const {certifyAxis, axisExampleInput, validateAxisInput} = __m1_26;
const {runAdmissibleLoop, getLoopExamples, validateLoopInput} = __m1_27;
const {runControlledContinuation, getContinuationExamples, validateContinuationInput} = __m1_29;
const {runOuterConstruction, outerExampleInput, validateOuterInput} = __m1_28;
const {certifyAxisSource, getAxisSourceExamples, validateAxisSourceInput} = __m1_31;
const {certifySourcePressureAnalytic, sourcePressureAnalyticExampleInput, validateSourcePressureAnalyticInput} = __m1_30;
const {runRadialModulation, getRadialModulationExamples, validateRadialModulationInput} = __m1_32;
const {runInnerGluing, getInnerGluingExamples, validateInnerGluingInput} = __m1_33;
const FOLLOWUP_KINDS = Object.freeze([
  'ns.axis-certificate', 'ns.source-outer',
  'ns.controlled-continuation', 'ns.admissible-loop',
  'ns.pressure-certificate', 'ns.axis-source-certificate', 'ns.radial-modulation', 'ns.source-inner-gluing',
]);

function getFollowupExamples() {
  return [
    {id:'ns-axis-exact-bounds', label:'실제 Bρ 국소 수렴·양성·무한 tail 상계',
      request:{kind:'ns.axis-certificate', input:axisExampleInput(),
        budget:{maxOperations:20000000,maxMilliseconds:60000,maxPoints:2048}}},
    {id:'ns-source-outer-repairs', label:'원문 외곽 진폭·모멘트·heat 보상',
      request:{kind:'ns.source-outer', input:outerExampleInput(),
        budget:{maxOperations:20000000,maxMilliseconds:60000,maxPoints:2048}}},
    ...getContinuationExamples(), ...getLoopExamples(),
    {id:'ns-source-pressure-bounds',label:'실제 A.21 압력 · 복소 영역과 모든 η 도함수 상계',
      request:{kind:'ns.pressure-certificate',input:sourcePressureAnalyticExampleInput(),
        budget:{maxOperations:20000000,maxMilliseconds:60000,maxPoints:2048}}},
    ...getAxisSourceExamples(), ...getRadialModulationExamples(),
    ...getInnerGluingExamples().map(e=>({...e,request:{...e.request,budget:{...e.request.budget,maxMillis:60000}}})),
  ];
}

function validateFollowupInput(kind, input={}) {
  const validator = {
    'ns.axis-certificate':validateAxisInput,
    'ns.source-outer':validateOuterInput,
    'ns.controlled-continuation':validateContinuationInput,
    'ns.admissible-loop':validateLoopInput,
    'ns.pressure-certificate':validateSourcePressureAnalyticInput,
    'ns.axis-source-certificate':validateAxisSourceInput,
    'ns.radial-modulation':validateRadialModulationInput,
    'ns.source-inner-gluing':validateInnerGluingInput,
  }[kind];
  if(!validator) return {valid:false,status:'UNSUPPORTED',message:'Unsupported follow-up NS construction.'};
  return validator(input);
}

async function runFollowupJob(kind, input, budget) {
  budget.tick();
  const runner = {
    'ns.axis-certificate':certifyAxis,
    'ns.source-outer':runOuterConstruction,
    'ns.controlled-continuation':runControlledContinuation,
    'ns.admissible-loop':runAdmissibleLoop,
    'ns.pressure-certificate':certifySourcePressureAnalytic,
    'ns.axis-source-certificate':certifyAxisSource,
    'ns.radial-modulation':runRadialModulation,
    'ns.source-inner-gluing':runInnerGluing,
  }[kind];
  if(!runner) throw new ComputeError('UNSUPPORTED','Unsupported follow-up NS construction.');
  const raw = await runner(input,budget);
  if(!raw || typeof raw!=='object' || Array.isArray(raw))
    throw new ComputeError('COMPUTATION_ERROR','A source construction must return a result object.');
  // Runtime observations are reported once by navier/index.mjs. Keeping elapsed
  // time inside an analytic certificate would change its mathematical replay hash.
  const {execution,executionMetrics,...result} = raw;
  const scopes={
    'ns.axis-certificate':'명시적인 유리함수 압력에 대한 국소 축 해의 정확 상계와 원문 정리 참조',
    'ns.source-outer':'유한 η 단면에서 원문 외부 스케줄·보정·A.21 압력의 실제 수치 계산',
    'ns.controlled-continuation':'유한 축 계수에서 시작하는 B.22·B.26의 실제 수치 연장',
    'ns.admissible-loop':'제공된 각 고정 상태에 대한 C.1 루프와 모든 위상의 원뿔 간격 상계',
    'ns.pressure-certificate':'실제 A.21 목표 압력의 양의 측도·복소 영역·모든 도함수에 대한 정확 상계',
    'ns.axis-source-certificate':'실제 A.21 목표 압력과 같은 h로 결속된 국소 축의 정확 상계',
    'ns.radial-modulation':'명시된 annulus에서 C.12 변조와 비선형 5모멘트 첫 patch의 실제 수치 계산',
    'ns.source-inner-gluing':'실제 A.21/B.26 끝점에서 B.34 연장·Gi 복원·다섯 누적 모멘트의 비선형 B.8 보정을 계산한 유한 η 후보',
  };
  const blockers=result.blockers??result.missingConditions??(
    kind==='ns.axis-certificate'?[
      '이 축 입력과 완성된 A.21 외부 압력이 같다는 인증은 아직 연결되지 않았습니다.',
      '무한 계수열의 상계와 별도 유한 η-jet 계산 사이의 동일성·반올림 오차 연결이 필요합니다.',
      '생성된 해석적 전제 전체의 Lean 증명과 전역 접합·응력 인증은 별도 조건입니다.',
    ]:['ns.pressure-certificate','ns.axis-source-certificate'].includes(kind)?[
      '실제 A.21 목표 압력을 사용합니다. 수치 보정된 외곽 장과 정확히 같은 압력인지의 인증은 남아 있습니다.',
      '별도 유한 η-jet 배열과 무한 계수열의 동일성·반올림 오차 연결은 남아 있습니다.',
      '생성된 해석적 전제 전체의 Lean 증명과 전역 접합·응력 인증은 별도 조건입니다.',
    ]:kind==='ns.source-outer'?[
      '모든 η에서 매개변수 조건과 모멘트 등식을 인증해야 합니다.',
      '정규 축과 제어 연장, 엄밀한 다섯 모멘트 접합을 연결해야 합니다.',
      '부호와 로그로 보존된 잔차는 수치 기록입니다. 작은 정규화 잔차만으로 정확 등식을 판정하지 않습니다.',
      ...(result.stressSupport?.missing??[]),
    ]:[]);
  return {
    ...result,
    domainStatus:result.domainStatus??(kind==='ns.source-outer'&&result.status==='PARTIAL'?'SOURCE_OUTER_CONSTRUCTION_COMPUTED':result.status),
    evidenceGrade:result.evidenceGrade??'SOURCE_FORMULA',
    certificateScope:result.certificateScope??scopes[kind],
    scopeDescription:scopes[kind],
    blockers,
    fullProfileCertified:false,
    fullCertifiedProfile:false,
    fullNavierStokesSolution:false,
    sourceConstructionScope:{
      ...(result.sourceConstructionScope??{}),
      originalAcceptanceIds:['ns.axis-certificate','ns.axis-source-certificate'].includes(kind)?['N3-01','N3-03','N3-04']:
        kind==='ns.pressure-certificate'?['N3-01','N3-02','N3-03']:
        kind==='ns.source-outer'?['N3-02','N3-07']:
        kind==='ns.controlled-continuation'?['N3-04','N3-05','N3-07']:
        kind==='ns.source-inner-gluing'?['N3-01','N3-05','N3-06','N3-07']:['N3-06'],
      completedGlobalWitness:false,
      generatedAnalyticPremisesKernelChecked:false,
      finiteOrLocalResultIsNotFullProfileCertification:true,
    },
  };
}

return {FOLLOWUP_KINDS,getFollowupExamples,validateFollowupInput,runFollowupJob};
})();
const __m1_35 = (()=>{
/** MathScope M1 Navier–Stokes bounded component laboratory.
 * No current job emits FULL_CERTIFIED_PROFILE or FULL_NAVIER_STOKES_SOLUTION.
 */
const {ComputeError,makeBudget,validatePrecision,finiteNumber,positive,boundedInteger,canonical,sha256,integrate} = __m1_16;
const {provenance} = __m1_17;
const {fixtures} = __m1_18;
const {leanEvidence} = __m1_19;
const {parameters,fromSimilarity,toSimilarity,coordinateFieldSample} = __m1_20;
const {heatIntegralCertificate,heatFast,heatTaylorFinite,exteriorPoint,exteriorJet,taylorGreenPoint} = __m1_21;
const {coordinateChecks,exactPDEChecks,spectralConvolutionCheck,coreReconstructionChecks} = __m1_24;
const {solveAxisCoefficients,evaluateAxis,comparisonSeries} = __m1_22;
const {parameterOrder,buildOuterSchedule,solveFiveMomentRepair,coneMargins,coneModulationFixture,certifiedConeBox} = __m1_23;
const {constructLeadingCandidate} = __m1_25;
const Followup = __m1_34;
const VERSION='1.3.0-m1';
const kinds=['ns.provenance','ns.coordinates','ns.heat','ns.exterior','ns.benchmark','ns.axis-series','ns.moments','ns.cone','ns.leading-profile','ns.validate',...Followup.FOLLOWUP_KINDS];
const commonBudget={maxOperations:20000000,maxMilliseconds:60000,maxPoints:480};
const commonPrecision={bits:53,absoluteTolerance:1e-8,relativeTolerance:1e-8};
function getCapabilities(){return {id:'navier-m1',version:VERSION,kinds,precision:{arithmetic:'exact rational axis bounds; outward binary64 heat and scalar intervals; signed-log outer quantities; binary64 candidate jets and ODEs',bits:53,minimumAbsoluteTolerance:2e-14,independentFixtures:'separate high-precision and exact rational reference calculations',unsupportedPrecisionStatus:'PRECISION_REQUIRED'},budget:{maximumOperations:50000000,maximumMilliseconds:120000,maximumPoints:16384,cancellation:'isCancelled callback checked in bounded numerical loops'},scope:['N1 provenance and exact theorem contract','N2 coordinates, heat, viscosity and independent PDE checks','N3 finite nonlinear axis and exact local bounds for an explicit analytic datum','Source outer repairs, exact A.21 pressure/axis input bounds, B.5 continuation, actual B.34/B.8 cumulative five-moment gluing, C.1 loops and C.12 modulation with nonlinear first-patch correction'],notImplemented:['one uniformly certified quantitative parameter selection for the full original datum','certified identity of the actual A.21 target with repaired outer fields and of finite eta jets with the infinite axis sequence','uniform interval-Newton five-moment gluing and complete radial/eta cone certification after the computed C.12 operation','N4-N8 full construction'],evidenceGrades:{...provenance.evidenceGrades,EXACT_BOUND_CERTIFICATE_WITH_THEOREM_REFERENCE:'Exact executable local bounds with explicit source-theorem references; no full generated analytic Lean proof or global profile.',EXACT_RATIONAL_BOUNDS_WITH_ANALYTIC_THEOREM_ARGUMENT:'Exact scalar bounds for the actual A.21 pressure with explicit analytic theorem arguments; generated Lean premise bundle remains open.'}};}
function getExamples(){return [
 ['ns-source-contract','논문 166쪽·정리·Lean 어댑터 계약','ns.provenance',{}],
 ['ns-similarity','실제 similarity 좌표와 역변환','ns.coordinates',{X:.6,eta:-.35,theta:.4,tau:.1,h:.005,viscosity:1}],
 ['ns-heat-interval','Heat factor 적분·도함수 구간 인증','ns.heat',{Z:1,h:.005,derivativeOrder:2,taylorOrder:8}],
 ['ns-source-exterior','원문 heat exterior · r > 0','ns.exterior',{tau:.1,h:.005,viscosity:1,cInfinity:1,radialCount:6}],
 ['ns-taylor-green','별도 정확 Taylor–Green 기준 해','ns.benchmark',{time:.19,viscosity:1}],
 ['ns-nonlinear-axis','원문 비선형 축 급수 · 꼬리 미인증','ns.axis-series',{eta:.2,axisOrder:8,Lambda:48,Ymax:1.2}],
 ['ns-five-moments','비선형 5모멘트 · 독립 재적분','ns.moments',{eta:.2}],
 ['ns-cone-operator','Cone 부등식과 실제 radial modulation 연산','ns.cone',{a:3,bs:0,ps:[5,0],N:32}],
 ['ns-leading-candidate','실제 축·외곽 + 미인증 접합 후보','ns.leading-profile',{tau:.1,h:.005,viscosity:1,etaCount:3,radialCount:12,axisOrder:8}],
 ['ns-independent-checks','FD·FFT·고정밀·음성 대조군','ns.validate',{}]
 ].map(([id,label,kind,input])=>({id,label,request:{kind,input,precision:{...commonPrecision},budget:{...commonBudget}}})).concat(Followup.getFollowupExamples().map(e=>({...e,request:{...e.request,precision:{...commonPrecision,...e.request.precision}}})));}
function finiteTree(v,path='input'){if(typeof v==='number'&&!Number.isFinite(v))throw new ComputeError('INVALID_INPUT',`${path} must be finite`);if(Array.isArray(v))v.forEach((x,i)=>finiteTree(x,`${path}[${i}]`));else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>finiteTree(x,`${path}.${k}`));}
function validateRequest(request){
  try{
    if(!request||typeof request!=='object'||!kinds.includes(request.kind))throw new ComputeError('UNSUPPORTED','Unknown NS job kind',{kind:request?.kind,supported:kinds});
    if(request.input!==undefined&&(request.input===null||typeof request.input!=='object'||Array.isArray(request.input)))throw new ComputeError('INVALID_INPUT','input must be an object');
    finiteTree(request);
    const precision=validatePrecision(request.precision),input=request.input??{};
    if(Followup.FOLLOWUP_KINDS.includes(request.kind)){
      const checked=Followup.validateFollowupInput(request.kind,input);
      if(!checked.valid)throw new ComputeError(checked.status??'INVALID_INPUT',checked.message??'Source construction input failed validation',checked.detail??{});
    }else{
      if(input.tau!==undefined)positive(input.tau,'tau');
      if(input.viscosity!==undefined)positive(input.viscosity,'viscosity');
      if(input.h!==undefined)parameters(input);
    }
    for(const k of ['maxOperations','maxMilliseconds','maxPoints'])if(request.budget?.[k]!==undefined){
      const v=request.budget[k];
      if(typeof v!=='number'||!Number.isSafeInteger(v)||v<1)throw new ComputeError('INVALID_INPUT',`${k} must be a positive safe integer`);
    }
    return {valid:true,kind:request.kind,input,precision,budget:{...commonBudget,...request.budget}};
  }catch(e){return {valid:false,status:e.code??'INVALID_INPUT',message:e.message,detail:e.detail??{}};}
}
function stripped(v){if(Array.isArray(v))return v.map(stripped);if(v&&typeof v==='object'){const out={};for(const [k,x]of Object.entries(v)){if(x===undefined||typeof x==='function'||k==='budget'||k==='executionMetrics')continue;out[k]=stripped(x);}return out;}return v;}
/** Canonical-safe scalars: a decimal string carries any unsafe integer float. */
function jsonSafe(v){if(typeof v==='bigint')return {kind:'INTEGER',value:v.toString()};if(typeof v==='number'){if(!Number.isFinite(v))return {kind:'NONFINITE_REJECTED',value:Number.isNaN(v)?'NaN':v>0?'Infinity':'-Infinity',usableAsNumber:false};if(Number.isInteger(v)&&!Number.isSafeInteger(v))return {kind:'FLOAT64',value:v.toExponential(17),precisionBits:53};return Object.is(v,-0)?0:v;}if(Array.isArray(v))return v.map(jsonSafe);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([,x])=>x!==undefined&&typeof x!=='function').map(([k,x])=>[k,jsonSafe(x)]));return v;}
function fieldVisualization(points,description,coordinateMeaning,lostInformation=[]){return {points:points.map(p=>({pos:p.position??p.pos,label:p.label??'',value:p.speed??p.value})),arrows:points.map(p=>({pos:p.position??p.pos,vector:p.velocity??p.vector})),lines:[],axes:['x','y','z'],description,coordinateMeaning,lostInformation};}
function exteriorJob(input,budget){const o={...parameters(input),cInfinity:positive(input.cInfinity??1,'cInfinity')},n=boundedInteger(input.radialCount??6,'radialCount',2,64),rmin=positive(input.rmin??.25,'rmin'),rmax=positive(input.rmax??2,'rmax');if(!(rmax>rmin))throw new ComputeError('INVALID_INPUT','rmax must exceed rmin');const points=[];for(let i=0;i<n;i++)for(let k=0;k<8;k++)for(const z of [-.5,.5]){if(points.length>=budget.maxPoints)break;budget.tick();const r=rmin+(rmax-rmin)*i/(n-1),t=2*Math.PI*k/8,p=exteriorPoint([r*Math.cos(t),r*Math.sin(t),z],o,budget);points.push({...p,label:`r=${r.toPrecision(4)}`});}return {status:'SOURCE_FORMULA_NUMERICAL_EVALUATION',evidenceGrade:'SOURCE_FORMULA',parameters:o,points,normalization:{cInfinity:o.cInfinity,proofSelected:false},domain:{excludeAxis:true,rMinimum:rmin,rMaximum:rmax,globalEnergyClaim:false},diagnostics:{pointCount:points.length,maxSpeed:Math.max(...points.map(p=>p.speed)),fullNavierStokesConstruction:false},errorBudget:{quadrature:'Adaptive Simpson value path; per-point estimates are not rigorous enclosures. Use ns.heat for certified integral balls.',solutionErrorBound:null},visualization:fieldVisualization(points,'원문 heat exterior의 실제 적분값. 축과 전역 접합은 제외됩니다.','Physical Cartesian coordinates and actual velocity components; UI may normalize arrows.',['z-independent standalone component has no finite R3 total energy.','cInfinity is an arbitrary display normalization until the full source matching is complete.'])};}
function benchmarkJob(input,budget){const o={time:input.time??.19,viscosity:input.viscosity??1},points=[];for(let i=0;i<7;i++)for(let j=0;j<7;j++)for(const z of [-.6,0,.6]){if(points.length>=budget.maxPoints)break;budget.tick();points.push(taylorGreenPoint([2*Math.PI*i/7,2*Math.PI*j/7,z],o));}const a=taylorGreenPoint([0,0,0],o),energyDerivative=-a.meanDissipation;return {status:'EXACT_BENCHMARK_FLOAT_EVALUATION',evidenceGrade:'FINITE_NUMERICAL_FIXTURE',parameters:o,points,domain:'(R/(2pi Z))^3',meanEnergy:a.meanEnergy,meanEnstrophy:a.meanEnstrophy,meanDissipation:a.meanDissipation,energyDerivative,fullSourceSolution:false,visualization:fieldVisualization(points,'별도의 정확한 주기 Taylor–Green 기준 해','Periodic physical x,y,z; this fixture is not the source blowup construction.',[])};}
function axisJob(input,budget){const o=parameterOrder(input),outer=buildOuterSchedule(o,budget),eta=finiteNumber(input.eta??.2,'eta');if(Math.abs(eta)>1)throw new ComputeError('INVALID_INPUT','|eta|<=1 required');const solution=solveAxisCoefficients(eta,{...o,axisOrder:input.axisOrder??8},outer.pressureJet,budget),Ymax=positive(input.Ymax??1.2,'Ymax'),values=Array.from({length:41},(_,i)=>evaluateAxis(solution,Ymax*i/(40*o.Lambda)));return {status:solution.status,evidenceGrade:'FORMAL_NONLINEAR_AXIS_COEFFICIENTS',parameters:{...o,eta,Ymax},solution,values,comparison:comparisonSeries(4.1),pressureAudit:outer.pressureAudit(),certifiedNonlinearRadius:null,certifiedNonlinearTail:null,blockers:solution.blockers,visualization:{points:values.map(p=>({pos:[p.X,p.Phi,p.U],label:`X=${p.X.toPrecision(4)}`,value:p.E})),arrows:[],lines:[{points:values.map(p=>[p.X,p.Phi,p.U])}],axes:['X','Phi','U'],description:'실제 비선형 계수 재귀의 유한 합. f0는 별도 scalar comparison입니다.',coordinateMeaning:'Coefficient-profile space (X,Phi,U), not physical Cartesian coordinates.',lostInformation:['Nonlinear series convergence radius, complex eta domain and tail remain uncertified.']}};}
function viscosityEnergyCheck(budget){const val=(nu,R)=>{const p=integrate(x=>Math.exp(-2*x*x/nu),-R,R,1e-11,budget);return nu*p.value**3;},base=val(1,6),cases=[.1,1,3].map(nu=>{const observed=val(nu,6*Math.sqrt(nu)),expected=nu**2.5*base,err=Math.abs(observed-expected)/(1+Math.abs(expected));return {nu,observed,expected,normalizedError:err,pass:err<1e-10};});return {name:'viscosity_energy_measure_scaling',pass:cases.every(x=>x.pass),cases,field:'u1(x)=exp(-|x|^2)e1, uNu=sqrt(nu)u1(x/sqrt(nu))',domain:'Finite boxes [-6sqrt(nu),6sqrt(nu)]^3; analytic change-of-variable scales the identical domain',independentPaths:['physical-coordinate quadrature at each viscosity','nu^(5/2) times unit-viscosity energy'],tolerance:1e-10};}
function highPrecisionChecks(){const checks=[];for(const f of fixtures.coordinates){const input=Object.fromEntries(Object.entries(f.input).map(([k,v])=>[k,Number(v)])),p=fromSimilarity(input,input),q=toSimilarity(f.position.map(Number),input),err=Math.max(...p.position.map((v,i)=>Math.abs(v-Number(f.position[i]))/(1+Math.abs(v))),Math.abs(q.q-Number(f.q))/(1+Number(f.q)),Math.abs(q.eta-input.eta),Math.abs(q.X-input.X));checks.push({name:`coordinate_330bit_nu_${input.viscosity}_eta_${input.eta}`,pass:err<1e-13,error:err,tolerance:1e-13});}for(const f of fixtures.heat){const v=heatFast(Number(f.Z),Number(f.h));const err=Math.max(...[v.H,v.dH,v.ddH].map((x,i)=>Math.abs(x-Number(f.derivatives[i]))));checks.push({name:`heat_direct_v_integral_330bit_Z_${f.Z}`,pass:err<1e-10,error:err,tolerance:1e-10});}for(const f of fixtures.exterior){const v=exteriorJet(Number(f.r),{tau:Number(f.tau),viscosity:Number(f.viscosity)}),err=Math.max(...['K','dr','drr','dt'].map(k=>Math.abs(v[k]-Number(f[k]))/(1+Math.abs(Number(f[k])))));checks.push({name:`exterior_derivatives_330bit_nu_${f.viscosity}`,pass:err<1e-10,error:err,tolerance:1e-10,mpmathCylindricalResidual:f.cylindricalResidual});}const c=comparisonSeries(4.1),target=Number(fixtures.comparison.f0);checks.push({name:'entire_comparison_f0_4p1',pass:c.value?.lower!==undefined?target>=c.value.lower&&target<=c.value.upper:Math.abs((c.midpoint??c.value)-target)<1e-12,reference:fixtures.comparison.f0,observed:c});return checks;}
function runValidation(input={},budget=makeBudget(commonBudget)){const checks=[...coordinateChecks(input),...exactPDEChecks(input,budget),...spectralConvolutionCheck(input,budget).checks,...coreReconstructionChecks(input,budget),...highPrecisionChecks(),viscosityEnergyCheck(budget)];const moment=solveFiveMomentRepair({},budget),badMoment=solveFiveMomentRepair({omitQuadratic:true},budget);checks.push({name:'five_moment_independent_reintegration',pass:moment.status==='NUMERICAL_MOMENT_MATCH',residual:moment.normalizedResidual,tolerance:1e-8},{name:'negative_omitted_quadratic_moments',pass:badMoment.status==='REJECTED_MOMENT_MATCH',negativeControl:true,residual:badMoment.normalizedResidual});for(const [name,fn,code] of [['negative_overlap_support',()=>solveFiveMomentRepair({overlap:true},budget),'INVALID_SUPPORT'],['negative_exterior_axis',()=>exteriorPoint([0,0,1],{},budget),'EXCLUDED_DOMAIN'],['negative_viscosity',()=>parameters({viscosity:0}),'INVALID_INPUT'],['negative_precision_claim',()=>validatePrecision({bits:100}),'PRECISION_REQUIRED']]){try{fn();checks.push({name,pass:false,negativeControl:true});}catch(e){checks.push({name,pass:e.code===code,negativeControl:true,observedStatus:e.code});}}checks.push({name:'whole_parameter_box_cone_certificate',pass:certifiedConeBox().pass,certificate:certifiedConeBox()});checks.push({name:'negative_zero_stress_division',pass:coneMargins({a:3,bs:0,ps:[3,0]}).pass===false,negativeControl:true},{name:'negative_invalid_cone',pass:coneMargins({a:1,bs:0,ps:[.5,0]}).pass===false,negativeControl:true});return {status:checks.every(x=>x.pass)?'VALIDATION_PASSED':'VALIDATION_FAILED',evidenceGrade:'FINITE_NUMERICAL_FIXTURE',checks,passed:checks.filter(x=>x.pass).length,total:checks.length,scope:'Finite independent consistency checks; not a complete profile or source-theorem certificate.',fullCertifiedProfile:false};}
function engineStatus(domain){
  if(['COMPLETED','PARTIAL','FAILED','CANCELLED','PRECISION_REQUIRED','UNSUPPORTED','BUDGET_EXCEEDED'].includes(domain))return domain;
  if(domain==='RESOURCE_LIMIT')return 'BUDGET_EXCEEDED';
  if(['FORMAL_NONLINEAR_AXIS_COEFFICIENTS','NUMERICAL_MOMENT_MATCH','FINITE_CONE_OPERATOR_CHECK','PARTIAL_CANDIDATE_WITH_BLOCKERS'].includes(domain))return 'PARTIAL';
  if(['PROVENANCE_LOCKED','FINITE_COORDINATE_EVALUATION','VERIFIED_NUMERICAL_ENCLOSURE','SOURCE_FORMULA_NUMERICAL_EVALUATION','EXACT_BENCHMARK_FLOAT_EVALUATION','VALIDATION_PASSED','VERIFIED_LOCAL_BOUND_CERTIFICATE','VERIFIED_ANALYTIC_PRESSURE_BOUND_CERTIFICATE'].includes(domain))return 'COMPLETED';
  return 'FAILED';
}
async function runJob(request,hooks={}){
  const started=Date.now(),valid=validateRequest(request);
  if(!valid.valid)return jsonSafe({...valid,domainStatus:valid.status,status:engineStatus(valid.status),kind:request?.kind,executionMetrics:{elapsedMilliseconds:Date.now()-started}});
  const {kind,input,precision}=valid,budget=makeBudget(valid.budget,hooks);
  try{
    budget.tick();let result;
    if(Followup.FOLLOWUP_KINDS.includes(kind))result=await Followup.runFollowupJob(kind,input,budget);
    else switch(kind){
      case 'ns.provenance':
        result={status:'PROVENANCE_LOCKED',evidenceGrade:'THEOREM_REFERENCE',...provenance,leanEvidence,highPrecisionFixtureContract:{precisionDigits:fixtures.precisionDigits,method:fixtures.method},fullSourceProofLocallyVerified:false};break;
      case 'ns.coordinates':
        result={status:'FINITE_COORDINATE_EVALUATION',evidenceGrade:'FINITE_NUMERICAL_FIXTURE',...coordinateFieldSample(input,budget),checks:coordinateChecks(input)};break;
      case 'ns.heat':
        result=heatIntegralCertificate({...input,tolerance:precision.absoluteTolerance},budget);
        result.evidenceGrade=result.status==='VERIFIED_NUMERICAL_ENCLOSURE'?'VERIFIED_NUMERICAL_ENCLOSURE':'UNCERTIFIED_ERROR_TARGET';
        result.finiteTaylor=heatTaylorFinite(input.Z??1,input.h??.005,input.taylorOrder??8);break;
      case 'ns.exterior':result=exteriorJob(input,budget);break;
      case 'ns.benchmark':result=benchmarkJob(input,budget);break;
      case 'ns.axis-series':result=axisJob(input,budget);break;
      case 'ns.moments':result={...solveFiveMomentRepair(input,budget),evidenceGrade:'FINITE_NUMERICAL_FIXTURE'};break;
      case 'ns.cone':
        result={status:'FINITE_CONE_OPERATOR_CHECK',evidenceGrade:'FINITE_NUMERICAL_FIXTURE',margin:coneMargins({a:input.a??3,bs:input.bs??0,ps:input.ps??[5,0]}),modulation:coneModulationFixture(input),wholeParameterBox:certifiedConeBox(input),blockers:[{id:'C1_ADMISSIBLE_LOOP',criterion:'N3-06',reason:'This older finite modulation fixture does not instantiate C.1. The separate ns.admissible-loop job computes source loops for supplied states; a uniform input profile remains required.'}],fullConeRealization:false};
        if(!result.margin.pass)result.status='REJECTED_CONE_INPUT';
        else if(!result.wholeParameterBox.pass)result.status='REJECTED_CONE_BOX';break;
      case 'ns.leading-profile':result=constructLeadingCandidate(input,budget);break;
      case 'ns.validate':result=runValidation(input,budget);break;
    }
    budget.tick();
    const domainStatus=result.domainStatus??result.status,clean=stripped(result);
    const parameterHash=await sha256(canonical({version:VERSION,kind,input,precision,source:provenance.lock.attachment.sha256,commit:provenance.lock.repository.commit}));
    return jsonSafe({...clean,domainStatus,status:engineStatus(result.status),kind,moduleVersion:VERSION,precision,parameterHash,
      sourceLedger:{attachmentSha256:provenance.lock.attachment.sha256,repositoryCommit:provenance.lock.repository.commit,theoremReference:'Theorem1.1; N3 Theorem4.6',fullOriginalKernelBuild:false},
      contract:{fullCertifiedProfile:false,fullNavierStokesSolution:false,solutionErrorBound:null,
        precisionOfCandidate:['ns.axis-certificate','ns.axis-source-certificate','ns.pressure-certificate'].includes(kind)?'Exact rational bounds and exact positive-exponential parameters; displayed enclosure centers use IEEE754 binary64. Generated analytic premises are not fully kernel-checked.':
          kind==='ns.source-outer'?'Signed-log quantities and IEEE754 binary64 quadrature/ODEs; small numerical residuals are not exact moment identities.':
          'IEEE754 binary64; only individually labelled intervals are numerical enclosures'},
      executionMetrics:{elapsedMilliseconds:Date.now()-started,operations:budget.snapshot().operations}});
  }catch(e){return jsonSafe({domainStatus:e.code??'COMPUTATION_ERROR',status:engineStatus(e.code??'COMPUTATION_ERROR'),kind,moduleVersion:VERSION,message:e.message,detail:e.detail??{},fullCertifiedProfile:false,executionMetrics:{elapsedMilliseconds:Date.now()-started,operations:budget.snapshot().operations}});}
}

return {VERSION,getCapabilities,getExamples,validateRequest,jsonSafe,highPrecisionChecks,runValidation,runJob};
})();
const __m1_36 = (()=>{
/** MathScope M0 / I0. JSON contracts describe scope; they never establish a theorem. */
const CONTRACT_VERSION = '1.0.0';
const VERSION = CONTRACT_VERSION;
const LEGACY_SESSION_SCHEMA = 'MathScopeResearchSession/0.3.1-foundation.1';
const EVIDENCE_GRADES = Object.freeze(['FORMAL PASS','THEOREM-BACKED','CERTIFIED NUMERICAL','NUMERICAL INDICATOR','EMPIRICAL CORRESPONDENCE','RESEARCH HYPOTHESIS','UNKNOWN','STALE']);
const EDGE_TYPES = Object.freeze(['LOCAL_TO_GLOBAL','BASE_CHANGE','PROJECTION','LIMIT','ASSUMES','COMPUTES','VERIFIED_BY','DEPENDS_ON','CITES']);
const s = (extra = {}) => ({ type:'string',minLength:1,...extra });
const integer = (minimum = 0,extra = {}) => ({type:'integer',minimum,...extra});
const decimalInteger = s({pattern:'^(0|[1-9][0-9]*|-[1-9][0-9]*)$'});
const positiveDecimal = s({pattern:'^(?:[1-9][0-9]*(?:\\.[0-9]+)?|0\\.[0-9]*[1-9][0-9]*)$'});
const hash = s({pattern:'^[a-f0-9]{64}$'});
const id = s({pattern:'^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,199}$'});
const list = (items, extra = {}) => ({type:'array',items,...extra});
const object = (properties,required = Object.keys(properties),extra = {}) => ({type:'object',properties,required,additionalProperties:false,...extra});
const jsonObject = {type:'object'};
const nullable = schema => ({anyOf:[schema,{type:'null'}]});
const ref = object({id,revision:s(),hash});
const refs = list(ref);
const sources = refs;
const scope = object({
  kind:{const:'FINITE'},
  primeInterval:object({lower:decimalInteger,upper:decimalInteger}),
  pAdic:object({p:decimalInteger,digits:integer(1)}),
  series:object({order:integer(0),timeMax:{anyOf:[{type:'number',exclusiveMinimum:0},positiveDecimal]}},['order']),
  spatial:object({bounds:list(list({type:'number'},{minItems:2,maxItems:2}),{minItems:1,maxItems:8}),timeMax:{type:'number',exclusiveMinimum:0}},['bounds']),
  finite:object({description:s(),itemCount:integer(0)}),
  description:s()
},['kind'],{anyOf:[{required:['primeInterval']},{required:['pAdic']},{required:['series']},{required:['spatial']},{required:['finite']}]});
const symbolicScope = object({kind:{const:'SYMBOLIC'},definition:s(),generator:s()},['kind','definition']);
const precision = object({
  kind:{enum:['EXACT','PADIC','REAL_INTERVAL','COMPLEX_INTERVAL','FLOAT64','STATISTICAL']},
  p:decimalInteger,digits:integer(1),absoluteBits:integer(1),workingBits:integer(1),guardDigits:integer(0),
  tolerance:{anyOf:[positiveDecimal,{type:'number',exclusiveMinimum:0}]},
  confidence:{type:'number',exclusiveMinimum:0,exclusiveMaximum:1},description:s(),norm:s(),propagation:jsonObject
},['kind']);
const evidence = object({
  grade:{enum:EVIDENCE_GRADES},
  scopeKind:{enum:['exact-finite','interval-certified','statistical','numerical','conditional-formal','theorem-reference','interface']},
  statement:s(),assumptionRefs:refs,sourceRefs:refs,certificateRef:ref,
  supportsCurrent:{type:'boolean'},effectiveTrust:s(),axioms:list(s()),method:s(),formalAudit:jsonObject
},['grade','scopeKind'],{additionalProperties:true});
const schema = (name,properties,required,extra={}) => ({
  $schema:'https://json-schema.org/draft/2020-12/schema',
  $id:`urn:mathscope:schema:${name}:1`,title:`MathScope ${name} v1`,
  ...object({schema:{const:`MathScope.${name}/1`},...properties},['schema',...(required||Object.keys(properties))],extra)
});
const domainBase = {id,revision:s(),sourceRefs:sources,assumptionRefs:refs};
const assumption = object({
  schema:{const:'MathScope.AssumptionSpec/1'},id,revision:s(),statement:s(),reason:s(),origin:{enum:['USER_AXIOM','HYPOTHESIS','EXTERNAL_THEOREM','DEFINITION']},
  status:{enum:['DECLARED','OPEN','THEOREM_REFERENCE','VERIFICATION_REQUIRED']},sourceRefs:sources,
  usedBy:list(id),scope:{anyOf:[scope,symbolicScope]},introducedBy:s()
},['id','revision','statement','reason','origin','status','sourceRefs','usedBy']);
const observation = schema('ObservationMapSpec',{
  ...domainBase,sourceObjectRef:ref,sourceType:s(),outputType:s(),method:{enum:['SLICE','SCALAR_MARGINAL','WILSON_LOOP','WILSON_LINE','CONDITIONAL_MEAN','BASIS_LAYOUT','SPECTRAL_OBSERVATION','USER_MAP']},
  definition:s(),sourceDimension:integer(0),displayDimension:{const:3},scope,
  axes:list(object({name:s(),sourceField:s(),kind:{enum:['PHYSICAL','COHOMOLOGICAL','CATEGORICAL','VALUATION','SPECTRAL']},unit:s(),scale:{enum:['LINEAR','LOG','SIGNED_LOG','CATEGORICAL']}}),{minItems:3,maxItems:3}),
  lostInformation:list(s()),injectivity:{enum:['NON_INJECTIVE','UNPROVED','CERTIFICATE_REQUIRED']},
  inverse:object({status:{enum:['UNAVAILABLE','CERTIFICATE_REQUIRED']},certificateRef:ref,domain:s()},['status']),
  gaugeConvention:nullable(s()),endpointData:nullable(jsonObject),parameters:jsonObject
});
const SCHEMAS = Object.freeze({
  PrecisionBudget:schema('PrecisionBudget',{...precision.properties},['kind']),
  FiniteScope:schema('FiniteScope',{...scope.properties},['kind'],{anyOf:scope.anyOf}),
  SourceManifest:schema('SourceManifest',{id,revision:s(),entries:list(object({
    id,kind:{enum:['CODE','PAPER','DATA','WEB','LEAN_SOURCE','LOCKFILE','BASELINE']},title:s(),uri:s(),sha256:nullable(hash),
    availability:{enum:['AVAILABLE','REFERENCED','MISSING']},locator:nullable(s()),version:nullable(s()),license:nullable(s())
  },['id','kind','title','uri','sha256','availability']),{minItems:1})}),
  AssumptionLedger:schema('AssumptionLedger',{id,revision:s(),assumptions:list(assumption)}),
  AssumptionSpec:schema('AssumptionSpec',{...assumption.properties},assumption.required),
  M1ObjectSpec:schema('M1ObjectSpec',{
    ...domainBase,domain:{enum:['ARITHMETIC','COHOMOLOGY','GAUGE','PDE','VERIFICATION']},
    objectType:{enum:['PrimeSetQuery','PadicObject','PointComparison','P1Comparison','LocalFactorFamily','GaugeGroup','Connection4D','StateFamily','Holonomy','SpectralModel','NavierStokesComponent','LeadingProfileCandidate','ValidationFixture']},
    description:s(),request:object({kind:s(),input:jsonObject,precision:jsonObject}),scope,precision,
    interpretation:object({finiteComputation:{const:true},externalComparison:{enum:['NOT_USED','THEOREM_REFERENCE','REQUIRED']},continuumClaim:{const:false},universalProof:{const:false}})
  }),
  PrismSpec:schema('PrismSpec',{
    ...domainBase,p:decimalInteger,
    ring:object({kind:{enum:['PADIC_INTEGER_RING','AFFINE_PRESENTATION','AINF','PERFECTOID_PRESENTATION']},presentation:s(),completion:s()}),
    ideal:object({generators:list(s(),{minItems:1}),presentation:s()}),
    delta:object({rule:s(),inputExtraDigits:integer(1),convention:s()}),
    frobenius:object({rule:s(),convention:s(),semilinear:{const:true},cutoffRule:s()}),
    geometricObject:object({kind:{enum:['POINT','PROJECTIVE_SPACE','SMOOTH_AFFINE','SMOOTH_PROPER','USER_PRESENTATION']},presentation:s(),dimension:integer(0)}),
    hypotheses:object({smooth:nullable({type:'boolean'}),proper:nullable({type:'boolean'}),details:list(s())}),
    comparison:object({status:{enum:['NONE','THEOREM_REFERENCE','CERTIFICATE_REQUIRED']},theorem:nullable(s()),sourceRefs:sources}),
    prismPredicate:object({status:{enum:['UNVERIFIED','THEOREM_REFERENCE','CERTIFICATE_REQUIRED']},statement:s(),sourceRefs:sources,certificateRef:ref},['status','statement','sourceRefs']),
    scope:{anyOf:[scope,symbolicScope]},semanticStatus:{enum:['INTERFACE','COMPARISON_MODEL']}
  }),
  PrimeQuerySpec:schema('PrimeQuerySpec',{
    ...domainBase,original:object({kind:{const:'PrimeSet'},definition:s()}),
    query:object({lower:decimalInteger,upper:decimalInteger,completeness:{const:'BOUNDED_ENUMERATION'}}),scope,
    output:{enum:['ENUMERATE','COUNT','COUNT_AND_ENUMERATE','GAPS']}
  }),
  GaugeGroupSpec:schema('GaugeGroupSpec',{
    ...domainBase,name:s(),compact:{const:true},simple:{const:true},
    lieAlgebra:object({family:{enum:['A','B','C','D','E','F','G']},rank:integer(1),dimension:integer(3),basis:s(),bracket:s()}),
    globalForm:object({form:{enum:['SIMPLY_CONNECTED','ADJOINT','QUOTIENT']},cover:s(),kernel:s(),description:s()}),
    representation:object({kind:{enum:['MATRIX','ADJOINT','ROOT_DATA']},name:s(),dimension:integer(1),faithful:{type:'boolean'},convention:s()}),
    invariantInnerProduct:object({normalization:s(),formula:s()})
  }),
  StateFamilySpec:schema('StateFamilySpec',{
    ...domainBase,gaugeGroupRef:ref,
    fieldConstruction:object({kind:{enum:['EMBEDDED_BPST','LIE_ALGEBRA_EXPANSION','LATTICE_WILSON','DECLARED_MODEL']},rule:s(),gaugeConvention:s(),parameters:jsonObject,
      embedding:object({domain:{const:'SU(2)'},codomainRef:ref,formula:s(),index:{type:'number',exclusiveMinimum:0},certificateStatus:{enum:['DECLARED','THEOREM_REFERENCE','CERTIFICATE_REQUIRED']},sourceRefs:sources})
    },['kind','rule','gaugeConvention','parameters']),
    delta:object({mode:{enum:['ASSUMED_BOUND','UNIT_RESCALE','EFFECTIVE_FAMILY','ENSEMBLE_ESTIMATE']},value:{type:'number',exclusiveMinimum:0},units:s(),role:s()}),
    coupling:object({g:{type:'number',exclusiveMinimum:0},normalization:s()}),
    lattice:nullable(object({a:{type:'number',exclusiveMinimum:0},L:list(integer(1),{minItems:4,maxItems:4}),boundary:s()})),
    seed:nullable(s()),channels:list(object({id,kind:s(),definition:s()}),{minItems:1}),scope,
    energyInterpretation:{enum:['DECLARED_BOUND','UNIT_CONVENTION','EFFECTIVE_MODEL','CHANNEL_ESTIMATE']}
  }),
  PDEConstructionSpec:schema('PDEConstructionSpec',{
    ...domainBase,modelId:s(),modelKind:{enum:['PAPER_CONSTRUCTION','ILLUSTRATIVE_MODEL','GENERAL_SOLVER']},
    equation:s(),paper:nullable(object({sourceRef:ref,theorem:s(),equationLocations:list(s(),{minItems:1})})),
    force:object({kind:{enum:['PAPER_FORCE','MANUFACTURED_FORCE','GIVEN_FORCE','ZERO_FORCE']},definition:s(),divergenceFree:{type:'boolean'}}),
    initialCondition:object({definition:s(),domain:s()}),normalization:jsonObject,
    similarityCoordinates:nullable(object({definition:s(),validDomain:s()})),
    profiles:object({generator:s(),status:{enum:['PAPER_DEFINITION','ILLUSTRATIVE','CERTIFICATE_REQUIRED','UNAVAILABLE']}}),
    pulses:object({generator:s(),cutoffRule:s()}),correction:object({order:integer(0),tailStatus:{enum:['UNPROVED','FINITE_BOUND','CERTIFICATE_REQUIRED']},tailDefinition:nullable(s())}),
    scope,parameters:jsonObject
  }),
  ObservationMapSpec:observation,
  ComputeJobSpec:schema('ComputeJobSpec',{
    id,modelRef:ref,adapter:object({id:s(),version:s()}),sourceRefs:sources,assumptionRefs:refs,scope,precision,
    seed:nullable(s()),domain:jsonObject,basis:jsonObject,
    budget:object({maxMillis:integer(1),maxBytes:integer(1),maxItems:integer(0),maxOperations:integer(1)},['maxMillis','maxBytes','maxItems']),input:jsonObject
  }),
  ResultEnvelope:schema('ResultEnvelope',{
    jobId:id,inputHash:hash,environmentHash:hash,status:{enum:['COMPLETED','PARTIAL','CANCELLED','FAILED','UNSUPPORTED','PRECISION_REQUIRED','BUDGET_EXCEEDED']},scope,precision,
    values:jsonObject,errorLedger:object({rounding:{},discretization:{},tail:{},residual:{},stability:{},statistical:{}},['rounding','discretization','tail','residual','stability','statistical']),
    provenance:object({modelRef:ref,sourceRefs:sources,assumptionRefs:refs,adapter:object({id:s(),version:s()}),seed:nullable(s()),domain:jsonObject,basis:jsonObject,environment:jsonObject},['modelRef','sourceRefs','assumptionRefs','adapter','seed','domain','basis','environment'],{additionalProperties:true}),
    evidence:{...evidence,required:['grade','scopeKind','sourceRefs','assumptionRefs']},contentHash:hash,cacheKey:hash,checkpointRef:nullable(s()),message:s(),details:jsonObject
  },['jobId','inputHash','environmentHash','status','scope','precision','values','errorLedger','provenance','evidence'],{additionalProperties:true}),
  ClaimSpec:schema('ClaimSpec',{
    ...domainBase,statement:s(),scope:{anyOf:[scope,symbolicScope]},
    propositionKind:{enum:['FINITE_RESULT','INFINITE_OBJECT','WEIL_RH_FINITE_FIELD','CLASSICAL_RH','BSD','GLOBAL_SPECTRUM','OBSERVED_SPECTRUM','GENERAL']},
    logicRole:{enum:['THEOREM_TARGET','CONJECTURE','CONDITIONAL','OBSERVATION','EXTERNAL_REFERENCE']},grade:{enum:EVIDENCE_GRADES}
  }),
  LegacyObservation:schema('LegacyObservation',{
    module:{enum:['primes','cohomology','yangmills','navier']},input:jsonObject,scope,legacyRefs:refs,snapshot:jsonObject,
    grade:{enum:['NUMERICAL INDICATOR','RESEARCH HYPOTHESIS']}
  }),
  ProofJob:{
    $schema:'https://json-schema.org/draft/2020-12/schema',$id:'urn:mathscope:schema:ProofJob:1',title:'MathScope proof job metadata v1',
    ...object({schemaVersion:{const:'mathscope.proof-job/1'},id,claimId:id,target:s(),requestedGrade:{enum:['EXACT_FINITE','CONDITIONAL_FORMAL']},
      sourceFiles:list(object({path:s(),content:s(),sha256:hash}),{minItems:1}),
      assumptions:list(object({id,kind:s(),statement:s()},['id','kind','statement'],{additionalProperties:true})),
      dependencyGraph:object({nodes:list(object({id,kind:s(),statement:s()},['id','kind'],{additionalProperties:true})),edges:list(object({from:id,to:id,type:{const:'DEPENDS_ON'}}))}),
      context:jsonObject,environment:jsonObject,digests:object({source:hash,assumptions:hash,dependency:hash,context:hash,environment:hash,binding:hash}),graphAudit:jsonObject,
      status:{const:'PREPARED_LOCAL_CHECK_REQUIRED'},capability:{const:'EXPORT_AND_PINNED_AUDIT_ONLY'}
    })
  }
});

/** Deliberately strict JSON normal form. No silent loss of BigInt/undefined/NaN. */
function canonicalStringify(value) {
  const active = new Set();
  function visit(v,path,allowApproximateNumber=false) {
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
    if (typeof v === 'number') {
      if (!Number.isFinite(v) || (!allowApproximateNumber&&Number.isInteger(v)&&!Number.isSafeInteger(v))) throw new TypeError(`${path}: finite, safely represented JSON number required; use a decimal string for exact integers`);
      return Object.is(v,-0)?0:v;
    }
    if (typeof v !== 'object') throw new TypeError(`${path}: unsupported JSON value (${typeof v})`);
    if (active.has(v)) throw new TypeError(`${path}: cyclic JSON`);
    if (!Array.isArray(v) && Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) throw new TypeError(`${path}: plain JSON object required`);
    active.add(v);
    let out;
    if (Array.isArray(v)) {
      out=[];
      for (let i=0;i<v.length;i++) {
        if (!Object.hasOwn(v,i)) throw new TypeError(`${path}: sparse JSON array`);
        out.push(visit(v[i],`${path}[${i}]`,allowApproximateNumber));
      }
    } else {
      out={};
      for (const key of Object.keys(v).sort()) {
        if (['__proto__','prototype','constructor'].includes(key)) throw new TypeError(`${path}: reserved object key ${key}`);
        const approximate=(v.kind==='FLOAT64'&&key==='value')||(v.kind==='STATISTICAL_ESTIMATE'&&['estimate','standardError','interval'].includes(key));
        out[key]=visit(v[key],`${path}.${key}`,approximate);
      }
    }
    active.delete(v);return out;
  }
  return JSON.stringify(visit(value,'$'));
}
async function sha256(value) {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 requires WebCrypto; no non-cryptographic fallback is allowed');
  const bytes=new TextEncoder().encode(typeof value==='string'?value:canonicalStringify(value));
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
const hashValue=sha256;
class ContractError extends Error { constructor(kind,errors) {super(`${kind}: ${errors.join('; ')}`);this.name='ContractError';this.kind=kind;this.errors=errors;} }

// Runtime validator implements the JSON-Schema keywords used by the exported schemas.
function checkSchema(spec,v,path,errors) {
  const fail=message=>errors.push(`${path}: ${message}`);
  if (spec.anyOf && !spec.anyOf.some(branch=>{const e=[];checkSchema(branch,v,path,e);return !e.length;})) fail('does not match any allowed variant');
  if (spec.oneOf && spec.oneOf.filter(branch=>{const e=[];checkSchema(branch,v,path,e);return !e.length;}).length!==1) fail('must match exactly one allowed variant');
  for (const branch of spec.allOf||[]) checkSchema(branch,v,path,errors);
  if (Object.hasOwn(spec,'const') && canonicalStringify(v)!==canonicalStringify(spec.const)) fail(`must equal ${JSON.stringify(spec.const)}`);
  if (spec.enum && !spec.enum.some(item=>canonicalStringify(item)===canonicalStringify(v))) fail('value is outside the allowed enum');
  if (spec.type) {
    const types=Array.isArray(spec.type)?spec.type:[spec.type];
    const matches=t=>t==='null'?v===null:t==='array'?Array.isArray(v):t==='integer'?Number.isSafeInteger(v):t==='object'?v!==null&&typeof v==='object'&&!Array.isArray(v):t==='number'?typeof v==='number'&&Number.isFinite(v):typeof v===t;
    if (!types.some(matches)) {fail(`expected ${types.join(' or ')}`);return;}
  }
  if (typeof v==='string') {
    if (spec.minLength!=null&&v.length<spec.minLength) fail(`length must be at least ${spec.minLength}`);
    if (spec.maxLength!=null&&v.length>spec.maxLength) fail(`length must be at most ${spec.maxLength}`);
    if (spec.pattern&&!new RegExp(spec.pattern).test(v)) fail(`does not match ${spec.pattern}`);
  }
  if (typeof v==='number') {
    if (spec.minimum!=null&&v<spec.minimum) fail(`must be >= ${spec.minimum}`);
    if (spec.maximum!=null&&v>spec.maximum) fail(`must be <= ${spec.maximum}`);
    if (spec.exclusiveMinimum!=null&&v<=spec.exclusiveMinimum) fail(`must be > ${spec.exclusiveMinimum}`);
    if (spec.exclusiveMaximum!=null&&v>=spec.exclusiveMaximum) fail(`must be < ${spec.exclusiveMaximum}`);
  }
  if (Array.isArray(v)) {
    if (spec.minItems!=null&&v.length<spec.minItems) fail(`requires at least ${spec.minItems} items`);
    if (spec.maxItems!=null&&v.length>spec.maxItems) fail(`allows at most ${spec.maxItems} items`);
    if (spec.items) v.forEach((item,i)=>checkSchema(spec.items,item,`${path}[${i}]`,errors));
    if (spec.uniqueItems&&new Set(v.map(canonicalStringify)).size!==v.length) fail('duplicate items');
  }
  if (v&&typeof v==='object'&&!Array.isArray(v)) {
    for (const key of spec.required||[]) if (!Object.hasOwn(v,key)) fail(`required property ${key} missing`);
    for (const [key,value] of Object.entries(v)) {
      if (spec.properties?.[key]) checkSchema(spec.properties[key],value,`${path}.${key}`,errors);
      else if (spec.additionalProperties===false) fail(`unknown property ${key}`);
      else if (typeof spec.additionalProperties==='object') checkSchema(spec.additionalProperties,value,`${path}.${key}`,errors);
    }
  }
}
function isCanonicalInteger(v) {return typeof v==='string'&&/^(0|[1-9][0-9]*|-[1-9][0-9]*)$/.test(v);}
function scopeSemantics(v,errors,path='$.scope') {
  if (!v||v.kind!=='FINITE') return;
  if (v.primeInterval&&isCanonicalInteger(v.primeInterval.lower)&&isCanonicalInteger(v.primeInterval.upper)) {
    if (BigInt(v.primeInterval.lower)>BigInt(v.primeInterval.upper)) errors.push(`${path}: lower prime bound exceeds upper`);
    if (BigInt(v.primeInterval.lower)<0n) errors.push(`${path}: prime interval begins below zero`);
  }
  if (v.pAdic&&isCanonicalInteger(v.pAdic.p)&&BigInt(v.pAdic.p)<2n) errors.push(`${path}: p must be >= 2`);
  for (const bound of v.spatial?.bounds||[]) if (bound[0]>bound[1]) errors.push(`${path}: spatial lower bound exceeds upper`);
}
function precisionSemantics(v,errors) {
  if (!v) return;
  if (v.kind==='PADIC'&&!Number.isSafeInteger(v.digits)) errors.push('$.precision: PADIC requires digits');
  if (['REAL_INTERVAL','COMPLEX_INTERVAL'].includes(v.kind)&&!Number.isSafeInteger(v.absoluteBits)&&!Number.isSafeInteger(v.workingBits)) errors.push('$.precision: interval arithmetic requires absoluteBits or workingBits');
  if (v.kind==='STATISTICAL'&&typeof v.confidence!=='number') errors.push('$.precision: statistical confidence required');
}
function dimensionOfLieAlgebra(f,r) {return f==='A'?r*(r+2):['B','C'].includes(f)?r*(2*r+1):f==='D'?r*(2*r-1):f==='G'&&r===2?14:f==='F'&&r===4?52:f==='E'?({6:78,7:133,8:248}[r]??null):null;}
function validate(kind,value) {
  const errors=[],warnings=[];
  try {canonicalStringify(value);} catch(error) {return {ok:false,errors:[error.message],warnings};}
  const spec=SCHEMAS[kind];
  if (!spec) return {ok:false,errors:[`Unknown contract ${kind}`],warnings};
  checkSchema(spec,value,'$',errors);
  if (errors.length) return {ok:false,errors,warnings};
  if (value.scope) scopeSemantics(value.scope,errors);
  if (kind==='FiniteScope') scopeSemantics(value,errors,'$');
  if (value.precision) precisionSemantics(value.precision,errors);
  if (kind==='PrecisionBudget') precisionSemantics(value,errors);
  if (kind==='M1ObjectSpec') {
    const kinds={'arithmetic.primes':'PrimeSetQuery','arithmetic.primeCertificate':'PrimeSetQuery','arithmetic.padic':'PadicObject','arithmetic.point':'PointComparison','arithmetic.p1':'P1Comparison','arithmetic.localFactors':'LocalFactorFamily','arithmetic.verify':'ValidationFixture','gauge.group':'GaugeGroup','gauge.field':'Connection4D','gauge.family':'StateFamily','gauge.holonomy':'Holonomy','gauge.spectral':'SpectralModel','ns.provenance':'NavierStokesComponent','ns.coordinates':'NavierStokesComponent','ns.heat':'NavierStokesComponent','ns.exterior':'NavierStokesComponent','ns.axis-series':'NavierStokesComponent','ns.moments':'NavierStokesComponent','ns.cone':'NavierStokesComponent','ns.benchmark':'NavierStokesComponent','ns.leading-profile':'LeadingProfileCandidate','ns.validate':'ValidationFixture','ns.axis-certificate':'NavierStokesComponent','ns.source-outer':'NavierStokesComponent','ns.controlled-continuation':'NavierStokesComponent','ns.admissible-loop':'NavierStokesComponent','ns.pressure-certificate':'NavierStokesComponent','ns.axis-source-certificate':'NavierStokesComponent','ns.radial-modulation':'NavierStokesComponent','ns.source-inner-gluing':'NavierStokesComponent'};
    if(kinds[value.request.kind]!==value.objectType)errors.push('M1 object type does not match its installed domain operation');
    const expected=value.request.kind.startsWith('gauge.')?'GAUGE':value.request.kind.startsWith('ns.')?'PDE':['PointComparison','P1Comparison'].includes(value.objectType)?'COHOMOLOGY':value.objectType==='ValidationFixture'?'VERIFICATION':'ARITHMETIC';
    if(value.domain!==expected)errors.push('M1 domain does not match its mathematical object');
    warnings.push('The immutable request identifies the mathematical input. The installed domain validator must accept it before execution; serialized metadata never establishes a theorem.');
  }
  if (kind==='PrimeQuerySpec') {
    const interval=value.scope.primeInterval;
    if (!interval||interval.lower!==value.query.lower||interval.upper!==value.query.upper) errors.push('Prime query bounds must equal the finite scope bounds');
  }
  if (kind==='PrismSpec') {
    const p=BigInt(value.p);
    if (p<2n) errors.push('Prism p must be at least 2');
    if (p<=1000000n) {for (let d=2n;d*d<=p;d++) if (p%d===0n) {errors.push('Prism p is composite');break;}}
    else warnings.push('Large p is declared; a backend primality certificate is required before computation');
    if (value.semanticStatus==='COMPARISON_MODEL'&&(value.comparison.status==='NONE'||value.comparison.sourceRefs.length===0||value.prismPredicate.status==='UNVERIFIED')) errors.push('Comparison model requires a cited comparison and explicit prism-predicate provenance');
    if (value.prismPredicate.status!=='UNVERIFIED'&&value.prismPredicate.sourceRefs.length===0) errors.push('Prism predicate provenance is missing');
    warnings.push('Contract validity does not verify a prism predicate or compute a prismatic complex');
  }
  if (kind==='GaugeGroupSpec') {
    const a=value.lieAlgebra,dim=dimensionOfLieAlgebra(a.family,a.rank);
    if (dim===null||dim!==a.dimension) errors.push('Lie algebra family, rank and dimension are inconsistent');
    if (a.family==='D'&&a.rank<3) errors.push('D rank below 3 is not a simple compact Lie algebra');
    warnings.push('Lie bracket, representation and compact/simple realization remain mathematical proof obligations');
  }
  if (kind==='StateFamilySpec') {
    if (value.fieldConstruction.kind==='EMBEDDED_BPST'&&!value.fieldConstruction.embedding) errors.push('An explicit SU(2) embedding into the declared global G is required');
    if (value.fieldConstruction.embedding&&canonicalStringify(value.fieldConstruction.embedding.codomainRef)!==canonicalStringify(value.gaugeGroupRef)) errors.push('Embedding codomain must be exactly the declared gauge group revision');
    if (value.fieldConstruction.kind==='LATTICE_WILSON'&&(!value.lattice||value.seed===null)) errors.push('Wilson lattice field requires a lattice and seed');
    const meanings={ASSUMED_BOUND:'DECLARED_BOUND',UNIT_RESCALE:'UNIT_CONVENTION',EFFECTIVE_FAMILY:'EFFECTIVE_MODEL',ENSEMBLE_ESTIMATE:'CHANNEL_ESTIMATE'};
    if (meanings[value.delta.mode]!==value.energyInterpretation) errors.push('Delta mode and energy interpretation disagree');
    if (value.delta.mode==='ASSUMED_BOUND'&&value.assumptionRefs.length===0) errors.push('Assumed delta bound must reference an explicit USER_AXIOM/hypothesis record');
  }
  if (kind==='PDEConstructionSpec') {
    if (!value.modelId.startsWith(value.modelKind.toLowerCase()+':')) errors.push('modelId must be namespaced by the modelKind');
    if (value.modelKind==='PAPER_CONSTRUCTION'&&(!value.paper||value.force.kind!=='PAPER_FORCE'||value.profiles.status==='ILLUSTRATIVE')) errors.push('Paper reconstruction requires paper locations, paper force, and actual-paper profile definition');
    if (value.force.kind==='MANUFACTURED_FORCE'&&value.modelKind==='PAPER_CONSTRUCTION') errors.push('Manufactured force cannot be recorded as the paper construction');
    if (value.scope.kind!=='FINITE'||(!value.scope.spatial?.timeMax&&!value.scope.series?.timeMax)) errors.push('PDE computation requires a finite positive time upper bound');
  }
  if (kind==='AssumptionLedger') {
    if (new Set(value.assumptions.map(a=>a.id)).size!==value.assumptions.length) errors.push('Duplicate assumption IDs');
    value.assumptions.forEach(a=>assumptionSemantics(a,errors));
  }
  if (kind==='AssumptionSpec') assumptionSemantics(value,errors);
  if (kind==='SourceManifest') {
    if (new Set(value.entries.map(a=>a.id)).size!==value.entries.length) errors.push('Duplicate source IDs');
    for (const entry of value.entries) if (entry.availability==='AVAILABLE'&&!entry.sha256) errors.push(`Available source ${entry.id} needs a content SHA-256`);
  }
  if (kind==='ObservationMapSpec') {
    if (value.method==='SCALAR_MARGINAL'&&/connection|gaugefield|gauge-field/i.test(value.outputType)) errors.push('A scalar marginal cannot return a gauge connection');
    if (value.method==='WILSON_LINE'&&(!value.gaugeConvention||!value.endpointData)) errors.push('Open Wilson line requires endpoint and gauge convention metadata');
    if (value.sourceDimension>value.displayDimension&&value.lostInformation.length===0) errors.push('Dimension reduction must describe discarded information');
  }
  if (kind==='ComputeJobSpec'&&value.sourceRefs.length===0) warnings.push('No source files pinned; executable adapter versions must be pinned in result provenance');
  if (kind==='ResultEnvelope') {
    if(canonicalStringify(value.evidence.assumptionRefs)!==canonicalStringify(value.provenance.assumptionRefs)||canonicalStringify(value.evidence.sourceRefs)!==canonicalStringify(value.provenance.sourceRefs)) errors.push('Evidence and result provenance must retain identical source and assumption references');
    if (['FORMAL PASS','THEOREM-BACKED'].includes(value.evidence.grade)) errors.push('Generic computation cannot issue FORMAL PASS or THEOREM-BACKED; use an audited proof receipt');
    if (['conditional-formal','theorem-reference'].includes(value.evidence.scopeKind)) errors.push('Computation result is not a proof/audited theorem mapping');
    if (value.evidence.scopeKind==='statistical'&&value.evidence.grade==='CERTIFIED NUMERICAL') errors.push('A statistical confidence interval is not a rigorous interval certificate');
    if (value.status!=='COMPLETED'&&value.evidence.supportsCurrent===true) errors.push('Incomplete result cannot claim current completed support');
    if (value.evidence.scopeKind==='exact-finite'&&value.precision.kind!=='EXACT') errors.push('Exact-finite result requires exact arithmetic precision');
    if (value.evidence.scopeKind==='interval-certified'&&!['REAL_INTERVAL','COMPLEX_INTERVAL','PADIC'].includes(value.precision.kind)) errors.push('Certified interval scope requires a typed interval/valuation precision');
  }
  if (kind==='ClaimSpec'&&['FORMAL PASS','THEOREM-BACKED'].includes(value.grade)) errors.push('A target declaration cannot issue FORMAL PASS or THEOREM-BACKED; use an audited receipt');
  return {ok:errors.length===0,errors,warnings};
}
function assumptionSemantics(a,errors) {
  if (a.origin==='USER_AXIOM'&&a.status==='THEOREM_REFERENCE') errors.push(`User axiom ${a.id} cannot be relabeled as an external theorem`);
  if (a.origin==='EXTERNAL_THEOREM'&&a.sourceRefs.length===0) errors.push(`External theorem ${a.id} requires a source`);
}
function containsUserAxiom(payload) {return payload?.origin==='USER_AXIOM'||(payload?.schema==='MathScope.AssumptionLedger/1'&&payload.assumptions.some(a=>a.origin==='USER_AXIOM'));}
function assertValid(kind,value) {const report=validate(kind,value);if(!report.ok)throw new ContractError(kind,report.errors);return value;}
const validateComputeJobSpec=value=>validate('ComputeJobSpec',value);
const validateResultEnvelope=value=>validate('ResultEnvelope',value);
const validatePrismSpec=value=>validate('PrismSpec',value);
function effectiveEvidenceTrust(record,{receipt,isVerifiedProofReceipt}={}) {
  // Display the audited receipt itself.  A second metadata record cannot borrow
  // its authority merely by sharing a claim ID or copying a digest field.
  const directReceipt=record&&(!receipt||record===receipt)?record:null;
  if (directReceipt&&typeof isVerifiedProofReceipt==='function'&&isVerifiedProofReceipt(directReceipt)) return {status:'LOCAL_AUDIT_VERIFIED',grade:directReceipt.grade,conditional:directReceipt.grade==='CONDITIONAL_FORMAL'||directReceipt.axioms?.custom?.length>0,scope:directReceipt.scope,claimId:directReceipt.claimId};
  return {status:'REVALIDATION_REQUIRED',grade:record?.grade||'UNKNOWN',conditional:record?.scopeKind==='conditional-formal',scope:record?.scopeKind||'historical-metadata'};
}
/** Semantic restrictions on an edge are independent of diagram placement. */
function validateProofEdge(edge,nodes,{isVerifiedCertificate}={}) {
  const errors=[],warnings=[];
  const map=nodes instanceof Map?nodes:new Map((Array.isArray(nodes)?nodes:Object.values(nodes||{})).map(n=>[n.id,n]));
  if (!edge||!EDGE_TYPES.includes(edge.type)) return {ok:false,errors:['Unsupported dependency edge type'],warnings};
  const from=map.get(edge.from),to=map.get(edge.to);
  if (!from||!to) return {ok:false,errors:['Dependency endpoints must exist'],warnings};
  if (edge.from===edge.to) errors.push('Self-dependency is circular');
  const a=from.payload||from,b=to.payload||to;
  const proofEdge=['LOCAL_TO_GLOBAL','BASE_CHANGE','PROJECTION','LIMIT','VERIFIED_BY'].includes(edge.type);
  if (a.propositionKind==='WEIL_RH_FINITE_FIELD'&&b.propositionKind==='CLASSICAL_RH'&&proofEdge) errors.push('Finite-field Weil RH is not a classical RH proof bridge');
  if (a.propositionKind==='OBSERVED_SPECTRUM'&&b.propositionKind==='GLOBAL_SPECTRUM'&&proofEdge&&!edge.semanticBridge?.spectralInclusion) errors.push('Observed channel requires an explicit original-to-observed spectral inclusion theorem');
  if (a.scope?.kind==='FINITE'&&b.scope?.kind==='SYMBOLIC'&&proofEdge&&!edge.semanticBridge?.limitStatement) errors.push('Finite-to-infinite inference requires a quantified limit/coverage theorem');
  if (proofEdge) {
    if (!edge.certificate||typeof isVerifiedCertificate!=='function'||!isVerifiedCertificate(edge.certificate)) errors.push('Proof edge requires a live audited certificate; imported metadata is not proof');
    if (edge.certificate&&edge.certificate.claimId!==edge.to) errors.push('Certificate target does not match the dependency target');
    const binding=edge.certificate?.context?.graphBinding;
    const refMatches=(r,n)=>r&&r.id===n.id&&r.revision===n.revision&&r.hash===n.hash&&typeof n.hash==='string';
    if(!binding||!refMatches(binding.from,from)||!refMatches(binding.to,to)) errors.push('Proof receipt must bind both exact graph endpoint revisions and payload hashes; a theorem with the same label is insufficient');
  }
  if (containsUserAxiom(a)&&edge.type!=='ASSUMES'&&edge.type!=='CITES') errors.push('USER_AXIOM dependencies must remain explicit ASSUMES edges');
  if (containsUserAxiom(a)&&edge.type==='ASSUMES'&&b.logicRole==='THEOREM_TARGET') errors.push('Unconditional theorem target cannot assume a USER_AXIOM');
  if (['DEPENDS_ON','COMPUTES','CITES'].includes(edge.type)) warnings.push('Dependency/citation edge is provenance, not logical entailment');
  return {ok:errors.length===0,errors,warnings};
}

/** Complete, deliberately finite/unverified starting contracts for the IDE. */
async function getContractExamples() {
  const source={schema:'MathScope.SourceManifest/1',id:'m0-source-baseline',revision:'m0-source-baseline:r1',entries:[{
    id:'v031-page41',kind:'BASELINE',title:'MathScope v0.3.1 page 41 snapshot',uri:'https://project29770.websitepublisher.ai/v0.3.1.html',
    sha256:'5cf7e919b8a221873c8a65523ad1e74d60ec551dc4e3c6e0b09b782c42238755',availability:'AVAILABLE',locator:'version 41 / d400a17e',version:'41',license:null
  }]};
  const sourceRef={id:source.id,revision:source.revision,hash:await sha256(source)};
  const base=(id)=>({id,revision:`${id}:r1`,sourceRefs:[sourceRef],assumptionRefs:[]});
  const a={schema:'MathScope.AssumptionSpec/1',id:'m0-assume-gap',revision:'m0-assume-gap:r1',statement:'In the selected spectral model and fixed energy units, every positive spectral energy is at least delta > 0.',reason:'Explore a conditional corollary with the selected gap bound explicitly assumed.',origin:'USER_AXIOM',status:'DECLARED',sourceRefs:[],usedBy:[],scope:{kind:'SYMBOLIC',definition:'Conditional spectral model'},introducedBy:'MathScope user assumption mode'};
  const aRef={id:a.id,revision:a.revision,hash:await sha256(a)};
  const prime={schema:'MathScope.PrimeQuerySpec/1',...base('m0-primes'),original:{kind:'PrimeSet',definition:'The natural numbers p ≥ 2 whose only positive divisors are 1 and p.'},query:{lower:'2',upper:'200',completeness:'BOUNDED_ENUMERATION'},scope:{kind:'FINITE',primeInterval:{lower:'2',upper:'200'}},output:'COUNT_AND_ENUMERATE'};
  const prism={schema:'MathScope.PrismSpec/1',...base('m0-prism-p1'),p:'5',ring:{kind:'PADIC_INTEGER_RING',presentation:'Z_5 as the inverse limit of Z/5^N Z',completion:'5-adic completion'},ideal:{generators:['5'],presentation:'I=(5) in Z_5'},delta:{rule:'delta(a)=(a-a^5)/5 on Z_5',inputExtraDigits:1,convention:'Frobenius lift phi=id on Z_5'},frobenius:{rule:'phi(a)=a; geometric lift t -> t^5 on each compatible chart',convention:'Absolute crystalline Frobenius, basis conventions required',semilinear:true,cutoffRule:'A chart cutoff D maps into cutoff 5D; never silently crop'},geometricObject:{kind:'PROJECTIVE_SPACE',presentation:'P^1 over F_5, with charts t and s=t^-1',dimension:1},hypotheses:{smooth:true,proper:true,details:['These geometric hypotheses are declared in this initial interface.']},comparison:{status:'NONE',theorem:null,sourceRefs:[]},prismPredicate:{status:'UNVERIFIED',statement:'(Z_5,(5)) is the specified crystalline prism; attach comparison and formal provenance before upgrading the interface.',sourceRefs:[]},scope:{kind:'FINITE',pAdic:{p:'5',digits:4},series:{order:1}},semanticStatus:'INTERFACE'};
  const group={schema:'MathScope.GaugeGroupSpec/1',...base('m0-gauge-su2'),name:'SU(2)',compact:true,simple:true,lieAlgebra:{family:'A',rank:1,dimension:3,basis:'T_a=-i sigma_a/2',bracket:'[T_a,T_b]=epsilon_{abc} T_c'},globalForm:{form:'SIMPLY_CONNECTED',cover:'SU(2)',kernel:'{1}',description:'Simply connected compact form, distinguished from SO(3).'},representation:{kind:'MATRIX',name:'Defining complex representation',dimension:2,faithful:true,convention:'Anti-Hermitian traceless 2 by 2 matrices'},invariantInnerProduct:{normalization:'<T_a,T_b>=delta_ab',formula:'<X,Y>=-2 Tr(XY)'}};
  const groupRef={id:group.id,revision:group.revision,hash:await sha256(group)};
  const family={schema:'MathScope.StateFamilySpec/1',...base('m0-state-family'),gaugeGroupRef:groupRef,fieldConstruction:{kind:'EMBEDDED_BPST',rule:'Use the declared identity embedding of the classical SU(2) BPST field with rho=kappa/delta; no quantum gap identification.',gaugeConvention:'regular gauge',parameters:{kappa:1,center:[0,0,0,0]},embedding:{domain:'SU(2)',codomainRef:groupRef,formula:'identity on SU(2)',index:1,certificateStatus:'DECLARED',sourceRefs:[]}},delta:{mode:'EFFECTIVE_FAMILY',value:1,units:'chosen units with hbar*c=1',role:'An explicit model size parameter via rho=kappa/delta.'},coupling:{g:1,normalization:'S_E/hbar with the recorded invariant inner product'},lattice:null,seed:null,channels:[{id:'q4-density',kind:'SCALAR_DENSITY',definition:'Normalized classical BPST scalar density'}],scope:{kind:'FINITE',spatial:{bounds:[[-4,4],[-4,4],[-4,4],[-4,4]]}},energyInterpretation:'EFFECTIVE_MODEL'};
  const familyRef={id:family.id,revision:family.revision,hash:await sha256(family)};
  const obs={schema:'MathScope.ObservationMapSpec/1',...base('m0-density-observation'),sourceObjectRef:familyRef,sourceType:'4D classical scalar density',outputType:'3D scalar density samples',method:'SLICE',definition:'q_slice(y)=q4(y,c), c=0; x4 is a Euclidean coordinate.',sourceDimension:4,displayDimension:3,scope:{kind:'FINITE',spatial:{bounds:[[-4,4],[-4,4],[-4,4]]}},axes:[1,2,3].map(i=>({name:`x${i}`,sourceField:`x${i}`,kind:'PHYSICAL',unit:'chosen length unit',scale:'LINEAR'})),lostInformation:['Values away from the selected x4=0 slice','Gauge connection and quantum spectrum are not reconstructed from scalar density'],injectivity:'NON_INJECTIVE',inverse:{status:'UNAVAILABLE'},gaugeConvention:null,endpointData:null,parameters:{slice:0}};
  const pde={schema:'MathScope.PDEConstructionSpec/1',...base('m0-pde-solver'),modelId:'general_solver:periodic-taylor-green',modelKind:'GENERAL_SOLVER',equation:'du/dt + (u·grad)u = -grad p + nu Laplacian u + f; div u=0',paper:null,force:{kind:'ZERO_FORCE',definition:'f=0 for this independent benchmark',divergenceFree:true},initialCondition:{definition:'u0=(sin x cos y,-cos x sin y,0)',domain:'(R/2pi Z)^3'},normalization:{nu:1,period:6.283185307179586},similarityCoordinates:null,profiles:{generator:'Taylor–Green initial data; no paper reconstruction profile',status:'ILLUSTRATIVE'},pulses:{generator:'No pulses in this benchmark',cutoffRule:'Finite Fourier mode cutoff recorded by the solver'},correction:{order:0,tailStatus:'UNPROVED',tailDefinition:null},scope:{kind:'FINITE',spatial:{bounds:[[0,6.283185307179586],[0,6.283185307179586],[0,6.283185307179586]],timeMax:0.9},series:{order:8,timeMax:0.9}},parameters:{modeCutoff:8}};
  const claim={schema:'MathScope.ClaimSpec/1',...base('m0-gap-claim'),assumptionRefs:[aRef],statement:'Under the selected positive gap assumption, no spectral energy lies strictly between zero and delta.',scope:{kind:'SYMBOLIC',definition:'Selected spectral interface with explicit USER_AXIOM dependency'},propositionKind:'GENERAL',logicRole:'CONDITIONAL',grade:'RESEARCH HYPOTHESIS'};
  const all={SourceManifest:source,AssumptionSpec:a,AssumptionLedger:{schema:'MathScope.AssumptionLedger/1',id:'m0-assumptions',revision:'m0-assumptions:r1',assumptions:[a]},PrismSpec:prism,PrimeQuerySpec:prime,GaugeGroupSpec:group,StateFamilySpec:family,PDEConstructionSpec:pde,ObservationMapSpec:obs,ClaimSpec:claim};
  for(const [kind,value] of Object.entries(all))assertValid(kind,value);
  return all;
}

return {CONTRACT_VERSION,VERSION,LEGACY_SESSION_SCHEMA,EVIDENCE_GRADES,EDGE_TYPES,SCHEMAS,canonicalStringify,sha256,hashValue,ContractError,validate,containsUserAxiom,assertValid,validateComputeJobSpec,validateResultEnvelope,validatePrismSpec,effectiveEvidenceTrust,validateProofEdge,getContractExamples};
})();
const __m1_37 = (()=>{
const Arithmetic = __m1_6;
const Gauge = __m1_15;
const Navier = __m1_35;
const {canonicalStringify,sha256} = __m1_36;
const M1_VERSION = '1.2.0';
const LIMITS = Object.freeze({maxMillis:60000,maxBytes:8*1024*1024,maxItems:1000000,maxOperations:50000000,maxJobs:32,maxConcurrent:1,maxInputBytes:262144,maxIntegers:8388608,maxPoints:16384,maxMilliseconds:60000,maxSamples:5000,maxEvaluations:50000,maxMatrixDimension:8});
const DOMAINS = Object.freeze({arithmetic:Arithmetic,gauge:Gauge,ns:Navier});
const clone = x=>JSON.parse(canonicalStringify(x));
const bytes = x=>new TextEncoder().encode(typeof x==='string'?x:canonicalStringify(x)).length;
function normalizeRequest(value) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('A domain request object is required.');
  if(Object.keys(value).some(k=>!['kind','input','precision','budget'].includes(k)))throw Error('Unknown domain request field.');
  if(typeof value.kind!=='string'||value.kind.length>100||!DOMAINS[value.kind.split('.')[0]])throw Error('Unsupported mathematical domain.');
  for(const key of ['input','precision','budget'])if(value[key]!==undefined&&(!value[key]||typeof value[key]!=='object'||Array.isArray(value[key])))throw Error(key+' must be a JSON object.');
  const request=clone({kind:value.kind,input:value.input||{},precision:value.precision||{},budget:{maxMillis:30000,maxBytes:8*1024*1024,maxItems:250000,maxOperations:50000000,...value.budget}});
  if(Array.isArray(request.input)||Array.isArray(request.precision))throw Error('Input and precision must be objects.');
  if(Object.keys(request.budget).some(k=>!['maxMillis','maxBytes','maxItems','maxOperations','maxIntegers','maxPoints','maxMilliseconds','maxSamples','maxEvaluations','maxMatrixDimension'].includes(k)))throw Error('Unknown resource budget.');
  for(const k of ['maxMillis','maxBytes','maxItems','maxOperations'])if(!Number.isSafeInteger(request.budget[k])||request.budget[k]<1||request.budget[k]>LIMITS[k])throw Error(k+' exceeds the installed bounded runtime.');
  for(const k of ['maxIntegers','maxPoints','maxMilliseconds','maxSamples','maxEvaluations','maxMatrixDimension'])if(request.budget[k]!==undefined&&(!Number.isSafeInteger(request.budget[k])||request.budget[k]<1||request.budget[k]>LIMITS[k]))throw Error(k+' exceeds the domain budget cap.');
  if(request.budget.maxMilliseconds!==undefined)request.budget.maxMillis=Math.min(request.budget.maxMillis,request.budget.maxMilliseconds);
  if(request.kind.startsWith('ns.'))request.budget.maxMilliseconds=request.budget.maxMillis;
  if(request.budget.maxBytes<32768)throw Error('The result budget must allow at least 32 KiB of provenance.');
  if(bytes(request)>LIMITS.maxInputBytes)throw Error('Domain input exceeds 256 KiB.');
  return request;
}
async function validateDomainRequest(input) {
  let request;try{request=normalizeRequest(input);}catch(e){return {ok:false,errors:[e.message]};}
  const module=DOMAINS[request.kind.split('.')[0]];
  try {
    if(module.validateRequest){const report=await module.validateRequest(clone(request));if(report===false)return {ok:false,errors:['Domain contract rejected.']};if(report?.ok===false||report?.valid===false)return {...report,ok:false,code:report.code||report.status||report.errors?.[0]?.code||'INVALID_INPUT'};}
    return {ok:true,request};
  }catch(e){return {ok:false,errors:[e.message],code:e.code||'INVALID_INPUT'};}
}
async function listCapabilities() {
  const result={};for(const [key,module] of Object.entries(DOMAINS))result[key]=await module.getCapabilities();
  return clone({version:M1_VERSION,limits:LIMITS,domains:result,evidencePolicy:'FINITE_DOMAIN_RESULTS_DO_NOT_ISSUE_FORMAL_PASS',execution:'STATIC_BOUNDED_WORKER',server:false});
}
async function listExamples() {
  const result=[];
  for(const [domain,module] of Object.entries(DOMAINS))for(const example of await module.getExamples()){
    const request=normalizeRequest(example.request||example);
    result.push({id:example.id||request.kind,label:example.label||request.kind,domain,request});
  }
  return result;
}
async function executeDomain(input,context={}) {
  const request=normalizeRequest(input),module=DOMAINS[request.kind.split('.')[0]],report=await validateDomainRequest(request);
  if(!report.ok)return {status:['UNSUPPORTED','PRECISION_REQUIRED','BUDGET_EXCEEDED','CANCELLED'].includes(report.code)?report.code:'FAILED',evidenceGrade:'UNKNOWN',checks:[],blockers:report.errors||[report.message||'Domain contract rejected'],contractReport:report};
  context.checkCancelled?.();
  const result=await module.runJob(clone(request),{...context,isCancelled:()=>{context.checkCancelled?.();return false;},progress:value=>context.onCheckpoint?.(value)});
  context.checkCancelled?.();
  if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Domain adapter must return a JSON result.');
  const owned=clone(result);
  if(bytes(owned)>request.budget.maxBytes)throw Object.assign(Error('The mathematical result exceeds maxBytes.'),{code:'BUDGET_EXCEEDED'});
  return owned;
}
async function requestHash(request){return sha256(normalizeRequest(request));}

return {M1_VERSION,LIMITS,clone,bytes,normalizeRequest,validateDomainRequest,listCapabilities,listExamples,executeDomain,requestHash};
})();
const __m1_38 = (()=>{
const {executeDomain} = __m1_37;
let cancelled=false;
self.onmessage=async event=>{
  if(event.data?.type==='cancel'){cancelled=true;return;}
  if(event.data?.type!=='start')return;
  cancelled=false;
  const started=performance.now(),request=event.data.request;
  const checkCancelled=()=>{
    if(cancelled)throw Object.assign(Error('Job cancelled.'),{code:'CANCELLED'});
    if(performance.now()-started>request.budget.maxMillis)throw Object.assign(Error('Elapsed time budget reached.'),{code:'BUDGET_EXCEEDED'});
  };
  try {
    const result=await executeDomain(request,{checkCancelled,onCheckpoint:checkpoint=>{checkCancelled();self.postMessage({type:'checkpoint',checkpoint});}});
    checkCancelled();self.postMessage({type:'result',result});
  } catch(error) {
    const code=['RESOURCE_LIMIT','TIMEOUT'].includes(error.code)?'BUDGET_EXCEEDED':error.code;
    self.postMessage({type:'result',result:{status:['CANCELLED','BUDGET_EXCEEDED','UNSUPPORTED','PRECISION_REQUIRED'].includes(code)?code:'FAILED',evidenceGrade:'UNKNOWN',message:String(error.message),blockers:[String(error.message)]}});
  }
};

return {};
})();
})();