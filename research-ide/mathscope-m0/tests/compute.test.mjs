import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker as NodeWorker } from 'node:worker_threads';
import { createComputeEngine, createExampleJob, getExampleJobs, computeInputHash, isResultFor, verifyResult } from '../compute.mjs';
import { integer, rational, finiteField, finiteFieldAdd, finiteFieldMul, finiteFieldDivide, padicBall, padicMul, padicUnitDivide, realInterval, complexInterval, intervalMul, intervalDiv, float64, statisticalEstimate, formatValue, canonicalStringify, sha256 } from '../values.mjs';
import { validateComputeJobSpec, validateResultEnvelope } from '../contracts.mjs';

const clone = x => JSON.parse(JSON.stringify(x));
async function complete(engine, request) { const submitted = await engine.submit(request); return engine.wait(submitted.id); }
function workerFactory(source) {
  // Executes only the implementation's static worker source, never request-provided code.
  const bootstrap = `const {parentPort}=require('node:worker_threads');global.self={postMessage:m=>parentPort.postMessage(m)};parentPort.on('message',m=>self.onmessage({data:m}));\n${source}`;
  const worker = new NodeWorker(bootstrap, { eval: true });
  const adapter = { onmessage: null, onerror: null, postMessage: m => worker.postMessage(m), terminate: () => worker.terminate() };
  worker.on('message', m => adapter.onmessage?.({ data: m }));
  worker.on('error', e => adapter.onerror?.({ message: e.message }));
  return adapter;
}

test('exact values preserve large integers and field/quotient distinctions', () => {
  assert.equal(integer('9007199254740993123456789').value, '9007199254740993123456789');
  assert.throws(() => integer(9007199254740992), { code: 'INVALID_EXACT_INTEGER' });
  assert.deepEqual(rational('-4', '-6'), { kind: 'RATIONAL', numerator: '2', denominator: '3' });
  assert.equal(finiteFieldAdd(finiteField('7', '6'), finiteField('7', '3')).residue, '2');
  assert.equal(finiteFieldMul(finiteField('7', '6'), finiteField('7', '3')).residue, '4');
  assert.equal(finiteFieldDivide(finiteField('7', '6'), finiteField('7', '3')).residue, '2');
  assert.throws(() => finiteField('9', '2'), { code: 'INVALID_PRIME' });
  assert.throws(() => finiteFieldDivide(finiteField('7', '1'), finiteField('7', '0')), { code: 'DIVISION_BY_ZERO' });
  assert.throws(() => padicUnitDivide(padicBall('5', '10', 4), padicBall('5', '5', 4)), { code: 'NONUNIT_DIVISION' });
  assert.equal(padicUnitDivide(padicBall('5', '10', 4), padicBall('5', '2', 3)).residue, '5');
  assert.equal(padicMul(padicBall('5', '5', 3), padicBall('5', '25', 4)).digits, 5);
});

test('rational enclosures and statistical estimates have different immutable meanings', () => {
  const a = realInterval(rational('1', '3'), rational('1', '2')), b = realInterval('-2', '3');
  assert.deepEqual(intervalMul(a, b), realInterval('-1', '3/2'));
  assert.throws(() => intervalDiv(a, b), { code: 'INTERVAL_CONTAINS_ZERO' });
  const z = complexInterval(a, b); assert.equal(z.certification, 'EXACT_RATIONAL_RECTANGLE');
  const estimate = statisticalEstimate({ estimate: 1, standardError: 0.1, sampleCount: 100, effectiveSampleSize: 20, confidence: 0.95, interval: [0.8, 1.2], method: 'illustrative supplied estimate', dependence: 'correlated sample, effective sample size supplied' });
  assert.equal(estimate.certified, false);
  assert.match(estimate.interpretation, /NOT_DETERMINISTIC/);
  assert.throws(() => intervalMul(a, estimate), { code: 'INVALID_INTERVAL' });
  const original = JSON.stringify(estimate); formatValue(estimate, 3); assert.equal(JSON.stringify(estimate), original);
  assert.throws(() => float64(Infinity), { code: 'NONFINITE_VALUE' });
  assert.equal(JSON.parse(canonicalStringify(float64(1e100))).value, 1e100, 'an explicitly numerical FLOAT64 can serialize a large finite approximate value');
});

