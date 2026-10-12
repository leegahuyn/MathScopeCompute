"""Verify or restore large observed artifacts without changing their receipts.

The GitHub connector accepts requests smaller than 16 MiB. Lossless gzip keeps
the original artifact's exact bytes and SHA-256 available in a smaller Git blob.
Every packed artifact is checked against its original execution receipt.
"""
from pathlib import Path
import argparse
import gzip
import hashlib
import json

ROOT = Path(__file__).resolve().parents[4]
MANIFEST = ROOT / 'research-ide/mathscope-m3/navier/evidence/packed-evidence.json'


def checked_path(value):
    path = (ROOT / value).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError('Evidence path escapes the repository')
    return path


def digest(data):
    return hashlib.sha256(data).hexdigest()


def verify(materialize=False):
    manifest = json.loads(MANIFEST.read_bytes())
    if manifest['schema'] != 'MathScope.LosslessEvidencePacking/1':
        raise ValueError('Unknown packed evidence manifest')
    checked = []
    for item in manifest['artifacts']:
        receipt_bytes = checked_path(item['receipt']['path']).read_bytes()
        if digest(receipt_bytes) != item['receipt']['sha256']:
            raise ValueError('Original execution receipt changed')
        receipt = json.loads(receipt_bytes)
        original = item['original']
        if original not in receipt['artifacts']:
            raise ValueError('Packed bytes are not the artifact in the original receipt')
        packed = checked_path(item['packed']['path']).read_bytes()
        if len(packed) != item['packed']['bytes'] or digest(packed) != item['packed']['sha256']:
            raise ValueError('Packed artifact bytes changed')
        raw = gzip.decompress(packed)
        if len(raw) != original['bytes'] or digest(raw) != original['sha256']:
            raise ValueError('Decompressed artifact differs from the observed original')
        target = checked_path(original['path'])
        if target.exists() and target.read_bytes() != raw:
            raise ValueError('Existing unpacked artifact differs; refusing to overwrite it')
        if materialize and not target.exists():
            target.write_bytes(raw)
        checked.append({'path': original['path'], 'sha256': original['sha256'],
                        'bytes': len(raw), 'packedBytes': len(packed),
                        'exactOriginalBytesVerified': True,
                        'unpackedFilePresent': target.exists()})
    return {'schema': 'MathScope.LosslessEvidenceVerification/1', 'pass': True,
            'materializeRequested': materialize, 'artifacts': checked}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--materialize', action='store_true')
    args = parser.parse_args()
    print(json.dumps(verify(args.materialize), ensure_ascii=False, indent=2))
