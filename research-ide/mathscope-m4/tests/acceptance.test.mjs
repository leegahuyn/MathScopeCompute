import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getShippedProofBundle, listShippedProofs, proofSha256 } from '../../mathscope-m0/proof.mjs';
import { M4_CRITERIA, HANDOFF_BASELINE } from '../criteria.mjs';
import {
  requiredKernelArtifacts, verifyPinnedKernelArtifacts, isVerifiedKernelArtifactReceipt,
  assessM4Acceptance, buildM4ChecklistView, exportM4Assessment, isVerifiedM4Assessment,
  auditM4ResearchDependency, verifyCriterionEvidence, validateArtifactPath,
} from '../acceptance.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
const repoRoot = new URL('../../../', import.meta.url);
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fileURLToPath(repoRoot), encoding: 'utf8' }).trim();
const artifactCache = new Map();
// Exact Git object bytes avoid silently normalizing a Windows CRLF checkout.
const readArtifact = path => {
  if (!artifactCache.has(path)) artifactCache.set(path, execFileSync('git', ['show', `${sourceCommit}:${path}`], { cwd: fileURLToPath(repoRoot), maxBuffer: 16 * 1024 * 1024 }));
  return artifactCache.get(path);
};
const bundle = () => getShippedProofBundle('m0-finite-d2');

test('all 16 original criteria are enumerated without double-counting inherited M0', async () => {
  assert.deepEqual(M4_CRITERIA.map(c => c.id), ['I3', 'R1'].flatMap(p => Array.from({ length: 8 }, (_, n) => `${p}-${String(n + 1).padStart(2, '0')}`)));
  for (const item of M4_CRITERIA) {
    assert.ok(item.requirement.length > 40);
    assert.ok(item.checks.length >= 2);
    assert.ok([20, 68].includes(item.page));
  }
  assert.equal(HANDOFF_BASELINE.historicalM3OriginalAccepted, 56);
  assert.equal(HANDOFF_BASELINE.historicalM4FinalAcceptance, 'UNCONFIRMED');
  assert.equal(Object.isFrozen(M4_CRITERIA[0].checks), true);
});

test('five historical M0 target scopes rebind to exact raw source/log/environment artifacts', async () => {
  for (const item of listShippedProofs()) {
    const b = getShippedProofBundle(item.id);
    const verified = await verifyPinnedKernelArtifacts(b.jobSpec, b, readArtifact);
    assert.equal(verified.verified, true, `${item.id}: ${verified.reason}`);
    assert.equal(isVerifiedKernelArtifactReceipt(verified.receipt), true);
    assert.equal(verified.receipt.currentKernelExecuted, false);
    assert.equal(verified.receipt.grantsM4CriterionAcceptance, false);
    assert.equal(verified.receipt.target, item.target);
    assert.ok(verified.receipt.artifacts.some(a => a.roles.includes('RAW_NEGATIVE_LOG')));
    assert.equal(isVerifiedKernelArtifactReceipt(clone(verified.receipt)), false);
  }
});

test('raw checkout line-ending differences are detected rather than normalized into a PASS', async () => {
  const b = bundle();
  const manifestPath = 'research-ide/mathscope-m0/evidence/lean-environment.json';
  const committed = readArtifact(manifestPath);
  const crlf = Buffer.from(committed.toString('utf8').replaceAll('\n', '\r\n'));
  const result = await verifyPinnedKernelArtifacts(b.jobSpec, b, path => path === manifestPath ? crlf : readArtifact(path));
  assert.equal(result.verified, false);
  assert.equal(result.code, 'ARTIFACT_HASH_MISMATCH');
  assert.equal(result.path, manifestPath);
});

test('source one-character changes cannot reuse the historical kernel PASS', async () => {
  const b = bundle();
  const changed = clone(b.jobSpec);
  changed.sourceFiles[0].content += '\n';
  const result = await verifyPinnedKernelArtifacts(changed, b, readArtifact);
  assert.equal(result.verified, false);
  assert.equal(result.code, 'STALE');
});

test('forged compiler PASS, theorem type, custom axioms and negative-control success are rejected', async () => {
  for (const mutate of [
    b => { b.audit.compileExitCode = 1; },
    b => { b.audit.targetType = 'False'; },
    b => { b.audit.axioms.all = ['MathScope.fakeRH']; },
    b => { b.audit.negativeControls[0].exitCode = 0; b.audit.negativeControls[0].rejected = false; },
    b => { b.audit.sorry = true; },
  ]) {
    const b = bundle(); mutate(b);
    const rejected = await verifyPinnedKernelArtifacts(b.jobSpec, b, readArtifact);
    assert.equal(rejected.verified, false);
    assert.equal(rejected.code, 'UNTRUSTED_IMPORTED');
  }
  const b = bundle();
  assert.equal((await verifyPinnedKernelArtifacts(b.jobSpec, b, readArtifact)).verified, true, 'Rejected imports must preserve the previously valid scope.');
});

test('raw compiler log corruption and missing artifact cannot inherit a valid metadata audit', async () => {
  const b = bundle();
  const log = requiredKernelArtifacts(b).find(a => a.roles.includes('RAW_KERNEL_LOG'));
  const corrupted = await verifyPinnedKernelArtifacts(b.jobSpec, b, path => path === log.path ? 'forged PASS' : readArtifact(path));
  assert.equal(corrupted.code, 'ARTIFACT_HASH_MISMATCH');
  assert.equal(corrupted.path, log.path);
  const missing = await verifyPinnedKernelArtifacts(b.jobSpec, b, () => { throw new Error('missing'); });
  assert.equal(missing.code, 'ARTIFACT_MISSING');
  assert.equal((await verifyPinnedKernelArtifacts(b.jobSpec, b, readArtifact)).verified, true);
});

