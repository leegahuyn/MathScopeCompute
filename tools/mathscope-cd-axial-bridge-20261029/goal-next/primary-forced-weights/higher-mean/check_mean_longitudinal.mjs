/** Independently read back every positive-N mean demand of cross C2 and C3. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [goal, receiptFile, out] = process.argv.slice(2);
assert.equal(process.argv.length, 5, 'Use GOAL_NEXT RECEIPT OUTPUT.');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function load(path, digest) {
  const bytes = await readFile(path);
  assert.equal(sha(bytes), digest);
  return JSON.parse(bytes);
}
const pin = '778a1058ffff15e9f80c3066645218b51b4ce52aa75514172008e05150ec94b9';
const [receipt, baseline] = await Promise.all([
  load(receiptFile, pin),
  load(resolve(goal, 'whole-k-annular-pressure-lower/mean-path-longitudinal.json'), 'e366138903bd4ba773ac898707a0a38782cc00ace2d570733668e93760d1dc59'),
]);
const {source, positive} = receipt;
assert.equal(positive.baseCount, baseline.nodes.length);
assert.equal(positive.baseGraphSHA256, sha(JSON.stringify(baseline.nodes)));
assert.equal(positive.extensionCount, positive.extension.length);
assert.equal(positive.extensionSHA256, sha(JSON.stringify(positive.extension)));
const nodes = [...baseline.nodes, ...positive.extension];
assert.equal(positive.graphSHA256, sha(JSON.stringify(nodes)));
for (const [i, node] of positive.extension.entries()) {
  assert(['add', 'multiply', 'maximum', 'integer_power', 'inverse', 'rational'].includes(node.op));
  if (node.op === 'rational') {
    assert(node.args.every(x => /^\d+$/.test(x)) && BigInt(node.args[1]) > 0n);
  } else {
    const args = node.op === 'integer_power' ? node.args.slice(0, 1) : node.args;
    assert(args.every(child => Number.isSafeInteger(child) && child >= 0 && child < positive.baseCount + i));
  }
}
assert.deepEqual(source.earlySources, {theta: 643868, z: 643883});
assert.deepEqual(source.nativeMean.total, [3614790, 3614791, 3614792]);
assert.equal(source.covarianceRows, 972);

// On a real half-lattice pair use (cosine coefficient,sine coefficient).
// Multiplication by nonzero omega=2*pi*(v_t dot k) is carried as an exact
// integer exponent. The absent zero-frequency pair is never divided.
const term = (name, sign = 1, power = 0) => ({name, sign, power});
const derivative = ([c, s]) => [term(s.name, s.sign, s.power + 1), term(c.name, -c.sign, c.power + 1)];
const E = [term('C'), term('S')];
const inverseE = [term('S', -1, -1), term('C', 1, -1)];
assert.deepEqual(derivative(inverseE), E);
assert.deepEqual(derivative(derivative(inverseE)), [term('S', 1, 1), term('C', -1, 1)]);
assert.deepEqual(derivative(derivative(derivative(inverseE))), [term('C', -1, 2), term('S', -1, 2)]);
assert.notDeepEqual(derivative([term('S', 1, -1), term('C', 1, -1)]), E);

const zero = [0, 0, 0, 0, 0];
const unit = j => zero.map((_, i) => Number(i === j));
const plus = (a, b) => a.map((v, j) => v + b[j]);
const key = alpha => alpha.join('');
const orders = (dimension, degree) => {
  if (dimension === 0) return [[]];
  return Array.from({length: degree + 1}, (_, j) => orders(dimension - 1, degree - j).map(t => [j, ...t])).flat();
};
const byNL = new Map(positive.rows.map(row => [`${row.N}:${row.L}`, row]));
const lookup = (alpha, table = byNL) => {
  const [r, z, t, l, n] = alpha;
  const row = table.get(`${n}:${l}`);
  if (!row || r + z + t > row.slowThrough) return null;
  return Object.fromEntries(Object.entries(row.roots).map(([name, list]) => [name, list[r + z + t]]));
};
const demands = [2, 3].map(order => {
  const domain = new Map();
  for (const alpha of orders(5, order)) {
    for (const source of [zero, unit(0), unit(1), unit(3)]) {
      const needed = plus(alpha, source);
      if (needed[4] > 0) domain.set(key(needed), needed);
    }
  }
  const used = [...domain.values()].map(alpha => {
    const root = lookup(alpha);
    assert(root, key(alpha));
    assert(Object.values(root).every(id => Number.isSafeInteger(id) && nodes[id] && id > 0));
    return {alpha, roots: root};
  });
  return {crossOrder: order, uniqueMeanIndicesPerComponent: used.length, components: 3, used};
});
const removed = new Map(byNL);
removed.delete('2:1');
assert(lookup([0, 0, 0, 1, 2]));
assert.equal(lookup([0, 0, 0, 1, 2], removed), null);
assert.equal(lookup([0, 0, 0, 0, 4]), null);
const result = {status: 'PASS_ALL_POSITIVE_LONGITUDINAL_MEAN_LEAVES_CROSS_C2_C3', inputSHA256: pin,
  allOriginalSecondAndThirdPulseBounds: true, checkedArithmeticRecords: positive.extension.length,
  exactFourierOrdersChecked: [1, 2, 3], rejectedControls: ['inverse sine sign', 'missing N²L row'],
  demands, unchangedOpen: ['N=0 higher mean jets and fresh FiveMap C3/C4', 'same-live-family attachment', 'Primary higher raw forcing input', 'whole-K final jets'],
  finalJets: '0/67', release: 'HOLD'};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log(`PASS mean cross C2/C3: ${demands.map(x => x.uniqueMeanIndicesPerComponent).join('/')} positive longitudinal indices per component.`);
