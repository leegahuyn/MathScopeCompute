import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { readCatalog, verifyFixture } from '../release-lab/verify-fixtures.mjs';
import { proofSha256 } from '../../mathscope-m0/proof.mjs';
import { inspectStoredObservation } from './inspect-evidence.mjs';

const root = new URL('../../../', import.meta.url);
const read = path => readFile(new URL(path, root));
const directory = new URL('evidence/observations/', import.meta.url);
await mkdir(directory, { recursive: false });
const baseline = JSON.parse(await readFile(new URL('CAPTURED_BASELINE.json', import.meta.url), 'utf8'));
const catalog = await readCatalog();
const rows = [];
for (const id of ['taylor-green', 'prism', 'delta']) {
  const fixture = catalog.fixtures.find(item => item.id === id);
  const before = await proofSha256((await read(fixture.source.repoPath)).toString('utf8'));
  const executed = await verifyFixture(fixture);
  const after = await proofSha256((await read(fixture.source.repoPath)).toString('utf8'));
  if (!executed.pass || before !== after) throw new Error('FRESH_FIXTURE_OR_SOURCE_CONTINUITY_FAILED:' + id);
  const record = {
    schema: 'MathScope.M4.InspectableObservation/1', claimId: fixture.claimId,
    jobId: `fresh-fixture:${executed.startedAt}:${id}`, inputHash: executed.inputHash,
    result: executed.observation, resultHash: await proofSha256(executed.observation),
    source: { path: fixture.source.repoPath, commit: baseline.sourceCommit, sha256: before },
    document: { sha256: 'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac', page: fixture.source.page },
    formula: fixture.formula, assumptionIds: [],
    scope: `Fresh ${id} fixture; source catalogue limitations apply. This is not the actual whole-K native field or a new kernel theorem.`,
    originalCoordinates: null, error: null, kernelPass: false, originalCriterionAccepted: false,
  };
  const inspection = await inspectStoredObservation(record, [], read);
  const output = { schema: 'MathScope.M4.FreshObservationTrace/1', fixtureId: id, execution: executed, record, inspection,
    currentKernelExecuted: false, currentBrowserInspected: false, originalM4CriterionAccepted: false };
  const text = JSON.stringify(output, null, 2) + '\n';
  await writeFile(new URL(id + '.json', directory), text, { flag: 'wx' });
  rows.push({ id, path: `research-ide/mathscope-m4/recovery-20261019/evidence/observations/${id}.json`, sha256: await proofSha256(text), bytes: new TextEncoder().encode(text).byteLength, pass: executed.pass });
  await writeFile(new URL('manifest.json', directory), JSON.stringify({ schema: 'MathScope.M4.ObservationCapture/1', rows, complete: rows.length === 3, sourceCommit: baseline.sourceCommit, actualBrowserInspection: false, grantsM4FinalAcceptance: false }, null, 2) + '\n');
  process.stdout.write(JSON.stringify(rows.at(-1)) + '\n');
}
