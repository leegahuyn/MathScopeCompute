import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoArg, replayArg, r101Arg, output] = process.argv.slice(2);
if (!repoArg || !replayArg || !r101Arg || !output) {
  throw Error('Usage: node r1_refinement_acceptance.mjs REPO REPLAY_MANIFEST R101_RECEIPT OUTPUT');
}
const repo = resolve(repoArg);
const importSource = file => import(pathToFileURL(resolve(repo, file)).href);
const { createM2Engine } = await importSource('research-ide/mathscope-m2/core/engine.mjs');
const { getExamples } = await importSource('research-ide/mathscope-m2/gauge/index.mjs');
const { nativeWorkerFactory } = await importSource('research-ide/mathscope-m4/release-lab/verify-fixtures.mjs');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const replayBytes = await readFile(replayArg);
const r101Bytes = await readFile(r101Arg);
const replay = JSON.parse(replayBytes);
const r101 = JSON.parse(r101Bytes);
assert.equal(r101.firstReplayManifestSHA256, digest(replayBytes));
assert.equal(r101.verdict, 'PASS_SUPPORTED_R1_01_FIXTURES');
const workerSHA256 = r101.cases.find(row => row.id === 'lattice').workerSHA256;

// Fixed before execution. A three-SE two-sided Gaussian window is conservative
// for the nominal familywise alpha under the stated stationary CLT model.
const statisticsPlan = {
  alphaFamilywiseNominal: 0.05,
  gaussianMultiplier: 3,
  comparisons: 12,
  twoSidedGaussianTailUpper: 0.0027,
  bonferroniGaussianTailUpper: 0.0324,
  retainedSampleCounts: [12000, 24000],
  replicaLabels: ['A', 'B', 'C'],
  seedRule: 'MathScope-R102-20261111/{count}/{replica}',
  burnIn: 1000,
  minimumEffectiveSampleSize: 100,
  confidenceScope: 'Approximate normal approximation conditional on stationarity and usable autocorrelation diagnostics',
};
assert(statisticsPlan.bonferroniGaussianTailUpper < statisticsPlan.alphaFamilywiseNominal);

const byId = new Map(replay.refinements.map(row => [row.id, row]));
assert.deepEqual([...byId.keys()], ['padic', 'series', 'spatial', 'lattice-spacing', 'lattice-volume', 'samples']);
function pair(name, paths) {
  const row = byId.get(name);
  assert(row.assessment.pass && row.rows.length === 2);
  const requests = row.rows.map(entry => structuredClone(entry.request));
  for (const segments of paths) {
    for (const request of requests) {
      const parent = segments.slice(0, -1).reduce((value, key) => value[key], request);
      delete parent[segments.at(-1)];
    }
  }
  assert.deepEqual(requests[0], requests[1]);
  assert.notEqual(row.rows[0].inputHash, row.rows[1].inputHash);
  for (const entry of row.rows) {
    assert(entry.pass && entry.mathematicalHashMatch && entry.workersStarted === 1);
  }
  return row.rows;
}

const [padicLow, padicHigh] = pair('padic', [['precision', 'N']]);
const modulus = BigInt(padicLow.request.input.p) ** BigInt(padicLow.request.precision.N);
const lowResidues = padicLow.observation.finiteResidues;
const highResidues = padicHigh.observation.finiteResidues;
assert(lowResidues.length > 0 && lowResidues.length === highResidues.length);
for (const [i, low] of lowResidues.entries()) {
  assert.equal(BigInt(highResidues[i]) % modulus, BigInt(low));
}
const [seriesLow, seriesHigh] = pair('series', [['input', 'tailDegree']]);
const rational = value => value.split('/').concat('1').slice(0, 2).map(BigInt);
function compareRational(a, b) {
  const [p, q] = rational(a), [r, s] = rational(b);
  assert(q > 0n && s > 0n);
  const difference = p * s - r * q;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}
const tails = seriesLow.observation.tailRows.map((lo, i) => {
  const hi = seriesHigh.observation.tailRows[i];
  assert.equal(lo.Y, hi.Y);
  assert(compareRational('0', hi.phiTailUpper) <= 0);
  assert(compareRational(hi.phiTailUpper, lo.phiTailUpper) <= 0);
  return { Y: lo.Y, lowTailUpper: lo.phiTailUpper, highTailUpper: hi.phiTailUpper };
});
assert(tails.some(row => compareRational(row.highTailUpper, row.lowTailUpper) < 0));

