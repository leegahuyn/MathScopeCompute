"""Independently differentiate the live own-label fields and compare their Fourier residual."""
from argparse import ArgumentParser
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
from tempfile import TemporaryFile

from check_repeat_forced_candidates import CANDIDATE_FILE, CANDIDATE_SCOPE, Exact, Graph, STREAM, verify_manifest
from bind_mean_angle_scope import Scope

R, Z, T, THETA, Y0, Y1 = 622802, 622803, 622804, 622806, 635044, 635045
EPSILON, K, LOCAL_RADIAL_RATE = 622798, 622801, 625154
REFERENCE_RADIAL_RATE, REFERENCE_TIME_RATE = 635060, 635063
SQRT_TWO, VR1, VT0 = 3622, 623066, 623067
LIVE_RECEIPT = '3e3911a19698f1f59187a34665a86be9b1e2f6296a3fa113be1b5f12be2d5285'
PROJECTION = 'e84f0c23808217cac24b77a380da734525b9054a3c56e3c3fd0b79a5afdfc8bb'
FIRST_PRODUCER = 'c7d429adb927a3020b870df3fb755806061727ed2efc7d8df8736c785e65f835'
REPEAT_PRODUCER = '43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf'
PARTS = ('real', 'imaginary')


class DifferentialAlgebra(Exact):
    def __init__(self, graph, registry):
        super().__init__(graph)
        self.scope = Scope(graph, registry)
        self.native_ids = {}
        self.native_by_id = {}
        self.first_synthetic = len(graph.offsets)

    def native(self, op, system, values, orders):
        key = op, system, tuple(values), tuple(orders)
        index = self.native_ids.setdefault(key, self.first_synthetic + len(self.native_ids))
        self.native_by_id[index] = key
        return {((index, 1),): self.one[()]}

    @cache
    def of(self, index):
        op, operands = self.graph.node(index)
        if op in ('actual_expression_partial', 'm3_coupled_expression_partial', 'm3_aux_expression_partial',
                  'm3_coupled_indexed_partial', 'm3_aux_indexed_partial', 'm3_global_indexed_partial',
                  'm3_coupled_inverse_partial', 'm3_aux_inverse_partial'):
            return self.native(op, *operands)
        return super().of(index)

    def derivative_slots(self, op, system, actual, orders):
        if op.endswith('_expression_partial'):
            assert len(actual) == len(orders)
            return range(len(actual))
        elif op == 'm3_global_indexed_partial':
            definition = self.scope.base['m3GlobalFields'][system]
        else:
            assert op.endswith(('_indexed_partial', '_inverse_partial'))
            definition = self.scope.definition(system, 1 if op.endswith('_indexed_partial') else 2)
        params = definition['parameters']
        directions = definition.get('directions', params)
        assert len(params) == len(actual) and len(directions) == len(orders)
        return [params.index(direction) for direction in directions]

    @cache
    def atom_derivative(self, atom, direction):
        if atom in self.native_by_id:
            op, system, actual, orders = self.native_by_id[atom]
            terms = []
            slots = self.derivative_slots(op, system, actual, orders)
            for order_slot, actual_slot in enumerate(slots):
                differentiated = self.derivative(self.of(actual[actual_slot]), direction)
                if differentiated:
                    counts = list(orders)
                    counts[order_slot] += 1
                    terms.append(self.mul(differentiated, self.native(op, system, actual, counts)))
            return self.add(*terms)
        if atom < 0:
            denominator, = (dict(key) for key, value in self.inverse_atoms.items() if value == atom)
            return self.neg(self.mul({((atom, 2),): self.one[()]},
                                     self.derivative(denominator, direction)))
        if atom == direction:
            return self.one
        if direction not in self.scope.free(atom):
            return self.zero
        op, operands = self.graph.node(atom)
        if op in ('exp', 'log_positive', 'sqrt_positive'):
            arg, = operands
            factor = {
                'exp': lambda: self.of(atom),
                'log_positive': lambda: self.inv(self.of(arg)),
                'sqrt_positive': lambda: self.mul(self.scalar('1/2'), self.inv(self.of(atom))),
            }[op]()
            return self.mul(factor, self.derivative(self.of(arg), direction))
        raise ValueError((atom, direction, op, operands))

    def derivative(self, expression, direction):
        terms = []
        for monomial, coefficient in expression.items():
            for atom, exponent in monomial:
                d = self.atom_derivative(atom, direction)
                if d:
                    powers = dict(monomial)
                    powers[atom] -= 1
                    lowered = tuple(sorted((root, power) for root, power in powers.items() if power))
                    terms.append(self.mul({lowered: coefficient * exponent}, d))
        return self.add(*terms)


