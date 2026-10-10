#!/usr/bin/env python3
"""Independent exact checks of the finite uniform covariance kernels.

The principal equation is solved as a four-by-four augmented system, rather
than by reimplementing the runtime's rank-one projection formula. Matrix-box
extrema use the separately fractional-linear endpoint principle; the corner
checks below accompany that whole-box argument, not a sampling claim.
"""
from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import math
import subprocess
from collections import Counter
from fractions import Fraction as F
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
RESEARCH = ROOT / 'research-ide'
NAVIER = Path(__file__).resolve().parents[1]
COUNTS = Counter()


def check(condition, message, category):
    if not condition:
        raise AssertionError(message)
    COUNTS[category] += 1


def parse(value):
    return F(str(value))


def vec(values):
    return [parse(v) for v in values]


def matrix(values):
    return [vec(row) for row in values]


def dot(a, b):
    return sum((x*y for x, y in zip(a, b)), F(0))


def matvec(a, v):
    return [dot(row, v) for row in a]


def matmul(a, b):
    return [[sum(a[i][k]*b[k][j] for k in range(len(b)))
             for j in range(len(b[0]))] for i in range(len(a))]


def solve(a, b):
    """Gauss-Jordan exact linear solve, independent of the closed formulas."""
    rows = [list(row)+[rhs] for row, rhs in zip(a, b)]
    n = len(rows)
    for j in range(n):
        pivot = next(i for i in range(j, n) if rows[i][j])
        rows[j], rows[pivot] = rows[pivot], rows[j]
        scale = rows[j][j]
        rows[j] = [v/scale for v in rows[j]]
        for i in range(n):
            if i != j:
                scale = rows[i][j]
                rows[i] = [x-scale*y for x, y in zip(rows[i], rows[j])]
    return [row[-1] for row in rows]


def in_interval(value, endpoints):
    lo, hi = map(parse, endpoints)
    return lo <= value <= hi


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def polyadd(a, b):
    c = [F(0)]*max(len(a), len(b))
    for i, v in enumerate(a): c[i] += v
    for i, v in enumerate(b): c[i] += v
    return c


def polymul(a, b):
    c = [F(0)]*(len(a)+len(b)-1)
    for i, x in enumerate(a):
        for j, y in enumerate(b): c[i+j] += x*y
    return c


def bernstein_to_power(coefficients):
    """Expand b_i binomial(n,i) x^i (1-x)^(n-i), independently."""
    n = len(coefficients)-1
    result = [F(0)]*(n+1)
    for i, coefficient in enumerate(coefficients):
        for j in range(n-i+1):
            result[i+j] += coefficient*math.comb(n,i)*math.comb(n-i,j)*(-1)**j
    return result


def check_source(fixture):
    source = fixture['source']
    check(source['pass'] is True and source['status'] == 'PARTIAL', 'finite source result', 'source_binding')
    bindings = source['sourceBindings']
    for binding in [bindings['assembly'], *bindings['sourceFiles']]:
        path = RESEARCH/binding['path']
        check(sha(path) == binding['sha256'], str(path)+' source bytes', 'source_binding')
    check(source['parameters']['kappa']['expression'] == {'power':[{'ref':'C12EnvelopeR'},-10]}, 'actual kappa expression', 'source_binding')
    check(source['parameters']['uStar']['expression'] == {'product':[{'integer':2},{'power':[{'ref':'C12EnvelopeR'},10]}]}, 'actual u expression', 'source_binding')
    check(source['parameters']['kappa']['binary64'] is None and source['parameters']['kappa']['positiveUnderflowNotZero'] is True, 'positive source underflow preserved', 'source_binding')
    check(source['actualMeanPatchSecondJets']['domain'] == {'y':[0,5],'eta':[-1,1],'s':[.5,2]}, 'actual full mean patch jet domain', 'source_binding')


