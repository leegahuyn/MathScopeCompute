import {ComputeError,makeBudget,positive,finiteNumber,boundedInteger,point,iadd,imul,idiv,iexp,ilog} from '../numerics.mjs';
import {smoothStep} from '../radial.mjs';
import {solveAxisCoefficients,jetC,jetVar,jetAdd,jetSub,jetScale,jetMul,jetDiv,jetInv,jetLog,jetExp,jetDeriv} from '../axis-series.mjs';
import {coneGaps} from './admissible-loop.mjs';
import * as outer from './outer.mjs';

const SOURCE={attachment:'01-navier-stokes.pdf',sha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',pages:[28,29,150,151,152,153],equations:['4.15','4.16','B.22','B.24','B.25','B.26','B.27']};
const take=(a,n)=>Array.from({length:n+1},(_,i)=>a[i]??0);
const zero=n=>jetC(0,n);
const safe=value=>{
  if(typeof value==='number'){
    if(!Number.isFinite(value))throw new ComputeError('PRECISION_REQUIRED','Nonfinite controlled-continuation result');
    return Number.isInteger(value)&&!Number.isSafeInteger(value)?{kind:'FLOAT64',value:value.toExponential(17),precisionBits:53}:Object.is(value,-0)?0:value;
  }
  if(Array.isArray(value))return value.map(safe);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined&&typeof v!=='function').map(([k,v])=>[k,safe(v)]));
  return value;
};
const budgetFor=b=>b?.tick?b:makeBudget(b??{});
function requireFinite(v,message){if(!Number.isFinite(v))throw new ComputeError('PRECISION_REQUIRED',message);return v;}
function evalRows(rows,Y,n,denominatorOffset=0){
  let result=zero(n);
  for(let k=rows.length-1;k>=0;k--)result=jetAdd(jetScale(result,Y),jetScale(take(rows[k],n),denominatorOffset?1/(k+denominatorOffset):1));
  return result;
}
function multiplyRows(a,b,n){
  const result=Array.from({length:a.length+b.length-1},()=>zero(n));
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)result[i+j]=jetAdd(result[i+j],jetMul(take(a[i],n),take(b[j],n)));
  return result;
}
function addState(a,b,factor=1){return a.map((row,i)=>jetAdd(row,jetScale(b[i],factor)));}
function rk4(state,t,dt,rhs,budget){
  budget.tick(state.length*state[0].length*12);
  const k1=rhs(t,state),k2=rhs(t+dt/2,addState(state,k1,dt/2)),k3=rhs(t+dt/2,addState(state,k2,dt/2)),k4=rhs(t+dt,addState(state,k3,dt));
  return state.map((row,i)=>row.map((value,j)=>value+dt*(k1[i][j]+2*k2[i][j]+2*k3[i][j]+k4[i][j])/6));
}
function cubicState(left,right,leftDerivative,rightDerivative,h,t){
  const h00=(2*t-3)*t*t+1,h10=((t-2)*t+1)*t,h01=(-2*t+3)*t*t,h11=(t-1)*t*t;
  return left.map((r,i)=>r.map((v,j)=>h00*v+h10*h*leftDerivative[i][j]+h01*right[i][j]+h11*h*rightDerivative[i][j]));
}

async function pressureFamily(spec,budget){
  const family=spec?.family??'rational';
  if(family==='rational'){
    const K=positive(spec?.K??10,'pressure.K');
    return {description:{family,K,definition:'Pi0(eta)=-K/(1+eta^2)^2',outerBindingCertified:false},
      jet:(eta,n)=>{const e=jetVar(eta,n),f=jetInv(jetAdd(jetC(1,n),jetMul(e,e)));return jetScale(jetMul(f,f),-K);}};
  }
  if(family==='source-outer-A21'){
    const schedule=outer.prepareOuterSchedule(spec.parameters??{},budget);
    return {description:{family,parameters:spec.parameters??{},definition:'Actual A.21 schedule pressure datum and numerical Taylor coefficients',
      outerDatumComputed:true,outerBindingCertified:false,pressureQuadratureCertified:false},
      jet:(eta,n)=>{
        const result=outer.pressureJet(schedule,eta,n);
        if(result instanceof Promise)throw new ComputeError('UNSUPPORTED','Synchronous pressureJet coefficients are required by the finite axis recurrence');
        const c=result.coefficients;
        if(!Array.isArray(c)||c.length<n+1||!c.every(Number.isFinite))throw new ComputeError('PRECISION_REQUIRED','A.21 pressure jet is outside the finite axis numerical range',{order:n});
        return c;
      }};
  }
  throw new ComputeError('UNSUPPORTED','Only explicit rational or source-outer-A21 pressure families are supported');
}

