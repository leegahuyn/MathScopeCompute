"""Package the verified same-source bounds and exact replay evidence."""

from argparse import ArgumentParser
import gzip
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation34 import JOIN, NORM, PARENTS as EARLIER, PUBLIC_SHA, sha256_stream
from assemble_continuation32 import entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = '7e66018ce75cff34b6765492b9a56a865701f922'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation34_Delta_20261113.zip':
           '6372f5a3c5417ffd1613584e43f9db3749ce190f5efcc98d47eeaf49c3b414cc'}
LABEL = 'MathScope_Goal_Continuation35'
DATE = '20261113'
TARGET = NORM + 'weighted-target/'
INPUTS = {
    'primary-c5-native.json': '15da654dd83b75506049e5eb1339b1904c7da7b6a6010ee3b9deb97a282cc9ee',
    'primary-target-c6-source.jsonl.gz': 'e2957452fd367f69eadb6dc98ae93bc3fcfc444f5f8b88fb850cbd465862be5d',
    'primary-K-binding-index.json': '17421a6cd0819e9c4e09d56e78761c71346c10a6309def26e5d118319faad8bb',
}


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('workspace', 'repo', 'n3-artifact', 'public-copy'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    outputs = args.workspace / 'outputs'

    def git(*params):
        return subprocess.check_output(['git', '-c', 'core.longpaths=true', *params], cwd=args.repo)

    head = git('rev-parse', 'HEAD').decode().strip()
    assert git('branch', '--show-current').decode().strip() == BRANCH

    def source(path):
        return git('show', f'{head}:{CURRENT}/{path}')

    recorded = json.loads(source('preservation-continuation31.json'))
    refs = {f'refs/heads/{name}': sha for name, sha in recorded['remoteBaselineRefs'].items()}
    refs[recorded['onlyPushRef']] = head
    remote = {ref: sha for sha, ref in (line.split() for line in
              git('ls-remote', 'origin', *refs).decode().splitlines())}
    assert remote == refs and file_sha(args.public_copy) == PUBLIC_SHA

    previous_files = {}
    for name, pin in PARENTS.items():
        path = outputs / name
        assert file_sha(path) == pin, name
        with ZipFile(path) as parent:
            previous_files.update(json.loads(parent.read('SHA256.json')))

    report, raw_status = source('REPORT_KO.md'), source('STATUS.json')
    status = json.loads(raw_status)
    assert status['M3']['accepted'] == 62 and status['jets']['accepted'] == 0
    assert status['M4']['publicReadback']['currentR108'] == 'OPEN'
    assert status['release'] == 'HOLD' and not status['goal_complete']
    for n in (3, 4):
        closed = json.loads(source(f'{NORM}n{n}-closed.json'))
        assert closed['prefix'] == n and closed['status'] == 'DIRECTED_CLOSED_K_OPERANDS'
        assert sum(r['directKOperand'] for r in closed['ready']) == 5
        assert sum(r['directKOperand'] for r in closed['unresolved']) == 9
    cycle_raw = source(JOIN + 'hosted-43367325423/first-cycle.json')
    assert entry(cycle_raw)['sha256'] == 'b1f99121d2e98c365a83f6b1ac568751119d8f30ecea5cb2c73b17c3100edf4a'
    cycle = json.loads(cycle_raw)
    assert cycle['stoppedNodes'] == 22001223 and cycle['error']['code'] == 'INVALID_SIGNED_SUCCESSOR_OPTIONS'
    assert len(cycle['stages']) == 1 and len(cycle['stages'][0]['checks']) == 18
    assert all(check['pass'] for check in cycle['stages'][0]['checks'])

    for name, pin in INPUTS.items():
        assert file_sha(args.n3_artifact / name) == pin, name
    native = json.loads((args.n3_artifact / 'primary-c5-native.json').read_bytes())
    assert native['status'] == 'VERIFIED_ORIGINAL_NATIVE_N3_PRIMARY_C5_CLASS'
    assert native['executingCommit'] == '245ba9e3de8ed4161d06014849338202d1252cfa'
    assert len(native['nativeChecks']) == 9 and all(r['pass'] for r in native['nativeChecks'])
    assert native['normBindingIndex']['sha256'] == INPUTS['primary-K-binding-index.json']
    with gzip.open(args.n3_artifact / 'primary-target-c6-source.jsonl.gz', 'rb') as graph:
        typed_header = json.loads(graph.readline())
    assert typed_header['nodeRecordsSHA256'] == native['targetOperandDag']['nodeRecordsSHA256']
    assert typed_header['nodeCount'] == 23366 and typed_header['rowCount'] == 168
    match = json.loads(source(TARGET + 'n3-live-c6-c7-binding.json'))
    assert match['liveSHA256'] == INPUTS['primary-target-c6-source.jsonl.gz']
    assert match['matchedCount'] == 168 and match['faceCount'] == 672
    target_raw = source(TARGET + 'n3-weighted-target-directed.json')
    target = json.loads(target_raw)
    readback = json.loads(source(TARGET + 'n3-weighted-target-readback.json'))
    assert target['leaves'] == {'target': 168, 'slow-chart': 1148, 'archived-integral': 3}
    assert len(target['rows']) == 7 and readback['commonStrictUpper'] == 'T15'
    assert entry(target_raw)['sha256'] == readback['inputSHA256']
    assert entry(source(TARGET + 'n3-live-c6-c7-binding.json'))['sha256'] == target['sourcePins']['match']
    heat = source('final67/moving-heat-energy/moving-heat-energy.json')
    vector = json.loads(source('final67/moving-heat-energy/radial-force.json'))
    assert vector['movingHeatSHA256'] == entry(heat)['sha256']
    assert vector['status'] == 'VERIFIED_ACTUAL_MOVING_HEAT_FULL_VECTOR_FORCE_INTERVAL'

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
            assert kind in {'A', 'M'}
            assert path.startswith(CURRENT + '/') or path == '.github/workflows/mathscope-original-primary-c5.yml'
            if kind == 'M' and path in previous_files:
                assert entry(git('show', PARENT + ':' + path)) == previous_files[path], path
            add(path, git('show', head + ':' + path))
        for name in INPUTS:
            add(f'{CURRENT}/{TARGET}hosted-43371105453-n3/{name}', (args.n3_artifact / name).read_bytes())
        add('REPORT_KO.md', report)
        add('STATUS.json', raw_status)
        add('CHECKPOINT.json', encode({'schema': 'MathScope.GoalEvidenceDelta/1',
            'parentsInOrder': PARENTS, 'parentCommit': PARENT, 'deltaCommit': head,
            'verifiedRemoteRefs': refs, 'priorReadOnlyPublicSnapshotSHA256': PUBLIC_SHA,
            'filesThatSupersedeParents': sorted(set(files) & set(previous_files)), 'release': 'HOLD'}))
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
               'targetRows': 168, 'targetFaces': 672, 'passedCorollaryChecks': 18,
               'verifiedDeltaManifest': True}
    (outputs / f'{LABEL}_Report_{DATE}_KO.md').write_bytes(report)
    (outputs / f'{LABEL}_Receipt_{DATE}.json').write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()
