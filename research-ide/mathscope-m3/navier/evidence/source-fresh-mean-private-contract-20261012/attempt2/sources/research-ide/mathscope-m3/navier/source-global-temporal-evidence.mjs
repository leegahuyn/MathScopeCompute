import {GLOBAL_TEMPORAL_ARCHIVE,GLOBAL_TEMPORAL_ARCHIVE_SHA256} from './source-global-temporal-evidence-data.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};

/** Fixed observed source: the consumer verifies its record and does not
 * relaunch the multi-gigabyte exact source derivative construction.
 */
export async function recordedGlobalTemporalInverse(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)
    fail('INVALID_INPUT','The recorded actual-source temporal inverse has fixed source inputs.');
  const hash=await sha256(canonicalStringify(GLOBAL_TEMPORAL_ARCHIVE));
  if(hash!==GLOBAL_TEMPORAL_ARCHIVE_SHA256)
    fail('SOURCE_ARCHIVE_MISMATCH','The observed actual-source temporal archive changed.');
  const r=structuredClone(GLOBAL_TEMPORAL_ARCHIVE),s=r.summary,checks=[
    {id:'fixed-actual-temporal-archive-sha256',pass:true,recordedOnly:true},
    {id:'actual15-tests123-unchanged-source-files',pass:r.gate.nodeTests.passed===15&&r.gate.sourceFileCount===123,recordedOnly:true},
    {id:'independent662-exact-Fourier-polynomial-checks',pass:r.independentKernelObservation.independentCheckCount===662&&
      !r.independentKernelObservation.sourceAuthenticated,recordedOnly:true},
    {id:'all14-actual-source-temporal-checks',pass:s.checks.length===14&&s.checks.every(x=>x.pass),recordedOnly:true},
    {id:'two-actual-inverses-zero-mode-full-tails',pass:Object.values(s.inverses).length===2&&
      Object.values(s.inverses).every(x=>x.sourceAuthenticated&&!x.finiteSumReplacesExactLimit&&x.identity.pass&&
        x.finite.zeroMode.retainedSeparately&&!x.finite.zeroMode.inverted&&x.finite.tails.every(t=>
          t.sourceDerivativeOrder===t.derivativeOrder+4&&t.tailTendsToZero&&!t.omittedModesSetToZero)),recordedOnly:true},
    {id:'all-requested-physical-inverse-jets-have-their-own-source-tail',pass:s.derivativeQueries.length===5&&
      s.derivativeQueries.every(q=>q.actualTailAssignedToEveryRequestedPartial)&&
      s.derivativeClosureSummary.indexedDerivativeProgramCount===466&&s.derivativeClosureSummary.completeRowsPerIndexedProgram===162,recordedOnly:true},
    {id:'original-physical-potential-slow-time-and-cutoff-retained',pass:s.potential.checks.every(x=>x.pass)&&
      s.potential.slowTimeTermsRetained&&!s.potential.cutoffRemainderDeclaredZero,recordedOnly:true},
    {id:'historical-resource-failures-remain-failures',pass:r.priorFailedAttempts.length===2&&r.priorFailedAttempts.every(x=>
      x.pass===false&&x.sourceSnapshotsPreserved)&&r.gate.upstreamSourceStageMaximumNodes===3500000&&r.gate.temporalStageMaximumNodes===5000000,recordedOnly:true},
    {id:'literal-temporal-operator-keeps-package-scope',pass:r.literalAcceptance.criteriaSatisfied&&!r.literalAcceptance.packageCompletionInferred&&
      !r.literalAcceptance.initializedJ0Inferred&&r.scope.temporalMeanInverseApplied&&!r.scope.postTemporalNonlinearPressureReconstructed&&
      !r.scope.initializedJ0&&!r.scope.completeN6&&!r.scope.wholeM3Complete,recordedOnly:true}];
  if(checks.some(x=>!x.pass))fail('SOURCE_ARCHIVE_MISMATCH','A recorded actual temporal source, tail or completion scope changed.');
  const result={...r,schema:'MathScope.N6.RecordedGlobalTemporalInverse/1',
    status:'RECORDED_ACTUAL_TEMPORAL_INVERSE_AND_ORIGINAL_POTENTIAL_VERIFIED',archiveSHA256:hash,
    recordedOnly:true,newExecution:false,freshSourceConstructorExecuted:false,
    archiveVerification:{pass:true,canonicalSHA256:hash},checks,
    meaning:'The source gate executed the actual Fourier coefficient, derivative-tail and physical-potential construction. This operation checks its fixed recorded summary and linked certificate; expression node IDs are not numerical field values.'};
  seals.set(result,canonicalStringify(result));return result;
}

export function globalTemporalInverseObservations(result){
  if(!seals.has(result)||seals.get(result)!==canonicalStringify(result))
    fail('INVALID_SOURCE_ARCHIVE','Use the unchanged privately verified actual-source temporal archive.');
  return {kind:'RECORDED_SOURCE_TEMPORAL_INVERSE_AND_AXIAL_POTENTIAL',samples:[],curves:[],
    contract:{sourceArtifact:structuredClone(result.artifact),sourceGraphSHA256:result.summary.graph.sha256,
      expressionNodeIdsAreNumericValues:false,numericVelocitySamplesGenerated:false,fullArtifactEmbedded:false},
    claims:[{id:'N6-O-global-temporal-inverse',observable:'Original zero-mode temporal inverse, complete omitted-mode bounds and physical axial/radial potential',
      sourceArtifact:structuredClone(result.artifact),sourceGate:structuredClone(result.gate),
      sourceChecks:structuredClone(result.summary.checks),literalAcceptance:structuredClone(result.literalAcceptance),
      scope:structuredClone(result.scope),paperEquations:['(8.10)','(8.13)','(8.16)','(8.20)'],
      recordedOnly:true,numericalEnclosure:null,leanTheorem:null,newLeanExecuted:false}]};
}