/** Exact finite-polynomial moments of the computed nonlinear axis coefficients. */
function axisEvaluator(solution,n){
  const a=solution.data,Lambda=a.Lambda;
  const Frows=solution.phi.map(row=>jetMul(take(a.g,n),take(row,n)));
  const Urows=solution.u.map((row,i)=>jetAdd(jetScale(take(row,n),1/Lambda),i===0?take(a.Us,n):zero(n)));
  const UF=multiplyRows(Urows,Frows,n),UU=multiplyRows(Urows,Urows,n),FF=multiplyRows(Frows,Frows,n);
  const pressure=take(a.Pi,n);
  const at=X=>{
    const Y=Lambda*X,F=evalRows(Frows,Y,n),U=evalRows(Urows,Y,n);
    if(!(F[0]>0&&Number.isFinite(F[0])))throw new ComputeError('INVALID_PROFILE','The selected finite nonlinear axis is not positive/finite',{eta:a.eta,X,F:F[0]});
    const logF=jetLog(F),M=jetScale(evalRows(Urows,Y,n,1),X),I=jetScale(evalRows(Frows,Y,n,2),2*X*X),J=jetScale(evalRows(UF,Y,n,2),2*X*X);
    const S=jetSub(jetScale(evalRows(UU,Y,n,1),X),jetScale(evalRows(FF,Y,n,2),X*X));
    const Cp=jetScale(evalRows(FF,Y,n,1),X);
    const Fderivative=Frows.slice(1).map((row,k)=>jetScale(row,k+1)),Uderivative=Urows.slice(1).map((row,k)=>jetScale(row,k+1));
    const logFSlope=jetScale(jetDiv(evalRows(Fderivative,Y,n),F),Y),USlope=jetScale(evalRows(Uderivative,Y,n),Y);
    return {state:[logF,U,M,I,J,S,Cp],logFSlope,USlope,pressure,X};
  };
  return {at,pressure,eta:a.eta,Lambda,n};
}

function momentRHS(X,state,logFSlope,USlope){
  const n=state[0].length-1,F=jetExp(state[0]),U=state[1],F2=jetMul(F,F),U2=jetMul(U,U);
  if(!(F[0]>0&&Number.isFinite(F[0])))throw new ComputeError('PRECISION_REQUIRED','Scaled angular factor underflows or overflows during continuation');
  return [logFSlope,USlope,jetScale(U,X),jetScale(F,2*X*X),jetScale(jetMul(U,F),2*X*X),
    jetSub(jetScale(U2,X),jetScale(F2,X*X)),jetScale(F2,X)];
}

