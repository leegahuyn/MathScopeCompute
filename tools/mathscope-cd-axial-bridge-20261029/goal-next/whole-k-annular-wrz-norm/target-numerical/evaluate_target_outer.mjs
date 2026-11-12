/** Finite real Taylor bounds for the regularized outer target and its FTC faces. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sha, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [tree, targetFile, kernelFile, amplitudeFile, backgroundFile, fixedFile, thresholdsFile, out] = process.argv.slice(2);
assert(tree && targetFile && kernelFile && amplitudeFile && backgroundFile && fixedFile && thresholdsFile && out);
const target = await load(targetFile, '3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770');
const kernels = await load(kernelFile, '934731bc39f6770d49fb3085c1e3cf350db33d16a40ae1e9a5de2a605a85b1f6');
const amplitudeSHA256 = '370f913b7f664b9e0f4cd289cc1970f946ce917620984db814f187df72e9d812';
const amplitude = await load(amplitudeFile, amplitudeSHA256);
const background = await load(backgroundFile, '4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966');
const fixed = await load(fixedFile, '9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c');
const thresholds = await load(thresholdsFile, 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const program = await readFile(resolve(tree, 'research-ide/mathscope-m2/navier/actual-stress-direction-program.mjs'));
assert.equal(sha(program), 'b3567c39a9381ef16c3d94f0a24a88571a87dee7a61b9fe782d2076732b165f5');
assert.equal(target.graph.uncompressedSHA256, kernels.targetGraphSHA256);
assert.equal(amplitude.status, 'SOURCE_BOUND_TERMINAL_AMPLITUDE_UPPER_CONDITIONAL_ORIGINAL_ANALYTIC_SEMANTICS');
assert.equal(amplitude.targetGraphSHA256, target.graph.uncompressedSHA256);
assert.equal(amplitude.sourceParameterSHA256, target.sourceParameterSHA256);
assert.equal(amplitude.targetOuterEpowB, target.regionFactoring.outer.EpowB);
assert.equal(amplitude.alphaNormalizedOriginalAndTargetSHA256, '508dd94a9ac67a4cfdf11cbaa05b6f713762f6c7ee639e2270a5b1cb7817971b');
assert.equal(amplitude.bound, '0<EpowB<exp(-65536)<1; 0<=delta<=1/2 and A=1/2+h<1 give EpowB*exp(A*delta)<2');
assert.deepEqual(kernels.originalJkernels.map(({root, m}) => [root, m]),
  [[119364, -3], [119561, -3], [119679, -3], [119689, 0]]);
assert.deepEqual(target.regions.outer.bodies, [119567, 119694]);
const source = program.toString();
for (const fragment of [
  "EpowB=G.mul(p('Pstar'),G.exp(terminal.logAEnd))",
  'Kdelta=G.mul(pow,G.add(G.mul(A,heat),G.mul(Z,exactHeatZ)))',
  'c=G.mul(rho,G.add(G.mul(q(8),go),G.mul(G.pow(s,3),gp)))',
  "J('outer_viscous_stress',delta,-3",
  "J('outer_inviscid_stress',delta,-3",
  "J('outer_pressure',s,-3",
  "J('outer_axial_stress',delta,0",
  'outerScaledZ=G.mul(G.pow(delta,6),outerZ)',
]) assert(source.includes(fragment), fragment);

const {N} = await sourceArithmetic(tree, thresholds.sourcePins, 'coarse-upper');
const zero = {rational: '0'};
const one = N.one();
assert.equal(N.compareEndpoints(background.Xb.lower, {rational: '1'}), 1);
assert.equal(N.compareEndpoints(fixed.hostedOriginal[9].lower, zero), 1);
assert.equal(N.compareEndpoints(fixed.hostedOriginal[9].upper, {rational: '1/64'}), -1);
const radius = N.sqrt(N.mul(N.point('2'), N.fromClosed(background.Xb)));
const Rstar = N.fromClosed(fixed.hostedOriginal[216823]);
assert.equal(N.compareEndpoints(N.toClosed(radius).upper, N.toClosed(Rstar).lower), -1);

// A coefficient of degree k bounds the sum of absolute ordinary Taylor
// coefficients of total degree k in the two real variables delta and eta.
const order = 9;
const numbers = Array.from({length: order + 1}, (_, k) => k);
const fac = [1n];
for (let k = 1; k <= order + 2; k++) fac.push(BigInt(k) * fac[k - 1]);
const choose = (n, k) => fac[n] / (fac[k] * fac[n-k]);
const series = (...a) => numbers.map(k => BigInt(a[k] ?? 0));
const add = (...args) => numbers.map(k => args.reduce((v, a) => v + a[k], 0n));
const scale = (a, s) => a.map(v => v * BigInt(s));
const product = (a, b) => numbers.map(k =>
  Array.from({length: k+1}, (_, j) => a[j] * b[k-j]).reduce((v, t) => v + t, 0n));
const mul = (...args) => args.reduce(product, series(1));
const noConstant = a => [0n, ...a.slice(1)];
function compose(coefficients, perturbation) {
  assert.equal(perturbation[0], 0n);
  let power = series(1);
  let total = series(0);
  for (const k of numbers) {
    total = add(total, scale(power, coefficients[k]));
    power = product(power, perturbation);
  }
  return total;
}
const scalar = numbers.map(() => 2n);
const delta = series(1, 1);
const eta = series(1, 1);
const invL = numbers.map(k => 2n * 8n**BigInt(k));
const flat = k => k === 0 ? 1n : 8n**BigInt(k) * (1n + fac[k]);
const goFull = [9n];
for (let k = 1; k <= order+1; k++) {
  let value = 0n;
  for (let j = 1; j <= k; j++) value += 2n * flat(j) * goFull[k-j];
  goFull.push(9n * value);
}
const go = goFull.slice(0, order+1);
const goPrime = numbers.map(k => BigInt(k+1) * goFull[k+1]);
const flatHalf = numbers.map(flat);
const f = add(series(1), mul(flatHalf, go));
const c = add(scale(go, 8), mul(delta, delta, delta, goPrime));
const Z = scale(mul(series(1, 2, 1), scalar), 2);
const H = compose(numbers.map(k => fac[k+1]), noConstant(Z));
// The original terminal amplitude proof bounds EpowB*exp(A*delta) by 2.
// Its higher Taylor coefficients are no larger since 0<A<1.
const K = mul(scalar, H);
// Kdelta also needs degree 10 of K to bound its degree-nine Taylor slot.
// Apply the same positive composition through ten directly.
function coefficient10(base, perturbation) {
  const end = 10;
  const convolution = (a, b) => Array.from({length: end+1}, (_, k) =>
    Array.from({length: k+1}, (_, j) => a[j]*b[k-j]).reduce((v, t) => v+t, 0n));
  const term = [1n, ...Array(end).fill(0n)];
  let power = term;
  const total = Array(end+1).fill(0n);
  for (let j = 0; j <= end; j++) {
    for (let k = 0; k <= end; k++) total[k] += base[j] * power[k];
    power = convolution(power, perturbation);
  }
  return 2n * total.reduce((v, t) => v + t, 0n);
}
const k10 = coefficient10(Array.from({length: 11}, (_, j) => fac[j+1]), [...noConstant(Z), 16n]);
const Kdelta = [...K.slice(1).map((v, k) => v*BigInt(k+1)), 10n * k10];

// Coefficients in the J integrand of degree k may additionally carry
// (1+t)^k. Each original denominator has base >= 1. The absolute
// Taylor coefficients of w^(-1/2) are <= 1 and w^(-3/2) <= k+1.
const perturbationW = series(0, 1, 1);
const inverseSqrt = compose(numbers.map(() => 1n), perturbationW);
const perturbationS = noConstant(mul(delta, inverseSqrt));
const kernelArgument = add(perturbationS, series(0, 1));
const weight3 = compose(numbers.map(k => BigInt(k+1)), perturbationW);
const moments = numbers.map(k => Array.from({length: k+1}, (_, j) => choose(k, j)*fac[j])
  .reduce((v, t) => v+t, 0n));
function J(g, m) {
  assert(m === -3 || m === 0);
  const coefficient = mul(compose(g, kernelArgument), m === 0 ? weight3 : series(1));
  return coefficient.map((v, k) => v * moments[k]);
}
// r/r0 and r0/r are bounded by scalar, r0=sqrt(2 Xb)>1. The three theta
// terms have radial factors r0^-1, r0^-1 and r0. The axial term has r0.
const viscous = J(mul(scalar, add(K, scale(Kdelta, 2)), c), -3);
const inviscid = J(mul(scalar, scalar, scalar, K, c), -3);
const pressure = mul(eta, J(mul(K, K, f, c), -3), invL);
const axialIntegral = J(mul(scalar, scalar, pressure), 0);
const delta3 = mul(delta, delta, delta);
const theta = add(scale(mul(K, c, scalar), 2), mul(delta3, viscous, scalar, scalar),
  mul(delta3, inviscid, invL, scalar, scalar));
const axial = mul(delta3, delta3, axialIntegral, scalar);
const C = [theta, axial].map(values => numbers.map(k =>
  values.slice(0, k+1).reduce((best, value, j) => value * fac[j] > best ? value * fac[j] : best, 0n)));
const rows = target.regions.outer.rows.map(row => {
  const n = row.orders[0] + row.orders[1] + 2;
  const M = N.mul(Rstar, N.point(String(C[row.component][n])));
  const upper = N.toClosed(N.mul(N.point('9/2'), N.add(one, M))).upper;
  return {root: row.root, component: row.component, orders: row.orders, interval: {lower: zero, upper}};
});
assert.equal(rows.length, 72);
assert.equal(new Set(rows.map(row => row.root)).size, 72);
const result = {
  status: 'VERIFIED_ORIGINAL_72_OUTER_TARGET_FTC_NUMERICAL_UPPER_ENDPOINTS',
  originalGraphSHA256: target.graph.uncompressedSHA256,
  actualOuterBodies: target.regions.outer.bodies, derivativeOrder: order,
  integerTaylor: [theta, axial].map(values => values.map(String)),
  factor: 'Rstar', terminalAmplitudeSHA256: amplitudeSHA256, momentBounds: moments.map(String), rows, release: 'HOLD',
};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log('PASS numerical upper endpoints for all 72 original outer target FTC roots');
