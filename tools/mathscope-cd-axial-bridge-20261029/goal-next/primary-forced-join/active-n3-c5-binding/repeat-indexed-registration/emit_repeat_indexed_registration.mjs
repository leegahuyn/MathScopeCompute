/** Run a provisional native indexed registration after the exact Repeat export. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildRepeatIndexedIncrements} from './build_repeat_indexed_increments.mjs';

const forcedSHA = '1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3';
const forcedCheckoutSHA = 'b41f298702238cf6170c16f31362e9429ebc659ca2a999d8d85cf2159ae01be3';
const forcedGitBlob = '03c3e125d93a5bd9e66d00c5f237b100c7b48b50';
const harmonicSHA = '339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20';
const digest = data => createHash('sha256').update(data).digest('hex');
const importModule = path => import(pathToFileURL(path).href);
const exposure = Buffer.from('\nexport { completeSourceField };\n');

export async function readRepeatAssemblyInputs(
  navier, manifestPath = process.env.MATHSCOPE_FIRST_CYCLE_OVERLAY_MANIFEST,
) {
  const original = resolve(navier, 'source-global-forced-current.mjs');
  const harmonic = resolve(navier, 'source-harmonic-assembly.mjs');
  const [checkout, harmonicBytes] = await Promise.all([readFile(original), readFile(harmonic)]);
  const checkoutSHA256 = digest(checkout);
  const checkoutGitBlob = createHash('sha1').update(`blob ${checkout.length}\0`).update(checkout).digest('hex');
  let bytes = checkout;
  let approvedOverlayManifestSHA256 = null;
  if (manifestPath) {
    const manifestBytes = await readFile(manifestPath);
    const manifest = JSON.parse(manifestBytes);
    assert.equal(manifest.schema, 'MathScope.PR30OriginalVerifiedStorageOverlays/1');
    const rows = manifest.files.filter(row => resolve(row.original) === original);
    assert.equal(rows.length, 1, 'Exactly one approved Forced overlay is required');
    const [row] = rows;
    assert.equal(checkoutSHA256, forcedCheckoutSHA, 'Unexpected Forced checkout bytes');
    assert.equal(checkoutGitBlob, forcedGitBlob, 'Unexpected original Forced Git blob');
    assert.equal(row.gitBlobSHA, forcedGitBlob, 'Wrong Forced overlay base');
    assert.equal(row.sha256, forcedSHA, 'Wrong effective Forced overlay hash');
    assert.equal(row.overlay, `pr30-runtime-overlays/${forcedSHA}.mjs`, 'Wrong Forced overlay path');
    assert.ok(!manifest.files.some(item => resolve(item.original) === harmonic), 'Unexpected harmonic module overlay');
    bytes = await readFile(resolve(dirname(manifestPath), row.overlay));
    approvedOverlayManifestSHA256 = digest(manifestBytes);
  }
  assert.equal(digest(bytes), forcedSHA, 'Unexpected effective Forced assembly bytes');
  assert.equal(digest(harmonicBytes), harmonicSHA, 'Unexpected original harmonic assembly bytes');
  const pins = {
    originalForcedCheckoutSHA256: checkoutSHA256, originalForcedCheckoutGitBlob: checkoutGitBlob,
    originalForcedModuleSHA256: forcedSHA, originalHarmonicAssemblySHA256: harmonicSHA,
    approvedOverlayManifestSHA256,
  };
  return {bytes, harmonic, pins};
}

async function loadOriginalAssembly(navier) {
  const {bytes, harmonic, pins} = await readRepeatAssemblyInputs(navier);
  const sibling = resolve(navier, 'source-global-forced-current.repeat-indexed-evidence.mjs');
  const withExport = Buffer.concat([bytes, exposure]);
  try {
    await writeFile(sibling, withExport, {flag: 'wx'});
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  assert.deepEqual(await readFile(sibling), withExport, 'The sibling exposes the exact original helper');
  const [{completeSourceField}, {reconstructAngularHarmonics}] =
    await Promise.all([importModule(sibling), importModule(harmonic)]);
  assert.equal(typeof completeSourceField, 'function');
  assert.equal(typeof reconstructAngularHarmonics, 'function');
  return {completeSourceField, reconstructAngularHarmonics, pins, overlaySHA256: digest(withExport)};
}

export async function emitRepeatIndexedRegistration({navier, pde, repeat, candidate, snapshot, out}) {
  const {G} = pde;
  assert.strictEqual(G, repeat.G);
  const start = G.nodes.length;
  assert.equal(start, candidate.postRepeatNodeCount);
  assert.equal(start, snapshot.node_count);
  const modules = await loadOriginalAssembly(navier);
  const before = G.captureFunctionDefinitions();
  assert.deepEqual(before.counts, [2269, 29, 2, 60, 0]);
  const registered = buildRepeatIndexedIncrements({pde, repeat, ...modules});
  assert.ok(G.functionDefinitionsUnchanged(before));
  assert.equal(registered.fields.length, 4);
  assert.deepEqual(new Set(registered.fields.map(row => row.field)),
    new Set([29, 30, 31, 32].map(i => 'coupled-field:' + i)));
  const end = G.nodes.length;
  assert.ok(end > start && end <= start + 500_000, 'Unexpected provisional indexed append size');
  const after = G.captureFunctionDefinitions();
  assert.equal(after.counts[1], 33);
  assert.deepEqual(after.counts.slice(2), before.counts.slice(2));
  const current = G.coupledDefinitions();
  const oldReady = JSON.parse(before.definitions);
  const appendedExpressions = current.expressions.slice(before.counts[0]);
  const appendedFields = current.fields.slice(before.counts[1]);
  assert.deepEqual(current.fields.slice(0, before.counts[1]), oldReady[1]);
  const suffix = Buffer.from(G.nodes.slice(start, end).map(node => JSON.stringify(node) + '\n').join(''));
  assert.ok(suffix.length);
  const definitions = Buffer.from(JSON.stringify({expressions: appendedExpressions, fields: appendedFields}) + '\n');
  const receipt = {
    schema: 'MathScope.N8.ProvisionalRepeatIndexedIncrement/1',
    status: 'REGISTERED_NATIVE_INDEXED_CANDIDATES_FULL_STATE_OPEN',
    registration: registered,
    inputs: {
      ...modules.pins,
      exposedOriginalHelperSHA256: modules.overlaySHA256,
      repeatBaseNodes: start,
      repeatBaseStreamSHA256: snapshot.node_stream_sha256,
      repeatBaseDefinitionSHA256: snapshot.definitions_sha256,
    },
    append: {
      firstNode: start, endExclusive: end, nodeRecords: end - start, nodeBytes: suffix.length,
      nodeSHA256: digest(suffix), definitionsSHA256: digest(definitions),
      oldNativeDefinitionCounts: before.counts, newNativeDefinitionCounts: after.counts,
    },
    sameOriginalDefinitionPrefix: true,
    physicalAllDomainAdmission: 'OPEN', fixedLabelC1AllRows: 'OPEN',
    fullUpdatedState: 'OPEN', fullConservativeResidual: 'OPEN', finalJets: 0, release: 'HOLD',
  };
  await writeFile(resolve(out, 'active-repeat-indexed-append.jsonl'), suffix, {flag: 'wx'});
  await writeFile(resolve(out, 'active-repeat-indexed-definitions.json'), definitions, {flag: 'wx'});
  await writeFile(resolve(out, 'active-repeat-indexed-attachment.json'), JSON.stringify(receipt, null, 2) + '\n', {flag: 'wx'});
  return receipt;
}
