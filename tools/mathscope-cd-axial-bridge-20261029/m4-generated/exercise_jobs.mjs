import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [mode, repository, directory] = process.argv.slice(2);
assert(['generate', 'check'].includes(mode) && repository && directory,
  'Usage: node exercise_jobs.mjs generate|check REPO OUT');
const repo = resolve(repository);
const root = resolve(directory);
const { createM4ProofJob, classifyM4ProofReuse, DEFAULT_M4_PROOF_INPUT } =
  await import(pathToFileURL(join(repo, 'research-ide/mathscope-m4/proof-jobs.mjs')).href);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const writeJSON = (path, data) => writeFile(path, JSON.stringify(data, null, 2) + '\n');

const changes = {
  group: { G: 'SU2' },
  delta: { delta: 'D2' },
  prime: { p: 3 },
  precision: { precision: 32 },
  coefficientField: { coefficientField: 'Fp' },
  coefficientFormula: { coefficientFormula: '[3,-3,5,7]' },
  coefficientValues: { coefficients: ['3', '-3', '5', '7'] },
  assumptions: { assumptions: [{ id: 'H.COMPLETE', statement: 'supplied completeness' }] },
};
const baseline = await createM4ProofJob();
const jobs = { baseline };
for (const [name, patch] of Object.entries(changes)) {
  jobs[name] = await createM4ProofJob({ ...DEFAULT_M4_PROOF_INPUT, ...patch });
}
assert.equal(new Set(Object.values(jobs).map(job => job.jobId)).size, 9);
assert.equal(new Set(Object.values(jobs).map(job => job.sources[0].sha256)).size, 9);
const changed = structuredClone(baseline);
changed.sources[0].content += ' ';
const entries = {
  ...Object.fromEntries(Object.entries(jobs).map(([name, job]) => [name, job.sources[0].content])),
  oneCharacter: changed.sources[0].content,
};

if (mode === 'generate') {
  await mkdir(root, { recursive: false });
  const manifest = {};
  for (const [name, source] of Object.entries(entries)) {
    const file = name + '.lean';
    manifest[name] = {
      file, sourceSHA256: sha(source),
      target: (jobs[name] ?? baseline).target,
      jobId: jobs[name]?.jobId ?? null,
    };
    if (jobs[name]) assert.equal(jobs[name].sources[0].sha256, manifest[name].sourceSHA256);
    await writeFile(join(root, file), source);
  }
  await writeJSON(join(root, 'generated.json'), { manifest, jobs });
} else {
  const compiled = JSON.parse(await readFile(join(root, 'compiler-receipt.json'), 'utf8'));
  assert.equal(compiled.leanCommit, '5045d0056413266e57c625dcd7c365b10e377c52');
  assert.equal(compiled.mathlibUsed, false);
  assert.deepEqual(Object.keys(compiled.cases), Object.keys(entries));
  for (const [name, source] of Object.entries(entries)) {
    const row = compiled.cases[name];
    assert.equal(await readFile(join(root, name + '.lean'), 'utf8'), source);
    assert.equal(row.sourceSHA256, sha(source));
    assert.equal(row.logSHA256, sha(await readFile(join(root, row.log))));
    assert.equal(row.exitCode, 0);
  }
  const previous = {
    ...baseline,
    status: 'PASS',
    kernelPass: true,
    observedCompilerCase: compiled.cases.baseline,
  };
  const rebound = {};
  for (const [name, job] of Object.entries(jobs)) {
    if (name === 'baseline') continue;
    const result = await classifyM4ProofReuse(job, previous);
    assert.deepEqual(result, { state: 'STALE_SOURCE_OR_PARAMETERS', kernelPass: false });
    rebound[name] = { jobId: job.jobId, target: job.target, result };
  }
  assert.equal(changed.sources[0].content.length, baseline.sources[0].content.length + 1);
  assert.notEqual(compiled.cases.oneCharacter.sourceSHA256, compiled.cases.baseline.sourceSHA256);
  assert.equal(compiled.cases.oneCharacter.targetType, compiled.cases.baseline.targetType);
  const oneCharacter = await classifyM4ProofReuse(changed, previous);
  const sameBytes = await classifyM4ProofReuse(baseline, previous);
  assert.deepEqual(oneCharacter, { state: 'INVALID_CURRENT_JOB', kernelPass: false });
  assert.deepEqual(sameBytes, { state: 'BINDING_MATCH_KERNEL_RECHECK_REQUIRED', kernelPass: false });
  await writeJSON(join(root, 'criterion-I3-05.json'), {
    sourceCommit: compiled.sourceCommit, githubRun: compiled.githubRun,
    compiledSources: Object.keys(entries).length, rebound, oneCharacter, sameBytes,
    scope: baseline.scope,
  });
  console.log('I3-05 freshly compiled jobs, eight stale reuses, one changed byte rejected');
}
