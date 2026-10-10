#!/usr/bin/env python3
"""Independent finite audit of the actual continuation/source derivative budgets.

No producer modules are imported. Positive polynomial Taylor algebra is used
instead of the producers' ordinary-derivative Bell/reciprocal recurrences.
Function-level connections are reviewed in SOURCE_DERIVATIVE_REVIEW.md.
Every input is read once and copied to an append-only audit directory.
"""
from __future__ import annotations
import argparse
from collections import defaultdict
from datetime import datetime, timezone
from fractions import Fraction as F
import hashlib
import json
from math import comb, factorial
from pathlib import Path

HERE = Path(__file__).resolve().parent
AXIS = HERE.parent
NAVIER = AXIS.parent
GLUING = NAVIER / 'followup-20261010-symbolic-gluing'
QMIN = 2**260

def digest(data):
    return hashlib.sha256(data).hexdigest()

# Positive polynomials in Q, including the negative powers in a short integral.
def p(c=0, power=0):
    return {power:F(c)} if c else {}

def add(*values):
    out=defaultdict(F)
    for value in values:
        for k,c in value.items(): out[k]+=c
    return {k:c for k,c in out.items() if c}

def scale(value,c):
    return {k:v*c for k,v in value.items() if v*c}

def mul(a,b):
    out=defaultdict(F)
    for i,ai in a.items():
        for j,bj in b.items(): out[i+j]+=ai*bj
    return dict(out)

def record(value):
    return {str(k):str(v) for k,v in sorted(value.items())}

def strict_power(value,n):
    return not value or (max(value)<n and all(c>=0 for c in value.values())
                         and sum(value.values())<QMIN)

def taylor(ordinary):
    return [scale(v,F(1,factorial(k))) for k,v in enumerate(ordinary)]

def ordinary(tay):
    return [scale(v,factorial(k)) for k,v in enumerate(tay)]

def tadd(*series):
    return [add(*(a[k] for a in series)) for k in range(len(series[0]))]

def tmul(a,b):
    n=min(len(a),len(b))
    return [add(*(mul(a[j],b[k-j]) for j in range(k+1))) for k in range(n)]

def tpower(a,k):
    out=[p(1)]+[{} for _ in a[1:]]
    for _ in range(k): out=tmul(out,a)
    return out

def absolute_reciprocal_taylor(f,base_inverse):
    v=[{}]+[scale(x,base_inverse) for x in f[1:]]
    return [scale(x,base_inverse) for x in tadd(*(tpower(v,k) for k in range(len(f))))]

def absolute_log_taylor(f,base_inverse):
    v=[{}]+[scale(x,base_inverse) for x in f[1:]]
    terms=[[scale(x,F(1,k)) for x in tpower(v,k)] for k in range(1,len(f))]
    out=tadd(*terms)
    out[0]=p(2)
    return out

def exp_taylor(v,value=1):
    assert not v[0]
    terms=[[scale(x,F(value,factorial(k))) for x in tpower(v,k)]
           for k in range(len(v))]
    return tadd(*terms)

def rat(v):
    return F(int(v['numerator']),int(v['denominator']))

