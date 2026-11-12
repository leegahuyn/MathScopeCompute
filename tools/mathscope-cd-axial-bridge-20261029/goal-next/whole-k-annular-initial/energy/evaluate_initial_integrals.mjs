/** Transfer the localized initial annular bounds through the original energy normalization. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sourceArithmetic} from '../numerical/source_arithmetic.mjs';

const args = process.argv.slice(2);
assert.equal(args.length, 5, 'Provide GOAL_NEXT ORIGINAL_RUNTIME HISTORICAL_INPUT ANNULAR_MEASURE OUTPUT');
const [goal, runtime, historicalFile, measureFile, out] = args;
const pins = {
  localized: '74bf04dc47c3dfb1f38f1e6343fe855890390aaff8e24cf85c583eb83af1ca96',
  background: '4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966',
  fixed: '9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c',
  thresholds: 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf',
  cutoff: 'f9d6240fa7214d9fcb1254dd2b8a289723fdc0f4d08ee556dee8f7f8bb5d958a',
  historical: '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0',
  measure: 'ca68dc8805e20402773ff1ebb6dd8c311c01d4d188390876e17006383c6d274b',
};
const paths = {
  localized: resolve(goal, 'whole-k-annular-initial/localized-force/initialized-annular-localized-force.json'),
  background: resolve(goal, 'whole-k-annular-wrz-norm/numerical/background-c8-complete.json'),
  fixed: resolve(goal, 'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json'),
  thresholds: resolve(goal, 'whole-k-selector-scales/historical-scale-arithmetic-result.json'),
  cutoff: resolve(goal, 'whole-k-angular/whole-k-angular.json'),
  historical: historicalFile,
  measure: measureFile,
};
const {localized, background, fixed, thresholds, cutoff, historical, measure} = Object.fromEntries(
  await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, await load(path, pins[key])])),
);
assert.equal(localized.status, 'INITIALIZED_ANNULAR_ABSOLUTE_INTERVALS_FROM_SOURCE_OPERANDS');
assert.equal(localized.scope.field, 'initialized stage zero only');
assert.equal(localized.source.plateauSourceSHA256, measure.source.collarSHA256);
assert.equal(localized.source.fixedSHA256, pins.fixed);
assert.equal(measure.status, 'VERIFIED_ADDITIVE_ORIGINAL_CHART_MEASURE');
assert.equal(measure.finalFieldIntegrandsEvaluated, false);
assert.equal(cutoff.outer.initialSlice.status, 'EXACT_ZERO');
const initialCutoff = Object.values(cutoff.outer.initialSlice.cutoff_jets);
assert.equal(initialCutoff.length, 13);
for (const jet of initialCutoff) assert.deepEqual(jet.coefficient_interval, ['0', '0']);

const {N, evaluateClosedArithmeticDefinitions} = await sourceArithmetic(runtime, thresholds.sourcePins, 'coarse-upper');
const zero = {rational: '0'};
const q = x => N.point(String(x));
const absoluteUpper = upper => {
  assert.equal(N.compareEndpoints(upper, zero), 1);
  return N.fromClosed({lower: zero, upper});
};
const sum = xs => xs.reduce((a, b) => N.add(a, b), N.zero());
const square = x => N.mul(x, x);
const ell = N.fromClosed(fixed.hostedOriginal[617432]);
const h = N.fromClosed(fixed.hostedOriginal[9]);
assert.equal(N.compareEndpoints(N.toClosed(h).lower, zero), 1);
assert.equal(N.compareEndpoints(N.toClosed(h).upper, {rational: '1/64'}), -1);
const logTau0 = N.neg(N.mul(N.add(ell, q(15)), N.log(q(2))));
const tauPower = exponent => N.exp(N.mul(logTau0, exponent));
const tau0 = tauPower(q(1));
const twiceA = N.add(q(1), N.mul(q(2), h));

const actual = evaluateClosedArithmeticDefinitions(historical.definitions, N, {names: ['Xa']}).values;
const width = N.sub(N.fromClosed(background.Xb), actual.get('Xa'));
assert.equal(N.compareEndpoints(N.toClosed(width).lower, zero), 1);
const pi = N.fromClosed({lower: {rational: measure.piBracket[0]}, upper: {rational: measure.piBracket[1]}});
const common = N.mul(N.mul(N.sqrt(q(2)), pi), N.mul(tau0, width));
const geometricMeasure = ({central, axial}) => {
  const ax = N.mul(h, q(axial));
  const lower = N.toClosed(N.sub(q(central), N.mul(q(2), ax))).lower;
  const upper = N.toClosed(N.add(q(central), N.mul(q(4), ax))).upper;
  assert.equal(N.compareEndpoints(lower, zero), 1);
  return N.mul(common, N.fromClosed({lower, upper}));
};
const slice = geometricMeasure(measure.endpointTotalsAtRhoHalf);
const slab = geometricMeasure(measure.slabTotals);

const endpoints = localized.symmetricAbsoluteUpperEndpoints;
const velocity = endpoints.velocity.map(absoluteUpper);
const gradient = endpoints.gradient.map(row => row.map(absoluteUpper));
const force = endpoints.force.map(absoluteUpper);
const pressure = absoluteUpper(endpoints.pressure);
assert.equal(velocity.length, 3);
assert.equal(gradient.length, 3);
assert(gradient.every(row => row.length === 3));
assert.equal(force.length, 3);
const tauEnergy = tauPower(twiceA);
const tauDissipationAndWork = tauPower(N.add(twiceA, q(1)));
const tauForceSquared = tauPower(N.add(twiceA, q(2)));
const magnitudes = {
  endKineticEnergy: N.mul(q('1/2'), N.mul(slice, N.mul(tauEnergy, sum(velocity.map(square))))),
  transverseDissipation: N.mul(slab, N.mul(tauDissipationAndWork, sum(gradient.flatMap(row => row.slice(0, 2).map(square))))),
  axialDissipation: N.mul(slab, N.mul(tauDissipationAndWork, sum(gradient.map(row => square(row[2]))))),
  forceSquaredSpacetime: N.mul(slab, N.mul(tauForceSquared, sum(force.map(square)))),
  workAbsolute: N.mul(slab, N.mul(tauDissipationAndWork, sum(velocity.map((u, i) => N.mul(u, force[i]))))),
};
magnitudes.forceL1L2Squared = N.mul(q('1/2'), magnitudes.forceSquaredSpacetime);
// On either radial graph r_i(z,t) = sqrt(2 q X_i), the area cofactor is
// ±r_i(e_r - (r_i)_z e_z). Use the actual fixed axial support endpoints.
const z0 = tauPower(N.sub(q('1/2'), h));
const radius = N.sqrt(N.mul(q(4), N.mul(tau0, N.fromClosed(background.Xb))));
const axialSlope = N.div(N.mul(q(4), radius), z0);
const physicalRadialSpeed = N.div(N.mul(q(2), radius), tau0);
const energyDensity = N.mul(q('1/2'), sum(velocity.map(square)));
const derivativeR = sum(velocity.map((u, i) => N.mul(u, N.add(gradient[i][0], gradient[i][1]))));
const derivativeZ = sum(velocity.map((u, i) => N.mul(u, gradient[i][2])));
const normalVelocity = sum([velocity[0], velocity[1], N.mul(axialSlope, velocity[2])]);
const commonBoundary = N.mul(q(2), N.mul(N.sqrt(q(2)), N.mul(pi, N.mul(radius, tauDissipationAndWork))));
const boundaryMagnitudes = {
  diffusion: N.mul(commonBoundary, N.add(derivativeR, N.mul(axialSlope, derivativeZ))),
  advectionAndPressure: N.mul(commonBoundary, N.mul(N.add(pressure, energyDensity), normalVelocity)),
  movingBoundary: N.mul(commonBoundary, N.mul(physicalRadialSpeed, energyDensity)),
};
const symmetric = interval => ({lower: N.toClosed(N.neg(interval)).lower, upper: N.toClosed(interval).upper});
const integrals = Object.fromEntries(Object.entries(magnitudes).map(([key, interval]) => {
  const {upper} = N.toClosed(interval);
  assert.equal(N.compareEndpoints(upper, zero), 1, key);
  const lower = key === 'workAbsolute' ? N.toClosed(N.neg(interval)).lower : zero;
  return [key === 'workAbsolute' ? 'signedWork' : key, {lower, upper}];
}));

const result = {
  schema: 'MathScope.N7.DirectedOriginalInitializedAnnularIntegralBounds/1',
  status: 'INITIALIZED_ANNULAR_INTEGRAL_INTERVALS_FROM_SOURCE_OPERANDS',
  sourceSHA256: pins,
  domain: {X: ['Xa', 'Xb'], zetaSquared: ['0', '1/2'], rho: ['1/2', '1'], angles: 'all physical angles'},
  normalization: {
    fields: 'U=tau0^A*u; F=tau0^(A+1)*f',
    measure: 'dx dy d(z/z0) and increasing integration in rho with reversed physical time',
    dissipation: 'nu=1; tau0^(2A+1) times the squared physical derivatives',
    kineticEnergyPhysicalFactor: 'z0*tau0^(-2A)',
    forceSquaredSpacetimePhysicalFactor: 'z0*tau0^(-2A-1)',
  },
  measures: {commonFactor: N.toClosed(common), spatialAtRhoHalf: N.toClosed(slice), spacetime: N.toClosed(slab)},
  startKineticEnergy: {lower: zero, upper: zero},
  intervals: integrals,
  movingAnnulusFlux: {
    axialCutoffFaceExactlyZero: true,
    radialAreaCofactor: '±r_i(e_r - (r_i)_z e_z) dtheta dz',
    normalizedAbsoluteComponentBounds: Object.fromEntries(
      Object.entries(boundaryMagnitudes).map(([name, interval]) => [name, symmetric(interval)]),
    ),
    total: symmetric(sum(Object.values(boundaryMagnitudes))),
  },
  controls: {cellSubdivisionsConserveMeasure: true, independentFieldRefinements: false},
  limitation: 'Uniform initialized bounds. A moving boundary flux upper bound is included. Active corrections, whole-K balance and final-field convergence remain open.',
  arithmetic: N.report(),
  N706: 'OPEN',
  N805: 'OPEN',
  finalJets: '0/67',
  release: 'HOLD',
};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log('PASS original moving-annulus initialized energy, work, force and moving flux bounds');
