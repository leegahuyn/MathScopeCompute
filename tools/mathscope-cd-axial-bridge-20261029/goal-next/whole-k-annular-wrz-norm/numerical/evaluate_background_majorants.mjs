/** Evaluate profile majorants and transfer them through the archived C8 graph. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {load, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [tree, majorantsFile, transferFile, historicalFile, thresholdsFile, out] = process.argv.slice(2);
assert(tree && majorantsFile && transferFile && historicalFile && thresholdsFile && out);
const majorantsSHA256 = 'b3a14675ddad1bdad7913a184f23b27161ba852994898a9c801b315ae6da27da';
const majorants = await load(majorantsFile, majorantsSHA256);
const transfer = await load(transferFile, 'b47b4c5c6714de515c5b2a51b1434fb6a31b186b1d004b05e908611987af13f4');
const historical = await load(historicalFile, '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0');
const thresholds = await load(thresholdsFile, 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
assert.equal(majorants.schema, 'MathScope.N7.OriginalBackgroundC8FTCMajorants/1');
assert.deepEqual(majorants.originalPrefix, transfer.originalPrefix);
assert.deepEqual(majorants.box, transfer.box);
assert.equal(majorants.ordinaryDerivativeOrder, 10);
assert.equal(majorants.bindings.length, 315);
const bindingIds = new Set();
const byField = Object.assign({}, ...Object.values(transfer.trace).map(x => x.substitutedArchivedFTCRoots));
for (const {profile, archivedRoot, upper} of majorants.bindings) {
  assert(!bindingIds.has(archivedRoot), String(archivedRoot));
  bindingIds.add(archivedRoot);
  assert.equal(byField[archivedRoot], 'ftc_' + profile);
  assert.equal(majorants.trace.roots['ftc_' + profile], upper);
}
assert.deepEqual(Object.keys(byField).filter(id => !bindingIds.has(Number(id))).map(id => byField[id]),
  Array(45).fill('ftc_0:F'));
const {N, evaluateClosedArithmeticDefinitions, tracedArithmeticEvaluator} =
  await sourceArithmetic(tree, thresholds.sourcePins, 'coarse-upper');
const params = [...new Set([...majorants.trace.sourceParameters,
  ...Object.values(transfer.trace).flatMap(x => x.sourceParameters)])];
const parameters = evaluateClosedArithmeticDefinitions(historical.definitions, N, {names: params}).values;
const boundaries = new Map(majorants.trace.nonArithmeticBoundaries.map(({id}) =>
  [id, N.fromClosed(historical.boundaryIntervals[id])]));
assert.deepEqual([...boundaries.keys()], [239, 257, 275]);
const arithmetic = tracedArithmeticEvaluator(majorants.trace, N, {parameters, boundaries});
const zero = {rational: '0'};
const result = {
  status: 'INCOMPLETE',
  majorantsSHA256, originalGraphSHA256: transfer.originalGraphSHA256,
  evaluatedProfiles: {}, backgroundC8: {}, unresolved: ['ftc_0:F'], finalJets: '0/67', release: 'HOLD',
};
async function save() {
  result.arithmetic = N.report();
  await writeFile(out, JSON.stringify(result, null, 2) + '\n');
}
await save();
for (const [name, root] of Object.entries(majorants.trace.roots)) {
  if (!name.startsWith('ftc_')) continue;
  const numerical = N.toClosed(arithmetic.value(root));
  assert.equal(N.compareEndpoints(numerical.upper, zero), 1, name);
  const closed = {lower: zero, upper: numerical.upper};
  parameters.set(name, N.fromClosed(closed));
  result.evaluatedProfiles[name] = {root, interval: closed};
  await save();
  console.log('PASS numerical majorant', name);
}
const G = tracedArithmeticEvaluator(transfer.trace.G, N, {parameters});
for (const root of transfer.trace.G.roots) {
  const upper = N.toClosed(G.value(root)).upper;
  assert.equal(N.compareEndpoints(upper, zero), 1, String(root));
  result.backgroundC8[root] = {lower: zero, upper};
}
assert.equal(Object.keys(result.backgroundC8).length, 9);
result.trace = {sourceMajorants: arithmetic.report(), originalG: G.report()};
result.status = 'VERIFIED_NINE_AXIAL_BACKGROUND_C8_NUMERICAL_UPPER_ENDPOINTS';
await save();
console.log('PASS all nine original axial background C8 leaves');
