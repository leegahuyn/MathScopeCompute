"""Read the first-cycle source gauge from a complete authenticated post-Five DAG."""
from argparse import ArgumentParser
from collections import Counter, defaultdict
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
import json
import sys

ADJACENT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ADJACENT / 'first-force-repair'))
from verify_repaired_first_force import Graph, Exact, need, git_blob, harmonic_terms, q

ORIGINAL = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
PR30 = 'a9b3a5b317525f6d0a71e2e356b054c9d25d2e60'
OLD_RUN = '615cdb54c6a7645e0664396557fb83fc9b76b8b6d8e9005e220fb1834f4aeed7'
K, EPSILON, CI0, RADIAL_FAST, LOCAL_RADIAL_FAST = 622801, 622798, 635063, 635060, 625154
REPRESENTATIVE = [623950, 623955, 623935]
ORIGINAL_SIGNS = [1, -1]
ZERO, ONE, NEG, HALF = 0, 1, 20, 19
M3 = 'research-ide/mathscope-m3/'
TEMP_PSI = 'afterActualSigned162_actual_meridional_potential'
TEMP_INVERSE = ['ActualAfterSigned_theta_OriginalFastTime', 'ActualAfterSigned_z_OriginalFastTime']
FIVE = ['PostSignedFiveBump_' + key for key in ('beta', 'v', 'gamma')]
SIGNED_FIELDS = ['GenericSigned162_velocity_' + str(i) for i in range(3)] + ['GenericSigned162_angular_pressure']
FORCED_FIELDS = ['ActualForcedCurrent_velocity_' + str(i) for i in range(3)] + ['ActualForcedCurrent_angular_pressure']
INITIAL_FIELDS = ['OriginalAll81InitialAngular_velocity_' + str(i) for i in range(3)] + ['OriginalAll81InitialAngular_pressure']
INITIAL_MEANS = ['ActualInitializedMeanVelocity_' + str(i) for i in range(3)] + ['ActualInitializedMeanFullPressure']


def read(path):
    return json.loads(path.read_bytes())


def records(graph, ops, start=0, stop=None):
    """Stream selected node types, restoring the cursor after random reads."""
    graph.backing.seek(graph.offsets[start])
    prefixes = tuple(('{"op":"' + op + '",').encode() for op in ops)
    for index in range(start, stop if stop is not None else len(graph.offsets)):
        line = graph.backing.readline()
        if line.startswith(prefixes):
            position = graph.backing.tell()
            rec = json.loads(line)
            yield index, rec['op'], rec['args']
            graph.backing.seek(position)


def unique(sequence, detail):
    values = list(sequence)
    need(len(values) == 1, f'{detail}: found {len(values)}')
    return values[0]


class Native:
    def __init__(self, path, manifest):
        raw = path.read_bytes()
        need(sha256(raw).hexdigest() == manifest['definitions_sha256'], 'exact native registry SHA256')
        reg = json.loads(raw)
        self.raw = reg
        expr, field, inv, pulse, extra = json.loads(reg['definitions'])
        need([len(a) for a in (expr, field, inv, pulse, extra)] == reg['counts'] ==
             manifest['extended_coupled_function_counts'], 'exact coupled native registry sizes')
        self.expressions = {e['name']: e for e in expr}
        self.fields = {e['name']: e for e in field}
        self.inverses = {e['name']: e for e in inv}
        self.aux_fields = {e['name']: {**e, 'id': index} for index, e in
                           enumerate(json.loads(reg['base']['fieldDefinitions']))}
        self.coupled_by_id = {e['id']: e for e in expr}
        self.catalogue = {}

    def index(self, graph):
        wanted = {}
        for op, names, definitions in [
            ('m3_coupled_expression_partial', [TEMP_PSI, *FIVE], self.expressions),
            ('m3_coupled_indexed_partial', [*SIGNED_FIELDS, *FORCED_FIELDS], self.fields),
            ('m3_coupled_inverse_partial', TEMP_INVERSE, self.inverses),
            ('m3_aux_indexed_partial', INITIAL_FIELDS, self.aux_fields),
        ]:
            for name in names:
                rec = definitions[name]
                wanted[op, rec['id']] = (name, rec['parameters'])
        for index, op, (system, actual, orders) in records(graph, {op for op, _ in wanted}):
            match = wanted.get((op, system))
            if match is None or actual != match[1]:
                continue
            key = match[0], tuple(orders)
            need(key not in self.catalogue, f'nonunique exact native formal application {key}')
            self.catalogue[key] = index

    def app(self, name, order=None):
        if name in self.expressions:
            rec = self.expressions[name]
        elif name in self.inverses:
            rec = self.inverses[name]
        elif name in self.fields:
            rec = self.fields[name]
        else:
            rec = self.aux_fields[name]
        directions = rec.get('directions', rec['parameters'])
        orders = tuple(int(i == order) for i in directions)
        return self.catalogue[name, orders]


