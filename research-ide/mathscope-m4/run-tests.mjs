import { spawnSync, execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../../', import.meta.url));
const evidenceUrl = new URL('evidence/', import.meta.url);
await mkdir(evidenceUrl, { recursive: true });
const attemptIndex = process.argv.indexOf('--attempt');
const attempt = attemptIndex >= 0 ? process.argv[attemptIndex + 1] : '2';
if (!/^[1-9][0-9]?$/.test(attempt)) throw new Error('--attempt must be an integer from 1 to 99.');
const receiptPath = `test-attempt${attempt}-20261013.json`;
let exists = false;
try { await readFile(new URL(receiptPath, evidenceUrl)); exists = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (exists) throw new Error('This attempt is already recorded. Preserve it and choose a new --attempt number.');
const startedAt = new Date().toISOString();
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const args = ['--test', '--test-reporter=tap', '--test-concurrency=1', 'research-ide/mathscope-m4/tests/acceptance.test.mjs', 'research-ide/mathscope-m4/tests/pinned-kernel-contract.test.mjs'];
const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
const log = `${result.stdout || ''}${result.stderr || ''}`;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const logPath = `test-attempt${attempt}-20261013.tap`;
await writeFile(new URL(logPath, evidenceUrl), log);
const sourceDigests = [];
for (const path of ['criteria.mjs', 'acceptance.mjs', 'tests/acceptance.test.mjs', 'tests/pinned-kernel-contract.test.mjs', 'tools/pinned-kernel-contract.mjs', 'tools/pinned-kernel-replay.mjs', 'run-tests.mjs']) {
  const bytes = await readFile(new URL(path, import.meta.url));
  sourceDigests.push({ path: `research-ide/mathscope-m4/${path}`, sha256: sha(bytes), bytes: bytes.length });
}
const counts = Object.fromEntries(['tests', 'suites', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map(name => [name, Number(log.match(new RegExp(`# ${name} (\\d+)`))?.[1] ?? NaN)]));
const receipt = { schemaVersion: 'mathscope.m4.test-execution/1', startedAt, finishedAt: new Date().toISOString(), sourceCommit, nodeVersion: process.version, args,
  budget: { timeoutMilliseconds: 120000, maxOutputBytes: 4 * 1024 * 1024 },
  exitCode: result.status, signal: result.signal, errorCode: result.error?.code || null,
  counts, sourceDigests, logPath, logSha256: sha(Buffer.from(log)),
  proves: 'M4 software trust-boundary guard tests only; no whole M3/M4 mathematical acceptance or deployment.',
};
await writeFile(new URL(receiptPath, evidenceUrl), `${JSON.stringify(receipt, null, 2)}\n`);
process.stdout.write(log);
process.exitCode = result.status ?? 1;
