"""Verify delivered historical M4 source bytes against a repository and review record."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import subprocess


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', default=os.environ.get('MATHSCOPE_SOURCE_REPO'))
    parser.add_argument('--out', type=Path)
    args = parser.parse_args()
    if not args.repo:
        parser.error('Set --repo or MATHSCOPE_SOURCE_REPO to a checkout containing the pinned commit.')
    root = Path(__file__).resolve().parent
    record = json.loads((root / 'independent-current-review.json').read_text(encoding='utf8'))
    revision = record['sourceCommit']
    result = {}
    for path, expected in record['pinnedSourceFiles'].items():
        pinned = subprocess.check_output(['git', 'show', revision + ':' + path], cwd=args.repo)
        snapshot = (root / 'source' / path).read_bytes()
        if digest(pinned) != expected['pinnedSHA256']:
            raise ValueError('Pinned source digest mismatch: ' + path)
        if digest(snapshot) != expected['snapshotSHA256']:
            raise ValueError('Delivered snapshot digest mismatch: ' + path)
        result[path] = {'pinnedSHA256': digest(pinned), 'snapshotSHA256': digest(snapshot),
                        'matchesPinned': snapshot == pinned}
    builder = root / 'source/research-ide/mathscope-m4/web/original-builder.py'
    builder_key = 'research-ide/mathscope-m4/web/build-release-lab.py'
    if digest(builder.read_bytes()) != result[builder_key]['pinnedSHA256']:
        raise ValueError('Original builder digest mismatch')
    bundle_sha = digest((root / 'proof-editor-bundle.js').read_bytes())
    if bundle_sha != record['bundleSHA256']:
        raise ValueError('Editor bundle digest mismatch')
    report = {'status': 'PASS_SOURCE_DIGESTS_ONLY', 'sourceCommit': revision,
              'files': result, 'bundleSHA256': bundle_sha,
              'scope': 'Byte provenance only; no browser rerun or mathematical certification.'}
    text = json.dumps(report, indent=2)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text, encoding='utf8')
    print(text)


if __name__ == '__main__':
    main()
