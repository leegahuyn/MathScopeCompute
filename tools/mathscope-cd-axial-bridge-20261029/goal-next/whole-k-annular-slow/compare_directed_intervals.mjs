import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {load, sourceArithmetic} from '../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [tree, thresholdsPath, exactPath, coarsePath, out] = process.argv.slice(2);
assert(tree && thresholdsPath && exactPath && coarsePath && out);
const history = await load(thresholdsPath, 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const exact = await load(exactPath, '94a1f9ab337ad26566af542ec63f9639b9eabb8f8b7fa648c1567b36ba656650');
const coarse = await load(coarsePath, '6c8ad3386dfc2d5e392368a4884eacbd2088531821edb37f3a4c471f729410fc');
const {N} = await sourceArithmetic(tree, history.sourcePins);
assert.equal(exact.arithmetic.precisionBits, 256);
assert.equal(coarse.arithmetic.precisionBits, 96);
assert.equal(exact.traceSHA256, coarse.traceSHA256);
assert.deepEqual(Object.keys(exact.atoms), Object.keys(coarse.atoms));
const rows = [];
for (const [name, tight] of Object.entries(exact.atoms)) {
  const wide = coarse.atoms[name];
  const zero = !('normalizedUpper' in tight);
  if (zero) {
    assert.deepEqual(tight, {lower: {rational: '0'}, upper: {rational: '0'}});
    assert.deepEqual(wide, tight);
  } else {
    assert.equal(tight.tau0ReciprocalPower, wide.tau0ReciprocalPower);
    assert.deepEqual(tight.lower, {neg: tight.upper});
    assert.deepEqual(wide.lower, {neg: wide.upper});
  }
  const physicalOrder = N.compareEndpoints(tight.upper, wide.upper);
  const normalizedOrder = zero ? 0 : N.compareEndpoints(tight.normalizedUpper, wide.normalizedUpper);
  assert(physicalOrder !== null && physicalOrder <= 0, name);
  assert(normalizedOrder !== null && normalizedOrder <= 0, name);
  rows.push({name, exactZero: zero, tightUpperComparedToCoarse: physicalOrder,
    tightNormalizedUpperComparedToCoarse: normalizedOrder});
}
assert.equal(rows.length, 67);
assert.equal(rows.filter(row => row.exactZero).length, 19);
const result = {
  status: 'PASS_DIRECTED_256_BIT_INTERVALS_INSIDE_COARSE_96_BIT_INTERVALS',
  comparison: rows, release: 'HOLD',
};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log('PASS', rows.length, 'directed physical and normalized interval containments');
