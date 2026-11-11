"""Verify the fixed-label physical derivative transport on the live source graph."""
from argparse import ArgumentParser
from fractions import Fraction
from pathlib import Path
import json
from tempfile import TemporaryFile

from bind_primary_amplitude import FixedLift
from check_repeat_forced_candidates import CANDIDATE_FILE, CANDIDATE_SCOPE, Graph, STREAM, verify_manifest
from replay_repeat_conservative import FIRST_PRODUCER, LIVE_RECEIPT, REPEAT_PRODUCER, pinned

ELL, ELL_REF = 622791, 3675253
R, Z, T = 622802, 622803, 622804
OWN_INDEX, BASE_INDEX = 623020, 635056
RATIO = 3675262

SHAPES = {
    9: ('source_parameter', ['h']),
    19: ('rational', ['1', '2']),
    20: ('rational', ['-1', '1']),
    24: ('rational', ['2', '1']),
    127: ('log_positive', [24]),
    190: ('rational', ['-2', '1']),
    474: ('rational', ['4', '1']),
    3622: ('sqrt_positive', [24]),
    135988: ('add', [1, 9]),
    300172: ('add', [474, 3622]),
    622792: ('multiply', [127, ELL]),
    622793: ('multiply', [20, 622792]),
    622794: ('exp', [622793]),
    622796: ('log_positive', [622794]),
    622797: ('multiply', [9, 622796]),
    622798: ('exp', [622797]),
    623015: ('log_positive', [300172]),
    623021: ('multiply', [623015, OWN_INDEX]),
    623022: ('exp', [623021]),
    623023: ('multiply', [135988, 622796]),
    623024: ('exp', [623023]),
    623025: ('multiply', [623022, 623024]),
    623065: ('multiply', [20, 3622]),
    623066: ('add', [1, 623065]),
    623067: ('add', [20, 3622]),
    624040: ('add', [474, 623065]),
    624041: ('log_positive', [624040]),
    624049: ('sqrt_positive', [622794]),
    624050: ('multiply', [R, 624049]),
    624057: ('multiply', [OWN_INDEX, 624041]),
    624058: ('exp', [624057]),
    624059: ('log_positive', [624050]),
    624060: ('multiply', [624048, 624059]),
    624061: ('exp', [624060]),
    625150: ('inverse', [624050]),
    625151: ('multiply', [624049, 625150]),
    625152: ('multiply', [624048, 625151]),
    625153: ('multiply', [624061, 625152]),
    625154: ('multiply', [624058, 625153]),
    635046: ('add', [190, ELL]),
    635057: ('multiply', [624041, BASE_INDEX]),
    635058: ('exp', [635057]),
    635060: ('multiply', [625153, 635058]),
    635061: ('multiply', [623015, BASE_INDEX]),
    635062: ('exp', [635061]),
    635063: ('multiply', [623024, 635062]),
    3675259: ('multiply', [20, ELL_REF]),
    3675260: ('add', [ELL, 3675259]),
    3675261: ('multiply', [127, 3675260]),
    RATIO: ('exp', [3675261]),
    3675263: ('sqrt_positive', [RATIO]),
    3675266: ('log_positive', [RATIO]),
    3675267: ('multiply', [22, 3675266]),
    3675268: ('exp', [3675267]),
    3859343: ('multiply', [R, 3675263]),
    3859344: ('multiply', [Z, 3675268]),
    3859345: ('multiply', [T, RATIO]),
    3859346: ('multiply', [3674923, 3675266]),
    3859347: ('exp', [3859346]),
}


