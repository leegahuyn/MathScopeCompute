#!/usr/bin/env python3
"""Actually evaluate a rounded finite comparison jet for the NEW fixed point.

The degree-24 f0(Y chi) polynomial is evaluated with directed 256-bit
fixed-point intervals. An independent Fraction sum measures every final
rounding enclosure, and the actual Bessel tail plus the new nonlinear
Banach displacement enclose the actual infinite Phi. This is not the
nonlinear recurrence evaluator and does not claim full original N3-03 PASS.
"""
from __future__ import annotations

import hashlib
import json
import math
import sys
from fractions import Fraction as F
from pathlib import Path

sys.set_int_max_str_digits(0)
HERE=Path(__file__).resolve().parent


def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()


class Directed:
    def __init__(self,bits):
        self.bits=bits;self.scale=1<<bits;self.operations=0
    def point(self,x):
        x=F(x)*self.scale
        return (x.numerator//x.denominator,-((-x.numerator)//x.denominator))
    def add(self,a,b):
        self.operations+=1;return a[0]+b[0],a[1]+b[1]
    def mul(self,a,b):
        self.operations+=1
        raw=[x*y for x in a for y in b]
        lo=min(raw);hi=max(raw)
        return lo//self.scale,-((-hi)//self.scale)
    def div(self,a,b):
        self.operations+=1
        if b[0]<=0<=b[1]: raise ZeroDivisionError("outward divisor crosses zero")
        raw=[F(x*self.scale,y) for x in a for y in b]
        lo=min(raw);hi=max(raw)
        return lo.numerator//lo.denominator,-((-hi.numerator)//hi.denominator)
    def rational_ends(self,a): return F(a[0],self.scale),F(a[1],self.scale)
    def widen(self,a,error):
        error=F(error);e=-((-error.numerator*self.scale)//error.denominator)
        return a[0]-e,a[1]+e
    def pack(self,a):
        return {"lowerNumerator":str(a[0]),"upperNumerator":str(a[1]),
                "denominatorPowerOfTwo":self.bits,
                "decimalDisplay":[float(F(a[0],self.scale)),float(F(a[1],self.scale))]}


def rpack(x):
    x=F(x)
    return {"numerator":str(x.numerator),"denominator":str(x.denominator)}


def finite_exact(chi,Y,N,k):
    return sum(((-chi/F(2))**n*F(math.factorial(n),math.factorial(n-k))*Y**(n-k)
                / (math.factorial(n)*math.factorial(n+1)) for n in range(k,N+1)),F(0))


def finite_rounded(D,chi,Y,N,k):
    c=D.point(chi);y=D.point(Y)
    first=D.point(1)
    for _ in range(k): first=D.mul(first,D.div(D.mul(D.point(-1),c),D.point(2)))
    first=D.div(first,D.point(math.factorial(k+1)))
    total=first;term=first
    # The differentiated term recurrence is independent of the coefficient
    # summation formula used by finite_exact.
    for n in range(k,N):
        term=D.div(D.mul(D.mul(term,c),D.mul(D.point(-1),y)),D.point(2*(n+1-k)*(n+2)))
        total=D.add(total,term)
    return total


def bessel_tail(chi,Y,N,k):
    if Y==0: return F(0)
    n=N+1
    first=(chi/F(2))**n*F(math.factorial(n),math.factorial(n-k))*Y**(n-k)/(math.factorial(n)*math.factorial(n+1))
    ratio=chi*Y/F(2*(N+2-k)*(N+3))
    if ratio>=1: raise ValueError("Bessel tail ratio is not contracting")
    return first/(1-ratio)


def build(bits=256,N=24):
    if bits<192 or bits>512: raise ValueError("require 192..512 arithmetic bits")
    if N<12 or N>64: raise ValueError("require degree 12..64")
    axis=json.loads((HERE/"axis-envelope-certificate.json").read_text())
    if axis["passed"]!=axis["total"]: raise ValueError("same-datum bounds failed")
    continuation=json.loads((HERE/"continuation-debt-certificate.json").read_text())
    if continuation["passed"]!=continuation["total"]: raise ValueError("same final continuation failed")
    chi=F(4000000,4000001)
    epsilon=F(29,1<<(260*53))  # 29 Q^-53 <= this, for Q>=2^260.
    D=Directed(bits);checks={};rows=[]
    check=lambda key,value:checks.__setitem__(key,bool(value))
    check("chi_from_H0_equals_j_and_sigma_j_over_2000", F(1)/(1+F(1,2000)**2)==chi)
    check("same_new_parameter_tree", axis["parametersExactExpressions"]["Md"]=={"integer":2**20})
    check("sharp_polynomial_displacement_present", axis["controlledRemainder"]["sharpDisplacement"]=="29*Q^(-53)")
    coefficients=[]
    for n in range(N+1):
        exact=(-chi/F(2))**n/(math.factorial(n)*math.factorial(n+1))
        rounded=D.point(exact)
        nonlinear=F(0) if n==0 else epsilon/F(20**n*(n+1)**2)
        coefficients.append({"radialDegree":n,"exactComparisonCoefficient":rpack(exact),
                             "roundedComparisonCoefficient":D.pack(rounded),
                             "newNonlinearCoefficientEnclosure":D.pack(D.widen(rounded,nonlinear)),
                             "nonlinearCoefficientErrorExpression":"0" if n==0 else f"epsilonSharp/(20^{n}*{(n+1)**2})"})
    for Y in [F(0),F(1),F(2),F(4),F(41,10)]:
        for k in range(3):
            exact=finite_exact(chi,Y,N,k)
            rounded=finite_rounded(D,chi,Y,N,k)
            lo,hi=D.rational_ends(rounded)
            tag=f"Y_{Y}_derivative_{k}"
            check(tag+"_independent_exact_sum_inside_rounded",lo<=exact<=hi)
            tail=bessel_tail(chi,Y,N,k)
            nonlinear=epsilon*math.factorial(k)/F(20**k)/(1-Y/F(20))**(k+1)
            total_error=tail+nonlinear
            final=D.widen(rounded,total_error)
            flo,fhi=D.rational_ends(final)
            check(tag+"_final_outward_enclosure",flo<=exact-total_error and fhi>=exact+total_error)
            if k==0:check(tag+"_strict_positive_Phi",flo>F(1,4))
            rows.append({"Y":str(Y),"eta":"0","radialDerivativeOrder":k,
                         "comparisonPartialSumExact":rpack(exact),"comparisonRoundedInterval":D.pack(rounded),
                         "measuredRoundoffAndInputEnclosure":{"leftExcess":rpack(exact-lo),"rightExcess":rpack(hi-exact)},
                         "besselTailUpper":rpack(tail),
                         "nonlinearErrorUpperExpression":f"29*2^(-13780)*{math.factorial(k)}/({20**k}*(1-({Y})/20)^{k+1})",
                         "actualInfinitePhiDerivativeEnclosure":D.pack(final)})
    uniform=[]
    R=F(41,10)
    for k in range(3):
        tail=bessel_tail(F(1),R,N,k)
        nonlin=epsilon*math.factorial(k)/F(20**k)/(1-R/F(20))**(k+1)
        check(f"uniform_tail_{k}_positive",tail>0)
        check(f"uniform_total_error_{k}_below_2_minus_130",tail+nonlin<F(1,1<<130))
        uniform.append({"radialDerivativeOrder":k,"besselTailUpper":rpack(tail),
                        "nonlinearErrorUpperExpression":f"29*2^(-13780)*{math.factorial(k)}/({20**k}*(159/200)^{k+1})",
                        "sumUpperOutwardDyadic":D.pack(D.point(tail+nonlin))})
    check("roundoff_was_actually_nonzero",any(F(int(x["measuredRoundoffAndInputEnclosure"]["rightExcess"]["numerator"]),int(x["measuredRoundoffAndInputEnclosure"]["rightExcess"]["denominator"]))>0 for x in rows))
    check("nonlinear_error_not_replaced_by_zero",epsilon>0)
    return {
        "schema":"MathScope.Navier.EvaluatedNewPhiComparisonJet/1",
        "status":"ROUNDED_COMPARISON_JET_ENCLOSES_NEW_NONLINEAR_PHI",
        "basis":{"axisEnvelopeSHA256":sha(HERE/"axis-envelope-certificate.json"),
                 "sameDatumProofSHA256":sha(HERE/"SAME_DATUM_ANALYTIC_AXIS.md"),
                 "finalContinuationReceiptSHA256":sha(HERE/"continuation-debt-certificate.json"),
                 "finalContinuationParameterExpressionSHA256":continuation["parameterExpressionSHA256"],
                 "selectedAmplitude":"CSelected=(1+Q^300)^10 exp(Q^200)",
                 "sourceBinding":axis["sourceBinding"],"parameterExpressionSHA256":axis["parameterExpressionSHA256"],
                 "etaZeroChiExact":str(chi),"amplitudeRange":"Every C>=Caxis, including the final continuation amplitude"},
        "arithmetic":{"kind":"DIRECTED_FIXED_DYADIC_INTERVAL", "bits":bits,"operations":D.operations,
                      "independentPartialSum":"Python Fraction, separate summation of exact differentiated terms",
                      "binary64UsedForDecisions":False,"decimalDisplayOnly":True},
        "radialDegree":N,"coefficientEnclosures":coefficients,"evaluations":rows,
        "uniformError":{"domain":{"Y":["0","41/10"],"chi":["0","1"],"eta":["-1","1"]},
                        "approximation":"sum n=0..N (-Y chi/2)^n/[n!(n+1)!]",
                        "meaning":"Uniform approximation error for the actual new Phi and its first two Y derivatives; no eta derivative claim",
                        "rows":uniform},
        "checks":checks,"passed":sum(checks.values()),"total":len(checks),
        "boundaries":{"newNonlinearPhiIncludedByBanachProof":True,"comparisonIsActualNonlinearRecurrence":False,
                      "roundoffActuallyEvaluated":True,"positiveBanachErrorRetained":True,
                      "uPressureAmplitudeEvaluated":False,"etaDerivativeIntervalsComputed":False,
                      "fullLeanAnalyticPremisesInstantiated":False,"fullOriginalN303Pass":False},
    }


if __name__=="__main__":
    import argparse
    p=argparse.ArgumentParser();p.add_argument("--bits",type=int,default=256);p.add_argument("--degree",type=int,default=24);p.add_argument("--write",action="store_true");a=p.parse_args()
    result=build(a.bits,a.degree)
    if a.write:(HERE/"evaluated-phi-comparison.json").write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps({"status":result["status"],"passed":result["passed"],"total":result["total"],
                      "operations":result["arithmetic"]["operations"],"failed":[k for k,v in result["checks"].items() if not v]}))
    raise SystemExit(result["passed"]!=result["total"])
