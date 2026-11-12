/** Enclose all fixed radial and original scalar leaves of the 67-jet program. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {load, sourceArithmetic} from './source_arithmetic.mjs';

const [tree, traceFile, historicalFile, thresholdsFile, slowFile, out] = process.argv.slice(2);
assert(tree && traceFile && historicalFile && thresholdsFile && slowFile && out);
const trace = await load(traceFile, 'bcf8b4303a2cd53c5cb0b187ccb3580936a255a4e3c4985db67a81a91934ebea');
const historical = await load(historicalFile, '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0');
const thresholds = await load(thresholdsFile, 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const slow = await load(slowFile, '6c8ad3386dfc2d5e392368a4884eacbd2088531821edb37f3a4c471f729410fc');
assert.equal(thresholds.complete, true);
assert.equal(slow.verifiedSlowAtoms, 67);
const {N, evaluateClosedArithmeticDefinitions, tracedArithmeticEvaluator} =
  await sourceArithmetic(tree, thresholds.sourcePins, 'coarse-upper');
const fixed = trace['fixed-radial'];
const hosted = trace['hosted-original'];
const names = [...new Set([...fixed.sourceParameters, ...hosted.sourceParameters])];
const parameters = evaluateClosedArithmeticDefinitions(historical.definitions, N, {names}).values;
const fixedBoundaries = new Map(fixed.nonArithmeticBoundaries.map(({id}) =>
  [id, N.fromClosed(historical.boundaryIntervals[id])]));
assert.deepEqual([...fixedBoundaries.keys()], [239, 257, 275]);
const radial = tracedArithmeticEvaluator(fixed, N, {parameters, boundaries: fixedBoundaries});
const original = tracedArithmeticEvaluator(hosted, N, {parameters});
const result = {
  status: 'VERIFIED_INITIALIZED_FIXED_NUMERICAL_INPUTS',
  sourceNodes: trace.sourceNodes, sourceSHA256: trace.sourceSHA256,
  fixedRadial: {}, hostedOriginal: {},
  remaining: {backgroundC8: trace.leaves['background-c8'], targetC7: trace.leaves['target-c7']},
  scope: 'Enclosures for fixed operands of the original initialized annular program.',
  finalJets: '0/67', release: 'HOLD',
};
for (const id of trace.leaves['fixed-radial']) {
  const interval = N.toClosed(radial.value(id));
  assert(N.compareEndpoints(interval.lower, {rational: '0'}) >= 0, String(id));
  result.fixedRadial[id] = interval;
}
// The original ell minimum includes Bnorm^512, and B = (ell_min+10) log 2.
// The pinned nonnegative Bnorm also includes the literal 2^128 summand.
const B = N.fromClosed(thresholds.thresholds['10']);
const ell = N.fromClosed(historical.archivedEllMinimumInterval);
const BnormUpper = N.exp(N.div(N.log(N.mul(N.point('2'), B)), N.point('512')));
const Bnorm = {
  lower: {rational: String(1n << 128n)},
  upper: N.toClosed(BnormUpper).upper,
};
const originalBounds = {300170: N.fromClosed(Bnorm), 617432: ell};
for (const id of hosted.roots) {
  const interval = N.toClosed(originalBounds[id] ?? original.value(id));
  assert(N.compareEndpoints(interval.lower, {rational: '0'}) > 0, String(id));
  result.hostedOriginal[id] = interval;
}
const slowAtoms = [...trace.leaves['slow-background-atom'], ...trace.leaves['slow-background-pressure-atom']];
assert.equal(new Set(slowAtoms).size, 48);
for (const name of slowAtoms) assert(slow.atoms[name], name);
result.availableSlowAtoms = slowAtoms;
// The exact source at #28826 is XR*exp(#319), on the same retained closure.
const {N: exact} = await sourceArithmetic(tree, thresholds.sourcePins);
const [xr, meanExponential] = historical.definitions.X0Imean.product;
assert.deepEqual(xr, {ref: 'XR'});
const defs = {...historical.definitions, meanPatchUpperExponent: {sum: [meanExponential.exp, {integer: 5}]}};
const geometryNames = [...new Set([...fixed.sourceParameters, 'X0Imean', 'Xa', 'XR', 'meanPatchUpperExponent'])];
const geometry = evaluateClosedArithmeticDefinitions(defs, exact, {names: geometryNames}).values;
const geometryBoundaries = new Map([...fixedBoundaries.keys()].map(id =>
  [id, exact.fromClosed(historical.boundaryIntervals[id])]));
const exactRadial = tracedArithmeticEvaluator(fixed, exact, {parameters: geometry, boundaries: geometryBoundaries});
const Xa = exact.toClosed(geometry.get('Xa'));
const X0 = exact.toClosed(geometry.get('X0Imean'));
const upperMeanExponent = exact.toClosed(geometry.get('meanPatchUpperExponent'));
const outerExponent = exact.toClosed(exactRadial.value(319));
assert.equal(exact.compareEndpoints(exact.toClosed(geometry.get('XR')).lower, {rational: '0'}), 1);
assert.equal(exact.compareEndpoints(Xa.lower, {rational: '0'}), 1);
assert.equal(exact.compareEndpoints(X0.lower, Xa.upper), 1);
assert.equal(exact.compareEndpoints(outerExponent.lower, upperMeanExponent.upper), 1);
assert.equal(N.compareEndpoints(result.hostedOriginal[8].upper, {rational: '1'}), -1);
result.pressureMassSupport = {
  status: 'VERIFIED_Xa_LT_X0Imean_AND_exp5_X0Imean_LT_Xb',
  Xa, X0Imean: X0, outerExponent, upperMeanExponent,
  commonPositiveFactorCancelled: 'XR',
  originalIntegral: 633724, originalEndpoints: [633710, 633712],
  originalLambdaPositiveAndLessThanOne: true, chartBandPremise: ['1/2', '2'],
  arithmetic: exact.report(),
};
result.radialTrace = radial.report();
result.hostedTrace = original.report();
result.arithmetic = N.report();
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log('PASS', Object.keys(result.fixedRadial).length, 'fixed radial,', hosted.roots.length,
  'original scalars,', slowAtoms.length, 'slow-field leaves and Imean support');
