"""Independent exact replay of the GitHub repaired first Forced source graph."""
from argparse import ArgumentParser
from array import array
from collections import Counter, defaultdict
from copy import copy, deepcopy
from fractions import Fraction
from functools import cache
import gzip
from hashlib import sha256
import json
from pathlib import Path
import re
import subprocess
from tempfile import TemporaryFile


BASE = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
PR30 = 'a9b3a5b317525f6d0a71e2e356b054c9d25d2e60'
REPAIR = '15582df5e06fa462b29fea01842becd89fb864ac'
SCOPE = 'REPAIRED_FIRST_FORCED_ONLY'
PARTS = ('real', 'imaginary')
ZERO = {'real': 0, 'imaginary': 0}
PALETTE = {f'{d}:{s}' for d in range(5) for s in (1, -1)}
SOURCE = 'research-ide/mathscope-m3/'
KEY = re.compile(rb'^\{"op":"([A-Za-z_0-9]+)","args":\[')


def need(condition, detail):
    if not condition:
        raise ValueError(detail)


def read(path):
    return json.loads(path.read_bytes())


class Graph:
    def __init__(self, path, backing, manifest):
        self.backing = backing
        self.offsets = array('Q')
        digest, count, size = sha256(), Counter(), 0
        with gzip.open(path, 'rb') as src:
            header = src.readline()
            need(json.loads(header) == {
                'schema': 'MathScope.M3.FullNodesJSONL/1',
                'node_count': manifest['node_count']}, 'full node stream header')
            size += len(header)
            digest.update(header)
            for line in src:
                match = KEY.match(line)
                need(match is not None and line.endswith(b']}\n'), f'node record {len(self.offsets)}')
                count[match[1].decode('ascii')] += 1
                self.offsets.append(backing.tell())
                digest.update(line)
                size += len(line)
                backing.write(line)
        need(len(self.offsets) == manifest['node_count'] and 0 < len(self.offsets) <= 5_000_000, 'node count')
        need(digest.hexdigest() == manifest['node_stream_sha256'], 'uncompressed graph SHA256')
        need(size == manifest['node_stream_uncompressed_bytes'], 'uncompressed byte count')
        need(dict(count) == manifest['operation_histogram'], 'complete operation histogram')

    def root(self, index):
        need(type(index) is int and 0 <= index < len(self.offsets), f'invalid graph root {index}')
        return index

    @cache
    def node(self, index):
        self.backing.seek(self.offsets[self.root(index)])
        record = json.loads(self.backing.readline())
        return record['op'], record['args']

    def args(self, index, operator):
        actual, args = self.node(index)
        need(actual == operator, f'node {index}: wanted {operator}, found {actual}')
        return args

    @staticmethod
    def children(op, args):
        if op in ('add', 'multiply', 'maximum', 'smooth_piecewise'):
            return args
        if op in ('inverse', 'integer_power', 'sqrt_positive', 'exp',
                  'log_positive', 'sine', 'cosine', 'source_step_derivative', 'ceiling'):
            return args[:1]
        if op == 'definite_integral':
            return args[0], args[2], args[3]
        if op == 'm3_forced_pulse_partial':
            return args[3], *args[4]
        if op.endswith('_partial') and len(args) == 3:
            return args[1]
        return ()

    def reach(self, roots):
        pending, seen = list(roots), set()
        while pending:
            root = pending.pop()
            if root in seen:
                continue
            seen.add(root)
            pending.extend(self.children(*self.node(root)))
        return seen


