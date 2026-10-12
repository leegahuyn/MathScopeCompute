import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker as NodeWorker} from 'node:worker_threads';
import {createM2Engine} from '../engine.mjs';
import {WORKER_SOURCE,WORKER_SHA256} from '../worker-data.mjs';
import {listExamples} from '../registry.mjs';
import {sha256} from '../../../mathscope-m0/contracts.mjs';

// Execute the shipped worker bytes in an isolated native worker. The bridge
// provides only the Web Worker message API, not replacement mathematics.
function nativeWorkerFactory(source){
  const bridge="const {parentPort}=require('node:worker_threads');globalThis.self=globalThis;globalThis.postMessage=data=>parentPort.postMessage(data);parentPort.on('message',data=>globalThis.onmessage({data}));\n";
  const native=new NodeWorker(bridge+source,{eval:true}),adapter={
    onmessage:null,onerror:null,postMessage:value=>native.postMessage(value),terminate:()=>native.terminate()
  };
  native.on('message',data=>adapter.onmessage?.({data}));
  native.on('error',error=>adapter.onerror?.({message:error.message}));
  return adapter;
}

const copy=x=>JSON.parse(JSON.stringify(x));
const finiteRequest={kind:'arithmetic.elliptic',input:{p:'3',m:2,polynomial:[1,0,1]}};
async function run(engine,request){const queued=await engine.submit(request);return engine.wait(queued.id);}
function ownedEngine(t,options){const engine=createM2Engine(options);t.after(()=>engine.dispose());return engine;}
async function reseal(bundle){const {bundleHash,...body}=bundle;bundle.bundleHash=await sha256(body);return bundle;}

test('pinned worker digest matches its actual bundled source bytes',async()=>{
  assert.ok(WORKER_SOURCE.length>10000);
  assert.match(WORKER_SHA256,/^[0-9a-f]{64}$/);
  assert.equal(await sha256(WORKER_SOURCE),WORKER_SHA256);
});

test('actual isolated worker and local modules agree for arithmetic, lattice gauge and Navier diagnostics',async t=>{
  const local=ownedEngine(t,{local:true}),worker=ownedEngine(t,{workerFactory:nativeWorkerFactory});
  const examples=await listExamples(),requests=[finiteRequest,
    examples.find(x=>x.id==='m2-su2-center-holonomy').request,
    examples.find(x=>x.id==='ns-m2-curl').request,
    examples.find(x=>x.id==='ns-m2-cutoffs').request
  ];
  const [le,we]=await Promise.all([local.environment(),worker.environment()]);
  assert.equal(le.workerSha256,we.workerSha256);
  assert.notEqual(le.hash,we.hash,'local and worker execution environments must remain distinguished');
  for(const request of requests){
    const a=await run(local,request),b=await run(worker,request);
    assert.ok(['COMPLETED','PARTIAL'].includes(a.status),request.kind+' must compute within its explicit scope');
    assert.equal(b.status,a.status,request.kind);
    assert.equal(b.inputHash,a.inputHash,request.kind);
    assert.equal(b.mathematicalHash,a.mathematicalHash,request.kind+' worker bytes must match current modules');
    assert.equal(b.result.visualization.sourceHash||b.result.sourceHash||null,a.result.visualization.sourceHash||a.result.sourceHash||null,request.kind);
    assert.ok(b.result.visualization.points.length||b.result.visualization.lines.length,request.kind+' has source-derived geometry');
  }
});

test('same-worker replay recomputes exact results and never trusts serialized evidence',async t=>{
  const worker=ownedEngine(t,{workerFactory:nativeWorkerFactory}),job=await run(worker,finiteRequest);
  const exported=await worker.exportBundle(job.id),report=await worker.replay(copy(exported));
  assert.equal(report.status,'MATCH');
  assert.equal(report.artifactBytesMatch,true);
  assert.equal(report.sourceVerified,true);
  assert.equal(report.importedEvidenceTrusted,false);
  assert.notEqual(report.freshJobId,job.id);
  const fresh=worker.getJob(report.freshJobId);
  assert.equal(fresh.mathematicalHash,job.mathematicalHash);
});

test('replay rejects mutations in envelope, exact input, result and pinned environment',async t=>{
  const engine=ownedEngine(t,{local:true}),job=await run(engine,finiteRequest),original=await engine.exportBundle(job.id);
  const envelope=copy(original);envelope.inputHash='f'.repeat(64);
  await assert.rejects(engine.replay(envelope),/bundle digest mismatch/);
  const input=copy(original);input.request.input.p='5';await reseal(input);
  await assert.rejects(engine.replay(input),/input\/result digest mismatch/);
  const result=copy(original);result.result.uncomputedClaim='fabricated';await reseal(result);
  await assert.rejects(engine.replay(result),/input\/result digest mismatch/);
  const environment=copy(original);environment.environment.workerSha256='f'.repeat(64);await reseal(environment);
  await assert.rejects(engine.replay(environment),/same installed source and environment/);
  const semantic=copy(original);semantic.mathematicalHash='f'.repeat(64);await reseal(semantic);
  await assert.rejects(engine.replay(semantic),/mathematical result digest mismatch/);
});

