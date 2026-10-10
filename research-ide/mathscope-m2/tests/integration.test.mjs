import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createM2Engine} from '../core/engine.mjs';
import {listExamples,executeDomain,normalizeRequest} from '../core/registry.mjs';
import {makeM2Visualization,listM2Panels} from '../visualization/m2-views.mjs';
import {createM2Tools} from '../webmcp.mjs';
import {sha256} from '../../mathscope-m0/contracts.mjs';
import fs from 'node:fs';

function workerFactory(source){
  const bridge='const {parentPort}=require("node:worker_threads");globalThis.self=globalThis;self.postMessage=x=>parentPort.postMessage(x);parentPort.on("message",data=>self.onmessage({data}));\n';
  const native=new Worker(bridge+source,{eval:true}),proxy={postMessage:x=>native.postMessage(x),terminate:()=>native.terminate(),onmessage:null,onerror:null};native.on('message',data=>proxy.onmessage?.({data}));native.on('error',error=>proxy.onerror?.(error));return proxy;
}
test('every installed bundled worker reproduces the source-module mathematical result',async()=>{
  const local=createM2Engine({local:true}),worker=createM2Engine({workerFactory});
  const records=[];
  try{for(const e of await listExamples()){
    const a=await local.wait((await local.submit(e.request)).id),b=await worker.wait((await worker.submit(e.request)).id);
    assert.ok(['COMPLETED','PARTIAL'].includes(a.status),e.id+': '+a.status);assert.equal(b.status,a.status,e.id);assert.equal(b.mathematicalHash,a.mathematicalHash,e.id+' static-bundle parity');if(e.domain==='ns')assert.equal(b.result.scope.formalPass,false);
    records.push({id:e.id,kind:e.request.kind,status:b.status,inputHash:b.inputHash,mathematicalHash:b.mathematicalHash,staticWorkerParity:true});
  }const environment=await worker.environment();fs.writeFileSync(new URL('../evidence/static-worker-parity.json',import.meta.url),JSON.stringify({schema:'MathScope.StaticWorkerParity/1',workerSha256:environment.workerSha256,count:records.length,records},null,2));}finally{local.dispose();worker.dispose();}
});
test('every arithmetic, NS and observation panel retains exact source data and finite display coordinates',async()=>{
  for(const e of (await listExamples()).filter(e=>e.domain!=='gauge')){
    const result=await executeDomain(e.request),job={id:e.id,request:e.request,inputHash:await sha256(e.request),resultHash:await sha256(result),status:result.status,result};
    for(const p of listM2Panels(job)){const v=makeM2Visualization(job,{panel:p.id});const frame=result.pairs?.find(x=>x.id===p.id);assert.equal(v.state,frame?.state||'READY',e.id+' / '+p.id);if(frame?.state)assert.equal(v.scene.points.length,0);assert.equal(v.binding.inputHash,job.inputHash);assert.ok(v.table.rows.length>0,e.id+' exact table');assert.ok(v.scene.points.every(p=>p.pos.every(Number.isFinite)),e.id+' finite canvas');assert.equal(v.binding.formalPass,false);}
    const stale=makeM2Visualization(job,{currentEditorMatches:false});assert.equal(stale.state,'INPUT_CHANGED');assert.equal(stale.scene.points.length,0);
  }
});
test('M2 WebMCP rejects oversized, unknown and aborted mutations before dispatch',async()=>{
  let calls=0;const tools=createM2Tools({runRequest(){calls++;return {ok:true};},runExample(){calls++;return {ok:true};},runExampleSuite(){calls++;return {ok:true};},getStatus:()=>({ok:true})});
  const run=tools.find(t=>t.name.endsWith('.run_request')),example=tools.find(t=>t.name.endsWith('.run_example')),suite=tools.find(t=>t.name.endsWith('.run_example_suite'));
  assert.equal((await run.execute({request:{},extra:true})).ok,false);assert.equal((await example.execute({exampleId:5})).ok,false);assert.equal((await run.execute({request:{s:'x'.repeat(300001)}})).ok,false);assert.equal((await run.execute({request:{}},{signal:{aborted:true}})).code,'CANCELLED');assert.equal(calls,0);
  for(const exampleIds of [[],['a','a'],Array.from({length:13},(_,i)=>String(i)),[5],['']])assert.equal((await suite.execute({exampleIds})).ok,false);
  assert.equal((await suite.execute({exampleIds:['valid']},{signal:{aborted:true}})).code,'CANCELLED');assert.equal(calls,0);
  assert.equal((await tools.find(t=>t.name.endsWith('.status')).execute()).ok,true);
});
test('M2 request envelope rejects invalid resource scopes and precision container types',()=>{
  assert.throws(()=>normalizeRequest({kind:'ns.pulse-tail',input:{},budget:{maxMillis:60001}}));assert.throws(()=>normalizeRequest({kind:'ns.pulse-tail',input:{},precision:[]}));assert.throws(()=>normalizeRequest({kind:'arithmetic.witt',input:{},formalComplete:true}));
});
