import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEvidenceSession } from '../evidence-session.mjs';
import { proofSha256 } from '../../../mathscope-m0/proof.mjs';
import { createM4ProofJob } from '../../proof-jobs.mjs';
import { verifyFixture, readCatalog } from '../../release-lab/verify-fixtures.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
const parameters = { p: 3, G: 'SU2', delta: 1, tau: '1/100', cutoff: 8, coefficientField: 'Int', precision: 16 };
const graph = [
  { id: 'arithmetic', parameterKeys: ['p', 'coefficientField', 'precision'], sourceKeys: ['arithmetic'], dependsOn: [], scope: 'Declared arithmetic input lifecycle only.' },
  { id: 'arithmeticPlot', parameterKeys: [], sourceKeys: [], dependsOn: ['arithmetic'], scope: 'Representation bound to arithmetic; no new mathematical assertion.' },
  { id: 'gauge', parameterKeys: ['G', 'delta'], sourceKeys: ['gauge'], dependsOn: [], scope: 'Declared group and delta dependencies; no mass-gap assertion.' },
  { id: 'gaugePlot', parameterKeys: [], sourceKeys: [], dependsOn: ['gauge'], scope: 'Representation bound to gauge.' },
  { id: 'nativeField', parameterKeys: ['tau', 'cutoff'], sourceKeys: ['native'], dependsOn: [], scope: 'Lifecycle of actual-source request only; whole-K evaluator remains OPEN.' },
  { id: 'nativeEnergy', parameterKeys: [], sourceKeys: [], dependsOn: ['nativeField'], scope: 'Whole-K numerical energy OPEN. Test values never discharge it.' },
];
async function inputs() {
  const files = { arithmetic: '../../mathscope-m2/arithmetic/projective.mjs', gauge: '../../mathscope-m1/gauge/family.mjs', native: '../../mathscope-m3/evidence/work-continuation-20261018T081100Z_5f6a2d9c/CURRENT_ID_LEDGER.json' };
  const sources = {};
  for (const [key, path] of Object.entries(files)) sources[key] = await proofSha256((await readFile(new URL('../' + path, import.meta.url))).toString('utf8'));
  return { nodes: graph, parameters, sources };
}
const fixtureResult = { purpose: 'Lifecycle corruption control, not native-field numeric evidence', value: '3' };
async function finish(session, token, result = fixtureResult) {
  return session.complete(token, result, { bindingDigest: token.bindingDigest, resultDigest: await proofSha256(result), producer: 'explicit lifecycle fixture', kernelPass: false, originalCriterionAccepted: false });
}

test('construction snapshots parameters and source hashes before its first asynchronous digest', async () => {
  const data = await inputs();
  data.parameters = clone(data.parameters);
  const expected = clone({ parameters: data.parameters, sources: data.sources });
  const pending = createEvidenceSession(data);
  data.parameters.p = 17;
  data.sources.arithmetic = 'invalid replacement while awaiting';
  const session = await pending;
  assert.deepEqual(session.snapshot().parameters, expected.parameters);
  assert.deepEqual(session.snapshot().sources, expected.sources);
  assert.deepEqual(session.update({ p: 17 }).invalidated, ['arithmetic', 'arithmeticPlot']);
});

test('each original p/G/delta/tau/cutoff/coefficient-field change invalidates exactly declared descendants', async () => {
  const cases = [
    ['p', 5, ['arithmetic', 'arithmeticPlot']], ['G', 'SU3', ['gauge', 'gaugePlot']],
    ['delta', 2, ['gauge', 'gaugePlot']], ['tau', '1/10000', ['nativeField', 'nativeEnergy']],
    ['cutoff', 16, ['nativeField', 'nativeEnergy']], ['coefficientField', 'Fp', ['arithmetic', 'arithmeticPlot']],
  ];
  for (const [key, value, expected] of cases) {
    const session = await createEvidenceSession(await inputs());
    const tokens = await Promise.all(['arithmeticPlot', 'gaugePlot', 'nativeEnergy'].map(id => session.begin(id)));
    for (const token of tokens) await finish(session, token);
    assert.deepEqual(session.update({ [key]: value }).invalidated, expected);
    for (const token of tokens) assert.equal(session.run(token.id).stale, expected.includes(token.nodeId));
  }
});

