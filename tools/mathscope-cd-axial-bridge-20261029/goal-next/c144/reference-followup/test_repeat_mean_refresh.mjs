import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { components, covarianceOnlyMeanRefresh, repeatCovarianceDelta } from './build_repeat_mean_refresh.mjs';

const root = process.argv[2];
if (!root) throw new Error('Pass the pinned original research-ide directory.');
const pins = {
  'mathscope-m2/navier/actual-continuation-exact-functions.mjs':
    '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'mathscope-m3/navier/source-harmonic-assembly.mjs':
    '339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20',
  'mathscope-m3/navier/source-auxiliary-expressions.mjs':
    'e456b4511adcc997b64267b2229422618b6139955e0c9083f2b83f4739600463',
  'mathscope-m3/navier/source-coupled-expressions.mjs':
    '5f83192211b649526a2616421a68c9e53004ace96776243e55e37b0a6973cf39',
  'mathscope-m3/navier/source-global-forced-current.mjs':
    '1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3',
  'mathscope-m3/navier/source-quadratic-identity.mjs':
    '696ff2202a9fb58e4de791a264fa23321fd81774f1f1a4f8336803d6a10b5bcd',
  'mathscope-m3/navier/source-updated-mean-pressure.mjs':
    '6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07',
  'mathscope-m3/navier/source-full-mean-equations.mjs':
    '2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76',
  'mathscope-m3/navier/source-pressure.mjs':
    'fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f',
  'mathscope-m3/navier/source-global-current.mjs':
    'b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36',
};
const source = {};
for (const [relative, digest] of Object.entries(pins)) {
  const path = resolve(root, relative);
  assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'), digest, relative);
  Object.assign(source, await import(pathToFileURL(path)));
}

const base = new source.ActualConvergentExpressions();
const G = new source.SourceCoupledExpressions(new source.AuxiliarySourceExpressions(base));
const C = source.exactHarmonicComplexAlgebra(G);
const [R, Z, T, Y0, Y1, theta] = ['R', 'Z', 'T', 'Y0', 'Y1', 'theta'].map(name => G.fresh(name));
const q = (n, d = 1) => G.q(n, d);
const eq = (a, b, label) => assert.ok(source.globalGraphEqual(G, a, b).pass, label);

function signed(rows) {
  return rows.flatMap(([m, values]) => {
    const velocity = values.map(([re, im]) => C.value(q(re), q(im)));
    return [{ m, velocity }, { m: -m, velocity: velocity.map(C.conjugate) }];
  });
}
const oldData = [
  [1, [[2, 3], [1, 4], [2, -2]]],
  [2, [[3, -1], [5, 1], [-1, 3]]],
];
const repeatData = [
  [1, [[5, -2], [2, 1], [4, 2]]],
  [2, [[-3, 2], [1, -2], [1, 1]]],
  [3, [[1, 2], [3, -1], [2, 2]]],
  [4, [[2, -1], [3, 2], [-1, 4]]],
];
const covariance = repeatCovarianceDelta(G, {
  oldRows: signed(oldData), repeatRows: signed(repeatData), theta,
}, source);
const old = new Map(oldData);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const expectedCovariance = {};
for (const [name, [i, j]] of Object.entries(components)) {
  let expected = 0;
  let mixed = 0;
  for (const [m, incoming] of repeatData) {
    const previous = old.get(m);
    if (previous) mixed += 2 * (dot(previous[i], incoming[j]) + dot(incoming[i], previous[j]));
    expected += 2 * dot(incoming[i], incoming[j]);
  }
  assert.notEqual(mixed, 0, name + ' mixed terms');
  assert.notEqual(expected, 0, name + ' new-only terms');
  eq(covariance.values[name], q(expected + mixed), name);
  assert.equal(covariance.terms[name].oldNew.length, 4);
  assert.equal(covariance.terms[name].newOld.length, 4);
  assert.equal(covariance.terms[name].newNew.length, 8);
  expectedCovariance[name] = expected + mixed;
}
assert.throws(() => repeatCovarianceDelta(G, {
  oldRows: signed(oldData), repeatRows: signed(repeatData).slice(0, -1), theta,
}, source), /deep-equal/);

const geometry = {
  R, Z, T, Y: [Y0, Y1], vr: [G.one, G.zero], vt: [G.zero, G.one],
  epsilon: G.one, ci: G.one, radialFast: G.one, radialPrimitive: R,
  innerRadius: q(1), outerRadius: q(3),
};
const changedW = {
  rr: G.pow(R, 2), rtheta: G.mul(R, Z), rz: G.mul(R, Z),
  thetatheta: G.add(G.mul(q(2), G.pow(R, 2)), G.mul(R, Y0)),
  thetaz: G.mul(q(3), R), zz: G.pow(R, 2),
};
const rho = q(1, 2), chi = G.div(G.sub(R, G.one), q(2));
const delta = covarianceOnlyMeanRefresh(G, { geometry, covariance: changedW, rho, chi }, source);
const previousW = Object.fromEntries(Object.keys(components).map((name, i) => [name, G.mul(q(i + 1), R, Z)]));
const updatedW = Object.fromEntries(Object.keys(components).map(name => [name, G.add(previousW[name], changedW[name])]));
const rest = {
  geometry, background: { b: R, V: G.mul(R, Z), G: Z },
  velocity: { beta: G.mul(R, Z), v: G.mul(T, R), gamma: G.mul(R, Y1) },
  stress: [R, Z],
};
const oldMean = source.exactFullAuxiliaryMeanPDE(G, { ...rest, covariance: previousW });
const newMean = source.exactFullAuxiliaryMeanPDE(G, { ...rest, covariance: updatedW });
for (const key of ['gr', 'Etheta', 'Ez', 'fluxTheta', 'fluxZ']) {
  eq(G.sub(newMean[key], oldMean[key]), delta.mean.raw[key], key);
}
eq(delta.mean.raw.gr, G.add(G.mul(q(-2), R), Y0), 'explicit radial source with fast dependence');
eq(delta.mean.raw.Etheta, G.mul(q(3), Z), 'explicit angular source');
eq(delta.mean.raw.Ez, G.mul(q(2), Z), 'explicit axial source before pressure');
assert.notEqual(delta.pressure.integrals.shiftedY[0], Y0);
assert.equal(delta.pressure.integrals.shiftedY[1], Y1);
assert.ok(delta.pressure.integrals.endpointCheck.pass);
assert.equal(delta.pressure.endpointTerms.innerZ, G.zero);
assert.equal(delta.pressure.endpointTerms.outerZ, G.zero);
assert.notEqual(delta.pressure.cutoffRemainder, G.zero);
assert.ok(Object.values(delta.mean.raw).includes(delta.mean.raw.fluxTheta));

console.log(JSON.stringify({
  status: 'PINNED_NATIVE_OPERATOR_FIXTURE_ONLY',
  allSixExactOldNewAndNewNewCovariances: expectedCovariance,
  allFiveCompleteDifferentialDifferencesPassed: true,
  fixedEnvelopeAndOriginalFastTranslationRetained: true,
  cutoffRemainderRetained: true,
  actualLiveAdapterExecuted: false,
  finalJets: 0,
  release: 'HOLD',
}, null, 2));
