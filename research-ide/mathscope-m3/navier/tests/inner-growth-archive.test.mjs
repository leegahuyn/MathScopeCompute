import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {Worker as NodeWorker} from 'node:worker_threads';
import {webcrypto} from 'node:crypto';
import {recordedInnerGrowth,innerGrowthObservations} from '../source-inner-growth-evidence.mjs';
import {INNER_GROWTH_ARCHIVE,INNER_GROWTH_ARCHIVE_SHA256} from '../source-inner-growth-evidence-data.mjs';
import {runNavierM3,replayNavierM3,NAVIER_M3_EXAMPLES} from '../index.mjs';

const actual=JSON.parse(readFileSync(new URL('../evidence/inner-growth-20261012/attempt2/inner-growth.json',import.meta.url))),
  input={package:'N7',operation:'inner-growth-record'};

test('the consumer retains the full actual source DAG and all exact enclosures without a new constructor',async()=>{
  const result=await recordedInnerGrowth();
  assert.equal(result.archiveSHA256,INNER_GROWTH_ARCHIVE_SHA256);
  assert.deepEqual(result.certificate,actual);
  assert.equal(result.certificate.formulaProgram.nodes.length,28966);
  assert.equal(result.gate.nodeTests.passed,8);assert.equal(result.gate.independentFractionChecks,9);
  assert.equal(result.recordedOnly,true);assert.equal(result.freshSourceConstructorExecuted,false);
  assert.equal(result.completeN6,false);assert.equal(result.completeN7,false);assert.equal(result.newLeanProofIssued,false);
  assert.deepEqual(result.historicalExecutionAssessment,INNER_GROWTH_ARCHIVE.historicalExecutionAssessment);
  result.certificate.rows[0].interval.lower='99';
  assert.deepEqual((await recordedInnerGrowth()).certificate,actual,'a returned copy cannot mutate the archive');
});

test('caller certificates, depth substitutions and forged runtime archive bytes are rejected',async()=>{
  for(const value of [null,[],{depths:[0]},{tau:0},{certificate:actual}])
    await assert.rejects(recordedInnerGrowth(value),{code:'INVALID_INPUT'});
  const before=INNER_GROWTH_ARCHIVE.certificate.rows[0].interval.lower;
  try{INNER_GROWTH_ARCHIVE.certificate.rows[0].interval.lower='0';await assert.rejects(recordedInnerGrowth(),{code:'SOURCE_ARCHIVE_MISMATCH'});}
  finally{INNER_GROWTH_ARCHIVE.certificate.rows[0].interval.lower=before;}
});

test('source formula IDs never become finite spatial, time, or velocity samples',async()=>{
  const result=await recordedInnerGrowth(),observations=innerGrowthObservations(result);
  assert.deepEqual(observations.samples,[]);assert.deepEqual(observations.curves,[]);
  assert.equal(observations.contract.physicalTimeRepresentation,'EXACT_SCALAR_FORMULA_DAG_ONLY');
  assert.equal(observations.contract.spatialSamplesGenerated,false);
  for(const row of result.certificate.rows){assert.equal(row.physicalVelocity.binary64,null);assert.equal(row.finiteSumMidpointUsed,false);assert.equal(row.externalSourceTheoremBridgeRequired,true);}
  const claim=observations.claims[0];assert.equal(claim.reference.blueprint.page,64);
  assert.equal(claim.externalFinalFieldIdentification.dependencies.length,2);assert.equal(claim.leanTheorem,null);assert.equal(claim.completeN6,false);
});

test('the actual example executes and replays its immutable archive while retaining whole-field limits',async()=>{
  assert.equal(NAVIER_M3_EXAMPLES.filter(e=>e.input.operation===input.operation).length,1);
  const result=await runNavierM3(input),replay=await replayNavierM3(result);
  assert.equal(replay.pass,true);assert.deepEqual(replay.result,result);
  assert.deepEqual(result.results.certificate,actual);assert.equal(result.sourceBoundaries.completeN6,false);
  assert.equal(result.evidence.numericOrAlgebraicFiniteExecution,false);assert.equal(result.evidence.recordedSourceGatePassed,true);
  assert.equal(result.evidence.freshSourceConstructorExecuted,false);assert.equal(result.evidence.formalComplete,false);
  assert.equal(result.observations.claims[0].runHash,result.runHash);
  assert.equal(result.observations.claims[0].inputHash,result.inputHash);
  const changed=structuredClone(result);changed.results.certificate.rows[0].interval.lower='1/2';
  await assert.rejects(replayNavierM3(changed),{code:'REPLAY_HASH_MISMATCH'});
  const authority=structuredClone(result);authority.observations.claims[0].completeN6=true;
  await assert.rejects(replayNavierM3(authority),{code:'REPLAY_AUTHORITY_MISMATCH'});
});

test('the built browser Worker transports the full formula archive and freshly revalidates replay',async()=>{
  const blobs=new Map();let serial=0;
  class Blob{constructor(parts){this.source=parts.join('');}}
  class Worker{
    constructor(url){const bridge="const {parentPort}=require('node:worker_threads');globalThis.crypto=require('node:crypto').webcrypto;globalThis.self=globalThis;self.postMessage=x=>parentPort.postMessage(x);parentPort.on('message',x=>self.onmessage({data:x}));\n";
      this.worker=new NodeWorker(bridge+blobs.get(url),{eval:true});this.worker.on('message',data=>this.onmessage?.({data}));this.worker.on('error',error=>this.onerror?.({message:error.message}));}
    postMessage(value){this.worker.postMessage(value);}
    terminate(){this.worker.terminate();}
  }
  const context={window:{},Blob,Worker,TextDecoder,atob,crypto:webcrypto,setTimeout,clearTimeout,
    URL:{createObjectURL(blob){const id='inner-growth-test:'+(++serial);blobs.set(id,blob.source);return id;},revokeObjectURL(id){blobs.delete(id);}}};
  vm.runInNewContext(readFileSync(new URL('../../web/extended-engine.bundle.js',import.meta.url),'utf8'),context);
  const client=context.window.MathScopeM3ExtendedEngine,first=await client.run({kind:'navier',input});
  assert.equal(first.ok,true);assert.deepEqual(first.record.result.results.certificate,actual);
  assert.equal(first.record.result.freshSourceConstructorExecuted,false);
  assert.deepEqual(first.record.result.observations.samples,[]);
  assert.equal(first.record.formalProofIssued,false);
  const inspection=await client.inspect(first.record);assert.equal(inspection.result.replayAllowed,true);
  const replay=await client.replay(first.record);assert.equal(replay.replay.status,'MATCH');
  assert.deepEqual(replay.record.result.results.certificate.formulaProgram,actual.formulaProgram);
  assert.equal(client.busy(),false);
});