/** Equations (4.16)/(B.35), evaluated from actual five moment jets. */
function integratedState(X,eta,state,pressure,options){
  const n=state[0].length-1,e=jetVar(eta,n),one=jetC(1,n),d=jetSub(one,jetMul(e,e));
  const h=options.h,D=.5-h,A=.5+h,L=jetSub(one,jetScale(jetMul(e,e),2*h));
  const [logF,U,M,I,J,S,Cp]=state,F=jetExp(logF),E=jetScale(F,Math.sqrt(2*X)),H=jetScale(F,2*X),Pi=jetAdd(take(pressure,n),Cp);
  const W=jetSub(jetSub(one,jetScale(jetMul(e,M),2*D/X)),jetScale(jetMul(d,jetDeriv(M)),1/X));
  const angular=jetAdd(jetSub(jetSub(jetScale(I,1-h),jetScale(jetMul(e,jetDeriv(I)),D)),jetMul(d,jetDeriv(J))),jetScale(jetMul(e,J),2*(h-D)));
  const Qs=jetAdd(jetScale(W,-1),jetScale(jetDiv(angular,H),1/X));
  // Source (4.16): integrating Sn gives -X*W*U, so division by X
  // leaves -W*U outside the normalized moment numerator.
  const axialMoments=jetSub(jetAdd(jetScale(jetSub(M,jetMul(e,jetDeriv(M))),D),jetScale(jetMul(e,S),4*h)),jetMul(d,jetDeriv(S)));
  const Ns=jetAdd(jetAdd(jetAdd(jetScale(jetMul(W,U),-1),jetScale(axialMoments,1/X)),jetScale(jetMul(e,Pi),4*A)),jetScale(jetMul(d,jetDeriv(Pi)),-1));
  const p1=jetScale(jetDiv(Qs,L),X),ns=jetDiv(Ns,L),p2=jetScale(jetDiv(ns,E),X);
  const VoverX=jetDiv(jetSub(jetSub(jetScale(jetMul(e,U),2),jetScale(jetMul(e,M),2*D/X)),jetScale(jetMul(d,jetDeriv(M)),1/X)),L);
  for(const value of [E[0],U[0],Pi[0],p1[0],p2[0],ns[0],VoverX[0]])requireFinite(value,'Nonfinite reference integrated state');
  return {E,U,Pi,p1,p2,ns,W,Qs,Ns,VoverX,F,logF,L,moments:[M,I,J,S,Cp]};
}

function buildReference(axis,options,budget){
  const X0=4/options.Lambda,t1=options.t1,yStart=t1,yEnd=2*t1,N=options.referenceSteps,dy=t1/N;
  const initial=axis.at(X0*Math.exp(t1)).state;
  const rhs=(y,state)=>{
    const X=X0*Math.exp(y),nat=axis.at(X),cut=1-smoothStep((y-t1)/t1);
    return momentRHS(X,state,jetScale(nat.logFSlope,cut),jetScale(nat.USlope,cut));
  };
  const nodes=[{y:yStart,state:initial,rhs:rhs(yStart,initial)}];
  let state=initial;
  for(let i=0;i<N;i++){
    const y=yStart+i*dy;state=rk4(state,y,dy,rhs,budget);
    nodes.push({y:y+dy,state,rhs:rhs(y+dy,state)});
  }
  const end=nodes.at(-1),Xend=X0*Math.exp(yEnd),Fend=jetExp(end.state[0]),Uend=end.state[1],F2=jetMul(Fend,Fend),U2=jetMul(Uend,Uend),UF=jetMul(Uend,Fend);
  function at(X){
    const y=Math.log(X/X0);let result;
    if(y<=t1)result=axis.at(X).state;
    else if(y<yEnd){
      const k=Math.min(N-1,Math.max(0,Math.floor((y-yStart)/dy))),left=nodes[k],right=nodes[k+1];
      result=cubicState(left.state,right.state,left.rhs,right.rhs,dy,(y-left.y)/dy);
    }else{
      const dx=X-Xend,dx2=X*X-Xend*Xend;
      result=[end.state[0],Uend,
        jetAdd(end.state[2],jetScale(Uend,dx)),jetAdd(end.state[3],jetScale(Fend,dx2)),
        jetAdd(end.state[4],jetScale(UF,dx2)),jetAdd(end.state[5],jetSub(jetScale(U2,dx),jetScale(F2,dx2/2))),
        jetAdd(end.state[6],jetScale(F2,dx))];
    }
    return {state:result,...integratedState(X,axis.eta,result,axis.pressure,options)};
  }
  return {at,X0,Xend,nodes,method:'B.22 cutoff integrated by RK4; Hermite dense output only inside the short cutoff, exact finite constant-profile moment primitives after it.',interpolationCertified:false};
}