def select_chart(graph, definition, difference):
    root, level, guards, selected = definition['body'], definition['parameters'][-1], [], False
    while graph.node(root)[0] == 'smooth_piecewise':
        test, lo, hi, left, inside, right = graph.args(root, 'smooth_piecewise')
        if test == level:
            if q(graph, lo) < difference < q(graph, hi):
                need(not selected, 'one fixed-band chart')
                root, selected = inside, True
            else:
                need(left == right, 'same inactive fixed-band branches')
                root = left
        else:
            need(left == right == ZERO, 'exact original lazy guard')
            guards.append([test, lo, hi])
            root = inside
    need(selected and len(guards) == 7, 'five slow/shell and two rectangle guards')
    return root, guards


def linear_terms(graph, root, scale=1):
    op, args = graph.node(root)
    if op == 'add':
        out = Counter()
        for i in args:
            out.update(linear_terms(graph, i, scale))
        return out
    if op == 'multiply' and len(args) == 2 and NEG in args:
        return linear_terms(graph, next(i for i in args if i != NEG), -scale)
    return Counter({root: scale}) if root != ZERO else Counter()


def difference(graph, root, *terms):
    out = linear_terms(graph, root)
    for operand, sign in terms:
        out.update(linear_terms(graph, operand, -sign))
    return {i: value for i, value in out.items() if value}


def signed_curl(graph, alg, coefficients, potential, seen):
    """Read the complete first-order cylindrical remainder and phase cross."""
    leads = []
    for j, value in enumerate(coefficients[:3]):
        lead = defaultdict(dict)
        for monomial, factor in alg.of(value['real']).items():
            native = [(i, exponent) for i, exponent in monomial if i in potential]
            need(len(native) == 1 and native[0][1] == 1, 'linear exact Signed leading potential')
            p = native[0][0]
            need(p != potential[j], 'only the two expected curl coordinates')
            lead[p][tuple((i, exp) for i, exp in monomial if i != p)] = factor
        need(set(lead) == set(potential) - {potential[j]}, 'two leading cross product arms')
        leads.append(lead)
    for i, j, k in [(0, 1, 2), (1, 2, 0), (2, 0, 1)]:
        need(leads[i][potential[j]] == alg.neg(leads[j][potential[i]]),
             f'same exact physical phase normal component {k} in both cross product arms')
    def jet(component, direction):
        orders = tuple(int(i == direction) for i in range(12))
        return alg.of(unique(seen[component, orders], 'actual original native potential partial'))
    half = alg.scalar(Fraction(1, 2))
    epsilon = alg.of(EPSILON)
    radial_fast = alg.of(LOCAL_RADIAL_FAST)
    radial = graph.args(potential[1], 'm3_coupled_expression_partial')[1][0]
    Dr = lambda j: alg.add(jet(j, 0), alg.mul(radial_fast, jet(j, 3)))
    Dz = lambda j: alg.mul(epsilon, jet(j, 1))
    want = [alg.neg(Dz(1)), alg.sub(Dz(0), Dr(2)),
            alg.add(Dr(1), alg.mul(alg.inv(alg.of(radial)), alg.of(potential[1])))]
    for j, (z, target) in enumerate(zip(coefficients[:3], want, strict=True)):
        delta = alg.sub(alg.of(z['imaginary']), alg.mul(half, target))
        need(alg.of(z['imaginary']) == alg.mul(half, target),
             f'complete Signed imaginary cylindrical curl component {j}, root {z["imaginary"]}, delta {delta}')


