import {ComputeError,makeBudget} from '../numerics.mjs';

/** Exact upper-bound certificates for the actual Appendix-B coefficient space.
 * All arithmetic deciding a certificate is rational/BigInt. Plot coordinates are
 * explicitly approximate. This does not identify the datum with the completed
 * outgoing schedule, and does not identify an existing finite eta jet with the
 * fixed point. No caller-supplied norm, tail or theorem-truth flag is accepted.
 */
export const axisCertificateSources = Object.freeze({
  repositoryCommit:'f9e8bc5b38b6e212696e8a30e3e91517af887bbd',
  paper:{sha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',pages:[144,145,146,147,148,157],equations:['B.1','B.2','B.4','B.5','B.9','B.10','B.11','B.12','B.14','B.15','B.16','B.40']},
  originalTheorems:[
    {file:'AxisOperators.lean',names:['norm_product_le','norm_average_le','norm_primitive_le','norm_regularInverse_le','norm_parameterPrimitive_le','norm_mulY_le','norm_inverseMixed_le','norm_inverseParamProduct_le','norm_inverseDotProduct_le']},
    {file:'AxisResolvent.lean',names:['naturalOperator_pow_bound','naturalResolvent_norm_le']},
    {file:'AxisContraction.lean',names:['exists_fixedPoint_of_controlled','norm_naturalRemainder_le','naturalRemainder_sub_le','exists_unique_natural_fixedPoint']},
    {file:'AnalyticCoefficientBounds.lean',names:['cauchy_bound_le_weight','normalizedExp_unitHolomorphic']},
    {file:'NaturalAxisData.lean',names:['exists_root_with_positive_Z','low_Z_has_H_margin','exists_sigma']},
    {file:'NaturalAxisBridge.lean',names:['exists_scaled_profiles']}
  ].map(x=>({...x,url:`https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/${x.file}`}))
});

const abs=n=>n<0n?-n:n;
function gcd(a,b){a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t;}return a||1n;}
function Q(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw new ComputeError('INVALID_INPUT','Zero rational denominator');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
const add=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d);
const neg=a=>Q(-a.n,a.d);
const sub=(a,b)=>add(a,neg(b));
const mul=(a,b)=>Q(a.n*b.n,a.d*b.d);
const div=(a,b)=>Q(a.n*b.d,a.d*b.n);
const pow=(a,n)=>Q(a.n**BigInt(n),a.d**BigInt(n));
const cmp=(a,b)=>a.n*b.d<b.n*a.d?-1:a.n*b.d>b.n*a.d?1:0;
const min=(a,b)=>cmp(a,b)<=0?a:b;
const max=(a,b)=>cmp(a,b)>=0?a:b;
const mag=a=>Q(abs(a.n),a.d);
const z=Q(0),one=Q(1),two=Q(2);
const ceil=a=>a.n>=0n?(a.n+a.d-1n)/a.d:a.n/a.d;
const qs=a=>a.d===1n?String(a.n):`${a.n}/${a.d}`;
const qi=a=>({numerator:String(a.n),denominator:String(a.d),exact:qs(a)});
function asNumber(a){if(!a.n)return 0;const n=abs(a.n).toString(),d=a.d.toString(),kn=Math.min(16,n.length),kd=Math.min(16,d.length);return (a.n<0n?-1:1)*(Number(n.slice(0,kn))/Number(d.slice(0,kd)))*10**(n.length-kn-d.length+kd);}
function log10q(a){if(a.n<=0n)return null;const f=n=>{const s=n.toString(),k=Math.min(15,s.length);return s.length-k+Math.log10(Number(s.slice(0,k)));};return f(a.n)-f(a.d);}
const nonnegative=a=>a.n>=0n;
const positive=a=>a.n>0n;
function parse(v,name){
  if(typeof v==='number'){if(!Number.isSafeInteger(v))throw new ComputeError('INVALID_INPUT',`${name}: exact constants must be safe integers or rational strings`);return Q(BigInt(v));}
  if(typeof v!=='string'||v.length>600||!/^[-+]?(?:\d+(?:\.\d+)?|\d+\/\d+)$/.test(v))throw new ComputeError('INVALID_INPUT',`${name}: use an exact rational or decimal string`);
  if(v.includes('/')){const [a,b]=v.split('/');return Q(BigInt(a),BigInt(b));}
  if(v.includes('.')){let [a,b]=v.split('.');const sign=a.startsWith('-')?-1n:1n;return Q(BigInt(a)*10n**BigInt(b.length)+sign*BigInt(b),10n**BigInt(b.length));}
  return Q(BigInt(v));
}
function integer(v,name,lo,hi){if(!Number.isSafeInteger(v)||v<lo||v>hi)throw new ComputeError('INVALID_INPUT',`${name} must be an integer in [${lo},${hi}]`);return v;}
function object(v,name){if(!v||typeof v!=='object'||Array.isArray(v)||Object.getPrototypeOf(v)!==Object.prototype)throw new ComputeError('INVALID_INPUT',`${name} must be a plain JSON object`);}
function keys(v,allowed,name){for(const k of Object.keys(v))if(!allowed.includes(k))throw new ComputeError('INVALID_INPUT',`${name}: unsupported field ${k}; unverified norm/tail claims are not accepted`);}
function normalize(input){
  object(input,'input');
  keys(input,['pressure','h','j0','sigmaMode','lambdaMode','lambdaMultiplier','coefficientRadiusRatio','tailDegree','radialDerivativeOrder','etaDerivativeOrder','sampleEta','sampleCount','maxY','boundBits'],'input');
  const pressure=input.pressure??{family:'rational',K:'10'};object(pressure,'pressure');keys(pressure,['family','K'],'pressure');
  if(pressure.family!=='rational')throw new ComputeError('UNSUPPORTED_PRESSURE_DATUM','Only the exact datum P(eta)=-K/(1+eta^2)^2 has an implemented analytic proof contract; a completed outgoing pressure datum needs its own verified producer.');
  const K=parse(pressure.K??'10','pressure.K'),h=parse(input.h??'1/200','h'),j=parse(input.j0??'3/100','j0');
  if(cmp(K,Q(4))<0||cmp(K,Q(1000000))>0||!positive(h)||cmp(h,Q(1,100))>0||!positive(j)||cmp(j,Q(1,20))>0)throw new ComputeError('INVALID_INPUT','Require 4<=K<=1000000, 0<h<=1/100, 0<j0<=1/20');
  if((input.sigmaMode??'computed-cutoff')!=='computed-cutoff'||(input.lambdaMode??'computed-threshold')!=='computed-threshold')throw new ComputeError('INVALID_INPUT','sigma and Lambda are selected from proved bounds, not caller-supplied thresholds');
  const ratio=parse(input.coefficientRadiusRatio??'1/16','coefficientRadiusRatio'),eta=parse(input.sampleEta??'1/5','sampleEta'),Y=parse(input.maxY??'41/10','maxY');
  if(!positive(ratio)||cmp(ratio,Q(1,2))>0||cmp(mag(eta),one)>0||!positive(Y)||cmp(Y,Q(41,10))>0)throw new ComputeError('INVALID_INPUT','Require 0<coefficientRadiusRatio<=1/2, |sampleEta|<=1, 0<maxY<=41/10');
  const N=integer(input.tailDegree??24,'tailDegree',2,128),kr=integer(input.radialDerivativeOrder??2,'radialDerivativeOrder',0,4),ke=integer(input.etaDerivativeOrder??2,'etaDerivativeOrder',0,4);
  if(N<kr)throw new ComputeError('INVALID_INPUT','tailDegree must be at least radialDerivativeOrder');
  return {K,h,j,ratio,eta,Y,N,kr,ke,multiplier:integer(input.lambdaMultiplier??2,'lambdaMultiplier',1,1024),samples:integer(input.sampleCount??17,'sampleCount',3,65),bits:integer(input.boundBits??128,'boundBits',64,512)};
}
export function validateAxisInput(input={}){try{const a=normalize(input);return {valid:true,pressureFamily:'rational',exactInput:{K:qs(a.K),h:qs(a.h),j0:qs(a.j)},finiteLimits:{tailDegree:128,derivativeOrder:4,samples:65}};}catch(e){return {valid:false,status:e.code??'INVALID_INPUT',message:e.message,detail:e.detail??{}};}}

