import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { dirname,resolve } from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const [repoPath,output,candidatePath,operatingPath,priorOperatingPath,browserReceiptPath]=process.argv.slice(2);
assert(repoPath && output && candidatePath && operatingPath && priorOperatingPath && browserReceiptPath,
  'Usage: node audit_r108_remaining.mjs REPO OUT CANDIDATE_HTML CURRENT_HTML PRIOR_HTML BROWSER_RECEIPT');
const repo=resolve(repoPath);
const imported=path=>import(pathToFileURL(resolve(repo,path)).href);
const readJSON=async file=>JSON.parse(await readFile(file,'utf8'));
const digest=value=>createHash('sha256').update(value).digest('hex');
const receiptPath=resolve(here,'current-patch-readback.json');
const paths=await Promise.all([candidatePath,operatingPath,priorOperatingPath,receiptPath].map(file=>readFile(file)));
const [candidate,operating,priorOperating,patchBytes]=paths;
const patch=JSON.parse(patchBytes);
const [inventory,registration,status,browser,githubDeployments]=await Promise.all([
  readJSON(resolve(here,'destination-inventory.json')),
  readJSON(resolve(here,'registration-15.json')),
  readJSON(resolve(repo,'tools/mathscope-cd-axial-bridge-20261029/goal-next/STATUS.json')),
  readJSON(browserReceiptPath),
  readJSON(resolve(here,'github-all-visible-deployments.json')),
]);
const {M4_CRITERIA}=await imported('research-ide/mathscope-m4/criteria.mjs');
const evaluator=await imported('research-ide/mathscope-m4/acceptance.mjs');
const criterion=M4_CRITERIA.find(r=>r.id==='R1-08');
assert.deepEqual(criterion.checks,['DECLARED_CAPABILITIES_SCOPE','MODULE_STATUS_GLOBAL_HOLD_DISTINCTION',
  'PATCH_TEST_ROLLBACK','ACTUAL_POST_PUBLICATION_SCREEN_RECEIPT']);
assert.equal(criterion.page,68);
assert.equal(digest(candidate),patch.candidateSHA256);
assert.equal(digest(candidate),browser.candidateSHA256);
assert.equal(patch.baselineSHA256,patch.restoredBaselineSHA256);
assert.equal(patch.publicationConfirmed,false);
assert.equal(browser.publicationConfirmed,false);
assert.equal(digest(operating),digest(priorOperating));
assert.notEqual(digest(operating),digest(candidate));

assert.equal(registration.newlyAcceptedCriteriaInThisAudit,15);
assert.equal(registration.originalCriteriaEnumerated,16);
assert.deepEqual(M4_CRITERIA.filter(r=>!registration.accepted.some(x=>x.criterionId===r.id)).map(r=>r.id),['R1-08']);
assert.equal(registration.publicationConfirmed,false);
assert.equal(registration.canFreeze,false);
assert.deepEqual(status.M3.open,['N7-06','N8-05']);
assert.equal(status.release,'HOLD');
assert.equal(inventory.projectCount,1);
assert.equal(inventory.projects[0].project_id,29770);
const publicPage=inventory.pages.find(r=>r.slug==='v0.3.1.html');
assert.equal(publicPage.version,137);
assert.equal(publicPage.version_hash,'9171eb0c');
assert.deepEqual(githubDeployments,[]);

const rawCandidate={
  schemaVersion:'mathscope.m4.criterion-evidence/1',criterionId:'R1-08',
  artifacts:[{path:'candidate.html',sha256:digest(candidate)}],
};
const oversize=await evaluator.verifyCriterionEvidence(rawCandidate,async p=>{
  assert.equal(p,'candidate.html');
  return candidate;
});
assert.equal(oversize.code,'CRITERION_ARTIFACT_INVALID');
assert.match(oversize.reason,/16 MiB/);
const boundedCandidate={
  schemaVersion:'mathscope.m4.criterion-evidence/1',criterionId:'R1-08',
  artifacts:[{path:'current-patch-readback.json',sha256:digest(patchBytes)}],
};
const bounded=await evaluator.verifyCriterionEvidence(boundedCandidate,async p=>{
  assert.equal(p,'current-patch-readback.json');
  return patchBytes;
});
assert.equal(bounded.code,'CRITERION_REVIEW_REQUIRED');
assert.equal(bounded.integrityCheckedArtifacts[0].sha256,digest(patchBytes));
const receipt={
  schema:'MathScope.M4.R108.RemainingPublicationReadOnly/1',
  criterion, status:{
    M3:status.M3,M4:{accepted:15,total:16,open:['R1-08']},jets:status.jets,
    globalRelease:'HOLD',canFreeze:registration.canFreeze,
    evaluatorPublicationConfirmed:registration.publicationConfirmed,
  },
  isolatedCandidate:{htmlSha256:digest(candidate),bytes:candidate.byteLength,
    patchReadbackSha256:digest(patchBytes),matchesReviewedBrowserFixture:true,
    actualPublishedCandidateReadbackAvailable:false},
  operatingReadback:{project:29770,slug:publicPage.slug,version:publicPage.version,
    providerVersionHash:publicPage.version_hash,httpBodySha256:digest(operating),
    bytes:operating.byteLength,matchesPriorOperatingBody:true,matchesIsolatedCandidate:false},
  inScopeDestinationEvidence:{connectedWebsitePublisherProjectCount:inventory.projectCount,
    projectPageCount:inventory.pageCount,githubVisibleDeploymentCount:githubDeployments.length,
    githubPagesSettingsReadback:'HTTP_404'},
  evaluatorControls:{singleFullCandidateHtml:oversize.code,reason:oversize.reason,
    boundedIntegrityOnlyEvidence:bounded.code,reviewedAnchorMissing:true},
  conclusion:'R1-08 remains open at the actual candidate publication screen receipt. Scoped publication and global release remain distinct.',
};
await writeFile(output,JSON.stringify(receipt,null,2)+'\n');
console.log('PASS: 15 current accepted criteria, original R1-08 scope, unchanged operating body, distinct local candidate and bounded receipt controls.');

