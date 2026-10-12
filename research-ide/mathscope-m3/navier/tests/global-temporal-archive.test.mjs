import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {GLOBAL_TEMPORAL_ARCHIVE} from '../source-global-temporal-evidence-data.mjs';
import {recordedGlobalTemporalInverse,globalTemporalInverseObservations} from '../source-global-temporal-evidence.mjs';

test('the public temporal record binds the actual full-source gate and exact independent Fourier controls',async()=>{
  const r=await recordedGlobalTemporalInverse();assert.ok(r.checks.every(x=>x.pass));
  assert.equal(r.gate.nodeTests.passed,15);assert.equal(r.gate.sourceFileCount,123);
  assert.equal(r.independentKernelObservation.independentCheckCount,662);
  assert.equal(r.summary.graph.nodeCount,3613061);assert.equal(r.summary.checks.length,14);
  assert.equal(r.artifact.sha256,'8ef4e695623643d6ed344ce092270b0ac392be1aa2e49bcc1990ebd5da39df58');
  assert.equal(r.artifact.bytes,24527857);assert.equal(r.packedArtifact.bytes,841112);
  assert.equal(r.packedArtifact.sha256,'f8514482e0fee1f0f8b78519ef6683da9fc607448e03e2a8d0d560598d8e0585');
  assert.equal(r.losslessRawArtifactVerified,true);assert.equal(r.fullArtifactEmbedded,false);
  assert.equal(r.freshSourceConstructorExecuted,false);assert.ok(JSON.stringify(r).length<200000);
});

test('literal N6-05 retains both actual full sources, every required tail, original potential and separate initialization scope',async()=>{
  const r=await recordedGlobalTemporalInverse(),s=r.summary;
  assert.equal(r.literalAcceptance.row,'N6-05');assert.equal(r.literalAcceptance.criteriaSatisfied,true);
  for(const inverse of Object.values(s.inverses)){
    assert.equal(inverse.finite.zeroMode.inverted,false);assert.equal(inverse.finiteSumReplacesExactLimit,false);
    assert.ok(inverse.finite.tails.every(t=>t.sourceDerivativeOrder===t.derivativeOrder+4&&!t.omittedModesSetToZero));
  }
  assert.equal(s.derivativeQueries.length,5);assert.equal(s.derivativeClosureSummary.exactInverseDerivativeCount,9);
  assert.equal(s.derivativeClosureSummary.indexedDerivativeProgramCount,466);
  assert.equal(s.derivativeClosureSummary.actualOriginalSourceDerivativeCount,4210);
  assert.equal(s.potential.slowTimeTermsRetained,true);assert.equal(s.potential.cutoffRemainderDeclaredZero,false);
  assert.equal(r.scope.temporalMeanInverseApplied,true);
  for(const k of ['postTemporalNonlinearPressureReconstructed','fiveMomentsAfterTemporalApplied','initializedJ0',
    'allOrderSourceClassBoundCertified','numericFieldEnclosure','completeN6','wholeM3Complete'])assert.equal(r.scope[k],false,k);
  const o=globalTemporalInverseObservations(r);assert.deepEqual(o.samples,[]);assert.deepEqual(o.curves,[]);
  assert.equal(o.contract.expressionNodeIdsAreNumericValues,false);assert.equal(o.claims[0].numericalEnclosure,null);
});

test('failed attempts are preserved and changed source records or caller-provided controls are rejected',async()=>{
  const r=await recordedGlobalTemporalInverse();assert.deepEqual(r.priorFailedAttempts.map(x=>x.pass),[false,false]);
  assert.deepEqual(r.priorFailedAttempts.map(x=>x.nodeTests.failed),[6,6]);
  assert.equal(r.gate.temporalStageMaximumNodes,5000000);assert.equal(r.gate.upstreamSourceStageMaximumNodes,3500000);
  for(const input of [{body:0},{bounds:[1,1]},{cutoff:1},[],null])await assert.rejects(recordedGlobalTemporalInverse(input),{code:'INVALID_INPUT'});
  assert.throws(()=>globalTemporalInverseObservations({...r}),{code:'INVALID_SOURCE_ARCHIVE'});
  r.scope.completeN6=true;assert.throws(()=>globalTemporalInverseObservations(r),{code:'INVALID_SOURCE_ARCHIVE'});
  const saved=GLOBAL_TEMPORAL_ARCHIVE.summary.inverses.z.actualHaarMean;
  GLOBAL_TEMPORAL_ARCHIVE.summary.inverses.z.actualHaarMean=0;
  try{await assert.rejects(recordedGlobalTemporalInverse(),{code:'SOURCE_ARCHIVE_MISMATCH'});}
  finally{GLOBAL_TEMPORAL_ARCHIVE.summary.inverses.z.actualHaarMean=saved;}
  assert.equal((await recordedGlobalTemporalInverse()).archiveVerification.pass,true);
});

test('the compact deterministic build verifies every live source byte, historical snapshot and packed observed artifact',()=>{
  const run=spawnSync('python',['research-ide/mathscope-m3/navier/tests/build-global-temporal-evidence.py','--check'],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||run.stdout);const r=JSON.parse(run.stdout);
  assert.equal(r.sourceFiles,123);assert.equal(r.sourceTests,15);assert.equal(r.independentFourierChecks,662);
  assert.equal(r.historicalFailedAttempts,2);assert.equal(r.literalN605Satisfied,true);assert.equal(r.completeN6,false);
  assert.ok(r.generatedBytes<200000);
});
