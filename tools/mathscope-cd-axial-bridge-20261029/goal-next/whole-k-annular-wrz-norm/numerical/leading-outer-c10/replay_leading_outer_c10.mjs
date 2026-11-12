import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [source, output] = process.argv.slice(2);
assert.ok(source && output, 'Pass source checkout directory and receipt output.');
const base = resolve(source, 'research-ide/mathscope-m2/navier');
const pins = {
  'actual-continuation-exact-core.mjs': 'b877d5962a6051cf4fe48eef575c8ad31fb5de1a',
  'actual-continuation-exact-global.mjs': '8e8fa0c5d43bdb91be166941417e8d396e9c13f3',
  'actual-continuation-exact-heat.mjs': 'c71e6ce317afddd93718e41130a454ac219f8dec',
  'actual-continuation-exact-loop.mjs': '26269d0d0b7b8870f649ae124584a4f66b680025',
  'actual-global-source-expressions.mjs': '854bb862276d03c236b2df73ba1bb9a61373c4df',
  'actual-global-source-outer.mjs': 'f8097860af5514eaa0b0dbad6ac2086277047f16',
  'actual-leading-high-jets.mjs': 'db9516b944d5ec35c146903c3ee4a98b05f8d696',
  'actual-leading-high-jets-arithmetic.mjs': '852506d0b7ccbc498d0da2216c1b746790c850ae',
  'actual-mean-stress.mjs': '08169700aef1f2c221c24e83914b99f3d1dd7dba',
  'actual-residual-order-induction-kernels.mjs': '4c05e4d071378771c9818b5a6dbbafcaa2ab36b1',
  'source-profile-data.mjs': 'f1559221145b5d4ce051bbdb9cb84254045c8696',
  'source-profile.mjs': '84cbf606cab6510ab61f0446f0a6fdc7a89ec006',
};
const hash = (algorithm, data) => createHash(algorithm).update(data).digest('hex');
for (const [file, blob] of Object.entries(pins)) {
  const bytes = await readFile(join(base, file));
  assert.equal(hash('sha1', Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])), blob, file);
}
const load = file => import(pathToFileURL(join(base, file)).href);
const [heatModule, highModule, kernels, profileModule] = await Promise.all([
  load('actual-continuation-exact-heat.mjs'), load('actual-leading-high-jets.mjs'),
  load('actual-residual-order-induction-kernels.mjs'), load('source-profile.mjs'),
]);
const profile = profileModule.getPinnedSourceProfile();
const p = profile.parametersExactExpressions;
const ref = ref => ({ref});
const integer = integer => ({integer});
const product = (...product) => ({product});
const sum = (...sum) => ({sum});
const power = (...power) => ({power});
const exp = exp => ({exp});
const origin = sum(ref('T'), integer(2), product(integer(60), ref('BOuter')));
const offset = (x, offset) => sum(...x.sum, integer(offset));
assert.deepEqual(p.T, sum(exp(ref('Md')), integer(10)));
assert.deepEqual(p.Md, integer(1048576));
assert.deepEqual(p.logP, product(integer(2), ref('T')));
assert.deepEqual(p.Pstar, exp(ref('logP')));
assert.deepEqual(p.CSelected, exp(ref('logCSelected')));
assert.deepEqual(p.logCSelected, sum(product(integer(10), {log: sum(integer(1), ref('BRefUpper'))}), power(ref('Q'), 200)));
assert.deepEqual(p.XR, product(integer(110), power(product(ref('CSelected'), ref('Pstar')), 10)));
assert.deepEqual(p.lambda, exp(product(integer(-1000), ref('T'))));
assert.deepEqual(p.h, exp(product(integer(-8002), ref('T'))));
assert.deepEqual(p.BOuter, product(integer(1000), ref('T')));
assert.deepEqual(p.Tf, integer(128));
assert.deepEqual(p.co, {rational: '1/256'});
assert.deepEqual(p.loopIRight, product(ref('XR'), exp(sum(ref('T'), integer(3)))));
assert.deepEqual(p.X0I1, product(ref('XR'), exp(offset(origin, -25))));
assert.deepEqual(p.I1Right, product(ref('X0I1'), exp(integer(5))));
assert.deepEqual(p.X0I2, product(ref('XR'), exp(offset(origin, -20))));
assert.deepEqual(p.I2Right, product(ref('X0I2'), exp(integer(5))));