test('camera, layer and selection changes preserve mathematics; same inputs are a no-op', async () => {
  const session = await createEvidenceSession(await inputs()), token = await session.begin('arithmeticPlot');
  await finish(session, token);
  const before = session.snapshot();
  assert.deepEqual(session.updateView({ camera: [3, 2, 1], layer: 'wireframe', selected: 0 }).invalidated, []);
  assert.equal(session.snapshot().revision, before.revision);
  assert.equal(session.run(token.id).state, 'RECORDED');
  assert.deepEqual(session.update({ p: 3 }).invalidated, []);
  assert.equal((await session.inspectImport(session.exportRecord(token.id))).attached, false);
});

test('in-flight source change and ABA input reversion cannot restore a stale run', async () => {
  const session = await createEvidenceSession(await inputs());
  const pending = session.begin('arithmeticPlot');
  session.update({ p: 5 }); session.update({ p: 3 });
  const token = await pending, result = await finish(session, token);
  assert.equal(result.executionState, 'RECORDED');
  assert.equal(result.state, 'STALE');
  assert.throws(() => session.exportRecord(token.id), /STALE_INPUT/);
  const fresh = await session.begin('arithmeticPlot');
  assert.equal(fresh.bindingDigest, token.bindingDigest, 'ABA has identical values but a different occurrence');
  assert.equal((await finish(session, fresh)).state, 'RECORDED');
});

test('cancel/resume recomputes original binding and remains stale after changed assumptions', async () => {
  const session = await createEvidenceSession(await inputs()), token = await session.begin('nativeEnergy');
  session.cancel(token);
  await assert.rejects(() => finish(session, token), /RUN_NOT_RUNNING/);
  session.update({ tau: '1/100000000' });
  const resumed = await session.resume(token.id);
  assert.equal(resumed.bindingDigest, token.bindingDigest);
  const recorded = await finish(session, resumed);
  assert.equal(recorded.resumedFrom, token.id);
  assert.equal(recorded.state, 'STALE');
  assert.throws(() => session.exportRecord(resumed.id), /STALE_INPUT/);
});

test('changed generated source invalidates only the consuming proof family', async () => {
  const data = await inputs(), old = await createM4ProofJob();
  data.sources.arithmetic = old.sources[0].sha256;
  const session = await createEvidenceSession(data), token = await session.begin('arithmeticPlot');
  await finish(session, token);
  const altered = await proofSha256(old.sources[0].content + ' ');
  assert.deepEqual(session.update({}, { arithmetic: altered }).invalidated, ['arithmetic', 'arithmeticPlot']);
  assert.equal(session.run(token.id).state, 'STALE');
  assert.notEqual(await session.binding('arithmeticPlot'), token.bindingDigest);
});

test('foreign tokens, forged acceptance, wrong result hashes and duplicated completions are rejected without destroying valid data', async () => {
  const a = await createEvidenceSession(await inputs()), b = await createEvidenceSession(await inputs());
  const token = await a.begin('arithmetic'), copied = clone(token);
  await assert.rejects(() => finish(b, token), /FOREIGN_RUN_TOKEN/);
  await assert.rejects(() => finish(a, copied), /FOREIGN_RUN_TOKEN/);
  const receipt = { bindingDigest: token.bindingDigest, resultDigest: '0'.repeat(64), producer: 'negative control', kernelPass: false, originalCriterionAccepted: false };
  await assert.rejects(() => a.complete(token, fixtureResult, { ...receipt, kernelPass: true }), /UNAUTHORIZED_ACCEPTANCE_CLAIM/);
  await assert.rejects(() => a.complete(token, fixtureResult, receipt), /RESULT_HASH_MISMATCH/);
  assert.equal(a.run(token.id).executionState, 'RUNNING');
  await finish(a, token);
  await assert.rejects(() => finish(a, token), /RUN_NOT_RUNNING/);
  assert.equal(a.run(token.id).state, 'RECORDED');
});

