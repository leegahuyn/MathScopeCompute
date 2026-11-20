"""Replay the actual post-Temporal, pre-FiveMap defects and five matrix rows."""

from argparse import ArgumentParser
from fractions import Fraction as F
from functools import cache
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path
import sys


PINS = {
    'manifest': '8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry': 'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'stream': 'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96',
    'reader': '2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb',
    'exact': '260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
    'cache': '909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
    'temporal': '8c2c1641bf425268451c2ef8564777c942eceb4a3a9092602a0686c88c49c460',
    'meanShell': '5fe379bdc734b5f1c17248bd4ad5b879afa19206e15d74a6f29204846cec8308',
}
R, Z, T, ELL = 17732748, 17732749, 17732750, 17732737
Y = [17745430, 17745431]
EPS, INNER, OUTER = 17732744, 17743711, 17743713


def pinned(path, key):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == PINS[key], (path, key)
    return data


def digest_poly(poly):
    encoded = [[mono, str(value)] for mono, value in sorted(poly.items())]
    return sha256(json.dumps(encoded, separators=(',', ':')).encode()).hexdigest()


def main():
    assert __debug__
    parser = ArgumentParser(description=__doc__)
    for name in ('goal', 'artifact', 'cache', 'out'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    base = args.goal / 'primary-forced-join/active-n3-c5-binding'
    readers = base / 'spatial-readback'
    supports = base / 'live-wave-gauge/signed'
    band = base / 'first-wave-guard-traces'
    exact = args.goal / 'first-force-repair'
    for path, name in [
        (readers / 'source_stream.py', 'reader'), (supports / 'source_cache.py', 'cache'),
        (exact / 'verify_repaired_first_force.py', 'exact'),
        (band / 'signed-polynomial-shell/initial-temporal/initial-temporal.json', 'temporal'),
        (band / 'signed-shell/signed-shell.json', 'meanShell'),
    ]:
        pinned(path, name)
    sys.path[:0] = [str(readers), str(supports), str(exact)]
    import source_stream
    import source_cache
    from verify_repaired_first_force import Exact

    artifact = args.artifact / 'first-correction-spatial-source'
    manifest = json.loads(pinned(artifact / source_stream.MANIFEST, 'manifest'))
    native = source_stream.Native(artifact, manifest)
    assert native.pin == PINS['registry']
    definitions = json.loads(native.base_snapshot['expressionDefinitions'])
    inverses = json.loads(native.base_snapshot['inverseDefinitions'])
    stream = source_cache.load(source_stream, artifact, manifest, 22153782, args.cache)
    try:
        assert (stream.verify['nodes'], stream.verify['sha256']) == (22155584, PINS['stream'])
        result = replay(stream, Exact, definitions, inverses)
        result.update(inputPins=PINS, sourceStream=stream.verify, hostedSourceRun=44582875351)
        args.out.write_bytes((json.dumps(result, sort_keys=True, indent=2) + '\n').encode())
        print('PASS actual full-domain post-Temporal P/Jtheta/Jz, five nonzero-denominator row identities, and native FiveMap velocities')
        print('Raw gr/angular/axial exact monomial counts:', [x['total'] for x in result['haarGroups']])
        print('Receipt SHA256:', sha256(args.out.read_bytes()).hexdigest())
    finally:
        stream.__exit__()


def replay(stream, Exact, definitions, inverses):
    class View:
        @staticmethod
        def node(index):
            row = stream.record(index)
            return row['op'], row['args']

    exact = Exact(View())
    node, poly = View.node, exact.of
    add, mul, sub, neg, power, scalar = exact.add, exact.mul, exact.sub, exact.neg, exact.pow, exact.scalar
    zt = [Z, T]
    chart = [ELL, R, Z, T]
    position = [R, Z, T, ELL]

    def application(index, key, arguments, partials=None, op='m3_aux_expression_partial'):
        partials = partials if partials is not None else [0] * len(arguments)
        assert node(index) == (op, [key, arguments, partials]), (index, node(index))

    def left_and_whole(index):
        body, bound, lo, hi = stream.args(index, 'definite_integral')
        assert lo == INNER and hi == OUTER and node(bound)[0] == 'coordinate', index
        return body, bound

    def haar(index):
        inner, variable, lo, hi = stream.args(index, 'definite_integral')
        assert (variable, lo, hi) == (Y[1], 0, 1)
        body, variable, lo, hi = stream.args(inner, 'definite_integral')
        assert (variable, lo, hi) == (Y[0], 0, 1)
        return body

    @cache
    def depends(index, wanted):
        if index < 0:
            denominator = next(m for m, atom in exact.inverse_atoms.items() if atom == index)
            return any(depends(i, wanted) for monomial, value in denominator for i, exponent in monomial)
        if index < min(wanted):
            return False
        if index in wanted:
            return True
        op, operands = node(index)
        if op in ('rational', 'source_parameter', 'coordinate'):
            return False
        if op == 'definite_integral':
            body, bound, lo, hi = operands
            free = tuple(x for x in wanted if x != bound)
            return depends(lo, wanted) or depends(hi, wanted) or bool(free and depends(body, free))
        if op in ('integer_power', 'source_step_derivative'):
            children = operands[:1]
        elif op in ('add', 'multiply', 'inverse', 'sqrt_positive', 'exp', 'log_positive', 'sine',
                    'cosine', 'maximum', 'ceiling', 'smooth_piecewise'):
            children = operands
        elif op.endswith('_partial') and len(operands) == 3 and isinstance(operands[1], list):
            children = operands[1]
        elif op == 'actual_monotone_root':
            children = operands[1:]
        elif op == 'actual_quadratic_root':
            children = operands[2:3]
        elif op in ('actual_background_picard', 'actual_background_even_profile'):
            children = operands[2:4]
        elif op == 'actual_natural_series':
            children = operands[1:3]
        else:
            raise ValueError((index, op))
        assert all(type(child) is int and child < index for child in children)
        return any(depends(child, wanted) for child in children)

    names = ['complete_gr', 'haar_gr', 'P', 'Jtheta', 'Jz', 'v', 'gamma', 'beta']
    roots = [21374149, 21374485, 21374489, 21374531, 21374575, 21374922, 21374926, 21374944]
    params = [chart + Y, chart, *([[ELL, Z, T]] * 3), *([chart] * 3)]
    assert definitions[12]['body'] == 19570917 and definitions[12]['parameters'] == chart + Y
    for i, (name, root, formal) in enumerate(zip(names, roots, params, strict=True), 13):
        prefix = 'GlobalInitializationAfterTemporal_' if i <= 17 else 'GlobalInitializationFiveBump_'
        assert (definitions[i]['name'], definitions[i]['body'], definitions[i]['parameters']) == (prefix + name, root, formal)
    assert [d['name'] for d in inverses] == ['GlobalActualTemporal_theta', 'GlobalActualTemporal_z']
    assert all(d['Y'] == Y and d['zeroMode'] == 'The exact normalized Haar mean is projected out.'
               and not d['finiteSumDeclaredEqualToLimit'] for d in inverses)
    assert all(not depends(index, (Z, T, *Y)) for index in (INNER, OUTER, EPS))

    application(haar(roots[1]), -14, chart + Y)
    body_p, radius_p = left_and_whole(roots[2])
    application(body_p, -15, [ELL, radius_p, *zt])
    theta_int, radius_theta = left_and_whole(roots[3])
    jz_vel, jz_pressure = 21374566, 21374572
    assert poly(roots[4]) == sub(poly(jz_vel), mul(scalar(F(1, 2)), poly(jz_pressure)))
    axial_int, radius_axial = left_and_whole(jz_vel)
    pressure_weighted, radius_pressure = left_and_whole(jz_pressure)
    assert len({radius_p, radius_theta, radius_axial, radius_pressure, R, *Y}) == 7
    assert poly(pressure_weighted) == mul(power(poly(radius_pressure), 2), poly(21374570))
    application(21374570, -15, [ELL, radius_pressure, *zt])

    def classify(raw, radius, expected_cov, expected_temporal, radial=False):
        """Keep products and non-torus covariance; remove only provable Haar zeros."""
        groups = {key: {} for key in ('linearTemporalZero', 'torusCovarianceDerivativeZero',
                                      'temporalQuadratic', 'plainCovariance')}
        cov_used = set()
        temporal_used = set()
        for monomial, coefficient in poly(raw).items():
            hits, temporals = [], []
            for index, degree in monomial:
                if index < 0:
                    continue
                operator, operands = node(index)
                if operator == 'm3_aux_inverse_partial' or (
                        operator == 'm3_aux_expression_partial' and operands[0] == -13):
                    key, actual, partials = operands
                    if operator == 'm3_aux_inverse_partial':
                        assert key in (0, 1) and actual == [radius, Z, T, ELL, *Y]
                        temporal_used.add(inverses[key]['name'])
                    else:
                        assert actual == [ELL, radius, Z, T, *Y]
                        temporal_used.add(definitions[12]['name'])
                    assert degree > 0 and all(order >= 0 for order in partials)
                    temporals.extend([index] * degree)
                if operator == 'm3_aux_indexed_partial':
                    slot, actual, partials = operands
                    assert actual == [radius, Z, T, ELL, *Y] and degree == 1
                    assert len(partials) == 5 and all(order >= 0 for order in partials)
                    hits.append((index, slot, tuple(partials)))
            if temporals:
                assert not hits and len(temporals) <= 2
                exempt = set(temporals)
                tag = 'linearTemporalZero' if len(temporals) == 1 else 'temporalQuadratic'
            else:
                assert len(hits) == 1
                index, slot, orders = hits[0]
                exempt = {index}
                tag = 'torusCovarianceDerivativeZero' if any(orders[3:]) else 'plainCovariance'
                if tag == 'plainCovariance':
                    cov_used.add((index, slot, orders))
            assert all(not depends(index, tuple(Y)) for index, degree in monomial if index not in exempt)
            groups[tag][monomial] = coefficient
        assert len(temporal_used) == expected_temporal
        assert all(groups[k] for k in ('linearTemporalZero', 'temporalQuadratic', 'plainCovariance'))
        assert bool(groups['torusCovarianceDerivativeZero']) == radial
        assert add(*groups.values()) == poly(raw)
        cov = {(slot, orders): index for index, slot, orders in cov_used}
        assert len(cov) == len(cov_used)
        assert set(cov) == {key for key, coefficient in expected_cov}
        assert groups['plainCovariance'] == add(*(mul(coefficient, poly(cov[key])) for key, coefficient in expected_cov))
        return {'body': raw, 'radius': radius, 'total': len(poly(raw)),
                'groups': {key: {'terms': len(value), 'sha256': digest_poly(value)} for key, value in groups.items()},
                'covarianceSlotsAndOrders': sorted(cov_used), 'temporalFamilies': sorted(temporal_used)}

    zero, dr, dz = (0, 0, 0, 0, 0), (1, 0, 0, 0, 0), (0, 1, 0, 0, 0)
    groups = [
        classify(roots[0], R, [((0, zero), neg(power(poly(R), -1))), ((0, dr), scalar(-1)),
                               ((2, dz), neg(poly(EPS))), ((3, zero), power(poly(R), -1))], 2, True),
        classify(haar(theta_int), radius_theta, [((4, zero), power(poly(radius_theta), 2))], 2),
        classify(haar(axial_int), radius_axial, [((5, zero), poly(radius_axial))], 1),
    ]

    targets = [21374870, 21374871, 21374872]
    target_applications = [21374490, 21374532, 21374576]
    scaled = [17744708, 17744712, 17744716]
    log_s = 17732771
    two_a = poly(5294)
    for i, (target, app, scale, shift) in enumerate(zip(targets, target_applications, scaled, (0, F(3, 2), 1), strict=True)):
        application(app, -16 - i, [ELL, *zt])
        assert poly(target) == mul(poly(app), poly(scale))
        assert poly(stream.args(scale, 'exp')[0]) == mul(poly(log_s), sub(two_a, scalar(shift)))
    cids, dids = [21374880, 21374883, 21374886], [21374903, 21374905]
    assert all(not depends(i, (R, *Y)) for i in cids + dids)
    c, d = [poly(i) for i in cids], [poly(i) for i in dids]
    xids = [17744719, 17744721, 17744723]
    mu = [17744671, 17744675, 17744679, 17744682, 17744686]
    a = poly(17744706)
    factors = [poly(mu[0]), mul(scalar(2), a, poly(mu[1])), neg(mul(a, poly(mu[2]))), poly(mu[3]), mul(a, poly(mu[4]))]
    assert factors[1:3] == [poly(17744727), poly(17744729)] and factors[4] == poly(17744732)
    ratios = [*map(poly, xids), poly(71672), mul(poly(71672), poly(17744725))]
    d_step, lam = scalar(F(1, 5)), poly(8)
    assert node(8) == ('source_parameter', ['lambda'])
    powers = [scalar(2), neg(add(scalar(2), mul(scalar(2), lam))), neg(mul(scalar(2), lam)),
              scalar(1), sub(scalar(1), mul(scalar(2), lam))]
    for i, root in enumerate(xids):
        assert poly(stream.args(root, 'exp')[0]) == mul(d_step, powers[i])
    assert poly(stream.args(71672, 'exp')[0]) == d_step
    assert poly(stream.args(17744725, 'exp')[0]) == mul(scalar(-2), d_step, lam)
    x0, moment_variable, moment_upper = 17743687, 17744644, 17744670
    x_log, bump = 17744665, 17744664
    assert node(x_log) == ('log_positive', [moment_variable])
    assert poly(moment_upper) == mul(scalar(F(11, 10)), poly(x0))
    def bump_argument(index):
        atoms = {i for m in poly(index) for i, degree in m if i >= 0 and node(i)[0] == 'smooth_piecewise'}
        assert len(atoms) == 1
        atom = atoms.pop()
        arg, lo, hi, below, inside, above = stream.args(atom, 'smooth_piecewise')
        assert (lo, hi, below, above) == (0, 1, 0, 0)
        denominator = mul(poly(arg), sub(exact.one, poly(arg)))
        assert poly(stream.args(inside, 'exp')[0]) == neg(exact.inv(denominator))
        return atom, arg

    template_bump, template_arg = bump_argument(bump)
    assert poly(template_arg) == mul(scalar(10), sub(mul(poly(moment_variable), power(poly(x0), -1)), exact.one))
    assert poly(bump) == mul(poly(template_bump), power(poly(x0), -1))
    for i, root in enumerate(mu):
        integrand, variable, lo, hi = stream.args(root, 'definite_integral')
        assert (variable, lo, hi) == (moment_variable, x0, moment_upper)
        bump_call, weight = stream.args(integrand, 'multiply')
        assert bump_call == bump
        assert poly(stream.args(weight, 'exp')[0]) == mul(powers[i], poly(x_log))
        assert not depends(root, (R, Z, T, *Y))
    assert poly(17744697) == add(mul(scalar(F(-59997, 2)), poly(6)), scalar(F(33, 10)),
                                 mul(sub(scalar(F(15, 2)), mul(scalar(60000), poly(6))), lam))
    assert poly(17744700) == mul(add(scalar(F(1, 2)), lam), poly(17744699))
    assert poly(17744704) == add(exact.one, power(poly(17732775), 2))
    assert exact.clear_compound_denominators(sub(mul(a, poly(17744704)), poly(17744702))) == exact.zero
    assert not depends(17744702, (R, Z, T, *Y))
    assert node(17732766) == ('actual_monotone_root', [2, Z, T])
    assert poly(17732775) == mul(poly(Z), power(poly(17732773), -1))
    assert not depends(17732775, (R, *Y)) and depends(17732773, (Z,))
    expected = [exact.zero, neg(poly(targets[0])), neg(poly(targets[2])), exact.zero, neg(poly(targets[1]))]
    residuals = [sub(mul(f, add(*(mul(power(x, j), q) for j, q in enumerate(c if row < 3 else d)))), truth)
                 for row, (f, x, truth) in enumerate(zip(factors, ratios, expected, strict=True))]
    assert all(exact.clear_compound_denominators(row) == exact.zero for row in residuals)
    # Zero and the actual post-FiveMap defect are distinct wrong right sides.
    application(21375211, -24, [ELL, *zt])
    post_five_replacement = neg(mul(poly(scaled[0]), poly(21375211)))
    for wrong in (scalar(0), post_five_replacement):
        assert exact.clear_compound_denominators(add(residuals[1], expected[1], neg(wrong))) != exact.zero
    assert add(d[0], mul(poly(71672), d[1])) == exact.zero
    profile = [17744839, 17744867, 17744897]
    assert all(not depends(root, tuple(Y)) for root in profile + scaled)
    assert poly(stream.args(17732888, 'exp')[0]) == neg(mul(poly(23), poly(log_s)))
    for j, root in enumerate(profile):
        atom, arg = bump_argument(root)
        coefficient = mul(poly(17732888), power(poly(x0), -1))
        radius_scale = power(poly(17743688), -1)
        if j:
            ratio = add(exact.one, mul(scalar(F(1, 10)), poly(arg)))
            dilations = {i for m in ratio for i, degree in m if i >= 0 and node(i)[0] == 'exp'
                         and poly(node(i)[1][0]) == scalar(F(j, 5))}
            assert len(dilations) == 1
            dilation = power(poly(dilations.pop()), -1)
            coefficient = mul(coefficient, dilation)
            radius_scale = mul(radius_scale, dilation)
        assert poly(root) == mul(coefficient, poly(atom))
        assert poly(arg) == mul(scalar(10), sub(mul(poly(R), radius_scale, power(poly(x0), -1)), exact.one))
    for root, coefficients in zip(roots[5:7], (c, d), strict=True):
        assert poly(root) == add(*(mul(poly(i), q) for i, q in zip(profile[:len(coefficients)], coefficients, strict=True)))
    body, bound, lo, hi = stream.args(21374941, 'definite_integral')
    assert (lo, hi) == (INNER, R)
    assert poly(roots[7]) == neg(mul(poly(EPS), power(poly(R), -1), poly(21374941)))
    assert poly(body) == mul(poly(bound), poly(21374939))
    application(21374939, -20, [ELL, bound, *zt], [0, 0, 1, 0])
    for i, app in enumerate([21374923, 21374927, 21374945], 19):
        application(app, -i, chart)

    interval = F(1, 20) * F(1, 2) * F(1, 3**6)
    assert F(11, 10)**4 < 2 and interval > F(1, 2**16)
    assert F(1, 3) * F(2, 5) > F(1, 8)
    assert 9 * 8**2 < 2**10  # Angular inverse Vandermonde entry.
    assert 3 * 2**10 * 2**16 * 2**5 * 2**4 <= 2**37
    assert 5 * 2**16 * 2**5 * 2**4 <= 2**37
    bump_caps = [1, factorial(2), factorial(4) + 2*factorial(3) + 2*factorial(2),
                 factorial(6) + 6*factorial(5) + 12*factorial(4) + 12*factorial(3),
                 factorial(8) + 12*factorial(7) + 48*factorial(6) + 96*factorial(5)
                 + 84*factorial(4) + 24*factorial(3)]
    assert max(bump_caps) < 2**20
    assert 2**20 * 15 * 10**4 * 2**4 < 2**44
    assert 3 * 2**4 * 2**44 * 2**37 < 2**87
    assert max(sum(comb(k, j) * factorial(j) * max(1, k-j) for j in range(k+1))
               for k in range(4)) < 2**7
    for k in range(4):
        # Unweighted gr coefficient in BR*epsilon*(CT^2+CW), by Leibniz.
        assert 2**(k+1) + 2**k + 2**(k+1) + 2**k < 2**7
    assert 2**4 + 2**7 < 2**9

    return {
        'schema': 'MathScope.C97.ActualPostTemporalFiveMap/1',
        'status': 'VERIFIED_NATIVE_POST_TEMPORAL_TARGETS_AND_FIVE_MATRIX_ROWS',
        'sourceDefinitions': dict(zip(names, roots, strict=True)),
        'wholeRadialRoots': [roots[2], roots[3], jz_vel, jz_pressure],
        'radialEndpoints': [INNER, OUTER], 'torusCoordinates': Y,
        'haarGroups': groups, 'scaleRoots': scaled, 'scaledTargetApplications': target_applications,
        'fiveMapCoefficients': {'angular': cids, 'axial': dids, 'profileCopies': profile,
                                'angularNodeRoots': xids, 'axialBaseAndRatio': [71672, 17744725],
                                'momentRoots': mu, 'positiveARoot': 17744706,
                                'fiveZeroNumerators': True, 'rejectedWrongRightSides': [0, 21375211]},
        'beta': {'integral': 21374941, 'nativeGammaZ': 21374939, 'wholeGammaMomentZero': True},
        'conditionalOrdinaryHaar': {
            'gr': '-(dR+1/R) H(beta_T^2+Wrr) - epsilon*dZ H(beta_T*gamma_T+Wrz) + H(v_T^2+Wtt)/R',
            'theta': 'R^2 H(v_T*gamma_T+Wtz)',
            'z': 'R H(gamma_T^2+Wzz)',
            'premise': 'Actual Fourier tail convergence, translation-invariant normalized Haar on the two-torus, ordinary differentiation under both integrals and full original radial coverage.',
        },
        'conditionalBounds': {
            'fiveNormalizedMomentLower': '2^-16',
            'angularNodeGapStrictLower': '1/8',
            'axialNodeGapLower': 'lambda/5',
            'unscaledDefectUpper': '2^9 * B_R^4 * epsilon * (C_T^2+C_W)',
            'defectZOrders': {'P': 3, 'Jtheta': 4, 'Jz': 3},
            'premises': 'epsilon <= 1, B_R >= max(1, innerRadius^-1, outerRadius, outerRadius-innerRadius). C_T*epsilon uniformly bounds the Temporal velocities and needed jets on every original radial path; C_W*epsilon bounds covariance jets. The suprema include needed radial derivatives for gr. Neither uniform path majorant is established by this replay.',
            'outputEpsilonOrdersWhenInverseAndChartCapsAreUniform': {'v': 1, 'gamma': 1, 'beta': 2},
            'differentiatedInverseSystem': {
                'throughZ': 4, 'coefficientCapOverScaledDefect': '2^37 * D^5 * E_eta^2',
                'D': 'max(1, 1/lambda, x0, 1/x0, 1/(K*(2*X0)^(1/2+lambda)))',
                'E_eta': 'max(1, |partial_Z^j eta| for 0<=j<=4)',
                'assumptions': '0<lambda<=1/4, |eta|<=1; exact a^-1=constant*(1+eta^2). The original s root depends on Z,T, and it must be differentiated.',
            },
            'mixedRZDerivativeOrder': 3,
            'profileDerivativeOrderNeededForBeta': 4,
            'liveChart': {'s': 17732766, 'eta': 17732775, 'physicalSNegA': 17732888, 'sDependsOnZ': True},
            'E_s': 'max(1, |partial_Z^j f| for j<=4 and f=s^(-A),s^(-1/2),s^(2A),s^(2A-3/2),s^(2A-1))',
            'profileUnscaledBumpDerivativeCaps': bump_caps,
            'physicalProfileCap': '2^44 * B_R^4 * D^5 * E_s^5',
            'vAndGammaCapOverScaledDefect': '2^87 * B_R^4 * D^10 * E_s^5 * E_eta^2',
            'betaCapOverScaledDefect': 'epsilon * 2^94 * B_R^10 * D^10 * E_s^5 * E_eta^2',
            'axisymmetricDerivatives': 'All pure torus derivatives of FiveMap are zero. The weighted left primitive beta costs up to one additional slow Z derivative of gamma, which uses Jtheta through order four.',
            'alternateInputGrade': 'If the two uniform inputs instead have common epsilon^delta and nonnegative S grades b_T,b_W with 0<delta<=1 and S>=1, the output grades are delta,delta,1+delta with S power max(2*b_T,b_W). All chart and scalar factors still have to fit the source budget.',
        },
        'open': ['unconditional global shifted-pressure and Temporal C4 caps across every original forward path',
                 'FiveMap coefficient and ordinary derivative budgets in the coupled physical Forced energy',
                 'all-order first residual and convergence'], 'finalJets': 0, 'release': 'HOLD',
    }


if __name__ == '__main__':
    main()
