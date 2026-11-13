"""Package the N3/N4 source bindings, directed bounds and browser rollback replay."""
from argparse import ArgumentParser
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation33 import FRONTIERS, PARENTS as EARLIER, PUBLIC_SHA, sha256_stream
from assemble_continuation32 import entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = 'afa225f3252a1cf79880d327d4b909566e12e7fd'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation33_Delta_20261113.zip':
           '2d533375403c11a0dfd601621c4cf153acb542a43dc0237dcc7a796f43da81e7'}
JOIN = 'primary-forced-join/active-n3-c5-binding/'
NORM = JOIN + 'norm-leading/'
LABEL = 'MathScope_Goal_Continuation34'
DATE = '20261113'


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('workspace', 'repo', 'artifacts', 'public-copy'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    outputs = args.workspace / 'outputs'

    def git(*params):
        return subprocess.check_output(['git', '-c', 'core.longpaths=true', *params], cwd=args.repo)

    head = git('rev-parse', 'HEAD').decode().strip()
    assert git('branch', '--show-current').decode().strip() == BRANCH

    def source(path):
        return git('show', f'{head}:{CURRENT}/{path}')

    refs_record = json.loads(source('preservation-continuation31.json'))
    refs = {f'refs/heads/{name}': sha for name, sha in refs_record['remoteBaselineRefs'].items()}
    refs[refs_record['onlyPushRef']] = head
    assert {ref: sha for sha, ref in (line.split() for line in
            git('ls-remote', 'origin', *refs).decode().splitlines())} == refs
    assert file_sha(args.public_copy) == PUBLIC_SHA

    parents = {}
    for name, pin in PARENTS.items():
        path = outputs / name
        assert file_sha(path) == pin, name
        with ZipFile(path) as old:
            parents.update(json.loads(old.read('SHA256.json')))
    report, raw_status = source('REPORT_KO.md'), source('STATUS.json')
    status = json.loads(raw_status)
    assert status['M3']['accepted'] == 62 and status['jets']['accepted'] == 0
    assert status['M4']['publicReadback']['currentR108'] == 'OPEN' and status['release'] == 'HOLD'
    assert not status['goal_complete']

    for n, (pin, root) in FRONTIERS.items():
        bound = json.loads(source(f'{NORM}n{n}-leading-ftc-join.json'))
        assert bound['prefix'] == n and bound['normRoot'] == root
        assert bound['countByField'] == {'F': 45, 'U': 45}
        assert bound['sourcePins']['primary-K-arithmetic-frontier.json'] == pin
        assert entry(source(f'{NORM}n{n}-leading-native.json'))['sha256'] == bound['nativeReceiptSHA256']
    positive = json.loads(source(NORM + 'positive-ftc/positive-directed-readback.json'))
    assert positive['status'] == 'PASS' and sum(row['faceRows'] for row in positive['rows']) == 270
    frozen = json.loads(source(JOIN + 'endpoint/frozen-normal/frozen-normal-verified.json'))
    assert len(frozen['rows']) == 2 and all(len(row['normalAndDerivative']) == 6 and all(
        item['pass'] is True for item in row['normalAndDerivative']) for row in frozen['rows'])
    axis = json.loads(source('y-higher-flow/high-picard-tail/axis-replay.json'))
    assert axis['status'] == 'PASS' and len(axis['standaloneN1DirectRows']) == 16
    m4 = json.loads(source('m4/r108/operational-replay-audit/browser-rollback/local-archive-roundtrip.json'))
    assert m4['status'] == 'VERIFIED_LOOPBACK_CANDIDATE_ROLLBACK_REDEPLOY'

    packet = args.artifacts / 'positive-ftc/positive-c10-rectangle.json'
    packet_pin = '7e1fdbc5e4e6aa43da32c2ba98cd7b29ed178fbea0eb3160c767941f586b3fed'
    assert file_sha(packet) == packet_pin
    delta = outputs / f'{LABEL}_Delta_{DATE}.zip'
    pending = delta.with_suffix('.zip.tmp')
    files = {}
    with ZipFile(pending, 'w', compression=ZIP_DEFLATED, compresslevel=5) as bundle:
        def add(path, data):
            assert path not in files
            bundle.writestr(path, data)
            files[path] = entry(data)

        for line in git('diff', '--name-status', '--no-renames', PARENT, head).decode().splitlines():
            kind, path = line.split('\t')
            assert kind in {'A', 'M'} and path.startswith(CURRENT + '/'), path
            if kind == 'M' and path in parents:
                assert entry(git('show', PARENT + ':' + path)) == parents[path], path
            add(path, git('show', head + ':' + path))
        name = f'{CURRENT}/{NORM}positive-ftc/{packet.name}'
        bundle.write(packet, name)
        files[name] = {'sha256': packet_pin, 'bytes': packet.stat().st_size}
        add('REPORT_KO.md', report)
        add('STATUS.json', raw_status)
        add('CHECKPOINT.json', encode({'schema': 'MathScope.GoalEvidenceDelta/1', 'parentsInOrder': PARENTS,
            'parentCommit': PARENT, 'deltaCommit': head, 'publicReadbackSHA256': PUBLIC_SHA,
            'filesThatSupersedeParents': sorted(set(files) & set(parents)), 'release': 'HOLD'}))
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
               'leadingFTCSumsPerPrefix': 90, 'positiveFTCSums': 270, 'verifiedDeltaManifest': True}
    (outputs / f'{LABEL}_Report_{DATE}_KO.md').write_bytes(report)
    (outputs / f'{LABEL}_Receipt_{DATE}.json').write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()
