import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { getShippedProofBundle, listShippedProofs } from '../mathscope-m0/proof.mjs';
import { verifyPinnedKernelArtifacts, assessM4Acceptance, buildM4ChecklistView, exportM4Assessment } from './acceptance.mjs';

const startedAt = new Date().toISOString();
const rootUrl = new URL('../../', import.meta.url);
const root = fileURLToPath(rootUrl);
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const outIndex = process.argv.indexOf('--out');
const output = outIndex >= 0 ? process.argv[outIndex + 1] : null;
if (outIndex >= 0 && !output) throw new Error('--out requires a repository-relative output path.');
if (output && (!output.startsWith('research-ide/mathscope-m4/evidence/') || output.includes('..') || output.includes('\\'))) throw new Error('Output must stay in the owned M4 evidence directory.');
const artifactCache = new Map();
const readArtifact = path => {
  if (!artifactCache.has(path)) artifactCache.set(path, execFileSync('git', ['show', `${sourceCommit}:${path}`], { cwd: root, maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }));
  return artifactCache.get(path);
};
const kernelReceipts = [];
const kernelAudits = [];
let artifactFailure = false;
for (const item of listShippedProofs()) {
  const bundle = getShippedProofBundle(item.id);
  const result = await verifyPinnedKernelArtifacts(bundle.jobSpec, bundle, readArtifact);
  kernelAudits.push({ id: item.id, ...result });
  if (result.verified) kernelReceipts.push(result.receipt); else artifactFailure = true;
}
const report = await assessM4Acceptance({ kernelReceipts });
const workingTreeArtifactDifferences = [];
for (const [path, committedBytes] of artifactCache) {
  try {
    const workingBytes = await readFile(new URL(path, rootUrl));
    if (!workingBytes.equals(committedBytes)) workingTreeArtifactDifferences.push({ path, gitBlobSha256: createHash('sha256').update(committedBytes).digest('hex'), workingTreeSha256: createHash('sha256').update(workingBytes).digest('hex'), gitBytes: committedBytes.length, workingBytes: workingBytes.length, workingHasCRLF: workingBytes.includes(Buffer.from('\r\n')) });
  } catch (error) { workingTreeArtifactDifferences.push({ path, workingTreeReadError: error.message }); }
}
const sourceFiles = ['criteria.mjs', 'acceptance.mjs', 'audit-m4.mjs', 'tests/acceptance.test.mjs'];
const implementationDigests = [];
for (const path of sourceFiles) {
  const bytes = await readFile(new URL(path, import.meta.url));
  implementationDigests.push({ path: `research-ide/mathscope-m4/${path}`, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
}
const receipt = {
  schemaVersion: 'mathscope.m4.audit-execution/1', startedAt, finishedAt: new Date().toISOString(),
  sourceCommit, nodeVersion: process.version, platform: process.platform,
  artifactSource: 'EXACT_GIT_BLOBS_AT_FIXED_COMMIT', workingTreeArtifactDifferences,
  command: 'node research-ide/mathscope-m4/audit-m4.mjs --out research-ide/mathscope-m4/evidence/pinned-artifact-audit-20261013.json',
  exitCode: artifactFailure ? 1 : 0, actualNewLeanExecution: false,
  actualOriginalM4CriterionExecution: false,
  implementationDigests, kernelAudits,
  assessment: exportM4Assessment(report), checklistView: buildM4ChecklistView(report),
  outcomeMeaning: 'Exit 0 means only that the five inherited M0 audited target scopes match their pinned raw artifacts. Original M4 I3/R1 final acceptance and publication remain UNCONFIRMED.',
};
if (output) {
  const outputUrl = new URL(output, rootUrl);
  await mkdir(new URL('.', outputUrl), { recursive: true });
  await writeFile(outputUrl, `${JSON.stringify(receipt, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify({ sourceCommit, inheritedKernelScopesChecked: kernelAudits.length, artifactAuditFailures: kernelAudits.filter(a => !a.verified).map(a => ({ id: a.id, code: a.code, reason: a.reason })), originalM4CriteriaEnumerated: report.originalCriteriaEnumerated, historicalM4FinalAcceptance: report.historicalM4FinalAcceptance, newlyAcceptedCriteriaInThisAudit: report.newlyAcceptedCriteriaInThisAudit, currentKernelExecuted: false, canFreeze: report.canFreeze, exitCode: receipt.exitCode, output }, null, 2)}\n`);
process.exitCode = receipt.exitCode;