def check_polynomials(fixture):
    audit = fixture['source']['cone']
    d, margin = F(1,128), F(1,16)
    target_squared = polymul([F(1),F(0),F(1,4)],[F(1),-F(1,2)])
    bound_squared = polymul([F(1),-F(1,8)],[F(1),-F(1,8)])
    gap = polyadd(bound_squared,[-x for x in target_squared])
    check(gap[0] == 0, 'squared cone gap has exact kappa factor', 'bernstein_identity')
    lower = [F(2),-4*d,-2*d*d]
    upper = [F(2),4*d,2*d*d]
    expected = {
        'source-cone-margin-after-u-choice': gap[1:],
        'frozen-target-margin-positive': [margin],
        'normalized-determinant-lower': polyadd(lower,[-F(15,8)]),
        'normalized-determinant-upper': polyadd([F(17,8)],[-x for x in upper]),
        'inverse-numerators-positive': [margin-2*d],
        'positive-inverse-lower': polyadd([64*(margin-2*d)],[-x for x in upper]),
        'positive-inverse-upper': polyadd([2*x for x in lower],[-F(2),-2*d]),
        'inverse-infinity-norm-upper': polyadd([2*x for x in lower],[-F(2),-2*d])
    }
    check(vec(audit['normalizedTargetRatioSquaredUpper']) == target_squared, 'actual u and source cone normalization', 'bernstein_identity')
    for proof in audit['proofs']:
        cert = proof['certificate']
        power, bernstein = vec(cert['powerCoefficients']), vec(cert['bernsteinCoefficients'])
        check(power == expected[proof['id']], proof['id']+' actual inequality', 'bernstein_identity')
        check(bernstein_to_power(bernstein) == power, proof['id']+' independent basis expansion', 'bernstein_identity')
        check(min(bernstein) > 0, proof['id']+' strict whole-interval positivity', 'bernstein_identity')
        check(vec(cert['rangeByConvexCombination']) == [min(bernstein),max(bernstein)], proof['id']+' convex-hull enclosure', 'bernstein_identity')
        check(cert['finiteSamplingUsed'] is False, proof['id']+' no sample promotion', 'scope')
    check(vec(audit['proofs'][0]['certificate']['bernsteinCoefficients']) == [F(1,4),F(17,128),F(9,64)], 'source margin explicit rational certificate', 'bernstein_identity')
    check(len(audit['proofs']) == 8 and audit['pass'] is True, 'all eight inequalities checked', 'bernstein_identity')


def check_boxes(fixture):
    for case in fixture['boxCases']:
        request, result = case['request'], case['result']
        kappa = parse(request['kappa'])
        errors = [vec(e) for row in request['columnErrors'] for e in row]
        slope_ends = vec(request['targetSlope'])
        dets, weights = [], [[],[]]
        # Determinants and inverse numerators are separately affine in each
        # coordinate. Positive denominators make each inverse entry separately
        # fractional-linear. Hence extrema occur at vertices on the whole box.
        for e11,e12,e21,e22 in itertools.product(*errors):
            C = [[1+e11,1+e12],[-1+e21,1+e22]]
            det = C[0][0]*C[1][1]-C[0][1]*C[1][0]
            dets.append(det)
            check(F(15,8)<det<F(17,8), 'entire determinant vertex range', 'box_extrema')
            check(in_interval(det,result['determinant']), 'determinant enclosure', 'box_extrema')
            for slope in [*slope_ends,F(0)]:
                z = solve(C,[F(1),slope])
                check(matvec(C,z) == [F(1),slope], 'independent exact inverse identity', 'box_extrema')
                for i in range(2):
                    weights[i].append(z[i])
                    check(kappa/64 <= z[i] <= 2, 'positive inverse finite bound', 'box_extrema')
                    check(in_interval(z[i],result['normalizedPositiveWeights'][i]), 'interval encloses exact inverse', 'box_extrema')
        check(min(dets)>0, 'positive denominator for fractional-linear endpoint theorem', 'box_extrema')
        check(result['pass'] is True and all(c['pass'] for c in result['checks']), 'runtime accepts exact box', 'box_extrema')
        check(result['scope']['sourceFieldBinding'] is False, 'box alone not actual source jets', 'scope')


