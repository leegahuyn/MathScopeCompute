import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { effectiveEvidenceTrust } from '../contracts.mjs';
import {
  prepareProofJob, assessProofEvidence, listShippedProofs, getShippedProofBundle,
  getProofCapabilities, isVerifiedProofReceipt, auditDependencyGraph,
  exportProofRequest, proofSha256, canonicalProofJSON,
} from '../proof.mjs';

const clone = v => JSON.parse(JSON.stringify(v));
const bundle = id => getShippedProofBundle(id || 'm0-finite-d2');
const sha = data => createHash('sha256').update(data).digest('hex');

test('all five shipped scopes recheck exact source bindings and get a branded local receipt', async () => {
  for (const item of listShippedProofs()) {
    const b = bundle(item.id);
    const job = await prepareProofJob(b.jobSpec);
    const checked = await assessProofEvidence(job, b);
    assert.equal(checked.status, 'LOCAL_AUDIT_VERIFIED', item.id);
    assert.equal(isVerifiedProofReceipt(checked.receipt), true);
    assert.equal(checked.receipt.issuedExistingFormalPass, false);
    assert.equal(checked.receipt.target, item.target);
    assert.ok(checked.receipt.targetType.includes(item.target));
  }
});

test('single source character change cannot reuse a previous kernel audit', async () => {
  const b = bundle();
  const edited = clone(b.jobSpec);
  edited.sourceFiles[0].content += '\n';
  const check = await assessProofEvidence(await prepareProofJob(edited), b);
  assert.equal(check.status, 'STALE');
  assert.ok(check.mismatchedBindings.includes('source'));
});

test('one supplied job hash edit is rejected even with unchanged source', async () => {
  const b = bundle();
  const job = clone(await prepareProofJob(b.jobSpec));
  job.digests.source = '0'.repeat(64);
  const checked = await assessProofEvidence(job, b);
  assert.equal(checked.status, 'STALE');
  assert.deepEqual(checked.mismatchedBindings, ['serializedJobBinding']);
});

test('changed axiom text makes the associated conditional proof stale', async () => {
  const b = bundle('m0-conditional-user-gap');
  const edited = clone(b.jobSpec);
  edited.assumptions[1].statement = 'userAssumedGapAtTwo : GapAt selectedSpectrum 2';
  const checked = await assessProofEvidence(await prepareProofJob(edited), b);
  assert.equal(checked.status, 'STALE');
  assert.ok(checked.mismatchedBindings.includes('assumptions'));
});

test('delta context change is bound even when the source editor has not yet changed', async () => {
  const b = bundle('m0-conditional-user-gap');
  const edited = clone(b.jobSpec);
  edited.context.delta = '2';
  const checked = await assessProofEvidence(await prepareProofJob(edited), b);
  assert.equal(checked.status, 'STALE');
  assert.ok(checked.mismatchedBindings.includes('context'));
});

test('target declaration and runtime digest are part of the audit identity', async () => {
  for (const mutate of [
    s => { s.target = 'MathScope.M0.Finite.integer_fixture'; },
    s => { s.environment.runtimeLibrarySha256 = 'f'.repeat(64); },
  ]) {
    const b = bundle(); const edited = clone(b.jobSpec); mutate(edited);
    assert.equal((await assessProofEvidence(await prepareProofJob(edited), b)).status, 'STALE');
  }
});

test('an imported audit with a fabricated authority ID cannot self-certify', async () => {
  const b = bundle(); const job = await prepareProofJob(b);
  b.id = 'my-own-audit';
  assert.equal((await assessProofEvidence(job, b)).status, 'UNTRUSTED_IMPORTED');
});

test('editing imported audit exit code, target type, axioms or source hash fails the immutable digest', async () => {
  for (const mutate of [
    b => { b.audit.compileExitCode = 1; },
    b => { b.audit.targetType = 'False'; },
    b => { b.audit.axioms = { all: [], standard: [], custom: [] }; },
    b => { b.audit.moduleBuilds[0].sourceSha256 = '0'.repeat(64); },
  ]) {
    const b = bundle(); const job = await prepareProofJob(b); mutate(b);
    assert.equal((await assessProofEvidence(job, b)).status, 'UNTRUSTED_IMPORTED');
  }
});

test('no audit or arbitrary Lean source creates no compiler claim', async () => {
  const b = bundle();
  const job = await prepareProofJob(b);
  const checked = await assessProofEvidence(job);
  assert.equal(checked.status, 'LOCAL_CHECK_REQUIRED');
  assert.equal(checked.canCompileHere, false);
  assert.equal(getProofCapabilities().arbitrarySourceCompile, false);
  assert.equal(getProofCapabilities().remoteEndpoint, null);
});

test('serialized and forged receipts have no runtime authority', async () => {
  const b = bundle();
  const checked = await assessProofEvidence(await prepareProofJob(b), b);
  assert.equal(isVerifiedProofReceipt(clone(checked.receipt)), false);
  assert.equal(isVerifiedProofReceipt({ status: 'LOCAL_AUDIT_VERIFIED', grade: 'EXACT_FINITE' }), false);
  assert.throws(() => { checked.receipt.grade = 'UNCONDITIONAL_FORMAL'; }, TypeError);
});