def signed_modes(graph, native):
    algebra = Exact(graph)
    signed_potentials = {native.expressions[f'GenericSignedAfterForced_{s}_{j}']['id']: (s, j)
                         for s in range(2) for j in range(3)}
    out = []
    for sign_index, sign in enumerate(ORIGINAL_SIGNS):
        for difference in range(5):
            charts = [select_chart(graph, native.expressions[f'{name}_own_{sign_index}'], difference)
                      for name in SIGNED_FIELDS]
            guards = charts[0][1]
            need(all(g == guards for _, g in charts), 'same Signed velocity and pressure guards')
            xi, v = guards[-2][0], guards[-1][0]
            raw_theta = native.expressions[f'{SIGNED_FIELDS[0]}_own_{sign_index}']['parameters'][-2]
            terms = [list(harmonic_terms(graph, body)) for body, _ in charts]
            def positive_angle(angle):
                angular = [(m, s) for m, s in algebra.of(angle).items() if dict(m).get(raw_theta)]
                return len(angular) == 1 and angular[0][1] == 1
            angle = unique({a for row in terms for kind, a, _, _ in row if positive_angle(a)},
                           'same positive fundamental angle in Signed curl and pressure')
            phase = unique([i for i in graph.args(angle, 'multiply') if i != K],
                           'fixed positive native phase apart from k')
            need(K in graph.args(angle, 'multiply'), 'actual original carrier in Signed phase')
            original_chart, original_guards = select_chart(graph, native.expressions[
                f'ActualInitializedAngularOwnLabel_{sign_index}_0'], difference)
            need(original_guards == guards and
                 any(a == angle for _, a, _, _ in harmonic_terms(graph, original_chart)),
                 'same phase and all guards as the authenticated J0 chart')
            coefficients = []
            for row in terms:
                values = {}
                for kind, sign_wanted in (('cosine', 1), ('sine', -1)):
                    positive = [root for fn, a, root, scale in row
                                if fn == kind and a == angle and scale == sign_wanted]
                    negative = [(a, root, scale) for fn, a, root, scale in row if fn == kind and a != angle]
                    if not positive and not negative:
                        values[kind] = ZERO
                        continue
                    values[kind] = unique(positive, 'complete signed real and imaginary fundamental')
                    conjugate = unique(negative, 'original Signed negative conjugate')
                    need(algebra.of(conjugate[0]) == algebra.neg(algebra.of(angle)),
                         'opposite same-chart Signed angle')
                    need(algebra.mul(algebra.scalar(conjugate[2]), algebra.of(conjugate[1])) ==
                         algebra.mul(algebra.scalar(1), algebra.of(values[kind])),
                         'signed reconstruction conjugacy')
                coefficients.append({'real': values['cosine'], 'imaginary': values['sine']})
            seen = defaultdict(set)
            for z in coefficients[:3]:
                for root in graph.reach(z.values()):
                    op, args = graph.node(root)
                    if op != 'm3_coupled_expression_partial' or args[0] not in signed_potentials:
                        continue
                    ident, actual, orders = args
                    s, j = signed_potentials[ident]
                    rec = native.coupled_by_id[ident]
                    need(s == sign_index and actual[:3] == rec['parameters'][:3]
                         and actual[3:8] == [xi, v, *REPRESENTATIVE]
                         and actual[8:] == rec['parameters'][8:],
                         'same native potential fixed xi/v and representative')
                    seen[j, tuple(orders)].add(root)
            potential = [unique(seen[j, (0,) * 12], 'actual normalized Signed potential application') for j in range(3)]
            need(all(potential[j] in graph.reach(z['real'] for z in coefficients[:3]) for j in range(3)),
                 'all three potential coordinates occur in actual Signed leading curl')
            signed_curl(graph, algebra, coefficients, potential, seen)
            out.append({'key': f'{difference}:{sign}', 'phase': phase, 'waveNumber': K,
                        'fixedGuards': guards, 'positiveMode': 1,
                        'positiveNormalizedCylindricalPotential': [
                            {'real': ZERO, 'imaginary': {'coefficient': '1/2', 'root': x}} for x in potential],
                        'actualVelocityCoefficients': coefficients[:3],
                        'actualPressureCoefficients': coefficients[3],
                        'nativePotentialJetInventory': [
                            {'component': j, 'orders': orders, 'root': unique(roots, 'one exact native jet')}
                            for (j, orders), roots in sorted(seen.items())]})
        Exact.of.cache_clear()
    need(len(out) == 10, 'ten authentic own-chart signed gauge cases')
    return out


