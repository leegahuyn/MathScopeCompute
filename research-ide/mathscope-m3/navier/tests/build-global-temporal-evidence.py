"""Compact immutable consumer of the successful actual-source temporal gate.

The exact Fourier coefficients, omitted-mode tails and physical potential
remain linked to the observed full certificate. The build verifies every
captured current source byte, all observed output and the lossless packing.
Failed attempts remain separate historical observations, with their own
unchanged source snapshots. No large source constructor runs in this build.
"""
from pathlib import Path
import argparse
import gzip
import hashlib
import importlib.util
import io
import json
import re

ROOT = Path(__file__).resolve().parents[4]
BASE = Path('research-ide/mathscope-m3/navier')
ATTEMPT = BASE / 'evidence/global-temporal-20261012/attempt3'
KERNEL = BASE / 'evidence/auxiliary-fourier-kernel-20261012/attempt1'
TARGET = BASE / 'source-global-temporal-evidence-data.mjs'
RECEIPT_SHA = '6acab3d43f99043545e715db2e2260b373ac317103773667b5fbd328d7cc8663'
ARTIFACT_SHA = '8ef4e695623643d6ed344ce092270b0ac392be1aa2e49bcc1990ebd5da39df58'
PACKED = {'path': str(ATTEMPT / 'global-temporal.json.gz'), 'bytes': 841112,
          'sha256': 'f8514482e0fee1f0f8b78519ef6683da9fc607448e03e2a8d0d560598d8e0585', 'encoding': 'gzip'}
FAILURE_PINS = {
    1: '1bd361b627cdf2a670be6756f95194a4eac64d87a84c5af8531e61d78c2bdc54',
    2: '9b7a00bf65ed34d17e1e0aa3a40eaa734149b3de77174ea36884b1aa710fc770'}
KERNEL_RECEIPT_SHA = '83280ecb9ffcfb16428872570ffa1799af21180e5ec02121d87a8d552215f585'
SPEC = importlib.util.spec_from_file_location('temporal_archive_bytes', ROOT / BASE / 'tests/build-near-terminal-evidence.py')
SHARED = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SHARED)


def pinned_receipt(root, path, expected):
    raw = (root / path).read_bytes()
    if hashlib.sha256(raw).hexdigest() != expected:
        raise ValueError('A fixed observed temporal/kernel receipt changed: ' + str(path))
    return json.loads(raw), {'path': str(path), 'sha256': expected, 'bytes': len(raw)}


def verified_artifact(root, row):
    if row['path'] != str(ATTEMPT / 'global-temporal.json'):
        return SHARED.verified_file(root, row)
    if row['sha256'] != ARTIFACT_SHA or row['bytes'] != 24527857:
        raise ValueError('The complete temporal source certificate changed')
    manifest = json.loads((root / BASE / 'evidence/packed-evidence.json').read_bytes())
    matches = [x for x in manifest['artifacts'] if x['original'] == row]
    if len(matches) != 1 or matches[0]['packed'] != PACKED or matches[0]['receipt'] != {
            'path': str(ATTEMPT / 'receipt.json'), 'sha256': RECEIPT_SHA}:
        raise ValueError('Temporal gzip packing lost the fixed observed receipt')
    encoded = SHARED.verified_file(root, PACKED)
    with gzip.GzipFile(fileobj=io.BytesIO(encoded), mode='rb') as stream:
        raw = stream.read(row['bytes'] + 1)
    if len(raw) != row['bytes'] or hashlib.sha256(raw).hexdigest() != ARTIFACT_SHA:
        raise ValueError('Temporal gzip does not reproduce the exact observed bytes')
    if (root / row['path']).exists() and SHARED.verified_file(root, row) != raw:
        raise ValueError('Available raw and packed temporal evidence disagree')
    return raw


