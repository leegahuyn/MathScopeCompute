"""Read the actual first-cycle mean pressure/Temporal flat identities on the full graph."""

from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
import json
import sys
from tempfile import TemporaryFile


FULL_SHA = 'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf'
PRESSURE_SHA = 'c5e39a3d7a18849f42189e0821c065298736893d10c60d1baad5c86f8589f04f'
FLAT_SHA = 'd681cd509a4e84c80fbc880078f09d7ce94d1da87d6a29ec591a90d9f60e0e74'
WAVE_SHA = '7ac31a18079dd4cabf9f190dfbca0559d1ade8ea779aa4866238cd7b935eba67'
R, Z, T, THETA, ELL, Y0, Y1 = 622802, 622803, 622804, 622806, 622791, 635044, 635045
EPS, AR, CI, VR1, VT0, SQRT_TWO = 622798, 635060, 635063, 623066, 623067, 3622
CHI, CHIR, CHIZ, RHO = 633733, 633761, 633960, 633726
BACKGROUND = [622934, 634588, 622933, 622935]
GRADIENT = [4456672, 4229723, 4456706]
FINAL_GR, FINAL_P, FINAL_PM, FINAL_A0 = 4455275, 4455439, 4455781, 4455782
TEMP_GAMMA, GAMMA_DESIRED, TEMP_A1 = 4454167, 4454011, 4454181
AXIAL_FAST_FULL, FIVE_GAMMA, FIVE_WHOLE = 4456764, 4455157, 4455163
COVARIANCES = {'rr': (0, 0), 'rtheta': (0, 1), 'rz': (0, 2),
               'thetatheta': (1, 1), 'thetaz': (1, 2), 'zz': (2, 2)}


def pinned(path, digest):
    blob = path.read_bytes()
    assert sha256(blob).hexdigest() == digest
    return json.loads(blob)


def equal(a, lhs, rhs, description):
    defect = a.sub(lhs, rhs)
    if defect:
        defect = a.reduce_sqrt_two(a.clear_compound_denominators(defect), SQRT_TWO)
    assert not defect, (description, len(defect), next(iter(defect.items()), None))


def native_args(graph, node, definition, actual, orders):
    assert graph.args(node, 'm3_coupled_expression_partial') == [definition, actual, orders]