def cover(native):
    fields = [native.fields[name] for name in [*FORCED_FIELDS, *SIGNED_FIELDS]]
    source = fields[0]
    keys = ('values', 'guards', 'derivativeMaps', 'coefficient', 'label')
    def signature(rec):
        return [{key: r[key] for key in keys} for r in rec['rows']]
    expected = signature(source)
    need(len(expected) == 162 and len({r['label']['key'] for r in expected}) == 81,
         'complete 81 label, 162 sign cover')
    need(all(signature(f) == expected and f['parameters'] == source['parameters']
             and f['directions'] == source['directions'] for f in fields),
         'actual original and Signed velocity/pressure reference row mappings')
    return expected


def reference_scaling(graph, native):
    alg = Exact(graph)
    roots = []
    for name in [*SIGNED_FIELDS, *FORCED_FIELDS]:
        exponent = 2 if 'pressure' in name else 1
        for s in range(2):
            ref = native.expressions[f'{name}_reference_{s}']
            own = native.expressions[f'{name}_own_{s}']
            params = ref['parameters']
            need(params == own['parameters'], 'same complete own/reference formals')
            parts = graph.args(ref['body'], 'multiply')
            call = unique([i for i in parts if graph.node(i)[0] == 'm3_coupled_expression_partial'],
                          'reference native own-label function')
            scale = unique([i for i in parts if i != call], 'reference multiplier')
            system, actual, orders = graph.args(call, 'm3_coupled_expression_partial')
            need(system == own['id'] and not any(orders) and actual[3:] == params[3:],
                 'only normalized slow coordinates change in reference chart')
            rho = product_other(graph, actual[2], params[2])
            need(alg.of(graph.args(rho, 'exp')[0]) == alg.mul(alg.sub(alg.of(params[3]), alg.of(params[7])),
                                                              alg.of(127)), 'exact Q_ref/Q_label ratio')
            root_r = product_other(graph, actual[0], params[0])
            root_z = product_other(graph, actual[1], params[1])
            need(graph.args(root_r, 'sqrt_positive') == [rho], 'normalized radial sqrt ratio')
            scale_arg = graph.args(scale, 'exp')[0]
            log_rho = unique([i for i in graph.reach([scale_arg]) if graph.node(i) == ('log_positive', [rho])],
                             'exact chart logarithm')
            need(alg.of(graph.args(root_z, 'exp')[0]) == alg.mul(alg.of(log_rho), alg.of(22)),
                 'normalized axial rho^D')
            need(alg.of(scale_arg) == alg.mul(alg.scalar(exponent), alg.of(log_rho), alg.of(23)),
                 'same actual A or 2A exponent')
            roots.append({'name': name, 'sign': ORIGINAL_SIGNS[s], 'actualOwnArguments': actual,
                          'rho': rho, 'nativeVelocityOrPressureFactor': scale, 'powerOfA': exponent})
    need(len({r['rho'] for r in roots}) == 1, 'single exact own/reference chart ratio')
    return roots


def find_binary(graph, op, operands, detail, stop=None):
    wanted = Counter(operands)
    return unique((i for i, _, a in records(graph, (op,), max(operands), stop)
                   if len(a) == 2 and Counter(a) == wanted), detail)


def product_other(graph, root, factor):
    args = graph.args(root, 'multiply')
    need(len(args) == 2 and factor in args, 'required product factor')
    return next(i for i in args if i != factor)


def split_sub(graph, root):
    x, y = graph.args(root, 'add')
    for positive, negative in ((x, y), (y, x)):
        if graph.node(negative)[0] == 'multiply' and NEG in graph.node(negative)[1]:
            return positive, product_other(graph, negative, NEG)
    raise ValueError(f'expected exact difference at {root}')


