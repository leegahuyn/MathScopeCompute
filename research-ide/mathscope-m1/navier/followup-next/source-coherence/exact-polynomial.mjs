/** Sparse Q[Y,eta] arithmetic; coefficient tests are exact, not point sampling. */
const abs=x=>x<0n?-x:x;
const gcd=(a,b)=>{a=abs(a);b=abs(b);while(b)[a,b]=[b,a%b];return a||1n;};
export const Q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);if(!d)throw new Error('Zero rational denominator');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};};
export const qa=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d);
export const qm=(a,b)=>Q(a.n*b.n,a.d*b.d);
export const qn=a=>Q(-a.n,a.d);
export const qd=(a,b)=>Q(a.n*b.d,a.d*b.n);
export const qs=a=>a.d===1n?String(a.n):`${a.n}/${a.d}`;
export function parseQ(s){const [n,d='1']=String(s).split('/');return Q(n,d);}
export function binary64Exact(x){
  if(typeof x!=='number'||!Number.isFinite(x))throw new Error('A finite IEEE754 value is required');
  if(x===0)return Q(0);
  const b=new ArrayBuffer(8),v=new DataView(b);v.setFloat64(0,x,false);const u=v.getBigUint64(0,false),e=Number((u>>52n)&2047n),f=u&((1n<<52n)-1n),sign=u>>63n?-1n:1n;
  const m=e?f+(1n<<52n):f,shift=(e?e-1023:-1022)-52;
  return shift>=0?Q(sign*m*(1n<<BigInt(shift))):Q(sign*m,1n<<BigInt(-shift));
}
const key=(y,e)=>`${y},${e}`;
export const poly=(terms=[])=>{const m=new Map();for(const [y,e,q]of terms){if(q.n)m.set(key(y,e),q);}return m;};
export const constant=q=>poly([[0,0,typeof q==='object'?q:Q(q)]]);
export const monomial=(y,e,q=Q(1))=>poly([[y,e,q]]);
export const pscale=(a,q)=>poly([...a].map(([k,v])=>[...k.split(',').map(Number),qm(v,q)]));
export function padd(a,b){const m=new Map(a);for(const [k,v]of b){const w=qa(m.get(k)??Q(0),v);if(w.n)m.set(k,w);else m.delete(k);}return m;}
export const pneg=a=>pscale(a,Q(-1));
export const psub=(a,b)=>padd(a,pneg(b));
export function pmul(a,b){let m=new Map();for(const [ak,av]of a)for(const [bk,bv]of b){const [y,e]=ak.split(',').map(Number),[z,f]=bk.split(',').map(Number),k=key(y+z,e+f),v=qa(m.get(k)??Q(0),qm(av,bv));if(v.n)m.set(k,v);else m.delete(k);}return m;}
export const ppow=(a,n)=>{let x=constant(1);for(let i=0;i<n;i++)x=pmul(x,a);return x;};
export function pdiff(a,axis){return poly([...a].filter(([k])=>Number(k.split(',')[axis])>0).map(([k,v])=>{const ex=k.split(',').map(Number),n=ex[axis]--;return [...ex,qm(v,Q(n))];}));}
export function pintY(a){return poly([...a].map(([k,v])=>{const [y,e]=k.split(',').map(Number);return [y+1,e,qd(v,Q(y+1))];}));}
export function pdivideY(a){if([...a.keys()].some(k=>k.startsWith('0,')))throw new Error('Polynomial is not divisible by Y');return poly([...a].map(([k,v])=>{const [y,e]=k.split(',').map(Number);return [y-1,e,v];}));}
export function peval(a,y,e){let v=Q(0);for(const[k,q]of a){const[n,m]=k.split(',').map(Number);v=qa(v,qm(q,qm(Q(y.n**BigInt(n),y.d**BigInt(n)),Q(e.n**BigInt(m),e.d**BigInt(m)))));}return v;}
export const ppack=a=>[...a].map(([k,v])=>{const[y,e]=k.split(',').map(Number);return {y,eta:e,value:qs(v)};}).sort((a,b)=>a.y-b.y||a.eta-b.eta);
export const punpack=a=>poly(a.map(x=>[x.y,x.eta,parseQ(x.value)]));
export const prows=rows=>poly(rows.flatMap((r,y)=>r.map((v,e)=>[y,e,binary64Exact(v)])));