class FourierResidual:
    """Independent product-rule form of div(U tensor U) and the vector Laplacian."""
    def __init__(self, algebra, phase, radial, time_fast):
        self.a = algebra
        self.epsilon, self.k = map(algebra.of, (EPSILON, K))
        self.inv_r = algebra.inv(algebra.of(R))
        self.inv_r2 = algebra.pow(self.inv_r, 2)
        self.radial, self.ci = radial, time_fast
        self.phase = algebra.of(phase), algebra.zero

    def sum(self, *pairs):
        return tuple(self.a.add(*(pair[slot] for pair in pairs)) for slot in range(2))

    def scale(self, scalar, value):
        return tuple(self.a.mul(scalar, part) for part in value)

    def mul(self, lhs, rhs):
        a, b = lhs
        c, d = rhs
        return self.a.sub(self.a.mul(a, c), self.a.mul(b, d)), self.a.add(self.a.mul(a, d), self.a.mul(b, c))

    def partial(self, value, direction):
        return tuple(self.a.derivative(part, direction) for part in value)

    def base_derivative(self, value, coordinate):
        if coordinate == R:
            fast = self.sum(self.partial(value, Y0), self.scale(self.a.of(VR1), self.partial(value, Y1)))
            return self.sum(self.partial(value, R), self.scale(self.radial, fast))
        if coordinate == Z:
            return self.scale(self.epsilon, self.partial(value, Z))
        if coordinate == T:
            fast = self.sum(self.scale(self.a.of(VT0), self.partial(value, Y0)), self.partial(value, Y1))
            return self.sum(self.scale(self.a.neg(self.epsilon), self.partial(value, T)), self.scale(self.ci, fast))
        assert coordinate == THETA
        return self.partial(value, THETA)

    def derivative(self, value, coordinate, mode):
        phase, imag = self.base_derivative(self.phase, coordinate)
        assert not imag
        rate = self.a.mul(self.a.scalar(mode), self.k, phase)
        base = self.base_derivative(value, coordinate)
        return self.sum(base, self.mul((self.a.zero, rate), value))

    def linear(self, wave, pressure, component, mode):
        x = wave[component]
        dr = self.derivative(x, R, mode)
        drr = self.derivative(dr, R, mode)
        dzz = self.derivative(self.derivative(x, Z, mode), Z, mode)
        dtt = self.derivative(self.derivative(x, THETA, mode), THETA, mode)
        lap = self.sum(drr, self.scale(self.inv_r, dr), dzz, self.scale(self.inv_r2, dtt))
        if component < 2:
            other = self.derivative(wave[1 - component], THETA, mode)
            connection = self.scale(self.a.scalar(2 if component else -2), other)
            lap = self.sum(lap, self.scale(self.inv_r2, self.sum(self.scale(self.a.scalar(-1), x), connection)))
        grad_p = self.derivative(pressure, (R, THETA, Z)[component], mode)
        if component == 1:
            grad_p = self.scale(self.inv_r, grad_p)
        return self.sum(self.derivative(x, T, mode), self.scale(self.a.neg(self.epsilon), lap), grad_p)

    def quadratic(self, velocity, component, mode):
        terms = []
        for left, u in velocity.items():
            right = mode - left
            if right not in velocity:
                continue
            v = velocity[right]
            transports = []
            for j, coordinate in enumerate((R, THETA, Z)):
                du = self.derivative(u[component], coordinate, left)
                dv = self.derivative(v[j], coordinate, right)
                pair = self.sum(self.mul(du, v[j]), self.mul(u[component], dv))
                transports.append(self.scale(self.inv_r, pair) if j == 1 else pair)
            connection = [self.mul(u[component], v[0])]
            if component == 0:
                connection.append(self.scale(self.a.scalar(-1), self.mul(u[1], v[1])))
            elif component == 1:
                connection.append(self.mul(u[0], v[1]))
            terms.append(self.sum(*transports, self.scale(self.inv_r, self.sum(*connection))))
        return self.sum(*terms)