def integral_compact(graph, root, R, invR):
    left, cutoff = split_sub(graph, product_other(graph, root, invR))
    chi, whole = graph.args(cutoff, 'multiply')
    if graph.node(chi)[0] == 'definite_integral':
        chi, whole = whole, chi
    body, binder, lo, hi = graph.args(whole, 'definite_integral')
    need(graph.args(left, 'definite_integral') == [body, binder, lo, R],
         'same integral body, binder and fixed inner endpoint')
    return {'root': root, 'left': left, 'whole': whole, 'chi': chi, 'integrand': body,
            'binder': binder, 'inner': lo, 'outer': hi}


def five_integrals(graph, native, radial, chi, invR, final):
    gamma = native.app(FIVE[2])
    definition = native.expressions[FIVE[2]]
    params = definition['parameters']
    id = definition['id']
    candidate = []
    for root, _, (body, binder, lo, hi) in records(graph, ('definite_integral',), gamma, final):
        if hi != radial or not graph.node(binder)[1][0].startswith('PostSignedFiveBumpRadialVar$'):
            continue
        jet = product_other(graph, body, binder)
        op, args = graph.node(jet)
        if op == 'm3_coupled_expression_partial' and args == [
                id, [binder if p == radial else p for p in params], [0]*len(params)]:
            candidate.append((root, body, binder, lo))
    left, body, binder, lo = unique(candidate, 'actual FiveMap radial integral before compact candidate')
    whole, outer = unique(((root, hi) for root, _, (u, v, a, hi) in records(
        graph, ('definite_integral',), left + 1, final) if [u, v, a] == [body, binder, lo] and hi != radial),
        'the separate unmodified FiveMap whole')
    used = find_binary(graph, 'multiply', [invR, left], 'actual FiveMap psi=I_left/R', final)
    chi_whole = find_binary(graph, 'multiply', [chi, whole], 'explicit FiveMap cutoff times whole', final)
    negative = find_binary(graph, 'multiply', [NEG, chi_whole], 'negative FiveMap cutoff term', final)
    difference = find_binary(graph, 'add', [left, negative], 'FiveMap compact numerator', final)
    compact = find_binary(graph, 'multiply', [invR, difference], 'FiveMap compact candidate psi', final)
    need(used != compact and whole not in graph.reach([used]) and whole in graph.reach([compact]),
         'retain realized and compact FiveMap potentials as distinct source nodes')
    return {'usedPsi': used, 'compactCandidatePsi': compact, 'partial': left, 'whole': whole,
            'integrand': body, 'binder': binder, 'inner': lo, 'outer': outer, 'chi': chi}


