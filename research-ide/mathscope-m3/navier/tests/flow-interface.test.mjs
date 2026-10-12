import test from 'node:test';
import assert from 'node:assert/strict';
import {NAVIER_M3_EXAMPLES,runNavierM3,replayNavierM3} from '../index.mjs';

test('actual flow example separates integrator inputs and hashes user observation settings',async()=>{
  const example=NAVIER_M3_EXAMPLES.find(e=>e.id==='N8-flow'),record=await runNavierM3(example.input),o=record.observations;
  assert.equal(record.results.status,'FINITE_RUN_COMPLETE');
  assert.equal('observation'in record.results.input,false);
  assert.deepEqual(record.input.parameters.observation,example.input.parameters.observation);
  assert.equal(o.paths.length,4);
  assert.deepEqual(new Set(o.paths.map(p=>p.kind)),new Set(['INSTANTANEOUS_STREAMLINE','PARTICLE_PATH']));
  assert.deepEqual(o.energy.core.bounds,example.input.parameters.observation.coreBounds);
  assert.equal(o.contract.runHash,record.runHash);
  assert.equal(o.contract.coordinateSystems.periodic_box.sourcePaperNormalizedCoordinates,false);
  assert.equal(o.claims.length,6);
  for(const claim of o.claims){
    assert.equal(claim.runHash,record.runHash);
    assert.equal(claim.reference.blueprint.page,66);
    assert.ok(claim.numericalTests.length>0);
    assert.equal(claim.analyticCertificate,null);
    assert.equal(claim.leanTheorem,null);
    assert.equal(claim.certifiedApproximation,false);
  }
  assert.deepEqual(o.samples[0].reference.claimIds,['N8-O-velocity','N8-O-angular-velocity']);
  assert.equal((await replayNavierM3(record)).pass,true);
  const altered=structuredClone(record);altered.input.parameters.observation.steps=32;
  await assert.rejects(replayNavierM3(altered),{code:'REPLAY_HASH_MISMATCH'});
  const forged=structuredClone(record);forged.observations.paths[0].points[0].velocity[0]+=1;
  await assert.rejects(replayNavierM3(forged),{code:'REPLAY_AUTHORITY_MISMATCH'});
  const forgedClaim=structuredClone(record);forgedClaim.observations.claims[0].analyticCertificate={provedPDE:true};
  await assert.rejects(replayNavierM3(forgedClaim),{code:'REPLAY_AUTHORITY_MISMATCH'});
});

test('invalid observation settings fail before an invalid solver configuration is evaluated',async()=>{
  await assert.rejects(runNavierM3({package:'N8',operation:'galerkin',parameters:{cutoff:99,observation:{steps:0}}}),/steps/i);
  await assert.rejects(runNavierM3({package:'N8',operation:'galerkin',parameters:{observation:{coreGrid:100}}}),/grid/i);
  await assert.rejects(runNavierM3({package:'N8',operation:'galerkin',parameters:{observation:{inventedTail:0}}}),/option/i);
});

test('acceptance observations link the selected computed run rather than nonexistent top-level coefficients',async()=>{
  const record=await runNavierM3({package:'N8',operation:'acceptance'}),o=record.observations;
  assert.equal(o.contract.executedRunPath,'results.selectedRun');
  assert.equal(o.samples[0].reference.coefficientSource,'results.selectedRun.final');
  assert.ok(o.paths.every(p=>p.coefficientSource.startsWith('results.selectedRun.')));
  assert.ok(o.claims.every(c=>c.finiteRunChecks.every(x=>x.pass&&x.path.startsWith('results.selectedRun.'))));
  assert.equal(record.results.selectedRun.status,'FINITE_RUN_COMPLETE');
});
