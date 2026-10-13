export const OFFICIAL_LEAN_LINUX_ARCHIVE = Object.freeze({
  version: '4.34.1',
  url: 'https://github.com/leanprover/lean4/releases/download/v4.34.1/lean-4.34.1-linux.tar.zst',
  sha256: '47bf4bbd78f70c2e9670598ab7124d92b6efb7330ff33e5fbb4030f6fd72e4e4',
  provenance: 'Official leanprover/lean4 v4.34.1 release asset digest, independently read on 2026-10-13.',
});

export function requirePinnedKernelEnvironment(actual, expected) {
  for (const key of ['leanCommit', 'runtimeLibrarySha256', 'mathlibCommit', 'mathlibLakeManifestSha256']) {
    if (actual[key] !== expected[key]) throw new Error(`PIN_MISMATCH:${key}: expected ${expected[key]}, received ${actual[key]}`);
  }
  if (!actual.leanVersion.includes('version 4.34.1,') || !actual.leanVersion.includes('x86_64-unknown-linux-gnu')) throw new Error('PIN_MISMATCH:leanVersion');
}

export function requirePinnedDependencyManifest(rootManifest, mathlibManifest, mathlibCommit) {
  const packages = new Map(rootManifest.packages.map(item => [item.name, item]));
  if (packages.get('mathlib')?.rev !== mathlibCommit) throw new Error('PIN_MISMATCH:root mathlib lock');
  const allowedNames = new Set(['mathlib', ...mathlibManifest.packages.map(item => item.name)]);
  for (const item of rootManifest.packages) if (!allowedNames.has(item.name)) throw new Error(`UNEXPECTED_DEPENDENCY:${item.name}`);
  for (const expected of mathlibManifest.packages) {
    const actual = packages.get(expected.name);
    if (!actual || actual.rev !== expected.rev || actual.url !== expected.url) throw new Error(`TRANSITIVE_PIN_MISMATCH:${expected.name}`);
  }
}

export function auditExactTargetLog(log, bundle) {
  const normalize = text => String(text).replace(/\s+/g, ' ').trim();
  if (!normalize(log).includes(normalize(bundle.audit.targetType))) throw new Error(`TARGET_TYPE_MISMATCH:${bundle.audit.target}`);
  const escaped = bundle.audit.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = log.match(new RegExp(`'${escaped}' (?:does not depend on any axioms|depends on axioms:\\s*\\[([^\\]]*)\\])`));
  if (!match) throw new Error(`AXIOM_AUDIT_MISSING:${bundle.audit.target}`);
  const axioms = match[1] ? match[1].split(',').map(value => value.trim()).filter(Boolean).sort() : [];
  const expected = [...bundle.audit.axioms.all].sort();
  if (JSON.stringify(axioms) !== JSON.stringify(expected)) throw new Error(`AXIOM_AUDIT_MISMATCH:${bundle.audit.target}`);
  if (axioms.some(name => /(?:^|\.)sorryAx$/.test(name)) || /declaration uses.*sorry|warning:.*sorry/i.test(log)) throw new Error('SORRY_REJECTED');
  return { claimId: bundle.jobSpec.claimId, target: bundle.audit.target, targetType: bundle.audit.targetType, axioms, grade: bundle.jobSpec.requestedGrade, assumptions: bundle.jobSpec.assumptions, scope: bundle.scope };
}

export function intendedNegativeControl(name, exitCode, log) {
  if (exitCode === 0 || exitCode === null || /object file .*does not exist|unknown module prefix/.test(log)) return false;
  if (name === 'NegativeFalse') return /Tactic `rfl` failed/.test(log) && /0 = 1/.test(log);
  if (name === 'NegativeMatrix') return /decide/.test(log) && /false/.test(log);
  return false;
}