class Exact:
    """Sparse rational algebra with opaque analytic atoms and exact inverses."""
    zero = {}
    one = {(): Fraction(1)}

    def __init__(self, graph):
        self.graph = graph
        self.inverse_atoms = {}

    @staticmethod
    def scalar(value):
        return {(): Fraction(value)} if value else {}

    @staticmethod
    def add(*expressions):
        result = defaultdict(Fraction)
        for expression in expressions:
            for key, value in expression.items():
                result[key] += value
        return {key: value for key, value in result.items() if value}

    @staticmethod
    def neg(expression):
        return {key: -value for key, value in expression.items()}

    @classmethod
    def sub(cls, lhs, rhs):
        return cls.add(lhs, cls.neg(rhs))

    def mul(self, *expressions):
        result = self.one
        for expression in expressions:
            need(len(result) * len(expression) <= 300_000, 'exact expansion budget')
            values = defaultdict(Fraction)
            for left, a in result.items():
                for right, b in expression.items():
                    powers = Counter(dict(left))
                    powers.update(dict(right))
                    key = tuple(sorted((i, p) for i, p in powers.items() if p))
                    values[key] += a * b
            result = {key: value for key, value in values.items() if value}
        return result

    def inv(self, expression):
        need(expression, 'literal zero denominator')
        if len(expression) == 1:
            (powers, value), = expression.items()
            return {tuple((i, -n) for i, n in powers): 1 / value}
        # Normalize common monomial factors, including a rational scalar.
        coefficient = expression[min(expression)]
        monomials = [dict(powers) for powers in expression]
        atoms = set().union(*(m.keys() for m in monomials))
        common = {i: min(m.get(i, 0) for m in monomials) for i in atoms}
        key = tuple(sorted((tuple(sorted((i, power - common[i]) for i in atoms
                                          if (power := dict(m).get(i, 0)) != common[i])),
                            v / coefficient) for m, v in expression.items()))
        atom = self.inverse_atoms.setdefault(key, -1 - len(self.inverse_atoms))
        return {tuple(sorted([(atom, 1), *((i, -p) for i, p in common.items() if p)])): 1 / coefficient}

    def pow(self, expression, exponent):
        if exponent < 0:
            return self.pow(self.inv(expression), -exponent)
        result = self.one
        while exponent:
            if exponent & 1:
                result = self.mul(result, expression)
            exponent >>= 1
            if exponent:
                expression = self.mul(expression, expression)
        return result

    @cache
    def of(self, index):
        op, args = self.graph.node(index)
        if op == 'rational':
            return self.scalar(Fraction(int(args[0]), int(args[1])))
        if op == 'add':
            return self.add(*(self.of(i) for i in args))
        if op == 'multiply':
            return self.mul(*(self.of(i) for i in args))
        if op == 'inverse':
            return self.inv(self.of(args[0]))
        if op == 'integer_power':
            return self.pow(self.of(args[0]), args[1])
        return {((index, 1),): Fraction(1)}

    def dot(self, left, right):
        return self.add(*(self.mul(x, y) for x, y in zip(left, right, strict=True)))

    def affine_at(self, expression, assignments):
        """Apply the common-torus substitution to an affine exact polynomial."""
        result = []
        for monomial, scalar in expression.items():
            mutable = [(i, n) for i, n in monomial if i in assignments]
            need(not mutable or (len(mutable) == 1 and mutable[0][1] == 1), 'pulse is not affine in Y')
            fixed = {tuple((i, n) for i, n in monomial if i not in assignments): scalar}
            result.append(self.mul(fixed, assignments[mutable[0][0]]) if mutable else fixed)
        return self.add(*result)

    @staticmethod
    def reduce_sqrt_two(expression, root):
        result = defaultdict(Fraction)
        for monomial, scalar in expression.items():
            quotient, remainder = divmod(dict(monomial).get(root, 0), 2)
            powers = [(i, n) for i, n in monomial if i != root]
            if remainder:
                powers.append((root, remainder))
            result[tuple(sorted(powers))] += scalar * Fraction(2) ** quotient
        return {key: value for key, value in result.items() if value}

    def clear_compound_denominators(self, expression):
        """Return an exact numerator on the domain of all graph inverses."""
        definitions = {atom: dict(denominator) for denominator, atom in self.inverse_atoms.items()}
        for atom in sorted(definitions):
            powers = [dict(m).get(atom, 0) for m in expression]
            if not any(powers):
                continue
            maximum = max(0, *powers)
            denominator = definitions[atom]
            expression = self.add(*(self.mul({tuple((i, n) for i, n in m if i != atom): coefficient},
                                               self.pow(denominator, maximum - exponent))
                                    for (m, coefficient), exponent in zip(expression.items(), powers, strict=True)))
        return expression

    def verify_affine_atoms(self, expression, variables):
        definitions = {atom: dict(denominator) for denominator, atom in self.inverse_atoms.items()}
        mutable = set(variables)
        pending = {i for monomial in expression for i, _ in monomial if i not in mutable}
        seen = set()
        while pending:
            i = pending.pop()
            if i in seen:
                continue
            seen.add(i)
            if i < 0:
                nested = {j for monomial in definitions[i] for j, _ in monomial}
                need(not (nested & mutable), 'nonlinear pulse denominator depends on Y')
                pending.update(nested)
            else:
                need(not (self.graph.reach([i]) & mutable), 'opaque pulse expression depends on Y')


class Registry:
    def __init__(self, path, manifest):
        raw = path.read_bytes()
        need(sha256(raw).hexdigest() == manifest['definitions_sha256'], 'native function registry SHA256')
        source = json.loads(raw)
        need(isinstance(source['base']['base'], dict), 'native registry nested base')
        rows = json.loads(source['definitions'])
        need([len(r) for r in rows] == source['counts'] == manifest['extended_coupled_function_counts'],
             'coupled native registry counts')
        self.expressions, self.fields, self.inverses, self.pulses, self.forced_expressions = rows
        self.names = {item['name']: item for item in self.expressions
                      if item['name'].startswith('ActualInitializedAngularOwnLabel_')}
        need(len(self.names) == 6, 'original own-label harmonic bodies')

    def expression(self, graph, root):
        key, actual, orders = graph.args(root, 'm3_coupled_expression_partial')
        prefix = key.split(':')[0]
        need(prefix == 'coupled-expression', f'wrong expression registry {key}')
        definition = self.definition(key)
        formal = definition['parameters']
        need(definition['id'] == key and len(set(formal)) == len(formal) == len(actual) and
             orders == [0] * len(actual), f'wrong application arity/order {root}')
        need(all(graph.node(i)[0] == 'coordinate' for i in formal), f'non-coordinate formals at {root}')
        return definition, actual

    def definition(self, key):
        prefix, index = key.split(':')
        need(prefix in ('coupled-expression', 'forced-expression'), f'wrong expression registry {key}')
        rows = self.expressions if prefix == 'coupled-expression' else self.forced_expressions
        definition = rows[int(index)]
        need(definition['id'] == key, f'wrong expression definition {key}')
        return definition


