import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoArg, r102Arg, outputArg] = process.argv.slice(2);
if (!repoArg || !r102Arg || !outputArg) {
  throw Error('Usage: node r1_spatial_grid.mjs REPO R102_RECEIPT OUTPUT');
}
const repo = resolve(repoArg);
const pin = '9595b4de5a1065b694d225c0ad2a14d5aa4435a9';
const heatPath = 'research-ide/mathscope-m1/navier/heat.mjs';
const numericsPath = 'research-ide/mathscope-m1/navier/numerics.mjs';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceHashes = [];
for (const path of [heatPath, numericsPath]) {
  const original = execFileSync('git', ['-C', repo, 'show', `${pin}:${path}`]);
  const installed = await readFile(resolve(repo, path));
  assert(Buffer.from(installed.toString('utf8').replaceAll('\r\n', '\n')).equals(original));
  sourceHashes.push({ path, pinnedSHA256: digest(original), installedSHA256: digest(installed) });
}
const originalReceipt = await readFile(r102Arg);
assert.equal(JSON.parse(originalReceipt).verdict, 'PASS_SUPPORTED_R1_02_FINITE_REFINEMENT');
const importSource = file => import(pathToFileURL(resolve(repo, file)).href);
const { taylorGreenPoint } = await importSource(heatPath);
const { point, iadd, imul, idiv, iscale, iexp, isub, maxabs } = await importSource(numericsPath);
const input = { time: 0.19, viscosity: 1 };
const tolerance = 1e-8;
const gridSizes = [4, 8];
const amp2 = iexp(iscale(imul(point(input.time), point(input.viscosity)), -4));
const exactContinuousMean = iscale(amp2, 0.25);
const sinSquaredTimesTwo = [0, 1, 2, 1, 0, 1, 2, 1];
const levels = [];
for (const K of gridSizes) {
  let storedEnergySum = point(0), expectedNumeratorSum = 0n, maxPointErrorUpper = 0;
  for (let i = 0; i < K; i++) {
    for (let j = 0; j < K; j++) {
      for (let k = 0; k < K; k++) {
        const sx2 = sinSquaredTimesTwo[(8 / K) * i];
        const sy2 = sinSquaredTimesTwo[(8 / K) * j];
        const numerator = sx2 * (2 - sy2) + (2 - sx2) * sy2;
        expectedNumeratorSum += BigInt(numerator);
        const coords = [i, j, k].map(index => index * 2 * Math.PI / K);
        const measured = taylorGreenPoint(coords, input);
        const measuredEnergy = iscale(measured.velocity.reduce((sum, v) =>
          iadd(sum, imul(point(v), point(v))), point(0)), 0.5);
        const exactNodeEnergy = iscale(amp2, numerator / 8);
        maxPointErrorUpper = Math.max(maxPointErrorUpper, maxabs(isub(measuredEnergy, exactNodeEnergy)));
        storedEnergySum = iadd(storedEnergySum, measuredEnergy);
      }
    }
  }
  // Exact discrete averaging of sin^2/cos^2 on the two specified grids.
  assert.equal(expectedNumeratorSum, 2n * BigInt(K) ** 3n);
  const discreteStoredMean = idiv(storedEnergySum, point(K ** 3));
  const errorUpper = maxabs(isub(discreteStoredMean, exactContinuousMean));
  assert(errorUpper <= tolerance && maxPointErrorUpper <= tolerance);
  levels.push({
    K, points: K ** 3, storedVelocityEnergyMeanEnclosure: discreteStoredMean,
    exactContinuousEnergyMeanEnclosure: exactContinuousMean,
    exactFourierGridQuadratureError: 0, meanEnergyDiscrepancyUpper: errorUpper,
    maximumPointEnergyDiscrepancyUpper: maxPointErrorUpper,
  });
}
const result = {
  schema: 'MathScope.M4.R102SpatialGridMean/1',
  sourceCommit: pin, sourceHashes,
  linkedR102ReceiptSHA256: digest(originalReceipt),
  input, tolerance, levels,
  scope: 'Fixed-time Taylor–Green benchmark. The exact grids are evaluated using rational squared-trigonometric values and the stored binary64 velocities with outward summation.',
  theoremFromConvergenceTable: false,
  verdict: 'PASS_INDEPENDENT_SPATIAL_K_ENERGY_MEAN',
};
await writeFile(outputArg, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ verdict: result.verdict, levels }));
