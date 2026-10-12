import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {Worker} from 'node:worker_threads';
import {createP8Engine} from '../p8/engine.mjs';
import {sha256,cloneJSON} from '../p8/contracts.mjs';

const build=JSON.parse(await fs.readFile(new URL('../p8/build-data.json',import.meta.url),'utf8'));
const engine=await createP8Engine(build),examples=engine.capabilities().examples;
const request=id=>examples.find(e=>e.id===id).request;
async function rehash(record){record.resultSHA256=await sha256(record.result);const {recordSHA256,...body}=record;record.recordSHA256=await sha256(body);return record;}

test('all advertised P8 examples execute; no whole milestone or browser kernel promotion',async()=>{
  for(const example of examples){const record=await engine.run(example.request);assert.equal(record.execution.status,'COMPLETED',example.id+': '+record.error?.message);assert.equal(record.scope.wholeM3Complete,false);assert.equal(record.scope.proofStatusPromoted,false);if(record.result.lean)assert.equal(record.result.lean.freshKernelExecuted,false);}
  const object=await engine.run(request('p8-object'));assert.equal(object.result.validation.ok,true);
  const conditional=await engine.run(request('p8-conditional'));assert.equal(conditional.result.status,'CONDITIONAL_ON_TARGET');
});
test('fresh replay matches exact results while rehashed false finite witnesses fail',async()=>{
  const record=await engine.run(request('p8-finite'));const replay=await engine.replay(record);assert.equal(replay.status,'MATCH');assert.equal(replay.importedProofStatusAdopted,false);
  const forged=cloneJSON(record);forged.result.certificate.data.pointCount='999';await rehash(forged);
  const rejection=await engine.replay(forged);assert.equal(rejection.status,'MISMATCH_OR_UNRESOLVED');assert.equal(rejection.checks.result,false);assert.equal(rejection.fresh.result.certificate.data.pointCount,'8');
});
test('stale sources, request tampering and imported completion claims cannot survive replay',async()=>{
  const record=await engine.run(request('p8-finite'));
  const stale=cloneJSON(record);stale.sourceBinding.manifestSHA256='0'.repeat(64);await rehash(stale);assert.equal((await engine.replay(stale)).checks.source,false);
  const altered=cloneJSON(record);altered.request.input.prime='7';await rehash(altered);await assert.rejects(()=>engine.replay(altered),/integrity/);
  const promoted=cloneJSON(record);promoted.scope.wholeM3Complete=true;await rehash(promoted);await assert.rejects(()=>engine.replay(promoted),/authority/);
});
test('unsupported math returns failed execution with no certificate; failed runs never replay MATCH',async()=>{
  const failed=await engine.run({kind:'p8.finite_certificate',input:{prime:'2',traceLength:7}});assert.equal(failed.execution.status,'FAILED');assert.equal(failed.result,null);assert.equal((await engine.replay(failed)).status,'MISMATCH_OR_UNRESOLVED');
  await assert.rejects(()=>engine.run({kind:'p8.finite_certificate',input:{prime:'5',traceLength:7},formalComplete:true}));
});
test('request snapshot cannot be changed by a caller during asynchronous hashing',async()=>{
  const input=cloneJSON(request('p8-finite')),promise=engine.run(input);input.input.prime='7';const result=await promise;assert.equal(result.request.input.prime,'5');assert.equal(result.result.certificate.data.curve.prime,'5');
});

test('recorded Linux controls remain separate from fresh browser mutations and replay deterministically',async()=>{
  const record=await engine.run(request('p8-mutations')),check=record.result.recordedP7Mutations;
  const packaged=build.recordedChecks.p7Mutations.report,files=build.sourceBinding.files;
  const recordedSources=[...packaged.sourceBinding.files.map(row=>({path:'mathscope-m3/'+row.path,sha256:row.sha256})),
    {path:'mathscope-m3/p8/tools/audit_p7_mutations.py',sha256:packaged.auditSourceSHA256},
    {path:'mathscope-m3/tests/test_p8_p7_mutations.py',sha256:packaged.testHarness.sourceSHA256}];
  const core=files.filter(row=>row.path==='mathscope-m3/cli.py'||/^mathscope-m3\/p7\/[^/]+\.py$/.test(row.path));
  const sameCurrentSources=recordedSources.every(row=>files.some(actual=>actual.path===row.path&&actual.sha256===row.sha256))&&core.every(row=>recordedSources.some(saved=>saved.path===row.path));
  assert.equal(check.status,sameCurrentSources?'RECORDED_CI_SOURCE_MATCH':'RECORDED_CI_REJECTED',JSON.stringify(check.issues));
  assert.equal(check.freshExecution,false);assert.equal(check.formalLeanProofIssued,false);
  if(sameCurrentSources){assert.deepEqual(check.report.cases.map(x=>x.id),['zero-box','rank-upper']);assert.equal(check.process.pytestExitCode,0);}
  else {assert.equal(check.ok,false);assert.match(check.issues.join(' '),/stale|membership|version/);}
  assert.equal((await engine.replay(record)).status,'MATCH');
});
test('review export separates five scoped releases from conjecture resolution',async()=>{
  const result=await engine.exportReviewPackets();assert.deepEqual(result.packets.map(p=>p.id),['P1-P3','P4','P5-P6','P7','P8']);
  for(const packet of result.packets){assert.ok(packet.remainingProofs.length);assert.ok(packet.fixtures.length);assert.equal(packet.releaseAcceptance.allOriginalCriteriaComplete,false);assert.ok(Object.values(packet.conjectureResolution).every(x=>x===false));const {packetSHA256,...body}=packet;assert.equal(packetSHA256,await sha256(body));}
});
test('the published static worker survives Publisher escape rewriting and agrees with Node source',async()=>{
  const bundle=await fs.readFile(new URL('../web/p8-engine.bundle.js',import.meta.url),'utf8');
  const published=bundle.replace(/\\u([\da-f]{4})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
  assert.equal(published,bundle);
  const source=vm.runInNewContext(published.match(/^  const source=(.+);$/m)[1],{TextDecoder,Uint8Array,atob});
  assert.doesNotMatch(source,/^\s*(?:import|export)\s/m);
  const bootstrap="const {parentPort}=require('node:worker_threads'); globalThis.self=globalThis; self.postMessage=x=>parentPort.postMessage(x); parentPort.on('message',x=>self.onmessage({data:x}));\n";
  const worker=new Worker(bootstrap+source,{eval:true});
  try {
    const actual=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('static worker timeout')),15000);worker.once('error',e=>{clearTimeout(timer);reject(e);});worker.once('message',value=>{clearTimeout(timer);value.error?reject(Error(value.error)):resolve(value.result);});worker.postMessage({id:1,method:'run',input:request('p8-finite')});});
    const expected=await engine.run(request('p8-finite'));assert.equal(actual.execution.status,'COMPLETED');assert.equal(actual.resultSHA256,expected.resultSHA256);assert.equal(actual.sourceBinding.manifestSHA256,expected.sourceBinding.manifestSHA256);
  }finally{await worker.terminate();}
});