def git_blob(repo, commit, path):
    cmd = ['git', '-c', 'core.longpaths=true', '-C', str(repo)]
    oid = subprocess.check_output([*cmd, 'rev-parse', f'{commit}:{path}']).strip().decode()
    return subprocess.check_output([*cmd, 'cat-file', 'blob', oid])


def source_pins(repo, commit):
    records = {}
    for rev, file, markers in [
        (commit, 'navier/source-initialized-angular.mjs', [
            'waveResidual=subtractVectorRows(G,update.direct,update.oldResidual)',
            'localMap(G.mul(G.q(1,2),dpsi,x))',
            'phaseVerifier(G.sub(G.mul(psi,x),primary.weightedAmplitude[j]))',
            'subtractVectorRows(G,waveResidual,primaryFlatResidual).filter(row=>row.m!==0)',
            'const a=G.mul(k,G.q(m),phase)',
            'Hw=Y.map((y,j)=>G.add(y,G.mul(factor,difference,vt[j])))']),
        (commit, 'navier/source-global-forced-current.mjs', [
            'forcing=pullback.map(z=>C.value(z.real.mapped,z.imaginary.mapped))',
            'mapped=G.simultaneousSubstitute(value,path.Y,path.Hw)',
            'pathSource:inverse.source']),
        (BASE, 'navier/source-coupled-expressions.mjs', [
            'const parameters=[input.variable,...input.parameters]',
            "wrap(z.real,'source_'+j+'_real')"]),
        (BASE, 'navier/source-forced-pulse.mjs', [
            'projectedRaw=projection.map(row=>cscale(G,G.q(-1),cdot(G,row,forcing)))',
            'pressureNumerator=cadd(G,cdot(G,normalRow,velocity),cdot(G,n,forcing))']),
        (BASE, 'post-signed-20261023/export_original_source_graph.mjs', [
            "await write({schema:'MathScope.M3.FullNodesJSONL/1'",
            "node_stream_sha256:digest.digest('hex')"]),
    ]:
        data = git_blob(repo, rev, SOURCE + file)
        need(all(marker.encode() in data for marker in markers), f'source pin {rev}:{file}')
        records[f'{rev}:{SOURCE}{file}'] = sha256(data).hexdigest()
    return records


def provenance(directory, outer, commit):
    manifest = read(directory / 'original-source-export-manifest.json')
    report = read(directory / 'corrected-first-force.json')
    need(outer['status'] == 'CORRECTED_FIRST_FORCE_VERIFIED' and
         outer['stage'] == 'CORRECTED_FIRST_FORCED_SOURCE_CAPTURED' and
         outer['real_original_forced_seal_issued'], 'hosted first-Forced construction receipt')
    need(outer['expected_base_commit'] == PR30 and outer['executing_commit'] == commit,
         'hosted original PR30 and executing commits')
    need(report['commit'] == manifest['executing_commit'] == commit and
         manifest['original_pr30_commit'] == PR30 and report['scope'] == manifest['scope'] == SCOPE,
         'producer and original commit/scope')
    need(report['snapshot'] == manifest and manifest['schema'] == 'MathScope.M3.SourceGraphReplayManifest/1',
         'separate manifest receipt mismatch')
    need(manifest['function_registry_capture_kind'] == 'EXTENDED_COUPLED_FACADE' and
         manifest['extended_coupled_registry_included'] and manifest['exact_source_node_stream_preserved'],
         'complete typed source closure')
    need(outer['corrected_first_force'] == {
         'systems': 20, 'components': 120, 'graphNodeCount': manifest['node_count'],
         'definitionsSha256': manifest['definitions_sha256']}, 'outer receipt vs actual manifest')
    need(report['release'] == manifest['release'] == 'HOLD' and
         report['finalJets'] == manifest['actual_final_67_jets_certified'] == 0 and
         report['correctedSignedTemporalFiveMap'] == report['uniformClassBounds'] == 'OPEN' and
         manifest['final_all_cycle_A_b_p'] is False and manifest['all_order_math_proved'] is False,
         'scope overclaim')
    return report, manifest


def q(graph, root):
    return Fraction(*map(int, graph.args(root, 'rational')))


def own_case(graph, definition, difference, pulse, length):
    level = definition['parameters'][-1]
    root, selected, pulse_seen = definition['body'], False, False
    while graph.node(root)[0] == 'smooth_piecewise':
        test, lo, hi, left, inside, right = graph.args(root, 'smooth_piecewise')
        if test == level:
            if q(graph, lo) < difference < q(graph, hi):
                root, selected = inside, True
            else:
                need(left == right, 'unequal inactive fixed-band arms')
                root = left
        else:
            need(left == right == 0, 'original own-chart support arm')
            if test == pulse:
                need(lo == 0 and hi == length, 'own-chart longitudinal interval')
                pulse_seen = True
            root = inside
    need(selected and pulse_seen and root != 0, 'wrong fixed-lift own-harmonic body')
    return root