const box=a=>[a,a];
const iadd=(a,b)=>[add(a[0],b[0]),add(a[1],b[1])];
const ineg=a=>[neg(a[1]),neg(a[0])];
const isub=(a,b)=>iadd(a,ineg(b));
function imul(a,b){const v=[mul(a[0],b[0]),mul(a[0],b[1]),mul(a[1],b[0]),mul(a[1],b[1])];return [v.reduce(min),v.reduce(max)];}
function isq(a){if(a[0].n<=0n&&a[1].n>=0n)return [z,max(pow(a[0],2),pow(a[1],2))];return [min(pow(a[0],2),pow(a[1],2)),max(pow(a[0],2),pow(a[1],2))];}
function idiv(a,b){if(b[0].n<=0n&&b[1].n>=0n)throw new ComputeError('PRECISION_REQUIRED','Rational interval divisor includes zero');return imul(a,[div(one,b[1]),div(one,b[0])]);}
const iscale=(a,k)=>imul(a,box(k));
const ibox=a=>({lower:qs(a[0]),upper:qs(a[1])});
const absLower=a=>a[0].n>0n?a[0]:a[1].n<0n?neg(a[1]):z;
function realData(a,e){
  const D=sub(Q(1,2),a.h),A=add(Q(1,2),a.h),d=isub(box(one),isq(e)),U=iadd(iscale(e,Q(4)),box(a.j)),H=iadd(iscale(e,D),imul(d,U));
  const den=iadd(box(one),isq(e)),P=ineg(idiv(box(a.K),isq(den))),Pd=idiv(iscale(e,mul(Q(4),a.K)),imul(isq(den),den));
  const Z=iadd(isub(isub(iscale(imul(isub(box(one),iscale(imul(e,U),two)),U),neg(A)),iscale(H,Q(4))),imul(d,Pd)),iscale(imul(e,P),mul(Q(4),A)));
  return {H,Z,P,Pd};
}
function cutoffCertificate(a,budget){
  const delta=div(a.j,Q(10)),queue=[[neg(one),one]],leaves=[];let margin=null;
  while(queue.length){
    budget.tick(100);if(queue.length+leaves.length>budget.maxPoints)throw new ComputeError('RESOURCE_LIMIT','All-eta interval cover exceeds maxPoints');
    const e=queue.pop(),v=realData(a,e),excluded=cmp(absLower(v.Z),delta)>0,Hsq=isq(v.H);
    if(excluded||positive(Hsq[0])){leaves.push({eta:ibox(e),Z:ibox(v.Z),H2:ibox(Hsq),reason:excluded?'abs(Z)>delta':'H2>=positive-margin'});if(!excluded)margin=margin===null?Hsq[0]:min(margin,Hsq[0]);}
    else {const mid=div(add(e[0],e[1]),two);if(cmp(sub(e[1],e[0]),Q(1,1n<<80n))<0)throw new ComputeError('PRECISION_REQUIRED','Root/low-Z separation requires a finer validated cover');queue.push([mid,e[1]],[e[0],mid]);}
  }
  if(margin===null)margin=one;
  const sigma=div(min(one,margin),Q(20));
  if(cmp(pow(sigma,2),div(margin,Q(400)))>0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Cutoff inequality failed');
  return {sigma,delta,margin,record:{domain:['-1','1'],delta:qs(delta),positiveH2Margin:qs(margin),sigma:qs(sigma),sigmaSquared:qs(pow(sigma,2)),chiLowerOnLowZ:'400/401',chiLowerGreaterThan:'99/100',cells:leaves,coveredWholeInterval:true,method:'Exact rational interval subdivision covers every eta; each cell either excludes |Z|<=delta or proves H^2>=m. sigma=min(1,m)/20.'}};
}
function complexBounds(a,sigma,r){
  const W=Q(11,10),t=mul(two,r),Z=add(W,t),D=sub(Q(1,2),a.h),A=add(Q(1,2),a.h);
  const Hreal=add(add(mul(Q(4),pow(W,3)),mul(a.j,pow(W,2))),add(mul(sub(Q(9,2),a.h),W),a.j));
  const Hd=mul(t,add(add(mul(Q(4),add(add(mul(Q(3),pow(W,2)),mul(Q(3),mul(W,t))),pow(t,2))),mul(a.j,add(mul(two,W),t))),sub(Q(9,2),a.h)));
  const Hup=add(Hreal,Hd),qdev=mul(Hd,add(mul(two,Hreal),Hd)),s2=pow(sigma,2),qlo=sub(s2,qdev);
  const fdev=mul(t,add(mul(two,W),t)),flo=sub(one,fdev),Llo=sub(sub(one,mul(mul(two,a.h),pow(W,2))),mul(mul(two,a.h),fdev));
  if(!positive(qlo)||!positive(flo)||!positive(Llo)||cmp(qdev,div(s2,Q(4)))>0)return null;
  const Lup=add(one,mul(mul(two,a.h),pow(Z,2))),d=add(one,pow(Z,2)),U=add(mul(Q(4),Z),a.j),P=div(a.K,pow(flo,2)),Pd=div(mul(mul(Q(4),a.K),Z),pow(flo,3));
  const w=add(add(one,mul(Q(4),d)),mul(mul(mul(two,D),Z),U));
  const gradient=div(mul(Lup,Hup),qlo),chi=min(div(pow(Hup,2),qlo),add(one,div(qdev,qlo)));
  const zstar=add(add(mul(mul(A,add(one,mul(mul(two,Z),U))),U),mul(Q(4),Hup)),add(mul(d,Pd),mul(mul(mul(Q(4),A),Z),P)));
  const fields={one,eta:Z,d,inverseL:div(one,Llo),uStar:U,uStarEta:Q(4),wStar:w,hStar:Hup,normalizedGradient:gradient,zStar:zstar};
  return {fields,chi,zOverL:div(zstar,Llo),phase:ceil(mul(Z,gradient)),qdev,qlo,s2,Llo,flo,Hd,Z,outerRadius:t};
}
function tubeCertificate(a,sigma,budget){
  let r=Q(1,64),bounds=null;for(let i=0;i<256;i++){budget.tick(50);bounds=complexBounds(a,sigma,r);if(bounds)break;r=div(r,two);}
  if(!bounds)throw new ComputeError('PRECISION_REQUIRED','Cannot enclose a nonvanishing common complex tube within the supported radius budget');
  const epsilon=mul(r,a.ratio),loss=div(add(one,a.ratio),pow(sub(one,a.ratio),3));
  const norms=Object.fromEntries(Object.entries(bounds.fields).map(([k,v])=>[k,ceil(mul(v,loss))]));
  return {r,epsilon,loss,norms,chiNorm:ceil(mul(bounds.chi,loss)),bounds,
    record:{realCoefficientWindow:['-11/10','11/10'],complexDomain:'convex open tube about the real coefficient window; all radius-r Cauchy circles lie in its compact interior',outerTubeRadius:qs(bounds.outerRadius),cauchyRadius:qs(r),coefficientRadius:qs(epsilon),radiusRatio:qs(a.ratio),radiusLoss:qs(loss),radiusLossIdentity:'sum_(m>=0) (m+1)^2 q^m=(1+q)/(1-q)^3',denominatorLowerBounds:{'1+z^2':qs(bounds.flo),'L(z)':qs(bounds.Llo),'H(z)^2+sigma^2':qs(bounds.qlo)},denominatorPerturbation:qs(bounds.qdev),sigmaSquared:qs(bounds.s2),complexSuprema:Object.fromEntries(Object.entries(bounds.fields).map(([k,v])=>[k,qs(v)])),coefficientNormUpper:Object.fromEntries(Object.entries(norms).map(([k,v])=>[k,String(v)])),chiComplexSupremum:qs(bounds.chi),chiNormUpper:String(ceil(mul(bounds.chi,loss))),phaseRealPartUpper:String(bounds.phase),allEtaDerivativeOrders:true,jetConvention:'weight uses actual eta derivatives; Cauchy estimates include m!, not just Taylor coefficients'}};
}

function sqrtCeil(n){if(n<0n)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Negative square root');if(n<2n)return n;let x=1n<<BigInt(Math.ceil(n.toString(2).length/2));for(;;){const y=(x+n/x)/2n;if(y>=x)return x*x===n?x:x+1n;x=y;}}
const divUp=(n,d)=>(n+d-1n)/d;
function positiveSeries(K,bits,weighted,budget){
  const cut=Number(2n*sqrtCeil(ceil(K))+32n);if(!Number.isSafeInteger(cut)||cut>10000)throw new ComputeError('RESOURCE_LIMIT','Factorial majorant cutoff exceeds 10000');
  const scale=1n<<BigInt(bits);let lo=scale,hi=scale,slo=0n,shi=0n;
  for(let n=0;n<=cut;n++){
    budget.tick(20);const w=weighted?BigInt((n+1)**2):1n;slo+=lo*w;shi+=hi*w;
    const den=K.d*BigInt((n+1)*(n+2));lo=lo*K.n/den;hi=divUp(hi*K.n,den);
  }
  const weightNext=weighted?BigInt((cut+2)**2):1n,nextUpper=hi*weightNext;
  const ratio=weighted?div(mul(K,Q(cut+3)),Q(BigInt(cut+2)**3n)):div(K,Q((cut+2)*(cut+3)));
  if(cmp(ratio,one)>=0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Factorial tail ratio does not contract');
  const tail=divUp(nextUpper*ratio.d,ratio.d-ratio.n),upper=shi+tail,B=divUp(upper,scale);
  return {bound:B,record:{K:qs(K),weightedBy:weighted?'(n+1)^2':'1',termsThrough:cut,scaleBits:bits,scale:String(scale),partialSumLowerScaled:String(slo),partialSumUpperScaled:String(shi),nextTermUpperScaled:String(nextUpper),tailRatioUpper:qs(ratio),tailUpperScaled:String(tail),totalUpperScaled:String(upper),integerUpper:String(B),method:'Every positive recurrence step is rounded down/up with exact integer division; the omitted infinite tail is bounded by next/(1-q).'}};
}
function controlled(a,tube,S,center,budget){
  const ce=q=>ceil(q),R=center+1n,nn=tube.norms,e=tube.epsilon;
  const O={product:64n,average:1n,primitive:80n,parameterPrimitive:ce(div(Q(80),e)),mulY:80n,j1:80n,j2:80n,param1:ce(div(Q(5120),e)),param2:ce(div(Q(5120),e)),dot1:5120n,dot2:5120n,mixed1:ce(div(Q(5120),e)),mixed2:ce(div(Q(5120),e))};
  const C=b=>({b,l:0n}),sum=(x,y)=>({b:x.b+y.b,l:x.l+y.l}),lin=(op,x)=>({b:op*x.b,l:op*x.l}),bil=(op,x,y)=>({b:op*x.b*y.b,l:op*(x.l*y.b+x.b*y.l)}),m=(x,y)=>bil(O.product,x,y),sc=(q,x)=>lin(ce(mag(q)),x);
  // Positive upper fields reproduce Controlled.add/sub, linear, bilinear, pair.
  const d=Object.fromEntries(Object.entries(nn).map(([k,v])=>[k,C(v)])),phi={b:R,l:1n},u={b:R,l:1n},bu=lin(O.average,u),A=add(Q(1,2),a.h),D=sub(Q(1,2),a.h);
  const angLinear=sum(sum(d.wStar,sc(a.h,d.one)),sc(mul(two,a.h),m(d.eta,d.uStar))),angQuad=m(d.d,d.normalizedGradient),avg=sc(mul(two,D),d.eta),slow=sc(mul(two,a.h),d.eta),axLinear=sum(sum(sc(A,d.one),sc(mul(Q(4),A),m(d.eta,d.uStar))),m(d.d,d.uStarEta)),axQuad=sc(mul(two,A),d.eta);
  const lin1=sum(sum(lin(O.j2,m(angLinear,phi)),bil(O.dot2,d.wStar,phi)),bil(O.param2,phi,d.hStar));
  const quad1=lin(O.j2,m(m(angQuad,u),phi));
  const slow1=sum(sum(sum(sum(lin(O.j2,m(sum(m(avg,bu),m(slow,u)),phi)),bil(O.param2,bu,m(d.d,phi))),bil(O.dot2,m(avg,bu),phi)),m(d.d,bil(O.mixed2,bu,phi))),bil(O.param2,phi,m(d.d,u)));
  const lin2=sum(sum(lin(O.j1,m(axLinear,u)),bil(O.dot1,d.wStar,u)),bil(O.param1,u,d.hStar));
  const slow2=sum(sum(sum(lin(O.j1,m(axQuad,m(u,u))),bil(O.dot1,m(avg,bu),u)),m(d.d,bil(O.mixed1,bu,u))),bil(O.param1,u,m(d.d,u)));
  const amp=C(ceil(tube.loss)),source=m(m(amp,amp),m(phi,phi));
  const pressure=lin(O.j1,sum(sum(m(sc(mul(Q(4),A),d.eta),lin(O.primitive,source)),m(d.d,lin(O.parameterPrimitive,source))),m(sc(two,d.eta),lin(O.mulY,source))));
  const first=lin(S,m(d.inverseL,sum(sum(lin1,quad1),slow1))),second=m(d.inverseL,sum(sum(lin2,slow2),pressure)),out=sum(first,second);
  budget.tick(500);if(out.b.toString().length>10000||out.l.toString().length>10000)throw new ComputeError('PRECISION_REQUIRED','Bound certificate exceeds the supported digit budget');
  return {B:out.b,L:out.l,R,record:{ballRadius:'1',centerNormUpper:String(center),argumentNormUpper:String(R),amplitudeNormUpper:String(ceil(tube.loss)),operatorNormUpper:Object.fromEntries(Object.entries(O).map(([k,v])=>[k,String(v)])),remainderBound:String(out.b),remainderLipschitz:String(out.l),angularComponent:{bound:String(first.b),lip:String(first.l)},axialComponent:{bound:String(second.b),lip:String(second.l)},construction:'Every term of AxisContraction.controlledRemainder is included. Subtraction uses a triangle upper bound; |1/Lambda|<=1. Product norm on the pair is bounded by the sum of component upper bounds.',quantifiers:'All elements x,y in the infinite compatible coefficient space with ||x||,||y||<=argumentNormUpper, and every radially constant normalized amplitude of norm at most amplitudeNormUpper.'}};
}
function factorial(n){let a=1n;for(let i=2;i<=n;i++)a*=BigInt(i);return a;}
function choose(n,k){if(k>n)return 0n;k=Math.min(k,n-k);let a=1n;for(let i=1;i<=k;i++)a=a*BigInt(n-k+i)/BigInt(i);return a;}
function tailBound(M,epsilon,Y,N,k,m){
  if(!positive(Y))return z;
  const n=N+1,q=div(Y,Q(20));
  const coeff=Q(factorial(m)*choose(n+m,m)*factorial(n)/factorial(n-k),BigInt((m+1)**2*(n+1)**2));
  const first=mul(mul(mul(M,div(one,pow(epsilon,m))),coeff),div(pow(q,n),pow(Y,k)));
  const ratio=mul(q,Q(n+1+m,n+1-k));
  if(cmp(ratio,one)>=0)throw new ComputeError('PRECISION_REQUIRED','Tail cutoff is too small for the requested derivative/radius');
  return div(first,sub(one,ratio));
}
function comparisonBox(x,N=32){
  let t=one,s=one;for(let n=1;n<=N;n++){t=div(mul(neg(div(x,two)),t),Q(n*(n+1)));s=add(s,t);}
  const next=mag(div(mul(div(x,two),t),Q((N+1)*(N+2)))),ratio=div(x,Q(2*(N+2)*(N+3))),tail=div(next,sub(one,ratio));return [sub(s,tail),add(s,tail)];
}
function chiAt(a,sigma,eta){const H=realData(a,box(eta)).H[0];return div(pow(H,2),add(pow(H,2),pow(sigma,2)));}

export function certifyAxis(input={},budget=makeBudget()){
  try{
    budget.tick();const a=normalize(input);if(a.samples>budget.maxPoints)throw new ComputeError('RESOURCE_LIMIT','Visualization sample count exceeds maxPoints');
    const cut=cutoffCertificate(a,budget),tube=tubeCertificate(a,cut.sigma,budget);
    const resolvent=positiveSeries(Q(2560n*tube.chiNorm),a.bits,false,budget),phiRef=positiveSeries(mul(Q(10),tube.bounds.chi),a.bits,true,budget);
    const phiNorm=ceil(mul(tube.loss,Q(phiRef.bound))),uNorm=40n*ceil(mul(tube.loss,tube.bounds.zOverL)),center=phiNorm>uNorm?phiNorm:uNorm;
    const b=controlled(a,tube,resolvent.bound,center,budget),threshold=1n+b.B+b.L,positiveThreshold=100n*b.B,base=threshold>positiveThreshold?threshold:positiveThreshold,Lambda=base*BigInt(a.multiplier);
    const lambda=Q(Lambda),normError=Q(b.B,2n*Lambda),lip=Q(b.L,2n*Lambda),logC=Lambda*tube.bounds.phase+1n;
    const evaluationFactor=div(one,sub(one,div(Q(41,10),Q(20)))),uniformError=mul(normError,evaluationFactor),positiveLower=sub(Q(305719,1152000),uniformError);
    if(cmp(lip,Q(1,2))>0||cmp(normError,one)>0||cmp(positiveLower,Q(1,4))<=0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Derived finite scalar gate did not pass');
    const totalNorm=add(Q(center),normError),tails=[],points=[],lowerLine=[],upperLine=[],chi=chiAt(a,cut.sigma,a.eta);
    for(let i=0;i<a.samples;i++){
      budget.tick(200);const Y=mul(a.Y,Q(i,a.samples-1)),tail=tailBound(totalNorm,tube.epsilon,Y,a.N,0,0),mixed=tailBound(totalNorm,tube.epsilon,Y,a.N,a.kr,a.ke),comp=comparisonBox(mul(Y,chi)),err=div(normError,sub(one,div(Y,Q(20)))),enclosure=[sub(comp[0],err),add(comp[1],err)],yc=asNumber(Y),lo=asNumber(enclosure[0]),hi=asNumber(enclosure[1]),mid=(lo+hi)/2;
      tails.push({Y:qs(Y),X:qs(div(Y,lambda)),truncationDegree:a.N,phiTailUpper:qs(tail),mixedDerivative:{radial:a.kr,eta:a.ke,upper:qs(mixed)},normalizedProfileEnclosure:ibox(enclosure),comparisonEnclosure:ibox(comp),nonlinearDeviationUpper:qs(err)});
      points.push({pos:[yc,mid,Math.max(-320,log10q(tail)??-320)],value:mid,valueInterval:{lower:lo,upper:hi},label:`Y=${yc.toPrecision(4)}; Phi in [${lo.toPrecision(7)}, ${hi.toPrecision(7)}]; log10 tail bound`});lowerLine.push([yc,lo,0]);upperLine.push([yc,hi,0]);
    }
    const record={
      schema:'MathScope.Navier.AxisBoundCertificate/1',status:'VERIFIED_LOCAL_BOUND_CERTIFICATE',evidenceGrade:'EXACT_BOUND_CERTIFICATE_WITH_THEOREM_REFERENCE',certificateScope:'unique nonlinear Appendix-B axis fixed point for the explicitly defined rational pressure datum',
      inputModel:{pressure:{family:'rational',K:qs(a.K),formula:'P(eta)=-K/(1+eta^2)^2',completedOutgoingPressure:false},h:qs(a.h),j0:qs(a.j),sampleEta:qs(a.eta),UStar:'4*eta+j0',phiStar:'exp(Lambda*integral_0^eta zetaStar)',normalizedAmplitude:'g=exp(Lambda*phase-logC)',source:'Explicit analytic datum satisfying the pressure sign/smoothness hypotheses; equality with the original outer schedule is neither assumed nor established.'},
      selectedParameters:{h:qs(a.h),j0:qs(a.j),sigmaStar:qs(cut.sigma),deltaStar:qs(cut.delta),Lambda:String(Lambda),lambdaMode:'computed-threshold',lambdaMultiplier:a.multiplier,logC:String(logC),C:{kind:'EXACT_POSITIVE_EXPONENTIAL',log: String(logC)},X0:qs(div(Q(4),lambda)),XMax:qs(div(Q(41,10),lambda)),coefficientRadius:qs(tube.epsilon)},
      cutoff:cut.record,complexInput:tube.record,resolvent:resolvent.record,
      reference:{phi0:'f0(Y*chi)',u0:'-Y*ZStar/(2*L)',phiNormUpper:String(phiNorm),uNormUpper:String(uNorm),phiSeriesNormMajorant:phiRef.record,phiNormProof:'Cauchy on chi(z)^n plus the exact B_rho weight; division by binom(n+m,m)>=1 and summation of all positive radial majorants bounds the supremum.',comparisonWholeInterval:{domain:['0','41/10'],lower:'305719/1152000',cubicLower:'1-z/4+z^2/48-z^3/1152',proof:'The alternating remainder after the cubic is nonnegative. The cubic decreases on the whole interval, so its exact endpoint value bounds every z. This bound is not inferred from sampled values.',derivativeUpper:'-19/240',derivativeProof:'The derivative alternating terms decrease because their first magnitude ratio z/6<=41/60<1. Thus f0prime(z)<=-1/4+z/24<=-19/240<0; consequently f0(z)>=f0(41/10).'}},
      controlled:b.record,
      bounds:{contractionThreshold:String(threshold),positivityThreshold:String(positiveThreshold),selfMapDisplacementUpper:qi(normError),contractionLipschitzUpper:qi(lip),uniformPhiError:qi(uniformError),uniformPhiPositiveLower:qi(positiveLower),complexAmplitudeNormUpper:String(ceil(tube.loss)),phaseRealPartUpper:String(tube.bounds.phase),normalizationMargin:'1',allRadialCoefficients:true,allEtaDerivativeOrders:true,fullRealAxisRectangle:{Y:['0','41/10'],eta:['-1','1']},commonAnalyticEtaRadiusLower:qs(div(mul(tube.epsilon,sub(one,div(Q(5),Q(20)))),two))},
      tails:{solutionNormUpper:qs(totalNorm),degree:a.N,rows:tails,meaning:'These are bounds for the tail of the theorem-defined unique infinite coefficient sequence. They do not certify the rounding error or identity of a separately computed finite eta jet.',formula:'M*m!*rho^(-m)/(m+1)^2 * sum_(n>N) binom(n+m,m)*n!/(n-k)! * Y^(n-k)/(20^n*(n+1)^2)',geometricRatioUpper:'For n>=N+1: (Y/20)*(N+2+m)/(N+2-k); the omitted square factor is <=1.'},
      gates:{exactRationalArithmetic:true,pressureAnalyticContract:true,wholeEtaCutoffCover:true,complexDenominatorsSeparated:true,normalizedComplexAmplitude:true,invariantBall:true,lipschitzBelowOne:true,uniformPositivePhi:true,infiniteCoefficientTail:true,existingFiniteJetLinked:false,completedOuterPressureLinked:false,fullOriginalParameterOrder:false,globalWitness:false,fullProfileCertified:false,fullCertificateKernelChecked:false},
      proofBoundary:{grade:'THEOREM_REFERENCE plus exact executable bound certificates',formalPass:false,originalTheorems:'Exact exported statements are listed in sources; a static or separately audited import is not a kernel proof of every generated numerical/analytic premise.',conditionalOn:['The published original coefficient-space/operator/bridge theorems applied to the specified mathematical functions.','Correspondence of this bound propagation and analytic-input producer with those definitions; the full generated analytic premise bundle has not been exported as a Lean proof.'],notInferred:['Equality of the rational pressure with the completed original outer profile','Identity or tail error of the existing IEEE754 eta-jet arrays','B.3 endpoint shear margin, B.5 continuation, A.7/A.8/A.11 moment completion','N3 overall PASS or a global Navier-Stokes solution']},
      limitations:['The automatic bounds are conservative; selected Lambda and logC may be enormous. C is represented by its exact logarithm, not an overflowed float.','A numerical evaluator that underflows exp(Lambda*phase-logC) to zero does not preserve the strict positivity certificate.','Only the declared rational analytic pressure family has a checked input producer. Caller-supplied norm/tail/pressure-truth claims are rejected.'],
      visualization:{points,lines:[{points:lowerLine},{points:upperLine}],arrows:[],axes:['Y=Lambda X','normalized Phi enclosure center','log10 absolute radial-tail upper bound'],description:'Exact bound certificate for the unique local analytic profile; approximate plot of interval centers and tail bounds.',coordinateMeaning:'The first axis is the scaled radius Y; X=Y/Lambda is retained exactly in each row. The second axis is a certified enclosure center, not the old finite eta-jet value. The third is a nonphysical log bound; zero tails at Y=0 are displayed at -320.',lostInformation:['Full coefficient functions and phase variation across all eta are not rendered.','The completed outgoing pressure, global witness and physical velocity amplitude are not represented.','Plot floating-point coordinates do not replace the exact rational certificate fields.']},sources:axisCertificateSources,execution:budget.snapshot()
    };
    return record;
  }catch(e){return {schema:'MathScope.Navier.AxisBoundCertificate/1',status:e.code??'COMPUTATION_ERROR',message:e.message,detail:e.detail??{},evidenceGrade:'NO_CERTIFICATE',gates:{globalWitness:false,fullProfileCertified:false,fullCertificateKernelChecked:false},execution:budget.snapshot?.()??null};}
}

export function axisExampleInput(){return {pressure:{family:'rational',K:'10'},h:'1/200',j0:'3/100',sigmaMode:'computed-cutoff',lambdaMode:'computed-threshold',lambdaMultiplier:2,tailDegree:24,sampleEta:'1/5',sampleCount:17};}
export function getAxisExamples(){return [
  {id:'ns-axis-exact-bounds',label:'실제 Bρ 국소 수렴·양성·tail 상계',request:{kind:'ns.axis-certificate',input:axisExampleInput()}},
  {id:'ns-axis-untrusted-pressure',label:'미검증 pressure/norm 입력 거부',request:{kind:'ns.axis-certificate',input:{pressure:{family:'external',K:'10'}}}}
];}
