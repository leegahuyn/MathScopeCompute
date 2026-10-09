/** Exact Q certificates, isolated from floating point evaluation. */
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b];}return a;};
export function rational(s){if(Array.isArray(s))return s;const [p,q='1']=String(s).split('/');let n=BigInt(p),d=BigInt(q);if(d===0n)throw new Error('ZERO_DENOMINATOR');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return [n/g,d/g];}
const ZERO=[0n,1n];
// Normalize every operation: intermediate integer growth remains bounded for the certified tables.
function norm(n,d){if(n===0n)return ZERO;const g=gcd(n,d);return [n/g,d/g];}
export const qadd=(a,b)=>norm(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
export const qmul=(a,b)=>norm(a[0]*b[0],a[1]*b[1]);
export const qneg=a=>[-a[0],a[1]];
export const qeq=(a,b)=>a[0]*b[1]===b[0]*a[1];
export const qstring=a=>a[1]===1n?String(a[0]):`${a[0]}/${a[1]}`;
export function verifyExactTable(data,{corrupt=false}={}){
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
