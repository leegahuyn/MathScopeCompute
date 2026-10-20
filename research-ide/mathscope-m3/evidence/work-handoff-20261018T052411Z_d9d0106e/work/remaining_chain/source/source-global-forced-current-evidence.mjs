import {GLOBAL_FORCED_CURRENT_ARCHIVE,GLOBAL_FORCED_CURRENT_ARCHIVE_SHA256} from './source-global-forced-current-evidence-data.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  fail=(code,message)=>{throw Object.assign(new Error(message),{code});};

/** Verify a fixed complete replay of saved original forced source stages.
 * No private original-current authority or missing final certificate is
 * restored. The unsuccessful combined source run remains unsuccessful.
 */
export async function recordedGlobalForcedCurrent(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)
    fail('INVALID_INPUT','The recorded forced source stages have fixed original inputs.');
  const hash=await sha256(canonicalStringify(GLOBAL_FORCED_CURRENT_ARCHIVE));
  if(hash!==GLOBAL_FORCED_CURRENT_ARCHIVE_SHA256)fail('SOURCE_ARCHIVE_MISMATCH','The saved exact forced-source archive changed.');
  const r=structuredClone(GLOBAL_FORCED_CURRENT_ARCHIVE),s=r.summary,scope=r.scope,
    rows=s.templates.flatMap(t=>t.forced),checks=[
      {id:'fixed-saved-forced-source-archive-sha256',pass:r.schema==='MathScope.N6.GlobalForcedCurrentArchive/2'},
      {id:'complete-separate-replay540-and2320',pass:r.gate.pass===true&&r.gate.exitCode===0&&r.gate.stoppedReason===null&&
        r.gate.actualCoefficientComparisons===540&&r.gate.actualScalarIdentities===2320&&r.gate.negativeControls===4&&
        r.gate.sourceFileCount===9&&r.gate.sourceFilesUnchanged&&r.sourceDependencyCapture.fileCount===155&&
        r.gate.all155OriginalSourceBytesAndArtifactsVerified},
      {id:'failed35minute-combined-source-run-preserved',pass:r.originalConstructionGate.pass===false&&
        r.originalConstructionGate.stoppedReason==='OBSERVED_EXECUTION_TIME_LIMIT'&&r.originalConstructionGate.timeoutSeconds===2100&&
        r.originalConstructionGate.sourceFileCount===155&&r.originalConstructionGate.sourceFilesUnchanged&&
        r.originalConstructionGate.nodeTests.required===58&&r.gate.originalConstructorPass===false&&
        r.gate.originalConstructorOutcomeRewritten===false&&r.gate.wholeCurrentCertificateRecovered===false},
      {id:'independent213-whole-geometry-and-actual-stage-bindings',pass:r.independent.checkCount===213&&r.independent.actualSourceBound&&
        r.independent.actualSavedStageBound&&!r.independent.actualWholeCurrentCertificateBound&&!r.independent.floatingPointUsed},
      {id:'ten-original-lifts-all20-source-inverses',pass:s.templates.length===10&&rows.length===20&&
        same(s.templates.map(t=>t.levelDifference).sort((a,b)=>a-b),[0,0,1,1,2,2,3,3,4,4])&&
        new Set(s.templates.map(t=>t.sign)).size===2&&s.templates.every(t=>same(t.originalSourceRows.map(x=>x.m),[-2,-1,1,2]))},
      {id:'whole-source-path-normal-pressure-and-negative-partners',pass:rows.every(f=>
        same(f.signedSolutions.map(x=>x.m),[f.m,-f.m])&&f.principalChecks.every(x=>x.pass)&&f.sourceChecks.every(x=>x.pass)&&
        f.wholePath.checks.every(x=>x.pass)&&!f.wholePath.preimagesIdentified&&
        f.pathInvariance.independentParameterDerivativeNotDropped&&f.pathInvariance.sourceClassNormNotAssumed)},
      {id:'original-cutoff-inside-full-mapped-curl',pass:rows.every(f=>f.mappedChecks.every(x=>x.pass)&&
        f.mappedVelocity.length===3&&f.fullCurlRemainder.length===3&&f.mappedPotential.bodies.length===6&&
        f.sourceSupport.originalPsiRestoresLongitudinalSupport&&!f.sourceSupport.fullAllOrderUniformClassBound)},
      {id:'full-source-ordered-limits-retain-their-bounds',pass:rows.every(f=>f.limit.allActualMatrixSourceAndTimeDerivativeBodiesGenerated&&
        f.limit.coefficients.every(c=>c.allActualCoefficientBodiesGenerated&&c.allActualTimeDerivativeBodiesGenerated)&&
        !f.limit.commonAllBandClassBoundCertified&&!f.limit.numericalIntegralEvaluated&&!f.fullParameterLimitClosureExecuted)},
      {id:'all162-current-contributions-and-new-mean-pressure',pass:s.assembly.allOriginalSourceLabels===81&&
        s.assembly.signedSourceContributions===162&&s.assembly.exactPositiveSourceSystems===20&&
        s.assembly.exactNegativeConjugateSolutionRoutes===20&&s.assembly.all162CovarianceContributionsVerified&&
        s.assembly.allOriginalCoverMapsRetained&&s.assembly.fullMeanWaveProductsRetained&&s.mean.checks.every(x=>x.pass)&&
        s.mean.completeGlobalCurrentCertificateAvailable===false&&s.mean.totalGlobalPressureExpressionInSavedSnapshot===null},
      {id:'every-new-finite-mode-and-full-coefficient-comparison',pass:s.templates.every(t=>
        same(t.nextAngularSource.map(x=>x.m),[-4,-3,-2,-1,1,2,3,4])&&same(t.finiteInventory.nextResidual,[-4,-3,-2,-1,0,1,2,3,4])&&
        t.finiteInventory.discarded.length===0&&t.finiteInventory.discardedAngularTailBound==='0'&&t.coefficientChecks.length===54&&
        t.coefficientVerification.pass&&t.coefficientVerification.actualDirectMinusDecomposedRecomputed&&
        t.coefficientVerification.declaredZeroDefectNeverTrusted&&!t.coefficientVerification.extraSourceRelationsAssumed&&
        t.coefficientChecks.every(x=>x.pass)&&t.support.checks.every(x=>x.pass)&&t.completeStateEquality.every(x=>x.pass))},
      {id:'three-earlier-failures-stay-failed',pass:r.priorFailedAttempts.length===3&&r.priorFailedAttempts.every(x=>
        x.pass===false&&x.sourceSnapshotsPreserved&&!x.completeForcedCurrentProduced)},
      {id:'literalN603-source-scope-with-all-other-tail-obligations',pass:r.literalAcceptance.row==='N6-03'&&
        r.literalAcceptance.criteriaSatisfied&&!r.literalAcceptance.packageCompletionInferred&&!r.literalAcceptance.initializedJ0Inferred&&
        !r.literalAcceptance.wholeIndependentPDEComparisonInferred&&!r.literalAcceptance.uniformFourierOrVolterraTailSetToZero&&
        !r.literalAcceptance.failedCombinedGatePromoted&&!r.literalAcceptance.missingFinalCurrentCertificateFabricated&&
        scope.individualN603OperatorCriteriaSatisfied&&scope.all11ExactSourceGraphSnapshotsVerified&&
        scope.zeroTailAppliesOnlyToThisFiniteAngularInventory&&scope.actualSavedSourceCoefficientComparisonsReplayed===540&&
        !scope.completeGlobalCurrentCertificateRecovered&&!scope.privateSourceAuthorityHydrated&&!scope.originalCombinedGatePass&&
        !scope.fullMixedDerivativeClosureAudited&&!scope.wholeIndependentPDEComparisonExecuted&&!scope.numericWholeFieldEnclosure&&
        !scope.inputForcingUniformClassNormsCertified&&!scope.completeFourStepCycle&&!scope.initializedJ0&&
        !scope.allCorrectionStagesConstructed&&!scope.completeN6&&!scope.wholeM3Complete}
    ].map(x=>({...x,recordedOnly:true}));
  if(checks.some(x=>!x.pass))fail('SOURCE_ARCHIVE_MISMATCH','A saved actual source, replay, pressure, mode or execution boundary changed.');
  const result={...r,schema:'MathScope.N6.RecordedGlobalForcedCurrent/1',status:'RECORDED_ACTUAL_FORCED_SOURCE_STAGES_REPLAY_VERIFIED',
    archiveSHA256:hash,recordedOnly:true,newExecution:false,freshSourceConstructorExecuted:false,
    archiveVerification:{pass:true,canonicalSHA256:hash},checks,
    meaning:'The original source run retained all20 forced inverses, cutoff curls and eleven exact graph snapshots. A separate complete replay checked every saved mode and540local coefficient identities. The combined source run still timed out, and its absent final global-current certificate is not fabricated.'};
  seals.set(result,canonicalStringify(result));return result;
}

