/**
 * Source outer construction, Appendix A.2--A.7 of the pinned 166-page paper.
 * Separate from the frozen v50 implementation. All computations are finite,
 * pointwise numerical evaluations. No whole-eta or paper-witness certificate is
 * issued. Very small nonzero corrections retain a signed logarithmic value.
 */
import {ComputeError, integrate, makeBudget, solveLinear} from '../numerics.mjs';

const ROOT = 'https://github.com/openai/NavierStokesAndEuler/tree/f9e8bc5b38b6e212696e8a30e3e91517af887bbd';
export const OUTER_SOURCES = Object.freeze([
  {id:'A2',title:'Finite Time Blowup for Navier–Stokes',pages:[127,128],locator:'Lemma A.2, Corollary A.3; normalized quadratic moment maps',url:ROOT},
  {id:'A_SCHEDULE',title:'Finite Time Blowup for Navier–Stokes',pages:[129,130,131,132,133],locator:'A.5--A.23, Proposition A.4, Lemma A.5',url:ROOT},
  {id:'A_HEAT',title:'Finite Time Blowup for Navier–Stokes',pages:[138,139,140],locator:'A.32--A.43, Proposition A.7; three additive E bumps',url:ROOT},
  {id:'A_STRESS',title:'Finite Time Blowup for Navier–Stokes',pages:[140,141,142,143],locator:'Lemma A.8, Proposition A.10; conditional exterior stress recovery',url:ROOT}
]);

function plainJSON(value, path='input', depth=0) {
  if(depth>12) throw new ComputeError('INVALID_INPUT','JSON nesting exceeds 12',{path});
  if(value===null||typeof value==='string'||typeof value==='boolean') return;
  if(typeof value==='number') { if(!Number.isFinite(value)) throw new ComputeError('INVALID_INPUT','Finite numbers required',{path}); return; }
  if(Array.isArray(value)) { if(value.length>1024) throw new ComputeError('INVALID_INPUT','Array exceeds supported size',{path}); value.forEach((x,i)=>plainJSON(x,`${path}[${i}]`,depth+1)); return; }
  if(typeof value!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(value))) throw new ComputeError('INVALID_INPUT','Only plain JSON input is allowed',{path});
  for(const [k,v] of Object.entries(value)) plainJSON(v,`${path}.${k}`,depth+1);
}
function bounded(x,name,lo,hi,integer=false) {
  if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi||(integer&&!Number.isInteger(x))) throw new ComputeError('INVALID_INPUT',`${name} outside supported bounds`,{name,lo,hi,integer});
  return x;
}
const softplus=x=>x>0?x+Math.log1p(Math.exp(-x)):Math.log1p(Math.exp(x));
export function sourceStep(x) {if(x<=0)return 0;if(x>=1)return 1;const a=-1/(x*x)+1/((1-x)**2);return a>=0?1/(1+Math.exp(-a)):Math.exp(a)/(1+Math.exp(a));}
function logStep(x) {if(x<=0)return -Infinity;if(x>=1)return 0;return -softplus(1/(x*x)-1/((1-x)**2));}
function logOneMinusStep(x) {if(x<=0)return 0;if(x>=1)return -Infinity;return -softplus(-1/(x*x)+1/((1-x)**2));}
function logStepPrime(x) {if(x<=0||x>=1)return -Infinity;return logStep(x)+logOneMinusStep(x)+Math.log(2/x**3+2/(1-x)**3);}
export const sourceStepPrime=x=>Math.exp(logStepPrime(x));
const ZERO=()=>({sign:0,logAbs:-Infinity});
const sl=x=>x===0?ZERO():({sign:Math.sign(x),logAbs:Math.log(Math.abs(x))});
const signed=(sign,logAbs)=>sign===0||logAbs===-Infinity?ZERO():({sign:Math.sign(sign),logAbs});
function addSL(a,b) {
  if(!a.sign)return {...b};if(!b.sign)return {...a};
  if(a.logAbs<b.logAbs)return addSL(b,a);
  const d=b.logAbs-a.logAbs;
  if(a.sign===b.sign)return signed(a.sign,a.logAbs+Math.log1p(Math.exp(d)));
  if(d===0)return ZERO();
  return signed(a.sign,a.logAbs+Math.log(-Math.expm1(d)));
}
const negSL=a=>({...a,sign:-a.sign});
const mulSL=(a,b)=>!a.sign||!b.sign?ZERO():signed(a.sign*b.sign,a.logAbs+b.logAbs);
const scaleSL=(a,x)=>mulSL(a,sl(x));
const shiftSL=(a,x)=>a.sign?signed(a.sign,a.logAbs+x):ZERO();
const sumSL=xs=>xs.reduce(addSL,ZERO());
function packSL(a) {
  if(!a.sign)return {kind:'SIGNED_LOG',sign:0,logAbs:null,float64:0,zeroInComputedRepresentation:true,mathematicalZeroCertified:false};
  if(!Number.isFinite(a.logAbs))throw new ComputeError('PRECISION_REQUIRED','Nonfinite signed logarithmic result');
  const v=a.logAbs<Math.log(Number.MIN_VALUE)||a.logAbs>Math.log(Number.MAX_VALUE)?null:a.sign*Math.exp(a.logAbs);
  return {kind:'SIGNED_LOG',sign:a.sign,logAbs:a.logAbs,float64:v,underflowAvoided:v===null&&a.logAbs<0,overflowAvoided:v===null&&a.logAbs>0};
}
function asFloat(a) {return a.sign? a.sign*Math.exp(a.logAbs):0;}
const relativeSL=(a,scale)=>a.sign?a.sign*Math.exp(a.logAbs-scale):0;
function unpackSL(a) {return a.sign?signed(a.sign,a.logAbs):ZERO();}
function bump(y,center,width) {return sourceStepPrime((y-center)/width+.5)/width;}
function logBump(y,center,width) {return logStepPrime((y-center)/width+.5)-Math.log(width);}