def harmonic_terms(graph, root):
    """Split the original real reconstruction before expanding source coefficients."""
    op, args = graph.node(root)
    if op == 'add':
        for child in args:
            yield from harmonic_terms(graph, child)
        return
    if op != 'multiply':
        return
    trig = [i for i in args if graph.node(i)[0] in ('sine', 'cosine')]
    if trig:
        need(len(trig) == 1 and len(args) == 2, 'own-chart cosine/sine product')
        kind, [angle] = graph.node(trig[0])
        yield kind, angle, next(i for i in args if i != trig[0]), 1
        return
    for i in args:
        if graph.node(i)[0] == 'rational' and q(graph, i) == -1:
            need(len(args) == 2, 'signed own-chart product')
            for kind, angle, coefficient, sign in harmonic_terms(graph, next(j for j in args if j != i)):
                yield kind, angle, coefficient, -sign
            return


@cache
def additive(graph, root):
    """Normalize sums and rational multiples without expanding PDE products."""
    op, args = graph.node(root)
    if op == 'rational':
        return Exact.scalar(q(graph, root))
    if op == 'add':
        return Exact.add(*(additive(graph, i) for i in args))
    if op == 'multiply':
        factors = [i for i in args if graph.node(i)[0] != 'rational']
        if len(factors) == 1:
            coefficient = Fraction(1)
            for i in args:
                if i != factors[0]:
                    coefficient *= q(graph, i)
            return {key: coefficient * value for key, value in additive(graph, factors[0]).items()}
    return {((root, 1),): Fraction(1)}


def bind_raw_harmonics(graph, algebra, registry, rows):
    first, second = rows
    need(first['m'] == 1 and second['m'] == 2, 'positive own-harmonic modes')
    path = first['path']
    difference, sign = map(int, first['key'].split(':'))
    suffix = 0 if sign == 1 else 1
    carrier, receipts = None, []
    for j in range(3):
        definition = registry.names[f'ActualInitializedAngularOwnLabel_{suffix}_{j}']
        own = own_case(graph, definition, difference, path['pulse'], first['length'])
        terms = list(harmonic_terms(graph, own))
        # The original charts use a signed positive rate selected by their
        # phase producer, so the angular coefficient is a rate atom times m.
        theta = [i for i in definition['parameters'] if graph.node(i)[0] == 'coordinate' and
                 graph.node(i)[1][0].startswith('m3_global_band_angle$')]
        need(len(theta) == 1, f'physical angular coordinate in own body {own}')
        def fundamental(angle):
            angular_terms = [(powers, scale) for powers, scale in algebra.of(angle).items()
                             if any(i == theta[0] for i, _ in powers)]
            if len(angular_terms) != 1:
                return False
            powers, scale = angular_terms[0]
            other = [(i, power) for i, power in powers if i != theta[0]]
            return (scale == 1 and dict(powers)[theta[0]] == 1 and len(other) == 1 and
                    other[0][1] == 1 and graph.node(other[0][0])[0] == 'smooth_piecewise')

        candidates = [angle for kind, angle, _, _ in terms if kind == 'cosine' and fundamental(angle)]
        need(len(candidates) == 1, f'positive fundamental angle in own harmonic body {own}')
        local_carrier = algebra.of(candidates[0])
        if carrier is None:
            carrier = local_carrier
        need(carrier == local_carrier, 'same exact phase across components')
        harmonics = defaultdict(list)
        for kind, angle, coefficient, sign in terms:
            m = [m for m in (-2, -1, 1, 2) if algebra.of(angle) ==
                 algebra.mul(algebra.scalar(m), carrier)]
            need(len(m) == 1, 'unclassified original own-chart mode')
            harmonics[kind, m[0]].append((sign, coefficient))
        for row in rows:
            for part, kind, sign in [('real', 'cosine', 1), ('imaginary', 'sine', -1)]:
                component = next(c for c in row['components'] if c['j'] == j and c['part'] == part)
                actual = harmonics[kind, row['m']]
                need(actual == [(sign, component['raw'])] or (not actual and component['raw'] == 0),
                     f'{row["key"]} m={row["m"]} component={j} {part} not raw own phase')
        receipts.append({'component': j, 'originalOwnSystem': definition['id'], 'selectedBody': own,
                         'positiveFundamentalAngle': candidates[0]})
    return receipts