def historical_failures(root):
    result = []
    for attempt, expected in FAILURE_PINS.items():
        path = BASE / f'evidence/global-temporal-20261012/attempt{attempt}/receipt.json'
        r, receipt = pinned_receipt(root, path, expected)
        if r['pass'] is not False or r['exitCode'] == 0 or r['nodeTests']['failed'] != 6 or not r['sourceFilesUnchanged']:
            raise ValueError('A historical temporal resource failure was rewritten as success')
        contents = {Path(row['path']).name: SHARED.verified_file(root, row) for row in r['artifacts']}
        capture = json.loads(contents['source-bytes.json'])
        if not (capture['unchanged'] and capture['before'] == capture['after'] and
                len(capture['before']) == r['sourceFileCount']):
            raise ValueError('A historical failed-attempt source snapshot changed')
        # These are historical source bytes, not a claim that edited new
        # attempt sources are still the present checkout's bytes.
        result.append({'attempt': attempt, 'receipt': receipt, 'artifacts': r['artifacts'],
            'nodeTests': r['nodeTests'], 'sourceFileCount': r['sourceFileCount'],
            'elapsedSeconds': r['elapsedSeconds'], 'pass': False,
            'observedPeakSourceWorkerFamilyRSSBytes': r['observedPeakSourceWorkerFamilyRSSBytes'],
            'sourceSnapshotsPreserved': True, 'currentCheckoutMatchesHistoricalNewSourcesClaimed': False,
            'failureReason': 'Declared 3,500,000-node source resource limit; no missing derivative was truncated or accepted.'})
    return result


def independent_kernel(root):
    r, receipt = pinned_receipt(root, KERNEL / 'receipt.json', KERNEL_RECEIPT_SHA)
    if not (r['pass'] and r['nodeTests'] == {'pass': 5, 'fail': 0, 'skipped': 0}
            and r['sourceFilesUnchanged'] and r['sourceFileCount'] == 13
            and r['independentStatus'] == 'PASS' and r['independentCheckCount'] == 662
            and not r['sourceAuthenticated'] and not r['actualN6ResidualAttached']):
        raise ValueError('The independent Fourier kernel result or its generic scope changed')
    contents = {Path(row['path']).name: SHARED.verified_file(root, row) for row in r['artifacts']}
    capture = json.loads(contents['source-bytes.json'])
    if not (capture['unchanged'] and capture['before'] == capture['after'] and len(capture['before']) == 13):
        raise ValueError('The independent Fourier kernel source capture changed')
    for row in capture['before']:
        SHARED.verified_file(root, row)
    independent = json.loads(contents['independent-exact.json'])
    if independent['status'] != 'PASS' or len(independent['checks']) != 662 or not all(x['pass'] for x in independent['checks']):
        raise ValueError('The original exact Fourier-polynomial checks no longer pass')
    return {'receipt': receipt, 'artifacts': r['artifacts'], 'nodeTests': r['nodeTests'],
        'independentCheckCount': 662, 'sourceFileCount': 13, 'sourceAuthenticated': False,
        'actualN6ResidualAttached': False, 'arithmetic': independent['arithmetic'],
        'freshlyExecutedByArchiveConsumer': False}