const [spatialLow, spatialHigh] = pair('spatial', [['input', 'radialCount']]);
const exterior = r101.finiteNumericBounds.exteriorVelocity;
assert.equal(spatialHigh.worker.mathematicalHash, r101.cases.find(row => row.id === 'exterior').mathematicalHash);
assert.equal(exterior.pointCount, spatialHigh.observation.pointCount);
assert.equal(spatialLow.observation.pointCount, 16 * spatialLow.request.input.radialCount);
assert.deepEqual(spatialLow.observation.first, spatialHigh.observation.first);
assert.deepEqual(spatialLow.observation.last, spatialHigh.observation.last);
assert(exterior.maximumCoordinateErrorUpper <= exterior.absoluteTolerance);
const [latticeSmall, latticeLarge] = pair('lattice-volume', [['input', 'lattice', 'Ns']]);
for (const row of [latticeSmall, latticeLarge]) {
  const { lattice, measurements } = row.observation;
  assert.equal(measurements.action, 0);
  assert.equal(measurements.meanPlaquette, 1);
  assert.equal(measurements.plaquetteCount, 6 * lattice.Ns ** 3 * lattice.Nt);
}
const [sampleLow, sampleHigh] = pair('samples', [['input', 'observation', 'samplesPerAxis']]);
assert.equal(sampleLow.observation.physicalFieldHash, sampleHigh.observation.physicalFieldHash);
assert.deepEqual(sampleLow.observation.targets, sampleHigh.observation.targets);
assert.equal(sampleLow.observation.points, sampleLow.observation.samplesPerAxis ** 3);
assert.equal(sampleHigh.observation.points, sampleHigh.observation.samplesPerAxis ** 3);

async function workerJob(request) {
  let started = 0;
  const engine = createM2Engine({
    workerFactory(source) {
      started++;
      return nativeWorkerFactory(source);
    },
  });
  try {
    const queued = await engine.submit(request);
    const completed = await engine.wait(queued.id);
    assert.equal(started, 1);
    assert.equal((await engine.environment()).workerSha256, workerSHA256);
    assert.equal(completed.status, 'COMPLETED', JSON.stringify(completed.result?.blockers));
    return {
      request: completed.request, inputHash: completed.inputHash,
      mathematicalHash: completed.mathematicalHash, result: completed.result,
    };
  } finally {
    engine.dispose();
  }
}

function requireCertifiedBound(observedUpper, bound, quantity) {
  if (!(Number.isFinite(observedUpper) && Number.isFinite(bound) && observedUpper <= bound)) {
    throw Error(`CERTIFIED_BOUND_VIOLATION ${quantity}`);
  }
}

const fixedVolume = await workerJob(getExamples().find(x => x.id === 'm2-bpst-fixed-volume').request);
assert.equal(fixedVolume.result.convergence.fixedPhysicalVolume, true);
assert.equal(fixedVolume.result.convergence.quantumContinuumTheory, false);
const fixedVolumeLevels = fixedVolume.result.levels.map(row => {
  const { chargeErrorUpper, energyErrorUpper } = row.certificate;
  requireCertifiedBound(row.chargeError.upper, chargeErrorUpper, 'fixed box real charge');
  requireCertifiedBound(row.energyError.upper, energyErrorUpper, 'fixed box energy');
  return {
    cellsPerCoordinate: row.cellsPerCoordinate,
    spatialSpacing: row.spatialSpacing,
    temporalSpacing: row.temporalSpacing,
    chargeError: row.chargeError,
    energyError: row.energyError,
    chargeErrorUpper, energyErrorUpper,
  };
});
assert.equal(fixedVolumeLevels.length, 3);
for (let i = 1; i < fixedVolumeLevels.length; i++) {
  const a = fixedVolumeLevels[i - 1], b = fixedVolumeLevels[i];
  assert(b.spatialSpacing < a.spatialSpacing && b.temporalSpacing < a.temporalSpacing);
  assert(b.chargeError.upper < a.chargeError.lower && b.energyError.upper < a.energyError.lower);
  assert(b.chargeErrorUpper < a.chargeErrorUpper && b.energyErrorUpper < a.energyErrorUpper);
}
const negative = fixedVolumeLevels[0];
assert.throws(
  () => requireCertifiedBound(negative.energyErrorUpper * 2, negative.energyErrorUpper, 'mutated energy upper'),
  /CERTIFIED_BOUND_VIOLATION mutated energy upper/,
);
console.log('R1-02 fixed physical BPST box refinement, bound checks and violating-row rejection PASS');

