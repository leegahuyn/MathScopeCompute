import {
  assessProofEvidence, isVerifiedProofReceipt, canonicalProofJSON,
  proofSha256, auditDependencyGraph,
} from '../mathscope-m0/proof.mjs';
import { M4_CRITERIA, HANDOFF_BASELINE } from './criteria.mjs';

const kernelArtifactAuthority = new WeakSet();
const criterionAuthority = new WeakSet();
const assessmentAuthority = new WeakSet();
// Update only after independent review of actual criterion execution artifacts.
// Empty means final M4 acceptance is UNCONFIRMED, not historical zero completion.
const REVIEWED_CRITERION_DIGESTS = Object.freeze({});
const REVIEWED_M3_COMPLETION_DIGESTS = Object.freeze([]);
const clone = value => JSON.parse(JSON.stringify(value));
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const failure = (code, reason, extra = {}) => freeze({ verified: false, code, reason, ...extra });
const shaPattern = /^[0-9a-f]{64}$/;

export function validateArtifactPath(path) {
  if (typeof path !== 'string' || !/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(path) || path.split('/').some(p => p === '.' || p === '..')) {
    throw new TypeError('Artifact paths must be relative slash-separated paths without traversal.');
  }
  return path;
}

async function bytesDigest(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  if (!(bytes instanceof Uint8Array)) throw new TypeError('Artifact reader must return bytes or UTF-8 text.');
  if (bytes.byteLength > 16 * 1024 * 1024) throw new RangeError('Artifact exceeds the 16 MiB audit budget.');
  const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return { sha256: Array.from(new Uint8Array(hash), x => x.toString(16).padStart(2, '0')).join(''), byteLength: bytes.byteLength };
}

/** Recheck raw bytes for the same previously audited M0 kernel run. */
export function requiredKernelArtifacts(bundle) {
  const files = new Map();
  const add = (path, sha256, role) => {
    validateArtifactPath(path);
    if (!shaPattern.test(sha256 || '')) throw new TypeError(`Missing pinned digest: ${path}`);
    const previous = files.get(path);
    if (previous && previous.sha256 !== sha256) throw new TypeError(`Conflicting pinned digest: ${path}`);
    files.set(path, { path, sha256, roles: [...new Set([...(previous?.roles || []), role])] });
  };
  for (const file of bundle.jobSpec.sourceFiles) add(`research-ide/mathscope-m0/lean/${file.path}`, file.sha256, 'SOURCE');
  for (const build of bundle.audit.moduleBuilds) {
    add(`research-ide/mathscope-m0/lean/${build.sourceFile}`, build.sourceSha256, 'BUILT_SOURCE');
    add(`research-ide/mathscope-m0/evidence/${build.logFile}`, build.logSha256, 'RAW_KERNEL_LOG');
  }
  for (const control of bundle.audit.negativeControls) {
    add(`research-ide/mathscope-m0/lean/${control.sourceFile}`, control.sourceSha256, 'NEGATIVE_SOURCE');
    add(`research-ide/mathscope-m0/evidence/${control.logFile}`, control.logSha256, 'RAW_NEGATIVE_LOG');
  }
  add('research-ide/mathscope-m0/evidence/lean-environment.json', bundle.jobSpec.environment.importManifestSha256, 'IMPORT_ENVIRONMENT_MANIFEST');
  return freeze([...files.values()].sort((a, b) => a.path.localeCompare(b.path)));
}

