"""Reduce the original b1 selector and identify its remaining source bound."""
from argparse import ArgumentParser
import gzip
from hashlib import sha256
import json
from pathlib import Path

GRAPH_SHA = 'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf'
REGISTRY_SHA = '657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333'
NORM0 = [420509, 539400, 539704, 617286]
NORM1 = [420518, 539403, 539705, 617287]
HISTORICAL_NORM = 137416
SELECTOR_NODES = {
    1: ('rational', ['1', '1']), 9: ('source_parameter', ['h']), 20: ('rational', ['-1', '1']),
    24: ('rational', ['2', '1']), 127: ('log_positive', [24]),
    136158: ('inverse', [9]), 669: ('rational', ['10', '1']),
    117105: ('rational', ['6', '1']), 4654: ('rational', ['8', '1']),
    617431: ('maximum', [4654, 617430, 617357]), 617432: ('ceiling', [617431]),
    617433: ('add', [117105, 617432]), 617463: ('add', [669, 617432]),
    617464: ('multiply', [127, 617463]),
    617465: ('maximum', [137420, 127, 617464, *range(617441, 617463, 3)]),
    617517: ('inverse', [127]), 622781: ('multiply', [617465, 617517]),
    622782: ('multiply', [20, 622781]), 622783: ('ceiling', [622782]),
    622784: ('multiply', [20, 622783]), 622785: ('maximum', [617433, 622784]),
    137402: ('log_positive', [137401]), 137403: ('add', [127, 137402]),
    137404: ('multiply', [136158, 137403]), 137417: ('log_positive', [HISTORICAL_NORM]),
    137418: ('add', [127, 137417]), 137419: ('multiply', [136158, 137418]),
    137420: ('maximum', [127, 137404, 137419]),
}
PRESSURE_NODES = {
    539447: ('actual_expression_partial', [10, [539440, 539441], [1, 1]]),
    539448: ('integer_power', [539447, 2]), 539449: ('add', [1, 539448]),
    539450: ('sqrt_positive', [539449]), 539451: ('definite_integral', [539450, 539441, 20, 1]),
    539452: ('definite_integral', [539451, 539440, 0, 28824]),
    539454: ('add', [539438, 539453]), 539455: ('add', [539452, 539454]),
    539705: ('maximum', [1, 539455, 539456, 539506, 539605]),
}


def read_nodes(source, ids):
    nodes, digest = {}, sha256()
    with gzip.open(source / 'original-source-nodes.jsonl.gz', 'rb') as stream:
        header = stream.readline()
        digest.update(header)
        for count, line in enumerate(stream, 1):
            digest.update(line)
            if count - 1 in ids:
                row = json.loads(line)
                nodes[count - 1] = row['op'], row['args']
    assert count == json.loads(header)['node_count'] == 4456994
    assert digest.hexdigest() == GRAPH_SHA and nodes.keys() == ids
    return nodes, count


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    registry = (args.source / 'original-source-functions.json').read_bytes()
    assert sha256(registry).hexdigest() == REGISTRY_SHA
    definition = json.loads(json.loads(registry)['base']['base']['expression'])[10]
    assert (definition['name'], definition['parameters'], definition['body']) == (
        'ActualFinalOrderOnePressure', [4756, 2], 50558)
    expected = {**SELECTOR_NODES, **PRESSURE_NODES}
    for index, norm in enumerate(NORM0 + NORM1):
        log = 617439 + 3 * index
        expected[log] = 'log_positive', [norm]
        expected[log + 1] = 'add', [127, log]
        expected[log + 2] = 'multiply', [136158, log + 1]
    pairs = [*zip(NORM0, NORM1, strict=True), (137401, HISTORICAL_NORM)]
    nodes, count = read_nodes(args.source, set(expected) | {x for pair in pairs for x in pair})
    for index, shape in expected.items():
        assert nodes[index] == shape, (index, nodes[index])
    for lower, upper in pairs:
        lower_op, lower_args = nodes[lower]
        upper_op, upper_args = nodes[upper]
        assert lower_op == upper_op == 'maximum'
        assert set(lower_args) <= set(upper_args)

    # Use h=1/128 and C=2^65536+118, so h(C+10)-1 is an integer.
    # A scaled norm 1025/1024 is strictly between 1 and 2^(1/128).
    assert 1024 ** 128 < 1025 ** 128 < 2 * 1024 ** 128
    result = {
        'streamSHA256': GRAPH_SHA, 'registrySHA256': REGISTRY_SHA, 'nodes': count,
        'normM0': NORM0, 'normM1': NORM1, 'historicalNorm': HISTORICAL_NORM,
        'reducedSelector': 'log b1=max((C+10)log 2, log(2N)/h), C=ellMinimum, N=max(normM1,historicalNorm)',
        'smallBandDominance': 'N<=2^(h(C+10)-1)',
        'jZero': 'j=0 iff N<2^(h(C+11)-1); equality gives j=1',
        'strictCountermodel': {'h': '1/128', 'C': '2^65536+118',
                               'normRatioOverSmallBandThreshold': '1025/1024',
                               'smallBandDominant': False, 'j': 0},
        'pressureMixedPartial': {'normalizedPressureNorm': 539705, 'faceIntegral': 539452,
                                 'nativeExpression': 10, 'nativeBody': 50558,
                                 'integrand': 'sqrt(1+(partial_X partial_eta Pi1)^2)',
                                 'bounds': ['[0,Xplus]', '[-1,1]'],
                                 'requiredMajorant': '2 Xplus sqrt(1+K_Xeta^2) for uniform K_Xeta'},
        'actualFiveNormBounds': 'OPEN', 'actualJ': 'OPEN', 'release': 'HOLD',
    }
    args.out.write_bytes((json.dumps(result, indent=2) + '\n').encode())
    print('PASS corrected source stream, five remaining norm roots, and actual mixed pressure integral')


if __name__ == '__main__':
    main()
