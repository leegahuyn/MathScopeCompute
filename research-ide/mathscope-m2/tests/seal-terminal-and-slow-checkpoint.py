#!/usr/bin/env python3
"""Bind observed source/Worker/browser records; do not execute or promote unfinished math."""
from pathlib import Path
import datetime
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[3]
M2 = ROOT / 'research-ide/mathscope-m2'
RESEARCH = M2 / 'navier/research'
E = RESEARCH / 'evidence/terminal-field-runtime-20261011'
S = RESEARCH / 'evidence/centered-slow-jets-20261011'
BASE = '87c7bb6fa1b24e1f8ea3d0281827665cc852de0e'


def read(p):
    return json.loads(p.read_text())


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def ref(p):
    return {'path': str(p.relative_to(ROOT)), 'sha256': sha(p)}


def write(p, value):
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip() == BASE
assert not (E / 'terminal-runtime-and-slow-checkpoint-review.json').exists()
source = read(E / 'attempt1-source-runtime.json')
worker = read(E / 'attempt1-worker-runtime.json')
browser = read(E / 'browser-v79-verification.json')
job = read(E / 'browser-v79-source-job.json')['job']
for mode, record in [('source', source), ('worker', worker)]:
    process = read(E / f'attempt1-{mode}-process.json')
    assert record['pass'] and record['exitCode'] == 0
    assert process['pass'] and process['observedExitCode'] == 0 and not process['timedOut']
    assert sha(ROOT / process['runtimeResult']['path']) == process['runtimeResult']['sha256']
    assert sha(ROOT / process['log']['path']) == process['log']['sha256']
    for path, digest in record['runtimeSHA256'].items():
        assert sha(M2 / path) == digest, path
    assert record['checkedSourcePathCells'] == 129 and record['unboundDisplayLabels'] == 29
    assert record['sourceFilesUnchangedDuringRun'] and not record['allCellsSourceBound']
for key in ['mathematicalHash', 'certificateSHA256', 'graphSHA256', 'panelRows']:
    assert source[key] == worker[key], key
assert browser['allFourTablesMatched'] and browser['allTablesFitAvailableWidth']
assert browser['publicationVersion'] == 79 and browser['publicationVersionHash'] == '596b9751'
assert job['status'] == 'COMPLETED' and job['mathematicalHash'] == source['mathematicalHash'] == browser['mathematicalHash']
assert len(job['result']['results']['checks']) == 10
assert all(c['pass'] for c in job['result']['results']['checks'])
assert job['result']['results']['graph']['sha256'] == source['graphSHA256']
assert len(browser['tables']) == 4
for t in browser['tables']:
    assert t['tableWidth'] == t['tableScrollWidth'] == t['wrapperWidth'] == t['wrapperScrollWidth']
    assert all(c == {'whiteSpace': 'pre-wrap', 'overflowWrap': 'anywhere'} for c in t['styles'])
assert (E / browser['screenshot']).is_file()
# Use the application's actual JSON normal form, including its numeric policy.
script = '''import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sha256} from './research-ide/mathscope-m0/contracts.mjs';
const e='./research-ide/mathscope-m2/navier/research/evidence/terminal-field-runtime-20261011/';
const src=JSON.parse(fs.readFileSync(e+'attempt1-source-runtime.json','utf8'));
const b=JSON.parse(fs.readFileSync(e+'browser-v79-source-job.json','utf8')).job;
assert.equal(await sha256(b.result.results),src.certificateSHA256);
console.log(JSON.stringify({certificateSHA256:src.certificateSHA256,browserCertificateMatchesExecutedSource:true}));'''
digest_check = subprocess.run(['node', '--input-type=module', '-e', script], cwd=ROOT, capture_output=True, text=True, check=True)
browser_digest = json.loads(digest_check.stdout)
packet_path = S / 'centered-slow-jet-enclosure-packet.json'
packet = read(packet_path)
assert packet['sourceExecution']['allChecksPass']
assert packet['sourceExecution']['observedProcessExitCode'] == 0
assert packet['sourceExecution']['runnerChecks'] == 12 and packet['sourceExecution']['internalSourceChecks'] == 11
assert len(packet['sourceExecution']['sourceManifest']['files']) == 68
for path, digest in packet['sourceExecution']['sourceManifest']['files'].items():
    assert sha(ROOT / path) == digest, path
