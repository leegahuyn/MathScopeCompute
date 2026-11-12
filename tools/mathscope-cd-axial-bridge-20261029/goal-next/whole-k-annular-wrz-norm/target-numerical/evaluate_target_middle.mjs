/** Bound the actual target and all 72 archived middle FTC operands. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sha, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [tree, backgroundFile, reductionFile, historicalFile, thresholdsFile, out] = process.argv.slice(2);
assert(tree && backgroundFile && reductionFile && historicalFile && thresholdsFile && out);
const background = await load(backgroundFile, '4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966');
const reduction = await load(reductionFile, '2afed7192b136698b4ff4df92cab416c372406736bae4292a2adc49eae6481b1');
const historical = await load(historicalFile, '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0');
const thresholds = await load(thresholdsFile, 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const sourcePath = resolve(tree, 'research-ide/mathscope-m2/navier/actual-covariance-sensitivity.mjs');
const source = await readFile(sourcePath);
assert.equal(sha(source), 'f27ed95c3a1e40a4dfa4a38340d170aa92c7ec6102b277c952e1dc2dc91ac27c');
const sourceText = source.toString();
for (const clause of [
  "I=prefix('I',G.mul(q(2),X,F)),J=prefix('J',G.mul(q(2),X,U,F))",
  "S=prefix('S',G.sub(G.pow(U,2),G.mul(X,G.pow(F,2)))),Cp=prefix('Cp',G.pow(F,2))",
  'Pi=G.add(G.core.P0,Cp)',
  'W=G.sub(G.one,G.div(G.add(G.mul(q(2),c.D,eta,M),G.mul(d,G.derivative(M,eta))),X))',
  'angularNumerator=G.add(G.mul(G.sub(G.one,c.h),I),G.neg(G.mul(c.D,eta,G.derivative(I,eta))),G.neg(G.mul(d,G.derivative(J,eta))),G.mul(q(2),G.sub(c.h,c.D),eta,J))',
  'thetaStock=G.neg(G.div(G.mul(F,X,W),L)),thetaMoment=G.div(angularNumerator,G.mul(q(2),X,L)),thetaShear=G.mul(q(2),X,G.derivative(F,X))',
  'axialNumerator=G.add(G.neg(G.mul(X,W,U)),G.mul(c.D,G.sub(M,G.mul(eta,G.derivative(M,eta)))),G.mul(q(4),c.h,eta,S),G.neg(G.mul(d,G.derivative(S,eta))),G.mul(X,G.sub(G.mul(q(4),c.A,eta,Pi),G.mul(d,G.derivative(Pi,eta)))))',
  'zMoment=G.div(axialNumerator,G.mul(L,sqrt2X)),zShear=G.div(G.mul(q(2),X,G.derivative(U,X)),sqrt2X)',
]) assert(sourceText.includes(clause), clause);
assert.deepEqual(reduction.actualTargetBodies, [117773, 117774]);
assert.equal(reduction.verifiedRows, 72);
assert.equal(reduction.verifiedFaces, 288);

const {N, evaluateClosedArithmeticDefinitions} =
  await sourceArithmetic(tree, thresholds.sourcePins, 'coarse-upper');
const names = ['Xa', 't1', 'K'];
const parameters = evaluateClosedArithmeticDefinitions(historical.definitions, N, {names}).values;
const q = n => N.point(String(n));
const zero = {rational: '0'};
const one = N.one();
const pointUpper = upper => N.fromClosed({lower: zero, upper});
const Xb = N.fromClosed(background.Xb);
const Xa = parameters.get('Xa');
const t1 = parameters.get('t1');
const K = parameters.get('K');
const factorials = [1n];
for (let n = 1; n <= 10; n++) factorials.push(BigInt(n) * factorials[n - 1]);
const choose = (n, k) => factorials[n] / (factorials[k] * factorials[n-k]);
const plus = values => values.reduce((total, value) => N.add(total, value), N.zero());
const times = values => values.reduce((total, value) => N.mul(total, value), one);

function jet(value) {
  const cache = new Map();
  return (r, e) => {
    assert(r >= 0 && e >= 0 && r + e <= 10);
    const key = r + ':' + e;
    if (!cache.has(key)) cache.set(key, value(r, e));
    return cache.get(key);
  };
}
const sum = (...terms) => jet((r, e) => plus(terms.map(term => term(r, e))));
const constant = value => jet((r, e) => r + e ? N.zero() : value);
const product2 = (f, g) => jet((r, e) => {
  const terms = [];
  for (let a = 0; a <= r; a++) {
    for (let b = 0; b <= e; b++) terms.push(times([q(choose(r, a) * choose(e, b)), f(a, b), g(r-a, e-b)]));
  }
  return plus(terms);
});
const product = (...factors) => factors.reduce(product2, constant(one));
const scale = (c, f) => product(constant(q(c)), f);
const dx = f => jet((r, e) => f(r+1, e));
const de = f => jet((r, e) => f(r, e+1));
const prefix = f => jet((r, e) => r ? f(r-1, e) : N.mul(Xb, f(0, e)));
const X = jet((r, e) => e || r > 1 ? N.zero() : r ? one : Xb);
const eta = jet((r, e) => r || e > 1 ? N.zero() : one);
const d = jet((r, e) => r || e > 2 ? N.zero() : q(e ? 2 : 1));
const invX = jet((r, e) => e ? N.zero() : N.div(q(factorials[r]), N.pow(Xa, r+1)));
const invSqrt = jet((r, e) => e ? N.zero() :
  N.div(q(factorials[r]), N.mul(N.sqrt(N.mul(q(2), Xa)), N.pow(Xa, r))));
const invL = jet((r, e) => r ? N.zero() : q(2n * factorials[e] * 8n**BigInt(e)));
const F = jet(() => pointUpper(background.leadingOrdinaryC10.F0));
const U = jet(() => pointUpper(background.leadingOrdinaryC10.U0));
const P0 = jet((r, e) => r ? N.zero() : N.mul(q(5n * factorials[e] * 32n**BigInt(e)), K));
const M = prefix(U);
const I = prefix(scale(2, product(X, F)));
const J = prefix(scale(2, product(X, U, F)));
const S = prefix(sum(product(U, U), product(X, F, F)));
const Cp = prefix(product(F, F));
const Pi = sum(P0, Cp);
const W = sum(constant(one), product(invX, sum(scale(2, product(eta, M)), product(d, de(M)))));
// The real chart has |1-h|, |h-D|, A, D and h bounded by one.
const thetaMoment = product(constant(N.div(one, q(2))), invX, invL,
  sum(I, product(eta, de(I)), product(d, de(J)), scale(2, product(eta, J))));
const theta = sum(product(F, X, W, invL), thetaMoment, scale(2, product(X, dx(F))));
const zMoment = product(invL, invSqrt, sum(product(X, W, U), M, product(eta, de(M)),
  scale(4, product(eta, S)), product(d, de(S)), product(X, sum(scale(4, product(eta, Pi)), product(d, de(Pi))))));
const axial = sum(zMoment, scale(2, product(X, dx(U), invSqrt)));

const degree = (f, n) => N.max(Array.from({length: n + 1}, (_, r) =>
  Array.from({length: n-r+1}, (_, e) => f(r, e))).flat());
const C = [theta, axial].map(f => Array.from({length: 8}, (_, m) => degree(f, m+2)));
const derivativeLog = N.div(N.add(N.div(q(1024), t1), q(512)), Xa);
const constantFTC = times([q(3), N.add(one, Xb)]);
const multiplierFTC = times([q(3), q(1n << 185n), N.add(one, N.mul(Xb, N.add(one, derivativeLog)))]);
const rows = reduction.actualMiddleRows.map(row => {
  const total = row.orders[0] + row.orders[1];
  const upper = N.toClosed(N.add(constantFTC, N.mul(multiplierFTC, C[row.component][total]))).upper;
  assert.equal(N.compareEndpoints(upper, zero), 1);
  return {root: row.root, component: row.component, orders: row.orders, interval: {lower: zero, upper}};
});
assert.equal(rows.length, 72);
assert.equal(new Set(rows.map(row => row.root)).size, 72);
const result = {
  status: 'VERIFIED_ORIGINAL_72_MIDDLE_TARGET_FTC_NUMERICAL_UPPER_ENDPOINTS',
  originalGraphSHA256: reduction.sourceGraphSHA256, actualTargetBodies: reduction.actualTargetBodies,
  actualTargetThroughOrdinaryOrder: 9, originalLeadingThroughOrdinaryOrder: 10,
  componentBounds: C.map(values => values.map(value => N.toClosed(value).upper)),
  rows, remainingTargetFTC: {inner: 72, outer: 72}, finalTargetC7Leaves: '0/16',
  arithmetic: N.report(), release: 'HOLD',
};
await writeFile(out, JSON.stringify(result, null, 2) + '\n');
console.log('PASS numerical upper endpoints for all 72 original middle target FTC roots');
