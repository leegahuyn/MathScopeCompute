/** Exact rational scalar bounds for the actual source A.21 pressure datum.
 * No supplied norm, quadrature value, or theorem-truth flag is accepted.
 * The mathematical target is the unedited ideal schedule, not the numerically
 * repaired field. The full generated analytic premise bundle is not Lean checked.
 */
import {ComputeError,makeBudget} from '../numerics.mjs';
import {outerExampleInput} from './outer.mjs';

const OUTER_SHA='4c0213f892a32611c79655fbe065cebbaca0fc9acdd0cf2dd057d2506a10c087';
const REPO='https://github.com/openai/NavierStokesAndEuler/tree/f9e8bc5b38b6e212696e8a30e3e91517af887bbd';
export const sourcePressureAnalyticSources=Object.freeze({repositoryCommit:'f9e8bc5b38b6e212696e8a30e3e91517af887bbd',
  paperSha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',outerSourceSha256:OUTER_SHA,
  references:[{url:REPO,pages:[129,130],locator:'A.5--A.13: step, source schedule, terminal linear ODE'},
    {url:REPO,pages:[133,134],locator:'Lemma A.5, A.21--A.23: positive mixture, holomorphic pressure, domination'},
    {url:REPO,pages:[144,145,146],locator:'B.1--B.4: axis pressure datum and analytic coefficient norm'}]});

function plain(v,name){if(!v||typeof v!=='object'||Array.isArray(v)||Object.getPrototypeOf(v)!==Object.prototype)throw new ComputeError('INVALID_INPUT',`${name} must be a plain JSON object`);}
function only(v,allowed,name){for(const k of Object.keys(v))if(!allowed.includes(k))throw new ComputeError('INVALID_INPUT',`${name}.${k}: unsupported field; supplied norms, masses and truth flags are not accepted`);}
function integer(v,name,lo,hi){if(!Number.isSafeInteger(v)||v<lo||v>hi)throw new ComputeError('INVALID_INPUT',`${name} must be an integer in [${lo},${hi}]`);return v;}

