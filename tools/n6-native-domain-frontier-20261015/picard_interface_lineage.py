"""Exact formal-AD lineage of the actual Picard natural/B26 guard pairs.

This binds source branches to derivatives.  It does not infer matching from
the name smooth_piecewise: matching is supplied by the independently proved
integrated natural equations and flat B26 activation.
"""
from __future__ import annotations
import argparse
from functools import lru_cache
from fractions import Fraction as Q
import hashlib
import json
from pathlib import Path

import picard_domain_proof as r
from native_domain_extract import argument_children, require, sha
from natural_domain_proof import PIN, FIXED_PIN, RAW_DIAGNOSTIC_PIN


_INTERNED = {}


class _AST(tuple):
    """Interned immutable tuple with a cached hash and compact sort key.

    Equality still compares complete structure. Serial sort keys only choose
    one consistent order among distinct already-interned expressions; they
    never replace a mathematical equality check.
    """
    def __hash__(self):
        return self._cached_hash

    def __repr__(self):
        return 'AST#' + str(self._serial)


def intern(value):
    if not isinstance(value, tuple):
        return value
    if isinstance(value, _AST):
        return value
    value = tuple(intern(v) for v in value)
    existing = _INTERNED.get(value)
    if existing is not None:
        return existing
    result = _AST(value)
    result._cached_hash = hash(value)
    result._serial = len(_INTERNED)
    _INTERNED[value] = result
    return result


def cached_ast(function):
    @lru_cache(None)
    def wrapped(*args):
        return intern(function(*args))
    return wrapped


