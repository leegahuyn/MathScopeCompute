import test from 'node:test';import assert from 'node:assert/strict';
import {createProofSession} from './proof-session.mjs';
import {createM4ProofJob,DEFAULT_M4_PROOF_INPUT} from './research-ide/mathscope-m4/proof-jobs.mjs';

test('real generator: all eight independent changes produce new proof jobs, reject old PASS',async()=>{
 const s=createProofSession();await s.update();const original=s.snapshot().active;
 const changes=[{G:'SU2'},{delta:'D2'},{p:3},{precision:32},{coefficientFormula:'[3,-3,5,7]'},{coefficientField:'Fp'},{coefficients:['3','-3','5','7']},{assumptions:[{id:'H',statement:'True'}]}];
 for(const patch of changes){
   const before=s.snapshot().active.jobId;const p=s.update(patch);
   assert.equal(s.snapshot().active,null);assert.equal(s.snapshot().state,'GENERATING');
   const result=await p;assert.equal(result.state,'KERNEL_PENDING');assert.notEqual(result.jobId,before);
   assert.deepEqual(await s.inspectOldReceipt({...original,status:'PASS',kernelPass:true}),{state:'STALE_SOURCE_OR_PARAMETERS',kernelPass:false});
 }
});

test('in-flight earlier generation cannot overwrite newest source job',async()=>{
 let release;const gate=new Promise(r=>release=r);
 const make=async p=>{if(p.G==='SLOW')await gate;return createM4ProofJob(p);};
 const s=createProofSession({make});await s.update();
 const slow=s.update({G:'SLOW'});const fast=await s.update({G:'FAST'});release();
 assert.equal((await slow).state,'SUPERSEDED');assert.equal(s.snapshot().active.jobId,fast.jobId);assert.equal(s.snapshot().params.G,'FAST');
});

test('invalid input clears previously active proof and fails closed',async()=>{
 const s=createProofSession();await s.update();await assert.rejects(()=>s.update({p:1}));
 assert.equal(s.snapshot().state,'GENERATION_ERROR');assert.equal(s.snapshot().active,null);
 assert.deepEqual(await s.inspectOldReceipt({status:'PASS',kernelPass:true}),{state:'NO_ACTIVE_JOB',kernelPass:false});
});

test('same binding and forged pass never produce a verified current result',async()=>{
 const s=createProofSession({initial:DEFAULT_M4_PROOF_INPUT});await s.update();const job=s.snapshot().active;
 assert.deepEqual(await s.inspectOldReceipt({...job,status:'PASS',kernelPass:true}),{state:'BINDING_MATCH_KERNEL_RECHECK_REQUIRED',kernelPass:false});
});
