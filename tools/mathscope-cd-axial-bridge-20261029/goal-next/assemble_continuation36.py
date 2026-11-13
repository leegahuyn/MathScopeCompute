"""Verify and package N4 replay, original K inputs and source-domain evidence."""

from argparse import ArgumentParser
import gzip
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation35 import JOIN, NORM, PARENTS as EARLIER, PUBLIC_SHA, TARGET, sha256_stream
from assemble_continuation32 import entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = '052aa6b7603dd73aac70fbdc8b381d29dd3380f0'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation35_Delta_20261113.zip':
           '7341bc6bcdff47809f3eeedae1e0988d7ac511808608962bfd1993bed0aafecc'}
LABEL = 'MathScope_Goal_Continuation36'
DATE = '20261113'
WORKFLOWS = {
    '.github/workflows/mathscope-original-primary-c5.yml',
    '.github/workflows/mathscope-active-n3-first-cycle.yml',
}
ARTIFACTS = {
    3: {
        'primary-c5-native.json': 'fe6974c4fd65c9dc1a3e0457cbce248d474481791f9dfa551036fe57d0de2fcd',
        'primary-K-binding-index.json': '23601379f5b414d470a79f9568ebccf7f27253efa7b39182b6753304190f09ac',
    },
    4: {
        'primary-c5-native.json': '9104e739e6682ffbf8c1e28eb02cf766220fa321a9d92a4cf16af799f777df0e',
        'primary-K-binding-index.json': '32145fe69d2cb5b62ffb331a979bdb3cd95b860f12818a329a5a2cc5cc196130',
        'primary-target-c6-source.jsonl.gz': 'dcbc950d6fd26c41c5521a9fdc7afb08385808ca3ed116c42d5ebddbdb8318f9',
    },
}


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('workspace', 'repo', 'public-copy', 'n3-artifact', 'n4-artifact'):
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
    by_prefix = {3: args.n3_artifact, 4: args.n4_artifact}
    for prefix, directory in by_prefix.items():
        for name, pin in ARTIFACTS[prefix].items():
            assert file_sha(directory / name) == pin, name
        native = json.loads((directory / 'primary-c5-native.json').read_bytes())
        assert native['status'] == f'VERIFIED_ORIGINAL_NATIVE_N{prefix}_PRIMARY_C5_CLASS'
        assert native['requested']['prefix'] == prefix and all(row['pass'] for row in native['nativeChecks'])
        assert native['normBindingIndex']['sha256'] == ARTIFACTS[prefix]['primary-K-binding-index.json']
        cutoff = source(f'{NORM}n{prefix}-cutoff-map.json')
        assert cutoff['K'] == native['normRoot'] and len(cutoff['leaves']) == 54
        assert cutoff['sourcePins']['index'] == native['normBindingIndex']['sha256']
        if prefix == 4:
            with gzip.open(directory / 'primary-target-c6-source.jsonl.gz', 'rb') as stream:
                header = json.loads(stream.readline())
            assert header['nodeRecordsSHA256'] == native['targetOperandDag']['nodeRecordsSHA256']
            assert header['rowCount'] == 168

    n4 = TARGET + 'n4-replay/'
    match = source(n4 + 'n4-live-c6-c7-binding.json')
    assert match['liveSHA256'] == ARTIFACTS[4]['primary-target-c6-source.jsonl.gz']
    assert match['matchedCount'] == 168 and match['faceCount'] == 672
    replay = source(n4 + 'n4-replay-summary.json')
    for name, pin in replay['files'].items():
        assert entry(raw(n4 + name))['sha256'] == pin, name
    n3_intervals = [row['enclosure'] for row in source(TARGET + 'n3-weighted-target-directed.json')['rows']]
    n4_intervals = [row['enclosure'] for row in source(n4 + 'n4-weighted-target-directed.json')['rows']]
    assert len(n3_intervals) == 7 and n3_intervals == n4_intervals
    retry_path = JOIN + 'hosted-43372241418/first-cycle.json'
    assert entry(raw(retry_path))['sha256'] == '90a3c10a16b4e2e5b818f0bbab36e3ee8405a007ebcddc9980893ae21a1b4d14'
    retry = source(retry_path)
    assert retry['error']['code'] == 'SIGNED_TANGENCY_UNPROVED' and retry['stoppedNodes'] == 22001443
    assert len(retry['stages']) == 1 and len(retry['stages'][0]['checks']) == 18
    assert all(row['pass'] for row in retry['stages'][0]['checks'])

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
            assert change in {'A', 'M'} and (path.startswith(CURRENT + '/') or path in WORKFLOWS), path
            if change == 'M' and path in previous:
                assert entry(git('show', PARENT + ':' + path)) == previous[path], path
            add(path, git('show', head + ':' + path))
        for prefix, directory in by_prefix.items():
            for name in ARTIFACTS[prefix]:
                add(f'{CURRENT}/{NORM}hosted-43373034256-n{prefix}/{name}', (directory / name).read_bytes())
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
               'targetRowsPerPrefix': 168, 'targetFacesPerPrefix': 672, 'cutoffLeavesPerPrefix': 54,
               'verifiedDeltaManifest': True}
    (outputs / f'{LABEL}_Report_{DATE}_KO.md').write_bytes(raw('REPORT_KO.md'))
    (outputs / f'{LABEL}_Receipt_{DATE}.json').write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()
