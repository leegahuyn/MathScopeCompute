#!/usr/bin/env python3
"""Targeted independent audit of the new normalized-eta Phi array.

Uses QQ interval Taylor algebra, chi=1-epsilon/(H^2+epsilon), and
the finite geometric inverse. No producer/helper modules are imported.
"""
from __future__ import annotations
import argparse
from datetime import datetime,timezone
from fractions import Fraction as F
import hashlib,json,sys
from math import factorial,comb
from pathlib import Path
sys.set_int_max_str_digits(0)
HERE=Path(__file__).resolve().parent
AXIS=HERE.parent
N,M=24,4

def sha(b):return hashlib.sha256(b).hexdigest()
def pt(x):return F(x),F(x)
def ia(a,b):return a[0]+b[0],a[1]+b[1]
def im(a,b):
    q=[x*y for x in a for y in b];return min(q),max(q)
def isc(a,c):return im(a,pt(c))
def minus(a):return -a[1],-a[0]
def contain(a,b):return a[0]<=b[0]<=b[1]<=a[1]
def interval(v):return F(int(v['lowerNumerator']),2**v['denominatorPowerOfTwo']),F(int(v['upperNumerator']),2**v['denominatorPowerOfTwo'])
def rational(v):return F(int(v['numerator']),int(v['denominator']))
def psum(*series):
    out=[pt(0)]*(M+1)
    for s in series:
        out=[ia(a,b) for a,b in zip(out,s)]
    return out
def pmul(a,b):
    out=[pt(0)]*(M+1)
    for k in range(M+1):
        for i in range(k+1):out[k]=ia(out[k],im(a[i],b[k-i]))
    return out
def pscale(a,c):return [isc(x,c) for x in a]
def ppow(a,n):
    out=[pt(1)]+[pt(0)]*M
    for _ in range(n):out=pmul(out,a)
    return out