function controls(X,reference,options,kappa0,actualDegree){
  const y=Math.log(X/reference.X0),yB=Math.log(100/reference.X0),r=reference.at(X),p1=take(r.p1,actualDegree),ns=take(r.ns,actualDegree);
  // Preserve a very small positive kappa0 after the flat activation; subtracting
  // (1-kappa0)*1 from 1 would round it to zero in binary64.
  let kappa=kappa0+(1-kappa0)*(1-smoothStep(y/options.t1)),beta=1,a;
  if(y<=yB)a=jetScale(p1,kappa);
  else if(y<=yB+options.axialWidth){kappa=kappa0;beta=1-smoothStep((y-yB)/options.axialWidth);a=jetScale(p1,kappa0);}
  else{
    kappa=kappa0;beta=0;
    const s=smoothStep((y-yB-options.axialWidth)/options.shearWidth);
    a=jetAdd(jetScale(p1,kappa0*(1-s)),jetC(.8*s,actualDegree));
  }
  const logFSlope=jetScale(a,-.5),USlope=jetScale(ns,-kappa*beta*X/2);
  return {a,logFSlope,USlope,kappa,beta,reference:r,stage:y<=options.t1?'B26-flat-activation':y<=yB?'B26-small-shear':beta>0?'B5-axial-cutoff':y<yB+options.axialWidth+options.shearWidth?'B5-shear-interpolation':'B5-final-a-0.8'};
}

function continueSlice(axis,reference,options,kappa0,budget){
  const degree=options.etaJetOrder,X0=reference.X0;
  let state=axis.at(X0).state.map(row=>take(row,degree));
  const yB=Math.log(100/X0),yEnd=Math.log(110/X0);
  const knots=[0,options.t1,2*options.t1,yB,yB+options.axialWidth,yB+options.axialWidth+options.shearWidth,yEnd].sort((a,b)=>a-b);
  const rhs=(y,s)=>{const X=X0*Math.exp(y),c=controls(X,reference,options,kappa0,degree);return momentRHS(X,s,c.logFSlope,c.USlope);};
  const nodes=[{y:0,state,rhs:rhs(0,state)}];
  for(let segment=0;segment<knots.length-1;segment++){
    const left=knots[segment],right=knots[segment+1];if(right<=left)continue;
    const short=right-left<.2,steps=short?options.transitionSteps:Math.max(8,Math.ceil(options.radialSteps*(right-left)/yEnd)),dy=(right-left)/steps;
    for(let i=0;i<steps;i++){
      const y=left+i*dy;state=rk4(state,y,dy,rhs,budget);nodes.push({y:y+dy,state,rhs:rhs(y+dy,state)});
    }
  }
  function at(X){
    const y=Math.log(X/X0);let lo=0,hi=nodes.length-1;
    while(hi-lo>1){const m=(lo+hi)>>1;if(nodes[m].y<=y)lo=m;else hi=m;}
    const l=nodes[lo],r=nodes[hi],h=r.y-l.y;
    const s=y<=0?nodes[0].state:y>=yEnd?nodes.at(-1).state:cubicState(l.state,r.state,l.rhs,r.rhs,h,(y-l.y)/h);
    const c=controls(X,reference,options,kappa0,degree),v=integratedState(X,axis.eta,s,axis.pressure,options),bs=2*c.USlope[0]/v.E[0],g=coneGaps({a:c.a[0],bs,ps:[v.p1[0],v.p2[0]]});
    const relaxed=g.c>2&&g.c>g.v&&2*(g.c-g.v)**2>Math.max(0,g.v-2)*g.j*g.j;
    return {X,logX:Math.log(X),eta:axis.eta,E:v.E[0],logE:v.logF[0]+.5*Math.log(2*X),U:v.U[0],Pi:v.Pi[0],V0:X*v.VoverX[0],
      a:c.a[0],bs,ps:[v.p1[0],v.p2[0]],referencePs:[c.reference.p1[0],c.reference.p2[0]],
      kappa:c.kappa,beta:c.beta,stage:c.stage,cone:{...g,relaxed,admissible:g.gaps.every(x=>x>0)},
      referenceE:c.reference.E[0],referenceU:c.reference.U[0],moments:v.moments.map(row=>row[0]),
      momentEtaJets:v.moments.map(row=>take(row,Math.min(2,degree))),
      etaJets:{logF:take(v.logF,degree),U:take(v.U,degree),Pi:take(v.Pi,degree)},
      derivatives:{dYLogE:.5+c.logFSlope[0],dYU:c.USlope[0]},state:s};
  }
  return {at,nodes,X0,Xi:110};
}

