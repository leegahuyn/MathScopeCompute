/** Build the original N1 Primary C5 class with real same-family C8/C6 norms. */
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {compactFromLegacy, compactDerivativesFromLegacy} from './compact_lookup.mjs';
import {
  assertActualCommonAdmissibleFamily,
  prepareActualCommonAdmissibleFamily,
} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {assertActualCommonTargetWeightedNorms} from '../../mathscope-m2/navier/actual-common-target-weighted-norms.mjs';
import {clearDisposableThirdJetCaches} from '../../mathscope-m2/navier/actual-third-jet-ftc.mjs';
import {attachGlobalSourceBand, assertGlobalSourceBand} from '../navier/source-global-band.mjs';
import {attachGlobalFixedRepresentative, assertGlobalFixedRepresentative} from '../navier/source-global-representative.mjs';
import {attachGlobalCurrentState, assertGlobalCurrentState} from '../navier/source-global-current.mjs';
import {attachGlobalPrimaryClassOperator, assertGlobalPrimaryClassOperator} from '../navier/source-primary-class-majorants.mjs';

const [out, originalCommit] = process.argv.slice(2);
assert.equal(process.argv.length, 4);
assert(out && /^[a-f0-9]{40}$/.test(originalCommit));
assert.match(process.env.GITHUB_SHA ?? '', /^[a-f0-9]{40}$/);
mkdirSync(out, {recursive: true});
const limits = {rssBytes: 12 * 1024 ** 3, durationMinutes: 120, familyNodes: 16_000_000, bandNodes: 16_000_000};
const started = Date.now();
let lastGC = 0;
const receipt = {
  schema: 'MathScope.N7.OriginalLivePrimaryC5/1',
  status: 'RUNNING', originalCommit, executingCommit: process.env.GITHUB_SHA,
  requested: {prefix: 1, familyC: 8, weightedTargetC: 6, primaryC: 5},
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
    graph.lookup = compactFromLegacy(graph.lookup);
    global.gc();
    graph.derivatives = compactDerivativesFromLegacy(graph.derivatives);
    global.gc();
    receipt.cacheStorage = {internEntries, derivativeEntries, before, after: measured()};
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
  onProgress(row) {
    context.checkCancelled();
    const name = row.stage ?? row.phase;
    if (!name) return;
    const latest = receipt.progress.at(-1);
    const nodeCount = row.nodeCount ?? row.nodes ?? null;
    if (latest?.name === name && latest.nodeCount === nodeCount &&
        latest.coefficientFTCCount === row.coefficientFTCCount) return;
    const progress = {name, field: row.field, coefficientFTCCount: row.coefficientFTCCount,
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
    throughOrder: 2, derivativeOrder: 8, maxNodes: limits.familyNodes,
    maxProfileJets: 60_000, maxJetRequests: 600_000,
  }, context), assertActualCommonAdmissibleFamily);
  assert.equal(family.request.derivativeOrder, 8);
  assert(receipt.cacheStorage);
  assert.equal(family.prepared.order, 8);
  const gaussian = family.source.backgroundNorms.gaussianRows.find(row => row.derivativeOrder === 6);
  assert.equal(gaussian.backgroundDerivativeOrder, 8);
  const band = stage('original-N1-band', () => attachGlobalSourceBand(family, {
    coefficientOrder: 1, maxNodes: limits.bandNodes,
  }, context), assertGlobalSourceBand);
  const representative = stage('fixed-N1-representative', () => attachGlobalFixedRepresentative(band, context),
    assertGlobalFixedRepresentative);
  const current = stage('original-N1-current', () => attachGlobalCurrentState(representative, context),
    assertGlobalCurrentState);
  const target = stage('same-source-C6-weighted-target', () => family.constructTargetWeightedNorms({
    derivativeOrder: 6, maxNodes: limits.bandNodes, maxJetRequests: 600_000,
  }, context), assertActualCommonTargetWeightedNorms);
  assert.strictEqual(current.band.family, family);
  assert.strictEqual(target.family, family);
  assert.equal(current.domain.prefixOrder, 1);
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
  receipt.status = 'VERIFIED_ORIGINAL_NATIVE_N1_PRIMARY_C5_CLASS';
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
} catch (error) {
  receipt.status = 'BLOCKED_AT_ORIGINAL_STAGE';
  receipt.error = {code: error.code ?? null, message: error.message, stack: error.stack};
  receipt.lastMeasurement = measured();
  save();
  console.error(error);
  process.exitCode = 1;
}
