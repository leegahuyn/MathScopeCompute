import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NAVIER_M3_EXAMPLES,runNavierM3,replayNavierM3} from '../index.mjs';

const root=new URL('../../../../',import.meta.url);
const sha=raw=>createHash('sha256').update(raw).digest('hex');
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';

test('recorded source view binds the actual executed log/artifact bytes without claiming a new constructor',async()=>{
  const example=NAVIER_M3_EXAMPLES.find(e=>e.id==='N6-source-reconstruction');assert.ok(example);
  const record=await runNavierM3(example.input),r=record.results,raw=await readFile(new URL(r.receipt.path,root)),gate=JSON.parse(raw);
  assert.equal(sha(raw),r.receipt.sha256);
  assert.equal(r.recordedOnly,true);
  assert.equal(r.freshSourceConstructorExecuted,false);
  assert.equal(record.evidence.numericOrAlgebraicFiniteExecution,false);
  assert.equal(record.evidence.recordedOnly,true);
  assert.equal(record.evidence.freshSourceConstructorExecuted,false);
  assert.equal(gate.actualSourceConstructorExecuted,true);
  assert.equal(r.gate.exitCode,0);
  assert.equal(r.gate.passCount,r.gate.testCount);
  assert.equal(r.gate.failCount,0);
  assert.equal(sha(await readFile(new URL(r.gate.log.path,root))),r.gate.log.sha256);
  assert.equal(r.completeN6,false);
  assert.equal(r.analyticCertificate,null);
  assert.equal(r.leanTheorem,null);
  for(const row of r.artifacts){
    const bytes=await readFile(new URL(row.path,root)),data=JSON.parse(bytes);
    assert.equal(sha(bytes),row.sha256);
    assert.deepEqual(data.graph,row.graph);
    assert.equal(data.scope.completeN6,false);
  }
  assert.equal((await replayNavierM3(record)).pass,true);
});

test('resealed constructor/proof promotion cannot change the fixed recorded-source operation',async()=>{
  const record=await runNavierM3({package:'N6',operation:'source-reconstruction'}),forged=structuredClone(record);
  forged.results.freshSourceConstructorExecuted=true;
  forged.results.completeN6=true;
  forged.runHash=sha(canonical({input:forged.input,results:forged.results}));
  await assert.rejects(replayNavierM3(forged),{code:'REPLAY_RESULT_MISMATCH'});
  const fresh=await runNavierM3(record.input);
  assert.equal(fresh.runHash,record.runHash);
  assert.equal(fresh.results.freshSourceConstructorExecuted,false);
});

test('a source-summary parameter cannot silently choose a new source or a zero source parameter',async()=>{
  for(const parameters of [{lambda:0},{freshSourceConstructorExecuted:true},{throughOrder:10}])
    await assert.rejects(runNavierM3({package:'N6',operation:'source-reconstruction',parameters}),{code:'INVALID_INPUT'});
});
