import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {sourcePeriodizationReview,sourcePeriodizationReviewObservations,disjointTranslationReview} from '../source-periodization-review.mjs';
import {exactPeriodizationRequest} from '../source-periodization.mjs';

const proof=await sourcePeriodizationReview();

test('actual captured source cutoff, every curl coefficient and all16 affine derivative identities are preserved',()=>{
  assert.equal(proof.transport.sourceAuthenticated,true);assert.equal(proof.transport.checks.length,16);
  assert.ok(proof.transport.checks.every(x=>x.pass));assert.equal(proof.transport.velocity.length,3);
  assert.ok(proof.transport.velocity.every(row=>row.terms.length===5));
  assert.equal(proof.transport.originalClosedConstantsNumericallyReplaced,false);
  const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
  const {proofSHA256,...serialized}=JSON.parse(JSON.stringify(proof));
  assert.equal(createHash('sha256').update(canonical(serialized)).digest('hex'),proofSHA256);
  assert.ok(proof.transport.formulaProgram.originalConstantNodeBindings.every(row=>Number.isInteger(row.replayedNode)&&proof.transport.formulaProgram.nodes[row.replayedNode]));
  assert.equal(proof.sourceLocalizationProofSHA256,'33f32d13dcd8e6c2d9122e936fa007f83da319ad122f72a9990e6dad9bc2370e');
  if(process.env.N7_PERIODIZATION_PROOF_OUTPUT)fs.writeFileSync(process.env.N7_PERIODIZATION_PROOF_OUTPUT,JSON.stringify(proof,null,2)+'\n');
});

test('viscosity, pressure, force, spatial/time Jacobians and terminal-time shift agree',()=>{
  assert.deepEqual(proof.transport.exactScales,{viscosity:'9/4',sqrtViscosity:'3/2',lambda:'4',spatialPullback:'8/3',timePullback:'16',velocity:'6',pressure:'36',force:'96',wholeEnergy:'243/128'});
  assert.ok(proof.scales.checks.every(row=>row.pass));assert.equal(proof.time.initialShift,'15/16');
  assert.equal(proof.time.extendedForceEnd,'17/16');assert.equal(proof.time.terminalTime,'1');
  assert.equal(proof.time.forceEndConditionalOnSourceGlobalExtension,true);
});

test('strict source support gap removes all18 mixed nonlinear terms while overlapping solenoidal copies fail',()=>{
  assert.equal(proof.translations.domain,'R^3/Z^3');assert.equal(proof.translations.reviewedExactHalfWidth,'3/8');
  assert.equal(proof.translations.reviewedExactGap,'1/4');assert.equal(proof.translations.fullMixedAdvectionTerms.length,18);
  assert.equal(proof.translations.overlapNegativeControl.nonzero,true);
  assert.throws(()=>exactPeriodizationRequest({viscosity:'9/4',spatialScale:'3'}),{code:'OVERLAPPING_SUPPORT'});
  const modified=exactPeriodizationRequest();modified.support.strictlyPositive=false;
  assert.throws(()=>disjointTranslationReview(modified),{code:'INVALID_INPUT'});
});

test('all comparison hypotheses remain mandatory and global energy/force conclusions remain unresolved',()=>{
  const h=proof.comparison.hypotheses;assert.equal(h.length,6);assert.ok(h.every(row=>row.required));
  for(const id of ['same-force','zero-initial-data','periodic-pressure','bounded-whole-space-energy','smoothness-before-terminal','global-force-extension'])assert.ok(h.some(row=>row.id===id));
  assert.equal(proof.comparison.pressure.noPressureGrowthAssumptionAdded,true);
  assert.equal(proof.comparison.CConclusionIssued,false);assert.equal(proof.comparison.DConclusionIssued,false);
  assert.equal(proof.scope.wholeKEnergyComputed,false);assert.equal(proof.scope.completeGlobalForceConstructed,false);
  assert.equal(proof.scope.wholeM3Complete,false);assert.equal(proof.scope.newLeanExecuted,false);
});

test('source substitutions, premise booleans and changed source review output are rejected',async()=>{
  await assert.rejects(sourcePeriodizationReview({sameForcing:true}),{code:'INVALID_INPUT'});
  await assert.rejects(sourcePeriodizationReview({energy:0}),{code:'INVALID_INPUT'});
  const changed=structuredClone(proof);changed.comparison.DConclusionIssued=true;
  assert.throws(()=>sourcePeriodizationReviewObservations(changed),{code:'INVALID_SOURCE_REVIEW'});
  const observation=sourcePeriodizationReviewObservations(proof);assert.equal(observation.samples.length,0);
  assert.equal(observation.kind,'SOURCE_PERIODIZATION_COMPARISON_REVIEW');
});
