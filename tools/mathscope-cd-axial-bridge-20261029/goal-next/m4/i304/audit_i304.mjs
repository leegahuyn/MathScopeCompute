import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(process.argv[2] || resolve(here, 'source'));
const artifact = name => readFile(resolve(here, name));
const m4 = 'research-ide/mathscope-m4/';
const read = path => readFile(resolve(repo, path));
const load = path => import(pathToFileURL(resolve(repo, path)));
const { CORE_RUN, verifyCoreKernelReplay, verifyHostedKernelReplay } =
  await load(m4 + 'kernel-evidence.mjs');
const { buildM4ComparisonView } = await load(m4 + 'comparison-claims.mjs');
const { M4_CRITERIA } = await load(m4 + 'criteria.mjs');
const { checkTheoremAdapter } = await load('research-ide/mathscope-m1/core/theorem-adapters.mjs');
const pinnedGitHub = JSON.parse(await artifact('github-readback.json'));
const mainAudit = JSON.parse(await artifact('audit-kernel-evidence.json'));
const browser = JSON.parse(await artifact('browser-receipt.json'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

assert.equal(pinnedGitHub.archiveSha256, sha(await artifact('github-run-42996997312.zip')));
const original = M4_CRITERIA.find(row => row.id === 'I3-04');
assert.equal(original.page, 20);
assert.deepEqual(original.checks, ['REFERENCE_IMPORT_DISTINCTION', 'EXPORTED_TARGET_ADAPTER_AND_TYPE']);
const blueprint = JSON.parse(await read(m4 + 'recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json'));
const originalRow = blueprint.rows.find(row => row.id === 'I3-04');
assert.equal(blueprint.originalSource.page_count, 99);
assert.equal(originalRow.source_page, original.page);
assert.equal(originalRow.original_acceptance,
  '프리즘 비교·trace formula·BSD의 알려진 경우·NS 원문 정리를 인용 레벨과 실제 Lean import 레벨로 구분한다. 합격: 문헌 링크만 연결된 결과는 THEOREM REFERENCE이며, 정확한 exported Lean theorem을 import한 경우에만 kernel 결과와 연결된다.');
const authenticated = await verifyCoreKernelReplay();
assert.equal(authenticated.verified, true, authenticated.status);
const rows = buildM4ComparisonView(authenticated);
assert.equal(mainAudit.verified, true);
assert.deepEqual(rows, mainAudit.comparisonClaims);
assert.equal(mainAudit.grantsM4FinalAcceptance, false);
assert.equal(mainAudit.publicationConfirmed, false);
const [prism, trace, bsd, ns, adapter] = rows;
const exactReferences = [
  ['M4.REFERENCE.PRISM', 'S01', 'people.mpim-bonn.mpg.de', 'Theorem 1.8(1)'],
  ['M4.REFERENCE.TRACE_FORMULA', 'S07', 'www.numdam.org', '(1.5.1)–(1.5.4)'],
  ['M4.REFERENCE.BSD_KNOWN_CASES', 'BSD-GZK-ANALYTIC-RANK-LE1', 'archive.mpim-bonn.mpg.de', 'Theorem 1'],
  ['M4.REFERENCE.NS_ORIGINAL', 'NS-PAPER', 'cdn.openai.com', 'Theorem 1.1'],
];
const controls = [];
for (const [index, row] of [prism, trace, bsd, ns].entries()) {
  const [id, ref, domain, locator] = exactReferences[index];
  assert.equal(row.id, id);
  assert.equal(row.classification, 'THEOREM REFERENCE');
  assert.equal(row.kernel, null);
  assert.equal(row.reference.referenceId, ref);
  assert.equal(new URL(row.reference.url).hostname, domain);
  assert.ok(row.reference.locator.includes(locator));
  assert.equal(browser.views[0].links[index], row.reference.url);
  for (const forged of [{ kernelVerified: true }, { formalPass: true }, {
    leanImport: { target: adapter.kernel.target, targetType: adapter.kernel.targetType },
  }]) {
    const rejected = checkTheoremAdapter({ role: 'THEOREM_REFERENCE', referenceId: ref, ...forged });
    assert.equal(rejected.ok, false);
    assert.equal(rejected.formalPass, false);
    controls.push({ referenceId: ref, forged: Object.keys(forged)[0], rejected: true });
  }
}

assert.equal(adapter.id, 'M4.ADAPTER.UNIFORM_CONTINUITY');
assert.equal(adapter.classification, 'EXPORTED LEAN TARGET');
assert.equal(adapter.reference, null);
assert.equal(adapter.kernel.grade, 'CONDITIONAL_FORMAL');
assert.equal(adapter.kernel.currentKernelExecuted, false);
assert.equal(adapter.kernel.target, 'MathScope.M4.Comparison.uniform_continuity_adapter');
assert.equal(adapter.kernel.upstreamTarget, 'MathScope.M4.Analytic.uniform_limit_uniformly_continuous');
assert.deepEqual(adapter.kernel.axioms, []);
assert.equal(pinnedGitHub.conclusion, 'success');
assert.equal(pinnedGitHub.targets.length, 2);
for (const [name, exactType] of [
  [adapter.kernel.target, adapter.kernel.targetType],
  [adapter.kernel.upstreamTarget, adapter.kernel.upstreamTargetType],
]) {
  const compiled = pinnedGitHub.targets.find(row => row.target === name);
  assert.equal(compiled.targetType, exactType);
  assert.deepEqual(compiled.axioms, []);
  assert.equal(compiled.sourceSha256, sha(await read(compiled.sourcePath)));
}
assert.deepEqual(browser.views[0].types, [adapter.kernel.targetType, adapter.kernel.upstreamTargetType]);
assert.deepEqual(browser.views[1].types, browser.views[0].types);

function reject(reason, evidence) {
  const view = buildM4ComparisonView(evidence);
  assert.deepEqual(view.slice(0, 4), rows.slice(0, 4));
  assert.equal(view.at(-1).classification, 'KERNEL EVIDENCE REQUIRED');
  assert.equal(view.at(-1).kernel, null);
  controls.push({ reason, rejected: true });
}
reject('REFERENCE_LINKS_ONLY', undefined);
reject('SERIALIZED_VERIFIED_READBACK', structuredClone(authenticated));
reject('OTHER_AUTHENTIC_RUN_WITH_UNRELATED_TARGETS', await verifyHostedKernelReplay('38394604031'));
const logPath = CORE_RUN.directory + '/compile-MathScope-M4-Comparison.log';
for (const [reason, mutate] of [
  ['EXPORTED_TARGET_NAME_CHANGED', source => source.replace('uniform_continuity_adapter', 'uniform_continuity_adapteR')],
  ['EXPORTED_TARGET_TYPE_CHANGED', source => source.replace('PrecisionMetric X', 'PrecisionMetric Y')],
  ['USER_AXIOM_INSERTED', source => source.replace('does not depend on any axioms', 'depends on axioms: [forged]')],
]) {
  const readback = await verifyCoreKernelReplay({ readArtifact: async path => {
    const bytes = await read(path);
    if (path !== logPath) return bytes;
    const changed = mutate(bytes.toString());
    assert.notEqual(changed, bytes.toString());
    return Buffer.from(changed);
  } });
  assert.match(readback.status, /^ARTIFACT_HASH_MISMATCH/);
  reject(reason, readback);
}
const changedSource = await verifyCoreKernelReplay({ readCurrentSource: async path => {
  const source = await read(path);
  return path.endsWith('/Comparison.lean') ? Buffer.concat([source, Buffer.from(' ')]) : source;
} });
assert.match(changedSource.status, /^CURRENT_SOURCE_STALE/);
reject('CURRENT_COMPARISON_SOURCE_CHANGED', changedSource);
assert.deepEqual(buildM4ComparisonView(await verifyCoreKernelReplay()), rows);

const report = {
  schema: 'MathScope.M4.I304.AcceptanceReadback/1',
  criterionId: original.id,
  originalBlueprintPage: original.page,
  originalCriterionText: originalRow.original_acceptance,
  originalBlueprintSha256: blueprint.originalSource.sha256,
  requiredChecks: original.checks,
  checks: Object.fromEntries(original.checks.map(check => [check, 'PASS'])),
  references: rows.slice(0, 4),
  exportedAdapter: adapter,
  githubCompilerRunId: String(pinnedGitHub.runId),
  githubCompilerSourceCommit: pinnedGitHub.sourceCommit,
  sourceBaselineCommit: JSON.parse(await artifact('source-pin.json')).sourceCommit,
  negativeControls: controls,
  browserViews: browser.views.map(({ viewport, forgedImportRejected }) => ({ viewport, forgedImportRejected })),
  currentKernelExecuted: false,
  publicationConfirmed: false,
  verdict: 'PASS_EXACT_REFERENCE_IMPORT_AND_EXPORTED_TARGET_CLASSIFICATION',
};
await writeFile(resolve(here, 'I3-04_RECEIPT.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ verdict: report.verdict, checks: report.checks,
  negativeControls: controls.length, browserViews: report.browserViews }, null, 2));
