import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import * as C from '../contracts.mjs';
import * as S from '../session.mjs';

// Exercise the actual injected function and the actual installed-release guard.
// Only storage, UI notifications, time and external concurrency are mocked.
const page = await readFile(new URL('../v031-with-m0.html', import.meta.url), 'utf8');
const builder = await readFile(new URL('../build_m0.py', import.meta.url), 'utf8');
const foundation = await readFile(new URL('../foundation.mjs', import.meta.url), 'utf8');
const BASELINE = JSON.parse(await readFile(new URL('../baseline/manifest.json', import.meta.url), 'utf8'));
const examples = await C.getContractExamples();
const clone = value => JSON.parse(JSON.stringify(value));

function actualFunction(source, prefix) {
  const begin = source.indexOf(prefix);
  assert.ok(begin >= 0, `Missing actual function ${prefix}`);
  const end = source.indexOf('\n  }', begin);
  assert.ok(end > begin, `Missing function terminator ${prefix}`);
  return source.slice(begin, end + '\n  }'.length);
}

const COMMIT = actualFunction(page, '  async function commitResearchM0(');
const REVISION_RECORD = actualFunction(page, '  function createRevisionRecord(');
const builderCommit = builder.match(/commit='''([\s\S]*?)'''/)?.[1];
assert.ok(builderCommit, 'The builder must contain the injected bridge source.');
const guardBegin = foundation.indexOf('  window.MathScopeM0Contracts = Object.freeze({');
const guardEnd = foundation.indexOf('\n  });', guardBegin);
assert.ok(guardBegin >= 0 && guardEnd > guardBegin, 'Actual release-pinned namespace guard must exist.');
const GUARD = foundation.slice(guardBegin, guardEnd + '\n  });'.length);

function legacy(id = 'bridge-session') {
  return {
    schema: 'MathScopeResearchSession/0.3.1-foundation.1',
    id, title: 'Existing session with retained research', sessionRevision: 7,
    objects: [{ id: 'legacy-object', revision: 'legacy-object:r1', formula: 'x^2' }],
    representations: [{ id: 'legacy-view', revision: 'legacy-view:r1', camera: [1, 2, 3] }],
    claims: [{ id: 'legacy-claim', revision: 'legacy-claim:r1', statement: 'Historical exact claim' }],
    evidence: [{ id: 'legacy-evidence', grade: 'FORMAL PASS', freshness: 'CURRENT', claimRef: 'legacy-claim', supportsCurrent: true }],
    assumptions: [{ id: 'legacy-assumption', statement: 'Original assumption' }],
    researchRuns: [{ id: 'legacy-run', module: 'primes' }],
    replayJobs: [{ id: 'legacy-replay' }],
    checkpoints: [{ id: 'legacy-checkpoint', note: 'Do not overwrite this checkpoint' }],
    revisions: [{ id: 'legacy-revision', revision: 'session:r7' }],
    activeObjectRef: 'legacy-object', releaseGate: 'HOLD',
    updatedAt: '2026-10-09T00:00:00.000Z',
  };
}

async function namespaceFor(session) {
  return (await S.migrateSession(session, BASELINE)).researchM0;
}

