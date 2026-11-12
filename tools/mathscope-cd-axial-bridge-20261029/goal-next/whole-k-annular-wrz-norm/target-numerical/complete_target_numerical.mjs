/** Replay the original sixteen C7 bound expressions with directed FTC intervals. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {load, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [tree, transportFile, innerFile, middleFile, outerFile, historicalFile, thresholdsFile, out] =
  process.argv.slice(2);
assert(tree && transportFile && innerFile && middleFile && outerFile && historicalFile && thresholdsFile && out);
const pins = {
  transport: 'd316f03da261a99c717cc6afbd721ea3b44197bdf53949205c63726bfe9a2241',
  inner: '724daf0118dd8dc9b2d4af0597411bdee0995c99e68a25950a80749517737e4d',
  middle: '07cbe3e4cda7f95d289fffea64472a5fac45387f72a4414603fec663613458e9',
  outer: '363d484e7699ce86af70a6d7ff23bd0c0a10366a64a86e3379e60852cbe56d84',
  historical: '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0',
  thresholds: 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf',
};
const [transport, inner, middle, outer, historical, thresholds] = await Promise.all(
  [transportFile, innerFile, middleFile, outerFile, historicalFile, thresholdsFile]
    .map((file, index) => load(file, Object.values(pins)[index])));
assert.equal(transport.checkedFTCRoots, 216);
assert.equal(transport.checkedFaces, 864);
const {N, evaluateClosedArithmeticDefinitions, tracedArithmeticEvaluator} =
  await sourceArithmetic(tree, thresholds.sourcePins, 'coarse-upper');
const {trace} = transport;
const parameters = evaluateClosedArithmeticDefinitions(historical.definitions, N, {
  names: trace.sourceParameters,
}).values;
const boundaries = new Map(trace.nonArithmeticBoundaries.map(({id}) =>
  [id, N.fromClosed(historical.boundaryIntervals[id])]));
assert.deepEqual([...boundaries.keys()], [239, 257, 275]);
const zero = {rational: '0'};
const one = {rational: '1'};
const ftc = new Set();
for (const [region, receipt] of Object.entries({inner, middle, outer})) {
  assert.equal(receipt.originalGraphSHA256, transport.originalGraphSHA256);
  assert.equal(receipt.rows.length, 72);
  assert.deepEqual(receipt.rows.map(row => row.root).sort((a, b) => a - b), transport.regions[region]);
  for (const {root, interval} of receipt.rows) {
    assert(!ftc.has(root), String(root));
    ftc.add(root);
    assert.equal(trace.substitutions[root], 'ftc_' + root);
    assert.deepEqual(interval.lower, zero);
    assert.equal(N.compareEndpoints(interval.upper, zero), 1);
    parameters.set(trace.substitutions[root], N.fromClosed(interval));
  }
}
assert.equal(Object.keys(trace.substitutions).length, ftc.size);
const arithmetic = tracedArithmeticEvaluator(trace, N, {parameters, boundaries});
const targetC7 = {};
for (const root of trace.roots) {
  const {lower, upper} = N.toClosed(arithmetic.value(root));
  assert(N.compareEndpoints(lower, one) >= 0, String(root));
  targetC7[root] = {lower: one, upper};
}
assert.equal(Object.keys(targetC7).length, 16);
const result = {
  status: 'VERIFIED_ALL_16_ORIGINAL_WEIGHTED_TARGET_C7_NUMERICAL_UPPER_ENDPOINTS',
  originalGraphSHA256: transport.originalGraphSHA256, pins, targetC7,
  checkedFTC: {inner: 72, middle: 72, outer: 72},
  checkedFaces: transport.checkedFaces, arithmetic: arithmetic.report(),
  finalJets: '0/67', release: 'HOLD',
};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log('PASS all 16 original weighted target C7 numerical upper endpoints');