test('serialized import validates own input and result digests but never attaches historical PASS', async () => {
  const session = await createEvidenceSession(await inputs()), token = await session.begin('arithmetic');
  await finish(session, token); const record = session.exportRecord(token.id), count = session.runs().length;
  assert.equal((await session.inspectImport(clone(record))).state, 'BINDING_MATCH_RECOMPUTATION_REQUIRED');
  assert.equal(session.runs().length, count);
  await assert.rejects(() => session.inspectImport({ ...record, kernelPass: true }), /UNAUTHORIZED_ACCEPTANCE_CLAIM/);
  await assert.rejects(() => session.inspectImport({ ...record, result: { value: '4' } }), /IMPORT_RESULT_HASH_MISMATCH/);
  const altered = clone(record); altered.parameters.p = 17;
  await assert.rejects(() => session.inspectImport(altered), /IMPORT_BINDING_MISMATCH/);
  session.update({ p: 5 });
  assert.equal((await session.inspectImport(record)).state, 'FOREIGN_INPUT_STALE');
});

test('cycles, missing dependencies, unknown source keys, invalid arithmetic and bounded capacity fail closed', async () => {
  const data = await inputs();
  await assert.rejects(() => createEvidenceSession({ ...data, nodes: [{ ...graph[0], dependsOn: ['arithmetic'] }] }), /DEPENDENCY_CYCLE/);
  await assert.rejects(() => createEvidenceSession({ ...data, nodes: [{ ...graph[0], dependsOn: ['missing'] }] }), /UNKNOWN_DEPENDENCY/);
  await assert.rejects(() => createEvidenceSession({ ...data, sources: { arithmetic: 'x' } }), /SOURCE_SHA256_REQUIRED/);
  const session = await createEvidenceSession({ ...data, maxRuns: 1 });
  assert.throws(() => session.update({ p: Infinity }), /finite JSON numbers/);
  assert.throws(() => session.update({ newAssumption: true }), /UNKNOWN_PARAMETER/);
  const token = await session.begin('arithmetic'); await finish(session, token);
  await assert.rejects(() => session.begin('gauge'), /RUN_BUDGET_EXPORT_REQUIRED/);
  assert.equal(session.run(token.id).state, 'RECORDED');
});

test('an actual fresh P1 Worker result can be recorded and survives unrelated gauge edits; no formal promotion occurs', async () => {
  const catalog = await readCatalog(), p1 = catalog.fixtures.find(item => item.id === 'p1');
  const evidence = await verifyFixture(p1);
  assert.equal(evidence.pass, true);
  assert.equal(evidence.workersStarted, 1);
  const data = await inputs();
  data.parameters = { ...parameters, p: Number(p1.request.input.p), precision: p1.request.precision.N };
  const session = await createEvidenceSession(data), token = await session.begin('arithmetic');
  const result = await session.complete(token, evidence, { bindingDigest: token.bindingDigest, resultDigest: await proofSha256(evidence), producer: 'verifyFixture: actual installed M2 Worker versus local module', kernelPass: false, originalCriterionAccepted: false });
  assert.equal(result.state, 'RECORDED'); assert.equal(result.kernelPass, false);
  session.update({ G: 'G2' });
  assert.equal(session.run(token.id).state, 'RECORDED');
  assert.equal((await session.inspectImport(session.exportRecord(token.id))).state, 'BINDING_MATCH_RECOMPUTATION_REQUIRED');
});