export function outerExampleInput() {
  return {parameters:{Md:1,logP:14,lambda:.0002,h:1e-8,logXR:20,Tf:64,co:.005},etas:[-.5,0,.5],samplesPerEta:48,pressureOrder:4,tolerance:2e-8,heatOrder:3};
}
function normalizeParameters(input={}) {
  plainJSON(input,'parameters');
  if(!input||typeof input!=='object'||Array.isArray(input))throw new ComputeError('INVALID_INPUT','parameters must be a JSON object');
  const allowed=['Md','logP','lambda','h','logXR','Tf','co'];
  for(const k of Object.keys(input))if(!allowed.includes(k))throw new ComputeError('INVALID_INPUT','Unknown outer parameter',{key:k});
  const p={...outerExampleInput().parameters,...input};
  bounded(p.Md,'Md',.2,4);bounded(p.logP,'logP',0,100);bounded(p.lambda,'lambda',5e-5,.005);bounded(p.h,'h',1e-12,.001);
  bounded(p.logXR,'logXR',0,100);bounded(p.Tf,'Tf',64,512);bounded(p.co,'co',1e-5,.01);
  if(!(p.h<p.lambda/2))throw new ComputeError('INVALID_INPUT','The source tail requires 2h < lambda');
  return {...p,Td:Math.exp(p.Md)+10};
}
function normalizeOuterInput(input={},maxPoints=16384) {
  plainJSON(input);
  if(!input||typeof input!=='object'||Array.isArray(input))throw new ComputeError('INVALID_INPUT','Outer input must be a JSON object');
  const allowed=['parameters','etas','samplesPerEta','pressureOrder','tolerance','heatOrder'];
  for(const k of Object.keys(input))if(!allowed.includes(k))throw new ComputeError('INVALID_INPUT','Unknown source outer input key',{key:k});
  const defaults=outerExampleInput(),normalized={...defaults,...input,parameters:normalizeParameters(Object.hasOwn(input,'parameters')?input.parameters:defaults.parameters)};
  bounded(normalized.samplesPerEta,'samplesPerEta',24,256,true);bounded(normalized.pressureOrder,'pressureOrder',0,54,true);
  bounded(normalized.heatOrder,'heatOrder',1,5,true);bounded(normalized.tolerance,'tolerance',1e-11,1e-3);
  const etas=normalized.etas;if(!Array.isArray(etas)||etas.length<1||etas.length>16)throw new ComputeError('INVALID_INPUT','etas must contain 1 to 16 real points');
  etas.forEach(x=>bounded(x,'eta',-1,1));
  if(normalized.samplesPerEta*etas.length>maxPoints)throw new ComputeError('RESOURCE_LIMIT','Outer samples exceed maxPoints',{count:normalized.samplesPerEta*etas.length,maxPoints});
  delete normalized.parameters.Td;return normalized;
}
/** Pure structural validation: no ODE, quadrature or field computation. */
export function validateOuterInput(input={},budget={}) {
  try {const normalizedInput=normalizeOuterInput(input,budget.maxPoints??16384);return {valid:true,normalizedInput,
    requirements:{sourceParameterSmallness:'Not certified by structural validation',entireEtaProfile:'Not certified',jsonOnly:true},
    sampleCount:normalizedInput.samplesPerEta*normalizedInput.etas.length};}
  catch(e){return {valid:false,status:e.code??'INVALID_INPUT',message:e.message,detail:e.detail??{}};}
}
function checkedQuad(schedule,f,a,b,tol=schedule.tolerance/64) {
  const q=integrate(f,a,b,tol,schedule.budget);
  if(q.depthLimited)throw new ComputeError('PRECISION_REQUIRED','Outer quadrature exhausted its subdivision depth',{a,b,errorEstimate:q.errorEstimate});
  schedule.quadratureEvaluations+=q.evaluations;
  schedule.maxLocalQuadratureEstimate=Math.max(schedule.maxLocalQuadratureEstimate,q.errorEstimate);
  return q.value;
}
function logQuad(schedule,logf,a,b,tolerance=schedule.tolerance/64,relativeLog=null) {
  if(a===b)return ZERO();
  // Locate the maximum in known smooth source subintervals, then make it an
  // integration endpoint. This avoids silently missing a narrow positive pulse.
  const N=64;let k=0,m=-Infinity;
  for(let i=0;i<=N;i++){schedule.budget.tick();const v=logf(a+(b-a)*i/N);if(v>m){m=v;k=i;}}
  if(m===-Infinity)return ZERO();
  let l=a+(b-a)*Math.max(0,k-1)/N,r=a+(b-a)*Math.min(N,k+1)/N;
  const golden=(Math.sqrt(5)-1)/2;let x1=r-golden*(r-l),x2=l+golden*(r-l),f1=logf(x1),f2=logf(x2);
  for(let i=0;i<65;i++){schedule.budget.tick();if(f1<f2){l=x1;x1=x2;f1=f2;x2=l+golden*(r-l);f2=logf(x2);}else{r=x2;x2=x1;f2=f1;x1=r-golden*(r-l);f1=logf(x1);}}
  const x=f1>f2?x1:x2;m=Math.max(m,f1,f2);
  const bias=relativeLog?logf(x)-m:0;
  const ev=t=>{const z=relativeLog?relativeLog(t,x)+bias:logf(t)-m;return z===-Infinity?0:Math.exp(z);};
  // Resolve exponential boundary layers whose width is O(lambda), even when
  // their source interval has length O(1). A dyadic mesh around the located
  // maximum prevents the adaptive local error test from spending all depth on
  // a single, initially enormous interval.
  const cuts=[a,x,b];for(let j=1;j<=20;j++){schedule.budget.tick();const d=(b-a)*2**(-j);if(x-d>a)cuts.push(x-d);if(x+d<b)cuts.push(x+d);}
  const mesh=[...new Set(cuts)].sort((u,v)=>u-v);let v=0;
  for(let j=0;j<mesh.length-1;j++)v+=checkedQuad(schedule,ev,mesh[j],mesh[j+1],tolerance);
  return v>0?signed(1,m+Math.log(v)):ZERO();
}
function sigmaPrimitive(schedule,t) {
  if(t<=0)return 0;if(t>=1)return t-.5;
  if(!schedule.stepCache.has(t))schedule.stepCache.set(t,checkedQuad(schedule,sourceStep,0,t,Math.min(schedule.tolerance/128,1e-11)));
  return schedule.stepCache.get(t);
}
function rAdvanceVariable(schedule,r,length,lAt) {
  // Independent test uses high-precision integrating factors, not this RK4.
  const solve=N=>{const h=length/N;let q=r;for(let i=0;i<N;i++){schedule.budget.tick(8);const t=i*h,fn=(v,w)=>1-(1+lAt(v))*w,k1=fn(t,q),k2=fn(t+h/2,q+h*k1/2),k3=fn(t+h/2,q+h*k2/2),k4=fn(t+h,q+h*k3);q+=h*(k1+2*k2+2*k3+k4)/6;}return q;};
  const a=solve(256),b=solve(512);schedule.ratioRKErrorEstimate=Math.max(schedule.ratioRKErrorEstimate,Math.abs(a-b)/15);return b;
}
function qAdvanceVariable(schedule,q0,lAt) {
  const solve=N=>{let q=q0;const dt=1/N,h=schedule.params.h;for(let i=0;i<N;i++){schedule.budget.tick(8);const t=i*dt,fn=(v,w)=>-(1+lAt(v))*w-lAt(v)-h,k1=fn(t,q),k2=fn(t+dt/2,q+dt*k1/2),k3=fn(t+dt/2,q+dt*k2/2),k4=fn(t+dt,q+dt*k3);q+=dt*(k1+2*k2+2*k3+k4)/6;}return q;};
  const a=solve(256),b=solve(512);schedule.terminalRKErrorEstimate=Math.max(schedule.terminalRKErrorEstimate,Math.abs(a-b)/15);return b;
}

