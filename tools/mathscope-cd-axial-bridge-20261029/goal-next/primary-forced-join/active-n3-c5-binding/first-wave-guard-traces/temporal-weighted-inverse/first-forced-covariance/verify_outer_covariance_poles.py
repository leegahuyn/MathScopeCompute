"""Check live source pole inputs and derive the outer covariance and Signed jets."""
from argparse import ArgumentParser
from collections import Counter, defaultdict
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
from math import comb, factorial
from pathlib import Path
import json
import sys


PINS = {
    'forced': '705013059e1f064c3f9826c7c1846128064a26fa777bab6e335ed98a8c133fdd',
    'forcedCheck': '5ba5c2b69db25ec0a60471ed674436a183a2d03607ee31a81f8935ac2df1a943',
    'covariance': '87ee4c05499ed8cdc1b22c490eb9eebb26375e04063559245ead711eaf8be970',
    'pressure': '22ff14cbd3c6df110159eb33d1cd6c938ecfdc08242d917a22a200bfb2075797',
    'cubic': 'ccb89be13cc70fc69257ffe594b3f4bf5e4fd7d9a8a99c23cd1a3bdf784f18aa',
    'globalAngular': 'eb4e4ae44e9bb84713f89d36d1d7ae33cf1b072638d0a8e67e2a90f38d411010',
    'sourceBand': 'a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b',
    'outerFactor': 'd0a991f5e789aae7aa35dd8c18b9a82d9be40b8f31955ce9f166b108aef00c0c',
    'first': '6bf1e8c538e67bec6ea52e5960fd5cb23a556442d413d120025c49f30f117c27',
    'wave': '40eca0227cc0f9d541dc868fb4fc8cc1734eb63dbad54ea2631748c19c3d5c9b',
    'manifest': '8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry': 'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'cache': '909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
    'reader': '6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48',
    'exact': '260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
}
STREAM = 'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
FIELDS = {'rr': (0, 0), 'rtheta': (0, 1), 'rz': (0, 2),
          'thetatheta': (1, 1), 'thetaz': (1, 2), 'zz': (2, 2)}
ZERO, R, Z, L = (0, 0, 0), (1, 0, 0), (0, 1, 0), (0, 0, 1)
CURL = ({1: (Z,)}, {0: (Z,), 2: (R, L)}, {1: (R, L, ZERO)})


def sha(value):
    return sha256(value).hexdigest()


def pinned(path, name):
    raw = path.read_bytes()
    if path.suffix == '.py':
        raw = raw.replace(b'\r\n', b'\n')
    assert sha(raw) == PINS[name], name
    return raw