def bind_path(graph, algebra, path, system, key):
    difference, sign = map(int, key.split(':'))
    y, hw, w, pulse, ci, tg, vt, delta = (path[field] for field in
                                           ('Y', 'Hw', 'w', 'pulse', 'ci', 'Tg', 'vt', 'levelDifference'))
    need(delta == difference and w == system['variable'], f'{key} fixed pulse coordinate')
    need(len(y) == len(hw) == len(vt) == 2 and len(set([*y, w])) == 3, f'{key} path dimensions')
    need(graph.node(w)[0] == 'coordinate' and f'actual_forced_source_path_{difference}_{sign}'
         in graph.node(w)[1][0], f'{key} original fresh path variable')
    need(w not in graph.reach([pulse, ci, tg, *vt]), f'{key} original path input depends on w')
    need(set(y) <= set(system['directions']), f'{key} common torus directions')
    need(all(graph.node(i)[0] == 'coordinate' for i in y), f'{key} path formals are coordinates')
    b = algebra.add(algebra.of(vt[0]), algebra.one)
    need(q(graph, vt[1]) == 1 and len(b) == 1, f'{key} original transverse direction')
    ((monomial, coefficient),) = b.items()
    need(len(monomial) == 1 and monomial[0][1] == coefficient == 1 and
         q(graph, graph.args(monomial[0][0], 'sqrt_positive')[0]) == 2, f'{key} original v_t')
    scale = algebra.mul(algebra.of(ci), algebra.inv(algebra.pow(algebra.of(tg), delta)))
    displacement = algebra.sub(algebra.of(w), algebra.of(pulse))
    for j in range(2):
        expected = algebra.add(algebra.of(y[j]), algebra.mul(scale, displacement, algebra.of(vt[j])))
        need(algebra.of(hw[j]) == expected, f'{key} wrong actual H_w component {j}')
    images = dict(zip(y, map(algebra.of, hw), strict=True))
    original_pulse = algebra.of(pulse)
    algebra.verify_affine_atoms(original_pulse, y)
    pulse_error = algebra.sub(algebra.affine_at(original_pulse, images), algebra.of(w))
    numerator = algebra.clear_compound_denominators(pulse_error)
    need(not algebra.reduce_sqrt_two(numerator, monomial[0][0]), f'{key} pulse(H_w) differs from w')
    transverse = algebra.sub(algebra.of(y[0]), algebra.mul(algebra.of(vt[0]), algebra.of(y[1])))
    need(algebra.affine_at(transverse, images) == transverse, f'{key} H_w changes transverse coordinate')
    return dict(zip(y, hw, strict=True))


def vector(graph, value, length):
    need(len(value) == length and all(set(pair) == set(PARTS) for pair in value), 'complex vector layout')
    for z in value:
        for part in PARTS:
            graph.root(z[part])
    return value


def bind_inverse(graph, algebra, row, system, formal):
    key, m = row['key'], row['m']
    value = vector(graph, row['output'], 3)
    pressure, = vector(graph, [row['pressure']], 1)
    forcing = vector(graph, system['forcing'], 3)
    need(forcing == row['projectedSource'], f'{key} m{m} forcing registry readback')
    n = [algebra.of(i) for i in row['normal']['value']]
    n_prime = [algebra.of(i) for i in row['normal']['derivative']]
    n_squared = algebra.dot(n, n)
    need(len(n) == len(n_prime) == 3 and n_squared == algebra.of(row['normal']['squared']),
         f'{key} m{m} normal squared')
    K = [[algebra.of(i) for i in r] for r in row['K']]
    normal_row = [algebra.sub(algebra.dot(n, [K[i][j] for i in range(3)]), n_prime[j]) for j in range(3)]
    inv_squared = algebra.inv(n_squared)
    km = algebra.mul(algebra.scalar(m), algebra.of(row['k']))
    denom = algebra.inv(algebra.mul(km, n_squared))
    damping = algebra.mul(algebra.of(row['epsilon']), algebra.pow(km, 2), n_squared)
    for j in range(3):
        for i in range(3):
            matrix = algebra.add(algebra.neg(K[j][i]), algebra.mul(n[j], normal_row[i], inv_squared),
                                 algebra.neg(damping) if i == j else algebra.zero)
            need(algebra.of(system['matrix'][j][i]) == matrix, f'{key} m{m} wrong matrix {j},{i}')
        for part in PARTS:
            native = graph.args(value[j][part], 'm3_forced_pulse_partial')
            need(native == [system['id'], part, j, system['variable'], system['parameters'],
                            [0] * len(system['directions'])], f'{key} m{m} incorrect native velocity output')
            src = [algebra.of(formal[i][part]) for i in range(3)]
            want = algebra.add(algebra.neg(src[j]), algebra.mul(n[j], algebra.dot(n, src), inv_squared))
            need(algebra.of(forcing[j][part]) == want, f'{key} m{m} -P f component {j} {part}')
    for out_part, source_part, sign in [('real', 'imaginary', -1), ('imaginary', 'real', 1)]:
        normal_source = algebra.dot(n, [algebra.of(z[source_part]) for z in formal])
        normal_velocity = algebra.dot(normal_row, [algebra.of(z[source_part]) for z in value])
        want = algebra.mul(algebra.scalar(sign), denom, algebra.add(normal_source, normal_velocity))
        need(algebra.of(pressure[out_part]) == want, f'{key} m{m} normal-pressure {out_part}')
        need(normal_source, f'{key} m{m} missing full normal source {source_part}')
    return forcing