test('canonical JSON rejects silent loss and hashes every required context dimension', async () => {
  assert.equal(canonicalStringify({ b: 2, a: [1, '2'] }), canonicalStringify({ a: [1, '2'], b: 2 }));
  for (const bad of [NaN, Infinity, 5n, undefined, [1, , 2], { a: undefined }]) assert.throws(() => canonicalStringify(bad));
  const request = await createExampleJob('prime-segment'), original = await computeInputHash(request);
  const mutations = [
    r => { r.modelRef.hash = 'a'.repeat(64); }, r => { r.sourceRefs[0].hash = 'b'.repeat(64); },
    r => { r.assumptionRefs = [{ id: 'assumption:changed', revision: '1', hash: 'c'.repeat(64) }]; },
    r => { r.precision.description = 'changed precision policy'; }, r => { r.seed = '7'; },
    r => { r.domain.convention = 'changed'; }, r => { r.basis.kind = 'changed'; },
    r => { r.input.upper = '999'; r.scope.primeInterval.upper = '999'; }
  ];
  for (const mutate of mutations) { const changed = clone(request); mutate(changed); assert.notEqual(await computeInputHash(changed), original); }
  const sameMath = clone(request); sameMath.id = 'another:invocation'; sameMath.budget.maxMillis = 20000;
  assert.equal(await computeInputHash(sameMath), original, 'invocation ID and resource budget do not change mathematical input identity');
});

test('all four fixtures run with validated envelopes and separate verification algorithms', async () => {
  const engine = createComputeEngine({ preferWorker: false });
  try {
    const jobs = await getExampleJobs();
    for (const request of jobs) {
      assert.equal(validateComputeJobSpec(request).ok, true);
      const job = await complete(engine, request);
      assert.equal(job.status, 'COMPLETED', JSON.stringify(job.result));
      assert.equal(validateResultEnvelope(job.result).ok, true);
      assert.equal(job.result.evidence.grade, 'CERTIFIED NUMERICAL');
      assert.notEqual(job.result.provenance.verification.generator, job.result.provenance.verification.verifier);
      assert.equal(job.result.errorLedger.residual.status, 'NOT_COMPUTED');
      assert.equal(job.result.errorLedger.stability.status, 'NOT_PROVIDED');
    }
    assert.equal(engine.getJob(jobs[0].id).result.values.count.value, '168');
    assert.equal(engine.getJob(jobs[0].id).result.values.coverage.infinitePrimeSetComplete, false);
    assert.equal(engine.getJob(jobs[1].id).result.values.delta.residue, '15');
    assert.deepEqual(engine.getJob(jobs[2].id).result.values.result, realInterval('-1', '3/2'));
    assert.ok(engine.getJob(jobs[3].id).result.values.product.flat().every(x => x.value === '0'));
    const large = await createExampleJob('integer-matrix-product'); large.id += ':large'; large.input = { A: [['9007199254740993','2']], B: [['3'],['4']] }; large.scope.finite.itemCount = 5;
    const largeJob = await complete(engine, large); assert.equal(largeJob.status, 'COMPLETED'); assert.equal(largeJob.result.values.product[0][0].value, '27021597764222987');
    assert.equal((await engine.capabilities()).unavailable.find(x => x.id === 'prismatic-complex-general').status, 'UNSUPPORTED');
  } finally { engine.dispose(); }
});

