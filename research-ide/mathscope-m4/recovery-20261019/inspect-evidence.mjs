import { canonicalProofJSON, proofSha256 } from '../../mathscope-m0/proof.mjs';

const SHA256 = /^[0-9a-f]{64}$/;
const SHA1 = /^[0-9a-f]{40}$/;
const copy = value => JSON.parse(canonicalProofJSON(value));
const requireValue = (condition, reason) => { if (!condition) throw new Error(reason); };

async function exactSourceDigest(raw) {
  let bytes;
  if (typeof raw === 'string') bytes = new TextEncoder().encode(raw);
  else if (raw instanceof ArrayBuffer) bytes = new Uint8Array(raw.slice(0));
  else if (ArrayBuffer.isView(raw)) bytes = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength).slice();
  else throw new Error('SOURCE_BYTES_REQUIRED');
  requireValue(globalThis.crypto?.subtle, 'SHA256_UNAVAILABLE');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}

/** Resolve own data properties without eval, prototype traversal, or fabricated coordinates. */
export function selectOriginalValue(result, selectionPath) {
  requireValue(Array.isArray(selectionPath) && selectionPath.length <= 32, 'SELECTION_PATH_REQUIRED');
  let value = result;
  for (const key of selectionPath) {
    requireValue((typeof key === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,100}$/.test(key)) || (Number.isSafeInteger(key) && key >= 0), 'INVALID_SELECTION_KEY');
    requireValue(!['constructor', 'prototype', '__proto__'].includes(key), 'PROTOTYPE_SELECTION_REJECTED');
    requireValue(value !== null && typeof value === 'object' && Object.hasOwn(value, key), 'SELECTION_NOT_IN_ORIGINAL_RESULT');
    value = value[key];
  }
  return copy(value);
}

/**
 * Rebind a selected stored observation to current source bytes and a fixed
 * public commit URL. Hash integrity is the only authority supplied here.
 * Null errors and coordinates remain null, and imported status cannot grant
 * proof or final acceptance.
 */
export async function inspectStoredObservation(record, selectionPath, readSource) {
  canonicalProofJSON(record);
  const snapshot = copy(record);
  const selectedPath = copy(selectionPath);
  requireValue(snapshot?.schema === 'MathScope.M4.InspectableObservation/1', 'OBSERVATION_SCHEMA_REQUIRED');
  requireValue(typeof snapshot.claimId === 'string' && snapshot.claimId.length > 0, 'CLAIM_ID_REQUIRED');
  requireValue(typeof snapshot.jobId === 'string' && snapshot.jobId.length > 0, 'JOB_ID_REQUIRED');
  requireValue(SHA256.test(snapshot.inputHash) && SHA256.test(snapshot.resultHash), 'INPUT_RESULT_HASH_REQUIRED');
  requireValue(SHA1.test(snapshot.source?.commit), 'PINNED_SOURCE_COMMIT_REQUIRED');
  const path = snapshot.source.path;
  requireValue(typeof path === 'string' && /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(path) && !path.split('/').some(x => ['.', '..'].includes(x)), 'SOURCE_PATH_REJECTED');
  requireValue(SHA256.test(snapshot.source.sha256), 'SOURCE_SHA256_REQUIRED');
  requireValue(SHA256.test(snapshot.document?.sha256) && Number.isSafeInteger(snapshot.document.page) && snapshot.document.page > 0, 'EXACT_DOCUMENT_LOCATION_REQUIRED');
  requireValue(typeof snapshot.formula === 'string' && snapshot.formula.length > 0, 'ORIGINAL_FORMULA_REQUIRED');
  requireValue(Array.isArray(snapshot.assumptionIds) && snapshot.assumptionIds.every(x => typeof x === 'string'), 'EXPLICIT_ASSUMPTION_LIST_REQUIRED');
  requireValue(typeof snapshot.scope === 'string' && snapshot.scope.length > 0, 'EXACT_SCOPE_REQUIRED');
  requireValue(Object.hasOwn(snapshot, 'error') && Object.hasOwn(snapshot, 'originalCoordinates'), 'EXPLICIT_UNKNOWN_ERROR_COORDINATES_REQUIRED');
  requireValue(snapshot.kernelPass === false && snapshot.originalCriterionAccepted === false, 'UNAUTHORIZED_ACCEPTANCE_CLAIM');
  requireValue(typeof readSource === 'function', 'SOURCE_READER_REQUIRED');
  // Bind the requested own property before any asynchronous source/hash read.
  const value = selectOriginalValue(snapshot.result, selectedPath);
  const raw = await readSource(path);
  requireValue(await exactSourceDigest(raw) === snapshot.source.sha256, 'CURRENT_SOURCE_BYTES_MISMATCH');
  requireValue(await proofSha256(snapshot.result) === snapshot.resultHash, 'STORED_RESULT_HASH_MISMATCH');
  const shared = {
    claimId: snapshot.claimId, assumptionIds: copy(snapshot.assumptionIds), scope: snapshot.scope,
    formula: snapshot.formula, document: copy(snapshot.document), jobId: snapshot.jobId,
    inputHash: snapshot.inputHash, resultHash: snapshot.resultHash,
    source: { ...snapshot.source, url: `https://github.com/leegahuyn/MathScopeCompute/blob/${snapshot.source.commit}/${path}` },
    selectionPath: selectedPath, originalValue: value,
    originalCoordinates: copy(snapshot.originalCoordinates), error: copy(snapshot.error),
    display: snapshot.display ? copy(snapshot.display) : null,
  };
  return {
    schema: 'MathScope.M4.ObservationInspection/1', status: 'SOURCE_AND_RESULT_BYTES_MATCH',
    student: { ...copy(shared), explanation: snapshot.explanation ?? snapshot.scope },
    expert: { ...copy(shared), theoremType: snapshot.theoremType ?? null },
    currentKernelExecuted: false, grantsProof: false, originalCriterionAccepted: false,
    limitation: 'Stored observation byte binding only; no fresh numerical execution, whole-field certificate, theorem import, or browser interaction is asserted.',
  };
}
