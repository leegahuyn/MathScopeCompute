/** Build the original Primary C5 class with the same native family and C8/C6 norms. */
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writePrimaryNormOperandBoundary} from './export_norm_operand_boundary.mjs';
import {compactOwnedLookup, compactDerivativesFromLegacy} from '../../mathscope-m2/navier/mathscope-owned-lookup.mjs';
import {
  assertActualCommonAdmissibleFamily,
  prepareActualCommonAdmissibleFamily,
} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {assertActualCompactAllBandBackgroundNorms} from '../../mathscope-m2/navier/actual-compact-all-band-background-norms.mjs';
import {assertActualCommonTargetWeightedNorms} from '../../mathscope-m2/navier/actual-common-target-weighted-norms.mjs';
import {clearDisposableThirdJetCaches} from '../../mathscope-m2/navier/actual-third-jet-ftc.mjs';
import {attachGlobalSourceBand, assertGlobalSourceBand} from '../navier/source-global-band.mjs';
import {attachGlobalFixedRepresentative, assertGlobalFixedRepresentative} from '../navier/source-global-representative.mjs';
import {attachGlobalCurrentState, assertGlobalCurrentState} from '../navier/source-global-current.mjs';
import {attachGlobalPrimaryClassOperator, assertGlobalPrimaryClassOperator} from '../navier/source-primary-class-majorants.mjs';