export function prepareOuterSchedule(parameters={},budget=makeBudget(),options={}) {
  const params=normalizeParameters(parameters),tolerance=bounded(options.tolerance??2e-8,'tolerance',1e-11,1e-3);
  const s={params,budget,tolerance,stages:[],stepCache:new Map(),quadratureEvaluations:0,maxLocalQuadratureEstimate:0,ratioRKErrorEstimate:0,terminalRKErrorEstimate:0};
  const {lambda:l,h,Td,Tf,co}=params;let y=0,logA=0,energyLog=0;
  function add(name,length,delta,energyDelta,theta=1,constantSlope=null) {
    const v={name,start:y,end:y+length,length,logAStart:logA,energyLogStart:energyLog,theta,constantSlope,delta,energyDelta};
    s.stages.push(v);y+=length;logA+=delta(length);energyLog+=energyDelta(length);v.logAEnd=logA;v.energyLogEnd=energyLog;return v;
  }
  s.initial=add('initial-slope',1,t=>.1*t-.6*sigmaPrimitive(s,t),t=>1.2*t-1.2*sigmaPrimitive(s,t));
  s.decay=add('axial-decay',Td,t=>-.5*t,()=>0,1,-.5);
  s.entry=add('intermediate-entry',1,t=>-.5*t-l*sigmaPrimitive(s,t),t=>-2*l*sigmaPrimitive(s,t));
  const Tw=60*Math.log(1/l);s.power=add('reserved-power',Tw,t=>(-.5-l)*t,t=>-2*l*t,1,-.5-l);
  s.reserved=[[Tw-25,Tw-20],[Tw-20,Tw-15],[Tw-14,Tw-9],[Tw-8,Tw-3]].map((a,i)=>({id:['I1-cone','I2-heat','Ipos','Imean'][i],start:s.power.start+a[0],end:s.power.start+a[1],interval:'OPEN'}));
  if(s.reserved[0].start<=s.power.start)throw new ComputeError('INVALID_INPUT','The four reserved patches do not fit the source power interval');
  s.pulse=add('axial-pulse',13/l,t=>(-.5-l)*t,t=>-2*l*t,1,-.5-l);
  s.interpolation=add('parameter-interpolation',Tf,t=>(-.5-l)*t-Math.log(2)*sourceStep(t/Tf),t=>-2*l*t-2*Math.log(2)*sourceStep(t/Tf),'interpolation');
  s.angular=add('angular-moment-patch',30*Math.log(1/l),t=>(-.5-l)*t,t=>-2*l*t,0,-.5-l);
  s.steepen=add('exterior-steepen',1,t=>(-.5-l)*t-(1-l)*sigmaPrimitive(s,t),t=>-2*l*t-2*(1-l)*sigmaPrimitive(s,t),0);
  s.hold=add('steep-power',4*Math.log(1/h),t=>-1.5*t,t=>-2*t,0,-1.5);
  s.flatten=add('exterior-flatten',1,t=>-1.5*t+(1-h)*sigmaPrimitive(s,t),t=>-2*t+2*(1-h)*sigmaPrimitive(s,t),0);
  s.rho=co*h;s.fo=t=>1-s.rho*(1-sourceStep((t-1)/2));
  s.logFo=t=>Math.log1p(-s.rho*(1-sourceStep((t-1)/2)));
  s.foPrime=t=>s.rho*sourceStepPrime((t-1)/2)/2;
  let Q=(l-h)/(1-l);Q=qAdvanceVariable(s,Q,t=>-l-(1-l)*sourceStep(t));Q+=(1-h)*s.hold.length;Q=qAdvanceVariable(s,Q,t=>-1+(1-h)*sourceStep(t));
  const Qp=checkedQuad(s,t=>Math.exp((1-h)*t)*s.foPrime(t)/(1-s.rho),1,3,Math.max(1e-26,h*tolerance/64));
  if(!(Q>Qp&&Qp>0))throw new ComputeError('INVALID_INPUT','Source terminal wait has no positive solution',{Q,Qp});
  const wait=Math.log(Q/Qp)/(1-h);s.terminalWait=add('terminal-wait',wait,t=>(-.5-h)*t,t=>-2*h*t,0,-.5-h);
  const foRatio=t=>Math.log1p(s.rho*sourceStep((t-1)/2)/(1-s.rho));
  s.terminal=add('terminal-flat-collar',3,t=>(-.5-h)*t+foRatio(t),t=>-2*h*t+2*foRatio(t),0);
  s.end=y;s.logEndA=logA;s.logEndEnergy=energyLog;s.logEPowTail=params.logP+s.terminal.logAStart-Math.log1p(-s.rho);
  s.logXtail=params.logXR+s.terminal.start;s.logCInfinity=params.logP+s.logEndA+(.5+h)*(params.logXR+s.end);
  s.terminalAudit={QBeforeWait:Q,Qp,wait,modelQAtTerminalStart:Q*Math.exp(-(1-h)*wait),estimatedRKError:s.terminalRKErrorEstimate,conditionalOnAngularMomentRestoration:true};
  let r=rAdvanceVariable(s,1/1.6,1,t=>.6*(1-sourceStep(t)));r=1+(r-1)*Math.exp(-Td);r=rAdvanceVariable(s,r,1,t=>-l*sourceStep(t));
  s.rIPulseStartTransient=shiftSL(sl(r-1/(1-l)),-(1-l)*Tw);
  s.rIInterpolationStartTransient=shiftSL(s.rIPulseStartTransient,-(1-l)*s.pulse.length);
  s.necessaryParameterChecks=[{name:'logP > Td',pass:params.logP>Td},{name:'h < exp(-Td)',pass:Math.log(h)<-Td},{name:'2h < lambda',pass:2*h<l}];
  s.upstreamContracts={required:'Definition 3.3 and A.6 sufficiently large/small choices; uniform finite derivative bounds and cone margins',certified:false,reason:'Necessary scalar inequalities and pointwise equations do not instantiate the upstream uniform constants.'};
  return s;
}

function stageAt(s,y) {return s.stages.find(v=>y>=v.start&&y<=v.end);}
function rawShape(s,y,eta) {
  const f=1/(1+eta*eta),lf=Math.log(f);
  if(y<=0)return {logE:s.params.logP+lf+.1*y,logShape:.1*y+lf,theta:1,stage:'reference-inner',l:.6};
  if(y>=s.end)return {logE:s.params.logP+s.logEndA-(.5+s.params.h)*(y-s.end),logShape:s.logEndA-(.5+s.params.h)*(y-s.end),theta:0,stage:'power-exterior',l:-s.params.h};
  const g=stageAt(s,y),t=y-g.start,theta=g.theta==='interpolation'?1-sourceStep(t/s.params.Tf):g.theta;
  return {logE:s.params.logP+g.logAStart+g.delta(t)+theta*lf,logShape:g.logAStart+g.delta(t)+theta*lf,theta,stage:g.name};
}
function pulseR0(s,xi) {
  if(xi<=0||xi>=11)return 0;
  const phi=xi>=.02?xi-.01:.02*checkedQuad(s,sourceStep,0,xi/.02);
  return phi*Math.exp(logOneMinusStep(xi-10));
}
function pulseLogR0(s,xi) {
  if(xi<=0||xi>=11)return -Infinity;
  const phi=xi>=.02?xi-.01:.02*checkedQuad(s,sourceStep,0,xi/.02);
  return phi>0?Math.log(phi)+logOneMinusStep(xi-10):-Infinity;
}
function exponentialBumpIntegral(s,exponent,offset=0,square=false,width=.3) {
  // The pulse rows have slope difference lambda, so their inverse costs
  // O(1/lambda). A generic field quadrature tolerance is insufficient here.
  return checkedQuad(s,t=>Math.exp(exponent*t)*(square?bump(t,0,width)**2:bump(t,0,width)),-width/2,width/2,Math.min(1e-13,s.tolerance/4096))*Math.exp(exponent*offset);
}
function pulseEndCorrections(s,eta) {
  const {lambda:l,logP,Md}=s.params,f=1/(1+eta*eta),lf=Math.log(f),end=s.pulse.length,centers=[end-3,end-1],k=t=>4*(1-sourceStep(Math.log1p(t)/Md)),cut=Math.exp(Md)-1;
  const K1=checkedQuad(s,t=>k(t)*Math.exp(t),0,cut),K2=checkedQuad(s,t=>k(t)**2*Math.exp(t),0,cut);
  const Jinit=checkedQuad(s,t=>Math.exp(1.6*t-.6*sigmaPrimitive(s,t)),0,1);
  const Mshape=4*Math.E+Math.E*K1,Jshape=4/1.6+4*Jinit+Math.exp(1.3)*K1,U2shape=16*Math.E+Math.E*K2;
  const slopes=[.5-l,.5-2*l];
  const B=slopes.map(a=>centers.map(c=>exponentialBumpIntegral(s,a,c-centers[0])));
  const zeroDebt=[eta===0?ZERO():signed(Math.sign(eta),Math.log(Math.abs(eta))+Math.log(Mshape)-s.pulse.start-logP-s.pulse.logAStart-lf),eta===0?ZERO():signed(Math.sign(eta),Math.log(Math.abs(eta))+Math.log(Jshape)-logP-1.5*s.pulse.start-2*s.pulse.logAStart-lf)];
  const d0=zeroDebt.map((v,i)=>shiftSL(negSL(v),-slopes[i]*centers[0]));
  const da=slopes.map(a=>{
    const first=logQuad(s,xi=>a/l*(xi-13)+3*a+pulseLogR0(s,xi)-Math.log(l),0,.02);
    // On [.02,10], R0(xi)=xi-.01, so integrate this weighted polynomial exactly.
    const anti=xi=>scaleSL(signed(1,a/l*(xi-13)+3*a),(xi-.01)/a-l/a**2);
    const middle=addSL(anti(10),negSL(anti(.02)));
    // On [10,11], use local t=xi-10 and a log ratio to the peak. This avoids
    // subtracting two log moments of size 1/lambda inside adaptive quadrature.
    const tail=logQuad(s,t=>a/l*(t-3)+3*a+Math.log(t+9.99)+logOneMinusStep(t)-Math.log(l),0,1,1e-14,
      (t,u)=>a/l*(t-u)+Math.log1p((t-u)/(u+9.99))+logOneMinusStep(t)-logOneMinusStep(u));
    return negSL(sumSL([first,middle,tail]));
  });
  function solveDebt(d) {const scale=Math.max(...d.filter(x=>x.sign).map(x=>x.logAbs));if(!Number.isFinite(scale))return {scale:0,c:[0,0],values:[ZERO(),ZERO()]};const solution=solveLinear(B,d.map(v=>relativeSL(v,scale)));return {scale,c:solution.solution,values:solution.solution.map(v=>shiftSL(sl(v),scale)),linearResidual:solution.residual};}
  const constant=solveDebt(d0),amplitude=solveDebt(da);
  return {centers,width:.3,slopes,matrix:B,constant,amplitude,normalizedDebts:{constant:d0,amplitude:da},U2shape,
    coefficientsAt:A=>constant.values.map((v,i)=>addSL(v,scaleSL(amplitude.values[i],A)))};
}

