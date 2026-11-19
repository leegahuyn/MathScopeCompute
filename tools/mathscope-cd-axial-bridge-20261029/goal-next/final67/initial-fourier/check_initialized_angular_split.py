"""Bind the angular energy split to the saved original initialized field."""

from argparse import ArgumentParser
from array import array
from collections import Counter
from fractions import Fraction
from functools import cache
import gzip
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile


sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'f1-mean'))
from bind_mean_angle_scope import Scope


SOURCE_SHA = 'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf'
REGISTRY_SHA = '657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333'
INITIAL_COUNT = 4456994
THETA, K, NEG_K = 622806, 622801, 3616133
PARAMETERS = [622802, 622803, 622804, 622791, 635044, 635045, THETA]


class InitializedGraph:
    def __init__(self, file, backing):
        self.backing = backing
        self.offsets = array('Q')
        digest = sha256()
        with gzip.open(file, 'rb') as stream:
            header = stream.readline()
            assert json.loads(header)['node_count'] == INITIAL_COUNT
            digest.update(header)
            for line in stream:
                self.offsets.append(backing.tell())
                digest.update(line)
                backing.write(line)
        assert len(self.offsets) == INITIAL_COUNT and digest.hexdigest() == SOURCE_SHA

    @cache
    def node(self, root):
        assert 0 <= root < len(self.offsets)
        self.backing.seek(self.offsets[root])
        entry = json.loads(self.backing.readline())
        return entry['op'], entry['args']

    def args(self, root, expected):
        op, args = self.node(root)
        assert op == expected, (root, expected, op)
        return args


def descendants(graph, root, op):
    tag, args = graph.node(root)
    if tag == op:
        for child in args:
            yield from descendants(graph, child, op)
    else:
        yield root


def rational(graph, root):
    return Fraction(*map(int, graph.args(root, 'rational')))


def bind_phase(graph, scope, phase, theta_term, angle_rate, winding):
    def free(root):
        return THETA not in scope.free(root)

    assert graph.args(theta_term, 'multiply') == [THETA, angle_rate]
    assert graph.args(angle_rate, 'multiply') == [623110, winding]
    assert graph.args(623110, 'inverse') == [K] and free(K)
    rounded, lo, hi, left, fallback, right = graph.args(winding, 'smooth_piecewise')
    minus, ceil = graph.args(rounded, 'multiply')
    [negated] = graph.args(ceil, 'ceiling')
    negative, shifted = graph.args(negated, 'multiply')
    half, seed = graph.args(shifted, 'add')
    assert left == right == rounded and minus == negative == 20 and rational(graph, minus) == -1
    assert rational(graph, lo) == Fraction(-1, 2) and rational(graph, hi) == rational(graph, half) == Fraction(1, 2)
    assert graph.args(fallback, 'smooth_piecewise') == [seed, 0, 0, 20, 1, 1]
    assert rational(graph, 1) == 1 and rational(graph, 0) == 0 and free(winding)
    summands = list(descendants(graph, phase, 'add'))
    assert summands.count(theta_term) == 1
    offsets = [item for item in summands if item != theta_term]
    assert all(free(item) for item in offsets)
    return {'phase': phase, 'integerWinding': winding, 'thetaFreeOffsetRoots': offsets}


def bind_local_body(graph, scope, body, phase):
    # The only angle-containing factors must be one literal trig atom per term.
    guard_rows = []
    raw = body
    while graph.node(raw)[0] == 'smooth_piecewise':
        test, lo, hi, left, raw, right = graph.args(raw, 'smooth_piecewise')
        assert left == right == 0
        assert all(THETA not in scope.free(i) for i in (test, lo, hi))
        guard_rows.append([test, lo, hi])
    assert len(guard_rows) == 7
    terms = []
    for term in descendants(graph, raw, 'add'):
        factors = list(descendants(graph, term, 'multiply'))
        trig = [i for i in factors if graph.node(i)[0] in ('cosine', 'sine')]
        assert len(trig) == 1, (body, term, factors)
        [trig_root] = trig
        op, [argument] = graph.node(trig_root)
        number, phase_root = graph.args(argument, 'multiply')
        assert phase_root == phase and number in (K, NEG_K), (argument, number, phase_root, phase)
        factors.remove(trig_root)
        assert all(THETA not in scope.free(i) for i in factors)
        terms.append({'operation': op, 'harmonicSign': 1 if number == K else -1,
                      'phaseArgument': argument, 'thetaFreeFactors': factors})
    assert terms
    return {'body': body, 'guardCount': len(guard_rows), 'terms': terms}


