/** Execute the original fixed unweighted radial kernel at order five. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [goal, runtime, out] = process.argv.slice(2);
assert.equal(process.argv.length, 5, 'Use GOAL_NEXT ORIGINAL_RADIAL_RUNTIME OUTPUT.');
const sha = data => createHash('sha256').update(data).digest('hex');
const manifestSHA256 = 'ba104452d70f327c00a1095d44031444869cf38711781154464fb844881c2824';
const manifest = await readFile(resolve(runtime, 'GIT-SOURCE-SHA256.json'));
assert.equal(sha(manifest), manifestSHA256);
const pins = JSON.parse(manifest);
await Promise.all(Object.entries(pins).map(async ([file, pin]) => assert.equal(sha(await readFile(resolve(runtime, file))), pin, file)));
const priorBytes = await readFile(resolve(goal, 'whole-k-annular-mean-sharp/fixed-operators.json'));
assert.equal(sha(priorBytes), 'e0ca526ca37d3697a655a419af9386d1e6e291a228e05f26e30a73225b3e9633');
const prior = JSON.parse(priorBytes);
const entry = 'research-ide/mathscope-m3/navier/source-radial-class-majorants.mjs';
assert.equal(pins[entry], '5f0fc6b8856bbe451f5949c37bd44473cac049b3c7dd714000be9405e8b6cd48');
const module = await import(pathToFileURL(resolve(runtime, entry)).href);
const input = {order: 5, pole: 0, ibpOrder: 1};
const radial = await module.prepareOriginalRadialClassMajorants(input);
assert.equal(module.assertOriginalRadialClassMajorants(radial), true);
const rc = await module.originalRadialClassMajorantCertificate(radial);
assert.equal(radial.source.parameterExpressionSHA256, prior.sourceSHA);
const G = radial.G;
const families = radial.change.exponents.slice(0, 2).map(({e, throughOrder}) => ({weight: e,
  rows: throughOrder.slice(0, 6).map((c, order) => {
    const common = G.mul(G.q(2 * 3**order), radial.geometry.B, c.outputPrefactor, c.outputComposition, c.transformedSource);
    const T = G.mul(G.q(2), common, radial.cutoff.rows[order].bound);
    const A = G.mul(common, radial.cutoff.rows[order + 1].bound);
    return {order, common, T, A, inputOrder: order};
  }),
}));
assert.deepEqual(families.map(x => x.weight), [0, 1]);
const commutative = new Set(['add', 'multiply', 'maximum']);
const arithmetic = new Set([...commutative, 'inverse', 'sqrt_positive', 'exp', 'log_positive', 'integer_power']);
function digest(get, id, memo = new Map()) {
  if (memo.has(id)) return memo.get(id);
  const {op, args} = get(id);
  let row;
  if (!arithmetic.has(op)) row = [op, ...args];
  else if (op === 'integer_power') row = [op, digest(get, args[0], memo), args[1]];
  else {
    const parts = args.map(x => digest(get, x, memo));
    row = [op, ...(commutative.has(op) ? parts.sort() : parts)];
  }
  const hash = sha(JSON.stringify(row));
  memo.set(id, hash);
  return hash;
}
const matched = [];
for (const [i, f] of families.entries()) {
  for (const row of f.rows.slice(0, 5)) {
    const old = prior.unweighted[i].rows[row.order];
    for (const type of ['T', 'A']) {
      const oldHash = digest(id => prior.unweightedArithmeticClosure[id], old[type]);
      const newHash = digest(id => G.nodes[id], row[type]);
      assert.equal(newHash, oldHash, `weight ${i}, degree ${row.order}, ${type}`);
      matched.push({weight: i, degree: row.order, type, old: old[type], current: row[type], digest: oldHash});
    }
  }
}
const used = new Set();
function visit(id) {
  if (used.has(id)) return;
  used.add(id);
  const {op, args} = G.nodes[id];
  if (op === 'integer_power') visit(args[0]);
  else if (arithmetic.has(op)) args.forEach(visit);
}
for (const f of families) for (const row of f.rows) [row.T, row.A, row.common].forEach(visit);
const arithmeticClosure = Object.fromEntries([...used].sort((a, b) => a - b).map(i => [i, G.nodes[i]]));
const boundaries = Object.entries(arithmeticClosure).filter(([, node]) => !arithmetic.has(node.op) &&
  !['rational', 'source_parameter'].includes(node.op)).map(([id, node]) => ({id: Number(id), node}));
assert.equal(boundaries.length, 3);
assert(boundaries.every(({node}) => node.op === 'definite_integral'));
const result = {status: 'VERIFIED_ORIGINAL_FIXED_UNWEIGHTED_RADIAL_T0_T1_A0_A1_C5', manifestSHA256,
  sourceFileSHA256: pins[entry], parameterExpressionSHA256: radial.source.parameterExpressionSHA256, input,
  radialGraph: rc.graph, priorOverlap: matched, families, arithmeticClosure, boundaries,
  scope: {actualFixedDerivativeOrder: 5, actualCurrentSourceNormsSupplied: false,
    finalJets: '0/67', release: 'HOLD'}};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log(`PASS original fixed radial C5 and all ${matched.length} C0–C4 overlap roots; T1 C5 #${families[1].rows[5].T}.`);