assert packet['fileManifest']['fileCount'] == 26
for path, digest in packet['fileManifest']['files'].items():
    assert sha(ROOT / path) == digest, path
for key in ['receipt', 'log', 'processObservation']:
    item = packet['sourceExecution'][key]
    assert sha(S / item['path']) == item['sha256']
reissue = read(S / 'ns-proof-slow-review-reissue-provenance.json')
assert reissue['oldBytesRecovered'] is False and reissue['sameAsOldReviewClaimed'] is False
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
review = {
    'schema': 'MathScope.TerminalRuntimeAndCenteredSlowCheckpointReview/1',
    'reviewedAt': now, 'baseCommit': BASE,
    'status': 'EXECUTED_SOURCE_WORKER_PUBLIC_TERMINAL_AND_SOURCE_ONLY_SLOW_VERIFIED',
    'mathematicalHash': source['mathematicalHash'], 'certificateSHA256': source['certificateSHA256'],
    'graphSHA256': source['graphSHA256'], 'sourceWorkerParity': True,
    'browserCertificateComparison': browser_digest,
    'terminalSourceAndWorkerObservedExitCodes': [0, 0],
    'terminalTables': 4, 'sourceValueCells': 129, 'displayLabels': 29,
    'publicVersion': 79, 'publicVersionHash': '596b9751', 'runtimeVersion': '0.3.11',
    'publicPageFullHTMLRedownloadedAndByteCompared': False,
    'publicPublicationEvidence': 'Provider optimistic patch receipt plus newly completed actual browser job and all four visible tables.',
    'finalScreenshot': ref(E / browser['screenshot']),
    'slowPacket': ref(packet_path), 'slowRunnerChecks': 12, 'slowInternalChecks': 11,
    'slowImportedFilesVerified': 68, 'slowOwnedFilesVerified': 26,
    'slowNumericalJetRows': 18, 'slowPublicRuntimeExecuted': False,
    'overwrittenOldReviewBytesRecovered': False, 'reissuedReviewProvenancePreserved': True,
    'runtimeFiles': source['runtimeSHA256'],
    'evidence': [ref(E / name) for name in ['attempt1-source-runtime.json', 'attempt1-worker-runtime.json',
        'attempt1-source-process.json', 'attempt1-worker-process.json', 'browser-verification.json',
        'browser-v79-verification.json', 'browser-v79-source-job.json', 'provider-publication-v78.json',
        'provider-publication-v79.json', 'css-correction-audit.json']],
    'wholeM2Complete': False, 'm3MayStart': False,
}
review_path = E / 'terminal-runtime-and-slow-checkpoint-review.json'
write(review_path, review)
gate_path = RESEARCH / 'M2_COMPLETION_GATE.json'
gate = read(gate_path)
gate['generatedAt'] = now
gate['assessmentRevision'] = 'ACTUAL_CENTERED_SLOW_JETS_AND_TERMINAL_RUNTIME_0_3_11_PUBLIC_V79_VERIFIED'
gate['previousCheckpointCommit'] = BASE
gate['priorTerminalAndSlowCheckpoint'] = {
    'atCommit': BASE, 'assessmentSHA256': gate['assessmentSHA256'],
    'runtimeVerification': gate['currentRuntimeVerification'],
    'publication': gate['publication'], 'browserQA': gate['browserQA'],
}
gate['currentRuntimeVerification'] = {
    'version': '0.3.11', 'workerSha256': source['runtimeSHA256']['m2.worker.js'],
    'bundleSha256': source['runtimeSHA256']['workspace.bundle.js'],
    'executions': [ref(E / f'attempt1-{m}-runtime.json') for m in ['source', 'worker']],
    'sourceWorkerPairsAgree': True, 'sourcePathValueCellsCheckedPerExecution': 129,
    'unboundDisplayLabelsPerExecution': 29, 'allCellsSourceBound': False,
    'browserExecutionOfThisRuntimeVerified': True, 'publicPageVersion': 79,
    'browserReview': ref(E / 'browser-v79-verification.json'),
    'scope': 'New terminal F example source/Worker/browser; other examples retain separately pinned execution records.',
}
gate['publication'] = {
    'schema': 'MathScope.TerminalRuntime.OptimisticPublicationVerification/1',
    'verifiedAt': now, 'url': browser['url'], 'projectId': 29770, 'slug': 'v0.3.1.html',
    'version': 79, 'versionHash': '596b9751', 'runtimeVersion': '0.3.11',
    'providerRecord': ref(E / 'provider-publication-v79.json'),
    'browserReview': ref(E / 'browser-v79-verification.json'),
    'fullPublicHTMLRedownloadedAndByteCompared': False,
}
gate['browserQA'] = browser
gate['sourceRefs'].update({
    'actualCenteredSlowJetPacket': ref(packet_path),
    'terminalRuntimeAndSlowCheckpointReview': ref(review_path),
    'terminalRuntimeDocumentation': ref(RESEARCH / 'ACTUAL_TERMINAL_FIELD_RUNTIME_KO.md'),
    'terminalRuntimeBrowserV79': ref(E / 'browser-v79-verification.json'),
    'terminalRuntimeSealGenerator': ref(Path(__file__).resolve()),
    'currentScopeDocumentation': ref(RESEARCH / 'M2_COMPLETION_GATE_KO.md'),
})
gate['gate']['actualCenteredWeightedRadialSlowJetEnclosuresAtWitness'] = True
for claim in gate['additionalClaims']:
    if claim['id'] == 'M2X-COMPLETE-TERMINAL-F':
        claim['status'] = 'SOURCE_GENERATED_WORKER_AND_PUBLIC_BROWSER_VERIFIED_SCOPED'
        claim['publicWorkerOrBrowserExecuted'] = True
        claim['runtimeReview'] = ref(review_path)
    if claim['id'] == 'G-NUM':
        claim['status'] = 'PARTIAL_ACTUAL_CENTERED_SLOW_JET_AND_ABSOLUTE_AMPLITUDE_ENCLOSURES'
        claim['remaining'] = 'The actual weighted radial pulse has 18 directed first/second/mixed slow-jet intervals at the original centered witness, including dynamic covariance-weight derivatives. Fast/uncentered a/H/y derivative values, actual physical curl numerical intervals, and remaining original geometry/target positive scale factors are still being completed.'
