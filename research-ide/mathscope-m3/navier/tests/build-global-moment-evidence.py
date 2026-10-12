"""Bind the observed all-label moment execution to a compact browser archive.

The complete 6.7 MB source artifact stays in the repository. The browser
archive contains the actual moment/pressure result and a declared summary of
its inherited current. Reopening it never reruns the private source graph.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import re

ROOT = Path(__file__).resolve().parents[4]
BASE = Path('research-ide/mathscope-m3/navier')
ATTEMPT = BASE / 'evidence/global-moment-20261012/attempt1'
RECEIPT = ATTEMPT / 'receipt.json'
TARGET = BASE / 'source-global-moment-evidence-data.mjs'
RECEIPT_SHA = '62aa3f5d411e833fac4b52848b2564e9e8630974ed041e3d4614bbe9379a8724'
ARTIFACT_SHA = 'ca1b911e24df5d1ab4f0d947eecc09e01d0d6db2f841d39658ffc76a6d00df27'
SPEC = importlib.util.spec_from_file_location('source_archive_bytes', ROOT / BASE / 'tests/build-near-terminal-evidence.py')
SHARED = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SHARED)


def archive(root=ROOT):
    root = Path(root)
    raw = (root / RECEIPT).read_bytes()
    if hashlib.sha256(raw).hexdigest() != RECEIPT_SHA:
        raise ValueError('The fixed observed moment receipt changed')
    receipt = json.loads(raw)
    if not (receipt['pass'] is True and receipt['exitCode'] == 0 and receipt['stoppedReason'] is None
            and receipt['nodeTests'] == {'passed': 12, 'failed': 0, 'skipped': 0}
            and receipt['sourceFilesUnchanged'] is True and receipt['sourceFileCount'] == 117
            and receipt['actualAllLabelPJFedToOriginalFiveBumps'] is True
            and receipt['actualNonlinearMeanAndPressureRecomputed'] is True
            and all(receipt[key] is False for key in ['temporalMeanInverseApplied', 'initializedJ0',
                'fullNonzeroAuxiliaryPressureConstructed', 'completeN6', 'newLeanExecuted', 'wholeM3Complete'])):
        raise ValueError('The original moment gate or scope is not passing')
    refs = {Path(row['path']).name: row for row in receipt['artifacts']}
    expected = {'node.log', 'source-bytes-before.json', 'source-bytes.json', 'global-source-moment-kernel.test.mjs',
                'global-source-moment.test.mjs', 'run-global-moment.py', 'source-global-moment.mjs', 'global-moment.json'}
    if set(refs) != expected or len(receipt['artifacts']) != len(expected):
        raise ValueError('The complete eight observed artifacts are required')
    contents = {name: SHARED.verified_file(root, row) for name, row in refs.items()}
    capture, before = json.loads(contents['source-bytes.json']), json.loads(contents['source-bytes-before.json'])
    rows = capture['before']
    if not (capture['unchanged'] is True and rows == capture['after'] == before['files']
            and len(rows) == before['fileCount'] == 117 and len({row['path'] for row in rows}) == 117):
        raise ValueError('The exact source dependency capture changed')
    for row in rows:
        SHARED.verified_file(root, row)
    log = contents['node.log'].decode('utf-8')
    if len(re.findall(r'^ok \d+ - ', log, re.M)) != 12 or re.search(r'^not ok ', log, re.M):
        raise ValueError('The actual raw source log is not twelve passing tests')
    raw_certificate = contents['global-moment.json']
    if hashlib.sha256(raw_certificate).hexdigest() != ARTIFACT_SHA:
        raise ValueError('The observed full moment artifact changed')
    c = json.loads(raw_certificate)
    if not (c['schema'] == 'MathScope.N6.GlobalActualMomentCurrent/1'
            and len(c['checks']) == 20 and all(row['pass'] is True for row in c['checks'])
            and c['graph']['nodeCount'] == 635044 and c['numericalValuesOrEnclosures'] is False
            and c['scope']['actualAllLabelTargetsUsed'] is True
            and c['scope']['actualCompleteMeanResidualAndPressureRecomputed'] is True
            and c['scope']['temporalMeanInverseApplied'] is False and c['scope']['initializedJ0'] is False):
        raise ValueError('The actual five-moment computation or its scope changed')
    summary = {key: value for key, value in c.items() if key != 'sourceCurrent'}
    summary['recordedCertificateSchema'] = summary.pop('schema')
    summary['schema'] = 'MathScope.N6.GlobalMomentArchiveSummary/1'
    current_keys = ['schema', 'source', 'domain', 'covariance', 'mean', 'target', 'checks', 'scope', 'graph',
                    'execution', 'numericalValuesOrEnclosures']
    summary['sourceCurrentSummary'] = {key: c['sourceCurrent'][key] for key in current_keys}
    summary['omittedInheritedCurrentKeys'] = [key for key in c['sourceCurrent'] if key not in current_keys]
    return {'schema': 'MathScope.N6.GlobalMomentArchive/1',
            'receipt': {'path': str(RECEIPT), 'sha256': RECEIPT_SHA, 'bytes': len(raw)},
            'artifact': refs['global-moment.json'], 'artifacts': receipt['artifacts'],
            'fullArtifactEmbedded': False, 'sourceSummaryOnly': True,
            'fullArtifactURL': 'https://github.com/leegahuyn/MathScopeCompute/blob/mathscope-m3-resume-20261012/' + refs['global-moment.json']['path'],
            'gate': {**{key: receipt[key] for key in ['command', 'exitCode', 'elapsedSeconds', 'nodeTests', 'startedAt',
                        'finishedAt', 'nodeResourceUsagePeakRSSBytes', 'sourceFileCount']},
                     'freshlyExecutedByArchiveConsumer': False},
            'sourceDependencyCapture': {**refs['source-bytes.json'], 'fileCount': len(rows)},
            'sourceValidation': {'mode': 'BUILD_TIME_BYTE_VERIFICATION', 'allCapturedSourceFilesMatch': True,
                                 'allRecordedArtifactBytesMatch': True, 'browserHasReexecutedConstructor': False},
            'summary': summary,
            'scope': {'actualAllLabelMomentExecutionRecorded': True, 'temporalMeanInverseApplied': False,
                      'initializedJ0': False, 'fullNonzeroAuxiliaryPressureConstructed': False,
                      'numericFieldEnclosure': False, 'completeN6': False, 'wholeM3Complete': False}}


def source_paths(root=ROOT):
    value = archive(root)
    capture = json.loads((Path(root) / value['sourceDependencyCapture']['path']).read_bytes())
    return [Path(root) / RECEIPT] + [Path(root) / row['path'] for row in value['artifacts'] + capture['before']]


def build(root=ROOT, check=False):
    value = archive(root)
    sha = SHARED.javascript_digest(value)
    output = ('// Generated from the actual all-label moment gate; do not edit.\n'
              'export const GLOBAL_MOMENT_ARCHIVE_SHA256 = ' + json.dumps(sha) + ';\n'
              'export const GLOBAL_MOMENT_ARCHIVE = ' + json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False) + ';\n')
    target = Path(root) / TARGET
    if check:
        if not target.exists() or target.read_text(encoding='utf-8') != output:
            raise ValueError('Stale generated global moment archive')
    else:
        target.write_text(output, encoding='utf-8', newline='\n')
    return {'archiveSHA256': sha, 'generatedBytes': len(output.encode()), 'sourceFiles': 117,
            'sourceTests': 12, 'sourceGraphNodes': 635044, 'fullArtifactEmbedded': False, 'checkOnly': check}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build(check=args.check)))
