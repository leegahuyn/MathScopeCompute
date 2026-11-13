import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const partNames = ['real', 'imaginary'];

export async function prepareActiveModeTwoFrame({ runtime, primary, source }) {
  const load = path => import(pathToFileURL(resolve(runtime, path)));
  const [primaryModule, angular, inverseModule, quadratic, covariance] = await Promise.all([
    load('mathscope-m3/navier/source-primary-class-majorants.mjs'),
    load('mathscope-m3/navier/source-initialized-angular.mjs'),
    load('mathscope-m3/navier/source-forced-pulse.mjs'),
    load('mathscope-m3/navier/source-quadratic-identity.mjs'),
    load('mathscope-m2/navier/actual-covariance-matrix.mjs'),
  ]);
  assert.equal(primaryModule.assertGlobalPrimaryClassOperator(primary), true);
  assert.equal(angular.assertGlobalInitializedAngular(source), true);
  const G = source.G, pressure = source.mean.temporal.pressure, current = pressure.current;
  assert.equal(primary.current, current);
  assert.equal(primary.target.family, current.band.family);
  assert.equal(primary.scope.actualFiniteDerivativeOrder, 5);
  assert.equal(current.domain.prefixOrder, 3);
  assert.equal(current.band.family.request.throughOrder, 4);
  return ({ old, forced }) => bindSelectedFrame({ G, current, primary, source, old, forced, angular, inverseModule, quadratic, covariance });
}