gate['additionalClaims'].append({
    'id': 'M2X-CENTERED-SLOW-JET-NUMERICS', 'status': 'SOURCE_AND_TWO_INDEPENDENT_REVIEWS_SCOPED',
    'sourceRefs': ['actualCenteredSlowJetPacket'],
    'statement': 'Both actual signs have radial weighted first and symmetric second R/Z/T coefficient enclosures. Moving center, normalized H inverse, positive square-root and centered Gaussian tail errors remain bound to the original source.',
    'publicWorkerOrBrowserExecuted': False, 'wholeM2Complete': False,
})
gate['newSourceProgress']['generatedAt'] = now
gate['newSourceProgress']['lastPublishedRuntime'] = '0.3.11'
gate['newSourceProgress']['lastPublishedVersion'] = 'v79'
gate['newSourceProgress']['savedSourceCheckpoint'] = BASE
gate['newSourceProgress']['packetRefs'].append('actualCenteredSlowJetPacket')
gate['newSourceProgress']['nextDependencies'] = [
    'Complete actual common physical package execution, including E_B and private mutation checks.',
    'Complete original fast/uncentered and actual physical numerical enclosures with positive numeric scale endpoints.',
    'Review all five additional M2 mathematical gates before ordered M3 work.',
]
gate['publicationEvidenceScope'] = 'v79 terminal F source/Worker/browser verified; old heat and earlier source evidence remain distinct records.'
assert gate['gate']['blockingClaimIds'] == ['G-POS', 'G-NUM', 'G-CURL', 'G-N4', 'G-N5']
assert not gate['gate']['userRequestedM2Complete'] and not gate['gate']['m3MayStart']
gate.pop('assessmentSHA256')
gate['assessmentSHA256'] = hashlib.sha256(json.dumps(gate, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
write(gate_path, gate)
print(json.dumps({'reviewed': True, 'sourceWorkerBrowserCertificateParity': True,
    'sourceValueCells': 129, 'slowJetRows': 18, 'slowImportFiles': 68,
    'assessmentSHA256': gate['assessmentSHA256'], 'wholeM2Complete': False}, ensure_ascii=False))
