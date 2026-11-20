import assert from 'node:assert/strict';

export const components = {
  rr: [0, 0], rtheta: [0, 1], rz: [0, 2],
  thetatheta: [1, 1], thetaz: [1, 2], zz: [2, 2],
};
const names = Object.keys(components);
const oldModes = [-2, -1, 1, 2];
const newModes = [-4, -3, -2, -1, 1, 2, 3, 4];

/** Verify the exact old/new cross terms and new/new terms with the original harmonic routine. */
export function repeatCovarianceDelta(G, { oldRows, repeatRows, theta }, source) {
  const C = source.exactHarmonicComplexAlgebra(G);
  const index = (rows, modes) => {
    assert.deepEqual(rows.map(row => row.m).sort((a, b) => a - b), modes);
    for (const row of rows) assert.ok(row.velocity.length === 3 && row.velocity.every(C.check));
    return new Map(rows.map(row => [row.m, row.velocity]));
  };
  const previous = index(oldRows, oldModes), increment = index(repeatRows, newModes);
  const zero = [C.zero, C.zero, C.zero];
  const at = (rows, mode) => rows.get(mode) ?? zero;
  const combined = newModes.map(m => ({
    m, velocity: at(previous, m).map((entry, j) => C.add(entry, at(increment, m)[j])),
  }));
  const before = source.exactAngularWaveCovariance(G, { rows: oldRows, theta });
  const after = source.exactAngularWaveCovariance(G, { rows: combined, theta });
  const atomicNodes = [...new Set([...previous.values(), ...increment.values()]
    .flat().flatMap(z => [z.real, z.imaginary]).filter(id => id !== G.zero))];
  const verify = source.createQuadraticSourceVerifier(G, { atomicNodes, maxTerms: 180000 });
  const values = {}, terms = {}, checks = {};
  for (const [name, [i, j]] of Object.entries(components)) {
    const oldNew = oldModes.map(m => C.mul(at(previous, m)[i], at(increment, -m)[j]));
    const newOld = oldModes.map(m => C.mul(at(increment, m)[i], at(previous, -m)[j]));
    const newNew = newModes.map(m => C.mul(at(increment, m)[i], at(increment, -m)[j]));
    // The original degree-zero angular projection is the sum over m+n=0.
    // Verify its real part formally even if all signed coefficients are independent.
    const direct = C.add(...oldNew, ...newOld, ...newNew);
    const diff = G.sub(after.values[name], before.values[name]);
    const identity = verify(G.sub(diff, direct.real));
    assert.ok(identity.pass, `wrong Repeat covariance delta for ${name}`);
    values[name] = direct.real;
    terms[name] = { oldNew, newOld, newNew };
    checks[name] = identity;
  }
  return { values, terms, checks, before, after };
}

/** Linear change of the exact original mean pressure operator at fixed mean velocity. */
export function covarianceOnlyMeanRefresh(G, { geometry, covariance, rho, chi }, source) {
  const zeroMean = { beta: G.zero, v: G.zero, gamma: G.zero };
  const zeroBackground = { b: G.zero, V: G.zero, G: G.zero };
  // Zero here represents the increments of the unchanged mean, background and
  // stress. It never replaces these source fields in the new physical velocity.
  const delta = source.reconstructUpdatedFullMeanPressure(G, {
    geometry, background: zeroBackground, velocity: zeroMean,
    covariance, stress: [G.zero, G.zero], rho, chi, tag: 'ActualPostFiveRepeatMeanPressureDelta',
  });
  assert.ok(delta.checks.every(check => check.pass));
  const { R, De, Dz } = source.originalFullMeanOperators(G, geometry);
  const g = G.add(G.neg(De(covariance.rr, 1)), G.neg(Dz(covariance.rz)),
    G.div(covariance.thetatheta, R));
  const theta = G.add(De(covariance.rtheta, 2), Dz(covariance.thetaz));
  const z = G.add(De(covariance.rz, 1), Dz(covariance.zz));
  const eq = (a, b) => source.globalGraphEqual(G, a, b, Object.values(covariance)).pass;
  assert.ok(eq(delta.mean.raw.gr, g));
  assert.ok(eq(delta.mean.raw.Etheta, theta));
  assert.ok(eq(delta.mean.raw.Ez, z));
  assert.ok(eq(delta.mean.raw.fluxTheta, G.mul(G.pow(R, 2), covariance.thetaz)));
  assert.ok(eq(delta.mean.raw.fluxZ, G.mul(R, covariance.zz)));
  const p = delta.pressure;
  assert.ok(eq(delta.mean.Ez, G.add(z, G.mul(geometry.epsilon, p.slowZDerivative))));
  assert.strictEqual(p.source, G.sub(delta.mean.gr, G.mul(rho, delta.mean.P)));
  assert.strictEqual(p.value, G.sub(p.integrals.left, G.mul(chi, p.integrals.whole)));
  assert.strictEqual(p.cutoffRemainder, G.mul(G.derivative(chi, R), p.integrals.whole));
  assert.equal(p.cutoffRemainderDeclaredZero, false);
  assert.equal(p.endpointTerms.endpointTermsDeclaredZero, false);
  return delta;
}

