// Exact Laurent polynomials in the FORMAL variable q, with integer coefficients.
import {bigint,fail} from '../../mathscope-m1/arithmetic/exact.mjs';
export const qc=n=>new Map(bigint(n)===0n?[]:[[0,bigint(n)]]);
export const qm=(exponent,coefficient=1n)=>new Map(bigint(coefficient)===0n?[]:[[exponent,bigint(coefficient)]]);
export const qadd=(a,b)=>{const c=new Map(a);for(const [e,x]of b)c.set(e,(c.get(e)??0n)+x);for(const[e,x]of c)if(x===0n)c.delete(e);return c;};
export const qneg=a=>new Map([...a].map(([e,x])=>[e,-x]));
export const qsub=(a,b)=>qadd(a,qneg(b));
export const qscale=(a,x)=>new Map([...a].map(([e,c])=>[e,c*bigint(x)]).filter(([,c])=>c!==0n));
export function qmul(a,b){const c=new Map();for(const[e,x]of a)for(const[f,y]of b)c.set(e+f,(c.get(e+f)??0n)+x*y);for(const[e,x]of c)if(!x)c.delete(e);if(c.size>16384)fail('RESOURCE_LIMIT','Formal q polynomial exceeds its coefficient budget.');return c;}
export const qshift=(a,k)=>new Map([...a].map(([e,x])=>[e+k,x]));
export const qeq=(a,b)=>qsub(a,b).size===0;
export const qone=a=>[...a.values()].reduce((s,x)=>s+x,0n);
export const qencode=a=>[...a].sort(([a],[b])=>a-b).map(([qPower,coefficient])=>({qPower,coefficient:String(coefficient)}));
export const qdecode=a=>new Map(a.map(x=>[x.qPower,BigInt(x.coefficient)]));
export function qinteger(n){if(!Number.isSafeInteger(n)||Math.abs(n)>256)fail('INPUT_RANGE','The displayed q-integer exponent must be bounded.');return n>=0?new Map(Array.from({length:n},(_,i)=>[i,1n])):new Map(Array.from({length:-n},(_,i)=>[n+i,-1n]));}
export function qbinomial(n,k){
  if(k<0||k>n)return qc(0n);let row=[qc(1n)];
  for(let j=1;j<=n;j++)row=Array.from({length:j+1},(_,i)=>qadd(i?row[i-1]??qc(0n):qc(0n),qshift(row[i]??qc(0n),i)));
  return row[k];
}
export const qmatrix=(r,c)=>Array.from({length:r},()=>Array.from({length:c},()=>qc(0n)));
export const qidentity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>qc(i===j?1n:0n)));
export function qmmul(a,b){
  if(a[0]?.length!==b.length)fail('MATRIX_SHAPE','Formal q matrices do not compose.');
  const c=qmatrix(a.length,b[0]?.length??0);for(let i=0;i<a.length;i++)for(let k=0;k<b.length;k++)if(a[i][k].size)for(let j=0;j<c[i].length;j++)if(b[k][j].size)c[i][j]=qadd(c[i][j],qmul(a[i][k],b[k][j]));return c;
}
export const qmadd=(a,b)=>a.map((r,i)=>r.map((x,j)=>qadd(x,b[i][j])));
export const qmeq=(a,b)=>a.length===b.length&&a.every((r,i)=>r.length===b[i].length&&r.every((x,j)=>qeq(x,b[i][j])));
export const qmencode=a=>a.map(r=>r.map(qencode));
export function triangularInverse(a){
  const n=a.length,b=qidentity(n);if(a.some((r,i)=>r.length!==n||!qeq(r[i],qc(1n))||r.slice(0,i).some(x=>x.size)))fail('MATRIX_SHAPE','A unit upper triangular q matrix is required.');
  for(let column=0;column<n;column++)for(let row=column-1;row>=0;row--){let s=qc(0n);for(let k=row+1;k<=column;k++)s=qadd(s,qmul(a[row][k],b[k][column]));b[row][column]=qneg(s);}return b;
}
