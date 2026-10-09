import test from 'node:test';
import assert from 'node:assert/strict';
import { runM0Acceptance } from '../acceptance.mjs';

test('browser-safe acceptance executes twelve isolated integration checks without session access', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new Proxy({}, { get() { throw new Error('Acceptance must not read the active window/session'); }, set() { throw new Error('Acceptance must not mutate the active window/session'); } }) });
  const progress = [];
  try {
    const report = await runM0Acceptance({ onProgress: item => progress.push(item.id) });
    assert.equal(report.pass, true, JSON.stringify(report.results.filter(x => !x.pass), null, 2));
    assert.equal(report.passed, 12); assert.equal(report.total, 12);
    assert.deepEqual(progress, Array.from({ length: 12 }, (_, i) => `A${String(i + 1).padStart(2, '0')}`));
    assert.equal(report.scope.mutatesActiveSession, false); assert.equal(report.scope.readsActiveSession, false);
    assert.equal(report.scope.networkRequests, false); assert.equal(report.aborted, false);
    assert.equal(report.results.find(x => x.id === 'A10').details.newLeanCompilation, false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original); else delete globalThis.window;
  }
});

test('acceptance cancellation does not claim a complete pass', async () => {
  const controller = new AbortController();
  const report = await runM0Acceptance({ signal: controller.signal, onProgress: item => { if (item.id === 'A01') controller.abort(); } });
  assert.equal(report.pass, false); assert.equal(report.aborted, true);
  assert.equal(report.results.length, 1); assert.equal(report.passed, 1); assert.equal(report.total, 12);
});
