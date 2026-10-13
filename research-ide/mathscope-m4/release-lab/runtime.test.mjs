import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { createReleaseLab } from './runtime.mjs';
import { createM1Engine } from '../../mathscope-m1/core/engine.mjs';
import { createM2Engine } from '../../mathscope-m2/core/engine.mjs';
import { normalizeRequest as normalizeM1 } from '../../mathscope-m1/core/registry.mjs';
import { normalizeRequest as normalizeM2 } from '../../mathscope-m2/core/registry.mjs';
import { getExamples as navierExamples } from '../../mathscope-m1/navier/index.mjs';
import { getExamples as gaugeExamples } from '../../mathscope-m1/gauge/index.mjs';
import { readFile } from 'node:fs/promises';

function workerFactory(source) {
  const bridge="const {parentPort}=require('node:worker_threads');globalThis.self=globalThis;globalThis.postMessage=data=>parentPort.postMessage(data);parentPort.on('message',data=>globalThis.onmessage({data}));\n";
  const worker=new Worker(bridge+source,{eval:true}),adapter={onmessage:null,onerror:null,postMessage:x=>worker.postMessage(x),terminate:()=>worker.terminate()};
  worker.on('message',x=>adapter.onmessage?.({data:x}));worker.on('error',e=>adapter.onerror?.({message:e.message}));return adapter;
}
const request={kind:'arithmetic.projective',input:{p:'3',n:1,m:1},precision:{N:4},budget:{maxMillis:30000,maxBytes:8388608,maxItems:250000,maxOperations:50000000}};
function laboratory(t,options={}){const lab=createReleaseLab({catalog:[{id:'p1',engine:'M2',request},{id:'other',engine:'M2',request}],factories:{M1:()=>createM1Engine({workerFactory}),M2:()=>createM2Engine({workerFactory})},normalizers:{M1:normalizeM1,M2:normalizeM2},...options});t.after(()=>lab.dispose());return lab;}
test('fresh isolated Worker replay matches; serialized claims never grant formal status',async t=>{
  const lab=laboratory(t),job=await lab.run('p1');assert.equal(job.state,'COMPLETED');assert.match(job.workerSHA256,/^[0-9a-f]{64}$/);
  const bundle=await lab.exportRecord(job.id),fresh=await lab.replay(JSON.parse(JSON.stringify(bundle)));assert.equal(fresh.report.status,'MATCH');assert.equal(fresh.job.formalPass,false);assert.equal(fresh.job.stale,false);
  await assert.rejects(lab.replay({...bundle,formalPass:true}),/TRUST_REJECTED/);
  const wrong=structuredClone(bundle);wrong.bundle.environment.workerSha256='0'.repeat(64);await assert.rejects(lab.replay(wrong),/digest|source|environment/i);
});
test('input changed during calculation yields STALE; unrelated fixture stays current',async t=>{
  const lab=laboratory(t),other=await lab.run('other');
  const pending=lab.run('p1');lab.update('p1',{...request,input:{...request.input,p:'5'}});const result=await pending;
  assert.equal(result.stale,true);assert.equal(lab.job(other.id).stale,false);await assert.rejects(lab.exportRecord(result.id),/STALE_INPUT/);
});
test('cancel then resume recomputes the original interrupted input',async t=>{
  const lab=laboratory(t),pending=lab.run('p1');lab.cancel();const stopped=await pending;assert.equal(stopped.state,'CANCELLED');
  lab.update('p1',{...request,input:{...request.input,p:'5'}});const resumed=await lab.resume(stopped.id);assert.equal(resumed.request.input.p,'3');assert.equal(resumed.stale,true);assert.equal(resumed.state,'COMPLETED');
});
test('M1 replay binds normalized engine defaults to the same raw editor request',async t=>{
  const original=navierExamples().find(x=>x.id==='ns-taylor-green').request;
  const lab=laboratory(t,{catalog:[{id:'tg',engine:'M1',request:original}]});
  const result=await lab.run('tg'),record=await lab.exportRecord(result.id),fresh=await lab.replay(record);
  assert.equal(fresh.report.status,'MATCH');assert.equal(fresh.job.stale,false);
  assert.deepEqual(lab.request('tg'),original,'normalization must preserve the raw editor contents');
});
test('different valid imported inputs stay STALE and a foreign fixture kind is rejected',async t=>{
  const lab=laboratory(t);lab.update('other',{...request,input:{...request.input,n:0}});
  const result=await lab.run('other'),record=await lab.exportRecord(result.id);record.fixtureId='p1';
  const fresh=await lab.replay(record);assert.equal(fresh.report.status,'MATCH');assert.equal(fresh.job.stale,true);
  await assert.rejects(lab.exportRecord(fresh.job.id),/STALE_INPUT/);
  assert.throws(()=>lab.update('p1',{...request,kind:'arithmetic.elliptic'}),/FIXTURE_KIND_MISMATCH/);
  const forged=structuredClone(record);forged.bundle.request.kind='arithmetic.elliptic';
  await assert.rejects(lab.replay(forged),/FIXTURE_KIND_MISMATCH/);
});
test('M1 replay cancellation before dispatch reaches the subsequently queued job',async t=>{
  const original=navierExamples().find(x=>x.id==='ns-taylor-green').request;
  const lab=laboratory(t,{catalog:[{id:'tg',engine:'M1',request:original}]});
  const result=await lab.run('tg'),record=await lab.exportRecord(result.id),pending=lab.replay(record);
  assert.equal(lab.cancel(),true);const fresh=await pending;
  assert.equal(fresh.job.state,'CANCELLED');assert.equal(fresh.report.status,'CANCELLED');
});
test('retained job cap rejects another engine allocation; disposal closes the laboratory',async t=>{
  const lab=laboratory(t,{maxJobs:2});await lab.run('p1');await lab.run('p1');
  await assert.rejects(lab.run('p1'),/RETENTION_BUDGET_EXPORT_REQUIRED/);
  assert.equal(lab.jobSummaries('p1').length,2);assert.equal('result' in lab.jobSummaries('p1')[0],false);
  lab.dispose();assert.equal(lab.jobs('p1').length,0);await assert.rejects(lab.run('p1'),/LAB_DISPOSED/);
});
test('a completed actual result exceeding the retained-byte budget is not retained as usable evidence',async t=>{
  const original=gaugeExamples().find(x=>x.id==='algebra-G2').request;
  const lab=laboratory(t,{catalog:[{id:'g2',engine:'M1',request:original}],maxJobs:64,maxRetainedResultBytes:32768});
  const first=await lab.run('g2');assert.equal(first.state,'COMPLETED');assert(first.retainedBytes>1024);
  let result=first;for(let i=0;result.state==='COMPLETED'&&i<Math.ceil(32768/first.retainedBytes);i++)result=await lab.run('g2');
  assert.equal(result.state,'BUDGET_EXCEEDED');assert.equal(result.result,null);
  assert.equal(lab.job(first.id).state,'COMPLETED','prior valid result remains retained');
  assert.equal(result.error,'RETENTION_RESULT_BUDGET');await assert.rejects(lab.exportRecord(result.id),/COMPLETED_RESULT_REQUIRED/);
});
test('browser plot helper preserves wrapped Float64 scalars and actual extension-field source paths',async()=>{
  const source=await readFile(new URL('../web/release-lab.js',import.meta.url),'utf8');
  const fragment=source.slice(source.indexOf('  const numeric ='),source.indexOf('  function inspect('));
  const sampleRows=new Function(fragment+';return sampleRows;')();
  const delta=sampleRows({comparison:[{delta:{kind:'FLOAT64',value:'0.5'},physicalDensity:{kind:'FLOAT64',value:7.5e25}}]});
  assert.equal(delta[0].x,.5);assert.equal(delta[0].y,7.5e25);
  const actualEngine=createM1Engine({workerFactory});
  try {
    const real=gaugeExamples().find(x=>x.id==='delta-classical_scale').request;
    const queued=await actualEngine.submit(real),result=await actualEngine.wait(queued.id),actual=sampleRows(result.result);
    assert.equal(actual.length,result.result.comparison.length);assert(actual.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)));
    assert.equal(actual[0].y,result.result.comparison[0].physicalDensity.actionDensity);
    assert.equal(actual[0].path,'comparison[0].physicalDensity.actionDensity');
  } finally {actualEngine.dispose();}
  const points=sampleRows({results:{primeField:{affinePoints:[{x:'1',y:'2'}]},extensionField:{affinePoints:[{x:'4',y:'5'}]}}});
  assert.equal(points[0].x,4);assert.equal(points[0].path,'results.extensionField.affinePoints[0]');
  const opaque=sampleRows({points:[{velocity:[1,2,3]}]});assert.equal(Number.isNaN(opaque[0].x),true,'a list index must not be fabricated as a physical radius');
});
