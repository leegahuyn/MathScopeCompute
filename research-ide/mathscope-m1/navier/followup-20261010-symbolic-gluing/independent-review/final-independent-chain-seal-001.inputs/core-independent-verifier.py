#!/usr/bin/env python3
"""Independent exact replay of pressure coefficients and normalized core values.

Imports none of the producers or their arithmetic helper. The full 1792-cell
quadrature is source-reviewed, not rerun here; the accepted interval is an
explicit input, authenticated against its producer snapshot. Downstream
coefficient, polynomial, identity, and error checks are recomputed in QQ.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
from fractions import Fraction as F
import hashlib
import json
from math import factorial
from pathlib import Path
import sys

sys.set_int_max_str_digits(0)
HERE=Path(__file__).resolve().parent
BASE=HERE.parent
AXIS=BASE.parent/"followup-20261010-same-datum-axis"

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def iv(a):return F(a["lower"]),F(a["upper"])
def add(a,b):return a[0]+b[0],a[1]+b[1]
def mul(a,b):
    x=[u*v for u in a for v in b]
    return min(x),max(x)
def scale(a,x):return mul(a,(F(x),F(x)))
def pt(x):return F(x),F(x)
def contains(a,b):return a[0]<=b[0]<=b[1]<=a[1]

def exp_neg_alternating(x,n=256):
    """For 0<x<1, even partial sum is upper and next odd sum is lower."""
    x=F(x)
    assert 0<x<1 and n%2==0
    term=F(1);total=term
    for k in range(1,n+1):
        term*=(-x)/k;total+=term
    return total-term*x/(n+1),total

# A polynomial over QQ in h,j,P0,P2; no values are sampled for the identities.
class P:
    def __init__(self,d=None):self.d={k:F(v) for k,v in (d or {}).items() if v}
    @staticmethod
    def c(v):return P({(0,0,0,0):F(v)})
    @staticmethod
    def x(i):
        k=[0]*4;k[i]=1;return P({tuple(k):1})
    def __add__(self,b):
        if not isinstance(b,P):b=P.c(b)
        d=dict(self.d)
        for k,v in b.d.items():d[k]=d.get(k,0)+v
        return P(d)
    __radd__=__add__
    def __neg__(self):return P({k:-v for k,v in self.d.items()})
    def __sub__(self,b):return self+(-b if isinstance(b,P) else -F(b))
    def __rsub__(self,b):return (-self)+b
    def __mul__(self,b):
        if not isinstance(b,P):b=P.c(b)
        d={}
        for k,v in self.d.items():
            for l,w in b.d.items():
                m=tuple(a+c for a,c in zip(k,l));d[m]=d.get(m,0)+v*w
        return P(d)
    __rmul__=__mul__
    def __eq__(self,b):return self.d==b.d

def padd(a,b):
    return [(a[k] if k<len(a) else P.c(0))+(b[k] if k<len(b) else P.c(0))
            for k in range(max(len(a),len(b)))]
def pscale(a,b):return [x*b for x in a]
def pmul(a,b):
    out=[P.c(0) for _ in range(len(a)+len(b)-1)]
    for i,x in enumerate(a):
        for j,y in enumerate(b):out[i+j]=out[i+j]+x*y
    return out

def evaluate(coeff,y,k):
    # Exact interval Horner, independent of the producer's exact direct sum.
    out=pt(0)
    for n in range(len(coeff)-1,k-1,-1):
        out=add(mul(out,pt(y)),scale(coeff[n],F(factorial(n),factorial(n-k))))
    return out

def tail(chi,y,k):
    if y==0:return F(0)
    # First omitted degree is 25 after differentiating the entire series.
    term=(chi/2)**25*y**(25-k)/F(factorial(25-k)*factorial(26))
    ratio=chi*y/F(2*(26-k)*27)
    assert ratio<1
    return term/(1-ratio)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",required=True)
    parser.add_argument("--core-receipt",type=Path,default=BASE/"attempts/core-intervals-0001/receipt.json")
    args=parser.parse_args()
    paths={
      "acceptedPrefix":BASE/"attempts/pressure-prefix-0002/receipt.json",
      "pressure":BASE/"attempts/pressure-datum-0001/receipt.json",
      "core":args.core_receipt,
      "axis":AXIS/"axis-envelope-certificate.json",
    }
    prefix,pressure,core,axis=(json.loads(paths[x].read_text()) for x in paths)
    checks={}
    def check(name,value):
        if name in checks:raise ValueError(name)
        checks[name]=bool(value)
    hashes={name:sha(path) for name,path in paths.items()}
    check("accepted_prefix_is_0002",pressure["source"]["acceptedQuadrature"]=="attempts/pressure-prefix-0002/receipt.json")
    check("prefix_hash_authenticates_pressure_input",pressure["source"]["acceptedQuadratureSha256"]==hashes["acceptedPrefix"])
    check("rejected_prefix_preserved",(BASE/"attempts/pressure-prefix-0001/REJECTED.md").is_file())
    files={
      "prefixProducer":(BASE/"certify_pressure_prefix.py",prefix["source"]["producerSha256"],paths["acceptedPrefix"].parent),
      "pressureProducer":(BASE/"check_pressure_datum_interval.py",pressure["source"]["producerSha256"],paths["pressure"].parent),
      "pressureProof":(BASE/"PRESSURE_DATUM_INTERVAL.md",pressure["source"]["proofSha256"],paths["pressure"].parent),
      "coreProducer":(BASE/"evaluate_core_intervals.py",core["source"]["producerSha256"],paths["core"].parent),
      "coreProof":(BASE/"CORE_INTERVAL_EVALUATION.md",core["source"]["proofSha256"],paths["core"].parent),
    }
    for name,(file,expected,snapshot_dir) in files.items():
        hashes[name]=sha(file)
        check(name+"_current_and_saved_bytes",hashes[name]==expected==sha(snapshot_dir/file.name))
    hashes["coreArithmeticHelper"]=sha(AXIS/"evaluate_phi_comparison.py")
    check("core_helper_hash",core["source"]["arithmeticHelperSha256"]==hashes["coreArithmeticHelper"])
    check("core_pressure_input_hash",core["source"]["actualPressureInputSha256"]==hashes["pressure"])
    check("core_axis_input_hash",core["source"]["actualAxisEnvelopeSha256"]==hashes["axis"])
    check("sharp_axis_bound",axis["controlledRemainder"]["sharpDisplacement"]=="29*Q^(-53)")
    check("actual_outer_source",prefix["source"]["outerSha256"]==
          "ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81")
    collar=iv(prefix["method"]["collarFactorEnclosure"])
    check("corrected_whole_collar_interval",collar==(1-F(2,2**350),F(1)))
    check("body_cells",prefix["method"]["bodyCells"]==1792)
    ratio=F(prefix["method"]["step"])/F(prefix["method"]["complexCauchyRadius"])
    check("continuous_tail_exact",F(prefix["method"]["endpointRemainderPerCell"])==2*ratio**97/(1-ratio) and ratio==F(1,8))
    cp=iv(prefix["pressureCoefficient"])
    # Replay the final cP combination with a new exact alternating-series
    # enclosure for exp(-2/5), without the producer's exponential routine.
    cpi=add(pt(F(5,2)),scale(add(iv(prefix["actualIntegralOfR"]),exp_neg_alternating(F(2,5))),F(1,2)))
    check("cP_contains_independent_combination",contains(cp,cpi))
    check("cP_width_279_bits",0<cp[1]-cp[0]<F(1,2**279))
    check("full_strip_error_scalar",2*F(3,8)**1024<F(1,2**1400))
    check("positive_small_parameter_scalars",min(4,8002,8*8002)*2**39>2048)
    prows=pressure["normalizedPressureTaylorCoefficients"]
    for k,row in enumerate(prows):
        if k%2:expected=pt(0)
        else:
            mult=(-1)**(k//2+1)*(k//2+1)
            raw=scale(cp,mult);err=F(16**k,2**1400)
            expected=(raw[0]-err,raw[1]+err)
        check(f"pressure_coefficient_{k}",iv(row["coefficientInterval"])==expected)
        check(f"pressure_derivative_factorial_{k}",iv(row["derivativeInterval"])==scale(expected,factorial(k)))
        check(f"pressure_width_{k}",expected[1]-expected[0]<F(1,2**256))
    # Exact symbolic derivative of the full source Z*, with A+D=1.
    h,j,p0sym,p2sym=[P.x(i) for i in range(4)]
    A=P.c(F(1,2))+h;D=P.c(F(1,2))-h
    eta=[P.c(0),P.c(1)];d=[P.c(1),P.c(0),P.c(-1)];U=[j,P.c(4)]
    H=padd(pscale(eta,D),pmul(d,U))
    PP=[p0sym,P.c(0),p2sym*F(1,2)];Pprime=[P.c(0),p2sym]
    Z=padd(padd(pscale(pmul(padd([P.c(1)],pscale(pmul(eta,U),-2)),U),-A),pscale(H,-4)),
           padd(pscale(pmul(d,Pprime),-1),pscale(pmul(eta,PP),4*A)))
    check("Z0_full_polynomial_identity",Z[0]==-(A+4)*j)
    check("Zprime0_full_polynomial_identity",Z[1]==P.c(-20)+2*A*j*j-p2sym+4*A*p0sym)
    check("incompressibility_eta0_algebra",(A+D)==P.c(1))
    chi=F(1)/(1+F(1,2000)**2)
    check("chi_exact_positive_j_cancellation",chi==F(4000000,4000001))
    tiny=(F(0),F(1,2**2048));AA=add(pt(F(1,2)),tiny)
    cu=scale(add(AA,pt(4)),F(1,2))
    pp0=iv(prows[0]["derivativeInterval"]);pp2=iv(prows[2]["derivativeInterval"])
    bp=scale(add(add(scale(tiny,20),scale(mul(mul(AA,tiny),tiny),-2)),
                 add(pp2,scale(mul(AA,pp0),-4))),F(1,2))
    check("comparison_u_over_j",iv(core["linearComparisonCoefficients"]["u_over_j"])==cu)
    check("comparison_u_eta_over_K",iv(core["linearComparisonCoefficients"]["u_eta_over_K"])==bp)
    coeff=[(-chi/2)**n/F(factorial(n)*factorial(n+1)) for n in range(25)]
    square=[F(0)]*49
    for i,a in enumerate(coeff):
        for k,b in enumerate(coeff):square[i+k]+=a*b
    primitive=[pt(0)]+[pt(c/F(n+1)) for n,c in enumerate(square)]
    polys={"CE_over_sqrt_2X":[pt(c) for c in coeff],
      "Lambda_U_minus_j_over_j":[pt(0),cu],
      "Lambda_U_eta_minus_4_over_K":[pt(0),bp],
      "Lambda_V_over_X_plus_4_over_K":[pt(0),scale(bp,F(-1,2))],
      "C_squared_Lambda_pressure_increment":primitive}
    eps=F(29,2**(260*53));epsu=F(29,2**(260*52));radius=F(41,10)
    error=lambda e,y,k:e*factorial(k)/F(20**k)/(1-y/20)**(k+1)
    delta=[tail(chi,radius,k)+error(eps,radius,k) for k in range(3)]
    pressure_error=[25*delta[0],6*delta[0],4*(delta[0]+delta[1])]
    check("q24_value_bound",sum(abs(c)*radius**n for n,c in enumerate(coeff))<4)
    check("q24_derivative_bound",sum(n*abs(coeff[n])*radius**(n-1) for n in range(1,25))<2)
    check("all_75_rows_present",len(core["evaluations"])==75)
    for row in core["evaluations"]:
        name=row["quantity"];y=F(row["Y"]);k=row["radialDerivativeOrder"]
        tag=f"{name}_Y{y}_dY{k}"
        exact=evaluate(polys[name],y,k)
        check(tag+"_exact_QQ_comparison",iv(row["finiteComparisonExactInterval"])==exact)
        rounded=iv(row["finiteComparisonRoundedInterval"])
        check(tag+"_rounded_contains_independent_exact",contains(rounded,exact))
        if name=="CE_over_sqrt_2X":err=tail(chi,y,k)+error(eps,y,k)
        elif name=="C_squared_Lambda_pressure_increment":err=pressure_error[k]
        else:err=error(epsu,y,k)
        if y==0 and k==0:err=F(0)
        check(tag+"_positive_analytic_error",F(row["positiveAnalyticErrorUpper"])==err and err>=0)
        final=iv(row["sameInfiniteCoreInterval"])
        check(tag+"_final_enclosure",contains(final,(exact[0]-err,exact[1]+err)))
        check(tag+"_width",final[1]-final[0]<F(1,2**120))
    check("scope_no_all_eta_claim",core["claimBoundary"]["allEtaNonlinearGraphEvaluated"] is False)
    check("scope_no_Lean_bridge_claim",core["claimBoundary"]["newLeanAnalyticInstantiation"] is False)
    hashes["independentVerifier"]=sha(Path(__file__))
    report={"schema":"MathScope.IndependentPressureCoreAudit/1",
      "verifiedUTC":datetime.now(timezone.utc).isoformat(),
      "status":"PASS" if all(checks.values()) else "FAIL",
      "passed":sum(checks.values()),"total":len(checks),"checks":checks,
      "sourceSHA256":hashes,
      "workActuallyPerformed":{"producerImported":False,"quadratureCellsRerun":False,
        "acceptedQuadratureAlgorithmAndAnalyticRemainderReviewed":True,
        "pressureCoefficientRowsRecomputed":49,"coreValueAndDerivativeRowsRecomputed":75,
        "ZIdentityMethod":"Exact multivariate QQ polynomial, independent of producer",
        "finiteEvaluationMethod":"Exact QQ interval Horner; no producer arithmetic helper"},
      "scope":"Accepted prefix 0002, its 49 normalized actual-datum coefficient rows, and 75 same-core values/derivatives at eta=0. Does not evaluate the complete all-eta nonlinear graph or instantiate Lean analytic premises."}
    output=Path(args.output)
    with output.with_suffix(".verifier.py").open("xb") as f:f.write(Path(__file__).read_bytes())
    with output.open("x") as f:json.dump(report,f,indent=2);f.write("\n")
    print(json.dumps({k:report[k] for k in ("status","passed","total")}))
    for name,ok in checks.items():
        if not ok:print("FAILED",name)
    raise SystemExit(0 if report["status"]=="PASS" else 1)

if __name__=="__main__":main()
