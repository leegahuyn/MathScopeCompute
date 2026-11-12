/** Execute the original finite-order weighted algebra without claiming a live class seal. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime, normsFile, out] = process.argv.slice(2);
assert.equal(process.argv.length, 5, 'Provide ORIGINAL_PRIMARY_RUNTIME FULL_SLOW_NORMS OUTPUT');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function pinned(path, expected) {
  const bytes = await readFile(path);
  assert.equal(sha(bytes), expected, path);
  return bytes;
}
const manifestSHA256 = '4ed49674a762ecf54adaa8ddf9b5c0955c484b5442dc251d862f0156f502f066';
const normsSHA256 = '517662b18f4014644cd7539de42b82b74999374aaf34273163f39693f160bdb4';
const [manifestRaw, normsRaw] = await Promise.all([
  pinned(resolve(runtime, 'GIT-SOURCE-SHA256.json'), manifestSHA256),
  pinned(normsFile, normsSHA256),
]);
const manifest = JSON.parse(manifestRaw);
assert.equal(Object.keys(manifest).length, 119);
await Promise.all(Object.entries(manifest).map(async ([path, digest]) => {
  assert(path.startsWith('research-ide/') && !path.split('/').includes('..'));
  await pinned(resolve(runtime, path), digest);
}));
const norms = JSON.parse(normsRaw);
assert.deepEqual(norms.domain.axes, ['R', 'Z', 'T']);
assert.equal(norms.backgroundC8.at(-1).order, 8);
const targetPoles = norms.weightedTargetC7.slice(0, 7).map(row => row.pole);
assert.deepEqual(targetPoles, [3, 6, 9, 12, 15, 18, 21]);

const adapter = 'research-ide/mathscope-m3/navier/source-primary-class-majorants.mjs';
const {originalPrimaryClassDegreeProgram} = await import(pathToFileURL(resolve(runtime, adapter)).href);
const run = (order, poles) => originalPrimaryClassDegreeProgram({order, targetPoles: poles, maxWork: 200_000});
const c2 = run(2, targetPoles.slice(0, 4));
const c5 = run(5, targetPoles);
assert.deepEqual(c5.derivativeOrders, {output: 5, amplitudeAndTarget: 6, background: 8});
assert.equal(c5.weighted.amplitude.length, 7);
assert.equal(c5.weighted.potential.length, 7);
assert.equal(c5.weighted.curl.length, 6);
assert.equal(c5.pressure.length, 6);
for (const key of ['amplitude', 'potential', 'curl']) {
  assert.deepEqual(c5.weighted[key].slice(0, c2.weighted[key].length), c2.weighted[key]);
}
assert.deepEqual(c5.pressure.slice(0, c2.pressure.length), c2.pressure);
const {amplitude, potential, curl, curlRows} = c5.weighted;
assert.deepEqual(amplitude[5], {power: 2073, pole: 30});
assert.deepEqual(potential[6], {power: 2509, pole: 36});
assert.deepEqual(curlRows[5].fastTerms[0], {power: 2510, pole: 36});
assert.deepEqual(curl[5], {power: 2514, pole: 36});
assert.deepEqual(c5.pressure[4], {power: 1695, pole: 24});
assert.equal(c5.sourceAuthenticated, false);
assert.equal(c5.weighted.actualTargetPoleBoundsProvedHere, false);

const result = {
  schema: 'MathScope.N7.OriginalPrimaryC5WeightedDegreeReplay/1',
  status: 'VERIFIED_ORIGINAL_FINITE_WEIGHTED_ALGEBRA_WITH_CONDITIONAL_FIELD_BOUND',
  runtimeManifestSHA256: manifestSHA256,
  sourceSHA256: manifest[adapter],
  fullSlowNormsSHA256: normsSHA256,
  originalOrders: c5.derivativeOrders,
  targetPoles,
  powerConvention: '(K*S)^power * delta_star^(-pole), with original epsilon, sqrt(zeta), and P(v) factors',
  degrees: {amplitude, potential, curlRemainder: curl, pressure: c5.pressure, curlOrderFive: curlRows[5]},
  epsilonPowers: c5.exponents,
  premises: c5.weighted.premises,
  scope: {
    verifiedPriorOrderTwoPrefix: true, sameLiveFamilyAttached: false, actualKEnclosedHere: false,
    actualForcedClassCertified: false, finalJets: '0/67', release: 'HOLD',
  },
};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log('PASS original Primary C5 weighted degree recurrence and C2 prefix comparison');
