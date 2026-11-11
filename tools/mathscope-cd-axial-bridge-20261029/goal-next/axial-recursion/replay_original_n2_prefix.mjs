import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prepareGlobalSourceBand, assertGlobalSourceBand } from '../navier/source-global-band.mjs';
import { attachGlobalFixedRepresentative, assertGlobalFixedRepresentative } from '../navier/source-global-representative.mjs';
import { attachGlobalCurrentState, assertGlobalCurrentState } from '../navier/source-global-current.mjs';
import { attachGlobalCurrentPressure, assertGlobalCurrentPressure } from '../navier/source-global-pressure.mjs';
import { exportOriginalSourceGraph } from '../post-signed-20261023/export_original_source_graph.mjs';

const [directory, sourceCommit] = process.argv.slice(2);
const executingCommit = process.env.GITHUB_SHA;
assert.ok(directory && /^[a-f0-9]{40}$/.test(sourceCommit));
assert.ok(/^[a-f0-9]{40}$/.test(executingCommit ?? ''));
mkdirSync(directory, { recursive: true });
const started = Date.now();
const receipt = {
  schema: 'MathScope.M3.OriginalAxialN2CurrentPressurePrefix/1',
  sourceCommit, executingCommit, requestedPrefix: 2, stages: [],
  finalJets: 0, release: 'HOLD'
};
const save = () => writeFileSync(join(directory, 'original-n2-prefix.json'), JSON.stringify(receipt, null, 2) + '\n');
const context = {
  checkCancelled() {
    if (Date.now() - started > 65 * 60_000) throw Error('Original N=2 source prefix exceeded 65 minutes.');
    if (process.memoryUsage().rss > 7 * 1024 ** 3) throw Error('Original N=2 source prefix exceeded 7 GiB RSS.');
  },
  onProgress(row) {
    context.checkCancelled();
    if (row.stage && row.stage !== receipt.lastProgress?.stage) {
      receipt.lastProgress = { stage: row.stage, nodeCount: row.nodeCount ?? null };
      save();
    }
  }
};
function stage(name, build, authenticate) {
  receipt.currentStage = name;
  save();
  const value = build();
  assert.equal(authenticate(value), true);
  const item = { name, nodes: value.G.nodes.length, milliseconds: Date.now() - started };
  receipt.stages.push(item);
  save();
  console.log(JSON.stringify(item));
  return value;
}

try {
  const band = stage('sealed-original-band-N2',
    () => prepareGlobalSourceBand({ coefficientOrder: 2, maxNodes: 4000000 }, context),
    assertGlobalSourceBand);
  const { G, family, window } = band;
  const rows = family.selector.rows;
  assert.equal(family.request.throughOrder, 3);
  assert.equal(family.selector.sourceAuthenticated, true);
  assert.deepEqual(rows.map(row => row.order), [1, 2, 3]);
  assert.deepEqual(rows.map(row => row.constraints.length), [8, 15, 20]);
  assert.equal(rows[2].previousLogScale, rows[1].logScale);
  assert.equal(window.nextSourceScale, rows[2].scale);
  assert.equal(window.exactTail.firstOmitted, 3);
  assert.deepEqual(band.background.rows.map(row => row.order), [1, 2]);
  assert.ok(rows.flatMap(row => row.constraints).every(row => G.freeCoordinates(row.bound).size === 0));
  const log2 = G.log(G.q(2));
  const ellReal = G.div(rows[1].logScale, log2);
  const lowerLabel = G.neg(G.ceiling(G.neg(ellReal)));
  const Q = G.exp(G.neg(G.mul(lowerLabel, log2)));
  const relative = G.exp(G.sub(G.mul(lowerLabel, log2), rows[1].logScale));
  const s = G.div(G.add(G.q(1, 2), relative), G.q(2));
  const q = G.mul(Q, s);
  receipt.selector = {
    rows, historicalRows: family.source.background.cutoffs.rows.slice(0, 3),
    originalPrefix: family.prepared.order, window, commonEll0: family.constants.ell0,
    sourceBandChecks: band.checks, activeBackgroundRows: band.background.rows,
    exactInteriorChartPoint: { lowerLabel, Q, relative, s, q, eta: G.zero },
    sourceFamilySHA256: family.sourceBinding.parameterExpressionSHA256,
  };
  save();
  const representative = stage('sealed-original-representative-N2',
    () => attachGlobalFixedRepresentative(band, context), assertGlobalFixedRepresentative);
  const current = stage('sealed-original-current-N2',
    () => attachGlobalCurrentState(representative, context), assertGlobalCurrentState);
  const pressure = stage('sealed-original-pressure-N2',
    () => attachGlobalCurrentPressure(current, context), assertGlobalCurrentPressure);
  assert.equal(current.domain.prefixOrder, 2);
  assert.equal(current.domain.nextScale, rows[2].scale);
  assert.equal(current.domain.prefixSharedByAllCoverLabels, true);
  assert.equal(current.domain.prefixSharedByWholeRadialIntegral, true);
  const named = {
    pressure: pressure.pressure.value, radialPressureGradient: pressure.pressure.fullRadialDerivative,
    axialPressureGradient: pressure.pressure.slowZDerivative,
    radialResidual: pressure.residual.radial, angularResidual: pressure.residual.Etheta,
    axialResidual: pressure.residual.Ez, axialStress: pressure.residual.fullOriginalStress[1],
    referenceTime: current.domain.q, omittedScaleTimesTime: current.domain.nextScaleTimesQ
  };
  receipt.scope = {
    commonSelectorThroughThree: true, originalN2PressureAndCurrentPrivateSeals: true,
    exactPrefixDomain: current.domain, roots: named, candidateBoxes: pressure.cover.rows.length,
    completeAllCycleFinalField: false, fullPhysicalRootDomainsIndependentlyAudited: false,
  };
  receipt.currentStage = 'export-original-N2-current-pressure-graph';
  save();
  receipt.snapshot = await exportOriginalSourceGraph(pressure.G, {
    dir: join(directory, 'original-n2-current-pressure-graph'),
    roots: [...new Set(Object.values(named))], sourceCommit: executingCommit,
    pr30Commit: 'a9b3a5b317525f6d0a71e2e356b054c9d25d2e60',
    scope: 'ORIGINAL_N2_CURRENT_PRESSURE_PREFIX', maxNodes: 6000000
  });
  receipt.currentStage = 'COMPLETE';
  save();
} catch (error) {
  receipt.error = { code: error.code ?? null, message: error.message };
  save();
  throw error;
}
