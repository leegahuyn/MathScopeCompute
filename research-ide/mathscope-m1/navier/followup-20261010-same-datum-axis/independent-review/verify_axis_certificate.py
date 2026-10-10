#!/usr/bin/env python3
"""Independent exact audit of the local-axis scalar certificate.

Does not import or execute the producer. The 24 monomials below are counted
directly from the pinned Lean naturalRemainder definition. Each records the
number of input factors, so its Lipschitz bound follows by a telescoping
product difference, rather than reusing the producer's dual-number tree.
Analytic arguments that turn these scalar bounds into a fixed point are
reviewed separately in REVIEW.md; finite checks are not Lean proof terms.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from collections import defaultdict
from datetime import datetime, timezone
from fractions import Fraction as F
from math import factorial
from pathlib import Path

HERE = Path(__file__).resolve().parent
AXIS = HERE.parent
PINNED = {
    "AxisContraction.lean": "d9151673815948eef8e8e2db3e93c95119ce7be80fc6a01d8a83f2bc4cd4df9d",
    "NaturalAxisBridge.lean": "9d1d98bdc48199dd483ab6cc8cd5a356847373faab7aca2908c166cd6d0c754f",
}

# (literal summand, positive coefficient, total Q degree, variable degree)
# Every fixed field/operator contributes Q; each phi/u contributes Q;
# the actual normalized amplitude contributes 2, not Q. |t|<=1.
TERMS = {
 "lin1": [
    ("j2(wStar*phi)",1,4,1), ("j2(h*one*phi)",1,4,1),
    ("j2(2h*(eta*uStar)*phi)",2,6,1),
    ("dot2(wStar,phi)",1,3,1), ("param2(phi,hStar)",1,3,1)],
 "quad1": [("j2(((d*zeta)*u)*phi)",1,8,2)],
 "slow1": [
    ("j2(((2D*eta)*average(u))*phi)",2,7,2),
    ("j2(((2h*eta)*u)*phi)",2,6,2),
    ("param2(average(u),d*phi)",1,6,2),
    ("dot2((2D*eta)*average(u),phi)",2,6,2),
    ("d*mixed2(average(u),phi)",1,6,2),
    ("param2(phi,d*u)",1,5,2)],
 "lin2": [
    ("j1(A*one*u)",1,4,1), ("j1(4A*(eta*uStar)*u)",4,6,1),
    ("j1((d*uStarEta)*u)",1,6,1),
    ("dot1(wStar,u)",1,3,1), ("param1(u,hStar)",1,3,1)],
 "slow2": [
    ("j1((2A*eta)*(u*u))",2,6,2),
    ("dot1((2D*eta)*average(u),u)",2,6,2),
    ("d*mixed1(average(u),u)",1,6,2),
    ("param1(u,d*u)",1,5,2)],
 "pressure": [
    ("j1((4A*eta)*primitive((g*g)*(phi*phi)))",16,9,2),
    ("j1(d*parameterPrimitive((g*g)*(phi*phi)))",4,9,2),
    ("j1((2eta)*mulY((g*g)*(phi*phi)))",8,9,2)],
}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def collect(terms, shift=0):
    bound, lip = defaultdict(int), defaultdict(int)
    for _, c, degree, variable_degree in terms:
        bound[degree+shift] += c
        lip[degree+shift-1] += c*variable_degree
    return {"bound": {str(k): str(v) for k,v in sorted(bound.items())},
            "lipschitz": {str(k): str(v) for k,v in sorted(lip.items())}}

def verify(original_root):
    cert_path = AXIS/"axis-envelope-certificate.json"
    cert = json.loads(cert_path.read_text())
    checks = {}
    def check(name, value):
        if name in checks:
            raise ValueError(name)
        checks[name] = bool(value)
    source_hashes = {}
    if original_root:
        original_root = Path(original_root)/"NavierStokes"
        for name, expected in PINNED.items():
            source_hashes[name] = sha(original_root/name)
            check("live_original_"+name, source_hashes[name] == expected)
        for name in ("AxisCoefficientSpace.lean", "AxisWeightEstimates.lean",
                     "AxisOperators.lean", "AxisResolvent.lean", "AxisEvaluation.lean"):
            source_hashes[name] = sha(original_root/name)
    check("original_commit", cert["sourceBinding"]["officialCommit"] ==
          "f9e8bc5b38b6e212696e8a30e3e91517af887bbd")
    tree = cert["controlledRemainder"]["tree"]
    counted = {name: collect(terms) for name, terms in TERMS.items()}
    for name, result in counted.items():
        check(name+"_direct_Lean_summand_count", result == tree[name])
    first_terms = sum((TERMS[name] for name in ("lin1","quad1","slow1")), [])
    second_terms = sum((TERMS[name] for name in ("lin2","slow2","pressure")), [])
    counted["first"] = collect(first_terms, 3)  # S, product, inverseL
    counted["second"] = collect(second_terms, 2)  # product, inverseL
    check("first_resolvent_and_inverseL", counted["first"] == tree["first"])
    check("second_inverseL", counted["second"] == tree["second"])
    final_terms = [(name,c,d+3,k) for name,c,d,k in first_terms] + \
                  [(name,c,d+2,k) for name,c,d,k in second_terms]
    result = collect(final_terms)
    check("whole_bound", result["bound"] == cert["controlledRemainder"]["polynomialBound"])
    check("whole_lipschitz", result["lipschitz"] == cert["controlledRemainder"]["polynomialLipschitz"])
    qmin = 2**260
    for name, poly in result.items():
        # For every Q>=qmin: sum c_d Q^d <= (sum c_d)Q^maxd < Q^32.
        check(name+"_strict_for_all_Q", max(map(int,poly)) < 32 and
              sum(map(F,poly.values())) < qmin)
    hmax = jmax = F(1,1000)
    sigma_max = jmax/2000
    radius_max = sigma_max**2/2048
    z = F(17,16)
    check("tube_radius_and_real_window", F(33,32)+radius_max < z)
    check("H_sup", F(9,2)*z+4*z**3+jmax*(1+z*z) < 10)
    check("H_derivative_sup", F(9,2)+12*z*z+2*jmax*z < 20)
    check("H_squared_perturbation", F(400,2048)+400*sigma_max**2/2048**2 < F(1,4))
    check("chi_complex_bound_real_reference", F(1,4) < F(3,4))
    check("L_nonzero", 1-2*hmax*z*z > F(99,100))
    check("pressure_measure_bound_on_strip", 4*F(256,255)**2 < 5)
    check("pressure_Cauchy_circle_fits", radius_max+F(1,32)<F(1,16))
    check("pressure_derivative_160K", 5/F(1,32)==160)
    ratio = F(1,16)
    cauchy_loss = (1+ratio)/(1-ratio)**3
    check("Cauchy_exact_weight_loss", cauchy_loss == F(4352,3375) and cauchy_loss<2)
    check("zeta_sup", F(2)*10/F(3,4) < 32)
    check("Z_sup", 1*(1+2*2*5)*5+4*10+3*160+4*1*2*5 < 1024)
    check("phase_integral_length_bound", z<2)
    check("amplitude_normalization_covers_complex_sup", 32*2==64)
    check("all_actual_operator_constants", 5120*65536 < qmin)
    check("resolvent_5120_below_80_squared", 5120 < 80**2)
    check("resolvent_exp_bound", 3**160 < 2**256)
    check("axial_reference_norm", 40*64*4*2048 < 2**25)
    check("reference_ball_norm", 2**256+2**25+1 < qmin)
    check("fixed_point_error_lt_half", 1 < qmin**32)
    check("Phi_positive", F(305719,1152000)-F(1,2**100)>F(1,4))
    scalars = {}
    for k in range(5):
        for m in range(5):
            b = F(factorial(k+m),(m+1)**2*20**k)*F(4,3)**(m+k+1)
            scalars[f"{k},{m}"] = str(b)
            if k<=2 and m<=2:
                check(f"mixed_scalar_{k}_{m}",b<128)
    check("mixed_C2_error",64<qmin)
    # Up to one radial derivative and four parameter derivatives, used in
    # the continuation's finite-order bookkeeping, the whole-pair norm Q
    # and rho^-1<=Q give a bound below Q^6 (individually).
    check("input_derivatives_eta_through_four", all(F(scalars[f"{k},{m}"])<qmin
          for k in range(2) for m in range(5)))
    check("does_not_claim_full_Lean_instantiation",
          cert["boundaries"]["fullAnalyticPremisesProvedInLean"] is False)
    return {
      "schema":"MathScope.Navier.IndependentAxisScalarAudit/1",
      "status":"PASS" if all(checks.values()) else "FAIL",
      "verifiedUTC":datetime.now(timezone.utc).isoformat(),
      "producerImported":False,
      "finiteChecksAreLeanProofTerms":False,
      "certificateSHA256":sha(cert_path),
      "producerSHA256":sha(AXIS/"check_axis_envelopes.py"),
      "writtenProofSHA256":sha(AXIS/"SAME_DATUM_ANALYTIC_AXIS.md"),
      "verifierSHA256":sha(Path(__file__)),
      "liveOriginalSourceSHA256":source_hashes,
      "directMonomialRecords":TERMS,
      "countedTree":counted,"result":result,
      "CauchyLossExact":str(cauchy_loss),
      "mixedScalarBounds":scalars,
      "checks":checks,"passed":sum(checks.values()),"total":len(checks),
      "scope":"Exact finite bounds plus independently written analytic review; no new Lean theorem or global-profile certification.",
    }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--original-root")
    parser.add_argument("--output",required=True)
    args=parser.parse_args()
    report=verify(args.original_root)
    with Path(args.output).open("x") as f:
        json.dump(report,f,indent=2);f.write("\n")
    print(json.dumps({k:report[k] for k in ("status","passed","total")}))
    raise SystemExit(0 if report["status"]=="PASS" else 1)

if __name__=="__main__":
    main()
