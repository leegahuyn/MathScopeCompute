import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker as NodeWorker} from 'node:worker_threads';
import {getEventListeners} from 'node:events';
import {createM2Engine} from '../engine.mjs';
import {parseReplayText,IMPORT_TEXT_MAX_BYTES} from '../replay-import.mjs';
import {evidenceURL} from '../evidence-links.mjs';
import {createM2Tools} from '../../webmcp.mjs';
import {sha256} from '../../../mathscope-m0/contracts.mjs';

const request={kind:'arithmetic.elliptic',input:{p:'3',m:2,polynomial:[1,0,1]}};
const copy=x=>JSON.parse(JSON.stringify(x));
function engine(t,options={local:true}){const value=createM2Engine(options);t.after(()=>value.dispose());return value;}
async function exported(e){const j=await e.submit(request);await e.wait(j.id);return e.exportBundle(j.id);}
async function seal(value){const {bundleHash,...body}=value;value.bundleHash=await sha256(body);return value;}

// The producer runs the actual shipped worker bytes. The suspended consumer
// below tests cancellation only; it never supplies a replacement calculation.
function nativeWorkerFactory(source){
  const bridge="const {parentPort}=require('node:worker_threads');globalThis.self=globalThis;globalThis.postMessage=data=>parentPort.postMessage(data);parentPort.on('message',data=>globalThis.onmessage({data}));\n";
  const native=new NodeWorker(bridge+source,{eval:true}),adapter={onmessage:null,onerror:null,postMessage:value=>native.postMessage(value),terminate:()=>native.terminate()};
  native.on('message',data=>adapter.onmessage?.({data}));
  native.on('error',error=>adapter.onerror?.({message:error.message}));
  return adapter;
}
function suspendedWorker(){
  const instances=[];
  return {instances,factory:()=>{const adapter={onmessage:null,onerror:null,messages:[],terminations:0,postMessage(message){this.messages.push(message);},terminate(){this.terminations++;}};instances.push(adapter);return adapter;}};
}

test('a downloaded JSON bundle can be inspected and replayed in a fresh matching session',async t=>{
  const original=engine(t),fresh=engine(t),bundle=await exported(original);
  const parsed=parseReplayText('\uFEFF'+JSON.stringify(bundle,null,2));
  const before=fresh.listSummaries();
  const inspection=await fresh.inspectBundle(parsed);
  assert.deepEqual(fresh.listSummaries(),before,'inspection cannot submit or adopt a job');
  assert.equal(inspection.summary.sameEnvironment,true);
  assert.equal(inspection.summary.importedEvidenceTrusted,false);
  assert.equal(await fresh.verifyReceipt(parsed.result),false);
  let submitted=null;const replay=await fresh.replay(parsed,{onSubmitted:j=>{submitted=j;}});
  assert.equal(replay.status,'MATCH');assert.equal(replay.artifactBytesMatch,true);
  assert.equal(replay.freshJobId,submitted.id);
  assert.equal(fresh.listJobs().length,1,'only the newly computed result is owned');
  const receipt=await fresh.receipt(replay.freshJobId);
  assert.equal(await fresh.verifyReceipt(receipt),true);
  assert.equal(await fresh.verifyReceipt(copy(receipt)),false);
});

test('text import rejects invalid, excessive and non-object input before engine effects',()=>{
  for(const raw of ['', '  ', '{no}', '[]', 'null', '"a bundle"'])assert.throws(()=>parseReplayText(raw));
  assert.throws(()=>parseReplayText(' '.repeat(IMPORT_TEXT_MAX_BYTES)+'{}'),/32 MiB/);
  assert.throws(()=>parseReplayText('{"x":'.repeat(130)+'0'+'}'.repeat(130)),/중첩/);
  assert.throws(()=>parseReplayText(42));
});