const heatData = heatModule.prepareActualFullLeadingProgram({iterations: 0});
assert.equal(heatModule.assertActualHeatLeading(heatData), true);
assert.equal(heatData.program.parameterExpressionSHA256, profile.parameterExpressionSHA256);
const {G, heat, roots, program} = heatData;
const {X, eta, Xv, Iright, I1Right} = heatData.constants;
const q = (n, d) => G.q(n, d);
const one = G.one;
const stages = G.outer.stages;
const names = ['initial', 'axialDecay', 'entry', 'reservedPower', 'pulse', 'interpolation',
  'angular', 'steepen', 'steepPower', 'flatten', 'wait', 'terminal'];
assert.deepEqual(stages.map(row => row.id), names);
assert.deepEqual(heat.stageFields.map(row => row.id), names);
const byName = Object.fromEntries(stages.map(row => [row.id, row]));
assert.equal(Iright, G.parameter('loopIRight'));
assert.equal(I1Right, G.parameter('I1Right'));
assert.equal(heat.I2Right, G.parameter('I2Right'));
const XR = G.parameter('XR');
const Xp = G.outer.roots.Xp;
assert.equal(Xp, G.mul(XR, G.exp(byName.pulse.start)));
assert.equal(Xv, G.mul(Xp, G.exp(byName.pulse.length)));
assert.equal(byName.pulse.length, G.div(q(13), G.parameter('lambda')));
assert.equal(byName.interpolation.length, G.parameter('Tf'));
assert.equal(byName.terminal.length, q(3));
assert.equal(heat.Xb, G.mul(XR, G.exp(byName.terminal.end)));
assert.equal(heat.XK, G.mul(heat.Xtail, G.exp(q(1, 5))));
function alphaHash(id, bound = []) {
  const {op, args} = G.nodes[id];
  const child = index => alphaHash(args[index], bound);
  let parts;
  if (op === 'coordinate') {
    const depth = bound.lastIndexOf(id);
    parts = depth < 0 ? ['free', args[0]] : ['bound', bound.length - 1 - depth];
  } else if (['rational', 'source_parameter'].includes(op)) {
    parts = [op, ...args];
  } else if (op === 'definite_integral') {
    parts = [op, alphaHash(args[0], [...bound, args[1]]), child(2), child(3)];
  } else if (['integer_power', 'source_step_derivative'].includes(op)) {
    parts = [op, child(0), args[1]];
  } else if (['add', 'multiply'].includes(op)) {
    parts = [op, ...args.map((_, index) => child(index)).sort()];
  } else {
    parts = [op, ...args.map((_, index) => child(index))];
  }
  return hash('sha256', JSON.stringify(parts));
}
const terminalStart = G.mul(XR, G.exp(byName.terminal.start));
const terminalAmplitude = G.mul(G.parameter('Pstar'), G.exp(byName.terminal.logAStart));
assert.equal(alphaHash(heat.Xtail), alphaHash(terminalStart));
assert.equal(alphaHash(heat.Etail), alphaHash(terminalAmplitude));
const Xplus = G.mul(Xv, G.exp(one));
const y = heat.outerLogCoordinate;
assert.equal(y, G.log(G.div(X, XR)));
for (let index = 0; index < stages.length; index++) {
  const stage = stages[index];
  const field = heat.stageFields[index];
  const pressure = G.pressure.stages[index];
  assert.equal(field.start, stage.start);
  assert.equal(field.end, stage.end);
  assert.equal(field.sourcePressureDensity, pressure.integrand);
  const branch = G.nodes[field.entryBranch];
  assert.equal(branch.op, 'smooth_piecewise');
  assert.deepEqual(branch.args.slice(0, 5), [y, stage.start, stage.end, field.value, field.value]);
  if (index > 0) assert.equal(stages[index - 1].end, stage.start);
}
assert.equal(G.nodes[heat.finalF].op, 'smooth_piecewise');
assert.equal(G.nodes[heat.finalF].args[4], G.div(heat.finalE, G.sqrt(G.mul(q(2), X))));
assert.equal(G.nodes[heat.finalF].args[5], G.nodes[heat.finalF].args[4]);
assert.deepEqual(G.nodes[heat.correction].args.slice(0, 3), [X, heat.X0, heat.I2Right]);
assert.equal(G.nodes[heat.correction].args[5], G.zero);
const Z = G.div(G.mul(q(2), G.sub(one, G.pow(eta, 2))), X);
assert.equal(heat.heatArgument, Z);
const s = G.log(G.div(X, heat.Xtail));
assert.equal(heat.heatCutoff, G.step(G.div(G.sub(s, q(1, 5)), q(3, 10))));
assert.equal(G.core.A, G.add(q(1, 2), G.parameter('h')));
assert.equal(heat.exteriorExponent, G.neg(G.add(G.core.A, q(1, 2))));
assert.equal(program.heat.exterior.amplitudeEtaDerivative, G.zero);
assert.equal(program.heat.exterior.F, roots.actualHeatExteriorF);
assert.equal(program.heat.exterior.terminalFoOneAfter, heat.Xb);
assert.equal(program.heat.tailTruncated, false);
assert.equal(program.heat.oneSidedEtaEndpoints, true);