function rationalArithmetic(budget=null){
  const tick=(n=1)=>budget?.tick(n),abs=n=>n<0n?-n:n;
  function gcd(a,b){a=abs(a);b=abs(b);while(b){tick();const t=a%b;a=b;b=t;}return a||1n;}
  function Q(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw new ComputeError('INVALID_INPUT','Zero rational denominator');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
  const add=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d),neg=a=>Q(-a.n,a.d),sub=(a,b)=>add(a,neg(b)),mul=(a,b)=>Q(a.n*b.n,a.d*b.d),div=(a,b)=>Q(a.n*b.d,a.d*b.n);
  const pow=(a,n)=>{tick(n+1);return Q(a.n**BigInt(n),a.d**BigInt(n));},cmp=(a,b)=>a.n*b.d<b.n*a.d?-1:a.n*b.d>b.n*a.d?1:0;
  const min=(a,b)=>cmp(a,b)<=0?a:b,max=(a,b)=>cmp(a,b)>=0?a:b,mag=a=>Q(abs(a.n),a.d);
  const qs=a=>a.d===1n?String(a.n):`${a.n}/${a.d}`,floor=a=>a.n>=0n?a.n/a.d:-((-a.n+a.d-1n)/a.d),ceil=a=>-floor(neg(a));
  function fromNumber(x){
    if(!Number.isFinite(x))throw new ComputeError('INVALID_INPUT','Finite numeric parameters required');
    if(x===0)return Q(0);const buffer=new ArrayBuffer(8),view=new DataView(buffer);view.setFloat64(0,x,false);const b=view.getBigUint64(0,false),e=Number((b>>52n)&2047n);
    let m=b&((1n<<52n)-1n);if(e)m+=1n<<52n;if(b>>63n)m=-m;const shift=(e?e-1023:1-1023)-52;
    return shift>=0?Q(m<<BigInt(shift)):Q(m,1n<<BigInt(-shift));
  }
  function parse(v,name){
    if(typeof v==='number')return fromNumber(v);
    if(typeof v!=='string'||v.length>180)throw new ComputeError('INVALID_INPUT',`${name}: finite number or exact rational/decimal string required`);
    if(/^[-+]?\d+\/\d+$/.test(v)){const [n,d]=v.split('/');return Q(n,d);}
    const m=/^([-+]?)(\d+)(?:\.(\d+))?(?:[eE]([-+]?\d+))?$/.exec(v);
    if(!m)throw new ComputeError('INVALID_INPUT',`${name}: invalid exact rational/decimal string`);
    const exponent=Number(m[4]??0);if(!Number.isSafeInteger(exponent)||Math.abs(exponent)>400)throw new ComputeError('INVALID_INPUT',`${name}: decimal exponent exceeds 400`);
    const frac=m[3]??'',n=BigInt(`${m[1]}${m[2]}${frac}`),power=exponent-frac.length;
    return power>=0?Q(n*10n**BigInt(power)):Q(n,10n**BigInt(-power));
  }
  const number=a=>{const v=Number(a.n)/Number(a.d);if(Number.isFinite(v))return v;const n=abs(a.n).toString(),d=a.d.toString(),kn=Math.min(16,n.length),kd=Math.min(16,d.length);return (a.n<0n?-1:1)*Number(n.slice(0,kn))/Number(d.slice(0,kd))*10**(n.length-kn-d.length+kd);};
  const interval=a=>[a,a],iadd=(a,b)=>[add(a[0],b[0]),add(a[1],b[1])],ineg=a=>[neg(a[1]),neg(a[0])];
  const isub=(a,b)=>iadd(a,ineg(b));
  function imul(a,b){const v=[mul(a[0],b[0]),mul(a[0],b[1]),mul(a[1],b[0]),mul(a[1],b[1])];return [v.reduce(min),v.reduce(max)];}
  function idiv(a,b){if(b[0].n<=0n&&b[1].n>=0n)throw new ComputeError('INVALID_INPUT','Interval denominator contains zero');return imul(a,[div(Q(1),b[1]),div(Q(1),b[0])]);}
  const isq=a=>a[0].n<=0n&&a[1].n>=0n?[Q(0),max(pow(a[0],2),pow(a[1],2))]:[min(pow(a[0],2),pow(a[1],2)),max(pow(a[0],2),pow(a[1],2))];
  const ibox=a=>({lower:qs(a[0]),upper:qs(a[1])});
  return {Q,add,neg,sub,mul,div,pow,cmp,min,max,mag,qs,floor,ceil,fromNumber,parse,number,interval,iadd,ineg,isub,imul,idiv,isq,ibox,tick};
}

