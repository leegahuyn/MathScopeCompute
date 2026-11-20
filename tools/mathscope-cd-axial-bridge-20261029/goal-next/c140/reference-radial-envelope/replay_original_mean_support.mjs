import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const originalFiles = {
  'source-full-mean-equations.mjs': '2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76',
  'source-global-current.mjs': 'b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36',
  'source-pressure.mjs': 'fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f',
  'source-temporal-potential.mjs': 'c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8',
};
const runtime = process.argv[2];
assert(runtime, 'Pass the pinned original navier runtime directory');
for (const [name, expected] of Object.entries(originalFiles)) {
  const bytes = await readFile(resolve(runtime, name));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, name);
}
const {exactFullAuxiliaryMeanPDE, exactFullMeanMomentRemainders} =
  await import(pathToFileURL(resolve(runtime, 'source-full-mean-equations.mjs')));

const meanNames = ['beta', 'v', 'gamma'];
const covarianceNames = ['rr', 'rtheta', 'rz', 'thetatheta', 'thetaz', 'zz'];
const stressNames = ['Ttheta', 'Tz'];
const incrementNames = meanNames.map(name => 'delta_' + name);
const labels = [...meanNames, ...covarianceNames, ...stressNames, 'pressure', ...incrementNames];
const flags = new Map(labels.map((name, index) => [name, 1n << BigInt(index)]));
const namesFor = mask => labels.filter(name => (mask & flags.get(name)) !== 0n);
const cols = (names, fn) => Object.fromEntries(names.map(name => [name, fn(name)]));

// A mask records the tracked factors in one summand. Derivatives preserve the
// support of a summand on open exterior sets wherever the original derivative exists.
// Even when coefficients cancel, retaining every summand gives a sufficient test.
class SupportGraph {
  constructor() {
    this.nodes = [];
    this.operations = {};
    this.zero = this.q(0);
  }
  node(op, masks, radialPower = null) {
    this.operations[op] = (this.operations[op] ?? 0) + 1;
    const id = this.nodes.length;
    this.nodes.push({masks: [...new Set(masks)], radialPower});
    return id;
  }
  symbol(name) {
    return this.node('symbol', [flags.get(name) ?? 0n], name === 'R' ? 1 : null);
  }
  q(n, d = 1) {
    assert(Number.isSafeInteger(n) && Number.isSafeInteger(d) && d !== 0);
    return this.node('rational', n === 0 ? [] : [0n]);
  }
  add(...args) {
    return this.node('add', args.flatMap(arg => this.nodes[arg].masks));
  }
  sub(a, b) {
    return this.node('sub', [...this.nodes[a].masks, ...this.nodes[b].masks]);
  }
  neg(a) {
    return this.node('neg', this.nodes[a].masks);
  }
  mul(...args) {
    const masks = args.reduce((product, arg) => product.flatMap(
      mask => this.nodes[arg].masks.map(next => mask | next)), [0n]);
    return this.node('mul', masks);
  }
  div(a, b) {
    assert(this.nodes[b].radialPower > 0, 'Every divisor must be a positive integer power of R');
    return this.node('div', this.nodes[a].masks);
  }
  pow(a, exponent) {
    assert(Number.isSafeInteger(exponent) && exponent > 0);
    const node = this.nodes[a];
    const radialPower = node.radialPower === null ? null : exponent * node.radialPower;
    return this.node('pow', node.masks, radialPower);
  }
  derivative(a, coordinate) {
    assert(this.nodes[coordinate]);
    return this.node('derivative', this.nodes[a].masks);
  }
}

const graph = new SupportGraph();
const symbol = name => graph.symbol(name);
const geometry = {
  ...cols(['R', 'Z', 'T', 'epsilon', 'ci', 'radialFast'], symbol),
  Y: ['Y1', 'Y2'].map(symbol), vr: ['vr1', 'vr2'].map(symbol), vt: ['vt1', 'vt2'].map(symbol),
};
const background = cols(['b', 'V', 'G'], symbol);
const velocity = cols(meanNames, symbol);
const covariance = cols(covarianceNames, symbol);
const stress = stressNames.map(symbol);
const pressure = symbol('pressure');
const pde = exactFullAuxiliaryMeanPDE(graph, {geometry, background, velocity, covariance, stress, pressure});
const increment = cols(meanNames, name => symbol('delta_' + name));
const remainder = exactFullMeanMomentRemainders(graph, {geometry, background, previous: velocity, increment});
const pdeOutputs = {
  ...cols(['gr', 'Etheta', 'Ez', 'fluxTheta', 'fluxZ', 'divergence'], name => pde[name]),
};
const remainderOutputs = {
  ...cols(['Rg', 'JthetaIntegrand', 'JzVelocityIntegrand'], name => remainder[name]),
};
for (const [name, root] of Object.entries(remainder.terms)) remainderOutputs['Rg.' + name] = root;
for (const [name, root] of Object.entries(remainder.linear)) remainderOutputs['linear.' + name] = root;

const supportedBy = names => names.reduce((mask, name) => mask | flags.get(name), 0n);
function verify(outputs, allowed) {
  const supportMask = supportedBy(allowed);
  const result = {};
  for (const [name, id] of Object.entries(outputs)) {
    const {masks} = graph.nodes[id];
    assert(masks.length > 0, name);
    assert(masks.every(mask => (mask & supportMask) !== 0n), name);
    result[name] = masks.map(namesFor);
  }
  return result;
}
const pdeInputs = [...meanNames, ...covarianceNames, ...stressNames, 'pressure'];
const pdeResults = verify(pdeOutputs, pdeInputs);
const remainderResults = verify(remainderOutputs, incrementNames);

function lostOutputs(outputs, assumed, removed) {
  const supportMask = supportedBy(assumed.filter(name => name !== removed));
  return Object.entries(outputs).filter(([, id]) =>
    graph.nodes[id].masks.some(mask => (mask & supportMask) === 0n)).map(([name]) => name);
}
const negativeControls = {};
for (const [removed, expected] of Object.entries({
  pressure: ['Ez'], Ttheta: ['Etheta'], Tz: ['Ez'], beta: ['gr', 'Etheta', 'Ez', 'divergence'],
  thetaz: ['Etheta', 'fluxTheta'], rz: ['gr', 'Ez'],
})) {
  const observed = lostOutputs(pdeOutputs, pdeInputs, removed);
  assert.deepEqual(observed, expected, removed);
  negativeControls[removed] = observed;
}
for (const removed of incrementNames) {
  const observed = lostOutputs(remainderOutputs, incrementNames, removed);
  assert(observed.length > 0, removed);
  negativeControls[removed] = observed;
}
console.log(JSON.stringify({
  checkedOriginalFiles: originalFiles,
  semantics: 'Each summand has a supported input on a common open radial exterior, for all auxiliary phases. Division requires R>0. Derivatives require the original derivative to exist on the exterior.',
  pdeRequiredInputs: pdeInputs,
  pdeSummands: pdeResults,
  incrementRequiredInputs: incrementNames,
  remainderSummands: remainderResults,
  negativeControls,
  abstractNodes: graph.nodes.length,
  originalOperationInstances: graph.operations,
  actualInputPremisesProvedHere: false,
}, null, 2));
