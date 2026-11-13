import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';

const unary = new Set(['inverse', 'exp', 'log_positive', 'sqrt_positive', 'ceiling', 'floor']);
const variadic = new Set(['add', 'multiply', 'maximum']);

/** Keep the exact arithmetic ancestors and the first original non-arithmetic
 * operand of each route to the actual K. This trace carries no evaluation. */
export function primaryNormOperandBoundary(primary) {
  assert.equal(primary.bounds.graphNamespace, 'norm');
  const {G, bounds} = primary;
  const {K, E, W, dstar, cy, coefficientConstants, backgroundRow, targetRows} = bounds;
  const roots = {K, E, W, dstar, cy, coefficientMaximum: coefficientConstants.maximum,
    backgroundC8: backgroundRow.B_m, weightedTarget: targetRows.map(row => row.N_m)};
  assert.equal(G.nodes[K].op, 'maximum');
  const direct = G.nodes[K].args;
  assert.ok([roots.backgroundC8, roots.coefficientMaximum, ...roots.weightedTarget]
    .every(root => direct.includes(root)));

  const pending = [K, E, W, dstar, cy];
  const seen = new Set();
  const nodes = [], nonArithmeticBoundaries = [];
  const parameters = new Set();
  while (pending.length) {
    const id = pending.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    const node = G.nodes[id];
    assert.ok(node && Array.isArray(node.args), `Original norm node ${id}`);
    nodes.push({id, node});
    let children = [];
    if (node.op === 'source_parameter') parameters.add(node.args[0]);
    else if (node.op === 'integer_power') children = [node.args[0]];
    else if (unary.has(node.op) || variadic.has(node.op)) children = node.args;
    else if (node.op !== 'rational') nonArithmeticBoundaries.push({id, op: node.op});
    for (const child of children) {
      assert.ok(Number.isSafeInteger(child) && child >= 0 && child < id);
      pending.push(child);
    }
  }
  nodes.sort((left, right) => left.id - right.id);
  nonArithmeticBoundaries.sort((left, right) => left.id - right.id);
  return {schema: 'MathScope.ActivePrimaryNormArithmeticFrontier/1',
    prefix: primary.current.domain.prefixOrder, graphNamespace: 'norm',
    nodeCount: G.nodes.length, roots, nodes, nonArithmeticBoundaries,
    sourceParameters: [...parameters].sort(), numericalEndpointsCertified: false};
}

export function writePrimaryNormOperandBoundary(primary, out) {
  const trace = primaryNormOperandBoundary(primary);
  const text = JSON.stringify(trace) + '\n';
  writeFileSync(join(out, 'primary-K-arithmetic-frontier.json'), text, {flag: 'wx'});
  return {root: trace.roots.K, nodes: trace.nodes.length, boundaries: trace.nonArithmeticBoundaries.length,
    sha256: createHash('sha256').update(text).digest('hex')};
}

/** Record the issuer's actual FTC grouping and finite-block roots in the norm namespace. */
export function writePrimaryNormBindingIndex(primary, background, out) {
  const {G, bounds, target} = primary;
  assert.equal(bounds.graphNamespace, 'norm');
  assert.equal(target.G, G);
  assert.equal(target.family.source.backgroundNorms, background);
  const rootAt = id => {
    const node = G.nodes[id];
    assert.ok(node && Number.isSafeInteger(id));
    return node;
  };
  const coefficientFTC = background.coefficientFTC.map(row => {
    assert.deepEqual(rootAt(row.bound), background.G.nodes[row.bound]);
    const faces = row.faces.map(({mask, upperBound}) => ({mask, upperBound}));
    assert.equal(faces.length, row.sourceConstant ? 0 : 8);
    return {bound: row.bound, sourceConstant: row.sourceConstant, faces};
  });
  const finiteBlocks = background.normalizedBlocks.map(({derivativeOrder, tailStarts, tailConstant, finite, coefficient}) => {
    rootAt(coefficient);
    return {derivativeOrder, tailStarts, tailConstant, finite, coefficient};
  });
  const targetFTC = target.ftcRows.map(row => {
    rootAt(row.bound);
    assert.equal(row.faces.length, 4);
    return {kind: row.kind, component: row.component, radialOrder: row.radialOrder, etaOrder: row.etaOrder,
      bound: row.bound, coordinates: row.coordinates, lower: row.lower, upper: row.upper,
      actualBody: row.actualStressBody ?? row.actualCoefficientBody,
      actualDerivative: row.actualDerivative,
      faces: row.faces.map(({mask, upperBound}) => ({mask, upperBound}))};
  });
  assert.equal(targetFTC.length, 168);
  assert.equal(finiteBlocks.length, 9);
  const {coefficientConstants: map} = bounds;
  const faces = row => ({bound: row.bound, faces: row.faces.map(({mask, upperBound}) => ({mask, upperBound}))});
  const mapFTC = {partition: map.partitionRows.map(row => ({order: row.order, ...faces(row)})),
    chart: map.coefficientRows.map(faces),
    timeStepSquaredIntegrals: map.time.stepBounds.slice(1).map((root, j) => {
      const integral = rootAt(root).args.find(id => rootAt(id).op === 'definite_integral');
      assert.ok(Number.isSafeInteger(integral));
      return {derivativeOrder: j + 2, integral};
    }), maximum: map.maximum};
  const data = {schema: 'MathScope.ActivePrimaryNormBindingIndex/1', graphNamespace: 'norm',
    prefix: primary.current.domain.prefixOrder, normRoot: bounds.K, backgroundSource: background.sourceBinding,
    targetSourceProfileSHA256: target.sourceBinding.parameterExpressionSHA256,
    slowConstants: background.rows.map(({derivativeOrder, Cslow, errorConstant}) => ({derivativeOrder, Cslow, errorConstant})),
    coefficientFTC, finiteBlocks, targetFTC, mapFTC, numericalEndpointsCertified: false};
  const text = JSON.stringify(data) + '\n';
  writeFileSync(join(out, 'primary-K-binding-index.json'), text, {flag: 'wx'});
  return {coefficients: coefficientFTC.length, targetFTC: targetFTC.length,
    sha256: createHash('sha256').update(text).digest('hex')};
}
