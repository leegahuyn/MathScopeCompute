import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const parts = ['real', 'imaginary'];
const positive = rows => rows.find(row => row.m === 1);
const mode = (rows, m) => rows.find(row => row.m === m);

export async function prepareLivePrimaryC5Binding({ runtime, family, current, target, primary, initial }) {
  const load = file => import(pathToFileURL(resolve(runtime, 'mathscope-m3/navier', file)));
  const [{ assertGlobalPrimaryClassOperator }, { assertGlobalInitializedAngular },
    { assertOriginalFixedLiftPulsePath }] = await Promise.all([
    load('source-primary-class-majorants.mjs'), load('source-initialized-angular.mjs'),
    load('source-initialized-angular.mjs'),
  ]);
  assert.equal(assertGlobalPrimaryClassOperator(primary), true);
  assert.equal(assertGlobalInitializedAngular(initial), true);
  const pressure = initial.mean.temporal.pressure;
  const { G } = initial, { band, representative, domain } = current;
  assert.equal(domain.prefixOrder, 3);
  assert.equal(family.request.throughOrder, 4);
  assert.equal(family.request.derivativeOrder, 8);
  assert.equal(target.request.derivativeOrder, 6);
  assert.equal(primary.scope.actualFiniteDerivativeOrder, 5);
  assert.equal(current.band.family, family);
  assert.equal(target.family, family);
  assert.equal(primary.current, current);
  assert.equal(primary.target, target);
  assert.equal(pressure.current, current);
  assert.equal(initial.initial.pressure, pressure);
  assert.equal(current.G.nodes, G.nodes);
  assert.equal(primary.bounds.graphNamespace, 'norm');
  assert.equal(primary.sourceReferences.graphNamespace, 'current');
  const { Xrep, etaRep, sRep, v } = band.coordinates;
  const freeze = root => G.simultaneousSubstitute(root, [Xrep, etaRep, sRep],
    [representative.roots.X, representative.roots.eta, representative.roots.s]);
  const initialized = new Map();
  for (const old of initial.templates) {
    const i = old.signIndex, local = initial.initial.local[i], primal = primary.sourceReferences.fullCurl[i];
    const pulse = primary.sourcePulseBindings[i], covariance = primary.covariance.sourceRows[i];
    assert.equal(local.sign, old.sign);
    assert.equal(primal.sign, old.sign);
    assert.equal(pulse.system, old.sourceFrame.familySystem);
    assert.equal(pulse.system, local.sourcePulse);
    assert.deepEqual(local.sourceFullCurl, primal.fullCoefficient);
    assert.deepEqual(old.sourceFrame.primaryPotential, primal.potential);
    assert.deepEqual(old.sourceFrame.normalBeforePath, pulse.fullNormal.map(freeze));
    assert.equal(covariance.actualTangency, current.local.rows[i].tangency);
    assert.equal(covariance.actualTangency.pass, true);
    assert.equal(pulse.sourceAmplitudeBodyMatches, true);
    const lift = root => G.simultaneousSubstitute(freeze(root), [band.cutoffs.xi, v], [old.lift.xi, old.lift.v]);
    assert.deepEqual(old.normal, pulse.fullNormal.map(lift));
    const pre = positive(local.waveRows), shared = positive(old.waveRows), unshared = positive(old.unsharedWaveRows);
    for (let j = 0; j < 4; j++) {
      for (const part of parts) {
        const pair = row => j === 3 ? row.pressure : row.velocity[j];
        const original = j === 3 ? local.primaryPressure.value[part] : primal.fullCoefficient[j][part];
        assert.equal(pair(pre)[part], G.mul(G.q(1, 2), original));
        const body = pair(unshared)[part], root = pair(shared)[part];
        assert.equal(body, lift(pair(pre)[part]));
        if (root === body) continue;
        const { op, args } = G.nodes[root];
        assert.equal(op, 'm3_coupled_expression_partial');
        const definition = G.expressionSystem(args[0]);
        assert.equal(definition.body, body);
        assert.deepEqual(args[1], definition.parameters);
        assert.deepEqual(args[2], definition.parameters.map(() => 0));
      }
    }
    const raw2 = mode(old.waveResidual, 2).value;
    const quadratic = mode(old.update.newQuadraticRemainder, 2).value;
    assert.deepEqual(raw2, mode(old.nonzeroAngularForcing, 2).value);
    assert.equal(mode(old.primaryFlatResidual, 2), undefined);
    assert.ok(old.coefficientVerification.checks.every(check => check.pass));
    for (const rows of [old.update.oldResidual, old.update.linearized]) {
      assert.ok(mode(rows, 2)?.value.every(pair => parts.every(part => pair[part] === G.zero)) ?? true);
    }
    assert.deepEqual(raw2, quadratic, 'source mode two must be the entire positive self-quadratic');
    initialized.set(old.key, { old, sourcePulseSystem: pulse.system, leading: primal.leading, remainder: primal.remainder,
      pressure: local.primaryPressure.value, positive: shared, normal: old.normal, rawModeTwo: raw2 });
  }
  assert.equal(initialized.size, 10);
  function bindForcedTemplate(old, f) {
    const local = initialized.get(old.key);
    assert.equal(local.old, old);
    const m = f.m;
    assert.ok([1, 2].includes(m));
    assert.equal(assertOriginalFixedLiftPulsePath(G, f.path), true);
    assert.equal(f.path.pulse, old.lift.v);
    const raw = mode(old.waveResidual, m).value, supported = mode(old.nonzeroAngularForcing, m).value;
    const principal = mode(old.primaryFlatResidual, m)?.value;
    const system = f.inverse.G.forcedPulseSystem(f.inverse.system);
    assert.equal(system.name, `ActualOriginalForced_${old.key}_m${m}`);
    assert.equal(system.variable, f.path.w);
    assert.equal(system.length, old.sourcePulseLength);
    assert.deepEqual(system.forcing, f.inverse.projectedSource);
    for (let j = 0; j < 3; j++) for (const part of parts) {
      const source = supported[j][part], pull = f.pullback[j][part];
      assert.equal(source, G.sub(raw[j][part], principal?.[j][part] ?? G.zero));
      assert.equal(source, f.inputRoots[j][part]);
      assert.equal(source, pull.body);
      if (source !== G.zero) {
        assert.equal(G.expressionSystem(pull.system).body, source);
        assert.equal(G.simultaneousSubstitute(pull.root, f.path.Y, f.path.Hw), pull.mapped);
      }
      assert.equal(pull.mapped, f.bound.originalSource[j][part]);
      assert.equal(f.bound.wrappedSource[j][part], f.inverse.source[j][part]);
    }
    return { key: old.key, harmonic: m, system: system.id, raw, supported, principal: principal ?? null,
      sourcePulseSystem: local.sourcePulseSystem, originalSource: f.bound.originalSource, projected: system.forcing,
      H_w: f.path.Hw, localCoordinates: [band.coordinates.R, band.coordinates.Z, band.coordinates.T, band.cutoffs.xi, v],
      modeTwoMajorant: m === 2 ? 'conditional C4 local derivative rows; Duhamel and physical Y transport separate' : null,
      forcedOutputClassCertified: false };
  }
  return { prefix: domain.prefixOrder, q: domain.q, nextScale: domain.nextScale, initialized,
    normRoots: { namespace: 'norm', K: primary.bounds.K, classRows: primary.bounds.rows }, bindForcedTemplate };
}
