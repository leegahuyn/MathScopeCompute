"""Append native graph records for the first correction and its jet expressions."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import json
import sys
from tempfile import TemporaryFile

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'f1-mean'))
from bind_first_cycle_gauge import Exact, Graph, K, Native, read_artifact
from bind_mean_angle_scope import Scope
from first_gauge_jets import materialize_requested_jets

R, Z, T, ELL, Y0, Y1, THETA = 622802, 622803, 622804, 622791, 635044, 635045, 622806
ZERO, ONE, HALF, NEG, TWO = 0, 1, 19, 20, 24
H, D, A, Q, LOG_Q, EPSILON = 9, 22, 23, 622794, 622796, 622798
INNER, OUTER, XA, XB = 633710, 633712, 3617, 28826
PHI, RADIAL_FAST, TIME_POWER, CI = 635059, 635060, 635062, 635063
BASE_GRAPH = 'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf'
SOURCE_RECEIPTS = {
    'forced': ('final67/first-forced-gauge.json', '95e5f4cce485e95414a0b6574513ea462d50a4e0cc1e98675c6d54a216e21c80'),
    'prefix': ('corrected-flat/first-forced-prefix-join.json', '8041b26b9f630df48dca9a48de942ca1b0b72669eb79b2ba2cb5853d1231b85c'),
    'gauge': ('first-gauge/corrected-gauge-replay.json', 'c61446ae5c0928c9c5b4a342dffc9403d7aa5b9138209d1edf8bc21623816a6a'),
    'five': ('first-gauge/corrected-five-whole.json', '603574a1432a8b09c88d57d9fdb389f07629a5b95ea4c06d2ab437a2524860d9'),
    'exterior': ('pressure-exterior/corrected-pressure-exterior.json', 'c5e39a3d7a18849f42189e0821c065298736893d10c60d1baad5c86f8589f04f'),
    'projection': ('corrected-flat/corrected-cycle-ledger.json', '2570a6b98bf365e44629c40c4f406a4192b42f63acda67e08e1cd0e101b87181'),
}


class Delta:
    """Use the archived node and native definition format with append-only IDs."""
    def __init__(self, graph, registry):
        self.graph = graph
        self.start = len(graph.offsets)
        self.nodes = []
        self.definitions = json.loads(registry['definitions'])
        self.native_start = [len(group) for group in self.definitions]
        self.registry = registry

    def node(self, root):
        assert type(root) is int and 0 <= root < self.start + len(self.nodes)
        return self.graph.node(root) if root < self.start else self.nodes[root - self.start]

    def emit(self, op, *args):
        index = self.start + len(self.nodes)
        self.nodes.append((op, list(args)))
        return index

    def binary(self, op, items):
        assert items
        result, *rest = items
        for root in rest:
            result = self.emit(op, result, root)
        return result

    def add(self, *items):
        return self.binary('add', [x for x in items if x != ZERO] or [ZERO])

    def mul(self, *items):
        return ZERO if ZERO in items else self.binary('multiply', [x for x in items if x != ONE] or [ONE])

    def sub(self, lhs, rhs):
        return self.add(lhs, self.mul(NEG, rhs))

    def rat(self, value):
        value = Fraction(value)
        fixed = {0: ZERO, 1: ONE, -1: NEG, 2: TWO, Fraction(1, 2): HALF}
        return fixed[value] if value in fixed else self.emit('rational', str(value.numerator), str(value.denominator))

    def exp(self, root):
        return self.emit('exp', root)

    def inv(self, root):
        return self.emit('inverse', root)

    def guard(self, root, bounds):
        for x, low, high in reversed(bounds):
            root = self.emit('smooth_piecewise', x, low, high, ZERO, root, ZERO)
        return root

    def define(self, name, body, params):
        system = 'coupled-expression:' + str(len(self.definitions[0]))
        self.definitions[0].append({'id': system, 'name': name, 'body': body, 'parameters': list(params),
                                    'derivativeLimits': [16] * len(params), 'sourceAuthenticated': False})
        return system

    def apply(self, system, args, orders=None):
        orders = [0] * len(args) if orders is None else list(orders)
        assert len(orders) == len(args) and all(0 <= order <= 16 for order in orders)
        return self.emit('m3_coupled_expression_partial', system, list(args), orders)

    def field(self, name, source, rows):
        system = 'coupled-field:' + str(len(self.definitions[1]))
        self.definitions[1].append({**source, 'id': system, 'name': name, 'rows': rows,
            'sourceRecipe': {'gaugeOfCorrectedFirstIncrement': True, 'sameOriginalFixedLabelRows': True},
            'sourceAuthenticated': False})
        return self.emit('m3_coupled_indexed_partial', system, source['parameters'], [0] * len(source['directions']))

    def snapshot(self):
        return {**self.registry, 'definitions': json.dumps(self.definitions),
                'counts': [len(group) for group in self.definitions]}


def read_receipts():
    records, hashes = {}, {}
    for key, (relative, expected) in SOURCE_RECEIPTS.items():
        raw = (HERE.parent / relative).read_bytes()
        assert sha256(raw).hexdigest() == expected, relative
        hashes[relative] = expected
        records[key] = json.loads(raw)
    assert all(records[key]['graphSHA256'] == BASE_GRAPH for key in ('gauge', 'five', 'exterior'))
    assert records['projection']['correctedFullCycle']['graphSHA256'] == BASE_GRAPH
    assert records['prefix']['firstForceGraphSHA256'] == records['forced']['sourceGraphSHA256']
    assert records['prefix']['fullCycleGraphSHA256'] == BASE_GRAPH
    assert records['prefix']['matchedPrefixNodes'] == 4197115
    return records, hashes


def additive_roots(graph, root):
    op, args = graph.node(root)
    return [term for child in args for term in additive_roots(graph, child)] if op == 'add' else [root]


def check_winding(graph, records, scope):
    algebra = Exact(graph)
    phases = records['projection']['correctedFullCycle']['sourceWindingPhases']
    assert {case['phase'] for case in records['gauge']['signedPositiveModes']} == {int(i) for i in phases}
    angle_independent = set()
    for phase, row in phases.items():
        assert row['waveNumber'] == K
        assert sorted(additive_roots(graph, int(phase))) == sorted([row['thetaTerm'], *row['offsetSummands']])
        winding = row['windingRate']
        assert algebra.mul(algebra.of(K), algebra.of(row['thetaTerm'])) == algebra.mul(algebra.of(winding), algebra.of(THETA))
        selector, left, right, below, fallback, above = graph.args(winding, 'smooth_piecewise')
        assert selector == below == above and right == HALF
        assert graph.args(left, 'rational') == ['-1', '2']
        sign, ceil = graph.args(selector, 'multiply')
        assert sign == NEG and graph.node(ceil)[0] == 'ceiling'
        _, a, b, low_value, inside_value, high_value = graph.args(fallback, 'smooth_piecewise')
        assert [a, b, low_value, inside_value, high_value] == [0, 0, NEG, ONE, ONE]
        angle_independent.update([winding, *row['offsetSummands']])
    for key, guard_key, cases in (('forced', 'sourceGuards', 'cases'), ('gauge', 'fixedGuards', 'signedPositiveModes')):
        for row in records[key][cases]:
            angle_independent.update(root for guard in row[guard_key] for root in guard)
            for pair in row['positiveNormalizedCylindricalPotential']:
                angle_independent.update(entry['root'] for entry in pair.values() if entry != 0)
    assert all(THETA not in scope.free(root) for root in angle_independent)
    return {'originalAnglePhases': len(phases), 'integerWindingRoots': sorted({r['windingRate'] for r in phases.values()}),
            'angleIndependentAmplitudeOffsetAndGuardRoots': len(angle_independent)}


def assemble_waves(delta, native, records):
    f = records['forced']
    g = records['gauge']
    reference = native.fields['ActualForcedCurrent_velocity_0']
    row_keys = ('values', 'guards', 'derivativeMaps', 'coefficient', 'label')
    rows = [{k: row[k] for k in row_keys} for row in reference['rows']]
    assert len(rows) == 162 and rows == f['sameIndexedRowMaps'] == g['same162NativeRowMaps']
    scale = g['exactNativeOwnReferenceScaling'][0]
    params = native.expressions['ActualForcedCurrent_velocity_0_reference_0']['parameters']
    own_args = scale['actualOwnArguments']
    rho = scale['rho']
    assert len(params) == len(own_args) == 16 and own_args[3:] == params[3:]
    rho_power = delta.exp(delta.mul(H, delta.emit('log_positive', rho)))
    signed = {case['key']: case for case in g['signedPositiveModes']}
    forced = {(case['key'], case['mode']): case for case in f['cases']}
    keys = {f'{d}:{sign}' for d in range(5) for sign in (1, -1)}
    assert signed.keys() == keys and forced.keys() == {(key, m) for key in keys for m in (1, 2)}
    case_bodies, wrappers = {}, {}
    for key in sorted(keys):
        parts = [forced[key, 1], forced[key, 2], signed[key]]
        guards = parts[0]['sourceGuards']
        assert guards == parts[1]['sourceGuards'] == parts[2]['fixedGuards']
        assert len(guards) == 7
        phase = parts[2]['phase']
        assert all(case['phase'] == phase for case in parts) and parts[2]['waveNumber'] == K
        for j in range(3):
            values = []
            for mode, case in zip((1, 2, 1), parts, strict=True):
                phase_m = delta.mul(delta.rat(mode), K, phase)
                pair = case['positiveNormalizedCylindricalPotential'][j]

                def component(name):
                    entry = pair[name]
                    return ZERO if entry == 0 else delta.mul(delta.rat(entry['coefficient']), entry['root'])

                c = delta.mul(component('real'), delta.emit('cosine', phase_m))
                q = delta.mul(component('imaginary'), delta.emit('sine', phase_m))
                values.append(delta.mul(TWO, delta.sub(c, q)))
            case_bodies[key, j] = delta.guard(delta.add(*values), guards)
    for sign in (1, -1):
        for j in range(3):
            body = ZERO
            for d in reversed(range(5)):
                low, high = (delta.rat(d + offset) for offset in (-Fraction(1, 2), Fraction(1, 2)))
                body = delta.emit('smooth_piecewise', params[-1], low, high, body,
                                  case_bodies[f'{d}:{sign}', j], body)
            name = f'FirstCorrectionGauge_{sign}_{j}'
            local = delta.define(name + '_own', body, params)
            wrappers[sign, j] = delta.define(name + '_reference',
                delta.mul(rho_power, delta.apply(local, own_args)), params)
    wave = []
    for j in range(3):
        registered = []
        for row in rows:
            label = row['label']
            assert row['values'][-1] == label['fixedDifference']
            system = wrappers[label['sign'], j]
            index = int(system.split(':')[1])
            registered.append({**row, 'localSystem': system,
                               'localBody': delta.definitions[0][index]['body'], 'localParameters': params})
        wave.append(delta.field(f'FirstCorrectionGauge_wave_{j}', reference, registered))
    assert all(sum(row['label']['sign'] == sign for row in rows) == 81 for sign in (1, -1))
    return wave


def bind_phase_map(delta):
    graph = delta.graph
    assert graph.node(Q) == ('exp', [622793])
    assert graph.node(622793) == ('multiply', [NEG, 622792])
    assert graph.node(622792) == ('multiply', [127, ELL])
    assert graph.node(PHI) == ('multiply', [624061, 635058])
    assert graph.node(RADIAL_FAST) == ('multiply', [625153, 635058])
    assert graph.node(TIME_POWER) == ('exp', [635061])
    assert graph.node(CI) == ('multiply', [623024, TIME_POWER])
    assert graph.node(635061) == ('multiply', [623015, 635056])
    assert graph.node(635046) == ('add', [190, ELL])
    assert graph.node(190) == ('rational', ['-2', '1'])
    assert graph.node(635056) == ('multiply', [NEG, 635055])
    assert graph.node(635055) == ('ceiling', [635054])
    assert graph.node(635058) == ('exp', [635057])
    assert graph.node(635057) == ('multiply', [624041, 635056])
    assert graph.node(623066) == ('add', [ONE, 623065])
    assert graph.node(623065) == ('multiply', [NEG, 3622])
    assert graph.node(3622) == ('sqrt_positive', [TWO])
    assert graph.node(624061) == ('exp', [624060])
    assert graph.node(624060) == ('multiply', [624048, 624059])
    assert graph.node(624059) == ('log_positive', [624050])
    assert graph.node(624050) == ('multiply', [R, 624049])
    assert graph.node(624049) == ('sqrt_positive', [Q])
    assert graph.node(625153) == ('multiply', [624061, 625152])
    assert graph.node(625152) == ('multiply', [624048, 625151])
    assert graph.node(625151) == ('multiply', [624049, 625150])
    assert graph.node(625150) == ('inverse', [624050])
    assert graph.node(623024) == ('exp', [623023])
    assert graph.node(623023) == ('multiply', [135988, LOG_Q])
    assert graph.node(135988) == ('add', [ONE, H])
    assert graph.node(LOG_Q) == ('log_positive', [Q])
    assert graph.node(EPSILON) == ('exp', [622797])
    assert graph.node(622797) == ('multiply', [H, LOG_Q])
    temporal_phase = delta.mul(TIME_POWER, delta.sub(ONE, delta.mul(Q, T)))
    y0 = delta.add(PHI, delta.mul(NEG, 623066, temporal_phase))
    y1 = delta.add(delta.mul(623066, PHI), temporal_phase)
    return y0, y1


def assemble_physical(delta, wave, records):
    g, ex = records['gauge'], records['exterior']
    assert g['FiveMap']['whole'] == ex['actualFiveMapSupport']['rawPsi']['whole'] == 4455163
    assert g['FiveMap']['directDeltaV'] == ex['actualFiveMapSupport']['directSwirl'] == 4455153
    assert ex['strictExteriorVerified'] and ex['bothEnvelopeSeamValuesZero']
    assert ex['finalFullPressure'] == g['actualPostFivePressureRoot']
    assert ex['initialFullPressure'] == g['authenticatedJ0PressureRoot']
    pot_r, wave_theta, pot_z = wave
    pot_theta = delta.add(wave_theta, g['temporal']['actualPsi'], g['FiveMap']['usedPsi'])
    c, sn = delta.emit('cosine', THETA), delta.emit('sine', THETA)
    potential = [delta.sub(delta.mul(pot_r, c), delta.mul(pot_theta, sn)),
                 delta.add(delta.mul(pot_r, sn), delta.mul(pot_theta, c)), pot_z]
    v = delta.add(g['temporal']['directDeltaV'], g['FiveMap']['directDeltaV'])
    p = delta.sub(g['actualPostFivePressureRoot'], g['authenticatedJ0PressureRoot'])
    scale = delta.exp(delta.mul(NEG, H, LOG_Q))
    b_scale = delta.exp(delta.mul(NEG, delta.add(A, HALF), LOG_Q))
    p_scale = delta.exp(delta.mul(NEG, TWO, A, LOG_Q))
    normalized = [*(delta.mul(scale, a) for a in potential), delta.mul(b_scale, v, delta.inv(R)), delta.mul(p_scale, p)]
    independent = [R, Z, T, ELL, Y0, Y1, THETA]
    chart = [R, Z, T, ELL, THETA]
    phase = bind_phase_map(delta)
    bound = [R, Z, T, ELL, *phase, THETA]
    names = ('A_x', 'A_y', 'A_z', 'b', 'pressure_increment')
    restricted = []
    for name, root in zip(names, normalized, strict=True):
        params = independent[:-1] if name == 'b' else independent
        values = bound[:-1] if name == 'b' else bound
        system = delta.define(f'FirstCorrectionNormalized_{name}', root, params)
        restricted.append(delta.guard(delta.apply(system, values), [(R, INNER, OUTER)]))
    # Use the previously proved exact original N=1 label ell=L+2, not a
    # decimal evaluation of the huge selector. The physical angle is a lift.
    assert delta.graph.node(622785)[0] == 'maximum'
    ell_fixed = delta.add(622785, TWO)
    fixed_log_q = delta.mul(NEG, 127, ell_fixed)
    fixed_q = delta.exp(fixed_log_q)
    r2 = delta.emit('coordinate', 'physical_cartesian_radius_squared')
    z = delta.emit('coordinate', 'physical_cartesian_z')
    tau = delta.emit('coordinate', 'physical_tau_one_minus_t')
    args = [delta.emit('sqrt_positive', delta.mul(r2, delta.inv(fixed_q))),
            delta.mul(z, delta.exp(delta.mul(NEG, D, fixed_log_q))),
            delta.mul(tau, delta.inv(fixed_q)), ell_fixed, THETA]
    physical_shell = [(r2, delta.mul(fixed_q, XA), delta.mul(delta.rat(4), fixed_q, XB))]
    physical = {}
    for name, root in zip(names, restricted, strict=True):
        params = chart[:-1] if name == 'b' else chart
        values = args[:-1] if name == 'b' else args
        system = delta.define(f'FirstCorrectionPhysicalChart_{name}', root, params)
        physical[name] = delta.guard(delta.apply(system, values), physical_shell)
    return dict(zip(names, normalized)), dict(zip(names, restricted)), physical, phase, r2, z, tau, ell_fixed


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--artifact', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    folder, _, manifest, run_sha = read_artifact(args.artifact, True)
    assert manifest['node_stream_sha256'] == BASE_GRAPH
    native = Native(folder / 'original-source-functions.json', manifest)
    records, hashes = read_receipts()
    with TemporaryFile() as backing:
        graph = Graph(folder / 'original-source-nodes.jsonl.gz', backing, manifest)
        delta = Delta(graph, native.raw)
        wave = assemble_waves(delta, native, records)
        normalized, restricted, physical, phase, r2, z, tau, ell_fixed = assemble_physical(delta, wave, records)
        jets = materialize_requested_jets(delta, physical, [r2, z, tau, THETA], args.repo)
        scope = Scope(delta, delta.snapshot())
        for root in (*normalized.values(), *restricted.values(), *physical.values(), *jets['interiorRoots'].values()):
            scope.free(root)
        physical_coordinates = {name: sorted(scope.free(root)) for name, root in physical.items()}
        assert set(physical_coordinates['b']) == {r2, z, tau}
        assert all(set(coords) <= {r2, z, tau, THETA} for coords in physical_coordinates.values())
        assert all(set(scope.free(root)) <= ({r2, z, tau} if name.startswith('b@') else {r2, z, tau, THETA})
                   for name, root in jets['interiorRoots'].items())
        assert all(delta.node(root)[0] == 'smooth_piecewise' for root in physical.values())
        winding = check_winding(graph, records, scope)
        result = {
            'schema': 'MathScope.M3.CorrectedFirstGaugeNativeDelta/1',
            'baseGraphSHA256': BASE_GRAPH, 'baseRegistrySHA256': manifest['definitions_sha256'],
            'baseRunSHA256': run_sha, 'evidenceSHA256': hashes,
            'baseNodeCount': delta.start, 'baseRegistryCounts': delta.native_start,
            'nodeDelta': [{'op': op, 'args': values} for op, values in delta.nodes],
            'nativeRegistryDelta': [rows[start:] for rows, start in zip(delta.definitions, delta.native_start, strict=True)],
            'unrestrictedReferenceChart': normalized, 'guardedPhysicalTorusReferenceChart': restricted,
            'commonTorusPhysicalPhaseRoots': phase, 'originalN1ReferenceLabel': ell_fixed,
            'physicalChartRoots': physical, 'physicalCoordinateIDs': {'xSquaredPlusYSquared': r2, 'z': z, 'tau': tau,
                                                                      'polarAngleLift': THETA},
            'physicalFreeCoordinates': physical_coordinates,
            'potentialAngleLiftBinding': winding,
            'firstCorrectionRequestedJetExpressions': jets,
            'scope': {'authenticFirstCorrectedCycleSourceOperands': True,
                      'explicitOriginalN1Image': True, 'angularLiftIsExternalChartCoordinate': True,
                      'allBandAndSeamJetsCertified': False, 'uniformUncutNormsCertified': False,
                      'finalAllCycleField': False, 'finalJets': 0, 'release': 'HOLD'},
        }
        histogram = Counter(op for op, _ in delta.nodes)
    raw = (json.dumps(result, indent=2) + '\n').encode()
    args.out.write_bytes(raw)
    print(json.dumps({'deltaNodes': len(result['nodeDelta']), 'nativeDefinitions': [len(x) for x in result['nativeRegistryDelta']],
                      'physicalRoots': physical, 'requestedJetExpressions': len(jets['interiorRoots']),
                      'operationCounts': dict(sorted(histogram.items())),
                      'sha256': sha256(raw).hexdigest()}))


if __name__ == '__main__':
    main()
