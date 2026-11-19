import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {compileFunction} from 'node:vm';

const [repo, goal, runtime, output] = process.argv.slice(2);
assert(repo && goal && runtime && output, 'REPO GOAL_NEXT ORIGINAL_RESEARCH_IDE NEW_OUTPUT');
const inputs = {};
function pinned(name, bytes, hash) {
  assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, name);
  inputs[name] = hash;
  return bytes.toString('utf8');
}
function file(root, path, hash) {
  return pinned(path, readFileSync(join(root, path)), hash);
}
const forcedPath = 'research-ide/mathscope-m3/navier/source-forced-class-majorants.mjs';
const originalForced = pinned(forcedPath, execFileSync('git', [
  '-c', 'safe.directory=' + resolve(repo).replaceAll('\\', '/'), '-C', repo, 'show',
  'b0c58df:' + forcedPath,
]), 'b609413ea8f86d023d3331c90c2ecaecf139f07de69d8d05ee6feb46c865f053');
const originalBackground = file(runtime, 'mathscope-m2/navier/actual-compact-all-band-background-norms.mjs',
  '62d877ca5d45073c8e95862bc0f5d0d44197f8ace34bd77d885bfbececc69464');
const gaussianPath = 'mathscope-m2/navier/actual-all-order-gaussian-jet-kernel.mjs';
file(runtime, gaussianPath, '5de9d043e77bc511e2e117bc825c42d60375193f617a78724ae535f0127415f6');
file(runtime, 'mathscope-m2/navier/actual-pulse-gaussian-power-kernel.mjs',
  '534976d0dfd4c02fa8e7e4f6e5ea46c7152e33d793c489d7450f320a536abbc7');
file(runtime, 'mathscope-m2/navier/actual-continuation-arithmetic.mjs',
  '5b889de71fdb464e1ad0b1b17a4d5d0a7d6fb9a17a9a3e57379fd566cfd8fbea');
file(runtime, 'mathscope-m2/navier/actual-continuation-exact-identities.mjs',
  'bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712');
file(runtime, 'mathscope-m1/navier/numerics.mjs',
  'a406401c5a0e024e94d58cce0d7e6bdaa6b35488f22fd0ead4bf87222416c62c');
const c8 = JSON.parse(file(goal, 'final67/local-background-c8/c8-slab.json',
  'e26c62baf924c4209bbac2ebd944bd17a992bfe4599fd1a8fab2cb8c91d7c02b'));
const old = JSON.parse(file(goal, 'final67/active-n3-cap-transport/source-cap/cap-transport.json',
  '387863daedfc9fd37f7c1d43db430235238f94d23b767424baffa5d2f3348955'));

assert(originalBackground.includes('B_m:G.maximum(Bnorm,rows[j+2].Cslow,q(factorial(j+2)),Lmax,q(2))'));
for (const anchor of [
  'W=G.exp(G.mul(q(3),E,c.Lmax))',
  'K=G.maximum(q(4),row.B_m,q(maximumHarmonic),c.Lmax,commonAffineFactor)',
  'commonAffineFactor=G.mul(q(16),G.pow(Tg,5)),pressureReferenceFactor=G.exp(G.mul(c.h,G.log(q(2))))',
  'amplitudeConstant:G.mul(G.pow(W,p.order+1),G.pow(K,3*p.amplitudePower))',
  'pressureConstant:G.mul(pressureReferenceFactor,G.pow(W,p.order+1),G.pow(K,3*p.pressurePower))',
  'actualInputSeminormSupplied:false',
  'amplitudeEpsilonGain:\'0\',pressureEpsilonGain:\'1/2\',inputBoundaryPoleAdded:0',
]) assert(originalForced.includes(anchor), anchor);

assert.deepEqual(old.propagatorSourceRecords['18310066'], {op:'integer_power',args:[18310065,8]});
assert.equal(old.propagatorToOriginalPhysicalGain.nativeNormNamespaceRoots.Bnorm, c8.roots.bnorm);
assert.equal(old.propagatorToOriginalPhysicalGain.nativeNormNamespaceRoots.Lmax, c8.roots.lmax);
assert(old.propagatorToOriginalPhysicalGain.sourceInequalities.includes('ellMinimum>=Bnorm^512 in that same privately sealed family'));
assert(old.propagatorToOriginalPhysicalGain.sourceInequalities.includes('log C12EnvelopeR=exp(25600000*log CSelected)>8002*T_parameter=log(h^-1)'));
assert.equal(old.all20ForcedSystems.length, 20);
assert.equal(new Set(old.all20ForcedSystems.map(row => row.key + ':' + row.harmonic)).size, 20);
assert.equal(c8.literalRows.length, 330);
assert.deepEqual(c8.split.map(row => row.maxN), [2,3,3]);
assert(c8.localBudget.every(row => row.comparisons.smallGrowth128 === -1));
const w8 = c8.untouchedComparisons.find(row => row.id === 18310066);
assert(w8 && w8.comparisons.smallGrowth128 === -1);
assert(c8.untouchedComparisons.some(row => row.id === 18310062 && row.comparisons.smallGrowth128 === -1));
assert.equal(c8.untouchedComparisons.filter(row => row.kind.startsWith('weighted target')).length, 7);
assert(c8.originalGlobalKRemainsUnchanged);

