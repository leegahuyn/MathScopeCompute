/** Map the archived mean-wave ordinary C1 stencil to its original norm leaves. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [goal, ledgerPath, out] = process.argv.slice(2);
assert.equal(process.argv.length, 5, 'Use GOAL_NEXT, ORIGINAL_LEDGER and OUTPUT.');
async function read(path, digest) {
  const bytes = await readFile(path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), digest, path);
  return JSON.parse(bytes);
}
const [ledger, mean, wave, checked] = await Promise.all([
  read(ledgerPath, '62d2ba143b1257af8d80e2b184851ae4441d30bf197491fe00fd946473b8652c'),
  read(resolve(goal, 'whole-k-annular-pressure-lower/mean-path-longitudinal.json'), 'e366138903bd4ba773ac898707a0a38782cc00ace2d570733668e93760d1dc59'),
  read(resolve(goal, 'first-forced-mode-two-c1/mode-two-weighted-c1.json'), 'e2bf09b924c42fa444029ac6ef41cb1fc86094bb65130c522c30e19e457f6be4'),
  read(resolve(goal, 'first-forced-mode-two-c1/mode-two-output-readback.json'), '1c948cead33b39bf54343e9f95a6563e2336ebe20fd951df70ea3220ef5c540c'),
]);
assert.equal(wave.source.forcedSHA256, ledger.archive.graphSHA256);
assert.equal(wave.source.cycleSHA256, mean.sourceSHA256);
assert.equal(wave.source.sharedOriginalNodePrefix.count, 3860185);
assert.equal(checked.inputPositiveGraphSHA256, wave.positive.graphSHA256);
assert.equal(checked.checkedArchivedPathComponents, 60);
assert.deepEqual(ledger.axes, ['R', 'Z', 'T', 'xi', 'v']);
const byComponent = ['beta', 'v', 'gamma'];
const requested = new Set();
const unit = direction => Array.from({length: 5}, (_, j) => Number(j === direction));
const zero = [0, 0, 0, 0, 0];
const base = [zero, ...[0, 1, 3].map(unit)];
const output = [zero, ...[0, 1, 2, 3, 4].map(unit)];
for (const index of output) {
  for (const initial of base) {
    requested.add(initial.join(''));
    requested.add(initial.map((v, j) => v + index[j]).join(''));
  }
}
function chooseRoot(component, index) {
  const [r, z, t, xi, v] = index;
  const slow = r + z + t;
  if (v === 0 && xi <= 2) return mean.roots.meanSpatialInputs[component][['M', 'L', 'LL'][xi]][slow];
  if (v === 1 && xi <= 1) return mean.roots.longitudinalInputs[component][['N', 'NL'][xi]][slow];
  return undefined;
}
const means = Object.fromEntries(byComponent.map(component => [component, [...requested].sort().map(key => {
  const orders = [...key].map(Number);
  const root = chooseRoot(component, orders);
  assert(Number.isSafeInteger(root) && mean.nodes[root], `${component}: ${key}`);
  return {orders, root};
})]));
// The first extra v derivative for cross C2 generates M_vv. It cannot be
// obtained from an N or NL row, even though the positive mean graph has C2 slow.
const firstMissing = [0, 0, 0, 0, 2];
assert(byComponent.every(component => chooseRoot(component, firstMissing) === undefined));
assert.equal(ledger.degreeSummary[1].meanWave.maxLeafOrders.L, 2);
assert.equal(ledger.degreeSummary[1].meanWave.maxLeafOrders.M, 2);
const U = wave.positive.velocity[2];
assert(Number.isSafeInteger(U) && wave.positive.nodes[U]);
const pair = {r: 4, z: 4, phase: 6, connection: 4};
const ledgerConstants = {constant: 2 * (pair.r + pair.z), radialFast: 3 * pair.r,
  radiusInverse: 3 * pair.connection, phaseNormal: 3 * pair.phase * 2};
assert.deepEqual(ledgerConstants, {constant: 16, radialFast: 12, radiusInverse: 12, phaseNormal: 36});
const receipt = {
  status: 'CONDITIONAL_ORIGINAL_ARCHIVED_MEAN_WAVE_C1_INPUTS_BOUND',
  originalSource: {forced: wave.source.forcedSHA256, cycle: wave.source.cycleSHA256,
    commonPrefix: wave.source.sharedOriginalNodePrefix, cases: ledger.archive.cases.map(x => x.key)},
  bound: {powerUnits: '1/100000', real: 149998, imaginary: 99999, weight: 'sqrt(zeta)*delta^-72*P(v)',
    constant: 'C_M C_U (16+12 C_a+12 C_R+36 C_n)', exactCoefficientLedger: ledgerConstants,
    C_M: '64 * maximum of the original mean roots below', C_U: {root: U, namespace: 'first-forced-mode-two-c1/mode-two-weighted-c1.json:positive'},
    C_a: 'Bound a and its first R derivative after factoring epsilon^-kappa_s',
    C_R: 'Bound 1/R and its first R derivative', C_n: 'Bound original n and all first own-coordinate derivatives using F,G C2 and fixed label/carrier'},
  meanLeaves: {namespace: 'whole-k-annular-pressure-lower/mean-path-longitudinal.json', orders: means,
    sameFixedBandComparability: 'For nearest reference rho in {1/2,1,2}, rho^-A and all slow scalings through order two cost <8 in total. The xi and v scalings are <=1. The prior covariance/FiveMap factor 4 and epsilon_ref^p/epsilon_own^p<=2^(2h)<2 yield factor 64.',
    pureLongitudinalOrderTwoIsOpen: firstMissing},
  sourcePremises: ['Archived fixed N1 admitted shell and pulse box. Same actual support and smooth zero joins.',
    'Source mean valuation and positive norm analytic premises. The mean archive and wave archive have the same exact initialized prefix.',
    'Actual source normal/geometry and fixed-label slow bounds. The exact same chart must include every H_w point.',
    'The mode-two receipt supplies positive primary wave operands through C2 shared by mode one. This output never imports its forcing polynomial as a mode-one term.'],
  scope: {fullSupportedModeOneNumericallyBound: false, sameNewLiveFamilyBound: false, finalJets: '0/67', release: 'HOLD'},
};
await writeFile(out, JSON.stringify(receipt, null, 2) + '\n');
console.log(`PASS ${requested.size} exact mean-jet index requests per component and actual wave C2 source root ${U}.`);