test('real worker executes the same source with actual message-driven progress', async () => {
  const engine = createComputeEngine({ workerFactory });
  let updates = 0; engine.subscribe(job => { if (job.status === 'RUNNING' && job.progress > 0) updates++; });
  try {
    const job = await complete(engine, await createExampleJob('prime-segment'));
    assert.equal(job.status, 'COMPLETED'); assert.equal(job.result.values.count.value, '168');
    assert.ok(updates > 0); assert.equal(job.executionMode, 'APPLICATION_WORKER_FACTORY');
    assert.equal((await engine.capabilities()).isolation, 'SEPARATE_WORKER');
  } finally { engine.dispose(); }
});

test('missing finite scope, invalid budgets and unsafe exact integers are rejected before running', async () => {
  const engine = createComputeEngine({ preferWorker: false });
  try {
    const request = await createExampleJob(); delete request.scope;
    await assert.rejects(engine.submit(request), { code: 'INVALID_COMPUTE_JOB' });
    const unbounded = await createExampleJob(); unbounded.scope = { kind: 'FINITE' };
    await assert.rejects(engine.submit(unbounded), { code: 'INVALID_COMPUTE_JOB' });
    const tooMuch = await createExampleJob(); tooMuch.budget.maxBytes = 10 ** 10;
    await assert.rejects(engine.submit(tooMuch), { code: 'BUDGET_EXCEEDED' });
    const noBasis = await createExampleJob(); noBasis.basis = {};
    await assert.rejects(engine.submit(noBasis), { code: 'MISSING_CONTEXT' });
    const unsafe = await createExampleJob('integer-matrix-product'); unsafe.input.A[0][0] = 9007199254740992;
    await assert.rejects(engine.submit(unsafe));
    assert.equal(engine.listJobs().length, 0);
  } finally { engine.dispose(); }
});

test('p-adic precision loss requests the extra digit and exact lifts refine only when available', async () => {
  const engine = createComputeEngine({ preferWorker: false });
  try {
    const request = await createExampleJob('padic-delta'); request.input.a.digits = 3;
    const failure = await complete(engine, request);
    assert.equal(failure.status, 'PRECISION_REQUIRED'); assert.equal(failure.result.details.requiredInputDigits, 4);
    assert.equal(failure.result.evidence.supportsCurrent, false);
    const refined = clone(request); refined.id += ':refined'; refined.input.exactLift = integer('7');
    const success = await complete(engine, refined);
    assert.equal(success.status, 'COMPLETED'); assert.equal(success.result.values.precisionPropagation.autoRefined, true);
    assert.equal(success.result.values.precisionPropagation.exactLiftNarrowsOriginalBall, true);
    assert.equal(success.result.values.delta.residue, '15');
    const falseLift = clone(refined); falseLift.id += ':bad'; falseLift.input.exactLift = integer('8');
    const rejected = await complete(engine, falseLift);
    assert.equal(rejected.status, 'FAILED'); assert.equal(rejected.result.details.code, 'INCONSISTENT_EXACT_LIFT');
    const mismatch = await createExampleJob('padic-delta'); mismatch.id += ':base-mismatch'; mismatch.precision.p = '7';
    const mismatchResult = await complete(engine, mismatch); assert.equal(mismatchResult.status, 'FAILED'); assert.equal(mismatchResult.result.details.code, 'SCOPE_MISMATCH');
    const otherLift = clone(request); otherLift.id += ':other-lift'; otherLift.input.a = integer('132');
    const different = await complete(engine, otherLift);
    assert.equal(different.status, 'COMPLETED'); assert.notEqual(different.result.values.delta.residue, '15', 'same residue modulo 5^3 need not give the same delta modulo 5^3');
  } finally { engine.dispose(); }
});

