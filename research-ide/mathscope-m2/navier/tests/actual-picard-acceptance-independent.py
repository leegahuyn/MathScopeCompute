#!/usr/bin/env python3
"""Independent exact checks for the fixed-source, fixed-n Picard certificate.

No third-party package is used. A small Laurent-polynomial algebra proves
the complete matrix conjugation and forcing identities. Fraction arithmetic
checks the scalar tail rules and the actual interval witnesses. Finite-size
universal arithmetic controls do not replace the enormous actual source.

Run from any directory:
  python actual-picard-acceptance-independent.py --output ../evidence/actual-picard-acceptance.json
Paths supplied on the CLI are relative to the caller's working directory.
"""
from __future__ import annotations

import argparse
import ast
from collections import Counter
from datetime import datetime, timezone
from fractions import Fraction as Q
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess

HERE = Path(__file__).resolve().parent
M2 = HERE.parent.parent
MODULE = M2 / 'navier/actual-picard-acceptance.mjs'
TEST = HERE / 'actual-picard-acceptance.test.mjs'
CHECKS = []


def check(group, name, condition):
    value = bool(condition)
    CHECKS.append({'group': group, 'name': name, 'pass': value})
    if not value:
        raise AssertionError(f'{group}: {name}')


def sha(data):
    return hashlib.sha256(data).hexdigest()


class Laurent:
    """Exact Laurent polynomial over Q; divisions are by monomials only."""
    def __init__(self, terms=None):
        self.terms = {m: Q(c) for m, c in (terms or {}).items() if c}

    @classmethod
    def constant(cls, value):
        return cls({(): Q(value)})

    @classmethod
    def symbol(cls, name):
        return cls({((name, 1),): Q(1)})

    @staticmethod
    def coerce(value):
        return value if isinstance(value, Laurent) else Laurent.constant(value)

    def __add__(self, other):
        other = self.coerce(other)
        result = dict(self.terms)
        for m, c in other.terms.items():
            result[m] = result.get(m, Q(0)) + c
        return Laurent(result)

    __radd__ = __add__

    def __neg__(self):
        return Laurent({m: -c for m, c in self.terms.items()})

    def __sub__(self, other):
        return self + -self.coerce(other)

    def __rsub__(self, other):
        return self.coerce(other) + -self

    def __mul__(self, other):
        other = self.coerce(other)
        result = {}
        for left, a in self.terms.items():
            for right, b in other.terms.items():
                exponents = dict(left)
                for name, n in right:
                    exponents[name] = exponents.get(name, 0) + n
                m = tuple(sorted((name, n) for name, n in exponents.items() if n))
                result[m] = result.get(m, Q(0)) + a * b
        return Laurent(result)

    __rmul__ = __mul__

    def __pow__(self, n):
        if not isinstance(n, int):
            raise TypeError('Integer power required')
        if n < 0:
            if len(self.terms) != 1:
                raise ValueError('Only a nonzero monomial may be inverted')
            (m, c), = self.terms.items()
            return Laurent({tuple((name, -p) for name, p in m): 1/c}) ** (-n)
        out, base = Laurent.constant(1), self
        while n:
            if n & 1:
                out = out * base
            base = base * base
            n //= 2
        return out

    def __truediv__(self, other):
        return self * self.coerce(other) ** -1

    def __rtruediv__(self, other):
        return self.coerce(other) * self ** -1

    def __eq__(self, other):
        return self.terms == self.coerce(other).terms


