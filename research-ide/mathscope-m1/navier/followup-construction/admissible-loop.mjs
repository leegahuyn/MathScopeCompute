import {
  ComputeError, makeBudget, boundedInteger, finiteNumber, positive,
  point, interval, iadd, isub, imul, idiv, ipow, ipower, iexp,
  nextDown, nextUp, midpoint, maxabs, ball,
} from '../numerics.mjs';
import {smoothStep} from '../radial.mjs';

const TWO_PI=2*Math.PI;
const SOURCE={attachment:'01-navier-stokes.pdf',sha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',pages:[38,158,159,160,161],equations:['4.35','C.4','C.5','C.6','C.9','C.10','C.11','C.12']};
const scalar=v=>point(v);
const safe=value=>{
  if(typeof value==='number'){
    if(!Number.isFinite(value))throw new ComputeError('PRECISION_REQUIRED','Nonfinite C.1 result');
    return Number.isInteger(value)&&!Number.isSafeInteger(value)?{kind:'FLOAT64',value:value.toExponential(17),precisionBits:53}:Object.is(value,-0)?0:value;
  }
  if(Array.isArray(value))return value.map(safe);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined&&typeof v!=='function').map(([k,v])=>[k,safe(v)]));
  return value;
};
function budgetFor(budget){return budget?.tick?budget:makeBudget(budget??{});}
function addPositiveTail(sum,next,ratio){
  if(!(ratio[1]<1))return null;
  const tail=idiv(next,isub(point(1),ratio));
  return {box:[sum[0],nextUp(sum[1]+tail[1])],tailUpper:tail[1]};
}

/** Me(z)=I0(z), bounded by its positive entire series, not a quadrature fit. */
export function meanExponentialCertificate(z,budgetInput={}){
  const budget=budgetFor(budgetInput),raw=Array.isArray(z)?interval(...z):point(finiteNumber(z,'z'));
  const abs=raw[0]<=0&&raw[1]>=0?[0,maxabs(raw)]:[Math.min(Math.abs(raw[0]),Math.abs(raw[1])),maxabs(raw)];
  if(abs[1]>300)throw new ComputeError('PRECISION_REQUIRED','C.1 positive-series evaluator supports |z|<=300 without exponent rescaling',{z:raw});
  const q=idiv(ipow(abs,2),point(4));let term=point(1),sum=point(1);
  if(abs[1]===0)return {value:point(1),midpoint:1,tailUpper:0,terms:1,method:'Positive I0 series with a geometric tail'};
  for(let k=0;k<2000;k++){
    budget.tick(12);
    const next=idiv(imul(term,q),point((k+1)**2));
    const ratio=idiv(q,point((k+2)**2));
    const bound=addPositiveTail(sum,next,ratio);
    if(bound&&bound.tailUpper<=2e-15*Math.max(1,sum[0]))return {...bound,value:bound.box,midpoint:midpoint(bound.box),terms:k+1,method:'Positive I0 series; outward arithmetic and positive geometric remainder'};
    term=next;sum=iadd(sum,term);
  }
  throw new ComputeError('BUDGET_EXCEEDED','I0 positive series did not reach its tail criterion');
}

/** Stable identity, also at p=0:
 * V=d0^2 mu^2 B(mu p)/I0(mu p)^2,
 * B(z)=sum_{n>=1}(1-binomial(2n,n)/4^n) z^(2n-2)/(n!)^2.
 */