function bindSelectedFrame({ G, current, primary, source, old, forced, angular, inverseModule, quadratic, covariance }) {
  assert.equal(inverseModule.assertForcedAngularInverse(forced.inverse), true);
  assert.equal(angular.assertOriginalFixedLiftPulsePath(G, forced.path), true);
  assert.ok(source.templates.includes(old));
  assert.ok(['0:1', '1:1'].includes(old.key));
  assert.equal(forced.m, 2);
  const { band, representative } = current, { Xrep, etaRep, sRep, v } = band.coordinates;
  const { frame, system, P } = band.families[old.signIndex];
  const oldPulse = primary.sourcePulseBindings[old.signIndex];
  assert.equal(system, old.sourceFrame.familySystem);
  assert.equal(system, oldPulse.system);
  assert.equal(P, oldPulse.originalP);
  assert.ok(oldPulse.binding.pass && oldPulse.coefficientsBoundBySamePrimitive && oldPulse.frozenReferenceAndCarrier);
  assert.equal(forced.path.pulse, old.lift.v);
  const { inverse } = forced, { w, Y } = forced.path;
  const q = (n, d = 1) => G.q(n, d);
  const freeze = root => G.simultaneousSubstitute(root, [Xrep, etaRep, sRep],
    [representative.roots.X, representative.roots.eta, representative.roots.s]);
  const atW = root => G.substitute(freeze(root), v, w);
  const matrixAtW = matrix => matrix.map(row => row.map(atW));
  const { dot, mul, transpose, identity } = covariance.covarianceMatrixAlgebra(G);
  const equal = (actual, expected, name) => {
    if (actual === expected) return { name, actual, expected, exactRoot: true };
    const check = quadratic.createQuadraticSourceVerifier(G, { maxTerms: 180000 })(G.sub(actual, expected));
    assert.equal(check.pass, true, name);
    return { name, actual, expected, difference: check.expression, exactRoot: false };
  };
  const compareVector = (name, a, b) => a.map((value, i) => equal(value, b[i], `${name}[${i}]`));
  const compareMatrix = (name, a, b) => a.flatMap((row, i) => compareVector(`${name}[${i}]`, row, b[i]));

  const n = frame.n.map(atW), nPrime = frame.nPrime.map(atW), n2 = atW(frame.nSquared), nt = atW(frame.nt),
    K = matrixAtW(frame.principalK), Aphi = matrixAtW(frame.Aphi), Pn = matrixAtW(frame.forcingProjection),
    damping = atW(frame.actualDamping), B = matrixAtW(frame.B), Bleft = matrixAtW(frame.Bleft),
    BPrime = matrixAtW(frame.BPrime), M1 = matrixAtW(frame.wMatrix), originalEnvelope = atW(P),
    lambda = atW(frame.reference.lambda), dref = atW(frame.reference.dref), rho = G.sub(lambda, dref);
  const checks = [...compareVector('actual native normal', inverse.normal.value, n),
    ...compareVector('actual native normal derivative', inverse.normal.derivative, nPrime),
    ...compareMatrix('actual native principal K', inverse.K, K), ...compareMatrix('actual native Aphi', inverse.Aphi, Aphi),
    ...compareMatrix('actual native projection', inverse.projection, Pn), equal(inverse.normal.squared, n2, 'actual native squared normal'),
    equal(inverse.damping, damping, 'actual native original damping'),
    equal(damping, G.mul(inverse.epsilon, G.pow(inverse.k, 2), n2), 'same literal epsilon*k^2*|n|^2'),
    equal(G.derivative(originalEnvelope, w), G.mul(rho, originalEnvelope), 'literal normalized Gaussian derivative')];
  assert.equal(inverse.input.variable, w);
  assert.equal(inverse.k, atW(band.geometry.k));
  assert.equal(inverse.epsilon, atW(band.geometry.epsilon));
  assert.equal(inverse.input.length, atW(band.geometry.Ls));
  assert.ok([originalEnvelope, ...B.flat(), ...Bleft.flat(), ...M1.flat()].every(root => Y.every(y => !G.dependsOn(root, y))));
  assert.ok([band.coordinates.R, band.coordinates.Z, band.coordinates.T].every(x => !G.dependsOn(originalEnvelope, x)));
  const sqrtNode = G.nodes[nt];
  assert.equal(sqrtNode.op, 'sqrt_positive');
  assert.equal(sqrtNode.args.length, 1);
  checks.push(equal(sqrtNode.args[0], G.add(G.pow(n[1], 2), G.pow(n[2], 2)), 'literal positive transverse squared normal'));

  // Read the exact original two-step basis construction. Its only radical
  // relation here is the literal positive sqrt's own radicand, checked above.
  const U = matrixAtW(frame.U), J = matrixAtW(frame.J), c = J[1][0];
  const Ka = [G.div(n[1], nt), G.div(n[2], nt)], Na = [Ka[1], G.neg(Ka[0])], sa = G.div(n[0], nt);
  const Uleft = [[G.one, G.zero, G.zero], [G.zero, ...Na]];
  const Jinv = [[q(1, 2), G.div(q(1, 2), c)], [q(1, 2), G.neg(G.div(q(1, 2), c))]];
  const radicand = G.nodes[nt].args[0], ratio = G.div(radicand, G.pow(nt, 2));
  const s = atW(frame.s), u = atW(band.constants.u), lambda0 = atW(band.frozen.lambda0);
  const tiltNorm = G.sqrt(G.add(G.one, G.pow(s, 2))), untiltedNorm = G.sqrt(G.add(G.one, G.pow(u, 2)));
  checks.push(equal(s, G.mul(q(old.sign), u, G.add(q(1, 2), G.div(w, inverse.input.length))), 'literal frozen reference tilt'),
    equal(c, G.mul(atW(band.frozen.c0), tiltNorm), 'literal original nonzero frame coefficient'),
    equal(lambda, G.div(lambda0, tiltNorm), 'literal original positive growth'),
    equal(dref, G.div(G.mul(lambda0, G.add(G.one, G.pow(s, 2))), G.pow(untiltedNorm, 3)), 'literal original reference damping'));
  const exponential = G.nodes[originalEnvelope];
  assert.equal(exponential.op, 'exp');
  const integral = G.nodes[exponential.args[0]];
  assert.equal(integral.op, 'definite_integral');
  const [integrand, integrationVariable, midpoint, upper] = integral.args;
  assert.equal(upper, w);
  assert.equal(G.nodes[integrationVariable].op, 'coordinate');
  checks.push(equal(midpoint, G.div(inverse.input.length, q(2)), 'literal normalization midpoint'),
    equal(integrand, G.substitute(rho, w, integrationVariable), 'literal Gaussian log integrand'));
  checks.push(...compareMatrix('actual moving U', U, [[G.one, G.zero],
    [G.neg(G.mul(sa, Ka[0])), Na[0]], [G.neg(G.mul(sa, Ka[1])), Na[1]]]),
  ...compareMatrix('actual moving J', J, [[G.one, G.one], [c, G.neg(c)]]),
  ...compareMatrix('actual B=UJ', B, mul(U, J)), ...compareMatrix('actual Bleft=Jinv Uleft', Bleft, mul(Jinv, Uleft)),
  ...compareMatrix('Jinv J', mul(Jinv, J), identity(2)),
  ...compareMatrix('Uleft U before literal sqrt reduction', mul(Uleft, U), [[G.one, G.zero], [G.zero, ratio]]),
  ...compareVector('n^T U before literal sqrt reduction', transpose(U).map(column => dot(n, column)),
    [G.mul(n[0], G.sub(G.one, ratio)), G.zero]),
  ...compareMatrix('actual differentiated moving frame', BPrime, B.map(row => row.map(x => G.derivative(x, w)))));
  const projected = matrixAtW(frame.projected);
  const AB = mul(Aphi, B);
  checks.push(...compareMatrix('actual moving-basis projected matrix', projected,
    mul(Bleft, AB.map((row, i) => row.map((root, j) => G.sub(root, BPrime[i][j]))))));
  const diagSubtract = (matrix, d) => matrix.map((row, i) => row.map((root, j) => i === j ? G.sub(root, d) : root));
  const M2 = diagSubtract(M1, G.mul(q(3), damping));
  checks.push(...compareMatrix('actual native Aphi-4*d*I', inverse.matrix, diagSubtract(Aphi, G.mul(q(4), damping))),
    ...compareMatrix('actual M1 normalization', M1, diagSubtract(projected, G.add(damping, rho))),
    ...compareMatrix('M2 with unchanged P envelope and additional 3d', M2,
      diagSubtract(projected, G.add(G.mul(q(4), damping), rho))));

  const native = inverse.G.forcedPulseSystem(inverse.system);
  assert.deepEqual(native.forcing, inverse.projectedSource);
  assert.deepEqual(native.matrix, inverse.matrix);
  assert.equal(native.left, G.zero);
  assert.ok(native.initial.every(z => partNames.every(part => z[part] === G.zero)));
  for (let j = 0; j < 3; j++) for (const part of partNames) {
    assert.equal(forced.inputRoots[j][part], forced.pullback[j][part].body);
    assert.equal(forced.pullback[j][part].mapped, forced.bound.originalSource[j][part]);
    assert.equal(forced.bound.wrappedSource[j][part], inverse.source[j][part]);
  }
  return { key: old.key, order: 3, system: native.id,
    pulse: { w, P: originalEnvelope, lambda, dref, rho, length: native.length, midpoint, integrand, integrationVariable },
    frame: { B, Bleft, BPrime, n, nPrime, n2, nt, c, K, Aphi, Pn, M1, M2, damping },
    normalizedForcingOperands: { Bleft, projected: native.forcing, denominator: originalEnvelope },
    originalNormNamespace: { K: primary.bounds.K, W: primary.bounds.W, Lmax: primary.bounds.backgroundRow.Lmax },
    exactChecks: checks, sourcePrimitiveRequired: ['nt>0', 'c!=0', '0<P<=1', '0<=d', 'W bounds the M1 propagator'],
    completeForcedSeal: false, numericalEndpointCertified: false };
}
