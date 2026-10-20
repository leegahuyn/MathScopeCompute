"""Exact local range contracts for the authenticated 533 natural call records.

This proves constant and immediate guard/binder implications.  It deliberately
does not invent outer caller environments or promote a partial argument graph
into a whole-source domain certificate.
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

PIN = {
    'NATIVE_PAYLOADS.json': 'e0295fb8505480fa8aa5874b0fcdded711c16363469f2ff71ae104236c1a18cc',
    'NATURAL_CALLS.json': 'cc538d6936201b70dc4b40ba702b909ed9867dd67bbd74a0dbe628de97983f9f',
    'NATURAL_ARGUMENT_GRAPH.json': '38059256a2eccd31f895cd52783db323d449271fd71b1ca35445c4a58dfb09b6',
}
LIMIT = Q(41, 10)
TAU_UPPER = Q(1, 2**120)
RAW_DIAGNOSTIC_PIN = 'b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1'
CALL_INVENTORY_PIN = 'd4840b63acd3766cea5dfec788676c41344920bc1c349477b072bbac116af184'
FIXED_PIN = 'c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
TARGET_PIN = '9b7106abef4f82a081375e8dd9f7ba64452fc5efa87f20f9e75eb237a3bb744f'


def canonical_sha(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode('utf-8')).hexdigest()


def require(ok, message):
    if not ok:
        raise ValueError(message)


def rat(value):
    return ('q', str(Q(value)))


def parts(x):
    if x[0] == 'q':
        return Q(x[1]), {}
    if x[0] == 'mul':
        return Q(x[1]), dict(x[2])
    return Q(1), {x: 1}


def multiply(*values):
    coefficient, factors = Q(1), Counter()
    for value in values:
        c, f = parts(value)
        coefficient *= c
        factors.update(f)
    factors = {x: n for x, n in factors.items() if n}
    if not coefficient:
        return rat(0)
    if not factors:
        return rat(coefficient)
    if coefficient == 1 and len(factors) == 1:
        (x, n), = factors.items()
        if n == 1:
            return x
    return ('mul', str(coefficient), tuple(sorted(factors.items(), key=repr)))


def power(value, exponent):
    coefficient, factors = parts(value)
    require(coefficient != 0 or exponent >= 0, 'Division by zero in normalization')
    result = [('q', str(coefficient**exponent))]
    for x, n in factors.items():
        if n * exponent:
            result.append(('mul', '1', ((x, n * exponent),)))
    return multiply(*result)


def add(*values):
    terms, constant = [], Q(0)
    for value in values:
        if value[0] == 'q':
            constant += Q(value[1])
        elif value[0] == 'add':
            terms.extend(value[1])
        else:
            terms.append(value)
    if constant:
        terms.append(rat(constant))
    return rat(0) if not terms else terms[0] if len(terms) == 1 else ('add', tuple(sorted(terms, key=repr)))


def exp(value):
    if value[0] == 'q' and value[1] == '0':
        return rat(1)
    if value[0] == 'log':
        return value[1]
    return ('exp', value)


def log(value):
    if value[0] == 'q' and value[1] == '1':
        return rat(0)
    if value[0] == 'exp':
        return value[1]
    return ('log', value)


def coordinates(value):
    if value[0] == 'coordinate':
        return {value[1]}
    if value[0] == 'mul':
        return set().union(*(coordinates(x) for x, _ in value[2]))
    if value[0] == 'add':
        return set().union(*(coordinates(x) for x in value[1]))
    if value[0] in {'log', 'exp'}:
        return coordinates(value[1])
    return set()


class Normalize:
    def __init__(self, nodes):
        self.nodes = nodes
        self.log_domains = set()

    @lru_cache(None)
    def at(self, ident):
        node = self.nodes[ident]
        op, args = node['op'], node['args']
        if op == 'rational':
            return rat(Q(*map(int, args)))
        if op == 'coordinate':
            return ('coordinate', ident)
        if op == 'source_parameter':
            if args[0] == 'Xa':
                return multiply(rat(4), power(('parameter', 'Lambda'), -1))
            return ('parameter', args[0])
        if op == 'add':
            return add(*(self.at(x) for x in args))
        if op == 'multiply':
            return multiply(*(self.at(x) for x in args))
        if op == 'inverse':
            return power(self.at(args[0]), -1)
        if op == 'integer_power':
            return power(self.at(args[0]), args[1])
        if op == 'exp':
            return exp(self.at(args[0]))
        if op == 'log_positive':
            self.log_domains.add(args[0])
            return log(self.at(args[0]))
        raise ValueError('Unreviewed range normalization operation ' + op)


def positive_source_expression(value):
    if value[0] == 'q':
        return Q(value[1]) > 0
    if value[0] == 'parameter':
        return value[1] in {'Lambda', 'Xa', 't1', 'rho', 'Q', 'CSelected'}
    if value[0] == 'exp':
        return True
    if value[0] == 'mul':
        return Q(value[1]) > 0 and all(positive_source_expression(x) for x, _ in value[2])
    return False


def numerical_upper(value):
    if value[0] == 'q':
        return Q(value[1])
    if value == ('parameter', 't1'):
        return TAU_UPPER
    if value[0] == 'exp':
        upper = numerical_upper(value[1])
        if upper is not None and upper < 1:
            # e^x <= 1/(1-x) for 0<=x<1; for x<=0 use e^x<=1.
            return Q(1) if upper <= 0 else Q(1) / (1 - upper)
    if value[0] == 'add':
        bounds = [numerical_upper(x) for x in value[1]]
        return sum(bounds, Q(0)) if all(x is not None for x in bounds) else None
    if value[0] == 'mul':
        coefficient = Q(value[1])
        if coefficient < 0:
            return None
        for factor, exponent in value[2]:
            if exponent < 0:
                return None
            if not known_nonnegative(factor):
                return None
            upper = numerical_upper(factor)
            if upper is None or upper < 0:
                return None
            coefficient *= upper**exponent
        return coefficient
    return None


def known_nonnegative(value):
    if value[0] == 'q':
        return Q(value[1]) >= 0
    if positive_source_expression(value):
        return True
    if value[0] == 'add':
        return all(known_nonnegative(x) for x in value[1])
    return False


def bound_from_selector(value, selector, upper):
    """Prove value<=bound from selector<=upper by a positive affine factor,
    or a positive multiple of exp(selector).  No caller fact is created.
    """
    if selector[0] == 'log':
        coefficient = multiply(value, power(selector[1], -1))
        if not coordinates(coefficient) and positive_source_expression(coefficient):
            candidate = multiply(coefficient, exp(upper))
            bound = numerical_upper(candidate)
            if bound is not None:
                return bound, 'POSITIVE_EXPONENTIAL_OF_LOG_SELECTOR'
    coefficient = multiply(value, power(exp(selector), -1))
    if not coordinates(coefficient) and positive_source_expression(coefficient):
        candidate = multiply(coefficient, exp(upper))
        bound = numerical_upper(candidate)
        if bound is not None:
            return bound, 'POSITIVE_EXPONENTIAL_OF_SELECTOR'
    coefficient = multiply(value, power(selector, -1))
    if not coordinates(coefficient) and positive_source_expression(coefficient):
        candidate = multiply(coefficient, upper)
        bound = numerical_upper(candidate)
        if bound is not None:
            return bound, 'POSITIVE_MULTIPLE_OF_SELECTOR'
    return None


def context_upper(call, context, nodes, normal):
    value = normal.at(call['Y'])
    surface = nodes[context['surface']]
    op, args = surface['op'], surface['args']
    if op == 'smooth_piecewise':
        roles = context['piecewiseRoles']
        results = []
        for role in roles:
            if role not in {'inside', 'outsideLeft'}:
                return {'proved': False, 'reason': 'No upper constraint in this branch role'}
            endpoint = args[2] if role == 'inside' else args[1]
            result = bound_from_selector(value, normal.at(args[0]), normal.at(endpoint))
            if result is None:
                return {'proved': False, 'reason': 'Selector implication not in reviewed exact range rules'}
            results.append(result)
        bound = max(r[0] for r in results)
        return {'proved': bound < LIMIT, 'YUpper': str(bound),
                'rule': results[0][1], 'branchConstraint': roles,
                'nonnegativeRadialCallerStillRequired': not positive_source_expression(value)}
    if op == 'definite_integral':
        binder, left, right = args[1:]
        # Either orientation integrates only points between the endpoints.
        endpoints = [normal.at(left), normal.at(right)]
        lower_bounds, upper_bounds = [], []
        for endpoint in endpoints:
            result = bound_from_selector(value, ('coordinate', binder), endpoint)
            if result is None:
                return {'proved': False, 'reason': 'Variable integral endpoint requires an outer execution scope',
                        'binder': binder, 'endpointIDs': [left, right]}
            upper_bounds.append(result[0])
        bound = max(upper_bounds)
        return {'proved': bound < LIMIT, 'YUpper': str(bound), 'rule': 'EXACT_BINDER_INTERVAL',
                'binder': binder, 'endpointIDs': [left, right],
                'nonnegativeRadialCallerStillRequired': not (nodes[left]['op'] == 'rational' and Q(*map(int, nodes[left]['args'])) >= 0)
                and not positive_source_expression(value)}
    return {'proved': False, 'reason': 'Native context needs a bound parameter environment'}


def source_parameter_proof(fixed):
    expressions = fixed['source']['parametersExactExpressions']
    expected = {
        'Q': {'quotient': [{'product': [{'integer': str(2**260)}, {'ref': 'K'}]}, {'power': [{'ref': 'sigmaStar'}, 2]}]},
        'Lambda': {'power': [{'ref': 'Q'}, 64]},
        'Xa': {'quotient': [{'integer': 4}, {'ref': 'Lambda'}]},
        't1': {'power': [{'ref': 'CSelected'}, -120]},
        'CSelected': {'exp': {'ref': 'logCSelected'}},
        'logCSelected': {'sum': [{'product': [{'integer': 10}, {'log': {'sum': [{'integer': 1}, {'ref': 'BRefUpper'}]}}]}, {'power': [{'ref': 'Q'}, 200]}]},
        'BRefUpper': {'power': [{'ref': 'Q'}, 300]},
        'K': {'power': [{'ref': 'Pstar'}, 2]},
        'Pstar': {'exp': {'ref': 'logP'}},
        'logP': {'product': [{'integer': 2}, {'ref': 'T'}]},
        'T': {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]},
        'Md': {'integer': 1048576},
        'h': {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}},
        'j0': {'power': [{'ref': 'h'}, 4]},
        'sigmaStar': {'quotient': [{'ref': 'j0'}, {'integer': 2000}]},
        'rho': {'quotient': [{'power': [{'ref': 'sigmaStar'}, 2]}, {'integer': 65536}]},
    }
    require(all(expressions[key] == value for key, value in expected.items()), 'Actual source parameter expressions changed')
    require(2 * TAU_UPPER < Q(1, 1000), 't1 range margin failed')
    bound = 4 / (1 - 2 * TAU_UPPER)
    require(bound < LIMIT, 'Exact natural radius margin failed')
    return {'parameterExpressionsChecked': sorted(expected), 'LambdaPositive': True, 'Xa': '4/Lambda',
            'QStrictLower': '2^260', 't1StrictUpper': str(TAU_UPPER),
            'fourExpTwoT1StrictUpper': str(bound), 'naturalDomainUpper': str(LIMIT),
            'argument': 'T>10, 0<h<1, 0<sigmaStar<1, K>1 imply Q>2^260. logCSelected>Q^200>1; CSelected>e>2, so 0<t1<2^-120. e^x<=1/(1-x) on 0<=x<1 gives 4e^(2t1)<41/10.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=Path(__file__).resolve().parent / 'native-result-small')
    parser.add_argument('--diagnostics', type=Path, help='Raw authenticated native-domain JSON from the focused cloud source replay.')
    parser.add_argument('--out', type=Path, default=Path(__file__).with_suffix('.json'))
    args = parser.parse_args()
    if args.diagnostics:
        raw = args.diagnostics.read_bytes()
        require(hashlib.sha256(raw).hexdigest() == RAW_DIAGNOSTIC_PIN, 'Changed original raw native diagnostics')
        data = json.loads(raw)
        auth = data['sourceAuthentication']
        require(auth['parentSHA256'] == '7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f'
                and auth['rawSHA256'] == '9be5187506edbd2e7ccdad81392b0c29cc84350f374e331b7b5845a435c7fdf0'
                and auth['compressedSHA256'] == '42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3'
                and auth['nodes'] == 3892594 and auth['bytes'] == 209857208,
                'Original whole-source authentication receipt changed')
        require(data['target']['sha256'] == TARGET_PIN and canonical_sha(data['target']['definition']) == TARGET_PIN,
                'Original complete_gr definition changed')
        require(data['conservativeCapture']['sourceNodes'] == 136186
                and data['conservativeCapture']['registryDefinitions'] == 84
                and data['conservativeCapture']['sourceIdSetSHA256'] == '5d9e85d4b92e19947dc68a0f17b994ee8f95664440c962fbd0cb01b6cf49419a',
                'Original complete_gr capture changed')
        node_data, calls, fixed = data['argumentAndContextGraph'], data['naturalCalls'], data['fullNativePayloads']['fixed']
        source_run = data.get('sourceExecutionRun', data.get('sourceRun', os.environ.get('GITHUB_RUN_ID')))
        input_pins = {'rawDiagnosticsSHA256': RAW_DIAGNOSTIC_PIN}
    else:
        inputs = {}
        for name, pin in PIN.items():
            raw = (args.input / name).read_bytes()
            require(hashlib.sha256(raw).hexdigest() == pin, 'Changed authenticated projection ' + name)
            inputs[name] = json.loads(raw)
        node_data = inputs['NATURAL_ARGUMENT_GRAPH.json']['argumentAndContextGraph']
        calls = inputs['NATURAL_CALLS.json']['naturalCalls']
        fixed = inputs['NATIVE_PAYLOADS.json']['fullNativePayloads']['fixed']
        source_run = inputs['NATIVE_PAYLOADS.json']['sourceRun']
        input_pins = PIN
    nodes = {int(key): value for key, value in node_data.items()}
    require(len(calls) == len({call['id'] for call in calls}) == 533, 'Original natural call inventory changed')
    require(canonical_sha([(call['id'], call['nodeSHA256']) for call in calls]) == CALL_INVENTORY_PIN,
            'Original natural IDs/order/node hashes changed')
    require(canonical_sha(fixed) == FIXED_PIN, 'Original full fixed native definition changed')
    parameter_proof = source_parameter_proof(fixed)
    normal = Normalize(nodes)
    results = []
    for call in calls:
        require(call['node'] == nodes[call['id']], 'Natural call node differs from argument graph')
        require(canonical_sha(call['node']) == call['nodeSHA256'], 'Original natural node hash changed')
        require(call['eta'] == 2, 'Changed original eta argument')
        value = normal.at(call['Y'])
        constant = numerical_upper(value)
        if constant is not None and constant < LIMIT:
            result = {'id': call['id'], 'Y': call['Y'], 'normalizedY': value,
                      'status': 'CONSTANT_Y_BOUND', 'YUpper': str(constant),
                      'allNearestContextUpperImplicationsProved': True,
                      'actualEtaAndCallerDomainStillOpen': True}
        else:
            contexts = []
            for context in call['nearestSyntacticContexts']:
                try:
                    proof = context_upper(call, context, nodes, normal)
                except (ValueError, KeyError) as error:
                    proof = {'proved': False, 'reason': str(error)}
                contexts.append({'surface': context['surface'], **proof})
            result = {'id': call['id'], 'Y': call['Y'], 'normalizedY': value,
                      'status': 'IMMEDIATE_CONTEXT_UPPER_BOUND' if contexts and all(c['proved'] for c in contexts) else 'OUTER_SCOPE_REQUIRED',
                      'contexts': contexts, 'allNearestContextUpperImplicationsProved': bool(contexts) and all(c['proved'] for c in contexts),
                      'actualEtaAndCallerDomainStillOpen': True}
        results.append(result)
    counts = dict(Counter(row['status'] for row in results))
    result = {'schema': 'MathScope.N6.NaturalImmediateContextRangeProof/1', 'sourceRun': source_run,
              'inputProjectionSHA256': input_pins, 'sourceParameterProof': parameter_proof,
              'calls': results, 'counts': counts, 'naturalCallCount': len(results),
              'distinctYRoots': len({call['Y'] for call in calls}),
              'allEtaArgumentNode2': True, 'maxRadialOrder': max(c['radialOrder'] for c in calls),
              'maxEtaOrder': max(c['etaOrder'] for c in calls),
              'normalizationPositiveLogArgumentPrerequisites': sorted(normal.log_domains),
              'all533ActualExecutionDomainsProved': False,
              'newOriginalObligationsDischarged': 0,
              'remainingPremises': ['Actual native parameter substitutions mapping eta2 into the original real/complex source tube.',
                                    'Nonnegative radial profile inputs at every native call and bound-variable scope.',
                                    'Outer guard scopes for variable integral endpoints.',
                                    'Whole positive pressure envelope, including X in [Xa/4,4Xb], without an extra chart restriction.',
                                    'Actual Picard coefficient source-strip hypotheses, not only its stored radius nodes.']}
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'naturalCalls': len(results), 'distinctYRoots': result['distinctYRoots'], 'counts': counts,
                      'allActualDomainsProved': False, 'newDischarged': 0, 'output': str(args.out)}))


if __name__ == '__main__':
    main()
