/** Read back the completed interval certificate and exercise missing input rejection. */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {access, copyFile, mkdir, mkdtemp, realpath, rm, writeFile} from 'node:fs/promises';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {load} from './source_arithmetic.mjs';

const [goal, tree, slow, input, out] = process.argv.slice(2);
assert(process.argv.length === 7 && goal && tree && slow && input && out,
  'Pass exactly GOAL_NEXT, ORIGINAL_RUNTIME, SLOW_RECEIPT, INPUT and OUTPUT.');
assert.notEqual(resolve(out).toLowerCase(), resolve(input).toLowerCase(), 'Use a separate output for the readback.');
const digest = '9dcc5ad21169fe7462bd76f588d994126f0beaef5fdfc4e6ab4657e056371b34';
const output = await load(input, digest);
const inventory = await load(resolve(goal, 'whole-k-initialized-gauge/stage-zero-source-inventory.json'),
  'b5fa6a985abf178a17019a28da112cd6d84d9545062f3f3e32cde2bf6a8cf6ed');
const originalBounds = await load(resolve(goal, 'whole-k-initialized-gauge/initialized-stage-zero-atoms.json'),
  'ac0c5dd82edad9dfef71266ef444b6448d77e6e9fc0739666fc55f5d53ff9a7a');
assert.equal(output.status, 'VERIFIED_ALL_67_ORIGINAL_INITIALIZED_STAGE_ZERO_NUMERICAL_INTERVALS');
assert.equal(output.source.sourceSHA256, inventory.sourceSHA256);
assert.equal(output.source.registrySHA256, inventory.registrySHA256);
assert.equal(output.source.sourceNodes, inventory.sourceNodes);
assert.equal(Object.keys(output.atoms).length, inventory.initialSymbolicRoots);
assert.deepEqual(Object.fromEntries(Object.entries(output.atoms).map(([name, row]) => [name, row.sourceRoot])), originalBounds.roots.all);

function closedSign(point) {
  const keys = Object.keys(point);
  assert.equal(keys.length, 1);
  const [kind] = keys;
  if (kind === 'exp') {
    closedSign(point.exp);
    return 1;
  }
  if (kind === 'neg') return -closedSign(point.neg);
  assert.equal(kind, 'rational');
  assert.match(point.rational, /^-?\d+(?:\/[1-9]\d*)?$/);
  const [numerator] = point.rational.split('/').map(BigInt);
  return numerator > 0n ? 1 : numerator < 0n ? -1 : 0;
}
for (const row of Object.values(output.atoms)) {
  assert.equal(closedSign(row.lower), -1);
  assert.equal(closedSign(row.upper), 1);
  if (Object.hasOwn(row.upper, 'rational')) {
    const ratio = endpoint => endpoint.rational.split('/').map(BigInt);
    const [n, d = 1n] = ratio(row.upper);
    const [l, m = 1n] = ratio(row.lower);
    assert.equal(l * d, -n * m);
  } else {
    assert.deepEqual(row.lower, {neg: row.upper});
  }
}
assert.deepEqual(output.counts, {gauge: 57, direct: 6, pressure: 4});
assert.equal(Object.values(output.consumedInputsByNamespace).reduce((a, b) => a + b, 0), 108);
assert.equal(output.scope.includesLaterCorrections, false);
assert.equal(output.finalJets, '0/67');

const paths = {
  'stage-zero': 'whole-k-initialized-gauge/initialized-stage-zero-atoms.json',
  'initialized-mean-positive': 'whole-k-annular-pressure-lower/lower-covariance-pressure.json',
  'initialized-pressure-positive': 'whole-k-angular-pressure/initialized-angular-pressure.json',
  'initialized-primary-positive': 'whole-k-primary-potential-c3/initialized-primary-potential-c3.json',
  trace: 'whole-k-annular-initial/numerical/stage-zero-transitive-inputs.json',
  fixed: 'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json',
  background: 'whole-k-annular-wrz-norm/numerical/background-c8-complete.json',
  target: 'whole-k-annular-wrz-norm/target-numerical/target-c7-complete.json',
  thresholds: 'whole-k-selector-scales/historical-scale-arithmetic-result.json',
  transport: 'whole-k-annular-initial/stage-zero-annular-transport.json',
};
const target = await load(resolve(goal, paths.target), output.source.inputSHA256.target);
const removedTarget = '153454';
assert(Object.hasOwn(target.targetC7, removedTarget));
delete target.targetC7[removedTarget];
const outParent = await realpath(dirname(resolve(out)));
const temp = await mkdtemp(join(outParent, '.stage-zero-missing-input-'));
try {
  for (const [key, relative] of Object.entries(paths)) {
    const local = join(temp, relative);
    await mkdir(dirname(local), {recursive: true});
    if (key === 'target') await writeFile(local, JSON.stringify(target));
    else await copyFile(resolve(goal, relative), local);
  }
  const entry = fileURLToPath(new URL('./evaluate_stage_zero_all.mjs', import.meta.url));
  const invalidOut = join(temp, 'should-not-exist.json');
  const test = spawnSync(process.execPath, [entry, temp, resolve(tree), resolve(slow), invalidOut], {encoding: 'utf8'});
  assert.equal(test.status, 1, test.stderr);
  assert.match(test.stderr, /target-c7-complete\.json/);
  assert.match(test.stderr, /AssertionError/);
  assert(!test.stdout.includes('PASS'));
  await assert.rejects(access(invalidOut), {code: 'ENOENT'});
} finally {
  const resolvedTemp = await realpath(temp);
  assert.equal(dirname(resolvedTemp), outParent);
  assert(basename(resolvedTemp).startsWith('.stage-zero-missing-input-'));
  await rm(resolvedTemp, {recursive: true});
}
await writeFile(out, JSON.stringify({status: 'PASS_ORIGINAL_STAGE_ZERO_NUMERICAL_READBACK', receiptSHA256: digest,
  originalInitializedRootsChecked: Object.keys(output.atoms).length, finiteSymmetricNumericalEndpointsChecked: 134,
  missingOriginalTargetRejected: Number(removedTarget), wholeKFinalJets: '0/67', release: 'HOLD'}, null, 2) + '\n');
console.log('PASS all 67 original roots, 134 closed symmetric endpoints, and missing target leaf rejection.');