const [out, originalCommit, prefixText = '1'] = process.argv.slice(2);
assert([4, 5].includes(process.argv.length));
assert(['1', '3', '4'].includes(prefixText));
const prefix = Number(prefixText);
const throughOrder = prefix + 1;
assert(out && /^[a-f0-9]{40}$/.test(originalCommit));
assert.match(process.env.GITHUB_SHA ?? '', /^[a-f0-9]{40}$/);
mkdirSync(out, {recursive: true});
const nodeBudget = Number(process.env.SOURCE_NODE_BUDGET ?? 16_000_000);
assert([16_000_000, 20_000_000, 24_000_000, 25_000_000].includes(nodeBudget));
const limits = {rssBytes: 12 * 1024 ** 3, durationMinutes: 120, familyNodes: nodeBudget, bandNodes: nodeBudget};
const started = Date.now();
let lastGC = 0;
let ownedBackgroundGraph;
const receipt = {
  schema: 'MathScope.N7.OriginalLivePrimaryC5/1',
  status: 'RUNNING', originalCommit, executingCommit: process.env.GITHUB_SHA,
  requested: {prefix, selectorThroughOrder: throughOrder, familyC: 8, weightedTargetC: 6, primaryC: 5},
  limits, stages: [], progress: [], finalJets: '0/67', release: 'HOLD',
};
function save() {
  writeFileSync(join(out, 'primary-c5-native.json'), JSON.stringify(receipt, null, 2) + '\n');
}
function measured() {
  const {rss: rssBytes, heapUsed: heapBytes} = process.memoryUsage();
  return {elapsedMs: Date.now() - started, rssBytes, heapBytes};
}
const context = {
  compactNormCaches(graph) {
    assert.equal(receipt.cacheStorage, undefined);
    global.gc();
    const before = measured();
    const internEntries = graph.lookup.size;
    const derivativeEntries = graph.derivatives.size;
    graph.lookup = compactOwnedLookup(graph.lookup, graph.nodes.length);
    global.gc();
    graph.derivatives = compactDerivativesFromLegacy(graph.derivatives);
    global.gc();
    receipt.cacheStorage = {internEntries, derivativeEntries, before, after: measured()};
    ownedBackgroundGraph = graph;
    console.log(JSON.stringify({name: 'original-cache-storage-conversion', ...receipt.cacheStorage}));
    save();
    context.checkCancelled();
  },
  checkCancelled() {
    let stats = measured();
    if (stats.rssBytes > limits.rssBytes * 0.93 && Date.now() - lastGC > 20_000) {
      global.gc();
      lastGC = Date.now();
      stats = measured();
    }
    if (stats.rssBytes > limits.rssBytes || stats.elapsedMs > limits.durationMinutes * 60_000) {
      receipt.stoppedAt = stats;
      throw Object.assign(new Error('Original Primary C5 exceeded the owned RSS or time limit.'), {
        code: stats.rssBytes > limits.rssBytes ? 'SOURCE_RSS_LIMIT' : 'SOURCE_TIME_LIMIT',
      });
    }
  },
  onBackgroundNorms(norms) {
    assert.strictEqual(norms.G, ownedBackgroundGraph);
    assert.equal(assertActualCompactAllBandBackgroundNorms(norms), true);
    assert(norms.checks.every(({pass}) => pass));
    assert.equal(norms.request.derivativeOrder, 8);
    const row = norms.gaussianRows.find(({derivativeOrder}) => derivativeOrder === 6);
    assert.equal(row?.backgroundDerivativeOrder, 8);
    receipt.originalBackgroundC8 = {
      status: 'VERIFIED_NATIVE_ORIGINAL_ALL_BAND_BACKGROUND_C8',
      nodeCount: norms.G.nodes.length, source: norms.sourceBinding,
      roots: norms.roots, row, checks: norms.checks, scope: norms.scope, ...measured(),
    };
    if (process.env.MATHSCOPE_EXPORT_NORM_OPERANDS === 'true') {
      const {G, leading, sourceBinding} = norms;
      const rows = leading.ftcRows.map(({field, radialOrder, etaOrder, sourceJet, bound}) => ({
        field, radialOrder, etaOrder, sourceJet, bound, node: G.nodes[bound],
      }));
      assert.equal(rows.length, 90);
      const metadata = {schema: 'MathScope.ActiveOriginalLeadingFTCBindings/1', graphNamespace: 'norm',
        sourceBinding, nodeCount: G.nodes.length, definitions: leading.definitions, box: leading.box, rows};
      writeFileSync(join(out, 'actual-leading-ftc-bindings.json'), JSON.stringify(metadata, null, 2) + '\n', {flag: 'wx'});
    }
    save();
    console.log(JSON.stringify(receipt.originalBackgroundC8));
  },
  onProgress(row) {
    context.checkCancelled();
    const name = row.stage ?? row.phase;
    if (!name) return;
    if (name === 'all-band-background-before-pack') {
      assert.equal(ownedBackgroundGraph.nodes.length, row.nodeCount);
      const before = measured();
      const discarded = clearDisposableThirdJetCaches(ownedBackgroundGraph);
      global.gc();
      receipt.cacheAtPack = {before, discarded, after: measured()};
    }
    const latest = receipt.progress.at(-1);
    const nodeCount = row.nodeCount ?? row.nodes ?? null;
    if (latest?.name === name && latest.nodeCount === nodeCount &&
        latest.coefficientFTCCount === row.coefficientFTCCount && latest.order === row.order) return;
    const progress = {name, field: row.field, order: row.order, coefficientFTCCount: row.coefficientFTCCount,
      nodeCount, ...measured()};
    receipt.progress.push(progress);
    if (receipt.progress.length > 100) receipt.progress.shift();
    console.log(JSON.stringify(progress));
    save();
  },
};
function stage(name, build, authenticate) {
  receipt.currentStage = name;
  save();
  context.checkCancelled();
  const value = build();
  assert.equal(authenticate(value), true, name);
  clearDisposableThirdJetCaches(value.G);
  global.gc();
  context.checkCancelled();
  const entry = {name, nodeCount: value.G.nodes.length, ...measured()};
  receipt.stages.push(entry);
  console.log(JSON.stringify(entry));
  save();
  return value;
}