export async function verifyPinnedKernelArtifacts(jobInput, bundle, readArtifact) {
  const assessed = await assessProofEvidence(jobInput, bundle);
  if (!assessed.verified || !isVerifiedProofReceipt(assessed.receipt)) return failure(assessed.status, assessed.reason, { issues: assessed.issues || [] });
  if (typeof readArtifact !== 'function') return failure('ARTIFACT_READER_REQUIRED', 'Raw sources and compiler logs must be read before issuing an artifact receipt.');
  const artifacts = [];
  try {
    for (const item of requiredKernelArtifacts(bundle)) {
      let bytes;
      try { bytes = await readArtifact(item.path); }
      catch (error) { return failure('ARTIFACT_MISSING', `Cannot read ${item.path}: ${error.message}`); }
      const actual = await bytesDigest(bytes);
      if (actual.sha256 !== item.sha256) return failure('ARTIFACT_HASH_MISMATCH', `Raw bytes differ from the pinned audit: ${item.path}`, { path: item.path, expectedSha256: item.sha256, actualSha256: actual.sha256 });
      artifacts.push({ ...item, ...actual });
    }
  } catch (error) { return failure('ARTIFACT_INVALID', String(error.message)); }
  const receipt = freeze({
    schemaVersion: 'mathscope.m4.kernel-artifact-receipt/1',
    authority: 'HISTORICAL_PINNED_KERNEL_ARTIFACTS',
    claimId: assessed.receipt.claimId, target: assessed.receipt.target,
    targetType: assessed.receipt.targetType, scope: assessed.receipt.scope,
    grade: assessed.receipt.grade, axioms: clone(assessed.receipt.axioms),
    auditDigest: assessed.receipt.auditDigest, bindingDigest: assessed.receipt.bindingDigest,
    artifacts, artifactsDigest: await proofSha256(artifacts),
    currentKernelExecuted: false, arbitrarySourceCompile: false,
    grantsM4CriterionAcceptance: false,
  });
  kernelArtifactAuthority.add(receipt);
  return freeze({ verified: true, code: 'HISTORICAL_KERNEL_ARTIFACTS_MATCH', receipt,
    reason: 'Previously audited target/source/assumptions/environment and raw artifact bytes match. This is not a new Lean execution or a complete M4 criterion.' });
}

export const isVerifiedKernelArtifactReceipt = value => Boolean(value && kernelArtifactAuthority.has(value));
export const isVerifiedM4CriterionReceipt = value => Boolean(value && criterionAuthority.has(value));
export const isVerifiedM4Assessment = value => Boolean(value && assessmentAuthority.has(value));

/** A serialized PASS has no authority. New checks require a reviewed immutable anchor. */
export async function verifyCriterionEvidence(candidate, readArtifact) {
  const criterion = M4_CRITERIA.find(item => item.id === candidate?.criterionId);
  if (!criterion) return failure('UNKNOWN_CRITERION', 'An exact original I3/R1 criterion ID is required.');
  try { canonicalProofJSON(candidate); } catch (error) { return failure('INVALID_CRITERION_EVIDENCE', String(error.message)); }
  if (candidate.schemaVersion !== 'mathscope.m4.criterion-evidence/1') return failure('INVALID_CRITERION_SCHEMA', 'Versioned criterion evidence is required.');
  if (!Array.isArray(candidate.artifacts) || !candidate.artifacts.length || candidate.artifacts.length > 256) return failure('CRITERION_ARTIFACTS_REQUIRED', 'At least one bounded raw execution artifact is required.');
  const checked = [];
  const seen = new Set();
  try {
    for (const artifact of candidate.artifacts) {
      validateArtifactPath(artifact.path);
      if (seen.has(artifact.path) || !shaPattern.test(artifact.sha256 || '')) throw new TypeError('Artifact paths must be unique and have complete SHA-256 digests.');
      seen.add(artifact.path);
      const actual = await bytesDigest(await readArtifact(artifact.path));
      if (actual.sha256 !== artifact.sha256) return failure('CRITERION_ARTIFACT_HASH_MISMATCH', `Criterion artifact bytes changed: ${artifact.path}`);
      checked.push({ path: artifact.path, ...actual });
    }
  } catch (error) { return failure('CRITERION_ARTIFACT_INVALID', String(error.message)); }
  const digest = await proofSha256(candidate);
  if (REVIEWED_CRITERION_DIGESTS[criterion.id] !== digest) {
    return failure('CRITERION_REVIEW_REQUIRED', 'Artifact integrity and claimed PASS bits do not establish execution success or original-criterion acceptance. No independently reviewed criterion anchor matches this evidence.', { criterionId: criterion.id, candidateDigest: digest, integrityCheckedArtifacts: checked });
  }
  const receipt = freeze({ criterionId: criterion.id, digest, artifactDigests: checked, authority: 'REVIEWED_ORIGINAL_CRITERION', sourceCommit: candidate.sourceCommit });
  criterionAuthority.add(receipt);
  return freeze({ verified: true, code: 'CRITERION_ACCEPTED', receipt });
}