const high = highModule.actualLeadingHighJetBounds();
assert.equal(high.parameterExpressionSHA256, profile.parameterExpressionSHA256);
assert.equal(high.pass, true);
assert.equal(high.outer.complexCoefficientTube, 'dist(eta,[-1,1])<=1/4');
assert.equal(high.outer.checks.find(row => row.id === 'actual-complex-angular-contraction').pass, true);
assert.equal(high.outer.coefficientRows.find(row => row.id === 'outer-complex-angular-root-selfmap').bound, 32768);

const n = 10;
const zeros = () => Array(n + 1).fill(0n);
const factorial = k => {
  let f = 1n;
  for (let j = 2n; j <= BigInt(k); j++) f *= j;
  return f;
};
const constant = value => [BigInt(value), ...Array(n).fill(0n)];
const add = (a, b) => a.map((v, k) => v + b[k]);
const scale = (a, c) => a.map(v => v * BigInt(c));
function multiply(a, b) {
  const out = zeros();
  for (let i = 0; i <= n; i++) {
    for (let j = 0; i + j <= n; j++) out[i + j] += a[i] * b[j];
  }
  return out;
}
const tail = a => [0n, ...a.slice(1)];
const expBound = (a, height = 1) => compose(Array(n + 1).fill(1n), tail(a), height);
function compose(derivativeCoefficients, a, height = 1) {
  assert.equal(a[0], 0n);
  let out = constant(derivativeCoefficients[0]);
  let power = constant(1);
  for (let k = 1; k <= n; k++) {
    power = multiply(power, a);
    out = add(out, scale(power, derivativeCoefficients[k]));
  }
  return scale(out, height);
}
const elementary = (...values) => [...values.map(BigInt), ...Array(n + 1 - values.length).fill(0n)];
const linear = elementary(0, 2);
const radialPower = Array(n + 1).fill(1n);
const sigmaData = kernels.sourceAllOrderCutoffJets({order: n + 1});
assert.equal(sigmaData.pass, true);
assert.equal(sigmaData.parameterExpressionSHA256, profile.parameterExpressionSHA256);
assert.equal(sigmaData.activation.seedPower, 2);
const sigma = sigmaData.activation.ordinaryDerivativeBounds.map(BigInt);
const step = slope => Array.from({length: n + 1}, (_, k) => sigma[k] * BigInt(slope)**BigInt(k));
const primitiveTail = [0n, ...sigma.slice(0, n)];
const logF = compose(Array(n + 1).fill(1n), elementary(0, 2, 1));
const interpolationCutoff = step(1);
const interpolation = expBound(add(add(linear, interpolationCutoff), multiply(interpolationCutoff, logF)));
// The source angular C2 complex root stays in |c2| <= 2^16 lambda^29.
// The exact linear row gives |c1| <= 2^11 lambda^29 + 9 |c2| < 1.
assert.ok((2n**11n + 9n * 2n**16n) < 2n**(29n * 200n));
const angularCoefficient = Array.from({length: n + 1}, (_, k) => 8n**BigInt(k));
const angularBump = Array.from({length: n + 1}, (_, k) => 4n**BigInt(k + 1) * sigma[k + 1]);
const angular = multiply(expBound(linear), add(constant(1), scale(multiply(angularCoefficient, angularBump), 2)));
const smoothSlope = expBound(add(linear, primitiveTail));
const argument = scale(multiply(elementary(1, 2, 1), radialPower), 2);
const gammaMoments = Array.from({length: n + 1}, (_, k) => factorial(k) * factorial(k + 1));
const heatLoss = compose(gammaMoments.map((v, k) => v / factorial(k)), tail(argument));
const fo = [1n, ...step(1).slice(1)];
const terminal = scale(multiply(multiply(expBound(linear), fo), add(constant(1), multiply(step(4), heatLoss))), 2);
const branches = {
  interpolation,
  angular,
  steepen: smoothSlope,
  steepPower: expBound(linear),
  flatten: smoothSlope,
  wait: expBound(linear),
  terminalWithHeatAndExterior: terminal,
};
assert.deepEqual(Object.keys(branches).slice(0, 6), names.slice(5, 11));