def mean_and_pressure(graph, native, run):
    alg = Exact(graph)
    radial, axial, time, ell, y0, y1 = native.expressions[INITIAL_MEANS[-1]]['parameters']
    theta = native.aux_fields[INITIAL_FIELDS[-1]]['parameters'][-1]
    full_velocity = run['post_five_full_three_dimensional_velocity_roots']
    full_pressure = run['post_five_full_three_dimensional_pressure_root']
    final = max(full_pressure, *full_velocity) + 1
    psi = native.app(TEMP_PSI)
    psi_body = native.expressions[TEMP_PSI]['body']
    invR = unique([i for i in graph.args(psi_body, 'multiply') if graph.node(i) == ('inverse', [radial])],
                  'actual original R inverse in temporal T1')
    compact = integral_compact(graph, psi_body, radial, invR)
    five = five_integrals(graph, native, radial, compact['chi'], invR, final)
    need([five['inner'], five['outer']] == [compact['inner'], compact['outer']],
         'same retained full source radial envelope')
    initial_means = [native.expressions[name]['body'] for name in INITIAL_MEANS]
    initial_waves = [native.app(name) for name in INITIAL_FIELDS]
    forced_waves = [native.app(name) for name in FORCED_FIELDS]
    signed_waves = [native.app(name) for name in SIGNED_FIELDS]
    j0 = [find_binary(graph, 'add', [m, w], f'J0 physical component {j}')
          for j, (m, w) in enumerate(zip(initial_means, initial_waves, strict=True))]
    five_velocity = [native.app(name) for name in FIVE]
    temporal = []
    for j in range(3):
        old, mean_change = graph.args(full_velocity[j], 'add')
        if signed_waves[j] not in graph.reach([old]):
            old, mean_change = mean_change, old
        want_old = difference(graph, old, (initial_means[j], 1), (forced_waves[j], 1), (signed_waves[j], 1))
        need(not want_old, f'old full physical velocity component {j} contains same initialized mean and waves: {want_old}')
        latest, baseline = split_sub(graph, mean_change)
        pre_five = unique([i for i in graph.args(latest, 'add') if i != five_velocity[j]],
                          'actual post-Temporal operand retained by FiveMap')
        need(five_velocity[j] in graph.args(latest, 'add'), 'actual FiveMap velocity increment')
        temp = unique([i for i in graph.args(pre_five, 'add') if i != baseline],
                      'actual Temporal velocity increment')
        need(baseline in graph.args(pre_five, 'add'), 'same initialized mean baseline')
        temporal.append(temp)
    theta_inverse = native.app(TEMP_INVERSE[0])
    axial_inverse = native.app(TEMP_INVERSE[1])
    need(alg.of(temporal[1]) == alg.neg(alg.mul(alg.of(theta_inverse), alg.inv(alg.of(CI0)))),
         'actual Temporal direct swirl -ci0^-1 inverse_theta')
    expected_beta = alg.neg(alg.mul(alg.of(EPSILON), alg.of(native.app(TEMP_PSI, axial))))
    need(alg.of(temporal[0]) == expected_beta, 'actual Temporal radial velocity is -epsilon*partial_Z psi')
    vr1 = alg.sub(alg.one, alg.of(3622))
    expected_gamma = alg.add(alg.of(native.app(TEMP_PSI, radial)), alg.mul(alg.of(invR), alg.of(psi)),
        alg.mul(alg.of(RADIAL_FAST), alg.add(alg.of(native.app(TEMP_PSI, y0)),
                                           alg.mul(vr1, alg.of(native.app(TEMP_PSI, y1))))))
    need(alg.of(temporal[2]) == expected_gamma, 'actual Temporal gamma is the full common-Y cylindrical curl')
    five_beta = native.expressions[FIVE[0]]['body']
    derivative_integral = unique([i for i in graph.reach([five_beta]) if graph.node(i)[0] == 'definite_integral'],
                                 'actual FiveMap beta differentiated primitive')
    body, binder, lo, hi = graph.args(derivative_integral, 'definite_integral')
    need([binder, lo, hi] == [five['binder'], five['inner'], radial],
         'FiveMap beta uses actual left, no compact whole correction')
    gamma_def = native.expressions[FIVE[2]]
    partial = product_other(graph, body, binder)
    need(graph.args(partial, 'm3_coupled_expression_partial') ==
         [gamma_def['id'], [binder if p == radial else p for p in gamma_def['parameters']],
          [int(p == axial) for p in gamma_def['parameters']]], 'correct differentiated FiveMap gamma integrand')
    need(alg.of(five_beta) == alg.neg(alg.mul(alg.of(EPSILON), alg.of(invR), alg.of(derivative_integral))),
         'actual FiveMap beta is exact curl of the unmodified primitive')
    prior, change = graph.args(full_pressure, 'add')
    if signed_waves[-1] not in graph.reach([prior]):
        prior, change = change, prior
    need(signed_waves[-1] in graph.reach([prior]), 'actual Signed old complete pressure')
    final_mean, signed_mean = split_sub(graph, change)
    [background, initial_mean] = graph.args(initial_means[-1], 'add')
    if background != 622935:
        background, initial_mean = initial_mean, background
    need(background == 622935, 'same original completed background pressure')
    need(not difference(graph, full_pressure, (background, 1), (final_mean, 1),
                        (forced_waves[-1], 1), (signed_waves[-1], 1)),
         'full pressure is exact refreshed mean plus old and Signed angular pressure')
    need(not difference(graph, j0[-1], (background, 1), (initial_mean, 1), (initial_waves[-1], 1)),
         'whole J0 initialized pressure tied to actual initialized mean and original angular field')
    forced_delta = [{'positive': f, 'negative': i} for f, i in
                    zip(forced_waves[:3], initial_waves[:3], strict=True)]
    return {
        'referenceCoordinates': {'R': radial, 'Z': axial, 'T': time, 'ell': ell, 'Y': [y0,y1], 'theta': theta},
        'authenticatedJ0VelocityRoots': j0[:3], 'authenticatedJ0PressureRoot': j0[-1],
        'actualPostFiveVelocityRoots': full_velocity, 'actualPostFivePressureRoot': full_pressure,
        'forcingWaveVelocityDifference': forced_delta, 'signedAngularVelocityRoots': signed_waves[:3],
        'temporal': {'actualPsi': psi, 'body': psi_body, 'T1': compact, 'directDeltaV': temporal[1],
                     'curlVelocity': [temporal[0], temporal[2]], 'exactInverses': [theta_inverse, axial_inverse]},
        'FiveMap': {**five, 'directDeltaV': five_velocity[1],
                    'curlVelocity': [five_velocity[0], five_velocity[2]], 'actualGammaDerivativeApplication': partial,
                    'actualDerivativeIntegral': derivative_integral},
        'completePressureDifference': {'positive': full_pressure, 'negative': j0[-1],
            'refreshedMeanPositive': final_mean, 'initialMeanNegative': initial_mean,
            'forcedAngularPositive': forced_waves[-1], 'initialAngularNegative': initial_waves[-1],
            'signedAngularPositive': signed_waves[-1], 'sameBackgroundCancels': background,
            'previousSignedMean': signed_mean},
    }