def check(graph, registry, candidate, first):
    for root, node in SHAPES.items():
        assert graph.node(root) == node, (root, graph.node(root), node)
    assert graph.node(3674923) == ('add', [19, 5294])
    assert graph.node(5294) == ('multiply', [23, 24])
    assert graph.node(23) == ('add', [9, 19])
    assert graph.node(22) == ('add', [19, 21]) and graph.node(21) == ('multiply', [9, 20])
    assert not (graph.reach([624048]) & {R, Z, T, ELL, ELL_REF})
    assert all(row['path']['ci'] == 623025 and row['path']['Tg'] == 300172 for row in first['rows'])
    assert all(row['path']['levelDifference'] == int(row['key'].split(':')[0]) for row in first['rows'])
    lift = FixedLift(graph)
    assert lift.form(BASE_INDEX) == lift.form(OWN_INDEX, ((ELL, 635046),))
    _, field_rows, *_ = json.loads(registry['definitions'])
    fields = {row['id']: row for row in field_rows}
    [forced] = [fields[r['field']] for r in candidate['fields'] if fields[r['field']]['name'] == 'ActualForcedCurrent_velocity_0']
    by_label = {}
    for row in forced['rows']:
        label = row['label']
        ell, delta = label['ell'], label['fixedDifference']
        assert row['values'][3] == ell and row['values'][7] == ELL
        assert row['values'][-1] == delta
        assert by_label.setdefault(ell, delta) == delta
    for ell, delta in by_label.items():
        expected = lift.algebra.sub(lift.form(OWN_INDEX, ((ELL, ell),)), lift.form(BASE_INDEX))
        assert lift.form(delta) == expected, (ell, delta)
    assert len(by_label) == 3 and len(forced['rows']) == 162
    return {'exactSourceShapes': len(SHAPES) + 5, 'activeBandAlternatives': len(by_label),
            'signedRows': len(forced['rows']), 'samePhysicalRadius': True,
            'actualCoveringDifference': 'i(ell_own)-i(ell_ref-2)',
            'sourceReferenceRadialFast': 635060, 'sourceReferenceTimeFast': 635063,
            'sourceOwnRadialFastBeforeCoveringDivision': 625154,
            'sourceOwnTimeFastBeforeCoveringDivision': 623025,
            'normalizedDerivativeFactors': {'radial': 'rho^1/2', 'angular': 'rho^1/2',
                                            'axial': 'rho^1/2', 'time': 'rho^(1+h)'},
            'referenceEpsilonOverOwn': 'rho^h', 'residualFactor': 'rho^(2A+1/2)'}


def main():
    parser = ArgumentParser(description=__doc__)
    for key in ('candidate-dir', 'first-dir', 'official-receipt', 'out'):
        parser.add_argument('--' + key, required=True, type=Path)
    args = parser.parse_args()
    official = pinned(args.official_receipt, LIVE_RECEIPT)
    manifest, registry = verify_manifest(args.candidate_dir, CANDIDATE_SCOPE, official['commit'])
    assert manifest['node_stream_sha256'] == official['graphSHA256']
    candidate = pinned(args.candidate_dir / CANDIDATE_FILE, REPEAT_PRODUCER)
    assert candidate['snapshot'] == manifest
    first = pinned(args.first_dir / 'corrected-first-force.json', FIRST_PRODUCER)
    with TemporaryFile() as backing:
        graph = Graph(args.candidate_dir / STREAM, backing, manifest)
        bound = check(graph, registry, candidate, first)
    # The exponents are in the independent basis (1,h).
    A, D = (Fraction(1, 2), 1), (Fraction(1, 2), -1)
    add = lambda *terms: tuple(sum(entries) for entries in zip(*terms, strict=True))
    space = Fraction(1, 2), 0
    assert add(D, (0, 1)) == space
    residual = add(A, A, space)
    assert add(A, (1, 1)) == add(A, (0, 1), space, space) == residual
    result = {'schema': 'MathScope.M3.LiveRepeatFixedRowPhysicalTransport/1',
              'graphSHA256': official['graphSHA256'], 'registrySHA256': official['registrySHA256'],
              'bindings': bound, 'residualScaleExponentOneAndH': [str(value) for value in residual],
              'scope': 'R positive and ordinary derivatives of the admissible fixed row',
              'release': 'HOLD'}
    args.out.write_bytes((json.dumps(result, indent=2) + '\n').encode())
    print('PASS live fixed-row physical scales and all 162 source rows')


if __name__ == '__main__':
    main()
