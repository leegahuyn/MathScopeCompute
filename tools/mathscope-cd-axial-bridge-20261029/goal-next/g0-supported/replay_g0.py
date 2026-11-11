"""Independently reconstruct the first supported forcing's 120 own coefficients."""

from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
import json
import sys


GRAPH_SHA = '1ab376e369484c63e17b0d891eebcc18ddedf53f8e6acb907bc9ec8c05d51fc3'
REGISTRY_SHA = 'bec2f66a8ed9fa4c7c9c8dc137e1b69fca234192d92fa841a724b5db23e2b50a'
FIRST_SHA = 'e0e466e8bdf8d65f06e82da38631ad5f4c5c7f12f3d073ac1bbe104a0ddf4b38'
AMPLITUDE_SHA = 'f1f6454d74fb6423361802fddad6ac0be70f8824c7f4e1107f5d3afc1b7d8b46'
R, Z, T, THETA, ELL, Y0, Y1 = 622802, 622803, 622804, 622806, 622791, 635044, 635045
EPS, K, RADIAL, SQRT_TWO = 622798, 622801, 625154, 3622
MEAN_ROOTS = [3675280, 3675282, 3675284]
PARTS = ('real', 'imaginary')


def pinned(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return json.loads(data)


def same(a, actual, expected, context):
    defect = a.sub(actual, expected)
    if defect:
        defect = a.reduce_sqrt_two(a.clear_compound_denominators(defect), SQRT_TWO)
    assert not defect, (context, len(defect), next(iter(defect.items()), None))


def coefficient(polynomial, atom):
    result = {}
    for monomial, scale in polynomial.items():
        powers = dict(monomial)
        if atom in powers:
            assert powers.pop(atom) == 1
            result[tuple(sorted(powers.items()))] = scale
    return result


def extract_atom(value):
    ((monomial, scale),) = value.items()
    ((atom, power),) = monomial
    assert scale == power == 1
    return atom


def exact_mean(graph, registry):
    expressions = registry[0]
    actual = [3675265, 3675270, 3675272, 3675253, Y0, Y1]
    nodes = [3675279, 3675281, 3675283]
    original_background = [622934, 634588, 622933]
    initialized_mean = [3614790, 3614791, 3614792]
    for j, (root, app) in enumerate(zip(MEAN_ROOTS, nodes, strict=True)):
        assert graph.node(root) == ('multiply', [3675278, app])
        assert graph.node(app) == ('m3_coupled_expression_partial', [f'coupled-expression:{j}', actual, [0]*6])
        d = expressions[j]
        assert d['name'] == f'ActualInitializedMeanVelocity_{j}' and d['parameters'] == [R,Z,T,ELL,Y0,Y1]
        assert d['body'] == 3675273+j
        assert graph.node(d['body']) == ('add', [original_background[j], initialized_mean[j]])
    assert expressions[3]['name'] == 'ActualInitializedMeanFullPressure'
    assert expressions[3]['body'] == 3675276 and graph.node(3675276) == ('add', [622935, 3615361])
    return {'normalized': MEAN_ROOTS, 'nativeApplications': nodes, 'commonFormalBodies': [3675273,3675274,3675275],
            'actualJ0PerturbationMean': initialized_mean, 'originalBackground': original_background,
            'actuals': actual, 'multiplier': 3675278, 'excludedAngularIndependentPressure': 3675276}


def case(graph, a, op_type, definitions, group):
    first, second = group
    key = first['key']
    difference, sign = map(int, key.split(':'))
    assert [r['mode'] for r in group] == [1, 2]
    phases = {d['positiveFundamentalAngle'] for r in group for d in r['rawOwnHarmonics']}
    [angle] = phases
    k, phase = graph.args(angle, 'multiply')
    assert k == K
    radial = a.mul(a.of(RADIAL), a.inv(a.pow(a.sub(a.scalar(4), a.of(SQRT_TWO)), difference)))
    time = a.mul(a.of(first['path']['ci']), a.inv(a.pow(a.of(first['path']['Tg']), difference)))
    op = op_type(a, phase, radial, time)
    phase_free = op_type(a, 0, radial, time)
    pair = lambda root: (a.of(root), a.zero)
    conjugate = lambda q: (q[0], a.neg(q[1]))

    def native(d, derivatives=None):
        actual = d['parameters']
        order = [0] * len(actual)
        for coordinate, amount in (derivatives or {}).items():
            order[actual.index(coordinate)] = amount
        return a.native('m3_coupled_expression_partial', d['id'], actual, order)

    waves = [[definitions[f'InitializedOriginalWave_{difference}_{sign}_{j}_{part}'] for part in PARTS] for j in range(3)]
    family = {d['id'] for pair_defs in waves for d in pair_defs}
    mean_ids = {f'coupled-expression:{i}' for i in range(3)}
    pressure = definitions[f'InitializedOriginalPrimaryPressure_{difference}_{sign}_imaginary']
    assert f'InitializedOriginalPrimaryPressure_{difference}_{sign}_real' not in definitions
    a1 = [tuple(native(d) for d in d_pair) for d_pair in waves]
    p1 = a.zero, native(pressure)
    velocities = {0: [pair(root) for root in MEAN_ROOTS], 1: a1, -1: [conjugate(v) for v in a1]}
    n = [op.base_derivative(op.phase, c) for c in (R, THETA, Z)]
    n[1] = op.scale(op.inv_r, n[1])
    real_leading_bodies = [a.of(d_pair[0]['body']) for d_pair in waves]
    leading_normal = a.add(*(a.mul(normal[0], lead) for normal, lead in zip(n, real_leading_bodies, strict=True)))
    same(a, leading_normal, a.zero, (key, 'actual full real leading wave is normal-tangent'))
    dot = op.sum(*(op.mul(component, wave) for component, wave in zip(n, a1, strict=True)))
    ik2 = a.zero, a.mul(a.scalar(2), a.of(K))
    cases = []
    for row in group:
        mode = row['mode']
        for j in range(3):
            nonlinear = op.quadratic(velocities, j, mode)
            if mode == 1:
                expected = op.sum(op.linear(a1, p1, j, mode), nonlinear)
            else:
                derivative_products = phase_free.quadratic({1: a1}, j, 2)
                for actual, formula in zip(nonlinear, op.sum(derivative_products, op.mul(ik2, op.mul(dot, a1[j]))), strict=True):
                    same(a, actual, formula, (key, j, 'mode-two phase contraction'))
                expected = nonlinear
            for i, part in enumerate(PARTS):
                c = next(x for x in row['components'] if x['j'] == j and x['part'] == part)
                actual = a.of(c['raw'])
                supported = a.of(c['supported'])
                same(a, actual, expected[i], (key, mode, j, part, 'complete raw polynomial'))
                same(a, supported, a.sub(expected[i], a.of(c['primary'])), (key, mode, j, part, 'corrected source'))
                # Classify the final polynomial before native evaluation.
                classes = {'wave': [], 'mean': [], 'pressure': []}
                geometry = set()
                for monomial in actual:
                    atoms = [(atom, exp) for atom, exp in monomial if atom in a.native_by_id]
                    names = [a.native_by_id[atom][1] for atom, _ in atoms]
                    assert all(s != 'coupled-expression:3' for s in names), 'mean pressure enters a nonzero harmonic'
                    wave_degree = sum(exp for (_, exp), name in zip(atoms, names, strict=True) if name in family)
                    assert (wave_degree == 2) if mode == 2 else (wave_degree == 1 or pressure['id'] in names)
                    for atom, _ in atoms:
                        op_name, name, _, orders = a.native_by_id[atom]
                        if name in family:
                            classes['wave'].append(sum(orders))
                        elif name == pressure['id']:
                            classes['pressure'].append(sum(orders))
                        elif name in mean_ids:
                            classes['mean'].append(sum(orders))
                        else:
                            assert op_name != 'm3_coupled_expression_partial', (op_name, name)
                            geometry.add((op_name, str(name)))
                demand = {name: max(orders, default=None) for name, orders in classes.items()}
                row_result = {'mode': mode, 'component': j, 'part': part, 'raw': c['raw'],
                              'supported': c['supported'], 'monomials': len(actual), 'nativeDemand': demand,
                              'otherNativeGeometry': sorted(geometry)}
                if mode == 1:
                    for coordinate, expected_power in ((R, 1), (Z, 3)):
                        atom = extract_atom(native(waves[j][i], {coordinate: 2}))
                        same(a, coefficient(supported, atom), a.neg(a.pow(a.of(EPS), expected_power)),
                             (key, j, part, 'viscous second derivative witness', coordinate))
                    row_result['secondDerivativeCoefficients'] = {'RR': '-epsilon', 'ZZ': '-epsilon^3'}
                    assert demand['mean'] == 1 and demand['wave'] == 2
                else:
                    assert c['primary'] == 0 and demand == {'wave':1, 'mean':None, 'pressure':None}
                cases.append(row_result)
    return {'key':key, 'phase':phase, 'waveSystems':[[d['id'] for d in pair_defs] for pair_defs in waves],
            'exactActualRealLeadingTangency': True,
            'angularPressureSystem':pressure['id'], 'rawComponents':cases}


def main():
    parser=ArgumentParser(description=__doc__)
    for flag in ('first-dir','out'):
        parser.add_argument('--'+flag, type=Path, required=True)
    args=parser.parse_args()
    branch=Path(__file__).resolve().parent.parent
    sys.path.insert(0, str(branch/'first-force-repair'))
    from check_repeat_forced_candidates import Graph, Exact
    from replay_repeat_conservative import DifferentialAlgebra, FourierResidual

    first=pinned(branch/'first-force-repair/independent-repaired-first-force.json',FIRST_SHA)
    amplitude=pinned(branch/'first-force-repair/independent-primary-half-amplitude.json',AMPLITUDE_SHA)
    manifest=json.loads((args.first_dir/'original-source-export-manifest.json').read_bytes())
    registry=pinned(args.first_dir/'original-source-functions.json', REGISTRY_SHA)
    assert manifest==first['snapshot'] and manifest['node_stream_sha256']==amplitude['graphSHA256']==GRAPH_SHA
    native=json.loads(registry['definitions'])
    definitions={r['name']:r for r in native[0]}
    groups={key:sorted([r for r in first['rows'] if r['key']==key],key=lambda r:r['mode']) for key in sorted({r['key'] for r in first['rows']})}
    records=[]
    with TemporaryFile() as backing:
        graph=Graph(args.first_dir/'original-source-nodes.jsonl.gz',backing,manifest)
        mean=exact_mean(graph,native)
        for group in groups.values():
            a=DifferentialAlgebra(graph,registry)
            records.append(case(graph,a,FourierResidual,definitions,group))
            DifferentialAlgebra.atom_derivative.cache_clear()
            DifferentialAlgebra.of.cache_clear()
            Exact.of.cache_clear()
            print('PASS '+records[-1]['key'],flush=True)
    assert len(records)==10 and sum(len(r['rawComponents']) for r in records)==120
    result={'schema':'MathScope.N6.ActualFirstSupportedForcingOrder/1','graphSHA256':GRAPH_SHA,'registrySHA256':REGISTRY_SHA,
            'firstForcingReceiptSHA256':FIRST_SHA,'primaryHalfAmplitudeReceiptSHA256':AMPLITUDE_SHA,'sameActualInitializedMean':mean,
            'modes':[1,2],'cases':records,'mode2CarrierIdentity':'2*i*k*(n dot a)*a',
            'uniformAnalyticNorms':'CONDITIONAL','release':'HOLD'}
    raw=(json.dumps(result,indent=2)+'\n').encode()
    args.out.write_bytes(raw)
    print(f'{sha256(raw).hexdigest()}  {args.out.name}')


if __name__=='__main__':
    main()