def source_pins(repo):
    paths = {
        'navier/source-initialized-angular.mjs': [
            'globalPressure=G.add(completeMeanPressure,initial.global.pressure.nonzeroAngular)',
            "name:'ActualInitializedMeanFullPressure'"],
        'navier/source-temporal-potential.mjs': [
            'rawPsi=G.div(G.sub(integrals.left,G.mul(chi,integrals.whole)),R)',
            'beta=G.neg(Dz(psi)),gamma=De(psi,1)',
            'deltaV=G.neg(G.div(inverseTheta,ci))'],
        'post-signed-20261023/source-signed-actual-five-map.mjs': [
            'psi=G.div(primitive,R),compactPsi=',
            'rawDeltaBeta=G.neg(G.mul(epsilon,G.derivative(psi,Z)))',
            'originalPositiveLambdaRetained'],
        'post-signed-20261023/source-postfive-full-3d-residual.mjs': [
            'G.sub(latestMean[n],baseline[n])', 'G.add(old.fullPressure,pressureDelta)'],
        'tangency-proof-20261023/generic-signed-source-kernel.fixed.mjs': [
            'rawPotential=cross(G,f.frame.n,weighted)',
            'potential=rawPotential.map((v,component)=>G.share',
            'homogeneousSignedAngularPressure:homogeneousPressure.value'],
        'staged-patches-20261023/PR30_Cumulative_Signed162_Cor85_TemporalFrontier.patch': [
            'G.mul(half,lift(row.curl.leading[j]))',
            'G.mul(half,lift(row.curl.remainder[j]))',
            't=>t.signedIncrementVelocity[j]'],
    }
    result = {}
    for path, fragments in paths.items():
        content = git_blob(repo, ORIGINAL, M3 + path)
        need(all(x.encode() in content for x in fragments), f'actual source pin {path}')
        result[M3 + path] = sha256(content).hexdigest()
    return result


