"""Package the native N3 Forced completion and directed norm evidence."""
from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation32 import PARENTS as EARLIER, entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = '4c4f598b4860414f6e6ab06c7cb96d83e116da53'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation32_Delta_20261113.zip':
           'e30570d14d5c846483bbbd0234415faa5f9cdc027ecccf3ec57a4ccd9179e12c'}
LABEL = 'MathScope_Goal_Continuation33'
DATE = '20261113'
JOIN = 'primary-forced-join/active-n3-c5-binding/'
LEAN = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/PicardAxisBranch.lean'
ALLOWED = {LEAN, '.github/workflows/mathscope-cd-axial-bridge-20261029.yml',
           '.github/workflows/mathscope-original-primary-c5.yml',
           '.github/workflows/mathscope-active-n3-first-cycle.yml'}
FRONTIERS = {3: ('fbaea5bd2475e54919cef4099479c1c6ad6ad48dc68225190ea9f6c127f07aaa', 18310069),
             4: ('22728b80327798f6fad284058b558d10527e4d8b7534a0c2bd9634eebb906b99', 24120472)}
PUBLIC_SHA = 'a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48'


def check_frontier(path, prefix, root):
    data = json.loads(path.read_bytes())
    assert data['graphNamespace'] == 'norm' and data['prefix'] == prefix
    assert data['roots']['K'] == root and data['roots']['backgroundC8'] == 14220496
    assert len(data['nodes']) == 1245636 and len(data['nonArithmeticBoundaries']) == 203731
    assert sum(row['op'] == 'definite_integral' for row in data['nonArithmeticBoundaries']) == 178131
    assert sum(row['op'] == 'actual_expression_partial' for row in data['nonArithmeticBoundaries']) == 25600
    assert data['numericalEndpointsCertified'] is False


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('workspace', 'repo', 'artifacts'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    outputs = args.workspace / 'outputs'

    def git(*params):
        return subprocess.check_output(['git', '-c', 'core.longpaths=true', *params], cwd=args.repo)

    head = git('rev-parse', 'HEAD').decode().strip()
    assert git('branch', '--show-current').decode().strip() == BRANCH

    def source(path):
        return git('show', f'{head}:{CURRENT}/{path}')

    previous = json.loads(source('preservation-continuation31.json'))
    refs = {f'refs/heads/{name}': sha for name, sha in previous['remoteBaselineRefs'].items()}
    refs[previous['onlyPushRef']] = head
    assert {ref: sha for sha, ref in (line.split() for line in
            git('ls-remote', 'origin', *refs).decode().splitlines())} == refs
    public = args.artifacts / 'operational-v031.html'
    assert file_sha(public) == PUBLIC_SHA and public.stat().st_size == 30707818

    older = {}
    for name, digest in PARENTS.items():
        path = outputs / name
        assert file_sha(path) == digest, name
        with ZipFile(path) as ancestor:
            older.update(json.loads(ancestor.read('SHA256.json')))

    report, raw_status = source('REPORT_KO.md'), source('STATUS.json')
    status = json.loads(raw_status)
    assert status['M3']['accepted'] == 62 and status['jets']['accepted'] == 0
    assert status['M4']['publicReadback']['currentR108'] == 'OPEN' and status['release'] == 'HOLD'
    assert not status['goal_complete']
    full = json.loads(source(JOIN + 'hosted-43363985428/full-first-forced-independent.json'))
    assert full['run'] == 43363985428 and full['nodeCount'] == 21999237
    assert sum(full['checks'].values()) == 805 and not full['astReevaluationInThisReadback']
    lean = entry(git('show', f'{head}:{LEAN}'))['sha256']
    assert (lean + '  MathScope/M3/CD/PicardAxisBranch.lean\n').encode() in source('ci-43366489558/source-sha256.txt')
    assert source('ci-43366489558/PicardAxisBranch.log').strip().endswith(b'[propext, Classical.choice, Quot.sound]')
    replay = json.loads(source(JOIN + 'hosted-43363985266/independent-readback.json'))
    assert replay['priorEdges'] == 43980655 and not replay['completeForcedSeal']
    frontiers = {}
    for prefix, (pin, root) in FRONTIERS.items():
        path = args.artifacts / f'hosted-43365519173-n{prefix}' / 'primary-K-arithmetic-frontier.json'
        assert file_sha(path) == pin
        check_frontier(path, prefix, root)
        frontiers[prefix] = (path, pin)

    delta = outputs / f'{LABEL}_Delta_{DATE}.zip'
    pending = delta.with_suffix('.zip.tmp')
    files = {}
    with ZipFile(pending, 'w', compression=ZIP_DEFLATED, compresslevel=5) as bundle:
        def add(name, data):
            assert name not in files
            bundle.writestr(name, data)
            files[name] = entry(data)

        for line in git('diff', '--name-status', '--no-renames', PARENT, head).decode().splitlines():
            kind, path = line.split('\t')
            assert kind in {'A', 'M'} and (path.startswith(CURRENT + '/') or path in ALLOWED), path
            if kind == 'M' and path in older:
                assert entry(git('show', PARENT + ':' + path)) == older[path], path
            add(path, git('show', head + ':' + path))
        for prefix, (path, pin) in frontiers.items():
            name = f'{CURRENT}/{JOIN}hosted-43365519173/n{prefix}/{path.name}'
            bundle.write(path, name)
            files[name] = {'sha256': pin, 'bytes': path.stat().st_size}
        add('REPORT_KO.md', report)
        add('STATUS.json', raw_status)
        add('CHECKPOINT.json', encode({'schema': 'MathScope.GoalEvidenceDelta/1', 'parentsInOrder': PARENTS,
            'parentCommit': PARENT, 'deltaCommit': head, 'publicReadback': {'status': 200, 'sha256': PUBLIC_SHA},
            'filesThatSupersedeParents': sorted(set(files) & set(older)), 'release': 'HOLD'}))
        bundle.writestr('SHA256.json', encode(files))

    with ZipFile(pending) as bundle:
        assert bundle.testzip() is None and len(bundle.namelist()) == len(files) + 1
        assert json.loads(bundle.read('SHA256.json')) == files
        for path, expected in files.items():
            with bundle.open(path) as content:
                assert sha256_stream(content) == expected['sha256']
            assert bundle.getinfo(path).file_size == expected['bytes']
    pending.replace(delta)
    receipt = {'file': delta.name, 'bytes': delta.stat().st_size, 'files': len(files) + 1,
               'sha256': file_sha(delta), 'branchHead': head, 'verifiedParentsInOrder': PARENTS,
               'fullFirstForcedNodes': full['nodeCount'], 'frontiers': [3, 4], 'verifiedDeltaManifest': True}
    (outputs / f'{LABEL}_Report_{DATE}_KO.md').write_bytes(report)
    (outputs / f'{LABEL}_Receipt_{DATE}.json').write_bytes(encode(receipt))
    print(json.dumps(receipt))


def sha256_stream(content):
    digest = sha256()
    for block in iter(lambda: content.read(1 << 20), b''):
        digest.update(block)
    return digest.hexdigest()


if __name__ == '__main__':
    main()
