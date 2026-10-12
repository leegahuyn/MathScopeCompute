import { runGaugeM3, inspectFieldSelection, inspectLatticeSelection } from '../gauge/index.mjs';
import { runNavierM3 } from '../navier/index.mjs';
import { deriveExtendedViewContract } from './extended-view-contract.mjs';

/** The worker consumes a fixed static closure, never user-provided code. */
export function canonicalExtended(value) {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Non-finite JSON number');
    if (value === undefined) throw new Error('Undefined is not a serialized mathematical value');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return '[' + value.map(canonicalExtended).join(',') + ']';
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalExtended(value[k])).join(',') + '}';
}

export async function digestExtended(value) {
  const bytes = new TextEncoder().encode(canonicalExtended(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

export function validateExtendedRequest(request) {
  if (!request || Array.isArray(request) || Object.keys(request).sort().join(',') !== 'input,kind') throw new Error('Request must contain only kind and input');
  if (!['gauge', 'navier'].includes(request.kind) || !request.input || Array.isArray(request.input) || typeof request.input !== 'object') throw new Error('Unsupported request');
  if (new TextEncoder().encode(JSON.stringify(request)).length > 131072) throw new Error('The request exceeds 128 KiB');
  return request;
}

export async function executeExtended(request, build) {
  validateExtendedRequest(request);
  const requestDigest = await digestExtended(request);
  const result = await (request.kind === 'gauge' ? runGaugeM3(request.input) : runNavierM3(request.input));
  // Reject non-finite values before JSON could silently replace them by null.
  canonicalExtended(result);
  const serialized = JSON.stringify(result);
  if (serialized.length > 24 * 1024 * 1024) throw new Error('Output exceeds the 24 MiB execution budget');
  const plain = JSON.parse(serialized);
  const resultDigest = await digestExtended(plain);
  return {
    schema: 'MathScope.M3.ExtendedExecution/1',
    request, result: plain, requestDigest, resultDigest,
    sourceBinding: build.sourceBinding,
    environment: build.environment,
    execution: { status: 'COMPLETED', backend: 'STATIC_BROWSER_WORKER' },
    serializedAuthority: 'UNTRUSTED_REQUIRES_REEXECUTION',
    formalProofIssued: false,
    wholeM3Complete: false,
    p7ExcludedFromThisExecution: true
  };
}

export async function inspectExtendedRecord(record, build) {
  if (!record || record.schema !== 'MathScope.M3.ExtendedExecution/1' || record.serializedAuthority !== 'UNTRUSTED_REQUIRES_REEXECUTION' || record.formalProofIssued !== false || record.wholeM3Complete !== false || record.p7ExcludedFromThisExecution !== true) throw new Error('Untrusted or incompatible execution authority');
  validateExtendedRequest(record.request);
  if (record.requestDigest !== await digestExtended(record.request) || record.resultDigest !== await digestExtended(record.result)) throw new Error('Imported request or result digest mismatch');
  const sameSource = canonicalExtended(record.sourceBinding) === canonicalExtended(build.sourceBinding);
  const sameEnvironment = canonicalExtended(record.environment) === canonicalExtended(build.environment);
  let presentationVerified = false;
  if (record.presentation !== undefined) {
    const p = record.presentation;
    if (!p || p.schema !== 'MathScope.M3.ExtendedPresentation/1' || Object.keys(p).sort().join(',') !== 'digest,payload,schema') throw new Error('Invalid presentation envelope');
    if (!p.payload || Object.keys(p.payload).sort().join(',') !== 'displayContract,view') throw new Error('Invalid presentation payload');
    if (p.digest !== await digestExtended(p.payload)) throw new Error('Presentation digest mismatch');
    const expected = deriveExtendedViewContract(record, p.payload.view);
    if (canonicalExtended(expected) !== canonicalExtended(p.payload.displayContract)) throw new Error('Displayed bounds, color, vectors or source were changed');
    presentationVerified = true;
  }
  return { valid: true, sameSource, sameEnvironment, replayAllowed: sameSource && sameEnvironment, presentationVerified, importedAuthorityAdopted: false };
}

if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.onmessage = async event => {
    const message = event.data, build = globalThis.__MATHSCOPE_M3_EXTENDED_BUILD__;
    try {
      if (!message || typeof message.id !== 'string' || !build) throw new Error('Missing execution context');
      if (message.action === 'inspect') {
        self.postMessage({ id: message.id, ok: true, result: await inspectExtendedRecord(message.record, build) });
      } else if (message.action === 'select') {
        const inspection = await inspectExtendedRecord(message.record, build);
        if (!inspection.replayAllowed || message.record.request.kind !== 'gauge') throw new Error('Selection requires a current gauge source');
        if (!Number.isInteger(message.stateIndex) || !Number.isInteger(message.pointIndex) || message.stateIndex < 0 || message.stateIndex > 3 || message.pointIndex < 0 || message.pointIndex > 728) throw new Error('Invalid source selection');
        const fresh = await executeExtended(message.record.request, build);
        if (fresh.resultDigest !== message.record.resultDigest) throw new Error('Selection source changed on reexecution');
        const selection = ['lattice-observation', 'wilson-flow'].includes(fresh.result.kind)
          ? await inspectLatticeSelection(fresh.result, message.stateIndex, message.pointIndex)
          : inspectFieldSelection(fresh.result, message.stateIndex, message.pointIndex);
        self.postMessage({ id: message.id, ok: true, selection, recomputed: true, resultDigest: fresh.resultDigest });
      } else if (message.action === 'run' || message.action === 'replay') {
        if (message.action === 'replay') {
          const inspection = await inspectExtendedRecord(message.record, build);
          if (!inspection.replayAllowed) throw new Error('SOURCE_OR_ENVIRONMENT_CHANGED: restore input only and execute it afresh');
        }
        const record = await executeExtended(message.action === 'replay' ? message.record.request : message.request, build);
        self.postMessage({ id: message.id, ok: true, record,
          replay: message.action === 'replay' ? { status: record.resultDigest === message.record.resultDigest ? 'MATCH' : 'MISMATCH', previousDigest: message.record.resultDigest, currentDigest: record.resultDigest, recomputed: true } : null });
      } else throw new Error('Unknown bounded worker operation');
    } catch (error) {
      self.postMessage({ id: message?.id, ok: false, error: { code: error.code || 'EXECUTION_REJECTED', message: String(error.message || error).slice(0,1200) } });
    }
  };
}
