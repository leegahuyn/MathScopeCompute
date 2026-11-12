/** Directed numerical enclosure of the original additional fixed radial roots. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [goal, runtime, history, radialPath, out] = process.argv.slice(2);
assert.equal(process.argv.length, 7, 'Use GOAL_NEXT ARITHMETIC_RUNTIME HISTORICAL_INPUT RADIAL_C5 OUTPUT.');
const radialPin = '7bbcf2f2b8befbf0c91a553f0fbc40c347a24e6112d66fb786a474c9ecde036e';
const [radial, historical, threshold, fixed] = await Promise.all([
  load(radialPath, radialPin),
  load(history, '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0'),
  load(resolve(goal, 'whole-k-selector-scales/historical-scale-arithmetic-result.json'), 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'),
  load(resolve(goal, 'whole-k-annular-mean-sharp/fixed-operators.json'), 'e0ca526ca37d3697a655a419af9386d1e6e291a228e05f26e30a73225b3e9633'),
]);
assert.deepEqual(radial.boundaries.map(x => x.id), [239, 257, 275]);
for (const {id, node} of radial.boundaries) assert.deepEqual(node, fixed.unweightedArithmeticClosure[id]);
const {N, evaluateClosedArithmeticDefinitions, tracedArithmeticEvaluator} = await sourceArithmetic(runtime, threshold.sourcePins, 'coarse-upper');
const nodes = Object.entries(radial.arithmeticClosure).map(([id, node]) => ({id: Number(id), node}));
const names = [...new Set(nodes.filter(({node}) => node.op === 'source_parameter').map(({node}) => node.args[0]))];
const parameters = evaluateClosedArithmeticDefinitions(historical.definitions, N, {names}).values;
const boundaries = new Map(radial.boundaries.map(({id}) => [id, N.fromClosed(historical.boundaryIntervals[id])]));
const reader = tracedArithmeticEvaluator({nodes, nonArithmeticBoundaries: radial.boundaries}, N, {parameters, boundaries});
const ids = [...new Set(radial.families.flatMap(f => {
  const {common, T, A} = f.rows[5];
  return [common, T, A];
}))];
assert.deepEqual(ids, [8370, 8372, 8373]);
const roots = Object.fromEntries(ids.map(id => {
  const interval = N.toClosed(reader.value(id));
  assert.equal(N.compareEndpoints(interval.lower, {rational: '0'}), 1, String(id));
  return [id, interval];
}));
const trace = reader.report();
assert.deepEqual(trace.conditionalBoundaryIntervalsConsumed, [239, 257, 275]);
const result = {status: 'VERIFIED_ORIGINAL_FIXED_RADIAL_C5_NUMERICAL_INTERVALS', originalRadialReceiptSHA256: radialPin,
  bounds: {rawWhole: 8370, T0: 8372, T1: 8372, A0: 8373, A1: 8373}, roots,
  originalIntegralBoundaryIntervalsRetained: trace.conditionalBoundaryIntervalsConsumed, trace,
  arithmetic: N.report(), finalJets: '0/67', release: 'HOLD'};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log('PASS directed original T1 C5, A1 C5 and whole shifted radial kernel endpoints.');