def verify_layers(g, Exact, previous, force, registry):
    view = previous.NodeView(g)
    exact = Exact(view)
    definitions = {d['id']: d for d in json.loads(registry['definitions'])[0]}
    classes, limits, operand_counts = defaultdict(set), defaultdict(set), Counter()
    expressions = defaultdict(set)
    mean_orders = defaultdict(set)

    for row in force:
        mode = row['harmonic']
        template = row['key'].replace(':', '_')

        @cache
        def is_source_field(root):
            op, args = view.node(root)
            if op == 'm3_coupled_expression_partial':
                previous.scalar_roles(definitions[args[0]]['name'], template)
                return True
            if op in ('add', 'multiply'):
                return any(is_source_field(x) for x in args)
            if op == 'integer_power':
                return is_source_field(args[0])
            return False

        @cache
        def expand(root):
            op, args = view.node(root)
            if op == 'rational':
                return exact.scalar(Q(*map(int, args)))
            if not is_source_field(root) or op == 'm3_coupled_expression_partial':
                return {((root, 1),): Q(1)}
            if op == 'add':
                return exact.add(*(expand(x) for x in args))
            if op == 'multiply':
                return exact.mul(*(expand(x) for x in args))
            assert op == 'integer_power' and args[1] >= 0
            return exact.pow(expand(args[0]), args[1])

        for component in row['supported']:
            for root in component.values():
                operand_counts[str(mode)] += 1
                for term in expand(root):
                    orders = defaultdict(list)
                    for atom, multiplicity in term:
                        op, args = view.node(atom)
                        if op == 'm3_coupled_expression_partial':
                            entry = definitions[args[0]]
                            role = previous.scalar_roles(entry['name'], template)
                            assert len(entry['parameters']) == len(args[1]) == len(args[2])
                            orders[role].extend([sum(args[2])] * multiplicity)
                            limits[role].add(min(entry['derivativeLimits']))
                            expressions[role].add(entry['id'])
                            if role == 'mean':
                                assert entry['parameters'] == [17732748,17732749,17732750,17732737,17745430,17745431]
                                rr, zz, tt, label, y0, y1 = args[2]
                                assert tt == label == 0
                                mean_orders[entry['name'][-1]].add((rr, zz, y0, y1))
                    tag = '+'.join(role for role in sorted(orders) for _ in orders[role])
                    classes[mode, tag].add(tuple((key, tuple(sorted(orders[key]))) for key in sorted(orders)))

    expected = {(1, 'u'), (1, 'p'), (1, 'tail'), (1, 'mean+u'), (2, 'u+u')}
    assert set(classes) == expected and operand_counts == {'1': 60, '2': 60}
    degrees = {
        (mode, role): {sum(order for _, dd in row for order in dd) for row in values}
        for (mode, role), values in classes.items()
    }
    assert degrees == {(1, 'u'): {0, 1, 2}, (1, 'p'): {0, 1}, (1, 'tail'): {0},
                       (1, 'mean+u'): {0, 1}, (2, 'u+u'): {0, 1}}
    table = []
    for key in sorted(classes):
        table.append({'mode': key[0], 'class': key[1], 'summedRawFieldDerivativeOrders': sorted(degrees[key]),
                      'exactOrdersByField': [dict(shape) for shape in sorted(classes[key])]})
    return {
        'rawClassOrders': table,
        'rawRootsByMode': dict(sorted(operand_counts.items())),
        'nativeDefinitionsByRole': {role: {'count': len(expressions[role]), 'minimumDerivativeLimits': sorted(rows)}
                                    for role, rows in sorted(limits.items())},
        'rawInitializedMeanOrdersByComponent': {axis: sorted(rows) for axis, rows in sorted(mean_orders.items())},
        'nativeGlobalMaximumOrder': registry['maximumOrder'],
    }


def add(a, b):
    return tuple(x + y for x, y in zip(a, b, strict=True))


def down(order):
    return set(product(*(range(n + 1) for n in order)))


def demands(max_r):
    direct, press = set(), set()
    for j in range(max_r + 1):
        direct.update((field, (j + offset, z, 0)) for field, offset, z in
                      (('rtheta', 1, 0), ('rtheta', 0, 0), ('rz', 1, 0), ('rz', 0, 0),
                       ('thetaz', 0, 1), ('zz', 0, 1)))
        press.add(('rr', (j, 1, 0)))
        for k in range(max(1, j)):
            press.update((field, (k, z, 0)) for field, z in (('rr', 1), ('thetatheta', 1), ('rz', 2)))

    def operands(roles):
        leaves = [set() for _ in range(3)]
        for kind, beta in roles:
            for position in FIELDS[kind]:
                leaves[position].update(down(beta))
        return leaves

    velocity = operands(direct | press)
    direct_velocity = operands(direct)
    potentials = [set() for _ in range(3)]
    for component, orders in enumerate(velocity):
        for beta in orders:
            for potential, directions in CURL[component].items():
                for gamma in directions:
                    potentials[potential].update(down(add(beta, gamma)))
            for target in potentials:
                target.update(down(beta))
    forcing = set.union(*potentials)
    assert {a for b in forcing for a in down(b)} == forcing
    return {'directTensorOrders': sorted(direct), 'pressureTensorOrders': sorted(press),
            'directVelocityOrders': [sorted(s) for s in direct_velocity],
            'combinedVelocityOrders': [sorted(s) for s in velocity],
            'byPotential': [sorted(s) for s in potentials],
            'forcingAndMatrixDirections': sorted(forcing),
            'aggregateLabelledComplexVelocityRoles': 30 * sum(map(len, velocity)),
            'aggregateLabelledComplexProjectedRHSRoles': 60 * len(forcing),
            'highestNativeVariationalOrder': max(map(sum, forcing))}


def expand_mean_demand(native, needed):
    result = {}
    for component, raw in native['rawInitializedMeanOrdersByComponent'].items():
        asks = set()
        for r, z, l in needed:
            for j in range(l + 1):
                for order in raw:
                    asks.add(add((r, z, j, l-j), order))
        assert {one for a in asks for one in down(a)} == asks
        highest = sorted(a for a in asks if sum(a) == 5)
        assert max(map(sum, asks)) == 5 and max(a[1] for a in asks) == 4
        assert (0,5,0,0) not in asks and (1,4,0,0) in asks
        result[component] = {'sourceComponent': ('beta','v','gamma')[int(component)],
                             'allNativeOrdersRZ_Y0Y1': sorted(asks),
                             'exactTopDegreeDemandRZ_Y0Y1': highest,
                             'largestZOrder': max(a[1] for a in asks)}
    return {'orders': ['partial_R','partial_Z','partial_Y0','partial_Y1'],
            'perVelocityComponent': result,
            'scope': 'Safe structural closure from the actual surviving raw atoms and affine regular projection, before any analytic cancellation.'}