test('cache respects source/precision/assumption changes and immutable result scope', async () => {
  const engine = createComputeEngine({ preferWorker: false });
  try {
    const r = await createExampleJob(), first = await complete(engine, r);
    const copy = clone(r); copy.id += ':copy';
    const hit = await complete(engine, copy);
    assert.equal(hit.fromCache, true); assert.equal(hit.result.contentHash, first.result.contentHash);
    const changed = clone(r); changed.id += ':changed'; changed.sourceRefs[0].hash = await sha256('changed source');
    const miss = await complete(engine, changed); assert.equal(miss.fromCache, false); assert.notEqual(miss.cacheKey, first.cacheKey);
    assert.equal((await isResultFor(changed, first.result)).ok, false);
    const forged = clone(first.result); forged.provenance.sourceRefs[0].hash = 'c'.repeat(64);
    assert.equal((await isResultFor(r, forged)).ok, false);
    const snapshot = engine.getJob(first.id); snapshot.result.values.count.value = '999';
    assert.equal(engine.getJob(first.id).result.values.count.value, '168');
    const racing = clone(r); racing.id += ':owned-input';
    const pending = engine.submit(racing); racing.input.upper = '7'; racing.scope.primeInterval.upper = '7';
    const owned = await pending, ownedFinished = await engine.wait(owned.id);
    assert.equal(ownedFinished.request.input.upper, '1000'); assert.equal(ownedFinished.result.values.count.value, '168', 'Caller edits during async submit cannot change the owned request');
  } finally { engine.dispose(); }
});

test('cancel → checkpoint → fresh engine resume reproduces the exact finite result', async () => {
  const engine = createComputeEngine({ workerFactory }), resumedEngine = createComputeEngine({ workerFactory }), baselineEngine = createComputeEngine({ workerFactory });
  try {
    const request = await createExampleJob(); request.id = 'cancel:prime'; request.input.upper = '12000'; request.scope.primeInterval.upper = '12000';
    let cancelled = false;
    engine.subscribe(job => { if (!cancelled && job.id === request.id && job.status === 'RUNNING' && job.progress > 0 && job.progress < 1) { cancelled = true; engine.cancel(job.id); } });
    const submitted = await engine.submit(request), stopped = await engine.wait(submitted.id);
    assert.equal(stopped.status, 'CANCELLED'); assert.ok(stopped.checkpointAvailable);
    const checkpoint = await engine.exportCheckpoint(stopped.id);
    const imported = await resumedEngine.importCheckpoint(checkpoint); await resumedEngine.resume(imported.id);
    const resumed = await resumedEngine.wait(imported.id), baseline = await complete(baselineEngine, request);
    assert.equal(resumed.status, 'COMPLETED'); assert.equal(baseline.status, 'COMPLETED');
    assert.equal(resumed.result.contentHash, baseline.result.contentHash);
    assert.equal(canonicalStringify(resumed.result.values), canonicalStringify(baseline.result.values));
  } finally { engine.dispose(); resumedEngine.dispose(); baselineEngine.dispose(); }
});

test('operation exhaustion keeps a valid checkpoint and can resume within increased caps', async () => {
  const engine = createComputeEngine({ preferWorker: false });
  try {
    const request = await createExampleJob(); request.budget.maxOperations = 50;
    const stopped = await complete(engine, request); assert.equal(stopped.status, 'BUDGET_EXCEEDED'); assert.ok(stopped.checkpointAvailable);
    await engine.resume(stopped.id, { budget: { ...request.budget, maxOperations: 1000000 } });
    const completeJob = await engine.wait(stopped.id);
    assert.equal(completeJob.status, 'COMPLETED'); assert.equal(completeJob.result.values.count.value, '168');
  } finally { engine.dispose(); }
});

