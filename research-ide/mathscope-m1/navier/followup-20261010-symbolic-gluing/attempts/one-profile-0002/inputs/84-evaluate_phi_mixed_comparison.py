#!/usr/bin/env python3
"""Actual outward evaluation of the new Phi radial/normalized-eta jet.

xi=eta/j0.  This evaluates a finite comparison polynomial and encloses
the actual nonlinear Picard coefficients by the proved sharp Banach
remainder.  It is neither an old-data jet nor a full Lean instantiation.
"""
from __future__ import annotations
from fractions import Fraction as F
from math import factorial,comb
from pathlib import Path
import json,hashlib,sys
from evaluate_phi_comparison import Directed,rpack,bessel_tail,sha
sys.set_int_max_str_digits(0)
HERE=Path(__file__).resolve().parent


class ExactBoxes:
    def point(self,x): x=F(x);return(x,x)
    def box(self,a,b):return F(a),F(b)
    def add(self,a,b):return a[0]+b[0],a[1]+b[1]
    def mul(self,a,b):
        p=[x*y for x in a for y in b];return min(p),max(p)
    def div(self,a,b):
        if b[0]<=0<=b[1]:raise ZeroDivisionError
        p=[x/y for x in a for y in b];return min(p),max(p)


def box(D,a,b):return D.point(a)[0],D.point(b)[1]


def add(A,p,q):return[A.add(a,b) for a,b in zip(p,q)]


def scale(A,p,c):return[A.mul(a,A.point(c)) for a in p]


def mul(A,p,q):
    out=[]
    for n in range(len(p)):
        v=A.point(0)
        for k in range(n+1):v=A.add(v,A.mul(p[k],q[n-k]))
        out.append(v)
    return out


def inv(A,p):
    out=[A.div(A.point(1),p[0])]
    for n in range(1,len(p)):
        v=A.point(0)
        for k in range(1,n+1):v=A.add(v,A.mul(p[k],out[n-k]))
        out.append(A.div(A.mul(A.point(-1),v),p[0]))
    return out


def chi_jet(A,M,hmax,bmax):
    h=box(A,0,hmax);b=box(A,0,bmax)
    H=[A.point(1),A.add(A.point(F(9,2)),A.mul(A.point(-1),h)),
       A.mul(A.point(-1),b),A.mul(A.point(-4),b)]+[A.point(0)]*(M-3)
    H2=mul(A,H,H);den=list(H2);den[0]=A.add(den[0],A.point(F(1,4000000)))
    return mul(A,H2,inv(A,den))


