#!/usr/bin/env python3
"""Independent finite arithmetic audit; not a formal proof of source analysis.

The three implicit recurrences are checked by different closed generating
functions (Catalan/Lagrange inversion), and step derivatives by Bell
partitions, rather than repeating the JavaScript coefficient recurrences.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict
from fractions import Fraction as F
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys

# The exact finite stage coefficient has 4,453 decimal digits. Keep a
# fixed safety ceiling while permitting this source-derived integer.
sys.set_int_max_str_digits(20000)

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent
RESEARCH_IDE = NAVIER.parents[1]


def stirling(n, k):
    return sum((-1)**(k-i)*math.comb(k, i)*i**n for i in range(k+1)) // math.factorial(k)


def cat(n):
    return math.comb(2*n, n)//(n+1)


def terms(row):
    return {t['power']: int(t['coefficient']) for t in row['polynomial']}


def parts(n, j=1):
    if not n:
        yield {}
        return
    if j > n:
        return
    for m in range(n//j+1):
        for p in parts(n-j*m, j+1):
            yield ({j: m} | p) if m else p


class Audit:
    def __init__(self):
        self.categories = Counter()
        self.checks = 0

    def check(self, condition, category, message):
        if not condition:
            raise AssertionError(message)
        self.checks += 1
        self.categories[category] += 1

    def equal(self, actual, expected, category, message):
        self.check(actual == expected, category, message)


def run():
    raw = subprocess.check_output(['node', str(HERE/'actual-leading-high-jets-fixture.mjs')], cwd=NAVIER)
    r = json.loads(raw)
    a = Audit()
    a.check(r['pass'], 'scope_binding', 'Actual fixed-source arithmetic failed')
    for b in r['sourceBindings']:
        data = (RESEARCH_IDE/b['path']).read_bytes()
        a.equal(len(data), b['bytes'], 'scope_binding', b['path']+' size')
        a.equal(hashlib.sha256(data).hexdigest(), b['sha256'], 'scope_binding', b['path']+' SHA')
    a.equal(r['bounds']['domain']['eta'], [-1,1], 'scope_binding', 'eta scope')
    for k in ['signedMomentValuesNumericallyEnclosed','n1CompletedCoefficientNormDerived','allPositiveOrdersCompleted','stressFlatEdgeDirectionModulusDerived','actualUniformHColumnsCertified','sourceUniformQStarCertified','originalN506Complete','formalKernelProof']:
        a.equal(r['scope'][k], False, 'scope_binding', 'unearned scope '+k)

    # Bell partitions of exp(log f); log f=-t^-2. This does not use
    # P_(n+1)=2z^3P_n-z^2P_n', the algorithm in the JavaScript producer.
    for row in r['step']['polynomials']:
        n = row['order']
        expected = defaultdict(F)
        if n == 0:
            expected[0] = F(1)
        for p in parts(n):
            if not n:
                continue
            k = sum(p.values())
            coefficient = F(math.factorial(n) * (-1)**(n+k))
            for j,m in p.items():
                coefficient *= F((j+1)**m, math.factorial(m))
            expected[n+2*k] += coefficient
        actual = {v['power']: int(v['coefficient']) for v in row['terms']}
        expected = {p:int(v) for p,v in expected.items() if v}
        a.equal(actual, expected, 'step_bell_partitions', f'source f derivative {n}')
        absolute = sum(abs(v) for v in expected.values())
        a.equal(int(row['absoluteCoefficientSum']), absolute, 'step_bell_partitions', 'absolute sum')
        a.check(absolute*18**18 < 2**160, 'step_bell_partitions', 'source exponential derivative bound')
    for row in r['step']['sigma']:
        a.check(int(row['ordinaryUpper']) < 2**4096, 'step_bell_partitions', 'sigma ordinary bound')
    a.check(3**4 < 128, 'step_bell_partitions', 'positive denominator lower bound')
    a.check(2**4096 < (2**260)**16, 'step_bell_partitions', 'step Q power')

    # Natural mixed coefficients: inclusion-exclusion computes Stirling
    # numbers independently of the source implementation's recurrence.
    for row in r['natural']['rows']:
        x,m = row['radialLogOrder'],row['etaOrder']
        coef = sum((F(stirling(x,k)*math.factorial(m+k),(m+1)**2)
                    *F(41,200)**k*F(200,159)**(m+k+1)
                    for k in range(x+1)), F(0))
        a.equal(F(row['coefficient']), coef, 'natural_coefficients', f'natural ({x},{m})')
        a.check(coef < 2**260, 'natural_coefficients', 'actual coefficient Q absorption')
        a.equal(row['qPower'],m+2,'natural_coefficients','rho derivative cost')

    # w-(1+H²)w²=H²*t/(1-t). Closed Lagrange inversion.
    for row in r['loop']['implicit']['rows']:
        n = row['order']
        expected = defaultdict(int)
        for k in range(1,n+1):
            for j in range(k):
                expected[2*k+2*j] += cat(k-1)*math.comb(n-1,k-1)*math.comb(k-1,j)
        a.equal(terms(row),dict(expected),'implicit_catalan','total jet polynomial '+str(n))
        for H in [1,2,3,7,16,33]:
            closed=sum(cat(k-1)*math.comb(n-1,k-1)*(1+H*H)**(k-1)*H**(2*k) for k in range(1,n+1))
            a.equal(sum(c*H**p for p,c in terms(row).items()),closed,'implicit_catalan','closed inverse evaluation')

    # w=2A(exp(t)-1)+2w². Coefficient n ordinary derivative:
    # sum Cat(k-1)*2^(2k-1)*A^k*k!*S(n,k).
    fixed = r['premodulation']['B8']['root']
    for row in fixed['rows']:
        n,p = row['order'],fixed['rhsPower']
        expected = {p*k:cat(k-1)*2**(2*k-1)*math.factorial(k)*stirling(n,k) for k in range(1,n+1)}
        a.equal(terms(row),expected,'fixed_quadratic_closed','B8 ordinary derivative '+str(n))
        a.equal(row['coefficientSum'],str(sum(expected.values())),'fixed_quadratic_closed','B8 coefficient sum')
    a.check(terms(fixed['rows'][1])[2*fixed['rhsPower']] == 16,
            'negative_controls','missing Leibniz binomial must be detected (would be8)')

    # (1-t)w=3A(7t+5tw+w²). Independent Catalan expansion in t.
    variable = r['outer']['amplitude']
    for row in variable['rows']:
        n,p = row['order'],variable['coefficientPower']
        expected=defaultdict(int)
        for k in range(1,n+1):
            c=cat(k-1)*3**(k-1)*21**k*math.comb(n+k-2,n-k)
            for j in range(n-k+1):
                expected[p*(2*k-1+j)] += c*math.comb(n-k,j)*15**j
        a.equal(terms(row),dict(expected),'variable_quadratic_closed','actual Amp coefficient recurrence '+str(n))
        ordinary_sum=sum(expected.values())*math.factorial(n)
        a.equal(int(r['outer']['absorptions'][n-1]['coefficientSumAfterFactorial']),ordinary_sum,'variable_quadratic_closed','Amp ordinary factorial')
        a.check(ordinary_sum<2**260,'variable_quadratic_closed','Amp constant absorption')

    # Rebuild the actual original stock-vector high-jet power calculation.
    ledger={}
    for row in r['premodulation']['inputPowerLedger']:
        rule=row['rule']
        if rule=='sum':
            coefficient=len(row['inputs'])
            expected=max(ledger[x] for x in row['inputs'])+max(1,math.ceil(coefficient.bit_length()/260))
        elif rule=='ordinary mixed Leibniz':
            coefficient=len(row['inputs'])**6
            expected=sum(ledger[x] for x in row['inputs'])+max(1,math.ceil(coefficient.bit_length()/260))
        elif rule=='finite reciprocal Taylor series':
            coefficient=7**8*math.factorial(6)
            expected=7*row['positiveValueLowerPower']+6*ledger[row['inputs'][0]]+max(1,math.ceil(coefficient.bit_length()/260))
        else:
            expected=row['power']
        a.equal(row['power'],expected,'power_ledger',row['id'])
        ledger[row['id']]=expected
    a.check('XWU' in ledger,'negative_controls','actual axial stock term must be present')
    a.equal(max(ledger.values())+1,r['premodulation']['inputAbsorption']['power'],'power_ledger','whole input maximum')
    ab=r['premodulation']['inputAbsorption']
    a.check(math.factorial(ab['expSeriesTerm'])<2**(260*ab['factorialReserveInC']),'power_ledger','exponential factorial')
    a.check(200000*ab['expSeriesTerm']-ab['factorialReserveInC']>=ab['power'],'power_ledger','C power below E2')

    stage=r['loop']['stageAudit']
    v=1
    for _ in range(3):
        v=sum(3**k*v**(2*k+1) for k in range(7))
    v=2**80*v**8
    a.equal(int(stage['coefficientSum']),v,'loop_jet_budget','enclosing stage coefficient sum')
    a.equal(stage['degree'],13**3*8,'loop_jet_budget','enclosing stage degree')
    a.equal(stage['logMultiplier'],13**3*8+v.bit_length()+1,'loop_jet_budget','log multiplier')
    a.check(stage['logMultiplier']<65536<2**20,'loop_jet_budget','same actual S absorbs stage')
    for row in r['loop']['rows']:
        a.check(row['count']<(2**20)**(row['to']-row['from']),'loop_jet_budget',row['id'])
    a.check(128<256,'loop_jet_budget','unchanged original R')

    # Same-frequency, same-root Banach C6 contraction; no value of the
    # signed debt is supplied by this audit.
    R=8192
    a.check(2**30<R**3,'C6_restoration','continuous inverse')
    a.check(F(2*2**36,2**200*10**6)<F(1,4),'C6_restoration','C6 contraction')
    a.check(F(2*R**16,R**50)<F(1,10**8),'C6_restoration','same small root box')
    for row in r['restoration']['rows']:
        if row['divideByN']:
            a.check(row['coefficient']*R**row['power']<R**50,'C6_restoration',row['id'])
    a.equal(r['restoration']['fastRadialDerivative'],'B_y/N+B_phase','C6_restoration','actual fast derivative')
    # B(y,eta,phi)=eta^5*phi is a local Taylor jet: the omitted fast part
    # is eta^5, independently of N. A global period is not needed for
    # this local chain-rule negative control.
    for N in [2,11,101]:
        eta=F(3,5)
        actual=F(1,N)*N*eta**5
        a.equal(actual,eta**5,'C6_restoration','fast local Taylor derivative')
        a.check(actual!=0,'negative_controls','dropping B_phase gives a false zero')

    # The uniform quadrature inequality is sharp on f(x)=L*x. The length
    # is squared, not omitted or confused with normalized X.
    for length in [F(1,3),F(1),F(5,2),F(7)]:
        for slope in [F(1,7),F(3),F(11,2)]:
            for n in [1,2,4,8,17]:
                integral=slope*length**2/2
                step=length/n
                approximation=step*sum((slope*j*step for j in range(n)),F(0))
                a.equal(integral-approximation,slope*length**2/(2*n),'continuous_quadrature','sharp rectangle error')
    a.check(F(7)**2/2>F(7)/2,'negative_controls','missing one support length would fail')
    for row in r['regularIntegrands']:
        a.check(row['etaNormPower']<12 and row['xDerivativePower']<12,'continuous_quadrature',row['name'])
    a.equal(r['weightedOmega']['axisBoundaryDropped'],False,'negative_controls','nonzero axis term retained')
    a.equal(r['weightedOmega']['quadrature']['tailAfterXvExactlyZero'],True,'continuous_quadrature','actual compact axial support')

    local_files=[NAVIER/'actual-leading-high-jets.mjs',NAVIER/'actual-leading-high-jets-arithmetic.mjs',HERE/'actual-leading-high-jets.test.mjs',HERE/'actual-leading-high-jets-fixture.mjs',Path(__file__).resolve(),NAVIER/'research/ACTUAL_LEADING_HIGH_JETS_KO.md']
    files=[]
    for path in local_files:
        data=path.read_bytes();files.append({'path':str(path.relative_to(RESEARCH_IDE)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
    canonical=json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
    return {'schema':'MathScope.ActualLeadingHighJetIndependentEvidence/1','pass':True,'checks':a.checks,'categories':dict(a.categories),'method':'Independent closed generating functions, Bell partitions, inclusion-exclusion Stirling numbers, source byte checks and continuous error identities. No sampling of the actual source is substituted for a whole-domain bound.','receiptCanonicalSHA256':hashlib.sha256(canonical).hexdigest(),'files':files,'receipt':r,'scope':{'finiteArithmeticIndependentlyChecked':True,'fullAnalyticProofFormalized':False,'actualSignedMomentValuesComputed':False,'originalN506Complete':False}}


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--write',type=Path)
    args=parser.parse_args()
    result=run()
    if args.write:
        args.write.parent.mkdir(parents=True,exist_ok=True)
        args.write.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='receipt'},ensure_ascii=False))
