/** Assemble first spatial ingress from the live source owner. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const PINNED_CYCLE = '74a686bc95f4c094f1de834062b8b402aa5b861940fa3e109aa0f1913d52d529';
const MODULES = [
  ['../post-signed-20261023/source-postfive-full-3d-residual.mjs',
    'd93195ac381c75860e5d450a77ad3160ade16ca4579f4988dc38948e504163de'],
  ['source-harmonic-assembly.mjs',
    '339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20'],
];
const GUARD_OVERLAY = 'b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36';
const COMPONENTS = [0, 1, 2];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

async function loadModule(navier, [relative, digest]) {
  const path = resolve(navier, relative);
  assert.equal(sha(await readFile(path)), digest, relative);
  return import(pathToFileURL(path).href);
}

async function loadGuard(navier, originalOverlayPath) {
  const pinned = await readFile(originalOverlayPath);
  assert.equal(sha(pinned), GUARD_OVERLAY);
  const match = pinned.toString('utf8').match(/^export (function guardGlobalLocalBody\([\s\S]*?^})\r?$/m);
  assert.ok(match);
  const url = pathToFileURL(resolve(navier, 'source-global-current.mjs')).href;
  const {guardGlobalLocalBody} = await import(url);
  assert.equal(guardGlobalLocalBody.toString(), match[1]);
  return guardGlobalLocalBody;
}

function checkedRows(G, field) {
  const definition = G.periodicIndexedSystem(field);
  assert.equal(definition.rows.length, 162);
  return {parameters: definition.parameters, directions: definition.directions,
    rows: definition.rows.map(({values, guards, derivativeMaps, coefficient, label}) =>
      ({values, guards, derivativeMaps, coefficient, label}))};
}

function authenticateCycle(pde, reference) {
  const [stress, signedStage, frontier, temporalStage, fiveStage, physical] = reference.stages;
  const G = pde.G, five = pde.five, temporal = five.temporal;
  const signed = temporal.frontier.signed, forced = signed.input;
  assert.equal(reference.status, 'VERIFIED_FIRST_CYCLE_SOURCE_CONSTRUCTION');
  assert.equal(reference.prefix, 3);
  assert.equal(G.nodes.length, reference.split.nodeCount);
  assert.equal(signed.stage.endNodeCount, signedStage.nodeCount);
  assert.equal(signed.stage.newRegisteredRows, 1620);
  assert.deepEqual(signed.latestStress.Sigma, stress.sigma);
  assert.deepEqual(signed.audit.rootInventory, signedStage.roots);
  assert.deepEqual(temporal.frontier.scope, frontier.scope);
  assert.deepEqual(Object.values(temporal.inverses).map(row => row.exact), temporalStage.inverses);
  for (const [actual, expected] of [
    [temporal.postTemporal.updatedMeanPressure, temporalStage.freshPressureAndMeans],
    [five.postFiveMean.updatedMeanPressure, fiveStage.freshPressureAndMeans],
  ]) assert.deepEqual(['P', 'Jtheta', 'Jz'].map(key => actual.mean[key]), expected);
  assert.deepEqual(pde.velocity.fullPhysicalVelocity, physical.velocity);
  assert.equal(pde.pressure.fullPhysicalPressure, physical.pressure);
  assert.equal(pde.residual.divergence, physical.divergence);
  assert.deepEqual(pde.residual.conservative, physical.conservativeResidual);
  assert.deepEqual(pde.source.priorSignedVelocityRoots, signed.constructed.updated.fullVelocity);
  assert.equal(forced.assembly.exactPositiveSourceSystems, 20);
  assert.equal(forced.assembly.exactNegativeConjugateSolutionRoutes, 20);
  assert.equal(forced.assembly.signedSourceContributions, 162);
  return {G, forced, signed, temporal, five};
}

function mappedPotential({G, forced, signed}, guardGlobalLocalBody) {
  const input = forced.input, current = input.mean.temporal.pressure.current;
  const {band} = current;
  const {R, Z, T, Xrep, etaRep, sRep, v} = band.coordinates;
  const {A, D} = band.constants;
  const {r0, Ls} = band.geometry;
  const {localParameters, levelDifference} = input.coordinates;
  const rho = input.reference.ratio;
  const sourceFields = [...forced.assembly.velocityFields, ...signed.constructed.indexed.velocity];
  assert.equal(sourceFields.length, 6);
  const [reference, ...other] = sourceFields.map(field => checkedRows(G, field.field));
  for (const source of other) assert.deepEqual(source, reference);
  assert.equal(reference.directions.length, 6);
  assert.equal(forced.templates.length, 10);
  const signedRows = signed.constructed.originalCandidate.signed.rows;
  assert.deepEqual(signedRows.map(row => row.signIndex), [0, 1]);
  const actualRepresentative = current.representative.roots;
  const repSlots = [Xrep, etaRep, sRep];
  const repValues = [actualRepresentative.X, actualRepresentative.eta, actualRepresentative.s];
  const bySign = new Map(), perTemplate = [];
  const power = (x, exponent) => G.exp(G.mul(exponent, G.log(x)));
  const potentialScale = power(rho, G.sub(A, G.q(1, 2)));
  const referenceArguments = [G.mul(G.sqrt(rho), R), G.mul(power(rho, D), Z),
    G.mul(rho, T), ...localParameters.slice(3)];

  for (const [signIndex, signedRow] of signedRows.entries()) {
    const own = forced.templates.filter(template => template.signIndex === signIndex)
      .sort((a, b) => a.levelDifference - b.levelDifference);
    assert.deepEqual(own.map(row => row.levelDifference), [0, 1, 2, 3, 4]);
    assert.equal(new Set(own.map(row => row.sign)).size, 1);
    const localRoots = own.map(template => {
      const actualSigned = signed.constructed.templates.find(row => row.key === template.key);
      assert.equal(actualSigned.phase, template.phase);
      assert.deepEqual(actualSigned.signedRows.map(({m}) => m), [1, -1]);
      assert.deepEqual(template.forced.map(({m}) => m), [1, 2]);
      const positive = template.forced.map(({m, mapped}) => {
        assert.equal(mapped.phase, template.phase);
        assert.equal(mapped.k, template.k);
        assert.equal(mapped.m, m);
        assert.ok(mapped.identities.fullComplexPotentialCurled);
        const {real, imaginary} = mapped.potential.shared;
        assert.equal(real.length, 3);
        assert.equal(imaginary.length, 3);
        return {m, real: imaginary.map(root => G.neg(root)), imaginary: real};
      });
      // Same nested formal-to-actual map as complexPositive in Signed.
      const fixed = root => G.simultaneousSubstitute(
        G.simultaneousSubstitute(root, repSlots, repValues),
        [band.cutoffs.xi, v], [template.lift.xi, template.lift.v]);
      positive.push({m: 1, real: [G.zero, G.zero, G.zero],
        imaginary: signedRow.potential.map(root => G.mul(G.q(1, 2), fixed(root)))});
      perTemplate.push({key: template.key, sign: template.sign, phase: template.phase,
        k: template.k, potential: positive, transverse: template.lift.xi, pulse: template.lift.v});
      const roots = COMPONENTS.map(component => G.add(...positive.map(row => {
        const angle = G.mul(G.q(row.m), template.k, template.phase);
        return G.mul(G.q(2), G.sub(G.mul(row.real[component], G.cosine(angle)),
          G.mul(row.imaginary[component], G.sine(angle))));
      })));
      return roots.map(root => G.choose(template.lift.xi, G.neg(r0), r0, G.zero,
        G.choose(template.lift.v, G.zero, Ls, G.zero, root, G.zero), G.zero));
    });
    bySign.set(own[0].sign, COMPONENTS.map(component => {
      let body = G.zero;
      for (let j = 4; j >= 0; j--) {
        body = G.choose(levelDifference, G.q(2*j-1, 2), G.q(2*j+1, 2),
          body, localRoots[j][component], body);
      }
      const guarded = guardGlobalLocalBody(G, current.geometry, current.local.slowCutoff,
        body, {auxiliary:false});
      assert.equal(guarded.layers.length, 5);
      assert.equal(guarded.zeroBeforeSingularBodyEvaluation, true);
      const fixed = G.simultaneousSubstitute(guarded.body, repSlots, repValues);
      const ownSystem = G.defineExpressionFunction({
        name: 'SpatialStage1Gauge_own_' + signIndex + '_' + component,
        parameters: localParameters, body: fixed});
      return G.defineExpressionFunction({
        name: 'SpatialStage1Gauge_reference_' + signIndex + '_' + component,
        parameters: localParameters, body: G.mul(potentialScale,
          G.expressionValue(ownSystem, referenceArguments))});
    }));
  }
  assert.equal(bySign.size, 2);
  const indexed = COMPONENTS.map(component => {
    const rows = reference.rows.map(row => ({...row, localSystem: bySign.get(row.label.sign)[component]}));
    const field = G.definePeriodicIndexedField({name: 'SpatialStage1Gauge_' + component,
      parameters: reference.parameters, directions: reference.directions, rows,
      sourceRecipe: {candidateUncutGaugeOnly: true, fixedNegativeAndPositiveLabels: true}});
    return {field, root: G.periodicIndexedValue(field, reference.parameters)};
  });
  return {indexed, perTemplate, potentialScale, referenceArguments,
    sameExistingForceAndSignedRowMaps: 162, Q: band.roots.Q, A: band.constants.A};
}

export function covariantGradient(G, operators, vector) {
  const {Dr, Dz, angular, R} = operators;
  const [r, theta, z] = vector.map(angular);
  const connection = [G.sub(r, G.div(vector[1], R)), G.add(theta, G.div(vector[0], R)), z];
  return vector.map((component, j) => [Dr(component), connection[j], Dz(component)]);
}

export function originalCurlPlusDirect(G, op, A, directSwirl) {
  const angular = A.map(op.angular), radial = A.map(op.Dr), axial = A.map(op.Dz);
  return [G.sub(angular[2], axial[1]),
    G.add(G.sub(axial[0], radial[2]), directSwirl),
    G.sub(G.add(radial[1], G.div(A[1], op.R)), angular[0])];
}

/** The 33 spatial labels in the original higher jet request. */
export function originalSpatialJetAtoms(G, op, A, directSwirl) {
  const c = G.cosine(op.theta), s = G.sine(op.theta);
  const Cartesian = [G.sub(G.mul(A[0], c), G.mul(A[1], s)),
    G.add(G.mul(A[0], s), G.mul(A[1], c)), A[2]];
  const differentiate = [
    root => G.sub(G.mul(c, op.Dr(root)), G.mul(s, op.angular(root))),
    root => G.add(G.mul(s, op.Dr(root)), G.mul(c, op.angular(root))),
    op.Dz,
  ];
  const orders = [[0,0,0],[0,0,1],[0,0,2],[0,1,0],[0,1,1],
    [0,2,0],[1,0,0],[1,0,1],[1,1,0],[2,0,0]];
  const evaluate = (scalar, order) => order.reduce((value, count, axis) => {
    for (let i = 0; i < count; i++) value = differentiate[axis](value);
    return value;
  }, scalar);
  const output = Cartesian.flatMap((root, i) => orders.map(order => {
    const degree = order[0] + order[1] + order[2];
    return {label: `A${i}@${[...order, 0].join(',')}`, root: evaluate(root, order),
      multiplier: `Q^(1/2-A-${degree}/2)`};
  }));
  assert.ok(!G.freeCoordinates(directSwirl).has(op.theta));
  const b = G.div(directSwirl, op.R);
  output.push({label:'b@0,0,0', root:b, multiplier:'Q^(-A-1/2)'},
    {label:'b@1,0,0', root:G.div(op.Dr(b), G.mul(G.q(2), op.R)), multiplier:'Q^(-A-3/2)'},
    {label:'b@0,1,0', root:op.Dz(b), multiplier:'Q^(-A-1)'});
  assert.equal(new Set(output.map(row => row.label)).size, 33);
  return output;
}