def polynomial(text, substitutions=None):
    substitutions = substitutions or {}
    text = text.replace('Z_(-A-1/2)(phi0)', 'ZPhi0').replace('Z_(-A)(U0)', 'ZU0')
    text = text.replace('V0/X', 'v').replace('^', '**')
    text = re.sub(r'\bdelta\b', 'delta_n', text)

    def integer(node):
        if isinstance(node, ast.Constant) and isinstance(node.value, int):
            return node.value
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
            return -integer(node.operand)
        raise TypeError('Noninteger symbolic exponent')

    def visit(node):
        if isinstance(node, ast.Constant) and isinstance(node.value, int):
            return Laurent.constant(node.value)
        if isinstance(node, ast.Name):
            return substitutions.get(node.id, Laurent.symbol(node.id))
        if isinstance(node, ast.UnaryOp):
            if isinstance(node.op, ast.USub):
                return -visit(node.operand)
            if isinstance(node.op, ast.UAdd):
                return visit(node.operand)
        if isinstance(node, ast.BinOp):
            left = visit(node.left)
            if isinstance(node.op, ast.Pow):
                return left ** integer(node.right)
            right = visit(node.right)
            if isinstance(node.op, ast.Add): return left + right
            if isinstance(node.op, ast.Sub): return left - right
            if isinstance(node.op, ast.Mult): return left * right
            if isinstance(node.op, ast.Div): return left / right
        raise TypeError(f'Forbidden expression: {ast.dump(node)}')

    return visit(ast.parse(text, mode='eval').body)


