import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {prepareGlobalSourceBand} from './overlay/research-ide/mathscope-m3/navier/source-global-band.mjs';
import {attachGlobalFixedRepresentative} from './overlay/research-ide/mathscope-m3/navier/source-global-representative.mjs';
import {attachGlobalCurrentState} from './overlay/research-ide/mathscope-m3/navier/source-global-current.mjs';
import {attachGlobalSignedCurrent} from './overlay/research-ide/mathscope-m3/navier/source-global-signed.mjs';
import {attachGlobalCurrentPressure} from './overlay/research-ide/mathscope-m3/navier/source-global-pressure.mjs';
import {attachGlobalInitialAngularState} from './overlay/research-ide/mathscope-m3/navier/source-global-angular.mjs';
import {attachGlobalSignedFullPressure} from './overlay/research-ide/mathscope-m3/navier/source-global-signed-full-pressure.mjs';

const start=performance.now(),deadlineMs=900000,events=[];
let stage='prepare-original-source-band',lastEventTime=-1;
const receipt={schema:'MathScope.ActualSignedSuccessorRun/1',runtime:{node:process.version,platform:process.platform},
  request:{coefficientOrder:1,maxNodes:4000000},
  resourceLimits:{deadlineMs,nodeMaxOldSpaceMb:Number(process.execArgv.find(x=>x.startsWith('--max-old-space-size='))?.split('=')[1]??0)},
  originalConstructorsUnmodified:true,privateSealsBypassed:false,serializedSourceObjectsUsed:false,
  actualSignedPressureSuccessorExecuted:false,originalN602Complete:false,status:'RUNNING',events,completedOriginalStages:[]};
const checkpoint=()=>fs.writeFileSync(new URL('ACTUAL_CONSTRUCTION_RECEIPT.json',import.meta.url),JSON.stringify({...receipt,currentStage:stage,elapsedSeconds:+((performance.now()-start)/1000).toFixed(3)},null,2)+'\n');
const completed=(name,G)=>{receipt.completedOriginalStages.push({name,nodeCount:G.nodes.length,elapsedSeconds:+((performance.now()-start)/1000).toFixed(3)});checkpoint();};
checkpoint();
const context={checkCancelled(){if(performance.now()-start>deadlineMs)throw Object.assign(new Error('The recorded fifteen-minute execution budget expired during construction.'),{code:'RECORDED_EXECUTION_TIME_LIMIT'});},
  onProgress(event){context.checkCancelled();const now=performance.now();
    if(event.stage||now-lastEventTime>5000){const item={stage,...event,elapsedSeconds:+((now-start)/1000).toFixed(3),rssBytes:process.memoryUsage().rss};events.push(item);console.log(JSON.stringify(item));lastEventTime=now;}}};
try{
  const band=prepareGlobalSourceBand(receipt.request,context);
  completed(stage,band.G);
  stage='attach-original-fixed-representative';checkpoint();const representative=attachGlobalFixedRepresentative(band,context);completed(stage,representative.G);
  stage='attach-original-current';checkpoint();const current=attachGlobalCurrentState(representative,context);completed(stage,current.G);
  stage='attach-original-signed-current';checkpoint();const signed=attachGlobalSignedCurrent(current,context);
  receipt.actualSignedSource={schema:signed.schema,meanRoots:signed.updated.fullAuxiliaryMean,
    preHaarRows:signed.rows.map(row=>({sign:row.sign,deltaA:row.deltaA,covariance:row.expansion.after,oldFull:row.oldFull,increment:row.increment})),allOriginalChecksPassed:signed.checks.every(x=>x.pass)};
  completed(stage,signed.G);
  stage='attach-original-full-auxiliary-pressure';checkpoint();const pressure=attachGlobalCurrentPressure(current,context);completed(stage,pressure.G);
  stage='attach-original-initial-angular';checkpoint();const initial=attachGlobalInitialAngularState(pressure,context);completed(stage,initial.G);
  stage='attach-new-signed-full-pressure';checkpoint();const repaired=attachGlobalSignedFullPressure(signed,initial,context);
  receipt.actualSignedPressureSuccessorExecuted=true;
  receipt.result={scope:repaired.scope,nodeCount:repaired.G.nodes.length,
    latestMeanPressureRoot:repaired.latestMean.pressure.value,actualVelocityRoots:repaired.global.velocity,
    actualFullPressureRoot:repaired.global.pressure,comparison:repaired.global.comparison,
    sourceContributions:Object.fromEntries(Object.entries(repaired.assembly.fields).map(([name,value])=>[name,value.rows.length]))};
  receipt.status='PASS_ACTUAL_COMPATIBLE_PRETEMPORAL_SIGNED_STAGE';
}catch(error){receipt.status='CONSTRUCTION_DID_NOT_REACH_SIGNED_SUCCESSOR';receipt.error={stage,code:error.code??null,message:error.message,stack:error.stack};process.exitCode=2;}
receipt.elapsedSeconds=+((performance.now()-start)/1000).toFixed(3);
receipt.finalRssBytes=process.memoryUsage().rss;
fs.writeFileSync(new URL('ACTUAL_CONSTRUCTION_RECEIPT.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,stage,elapsedSeconds:receipt.elapsedSeconds,error:receipt.error}));
