#!/usr/bin/env python3
"""Evaluate normalized values and derivatives of the same nonlinear core."""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
import math
import sys
from fractions import Fraction as F
from pathlib import Path

sys.set_int_max_str_digits(0)
HERE=Path(__file__).resolve().parent
AXIS=HERE.parent/"followup-20261010-same-datum-axis"
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def pack_interval(a): return {"lower":str(a[0]),"upper":str(a[1]),"width":str(a[1]-a[0])}
def iadd(a,b): return a[0]+b[0],a[1]+b[1]
def imul(a,b):
    v=[x*y for x in a for y in b]
    return min(v),max(v)
def ipoint(x): return F(x),F(x)
def ineg(a): return -a[1],-a[0]
def iscale(a,s): return imul(a,ipoint(s))

def poly_exact(coeff,Y,k):
    out=ipoint(0)
    for n in range(k,len(coeff)):
        out=iadd(out,iscale(coeff[n],F(math.factorial(n),math.factorial(n-k))*Y**(n-k)))
    return out

def poly_rounded(D,coeff,Y,k):
    out=D.point(0);y=D.point(Y)
    for n in reversed(range(k,len(coeff))):
        scaled=iscale(coeff[n],F(math.factorial(n),math.factorial(n-k)))
        a=D.point(scaled[0]);b=D.point(scaled[1]);ci=(a[0],b[1])
        out=D.add(D.mul(out,y),ci)
    return out

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--output",type=Path,required=True)
    args=p.parse_args()
    if args.output.exists(): raise SystemExit("Refusing to overwrite historical evidence")
    helper=AXIS/"evaluate_phi_comparison.py"
    input_paths=[helper,AXIS/"axis-envelope-certificate.json",AXIS/"SAME_DATUM_ANALYTIC_AXIS.md",
                 HERE/"attempts/pressure-datum-0001/receipt.json",HERE/"PRESSURE_DATUM_INTERVAL.md"]
    input_bytes={path:path.read_bytes() for path in input_paths}
    spec=importlib.util.spec_from_file_location("same_phi_intervals",helper)
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
    D=mod.Directed(256)
    pressure_path=HERE/"attempts/pressure-datum-0001/receipt.json"
    pressure=json.loads(pressure_path.read_text())
    axpath=AXIS/"axis-envelope-certificate.json"
    axis=json.loads(axpath.read_text())
    checks={}
    def check(name,test):
        assert name not in checks
        checks[name]=bool(test)
    check("actual_pressure_input_passed",pressure["passed"]==pressure["total"])
    check("pressure_full_datum_analytic_error_present",pressure["analyticErrorOnStrip"]["strictUpper"]=="1/2^1400")
    check("new_axis_bound_passed",axis["passed"]==axis["total"])
    check("sharp_displacement_proved",axis["controlledRemainder"]["sharpDisplacement"]=="29*Q^(-53)")
    rowsP=pressure["normalizedPressureTaylorCoefficients"]
    p0=tuple(F(rowsP[0]["derivativeInterval"][x]) for x in ("lower","upper"))
    p2=tuple(F(rowsP[2]["derivativeInterval"][x]) for x in ("lower","upper"))
    tau=F(1,2**2048)
    tiny=(F(0),tau)
    AA=iadd(ipoint(F(1,2)),tiny)
    cu=iscale(iadd(AA,ipoint(4)),F(1,2))
    bp=iscale(iadd(iadd(iscale(tiny,20),ineg(iscale(imul(imul(AA,tiny),tiny),2))),
                   iadd(p2,ineg(iscale(imul(AA,p0),4)))),F(1,2))
    check("B_P_positive",bp[0]>0)
    check("B_P_actual_width",bp[1]-bp[0]<F(1,2**256))
    check("h_and_inverse_K_bounds",8002*2**39>2048 and 4*2**39>2048)
    check("j_squared_bound",8*8002*2**39>2048)
    chi=F(4000000,4000001);N=24;R=F(41,10)
    cs=[(-chi/F(2))**n/F(math.factorial(n)*math.factorial(n+1)) for n in range(N+1)]
    q=[ipoint(c) for c in cs]
    q2=[sum((cs[i]*cs[n-i] for i in range(max(0,n-N),min(N,n)+1)),F(0)) for n in range(2*N+1)]
    pp=[ipoint(0)]+[ipoint(q2[n]/(n+1)) for n in range(2*N+1)]
    check("comparison_polynomial_absolute_bound",sum(abs(c)*R**n for n,c in enumerate(cs))<4)
    check("comparison_derivative_absolute_bound",sum(n*abs(cs[n])*R**(n-1) for n in range(1,N+1))<2)
    eps=F(29,2**(260*53));epsu=F(29,2**(260*52))
    uniform_phi=[]
    for k in range(3):
        delta=mod.bessel_tail(chi,R,N,k)+eps*math.factorial(k)/F(20**k)/(1-R/20)**(k+1)
        uniform_phi.append(delta)
        check(f"uniform_phi_error_{k}",0<delta<F(1,2**130))
    epp=[25*uniform_phi[0],6*uniform_phi[0],4*(uniform_phi[0]+uniform_phi[1])]
    polys={"CE_over_sqrt_2X":q,
           "Lambda_U_minus_j_over_j":[ipoint(0),cu],
           "Lambda_U_eta_minus_4_over_K":[ipoint(0),bp],
           "Lambda_V_over_X_plus_4_over_K":[ipoint(0),iscale(bp,F(-1,2))],
           "C_squared_Lambda_pressure_increment":pp}
    rows=[]
    for Y in [F(0),F(1),F(2),F(4),R]:
        for name,poly in polys.items():
            for k in range(3):
                exact=poly_exact(poly,Y,k)
                rounded=poly_rounded(D,poly,Y,k)
                lo,hi=D.rational_ends(rounded)
                tag=f"{name}_Y{Y}_k{k}"
                check(tag+"_independent_exact_interval_in_rounded",lo<=exact[0]<=exact[1]<=hi)
                if name=="CE_over_sqrt_2X":
                    error=mod.bessel_tail(chi,Y,N,k)+eps*math.factorial(k)/F(20**k)/(1-Y/20)**(k+1)
                    if Y==0 and k==0:error=F(0)
                elif name=="C_squared_Lambda_pressure_increment":
                    error=epp[k]
                    if Y==0 and k==0:error=F(0)
                else:
                    error=epsu*math.factorial(k)/F(20**k)/(1-Y/20)**(k+1)
                    if Y==0 and k==0:error=F(0)
                final=D.widen(rounded,error)
                flo,fhi=D.rational_ends(final)
                check(tag+"_analytic_error_covered",flo<=exact[0]-error and fhi>=exact[1]+error)
                check(tag+"_output_width",fhi-flo<F(1,2**120))
                rows.append({"quantity":name,"eta":"0","Y":str(Y),"radialDerivativeOrder":k,
                             "finiteComparisonExactInterval":pack_interval(exact),
                             "finiteComparisonRoundedInterval":pack_interval((lo,hi)),
                             "roundingExcess":{"left":str(exact[0]-lo),"right":str(hi-exact[1])},
                             "positiveAnalyticErrorUpper":str(error),
                             "sameInfiniteCoreInterval":pack_interval((flo,fhi)),
                             "decimalDisplayOnly":[float(flo),float(fhi)]})
    check("actual_rounding_was_nonzero",any(F(x["roundingExcess"]["left"])+F(x["roundingExcess"]["right"])>0 for x in rows))
    if not all(checks.values()):raise AssertionError([k for k,v in checks.items() if not v])
    proof=HERE/"CORE_INTERVAL_EVALUATION.md"
    result={"schema":"mathscope.same-datum.evaluated-core-intervals.v1",
            "source":{"actualPressureInputSha256":digest(pressure_path),"actualAxisEnvelopeSha256":digest(axpath),
                      "arithmeticHelperSha256":digest(helper),"producerSha256":digest(Path(__file__)),"proofSha256":digest(proof)},
            "inputSnapshots":[{"sourcePath":str(path.relative_to(HERE.parent)),
                               "snapshot":"inputs/"+str(i)+"-"+path.name,
                               "sha256":hashlib.sha256(data).hexdigest()} for i,(path,data) in enumerate(input_bytes.items())],
            "passed":sum(checks.values()),"total":len(checks),"checks":checks,
            "arithmetic":{"precisionBits":256,"directedOperations":D.operations,"independentCheck":"Exact Fraction interval polynomial sum"},
            "exactParameters":{"chiAtEtaZero":str(chi),"h":"exp(-8002*T)","j":"h^4","K":"exp(4*T)",
                               "positiveSmallParameterEnclosure":["0",str(tau)],"smallParametersReplacedByZero":False},
            "linearComparisonCoefficients":{"u_over_j":pack_interval(cu),"u_eta_over_K":pack_interval(bp)},
            "radialPolynomialDegree":24,"pressurePolynomialDegree":49,"evaluations":rows,
            "uniformErrors":{"Y":["0","41/10"],"eta":"0","phiOrders0To2":[str(x) for x in uniform_phi],
                             "pressurePrimitiveOrders0To2":[str(x) for x in epp]},
            "claimBoundary":{"actualInfiniteCoreEvaluationsEnclosed":True,"actualPressureInputUsed":True,
                             "oneActualEtaDerivativeIncluded":True,"allEtaNonlinearGraphEvaluated":False,
                             "newLeanAnalyticInstantiation":False,"fullProfileCertified":False}}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    if any(path.read_bytes()!=data for path,data in input_bytes.items()):
        raise RuntimeError("An input changed during evaluation; rerun with a fresh output path")
    (args.output.parent/"inputs").mkdir(exist_ok=False)
    for i,(path,data) in enumerate(input_bytes.items()):
        with (args.output.parent/"inputs"/(str(i)+"-"+path.name)).open("xb") as f:f.write(data)
    with args.output.open("x") as f:json.dump(result,f,indent=2);f.write("\n")
    for src in [Path(__file__),proof]:
        with (args.output.parent/src.name).open("xb") as f:f.write(src.read_bytes())
    print(json.dumps({"passed":result["passed"],"total":result["total"],"evaluations":len(rows),
                      "directedOperations":D.operations,"receipt":str(args.output)}))

if __name__=="__main__":main()
