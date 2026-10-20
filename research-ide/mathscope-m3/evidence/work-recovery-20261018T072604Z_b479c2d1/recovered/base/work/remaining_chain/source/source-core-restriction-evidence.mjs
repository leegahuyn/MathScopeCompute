import {SOURCE_CORE_RESTRICTION_ARCHIVE,SOURCE_CORE_RESTRICTION_ARCHIVE_SHA256} from './source-core-restriction-evidence-data.mjs';
import {recordedSourceCoreRestriction,assertRecordedSourceCoreRestriction,sourceCoreRestrictionObservations} from './source-core-restriction.mjs';

const copy=x=>structuredClone(x),canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}',
  seals=new WeakMap(),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};

/** Revalidate the observed support-proof receipt and execute that small proof
 * again. The original common6/core/near-terminal measurements are reused.
 */
export async function recordedSourceCoreRestrictionEvidence(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)
    fail('INVALID_INPUT','The observed original support-proof archive has fixed inputs.');
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(SOURCE_CORE_RESTRICTION_ARCHIVE))),
    archiveSHA256=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
  if(archiveSHA256!==SOURCE_CORE_RESTRICTION_ARCHIVE_SHA256)
    fail('SOURCE_ARCHIVE_MISMATCH','The observed source support-proof archive changed.');
  const archive=copy(SOURCE_CORE_RESTRICTION_ARCHIVE),proof=await recordedSourceCoreRestriction();
  assertRecordedSourceCoreRestriction(proof);
  if(proof.proofSHA256!==archive.certificate.proofSHA256||canonical(proof)!==canonical(archive.certificate)
      ||archive.gate.pass!==true||archive.gate.nodeTests.passed!==16||archive.gate.independentCheckCount!==41
      ||archive.gate.sourceFileCount!==156||archive.gate.freshSourceConstructorExecuted!==false)
    fail('SOURCE_PROOF_REPLAY_MISMATCH','The newly executed small proof must match the complete observed source proof exactly.');
  const result={schema:'MathScope.N7.RecordedCoreRestrictionEvidence/1',status:'RECORDED_GATE_AND_NEW_SUPPORT_PROOF_VERIFIED',
    recordedOnly:true,freshSourceConstructorExecuted:false,newSupportProofExecuted:true,
    proof,proofSHA256:proof.proofSHA256,archiveSHA256,
    archiveVerification:{pass:true,canonicalSHA256:archiveSHA256,newSupportProofExactlyMatchesObservedArtifact:true},
    receipt:archive.receipt,artifact:archive.artifact,gate:archive.gate,sourceCapture:archive.sourceCapture,
    sourceArtifacts:copy(proof.sourceArtifacts),sourceBinding:copy(proof.sourceBinding),scope:copy(proof.scope),
    checks:copy(proof.checks),supportChecks:copy(proof.supportInduction.checks),independentVerification:archive.independentVerification,
    sourceValidation:archive.sourceValidation,newLeanExecuted:false,wholeM3Complete:false};
  seals.set(result,canonical(result));return result;
}

export function sourceCoreRestrictionEvidenceObservations(result){
  if(!seals.has(result)||seals.get(result)!==canonical(result))
    fail('INVALID_SOURCE_ARCHIVE','Use the unchanged privately verified support-proof archive result.');
  assertRecordedSourceCoreRestriction(result.proof);
  return {...sourceCoreRestrictionObservations(result.proof),observedProofReceipt:copy(result.receipt),
    observedProofArtifact:copy(result.artifact),observedProofGate:copy(result.gate),sourceArchiveSHA256:result.archiveSHA256};
}
