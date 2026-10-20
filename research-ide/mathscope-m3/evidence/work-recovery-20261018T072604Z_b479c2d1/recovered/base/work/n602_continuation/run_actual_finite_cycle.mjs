import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {prepareGlobalSourceBand} from './source/research-ide/mathscope-m3/navier/source-global-band.mjs';
import {attachGlobalFixedRepresentative} from './source/research-ide/mathscope-m3/navier/source-global-representative.mjs';
import {attachGlobalCurrentState} from './source/research-ide/mathscope-m3/navier/source-global-current.mjs';
import {attachGlobalCurrentPressure} from './source/research-ide/mathscope-m3/navier/source-global-pressure.mjs';
import {attachGlobalMomentCurrent} from './source/research-ide/mathscope-m3/navier/source-global-moment.mjs';
import {attachGlobalTemporalInverse} from './source/research-ide/mathscope-m3/navier/source-global-temporal.mjs';
import {attachGlobalInitializedMean} from './source/research-ide/mathscope-m3/navier/source-global-initial-mean.mjs';
import {attachGlobalInitializedAngular} from './source/research-ide/mathscope-m3/navier/source-initialized-angular.mjs';
import {attachGlobalForcedCurrentWithCheckpoints} from './source/research-ide/mathscope-m3/navier/source-global-forced-current.mjs';

const start=performance.now(),events=[],deadlineMs=1800000;
let stage='prepare-original-band',lastEventTime=-1;
const receipt={schema:'MathScope.N602.ActualFiniteCycleAttempt/1',status:'RUNNING',runtime:{node:process.version,platform:process.platform},
  request:{coefficientOrder:1,maxNodes:4000000},resourceLimits:{chosenDeadlineMs:deadlineMs,nodeArguments:process.execArgv},
  original135DependenciesUnmodified:true,privateSealsBypassed:false,serializedStateAccepted:false,
  originalWindowsOr1260RunRepeated:false,completedOriginalStages:[],completedNewStages:[],events,
  actualPostForcedSuccessorReached:false,allMandatoryFiniteStagesConstructed:false,originalN602Complete:false};
function save(){fs.writeFileSync(new URL('ACTUAL_FINITE_CYCLE_RECEIPT.json',import.meta.url),
  JSON.stringify({...receipt,currentStage:stage,elapsedSeconds:+((performance.now()-start)/1000).toFixed(3)},null,2)+'\n');}
const context={checkCancelled(){if(fs.existsSync(new URL('STOP_REQUESTED',import.meta.url)))throw Object.assign(new Error('A recorded reviewer-requested stop was observed.'),{code:'REVIEW_STOP_REQUESTED'});
    if(performance.now()-start>deadlineMs)throw Object.assign(new Error('The recorded thirty-minute chosen execution budget expired.'),{code:'CHOSEN_EXECUTION_BUDGET'});},
  onProgress(event){context.checkCancelled();const now=performance.now();
    if(event.stage||now-lastEventTime>5000){const item={stage,...event,elapsedSeconds:+((now-start)/1000).toFixed(3),rssBytes:process.memoryUsage().rss};
      events.push(item);console.log(JSON.stringify(item));lastEventTime=now;save();}},
  onSourceCheckpoint(checkpoint){const item={stage:checkpoint.kind,nodeCount:checkpoint.G.nodes.length,
    scope:checkpoint.record?.scope,elapsedSeconds:+((performance.now()-start)/1000).toFixed(3)};
    receipt.originalForcedCheckpointSummaries??=[];receipt.originalForcedCheckpointSummaries.push(item);save();}
};
const done=(name,G,isNew=false)=>{receipt[isNew?'completedNewStages':'completedOriginalStages'].push({name,nodeCount:G.nodes.length,
  elapsedSeconds:+((performance.now()-start)/1000).toFixed(3)});save();};
