import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { delimiter } from 'node:path';
import { getShippedProofBundle } from '../mathscope-m0/proof.mjs';

const leanIndex = process.argv.indexOf('--lean');
const executable = leanIndex >= 0 ? process.argv[leanIndex + 1] : null;
if (!executable) throw new Error('Supply --lean with a directly installed Lean executable; this runner never installs a toolchain.');
const attemptIndex = process.argv.indexOf('--attempt');
const attempt = attemptIndex >= 0 ? process.argv[attemptIndex + 1] : '1';
if (!/^[1-9][0-9]?$/.test(attempt)) throw new Error('--attempt must be an integer from 1 to 99.');
const standardImports = process.argv.includes('--standard-imports');
const startedAt = new Date().toISOString();
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
const replayUrl = new URL(`evidence/local-kernel-replay-20261013${attempt === '1' ? '' : `-attempt${attempt}`}/`, import.meta.url);
const replayRoot = fileURLToPath(replayUrl);
await mkdir(replayRoot, { recursive: true });
let previousReceipt = false;
try { await readFile(new URL('replay.json', replayUrl)); previousReceipt = true; }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (previousReceipt) throw new Error('This replay attempt already has a receipt. Preserve it and select a new --attempt number.');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const version = spawnSync(executable, ['--version'], { encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024 });
const versionText = `${version.stdout || ''}${version.stderr || ''}`.trim();
const executableSha256 = sha(await readFile(executable));
const actualLeanCommit = versionText.match(/commit ([0-9a-f]{40})/)?.[1] || null;
const pinnedEnvironment = getShippedProofBundle('m0-finite-d2').jobSpec.environment;
const sourcePaths = ['MathScope/M0/Defs.lean', 'MathScope/M0/Finite.lean', 'MathScope/M0/Analytic.lean', 'NegativeFalse.lean', 'NegativeMatrix.lean'];
const sourceDigests = [];
for (const path of sourcePaths) {
  const bytes = execFileSync('git', ['show', `${sourceCommit}:research-ide/mathscope-m0/lean/${path}`], { cwd: repoRoot, maxBuffer: 4 * 1024 * 1024 });
  const target = new URL(path, replayUrl);
  await mkdir(new URL('.', target), { recursive: true });
  await writeFile(target, bytes);
  sourceDigests.push({ path, sha256: sha(bytes), bytes: bytes.length });
}
const cases = [
  { name: 'Defs', source: 'MathScope/M0/Defs.lean', expected: 'SUCCESS', output: 'MathScope/M0/Defs.olean', targetTypes: [] },
  { name: 'Finite', source: 'MathScope/M0/Finite.lean', expected: 'SUCCESS', output: 'MathScope/M0/Finite.olean', targetTypes: ['MathScope.M0.Finite.matrix_product_zero', 'MathScope.M0.Finite.differential_squared_zero', 'MathScope.M0.Finite.integer_fixture'] },
  { name: 'Analytic', source: 'MathScope/M0/Analytic.lean', expected: 'SUCCESS', output: 'MathScope/M0/Analytic.olean', targetTypes: ['MathScope.M0.Analytic.gap_excludes_interval', 'MathScope.M0.Analytic.smaller_positive_gap', 'MathScope.M0.Analytic.gap_transfer'] },
  { name: 'NegativeFalse', source: 'NegativeFalse.lean', expected: 'REJECTION', output: null, targetTypes: ['rejected_zero_eq_one : (0 : Nat) = 1'] },
  { name: 'NegativeMatrix', source: 'NegativeMatrix.lean', expected: 'REJECTION', output: null, targetTypes: [] },
];
const executions = [];
for (const item of cases) {
  const caseStartedAt = new Date().toISOString();
  const start = performance.now();
  const args = ['--memory=512', '--threads=1', ...(standardImports ? [] : ['--trust=0']), ...(item.output ? ['-o', item.output] : []), item.source];
  const result = spawnSync(executable, args, {
    cwd: replayRoot, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, LEAN_PATH: [replayRoot, process.env.LEAN_PATH].filter(Boolean).join(delimiter) },
  });
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const logPath = `lean-${item.name.toLowerCase()}.log`;
  const log = `${stdout}${stderr}`;
  const intendedNegativeReasonObserved = item.name === 'NegativeFalse'
    ? result.status !== 0 && /Tactic `rfl` failed/.test(log) && /0 = 1/.test(log)
    : item.name === 'NegativeMatrix'
      ? result.status !== 0 && /decide/.test(log) && /false/.test(log) && !/object file .*does not exist|unknown module prefix/.test(log)
      : null;
  await writeFile(new URL(logPath, replayUrl), log);
  let outputArtifact = null;
  if (item.output && result.status === 0) {
    const bytes = await readFile(new URL(item.output, replayUrl));
    outputArtifact = { path: item.output, sha256: sha(bytes), bytes: bytes.length };
  }
  executions.push({
    name: item.name, source: item.source, sourceSha256: sourceDigests.find(s => s.path === item.source).sha256,
    expected: item.expected, args, startedAt: caseStartedAt, finishedAt: new Date().toISOString(), elapsedMilliseconds: Math.round(performance.now() - start),
    exitCode: result.status, signal: result.signal, errorCode: result.error?.code || null,
    actualOutcome: result.status === 0 ? 'SUCCESS' : result.error?.code === 'ETIMEDOUT' ? 'TIME_LIMIT' : 'REJECTION',
    expectedOutcomeObserved: item.expected === 'SUCCESS' ? result.status === 0 : intendedNegativeReasonObserved,
    intendedNegativeReasonObserved,
    targetTypes: item.targetTypes, logPath, logSha256: sha(Buffer.from(log)), outputArtifact,
    warningLines: log.split('\n').filter(line => /warning:/.test(line)),
    typeAndAxiomAuditEmitted: item.name === 'Finite' && result.status === 0 && /depends on axioms:/.test(log),
    log,
  });
}
const replay = {
  schemaVersion: 'mathscope.m4.local-kernel-execution/1', startedAt, finishedAt: new Date().toISOString(), sourceCommit,
  command: `node research-ide/mathscope-m4/replay-local-lean.mjs --lean <directly installed executable> --attempt ${attempt}${standardImports ? ' --standard-imports' : ''}`,
  runnerSha256: sha(await readFile(fileURLToPath(import.meta.url))),
  executableSha256, actualLeanVersion: versionText, actualLeanCommit,
  pinnedHistoricalLeanVersion: pinnedEnvironment.leanVersion, pinnedHistoricalLeanCommit: pinnedEnvironment.leanCommit,
  historicalToolchainMatched: actualLeanCommit === pinnedEnvironment.leanCommit,
  budget: { perCaseTimeoutMilliseconds: 30000, leanMemoryMiB: 512, threads: 1, importTrustLevel: standardImports ? 'OFFICIAL_LEAN_DEFAULT' : 0 },
  noDependencyInstallationAttempted: true, sourceDigests, executions,
  actualKernelExecuted: true,
  exactFiniteTargetReplaySucceeded: executions.find(e => e.name === 'Finite').exitCode === 0,
  exactConditionalAnalyticReplaySucceeded: executions.find(e => e.name === 'Analytic').exitCode === 0,
  falseRflRejected: executions.find(e => e.name === 'NegativeFalse').intendedNegativeReasonObserved,
  grantsM4FinalAcceptance: false,
  limitation: 'Actual fresh kernel results apply only to the saved exact source under the explicitly recorded local toolchain. A different toolchain is not the historical 4.34.1 run. Missing Mathlib or a failed analytic import is a failed replay, not conditional-analytic acceptance.',
};
await writeFile(new URL('replay.json', replayUrl), `${JSON.stringify(replay, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ actualLeanVersion: versionText, historicalToolchainMatched: replay.historicalToolchainMatched, executions: executions.map(e => ({ name: e.name, exitCode: e.exitCode, expectedOutcomeObserved: e.expectedOutcomeObserved, errorCode: e.errorCode })), exactFiniteTargetReplaySucceeded: replay.exactFiniteTargetReplaySucceeded, exactConditionalAnalyticReplaySucceeded: replay.exactConditionalAnalyticReplaySucceeded, falseRflRejected: replay.falseRflRejected, grantsM4FinalAcceptance: false }, null, 2)}\n`);
process.exitCode = executions.every(e => e.expectedOutcomeObserved) ? 0 : 1;