const {allOrderMixedGaussianJetPowerAudit} = await import(pathToFileURL(resolve(runtime, gaussianPath)).href);
const start = originalForced.indexOf('const seals=');
const end = originalForced.indexOf('const record=p=>');
assert(0 <= start && start < end);
const recipe = originalForced.slice(start, end)
  .replace('export function originalStableForcedClassPowers','function originalStableForcedClassPowers');
const getPowers = compileFunction(recipe + '\nreturn originalStableForcedClassPowers;', [
  'allOrderMixedGaussianJetPowerAudit',
])(allOrderMixedGaussianJetPowerAudit);

// Bnorm dominates the additional positive finite factors, including 16*Tg^5.
const Bmin = 2n**128n;
assert(16n * 6n**5n < Bmin);
assert(12n * 2n**128n < Bmin**255n);
assert(2n**128n < Bmin**512n);
const orders = Array.from({length:7}, (_, order) => {
  const result = getPowers({order});
  const row = result.mapped.at(-1);
  assert.deepEqual([
    result.order, result.inputDerivativeOrder, result.backgroundPrefix.requiredBackgroundDerivativeOrder,
    result.amplitudeEpsilonExponentChange, result.pressureEpsilonExponentChange,
  ], [order, order, order+2, '0', '1/2']);
  assert(result.inputWAlphaSeminormStillRequired && result.inputBoundaryPolePreserved);
  assert(result.originalDampingNonnegativeRequired && result.propagatorIndependentOfMaximumHarmonic);
  assert.equal(row.commonReferenceSPowerAmplitude, row.amplitudePower);
  assert.equal(row.commonReferenceSPowerPressure, row.pressurePower);
  // Measured in H/2^131. Local K and S each cost <=8 units; W costs <=1.
  const amplitude = (order + 1) + 32*row.amplitudePower;
  const pressure = (order + 1) + 32*row.pressurePower + 8;
  assert(Number.isSafeInteger(amplitude) && Number.isSafeInteger(pressure));
  assert(Math.max(amplitude, pressure) < 2**21);
  return {order, backgroundOrder:order+2, amplitudePower:row.amplitudePower, pressurePower:row.pressurePower,
    amplitudeLogUnits_H_over_2pow131:amplitude, pressureLogUnits_H_over_2pow131:pressure,
    inputSeminormStillRequired:true};
});
const largest = Math.max(...orders.flatMap(row => [
  row.amplitudeLogUnits_H_over_2pow131, row.pressureLogUnits_H_over_2pow131,
]));
let bestExponent = 131;
while (largest >= 2**(131-bestExponent)) bestExponent -= 1;
assert(bestExponent >= 110);

const evidence = {
  schema:'MathScope.N7.LiveSlabForcedOperatorLogCost/1', inputSHA256:inputs,
  status:'VERIFIED_ORIGINAL_INTEGER_POWERS_CONDITIONAL_LIVE_SLAB_OPERATOR_COMPARISON',
  localDomain:c8.physicalPremise,
  requiredPathPremise:'The same actual own/reference arguments reached by the coefficient and moving-frame proof stay inside the authenticated live slow slab and satisfy its original primitive positivity and regularity. Reapply the finite degree argument; do not modify the global source norm or its private seal.',
  domainDistinction:'H_w changes fast Y while R,Z,T are fixed. This packet does not infer a full frozen-background or shifted-radial-path bound.',
  sourceScale:'H=h*(ellMinimum+15)*log(2); L=ellMinimum+15 >= Bnorm^512; Bnorm>h^-1 and Bnorm>=2^128.',
  localK:'Use the maximum of the existing local background and other positive operator leaves. The extra affine factor 16*Tg^5<2^128. C63 gives log(K_loc)<H/2^128.',
  W:'W^8=#18310066 is a separately checked untouched original operand; log(W)<H/2^131.',
  S:{proof:'ell_label<=2L implies log(S_label)=2 log(ell_label)<=6 sqrt(L) for L>=1. H>hL/2, hence log(S_label)/H < 12/(h sqrt(L)) < 12/Bnorm^255 < 2^-128.', ordinaryLogEstimate:'log(L)<=2*(sqrt(L)-1) via 1/u<=1/sqrt(u) for u>=1, and log(2)<1.'},
  pressureRatio:'log(2^h)/H=1/L<2^-128. The physical sqrt(epsilon) pressure gain remains. The label-ratio factors internal to the input seminorm still remain.',
  originalSystems:20, verifiedOrderPowers:orders, largestLogUnits_H_over_2pow131:largest,
  commonOperatorLogStrictUpper:'H/2^' + bestExponent,
  inputSeminorms:'All actual projected W_alpha input seminorms and neighboring input weights remain required. This packet also does not supply actual Signed or fresh mean caps.',
  fixedAffineMapFactor:'16*Tg^5, Tg=4+sqrt(2)<6',
  scope:{actualStageCapsClosed:0, gaugeDifferencesClosed:0, finalJets:0, N706:'OPEN', N805:'OPEN', release:'HOLD'},
};
writeFileSync(output, JSON.stringify(evidence,null,2)+'\n', {flag:'wx'});
process.stdout.write(JSON.stringify({orders:orders.length, systems:20, exponent:bestExponent, largest})+'\n');
