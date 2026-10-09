import test from 'node:test';
import assert from 'node:assert/strict';
import { createM0ToolDefinitions, registerM0Tools } from '../webmcp.mjs';

function setup(){
  const calls=[];return{calls,api:{getStatus:()=>({session:'s',count:0}),validateContract:(kind,value)=>({ok:true,kind,value}),runFixture:(id)=>{calls.push(id);return{id:'job-1'}},getJobStatus:id=>({id}),cancelJob:id=>{calls.push(id);return{status:'CANCEL_REQUESTED'}},runChecks:()=>({pass:true}),checkSelectedProof:()=>({status:'LOCAL_AUDIT_VERIFIED'})}};
}
function registry(){
  const map=new Map();const host={modelContext:{async registerTool(t,{signal}){if(map.has(t.name))throw Error('Duplicate');map.set(t.name,t);signal.addEventListener('abort',()=>map.delete(t.name),{once:true})}}};return{host,map};
}
test('bounded tools validate arguments before all effects; source status is not proof issuance',async()=>{
  const {api,calls}=setup(),defs=createM0ToolDefinitions(api),run=defs.find(x=>x.name.endsWith('run_fixture'));
  assert.equal((await run.execute({adapter:'arbitrary-shell'})).ok,false);
  assert.equal((await run.execute({adapter:'prime-segment',confirmed:true})).ok,false);
  assert.equal((await run.execute({adapter:'prime-segment'},{signal:AbortSignal.abort()})).code,'CANCELLED');
  assert.equal(calls.length,0);
  assert.equal((await run.execute({adapter:'prime-segment'})).id,'job-1');
  assert.deepEqual(calls,['prime-segment']);
  assert.equal(defs.length,7);
});
test('registration-only native surface works; repeated setup and cleanup affect owned registrations only',async()=>{
  const {api}=setup(),{host,map}=registry();map.set('unrelated',{});
  const first=await registerM0Tools(api,host);assert.equal(first.registered,true);assert.equal(map.size,8);
  const second=await registerM0Tools(api,host);assert.equal(second.registered,true);assert.equal(map.size,8);
  first.dispose();assert.equal(map.size,8);
  second.dispose();assert.deepEqual([...map.keys()],['unrelated']);
});
test('failed registration releases only this setup; no polyfill or broad origin exposure',async()=>{
  const {api}=setup(),{host,map}=registry(),original=host.modelContext.registerTool;
  host.modelContext.registerTool=async function(t,o){if(t.name.endsWith('run_fixture'))throw Error('Policy rejected');return original(t,o)};
  const r=await registerM0Tools(api,host);assert.equal(r.reason,'REGISTRATION_REJECTED');assert.equal(map.size,0);
  const absent={};assert.equal((await registerM0Tools(api,absent)).reason,'NATIVE_REGISTRATION_UNAVAILABLE');assert.equal(absent.modelContext,undefined);
});
test('dispose during asynchronous registration cannot leave late owned tools',async()=>{
  const {api}=setup();let release;const host={modelContext:{registerTool:async(_t,{signal})=>{await new Promise(r=>release=r);if(signal.aborted)throw Error('Aborted')}}};
  const pending=registerM0Tools(api,host);const replacement=registerM0Tools(api,{});await replacement;
  // Register a second setup on the same host: it aborts the pending first one.
  host.modelContext.registerTool=async()=>{};
  const newer=await registerM0Tools(api,host);release();
  assert.equal((await pending).registered,false);newer.dispose();
});