export function validateContinuationInput(input={}){
  try{
    const axis=input.axis??{},rawEtas=input.etaValues??[input.eta??0];
    if(!Array.isArray(rawEtas)||rawEtas.length<1||rawEtas.length>9)throw new ComputeError('INVALID_INPUT','etaValues must contain 1..9 explicit values');
    const etaValues=rawEtas.map(x=>finiteNumber(x,'eta'));
    if(etaValues.some(x=>Math.abs(x)>1))throw new ComputeError('INVALID_INPUT','Each eta must lie in [-1,1]');
    const outerH=input.pressure?.family==='source-outer-A21'?(input.pressure.parameters?.h??1e-8):null;
    const options={h:positive(axis.h??outerH??.005,'h'),j0:positive(axis.j0??.03,'j0'),sigmaStar:positive(axis.sigmaStar??.2,'sigmaStar'),Lambda:positive(axis.Lambda??48,'Lambda'),
      logC:finiteNumber(axis.logC??16,'logC'),axisOrder:boundedInteger(axis.axisOrder??10,'axisOrder',4,20),
      etaJetOrder:boundedInteger(input.etaJetOrder??4,'etaJetOrder',2,6),t1:positive(input.t1??.004,'t1'),
      axialWidth:positive(input.axialWidth??.02,'axialWidth'),shearWidth:positive(input.shearWidth??.02,'shearWidth'),
      referenceSteps:boundedInteger(input.referenceSteps??48,'referenceSteps',16,256),transitionSteps:boundedInteger(input.transitionSteps??24,'transitionSteps',8,128),
      radialSteps:boundedInteger(input.radialSteps??192,'radialSteps',32,2048),samples:boundedInteger(input.samples??161,'samples',33,1025)};
    if(!(options.h<.01&&options.j0<=.05&&options.Lambda>1&&options.logC>=0))throw new ComputeError('INVALID_INPUT','Require 0<h<.01, 0<j0<=.05, Lambda>1 and logC>=0');
    if(options.logC>600)throw new ComputeError('PRECISION_REQUIRED','The current finite continuation supports logC<=600; a valid much larger certified constant requires a scaled arbitrary-precision construction',{supportedLogCMaximum:600});
    if(outerH!==null&&options.h!==Number(outerH))throw new ComputeError('INVALID_INPUT','Outer and axis constructions must use the same h parameter');
    const cutoffEdge=imul(point(4),iexp(imul(point(2),point(options.t1)))),axisEdge=idiv(point(41),point(10));
    if(!(cutoffEdge[1]<axisEdge[0]))throw new ComputeError('INVALID_INPUT','B.22 requires certified 4 exp(2 t1)<4.1');
    const transitionLength=iadd(point(options.axialWidth),point(options.shearWidth)),availableLength=ilog(idiv(point(11),point(10)));
    if(!(transitionLength[1]<availableLength[0]))throw new ComputeError('INVALID_SUPPORT','Final cutoff/interpolation must fit strictly between Xb=100 and Xi=110');
    const kappa0=input.kappa0===undefined?null:positive(input.kappa0,'kappa0');
    if(kappa0!==null&&kappa0>=.5)throw new ComputeError('INVALID_INPUT','Require 0<kappa0<1/2');
    return {valid:true,options,etaValues,kappa0,pressure:input.pressure??{family:'rational',K:10}};
  }catch(error){return {valid:false,status:error.code??'INVALID_INPUT',message:error.message,detail:error.detail??{}};}
}