test('untrusted file claims cannot bypass input, result, or environment integrity',async t=>{
  const producer=engine(t),consumer=engine(t),bundle=await exported(producer);
  const mutations=[
    async b=>{b.result.forged=true;},
    async b=>{b.request.input.p='5';await seal(b);},
    async b=>{b.environment.hash='0'.repeat(64);await seal(b);},
    async b=>{b.trust='FORMAL PASS';await seal(b);},
    async b=>{b.unknown='extra field';await seal(b);}
  ];
  for(const mutate of mutations){const b=copy(bundle);await mutate(b);await assert.rejects(consumer.inspectBundle(b));assert.equal(consumer.listJobs().length,0);}
  const b=copy(bundle);Object.defineProperty(b.result,'__proto__',{value:{admin:true},enumerable:true});
  await assert.rejects(consumer.inspectBundle(b),/reserved object key/);
  assert.equal({}.admin,undefined);
});

test('an intact file from a different execution environment is input-only and cannot replay',async t=>{
  const producer=engine(t),consumer=engine(t,{workerFactory:()=>({postMessage(){},terminate(){}})}),bundle=await exported(producer);
  const inspection=await consumer.inspectBundle(bundle);
  assert.equal(inspection.summary.canLoadInput,true);assert.equal(inspection.summary.canReplay,false);
  assert.deepEqual(inspection.request,bundle.request);
  await assert.rejects(consumer.replay(bundle),e=>e.code==='IMPORT_ENVIRONMENT_MISMATCH');
  assert.equal(consumer.listJobs().length,0);
});

test('hash-consistent fabricated results remain untrusted and fail fresh comparison',async t=>{
  const producer=engine(t),consumer=engine(t),bundle=await exported(producer);
  bundle.result.injectedVerdict='FORMAL PASS';bundle.resultHash=await sha256(bundle.result);
  const {executionMetrics,...body}=bundle.result;bundle.mathematicalHash=await sha256(body);await seal(bundle);
  assert.equal((await consumer.inspectBundle(bundle)).summary.integrity,'HASHES_CONSISTENT');
  const report=await consumer.replay(bundle);
  assert.equal(report.status,'MISMATCH');assert.equal(report.importedEvidenceTrusted,false);
  assert.equal(consumer.getJob(report.freshJobId).result.injectedVerdict,undefined);
});

test('import replay cancellation before dispatch creates no owned job',async t=>{
  const producer=engine(t),consumer=engine(t),bundle=await exported(producer),controller=new AbortController();controller.abort();
  await assert.rejects(consumer.replay(bundle,{signal:controller.signal}),e=>e.code==='CANCELLED');
  assert.equal(consumer.listJobs().length,0);
});

test('a changed input or session guard rejects after asynchronous work before inserting any job',async t=>{
  const producer=engine(t),consumer=engine(t),bundle=await exported(producer),notifications=[];
  consumer.subscribe(job=>notifications.push(job));
  let current=true,guardCalls=0,submissions=0;
  const pendingSubmit=consumer.submit(request,{shouldDispatch:()=>{guardCalls++;return current;}});
  current=false;
  await assert.rejects(pendingSubmit,e=>e.code==='INPUT_CHANGED');
  assert.equal(guardCalls,1,'submit checks freshness after its awaited environment/input digest');
  assert.deepEqual(consumer.listJobs(),[]);
  assert.deepEqual(notifications,[],'a stale request cannot reach QUEUED or RUNNING');

  current=true;
  const pendingReplay=consumer.replay(bundle,{shouldDispatch:()=>{guardCalls++;return current;},onSubmitted:()=>{submissions++;}});
  current=false;
  await assert.rejects(pendingReplay,e=>e.code==='INPUT_CHANGED');
  assert.equal(guardCalls,2,'replay forwards the final dispatch guard');
  assert.equal(submissions,0);
  assert.deepEqual(consumer.listJobs(),[]);
  assert.deepEqual(notifications,[]);

  const accepted=await consumer.replay(bundle,{shouldDispatch:()=>true});
  assert.equal(accepted.status,'MATCH','a still-current guarded import remains usable');
});