try {
  const family = stage('same-source-C8-background', () => prepareActualCommonAdmissibleFamily({
    throughOrder, derivativeOrder: 8, maxNodes: limits.familyNodes,
    maxProfileJets: 60_000, maxJetRequests: 600_000,
  }, context), assertActualCommonAdmissibleFamily);
  assert.equal(family.request.derivativeOrder, 8);
  assert.equal(family.request.throughOrder, throughOrder);
  assert.deepEqual(family.selector.rows.map(({order}) => order),
    Array.from({length: throughOrder}, (_, j) => j + 1));
  assert(receipt.cacheStorage);
  assert(receipt.cacheAtPack);
  assert.equal(family.prepared.order, 8);
  const gaussian = family.source.backgroundNorms.gaussianRows.find(row => row.derivativeOrder === 6);
  assert.equal(gaussian.backgroundDerivativeOrder, 8);
  const band = stage(`original-N${prefix}-band`, () => attachGlobalSourceBand(family, {
    coefficientOrder: prefix, maxNodes: limits.bandNodes,
  }, context), assertGlobalSourceBand);
  const representative = stage(`fixed-N${prefix}-representative`, () => attachGlobalFixedRepresentative(band, context),
    assertGlobalFixedRepresentative);
  const current = stage(`original-N${prefix}-current`, () => attachGlobalCurrentState(representative, context),
    assertGlobalCurrentState);
  const target = stage('same-source-C6-weighted-target', () => family.constructTargetWeightedNorms({
    derivativeOrder: 6, maxNodes: limits.bandNodes, maxJetRequests: 600_000,
  }, context), assertActualCommonTargetWeightedNorms);
  assert.strictEqual(current.band.family, family);
  assert.strictEqual(target.family, family);
  assert.equal(current.domain.prefixOrder, prefix);
  assert.equal(target.request.derivativeOrder, 6);
  assert.deepEqual(target.rows.map(row => [row.derivativeOrder, row.pole]),
    Array.from({length: 7}, (_, j) => [j, 3 + 3*j]));
  assert.equal(target.rows[6].derivatives.length, 84);

  const primary = stage('original-phase-free-wave-C5', () => attachGlobalPrimaryClassOperator(current, target, {
    order: 5, maxWork: 200_000,
  }, context), assertGlobalPrimaryClassOperator);
  assert.strictEqual(primary.current, current);
  assert.strictEqual(primary.target, target);
  assert.equal(primary.scope.actualFiniteDerivativeOrder, 5);
  for (const key of ['actualOriginalPrimaryWOneHalfClassCertified', 'actualOriginalPotentialWOneClassCertified',
    'actualOriginalPrimaryPressureWOneClassCertified', 'actualFullCurlRemainderWOneMinusKappaClassCertified']) {
    assert.equal(primary.scope[key], true, key);
  }
  assert.equal(primary.scope.actualForcedInputWClassCertified, false);
  assert(primary.checks.every(row => row.pass));
  const {weighted} = primary.bounds.degreeProgram;
  assert.equal(weighted.potential.length, 7);
  assert.equal(weighted.curl.length, 6);
  receipt.status = `VERIFIED_ORIGINAL_NATIVE_N${prefix}_PRIMARY_C5_CLASS`;
  receipt.source = primary.source;
  receipt.domain = primary.domain;
  receipt.backgroundRow = gaussian;
  receipt.targetRows = target.rows.map(({derivativeOrder, pole, N_m}) => ({derivativeOrder, pole, N_m}));
  receipt.normRoot = primary.bounds.K;
  receipt.classRows = primary.bounds.rows;
  receipt.nativeChecks = primary.checks;
  receipt.scope = primary.scope;
  receipt.potentialSix = weighted.potential[6];
  receipt.currentStage = 'complete-primary-C5-class-only';
  save();
  if (process.env.MATHSCOPE_EXPORT_NORM_OPERANDS === 'true') {
    try {
      receipt.normOperandBoundary = writePrimaryNormOperandBoundary(primary, out);
      save();
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    }
  }
  const forcedObserver = process.env.MATHSCOPE_SAME_FAMILY_FORCED_OBSERVER;
  if (forcedObserver) {
    assert.equal(prefix, 3);
    try {
      const {runSameFamilyModeTwo} = await import(pathToFileURL(forcedObserver).href);
      await runSameFamilyModeTwo({family, current, target, primary, context, out,
        runtime: 'research-ide', supportReceipt: process.env.MATHSCOPE_ACTIVE_N3_SUPPORT,
        fullForced: process.env.MATHSCOPE_FULL_FORCED === 'true'});
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    }
  }
} catch (error) {
  receipt.status = 'BLOCKED_AT_ORIGINAL_STAGE';
  receipt.error = {code: error.code ?? null, message: error.message, stack: error.stack};
  receipt.lastMeasurement = measured();
  save();
  console.error(error);
  process.exitCode = 1;
}
