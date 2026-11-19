/** Export exact original direct/split arithmetic while its owner is live. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const arithmetic = new Set(['rational', 'add', 'multiply', 'inverse', 'integer_power']);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
};
const encode = value => JSON.stringify(canonical(value)) + '\n';
const same = (a, b) => assert.deepEqual(a, b);
export const expectedFirstCycleSHA256 = '74a686bc95f4c094f1de834062b8b402aa5b861940fa3e109aa0f1913d52d529';
export const expectedSourcePins = {
  'source-postfive-full-3d-residual.mjs': 'd93195ac381c75860e5d450a77ad3160ade16ca4579f4988dc38948e504163de',
  'source-postfive-direct-split.mjs': '2f0ae4c984026ac13661ba032ac40d79fc096e116abdb5c256b28fba4b829774',
  'source-harmonic-assembly.mjs': '339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20',
};
export function stableReceipt(receipt) {
  return {...receipt, stages: receipt.stages.map(({rssBytes, ...stage}) => stage)};
}

function children(record) {
  const {op, args} = record;
  if (op === 'add' || op === 'multiply') return args;
  if (op === 'inverse' || op === 'integer_power') return [args[0]];
  return [];
}

/** Pure arithmetic exporter; the authenticated entry point below binds it
 * to the private live source owner and pinned first-cycle receipt. */
export function collectArithmeticClosure(G, roots) {
  assert(Array.isArray(roots) && roots.length && new Set(roots).size === roots.length);
  const pending = [...roots], visited = new Set(), records = [], opaque = [], denominators = new Set();
  while (pending.length) {
    const id = pending.pop();
    if (visited.has(id)) continue;
    assert(Number.isSafeInteger(id) && id >= 0 && id < G.nodes.length, 'Missing original node.');
    const record = G.nodes[id];
    assert(record && typeof record.op === 'string' && Array.isArray(record.args));
    if (record.op === 'inverse') {
      assert.equal(record.args.length, 1);
      denominators.add(record.args[0]);
    }
    if (record.op === 'integer_power') {
      assert.equal(record.args.length, 2);
      assert(Number.isSafeInteger(record.args[1]));
      if (record.args[1] < 0) denominators.add(record.args[0]);
    }
    visited.add(id);
    records.push({originalId: id, record});
    if (!arithmetic.has(record.op)) opaque.push(id);
    for (const child of children(record)) {
      assert(Number.isSafeInteger(child) && child >= 0 && child < id, 'Original arithmetic must be append-only.');
      pending.push(child);
    }
  }
  records.sort((a, b) => a.originalId - b.originalId);
  return {records, opaqueOriginalIds: opaque.sort((a, b) => a - b),
    denominatorOriginalIds: [...denominators].sort((a, b) => a - b)};
}

/**
 * sourceFiles supplies {name,file,sha256} for each of the three original
 * modules below. The original PDE assert is imported from that exact
 * loaded file, retaining its WeakMap source seal. Call after buildSplit,
 * before releasing pde or the graph.
 */
