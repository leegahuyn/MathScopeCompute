import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoArg, outputArg] = process.argv.slice(2);
if (!repoArg || !outputArg) {
  throw Error('Usage: node verify_criterion_registration.mjs REVIEWED_REPO OUTPUT');
}
const repo = resolve(repoArg);
const prefixes = ['goal-20261111', 'goal-next'].map(day => 'tools/mathscope-cd-axial-bridge-20261029/' + day + '/m4/candidates/');
const evaluator = await import(pathToFileURL(
  resolve(repo, 'research-ide/mathscope-m4/acceptance.mjs'),
).href);
const artifact = path => readFile(resolve(repo, path));
const filenames = (await Promise.all(prefixes.map(async prefix => (await readdir(resolve(repo, prefix))).map(name => prefix + name)))).flat().sort();
assert.equal(new Set(filenames.map(path => path.split("/").at(-1))).size, filenames.length);

const receipts = [];
const controls = [];
for (const filename of filenames) {
  const candidate = JSON.parse(await artifact(filename));
  const checked = await evaluator.verifyCriterionEvidence(candidate, artifact);
  assert.equal(checked.verified, true, JSON.stringify(checked));
  assert.equal(checked.code, 'CRITERION_ACCEPTED');
  assert.equal(evaluator.isVerifiedM4CriterionReceipt(checked.receipt), true);
  receipts.push(checked.receipt);

  const changedPath = candidate.artifacts[0].path;
  const changed = await evaluator.verifyCriterionEvidence(candidate, async path => {
    const bytes = await artifact(path);
    return path === changedPath ? Buffer.concat([bytes, Buffer.from(' ')]) : bytes;
  });
  assert.equal(changed.verified, false);
  assert.equal(changed.code, 'CRITERION_ARTIFACT_HASH_MISMATCH');
  controls.push({ criterionId: candidate.criterionId, changedPath, outcome: changed.code });

  const changedCandidate = structuredClone(candidate);
  changedCandidate.verifiedScope += ' amended';
  const unreviewed = await evaluator.verifyCriterionEvidence(changedCandidate, artifact);
  assert.equal(unreviewed.verified, false);
  assert.equal(unreviewed.code, 'CRITERION_REVIEW_REQUIRED');
  controls.push({ criterionId: candidate.criterionId, outcome: unreviewed.code });
}

const assessment = await evaluator.assessM4Acceptance({ criterionReceipts: receipts });
assert.equal(assessment.newlyAcceptedCriteriaInThisAudit, filenames.length);
assert.equal(assessment.originalCriteriaEnumerated, 16);
assert.equal(assessment.canFreeze, false);
assert.equal(assessment.publicationConfirmed, false);
const fromJSON = JSON.parse(JSON.stringify(receipts));
const forged = await evaluator.assessM4Acceptance({ criterionReceipts: fromJSON });
assert.equal(forged.newlyAcceptedCriteriaInThisAudit, 0);
assert.equal(forged.rejectedSerializedCriterionReceipts, filenames.length);
const report = {
  schema: 'MathScope.M4.ReviewedCriterionReadback/1',
  accepted: receipts.map(({ criterionId, digest }) => ({ criterionId, digest })),
  checks: controls,
  rejectedSerializedReceipts: forged.rejectedSerializedCriterionReceipts,
  newlyAcceptedCriteriaInThisAudit: assessment.newlyAcceptedCriteriaInThisAudit,
  originalCriteriaEnumerated: assessment.originalCriteriaEnumerated,
  canFreeze: assessment.canFreeze,
  publicationConfirmed: assessment.publicationConfirmed,
  verdict: 'PASS_ACTUAL_REVIEWED_REGISTRATION_READBACK',
};
await writeFile(outputArg, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report));
