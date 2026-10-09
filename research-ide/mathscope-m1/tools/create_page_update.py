#!/usr/bin/env python3
"""Prepare two exact WebsitePublisher replacements from preserved local sources.

This command never fetches, uploads, or deploys a page. It does not use a fetched
HTML body, whose opaque values may be redacted. The caller must obtain a fresh
page version hash and submit the resulting request through WebsitePublisher.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def script(source):
    return '<script id="mathscope-m1-js">\n' + source.replace('</script', '<\\/script') + '\n</script>'


def kind_clause(source):
    lines = [line for line in source.splitlines() if line.strip().startswith('const kinds={')]
    if len(lines) != 1:
        raise ValueError('Expected one exact M0 domain-kind clause')
    return lines[0]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--old-app', type=Path, required=True)
    ap.add_argument('--old-contracts', type=Path, required=True)
    ap.add_argument('--base-version-hash', required=True)
    ap.add_argument('--summary', required=True)
    ap.add_argument('--output', type=Path, required=True)
    args = ap.parse_args()
    if not re.fullmatch(r'[0-9a-fA-F]{8,64}', args.base_version_hash):
        raise ValueError('A fresh hexadecimal WebsitePublisher version hash is required')
    current = ROOT / 'mathscope-m1/workspace.bundle.js'
    current_contracts = ROOT / 'mathscope-m0/contracts.mjs'
    build = json.loads((ROOT / 'mathscope-m1/build-manifest.json').read_text())
    if sha(current) != build['bundleSha256']:
        raise ValueError('The application bundle does not match its build manifest')
    changed = [name for name, digest in build['sourceFiles'].items() if sha(ROOT / name) != digest]
    if changed:
        raise ValueError('Rebuild after source edits: ' + ', '.join(changed))
    old_app = args.old_app.read_text()
    new_app = current.read_text()
    if old_app == new_app:
        raise ValueError('There is no application change to deploy')
    patches = [{'operation': 'replace', 'find': script(old_app), 'replace': script(new_app)}]
    old_clause = kind_clause(args.old_contracts.read_text())
    new_clause = kind_clause(current_contracts.read_text())
    if old_clause != new_clause:
        # The application replacement runs first, leaving the one live M0 clause.
        patches.append({'operation': 'replace', 'find': old_clause, 'replace': new_clause})
    request = {'project_id': 29770, 'slug': 'v0.3.1.html',
               'base_version_hash': args.base_version_hash,
               'patch_summary': args.summary, 'patches': patches}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(request, ensure_ascii=False) + '\n')
    meta = {'schema': 'MathScope.ExactPageUpdate/1', 'requestFile': str(args.output),
            'baseVersionHash': args.base_version_hash, 'patches': len(patches),
            'oldAppSha256': sha(args.old_app), 'newAppSha256': sha(current),
            'oldContractsSha256': sha(args.old_contracts),
            'newContractsSha256': sha(current_contracts),
            'requestSha256': sha(args.output), 'requestBytes': args.output.stat().st_size,
            'requestCharacters': len(args.output.read_text()), 'deployed': False,
            'sourcePolicy': 'Exact preserved local scripts; no fetched HTML replacement'}
    args.output.with_suffix('.metadata.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(meta, ensure_ascii=False))


if __name__ == '__main__':
    main()