def bind_field(graph, scope, j, name, phases):
    field = scope.aux[1][j]
    assert field['name'] == 'OriginalAll81InitialAngular_' + name
    assert field['parameters'] == PARAMETERS
    assert len(field['rows']) == 162
    labels = Counter((row['label']['key'], row['label']['sign']) for row in field['rows'])
    assert len(labels) == 162 and set(labels.values()) == {1}
    assert Counter(sign for key, sign in labels) == {1: 81, -1: 81}
    local = {}
    for row in field['rows']:
        definition = scope.definition(row['localSystem'], 0)
        assert definition['body'] == row['localBody']
        assert definition['parameters'] == row['localParameters']
        assert row['localParameters'][-1] == row['values'][-1] == THETA
        assert row['derivativeMaps'][-1] == [{'parameter': len(row['values']) - 1, 'coefficient': 1}]
        coefficients = [m['coefficient'] for group in row['derivativeMaps'] for m in group]
        relevant = [*row['values'][:-1], row['coefficient'], *coefficients,
                    *(i for guard in row['guards'] for i in guard)]
        assert all(THETA not in scope.free(i) for i in relevant)
        sign = row['label']['sign']
        if sign not in local:
            local[sign] = bind_local_body(graph, scope, row['localBody'], phases[sign]['phase'])
        assert local[sign]['body'] == row['localBody']
    return {'field': j, 'name': name, 'signedRows': len(labels), 'local': local}


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    options = parser.parse_args()
    reg = (options.source / 'original-source-functions.json').read_bytes()
    assert sha256(reg).hexdigest() == REGISTRY_SHA
    with TemporaryFile(dir=options.output.parent) as backing:
        graph = InitializedGraph(options.source / 'original-source-nodes.jsonl.gz', backing)
        scope = Scope(graph, json.loads(reg))
        assert graph.args(NEG_K, 'multiply') == [20, K]
        assert graph.args(K, 'ceiling') == [622800]
        phases = {1: bind_phase(graph, scope, 3622968, 3622958, 625983, 625982),
                  -1: bind_phase(graph, scope, 3649464, 3649454, 629401, 629400)}
        fields = [bind_field(graph, scope, i, name, phases)
                  for i, name in enumerate(('velocity_0', 'velocity_1', 'velocity_2', 'pressure'), 6)]
        joins = []
        for i in range(4):
            total, wave, mean = 3859818 + i, 3674934 + i, 3675273 + i
            assert graph.args(total, 'add') == [wave, mean]
            assert graph.args(wave, 'm3_aux_indexed_partial') == [6 + i, PARAMETERS, [0] * 6]
            assert THETA not in scope.free(mean)
            joins.append({'total': total, 'wave': wave, 'mean': mean})
        assert THETA in scope.free(THETA)
        result = {
            'status': 'VERIFIED_ORIGINAL_INITIALIZED_ZERO_MODE_SPLIT',
            'sourceSHA256': SOURCE_SHA, 'registrySHA256': REGISTRY_SHA, 'nodeCount': INITIAL_COUNT,
            'phases': phases, 'fields': fields, 'joins': joins,
            'angleScopeCheckedNodes': len(scope.values),
            'consequence': 'In an orthonormal cylindrical frame, physical mean and nonzero wave have exact '
                           'zero full-circle inner product. Cylindrical radial and axial derivatives and '
                           '(partial_theta+J)/r preserve the separation on the admitted regular chart, '
                           'hence the full-circle kinetic and dissipation cross terms vanish.',
            'conditions': ['Original native evaluation and flat-join contracts', 'Fixed admitted r,z,time circle with r>0',
                           'Angular-independent physical chart, cutoff and spatial derivatives on the circle'],
            'scope': 'Initialized velocity and pressure only. Equal windings in different active rows '
                     'must be combined in the nonzero wave. Current absolute coefficients and their '
                     'numerical intervals, subsequent corrections and the final N7/N8 gates remain open.',
            'release': 'HOLD',
        }
    with options.output.open('x', encoding='utf8', newline='\n') as output:
        json.dump(result, output, indent=2)
        output.write('\n')
    print(f"PASS {sum(field['signedRows'] for field in fields)} actual initialized indexed rows and {len(joins)} full-field joins")


if __name__ == '__main__':
    main()