def bounds(signed, native, covariance):
    half = Q(1, 2)
    # Taylor polynomial recurrence for d^(-3/2)*exp(-2/d^2), with q=d^2.
    polynomials = [[Q(1)]]
    for j in range(7):
        p = polynomials[-1]
        out = [Q(0)] * (len(p) + 1)
        for k, c in enumerate(p):
            out[k] += 4 * c
            out[k + 1] += (2*k-Q(3, 2)-3*j)*c
        polynomials.append(out)
    assert [x[0] for x in polynomials] == [4**j for j in range(8)]
    g_increase = Q(3)
    g_base = Q(3, 2)
    primary = (half, g_base + g_increase)
    degrees = {(row['mode'], row['class']): max(row['summedRawFieldDerivativeOrders'])
               for row in native['rawClassOrders']}
    raw = {1: (half, primary[1] + degrees[1, 'u']*g_increase),
           2: (Q(1), 2*primary[1] + degrees[2, 'u+u']*g_increase)}
    pressure = g_base + degrees[1, 'p']*g_increase
    principal_tail = g_base + degrees[1, 'tail']*g_increase
    mean_mixed = primary[1] + degrees[1, 'mean+u']*g_increase
    assert max(pressure, principal_tail, mean_mixed) < raw[1][1]
    f1, f2 = ((raw[i][0], raw[i][1] + g_increase) for i in (1, 2))
    pairs = [(primary, f1), (f1, primary), (f1, f1), (f2, f2), (primary, primary)]
    weights = [add(a, b) for a, b in pairs]
    p_w = max(p for k, p in weights if k == 1)
    assert weights == [(1, 18), (1, 18), (1, 27), (2, 30), (1, 9)]
    # For the f2 square, zeta*d^(-3) <= d/8 <= 1. The outer factor already supplies this reserve.
    reserve = weights[3][1] - p_w
    assert reserve == 3 and Q(factorial(2), 4**2) * Q(1, 4) ** (4-reserve) <= 1

    p_e = [p_w + 3*(j+1) for j in range(3)]
    pressure_0 = max(p_w + 3, p_w + 6 - 3)
    assert [pressure_0] + [max(p_w+3*(j+1), p_w + 3*(j-1+2)) for j in (1, 2)] == p_e
    assert max(p_e) <= signed['outerOriginalCutoff']['maximumGuaranteedPole'] == 63
    p_sigma = [p_e[0] - 3] + p_e
    p_signed = [p_sigma[j]-Q(3, 2) for j in range(4)]
    assert p_sigma == [27, 30, 33, 36] and p_signed == [Q(51, 2), Q(57, 2), Q(63, 2), Q(69, 2)]
    finite_gap = Q(1, 128)**2 / (2 * Q(7, 4)**2)
    assert finite_gap == Q(1, 100352)
    # Ten signatures are reused across 162 actual signed rows. On each
    # frozen row |rho^(2A)| <= 16, and the slow R/Z affine factors <= 2.
    # The 2^(j+1) angular product factor includes 2^j from Leibniz.
    cover_multipliers = [covariance['angularCovariance']['coverRowsPerField'] * 16 * 2**(2*j+1)
                         for j in range(4)]
    assert cover_multipliers == [5184, 20736, 82944, 331776]
    radius_derivative_coefficients = [[comb(j,k)*factorial(k) for k in range(j+1)] for j in range(3)]
    assert radius_derivative_coefficients == [[1], [1,1], [1,2,2]]
    return {
        'positiveOuterPrimaryFactorDerivativePolynomials': [[str(x) for x in row] for row in polynomials],
        'oppositeGaussianRatioAtMost': str(1/(1-finite_gap)),
        'poleIncreasePerDerivative': 3,
        'baseGaussianExponentAndPole': {name: list(map(str, row)) for name, row in
                                       {'a1Velocity': primary, 'projectedF1': raw[1], 'projectedF2': raw[2],
                                        'F1Velocity': f1, 'F2Velocity': f2}.items()},
        'covariancePairsIncludingPrimaryBaseline': [list(map(str, x)) for x in weights],
        'covarianceBasePole': int(p_w),
        'covarianceGaussianExponent': 1,
        'covarianceCoverMultipliers0to3': cover_multipliers,
        'covarianceCoefficientConstant': 'C_j = coverMultiplier_j*(Pcap^2+2*Pcap*F1cap+F1cap^2+F2cap^2)',
        'inverseRadiusLeibnizCoefficientRows': radius_derivative_coefficients,
        'directEConstant': '(1+epsilon)*C_(j+1)+w*sum_(k=0)^j binom(j,k)*k!*C_(j-k)/Rmin^(k+1), w=2 or 1',
        'pZCovarianceConstants0to2': [
            'C1+(Rmax/8)*(2*C1/Rmin+epsilon*C2)',
            '(1+epsilon)*C2+2*C1/Rmin',
            '(1+epsilon)*C3+2*C2/Rmin+2*C1/Rmin^2',
        ],
        'pressureRadialPoles0to2': list(map(int, p_e)),
        'covarianceHaarERadialPoles0to2': list(map(int, p_e)),
        'covarianceSignedSigmaRadialPoles0to3': list(map(int, p_sigma)),
        'covarianceSignedPotentialRadialPoles0to3': list(map(str, p_signed)),
        'covarianceSignedPotentialGaussianExponent': '1/2',
    }


