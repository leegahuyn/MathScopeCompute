import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {GLOBAL_FORCED_CURRENT_ARCHIVE} from '../source-global-forced-current-evidence-data.mjs';
import {recordedGlobalForcedCurrent,assertRecordedGlobalForcedCurrent,globalForcedCurrentObservations} from '../source-global-forced-current-evidence.mjs';

test('the public record binds the complete saved-source replay and preserves the unsuccessful combined execution',async()=>{
  const r=await recordedGlobalForcedCurrent();assert.equal(assertRecordedGlobalForcedCurrent(r),true);
  assert.ok(r.checks.every(x=>x.pass));assert.equal(r.gate.actualCoefficientComparisons,540);assert.equal(r.gate.sourceFileCount,9);
  assert.equal(r.gate.actualScalarIdentities,2320);assert.equal(r.sourceDependencyCapture.fileCount,155);
  assert.equal(r.originalConstructionGate.pass,false);assert.equal(r.originalConstructionGate.nodeTests.required,58);
  assert.equal(r.originalConstructionGate.stoppedReason,'OBSERVED_EXECUTION_TIME_LIMIT');
  assert.equal(r.gate.wholeCurrentCertificateRecovered,false);assert.equal(r.gate.privateSourceAuthorityHydrated,false);
  assert.equal(r.gate.resourceObservation.controllerRSSIsLauncherLowerBound,true);
  assert.equal(r.gate.resourceObservation.actualWorkerPeakRSSCompletelyObserved,false);
  assert.ok(r.gate.resourceObservation.actualWorkerRSSSampleMaximumBytes>1000000000);
  assert.equal(r.independent.actualSourceBound,true);assert.equal(r.independent.checkCount,213);
  assert.equal(r.independent.actualWholeCurrentCertificateBound,false);
  assert.equal(r.summary.templates.length,10);assert.equal(r.summary.assembly.signedSourceContributions,162);
  assert.equal(r.summary.assembly.exactPositiveSourceSystems,20);assert.equal(r.summary.assembly.exactNegativeConjugateSolutionRoutes,20);
  assert.equal(r.freshSourceConstructorExecuted,false);assert.equal(r.fullArtifactEmbedded,false);
  assert.equal(r.summary.integerExpressionRootsAreNotNumericalValues,true);
  for(const t of r.summary.templates){assert.deepEqual(t.originalSourceRows.map(x=>x.m),[-2,-1,1,2]);
    assert.deepEqual(t.forced.map(x=>x.m),[1,2]);assert.ok(t.coefficientChecks.every(x=>x.pass));
    for(const f of t.forced){assert.deepEqual(f.signedSolutions.map(x=>x.m),[f.m,-f.m]);
      assert.equal(f.wholePath.levelDifference,t.levelDifference);assert.equal(f.wholePath.preimagesIdentified,false);
      assert.ok(f.principalChecks.every(x=>x.pass));assert.ok(f.mappedChecks.every(x=>x.pass));
      assert.equal(f.limit.allActualMatrixSourceAndTimeDerivativeBodiesGenerated,true);
      assert.equal(f.limit.numericalIntegralEvaluated,false);assert.match(f.limit.tailFormula,/\(N\+1\)!/);}}
});

