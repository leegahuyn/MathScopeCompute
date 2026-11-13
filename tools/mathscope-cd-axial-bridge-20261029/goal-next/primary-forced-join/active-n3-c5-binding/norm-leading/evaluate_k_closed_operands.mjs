/** Evaluate the source K operands whose only integral inputs already have enclosures. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {load, sourceArithmetic} from '../../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [runtime, thresholdsFile, historicalFile, frontierFile, output, prefixText] = process.argv.slice(2);
const prefix = Number(prefixText);
const pins = new Map([
  [3, 'fbaea5bd2475e54919cef4099479c1c6ad6ad48dc68225190ea9f6c127f07aaa'],
  [4, '22728b80327798f6fad284058b558d10527e4d8b7534a0c2bd9634eebb906b99'],
]);
assert.ok(runtime && thresholdsFile && historicalFile && frontierFile && output && pins.has(prefix));
const [thresholds, historical, frontier] = await Promise.all([
  load(thresholdsFile, 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'),
  load(historicalFile, '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0'),
  load(frontierFile, pins.get(prefix)),
]);
assert.equal(frontier.prefix, prefix);
assert.equal(frontier.graphNamespace, 'norm');
const nodes = new Map(frontier.nodes.map(row => [row.id, row.node]));
const stops = new Map(frontier.nonArithmeticBoundaries.map(row => [row.id, row]));
const verifiedBoundaryIds = [239, 257, 275];
for (const id of verifiedBoundaryIds) {
  const archived = historical.nodes.find(row => row.id === id);
  assert.deepEqual(nodes.get(id), archived.node, `The original norm must retain historical integral #${id}`);
  assert.equal(stops.get(id).op, 'definite_integral');
}
const roots = frontier.roots;
const k = nodes.get(roots.K);
assert.equal(k.op, 'maximum');
assert.equal(k.args.length, 14);

const union = new Set();
const ready = [];
const unresolved = [];
for (const id of [...new Set([...k.args, roots.E, roots.W, roots.dstar, roots.cy])]) {
  const seen = new Set(), stack = [id], blocked = new Set();
  while (stack.length) {
    const child = stack.pop();
    if (seen.has(child)) continue;
    seen.add(child);
    const {op, args} = nodes.get(child);
    if (stops.has(child)) blocked.add(child);
    else if (op === 'integer_power') stack.push(args[0]);
    else if (op !== 'rational' && op !== 'source_parameter') stack.push(...args);
  }
  const missing = [...blocked].filter(i => !verifiedBoundaryIds.includes(i));
  const row = {id, directKOperand: k.args.includes(id), traceNodes: seen.size};
  if (missing.length) unresolved.push({...row, missing: missing.length});
  else {
    ready.push(row);
    for (const i of seen) union.add(i);
  }
}
assert.equal(ready.filter(row => row.directKOperand).length, 5);
assert.equal(unresolved.filter(row => row.directKOperand).length, 9);
const trace = {nodes: frontier.nodes.filter(row => union.has(row.id)),
  nonArithmeticBoundaries: frontier.nonArithmeticBoundaries.filter(row => union.has(row.id))};
const names = [...new Set(trace.nodes.filter(row => row.node.op === 'source_parameter').map(row => row.node.args[0]))];
const {N, evaluateClosedArithmeticDefinitions, tracedArithmeticEvaluator} = await sourceArithmetic(runtime, thresholds.sourcePins, 'coarse-upper');
const {values: parameters} = evaluateClosedArithmeticDefinitions(historical.definitions, N, {names});
const boundaries = new Map(verifiedBoundaryIds.map(id => [id, N.fromClosed(historical.boundaryIntervals[id])]));
const interpreter = tracedArithmeticEvaluator(trace, N, {parameters, boundaries, maxNodeVisits: 100000});
const byId = new Map(Object.entries(roots).filter(([, id]) => Number.isSafeInteger(id)).map(([name, id]) => [id, name]));
for (const row of ready) {
  const enclosure = N.toClosed(interpreter.value(row.id));
  assert.equal(N.compareEndpoints(enclosure.lower, {rational: '0'}), 1, `Positive source operand #${row.id}`);
  row.name = byId.get(row.id) ?? null;
  row.enclosure = enclosure;
}
const receipt = {schema: 'MathScope.ActivePrimaryNormClosedOperands/1', status: 'DIRECTED_CLOSED_K_OPERANDS',
  prefix, K: roots.K, ready, unresolved, frontierSHA256: pins.get(prefix), historicalSHA256: thresholds.inputSHA256,
  originalIntegralBoundaryIds: verifiedBoundaryIds, numericalWholeKEnclosure: false,
  trace: interpreter.report(), arithmetic: N.report(), release: 'HOLD'};
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({status: receipt.status, prefix, enclosedDirectOperands: 5, remainingDirectOperands: 9,
  evaluatedNodes: receipt.trace.visitedNodes}));
