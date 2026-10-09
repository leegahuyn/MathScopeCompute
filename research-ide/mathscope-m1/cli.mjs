#!/usr/bin/env node
/** Independent Node entry point for the existing, statically bundled M1 engine.
 * This file supplies a Worker transport and artifact I/O, no mathematics.
 */
import { Worker as NodeWorker } from 'node:worker_threads';
import { mkdir, writeFile, stat, readFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { listExamples } from './core/registry.mjs';
import { createM1Engine } from './core/engine.mjs';

const CLI_VERSION = '1.0.0';
const WORKER_LIMITS = Object.freeze({ maxOldGenerationSizeMb: 512, maxYoungGenerationSizeMb: 64 });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const help = `MathScope M0/M1 source CLI (Node.js 24+)

  node mathscope-m1/cli.mjs list
  node mathscope-m1/cli.mjs list --json
  node mathscope-m1/cli.mjs run prime-1000 --out ./runs/prime-1000
  node mathscope-m1/cli.mjs run p1-p3

list reads the actual installed example registry. run executes an unchanged
example request in a bounded Node Worker through createM1Engine. The output
directory must be new. Without --out, a timestamped directory under ./m1-output
is used. SIGINT cancels the Worker; a terminal checkpoint/bundle can still save.

Saved files: request.json, environment.json, result.json, replay-bundle.json,
summary.json, files-manifest.json. Exported JSON does not carry live proof or
execution authority. The CLI does not open or modify a MathScope browser session.

Exit codes: 0 COMPLETED, 2 PARTIAL, 3 precision/resource limit, 4 UNSUPPORTED,
130 CANCELLED, 1 invalid input/runtime/I/O failure.
`;

function parse(args) {
  if (!args.length || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    if (args.length > 1) throw Error('Help accepts no additional arguments.');
    return { command: 'help' };
  }
  if (args[0] === 'list') {
    if (args.length > 2 || (args[1] && args[1] !== '--json')) throw Error('Use list [--json].');
    return { command: 'list', json: args[1] === '--json' };
  }
  if (args[0] !== 'run' || !args[1] || args[1].startsWith('-')) throw Error('Use run <example-id> [--out <new-directory>].');
  if (args.length !== 2 && !(args.length === 4 && ['--out', '-o'].includes(args[2]) && args[3])) {
    throw Error('Use run <example-id> [--out <new-directory>]. Arbitrary request code is not accepted.');
  }
  return { command: 'run', exampleId: args[1], output: args[3] };
}

function workerFactory(source) {
  // The source itself is the engine's pinned WORKER_SOURCE. No input is evaluated.
  const bridge = 'const {parentPort}=require("node:worker_threads");\n'
    + 'globalThis.crypto=require("node:crypto").webcrypto;\n'
    + 'globalThis.self={postMessage:data=>parentPort.postMessage(data)};\n'
    + source + '\nparentPort.on("message",data=>self.onmessage({data}));\n';
  const worker = new NodeWorker(bridge, { eval: true, resourceLimits: WORKER_LIMITS });
  let terminating = false;
  const adapter = {
    onmessage: null, onerror: null,
    postMessage: data => worker.postMessage(data),
    terminate: () => { terminating = true; return worker.terminate(); }
  };
  worker.on('message', data => adapter.onmessage?.({ data }));
  worker.on('error', error => adapter.onerror?.(error));
  worker.on('exit', code => {
    if (!terminating) adapter.onerror?.(Error(`Node Worker exited before its result (code ${code}).`));
  });
  return adapter;
}

async function ensureNewDirectory(path) {
  try { await stat(path); } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  throw Error(`Output already exists; select a new directory: ${path}`);
}

async function saveArtifacts(directory, example, job, environment, replayBundle) {
  await mkdir(dirname(directory), { recursive: true });
  await mkdir(directory); // Atomic refusal if a concurrent writer created it.
  const scope = job.result?.scope ?? job.result?.results?.scope ?? {
    finite: true,
    definition: 'Exactly the bounded recorded request; domain/model/observation details remain in result.json.',
    domain: job.result?.fieldSpec?.domain ?? job.result?.stateFamilySpec?.domain ?? null
  };
  const summary = {
    schema: 'MathScope.M1.CliRun/1', cliVersion: CLI_VERSION,
    example: { id: example.id, label: example.label, domain: example.domain },
    status: job.status, jobId: job.id, submittedAt: job.submittedAt, finishedAt: job.finishedAt,
    execution: { kind: 'NODE_WORKER_THREADS', nodeVersion: process.version, workerResourceLimits: WORKER_LIMITS },
    inputHash: job.inputHash, workerSha256: environment.workerSha256,
    environmentHash: job.environmentHash, resultHash: job.resultHash,
    mathematicalHash: job.mathematicalHash, bundleHash: replayBundle.bundleHash,
    scope, requestBudget: job.request.budget, checkpoint: job.checkpoint,
    interpretation: {
      finiteComputation: true, browserSessionModified: false, browserKernelRerun: false,
      exportedEvidenceTrusted: false,
      note: 'The bundle retains the original request and pinned engine source identity. Serialized results are historical data; import cannot issue formal authority.'
    }
  };
  const contents = {
    'request.json': job.request,
    'environment.json': environment,
    'result.json': job.result,
    'replay-bundle.json': replayBundle,
    'summary.json': summary
  };
  const files = [];
  for (const [name, content] of Object.entries(contents)) {
    const bytes = Buffer.from(json(content));
    await writeFile(join(directory, name), bytes, { flag: 'wx' });
    const saved = await readFile(join(directory, name));
    if (digest(saved) !== digest(bytes)) throw Error('Artifact write verification failed: ' + name);
    files.push({ path: name, bytes: bytes.length, sha256: digest(bytes) });
  }
  const manifest = { schema: 'MathScope.M1.CliFiles/1', hashAlgorithm: 'SHA-256', files,
    selfDigestExcluded: 'files-manifest.json cannot contain its own file digest.',
    mathematicalHashPolicy: replayBundle.semanticHashPolicy };
  await writeFile(join(directory, 'files-manifest.json'), json(manifest), { flag: 'wx' });
  return { ...summary, outputDirectory: directory, files: files.map(x => x.path).concat('files-manifest.json') };
}

function exitCode(status) {
  return ({ COMPLETED: 0, PARTIAL: 2, PRECISION_REQUIRED: 3, BUDGET_EXCEEDED: 3, UNSUPPORTED: 4, CANCELLED: 130 })[status] ?? 1;
}

async function main() {
  const options = parse(process.argv.slice(2));
  if (options.command === 'help') { process.stdout.write(help); return; }
  if (Number(process.versions.node.split('.')[0]) < 24) throw Error('Node.js 24 or later is required for this source package.');
  const examples = await listExamples();
  if (options.command === 'list') {
    if (options.json) process.stdout.write(json({ schema: 'MathScope.M1.CliExamples/1', exampleCount: examples.length, examples }));
    else process.stdout.write(examples.map(x => `${x.id}\t${x.domain}\t${x.label}`).join('\n') + `\n\n${examples.length} installed examples. Use run <example-id> --out <new-directory>.\n`);
    return;
  }
  const example = examples.find(x => x.id === options.exampleId);
  if (!example) throw Error(`Unknown example '${options.exampleId}'. Run list to see installed IDs.`);
  const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
  const directory = resolve(options.output ?? join('m1-output', `${example.id}-${stamp}`));
  await ensureNewDirectory(directory);
  const engine = createM1Engine({ workerFactory });
  let activeId = null, interrupted = false;
  const onInterrupt = () => { interrupted = true; if (activeId) engine.cancel(activeId); };
  process.on('SIGINT', onInterrupt);
  try {
    const submitted = await engine.submit(example.request);
    activeId = submitted.id;
    if (interrupted) engine.cancel(activeId);
    const job = await engine.wait(activeId);
    const environment = await engine.environment();
    const replayBundle = await engine.exportBundle(activeId);
    const summary = await saveArtifacts(directory, example, job, environment, replayBundle);
    // Large checkpoints are retained in the files, not repeated in the terminal.
    const { checkpoint, ...terminalSummary } = summary;
    process.stdout.write(json({ ...terminalSummary, checkpointRetained: checkpoint !== null }));
    process.exitCode = exitCode(job.status);
  } finally {
    process.removeListener('SIGINT', onInterrupt);
    engine.dispose();
  }
}

main().catch(error => {
  process.stderr.write(`MathScope CLI: ${error.message}\n`);
  process.exitCode = 1;
});
