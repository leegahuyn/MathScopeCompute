import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recordedGlobalMoment,globalMomentObservations} from '../source-global-moment-evidence.mjs';
import {GLOBAL_MOMENT_ARCHIVE} from '../source-global-moment-evidence-data.mjs';
import {runNavierM3,replayNavierM3} from '../index.mjs';

const full=JSON.parse(readFileSync(new URL('../evidence/global-moment-20261012/attempt1/global-moment.json',import.meta.url)));

test('actual all-label moment, potential, pressure and nonlinear expressions remain exact in the declared summary',async()=>{
  const result=await recordedGlobalMoment();
  for(const name of ['source','bumps','potential','velocity','mean','nonlinear','checks','scope','graph'])
    assert.deepEqual(result.summary[name],full[name],name);
  assert.equal(result.fullArtifactEmbedded,false);
  assert.equal(result.sourceSummaryOnly,true);
  assert.equal(result.artifact.sha256,'ca1b911e24df5d1ab4f0d947eecc09e01d0d6db2f841d39658ffc76a6d00df27');
  assert.equal(result.recordedOnly,true);
  assert.equal(result.freshSourceConstructorExecuted,false);
  assert.equal(result.scope.initializedJ0,false);
  assert.equal(result.scope.completeN6,false);
  const observation=globalMomentObservations(result);
  assert.equal(observation.samples.length,0);
  assert.equal(observation.contract.expressionNodeIdsAreNumericValues,false);
  assert.ok(result.checks.every(row=>row.pass));
});

test('only the fixed observed archive is accepted, and immutable archive bytes are rechecked',async()=>{
  await assert.rejects(()=>recordedGlobalMoment({coefficients:[1,2,3]}),{code:'INVALID_INPUT'});
  const before=GLOBAL_MOMENT_ARCHIVE.scope.initializedJ0;
  try{GLOBAL_MOMENT_ARCHIVE.scope.initializedJ0=true;
    await assert.rejects(()=>recordedGlobalMoment(),{code:'SOURCE_ARCHIVE_MISMATCH'});
  }finally{GLOBAL_MOMENT_ARCHIVE.scope.initializedJ0=before;}
  const next=await recordedGlobalMoment();next.summary.checks[0].pass=false;
  assert.equal((await recordedGlobalMoment()).summary.checks[0].pass,true);
});

test('public dispatch and replay preserve source provenance and reject a false final-field claim',async()=>{
  const result=await runNavierM3({package:'N6',operation:'global-moment-record'});
  assert.equal(result.recordedOnly,true);
  assert.equal(result.evidence.numericOrAlgebraicFiniteExecution,false);
  assert.equal((await replayNavierM3(result)).pass,true);
  const changed=structuredClone(result);changed.sourceBoundaries.completeN6=true;
  await assert.rejects(()=>replayNavierM3(changed),{code:'REPLAY_AUTHORITY_MISMATCH'});
});
