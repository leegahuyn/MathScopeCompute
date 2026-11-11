import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [repoArg, output] = process.argv.slice(2);
assert(repoArg && output, 'Usage: node r1_session.mjs SOURCE_CHECKOUT OUTPUT');
const repo = resolve(repoArg);
const pin = '9595b4de5a1065b694d225c0ad2a14d5aa4435a9';
const sha = data => createHash('sha256').update(data).digest('hex');
const source = new Map();
const hook = registerHooks({
  load(url, context, nextLoad) {
    const loaded = nextLoad(url, context);
    if (url.startsWith('file:') && loaded.format === 'module') {
      const path = relative(repo, fileURLToPath(url)).replaceAll('\\', '/');
      if (!isAbsolute(path) && !path.startsWith('../')) source.set(path, Buffer.from(loaded.source));
    }
    return loaded;
  },
});
const fromRepo = path => import(pathToFileURL(resolve(repo, path)).href);
const labPath = 'research-ide/mathscope-m4/release-lab/';
const { createReleaseLab } = await fromRepo(labPath + 'runtime.mjs');
const { readCatalog, nativeWorkerFactory } = await fromRepo(labPath + 'verify-fixtures.mjs');
const { createM1Engine } = await fromRepo('research-ide/mathscope-m1/core/engine.mjs');
const { createM2Engine } = await fromRepo('research-ide/mathscope-m2/core/engine.mjs');
const { normalizeRequest: M1 } = await fromRepo('research-ide/mathscope-m1/core/registry.mjs');
const { normalizeRequest: M2 } = await fromRepo('research-ide/mathscope-m2/core/registry.mjs');
const catalog = await readCatalog();
const items = new Map(catalog.fixtures.map(row => [row.id, row]));
const elliptic = structuredClone(items.get('elliptic'));
elliptic.request.input.p = '3';
const selected = ['p1', 'su2', 'delta', 'exterior', 'axis', 'taylor-green'].map(id => items.get(id)).concat(elliptic);
const revisions = [
  ['p', 'p1', req => { req.input.p = '5'; }],
  ['G', 'su2', req => { req.input.group = structuredClone(items.get('su3').request.input.group); }],
  ['delta', 'delta', req => { req.input.family.delta = 2; }],
  ['tau', 'exterior', req => { req.input.tau = 0.125; }],
  ['cutoff', 'axis', req => { req.input.j0 = '1/40'; }],
  ['coefficientField', 'elliptic', req => { req.input.m = 2; req.input.polynomial = [1, 0, 1]; }],
];
let dispatchCount = 0;
let observeDispatch = null;
function workerFactory(sourceText) {
  const worker = nativeWorkerFactory(sourceText);
  const post = worker.postMessage;
  worker.postMessage = value => {
    post(value);
    if (value.type === 'start') {
      dispatchCount++;
      if (observeDispatch) {
        const callback = observeDispatch;
        observeDispatch = null;
        callback(value.request);
      }
    }
  };
  return worker;
}
const lab = createReleaseLab({
  catalog: selected, factories: {
    M1: () => createM1Engine({workerFactory}), M2: () => createM2Engine({workerFactory}),
  }, normalizers: {M1, M2}, maxJobs: 40, maxRetainedResultBytes: 64 * 1024 * 1024,
});
const original = new Map(), evidence = [];
const binding = job => ({
  id: job.id, inputHash: job.inputHash, resultHash: job.resultHash, workerSHA256: job.workerSHA256,
});
function completed(job) {
  assert.equal(job.state, 'COMPLETED', job.fixtureId + ': ' + JSON.stringify(job.result?.blockers));
  assert.equal(job.formalPass, false);
  for (const key of ['inputHash','resultHash','workerSHA256']) assert.match(job[key], /^[0-9a-f]{64}$/);
}
try {
  for (const fixture of selected) {
    const job = await lab.run(fixture.id);
    completed(job);
    original.set(fixture.id, job);
  }
  const baselineP1 = original.get('p1');
  const exported = await lab.exportRecord(baselineP1.id);
  const beforeChanges = new Map(original);
  for (const [key, id, change] of revisions) {
    const old = beforeChanges.get(id);
    const request = lab.request(id);
    change(request);
    assert.deepEqual(lab.update(id, request), [old.id]);
    assert.deepEqual(lab.update(id, structuredClone(request)), []);
    for (const [other, current] of beforeChanges) {
      const state = lab.job(current.id);
      assert.equal(state.stale, other === id);
      assert.equal(state.resultHash, current.resultHash);
    }
    await assert.rejects(lab.exportRecord(old.id), /STALE_INPUT/);
    const fresh = await lab.run(id);
    completed(fresh);
    assert.equal(fresh.stale, false);
    assert.notEqual(fresh.inputHash, old.inputHash);
    assert.notEqual(fresh.resultHash, old.resultHash);
    const observed = key === 'coefficientField' ? [old.result.results.extensionField.count, fresh.result.results.extensionField.count]
      : key === 'cutoff' ? [old.result.selectedParameters.sigmaStar, fresh.result.selectedParameters.sigmaStar] : null;
    if (observed) assert.notEqual(observed[0], observed[1]);
    evidence.push({ key, id, invalidated: [old.id], prior: binding(old), fresh: binding(fresh), observed });
    beforeChanges.set(id, fresh);
  }

  let signal;
  const dispatched = new Promise(resolve => { signal = resolve; });
  observeDispatch = signal;
  const pending = lab.run('p1');
  assert.equal((await dispatched).input.p, '5');
  const next = lab.request('p1');
  next.input.p = '7';
  lab.update('p1', next);
  assert.equal(lab.cancel(), true);
  const stopped = await pending;
  assert.equal(stopped.state, 'CANCELLED');
  assert.equal(stopped.stale, true);
  const resumed = await lab.resume(stopped.id);
  completed(resumed);
  assert.equal(resumed.request.input.p, '5');
  assert.equal(resumed.stale, true);
  await assert.rejects(lab.exportRecord(resumed.id), /STALE_INPUT/);
  const foreign = await lab.replay(JSON.parse(JSON.stringify(exported)));
  assert.equal(foreign.report.status, 'MATCH');
  assert.equal(foreign.job.inputHash, baselineP1.inputHash);
  assert.equal(foreign.job.stale, true);
  await assert.rejects(lab.exportRecord(foreign.job.id), /STALE_INPUT/);
  await assert.rejects(lab.replay({...exported, formalPass: true}), /TRUST_REJECTED/);
  assert.equal(lab.job(original.get('taylor-green').id).stale, false);

  const gitBytes = name => execFileSync('git', ['-c','core.longpaths=true','-C',repo,'show',pin + ':' + name],
    { maxBuffer: 32 * 1024 * 1024 });
  source.set(labPath + 'catalog.json', await readFile(resolve(repo,labPath + 'catalog.json')));
  const dependencies = {};
  for (const [path, data] of [...source].sort(([a],[b])=>a.localeCompare(b))) {
    const pinned = gitBytes(path);
    assert(Buffer.from(data.toString('utf8').replaceAll('\r\n', '\n')).equals(pinned), path);
    dependencies[path] = {installed: sha(data), pinned: sha(pinned)};
  }
  await writeFile(output, JSON.stringify({
    criterion: 'R1-04', sourcePin: pin, runtime: process.version, dependencies,
    dispatchedWorkers: dispatchCount, edits: evidence, unrelated: binding(original.get('taylor-green')),
    inFlight: { cancelled: stopped.id, state: stopped.state, resumed: binding(resumed), stale: resumed.stale },
    importReplay: { status: foreign.report.status, stale: foreign.job.stale, serializedPassRejected: true },
    scope: 'Actual isolated release-lab session and installed Worker. Cutoff edit uses the local axis selector input j0.',
    verdict: 'PASS_RELEASE_SESSION_BINDING_AND_LIFECYCLE',
  },null,2) + '\n', {flag:'wx'});
  console.log('R1-04 six actual edits, live worker cancellation, stale resume/import:', dispatchCount, 'dispatches');
} finally {
  hook.deregister();
  lab.dispose();
}
