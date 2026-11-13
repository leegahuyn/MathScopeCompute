/** Evaluate the actual C8 background operand of K with source-bound FTC intervals. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {load, sha, sourceArithmetic} from '../../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [runtime, thresholdsFile, historicalFile, artifact, evidence, output] = process.argv.slice(2);
assert.ok(output, 'Provide the pinned arithmetic runtime, inputs, artifact and output.');
const [thresholds, historical] = await Promise.all([
  load(thresholdsFile, 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'),
  load(historicalFile, '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0'),
]);
const native = JSON.parse(await readFile(join(artifact, 'primary-c5-native.json')));
const prefix = native.requested.prefix;
assert.ok(prefix === 3 || prefix === 4);
assert.equal(native.originalCommit, 'f8cb4034e86d7b669d52a6f2248aebba156b51b5');
assert.equal(native.status, `VERIFIED_ORIGINAL_NATIVE_N${prefix}_PRIMARY_C5_CLASS`);
assert.equal(native.nativeChecks.length, 9);
assert.ok(native.nativeChecks.every(row => row.pass === true));
const read = async name => {
  const raw = await readFile(join(evidence, name));
  return {data: JSON.parse(raw), digest: sha(raw)};
};
const [frontier, index, leadingReceipt, chartReceipt, proofReceipt] = await Promise.all([
  load(join(artifact, 'primary-K-arithmetic-frontier.json'), native.normOperandBoundary.sha256),
  load(join(artifact, 'primary-K-binding-index.json'), native.normBindingIndex.sha256),
  read(`n${prefix}-leading-ftc-join.json`),
  read('slow-chart-directed.json'),
  read('slow-chart-majorant.json'),
]);
const {data: leading} = leadingReceipt;
const {data: chart} = chartReceipt;
assert.equal(frontier.graphNamespace, 'norm');
assert.equal(index.graphNamespace, 'norm');
assert.equal(frontier.prefix, prefix);
assert.equal(index.prefix, prefix);
assert.equal(index.normRoot, native.normRoot);
assert.equal(frontier.roots.K, index.normRoot);
assert.equal(leading.status, 'BOUND_ALL_90_LEADING_FTC_INPUTS');
assert.equal(leading.prefix, prefix);
assert.equal(leading.normRoot, index.normRoot);
assert.equal(leading.sourcePins['primary-K-arithmetic-frontier.json'], native.normOperandBoundary.sha256);
assert.deepEqual(leading.countByField, {F: 45, U: 45});
assert.equal(chart.status, 'DIRECTED_COMMON_FTC_UPPER');
assert.equal(chart.coefficientProofSHA256, proofReceipt.digest);
assert.equal(chart.parameterExpressionSHA256, index.targetSourceProfileSHA256);
assert.equal(proofReceipt.data.faceBound, 'Each original nonconstant slow-chart coefficient FTC sum lies in [0,2^1521 H^119].');

const original = new Map(frontier.nodes.map(row => [row.id, row.node]));
const supplied = new Map();
const put = (id, interval, kind) => {
  assert.ok(original.has(id) && !supplied.has(id), `Missing or repeated original bound #${id}`);
  supplied.set(id, {interval, kind});
};
assert.equal(leading.operands.length, 90);
for (const {bound, field} of leading.operands) put(bound, leading.directedFTCIntervals[field], 'leading');
for (const row of index.coefficientFTC) {
  if (row.sourceConstant || !original.has(row.bound)) continue;
  assert.deepEqual(row.faces.map(face => face.mask), [0, 1, 2, 3, 4, 5, 6, 7]);
  put(row.bound, chart.enclosure, 'chart');
}
for (const id of [239, 257, 275]) {
  assert.deepEqual(original.get(id), historical.nodes.find(row => row.id === id).node);
  put(id, historical.boundaryIntervals[id], 'historical');
}

const block = index.finiteBlocks.find(row => row.derivativeOrder === 8);
const slow = index.slowConstants.find(row => row.derivativeOrder === 8);
assert.equal(block.tailStarts, 8);
assert.deepEqual(block.finite.map(row => row.order), [1, 2, 3, 4, 5, 6, 7]);
assert.deepEqual(original.get(block.tailConstant), {op: 'rational', args: ['1', '128']});
const background = frontier.roots.backgroundC8;
assert.equal(native.backgroundRow.B_m, background);
assert.ok(original.get(background).args.includes(slow.Cslow));
const sourceRoots = [background, slow.Cslow, block.coefficient, ...block.finite.map(row => row.bound)];
const stack = [...sourceRoots];
const seen = new Set(), leaves = [], names = new Set(), nodes = [];
while (stack.length) {
  const id = stack.pop();
  if (seen.has(id)) continue;
  seen.add(id);
  const node = original.get(id);
  assert.ok(node, `Missing operand #${id}`);
  if (supplied.has(id)) {
    leaves.push({id, kind: supplied.get(id).kind});
    nodes.push({id, node: {op: 'proved_original_operand', args: []}});
    continue;
  }
  nodes.push({id, node});
  const {op, args} = node;
  if (op === 'source_parameter') names.add(args[0]);
  else if (op === 'integer_power') stack.push(args[0]);
  else if (op !== 'rational') {
    assert.ok(['inverse', 'exp', 'log_positive', 'sqrt_positive', 'ceiling', 'floor', 'add', 'multiply', 'maximum'].includes(op),
      `No source enclosure for #${id} (${op})`);
    stack.push(...args);
  }
}
const counts = Object.fromEntries(['leading', 'chart', 'historical'].map(kind => [
  kind, leaves.filter(row => row.kind === kind).length,
]));
assert.deepEqual(counts, {leading: 90, chart: 25299, historical: 3});
console.log(JSON.stringify({stage: 'pinned-background-inputs', prefix, nodes: nodes.length, counts}));

const {N, evaluateClosedArithmeticDefinitions, tracedArithmeticEvaluator} =
  await sourceArithmetic(runtime, thresholds.sourcePins, 'coarse-upper');
const {values: parameters} = evaluateClosedArithmeticDefinitions(historical.definitions, N, {names: [...names]});
const boundaries = new Map(leaves.map(({id}) => [id, N.fromClosed(supplied.get(id).interval)]));
const evaluator = tracedArithmeticEvaluator({nodes, nonArithmeticBoundaries: leaves}, N,
  {parameters, boundaries, maxNodeVisits: nodes.length});
const enclose = id => ({id, interval: N.toClosed(evaluator.value(id))});
const finite = block.finite.map(({order, bound}) => ({order, ...enclose(bound)}));
const result = {
  schema: 'MathScope.ActiveOriginalC8BackgroundEnclosure/1',
  status: 'DIRECTED_CONDITIONAL_ACTUAL_BACKGROUND_C8',
  prefix, K: index.normRoot, background: enclose(background),
  Cslow: enclose(slow.Cslow),
  normalizedFiniteBlock: {...enclose(block.coefficient), finite, tailStarts: 8, tail: '1/128'},
  counts, sourcePins: {frontier: native.normOperandBoundary.sha256, index: native.normBindingIndex.sha256,
    leading: leadingReceipt.digest, chart: chartReceipt.digest, chartProof: proofReceipt.digest},
  trace: evaluator.report(), arithmetic: N.report(), fullKEnclosed: false, release: 'HOLD',
};
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({status: result.status, prefix, root: background, visits: nodes.length}));