def cutoff(graph, algebra, registry, row, system, formal):
    result, path = row['mappedCutoff'], row['path']
    psi, dpsi = map(algebra.of, (result['psi'], result['dpsi']))
    params = system['parameters']
    pulse = path['pulse']
    slope = algebra.mul(algebra.scalar(20), algebra.inv(algebra.of(row['length'])))
    scaled_pulse = algebra.mul(slope, algebra.of(pulse))
    arguments = [algebra.sub(scaled_pulse, algebra.scalar(4)),
                 algebra.sub(algebra.scalar(16), scaled_pulse)]
    step = {}
    for root in graph.reach([result['psi'], result['dpsi']]):
        op, args = graph.node(root)
        if op != 'source_step_derivative' or args[1] not in (0, 1):
            continue
        for j, argument in enumerate(arguments):
            if algebra.of(args[0]) == argument:
                step[j, args[1]] = algebra.of(root)
    need(set(step) == {(j, n) for j in (0, 1) for n in (0, 1)}, 'missing exact cutoff transition')
    need(psi == algebra.mul(step[0, 0], step[1, 0]), 'wrong original longitudinal cutoff')
    need(dpsi == algebra.mul(slope, algebra.sub(algebra.mul(step[0, 1], step[1, 0]),
                                                algebra.mul(step[0, 0], step[1, 1]))),
         'wrong original longitudinal cutoff derivative')
    for j, z in enumerate(formal):
        for part in PARTS:
            piece = result['remainingSource'][j][part]
            if z[part] == 0:
                need(piece == 0, 'cutoff remaining source with zero forcing component')
            else:
                definition, _ = registry.expression(graph, z[part])
                candidates = [r for r in graph.reach([piece]) if graph.node(r) ==
                              ('m3_coupled_expression_partial', [definition['id'], [pulse, *params],
                                                                 [0] * (1 + len(params))])]
                need(len(candidates) == 1, 'cutoff formal source not mapped at actual endpoint')
                want = algebra.mul(algebra.sub(algebra.one, psi), algebra.of(candidates[0]))
                need(algebra.of(piece) == want, 'wrong cutoff remaining source factor')
            derivative = result['derivativeSource'][j][part]
            nodes = [r for r in graph.reach([derivative]) if graph.node(r) ==
                     ('m3_forced_pulse_partial', [system['id'], part, j, pulse, params,
                                                  [0] * len(system['directions'])])]
            need(len(nodes) == 1, 'cutoff derivative source lost exact mapped velocity')
            need(algebra.of(derivative) == algebra.mul(dpsi, algebra.of(nodes[0])),
                 'wrong cutoff derivative coefficient')
            need(algebra.of(result['velocity'][j][part]) == algebra.mul(psi, algebra.of(nodes[0])),
                 'wrong cutoff velocity coefficient')
            need(algebra.of(result['expected'][j][part]) == algebra.add(algebra.of(piece), algebra.of(derivative)),
                 'wrong cutoff principal residual decomposition')
    return {'psi': result['psi'], 'dpsi': result['dpsi']}


def primary_operand(graph, registry, row, component):
    j, part, root = component['j'], component['part'], component['primary']
    if row['m'] == 2 or part == 'imaginary':
        need(root == 0, f'{row["key"]} primary flat operand outside real fundamental')
        return None
    if root == 0:
        return None
    definition, actual = registry.expression(graph, root)
    delta, sign = row['key'].split(':')
    need(definition['name'] == f'OriginalPrimaryPrincipalFlat_{delta}_{sign}_{j}' and
         definition['parameters'] == actual, 'wrong primary flat source definition or lift')
    body = definition['body']
    dpsi = row['mappedCutoff']['dpsi']
    # Both archived products use the same fixed pulse transitions. The
    # source-pinned initialized constructor supplies the half uncut amplitude.
    def steps(index):
        return {i for i in graph.reach([index]) if graph.node(i)[0] == 'source_step_derivative'
                and graph.node(i)[1][1] == 1 and row['path']['pulse'] in graph.reach([i])}
    transition_roots = steps(dpsi)
    need(dpsi in graph.reach([body]) and len(transition_roots) == 2 and transition_roots <= steps(body),
         'primary longitudinal cutoff derivative and its two transitions')
    return {'definition': definition['id'], 'body': body, 'longitudinalDerivativeRoots': sorted(transition_roots)}