def read_direct_pressure(graph, a, definitions, t0, fixed_lift):
    """Normalize the actual direct radial shift commutator using shared integral operands."""
    assert t0['pressure'] == FINAL_PM and t0['whole'] == 4455625 and t0['defectP'] == FINAL_P
    [inner, outer] = t0['bounds']
    r = t0['binder']
    assert not any({R, Z, T, Y0, Y1} & a.scope.free(x) for x in (inner, outer))
    assert graph.args(FINAL_A0, 'multiply') == [CHIR, t0['whole']]
    assert graph.args(4455803, 'multiply') == [CHIZ, t0['whole']]
    gr = definitions['PostSignedAfterFiveMomentsFreshPAndJ_complete_gr']
    assert gr['body'] == FINAL_GR
    actual = t0['nativeGrActual']
    q0, q1 = 4456638, 4456640
    native_args(graph, q0, gr['id'], actual, [0, 0, 0, 0, 1, 0])
    native_args(graph, q1, gr['id'], actual, [0, 0, 0, 0, 0, 1])
    expected_l_integrand = a.add(a.of(q0), a.mul(a.of(VR1), a.of(q1)))
    shift_derivative = a.neg(a.mul(a.of(AR), expected_l_integrand))
    equal(a, a.of(4456642), shift_derivative, 'direct partial_R integrand')
    assert r not in a.scope.free(AR) and r not in a.scope.free(VR1)
    substitutions = {}
    for bound, i0, i1, ir in ((R, 4456653, 4456661, 4456643), (outer, 4456654, 4456662, 4456645)):
        for root, body in ((i0, q0), (i1, q1), (ir, 4456642)):
            assert graph.args(root, 'definite_integral') == [body, r, inner, bound]
        substitutions[ir] = a.neg(a.mul(a.of(AR), a.add(a.of(i0), a.mul(a.of(VR1), a.of(i1)))))

    def replace_polynomial(value):
        return a.add(*(a.mul(a.scalar(coefficient),
                             *(a.pow(substitutions.get(i, {((i, 1),): a.one[()]}), power)
                               for i, power in monomial)) for monomial, coefficient in value.items()))

    endpoint = 4455627
    endpoint_gr = 4455432
    endpoint_call, pressure_defect = graph.args(endpoint, 'add')
    if graph.node(endpoint_call)[0] != 'm3_coupled_expression_partial':
        endpoint_call, pressure_defect = pressure_defect, endpoint_call
    target_system, args, orders = graph.args(endpoint_call, 'm3_coupled_expression_partial')
    formal = gr['parameters']
    assert target_system == gr['id'] and not any(orders)
    for lhs, rhs in zip(args, formal, strict=True):
        equal(a, a.of(lhs), a.of(rhs), 'Haar radial endpoint actual tuple')
    substitutions[a.native_by_key(endpoint_call)] = a.of(endpoint_gr)
    equal(a, a.of(pressure_defect), a.neg(a.mul(a.of(RHO), a.of(FINAL_P))), 'direct endpoint rho P')
    l_pressure = a.add(a.of(4456657), a.mul(a.of(VR1), a.of(4456665)))
    want_radial = a.sub(a.sub(a.of(endpoint_gr), a.mul(a.of(RHO), a.of(FINAL_P))), a.of(FINAL_A0))
    direct_radial = a.add(a.of(4456649), a.mul(a.of(AR), l_pressure))
    equal(a, replace_polynomial(direct_radial), want_radial, 'full direct mean radial pressure gradient')
    equal(a, a.of(4455794), want_radial, 'staged radial pressure gradient')
    equal(a, a.of(4455810), a.neg(a.add(a.mul(a.of(RHO), a.of(FINAL_P)), a.of(FINAL_A0))),
          'literal final radial mean residual sign')

    # The direct and staged Z gradients use different but alpha-equivalent
    # integration binders. FixedLift applies lexical, exact substitutions.
    lift = fixed_lift(graph)
    dz = lift.algebra.sub(lift.form(4456702), lift.form(4455808))
    assert not dz, ('direct and staged mean pressure_Z', len(dz))
    fixed_lift.form.cache_clear()
    return {'directRadialGradient': GRADIENT[0], 'directMeanPartialR': 4456649,
            'originalFinalGrApplication': endpoint_gr, 'originalFinalP': FINAL_P, 'rho': RHO,
            'A0': FINAL_A0, 'directMeanZDerivative': 4456702, 'sameStagedMeanZDerivative': 4455808,
            'stagedMeanRadialGradient': 4455794, 'stagedMeanRadialResidual': 4455810,
            'heldRadialBounds': [inner, outer], 'literalEndpoint': endpoint}


def velocity_only(operator, a, field, j):
    zero = a.zero
    v = [(x, zero) for x in field]
    real, imag = operator.sum(operator.linear(v, (zero, zero), j, 0), operator.quadratic({0: v}, j, 0))
    assert not imag
    return real


def pure_mean_replay(graph, a, operator, full, indexed_fields, pressure):
    wave = {field['id'] for field in indexed_fields if field['name'].startswith(
        ('ActualForcedCurrent_velocity_', 'ActualForcedCurrent_angular_pressure',
         'GenericSigned162_velocity_', 'GenericSigned162_angular_pressure'))}
    assert len(wave) == 8

    def mean(value):
        ids = {i for i, (op, system, _, _) in a.native_by_id.items()
               if op == 'm3_coupled_indexed_partial' and system in wave}
        return {k: v for k, v in value.items() if all(i not in ids for i, _ in k)}

    full_fields = full['original_root_ids'][:4]
    observed = full['original_root_ids'][5:8]
    assert observed == [4456772, 4456774, 4456776]
    mean_fields = [mean(a.of(i)) for i in full_fields[:3]]
    background = [a.of(i) for i in BACKGROUND[:3]]
    bg_pressure = a.of(BACKGROUND[3]), a.zero
    results, velocities, bases = [], [], []
    for j, root in enumerate(observed):
        advective, udiv = graph.args(root, 'add')
        assert graph.args(udiv, 'multiply') == [full_fields[j], full['original_root_ids'][4]]
        assert GRADIENT[j] in graph.args(advective, 'add')
        pure = mean(a.of(root))
        velocity = velocity_only(operator, a, mean_fields, j)
        velocities.append(velocity)
        bases.append(velocity_only(operator, a, background, j))
        gradient = mean(a.of(GRADIENT[j]))
        equal(a, pure, a.add(velocity, gradient), ('raw wave-free component', j))
        base, _ = operator.base_derivative(bg_pressure, (R, THETA, Z)[j])
        own_pressure = {0: a.add(a.of(4456649), a.mul(a.of(AR), a.add(a.of(4456657), a.mul(a.of(VR1), a.of(4456665))))),
                        1: a.zero, 2: a.mul(a.of(EPS), a.of(pressure['directMeanZDerivative']))}[j]
        equal(a, gradient, a.add(base, own_pressure), ('exact direct background and refreshed pressure split', j))
        results.append({'rawRoot': root, 'pressureGradient': GRADIENT[j], 'pureMeanMonomials': len(pure),
                        'oldSignedPressureDerivativeCanceled': True})
    temporal = a.of(TEMP_GAMMA)
    fast = lambda u: a.mul(a.of(CI), a.add(a.mul(a.of(VT0), a.derivative(u, Y0)), a.derivative(u, Y1)))
    equal(a, mean(a.of(AXIAL_FAST_FULL)), fast(mean_fields[2]), 'raw axial fast-time term')
    equal(a, fast(a.of(FIVE_GAMMA)), a.zero, 'actual FiveMap axial fast-time zero')
    equal(a, a.sub(mean(a.of(AXIAL_FAST_FULL)), fast(temporal)), fast(a.sub(mean_fields[2], temporal)),
          'one actual Temporal contribution in raw axial time')
    return results, velocities, bases


