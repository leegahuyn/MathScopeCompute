/** Combine all fourteen directed intervals against the actual maximum operands. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {load, sha, sourceArithmetic} from '../../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [runtime, thresholdsFile, frontierFile, closedFile, backgroundFile, mapFile, targetFile, output] =
  process.argv.slice(2);
assert.ok(output);
const read = async path => {
  const raw = await readFile(path);
  return {data: JSON.parse(raw), digest: sha(raw)};
};
const [thresholds, closed, background, map, target] = await Promise.all([
  load(thresholdsFile, 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'),
  ...[closedFile, backgroundFile, mapFile, targetFile].map(read),
]);
const frontier = await load(frontierFile, closed.data.frontierSHA256);
const {prefix, roots} = frontier;
assert.equal(closed.data.status, 'DIRECTED_CLOSED_K_OPERANDS');
assert.equal(background.data.status, 'DIRECTED_CONDITIONAL_ACTUAL_BACKGROUND_C8');
assert.equal(map.data.status, 'DIRECTED_ORIGINAL_CUTOFF_MAP_MAXIMUM');
assert.equal(target.data.status, 'DIRECTED_CONDITIONAL_N0_TO_N6');
for (const {data} of [closed, background, map]) {
  assert.equal(data.K, roots.K);
  assert.equal(data.prefix, prefix);
}
for (const {data} of [background, map, target]) {
  assert.equal(data.sourcePins.frontier, closed.data.frontierSHA256);
}
assert.equal(background.data.background.id, roots.backgroundC8);
assert.equal(map.data.root, roots.coefficientMaximum);
assert.deepEqual(target.data.rows.map(row => row.root), roots.weightedTarget);
const direct = frontier.nodes.find(row => row.id === roots.K).node;
assert.equal(direct.op, 'maximum');
assert.equal(direct.args.length, 14);
const operands = new Map();
const add = (id, interval, kind) => {
  assert.ok(!operands.has(id) && interval && direct.args.includes(id), `Incorrect operand #${id}`);
  operands.set(id, {interval, kind});
};
for (const row of closed.data.ready.filter(row => row.directKOperand)) {
  add(row.id, row.enclosure, 'source scalar');
}
add(background.data.background.id, background.data.background.interval, 'background C8');
add(map.data.root, map.data.enclosure, 'cutoff and map');
for (const row of target.data.rows) add(row.root, row.enclosure, `weighted target ${row.order}`);
assert.equal(operands.size, 14);

const {N} = await sourceArithmetic(runtime, thresholds.sourcePins, 'coarse-upper');
const ordered = direct.args.map(id => ({id, ...operands.get(id)}));
const enclosure = N.toClosed(N.max(ordered.map(row => N.fromClosed(row.interval))));
assert.equal(N.compareEndpoints(enclosure.lower, {rational: '0'}), 1);
const receipt = {
  schema: 'MathScope.ActiveOriginalWholeKDirectedEnclosure/1',
  status: 'DIRECTED_CONDITIONAL_WHOLE_ORIGINAL_K',
  prefix, K: roots.K, operands: ordered, enclosure,
  sourcePins: {frontier: closed.data.frontierSHA256, closed: closed.digest,
    background: background.digest, map: map.digest, weightedTarget: target.digest},
  scope: 'Whole original maximum for this source family, conditional on the referenced source-bound leaf inequalities and domain. The final corrected field is a separate evaluation.',
  release: 'HOLD',
};
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({status: receipt.status, prefix, K: roots.K, directOperands: ordered.length}));
