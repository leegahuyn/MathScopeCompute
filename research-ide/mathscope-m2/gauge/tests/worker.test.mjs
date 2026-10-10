import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker as NodeWorker} from 'node:worker_threads';
import fs from 'node:fs/promises';
import {getExamples} from '../index.mjs';
import {createM2Engine} from '../../core/engine.mjs';
import {WORKER_SOURCE,WORKER_SHA256} from '../../core/worker-data.mjs';
import {sha256} from '../../../mathscope-m0/contracts.mjs';
import {makeM2Visualization} from '../../visualization/m2-views.mjs';

// Only the message transport is adapted. Every mathematical operation executes
// from the same bundled worker bytes that are shipped to the browser.
function nativeWorkerFactory(source){
  const bridge="const {parentPort}=require('node:worker_threads');globalThis.self=globalThis;globalThis.postMessage=data=>parentPort.postMessage(data);parentPort.on('message',data=>globalThis.onmessage({data}));\n";
  const worker=new NodeWorker(bridge+source,{eval:true}),adapter={onmessage:null,onerror:null,postMessage:value=>worker.postMessage(value),terminate:()=>worker.terminate()};
  worker.on('message',data=>adapter.onmessage?.({data}));worker.on('error',e=>adapter.onerror?.({message:e.message}));return adapter;
}
function ownedEngine(t,options){const engine=createM2Engine(options);t.after(()=>engine.dispose());return engine;}
async function run(engine,request){const queued=await engine.submit(request);return engine.wait(queued.id);}

test('all eight gauge examples have identical mathematical results in actual isolated bundled Workers and local modules',async t=>{
  assert.ok(WORKER_SOURCE.length>10000);assert.equal(await sha256(WORKER_SOURCE),WORKER_SHA256);
  const local=ownedEngine(t,{local:true}),worker=ownedEngine(t,{workerFactory:nativeWorkerFactory}),examples=[];
  for(const e of getExamples()){
    const a=await run(local,e.request),b=await run(worker,e.request);
    assert.ok(['COMPLETED','PARTIAL'].includes(a.status),e.id+' local must compute');
    assert.equal(b.status,a.status,e.id+' state');assert.equal(b.inputHash,a.inputHash,e.id+' input');
    assert.equal(b.mathematicalHash,a.mathematicalHash,e.id+' bundled mathematical result');
    for(const key of ['modelHash','sourceHash','sampleHash','ensembleHash','historyHash'])assert.equal(b.result[key],a.result[key],e.id+' '+key);
    assert.equal(b.result.visualization.observationHash,a.result.visualization.observationHash,e.id+' observation');
    const view=makeM2Visualization(b,{maxPoints:41,maxRows:17});assert.equal(view.state,'READY');assert.ok(view.table.rows.length);
    assert.ok(view.scene.points.length||view.scene.lines.length,e.id+' actual finite marks');
    examples.push({id:e.id,kind:b.request.kind,status:b.status,inputHash:b.inputHash,mathematicalHash:b.mathematicalHash,modelHash:b.result.modelHash,sourceHash:b.result.sourceHash,sampleHash:b.result.sampleHash,ensembleHash:b.result.ensembleHash??null,historyHash:b.result.historyHash??null,observationHash:b.result.visualization.observationHash,rawObservationPoints:b.result.visualization.points.length,viewKind:view.kind,coordinateTypes:view.axisMetadata.map(a=>a.type),localWorkerParity:true});
  }
  await fs.writeFile(new URL('../evidence/worker-validation.json',import.meta.url),JSON.stringify({schema:'MathScope.M2.GaugeWorkerValidation/1',generatedAt:new Date().toISOString(),workerSHA256:WORKER_SHA256,execution:'ISOLATED_NODE_WORKER_THREADS_FROM_BROWSER_WORKER_BYTES',comparison:'FULL_MATHEMATICAL_RESULT_EXCLUDING_TOP_LEVEL_EXECUTION_METRICS_ONLY',examples},null,2)+'\n');
});

test('the bundled gauge sampler stops at an actual computation checkpoint and emits no completed geometry',async t=>{
  const engine=ownedEngine(t,{workerFactory:nativeWorkerFactory}),request=getExamples().find(e=>e.id==='m2-su2-wilson-ensemble').request;
  let sawCheckpoint=false;
  const unsubscribe=engine.subscribe(j=>{if(j.status==='RUNNING'&&j.checkpoint?.phase==='wilson-ensemble'&&!sawCheckpoint){sawCheckpoint=true;assert.equal(engine.cancel(j.id),true);}});t.after(unsubscribe);
  const j=await run(engine,request);
  assert.equal(sawCheckpoint,true);assert.equal(j.status,'CANCELLED');assert.equal(j.result.measurements,undefined);
  assert.equal(makeM2Visualization(j).state,'CANCELLED');assert.equal(makeM2Visualization(j).scene.points.length,0);
});

test('actual Worker preserves gauge resource and unsupported-sampler rejections before publishing a source',async t=>{
  const engine=ownedEngine(t,{workerFactory:nativeWorkerFactory}),e=getExamples().find(e=>e.id==='m2-su2-wilson-ensemble');
  const tiny=structuredClone(e.request);tiny.budget.maxOperations=1;
  const budget=await run(engine,tiny);assert.equal(budget.status,'BUDGET_EXCEEDED');assert.equal(budget.result.sourceHash,undefined);
  const unknown=structuredClone(e.request);unknown.input.sampler.algorithm='UNIMPLEMENTED_HEATBATH';
  const rejected=await run(engine,unknown);assert.equal(rejected.status,'UNSUPPORTED');assert.equal(rejected.result.sourceHash,undefined);
  assert.equal(makeM2Visualization(rejected).scene.points.length,0);
});
