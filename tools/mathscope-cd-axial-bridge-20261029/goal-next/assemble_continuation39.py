"""Read back and package the actual radial, dynamic Y and projected-source evidence."""

from argparse import ArgumentParser
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation38 import PARENTS as EARLIER, PUBLIC_SHA, sha256_stream
from assemble_continuation32 import entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENT = '41eddc926339fa5a499aafaeb79c47c8c9ba9a44'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation38_Delta_20261117.zip':
           '94c7e1d79bf5b09e4dfe4e79bc7fec8b8073347302266a19ca444df836243035'}
LABEL = 'MathScope_Goal_Continuation39'
DATE = '20261117'
BUDGET = 'final67/energy-1013-sharp/correction-budget/'
DYNAMIC = 'y-higher-flow/n4-dynamic-range/'
FORCED = 'primary-forced-join/active-n3-c5-binding/endpoint/forced-hw-c4/'
PINS = {
    BUDGET + 'radial-dominance.json': 'bcaf267bdb16b6602e108b1644d72041ae13b335643407451a0768f209e65d5b',
    DYNAMIC + 'dynamic-range.json': '5e9a87256bd75c6739d3ee07e2da92f24a815e88365ac4ec912b4e61cd67effc',
    FORCED + 'n3-same-live-hw-c4-pullback.json': '1b752098493b07d23ba4d6a2acb0222dcb200d58456be192332d6b3d96aecb26',
    FORCED + 'n3-projected-m2-source-c4.json': '87d7c754aca55c95149ecf81b1e4b88efa16933f872ff384ec9f069d5ef22357',
    FORCED + 'n3-normal-inverse-bound.json': 'c4f01bce74f842a34673ff6a7b9507171c79b9d4485a289def57e1347b525151',
    FORCED + 'n3-m2-c4-source-geometry.json': '80a8f27ada6487e2f66489fe0e66d203924eebd9b4b54096262944f96836132c',
    FORCED + 'n3-projected-m2-weighted-bound.json': '862aea4cf2cba6984fa40d00870a00698aab5fe3a6de12cfdf6556325dae6fc4',
}


def read_arguments(description):
    parser = ArgumentParser(description=description)
    for name in ('workspace', 'repo', 'public-copy'):
        parser.add_argument('--' + name, type=Path, required=True)
    return parser.parse_args()


def assemble_delta(args, *, parent, parents, label, date, verify, additional_pins=None):
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
    for name, pin in parents.items():
        package = outputs / name
        assert file_sha(package) == pin, name
        with ZipFile(package) as bundle:
            previous.update(json.loads(bundle.read('SHA256.json')))

    status = source('STATUS.json')
    assert status['M3']['accepted'] == 62 and status['jets']['accepted'] == 0
    assert status['M4']['publicReadback']['currentR108'] == 'OPEN'
    assert status['release'] == 'HOLD' and not status['goal_complete']
    evidence = verify(raw, source)
    additional_pins = additional_pins or {}

    delta = outputs / f'{label}_Delta_{date}.zip'
    pending = delta.with_suffix('.zip.tmp')
    files = {}
    with ZipFile(pending, 'w', compression=ZIP_DEFLATED, compresslevel=5) as bundle:
        def add(path, data):
            assert path not in files
            bundle.writestr(path, data)
            files[path] = entry(data)

        for line in git('diff', '--name-status', '--no-renames', parent, head).decode().splitlines():
            change, path = line.split('\t')
            assert change in {'A', 'M'} and (path.startswith(CURRENT + '/') or path in additional_pins), path
            if change == 'M' and path in previous:
                assert entry(git('show', parent + ':' + path)) == previous[path], path
            data = git('show', head + ':' + path)
            if path in additional_pins:
                assert entry(data)['sha256'] == additional_pins[path], path
            add(path, data)
        add('REPORT_KO.md', raw('REPORT_KO.md'))
        add('STATUS.json', raw('STATUS.json'))
        add('CHECKPOINT.json', encode({'schema': 'MathScope.GoalEvidenceDelta/1',
            'parentsInOrder': parents, 'parentCommit': parent, 'deltaCommit': head,
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
               'sha256': file_sha(delta), 'branchHead': head, **evidence, 'verifiedDeltaManifest': True}
    (outputs / f'{label}_Report_{date}_KO.md').write_bytes(raw('REPORT_KO.md'))
    (outputs / f'{label}_Receipt_{date}.json').write_bytes(encode(receipt))
    print(json.dumps(receipt))


def verify_evidence(raw, source):
    for path, expected in PINS.items():
        assert entry(raw(path))['sha256'] == expected, path
    radial = source(BUDGET + 'radial-dominance.json')
    assert radial['sourceBoundRoot'] == 496 and radial['sourceRootRoles']['meanValue'] == 493
    assert radial['largestUpper'] == 'initialized-mean-value'
    assert radial['initializedReplaySHA256'] == '9dcc5ad21169fe7462bd76f588d994126f0beaef5fdfc4e6ab4657e056371b34'
    dynamic = source(DYNAMIC + 'dynamic-range.json')
    assert [row['naturalCount'] for row in dynamic['rows']] == [42, 18, 18, 18, 18]
    assert dynamic['dynamicUniqueCalls'] == 114
    kinds = {'direct': 0, 'one-log': 0, 'two-log': 0}
    for row in dynamic['rows']:
        for value in row['ys']:
            kind = value['kind']
            kinds[kind] += value['naturalCount']
            assert value['integralChecks'] and all(x['reachableAfterCut'] == 0 for x in value['integralChecks'])
            assert value['logGuardCutReach'] == (None if kind == 'direct' else 0)
    assert list(kinds.values()) == [66, 44, 4]
    hw = source(FORCED + 'n3-same-live-hw-c4-pullback.json')
    assert hw['jacobianColumnL1Upper'] == '2' and hw['affineSecondAndHigherDerivatives'] == '0'
    projected = source(FORCED + 'n3-projected-m2-source-c4.json')
    assert [row['key'] for row in projected['branches']] == ['0:1', '1:1']
    assert all(len(row['projected']) == 3 for row in projected['branches'])
    weighted = source(FORCED + 'n3-projected-m2-weighted-bound.json')
    assert weighted['branches'] == ['0:1', '1:1']
    assert weighted['sourcePins']['projection'] == PINS[FORCED + 'n3-projected-m2-source-c4.json']
    assert weighted['sourcePins']['geometry'] == PINS[FORCED + 'n3-m2-c4-source-geometry.json']

    return {'initializedJets': 67, 'dynamicNaturalCalls': 114, 'projectedBranches': 2}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS, label=LABEL,
                   date=DATE, verify=verify_evidence)
