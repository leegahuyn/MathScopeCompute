/** Directed winding cap for the saved original initialized angular field. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [goal, runtime, output] = process.argv.slice(2);
assert.equal(process.argv.length, 5);
const pins = {
  primary: ['whole-k-primary-potential-c3/initialized-primary-potential-c3.json',
    '6c3a65a40767e74e2093ddc6869e33fe024f154eb60a1b77a22ac365b4c6140d'],
  fixed: ['whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json',
    '9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'],
  thresholds: ['whole-k-selector-scales/historical-scale-arithmetic-result.json',
    'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'],
  angle: ['final67/initial-fourier/initialized-angular-split.json',
    '0545658bf1dc4d5b373639c562ce537be1600a2210089faaa90aa6f77a8ed0b2'],
};
const {primary, fixed, thresholds, angle} = Object.fromEntries(await Promise.all(
  Object.entries(pins).map(async ([name, [path, digest]]) =>
    [name, await load(resolve(goal, path), digest)])));
assert.equal(angle.sourceSHA256, primary.sourceSHA256);
assert.equal(angle.registrySHA256, primary.registrySHA256);
assert.equal(angle.status, 'VERIFIED_ORIGINAL_INITIALIZED_ZERO_MODE_SPLIT');
const phaseFirst = primary.intermediate.phase[0];
const kUpper = primary.intermediate.kUpper;
assert.deepEqual(primary.nodes[phaseFirst], {op: 'multiply', args: [kUpper, 2286]});
assert.deepEqual(primary.nodes[2286], {op: 'add', args: [33, 64, 79, 2285]});
assert.deepEqual(primary.nodes[2285],
  {op: 'multiply', args: [33, primary.intermediate.epsInv]});
const carrierUpper = 33;

const {N} = await sourceArithmetic(runtime, thresholds.sourcePins, 'coarse-upper');
const results = new Map();
const leaves = new Set();
function value(root) {
  if (results.has(root)) return results.get(root);
  const {op, args} = primary.nodes[root];
  let result;
  switch (op) {
    case 'rational':
      result = N.point(args.join('/'));
      break;
    case 'authenticated_source_norm_root': {
      const [namespace, id] = args;
      assert.equal(namespace, 'hosted-original');
      assert.ok(fixed.hostedOriginal[id], id);
      leaves.add(id);
      result = N.fromClosed(fixed.hostedOriginal[id]);
      break;
    }
    case 'add':
      result = args.map(value).reduce(N.add, N.zero());
      break;
    case 'multiply':
      result = args.map(value).reduce(N.mul, N.one());
      break;
    case 'integer_power':
      result = N.pow(value(args[0]), args[1]);
      break;
    case 'inverse':
      result = N.inverse(value(args[0]));
      break;
    case 'exp':
      result = N.exp(value(args[0]));
      break;
    default:
      assert.fail(`Unexpected original arithmetic operation ${op}`);
  }
  results.set(root, result);
  return result;
}

const upper = N.toClosed(N.mul(value(kUpper), value(carrierUpper))).upper;
assert.equal(N.compareEndpoints(upper, {rational: '1'}), 1);
const result = {
  status: 'CONDITIONAL_DIRECTED_INITIALIZED_INTEGER_WINDING_CAP',
  sourcePins: pins, sourceSHA256: angle.sourceSHA256,
  physicalWindingUpper: upper,
  formula: '|omega|=k |p| <= kUpper * carrierUpper using the original signed source carrier bound and admitted band envelope.',
  cutoffs: {pressure: 'ceil(physicalWindingUpper)',
    cartesianVelocity: 'ceil(physicalWindingUpper)+1',
    cartesianVelocityGradient: 'ceil(physicalWindingUpper)+2'},
  zeroTailForCutoffAtLeastCap: true,
  roots: {carrierUpper, kUpper}, arithmeticRecords: results.size,
  hostedInputs: [...leaves].sort((a, b) => a - b),
  scope: 'Saved initialized velocity and pressure on admitted fixed labels and smooth regular annular circles. '
    + 'The previously proved carrier and band envelopes are inputs. The integer cutoff is symbolic and '
    + 'does not supply a practical grid, a finite small-cutoff estimate, or any later correction.',
  release: 'HOLD',
};
await writeFile(output, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({status: result.status, arithmeticRecords: results.size, inputs: leaves.size}));
