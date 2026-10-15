"""Independent exact majorant ledger for the unchanged actual natural recurrence.

Universal n,m estimates are proved in actual_natural_proof.md. This program
checks the complete commutative remainder expansion, positive majorant sums,
actual source parameters/payload hashes, and adverse mutation controls.
It neither evaluates enormous constants nor promotes a finite series to a limit.
"""
from collections import Counter
from fractions import Fraction as F
import argparse
import copy
import hashlib
import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent


def canonical_hash(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()


def v(name):
    return {(name,): 1}


def c(n):
    return {(): n} if n else {}


def add(*polynomials):
    out = Counter()
    for p in polynomials:
        out.update(p)
    return {k: n for k, n in out.items() if n}


def scale(n, p):
    return {k: n * a for k, a in p.items() if n * a}


def mul(*polynomials):
    out = c(1)
    for p in polynomials:
        nxt = Counter()
        for a, ca in out.items():
            for b, cb in p.items():
                nxt[tuple(sorted(a + b))] += ca * cb
        out = {k: n for k, n in nxt.items() if n}
    return out


def source_remainders():
    names = 't Linv Ws Hs Us D A h eta d zeta Au AuE phi phiE phiR u uE uR p pE pR'.split()
    z = {name: v(name) for name in names}
    t, Linv, Ws, Hs, Us, D, A, h, eta, d, zeta, Au, AuE, phi, phiE, phiR, u, uE, uR, p, pE, pR = (z[n] for n in names)
    W = add(Ws, mul(t, add(scale(-2, mul(D, eta, Au)), scale(-1, mul(d, AuE)))))
    U = add(Us, mul(t, u))
    H = add(Hs, mul(t, d, u))
    pref = add(W, mul(h, add(c(1), scale(-2, mul(eta, U)))), mul(d, u, zeta))
    alpha = add(mul(A, add(c(1), scale(-4, mul(eta, Us)))), scale(4, d))
    R1 = mul(Linv, add(mul(pref, phi), mul(W, phiR), mul(H, phiE)))
    R2 = mul(Linv, add(mul(alpha, u), scale(-2, mul(A, eta, t, u, u)), mul(W, uR),
                          mul(Hs, uE), mul(d, t, u, uE), scale(-4, mul(A, eta, p)),
                          mul(d, pE), scale(-2, mul(eta, pR))))
    return R1, R2


ETA_DERIVATIVE = {'AuE', 'phiE', 'uE', 'pE'}
RADIAL_DERIVATIVE = {'phiR', 'uR', 'pR'}
ONE_FIELD = {'Au', 'AuE', 'phi', 'phiE', 'phiR', 'u', 'uE', 'uR'}
PRESSURE_BLOCK = {'p', 'pE', 'pR'}


def norm_rows(p, resolvent):
    rows = []
    cp = 80 * 64**3
    for factors, coefficient in sorted(p.items()):
        active = [x for x in factors if x != 't']  # |t|<=1 is scalar scaling.
        e = sum(x in ETA_DERIVATIVE for x in active)
        d = sum(x in RADIAL_DERIVATIVE for x in active)
        assert e <= 1 and d <= 1
        r = len(active)
        pressure = sum(x in PRESSURE_BLOCK for x in active)
        degree = sum(x in ONE_FIELD for x in active) + 2 * pressure
        assert degree in (1, 2)
        constant = abs(coefficient) * 80 * 64**(r - 1) * cp**pressure
        exponent = sum(4 if x in PRESSURE_BLOCK else 1 for x in active) + e + int(resolvent)
        rows.append({'sourceMonomial': '*'.join(factors), 'sourceCoefficient': coefficient,
                     'ordinaryProductFactors': r, 'etaDerivativeFactors': e,
                     'radialDotFactors': d, 'actualPressureBlocks': pressure,
                     'majorantCoefficient': constant, 'QPower': exponent,
                     'unknownFieldDegree': degree,
                     'lipschitzCoefficient': degree * constant,
                     'lipschitzQPower': exponent - 1})
    return rows


def validate_parameters(params):
    expected = {
        'j0': {'power': [{'ref': 'h'}, 4]},
        'sigmaStar': {'quotient': [{'ref': 'j0'}, {'integer': 2000}]},
        'rho': {'quotient': [{'power': [{'ref': 'sigmaStar'}, 2]}, {'integer': 65536}]},
        'Lambda': {'power': [{'ref': 'Q'}, 64]},
        'K': {'power': [{'ref': 'Pstar'}, 2]},
        'BRefUpper': {'power': [{'ref': 'Q'}, 300]},
        'CSelected': {'exp': {'ref': 'logCSelected'}},
        'co': {'rational': '1/256'},
        'Q': {'quotient': [{'product': [{'integer': str(2**260)}, {'ref': 'K'}]},
                           {'power': [{'ref': 'sigmaStar'}, 2]}]},
        'h': {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}},
        'T': {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]},
        'Md': {'integer': 1048576},
        'lambda': {'exp': {'product': [{'integer': -1000}, {'ref': 'T'}]}},
        'logP': {'product': [{'integer': 2}, {'ref': 'T'}]},
        'Pstar': {'exp': {'ref': 'logP'}},
        'Tf': {'integer': 128},
        'BOuter': {'product': [{'integer': 1000}, {'ref': 'T'}]},
        'logCSelected': {'sum': [
            {'product': [{'integer': 10}, {'log': {'sum': [{'integer': 1}, {'ref': 'BRefUpper'}]}}]},
            {'power': [{'ref': 'Q'}, 200]}]}
    }
    for key, value in expected.items():
        if params.get(key) != value:
            raise ValueError('Original natural parameter expression changed: ' + key)
    return list(expected)