export function assertRecordedGlobalForcedCurrent(result){
  if(!seals.has(result)||seals.get(result)!==canonicalStringify(result))
    fail('INVALID_SOURCE_ARCHIVE','Use the unchanged privately verified recorded-source archive.');
  return true;
}

export function globalForcedCurrentObservations(result){
  assertRecordedGlobalForcedCurrent(result);const s=result.summary;
  return {kind:'RECORDED_SOURCE_FORCED_ANGULAR_STAGES',samples:[],curves:[],
    contract:{sourceArtifact:structuredClone(result.artifact),sourceGraphSHA256:s.graph.sha256,
      fullArtifactURL:result.fullArtifactURL,sourceSnapshotIndexURL:result.sourceSnapshotIndexURL,
      sourceGate:structuredClone(result.gate),originalConstructionGate:structuredClone(result.originalConstructionGate),
      expressionNodeIdsAreNumericValues:false,numericVelocitySamplesGenerated:false,fullArtifactEmbedded:false,
      completeGlobalCurrentCertificateRecovered:false},
    harmonicRows:s.templates.map(t=>({key:t.key,sign:t.sign,levelDifference:t.levelDifference,
      inputModes:t.originalSourceRows.map(x=>x.m),solvedModes:t.finiteInventory.solved,updatedVelocityModes:t.finiteInventory.updatedVelocity,
      nextResidualModes:t.finiteInventory.nextResidual,maximumNextResidualAbsoluteMode:t.finiteInventory.maximumNextResidualAbsoluteMode,
      discardedAngularTailBound:t.finiteInventory.discardedAngularTailBound,discardedBoundScope:t.finiteInventory.boundScope,
      exactSourceCoefficientChecks:t.coefficientChecks.length,allExactSourceCoefficientChecksPass:t.coefficientChecks.every(x=>x.pass)})),
    inverseRows:s.templates.flatMap(t=>t.forced.map(f=>({key:t.key,sign:t.sign,levelDifference:t.levelDifference,m:f.m,conjugateMode:-f.m,
      system:f.system,wholePath:structuredClone(f.wholePath),source:structuredClone(f.source),fullPressure:structuredClone(f.fullPressure),
      mappedVelocity:structuredClone(f.mappedVelocity),mappedPressure:structuredClone(f.mappedPressure),fullCurlRemainder:structuredClone(f.fullCurlRemainder),
      matrixNorm:f.limit.matrixNorm,forcingNorm:f.limit.forcingNorm,intervalLength:f.limit.intervalLength,tailFormula:f.limit.tailFormula,
      actualSourceAndTimeDerivativeBoundBodiesConstructed:true,fullMixedParameterClosureExecuted:false,numericalNormValuesProvided:false}))),
    pressure:{refreshedMean:s.mean.refreshedMeanPressure,meanIncrement:s.mean.globalMeanIncrement,
      oldNormalizedMean:s.mean.oldNormalizedMeanPressure,newNormalizedMean:s.mean.newNormalizedMeanPressure,
      normalizedMeanIncrement:s.mean.normalizedMeanIncrement,completeCovariance:structuredClone(s.mean.fullCurrentCovariance),
      angularRows:s.templates.map(t=>({key:t.key,rows:t.updatedWaveRows.map(r=>({m:r.m,pressure:structuredClone(r.pressure)}))})),
      totalGlobalPressureExpression:null,completeGlobalCurrentCertificateRecovered:false,
      expressionReferencesOnly:true,refreshedAfterActualCurrentChange:true},
    limits:[{kind:'FINITE_ANGULAR_REGISTRY',bound:'0',reason:'Every current product mode from -4 through4 is retained.',noOtherTailIsDeclaredZero:true},
      {kind:'SOURCE_ORDERED_VOLTERRA_LIMIT',bound:'F*L*exp(M*L)*(M*L)^N/(N+1)!',sourceCoefficientAndTimeDerivativeBoundsRetained:true,
        numericalBoundEvaluated:false,everyMixedParameterSourceClosureExecuted:false},
      {kind:'AUXILIARY_FOURIER_AND_CURRENT_CLASS',bound:null,
        meaning:'The inherited exact Fourier inverse retains its own tail; complete updated-source mixed derivatives and uniform forcing class norms are separate obligations.'}],
    claims:[{id:'N6-O-saved-current-forced-angular',observable:'Every actual current angular source, original inverse and full cutoff curl',
      sourceArtifact:structuredClone(result.artifact),sourceGate:structuredClone(result.gate),sourceChecks:structuredClone(s.checks),
      literalAcceptance:structuredClone(result.literalAcceptance),scope:structuredClone(result.scope),
      paperEquations:['(7.13)','(7.16)','(7.37)','(8.12)','(9.13)']}]};
}
