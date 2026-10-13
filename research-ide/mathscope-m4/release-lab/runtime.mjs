/** Owns isolated release jobs; serialized records are always re-executed. */
export function createReleaseLab({ catalog, factories, normalizers = {}, onChange = () => {}, maxJobs = 24, maxRetainedResultBytes = 32 * 1024 * 1024 }) {
  const clone = x => JSON.parse(JSON.stringify(x));
  const canonical = x => JSON.stringify(x, function (key, value) { return value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.keys(value).sort().map(k => [k, value[k]])) : value; });
  const cases = new Map(catalog.map(item => [item.id, { item: clone(item), request: clone(item.request), revision: 0, jobs: [] }]));
  if (!Number.isSafeInteger(maxJobs) || maxJobs < 1 || maxJobs > 64 || !Number.isSafeInteger(maxRetainedResultBytes) || maxRetainedResultBytes < 32768 || maxRetainedResultBytes > 64 * 1024 * 1024) throw Error('RETENTION_BUDGET_INVALID');
  let active = null, sequence = 0, disposed = false;
  const byteLength = x => new TextEncoder().encode(JSON.stringify(x)).byteLength;
  const retainedJobs = () => [...cases.values()].flatMap(c => c.jobs);
  const ensureCapacity = () => { if (disposed) throw Error('LAB_DISPOSED'); if (retainedJobs().length >= maxJobs) throw Error('RETENTION_BUDGET_EXPORT_REQUIRED'); };
  const normalized = (c, request) => (normalizers[c.item.engine] || clone)(clone(request));
  const validateRequest = (c, request) => {
    if (!request || typeof request !== 'object' || Array.isArray(request)) throw Error('INPUT_OBJECT_REQUIRED');
    if (request.kind !== c.item.request.kind) throw Error('FIXTURE_KIND_MISMATCH');
    if (byteLength(request) > 262144) throw Error('INPUT_BUDGET');
    normalized(c, request); return clone(request);
  };
  const retainResult = (j, result) => {
    const bytes = byteLength(result.result);
    if (retainedJobs().reduce((total, row) => total + (row.retainedBytes || 0), 0) + bytes > maxRetainedResultBytes) {
      j.state = 'BUDGET_EXCEEDED'; j.error = 'RETENTION_RESULT_BUDGET'; j.result = null; j.retainedBytes = 0;
      j.engine.dispose(); j.engine = null; return;
    }
    j.state = result.status; j.result = result.result; j.resultHash = result.mathematicalHash; j.retainedBytes = bytes;
  };
  const state = id => { const c = cases.get(id); if (!c) throw Error('UNKNOWN_FIXTURE'); return c; };
  const notify = () => onChange();
  const current = j => state(j.fixtureId).revision === j.revision;
  const view = j => ({ ...clone({ ...j, engine: undefined }), stale: !current(j), formalPass: false });
  const summary = j => ({ id: j.id, fixtureId: j.fixtureId, state: j.state, stale: !current(j), hasResult: Boolean(j.result), inputHash: j.inputHash, resultHash: j.resultHash, workerSHA256: j.workerSHA256, retainedBytes: j.retainedBytes || 0, formalPass: false });
  function update(id, request) {
    const c = state(id);
    request = validateRequest(c, request);
    if (canonical(c.request) === canonical(request)) return [];
    c.request = clone(request); c.revision++; notify();
    return c.jobs.map(j => j.id);
  }
  async function run(id, { originalRequest = null, originalRevision = null } = {}) {
    ensureCapacity();
    if (active) throw Error('JOB_ALREADY_RUNNING');
    const c = state(id), factory = factories[c.item.engine];
    if (typeof factory !== 'function') throw Error('INSTALLED_WORKER_UNAVAILABLE');
    const request = validateRequest(c, originalRequest || c.request), revision = originalRevision ?? c.revision;
    const engine = factory();
    const j = { id: 'r1-' + (++sequence), fixtureId: id, revision, request, engine, state: 'STARTING', result: null, resultHash: null, inputHash: null, workerSHA256: null, environmentHash: null, elapsedMs: null, formalPass: false };
    c.jobs.push(j); active = j; notify();
    const started = performance.now();
    try {
      const environment = await engine.environment();
      j.workerSHA256 = environment.workerSha256;
      j.environmentHash = environment.hash;
      const queued = await engine.submit(request);
      j.engineJobId = queued.id; j.inputHash = queued.inputHash; j.state = queued.status;
      if (j.cancelRequested) engine.cancel(queued.id);
      notify();
      const result = await engine.wait(queued.id);
      retainResult(j, result);
      j.elapsedMs = performance.now() - started;
      return view(j);
    } catch (e) {
      j.state = 'FAILED'; j.error = String(e.message); engine.dispose(); j.engine = null; throw e;
    } finally { active = null; notify(); }
  }
  const find = id => {
    for (const c of cases.values()) { const j = c.jobs.find(j => j.id === id); if (j) return j; }
    throw Error('UNKNOWN_JOB');
  };
  async function exportRecord(id) {
    const j = find(id);
    if (!current(j)) throw Error('STALE_INPUT');
    if (!j.result || ['CANCELLED', 'FAILED', 'BUDGET_EXCEEDED'].includes(j.state)) throw Error('COMPLETED_RESULT_REQUIRED');
    const revision = state(j.fixtureId).revision, bundle = await j.engine.exportBundle(j.engineJobId);
    if (!current(j) || state(j.fixtureId).revision !== revision) throw Error('STALE_INPUT');
    return { schema: 'MathScope.R1.ReleaseReplay/1', fixtureId: j.fixtureId, bundle, trust: 'RECOMPUTE_REQUIRED', formalPass: false };
  }
  async function replay(record) {
    ensureCapacity();
    if (active) throw Error('JOB_ALREADY_RUNNING');
    if (!record || record.schema !== 'MathScope.R1.ReleaseReplay/1' || record.formalPass !== false || record.trust !== 'RECOMPUTE_REQUIRED') throw Error('REPLAY_SCHEMA_OR_TRUST_REJECTED');
    if (JSON.stringify(record).length > 9 * 1024 * 1024) throw Error('IMPORT_BUDGET');
    const c = state(record.fixtureId), revision = c.revision, expected = canonical(normalized(c, c.request));
    validateRequest(c, record.bundle?.request);
    const engine = factories[c.item.engine](), controller = new AbortController();
    const marker = { engine, state: 'REPLAYING', controller }; active = marker;
    const unsubscribe = engine.subscribe?.(job => { marker.engineJobId = job.id; if (marker.cancelRequested && ['QUEUED', 'RUNNING'].includes(job.status)) engine.cancel(job.id); });
    notify();
    try {
      let report = await engine.replay(record.bundle, { signal: controller.signal, onSubmitted: queued => { marker.engineJobId = queued.id; if (marker.cancelRequested) engine.cancel(queued.id); } });
      const fresh = engine.getJob(report.freshJobId);
      if (fresh.status === 'CANCELLED') report = { ...report, status: 'CANCELLED' };
      const j = { id: 'r1-' + (++sequence), fixtureId: c.item.id, revision, request: fresh.request, engine, engineJobId: fresh.id, state: fresh.status, result: null, resultHash: fresh.mathematicalHash, inputHash: fresh.inputHash, environmentHash: fresh.environmentHash, workerSHA256: (await engine.environment()).workerSha256, replay: report, formalPass: false };
      // Imported input may be a different valid request. It is inspectable, never attached to current input.
      j.revision = c.revision === revision && canonical(normalized(c, c.request)) === expected && canonical(fresh.request) === expected ? revision : -1;
      retainResult(j, fresh);
      c.jobs.push(j); return { job: view(j), report };
    } catch (e) { engine.dispose(); throw e; }
    finally { unsubscribe?.(); active = null; notify(); }
  }
  return Object.freeze({
    run, update, replay, exportRecord,
    request: id => clone(state(id).request),
    jobs: id => state(id).jobs.map(view),
    job: id => view(find(id)),
    jobSummaries: id => state(id).jobs.map(summary),
    jobSummary: id => summary(find(id)),
    busy: () => Boolean(active),
    cancel: () => { if (!active) return false; active.cancelRequested = true; active.controller?.abort(); if (active.engineJobId) active.engine.cancel(active.engineJobId); else for (const j of active.engine.listJobs()) if (['QUEUED','RUNNING'].includes(j.status)) active.engine.cancel(j.id); notify(); return true; },
    resume: id => { const j = find(id); if (!['CANCELLED', 'FAILED', 'BUDGET_EXCEEDED'].includes(j.state)) throw Error('INTERRUPTED_JOB_REQUIRED'); return run(j.fixtureId, {originalRequest:j.request,originalRevision:j.revision}); },
    dispose: () => { disposed = true; active?.controller?.abort(); active?.engine?.dispose(); for (const c of cases.values()) { c.jobs.forEach(j => j.engine?.dispose()); c.jobs.length = 0; } }
  });
}
