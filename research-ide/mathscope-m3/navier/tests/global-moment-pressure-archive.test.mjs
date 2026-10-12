import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {GLOBAL_MOMENT_FULL_PRESSURE_ARCHIVE} from '../source-global-moment-pressure-evidence-data.mjs';
import {recordedGlobalMomentFullPressure,globalMomentFullPressureObservations} from '../source-global-moment-pressure-evidence.mjs';

test('the new public archive revalidates the actual pressure and moment gates without replaying their large constructors',async()=>{
  const r=await recordedGlobalMomentFullPressure();assert.ok(r.checks.every(x=>x.pass));
  assert.equal(r.gate.nodeTests.passed,10);assert.equal(r.gate.sourceFileCount,121);
  assert.equal(r.priorCompletePressureObservation.gate.nodeTests.passed,15);
  assert.equal(r.priorCompletePressureObservation.gate.sourceFileCount,118);
  assert.equal(r.summary.graph.nodeCount,2100048);assert.equal(r.summary.checks.length,17);
  assert.equal(r.recordedOnly,true);assert.equal(r.freshSourceConstructorExecuted,false);
  assert.equal(r.fullArtifactEmbedded,false);assert.equal(r.sourceSummaryOnly,true);
  assert.equal(r.artifact.sha256,'9d81390a7d3bc6487b9bb24fc457b9732047f8c20717f263a0c8cd13e3e8aa6b');
  assert.ok(r.artifact.bytes>15000000);assert.ok(JSON.stringify(r).length<100000);
  assert.equal(r.packedArtifact.sha256,'98b60650c47e7f39d0f5e11f042fb932c9cd4c5c26475fe399620f5cac2cab7b');
  assert.equal(r.packedArtifact.bytes,602825);assert.equal(r.losslessRawArtifactVerified,true);
});

test('the literal N6-06 result retains full pressure, exact conservation, nonlinear remainders and lambda conditioning',async()=>{
  const r=await recordedGlobalMomentFullPressure(),s=r.summary;
  assert.equal(r.literalAcceptance.row,'N6-06');assert.equal(r.literalAcceptance.criteriaSatisfied,true);
  assert.equal(s.actualOriginalFiveRows.length,5);assert.ok(s.actualOriginalFiveRowChecks.every(x=>x.pass));
  assert.equal(s.pressure.allAuxiliaryModesRetained,true);assert.equal(s.pressure.cutoffRemainderDeclaredZero,false);
  assert.equal(s.nonlinear.nonlinearRemaindersDeclaredZero,false);
  assert.equal(s.conditioning.angularInverseUpper,27);assert.equal(s.conditioning.uniformLambdaLimitClaimed,false);
  assert.equal(s.conditioning.binary64UnscaledConditionNumber,false);
  assert.equal(r.literalAcceptance.packageCompletionInferred,false);assert.equal(r.literalAcceptance.initializedJ0Inferred,false);
  for(const key of ['temporalMeanInverseApplied','initializedJ0','allOrderSourceClassBoundCertified','numericFieldEnclosure','completeN6','wholeM3Complete'])
    assert.equal(r.scope[key],false,key);
  const observed=globalMomentFullPressureObservations(r);assert.deepEqual(observed.samples,[]);assert.deepEqual(observed.curves,[]);
  assert.equal(observed.contract.expressionNodeIdsAreNumericValues,false);assert.equal(observed.claims[0].numericalEnclosure,null);
});

test('changed source summaries, caller controls and mutated observation records are rejected',async()=>{
  for(const input of [{lambda:0},{pressure:0},{cutoff:1},[],null])await assert.rejects(recordedGlobalMomentFullPressure(input),{code:'INVALID_INPUT'});
  const r=await recordedGlobalMomentFullPressure();assert.throws(()=>globalMomentFullPressureObservations({...r}),{code:'INVALID_SOURCE_ARCHIVE'});
  r.scope.completeN6=true;assert.throws(()=>globalMomentFullPressureObservations(r),{code:'INVALID_SOURCE_ARCHIVE'});
  const saved=GLOBAL_MOMENT_FULL_PRESSURE_ARCHIVE.summary.pressure.value;
  GLOBAL_MOMENT_FULL_PRESSURE_ARCHIVE.summary.pressure.value=0;
  try{await assert.rejects(recordedGlobalMomentFullPressure(),{code:'SOURCE_ARCHIVE_MISMATCH'});}
  finally{GLOBAL_MOMENT_FULL_PRESSURE_ARCHIVE.summary.pressure.value=saved;}
  assert.equal((await recordedGlobalMomentFullPressure()).archiveVerification.pass,true);
});

test('the deterministic build checks every captured source byte and linked artifact before publishing the compact consumer',()=>{
  const run=spawnSync('python',['research-ide/mathscope-m3/navier/tests/build-global-moment-pressure-evidence.py','--check'],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||run.stdout);const r=JSON.parse(run.stdout);
  assert.equal(r.sourceFiles,121);assert.equal(r.sourceTests,10);assert.equal(r.priorPressureTests,15);
  assert.equal(r.literalN606Satisfied,true);assert.equal(r.completeN6,false);assert.equal(r.checkOnly,true);
  assert.ok(r.generatedBytes<100000);
});
