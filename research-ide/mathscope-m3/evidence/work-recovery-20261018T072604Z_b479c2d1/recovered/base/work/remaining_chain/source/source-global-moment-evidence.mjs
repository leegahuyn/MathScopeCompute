import {GLOBAL_MOMENT_ARCHIVE,GLOBAL_MOMENT_ARCHIVE_SHA256} from './source-global-moment-evidence-data.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};

export async function recordedGlobalMoment(parameters={}){
  if(!parameters||typeof parameters!=='object'||Array.isArray(parameters)||Object.keys(parameters).length)
    fail('INVALID_INPUT','The recorded original five-moment source has fixed inputs.');
  const hash=await sha256(canonicalStringify(GLOBAL_MOMENT_ARCHIVE));
  if(hash!==GLOBAL_MOMENT_ARCHIVE_SHA256)fail('SOURCE_ARCHIVE_MISMATCH','The observed original global-moment archive changed.');
  const r=structuredClone(GLOBAL_MOMENT_ARCHIVE);
  return {...r,schema:'MathScope.N6.RecordedGlobalMoment/1',status:'RECORDED_GLOBAL_SOURCE_MOMENT_UPDATE_VERIFIED',
    archiveSHA256:hash,recordedOnly:true,newExecution:false,freshSourceConstructorExecuted:false,
    archiveVerification:{pass:true,canonicalSHA256:hash},
    checks:[{id:'fixed-all-label-moment-archive-sha256',pass:true,recordedOnly:true},
      {id:'actual-12-tests-117-unchanged-source-files',pass:r.gate.nodeTests.passed===12&&r.gate.sourceFileCount===117,recordedOnly:true},
      {id:'all-original-five-moment-and-pressure-checks',pass:r.summary.checks.every(row=>row.pass),recordedOnly:true}],
    meaning:'The browser validates the recorded source expressions. Its exported summary links the complete raw source artifact; expression node IDs are not numerical velocity values.'};
}

export function globalMomentObservations(result){
  if(result?.schema!=='MathScope.N6.RecordedGlobalMoment/1'||result.recordedOnly!==true||result.sourceSummaryOnly!==true)
    fail('INVALID_SOURCE_ARCHIVE','Expected a verified global-moment source summary.');
  return {kind:'RECORDED_SOURCE_MOMENT_EXPRESSIONS',samples:[],curves:[],
    contract:{sourceArtifact:structuredClone(result.artifact),sourceGraphSHA256:result.summary.graph.sha256,
      expressionNodeIdsAreNumericValues:false,numericVelocitySamplesGenerated:false,fullArtifactEmbedded:false},
    claims:[{id:'N6-O-global-moment',observable:'Five original radial moments, meridional potential and recomputed nonlinear mean pressure',
      sourceArtifact:structuredClone(result.artifact),sourceGate:structuredClone(result.gate),
      sourceChecks:structuredClone(result.summary.checks),scope:structuredClone(result.scope),
      paperEquations:['(8.3)','(8.12)','(8.15)','(8.25)','(8.26)','(8.27)'],
      recordedOnly:true,numericalEnclosure:null,leanTheorem:null,newLeanExecuted:false}]};
}
