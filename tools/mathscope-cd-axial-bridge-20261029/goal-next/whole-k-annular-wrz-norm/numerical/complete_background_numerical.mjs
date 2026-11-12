/** Combine the active and exterior leading bounds with all original C8 inputs. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {load, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [tree, partialFile, transportFile, activeFile, outerFile, fixedFile, historicalFile, thresholdsFile, out] =
  process.argv.slice(2);
assert(tree && partialFile && transportFile && activeFile && outerFile && fixedFile && historicalFile && thresholdsFile && out);
const pins = {
  partial: '4d2fa5753568e00bacbb47126909b7b3219f55f7b9cb8a0f45599ce2b0d3d19f',
  transport: 'b47b4c5c6714de515c5b2a51b1434fb6a31b186b1d004b05e908611987af13f4',
  active: '891994bbcb30be98cfb6749a5e09eb6f4a2cfbb437d9e26dcf94b894fbe4e5c4',
  outer: 'a2937d2c2066946f3dbe0a1be2a883766266a0b984914b67780ab81e55eadcbb',
  fixed: '9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c',
  historical: '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0',
  thresholds: 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf',
};
const [partial, transport, active, outer, fixed, historical, thresholds] = await Promise.all(
  [partialFile, transportFile, activeFile, outerFile, fixedFile, historicalFile, thresholdsFile]
    .map((file, i) => load(file, Object.values(pins)[i])));
assert.equal(transport.originalGraphSHA256, partial.originalGraphSHA256);
assert.equal(active.sourceProfile, outer.source.parameterExpressionSHA256);
assert.equal(active.requested.radialOrder, 10);
assert.equal(active.requested.etaOrder, 10);
assert.equal(active.bounds.F0active.domain.X[1], outer.domain.X[0]);
assert.deepEqual(active.bounds.F0active.domain.eta, outer.domain.eta);
assert.equal(outer.domain.X[1], 'infinity');
assert.equal(outer.physicalRows.length, 7 * 66);
assert.equal(outer.normalizedMaximum, '2^(-65343)');
assert.equal(fixed.pressureMassSupport.commonPositiveFactorCancelled, 'XR');
const {N, evaluateClosedArithmeticDefinitions, tracedArithmeticEvaluator} =
  await sourceArithmetic(tree, thresholds.sourcePins, 'coarse-upper');
const geometryNames = [...new Set([...active.trace.sourceParameters, ...transport.trace.F.sourceParameters, 'XR', 'Xa'])];
const parameters = evaluateClosedArithmeticDefinitions(historical.definitions, N, {names: geometryNames}).values;
const leading = tracedArithmeticEvaluator(active.trace, N, {parameters});
const one = N.one();
// The exterior bound is < 1 since X >= Xplus > Xv > 1. The active upper
// encloses 0 <= X <= Xplus and the closed eta interval.
const F0 = N.max([one, leading.value(active.trace.roots.F0Active)]);
const U0 = N.max([one, leading.value(active.trace.roots.U0Global)]);
const Xb = N.mul(parameters.get('XR'), N.exp(N.fromClosed(fixed.pressureMassSupport.outerExponent)));
const Xlo = N.div(parameters.get('Xa'), N.point('2'));
const width = N.sub(N.mul(N.point('2'), Xb), Xlo);
const zero = {rational: '0'};
assert.equal(N.compareEndpoints(N.toClosed(width).lower, zero), 1);
const ftc = N.mul(N.point('3'), N.mul(N.add(one, width), N.add(one, F0)));
for (const [key, value] of Object.entries(partial.evaluatedProfiles)) {
  parameters.set(key, N.fromClosed(value.interval));
}
parameters.set('ftc_0:F', N.fromClosed({lower: zero, upper: N.toClosed(ftc).upper}));
const F = tracedArithmeticEvaluator(transport.trace.F, N, {parameters});
const backgroundC8 = {...partial.backgroundC8};
for (const id of transport.trace.F.roots) {
  const upper = N.toClosed(F.value(id)).upper;
  assert.equal(N.compareEndpoints(upper, zero), 1, String(id));
  backgroundC8[id] = {lower: zero, upper};
}
assert.equal(Object.keys(backgroundC8).length, 18);
const result = {
  status: 'VERIFIED_ALL_18_ORIGINAL_BACKGROUND_C8_NUMERICAL_UPPER_ENDPOINTS',
  originalGraphSHA256: transport.originalGraphSHA256, pins, backgroundC8,
  leadingOrdinaryC10: {F0: N.toClosed(F0).upper, U0: N.toClosed(U0).upper},
  leadingFTCUpper: N.toClosed(ftc).upper, Xb: N.toClosed(Xb),
  checkedFTCRoots: transport.checkedFTCRoots, checkedFaces: transport.checkedFaces,
  remainingInitialLeaves: '16 weighted target C7 numerical upper endpoints',
  arithmetic: N.report(), finalJets: '0/67', release: 'HOLD',
};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log('PASS all 18 original background C8 leaves, and original leading F0/U0 C10');