def archive(root=ROOT):
    root = Path(root)
    r, receipt = pinned_receipt(root, ATTEMPT / 'receipt.json', RECEIPT_SHA)
    if not (r['pass'] and r['exitCode'] == 0 and r['stoppedReason'] is None
            and r['nodeTests'] == {'passed': 15, 'failed': 0, 'skipped': 0}
            and r['sourceFilesUnchanged'] and r['sourceFileCount'] == 123
            and all(r[k] is True for k in ['actualAllLabelFullAuxiliaryPressureConstructed',
                'actualSourceAuxiliaryTemporalInverseConstructed', 'actualOriginalAxialPotentialRealized',
                'individualN605OperatorCriteriaSatisfied', 'temporalMeanInverseApplied'])
            and all(r[k] is False for k in ['postTemporalNonlinearPressureReconstructed', 'initializedJ0',
                'allOrderSourceClassBoundCertified', 'completeN6', 'newLeanExecuted', 'wholeM3Complete'])):
        raise ValueError('The observed actual-source temporal gate or its completion scope changed')
    refs = {Path(row['path']).name: row for row in r['artifacts']}
    if len(refs) != len(r['artifacts']):
        raise ValueError('Temporal artifact names must be unique')
    contents = {name: verified_artifact(root, row) for name, row in refs.items()}
    capture = json.loads(contents['source-bytes.json'])
    before = json.loads(contents['source-bytes-before.json'])
    if not (capture['unchanged'] and capture['before'] == capture['after'] == before['files']
            and before['fileCount'] == len(capture['before']) == 123
            and len({x['path'] for x in capture['before']}) == 123):
        raise ValueError('The actual temporal source capture changed')
    for row in capture['before']:
        SHARED.verified_file(root, row)
    log = contents['node.log'].decode('utf-8')
    if len(re.findall(r'^ok \d+ - ', log, re.M)) != 15 or re.search(r'^not ok ', log, re.M):
        raise ValueError('The complete observed temporal source output is not passing')
    c = json.loads(contents['global-temporal.json'])
    scope = c['scope']
    if not (c['schema'] == 'MathScope.N6.GlobalActualTemporalInverse/1'
            and len(c['checks']) == 14 and all(x['pass'] for x in c['checks'])
            and c['individualOperatorAcceptanceDoesNotCompletePackage'] and not c['numericalValuesOrEnclosures']
            and all(scope[k] is True for k in ['actualSourceAuxiliaryTemporalInverseConstructed',
                'actualOriginalAxialPotentialRealized', 'originalN605OperatorCriteriaSatisfied'])
            and all(scope[k] is False for k in ['actualPostTemporalNonlinearPressureReconstructed',
                'actualFiveMomentsAfterTemporalApplied', 'initializedJ0', 'allOrderTargetClassBoundsCertified',
                'completeN6', 'numericalWholeFieldEnclosure', 'newLeanKernelProof'])
            and c['periodicity']['sourceAuthenticated'] and len(c['sourcePressure']['cover']['rows']) == 81):
        raise ValueError('The actual temporal source equations, cover or scope changed')
    for inverse in c['inverses'].values():
        f = inverse['finite']
        if not (inverse['sourceAuthenticated'] and not inverse['finiteSumReplacesExactLimit']
                and inverse['identity']['pass'] and len(inverse['identity']['rows']) == 4
                and f['pairCount'] == 4 and f['zeroMode']['retainedSeparately'] and not f['zeroMode']['inverted']
                and len(f['tails']) == 2 and all(t['sourceDerivativeOrder'] == t['derivativeOrder'] + 4
                    and t['tailTendsToZero'] and not t['omittedModesSetToZero'] for t in f['tails'])):
            raise ValueError('A complete actual Fourier source, zero mode or omitted tail was dropped')
    closure = c['closure']
    if not (len(c['derivativeQueries']) == 5 and all(q['actualTailAssignedToEveryRequestedPartial'] for q in c['derivativeQueries'])
            and closure['allRequestedSharedBodiesMaterialized'] and closure['allDeclaredCoverRowsRetained']
            and closure['baseClosure']['allRequestedSharedBodiesMaterialized']
            and len(closure['indexedPartials']) == 466 and len(closure['exactInversePartials']) == 9
            and all(p['rows'] == 162 and p['allDeclaredRowsRetained'] and
                    sorted(j for g in p['finiteSummandProgram']['groups'] for j in g['sourceRows']) == list(range(162))
                    for p in closure['indexedPartials'])):
        raise ValueError('A required actual derivative-tail or complete finite source-sum program was omitted')
    summary = {k: v for k, v in c.items() if k not in ['sourcePressure', 'closure']}
    summary['recordedCertificateSchema'] = summary.pop('schema')
    summary['schema'] = 'MathScope.N6.GlobalTemporalArchiveSummary/1'
    pressure = c['sourcePressure']
    summary['sourcePressureSummary'] = {k: pressure[k] for k in ['schema', 'source', 'geometry', 'covariance',
        'radial', 'pressure', 'residual', 'checks', 'scope', 'graph']}
    summary['sourcePressureSummary']['completeCoverBoxCount'] = 81
    summary['derivativeClosureSummary'] = {'requestedRootCount': len(closure['roots']),
        'sharedExpressionDerivativeCount': len(closure['expressions']), 'indexedDerivativeProgramCount': 466,
        'completeRowsPerIndexedProgram': 162, 'exactInverseDerivativeCount': 9,
        'actualOriginalSourceDerivativeCount': len(closure['baseClosure']['partials']),
        'actualPulseVariationalBlockCount': len(closure['baseClosure']['pulseBlocks']),
        'allActualLocalDerivativeBodiesMaterialized': True, 'allDeclaredCoverRowsRetained': True,
        'identicalFiniteSummandProgramsShared': True, 'derivativeTermsOmitted': False,
        'sourceGraphOrFrozenCalculusModified': False, 'numericalValuesOrEnclosures': False}
    failures = historical_failures(root)
    kernel = independent_kernel(root)
    return {'schema': 'MathScope.N6.GlobalTemporalArchive/1', 'receipt': receipt,
        'artifact': refs['global-temporal.json'], 'artifacts': r['artifacts'], 'packedArtifact': PACKED,
        'losslessRawArtifactVerified': True, 'fullArtifactEmbedded': False, 'sourceSummaryOnly': True,
        'sourceDependencyCapture': {**refs['source-bytes.json'], 'fileCount': 123},
        'gate': {**{k: r[k] for k in ['command', 'exitCode', 'elapsedSeconds', 'nodeTests', 'startedAt', 'finishedAt',
            'sourceFileCount', 'observedPeakSourceWorkerFamilyRSSBytes', 'observedMaximumSingleProcessASBytes',
            'upstreamSourceStageMaximumNodes', 'temporalStageMaximumNodes', 'sourceWorkerFamilyRSSLimitBytes',
            'perProcessAddressSpaceLimitBytes', 'timeoutSeconds']}, 'freshlyExecutedByArchiveConsumer': False},
        'priorFailedAttempts': failures, 'independentKernelObservation': kernel,
        'fullArtifactURL': 'https://github.com/leegahuyn/MathScopeCompute/blob/mathscope-m3-resume-20261012/' + PACKED['path'],
        'packingInstructionsURL': 'https://github.com/leegahuyn/MathScopeCompute/blob/mathscope-m3-resume-20261012/' + str(BASE / 'evidence/PACKED_EVIDENCE.md'),
        'sourceValidation': {'mode': 'BUILD_TIME_BYTE_VERIFICATION', 'allCapturedSourceFilesMatch': True,
            'allRecordedArtifactBytesMatch': True, 'historicalFailuresPreserved': True, 'browserHasReexecutedConstructor': False},
        'summary': summary,
        'literalAcceptance': {'row': 'N6-05', 'criteriaSatisfied': True,
            'actualOperatorInput': 'Both complete original current tangential mean residuals after the full auxiliary pressure reconstruction.',
            'evidence': ['Actual source Fourier coefficient integrals and exact original quadratic divisors.',
                'Zero mode is projected out and retained; it is never divided.',
                'C0/C1 convergence and every requested physical-potential derivative use their own actual source FTC tail.',
                'Every tail retains four extra source derivatives and the entire omitted square lattice.',
                'The original meridional potential realizes the axial/radial update, retaining ci^-1, slow-time and cutoff terms.'],
            'packageCompletionInferred': False, 'initializedJ0Inferred': False},
        'scope': {'actualTemporalSourceExecutionRecorded': True, 'individualN605OperatorCriteriaSatisfied': True,
            'temporalMeanInverseApplied': True, 'postTemporalNonlinearPressureReconstructed': False,
            'fiveMomentsAfterTemporalApplied': False, 'initializedJ0': False, 'allOrderSourceClassBoundCertified': False,
            'numericFieldEnclosure': False, 'completeN6': False, 'wholeM3Complete': False}}


