/** Original initialized mean with one, two or three pulse derivatives. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [goal, hosted, chart, runtime, out] = process.argv.slice(2);
assert.equal(process.argv.length, 7, 'Use GOAL_NEXT HOSTED_GRAPH WHOLE_K_CHART ORIGINAL_RUNTIME OUTPUT.');
const sha = x => createHash('sha256').update(x).digest('hex');
const hashJSON = x => sha(JSON.stringify(x));
async function read(path, hash) {
  const data = await readFile(path);
  assert.equal(sha(data), hash, path);
  return data.toString();
}
const producerPin = '34f45caa70455663b06f9c5116aa490ef59d58fc17e00a6b618918e35b78a338';
const priorPin = 'e366138903bd4ba773ac898707a0a38782cc00ace2d570733668e93760d1dc59';
const producer = resolve(goal, 'whole-k-annular-pressure-lower/propagate_lower_covariance.mjs');
const priorFile = resolve(goal, 'whole-k-annular-pressure-lower/mean-path-longitudinal.json');
assert.notEqual(resolve(out).toLowerCase(), priorFile.toLowerCase());
const [original, prior] = await Promise.all([read(producer, producerPin), read(priorFile, priorPin).then(JSON.parse)]);
const sourcePins = {
  ...prior.nativeMean.originalRuntimeSHA256,
  'research-ide/mathscope-m3/navier/source-auxiliary-fourier.mjs': '59e1d8f7fd72b880de030a2a56bee9be65b5e02203cffa73157ce8dae420ad2e',
  'research-ide/mathscope-m3/navier/source-auxiliary-expressions.mjs': '4e1741d0a5ebadaf0858d79b141856d9dc52bb0b3b119b39e6cf83248355ca86',
  'research-ide/mathscope-m3/navier/source-global-band.mjs': 'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60',
};
const sourceText = Object.fromEntries(await Promise.all(Object.entries(sourcePins).map(async ([file, pin]) =>
  [file.split('/').at(-1), await read(resolve(runtime, file), pin)])));
function clauses(file, ...strings) {
  for (const text of strings) assert(sourceText[file].includes(text), `${file}: ${text}`);
}
clauses('source-global-temporal.mjs', 'exactInverseEquation:\'N inverse = actual E - normalized Haar mean(actual E)\'',
  'sourceProjectionTailProof', 'actual-C1-convergence-and-four-additional-derivatives');
clauses('source-temporal-potential.mjs', 'deltaV=G.neg(G.div(inverseTheta,ci))', 'gammaDesired=G.neg(G.div(inverseZ,ci))',
  'beta=G.neg(Dz(psi)),gamma=De(psi,1)', 'Delta gamma=gamma_d-A1(gamma_d)');
clauses('source-auxiliary-fourier.mjs', 'm=k1-k0,n=k0,integerNorm=m*m-2n*n*n',
  'numerator=G.sub(G.mul(coefficient.C,coefficient.sine),G.mul(coefficient.S,coefficient.cosine))');
clauses('source-global-pressure.mjs', 'delta=G.sub(i,baseIndex)', 'rectangle.xiJacobian[j]', 'rectangle.vJacobian[j]');
clauses('source-global-band.mjs', 'psi=G.mul(G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4))),G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls))))',
  'z=w.map(x=>G.mul(P,x)),t=mul(frame.B,z.map(x=>[x])).map(row=>row[0])');

// Replay the unchanged producer, preserving its exact prior graph. Its only
// in-memory substitutions extend retained native rows and expose local arrays.
// The baseline producer's output sink is never invoked.
const selectedIds = [635063, 643868, 643883, 1696799, 1698945, 1706622, 1706623, 1706624, 1706625, 1706626,
  1706769, 1706770, 1706773, 1706782, 1706796, 3614767, 3614771, 3614789, 3614790, 3614791, 3614792];
const streamAnchor = 'const source=new Map(),checkHash=createHash(\'sha256\');';
const sinkAnchor = 'await writeFile(out,JSON.stringify(output,null,2)';
assert.equal(original.split(streamAnchor).length, 2);
assert.equal(original.split(sinkAnchor).length, 2);
const exportList = ['output', 'P', 'source', 'commonRegistry', 'decode', 'fields', 'inputs', 'q', 'add', 'mul', 'pow',
  'R', 'S', 'Tg', 'LminInv', 'degree', 'alphaFactor', 'factorial', 'choose', 'C', 'plus', 'scale', 'product', 'times',
  'n', 'invN2', 'numerator', 'K', 'Aphi', 'damping', 't', 'slow', 'sqrtWeight', 'amplitude', 'potential', 'common',
  'sigma', 'invR', 'fastJets', 'shift', 'covJet', 'invEnvelopeR', 'pressureChiZ', 'fixedOperator', 'T0', 'T1', 'A1',
  'rawWhole', 'ci0Inverse', 'through'];
const exposed = original.split(sinkAnchor)[0].replace(streamAnchor,
  `for (const id of ${JSON.stringify(selectedIds)}) wanted.add(id);\n${streamAnchor}`) + `\nexport {${exportList.join(',')}};`;
const argv = process.argv;
let old;
try {
  process.argv = [argv[0], producer, goal, hosted, chart, 'baseline-output-disabled', '--mean-path-longitudinal'];
  old = await import('data:text/javascript;base64,' + Buffer.from(exposed).toString('base64'));
} finally {
  process.argv = argv;
}
const {output, P, source, commonRegistry, decode, fields, inputs, q, add, mul, pow, R, S, Tg, LminInv, degree,
  alphaFactor, factorial, choose, C, plus, scale, product, times, n, invN2, numerator, K, Aphi, damping, t, slow,
  sqrtWeight, amplitude, potential, common, sigma, invR, fastJets, shift, covJet, invEnvelopeR, pressureChiZ,
  fixedOperator, T0, T1, A1, rawWhole, ci0Inverse, through} = old;
assert.equal(output.graphSHA256, prior.graphSHA256);
assert.equal(hashJSON(P.nodes), prior.graphSHA256);
assert.equal(output.sourceSHA256, prior.sourceSHA256);
assert.equal(output.nativeRegistrySHA256, prior.nativeRegistrySHA256);
const baseCount = P.nodes.length;
assert.equal(baseCount, prior.nodes.length);

const originals = decode(commonRegistry.inverseDefinitions);
const partials = [1696799, 1698945];
const early = [643868, 643883];
const Y = [635044, 635045];
const slowCoords = [622802, 622803, 622804];
const exact = (id, op, args) => assert.deepEqual(source.get(id), {op, args}, `native #${id}`);
for (const [i, name] of ['theta', 'z'].entries()) {
  const s = originals[i];
  assert.equal(s.name, `GlobalActualTemporal_${name}`);
  assert.equal(s.body, early[i]);
  assert.deepEqual(s.parameters, [...slowCoords, 622791, ...Y]);
  assert.deepEqual(s.directions, [...slowCoords, ...Y]);
  assert.equal(s.zeroMode, 'The exact normalized Haar mean is projected out.');
  exact(partials[i], 'm3_aux_inverse_partial', [i, s.parameters, [0, 0, 0, 0, 0]]);
  assert.equal(s.finiteSumDeclaredEqualToLimit, false);
}
exact(1706622, 'inverse', [635063]);
exact(1706623, 'multiply', [1696799, 1706622]);
exact(1706624, 'multiply', [20, 1706623]);
exact(1706625, 'multiply', [1698945, 1706622]);
exact(1706626, 'multiply', [20, 1706625]);
const five = [3614789, 3614767, 3614771];
const temporal = [1706773, 1706624, 1706782];
for (const [i, system] of [-21, -19, -20].entries()) {
  exact(five[i], 'm3_aux_expression_partial', [system, [622791, ...slowCoords], [0, 0, 0, 0]]);
  exact(3614790 + i, 'add', [temporal[i], five[i]]);
}
exact(1706770, 'm3_aux_expression_partial', [-13, [622791, ...slowCoords, ...Y], [0, 0, 0, 0, 0, 0]]);
exact(1706796, 'multiply', [623135, 1706785]);

// The prior independent native replay has both stored Jacobian columns and
// their exact five integer matrices. Check the second eigenvector in Q(sqrt2).
const cover = inputs.transverse.source.commonCover;
assert.equal(cover.rowsChecked, 162);
assert.equal(fields.length * fields[0].rows.length, 972);
const qadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const qmul = (a, b) => [a[0] * b[0] + 2n * a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const vt = [[-1n, 1n], [1n, 0n]], vr = [[1n, 0n], [1n, -1n]];
const dot = (a, b) => a.map((x, j) => qmul(x, b[j])).reduce(qadd, [0n, 0n]);
let TgPower = [1n, 0n];
for (const matrix of cover.integerMatrices) {
  const Mv = matrix.map(row => dot(row.map(x => [BigInt(x), 0n]), vt));
  assert.deepEqual(Mv, vt.map(x => qmul(TgPower, x)));
  assert.deepEqual(dot(vr, Mv), [0n, 0n]);
  assert.deepEqual(dot(vt, Mv), qmul(TgPower, dot(vt, vt)));
  TgPower = qmul(TgPower, [4n, 1n]);
}
assert.deepEqual(cover.integerMatrices[1], [[3, 1], [1, 5]]);
assert.notDeepEqual([[4n, 0n], [5n, 0n]], vt.map(x => qmul([4n, 1n], x)));

// All jets below are normalized by slow degree factorial, with ordinary
// pulse orders. Source t'= (A_phi-dI)t; retain the derivative of A_phi and d.
const squaredV = scale(q(2), plus(...n.map(x => product(x.j, x.v))));
const squaredVV = scale(q(2), plus(...n.map(x => product(x.v, x.v))));
const invN2V = times(invN2, invN2, squaredV);
const invN2VV = plus(scale(q(2), times(invN2, invN2, invN2, squaredV, squaredV)), times(invN2, invN2, squaredVV));
const numeratorV = K[0].map((_, j) => plus(...n.map((x, i) => product(x.v, K[i][j]))));
const AphiV = K.map((row, i) => row.map((_, j) => plus(times(n[i].v, numerator[j], invN2),
  times(n[i].j, numeratorV[j], invN2), times(n[i].j, numerator[j], invN2V))));
const dV = scale(q(4), squaredV);
const pulseMatrix = Aphi.map((row, i) => row.map((x, j) => i === j ? plus(x, damping) : x));
const pulseMatrixV = AphiV.map((row, i) => row.map((x, j) => i === j ? plus(x, dV) : x));
const matVec = (matrix, vector) => matrix.map(row => plus(...row.map((x, j) => product(x, vector[j]))));
const tV = matVec(pulseMatrix, t);
const tVV = matVec(pulseMatrix, tV).map((x, j) => plus(x, matVec(pulseMatrixV, t)[j]));
const tOrd = [t, tV, tVV];
const psiScale = mul(q(20), LminInv);
const psiOrd = [P.one, mul(q(2n * sigma[1]), psiScale), mul(q(2n * (sigma[2] + sigma[1]**2n)), pow(psiScale, 2))];
const pulseOrders = [0, 1, 2];
const range = n => Array.from({length: n + 1}, (_, j) => j);
const amp = [amplitude, ...[1, 2].map(order => t.map((_, j) => times(slow, sqrtWeight,
  plus(...range(order).map(a => scale(mul(q(choose(order, a)), psiOrd[order - a]), tOrd[a][j]))))))];
const inverse = [invN2, invN2V, invN2VV];
const normal = [n.map(x => x.j), n.map(x => x.v)];
const vectorPairs = [[2, 1], [0, 2], [1, 0]];
function potentialPart(order, i, j) {
  const terms = [];
  for (const a of range(order)) {
    for (const b of range(Math.min(1, order - a))) {
      const c = order - a - b;
      const binomial = factorial(order) / (factorial(a) * factorial(b) * factorial(c));
      const cross = plus(product(normal[b][i], amp[c][j]), product(normal[b][j], amp[c][i]));
      terms.push(scale(q(binomial), product(inverse[a], cross)));
    }
  }
  return plus(...terms);
}
const pot = [potential, ...[1, 2].map(order => vectorPairs.map(([i, j]) => potentialPart(order, i, j)))];
const leading = amp.map(common), reducedPotential = pot.map(common);
const remainder = reducedPotential.map(x => plus(scale(q(2), shift(x)), product(invR, x)));
const remainderChiPrime = reducedPotential.map(x => product(fastJets, x));
const cutoff = sigma.map((x, j) => q(x * 2n**BigInt(35 * j)));
const leadingCurl = (l, v) => scale(cutoff[l], leading[v]);
const imaginaryCurl = (l, v) => plus(scale(cutoff[l], remainder[v]), scale(cutoff[l + 1], remainderChiPrime[v]));

// Since the old L proof covers the complete signed row inventory, all
// six covariance components use the same worst-case transfer constants.
const pulseScale = mul(q(4), pow(Tg, 5), S);
const covariance = pulseOrders.map(v => range(4).map(l => {
  if (v === 0) return covJet(l);
  const terms = [];
  for (const a of range(l)) {
    for (const b of range(v)) {
      const real = product(leadingCurl(a, b), leadingCurl(l - a, v - b));
      const imag = product(imaginaryCurl(a, b), imaginaryCurl(l - a, v - b));
      terms.push(scale(q(choose(l, a) * choose(v, b)), plus(real, imag)));
    }
  }
  const local = scale(q(1, 2), plus(...terms));
  return local.map((x, j) => j >= 7 ? P.zero : mul(q(162), pow(q(4), j + 2 + 4 * l), pow(pulseScale, v), x));
}));

function earlyBounds(l, v) {
  const W = covariance[v][l];
  const slowW = shift(W);
  const radialW = plus(slowW, product(fastJets, covariance[v][l + 1]));
  const theta = plus(radialW, scale(q(2), product(invEnvelopeR, W)), slowW);
  const pressure = plus(scale(q(2), product(invEnvelopeR, W)), slowW);
  const pressureZ = plus(scale(q(2), product(invEnvelopeR, slowW)), shift(slowW));
  const axial = plus(radialW, product(invEnvelopeR, W), scale(q(2), slowW), fixedOperator(T0, pressureZ),
    product(pressureChiZ, fixedOperator(rawWhole, pressure)));
  return {theta, axial};
}
const rows = [];
for (const j of [1, 2, 3]) {
  for (const l of range(4 - j)) {
    const d = 4 - j - l;
    const {theta, axial} = earlyBounds(l, j - 1);
    const factor = j === 1 && l === 0 ? mul(q(2), ci0Inverse) : ci0Inverse;
    const desired = scale(factor, axial);
    const v = scale(factor, theta);
    const psi = fixedOperator(T1, desired);
    const betaWithoutEpsilon = shift(psi);
    const gamma = plus(desired, fixedOperator(A1, desired));
    rows.push({N: j, L: l, slowThrough: d, projectedSourceNormFactor: j === 1 && l === 0 ? 2 : 1,
      sourceCovarianceN: j - 1, sourceCovarianceLThrough: l + 1,
      roots: {betaWithoutEpsilon: through(betaWithoutEpsilon, d), v: through(v, d), gamma: through(gamma, d)}});
  }
}
assert.equal(rows.length, 9);
const first = rows[0];
for (const [component, roots] of Object.entries(first.roots)) {
  const name = component === 'betaWithoutEpsilon' ? 'beta' : component;
  assert.deepEqual(roots.slice(0, 2), prior.roots.longitudinalInputs[name].N, name);
}
const vv = rows.find(row => row.N === 2 && row.L === 0);
assert.deepEqual([vv.slowThrough, vv.sourceCovarianceN, vv.projectedSourceNormFactor], [2, 1, 1]);
assert(rows.every(row => Object.values(row.roots).flat().every(id => id > 0 && P.nodes[id])));
const extension = P.nodes.slice(baseCount);
const result = {
  status: 'VERIFIED_ORIGINAL_LONGITUDINAL_CANCELLATION_CONDITIONAL_POSITIVE_MEAN_JETS',
  source: {graphSHA256: output.sourceSHA256, registrySHA256: output.nativeRegistrySHA256,
    producerPin, priorPin, sourcePins, covarianceRows: 972, integerMatrices: cover.integerMatrices,
    exactNativeRecords: Object.fromEntries(selectedIds.map(id => [id, source.get(id)])), inverseDefinitions: originals,
    earlySources: {theta: early[0], z: early[1]}, ciReference: 635063,
    nativeMean: {temporal, fiveMap: five, total: [3614790, 3614791, 3614792]}},
  identities: {N: '(sqrt(2)-1) partial_Y0 + partial_Y1',
    first: 'N N^-1 Pperp E = Pperp E', higher: 'N^j N^-1 Pperp E = N^(j-1) E for j>=2',
    radialCommutation: 'L,N commute with T0,T1,A1, shifted whole integrals and slow derivatives on the original source',
    temporal: ['N^j v=-ci^-1 N^(j-1) Etheta', 'N^j beta=epsilon ci^-1 partial_Z T1 N^(j-1) Ez',
      'N^j gamma=-ci^-1 (1-A1) N^(j-1) Ez'],
    noFiveMapForPositiveN: true, projectionAtNOneRetained: true,
    path: 'partial_v^j along original H_w equals (ci_own/Tg^delta)^j N^j, then reference-to-own chart scales',
    indexedCovariance: 'On every retained row N xi=0 and N v=Tg^delta/ci_row, L v=0, L xi=Lambda^delta.'},
  positive: {baseCount, baseGraphSHA256: prior.graphSHA256, extensionCount: extension.length, extensionSHA256: hashJSON(extension),
    graphSHA256: hashJSON(P.nodes), pulseScale, normalDerivativeJetRoots: [squaredV, squaredVV], pulseCutoffRoots: psiOrd,
    rows, pureSecondPulse: vv.roots, extension},
  scope: {positiveLongitudinalPartThroughTotalFour: true, pureN4NotRequiredForCrossC3: true,
    sourceOnlyConditionalBounds: true, fixedOriginalChartAndSmoothJoinsRequired: true,
    fullMeanC3Bounded: false, fullModeOneC2Bounded: false, laterCorrectionsBounded: false,
    activeWholeKFamilyAttached: false, finalJets: '0/67', release: 'HOLD'},
};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log(`PASS ${rows.length} source N/L jet rows, including original N^2 and N^3 initialized mean; ${extension.length} additional positive records.`);