test('cancelling an import after submission terminates its worker and ignores a late result',async t=>{
  const producer=engine(t,{workerFactory:nativeWorkerFactory}),bundle=await exported(producer),suspended=suspendedWorker(),consumer=engine(t,{workerFactory:suspended.factory}),controller=new AbortController();
  let freshId;
  const report=await consumer.replay(bundle,{signal:controller.signal,onSubmitted:job=>{
    freshId=job.id;
    assert.equal(consumer.getJob(job.id).status,'RUNNING');
    assert.equal(suspended.instances[0].messages.length,1,'the worker already received the request');
    controller.abort();
  }});
  assert.equal(report.freshJobId,freshId);
  assert.equal(report.status,'CANCELLED');
  assert.equal(report.importedEvidenceTrusted,false);
  assert.equal(consumer.getJob(freshId).result.evidenceGrade,'UNKNOWN');
  assert.equal(suspended.instances[0].terminations,1);
  assert.equal(getEventListeners(controller.signal,'abort').length,0);
  suspended.instances[0].onmessage({data:{type:'result',result:bundle.result}});
  await Promise.resolve();
  assert.equal(consumer.getJob(freshId).status,'CANCELLED','late worker output cannot revive the cancelled import');
  assert.equal(await consumer.verifyReceipt(bundle.result),false);
});

test('a failed submission callback cancels and settles the fresh job before replay rejects',async t=>{
  const producer=engine(t,{workerFactory:nativeWorkerFactory}),bundle=await exported(producer),suspended=suspendedWorker(),consumer=engine(t,{workerFactory:suspended.factory}),controller=new AbortController(),callbackError=Error('Selection/render callback failed');
  let freshId;
  await assert.rejects(consumer.replay(bundle,{signal:controller.signal,onSubmitted:job=>{
    freshId=job.id;
    assert.equal(consumer.getJob(job.id).status,'RUNNING');
    throw callbackError;
  }}),error=>error===callbackError);
  const fresh=consumer.getJob(freshId);
  assert.equal(fresh.status,'CANCELLED');
  assert.equal(fresh.result.evidenceGrade,'UNKNOWN');
  assert.equal(typeof fresh.finishedAt,'string','cancellation settles before the callback error is returned');
  assert.equal(suspended.instances[0].terminations,1);
  assert.equal(getEventListeners(controller.signal,'abort').length,0,'failed callbacks leave no replay abort listener');
  suspended.instances[0].onmessage({data:{type:'result',result:bundle.result}});
  await Promise.resolve();
  assert.equal(consumer.getJob(freshId).status,'CANCELLED');
});

test('WebMCP import rejects invalid modes, oversized text and aborted calls without application effects',async()=>{
  let effects=0;const api={inspectImport:async()=>({ok:true}),importBundle:async(json,options)=>{effects++;return {ok:true,mode:options.mode};},exportBundle:async id=>({id})};
  const tools=createM2Tools(api),importer=tools.find(t=>t.name.endsWith('.import_bundle')),inspector=tools.find(t=>t.name.endsWith('.inspect_import'));
  for(const input of [{json:'{}',mode:'TRUST'}, {json:42,mode:'REPLAY'}, {json:'x'.repeat(280001),mode:'REPLAY'}, {json:'{}',mode:'REPLAY',extra:true}])assert.equal((await importer.execute(input)).ok,false);
  assert.equal((await importer.execute({json:'{}',mode:'REPLAY'},{signal:{aborted:true}})).code,'CANCELLED');
  assert.equal(effects,0);assert.equal((await inspector.execute({json:'{}'})).ok,true);
  assert.equal((await importer.execute({json:'{}',mode:'INPUT_ONLY'})).mode,'INPUT_ONLY');assert.equal(effects,1);
});

test('criterion evidence links stay inside the declared source tree',()=>{
  assert.equal(evidenceURL('mathscope-m2/gauge/evidence/tests.tap'),'https://github.com/leegahuyn/MathScopeCompute/blob/mathscope-m2-completion-20261011/research-ide/mathscope-m2/gauge/evidence/tests.tap');
  for(const path of ['javascript:alert(1)','https://example.com/file','../x','mathscope-m2/../secret','mathscope-m2//file','mathscope-m2/a?x','mathscope-m2/./file'])assert.equal(evidenceURL(path),null);
});