def read_artifact(folder, corrected):
    path = unique(folder.rglob('original-source-export-manifest.json'), 'one full graph export manifest')
    manifest = read(path)
    run_name = 'corrected-first-cycle-run.json' if corrected else 'm3-original-signed-temporal-five-after-native-field-fix.json'
    run_path = unique(folder.rglob(run_name), 'one actual producer run receipt')
    run_bytes = run_path.read_bytes()
    run = json.loads(run_bytes)
    run_sha = sha256(run_bytes).hexdigest()
    need(manifest == run['first_fivemap_graph_replay_manifest']
         and manifest['executing_commit'] == run['executing_commit']
         and manifest['original_pr30_commit'] == run['expected_base_commit'] == PR30,
         'actual full graph bound to its independent hosted receipt')
    need(all(run[key] for key in ['real_original_current_constructed',
                                  'real_original_forced_seal_issued',
                                  'real_original_signed162_seal_issued',
                                  'post_signed_exact_inverse_AST_private_source_checked',
                                  'post_signed_five_map_mean_source_AST_checked',
                                  'post_five_full_three_dimensional_PDE_AST_checked']),
         'actual runtime seals through full post-Five physical AST')
    need(not manifest['final_all_cycle_A_b_p'] and manifest['actual_final_67_jets_certified'] == 0,
         'first-cycle scope')
    need(set([*run['post_five_full_three_dimensional_velocity_roots'],
              run['post_five_full_three_dimensional_pressure_root']]) <= set(manifest['original_root_ids']),
         'complete physical velocity and pressure are original exported roots')
    if corrected:
        need(manifest['scope'] == 'CORRECTED_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT'
             and run['schema'] == 'MathScope.M3.SourceBoundCorrectedFirstCyclePipeline/1'
             and run['corrected_first_cycle_source_byte_pins']['verifiedPinnedRepairFiles'] == 2
             and run['corrected_first_cycle_source_byte_pins']['verifiedUnchangedPR30Files'] == 27,
             'corrected source private original/repair pin inventory')
    else:
        need(run_sha == OLD_RUN and manifest['executing_commit'] == ORIGINAL
             and manifest['scope'] == 'ORIGINAL_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT_NOT_FINAL_A_b_p',
             'pinned historical original full calibration')
    return path.parent, run, manifest, run_sha


def main():
    parser = ArgumentParser(description=__doc__)
    for field in ('repo', 'artifact', 'out'):
        parser.add_argument('--' + field, type=Path, required=True)
    parser.add_argument('--corrected', action='store_true')
    args = parser.parse_args()
    folder, run, manifest, run_sha = read_artifact(args.artifact, args.corrected)
    registry = Native(folder / 'original-source-functions.json', manifest)
    pins = source_pins(args.repo)
    with TemporaryFile() as backing:
        graph = Graph(folder / 'original-source-nodes.jsonl.gz', backing, manifest)
        registry.index(graph)
        signed = signed_modes(graph, registry)
        means = mean_and_pressure(graph, registry, run)
        row_maps = cover(registry)
        scales = reference_scaling(graph, registry)
    output = {'schema': 'MathScope.N7.FirstOriginalCorrectionGaugeComponents/1',
              'historicalCalibration': not args.corrected, 'sourceCommit': manifest['executing_commit'],
              'hostedRunSHA256': run_sha, 'graphSHA256': manifest['node_stream_sha256'],
              'registrySHA256': manifest['definitions_sha256'], 'sourceSHA256': pins,
              'signedPositiveModes': signed, 'same162NativeRowMaps': row_maps,
              'exactNativeOwnReferenceScaling': scales,
              **means,
              'normalization': {
                  'rho': 'Q_ref / Q_label',
                  'ownChartArguments': '(sqrt(rho) R, rho^D Z, rho T), plus same frozen labels, Y and theta',
                  'signedAndForcedPotentialOwnToReference': 'rho^(A-1/2)',
                  'normalizedReferencePotentialToPhysical': 'Q_ref^(1/2-A)',
                  'referenceDirectSwirlToPhysical': 'Q_ref^(-A)',
                  'referencePressureDifferenceToPhysical': 'Q_ref^(-2A)',
                  'CartesianPotential': ['A_r*cos(theta)-A_theta*sin(theta)',
                                         'A_r*sin(theta)+A_theta*cos(theta)', 'A_z']},
              'scope': {'historicalNoSubstitutionForCorrected': not args.corrected,
                        'firstForcedPotentialMustBindSeparately': True,
                        'newGlobalCartesianGaugeNodesEmitted': False,
                        'FiveMapUsedPsiWholeZeroRequiresSeparateBinding': True,
                        'originalWeightedUncutNormsProved': False,
                        'firstScaleEvaluated': False, 'finalJets': 0, 'release': 'HOLD'}}
    raw = (json.dumps(output, indent=2) + '\n').encode()
    args.out.write_bytes(raw)
    print(json.dumps({'signedCases': len(signed), 'rowMaps': len(row_maps), 'J0Pressure': means['authenticatedJ0PressureRoot'],
                      'finalPressure': means['actualPostFivePressureRoot'], 'sha256': sha256(raw).hexdigest()}))


if __name__ == '__main__':
    main()
