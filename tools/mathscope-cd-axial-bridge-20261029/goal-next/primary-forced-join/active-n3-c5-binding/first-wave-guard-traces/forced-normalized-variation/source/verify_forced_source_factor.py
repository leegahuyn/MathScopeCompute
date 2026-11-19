"""Replay the common original pulse factor of each projected first Forced scalar."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
from math import comb, prod
from pathlib import Path
import json
import sys


PINS = {
    'frame': '56cc1d9685f00a5aba808675023453b3808fd916bd697f4ab9a242512ebee32d',
    'frameCheck': '38fdd2226e02fd4868f3c0eb48617bdf714fb80971a7001888daacf74d3d6fb9',
    'matrix': 'e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36',
    'forced': '705013059e1f064c3f9826c7c1846128064a26fa777bab6e335ed98a8c133fdd',
    'forcedCheck': '5ba5c2b69db25ec0a60471ed674436a183a2d03607ee31a81f8935ac2df1a943',
    'first': '6bf1e8c538e67bec6ea52e5960fd5cb23a556442d413d120025c49f30f117c27',
    'wave': '40eca0227cc0f9d541dc868fb4fc8cc1734eb63dbad54ea2631748c19c3d5c9b',
    'manifest': '8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry': 'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'cache': '909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
    'reader': '6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48',
    'exact': '260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
}
STREAM = 'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
PARTS = ('real', 'imaginary')


def pinned(path, key):
    data = path.read_bytes()
    if path.suffix == '.py':
        data = data.replace(b'\r\n', b'\n')
    assert sha256(data).hexdigest() == PINS[key], key
    return data


def sparse_expander(g, exact, classify):
    """Expand only branches containing one of the designated scalar atoms."""
    @cache
    def contains(root):
        op, children = g.node(root)
        if classify(root, op, children) is not None:
            return True
        if op in ('add', 'multiply'):
            return any(contains(i) for i in children)
        if op == 'integer_power':
            return contains(children[0])
        return False

    @cache
    def expand(root):
        op, children = g.node(root)
        if op == 'rational':
            return exact.scalar(Q(*map(int, children)))
        if classify(root, op, children) is not None or not contains(root):
            return {((root, 1),): Q(1)}
        if op == 'add':
            return exact.add(*(expand(i) for i in children))
        if op == 'multiply':
            return exact.mul(*(expand(i) for i in children))
        assert op == 'integer_power' and children[1] >= 0, (root, op)
        return exact.pow(expand(children[0]), children[1])

    return expand


def terms(poly):
    return [[str(coefficient), [list(atom) for atom in monomial]]
            for monomial, coefficient in sorted(poly.items())]


def affine_derivative(exact, poly, variable):
    derivative = []
    for monomial, coefficient in poly.items():
        powers = dict(monomial)
        current = powers.pop(variable, 0)
        assert current in (0, 1), (variable, monomial)
        if current:
            derivative.append({tuple(powers.items()): coefficient})
    return exact.add(*derivative)


def quotient_body(g, algebra, form, root, P, inherited):
    """Track direct P occurrences and approved differentiated potential occurrences."""
    lifted = {}

    def primary_leaf(i, op, a):
        if op == 'exp' and g.node(a[0])[0] == 'definite_integral' and form.val(i, False) == P:
            lifted[i] = {'kind': 'samePulseGaussian', 'root': i}
            return 'P'
        return inherited(lifted, i, op, a)

    expanded = sparse_expander(g, algebra, primary_leaf)(root)
    for monomial in expanded:
        assert sum(power for i, power in monomial if i in lifted) == 1, (root, monomial)
    return {'body': root, 'termsAfterFactoringOneP': terms(expanded),
            'factorAtoms': [lifted[i] for i in sorted(lifted)]}


def product_quotient_plan(alpha):
    """Return the exact Leibniz coefficients of D^alpha(P(v)A)/P(v)."""
    return [(beta, tuple(a-b for a, b in zip(alpha, beta, strict=True)),
             prod(comb(a, b) for a, b in zip(alpha, beta, strict=True)))
            for beta in product(*(range(a+1) for a in alpha))]


def zero_axis_derivative(e, poly, axis):
    assert not affine_derivative(e, poly, axis), axis


def verify_rate_terms(e, g, poly, atoms, gradients, mode, expected_velocity, sqrt_two):
    """Keep only normalized terms containing a Gaussian derivative."""
    rate_first, rate_second = g.graph.count + 1, g.graph.count + 2
    allocated = {}

    def normalized_atom(definition, args, orders):
        key = definition, tuple(args), tuple(orders)
        index = allocated.setdefault(key, g.graph.count + 3 + len(allocated))
        return {((index,1),):Q(1)}

    @cache
    def normalized_factor(i):
        atom = atoms.get(i)
        if atom is None:
            return e.of(i)
        if atom['factorDegree'] == 0:
            return {((i,1),):Q(1)}
        result = []
        for jet in atom['normalizedDerivativeTerms']:
            degree = jet['normalizedPulseDerivativeOrder']
            rate = {((rate_first if degree == 1 else rate_second,1),):Q(1)} if degree else e.one
            factor = e.mul(*(e.pow(gradients[axis], power) for axis,power in jet['affinePulseGradientPowers']))
            leaf = normalized_atom(atom['nativeDefinition'], atom['arguments'], jet['normalizedLeafOrders'])
            result.append(e.mul(e.scalar(jet['coefficient']), rate, factor, leaf))
        return e.add(*result)

    contributions = []
    for monomial, scalar in poly.items():
        if not any(i in atoms and any(jet['normalizedPulseDerivativeOrder']
                   for jet in atoms[i].get('normalizedDerivativeTerms', ())) for i,_ in monomial):
            continue
        expanded = e.mul(e.scalar(scalar), *(e.pow(normalized_factor(i), power) for i,power in monomial))
        contributions.append({m:c for m,c in expanded.items()
                              if any(i in (rate_first,rate_second) for i,_ in m)})
    actual = e.add(*contributions)
    if mode == 1:
        d = expected_velocity
        reference = e.mul({((rate_first,1),):Q(1)}, normalized_atom(d['id'], d['parameters'], [0]*len(d['parameters'])))
    else:
        reference = e.zero
    difference = e.sub(actual, reference)
    assert not e.reduce_sqrt_two(difference, sqrt_two) or not e.reduce_sqrt_two(
        e.clear_compound_denominators(difference), sqrt_two), (mode, expected_velocity['name'],len(difference))


def source_angular_body_is_two_variable_pullback(g, frame, basis, root):
    """Any surviving torus coordinate must be inside the certified xi or v."""
    @cache
    def visit(i):
        if i in basis or frame.free(g, i).isdisjoint({frame.Y0, frame.Y1}):
            return
        record = g.record(i)
        op, a = record['op'], record['args']
        assert op != 'coordinate', (i, basis, root)
        if op == 'definite_integral':
            children = [a[0], a[2], a[3]]
        elif op.endswith('_partial') and len(a) == 3 and isinstance(a[1], list):
            children = a[1]
        elif op in ('actual_covariance_volterra','m3_global_pulse_jet'):
            children = [a[2], *a[3]]
        elif op in ('integer_power','source_step_derivative'):
            children = a[:1]
        else:
            children = a
        assert all(isinstance(j,int) and j<i for j in children), (i, op, root)
        for j in children:
            visit(j)

    visit(root)


def verify(graph, Exact, frame, earlier, c88, matrix, c85, rows, wave, registry):
    assert graph.verify['sha256'] == STREAM == c88['sourceStream']['sha256']
    g = earlier.NodeView(graph)
    e = Exact(g)
    found = earlier.bind(graph, Exact, registry, rows, wave)
    assert all(c85[k] == value for k, value in found.items())
    definitions, _, _, systems, _ = json.loads(registry['definitions'])
    by_name = {d['name']: d for d in definitions}
    by_id = {d['id']: d for d in definitions}
    wrappers = {(d['name'], d['body'], tuple(d['parameters'])): d
                for d in definitions if d['name'].startswith('CoupledForced_source_')}
    base = json.loads(registry['base']['base']['expression'])
    potential_ids = {sign: [idx for idx, d in enumerate(base)
                            if d['name'].startswith(f'GlobalOriginalPotential_{sign}_')]
                     for sign in (1, -1)}
    assert all(len(ids) == 3 for ids in potential_ids.values())
    native_projection = frame.bind_native(graph, Exact, rows, systems, definitions)
    assert len(native_projection) == 20
    assert all(x == y for x, y in zip(native_projection, c88['firstForcedRows'], strict=True))
    original = frame.Forms(graph, Exact, {})
    no_inherited = lambda *_: None
    original_potential = {}
    for sign, ids in potential_ids.items():
        f = c88['verifiedOriginalFrames'][str(sign)]
        assert matrix['sameLiveMatrixBinding']['originalMatrixRows'][str(sign)]['P'] == f['P']
        state = original.val(f['P'], False)
        assert len(state) == 1
        _, binder, fixed_midpoint, endpoint = graph.args(f['PIntegral'], 'definite_integral')
        assert endpoint == frame.V
        assert original.eq(original.val(fixed_midpoint, False),
                           original.a.mul(original.a.scalar(Q(1,2)), original.val(frame.LS, False)))
        assert frame.V not in frame.free(graph, fixed_midpoint)
        phi = frame.Forms(graph, Exact, {frame.V: binder})
        assert phi.eq(phi.val(f['PBody'], False),
                      phi.a.sub(phi.val(f['lambda'], True), phi.val(f['dref'], True)))
        assert frame.free(graph, f['P']).isdisjoint({frame.R, frame.Z, frame.T, frame.Y0, frame.Y1})
        original_potential[sign] = {}
        for definition in ids:
            entry = base[definition]
            assert {frame.V, *frame.FORMALS} <= set(entry['parameters'])
            item = quotient_body(g, e, original, entry['body'], state, no_inherited)
            assert item['termsAfterFactoringOneP']
            assert all(x['root'] == f['P'] for x in item['factorAtoms'])
            original_potential[sign][definition] = item

    primary_receipts = {x['chart']: x for x in c88['actualPrimaryFactorOnEveryChart']}
    wave_cases = {(x['key'], x['mode']): x for x in wave['cases']}
    earlier_cases = {(x['key'], x['mode']): x for x in found['cases']}
    projection_cases = {(x['key'], x['mode']): x for x in native_projection}
    chart_records = {}
    chart_forms = {}
    pieces = Counter()
    normalized_counts = Counter()
    quotients = []
    for row in rows:
        key, mode = row['key'], row['harmonic']
        level, sign = map(int, key.split(':'))
        template = f'{level}_{sign}'
        case = wave_cases[key, mode]
        c85_case = earlier_cases[key, mode]
        system = systems[row['system']]
        w, v = system['variable'], case['pulse']
        assert c85_case['pulseEndpoint'] == v
        f = c88['verifiedOriginalFrames'][str(sign)]
        pullback = dict(zip((frame.Y0, frame.Y1), row['H_w'], strict=True))
        substitute_actual = dict(zip((*frame.FORMALS, frame.V), (*frame.ACTUALS, w), strict=True))
        h = {axis: e.of(root) for axis, root in pullback.items()}
        def check_equal(left, right):
            delta = e.sub(left, right)
            assert not Exact.reduce_sqrt_two(delta, earlier.SQRT2) or not Exact.reduce_sqrt_two(
                e.clear_compound_denominators(delta), earlier.SQRT2), key

        check_equal(e.affine_at(e.of(v), h), e.of(w))
        xi = case['guards'][-2][0]
        check_equal(e.affine_at(e.of(xi), h), e.of(xi))
        z = e.of(v)
        phase_gradient = {axis: affine_derivative(e, z, axis) for axis in (frame.Y0, frame.Y1)}
        radial_gradient = {axis: affine_derivative(e, e.of(xi), axis) for axis in (frame.Y0, frame.Y1)}
        assert all(phase_gradient.values())
        for gradient in (phase_gradient, radial_gradient):
            assert all(all(atom not in (frame.Y0, frame.Y1) for atom, _ in monomial)
                       for value in gradient.values() for monomial in value)
        vr1 = e.of(earlier.VR1)
        ci = e.mul(e.scalar(2), e.of(earlier.R0), e.inv(e.of(frame.LS)))
        tg = e.add(e.scalar(4), e.of(earlier.SQRT2))
        lambda_cover = e.of(case['curlDifferentialFactors']['Lambda'])
        check_equal(e.add(phase_gradient[frame.Y0], e.mul(vr1, phase_gradient[frame.Y1])), e.zero)
        check_equal(e.add(radial_gradient[frame.Y0], e.mul(vr1, radial_gradient[frame.Y1])), e.pow(lambda_cover, level))
        check_equal(e.add(e.neg(e.mul(vr1, radial_gradient[frame.Y0])), radial_gradient[frame.Y1]), e.zero)
        fast_time = e.mul(ci, e.pow(tg, -level))
        check_equal(e.mul(fast_time, e.add(e.neg(e.mul(vr1, phase_gradient[frame.Y0])),
                                          phase_gradient[frame.Y1])), e.one)
        for axis in (frame.R, frame.Z, frame.T):
            zero_axis_derivative(e, z, axis)
            for value in h.values():
                zero_axis_derivative(e, value, axis)
        assert frame.free(graph, v).isdisjoint({frame.R, frame.Z, frame.T})
        assert frame.free(graph, xi).isdisjoint({frame.R, frame.Z, frame.T})
        assert all(frame.free(graph, root).isdisjoint({frame.R, frame.Z, frame.T})
                   for root in pullback.values())
        for axis, value in h.items():
            expected = e.one if axis == frame.Y0 else e.of(earlier.VR1)
            check_equal(e.add(affine_derivative(e, value, frame.Y0),
                              e.mul(e.of(earlier.VR1), affine_derivative(e, value, frame.Y1))), expected)

        if key not in chart_records:
            local_map = dict(zip((*frame.FORMALS, frame.V), (*frame.ACTUALS, v), strict=True))
            local = frame.Forms(graph, Exact, local_map)
            same_factor = local.val(f['P'], True)
            # The two references share a Gaussian: the sign of the
            # reference slope disappears in both squared rate functions.
            other_reference = local.val(c88['verifiedOriginalFrames'][str(-sign)]['P'], True)
            assert local.eq(same_factor, other_reference), key
            assert len(same_factor) == 1

            def potential_leaf(root, op, a):
                if op != 'actual_expression_partial' or a[0] not in potential_ids[sign]:
                    return None
                entry = base[a[0]]
                at = dict(zip(entry['parameters'], a[1], strict=True))
                assert all(local.eq(local.val(at[j], False), local.val(k, False))
                           for j, k in local_map.items())
                # The existing curl differentiates the original slow and
                # transverse formal slots before making this physical call.
                for formal, order in zip(entry['parameters'], a[2], strict=True):
                    assert order == 0 or formal not in {frame.V, *frame.FORMALS}
                    assert order == 0 or formal not in frame.free(graph, f['P'])
                return {'kind': 'formalDerivativeOfNormalizedPotential',
                        'root': root, 'definition': a[0], 'arguments': a[1], 'orders': a[2]}

            def inherited(lifted, root, op, a):
                descriptor = potential_leaf(root, op, a)
                if descriptor:
                    lifted[root] = descriptor
                    return 'P'
                return None

            # Evaluate the pulled Gaussian leaf independently of the
            # spectral quotient, including alpha-renaming the FTC binder.
            # The affine identity v(H_w(Y))=w substitutes the entire verified
            # chart endpoint in the actual native exponential integral.
            combined_map = {**substitute_actual, **pullback, v: w}
            joined = frame.Forms(graph, Exact, combined_map)
            assert not joined.eq(joined.val(f['P'], False), joined.val(f['P'], True)), key

            old = primary_receipts[key]
            assert old['sourcePulse'] == v
            primary = {}
            for name, body in old['checkedBodies'].items():
                definition = by_name[name]
                assert definition['body'] == body
                source_angular_body_is_two_variable_pullback(graph, frame, {v,xi}, body)
                quotient = quotient_body(g, e, local, body, same_factor, inherited)
                for atom in quotient['factorAtoms']:
                    if atom['kind'] == 'samePulseGaussian':
                        # Native body uses a substituted endpoint; compare
                        # after simultaneously replacing the actual Y pair.
                        assert joined.eq(joined.val(atom['root'], True), joined.val(f['P'], True))
                primary[definition['id']] = {
                    'definition': definition['id'], 'name': name,
                    'formalParameters': definition['parameters'], **quotient,
                }
            assert len(primary) == 10
            chart_records[key] = {'chart': key, 'sign': sign, 'originalGaussian': f['P'],
                                  'originalGaussianRates': [f['lambda'], f['dref']],
                                  'unpulledPulseEndpoint': v, 'xi': xi, 'Y0Y1': [frame.Y0, frame.Y1],
                                  'Y0Y1DotV': {str(axis): terms(value) for axis, value in phase_gradient.items()},
                                  'Y0Y1DotXi': {str(axis): terms(value) for axis, value in radial_gradient.items()},
                                  'bothSignsShareGaussianValue': True,
                                  'normalizedFastTimeN_v': 1, 'N_xi': 0, 'L_xi': {'base':case['curlDifferentialFactors']['Lambda'],'power':level},
                                  'L_v': 0, 'slowAndTransversePartialFactorLeaves': primary}
            chart_forms[key] = primary
        assert system['length'] == frame.LS and system['directions'] == [
            frame.R, frame.Z, frame.T, frame.Y0, frame.Y1]
        projected = projection_cases[key, mode]
        primary = chart_forms[key]
        atoms = {}

        def raw_source_atom(root, op, a):
            if op != 'm3_coupled_expression_partial':
                return None
            definition = by_id[a[0]]
            role = earlier.scalar_roles(definition['name'], template)
            params = definition['parameters']
            assert len(params) == len(a[1]) == len(a[2])
            if role == 'mean':
                atoms[root] = {'role': role, 'root': root, 'nativeDefinition': a[0],
                               'fieldsAndFullNonlocalPressureDependenciesKept': True,
                               'arguments': a[1], 'orders': a[2], 'factorDegree': 0}
                return role
            assert a[0] in primary and a[1] == params
            assert all(order == 0 or coord in (frame.R, frame.Z, frame.T, frame.Y0, frame.Y1)
                       for coord, order in zip(params, a[2], strict=True))
            jet = []
            for beta, rest, coefficient in product_quotient_plan(a[2]):
                if any(power and axis not in phase_gradient for axis, power in zip(params, beta, strict=True)):
                    continue
                pulse_order = sum(beta)
                assert pulse_order <= 2
                jet.append({'coefficient': coefficient, 'normalizedLeafOrders': rest,
                            'affinePulseGradientPowers': [[axis, power] for axis, power in zip(params, beta, strict=True) if power],
                            'normalizedPulseDerivativeOrder': pulse_order})
            assert sum(a[2]) <= (2 if role == 'u' else 1 if role == 'p' else 0)
            atoms[root] = {'role': role, 'root': root, 'nativeDefinition': a[0],
                           'arguments': a[1], 'orders': a[2], 'factorDegree': 1,
                           'applicationPointAfterPullback': [pullback.get(axis, axis) for axis in a[1]],
                           'normalizedDerivativeTerms': jet}
            return role

        expand_raw = sparse_expander(g, e, raw_source_atom)
        components = []
        mapped_wrappers = {}
        for j in range(3):
            for part in PARTS:
                raw, supported = (row[name][j][part] for name in ('raw', 'supported'))
                principal = row['principal'][j][part] if mode == 1 else 0
                raw_poly, supported_poly = expand_raw(raw), expand_raw(supported)
                principal_poly = expand_raw(principal)
                assert e.sub(raw_poly, principal_poly) == supported_poly
                for monomial in supported_poly:
                    powers = [atoms[i]['role'] for i, k in monomial if i in atoms for _ in range(k)]
                    assert sum(k*atoms[i]['factorDegree'] for i, k in monomial if i in atoms) == mode
                    pieces[mode, '+'.join(sorted(powers))] += 1
                expected_velocity = by_name[f'InitializedOriginalWave_{template}_{j}_{part}']
                verify_rate_terms(e, g, supported_poly, atoms, phase_gradient, mode,
                                  expected_velocity, earlier.SQRT2)
                definition = by_name[f'ActualWholeNonzeroSource_{key}_{mode}_{j}_{part}']
                mapped = row['originalSource'][j][part]
                actual = [pullback.get(axis, axis) for axis in definition['parameters']]
                assert graph.args(mapped, 'm3_coupled_expression_partial') == [
                    definition['id'], actual, [0]*len(actual)]
                wrapper = wrappers[f'CoupledForced_source_{j}_{part}', mapped, tuple([w,*system['parameters']])]
                mapped_wrappers[wrapper['id']] = (j, part, wrapper['parameters'])
                components.append({'coordinate': j, 'part': part, 'raw': raw,
                                   'principalSubtraction': principal, 'supported': supported,
                                   'pulledSource': mapped, 'pulledDefinition': definition['id'],
                                   'pulledArguments': actual, 'wrapperDefinition': wrapper['id'],
                                   'gaussianRatePartBeforeProjection': {'normalizedPrimaryVelocity':expected_velocity['id'],
                                                                       'coefficient':'r'} if mode == 1 else None,
                                   'termsAfterFactoringPToMode': terms(supported_poly)})

        projected_atoms = {}

        def wrapped_leaf(root, op, a):
            if op == 'm3_coupled_expression_partial' and a[0] in mapped_wrappers:
                j, part, formals = mapped_wrappers[a[0]]
                assert a[1:] == [formals, [0]*len(formals)]
                projected_atoms[root] = j, part
                return 'pulledForcing'
            return None

        expand_projection = sparse_expander(g, e, wrapped_leaf)
        for item in components:
            j, part = item['coordinate'], item['part']
            root = row['projected'][j][part]
            polynomial = expand_projection(root)
            represented = set()
            for monomial in polynomial:
                active = [(i, k) for i, k in monomial if i in projected_atoms]
                assert len(active) == 1 and active[0][1] == 1
                source_j, source_part = projected_atoms[active[0][0]]
                assert source_part == part
                represented.add(source_j)
            assert represented == set(range(3))
            item['projectionRoot'] = root
            item['projectedTermsWithPulledNormalizedWrappers'] = terms(polynomial)
            normalized_counts[mode] += 1
        assert len(projected_atoms) == 6
        quotients.append({'chart': key, 'mode': mode, 'system': row['system'],
                          'nativePulseVariable': w, 'YSubstitution': pullback,
                          'nativeNormal': projected['nativeNormal'],
                          'nativeNormalSquared': projected['nativeNormalSquared'],
                          'fixedFrameLeftInverseAtOriginalCoordinates': f['BL'],
                          'fixedFrameRepresentativeSubstitution': substitute_actual,
                          'gaussianAfterPullback': {'root': f['P'], 'simultaneousSubstitution': substitute_actual},
                          'scalarGaussianPowerBeforeDivision': mode,
                          'powerRemainingAfterDivisionByP': mode-1,
                          'rawJetAtoms': [atoms[i] for i in sorted(atoms)],
                          'projectionWrapperAtoms': {str(i): projected_atoms[i] for i in sorted(projected_atoms)},
                          'scalars': components})
    assert normalized_counts == {1:60, 2:60}
    assert set(pieces) == {(1,'u'),(1,'p'),(1,'tail'),(1,'mean+u'),(2,'u+u')}
    assert sum(len(x['slowAndTransversePartialFactorLeaves']) for x in chart_records.values()) == 100
    return {'status': 'VERIFIED_SAME_PULSE_GAUSSIAN_FACTOR_ALL_FIRST_FORCED_SCALARS',
            'originalPotentialQuotients': original_potential,
            'normalizedPrimaryByChart': chart_records, 'cases': quotients,
            'exactChartInverseAtoms': {str(i): terms(dict(denominator)) for denominator, i in
                                       sorted(e.inverse_atoms.items(),key=lambda row:row[1],reverse=True)},
            'projectedCheckedByMode': normalized_counts,
            'signedRawMonomialCountsByClass': {f'{mode}:{role}': n for (mode,role), n in sorted(pieces.items())},
            'pulseDerivativeQuotients': {'0':'1', '1':'r=lambda-d_ref', '2':'r^2+partial_v(r)'},
            'rateTermsAfterExactRawCancellation': {
                'mode1':'r times the matching normalized velocity scalar; all r^2, r_prime and mixed rate terms cancel.',
                'mode2':'All explicit Gaussian rate terms cancel.'
            },
            'quotientInterpretation': {
                'primaryBodies':'Each marked factor atom denotes its normalized value after removing one same-sign P; an inherited potential call uses the corresponding normalized potential body and the same formal partial.',
                'rawNativeJet':'Leibniz terms express each differentiated Primary scalar divided by P before pullback. Evaluate those terms at H_w, including all normalized jet, gradient and pulse rate factors.',
                'pulledWrappers':'Each wrapper in a projected polynomial is replaced by the corresponding normalized raw polynomial evaluated at H_w. All remaining factors are original projection coefficients.',
                'normalizedODE':'Multiply native projected quotient by B_left at w. Mode 1 gives B_left times normalized projection. Mode 2 leaves one P(w) times that expression.',
                'nonlocalOperators':'Initialized mean is kept whole as a degree-zero input. Shifted radial pressure/integral terms in its definition are neither dropped nor commuted through the Gaussian.',
            }}


def main():
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled')
    cli = ArgumentParser(description=__doc__)
    for name in ('goal', 'artifact', 'cache', 'matrix', 'out'):
        cli.add_argument('--'+name, type=Path, required=True)
    a = cli.parse_args()
    active = a.goal / 'primary-forced-join/active-n3-c5-binding'
    shell = active / 'first-wave-guard-traces'
    directory = shell / 'outer-normalized-amplitude/pulse-frame'
    source = a.artifact / 'first-correction-spatial-source'
    paths = {
        'frame': directory / 'pulse-frame-caps-final.json',
        'frameCheck': directory / 'verify_all_label_pulse.py',
        'matrix': a.matrix,
        'forced': shell / 'angular-order-one-shell/forced/forced-shell-final.json',
        'forcedCheck': shell / 'angular-order-one-shell/forced/verify_forced_shell.py',
        'first': a.artifact / 'same-family-mode-two.json',
        'wave': active / 'live-wave-gauge/forced/forced-wave.json',
        'manifest': source / 'original-source-export-manifest.json',
        'registry': source / 'original-source-functions.json',
        'cache': active / 'live-wave-gauge/signed/source_cache.py',
        'reader': active / 'spatial-readback/verify_spatial_artifact.py',
        'exact': a.goal / 'first-force-repair/verify_repaired_first_force.py',
    }
    data = {k: pinned(path, k) for k, path in paths.items()}
    sys.path[:0] = [str(paths[k].parent) for k in ('cache', 'reader', 'exact', 'frameCheck', 'forcedCheck')]
    import source_cache
    import verify_spatial_artifact
    import verify_all_label_pulse as frame
    import verify_forced_shell as previous
    from verify_repaired_first_force import Exact

    keys = ('frame', 'matrix', 'forced', 'first', 'wave', 'manifest', 'registry')
    frame_receipt, matrix, forced, first, wave, manifest, registry = (json.loads(data[k]) for k in keys)
    graph = source_cache.load(verify_spatial_artifact, source, manifest, 22153782, a.cache)
    try:
        result = verify(graph, Exact, frame, previous, frame_receipt, matrix, forced,
                        first['full']['rows'], wave, registry)
    finally:
        graph.__exit__(None, None, None)
    result.update({'inputPins': PINS, 'sourceStream': graph.verify, 'finalJets': 0, 'release': 'HOLD'})
    with a.out.open('x', encoding='utf8', newline='\n') as output:
        json.dump(result, output, indent=2)
        output.write('\n')
    print(result['status'])


if __name__ == '__main__':
    main()
