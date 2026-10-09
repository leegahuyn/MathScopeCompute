import { validateComputeJobSpec, validateResultEnvelope } from './contracts.mjs';
import { canonicalStringify, sha256, integer, rational, realInterval } from './values.mjs';
import { kernelRuntime, createKernelWorkerSource } from './worker.mjs';

export const COMPUTE_VERSION = '1.0.0';
export const ADAPTER_VERSION = '1.0.0';
export const COMPUTE_LIMITS = Object.freeze({ maxConcurrent: 2, maxJobs: 32, maxQueued: 32, maxCacheEntries: 8, maxMillis: 60000, maxBytes: 16 * 1024 * 1024, maxItems: 100000, maxOperations: 50000000, maxSerializedInputBytes: 1024 * 1024, primeUpper: '1000000', primeWidth: 20000, matrixDimension: 16, matrixEntryDigits: 512, padicDigits: 255 });
const ADAPTER_IDS = ['prime-segment', 'padic-delta', 'rational-interval', 'integer-matrix-product'];
const TERMINAL = new Set(['COMPLETED', 'CANCELLED', 'FAILED', 'UNSUPPORTED', 'PRECISION_REQUIRED', 'BUDGET_EXCEEDED']);
const clone = value => JSON.parse(canonicalStringify(value));
const byteSize = value => new TextEncoder().encode(typeof value === 'string' ? value : canonicalStringify(value)).length;

export class ComputeError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'ComputeError'; this.code = code; this.details = details; }
}
function requireJob(request) {
  const encoded = canonicalStringify(request);
  if (byteSize(encoded) > COMPUTE_LIMITS.maxSerializedInputBytes) throw new ComputeError('INPUT_LIMIT', 'A compute request is limited to 1 MiB.');
  const report = validateComputeJobSpec(request);
  if (!report.ok) throw new ComputeError('INVALID_COMPUTE_JOB', 'The compute request failed its mathematical scope/precision contract.', { errors: report.errors });
  if (request.adapter.version !== ADAPTER_VERSION) throw new ComputeError('UNSUPPORTED_VERSION', `The local adapters require version ${ADAPTER_VERSION}.`);
  const b = request.budget;
  for (const key of ['maxMillis', 'maxBytes', 'maxItems', 'maxOperations']) {
    if (b[key] !== undefined && (!Number.isSafeInteger(b[key]) || b[key] < 1 || b[key] > COMPUTE_LIMITS[key])) throw new ComputeError('BUDGET_EXCEEDED', `${key} must be a positive integer no greater than ${COMPUTE_LIMITS[key]}.`, { resource: key, requested: b[key], cap: COMPUTE_LIMITS[key] });
  }
  if (b.maxBytes < 16384) throw new ComputeError('BUDGET_EXCEEDED', 'The local runtime requires at least 16 KiB for a result and its provenance metadata.');
  if (!Object.keys(request.domain).length || !Object.keys(request.basis).length) throw new ComputeError('MISSING_CONTEXT', 'The domain and basis/convention objects must explicitly identify the calculation context.');
  return report;
}
export function canonicalComputeInput(request) {
  requireJob(request);
  const { modelRef, adapter, sourceRefs, assumptionRefs, scope, precision, seed, domain, basis, input } = request;
  return clone({ schema: 'MathScope.CanonicalComputeInput/1', modelRef, adapter, sourceRefs, assumptionRefs, scope, precision, seed, domain, basis, input });
}
export async function computeInputHash(request) { return sha256(canonicalComputeInput(request)); }
function contentForHash(result) {
  const { environment, ...mathematicalProvenance } = result.provenance;
  return { inputHash: result.inputHash, status: result.status, scope: result.scope, precision: result.precision, values: result.values, errorLedger: result.errorLedger, provenance: mathematicalProvenance, evidence: result.evidence };
}
const emptyLedger = () => Object.fromEntries(['rounding', 'discretization', 'tail', 'residual', 'stability', 'statistical'].map(k => [k, { status: 'NOT_COMPUTED', reason: 'No completed result is available.' }]));

