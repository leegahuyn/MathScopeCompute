import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { openSavedInitializedSource, savedInitializedSourceProgram } from '../source-saved-initialized-authority.mjs';
import { createIndependentMeanReader, assertIndependentMeanReader } from '../source-saved-whole-mean-direct-audit.mjs';
import { createConditionalMonotoneDerivativeKernel, attachSavedMonotoneDerivativeAuthority, assertSavedMonotoneDerivativeAuthority } from '../source-saved-monotone-implicit-derivatives.mjs';
import { createFactoredRationalVerifier } from '../forced-rational-identity.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture() {
  const nodes = [{ op: 'rational', args: ['0', '1'] }, { op: 'rational', args: ['1', '1'] }, ...['s', 'z', 't', 'hidden'].map(x => ({ op: 'coordinate', args: [x] }))];
  const put = (op, args) => { const id = nodes.length; nodes.push({ op, args }); return id; }, q = (n, d = 1) => put('rational', [String(n), String(d)]);
  const h = q(1, 100), two = q(2), minus = q(-1), log = put('log_positive', [2]), exponent = put('multiply', [two, h, log]), power = put('exp', [exponent]),
    z2 = put('integer_power', [3, 2]), nonlinear = put('multiply', [z2, power]), body = put('add', [2, put('multiply', [minus, nonlinear]), put('multiply', [minus, 4])]);
  const definitions = [{ name: 'PrimitiveSource2Fixture', parameters: [3, 4], variable: 2, body, left: q(1, 2), right: two, derivativeLower: q(1, 2), derivativeUpper: 1 }],
    root = put('actual_monotone_root', [0, 3, 4]), node = id => nodes[id];
  const kernel = () => createConditionalMonotoneDerivativeKernel({ node, definitions, supportedSystems: [0] });
  const reader = adapter => createIndependentMeanReader({ node, sourceOperationRules: [adapter] });
  return { nodes, put, q, h, power, body, definitions, root, node, kernel, reader };
}

test('first and explicit second implicit constraints retain the complete nonlinear equation', () => {
  const f = fixture(), k = f.kernel(), G = f.reader(k), r = G.importSource(f.root), p = k.partials(G, r), verify = createFactoredRationalVerifier(G);
  assert.equal([...p.firstConstraintChecks, ...p.secondConstraintChecks].every(x => x.pass), true);
  const Z = G.importSource(3), E = G.put('exp', [G.mul(G.q(2), G.importSource(f.h), G.put('log_positive', [r]))]),
    expectedZ = G.div(G.mul(G.q(2), Z, E), p.denominator), expectedT = G.inv(p.denominator);
  assert.equal(verify(G.sub(p.first[0], expectedZ)).pass, true); assert.equal(verify(G.sub(p.first[1], expectedT)).pass, true);
  assert.equal(verify(G.sub(p.first[0], G.add(expectedZ, G.one))).pass, false);
  assert.equal(k.diagnostics(G).registryBindings[0].sourceAuthenticated, false);
  assert.equal(k.diagnostics(G).allDenominatorAndDomainHypothesesProved, false);
  assert.throws(() => { p.first[0] = G.zero; }, TypeError);
  assert.throws(() => { k.diagnostics(G).registryBindings[0].supportedByThisKernel = false; }, TypeError);
  assert.equal(verify(G.sub(G.derivative(r, Z), expectedZ)).pass, true);
});

test('chain rule differentiates every actual argument under simultaneous substitution', () => {
  const f = fixture(), z2 = f.put('integer_power', [3, 2]), tPlusZ = f.put('add', [4, 3]), compound = f.put('actual_monotone_root', [0, z2, tPlusZ]),
    k = f.kernel(), G = f.reader(k), root = G.importSource(compound), p = k.partials(G, root), Z = G.importSource(3), T = G.importSource(4), verify = createFactoredRationalVerifier(G);
  assert.equal(verify(G.sub(G.derivative(root, Z), G.add(G.mul(p.first[0], G.q(2), Z), p.first[1]))).pass, true);
  assert.equal(verify(G.sub(G.derivative(root, T), p.first[1])).pass, true);
  assert.deepEqual(k.diagnostics(G).actualCallBindings[0].originalSourceNode.args, [0, z2, tPlusZ]);
});

test('higher finite derivatives remain scalar DAGs at the same symbolic branch', () => {
  const f = fixture(), k = f.kernel(), G = f.reader(k), root = G.importSource(f.root), p = k.partials(G, root), Z = G.importSource(3), T = G.importSource(4), verify = createFactoredRationalVerifier(G, { maxTerms: 40000, maxProducts: 500000 });
  assert.equal(verify(G.sub(G.derivative(G.derivative(root, T), T), p.second[1][1])).pass, true);
  assert.equal(verify(G.sub(G.derivative(G.derivative(root, Z), T), p.second[0][1])).pass, true);
  // F(root,z,t)=0 is an analytic premise; its first/second/third derivative
  // constraints are independently evaluated as differential rational DAGs.
  const E = G.put('exp', [G.mul(G.q(2), G.importSource(f.h), G.put('log_positive', [root]))]), constraint = G.sub(G.sub(root, G.mul(G.pow(Z, 2), E)), T);
  const third = G.derivative(G.derivative(G.derivative(constraint, Z), T), T);
  assert.equal(verify(third).pass, true);
  assert.equal(G.nodes.some(n => /iterate|numeric|derivative_oracle/.test(n.op)), false);
  assert.equal(k.diagnostics(G).originalDerivativeRoutineCalled, false);
});

