import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, resolve, relative, sep, dirname } from 'node:path';
import { getShippedProofBundle, listShippedProofs, assessProofEvidence } from '../../mathscope-m0/proof.mjs';
import { OFFICIAL_LEAN_LINUX_ARCHIVE, requirePinnedKernelEnvironment, requirePinnedDependencyManifest, auditExactTargetLog, intendedNegativeControl } from './pinned-kernel-contract.mjs';

const arg = name => { const index = process.argv.indexOf(name); return index < 0 ? null : process.argv[index + 1]; };
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const workDir = resolve(arg('--work-dir') || join(process.env.RUNNER_TEMP || repoRoot, 'mathscope-m4-pinned-replay'));
const outputRelative = arg('--out') || 'research-ide/mathscope-m4/evidence/hosted-pinned-kernel-replay';
const outputDir = resolve(repoRoot, outputRelative);
const allowedOutput = resolve(repoRoot, 'research-ide/mathscope-m4/evidence');
const remainingPath = relative(allowedOutput, outputDir);
if (!remainingPath || remainingPath.startsWith('..') || remainingPath.startsWith(sep)) throw new Error('--out must name a new directory inside research-ide/mathscope-m4/evidence.');
await mkdir(outputDir, { recursive: true });
if ((await readdir(outputDir)).length) throw new Error('Output directory is not empty; old receipts must be preserved.');
await mkdir(workDir, { recursive: true });
const startedAt = new Date().toISOString();
const start = performance.now();
const budget = {
  globalMilliseconds: 18 * 60 * 1000, installMilliseconds: 240000, updateMilliseconds: 300000, cacheMilliseconds: 480000, compileMilliseconds: 60000,
  leanMemoryMiB: 512, mathlibCompilationMemoryMiB: 1536, threads: 1,
  memoryAdjustment: {
    previousMathlibMiB: 512,
    failureRunId: '38369365124', failureSourceCommit: '620dca8fff0b9593fc38f6adc5495a1aecd81c35',
    failureArtifactId: '11798103131', failureArtifactSha256: '6658e7ea9a17690df0a3769c733df553283ba1ba5a298f1f0881d5ce887b9608',
    observedFailure: 'compile-analytic exit 134: lean::memory_exception, excessive memory consumption detected at interpreter; elapsed 13102 ms',
    reason: 'The actual pinned Mathlib import closure exceeded the 512 MiB Lean threshold. Only Analytic and its Conditional/Comparison dependants receive a bounded 1536 MiB threshold. Original source, pins, finite/negative budgets and all time limits are retained. The higher threshold does not imply proof success.',
  },
};
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
const bundles = listShippedProofs().map(item => getShippedProofBundle(item.id));
const expected = bundles[0].jobSpec.environment;
const receipt = { schemaVersion: 'mathscope.m4.pinned-clean-kernel-replay/1', startedAt, sourceCommit, nodeVersion: process.version, platform: process.platform, budget,
  expectedEnvironment: expected, officialArchive: OFFICIAL_LEAN_LINUX_ARCHIVE,
  actualEnvironment: {}, sources: [], executions: [], targets: [], negativeControls: [],
  cleanWorkDirectory: false, actualKernelExecuted: false, allPinnedTargetsVerified: false,
  grantsM4FinalAcceptance: false, publicationConfirmed: false, status: 'STARTED', exitCode: 1,
  limitation: 'This run checks five exact inherited M0 target scopes under their original pins. It cannot accept every original I3/R1 criterion or any global RH/BSD/YM/NS research conclusion.',
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function fileSha(path) { const hash = createHash('sha256'); for await (const bytes of createReadStream(path)) hash.update(bytes); return hash.digest('hex'); }
async function writeReceipt() { receipt.finishedAt = new Date().toISOString(); receipt.elapsedMilliseconds = Math.round(performance.now() - start); await writeFile(join(outputDir, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`); }
function fail(message) { throw new Error(message); }
async function run(name, command, args, { cwd = workDir, timeout = budget.compileMilliseconds, env = {}, requiredSuccess = true } = {}) {
  const remaining = budget.globalMilliseconds - (performance.now() - start);
  if (remaining <= 0) fail('GLOBAL_TIME_LIMIT');
  const caseStartedAt = new Date().toISOString();
  const caseStart = performance.now();
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: Math.max(1, Math.floor(Math.min(timeout, remaining))), maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, ...env, MATHLIB_NO_CACHE_ON_UPDATE: '1', MATHLIB_CACHE_DIR: join(workDir, 'mathlib-cache') } });
  const log = `${result.stdout || ''}${result.stderr || ''}`;
  const logPath = `${name}.log`;
  await writeFile(join(outputDir, logPath), log);
  const entry = { name, args, startedAt: caseStartedAt, finishedAt: new Date().toISOString(), elapsedMilliseconds: Math.round(performance.now() - caseStart), exitCode: result.status, signal: result.signal, errorCode: result.error?.code || null, logPath, logSha256: sha(Buffer.from(log)), warnings: log.split('\n').filter(line => /warning:/.test(line)) };
  receipt.executions.push(entry);
  await writeReceipt();
  if (requiredSuccess && result.status !== 0) fail(`${name}:${result.error?.code || `EXIT_${result.status}`}`);
  return { ...entry, log };
}

try {
  receipt.implementationDigests = [
    { path: 'research-ide/mathscope-m4/tools/pinned-kernel-replay.mjs', sha256: await fileSha(fileURLToPath(import.meta.url)) },
    { path: 'research-ide/mathscope-m4/tools/pinned-kernel-contract.mjs', sha256: await fileSha(fileURLToPath(new URL('pinned-kernel-contract.mjs', import.meta.url))) },
  ];
  for (const bundle of bundles) {
    const preflight = await assessProofEvidence(bundle.jobSpec, bundle);
    if (!preflight.verified) fail(`SHIPPED_M0_AUTHORITY_REJECTED:${bundle.id}:${preflight.status}`);
    requirePinnedKernelEnvironment(bundle.jobSpec.environment, expected);
  }
  if ((await readdir(workDir)).length) fail('CLEAN_WORK_DIRECTORY_REQUIRED');
  receipt.cleanWorkDirectory = true;
  if (process.platform !== 'linux' || process.arch !== 'x64') fail('OFFICIAL_PINNED_INSTALL_REQUIRES_LINUX_X64');
  if (!process.argv.includes('--install-official')) fail('EXPLICIT_OFFICIAL_INSTALL_FLAG_REQUIRED');
  const installation = join(workDir, 'installation');
  await mkdir(installation);
  const archive = join(installation, 'lean-4.34.1-linux.tar.zst');
  await run('download-official-lean', 'curl', ['--fail', '--location', '--retry', '2', '--max-time', '210', '--output', archive, OFFICIAL_LEAN_LINUX_ARCHIVE.url], { timeout: budget.installMilliseconds });
  receipt.archiveSha256 = await fileSha(archive);
  if (receipt.archiveSha256 !== OFFICIAL_LEAN_LINUX_ARCHIVE.sha256) fail('OFFICIAL_ARCHIVE_DIGEST_MISMATCH');
  await run('extract-official-lean', 'tar', ['--zstd', '-xf', archive, '-C', installation], { timeout: 120000 });
  const prefix = join(installation, 'lean-4.34.1-linux');
  const lean = join(prefix, 'bin', 'lean');
  const lake = join(prefix, 'bin', 'lake');
  const compilerEnvironment = { PATH: `${join(prefix, 'bin')}${sep === '\\' ? ';' : ':'}${process.env.PATH || ''}` };
  const version = await run('lean-version', lean, ['--version']);
  receipt.actualEnvironment.leanVersion = version.log.trim();
  receipt.actualEnvironment.leanCommit = version.log.match(/commit ([0-9a-f]{40})/)?.[1] || null;
  receipt.actualEnvironment.runtimeLibrarySha256 = await fileSha(join(prefix, 'lib', 'lean', 'libleanshared.so'));
  receipt.actualEnvironment.compilerExecutableSha256 = await fileSha(lean);
  const lakeVersion = await run('lake-version', lake, ['--version']);
  receipt.actualEnvironment.lakeVersion = lakeVersion.log.trim();
  receipt.actualEnvironment.lakeExecutableSha256 = await fileSha(lake);
  receipt.actualEnvironment.compilerFrontend = 'Official pinned Lean CLI; the historical embedded driver is not reused.';
  if (receipt.actualEnvironment.leanCommit !== expected.leanCommit || receipt.actualEnvironment.runtimeLibrarySha256 !== expected.runtimeLibrarySha256) fail('PINNED_LEAN_RUNTIME_MISMATCH');
  const project = join(workDir, 'project');
  await mkdir(project);
  const sources = new Map();
  for (const bundle of bundles) for (const file of bundle.jobSpec.sourceFiles) sources.set(file.path, { sha256: file.sha256, content: file.content });
  for (const control of bundles[0].audit.negativeControls) sources.set(control.sourceFile, { sha256: control.sourceSha256 });
  for (const [path, source] of sources) {
    const bytes = execFileSync('git', ['show', `${sourceCommit}:research-ide/mathscope-m0/lean/${path}`], { cwd: repoRoot, maxBuffer: 4 * 1024 * 1024 });
    if (sha(bytes) !== source.sha256 || (source.content !== undefined && bytes.toString() !== source.content)) fail(`SOURCE_PIN_MISMATCH:${path}`);
    if (source.content !== undefined && /\b(?:sorry|admit)\b/.test(source.content.replace(/\/\-[\s\S]*?\-\//g, '').replace(/--[^\n]*/g, ''))) fail(`SOURCE_SORRY_REJECTED:${path}`);
    await mkdir(dirname(join(project, path)), { recursive: true });
    await writeFile(join(project, path), bytes);
    await mkdir(dirname(join(outputDir, 'sources', path)), { recursive: true });
    await writeFile(join(outputDir, 'sources', path), bytes);
    receipt.sources.push({ path, sha256: source.sha256, bytes: bytes.length });
  }
  for (const path of ['lakefile.lean', 'lean-toolchain']) {
    const bytes = execFileSync('git', ['show', `${sourceCommit}:research-ide/mathscope-m0/lean/${path}`], { cwd: repoRoot, maxBuffer: 1024 * 1024 });
    await writeFile(join(project, path), bytes);
    await writeFile(join(outputDir, path), bytes);
    receipt.sources.push({ path, sha256: sha(bytes), bytes: bytes.length });
  }
  const rootLakefile = await readFile(join(project, 'lakefile.lean'), 'utf8');
  if (!rootLakefile.includes(`"${expected.mathlibCommit}"`) || (await readFile(join(project, 'lean-toolchain'), 'utf8')).trim() !== 'leanprover/lean4:v4.34.1') fail('SOURCE_LAKE_TOOLCHAIN_PIN_MISMATCH');
  await run('lake-update-pinned', lake, ['update'], { cwd: project, env: compilerEnvironment, timeout: budget.updateMilliseconds });
  const mathlib = join(project, '.lake', 'packages', 'mathlib');
  receipt.actualEnvironment.mathlibCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: mathlib, encoding: 'utf8' }).trim();
  const mathlibLock = await readFile(join(mathlib, 'lake-manifest.json'));
  receipt.actualEnvironment.mathlibLakeManifestSha256 = sha(mathlibLock);
  requirePinnedKernelEnvironment(receipt.actualEnvironment, expected);
  const rootLock = await readFile(join(project, 'lake-manifest.json'));
  receipt.actualEnvironment.projectLakeManifestSha256 = sha(rootLock);
  requirePinnedDependencyManifest(JSON.parse(rootLock), JSON.parse(mathlibLock), expected.mathlibCommit);
  await writeFile(join(outputDir, 'mathlib-lake-manifest.json'), mathlibLock);
  await writeFile(join(outputDir, 'project-lake-manifest.json'), rootLock);
  const mathlibImports = [...new Set([...sources.values()].flatMap(source => [...(source.content || '').matchAll(/^import\s+(Mathlib\.[A-Za-z0-9_.]+)\s*$/gm)].map(match => match[1])))];
  if (!mathlibImports.length) fail('EXACT_ANALYTIC_MATHLIB_IMPORT_REQUIRED');
  receipt.cacheRoots = mathlibImports;
  await run('mathlib-cache-exact-import-closure', lake, ['exe', 'cache', 'get', ...mathlibImports], { cwd: project, env: compilerEnvironment, timeout: budget.cacheMilliseconds });
  const modules = ['Defs', 'Finite', 'Analytic', 'Conditional', 'Comparison'];
  for (const name of modules) {
    const source = `MathScope/M0/${name}.lean`;
    const compiled = `.lake/build/lib/lean/MathScope/M0/${name}.olean`;
    await mkdir(dirname(join(project, compiled)), { recursive: true });
    const memoryMiB = ['Analytic', 'Conditional', 'Comparison'].includes(name) ? budget.mathlibCompilationMemoryMiB : budget.leanMemoryMiB;
    const result = await run(`compile-${name.toLowerCase()}`, lake, ['env', 'lean', `--memory=${memoryMiB}`, '--threads=1', '-o', compiled, source], { cwd: project, env: compilerEnvironment });
    receipt.actualKernelExecuted = true;
    if (result.warnings.length) fail(`COMPILER_WARNINGS:${name}`);
    const artifactPath = join('compiled', 'MathScope', 'M0', `${name}.olean`);
    await mkdir(dirname(join(outputDir, artifactPath)), { recursive: true });
    await copyFile(join(project, compiled), join(outputDir, artifactPath));
    result.compiledArtifact = { path: artifactPath.split(sep).join('/'), sha256: await fileSha(join(project, compiled)) };
    receipt.executions[receipt.executions.length - 1].compiledArtifact = result.compiledArtifact;
    receipt.executions[receipt.executions.length - 1].leanMemoryMiB = memoryMiB;
    for (const bundle of bundles.filter(item => item.audit.target.startsWith(`MathScope.M0.${name}.`))) receipt.targets.push(auditExactTargetLog(result.log, bundle));
    await writeReceipt();
  }
  for (const control of bundles[0].audit.negativeControls) {
    const result = await run(`negative-${control.name.toLowerCase()}`, lake, ['env', 'lean', '--memory=512', '--threads=1', control.sourceFile], { cwd: project, env: compilerEnvironment, requiredSuccess: false });
    const rejectedForExpectedReason = intendedNegativeControl(control.name, result.exitCode, result.log);
    receipt.negativeControls.push({ name: control.name, sourceSha256: control.sourceSha256, exitCode: result.exitCode, rejectedForExpectedReason, logPath: result.logPath, logSha256: result.logSha256 });
    if (!rejectedForExpectedReason) fail(`NEGATIVE_CONTROL_NOT_REJECTED_FOR_EXPECTED_REASON:${control.name}`);
  }
  receipt.allPinnedTargetsVerified = receipt.targets.length === bundles.length && receipt.negativeControls.length === 2;
  receipt.status = receipt.allPinnedTargetsVerified ? 'PINNED_FINITE_AND_CONDITIONAL_KERNEL_REPLAY_VERIFIED' : 'PINNED_REPLAY_INCOMPLETE';
  receipt.exitCode = receipt.allPinnedTargetsVerified ? 0 : 1;
} catch (error) {
  receipt.status = 'PINNED_REPLAY_FAILED_OR_BLOCKED';
  receipt.failure = { message: String(error.message), code: error.code || null };
  receipt.exitCode = 1;
} finally { await writeReceipt(); }
process.stdout.write(`${JSON.stringify({ status: receipt.status, exitCode: receipt.exitCode, sourceCommit, actualKernelExecuted: receipt.actualKernelExecuted, allPinnedTargetsVerified: receipt.allPinnedTargetsVerified, targetsVerified: receipt.targets.length, failure: receipt.failure || null, grantsM4FinalAcceptance: false, output: outputRelative }, null, 2)}\n`);
process.exitCode = receipt.exitCode;