/** Local bounded queue. The supplied workerFactory is an application integration hook,
 * never an input parameter or a remotely supplied executable. */
export function createComputeEngine(options = {}) {
  const maxConcurrent = options.maxConcurrent ?? 1;
  if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1 || maxConcurrent > COMPUTE_LIMITS.maxConcurrent) throw new ComputeError('INVALID_CONCURRENCY', 'Local concurrency must be 1 or 2.');
  const jobs = new Map(), cache = new Map(), queue = [], listeners = new Set(), waiters = new Map();
  let active = 0, disposed = false, workerURL = null, sequence = 0;
  const workerSource = createKernelWorkerSource();
  const canWorker = typeof options.workerFactory === 'function' || (options.preferWorker !== false && typeof Worker === 'function' && typeof Blob === 'function' && typeof URL.createObjectURL === 'function');
  const executionMode = canWorker ? (options.workerFactory ? 'APPLICATION_WORKER_FACTORY' : 'BROWSER_WEB_WORKER') : 'COOPERATIVE_LOCAL_RUNTIME';
  const ready = (async () => {
    const sourceHash = await sha256(workerSource);
    const environment = {
      schema: 'MathScope.CapabilityManifest/1', module: 'MathScope M0 Local Compute', moduleVersion: COMPUTE_VERSION,
      executionMode, isolation: canWorker ? 'SEPARATE_WORKER' : 'COOPERATIVE_EVENT_LOOP', serverAdapter: false,
      workerAvailability: canWorker ? 'API_PRESENT_STARTUP_VALIDATED_PER_JOB' : 'NO_WORKER_SELECTED',
      executionPathPolicy: 'The selected worker path must start successfully for a result. CSP/worker startup failures are explicit FAILED results; no silent server or CPU fallback occurs.',
      runtime: { language: 'ECMAScript', bigint: typeof BigInt === 'function', webCrypto: Boolean(globalThis.crypto?.subtle), userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null, nodeVersion: typeof process !== 'undefined' && process.versions?.node ? process.versions.node : null },
      limits: clone(COMPUTE_LIMITS), configuredConcurrency: maxConcurrent,
      sourceManifest: [{ id: 'mathscope-m0:static-worker-runtime', version: COMPUTE_VERSION, sha256: sourceHash, availability: 'EMBEDDED_AND_EXPORTABLE', contents: 'Fixed local kernel runtime plus exact-value implementation' }],
      adapters: [
        { id: 'prime-segment', version: ADAPTER_VERSION, status: 'AVAILABLE', arithmetic: 'BIGINT_EXACT', bounds: { lowerMin: '0', upperMax: '1000000', maxIntervalWidth: 20000 }, generator: 'segmented sieve', independentVerifier: 'trial division for every integer in the finite interval' },
        { id: 'padic-delta', version: ADAPTER_VERSION, status: 'AVAILABLE', arithmetic: 'PADIC_BALL', bounds: { pMax: '1000000', outputDigitsMin: 1, outputDigitsMax: 255 }, convention: 'Z_p, phi = identity; one extra input digit required', independentVerifier: 'repeated multiplication for p ≤ 97; reconstruction congruence for all supported p' },
        { id: 'rational-interval', version: ADAPTER_VERSION, status: 'AVAILABLE', arithmetic: 'EXACT_RATIONAL_ENDPOINT_ENCLOSURE', operations: ['add', 'subtract', 'multiply', 'divide'], limitations: 'No transcendental functions, interval quadrature, or requested-width refinement. absoluteBits is recorded as a display/work request; exact rational endpoints incur zero arithmetic rounding.' },
        { id: 'integer-matrix-product', version: ADAPTER_VERSION, status: 'AVAILABLE', arithmetic: 'BIGINT_EXACT', bounds: { maxRows: 16, maxColumns: 16, maxEntryDigits: 512 }, independentVerifier: 'outer-product accumulation, separate from row-dot generator' }
      ],
      unavailable: [
        { id: 'SageMath', status: 'NOT_CONNECTED_IN_THIS_ADAPTER' }, { id: 'FLINT/Arb', status: 'NOT_CONNECTED_IN_THIS_ADAPTER' },
        { id: 'prismatic-complex-general', status: 'UNSUPPORTED', reason: 'No general prismatic cohomology backend is provided by M0.' },
        { id: 'general-G-lattice-ensemble', status: 'UNSUPPORTED', reason: 'No general-group field or lattice sampler is provided by these four adapters.' },
        { id: 'Navier-Stokes-construction', status: 'UNSUPPORTED', reason: 'Paper-profile reconstruction and PDE solvers are later work packages.' },
        { id: 'GPU-computation', status: 'UNSUPPORTED' }, { id: 'statistical-sampler', status: 'UNSUPPORTED', reason: 'The value schema can describe estimates; no MCMC sampler is claimed.' }
      ],
      resourcePolicy: 'Inputs and output sizes have hard finite caps. Workspace estimates are conservative guards, not OS-enforced heap quotas. No GPU budget or external cloud compute is silently selected.'
    };
    return { ...environment, environmentHash: await sha256(environment) };
  })();
  const publicJob = job => clone({ id: job.id, request: job.request, status: job.status, progress: job.progress, inputHash: job.inputHash, environmentHash: job.environment.environmentHash, cacheKey: job.cacheKey, fromCache: job.fromCache, executionMode, submittedAt: job.submittedAt, startedAt: job.startedAt, finishedAt: job.finishedAt, attempt: job.attempt, checkpointAvailable: Boolean(job.checkpoint), checkpointMetrics: job.checkpoint?.metrics ?? null, result: job.result, warnings: job.warnings });
  function notify(job) {
    const view = publicJob(job);
    for (const listener of listeners) { try { listener(view); } catch { /* A UI subscriber cannot change the job. */ } }
    if (TERMINAL.has(job.status)) { for (const resolve of waiters.get(job.id) || []) resolve(view); waiters.delete(job.id); }
  }
  async function resultEnvelope(job, raw) {
    const completed = raw.status === 'COMPLETED';
    const result = {
      schema: 'MathScope.ResultEnvelope/1', jobId: job.id, inputHash: job.inputHash, environmentHash: job.environment.environmentHash,
      cacheKey: job.cacheKey, status: raw.status, scope: clone(job.request.scope), precision: clone(raw.precision || job.request.precision),
      values: completed ? clone(raw.values) : {}, errorLedger: completed ? clone(raw.errorLedger) : emptyLedger(),
      provenance: { modelRef: clone(job.request.modelRef), sourceRefs: clone(job.request.sourceRefs), assumptionRefs: clone(job.request.assumptionRefs), adapter: clone(job.request.adapter), environment: clone(job.environment), seed: job.request.seed, seedSemantics: 'RECORDED_BUT_UNUSED_BY_DETERMINISTIC_ADAPTER', domain: clone(job.request.domain), basis: clone(job.request.basis), verification: raw.verification ? clone(raw.verification) : { status: 'NOT_COMPLETED' } },
      evidence: { grade: completed ? 'CERTIFIED NUMERICAL' : 'UNKNOWN', scopeKind: completed ? raw.scopeKind : 'interface', supportsCurrent: completed, statement: completed ? 'Software-verified finite calculation or exact endpoint/valuation enclosure on the recorded input scope. This receipt is not a Lean kernel proof.' : 'No completed mathematical observation is claimed.', method: completed ? raw.verification.verifier : 'NONE', sourceRefs: clone(job.request.sourceRefs), assumptionRefs: clone(job.request.assumptionRefs), effectiveTrust: completed ? 'LOCAL_SOFTWARE_CHECKS_WITH_DECLARED_FINITE_SCOPE' : 'NONE' }
    };
    if (raw.error) { result.message = raw.error.message; result.details = { code: raw.error.code, ...raw.error.details }; }
    result.contentHash = await sha256(contentForHash(result));
    const report = validateResultEnvelope(result);
    if (!report.ok) throw new ComputeError('INVALID_RESULT_ENVELOPE', 'The generated result failed its evidence contract.', { errors: report.errors });
    return result;
  }
  async function finish(job, raw) {
    try {
      if (raw.checkpoint) job.checkpoint = clone(raw.checkpoint);
      job.result = await resultEnvelope(job, raw);
      if (raw.status === 'COMPLETED' && byteSize(job.result) > job.request.budget.maxBytes) {
        raw = { status: 'BUDGET_EXCEEDED', error: { code: 'BUDGET_EXCEEDED', message: 'The complete result with provenance exceeds the artifact byte budget.', details: { resource: 'maxBytes', required: byteSize(job.result) } } };
        job.result = await resultEnvelope(job, raw);
      }
      job.status = raw.status; job.progress = raw.status === 'COMPLETED' ? 1 : job.progress; job.finishedAt = new Date().toISOString();
      if (raw.status === 'COMPLETED') {
        cache.delete(job.cacheKey); cache.set(job.cacheKey, clone(job.result));
        while (cache.size > COMPUTE_LIMITS.maxCacheEntries) cache.delete(cache.keys().next().value);
      }
    } catch (e) {
      job.status = 'FAILED'; job.finishedAt = new Date().toISOString();
      job.result = await resultEnvelope(job, { status: 'FAILED', error: { code: e.code || 'RESULT_FAILURE', message: e.message, details: e.details || {} } });
    }
    notify(job);
  }
  function executeInWorker(job) {
    return new Promise(resolve => {
      let worker, ended = false, watchdog;
      function close(result) {
        if (ended) return; ended = true; clearTimeout(watchdog);
        worker?.terminate(); job.worker = null; resolve(result);
      }
      try {
        if (options.workerFactory) worker = options.workerFactory(workerSource);
        else { workerURL ||= URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' })); worker = new Worker(workerURL); }
        job.worker = worker;
        worker.onmessage = event => {
          if (event.data.type === 'progress') { job.progress = event.data.progress; job.checkpoint = clone(event.data.checkpoint); notify(job); }
          else if (event.data.type === 'result') close(event.data.result);
        };
        worker.onerror = event => close({ status: 'FAILED', error: { code: 'WORKER_FAILURE', message: String(event.message || 'The worker failed; check content security policy and worker support.'), details: { executionMode } }, checkpoint: job.checkpoint });
        const remaining = Math.max(1, job.request.budget.maxMillis - (job.checkpoint?.metrics?.elapsedMillis || 0));
        watchdog = setTimeout(() => close({ status: 'BUDGET_EXCEEDED', error: { code: 'BUDGET_EXCEEDED', message: 'The worker watchdog reached the elapsed time budget.', details: { resource: 'maxMillis' } }, checkpoint: job.checkpoint }), remaining + 750);
        worker.postMessage({ type: 'start', request: clone(job.request), checkpoint: job.checkpoint ? clone(job.checkpoint) : null });
        if (job.status === 'CANCEL_REQUESTED') worker.postMessage({ type: 'cancel' });
      } catch (e) { close({ status: 'FAILED', error: { code: 'WORKER_UNAVAILABLE', message: String(e.message), details: { executionMode } }, checkpoint: job.checkpoint }); }
    });
  }
  async function run(job) {
    job.status = 'RUNNING'; job.startedAt = new Date().toISOString(); job.attempt++; job.control = { cancelled: false }; notify(job);
    try {
      const raw = canWorker ? await executeInWorker(job) : await kernelRuntime({ request: clone(job.request), checkpoint: job.checkpoint ? clone(job.checkpoint) : null }, update => { job.progress = update.progress; job.checkpoint = clone(update.checkpoint); notify(job); }, job.control);
      await finish(job, raw);
    } catch (e) { await finish(job, { status: 'FAILED', error: { code: e.code || 'QUEUE_FAILURE', message: String(e.message), details: e.details || {} } }); }
    finally { active--; job.worker = null; void pump(); }
  }
  async function pump() {
    await ready;
    if (disposed) return;
    while (active < maxConcurrent && queue.length) {
      const id = queue.shift(), job = jobs.get(id);
      if (!job || job.status !== 'QUEUED') continue;
      active++; void run(job);
    }
  }
  async function submit(request, submitOptions = {}) {
    if (disposed) throw new ComputeError('ENGINE_DISPOSED', 'This compute engine was disposed.');
    const report = requireJob(request);
    // Own the immutable mathematical input before any asynchronous digest step.
    // Caller edits while SHA-256 is pending must not separate its hash from values.
    request = clone(request);
    if (jobs.has(request.id)) throw new ComputeError('DUPLICATE_JOB', 'A job with this ID already exists. Use a fresh job ID for changed mathematical inputs.');
    if (jobs.size >= COMPUTE_LIMITS.maxJobs || queue.length >= COMPUTE_LIMITS.maxQueued) throw new ComputeError('QUEUE_LIMIT', 'The retained job/queue limit was reached. Export and remove completed jobs first.');
    const environment = await ready, inputHash = await computeInputHash(request), cacheKey = await sha256({ inputHash, environmentHash: environment.environmentHash });
    if (jobs.has(request.id)) throw new ComputeError('DUPLICATE_JOB', 'A job with this ID was submitted concurrently.');
    if (jobs.size >= COMPUTE_LIMITS.maxJobs || queue.length >= COMPUTE_LIMITS.maxQueued) throw new ComputeError('QUEUE_LIMIT', 'The retained job/queue limit was reached.');
    const job = { id: request.id, request: clone(request), status: 'QUEUED', progress: 0, inputHash, cacheKey, environment, fromCache: false, submittedAt: new Date().toISOString(), startedAt: null, finishedAt: null, attempt: 0, result: null, checkpoint: null, warnings: report.warnings, worker: null, control: null };
    jobs.set(job.id, job);
    if (submitOptions.useCache !== false && cache.has(cacheKey)) {
      const cached = clone(cache.get(cacheKey));
      if (await sha256(contentForHash(cached)) !== cached.contentHash) { cache.delete(cacheKey); job.warnings.push('Corrupted cache entry discarded.'); }
      else if (byteSize(cached) <= job.request.budget.maxBytes) {
        cached.jobId = job.id; job.result = cached; job.status = 'COMPLETED'; job.progress = 1; job.fromCache = true; job.finishedAt = new Date().toISOString(); notify(job); return publicJob(job);
      }
    }
    queue.push(job.id); notify(job); void pump(); return publicJob(job);
  }
  function lookup(id) { const job = jobs.get(id); if (!job) throw new ComputeError('UNKNOWN_JOB', `Unknown compute job: ${id}`); return job; }
  function cancel(id) {
    const job = lookup(id);
    if (TERMINAL.has(job.status)) return false;
    const wasQueued = job.status === 'QUEUED';
    job.status = 'CANCEL_REQUESTED'; if (job.control) job.control.cancelled = true; job.worker?.postMessage({ type: 'cancel' }); notify(job);
    if (wasQueued) { const i = queue.indexOf(id); if (i >= 0) queue.splice(i, 1); void finish(job, { status: 'CANCELLED', checkpoint: job.checkpoint }); }
    return true;
  }
  async function resume(id, resumeOptions = {}) {
    const job = lookup(id);
    if (!['CANCELLED', 'BUDGET_EXCEEDED'].includes(job.status)) throw new ComputeError('NOT_RESUMABLE', 'Only cancelled or budget-exhausted jobs can resume. A precision change creates a new request.');
    if (disposed) throw new ComputeError('ENGINE_DISPOSED', 'This compute engine was disposed.');
    if (resumeOptions.budget) { const request = { ...job.request, budget: clone(resumeOptions.budget) }; requireJob(request); job.request = request; }
    job.status = 'QUEUED'; job.result = null; job.finishedAt = null; job.fromCache = false;
    queue.push(id); notify(job); void pump(); return publicJob(job);
  }
  async function exportCheckpoint(id) {
    const job = lookup(id);
    const payload = { schema: 'MathScope.CheckpointBundle/1', request: clone(job.request), inputHash: job.inputHash, environmentHash: job.environment.environmentHash, workerSourceHash: job.environment.sourceManifest[0].sha256, checkpoint: job.checkpoint ? clone(job.checkpoint) : null, status: job.status, progress: job.progress };
    return canonicalStringify({ ...payload, bundleHash: await sha256(payload) });
  }
  function parseBundle(text, schema) {
    if (typeof text !== 'string' || byteSize(text) > 8 * 1024 * 1024) throw new ComputeError('BUNDLE_LIMIT', 'An import must be a JSON string no larger than 8 MiB.');
    let parsed; try { parsed = JSON.parse(text); } catch { throw new ComputeError('INVALID_BUNDLE', 'The import is not valid JSON.'); }
    if (parsed.schema !== schema) throw new ComputeError('INVALID_BUNDLE', `Expected ${schema}.`);
    canonicalStringify(parsed); return parsed;
  }
  async function verifyBundleHash(bundle) { const { bundleHash, ...payload } = bundle; if (await sha256(payload) !== bundleHash) throw new ComputeError('BUNDLE_INTEGRITY', 'The exported bundle hash does not match its contents.'); return payload; }
  async function importCheckpoint(text, importOptions = {}) {
    const payload = await verifyBundleHash(parseBundle(text, 'MathScope.CheckpointBundle/1'));
    requireJob(payload.request);
    const environment = await ready;
    if (await computeInputHash(payload.request) !== payload.inputHash) throw new ComputeError('INPUT_HASH_MISMATCH', 'Checkpoint mathematical input hash mismatch.');
    if (payload.workerSourceHash !== environment.sourceManifest[0].sha256) throw new ComputeError('SOURCE_VERSION_MISMATCH', 'The checkpoint requires a different executable kernel source.');
    if (jobs.size >= COMPUTE_LIMITS.maxJobs) throw new ComputeError('QUEUE_LIMIT', 'The retained job limit was reached.');
    const request = clone(payload.request); request.id = importOptions.id || `${request.id}:import${++sequence}`;
    if (jobs.has(request.id)) throw new ComputeError('DUPLICATE_JOB', 'An imported job ID already exists.');
    requireJob(request);
    const cacheKey = await sha256({ inputHash: payload.inputHash, environmentHash: environment.environmentHash });
    const job = { id: request.id, request, status: 'CANCELLED', progress: Number.isFinite(payload.progress) ? Math.min(1, Math.max(0, payload.progress)) : 0, inputHash: payload.inputHash, cacheKey, environment, fromCache: false, submittedAt: new Date().toISOString(), startedAt: null, finishedAt: null, attempt: 0, result: null, checkpoint: payload.checkpoint ? clone(payload.checkpoint) : null, warnings: ['Imported checkpoint prefixes are reverified before reuse; an exported hash is integrity metadata, not an authenticity certificate.'], worker: null, control: null };
    if (job.checkpoint) {
      if (job.checkpoint.schema !== 'MathScope.KernelCheckpoint/1' || !job.checkpoint.metrics || !Number.isSafeInteger(job.checkpoint.metrics.operations) || job.checkpoint.metrics.operations < 0 || !Number.isFinite(job.checkpoint.metrics.elapsedMillis) || job.checkpoint.metrics.elapsedMillis < 0) throw new ComputeError('INVALID_CHECKPOINT', 'Checkpoint metrics or schema are invalid.');
    }
    jobs.set(job.id, job); notify(job); return publicJob(job);
  }
  async function exportBundle(id) {
    const job = lookup(id);
    if (!job.result) throw new ComputeError('RESULT_PENDING', 'Wait for a completed or terminal observation before exporting its bundle.');
    const payload = { schema: 'MathScope.ObservationBundle/1', request: clone(job.request), environment: clone(job.environment), checkpoint: job.checkpoint ? clone(job.checkpoint) : null, result: clone(job.result), sourceBundle: { kind: 'STATIC_ALLOWLISTED_WORKER', sha256: job.environment.sourceManifest[0].sha256, code: workerSource, executionPolicy: 'Imports never execute this text. Replay uses the installed matching source only.' }, verifierLog: [clone(job.result.provenance.verification)], sourceAvailability: clone(job.environment.sourceManifest) };
    return canonicalStringify({ ...payload, bundleHash: await sha256(payload) });
  }
  async function replayBundle(text, replayOptions = {}) {
    const payload = await verifyBundleHash(parseBundle(text, 'MathScope.ObservationBundle/1'));
    const environment = await ready;
    if (!payload.sourceBundle || payload.sourceBundle.sha256 !== await sha256(payload.sourceBundle.code) || payload.sourceBundle.sha256 !== environment.sourceManifest[0].sha256) throw new ComputeError('SOURCE_VERSION_MISMATCH', 'A matching installed allowlisted kernel source is required for replay. Uploaded code is never executed.');
    const report = await isResultFor(payload.request, payload.result);
    if (!report.ok) throw new ComputeError('RESULT_INTEGRITY', 'The source result failed its input/content/evidence checks.', { errors: report.errors });
    const request = clone(payload.request); request.id = replayOptions.id || `${request.id}:replay${++sequence}`;
    if (replayOptions.budget) request.budget = clone(replayOptions.budget);
    const submitted = await submit(request, { useCache: false }), completed = await wait(submitted.id);
    return { job: completed, comparison: { status: completed.status === 'COMPLETED' && completed.result.contentHash === payload.result.contentHash ? 'MATCH' : 'MISMATCH', mathematicalContentMatched: completed.result?.contentHash === payload.result.contentHash, originalEnvironmentHash: payload.result.environmentHash, currentEnvironmentHash: environment.environmentHash, originalGrade: payload.result.evidence.grade, importedEvidenceTrusted: false, replayUsesInstalledSources: true } };
  }
  function wait(id) { const job = lookup(id); if (TERMINAL.has(job.status)) return Promise.resolve(publicJob(job)); return new Promise(resolve => { const list = waiters.get(id) || []; list.push(resolve); waiters.set(id, list); }); }
  return {
    submit, cancel, resume, wait, exportCheckpoint, importCheckpoint, exportBundle, replayBundle,
    getJob: id => publicJob(lookup(id)), listJobs: () => [...jobs.values()].map(publicJob), capabilities: async () => clone(await ready),
    subscribe(fn) { if (typeof fn !== 'function') throw new ComputeError('INVALID_SUBSCRIBER', 'A subscriber must be a function.'); listeners.add(fn); return () => listeners.delete(fn); },
    cacheInfo: () => ({ entries: cache.size, keys: [...cache.keys()], maxEntries: COMPUTE_LIMITS.maxCacheEntries }),
    clearCache() { cache.clear(); },
    removeJob(id) { const job = lookup(id); if (!TERMINAL.has(job.status)) throw new ComputeError('JOB_ACTIVE', 'Cancel and wait for the job before removing it.'); jobs.delete(id); },
    dispose() { disposed = true; for (const job of jobs.values()) if (!TERMINAL.has(job.status)) cancel(job.id); if (workerURL) { URL.revokeObjectURL(workerURL); workerURL = null; } listeners.clear(); }
  };
}

