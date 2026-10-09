/** Scoped terminal integration audit of the already executed release CLI runs.
 * The actual CLI offers list/run only. Replay and adversarial inputs below use
 * its public createM1Engine API with the same bounded Node Worker transport.
 * This file creates evidence only; it neither edits nor imports historical code.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {Worker as NodeWorker} from 'node:worker_threads';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {createM1Engine} from '../core/engine.mjs';
import {listExamples,normalizeRequest,M1_VERSION} from '../core/registry.mjs';
import {WORKER_SOURCE,WORKER_SHA256} from '../core/worker-data.mjs';

const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));
const evidence=resolve(root,'mathscope-m1/evidence');
const read=async path=>readFile(resolve(root,path));
const json=async path=>JSON.parse(await read(path));
const output=async(name,value)=>writeFile(resolve(evidence,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const hash=value=>createHash('sha256').update(value).digest('hex');
const copy=value=>JSON.parse(JSON.stringify(value));
const equal=(a,b)=>assert.equal(canonicalStringify(a),canonicalStringify(b));
const mathBody=({executionMetrics,...body})=>body;
const checks=[],controls=[];
const startedAt=new Date().toISOString();
const check=async(name,body)=>{try{const detail=await body();checks.push({name,pass:true,...(detail===undefined?{}:{detail})});}catch(error){checks.push({name,pass:false,error:error.message});}};
const build=await json('mathscope-m1/evidence/cli-v53-build-snapshot.json');
const commandRecord=await json('mathscope-m1/evidence/cli-v53-commands.json');
const registry=await json('mathscope-m1/evidence/cli-v53-registry.json');
const sourcePinResults=[];
const runs={};
const limits={maxOldGenerationSizeMb:512,maxYoungGenerationSizeMb:64};
function workerFactory(source){
  const bridge='const {parentPort}=require("node:worker_threads");\n'
    +'globalThis.crypto=require("node:crypto").webcrypto;\n'
    +'globalThis.self={postMessage:data=>parentPort.postMessage(data)};\n'
    +source+'\nparentPort.on("message",data=>self.onmessage({data}));\n';
  const worker=new NodeWorker(bridge,{eval:true,resourceLimits:limits});
  let terminating=false;
  const adapter={onmessage:null,onerror:null,postMessage:data=>worker.postMessage(data),terminate:()=>{terminating=true;return worker.terminate();}};
  worker.on('message',data=>adapter.onmessage?.({data}));
  worker.on('error',error=>adapter.onerror?.(error));
  worker.on('exit',code=>{if(!terminating)adapter.onerror?.(Error(`Node Worker exited before result (${code}).`));});
  return adapter;
}

await check('installed build equals the snapshot of the actual CLI invocations',async()=>equal(await json('mathscope-m1/build-manifest.json'),build));
await check('all current source graph file digests match the build snapshot',async()=>{
  for(const [path,expected] of Object.entries(build.sourceFiles)){
    const observed=hash(await read(path));sourcePinResults.push({path,expected,observed,pass:observed===expected});
  }
  assert(sourcePinResults.every(x=>x.pass));return {checkedFiles:sourcePinResults.length};
});
await check('CLI source digest matches the executed command record',async()=>assert.equal(hash(await read('mathscope-m1/cli.mjs')),commandRecord.cliSourceSha256));
await check('installed Worker bytes and engine version match candidate build',async()=>{
  assert.equal(await sha256(WORKER_SOURCE),build.workerSha256);assert.equal(WORKER_SHA256,build.workerSha256);
  assert.equal(new TextEncoder().encode(WORKER_SOURCE).length,build.workerBytes);assert.equal(M1_VERSION,'1.2.0');
});
await check('actual CLI list contains exactly 59 unique installed examples',async()=>{
  assert.equal(registry.exampleCount,59);assert.equal(registry.examples.length,59);
  assert.equal(new Set(registry.examples.map(x=>x.id)).size,59);equal(registry.examples,await listExamples());
});
await check('all six recorded run/refusal commands have the expected actual exits',async()=>{
  assert.equal(commandRecord.commands.length,6);
  equal(commandRecord.commands.map(x=>x.exitCode),[2,0,0,1,1,1]);
  assert(commandRecord.commands.every(x=>x.exitCode===x.expectedExit&&x.exitMatches&&x.signal===null));
  equal(commandRecord.build,{workerSha256:build.workerSha256,bundleSha256:build.bundleSha256});
});
for(const command of commandRecord.commands)await check(`actual ${command.id} stdout/stderr hashes`,async()=>{
  assert.equal(hash(await read('mathscope-m1/evidence/'+command.stdoutFile)),command.stdoutSha256);
  assert.equal(hash(await read('mathscope-m1/evidence/'+command.stderrFile)),command.stderrSha256);
});

for(const [id,exampleId,status] of [['gluing','ns-source-inner-gluing','PARTIAL'],['pressure','ns-source-pressure-bounds','COMPLETED'],['axis','ns-axis-source-exact-bounds','COMPLETED']]){
  const directory=`mathscope-m1/evidence/cli-v53-${id}-run`;
  const run={};for(const key of ['request','environment','result','replay-bundle','summary','files-manifest'])run[key]=await json(`${directory}/${key}.json`);
  runs[id]=run;const bundle=run['replay-bundle'],summary=run.summary,manifest=run['files-manifest'];
  await check(`${id}: six files retained and all five manifest byte digests correct`,async()=>{
    equal((await readdir(resolve(root,directory))).sort(),['environment.json','files-manifest.json','replay-bundle.json','request.json','result.json','summary.json']);
    assert.equal(manifest.files.length,5);
    for(const item of manifest.files){assert(!item.path.includes('/'));const bytes=await read(`${directory}/${item.path}`);assert.equal(bytes.length,item.bytes);assert.equal(hash(bytes),item.sha256);}
  });
  await check(`${id}: request is the unchanged registered and normalized example`,async()=>{
    const example=registry.examples.find(x=>x.id===exampleId);assert(example);equal(example.request,run.request);equal(normalizeRequest(run.request),run.request);equal(bundle.request,run.request);
    assert.equal(await sha256(run.request),bundle.inputHash);assert.equal(summary.inputHash,bundle.inputHash);
  });
  await check(`${id}: public environment digest, source and bounded Node Worker recorded`,async()=>{
    const {hash:environmentHash,...body}=run.environment;assert.equal(await sha256(body),environmentHash);
    equal(bundle.environment,run.environment);assert.equal(run.environment.workerSha256,build.workerSha256);assert.equal(run.environment.version,'1.2.0');
    assert.equal(run.environment.execution,'APPLICATION_WORKER_FACTORY');assert.equal(summary.environmentHash,environmentHash);
    assert.equal(summary.execution.kind,'NODE_WORKER_THREADS');equal(summary.execution.workerResourceLimits,limits);
  });
  await check(`${id}: saved result, canonical result hash and bundle digest agree`,async()=>{
    equal(bundle.result,run.result);assert.equal(await sha256(run.result),bundle.resultHash);assert.equal(summary.resultHash,bundle.resultHash);
    const {bundleHash,...body}=bundle;assert.equal(await sha256(body),bundleHash);assert.equal(summary.bundleHash,bundleHash);
  });
  await check(`${id}: mathematical hash excludes only top-level executionMetrics`,async()=>{
    assert.equal(await sha256(mathBody(run.result)),bundle.mathematicalHash);assert.equal(summary.mathematicalHash,bundle.mathematicalHash);
    assert.equal(bundle.semanticHashPolicy,'EXCLUDES_TOP_LEVEL_EXECUTION_METRICS_ONLY');assert.equal(manifest.mathematicalHashPolicy,bundle.semanticHashPolicy);
  });
  await check(`${id}: status and finite/untrusted export boundary preserved`,async()=>{
    assert.equal(summary.status,status);assert.equal(run.result.status,status);assert.equal(bundle.trust,'UNTRUSTED_WHEN_SERIALIZED');assert.equal(bundle.resumePolicy,'RECOMPUTE_FROM_ORIGINAL_INPUT');
    assert.equal(summary.interpretation.exportedEvidenceTrusted,false);assert.equal(summary.interpretation.browserSessionModified,false);
    for(const key of ['fullCertifiedProfile','fullProfileCertified','fullNavierStokesSolution'])assert.equal(run.result[key],false,key);
    assert.notEqual(run.result.formalPass,true);equal(summary.requestBudget,run.request.budget);
  });
}
await check('existing-output refusal did not overwrite the validated gluing bundle',async()=>{
  assert.match(String(await read('mathscope-m1/evidence/cli-v53-existing-output-refusal.stderr.log')),/Output already exists/);
  assert.equal(runs.gluing['replay-bundle'].bundleHash,'43b1f4009ef9609e2b6c57590f7cd9c2cedc42280eb666c971d6dbc5f4cbe10c');
});
await check('unknown example is rejected before creating an output directory',async()=>{
  assert.match(String(await read('mathscope-m1/evidence/cli-v53-unknown-example-refusal.stderr.log')),/Unknown example/);
  await assert.rejects(stat(resolve(evidence,'cli-v53-unknown-must-not-exist')),{code:'ENOENT'});
});
await check('CLI rejects unsupported arbitrary-request flag',async()=>assert.match(String(await read('mathscope-m1/evidence/cli-v53-arbitrary-request-refusal.stderr.log')),/Arbitrary request code is not accepted/));

const g=runs.gluing.result,p=runs.pressure.result,a=runs.axis.result;
await check('new gluing route exposes real B26/B34 debt, five-variable correction and all seven finite conditions',async()=>{
  assert.equal(g.domainStatus,'SOURCE_INNER_GLUING_COMPUTED');assert.equal(g.inputContract.externalEndpointAllowed,false);assert.equal(g.inputContract.externalMomentDebtAllowed,false);assert.equal(g.inputContract.syntheticMomentDebt,false);
  assert.match(g.inputContract.upstream,/runControlledContinuation/);assert.equal(g.computedConditions.length,7);assert(g.computedConditions.every(x=>x.pass));
  assert.equal(g.etaStencilCorrections.length,3);
  for(const c of g.etaStencilCorrections){assert.equal(c.actualDebt.length,5);assert(c.actualDebt.some(x=>x.sign!==0));assert.equal(c.coefficients.length,5);assert.equal(c.rawJacobian.length,5);assert.equal(c.quadraticMap.length,5);assert.match(c.actualDebtSource,/Measured B.26 endpoint/);}
});
await check('gluing exports signed-log scale beyond Float64 and finite five-moment residuals',async()=>{
  assert.equal(g.scales.XR.kind,'SIGNED_LOG');assert.equal(g.scales.XR.sign,1);assert.equal(g.scales.XR.float64,null);assert.equal(g.scales.XR.overflowAvoided,true);
  assert(g.scales.logXR>Math.log(Number.MAX_VALUE));
  for(const c of g.etaStencilCorrections){assert(c.finiteNumericalMomentMatch);assert(Number.isFinite(c.independentScaledResidual));assert(c.independentScaledResidual<g.parameters.tolerance);equal(c.underflowDebtRows,[]);equal(c.quadratureOrders,{map:128,reintegrated:192});}
  return {etaValues:g.etaStencilCorrections.map(c=>c.eta),maxIndependentScaledResidual:Math.max(...g.etaStencilCorrections.map(c=>c.independentScaledResidual)),logXR:g.scales.logXR};
});
await check('gluing finite cone diagnostics do not become interval/global/formal certification',async()=>{
  assert.equal(g.slices.length,1);assert.equal(g.slices[0].diagnostics.totalConeSamples,97);assert.equal(g.slices[0].diagnostics.relaxedConePassingSamples,97);
  assert.equal(g.formalPass,false);assert.equal(g.sourceConstructionScope.entireEtaIntervalCertified,false);assert.equal(g.sourceConstructionScope.generatedAnalyticPremisesKernelChecked,false);assert.equal(g.sourceConstructionScope.completedGlobalWitness,false);
  for(const c of g.etaStencilCorrections)for(const k of ['intervalNewtonCertified','continuousMomentsCertified','uniformEtaDerivativesCertified'])assert.equal(c[k],false,k);
  assert.equal(g.sourceParameterDiagnostics.logPAboveTd,false);assert.equal(g.parameters.continuation.pressure.parameters.logP,0);
});
const exactH='3022314549036573/302231454903657293676544';
await check('pressure CLI binds the exact binary64 value of h with rational bounds',async()=>{
  assert.equal(p.pressureFamily,'source-outer-A21');assert.equal(p.parameterHExact,exactH);assert.equal(p.inputBinding.h.exact,exactH);assert.equal(p.inputBinding.h.inputKind,'EXACT_BINARY64_VALUE');
  for(const key of ['totalMassLower','totalMassUpper'])assert.match(p[key],/^\d+\/\d+$/);
  assert.equal(p.gates.allEtaCauchyBounds,true);assert.equal(p.gates.positiveFiniteMixtureMass,true);
});
await check('pressure and A21 axis CLI routes retain identical exact source pressure certificate data',async()=>{
  assert.equal(a.pressureAxisBinding.status,'EXACT_H_MATCH');assert.equal(a.pressureAxisBinding.matches,true);assert.equal(a.pressureAxisBinding.axisHExact,exactH);assert.equal(a.pressureAxisBinding.parameterHExact,exactH);assert.equal(a.inputModel.h,exactH);
  for(const [key,value] of Object.entries(a.sourcePressureCertificate))if(key!=='status')equal(value,p[key]);
  assert.equal(a.sourcePressureCertificate.status,p.domainStatus);assert.equal(a.gates.sourceA21TargetPressureLinked,true);
});
await check('completed pressure/axis bounds do not claim completed outgoing field or whole-profile proof',async()=>{
  for(const key of ['callerSuppliedNormAccepted','quadratureTruthAccepted','exactPressureEqualityWithRepairedE','existingFiniteJetsCertified','fullOriginalParameterOrder','fullPremiseBundleLeanChecked','globalWitness'])assert.equal(p.gates[key],false,key);
  for(const key of ['completedOuterPressureLinked','existingFiniteJetLinked','fullCertificateKernelChecked','fullOriginalParameterOrder','fullProfileCertified','globalWitness'])assert.equal(a.gates[key],false,key);
  assert.equal(a.inputModel.pressure.completedOutgoingPressure,false);
  assert.equal(a.inputModel.pressure.sourceParameters.logP,14);assert.equal(a.inputModel.j0,'3/100');
  assert.notEqual(a.inputModel.pressure.sourceParameters.logP,g.parameters.continuation.pressure.parameters.logP);
  return {sameSourcePressureForPressureAndAxis:true,sameCompletedGlobalDatumAsGluing:false,reason:'The pressure/axis bounds use logP=14,j0=3/100 (axis); the finite gluing example uses logP=0,j0=1e-6.'};
});

const engine=createM1Engine({workerFactory});
const bundle=runs.gluing['replay-bundle'];
async function rehashBundle(value){const {bundleHash,...body}=value;return {...body,bundleHash:await sha256(body)};}
async function submitControl(id,request){const startedAt=new Date().toISOString(),submitted=await engine.submit(request),job=await engine.wait(submitted.id);const record={id,api:'createM1Engine.submit/wait',request:job.request,status:job.status,inputHash:job.inputHash,resultHash:job.resultHash,mathematicalHash:job.mathematicalHash,result:job.result,startedAt,finishedAt:new Date().toISOString()};controls.push(record);return job;}
try{
  await check('terminal replay engine has the exact CLI environment',async()=>equal(await engine.environment(),runs.gluing.environment));
  await check('actual exported gluing bundle replays by recomputation with MATCH',async()=>{
    const replay=await engine.replay(bundle);controls.push({id:'valid-gluing-replay',api:'createM1Engine.replay',...replay});
    assert.equal(replay.status,'MATCH');assert.equal(replay.sourceVerified,true);assert.equal(replay.importedEvidenceTrusted,false);assert.equal(replay.freshHash,bundle.mathematicalHash);
    const fresh=engine.getJob(replay.freshJobId);assert.equal(fresh.status,'PARTIAL');assert.equal(fresh.result.fullProfileCertified,false);
    await output('cli-v53-gluing-replay-bundle.json',await engine.exportBundle(fresh.id));
    const live=await engine.receipt(fresh.id);assert.equal(await engine.verifyReceipt(live),true);assert.equal(await engine.verifyReceipt(copy(live)),false);
    return {status:replay.status,mathematicalHash:replay.freshHash,artifactBytesMatch:replay.artifactBytesMatch,liveReceiptTrusted:true,serializedCloneTrusted:false};
  });
  await check('tampered mathematical result is refused despite recomputed outer bundle digest',async()=>{
    let tampered=copy(bundle);tampered.result.etaStencilCorrections[0].actualDebtFloat64[0]=0;tampered=await rehashBundle(tampered);
    const before=engine.listJobs().length;let error=null;try{await engine.replay(tampered);}catch(e){error=e.message;}
    controls.push({id:'tampered-result',api:'createM1Engine.replay',mutation:'etaStencilCorrections[0].actualDebtFloat64[0]=0; only outer bundleHash recomputed',bundleHash:tampered.bundleHash,rejection:error,newJobs:engine.listJobs().length-before});
    assert.match(error??'',/Replay input\/result digest mismatch/);assert.equal(engine.listJobs().length,before);
  });
  await check('self-consistent forged full-profile promotion yields MISMATCH after real replay',async()=>{
    let forged=copy(bundle);forged.result.fullProfileCertified=true;forged.result.formalPass=true;
    forged.resultHash=await sha256(forged.result);forged.mathematicalHash=await sha256(mathBody(forged.result));forged=await rehashBundle(forged);
    const replay=await engine.replay(forged),fresh=engine.getJob(replay.freshJobId);
    controls.push({id:'self-consistent-promotion-forgery',api:'createM1Engine.replay',mutation:'Set result.fullProfileCertified and formalPass true; recompute result, mathematical and bundle digests',forgedResultHash:forged.resultHash,forgedMathematicalHash:forged.mathematicalHash,forgedBundleHash:forged.bundleHash,...replay,freshStatus:fresh.status,freshFormalPass:fresh.result.formalPass,freshFullProfileCertified:fresh.result.fullProfileCertified});
    assert.equal(replay.status,'MISMATCH');assert.equal(replay.importedEvidenceTrusted,false);assert.equal(fresh.result.formalPass,false);assert.equal(fresh.result.fullProfileCertified,false);assert.equal(fresh.mathematicalHash,bundle.mathematicalHash);
  });
  await check('self-consistent foreign Worker/source environment cannot authorize replay',async()=>{
    let forged=copy(bundle);forged.environment.workerSha256='0'.repeat(64);const {hash:oldHash,...envBody}=forged.environment;forged.environment.hash=await sha256(envBody);forged=await rehashBundle(forged);
    const before=engine.listJobs().length;let error=null;try{await engine.replay(forged);}catch(e){error=e.message;}
    controls.push({id:'foreign-source-environment',api:'createM1Engine.replay',mutation:'Replace workerSha256; recompute environment and bundle digests',forgedEnvironmentHash:forged.environment.hash,forgedBundleHash:forged.bundleHash,rejection:error,newJobs:engine.listJobs().length-before});
    assert.match(error??'',/same installed source and environment/);assert.equal(engine.listJobs().length,before);
  });
  await check('actual Worker rejects an unsupported 100-bit gluing request',async()=>{
    const request=copy(bundle.request);request.precision.bits=100;const job=await submitControl('high-precision-request',request);
    assert.equal(job.status,'PRECISION_REQUIRED');assert.equal(job.request.precision.bits,100);assert.notEqual(job.result.formalPass,true);assert.notEqual(job.result.fullProfileCertified,true);
  });
  await check('actual Worker preserves maxOperations=1 and returns BUDGET_EXCEEDED',async()=>{
    const request=copy(bundle.request);request.budget.maxOperations=1;const job=await submitControl('one-operation-budget',request);
    assert.equal(job.status,'BUDGET_EXCEEDED');assert.equal(job.request.budget.maxOperations,1);assert.notEqual(job.result.formalPass,true);assert.notEqual(job.result.fullProfileCertified,true);
  });
  await check('actual Worker rejects caller-supplied gluing debt instead of bypassing the measured path',async()=>{
    const request=copy(bundle.request);request.input.actualDebt=[0,0,0,0,0];const job=await submitControl('caller-supplied-debt',request);
    assert.equal(job.status,'FAILED');assert.match(JSON.stringify(job.result),/actualDebt|unknown|Unknown|unsupported|Unsupported/);assert.notEqual(job.result.formalPass,true);
  });
}finally{engine.dispose();}
await check('build/source pins remain unchanged after terminal controls',async()=>{
  equal(await json('mathscope-m1/build-manifest.json'),build);
  for(const item of sourcePinResults)assert.equal(hash(await read(item.path)),item.expected);
  assert.equal(hash(await read('mathscope-m1/cli.mjs')),commandRecord.cliSourceSha256);
});

await output('cli-v53-controls.json',{schema:'MathScope.M1.CliV53PublicEngineControls/1',transport:'Bounded Node Worker; same public createM1Engine API and environment as CLI',notNativeCliReplay:true,controls});
const passed=checks.filter(x=>x.pass).length,failed=checks.length-passed;
const candidates=Object.fromEntries(Object.entries(runs).map(([id,run])=>[id,{example:run.summary.example.id,status:run.summary.status,inputHash:run.summary.inputHash,environmentHash:run.summary.environmentHash,resultHash:run.summary.resultHash,mathematicalHash:run.summary.mathematicalHash,bundleHash:run.summary.bundleHash}]));
const result={schema:'MathScope.M1.CliV53IntegrationAudit/1',startedAt,finishedAt:new Date().toISOString(),status:failed?'FAIL':'PASS',command:['node','mathscope-m1/evidence/cli-v53-verify.mjs'],cwd:root,nodeVersion:process.version,
  passed,failed,total:checks.length,checks,
  actualCli:{invocations:7,registryListInvocations:1,fixedExampleComputations:3,negativeInvocations:3,commandRecord:'cli-v53-commands.json',registryCommand:{command:['node','mathscope-m1/cli.mjs','list','--json'],exitCode:0,timingNotCaptured:true,output:'cli-v53-registry.json',outputSha256:hash(await read('mathscope-m1/evidence/cli-v53-registry.json'))}},
  publicEngineControls:{count:controls.length,workerComputations:5,validReplay:1,forgedPromotionRecomputation:1,precisionBudgetAndCallerDebt:3,rejectionsBeforeJobCreation:2,artifact:'cli-v53-controls.json',nativeCliReplaySubcommandExists:false},
  candidates,build:{snapshot:'cli-v53-build-snapshot.json',workerSha256:build.workerSha256,workerBytes:build.workerBytes,appBundleSha256:build.bundleSha256,appBundleExecutedByThisAudit:false},sourcePins:sourcePinResults,
  evidenceBoundary:{browserUsed:false,mathematicalDomainTestsRerun:false,all59ExamplesExecuted:false,leanCompilerRunByThisAudit:false,newFullProfileCertificate:false,exportedEvidenceTrusted:false,scope:'Three actual installed CLI examples; exported artifact integrity; actual bounded public-engine replay and negative controls. CLI supports fixed-example list/run only. Exact source pressure and axis bounds do not close the finite gluing candidate into one globally certified datum.'},
  harnessCorrections:await json('mathscope-m1/evidence/cli-v53-harness-corrections.json')};
await output('cli-v53-validation.json',result);
const tap=['TAP version 13',...checks.map((c,i)=>`${c.pass?'ok':'not ok'} ${i+1} - ${c.name}`+(c.pass?'':`\n  ---\n  error: ${JSON.stringify(c.error)}\n  ...`)),`1..${checks.length}`,`# pass ${passed}`,`# fail ${failed}`].join('\n')+'\n';
await writeFile(resolve(evidence,'cli-v53-validation.tap'),tap,{flag:'wx'});
console.log(JSON.stringify({status:result.status,passed,failed,total:checks.length,actualCliInvocations:7,publicEngineControls:controls.length,candidates},null,2));
if(failed)process.exitCode=1;