const run=(name,callback)=>{stage=name;save();const value=callback();done(name,value.G);return value;};
const stateSummary=s=>({stage:s.stage,nodeCount:s.G.nodes.length,actualMean:s.meanVelocity,actualCovariance:s.covariance,
  waveVelocity:s.waveVelocity,allAngularPressure:s.angularPressure,actualVelocity:s.global.velocity,actualPressure:s.global.pressure,
  latestMeanPressure:s.latestMean.pressure.value,comparison:s.global.comparison,ledger:s.ledger,
  modes:s.templates.map(t=>({key:t.key,modes:t.waveRows.map(r=>r.m)})),sourceBinding:s.sourceBinding,scope:s.scope,
  correction:s.stage==='temporal'?{actualOldMean:s.correction.actualOldMean,actualIncrement:s.correction.actualIncrement,Fax:s.correction.Fax,
    gammaDesired:s.correction.potential.gammaDesired,actualGamma:s.correction.potential.velocity.gamma,
    inverseBodies:Object.fromEntries(Object.entries(s.correction.inverses).map(([k,v])=>[k,v.body]))}:
    s.stage==='fresh-five'?{actualInputDefects:s.correction.actualInputDefects,actualOldMean:s.correction.actualOldMean,
      increment:s.correction.increment,targets:s.correction.targets}:s.stage==='signed'?{actualSigma:s.correction.target.Sigma,
      actualSigmaResiduals:s.correction.target.rows.map(r=>r.actualResidual),fixedH:s.correction.inverse.H,
      fixedAmplitudes:s.correction.inverse.a}:null});
save();
try{
  const band=run('original-band',()=>prepareGlobalSourceBand(receipt.request,context));
  const representative=run('original-fixed-representative',()=>attachGlobalFixedRepresentative(band,context));
  const current=run('original-current',()=>attachGlobalCurrentState(representative,context));
  const template=run('original-fixed-five-profile-template',()=>attachGlobalMomentCurrent(current,context));
  const pressure=run('original-full-auxiliary-pressure',()=>attachGlobalCurrentPressure(current,context));
  const temporal=run('original-initial-temporal',()=>attachGlobalTemporalInverse(pressure,context));
  const mean=run('original-initial-fresh-five',()=>attachGlobalInitializedMean(temporal,template,context));
  const angular=run('original-initialized-angular',()=>attachGlobalInitializedAngular(mean,context));
  stage='original-forced-current';save();const forced=await attachGlobalForcedCurrentWithCheckpoints(angular,context);done(stage,forced.G);
  const moduleURL=new URL('./source/research-ide/mathscope-m3/navier/source-finite-cycle-continuation.mjs',import.meta.url);
  receipt.loadedSuccessorModuleSha256=createHash('sha256').update(fs.readFileSync(moduleURL)).digest('hex');
  const {currentFromForced,attachPostForcedSigned,attachPostSignedTemporal,attachPostTemporalFreshFive,assertFiniteCurrent}=await import(moduleURL.href);
  const states={};
  for(const [name,callback]of [
    ['post-forced',()=>currentFromForced(forced,context)],
    ['signed',()=>attachPostForcedSigned(states['post-forced'],context)],
    ['temporal',()=>attachPostSignedTemporal(states.signed,context)],
    ['fresh-five',()=>attachPostTemporalFreshFive(states.temporal,context)]]){
    stage='new-'+name;save();const s=callback();assertFiniteCurrent(s);states[name]=s;
    receipt.actualPostForcedSuccessorReached=true;receipt.stages??={};receipt.stages[name]=stateSummary(s);done(stage,s.G,true);
  }
  receipt.allMandatoryFiniteStagesConstructed=true;receipt.status='PASS_ACTUAL_CANONICAL_FINITE_CYCLE_PENDING_INDEPENDENT_REVIEW';
}catch(error){receipt.status='ACTUAL_FINITE_CYCLE_NOT_COMPLETED';receipt.error={stage,code:error.code??null,message:error.message,stack:error.stack};process.exitCode=2;}
receipt.finalRssBytes=process.memoryUsage().rss;save();
console.log(JSON.stringify({status:receipt.status,stage,error:receipt.error,elapsedSeconds:(performance.now()-start)/1000}));