export async function isResultFor(request, result) {
  const report = validateResultEnvelope(result);
  if (!report.ok) return { ok: false, errors: report.errors };
  const expectedInput = await computeInputHash(request);
  const errors = [];
  if (expectedInput !== result.inputHash) errors.push('The result belongs to a different mathematical input, source, assumptions, precision, seed, domain, or basis.');
  for (const key of ['modelRef', 'sourceRefs', 'assumptionRefs', 'adapter', 'seed', 'domain', 'basis']) if (!Object.hasOwn(result.provenance, key) || canonicalStringify(request[key]) !== canonicalStringify(result.provenance[key])) errors.push(`Result provenance does not match request ${key}.`);
  if (canonicalStringify(request.scope) !== canonicalStringify(result.scope) || canonicalStringify(request.precision) !== canonicalStringify(result.precision)) errors.push('Result scope or precision does not match the request.');
  if (await sha256(contentForHash(result)) !== result.contentHash) errors.push('The result content hash is invalid.');
  return { ok: errors.length === 0, errors };
}

export async function verifyResult(request, result) {
  const integrity = await isResultFor(request, result);
  if (!integrity.ok) return integrity;
  if (result.status !== 'COMPLETED') return { ok: false, errors: ['There is no completed result to verify.'] };
  const engine = createComputeEngine({ preferWorker: false });
  try {
    const job = await engine.submit({ ...clone(request), id: 'verification:finite-result' }, { useCache: false });
    const replayed = await engine.wait(job.id);
    return { ok: replayed.status === 'COMPLETED' && replayed.result.contentHash === result.contentHash, errors: replayed.status === 'COMPLETED' && replayed.result.contentHash === result.contentHash ? [] : ['Fresh finite recomputation did not match.'], verification: replayed.result?.provenance.verification };
  } finally { engine.dispose(); }
}

