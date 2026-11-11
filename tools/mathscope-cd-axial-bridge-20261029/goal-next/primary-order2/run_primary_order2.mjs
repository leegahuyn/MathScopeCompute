import {mkdirSync,writeFileSync,appendFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {prepareActualCommonAdmissibleFamily,assertActualCommonAdmissibleFamily,actualCommonAdmissibleFamilyCertificate} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {assertActualCommonTargetWeightedNorms,actualCommonTargetWeightedNormCertificate} from '../../mathscope-m2/navier/actual-common-target-weighted-norms.mjs';
import {clearDisposableThirdJetCaches} from '../../mathscope-m2/navier/actual-third-jet-ftc.mjs';
import {attachGlobalSourceBand} from '../navier/source-global-band.mjs';
import {attachGlobalFixedRepresentative} from '../navier/source-global-representative.mjs';
import {attachGlobalCurrentState,assertGlobalCurrentState,globalCurrentStateCertificate} from '../navier/source-global-current.mjs';
import {attachGlobalPrimaryClassOperator,assertGlobalPrimaryClassOperator,globalPrimaryClassOperatorCertificate} from '../navier/source-primary-class-majorants.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {validateLive,validateDegree} from './primary-order2-checks.mjs';

const OUT=process.argv[2],PIN='f8cb4034e86d7b669d52a6f2248aebba156b51b5';
if(!OUT) throw Error('usage: node --expose-gc run_primary_order2.mjs OUTPUT_DIRECTORY');
mkdirSync(OUT,{recursive:true});
const started=Date.now(), timeLimit=Number(process.env.M3_PRIMARY_MAX_SECONDS??'5400')*1000,
  rssLimit=Number(process.env.M3_PRIMARY_MAX_RSS_BYTES??'6442450944');
if(!Number.isSafeInteger(timeLimit)||timeLimit<1000||!Number.isSafeInteger(rssLimit)||rssLimit<1048576)throw Error('Invalid resource limits');
let stage='startup',lastHeartbeat=0;const files={};
const log=(kind,more={})=>{const rec={kind,stage,utc:new Date().toISOString(),elapsedMs:Date.now()-started,rssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed,...more};appendFileSync(join(OUT,'checkpoints.jsonl'),JSON.stringify(rec)+'\n');console.log(JSON.stringify(rec));};
const check=()=>{const now=Date.now();if(now-lastHeartbeat>5000){lastHeartbeat=now;log('heartbeat');}if(now-started>timeLimit)throw Object.assign(new Error('Owned time budget exceeded'),{code:'OWNED_TIME_LIMIT'});if(process.memoryUsage().rss>rssLimit)throw Object.assign(new Error('Owned RSS budget exceeded'),{code:'OWNED_RSS_LIMIT'});};
const context={checkCancelled:check,onProgress:x=>{stage=x.stage??stage;log('progress',{nodeCount:x.nodeCount??null});check();}};
const setStage=x=>{stage=x;log('stage');check();};
const hash=x=>createHash('sha256').update(x).digest('hex');
const save=(name,bytes,expected)=>{check();const data=Buffer.from(bytes,'utf8'),h=hash(data);if(expected)assert.equal(h,expected,`${name} native hash`);writeFileSync(join(OUT,name),data);files[name]={sha256:h,bytes:data.length};log('saved',{name,sha256:h,bytes:data.length});};
const saveJSON=(name,x)=>save(name,canonicalStringify(x));
const dispose=(...gs)=>{for(const g of new Set(gs))if(g)clearDisposableThirdJetCaches(g);global.gc?.();check();};
const expectReject=(f,code)=>assert.throws(f,e=>e?.code===code);
let state={schema:'MathScope.PrimaryOrder2Run/1',status:'RUNNING',sourceCommit:PIN,files,release:'HOLD'};
try {
  setStage('check_source_commit');
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),PIN,'wrong original source checkout');
  execFileSync('git',['diff','--quiet','--exit-code','HEAD','--'],{stdio:'pipe'});
  assert.equal(execFileSync('git',['rev-parse',`${PIN}:research-ide/mathscope-m3/navier/source-primary-class-majorants.mjs`],{encoding:'utf8'}).trim(),'505a33a2a3a8581a7b72bcc3d1a904ebc2ea73bf');
  setStage('construct_same_family_C5');
  const family=prepareActualCommonAdmissibleFamily({throughOrder:2,derivativeOrder:5,maxNodes:5000000,maxProfileJets:60000,maxJetRequests:600000},context);
  assertActualCommonAdmissibleFamily(family);dispose(family.G);
  const fc=await actualCommonAdmissibleFamilyCertificate(family);saveJSON('family-certificate.json',fc);save('family-program.json',canonicalStringify(family.program),fc.graph.sha256);dispose(family.G);
  setStage('construct_first_window_current');
  const band=attachGlobalSourceBand(family,{coefficientOrder:1,maxNodes:4000000},context),current=attachGlobalCurrentState(attachGlobalFixedRepresentative(band,context),context);
  assertGlobalCurrentState(current);dispose(family.G,current.G);
  const cc=await globalCurrentStateCertificate(current);saveJSON('current-certificate.json',cc);
  const data=Object.fromEntries(['schema','source','geometry','domain','local','assembly','covariance','mean','target','closure','checks','scope'].map(k=>[k,current[k]]));
  const nativeCurrent={data,nodes:current.G.nodes.slice(current.source.prefixNodeCount),definitions:current.G.captureFunctionDefinitions(),kernel:current.G.globalKernelDefinitions()};
  save('current-native-program.json',canonicalStringify(nativeCurrent),cc.graph.sha256);
  saveJSON('current-full-graph.json',{nodes:current.G.nodes,definitions:current.G.captureFunctionDefinitions(),kernel:current.G.globalKernelDefinitions()});dispose(family.G,current.G);
  setStage('construct_same_family_target_C3');
  const target=family.constructTargetWeightedNorms({derivativeOrder:3,maxNodes:6000000,maxJetRequests:600000},context);
  assertActualCommonTargetWeightedNorms(target);dispose(family.G,current.G,target.G);
  const tc=await actualCommonTargetWeightedNormCertificate(target);saveJSON('target-certificate.json',tc);save('target-program.json',canonicalStringify(target.program),tc.graph.sha256);dispose(family.G,current.G,target.G);
  setStage('attach_primary_order2');
  const primary=attachGlobalPrimaryClassOperator(current,target,{order:2,maxWork:200000},context);
  assertGlobalPrimaryClassOperator(primary);validateLive({family,band,current,target,primary});validateDegree(primary.bounds.degreeProgram);
  expectReject(()=>assertGlobalPrimaryClassOperator({...primary}),'INVALID_SOURCE_CONSTRUCTION');
  expectReject(()=>attachGlobalPrimaryClassOperator(current,target,{order:3,maxWork:200000}),'RESOURCE_LIMIT');
  const saved=primary.scope.completeN6;primary.scope.completeN6=true;
  try {expectReject(()=>assertGlobalPrimaryClassOperator(primary),'INVALID_SOURCE_CONSTRUCTION');} finally {primary.scope.completeN6=saved;}
  assertGlobalPrimaryClassOperator(primary);dispose(family.G,current.G,target.G);
  const pc=await globalPrimaryClassOperatorCertificate(primary);
  assert.equal(pc.program.targetBase.sha256,tc.graph.sha256);assert.equal(pc.program.currentBase.sha256,cc.graph.sha256);
  save('primary-additive-program.json',canonicalStringify(pc.program),pc.graph.sha256);saveJSON('primary-certificate.json',pc);
  state={...state,status:'PASS',familyHash:fc.graph.sha256,currentHash:cc.graph.sha256,targetHash:tc.graph.sha256,primaryHash:pc.graph.sha256,
    checks:'native private seals; family identity; C5 B3; target C3 poles; m2 degree recurrence; live mutation and insufficient order rejected',
    scope:'Source-native original primary class attachment only; corrected Forced input W-alpha, actual first cutoff bound, later stages and Lean proof remain open.',files};
  setStage('complete');saveJSON('status.json',state);log('PASS');
} catch(e) {
  state={...state,status:'FAILED',failedStage:stage,error:{name:e?.name??'Error',code:e?.code??null,message:String(e?.message??e)},files};
  try {writeFileSync(join(OUT,'status.json'),JSON.stringify(state,null,2)+'\n');log('FAIL',{code:e?.code??null,message:String(e?.message??e)});}catch{}
  console.error(e?.stack??e);process.exitCode=1;
}

