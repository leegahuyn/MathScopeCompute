/** Replay every original stage-zero annular jet on its certified physical chart. */
import assert from 'node:assert/strict';
import {realpath, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sha, sourceArithmetic} from './source_arithmetic.mjs';

const [goal, tree, slowPath, output] = process.argv.slice(2);
assert(process.argv.length === 6 && goal && tree && slowPath && output,
  'Pass exactly GOAL_NEXT, ORIGINAL_RUNTIME, SLOW_RECEIPT and OUTPUT.');
const paths = {
  'stage-zero': ['whole-k-initialized-gauge/initialized-stage-zero-atoms.json', 'ac0c5dd82edad9dfef71266ef444b6448d77e6e9fc0739666fc55f5d53ff9a7a'],
  'initialized-mean-positive': ['whole-k-annular-pressure-lower/lower-covariance-pressure.json', '5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328'],
  'initialized-pressure-positive': ['whole-k-angular-pressure/initialized-angular-pressure.json', 'b4f45002e74e8fc397d9a43079ba2e5fa958bfe68a355f37d4a006f6f8b08e0d'],
  'initialized-primary-positive': ['whole-k-primary-potential-c3/initialized-primary-potential-c3.json', '6c3a65a40767e74e2093ddc6869e33fe024f154eb60a1b77a22ac365b4c6140d'],
  trace: ['whole-k-annular-initial/numerical/stage-zero-transitive-inputs.json', 'bcf8b4303a2cd53c5cb0b187ccb3580936a255a4e3c4985db67a81a91934ebea'],
  fixed: ['whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json', '9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'],
  background: ['whole-k-annular-wrz-norm/numerical/background-c8-complete.json', '4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966'],
  target: ['whole-k-annular-wrz-norm/target-numerical/target-c7-complete.json', 'b262127767b185e99041bd14f1f8dd2af6fe7d9a95736b93d9ac114914348f1a'],
  thresholds: ['whole-k-selector-scales/historical-scale-arithmetic-result.json', 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'],
  transport: ['whole-k-annular-initial/stage-zero-annular-transport.json', 'c9478f9ed4a517061ab1da9e04814e3583af47f1573b1a5c9a9e7d86917df0b6'],
};
const slowSHA256 = '6c8ad3386dfc2d5e392368a4884eacbd2088531821edb37f3a4c471f729410fc';
const inputPaths = [...Object.values(paths).map(([path]) => resolve(goal, path)), resolve(slowPath)];
const outputPath = resolve(output);
const comparablePath = path => process.platform === 'win32' ? path.toLowerCase() : path;
assert(!inputPaths.map(comparablePath).includes(comparablePath(outputPath)), 'An output cannot replace an input receipt.');
let existingOutputPath;
try {
  existingOutputPath = await realpath(outputPath);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
if (existingOutputPath) {
  const realInputs = await Promise.all(inputPaths.map(path => realpath(path)));
  assert(!realInputs.map(comparablePath).includes(comparablePath(existingOutputPath)), 'An output cannot replace an input receipt.');
}
const [receipts, slow] = await Promise.all([
  Promise.all(Object.entries(paths).map(async ([key, [path, pin]]) => [key, await load(resolve(goal, path), pin)]))
    .then(Object.fromEntries),
  load(slowPath, slowSHA256),
]);
const {trace, fixed, background, target, thresholds, transport} = receipts;
const source = receipts['stage-zero'];
const sourceSHA256 = 'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf';
const registrySHA256 = '657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333';
assert.equal(trace.status, 'VERIFIED_EXACT_TRANSITIVE_INPUTS');
assert.equal(trace.sourceSHA256, sourceSHA256);
assert.equal(trace.sourceNodes, 4456994);
assert.equal(trace.initializedAtoms, 67);
assert.equal(fixed.status, 'VERIFIED_INITIALIZED_FIXED_NUMERICAL_INPUTS');
assert.equal(fixed.sourceSHA256, sourceSHA256);
assert.equal(fixed.sourceNodes, trace.sourceNodes);
assert.equal(fixed.pressureMassSupport.status, 'VERIFIED_Xa_LT_X0Imean_AND_exp5_X0Imean_LT_Xb');
assert.equal(background.status, 'VERIFIED_ALL_18_ORIGINAL_BACKGROUND_C8_NUMERICAL_UPPER_ENDPOINTS');
assert.equal(background.originalGraphSHA256, '461b54ec94e0da92e6fc19f1d4f90fb9bb3e98bf4c7a57e4a6f1d86cb4984855');
assert.equal(target.status, 'VERIFIED_ALL_16_ORIGINAL_WEIGHTED_TARGET_C7_NUMERICAL_UPPER_ENDPOINTS');
assert.equal(target.originalGraphSHA256, '8ecdc6d5ba6faae0114249a5041eee1d8af1268e1ec98cc4f526a8b615bb70e5');
assert.equal(transport.graph.fullHostedSHA256, sourceSHA256);
assert.equal(transport.graph.nativeRegistrySHA256, registrySHA256);
assert.equal(transport.scope.stageZeroOnly, true);
assert.equal(slow.verifiedSlowAtoms, 67);
assert.equal(slow.exactZeroAtoms, 19);
assert.equal(thresholds.complete, true);

const namespaces = Object.keys(trace.visited);
const graphs = Object.fromEntries(namespaces.map(name => {
  const receipt = receipts[name];
  assert.equal(receipt.sourceSHA256, sourceSHA256, name);
  assert.equal(sha(JSON.stringify(receipt.nodes)), receipt.graphSHA256, name);
  if (name !== 'stage-zero') assert.equal(receipt.nativeRegistrySHA256 ?? receipt.registrySHA256, registrySHA256, name);
  return [name, receipt.nodes];
}));
const sorted = xs => [...xs].map(String).sort();
const leaves = {
  'background-c8': background.backgroundC8,
  'fixed-radial': fixed.fixedRadial,
  'hosted-original': fixed.hostedOriginal,
  'slow-background-atom': Object.fromEntries(trace.leaves['slow-background-atom'].map(key => [key, slow.atoms[key]])),
  'slow-background-pressure-atom': Object.fromEntries(trace.leaves['slow-background-pressure-atom'].map(key => [key, slow.atoms[key]])),
  'target-c7': target.targetC7,
};
for (const [namespace, entries] of Object.entries(leaves)) {
  assert.deepEqual(sorted(Object.keys(entries)), sorted(trace.leaves[namespace]), namespace);
}
assert.deepEqual(sorted(fixed.availableSlowAtoms), sorted([...trace.leaves['slow-background-atom'], ...trace.leaves['slow-background-pressure-atom']]));
assert.deepEqual(sorted(Object.keys(source.roots.all)), sorted(Object.keys(transport.atoms)));

// Flatten arithmetic edges only. Authenticated links resolve to their exact
// graph namespace, or to one named closed interval from the matching producer.
const nodes = [];
const interned = new Map();
const used = new Map();
const usedLeaves = new Map();
const operand = (op, args) => {
  const id = nodes.length;
  nodes.push({id, node: {op, args}});
  return id;
};
function flatten(namespace, index) {
  const key = `${namespace}/${index}`;
  if (interned.has(key)) return interned.get(key);
  if (!Object.hasOwn(graphs, namespace)) {
    assert(Object.hasOwn(leaves, namespace) && Object.hasOwn(leaves[namespace], index), key);
    usedLeaves.set(key, {namespace, index, interval: leaves[namespace][index]});
    const id = operand('source_parameter', [key]);
    interned.set(key, id);
    return id;
  }
  const original = graphs[namespace][index];
  assert(Number.isSafeInteger(index) && index >= 0 && original, key);
  assert(!used.has(key), `Cyclic link at ${key}`);
  used.set(key, namespace);
  const {op, args} = original;
  const children = xs => xs.map(child => {
    assert(Number.isSafeInteger(child) && child >= 0 && child < index, `${key}: ${child}`);
    return flatten(namespace, child);
  });
  let id;
  if (op === 'authenticated_source_norm_root') {
    assert.equal(args.length, 2, key);
    id = flatten(...args);
  } else if (op === 'rational') {
    assert.equal(args.length, 2, key);
    assert(args.every(arg => typeof arg === 'string' && /^-?\d+$/.test(arg)), key);
    id = operand(op, args);
  } else if (op === 'integer_power') {
    assert(args.length === 2 && Number.isSafeInteger(args[1]), key);
    id = operand(op, [...children(args.slice(0, 1)), args[1]]);
  } else {
    const unary = ['inverse', 'exp', 'sqrt_positive'].includes(op);
    assert(unary ? args.length === 1 : ['add', 'multiply', 'maximum'].includes(op) && args.length > 0, key);
    id = operand(op, children(args));
  }
  interned.set(key, id);
  return id;
}
const flatRoots = Object.fromEntries(Object.entries(source.roots.all).map(([atom, id]) => [atom, flatten('stage-zero', id)]));
const visited = Object.fromEntries(namespaces.map(name => [name, [...used.values()].filter(ns => ns === name).length]));
assert.deepEqual(visited, trace.visited);
assert.deepEqual(sorted(usedLeaves.keys()), sorted(Object.entries(trace.leaves).flatMap(([ns, ids]) => ids.map(id => `${ns}/${id}`))));
assert.equal(usedLeaves.size, 108);
console.log(`PASS ${used.size} original arithmetic records and ${usedLeaves.size} authenticated interval inputs for all 67 stage-zero jets.`);

const {N: directed, tracedArithmeticEvaluator} = await sourceArithmetic(tree, thresholds.sourcePins, 'coarse-upper');
const zero = {rational: '0'};
const one = {rational: '1'};

// Round each exact rational at a 128-bit dyadic mantissa, directed outwards.
// Exp is increasing and negation reverses rounding. This controls rational
// bit growth even inside the retained exponential endpoint coordinates.
const mantissaBits = 128;
const rationalExponentThreshold = 2048;
let roundedIntervals = 0;
let outerExponentialConversions = 0;
function roundEndpoint(endpoint, upward) {
  if (Object.hasOwn(endpoint, 'exp')) return {exp: roundEndpoint(endpoint.exp, upward)};
  if (Object.hasOwn(endpoint, 'neg')) return {neg: roundEndpoint(endpoint.neg, !upward)};
  const [signed, denominator = 1n] = endpoint.rational.split('/').map(BigInt);
  assert(denominator > 0n);
  if (signed === 0n) return zero;
  const magnitude = signed < 0n ? -signed : signed;
  const bitDifference = magnitude.toString(2).length - denominator.toString(2).length;
  const ceiling = signed > 0n ? upward : !upward;
  if (Math.abs(bitDifference) > rationalExponentThreshold) {
    // From 2^k <= |x| < 2^(k+1), enclose in exp coordinates using
    // 1/2 < log(2) < 1. Exact integer comparison determines k.
    const candidate = 1n << BigInt(Math.abs(bitDifference));
    const below = bitDifference >= 0 ? magnitude < denominator * candidate : magnitude * candidate < denominator;
    const k = BigInt(bitDifference - Number(below));
    const arg = ceiling ? (k + 1n > 0n ? String(k + 1n) : `${k + 1n}/2`)
      : (k > 0n ? `${k}/2` : String(k));
    outerExponentialConversions++;
    const bound = {exp: {rational: arg}};
    return signed < 0n ? {neg: bound} : bound;
  }
  const shift = bitDifference - mantissaBits;
  const step = 1n << BigInt(Math.abs(shift));
  const scaledNumerator = shift < 0 ? magnitude * step : magnitude;
  const scaledDenominator = shift > 0 ? denominator * step : denominator;
  let m = scaledNumerator / scaledDenominator;
  if (ceiling && scaledNumerator % scaledDenominator !== 0n) m++;
  if (signed < 0n) m = -m;
  return {rational: shift < 0 ? `${m}/${step}` : String(m * step)};
}
function outward(interval) {
  const {lower, upper} = directed.toClosed(interval);
  roundedIntervals++;
  return directed.fromClosed({lower: roundEndpoint(lower, false), upper: roundEndpoint(upper, true)});
}
const N = {...directed};
function endpointSize(endpoint) {
  if (Object.hasOwn(endpoint, 'exp')) return `exp(${endpointSize(endpoint.exp)})`;
  if (Object.hasOwn(endpoint, 'neg')) return `neg(${endpointSize(endpoint.neg)})`;
  return endpoint.rational.split('/').map(part => BigInt(part).toString(2).length).join('/');
}
for (const method of ['point', 'fromClosed', 'add', 'mul', 'max', 'inverse', 'exp', 'sqrt']) {
  N[method] = (...xs) => {
    try {
      return outward(directed[method](...xs));
    } catch (error) {
      const size = xs.filter(x => x?.lower && x?.upper).map(x => {
        const interval = directed.toClosed(x);
        return `${endpointSize(interval.lower)}..${endpointSize(interval.upper)}`;
      });
      throw new Error(`${method}(${size.join(', ')}): ${error.code ?? error.name}: ${error.message}`);
    }
  };
}
N.pow = (base, exponent) => {
  assert(Number.isSafeInteger(exponent));
  if (exponent < 0) return N.pow(N.inverse(base), -exponent);
  let result = N.one();
  while (exponent > 0) {
    if (exponent % 2) result = N.mul(result, base);
    exponent = Math.floor(exponent / 2);
    if (exponent > 0) base = N.mul(base, base);
  }
  return result;
};
const parameters = new Map();
for (const [key, {namespace, interval}] of usedLeaves) {
  assert(interval, key);
  const n = N.fromClosed(interval);
  if (namespace.startsWith('slow-background')) {
    const bound = N.toClosed(N.max([n, N.neg(n)])).upper;
    assert.equal(N.compareEndpoints(bound, zero), 1, key);
    parameters.set(key, N.fromClosed({lower: zero, upper: bound}));
  } else {
    if (namespace === 'background-c8') assert.equal(N.compareEndpoints(interval.lower, zero), 0, key);
    if (namespace === 'target-c7') assert.equal(N.compareEndpoints(interval.lower, one), 0, key);
    if (namespace === 'hosted-original') assert.equal(N.compareEndpoints(interval.lower, zero), 1, key);
    assert.equal(N.compareEndpoints(interval.upper, zero), 1, key);
    parameters.set(key, n);
  }
}

const numerical = tracedArithmeticEvaluator({nodes, nonArithmeticBoundaries: []}, N, {parameters});
const atoms = {};
for (const [atom, flatRoot] of Object.entries(flatRoots)) {
  try {
    const norm = numerical.value(flatRoot);
    const upper = N.toClosed(norm).upper;
    assert.equal(N.compareEndpoints(upper, zero), 1);
    atoms[atom] = {sourceRoot: source.roots.all[atom], lower: N.toClosed(N.neg(norm)).lower, upper};
  } catch (error) {
    throw new Error(`Original initialized jet ${atom} at source root ${source.roots.all[atom]} failed (${error.code ?? error.name}: ${error.message}).`);
  }
}
const traceReport = numerical.report();
assert.deepEqual(sorted(traceReport.sourceParametersNumericallyConsumed), sorted(usedLeaves.keys()));
assert.equal(traceReport.visitedNodes, nodes.length);
const counts = {gauge: Object.keys(source.roots.gauge).length, direct: Object.keys(source.roots.direct).length,
  pressure: Object.keys(atoms).filter(name => name.startsWith('p@')).length};
assert.deepEqual(counts, {gauge: 57, direct: 6, pressure: 4});
assert.equal(Object.keys(atoms).length, 67);

const result = {
  schema: 'MathScope.N7.ActualInitializedStageZeroNumericalIntervals/1',
  status: 'VERIFIED_ALL_67_ORIGINAL_INITIALIZED_STAGE_ZERO_NUMERICAL_INTERVALS',
  scope: {field: 'actual initialized stage-zero annular field before outer localization',
    chart: {X: ['Xa', 'Xb'], eta: ['-3/4', '3/4'], q: {lower: 'qBig/64', upper: 'qBig/16', upperOpen: true}},
    includesLaterCorrections: false, wholeKFinalJets: '0/67', release: 'HOLD'},
  source: {sourceSHA256, sourceNodes: trace.sourceNodes, registrySHA256, chartSHA256: transport.chartSHA256,
    atomContractSHA256: transport.atomContractSHA256, originalSourceRoots: source.source,
    inputSHA256: {...Object.fromEntries(Object.entries(paths).map(([name, [, pin]]) => [name, pin])), slow: slowSHA256}},
  counts, atoms, originalRecordsByNamespace: visited,
  consumedInputsByNamespace: Object.fromEntries(Object.entries(trace.leaves).map(([ns, ids]) => [ns, ids.length])),
  arithmeticDAG: {nodes: nodes.length, sha256: sha(JSON.stringify(nodes)), trace: traceReport},
  arithmetic: {...N.report(), outwardDyadicMantissaBits: mantissaBits, roundedIntervals, rationalExponentThreshold,
    outerExponentialConversions}, finalJets: '0/67', release: 'HOLD',
};
await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n');
console.log(`PASS ${Object.keys(atoms).length} original initialized annular jet intervals (57 gauge, 6 direct, 4 pressure).`);
