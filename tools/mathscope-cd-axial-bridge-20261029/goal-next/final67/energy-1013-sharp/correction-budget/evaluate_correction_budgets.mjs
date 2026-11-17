/** Directed sufficient amplitude thresholds for the original annular energy comparison. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sourceArithmetic} from '../../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [goal, runtime, historicalPath, output] = process.argv.slice(2);
assert.ok(output);
const pins = {
  thresholds: 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf',
  historical: '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0',
  fixed: '9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c',
  background: '4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966',
  outer: 'c4f86049b4f20a63443bd610b76313926717576abca9288ae1f9277b3ae4aa37',
  cutoff: '0f2ef1dff821d7d936a9c254a5e846f6557445e2d3ccf97f3201915a6a949298',
  late: 'c9d93aa5a568db6ca417b16eb7928e735af38f85c80a1c616cc66a04409c940a',
  radial: '0d67104a020f0e7b57cdbeabc4bade9d5401cbe795cdde9a7b0e60ce90cb8c5d',
  K: '0e1984e6f872e9a167b7920d31a55b4888a807c359a0c38dbff9f8f8af5f4acb',
};
const paths = {
  thresholds: 'whole-k-selector-scales/historical-scale-arithmetic-result.json',
  fixed: 'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json',
  background: 'whole-k-annular-wrz-norm/numerical/background-c8-complete.json',
  outer: 'whole-k-core-force/annular-slow-force-energy.json',
  cutoff: 'final67/first-scale-selector.json',
  late: 'final67/energy-1013-sharp/late-annular/late-annular-scales.json',
  radial: 'final67/moving-heat-energy/radial-force.json',
  K: 'primary-forced-join/active-n3-c5-binding/norm-leading/n3-whole-k.json',
};
const sources = Object.fromEntries(await Promise.all(Object.entries(pins).map(async ([name, pin]) => [
  name, await load(name === 'historical' ? historicalPath : resolve(goal, paths[name]), pin),
])));
assert.equal(sources.late.status, 'EXACT_COARSE_BOUND_OBSTRUCTION_AND_CONDITIONAL_SHARP_SCALE');
assert.equal(sources.radial.status, 'VERIFIED_ACTUAL_MOVING_HEAT_FULL_VECTOR_FORCE_INTERVAL');
assert.equal(sources.outer.geometry.factors.C_z, '20/z0');
assert.equal(sources.outer.geometry.factors.C_zz, '692/z0^2');
const stage = new Map(sources.cutoff.linearSeedCutoffProof.composedDerivatives
  .map(row => [row.derivative, row.boundCoefficient]));
assert.equal(stage.get('chi_z'), 20);
assert.equal(stage.get('chi_z_z'), 732);
// Convert from z0 to q, using q/tau0 <= 2 and 0<D<1.
const axialFirst = 2n * 20n, axialSecond = 4n * 692n;
const first = axialFirst + BigInt(stage.get('chi_z'));
const second = axialSecond + 2n * axialFirst * BigInt(stage.get('chi_z')) + BigInt(stage.get('chi_z_z'));
assert.ok(first <= 64n && second <= 8192n);
assert.ok(2n*(1n+64n)+1n <= (1n<<8n));
assert.ok(2n*(1n+2n*64n+8192n)+1n+64n <= (1n<<15n));
assert.ok(32n*(3n*(1n<<20n)+18n*(1n<<34n)) < (1n<<44n));
assert.ok(3n*(1n<<44n) < (1n<<46n));
assert.equal((1n<<46n)*(1n<<26n), 1n<<72n);
assert.ok(25n < 32n);

const {N, evaluateClosedArithmeticDefinitions} = await sourceArithmetic(runtime, sources.thresholds.sourcePins, 'coarse-upper');
const n = value => N.point(String(value));
const ep = (x, side) => N.toClosed(x)[side];
const compare = (a, b) => N.compareEndpoints(a, b);
const {values} = evaluateClosedArithmeticDefinitions(sources.historical.definitions, N, {names: ['h']});
const h = values.get('h');
const ell = N.fromClosed(sources.fixed.hostedOriginal[617432]);
const hLogTau = N.neg(N.mul(h, N.mul(N.add(ell, n(15)), N.log(n(2)))));
const Xb = N.fromClosed(sources.background.Xb);
assert.equal(compare(ep(Xb, 'lower'), {rational: '1'}), 1);
assert.equal(compare(ep(h, 'lower'), {rational: '0'}), 1);
assert.equal(compare(ep(h, 'upper'), {rational: '1/64'}), -1);
const base = N.mul(n(`1/${1n<<36n}`), N.pow(Xb, -2));
const stages = [1, 2, 3, 4].map(j => {
  const threshold = N.mul(base, N.exp(N.mul(n(`-${j}/10`), hLogTau)));
  const lower = ep(threshold, 'lower');
  assert.equal(compare(lower, {rational: '1'}), 1);
  const comparison = compare(sources.K.enclosure.upper, lower);
  assert.notEqual(comparison, null);
  return {stage: j, admissibleUniformConstant: N.toClosed(threshold),
    coarseOriginalKUpperFitsThreshold: comparison <= 0,
    comparisonOfOriginalKUpperToThresholdLower: comparison};
});
const report = {
  schema: 'MathScope.N7.ActualAnnularCorrectionAmplitudeBudgets/1',
  status: 'DIRECTED_SUFFICIENT_ORIGINAL_ANNULAR_COEFFICIENT_THRESHOLDS',
  sourcePins: pins, stages, hLogTau: N.toClosed(hLogTau), Xb: N.toClosed(Xb),
  requiredFields: 'Original uncut A_j spatial C2 and B_j spatial C1 with gain jh/10, as normalized in the proof; axes are Cartesian.',
  initializedTarget: 'Require 2(E_0+D_0) <= 2^-26 S_R separately.',
  singleStageTarget: 'For each 1<=j<=4, C_j <= threshold.lower implies 2(E_j+D_j) <= 2^-26 S_R.',
  totalTarget: 'Five contributions in the energy norm sum to at most 25 * 2^-26 S_R < 2^-21 S_R.',
  actualStageBoundsVerified: 0, N706: 'OPEN', N805: 'OPEN', finalJets: 0, release: 'HOLD',
  arithmetic: N.report(),
};
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(stages.map(row => [row.stage, row.comparisonOfOriginalKUpperToThresholdLower])));