export async function exportPostFiveDirectSplitClosure({
  G, split, pde, currentReceipt, referenceReceiptPath, outDir, sourceFiles,
}) {
  assert.strictEqual(pde.G, G);
  const count = G.nodes.length;
  const receiptRaw = await readFile(referenceReceiptPath);
  assert.equal(sha(receiptRaw), expectedFirstCycleSHA256);
  const referenceReceipt = JSON.parse(receiptRaw);
  same(stableReceipt(currentReceipt), stableReceipt(referenceReceipt));
  const receipt = currentReceipt;
  assert.equal(receipt.status, 'VERIFIED_FIRST_CYCLE_SOURCE_CONSTRUCTION');
  assert.equal(receipt.prefix, 3);
  assert.equal(receipt.currentStage, 'original-post-five-direct-split');
  assert.equal(count, receipt.split.nodeCount);
  assert.equal(receipt.split.differencesProvedZero, false);
  assert.equal(split.schema, 'MathScope.N6.SourceBoundPostFiveDirectSplitAST/1');
  assert.equal(split.checks.allRootsValid, true);
  same(split.roots.defects, receipt.split.roots);
  same(split.roots.divergenceDefect, receipt.split.divergence);
  const finalStage = receipt.stages.find(stage => stage.name === 'original-post-five-physical-residual');
  assert(finalStage);
  same(pde.velocity.fullPhysicalVelocity, finalStage.velocity);
  same(pde.pressure.fullPhysicalPressure, finalStage.pressure);
  same(pde.residual.conservative, finalStage.conservativeResidual);
  same(pde.residual.divergence, finalStage.divergence);
  same(split.roots.direct, pde.residual.conservative);
  same(split.source.originalSignedVelocityRoots, pde.source.priorSignedVelocityRoots);
  same(split.source.originalSignedPressureRoot, pde.source.priorSignedPressureRoot);
  same(split.source.freshMeanVelocityIncrementRoots, pde.velocity.newMeanIncrements);
  same(split.source.freshMeanPressureDeltaRoot, pde.pressure.newMeanDelta);
  const needed = ['source-postfive-full-3d-residual.mjs', 'source-postfive-direct-split.mjs',
    'source-harmonic-assembly.mjs'];
  assert(Array.isArray(sourceFiles) && sourceFiles.length === needed.length);
  const sourcePins = [];
  for (const name of needed) {
    const entries = sourceFiles.filter(entry => entry.name === name);
    assert.equal(entries.length, 1);
    const entry = entries[0], bytes = await readFile(entry.file);
    assert(/^[0-9a-f]{64}$/.test(entry.sha256));
    assert.equal(entry.sha256, expectedSourcePins[name], name);
    assert.equal(sha(bytes), expectedSourcePins[name], name);
    sourcePins.push({name, bytes: bytes.length, sha256: entry.sha256});
  }
  const ownerModule = sourceFiles.find(entry => entry.name === needed[0]);
  const {assertActualPostFiveFull3DPDE} = await import(pathToFileURL(resolve(ownerModule.file)).href);
  assert.equal(assertActualPostFiveFull3DPDE(pde), true);
  const roots = {
    conservativeDifferences: split.roots.defects,
    divergenceDifference: split.roots.divergenceDefect,
    directResidualControls: split.roots.direct,
  };
  const rootList = [...roots.conservativeDifferences, roots.divergenceDifference, ...roots.directResidualControls];
  assert.equal(rootList.length, 7);
  const closure = collectArithmeticClosure(G, rootList);
  const payload = {
    schema: 'MathScope.PostFive.DirectSplitArithmeticClosure/1', roots,
    sourceGraphNodes: count, sourceRootAssociations: split.source,
    physicalVelocity: pde.velocity.fullPhysicalVelocity, physicalPressure: pde.pressure.fullPhysicalPressure,
    ...closure,
  };
  assert.equal(G.nodes.length, count, 'The exporter cannot append source nodes.');
  assert.equal(assertActualPostFiveFull3DPDE(pde), true);
  const bytes = Buffer.from(encode(payload));
  const manifest = {
    schema: 'MathScope.PostFive.DirectSplitArithmeticClosureManifest/1',
    firstCycleReceiptSHA256: sha(receiptRaw), sourcePins, sourceGraphNodes: count,
    currentReceipt,
    ignoredVolatileReceiptFields: ['stages[].rssBytes'],
    closureSHA256: sha(bytes), closureBytes: bytes.length, records: closure.records.length,
    opaqueRecords: closure.opaqueOriginalIds.length,
    originalPrivatePDESealRevalidated: true, actualDifferencesReduced: false,
    requiredDomain: 'Original opaque analytic/native operands and all recorded denominator values are defined.',
    actualFullResidualProvedZero: false, finalJets: 0, release: 'HOLD',
  };
  await mkdir(outDir, {recursive: true});
  await writeFile(resolve(outDir, 'direct-split-arithmetic-closure.json'), bytes, {flag: 'wx'});
  await writeFile(resolve(outDir, 'direct-split-arithmetic-manifest.json'), encode(manifest), {flag: 'wx'});
  return manifest;
}
