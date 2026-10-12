import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceLocalizationOperatorEvidence,sourceLocalizationOperatorEvidenceObservations} from '../source-localization-operator-evidence.mjs';
import {runNavierM3,replayNavierM3} from '../index.mjs';

test('fresh complete operator proof matches the observed source gate and retains nonzero force divergence',async()=>{
  const r=await sourceLocalizationOperatorEvidence(),o=sourceLocalizationOperatorEvidenceObservations(r);
  assert.equal(r.proofSHA256,'33f32d13dcd8e6c2d9122e936fa007f83da319ad122f72a9990e6dad9bc2370e');
  assert.equal(r.gate.nodeTests.passed,10);assert.equal(r.gate.independentCheckCount,55);
  assert.equal(r.checks.length,26);assert.ok(r.checks.every(x=>x.pass));
  assert.equal(o.commutators.length,10);assert.equal(o.negativeControls.length,14);
  assert.ok(o.negativeControls.every(x=>x.nonzero));assert.equal(o.samples.length,0);
  assert.equal(r.freshExactOperatorProofExecuted,true);assert.equal(r.freshFullSourceConstructorExecuted,false);
  assert.equal(r.scope.forceDivergenceNeedNotVanish,true);assert.equal(r.scope.forceWasLerayProjected,false);
  assert.equal(r.scope.wholeLocalizedForceValuesComputed,false);assert.equal(r.scope.wholeM3Complete,false);
});

test('caller replacement of source fields and modified operator proof are rejected',async()=>{
  await assert.rejects(sourceLocalizationOperatorEvidence({pressure:0}),{code:'INVALID_INPUT'});
  const r=await sourceLocalizationOperatorEvidence();r.proof.proofScope.forceDivergenceNeedNotVanish=false;
  assert.throws(()=>sourceLocalizationOperatorEvidenceObservations(r),{code:'INVALID_SOURCE_ARCHIVE'});
});

test('public operator execution replays and rejects an enlarged source authority',async()=>{
  const r=await runNavierM3({package:'N7',operation:'source-localization-operator'}),replay=await replayNavierM3(r);
  assert.equal(replay.pass,true);assert.equal(r.evidence.analyticCertificate.kind,'ORIGINAL_LOCALIZATION_OPERATOR_IDENTITIES');
  assert.equal(r.evidence.analyticCertificate.newLeanKernelProof,false);
  const changed=structuredClone(r);changed.freshSourceConstructorExecuted=true;
  await assert.rejects(replayNavierM3(changed),{code:'REPLAY_AUTHORITY_MISMATCH'});
});