def bind_rows(graph, report, registry):
    rows = report['rows']
    need(report['positiveSystems'] == len(rows) == len(registry.pulses) == 20 and report['components'] == 120,
         'twenty native inverse systems, 120 real/imaginary source components')
    labels = {(r['key'], r['m']) for r in rows}
    need(labels == {(key, m) for key in PALETTE for m in (1, 2)}, 'complete positive fixed palette')
    need({r['system'] for r in rows} == set(range(20)), 'native inverse system coverage')
    checked, changed = [], Counter()
    by_label = {(r['key'], r['m']): r for r in rows}
    for key in sorted(PALETTE):
        pair = [by_label[key, m] for m in (1, 2)]
        need(pair[0]['path'] == pair[1]['path'] and pair[0]['normal'] == pair[1]['normal'] and
             all(pair[0][f] == pair[1][f] for f in ('K', 'epsilon', 'k', 'length')),
             f'{key} incompatible own path and principal frame across modes')
        # Bound cache growth from unrelated chart cases.
        algebra = Exact(graph)
        raw_harmonics = bind_raw_harmonics(graph, algebra, registry, pair)
        for row in pair:
            m, sid = row['m'], row['system']
            system = registry.pulses[sid]
            need(system['id'] == sid and system['name'] == f'ActualOriginalForced_{key}_m{m}' and
                 system['initial'] == [ZERO] * 3 and system['left'] == 0 and system['length'] == row['length'] and
                 system['finitePartialSumIsExactSolution'] is False,
                 f'{key} m{m} exact zero-data native inverse')
            params = [system['variable'], *system['parameters']]
            path_map = bind_path(graph, algebra, row['path'], system, key)
            need(len(row['components']) == 6 and [(x['j'], x['part']) for x in row['components']] ==
                 [(j, part) for j in range(3) for part in PARTS], f'{key} m{m} complex component ordering')
            formal = [dict(ZERO) for _ in range(3)]
            bindings, changed_count = [], 0
            for component in row['components']:
                j, part = component['j'], component['part']
                raw, primary, supported, mapped, wrapper = (component[k] for k in
                    ('raw', 'primary', 'supported', 'mapped', 'formalPathSource'))
                need(additive(graph, supported) == algebra.sub(additive(graph, raw), additive(graph, primary)),
                     f'{key} m{m} {j}.{part} not exact raw minus primary')
                need((raw == supported) == (primary == 0), f'{key} m{m} incorrect primary exclusion')
                changed_count += raw != supported
                primary_info = primary_operand(graph, registry, row, component)
                if supported == 0:
                    need(mapped == wrapper == 0 and component['system'] is None, 'zero source lost')
                    bindings.append({**component, 'primaryDefinition': primary_info})
                    continue
                source, actual = registry.expression(graph, mapped)
                need(source['id'] == component['system'] and source['body'] == supported and
                     source['name'] == f'ActualWholeNonzeroSource_{key}_{m}_{j}_{part}',
                     f'{key} m{m} {j}.{part} repaired source registry body')
                need(actual == [path_map.get(f, f) for f in source['parameters']],
                     f'{key} m{m} {j}.{part} wrong H_w formal-to-actual substitution')
                pulled, wrap_actual = registry.expression(graph, wrapper)
                need(pulled['name'] == f'CoupledForced_source_{j}_{part}' and pulled['body'] == mapped and
                     wrap_actual == pulled['parameters'] == params,
                     f'{key} m{m} {j}.{part} inverse source wrapper and formal coordinates')
                formal[j][part] = wrapper
                bindings.append({**component, 'primaryDefinition': primary_info,
                                 'sourceFormals': source['parameters'], 'sourceActuals': actual,
                                 'inverseWrapper': pulled['id']})
            need(changed_count == row['changed'] and (changed_count > 0 if m == 1 else changed_count == 0),
                 f'{key} m{m} fundamental vs second harmonic exclusion')
            changed[m] += changed_count
            forcing = bind_inverse(graph, algebra, row, system, formal)
            projected_reach = {part: graph.reach(z[part] for z in forcing) for part in PARTS}
            pressure_reach = {part: graph.reach([row['pressure'][part]]) for part in PARTS}
            for j, z in enumerate(formal):
                for part in PARTS:
                    opposite = PARTS[1 - PARTS.index(part)]
                    normal_component = algebra.of(row['normal']['value'][j])
                    need(z[part] == 0 or (z[part] in projected_reach[part] and
                                        (not normal_component or z[part] in pressure_reach[opposite])),
                         f'{key} m{m} {j}.{part} repaired source detached from -P f or pressure')
            cutoff_info = cutoff(graph, algebra, registry, row, system, formal)
            checked.append({'key': key, 'mode': m, 'system': sid, 'rawOwnHarmonics': raw_harmonics,
                            'path': row['path'], 'components': bindings, 'projectedSource': forcing,
                            'velocity': row['output'], 'pressure': row['pressure'], 'mappedCutoff': cutoff_info})
        Exact.of.cache_clear()
    return checked, dict(sorted(changed.items()))


def manifest_roots(graph, report, manifest):
    # Respect the actual export-set ordering independently of the evidence sort.
    roots = list(report['physicalResidual'])
    need(len(roots) == len(set(roots)) == 3, 'physical conservative residual component roots')
    for row in report['rows']:
        for c in row['components']:
            roots.extend(c[k] for k in ('raw', 'primary', 'supported', 'mapped', 'formalPathSource'))
        for z in [*row['output'], row['pressure']]:
            roots.extend(z[part] for part in PARTS)
    for root in roots:
        graph.root(root)
    need(list(dict.fromkeys(roots)) == manifest['original_root_ids'], 'exact exported ordered root set')


def physical_bindings(graph, registry, roots):
    """Follow actual coupled definitions into each physical PDE output."""
    outputs = []
    for root in roots:
        pending, seen, forced, fields = [root], set(), set(), set()
        while pending:
            current = pending.pop()
            if current in seen:
                continue
            seen.add(current)
            op, args = graph.node(current)
            pending.extend(graph.children(op, args))
            if op in ('m3_coupled_expression_partial', 'm3_forced_expression_partial'):
                key, actual, orders = args
                definition = registry.definition(key)
                need(len(definition['parameters']) == len(actual) == len(orders),
                     'physical residual expression arguments')
                pending.append(definition['body'])
            elif op == 'm3_coupled_indexed_partial':
                key = args[0]
                if key in fields:
                    continue
                prefix, index = key.split(':')
                need(prefix == 'coupled-field', 'physical residual indexed field owner')
                field = registry.fields[int(index)]
                need(field['id'] == key, 'physical residual indexed field registration')
                for row in field['rows']:
                    local = registry.definition(row['localSystem'])
                    need(row['localBody'] == local['body'] and
                         len(local['parameters']) == len(row['values']), 'physical indexed row body and parameters')
                    pending.extend([row['localBody'], row['coefficient'], *row['values']])
                fields.add(key)
            elif op == 'm3_forced_pulse_partial':
                forced.add(args[0])
        outputs.append({'root': root, 'nativeForcedSystemsReached': sorted(forced), 'typedFieldCount': len(fields)})
    need({system for out in outputs for system in out['nativeForcedSystemsReached']} == set(range(20)),
         'twenty repaired inverse systems used by actual physical residual')
    return outputs