export function varianceCertificate(mu,p,d0,budgetInput={}){
  const budget=budgetFor(budgetInput);mu=finiteNumber(mu,'mu');p=finiteNumber(p,'p2');d0=positive(d0,'d0');
  if(mu<0)throw new ComputeError('INVALID_INPUT','mu must be nonnegative');
  if(mu===0)return {value:point(0),midpoint:0,terms:1,tailUpper:0};
  if(p===0){const value=idiv(imul(ipow(point(d0),2),ipow(point(mu),2)),point(2));return {value,midpoint:midpoint(value),terms:1,tailUpper:0,removableBranch:true};}
  const z=imul(point(mu),point(p)),M=meanExponentialCertificate(z,budget),z2=ipow(z,2);
  let n=1,central=point(.5),term=point(1),sum=point(.5),B=null,tailUpper=0;
  for(;n<2000;n++){
    budget.tick(16);
    const nextTerm=idiv(imul(term,z2),point((n+1)**2));
    const ratio=idiv(z2,point((n+2)**2));
    // 0 < 1-binomial(2n,n)/4^n < 1, so the raw next term bounds it.
    const bound=addPositiveTail(sum,nextTerm,ratio);
    if(bound&&bound.tailUpper<=2e-15*Math.max(1,sum[0])){B=bound.box;tailUpper=bound.tailUpper;break;}
    central=imul(central,idiv(point(2*n+1),point(2*n+2)));
    term=nextTerm;sum=iadd(sum,imul(isub(point(1),central),term));
  }
  if(!B)throw new ComputeError('BUDGET_EXCEEDED','Variance positive series did not reach its tail criterion');
  const value=idiv(imul(imul(ipow(point(d0),2),ipow(point(mu),2)),B),ipow(M.value,2));
  return {value,midpoint:midpoint(value),terms:n,tailUpper,removableBranch:false,method:'Cancellation-free positive variance series with geometric tail'};
}