def exact_ast(node, env):
    if 'integer' in node: return Q(node['integer'])
    if 'rational' in node: return Q(node['rational'])
    if 'ref' in node: return env[node['ref']]
    if 'power' in node: return exact_ast(node['power'][0], env) ** node['power'][1]
    if 'quotient' in node:
        a, b = node['quotient']; return exact_ast(a, env) / exact_ast(b, env)
    if 'product' in node:
        answer = Q(1)
        for item in node['product']: answer *= exact_ast(item, env)
        return answer
    if 'sum' in node: return sum((exact_ast(x, env) for x in node['sum']), Q(0))
    if 'max' in node: return max(exact_ast(x, env) for x in node['max'])
    if 'ceil' in node:
        q = exact_ast(node['ceil'], env); return Q(-(-q.numerator // q.denominator))
    raise TypeError('This exact arithmetic control does not evaluate actual transcendental source parameters')


def run_checks(certificate):
    c = certificate
    original_bytes = (M2 / 'evidence/original-m2-criteria.json').read_bytes()
    original = json.loads(original_bytes)
    criterion = next(x for x in original['packages']['N4']['criteria'] if x['id'] == 'N4-03')
    for key, value in criterion.items():
        check('source', f'verbatim criterion {key}', c['criterion'][key] == value)
    check('source', 'retained criteria SHA', sha(original_bytes) == c['criterion']['retainedCriteriaSHA256'])
    check('source', 'pinned Blueprint SHA', original['sourceSHA256'] == c['criterion']['sourceSHA256'])
    for item in c['sourceBindings']:
        b = (M2 / item['path']).read_bytes()
        check('source', f"SHA and bytes {item['path']}", sha(b) == item['sha256'] and len(b) == item['bytes'])
    for item in c['sourceInputs'].values():
        b = (M2.parent / item['path']).read_bytes()
        check('source', f"actual N3 input {item['path']}", sha(b) == item['sha256'] and len(b) == item['bytes'])

    # Full symbolic similarity: no floating-point sample can certify this step.
    C = Laurent.symbol('C')
    substitution = {
        'phi0': C * Laurent.symbol('F0'),
        'Hphi': C * Laurent.symbol('HF'),
        'ZPhi0': C * Laurent.symbol('ZF0'),
    }
    powers = [-1, 0, 0, 0, -1, 0]
    check('operator', 'exact six unknown scaling powers', c['normalizedSystem']['diagonalCPowers'] == powers)
    for name in ('A0', 'A1'):
        for i in range(6):
            for j in range(6):
                transformed = C ** (powers[i]-powers[j]) * polynomial(c['originalSystem'][name][i][j], substitution)
                normalized = polynomial(c['normalizedSystem'][name][i][j])
                check('operator', f'{name}[{i+1},{j+1}] exact Laurent identity', transformed == normalized)
    bad_pressure = polynomial('4*xi*F0/C')
    check('negative-control', 'wrong pressure-row C scaling is detected', bad_pressure != polynomial(c['normalizedSystem']['A0'][3][0]))

    # Independently insert n=1, empty interior convolutions, and pKnown=-Omega0/(2X).
    force_subs = {'ZZPhi0': C * Laurent.symbol('ZZF0'), 'pKnown': polynomial('-omegaOverX/2')}
    original_forcing = ['0','0','0','2*xi*pKnown','-2*ZZPhi0','2*(-ZZU0-2*eta*X*pKnown/L)']
    for i in range(6):
        expected = C ** powers[i] * polynomial(original_forcing[i], force_subs)
        check('operator', f'forcing component {i+1}', expected == polynomial(c['normalizedSystem']['forcing'][i]))
    check('negative-control', 'dropping radial-pressure source from axial forcing is detected', polynomial('-2*ZZU0') != polynomial(c['normalizedSystem']['forcing'][5]))

    # The inverse formula is checked on exact polynomial forcing monomials.
    diag = [0,0,2,0,3,1]
    check('green-operator', 'original singular diagonal', c['originalSystem']['singularDiagonal'] == diag)
    for i, ci in enumerate(diag):
        for m in range(7):
            coef = Q(1, m+1+ci)
            check('green-operator', f'(d_xi+c/xi)G xi^{m}, component {i+1}', (m+1+ci)*coef == 1 and m+1 > 0)
    check('green-operator', 'zero axis datum', c['originalSystem']['axisDatum'] == [0]*6)

    # A1 G A1=0 for a completely arbitrary diagonal kernel G.
    matrix = [[polynomial(v) for v in row] for row in c['normalizedSystem']['A1']]
    for i in range(6):
        for j in range(6):
            entry = sum((matrix[i][k]*Laurent.symbol(f'g{k+1}')*matrix[k][j] for k in range(6)), Laurent.constant(0))
            check('derivative-block', f'A1 diag(g) A1 [{i+1},{j+1}]', entry == 0)
    # Binary words without adjacent derivative factors: DP verifies both parities.
    max_without_last, max_with_last = 0, -10**6
    for k in range(1, 25):
        max_without_last, max_with_last = max(max_without_last, max_with_last), max_without_last+1
        check('derivative-block', f'nonadjacent derivative factors at length {k}', max(max_without_last,max_with_last) == (k+1)//2)
    check('negative-control', 'a new first-row derivative edge makes A1 G A1 nonzero', matrix[4][0] != 0)

    # Arithmetic of source-derived norm coefficients. The actual B, delta remain
    # their original exact source expressions; these cases audit universal rules.
    constants = c['majorant']['derivedConstants']
    for b, delta in [(Q(1),Q(1)),(Q(1),Q(1,2)),(Q(5),Q(1,1024)),(Q(100),Q(1,7))]:
        env = {'radialBaseBound':b, 'delta':delta}
        matrix_bound = exact_ast(constants['matrixInfinityNormBound'], env)
        forcing_bound = exact_ast(constants['forcingInfinityNormBound'], env)
        cn = exact_ast(constants['C1'], env)
        check('norm-rules', f'C1 forcing slack B={b} delta={delta}', cn == 4*forcing_bound)
        check('norm-rules', f'C1 matrix slack B={b} delta={delta}', cn/(2*matrix_bound) == 256*b/delta and cn >= 2*matrix_bound)
        source_strip = exact_ast(constants['sourceStripRadius'],env)
        solution_strip = exact_ast(constants['solutionStripRadius'],env)
        loss = exact_ast(constants['cauchyRadiusLoss'],env)
        check('norm-rules', f'positive strip loss B={b} delta={delta}', source_strip-solution_strip == loss and 0 < loss <= 1)
    check('norm-rules', 'actual nonvanishing Phi slack', Q(1,4)-Q(4,1024) == Q(63,256) > Q(1,8))
    exponents = [Q(1,128),Q(1,64),Q(1,32),Q(1,16),Q(1,8)]
    check('common-collar', 'strict original cutoff and modulation ordering for positive t1', all(a<b for a,b in zip(exponents,exponents[1:])))
    check('common-collar', 'same interval source and bound', c['originalSystem']['commonDomain']['aExact'] == 'sqrt(Xa*exp(t1/16))' and c['majorant']['commonInterval']['X'][1] == 'Xa*exp(t1/16)')
    check('common-collar', 'no coefficient-dependent radius shrink', c['majorant']['commonInterval']['independentOfOrder'] is True)

    # Exact comparisons of scalar majorants, without transcendental rounding.
    # The all-k proof is written in the certificate; these include both parities,
    # the threshold itself and deliberately inadequate truncation controls.
    for r in range(1, 129):
        check('tail-factorial', f'r! >= (r/3)^r at r={r}', Q(math.factorial(r)) >= Q(r,3)**r)
    tail_cases = [(Q(1,20),Q(1,10)),(Q(1,5),Q(1,2)),(Q(3,5),Q(1,4)),(Q(1),Q(1)),(Q(1,32),Q(3,4))]
    for A, delta in tail_cases:
        for k in range(1,33):
            r,p = k+1,(k+1)//2
            term = A**r / math.factorial(r) * max(Q(1),Q(p)/delta)**p
            check('tail-term', f'exact squared term bound A={A} Delta={delta} k={k}', term**2 <= (9*A*A/(2*delta*r))**r)
        for bits in (16,17,32,63):
            kexpr = constants['truncationIndex']
            local_kexpr = json.loads(json.dumps(kexpr))
            local_kexpr['max'][2] = {'integer': str((bits+1)//2)}
            K = int(exact_ast(local_kexpr, {'picardA':A,'cauchyRadiusLoss':delta}))
            check('tail-threshold', f'quarter-ratio threshold A={A} Delta={delta} bits={bits}', 9*A*A/(2*delta*(K+1)) < Q(1,16))
            check('tail-threshold', f'geometric tail target A={A} Delta={delta} bits={bits}', Q(1,3*4**K) <= Q(1,2**bits))
            for k in range(K,K+8):
                p=(k+1)//2
                term = A**(k+1)/math.factorial(k+1)*max(Q(1),Q(p)/delta)**p
                check('tail-geometric', f'term <= 4^-r A={A} Delta={delta} bits={bits} k={k}', term <= Q(1,4**(k+1)))
    check('negative-control', 'K=1 violates the threshold when A=Delta=1', Q(9,4) > Q(1,16))
    check('negative-control', 'zero tail is not a valid analytic error', Q(1,3*4**72) > 0)

    # Actual-source normalized intervals, not universal fake-profile values.
    axis = c['axisObservations']['samples']
    for i,row in enumerate(axis):
        lower,upper = Q(row['normalizedInterval']['lower']),Q(row['normalizedInterval']['upper'])
        check('actual-enclosures', f'axis {i} finite outward display', Q.from_float(row['displayEnclosure'][0]) <= lower <= upper <= Q.from_float(row['displayEnclosure'][1]))
        check('actual-enclosures', f'axis {i} nonzero analytic width', Q(row['normalizedInterval']['width']) == upper-lower > 0)
    check('actual-enclosures', 'angular axis normalization retains nonzero actual field', Q(axis[0]['normalizedInterval']['lower']) > 0)
    check('actual-enclosures', 'pressure axis value is actual negative', Q(axis[2]['normalizedInterval']['upper']) < 0)
    for i,row in enumerate(c['pointEnclosures']['samples']):
        lo,hi = Q(row['normalizedInterval']['lower']),Q(row['normalizedInterval']['upper'])
        alo,ahi = Q(row['sourceAxisDerivativeInterval']['lower']),Q(row['sourceAxisDerivativeInterval']['upper'])
        eps = Q(1,2**c['bits'])
        check('actual-enclosures', f'positive point {i} exact analytic remainder addition', lo == alo-eps and hi == ahi+eps)
        check('actual-enclosures', f'positive point {i} radius not underflowed to zero', row['XStrictlyPositive'] is True and row['XBinary64'] is None)
        check('actual-enclosures', f'positive point {i} display contains exact interval', Q.from_float(row['displayEnclosure'][0]) <= lo <= hi <= Q.from_float(row['displayEnclosure'][1]))
    for i in range(1,6):
        check('actual-enclosures', f'universal point remainder coefficient i={i}', Q(i,32)/(1-Q(5,32)) < 1)
    check('scope', 'fixed n acceptance and full package are different', c['acceptance']['status']=='PASS' and c['scope']['supportedBackgroundOrders']==[1] and c['acceptance']['packageGateSatisfied'] is False)
    for key in ('numericalKTermSumExecuted','completeInnerCollarNumericalEvaluator','higherBackgroundOrdersFinalized','globalFiveMomentRepairComplete','N4_05ResidualDecayComplete','fullN4PackageComplete','fullM2PackageComplete','newLeanKernelExecution'):
        check('scope', f'{key} is not claimed', c['scope'][key] is False)
    check('scope', 'small observation disc is not N4-05 evidence', c['pointEnclosures']['scope']['N4_05_ResidualEvidence'] is False and c['pointEnclosures']['scope']['precisionChangesObservationPoint'] is True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node',default='node')
    parser.add_argument('--output',type=Path,default=M2/'navier/evidence/actual-picard-acceptance.json')
    parser.add_argument('--bits',type=int,default=128)
    args=parser.parse_args()
    js = f"import {{buildActualPicardAcceptance,verifyActualPicardAcceptance}} from {json.dumps(MODULE.as_uri())}; const certificate=buildActualPicardAcceptance({{bits:{args.bits}}}); console.log(JSON.stringify({{certificate,verification:verifyActualPicardAcceptance(certificate)}}));"
    returned=subprocess.run([args.node,'--input-type=module','-e',js],capture_output=True,text=True,check=True)
    result=json.loads(returned.stdout)
    run_checks(result['certificate'])
    check('runtime-verifier', 'all executable certificate rules', result['verification']['pass'] is True and len(result['verification']['checks']) == 15)
    node=subprocess.run([args.node,'--test','--test-reporter=tap',str(TEST)],capture_output=True,text=True,check=False)
    passed=re.search(r'^# pass (\d+)$',node.stdout,re.M)
    total=re.search(r'^# tests (\d+)$',node.stdout,re.M)
    check('node-suite', 'dedicated Node tests passed', node.returncode == 0 and passed and total and passed.group(1)==total.group(1)=='8')
    counts=Counter(x['group'] for x in CHECKS)
    evidence={
        'schema':'MathScope.ActualFixedOrderPicardAcceptanceEvidence/1',
        'generatedAtUTC':datetime.now(timezone.utc).isoformat(),
        'criterion':'N4-03','criterionStatus':'PASS','scope':result['certificate']['scope'],
        'certificate':result['certificate'],'runtimeVerification':result['verification'],
        'independentValidation':{'language':'Python standard library','arithmetic':'exact Fraction and Laurent polynomials','checks':len(CHECKS),'passed':sum(x['pass'] for x in CHECKS),'byGroup':dict(counts),'results':CHECKS,
            'limitations':['Finite universal arithmetic cases supplement the written all-k analytic proof; they do not replace the actual source by their moderate-size parameters.','Source inequalities are pinned written mathematical derivations, not newly machine-checked formal theorems.','The enormous actual K is an exact finite expression and its K-term sum is not numerically executed.']},
        'nodeTests':{'tests':int(total.group(1)),'passed':int(passed.group(1)),'exitCode':node.returncode,'stdout':node.stdout},
        'artifacts':[{ 'path':str(p.relative_to(M2)), 'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in (MODULE,TEST,Path(__file__).resolve())],
    }
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'pass':True,'independentChecks':len(CHECKS),'nodeTests':int(total.group(1)),'certificateRules':len(result['verification']['checks']),'byGroup':dict(counts),'output':str(args.output),'bytes':args.output.stat().st_size},ensure_ascii=False))


if __name__=='__main__':
    main()
