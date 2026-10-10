import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {makeM1RetentionPatches,M1_RETAINED_JOB_LIMIT} from '../compat/m1-retention.mjs';
import {createM1Engine as originalEngine} from '../../mathscope-m1/core/engine.mjs';
import {WORKER_SHA256} from '../../mathscope-m1/core/worker-data.mjs';

const originalPath=fileURLToPath(new URL('../../mathscope-m1/core/engine.mjs',import.meta.url));
const source=await readFile(originalPath,'utf8');
const patches=makeM1RetentionPatches(source);
const changed=source.replace('export '+patches[0].find,'export '+patches[0].replace)
  .replace(/from '([^']+)'/g,(_,p)=>'from '+JSON.stringify(pathToFileURL(resolve(dirname(originalPath),p)).href));
const {createM1Engine}=await import('data:text/javascript;base64,'+Buffer.from(changed).toString('base64'));
const request={kind:'arithmetic.primes',input:{a:'2',b:'31'},precision:{},budget:{maxMillis:1000,maxBytes:100000,maxItems:100,maxOperations:100000}};

test('the observed 33rd-run failure is repaired; all earlier results, receipts, and replay survive',async()=>{
  const old=originalEngine({local:true}),engine=createM1Engine({local:true});
  try{
    const reference=await old.wait((await old.submit(request)).id);
    let first,receipt;
    for(let i=0;i<59;i++){
      const j=await engine.wait((await engine.submit(request,{id:'catalog-'+i})).id);
      assert.equal(j.status,'COMPLETED');
      assert.equal(j.mathematicalHash,reference.mathematicalHash);
      if(i===0){first=j;receipt=await engine.receipt(j.id);}
    }
    assert.equal(engine.listJobs().length,59);
    assert.deepEqual(engine.getJob(first.id),first);
    assert.equal(await engine.verifyReceipt(receipt),true);
    const bundle=await engine.exportBundle(first.id);
    assert.equal((await engine.replay(bundle)).status,'MATCH');
    assert.equal(engine.listJobs().length,60);
    assert.deepEqual(await engine.environment(),await old.environment());
    assert.equal((await engine.environment()).workerSha256,WORKER_SHA256);
  }finally{old.dispose();engine.dispose();}
});

test('the larger history remains bounded and concurrent admission cannot exceed its cap',async()=>{
  const engine=createM1Engine({local:true});
  try{
    assert.equal(engine.retainedJobLimit,M1_RETAINED_JOB_LIMIT);
    for(let i=0;i<M1_RETAINED_JOB_LIMIT-1;i++)await engine.wait((await engine.submit(request,{id:'bounded-'+i})).id);
    const raced=await Promise.allSettled([engine.submit(request,{id:'final-a'}),engine.submit(request,{id:'final-b'})]);
    assert.equal(raced.filter(x=>x.status==='fulfilled').length,1);
    assert.equal(engine.listJobs().length,M1_RETAINED_JOB_LIMIT);
    await assert.rejects(engine.submit(request,{id:'over-cap'}),/128/);
    await assert.rejects(engine.submit(request,{id:'bounded-0'}),/Duplicate M1 job ID/);
    for(const r of raced)if(r.status==='fulfilled')await engine.wait(r.value.id);
  }finally{engine.dispose();}
});

test('the patch keeps both guards and is anchored to the original engine only',()=>{
  assert.equal(patches[0].find.startsWith('function createM1Engine'),true);
  assert.equal(patches[0].replace.split('jobs.size>=retainedJobLimit').length-1,2);
  assert.equal(patches[0].replace.includes('workerHash!==WORKER_SHA256'),true);
  assert.throws(()=>makeM1RetentionPatches('function unrelated(){}'),/original/);
});

test('a refused admission leaves no selected phantom job or save preparation',async()=>{
  let selected='previous-owned-job';
  const pending=new Map(),messages=[];
  const engine={submit:async()=>{throw Error('fixture admission refusal');}};
  const status=(message,error)=>messages.push({message,error});
  const renderJobs=()=>assert.equal(selected,'previous-owned-job');
  const fn=new Function('engine','status','renderJobs','pending','state','return async function(){const id="never-admitted",request={},prepared={},s={id:"session"};'+patches[2].replace.replace('selected=id','state.selected=id')+'}');
  const state={selected};
  await assert.rejects(fn(engine,status,renderJobs,pending,state)(),/admission refusal/);
  assert.equal(state.selected,selected);
  assert.equal(pending.size,0);
  assert.equal(messages.length,1);
  assert.equal(messages[0].error,true);
});
