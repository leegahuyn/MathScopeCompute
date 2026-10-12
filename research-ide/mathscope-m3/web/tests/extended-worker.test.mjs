import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {Worker as NodeWorker} from 'node:worker_threads';
import {webcrypto} from 'node:crypto';
import {canonicalExtended,digestExtended,executeExtended,inspectExtendedRecord} from '../extended-worker.mjs';
const build=JSON.parse(fs.readFileSync(new URL('../extended-build-data.json',import.meta.url),'utf8'));
const request={kind:'navier',input:{package:'N8',operation:'galerkin',parameters:{cutoff:2,endTime:.02}}};
function browserClient(){
 const blobs=new Map();let seq=0;
 class Blob{constructor(parts){this.source=parts.join('');}}
 class Worker{constructor(url){const source=blobs.get(url),bridge="const {parentPort}=require('node:worker_threads');globalThis.crypto=require('node:crypto').webcrypto;globalThis.self=globalThis;self.postMessage=x=>parentPort.postMessage(x);parentPort.on('message',x=>self.onmessage({data:x}));\n";this.worker=new NodeWorker(bridge+source,{eval:true});this.worker.on('message',data=>this.onmessage?.({data}));this.worker.on('error',error=>this.onerror?.({message:error.message}));}postMessage(x){this.worker.postMessage(x);}terminate(){this.worker.terminate();}}
 const context={window:{},Blob,Worker,TextDecoder,atob,URL:{createObjectURL(blob){const id='testblob:'+(++seq);blobs.set(id,blob.source);return id;},revokeObjectURL(id){blobs.delete(id);}},crypto:webcrypto,setTimeout,clearTimeout};
 vm.runInNewContext(fs.readFileSync(new URL('../extended-engine.bundle.js',import.meta.url),'utf8'),context);
 return context.window.MathScopeM3ExtendedEngine;
}
test('non-finite and undefined evidence cannot silently serialize into a seal',()=>{for(const value of [NaN,Infinity,-Infinity,undefined,{a:NaN},{a:undefined}])assert.throws(()=>canonicalExtended(value));});
test('current source and environment allow actual replay inspection',async()=>{const result=await executeExtended(request,build);const inspection=await inspectExtendedRecord(result,build);assert.equal(inspection.replayAllowed,true);assert.equal(inspection.importedAuthorityAdopted,false);});
test('modified mathematical values, authority and source bindings cannot be adopted',async()=>{const result=await executeExtended(request,build);for(const key of ['formalProofIssued','wholeM3Complete'])await assert.rejects(inspectExtendedRecord({...result,[key]:true},build));await assert.rejects(inspectExtendedRecord({...result,result:{...result.result,status:'FORMAL_COMPLETE'}},build),/digest/);const source=structuredClone(result);source.sourceBinding.manifestSHA256='0'.repeat(64);const x=await inspectExtendedRecord(source,build);assert.equal(x.replayAllowed,false);});
test('built static browser Worker actually executes all three package families and compares replay',async()=>{const client=browserClient();for(const r of [request,{kind:'gauge',input:{kind:'finite-transfer'}},{kind:'navier',input:{package:'N6',operation:'source-mean-map'}}]){const first=await client.run(r);assert.equal(first.ok,true);assert.equal(first.record.request.kind,r.kind);const again=await client.replay(first.record);assert.equal(again.replay.status,'MATCH');assert.equal(again.replay.recomputed,true);}assert.equal(client.busy(),false);});
test('shipped Worker executes and freshly replays the resumed source proofs through the audited module closure',async()=>{
 const client=browserClient();
 assert.equal(build.sourceBinding.auditedDeferredAssertionImports.length,2);
 for(const [pkg,operation] of [['N6','global-forced-current-record'],['N6','global-temporal-inverse-record'],['N7','source-localization-operator'],['N7','source-periodization-review'],['N7','source-core-restriction-record']]){
  const first=await client.run({kind:'navier',input:{package:pkg,operation,parameters:{}}});
  assert.equal(first.ok,true,operation);assert.equal(first.record.wholeM3Complete,false);
  if(operation==='global-forced-current-record'){const r=first.record.result;assert.equal(r.observations.harmonicRows.length,10);assert.equal(r.observations.inverseRows.length,20);assert.equal(r.results.gate.actualCoefficientComparisons,540);assert.equal(r.results.originalConstructionGate.pass,false);assert.equal(r.observations.pressure.totalGlobalPressureExpression,null);}
  const again=await client.replay(JSON.parse(JSON.stringify(first.record)));
  assert.equal(again.replay.status,'MATCH',operation);assert.equal(again.replay.recomputed,true,operation);
 }
 assert.equal(client.busy(),false);
});
test('a forged self-consistent result digest still fails fresh recomputation',async()=>{const client=browserClient(),first=await client.run(request),forged=structuredClone(first.record);forged.result.results.energy=987654321;forged.resultDigest=await digestExtended(forged.result);const x=await client.replay(forged);assert.equal(x.replay.status,'MISMATCH');assert.equal(x.replay.recomputed,true);});
test('a selected field point is recomputed from the same original source',async()=>{const client=browserClient(),first=await client.run({kind:'gauge',input:{kind:'field-family',deltas:[1,2],sampleCount:3,extent:1}});const x=await client.select(first.record,1,13);assert.equal(x.recomputed,true);assert.equal(x.resultDigest,first.record.resultDigest);assert.deepEqual(x.selection.coordinate,[0,0,0,0]);assert.ok(x.selection.original);assert.equal(x.selection.sourceHash,first.record.result.states[1].sourceHash);});
test('cancelling terminates the actual Worker and leaves no adopted result',async()=>{const client=browserClient(),pending=client.run({kind:'gauge',input:{kind:'field-family',deltas:[1,2,3,4],sampleCount:9,extent:2}});assert.equal(client.busy(),true);assert.equal(client.cancel(),true);await assert.rejects(pending,/중단/);assert.equal(client.busy(),false);});
test('display contract binds actual plane, vector multiplier and view independently of the mathematical result',async()=>{
 const {deriveExtendedViewContract}=await import('../extended-view-contract.mjs');const record=await executeExtended(request,build),view={camera:{yaw:-.56,pitch:.44,zoom:1},lod:250,state:'all',selected:'0:0'},displayContract=deriveExtendedViewContract(record,view),payload={view,displayContract};
 assert.deepEqual(displayContract.displayedSourceBounds[2],[0,0]);assert.deepEqual(displayContract.fullDeclaredSourceDomain[2],[0,2*Math.PI]);assert.equal(displayContract.vectorMultiplier,.3);assert.equal(displayContract.vectorNormalization,'NONE');
 record.presentation={schema:'MathScope.M3.ExtendedPresentation/1',payload,digest:await digestExtended(payload)};assert.equal((await inspectExtendedRecord(record,build)).presentationVerified,true);
 const forged=structuredClone(record);forged.presentation.payload.displayContract.vectorMultiplier=1;forged.presentation.digest=await digestExtended(forged.presentation.payload);await assert.rejects(inspectExtendedRecord(forged,build),/Displayed bounds/);
});
test('view identifiers cannot refer to invented source points',async()=>{const {deriveExtendedViewContract}=await import('../extended-view-contract.mjs'),record=await executeExtended(request,build);assert.throws(()=>deriveExtendedViewContract(record,{camera:{yaw:0,pitch:0,zoom:1},lod:250,state:'all',selected:'0:999'}),/absent/);});
test('built Worker resolves lattice and flowed observations back to actual saved links',async()=>{
 const client=browserClient();
 for(const input of [{kind:'lattice-observation',observation:'SLICE',timeIndex:1},{kind:'wilson-flow',flowTime:.002,steps:4}]){
  const first=await client.run({kind:'gauge',input}),stateIndex=input.kind==='wilson-flow'?1:0;
  const selected=await client.select(first.record,stateIndex,0);
  assert.equal(selected.recomputed,true);assert.equal(selected.resultDigest,first.record.resultDigest);
  assert.equal(selected.selection.sourceHash,first.record.result.states[stateIndex].sourceHash);
  assert.equal(selected.selection.members.length,1);assert.equal(selected.selection.members[0].F.length,6);
  assert.equal(selected.selection.members[0].positiveLinks.length,4);
  assert.ok(selected.selection.members[0].positiveLinks.every(link=>link.matrix));
  if(input.kind==='wilson-flow'){
   assert.equal(first.record.result.flow.sourceOverwritten,false);
   assert.notEqual(first.record.result.flow.originalSourceHash,first.record.result.flow.flowedSourceHash);
   assert.ok(first.record.result.flow.flowedAction<first.record.result.flow.originalAction);
  }
 }
});