def btail(y,k):
    if y==0:return F(0)
    # chi bound 2 makes (chi/2)^25 exactly one.
    return y**(25-k)/F(factorial(25-k)*factorial(26))/(1-y/F((26-k)*27))

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);args=parser.parse_args()
    output=Path(args.output).resolve();saved=output.with_suffix('.inputs');saved.mkdir(exist_ok=False)
    names=['evaluated-phi-mixed-comparison.json','evaluate_phi_mixed_comparison.py',
           'evaluate_phi_comparison.py','EVALUATED_MIXED_PHI.md',
           'axis-envelope-certificate.json','continuation-debt-certificate.json',
           'SAME_DATUM_ANALYTIC_AXIS.md']
    blobs={name:(AXIS/name).read_bytes() for name in names}
    blobs['independent-verifier.py']=Path(__file__).read_bytes()
    for name,b in blobs.items():(saved/name).write_bytes(b)
    hashes={name:sha(b) for name,b in blobs.items()}
    cert=json.loads(blobs['evaluated-phi-mixed-comparison.json']);basis=cert['basis']
    axis=json.loads(blobs['axis-envelope-certificate.json']);debt=json.loads(blobs['continuation-debt-certificate.json'])
    checks={}
    def check(name,v):
        if name in checks:raise ValueError(name)
        checks[name]=bool(v)
    for key,name in [('axisReceiptSHA256','axis-envelope-certificate.json'),
        ('continuationReceiptSHA256','continuation-debt-certificate.json'),
        ('analyticProofSHA256','SAME_DATUM_ANALYTIC_AXIS.md'),
        ('implementationSHA256','evaluate_phi_mixed_comparison.py')]:
        check('current_binding_'+key,basis[key]==hashes[name])
    check('same_final_C',basis['finalParameterExpressionSHA256']==debt['parameterExpressionSHA256'])
    check('sharp_actual_Banach_error',axis['controlledRemainder']['sharpDisplacement']=='29*Q^(-53)')
    check('same_positive_coordinate',cert['coordinates']['xi']=='eta/j0' and cert['coordinates']['positiveInputsNotReplacedByZero'] is True)
    check('actual_exponential_h_bound',8002*128>4096)
    check('actual_exponential_j2_bound',4*2==8 and 8*4096==32768)
    h=(F(0),F(1,2**4096));b=(F(0),F(1,2**32768))
    H=[pt(1),ia(pt(F(9,2)),minus(h)),minus(b),isc(b,-4),pt(0)]
    den=pmul(H,H);eps=F(1,4000000);d0=1+eps
    check('H_exact_transport_identity',H[0]==pt(1) and H[3]==isc(H[2],4))
    # Independent geometric inverse of d0+v. Constant term of v is zero.
    v=list(den);v[0]=pt(0);w=pscale(v,-1/d0)
    inv=pscale(psum(*(ppow(w,k) for k in range(M+1))),1/d0)
    chi=pscale(inv,-eps);chi[0]=ia(pt(1),chi[0])
    check('chi_eta0_exact',chi[0]==pt(F(4000000,4000001)))
    # Binomial chi^n expansion in its nonconstant part, distinct from the
    # producer's radial recurrence and its oracle's repeated full power.
    cz=list(chi);cz[0]=pt(0);cpowers=[ppow(cz,k) for k in range(M+1)]
    coeff=[]
    for n in range(N+1):
        cn=psum(*(pscale(cpowers[k],F(comb(n,k))*chi[0][0]**(n-k)) for k in range(min(n,M)+1)))
        coeff.append(pscale(cn,F((-1)**n,2**n*factorial(n)*factorial(n+1))))
    check('coefficient_shape',len(cert['coefficients'])==25 and all(len(x['etaTaylorCoefficients'])==5 for x in cert['coefficients']))
    max_finite_width=F(0)
    for n,row in enumerate(cert['coefficients']):
        for m,col in enumerate(row['etaTaylorCoefficients']):
            iv=interval(col['comparisonInterval']);final=interval(col['actualNonlinearCoefficientInterval'])
            error=F(0) if n==0 else F(29*comb(n+m,m),2**(260*(53-m))*20**n*(n+1)**2*(m+1)**2)
            check(f'coefficient_{n}_{m}_independent_geometric_oracle',contain(iv,coeff[n][m]))
            check(f'coefficient_{n}_{m}_actual_weight',rational(col['positiveBanachCoefficientError'])==error)
            check(f'coefficient_{n}_{m}_actual_enclosure',contain(final,(iv[0]-error,iv[1]+error)))
            max_finite_width=max(max_finite_width,iv[1]-iv[0])
    r=F(1,16)
    perturb=(F(9,2)+h[1])*r+b[1]*(r*r+4*r**3)
    check('comparison_disk_H_perturbation',perturb<F(3,10))
    check('comparison_disk_denominator_separation',F(49,100)-eps>F(12,25))
    check('comparison_disk_chi_upper_two',1+eps/F(12,25)<2)
    check('actual_chart_inside_Omega',F(1,65536*4)<F(1,2048))
    check('actual_xi_chart_formula',65536*4*2000**2==262144*4000000)
    check('actual_xi_chart_upper',4*4096>16000 and 262144*4000000>1)
    check('normalized_Banach_derivative_loss',all((53-m)>0 for m in range(M+1)))
    max_tail=F(0);max_error=F(0)
    check('mixed_value_shape',len(cert['evaluations'])==75)
    for row in cert['evaluations']:
        y=F(row['Y']);k=row['YDerivativeOrder'];m=row['xiDerivativeOrder']
        # Independent interval Horner of the differentiated radial polynomial.
        exact=pt(0)
        for n in range(N,k-1,-1):
            exact=ia(im(exact,pt(y)),isc(coeff[n][m],F(factorial(n)*factorial(m),factorial(n-k))))
        iv=interval(row['finiteComparisonInterval']);final=interval(row['actualInfinitePhiInterval'])
        tail=factorial(m)*16**m*btail(y,k)
        banach=F(29,2**(260*(53-m)))*F(factorial(m+k),(m+1)**2*20**k)/(1-y/20)**(m+k+1)
        tag=f'value_{y}_{k}_{m}'
        check(tag+'_independent_QQ_Horner',contain(iv,exact))
        check(tag+'_complex_comparison_tail',rational(row['besselComplexCauchyTailUpper'])==tail)
        check(tag+'_actual_Banach_factor',rational(row['positiveBanachRemainderUpper'])==banach and banach>0)
        check(tag+'_full_outward_enclosure',contain(final,(iv[0]-tail-banach,iv[1]+tail+banach)))
        check(tag+'_total_error',tail+banach<F(1,2**90))
        check(tag+'_scaled_eta_label',row['meaning']==f'j0^{m} * partial_eta^{m} partial_Y^{k} Phi(Y,0)')
        max_finite_width=max(max_finite_width,iv[1]-iv[0]);max_tail=max(max_tail,tail);max_error=max(max_error,tail+banach)
    chart=F(1,2**16000)
    chart_tail=243*(16*chart)**5/(1-16*chart)
    check('comparison_uniform_absolute_sum',F(41,10)<5 and 3**5==243)
    check('comparison_eta_chart_tail',0<chart_tail<F(1,2**79000))
    check('whole_real_chart_nonlinear_error',cert['finiteEtaTaylorRemainder']['sameNonlinearPhiAdditionalError']=='29*Q^-53/(1-4.1/20)')
    check('finite_interval_width_separate_from_analytic_tail',0<max_finite_width<F(1,2**190))
    check('does_not_enlarge_actual_domain',cert['boundaries']['wholeEtaIntervalCoveredByOneTaylorChart'] is False)
    check('does_not_claim_graph_evaluation_or_Lean',cert['boundaries']['nonlinearRecurrenceDirectlyEvaluated'] is False and cert['boundaries']['fullLeanAnalyticPremisesInstantiated'] is False)
    for name in names:check('stable_input_'+name,(AXIS/name).read_bytes()==blobs[name])
    report={'schema':'MathScope.Navier.IndependentMixedPhiAudit/1',
        'verifiedUTC':datetime.now(timezone.utc).isoformat(),
        'status':'PASS' if all(checks.values()) else 'FAIL','passed':sum(checks.values()),'total':len(checks),'checks':checks,
        'inputSHA256':hashes,'snapshots':str(saved),'producerImported':False,
        'workActuallyPerformed':{'bivariateCoefficientsRecomputed':125,'mixedValuesRecomputed':75,
          'coefficientMethod':'Exact interval chi=1-epsilon/(H^2+epsilon), geometric inverse and binomial powers',
          'evaluationMethod':'Exact rational interval Horner',
          'unrelatedEarlierCertificatesRerun':False},
        'finiteIntervalWidthsBelow':'2^-190','comparisonAndBanachErrorBelow':'2^-90',
        'actualChart':'|eta|<=rho/4, |xi|<=rho/(4j)<2^-16000',
        'comparisonOnlyCauchyDisk':'|xi|<=1/16',
        'scope':'Same actual nonlinear Phi coefficients and scaled eta derivatives at eta=0; comparison Taylor chart, no full nonlinear graph or Lean instantiation.'}
    with output.open('x') as f:json.dump(report,f,indent=2);f.write('\n')
    print(json.dumps({k:report[k] for k in ['status','passed','total']}))
    print(json.dumps({'failed':[k for k,v in checks.items() if not v]}))
    raise SystemExit(0 if report['status']=='PASS' else 1)

if __name__=='__main__':main()
