"""Source-bound downward range analysis of the complete Picard coefficient DAG.

All retained lazy branches are visited unless their interval is proved empty.
Unsupported inequalities or domains fail closed.  Core analytic input facts
are delegated explicitly to the independently reviewed natural Banach theorem.
"""
from __future__ import annotations
import argparse
from collections import Counter
from fractions import Fraction as Q
from functools import lru_cache
import hashlib
import json
import os
from pathlib import Path

from native_domain_extract import argument_children, require, sha
from natural_domain_proof import (PIN, FIXED_PIN, RAW_DIAGNOSTIC_PIN, CALL_INVENTORY_PIN, TAU_UPPER, LIMIT, rat, parts,
                                  multiply, positive_source_expression, numerical_upper,
                                  source_parameter_proof)


class Unproved(ValueError):
    pass


def plus(*items):
    co = Counter()
    for item in items:
        expanded = item[1] if item[0] == 'add' else (item,)
        for term in expanded:
            c, factors = parts(term)
            base = multiply(('mul', '1', tuple(sorted(factors.items(), key=repr)))) if factors else rat(1)
            co[base] += c
    result = [multiply(rat(c), base) for base, c in co.items() if c]
    return rat(0) if not result else result[0] if len(result) == 1 else ('add', tuple(sorted(result, key=repr)))


