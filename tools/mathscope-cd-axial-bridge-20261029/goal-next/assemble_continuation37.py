"""Validate and package original center, Y and first-Forced transfer evidence."""

from argparse import ArgumentParser
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation36 import PARENTS as EARLIER, PUBLIC_SHA, sha256_stream
from assemble_continuation35 import JOIN
from assemble_continuation32 import entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = 'aa19ee28c3615e8d188c78086ed73de6b2a72f2e'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation36_Delta_20261113.zip':
           'ae9a14af6acc8ebfdfcc6cfa242cd3e35be57507736249137f447c7abbc79b08'}
LABEL = 'MathScope_Goal_Continuation37'
DATE = '20261113'
ENERGY = 'final67/energy-1013-sharp/'
Y = 'y-higher-flow/n4-static-range/'
GAMMA = JOIN + 'mean-c4/beta-gamma/radial-operator/'
FORCED = JOIN + 'endpoint/forced-k-transfer/'


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
    remote = {ref: sha for sha, ref in (line.split() for line in git('ls-remote', 'origin', *refs).decode().splitlines())}
    assert remote == refs and file_sha(args.public_copy) == PUBLIC_SHA

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
    required_pins = {
        ENERGY + 'center-energy-sharp.json': '3137901e2d882df250b7df3673e276a14b6f4e9e87a006d1065f575976461481',
        ENERGY + 'center-energy-readback.json': '06c47c1723bb1d37d0700c77ee9cc59e4c852107b3b80733da058b5bc8ada0ea',
        Y + 'n4-verified.json': '5fb6470c41e51a8592156eb8070e86b43d5f96c721049a1cac4878715ef87f6d',
        GAMMA + 'source-geometry.json': '32b5df399bb8159926ff8bcff9ca21c40c3085035d45fe5008ecc1ce8049d1e8',
        FORCED + 'forced-transfer-byte-hashes.json': '836f5a5f8ea664ab6094166cf8ac2768dbbcecef9eddfd6dcf830c60bb055f91',
    }
    for path, pin in required_pins.items():
        assert entry(raw(path))['sha256'] == pin, path
    y = source(Y + 'n4-verified.json')
    assert y['sourceCounts']['calls'] == 597 and y['sourceCounts']['open'] == 0
    assert len(y['simultaneousXEtaTransportSites']) == 14
    assert y['negativeControls'] == {'withoutRootBracket': 4, 'withoutLoopLeftPositive': 158}
    gamma = source(GAMMA + 'source-geometry.json')
    assert gamma['normRoot'] == 18310069 and gamma['positiveNShapes'] == 52
    assert not gamma['arithmetic']['binary64UsedForNumericalDecisions']
    forced = source(FORCED + 'n3-selected-lifts-exact.json')
    assert forced['branches'] == ['0:1', '1:1']

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
            assert change in {'A', 'M'} and path.startswith(CURRENT + '/'), path
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
               'sha256': file_sha(delta), 'branchHead': head, 'verifiedParentsInOrder': PARENTS,
               'conditionalStaticN4YCalls': 597, 'conditionalPositiveNGammaShapes': 52,
               'strictCenterBudgetVerified': True, 'verifiedDeltaManifest': True}
    (outputs / f'{LABEL}_Report_{DATE}_KO.md').write_bytes(raw('REPORT_KO.md'))
    (outputs / f'{LABEL}_Receipt_{DATE}.json').write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()
