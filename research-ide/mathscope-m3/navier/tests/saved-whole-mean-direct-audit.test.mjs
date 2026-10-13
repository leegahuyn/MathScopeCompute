import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { openSavedInitializedSource } from '../source-saved-initialized-authority.mjs';
import { attachSavedInitializedNormFamily } from '../source-saved-initialized-norm-family.mjs';
import { attachSavedInitializedCutoffAuthority } from '../source-saved-initialized-cutoff-norms.mjs';
import { createFactoredRationalVerifier } from '../forced-rational-identity.mjs';
import { createIndependentMeanReader, independentlyReconstructWholeMean, auditSavedWholeMeanDirect, assertSavedWholeMeanDirectAudit } from '../source-saved-whole-mean-direct-audit.mjs';

function fixture() {
  const nodes = [{ op: 'rational', args: ['0', '1'] }, { op: 'rational', args: ['1', '1'] }, ...['R', 'Z', 'T', 'Y0', 'Y1', 'r'].map(x => ({ op: 'coordinate', args: [x] }))];
  const put = (op, args) => { const id = nodes.length; nodes.push({ op, args }); return id; };
  const q = n => put('rational', [String(n), '1']);
  const input = {
    geometry: { R: 2, Z: 3, T: 4, Y: [5, 6], epsilon: 1, ci: 1, radialFast: 0, vr: [1, 1], vt: [1, 1] },
    background: { b: 0, V: 0, G: 0 }, velocity: { beta: 0, v: 0, gamma: 0 },
    covariance: { rr: 0, rtheta: 0, rz: 0, thetatheta: 0, thetaz: 0, zz: 0 }, stress: [0, 0], pressure: 0,
  };
  return { nodes, put, q, input, reader: options => createIndependentMeanReader({ node: id => nodes[id], ...options }) };
}

test('independent cylindrical vector viscosity sends v=R² to Etheta=-3', () => {
  const f = fixture(); f.input.velocity.v = f.put('integer_power', [2, 2]);
  const G = f.reader(), r = independentlyReconstructWholeMean(G, f.input), verify = createFactoredRationalVerifier(G);
  assert.equal(verify(G.sub(r.Etheta, G.q(-3))).pass, true);
  assert.equal(verify(r.Ez).pass, true);
  const corrupted = G.add(r.Etheta, G.one); assert.equal(verify(G.sub(corrupted, G.q(-3))).pass, false);
});

test('independent full axial flux retains time, fast time, pressure, covariance, stress and self product', () => {
  const f = fixture(), { put, q } = f;
  const gamma = put('add', [put('integer_power', [3, 2]), put('add', [4, put('integer_power', [5, 2])])]);
  f.input.geometry.ci = q(3); f.input.geometry.vt = [q(2), 1]; f.input.velocity.gamma = gamma;
  f.input.covariance.rz = put('multiply', [2, 3]); f.input.covariance.zz = put('integer_power', [3, 4]);
  f.input.stress[1] = put('integer_power', [2, 2]); f.input.pressure = put('multiply', [q(5), put('integer_power', [3, 2])]);
  const G = f.reader(), r = independentlyReconstructWholeMean(G, f.input), Z = G.importSource(3), Y = G.importSource(5), R = G.importSource(2), verify = createFactoredRationalVerifier(G);
  const expected = G.add(G.mul(G.q(12), Y), G.q(-3), G.mul(G.q(4), Z, G.importSource(gamma)), G.mul(G.q(12), Z), G.mul(G.q(4), G.pow(Z, 3)), G.neg(G.mul(G.q(3), R)));
  assert.equal(verify(G.sub(r.Ez, expected)).pass, true);
  for (const missing of [G.mul(G.q(10), Z), G.mul(G.q(2), Z), G.mul(G.q(4), G.pow(Z, 3)), G.neg(G.mul(G.q(3), R))]) assert.equal(verify(G.sub(G.sub(r.Ez, missing), expected)).pass, false);
});

test('total-flux subtraction retains every background and mixed-velocity interaction', () => {
  const f = fixture(); f.input.background = { b: 1, V: f.q(2), G: f.q(3) };
  f.input.velocity = { beta: 2, v: f.put('integer_power', [3, 2]), gamma: 4 };
  const G = f.reader(), result = independentlyReconstructWholeMean(G, f.input), R = G.importSource(2), Z = G.importSource(3), T = G.importSource(4), Z2 = G.pow(Z, 2), verify = createFactoredRationalVerifier(G);
  const theta = G.add(G.q(4), G.mul(G.q(3), Z2), G.div(G.mul(G.q(2), Z2), R), G.mul(G.q(6), Z), G.mul(G.q(2), T, Z), G.div(Z2, G.pow(R, 2)));
  const axial = G.add(G.q(5), G.mul(G.q(2), T), G.div(T, R));
  const radial = G.add(G.q(-4), G.neg(G.mul(G.q(3), R)), G.div(G.mul(G.q(4), Z2), R), G.div(G.pow(Z, 4), R));
  assert.equal(verify(G.sub(result.Etheta, theta)).pass, true);
  assert.equal(verify(G.sub(result.Ez, axial)).pass, true);
  assert.equal(verify(G.sub(result.gr, radial)).pass, true);
});