test('literal N6-03 keeps all new angular products and refreshed pressure while retaining every other tail and whole-stage obligation',async()=>{
  const r=await recordedGlobalForcedCurrent(),o=globalForcedCurrentObservations(r);
  assert.equal(r.literalAcceptance.row,'N6-03');assert.equal(r.literalAcceptance.criteriaSatisfied,true);
  assert.equal(r.literalAcceptance.wholeIndependentPDEComparisonInferred,false);
  assert.deepEqual(o.samples,[]);assert.deepEqual(o.curves,[]);assert.equal(o.harmonicRows.length,10);assert.equal(o.inverseRows.length,20);
  for(const row of o.harmonicRows){assert.deepEqual(row.nextResidualModes,[-4,-3,-2,-1,0,1,2,3,4]);
    assert.equal(row.discardedAngularTailBound,'0');assert.equal(row.maximumNextResidualAbsoluteMode,4);}
  assert.equal(o.limits[0].noOtherTailIsDeclaredZero,true);assert.notEqual(o.limits[1].bound,'0');assert.equal(o.limits[2].bound,null);
  assert.equal(o.pressure.refreshedAfterActualCurrentChange,true);assert.equal(o.pressure.totalGlobalPressureExpression,null);
  assert.equal(o.pressure.refreshedMean,r.summary.mean.refreshedMeanPressure);
  assert.equal(o.pressure.meanIncrement,r.summary.mean.globalMeanIncrement);
  assert.equal(o.pressure.newNormalizedMean,r.summary.mean.newNormalizedMeanPressure);
  assert.equal(o.pressure.angularRows.length,10);
  for(const row of o.pressure.angularRows)assert.deepEqual(row.rows.map(x=>x.m),[-2,-1,1,2]);
  for(const key of ['fullMixedDerivativeClosureAudited','wholeIndependentPDEComparisonExecuted','numericWholeFieldEnclosure',
    'inputForcingUniformClassNormsCertified','completeFourStepCycle','initializedJ0','allCorrectionStagesConstructed','completeN6','wholeM3Complete'])
    assert.equal(r.scope[key],false,key);
  assert.deepEqual(r.priorFailedAttempts.map(x=>x.pass),[false,false,false]);
  assert.deepEqual(r.priorFailedAttempts.map(x=>x.nodeTests.failed),[10,10,7]);
});

test('caller source replacements, edited normal pressure, changed completion flags and unsealed clones are rejected',async()=>{
  for(const input of [{body:0},{forcing:[]},{maximumMode:1},{bounds:[1,1]},[],null])
    await assert.rejects(recordedGlobalForcedCurrent(input),{code:'INVALID_INPUT'});
  const r=await recordedGlobalForcedCurrent();assert.throws(()=>globalForcedCurrentObservations({...r}),{code:'INVALID_SOURCE_ARCHIVE'});
  r.scope.fullMixedDerivativeClosureAudited=true;assert.throws(()=>assertRecordedGlobalForcedCurrent(r),{code:'INVALID_SOURCE_ARCHIVE'});
  const pressure=GLOBAL_FORCED_CURRENT_ARCHIVE.summary.templates[0].forced[0].fullPressure,
    saved=structuredClone(pressure);
  pressure.real=pressure.real===0?1:0;
  try{await assert.rejects(recordedGlobalForcedCurrent(),{code:'SOURCE_ARCHIVE_MISMATCH'});}
  finally{Object.assign(pressure,saved);}
  assert.equal((await recordedGlobalForcedCurrent()).archiveVerification.pass,true);
});

test('the compact archive rebuild verifies every current source byte, historical failed snapshot and exact artifact',()=>{
  const run=spawnSync('python',['research-ide/mathscope-m3/navier/tests/build-global-forced-current-evidence.py','--check'],
    {encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
  assert.equal(run.status,0,run.stderr||run.stdout);const r=JSON.parse(run.stdout);
  assert.equal(r.sourceFiles,155);assert.equal(r.replaySourceFiles,9);assert.equal(r.historicalFailedAttempts,3);
  assert.equal(r.actualCoefficientComparisons,540);assert.equal(r.actualScalarIdentities,2320);assert.equal(r.independentChecks,213);
  assert.equal(r.originalCombinedGatePass,false);assert.equal(r.wholeCurrentCertificateRecovered,false);
  assert.equal(r.literalN603Satisfied,true);assert.equal(r.completeN6,false);assert.equal(r.fullArtifactEmbedded,false);
  assert.ok(r.generatedBytes<1500000,'the browser record retains exact source tables and links the larger certificate');
});