class BinaryAD:
    """Replay ordinary AD with the source compiler's binary grouping."""
    def __init__(self, nodes, xi_squared=25586):
        self.nodes, self.xi_squared = nodes, xi_squared
        self.X = intern(('coordinate', 'X=xi^2'))
    def q(self, number): return intern(r.rat(number))
    def A(self, *items):
        result = self.q(0)
        for item in items:
            if result == self.q(0): result = item
            elif item == self.q(0): continue
            elif result[0] == item[0] == 'q': result = self.q(Q(result[1]) + Q(item[1]))
            else: result = intern(('plus', *sorted((result, item), key=lambda x: x._serial)))
        return result
    def M(self, *items):
        result = self.q(1)
        for item in items:
            if result == self.q(0) or item == self.q(0): return self.q(0)
            if result == self.q(1): result = item
            elif item == self.q(1): continue
            elif result[0] == item[0] == 'q': result = self.q(Q(result[1]) * Q(item[1]))
            else: result = intern(('times', *sorted((result, item), key=lambda x: x._serial)))
        return result
    def N(self, value): return self.M(self.q(-1), value)
    def S(self, first, second): return self.q(0) if first == second else self.A(first, self.N(second))
    def I(self, value): return self.q(1 / Q(value[1])) if value[0] == 'q' else intern(('inverse', value))
    def P(self, value, exponent):
        if exponent == 0: return self.q(1)
        if exponent == 1: return value
        if exponent < 0: return self.P(self.I(value), -exponent)
        if exponent == 2 and value[0] == 'q': return self.q(Q(value[1])**2)
        return intern(('power', value, exponent))
    def E(self, value): return self.q(1) if value == self.q(0) else intern(('exp', value))
    def L(self, value): return self.q(0) if value == self.q(1) else intern(('log', value))
    def R(self, value): return value if value in (self.q(0), self.q(1)) else intern(('sqrt', value))
    @cached_ast
    def at(self, ident):
        if ident == self.xi_squared: return self.X
        op, a = self.nodes[ident]['op'], self.nodes[ident]['args']
        if op == 'rational': return self.q(Q(*map(int, a)))
        if op == 'coordinate': return ('coordinate', ident)
        if op == 'source_parameter': return ('parameter', a[0])
        if op == 'add': return self.A(*(self.at(z) for z in a))
        if op == 'multiply': return self.M(*(self.at(z) for z in a))
        if op == 'inverse': return self.I(self.at(a[0]))
        if op == 'integer_power': return self.P(self.at(a[0]), a[1])
        if op == 'exp': return self.E(self.at(a[0]))
        if op == 'log_positive': return self.L(self.at(a[0]))
        if op == 'sqrt_positive': return self.R(self.at(a[0]))
        if op == 'actual_natural_series': return ('natural', a[0], self.at(a[1]), self.at(a[2]), a[3], a[4])
        if op == 'source_step_derivative': return ('step', self.at(a[0]), a[1])
        if op == 'smooth_piecewise': return ('choose', tuple(self.at(z) for z in a))
        if op == 'definite_integral': return self.integral(self.at(a[0]), self.at(a[1]), self.at(a[2]), self.at(a[3]))
        raise ValueError('Unknown binary AD operation ' + op)
    @lru_cache(None)
    def depends(self, value, variable):
        if value == variable: return True
        op = value[0]
        if op in {'q', 'parameter', 'coordinate'}: return False
        if op in {'plus', 'times'}: return self.depends(value[1], variable) or self.depends(value[2], variable)
        if op in {'exp', 'log', 'sqrt', 'step', 'power', 'inverse'}: return self.depends(value[1], variable)
        if op == 'choose': return any(self.depends(z, variable) for z in value[1])
        if op == 'natural': return self.depends(value[2], variable) or self.depends(value[3], variable)
        if op == 'integral': return ((value[2] != variable and self.depends(value[1], variable)) or self.depends(value[3], variable) or self.depends(value[4], variable))
        raise ValueError('Unknown binary dependence operation ' + op)
    def integral(self, body, binder, left, right):
        if body == self.q(0) or left == right: return self.q(0)
        if not self.depends(body, binder): return self.M(body, self.S(right, left))
        return intern(('integral', body, binder, left, right))
    @cached_ast
    def substitute(self, value, variable, replacement):
        if value == variable: return replacement
        op = value[0]; S = lambda v: self.substitute(v, variable, replacement)
        if op in {'q', 'parameter', 'coordinate'}: return value
        if op == 'plus': return self.A(S(value[1]), S(value[2]))
        if op == 'times': return self.M(S(value[1]), S(value[2]))
        if op == 'inverse': return self.I(S(value[1]))
        if op == 'power': return self.P(S(value[1]), value[2])
        if op == 'exp': return self.E(S(value[1]))
        if op == 'log': return self.L(S(value[1]))
        if op == 'sqrt': return self.R(S(value[1]))
        if op == 'step': return ('step', S(value[1]), value[2])
        if op == 'natural': return ('natural', value[1], S(value[2]), S(value[3]), value[4], value[5])
        if op == 'choose': return ('choose', tuple(S(z) for z in value[1]))
        if op == 'integral': return self.integral(value[1] if value[2] == variable else S(value[1]), value[2], S(value[3]), S(value[4]))
        raise ValueError('Unknown binary substitution operation ' + op)
    @cached_ast
    def derivative(self, value, variable):
        if value == variable: return self.q(1)
        op = value[0]; D = lambda v: self.derivative(v, variable)
        if op in {'q', 'parameter', 'coordinate'}: return self.q(0)
        if op == 'plus': return self.A(D(value[1]), D(value[2]))
        if op == 'times': return self.A(self.M(D(value[1]), value[2]), self.M(value[1], D(value[2])))
        if op == 'inverse': return self.N(self.M(D(value[1]), self.P(value, 2)))
        if op == 'power': return self.M(self.q(value[2]), self.P(value[1], value[2] - 1), D(value[1]))
        if op == 'exp': return self.M(value, D(value[1]))
        if op == 'log': return self.M(D(value[1]), self.I(value[1]))
        if op == 'sqrt': return self.M(D(value[1]), self.I(self.M(self.q(2), value)))
        if op == 'step': return self.M(intern(('step', value[1], value[2] + 1)), D(value[1]))
        if op == 'natural':
            return self.A(self.M(D(value[2]), intern(('natural', value[1], value[2], value[3], value[4] + 1, value[5]))), self.M(D(value[3]), intern(('natural', value[1], value[2], value[3], value[4], value[5] + 1))))
        if op == 'choose': return ('choose', value[1][:3] + tuple(D(z) for z in value[1][3:]))
        if op == 'integral':
            f, t, a, b = value[1:]; da, db = D(a), D(b)
            interior = self.q(0) if t == variable else self.integral(D(f), t, a, b)
            upper = self.q(0) if db == self.q(0) else self.M(self.substitute(f, t, b), db)
            lower = self.q(0) if da == self.q(0) else self.N(self.M(self.substitute(f, t, a), da))
            return self.A(interior, upper, lower)
        raise ValueError('Unknown binary derivative operation ' + op)


def freeze(value):
    return tuple(freeze(v) for v in value) if isinstance(value, list) else value


