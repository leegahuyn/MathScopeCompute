import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import * as LegacyGauge from '../../mathscope-m1/gauge/index.mjs';
import {finiteSpectralModel} from '../../mathscope-m1/gauge/family.mjs';
import {fromSimilarity} from '../../mathscope-m1/navier/coordinates.mjs';
import {constructLeadingCandidate} from '../../mathscope-m1/navier/profile.mjs';
import {makeBudget} from '../../mathscope-m1/navier/numerics.mjs';
import * as Gauge from '../gauge/index.mjs';
import {complexBasis} from './complex-basis.mjs';

const clone=x=>JSON.parse(JSON.stringify(x));
const KINDS=['observation.delta-family','observation.gauge-4d','observation.blowup-pair','observation.complex-basis'];
const MODES=['ASSUMED_BOUND','UNITS','EFFECTIVE_MODEL','ENSEMBLE_ESTIMATE'];
const OPERATIONS=['SLICE','FINITE_MARGINAL','CONDITIONAL_MEAN','WILSON_OPEN','WILSON_CLOSED'];
function requireInput(ok,message,code='INVALID_INPUT'){if(!ok)throw Object.assign(Error(message),{code});}
function number(x,min,max){return typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;}
function integer(x,min,max){return Number.isInteger(x)&&number(x,min,max);}
function keys(input,allowed){requireInput(input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).every(k=>allowed.includes(k)),'Unexpected observation input field');}
function fieldRequest(mode='ASSUMED_BOUND',delta=1){
  const r=clone(LegacyGauge.getExamples().find(e=>e.id==='su3-bpst').request);
  r.input.group={family:'SU',parameter:2,globalForm:'SIMPLY_CONNECTED',representation:'DEFINING'};
  r.input.observation.samplesPerAxis=5;r.input.verify={field:true,densityQuadrature:false};
  r.input.family={mode,delta,referenceDelta:1,energyUnits:'hbar*c/ell0',assumptionId:'I2-explicit-finite-family',...(mode==='EFFECTIVE_MODEL'?{rhoOverEll:1}:{})};
  return r;
}
function ensembleRequest(delta,seed){
  const r=clone(Gauge.getExamples().find(e=>e.request.kind==='gauge.ensemble').request);
  r.input.beta=delta;r.input.sampler.samples=32;r.input.sampler.burnIn=16;r.input.sampler.thin=1;r.input.sampler.seed=seed;
  return r;
}
export function validateRequest(request){
  try{
    requireInput(KINDS.includes(request?.kind),'Unknown observation kind');const x=request.input;
    requireInput(!request.precision||Object.keys(request.precision).every(k=>['mode','tolerance'].includes(k)),'Unknown observation precision field');
    requireInput(!request.precision?.mode||request.precision.mode===(request.kind==='observation.complex-basis'?'EXACT_INTEGER':'FLOAT64'),'Unsupported observation precision','PRECISION_REQUIRED');
    requireInput(request.precision?.tolerance===undefined||request.precision.tolerance===1e-8,'Observation tolerance is fixed at 1e-8','PRECISION_REQUIRED');
    if(request.kind==='observation.delta-family'){
      keys(x,['mode','deltas','seed']);requireInput(MODES.includes(x.mode),'Choose an explicit Delta mode');requireInput(Array.isArray(x.deltas)&&x.deltas.length===2&&x.deltas.every(v=>number(v,.1,2))&&x.deltas[0]!==x.deltas[1],'Choose two distinct Delta values in [0.1,2]');requireInput(typeof x.seed==='string'&&x.seed.length>0&&x.seed.length<=64,'A bounded deterministic seed is required');
      if(x.mode==='ENSEMBLE_ESTIMATE')for(const d of x.deltas){const q=ensembleRequest(d,x.seed),v=Gauge.validateRequest(q);requireInput(v.ok,JSON.stringify(v.errors),v.code);}
    }else if(request.kind==='observation.gauge-4d'){
      keys(x,['operation','slice','fibre','panels']);requireInput(OPERATIONS.includes(x.operation),'Unknown 4D observation');requireInput(number(x.slice,-4,4),'x4 slice must lie in [-4,4]');requireInput(Array.isArray(x.fibre)&&x.fibre.length===2&&x.fibre.every(v=>number(v,-4,4))&&x.fibre[0]<x.fibre[1],'Finite ordered x4 interval required');requireInput(integer(x.panels,4,64)&&x.panels%2===0,'Use an even quadrature count in [4,64]');
    }else if(request.kind==='observation.blowup-pair'){
      keys(x,['taus','h','viscosity']);requireInput(Array.isArray(x.taus)&&x.taus.length>=2&&x.taus.length<=6&&x.taus.every(v=>number(v,0,1)),'Use 2..6 tau values in [0,1]');requireInput(number(x.h,.0001,.009),'The selected finite candidate needs h in [0.0001,0.009]');requireInput(number(x.viscosity,.01,10),'Viscosity must lie in [0.01,10]');
    }else{
      keys(x,['p','N','D','basis']);requireInput([2,3,5,7].includes(x.p)&&integer(x.N,1,16)&&integer(x.D,1,8),'Bounded prime, precision and degree are required');requireInput(['ORIGINAL','REVERSE','SHEAR'].includes(x.basis),'Unknown integral basis change');
    }
    const estimate=request.kind==='observation.blowup-pair'?30000000:request.kind==='observation.delta-family'&&x.mode==='ENSEMBLE_ESTIMATE'?40000000:2000000;
    requireInput((request.budget?.maxOperations??50000000)>=estimate,'Observation source computation exceeds the requested operation budget','BUDGET_EXCEEDED');
    requireInput((request.budget?.maxItems??250000)>=4096,'Observation item budget must allow its source records','BUDGET_EXCEEDED');
    return {ok:true,estimate:{operations:estimate}};
  }catch(e){return {ok:false,code:e.code||'INVALID_INPUT',errors:[e.message]};}
}
async function child(kind,result,input){return {kind,result,input,modelHash:result.modelHash??result.hashes?.physicalField??await sha256({kind,input}),sampleHash:await sha256(result.sourceSamples??result.points??result.replicas?.map(r=>r.history)??result.results??result),observationHash:await sha256(result.visualization??result)};}
function correlation(history){
  const xs=history.filter(p=>p.phase==='RETAINED'||p.retained===true).map(p=>p.action);
  const values=xs.length?xs:history.filter(p=>p.phase!=='BURN_IN').map(p=>p.action);
  const mean=values.reduce((a,b)=>a+b,0)/(values.length||1),variance=values.reduce((a,b)=>a+(b-mean)**2,0)/(values.length||1);
  return Array.from({length:Math.min(9,values.length)},(_,lag)=>({lag,value:variance>0?values.slice(lag).reduce((a,b,i)=>a+(b-mean)*(values[i]-mean),0)/((values.length-lag)*variance):null,samples:values.length-lag}));
}
export function verifyCorrelatorFamily(states,mode){
  let maxError=0;
  for(const s of states){
    if(mode==='ENSEMBLE_ESTIMATE'){
      const xs=s.result.replicas[0].history.filter(p=>p.phase!=='BURN_IN').map(p=>p.action),n=xs.length,mu=xs.reduce((a,b)=>a+b,0)/n,v=xs.reduce((a,b)=>a+(b-mu)*(b-mu),0)/n;
      for(const p of s.correlator){let total=0;for(let i=0;i<n-p.lag;i++)total+=(xs[i]-mu)*(xs[i+p.lag]-mu);const expected=v>0?total/((n-p.lag)*v):null;if(expected===null){if(p.value!==null)return {pass:false,maxError:null};}else{if(!Number.isFinite(p.value))return {pass:false,maxError:null};maxError=Math.max(maxError,Math.abs(expected-p.value));}}
    }else{
      const energies=s.spectral.model.diagonal.slice(1),weights=s.spectral.model.weights;
      for(const p of s.correlator){let expected=0;for(let i=0;i<energies.length;i++)expected+=weights[i]*Math.exp(-energies[i]*p.time/s.spectral.model.hbar);if(!Number.isFinite(p.correlation))return {pass:false,maxError:null};maxError=Math.max(maxError,Math.abs(expected-p.correlation));}
    }
  }
  if(['ASSUMED_BOUND','UNITS'].includes(mode))for(let i=0;i<states[0].correlator.length;i++)maxError=Math.max(maxError,Math.abs(states[0].correlator[i].correlation-states[1].correlator[i].correlation));
  if(mode==='EFFECTIVE_MODEL')for(let i=0;i<states[0].correlator.length;i++){const a=states[0],b=states[1],t=a.correlator[i].time;maxError=Math.max(maxError,Math.abs(b.correlator[i].correlation/a.correlator[i].correlation-Math.exp(-(b.delta-a.delta)*t)));}
  return {pass:maxError<=1e-12,maxError,tolerance:1e-12};
}
async function deltaFamily(input,context){
  const states=[];for(const delta of input.deltas){context.checkCancelled?.();
    if(input.mode==='ENSEMBLE_ESTIMATE'){
      const q=ensembleRequest(delta,input.seed),raw=await Gauge.runJob(q,context),{executionMetrics,...r}=raw;
      states.push({...await child('gauge.ensemble',r,q.input),delta,correlator:correlation(r.replicas[0].history),correlatorAxis:'MONTE_CARLO_LAG',correlatorRule:'Empirical centered Wilson-action autocorrelation; lag is algorithmic sweep count. beta=Delta is an explicit finite-Gibbs model rule, not an inferred physical spectral gap.'});
    }else{
      const q=fieldRequest(input.mode,delta),r=await LegacyGauge.runJob(q);
      // Unit changes alter screen coordinates; the comparison colour stays in common physical density units.
      if(input.mode==='UNITS'){const factor=r.stateMeaning.displayTransform.q4Scale;for(const p of r.visualization.points)p.value/=factor;r.visualization.valueMeaning='physical actionDensity';r.visualization.valueUnits='ell0^-4';}
      const energies=input.mode==='EFFECTIVE_MODEL'?[delta,delta+.4,delta+1.2]:[3,3.4,4.2];
      const spectral=finiteSpectralModel({delta,offsets:energies.map(e=>e-delta),weights:[.2,.5,.3],times:Array.from({length:25},(_,i)=>i/8),hbar:1,assumptionId:input.mode==='EFFECTIVE_MODEL'?'I2-declared-E_j(Delta)=Delta+offset_j':'I2-fixed-H-independent-of-declared-bound-or-display-units'});
      states.push({...await child('gauge.field',r,q.input),delta,correlator:spectral.samples,correlatorAxis:'SPECTRAL_TIME',spectral,correlatorRule:input.mode==='EFFECTIVE_MODEL'?'Declared E_j(Delta)=Delta+offset_j; C(t)=sum w_j exp(-E_j t/hbar). The finite H is an explicit parallel model, not reconstructed from the classical field.':'Physical H and C(t) stay fixed; only the declared lower bound or display units change.'});
    }
  }
  const unchanged=states[0].modelHash===states[1].modelHash,expected=['ASSUMED_BOUND','UNITS'].includes(input.mode);
  const correlatorCheck=verifyCorrelatorFamily(states,input.mode);
  return {status:'COMPLETED',states,pairs:[{id:'delta',label:'Δ '+input.deltas.join(' ↔ '),left:states[0],right:states[1],shareBounds:true}],visualization:states[0].result.visualization,modelHash:await sha256({mode:input.mode,rule:states.map(s=>s.modelHash)}),checks:[{name:'Delta mode follows the recorded source generation rule',pass:unchanged===expected},{name:'source and observation hashes recorded separately',pass:states.every(s=>s.sampleHash&&s.observationHash&&s.modelHash)},{name:'correlator dependency preserved',pass:correlatorCheck.pass,error:correlatorCheck.maxError,tolerance:correlatorCheck.tolerance}],scope:input.mode==='ENSEMBLE_ESTIMATE'?'Two actual finite ensembles with beta=Delta and distinct source/sample hashes. Individual equilibrium/ESS limitations remain in each result. No continuum spectral gap estimate.':'Two recomputed classical field observations and explicitly defined finite spectral comparisons. Same camera and colour range; no implicit classical-to-quantum inference.',remaining:states.flatMap(s=>s.result.blockers||s.result.scopeBlockers||[])};
}
async function gauge4d(input){
  const q=fieldRequest();q.input.observation.samplesPerAxis=3;
  if(input.operation.startsWith('WILSON')){
    q.kind='gauge.holonomy';delete q.input.observation;delete q.input.verify;
    const path=[[.2,-.3,.1,.4],[.6,-.3,.1,.4],[.6,-.3,.1,.8],[.2,-.3,.1,.8]];
    if(input.operation==='WILSON_CLOSED')path.push(path[0].slice());
    q.input.path=path;q.input.steps=16;q.input.gauge={generator:0,wave:[.2,-.1,.3,.15],amplitude:.4,phase:.2};
  }else if(input.operation==='SLICE')q.input.observation.slice=input.slice;
  else q.input.observation={kind:'FINITE_MARGINAL',quantity:'actionDensity',samplesPerAxis:3,bounds:[[-2,2],[-2,2],[-2,2]],fibre:input.fibre,panels:input.panels};
  const r=await LegacyGauge.runJob(q),raw=r.visualization;
  if(input.operation==='CONDITIONAL_MEAN'){
    const length=input.fibre[1]-input.fibre[0];for(const p of raw.points)p.value/=length;
    raw.valueMeaning='Uniform conditional mean of actionDensity along x4';raw.valueUnits='ell0^-4';raw.description='Uniform finite-fibre average: integral actionDensity dx4 / fibre length. This scalar is not a connection.';
  }
  raw.axes=raw.axes.map((a,i)=>({...a,unit:a.unit||r.fieldSpec.units.length,type:'PHYSICAL_CARTESIAN',sourceField:`result.source.result.visualization.points[*].pos[${i}]`,physicalDimension:1}));
  const contract={operation:input.operation,sourceDimension:4,displayDimension:3,sourceCoordinateTypes:['PHYSICAL_SPACE_COORDINATE','PHYSICAL_SPACE_COORDINATE','PHYSICAL_SPACE_COORDINATE','EUCLIDEAN_TIME'],fixedCoordinate:input.operation==='SLICE'?{label:'x4',type:'EUCLIDEAN_TIME',unit:r.fieldSpec.units.length,value:input.slice,sourceField:'result.source.input.observation.slice'}:null,measure:input.operation==='CONDITIONAL_MEAN'?{kind:'UNIFORM_FINITE_INTERVAL_PROBABILITY',fibre:input.fibre,normalization:input.fibre[1]-input.fibre[0]}:input.operation==='FINITE_MARGINAL'?{kind:'LEBESGUE_ON_FINITE_INTERVAL',fibre:input.fibre}:null,outputType:input.operation.startsWith('WILSON')?(input.operation==='WILSON_OPEN'?'GAUGE_COVARIANT_TRANSPORT':'GAUGE_INVARIANT_CLOSED_CHARACTER'):'GAUGE_INVARIANT_SCALAR',reconstructionAllowed:false,scalarReturnsConnection:false,endpointConvention:input.operation.startsWith('WILSON')?{path:q.input.path,closed:input.operation==='WILSON_CLOSED',transportConvention:'U_xy: fibre at endpoint y → fibre at endpoint x',gauge:q.input.gauge,gaugeConvention:q.input.field.gaugeConvention,invariantEndpointCoupling:input.operation==='WILSON_CLOSED'?'normalized trace of closed transport':'none; open transport matrix is gauge-covariant'}:null,loss:raw.lostInformation};
  return {status:'COMPLETED',source:await child(q.kind,r,q.input),observationContract:contract,visualization:raw,checks:[{name:'noninjective projection reconstruction is disabled',pass:contract.reconstructionAllowed===false},{name:'scalar marginal does not return a connection',pass:!contract.scalarReturnsConnection},{name:'open and closed Wilson endpoint conventions are distinct',pass:!contract.endpointConvention||contract.endpointConvention.closed===(input.operation==='WILSON_CLOSED')}],scope:'Actual source-bound 4D scalar observation or oriented transport. Projected coordinates do not reconstruct the original 4D connection.'};
}
async function blowupPair(input,context){
  const sourceInput={tau:.1,h:input.h,viscosity:input.viscosity,etaCount:3,radialCount:8,axisOrder:6};
  const source=clone(constructLeadingCandidate(sourceInput,makeBudget({maxOperations:30000000,maxMilliseconds:60000,maxPoints:144},context)));
  if(source.budget)delete source.budget.elapsedMilliseconds;
  const profileHash=await sha256({parameters:source.parameters,profiles:source.profiles}),pairs=[];let referenceBounds=null;
  for(const [frame,tau]of input.taus.entries()){
    context.checkCancelled?.();
    if(tau===0||tau<1e-250){pairs.push({id:'tau-'+frame,label:'τ='+tau,state:tau===0?'SINGULAR_BOUNDARY':'PRECISION_REQUIRED',tau,reason:tau===0?'τ=0은 관측 계산의 정의역 밖입니다.':'binary64에서 같은 프로파일의 좌표·속도를 신뢰할 수 없습니다.'});continue;}
    const physical=[],similarity=[];
    for(const [i,p]of source.profiles.entries())for(let angle=0;angle<6;angle++){
      const theta=2*Math.PI*angle/6,c=fromSimilarity({X:p.X,eta:p.eta,theta},{...sourceInput,tau}),rootNu=Math.sqrt(input.viscosity),[x,y]=c.position.map(v=>v/rootNu),vOverX=p.X===0?0:p.V0/p.X,q=c.q;
      const velocity=[rootNu*(vOverX*x/(2*q)-q**(-1-input.h)*p.F*y),rootNu*(vOverX*y/(2*q)+q**(-1-input.h)*p.F*x),rootNu*q**(-.5-input.h)*p.U],value=Math.hypot(...velocity),common={value,velocity,profileIndex:i,theta,q,tau,sourcePath:`result.source.profiles[${i}]`,label:`X=${p.X}; eta=${p.eta}; theta=${theta}; tau=${tau}; ${p.stage}`};
      requireInput([...c.position,...velocity].every(Number.isFinite),'Coordinate or velocity overflow','PRECISION_REQUIRED');
      physical.push({...common,pos:c.position});similarity.push({...common,pos:[Math.sqrt(2*p.X)*Math.cos(theta),Math.sqrt(2*p.X)*Math.sin(theta),p.eta]});
    }
    const visual=(points,sim)=>({points,lines:[],arrows:[],axes:(sim?['sqrt(2X) cos θ','sqrt(2X) sin θ','η']:['physical x','physical y','physical z']).map(label=>({label,type:sim?'SIMILARITY_COORDINATE':'PHYSICAL_CARTESIAN',unit:sim?'1':'source length',physicalDimension:sim?0:1})),description:sim?'동일 τ와 동일 유한 프로파일의 유사 좌표 관측':'동일 유한 프로파일의 물리 좌표 관측 · 고정 물리 시야',coordinateMeaning:sim?'y_radial=x_radial/sqrt(nu q), eta=z/(sqrt(nu) q^D); q=tau/(1-eta²). Per-point magnification is retained.':'Actual Cartesian coordinates with sqrt(nu) and tau scaling. This is the inherited finite candidate, with all of its original mathematical limitations retained.',valueMeaning:'physical speed |u|',valueUnits:'source length/source time',lostInformation:['선택한 유한 프로파일의 관측입니다. 전체 N3/N4 프로파일 인증이나 τ=0 특이점 증명이 아닙니다.']});
    const left={kind:'ns.leading-profile',result:{status:'PARTIAL',visualization:visual(physical,false)},modelHash:profileHash,sampleHash:await sha256(physical)},right={kind:'observation.similarity',result:{status:'PARTIAL',visualization:visual(similarity,true)},modelHash:profileHash,sampleHash:await sha256(similarity)};
    pairs.push({id:'tau-'+frame,label:'τ='+tau,tau,left,right,shareBounds:false,magnification:physical.map(p=>({profileIndex:p.profileIndex,q:p.q,radial:1/Math.sqrt(input.viscosity*p.q),axial:1/(Math.sqrt(input.viscosity)*p.q**(.5-input.h))}))});
  }
  const finite=pairs.filter(p=>p.left),positions=finite.flatMap(p=>p.left.result.visualization.points.map(x=>x.pos));
  if(positions.length)referenceBounds=[0,1,2].map(i=>{const vals=positions.map(p=>p[i]),m=Math.max(...vals.map(Math.abs),1e-20)*1.08;return [-m,m];});
  for(const pair of finite){pair.left.result.visualization.bounds=referenceBounds;pair.left.observationHash=await sha256(pair.left.result.visualization);pair.right.observationHash=await sha256(pair.right.result.visualization);}
  return {status:'COMPLETED',source,sourceInput,profileHash,modelHash:profileHash,pairs,visualization:finite[0]?.left.result.visualization,checks:[{name:'both views bind the same profile and tau',pass:finite.every(p=>p.left.modelHash===p.right.modelHash&&p.left.result.visualization.points.every((v,i)=>v.tau===p.right.result.visualization.points[i].tau&&v.value===p.right.result.visualization.points[i].value))},{name:'physical viewport is fixed across frames',pass:finite.every(p=>canonicalStringify(p.left.result.visualization.bounds)===canonicalStringify(referenceBounds))},{name:'singular or insufficient precision frames contain status only',pass:pairs.filter(p=>p.state).every(p=>!p.left&&!p.right)}],scope:'Synchronized finite observations of the same existing candidate. Candidate mathematical blockers are preserved. The display may contract a core; it does not certify blowup.',remaining:source.blockers};
}
export async function runJob(request,context={}){
  const valid=validateRequest(request);requireInput(valid.ok,JSON.stringify(valid.errors),valid.code);context.checkCancelled?.();let result;
  if(request.kind==='observation.delta-family')result=await deltaFamily(request.input,context);
  else if(request.kind==='observation.gauge-4d')result=await gauge4d(request.input);
  else if(request.kind==='observation.blowup-pair')result=await blowupPair(request.input,context);
  else {const r=await complexBasis(request.input);result={status:r.status,results:r,checks:r.checks,scope:r.scope};}
  context.checkCancelled?.();return {schema:'MathScope.M2.ObservationLaboratory/1',kind:request.kind,...result,sourceHash:await sha256(result),formalComplete:false};
}
export function getCapabilities(){return {domain:'observation',kinds:KINDS,deltaModes:MODES,operations:OPERATIONS,sourcePolicy:'Read unchanged M1 formulas and actual M2 sampler; preserve source status and declared model rules',evidencePolicy:'Observation criteria only; never grants a source mathematical theorem or formal pass'};}
export function getExamples(){
  const out=[],add=(id,label,kind,input)=>out.push({id,label,request:{kind,input,precision:{mode:kind==='observation.complex-basis'?'EXACT_INTEGER':'FLOAT64'},budget:{maxMillis:60000,maxOperations:50000000,maxItems:250000,maxBytes:8388608}}});
  for(const mode of MODES)add('i2-delta-'+mode.toLowerCase(),'Δ 비교 · '+mode,'observation.delta-family',{mode,deltas:[.5,2],seed:'mathscope-I2-20261010'});
  for(const operation of OPERATIONS)add('i2-4d-'+operation.toLowerCase(),'4D 관측 · '+operation,'observation.gauge-4d',{operation,slice:0,fibre:[-2,2],panels:16});
  add('i2-blowup-pair','동일 τ · 물리/유사 좌표와 고정 시야','observation.blowup-pair',{taus:[.1,.01,.001,0],h:.005,viscosity:1});
  add('i2-complex-basis','정수 기저 교체 · kernel/image/Frobenius/filtration','observation.complex-basis',{p:3,N:4,D:2,basis:'SHEAR'});
  return out;
}
