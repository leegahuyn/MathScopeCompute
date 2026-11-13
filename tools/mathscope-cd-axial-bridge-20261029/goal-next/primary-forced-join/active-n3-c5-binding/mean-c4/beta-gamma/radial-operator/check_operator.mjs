import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// Arguments: source-pressure.mjs source-temporal-potential.mjs
// source-current-state.mjs same-live-gamma-bound-v3.json output.json.
assert.equal(process.argv.length, 7);
const pins = [
  'fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f',
  'c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8',
  '230ec8f46465bb0ff085415ac80e962990ae78bcd222b81a2e08f1618d51b913',
  'b3f8ede491d84776845ed2673d2459e65fd767ffcaa89779bcb5e214ef416c95'];
const data=process.argv.slice(2,6).map((f,i)=>{
  const b=readFileSync(f); assert.equal(createHash('sha256').update(b).digest('hex'),pins[i]);
  return b.toString('utf8');
});
for (const s of [
  'shift=G.sub(G.substitute(radialPrimitive,R,r),radialPrimitive)',
  'shiftedY=Y.map((y,j)=>G.add(y,G.mul(shift,vr[j])))',
  'left=G.integral(integrand,r,innerRadius,R),whole=G.integral(integrand,r,innerRadius,outerRadius)',
  'G.derivative(radialPrimitive,R)===a',
  '[Z,T,...Y].every(x=>!G.freeCoordinates(radialPrimitive).has(x))']) assert(data[0].includes(s),s);
for(const s of ['weighted=G.mul(R,gammaDesired)',
  'cutoffRemainder=G.div(G.mul(G.derivative(chi,R),integrals.whole),R)']) assert(data[1].includes(s),s);
for(const s of ['chi=G.step(argument)',
  '[innerRadius,outerRadius].every(a=>[R,Z,T].every(c=>!G.freeCoordinates(a).has(c))']) assert(data[2].includes(s),s);
const gamma=JSON.parse(data[3]); assert.equal(gamma.status,'SAME_LIVE_N3_GAMMA_POSITIVE_N_SOURCE_BOUND_CONDITIONAL');

// Non-negative integer polynomial coefficients in ascending powers of C.
const add=(a,b)=>Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]??0n)+(b[i]??0n));
const mul=(a,b)=>{const c=Array(a.length+b.length-1).fill(0n);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)c[i+j]+=a[i]*b[j];return c;};
const scale=(a,n)=>a.map(x=>x*BigInt(n));
const binom=(n,k)=>{let a=1;for(let i=1;i<=k;i++)a=a*(n-i+1)/i;return a;};
const C=[0n,1n], U=[C];
for(let k=1;k<=4;k++){
  let s=[0n];for(let i=0;i<k;i++)s=add(s,scale(U[k-1-i],binom(k-1,i)));
  U.push(add([1n],mul(C,s)));
}
const convolution=k=>{let s=[0n];for(let j=0;j<=k;j++)s=add(s,scale(U[k-j],binom(k,j)));return s;};
const O0=add(U[4],mul(C,convolution(4)));
const O1=scale(mul(mul(mul(C,C),add(C,[3n])),convolution(3)),8);
const at1=a=>a.reduce((x,y)=>x+y,0n);
assert.deepEqual(U.map(at1),[1n,2n,4n,10n,30n]);
assert.equal(at1(O0),133n);assert.equal(at1(O1),928n);
// Exact toy obstruction: at R=2 on [1,2], a=chi=0, eps=1,
// T1(T0(1))=5/12 and T1(1/R)=1/2. Sixth Z derivative grows
// for W_m=m^-5 sin(m Z) sin(Y) while all mixed derivatives <=5 stay bounded.
assert.equal(16-12-2+3,5); // common denominator 6: 5/6 before division by R=2.
const output={status:'CONDITIONAL_PINNED_SHIFTED_OPERATOR_POLYNOMIALS',
  pins,coefficientsAscending:{U:U.map(a=>a.map(String)),O0:O0.map(String),O1:O1.map(String)},
  controls:{C1_U:U.map(x=>String(at1(x))),C1_O0:String(at1(O0)),C1_O1:String(at1(O1)),toy_T1_T0:'5/12',toy_T1_invR:'1/2'},
  scope:'Exact source structure and integer arithmetic only; scalar C, flat joins and same-live C5 transfer remain premises. Toy is not an actual-source counterexample.'};
writeFileSync(process.argv[6],JSON.stringify(output,null,2)+'\n'); console.log(JSON.stringify(output,null,2));