def pw(value, exponent):
    if not exponent:
        return rat(1)
    if value[0] == 'sqrt' and exponent % 2 == 0:
        return pw(value[1], exponent // 2)
    if value[0] == 'exp':
        return ex(multiply(rat(exponent), value[1]))
    c, factors = parts(value)
    if not c and exponent < 0:
        raise Unproved('Inverse at a zero endpoint')
    return multiply(rat(c**exponent), *(('mul', '1', ((x, n * exponent),)) for x, n in factors.items()))


def ex(value):
    if value == rat(0):
        return rat(1)
    if value[0] == 'log':
        return value[1]
    if value[0] == 'add':
        return multiply(*(ex(x) for x in value[1]))
    c, factors = parts(value)
    if c.denominator == 1 and len(factors) == 1:
        (factor, exponent), = factors.items()
        if factor[0] == 'log' and exponent == 1:
            return pw(factor[1], int(c))
    return ('exp', value)


def lg(value):
    if value == rat(1):
        return rat(0)
    if value[0] == 'exp':
        return value[1]
    if value[0] == 'sqrt':
        return multiply(rat(Q(1, 2)), lg(value[1]))
    if value[0] == 'q':
        number = Q(value[1])
        if number <= 0:
            raise Unproved('Logarithm of nonpositive rational')
        numerator, denominator = number.numerator, number.denominator
        power_two = 0
        while numerator % 2 == 0:
            numerator //= 2
            power_two += 1
        while denominator % 2 == 0:
            denominator //= 2
            power_two -= 1
        if numerator == denominator == 1:
            return multiply(rat(power_two), ('log', rat(2)))
    if value[0] == 'mul':
        c, factors = parts(value)
        if c <= 0:
            raise Unproved('Logarithm normalization needs positive factors')
        return plus(lg(rat(c)), *(multiply(rat(n), lg(x)) for x, n in factors.items()))
    return ('log', value)


def sq(value):
    return rat(0) if value == rat(0) else ('sqrt', value)


def intrinsic_nonnegative(value):
    if value[0] == 'q':
        return Q(value[1]) >= 0
    if value[0] in {'parameter', 'exp', 'sqrt'}:
        return True
    if value[0] == 'mul':
        return Q(value[1]) >= 0 and all(n % 2 == 0 or intrinsic_nonnegative(x) for x, n in value[2])
    if value[0] == 'add':
        return all(intrinsic_nonnegative(x) for x in value[1])
    return False


def intrinsic_positive(value):
    if value[0] == 'q':
        return Q(value[1]) > 0
    if value[0] == 'parameter':
        return value[1] in {'Lambda', 't1', 'Xa', 'T', 'BOuter', 'lambda', 'h', 'Pstar', 'Tf', 'co', 'j0', 'sigmaStar', 'CSelected'}
    if value[0] == 'exp':
        return True
    if value[0] == 'sqrt':
        return intrinsic_positive(value[1])
    if value[0] == 'mul':
        return Q(value[1]) > 0 and all(intrinsic_positive(x) for x, _ in value[2])
    return False


def upper_small(value):
    if value[0] == 'q':
        return Q(value[1])
    if value == ('parameter', 't1'):
        return TAU_UPPER
    if value[0] == 'add':
        numbers = [upper_small(x) for x in value[1]]
        return sum(numbers, Q(0)) if all(x is not None for x in numbers) else None
    if value[0] == 'mul':
        c, factors = parts(value)
        if c < 0:
            return None
        for factor, n in factors.items():
            number = upper_small(factor)
            if n < 0 or number is None or number < 0:
                return None
            c *= number**n
        return c
    if value[0] == 'exp':
        number = upper_small(value[1])
        if number is not None and number < 1:
            return Q(1) if number <= 0 else Q(1) / (1 - number)
    return None


def tau_linear(value):
    """Return exact c+d*t1; no other expression is assigned a number."""
    if value[0] == 'q':
        return Q(value[1]), Q(0)
    if value == ('parameter', 't1'):
        return Q(0), Q(1)
    if value[0] == 'add':
        values = [tau_linear(x) for x in value[1]]
        if all(v is not None for v in values):
            return sum((v[0] for v in values), Q(0)), sum((v[1] for v in values), Q(0))
    if value[0] == 'mul':
        c, factors = parts(value)
        if factors == {('parameter', 't1'): 1}:
            return Q(0), c
    return None


def compare(left, right):
    """Return -1/0/1 for a proved order; otherwise fail rather than guess."""
    if left == right:
        return 0
    delta = plus(left, multiply(rat(-1), right))
    linear = tau_linear(delta)
    if linear is not None:
        c, d = linear
        lo, hi = sorted((c, c + d * TAU_UPPER))
        if lo >= 0 and (lo > 0 or d > 0):
            return 1
        if hi <= 0 and (hi < 0 or d < 0):
            return -1
    if left == rat(0) and intrinsic_positive(right):
        return -1
    if right == rat(0) and intrinsic_positive(left):
        return 1
    if left[0] == right[0] == 'sqrt':
        return compare(left[1], right[1])
    if left[0] == right[0] == 'log':
        return compare(left[1], right[1])
    if intrinsic_positive(left) and intrinsic_positive(right):
        ratio = multiply(left, pw(right, -1))
        upper = upper_small(ratio)
        inverse_upper = upper_small(multiply(right, pw(left, -1)))
        if upper is not None and upper < 1:
            return -1
        if inverse_upper is not None and inverse_upper < 1:
            return 1
        if ratio[0] == 'exp':
            return compare(ratio[1], rat(0))
        c, factors = parts(ratio)
        if c == 1 and factors and all(x[0] == 'exp' for x in factors):
            exponent = plus(*(multiply(rat(n), x[1]) for x, n in factors.items()))
            return compare(exponent, rat(0))
    raise Unproved('Exact order not covered: ' + repr((left, right)))


def minimum(values):
    result = values[0]
    for value in values[1:]:
        if compare(value, result) < 0:
            result = value
    return result


def maximum(values):
    result = values[0]
    for value in values[1:]:
        if compare(value, result) > 0:
            result = value
    return result


class RadialNormal:
    def __init__(self, nodes):
        self.nodes = nodes

    @lru_cache(None)
    def at(self, ident):
        op, a = self.nodes[ident]['op'], self.nodes[ident]['args']
        if op == 'rational':
            return rat(Q(*map(int, a)))
        if op == 'source_parameter':
            name = a[0]
            if name == 'Xa':
                return multiply(rat(4), pw(('parameter', 'Lambda'), -1))
            if name in {'omega1', 'omega2', 'kappa0'}:
                return ('parameter', 't1')
            return ('parameter', name)
        if op == 'coordinate':
            return ('coordinate', ident)
        if op == 'add':
            return plus(*(self.at(x) for x in a))
        if op == 'multiply':
            return multiply(*(self.at(x) for x in a))
        if op == 'integer_power':
            return pw(self.at(a[0]), a[1])
        if op == 'inverse':
            return pw(self.at(a[0]), -1)
        if op == 'exp':
            return ex(self.at(a[0]))
        if op == 'log_positive':
            return lg(self.at(a[0]))
        if op == 'sqrt_positive':
            return sq(self.at(a[0]))
        raise Unproved('Unsupported radial expression ' + op + ' at ' + str(ident))


def multiply_intervals(first, second):
    if first[0] == first[1] and second[0] == second[1]:
        value = multiply(first[0], second[0])
        return value, value
    if first[0] == first[1]:
        if intrinsic_positive(first[0]) or first[0] == rat(0):
            return multiply(first[0], second[0]), multiply(first[0], second[1])
        if first[0][0] == 'q' and Q(first[0][1]) < 0:
            return multiply(first[0], second[1]), multiply(first[0], second[0])
    if second[0] == second[1]:
        return multiply_intervals(second, first)
    products = [multiply(x, y) for x in first for y in second]
    return minimum(products), maximum(products)


def interval(value, env):
    if value in env:
        return env[value]
    # Exact proportional selector constraints apply even after multiplication
    # flattening removes the selector as an immediate expression subtree.
    for selector, limits in env.items():
        if selector[0] in {'coordinate', 'mul'} and value[0] == 'mul':
            coefficient = multiply(value, pw(selector, -1))
            if intrinsic_positive(coefficient) and not contains_coordinate(coefficient):
                return multiply(coefficient, limits[0]), multiply(coefficient, limits[1])
    kind = value[0]
    if kind in {'q', 'parameter'}:
        return value, value
    if kind == 'coordinate':
        raise Unproved('Unbound radial coordinate ' + str(value[1]))
    if kind == 'add':
        intervals = [interval(x, env) for x in value[1]]
        return plus(*(x[0] for x in intervals)), plus(*(x[1] for x in intervals))
    if kind == 'mul':
        c, factors = parts(value)
        result = (rat(c), rat(c))
        for base, exponent in factors.items():
            lo, hi = interval(base, env)
            if exponent == 1:
                powered = (lo, hi)
            elif compare(lo, rat(0)) >= 0:
                if exponent < 0 and compare(lo, rat(0)) <= 0:
                    raise Unproved('Inverse interval includes zero')
                powered = (pw(lo, exponent), pw(hi, exponent)) if exponent >= 0 else (pw(hi, exponent), pw(lo, exponent))
            elif compare(hi, rat(0)) <= 0 and exponent > 0:
                candidates = [pw(lo, exponent), pw(hi, exponent)]
                powered = (minimum(candidates), maximum(candidates))
            else:
                raise Unproved('Signed radial power needs an explicit interval rule')
            result = multiply_intervals(result, powered)
        return result
    if kind == 'exp':
        lo, hi = interval(value[1], env)
        return ex(lo), ex(hi)
    if kind == 'log':
        lo, hi = interval(value[1], env)
        if compare(lo, rat(0)) <= 0:
            raise Unproved('Logarithm interval is not strictly positive')
        return lg(lo), lg(hi)
    if kind == 'sqrt':
        lo, hi = interval(value[1], env)
        if compare(lo, rat(0)) < 0:
            raise Unproved('Square root interval is negative')
        return sq(lo), sq(hi)
    raise Unproved('Unknown interval expression ' + kind)


def contains_coordinate(value):
    if value[0] == 'coordinate':
        return True
    if value[0] == 'mul':
        return any(contains_coordinate(x) for x, _ in value[2])
    if value[0] == 'add':
        return any(contains_coordinate(x) for x in value[1])
    if value[0] in {'log', 'exp', 'sqrt'}:
        return contains_coordinate(value[1])
    return False


def constrain(env, selector, lo, hi):
    result = dict(env)
    if selector in result:
        lo = maximum([lo, result[selector][0]])
        hi = minimum([hi, result[selector][1]])
    if compare(lo, hi) > 0:
        return None
    result[selector] = (lo, hi)
    c, factors = parts(selector)
    variable = [(base, exponent) for base, exponent in factors.items() if base[0] == 'coordinate']
    if len(variable) == 1:
        base, exponent = variable[0]
        coefficient = multiply(selector, pw(base, -exponent))
        if intrinsic_positive(coefficient) and not contains_coordinate(coefficient) and exponent in (1, 2):
            low = multiply(lo, pw(coefficient, -1))
            high = multiply(hi, pw(coefficient, -1))
            if exponent == 1:
                result[base] = (low, high)
            elif base in env and compare(env[base][0], rat(0)) >= 0 and compare(low, rat(0)) >= 0:
                result[base] = (maximum([env[base][0], sq(low)]), minimum([env[base][1], sq(high)]))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=Path(__file__).resolve().parent / 'native-result-small')
    parser.add_argument('--diagnostics', type=Path, help='Original authenticated raw native-domain diagnostics; exact whole-file hash is required.')
    parser.add_argument('--kernel-binding', type=Path, default=Path(__file__).resolve().parent / 'native-latest-small' / 'ACTUAL_NATURAL_KERNEL_BINDING.json')
    parser.add_argument('--majorant', type=Path, default=Path(__file__).resolve().parent / 'native-latest-small' / 'ACTUAL_NATURAL_MAJORANT.json')
    parser.add_argument('--out', type=Path, default=Path(__file__).with_suffix('.json'))
    args = parser.parse_args()
    data = {}
    if args.diagnostics:
        raw = args.diagnostics.read_bytes()
        require(hashlib.sha256(raw).hexdigest() == RAW_DIAGNOSTIC_PIN, 'Changed original raw diagnostics')
        diagnostics = json.loads(raw)
        data = {'NATIVE_PAYLOADS.json': diagnostics,
                'NATURAL_CALLS.json': diagnostics,
                'NATURAL_ARGUMENT_GRAPH.json': diagnostics}
        calls = diagnostics['naturalCalls']
        require(len(calls) == 533 and sha([(row['id'], row['nodeSHA256']) for row in calls]) == CALL_INVENTORY_PIN, 'Changed actual all-533 call inventory')
        require(diagnostics['conservativeCapture']['sourceNodes'] == 136186 and diagnostics['conservativeCapture']['registryDefinitions'] == 84, 'Changed actual complete g capture')
        input_binding = {'rawDiagnosticsSHA256': RAW_DIAGNOSTIC_PIN}
    else:
        for name, pin in PIN.items():
            raw = (args.input / name).read_bytes()
            require(hashlib.sha256(raw).hexdigest() == pin, 'Changed original projection ' + name)
            data[name] = json.loads(raw)
        input_binding = PIN
    analytic_bindings = {}
    for name, path, pin in [('kernelBinding', args.kernel_binding, 'c422952afe5886b5c2b873550a40fa756696f8502f11c27f2629687a4a7d943d'),
                             ('naturalMajorant', args.majorant, '4b94c652630c250f883622601d1d9d4998c412927fe3bc4352ba5e8c70e2fe3d')]:
        raw = path.read_bytes()
        require(hashlib.sha256(raw).hexdigest() == pin, 'Changed actual analytic source evidence: ' + name)
        analytic_bindings[name] = {'sha256': pin, 'evidence': json.loads(raw)}
    payload = data['NATIVE_PAYLOADS.json']
    fixed, system = payload['fullNativePayloads']['fixed'], payload['fullNativePayloads']['picard:0']
    require(sha(fixed) == FIXED_PIN and sha(system) == 'c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60', 'Changed actual native definitions')
    parameter_proof = source_parameter_proof(fixed)
    params = fixed['source']['parametersExactExpressions']
    require(all(params[name] == {'ref': 't1'} for name in ('omega1', 'omega2', 'kappa0')), 'Changed radial source alias')
    nodes = {int(key): value for key, value in data['NATURAL_ARGUMENT_GRAPH.json']['argumentAndContextGraph'].items()}
    normal = RadialNormal(nodes)
    roots = sorted(set(system['forcing'] + [x for key in ('A0', 'A1') for row in system[key] for x in row]))
    @lru_cache(None)
    def has_natural(ident):
        if nodes[ident]['op'] == 'actual_natural_series':
            return True
        return any(has_natural(child) for child in argument_children(nodes[ident]))
    @lru_cache(None)
    def closure(ident):
        result = {ident}
        for child in argument_children(nodes[ident]):
            result.update(closure(child))
        return frozenset(result)
    seen = set().union(*(closure(root) for root in roots))
    potential = {ident for ident in seen if nodes[ident]['op'] == 'actual_natural_series'}
    require(len(seen) == 3679 and len(potential) == 157, 'Actual Picard coefficient closure changed')
    xi = ('coordinate', system['xi'])
    a_squared = normal.at(system['radialDomain'][1]['args'][0]) if isinstance(system['radialDomain'][1], dict) else normal.at(nodes[system['radialDomain'][1]]['args'][0])
    expected_a_squared = multiply(normal.at(3617), ex(multiply(rat(Q(1, 16)), ('parameter', 't1'))))
    require(a_squared == expected_a_squared, 'Original Picard radial endpoint changed')
    initial = {xi: (rat(0), sq(a_squared)), pw(xi, 2): (rat(0), a_squared)}
    successes, skipped, failures, memo = [], [], [], set()
    def walk(ident, env, path):
        key = ident, tuple(sorted(env.items(), key=repr))
        if key in memo:
            return
        memo.add(key)
        require(len(memo) < 250000, 'Downward proof state budget exceeded')
        node = nodes[ident]
        op, a = node['op'], node['args']
        if not has_natural(ident):
            return
        try:
            if op == 'actual_natural_series':
                lo, hi = interval(normal.at(a[1]), env)
                require(compare(lo, rat(0)) >= 0 and compare(hi, rat(LIMIT)) < 0, 'Natural radial interval outside proved rectangle')
                require(a[2] == 2, 'Changed native eta argument')
                successes.append({'call': ident, 'node': node, 'YInterval': [lo, hi], 'path': path,
                                  'etaScope': 'Original coefficient parameter eta2 on the proved common delta tube; no eta substitution occurs in this complete ordinary DAG.'})
            elif op == 'smooth_piecewise':
                selector = normal.at(a[0])
                lower, upper = interval(selector, env)
                left, right = normal.at(a[1]), normal.at(a[2])
                branches = [(3, lower, minimum([upper, left])),
                            (4, maximum([lower, left]), minimum([upper, right])),
                            (5, maximum([lower, right]), upper)]
                for position, lo, hi in branches:
                    if not has_natural(a[position]):
                        continue
                    if compare(lo, hi) > 0:
                        skipped.append({'guard': ident, 'branchPosition': position, 'emptyInterval': [lo, hi], 'path': path,
                                        'suppressedNaturalCalls': sorted(potential & closure(a[position]))})
                        continue
                    branch = constrain(env, selector, lo, hi)
                    if branch is None:
                        skipped.append({'guard': ident, 'branchPosition': position, 'emptyInterval': [lo, hi], 'path': path,
                                        'suppressedNaturalCalls': sorted(potential & closure(a[position]))})
                    else:
                        walk(a[position], branch, path + [ident])
            elif op == 'definite_integral':
                body, binder, left, right = a
                left_interval = interval(normal.at(left), env)
                right_interval = interval(normal.at(right), env)
                lo = minimum([left_interval[0], right_interval[0]])
                hi = maximum([left_interval[1], right_interval[1]])
                bound = dict(env)
                bound[('coordinate', binder)] = (lo, hi)
                walk(body, bound, path + [ident])
                if has_natural(left):
                    walk(left, env, path + [ident])
                if has_natural(right):
                    walk(right, env, path + [ident])
            else:
                for child in argument_children(node):
                    walk(child, env, path)
        except (Unproved, ValueError, KeyError, ZeroDivisionError) as error:
            failures.append({'node': ident, 'operation': op, 'path': path, 'reason': str(error)})
    for root in roots:
        walk(root, initial, [])
    proved_ids = {row['call'] for row in successes}
    suppressed_ids = set().union(*(set(row['suppressedNaturalCalls']) for row in skipped))
    require(potential <= proved_ids | suppressed_ids, 'Potential natural call is neither reached nor behind a proved empty branch')
    # A separate pass checks primitive evaluation domains.  The only opaque
    # atoms are exact source exports covered by the source-rebound analytic
    # core theorem; their actual IDs come from the pinned fixed registry.
    core = fixed['core']
    eta_atom_keys = ('A', 'D', 'd', 'L', 'Ustar', 'Hstar', 'Wstar', 'Zstar',
                     'chi', 'zeta', 'psi', 'g', 'gSquared', 'P0', 'P0OverPstarSquared')
    eta_atoms = {core[name]: name for name in eta_atom_keys if core[name] in seen}
    positive_eta_atoms = {core[name] for name in ('g', 'gSquared', 'L')}
    require(nodes[16] == {'op': 'add', 'args': [1, 15]} and
            nodes[15] == {'op': 'integer_power', 'args': [2, 2]} and
            nodes[17] == {'op': 'inverse', 'args': [16]}, 'Changed actual elementary eta pole expressions')
    require(nodes[3470] == {'op': 'add', 'args': [3468, 3469]} and
            nodes[3468] == {'op': 'integer_power', 'args': [core['Hstar'], 2]} and
            nodes[3469] == {'op': 'integer_power', 'args': [core['sigmaStar'], 2]}, 'Changed actual Hstar pole denominator')
    eta_pole_contracts = {
        16: 'Re(1+eta^2)>1-(1/16)^2>0 on |Im eta|<1/16; hence its reciprocal and principal logarithm are holomorphic.',
        17: 'The reciprocal of a complex number with positive real part also has positive real part.',
        3470: 'Hstar=(1/2-h)eta+(1-eta^2)(j0+4eta). On |eta|<2, |Hstar prime|<64. The source tube radius sigma^2/2048 changes Hstar from its real value by <sigma/32. Each factor Hstar +/- i sigma therefore has modulus >31 sigma/32.',
    }
    primitive_checked, primitive_failures, primitive_memo, interface_ledger = [], [], set(), []
    def branches_for(a, env):
        selector = normal.at(a[0])
        lower, upper = interval(selector, env)
        left, right = normal.at(a[1]), normal.at(a[2])
        rows = [(3, lower, minimum([upper, left])),
                (4, maximum([lower, left]), minimum([upper, right])),
                (5, maximum([lower, right]), upper)]
        for position, lo, hi in rows:
            if compare(lo, hi) <= 0:
                branch = constrain(env, selector, lo, hi)
                if branch is not None:
                    yield a[position], branch
    def positive_radial(ident, env):
        lo, hi = interval(normal.at(ident), env)
        require(compare(lo, rat(0)) > 0, 'Primitive radial operand not bounded away from zero')
        return [lo, hi]
    def nonzero(ident, env):
        if ident in eta_pole_contracts:
            return eta_pole_contracts[ident]
        if ident in positive_eta_atoms:
            return 'Exact source core export has no zero on the common eta tube: ' + eta_atoms.get(ident, str(ident))
        node = nodes[ident]
        op, a = node['op'], node['args']
        if op == 'actual_natural_series':
            require(a[0] == 'Phi' and a[3:] == [0, 0], 'Only undifferentiated Phi has the source reciprocal contract')
            lo, hi = interval(normal.at(a[1]), env)
            require(compare(lo, rat(0)) >= 0 and compare(hi, rat(LIMIT)) < 0 and a[2] == 2, 'Phi reciprocal outside actual proved rectangle')
            return 'Actual Phi modulus exceeds 63/256 on the original common eta delta tube'
        if op == 'exp':
            return 'Exponential of a finite holomorphic function is nonzero'
        if op == 'multiply':
            return ['Product of nonzero factors', [nonzero(child, env) for child in a]]
        if op in {'inverse', 'integer_power'}:
            return 'Zeroth power equals one' if op == 'integer_power' and a[1] == 0 else nonzero(a[0], env)
        if op == 'smooth_piecewise':
            return ['All retained real-radial lazy branches nonzero', [nonzero(child, branch) for child, branch in branches_for(a, env)]]
        return ['Exact radial strict positivity', positive_radial(ident, env)]
    def walk_primitive(ident, env, path):
        key = ident, tuple(sorted(env.items(), key=repr))
        if key in primitive_memo:
            return
        primitive_memo.add(key)
        require(len(primitive_memo) < 250000, 'Primitive proof state budget exceeded')
        if ident in eta_atoms:
            primitive_checked.append({'node': ident, 'rule': 'Source-rebound eta-holomorphic core export', 'export': eta_atoms[ident]})
            return
        node = nodes[ident]
        op, a = node['op'], node['args']
        try:
            if op == 'smooth_piecewise':
                selector_interval = interval(normal.at(a[0]), env)
                interface_ledger.append({'guard': ident, 'surface': node, 'selectorInterval': selector_interval,
                                         'leftEndpoint': normal.at(a[1]), 'rightEndpoint': normal.at(a[2]),
                                         'leftBranchesIdentical': a[3] == a[4], 'rightBranchesIdentical': a[4] == a[5],
                                         'path': path, 'matchingClaim': 'Exact identical branch IDs need no matching theorem. Nonidentical reachable interfaces require actual source identities and flatness; no smoothness follows from the operation name.'})
                # Endpoints and selectors are evaluated even when a body is lazy.
                for child in a[:3]:
                    walk_primitive(child, env, path)
                for child, branch in branches_for(a, env):
                    walk_primitive(child, branch, path + [ident])
            elif op == 'definite_integral':
                body, binder, left, right = a
                left_interval = interval(normal.at(left), env)
                right_interval = interval(normal.at(right), env)
                lo = minimum([left_interval[0], right_interval[0]])
                hi = maximum([left_interval[1], right_interval[1]])
                bound = dict(env)
                bound[('coordinate', binder)] = (lo, hi)
                walk_primitive(left, env, path)
                walk_primitive(right, env, path)
                walk_primitive(body, bound, path + [ident])
            elif op == 'actual_natural_series':
                for child in argument_children(node):
                    walk_primitive(child, env, path)
                lo, hi = interval(normal.at(a[1]), env)
                require(compare(lo, rat(0)) >= 0 and compare(hi, rat(LIMIT)) < 0 and a[2] == 2, 'Natural primitive outside actual proved rectangle')
                primitive_checked.append({'node': ident, 'rule': 'Actual kernel natural theorem on the proved radial range and eta tube'})
            else:
                require(op in {'rational', 'source_parameter', 'coordinate', 'add', 'multiply', 'exp', 'integer_power', 'inverse', 'log_positive', 'sqrt_positive', 'source_step_derivative'}, 'Unknown primitive operation: ' + op)
                for child in argument_children(node):
                    walk_primitive(child, env, path)
                if op == 'inverse':
                    primitive_checked.append({'node': ident, 'rule': 'Nonzero reciprocal operand', 'evidence': nonzero(a[0], env), 'path': path})
                elif op in {'log_positive', 'sqrt_positive'}:
                    if op == 'log_positive' and a[0] in {16, 17}:
                        primitive_checked.append({'node': ident, 'rule': 'Positive-real-part eta logarithm branch', 'evidence': eta_pole_contracts[a[0]], 'path': path})
                    else:
                        primitive_checked.append({'node': ident, 'rule': 'Strictly positive real radial primitive operand', 'interval': positive_radial(a[0], env), 'path': path})
                elif op == 'coordinate':
                    require(ident == 2 or ('coordinate', ident) in env, 'Unbound coefficient coordinate')
                elif op == 'source_step_derivative':
                    require(not contains_eta(a[0]), 'Eta-dependent source step cannot be declared holomorphic')
                elif op == 'integer_power' and a[1] < 0:
                    primitive_checked.append({'node': ident, 'rule': 'Negative integer power has a nonzero operand', 'evidence': nonzero(a[0], env), 'path': path})
        except (Unproved, ValueError, KeyError, ZeroDivisionError) as error:
            primitive_failures.append({'node': ident, 'operation': op, 'path': path, 'reason': str(error)})
    @lru_cache(None)
    def contains_eta(ident):
        return ident == 2 or any(contains_eta(child) for child in argument_children(nodes[ident]))
    for root in roots:
        walk_primitive(root, initial, [])
    result = {'schema': 'MathScope.N6.ActualPicardNaturalDownwardDomains/1', 'sourceRun': payload.get('sourceRun') or os.environ.get('GITHUB_RUN_ID'),
              'sourceDefinitionSHA256': sha(system), 'sourceFixedSHA256': sha(fixed),
              'inputBinding': input_binding, 'analyticSourceBindings': analytic_bindings,
              'parameterProof': parameter_proof, 'completeCoefficientNodes': len(seen),
              'potentialNaturalCalls': sorted(potential), 'naturalCallContextsProved': successes,
              'naturalCallIDsReachedInProvedContexts': sorted(proved_ids), 'provedEmptyLazyBranches': skipped,
              'naturalCallIDsOnlyBehindProvedEmptyBranches': sorted(potential - proved_ids),
              'unprovedProofStates': failures, 'proofStates': len(memo),
              'allActualPicardNaturalDomainsProved': not failures,
              'primitiveDomainsChecked': primitive_checked, 'unprovedPrimitiveDomains': primitive_failures,
              'primitiveProofStates': len(primitive_memo),
              'actualGuardInterfaceLedger': interface_ledger,
              'coefficientEtaHolomorphyAtEachRealXiProved': not failures and not primitive_failures,
              'commonEtaTube': {'realBaseInterval': ['-33/32', '33/32'], 'complexRadius': 'delta = rho/(1024 Q)', 'originalSourceStrip': 'delta/4', 'originalSolutionStrip': 'delta/8'},
              'coefficientHolomorphyProved': False,
              'allCoefficientPrimitiveDomainsProved': not primitive_failures,
              'remainingAnalyticApplication': 'Global radial smoothness and continuity across nonidentical smooth_piecewise interfaces still require actual source identities and all-order matching. Eta holomorphy for each fixed real xi and primitive definedness alone do not prove this.',
              'newOriginalObligationsDischarged': 0}
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'coefficientNodes': len(seen), 'potentialNaturalCalls': len(potential),
                      'naturalCallsReached': len(proved_ids), 'provedContexts': len(successes),
                      'emptyBranches': len(skipped), 'unprovedStates': len(failures),
                      'primitiveStates': len(primitive_memo), 'unprovedPrimitiveDomains': len(primitive_failures),
                      'radialInterfaceMatchingOpen': True, 'newDischarged': 0}))


if __name__ == '__main__':
    main()