function solveQuadraticMap(s,B,Q,debt,tolerance=s.tolerance) {
  const nonzero=debt.filter(x=>x.sign),scale=nonzero.length?Math.max(...nonzero.map(x=>x.logAbs)):0,d=debt.map(x=>relativeSL(x,scale)),eps=Math.exp(scale);
  if(!Number.isFinite(eps))throw new ComputeError('PRECISION_REQUIRED','Normalized correction scale overflow');
  let c=solveLinear(B,d).solution;const history=[];
  for(let it=0;it<8;it++){s.budget.tick(B.length**3);const F=B.map((row,i)=>row.reduce((v,b,j)=>v+b*c[j]+eps*Q[i][j]*c[j]**2,0)-d[i]),r=Math.max(...F.map(Math.abs));history.push(r);if(r<tolerance/20)break;
    const J=B.map((row,i)=>row.map((b,j)=>b+2*eps*Q[i][j]*c[j])),step=solveLinear(J,F.map(x=>-x)).solution;c=c.map((x,i)=>x+step[i]);}
  const residual=B.map((row,i)=>row.reduce((v,b,j)=>v+b*c[j]+eps*Q[i][j]*c[j]**2,0)-d[i]);
  const inverseColumns=B.map((_,j)=>solveLinear(B,B.map((__,i)=>i===j?1:0)).solution),inverseNorm=Math.max(...B.map((_,i)=>inverseColumns.reduce((a,col)=>a+Math.abs(col[i]),0)));
  return {scale,c,values:c.map(x=>shiftSL(sl(x),scale)),debt,residual,normalizedResidual:Math.max(...residual.map(Math.abs)),history,inverseNorm,
    quadraticScaleUnderflow:scale<Math.log(Number.MIN_VALUE),quadraticScale:packSL(signed(1,scale)),quadraticRemainderLogUpper:scale+Math.log(Math.max(1e-300,...Q.map(row=>row.reduce((a,q,j)=>a+Math.abs(q)*c[j]**2,0))))};
}

function angularReset(s,eta) {
  const l=s.params.lambda,a=1-l,T=s.params.Tf,b=Math.log(2/(1+eta*eta));
  const incoming=shiftSL(s.rIInterpolationStartTransient,-a*T+b);
  const forced=b===0?ZERO():logQuad(s,z=>logStepPrime(z)+Math.log(b/a)-a*T*(1-z)+b*(1-sourceStep(z)),0,1);
  const atStart=addSL(incoming,forced),centers=[s.angular.length-3,s.angular.length-1];
  const debt=shiftSL(negSL(atStart),-a*centers[0]);
  const B=[centers.map(c=>exponentialBumpIntegral(s,a,c-centers[0])),centers.map(c=>2*exponentialBumpIntegral(s,-1-2*l,c-centers[0]))];
  const Q=[centers.map(()=>0),centers.map(c=>exponentialBumpIntegral(s,-1-2*l,c-centers[0],true))];
  const solved=solveQuadraticMap(s,B,Q,[debt,ZERO()]);
  const logPerturbationUpper=solved.values.some(v=>v.sign)?Math.max(...solved.values.map(v=>v.sign?v.logAbs+Math.log(64/.3):-Infinity))+Math.log(2):-Infinity;
  return {...solved,centers,width:.3,matrix:B,quadratic:Q,source:'A.11',pointwisePositiveBound:logPerturbationUpper<0,logRelativePerturbationUpper:Number.isFinite(logPerturbationUpper)?logPerturbationUpper:null};
}

function stageEnergyIntegral(s,g,eta) {
  const lf=Math.log(1/(1+eta*eta));
  if(g.constantSlope!==null){const rate=2*g.constantSlope+1,v=rate===0?g.length:Math.expm1(rate*g.length)/rate;return signed(1,g.energyLogStart+2*g.theta*lf+Math.log(v));}
  const v=checkedQuad(s,t=>{const theta=g.theta==='interpolation'?1-sourceStep(t/s.params.Tf):g.theta;return Math.exp(g.energyDelta(t)+2*theta*lf);},0,g.length);
  return signed(1,g.energyLogStart+Math.log(v));
}
function amplitudeEquation(s,eta,end,angular) {
  const {lambda:l,h,logP}=s.params,f=1/(1+eta*eta),lf=Math.log(f),normal=s.pulse.energyLogStart+2*lf;
  const energyTerms=[signed(1,2*lf-Math.log(1.2)),...s.stages.map(g=>stageEnergyIntegral(s,g,eta)),signed(1,s.logEndEnergy-Math.log(2*h))];
  // A.11 changes E^2 in its compact patch; pressure preservation does not make
  // its X-weighted S increment zero.
  for(let i=0;i<2;i++){
    const c=angular.values[i],center=angular.centers[i],base=s.angular.energyLogStart-2*l*center;
    const w1=exponentialBumpIntegral(s,-2*l),w2=exponentialBumpIntegral(s,-2*l,0,true);
    energyTerms.push(shiftSL(scaleSL(c,2*w1),base),shiftSL(scaleSL(mulSL(c,c),w2),base));
  }
  const eTotal=sumSL(energyTerms);
  let c0=scaleSL(shiftSL(eTotal,-normal),-.5*l),c1=ZERO();
  const innerU2=eta===0?ZERO():signed(1,2*Math.log(Math.abs(eta))+Math.log(end.U2shape)-2*logP-normal);
  c0=addSL(c0,scaleSL(innerU2,l));
  const Kb=[[0,.02],[.02,10],[10,11]].reduce((v,[a,b])=>v+checkedQuad(s,x=>Math.exp(-2*x)*pulseR0(s,x)**2,a,b),0);
  let c2=sl(Kb);
  for(let i=0;i<2;i++){
    const w=l*Math.exp(-2*l*end.centers[i])*exponentialBumpIntegral(s,-2*l,0,true),a=end.constant.values[i],b=end.amplitude.values[i];
    c0=addSL(c0,scaleSL(mulSL(a,a),w));c1=addSL(c1,scaleSL(mulSL(a,b),2*w));c2=addSL(c2,scaleSL(mulSL(b,b),w));
  }
  const coefficients=[c0,c1,c2],v=coefficients.map(asFloat),at=A=>v[0]+A*(v[1]+A*v[2]),deriv=A=>v[1]+2*A*v[2];
  const omitted=coefficients.flatMap((c,i)=>c.sign&&v[i]===0?[{power:i,coefficient:packSL(c),bracketContributionUpper:packSL(scaleSL(signed(1,c.logAbs),1.2**i))}]:[]);
  const bracket=[.9,1.2],endpointValues=bracket.map(at),minimumDerivative=Math.min(...bracket.map(deriv));
  const bracketPass=endpointValues[0]<0&&endpointValues[1]>0&&minimumDerivative>=.36;
  if(!bracketPass)return {source:'A.19',status:'SOURCE_BRACKET_NOT_ESTABLISHED',amplitude:null,coefficients:coefficients.map(packSL),coefficientValues:v,float64OmittedCoefficientTerms:omitted,Kb,endpointValues,minimumDerivative,requiredDerivativeFloor:.36,bracket,pointwiseNumericalSuccess:false};
  let a=.9,b=1.2;for(let i=0;i<70&&b-a>s.tolerance/16;i++){s.budget.tick();const m=(a+b)/2;if(at(m)>0)b=m;else a=m;}
  const A=(a+b)/2;
  const physicalSNormalizationLog=s.params.logXR+2*logP+normal-Math.log(l);
  return {source:'A.19',status:'POINTWISE_NUMERICAL_ROOT',amplitude:A,coefficients:coefficients.map(packSL),coefficientValues:v,float64OmittedCoefficientTerms:omitted,Kb,endpointValues,minimumDerivative,requiredDerivativeFloor:.36,bracket:[a,b],normalizedSMomentResidual:at(A),pointwiseNumericalSuccess:true,
    physicalSNormalizationLog,physicalSMomentResidualEstimate:packSL(shiftSL(sl(at(A)),physicalSNormalizationLog)),
    derivativeScope:'The .36 source estimate applies to the principal expression. This record evaluates the full corrected quadratic separately.',uniformEtaCertified:false,intervalArithmeticCertified:false};
}

