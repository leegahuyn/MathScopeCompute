import {SOURCE_PERIODIZATION_REVIEW_ARCHIVE,SOURCE_PERIODIZATION_REVIEW_ARCHIVE_SHA256} from './source-periodization-review-evidence-data.mjs';
import {sourcePeriodizationReview,sourcePeriodizationReviewObservations} from './source-periodization-review.mjs';
const copy=x=>structuredClone(x),canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}',seals=new WeakMap();
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};

export async function sourcePeriodizationReviewEvidence(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)
    fail('INVALID_INPUT','The original comparison review uses fixed authenticated source inputs and preserves all required hypotheses.');
  const bytes=new TextEncoder().encode(canonical(SOURCE_PERIODIZATION_REVIEW_ARCHIVE)),
    digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
  if(digest!==SOURCE_PERIODIZATION_REVIEW_ARCHIVE_SHA256)fail('SOURCE_ARCHIVE_MISMATCH','The observed original comparison archive changed.');
  const a=copy(SOURCE_PERIODIZATION_REVIEW_ARCHIVE),proof=await sourcePeriodizationReview();
  sourcePeriodizationReviewObservations(proof);
  if(proof.proofSHA256!==a.proofSHA256||canonical(proof.sourceBinding)!==canonical(a.sourceBinding)||canonical(proof.scope)!==canonical(a.scope)
      ||!a.gate.pass||a.gate.nodeTests.passed!==5||a.gate.independentCheckCount!==33||a.gate.sourceFileCount!==17)
    fail('SOURCE_PROOF_REPLAY_MISMATCH','The newly executed full comparison review does not match its fixed observed source artifact.');
  const result={schema:'MathScope.N7.PeriodizationReviewEvidence/1',status:'SOURCE_PERIODIZATION_REVIEW_AND_OBSERVED_GATE_VERIFIED',
    freshExactOperatorProofExecuted:true,freshSourceConstructorExecuted:false,freshFullSourceConstructorExecuted:false,recordedSourcePrerequisites:true,
    analyticProofKind:'ORIGINAL_SOURCE_PERIODIZATION_REVIEW',proof,proofSHA256:proof.proofSHA256,archiveSHA256:digest,
    receipt:a.receipt,artifact:a.artifact,gate:a.gate,sourceCapture:a.sourceCapture,sourceArtifacts:copy(proof.sourceArtifacts),
    sourceBinding:copy(proof.sourceBinding),scope:copy(proof.scope),checks:copy(proof.checks),
    independentVerification:a.independentVerification,sourceValidation:a.sourceValidation,newLeanExecuted:false,wholeM3Complete:false};
  seals.set(result,canonical(result));return result;
}

export function sourcePeriodizationReviewEvidenceObservations(result){
  if(!seals.has(result)||seals.get(result)!==canonical(result))fail('INVALID_SOURCE_ARCHIVE','Use the unchanged privately verified original comparison review.');
  return {...sourcePeriodizationReviewObservations(result.proof),observedProofReceipt:copy(result.receipt),
    observedProofArtifact:copy(result.artifact),observedProofGate:copy(result.gate),sourceArchiveSHA256:result.archiveSHA256};
}
