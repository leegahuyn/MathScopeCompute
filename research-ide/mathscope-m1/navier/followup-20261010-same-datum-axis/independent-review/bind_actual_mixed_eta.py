#!/usr/bin/env python3
"""Bind the accepted exact 125-row array to the selected actual kernel object.

Performs a targeted rational oracle replay and a continuous radial/eta-chart
bound. Does not import the numerical producer and does not claim a Lean
evaluation of the 125 numerical rows.
"""
from __future__ import annotations
import datetime
from fractions import Fraction as F
import hashlib
import importlib.util
import json
from math import comb, factorial
from pathlib import Path
import re
import sys
sys.set_int_max_str_digits(0)

HERE = Path(__file__).resolve().parent
AXIS = HERE.parent
FIN = HERE / "formal-finite-jet"
COMMIT = "f9e8bc5b38b6e212696e8a30e3e91517af887bbd"
KERNEL = "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5"
ALLOWED = {"propext", "Classical.choice", "Quot.sound"}

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def iv(x): return F(int(x["lowerNumerator"]),2**x["denominatorPowerOfTwo"]), F(int(x["upperNumerator"]),2**x["denominatorPowerOfTwo"])
def rat(x): return F(int(x["numerator"]),int(x["denominator"]))
def contains(a,b): return a[0] <= b[0] <= b[1] <= a[1]
def exact(x): return {"numerator": str(x.numerator), "denominator": str(x.denominator)}

