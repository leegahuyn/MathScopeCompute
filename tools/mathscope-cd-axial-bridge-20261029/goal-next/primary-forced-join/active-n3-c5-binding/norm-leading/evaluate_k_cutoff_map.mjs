/** Apply proved FTC intervals to the exact original cutoff/map norm maximum. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {load, sha, sourceArithmetic} from '../../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [runtime, thresholdsFile, historicalFile, artifact, evidence, output] = process.argv.slice(2);
assert.ok(runtime && thresholdsFile && historicalFile && artifact && evidence && output);
const [thresholds, historical] = await Promise.all([
  load(thresholdsFile, 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'),
  load(historicalFile, '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0'),
]);
const native = JSON.parse(await readFile(join(artifact, 'primary-c5-native.json')));
const frontier = await load(join(artifact, 'primary-K-arithmetic-frontier.json'), native.normOperandBoundary.sha256);
const index = await load(join(artifact, 'primary-K-binding-index.json'), native.normBindingIndex.sha256);
const proofs = await Promise.all(['slow-chart-directed.json', 'map-ftc-upper.json'].map(async name => {
  const bytes = await readFile(join(evidence, name));
  return {data: JSON.parse(bytes), sha256: sha(bytes)};
}));
const [chart, map] = proofs.map(row => row.data);
assert.equal(index.graphNamespace, 'norm');
assert.equal(index.prefix, frontier.prefix);
assert.equal(index.normRoot, native.normRoot);
assert.equal(index.mapFTC.maximum, frontier.roots.coefficientMaximum);
assert.equal(chart.status, 'DIRECTED_COMMON_FTC_UPPER');
assert.equal(map.status, 'PASS');
assert.equal(chart.parameterExpressionSHA256, index.targetSourceProfileSHA256);
assert.equal(map.parameterExpressionSHA256, index.targetSourceProfileSHA256);

const original = new Map(frontier.nodes.map(row => [row.id, row.node]));
const boundaries = new Map();
const replaced = new Map();
const zero = {rational: '0'};
const put = (id, interval, kind) => {
  assert.ok(original.has(id) && !boundaries.has(id));
  boundaries.set(id, interval);
  replaced.set(id, kind);
};
for (const row of index.mapFTC.partition) {
  assert.deepEqual(row.faces.map(face => face.mask), [0, 1]);
  put(row.bound, {lower: zero, upper: {rational: map.partitionUpper[row.order]}}, 'partition');
}
for (const row of index.mapFTC.chart) {
  assert.deepEqual(row.faces.map(face => face.mask), [0, 1, 2, 3, 4, 5, 6, 7]);
  put(row.bound, chart.enclosure, 'chart');
}
for (const {derivativeOrder, integral} of index.mapFTC.timeStepSquaredIntegrals) {
  const proof = map.timeStepSquareIntegrals.find(row => row.derivativeOrder === derivativeOrder);
  assert.ok(proof && original.get(integral).op === 'definite_integral');
  put(integral, {lower: zero, upper: {rational: proof.integralUpper}}, 'step-square');
}
for (const id of [239, 257, 275]) {
  assert.deepEqual(original.get(id), historical.nodes.find(row => row.id === id).node);
  put(id, historical.boundaryIntervals[id], 'historical');
}

const root = index.mapFTC.maximum;
const stack = [root], seen = new Set(), leaves = [], names = new Set(), nodes = [];
while (stack.length) {
  const id = stack.pop();
  if (seen.has(id)) continue;
  seen.add(id);
  const node = original.get(id);
  assert.ok(node);
  if (boundaries.has(id)) {
    leaves.push({id, originalOp: node.op, kind: replaced.get(id)});
    nodes.push({id, node: {op: 'proved_original_operand', args: []}});
    continue;
  }
  nodes.push({id, node});
  const {op, args} = node;
  if (op === 'source_parameter') names.add(args[0]);
  else if (op === 'integer_power') stack.push(args[0]);
  else if (op !== 'rational') {
    assert.ok(['inverse', 'exp', 'log_positive', 'sqrt_positive', 'ceiling', 'floor', 'add', 'multiply', 'maximum'].includes(op),
      `No proved enclosure for original #${id} (${op})`);
    stack.push(...args);
  }
}
const {N, evaluateClosedArithmeticDefinitions, tracedArithmeticEvaluator} = await sourceArithmetic(runtime, thresholds.sourcePins, 'coarse-upper');
const {values: parameters} = evaluateClosedArithmeticDefinitions(historical.definitions, N, {names: [...names]});
const numericBoundaries = new Map(leaves.map(({id}) => [id, N.fromClosed(boundaries.get(id))]));
const evaluator = tracedArithmeticEvaluator({nodes, nonArithmeticBoundaries: leaves}, N, {parameters, boundaries: numericBoundaries});
const enclosure = N.toClosed(evaluator.value(root));
const receipt = {schema: 'MathScope.ActivePrimaryCutoffMapNormEnclosure/1', status: 'DIRECTED_ORIGINAL_CUTOFF_MAP_MAXIMUM',
  prefix: index.prefix, K: index.normRoot, root, enclosure, leaves,
  sourcePins: {frontier: native.normOperandBoundary.sha256, index: native.normBindingIndex.sha256,
    chart: proofs[0].sha256, map: proofs[1].sha256},
  trace: evaluator.report(), arithmetic: N.report(), fullKEnclosed: false, release: 'HOLD'};
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({status: receipt.status, root, enclosedLeaves: leaves.length}));