/** Live handoff adapter. Only the caller's just-attached candidate can supply the registration. */
export function buildLiveRepeatMeanRefresh({ pde, repeat, registration, source } = {}) {
  assert.equal(source.assertActualPostFiveFull3DPDE(pde), true);
  const { G, five } = pde;
  assert.strictEqual(repeat.G, G);
  assert.equal(registration.scope.candidateRegistrationOnly, true);
  const definitions = G.captureFunctionDefinitions();
  const signed = five.temporal.frontier.signed.constructed;
  const forced = signed.originalForced, initial = forced.input;
  const pressure = initial.mean.temporal.pressure;
  const oldMean = five.postFiveMean.updatedMeanPressure;
  const originalMeanVelocity = five.postFiveMean.velocity;
  assert.strictEqual(oldMean.velocity, originalMeanVelocity);
  assert.strictEqual(oldMean.mean.fullAngularCovariance, signed.updated.updatedCovariance);
  assert.strictEqual(oldMean.pressure.rho, pressure.pressure.rho);
  assert.strictEqual(oldMean.pressure.chi, pressure.pressure.chi);
  const { theta } = pressure.current.band.coordinates;
  const predecessor = G.periodicIndexedSystem(repeat.fields[0].field);
  const dispatch = ({ values, guards, derivativeMaps, coefficient, label }) =>
    ({ values, guards, derivativeMaps, coefficient, label });
  const angularDispatch = predecessor.rows.map(dispatch);
  const meanDispatch = angularDispatch.map(row => ({
    ...row,
    // Slot 14 is the physical angle. The frozen difference follows it.
    values: row.values.filter((_, j) => j !== 14),
    derivativeMaps: row.derivativeMaps.slice(0, 5),
  }));
  assert.equal(registration.fields.length, 4);
  registration.fields.forEach((item, j) => {
    const field = G.periodicIndexedSystem(item.field);
    const name = j < 3 ? `ActualPostFiveRepeatIncrementVelocity_${j}` : 'ActualPostFiveRepeatIncrementPressure';
    assert.equal(field.name, name);
    assert.equal(field.rows.length, 162);
    assert.deepEqual(field.parameters, predecessor.parameters);
    assert.deepEqual(field.directions, predecessor.directions);
    assert.deepEqual(field.rows.map(dispatch), angularDispatch);
    assert.equal(G.periodicIndexedValue(item.field, field.parameters), item.root);
  });
  const table = new Map(repeat.systems.map(system => [`${system.key}/${system.m}`, system]));
  assert.equal(table.size, 40);
  assert.equal(repeat.templates.length, 10);
  const templates = repeat.templates.map(({ template }) => {
    const previous = signed.templates.find(row => row.key === template.key);
    assert.strictEqual(template, forced.templates.find(row => row.key === template.key));
    assert.equal(previous.sign, template.sign);
    const repeatRows = [1, 2, 3, 4].flatMap(m => {
      const system = table.get(`${template.key}/${m}`);
      assert.ok(system);
      assert.equal(system.positive.m, m);
      assert.equal(system.negative.m, -m);
      return [system.positive, system.negative];
    });
    const delta = repeatCovarianceDelta(G, { oldRows: previous.waveRows, repeatRows, theta }, source);
    for (const key of names) {
      assert.ok(source.globalGraphEqual(G, delta.before.values[key], previous.afterCovariance.values[key]).pass);
    }
    return { ...template, deltaCovariance: delta };
  });
  const fields = Object.fromEntries(names.map(name => [
    name, source.completeSourceField(initial, templates, `ActualPostFiveRepeatCovarianceDelta_${name}`,
      template => template.deltaCovariance.values[name], { kind: 'covariance', angular: false }),
  ]));
  for (const field of Object.values(fields)) {
    const indexed = G.periodicIndexedSystem(field.field);
    assert.equal(field.contributions, 162);
    assert.deepEqual(indexed.parameters, predecessor.parameters.filter(id => id !== theta));
    assert.deepEqual(indexed.directions, predecessor.directions.filter(id => id !== theta));
    assert.deepEqual(indexed.rows.map(dispatch), meanDispatch);
  }
  const covariance = Object.fromEntries(names.map(name => [name, fields[name].root]));
  const delta = covarianceOnlyMeanRefresh(G, {
    geometry: pressure.geometry, covariance, rho: pressure.pressure.rho, chi: pressure.pressure.chi,
  }, source);
  const updatedCovariance = Object.fromEntries(names.map(name => [
    name, G.add(oldMean.mean.fullAngularCovariance[name], covariance[name]),
  ]));
  const updatedDefects = Object.fromEntries(['P', 'Jtheta', 'Jz'].map(name => [
    name, G.add(oldMean.mean[name], delta.mean[name]),
  ]));
  const fullVelocity = pde.velocity.fullPhysicalVelocity.map((root, j) => G.add(root, registration.fields[j].root));
  const fullPressure = G.add(pde.pressure.fullPhysicalPressure, registration.fields[3].root, delta.pressure.value);
  assert.ok(G.functionDefinitionsUnchanged(definitions));
  return {
    covarianceDeltaFields: fields, updatedCovariance, delta, updatedDefects, fullVelocity, fullPressure,
    scope: {
      candidatePressureRefreshOnly: true,
      requiresJustAttachedSameGraphRegistration: true,
      independentWholeFieldAngularProjectionProved: false,
      fullPhysicalResidualRecomputed: false,
      finalJets: 0,
      release: 'HOLD',
    },
  };
}