async function revisedNamespace(namespace) {
  return S.addNode(namespace, { kind: 'SourceManifest', payload: examples.SourceManifest });
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

function harness(initialSession, { storageThrows = false } = {}) {
  const initial = clone(initialSession);
  const secondary = legacy('other-session');
  const storage = new Map();
  const events = { attempts: 0, writes: 0, clearTimeout: 0, renders: 0, logs: [] };
  let uid = 0;
  const initialStore = { sessions: { [initial.id]: initial, [secondary.id]: secondary }, selected: initial.id, updatedAt: initial.updatedAt };
  storage.set('M0_TEST_STORE', JSON.stringify(initialStore));
  const context = vm.createContext({
    C, S, BASELINE_JSON: C.canonicalStringify(BASELINE), window: {},
    clone, __initialSession: initial, __initialStore: initialStore,
    now: () => '2026-10-09T12:34:56.000Z', uid: prefix => `${prefix}-test-${++uid}`,
    localStorage: {
      setItem(key, value) {
        events.attempts++;
        if (storageThrows) throw new Error('SIMULATED_QUOTA_EXCEEDED');
        storage.set(key, value); events.writes++;
      },
    },
    clearTimeout: () => { events.clearTimeout++; },
    log: (...args) => { events.logs.push(args); },
    renderAll: () => { events.renders++; },
  });
  vm.runInContext(`${GUARD}
    let session = __initialSession;
    let store = __initialStore;
    let dirty = true;
    let autosaveTimer = 19;
    const STORAGE_KEY = 'M0_TEST_STORE';
    ${REVISION_RECORD}
    ${COMMIT}
    globalThis.__bridge = {
      commit: commitResearchM0,
      state: () => ({session, store, dirty, autosaveTimer}),
      switchSession: id => { session = store.sessions[id]; },
      advanceM0Revision: () => { session.researchM0.revision++; },
    };`, context, { filename: 'actual-injected-m0-bridge.js' });
  return {
    api: context.__bridge, context, events, storage,
    snapshot: () => clone(context.__bridge.state()),
    pauseValidation() {
      const entered = deferred(), release = deferred();
      const originalGuard = context.window.MathScopeM0Contracts;
      context.window.MathScopeM0Contracts = Object.freeze({
        ...originalGuard,
        async verifyResearchM0Namespace(ns) {
          const report = await originalGuard.verifyResearchM0Namespace(ns);
          entered.resolve();
          await release.promise;
          return report;
        },
      });
      return { entered: entered.promise, release: release.resolve };
    },
  };
}

test('the function under test is exactly the current builder injection', () => {
  assert.equal(COMMIT.trim(), builderCommit.trim());
});

test('a storage failure leaves both in-memory state and stored data unchanged', async () => {
  const original = legacy(); const namespace = await namespaceFor(original);
  const h = harness(original, { storageThrows: true });
  const before = h.snapshot(), raw = h.api.state(), stored = h.storage.get('M0_TEST_STORE');
  await assert.rejects(h.api.commit(namespace, { expectedSessionId: original.id, expectedM0Revision: null }), /SIMULATED_QUOTA_EXCEEDED/);
  assert.deepEqual(h.snapshot(), before);
  assert.equal(h.api.state().session, raw.session);
  assert.equal(h.api.state().store, raw.store);
  assert.equal(h.storage.get('M0_TEST_STORE'), stored);
  assert.equal(h.events.attempts, 1);
  assert.equal(h.events.writes, 0);
  assert.equal(h.events.clearTimeout, 0);
  assert.equal(h.events.renders, 0);
  assert.equal(h.events.logs.length, 0);
});

test('switching the selected session during validation rejects the old save', async () => {
  const original = legacy(); const namespace = await namespaceFor(original);
  const h = harness(original), pause = h.pauseValidation();
  const pending = h.api.commit(namespace, { expectedSessionId: original.id, expectedM0Revision: null });
  await pause.entered;
  h.api.switchSession('other-session');
  const afterConcurrentChange = h.snapshot();
  pause.release();
  await assert.rejects(pending, /Session changed during M0 validation/);
  assert.deepEqual(h.snapshot(), afterConcurrentChange);
  assert.equal(h.events.writes, 0);
  assert.equal(h.api.state().session.id, 'other-session');
});

test('a concurrent M0 revision advance during validation rejects the stale save', async () => {
  const original = legacy(); original.researchM0 = await namespaceFor(original);
  const next = await revisedNamespace(original.researchM0);
  const h = harness(original), pause = h.pauseValidation();
  const pending = h.api.commit(next, { expectedSessionId: original.id, expectedM0Revision: 0 });
  await pause.entered;
  h.api.advanceM0Revision();
  const afterConcurrentChange = h.snapshot();
  pause.release();
  await assert.rejects(pending, /Session changed during M0 validation/);
  assert.deepEqual(h.snapshot(), afterConcurrentChange);
  assert.equal(h.events.writes, 0);
});

test('different content at the same namespace revision is rejected', async () => {
  const original = legacy(); original.researchM0 = await namespaceFor(original);
  const changed = clone(original.researchM0);
  changed.events.push({ type: 'SAME_REVISION_EDIT', revision: 0 });
  assert.equal((await S.verifyResearchM0Namespace(changed)).ok, true, 'Fixture must pass structural validation before the commit revision guard is exercised.');
  const h = harness(original), before = h.snapshot();
  await assert.rejects(h.api.commit(changed, { expectedSessionId: original.id, expectedM0Revision: 0 }), /must advance the namespace revision/);
  assert.deepEqual(h.snapshot(), before);
  assert.equal(h.events.writes, 0);
});

test('identical content at the same revision is an idempotent no-op', async () => {
  const original = legacy(); original.researchM0 = await namespaceFor(original);
  const h = harness(original), before = h.snapshot(), raw = h.api.state();
  const returned = await h.api.commit(clone(original.researchM0), { expectedSessionId: original.id, expectedM0Revision: 0 });
  assert.deepEqual(clone(returned), before.session);
  assert.deepEqual(h.snapshot(), before);
  assert.equal(h.api.state().session, raw.session);
  assert.equal(h.events.writes, 0);
  assert.equal(h.events.clearTimeout, 0);
  assert.equal(h.events.renders, 0);
});

test('a forged but internally rehashed baseline fails the actual release pin', async () => {
  const original = legacy(); const namespace = await namespaceFor(original);
  namespace.baseline.page.sha256 = 'a'.repeat(64);
  namespace.baselineHash = await C.sha256(namespace.baseline);
  assert.equal((await S.verifyResearchM0Namespace(namespace)).ok, true, 'The attack must be internally hash-consistent.');
  const h = harness(original), before = h.snapshot();
  await assert.rejects(h.api.commit(namespace, { expectedSessionId: original.id, expectedM0Revision: null }), /installed release baseline/);
  assert.deepEqual(h.snapshot(), before);
  assert.equal(h.events.writes, 0);
});

test('a successful namespace commit preserves legacy arrays, grades, checkpoints and other sessions', async () => {
  const original = legacy(); const namespace = await namespaceFor(original);
  const h = harness(original), before = h.snapshot();
  const returned = await h.api.commit(namespace, { expectedSessionId: original.id, expectedM0Revision: null, reason: 'Install M0 contracts' });
  const current = h.snapshot();
  for (const key of ['objects', 'representations', 'claims', 'evidence', 'assumptions', 'researchRuns', 'replayJobs', 'checkpoints']) {
    assert.deepEqual(current.session[key], before.session[key], key);
  }
  assert.equal(current.session.releaseGate, 'HOLD');
  assert.equal(current.session.activeObjectRef, before.session.activeObjectRef);
  assert.equal(current.session.sessionRevision, 8);
  assert.equal(current.session.revisions.length, before.session.revisions.length + 1);
  assert.equal(current.session.revisions[0].parentRevision, 'session:r7');
  assert.equal(current.session.revisions[0].revision, 'session:r8');
  assert.equal(current.session.revisions[0].changeType, 'research-m0');
  assert.deepEqual(current.session.revisions.slice(1), before.session.revisions);
  assert.deepEqual(current.session.researchM0, namespace);
  assert.deepEqual(current.store.sessions['other-session'], before.store.sessions['other-session']);
  assert.equal(current.dirty, false);
  assert.equal(h.events.writes, 1);
  assert.equal(h.events.clearTimeout, 1);
  assert.equal(h.events.renders, 1);
  assert.deepEqual(JSON.parse(h.storage.get('M0_TEST_STORE')), current.store);
  returned.claims[0].statement = 'Only the returned clone changed';
  assert.equal(h.snapshot().session.claims[0].statement, 'Historical exact claim');
});

test('a real typed namespace revision commits after the current revision with source hashes intact', async () => {
  const original = legacy(); original.researchM0 = await namespaceFor(original);
  const next = await revisedNamespace(original.researchM0);
  assert.ok(next.revision > original.researchM0.revision);
  const h = harness(original);
  await h.api.commit(next, { expectedSessionId: original.id, expectedM0Revision: original.researchM0.revision });
  const committed = h.snapshot().session.researchM0;
  assert.equal((await S.verifyResearchM0Namespace(committed)).ok, true);
  assert.equal(committed.nodes.length, 1);
  assert.equal(committed.nodes[0].hash, await C.sha256(committed.nodes[0].payload));
});