function heatTaylorCoefficients(h,n) {
  const a=[1];for(let k=1;k<=n;k++)a.push(-a[k-1]*(h+(k-1))*(1+h+(k-1))/k);return a;
}
function heatMomentIntegral(s,p,foPower,chiPower) {
  if(!(p>0))throw new ComputeError('INVALID_INPUT','A.7 heat difference is integrable only with a positive decay exponent',{p});
  const key=`${p}/${foPower}/${chiPower}`;s.heatIntegralCache??=new Map();
  if(s.heatIntegralCache.has(key))return s.heatIntegralCache.get(key);
  const fn=t=>Math.exp(-p*t+foPower*s.logFo(t))*sourceStep((t-.2)/.3)**chiPower;
  // The potentially very slow n=1 angular tail has the exact integral
  // exp(-3 h)/h. No finite cutoff is used for the 1/h contribution.
  const v=checkedQuad(s,fn,.2,.5)+checkedQuad(s,fn,.5,1)+checkedQuad(s,fn,1,3)+Math.exp(-3*p)/p;
  s.heatIntegralCache.set(key,v);return v;
}
function momentMapAudit(s,B,Q,values,debt,normalizations,commonScale,factoredCoefficients=null,labels=['Cp','S','I']) {
  return B.map((row,i)=>{
    const terms=row.flatMap((b,j)=>[scaleSL(values[j],b),scaleSL(mulSL(values[j],values[j]),Q[i][j])]);
    let increment=sumSL(terms),residual=addSL(increment,negSL(debt[i]));
    if(factoredCoefficients){
      // Keep the common scale outside the cancellation. A nonzero debt below
      // binary64 range is retained as an extra signed-log residual term.
      const linear=row.reduce((v,b,j)=>v+b*factoredCoefficients[j],0),quadratic=Q[i].reduce((v,q,j)=>v+q*factoredCoefficients[j]**2,0);
      const target=relativeSL(debt[i],commonScale),qTerm=shiftSL(sl(quadratic),2*commonScale);
      increment=addSL(shiftSL(sl(linear),commonScale),qTerm);
      residual=addSL(shiftSL(sl(linear-target),commonScale),qTerm);
      if(target===0&&debt[i].sign)residual=addSL(residual,negSL(debt[i]));
    }
    const sumAbs=sumSL([...terms,debt[i]].map(v=>signed(v.sign?1:0,v.logAbs)));
    const roundingScale=scaleSL(sumAbs,128*Number.EPSILON);
    return {row:labels[i],increment:packSL(increment),target:packSL(debt[i]),residual:packSL(residual),
      residualInCommonScale:relativeSL(residual,commonScale),physicalResidual:packSL(shiftSL(residual,normalizations[i])),
      floatingRoundoffScale:packSL(roundingScale),physicalFloatingRoundoffScale:packSL(shiftSL(roundingScale,normalizations[i])),
      roundoffScope:'128*machineEpsilon*sum(abs(terms)) is a diagnostic scale only. It excludes quadrature, matrix-entry, logarithm/exponential and source-parameter errors; it is not a certified bound.',
      exactEqualityCertified:false};
  });
}

function heatCompensation(s,eta,order=3) {
  const {lambda:l,h,logP,logXR}=s.params,d=1-eta*eta,f=1/(1+eta*eta),alpha=-.5-l;
  const patch=s.reserved.find(x=>x.id==='I2-heat'),yStar=patch.start,logXStar=logXR+yStar;
  const logEStar=logP+s.power.logAStart+alpha*(yStar-s.power.start);
  const norm=[2*logEStar,logXStar+2*logEStar,1.5*logXStar+logEStar];
  const centers=[Math.exp(1),Math.exp(2.5),Math.exp(4)],widths=centers.map(c=>.15*c);
  const B=[[],[],[]],Q=[[],[],[]];
  for(let i=0;i<3;i++){
    const c=centers[i],w=widths[i],at=(fn,square=false)=>checkedQuad(s,x=>fn(x)*(square?bump(x,c,w)**2:bump(x,c,w)),c-w/2,c+w/2);
    B[0].push(at(x=>f*x**(alpha-1)));B[1].push(at(x=>-f*x**alpha));B[2].push(at(x=>Math.SQRT2*Math.sqrt(x)));
    Q[0].push(at(x=>.5/x,true));Q[1].push(at(()=>-.5,true));Q[2].push(0);
  }
  const coeff=heatTaylorCoefficients(h,order+1),logZ=d===0?-Infinity:Math.log(2*d)-s.logXtail;
  const changes=[[],[],[]],tails=[[],[],[]];
  if(d>0){
    for(let n=1;n<=order;n++){
      s.budget.tick();
      changes[0].push(signed(Math.sign(coeff[n]),2*s.logEPowTail+n*logZ+Math.log(Math.abs(coeff[n])*heatMomentIntegral(s,n+1+2*h,2,1))-norm[0]));
      changes[1].push(signed(-Math.sign(coeff[n]),s.logXtail+2*s.logEPowTail+n*logZ+Math.log(Math.abs(coeff[n])*heatMomentIntegral(s,n+2*h,2,1))-norm[1]));
      changes[2].push(signed(Math.sign(coeff[n]),1.5*s.logXtail+s.logEPowTail+n*logZ+Math.log(Math.SQRT2*Math.abs(coeff[n])*heatMomentIntegral(s,n-1+h,1,1))-norm[2]));
      for(let m=1;m<=order;m++){
        s.budget.tick();const a=.5*coeff[n]*coeff[m],k=n+m;
        changes[0].push(signed(Math.sign(a),2*s.logEPowTail+k*logZ+Math.log(Math.abs(a)*heatMomentIntegral(s,k+1+2*h,2,2))-norm[0]));
        changes[1].push(signed(-Math.sign(a),s.logXtail+2*s.logEPowTail+k*logZ+Math.log(Math.abs(a)*heatMomentIntegral(s,k+2*h,2,2))-norm[1]));
      }
    }
    const n=order+1,an=Math.abs(coeff[n]);
    const smallnessLog=Math.log(coeff.slice(1).reduce((v,a)=>v+Math.abs(a),0))+logZ;
    if(!(logZ<=0&&smallnessLog<Math.log(.25)))throw new ComputeError('PRECISION_REQUIRED','Supported heat remainder estimate requires Z_tail <= 1 and a small finite Taylor correction',{logZ,smallnessLog});
    // Taylor's finite remainder follows from A.34--A.35, for Z >= 0.
    // If |D_N|+|R| < 1/4, the error in the half-square moment is bounded
    // by 1.5 |R| E_cl^2. I is linear. The numerical integrals are not interval certified.
    tails[0].push(signed(1,2*s.logEPowTail+n*logZ+Math.log(1.5*an*heatMomentIntegral(s,n+1+2*h,2,1))-norm[0]));
    tails[1].push(signed(1,s.logXtail+2*s.logEPowTail+n*logZ+Math.log(1.5*an*heatMomentIntegral(s,n+2*h,2,1))-norm[1]));
    tails[2].push(signed(1,1.5*s.logXtail+s.logEPowTail+n*logZ+Math.log(Math.SQRT2*an*heatMomentIntegral(s,n-1+h,1,1))-norm[2]));
  }
  const change=changes.map(sumSL),debt=change.map(negSL),remainder=tails.map(sumSL),solved=solveQuadraticMap(s,B,Q,debt);
  const perturbationUpper=sumSL(solved.values.map((v,i)=>scaleSL(signed(v.sign?1:0,v.logAbs),64/widths[i])));
  const lowerLog=Math.log(f)+alpha*5,logRelative=perturbationUpper.sign?perturbationUpper.logAbs-lowerLog:-Infinity;
  const audit=momentMapAudit(s,B,Q,solved.values,debt,norm,solved.scale,solved.c);
  return {...solved,source:'A.7 / A.39--A.43',patch,logXStar,logEStar,alpha,f,centers,widths,matrix:B,quadratic:Q,normalizationLogs:norm,
    heatOrder:order,heatCoefficients:coeff,logZTail:logZ,heatChanges:change,heatRemainderBounds:remainder,
    heatTerms:changes,momentAudit:audit,pointwisePositiveBound:logRelative<0,logRelativePerturbationUpper:Number.isFinite(logRelative)?logRelative:null,
    exactMomentsCertified:false,allEtaCertified:false,
    remainderContract:{formula:'|H(Z)-sum_{n=0}^N (-1)^n(h)_n(1+h)_n Z^n/n!| <= (h)_(N+1)(1+h)_(N+1) Z^(N+1)/(N+1)!',domain:'Z >= 0, h > 0',kind:'FINITE_TAYLOR_BOUND',boundEvaluation:'FLOAT64_WITH_SIGNED_LOG_SCALE',intervalCertified:false},
    uniformHeatValueBound:{formula:'0 <= 1-H(2(1-eta^2)/X) <= 2 h(1+h)/X',domain:'X >= Xtail, |eta| <= 1, h > 0',
      relativeChangeLogUpperAtXtail:Math.log(2)+Math.log(h)+Math.log1p(h)-s.logXtail,derivativeOrdersCovered:0,
      source:'A.34 and the finite first-order Taylor bound',sourceFormulaOnly:true,intervalArithmeticCertified:false},
    limits:['The polynomial is a finite Taylor approximation to the original gamma-integral heat factor, with an explicit remainder.',
      'Three moment increments are evaluated as 2 E deltaE + deltaE^2 and linear deltaE, not by subtracting rounded fields.',
      'At extreme scale separation, a common-scale residual can be small while its ratio to a much smaller individual heat debt is large. No exact moment equality is certified.']};
}

