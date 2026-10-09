/* Exact arithmetic used by the M1 arithmetic worker. No ambient application state. */
export class ArithmeticError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'ArithmeticError'; this.code = code; this.details = details; }
}
export const fail = (code, message, details) => { throw new ArithmeticError(code, message, details); };
export function bigint(value, name = 'integer', maxDigits = 4096) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) fail('INVALID_EXACT_INTEGER', `${name}: unsafe Number; use a decimal string.`);
  if (!['string','number','bigint'].includes(typeof value) || !/^-?\d+$/.test(String(value)) || String(value).replace('-','').length > maxDigits) fail('INVALID_EXACT_INTEGER', `${name}: expected a bounded decimal integer.`);
  return BigInt(value);
}
export function small(value, name, lower, upper) { const n = bigint(value, name); if (n < BigInt(lower) || n > BigInt(upper)) fail('INPUT_RANGE', `${name} must be in [${lower},${upper}].`); return Number(n); }
export const abs = x => x < 0n ? -x : x;
export const mod = (x,m) => { if (m <= 0n) fail('INVALID_MODULUS','Positive modulus required.'); return ((x%m)+m)%m; };
export function gcd(a,b) { a=abs(a);b=abs(b);while(b){[a,b]=[b,a%b];}return a; }
export function isqrt(n) { n=bigint(n); if(n<0n)fail('INPUT_RANGE','Square root requires a nonnegative integer.'); if(n<2n)return n; let x=1n<<BigInt(Math.ceil(n.toString(2).length/2)); for(;;){const y=(x+n/x)>>1n;if(y>=x)return x;x=y;} }
export function powmod(a,e,m,tracker=null) { a=mod(a,m); if(e<0n)fail('INPUT_RANGE','Nonnegative exponent required.'); let r=1n%m;while(e){tracker?.tick();if(e&1n)r=r*a%m;a=a*a%m;e>>=1n;}return r; }
export function inverseUnit(a,m) { let x=mod(a,m),y=m,u=1n,v=0n;while(y){const q=x/y;[x,y]=[y,x-q*y];[u,v]=[v,u-q*v];}if(x!==1n)fail('NONUNIT_DIVISION','The denominator is not a unit; finite p-power rings are not fields.');return mod(u,m); }
export function valuation(a,p,cap=100000) { a=abs(a);if(a===0n)return cap;let v=0;while(v<cap&&a%p===0n){a/=p;v++;}return v; }
export function canonical(value) {
  const seen=new Set();let nodes=0;
  const rec=(v,d=0)=>{if(++nodes>2000000||d>80)fail('SERIALIZATION_LIMIT','JSON exceeds the arithmetic bound.');if(v===null||typeof v==='boolean'||typeof v==='string')return JSON.stringify(v);if(typeof v==='number'){if(!Number.isFinite(v)||(Number.isInteger(v)&&!Number.isSafeInteger(v)))fail('NON_CANONICAL_NUMBER','Unsafe or nonfinite JSON Number.');return JSON.stringify(v);}if(typeof v!=='object'||seen.has(v))fail('NON_CANONICAL_JSON','JSON must be acyclic; encode BigInt as a decimal string.');seen.add(v);let s;if(Array.isArray(v)){for(let i=0;i<v.length;i++)if(!Object.hasOwn(v,i))fail('NON_CANONICAL_JSON','Sparse JSON array.');s='['+v.map(x=>rec(x,d+1)).join(',')+']';}else{if(Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)fail('NON_CANONICAL_JSON','Plain JSON objects required.');s='{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+rec(v[k],d+1)).join(',')+'}';}seen.delete(v);return s;};return rec(value);
}
export const clone=v=>JSON.parse(canonical(v));
export async function hash(value) { if(!globalThis.crypto?.subtle)fail('CRYPTO_UNAVAILABLE','A WebCrypto SHA-256 implementation is required.');const b=new TextEncoder().encode(typeof value==='string'?value:canonical(value));const d=await globalThis.crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join(''); }
export function meter(budget={},context={}) {
  const maxOperations=small(budget.maxOperations??50000000,'maxOperations',1,500000000);
  const maxMillis=small(budget.maxMillis??30000,'maxMillis',1,60000);
  const start=Date.now();let operations=0,last=0;
  return {tick(n=1){operations+=n;if(operations>maxOperations)fail('RESOURCE_LIMIT','Arithmetic operation budget exhausted.',{operations,maxOperations});if(operations-last>=512||n===0){last=operations;if(context.signal?.aborted||context.isCancelled?.())fail('CANCELLED','Calculation cancelled.');context.checkCancelled?.();if(Date.now()-start>maxMillis)fail('TIMEOUT','Arithmetic time budget exhausted.',{maxMillis});}},checkpoint:async data=>{context.checkCancelled?.();await context.onCheckpoint?.(clone(data));},get operations(){return operations;},maxOperations,maxMillis};
}
export function matrix(rows,cols,entries=[]) {
  if(!Number.isSafeInteger(rows)||!Number.isSafeInteger(cols)||rows<0||cols<0||rows>4096||cols>4096)fail('MATRIX_SHAPE','Invalid sparse matrix dimensions.');
  const m=new Map();for(const e of entries){if(!Array.isArray(e)||e.length!==3)fail('MATRIX_ENTRY','Triplet required.');const [r,c,v]=e;if(!Number.isInteger(r)||!Number.isInteger(c)||r<0||r>=rows||c<0||c>=cols)fail('MATRIX_ENTRY','Sparse index outside matrix.');const k=r*cols+c;m.set(k,(m.get(k)??0n)+bigint(v));}
  return {rows,cols,entries:[...m].filter(([,v])=>v!==0n).sort(([a],[b])=>a-b).map(([k,v])=>[Math.floor(k/cols),k%cols,v.toString()])};
}
export const identity=n=>matrix(n,n,Array.from({length:n},(_,i)=>[i,i,'1']));
export const zero=(r,c)=>matrix(r,c);
export function multiply(a,b,meter=null,modulus=null) {
  a=matrix(a.rows,a.cols,a.entries);b=matrix(b.rows,b.cols,b.entries);if(a.cols!==b.rows)fail('MATRIX_SHAPE','Matrix composition has incompatible dimensions.');const byRow=new Map();for(const [r,c,v]of b.entries){if(!byRow.has(r))byRow.set(r,[]);byRow.get(r).push([c,BigInt(v)]);}const out=new Map();for(const[r,k,v]of a.entries)for(const[c,w]of byRow.get(k)??[]){meter?.tick();const key=r*b.cols+c;out.set(key,(out.get(key)??0n)+BigInt(v)*w);}return matrix(a.rows,b.cols,[...out].map(([k,v])=>[Math.floor(k/b.cols),k%b.cols,modulus?mod(v,modulus):v]));
}
export function addMatrix(a,b,sign=1n) {if(a.rows!==b.rows||a.cols!==b.cols)fail('MATRIX_SHAPE','Matrix addition requires the same dimensions.');return matrix(a.rows,a.cols,[...a.entries,...b.entries.map(([r,c,v])=>[r,c,sign*BigInt(v)])]);}
export const equalMatrix=(a,b)=>canonical(matrix(a.rows,a.cols,a.entries))===canonical(matrix(b.rows,b.cols,b.entries));
export const reduceMatrix=(a,m)=>matrix(a.rows,a.cols,a.entries.map(([r,c,v])=>[r,c,mod(BigInt(v),m)]));
export function dense(a) {a=matrix(a.rows,a.cols,a.entries);if(a.rows*a.cols>65536)fail('RESOURCE_LIMIT','Dense matrix view exceeds 65,536 cells.');const d=Array.from({length:a.rows},()=>Array(a.cols).fill(0n));for(const[r,c,v]of a.entries)d[r][c]=BigInt(v);return d;}
export const fromDense=(a,columns=a[0]?.length??0)=>matrix(a.length,columns,a.flatMap((row,r)=>row.map((v,c)=>[r,c,v])));
export function determinant(a) {const b=dense(a);if(a.rows!==a.cols||a.rows>32)fail('MATRIX_SHAPE','Determinant requires a square matrix of size at most 32.');if(!a.rows)return 1n;let prev=1n,sign=1n;for(let k=0;k<a.rows-1;k++){let pivot=k;while(pivot<a.rows&&b[pivot][k]===0n)pivot++;if(pivot===a.rows)return 0n;if(pivot!==k){[b[pivot],b[k]]=[b[k],b[pivot]];sign=-sign;}const p=b[k][k];for(let i=k+1;i<a.rows;i++)for(let j=k+1;j<a.rows;j++){const numerator=b[i][j]*p-b[i][k]*b[k][j];if(numerator%prev!==0n)fail('INTERNAL_CERTIFICATE','Nonexact Bareiss division.');b[i][j]=numerator/prev;}for(let i=k+1;i<a.rows;i++)b[i][k]=0n;prev=p;}return sign*b[a.rows-1][a.rows-1];}
