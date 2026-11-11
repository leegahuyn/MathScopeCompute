import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoArg, patchArg, output] = process.argv.slice(2);
assert(repoArg && patchArg && output, 'Usage: node verify_hold.mjs REPO PATCH_RECEIPT OUTPUT');
const repo = resolve(repoArg);
const root = 'tools/mathscope-cd-axial-bridge-20261029/';
const modulePath = 'research-ide/mathscope-m4/acceptance.mjs';
const evaluator = await import(pathToFileURL(resolve(repo, modulePath)));
const artifact = path => path.startsWith('research-ide/')
  ? execFileSync('git', ['-c', 'core.longpaths=true', '-C', repo, 'show', 'HEAD:' + path],
    {maxBuffer: 16 * 1024 * 1024})
  : readFile(resolve(repo, path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

const registered = [];
for (const checkpoint of ['goal-20261111', 'goal-next']) {
  const dir = root + checkpoint + '/m4/candidates/';
  for (const name of (await readdir(resolve(repo, dir))).sort()) {
    const candidate = JSON.parse(await artifact(dir + name));
    const result = await evaluator.verifyCriterionEvidence(candidate, artifact);
    assert.equal(result.code, 'CRITERION_ACCEPTED', name);
    assert.ok(evaluator.isVerifiedM4CriterionReceipt(result.receipt));
    registered.push(result.receipt);
  }
}
const status = JSON.parse(await artifact(root + 'goal-next/STATUS.json'));
assert.equal(new Set(registered.map(x => x.criterionId)).size, registered.length);
assert.deepEqual(registered.map(x => x.criterionId).sort(), [...status.M4.acceptedCriteria].sort());
assert.equal(status.release, 'HOLD');

const assessment = await evaluator.assessM4Acceptance({criterionReceipts: registered});
const view = evaluator.buildM4ChecklistView(assessment);
assert.equal(view.gate, 'HOLD');
assert.equal(assessment.currentM3CompletionVerified, false);
assert.equal(assessment.publicationConfirmed, false);
assert.equal(assessment.canFreeze, false);
assert.equal(assessment.allCurrentCriteriaVerified, false);
assert.equal(assessment.newlyAcceptedCriteriaInThisAudit, registered.length);
assert.equal(assessment.criteria.find(x => x.id === 'R1-08').state, 'FINAL_ACCEPTANCE_UNCONFIRMED');

const patchReceipt = await readFile(patchArg);
assert.equal(JSON.parse(patchReceipt).publicationConfirmed, false);
const r108 = {
  schemaVersion: 'mathscope.m4.criterion-evidence/1',
  criterionId: 'R1-08',
  artifacts: [{path: 'patch-rollback.json', sha256: sha(patchReceipt)}],
};
const localOnly = await evaluator.verifyCriterionEvidence(r108, async path => {
  assert.equal(path, 'patch-rollback.json');
  return patchReceipt;
});
assert.equal(localOnly.code, 'CRITERION_REVIEW_REQUIRED');

const forged = JSON.parse(JSON.stringify(registered));
forged.push({criterionId: 'R1-08', publicationConfirmed: true, status: 'PASS'});
const imported = await evaluator.assessM4Acceptance({
  criterionReceipts: [...registered, ...forged],
  m3CompletionEvidence: {accepted: 64, total: 64, verified: true, release: 'PUBLISHED'},
});
assert.equal(imported.newlyAcceptedCriteriaInThisAudit, registered.length);
assert.equal(imported.rejectedSerializedCriterionReceipts, forged.length);
assert.equal(imported.currentM3CompletionVerified, false);
assert.equal(imported.canFreeze, false);
assert.equal(imported.publicationConfirmed, false);
assert.equal(evaluator.buildM4ChecklistView(imported).gate, 'HOLD');
assert.throws(() => evaluator.buildM4ChecklistView(
  {...JSON.parse(JSON.stringify(assessment)), canFreeze: true, publicationConfirmed: true}
), /Reassess imported data/);

await writeFile(output, JSON.stringify({
  schema: 'MathScope.M4.R108.ReleaseDecisionReplay/1',
  evaluatorSHA256: sha(await readFile(resolve(repo, modulePath))),
  acceptedCriterionIds: registered.map(x => x.criterionId),
  openCriterionIds: assessment.criteria.filter(x => !x.receiptDigest).map(x => x.id),
  milestoneEvidence: {M3: status.M3, M4: status.M4, Y: status.Y, jets: status.jets},
  checks: {MODULE_STATUS_GLOBAL_HOLD_DISTINCTION: 'PASS_ORIGINAL_RUNTIME_RECEIPTS'},
  release: {gate: view.gate, canFreeze: assessment.canFreeze, publicationConfirmed: assessment.publicationConfirmed},
  controls: {localCandidateHasNoRegistration: localOnly.code, rejectedSerializedReceipts: imported.rejectedSerializedCriterionReceipts,
    ignoredForgedM3Completion: !imported.currentM3CompletionVerified, forgedDisplayAssessmentRejected: true},
  r108OriginalState: 'OPEN_ACTUAL_POST_PUBLICATION_SCREEN_RECEIPT',
}, null, 2) + '\n', 'utf8');
