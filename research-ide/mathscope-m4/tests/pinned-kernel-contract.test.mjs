import test from 'node:test';
import assert from 'node:assert/strict';
import { getShippedProofBundle, listShippedProofs } from '../../mathscope-m0/proof.mjs';
import { requirePinnedKernelEnvironment, requirePinnedDependencyManifest, auditExactTargetLog, intendedNegativeControl } from '../tools/pinned-kernel-contract.mjs';

test('all five exact audited types and axiom sets are accepted; mutated type/axioms and missing audits are rejected', () => {
  for (const item of listShippedProofs()) {
    const bundle = getShippedProofBundle(item.id);
    const log = bundle.audit.targetModuleLog;
    const checked = auditExactTargetLog(log, bundle);
    assert.equal(checked.target, item.target);
    assert.throws(() => auditExactTargetLog(log.replace(bundle.audit.targetType, 'False'), bundle), /TARGET_TYPE_MISMATCH/);
    assert.throws(() => auditExactTargetLog(bundle.audit.targetType, bundle), /AXIOM_AUDIT_MISSING/);
    const forged = `${bundle.audit.targetType}\n'${bundle.audit.target}' depends on axioms: [sorryAx]\n`;
    assert.throws(() => auditExactTargetLog(forged, bundle), /AXIOM_AUDIT_MISMATCH|SORRY/);
  }
});

test('a current compiler, changed runtime, or changed mathlib lock cannot impersonate the pinned environment', () => {
  const expected = getShippedProofBundle('m0-finite-d2').jobSpec.environment;
  requirePinnedKernelEnvironment(expected, expected);
  for (const field of ['leanCommit', 'runtimeLibrarySha256', 'mathlibCommit', 'mathlibLakeManifestSha256', 'leanVersion']) assert.throws(() => requirePinnedKernelEnvironment({ ...expected, [field]: 'different' }, expected), /PIN_MISMATCH/);
});

test('all transitive lock dependencies must match; missing, substituted, and unexpected libraries fail', () => {
  const mathlib = { packages: [{ name: 'batteries', rev: 'fixed-batteries', url: 'https://github.com/leanprover-community/batteries' }] };
  const root = { packages: [{ name: 'mathlib', rev: 'fixed-mathlib' }, ...mathlib.packages] };
  requirePinnedDependencyManifest(root, mathlib, 'fixed-mathlib');
  assert.throws(() => requirePinnedDependencyManifest({ packages: root.packages.slice(0, 1) }, mathlib, 'fixed-mathlib'), /TRANSITIVE_PIN_MISMATCH/);
  assert.throws(() => requirePinnedDependencyManifest({ packages: [...root.packages, { name: 'unreviewed-library' }] }, mathlib, 'fixed-mathlib'), /UNEXPECTED_DEPENDENCY/);
  assert.throws(() => requirePinnedDependencyManifest({ packages: [{ name: 'mathlib', rev: 'wrong-mathlib' }, ...mathlib.packages] }, mathlib, 'fixed-mathlib'), /PIN_MISMATCH/);
});

test('missing module and timeout exits cannot count as mathematical negative controls', () => {
  assert.equal(intendedNegativeControl('NegativeFalse', 1, 'Tactic `rfl` failed\n⊢ 0 = 1'), true);
  assert.equal(intendedNegativeControl('NegativeMatrix', 1, 'Tactic `decide` proved that the proposition is false'), true);
  assert.equal(intendedNegativeControl('NegativeFalse', 1, "unknown module prefix 'Init'"), false);
  assert.equal(intendedNegativeControl('NegativeMatrix', 1, "object file 'Defs.olean' does not exist"), false);
  assert.equal(intendedNegativeControl('NegativeFalse', null, 'Tactic `rfl` failed\n⊢ 0 = 1'), false);
  assert.equal(intendedNegativeControl('NegativeMatrix', 0, 'decide false'), false);
});
