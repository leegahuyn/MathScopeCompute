/** Directed coefficient for the actual common-chart gamma operator bound. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {load, sha, sourceArithmetic} from '../../../../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [runtime, sourceRuntime, historicalResult, historicalInput, wholeKFile, gammaFile, polynomialFile, output] =
  process.argv.slice(2);
assert.ok(output);
const arithmetic = await load(historicalResult, 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const historical = await load(historicalInput, '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0');
const K = await load(wholeKFile, '0e1984e6f872e9a167b7920d31a55b4888a807c359a0c38dbff9f8f8af5f4acb');
const gamma = await load(gammaFile, 'b3f8ede491d84776845ed2673d2459e65fd767ffcaa89779bcb5e214ef416c95');
const polynomials = await load(polynomialFile, 'ebbd16c58b6f439bffa0eb951c1dfb462594a98499bb53514c41f765b5dfdefc');
assert.equal(K.K, gamma.normRoot);
assert.equal(K.status, 'DIRECTED_CONDITIONAL_WHOLE_ORIGINAL_K');

const sourcePins = {
  'mathscope-m3/navier/source-global-current.mjs': '93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760',
  'mathscope-m3/navier/source-global-pressure.mjs': 'fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d',
  'mathscope-m3/navier/source-global-band.mjs': 'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60',
  'mathscope-m2/navier/actual-residual-order-induction-kernels.mjs': '97f8bbc5927ee2b2ac5b41851ba5bc2c800fd4cad6b85c7a1039095c066f7fef',
};
const sources = {};
for (const [name, pin] of Object.entries(sourcePins)) {
  const source = await readFile(resolve(sourceRuntime, 'research-ide', name));
  assert.equal(sha(source), pin);
  sources[name.split('/').at(-1)] = source.toString();
}
assert.match(sources['source-global-current.mjs'], /argument=G\.mul\(q\(10\),G\.sub\(G\.div\(R,G\.mul\(radialScale,x0\)\),G\.one\)\)/);
assert.match(sources['source-global-current.mjs'], /innerRadius=G\.sqrt\(G\.parameter\('Xa'\)\),outerRadius=G\.mul\(q\(2\),G\.sqrt\(band\.chart\.Xb\)\)/);
assert.match(sources['source-global-pressure.mjs'], /baseEll=G\.sub\(ell,q\(2\)\),baseIndex=paletteIndex\(baseEll\)/);
assert.match(sources['source-global-pressure.mjs'], /radialPrimitive=G\.mul\(power\(Lambda,baseIndex\),power\(physicalR,dr\)\)/);
assert.match(sources['source-global-band.mjs'], /chartBody=G\.sub\(G\.sub\(sv,G\.mul\(G\.pow\(Z,2\),power\(sv,G\.mul\(q\(2\),h\)\)\)\),T\)/);

const cutoffSource = resolve(sourceRuntime, 'research-ide/mathscope-m2/navier/actual-residual-order-induction-kernels.mjs');
const {sourceAllOrderCutoffJets} = await import(pathToFileURL(cutoffSource).href);
const sigma = sourceAllOrderCutoffJets({order: 4}).timeStep.ordinaryDerivativeBounds.map(BigInt);
const fact = [1n, 1n, 2n, 6n, 24n];
const choose = (n, k) => fact[n] / (fact[k] * fact[n-k]);
// Multivariate Cauchy at a transition point, with polydisc radius 1/256.
const arg = fact.map((f, d) => 70n * f * 256n ** BigInt(d));
const bell = Array.from({length: 5}, () => Array(5).fill(0n));
bell[0][0] = 1n;
for (let d = 1; d <= 4; d++) {
  for (let k = 1; k <= d; k++) {
    for (let j = 1; j <= d-k+1; j++) bell[d][k] += choose(d-1, j-1) * arg[j] * bell[d-j][k-1];
  }
}
const chi = bell.map((row, d) => d === 0 ? 1n : row.slice(1, d+1)
  .reduce((sum, value, j) => sum + value * sigma[j+1], 0n));
const chiBound = chi.reduce((a, b) => a > b ? a : b);
const [O0, O1] = ['O0', 'O1'].map(name =>
  polynomials.coefficientsAscending[name].reduce((sum, coefficient) => sum + BigInt(coefficient), 0n));
assert.equal(O0, 133n);
assert.equal(O1, 928n);

const {N, evaluateClosedArithmeticDefinitions} = await sourceArithmetic(runtime, arithmetic.sourcePins, 'coarse-upper');
const {values} = evaluateClosedArithmeticDefinitions(historical.definitions, N,
  {names: ['C12EnvelopeR', 'Xa', 't1', 'X0Imean']});
const Tg = N.add(N.point('4'), N.sqrt(N.point('2')));
const endpoint = (x, side) => N.toClosed(x)[side];
assert.equal(N.compareEndpoints(endpoint(values.get('X0Imean'), 'lower'), {rational: '1'}), 1);
const H = N.max([N.point('3'), values.get('C12EnvelopeR'), N.inverse(N.sqrt(values.get('Xa')))]);
const C0 = N.max([N.mul(N.point('40320'), N.pow(H, 5)), N.point(chiBound.toString())]);
const Z42 = N.add(N.one(), N.mul(N.point('1124000727777607680000'),
  N.add(N.pow(values.get('t1'), -44), N.pow(N.point('4'), -22))));
const fixedFactor = N.mul(N.point((5640192n * (1n+O0) * (1n+O1)).toString()),
  N.pow(N.point('4'), 2999));
const factors = [fixedFactor, N.pow(Tg, 26), N.pow(N.fromClosed(K.enclosure), 2994),
  Z42, N.pow(C0, 14)];
const coefficient = factors.reduce((a, b) => N.mul(a, b), N.one());
const result = {
  schema: 'MathScope.OriginalN3PositiveNGammaGeometryEnclosure/1',
  status: 'DIRECTED_CONDITIONAL_POSITIVE_N_GAMMA_C4_COEFFICIENT',
  axialResidualRoot: gamma.actualEz, normRoot: K.K, positiveNShapes: 52,
  sourcePins, cutoffDerivatives: chi.map(String), X0Imean: N.toClosed(values.get('X0Imean')),
  C0: N.toClosed(C0), Z42: N.toClosed(Z42), coefficient: N.toClosed(coefficient),
  estimate: 'Each original reference-chart positive-N gamma shape is bounded by coefficient.upper * S_ref^3000 * epsilon_ref^(1-14/100000).',
  domain: 'Original fixed reference chart and full radial integration shell; ell>=4, s in [1/2,2], |eta|<=1, source C5, original flat joins and exact Fourier derivative identity.',
  arithmetic: N.report(), fullGammaC4: false, finalJets: '0/67', release: 'HOLD',
};
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({status: result.status, normRoot: K.K, shapes: result.positiveNShapes}));