def pair(algebra, row):
    return tuple(algebra.of(row[part]) for part in PARTS)


def waves(algebra, by_name, key, mean):
    velocity = {0: [pair(algebra, value) for value in mean['velocity']]}
    pressure = {0: pair(algebra, mean['pressure'])}
    zero = algebra.zero
    for m in (1, 2):
        columns = []
        for j in range(4):
            parts = []
            for part in PARTS:
                field = by_name.get(f'PostFiveRepeatWave_{key}_{m}_{j}_{part}')
                if field is None:
                    parts.append(zero)
                else:
                    actual = field['parameters']
                    parts.append(algebra.native('m3_coupled_expression_partial', field['id'], actual, [0] * len(actual)))
            columns.append(tuple(parts))
        velocity[m], pressure[m] = columns[:3], columns[3]
        velocity[-m] = [(a, algebra.neg(b)) for a, b in velocity[m]]
        a, b = pressure[m]
        pressure[-m] = a, algebra.neg(b)
    return velocity, pressure


def check_case(graph, registry, definitions, template, first, mean):
    a = DifferentialAlgebra(graph, registry)
    key = template['key']
    velocity, pressure = waves(a, definitions, key, mean)
    degree = template['difference']
    lam = a.sub(a.scalar(4), a.of(SQRT_TWO))
    radial = a.mul(a.of(LOCAL_RADIAL_RATE), a.inv(a.pow(lam, degree)))
    time_fast = a.mul(a.of(first['path']['ci']), a.inv(a.pow(a.of(first['path']['Tg']), degree)))
    result = FourierResidual(a, template['phase'], radial, time_fast)
    checked = []
    for row in template['rows']:
        mode = row['m']
        zeros = (a.zero, a.zero)
        for j, observed in enumerate(row['raw']):
            linear = result.linear(velocity[mode], pressure[mode], j, mode) if mode in velocity else zeros
            quadratic = result.quadratic(velocity, j, mode)
            for part, expected, actual in zip(PARTS, result.sum(linear, quadratic), pair(a, observed), strict=True):
                defect = a.sub(expected, actual)
                if defect:
                    defect = a.reduce_sqrt_two(a.clear_compound_denominators(defect), SQRT_TWO)
                assert not defect, (key, mode, j, part, len(defect), next(iter(defect.items()), None))
                checked.append({'mode': mode, 'component': j, 'part': part, 'rawRoot': observed[part]})
    DifferentialAlgebra.atom_derivative.cache_clear()
    DifferentialAlgebra.of.cache_clear()
    Exact.of.cache_clear()
    return {'key': key, 'ownPhase': template['phase'], 'rawComponents': checked}


