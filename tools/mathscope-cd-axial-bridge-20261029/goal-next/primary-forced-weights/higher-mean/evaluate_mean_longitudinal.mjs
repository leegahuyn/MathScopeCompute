/** Directed numerical upper endpoints for the archived positive-N mean roots. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [goal, runtime, meanPath, out] = process.argv.slice(2);
assert.equal(process.argv.length, 6, 'Use GOAL_NEXT ARITHMETIC_RUNTIME MEAN_RECEIPT OUTPUT.');
const meanPin = '778a1058ffff15e9f80c3066645218b51b4ce52aa75514172008e05150ec94b9';
const files = [
  [meanPath, meanPin],
  [resolve(goal, 'whole-k-annular-pressure-lower/mean-path-longitudinal.json'), 'e366138903bd4ba773ac898707a0a38782cc00ace2d570733668e93760d1dc59'],
  [resolve(goal, 'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json'), '9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'],
  [resolve(goal, 'primary-forced-weights/full-slow-norms/full-slow-norms.json'), '517662b18f4014644cd7539de42b82b74999374aaf34273163f39693f160bdb4'],
  [resolve(goal, 'whole-k-selector-scales/historical-scale-arithmetic-result.json'), 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'],
];
const [mean, baseline, fixed, fullSlow, threshold] = await Promise.all(files.map(([file, pin]) => load(file, pin)));
assert.equal(mean.source.graphSHA256, baseline.sourceSHA256);
assert.equal(fixed.sourceSHA256, baseline.sourceSHA256);
assert.equal(mean.positive.baseGraphSHA256, baseline.graphSHA256);
const graph = [...baseline.nodes, ...mean.positive.extension];
assert.equal(fullSlow.status, 'VERIFIED_ORIGINAL_FULL_R_Z_T_BOUNDS_ON_THE_FIXED_PHYSICAL_SLAB');
assert.deepEqual(fullSlow.domain.axes, ['R', 'Z', 'T']);
const background = Object.fromEntries(fullSlow.backgroundC8.flatMap(row => ['F', 'G'].map(name => [row.originalDirectionalRoots[name], row[name]])));
const target = Object.fromEntries(fullSlow.weightedTargetC7.flatMap(row => row.originalDirectionalRoots.map((id, index) => [id, row.component[index]])));
assert.equal(Object.keys(background).length, 18);
assert.equal(Object.keys(target).length, 16);
const external = {'hosted-original': fixed.hostedOriginal, 'fixed-radial': fixed.fixedRadial,
  'background-c8': background, 'target-c7': target};
const {N, tracedArithmeticEvaluator} = await sourceArithmetic(runtime, threshold.sourcePins, 'coarse-upper');
const allRoots = new Set(mean.positive.rows.flatMap(row => Object.values(row.roots).flat()));
const visited = new Set();
const parameters = new Map();
function visit(id) {
  if (visited.has(id)) return;
  visited.add(id);
  const node = graph[id];
  const {op, args} = node;
  if (op === 'authenticated_source_norm_root') {
    const [namespace, root] = args;
    const key = `${namespace}/${root}`;
    if (parameters.has(key)) return;
    const interval = external[namespace][root];
    assert(interval, key);
    // Preserve a closed positive lower endpoint under repeated power of
    // Bnorm. e^64 < 2^128 follows from log(2)>1/2. This converts the old
    // lower bound before squaring, without altering its upper endpoint.
    if (key === 'hosted-original/300170') {
      assert.equal(interval.lower.rational, String(1n << 128n));
      parameters.set(key, N.fromClosed({lower: {exp: {rational: '64'}}, upper: interval.upper}));
    } else parameters.set(key, N.fromClosed(interval));
  } else if (op === 'integer_power') visit(args[0]);
  else if (op !== 'rational') args.forEach(visit);
}
allRoots.forEach(visit);
const nodes = [...visited].sort((a, b) => a - b).map(id => {
  const node = graph[id];
  return {id, node: node.op === 'authenticated_source_norm_root' ? {op: 'source_parameter', args: [node.args.join('/')]} : node};
});
const interpreter = tracedArithmeticEvaluator({nodes, nonArithmeticBoundaries: []}, N, {parameters});
const intervals = Object.fromEntries([...allRoots].sort((a, b) => a - b).map(id => {
  let value;
  try { value = N.toClosed(interpreter.value(id)); }
  catch (error) { throw new Error(`Root ${id} failed (${error.code ?? error.name}: ${error.message}).`); }
  assert.equal(N.compareEndpoints(value.upper, {rational: '0'}), 1, String(id));
  return [id, {lower: {rational: '0'}, upper: value.upper}];
}));
const trace = interpreter.report();
assert.equal(trace.visitedNodes, visited.size);
assert.equal(trace.sourceParametersNumericallyConsumed.length, parameters.size);
const result = {status: 'VERIFIED_NUMERICAL_UPPER_ENDPOINTS_FOR_ARCHIVED_LONGITUDINAL_MEAN', meanReceiptSHA256: meanPin,
  originalGraphSHA256: mean.source.graphSHA256, registrySHA256: mean.source.registrySHA256,
  numericalInputSHA256: files.slice(1).map(([, pin]) => pin),
  boundMeaning: 'Numerical upper endpoints for the original positive graph with full ordinary R,Z,T background and target intervals, using the original namespace IDs. The positive graph still retains its own slow dimension factors. Application requires its fixed original chart, source domain, and smooth flat joins. A separate live source or q branch requires its own domain attachment. Beta keeps its explicit epsilon factor.',
  fullSlowInputDomain: fullSlow.domain,
  roots: mean.positive.rows, intervals, pureSecondPulse: mean.positive.pureSecondPulse,
  arithmetic: N.report(), trace, finalJets: '0/67', release: 'HOLD'};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log(`PASS ${allRoots.size} directed numerical original longitudinal-mean upper endpoints, ${parameters.size} source operands.`);
