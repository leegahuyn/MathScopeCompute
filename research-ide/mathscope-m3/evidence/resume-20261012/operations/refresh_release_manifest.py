"""Audit a full Git tree without restoring large historical artifacts.

Only --write updates SOURCE_TRANSLATION_MANIFEST.json. Original manifests,
M2 evidence and the verifier itself are never edited. This is a narrow object
audit; CI still executes the repository's complete release verifier.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--repo', required=True)
parser.add_argument('--write', action='store_true')
parser.add_argument('--working-tree', action='store_true',
                    help='Use the index, including new staged files, plus tracked working-tree changes; unstaged untracked files are excluded.')
parser.add_argument('--allow-change', action='append', default=[],
                    help='Exact research-ide-relative existing artifact path reviewed for this update. Repeat for each intentional change.')
args = parser.parse_args()
repo = Path(args.repo).resolve()

def git(*args):
    return subprocess.check_output(['git', '-C', str(repo), *args])

head = git('rev-parse', 'HEAD').decode().strip()
base = '6256547a92f099dd63a12e90b471625656b690b0'
manifest_name = 'SOURCE_TRANSLATION_MANIFEST.json'
skip_dirs = {'.git', '.lake', '.venv', 'venv', 'node_modules', '__pycache__', 'dist', 'runs', 'm1-output'}
skip_roots = {'mathscope-m0', 'mathscope-m1', 'mathscope-extension', 'archive-members'}
skip_files = {manifest_name, 'ENGLISH_PACKAGE_MANIFEST.json'}
skip_suffixes = ('.pyc', '.tmp', '.zip', '.zip.sha256')
tree = {}
for row in git('ls-tree', '-rz', 'HEAD', 'research-ide').split(b'\0'):
    if not row:
        continue
    meta, path = row.split(b'\t', 1)
    mode, kind, oid = meta.decode().split()
    assert kind == 'blob', (kind, path)
    name = path.decode()[len('research-ide/'):]
    tree[name] = {'mode':mode, 'oid':oid}

changed_worktree = set()
if args.working_tree:
    tree = {}
    for row in git('ls-files', '--stage', '-z', '--', 'research-ide').split(b'\0'):
        if not row:
            continue
        meta, path = row.split(b'\t', 1)
        mode, oid, stage = meta.decode().split()
        assert stage == '0', 'Resolve index conflicts first'
        tree[path.decode()[len('research-ide/'):]] = {'mode':mode, 'oid':oid}
    for raw in git('diff', '--name-only', '-z', '--diff-filter=AMRT', '--', 'research-ide').split(b'\0'):
        if raw:
            name = raw.decode()[len('research-ide/'):]
            assert name in tree, 'Stage new paths before updating the manifest: '+name
            changed_worktree.add(name)
    for raw in git('diff', '--name-only', '-z', '--diff-filter=D', '--', 'research-ide').split(b'\0'):
        if raw:
            tree.pop(raw.decode()[len('research-ide/'):], None)

# The filters below mirror this exact reviewed verifier version. A verifier
# change requires reviewing this helper too, never silently changing the gate.
verifier_oid = 'f3f8ec60188abaf11e1efd0a5d33dd67224d1661'
assert tree['tools/verify_english_release.py']['oid'] == verifier_oid
assert 'tools/verify_english_release.py' not in changed_worktree

reader = subprocess.Popen(['git', '-C', str(repo), 'cat-file', '--batch'],
                          stdin=subprocess.PIPE, stdout=subprocess.PIPE)
cache = {}
def blob(name, keep=False):
    item = tree[name]
    assert item['mode'] != '120000', 'Symlink: '+name
    if name in changed_worktree:
        path = repo/'research-ide'/name
        assert not path.is_symlink(), 'Symlink: '+name
        if keep:
            return path.read_bytes()
        digest, size = hashlib.sha256(), 0
        with path.open('rb') as stream:
            for part in iter(lambda:stream.read(65536), b''):
                digest.update(part)
                size += len(part)
        return {'bytes':size, 'sha256':digest.hexdigest()}
    oid = item['oid']
    if not keep and oid in cache:
        return cache[oid]
    reader.stdin.write((oid+'\n').encode())
    reader.stdin.flush()
    header = reader.stdout.readline().decode().split()
    assert len(header) == 3 and header[:2] == [oid, 'blob'], header
    size = int(header[2])
    remaining, digest, chunks = size, hashlib.sha256(), []
    while remaining:
        part = reader.stdout.read(min(remaining, 65536))
        assert part, 'Unexpected git object EOF'
        remaining -= len(part)
        digest.update(part)
        if keep:
            chunks.append(part)
    assert reader.stdout.read(1) == b'\n'
    cache[oid] = {'bytes':size, 'sha256':digest.hexdigest()}
    return b''.join(chunks) if keep else cache[oid]

def read_json(name):
    return json.loads(blob(name, keep=True))

def checked_row(entry):
    assert entry['path'] in tree, 'Recorded file absent: '+entry['path']
    assert all(blob(entry['path'])[key] == entry[key] for key in ('bytes', 'sha256')), 'Historical bytes changed: '+entry['path']

old_bytes = git('show', head+':research-ide/'+manifest_name)
old = json.loads(old_bytes)
selection = read_json('provenance/source-selection.json')
original = read_json('provenance/original-v54-PACKAGE_MANIFEST.json')
assert blob('provenance/original-v54-PACKAGE_MANIFEST.json')['sha256'] == 'd4bcc38dcd6186cef9b6a9169fca6b8f900f0afc776f00eb3e5ae803754f94ae'
assert selection['sourceArchive']['sha256'] == 'ccc8d6dd7bc85f8e5a054aa04c0adab6f1ebd3172a175c667180cf9ef75b58f9'
assert selection['sourceArchive']['bytes'] == 73559111
assert selection['sourceArchive']['manifestSha256'] == blob('provenance/original-v54-PACKAGE_MANIFEST.json')['sha256']
originals = {row['path']:row for row in original['files']}
included = {row['path']:row for row in selection['included']}
omitted = {row['path']:row for row in selection['omitted']}
assert len(originals) == 935 and len(included) == 693 and len(omitted) == 242
assert set(included).isdisjoint(omitted) and set(included) | set(omitted) == set(originals)
for name, row in {**included, **omitted}.items():
    assert all(row[k] == originals[name][k] for k in ('path', 'bytes', 'sha256'))
    if name in included or name in tree:
        checked_row(row)
    if name in omitted:
        assert PurePosixPath(name).suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}
build = read_json('mathscope-m1/build-manifest.json')
assert len(build['sourceFiles']) == 50
for name, digest in build['sourceFiles'].items():
    assert name in included and blob(name)['sha256'] == digest
assert blob('mathscope-m1/m1.worker.js')['sha256'] == build['workerSha256']
assert blob('mathscope-m1/workspace.bundle.js')['sha256'] == build['bundleSha256']

# All inherited M0/M1/M2/source/translation bytes must agree with the handoff.
preserved_roots = ['mathscope-m0', 'mathscope-m1', 'mathscope-m2', 'mathscope-extension', 'provenance', 'localization']
comparison = [base] if args.working_tree else [base, head]
inherited_diff = git('diff', '--name-only', *comparison, '--', *['research-ide/'+x for x in preserved_roots])
assert not inherited_diff, inherited_diff.decode()

allowlist = read_json('provenance/addon-allowlist.json')['allowedRoots']
for root in allowlist:
    parts = PurePosixPath(root).parts
    assert not PurePosixPath(root).is_absolute() and '..' not in parts and str(PurePosixPath(root)) == root
    assert parts[:2] == ('mathscope-m1', 'navier')
    assert (len(parts) >= 4 and parts[2] == 'followup-next') or (len(parts) >= 3 and re.fullmatch(r'followup-[0-9]{8}-[a-z0-9][a-z0-9-]*', parts[2]))

def edition_included(name):
    path = PurePosixPath(name)
    return path.parts[0] not in skip_roots and not (set(path.parts[:-1]) & skip_dirs) and name not in skip_files and not path.name.endswith(skip_suffixes)

def addon_included(name):
    for root in allowlist:
        if name.startswith(root+'/'):
            parts = PurePosixPath(name[len(root)+1:]).parts
            if not any(x in skip_dirs or x.startswith('.') for x in parts[:-1]) and not parts[-1].endswith(skip_suffixes):
                return True
    return False

def rows(predicate, category):
    return [{'path':name, **blob(name), 'category':category} for name in sorted(tree) if predicate(name)]

new_edition = rows(edition_included, 'ENGLISH_GUIDE_TOOL_OR_RELEASE_PROVENANCE')
new_addons = rows(addon_included, 'POST_V54_MATHEMATICAL_ADDON')
assert {x['path'] for x in new_addons}.isdisjoint(originals)
allowed_changes = set(args.allow_change)
assert all(not PurePosixPath(x).is_absolute() and '..' not in PurePosixPath(x).parts for x in allowed_changes)
for entry in old['editionArtifacts'] + old['postV54Addons']:
    if args.write and entry['path'] not in allowed_changes:
        checked_row(entry)

def difference(before, after):
    a, b = ({x['path']:x for x in rows} for rows in (before, after))
    return {'added':[p for p in b if p not in a], 'removed':[p for p in a if p not in b],
            'changed':[p for p in a.keys() & b.keys() if a[p] != b[p]]}

edition_diff = difference(old['editionArtifacts'], new_edition)
addon_diff = difference(old['postV54Addons'], new_addons)
assert not edition_diff['removed'] and not addon_diff['removed'], 'Deletion is not supported by this narrow refresh helper'
if args.write:
    assert set(edition_diff['changed']) | set(addon_diff['changed']) == allowed_changes, 'Review each changed artifact and supply its exact --allow-change path'

# The only metadata changed is the two artifact lists and their counts.
assert old['sourceArchive'] == selection['sourceArchive']
assert old['sourceSelection']['sha256'] == blob('provenance/source-selection.json')['sha256']
assert old['pinnedComputation']['workerSha256'] == build['workerSha256']
assert old['pinnedComputation']['bundleSha256'] == build['bundleSha256']
companion = read_json('localization/acceptance.en.json')
assert old['translation']['originalCriterionIds'] == [x['id'] for x in companion['items']]
assert old['translation']['frozenBaselineCounts'] == companion['counts']
assert set(old['translation']['exampleIds']) == set(read_json('localization/examples-text.en.json'))

new = dict(old, editionArtifactCount=len(new_edition), editionArtifacts=new_edition,
           postV54AddonCount=len(new_addons), postV54Addons=new_addons)
payload = (json.dumps(new, ensure_ascii=False, indent=2)+'\n').encode('utf-8')
assert git('rev-parse', 'HEAD').decode().strip() == head, 'HEAD changed during audit'
if args.write:
    (repo/'research-ide'/manifest_name).write_bytes(payload)
reader.stdin.close()
reader.wait(timeout=10)
summary = {
    'auditedCommit':head, 'handoffCommit':base, 'effectiveView':'index plus tracked working tree' if args.working_tree else 'HEAD',
    'inheritedRootsUnchanged':preserved_roots,
    'originalFilesVerified':len(included), 'sourcePinsMatched':len(build['sourceFiles']),
    'historicalEditionRowsUnchanged':len(old['editionArtifacts'])-len(edition_diff['changed']),
    'historicalAddonRowsUnchanged':len(old['postV54Addons'])-len(addon_diff['changed']),
    'editionCountBefore':len(old['editionArtifacts']), 'editionCountAfter':len(new_edition),
    'addonCountBefore':len(old['postV54Addons']), 'addonCountAfter':len(new_addons),
    'editionAddedByRoot':dict(Counter(x.split('/')[0] for x in edition_diff['added'])),
    'editionAddedPaths':edition_diff['added'] if len(edition_diff['added']) <= 25 else 'See full new manifest; additions exceed 25 paths',
    'editionRemoved':edition_diff['removed'], 'editionChanged':edition_diff['changed'],
    'addonAddedByRoot':dict(Counter('/'.join(x.split('/')[:3]) for x in addon_diff['added'])),
    'addonRemoved':addon_diff['removed'], 'addonChanged':addon_diff['changed'],
    'artifactChanges':[{'path':name, 'explicitlyAllowed':name in allowed_changes,
                       'before':next(x for x in old['editionArtifacts']+old['postV54Addons'] if x['path']==name),
                               'after':next(x for x in new_edition+new_addons if x['path']==name)}
                       for name in sorted(set(edition_diff['changed']) | set(addon_diff['changed']))],
    'manifestBytesBefore':len(old_bytes), 'manifestBytesAfter':len(payload),
    'manifestSha256Before':hashlib.sha256(old_bytes).hexdigest(), 'manifestSha256After':hashlib.sha256(payload).hexdigest(),
    'reviewedVerifierGitObject':verifier_oid,
    'savedManifestMatchesExpected':(repo/'research-ide'/manifest_name).is_file()
        and (repo/'research-ide'/manifest_name).read_bytes() == payload,
    'written':args.write, 'fullRepositoryVerifierStillRequiredInCI':True,
}
print(json.dumps(summary, ensure_ascii=False, indent=2))
