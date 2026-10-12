#!/usr/bin/env python3
"""Pin the actually executed original comparison review and its independent gate."""
from pathlib import Path
import argparse
import importlib.util
import json
import re

ROOT = Path(__file__).resolve().parents[4]
BASE = Path('research-ide/mathscope-m3/navier')
ATTEMPT = BASE / 'evidence/source-periodization-review-20261012/attempt2'
TARGET = BASE / 'source-periodization-review-evidence-data.mjs'
RECEIPT_SHA = '1b94d82a1b65368c541af0c5ad73bedfcb4cf09d46c0fc41d5dddf60df8718dc'
ARTIFACT_SHA = 'daa66c435dc832bad729a6573828d126cf2223e962aa52e63b88117261893226'
PROOF_SHA = '294482c11e426efff3187b7b7abfeb8dd8dfc673ef4f26e577d6dc03adb35cd5'
HELPER = BASE / 'tests/build-localization-operator-evidence.py'


def helpers(root):
    spec = importlib.util.spec_from_file_location('localization_fixed_proof_package_helpers', root / HELPER)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def archive(root=ROOT):
    root = Path(root).resolve()
    h = helpers(root)
    folder = root / ATTEMPT
    receipt_path, artifact_path = folder / 'receipt.json', folder / 'periodization-review.json'
    if h.sha(receipt_path) != RECEIPT_SHA or h.sha(artifact_path) != ARTIFACT_SHA:
        raise ValueError('The fixed observed periodization gate changed.')
    receipt, proof = [json.loads(p.read_text()) for p in [receipt_path, artifact_path]]
    if not (receipt['pass'] is True and receipt['exitCode'] == 0 and receipt['nodeTests'] == {'passed': 5, 'failed': 0, 'skipped': 0}
            and receipt['independentStatus'] == 'PASS' and receipt['independentCheckCount'] == 33
            and receipt['sourceFilesUnchanged'] is True and receipt['sourceFileCount'] == 17):
        raise ValueError('The observed periodization proof or independent check is incomplete.')
    for row in receipt['artifacts']:
        h.verified_file(root, row)
    capture = json.loads((folder / 'source-bytes.json').read_text())
    before = json.loads((folder / 'source-bytes-before.json').read_text())
    if not (capture['unchanged'] is True and capture['before'] == capture['after'] == before['files']
            and len(capture['after']) == before['fileCount'] == 17 and len({r['path'] for r in capture['after']}) == 17):
        raise ValueError('The periodization review source capture changed.')
    for row in capture['after']:
        h.verified_file(root, row)
    if len(re.findall(r'^ok \d+ - ', (folder / 'node.log').read_text(), re.M)) != 5:
        raise ValueError('The raw observed periodization log changed.')
    independent = json.loads((folder / 'independent-exact.json').read_text())
    if independent['status'] != 'PASS' or len(independent['checks']) != 33 or not all(row['pass'] for row in independent['checks']):
        raise ValueError('The independent full Cartesian scaling proof is incomplete.')
    if proof['proofSHA256'] != PROOF_SHA or h.javascript_digest({k: v for k, v in proof.items() if k != 'proofSHA256'}) != PROOF_SHA:
        raise ValueError('The complete original comparison proof canonical identity changed.')
    if not (len(proof['checks']) == 24 and all(row['pass'] for row in proof['checks'])
            and len(proof['transport']['checks']) == 16 and len(proof['translations']['fullMixedAdvectionTerms']) == 18
            and len(proof['comparison']['hypotheses']) == 6 and all(row['required'] for row in proof['comparison']['hypotheses'])):
        raise ValueError('An original transport or comparison hypothesis was omitted.')
    for key in ['completeGlobalForceConstructed', 'wholeKEnergyComputed', 'unconditionalCConclusionIssued', 'unconditionalDConclusionIssued',
                'finalNonzeroN6FieldsNumericallyConstructed', 'wholeM3Complete', 'newLeanExecuted']:
        if proof['scope'][key] is not False:
            raise ValueError('The conditional comparison review scope was enlarged: ' + key)
    for row in proof['sourceArtifacts'].values():
        h.verified_file(root, row)
    return {'schema': 'MathScope.N7.PeriodizationReviewArchive/1', 'receipt': h.pin(receipt_path, root),
            'artifact': h.pin(artifact_path, root), 'gate': receipt, 'sourceCapture': h.pin(folder / 'source-bytes.json', root),
            'sourceFiles': capture['after'], 'proofSHA256': PROOF_SHA, 'sourceBinding': proof['sourceBinding'],
            'scope': proof['scope'], 'independentVerification': independent,
            'sourceValidation': {'allObservedArtifactsMatch': True, 'allExecutedSourceBytesMatch': True,
                                 'completeProofCanonicalIdentityMatches': True, 'freshFullSourceConstructorExecuted': False}}


def source_paths(root=ROOT):
    root = Path(root).resolve()
    a = archive(root)
    rows = [a['receipt']] + a['gate']['artifacts'] + a['sourceFiles']
    return sorted({root / row['path'] for row in rows} | {root / HELPER, Path(__file__).resolve()})


def build(root=ROOT, check=False):
    root = Path(root).resolve()
    h, a = helpers(root), archive(root)
    digest = h.javascript_digest(a)
    text = ('// Observed original comparison review; fresh full proof output must match its canonical identity.\n'
            'export const SOURCE_PERIODIZATION_REVIEW_ARCHIVE_SHA256 = ' + json.dumps(digest) + ';\n'
            'export const SOURCE_PERIODIZATION_REVIEW_ARCHIVE = ' + json.dumps(a, ensure_ascii=False, separators=(',', ':')) + ';\n')
    target = root / TARGET
    if check:
        if not target.is_file() or target.read_text() != text:
            raise ValueError('The periodization review archive is stale.')
    else:
        target.write_text(text, encoding='utf-8', newline='\n')
    return {'schema': 'MathScope.N7.PeriodizationReviewArchiveBuild/1', 'archiveSHA256': digest, 'proofSHA256': PROOF_SHA,
            'generatedBytes': len(text.encode()), 'sourceFileCount': 17, 'sourceFilesUnchanged': True,
            'sourceReceipt': a['receipt'], 'proofArtifact': a['artifact'], 'output': h.pin(target, root), 'check': check}


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--check', action='store_true')
    args = p.parse_args()
    print(json.dumps(build(check=args.check), ensure_ascii=False, indent=2))
