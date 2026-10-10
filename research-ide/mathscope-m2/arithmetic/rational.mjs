// Exact rational polynomial arithmetic. All public JSON encodes integers as strings.
import {bigint,gcd,fail,mod,inverseUnit,valuation} from '../../mathscope-m1/arithmetic/exact.mjs';

export function rat(n=0n,d=1n){
  if(n&&typeof n==='object'&&Object.hasOwn(n,'n'))return n;
  n=bigint(n);d=bigint(d);if(d===0n)fail('DIVISION_BY_ZERO','Zero rational denominator.');
  if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return{n:n/g,d:d/g};
}
export const radd=(a,b)=>{a=rat(a);b=rat(b);return rat(a.n*b.d+b.n*a.d,a.d*b.d);};
export const rneg=a=>{a=rat(a);return{n:-a.n,d:a.d};};
export const rsub=(a,b)=>radd(a,rneg(b));
export const rmul=(a,b)=>{a=rat(a);b=rat(b);return rat(a.n*b.n,a.d*b.d);};
export const rdiv=(a,b)=>{a=rat(a);b=rat(b);return rat(a.n*b.d,a.d*b.n);};
export const req=(a,b)=>{a=rat(a);b=rat(b);return a.n===b.n&&a.d===b.d;};
export const rjson=a=>{a=rat(a);return{numerator:String(a.n),denominator:String(a.d)};};
export function rresidue(a,p,N){a=rat(a);if(a.d%p===0n)fail('NONINTEGRAL_FROBENIUS','The requested basis has a nonintegral coefficient; do not silently discard a denominator.',rjson(a));const m=p**BigInt(N);return mod(a.n*inverseUnit(a.d,m),m);}
export const rval=(a,p)=>{a=rat(a);return a.n===0n?null:valuation(a.n,p)-valuation(a.d,p);};
export const ptrim=a=>{const b=a.map(x=>rat(x));while(b.length>1&&b.at(-1).n===0n)b.pop();return b.length?b:[rat()];};
export const padd=(a,b)=>ptrim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>radd(a[i]??0n,b[i]??0n)));
export const psub=(a,b)=>padd(a,b.map(rneg));
export const pscale=(a,c)=>ptrim(a.map(x=>rmul(x,c)));
export const pshift=(a,k)=>[...Array.from({length:k},()=>rat()),...a.map(x=>rat(x))];
export function pmul(a,b,tracker=null){
  const c=Array.from({length:a.length+b.length-1},()=>rat());
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)if(rat(a[i]).n&&rat(b[j]).n){tracker?.tick();c[i+j]=radd(c[i+j],rmul(a[i],b[j]));}
  return ptrim(c);
}
export function ppow(a,n,tracker=null){let b=[rat(1n)];while(n){if(n%2)b=pmul(b,a,tracker);n=Math.floor(n/2);if(n)a=pmul(a,a,tracker);}return b;}
export const pderivative=a=>a.length===1?[rat()]:a.slice(1).map((x,i)=>rmul(x,BigInt(i+1)));
export const peq=(a,b)=>{a=ptrim(a);b=ptrim(b);return a.length===b.length&&a.every((x,i)=>req(x,b[i]));};
export function pdiv(a,b,tracker=null){
  a=ptrim(a);b=ptrim(b);if(b.at(-1).n===0n)fail('DIVISION_BY_ZERO','Zero polynomial divisor.');
  const q=Array.from({length:Math.max(1,a.length-b.length+1)},()=>rat());
  while(a.length>=b.length&&a.at(-1).n!==0n){tracker?.tick();const k=a.length-b.length,c=rdiv(a.at(-1),b.at(-1));q[k]=radd(q[k],c);a=psub(a,pshift(pscale(b,c),k));}
  return{q:ptrim(q),r:a};
}
export function pbezout(a,b,tracker=null){
  let r0=ptrim(a),r1=ptrim(b),s0=[rat(1n)],s1=[rat()],t0=[rat()],t1=[rat(1n)];
  while(!(r1.length===1&&r1[0].n===0n)){
    const {q,r}=pdiv(r0,r1,tracker);[r0,r1]=[r1,r];[s0,s1]=[s1,psub(s0,pmul(q,s1,tracker))];[t0,t1]=[t1,psub(t0,pmul(q,t1,tracker))];
  }
  if(r0.length!==1||r0[0].n===0n)fail('SINGULAR_CURVE','The cubic and its derivative are not coprime.');
  return{s:pscale(s0,rdiv(1n,r0[0])),t:pscale(t0,rdiv(1n,r0[0]))};
}