def audit(nodes, system, domains):
    require(not domains['unprovedProofStates'] and not domains['unprovedPrimitiveDomains'], 'Domain proof still has gaps')
    require(domains['sourceDefinitionSHA256'] == sha(system) and domains['sourceFixedSHA256'] == FIXED_PIN,
            'Range/interface proof belongs to a different original source')
    ad = BinaryAD(nodes)
    bases = {name: system['sourceLeading'][name] for name in ('F0', 'U0', 'v0')}
    expected = {}
    for name, root in bases.items():
        a = nodes[root]['args']
        require(nodes[root]['op'] == 'smooth_piecewise' and a[:3] == [25586, 3617, 24805] and a[4] == a[5], 'Changed original base join')
        pair = tuple(ad.at(v) for v in a[3:5])
        require(not any(ad.depends(value, intern(('coordinate', system['xi']))) for value in pair),
                'Base branch uses xi outside the xi^2 substitution; formal X differentiation is not justified')
        for i, j in ((0, 0), (1, 0), (0, 1), (2, 0), (1, 1), (0, 2)):
            values = pair
            for _ in range(i):
                values = tuple(ad.derivative(v, ad.X) for v in values)
            for _ in range(j):
                values = tuple(ad.derivative(v, ('coordinate', 2)) for v in values)
            expected.setdefault(values, []).append({'base': name, 'baseGuard': root, 'XDerivativeOrder': i, 'etaDerivativeOrder': j})
        # The source compiler retains both orders of the mixed derivative.
        # They are algebraically equal for the proved smooth branch functions,
        # but their unexpanded product-rule trees need not be identical.
        eta_then_x = tuple(ad.derivative(ad.derivative(v, ('coordinate', 2)), ad.X) for v in pair)
        expected.setdefault(eta_then_x, []).append({'base': name, 'baseGuard': root, 'XDerivativeOrder': 1,
                                                   'etaDerivativeOrder': 1, 'compilerDerivativeOrder': ['eta', 'X']})
    retained, seen = [], set()
    for row in domains['actualGuardInterfaceLedger']:
        lo, hi = map(freeze, row['selectorInterval'])
        for side, endpoint_key, equality_key, positions in [('left', 'leftEndpoint', 'leftBranchesIdentical', (3, 4)), ('right', 'rightEndpoint', 'rightBranchesIdentical', (4, 5))]:
            endpoint = freeze(row[endpoint_key])
            if r.compare(lo, endpoint) > 0 or r.compare(endpoint, hi) > 0:
                continue
            key = row['guard'], side
            if key in seen:
                continue
            seen.add(key)
            node = nodes[row['guard']]
            a = node['args']
            result = {'guard': row['guard'], 'interface': side, 'source': node, 'sourceSHA256': sha(node)}
            if row[equality_key]:
                result['rule'] = 'Identical branch source IDs'
            else:
                require(side == 'left' and a[:3] == [25586, 3617, 24805], 'A further nonidentical reachable interface appeared')
                pair = tuple(ad.at(a[position]) for position in positions)
                result['formalDerivativeLineage'] = expected.get(pair)
                result['rule'] = 'Actual natural/B26 all-order matching, if formal derivative lineage is present'
            retained.append(result)
    matched = [row for row in retained if row.get('formalDerivativeLineage')]
    unproved = [row for row in retained if row['rule'] != 'Identical branch source IDs' and not row.get('formalDerivativeLineage')]
    require(len(retained) == 36 and len(retained) - len(matched) - len(unproved) == 18,
            'Actual reachable guard interface coverage changed or was truncated')
    return {'schema': 'MathScope.N6.ActualPicardGuardFormalADLineage/1',
            'sourcePicardSHA256': sha(system), 'sourceFixedSHA256': FIXED_PIN,
            'baseJoins': bases, 'reachableInterfaces': retained,
            'allBaseBranchesUseXiOnlyThroughXiSquared': True,
            'reachableInterfaceCount': len(retained), 'identicalBranchInterfaces': len(retained) - len(matched) - len(unproved),
            'matchedDerivativeInterfaces': len(matched), 'unprovedDerivativeInterfaces': unproved,
            'allActualInterfaceLineagesProved': not unproved and len(matched) == 18,
            'matchingTheoremStillRequired': 'actual_natural_b26_identity.py and its independent all-order flatness proof',
            'newOriginalObligationsDischarged': 0}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=Path(__file__).resolve().parent / 'native-result-small')
    parser.add_argument('--diagnostics', type=Path, help='Original raw native-domain JSON, exact b6a1... hash required.')
    parser.add_argument('--domains', type=Path, default=Path(__file__).resolve().parent / 'picard_domain_proof.json')
    parser.add_argument('--out', type=Path, default=Path(__file__).with_suffix('.json'))
    args = parser.parse_args()
    source = {}
    if args.diagnostics:
        raw = args.diagnostics.read_bytes()
        require(hashlib.sha256(raw).hexdigest() == RAW_DIAGNOSTIC_PIN, 'Changed original raw native diagnostics')
        data = json.loads(raw)
        source = {'NATURAL_ARGUMENT_GRAPH.json': data, 'NATIVE_PAYLOADS.json': data}
    else:
        for name, pin in PIN.items():
            raw = (args.input / name).read_bytes()
            require(hashlib.sha256(raw).hexdigest() == pin, 'Changed original projection ' + name)
            source[name] = json.loads(raw)
    nodes = {int(k): v for k, v in source['NATURAL_ARGUMENT_GRAPH.json']['argumentAndContextGraph'].items()}
    system = source['NATIVE_PAYLOADS.json']['fullNativePayloads']['picard:0']
    require(sha(system) == 'c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60', 'Changed actual Picard source')
    result = audit(nodes, system, json.loads(args.domains.read_text(encoding='utf8')))
    result['domainPrerequisiteSHA256'] = hashlib.sha256(args.domains.read_bytes()).hexdigest()
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(json.dumps({key: result[key] for key in ('reachableInterfaceCount', 'identicalBranchInterfaces', 'matchedDerivativeInterfaces', 'allActualInterfaceLineagesProved')}))


if __name__ == '__main__':
    main()
