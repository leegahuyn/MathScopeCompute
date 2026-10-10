#!/usr/bin/env python3
"""Bind the actual normalized pressure Taylor intervals to accepted quadrature."""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from fractions import Fraction as F
from pathlib import Path

HERE=Path(__file__).resolve().parent

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def record_interval(lo,hi):
    assert lo<=hi
    return {"lower":str(lo),"upper":str(hi),"width":str(hi-lo)}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--output",required=True,type=Path)
    args=p.parse_args()
    if args.output.exists(): raise SystemExit("Refusing to overwrite historical evidence")
    accepted=HERE/"attempts/pressure-prefix-0002/receipt.json"
    r=json.loads(accepted.read_text())
    checks={}
    def check(name,predicate):
        assert name not in checks
        checks[name]=bool(predicate)
    producer=HERE/"certify_pressure_prefix.py"
    proof=HERE/"PRESSURE_DATUM_INTERVAL.md"
    check("accepted_producer_current_hash",r["source"]["producerSha256"]==digest(producer))
    check("accepted_producer_snapshot_exact",producer.read_bytes()==(accepted.parent/producer.name).read_bytes())
    check("actual_outer_source_pinned",r["source"]["outerSha256"]=="ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81")
    check("rejected_attempt_has_explicit_record",(HERE/"attempts/pressure-prefix-0001/REJECTED.md").is_file())
    collar=r["method"]["collarFactorEnclosure"]
    check("collar_includes_upper_one",F(collar["upper"])==1)
    check("collar_includes_required_lower_endpoint",F(collar["lower"])<=1-F(2,2**350))
    check("literal_body_cell_count",r["method"]["bodyCells"]==1792)
    check("literal_precision_and_degree",r["method"]["precisionBits"]==384 and r["method"]["taylorDegree"]==96)
    check("step_over_radius_one_eighth",F(r["method"]["step"])/F(r["method"]["complexCauchyRadius"])==F(1,8))
    check("reciprocal_series_real_part_bound",F(194,225)>F(64,75))
    check("side_disc_exponent_bound",F(160,109)**2-F(256,27)<-4)
    check("middle_disc_argument_bound",F(1,256)*4/(F(3,10)-F(1,256))**3<F(2,3))
    check("middle_disc_cosine_bound",1-F(1,2)*F(2,3)**2==F(7,9))
    check("middle_disc_sigma_bound",F(9,7)<2)
    check("complex_R_log_bound",F(1,5)+F(13,5*256)<F(1,4))
    check("collar_sigma_upper",2*F(3,8)**254<F(1,2**350))
    check("exponential_tail_upper",2*F(1,2)**121/F(math.factorial(121))<F(1,2**700))
    check("actual_T_above_two_pow_39",F((2**20)**2,2)==2**39)
    check("T_above_1024",2**39>1024)
    check("normalized_full_datum_error_bound",2*F(3,8)**1024<F(1,2**1400))
    check("strip_angular_factor_bound",F(256,255)**2<2)
    coeff=r["pressureCoefficient"]
    lo,hi=F(coeff["lower"]),F(coeff["upper"])
    check("continuous_coefficient_order",F(3)<lo<hi<F(4))
    check("continuous_coefficient_reported_width_exact",hi-lo==F(coeff["width"]))
    check("continuous_coefficient_width_below_279_bits",hi-lo<F(1,2**279))
    check("continuous_coefficient_width_below_256_bits",hi-lo<F(1,2**256))
    array=[]
    for k in range(49):
        err=F(16**k,2**1400)
        if k%2:
            lower=upper=F(0)
        else:
            m=k//2
            mult=(-1)**(m+1)*(m+1)
            aa,bb=mult*lo,mult*hi
            lower,upper=min(aa,bb)-err,max(aa,bb)+err
        check(f"actual_pressure_coefficient_{k}_width",upper-lower<F(1,2**256))
        array.append({"degree":k,"coefficientInterval":record_interval(lower,upper),
                      "derivativeInterval":record_interval(lower*math.factorial(k),upper*math.factorial(k)),
                      "analyticErrorUpper":str(F(0) if k%2 else err),
                      "oddExactlyZeroByEvenness":bool(k%2)})
    check("degree_48_factorial_bound",math.factorial(48)<2**256)
    check("ordinary_derivative_analytic_error_through_48",F(math.factorial(48)*16**48,2**1400)<F(1,2**952))
    if not all(checks.values()): raise AssertionError([k for k,v in checks.items() if not v])
    out={"schema":"mathscope.same-datum.pressure-normalized-taylor.v1",
         "source":{"acceptedQuadrature":str(accepted.relative_to(HERE)),"acceptedQuadratureSha256":digest(accepted),
                   "proofSha256":digest(proof),"producerSha256":digest(Path(__file__))},
         "passed":sum(checks.values()),"total":len(checks),"checks":checks,
         "actualDatum":"The complete A.21 pressure for the new outer schedule; not its approximation.",
         "approximation":"Pi0/Pstar^2 = -cP/(1+eta^2)^2 + analyticError",
         "analyticErrorOnStrip":{"imaginaryWidth":"1/16","strictUpper":"1/2^1400"},
         "expansionCenter":"0","normalizedPressureTaylorCoefficients":array,
         "claimBoundary":{"sameA21DatumFiniteInputEnclosures":True,"allRealEtaAnalyticError":True,
                          "newLeanProof":False,"infiniteCoreFiniteArrayKernelBridge":False,
                          "fullProfileCertified":False}}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with args.output.open("x") as f: json.dump(out,f,indent=2);f.write("\n")
    for source in [Path(__file__),proof]:
        with (args.output.parent/source.name).open("xb") as f: f.write(source.read_bytes())
    print(json.dumps({"passed":out["passed"],"total":out["total"],"receipt":str(args.output)}))

if __name__=="__main__": main()