export function sourcePressureAnalyticExampleInput(){return {parameters:outerExampleInput().parameters,boundBits:128,realWindow:'11/10',tubeRadius:'1/64',coefficientRadiusRatio:'1/16'};}
function normalize(input,budget=null){
  plain(input,'input');only(input,['parameters','boundBits','realWindow','tubeRadius','coefficientRadiusRatio'],'input');
  const R=rationalArithmetic(budget),{Q,parse,cmp,div,mul,qs,fromNumber,number,min,max}=R,defaults=sourcePressureAnalyticExampleInput();
  const supplied=Object.hasOwn(input,'parameters')?input.parameters:defaults.parameters;plain(supplied,'parameters');only(supplied,Object.keys(defaults.parameters),'parameters');
  const original={...defaults.parameters,...supplied},p=Object.fromEntries(Object.entries(original).map(([k,v])=>[k,parse(v,`parameters.${k}`)]));
  const numeric=Object.fromEntries(Object.entries(p).map(([k,v])=>[k,typeof original[k]==='number'?original[k]:number(v)]));
  const ranges={Md:['0.2','4'],logP:['0','100'],lambda:['0.00005','0.005'],h:['1e-12','0.001'],logXR:['0','100'],Tf:['64','512'],co:['0.00001','0.01']};
  for(const [k,[ls,us]] of Object.entries(ranges)){
    // Admit each written decimal endpoint and its actual binary64 endpoint.
    // These comparisons are exact and never evaluate exp(Md) in validation.
    const lo=min(parse(ls,k),fromNumber(Number(ls))),hi=max(parse(us,k),fromNumber(Number(us)));
    if(cmp(p[k],lo)<0||cmp(p[k],hi)>0)throw new ComputeError('INVALID_INPUT',`${k} outside the supported frozen-schedule parameter range`,{lower:qs(lo),upper:qs(hi)});
  }
  // Broad exact inequalities contain every supported binary64 parameter. They
  // are the inequalities used below, so tiny decimal/binary differences never
  // substitute a different real h or an unproved scalar comparison.
  if(!(p.lambda.n>0n&&cmp(p.lambda,Q(1,100))<0&&p.h.n>0n&&cmp(p.h,div(p.lambda,Q(2)))<0&&cmp(p.h,Q(1,100))<0&&p.co.n>0n&&cmp(mul(p.co,p.h),Q(1,100))<0&&p.logP.n>=0n))throw new ComputeError('INVALID_INPUT','Exact source inequalities require 0<h<lambda/2, lambda<1/100, h<1/100, 0<co*h<1/100 and logP>=0');
  const W=parse(input.realWindow??defaults.realWindow,'realWindow'),radius=parse(input.tubeRadius??defaults.tubeRadius,'tubeRadius'),ratio=parse(input.coefficientRadiusRatio??defaults.coefficientRadiusRatio,'coefficientRadiusRatio');
  if(cmp(W,Q(1))<0||cmp(W,Q(2))>0||radius.n<=0n||cmp(radius,Q(1,2))>=0||ratio.n<=0n||cmp(ratio,Q(1,2))>0)throw new ComputeError('INVALID_INPUT','Require 1<=realWindow<=2, 0<tubeRadius<1/2, 0<coefficientRadiusRatio<=1/2');
  const bits=integer(input.boundBits??128,'boundBits',64,256),binding=Object.fromEntries(Object.entries(p).map(([k,v])=>[k,{exact:qs(v),inputKind:typeof original[k]==='number'?'EXACT_BINARY64_VALUE':'EXACT_TEXT_RATIONAL',numericApproximation:numeric[k],numericApproximationIsIdentical:cmp(v,fromNumber(numeric[k]))===0}]));
  return {R,p,W,radius,ratio,bits,binding,normalizedInput:{parameters:Object.fromEntries(Object.entries(p).map(([k,v])=>[k,qs(v)])),boundBits:bits,realWindow:qs(W),tubeRadius:qs(radius),coefficientRadiusRatio:qs(ratio)}};
}
export function validateSourcePressureAnalyticInput(input={}){
  try {const a=normalize(input);return {valid:true,normalizedInput:a.normalizedInput,parametersExact:a.normalizedInput.parameters,parameterHExact:a.R.qs(a.p.h),inputBinding:a.binding,analyticComputationPerformed:false};}
  catch(e){return {valid:false,status:e.code??'INVALID_INPUT',message:e.message,detail:e.detail??{},analyticComputationPerformed:false};}
}

function exponentialEncloser(R,bits){
  const {Q,add,sub,mul,div,pow,cmp,neg,qs,floor,ceil,tick,ibox}=R,one=Q(1),scale=1n<<BigInt(bits),traces=[],cache=new Map();
  const down=a=>Q(floor(mul(a,Q(scale))),scale),up=a=>Q(ceil(mul(a,Q(scale))),scale);
  function exp(x){
    const key=qs(x);if(cache.has(key))return cache.get(key);
    if(x.n<0n){const pos=exp(neg(x)),v=[div(one,pos[1]),div(one,pos[0])];cache.set(key,v);traces.push({argument:key,enclosure:ibox(v),method:'Exact rational reciprocal of a positive exponential enclosure'});return v;}
    if(cmp(x,Q(220))>0)throw new ComputeError('RESOURCE_LIMIT','Exponential argument exceeds supported 220');
    let small=x,k=0;while(cmp(small,Q(1,8))>0){tick();small=div(small,Q(2));k++;}
    const N=24;let term=one,sum=one;
    for(let n=1;n<=N;n++){tick(10);term=div(mul(term,small),Q(n));sum=add(sum,term);}
    const next=div(mul(term,small),Q(N+1)),ratio=div(small,Q(N+2)),tail=div(next,sub(one,ratio));
    let v=[down(sum),up(add(sum,tail))];const smallBox=ibox(v),squares=[];
    for(let n=0;n<k;n++){tick(10);v=[down(pow(v[0],2)),up(pow(v[1],2))];squares.push(ibox(v));}
    const trace={argument:key,enclosure:ibox(v),method:'Positive finite Taylor sum plus geometric remainder, followed by outward dyadic squaring',
      reducedArgument:qs(small),rangeReductionPowerOfTwo:k,termsThrough:N,scaleBits:bits,smallPartialSum:qs(sum),firstOmittedTerm:qs(next),tailRatioUpper:qs(ratio),tailUpper:qs(tail),smallEnclosure:smallBox,squaringEnclosures:squares};
    traces.push(trace);cache.set(key,v);return v;
  }
  return {exp,traces};
}