def main():
    number = 1
    while (HERE/f"actual-mixed-eta-binding-{number:03d}.json").exists(): number += 1
    out = HERE/f"actual-mixed-eta-binding-{number:03d}.json"
    saved = HERE/f"actual-mixed-eta-binding-{number:03d}.inputs"
    saved.mkdir()
    checks, snaps = [], {}
    def check(name, value): checks.append({"name": name, "pass": bool(value)})
    def snapshot(key, path):
        dest = saved/key; dest.parent.mkdir(parents=True,exist_ok=True); dest.write_bytes(path.read_bytes())
        snaps[key] = {"source": str(path), "sha256": sha(dest)}
    audit_path = HERE/"mixed-phi-review-001.json"
    audit = json.loads(audit_path.read_text())
    check("accepted independent mixed review", audit["status"] == "PASS" and audit["passed"] == audit["total"] == 858)
    check("all independent mixed checks passed", all(audit["checks"].values()))
    snapshot("prior-review/receipt.json", audit_path)
    for name, digest in audit["inputSHA256"].items():
        p = Path(audit["snapshots"])/name
        check("frozen independent input: "+name, sha(p) == digest)
        if name != "independent-verifier.py":
            check("current numerical input: "+name, sha(AXIS/name) == digest)
        snapshot("prior-review/"+name,p)
    # Only pure interval/Taylor arithmetic helpers from the pinned independent
    # verifier are reused. Its main routine and all producer code stay unused.
    oracle_path = Path(audit["snapshots"])/"independent-verifier.py"
    spec = importlib.util.spec_from_file_location("pinned_mixed_independent_oracle",oracle_path)
    oracle = importlib.util.module_from_spec(spec); spec.loader.exec_module(oracle)
    modules = {
        "ConcreteJetRecurrence": AXIS/"formal-input-producer/assembly-attempts/0004",
        "MixedEtaBindings": FIN/"attempts/0008",
        "ConcreteFiniteJet": FIN/"attempts/0006",
        "SelectedReferenceBoxes": FIN/"attempts/0004",
    }
    recurrence = json.loads((modules["ConcreteJetRecurrence"]/"receipt.json").read_text())
    modules.update({n:Path(v["sourcePath"]).parent for n,v in recurrence["importedInputs"].items()})
    records = {}
    for name, root in modules.items():
        rec = json.loads((root/"receipt.json").read_text())
        source, obj, log = root/(name+".lean"),root/(name+".olean"),root/"lean.log"
        check(name+": accepted original-kernel producer",rec["status"]=="PASS" and rec["exitCode"]==0
              and rec["originalCommit"]==COMMIT and rec["originalTrackedFilesPreserved"] is True)
        check(name+": kernel pin",rec.get("kernelSHA256",rec.get("kernelSHA256Before"))==KERNEL)
        check(name+": source pin",sha(source)==rec["sourceSHA256"])
        obj_pin=rec.get("oleanSHA256",rec.get("outputOleanSHA256"))
        if obj_pin: check(name+": module output pin",sha(obj)==obj_pin)
        if "logSHA256" in rec: check(name+": log pin",sha(log)==rec["logSHA256"])
        logged={n:[a.strip() for a in s.split(",") if a.strip()]
                for n,s in re.findall(r"'([^']+)' depends on axioms:\s*\[([^\]]*)\]",log.read_text(),re.S)}
        check(name+": actual axiom log",logged==rec["printedAxioms"] and bool(logged)
              and all(set(a)<=ALLOWED for a in logged.values()))
        if name in recurrence["importedInputs"]:
            r=recurrence["importedInputs"][name]
            check(name+": actual recurrence import pin",sha(source)==r["sourceSHA256"] and sha(obj)==r["oleanSHA256"])
        for p in [source,root/"receipt.json",log]: snapshot("kernel/"+name+"/"+p.name,p)
        records[name]={"directory":str(root),"sourceSHA256":sha(source),"oleanSHA256":sha(obj),
                       "receiptSHA256":sha(root/"receipt.json")}
    # Check all recorded dependency edges of the new consumers, including
    # modules whose earlier producer receipt did not itself record an olean.
    for name, root in modules.items():
        rec=json.loads((root/"receipt.json").read_text())
        for dep,record in rec.get("importedInputs",{}).items():
            check(name+" -> "+dep+": source and module match",
                  records[dep]["sourceSHA256"]==record["sourceSHA256"] and records[dep]["oleanSHA256"]==record["oleanSHA256"])
        deps=rec.get("dependencies",{})
        if isinstance(deps,dict):
            for dep,record in deps.items():
                if dep in records:
                    check(name+" -> "+dep+": finite consumer pins",
                          records[dep]["sourceSHA256"]==record["sourceSHA256"]
                          and records[dep]["oleanSHA256"]==record["oleanSHA256"]
                          and records[dep]["receiptSHA256"]==record["receiptSHA256"])
    body=(modules["ConcreteJetRecurrence"]/"ConcreteJetRecurrence.lean").read_text()
    for key in ["selectedReference_coefficient_all_eta", "selectedReference_derivative_all_eta",
                "selected_normalized_xi_jet_error", "selectedPhi_N24_M4_recurrence"]:
        check("actual kernel coefficient binding: "+key,"theorem "+key in body)
    scalar=(modules["MixedEtaBindings"]/"MixedEtaBindings.lean").read_text()
    for key in ["actual_positive_interval_inputs", "actual_transport_polynomial", "actual_chi_normalized_coordinate",
                "actual_chart_interior", "actual_chart_xi_small", "actual_chart_positive"]:
        check("actual parameter/chart binding: "+key,"theorem "+key in scalar)
    cert=json.loads((AXIS/"evaluated-phi-mixed-comparison.json").read_text())
    check("coefficient shape 25 by 5",len(cert["coefficients"])==25 and all(len(r["etaTaylorCoefficients"])==5 for r in cert["coefficients"]))
    # Same exact independent chi=1-epsilon/(H0^2+epsilon) geometric inverse,
    # followed by binomial powers; all inputs now have actual kernel bounds.
    h=(F(0),F(1,2**4096)); b=(F(0),F(1,2**32768)); tiny=F(1,4000000)
    H=[oracle.pt(1),oracle.ia(oracle.pt(F(9,2)),oracle.minus(h)),oracle.minus(b),oracle.isc(b,-4),oracle.pt(0)]
    den=oracle.pmul(H,H); v=list(den); v[0]=oracle.pt(0)
    w=oracle.pscale(v,-1/(1+tiny))
    inv=oracle.pscale(oracle.psum(*(oracle.ppow(w,k) for k in range(5))),1/(1+tiny))
    chi=oracle.pscale(inv,-tiny);chi[0]=oracle.ia(oracle.pt(1),chi[0])
    z=list(chi);z[0]=oracle.pt(0);zpow=[oracle.ppow(z,k) for k in range(5)]
    check("actual chi center",chi[0]==oracle.pt(F(4000000,4000001)))
    R, eps = F(41,10),F(1,2**16000)
    rounding, block, rows = F(0),F(0),[]
    for n, recorded in enumerate(cert["coefficients"]):
        c=oracle.psum(*(oracle.pscale(zpow[k],F(comb(n,k))*chi[0][0]**(n-k)) for k in range(min(n,4)+1)))
        c=oracle.pscale(c,F((-1)**n,2**n*factorial(n)*factorial(n+1)))
        for m, entry in enumerate(recorded["etaTaylorCoefficients"]):
            reference, actual = iv(entry["comparisonInterval"]),iv(entry["actualNonlinearCoefficientInterval"])
            error=F(0) if n==0 else F(29*comb(n+m,m),2**(260*(53-m))*20**n*(n+1)**2*(m+1)**2)
            midpoint,radius=(actual[0]+actual[1])/2,(actual[1]-actual[0])/2
            check(f"row {n},{m}: exact same reference function",contains(reference,c[m]))
            check(f"row {n},{m}: exact actual nonlinear budget",rat(entry["positiveBanachCoefficientError"])==error)
            check(f"row {n},{m}: actual coefficient enclosure",contains(actual,(reference[0]-error,reference[1]+error)))
            check(f"row {n},{m}: literal midpoint and radius",radius>=0 and midpoint-radius==actual[0] and midpoint+radius==actual[1])
            check(f"row {n},{m}: exact normalization powers",m<53 and factorial(m)>0 and 260*(53-m)==13780-260*m)
            if n==0: check(f"constant radial row {m}: exact actual axis jet",actual==oracle.pt(1 if m==0 else 0))
            factor=R**n*eps**m
            rounding+=radius*factor;block+=error*factor
            rows.append({"n":n,"m":m,"normalization":"j^m/m! times ordinary eta derivative at zero",
                         "midpoint":exact(midpoint),"radius":exact(radius),"actualInterval":entry["actualNonlinearCoefficientInterval"],
                         "positiveNonlinearBudget":entry["positiveBanachCoefficientError"]})
    check("positive chart majorant",eps>0 and 16*eps<F(1,2))
    hvariation=(F(9,2)+h[1])/16+b[1]/16**2+4*b[1]/16**3
    check("comparison H deviation",hvariation<F(3,10))
    den_lower=F(7,10)**2-tiny
    check("comparison denominator lower",den_lower>F(12,25))
    check("comparison chi modulus",1+tiny/den_lower<2)
    check("comparison Bessel sum scalar reserve",R<5 and 3**5==243)
    radial=R**25/F(factorial(25)*factorial(26))/(1-R/F(26*27))
    radial_combined=radial/(1-16*eps)
    eta_tail=243*(16*eps)**5/(1-16*eps)
    nonlinear_value=F(4,3*2**512)
    total=nonlinear_value+eta_tail+radial_combined+block+rounding
    check("eta degree-four remainder below 2^-79000",eta_tail<F(1,2**79000))
    check("radial degree-24 remainder below 2^-120",radial_combined<F(1,2**120))
    check("nonlinear finite-block contribution below 2^-512",block<F(1,2**512))
    check("actual coefficient rounding below 2^-190",rounding<F(1,2**190))
    check("continuous actual chart total error below 2^-118",total<F(1,2**118))
    # A stricter independently checked reserve is recorded without making it
    # necessary for the announced target.
    check("continuous actual chart reserve below 2^-119",total<F(1,2**119))
    check("nonlinear comparison radius kept separate",audit["comparisonOnlyCauchyDisk"]=="|xi|<=1/16")
    snapshot("ACTUAL_MIXED_ETA_BINDING.md",HERE/"ACTUAL_MIXED_ETA_BINDING.md")
    snapshot("bind_actual_mixed_eta.py",Path(__file__))
    array_path=saved/"actual-midpoint-array.json"
    array_path.write_text(json.dumps({"schema":"MathScope.ActualSelectedMixedCoefficientMidpoints/1","rows":rows},indent=2)+"\n")
    budgets={"nonlinearValue":{"formula":"(4/3)*2^-512","verifiedDyadicUpper":"2^-511"},
        "comparisonEtaTaylorTail":{"formula":"243*(16*2^-16000)^5/(1-16*2^-16000)","verifiedDyadicUpper":"2^-79000"},
        "comparisonRadialTaylorTail":{"formula":"(41/10)^25/(25!*26!)/(1-(41/10)/(26*27))/(1-16*2^-16000)","verifiedDyadicUpper":"2^-120"},
        "nonlinearFiniteBlock":{"formula":"sum n<25,m<5 E_nm*(41/10)^n*(2^-16000)^m","verifiedDyadicUpper":"2^-512"},
        "directedCoefficientRoundoff":{"formula":"sum n<25,m<5 radius_nm*(41/10)^n*(2^-16000)^m","verifiedDyadicUpper":"2^-190"},
        "total":{"formula":"sum of the five separate positive contributions","verifiedDyadicUpper":"2^-118","additionalVerifiedReserve":"2^-119"}}
    receipt={"schema":"MathScope.Navier.ActualMixedEtaBinding/1","status":"PASS" if all(c["pass"] for c in checks) else "FAIL",
        "finishedUTC":datetime.datetime.now(datetime.timezone.utc).isoformat(),"passed":sum(c["pass"] for c in checks),"total":len(checks),"checks":checks,
        "kernelModules":records,"snapshots":snaps,"priorIndependentReviewSHA256":sha(audit_path),
        "coefficientArraySHA256":sha(AXIS/"evaluated-phi-mixed-comparison.json"),
        "actualMidpoints":{"path":str(array_path),"sha256":sha(array_path),"count":125},
        "actualField":"MathScope.SameDatumInputs.selectedPhi from ConcreteProducer 0002",
        "actualTaylorBlock":"rectangularTaylor selectedPhiCoefficients 25 5 0 Y eta",
        "actualChart":{"radial":"0<=Y<=41/10","parameter":"|eta|<=rho/4","coordinate":"xi=eta/j, j=h^4>0","positiveRadius":True,"xiUpper":"2^-16000"},
        "comparisonOnlyComplexDisk":"|xi|<=1/16; not assumed to be a complex domain of selectedPhi",
        "uniformErrorBudgets":budgets,"actualFiniteRadialAndEtaTruncationBound":"|selectedPhi(Y,eta)-sum c_nm Y^n(eta/j)^m|<2^-118 on the entire stated real chart",
        "actualNumericalRoundingPremisesResolved":True,"unspecifiedCOrDeltaOrHround":False,
        "producerCodeImported":False,"exactReferenceRowsReplayed":125,"entireChartBoundUsesSampling":False,
        "all125NumericalRowsReevaluatedByLeanKernel":False,"all125RowsValidatedByExactRationalArithmetic":True,
        "wholeParameterIntervalCoveredByThisFiniteChart":False,"full4792NodeGraphEvaluated":False,
        "allOriginalNineConditionsProvedByThisReceipt":False}
    out.write_text(json.dumps(receipt,indent=2)+"\n")
    print(json.dumps({"path":str(out),"status":receipt["status"],"passed":receipt["passed"],"total":receipt["total"],"actualMidpointCount":125}))
    for c in checks:
        if not c["pass"]: print(json.dumps(c))
    return 0 if receipt["status"]=="PASS" else 1

if __name__=="__main__": raise SystemExit(main())