export function coneGaps({a,bs,ps}){
  const t=-bs/a,v=a+bs*bs/a,c=ps[0]+ps[1]*t,j=ps[1]-ps[0]*t;
  return {t,v,c,j,gaps:[a,v-2,c-v,2*(c-v)**2-(v-2)*j*j]};
}
function intervalGaps(a,bs,ps){
  const t=idiv([-bs[1],-bs[0]],a),v=iadd(a,idiv(ipow(bs,2),a));
  const c=iadd(ps[0],imul(ps[1],t)),j=isub(ps[1],imul(ps[0],t)),gap=isub(c,v);
  return [a,isub(v,point(2)),gap,isub(imul(point(2),ipow(gap,2)),imul(isub(v,point(2)),ipow(j,2)))];
}
function parseState(value,index=0){
  const a=positive(value.a,'a'),bs=finiteNumber(value.bs??0,'bs');
  if(!Array.isArray(value.ps)||value.ps.length!==2)throw new ComputeError('INVALID_INPUT','ps must be [p1,p2]');
  const ps=value.ps.map((x,i)=>finiteNumber(x,`ps[${i}]`)),g=coneGaps({a,bs,ps});
  const tBox=idiv(point(-bs),point(a)),vBox=iadd(point(a),idiv(ipow(point(bs),2),point(a))),cBox=iadd(point(ps[0]),imul(point(ps[1]),tBox)),jBox=isub(point(ps[1]),imul(point(ps[0]),tBox));
  const gap=isub(cBox,vBox),vMinusTwo=isub(vBox,point(2));
  const relaxedQuadratic=isub(imul(point(2),ipow(gap,2)),imul([Math.max(0,vMinusTwo[0]),Math.max(0,vMinusTwo[1])],ipow(jBox,2)));
  if(!(cBox[0]>2&&gap[0]>0&&relaxedQuadratic[0]>0))throw new ComputeError('INVALID_INPUT','Input strict relaxed cone condition is not certified',{index,...g,cBox,gap,relaxedQuadratic});
  if(value.boundary&&vBox[0]<=2)throw new ComputeError('INVALID_INPUT','A claimed unchanged boundary collar must already have certified v>2',{index});
  return {a,bs,ps,...g,tBox,vBox,cBox,jBox,index,X:value.X===undefined?index+1:positive(value.X,'X'),eta:finiteNumber(value.eta??0,'eta'),boundary:!!value.boundary};
}
function tRange(state,mu,d0,budget){
  const zBox=imul(point(mu),point(state.ps[1])),z=maxabs(zBox);
  if(z<1e-3){
    // |I1(z)/I0(z)|<=|z|/2 follows term by term from the positive series.
    // The integral identity for the removable quotient then avoids 1/p loss.
    const variation=imul(imul(point(d0),point(mu)),imul(iexp(point(z)),iadd(point(1),idiv(point(z),point(2)))))[1];
    return iadd(state.tBox,[-variation,variation]);
  }
  const M=meanExponentialCertificate(zBox,budget);
  const normalized=idiv([iexp(point(-z))[0],iexp(point(z))[1]],M.value);
  return iadd(state.tBox,idiv(imul(point(d0),isub(normalized,point(1))),point(state.ps[1])));
}
function upperRootGapLower(PcLower,Jmax){
  const A=isub(point(PcLower),point(2)),j=point(Jmax),j2=ipow(j,2);
  const denominator=iadd(iadd(imul(point(4),A),j2),imul(j,ipower(iadd(j2,imul(point(8),A)),.5)));
  return idiv(imul(point(4),ipow(A,2)),denominator)[0];
}
function solveMu(state,targetInput,d0,upper,budget){
  const targetBox=Array.isArray(targetInput)?targetInput:point(targetInput),target=midpoint(targetBox);
  if(targetBox[1]===0)return {lower:0,upper:0,midpoint:0,target:0,targetInterval:targetBox,valueAtLower:[0,0],valueAtUpper:[0,0],exactZero:true};
  let lo=0,hi=upper,loValue=point(0),hiValue=varianceCertificate(hi,state.ps[1],d0,budget).value;
  if(!(hiValue[0]>targetBox[1]))throw new ComputeError('INVALID_INPUT','mu upper bracket does not exceed target variance');
  let unresolvedWidth=false;
  for(let k=0;k<90;k++){
    budget.tick();const mid=lo+(hi-lo)/2,v=varianceCertificate(mid,state.ps[1],d0,budget).value;
    if(v[1]<targetBox[0]){lo=mid;loValue=v;}
    else if(v[0]>targetBox[1]){hi=mid;hiValue=v;}
    else {unresolvedWidth=true;break;}
    if(hi-lo<2e-12*Math.max(1,mid))break;
  }
  return {lower:lo,upper:hi,midpoint:lo+(hi-lo)/2,target,targetInterval:targetBox,valueAtLower:loValue,valueAtUpper:hiValue,
    bracketCertified:loValue[1]<=targetBox[0]&&hiValue[0]>=targetBox[1],
    uniquenessBasis:'Strict monotonicity (C.6), including the p2=0 removable branch; source theorem reference, not a new Lean run',roundoffStoppedRefinement:unresolvedWidth};
}
function stepBox(box){
  const one=x=>{
    if(x<=0)return point(0);if(x>=1)return point(1);
    const A=iexp(idiv(point(-1),ipow(point(x),2))),B=iexp(idiv(point(-1),ipow(isub(point(1),point(x)),2)));
    return idiv(A,iadd(A,B));
  };
  return [Math.max(0,one(box[0])[0]),Math.min(1,one(box[1])[1])];
}
function stateEvaluator(state,mu,d0,v,budget){
  const p=state.ps[1],z=mu*p,M=meanExponentialCertificate(z,budget).midpoint;
  // Keep I0(z)-1 separate from its unit constant when computing log I0.
  // This is the drawing evaluator; the root/certificates use the positive
  // outward series above and do not depend on this floating-point sum.
  let logM=Math.log(M);
  if(Math.abs(z)<1e-3){
    const q=z*z/4;let term=q,tail=q;
    for(let n=2;n<=12;n++){term*=q/(n*n);tail+=term;}
    logM=Math.log1p(tail);
  }
  return theta=>{
    let t;
    if(p===0)t=state.t+d0*mu*Math.sin(theta);
    else t=state.t+d0*Math.expm1(z*Math.sin(theta)-logM)/p;
    const aL=v/(1+t*t),bL=-aL*t,dphi=state.a*(1+t*t)/(TWO_PI*v);
    return {theta,t,aL,bL,dphi,...coneGaps({a:aL,bs:bL,ps:state.ps})};
  };
}
function makeSamples(state,root,d0,v,sampleCount,budget){
  const evalTheta=stateEvaluator(state,root.midpoint,d0,v,budget);
  const n=Math.max(512,sampleCount*4),step=TWO_PI/n,thetaRows=[],cumPhi=[0],cumT=[0];
  for(let i=0;i<=n;i++){
    budget.tick(12);thetaRows.push(evalTheta(i*step));
    if(i){cumPhi.push(cumPhi[i-1]+step*(thetaRows[i-1].dphi+thetaRows[i].dphi)/2);cumT.push(cumT[i-1]+step*(thetaRows[i-1].t+thetaRows[i].t)/2);}
  }
  const rawPeriod=cumPhi[n],samples=[];let j=0;
  for(let i=0;i<=sampleCount;i++){
    const phase=i/sampleCount,target=phase*rawPeriod;
    while(j<n-1&&cumPhi[j+1]<target)j++;
    const f=(target-cumPhi[j])/(cumPhi[j+1]-cumPhi[j]),theta=(j+f)*step,row=evalTheta(theta);
    const integralT=cumT[j]+f*(cumT[j+1]-cumT[j]);
    const A=.5*state.a*(target-theta/TWO_PI);
    const BOverE=-state.a*integralT/(2*TWO_PI)-state.bs*target/2;
    samples.push({phase,theta,t:row.t,aL:row.aL,bL:row.bL,gaps:row.gaps,A,BOverE});
  }
  let meanA=0,meanB=0,meanPrimitiveA=0,meanPrimitiveB=0;
  for(let i=0;i<sampleCount;i++){
    meanA+=(samples[i].aL+samples[i+1].aL)/(2*sampleCount);
    meanB+=(samples[i].bL+samples[i+1].bL)/(2*sampleCount);
    meanPrimitiveA+=(samples[i].A+samples[i+1].A)/(2*sampleCount);
    meanPrimitiveB+=(samples[i].BOverE+samples[i+1].BOverE)/(2*sampleCount);
  }
  const primitiveClosure={A:samples.at(-1).A-samples[0].A,BOverE:samples.at(-1).BOverE-samples[0].BOverE};
  for(const sample of samples){sample.A-=meanPrimitiveA;sample.BOverE-=meanPrimitiveB;}
  const wrongUniformThetaMean={a:thetaRows.slice(0,n).reduce((s,r)=>s+r.aL,0)/n,bs:thetaRows.slice(0,n).reduce((s,r)=>s+r.bL,0)/n};
  return {samples,diagnostics:{rawLiftPeriod:rawPeriod,rawLiftPeriodError:rawPeriod-1,
    numericPhaseMean:{a:meanA,bs:meanB},numericMeanError:{a:meanA-state.a,bs:meanB-state.bs},
    thetaMeanT:cumT[n]/TWO_PI,thetaMeanTError:cumT[n]/TWO_PI-state.t,
    wrongUniformThetaMean,primitiveClosure,numericLiftNormalizedForSampling:true,
    quadratureNodes:n+1,phaseSamples:sampleCount+1,
    numericalRealizationCertified:false,
    limitation:'Displayed inverse lift and zero-mean primitives use finite quadrature/interpolation. Exact means apply to the source formula at the unique variance root; these arrays retain their measured defects.'}};
}