test('capture-safe root argument substitution retains original tuple and marks derived tuple unauthenticated', () => {
  const f = fixture(), k = f.kernel(), G = f.reader(k), root = G.importSource(f.root), Z = G.importSource(3), changed = G.substitute(root, Z, G.add(Z, G.one));
  const row = k.diagnostics(G).actualCallBindings.find(x => x.independentRoot === changed);
  assert.equal(row.derivedArgumentSubstitution, true); assert.equal(row.sourceAuthenticated, false);
  assert.deepEqual(row.originalSourceNode.args, [0, 3, 4]); assert.notEqual(changed, root);
});

test('hidden primitive coordinate captures reject equation, bracket and derivative bounds', () => {
  for (const key of ['body', 'left', 'derivativeLower']) { const f = fixture(); f.definitions[0][key] = f.put('add', [f.definitions[0][key], 5]); assert.throws(() => f.kernel(), { code: 'CAPTURED_IMPLICIT_COORDINATE' }); }
});

test('zero independent F_w rejects a fake positive derivative lower label', () => {
  const f = fixture(); f.definitions[0].body = f.put('add', [3, 4]); const k = f.kernel(), G = f.reader(k), root = G.importSource(f.root);
  assert.throws(() => k.partials(G, root), { code: 'SINGULAR_IMPLICIT_ROOT' });
  for (const lower of [0, -1]) { const bad = fixture(); bad.definitions[0].derivativeLower = bad.q(lower); assert.throws(() => bad.kernel(), { code: 'SINGULAR_IMPLICIT_ROOT' }); }
});

test('changed original equation and branch or wrong caller root cannot reuse a binding', () => {
  const f = fixture(), k = f.kernel(), G = f.reader(k); f.nodes[f.body] = { op: 'add', args: [f.body - 1, 1] };
  assert.throws(() => G.importSource(f.root), /defining body or branch operands changed/);
  const bad = fixture(); bad.definitions[0].left = bad.definitions[0].right; assert.throws(() => bad.kernel(), { code: 'INVALID_IMPLICIT_BRANCH' });
  const good = fixture(), a = good.kernel(), R = good.reader(a), original = R.importSource(good.root), fake = R.put('independent_implicit_monotone_root', [good.root, 0, [R.one, R.one]]);
  assert.throws(() => a.differentiate(R, fake, R.importSource(3)), /copied\/replaced implicit root/);
  assert.throws(() => a.importCall(R, 1), /existing complete actual implicit call/); assert.notEqual(fake, original);
});

test('unknown upstream body operators remain open even when a queried argument derivative is zero', () => {
  const f = fixture(); f.definitions[0].body = f.put('opaque_implicit_limit', [2, 3, 4]); const k = f.kernel(), G = f.reader(k), root = G.importSource(f.root);
  assert.throws(() => G.derivative(root, G.importSource(5)), { code: 'UNRESOLVED_IMPLICIT_UPSTREAM' });
  assert.equal(k.diagnostics(G).registryBindings[0].unresolvedUpstreamOperators[0].operation, 'opaque_implicit_limit');
  assert.throws(() => createConditionalMonotoneDerivativeKernel({ node: f.node, definitions: f.definitions, sourceAuthenticated: true }));
});

let pending;
const setup = () => pending ||= (async () => { const cap = await openSavedInitializedSource(), source = savedInitializedSourceProgram(cap), authority = attachSavedMonotoneDerivativeAuthority(cap); return { cap, source, authority }; })();