// X^r d_X^r = D_y (D_y-1) ... (D_y-r+1). Keep exact absolute
// coefficients for all individual physical derivatives and the useful X weight.
const falling = [[1n]];
for (let r = 1; r <= n; r++) {
  const previous = falling[r - 1];
  const row = Array(r + 1).fill(0n);
  previous.forEach((v, k) => { row[k] += BigInt(r - 1) * v; row[k + 1] += v; });
  assert.equal(row.reduce((a, b) => a + b, 0n), factorial(r));
  falling.push(row);
}
const physicalRows = [];
for (const [branch, majorant] of Object.entries(branches)) {
  const field = multiply(majorant, radialPower);
  for (let r = 0; r <= n; r++) {
    for (let e = 0; e + r <= n; e++) {
      const coefficient = falling[r].reduce((bound, stirling, j) => (
        bound + stirling * factorial(j) * factorial(e) * field[j + e]
      ), 0n);
      physicalRows.push({branch, radialOrder: r, etaOrder: e, coefficient: String(coefficient), binaryDigits: coefficient.toString(2).length});
    }
  }
}
const maxBits = Math.max(...physicalRows.map(row => row.binaryDigits));
// T>11 and exp(1000T)>1+1000T yield 2T-13/(2 lambda)<-65536.
assert.ok(12996n * 11n + 13n > 2n * 65536n);
const dyadicExponent = 65536 - maxBits;
assert.ok(dyadicExponent > 60000);
assert.equal(physicalRows.length, 7 * 66);
const receipt = {
  schema: 'MathScope.N7.ActualOuterLeadingNumericalC10/1',
  source: {gitBlobPinsFrom: 'b14e309', pins, parameterExpressionSHA256: profile.parameterExpressionSHA256,
    programGraph: {nodes: program.nodes.length, sha256: hash('sha256', JSON.stringify(program.nodes))},
    terminalStartAlphaSHA256: alphaHash(terminalStart), terminalAmplitudeAlphaSHA256: alphaHash(terminalAmplitude),
    roots: {originalF0: roots.actualLeadingF0, X, eta, Xp, Xv, Xplus, Xtail: heat.Xtail, Xb: heat.Xb,
      XK: heat.XK, heatLoss: heat.heatLoss, heatGamma: heat.gamma, heatCutoff: heat.heatCutoff,
      terminalExteriorF0: heat.exteriorF, Iright, I1Right, I2Right: heat.I2Right},
    stageFields: heat.stageFields.slice(5), angularCoefficients: G.outer.equations.angular.coefficients},
  domain: {X: ['Xplus=Xv*exp(1)', 'infinity'], eta: ['-1', '1'], endpointEtaConvention: 'continuous one-sided derivatives'},
  physicalBound: `abs(dX^r dEta^e F0) < 2^(-${dyadicExponent}) Xv / X^(r+1), r+e<=10`,
  normalizedMaximum: `2^(-${dyadicExponent})`,
  outerFTC: {Xintegrals: `For r>=1, each exterior X-integral is < 2^(-${dyadicExponent})/r`, etaWidth: 2,
    combineWithActive: `If M bounds active C10 then the four-face FTC for (r,e), r+e<=8, is <=3(1+Xplus)M+3*2^(-${dyadicExponent})/(r+1).`},
  gammaDerivativeBounds: gammaMoments.map(String), maxBits,
  branches: Object.fromEntries(Object.entries(branches).map(([name, a]) => [name, a.map(String)])), physicalRows,
  scope: {actualSourceF0ExteriorC10NumericallyBounded: true, actualSourceF0InteriorC10BoundedHere: false,
    terminalHeatTransitionIncluded: true, infiniteExteriorTailIncluded: true, signedFTCQuadratureEvaluated: false,
    positiveOrderBackgroundBoundedHere: false, finalJetAcceptanceChanged: false},
};
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n');
console.log(`PASS original exterior F0, ${physicalRows.length} exact Taylor bounds. Every total-degree-ten physical derivative is < 2^(-${dyadicExponent}) Xv / X^(r+1).`);
