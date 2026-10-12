#!/usr/bin/env python3
"""Bind the observed localization proof without duplicating its large polynomial record."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[4]
BASE = Path('research-ide/mathscope-m3/navier')
ATTEMPT = BASE / 'evidence/source-localization-operator-20261012/attempt1'
TARGET = BASE / 'source-localization-operator-evidence-data.mjs'
RECEIPT_SHA256 = '5795edbba6a0ef7db696699f717eba90120c485daf1ebed6adf8f51cfc67c16f'
ARTIFACT_SHA256 = '2ec87463df11b4ac83add61e804fbfce01b067d3ea29e4356e587be70dcc3359'
PROOF_SHA256 = '33f32d13dcd8e6c2d9122e936fa007f83da319ad122f72a9990e6dad9bc2370e'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pin(path, root=ROOT):
    return {'path': str(path.relative_to(root)), 'sha256': sha(path), 'bytes': path.stat().st_size}


def verified_file(root, row):
    relative = Path(row['path'])
    path = (root / relative).resolve()
    if relative.is_absolute() or '..' in relative.parts or not str(relative).startswith('research-ide/') or not path.is_relative_to(root):
        raise ValueError('A localization-proof path escapes the repository.')
    if pin(path, root) != {key: row[key] for key in ['path', 'sha256', 'bytes']}:
        raise ValueError('An executed source or observed artifact changed: ' + str(relative))
    if 'fileCount' in row and len(json.loads(path.read_text())['after']) != row['fileCount']:
        raise ValueError('The inherited source capture count changed: ' + str(relative))
    return path.read_bytes()


def javascript_digest(value):
    code = """import {createHash} from 'node:crypto';let raw='';for await(const c of process.stdin)raw+=c;
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
process.stdout.write(createHash('sha256').update(canonical(JSON.parse(raw))).digest('hex'));"""
    return subprocess.check_output(['node', '--input-type=module', '-e', code], input=json.dumps(value, ensure_ascii=False), text=True).strip()


def archive(root=ROOT):
    root = Path(root).resolve()
    folder = root / ATTEMPT
    receipt_path, artifact_path = folder / 'receipt.json', folder / 'localization-operator.json'
    if sha(receipt_path) != RECEIPT_SHA256 or sha(artifact_path) != ARTIFACT_SHA256:
        raise ValueError('The fixed successful localization proof receipt or artifact changed.')
    receipt = json.loads(receipt_path.read_text())
    if not (receipt['schema'] == 'MathScope.N7.LocalizationOperatorObservedGate/1' and receipt['attempt'] == 1
            and receipt['pass'] is True and receipt['exitCode'] == 0 and receipt['error'] is None
            and receipt['nodeTests'] == {'passed': 10, 'failed': 0, 'skipped': 0}
            and receipt['independentStatus'] == 'PASS' and receipt['independentCheckCount'] == 55
            and receipt['sourceFileCount'] == 13 and receipt['sourceFilesUnchanged'] is True
            and receipt['inheritedNearTerminalAndDomainArchivesReverified'] is True
            and receipt['freshFullSourceConstructorExecuted'] is False and receipt['newLeanExecuted'] is False):
        raise ValueError('The observed localization gate does not pass with the required scope.')
    for row in receipt['artifacts']:
        verified_file(root, row)
    capture = json.loads((folder / 'source-bytes.json').read_text())
    before = json.loads((folder / 'source-bytes-before.json').read_text())
    if not (capture['unchanged'] is True and capture['before'] == capture['after'] == before['files']
            and len(capture['after']) == before['fileCount'] == receipt['sourceFileCount']
            and len({row['path'] for row in capture['after']}) == receipt['sourceFileCount']):
        raise ValueError('The complete localization-proof source capture does not match.')
    for row in capture['after']:
        verified_file(root, row)
    log = (folder / 'node.log').read_text()
    if len(re.findall(r'^ok \d+ - ', log, re.M)) != 10 or re.search(r'^not ok ', log, re.M):
        raise ValueError('The raw proof log does not contain ten passing tests.')
    independent = json.loads((folder / 'independent-exact.json').read_text())
    if independent['status'] != 'PASS' or len(independent['checks']) != 55 or not all(row['pass'] for row in independent['checks']):
        raise ValueError('The independent exact localization checks are incomplete.')
    proof = json.loads(artifact_path.read_text())
    if proof['proofSHA256'] != PROOF_SHA256 or javascript_digest({k: v for k, v in proof.items() if k != 'proofSHA256'}) != PROOF_SHA256:
        raise ValueError('The complete observed polynomial proof identity changed.')
    if not (len(proof['cutoffReplay']['checks']) == 18 and len(proof['algebra']['checks']) == 8
            and all(row['pass'] for row in proof['cutoffReplay']['checks'] + proof['algebra']['checks'])
            and len(proof['algebra']['commutators']) == 10 and len(proof['algebra']['negativeControls']) == 14
            and all(row['nonzero'] for row in proof['algebra']['negativeControls'])
            and proof['freshExactOperatorProofExecuted'] is True and proof['freshFullSourceConstructorExecuted'] is False):
        raise ValueError('An actual cutoff, operator, or omission-control obligation is missing.')
    for key in ['fullFinalN6FieldNumericallyConstructed', 'wholeLocalizedForceValuesComputed', 'wholeGlobalTerminalJetsComputed',
                'wholeKEnergyComputed', 'globalForceExtensionConstructed', 'wholeN7Complete', 'wholeM3Complete', 'newLeanExecuted']:
        if proof['proofScope'][key] is not False:
            raise ValueError('The observed operator-only proof scope was enlarged: ' + key)
    for row in proof['sourceEvidence'].values():
        if isinstance(row, dict) and 'path' in row:
            verified_file(root, row)
    for row in proof['sourceEvidence']['sourceFiles']:
        verified_file(root, row)
    return {'schema': 'MathScope.N7.LocalizationOperatorProofArchive/1',
            'receipt': pin(receipt_path, root), 'artifact': pin(artifact_path, root), 'gate': receipt,
            'sourceCapture': pin(folder / 'source-bytes.json', root), 'sourceFiles': capture['after'],
            'proofSHA256': PROOF_SHA256, 'sourceBinding': proof['sourceBinding'], 'proofScope': proof['proofScope'],
            'independentVerification': independent,
            'proofCounts': {'cutoffIdentities': 18, 'differentialIdentities': 8, 'commutatorFamilies': 10, 'negativeControls': 14},
            'sourceValidation': {'allExecutedSourceBytesMatch': True, 'allObservedArtifactsMatch': True,
                                 'completePolynomialProofCanonicalIdentityMatches': True,
                                 'historicalMeasurementArtifactsUnchanged': True, 'freshFullSourceConstructorExecuted': False}}


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
    output = ('// Generated observed proof receipt. The full polynomial proof is freshly replayed and hash-matched.\n'
              'export const SOURCE_LOCALIZATION_OPERATOR_ARCHIVE_SHA256 = ' + json.dumps(digest) + ';\n'
              'export const SOURCE_LOCALIZATION_OPERATOR_ARCHIVE = ' + encoded + ';\n')
    target = root / TARGET
    if check:
        if not target.is_file() or target.read_text() != output:
            raise ValueError('The localization-operator proof archive is stale.')
    else:
        target.write_text(output, encoding='utf-8', newline='\n')
    return {'schema': 'MathScope.N7.LocalizationOperatorProofArchiveBuild/1', 'archiveSHA256': digest,
            'proofSHA256': PROOF_SHA256, 'generatedBytes': len(output.encode()), 'sourceFileCount': 13,
            'sourceFilesUnchanged': True, 'sourceReceipt': record['receipt'], 'proofArtifact': record['artifact'],
            'output': pin(target, root), 'freshFullSourceConstructorExecuted': False, 'check': check}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build(check=args.check), ensure_ascii=False, indent=2))
