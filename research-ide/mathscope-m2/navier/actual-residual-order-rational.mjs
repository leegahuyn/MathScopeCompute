/** Exact rational interval operations used only by the residual certificate. */
import {nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
export function rational(a,b=1){a=BigInt(a);b=BigInt(b);if(!b)throw Error('Zero denominator.');if(b<0n){a=-a;b=-b;}const g=gcd(a,b);return [a/g,b/g];}
export function readRational(s){if(typeof s!=='string'||!/^[-+]?\d+(\/\d+)?$/.test(s))throw Error('Expected an exact rational string.');const [a,b='1']=s.split('/');return rational(a,b);}
export const rationalText=a=>a[1]===1n?String(a[0]):a[0]+'/'+a[1];
export const addR=(a,b)=>rational(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
export const mulR=(a,b)=>rational(a[0]*b[0],a[1]*b[1]);
export const divR=(a,b)=>rational(a[0]*b[1],a[1]*b[0]);
export const negR=a=>[-a[0],a[1]];
export const cmpR=(a,b)=>{const z=a[0]*b[1]-b[0]*a[1];return z<0n?-1:z>0n?1:0;};
export const pointR=(a,b=1)=>{const x=rational(a,b);return [x,x];};
export const addI=(a,b)=>[addR(a[0],b[0]),addR(a[1],b[1])];
export const scaleI=(a,n,d=1)=>{const s=rational(n,d),v=a.map(x=>mulR(x,s));return n<0?v.reverse():v;};
export const widenI=(a,e)=>[addR(a[0],negR(e)),addR(a[1],e)];
export const packI=a=>({lower:rationalText(a[0]),upper:rationalText(a[1]),width:rationalText(addR(a[1],negR(a[0])))});
export const unpackI=a=>[readRational(a.lower),readRational(a.upper)];
export function roundI(a,bits){const d=1n<<BigInt(bits),floor=x=>{const n=x[0]*d;let k=n/x[1];if(n<0n&&n%x[1])k--;return k;};return [rational(floor(a[0]),d),rational(-floor(negR(a[1])),d)];}
function floatR(x){if(!Number.isFinite(x))throw Error('A displayed interval endpoint must be finite.');if(x===0)return rational(0);const d=new DataView(new ArrayBuffer(8));d.setFloat64(0,x);const b=d.getBigUint64(0),sg=b>>63n?-1n:1n,e=Number((b>>52n)&2047n),m=(b&((1n<<52n)-1n))+(e?1n<<52n:0n),p=(e?e-1023:-1022)-52;return p>=0?rational(sg*m*(1n<<BigInt(p))):rational(sg*m,1n<<BigInt(-p));}
function directed(x,side){const sign=x[0]<0n?-1:1,numerator=x[0]<0n?-x[0]:x[0],ns=Math.max(0,numerator.toString(2).length-60),ds=Math.max(0,x[1].toString(2).length-60);let n=sign*(Number(numerator>>BigInt(ns))/Number(x[1]>>BigInt(ds)))*2**(ns-ds);for(let k=0;k<8;k++){if(side<0?cmpR(floatR(n),x)<=0:cmpR(floatR(n),x)>=0)return n;n=side<0?nextDown(n):nextUp(n);}throw Error('Unable to direct a displayed endpoint.');}
export function displayI(a){const out=[directed(a[0],-1),directed(a[1],1)];return {displayEnclosure:out,value:(out[0]+out[1])/2,displayCenterIsIntervalMidpoint:true};}
