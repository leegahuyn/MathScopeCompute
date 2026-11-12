/** Original pointwise majorants for the four anchored FTC faces. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {load} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [tree, backgroundFile, out] = process.argv.slice(2);
assert(tree && backgroundFile && out);
const background = await load(backgroundFile, '5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e');
const source = name => import(pathToFileURL(resolve(tree, 'research-ide/mathscope-m2/navier', name)).href);
const [{prepareActualOrderInduction, assertActualOrderInduction},
  {attachActualInductionNorms, assertActualInductionNorms, actualNormCalculus},
  {traceExactArithmeticDependencies}] = await Promise.all([
  source('actual-residual-order-induction-source.mjs'),
  source('actual-residual-order-induction-norms.mjs'),
  source('actual-common-selection-arithmetic-trace.mjs'),
]);
const prepared = prepareActualOrderInduction({order: 3, maxNodes: 1_500_000});
assert.equal(assertActualOrderInduction(prepared), true);
const {G, records, bootstrap} = prepared;
assert.equal(prepared.program.parameterExpressionSHA256, background.sourceParameterSHA256);
const prefixDigest = createHash('sha256');
for (const node of G.nodes) prefixDigest.update(JSON.stringify(node) + '\n');
const originalPrefix = {nodes: G.nodes.length, sha256: prefixDigest.digest('hex')};
assert.equal(originalPrefix.nodes, 123870);
for (const group of background.groups) {
  assert.equal(records[group.order].global[group.field], group.sourceRoot);
  assert.deepEqual(G.nodes[group.sourceRoot], {op: 'actual_expression_partial',
    args: [group.system, [bootstrap.constants.X, bootstrap.constants.eta], [0, 0]]});
  assert.equal(G.expressionSystems[group.system].body, group.body);
}
const order = 10;
const norms = attachActualInductionNorms(prepared, {throughOrder: 3, derivativeOrder: order});
assert.equal(assertActualInductionNorms(norms), true);
assert(Object.values(norms.checks).every(Boolean));
const {fn, mul} = actualNormCalculus(G);
const q = (a, b = 1) => G.q(a, b);
const factorial = n => {
  let value = 1n;
  for (let j = 2; j <= n; j++) value *= BigInt(j);
  return value;
};
const Xlo = G.div(G.parameter('Xa'), q(2));
const Xhi = G.mul(q(2), bootstrap.orderOne.Xb);
assert.equal(bootstrap.orderOne.Xb, 28826);
assert.deepEqual(G.nodes[Xlo], {op: 'multiply', args: [q(1, 2), G.parameter('Xa')]});
assert.deepEqual(G.nodes[Xhi], {op: 'multiply', args: [q(2), bootstrap.orderOne.Xb]});
const weights = [G.one, G.sub(Xhi, Xlo), q(2), G.mul(q(2), G.sub(Xhi, Xlo))];
const inverseSqrt = fn((r, e) => e ? G.zero :
  G.div(q(factorial(r)), G.mul(G.sqrt(G.mul(q(2), Xlo)), G.pow(Xlo, r))));
const key = (r, e) => r + ':' + e;
const index = rows => new Map(rows.map(j => [key(j.radialOrder, j.etaOrder), j.upper]));
const profileBounds = new Map([['0:U', index(norms.leadingNormalized.U)]]);
for (const row of norms.normalized) {
  const n = row.order;
  assert.deepEqual(row.domain, {X: [Xlo, Xhi], eta: ['-1', '1']});
  assert.equal(row.actualSourceRoots.F, records[n].global.F);
  assert.equal(row.actualSourceRoots.U, records[n].global.U);
  const eBounds = index(row.jets.E);
  const recoveredF = mul(inverseSqrt, fn((r, e) => {
    const root = eBounds.get(key(r, e));
    assert.notEqual(root, undefined);
    return root;
  }));
  profileBounds.set(n + ':F', new Map(row.jets.E.map(j =>
    [key(j.radialOrder, j.etaOrder), recoveredF.get(j.radialOrder, j.etaOrder)])));
  profileBounds.set(n + ':U', index(row.jets.U));
}

const roots = {};
const bindings = [];
for (const group of background.groups) {
  const name = group.order + ':' + group.field;
  const bounds = profileBounds.get(name);
  if (!bounds) continue;
  assert.equal(bounds.size, 66);
  const uniform = G.maximum(G.one, ...bounds.values());
  roots['ordinary_' + name] = uniform;
  // Each of the four anchored mixed derivatives is bounded by uniform.
  const majorant = G.mul(G.add(...weights), G.add(G.one, uniform));
  roots['ftc_' + name] = majorant;
  for (const row of group.rows) {
    const [r, e] = row.orders;
    assert(r + e + 2 <= order);
    bindings.push({profile: name, archivedRoot: row.root, sourceRoot: group.sourceRoot,
      orders: [r, e], upper: majorant});
  }
}
assert.equal(bindings.length, 315);
assert.equal(Object.keys(roots).length, 14);
const trace = traceExactArithmeticDependencies(G, roots);
assert.deepEqual(trace.nonArithmeticBoundaries.map(x => x.id), [239, 257, 275]);
const packet = {
  schema: 'MathScope.N7.OriginalBackgroundC8FTCMajorants/1',
  originalPrefix, parameterExpressionSHA256: background.sourceParameterSHA256,
  ordinaryDerivativeOrder: order, box: background.box,
  producerBox: {lower: [Xlo, q(-1)], upper: [Xhi, q(1)]}, bindings, trace,
  scope: 'Leading U0 and all six positive-order F/U profiles on the original enlarged rectangle.',
  remainingProfile: '0:F', release: 'HOLD',
};
await writeFile(out, JSON.stringify(packet) + '\n');
console.log('PASS', bindings.length, 'original FTC root bounds,', trace.nodeCount, 'arithmetic nodes');