test('same-ID or blank semantic metadata cannot borrow a live proof receipt', async () => {
  const b = bundle();
  const checked = await assessProofEvidence(await prepareProofJob(b), b);
  const receipt = checked.receipt;
  for (const record of [
    {},
    { claimId: receipt.claimId, statement: 'The classical Riemann hypothesis holds.' },
    { claimId: receipt.claimId, sourceDigest: receipt.sourceDigest, jobId: receipt.jobId, revision: 'changed:r2' },
    clone(receipt),
  ]) assert.equal(effectiveEvidenceTrust(record, { receipt, isVerifiedProofReceipt }).status, 'REVALIDATION_REQUIRED');
  assert.equal(effectiveEvidenceTrust(receipt, { isVerifiedProofReceipt }).status, 'LOCAL_AUDIT_VERIFIED');
  assert.equal(effectiveEvidenceTrust(receipt, { receipt, isVerifiedProofReceipt }).status, 'LOCAL_AUDIT_VERIFIED');
});

test('the explicit-hypothesis real theorem is displayed conditional even without custom axioms', async () => {
  const b = bundle('m0-analytic-gap');
  const checked = await assessProofEvidence(await prepareProofJob(b), b);
  const trust = effectiveEvidenceTrust(checked.receipt, { isVerifiedProofReceipt });
  assert.equal(trust.status, 'LOCAL_AUDIT_VERIFIED');
  assert.equal(trust.conditional, true);
});

test('a source bundle export requires fresh matching after a JSON round trip', async () => {
  const b = bundle(); const job = await prepareProofJob(b);
  const exported = clone(exportProofRequest(job, b));
  assert.equal(exported.importedTrust, 'REVALIDATION_REQUIRED');
  assert.equal(isVerifiedProofReceipt(exported), false);
  const checked = await assessProofEvidence(exported.job, exported.audit);
  assert.equal(checked.status, 'LOCAL_AUDIT_VERIFIED');
  assert.equal(isVerifiedProofReceipt(checked.receipt), true);
});

test('custom axioms cannot be requested at an unconditional or exact-finite grade', async () => {
  for (const grade of ['UNCONDITIONAL_FORMAL', 'EXACT_FINITE']) {
    const b = bundle('m0-conditional-user-gap');
    b.jobSpec.requestedGrade = grade;
    const job = await prepareProofJob(b);
    assert.equal(job.status, 'BLOCKED_DEPENDENCY');
    assert.ok(job.graphAudit.issues.some(x => x.code === 'USER_AXIOM_GRADE_CONFLICT'));
    assert.equal((await assessProofEvidence(job, b)).status, 'DEPENDENCY_REJECTED');
  }
});

test('reachable cycles are rejected with the cycle path', () => {
  const checked = auditDependencyGraph({ nodes: [
    { id: 'A', kind: 'theorem' }, { id: 'B', kind: 'theorem' },
  ], edges: [{ from: 'A', to: 'B', type: 'DEPENDS_ON' }, { from: 'B', to: 'A', type: 'DEPENDS_ON' }] }, 'A');
  assert.equal(checked.ok, false);
  assert.ok(checked.issues.some(x => x.code === 'DEPENDENCY_CYCLE' && x.cycle.join(',') === 'A,B,A'));
});

test('unrelated user axioms do not contaminate a disjoint claim closure', () => {
  const checked = auditDependencyGraph({ nodes: [
    { id: 'finite', kind: 'theorem' },
    { id: 'unrelated', kind: 'user_axiom', statement: 'Some open proposition' },
  ], edges: [] }, 'finite', { requestedGrade: 'EXACT_FINITE' });
  assert.equal(checked.ok, true);
  assert.deepEqual(checked.closure, ['finite']);
  assert.deepEqual(checked.userAxioms, []);
});

test('a literature link and an open conjecture do not close a kernel proof', () => {
  for (const [kind, code] of [['reference', 'THEOREM_REFERENCE_ONLY'], ['open', 'RESEARCH_OPEN']]) {
    const checked = auditDependencyGraph({ nodes: [{ id: 't', kind: 'theorem' }, { id: 'input', kind }], edges: [{ from: 't', to: 'input', type: 'DEPENDS_ON' }] }, 't');
    assert.equal(checked.ok, false);
    assert.ok(checked.issues.some(x => x.code === code));
  }
});

test('renaming the desired theorem as an identical assumption leaves the research gate open', () => {
  const checked = auditDependencyGraph({ nodes: [
    { id: 'target', kind: 'theorem', statement: 'A positive continuum YM gap exists.' },
    { id: 'input', kind: 'user_axiom', statement: 'A positive continuum YM gap exists.' },
  ], edges: [{ from: 'target', to: 'input', type: 'DEPENDS_ON' }] }, 'target', { requestedGrade: 'CONDITIONAL_FORMAL', closeResearchGate: true });
  assert.equal(checked.ok, false);
  assert.ok(checked.issues.some(x => x.code === 'GOAL_ASSUMED_AS_PREMISE'));
});

