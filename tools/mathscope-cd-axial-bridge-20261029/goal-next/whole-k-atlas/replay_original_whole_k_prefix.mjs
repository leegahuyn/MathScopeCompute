import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prepareGlobalSourceBand, assertGlobalSourceBand } from '../navier/source-global-band.mjs';
import { attachGlobalFixedRepresentative, assertGlobalFixedRepresentative } from '../navier/source-global-representative.mjs';
import { attachGlobalCurrentState, assertGlobalCurrentState } from '../navier/source-global-current.mjs';
import { attachGlobalCurrentPressure, assertGlobalCurrentPressure } from '../navier/source-global-pressure.mjs';
import { clearDisposableThirdJetCaches } from '../../mathscope-m2/navier/actual-third-jet-ftc.mjs';
import { exportOriginalSourceGraph } from '../post-signed-20261023/export_original_source_graph.mjs';

const [directory, sourceCommit, request] = process.argv.slice(2);
const executingCommit = process.env.GITHUB_SHA;
const N = Number(request);
const maxMinutes = 105;
const maxRss = 6 * 1024 ** 3;
assert.ok(directory && /^[a-f0-9]{40}$/.test(sourceCommit));
assert.ok(/^[a-f0-9]{40}$/.test(executingCommit ?? ''));
assert.ok(request === String(N) && [0, 3, 4].includes(N));
mkdirSync(directory, { recursive: true });

const started = Date.now();
const gcIntervalMs = 20_000;
let lastGC = 0;
const receipt = {
  schema: 'MathScope.M3.OriginalWholeKHigherPrefix/1',
  sourceCommit, executingCommit, requestedPrefix: N, stages: [],
  maxMinutes, maxRss, maxRssObserved: 0, memoryCheckpoints: [], finalJets: 0, release: 'HOLD',
};
const save = () => writeFileSync(join(directory, 'original-whole-k-prefix.json'), JSON.stringify(receipt, null, 2) + '\n');
function measure() {
  const rss = process.memoryUsage.rss();
  receipt.maxRssObserved = Math.max(rss, receipt.maxRssObserved);
  return { elapsedMs: Date.now() - started, rssBytes: rss };
}

function collectAt(label) {
  if (!global.gc) return;
  const before = process.memoryUsage();
  measure();
  global.gc();
  const after = process.memoryUsage();
  const item = { label, before, after, ...measure() };
  lastGC = Date.now();
  receipt.memoryCheckpoints.push(item);
  console.log(JSON.stringify(item));
  save();
}

const context = {
  checkCancelled() {
    let { elapsedMs, rssBytes } = measure();
    if (elapsedMs > maxMinutes * 60_000) {
      throw Object.assign(Error('Original prefix exceeded the runner time bound.'), { code: 'SOURCE_TIME_LIMIT' });
    }
    if (rssBytes >= maxRss * 0.93 && Date.now() - lastGC > gcIntervalMs) {
      collectAt('runner-near-RSS-limit');
      ({ rssBytes } = measure());
    }
    if (rssBytes > maxRss) {
      throw Object.assign(Error('Original prefix exceeded the runner RSS bound.'), { code: 'SOURCE_RSS_LIMIT' });
    }
  },
  onProgress(row) {
    if (row.stage === 'common-pressure-stress-diagonal-norms-ready') {
      collectAt(row.stage);
    }
    context.checkCancelled();
    if (row.stage && row.stage !== receipt.lastProgress?.stage) {
      receipt.lastProgress = { stage: row.stage, nodeCount: row.nodeCount ?? null, ...measure() };
      console.log(JSON.stringify(receipt.lastProgress));
      save();
    }
  },
};

function stage(name, build, authenticate) {
  receipt.currentStage = name;
  save();
  const result = build();
  assert.equal(authenticate(result), true);
  const item = { name, nodes: result.G.nodes.length, ...measure() };
  receipt.stages.push(item);
  console.log(JSON.stringify(item));
  save();
  clearDisposableThirdJetCaches(result.G);
  global.gc?.();
  context.checkCancelled();
  return result;
}