def independent_principal(request):
    x = {k:parse(v) for k,v in request.items() if k not in ['forcing','amplitude']}
    H = x['p']*x['F']+x['pz']*x['G']
    HR = x['p']*x['FR']+x['pz']*x['GR']
    HZ = x['p']*x['FZ']+x['pz']*x['GZ']
    n = [x['x0']-x['v']*HR,x['p']/x['R'],x['pz']-x['epsilon']*x['v']*HZ]
    nprime = [-HR,F(0),-x['epsilon']*HZ]
    K = [[F(0),-2*x['F'],F(0)],[2*x['F']+x['R']*x['FR'],F(0),F(0)],[x['GR'],F(0),F(0)]]
    damping = x['epsilon']*x['k']**2*dot(n,n)
    t = vec(request['amplitude']) if 'amplitude' in request else [F(1),-(n[0]+n[2])/n[1],F(1)]
    f = vec(request.get('forcing',[0,0,0]))
    Kt = matvec(K,t)
    system = [[F(i==j) for j in range(3)]+[-x['k']*n[i]] for i in range(3)]
    system.append(n+[F(0)])
    rhs = [f[i]-Kt[i]-damping*t[i] for i in range(3)]+[-dot(nprime,t)]
    solved = solve(system,rhs)
    return x,H,n,nprime,K,damping,t,f,solved


def check_operators(fixture):
    for case in fixture['operatorCases']:
        request, result = case['request'], case['result']
        x,H,n,nprime,K,damping,t,f,solved = independent_principal(request)
        check(vec(result['n']) == n and vec(result['nPrime']) == nprime, 'actual phase derivatives', 'principal_system')
        check(parse(result['phaseSpeed']) == H, 'actual phase speed', 'principal_system')
        check(matrix(result['K']) == K, 'original cylindrical connections', 'principal_system')
        check(parse(result['damping']) == damping, 'original viscous damping', 'principal_system')
        check(vec(result['amplitude']) == t and vec(result['forcing']) == f, 'full tangent datum and forcing', 'principal_system')
        check(vec(result['amplitudeDerivative']) == solved[:3], 'independent augmented-system derivative', 'principal_system')
        check(parse(result['pressure']['imaginaryCoefficient']) == solved[3], 'independent pressure unknown', 'principal_system')
        check(dot(n,t) == 0, 'original normal constraint', 'principal_system')
        check(dot(nprime,t)+dot(n,solved[:3]) == 0, 'differentiated moving-normal constraint', 'principal_system')
        energy = dot(t,solved[:3])+damping*dot(t,t)+x['R']*x['FR']*t[0]*t[1]+x['GR']*t[0]*t[2]-dot(t,f)
        check(energy == 0, 'shear energy from independently solved system', 'principal_system')
        P = matrix(result['forcingProjection'])
        check(matmul(P,P) == P and P == list(map(list,zip(*P))), 'orthogonal projector algebra', 'principal_system')
        check(matvec(P,n) == [0,0,0], 'projection kills normal', 'principal_system')
        A = matrix(result['Aphi'])
        check([nprime[j]+sum(n[i]*A[i][j] for i in range(3)) for j in range(3)] == [0,0,0], 'ambient constraint row', 'principal_system')
        check(result['pass'] is True and all(c['pass'] for c in result['checks']), 'runtime principal result', 'principal_system')
        check(result['scope']['sourceFieldBinding'] is False and result['scope']['homogeneousOrForcedODEIntegrated'] is False, 'principal algebra not source ODE integration', 'scope')