function etaPowerJet(eta,a,n,budget=null) {
  budget?.tick(n+1);
  const b=1+eta*eta,c=[b**(-a)];
  for(let k=0;k<n;k++)c.push(-(2*eta*(k+a)*c[k]+(k? (k-1+2*a)*c[k-1]:0))/(b*(k+1)));
  return c;
}
function pressureStageJet(s,g,eta,n) {
  if(g.constantSlope!==null){
    const rate=2*g.constantSlope,v=Math.expm1(rate*g.length)/rate,jet=etaPowerJet(eta,2*g.theta,n,s.budget);
    return jet.map(c=>shiftSL(sl(-.5*v*c),2*g.logAStart));
  }
  const terms=[];
  for(let k=0;k<=n;k++){
    const val=checkedQuad(s,t=>{const theta=g.theta==='interpolation'?1-sourceStep(t/s.params.Tf):g.theta;
      return Math.exp(2*g.delta(t))*etaPowerJet(eta,2*theta,n,s.budget)[k];},0,g.length);
    terms.push(shiftSL(sl(-.5*val),2*g.logAStart));
  }
  return terms;
}

/** Actual A.21 Taylor coefficients Pi^(k)(eta)/k!, not a fitted rational datum. */
export function pressureJet(schedule,eta,order=4) {
  const s=schedule;bounded(eta,'eta',-1,1);bounded(order,'pressureOrder',0,54,true);
  const parts=[{stage:'reference-inner',values:etaPowerJet(eta,2,order,s.budget).map(v=>sl(-2.5*v))}];
  for(const g of s.stages){s.budget.tick();parts.push({stage:g.name,values:pressureStageJet(s,g,eta,order)});}
  const tail=Array.from({length:order+1},(_,k)=>k?ZERO():signed(-1,2*s.logEndA-Math.log(2*(1+2*s.params.h))));
  parts.push({stage:'infinite-power-tail',values:tail});
  const norm=Array.from({length:order+1},(_,k)=>sumSL(parts.map(x=>x.values[k]))),full=norm.map(v=>shiftSL(v,2*s.params.logP));
  const coefficients=full.map(asFloat);if(coefficients.some(x=>!Number.isFinite(x)))throw new ComputeError('PRECISION_REQUIRED','Pressure jet cannot be represented as finite Taylor coefficients');
  const coefficientTerms=Array.from({length:order+1},(_,k)=>parts.map(p=>({stage:p.stage,value:packSL(shiftSL(p.values[k],2*s.params.logP))})).filter(p=>p.value.sign));
  return {family:'source-outer-A21',eta,order,coefficients,coefficientConvention:'Pi^(k)(eta)/k!',normalizedByPSquared:norm.map(asFloat),signedLogCoefficients:full.map(packSL),coefficientTerms,
    analyticDefinition:'Pi0(eta) = -1/2 integral_R E_id,sched(y,eta)^2 dy',source:'A.21--A.23',
    derivativeRecurrence:'c[k+1] = -(2 eta (k+a)c[k] + (k-1+2a)c[k-1])/((1+eta^2)(k+1)), a=2 theta',
    innerAndExteriorInfiniteIntegrals:'ANALYTIC_EXPONENTIAL_INTEGRATION',independentOfXR:true,exactEvenFamilyByDefinition:true,
    globalHolomorphicCertificate:false,commonComplexNeighborhoodRadius:null,uniformJetErrorCertified:false,
    datumStatus:'SOURCE_DEFINED_NUMERICAL_JET',laterMomentRestorationExact:false};
}
export function pressureDatum(schedule,eta) {return pressureJet(schedule,eta,0);}

function packCorrection(c,kind) {
  const out={source:kind,centers:c.centers,width:c.width??null,widths:c.widths??null,matrix:c.matrix,quadratic:c.quadratic??null,
    values:c.values.map(packSL),factoredValues:c.c.map(mantissa=>({logScale:c.scale,mantissa})),normalizingLogScale:c.scale,normalizedCoefficients:c.c,normalizedResidual:c.normalizedResidual,
    normalizedResidualRows:c.residual,inverseInfinityNorm:c.inverseNorm,iterationResiduals:c.history,
    pointwisePositiveBound:c.pointwisePositiveBound,logRelativePerturbationUpper:c.logRelativePerturbationUpper,
    quadraticScaleUnderflow:c.quadraticScaleUnderflow,quadraticScale:c.quadraticScale,quadraticRemainderLogUpper:c.quadraticRemainderLogUpper,
    certificate:'NONE_POINTWISE_NUMERICS',exactMomentEquality:false,allEtaCertified:false,momentAudit:c.momentAudit??null};
  return out;
}