/** Run only after construction of the pinned original direct/split roots.
 * Returns candidate uncut ingress. Independent source curl reduction and
 * whole-domain numerical derivative norms remain subsequent checks.
 */
export async function materializeActiveN3FirstSpatialIngress({
  navier, pde, referenceReceiptPath, originalGuardOverlayPath, includeSpatialJetAtoms = false,
}) {
  const raw = await readFile(referenceReceiptPath);
  assert.equal(sha(raw), PINNED_CYCLE);
  const [physical, harmonic] = await Promise.all(MODULES.map(entry => loadModule(navier, entry)));
  assert.equal(physical.assertActualPostFiveFull3DPDE(pde), true);
  const guard = await loadGuard(navier, originalGuardOverlayPath);
  const ownership = authenticateCycle(pde, JSON.parse(raw));
  const {G, forced, temporal, five} = ownership;
  const start = G.nodes.length;
  const wave = mappedPotential(ownership, guard);
  const meanPotentials = [temporal.potential.psi, five.potential.psi];
  const azimuthalSwirls = [temporal.potential.velocity.v, five.increment.v];
  const A = wave.indexed.map(({root}, j) => j === 1 ? G.add(root, ...meanPotentials) : root);
  const initialized = forced.input.global.velocity;
  const latest = pde.velocity.fullPhysicalVelocity;
  const U = latest.map((root, j) => G.sub(root, initialized[j]));
  const directSwirl = G.add(...azimuthalSwirls);
  const op = harmonic.originalCylindricalDifferentialOperators(G, pde.source.exactOriginalPhysicalGeometry);
  const candidateCurlPlusDirect = originalCurlPlusDirect(G, op, A, directSwirl);
  const gaugeDifferenceRootsForIndependentCheck = U.map((id, i) => G.sub(id, candidateCurlPlusDirect[i]));
  const G_U = covariantGradient(G, op, U);
  const G_A = covariantGradient(G, op, A);
  const spatialJetAtoms = includeSpatialJetAtoms ? originalSpatialJetAtoms(G, op, A, directSwirl) : null;
  assert.equal(physical.assertActualPostFiveFull3DPDE(pde), true);
  return {
    schema: 'MathScope.N7.ActiveN3FirstCorrectionSpatialIngressCandidate/1',
    originalPrefix: start, materializedNodes: G.nodes.length,
    sameLiveOriginalSourceAsserted: true, sourceReferenceReceiptSHA256: PINNED_CYCLE,
    guardOverlaySHA256: GUARD_OVERLAY,
    input: {initialized, latest, meanPotentials, azimuthalSwirls, directSwirl,
      temporalDesiredAxial: temporal.potential.gammaDesired,
      temporalRawCenteredSources: Object.values(temporal.inverses).map(row => row.body),
      fiveWhole: five.potential.whole, fiveCompactCandidate: five.potential.compactPsi},
    wave, normalizedRoots: {U, G_U, A, G_A}, gaugeDifferenceRootsForIndependentCheck, spatialJetAtoms,
    physicalMultipliers: {U: 'Q^(-A)', G_U: 'Q^(-A-1/2)', A: 'Q^(1/2-A)', G_A: 'Q^(-A)'},
    scope: {allLabelNormsCertified: false, candidateCurlEquivalenceVerified: false,
      nativeDependencyGraphExternallyExported: false, finalJets: 0, N706: 'OPEN', N805: 'OPEN', release: 'HOLD'},
  };
}