def temporal_identity(graph, a, definitions, registry, temporal_receipt):
    temporal = definitions['afterActualSigned162_actual_meridional_potential']
    assert temporal['body'] == 4454154
    formals = temporal['parameters']
    zeros = [0] * len(formals)
    native_args(graph, 4454155, temporal['id'], formals, zeros)
    for root, axis in ((4454159, R), (4454160, Y0), (4454161, Y1)):
        native_args(graph, root, temporal['id'], formals, [int(p == axis) for p in formals])
    actual = a.add(a.of(4454159), a.mul(a.of(AR), a.add(a.of(4454160), a.mul(a.of(VR1), a.of(4454161)))),
                   a.mul(a.inv(a.of(R)), a.of(4454155)))
    equal(a, a.of(TEMP_GAMMA), actual, 'actual native temporal axial curl')
    assert temporal_receipt['temporalExteriorSource']['T1']['root'] == temporal['body']
    assert graph.args(TEMP_A1, 'multiply') == [623135, 4454170]
    assert graph.args(4454170, 'multiply') == [CHIR, 4454051]
    equal(a, a.of(4454182), a.sub(a.of(GAMMA_DESIRED), a.of(TEMP_A1)), 'expanded actual T1 FTC formula')
    actual_inverse = json.loads(registry['definitions'])[2]
    [inverse] = [row for row in actual_inverse if row['id'] == 'coupled-inverse:1']
    assert inverse['name'] == 'ActualAfterSigned_z_OriginalFastTime'
    assert inverse['Y'] == [Y0, Y1]
    equal(a, a.of(GAMMA_DESIRED), a.neg(a.mul(a.inv(a.of(CI)), a.of(4396853))), 'same desired axial inverse velocity')
    return {'temporalPotential': 4454155, 'temporalAxialVelocity': TEMP_GAMMA,
            'explicitFTCVelocity': 4454182, 'gammaDesired': GAMMA_DESIRED, 'A1': TEMP_A1,
            'sameCenteredOriginalInverse': inverse['id'], 'inverseSource': inverse['body'],
            'rawAxialFastTime': AXIAL_FAST_FULL, 'flatAxialFormula': '-ci0*N(A1)'}


