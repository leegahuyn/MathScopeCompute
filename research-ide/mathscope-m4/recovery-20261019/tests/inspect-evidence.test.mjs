import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { proofSha256 } from '../../../mathscope-m0/proof.mjs';
import { inspectStoredObservation, selectOriginalValue } from '../inspect-evidence.mjs';
import { verifyFixture } from '../../release-lab/verify-fixtures.mjs';

const root = new URL('../../../../', import.meta.url);
const read = path => readFile(new URL(path, root));
const digestSource = path => read(path).then(bytes => proofSha256(bytes.toString('utf8')));
const fixtureRuns = new Map();

async function record(id) {
  const catalog = JSON.parse((await read('research-ide/mathscope-m4/release-lab/catalog.json')).toString());
  const specification = catalog.fixtures.find(x => x.id === id);
  if (!fixtureRuns.has(id)) fixtureRuns.set(id, await verifyFixture(specification));
  const prior = fixtureRuns.get(id);
  assert.equal(prior.pass, true, 'Actual fresh Worker observation required');
  const { sourceCommit: commit } = JSON.parse((await read('research-ide/mathscope-m4/recovery-20261019/CAPTURED_BASELINE.json')).toString());
  return {
    schema: 'MathScope.M4.InspectableObservation/1', claimId: specification.claimId,
    jobId: `fresh-fixture:${prior.startedAt}:${id}`, inputHash: prior.inputHash,
    result: prior.observation, resultHash: await proofSha256(prior.observation),
    source: { path: specification.source.repoPath, commit, sha256: await digestSource(specification.source.repoPath) },
    document: { sha256: 'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac', page: specification.source.page },
    formula: specification.formula, assumptionIds: [], scope: `Fresh ${id} fixture observation; original whole-K M3 remains OPEN.`,
    originalCoordinates: null, error: null, kernelPass: false, originalCriterionAccepted: false,
  };
}

test('stored NS/prism/delta selections resolve original own values, equations, source page and fixed commit', async () => {
  for (const id of ['taylor-green', 'prism', 'delta']) {
    const input = await record(id), output = await inspectStoredObservation(input, [], read);
    assert.equal(output.status, 'SOURCE_AND_RESULT_BYTES_MATCH');
    assert.equal(output.student.claimId, output.expert.claimId);
    assert.deepEqual(output.student.assumptionIds, output.expert.assumptionIds);
    assert.equal(output.student.scope, output.expert.scope);
    assert.match(output.expert.source.url, new RegExp('/blob/' + input.source.commit + '/'));
    assert.deepEqual(output.expert.originalValue, input.result);
    assert.equal(output.expert.originalCoordinates, null);
    assert.equal(output.expert.error, null);
    assert.equal(output.grantsProof, false);
  }
});

test('one source-byte mutation, result corruption and forged status are rejected for the exact reason', async () => {
  const input = await record('taylor-green');
  await assert.rejects(() => inspectStoredObservation(input, [], async path => Buffer.concat([await read(path), Buffer.from(' ')])), /CURRENT_SOURCE_BYTES_MISMATCH/);
  await assert.rejects(() => inspectStoredObservation({ ...input, result: { meanEnergy: 999 } }, [], read), /STORED_RESULT_HASH_MISMATCH/);
  await assert.rejects(() => inspectStoredObservation({ ...input, kernelPass: true }, [], read), /UNAUTHORIZED_ACCEPTANCE_CLAIM/);
  assert.equal((await inspectStoredObservation(input, [], read)).status, 'SOURCE_AND_RESULT_BYTES_MATCH');
});

test('selection is bound before an asynchronous source read even if the caller changes its path', async () => {
  const input = await record('prism'), keys = Object.keys(input.result);
  assert.ok(keys.length >= 2, 'Actual prism observation has two distinct selectable properties');
  let release;
  const pause = new Promise(resolve => { release = resolve; });
  const selection = [keys[0]];
  const pending = inspectStoredObservation(input, selection, async path => { await pause; return read(path); });
  selection[0] = keys[1];
  release();
  const output = await pending;
  assert.deepEqual(output.student.selectionPath, [keys[0]]);
  assert.deepEqual(output.expert.selectionPath, [keys[0]]);
  assert.deepEqual(output.expert.originalValue, input.result[keys[0]]);
});

test('a prepended UTF-8 BOM cannot disappear during exact source-byte hashing', async () => {
  const input = await record('delta');
  await assert.rejects(() => inspectStoredObservation(input, [], async path => Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), await read(path)])), /CURRENT_SOURCE_BYTES_MISMATCH/);
  const exactStringReader = async path => (await read(path)).toString('utf8');
  assert.equal((await inspectStoredObservation(input, [], exactStringReader)).status, 'SOURCE_AND_RESULT_BYTES_MATCH');
});

test('a selected field cannot escape into prototypes or invent a sample coordinate', () => {
  assert.deepEqual(selectOriginalValue({ points: [{ velocity: [1, 2, 3] }] }, ['points', 0, 'velocity']), [1, 2, 3]);
  assert.throws(() => selectOriginalValue({ points: [{}] }, ['points', 0, 'position']), /SELECTION_NOT_IN_ORIGINAL_RESULT/);
  assert.throws(() => selectOriginalValue({}, ['constructor']), /PROTOTYPE_SELECTION_REJECTED/);
  assert.throws(() => selectOriginalValue({}, ['__proto__']), /INVALID_SELECTION_KEY|PROTOTYPE_SELECTION_REJECTED/);
});

test('source path traversal, mutable branch labels and missing uncertainty do not receive bound inspection', async () => {
  const input = await record('prism');
  await assert.rejects(() => inspectStoredObservation({ ...input, source: { ...input.source, path: '../README.md' } }, [], read), /SOURCE_PATH_REJECTED/);
  await assert.rejects(() => inspectStoredObservation({ ...input, source: { ...input.source, commit: 'main' } }, [], read), /PINNED_SOURCE_COMMIT_REQUIRED/);
  const unknown = { ...input }; delete unknown.error;
  await assert.rejects(() => inspectStoredObservation(unknown, [], read), /EXPLICIT_UNKNOWN_ERROR_COORDINATES_REQUIRED/);
});