test('tampered checkpoint integrity or forged completed prefix cannot become a result', async () => {
  const engine = createComputeEngine({ preferWorker: false }), fresh = createComputeEngine({ preferWorker: false });
  try {
    const job = await complete(engine, await createExampleJob());
    const original = JSON.parse(await engine.exportCheckpoint(job.id));
    const corrupted = clone(original); corrupted.checkpoint.state.primes[0] = '4';
    await assert.rejects(fresh.importCheckpoint(JSON.stringify(corrupted)), { code: 'BUNDLE_INTEGRITY' });
    const { bundleHash, ...payload } = corrupted; corrupted.bundleHash = await sha256(payload);
    const imported = await fresh.importCheckpoint(JSON.stringify(corrupted)); await fresh.resume(imported.id);
    const rejected = await fresh.wait(imported.id);
    assert.equal(rejected.status, 'FAILED'); assert.equal(rejected.result.details.code, 'INVALID_CHECKPOINT');
  } finally { engine.dispose(); fresh.dispose(); }
});

test('observation bundle replays in a fresh session and never executes supplied sources', async () => {
  const engine = createComputeEngine({ preferWorker: false }), fresh = createComputeEngine({ preferWorker: false });
  try {
    const request = await createExampleJob('integer-matrix-product'), job = await complete(engine, request);
    const text = await engine.exportBundle(job.id), replay = await fresh.replayBundle(text);
    assert.equal(replay.comparison.status, 'MATCH'); assert.equal(replay.comparison.importedEvidenceTrusted, false);
    const bad = JSON.parse(text); bad.sourceBundle.code += '\nthrow new Error("injected");'; bad.sourceBundle.sha256 = await sha256(bad.sourceBundle.code);
    const { bundleHash, ...payload } = bad; bad.bundleHash = await sha256(payload);
    await assert.rejects(fresh.replayBundle(JSON.stringify(bad)), { code: 'SOURCE_VERSION_MISMATCH' });
    const verify = await verifyResult(request, job.result); assert.equal(verify.ok, true);
    const changed = clone(job.result); changed.values.product[0][0].value = '1'; assert.equal((await isResultFor(request, changed)).ok, false);
  } finally { engine.dispose(); fresh.dispose(); }
});

test('unsupported adapter and input caps return explicit bounded failure', async () => {
  const engine = createComputeEngine({ preferWorker: false });
  try {
    const unsupported = await createExampleJob(); unsupported.adapter.id = 'prismatic-complex-general'; unsupported.id = 'unsupported:prism';
    const result = await complete(engine, unsupported); assert.equal(result.status, 'UNSUPPORTED'); assert.equal(result.result.evidence.grade, 'UNKNOWN');
    const huge = await createExampleJob(); huge.id = 'unsupported:huge'; huge.input.upper = '9007199254740993123456789'; huge.scope.primeInterval.upper = huge.input.upper;
    assert.equal((await complete(engine, huge)).status, 'UNSUPPORTED');
    const insufficient = await createExampleJob(); insufficient.id = 'budget:items'; insufficient.budget.maxItems = 100;
    assert.equal((await complete(engine, insufficient)).status, 'BUDGET_EXCEEDED');
  } finally { engine.dispose(); }
});

test('queue has bounded concurrency and concurrent duplicate IDs cannot overwrite jobs', async () => {
  const engine = createComputeEngine({ preferWorker: false, maxConcurrent: 1 });
  let maxRunning = 0;
  engine.subscribe(() => { maxRunning = Math.max(maxRunning, engine.listJobs().filter(j => j.startedAt !== null && ['RUNNING','CANCEL_REQUESTED'].includes(j.status)).length); });
  try {
    const r = await createExampleJob(); r.input.upper = '5000'; r.scope.primeInterval.upper = '5000';
    const results = await Promise.allSettled([engine.submit(r), engine.submit(clone(r))]);
    assert.equal(results.filter(x => x.status === 'fulfilled').length, 1);
    assert.equal(results.filter(x => x.status === 'rejected')[0].reason.code, 'DUPLICATE_JOB');
    const second = clone(r); second.id += ':queued'; await engine.submit(second); engine.cancel(second.id);
    assert.equal((await engine.wait(second.id)).status, 'CANCELLED');
    assert.equal((await engine.wait(r.id)).status, 'COMPLETED'); assert.equal(maxRunning, 1);
  } finally { engine.dispose(); }
});
