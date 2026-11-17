"""Read back the original Signed failure and annular budget evidence."""

from argparse import ArgumentParser
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation37 import PARENTS as EARLIER, PUBLIC_SHA, sha256_stream
from assemble_continuation35 import JOIN
from assemble_continuation32 import entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = '596dfcc5a78ab6e3116541169f395e466f5eaa28'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation37_Delta_20261113.zip':
           '66b781a4f3bd36b666b973ede744e07cf129a088c2bd63706abbd298e81f30f8'}
LABEL = 'MathScope_Goal_Continuation38'
DATE = '20261117'
BUDGET = 'final67/energy-1013-sharp/correction-budget/'
WORKFLOW = '.github/workflows/mathscope-original-primary-c5.yml'


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('workspace', 'repo', 'public-copy'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    outputs = args.workspace / 'outputs'

    def git(*params):
        return subprocess.check_output(['git', '-c', 'core.longpaths=true', *params], cwd=args.repo)

    head = git('rev-parse', 'HEAD').decode().strip()
    assert git('branch', '--show-current').decode().strip() == BRANCH

    def raw(path):
        return git('show', f'{head}:{CURRENT}/{path}')

    def source(path):
        return json.loads(raw(path))

    preservation = source('preservation-continuation31.json')
    refs = {f'refs/heads/{name}': sha for name, sha in preservation['remoteBaselineRefs'].items()}
    refs[preservation['onlyPushRef']] = head
    observed = {ref: sha for sha, ref in (line.split() for line in git('ls-remote', 'origin', *refs).decode().splitlines())}
    assert observed == refs and file_sha(args.public_copy) == PUBLIC_SHA

    previous = {}
    for name, pin in PARENTS.items():
        package = outputs / name
        assert file_sha(package) == pin, name
        with ZipFile(package) as bundle:
            previous.update(json.loads(bundle.read('SHA256.json')))

    status = source('STATUS.json')
    assert status['M3']['accepted'] == 62 and status['jets']['accepted'] == 0
    assert status['M4']['publicReadback']['currentR108'] == 'OPEN'
    assert status['release'] == 'HOLD' and not status['goal_complete']
    pins = {
        JOIN + 'hosted-43376435788/first-cycle.json': 'dfcbe72199a43a6d700deee3d8452ed0a2d4e5dbea770abc837fae660e306f31',
        BUDGET + 'annular-thresholds.json': 'a772907a00b9200330a17c44fdc8febaf912e66470b6b0d664c2e8779476840e',
        BUDGET + 'annular-initialized-budget.json': '44b4dddb0698fedbc0a90496f5212dcf7920e03de5bfef75a153a3ff63ccc3cc',
        BUDGET + 'original-67plus13-polynomials.json': '1f02933c4a09f96efca99188fba2731526df81459deb1deb3c249433b73295f7',
    }
    for path, pin in pins.items():
        assert entry(raw(path))['sha256'] == pin, path
    cycle = source(JOIN + 'hosted-43376435788/first-cycle.json')
    assert cycle['error']['code'] == 'INVALID_ORIGINAL_81_COVER' and cycle['stoppedNodes'] == 22032001
    assert len(cycle['stages'][0]['checks']) == 18 and all(row['pass'] for row in cycle['stages'][0]['checks'])
    budget = source(BUDGET + 'annular-thresholds.json')
    assert [row['stage'] for row in budget['stages']] == [1, 2, 3, 4]
    assert all(row['comparisonOfOriginalKUpperToThresholdLower'] == 1 for row in budget['stages'])
    initial = source(BUDGET + 'annular-initialized-budget.json')
    assert initial['terms'] == 50 and initial['comparison'] == 1
    assert ['b@1,0,0', 1] in initial['largestTerm']['factors']

    delta = outputs / f'{LABEL}_Delta_{DATE}.zip'
    pending = delta.with_suffix('.zip.tmp')
    files = {}
    with ZipFile(pending, 'w', compression=ZIP_DEFLATED, compresslevel=5) as bundle:
        def add(path, data):
            assert path not in files
            bundle.writestr(path, data)
            files[path] = entry(data)

        for line in git('diff', '--name-status', '--no-renames', PARENT, head).decode().splitlines():
            change, path = line.split('\t')
            assert change in {'A', 'M'} and (path.startswith(CURRENT + '/') or path == WORKFLOW), path
            if change == 'M' and path in previous:
                assert entry(git('show', PARENT + ':' + path)) == previous[path], path
            add(path, git('show', head + ':' + path))
        add('REPORT_KO.md', raw('REPORT_KO.md'))
        add('STATUS.json', raw('STATUS.json'))
        add('CHECKPOINT.json', encode({'schema': 'MathScope.GoalEvidenceDelta/1',
            'parentsInOrder': PARENTS, 'parentCommit': PARENT, 'deltaCommit': head,
            'verifiedRemoteRefs': refs, 'priorReadOnlyPublicSnapshotSHA256': PUBLIC_SHA,
            'filesThatSupersedeParents': sorted(set(files) & set(previous)), 'release': 'HOLD'}))
        bundle.writestr('SHA256.json', encode(files))
    with ZipFile(pending) as bundle:
        assert bundle.testzip() is None and len(bundle.namelist()) == len(files) + 1
        assert json.loads(bundle.read('SHA256.json')) == files
        for path, expected in files.items():
            with bundle.open(path) as stream:
                assert sha256_stream(stream) == expected['sha256']
            assert bundle.getinfo(path).file_size == expected['bytes']
    pending.replace(delta)
    receipt = {'file': delta.name, 'bytes': delta.stat().st_size, 'files': len(files) + 1,
               'sha256': file_sha(delta), 'branchHead': head,
               'annularThresholds': 4, 'initializedEnergyTerms': 50, 'verifiedDeltaManifest': True}
    (outputs / f'{LABEL}_Report_{DATE}_KO.md').write_bytes(raw('REPORT_KO.md'))
    (outputs / f'{LABEL}_Receipt_{DATE}.json').write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()
