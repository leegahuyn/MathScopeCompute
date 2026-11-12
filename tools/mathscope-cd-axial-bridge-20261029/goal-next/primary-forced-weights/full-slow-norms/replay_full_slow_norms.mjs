/** Enclose all R,Z,T directions using the archived original positive profile graphs. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sha, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [goal, runtime, out] = process.argv.slice(2);
assert.equal(process.argv.length, 5, 'Provide GOAL_NEXT ORIGINAL_RUNTIME OUTPUT');
const inputs = {
  backgroundGraph: ['whole-k-annular-wrz-norm/background-c8.json', '5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e'],
  targetGraph: ['whole-k-annular-wrz-norm/target-c7.json', '3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770'],
  background: ['whole-k-annular-wrz-norm/numerical/background-c8-complete.json', '4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966'],
  target: ['whole-k-annular-wrz-norm/target-numerical/target-c7-complete.json', 'b262127767b185e99041bd14f1f8dd2af6fe7d9a95736b93d9ac114914348f1a'],
  fixed: ['whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json', '9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'],
  thresholds: ['whole-k-selector-scales/historical-scale-arithmetic-result.json', 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'],
};
const sourcePins = {
  backgroundProducer: ['whole-k-annular-wrz-norm/replay_background_c8.mjs', 'ec125854198ced32cb80b1d48dc31ac39749bff318a59a6bdbbd3b1435c2d655'],
  targetProducer: ['whole-k-annular-wrz-norm/replay_target_c7.mjs', '06b2791ae53587b8c76408271c929c8479a7d76f5b3ade741f1a2e164dc62446'],
  chart: ['research-ide/mathscope-m2/navier/actual-all-band-background-norm-kernel.mjs', '384daafdcb5cad2e57b4bbb0440bc4b2e4a5912b4835e2d7510c21301a44ff15'],
  normalization: ['research-ide/mathscope-m2/navier/actual-common-target-weighted-norms.mjs', '6fca53620e45a839868d094a1425ee0071ec4ca21c16bff77476d8be2f32e38a'],
};
const readSource = async ([relative, expected]) => {
  const raw = await readFile(resolve(relative.startsWith('research-ide/') ? runtime : goal, relative));
  assert.equal(sha(raw), expected, relative);
  return raw.toString();
};
const [evidence, source] = await Promise.all([
  Promise.all(Object.entries(inputs).map(async ([key, [relative, pin]]) =>
    [key, await load(resolve(goal, relative), pin)])).then(Object.fromEntries),
  Promise.all(Object.entries(sourcePins).map(async ([key, pin]) =>
    [key, await readSource(pin)])).then(Object.fromEntries),
]);
const {backgroundGraph, targetGraph, background, target, fixed, thresholds} = evidence;
for (const key of ['backgroundProducer', 'targetProducer']) {
  assert(source[key].includes('G.mul(q(j+1),bound,G.pow(deltaInv'));
  assert(source[key].includes('G.mul(q(fac(j),fac(a)*fac(b)'));
  assert(source[key].includes('G.maximum(G.one'));
}
assert(source.backgroundProducer.includes('sourceNormalizedCutoffWeights({order:n,derivativeOrder:m})'));
assert(source.chart.includes('physicalCoordinates=[R,G.mul(sD,eta),G.mul(s,d)]'));
assert(source.normalization.includes('s^(-A-1/2)*P(X,eta), whose P has no s dependence'));
assert.equal(backgroundGraph.graph.uncompressedSHA256, background.originalGraphSHA256);
assert.equal(targetGraph.graph.uncompressedSHA256, target.originalGraphSHA256);
assert.equal(backgroundGraph.sourceParameterSHA256, targetGraph.sourceParameterSHA256);
assert.deepEqual(backgroundGraph.activePrefix, [0, 1, 2, 3]);
assert.deepEqual(backgroundGraph.fixedSlowComplexChart, {
  radius: '1/(128 Rstar)', fieldMultiplierSup: '8', XSup: '6 Rstar^2', etaSup: '4', logSSup: '4',
});
assert.deepEqual(targetGraph.fixedSlowComplexChart, {
  radius: '1/(128 Rstar)', multiplierSup: '8', XSup: '6 Rstar^2', etaSup: '4',
});

const {N} = await sourceArithmetic(runtime, thresholds.sourcePins, 'coarse-upper');
const zero = {rational: '0'};
const {lower: hLow, upper: hHigh} = fixed.hostedOriginal[9];
assert.equal(N.compareEndpoints(hLow, zero), 1);
assert.equal(N.compareEndpoints(hHigh, {rational: '1/64'}), -1);
const Rstar = N.fromClosed(fixed.hostedOriginal[216823]);
assert.equal(N.compareEndpoints(N.toClosed(Rstar).lower, {rational: '1'}), 1);
assert.equal(N.compareEndpoints(
  N.toClosed(N.mul(N.point('4'), N.fromClosed(background.Xb))).upper,
  N.toClosed(N.pow(Rstar, 2)).lower,
), -1);

// The same source polydisc radius works when T also varies. A degree-j
// Cauchy coefficient sum has binom(j+2,2) terms in place of j+1.
const factors = Array.from({length: 9}, (_, j) => {
  const oldCount = BigInt(j+1);
  const newCount = oldCount * BigInt(j+2) / 2n;
  const bound = 2n ** BigInt(j);
  assert(newCount <= oldCount * bound);
  if (j === 1) assert(newCount > oldCount);
  return {degree: j, twoVariables: Number(oldCount), threeVariables: Number(newCount),
    factor: String(bound), cumulativeThreeVariableIndices: (j+1)*(j+2)*(j+3)/6};
});
assert.equal(factors[6].cumulativeThreeVariableIndices, 84);
assert.equal(factors[8].cumulativeThreeVariableIndices, 165);

function extend(interval, degree) {
  const value = N.mul(N.point(factors[degree].factor), N.fromClosed(interval));
  const upper = N.toClosed(value).upper;
  assert.equal(N.compareEndpoints(upper, zero), 1);
  return {lower: zero, upper};
}
const backgroundC8 = backgroundGraph.bounds.map(({order, F, G}, j) => {
  assert.equal(j, order);
  return {order, originalDirectionalRoots: {F, G},
    F: extend(background.backgroundC8[F], order), G: extend(background.backgroundC8[G], order)};
});
const weightedTargetC7 = targetGraph.bounds.map(({order, pole, component}, j) => {
  assert.equal(j, order);
  assert.equal(pole, 3 + 3*order);
  return {order, pole, originalDirectionalRoots: component,
    component: component.map(root => extend(target.targetC7[root], order))};
});
assert.equal(backgroundC8.length, 9);
assert.equal(weightedTargetC7.length, 8);

const result = {
  schema: 'MathScope.N7.OriginalFixedBandFullSlowNumericalNorms/1',
  status: 'VERIFIED_ORIGINAL_FULL_R_Z_T_BOUNDS_ON_THE_FIXED_PHYSICAL_SLAB',
  sourceParameterSHA256: targetGraph.sourceParameterSHA256,
  inputPins: inputs,
  sourcePins,
  domain: {
    axes: ['R', 'Z', 'T'], s: ['1/2', '2'], X: ['Xa', 'Xb'], eta: ['-3/4', '3/4'],
    q: ['qBig/64', 'qBig/16'], fixedBandAndDiscreteLabels: true,
    timeConvention: 'ordinary T derivatives of normalized source profiles at fixed band; continuous inward jets at chart boundaries',
  },
  transformation: {
    radius: '1/(128 Rstar)', sameElementarySuprema: true, allTermsPositive: true,
    reason: 'For each factor of degree j the extra Cauchy count costs at most 2^j; finite positive products and composition charge 2^m in total degree m.',
    targetWeight: 'zeta times delta_star^(-(3+3*m)) at a real point; no complex continuation of the profile or the weight',
    factors,
  },
  backgroundC8,
  weightedTargetC7,
  scope: {privateLiveFamilyHydrated: false, primaryC5Attached: false, finalJets: '0/67', release: 'HOLD'},
  arithmetic: N.report(),
};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log('PASS 18 background and 16 weighted target numerical bounds in all original R,Z,T directions');