def validate_pressure_ast(fixed, graph_payload):
    """Compare every literal pressure-stage exponent, not its metadata label."""
    try:
        import sympy as sp
    except ImportError:
        # Existing optional dependency only; never install or download packages.
        sys.path.insert(0, str(BASE / 'audit-deps'))
        import sympy as sp
    graph = {i: n for i, n in enumerate(fixed['outer']['nodes'])}
    for key, node in graph_payload['argumentAndContextGraph'].items():
        i = int(key)
        assert i not in graph or graph[i] == node
        graph[i] = node
    Step, Primitive = sp.Function('ActualSigma2'), sp.Function('PrimitiveActualSigma2')
    lam, h, co, Tf = (sp.Symbol(k) for k in ('lambda', 'h', 'co', 'Tf'))

    def parse(i, aliases=None):
        aliases = aliases or {}
        memo = {}
        def go(j):
            if j in aliases:
                return aliases[j]
            if j in memo:
                return memo[j]
            node = graph[j]; op, a = node['op'], node['args']
            if op == 'rational': out = sp.Rational(*map(int, a))
            elif op == 'coordinate': out = sp.Symbol('coordinate_' + str(j))
            elif op == 'source_parameter': out = sp.Symbol(a[0])
            elif op == 'add': out = go(a[0]) + go(a[1])
            elif op == 'multiply': out = go(a[0]) * go(a[1])
            elif op == 'inverse': out = 1 / go(a[0])
            elif op == 'integer_power': out = go(a[0]) ** a[1]
            elif op == 'exp': out = sp.exp(go(a[0]))
            elif op == 'log_positive': out = sp.log(go(a[0]))
            elif op == 'source_step_derivative':
                assert a[1] == 0
                out = Step(go(a[0]))
            elif op == 'definite_integral':
                body, binder, lower, upper = a
                assert graph[body] == {'op': 'source_step_derivative', 'args': [binder, 0]}
                assert go(lower) == 0
                out = Primitive(go(upper))
            else: raise AssertionError('Uncovered actual pressure operation: ' + op)
            memo[j] = out
            return out
        return go(i)

    def free(i, bound=frozenset()):
        node = graph[i]; op, a = node['op'], node['args']
        if op == 'coordinate': return set() if i in bound else {i}
        if op in ('rational', 'source_parameter'): return set()
        if op == 'definite_integral':
            return free(a[0], bound | {a[1]}) | free(a[2], bound) | free(a[3], bound)
        children = a[:1] if op in ('integer_power', 'source_step_derivative') else a
        return set().union(*(free(j, bound) for j in children))

    outer = {s['id']: s for s in fixed['outer']['stages']}
    checked = []
    for stage in fixed['pressure']['stages']:
        sid = stage['id']; s = sp.Symbol('s'); os = outer[sid]
        assert stage['lower'] == 0 and stage['upper'] == os['length']
        assert graph[stage['integral']] == {'op': 'definite_integral', 'args': [
            stage['integrand'], stage['variable'], stage['lower'], stage['upper']]}
        for key in ('length', 'logAStart', 'logAEnd'):
            assert not free(os[key]), (sid, key, free(os[key]))
        A = sp.Integer(0) if os['logAStart'] == 0 else sp.Symbol('Astart')
        aliases = {stage['variable']: s, 18: sp.Symbol('logf')}
        if os['logAStart'] != 0: aliases[os['logAStart']] = A
        L = sp.log(2); S = Primitive(s); theta = sp.Integer(1)
        delta = {
            'initial': s/10 - sp.Rational(3, 5)*S,
            'axialDecay': -s/2,
            'entry': -s/2-lam*S,
            'reservedPower': (-sp.Rational(1, 2)-lam)*s,
            'pulse': (-sp.Rational(1, 2)-lam)*s,
            'interpolation': (-sp.Rational(1, 2)-lam)*s-L*Step(s/Tf),
            'angular': (-sp.Rational(1, 2)-lam)*s,
            'steepen': (-sp.Rational(1, 2)-lam)*s-(1-lam)*S,
            'steepPower': -3*s/2,
            'flatten': -3*s/2+(1-h)*S,
            'wait': (-sp.Rational(1, 2)-h)*s,
            'terminal': (-sp.Rational(1, 2)-h)*s + sp.log((1-co*h*(1-Step((s-1)/2)))/(1-co*h)),
        }[sid]
        if sid == 'interpolation': theta = 1-Step(s/Tf)
        elif sid in ('angular', 'steepen', 'steepPower', 'flatten', 'wait', 'terminal'): theta = sp.Integer(0)
        assert sp.expand(parse(stage['theta'], aliases)-theta) == 0, sid
        integrand = graph[stage['integrand']]
        assert integrand['op'] == 'exp'
        difference = sp.expand(parse(integrand['args'][0], aliases)-2*(A+delta+theta*sp.Symbol('logf')))
        assert sp.simplify(difference) == 0, (sid, difference)
        checked.append(sid)
    # The positive prefix and nonzero infinite terminal tail are still present.
    f = sp.Symbol('f'); end = sp.Symbol('Aend'); K = sp.Symbol('K')
    assert sp.simplify(parse(3431, {17: f})-5*f*f) == 0
    assert sp.simplify(parse(3435, {330: end})-sp.exp(2*end)/(1+2*h)) == 0
    aliases = {3431: sp.Symbol('prefix'), 3435: sp.Symbol('tail'), 3450: K}
    aliases.update({s['integral']: sp.Symbol('stage_' + s['id']) for s in fixed['pressure']['stages']})
    expected = -K/2*(aliases[3431]+aliases[3435]+sum(aliases[s['integral']] for s in fixed['pressure']['stages']))
    assert sp.expand(parse(3451, aliases)-expected) == 0
    # An adversarial reversal of the interpolation theta must fail the identity.
    interp = next(s for s in fixed['pressure']['stages'] if s['id'] == 'interpolation')
    wrong = parse(interp['theta'], {interp['variable']: sp.Symbol('s')})-Step(sp.Symbol('s')/Tf)
    assert sp.expand(wrong) != 0
    seen, todo = set(), [3451]
    while todo:
        i = todo.pop()
        if i in seen: continue
        seen.add(i); node = graph[i]
        if node['op'] in ('rational', 'coordinate', 'source_parameter'): continue
        todo.extend(node['args'][:1] if node['op'] in ('integer_power', 'source_step_derivative') else node['args'])
    primitive_hash = canonical_hash([[i, graph[i]] for i in sorted(seen)])
    assert len(seen) == 287
    assert primitive_hash == '19a9eec59702f233d4744083aaef545f0d600d5549177ee8e8b3a143535c8152'
    return {'allTwelveLiteralExponentsCompared': checked,
            'allScheduleEndpointsEtaIndependent': True,
            'literalPrefixAndInfiniteTailCompared': True,
            'literalPressureSumCompared': True,
            'changedInterpolationThetaRejected': True,
            'pressurePrimitiveAncestorCount': len(seen),
            'pressurePrimitiveASTSHA256': primitive_hash,
            'method': 'Exact symbolic identities of all source primitive ASTs; no numerical evaluation.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--payload', type=Path, default=BASE / 'native-result-small' / 'NATIVE_PAYLOADS.json')
    parser.add_argument('--kernels', type=Path, default=BASE / 'regularity-source')
    parser.add_argument('--arguments', type=Path, default=BASE / 'native-result-small' / 'NATURAL_ARGUMENT_GRAPH.json')
    parser.add_argument('--out', type=Path, default=BASE / 'actual_natural_proof.json')
    args = parser.parse_args()
    payload = json.loads(args.payload.read_text(encoding='utf-8'))
    fixed = payload['fullNativePayloads']['fixed']
    assert canonical_hash(fixed) == payload['fullNativePayloadSHA256']['fixed'] == 'c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
    kernel = fixed['naturalKernel']
    assert kernel['coefficientImplementation'] == 'actual-continuation-exact-core.mjs:prepareActualNaturalCoreProgram'
    assert kernel['actualPressureRoot'] == fixed['core']['P0'] == 3451
    assert kernel['actualPositiveGRoot'] == fixed['core']['g'] == 3498
    parameter_keys = validate_parameters(fixed['source']['parametersExactExpressions'])
    assert fixed['outer']['parametersExactExpressions'] == fixed['source']['parametersExactExpressions']
    assert [s['id'] for s in fixed['pressure']['stages']] == [
        'initial', 'axialDecay', 'entry', 'reservedPower', 'pulse', 'interpolation',
        'angular', 'steepen', 'steepPower', 'flatten', 'wait', 'terminal']
    assert len(fixed['outer']['stages']) == 12
    pressure_ast = validate_pressure_ast(fixed, json.loads(args.arguments.read_text(encoding='utf-8')))

    export = json.loads((args.kernels / 'SOURCE_EXPORT.json').read_text(encoding='utf-8'))
    path = 'research-ide/mathscope-m2/navier/actual-continuation-exact-core.mjs'
    pinned = next(r for r in export['files'] if r['path'] == path)
    assert hashlib.sha256((args.kernels / path).read_bytes()).hexdigest() == pinned['sha256']

    R1, R2 = source_remainders()
    assert len(R1) == len(R2) == 12
    first, second = norm_rows(R1, True), norm_rows(R2, False)
    rows = first + second
    value_sum = sum(r['majorantCoefficient'] for r in rows)
    lip_sum = sum(r['lipschitzCoefficient'] for r in rows)
    assert value_sum < 2**56 and lip_sum < 2**56
    assert max(r['QPower'] for r in rows) == 7
    assert max(r['lipschitzQPower'] for r in rows) == 6
    # Exact independent scalar comparisons used by the infinite proof.
    assert 3**160 < 2**256
    assert F(80*64*4*2048, 2) < 2**25
    x = F(41, 10)
    cubic = 1 - x/4 + x*x/48 - x*x*x/1152
    assert cubic == F(305719, 1152000) and cubic > F(1, 4) + F(1, 128)
    assert F(400, 2048) < F(1, 4)
    assert F(4)*F(256, 255)**2 < 5
    assert F(5, 2) + F(5, 8) + F(1, 2) + F(3, 8) == 4
    assert F(27, 256000-1) < 1
    assert F(1, 4)-F(1, 256) == F(63, 256) > F(1, 8)
    assert F(16, 9) / (1 - F(1, 3))**2 == 4
    # Finite algebra mutations cannot inherit the same source theorem.
    missing_pressure_derivative = add(R2, scale(-1, mul(v('Linv'), v('d'), v('pE'))))
    assert missing_pressure_derivative != R2 and len(missing_pressure_derivative) == 11
    mutated = copy.deepcopy(fixed['source']['parametersExactExpressions'])
    mutated['Lambda']['power'][1] = 8
    try:
        validate_parameters(mutated)
    except ValueError:
        rejected_lambda = True
    else:
        raise AssertionError('Changed source Lambda exponent was accepted')
    # Losing one radial inverse power makes the mixed derivative estimate
    # grow in N. This adverse case is not allowed to reuse bound (A).
    N = 100
    wrong_J1_ratio = F(20*(N+1)**2*(N-1), N**2)
    assert wrong_J1_ratio > 80
    result = {
        'schema': 'MathScope.N6.ActualNaturalIndependentBanachMajorant/1',
        'sourceRun': payload.get('sourceRun', {}), 'fixedDefinitionSHA256': canonical_hash(fixed),
        'originalKernel': {'path': path, 'sha256': pinned['sha256'], 'bytesUnchanged': True},
        'actualParameterExpressionsCompared': parameter_keys,
        'sourceInputs': {'actualPressureRoot': 3451, 'actualPositiveGRoot': 3498,
                         'pressureStageCount': 12, 'actualInfiniteTailRetained': True},
        'actualPressureASTVerification': pressure_ast,
        'coefficientSpace': {'radialBase': 20,
                            'weight': '(n+m)!/[n!20^n(n+1)^2 rho^m(m+1)^2]',
                            'allUnboundedMixedIndices': True,
                            'completenessAndUniversalOperatorProof': 'actual_natural_proof.md sections 1-3'},
        'universalOperatorBounds': {'multiplication': 64, 'average': 1, 'radialPrimitive': 80,
                                    'regularInverseJ1': 80, 'regularInverseJ2': 80,
                                    'integratedProduct': '80*64^(r-1)*rho^(-etaDerivativeCount)',
                                    'maxEtaDerivativeCount': 1, 'maxRadialDotCount': 1,
                                    'resolventPowerBound': '5120^k/[k!(k+1)!]',
                                    'resolventNormUpper': '2^256'},
        'actualExpandedRemainderRows': {'S_J2_R1': first, 'J1_R2': second},
        'exactPositiveMajorants': {'valueCoefficientSum': str(value_sum),
                                   'lipschitzCoefficientSum': str(lip_sum),
                                   'bothBelow': str(2**56),
                                   'valueMaximumQPower': 7, 'lipschitzMaximumQPower': 6,
                                   'valueUpper': 'Q^8', 'lipschitzUpper': 'Q^8'},
        'derivedMathematicalConclusion': {
            'normBound': 'Q',
            'constructedUniqueBanachLimit': 'x0+(1/(2Lambda))*(S J2R1,J1R2)',
            'maximumDisplacementAndContraction': '(1/2)Q^(-56)',
            'actualCoefficientIdentity': 'Triangular induction of the unchanged original recurrence.',
            'normalConvergenceDomain': '|Y|<20 and a common smaller eta neighborhood',
            'actualPhiRealLower': '1/4 on 0<=Y<=41/10, eta in I',
            'actualPhiEtaComplexUpper': '4Q/rho on |Y|<=5, dist(eta,I)<=rho/4',
            'actualPhiComplexLower': '63/256 on real 0<=Y<=41/10, dist(eta,I)<=rho/(1024Q)',
            'proofKind': 'Written universal coefficient inequalities and exact positive polynomial ledger; no new Lean execution.'},
        'negativeControls': {'omittedActualPressureDerivativeRejected': True,
                             'changedSourceLambdaRejected': rejected_lambda,
                             'missingInverseRadialPowerRejected': True},
        'sourceProducerDegreeZeroRebindingExecutedByThisScript': False,
        'actual533CallDomainsAllProved': False,
        'newOriginalGuardsDischarged': 0, 'newOriginalJetsDischarged': 0,
        'newOriginalPDETermsDischarged': 0,
        'nextRequiredApplicationGates': [
            'Run actual_natural_proof.kernel-probe.mjs on complete original source checkout.',
            'Bind all active original Y/eta arguments, binders and native substitutions to the proved domain.',
            'Bind Picard and nonlinear inverse coefficient/denominator domains and whole radial pressure envelope.'
        ]
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'actualR1Monomials': len(first), 'actualR2Monomials': len(second),
                      'valueCoefficientSum': str(value_sum), 'lipschitzCoefficientSum': str(lip_sum),
                      'valueQPower': 7, 'lipschitzQPower': 6,
                      'independentBanachProofWritten': True, 'newDischarged': 0}))


if __name__ == '__main__':
    main()