test('a fully rehashed forged finite result is still detected by fresh mathematical recomputation',async t=>{
  const engine=ownedEngine(t,{local:true}),job=await run(engine,finiteRequest),forged=copy(await engine.exportBundle(job.id));
  forged.result.uncomputedClaim='not part of the actual elliptic computation';
  forged.resultHash=await sha256(forged.result);
  const {executionMetrics,...mathematicalBody}=forged.result;
  forged.mathematicalHash=await sha256(mathematicalBody);
  await reseal(forged);
  const report=await engine.replay(forged);
  assert.equal(report.status,'MISMATCH');
  assert.equal(report.importedEvidenceTrusted,false);
});

test('an authentic serialized replay cannot cross local/worker environment boundaries',async t=>{
  const local=ownedEngine(t,{local:true}),worker=ownedEngine(t,{workerFactory:nativeWorkerFactory}),job=await run(local,finiteRequest);
  await assert.rejects(worker.replay(await local.exportBundle(job.id)),/same installed source and environment/);
});

test('environment binds the actual runtime identity and finite IEEE754 math profile',async t=>{
  const first=ownedEngine(t,{local:true}),second=ownedEngine(t,{local:true});
  const a=await first.environment(),b=await second.environment();
  assert.equal(a.schema,'MathScope.M2Environment/2');
  assert.equal(a.runtime.identity.version,process.versions.node);
  assert.equal(a.runtime.identity.engineVersion,process.versions.v8);
  assert.equal(a.runtime.identity.platform,process.platform);
  assert.equal(a.runtime.identity.architecture,process.arch);
  assert.equal(a.runtime.portabilityGuarantee,false);
  assert.equal(a.hash,b.hash,'same actual runtime must keep a stable replay environment');
  const samples=a.runtime.mathProbe.samples;
  assert.equal(samples.length,18);assert.ok(samples.every(x=>/^[0-9a-f]{16}$/.test(x.float64)));
  assert.equal(a.runtime.mathProbe.sha256,await sha256(samples));
  const {hash,...body}=a;assert.equal(hash,await sha256(body));
});

test('fully resealed runtime identity or Math-profile changes are rejected before replay dispatch',async t=>{
  const engine=ownedEngine(t,{local:true}),job=await run(engine,finiteRequest),original=await engine.exportBundle(job.id);
  for(const mutation of ['runtime-version','math-probe']){
    const forged=copy(original);
    if(mutation==='runtime-version')forged.environment.runtime.identity.engineVersion+='-different';
    else {
      forged.environment.runtime.mathProbe.samples[0].float64='0000000000000000';
      forged.environment.runtime.mathProbe.sha256=await sha256(forged.environment.runtime.mathProbe.samples);
    }
    const {hash,...environmentBody}=forged.environment;
    forged.environment.hash=await sha256(environmentBody);await reseal(forged);
    const count=engine.listJobs().length;
    await assert.rejects(engine.replay(forged),/same installed source and environment/);
    assert.equal(engine.listJobs().length,count,'environment mismatch must not submit a new job');
  }
});

test('worker cancellation produces a terminal diagnostic and late result messages cannot revive it',async t=>{
  let adapter;
  const factory=()=>adapter={postMessage(){},terminate(){},onmessage:null,onerror:null};
  const engine=ownedEngine(t,{workerFactory:factory}),submitted=await engine.submit(finiteRequest);
  assert.equal(engine.cancel(submitted.id),true);
  const cancelled=await engine.wait(submitted.id);
  assert.equal(cancelled.status,'CANCELLED');
  assert.equal(cancelled.result.evidenceGrade,'UNKNOWN');
  adapter.onmessage({data:{type:'result',result:{status:'COMPLETED',evidenceGrade:'FORMAL PASS'}}});
  await Promise.resolve();
  assert.equal(engine.getJob(submitted.id).status,'CANCELLED');
  assert.equal(engine.cancel(submitted.id),false);
});

test('a nonresponsive execution reaches the bounded watchdog rather than claiming completion',async t=>{
  const factory=()=>({postMessage(){},terminate(){},onmessage:null,onerror:null});
  const engine=ownedEngine(t,{workerFactory:factory});
  const result=await run(engine,{...finiteRequest,budget:{maxMillis:1}});
  assert.equal(result.status,'BUDGET_EXCEEDED');
  assert.equal(result.result.evidenceGrade,'UNKNOWN');
  assert.ok(result.result.blockers.length>0);
});
