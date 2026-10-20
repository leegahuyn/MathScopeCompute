import {SOURCE_LOCALIZATION_OPERATOR_ARCHIVE,SOURCE_LOCALIZATION_OPERATOR_ARCHIVE_SHA256} from './source-localization-operator-evidence-data.mjs';
import {sourceLocalizationOperatorProof,assertSourceLocalizationOperatorProof,sourceLocalizationOperatorObservations} from './source-localization-operator.mjs';

const copy=x=>structuredClone(x),canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}',
  seals=new WeakMap(),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};

/** Execute the small exact operator proof and match its entire canonical output
 * to the fixed observed source-bound gate, without rerunning the large sources.
 */
export async function sourceLocalizationOperatorEvidence(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)
    fail('INVALID_INPUT','The original localization operator uses fixed authenticated source inputs.');
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(SOURCE_LOCALIZATION_OPERATOR_ARCHIVE))),
    archiveSHA256=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
  if(archiveSHA256!==SOURCE_LOCALIZATION_OPERATOR_ARCHIVE_SHA256)
    fail('SOURCE_ARCHIVE_MISMATCH','The fixed observed localization operator archive changed.');
  const archive=copy(SOURCE_LOCALIZATION_OPERATOR_ARCHIVE),proof=await sourceLocalizationOperatorProof();
  assertSourceLocalizationOperatorProof(proof);
  if(proof.proofSHA256!==archive.proofSHA256||canonical(proof.sourceBinding)!==canonical(archive.sourceBinding)
      ||canonical(proof.proofScope)!==canonical(archive.proofScope)||archive.gate.pass!==true
      ||archive.gate.nodeTests.passed!==10||archive.gate.independentCheckCount!==55||archive.gate.sourceFileCount!==13)
    fail('SOURCE_PROOF_REPLAY_MISMATCH','The freshly executed full operator proof must match the fixed observed artifact.');
  const result={schema:'MathScope.N7.LocalizationOperatorEvidence/1',status:'SOURCE_LOCALIZATION_PROOF_AND_OBSERVED_GATE_VERIFIED',
    freshExactOperatorProofExecuted:true,freshSourceConstructorExecuted:false,freshFullSourceConstructorExecuted:false,
    recordedSourcePrerequisites:true,proof,proofSHA256:proof.proofSHA256,archiveSHA256,
    archiveVerification:{pass:true,canonicalSHA256:archiveSHA256,newOperatorProofExactlyMatchesObservedArtifact:true},
    receipt:archive.receipt,artifact:archive.artifact,gate:archive.gate,sourceCapture:archive.sourceCapture,
    sourceArtifacts:Object.fromEntries(Object.entries(proof.sourceEvidence).filter(([,row])=>row&&typeof row==='object'&&typeof row.path==='string').map(([key,row])=>[key,copy(row)])),
    sourceBinding:copy(proof.sourceBinding),scope:copy(proof.proofScope),
    checks:copy([...proof.cutoffReplay.checks,...proof.algebra.checks]),
    independentVerification:archive.independentVerification,sourceValidation:archive.sourceValidation,
    newLeanExecuted:false,wholeM3Complete:false};
  seals.set(result,canonical(result));return result;
}

export function sourceLocalizationOperatorEvidenceObservations(result){
  if(!seals.has(result)||seals.get(result)!==canonical(result))
    fail('INVALID_SOURCE_ARCHIVE','Use the unchanged privately verified localization operator result.');
  return {...sourceLocalizationOperatorObservations(result.proof),observedProofReceipt:copy(result.receipt),
    observedProofArtifact:copy(result.artifact),observedProofGate:copy(result.gate),sourceArchiveSHA256:result.archiveSHA256};
}