def check_reference(graph, registry, projection, candidate):
    a = DifferentialAlgebra(graph, registry)
    operator = FourierResidual(a, 0, a.of(REFERENCE_RADIAL_RATE), a.of(REFERENCE_TIME_RATE))
    fields = [*projection['physicalVelocity'], projection['physicalPressure']]
    observed = [row['root'] for row in projection['residual']]
    assert observed == candidate['precedingConservativeResidual']
    indexed_waves = {row['field'] for row in candidate['fields']}
    assert indexed_waves == set(projection['fields'])

    def wave_terms(value):
        wave_atoms = {atom for atom, (op, system, _, _) in a.native_by_id.items()
                      if op == 'm3_coupled_indexed_partial' and system in indexed_waves}
        return {term: coeff for term, coeff in value.items() if any(atom in wave_atoms for atom, _ in term)}

    velocity = [(a.of(root), a.zero) for root in fields[:3]]
    angular_velocity = [(wave_terms(real), a.zero) for real, _ in velocity]
    pressure = wave_terms(a.of(fields[3])), a.zero
    records = []
    for j, root in enumerate(observed):
        linear = operator.linear(angular_velocity, pressure, j, 0)
        quadratic = operator.quadratic({0: velocity}, j, 0)
        real, imag = operator.sum(linear, quadratic)
        assert not imag
        projected = wave_terms(real)
        difference = a.sub(projected, wave_terms(a.of(root)))
        if difference:
            difference = a.reduce_sqrt_two(a.clear_compound_denominators(difference), SQRT_TWO)
        assert not difference, (j, root, 'physical reference', len(difference), next(iter(difference.items()), None))
        records.append({'component': j, 'root': root, 'exactWaveDependentMonomials': len(projected)})
    DifferentialAlgebra.atom_derivative.cache_clear()
    DifferentialAlgebra.of.cache_clear()
    Exact.of.cache_clear()
    return {'fields': fields, 'conservativeRoots': records, 'sourceSHA256': PROJECTION}


def pinned(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected, path
    return json.loads(raw)


def main():
    parser = ArgumentParser(description=__doc__)
    for key in ('candidate-dir', 'first-dir', 'official-receipt', 'out'):
        parser.add_argument('--' + key, required=True, type=Path)
    args = parser.parse_args()
    official = pinned(args.official_receipt, LIVE_RECEIPT)
    manifest, registry = verify_manifest(args.candidate_dir, CANDIDATE_SCOPE, official['commit'])
    assert manifest['node_stream_sha256'] == official['graphSHA256']
    candidate = pinned(args.candidate_dir / CANDIDATE_FILE, REPEAT_PRODUCER)
    assert candidate['snapshot'] == manifest and len(candidate['templates']) == 10
    prior = pinned(args.first_dir / 'corrected-first-force.json', FIRST_PRODUCER)
    projection = pinned(Path(__file__).resolve().parent.parent / 'corrected-flat/corrected-postfive-global-projection.json',
                        PROJECTION)
    assert projection['graphSHA256'] == official['matchedCorrectedFirstCyclePrefix']['firstStreamSHA256']
    first_rows = {row['key']: row for row in prior['rows'] if row['m'] == 1}
    definitions = {row['name']: row for row in json.loads(registry['definitions'])[0]
                   if row['name'].startswith('PostFiveRepeatWave_')}
    rows = []
    with TemporaryFile() as backing:
        graph = Graph(args.candidate_dir / STREAM, backing, manifest)
        reference = check_reference(graph, registry, projection, candidate)
        print('PASS the wave-dependent part of all three reference conservative roots', flush=True)
        for template in candidate['templates']:
            row = check_case(graph, registry, definitions, template, first_rows[template['key']], candidate['mean'])
            rows.append(row)
            print(f"PASS {row['key']} conservative raw coefficients", flush=True)
    result = {
        'schema': 'MathScope.M3.LiveRepeatIndependentConservativeProjection/1',
        'graphSHA256': official['graphSHA256'], 'registrySHA256': official['registrySHA256'],
        'referenceRealConservativeReplay': reference,
        'cases': rows, 'positiveRawComponentCount': sum(len(row['rawComponents']) for row in rows),
        'scope': 'ordinary own-label derivatives of the actual wave and mean arguments',
        'uniformSupportAndAllCycleFinalField': 'OPEN', 'release': 'HOLD',
    }
    args.out.write_bytes((json.dumps(result, indent=2) + '\n').encode())


if __name__ == '__main__':
    main()