/** Actual B.22/B.26 operations applied to an explicitly finite nonlinear axis input. */
export async function runControlledContinuation(input={},budgetInput={}){
  const budget=budgetFor(budgetInput),valid=validateContinuationInput(input);
  if(!valid.valid)return safe({status:['PRECISION_REQUIRED','UNSUPPORTED'].includes(valid.status)?valid.status:'FAILED',domainStatus:valid.status,message:valid.message,detail:valid.detail,fullProfileCertified:false});
  try{
    const {options,etaValues}=valid;
    if((options.samples+13)*etaValues.length>budget.maxPoints)throw new ComputeError('BUDGET_EXCEEDED','Requested continuation samples plus construction checkpoints exceed the point budget');
    const pressure=await pressureFamily(valid.pressure,budget),prepared=[];
    let referenceVmax=0,referenceP1max=0,referencePositive=true;
    for(const eta of etaValues){
      const solution=solveAxisCoefficients(eta,options,pressure.jet,budget),axis=axisEvaluator(solution,options.etaJetOrder+2),reference=buildReference(axis,options,budget);
      const initial=axis.at(reference.X0),p0=reference.at(reference.X0),slopeDefect=p0.p1[0]+2*initial.logFSlope[0];
      for(let i=0;i<=160;i++){
        const X=reference.X0*Math.exp(Math.log(110/reference.X0)*i/160),r=reference.at(X);
        if(!(r.p1[0]>0))referencePositive=false;
        else referenceVmax=Math.max(referenceVmax,r.p1[0]+r.p2[0]**2/r.p1[0]);
        referenceP1max=Math.max(referenceP1max,r.p1[0]);
      }
      prepared.push({eta,axis,reference,slopeDefect});
    }
    if(!referencePositive)throw new ComputeError('INVALID_PROFILE','Reference p1 is not positive at the diagnostic nodes; B.26 input hypotheses fail');
    const kappa0=valid.kappa0??Math.min(.1,.1/referenceVmax,.4/referenceP1max);
    if(!(kappa0>0&&Number.isFinite(kappa0)))throw new ComputeError('PRECISION_REQUIRED','Reference shear bound is outside the finite kappa range');
    const slices=[];
    for(const p of prepared){
      const result=continueSlice(p.axis,p.reference,options,kappa0,budget),samples=[];
      for(let i=0;i<options.samples;i++){
        const X=i===options.samples-1?110:result.X0*Math.exp(Math.log(110/result.X0)*i/(options.samples-1)),row=result.at(X);delete row.state;samples.push(row);
      }
      const atInitial=result.at(result.X0),atEnd=result.at(110);
      const yB=Math.log(100/result.X0),yEnd=Math.log(110/result.X0);
      const diagnosticYs=[0,options.t1/4,options.t1/2,3*options.t1/4,options.t1,1.5*options.t1,2*options.t1,
        yB,yB+options.axialWidth/2,yB+options.axialWidth,yB+options.axialWidth+options.shearWidth/2,
        yB+options.axialWidth+options.shearWidth,yEnd];
      const constructionCheckpoints=diagnosticYs.map(y=>{const r=result.at(result.X0*Math.exp(y));delete r.state;return r;});
      const checkX=100/Math.exp(.3),dy=1e-5,left=result.at(checkX*Math.exp(-dy)),right=result.at(checkX*Math.exp(dy)),center=result.at(checkX);
      const derivativeCheck={X:checkX,
        logarithmicAngularFD:(right.logE-left.logE)/(2*dy),logarithmicAngularRHS:center.derivatives.dYLogE,
        axialFD:(right.U-left.U)/(2*dy),axialRHS:center.derivatives.dYU};
      slices.push({eta:p.eta,samples,constructionCheckpoints,diagnostics:{finiteAxisSlopeDefectAtX0:p.slopeDefect,
        initialStateAgreement:{logE:atInitial.logE-(p.axis.at(result.X0).state[0][0]+.5*Math.log(2*result.X0)),U:atInitial.U-p.axis.at(result.X0).state[1][0]},
        terminalShear:{a:atEnd.a,bs:atEnd.bs,targetA:.8,targetBs:0},
        derivativeCheck,relaxedConePassingSamples:samples.filter(s=>s.cone.relaxed).length,admissibleConePassingSamples:samples.filter(s=>s.cone.admissible).length,
        totalSamples:samples.length,referenceCutoffMethod:p.reference.method,continuationRKNodes:result.nodes.length,
        fullStressFlatFactorCertified:false,continuousQuadratureCertified:false,uniformEtaCertificate:false}});
    }
    const allSamples=slices.flatMap(s=>s.samples);
    return safe({status:'PARTIAL',domainStatus:'SOURCE_CONTROLLED_CONTINUATION_COMPUTED',sourceReferences:[SOURCE],parameters:{...options,etaValues,kappa0},
      inputContract:{axisFamily:'finite nonlinear B.12-B.15 coefficients',pressure:pressure.description,arbitraryCodeAllowed:false},
      construction:'Reference B.22 cutoff and actual B.26 shear-controlled log(phi)/U integration, five forward moment integrals, and final axial/shear transitions before Xi=110.',
      kappaSelection:{mode:valid.kappa0===null?'diagnostic sampled-reference bound':'explicit user value',sampledReferenceVmax:referenceVmax,sampledReferenceP1max:referenceP1max,uniformBoundCertified:false},
      slices,
      certifiedConditions:[{id:'SOURCE_DOMAIN_AND_SUPPORT_INPUTS',pass:true,scope:'Finite input parameter inequalities and transition placement only'},
        {id:'FINITE_POLYNOMIAL_AXIS_MOMENTS',pass:false,scope:'The algebraic finite-polynomial integration is implemented, but this binary64 evaluation has no interval rounding certificate'}],
      computedConditions:[{id:'B22_REFERENCE',pass:true},{id:'B26_CONTROLLED_ODE',pass:true},{id:'FINITE_POLYNOMIAL_AXIS_MOMENTS',pass:true},{id:'B5_TERMINAL_SHEAR',pass:slices.every(s=>s.diagnostics.terminalShear.a===.8&&s.diagnostics.terminalShear.bs===0)}],
      missingConditions:['The finite axis array has no certified nonlinear tail or full source outer-datum binding.',
        'The reference-family Vmax and kappa/t1 selection are sampled diagnostics, not the uniform bounds of Lemma B.4.',
        'RK4 and Hermite realization errors, all eta derivatives, and continuous moments are not interval-certified.',
        'The measured axis slope mismatch prevents asserting the exact B.30 flat stress factor for this finite approximation.',
        'B.8 exact five-moment gluing to the outer profile and C.2 global modulation/restoration remain separate operations.'],
      fullProfileCertified:false,fullNavierStokesSolution:false,
      visualization:{points:allSamples.map(s=>({pos:[s.logX,s.eta,s.logE],value:s.U,label:`B.26 X=${s.X.toPrecision(5)}, eta=${s.eta}`})),
        lines:slices.map(s=>({points:s.samples.map(p=>[p.logX,p.eta,p.logE])})),arrows:[],axes:['log X','η','log E'],
        description:'Computed B.22 reference and B.26 controlled continuation of an explicitly finite nonlinear axis profile.',
        coordinateMeaning:'Similarity-profile coordinates; the height is log of the actual computed angular profile E, not a physical spatial axis.',
        lostInformation:['No certified nonlinear infinite tail or whole-profile witness.','Intermediate curves are numerical reconstructions with stated errors and open conditions.']}});
  }catch(error){return safe({status:error.code==='RESOURCE_LIMIT'?'BUDGET_EXCEEDED':['CANCELLED','PRECISION_REQUIRED','BUDGET_EXCEEDED','UNSUPPORTED'].includes(error.code)?error.code:'FAILED',domainStatus:error.code??'COMPUTATION_ERROR',message:error.message,detail:error.detail??{},sourceReferences:[SOURCE],fullProfileCertified:false});}
}

export function getContinuationExamples(){return [
  {id:'ns-controlled-axis',label:'원문 B.22/B.26 · 실제 controlled continuation',request:{kind:'ns.controlled-continuation',input:{etaValues:[0,.2],pressure:{family:'rational',K:10},axis:{Lambda:48,logC:16,axisOrder:10},samples:161},budget:{maxOperations:20000000,maxMilliseconds:30000,maxPoints:2048}}},
  {id:'ns-controlled-source-datum',label:'실제 A.21 압력을 연결한 유한 continuation 후보',request:{kind:'ns.controlled-continuation',input:{etaValues:[0],pressure:{family:'source-outer-A21',parameters:{Md:1,logP:0,lambda:.0002,h:1e-8,logXR:20,Tf:64,co:.005}},axis:{Lambda:48,logC:2,axisOrder:10},samples:161},budget:{maxOperations:40000000,maxMilliseconds:30000,maxPoints:2048}}},
];}
