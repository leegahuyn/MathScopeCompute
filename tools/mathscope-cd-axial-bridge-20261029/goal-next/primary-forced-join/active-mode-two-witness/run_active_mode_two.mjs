#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ActiveModeTwoWitnessComplete, instrumentOriginalForcedSource, witnessContext } from './record_active_mode_two.mjs';

const args = process.argv.slice(2);
const preflight = args.at(-1) === '--preflight-only';
assert.equal(args.length, preflight ? 5 : 4, 'usage: runtime-root support-receipt output-dir N [--preflight-only]');
const [root, supportReceipt, dir, requested] = args;
const N = Number(requested);
assert.ok(requested === String(N) && [3, 4].includes(N));
const runtime = resolve(root);
const navier = join(runtime, 'mathscope-m3', 'navier');
const moduleURL = file => pathToFileURL(file).href;
const fromNavier = name => import(moduleURL(join(navier, name)));
const original = join(navier, 'source-global-forced-current.mjs');
const overlay = join(navier, 'source-global-forced-current.active-mode-two.mjs');
const originalBytes = await readFile(original);
const overlayBytes = instrumentOriginalForcedSource(originalBytes);
try {
  await writeFile(overlay, overlayBytes, { flag: 'wx' });
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  assert.deepEqual(await readFile(overlay), overlayBytes, 'existing overlay must equal exact observer bytes');
}
const context = await witnessContext({ dir, supportReceipt, originalForcedSource: original, instrumentedForcedSource: overlay });

const [upstream, bandStage, representativeStage, currentStage, momentStage, pressureStage, temporalStage,
  meanStage, angularStage, forcedStage, thirdJet] = await Promise.all([
  import(moduleURL(join(runtime, 'mathscope-m2', 'navier', 'actual-common-admissible-family.mjs'))),
  fromNavier('source-global-band.mjs'), fromNavier('source-global-representative.mjs'),
  fromNavier('source-global-current.mjs'), fromNavier('source-global-moment.mjs'),
  fromNavier('source-global-pressure.mjs'), fromNavier('source-global-temporal.mjs'),
  fromNavier('source-global-initial-mean.mjs'), fromNavier('source-initialized-angular.mjs'), import(moduleURL(overlay)),
  import(moduleURL(join(runtime, 'mathscope-m2', 'navier', 'actual-third-jet-ftc.mjs'))),
]);
const stages = [
  [upstream, 'ActualCommonAdmissibleFamily', 'prepare'], [bandStage, 'GlobalSourceBand', 'attach'],
  [representativeStage, 'GlobalFixedRepresentative', 'attach'], [currentStage, 'GlobalCurrentState', 'attach'],
  [momentStage, 'GlobalMomentCurrent', 'attach'], [pressureStage, 'GlobalCurrentPressure', 'attach'],
  [temporalStage, 'GlobalTemporalInverse', 'attach'], [meanStage, 'GlobalInitializedMean', 'attach'],
  [angularStage, 'GlobalInitializedAngular', 'attach'],
];
for (const [module, suffix, constructor] of stages) {
  assert.equal(typeof module[`${constructor}${suffix}`], 'function');
  assert.equal(typeof module[`assert${suffix}`], 'function');
}
assert.equal(typeof forcedStage.attachGlobalForcedCurrentWithCheckpoints, 'function');
assert.equal(typeof thirdJet.clearDisposableThirdJetCaches, 'function');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceDir = join(runtime, 'mathscope-m2', 'navier');
const diagonal = (await readFile(join(sourceDir, 'actual-common-admissible-family.mjs'), 'utf8')).includes('selectorDiagonalOnly');
if (preflight) {
  console.log(JSON.stringify({ status: 'OBSERVER_BYTES_AND_ORIGINAL_CONSTRUCTOR_IMPORTS_VERIFIED', original: sha(originalBytes),
    overlay: sha(overlayBytes), originalConstructorImports: stages.length, diagonalRuntimePresent: diagonal }));
  process.exit(0);
}
assert.equal(diagonal, true, 'prepare the original diagonal selector runtime before real construction');
assert.equal(typeof global.gc, 'function', 'run Node with --expose-gc');
const maxRss = Number(process.env.MATHSCOPE_ACTIVE_WITNESS_MAX_RSS ?? 12 * 1024 ** 3);
const time = Number(process.env.MATHSCOPE_ACTIVE_WITNESS_MAX_MINUTES ?? 105) * 60_000;
assert.ok(Number.isSafeInteger(maxRss) && maxRss > 0 && Number.isSafeInteger(time) && time > 0);
const started = Date.now();
let last = '', lastGC = 0;
Object.assign(context, { selectorDiagonalOnly: true,
  checkCancelled() {
    let rss = process.memoryUsage().rss;
    if (rss > 0.9 * maxRss && Date.now() - lastGC > 20_000) {
      global.gc();
      lastGC = Date.now();
      rss = process.memoryUsage().rss;
    }
    assert.ok(rss < maxRss && Date.now() - started < time, 'active source witness resource limit');
  },
  onProgress(row) {
    context.checkCancelled();
    if (row.stage && row.stage !== last) {
      last = row.stage;
      console.log(JSON.stringify({ ...row, rss: process.memoryUsage().rss, elapsed: Date.now() - started }));
    }
  },
});
function issue(index, ...parameters) {
  const [module, suffix, constructor] = stages[index];
  context.checkCancelled();
  const value = module[`${constructor}${suffix}`](...parameters, context);
  assert.equal(module[`assert${suffix}`](value), true);
  thirdJet.clearDisposableThirdJetCaches(value.G);
  global.gc();
  context.checkCancelled();
  console.log(JSON.stringify({ privateSeal: suffix, graphNodes: value.G.nodes.length, rss: process.memoryUsage().rss }));
  return value;
}
const family = issue(0, { throughOrder: N + 1, derivativeOrder: N + 1, maxNodes: N === 4 ? 12_000_000 : 5_000_000,
  maxProfileJets: 60_000, maxJetRequests: 600_000 });
assert.equal(family.source.velocitySeminorms.request.selectorDiagonalOnly, true);
assert.equal(family.source.pressureStressSeminorms.request.selectorDiagonalOnly, true);
const band = issue(1, family, { coefficientOrder: N, maxNodes: N === 4 ? 16_000_000 : 8_000_000 });
const representative = issue(2, band);
const current = issue(3, representative);
const moment = issue(4, current);
const pressure = issue(5, current);
const temporal = issue(6, pressure);
const mean = issue(7, temporal, moment);
const initialized = issue(8, mean);
try {
  await forcedStage.attachGlobalForcedCurrentWithCheckpoints(initialized, context);
  throw new Error('missing selected original active mode-two checkpoint');
} catch (error) {
  if (!(error instanceof ActiveModeTwoWitnessComplete)) throw error;
  assert.deepEqual(await readFile(original), originalBytes, 'original Forced runtime bytes changed');
  console.log(JSON.stringify({ status: 'ORIGINAL_ACTIVE_TWO_CANDIDATES_EXPORTED', N, output: resolve(dir), completeForcedSeal: false }));
}