try {
  const band = stage('sealed-original-band',
    () => prepareGlobalSourceBand({ coefficientOrder: N, maxNodes: 4000000 }, context),
    assertGlobalSourceBand);
  const { G, family, window } = band;
  const through = Math.max(2, N+1);
  const rows = family.selector.rows;
  assert.equal(family.request.throughOrder, through);
  assert.equal(family.request.derivativeOrder, Math.max(3, N+1));
  assert.equal(family.selector.sourceAuthenticated, true);
  assert.deepEqual(rows.map(row => row.order), Array.from({ length: through }, (_, i) => i+1));
  assert.deepEqual(rows.map(row => row.constraints.length),
    Array.from({ length: through }, (_, i) => i === 0 ? 8 : 5*(i+2)));
  assert.deepEqual(band.background.rows.map(row => row.order), Array.from({ length: N }, (_, i) => i+1));
  for (const row of rows) {
    const predecessor = row.order === 1 ? G.zero : rows[row.order-2].logScale;
    assert.equal(row.previousLogScale, predecessor);
    assert.ok(row.constraints.every(clause => G.freeCoordinates(clause.bound).size === 0));
  }
  assert.equal(window.nextSourceScale, rows[N].scale);
  assert.equal(window.exactTail.firstOmitted, N+1);
  receipt.selector = {
    rows,
    historicalRows: family.source.background.cutoffs.rows.slice(0, through),
    originalPrefix: family.prepared.order,
    window,
    commonEll0: family.constants.ell0,
    commonEllMinimum: family.constants.ellMinimum,
    familyRequest: family.request,
    sourceBandChecks: band.checks,
    activeBackgroundRows: band.background.rows,
    sourceFamilySHA256: family.sourceBinding.parameterExpressionSHA256,
  };
  save();

  const representative = stage('sealed-original-representative',
    () => attachGlobalFixedRepresentative(band, context), assertGlobalFixedRepresentative);
  const current = stage('sealed-original-current',
    () => attachGlobalCurrentState(representative, context), assertGlobalCurrentState);
  const pressure = stage('sealed-original-pressure',
    () => attachGlobalCurrentPressure(current, context), assertGlobalCurrentPressure);
  assert.equal(current.domain.prefixOrder, N);
  assert.equal(current.domain.nextScale, rows[N].scale);
  assert.equal(current.domain.prefixSharedByAllCoverLabels, true);
  assert.equal(current.domain.prefixSharedByWholeRadialIntegral, true);

  const roots = {
    pressure: pressure.pressure.value,
    radialPressureGradient: pressure.pressure.fullRadialDerivative,
    axialPressureGradient: pressure.pressure.slowZDerivative,
    radialResidual: pressure.residual.radial,
    angularResidual: pressure.residual.Etheta,
    axialResidual: pressure.residual.Ez,
    axialStress: pressure.residual.fullOriginalStress[1],
    referenceTime: current.domain.q,
    omittedScaleTimesTime: current.domain.nextScaleTimesQ,
    selectorScales: rows.map(row => row.scale),
  };
  receipt.scope = {
    originalCurrentPressurePrivateSeals: true,
    exactPrefixDomain: current.domain,
    roots,
    candidateBoxes: pressure.cover.rows.length,
    instantiatedAllPhysicalCells: false,
    nativeReachableNaturalSeriesRangeAudited: false,
    completeAllCycleFinalField: false,
  };
  receipt.currentStage = 'export-original-graph';
  save();
  receipt.snapshot = await exportOriginalSourceGraph(pressure.G, {
    dir: join(directory, 'original-whole-k-current-pressure-graph'),
    roots: [...new Set([...Object.values(roots).filter(Number.isSafeInteger), ...roots.selectorScales])],
    sourceCommit: executingCommit,
    pr30Commit: 'a9b3a5b317525f6d0a71e2e356b054c9d25d2e60',
    scope: 'ORIGINAL_WHOLE_K_N' + N + '_CURRENT_PRESSURE_PREFIX',
    maxNodes: 6000000,
  });
  receipt.currentStage = 'COMPLETE';
  save();
} catch (error) {
  receipt.error = { code: error.code ?? null, message: error.message, ...measure() };
  save();
  throw error;
}
