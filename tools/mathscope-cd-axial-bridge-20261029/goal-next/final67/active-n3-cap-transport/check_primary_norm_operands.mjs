/** Compare all original Primary K operand intervals with the existing energy gates. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const [goal, runtime, historical, output] = process.argv.slice(2);
assert.ok(output);
const helper = resolve(goal, 'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/evaluate_mean_bulk_energy.mjs');
const helperSHA256 = '61d4d23e7ec003206758c861a2e464791730dc6f14b648d3b5eb721418f59f7b';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(digest(await readFile(helper)), helperSHA256);
const {prepareMeanBulkEnergy} = await import(pathToFileURL(helper).href);
const coefficients = resolve(goal, 'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/weighted-velocity-coefficients.json');
const {N, q, closed, load, hLogTau, Xb, pins} =
  await prepareMeanBulkEnergy(goal, runtime, historical, coefficients);
const norm = resolve(goal, 'primary-forced-join/active-n3-c5-binding/norm-leading');
const coarsePin = '0e1984e6f872e9a167b7920d31a55b4888a807c359a0c38dbff9f8f8af5f4acb';
const backgroundPin = '6a73957352e35808f716d85355d6d14c164b61ccd027c3ea372bc015e8a01aec';
const [coarse, background] = await Promise.all([
  load(resolve(norm, 'n3-whole-k.json'), coarsePin),
  load(resolve(norm, 'n3-background.json'), backgroundPin),
]);
assert.equal(coarse.K, 18310069);
assert.equal(background.K, coarse.K);
assert.equal(background.background.id, 14220496);
assert.equal(coarse.operands.length, 14);
assert.equal(N.compareEndpoints(closed(hLogTau).upper, {rational:'0'}), -1);
assert.equal(N.compareEndpoints(closed(Xb).lower, {rational:'1'}), 1);

const definitions = [
  ...[1, 2, 3, 4].map(j => ({gate:'existingSpatialStage'+j, exponent:j+'/10', dyadic:33})),
  {gate:'commonNormalizedStage1', exponent:'1', dyadic:28},
  {gate:'smallExponentDiagnostic', exponent:'1/134217728', dyadic:0},
];
const thresholds = definitions.map(({gate, exponent, dyadic}) => {
  const positiveGain = N.exp(N.mul(q('-'+exponent), hLogTau));
  const geometric = N.mul(N.pow(Xb, -2), positiveGain);
  const value = N.mul(q('1/'+String(1n<<BigInt(dyadic))), geometric);
  const enclosure = closed(value);
  assert.equal(N.compareEndpoints(enclosure.lower, {rational:'1'}), 1);
  return {gate, exponent, dyadic, enclosure,
    lowerOfOneSixtyFourth:closed(N.mul(q('1/64'), value)).lower};
});

function compare(op) {
  return {id:op.id, ...(op.order===undefined?{}:{order:op.order}), kind:op.kind,
    comparisons:thresholds.map(({gate, enclosure, lowerOfOneSixtyFourth}) => {
      const upperToLower = N.compareEndpoints(op.interval.upper, enclosure.lower);
      const lowerToUpper = N.compareEndpoints(op.interval.lower, enclosure.upper);
      const upperToOneSixtyFourth = N.compareEndpoints(op.interval.upper, lowerOfOneSixtyFourth);
      assert.ok([upperToLower, lowerToUpper, upperToOneSixtyFourth].every(value => value !== null));
      return {gate, upperToLower, lowerToUpper, upperToOneSixtyFourth};
    })};
}
const operands = coarse.operands.map(compare);
const outside = operands.filter(row => row.comparisons.some(test => test.upperToLower > 0));
assert.deepEqual(outside.map(row => row.id), [14220496]);
assert.ok(outside[0].comparisons.every(row => row.lowerToUpper < 0 && row.upperToLower > 0));
assert.ok(operands.filter(row => row.id !== 14220496)
  .every(row => row.comparisons.every(test => test.upperToOneSixtyFourth < 0)));

const [slow, finiteBlock, ...orders] = [
  {...background.Cslow, kind:'original C8 slow constant'},
  {...background.normalizedFiniteBlock, kind:'original C8 finite normalized block'},
  ...background.normalizedFiniteBlock.finite.map(row => ({...row, kind:'original C8 finite profile order'})),
].map(compare);
assert.ok(slow.comparisons.every(row => row.lowerToUpper < 0 && row.upperToLower > 0));
assert.ok(finiteBlock.comparisons.every(row => row.lowerToUpper > 0));
assert.deepEqual(orders.map(row => row.order), [1,2,3,4,5,6,7]);
assert.ok(orders.slice(0,3).every(row => row.comparisons.every(test => test.upperToOneSixtyFourth < 0)));
assert.ok(orders[3].comparisons.every(row => row.lowerToUpper < 0 && row.upperToLower > 0));
assert.ok(orders.slice(4).every(row => row.comparisons.every(test => test.lowerToUpper > 0)));

const evidence = {
  status:'VERIFIED_PRIMARY_K_OPERAND_THRESHOLD_READBACK_C8_REMAINS',
  sourcePins:{...pins, helper:helperSHA256, originalPrimaryK:coarsePin, originalBackgroundC8:backgroundPin},
  originalK:coarse.K, sourceBackgroundRoot:background.background.id, thresholds, operands,
  wholeKOperandsStrictlyBelowThresholdFraction:13, thresholdFraction:'1/64',
  backgroundC8:{slow, finiteBlock, orders},
  scope:'Directed comparisons of saved original norm expressions under their source premises. The original global K includes the complete background block. An interval bound expression can exceed a gate even when the corresponding field norm is small. The grouped fixed-slab actual background and complete corrected-field caps stay open.',
  release:'HOLD', N706:'OPEN', N805:'OPEN', finalJets:0,
};
await writeFile(output, JSON.stringify(evidence, null, 2)+'\n', {flag:'wx'});
console.log(JSON.stringify({status:evidence.status, thresholds:thresholds.length, operands:operands.length,
  strictlyBelowOneSixtyFourth:13, backgroundRoot:evidence.sourceBackgroundRoot,
  firstThreeActiveProfileBoundsStrictlyBelowOneSixtyFourth:true}));