def reject(action, label):
    try:
        action()
    except ValueError:
        return label
    raise ValueError(f'mutation survived: {label}')


def controls(graph, report, registry):
    verified = []
    first = next(row for row in report['rows'] if row['key'] == '0:-1' and row['m'] == 1)
    j = next(i for i, c in enumerate(first['components']) if c['primary'] != 0)
    changes = {
        'rawRealImaginarySwap': lambda r: r['components'][0].update(raw=r['components'][1]['raw']),
        'restoreRawInsteadOfSupported': lambda r: r['components'][j].update(supported=r['components'][j]['raw']),
        'bypassFormalSourceWrapper': lambda r: r['components'][j].update(
            formalPathSource=r['components'][j]['mapped']),
        'swapPathYImages': lambda r: r['path'].update(Hw=r['path']['Hw'][::-1]),
        'wrongNativeVelocityPart': lambda r: r['output'][0].update(real=r['output'][0]['imaginary']),
        'wrongPressurePart': lambda r: r['pressure'].update(real=r['pressure']['imaginary']),
    }
    for label, change in changes.items():
        modified = deepcopy(report)
        first = next(row for row in modified['rows'] if row['key'] == '0:-1' and row['m'] == 1)
        change(first)
        if label == 'swapPathYImages':
            second = next(row for row in modified['rows'] if row['key'] == '0:-1' and row['m'] == 2)
            change(second)
        verified.append(reject(lambda: bind_rows(graph, modified, registry), label))
    modified = deepcopy(report)
    first = next(row for row in modified['rows'] if row['key'] == '0:-1' and row['m'] == 1)
    altered = copy(registry)
    altered.pulses = list(registry.pulses)
    system = deepcopy(registry.pulses[first['system']])
    j, part = next((j, part) for j, z in enumerate(system['forcing']) for part in PARTS if z[part])
    system['forcing'][j][part] = 0
    first['projectedSource'][j][part] = 0
    altered.pulses[first['system']] = system
    verified.append(reject(lambda: bind_rows(graph, modified, altered), 'detachProjectedForcing'))
    return verified


def main():
    parser = ArgumentParser(description=__doc__)
    for arg in ('repo', 'artifact', 'out'):
        parser.add_argument('--' + arg, type=Path, required=True)
    parser.add_argument('--commit', default=REPAIR)
    parser.add_argument('--run-metadata', type=Path)
    args = parser.parse_args()
    pin_hashes = source_pins(args.repo, args.commit)
    directories = list(args.artifact.rglob('corrected-first-force.json'))
    need(len(directories) == 1, 'unique successful GitHub first Forced graph receipt')
    outer = list(args.artifact.rglob('corrected-first-forced-run.json'))
    need(len(outer) == 1, 'unique GitHub runner receipt')
    directory = directories[0].parent
    report, manifest = provenance(directory, read(outer[0]), args.commit)
    metadata = None
    if args.run_metadata:
        metadata = read(args.run_metadata)
        need(metadata['headSha'] == args.commit and metadata['status'] == 'completed' and
             metadata['conclusion'] == 'success' and metadata['workflowName'] == 'MathScope corrected first Forced source',
             'authenticated successful GitHub run and pinned head')
    registry = Registry(directory / 'original-source-functions.json', manifest)
    with TemporaryFile() as backing:
        graph = Graph(directory / 'original-source-nodes.jsonl.gz', backing, manifest)
        manifest_roots(graph, report, manifest)
        rows, changes = bind_rows(graph, report, registry)
        physical = physical_bindings(graph, registry, report['physicalResidual'])
        negative = controls(graph, report, registry)
    result = {
        'schema': 'MathScope.N6.IndependentRepairedFirstForcedReplay/1',
        'verdict': 'VERIFIED_REPAIRED_FIRST_FORCED_ONLY',
        'producerCommit': args.commit, 'referenceCheckoutCommit': BASE, 'originalPR30Commit': PR30,
        'sourceSHA256': pin_hashes,
        'hostedRun': metadata,
        'snapshot': manifest, 'positiveSystems': len(rows), 'exactComplexSourceComponents': 120,
        'changedRealComponentsByMode': changes, 'rows': rows, 'physicalResidualScope': physical,
        'rejectedNegativeControls': negative,
        'scope': ('Exact finite source graph checks on the declared first Forced pulse domain. '
                  'No uniform source classes, higher correction stage or final jets are inferred.'),
        'allHigherStages': 'OPEN', 'finalJets': 0, 'release': 'HOLD',
    }
    raw = (json.dumps(result, indent=2) + '\n').encode()
    args.out.write_bytes(raw)
    print(json.dumps({'positiveSystems': len(rows), 'components': 120, 'changedByMode': changes,
                      'sha256': sha256(raw).hexdigest(), 'negativeControls': negative}))


if __name__ == '__main__':
    main()