export async function assessM4Acceptance({ criterionReceipts = [], kernelReceipts = [], m3CompletionEvidence = null } = {}) {
  const newlyAccepted = new Map();
  for (const receipt of criterionReceipts) if (isVerifiedM4CriterionReceipt(receipt)) newlyAccepted.set(receipt.criterionId, receipt);
  const historicalKernelScopes = kernelReceipts.filter(isVerifiedKernelArtifactReceipt).map(receipt => ({
    claimId: receipt.claimId, target: receipt.target, grade: receipt.grade, scope: receipt.scope,
    axioms: clone(receipt.axioms), artifactsDigest: receipt.artifactsDigest, currentKernelExecuted: false,
  }));
  let m3Digest = null;
  try { if (m3CompletionEvidence) m3Digest = await proofSha256(m3CompletionEvidence); } catch { /* Invalid data cannot change the baseline. */ }
  const currentM3CompletionVerified = Boolean(m3Digest && REVIEWED_M3_COMPLETION_DIGESTS.includes(m3Digest));
  const criteria = M4_CRITERIA.map(criterion => ({ ...clone(criterion),
    state: newlyAccepted.has(criterion.id) ? 'NEWLY_ACCEPTED_BY_THIS_AUDIT' : 'FINAL_ACCEPTANCE_UNCONFIRMED',
    receiptDigest: newlyAccepted.get(criterion.id)?.digest || null,
  }));
  const allCurrentCriteriaVerified = newlyAccepted.size === M4_CRITERIA.length;
  const canFreeze = currentM3CompletionVerified && allCurrentCriteriaVerified;
  const report = freeze({
    schemaVersion: 'mathscope.m4.acceptance-assessment/1', baseline: clone(HANDOFF_BASELINE),
    historicalM4FinalAcceptance: 'UNCONFIRMED', newlyAcceptedCriteriaInThisAudit: newlyAccepted.size,
    originalCriteriaEnumerated: M4_CRITERIA.length, criteria,
    historicalKernelScopes, currentM3CompletionVerified, allCurrentCriteriaVerified,
    canFreeze, canDeclareM4Complete: canFreeze,
    status: canFreeze ? 'CURRENT_SCOPE_ACCEPTED' : 'M4_FINAL_ACCEPTANCE_UNCONFIRMED',
    pendingOriginalM3: currentM3CompletionVerified ? [] : [...HANDOFF_BASELINE.pendingOriginalM3],
    openResearch: ['RH_GLOBAL_BRIDGE', 'BSD_UNIVERSAL', 'GENERAL_G_CONTINUUM_QUANTUM_YM', 'WHOLE_ORIGINAL_NS_RECONSTRUCTION'],
    rejectedSerializedCriterionReceipts: criterionReceipts.filter(receipt => !isVerifiedM4CriterionReceipt(receipt)).length,
    publicationConfirmed: false,
    limitation: 'M0 kernel prerequisites are inherited at their original scopes. This audit does not assign historical M4 a zero percentage, rerun Lean, accept all analytic/refinement/force obligations, or confirm deployment.',
  });
  assessmentAuthority.add(report);
  return report;
}

export function buildM4ChecklistView(report) {
  if (!isVerifiedM4Assessment(report)) throw new TypeError('Reassess imported data before displaying an authoritative checklist.');
  return freeze({
    label: 'M4 최종 인수 미확인', historicalStatus: report.historicalM4FinalAcceptance,
    newlyAcceptedCriteriaInThisAudit: report.newlyAcceptedCriteriaInThisAudit,
    gate: report.canFreeze ? '선택 범위 인수' : 'HOLD',
    groups: ['I3', 'R1'].map(group => ({ group, criteria: report.criteria.filter(item => item.id.startsWith(group)).map(item => ({
      claimId: item.id, studentLabel: item.title, expertRequirement: item.requirement,
      originalPage: item.page, state: item.state, receiptDigest: item.receiptDigest, requiredChecks: [...item.checks],
    })) })),
    predecessorKernelScopes: clone(report.historicalKernelScopes),
    pendingOriginalM3: [...report.pendingOriginalM3], openResearch: [...report.openResearch],
  });
}

export function exportM4Assessment(report) {
  if (!isVerifiedM4Assessment(report)) throw new TypeError('A locally assessed M4 report is required.');
  return { schemaVersion: 'mathscope.m4.assessment-export/1', report: clone(report), importedTrust: 'REASSESSMENT_REQUIRED' };
}

export function auditM4ResearchDependency(graph, targetId, requestedGrade = 'UNCONDITIONAL_FORMAL') {
  return auditDependencyGraph(graph, targetId, { requestedGrade, closeResearchGate: true });
}
