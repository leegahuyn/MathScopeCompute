#!/usr/bin/env python3
"""Package the observed small support proof, preserving the large source runs."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[4]
BASE = Path('research-ide/mathscope-m3/navier')
ATTEMPT = BASE / 'evidence/source-core-restriction-20261012/attempt1'
TARGET = BASE / 'source-core-restriction-evidence-data.mjs'
RECEIPT_SHA256 = '7c344632700bc9f168bfc5a8b722864e9416fbfc42cff2ad2c042e7c923928b5'
ARTIFACT_SHA256 = 'a669b4bad5cde239954f445a131f4d967f090a252fe1ae4cd5d047df7eb6d4f5'
PROOF_SHA256 = '19f0b3976e9a616372ea6f515c0cdeefcc65946a2afb48e69cd4cf1898d25839'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pin(path, root=ROOT):
    return {'path': str(path.relative_to(root)), 'sha256': sha(path), 'bytes': path.stat().st_size}


def verified_file(root, row):
    relative = Path(row['path'])
    path = (root / relative).resolve()
    if relative.is_absolute() or '..' in relative.parts or not str(relative).startswith('research-ide/') or not path.is_relative_to(root):
        raise ValueError('A recorded support-proof path escapes the repository.')
    if pin(path, root) != row:
        raise ValueError('Executed proof source or inherited artifact changed: ' + str(relative))
    return path.read_bytes()


def javascript_digest(value):
    code = """import {createHash} from 'node:crypto';let raw='';for await(const c of process.stdin)raw+=c;
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
process.stdout.write(createHash('sha256').update(canonical(JSON.parse(raw))).digest('hex'));"""
    return subprocess.check_output(['node', '--input-type=module', '-e', code], input=json.dumps(value, ensure_ascii=False), text=True).strip()


def archive(root=ROOT):
    root = Path(root).resolve()
    folder = root / ATTEMPT
    receipt_path, artifact_path = folder / 'receipt.json', folder / 'core-restriction.json'
    if sha(receipt_path) != RECEIPT_SHA256 or sha(artifact_path) != ARTIFACT_SHA256:
        raise ValueError('The fixed successful observed support-proof receipt or artifact changed.')
    receipt = json.loads(receipt_path.read_text())
    if not (receipt['schema'] == 'MathScope.N7.CoreRestrictionObservedProof/1' and receipt['attempt'] == 1
            and receipt['pass'] is True and receipt['exitCode'] == 0 and receipt['timeout'] is False
            and receipt['nodeTests'] == {'passed': 16, 'failed': 0, 'skipped': 0}
            and receipt['independentStatus'] == 'PASS' and receipt['independentCheckCount'] == 41
            and receipt['sourceFileCount'] == 156 and receipt['sourceFilesUnchanged'] is True
            and receipt['inheritedArchiveBytesVerifiedBeforeAndAfter'] is True
            and receipt['newSupportProofExecuted'] is True and receipt['freshSourceConstructorExecuted'] is False):
        raise ValueError('The observed support-proof gate does not pass with the required scope.')
    for row in receipt['artifacts']:
        verified_file(root, row)
    capture = json.loads((folder / 'source-bytes.json').read_text())
    before = json.loads((folder / 'source-bytes-before.json').read_text())
    if not (capture['unchanged'] is True and capture['before'] == capture['after'] == before['files']
            and len(capture['after']) == before['fileCount'] == receipt['sourceFileCount']
            and len({row['path'] for row in capture['after']}) == receipt['sourceFileCount']):
        raise ValueError('The complete proof/inherited-source capture does not match.')
    for row in capture['after']:
        verified_file(root, row)
    log = (folder / 'node.log').read_text()
    if len(re.findall(r'^ok \d+ - ', log, re.M)) != 16 or re.search(r'^not ok ', log, re.M):
        raise ValueError('The raw observed proof log does not contain sixteen passing tests.')
    independent = json.loads((folder / 'independent-exact.json').read_text())
    if independent['status'] != 'PASS' or len(independent['checks']) != 41 or not all(row['pass'] for row in independent['checks']):
        raise ValueError('The independent exact proof checks are incomplete.')
    certificate = json.loads(artifact_path.read_text())
    if certificate['proofSHA256'] != PROOF_SHA256 or receipt['proofSHA256'] != PROOF_SHA256:
        raise ValueError('The actual source-bound support proof identity changed.')
    unhashed = {key: value for key, value in certificate.items() if key != 'proofSHA256'}
    if javascript_digest(unhashed) != PROOF_SHA256:
        raise ValueError('The support proof no longer hashes to the observed canonical identity.')
    if not all(row['pass'] for row in certificate['checks'] + certificate['supportInduction']['checks']):
        raise ValueError('A source or support proof premise is missing.')
    for key in ['fullFinalN6FieldConstructed', 'nonzeroCorrectionFieldsConstructed', 'allSpaceVelocityEvaluator',
                'wholeLocalizedForceConstructed', 'wholeKEnergyNearTerminalComputed', 'globalForceExtensionConstructed', 'wholeM3Complete']:
        if certificate['scope'][key] is not False:
            raise ValueError('The support-only proof scope was enlarged: ' + key)
    for row in certificate['sourceArtifacts'].values():
        verified_file(root, row)
    return {'schema': 'MathScope.N7.CoreRestrictionProofArchive/1',
            'receipt': pin(receipt_path, root), 'artifact': pin(artifact_path, root), 'gate': receipt,
            'sourceCapture': pin(folder / 'source-bytes.json', root), 'sourceFiles': capture['after'],
            'certificate': certificate, 'independentVerification': independent,
            'sourceValidation': {'allExecutedProofAndInheritedSourceBytesMatch': True, 'allObservedArtifactsMatch': True,
                                 'historicalMeasurementArtifactsUnchanged': True, 'freshSourceConstructorExecuted': False},
            'scope': {'recordedSourceMeasurements': True, 'observedNewSupportProofExecuted': True,
                      'freshSourceConstructorExecuted': False, 'newLeanExecuted': False,
                      'fullFinalN6FieldConstructed': False, 'allSpaceVelocityEvaluator': False,
                      'wholeLocalizedForceConstructed': False, 'wholeKEnergyNearTerminalComputed': False,
                      'globalForceExtensionConstructed': False, 'wholeM3Complete': False}}


def source_paths(root=ROOT):
    root = Path(root).resolve()
    record = archive(root)
    rows = [record['receipt']] + record['gate']['artifacts'] + record['sourceFiles']
    return sorted({root / row['path'] for row in rows} | {Path(__file__).resolve()})


def build(root=ROOT, check=False):
    root = Path(root).resolve()
    record = archive(root)
    digest = javascript_digest(record)
    encoded = json.dumps(record, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
    output = ('// Generated from the observed source-bound support proof. The original measurement archives remain unchanged.\n'
              'export const SOURCE_CORE_RESTRICTION_ARCHIVE_SHA256 = ' + json.dumps(digest) + ';\n'
              'export const SOURCE_CORE_RESTRICTION_ARCHIVE = ' + encoded + ';\n')
    target = root / TARGET
    if check:
        if not target.is_file() or target.read_text() != output:
            raise ValueError('The generated core-restriction proof archive is stale.')
    else:
        target.write_text(output, encoding='utf-8', newline='\n')
    return {'schema': 'MathScope.N7.CoreRestrictionProofArchiveBuild/1', 'sourceAttempt': 1,
            'archiveSHA256': digest, 'archiveCanonicalSHA256': digest, 'proofSHA256': PROOF_SHA256,
            'generatedBytes': len(output.encode()), 'sourceFiles': record['gate']['sourceFileCount'],
            'sourceFileCount': record['gate']['sourceFileCount'], 'sourceFilesUnchanged': True,
            'sourceReceipt': record['receipt'], 'proofArtifact': record['artifact'], 'output': pin(target, root),
            'newSupportProofObserved': True, 'freshSourceConstructorExecuted': False, 'check': check}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build(check=args.check), ensure_ascii=False, indent=2))