export function validateLoopInput(input={}){
  try{
    if(!input||typeof input!=='object'||Array.isArray(input))throw new ComputeError('INVALID_INPUT','Loop input must be an object');
    const raw=input.points??[{a:input.a??.8,bs:input.bs??0,ps:input.ps??[5,0],X:input.X??1,eta:input.eta??0,boundary:input.boundary??false}];
    if(!Array.isArray(raw)||!raw.length||raw.length>32)throw new ComputeError('INVALID_INPUT','points must contain 1..32 explicit cone states');
    const states=raw.map(parseState),phaseSamples=boundedInteger(input.phaseSamples??256,'phaseSamples',32,2048);
    return {valid:true,states,phaseSamples};
  }catch(error){return {valid:false,status:error.code??'INVALID_INPUT',message:error.message,detail:error.detail??{}};}
}

/** Literal C.1 construction at supplied fixed cone states; never a full-profile witness. */
export function runAdmissibleLoop(input={},budgetInput={}){
  const budget=budgetFor(budgetInput),valid=validateLoopInput(input);
  if(!valid.valid)return safe({...valid,status:['PRECISION_REQUIRED','UNSUPPORTED'].includes(valid.status)?valid.status:'FAILED',domainStatus:valid.status,fullProfileCertified:false});
  try{
    const {states,phaseSamples}=valid;
    if(states.length*(phaseSamples+1)>budget.maxPoints)throw new ComputeError('BUDGET_EXCEEDED','Requested loop samples exceed the point budget',{requested:states.length*(phaseSamples+1),maxPoints:budget.maxPoints});
    const d0=Math.min(...states.map(s=>isub(s.cBox,point(2))[0]/4));
    const minA=Math.min(...states.map(s=>s.a)),varianceThreshold=idiv(point(3),point(minA))[1];
    // Starting below one can be essential when d0 is large. The source still
    // requires one common muMax for the complete finite family and 3/min a.
    let muMax=Math.min(1,Math.sqrt(8/minA)/d0);
    if(!(muMax>0&&Number.isFinite(muMax)))throw new ComputeError('PRECISION_REQUIRED','The C.7 initial variance scale is outside binary64 range');
    for(let attempts=0;;attempts++){
      if(attempts>30)throw new ComputeError('BUDGET_EXCEEDED','Could not bracket the finite C.7 variance');
      if(states.every(s=>varianceCertificate(muMax,s.ps[1],d0,budget).value[0]>varianceThreshold))break;
      muMax*=2;
    }
    let delta=Math.min(1,...states.map(s=>s.boundary?isub(s.vBox,point(2))[0]:1));
    const familyBounds=states.map(s=>{
      const t=tRange(s,muMax,d0,budget),PcLower=isub(s.cBox,point(d0))[0],Jmax=iadd(point(Math.abs(s.ps[1])),imul(point(Math.abs(s.ps[0])),point(maxabs(t))))[1];
      const gap=upperRootGapLower(PcLower,Jmax);delta=Math.min(delta,gap);
      return {t,PcLower,Jmax,upperRootGapLower:gap};
    });
    delta/=4;
    if(!(delta>1e-13))throw new ComputeError('PRECISION_REQUIRED','Certified C.8 slack is too small for this binary64 realization',{delta});
    const loops=states.map((state,index)=>{
      const zeta=1-smoothStep((state.v-(2+delta/8))/(delta/8));
      const rho=zeta===0?0:zeta*zeta*(2+delta/2-state.v),v=state.v+rho;
      const zetaBox=isub(point(1),stepBox(idiv(isub(state.vBox,iadd(point(2),point(delta/8))),point(delta/8))));
      const rawDifference=isub(iadd(point(2),point(delta/2)),state.vBox);
      let rhoBox=imul(ipow([Math.max(0,zetaBox[0]),Math.min(1,zetaBox[1])],2),[Math.max(0,rawDifference[0]),Math.max(0,rawDifference[1])]);
      rhoBox=[Math.max(0,rhoBox[0]),Math.max(0,rhoBox[1])];
      if(state.vBox[0]>=iadd(point(2),point(delta/4))[1])rhoBox=point(0);
      const certifiedZeroBranch=rhoBox[0]===0&&rhoBox[1]===0;
      const targetBox=certifiedZeroBranch?point(0):idiv(rhoBox,point(state.a));
      const root=solveMu(state,[Math.max(0,targetBox[0]),Math.max(0,targetBox[1])],d0,muMax,budget);
      let gapBounds;
      if(certifiedZeroBranch)gapBounds=intervalGaps(point(state.a),point(state.bs),state.ps.map(point));
      else{
        const f=familyBounds[index],tmax=maxabs(f.t),vmax=iadd(point(2),point(delta/2))[1],cgap=isub(point(f.PcLower),point(vmax));
        gapBounds=[idiv(point(2),iadd(point(1),ipow(point(tmax),2))),
          point(nextDown(Math.min(delta/8,delta/2))),cgap,
          isub(imul(point(2),ipow(cgap,2)),imul(point(vmax-2),ipow(point(f.Jmax),2)))];
      }
      const phaseMargin=Math.min(...gapBounds.map(x=>x[0])),computed=makeSamples(state,root,d0,v,phaseSamples,budget);
      return {input:{a:state.a,bs:state.bs,ps:state.ps,X:state.X,eta:state.eta,boundary:state.boundary},
        d0,muMax,delta,zeta,rho,v,muRoot:root,certifiedZeroBranch,
        phaseCertificate:{pass:phaseMargin>0&&!!(root.bracketCertified||root.exactZero),
          quantifier:'All phase values for this fixed supplied state and the exact unique root in muRoot; not all unsupplied X/eta states.',
          gapOrder:['aL','v-2','Pc-v','2(Pc-v)^2-(v-2)Jc^2'],gapLowerBounds:gapBounds.map(x=>x[0]),
          kappaLower:phaseMargin,method:'Positive-series interval root bracket and conservative algebraic bounds over the complete t range.',
          analyticBasis:'C.4-C.10 continuity/strict monotonicity and the source circle reparametrization; no new Lean kernel run.'},
        boundaryUnchanged:state.boundary?certifiedZeroBranch:null,...computed};
    });
    return safe({status:'PARTIAL',domainStatus:'SOURCE_C1_LOOPS_COMPUTED',sourceReferences:[SOURCE],
      inputContract:{family:'explicit-relaxed-cone-states',inputIsJSON:true,arbitraryCodeAllowed:false},
      construction:'Actual exponential-tilt ratio, prescribed variance root, and weighted circle reparametrization of Appendix C.1.',
      sharedParameters:{d0,muMax,delta},loops,
      certifiedConditions:[{id:'C1_PHASE_GAPS',pass:loops.every(l=>l.phaseCertificate.pass),scope:'Every phase of each supplied fixed cone state'},
        {id:'C3_MARKED_BOUNDARIES',pass:loops.every(l=>l.boundaryUnchanged!==false),scope:'Only the supplied states explicitly marked boundary'}],
      missingConditions:['Uniform certified input profile over the full radial/eta rectangle is not supplied by point arrays.',
        'Displayed inverse-lift/primitives have finite numerical errors, reported separately.',
        'C.12 derivatives in X/eta, actual post-modulation moments and the C.2 exact five-moment restoration are not certified here.'],
      fullProfileCertified:false,fullNavierStokesSolution:false,
      visualization:{points:loops.flatMap((l,i)=>l.samples.map(s=>({pos:[s.aL,-s.bL,s.phase],value:Math.min(...s.gaps),label:`C.1 loop ${i+1}, phase ${s.phase.toFixed(4)}`}))),
        lines:loops.map(l=>({points:l.samples.map(s=>[s.aL,-s.bL,s.phase])})),arrows:[],axes:['a_L','−b_L','loop phase φ'],
        description:'Actual C.1 exponential-tilt admissible shear loops after the prescribed-mean reparametrization.',
        coordinateMeaning:'Shear-state coordinates and auxiliary loop phase, not physical-space fluid velocity.',
        lostInformation:['No whole X/eta profile or post-modulation ps reconstruction is certified.','Finite display samples approximate an analytically defined periodic loop.']}});
  }catch(error){return safe({status:error.code==='RESOURCE_LIMIT'?'BUDGET_EXCEEDED':['CANCELLED','PRECISION_REQUIRED','BUDGET_EXCEEDED'].includes(error.code)?error.code:'FAILED',domainStatus:error.code??'COMPUTATION_ERROR',message:error.message,detail:error.detail??{},sourceReferences:[SOURCE],fullProfileCertified:false});}
}

export function getLoopExamples(){return [
  {id:'ns-loop-zero-p2',label:'원문 C.1 · p₂=0의 제거 가능 분기',request:{kind:'ns.admissible-loop',input:{a:.8,bs:0,ps:[5,0],phaseSamples:256},budget:{maxOperations:3000000,maxPoints:2048}}},
  {id:'ns-loop-tilted',label:'원문 C.1 · 비영 p₂와 위상 재매개화',request:{kind:'ns.admissible-loop',input:{a:.9,bs:.12,ps:[5,.2],phaseSamples:256},budget:{maxOperations:3000000,maxPoints:2048}}},
];}
