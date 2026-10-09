#!/usr/bin/env node
/** English presentation only. Mathematical requests and the pinned CLI are unchanged. */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { listExamples } from '../mathscope-m1/core/registry.mjs';

const labels = JSON.parse(await readFile(new URL('../localization/examples-text.en.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2);
const help = `MathScope M0/M1 — English presentation (Node.js 24+)

  node tools/mathscope-en.mjs list
  node tools/mathscope-en.mjs list --json
  node tools/mathscope-en.mjs run prime-1000 --out ./runs/prime-1000

list provides English labels for the unchanged installed example registry.
run delegates to the original pinned CLI. Original requests, mathematical
hashes, output files, budgets, scope flags, and exit codes are preserved.
Stored historical labels and engine diagnostics can remain in Korean.

Exit codes: 0 COMPLETED; 2 PARTIAL; 3 precision/resource limit;
4 UNSUPPORTED; 130 CANCELLED; 1 invalid input, runtime, or I/O failure.
`;

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!args.length || ['help', '--help', '-h'].includes(args[0])) {
  if (args.length > 1) fail('Help accepts no additional arguments.');
  else process.stdout.write(help);
} else if (args[0] === 'list') {
  if (args.length > 2 || (args[1] && args[1] !== '--json')) {
    fail('Use list [--json].');
  } else {
    const original = await listExamples();
    const ids = original.map(x => x.id);
    if (ids.length !== Object.keys(labels).length || ids.some(id => !Object.hasOwn(labels, id))) {
      throw new Error('English catalog does not cover the exact installed registry. Rebuild the presentation catalog.');
    }
    const examples = original.map(x => ({
      id: x.id,
      domain: x.domain,
      label: labels[x.id],
      originalLabel: x.label,
      request: x.request,
      presentationRequestSha256: createHash('sha256').update(JSON.stringify(x.request)).digest('hex'),
    }));
    if (args[1] === '--json') {
      process.stdout.write(JSON.stringify({
        schema: 'MathScope.EnglishPresentationExamples/1',
        locale: 'en',
        exampleCount: examples.length,
        presentationOnly: true,
        requestsModified: false,
        requestDigestPolicy: 'SHA-256 of UTF-8 JSON.stringify(originalExample.request); a presentation identity check, not the engine inputHash.',
        examples,
      }, null, 2) + '\n');
    } else {
      process.stdout.write(`MathScope: ${examples.length} installed examples (English labels)\n\n`);
      for (const x of examples) process.stdout.write(`${x.id.padEnd(36)} ${x.domain.padEnd(11)} ${x.label}\n`);
    }
  }
} else if (args[0] === 'run') {
  const originalCli = fileURLToPath(new URL('../mathscope-m1/cli.mjs', import.meta.url));
  // Do not rewrite arguments or synthesize a request. The original parser validates them.
  const child = spawn(process.execPath, [originalCli, ...args], { stdio: 'inherit' });
  const forward = () => { if (!child.killed) child.kill('SIGINT'); };
  process.on('SIGINT', forward);
  child.on('error', error => { fail(`Unable to start the original CLI: ${error.message}`); });
  child.on('exit', (code, signal) => {
    process.removeListener('SIGINT', forward);
    if (code !== null) process.exitCode = code;
    else if (signal === 'SIGINT') process.exitCode = 130;
    else process.exitCode = 1;
  });
} else {
  fail('Use list [--json] or run <example-id> [--out <new-directory>].');
}