export async function createExampleJob(adapterId = 'prime-segment') {
  if (!ADAPTER_IDS.includes(adapterId)) throw new ComputeError('UNSUPPORTED', `No example for ${adapterId}.`);
  const sourceHash = await sha256(createKernelWorkerSource());
  const examples = {
    'prime-segment': { scope: { kind: 'FINITE', primeInterval: { lower: '2', upper: '1000' } }, precision: { kind: 'EXACT' }, domain: { kind: 'INTEGER_INTERVAL', convention: 'both endpoints included' }, basis: { kind: 'CANONICAL_INTEGER_ORDER' }, input: { lower: '2', upper: '1000' } },
    'padic-delta': { scope: { kind: 'FINITE', pAdic: { p: '5', digits: 3 } }, precision: { kind: 'PADIC', p: '5', digits: 3, guardDigits: 1 }, domain: { ring: 'Z_5', frobeniusLift: 'identity' }, basis: { kind: 'STANDARD_RESIDUE' }, input: { p: '5', a: { kind: 'PADIC_BALL', p: '5', residue: '7', digits: 4 }, outputDigits: 3 } },
    'rational-interval': { scope: { kind: 'FINITE', finite: { description: 'One binary operation on two exact rational intervals', itemCount: 6 } }, precision: { kind: 'REAL_INTERVAL', workingBits: 64, description: 'Exact rational endpoints; zero arithmetic rounding. This does not assert an enclosure-width target.' }, domain: { operation: 'real interval multiplication', endpoints: 'exact rationals' }, basis: { kind: 'REAL_ORDER' }, input: { operation: 'multiply', a: realInterval(rational('1', '3'), rational('1', '2')), b: realInterval(rational('-2'), rational('3')) } },
    'integer-matrix-product': { scope: { kind: 'FINITE', finite: { description: 'Integer matrices D0 (5×4), D1 (3×5), D1 D0 (3×4)', itemCount: 47 } }, precision: { kind: 'EXACT' }, domain: { ring: 'Z', operation: 'D1 times D0', fixtureMeaning: 'Finite matrices from the P1 comparison design; their product being zero does not by itself certify the whole prismatic comparison.' }, basis: { kind: 'ORDERED_EXPLICIT_BASES', C0: ['1_U0', 't', '1_U1', 's'], C1: ['dt', 'ds', 't^-1', '1', 't'], C2: ['t^-2 dt', 't^-1 dt', 'dt'] }, input: { A: [[0,-1,1,0,0],[0,0,0,0,0],[-1,0,0,0,-1]].map(row => row.map(String)), B: [[0,1,0,0],[0,0,0,1],[0,0,0,1],[-1,0,1,0],[0,-1,0,0]].map(row => row.map(String)) } }
  };
  const example = examples[adapterId];
  const modelHash = await sha256({ fixture: adapterId, ...example });
  return { schema: 'MathScope.ComputeJobSpec/1', id: `m0-example:${adapterId}`, modelRef: { id: `m0-fixture:${adapterId}`, revision: '1', hash: modelHash }, adapter: { id: adapterId, version: ADAPTER_VERSION }, sourceRefs: [{ id: 'mathscope-m0:static-worker-runtime', revision: COMPUTE_VERSION, hash: sourceHash }], assumptionRefs: [], ...clone(example), seed: '0', budget: { maxMillis: 15000, maxBytes: 4 * 1024 * 1024, maxItems: 20000, maxOperations: 20000000 } };
}
export async function getExampleJobs() { return Promise.all(ADAPTER_IDS.map(createExampleJob)); }
