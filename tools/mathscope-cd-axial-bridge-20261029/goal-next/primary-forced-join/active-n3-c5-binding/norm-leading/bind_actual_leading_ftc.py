"""Join the 90 original leading FTC bounds to their same-run N4 K operands."""
from argparse import ArgumentParser
from collections import Counter
from hashlib import sha256
from itertools import product
import json
from pathlib import Path


PINS = {'actual-leading-ftc-bindings.json': '4535e399bb473fa2c6b9d7251ab26dae8a345f4ccdab75ec227ebd4393833e6e',
        'primary-K-arithmetic-frontier.json': '22728b80327798f6fad284058b558d10527e4d8b7534a0c2bd9634eebb906b99'}
ENDPOINTS = {'F': 'f94fa27286e02bc858777aba8302c68b7c71141790aba465f177e3ee8e407bcd',
             'U': 'c1b8eef03b5cac90a9a9eabda2d9baa3f255c1bd860d382af1562a53847811af'}


def read(path, pin=None):
    raw = path.read_bytes()
    actual = sha256(raw).hexdigest()
    if pin:
        assert pin == actual, path
    return json.loads(raw), actual


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('artifact', type=Path)
    parser.add_argument('norm_dir', type=Path)
    parser.add_argument('out', type=Path)
    args = parser.parse_args()
    binding, frontier = (read(args.artifact / name, pin)[0] for name, pin in PINS.items())
    native, native_sha = read(args.artifact / 'primary-c5-native.json')
    assert native['status'] == 'VERIFIED_ORIGINAL_NATIVE_N4_PRIMARY_C5_CLASS'
    assert native['executingCommit'] == 'afa225f3252a1cf79880d327d4b909566e12e7fd'
    assert frontier['prefix'] == 4 and frontier['roots']['K'] == native['normRoot'] == 24120472
    assert binding['sourceBinding'] == native['originalBackgroundC8']['source']
    assert binding['nodeCount'] == native['originalBackgroundC8']['nodeCount']
    assert binding['graphNamespace'] == frontier['graphNamespace'] == 'norm'
    assert binding['sourceBinding']['actualFullLeadingDefinition'] is True
    assert binding['box'] == {'coordinates': [4756, 2], 'lower': [157026, 20], 'upper': [157027, 1]}
    assert {(row['id'], row['pass']) for row in native['originalBackgroundC8']['checks']} >= {
        ('full-leading-F0-including-I2-and-heat-retained', True),
        ('full-leading-U0-retained', True), ('complete-full-leading-FTC-family', True),
    }
    for field, (root, system, body) in {'F': (117100, 2, 71959), 'U': (117101, 3, 9236)}.items():
        assert binding['definitions'][field] == {'root': root, 'system': system, 'body': body,
            'parameters': [4756, 2], 'valueMaterialization': body, 'actualBodyRetained': True}
    bounds = {row['bound']: row for row in binding['rows']}
    assert len(bounds) == len(binding['rows']) == 90
    assert {(row['field'], row['radialOrder'], row['etaOrder']) for row in bounds.values()} == {
        (field, radial, total - radial) for field, total in product(('F', 'U'), range(9))
        for radial in range(total + 1)
    }
    actual = {row['id']: row['node'] for row in frontier['nodes'] if row['id'] in bounds}
    assert actual == {i: row['node'] for i, row in bounds.items()}
    intervals = {}
    for field, pin in ENDPOINTS.items():
        data, _ = read(args.norm_dir / f'{field.lower()}0-directed.json', pin)
        assert data['actualSourceParameterSHA256'] == binding['sourceBinding']['parameterExpressionSHA256']
        intervals[field] = data['FTCInterval']
    result = {'schema': 'MathScope.ActualN4LeadingFTCBoundJoin/1', 'status': 'BOUND_ALL_90_LEADING_FTC_INPUTS',
              'run': 43368204121, 'job': 131697534716, 'normRoot': frontier['roots']['K'],
              'nativeReceiptSHA256': native_sha, 'sourcePins': PINS, 'endpointPins': ENDPOINTS,
              'countByField': dict(Counter(row['field'] for row in bounds.values())),
              'sourceGraphNamespace': 'norm', 'directedFTCIntervals': intervals,
              'operands': [{k: row[k] for k in ('field', 'radialOrder', 'etaOrder', 'sourceJet', 'bound')}
                           for row in binding['rows']],
              'scope': 'The original full leading definitions, rectangle, profile and 90 retained sums are checked on the same original N4 run. The separately proved original leading majorants supply their upper endpoints.',
              'remainingNormK': 'Non-leading FTC, coordinate coefficient and weighted-target intervals must be joined separately.',
              'fullKEnclosed': False, 'release': 'HOLD'}
    args.out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8', newline='\n')
    print('PASS all 90 original N4 leading FTC sum IDs, same-run K ancestry and directed endpoint applicability')


if __name__ == '__main__':
    main()
