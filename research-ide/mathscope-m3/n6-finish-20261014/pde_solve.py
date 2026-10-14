"""Source-bound registered-body PDE reduction with two derivative algorithms.

No independent Cartesian result ID is substituted into an original source
atom. Every attempted source jet is rederived from its own literal registry
body and complete argument tuple. Unsupported calculus preserves that atom.
"""
from __future__ import annotations
from collections import Counter
from fractions import Fraction as Q
import hashlib
import json
from math import factorial
from pathlib import Path
import subprocess
import sys
import time

OLD = Path(__file__).resolve().parent.parent / 'n6-cloud-20261014'
if str(OLD) not in sys.path:
    sys.path.insert(0, str(OLD))
from jet_worker import (SourceCalculus, VerifiedSourceStore, EXPRESSION_OPS, REGISTERED_OPS,
                        UNARY, definition_key, js_hash, PARENT, BudgetStop)
from guard_worker import step_lemma

COUNTS = (169, 197, 654)
DIRECT = (3825257, 3825259, 3825261)
ASSEMBLED = (3825348, 3825349, 3825350)


class Stop(ValueError):
    pass


def require(ok, message):
    if not ok:
        raise ValueError(message)


def read(path):
    return json.loads(Path(path).read_text(encoding='utf8'))


def save(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf8')


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def decode(text):
    rows = [] if not text else [tuple(map(int, part.split(':'))) for part in text.split(',')]
    require(len({i for i, _ in rows}) == len(rows) and all(i >= 0 and p > 0 for i, p in rows),
            'Malformed original numerator source powers')
    return rows


class Arena:
    """One canonical arithmetic circuit, independent of source node numbers."""
    def __init__(self, max_nodes=350000):
        self.nodes, self.intern, self.support = [], {}, {}
        self.max_nodes, self.deadline = max_nodes, float('inf')
        self.zero, self.one = self.q(0), self.q(1)

    def put(self, op, args):
        key = json.dumps([op, args], ensure_ascii=False, separators=(',', ':'))
        if key in self.intern:
            return self.intern[key]
        if len(self.nodes) >= self.max_nodes or time.monotonic() > self.deadline:
            raise Stop('Source-body circuit node/time budget reached')
        if key not in self.intern:
            self.intern[key] = len(self.nodes)
            self.nodes.append({'op': op, 'args': args})
        return self.intern[key]

    def q(self, value):
        value = Q(value)
        return self.put('rational', [str(value.numerator), str(value.denominator)])

    def value(self, ident):
        n = self.nodes[ident]
        return Q(*map(int, n['args'])) if n['op'] == 'rational' else None

    def operation(self, op, children):
        children, scalar = list(children), Q(0 if op == 'add' else 1)
        flat = []
        for ident in children:
            node = self.nodes[ident]
            values = node['args'] if node['op'] == op else [ident]
            if len(flat) + len(values) > 12000:
                raise Stop('Expanded associative source operation exceeds 12000 operand budget')
            for child in values:
                value = self.value(child)
                if value is None:
                    flat.append(child)
                elif op == 'add':
                    scalar += value
                else:
                    scalar *= value
        if op == 'multiply' and not scalar:
            return self.zero
        if scalar != (0 if op == 'add' else 1) or not flat:
            flat.append(self.q(scalar))
        flat.sort()
        return flat[0] if len(flat) == 1 else self.put(op, flat)

    def add(self, *xs):
        return self.operation('add', xs)

    def mul(self, *xs):
        return self.operation('multiply', xs)

    def neg(self, ident):
        return self.mul(self.q(-1), ident)

    def power(self, ident, order):
        if order == 0:
            return self.one
        if order == 1:
            return ident
        value = self.value(ident)
        if value is not None and (value or order >= 0):
            return self.q(value ** order)
        return self.put('integer_power', [ident, order])

    def inverse(self, ident):
        value = self.value(ident)
        if value is not None:
            if not value:
                raise Stop('Original elementary expansion encounters exact zero denominator')
            return self.q(1 / value)
        return self.put('inverse', [ident])

    def function(self, op, arg, order=None):
        if op == 'exp' and arg == self.zero or op == 'cosine' and arg == self.zero:
            return self.one
        if op == 'sine' and arg == self.zero or op == 'log_positive' and arg == self.one:
            return self.zero
        return self.put(op, [arg] if order is None else [arg, order])

    def dependencies(self, ident):
        if ident in self.support:
            return self.support[ident]
        n = self.nodes[ident]
        op, a = n['op'], n['args']
        if op == 'coordinate':
            result = frozenset({a[1]})
        elif op in {'rational', 'source_parameter'}:
            result = frozenset()
        elif op == 'opaque_function':
            result = frozenset().union(*(self.dependencies(x) for x in a[1]))
        elif op in {'add', 'multiply'}:
            result = frozenset().union(*(self.dependencies(x) for x in a))
        elif op in UNARY:
            result = self.dependencies(a[0])
        else:
            raise Stop('Unreviewed independent circuit operation: ' + op)
        self.support[ident] = result
        return result

    def substitute(self, root, replacements):
        cache = {}
        def visit(ident):
            if ident in cache:
                return cache[ident]
            n = self.nodes[ident]
            op, a = n['op'], n['args']
            if op == 'coordinate':
                value = replacements.get(a[1], ident)
            elif op in {'rational', 'source_parameter'}:
                value = ident
            elif op in {'add', 'multiply'}:
                value = self.operation(op, [visit(x) for x in a])
            elif op == 'integer_power':
                value = self.power(visit(a[0]), a[1])
            elif op == 'inverse':
                value = self.inverse(visit(a[0]))
            elif op in UNARY:
                value = self.function(op, visit(a[0]), a[1] if op == 'source_step_derivative' else None)
            elif op == 'opaque_function':
                value = self.put(op, [a[0], [visit(x) for x in a[1]]])
            else:
                raise Stop('Unsupported simultaneous substitution operation: ' + op)
            cache[ident] = value
            return value
        return visit(root)


class OrdinaryDerivative:
    def __init__(self, arena):
        self.g, self.cache = arena, {}

    def d(self, root, variable):
        g, key = self.g, (root, variable)
        if key in self.cache:
            return self.cache[key]
        if variable not in g.dependencies(root):
            result = g.zero
        else:
            op, a = g.nodes[root]['op'], g.nodes[root]['args']
            d = lambda x: self.d(x, variable)
            if op == 'coordinate':
                result = g.one if a[1] == variable else g.zero
            elif op == 'add':
                result = g.add(*(d(x) for x in a))
            elif op == 'multiply':
                result = g.add(*(g.mul(d(x), *(y for j, y in enumerate(a) if j != k)) for k, x in enumerate(a)))
            elif op == 'inverse':
                result = g.neg(g.mul(d(a[0]), g.power(root, 2)))
            elif op == 'integer_power':
                result = g.mul(g.q(a[1]), g.power(a[0], a[1] - 1), d(a[0]))
            elif op == 'exp':
                result = g.mul(root, d(a[0]))
            elif op == 'log_positive':
                result = g.mul(g.inverse(a[0]), d(a[0]))
            elif op == 'sqrt_positive':
                result = g.mul(g.q(Q(1, 2)), g.inverse(root), d(a[0]))
            elif op == 'sine':
                result = g.mul(g.function('cosine', a[0]), d(a[0]))
            elif op == 'cosine':
                result = g.neg(g.mul(g.function('sine', a[0]), d(a[0])))
            elif op == 'source_step_derivative':
                result = g.mul(g.function(op, a[0], a[1] + 1), d(a[0]))
            else:
                raise Stop('Derivative of actual ' + op + ' requires an unproved source class/limit/join/Leibniz lemma')
        self.cache[key] = result
        return result

    def word(self, root, word):
        for variable in word:
            root = self.d(root, variable)
        return root


def partitions(mask):
    """Unordered set partitions: an independent higher chain rule."""
    if not mask:
        yield []
        return
    first = mask & -mask
    rest = mask ^ first
    subset = rest
    while True:
        block = first | subset
        for tail in partitions(rest ^ subset):
            yield [block, *tail]
        if not subset:
            break
        subset = (subset - 1) & rest


class TaylorDerivative:
    """Subset-indexed exact mixed Taylor jets; never calls OrdinaryDerivative."""
    def __init__(self, arena):
        self.g, self.cache = arena, {}

    def unary_derivative(self, root, order):
        g = self.g
        op, a = g.nodes[root]['op'], g.nodes[root]['args']
        x = a[0]
        if op == 'exp':
            return root
        if op == 'inverse':
            return g.mul(g.q((-1) ** order * factorial(order)), g.power(root, order + 1))
        if op == 'integer_power':
            coefficient = 1
            for j in range(order):
                coefficient *= a[1] - j
            return g.mul(g.q(coefficient), g.power(x, a[1] - order))
        if op == 'log_positive':
            return g.mul(g.q((-1) ** (order - 1) * factorial(order - 1)), g.power(x, -order))
        if op == 'sqrt_positive':
            coefficient = Q(1)
            for j in range(1, order):
                coefficient *= 1 - 2 * j
            return g.mul(g.q(coefficient / 2 ** order), g.power(root, 1 - 2 * order))
        if op in {'sine', 'cosine'}:
            cycle = [('sine', 1), ('cosine', 1), ('sine', -1), ('cosine', -1)]
            name, sign = cycle[(order + (1 if op == 'cosine' else 0)) % 4]
            return g.mul(g.q(sign), g.function(name, x))
        if op == 'source_step_derivative':
            return g.function(op, x, a[1] + order)
        raise Stop('Taylor derivative of actual ' + op + ' requires unproved analytic premises')

    def word(self, root, word):
        if len(word) > 4:
            raise Stop('Independent Taylor subset budget supports stored total derivative order at most four')
        g, count = self.g, 1 << len(word)
        cache_key = root, tuple(word)
        if cache_key in self.cache:
            return self.cache[cache_key]
        values = {}
        def jets(ident):
            if ident in values:
                return values[ident]
            node = g.nodes[ident]
            op, a = node['op'], node['args']
            out = [g.zero] * count
            out[0] = ident
            if not any(v in g.dependencies(ident) for v in word):
                values[ident] = out
                return out
            if op == 'coordinate':
                for j, v in enumerate(word):
                    out[1 << j] = g.one if a[1] == v else g.zero
            elif op == 'add':
                children = [jets(x) for x in a]
                for s in range(1, count):
                    out[s] = g.add(*(child[s] for child in children))
            elif op == 'multiply':
                acc = [g.zero] * count
                acc[0] = g.one
                for child in a:
                    right, following = jets(child), []
                    for s in range(count):
                        terms, t = [], s
                        while True:
                            terms.append(g.mul(acc[t], right[s ^ t]))
                            if not t:
                                break
                            t = (t - 1) & s
                        following.append(g.add(*terms))
                    acc = following
                out = acc
            elif op in UNARY:
                child = jets(a[0])
                for s in range(1, count):
                    out[s] = g.add(*(g.mul(self.unary_derivative(ident, len(blocks)),
                                          *(child[block] for block in blocks)) for blocks in partitions(s)))
            else:
                # All inputs of an opaque value were retained. An absent
                # coordinate was handled above; a varying one remains open.
                raise Stop('Independent Taylor backend cannot differentiate varying actual ' + op)
            values[ident] = out
            return out
        result = jets(root)[-1]
        self.cache[cache_key] = result
        return result


class SourceExpander:
    def __init__(self, source, definitions, arena, mode):
        self.source, self.definitions, self.g, self.mode = source, definitions, arena, mode
        self.audit = SourceCalculus(source, definitions, max_work=100000000, max_nodes=300000)
        self.calculus = OrdinaryDerivative(arena) if mode == 'ordinary' else TaylorDerivative(arena)
        self.cache, self.active, self.captures, self.zero_rules = {}, set(), {}, {}
        self.theta_proofs = {}

    def compile_indexed_theta(self, ident, node, binding):
        """Complete finite-row identity; switches ACTUALLY do not vary in theta.

        This also opens zero-order indexed VALUES by their exact declaration.
        No slow-variable derivative and no cross-label gluing rule is used.
        """
        d, g = binding['definition'], self.g
        directions, orders = d.get('directions', []), node['args'][2]
        theta = next((x for x in directions if self.source.get(x, {}).get('args', [None])[0] ==
                      'm3_global_band_angle$6'), None)
        if theta is None or len(d.get('rows', [])) != 162:
            return None
        theta_index = directions.index(theta)
        if any(order and index != theta_index for index, order in enumerate(orders)):
            return None
        proof = {'sourceNode': ident, 'definitionKey': binding['key'],
                 'definitionSHA256': binding['definitionSHA256'], 'formalThetaSourceCoordinate': theta,
                 'storedOrders': orders, 'rowsAttempted': [], 'allOriginalRowsRetained': False,
                 'slowLabelsOrTorusCopiesFrozenByAssumption': False,
                 'globalSourceDomainProved': False,
                 'guardIndicatorIdentity': 'choose(x,l,r,0,f,0)=1_(l<x<r)*f on its ORIGINAL defined domain, including exact zero at both endpoints'}
        self.theta_proofs[ident] = proof
        row_terms = []
        for index, row in enumerate(d['rows']):
            system = row['localSystem']
            if isinstance(system, int):
                key = f'expressionDefinitions:{-1-system}' if system < 0 else f'expression:{system}'
            elif isinstance(system, str) and system.startswith('coupled-expression:'):
                key = f'definitions:0:{int(system.split(":")[1])}'
            elif isinstance(system, str) and system.startswith('forced-expression:'):
                key = f'definitions:4:{int(system.split(":")[1])}'
            else:
                raise Stop('Unreviewed exact indexed local-system binding')
            local_binding = self.definitions.get(key)
            if not local_binding:
                raise Stop('Exact indexed local expression registry absent: ' + key)
            local = local_binding['definition']
            require(local['body'] == row['localBody'] and local['parameters'] == row['localParameters'],
                    'Indexed row local body/parameter binding changed')
            if theta not in local['parameters']:
                raise Stop('Actual local indexed body has no physical-theta parameter')
            local_index = local['parameters'].index(theta)
            require(row['values'][local_index] == theta, 'Indexed local theta actual argument is not identity')
            maps = row['derivativeMaps'][theta_index]
            require(len(maps) == 1 and maps[0]['parameter'] == local_index and
                    self.source[maps[0]['coefficient']] == {'op': 'rational', 'args': ['1', '1']},
                    'Actual indexed theta Jacobian is not the exact identity')
            selector_inputs = [row['coefficient'], *sum(row.get('guards', []), []),
                               *(value for j, value in enumerate(row['values']) if j != local_index)]
            for value in selector_inputs:
                free, unknown = self.audit.source_support(value)
                if unknown or theta in free:
                    raise Stop('Actual indexed coefficient, switch or non-theta argument varies in theta or has incomplete capture')
            local_body = self.compile(local['body'])
            derivative = self.calculus.word(local_body, [theta] * orders[theta_index])
            actuals = [self.compile(value) for value in row['values']]
            applied = g.substitute(derivative, dict(zip(local['parameters'], actuals)))
            term = g.mul(self.compile(row['coefficient']), applied)
            for guard in row.get('guards', []):
                require(len(guard) == 3, 'Unreviewed indexed source guard shape')
                arguments = [self.compile(value) for value in guard]
                indicator = g.put('opaque_function', [{'kind': 'exact_source_open_interval_indicator',
                                                       'sourceGuard': guard, 'range': [0, 1],
                                                       'idempotentPointwise': True}, arguments])
                term = g.mul(indicator, term)
            row_terms.append(term)
            proof['rowsAttempted'].append({'row': index, 'localDefinitionKey': key,
                'localDefinitionSHA256': local_binding['definitionSHA256'],
                'allOriginalSwitchesAndOtherArgumentsThetaIndependent': True,
                'exactLocalThetaArgumentAndJacobian': True})
        formal_field = g.add(*row_terms)
        arguments = [self.compile(value) for value in node['args'][1]]
        result = g.substitute(formal_field, dict(zip(d['parameters'], arguments)))
        proof.update(allOriginalRowsRetained=True, originalRows=len(row_terms), formulaRoot=result,
                     provedOnOriginalLeafDefinedDomain=True)
        return result

    def compile(self, ident):
        if ident in self.cache:
            return self.cache[ident]
        if ident in self.active:
            raise Stop('Recursive exact source definition requires independent existence/uniqueness proof')
        if len(self.active) > 900:
            raise Stop('Source-body depth budget 900 reached')
        self.active.add(ident)
        try:
            result = self._compile(ident)
            self.cache[ident] = result
            return result
        finally:
            self.active.discard(ident)

    def _compile(self, ident):
        g, n = self.g, self.source.get(ident)
        if n is None:
            raise Stop('Exact original source node unavailable in pinned checkpoint/prefix: ' + str(ident))
        op, a = n['op'], n['args']
        if op == 'rational':
            return g.q(Q(*map(int, a)))
        if op in {'coordinate', 'source_parameter'}:
            return g.put(op, [a[0], ident])
        if op in {'add', 'multiply'}:
            return g.operation(op, [self.compile(x) for x in a])
        if op == 'inverse':
            return g.inverse(self.compile(a[0]))
        if op == 'integer_power':
            return g.power(self.compile(a[0]), a[1])
        if op in UNARY:
            return g.function(op, self.compile(a[0]), a[1] if op == 'source_step_derivative' else None)
        if op in REGISTERED_OPS:
            audit = self.audit.capture_audit(ident)
            self.captures[ident] = audit
            if not audit['pass']:
                raise Stop('Original registry capture/tuple audit remains open: ' + str(audit))
            binding = self.definitions[definition_key(n)]
            d = binding['definition']
            if op in EXPRESSION_OPS:
                word = [p for p, order in zip(d['parameters'], a[2]) for _ in range(order)]
                # This exact source-level lemma never substitutes unrelated
                # Cartesian request/result IDs into the numerator basis.
                if word and word[0] not in audit['formalBodyFreeCoordinates']:
                    self.zero_rules[ident] = {'sourceNode': ident, 'nodeSHA256': js_hash(n),
                        'definitionKey': binding['key'], 'definitionSHA256': binding['definitionSHA256'],
                        'firstStoredDirection': word[0], 'completeStoredWord': word,
                        'formalBodyFreeCoordinates': audit['formalBodyFreeCoordinates'],
                        'captureAudit': audit, 'proof': 'The FIRST original stored derivative is in an absent formal coordinate. The exact defining body is constant in that coordinate on its defined open domain; its derivative and every later derivative of zero equal zero.',
                        'globalOriginalSourceExistenceProved': False}
                    return g.zero
                if len(word) > 4:
                    raise Stop('Stored source partial order exceeds independent four-letter Taylor proof budget')
                body = self.compile(d['body'])
                derivative = self.calculus.word(body, word)
                values = [self.compile(value) for value in a[1]]
                return g.substitute(derivative, dict(zip(d['parameters'], values)))
            if 'indexed' in op:
                theta_expansion = self.compile_indexed_theta(ident, n, binding)
                if theta_expansion is not None:
                    return theta_expansion
            values = [self.compile(value) for value in a[1]]
            descriptor = {'kind': 'actual_complete_registered_leaf', 'sourceOperation': op,
                          'definitionKey': binding['key'], 'definitionSHA256': binding['definitionSHA256'],
                          'storedDerivativeOrders': a[2], 'parameters': d['parameters'],
                          'directions': d.get('directions', d['parameters']),
                          'analyticDerivativeOrGlobalIndexedJoinProved': False}
            return g.put('opaque_function', [descriptor, values])
        # Exact limit/implicit/integral/piecewise VALUES may be constant in a
        # direction. A complete independently audited free-coordinate tuple
        # is retained; differentiating a varying value is an explicit stop.
        free, unknown = self.audit.source_support(ident)
        if unknown:
            raise Stop('Source-value capture/support incomplete: ' + '; '.join(map(str, sorted(unknown))))
        descriptor = {'kind': 'actual_unexpanded_source_value', 'sourceNode': ident,
                      'nodeSHA256': js_hash(n), 'sourceOperation': op,
                      'allOriginalFreeCoordinates': sorted(free), 'analyticDerivativeProved': False}
        return g.put('opaque_function', [descriptor, [self.compile(x) for x in sorted(free)]])


def load_inputs(context, component):
    baseline = Path(context['baseline'])
    p = baseline / 'rational' / f'pde_component_{component}.json'
    cp = baseline / 'checkpoints/cartesian-source-checkpoint.json'
    raw, cpraw = p.read_bytes(), cp.read_bytes()
    prior, checkpoint = json.loads(raw), json.loads(cpraw)
    require(prior['component'] == component and prior['directSourceRoot'] == DIRECT[component]
            and prior['assembledSourceRoot'] == ASSEMBLED[component], 'Original PDE source root binding changed')
    terms = [{'monomial': r['monomial'], 'coefficient': r['coefficient']} for r in prior['reducedNumeratorTerms']]
    require(len(terms) == COUNTS[component], 'Original residual monomial frontier changed')
    nodes = {}
    for w in checkpoint['sourceWitnesses']:
        require(js_hash(w['node']) == w['nodeSHA256'], 'Original source witness hash changed')
        require(w['sourceNode'] not in nodes or nodes[w['sourceNode']] == w['node'], 'Conflicting source witness')
        nodes[w['sourceNode']] = w['node']
    definitions = {d['key']: d for d in checkpoint['definitionBindings']}
    for d in definitions.values():
        require(js_hash(d['definition']) == d['definitionSHA256'], 'Original registry definition changed')
    lock = read(Path(context['repo']) / 'research-ide/mathscope-m3/n6-unconditional-20261014/INPUT_LOCK.json')
    require(lock['originalSourceNodesSHA256'] == PARENT, 'Original 3892594-node parent binding changed')
    prototype = 'research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs'
    require(sha((Path(context['repo']) / prototype).read_bytes()) == lock['protectedSources'][prototype],
            'Original flat-step source producer changed')
    lemma = step_lemma()  # New mathematical proof recomputed; no saved PASS input.
    return prior, terms, VerifiedSourceStore(nodes, context), definitions, {
        'priorComponentSHA256': sha(raw), 'sourceCheckpointSHA256': sha(cpraw),
        'originalSourceNodesSHA256': PARENT, 'parentNodes': 3892594,
        'stepAllOrderLemma': lemma, 'sourcePrototypeSHA256': lock['protectedSources'][prototype]}


def build_component(terms, source, definitions, per_atom_seconds=6, max_nodes=350000):
    arena = Arena(max_nodes)
    primary = SourceExpander(source, definitions, arena, 'ordinary')
    independent = SourceExpander(source, definitions, arena, 'taylor')
    factors = sorted({i for term in terms for i, _ in decode(term['monomial'])})
    bindings, attempts = {}, []
    fallbacks = {}
    overall_deadline = time.monotonic() + 240
    for sid in factors:
        original = source.get(sid)
        require(original is not None, 'An ORIGINAL residual factor witness is absent')
        fallbacks[sid] = arena.put('opaque_function', [{'kind': 'preserved_original_residual_atom',
                                  'sourceNode': sid, 'nodeSHA256': js_hash(original)}, []])
    arena.max_nodes = max_nodes - 25000
    for sid in factors:
        original = source.get(sid)
        fallback = fallbacks[sid]
        started = time.monotonic()
        atom_seconds = max(per_atom_seconds, 30) if 'indexed' in original['op'] else per_atom_seconds
        arena.deadline = min(started + atom_seconds, overall_deadline)
        primary.audit.deadline = arena.deadline
        independent.audit.deadline = arena.deadline
        try:
            left = primary.compile(sid)
            right = independent.compile(sid)
            status, reason = 'SOURCE_BODY_DERIVED_WITH_TWO_INDEPENDENT_CALCULI', None
        except (ValueError, BudgetStop, KeyError, RecursionError) as error:
            left = right = fallback
            status, reason = 'UNRESOLVED_ORIGINAL_ATOM_RETAINED', f'{type(error).__name__}: {error}'
        arena.deadline = float('inf')
        bindings[sid] = left, right
        attempts.append({'sourceNode': sid, 'actualNode': original, 'nodeSHA256': js_hash(original),
                         'definitionKey': definition_key(original), 'status': status, 'reason': reason,
                         'primaryRoot': left, 'independentTaylorRoot': right,
                         'sourceAtomProvedZeroOnOriginalLeafDefinedDomain': left == arena.zero and not reason,
                         'literalSourceZeroRule': primary.zero_rules.get(sid),
                         'completeIndexedThetaFiberProof': primary.theta_proofs.get(sid),
                         'captureAudit': primary.captures.get(sid), 'elapsedSeconds': time.monotonic() - started})
    arena.max_nodes = max_nodes
    original_ledger, primary_terms, independent_terms = [], [], []
    for index, term in enumerate(terms):
        powers = decode(term['monomial'])
        left = arena.mul(arena.q(Q(term['coefficient'])), *(arena.power(bindings[s][0], p) for s, p in powers))
        right = arena.mul(arena.q(Q(term['coefficient'])), *(arena.power(bindings[s][1], p) for s, p in powers))
        primary_terms.append(left)
        independent_terms.append(right)
        original_ledger.append({'inputTermIndex': index, 'original': term, 'originalSHA256': js_hash(term),
                                'primaryTermRoot': left, 'independentTermRoot': right,
                                'originalTermZeroOnLeafDefinedDomain': left == arena.zero,
                                'sourceFactorBindings': [{'sourceNode': s, 'power': p,
                                                         'primaryRoot': bindings[s][0], 'independentRoot': bindings[s][1]}
                                                        for s, p in powers]})
    left, right = arena.add(*primary_terms), arena.add(*independent_terms)
    comparison = arena.add(left, arena.neg(right))
    return {'schema': 'MathScope.N6.SourceRegisteredPDEBodyExpansion/1', 'nodes': arena.nodes,
            'primaryResidualRoot': left, 'independentTaylorResidualRoot': right,
            'twoCalculiDifferenceRoot': comparison, 'atomAttempts': attempts,
            'allOriginalTerms': original_ledger,
            'allOriginalSourceTermsPreserved': True,
            'calculusOrder': 'stored derivatives in original parameter order BEFORE simultaneous actual argument application',
            'originalAnalyticEqualityProved': False}


def run(context, out, component=0):
    sys.setrecursionlimit(max(sys.getrecursionlimit(), 10000))
    started, out = time.monotonic(), Path(out)
    out.mkdir(parents=True, exist_ok=True)
    prior, terms, source, definitions, pins = load_inputs(context, component)
    try:
        evidence = build_component(terms, source, definitions)
        evidence['sourceBindings'] = pins
        evidence['sourcePrefix'] = source.evidence()
        evidence['originalComponent'] = component
        evidence['originalRoots'] = {'direct': DIRECT[component], 'assembled': ASSEMBLED[component]}
        circuit = out / f'pde-solve-component-{component}-circuit.json'
        save(circuit, evidence)
        command = ['node', '--disable-wasm-trap-handler', '--max-old-space-size=2048',
                   str(Path(__file__).with_name('pde_verify.mjs')), '--input', str(circuit),
                   '--output', str(out / f'pde-solve-component-{component}-algebra.json'),
                   '--repo', str(context['repo'])]
        process = subprocess.run(command, capture_output=True, text=True, encoding='utf8', timeout=420)
        (out / f'pde-solve-component-{component}-algebra.log').write_text(process.stdout + process.stderr, encoding='utf8')
        algebra_path = out / f'pde-solve-component-{component}-algebra.json'
        algebra = read(algebra_path) if algebra_path.is_file() else {'status': 'EXACT_ALGEBRA_RESOURCE_OR_RUNTIME_STOP',
                                                                  'stop': process.stderr[-4000:], 'verified': False}
        from pde_solve_verify import verify_original_coverage, negative_source_controls
        coverage = verify_original_coverage(terms, evidence)
        controls = negative_source_controls(terms, evidence)
        result = {'schema': 'MathScope.N6.DedicatedOriginalPDESolve/1', 'component': component,
            'status': 'ALL_ORIGINAL_TERMS_ATTEMPTED_REGISTERED_BODY_CALCULUS_ANALYTIC_GLOBAL_PDE_OPEN',
            'originalSourceRoots': evidence['originalRoots'], 'sourceParentSHA256': PARENT,
            'attemptedOriginalTerms': len(terms), 'originalNumeratorTerms': len(terms),
            'normalizedConditionalTerms': algebra.get('normalizedNumeratorTerms', len(terms)),
            'strictSourceAtomsProvedZeroOnLeafDefinedDomain': sum(a['sourceAtomProvedZeroOnOriginalLeafDefinedDomain'] for a in evidence['atomAttempts']),
            'originalTermsZeroOnLeafDefinedDomain': sum(r['originalTermZeroOnLeafDefinedDomain'] for r in evidence['allOriginalTerms']),
            'atomAttempts': len(evidence['atomAttempts']),
            'derivedAtoms': sum(a['status'] == 'SOURCE_BODY_DERIVED_WITH_TWO_INDEPENDENT_CALCULI' for a in evidence['atomAttempts']),
            'unresolvedAtomsRetained': sum(bool(a['reason']) for a in evidence['atomAttempts']),
            'analyticallyDischargedTerms': 0, 'originalAnalyticEqualityProved': False,
            'wholeIndependentCartesianPDEProved': False, 'originalTermCoverageVerifier': coverage,
            'independentDerivativeAndAlgebraVerifier': algebra, 'negativeSourceControls': controls,
            'allRemainingMonomials': f'pde-solve-component-{component}-algebra.json',
            'allOriginalMonomialsAndFailedAttempts': circuit.name,
            'sourceBindings': pins, 'sourcePrefixReceipt': {k: v for k, v in source.evidence().items() if k != 'loadedSourceWitnesses'},
            'remainingReasons': dict(Counter(a['reason'] for a in evidence['atomAttempts'] if a['reason'])),
            'proofBoundary': {'originalGlobalDomainGuardsDischarged': False,
                'sourceStoredDerivativeOraclesUsed': False, 'unprovedDerivativeAtomsReplacedByZero': False,
                'Cartesian128ZeroRequestIDsSubstitutedIntoDifferentSourceBasis': False,
                'globalWMSClassesSupportMomentsAndDefinedErrorEnclosureProved': False,
                'originalN601Complete': False, 'originalN602Complete': False, 'original56Of64Changed': False},
            'elapsedSeconds': time.monotonic() - started}
        save(out / f'pde-solve-component-{component}-result.json', result)
        print(json.dumps({k: result[k] for k in ['component', 'attemptedOriginalTerms', 'normalizedConditionalTerms',
              'strictSourceAtomsProvedZeroOnLeafDefinedDomain', 'derivedAtoms', 'unresolvedAtomsRetained',
              'analyticallyDischargedTerms', 'originalAnalyticEqualityProved']}))
        return result
    finally:
        if source.db is not None:
            source.db.close()