def main():
    if not __debug__:
        raise RuntimeError('Run with assertions enabled')
    cli = ArgumentParser(description=__doc__)
    for name in ('goal', 'runtime', 'outer-runtime', 'artifact', 'cache', 'out'):
        cli.add_argument('--'+name, type=Path, required=True)
    args = cli.parse_args()
    active = args.goal / 'primary-forced-join/active-n3-c5-binding'
    shell = active / 'first-wave-guard-traces'
    forced_dir = shell / 'angular-order-one-shell/forced'
    source = args.artifact / 'first-correction-spatial-source'
    runtime = args.runtime / 'research-ide/mathscope-m3/navier'
    paths = {
        'forced': forced_dir / 'forced-shell-final.json',
        'forcedCheck': forced_dir / 'verify_forced_shell.py',
        'covariance': shell / 'weighted-haar-shell/covariance/covariance-shell.json',
        'pressure': shell / 'weighted-haar-shell/pressure/pressure-shell.json',
        'cubic': shell / 'signed-polynomial-shell/signed-cubic-transfer.json',
        'globalAngular': runtime / 'source-global-angular.mjs',
        'sourceBand': runtime / 'source-global-band.mjs',
        'outerFactor': args.outer_runtime / 'research-ide/mathscope-m2/navier/actual-outer-covariance-flat-extension.mjs',
        'first': args.artifact / 'same-family-mode-two.json',
        'wave': active / 'live-wave-gauge/forced/forced-wave.json',
        'manifest': source / 'original-source-export-manifest.json',
        'registry': source / 'original-source-functions.json',
        'cache': active / 'live-wave-gauge/signed/source_cache.py',
        'reader': active / 'spatial-readback/verify_spatial_artifact.py',
        'exact': args.goal / 'first-force-repair/verify_repaired_first_force.py',
    }
    values = {name: pinned(path, name) for name, path in paths.items()}
    forced, covariance, pressure, cubic, first, wave, manifest, registry = (
        json.loads(values[k]) for k in ('forced','covariance','pressure','cubic','first','wave','manifest','registry'))
    assert covariance['angularCovariance']['matchedCovarianceBodies'] == 60
    assert covariance['angularCovariance']['coverRowsPerField'] == 162
    assert pressure['reduction']['remainingCovarianceDerivativeRoles'] == ['Wrr_Z','Wthetatheta_Z','Wrz_ZZ']
    assert pressure['actual']['axialResidualPressureArm'] == 22000444
    assert all(fragment in values['outerFactor'] for fragment in [
        b'sqrtExponential=G.exp(G.neg(G.mul(q(2),G.pow(delta,-2))))',
        b'halfPower=G.exp(G.mul(q(-3,2),G.log(delta)))',
        b'positiveSquareRoots=W.map(x=>G.mul(sqrtFlat,G.sqrt(x)))',
    ])
    assert all(fragment in values['globalAngular'] for fragment in [
        b'imaginary=dot(G,row,amplitude)', b'k,amplitude:row.weightedAmplitude',
        b'positive=row.curl.fullCoefficient.map',
    ])
    assert all(fragment in values['sourceBand'] for fragment in [
        b'ell=window.ell,Q=window.Q,S=G.pow(ell,2),epsilon=power(Q,h)',
        b'X=G.div(G.pow(R,2),G.mul(q(2),s)),eta=G.div(Z,power(s,D))',
        b'squareRootWeights:weights.map(x=>G.sqrt(x))',
    ])
    assert manifest['node_stream_sha256'] == forced['sourceStream']['sha256'] == STREAM
    sys.path[:0] = [str(paths[k].parent) for k in ('forcedCheck','cache','reader','exact')]
    import verify_forced_shell as previous
    import source_cache
    import verify_spatial_artifact
    from verify_repaired_first_force import Exact

    graph = source_cache.load(verify_spatial_artifact, source, manifest, 22153782, args.cache)
    try:
        actual = previous.bind(graph, Exact, registry, first['full']['rows'], wave)
        assert all(actual[k] == forced[k] for k in actual)
        native = verify_layers(graph, Exact, previous, first['full']['rows'], registry)
    finally:
        graph.__exit__(None,None,None)
    checks = demands(0)
    assert checks['aggregateLabelledComplexVelocityRoles'] == 330
    assert checks['directVelocityOrders'] == [[ZERO,R], [ZERO,Z,R], [ZERO,Z,R]]
    assert checks['forcingAndMatrixDirections'] == [tuple(row) for row in forced['jetPremise']['commonOrders']]
    request = demands(2)
    extra = request['highestNativeVariationalOrder']
    assert extra == 4 and native['nativeGlobalMaximumOrder'] >= extra + 2
    curves = {'u': extra+2, 'p': extra+1, 'tail': extra, 'mean': extra+1}
    for role, largest in curves.items():
        assert min(native['nativeDefinitionsByRole'][role]['minimumDerivativeLimits']) >= largest
    result = {
        'status': 'VERIFIED_LIVE_COVARIANCE_SOURCE_DEMAND_CONDITIONAL_OUTER_POLES',
        'inputPins': PINS,
        'sourceStream': graph.verify,
        'nativeSource': native,
        'covariancePressuredHaarRadialOrders': [0,1,2],
        'actualWeightedCases': 20,
        'actualCovarianceBodies': 60,
        'actualDirectHaarRoots': [21999624, 22000447],
        'actualAxialPressureArm': 22000444,
        'baseDemandCheck': {'velocityRoles': 330, 'variationalDirections': 12},
        'radialJetDemand': request,
        'initializedMeanJetDemand': expand_mean_demand(native, request['forcingAndMatrixDirections']),
        'maximumIndividualSourceInputOrders': curves,
        'mode2MaximumSummedPrimaryInputOrder': extra+1,
        'matrixPropagatorConditionalCoefficient': 'C F L_s * sum_(j=0)^4((15 B C L_s)^j/(j+1)!)',
        'poleAlgebra': bounds(cubic, native, covariance),
        'hypotheses': [
            'At each admitted frozen label the actual Primary scalar matches the factored outer target and normalized square root, with regular ordinary derivatives of the latter through order seven on the same live family.',
            'Uniform-in-collar original chart, primary frame, phase, cutoffs, mean velocity C5, projection coefficients and pulse matrix/propagator bounds to their requested orders. Constants may depend on fixed original labels. The actual all-label quantitative caps are still open.',
            'The original cover partition is fixed during differentiation and the original flat exterior semantics, Haar commutation, support/disjointness and ordinary pressure/Sigma FTC hold.',
            'The final Signed transfer of this covariance contribution also uses the same actually positive original inverse amplitude and other bounded Signed cofactors through radial order 3.',
        ],
        'open': [
            'New higher source jets are analytically requested but were not numerically evaluated or materialized by this audit.',
            'Both direct and pressure covariance pieces are included. Mean-only and background/viscous pressure pieces need independent bounds.',
            'Full Haar E, mixed seams, final jets, M3 N7-06 and N8-05 remain open.',
        ],
        'finalJets': 0, 'release': 'HOLD',
    }
    with args.out.open('x', encoding='utf8', newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'])
    print('velocity roles', request['aggregateLabelledComplexVelocityRoles'],
          'projected RHS roles', request['aggregateLabelledComplexProjectedRHSRoles'],
          'Haar E poles', result['poleAlgebra']['covarianceHaarERadialPoles0to2'])


if __name__ == '__main__':
    main()
