/** Directed dyadic arithmetic for the additive continuation integral adapter. */
import {nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';

export const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
export function rational(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)fail('INVALID_INPUT','A rational denominator must be nonzero.');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return [n/g,d/g];}
export const qadd=(a,b)=>rational(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
export const qneg=a=>[-a[0],a[1]];
export const qsub=(a,b)=>qadd(a,qneg(b));
export const qmul=(a,b)=>rational(a[0]*b[0],a[1]*b[1]);
export const qdiv=(a,b)=>rational(a[0]*b[1],a[1]*b[0]);
export const qpow=(a,n)=>n<0?rational(a[1]**BigInt(-n),a[0]**BigInt(-n)):rational(a[0]**BigInt(n),a[1]**BigInt(n));
export const qcompare=(a,b)=>a[0]*b[1]<b[0]*a[1]?-1:a[0]*b[1]>b[0]*a[1]?1:0;
export const qtext=a=>a[1]===1n?String(a[0]):a[0]+'/'+a[1];
export const factorial=n=>{let f=1n;for(let k=2;k<=n;k++)f*=BigInt(k);return f;};
export function readRational(x,maxBits=32768){if(typeof x==='number'&&Number.isSafeInteger(x))x=String(x);if(typeof x!=='string'||!/^[-+]?\d+(\/\d+)?$/.test(x))fail('INVALID_INPUT','Expected an exact rational string or safe integer.');const [n,d='1']=x.split('/');if(n.length+d.length>maxBits)fail('RESOURCE_LIMIT','Exact rational text exceeds its explicit budget.');const r=rational(n,d);if(r.some(x=>(x<0n?-x:x).toString(2).length>maxBits))fail('RESOURCE_LIMIT','Exact rational exceeds its explicit bit budget.');return r;}
const floor=(a,b)=>{let x=a/b;if(a<0n&&a%b)x--;return x;},ceil=(a,b)=>-floor(-a,b);
const isqrt=n=>{if(n<0n)fail('INVALID_INPUT','Cannot take a real square root of a negative interval.');if(n<2n)return n;let x=1n<<BigInt(Math.ceil(n.toString(2).length/2)),y=(x+n/x)>>1n;while(y<x){x=y;y=(x+n/x)>>1n;}return x;};

export function directedArithmetic(bits=192){
  if(!Number.isSafeInteger(bits)||bits<96||bits>512)fail('INVALID_INPUT','Continuation arithmetic uses 96..512 bits.');
  const S=1n<<BigInt(bits);let operations=0;
  const point=a=>{a=Array.isArray(a)?a:rational(a);return [floor(a[0]*S,a[1]),ceil(a[0]*S,a[1])];};
  const zero=()=>[0n,0n],one=()=>[S,S];
  const add=(a,b)=>{operations++;return [a[0]+b[0],a[1]+b[1]];},neg=a=>[-a[1],-a[0]],sub=(a,b)=>add(a,neg(b));
  const mul=(a,b)=>{operations++;const p=a.flatMap(x=>b.map(y=>x*y));let lo=p[0],hi=p[0];for(const x of p){if(x<lo)lo=x;if(x>hi)hi=x;}return [floor(lo,S),ceil(hi,S)];};
  const div=(a,b)=>{operations++;if(b[0]<=0n&&b[1]>=0n)fail('PRECISION_REQUIRED','The interval denominator contains zero.');const p=a.flatMap(x=>b.map(y=>rational(x*S,y))).sort(qcompare);return [floor(p[0][0],p[0][1]),ceil(p[3][0],p[3][1])];};
  const absUpper=a=>{const x=a[0]<0n?-a[0]:a[0],y=a[1]<0n?-a[1]:a[1];return [0n,x>y?x:y];};
  const widen=(a,e)=>{e=Array.isArray(e)?e:readRational(e);const w=ceil(e[0]*S,e[1]);if(w<0n)fail('INVALID_INPUT','A remainder radius cannot be negative.');return [a[0]-w,a[1]+w];};
  const small=power=>[0n,ceil(S,1n<<BigInt(power))];
  const unpack=x=>{if(!x||x.lower===undefined||x.upper===undefined)fail('INVALID_INPUT','An interval needs both rational endpoints.');const a=point(readRational(x.lower))[0],b=point(readRational(x.upper))[1];if(a>b)fail('INVALID_INPUT','Reversed interval endpoints.');return [a,b];};
  const pack=a=>({lower:qtext(rational(a[0],S)),upper:qtext(rational(a[1],S)),denominatorPowerOfTwo:bits,displayEnclosure:[nextDown(Number(a[0])/2**bits),nextUp(Number(a[1])/2**bits)]});
  const sqrt=a=>{operations++;if(a[0]<0n)fail('PRECISION_REQUIRED','A square-root input is not nonnegative.');const lo=isqrt(a[0]*S),h=isqrt(a[1]*S);return [lo,h*h===a[1]*S?h:h+1n];};
  let logTwo=null;
  const logUnit=x=>{
    if(qcompare(x,rational(1))===0)return zero();
    const z=qdiv(qsub(x,rational(1)),qadd(x,rational(1))),v=point(z),v2=mul(v,v),N=Math.ceil(bits/3)+16;let term=v,sum=zero();
    for(let k=0;k<N;k++){sum=add(sum,div(term,point(2*k+1)));term=mul(term,v2);}
    const radius=rational(9n,4n*BigInt(2*N+1)*3n**BigInt(2*N+1));
    return widen(mul(point(2),sum),radius);
  };
  const logRational=x=>{
    x=Array.isArray(x)?x:readRational(x);if(x[0]<=0n)fail('INVALID_INPUT','A logarithm requires an exact positive rational.');
    let k=x[0].toString(2).length-x[1].toString(2).length,y=qmul(x,k>=0?rational(1n,1n<<BigInt(k)):rational(1n<<BigInt(-k)));
    if(qcompare(y,rational(1))<0){k--;y=qmul(y,rational(2));}else if(qcompare(y,rational(2))>=0){k++;y=qdiv(y,rational(2));}
    if(logTwo===null)logTwo=logUnit(rational(2));
    return add(logUnit(y),mul(point(k),logTwo));
  };
  return {bits,S,point,zero,one,add,neg,sub,mul,div,absUpper,widen,small,unpack,pack,sqrt,logRational,operations:()=>operations};
}

/** Taylor coefficient jets in w=(eta-eta0)/j0, including all cross terms. */
export function intervalJets(A,order){
  const c=a=>[Array.isArray(a)?a:A.point(a),...Array.from({length:order},A.zero)],add=(a,b)=>a.map((x,i)=>A.add(x,b[i])),neg=a=>a.map(A.neg),sub=(a,b)=>add(a,neg(b)),scale=(a,s)=>a.map(x=>A.mul(x,Array.isArray(s)?s:A.point(s)));
  const mul=(a,b)=>Array.from({length:order+1},(_,m)=>{let v=A.zero();for(let k=0;k<=m;k++)v=A.add(v,A.mul(a[k],b[m-k]));return v;});
  const inv=a=>{const b=[A.div(A.one(),a[0])];for(let m=1;m<=order;m++){let v=A.zero();for(let k=1;k<=m;k++)v=A.add(v,A.mul(a[k],b[m-k]));b.push(A.neg(A.div(v,a[0])));}return b;};
  return {c,add,neg,sub,scale,mul,inv,div:(a,b)=>mul(a,inv(b))};
}