/** The original (4.7), (4.15), (4.16), reconstructed using one exact pair F,U. */
export function reconstructCore({F,U,Pi0,h,Lambda}){
  const one=constant(1),Y=monomial(1,0),eta=monomial(0,1),X=pscale(Y,qd(Q(1),Lambda));
  const A=qa(Q(1,2),h),D=qa(Q(1,2),qn(h)),d=psub(one,ppow(eta,2)),L=psub(one,pscale(ppow(eta,2),qm(Q(2),h)));
  const add=(...xs)=>xs.reduce(padd,new Map()),mul=(...xs)=>xs.reduce(pmul,one),k=q=>constant(q),intX=a=>pscale(pintY(a),qd(Q(1),Lambda));
  const M=intX(U),H=pscale(mul(X,F),Q(2)),I=intX(H),J=intX(mul(U,H)),S=intX(psub(ppow(U,2),mul(X,ppow(F,2)))),Cp=intX(ppow(F,2)),Pi=padd(Pi0,Cp);
  const dy=a=>pdiff(a,0),de=a=>pdiff(a,1),dx=a=>pscale(dy(a),Lambda),dot=a=>mul(Y,dy(a));
  const nw=add(X,pscale(mul(eta,M),qm(Q(-2),D)),pneg(mul(d,de(M))));
  const nv=add(pscale(mul(eta,X,U),Q(2)),pscale(mul(eta,M),qm(Q(-2),D)),pneg(mul(d,de(M))));
  const hc=add(pscale(eta,D),mul(d,U));
  const rq=add(pneg(mul(nw,H)),pscale(I,qa(Q(1),qn(h))),pscale(mul(eta,de(I)),qn(D)),pneg(mul(d,de(J))),pscale(mul(eta,J),qm(Q(2),qa(h,qn(D)))));
  const rn=add(pneg(mul(nw,U)),pscale(psub(M,mul(eta,de(M))),D),pscale(mul(eta,S),qm(Q(4),h)),pneg(mul(d,de(S))),mul(X,add(pscale(mul(eta,Pi),qm(Q(4),A)),pneg(mul(d,de(Pi))))));
  const hSq=pscale(add(mul(nw,add(F,dot(F))),mul(X,k(h),psub(one,pscale(mul(eta,U),Q(2))),F),mul(X,hc,de(F))),Q(-2));
  const Sn=add(pneg(mul(nw,dx(U))),pscale(mul(psub(one,pscale(mul(eta,U),Q(2))),U),qn(A)),pneg(mul(hc,de(U))),pneg(mul(d,de(Pi))),pscale(mul(eta,Pi),qm(Q(4),A)),pscale(mul(eta,dot(Pi)),Q(2)));
  const angularStressNumerator=add(rq,pscale(mul(L,X,dot(F)),Q(4)));
  const axialStressNumerator=add(rn,pscale(mul(L,dot(U)),Q(2)));
  const ids={
    pressure:psub(dx(Pi),ppow(F,2)),
    divergence:psub(dx(nv),add(pscale(mul(eta,U),qm(Q(2),A)),pneg(mul(d,de(U))),pscale(mul(eta,dot(U)),Q(2)))),
    angularIntegratedSource:psub(dx(rq),hSq),
    axialIntegratedSource:psub(dx(rn),Sn),
    M:psub(dx(M),U),I:psub(dx(I),H),J:psub(dx(J),mul(U,H)),S:psub(dx(S),psub(ppow(U,2),mul(X,ppow(F,2)))),Cp:psub(dx(Cp),ppow(F,2))
  };
  const radialRegularity=pdivideY(nv);
  return {fields:{F,U,Pi0,Pi,M,I,J,S,Cp,L,H,nw,nv,radialRegularity,rq,rn,hSq,Sn,angularStressNumerator,axialStressNumerator},identities:ids,axisRegularity:{radialNumeratorDivisibleByY:true,pressurePolynomial:true,azimuthalScalarFPolynomial:true},stressFormula:{angular:'Ttheta=(rq+4*L*X*DY(F))/(2*L*X)',axial:'Tz=(rn+2*L*DY(U))/(L*sqrt(2*X))'}};
}