function buildProducer(input,budget){
  const a=normalize(input,budget),{R,p,bits,W,radius,ratio}=a,{Q,add,sub,mul,div,pow,cmp,min,max,mag,neg,qs,floor,ceil,parse,number,interval,iadd,ineg,isub,imul,idiv,isq,ibox,tick}=R;
  const z=Q(0),one=Q(1),two=Q(2),E=exponentialEncloser(R,bits),rho=mul(p.co,p.h),oneMinusRho=sub(one,rho),foFactor=div(one,pow(oneMinusRho,2));
  const expOne=E.exp(one);if(cmp(expOne[0],two)<=0||cmp(expOne[1],Q(3))>=0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Exact exp(1) comparison did not prove 2<e<3');
  const pSquared=E.exp(mul(two,p.logP)),initialExp=E.exp(Q(1,5)),endpointExp=E.exp(Q(-2,5));
  const massShapeUpper=add(mul(Q(5,2),initialExp[1]),mul(Q(1,2),mul(endpointExp[1],foFactor)));
  const innerLo=mul(Q(5,2),pSquared[0]),innerHi=mul(Q(5,2),pSquared[1]);
  const totalLo=innerLo,totalHi=mul(massShapeUpper,pSquared[1]);
  const pulseExponent=div(Q(13),p.lambda),tailBits=Number(min(Q(512),Q(floor(pulseExponent))).n);
  if(tailBits<1)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','No positive exact mixed-tail decay exponent');
  const mixedTail=mul(mul(Q(1,2),pSquared[1]),mul(foFactor,Q(1,1n<<BigInt(tailBits))));

  // Establish a finite positive terminal waiting interval without evaluating
  // the original ODE numerically. h<.01 and e<3 imply log(1/h)>4.
  const q0=div(sub(p.lambda,p.h),sub(one,p.lambda)),oneMinusH=sub(one,p.h);
  const qFirstLo=mul(E.exp(neg(sub(one,p.lambda)))[0],q0),qFirstHi=add(q0,oneMinusH);
  const holdLo=Q(16),holdHi=mul(Q(4),sub(div(one,p.h),one));
  const qHoldLo=add(qFirstLo,mul(oneMinusH,holdLo)),qHoldHi=add(qFirstHi,mul(oneMinusH,holdHi));
  const qBeforeLo=mul(E.exp(neg(div(oneMinusH,two)))[0],qHoldLo),qBeforeHi=add(qHoldHi,oneMinusH);
  const qpFactor=div(rho,oneMinusRho),qpLo=mul(qpFactor,E.exp(oneMinusH)[0]),qpHi=mul(qpFactor,E.exp(mul(Q(3),oneMinusH))[1]);
  if(qpLo.n<=0n||cmp(qBeforeLo,qpHi)<=0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Source terminal waiting interval positivity was not established from analytic bounds');
  const waitUpper=div(sub(div(qBeforeHi,qpLo),one),oneMinusH);

  const tdExp=E.exp(p.Md),td=[add(tdExp[0],Q(10)),add(tdExp[1],Q(10))],hThresholdLo=E.exp(neg(td[1]))[0],hThresholdHi=E.exp(neg(td[0]))[1];
  const checkLargeP=cmp(p.logP,td[1])>0?'PROVED':cmp(p.logP,td[0])<=0?'DISPROVED':'UNDECIDED';
  const checkSmallH=cmp(p.h,hThresholdLo)<0?'PROVED':cmp(p.h,hThresholdHi)>=0?'DISPROVED':'UNDECIDED';

  function realBounds(etaBox){
    if(!Array.isArray(etaBox)||etaBox.length!==2)throw new ComputeError('INVALID_INPUT','etaBox must have two exact rational endpoints');
    const box=etaBox.map((v,i)=>parse(v,`etaBox[${i}]`));if(cmp(box[0],box[1])>0||cmp(box[0],neg(W))<0||cmp(box[1],W)>0)throw new ComputeError('INVALID_INPUT','Real interval lies outside the certified coefficient window');
    tick(200);const F=iadd(interval(one),isq(box)),f2=[div(one,pow(F[1],2)),div(one,pow(F[0],2))],f3=[div(one,pow(F[1],3)),div(one,pow(F[0],3))];
    const simpleP=[neg(totalHi),neg(mul(totalLo,f2[0]))],J=[mul(innerLo,f3[0]),div(totalHi,F[0])],simplePrime=imul(imul(interval(Q(4)),box),J);
    // P=-C/F^2 plus a nonpositive mixed-theta remainder on the real line.
    const tailPressure=mul(mixedTail,sub(one,f2[0]));
    const improvedP=[neg(add(mul(totalHi,f2[1]),tailPressure)),neg(mul(totalLo,f2[0]))];
    // Pprime=4 eta C/F^3 plus a mixed-tail remainder of magnitude <=4|eta| T/Fmin.
    const maxEta=max(mag(box[0]),mag(box[1])),tailDerivative=div(mul(Q(4),mul(maxEta,mixedTail)),F[0]);
    const mainPrime=imul(imul(interval(Q(4)),box),imul([totalLo,totalHi],f3)),improvedPrime=iadd(mainPrime,[neg(tailDerivative),tailDerivative]);
    const intersection=(x,y)=>{const v=[max(x[0],y[0]),min(x[1],y[1])];if(cmp(v[0],v[1])>0)throw new ComputeError('INTERNAL_CERTIFICATE_ERROR','Independent source pressure enclosures have empty intersection');return v;};
    return {eta:ibox(box),P:ibox(intersection(simpleP,improvedP)),Pprime:ibox(intersection(simplePrime,improvedPrime)),
      F:ibox(F),positiveDerivativeIntegral:ibox(J),simpleMixtureBounds:{P:ibox(simpleP),Pprime:ibox(simplePrime)},
      mixedRemainderUpper:{pressure:qs(tailPressure),derivative:qs(tailDerivative)},wholeInputInterval:true,
      method:'Exact rational interval propagation from the positive mixture, known theta=1 inner mass, and an analytic upper bound on the mixed-theta suffix.'};
  }
  function complexBounds(options={}){
    plain(options,'complex options');only(options,['realWindow','tubeRadius'],'complex options');const w=options.realWindow===undefined?W:parse(options.realWindow,'realWindow'),r=options.tubeRadius===undefined?radius:parse(options.tubeRadius,'tubeRadius');
    if(cmp(w,one)<0||cmp(w,W)>0||r.n<=0n||cmp(r,Q(1,2))>=0)throw new ComputeError('INVALID_INPUT','Complex request needs 1<=realWindow<=the coefficient window and 0<tubeRadius<1/2');
    tick(100);const delta=sub(one,pow(r,2)),absZ=add(w,r),P=div(totalHi,pow(delta,2)),Pd=div(mul(Q(4),mul(absZ,totalHi)),pow(delta,3));
    return {realWindow:qs(w),tubeRadius:qs(r),domain:'dist(z,[-W,W]) < tubeRadius',denominatorRealPartLower:qs(delta),denominatorAbsLower:qs(delta),absZUpper:qs(absZ),
      pressureAbsUpper:qs(P),pressureDerivativeAbsUpper:qs(Pd),branch:'Principal Log on Re(1+z^2)>0',
      nonintegerPowerDefinition:'(1+z^2)^(-2 theta)=exp(-2 theta PrincipalLog(1+z^2))',thetaInterval:['0','1'],
      domination:{measure:'dmu(y)=E_id,sched(y,0)^2 dy/2, positive and finite',integrandAbsUpper:qs(div(one,pow(delta,2))),
        derivativeIntegrandAbsUpper:qs(div(mul(Q(4),absZ),pow(delta,3))),massUpper:qs(totalHi),independentOfY:true},
      analyticJustification:'For z=x+iv in the tube, Re(1+z^2)=1+x^2-v^2>1-r^2. Principal Log is holomorphic there. These y-independent majorants are integrable against finite mu, so the holomorphic integral and differentiation under the integral are valid.',
      quadratureUsed:false,exactRationalScalarBounds:true,fullPremiseBundleLeanChecked:false};
  }
  function bindAxisH(value){
    try {const actual=parse(value,'axis.h'),same=cmp(actual,p.h)===0;return {matches:same,parameterHExact:qs(p.h),axisHExact:qs(actual),status:same?'EXACT_H_MATCH':'AXIS_H_MISMATCH'};}
    catch(e){return {matches:false,parameterHExact:qs(p.h),axisHExact:null,status:e.code??'INVALID_INPUT',message:e.message};}
  }
  const cb=complexBounds(),cauchyRadius=div(radius,two),coefficientRadius=mul(cauchyRadius,ratio),loss=div(add(one,ratio),pow(sub(one,ratio),3));
  const cauchyDelta=sub(one,pow(radius,2)),rawPUpper=div(totalHi,pow(cauchyDelta,2)),rawPdUpper=div(mul(Q(4),mul(add(W,radius),totalHi)),pow(cauchyDelta,3));
  const pNorm=ceil(mul(rawPUpper,loss)),pdNorm=ceil(mul(rawPdUpper,loss));
  // These are certified interval observations, not sampled point evaluations
  // of the defining integral. Keep their exact numerators/denominators in the
  // table; binary64 coordinates are display-only projections of that table.
  if(budget.maxPoints<51)throw new ComputeError('RESOURCE_LIMIT','The fixed pressure visualization needs 51 point/line vertices',{requiredVertices:51,maxPoints:budget.maxPoints});
  const internalQ=s=>{const [n,d='1']=s.split('/');return Q(n,d);};
  const observed=[],points=[],lowerLine=[],upperLine=[];
  for(let k=0;k<=16;k++){
    tick(100);const eta=Q(k-8,8),b=realBounds([qs(eta),qs(eta)]),raw=[internalQ(b.P.lower),internalQ(b.P.upper)],normalized=idiv(raw,pSquared);
    const center=div(add(normalized[0],normalized[1]),two),halfWidth=div(sub(normalized[1],normalized[0]),two),e=number(eta),c=number(center),w=number(halfWidth);
    if(![e,c,w,number(normalized[0]),number(normalized[1])].every(Number.isFinite))throw new ComputeError('PRECISION_REQUIRED','A pressure display coordinate is not finite');
    observed.push({eta:qs(eta),P:b.P,Pprime:b.Pprime,normalizedPressure:ibox(normalized),normalizedCenter:qs(center),normalizedHalfWidth:qs(halfWidth),normalizer:'mass.pStarSquared',method:'Exact interval division of raw P by the positive enclosure of exp(2 logP).'});
    points.push({pos:[e,c,w],value:c,label:`eta=${qs(eta)}; P/P*^2 certified interval center; height=half-width`});
    lowerLine.push([e,number(normalized[0]),0]);upperLine.push([e,number(normalized[1]),0]);
  }
  const certificate={schema:'MathScope.Navier.SourcePressureAnalyticCertificate/1',status:'VERIFIED_ANALYTIC_PRESSURE_BOUND_CERTIFICATE',evidenceGrade:'EXACT_RATIONAL_BOUNDS_WITH_ANALYTIC_THEOREM_ARGUMENT',
    target:'Actual A.21 unedited ideal scheduled pressure datum',pressureFamily:'source-outer-A21',pressureFormula:'P(z)=-integral (1+z^2)^(-2 theta(y)) dmu(y)',
    thetaInterval:['0','1'],normalizedInput:a.normalizedInput,parametersExact:a.normalizedInput.parameters,parameterHExact:qs(p.h),inputBinding:a.binding,
    totalMassLower:qs(totalLo),totalMassUpper:qs(totalHi),innerThetaOneMassLower:qs(innerLo),innerThetaOneMassUpper:qs(innerHi),
    innerThetaOneMass:{exactExpression:`(5/2)*exp(${qs(mul(two,p.logP))})`,lower:qs(innerLo),upper:qs(innerHi),theta:'1',support:'y<=0',isRationalValueClaim:false},
    mass:{definition:'C=(1/2) integral_R E_id,sched(y,0)^2 dy',pStarSquared:{exactExpression:`exp(${qs(mul(two,p.logP))})`,...ibox(pSquared)},
      lower:qs(totalLo),upper:qs(totalHi),normalizedUpper:qs(massShapeUpper),normalizedUpperApproximation:number(massShapeUpper),
      initialUnitUpper:'P*^2 (exp(1/5)-1)*(5/2)',initialEndpointIdentity:'E_id,sched(1,0)=P* exp(-1/5)',
      allLaterEnvelope:'E_id,sched(y,0)^2 <= P*^2 exp(-2/5) exp(-(y-1))/(1-rho_o)^2 for every y>=1',
      totalUpperFormula:'C/P*^2 <= (5/2)exp(1/5)+(1/2)exp(-2/5)/(1-rho_o)^2',
      proof:'On 0<=y<=1, 0<=integral_0^y sigma<=y and E=P*exp(y/10-(3/5)integral sigma). Step symmetry gives integral_0^1 sigma=1/2. Every later constant/transition segment has l<=0 before the terminal collar, and the collar multiplies the reference exponential by at most 1/(1-rho_o). Integrating the two infinite exponential envelopes gives the stated finite bound.',
      bothInfiniteEndsIncluded:true,finiteCutoffUsed:false,quadratureUsed:false},
    mixedThetaSuffix:{definition:'Positive measure of y after the axial pulse; the earlier part has theta=1',upper:qs(mixedTail),
      exponentialUpper:'mu_mixed <= P*^2 exp(-13/lambda)/(2(1-rho_o)^2)',rationalDecayBits:tailBits,rationalDecayUpper:qs(Q(1,1n<<BigInt(tailBits))),
      proof:'At pulse end E(0)^2<=P*^2 exp(-13/lambda). The later envelope integrates to at most 1/[2(1-rho_o)^2]. Since 2<e and k<=13/lambda, exp(-13/lambda)<=2^(-k); k is capped at 512 conservatively, never set to infinity.',nonzeroUpperRetained:true},
    scheduleExistence:{terminalQBeforeWait:{lower:qs(qBeforeLo),upper:qs(qBeforeHi)},terminalQp:{lower:qs(qpLo),upper:qs(qpHi)},
      wait:{strictlyPositive:true,finiteUpper:qs(waitUpper),formula:'wait=log(Q_before/Qp)/(1-h)'},
      inequalities:{qBeforeLowerGreaterThanQpUpper:true,positiveQpLower:true,positiveFo:oneMinusRho.n>0n},
      proof:'Linear ODE integrating-factor comparisons; the hold length 4 log(1/h) is between 16 and 4(1/h-1); the flattening loss is at most exp(-(1-h)/2). Qp lies between rho exp(1-h)/(1-rho) and rho exp(3(1-h))/(1-rho), since sigma prime integrates to one.',numericalODEUsed:false},
    sourceParameterContract:{necessaryLogPGreaterThanTd:checkLargeP,necessaryHBelowExpMinusTd:checkSmallH,twiceHLessThanLambda:true,
      fullSufficientlySmallLargeOrderCertified:false,reason:'The source pressure is well defined and bounded for these finite parameters; the full A.6 choices needed for the complete corrected profile are separate.'},
    realBounds:realBounds(['-1','1']),complexBounds:cb,
    observations:{kind:'EXACT_INTERVAL_ENCLOSURES_OF_A21_TARGET',sampleCount:17,etaWindow:['-1','1'],samples:observed,
      normalization:{exactExpression:`P*^2=exp(${qs(mul(two,p.logP))})`,...ibox(pSquared),appliedBy:'Exact rational interval division; the exponential is not treated as a rational exact value.'},
      intervalsContainEntirePointValue:true,displayCoordinatesApproximate:true},
    visualization:{points,lines:[{points:lowerLine},{points:upperLine}],arrows:[],axes:['eta','certified P/P*^2 interval center','certified normalized interval half-width'],
      description:'Seventeen certified A.21 target-pressure enclosures; lower and upper boundary curves lie in the zero-height plane.',
      coordinateMeaning:'The horizontal axis is eta. The second coordinate is the center of an exact normalized pressure enclosure; the third is its half-width. These are interval-graph coordinates, not a spatial fluid field or an evaluated exact pressure curve. P/P*^2 is enclosed by dividing the raw P enclosure by a separately enclosed positive exp(2 logP).',
      lostInformation:['Only 17 interval observations are drawn; whole-eta validity comes from the analytic inequalities, not interpolation of these points.','The exact target value inside each enclosure is not computed.','Plot coordinates are approximate binary64 values; exact raw and normalized rational intervals remain in observations.samples.','Exact equality of this target pressure with the numerically repaired outer field remains unproved.']},
    coefficientNorm:{realCoefficientWindow:[qs(neg(W)),qs(W)],cauchyRadius:qs(cauchyRadius),coefficientRadius:qs(coefficientRadius),radiusRatio:qs(ratio),radiusLoss:qs(loss),
      pressureNormUpper:String(pNorm),pressureDerivativeNormUpper:String(pdNorm),allEtaDerivativeOrders:true,
      derivativeConvention:'Actual derivatives; |P^(m)| <= m! M/r^m, not just Taylor coefficients',
      B_rhoFormula:'For radial degree zero: norm <= M sum_(m>=0)(m+1)^2 q^m = M(1+q)/(1-q)^3, q=rho/r<1',
      derivativeBoundFormula:'|P^(m)(eta)|<=m!*pressureAbsUpper/cauchyRadius^m on the real coefficient window'},
    exponentialAudit:E.traces,
    gates:{positiveFiniteMixtureMass:true,wholeEtaRealBounds:true,principalLogBranchSeparated:true,integrableHolomorphicMajorants:true,
      pressureDerivativeUnderIntegral:true,allEtaCauchyBounds:true,callerSuppliedNormAccepted:false,quadratureTruthAccepted:false,
      exactPressureEqualityWithRepairedE:false,existingFiniteJetsCertified:false,globalWitness:false,fullOriginalParameterOrder:false,fullPremiseBundleLeanChecked:false},
    proofBoundary:{arithmetic:'Exact BigInt rational operations and outward dyadic exponential enclosures',analytic:'Source formula identities and the stated positive-mixture/dominated-holomorphic-integral/Cauchy arguments',
      lean:'This generated analytic premise bundle has not been exported as a Lean proof. Existing scalar Lean targets do not automatically certify it.',
      repairedField:'The actual analytic A.21 target is now bounded; exact pressure/moment equality for the numerical repaired E remains unproved.'},sources:sourcePressureAnalyticSources};
  return {certificate,parameterHExact:qs(p.h),realBounds,complexBounds,bindAxisH};
}

/** Internal adapter factory: recomputes all bounds from source parameters. */
export function createSourcePressureAnalyticProducer(input={},budget=makeBudget()){budget.tick();return buildProducer(input,budget);}
/** JSON-only high-level operation. */
export function certifySourcePressureAnalytic(input={},budget=makeBudget()){
  try{return createSourcePressureAnalyticProducer(input,budget).certificate;}
  catch(e){return {schema:'MathScope.Navier.SourcePressureAnalyticCertificate/1',status:e.code??'COMPUTATION_ERROR',message:e.message,detail:e.detail??{},evidenceGrade:'NO_CERTIFICATE',gates:{globalWitness:false,exactPressureEqualityWithRepairedE:false,fullPremiseBundleLeanChecked:false}};}
}
