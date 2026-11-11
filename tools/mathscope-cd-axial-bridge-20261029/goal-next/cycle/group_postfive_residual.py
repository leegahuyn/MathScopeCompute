"""Extract finite labelwise harmonic recipes from the first real post-Five replay."""

import argparse
from collections import Counter
from fractions import Fraction
from functools import cache
import gzip
from hashlib import sha256
import json
from pathlib import Path


REACHED_SHA = '5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459'
REGISTRY_SHA = 'bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
GRAPH_SHA = 'a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
ROOTS = (4420035, 4420037, 4420039)
VELOCITY = (4419697, 4419698, 4419699)
PRESSURE = 4419702
DIRECTIONS = (622802, 622803, 622804, 635044, 635045, 622806)
ANGLE = DIRECTIONS[-1]
K = 622801
FROZEN = frozenset((622791, 623855, 623856, 623857))
FIELDS = (9, 10, 11, 12, 16, 17, 18, 19)
EXPECTED_RATES = {1: 625982, -1: 629400}
LOCAL_DIRECTION_INDICES = (0, 1, 2, 8, 9, 14)
PALETTE_DIFFERENCE = 3675258
RATIO = 3675262
RESIDUAL_SCALE = 3822575


def pinned_json(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return json.loads(raw)


def authenticate_projection(path, reached, extra):
    """Read every original node, retaining only the needed boundary roots."""
    digest = sha256()
    found = {}
    matched = 0
    with gzip.open(path, 'rb') as stream:
        header = next(stream)
        digest.update(header)
        assert json.loads(header) == {'schema': 'MathScope.M3.FullNodesJSONL/1', 'node_count': 4420257}
        for i, line in enumerate(stream):
            digest.update(line)
            if i in reached:
                assert reached[i] == json.loads(line), i
                matched += 1
            if i in extra:
                found[i] = json.loads(line)
    assert i + 1 == 4420257 and matched == len(reached) and set(found) == extra
    assert digest.hexdigest() == GRAPH_SHA
    return found


def children(op, args):
    if op in ('rational', 'coordinate', 'source_parameter'):
        return ()
    if op in ('add', 'multiply', 'maximum', 'smooth_piecewise'):
        return args
    if op in ('inverse', 'log_positive', 'exp', 'integer_power', 'sqrt_positive',
              'source_step_derivative', 'sine', 'cosine', 'ceiling'):
        return args[:1]
    if op == 'actual_natural_series':
        return args[1:3]
    if op in ('actual_background_even_profile', 'actual_background_picard'):
        return args[2:4]
    if op == 'actual_quadratic_root':
        return args[2:3]
    if op == 'actual_monotone_root':
        return args[1:]
    if op in ('actual_covariance_volterra', 'm3_global_pulse_jet'):
        return (args[2], *args[3])
    if op == 'm3_forced_pulse_partial':
        return (args[3], *args[4])
    if op.endswith('_partial') and len(args) == 3:
        return args[1]
    raise ValueError(f'Unsupported source operation {op}')


class Recipes:
    """A shared exact complex coefficient DAG with zero and one at IDs 0 and 1."""

    def __init__(self):
        self.index = {}
        self.nodes = []
        self.zero = self.intern('rational', 0, 1)
        self.one = self.intern('rational', 1, 1)

    def intern(self, op, *args):
        key = (op, *args)
        if key not in self.index:
            self.index[key] = len(self.nodes)
            self.nodes.append(key)
        return self.index[key]

    def source(self, root, literal=None):
        if literal is not None:
            return self.intern('rational', literal.numerator, literal.denominator)
        return self.intern('source', root)

    def add(self, *args):
        terms = (self.nodes[x][1:] if self.nodes[x][0] == 'add' else (x,) for x in args if x != self.zero)
        args = tuple(sorted(j for term in terms for j in term))
        if not args:
            return self.zero
        return args[0] if len(args) == 1 else self.intern('add', *args)

    def mul(self, *args):
        if self.zero in args:
            return self.zero
        factors = (self.nodes[x][1:] if self.nodes[x][0] == 'multiply' else (x,) for x in args if x != self.one)
        args = tuple(sorted(j for factor in factors for j in factor))
        if not args:
            return self.one
        return args[0] if len(args) == 1 else self.intern('multiply', *args)

    def choose(self, test, left, right, *branches):
        if all(x == self.zero for x in branches):
            return self.zero
        return self.intern('sourcePiecewise', test, left, right, *branches)

    @cache
    def conjugate(self, i):
        op, *args = self.nodes[i]
        if op in ('source', 'rational'):
            return i
        if op == 'phasor':
            phase, mode = args
            return self.intern(op, phase, -mode)
        if op == 'imaginary':
            n, d = args
            return self.intern(op, -n, d)
        if op == 'add':
            return self.add(*(self.conjugate(j) for j in args))
        if op == 'multiply':
            return self.mul(*(self.conjugate(j) for j in args))
        if op == 'sourcePiecewise':
            return self.choose(*args[:3], *(self.conjugate(j) for j in args[3:]))
        if op == 'substitute':
            call, j = args
            return self.intern(op, call, self.conjugate(j))
        if op == 'indexedCoefficient':
            call, mode = args
            return self.intern(op, call, -mode)
        if op == 'ownPhaseInverse':
            return self.intern(op, -args[0])
        if op == 'inverseResidualChart':
            return self.intern(op, self.conjugate(args[0]))
        raise ValueError(op)


def combine(left, right, add, multiply, result_key):
    result = {}
    for a, x in left.items():
        for b, y in right.items():
            key = result_key(a, b)
            result[key] = add(result.get(key, 0), multiply(x, y))
    return result


def merge(parts, add):
    result = {}
    for part in parts:
        for k, v in part.items():
            result[k] = add(result.get(k, 0), v)
    return {k: v for k, v in result.items() if v != 0}


class Source:
    def __init__(self, reached, registry):
        self.nodes = dict(reached['nodes'])
        definitions = json.loads(registry['definitions'])
        self.expressions = {x['id']: x for x in definitions[0]}
        self.fields = definitions[1]
        self.forced = definitions[3]
        self.recipe = Recipes()
        self.phases = {}
        self.reference_calls = {}
        self.atoms = {}
        assert len(self.nodes) == 159655
        assert len(reached['roots']) == 11
        assert reached['roots'][:4] == [*VELOCITY, PRESSURE] and reached['roots'][5:8] == list(ROOTS)
        assert self.literal(0) == 0 and self.literal(1) == 1

    def node(self, i):
        n = self.nodes[i]
        return n['op'], n['args']

    def literal(self, i):
        op, args = self.node(i)
        if op == 'rational':
            return Fraction(int(args[0]), int(args[1]))
        return None

    @cache
    def free(self, i):
        op, a = self.node(i)
        if op == 'coordinate':
            return frozenset((i,))
        if op == 'definite_integral':
            return (self.free(a[0]) - {a[1]}) | self.free(a[2]) | self.free(a[3])
        return frozenset().union(*(self.free(j) for j in children(op, a)))

    def flatten(self, root, operator):
        op, args = self.node(root)
        if op != operator:
            return [root]
        return [i for j in args for i in self.flatten(j, operator)]

    def rate(self, rate):
        # omega chooses the rounded integer, except at zero where it chooses -1 or 1.
        assert self.free(rate) == FROZEN
        op, a = self.node(rate)
        assert op == 'smooth_piecewise'
        rounded, lo, hi, neg, fallback, pos = a
        assert rounded == neg == pos and self.literal(lo) == -Fraction(1, 2)
        assert self.literal(hi) == Fraction(1, 2)
        op, a = self.node(rounded)
        assert op == 'multiply' and self.literal(a[0]) == -1
        op, a = self.node(a[1])
        assert op == 'ceiling'
        op, a = self.node(a[0])
        assert op == 'multiply' and self.literal(a[0]) == -1
        op, a = self.node(a[1])
        assert op == 'add' and self.literal(a[0]) == Fraction(1, 2)
        op, b = self.node(fallback)
        assert op == 'smooth_piecewise' and b[0] == a[1]
        assert [self.literal(i) for i in b[1:]] == [0, 0, -1, 1, 1]
        assert ANGLE not in self.free(rate)

    def phase(self, angle, rate):
        factors = self.flatten(angle, 'multiply')
        phases = [i for i in factors if ANGLE in self.free(i)]
        assert len(phases) == 1 and factors.count(K) == 1
        phase = phases[0]
        mode = Fraction(1)
        for i in factors:
            if i not in (phase, K):
                mode *= self.literal(i)
        assert mode in (-2, -1, 1, 2)
        summands = self.flatten(phase, 'add')
        angular = [i for i in summands if ANGLE in self.free(i)]
        assert len(angular) == 1
        slope = self.flatten(angular[0], 'multiply')
        assert len(slope) == 3 and ANGLE in slope and rate in slope
        inv, = set(slope) - {ANGLE, rate}
        assert self.node(inv) == ('inverse', [K])
        offset = tuple(i for i in summands if i != angular[0])
        assert offset and all(ANGLE not in self.free(i) for i in offset)
        phase_info = {'offsetSummands': offset, 'windingRate': rate,
                      'thetaTerm': angular[0], 'waveNumber': K}
        assert self.phases.setdefault(phase, phase_info) == phase_info
        return phase, int(mode)

    @cache
    def angular(self, i, rate):
        if ANGLE not in self.free(i):
            return {0: self.recipe.source(i, self.literal(i))}
        op, a = self.node(i)
        if op == 'add':
            return merge((self.angular(j, rate) for j in a), self.recipe.add)
        if op == 'multiply':
            result = {0: 1}
            for j in a:
                result = combine(result, self.angular(j, rate), self.recipe.add, self.recipe.mul, int.__add__)
            return {m: j for m, j in result.items() if j}
        if op == 'smooth_piecewise':
            assert all(ANGLE not in self.free(j) for j in a[:3])
            assert len(a) == 6
            branches = [self.angular(j, rate) for j in a[3:]]
            modes = sorted(set().union(*(set(x) for x in branches)))
            return {m: value for m in modes
                    if (value := self.recipe.choose(*a[:3], *(b.get(m, 0) for b in branches)))}
        if op in ('cosine', 'sine'):
            phase, m = self.phase(a[0], rate)
            if op == 'cosine':
                coefficients = {m: self.recipe.intern('rational', 1, 2),
                                -m: self.recipe.intern('rational', 1, 2)}
            else:
                coefficients = {m: self.recipe.intern('imaginary', -1, 2),
                                -m: self.recipe.intern('imaginary', 1, 2)}
            return {k: self.recipe.mul(v, self.recipe.intern('phasor', phase, k))
                    for k, v in coefficients.items()}
        if op == 'm3_coupled_expression_partial':
            system, values, orders = a
            definition = self.expressions[system]
            params = definition['parameters']
            assert len(params) == len(values) == len(orders) and not any(orders)
            assert set(self.free(definition['body'])) <= set(params)
            assert set(FROZEN) <= set(params) and ANGLE in params
            for p, v in zip(params, values):
                if p in (FROZEN | {ANGLE}):
                    assert p == v
                else:
                    assert ANGLE not in self.free(v)
            self.reference_calls[i] = {'ownSystem': system, 'values': values, 'parameters': params}
            return {m: self.recipe.intern('substitute', i, v)
                    for m, v in self.angular(definition['body'], rate).items()}
        raise ValueError(f'Angular source {i} uses unsupported {op}')

    def row_programs(self):
        assert self.free(K) == frozenset((622791,))
        assert self.node(K)[0] == 'ceiling'
        assert all(self.node(i)[0] == 'coordinate' for i in DIRECTIONS)
        for rate in EXPECTED_RATES.values():
            self.rate(rate)
        rows = self.fields[FIELDS[0]]['rows']
        assert len(rows) == 162
        boxes = {r['label']['key'] for r in rows}
        assert len(boxes) == 81
        assert len({(r['label']['key'], r['label']['sign']) for r in rows}) == 162
        assert all(r['label']['sign'] in EXPECTED_RATES and r['label']['countBoxOnce'] for r in rows)
        labels = [{k: r[k] for k in ('label', 'values', 'guards', 'derivativeMaps', 'coefficient')}
                  for r in rows]
        fields = {}
        for index in FIELDS:
            field = self.fields[index]
            assert field['id'] == f'coupled-field:{index}'
            assert tuple(field['directions']) == DIRECTIONS
            assert field['parameters'] == [*DIRECTIONS[:3], 622791, *DIRECTIONS[3:]]
            assert field['constantChartFactorsChecked']
            assert len(field['rows']) == len(rows)
            templates = {}
            for row, label in zip(field['rows'], labels):
                assert all(row[k] == v for k, v in label.items())
                assert row['coefficient'] == 1
                assert row['derivativeMaps'] == [[{'coefficient': 1, 'parameter': i}]
                                                  for i in LOCAL_DIRECTION_INDICES]
                params, values = row['localParameters'], row['values']
                assert tuple(params[i] for i in LOCAL_DIRECTION_INDICES) == DIRECTIONS
                assert tuple(values[i] for i in LOCAL_DIRECTION_INDICES) == DIRECTIONS
                assert all(ANGLE not in self.free(v) for p, v in zip(params, values) if p != ANGLE)
                assert all(ANGLE not in self.free(i) for guard in row['guards'] for i in guard)
                assert len(params) == len(values) and set(FROZEN) <= set(params)
                ell, *grid = (values[params.index(i)] for i in (622791, 623855, 623856, 623857))
                assert [ell, *grid] == [row['label']['ell'], *row['label']['grid']]
                definition = self.expressions[row['localSystem']]
                body = row['localBody']
                assert definition['body'] == body and definition['parameters'] == params
                assert self.free(body) <= set(params)
                sign = row['label']['sign']
                rate = EXPECTED_RATES[sign]
                coeff = self.angular(body, rate)
                modes = (-2, -1, 1, 2) if index < 16 else (-1, 1)
                assert tuple(sorted(coeff)) == modes
                assert all(self.recipe.conjugate(v) == coeff[-m] for m, v in coeff.items())
                template = {'localBody': body, 'localSystem': row['localSystem'],
                            'localParameters': params, 'coefficients': coeff, 'windingRate': rate}
                assert templates.setdefault(sign, template) == template
            fields[field['id']] = {'name': field['name'], 'templatesBySign': templates,
                                   'registrySourceAuthenticatedFlag': field['sourceAuthenticated'],
                                   'requiredSourcePremises': field['requiredSourcePremises']}
        assert len(self.phases) == 10 and len(self.reference_calls) == 16
        assert {r: sum(1 for p in self.phases.values() if p['windingRate'] == r)
                for r in EXPECTED_RATES.values()} == dict.fromkeys(EXPECTED_RATES.values(), 5)
        assert self.fields[9]['sourceRecipe']['sourceCover']['allCrossLabelProductsVanish']
        assert self.fields[16]['sourceRecipe']['originalSourceDisjointness']
        return labels, fields

    @cache
    def selected_phases(self, i, rate, difference):
        if ANGLE not in self.free(i):
            return frozenset()
        op, a = self.node(i)
        if op in ('sine', 'cosine'):
            return frozenset((self.phase(a[0], rate)[0],))
        if op == 'smooth_piecewise':
            if a[0] == PALETTE_DIFFERENCE:
                lo, hi = self.literal(a[1]), self.literal(a[2])
                assert lo is not None and hi is not None and lo.denominator == hi.denominator == 2
                assert difference not in (lo, hi)
                a = [a[3 if difference < lo else 4 if difference < hi else 5]]
            else:
                a = a[3:]
        else:
            assert op in ('add', 'multiply'), (i, op)
        return frozenset().union(*(self.selected_phases(j, rate, difference) for j in a))

    def source_chart(self, graph, labels):
        # The archived earlier Forced residual has the same normalized
        # residual scaling as Proposition 9.3. Use its actual defining nodes.
        wrappers = [x for x in self.expressions.values()
                    if x['name'].startswith('ActualForcedCurrent_angular_residual_') and '_reference_' in x['name']]
        assert len(wrappers) == 6
        extras = {RESIDUAL_SCALE, RESIDUAL_SCALE - 1, 5294, 3674923}
        extras.update(x['body'] - j for x in wrappers for j in (0, 1))
        self.nodes.update(authenticate_projection(graph, self.nodes, extras))
        assert self.node(RATIO) == ('exp', [3675261])
        assert self.node(3675261) == ('multiply', [127, 3675260])
        assert self.node(127) == ('log_positive', [24]) and self.literal(24) == 2
        assert self.node(3675260) == ('add', [622791, 3675259])
        assert self.node(3675259) == ('multiply', [20, 3675253]) and self.literal(20) == -1
        assert self.node(3675263) == ('sqrt_positive', [RATIO])
        assert self.node(3675268) == ('exp', [3675267])
        assert self.node(3675267) == ('multiply', [22, 3675266])
        assert self.node(3675266) == ('log_positive', [RATIO])
        assert self.node(22) == ('add', [19, 21]) and self.node(21) == ('multiply', [9, 20])
        assert self.literal(19) == Fraction(1, 2) and self.node(9) == ('source_parameter', ['h'])
        assert self.node(RESIDUAL_SCALE) == ('exp', [RESIDUAL_SCALE - 1])
        op, args = self.node(RESIDUAL_SCALE - 1)
        assert op == 'multiply' and 3675266 in args
        exponent, = set(args) - {3675266}
        assert exponent == 3674923
        assert self.node(exponent)[0] == 'add' and set(self.node(exponent)[1]) == {19, 5294}
        assert self.node(5294) == ('multiply', [23, 24])
        assert self.node(23) == ('add', [9, 19])
        coordinate_values = [3822571, 3822572, 3822573]
        factors = [3675263, 3675268, RATIO]
        for value, coord, factor in zip(coordinate_values, DIRECTIONS, factors):
            assert self.node(value) == ('multiply', [coord, factor])
        for wrapper in wrappers:
            body = wrapper['body']
            assert self.node(body) == ('multiply', [RESIDUAL_SCALE, body - 1])
            op, args = self.node(body - 1)
            assert op == 'm3_coupled_expression_partial' and args[1][:3] == coordinate_values
            assert args[1][3:] == wrapper['parameters'][3:] and not any(args[2])
        phase_cases = {}
        for call, binding in self.reference_calls.items():
            definition = self.expressions[binding['ownSystem']]
            sign = 1 if definition['name'].endswith('_own_0') else -1
            assert definition['name'].endswith(('_own_0', '_own_1'))
            assert binding['values'][:3] == coordinate_values
            rate = EXPECTED_RATES[sign]
            for d in range(5):
                phase, = self.selected_phases(definition['body'], rate, d)
                assert phase_cases.setdefault((sign, d), phase) == phase
            assert call in self.nodes
        assert len(set(phase_cases.values())) == 10
        assert all(row['values'][-1] == row['label']['fixedDifference'] for row in labels)

        first_forced = {}
        for row in self.forced:
            name, mode = row['name'].split('_m')
            d, sign = name.removeprefix('ActualOriginalForced_').split(':')
            d, sign, mode = map(int, (d, sign, mode))
            assert (sign, d) in phase_cases and mode in (1, 2)
            assert row['directions'] == list(DIRECTIONS[:-1])
            assert row['left'] == 0 and row['initial'] == [{'real': 0, 'imaginary': 0}] * 3
            first_forced[(d, sign, mode)] = {'system': row['id'], 'length': row['length'],
                                             'variable': row['variable'], 'name': row['name']}
        assert len(first_forced) == 20
        return {
            'levelDifferenceCoordinate': PALETTE_DIFFERENCE,
            'phaseCases': [{'sign': sign, 'difference': d, 'ownPhase': phase}
                           for (sign, d), phase in sorted(phase_cases.items())],
            'ratio': RATIO,
            'ratioDefinition': '2^(ell_own-ell_reference)',
            'ownCoordinates': coordinate_values,
            'referenceCoordinates': list(DIRECTIONS[:3]),
            'ownToReferenceDivisors': factors,
            'referenceResidualMultiplier': RESIDUAL_SCALE,
            'referenceResidualMultiplierExponent': exponent,
            'earlierForcedReferenceResidualRoots': [x['body'] for x in wrappers],
            'firstPositiveForcedSystems': list(first_forced.values()),
            'phaseChange': 'Multiply a reference t^m coefficient by exp(-i*m*k*Phi_offset) in the selected own phase case; the offset uses the original R,Z,T substitution and fixed row map.',
            'chartChange': 'Then evaluate at R_ref=R_own/sqrt(ratio), Z_ref=Z_own/ratio^D, T_ref=T_own/ratio and divide by the reference residual multiplier. Keep the actual Y coordinates and frozen row labels/copies.',
        }

    @cache
    def polynomial(self, i):
        if ANGLE not in self.free(i):
            return {(): self.recipe.source(i, self.literal(i))}
        op, a = self.node(i)
        if op == 'm3_coupled_indexed_partial':
            f, values, orders = a
            index = int(f.split(':')[-1])
            assert index in FIELDS and f == self.fields[index]['id']
            assert values == self.fields[index]['parameters']
            assert len(orders) == len(DIRECTIONS) and all(isinstance(n, int) and n >= 0 for n in orders)
            local = [0] * len(self.fields[index]['rows'][0]['localParameters'])
            for order, j in zip(orders, LOCAL_DIRECTION_INDICES):
                local[j] = order
            self.atoms[i] = {'field': f, 'arguments': values, 'orders': orders, 'localOrders': local,
                             'slowLocalOrders': [0 if j == LOCAL_DIRECTION_INDICES[-1] else n
                                                 for j, n in enumerate(local)], 'angleOrder': orders[-1],
                             'modes': [-2, -1, 1, 2] if index < 16 else [-1, 1]}
            return {(i,): 1}
        if op == 'add':
            return merge((self.polynomial(j) for j in a), self.recipe.add)
        if op == 'integer_power':
            base, exponent = a
            assert isinstance(exponent, int) and 0 <= exponent <= 2
            a = [base] * exponent
        else:
            assert op == 'multiply', (i, op)
        result = {(): 1}
        for j in a:
            result = combine(result, self.polynomial(j), self.recipe.add, self.recipe.mul,
                             lambda x, y: tuple(sorted((*x, *y))))
        return {m: j for m, j in result.items() if j}

    def groups(self):
        out = []
        for root in ROOTS:
            polynomial = self.polynomial(root)
            assert max(map(len, polynomial)) == 2
            contributions = []
            for word, coef in sorted(polynomial.items()):
                if not word:
                    continue
                term = {0: coef}
                for atom in word:
                    modes = {m: self.recipe.intern('indexedCoefficient', atom, m)
                             for m in self.atoms[atom]['modes']}
                    term = combine(term, modes, self.recipe.add, self.recipe.mul, int.__add__)
                contributions.append(term)
            diagonal = merge(contributions, self.recipe.add)
            assert set(diagonal) == set(range(-4, 5))
            assert all(self.recipe.conjugate(v) == diagonal[-m] for m, v in diagonal.items())
            own = {m: self.recipe.mul(self.recipe.intern('inverseResidualChart', v),
                                      self.recipe.intern('ownPhaseInverse', m))
                   for m, v in diagonal.items() if m}
            assert all(self.recipe.conjugate(v) == own[-m] for m, v in own.items())
            out.append({'root': root, 'background': polynomial[()],
                        'fullWavePolynomial': [{'indexedPartialFactors': k, 'coefficient': v}
                                               for k, v in sorted(polynomial.items()) if k],
                        'sameRowZeroMode': diagonal[0],
                        'sameRowNonzeroModes': {m: v for m, v in diagonal.items() if m},
                        'rawSameRowOwnPhaseNonzeroModes': own,
                        'crossRowPolynomial': [{'indexedPartialFactors': k, 'coefficient': v}
                                                for k, v in sorted(polynomial.items()) if len(k) == 2]})
        return out


def main():
    if not __debug__:
        raise RuntimeError('Source validation requires Python assertions')
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--reached', type=Path, required=True)
    p.add_argument('--registry', type=Path, required=True)
    p.add_argument('--graph', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    a = p.parse_args()
    source = Source(pinned_json(a.reached, REACHED_SHA), pinned_json(a.registry, REGISTRY_SHA))
    labels, fields = source.row_programs()
    chart = source.source_chart(a.graph, labels)
    groups = source.groups()
    modes = sorted(int(m) for m in groups[0]['sameRowNonzeroModes'])
    info = {
        'status': 'SOURCE_BOUND_HARMONIC_COEFFICIENT_RECIPES',
        'scope': 'first post-Signed FiveMap, archived prefix order 1',
        'graphUncompressedSha256': GRAPH_SHA,
        'reachedSha256': REACHED_SHA,
        'registrySha256': REGISTRY_SHA,
        'physicalVelocity': VELOCITY,
        'physicalPressure': PRESSURE,
        'angleCoordinate': ANGLE,
        'frozenWindingCoordinates': sorted(FROZEN),
        'sourcePhases': source.phases,
        'forcingChart': chart,
        'referenceCalls': source.reference_calls,
        'rows': labels,
        'fields': fields,
        'indexedAtoms': source.atoms,
        'coefficientRecipes': source.recipe.nodes,
        'residual': groups,
        'crossRowTermsRetained': True,
        'sameRowNonzeroModes': modes,
        'nextForcingInput': {
            'status': 'OPEN_FIRST_CYCLE_FLAT_RESIDUAL_SUBTRACTION',
            'operation': 'GroupedSupportedNonzeroResidual',
            'functionId': 'f_68465a2d86d9ee074ccccd4b',
            'retainsFullPhysicalResidualUntilSubtraction': True,
            'subtract': [
                'First forced (1-psi) f plus psi_prime t in the matched sign and phase case.',
                'Primary and first Signed homogeneous pulse principal-cutoff terms with f=0.',
                'Any other first-cycle nonzero angular term actually assigned to the additive F by Proposition 9.3.',
            ],
            'baseOldFlatOnlyModeZero': True,
        },
        'proofsOutstanding': [
            'Apply the original disjoint-support and flat-join premises to every first-cycle derivative row.',
            'Export and subtract the original first-cycle nonzero flat terms in this same phase and normalization.',
            'After subtracting F, pull the supported source back to the original pulse path.',
            'Use the actual forcing inverse for every nonzero harmonic and rebuild the dependent live seals.',
        ],
    }
    raw = (json.dumps(info, ensure_ascii=False, indent=2, sort_keys=True) + '\n').encode()
    a.output.write_bytes(raw)
    print(json.dumps({
        'status': info['status'],
        'archivedNodes': 4420257,
        'checkedProjectedNodes': 159655,
        'boxes': len(labels) // 2,
        'signedRows': len(labels),
        'angularFields': len(fields),
        'phases': len(source.phases),
        'indexedPartials': len(source.atoms),
        'sameRowModes': modes,
        'termsByComponentAndDegree': [dict(Counter(len(x['indexedPartialFactors'])
                                                 for x in r['fullWavePolynomial'])) for r in groups],
        'retainedQuadraticCrossRowMonomials': [len(g['crossRowPolynomial']) for g in groups],
        'outputSha256': sha256(raw).hexdigest(),
    }, sort_keys=True))


if __name__ == '__main__':
    main()