/** Internal computational slice, with closures; runOuterConstruction exports only data. */
export function solveOuterSlice(schedule,eta,options={}) {
  const s=schedule;bounded(eta,'eta',-1,1);const order=bounded(options.heatOrder??3,'heatOrder',1,5,true);
  const end=pulseEndCorrections(s,eta),angular=angularReset(s,eta),amplitude=amplitudeEquation(s,eta,end,angular);
  const yc=s.angular.start+angular.centers[0],logEc=s.params.logP+s.angular.logAStart+(-.5-s.params.lambda)*angular.centers[0];
  angular.momentAudit=momentMapAudit(s,angular.matrix,angular.quadratic,angular.values,angular.debt,
    [1.5*(s.params.logXR+yc)+Math.log(2)/2+logEc,2*logEc],angular.scale,angular.c,['I','2Cp']);
  if(!amplitude.pointwiseNumericalSuccess)return {schedule:s,eta,end,angular,amplitude,heat:null,status:'PRECISION_OR_PARAMETER_CONTRACT_REQUIRED'};
  const heat=heatCompensation(s,eta,order),coeff=end.coefficientsAt(amplitude.amplitude);
  const logXp=s.params.logXR+s.pulse.start,logEp=s.params.logP+s.pulse.logAStart-Math.log(1+eta*eta);
  const momentNorm=[logXp+logEp+end.slopes[0]*end.centers[0],1.5*logXp+Math.log(2)/2+2*logEp+end.slopes[1]*end.centers[0]];
  const endRows=end.matrix.map((row,i)=>{
    const debt=addSL(end.normalizedDebts.constant[i],scaleSL(end.normalizedDebts.amplitude[i],amplitude.amplitude));
    const inc=sumSL(row.map((b,j)=>scaleSL(coeff[j],b))),res=addSL(inc,negSL(debt));
    const common=Math.max(inc.logAbs,debt.logAbs),sumAbs=sumSL([...row.map((b,j)=>scaleSL(signed(coeff[j].sign?1:0,coeff[j].logAbs),Math.abs(b))),signed(debt.sign?1:0,debt.logAbs)]);
    return {row:['M','J'][i],increment:packSL(inc),target:packSL(debt),residual:packSL(res),relativeCommonResidual:relativeSL(res,common),
      physicalNormalizationLog:momentNorm[i],physicalResidualEstimate:packSL(shiftSL(res,momentNorm[i])),
      roundoffScale:packSL(scaleSL(sumAbs,128*Number.EPSILON)),exactEqualityCertified:false};
  });
  return {schedule:s,eta,end,angular,amplitude,heat,endCoefficients:coeff,endRows,status:'POINTWISE_COMPONENTS_EVALUATED'};
}

function heatAt(s,heat,eta,t) {
  const d=1-eta*eta,chi=sourceStep((t-.2)/.3);
  if(d===0||chi===0)return {relative:ZERO(),remainder:ZERO(),terms:[],polynomialODEResidual:t>=3?ZERO():null};
  const logZ=Math.log(2*d)-s.logXtail-t,terms=[];
  for(let k=1;k<=heat.heatOrder;k++)terms.push(shiftSL(sl(chi*heat.heatCoefficients[k]),k*logZ));
  const n=heat.heatOrder+1,remainder=shiftSL(sl(chi*Math.abs(heat.heatCoefficients[n])),n*logZ);
  const polynomialODEResidual=t>=3?shiftSL(sl(-n*heat.heatCoefficients[n]),heat.heatOrder*logZ):null;
  return {relative:sumSL(terms),remainder,terms,polynomialODEResidual};
}

export function evaluateOuterSlice(slice,point) {
  const s=slice.schedule;plainJSON(point);const y=bounded(point.logXOverXR,'logXOverXR',-100,s.end+100),eta=slice.eta;
  if(!slice.amplitude.pointwiseNumericalSuccess)throw new ComputeError('UNCERTIFIED_PARAMETERS','A valid source bracket is required before field evaluation');
  s.budget.tick(10);const raw=rawShape(s,y,eta);let E=signed(1,raw.logE),U=ZERO(),angularEdit=ZERO(),patchEdit=ZERO(),heatEdit=ZERO(),heatRemainder=ZERO(),heatPolynomialODEResidual=null;
  if(y<=s.initial.end)U=sl(4*eta);
  else if(y<=s.decay.end){const t=y-s.decay.start;U=scaleSL(signed(1,Math.log(4)+logOneMinusStep(Math.log1p(t)/s.params.Md)),eta);}
  if(y>=s.pulse.start&&y<=s.pulse.end){
    const t=y-s.pulse.start,rb=[shiftSL(sl(slice.amplitude.amplitude),pulseLogR0(s,s.params.lambda*t))];
    for(let i=0;i<2;i++)rb.push(shiftSL(slice.endCoefficients[i],logBump(t,slice.end.centers[i],slice.end.width)));
    U=shiftSL(sumSL(rb),raw.logE);
  }
  if(y>=s.angular.start&&y<=s.angular.end){
    const t=y-s.angular.start;angularEdit=sumSL(slice.angular.values.map((v,i)=>shiftSL(v,logBump(t,slice.angular.centers[i],slice.angular.width))));
    E=addSL(E,shiftSL(angularEdit,raw.logE));
  }
  const heat=slice.heat;
  if(y>=heat.patch.start&&y<=heat.patch.end){
    const x=Math.exp(y-heat.patch.start);patchEdit=shiftSL(sumSL(heat.values.map((v,i)=>shiftSL(v,logBump(x,heat.centers[i],heat.widths[i])))),heat.logEStar);E=addSL(E,patchEdit);
  }
  if(y>=s.terminal.start+.2){
    const ht=heatAt(s,heat,eta,y-s.terminal.start);heatEdit=shiftSL(ht.relative,raw.logE);heatRemainder=shiftSL(ht.remainder,raw.logE);heatPolynomialODEResidual=ht.polynomialODEResidual;E=addSL(E,heatEdit);
  }
  if(E.sign!==1)throw new ComputeError('PRECISION_REQUIRED','Computed positive E lost positivity');
  return {eta,logXOverXR:y,stage:raw.stage,physicalX:packSL(signed(1,s.params.logXR+y)),physicalE:packSL(E),physicalU:packSL(U),
    logEOverP:E.logAbs-s.params.logP,baseE:packSL(signed(1,raw.logE)),
    corrections:{angularRelative:packSL(angularEdit),heatPatchAdditiveE:packSL(patchEdit),tailHeatAdditiveE:packSL(heatEdit),tailHeatRemainderUpper:packSL(heatRemainder)},
    heatPolynomialODE:heatPolynomialODEResidual?{residual:packSL(heatPolynomialODEResidual),operator:'Z^2 H_Ndd + (1+2(1+h)Z) H_Nd + h(1+h) H_N',
      formula:'-(N+1) a[N+1] Z^N',scope:'Residual of the finite Taylor polynomial, not of the exact gamma-integral heat factor',certifiedStressVanishing:false}:null,
    heatFactor:'A.32 finite Taylor approximation with remainder',exactFieldCertified:false};
}

function sampleCoordinates(s,slice,count) {
  const critical=[-1,0,...s.stages.flatMap(g=>[g.start,g.end])];
  for(const c of slice.end.centers)critical.push(s.pulse.start+c);
  for(const c of slice.angular.centers)critical.push(s.angular.start+c);
  for(const c of slice.heat.centers)critical.push(slice.heat.patch.start+Math.log(c));
  critical.push(s.terminal.start+.2,s.terminal.start+.5,s.terminal.start+1,s.terminal.start+2,s.end+5);
  // Include the pulse maximum region and both compact end corrections even when
  // the full log interval has length > 10^5. This is a nonuniform displayed mesh.
  for(const x of [.02,.5,1,2,4,8,10,10.5,11])critical.push(s.pulse.start+x/s.params.lambda);
  let v=[...new Set(critical)].sort((a,b)=>a-b);
  if(v.length>count){const keep=new Set([0,v.length-1]);for(let k=1;k<count-1;k++)keep.add(Math.round(k*(v.length-1)/(count-1)));v=[...keep].sort((a,b)=>a-b).map(i=>v[i]);}
  while(v.length<count){s.budget.tick(v.length);let best=0;for(let i=1;i<v.length-1;i++)if(v[i+1]-v[i]>v[best+1]-v[best])best=i;v.splice(best+1,0,(v[best]+v[best+1])/2);}
  return v;
}
function packSlice(slice,pressure,samples) {
  const e=slice.end,a=slice.amplitude;
  const result={eta:slice.eta,status:slice.status,amplitude:a,pressure,samples,
    pulseEndCorrection:{source:'A.15',centers:e.centers,width:e.width,slopes:e.slopes,matrix:e.matrix,
      affineConstant:e.constant.values.map(packSL),affineAmplitude:e.amplitude.values.map(packSL),
      values:slice.endCoefficients?.map(packSL)??null,momentRows:slice.endRows??null,exactEqualityCertified:false},
    angularReset:packCorrection(slice.angular,'A.11'),heatCompensation:null};
  if(slice.heat){const h=slice.heat;result.heatCompensation={...packCorrection(h,'A.7'),patch:h.patch,alpha:h.alpha,f:h.f,
    logXStar:h.logXStar,logEStar:h.logEStar,normalizationLogs:h.normalizationLogs,heatOrder:h.heatOrder,
    heatTaylorCoefficients:h.heatCoefficients,logZTail:Number.isFinite(h.logZTail)?h.logZTail:null,
    heatChanges:h.heatChanges.map(packSL),heatRemainderBounds:h.heatRemainderBounds.map(packSL),
    heatIncrementTerms:h.heatTerms.map(a=>a.map(packSL)),momentAudit:h.momentAudit,remainderContract:h.remainderContract,uniformHeatValueBound:h.uniformHeatValueBound,limits:h.limits};}
  return result;
}
function jsonFinite(value,path='result') {
  if(typeof value==='number'&&!Number.isFinite(value))throw new ComputeError('PRECISION_REQUIRED','Nonfinite result',{path});
  if(typeof value==='function'||typeof value==='undefined'||typeof value==='bigint')throw new ComputeError('INTERNAL_ERROR','Result is not plain serializable JSON',{path});
  if(Array.isArray(value))value.forEach((x,i)=>jsonFinite(x,`${path}[${i}]`));
  else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))jsonFinite(v,`${path}.${k}`);
}