test('independent pressure Leibniz preserves both moving endpoints', () => {
  const f = fixture(), body = f.put('multiply', [7, 3]), upper = f.put('integer_power', [3, 2]), p = f.put('definite_integral', [body, 7, 3, upper]);
  const G = f.reader(), Z = G.importSource(3), r = G.importSource(7), P = G.importSource(p), upperValue = G.importSource(upper), derivative = G.derivative(P, Z), verify = createFactoredRationalVerifier(G);
  const expected = G.add(G.integral(r, r, Z, upperValue), G.mul(upperValue, Z, G.q(2), Z), G.neg(G.mul(Z, Z)));
  assert.equal(verify(G.sub(derivative, expected)).pass, true);
  assert.equal(verify(G.sub(derivative, G.add(expected, G.pow(Z, 2)))).pass, false);
  assert.ok(G.diagnostics().domainHypotheses.some(x => x.kind === 'FINITE_INTEGRAL_LEIBNIZ' && x.movingEndpointTermsRetained));
});

test('integral argument substitution alpha-renames a colliding binder and keeps endpoint dependence', () => {
  const f = fixture(), body = f.put('exp', [f.put('multiply', [7, 3])]), p = f.put('definite_integral', [body, 7, 0, 3]),
    G = f.reader(), Z = G.importSource(3), caller = G.importSource(7), transformed = G.substitute(G.importSource(p), Z, caller),
    [integrand, binder, lower, upper] = G.nodes[transformed].args, verify = createFactoredRationalVerifier(G);
  assert.notEqual(binder, caller); assert.equal(lower, G.zero); assert.equal(upper, caller);
  const expectedBody = G.put('exp', [G.mul(binder, caller)]); assert.equal(integrand, expectedBody);
  const derivative = G.derivative(transformed, caller), expected = G.add(G.integral(G.mul(binder, expectedBody), binder, G.zero, caller), G.put('exp', [G.mul(caller, caller)]));
  assert.equal(verify(G.sub(derivative, expected)).pass, true); assert.equal(verify(derivative).pass, false);
  assert.equal(verify(G.sub(derivative, G.sub(expected, G.put('exp', [G.mul(caller, caller)])))).pass, false);
});

test('named expression derivatives inspect actual body and do not erase a captured fast coordinate', () => {
  const f = fixture(), root = f.put('m3_aux_expression_partial', [-1, [2], [0]]);
  const G = f.reader({ definitions: { expressionDefinitions: [{ name: 'hidden-fast', parameters: [2], body: 5 }] } });
  const value = G.importSource(root), Y = G.importSource(5);
  assert.throws(() => G.derivative(value, Y), { code: 'CAPTURED_COORDINATE_DERIVATIVE' });
  assert.deepEqual(G.diagnostics().inspectedDefinitionBindings[0].capturedCoordinates, [5]);
});

test('unknown derivative operations and dependent discrete labels fail closed', () => {
  const f = fixture(), root = f.put('opaque_limit', [2]), ceiling = f.put('ceiling', [2]), G = f.reader(), R = G.importSource(2);
  assert.throws(() => G.derivative(G.importSource(root), R), { code: 'UNRESOLVED_CUSTOM_DERIVATIVE' });
  assert.throws(() => G.derivative(G.importSource(ceiling), R), { code: 'UNRESOLVED_CUSTOM_DERIVATIVE' });
  assert.deepEqual(G.diagnostics().discreteDerivativeStops[0].sourceIds, [ceiling]);
  assert.deepEqual(G.diagnostics().discreteDerivativeStops[0].variableSourceIds, [2]);
  assert.equal(G.diagnostics().discreteDerivativeStops[0].frozenOrSmoothSelectionProved, false);
});

test('primitive reader preserves nonzero denominator and analytic-domain obligations', () => {
  const f = fixture(), inverse = f.put('inverse', [2]), log = f.put('log_positive', [2]), G = f.reader();
  G.importSource(inverse); G.derivative(G.importSource(log), G.importSource(2));
  const domains = G.diagnostics().domainHypotheses;
  assert.ok(domains.some(x => x.kind === 'NONZERO_DENOMINATOR'));
  assert.ok(domains.some(x => x.kind === 'POSITIVE_ANALYTIC_ARGUMENT'));
  assert.equal(domains.some(x => x.provedByThisAudit), false);
});

test('strict finite budgets prevent unbounded graph replay', () => {
  const f = fixture(); assert.throws(() => f.reader({ maxWork: 0 }), { code: 'RESOURCE_LIMIT' });
  assert.throws(() => f.reader({ maxWork: 400001 }), { code: 'RESOURCE_LIMIT' });
  const G = f.reader({ maxWork: 2 }); assert.throws(() => G.importSource(2), { code: 'RESOURCE_LIMIT' });
});

