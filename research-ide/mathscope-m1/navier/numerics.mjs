/** Real interval arithmetic and finite computation budgets. IEEE-754 endpoints.
 * exp/log enclosures use Taylor/atanh remainders, never Math.exp/log as certificates.
 * A certificate is arithmetic, quadrature, or series-specific; it is not a PDE proof.
 */
export class ComputeError extends Error {
  constructor(code, message, detail={}) { super(message); this.name='ComputeError'; this.code=code; this.detail=detail; }
}
const buf=new ArrayBuffer(8), view=new DataView(buf);
export function nextUp(x) {
  if(Number.isNaN(x)||x===Infinity) return x;
  if(x===0) return Number.MIN_VALUE;
  view.setFloat64(0,x); let n=view.getBigUint64(0); n=x>0?n+1n:n-1n;
  view.setBigUint64(0,n); return view.getFloat64(0);
}
export const nextDown=x=>-nextUp(-x);
export const point=x=>{if(!Number.isFinite(x)) throw new ComputeError('PRECISION_REQUIRED','Nonfinite interval input',{x});return [x,x];};
export const interval=(lo,hi)=>{if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo>hi)throw new ComputeError('INVALID_INPUT','Invalid interval',{lo,hi});return [lo,hi];};
const arithmeticBox=(lo,hi)=>{if(!Number.isFinite(lo)||!Number.isFinite(hi))throw new ComputeError('PRECISION_REQUIRED','Interval arithmetic overflow; use a higher-precision or logarithmic evaluator');return [lo,hi];};
export const iadd=(a,b)=>arithmeticBox(nextDown(a[0]+b[0]),nextUp(a[1]+b[1]));
export const ineg=a=>[-a[1],-a[0]];
export const isub=(a,b)=>iadd(a,ineg(b));
export function imul(a,b){const v=[a[0]*b[0],a[0]*b[1],a[1]*b[0],a[1]*b[1]];return arithmeticBox(nextDown(Math.min(...v)),nextUp(Math.max(...v)));}
export function idiv(a,b){if(b[0]<=0&&b[1]>=0)throw new ComputeError('PRECISION_REQUIRED','Divisor enclosure contains zero',{divisor:b});return imul(a,[nextDown(1/b[1]),nextUp(1/b[0])]);}
export const iscale=(a,b)=>imul(a,Array.isArray(b)?b:point(b));
export function ipow(a,n){if(!Number.isInteger(n)||n<0)throw new ComputeError('INVALID_INPUT','Nonnegative integer exponent required');let out=point(1),b=a;while(n){if(n%2)out=imul(out,b);n=Math.floor(n/2);if(n)b=imul(b,b);}return out;}
export const radius=a=>nextUp((a[1]-a[0])/2);
export const midpoint=a=>a[0]+(a[1]-a[0])/2;
export const maxabs=a=>Math.max(Math.abs(a[0]),Math.abs(a[1]));
export const ball=a=>({type:'real-ball',lower:a[0],upper:a[1],midpoint:midpoint(a),radius:radius(a),precisionBits:53,rounding:'outward IEEE-754 operations; elementary functions by bounded series'});
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
export const iexp=a=>[expScalar(a[0])[0],expScalar(a[1])[1]];
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
export const ilog=a=>{if(!(a[0]>0))throw new ComputeError('PRECISION_REQUIRED','log interval touches zero',{a});return [logScalar(a[0])[0],logScalar(a[1])[1]];};
export const ipower=(a,b)=>iexp(imul(ilog(a),Array.isArray(b)?b:point(b)));
export function makeBudget(budget={},hooks={}){
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
export function validatePrecision(precision={}){
  const absoluteTolerance=Number(precision.absoluteTolerance??1e-8),relativeTolerance=Number(precision.relativeTolerance??1e-8);
  if(!(absoluteTolerance>0&&relativeTolerance>0)||!Number.isFinite(absoluteTolerance+relativeTolerance))throw new ComputeError('INVALID_INPUT','Positive finite error targets required');
  const bits=precision.bits===undefined?53:precision.bits;
  if(typeof bits!=='number'||!Number.isSafeInteger(bits)||bits<1)throw new ComputeError('INVALID_INPUT','precision.bits must be a positive safe integer');
  if(bits>53)throw new ComputeError('PRECISION_REQUIRED','Browser evaluator provides outward binary64 balls; high precision reference fixtures are computed separately',{requestedBits:bits,availableBits:53});
  if(absoluteTolerance<2e-14)throw new ComputeError('PRECISION_REQUIRED','Target is below this binary64 interval evaluator floor',{absoluteTolerance,minimumAbsoluteTolerance:2e-14});
  return {bits:53,absoluteTolerance,relativeTolerance};
}
export function finiteNumber(x,name){x=Number(x);if(!Number.isFinite(x))throw new ComputeError('INVALID_INPUT',`${name} must be finite`);return x;}
export function positive(x,name){x=finiteNumber(x,name);if(!(x>0))throw new ComputeError('INVALID_INPUT',`${name} must be positive`);return x;}
export function boundedInteger(x,name,lo,hi){x=Number(x);if(!Number.isInteger(x)||x<lo||x>hi)throw new ComputeError('INVALID_INPUT',`${name} must be an integer in [${lo},${hi}]`);return x;}
export function integrate(f,a,b,tolerance=1e-10,budget=makeBudget()){
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
export const jconst=(a,n=4)=>[Array.isArray(a)?a:point(a),...Array.from({length:n},()=>point(0))];
export const jvar=(a,n=4)=>[a,point(1),...Array.from({length:n-1},()=>point(0))];
export const jadd=(a,b)=>a.map((x,i)=>iadd(x,b[i]));
export const jneg=a=>a.map(ineg);
export const jsub=(a,b)=>jadd(a,jneg(b));
export const jscale=(a,b)=>a.map(x=>iscale(x,b));
export function jmul(a,b){return a.map((_,n)=>{let v=point(0);for(let i=0;i<=n;i++)v=iadd(v,imul(a[i],b[n-i]));return v;});}
export function jinv(a){const r=[idiv(point(1),a[0])];for(let n=1;n<a.length;n++){let v=point(0);for(let i=1;i<=n;i++)v=iadd(v,imul(a[i],r[n-i]));r.push(ineg(idiv(v,a[0])));}return r;}
export const jdiv=(a,b)=>jmul(a,jinv(b));
export function jexp(a){const r=[iexp(a[0])];for(let n=1;n<a.length;n++){let v=point(0);for(let i=1;i<=n;i++)v=iadd(v,iscale(imul(a[i],r[n-i]),i));r.push(idiv(v,point(n)));}return r;}
export function jlog(a){const inv=jinv(a),r=[ilog(a[0])];for(let n=1;n<a.length;n++){let v=point(0);for(let i=1;i<=n;i++)v=iadd(v,iscale(imul(a[i],inv[n-i]),i));r.push(idiv(v,point(n)));}return r;}
export function certifiedSimpson(fBall,fFourth,a,b,tolerance,budget=makeBudget()){
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
export function solveLinear(A,b){
  const n=b.length,M=A.map((r,i)=>[...r,b[i]]);let pivotMin=Infinity,pivotMax=0;
  for(let k=0;k<n;k++){let p=k;for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[p][k]))p=i;
    const v=Math.abs(M[p][k]);if(!(v>1e-15))throw new ComputeError('SINGULAR_SYSTEM','Linear pivot too small',{k,pivot:v});pivotMin=Math.min(pivotMin,v);pivotMax=Math.max(pivotMax,v);[M[k],M[p]]=[M[p],M[k]];
    for(let i=k+1;i<n;i++){const r=M[i][k]/M[k][k];for(let j=k;j<=n;j++)M[i][j]-=r*M[k][j];}
  }
  const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let v=M[i][n];for(let j=i+1;j<n;j++)v-=M[i][j]*x[j];x[i]=v/M[i][i];}
  return {solution:x,pivotMin,pivotRatio:pivotMax/pivotMin,residual:Math.max(...A.map((r,i)=>Math.abs(r.reduce((s,v,j)=>s+v*x[j],0)-b[i])))};
}
export function canonical(value){if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')}}`;return JSON.stringify(value);}
export async function sha256(value){const bytes=typeof value==='string'?new TextEncoder().encode(value):value;const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
