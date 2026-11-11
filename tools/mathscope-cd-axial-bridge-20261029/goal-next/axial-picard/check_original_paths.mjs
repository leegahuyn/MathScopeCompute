import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import {
  assertActualOrderInduction,
  prepareActualOrderInduction,
} from '../../goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/actual-residual-order-induction-source.mjs';
import { sourceGraphRationalIdentity } from '../../goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/actual-continuation-exact-identities.mjs';

const output = process.argv[2];
assert.ok(output, 'Supply a JSON output path.');
const prepared = prepareActualOrderInduction({order: 2, maxNodes: 800000});
assert.equal(assertActualOrderInduction(prepared), true);
const { G, records, bootstrap } = prepared;
const { X, eta } = bootstrap.constants;
const { zero, one } = G;
const roots = records.slice(1).flatMap(row => [row.raw.system, row.auxiliary.system]);
const rows = [];
for (const id of roots) {
  const sys = G.picardSystems[id];
  const { xi, A0, A1, forcing } = sys;
  const xiSquared = G.pow(xi, 2);
  const observedMask = [];
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      if (A1[i][j] === zero) continue;
      assert.ok(i >= 4 && j < 4);
      observedMask.push([i, j]);
    }
  }
  const memo = new Map();
  function remainingParity(node) {
    if (memo.has(node)) return memo.get(node);
    let out;
    if (node === xi) out = 1;
    else if (!G.dependsOn(node, xi)) out = 0;
    else {
      const { op, args } = G.nodes[node];
      assert.ok(['add', 'multiply'].includes(op),
        'A naked radial coordinate outside a product/sum after replacing xi^2.');
      const operands = args.map(remainingParity);
      if (op === 'add') {
        assert.equal(operands[0], operands[1]);
        out = operands[0];
      } else out = (operands[0] + operands[1]) % 2;
    }
    memo.set(node, out);
    return out;
  }
  const checkParity = (node, sign) => {
    if (node === zero) return;
    assert.equal(remainingParity(G.substitute(node, xiSquared, X)), sign < 0 ? 1 : 0);
  };
  const P = [1, 1, 1, 1, -1, -1];
  for (const matrix of [A0, A1]) for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++)
    checkParity(matrix[i][j], -P[i] * P[j]);
  for (let i = 0; i < 6; i++) checkParity(forcing[i], -P[i]);

  const component = 1;
  const root = G.picardRoot(id, component, xi, eta);
  const etaRoot = G.picardRoot(id, component, xi, eta, 1);
  const radialRoot = G.picardRadialDerivative(id, component, xi, eta);
  const mixedRoot = G.picardRadialDerivative(id, component, xi, eta, 1);
  assert.equal(G.derivative(root, eta), etaRoot);
  assert.equal(G.derivative(root, xi), radialRoot);
  assert.equal(G.derivative(etaRoot, xi), mixedRoot);
  const even = G.picardEven(id, component, X, eta);
  const evenMixed = G.picardEven(id, component, X, eta, 1, 1);
  assert.equal(G.derivative(G.derivative(even, eta), X), evenMixed);
  assert.equal(G.derivative(G.derivative(even, X), eta), evenMixed);

  const actualXi = G.mul(G.q(2), xi);
  const actualEta = G.mul(G.q(3), xi);
  const call = G.picardRoot(id, component, actualXi, actualEta, 1);
  const pulledBack = G.add(G.mul(G.q(2), G.picardRadialDerivative(id, component, actualXi, actualEta, 1)),
    G.mul(G.q(3), G.picardRoot(id, component, actualXi, actualEta, 2)));
  assert.equal(G.derivative(call, xi), pulledBack);
  rows.push({system: id, name: sys.name, order: sys.order, kind: sys.kind ?? 'actual',
    radialDomain: sys.radialDomain, diagonal: sys.diagonal, mask: observedMask, parityChecked: true,
    symbolicDerivativeRoots: {root, etaRoot, radialRoot, mixedRoot, even, evenMixed, call, pulledBack}});
}
const actual = G.picardSystems[records[2].raw.system];
const outsideXi = G.mul(G.q(2), actual.radialDomain[1]);
const outsideRoot = G.picardRoot(records[2].raw.system, 1, outsideXi, eta);
assert.deepEqual(G.nodes[outsideRoot].args, [records[2].raw.system, 1, outsideXi, eta, 0]);

function syntheticSystem(name, forceIndex, force, entries = []) {
  const xi = G.fresh(name);
  const matrix = () => Array.from({length: 6}, () => Array(6).fill(zero));
  const A0 = matrix(), A1 = matrix(), forcing = Array(6).fill(zero);
  for (const [i, j, value] of entries) A0[i][j] = value;
  forcing[forceIndex] = force;
  const system = G.definePicardSystem({name, xi, eta, diagonal: [0, 0, 2, 0, 3, 1],
    A0, A1, forcing, radialDomain: [zero, one], zeroAxisDatum: Array(6).fill(0)});
  return {system, xi};
}
const badParity = syntheticSystem('diagnostic_non_even', 0, one);
const parityPartial = G.picardPartialSum(badParity.system, 2);
assert.equal(parityPartial.sum[0], badParity.xi);
const bogusAxisDerivative = G.picardEven(badParity.system, 0, zero, eta, 1);
assert.equal(bogusAxisDerivative, zero);

const absoluteEta = G.maximum(eta, G.neg(eta));
const badEta = syntheticSystem('diagnostic_eta_absolute_value', 4, absoluteEta, [[0, 4, one]]);
const etaPartial = G.picardPartialSum(badEta.system, 3);
const exactCusp = G.mul(G.q(1, 8), G.pow(badEta.xi, 2), absoluteEta);
assert.equal(sourceGraphRationalIdentity(G, G.sub(etaPartial.sum[0], exactCusp),
  {atomicNodes: [absoluteEta]}).pass, true);
assert.throws(() => G.derivative(etaPartial.sum[0], eta), error => error.code === 'UNSUPPORTED');

const sourceDir = new URL('../../goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/', import.meta.url);
const sourceNames = [
  'actual-residual-order-induction-source.mjs',
  'actual-continuation-exact-inner.mjs',
  'actual-residual-order-induction-expressions.mjs',
  'actual-continuation-exact-functions.mjs',
  'actual-global-source-expressions.mjs',
];
const sourceSHA256 = Object.fromEntries(await Promise.all(sourceNames.map(async name =>
  [name, createHash('sha256').update(await readFile(new URL(name, sourceDir))).digest('hex')])));
await writeFile(output, JSON.stringify({
  schema: 'MathScope.OriginalPicardDerivativePaths/1',
  sourceSHA256,
  actualOriginalSystems: rows,
  controls: {
    originalOrder2OutsideXi: {outsideXi, outsideRoot, meaning: '2*a node accepted; no evaluation or analytic extension claimed'},
    syntheticParity: {system: badParity.system, xiSolution: 'xi', XSolution: 'sqrt(X)',
      originalMaterializerAxisNode: bogusAxisDerivative, actualInwardDerivativeFinite: false},
    syntheticEta: {system: badEta.system, xiSolution: 'xi^2*abs(eta)/8',
      parityAndA1MaskHold: true, actualEtaDerivativeAtZeroExists: false, originalDifferentiatorRejection: 'UNSUPPORTED'},
  },
}, null, 2) + '\n');
console.log('PASS: original parity and derivative paths, and three distinct scope controls');

