/** Source-bound highest slow FiveMap mean term and exact adjoint controls. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {createGunzip} from 'node:zlib';

const [goal, graph, runtime, out] = process.argv.slice(2);
assert.equal(process.argv.length, 6, 'Use GOAL_NEXT ORIGINAL_GRAPH ORIGINAL_RUNTIME OUTPUT.');
const sha = data => createHash('sha256').update(data).digest('hex');
const graphSHA256 = 'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf';
const registrySHA256 = '657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333';
async function pinned(path, digest) {
  const raw = await readFile(path);
  assert.equal(sha(raw), digest, path);
  return raw.toString();
}
const pins = {
  mean: ['whole-k-annular-mean-sharp/directional-mean-proof.json', '6a3bda9be88fd2c3b525a5393b470afff753b94b72d39d35e68c683f62758792'],
  covariance: ['whole-k-annular-pressure-lower/lower-covariance-pressure.json', '5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328'],
  longitudinal: ['primary-forced-weights/higher-mean/mean-longitudinal.json', '778a1058ffff15e9f80c3066645218b51b4ce52aa75514172008e05150ec94b9'],
  transverse: ['primary-forced-weights/higher-mean/mean-transverse-c3.json', '121c25bb1dc783bec4004184e829db082d3cf074a6698a2004a011c6ea6863c8'],
  radial: ['primary-forced-weights/higher-mean/fixed-radial-c5-numerical.json', '378971a6061b1a49051ff0214e715aa1d7726ac621a159d97f17b844b9128d6e'],
};
const receipts = Object.fromEntries(await Promise.all(Object.entries(pins).map(async ([key, [file, pin]]) =>
  [key, JSON.parse(await pinned(resolve(goal, file), pin))])));
assert.equal(receipts.mean.correctedHostedGraphSHA256, graphSHA256);
assert.equal(receipts.covariance.sourceSHA256, graphSHA256);
assert.equal(receipts.longitudinal.source.graphSHA256, graphSHA256);
assert.equal(receipts.transverse.source.graphSHA256, graphSHA256);
assert.deepEqual(receipts.mean.lineage.fiveVUses, ['P', 'Jz']);
assert.equal(receipts.radial.bounds.T1, 8372);
const originalPins = {
  ...receipts.covariance.nativeMean.originalRuntimeSHA256,
  'research-ide/mathscope-m2/navier/actual-full-curl.mjs': '4276a850dbff4b5c357c47e1827eb7785b19c7e7c395c94ee4f22ef0c96d58d2',
  'research-ide/mathscope-m3/navier/source-global-current.mjs': '93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760',
};
const texts = Object.fromEntries(await Promise.all(Object.entries(originalPins).map(async ([file, pin]) =>
  [file.split('/').at(-1), await pinned(resolve(runtime, file), pin)])));
function clauses(file, ...expected) {
  for (const value of expected) assert(texts[file].includes(value), `${file}: ${value}`);
}
clauses('source-pressure.mjs', 'G.sub(G.substitute(radialPrimitive,R,r),radialPrimitive)',
  'G.add(y,G.mul(shift,vr[j]))', 'G.integral(integrand,r,innerRadius,R)', 'G.integral(integrand,r,innerRadius,outerRadius)');
clauses('source-temporal-potential.mjs', 'G.div(G.sub(integrals.left,G.mul(chi,integrals.whole)),R)',
  'beta=G.neg(Dz(psi)),gamma=De(psi,1)', 'Delta gamma=gamma_d-A1(gamma_d)');
clauses('source-global-pressure.mjs', 'G.neg(Dz(W.rz))', 'G.mul(epsilon,pZ)');
clauses('source-global-temporal.mjs', 'N inverse = actual E - normalized Haar mean(actual E)', 'sourceFourierTheoremApplied:true');
clauses('source-full-mean-equations.mjs', 'G.mul(beta,gamma),W.rz', 'G.neg(Dz(G.add');
clauses('source-updated-mean-pressure.mjs', "P=scalar(G,whole(haarGr),tag+'_P')", 'G.mul(G.q(1,2),whole(G.mul(G.pow(R,2),haarGr)))',
  'actual-updated-radial-defects-are-independent-of-R');
clauses('source-global-initial-mean.mjs', 'angularTargets:[G.zero,G.neg(targets.P),G.neg(targets.Jz)]',
  'deltaV=shareGlobalScalar(G,G.add(...coefficients.angular.map');
clauses('source-global-moment.mjs', 'angularValues=angularMatrix.map', 'angularTargets[i]');
clauses('actual-full-curl.mjs', 'const remainder=[G.neg(axialDerivatives[1])', 'G.add(radialDerivatives[1],G.mul(ir,C[1]))');
clauses('source-global-current.mjs', 'G.mul(curl.leading[a],curl.leading[b]),G.mul(curl.remainder[a],curl.remainder[b])');

const registry = JSON.parse(await pinned(resolve(graph, 'original-source-functions.json'), registrySHA256));
const decode = x => typeof x === 'string' ? JSON.parse(x) : x;
const auxiliary = decode(registry.base);
const definitions = decode(auxiliary.expressionDefinitions);
const inverses = decode(auxiliary.inverseDefinitions);
const fields = decode(auxiliary.fieldDefinitions);
assert.equal(fields[2].name, 'GlobalCompleteCommonTorus_rz');
assert.equal(fields[2].rows.length, 162);
assert.equal(inverses[1].body, 643883);
assert.equal(inverses[1].zeroMode, 'The exact normalized Haar mean is projected out.');
const signatures = {
  '-13': [1706769, [622791, 622802, 622803, 622804, 635044, 635045]],
  '-14': [3613993, [622791, 622802, 622803, 622804, 635044, 635045]],
  '-15': [3614329, [622791, 622802, 622803, 622804]],
  '-16': [3614333, [622791, 622803, 622804]],
  '-18': [3614419, [622791, 622803, 622804]],
  '-19': [3614766, [622791, 622802, 622803, 622804]],
};
for (const [id, signature] of Object.entries(signatures)) {
  const fn = definitions[-1 - Number(id)];
  assert.deepEqual([fn.body, fn.parameters], signature);
}

const R = 622802, Z = 622803, T = 622804, ell = 622791, Y = [635044, 635045], eps = 622798;
const exact = new Map(Object.entries({
  643048: ['m3_aux_indexed_partial', [2, [R, Z, T, ell, ...Y], [0, 2, 0, 0, 0]]],
  643049: ['multiply', [eps, 643048]], 643050: ['multiply', [20, 643049]],
  643600: ['multiply', [635058, 643599]], 643601: ['add', [643116, 643600]],
  643602: ['add', [635044, 643601]], 643603: ['multiply', [623066, 643601]], 643604: ['add', [635045, 643603]],
  643800: ['m3_aux_indexed_partial', [2, [643595, Z, T, ell, 643602, 643604], [0, 2, 0, 0, 0]]],
  643801: ['multiply', [eps, 643800]], 643802: ['multiply', [20, 643801]],
  643803: ['add', [643799, 643802]], 643804: ['add', [643788, 643803]], 643805: ['add', [643742, 643804]],
  643806: ['definite_integral', [643805, 643595, 633710, R]], 643807: ['definite_integral', [643805, 643595, 633710, 633712]],
  643846: ['add', [643806, 643845]], 643847: ['multiply', [633733, 643807]], 643848: ['multiply', [20, 643847]],
  643849: ['add', [643846, 643848]], 643880: ['multiply', [eps, 643849]],
  643882: ['add', [643880, 643881]], 643883: ['add', [633990, 643882]],
  1698945: ['m3_aux_inverse_partial', [1, [R, Z, T, ell, ...Y], [0, 0, 0, 0, 0]]],
  1706622: ['inverse', [635063]], 1706625: ['multiply', [1698945, 1706622]], 1706626: ['multiply', [20, 1706625]],
  1706664: ['multiply', [1706628, 1706663]],
  1706665: ['definite_integral', [1706664, 1706628, 633710, R]],
  1706666: ['definite_integral', [1706664, 1706628, 633710, 633712]],
  1706766: ['multiply', [633733, 1706666]], 1706767: ['multiply', [20, 1706766]],
  1706768: ['add', [1706665, 1706767]], 1706769: ['multiply', [623135, 1706768]],
  1706771: ['m3_aux_expression_partial', [-13, [ell, R, Z, T, ...Y], [0, 0, 1, 0, 0, 0]]],
  1706772: ['multiply', [eps, 1706771]], 1706773: ['multiply', [20, 1706772]], 1706782: ['add', [1706780, 1706781]],
  1706796: ['multiply', [623135, 1706785]],
  3613914: ['multiply', [1706773, 1706782]],
  3613918: ['m3_aux_expression_partial', [-13, [ell, R, Z, T, ...Y], [0, 0, 2, 0, 0, 0]]],
  3613919: ['multiply', [eps, 3613918]], 3613920: ['multiply', [20, 3613919]],
  3613921: ['multiply', [1706782, 3613920]], 3613922: ['multiply', [1706773, 1706822]],
  3613923: ['add', [3613921, 3613922]], 3613931: ['add', [3613923, 3613930]],
  3613932: ['add', [643029, 3613931]], 3613933: ['multiply', [eps, 3613932]], 3613934: ['multiply', [20, 3613933]],
  3613991: ['add', [3613934, 3613990]], 3613992: ['add', [3613939, 3613991]], 3613993: ['add', [3613989, 3613992]],
  3614333: ['definite_integral', [3614332, 3614331, 633710, 633712]],
  3614334: ['m3_aux_expression_partial', [-16, [ell, Z, T], [0, 0, 0]]],
  3614420: ['m3_aux_expression_partial', [-18, [ell, Z, T], [0, 0, 0]]],
  3614714: ['multiply', [634322, 3614334]], 3614716: ['multiply', [634330, 3614420]],
  3614767: ['m3_aux_expression_partial', [-19, [ell, R, Z, T], [0, 0, 0, 0]]],
  3614791: ['add', [1706624, 3614767]],
}).map(([id, value]) => [Number(id), value]));
for (const [raw, leading, imaginary, jr, jz, jr0, c, system] of [
  [627167, 627158, 627165, 626007, 627164, 626006, 626005, 695],
  [630585, 630576, 630583, 629425, 630582, 629424, 629423, 704],
]) {
  exact.set(raw, ['multiply', [19, raw - 1]]);
  exact.set(raw - 1, ['add', [leading, imaginary]]);
  exact.set(imaginary, ['multiply', [jr, jz]]);
  exact.set(jr, ['multiply', [20, jr0]]);
  exact.set(jr0, ['multiply', [eps, c]]);
  exact.set(c, ['actual_expression_partial', [system, [R, Z, T, 623035, 622805, 623950, 623955, 623935, ell, 623855, 623856, 623857],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]]);
}
const stream = createReadStream(resolve(graph, 'original-source-nodes.jsonl.gz')).pipe(createGunzip());
const digest = createHash('sha256');
stream.on('data', data => digest.update(data));
let index = -1;
for await (const line of createInterface({input: stream, crlfDelay: Infinity})) {
  if (index === -1) assert.equal(JSON.parse(line).node_count, 4456994);
  if (exact.has(index)) {
    const [op, args] = exact.get(index);
    assert.deepEqual(JSON.parse(line), {op, args}, `original node #${index}`);
  }
  index++;
}
assert.equal(index, 4456994);
assert.equal(digest.digest('hex'), graphSHA256);

// Rational polynomial controls on the fixed radial interval [1,2].
function gcd(a, b) {
  if (a < 0n) a = -a;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}
function Q(n, d = 1n) {
  n = BigInt(n); d = BigInt(d);
  assert(d > 0n);
  const g = gcd(n, d);
  return [n / g, d / g];
}
const add = ([a, b], [c, d]) => Q(a * d + c * b, b * d);
const mul = ([a, b], [c, d]) => Q(a * c, b * d);
const neg = ([a, b]) => Q(-a, b);
const sub = (a, b) => add(a, neg(b));
const zero = Q(0), one = Q(1);
const text = ([a, b]) => b === 1n ? String(a) : `${a}/${b}`;
const padd = (a, b) => Array.from({length: Math.max(a.length, b.length)}, (_, i) => add(a[i] ?? zero, b[i] ?? zero));
const scale = (a, c) => a.map(x => mul(x, c));
const psub = (a, b) => padd(a, scale(b, Q(-1)));
function pmul(a, b) {
  const p = Array(a.length + b.length - 1).fill(zero);
  for (const [i, x] of a.entries()) for (const [j, y] of b.entries()) p[i + j] = add(p[i + j], mul(x, y));
  return p;
}
const Rpol = [zero, one], chi = [Q(-1), one];
const prime = a => a.slice(1).map((x, i) => mul(x, Q(i + 1)));
const primitive = a => [zero, ...a.map(([n, d], i) => Q(n, d * BigInt(i + 1)))];
const at = (a, x) => a.reduceRight((b, c) => add(c, mul(b, Q(x))), zero);
const whole = a => sub(at(primitive(a), 2), at(primitive(a), 1));
const left = a => psub(primitive(a), [at(primitive(a), 1)]);
const right = a => psub([at(primitive(a), 2)], primitive(a));
const trim = a => a.length > 1 && a.at(-1)[0] === 0n ? trim(a.slice(0, -1)) : a;
const eq = (a, b) => assert.deepEqual(trim(a), trim(b));
const shift = (a, order) => [...Array(order).fill(zero), ...a];
const divideR = a => { assert.deepEqual(a[0], zero); return a.slice(1); };
const weightedT = (e, f) => {
  const rf = shift(f, e);
  return psub(left(rf), scale(chi, whole(rf)));
};
const adjoint = (e, gWithoutWeight) => shift(psub(right(gWithoutWeight), [whole(pmul(chi, gWithoutWeight))]), e);
const f = [Q(1), Q(-1), Q(2)], g = [Q(3), Q(1)];
const pairing = [];
for (const e of [0, 1]) {
  const lhs = whole(pmul(weightedT(e, f), g));
  const rhs = whole(pmul(f, adjoint(e, g)));
  assert.deepEqual(lhs, rhs);
  assert.notDeepEqual(whole(pmul(left(shift(f, e)), g)), rhs);
  const star = adjoint(e, g);
  const eOverRStar = e === 0 ? [zero] : divideR(star);
  eq(prime(star), psub(eOverRStar, shift(g, e)));
  pairing.push({e, bothPairings: text(lhs)});
}
const T1star = adjoint(1, g);
const Sstar = adjoint(0, T1star);
eq(prime(Sstar), scale(T1star, Q(-1)));
const bumpSeed = pmul([Q(-1), one], [Q(2), Q(-1)]);
let phi = Rpol;
for (let i = 0; i < 8; i++) phi = pmul(phi, bumpSeed);
const D1phi = padd(prime(phi), divideR(phi));
for (const edge of [1, 2]) {
  assert.deepEqual(at(phi, edge), zero);
  assert.deepEqual(at(D1phi, edge), zero);
}
const witnessW = prime(D1phi);
eq(weightedT(0, witnessW), D1phi);
eq(weightedT(1, D1phi), shift(phi, 1));
const retainedRadialPair = whole(pmul(pmul(f, D1phi), Sstar));
const derivativeTransferred = neg(whole(pmul(phi, padd(pmul(prime(f), Sstar), pmul(f, prime(Sstar))))));
const connectionTransferred = whole(pmul(divideR(phi), pmul(f, Sstar)));
assert.deepEqual(retainedRadialPair, add(derivativeTransferred, connectionTransferred));
assert.notDeepEqual(retainedRadialPair, derivativeTransferred);
const Ppair = mul(Q(1, 2), whole(pmul(phi, D1phi)));
const Jpair = mul(Q(1, 2), whole(shift(pmul(phi, D1phi), 2)));
assert(Ppair[0] > 0n);
assert.deepEqual(Jpair, zero);
const Fpair = ([a, b], [c, d]) => mul(Q(1, 2), add(mul(a, c), mul(b, d)));
const modeInv = ([a, b]) => [mul(Q(-3, 11), b), mul(Q(3, 11), a)];
const fmode = [Q(2), Q(3)], gmode = [Q(5), Q(7)];
const transferred = neg(Fpair(fmode, modeInv(modeInv(gmode))));
assert.deepEqual(Fpair(modeInv(fmode), modeInv(gmode)), transferred);
assert.notDeepEqual(Fpair(fmode, modeInv(modeInv(gmode))), transferred);
// The alternating integral series for atan(1), ending with a negative
// term, gives an exact lower bound already exceeding 3/4.
let atanLower = zero;
for (let j = 0; j < 8; j++) atanLower = add(atanLower, Q(j % 2 ? -1 : 1, 2 * j + 1));
assert(sub(atanLower, Q(3, 4))[0] > 0n);
assert(9n > 8n); // sqrt(2)<3/2, so |v_t|^2=4-2sqrt(2)>1.

// All order-four Leibniz splits of D^alpha partial_Z(beta*gamma).
// The high coefficient has no derivative on gamma or on any slow cutoff.
const factorial = n => Array.from({length: n}, (_, i) => BigInt(i + 1)).reduce((a, b) => a * b, 1n);
const choose = (n, i) => factorial(n) / (factorial(i) * factorial(n - i));
const high = [];
for (let a = 0; a <= 3; a++) {
  const alpha = [a, 3 - a], productOrders = [a + 1, 3 - a];
  const split = [];
  for (let i = 0; i <= productOrders[0]; i++) for (let j = 0; j <= productOrders[1]; j++) {
    split.push({beta: [i, j], gamma: [productOrders[0] - i, productOrders[1] - j],
      coefficient: String(choose(productOrders[0], i) * choose(productOrders[1], j))});
  }
  const highOnly = split.filter(row => row.beta[0] + row.beta[1] === 4);
  assert.deepEqual(highOnly, [{beta: productOrders, gamma: [0, 0], coefficient: '1'}]);
  assert.equal(split.reduce((sum, row) => sum + BigInt(row.coefficient), 0n), 16n);
  // Any derivative on either original radial cutoff or any other product
  // operand lowers the slow Wrz order by at least one.
  const Wrz = [a + 4, 3 - a];
  const Ctheta = [a + 5, 3 - a];
  high.push({alphaZT: alpha, betaGammaLeibniz: split, WrzZT: Wrz, WrzTorusL: 0,
    CthetaZT: Ctheta, CthetaTotalOrder: 8, counterpartRadialEndpointCthetaZT: Wrz,
    backgroundHighestByFrame: [[1, ...Ctheta], [0, Ctheta[0] + 1, Ctheta[1]]],
    targetHighestZT: Ctheta});
}
const signs = {earlyPressure: -1, earlyEz: 1, temporalPsi: -1, beta: -1, freshGr: -1, lowGamma: -1, haarAdjoint: -1};
assert.equal(Object.values(signs).reduce((p, sign) => p * sign, 1), 1);

const result = {
  status: 'VERIFIED_ORIGINAL_FIVEMAP_SOURCE_AND_ADJOINT_IDENTITIES_CONDITIONAL_SPARSE_C8',
  source: {graphSHA256, registrySHA256, graphNodes: index, selectedOriginalRows: exact.size, exactRecords: Object.fromEntries(exact),
    pins, originalPins, nativeSignatures: signatures, covarianceRows: fields[2].rows.length},
  reduction: {high, signs, coefficientInP: '+epsilon^4*ci0^-2', coefficientInJz: '-epsilon^4*ci0^-2/2',
    highSource: 'P_perp T1 T0 ∂Z^(4+a)∂T^(3-a) Wrz; no L derivative on this high source after Haar transfer',
    lowSource: 'P_perp (Id-A1) Ez paired with the actual R^j weight and N^-2',
    haarAdjoint: '<N^-1 f,N^-1 g> = -<f,N^-2 g> on the complete original mean-zero torus',
    inverseBound: '||N^-2 P_perp g||_2 <= (4/9)(||g||_2+||L^2g||_2/36)',
    radialAdjoint: 'In shear coordinates T_e^*g(r)=r^e[∫_r^b R^-e g(R)−∫_a^b R^-e χ(R)g(R)]. D_R T_e^*g=e/r*T_e^*g−g. D_R(T1T0)^*g=−T1^*g.',
    remainingHighest: 'Exactly the four indicated candidates in Ctheta, all Z/T at fixed labels, for this sufficient route. Their source magnitudes remain open.',
    directOperandOrders: {background: 9, target: 8, leadingOnlyBackground: 8, leadingOnlyTarget: 7}},
  exactControls: {adjointPairings: pairing, radialCutoffDeletionRejected: true, FourierAdjointSignMutationRejected: true,
    radialIntegrationByParts: {bothPairings: text(retainedRadialPair), connection: text(connectionTransferred), droppedConnectionRejected: true},
    scalarNoncancellation: {Ppair: text(Ppair), JzWeightedPair: text(Jpair), phi: 'R(R-1)^8(2-R)^8',
      compactSourceRealizesPhiThroughT1T0: true, scope: 'Operator-level scalar test, not an actual primary field.'}},
  scope: {sameOriginalArchivedSource: true, allLowerProductTermsAccountedByPriorSlow6: true,
    actualCthetaSparseC8Bounded: false, newLiveFamilyBound: false, fullMeanC3Bounded: false,
    finalJets: '0/67', release: 'HOLD'},
};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log(`PASS ${exact.size} archived nodes, four highest directions, Haar and radial adjoints, and exact scalar noncancellation.`);
