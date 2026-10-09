/** Exact directed dyadic interval arithmetic. No floating-point decision is used. */
export function createDyadic(bits = 512, tick = () => {}) {
  if (!Number.isSafeInteger(bits) || bits < 128 || bits > 2048) throw new Error('bits must be 128..2048');
  const scale = 1n << BigInt(bits);
  const floor = (n, d) => { if (d < 0n) { n = -n; d = -d; } const q = n / d; return n < 0n && n % d !== 0n ? q - 1n : q; };
  const ceil = (n, d) => -floor(-n, d);
  const rat = v => {
    if (typeof v === 'bigint') return [v, 1n];
    if (typeof v === 'number') { if (!Number.isSafeInteger(v)) throw new Error('Use an exact rational string'); return [BigInt(v), 1n]; }
    if (typeof v !== 'string' || v.length > 20000 || !/^-?\d+(?:\/\d+)?$/.test(v)) throw new Error('Invalid exact rational');
    const [n, d = '1'] = v.split('/'); if (BigInt(d) === 0n) throw new Error('Zero denominator'); return [BigInt(n), BigInt(d)];
  };
  const q = v => { const [n,d] = rat(v); return [floor(n*scale,d),ceil(n*scale,d)]; };
  const zero = [0n,0n], one = [scale,scale];
  const add = (a,b) => { tick(); return [a[0]+b[0],a[1]+b[1]]; };
  const neg = a => [-a[1],-a[0]];
  const sub = (a,b) => add(a,neg(b));
  const mul = (a,b) => { tick(); const c=[a[0]*b[0],a[0]*b[1],a[1]*b[0],a[1]*b[1]]; return [floor(c.reduce((x,y)=>x<y?x:y),scale),ceil(c.reduce((x,y)=>x>y?x:y),scale)]; };
  const div = (a,b) => { tick(); if(b[0]<=0n&&b[1]>=0n) throw new Error('Interval contains a zero denominator'); const c=[]; for(const x of a)for(const y of b)c.push([floor(x*scale,y),ceil(x*scale,y)]); return [c.reduce((x,y)=>x<y[0]?x:y[0],c[0][0]),c.reduce((x,y)=>x>y[1]?x:y[1],c[0][1])]; };
  const inv = a => div(one,a);
  const scaleBy = (a,v) => mul(a,q(v));
  const hull = (a,b) => [a[0]<b[0]?a[0]:b[0],a[1]>b[1]?a[1]:b[1]];
  const mag = a => (a[0]<0n?-a[0]:a[0])>(a[1]<0n?-a[1]:a[1])?(a[0]<0n?-a[0]:a[0]):(a[1]<0n?-a[1]:a[1]);
  const symmetric = a => {const m=mag(a);return [-m,m];};
  const pow = (a,n) => { let out=one; for(let i=0;i<n;i++)out=mul(out,a); return out; };
  const pack = a => ({lo:String(a[0]),hi:String(a[1]),binaryScale:bits});
  const fromPack = a => {if(a.binaryScale!==bits)throw new Error('Different dyadic scale');return [BigInt(a.lo),BigInt(a.hi)];};
  const approx = n => { if(!n)return 0;const sign=n<0n?-1:1,s=(n<0n?-n:n).toString(2),keep=s.slice(0,53);return sign*parseInt(keep,2)*2**(s.length-keep.length-bits); };
  const display = a => ({lower:approx(a[0]),upper:approx(a[1])});
  return {bits,scale,floor,ceil,rat,q,zero,one,add,neg,sub,mul,div,inv,scaleBy,hull,symmetric,pow,mag,pack,fromPack,display};
}

export function createIntervalJets(D,degree) {
  const C=v=>[D.q(v),...Array.from({length:degree},()=>D.zero)];
  const add=(a,b)=>a.map((x,i)=>D.add(x,b[i]??D.zero));
  const neg=a=>a.map(D.neg);
  const sub=(a,b)=>add(a,neg(b));
  const scale=(a,s)=>a.map(x=>D.mul(x,s));
  const mul=(a,b)=>a.map((_,n)=>{let s=D.zero;for(let k=0;k<=n;k++)s=D.add(s,D.mul(a[k],b[n-k]));return s;});
  const inv=a=>{const r=[D.inv(a[0])];for(let n=1;n<=degree;n++){let s=D.zero;for(let k=1;k<=n;k++)s=D.add(s,D.mul(a[k],r[n-k]));r.push(D.neg(D.div(s,a[0])));}return r;};
  const div=(a,b)=>mul(a,inv(b));
  const deriv=a=>[...a.slice(1).map((x,i)=>D.scaleBy(x,i+1)),D.zero];
  return {C,add,neg,sub,scale,mul,inv,div,deriv};
}