/** Public bounded, JSON-only facade used by ns.source-outer. */
export function runOuterConstruction(input={},budget=makeBudget()) {
  const normalized=normalizeOuterInput(input,budget.maxPoints),count=normalized.samplesPerEta,order=normalized.pressureOrder,heatOrder=normalized.heatOrder,etaValues=normalized.etas;
  const pars=normalized.parameters;
  const s=prepareOuterSchedule(pars,budget,{tolerance:normalized.tolerance}),slices=[];
  for(const eta of etaValues){budget.tick();const slice=solveOuterSlice(s,eta,{heatOrder}),p=pressureJet(s,eta,order);
    const samples=slice.amplitude.pointwiseNumericalSuccess?sampleCoordinates(s,slice,count).map(logXOverXR=>evaluateOuterSlice(slice,{logXOverXR})):[];
    slices.push(packSlice(slice,p,samples));}
  const allPointwise=slices.every(x=>x.amplitude.pointwiseNumericalSuccess&&Math.abs(x.amplitude.normalizedSMomentResidual)<=s.tolerance&&x.pulseEndCorrection.momentRows.every(r=>Math.abs(r.relativeCommonResidual)<=s.tolerance)&&x.angularReset.pointwisePositiveBound&&x.angularReset.normalizedResidual<=s.tolerance&&x.heatCompensation?.pointwisePositiveBound&&x.heatCompensation.normalizedResidual<=s.tolerance&&x.heatCompensation.momentAudit.every(r=>Math.abs(r.residualInCommonScale)<=s.tolerance)),points=slices.flatMap(x=>x.samples.map(p=>({pos:[p.logXOverXR,p.eta,p.logEOverP],value:p.logEOverP,label:`${p.stage}; eta=${p.eta}`})));
  const result={schema:'MathScope.SourceOuterConstruction/1',kind:'ns.source-outer',status:'PARTIAL',normalizedInput:{...normalized,parameters:pars},
    source:OUTER_SOURCES,model:{family:'Original scheduled ideal outer profile A.2--A.7',coordinate:'y=log(X/XR), X=r^2/(2L)',
      upstreamParametersCertified:false,regularAxisAttached:false,controlledContinuationAttached:false,stressFieldConstructed:false,originalGlobalWitnessCertified:false},
    stages:s.stages.map(({name,start,end,length,theta,logAStart,logAEnd,energyLogStart,energyLogEnd,constantSlope})=>({name,start,end,length,theta,logAStart,logAEnd,energyLogStart,energyLogEnd,constantSlope})),
    reservedPatches:s.reserved,terminal:{...s.terminalAudit,logXtail:s.logXtail,logCInfinity:s.logCInfinity,logEPowAtTail:s.logEPowTail,
      rho:s.rho,exactTerminalMomentCertified:false},necessaryParameterChecks:s.necessaryParameterChecks,upstreamContracts:s.upstreamContracts,slices,
    componentStatus:{scheduledField:'COMPUTED',amplitude:allPointwise?'POINTWISE_NUMERICAL_ROOTS':'PARAMETER_OR_PRECISION_FAILURE',
      affineMJ:'SIGNED_LOG_NUMERICAL_SOLVE',angularReset:'NORMALIZED_NUMERICAL_SOLVE',heatCompensation:'FINITE_TAYLOR_REMAINDER_AND_NORMALIZED_NUMERICAL_SOLVE',
      pressure:'ACTUAL_A21_JETS',stressSupport:'CONDITIONAL_SOURCE_REQUIREMENTS_ONLY'},
    certifiedConditions:{entireEtaInterval:false,sourceParameterSmallness:false,exactFiveMoments:false,strictStressCone:false,analyticAxisMatched:false,
      globalNavierStokesWitness:false},
    numericalAudit:{quadratureEvaluations:s.quadratureEvaluations,maxLocalQuadratureEstimate:s.maxLocalQuadratureEstimate,ratioRKErrorEstimate:s.ratioRKErrorEstimate,
      terminalRKErrorEstimate:s.terminalRKErrorEstimate,method:'adaptive Simpson, RK4 refinement, signed-log arithmetic, finite Taylor remainder',intervalArithmetic:false,
      pointwiseFiniteResidualChecksPassed:allPointwise,requestedNormalizedTolerance:s.tolerance,
      residualMeaning:'Pointwise finite computation. Small or rounded-zero residuals do not prove exact identities.'},
    stressSupport:{axialSupportEndsAtLogXOverXR:s.pulse.end,heatEditBeginsAtLogXOverXR:s.terminal.start+.2,
      pureHeatFactorBeyondLogXOverXR:s.end,exactExteriorStressVanishingCertified:false,source:'Lemma A.8',
      structuralChecks:{pulseBumpsStrictlyInsidePulse:s.pulse.length-3-.15>0&&s.pulse.length-1+.15<s.pulse.length,
        angularBumpsStrictlyInsideAngularPatch:s.angular.length-3-.15>0&&s.angular.length-1+.15<s.angular.length,
        heatCompensationStrictlyBeforeTerminal:s.reserved[1].end<s.terminal.start+.2,
        threeHeatBumpsStrictlyInsideReservedPatch:[1,2.5,4].every(t=>t+Math.log(1-.075)>0&&t+Math.log(1+.075)<5)},
      structuralCheckScope:'Support placement of the source formulas only; not a proof that the reconstructed stress exists or vanishes.',
      missing:['Regular smooth axis and the exact five matching moment conditions','Uniform eta bounds and strict stress-cone margins','Exact heat factor or a certified error transfer to the stress']},
    visualization:{points,lines:slices.filter(x=>x.samples.length).map(x=>({points:x.samples.map(p=>[p.logXOverXR,p.eta,p.logEOverP])})),arrows:[],
      axes:['log(X/XR)','eta','log(E/P*)'],description:'Actual sampled source outer profile in logarithmic graph coordinates, including recorded corrections.',
      coordinateMeaning:'The scene is a graph of the computed profile, not a Cartesian projection of a spatial flow. Physical X, E and U are stored in each sample as signed logarithms.',
      lostInformation:['Only finitely many eta slices are sampled.','Very small edits are preserved numerically in signed-log records but may be visually indistinguishable.','Finite Taylor approximation and quadrature uncertainty are not displayed as proof bounds.']},
    limits:['No pointwise calculation is promoted to an all-eta source-profile certificate.',
      'No exact nonlinear moment identity follows from a Float64 residual, even if subtraction rounds to zero.',
      'Small dimensionless residuals may correspond to large dimensional moment errors because the scheduled radii are extremely large; physical residual scales are therefore retained.',
      'The ideal inner reference is not the regular-axis solution required for the paper witness.',
      'Sufficiently-small and sufficiently-large upstream choices have not been supplied with uniform quantitative certificates.']};
  jsonFinite(result);return result;
}
