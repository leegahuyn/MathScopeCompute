import test from 'node:test';
import assert from 'node:assert/strict';
import {sourcePeriodizationReviewEvidence,sourcePeriodizationReviewEvidenceObservations} from '../source-periodization-review-evidence.mjs';
import {runNavierM3,replayNavierM3} from '../index.mjs';
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';

test('full source comparison review matches its observed successful gate and survives JSON export',async()=>{
  const r=await sourcePeriodizationReviewEvidence(),o=sourcePeriodizationReviewEvidenceObservations(r);
  assert.equal(r.gate.nodeTests.passed,5);assert.equal(r.gate.independentCheckCount,33);
  assert.equal(r.gate.attempt,2);assert.equal(r.checks.length,24);assert.ok(r.checks.every(x=>x.pass));
  assert.equal(o.comparisonHypotheses.length,6);assert.equal(o.samples.length,0);
  assert.equal(canonical(JSON.parse(JSON.stringify(r))),canonical(r));
});

test('source comparison replay preserves pressure, energy hypotheses and no C/D conclusion',async()=>{
  const r=await runNavierM3({package:'N7',operation:'source-periodization-review'});
  assert.equal((await replayNavierM3(JSON.parse(JSON.stringify(r)))).pass,true);
  assert.equal(r.evidence.analyticCertificate.kind,'ORIGINAL_SOURCE_PERIODIZATION_REVIEW');
  assert.equal(r.results.scope.wholeKEnergyComputed,false);assert.equal(r.results.scope.unconditionalDConclusionIssued,false);
  const changed=structuredClone(r);changed.evidence.analyticCertificate.scope.unconditionalDConclusionIssued=true;
  await assert.rejects(replayNavierM3(changed),{code:'REPLAY_AUTHORITY_MISMATCH'});
});

test('caller premises and enlarged private comparison records are rejected',async()=>{
  await assert.rejects(sourcePeriodizationReviewEvidence({sameForcing:true}),{code:'INVALID_INPUT'});
  const r=await sourcePeriodizationReviewEvidence();r.proof.comparison.hypotheses=[];
  assert.throws(()=>sourcePeriodizationReviewEvidenceObservations(r),{code:'INVALID_SOURCE_ARCHIVE'});
});