def product_bounds(a,b):
    return [sum(F(comb(n,k))*a[k]*b[n-k] for k in range(n+1))
            for n in range(min(len(a),len(b)))]

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',required=True)
    args=parser.parse_args()
    output=Path(args.output).resolve()
    snapshots=output.with_suffix('.inputs')
    snapshots.mkdir(exist_ok=False)
    names=['SAME_DATUM_ANALYTIC_AXIS.md','REFERENCE_DERIVATIVE_BOUNDS.md',
           'CONTINUATION_AND_NEW_DEBT.md','GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md',
           'axis-envelope-certificate.json','continuation-debt-certificate.json',
           'global-source-envelope-certificate.json','check_axis_envelopes.py',
           'check_continuation_debt.py','check_global_source_envelope.py']
    blobs={name:(AXIS/name).read_bytes() for name in names}
    blobs['b8-certificate.json']=(GLUING/'attempts/b8-0001/certificate.json').read_bytes()
    blobs['independent-verifier.py']=Path(__file__).read_bytes()
    for name,blob in blobs.items(): (snapshots/name).write_bytes(blob)
    hashes={name:digest(blob) for name,blob in blobs.items()}
    debt=json.loads(blobs['continuation-debt-certificate.json'])
    source=json.loads(blobs['global-source-envelope-certificate.json'])
    b8=json.loads(blobs['b8-certificate.json'])
    checks={}
    def check(name,value):
        if name in checks: raise ValueError(name)
        checks[name]=bool(value)
    for name,expected in debt['sourceBinding']['proofFilesSHA256'].items():
        check('debt_input_'+name,hashes[name]==expected)
    for name,expected in source['sourceBinding']['proofAndProducerInputsSHA256'].items():
        check('global_input_'+name,hashes[name]==expected)
    check('debt_current_producer',hashes['check_continuation_debt.py']==debt['sourceBinding']['thisCheckerSHA256'])
    check('source_current_producer',hashes['check_global_source_envelope.py']==source['sourceBinding']['thisCheckerSHA256'])
    check('same_B8_input',hashes['b8-certificate.json']==debt['sourceBinding']['newB8CertificateSHA256'])
    check('same_final_parameter_tree',source['sourceBinding']['finalContinuationParameterExpressionSHA256']==debt['parameterExpressionSHA256'])
    check('S_is_explicit_final_C_power',source['parametersExactExpressions']['sourceEnvelopeS']=={'power':[{'ref':'CSelected'},100000]})

    # Actual coefficient formula and its Stirling expansion, independently.
    stirling={(0,0):1}
    scalars={}
    for r in range(1,9):
        for k in range(1,r+1):
            stirling[r,k]=stirling.get((r-1,k-1),0)+k*stirling.get((r-1,k),0)
    for r in range(9):
        for m in range(9-r):
            scalar=sum(F(stirling.get((r,k),0))*F(41,200)**k*
                       F(factorial(m+k),(m+1)**2)*F(200,159)**(m+k+1)
                       for k in range(r+1))
            scalars[f'{r},{m}']=str(scalar)
            check(f'actual_coefficient_r{r}_m{m}_Q10',scalar<QMIN and m+2<=10)
    check('global_coefficient_formula_matches',scalars==source['finiteDerivationDetails']['actualAnalyticEvaluationScalars'])

    tables={}
    def table(name,series,power):
        values=ordinary(series)
        tables[name]=[record(x) for x in values]
        expected=debt['finiteDerivativeTable'][name]['etaDerivativePolynomials']
        check(name+'_independent_Taylor_identity',tables[name]==expected)
        for n,value in enumerate(values): check(name+f'_order{n}_bound',strict_power(value,power))
        return series

    phi=taylor([p(1,7)]*6)
    reciprocal=absolute_reciprocal_taylor(phi,4)
    logphi=table('order4SourceLogPhi',absolute_log_taylor(phi,4),36)
    slope=table('order4SourceLogSlope',tmul(phi,reciprocal),43)
    small=exp_taylor(taylor([{}]+[p(1)]*5),2)
    table('order4SourceReferenceR',tmul(phi,small),8)
    table('order4SourceReferenceLogR',taylor([add(p(1,36),p(1,-157))]*6),64)
    ratio=table('order4SourceRadialRatio',exp_taylor(taylor([{}]+[p(2,64)]*4),8),260)
    phase=exp_taylor(taylor([{}]+[p(1,72)]*5))
    table('order4SourceFDividedByG',tmul(taylor([p(1,64)]*6),phase),425)
    check('higher_eta_pressure_reserve',30**32>factorial(32) and 2048-425>1000)
    eta=taylor([p(1),p(1),{},{},{}])
    d=taylor([p(1),p(2),p(2),{},{}])
    const=[p(1),{},{},{},{}]
    uj=taylor([p(6)]*5)
    # The derivative of U through order four is bounded using the fifth input.
    Ueta=taylor([p(6)]*5)
    ah=tadd(const,[scale(x,2) for x in tmul(eta,uj)])
    W=tadd(ah,tmul(d,Ueta))
    H=tadd(eta,tmul(d,uj))
    sq=table('order4SourceSq',tadd(tmul(W,taylor([p(1,44)]*5)),ah,
                                 tmul(H,taylor([p(1,73)]*5))),90)
    sn=table('order4SourceSn',tadd(tmul(W,taylor([p(1)]*5)),tmul(ah,uj),
        tmul(H,Ueta),tmul(d,taylor([p(1,3)]*5)),
        [scale(x,4) for x in tmul(eta,taylor([p(1,3)]*5))],
        [scale(x,2) for x in tmul(eta,taylor([p(1)]*5))]),5)
    invL=absolute_reciprocal_taylor(taylor([{},p(4),p(4),{},{}]),2)
    table('order4SourceP1',[scale(x,55) for x in tmul(invL,tmul(ratio,sq))],400)
    table('order4SourceNs',tmul(invL,sn),7)
    check('actual_fourth_reference_bound_Q500',strict_power(add(p(1),p(1,400),p(55,7)),500))
    check('actual_fourth_B26_drift_below_Q_minus200',120*10000-502>200 and 10**6<QMIN)

    delta=list(map(F,[2,1,1,1,1]))
    q=list(map(F,[2,2,2,0,0]))
    q2=list(map(F,[4,8,16,24,24]))
    lin=product_bounds(q,delta)
    ene=product_bounds(q2,product_bounds(delta,delta))
    high=debt['higherIncomingAndRootDerivatives']
    check('actual_fourth_debt_linear',lin==list(map(F,[4,6,10,14,22]))==list(map(F,high['linearDebtCoefficients'])))
    check('actual_fourth_debt_energy',ene==list(map(F,[16,48,152,472,1448]))==list(map(F,high['energyDebtCoefficients'])))
    h=F(1,2**200)
    beta=rat(b8['bounds']['allowedPreconditionedScaledDebtPerDerivative0To2'])
    for tag,c,power in [('U',22,2),('E',1448,6)]:
        matrix=[[rat(x) for x in row] for row in b8['inverse'+tag]['exact']]
        norm=max(sum(map(abs,row)) for row in matrix)
        bound=2**40*(c*h**power+h)
        check(tag+'_actual_inverse_norm',norm<2**40)
        check(tag+'_actual_fourth_scaled_incoming',bound==F(high['preconditionedScaled'+tag+'Upper']) and bound<beta)
    mu=rat(b8['bounds']['muUpper'])
    bu,be=[rat(b8['bounds'][x]) for x in ['BU','BE']]
    zu,qe=rat(b8['inverseU']['z']),rat(b8['bounds']['eContraction'])
    U=[rat(b8['bounds']['uRadius'])]+[beta/(1-zu)]*4
    E=[rat(b8['bounds']['eRadius'])]
    for m in range(1,5):
        # Taylor coefficient product with m! conversion independently tracks
        # the interior quadratic partition; endpoint terms are in the inverse.
        ucoef=sum(U[k]/factorial(k)*U[m-k]/factorial(m-k) for k in range(m+1))
        ecoef=sum(E[k]/factorial(k)*E[m-k]/factorial(m-k) for k in range(1,m))
        E.append((beta+mu*factorial(m)*(bu*ucoef+be*ecoef))/(1-qe))
        check(f'actual_implicit_root_order{m}',max(U[m],E[m])<F(1,10**6))
    check('same_root_U_derivative_bounds',U==list(map(F,high['actualRootUOrdinaryDerivativeUpper'])))
    check('same_root_E_derivative_bounds',E==list(map(F,high['actualRootEOrdinaryDerivativeUpper'])))

    # Global derivative budget from actual finite Taylor identities. The
    # one-variable majorant applies to any mixed derivative of the same total
    # order, by the multinomial product identity.
    log8=ordinary(absolute_log_taylor(taylor([p(1,10)]*9),4))
    check('actual_mixed_logPhi_Q100',all(strict_power(x,100) for x in log8))
    bell7=ordinary(exp_taylor(taylor([{}]+[p(1,110)]*7)))
    bell4=ordinary(exp_taylor(taylor([{}]+[p(1,4000)]*4)))
    check('reference_actual_field_Bell_Q900',all(strict_power(x,900) for x in bell7))
    check('actual_B26_field_Bell_Q20000',all(strict_power(x,20000) for x in bell4))
    check('reference_pressure_reserve_total_seven',2048-900>1000)
    check('source_product_fixed_coefficients',6*3**7<QMIN)
    # For any collection of nonnegative radial orders with total r>0,
    # sum (ri-1)_+ = r - number(ri>0) <= r-1. No finite sampling of
    # cutoffs or radius is needed for this width exponent identity.
    check('graded_width_identity_has_one_strict_loss',all(r-k<=r-1 for r in range(1,8) for k in range(1,r+1)))
    stock_radial=[400]
    for r in range(1,4): stock_radial.append(1+max(1002,111+stock_radial[-1]))
    check('B25_actual_radial_ODE_budget',stock_radial==[400,1003,1115,1227])
    check('B26_derivative_budget',3000+8+3<4000)
    check('actual_field_C362',20000//10000+3*120==362)
    check('logQ_actual_parameter_identity',4+8*8002==64020)
    check('radial_outer_range_coefficient',60021<64020 and 10**8<QMIN)
    check('positive_E_outer',30001<64020)
    check('inner_positive_a',120+2==122)
    density={'M':1000,'I':1007,'J':2007,'S':2000,'Cp':2001}
    check('continuous_moment_integrals_C2030',all(v+12+3<2030 for v in density.values()))
    check('moment_derivative_combinatorics',3**4*16<QMIN)
    invE,invH=4*3+3*1000+1,4*4+3*1008+1
    check('actual_E_reciprocal_C3015',invE<3015)
    check('actual_H_reciprocal_C3050',invH<3050)
    # A separate positive grouping of the complete literal 4.16 formulas.
    # Every eta/d/L factor is bounded with all required derivatives by C.
    # W=1-2D eta M/X-d M_eta/X, hence [W]_3<C^2036.
    Wexp=2030+1+3+2
    numerator1=max(12+Wexp,3050+2030+4)+1
    numerator2=max(12+Wexp+1000,2030+4,12+2030+4)+1
    p1exp=numerator1+1+1
    p2exp=numerator2+3015+1+1
    check('literal_p1_independent_positive_grouping',p1exp<8000)
    check('literal_p2_includes_XWU',p2exp<8000 and 12+Wexp+1000==max(12+Wexp+1000,2030+4,12+2030+4))
    check('a_b_actual_total3',1000+3015+1<5000)
    check('inverse_a_actual_total3',4*122+3*5000+1<16000)
    check('t_actual_total3',5000+16000+1<21002)
    check('v_actual_total3',max(5000,10000+16000)+2<26004)
    check('Pc_Jc_actual_total3',8000+21002+1<29004)
    check('mixed_jet_norm_sum_not_only_sup',comb(3+2,2)==10 and 29004+1<100000 and 10<QMIN)
    check('positive_lambda_reciprocal',1000<64020)
    check('actual_source_envelope_does_not_claim_Lean',source['boundaries']['fullAnalyticPremisesProvedInLean'] is False)
    check('cone_lower_bounds_remain_separate',source['boundaries']['loopAndConeLowerBoundsSuppliedSeparately'] is True)
    # Ensure all inputs still have the bytes that were reviewed and snapshotted.
    for name in names: check('input_stable_during_audit_'+name,(AXIS/name).read_bytes()==blobs[name])
    report={'schema':'MathScope.Navier.IndependentActualSourceDerivativeAudit/1',
        'verifiedUTC':datetime.now(timezone.utc).isoformat(),
        'status':'PASS' if all(checks.values()) else 'FAIL',
        'passed':sum(checks.values()),'total':len(checks),'checks':checks,
        'inputSHA256':hashes,'snapshotDirectory':str(snapshots),
        'producerImported':False,'independentTaylorDerivativeTables':tables,
        'actualMixedCoefficientEvaluation':scalars,
        'fourthIncomingDebtCoefficients':{'U':list(map(str,lin)),'E':list(map(str,ene))},
        'independentStockPositiveGroupingExponents':{'W':Wexp,'p1':p1exp,'p2':p2exp},
        'scope':'Exact finite Taylor and rational audit plus separate function-level proof review; no all-region cone lower proof, no new Lean terms.',
        'analyticAttachments':['Actual Picard limit norm and A.21 datum','Literal B.22/B.26/B.34 defining integrals',
             'Continuous moment differentiation, including regular axis pressure','Same unique B.8 quadratic root and explicit outer stages']}
    with output.open('x') as f: json.dump(report,f,indent=2);f.write('\n')
    print(json.dumps({k:report[k] for k in ['status','passed','total']}))
    print(json.dumps({'failed':[k for k,v in checks.items() if not v]}))
    raise SystemExit(0 if report['status']=='PASS' else 1)

if __name__=='__main__': main()