const sampler = getExamples().find(x => x.id === 'm2-su2-haar-reference').request;
const results = [];
function statisticalCheck(statistic, reference, retained) {
  const { count, mean, effectiveSampleSize, standardError, integratedAutocorrelationTime,
    confidenceInterval95, windowTruncated, batch, autocorrelation } = statistic;
  assert.equal(count, retained);
  assert(effectiveSampleSize >= statisticsPlan.minimumEffectiveSampleSize);
  assert(integratedAutocorrelationTime >= 0.5 && standardError > 0 && Number.isFinite(standardError));
  assert.equal(windowTruncated, false);
  assert(batch.binCount >= 8);
  assert.equal(confidenceInterval95.rigorous, false);
  assert(reference.lower <= reference.upper);
  const lo = mean - statisticsPlan.gaussianMultiplier * standardError;
  const hi = mean + statisticsPlan.gaussianMultiplier * standardError;
  assert(lo <= reference.upper && hi >= reference.lower);
  return {
    mean, effectiveSampleSize, standardError, integratedAutocorrelationTime,
    estimatedLagOneCorrelation: autocorrelation[1], batch,
    reference, conditionalGaussianCheckWindow: [lo, hi], confidenceInterval95,
  };
}
for (const retained of statisticsPlan.retainedSampleCounts) {
  for (const label of statisticsPlan.replicaLabels) {
    const request = structuredClone(sampler);
    request.input.seed = `MathScope-R102-20261111/${retained}/${label}`;
    request.input.samples = retained;
    request.input.burnIn = statisticsPlan.burnIn;
    const job = await workerJob(request);
    const data = job.result;
    assert.equal(data.history.length, retained);
    assert.equal(data.comparison.passed, true);
    const mean = statisticalCheck(data.statistics, data.certifiedReference.meanTrace, retained);
    const secondMoment = statisticalCheck(data.secondMomentStatistics, data.certifiedReference.secondMoment, retained);
    results.push({
      retained, label, seed: request.input.seed, inputHash: job.inputHash,
      mathematicalHash: job.mathematicalHash, sourceHash: data.sourceHash,
      acceptance: data.acceptance, mean, secondMoment,
    });
    console.log(`R1-02 SU2 reference samples=${retained} replica=${label} ESS=${mean.effectiveSampleSize} PASS`);
  }
}
assert.equal(new Set(results.map(row => row.inputHash)).size, 6);
assert.equal(new Set(results.map(row => row.sourceHash)).size, 6);
assert.equal(statisticsPlan.comparisons, 2 * results.length);
const meansByCount = statisticsPlan.retainedSampleCounts.map(retained => {
  const rows = results.filter(row => row.retained === retained);
  const average = values => values.reduce((a, b) => a + b, 0) / values.length;
  return {
    retained,
    replicaAverageMean: average(rows.map(row => row.mean.mean)),
    averagePredictedMeanStandardError: average(rows.map(row => row.mean.standardError)),
    averageEffectiveSampleSize: average(rows.map(row => row.mean.effectiveSampleSize)),
  };
});

const result = {
  schema: 'MathScope.M4.R102IndependentRefinement/1',
  originalCriterion: 'R1-02',
  originalReplayManifestSHA256: digest(replayBytes),
  r101ReceiptSHA256: digest(r101Bytes),
  workerSHA256,
  padic: {
    precision: [padicLow.request.precision.N, padicHigh.request.precision.N],
    lowerModulus: modulus.toString(), lowResidues, highResidues,
    bothPointCounts: [padicLow.observation.pointCount, padicHigh.observation.pointCount],
  },
  series: {
    orders: [seriesLow.request.input.tailDegree, seriesHigh.request.input.tailDegree],
    exactRationalTailUpperBounds: tails,
  },
  spatial: {
    radialCounts: [spatialLow.observation.radialCount, spatialHigh.observation.radialCount],
    pointCounts: [spatialLow.observation.pointCount, spatialHigh.observation.pointCount],
    fixedBoundarySampleObservations: [spatialLow.observation.first, spatialLow.observation.last],
    highResolutionSampleVelocityAbsoluteErrorUpper: exterior.maximumCoordinateErrorUpper,
    scope: 'Finite samples of the same exterior formula at fixed endpoints',
  },
  lattice: {
    fixedSpacingVolumes: [latticeSmall, latticeLarge].map(({ observation: { lattice, measurements } }) => ({
      spatialSpacing: lattice.as, spatialExtent: lattice.as * lattice.Ns,
      action: measurements.action, meanPlaquette: measurements.meanPlaquette,
      plaquetteCount: measurements.plaquetteCount,
    })),
    fixedPhysicalBox: {
      inputHash: fixedVolume.inputHash, mathematicalHash: fixedVolume.mathematicalHash,
      lengths: fixedVolume.result.model.lengths, levels: fixedVolumeLevels,
      reference: fixedVolume.result.reference,
    },
    violatingBoundControl: 'CERTIFIED_BOUND_VIOLATION mutated energy upper',
  },
  samples: {
    deterministicDisplayPointCounts: [sampleLow.observation.points, sampleHigh.observation.points],
    fixedPhysicalFieldHash: sampleLow.observation.physicalFieldHash,
    statisticalDesign: statisticsPlan,
    pseudorandomReplicas: results,
    meansAndPredictedErrors: meansByCount,
    independentSeedScope: 'Separate seeded PRNG streams; statistical independence is a model assumption',
  },
  convergenceTableTheoremIssued: false,
  verdict: 'PASS_SUPPORTED_R1_02_FINITE_REFINEMENT',
};
await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ verdict: result.verdict, meansByCount }));
