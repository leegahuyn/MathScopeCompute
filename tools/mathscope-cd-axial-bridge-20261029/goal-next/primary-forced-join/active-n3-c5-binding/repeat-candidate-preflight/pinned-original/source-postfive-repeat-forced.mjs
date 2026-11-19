import assert from 'node:assert/strict';
import { assertActualPostFiveFull3DPDE } from './source-postfive-full-3d-residual.mjs';
import { exactAngularHarmonicPDE, exactHarmonicComplexAlgebra } from '../navier/source-harmonic-assembly.mjs';
import { guardGlobalLocalBody, shareGlobalScalar } from '../navier/source-global-current.mjs';
import { originalAngularNormalizationLedger } from '../navier/source-global-angular.mjs';
import { exactAngularSourceSupportIdeal } from '../navier/source-global-forced-current.mjs';
import { assertOriginalFixedLiftPulsePath } from '../navier/source-initialized-angular.mjs';
import { coupledForcedAngularInverse } from '../navier/source-coupled-expressions.mjs';
import { realizeMappedForcedAngularCurl } from '../navier/source-mapped-forced-curl.mjs';
import { createQuadraticSourceVerifier } from '../navier/source-quadratic-identity.mjs';

const parts = ['real', 'imaginary'];
const components = ['beta', 'v', 'gamma'];
const positiveModes = [1, 2, 3, 4];
const complexRoots = value => parts.map(part => value[part]);
const vectorRoots = vector => vector.flatMap(complexRoots);

function equal(G, lhs, rhs, verify) {
  return lhs === rhs || verify(G.sub(lhs, rhs)).pass;
}

