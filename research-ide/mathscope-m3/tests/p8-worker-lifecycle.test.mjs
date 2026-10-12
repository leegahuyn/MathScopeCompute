import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const template=await fs.readFile(new URL('../p8/browser-client.js',import.meta.url),'utf8');
function fixture(){
  const state={created:0,revoked:0,terminated:0,workers:[],failCreation:false,failClone:false,timers:new Map(),timerId:0};
  class StubWorker{constructor(){if(state.failCreation)throw Error('creation rejected');state.workers.push(this);}postMessage(value){if(state.failClone)throw Error('DataCloneError');this.message=value;}terminate(){state.terminated++;}}
  const context={window:{addEventListener(){}},Worker:StubWorker,Blob:class{},URL:{createObjectURL(){state.created++;return 'blob:unit-'+state.created;},revokeObjectURL(){state.revoked++;}},setTimeout(fn,ms){const id=++state.timerId;state.timers.set(id,{fn,ms});return id;},clearTimeout(id){state.timers.delete(id);}};
  vm.runInNewContext(template.replace('__P8_STATIC_WORKER_SOURCE__','"/* static unit source */"'),context);
  return {state,api:context.window.MathScopeP8Engine};
}
test('worker creation failure revokes URL and allows a clean retry',async()=>{
  const {state,api}=fixture();state.failCreation=true;await assert.rejects(api.capabilities(),/creation rejected/);assert.equal(state.created,state.revoked);state.failCreation=false;const pending=api.capabilities(),worker=state.workers.at(-1);worker.onmessage({data:{id:worker.message.id,result:{ready:true}}});assert.deepEqual(await pending,{ready:true});api.cancel();assert.equal(state.created,state.revoked);
});
test('uncloneable request rejects and releases the worker, timer and busy guard',async()=>{
  const {state,api}=fixture();state.failClone=true;await assert.rejects(api.run({fn(){}}),/DataCloneError/);assert.equal(state.timers.size,0);assert.equal(state.created,state.revoked);assert.equal(state.terminated,1);state.failClone=false;const pending=api.capabilities(),worker=state.workers.at(-1);worker.onmessage({data:{id:worker.message.id,result:'ready'}});assert.equal(await pending,'ready');api.cancel();
});
test('90 second limit terminates an unresolved calculation; no result is issued',async()=>{
  const {state,api}=fixture(),pending=api.run({kind:'bounded'});const rejected=assert.rejects(pending,/90/);const timer=[...state.timers.values()][0];assert.equal(timer.ms,90000);timer.fn();await rejected;assert.equal(state.terminated,1);assert.equal(state.created,state.revoked);assert.equal(state.timers.size,0);
});