def covariance_bindings(graph, exact_type, fields, definitions, wave, case_body):
    by_field = {f['name']: f for f in fields}
    by_id = {d['id']: d for d in definitions.values()}
    known = by_field['ActualForcedCurrent_velocity_0']
    reference = wave['indexedFieldReferences']['3']
    accepted = {}
    for name in COVARIANCES:
        pair = [by_field[prefix + name] for prefix in ('ActualForcedCurrent_W_', 'GenericSigned162_covariance_delta_')]
        members = []
        for field in pair:
            assert field['parameters'] == known['parameters'][:-1] and field['directions'] == known['directions'][:-1]
            arms = {}
            for row, old in zip(field['rows'], known['rows'], strict=True):
                assert all(row[k] == old[k] for k in ('label', 'coefficient', 'guards'))
                assert row['localParameters'] == old['localParameters'][:14] + old['localParameters'][15:]
                assert row['values'] == old['values'][:14] + old['values'][15:]
                assert row['derivativeMaps'] == old['derivativeMaps'][:-1]
                reference_wrapper = by_id[row['localSystem']]
                assert reference_wrapper['parameters'] == row['localParameters'] and reference_wrapper['body'] == row['localBody']
                sign = row['label']['sign']
                p = reference[str(sign)]
                scale = p['referenceScale']
                call, = [i for i in graph.args(reference_wrapper['body'], 'multiply') if i != scale]
                assert scale in graph.args(reference_wrapper['body'], 'multiply')
                own, actual, orders = graph.args(call, 'm3_coupled_expression_partial')
                assert actual == p['referenceActuals'][:14] + p['referenceActuals'][15:]
                assert not any(orders) and by_id[own]['parameters'] == row['localParameters']
                assert arms.setdefault(sign, own) == own
            assert len(field['rows']) == 162
            members.append({'field': field['id'], 'name': field['name'], 'ownArms': arms,
                            'actuals': field['parameters'], 'orders': [0] * len(field['directions'])})
        accepted[name] = members
    cases = []
    by_case = {(w['key'], w['mode']): w for w in wave['waves']}
    for key in sorted({w['key'] for w in wave['waves']}):
        d, sign = map(int, key.split(':'))
        rows = [by_case[key, m] for m in (1, 2)]
        a = exact_type(graph)
        entries = []
        for name, (i, j) in COVARIANCES.items():
            actuals = []
            for member in accepted[name]:
                body, guards = case_body(graph, by_id[member['ownArms'][sign]]['body'], d)
                assert guards == rows[0]['guards'] == rows[1]['guards']
                actuals.append(body)
            before, after = [], []
            for row in rows:
                for part in ('real', 'imaginary'):
                    u, v = (row['fields'][h][part] for h in (i, j))
                    us, vs = u['forcedCoefficientTrace']['positive'], v['forcedCoefficientTrace']['positive']
                    before.append(a.mul(a.scalar(2 * us['multiplier'] * vs['multiplier']), a.of(us['root']), a.of(vs['root'])))
                    after.append(a.mul(a.scalar(2), a.of(u['body']), a.of(v['body'])))
            equal(a, a.of(actuals[0]), a.add(*before), (key, name, 'Forced zero covariance'))
            equal(a, a.add(*(a.of(x) for x in actuals)), a.add(*after), (key, name, 'updated zero covariance'))
            entries.append({'component': name, 'forcedCovariance': actuals[0], 'signedCovarianceIncrement': actuals[1]})
        cases.append({'key': key, 'components': entries})
        exact_type.of.cache_clear()
    return accepted, cases


def complete_mean_balance(graph, a, operator, mean, base, covariance, direct):
    def total(name):
        return a.add(*(a.native('m3_coupled_indexed_partial', f['field'], f['actuals'], f['orders'])
                       for f in covariance[name]))
    d = lambda root, coord: operator.base_derivative((root, a.zero), coord)[0]
    rr, rt, rz, tt, tz, zz = map(total, COVARIANCES)
    inv_r = a.inv(a.of(R))
    wave_flux = [a.add(d(rr, R), a.mul(inv_r, a.sub(rr, tt)), d(rz, Z)),
                 a.add(d(rt, R), a.mul(a.scalar(2), inv_r, rt), d(tz, Z)),
                 a.add(d(rz, R), a.mul(inv_r, rz), d(zz, Z))]
    gr = a.of(FINAL_GR)
    equal(a, a.add(mean[0], wave_flux[0], gr), base[0], 'actual complete radial source with all original W derivatives')
    assert direct['originalFinalGrApplication'] == 4455432
    stresses = [(633815, 633888, 633891, 633892), (633863, 633987, 633989, 633990)]
    rows = []
    for j, (ids, raw, total, power) in enumerate(zip(stresses, (4455360, 4455426), (4455360, 4455812), (2, 1),
                                                    strict=True), start=1):
        sigma, radial_jet, de, negative = ids
        assert not {Y0, Y1, THETA} & a.scope.free(sigma)
        assert graph.args(negative, 'multiply') == [20, de]
        equal(a, a.of(de), a.add(a.of(radial_jet), a.mul(a.scalar(power), inv_r, a.of(sigma))),
              ('same weighted background stress divergence', j))
        assert negative in graph.args(raw, 'add')
        equal(a, a.sub(a.of(raw), a.of(negative)), a.sub(a.add(mean[j], wave_flux[j]), base[j]),
              ('actual complete final tangential mean with W derivatives', j))
        expected = a.of(raw) if j == 1 else a.add(a.of(raw), a.mul(a.of(EPS), a.of(direct['sameStagedMeanZDerivative'])))
        equal(a, a.of(total), expected, ('actual complete tangential pressure update', j))
        rows.append({'component': j, 'rawMean': raw, 'finalMeanEquation': total,
                     'originalBackgroundStress': sigma, 'originalStressRadialJet': radial_jet,
                     'originalStressWeightedDivergence': de})
    return {'meanRawSourceBody': FINAL_GR, 'actualFinalGrApplication': 4455432,
            'actualTangentialRows': rows,
            'normalizedAngularMeanIdentity': ['E_B_r - rho*P_final - A0_final', 'E_B_theta + E_theta_final',
                                              'E_B_z + E_z_final'],
            'waveFreeVelocityMonomials': [len(x) for x in mean],
            'waveMeanFluxMonomials': [len(x) for x in wave_flux],
            'originalBackgroundVelocityMonomials': [len(x) for x in base]}


