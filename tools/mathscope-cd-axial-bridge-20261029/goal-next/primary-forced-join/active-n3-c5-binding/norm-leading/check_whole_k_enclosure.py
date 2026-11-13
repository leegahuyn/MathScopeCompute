"""Independently read back the directed maximum using exact integer arithmetic."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


def exp_chain(point):
    depth = 0
    while set(point) == {'exp'}:
        depth += 1
        point = point['exp']
    assert set(point) == {'rational'}
    return depth, Fraction(point['rational'])


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('evidence', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()

    def read(path):
        raw = (args.evidence / path).read_bytes()
        return json.loads(raw), sha256(raw).hexdigest()

    results = []
    endpoints = []
    for prefix, expected_root in [(3, 18310069), (4, 24120472)]:
        k, digest = read(f'n{prefix}-whole-k.json')
        assert k['status'] == 'DIRECTED_CONDITIONAL_WHOLE_ORIGINAL_K' and k['K'] == expected_root
        assert k['prefix'] == prefix and len(k['operands']) == 14
        assert len({row['id'] for row in k['operands']}) == 14
        files = {
            'closed': f'n{prefix}-closed.json',
            'background': f'n{prefix}-background.json',
            'map': f'n{prefix}-cutoff-map.json',
            'weightedTarget': ('weighted-target/n3-weighted-target-directed.json' if prefix == 3 else
                               'weighted-target/n4-replay/n4-weighted-target-directed.json'),
        }
        data = {}
        for key, path in files.items():
            data[key], pin = read(path)
            assert pin == k['sourcePins'][key], path
        background = data['background']
        assert background['trace']['visitedNodes'] == 808755
        assert background['arithmetic']['operations'] == 48805382
        assert not background['arithmetic']['binary64UsedForNumericalDecisions']
        assert background['counts'] == {'leading': 90, 'chart': 25299, 'historical': 3}
        assert [row['order'] for row in background['normalizedFiniteBlock']['finite']] == list(range(1, 8))
        expected = {row['id']: row['enclosure'] for row in data['closed']['ready'] if row['directKOperand']}
        expected[background['background']['id']] = background['background']['interval']
        expected[data['map']['root']] = data['map']['enclosure']
        expected.update((row['root'], row['enclosure']) for row in data['weightedTarget']['rows'])
        assert {row['id']: row['interval'] for row in k['operands']} == expected
        endpoints.append(k['enclosure'])
        depth, inner = exp_chain(k['enclosure']['upper'])
        assert depth == 10 and 0 < inner < 2**21
        assert k['enclosure']['upper'] == background['background']['interval']['upper']
        lower_depth, lower_inner = exp_chain(k['enclosure']['lower'])
        assert lower_depth == 6 and lower_inner > 0
        results.append({'prefix': prefix, 'K': expected_root, 'operandCount': 14,
                        'upperDepth': depth, 'upperInner': str(inner), 'receiptSHA256': digest})
    assert endpoints[0] == endpoints[1]
    assert 2**21 < 2**65536
    result = {'status': 'PASS_CONDITIONAL_WHOLE_K_INTEGER_READBACK', 'rows': results,
              'commonStrictUpper': 'T25', 'towerDefinition': 'T1=2; T(j+1)=2^Tj',
              'proof': 'T5=2^65536; for Tj>=2, exp(Tj)<2^(2*Tj)<=T(j+2). Apply ten times.',
              'scope': 'Integer readback of the two directed source maximum certificates; source analytic premises remain.',
              'release': 'HOLD'}
    args.output.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8', newline='\n')
    print('PASS two original maximum bounds, K < T25')


if __name__ == '__main__':
    main()