def source_paths(root=ROOT):
    root = Path(root)
    value = archive(root)
    result = [root / value['receipt']['path']]
    result += [root / (PACKED['path'] if row == value['artifact'] else row['path']) for row in value['artifacts']]
    capture = json.loads((root / value['sourceDependencyCapture']['path']).read_bytes())
    result += [root / row['path'] for row in capture['before']]
    for observed in value['priorFailedAttempts'] + [value['independentKernelObservation']]:
        result += [root / observed['receipt']['path']] + [root / row['path'] for row in observed['artifacts']]
    kernel_capture = json.loads((root / KERNEL / 'source-bytes.json').read_bytes())
    result += [root / row['path'] for row in kernel_capture['before']]
    result += [root / BASE / 'evidence/packed-evidence.json', root / BASE / 'tests/verify-packed-evidence.py',
               root / BASE / 'evidence/PACKED_EVIDENCE.md']
    return sorted(set(result))


def build(root=ROOT, check=False):
    value = archive(root)
    sha = SHARED.javascript_digest(value)
    output = ('// Generated from the actual-source temporal attempt3 gate; do not edit.\n'
        'export const GLOBAL_TEMPORAL_ARCHIVE_SHA256 = ' + json.dumps(sha) + ';\n'
        'export const GLOBAL_TEMPORAL_ARCHIVE = ' + json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False) + ';\n')
    target = Path(root) / TARGET
    if check:
        if not target.exists() or target.read_text(encoding='utf-8') != output:
            raise ValueError('Stale generated actual-source temporal archive')
    else:
        target.write_text(output, encoding='utf-8', newline='\n')
    return {'archiveSHA256': sha, 'generatedBytes': len(output.encode()), 'sourceFiles': 123,
        'sourceTests': 15, 'independentFourierChecks': 662, 'historicalFailedAttempts': 2,
        'sourceGraphNodes': value['summary']['graph']['nodeCount'], 'fullArtifactEmbedded': False,
        'literalN605Satisfied': True, 'completeN6': False, 'checkOnly': check}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build(check=args.check)))