def check_failures_and_scope(fixture):
    neg = fixture['negativeControls']
    for name,result in neg.items():
        check(result['pass'] is False, name+' fails', 'negative_control')
    source = fixture['source']
    for key in ['sourceWholeAnnulusBackgroundBound','actualCovarianceOnAllSlowNeighborhoods','sourceUniformQStarCertified','wholeAnnulusEquation730Verified','originalN506Complete','fullM2PackageComplete','newLeanKernelProof']:
        check(source['scope'][key] is False, key+' remains unavailable', 'scope')
    check(len(source['dependencies']) == 5 and all(d['available'] is False for d in source['dependencies']), 'missing actual producers not caller booleans', 'scope')
    for key in ['allLabelsEnumerationRequired','allDerivativeOrdersRequiredForThisValueSubclaim']:
        check(source['scope'][key] is False, key+' not an extra completion hurdle', 'scope')
    x,H,n,nprime,K,damping,t,f,expected = independent_principal(fixture['operatorCases'][5]['request'])
    omitted = vec(neg['movingNormal']['amplitudeDerivative'])
    check(dot(t,omitted)+damping*dot(t,t)+x['R']*x['FR']*t[0]*t[1]+x['GR']*t[0]*t[2]-dot(t,f) == 0, 'missing nprime can escape energy test', 'negative_control')
    check(dot(nprime,t)+dot(n,omitted) != 0, 'original moving constraint detects omission', 'negative_control')
    check(neg['movingNormal']['residuals']['energy'] == '0', 'reported energy-only blind spot retained', 'negative_control')
    Kbad = matrix(neg['connections']['K'])
    check(Kbad != K and matvec(Kbad,t) != matvec(K,t), 'source connection equations detect omission', 'negative_control')
    check(neg['connections']['residuals']['energy'] == '0', 'skew connection omission energy blind spot retained', 'negative_control')
    check(dot(n,vec(neg['incompatibleDatum']['amplitude'])) != 0, 'actual incompatible datum detected', 'negative_control')


def run():
    completed = subprocess.run(['node',str(NAVIER/'tests/actual-covariance-uniform-fixture.mjs')],cwd=ROOT,check=True,capture_output=True,text=True)
    fixture = json.loads(completed.stdout)
    check(fixture['schema'] == 'MathScope.ActualCovarianceUniformIndependentFixture/1', 'fixture schema', 'source_binding')
    check_source(fixture)
    check_polynomials(fixture)
    check_boxes(fixture)
    check_operators(fixture)
    check_failures_and_scope(fixture)
    files = [NAVIER/'actual-covariance-uniform.mjs',NAVIER/'tests/actual-covariance-uniform.test.mjs',NAVIER/'tests/actual-covariance-uniform-fixture.mjs',Path(__file__),NAVIER/'research/ACTUAL_COVARIANCE_UNIFORM_REVIEW_KO.md']
    return {
        'schema':'MathScope.ActualCovarianceUniformIndependentAudit/1',
        'pass':True,'checks':sum(COUNTS.values()),'categories':dict(COUNTS),
        'methods':['Python standard-library Fraction exact arithmetic','Bernstein-to-power polynomial expansion and positive convex combinations','Separately affine determinant and separately fractional-linear inverse extrema on a full box','Independent Gauss-Jordan augmented principal system including pressure and differentiated normal constraint'],
        'sourceFieldScope':'Actual N3 global pointwise cone and entire preserved Imean normalized second jets only; no completed-background or uniform integrated covariance producer is fabricated.',
        'wholeAnnulusEquation730Certified':False,'originalN506Complete':False,
        'files':[{'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':sha(p)} for p in files],
        'receipt':fixture
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--write',type=Path)
    args = parser.parse_args()
    evidence = run()
    if args.write:
        path = args.write if args.write.is_absolute() else ROOT/args.write
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in evidence.items() if k not in ['files','receipt']},ensure_ascii=False,indent=2))