test('dependency graph malformed edges, duplicate IDs and missing hypotheses are rejected', () => {
  for (const graph of [
    { nodes: [{ id: 't', kind: 'theorem' }], edges: [{ from: 't', to: 'absent', type: 'DEPENDS_ON' }] },
    { nodes: [{ id: 't', kind: 'theorem' }, { id: 't', kind: 'theorem' }], edges: [] },
    { nodes: [{ id: 't', kind: 'theorem' }, { id: 'h', kind: 'hypothesis' }], edges: [{ from: 't', to: 'h', type: 'DEPENDS_ON' }] },
  ]) assert.equal(auditDependencyGraph(graph, 't').ok, false);
});

test('source traversal, duplicate files and nonfinite metadata are rejected before hashing', async () => {
  for (const mutate of [
    s => { s.sourceFiles[0].path = '../evil.lean'; },
    s => { s.sourceFiles.push(clone(s.sourceFiles[0])); },
    s => { s.context.delta = NaN; },
    s => { s.assumptions = null; },
  ]) {
    const spec = bundle().jobSpec; mutate(spec);
    await assert.rejects(() => prepareProofJob(spec));
  }
});

test('canonical digests ignore object property order but preserve exact integer strings', async () => {
  assert.equal(await proofSha256({ b: 2, a: 1 }), await proofSha256({ a: 1, b: 2 }));
  assert.notEqual(await proofSha256('9007199254740993'), await proofSha256('9007199254740992'));
  assert.throws(() => canonicalProofJSON({ value: Infinity }));
});

test('shipped source text, raw Lean logs and negative controls match files actually checked', async () => {
  const validation = JSON.parse(await readFile(new URL('../evidence/lean-validation.json', import.meta.url), 'utf8'));
  assert.equal(validation.absenceOfSorry, true);
  assert.equal(validation.environment.unresolvedImportCount, 0);
  assert.equal(validation.environment.kernelModified, false);
  assert.equal(validation.environment.runtimeModified, false);
  for (const build of validation.builds) {
    assert.equal(build.exitCode, 0);
    assert.equal(build.warnings.length, 0);
    const source = await readFile(new URL(`../lean/${build.sourceFile}`, import.meta.url));
    assert.equal(sha(source), build.sourceSha256);
    const log = await readFile(new URL(`../evidence/${build.logFile}`, import.meta.url));
    assert.equal(sha(log), build.logSha256);
    assert.equal(log.toString(), build.log);
    assert.equal(build.sourceSorryToken, false);
  }
  for (const negative of validation.negativeControls) {
    assert.notEqual(negative.exitCode, 0);
    assert.equal(negative.rejected, true);
    assert.match(negative.log, /error:/);
  }
  assert.match(validation.negativeControls.find(n => n.name === 'NegativeFalse').log, /rfl|reflexivity/);
  assert.match(validation.negativeControls.find(n => n.name === 'NegativeMatrix').log, /false|decide/);
  for (const item of listShippedProofs()) {
    const b = bundle(item.id);
    for (const file of b.jobSpec.sourceFiles) {
      assert.equal(sha(file.content), file.sha256);
      assert.equal((await readFile(new URL(`../lean/${file.path}`, import.meta.url), 'utf8')), file.content);
    }
    assert.equal(b.audit.targetType, validation.builds.flatMap(r => r.targets).find(t => t.target === b.audit.target).targetType);
  }
});

test('full imported artifact closure is pinned outside the compact browser payload', async () => {
  const b = bundle();
  const manifestBytes = await readFile(new URL('../evidence/lean-environment.json', import.meta.url));
  assert.equal(sha(manifestBytes), b.jobSpec.environment.importManifestSha256);
  const manifest = JSON.parse(manifestBytes);
  assert.deepEqual(manifest.unresolved, []);
  assert.equal(manifest.sourceAndCompiledImportClosure.length, b.jobSpec.environment.importModuleCount);
  assert.ok(manifest.sourceAndCompiledImportClosure.length > 100);
  assert.equal('sourceAndCompiledImportClosure' in b.jobSpec.environment, false);
});

test('exact no-axiom fixture and user-axiom conditional fixture remain separately classified', async () => {
  const finite = bundle('m0-finite-integer');
  const conditional = bundle('m0-conditional-user-gap');
  assert.deepEqual(finite.audit.axioms.all, []);
  assert.equal(conditional.audit.axioms.custom.length, 2);
  const declared = conditional.jobSpec.assumptions.map(a => a.declaration).sort();
  assert.deepEqual([...conditional.audit.axioms.custom].sort(), declared);
  assert.equal(finite.jobSpec.requestedGrade, 'EXACT_FINITE');
  assert.equal(conditional.jobSpec.requestedGrade, 'CONDITIONAL_FORMAL');
});
