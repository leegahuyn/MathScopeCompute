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
