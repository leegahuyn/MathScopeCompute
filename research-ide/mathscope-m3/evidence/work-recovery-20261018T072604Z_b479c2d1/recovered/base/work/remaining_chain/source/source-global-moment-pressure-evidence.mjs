import {GLOBAL_MOMENT_FULL_PRESSURE_ARCHIVE,GLOBAL_MOMENT_FULL_PRESSURE_ARCHIVE_SHA256} from './source-global-moment-pressure-evidence-data.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};

/** Fixed recorded source, never caller replacement arrays or a fresh
 * multi-gigabyte constructor hidden inside a browser operation.
 */
export async function recordedGlobalMomentFullPressure(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)
    fail('INVALID_INPUT','The recorded original five-moment full-pressure source has fixed inputs.');
  const hash=await sha256(canonicalStringify(GLOBAL_MOMENT_FULL_PRESSURE_ARCHIVE));
  if(hash!==GLOBAL_MOMENT_FULL_PRESSURE_ARCHIVE_SHA256)
    fail('SOURCE_ARCHIVE_MISMATCH','The observed original five-moment full-pressure archive changed.');
  const r=structuredClone(GLOBAL_MOMENT_FULL_PRESSURE_ARCHIVE),checks=[
    {id:'fixed-full-moment-pressure-archive-sha256',pass:true,recordedOnly:true},
    {id:'actual10-tests121-unchanged-source-files',pass:r.gate.nodeTests.passed===10&&r.gate.sourceFileCount===121,recordedOnly:true},
    {id:'prior-complete-pressure15-tests118-source-files',pass:r.priorCompletePressureObservation.gate.nodeTests.passed===15&&r.priorCompletePressureObservation.gate.sourceFileCount===118,recordedOnly:true},
    {id:'all17-actual-full-pressure-identity-checks',pass:r.summary.checks.length===17&&r.summary.checks.every(x=>x.pass),recordedOnly:true},
    {id:'five-original-equations-and-lambda-condition-controls',pass:r.summary.actualOriginalFiveRowChecks.length===5&&
      r.summary.actualOriginalFiveRowChecks.every(x=>x.pass)&&r.summary.conditioning.sourceAuthenticated&&
      !r.summary.conditioning.uniformLambdaLimitClaimed&&!r.summary.conditioning.binary64UnscaledConditionNumber,recordedOnly:true},
    {id:'literal-operator-completion-keeps-package-scope',pass:r.literalAcceptance.criteriaSatisfied&&
      !r.literalAcceptance.packageCompletionInferred&&!r.literalAcceptance.initializedJ0Inferred&&
      !r.scope.temporalMeanInverseApplied&&!r.scope.initializedJ0&&!r.scope.completeN6&&!r.scope.wholeM3Complete,recordedOnly:true}];
  if(checks.some(x=>!x.pass))fail('SOURCE_ARCHIVE_MISMATCH','A recorded full moment-pressure result or completion scope changed.');
  const result={...r,schema:'MathScope.N6.RecordedGlobalMomentFullPressure/1',
    status:'RECORDED_ORIGINAL_FIVE_MOMENTS_FULL_PRESSURE_VERIFIED',archiveSHA256:hash,
    recordedOnly:true,newExecution:false,freshSourceConstructorExecuted:false,
    archiveVerification:{pass:true,canonicalSHA256:hash},checks,
    meaning:'The source gate executed the actual five original moments, complete auxiliary pressure and nonlinear identities. This public operation revalidates its recorded summary and linked artifacts; expression node IDs are not numerical velocity values.'};
  seals.set(result,canonicalStringify(result));return result;
}

export function globalMomentFullPressureObservations(result){
  if(!seals.has(result)||seals.get(result)!==canonicalStringify(result))
    fail('INVALID_SOURCE_ARCHIVE','Use the unchanged privately verified original full moment-pressure archive.');
  return {kind:'RECORDED_SOURCE_FIVE_MOMENTS_AND_FULL_PRESSURE',samples:[],curves:[],
    contract:{sourceArtifact:structuredClone(result.artifact),sourceGraphSHA256:result.summary.graph.sha256,
      expressionNodeIdsAreNumericValues:false,numericVelocitySamplesGenerated:false,fullArtifactEmbedded:false},
    claims:[{id:'N6-O-global-moment-full-pressure',observable:'Five original radial equations, exact conservation, complete pressure8.12 and nonlinear8.26/8.27',
      sourceArtifact:structuredClone(result.artifact),sourceGate:structuredClone(result.gate),
      sourceChecks:structuredClone(result.summary.checks),scope:structuredClone(result.scope),
      literalAcceptance:structuredClone(result.literalAcceptance),
      paperEquations:['(8.3)','(8.12)','(8.14)','(8.15)','(8.25)','(8.26)','(8.27)'],
      recordedOnly:true,numericalEnclosure:null,leanTheorem:null,newLeanExecuted:false}]};
}
