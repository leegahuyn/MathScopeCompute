"""Record this task's reviewed files while preserving every baseline entry.

The immutable PR28 manifest is stored as an input lock before any edits.
Only this task's new implementation/evidence roots may change their rows.
Original-source, addon, translation and original criterion sections must be
identical to the baseline. Hash Git blobs to avoid Windows EOL conversions.
"""
import hashlib
import gzip
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile

REPO = Path(__file__).resolve().parents[3]
ROOT = REPO / 'research-ide'
HERE = Path(__file__).resolve().parent
ALLOWED_NEW_ROOTS = ['mathscope-m3/n6-unconditional-20261014/', 'mathscope-m3/evidence/n6-unconditional-20261014/']

def main():
    lock = json.loads((HERE / 'INPUT_LOCK.json').read_text(encoding='utf8'))
    baseline_path = REPO / lock['baselineEditionManifest']['path']
    raw = baseline_path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != lock['baselineEditionManifest']['sha256']:
        raise ValueError('Changed baseline release manifest')
    raw = gzip.decompress(raw)
    if len(raw) != lock['baselineEditionManifest']['payloadBytes'] or hashlib.sha256(raw).hexdigest() != lock['baselineEditionManifest']['payloadSHA256']:
        raise ValueError('Changed baseline manifest payload')
    baseline = json.loads(raw)
    current_path = ROOT / 'SOURCE_TRANSLATION_MANIFEST.json'
    current = json.loads(current_path.read_text(encoding='utf8'))
    for key, value in baseline.items():
        if key not in ['editionArtifacts', 'editionArtifactCount'] and current.get(key) != value:
            raise ValueError('Refuse modified baseline source/translation/addon section: ' + key)
    old = {row['path']: row for row in baseline['editionArtifacts']}
    spec = importlib.util.spec_from_file_location('edition_verifier', ROOT / 'tools/verify_english_release.py')
    verifier = importlib.util.module_from_spec(spec)
    sys.path.insert(0, str(ROOT / 'tools'))
    spec.loader.exec_module(verifier)
    files = verifier.edition_files()
    index = {}
    for row in subprocess.check_output(['git', 'ls-files', '--stage', '-z', '--', 'research-ide'], cwd=REPO).split(b'\0'):
        if not row:
            continue
        information, path = row.split(b'\t', 1)
        mode, oid, stage = information.split()
        if stage != b'0':
            raise ValueError('Unmerged source index')
        index[path.decode().removeprefix('research-ide/')] = oid.decode()
    if set(files) - set(index):
        raise ValueError('Stage all reviewed files before refreshing the manifest')
    if set(old) - set(files):
        raise ValueError('A baseline edition file was removed')
    if any(not any(name.startswith(root) for root in ALLOWED_NEW_ROOTS) for name in set(files) - set(old)):
        raise ValueError('Unexpected file outside this authorized task')
    rows = []
    with tempfile.TemporaryFile(dir=REPO.parent) as requests:
        requests.write(''.join(index[name] + '\n' for name in sorted(files)).encode())
        requests.seek(0)
        process = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=REPO, stdin=requests, stdout=subprocess.PIPE)
        for name in sorted(files):
            size = int(process.stdout.readline().split()[-1])
            remaining = size
            digest = hashlib.sha256()
            while remaining:
                chunk = process.stdout.read(min(1 << 20, remaining))
                if not chunk:
                    raise ValueError('Truncated Git blob')
                digest.update(chunk)
                remaining -= len(chunk)
            if process.stdout.read(1) != b'\n':
                raise ValueError('Malformed Git blob boundary')
            row = {'path': name, 'bytes': size, 'sha256': digest.hexdigest(), 'category': 'ENGLISH_GUIDE_TOOL_OR_RELEASE_PROVENANCE'}
            if name in old and row != old[name]:
                raise ValueError('Refuse changed baseline edition artifact: ' + name)
            rows.append(row)
        if process.wait() != 0:
            raise ValueError('Git blob stream failed')
    current['editionArtifactCount'] = len(rows)
    current['editionArtifacts'] = rows
    current_path.write_bytes((json.dumps(current, ensure_ascii=False, indent=2) + '\n').encode())
    print(json.dumps({'baselineEditionArtifactsPreserved': len(old), 'newTaskArtifacts': len(rows) - len(old), 'allOtherManifestSectionsPreserved': True}))

if __name__ == '__main__':
    main()
