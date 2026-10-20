#!/usr/bin/env node
/**
 * Verify the staged M4 modules against the source-pinned original 16-row matrix.
 * This checks repository artifacts only; it does not claim browser/mobile E2E.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const sha256 = (relative) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
const gitBlobSha = (relative) => {
  const bytes = fs.readFileSync(path.join(root, relative));
  return crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + bytes.length + '\\0'), bytes])).digest('hex');
};
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const m3Path = 'research-ide/mathscope-m3/recovery-20261019/M3_CURRENT_ORIGINAL_LEDGER.json';
const m4Path = 'research-ide/mathscope-m4/recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json';
const finitePath = 'research-ide/mathscope-m3/recovery-20261019/evidence/FINITE_VS_CONTINUUM_N706_N805_RECEIPT.json';
const m4ReceiptPath = 'research-ide/mathscope-m4/acceptance-review-20261019/evidence/followup-20261020/M4_FOLLOWUP_VERIFICATION_RECEIPT.json';
const observationPath = 'public/v0.3.1-publisher-observation.json';
const bundlePath = 'public/websitepublisher-v118-followup-bundle.json';
const statusPath = 'public/v0.3.1-sync-status.html';
const m3 = read(m3Path), m4 = read(m4Path), finite = read(finitePath), receipt = read(m4ReceiptPath);
const observation = read(observationPath), bundle = read(bundlePath);
const checkpoint = read('CHECKPOINT.json');
const counts = m4.rows.reduce((acc, row) => (acc[row.status] = (acc[row.status] || 0) + 1, acc), {});
const expectedIds = new Set([...Array.from({ length: 8 }, (_, i) => 'I3-' + String(i + 1).padStart(2, '0')), ...Array.from({ length: 8 }, (_, i) => 'R1-' + String(i + 1).padStart(2, '0'))]);
const ids = new Set(m4.rows.map(row => row.id));
const m3Blob = gitBlobSha(m3Path), m4Blob = gitBlobSha(m4Path);
check('m3_checkpoint_blob_pin', checkpoint.m3.githubBlobSha === m3Blob, 'actual=' + m3Blob);
check('m4_checkpoint_blob_pin', checkpoint.m4.githubBlobSha === m4Blob, 'actual=' + m4Blob);
check('m3_frontier_unchanged', m3.M3.inherited_completed === 62 && m3.M3.total === 64 && m3.M3.newly_closed === 0 && JSON.stringify([...m3.M3.open].sort()) === JSON.stringify(['N7-06','N8-05']) && m3.actual_last_resolved_tau === null, '62/64; N7-06 and N8-05 OPEN; actual tau null');
check('m4_original_16_rows', m4.originalCriteria === 16 && m4.rows.length === 16 && ids.size === 16 && [...expectedIds].every(id => ids.has(id)), 'all I3-01..08 and R1-01..08 rows exist');
check('m4_statuses_not_promoted', counts.ACCEPTED === 0 && counts.PARTIAL === 14 && counts.OPEN === 2 && m4.overallRelease === 'HOLD' && m4.finalAcceptance === 'UNCONFIRMED' && m4.acceptedCurrentRelease === null, JSON.stringify({counts, overallRelease:m4.overallRelease, finalAcceptance:m4.finalAcceptance}));
check('m4_receipt_pins_matrix', receipt.matrixBlobSha === m4Blob && receipt.originalCriteriaStatusCounts.ACCEPTED === 0 && receipt.originalCriteriaStatusCounts.PARTIAL === 14 && receipt.originalCriteriaStatusCounts.OPEN === 2, 'matrixBlobSha=' + receipt.matrixBlobSha);
check('finite_receipt_pins_m3', finite.sourceLedgerBlobSha === m3Blob && finite.N706Closed === false && finite.N805Closed === false && finite.actualLastResolvedTau === null, 'finite evidence does not close continuum obligations');
check('publisher_page_readback', observation.page.version === 118 && observation.page.versionHash === '9a0eebc5' && observation.page.fullPageSourceMirroredInGit === false, 'live v0.3.1.html v118 / 9a0eebc5 remains the canonical page');
check('publisher_runtime_readback', observation.fragments.runtime.version === 8 && observation.fragments.runtime.versionHash === 'abfa2a92' && observation.currentM4Panel.sourceMatrixGitBlobSha === m4Blob, 'runtime v8 overlay points to the current GitHub M4 matrix');
check('publisher_overlay_counts', JSON.stringify(observation.currentM4Panel.statusCounts) === JSON.stringify({ACCEPTED:0,PARTIAL:14,OPEN:2}) && observation.currentM4Panel.overallRelease === 'HOLD', 'runtime panel is source-pinned and preserves HOLD');
check('bundle_current_versions', bundle.liveBaseline.page.version === observation.page.version && bundle.liveBaseline.page.versionHash === observation.page.versionHash && bundle.liveBaseline.runtime.version === observation.fragments.runtime.version && bundle.liveBaseline.runtime.versionHash === observation.fragments.runtime.versionHash, 'bundle metadata matches current WebsitePublisher read-back');
check('bundle_release_hold', bundle.m4.statusCounts.ACCEPTED === 0 && bundle.m4.statusCounts.PARTIAL === 14 && bundle.m4.statusCounts.OPEN === 2 && bundle.publication.overallRelease === 'HOLD' && bundle.publication.status === 'PARTIAL_RUNTIME_UPDATED_FULL_PAGE_UNCHANGED', 'partial publication is not presented as full release');
check('status_page_is_not_ide_replacement', fs.existsSync(path.join(root,statusPath)) && fs.readFileSync(path.join(root,statusPath),'utf8').includes('대체본이 아닙니다') && fs.readFileSync(path.join(root,statusPath),'utf8').includes('HOLD'), 'status page explicitly does not replace the 26 MB live IDE page');
check('browser_mobile_not_claimed', observation.currentM4Panel.currentBrowserInspection === false && observation.currentM4Panel.physicalMobileInspection === false, 'no unverified E2E/mobile claim');

const failed = checks.filter(item => !item.pass);
const result = {
  schema: 'MathScope.M4ModuleVerification/1',
  result: failed.length ? 'FAIL' : 'PASS_HOLD_PRESERVED',
  checkedAt: new Date().toISOString(),
  sourcePins: { m3LedgerGitBlobSha: m3Blob, m4MatrixGitBlobSha: m4Blob, m4ReceiptSha256: sha256(m4ReceiptPath), publisherObservationSha256: sha256(observationPath) },
  m3: { inheritedCompleted: 62, total: 64, open: ['N7-06','N8-05'], actualLastResolvedTau: null },
  m4: { originalCriteria: 16, statusCounts: counts, openRows: m4.rows.filter(row => row.status === 'OPEN').map(row => row.id), overallRelease: 'HOLD' },
  publisher: { pageVersion: observation.page.version, pageHash: observation.page.versionHash, runtimeVersion: observation.fragments.runtime.version, runtimeHash: observation.fragments.runtime.versionHash, fullPageChanged: false },
  passed: checks.length - failed.length,
  total: checks.length,
  failed,
  checks
};
console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exitCode = 1;