def main():
    parser = ArgumentParser(description=__doc__)
    for arg in ('repo', 'full-dir', 'scratch-parent', 'pressure-receipt', 'principal-flat-receipt', 'wave-receipt', 'out'):
        parser.add_argument('--' + arg, type=Path, required=True)
    args = parser.parse_args()
    branch = args.repo.resolve() / 'tools/mathscope-cd-axial-bridge-20261029/goal-next'
    sys.path[:0] = [str(branch / 'first-force-repair'), str(args.scratch_parent / 'first-gauge')]
    from replay_repeat_conservative import DifferentialAlgebra, FourierResidual
    from check_repeat_forced_candidates import Exact, Graph, STREAM
    from bind_corrected_flat import FULL_SCOPE, case_body, verify_manifest
    from bind_primary_amplitude import FixedLift

    pressure = pinned(args.pressure_receipt, PRESSURE_SHA)
    flat = pinned(args.principal_flat_receipt, FLAT_SHA)
    wave = pinned(args.wave_receipt, WAVE_SHA)
    full, registry = verify_manifest(args.full_dir, FULL_SCOPE)
    assert full['node_stream_sha256'] == FULL_SHA
    t0 = pressure['finalT0']
    assert pressure['strictExteriorVerified'] and flat['actualModeZeroCutoffOperands']['fiveMeanPressureA0'] == FINAL_A0
    definitions, indexed_fields, *_ = json.loads(registry['definitions'])
    definitions = {r['name']: r for r in definitions}

    class ModeZeroAlgebra(DifferentialAlgebra):
        def native_by_key(self, root):
            value = self.of(root)
            ((monomial, factor),) = value.items()
            ((node, exponent),) = monomial
            assert factor == exponent == 1 and node in self.native_by_id
            return node

    class ModeZeroGraph(Graph):
        op = Graph.args

    with TemporaryFile() as backing:
        graph = ModeZeroGraph(args.full_dir / STREAM, backing, full)
        a = ModeZeroAlgebra(graph, registry)
        direct = read_direct_pressure(graph, a, definitions, t0, FixedLift)
        operator = FourierResidual(a, 0, a.of(AR), a.of(CI))
        pure, mean_velocity, base_velocity = pure_mean_replay(graph, a, operator, full, indexed_fields, direct)
        temporal = temporal_identity(graph, a, definitions, registry, pressure)
        covariance, covariance_cases = covariance_bindings(graph, Exact, indexed_fields, definitions, wave, case_body)
        balance = complete_mean_balance(graph, a, operator, mean_velocity, base_velocity, covariance, direct)
    report = {'schema': 'MathScope.N6.ActualModeZeroFlatIdentity/1', 'graphSHA256': FULL_SHA,
              'originalConservativeRoots': full['original_root_ids'][5:8],
              'physicalMeanProjection': pure, 'directFinalPressure': direct, 'temporal': temporal,
              'nativeCovarianceFields': covariance, 'zeroModeCovarianceCases': covariance_cases,
              'completeMeanBalance': balance,
              'scope': 'Exact source/FTC identities on common ordinary derivative domain; angular product averaging needs the actual closed-support hypotheses.',
              'uniformLemma82Flatness': 'CONDITIONAL'}
    raw = (json.dumps(report, indent=2) + '\n').encode()
    args.out.write_bytes(raw)
    print('PASS all three pure-mean raw residual slices, final pressure identities, and Temporal T1/axial-time binding')
    print(f'{sha256(raw).hexdigest()}  {args.out.name}')


if __name__ == '__main__':
    main()