test('circular assumptions, reference-only imports and open nodes cannot close research gates', () => {
  const target = { id: 'claim', kind: 'theorem', statement: '∀ n, property n' };
  const circular = { nodes: [target, { id: 'hyp', kind: 'hypothesis', statement: target.statement }], edges: [{ from: 'claim', to: 'hyp', type: 'DEPENDS_ON' }] };
  const audit = auditM4ResearchDependency(circular, 'claim');
  assert.ok(audit.issues.some(i => i.code === 'GOAL_ASSUMED_AS_PREMISE'));
  for (const [kind, code] of [['reference', 'THEOREM_REFERENCE_ONLY'], ['open', 'RESEARCH_OPEN'], ['user_axiom', 'USER_AXIOM_GRADE_CONFLICT']]) {
    const graph = { nodes: [target, { id: 'p', kind, statement: 'unproved mathematical input' }], edges: [{ from: 'claim', to: 'p', type: 'DEPENDS_ON' }] };
    assert.ok(auditM4ResearchDependency(graph, 'claim').issues.some(i => i.code === code));
  }
  const cycle = { nodes: [target, { id: 't2', kind: 'theorem', statement: 'q' }], edges: [{ from: 'claim', to: 't2', type: 'DEPENDS_ON' }, { from: 't2', to: 'claim', type: 'DEPENDS_ON' }] };
  assert.ok(auditM4ResearchDependency(cycle, 'claim').issues.some(i => i.code === 'DEPENDENCY_CYCLE'));
});

test('self-authored success artifacts require independent original-criterion review', async () => {
  const text = JSON.stringify({ status: 'PASS', executed: true, complete: true });
  const candidate = { schemaVersion: 'mathscope.m4.criterion-evidence/1', criterionId: 'R1-06', sourceCommit: 'fake', checks: { allPass: true }, artifacts: [{ path: 'receipt.json', sha256: await proofSha256(text) }] };
  const result = await verifyCriterionEvidence(candidate, () => text);
  assert.equal(result.verified, false);
  assert.equal(result.code, 'CRITERION_REVIEW_REQUIRED');
  assert.equal(result.integrityCheckedArtifacts.length, 1);
  assert.equal((await verifyCriterionEvidence(candidate, () => `${text} `)).code, 'CRITERION_ARTIFACT_HASH_MISMATCH');
});

test('fabricated 16/16 receipts and claimed 64/64 M3 cannot freeze or silently alter the baseline', async () => {
  const report = await assessM4Acceptance({ criterionReceipts: M4_CRITERIA.map(c => ({ criterionId: c.id, status: 'PASS', verified: true })), m3CompletionEvidence: { complete: true, accepted: 64, status: 'PASS' } });
  assert.equal(report.rejectedSerializedCriterionReceipts, 16);
  assert.equal(report.newlyAcceptedCriteriaInThisAudit, 0);
  assert.equal(report.historicalM4FinalAcceptance, 'UNCONFIRMED');
  assert.equal(report.currentM3CompletionVerified, false);
  assert.equal(report.canFreeze, false);
  assert.deepEqual(report.pendingOriginalM3, HANDOFF_BASELINE.pendingOriginalM3);
  assert.deepEqual(report.openResearch, ['RH_GLOBAL_BRIDGE', 'BSD_UNIVERSAL', 'GENERAL_G_CONTINUUM_QUANTUM_YM', 'WHOLE_ORIGINAL_NS_RECONSTRUCTION']);
});

test('export/import loses assessment authority; student/expert view preserves all original claim IDs', async () => {
  const b = bundle();
  const checked = await verifyPinnedKernelArtifacts(b.jobSpec, b, readArtifact);
  const report = await assessM4Acceptance({ kernelReceipts: [checked.receipt] });
  const view = buildM4ChecklistView(report);
  assert.equal(view.predecessorKernelScopes.length, 1);
  assert.equal(view.gate, 'HOLD');
  assert.deepEqual(view.groups.flatMap(g => g.criteria.map(c => c.claimId)), M4_CRITERIA.map(c => c.id));
  assert.equal(isVerifiedM4Assessment(report), true);
  const exported = exportM4Assessment(report);
  assert.equal(isVerifiedM4Assessment(exported.report), false);
  assert.throws(() => buildM4ChecklistView(exported.report), /Reassess/);
  const rechecked = await assessM4Acceptance();
  assert.equal(isVerifiedM4Assessment(rechecked), true);
});

test('absolute, Windows, traversal, duplicated artifacts and malformed metadata are rejected', async () => {
  for (const path of ['../receipt.json', 'a/../receipt.json', 'C:/receipt.json', '/receipt.json', 'a\\receipt.json', 'a/./receipt.json']) assert.throws(() => validateArtifactPath(path));
  const text = '{}';
  const a = { path: 'receipt.json', sha256: await proofSha256(text) };
  const candidate = { schemaVersion: 'mathscope.m4.criterion-evidence/1', criterionId: 'R1-01', artifacts: [a, a] };
  assert.equal((await verifyCriterionEvidence(candidate, () => text)).code, 'CRITERION_ARTIFACT_INVALID');
  candidate.artifacts = [a]; candidate.memory = Infinity;
  assert.equal((await verifyCriterionEvidence(candidate, () => text)).code, 'INVALID_CRITERION_EVIDENCE');
});