test('actual saved system2 has independently derived conditional first/second and higher scalar derivatives; all3 registries remain bound', { timeout: 150000 }, async () => {
  const startedAt = new Date().toISOString(), { cap, source, authority } = await setup(), G = createIndependentMeanReader({ node: source.node, sourceOperationRules: [authority] });
  assert.equal(assertSavedMonotoneDerivativeAuthority(authority), true); assert.equal(assertIndependentMeanReader(G, { expectedSourceNode: source.node }), true);
  assert.equal(authority.sourceBinding.definitions.length, 3);
  const sourceRoot = authority.sourceBinding.actualCalls.find(([id, n]) => id === 622820 && n.args[0] === 2); assert.ok(sourceRoot);
  const root = G.importSource(sourceRoot[0]), p = authority.partials(G, root), d = authority.sourceBinding.definitions[2].definition,
    Z = G.importSource(sourceRoot[1].args[1]), T = G.importSource(sourceRoot[1].args[2]), verify = createFactoredRationalVerifier(G, { maxTerms: 40000, maxProducts: 500000 });
  assert.equal([...p.firstConstraintChecks, ...p.secondConstraintChecks].every(x => x.pass), true);
  assert.equal(verify(G.sub(G.derivative(G.derivative(root, T), T), p.second[1][1])).pass, true);
  const thirdT = G.derivative(G.derivative(G.derivative(root, T), T), T); assert.ok(Number.isSafeInteger(thirdT));
  for (const index of [0, 1]) { const [sourceId] = authority.sourceBinding.actualCalls.find(([, n]) => n.args[0] === index); const call = G.importSource(sourceId); assert.throws(() => authority.partials(G, call), { code: 'UNRESOLVED_IMPLICIT_UPSTREAM' }); }
  const audit = { schema: 'MathScope.N6.SavedConditionalMonotoneDerivativeAudit/1', startedAt, finishedAt: new Date().toISOString(), source: cap.source,
    sourceBinding: authority.sourceBinding, actualSystem2: { sourceRoot, root, first: p.first, second: p.second, thirdT, firstConstraintChecks: p.firstConstraintChecks, secondConstraintChecks: p.secondConstraintChecks, originalBracket: [d.left, d.right], originalDerivativeBounds: [d.derivativeLower, d.derivativeUpper] },
    diagnostics: authority.diagnostics(G), readerDiagnostics: G.diagnostics(), scalarProgram: G.nodes,
    mathematicalStatus: 'CONDITIONAL_SYSTEM2_ALGEBRA_SYSTEMS01_AND_ANALYTIC_DOMAINS_UNRESOLVED',
    scope: { actualSavedSourceBound: true, originalDerivativeRoutineCalled: false, numericalRootUsed: false, allThreeSystemsDerivativeClosed: false, analyticBranchAndDomainProved: false, wholeMeanPDEVerified: false, wholePhysicalPDEVerified: false, originalN601Complete: false, originalN602Complete: false, completeN6: false, M3CountRaised: false } };
  assert.equal(audit.diagnostics.registryBindings[2].supportedByThisKernel, true);
  assert.equal(audit.diagnostics.registryBindings.slice(0, 2).every(x => !x.supportedByThisKernel), true);
  const directory = process.env.MATHSCOPE_MONOTONE_AUDIT_EVIDENCE_DIR;
  if (directory) { await mkdir(resolve(directory), { recursive: true }); const raw = JSON.stringify(audit, null, 2) + '\n', file = `monotone-implicit-${startedAt.replace(/[^0-9]/g, '')}.json`; await writeFile(resolve(directory, file), raw, { flag: 'wx' });
    const implementations = await Promise.all(['../source-saved-monotone-implicit-derivatives.mjs', '../source-saved-whole-mean-direct-audit.mjs', './saved-monotone-implicit-derivatives.test.mjs'].map(async path => { const bytes = await readFile(new URL(path, import.meta.url)); return { path, sha256: hash(bytes), bytes: bytes.length }; }));
    await writeFile(resolve(directory, `execution-${startedAt.replace(/[^0-9]/g, '')}.json`), JSON.stringify({ schema: 'MathScope.N6.SavedConditionalMonotoneDerivativeExecution/1', startedAt, finishedAt: new Date().toISOString(), nodeVersion: process.version, implementations, artifact: file, artifactSHA256: hash(raw), mathematicalStatus: audit.mathematicalStatus, originalN601Complete: false, originalN602Complete: false, M3CountRaised: false }, null, 2) + '\n', { flag: 'wx' });
    console.log('MONOTONE_IMPLICIT_AUDIT', JSON.stringify({ artifact: file, sha256: hash(raw), status: audit.mathematicalStatus, registryCount:3, actualCallCount:authority.sourceBinding.actualCalls.length, work:G.diagnostics().workUsed, system2ConstraintChecks:6, allThreeSystemsDerivativeClosed:false })); }
});

test('copied source authority, wrapper flags, altered deep reader provider and replaced scalar nodes reject', async () => {
  const { cap, source, authority } = await setup(); assert.throws(() => attachSavedMonotoneDerivativeAuthority(structuredClone(cap)));
  assert.throws(() => attachSavedMonotoneDerivativeAuthority(cap, { root: 622820 })); assert.throws(() => assertSavedMonotoneDerivativeAuthority({ ...authority }));
  const G = createIndependentMeanReader({ node: id => source.node(id), sourceOperationRules: [authority] });
  assert.throws(() => G.importSource(622820), /exact original node provider/);
  const authentic = createIndependentMeanReader({ node: source.node, sourceOperationRules: [authority] }), root = authentic.importSource(622820);
  authentic.nodes[root] = { op: 'rational', args: ['0', '1'] }; assert.throws(() => authority.differentiate(authentic, root, authentic.importSource(622803)), /unchanged privately issued independent reader/);
});
