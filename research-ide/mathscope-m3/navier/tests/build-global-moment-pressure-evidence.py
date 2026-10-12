"""Compact recorded consumer of the actual complete five-moment pressure gate.

The full observed artifacts remain byte-pinned repository files. This public
archive records their equations, exact identity checks, condition-number
controls and honest scope without embedding two inherited multi-megabyte
source certificates again. No constructor runs during archive consumption.
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
ATTEMPT = BASE / 'evidence/global-moment-pressure-20261012/attempt1'
PRESSURE_ATTEMPT = BASE / 'evidence/global-pressure-20261012/attempt1'
TARGET = BASE / 'source-global-moment-pressure-evidence-data.mjs'
# Immutable observed source receipts and full artifacts.
PINS = {
    "research-ide/mathscope-m3/navier/evidence/global-moment-pressure-20261012/attempt1/receipt.json": "631faa13604e69d07dea0cd0f217355ec4970fe8565e31b940f55f92b24b6bb2",
    "research-ide/mathscope-m3/navier/evidence/global-moment-pressure-20261012/attempt1/global-moment-pressure.json": "9d81390a7d3bc6487b9bb24fc457b9732047f8c20717f263a0c8cd13e3e8aa6b",
    "research-ide/mathscope-m3/navier/evidence/global-pressure-20261012/attempt1/receipt.json": "73b509f6697633c596d590aa2fd0ea0164ada4c1b531bc853fefda2657982b9b",
    "research-ide/mathscope-m3/navier/evidence/global-pressure-20261012/attempt1/global-pressure.json": "d74a819b4247856aa2628b8c7d045967d3a7e98918cd7a47f3c2699fb4643eb7"
}
PACKED_PIN = {'path': str(ATTEMPT / 'global-moment-pressure.json.gz'),
              'sha256': '98b60650c47e7f39d0f5e11f042fb932c9cd4c5c26475fe399620f5cac2cab7b',
              'bytes': 602825, 'encoding': 'gzip'}
SPEC = importlib.util.spec_from_file_location('moment_pressure_archive_bytes', ROOT / BASE / 'tests/build-near-terminal-evidence.py')
SHARED = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SHARED)


def _packing(root, row, receipt_path):
    if row['path'] != str(ATTEMPT / 'global-moment-pressure.json'):
        return None
    packing = json.loads((root / BASE / 'evidence/packed-evidence.json').read_bytes())
    matches = [x for x in packing['artifacts'] if x['original'] == row]
    if len(matches) != 1 or matches[0]['packed'] != PACKED_PIN or matches[0]['receipt'] != {
            'path': str(receipt_path), 'sha256': PINS[str(receipt_path)]}:
        raise ValueError('The lossless moment-pressure packing no longer binds its original observed receipt')
    return matches[0]


def _verified_artifact(root, row, receipt_path):
    packed = _packing(root, row, receipt_path)
    if packed is None:
        return SHARED.verified_file(root, row)
    encoded = SHARED.verified_file(root, packed['packed'])
    # Bound decompression by the original pinned byte count before parsing.
    with gzip.GzipFile(fileobj=io.BytesIO(encoded), mode='rb') as stream:
        raw = stream.read(row['bytes'] + 1)
    if len(raw) != row['bytes'] or hashlib.sha256(raw).hexdigest() != row['sha256']:
        raise ValueError('Lossless packing does not reproduce the exact observed source bytes')
    if (root / row['path']).exists() and SHARED.verified_file(root, row) != raw:
        raise ValueError('The available raw and packed evidence disagree')
    return raw


def _verify_gate(root, attempt, kind, expected_tests, expected_sources):
    receipt_path = attempt / 'receipt.json'
    raw = (root / receipt_path).read_bytes()
    if hashlib.sha256(raw).hexdigest() != PINS.get(str(receipt_path)):
        raise ValueError('The fixed observed ' + kind + ' receipt changed or has not been pinned')
    r = json.loads(raw)
    if not (r['pass'] is True and r['exitCode'] == 0 and r['stoppedReason'] is None
            and r['nodeTests'] == {'passed': expected_tests, 'failed': 0, 'skipped': 0}
            and r['sourceFilesUnchanged'] is True and r['sourceFileCount'] == expected_sources
            and r['actualAllLabelFullAuxiliaryPressureConstructed'] is True
            and r['actualFullTangentialMeanResidualConstructed'] is True
            and r['fullNonzeroAuxiliaryPressureConstructed'] is True
            and all(r[key] is False for key in ['temporalMeanInverseApplied', 'initializedJ0',
                'allOrderSourceClassBoundCertified', 'completeN6', 'newLeanExecuted', 'wholeM3Complete'])):
        raise ValueError('The recorded ' + kind + ' gate or scope is not passing')
    if kind == 'moment-pressure' and not (r['actualFiveMomentsWithFullPressureConstructed'] is True
            and r['individualN606OperatorCriteriaSatisfied'] is True):
        raise ValueError('The actual five-moment/full-pressure operator was not constructed')
    refs = {Path(row['path']).name: row for row in r['artifacts']}
    if len(refs) != len(r['artifacts']):
        raise ValueError('The observed artifacts must have unique names')
    contents = {name: _verified_artifact(root, row, receipt_path) for name, row in refs.items()}
    before = json.loads(contents['source-bytes-before.json'])
    capture = json.loads(contents['source-bytes.json'])
    rows = capture['before']
    if not (capture['unchanged'] is True and rows == capture['after'] == before['files']
            and len(rows) == before['fileCount'] == expected_sources
            and len({row['path'] for row in rows}) == expected_sources):
        raise ValueError('The complete actual source dependency capture changed')
    for row in rows:
        SHARED.verified_file(root, row)
    log = contents['node.log'].decode('utf-8')
    if len(re.findall(r'^ok \d+ - ', log, re.M)) != expected_tests or re.search(r'^not ok ', log, re.M):
        raise ValueError('The original full raw source test output is not passing')
    artifact_name = 'global-' + kind + '.json'
    artifact = refs[artifact_name]
    if hashlib.sha256(contents[artifact_name]).hexdigest() != PINS.get(artifact['path']):
        raise ValueError('The full observed ' + kind + ' artifact changed')
    observed = {
        'receipt': {'path': str(receipt_path), 'sha256': PINS[str(receipt_path)], 'bytes': len(raw)},
        'artifact': artifact, 'artifacts': r['artifacts'],
        'sourceDependencyCapture': {**refs['source-bytes.json'], 'fileCount': len(rows)},
        'gate': {**{key: r[key] for key in ['command', 'exitCode', 'elapsedSeconds', 'nodeTests', 'startedAt',
                    'finishedAt', 'nodeResourceUsagePeakRSSBytes', 'sourceFileCount']},
                 'freshlyExecutedByArchiveConsumer': False}}
    packed = _packing(root, artifact, receipt_path)
    if packed is not None:
        observed['packedArtifact'] = packed['packed']
        observed['losslessRawArtifactVerified'] = True
    return r, refs, json.loads(contents[artifact_name]), rows, observed


def archive(root=ROOT):
    root = Path(root)
    r, refs, c, rows, observed = _verify_gate(root, ATTEMPT, 'moment-pressure', 10, 121)
    _, _, before_pressure, _, old_observed = _verify_gate(root, PRESSURE_ATTEMPT, 'pressure', 15, 118)
    required_scope = ['actualFiveMomentOperatorOnOriginalCurrent', 'fullPressureAfterOriginalFiveMoments',
        'actualTwoConservationIntegralsZero', 'actualNonlinear8_26And8_27', 'originalTinyLambdaConditionNumberControlled',
        'individualN606OperatorCriteriaSatisfied']
    if not (c['schema'] == 'MathScope.N6.GlobalActualMomentPressure/1'
            and len(c['checks']) == 17 and all(x['pass'] is True for x in c['checks'])
            and c['individualOperatorAcceptanceDoesNotCompletePackage'] is True
            and c['numericalValuesOrEnclosures'] is False
            and all(c['scope'][key] is True for key in required_scope)
            and all(c['scope'][key] is False for key in ['temporalMeanUpdateApplied', 'initializedJ0',
                'allOrderTargetClassBoundsCertified', 'completeN6', 'numericalWholeFieldEnclosure', 'newLeanKernelProof'])
            and c['pressure']['allAuxiliaryModesRetained'] is True
            and c['pressure']['cutoffRemainderDeclaredZero'] is False
            and c['conditioning']['sourceAuthenticated'] is True
            and c['conditioning']['uniformLambdaLimitClaimed'] is False
            and c['conditioning']['binary64UnscaledConditionNumber'] is False
            and all(x['pass'] is True for x in before_pressure['checks'])):
        raise ValueError('The full five-moment pressure result or its literal scope changed')
    moment = c['sourceMoment']
    pressure = c['sourcePressure']
    if not (len(moment['bumps']['momentRows']) == 5
            and len(moment['bumps']['coefficients']['checks']) == 5
            and all(x['pass'] is True for x in moment['checks'])
            and len(pressure['cover']['rows']) == 81 and all(x['pass'] is True for x in pressure['checks'])
            and c['closure']['allRequestedSharedBodiesMaterialized'] is True
            and c['closure']['allDeclaredCoverRowsRetained'] is True
            and c['closure']['baseClosure']['allRequestedSharedBodiesMaterialized'] is True):
        raise ValueError('The actual moment rows, complete cover or derivative bodies were omitted')
    summary = {key: value for key, value in c.items() if key not in ['sourceMoment', 'sourcePressure', 'closure']}
    summary['recordedCertificateSchema'] = summary.pop('schema')
    summary['schema'] = 'MathScope.N6.GlobalMomentFullPressureArchiveSummary/1'
    summary['actualOriginalFiveRows'] = moment['bumps']['momentRows']
    summary['actualOriginalFiveRowChecks'] = moment['bumps']['coefficients']['checks']
    summary['actualOriginalFiveRowSourceRestriction'] = moment['bumps']['sourceRestriction']
    summary['sourceMomentSummary'] = {key: moment[key] for key in ['schema', 'source', 'potential', 'velocity', 'checks', 'scope', 'graph']}
    pressure_keys = ['schema', 'source', 'geometry', 'covariance', 'radial', 'pressure', 'residual', 'checks', 'scope', 'graph']
    summary['sourcePressureBeforeSummary'] = {key: pressure[key] for key in pressure_keys}
    summary['sourcePressureBeforeSummary']['coverSummary'] = {key: pressure['cover'][key] for key in pressure['cover'] if key != 'rows'}
    summary['sourcePressureBeforeSummary']['coverSummary']['actualBoxCount'] = len(pressure['cover']['rows'])
    closure = c['closure']
    summary['derivativeClosureSummary'] = {
        'requestedRootCount': len(closure['roots']), 'newSharedDerivativeCount': len(closure['expressions']),
        'indexedDerivativeCount': len(closure['indexedPartials']),
        'pulseBlockCount': len(closure['baseClosure']['pulseBlocks']),
        'allRequestedSharedBodiesMaterialized': True, 'allDeclaredCoverRowsRetained': True,
        'sourceFormulaBodiesStoredInFullArtifact': True, 'sourceGraphSHA256': c['graph']['sha256']}
    summary['omittedFullArtifactPaths'] = ['sourceMoment.sourceCurrent', 'sourceMoment.bumps.copies',
        'sourceMoment.mean', 'sourceMoment.nonlinear', 'sourcePressure.sourceCurrent', 'sourcePressure.cover.rows',
        'sourcePressure.closure', 'closure']
    return {'schema': 'MathScope.N6.GlobalMomentFullPressureArchive/1', **observed,
        'priorCompletePressureObservation': old_observed,
        'fullArtifactEmbedded': False, 'sourceSummaryOnly': True,
        'fullArtifactURL': 'https://github.com/leegahuyn/MathScopeCompute/blob/mathscope-m3-resume-20261012/' + observed.get('packedArtifact', refs['global-moment-pressure.json'])['path'],
        'packingInstructionsURL': 'https://github.com/leegahuyn/MathScopeCompute/blob/mathscope-m3-resume-20261012/' + str(BASE / 'evidence/PACKED_EVIDENCE.md'),
        'sourceValidation': {'mode': 'BUILD_TIME_BYTE_VERIFICATION', 'allCapturedSourceFilesMatch': True,
            'allRecordedArtifactBytesMatch': True, 'browserHasReexecutedConstructor': False},
        'summary': summary,
        'literalAcceptance': {'row': 'N6-06', 'criteriaSatisfied': True,
            'actualOperatorInput': 'The original complete global primary current, before temporal initialization.',
            'evidence': ['Five original radial equations use the actual current P,Jtheta,Jz.',
                'Both original weighted conservation integrals remain zero.',
                'Complete shifted8.12 pressure is reconstructed after the update, with every auxiliary mode and A0.',
                'Complete nonlinear8.26/8.27 differences agree with actual recomputed defects.',
                'The unchanged positive lambda is explicitly factored; fixed-lambda condition bounds retain all row factors.'],
            'packageCompletionInferred': False, 'initializedJ0Inferred': False},
        'scope': {'actualMomentFullPressureExecutionRecorded': True, 'individualN606OperatorCriteriaSatisfied': True,
            'temporalMeanInverseApplied': False, 'initializedJ0': False, 'allOrderSourceClassBoundCertified': False,
            'numericFieldEnclosure': False, 'completeN6': False, 'wholeM3Complete': False}}


def source_paths(root=ROOT):
    value = archive(root)
    result = []
    for observed in [value, value['priorCompletePressureObservation']]:
        capture = json.loads((Path(root) / observed['sourceDependencyCapture']['path']).read_bytes())
        result += [Path(root) / observed['receipt']['path']]
        result += [Path(root) / (observed['packedArtifact']['path'] if 'packedArtifact' in observed and row == observed['artifact'] else row['path'])
                   for row in observed['artifacts'] + capture['before']]
    result += [Path(root) / BASE / 'evidence/packed-evidence.json',
               Path(root) / BASE / 'tests/verify-packed-evidence.py', Path(root) / BASE / 'evidence/PACKED_EVIDENCE.md']
    return sorted(set(result))


def build(root=ROOT, check=False):
    value = archive(root)
    sha = SHARED.javascript_digest(value)
    output = ('// Generated from the actual complete five-moment pressure source gate; do not edit.\n'
        'export const GLOBAL_MOMENT_FULL_PRESSURE_ARCHIVE_SHA256 = ' + json.dumps(sha) + ';\n'
        'export const GLOBAL_MOMENT_FULL_PRESSURE_ARCHIVE = ' + json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False) + ';\n')
    target = Path(root) / TARGET
    if check:
        if not target.exists() or target.read_text(encoding='utf-8') != output:
            raise ValueError('Stale generated complete five-moment pressure archive')
    else:
        target.write_text(output, encoding='utf-8', newline='\n')
    return {'archiveSHA256': sha, 'generatedBytes': len(output.encode()), 'sourceFiles': 121,
        'sourceTests': 10, 'priorPressureTests': 15, 'sourceGraphNodes': value['summary']['graph']['nodeCount'],
        'fullArtifactEmbedded': False, 'literalN606Satisfied': True, 'completeN6': False, 'checkOnly': check}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build(check=args.check)))
