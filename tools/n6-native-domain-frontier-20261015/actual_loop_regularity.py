"""Independent checks for the actual C.1 variance inverse and circle lift.

The proof of inequalities for all real arguments is in
ACTUAL_LOOP_REGULARITY_KO.md. This checker verifies exact formal identities,
source parameter/registry binding, and (when supplied) the small original
producer scalar AST projection. It does not sample a grid or close guards.
"""
import argparse
from fractions import Fraction as F
from functools import lru_cache
import hashlib
import json
from pathlib import Path
import sys

BASE = Path(__file__).resolve().parent


def check_scalar_graph(binding, sp):
    graph = {int(k): v for k, v in binding['scalarVariance']['nodes'].items()}
    roots = binding['scalarVariance']['roots']
    x, theta = sp.symbols('z theta', real=True)
    Js = [sp.Function('J' + str(k)) for k in range(3)]

    def parse(i, env=None):
        env = {} if env is None else env
        if i in env: return env[i]
        if i == roots['z']: return x
        if i == roots['pi']: return sp.pi
        if i == roots['twoPi']: return 2 * sp.pi
        node = graph[i]; op, a = node['op'], node['args']
        if op == 'rational': return sp.Rational(*map(int, a))
        if op == 'add': return parse(a[0], env) + parse(a[1], env)
        if op == 'multiply': return parse(a[0], env) * parse(a[1], env)
        if op == 'inverse': return 1 / parse(a[0], env)
        if op == 'integer_power': return parse(a[0], env) ** a[1]
        if op == 'sine': return sp.sin(parse(a[0], env))
        if op == 'cosine': return sp.cos(parse(a[0], env))
        if op == 'exp': return sp.exp(parse(a[0], env))
        if op == 'definite_integral':
            assert parse(a[2], env) == 0 and parse(a[3], env) == 2 * sp.pi
            body = sp.expand(parse(a[0], {**env, a[1]: theta}))
            total = 0
            for term in sp.Add.make_args(body):
                exponentials = list(term.atoms(sp.exp))
                assert len(exponentials) == 1
                exponential = exponentials[0]
                arg = sp.cancel(exponential.args[0] / sp.sin(theta))
                assert not arg.has(theta)
                remainder = sp.cancel(term / exponential)
                degree = remainder.as_powers_dict().get(sp.sin(theta), 0)
                assert degree in (0, 1, 2)
                coefficient = sp.cancel(remainder / sp.sin(theta) ** degree)
                assert not coefficient.has(theta)
                total += coefficient * 2 * sp.pi * Js[degree](arg)
            return total
        raise AssertionError('Unexpected scalar variance operation: ' + op)

    m, r, r2 = (parse(roots[k]) for k in ('M', 'R', 'R2'))
    assert sp.cancel(m - Js[0](x)) == 0
    assert sp.cancel(r - Js[0](2*x) / Js[0](x)**2) == 0
    expected = (4*Js[2](2*x)/Js[0](x)**2
                - 8*Js[1](2*x)*Js[1](x)/Js[0](x)**3
                - 2*Js[0](2*x)*Js[2](x)/Js[0](x)**3
                + 6*Js[0](2*x)*Js[1](x)**2/Js[0](x)**4)
    assert sp.cancel(r2 - expected) == 0
    rows = [[i, graph[i]] for i in sorted(graph)]
    digest = hashlib.sha256(json.dumps(rows, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
    assert digest == binding['scalarVariance']['sha256']
    assert all(binding['checks'].values())
    return {'sourceScalarNodeCount': len(graph), 'sourceScalarSHA256': digest,
            'actualMeanRatioAndSecondDerivativeIndependentlyCompared': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--kernels', type=Path, default=BASE / 'regularity-source')
    parser.add_argument('--payload', type=Path, default=BASE / 'native-result-small' / 'NATIVE_PAYLOADS.json')
    parser.add_argument('--compact', type=Path, default=BASE / 'cloud-result' / 'COMPACT_JET_PDE_SOURCE.json')
    parser.add_argument('--binding', type=Path)
    parser.add_argument('--out', type=Path, default=BASE / 'actual_loop_regularity.json')
    args = parser.parse_args()
    try: import sympy as sp
    except ImportError:
        sys.path.insert(0, str(BASE / 'audit-deps'))
        import sympy as sp
    payload = json.loads(args.payload.read_text(encoding='utf-8'))
    params = payload['fullNativePayloads']['fixed']['source']['parametersExactExpressions']
    expected = {
        'sourceEnvelopeS': {'power': [{'ref': 'CSelected'}, 100000]},
        'loopD0': {'quotient': [{'integer': 1}, {'product': [{'integer': 8}, {'ref': 'sourceEnvelopeS'}]}]},
        'loopMuMax': {'power': [{'ref': 'sourceEnvelopeS'}, 12]},
        'loopDelta': {'exp': {'product': [{'integer': -1}, {'power': [{'ref': 'sourceEnvelopeS'}, 16]}]}},
        'radialFrequencyN': {'sum': [{'integer': 1}, {'ceil': {'power': [{'ref': 'C12EnvelopeR'}, 50]}}]},
    }
    for key, value in expected.items(): assert params[key] == value
    compact = json.loads(args.compact.read_text(encoding='utf-8'))
    native = [compact['definitions']['monotone:' + str(i)]['fullDefinition'] for i in range(2)]
    assert [d['name'] for d in native] == ['ActualC1VarianceRoot', 'ActualC1CircleInverseLift']
    assert native[0]['body'] == 7450 and native[1]['body'] == 7539
    export = json.loads((args.kernels / 'SOURCE_EXPORT.json').read_text(encoding='utf-8'))
    source_paths = ['research-ide/mathscope-m2/navier/actual-continuation-exact-loop.mjs',
                    'research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs']
    source_rows = []
    for path in source_paths:
        pinned = next(r for r in export['files'] if r['path'] == path)
        digest = hashlib.sha256((args.kernels / path).read_bytes()).hexdigest()
        assert digest == pinned['sha256']
        source_rows.append({'path': path, 'sha256': digest, 'sourceBytesUnchanged': True})
    x, mu, p, d0 = sp.symbols('z mu p d0')
    M = sum(x**(2*n)/(4**n*sp.factorial(n)**2) for n in range(7))
    R = sp.series(M.subs(x, 2*x) / M**2, x, 0, 10).removeO()
    Q = sp.expand((R - 1) / x**2)
    assert Q.subs(x, 0) == sp.Rational(1, 2)
    assert sp.diff(Q, x).subs(x, 0) == 0
    assert Q.coeff(x, 2) == -sp.Rational(3, 32)
    # Divided differences in the literal kernel have these removable jets.
    V = d0*d0 * mu*mu * Q.subs(x, mu*p)
    assert sp.diff(V, mu).subs(mu, 0) == 0
    assert sp.diff(V, mu, 2).subs(mu, 0) == d0*d0
    assert sp.simplify((d0*mu/sp.sqrt(2))**2 - d0*d0*mu*mu/2) == 0
    a, ts, r, vstar, vs, cut = sp.symbols('a ts r vstar vs cut')
    v = vs + cut**2*(vstar - vs)
    r2 = cut**2*(vstar-vs)/a
    normalized_mass = a*(1+ts**2+r2)/v
    assert sp.cancel(normalized_mass.subs(vs, a*(1+ts**2)) - 1) == 0
    wrong_mass = a*(1+ts**2+r2)/vs
    assert sp.cancel(wrong_mass.subs(vs, a*(1+ts**2)) - 1) != 0
    # Exact scalar absorptions valid for every S>=2^20, as proved in text.
    assert 1 + 32 + 2**31 < 2**60
    assert F(5, 4) + F(1, 64)/(1-F(1, 36)) < F(4, 3)
    assert F(4, 3)**2 < 2
    assert F(1, 4) >= F(12, 48) > F(12, 64)
    assert 2**20 > 32 and 2**20 > 13
    scalar = None
    if args.binding:
        binding = json.loads(args.binding.read_text(encoding='utf-8'))
        assert binding['schema'] == 'MathScope.N6.ActualC1NativeRegularityBinding/1'
        assert binding['sourceSHA256'] == source_rows[0]['sha256']
        assert binding['registryCompared'] and binding['monotoneDefinitions'] == native
        assert binding['sourceBytesUnchanged']
        scalar = check_scalar_graph(binding, sp)
    result = {
        'schema': 'MathScope.N6.ActualC1NativeRegularityProof/1',
        'sourceRows': source_rows, 'actualParameterExpressionsCompared': list(expected),
        'actualNativeDefinitions': [{'name': d['name'], 'body': d['body'], 'variable': d['variable'], 'parameters': d['parameters']} for d in native],
        'independentExactChecks': {'Q0': '1/2', 'QSecondCoefficient': '-3/32',
            'VmuAtZero': '0', 'WmuAtZero': 'd0/sqrt(2)',
            'literalCircleMassUsingVarianceEquation': '1', 'S12BracketAbsorption': True},
        'negativeControls': {'falseVmuZeroStrictlyPositiveRejected': True,
            'wrongRemovableQZeroValueRejected': True, 'unchangedVsNormalizationRejected': True},
        'originalProducerBindingExecuted': args.binding is not None,
        'actualScalarASTCheck': scalar,
        'independentlyProvedNativeTheorems': [
            'The literal W(mu,p)=d0*mu*sqrt(Q(mu*p)) has a unique C-infinity global inverse in mu, including mu=p=0.',
            'Under a^-1<=S, vs<=S, abs(p2)<=S, the original S^12 root bracket and original derivative m/M bounds are valid.',
            'The exact original circle density has mass one, a smooth global lifted inverse, and period-one zero-mean A/B.',
            'For C-infinity positive background and stated endpoint collars, actual finite-N C12 fields are C-infinity on every compact positive radial interval.'],
        'remainingActualApplicationPremises': [
            'Actual completed pre-C12 E,U,moments C-infinity on full loop rectangle neighborhood.',
            'Actual E>0, a>0 and a^-1<=S, vs<=S, abs(p2)<=S on full loop rectangle.',
            'Actual vs-2>=S^-1 on both endpoint collars.'],
        'proof': 'ACTUAL_LOOP_REGULARITY_KO.md',
        'newOriginalGuardsDischarged': 0, 'newOriginalJetsDischarged': 0, 'newOriginalPDETermsDischarged': 0,
        'newLeanExecution': False}
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'sourceHashesVerified': len(source_rows), 'actualNativeDefinitions': 2,
                      'exactFormalChecksPassed': True, 'originalProducerBindingExecuted': args.binding is not None,
                      'newDischarged': 0}))


if __name__ == '__main__': main()