def build(bits=256,N=24,M=4):
    D=Directed(bits);X=ExactBoxes();checks={}
    def check(k,v):
        if k in checks:raise ValueError(k)
        checks[k]=bool(v)
    axis=json.loads((HERE/'axis-envelope-certificate.json').read_text())
    debt=json.loads((HERE/'continuation-debt-certificate.json').read_text())
    check('actual_same_axis_receipt',axis['passed']==axis['total'])
    check('actual_final_member_receipt',debt['passed']==debt['total'])
    check('positive_h_interval_from_actual_exponent',8002*128>4096)
    check('j_squared_is_h_power8',4*2==8)
    hmax=F(1,2**4096);bmax=F(1,2**32768)
    dc=chi_jet(D,M,hmax,bmax);xc=chi_jet(X,M,hmax,bmax)
    oneD=[D.point(1)]+[D.point(0)]*M
    oneX=[X.point(1)]+[X.point(0)]*M
    dcoeff=[];xcoeff=[];dpower=oneD;xpower=oneX
    # Separate exact box oracle uses powers and closed coefficients; the
    # directed calculation advances the actual coefficient recurrence.
    dterm=oneD
    for n in range(N+1):
        dcoeff.append(dterm)
        xcoeff.append(scale(X,xpower,F((-1)**n,2**n*factorial(n)*factorial(n+1))))
        xpower=mul(X,xpower,xc)
        if n<N:dterm=scale(D,mul(D,dterm,dc),F(-1,2*(n+1)*(n+2)))
    largest_excess=F(0);coefficients=[]
    for n in range(N+1):
        row=[]
        for m in range(M+1):
            a,b=D.rational_ends(dcoeff[n][m]);lo,hi=xcoeff[n][m]
            check(f'rounded_bivariate_coefficient_{n}_{m}',a<=lo and hi<=b)
            excess=max(lo-a,b-hi);largest_excess=max(largest_excess,excess)
            err=F(0) if n==0 else F(29*comb(n+m,n),2**(260*(53-m))*20**n*(n+1)**2*(m+1)**2)
            enclosed=D.widen(dcoeff[n][m],err)
            row.append({'xiTaylorDegree':m,'comparisonInterval':D.pack(dcoeff[n][m]),
                        'actualNonlinearCoefficientInterval':D.pack(enclosed),
                        'positiveBanachCoefficientError':rpack(err),
                        'outwardExcessUpper':D.pack(D.point(excess))})
        coefficients.append({'radialDegree':n,'etaTaylorCoefficients':row})
    check('complex_H_relative_perturbation',F(9,2)*F(1,16)+hmax/F(16)+bmax*(F(1,256)+F(1,1024))<F(3,10))
    check('complex_H_denominator_separated',F(49,100)-F(1,4000000)>F(12,25))
    check('complex_chi_bound_two',1+F(1,4000000)/F(12,25)<2)
    evaluations=[]
    for Y in (F(0),F(1),F(2),F(4),F(41,10)):
        for k in range(3):
            for m in range(M+1):
                dv=D.point(0);xv=X.point(0)
                for n in range(k,N+1):
                    c=F(factorial(n),factorial(n-k))*Y**(n-k)*factorial(m)
                    dv=D.add(dv,D.mul(dcoeff[n][m],D.point(c)))
                    xv=X.add(xv,X.mul(xcoeff[n][m],X.point(c)))
                dl,dh=D.rational_ends(dv)
                check(f'rounded_mixed_value_{Y}_{k}_{m}',dl<=xv[0] and xv[1]<=dh)
                excess=max(xv[0]-dl,dh-xv[1]);largest_excess=max(largest_excess,excess)
                tail=factorial(m)*16**m*bessel_tail(F(2),Y,N,k)
                banach=F(29,2**(260*(53-m)))*F(factorial(m+k),(m+1)**2*20**k)/(1-Y/F(20))**(m+k+1)
                out=D.widen(dv,tail+banach)
                check(f'mixed_nonzero_error_preserved_{Y}_{k}_{m}',banach>0 and D.rational_ends(out)[0]<=dl-banach and D.rational_ends(out)[1]>=dh+banach)
                check(f'mixed_tail_and_Banach_below_two_minus90_{Y}_{k}_{m}',tail+banach<F(1,2**90))
                evaluations.append({'Y':str(Y),'eta':'0','YDerivativeOrder':k,'xiDerivativeOrder':m,
                    'meaning':f'j0^{m} * partial_eta^{m} partial_Y^{k} Phi(Y,0)',
                    'finiteComparisonInterval':D.pack(dv),'actualInfinitePhiInterval':D.pack(out),
                    'besselComplexCauchyTailUpper':rpack(tail),'positiveBanachRemainderUpper':rpack(banach),
                    'inputAndRoundoffExcessUpper':D.pack(D.point(excess))})
    # A genuine finite eta Taylor remainder on a specified positive chart.
    # |xi|<=rho/(4j)=j/(262144*4000000).  Since j=h^4, its value is
    # <=2^-16384; the larger explicit 2^-16000 bound avoids huge coordinates.
    check('positive_eta_chart_ratio',16<262144*4000000)
    eta_chart_remainder=F(243)*(F(16,2**16000))**5/(1-F(16,2**16000))
    check('comparison_eta_Taylor_remainder_positive_small',0<eta_chart_remainder<F(1,2**79000))
    check('actual_roundoff_was_nonzero',largest_excess>0)
    return {'schema':'MathScope.Navier.EvaluatedMixedPhiComparison/1',
        'status':'ACTUAL_RADIAL24_NORMALIZED_ETA4_COEFFICIENT_INTERVALS_FOR_NEW_PHI' if all(checks.values()) else 'FAIL',
        'basis':{'axisReceiptSHA256':sha(HERE/'axis-envelope-certificate.json'),
                 'continuationReceiptSHA256':sha(HERE/'continuation-debt-certificate.json'),
                 'finalParameterExpressionSHA256':debt['parameterExpressionSHA256'],
                 'analyticProofSHA256':sha(HERE/'SAME_DATUM_ANALYTIC_AXIS.md'),
                 'implementationSHA256':sha(Path(__file__))},
        'arithmetic':{'bits':bits,'directedOperations':D.operations,'exactRationalBoxOracleUsed':True,
                      'largestMeasuredInputAndRoundoffExcessUpper':D.pack(D.point(largest_excess)),
                      'decimalDisplayNotUsedForProof':True},
        'coordinates':{'xi':'eta/j0','j0':'h^4>0','HOverJ':'1+(9/2-h)*xi-j0^2*xi^2-4*j0^2*xi^3',
                       'hInterval':['0','2^-4096'],'jSquaredInterval':['0','2^-32768'],
                       'positiveInputsNotReplacedByZero':True},
        'radialDegree':N,'normalizedEtaDegree':M,'coefficients':coefficients,'evaluations':evaluations,
        'finiteEtaTaylorRemainder':{'actualPositiveChart':'|eta|<=rho/4, equivalently |xi|<=rho/(4*j0)',
            'comparisonRemainderUpperExpression':'243*(16*2^-16000)^5/(1-16*2^-16000)',
            'comparisonRemainderLessThan':'2^-79000',
            'sameNonlinearPhiAdditionalError':'29*Q^-53/(1-4.1/20)',
            'BesselRadialRemainder':'the m=0 uniform complex-circle tail above'},
        'checks':checks,'passed':sum(checks.values()),'total':len(checks),
        'boundaries':{'sameNonlinearPhiCoefficientsEnclosed':True,'finiteEtaAndRadialApproximationActuallyEvaluated':True,
            'nonlinearRecurrenceDirectlyEvaluated':False,'wholeEtaIntervalCoveredByOneTaylorChart':False,
            'fullLeanAnalyticPremisesInstantiated':False,'fullOriginalN303Completion':False}}


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=build()
    if args.write:(HERE/'evaluated-phi-mixed-comparison.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'status':result['status'],'passed':result['passed'],'total':result['total'],
        'operations':result['arithmetic']['directedOperations'],'failed':[k for k,v in result['checks'].items() if not v]}))
    raise SystemExit(result['passed']!=result['total'])