let pending;
const setup = () => pending ||= (async () => {
  const cap = await openSavedInitializedSource(), family = await attachSavedInitializedNormFamily(cap), cutoff = await attachSavedInitializedCutoffAuthority(family);
  return { cap, cutoff };
})();

test('actual saved old/new whole means are independently reconstructed or report every exact unresolved gate', { timeout: 150000 }, async () => {
  const { cap, cutoff } = await setup(), startedAt = new Date().toISOString();
  const implementationBytes = await readFile(new URL('../source-saved-whole-mean-direct-audit.mjs', import.meta.url));
  const implementationSha256 = createHash('sha256').update(implementationBytes).digest('hex');
  const audit = auditSavedWholeMeanDirect(cap, cutoff, { maxWork: 400000, maxNodes: 200000, maxTerms: 20000, maxProducts: 200000 });
  assert.equal(assertSavedWholeMeanDirectAudit(audit), true);
  assert.equal(audit.source.sourceNodeCount, 3615866);
  assert.equal(audit.scope.actualSavedWholeVelocityAndPressureRootsBound, true);
  assert.equal(audit.scope.actualMonotoneAndQuadraticDerivativeRulesAttached, true);
  assert.equal(audit.scope.implicitDomainHypothesesDischarged, false);
  assert.deepEqual(audit.diagnostics.sourceOperatorAudits.map(row => row.sourceOperation), ['actual_monotone_root', 'actual_quadratic_root']);
  assert.equal(audit.diagnostics.sourceOperatorAudits[1].sourceCapabilityBound, true);
  assert.equal(audit.diagnostics.sourceOperatorAudits[1].definitionBindings.length, 3);
  for (const key of ['originalFormulaHelperCalled', 'originalDerivativeRoutineCalled', 'oldResidualRootUsedAsProofOperand', 'allDenominatorAndDomainHypothesesProved', 'actualWholeMeanDifferenceRecomputed', 'wholePhysicalNonzeroAngularPDERecomputed', 'originalPrivateProducerHydrated', 'numericalErrorEnclosureComputed', 'originalN601Complete', 'originalN602Complete', 'completeN6', 'wholeM3Complete']) assert.equal(audit.scope[key], false, key);
  assert.equal(audit.sourceBindings.originalNonlinearRemainders.P >= 0, true);
  assert.throws(() => assertSavedWholeMeanDirectAudit(structuredClone(audit)));
  const directory = process.env.MATHSCOPE_WHOLE_MEAN_AUDIT_EVIDENCE_DIR;
  if (directory) {
    await mkdir(resolve(directory), { recursive: true });
    const raw = JSON.stringify(audit, null, 2) + '\n', file = `whole-mean-direct-${startedAt.replace(/[^0-9]/g, '')}.json`;
    await writeFile(resolve(directory, file), raw, { flag: 'wx' });
    await writeFile(resolve(directory, `execution-${startedAt.replace(/[^0-9]/g, '')}.json`), JSON.stringify({ schemaVersion: 'mathscope.whole-mean-direct-execution/1', startedAt, finishedAt: new Date().toISOString(), nodeVersion: process.version, platform: process.platform, implementationSha256, artifact: file, artifactSha256: createHash('sha256').update(raw).digest('hex'), mathematicalStatus: audit.status, executionReturned: true, originalN602Complete: false, countsChanged: false }, null, 2) + '\n', { flag: 'wx' });
    console.log('WHOLE_MEAN_DIRECT_AUDIT', JSON.stringify({ startedAt, status: audit.status, conditionalAlgebraIdentitiesMatched: audit.conditionalAlgebraIdentitiesMatched, stops: audit.stops, customClosureCount: audit.diagnostics.unresolvedCustomBodyClosure.length, work: audit.diagnostics.workUsed, artifact: file, sha256: createHash('sha256').update(raw).digest('hex'), originalN602Complete: false }));
  } else console.log('WHOLE_MEAN_DIRECT_AUDIT', JSON.stringify({ status: audit.status, conditionalAlgebraIdentitiesMatched: audit.conditionalAlgebraIdentitiesMatched, stops: audit.stops, customClosureCount: audit.diagnostics.unresolvedCustomBodyClosure.length, originalN602Complete: false }));
  assert.ok(audit.rows.length === 2 || audit.stops.length > 0, 'Every incomplete stage must have an explicit failure/stop record.');
  // Audit execution success is distinct from mathematical-gate acceptance.
  // No UNRESOLVED result is asserted to be an actual original PDE PASS.
});

test('serialized source/cutoff records and completion overrides cannot produce private audits', async () => {
  const { cap, cutoff } = await setup();
  assert.throws(() => auditSavedWholeMeanDirect(structuredClone(cap), cutoff));
  assert.throws(() => auditSavedWholeMeanDirect(cap, structuredClone(cutoff)));
  assert.throws(() => auditSavedWholeMeanDirect(cap, cutoff, { originalN602Complete: true }));
  assert.throws(() => auditSavedWholeMeanDirect(cap, cutoff, { maxWork: 0 }), { code: 'RESOURCE_LIMIT' });
});
