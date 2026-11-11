import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../../..');
const [criterionId, evidenceDir, scope, sourceCommit, runId] = process.argv.slice(2);
assert(criterionId && evidenceDir && scope && /^[a-f0-9]{40}$/.test(sourceCommit));
const fromRepo = path => import(pathToFileURL(resolve(repo, path)).href);
const { M4_CRITERIA } = await fromRepo('research-ide/mathscope-m4/criteria.mjs');
const { proofSha256 } = await fromRepo('research-ide/mathscope-m0/proof.mjs');
const criterion = M4_CRITERIA.find(row => row.id === criterionId);
assert(criterion);
const artifacts = [];
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await collect(path);
    else {
      const sha256 = createHash('sha256').update(await readFile(path)).digest('hex');
      artifacts.push({ path: relative(repo, path).replaceAll('\\', '/'), sha256 });
    }
  }
}
await collect(join(here, evidenceDir));
assert(artifacts.length && artifacts.length <= 256);
artifacts.sort((a,b) => a.path.localeCompare(b.path, 'en'));
const execution = runId ? { provider: 'GitHub Actions', runId, headSha: sourceCommit } : {
  provider: 'Independent native Worker replay',
  fixture: 'Pinned original release-lab runtime with actual installed engines'
};
const candidate = {
  schemaVersion: 'mathscope.m4.criterion-evidence/1',
  criterionId, sourceCommit, originalBlueprintPage: criterion.page,
  requiredChecks: criterion.checks,
  verifiedScope: scope, execution, artifacts,
};
const candidatePath = join(here, 'candidates', criterionId + '.json');
await writeFile(candidatePath, JSON.stringify(candidate, null, 2) + '\n', { flag: 'wx' });
console.log(criterionId, await proofSha256(candidate), artifacts.length);
