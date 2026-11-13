"""Independently cross-check the original full N3 Forced receipt and its scope."""
from argparse import ArgumentParser
from collections import Counter
from hashlib import sha256
from itertools import product
import json
from pathlib import Path


PINS = {
    'same-family-mode-two.json': '3c851f979936637ec2b44f90c54ffe1635b19803722590f7e522b7b98846d273',
    'primary-c5-native.json': 'd4b6ce3df692d0cff66645288c25736855992987825b322a48bfbe6afd5e56a1',
    'full-first-forced-progress.json': 'c0d2a6c06906b781f12a9a2bd1e1114e9e112f176c4e13b50677fc04b77ffe52',
    'native-run.log': '1c453e241d305418f325b1b67fff0decc18d62f9c2103b5488bcbc1f0cf5af2a',
}
EXPECTED_STAGES = {
    'same-family-moments': 17745430, 'same-family-pressure': 19560947,
    'same-family-temporal': 21374032, 'same-family-initialized-mean': 21376022,
    'same-family-initialized-angular': 21620247,
}
CHECKS = {
    'actual-after-forced-all-new-current-harmonics': 1,
    'actual-after-forced-all162-covariance-and-wave-fields': 1,
    'actual-after-forced-mean-pressure-recomputed-from-new-full-W': 1,
    'actual-after-forced-source-support-and-private-input': 1,
    'actual-all20-forced-positive-source-systems': 1,
    'actual-forced-complete-complex-pressure-and-curl': 20,
    'actual-forced-full-source': 20,
    'actual-forced-full-update': 540,
    'actual-forced-original-fixed-transverse-system': 20,
    'actual-forced-original-pulse-domain': 20,
    'actual-forcing-conjugate': 120,
    'complete-original-coefficient-body-and-own-argument-bindings': 20,
    'every-complex-component-and-pressure-has-a-source-root': 20,
    'previous-increment-pressure-and-old-flat-inventories-retained': 20,
}


def check(receipt, primary, progress, log):
    assert receipt['status'] == 'VERIFIED_COMPLETE_SAME_LIVE_N3_FIRST_FORCED'
    assert receipt['prefix'] == 3 and receipt['completeForcedSeal'] is True
    assert receipt['numericOutputBound'] is False and receipt['finalJets'] == '0/67'
    assert primary['originalCommit'] == 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
    assert primary['executingCommit'] == '7851d633bea03da452f171924edfb55faf8eb501'
    assert primary['status'] == 'VERIFIED_ORIGINAL_NATIVE_N3_PRIMARY_C5_CLASS'
    norm = receipt['normRoots']
    assert norm['namespace'] == 'norm' and norm['K'] == 18310069
    assert [row['order'] for row in norm['classRows']] == list(range(6))
    assert {row['name']: row['nodes'] for row in receipt['stages']} == EXPECTED_STAGES

    full = receipt['full']
    assert full['assembly'] == {'allOriginalSourceLabels': 81, 'signedSourceContributions': 162,
                                'exactPositiveSourceSystems': 20, 'exactNegativeConjugateSolutionRoutes': 20}
    assert full['nodes'] == 21999237
    expected_keys = [f'{band}:{sign}' for band, sign in product(range(5), (1, -1))]
    expected_pairs = list(product(expected_keys, (1, 2)))
    rows = full['rows']
    assert [(row['key'], row['harmonic']) for row in rows] == expected_pairs
    assert sorted(row['system'] for row in rows) == list(range(20))
    assert all(row['forcedOutputClassCertified'] is False for row in rows)

    def root(index):
        assert type(index) is int and 0 <= index < full['nodes']

    for row in rows:
        assert row['sourcePulseSystem'] == int(row['key'].endswith(':-1'))
        names = ['raw', 'supported', 'originalSource', 'projected']
        if row['harmonic'] == 1:
            names.append('principal')
        else:
            assert row['principal'] is None and row['supported'] == row['raw']
        for name in names:
            assert len(row[name]) == 3
            for part in row[name]:
                assert set(part) == {'real', 'imaginary'}
                root(part['real'])
                root(part['imaginary'])
        assert len(row['H_w']) == 2 and len(row['localCoordinates']) == 5
        for index in row['H_w'] + row['localCoordinates']:
            root(index)
    checks = full['checks']
    assert all(row['pass'] is True for row in checks) and len(checks) == 805
    assert {name: count for name, count in Counter(row['id'] for row in checks).items() if count > 1} == {
        'complete-original-coefficient-body-and-own-argument-bindings': 20,
        'every-complex-component-and-pressure-has-a-source-root': 20,
        'previous-increment-pressure-and-old-flat-inventories-retained': 20,
    }
    def check_group(name):
        for key in expected_keys:
            if f'-{key}-' in name:
                return name.split(f'-{key}-', 1)[0]
        return name

    groups = Counter(check_group(row['id']) for row in checks)
    assert groups == CHECKS
    assert full['scope']['actualCompleteUpdatedCurrentConstructed'] is True
    assert full['scope']['allOriginalAndNewPressureTermsRetained'] is True
    assert full['scope']['numericalWholeFieldEnclosure'] is False
    assert full['scope']['allCorrectionStagesConstructed'] is False
    roots = full['roots']
    assert roots == {'velocity': [21998303, 21998304, 21998305], 'pressure': 21998306,
                     'physicalResidual': [21998620, 21998622, 21998624]}

    assert len(progress) == 11 and progress[0]['kind'] == 'actual-forced-inverses-and-refreshed-pressure'
    assert progress[0]['key'] is None and progress[0]['nodes'] == 21728915
    assert [row['key'] for row in progress[1:]] == expected_keys
    assert all(row['kind'] == 'actual-forced-local-residual-before-verification' for row in progress[1:])
    counts = [row['nodes'] for row in progress] + [full['nodes']]
    assert all(a < b for a, b in zip(counts, counts[1:]))
    for row in progress:
        assert json.dumps(row, separators=(',', ':')) in log
    return {'status': 'VERIFIED_NATIVE_RECEIPT_INVENTORY_AND_SCOPE', 'run': 43363985428,
            'job': 131683921752, 'executingCommit': primary['executingCommit'],
            'sourcePins': PINS, 'normRoot': norm['K'], 'nodeCount': full['nodes'],
            'assembly': full['assembly'], 'checks': dict(sorted(groups.items())), 'roots': roots,
            'nativeAssertionsReranInGitHub': True, 'astReevaluationInThisReadback': False,
            'completeFirstFourStepCycle': False, 'N706': 'OPEN', 'N805': 'OPEN',
            'finalJets': '0/67', 'release': 'HOLD'}


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('artifact', type=Path)
    parser.add_argument('out', type=Path)
    args = parser.parse_args()
    inputs = []
    for name, pin in PINS.items():
        raw = (args.artifact / name).read_bytes()
        assert sha256(raw).hexdigest() == pin, name
        inputs.append(raw.decode() if name.endswith('.log') else json.loads(raw))
    result = check(*inputs)
    args.out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8', newline='\n')
    print('PASS original N3 full Forced receipt, 20 inverse pairs, 805 source checks and all 11 checkpoints')


if __name__ == '__main__':
    main()
