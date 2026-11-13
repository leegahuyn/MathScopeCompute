/** Bind the regular-singular Taylor recurrence to the actual exported Picard axis branches. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
import {createGunzip} from 'node:zlib';

const [bundle, runtime, output] = process.argv.slice(2);
assert.ok(bundle && runtime && output, 'usage: ORIGINAL_N4_BUNDLE ORIGINAL_RUNTIME OUTPUT');
const digest = raw => createHash('sha256').update(raw).digest('hex');
const navier = resolve(runtime, 'research-ide/mathscope-m2/navier');
const functions = join(navier, 'actual-continuation-exact-functions.mjs');
const induction = join(navier, 'actual-residual-order-induction-expressions.mjs');
assert.equal(digest(readFileSync(functions)), '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311');
assert.equal(digest(readFileSync(induction)), 'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501');
const definitions = readFileSync(join(bundle, 'original-source-functions.json'));
const registrySHA256 = digest(definitions);
assert.equal(registrySHA256, '049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad');
const registry = JSON.parse(definitions).base;
const picard = JSON.parse(registry.picard);
const nodes = [];
const hash = createHash('sha256');
const stream = createInterface({input: createReadStream(join(bundle, 'original-source-nodes.jsonl.gz')).pipe(createGunzip()),
  crlfDelay: Infinity});
let lines = 0;
for await (const line of stream) {
  hash.update(line + '\n');
  if (lines === 0) assert.equal(JSON.parse(line).node_count, 7358162);
  if (0 < lines && lines <= 130348) nodes.push(JSON.parse(line));
  lines++;
}
const sourceGraphSHA256 = hash.digest('hex');
assert.equal(lines, 7358163);
assert.equal(sourceGraphSHA256, 'ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd');
const {ActualConvergentExpressions} = await import(pathToFileURL(functions));
const {ActualInductionExpressions} = await import(pathToFileURL(induction));

function bind(graph) {
  graph.nodes = nodes.slice();
  graph.lookup = new Map(nodes.map(({op, args}, i) => [JSON.stringify([op, args]), i]));
  graph.expressionSystems = JSON.parse(registry.expression);
  graph.picardSystems = picard;
  graph.quadraticSystems = JSON.parse(registry.quadratic);
  graph.monotoneSystems = JSON.parse(registry.monotone);
  graph.serial = 3000000;
  return graph;
}

/** Coefficients of the actual product A0 W + A1 d_eta W, with W(0)=0. */
function axisRecurrence(G, system, last, wrongDenominator = false) {
  const {A0, A1, forcing, diagonal, xi, eta} = G.picardSystems[system];
  const cache = new Map();
  function coefficient(root, degree) {
    if (root === G.zero) return root;
    const key = `${root}:${degree}`;
    if (cache.has(key)) return cache.get(key);
    let derivative = root, factorial = 1n;
    for (let j = 1; j <= degree; j++) {
      derivative = G.derivative(derivative, xi);
      factorial *= BigInt(j);
    }
    const value = G.mul(G.q(1n, factorial), G.substitute(derivative, xi, G.zero));
    cache.set(key, value);
    return value;
  }
  const result = [Array(diagonal.length).fill(G.zero)];
  for (let degree = 1; degree <= last; degree++) {
    const row = forcing.map((f, component) => {
      const terms = [coefficient(f, degree - 1)];
      for (let j = 1; j < degree; j++) {
        const radial = degree - 1 - j;
        for (const [column, previous] of result[j].entries()) {
          if (previous === G.zero) continue;
          const a = A0[component][column], b = A1[component][column];
          if (a !== G.zero) terms.push(G.mul(coefficient(a, radial), previous));
          if (b !== G.zero) terms.push(G.mul(coefficient(b, radial), G.derivative(previous, eta)));
        }
      }
      const offset = wrongDenominator && degree === 2 ? 1 : 0;
      return G.div(G.add(...terms), G.q(degree + diagonal[component] + offset));
    });
    result.push(row);
  }
  return result;
}

const standalone = bind(new ActualConvergentExpressions());
const direct = axisRecurrence(standalone, 0, 2);
const wrong = axisRecurrence(standalone, 0, 2, true);
assert.notDeepEqual(wrong[2], direct[2]);
const directRows = [];
for (let component = 0; component < 4; component++) {
  let coefficient = direct[2][component];
  for (let etaOrder = 0; etaOrder <= 3; etaOrder++) {
    assert.equal(standalone.picardEven(0, component, standalone.zero, 2, 0, etaOrder), standalone.zero);
    const native = standalone.picardEven(0, component, standalone.zero, 2, 1, etaOrder);
    assert.equal(native, coefficient, `Standalone first even coefficient (${component}, ${etaOrder})`);
    directRows.push({component, etaOrder, root: native});
    if (etaOrder < 3) coefficient = standalone.derivative(coefficient, 2);
  }
}

const graph = bind(new ActualInductionExpressions(new ActualConvergentExpressions(),
  {maxNodes: 500000, maxDerivativeOrder: 14}));
const rows = [];
for (const system of [0, 3, 5, 7, 9]) {
  const {order, xi, eta, diagonal} = picard[system];
  assert.equal(eta, 2);
  assert.deepEqual(diagonal, [0, 0, 2, 0, 3, 1]);
  const coefficients = axisRecurrence(graph, system, 2);
  const checked = [];
  for (let component = 0; component < 4; component++) {
    assert.equal(graph.picardRoot(system, component, graph.zero, eta), graph.zero);
    assert.equal(coefficients[1][component], graph.zero, `Even component ${component} has no linear term`);
    checked.push({component, xi, firstEvenCoefficient: coefficients[2][component]});
  }
  rows.push({system, order, checked});
}

const result = {schema: 'MathScope.OriginalPicard.AxisTaylorReplay/1', status: 'PASS',
  sourceGraphSHA256, registrySHA256, standaloneN1DirectRows: directRows,
  wrongSecondAxisDenominatorRejected: true, inductionRows: rows,
  originalPrefixNodesRead: nodes.length, originalFullNodesChecked: lines - 1,
  recurrence: 'w_k=(f_(k-1)+sum_(j=1..k-1)(A0_(k-1-j) w_j + A1_(k-1-j) d_eta w_j))/(k+c)',
  scope: {standaloneN1DirectASTEquality: true, inductionNativeIntegralEvaluated: false,
    allFiniteNativeLimitProved: false, release: 'HOLD'}};
writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({status: result.status, standalone: directRows.length, induction: rows.length,
  nodes: graph.nodes.length}));