/** Exact finite convolution followed by subtraction of explicit flat addends. */
export function repeatForcedCoefficients(G, { geometry, phase, k, mean, waves, flat }) {
  const C = exactHarmonicComplexAlgebra(G);
  assert.equal(mean.m, 0);
  assert.deepEqual(waves.map(row => row.m).sort((a, b) => a - b), [-2, -1, 1, 2]);
  assert.deepEqual(flat.map(row => row.m), [1, 2]);
  const raw = exactAngularHarmonicPDE(G, { geometry, phase, k, rows: [mean, ...waves] });
  assert.deepEqual(raw.generatedModes, [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
  const verify = createQuadraticSourceVerifier(G, { maxTerms: 180000 });
  const positive = positiveModes.map(m => {
    const value = raw.conservativeResidual.find(row => row.m === m).value;
    const negative = raw.conservativeResidual.find(row => row.m === -m).value;
    const terms = flat.find(row => row.m === m)?.terms ?? [];
    const subtraction = value.map((_, j) => C.add(...terms.map(term => term.value[j])));
    const supported = value.map((z, j) => C.sub(z, subtraction[j]));
    for (let j = 0; j < 3; j++) {
      const conjugate = C.conjugate(value[j]);
      const recomposed = C.add(supported[j], subtraction[j]);
      for (const part of parts) {
        assert.ok(equal(G, negative[j][part], conjugate[part], verify), 'raw Fourier conjugacy');
        assert.ok(equal(G, value[j][part], recomposed[part], verify), 'flat subtraction recomposition');
      }
    }
    return { m, raw: value, terms, subtraction, supported };
  });
  return { raw, positive, negativeRule: 'Take the conjugate on the same own phase.' };
}

function coverBindings(G, forced, signed) {
  const a = forced.assembly;
  const b = signed.indexed;
  const fields = [...a.velocityFields, a.angularPressureField, ...b.velocity, b.angularPressure];
  const systems = fields.map(field => G.periodicIndexedSystem(field.field));
  const expected = systems[0];
  assert.equal(expected.rows.length, 162);
  assert.equal(new Set(expected.rows.map(row => row.label.key)).size, 81);
  const rowMap = ({ values, guards, derivativeMaps, coefficient, label }) =>
    ({ values, guards, derivativeMaps, coefficient, label });
  for (const system of systems) {
    assert.deepEqual(system.parameters, expected.parameters);
    assert.deepEqual(system.directions, expected.directions);
    assert.deepEqual(system.rows.map(rowMap), expected.rows.map(rowMap));
  }
  return fields.map(field => ({ field: field.field, root: field.root }));
}

function postFiveMeans(G, full, forced, signed) {
  const initial = forced.input;
  const source = initial.mean.temporal.pressure;
  const band = source.current.band;
  const five = full.five.postFiveMean;
  const background = [band.fields.b, G.mul(band.coordinates.R, band.fields.F), band.fields.G];
  const velocity = components.map((name, j) => G.add(background[j], five.velocity[name]));
  const pressure = G.add(band.fields.pressure, five.updatedMeanPressure.pressure.value);
  const waveVelocity = forced.assembly.velocityFields.map((field, j) =>
    G.add(field.root, signed.indexed.roots.velocity[j]));
  const wavePressure = G.add(forced.assembly.angularPressureField.root, signed.indexed.roots.angularPressure);
  const verify = createQuadraticSourceVerifier(G, { maxTerms: 180000 });
  for (let j = 0; j < 3; j++) {
    assert.ok(equal(G, full.velocity.fullPhysicalVelocity[j], G.add(velocity[j], waveVelocity[j]), verify),
      'same full post-Five velocity');
  }
  assert.ok(equal(G, full.pressure.fullPhysicalPressure, G.add(pressure, wavePressure), verify),
    'same full post-Five pressure');
  const theta = band.coordinates.theta;
  assert.ok([...velocity, pressure].every(root => !G.freeCoordinates(root).has(theta)), 'actual mean is angular-free');
  const parameters = source.cover.parameters;
  const power = exponent => G.exp(G.mul(G.log(initial.reference.ratio), exponent));
  const shareMean = (body, exponent, name) => {
    const system = G.defineExpressionFunction({ name, parameters, body });
    return G.mul(power(exponent), G.expressionValue(system, initial.reference.values));
  };
  const A = band.constants.A;
  const C = exactHarmonicComplexAlgebra(G);
  return { m: 0,
    velocity: velocity.map((root, j) => C.value(shareMean(root, G.neg(A), 'PostFiveRepeatMeanVelocity_' + j))),
    pressure: C.value(shareMean(pressure, G.neg(G.mul(G.q(2), A)), 'PostFiveRepeatMeanPressure')) };
}

function signedTail(G, initial, signed, template) {
  const { current } = initial.mean.temporal.pressure;
  const { band } = current;
  const { Xrep, etaRep, sRep, v } = band.coordinates;
  const at = current.representative.roots;
  const localMap = body => G.simultaneousSubstitute(
    G.simultaneousSubstitute(body, [Xrep, etaRep, sRep], [at.X, at.eta, at.s]),
    [band.cutoffs.xi, v], [template.lift.xi, template.lift.v]);
  const row = signed.originalCandidate.signed.rows[template.signIndex];
  assert.equal(row.sourceSign, template.sign);
  assert.equal(row.tangency.pass, true);
  const { t } = band.families[template.signIndex];
  const { psi, chi } = band.cutoffs;
  const uncut = t.map(x => G.mul(current.local.slowCutoff.body, G.sqrt(band.geometry.epsilon),
    row.deltaAmplitude, chi, x));
  const verify = createQuadraticSourceVerifier(G, { maxTerms: 180000 });
  assert.ok(uncut.every((root, j) => equal(G, G.mul(psi, root), row.weighted[j], verify)),
    'exact signed cutoff times uncut amplitude');
  const dpsi = G.derivative(psi, v);
  const C = exactHarmonicComplexAlgebra(G);
  return uncut.map((root, j) => C.value(shareGlobalScalar(G,
    localMap(G.mul(G.q(1, 2), dpsi, root)), 'PostFiveSignedPrincipalTail_' + template.key + '_' + j)));
}

function sharedWaveRows(G, template) {
  const C = exactHarmonicComplexAlgebra(G);
  const verify = createQuadraticSourceVerifier(G, { maxTerms: 180000 });
  return [1, 2].flatMap(m => {
    const positive = template.waveRows.find(row => row.m === m);
    const negative = template.waveRows.find(row => row.m === -m);
    const all = [...positive.velocity, positive.pressure];
    const other = [...negative.velocity, negative.pressure];
    const shared = all.map((z, j) => {
      const partner = C.conjugate(z);
      assert.ok(parts.every(part => equal(G, other[j][part], partner[part], verify)),
        'same complete post-Five conjugate wave');
      return C.value(...parts.map(part => shareGlobalScalar(G, z[part],
        'PostFiveRepeatWave_' + template.key + '_' + m + '_' + j + '_' + part)));
    });
    return [{ m, velocity: shared.slice(0, 3), pressure: shared[3] },
      { m: -m, velocity: shared.slice(0, 3).map(C.conjugate), pressure: C.conjugate(shared[3]) }];
  });
}

/** Attach the candidate grouped source to the original authenticated first cycle. */
export function constructPostFiveRepeatForcing(full, context = {}) {
  assert.equal(assertActualPostFiveFull3DPDE(full), true);
  const { G } = full;
  const successor = full.five.temporal.frontier.signed;
  const signed = successor.constructed;
  const forced = signed.originalForced;
  const initial = forced.input;
  const source = initial.mean.temporal.pressure;
  const { current } = source;
  const { band } = current;
  assert.equal(forced, successor.input);
  assert.equal(forced.G, G);
  assert.equal(originalAngularNormalizationLedger().pass, true);
  assert.equal(source.cover.proof.allCrossLabelProductsVanish, true);
  const fields = coverBindings(G, forced, signed);
  const mean = postFiveMeans(G, full, forced, signed);
  const definitions = G.captureFunctionDefinitions();
  const templates = forced.templates.map(template => {
    context.checkCancelled?.();
    const original = initial.templates.find(row => row.key === template.key);
    const signedWave = signed.templates.find(row => row.key === template.key);
    assert.ok(original && Array.isArray(original.primaryFlatResidual), 'requires the repaired primary subtraction');
    assert.ok(signedWave && signedWave.sign === template.sign, 'requires the matching sealed Signed wave');
    assert.equal(template.primaryFlatResidual, original.primaryFlatResidual);
    assert.equal(template.originalSourceRows, original.nonzeroAngularForcing);
    const primary = original.primaryFlatResidual.find(row => row.m === 1).value;
    const signedPrincipal = signedTail(G, initial, signed, template);
    const flat = [1, 2].map(m => {
      const f = template.forced.find(row => row.m === m).mapped.cutoff.mapped;
      const terms = [
        { family: 'first-forced-remaining-source', value: f.remainingSource },
        { family: 'first-forced-cutoff-derivative', value: f.derivativeSource },
      ];
      if (m === 1) terms.push({ family: 'primary-cutoff-derivative', value: primary },
        { family: 'signed-cutoff-derivative', value: signedPrincipal });
      return { m, terms };
    });
    const waves = sharedWaveRows(G, signedWave);
    const { positive } = repeatForcedCoefficients(G, {
      geometry: template.lift.geometry, phase: template.phase, k: template.k, mean, waves, flat
    });
    const C = exactHarmonicComplexAlgebra(G);
    const rawSystems = new Set(waves.flatMap(row => [...row.velocity, row.pressure])
      .flatMap(complexRoots).flatMap(root => {
        const node = G.nodes[root];
        return node.op === 'm3_coupled_expression_partial' ? [node.args[0]] : [];
      }));
    const rawSupport = exactAngularSourceSupportIdeal(G, {
      rows: positive.map(({ m, raw }) => ({ m, value: raw })),
      waveSystems: [...rawSystems]
    });
    const { r0, Ls } = band.geometry;
    const guard = body => {
      const rectangular = G.choose(template.lift.xi, G.neg(r0), r0, G.zero,
        G.choose(template.lift.v, G.zero, Ls, G.zero, body, G.zero), G.zero);
      const guarded = guardGlobalLocalBody(G, current.geometry, current.local.slowCutoff, rectangular, { auxiliary: false });
      const { Xrep, etaRep, sRep } = band.coordinates;
      const { X, eta, s } = current.representative.roots;
      return G.simultaneousSubstitute(guarded.body, [Xrep, etaRep, sRep], [X, eta, s]);
    };
    const rows = positive.map(row => ({ ...row, guarded: row.supported.map(z =>
      C.value(...parts.map(part => guard(z[part])))) }));
    context.onProgress?.({ stage: 'post-five-repeat-supported-source-candidate', key: template.key,
      nodeCount: G.nodes.length });
    return { template, rows, rawSupport };
  });
  assert.equal(templates.length, 10);
  assert.ok(G.functionDefinitionsUnchanged(definitions));
  return { G, templates, fields, mean,
    scope: { principalCutoffTermsRetained: true, completeFlatRemainderVerified: false,
      independentGlobalConservativeProjectionEquality: 'OPEN',
      equalityOfGuardedCandidateAndUnclippedSupportedSource: 'OPEN',
      fixedLabelSmoothJoinsAndUniformClassBounds: 'OPEN' } };
}

/** Materialize the original second pulse operator on all forty candidate inputs. */
export function constructPostFiveRepeatInverses(full, context = {}) {
  const source = constructPostFiveRepeatForcing(full, context);
  const { G } = source;
  const C = exactHarmonicComplexAlgebra(G);
  const systems = source.templates.flatMap(({ template, rows }) => {
    const first = template.forced.find(row => row.m === 1);
    const { path, inverse } = first;
    assert.equal(assertOriginalFixedLiftPulsePath(G, path), true);
    const { w, Y, Hw, vt } = path;
    const { R, Z, T, theta } = template.lift.geometry;
    return rows.map(({ m, guarded }) => {
      context.checkCancelled?.();
      const verify = createQuadraticSourceVerifier(G, { maxTerms: 180000 });
      const pullback = guarded.map((z, j) => Object.fromEntries(parts.map(part => {
        const body = z[part];
        const name = 'PostFiveRepeatPullback_' + template.key + '_' + m + '_' + j + '_' + part;
        const shared = shareGlobalScalar(G, body, name);
        const mapped = G.simultaneousSubstitute(shared, Y, Hw);
        const invariant = G.add(...Y.map((y, i) => G.mul(vt[i], G.derivative(mapped, y))));
        assert.ok(verify(invariant).pass, 'complete source stays fixed in the longitudinal basepoint');
        return [part, { body, shared, mapped, invariant }];
      })));
      const f = pullback.map(z => C.value(z.real.mapped, z.imaginary.mapped));
      const n = inverse.normal.value;
      const fixed = [...n, ...inverse.K.flat(), inverse.k, inverse.epsilon, inverse.input.length];
      const parameters = [...new Set([R, Z, T, ...Y,
        ...[...fixed, ...vectorRoots(f)].flatMap(root => [...G.freeCoordinates(root)])])]
        .filter(root => root !== w);
      assert.ok(!parameters.includes(theta));
      const bound = coupledForcedAngularInverse(G, { name: 'ActualPostFiveRepeatForced_' + template.key + '_m' + m,
        variable: w, parameters, directions: [R, Z, T, ...Y], length: inverse.input.length, n,
        K: inverse.K, k: inverse.k, epsilon: inverse.epsilon, forcing: f, m });
      const psiPath = first.mapped.cutoff.path.psi;
      const mapped = realizeMappedForcedAngularCurl({ G, inverse: bound.inverse, geometry: template.lift.geometry,
        phase: template.phase, pulseValue: template.lift.v, psiPath,
        name: 'ActualPostFiveRepeatCurl_' + template.key + '_m' + m });
      const positive = { m, velocity: mapped.velocity, pressure: mapped.pressure };
      const negative = { m: -m, velocity: mapped.velocity.map(C.conjugate), pressure: C.conjugate(mapped.pressure) };
      context.onProgress?.({ stage: 'post-five-repeat-inverse-candidate', key: template.key, m,
        nodeCount: G.nodes.length });
      return { key: template.key, m, pullback, system: bound.inverse.system,
        mappedCutoff: mapped.cutoff.mapped, positive, negative };
    });
  });
  assert.equal(systems.length, 40);
  return { ...source, systems,
    scope: { ...source.scope, nativeCandidateInverseSystems: 40,
      completeSecondForcedState: false, finalJets: 0, release: 'HOLD' } };
}
