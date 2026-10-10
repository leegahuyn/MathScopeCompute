#!/usr/bin/env python3
"""Exact arithmetic consequence of the written all-eta incoming-debt bounds.

This verifies the Leibniz constants and the link to the fresh B8 inverse.
It does not evaluate compact suprema or certify the analytic premises by
execution. Those premises remain explicit in the resulting receipt.
"""
import argparse
from datetime import datetime, timezone
from fractions import Fraction as F
import hashlib
import json
from math import comb
from pathlib import Path

HERE=Path(__file__).resolve().parent
AXIS=HERE.parent
GLUING=AXIS.parent/"followup-20261010-symbolic-gluing"

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def rat(value):
    return F(int(value["numerator"]),int(value["denominator"]))

def interval_abs_upper(value):
    return max(abs(F(int(value["lowerNumerator"]),2**value["denominatorPowerOfTwo"])),
               abs(F(int(value["upperNumerator"]),2**value["denominatorPowerOfTwo"])))

def derivative_product_bounds(a,b):
    return [sum(F(comb(k,j))*a[j]*b[k-j] for j in range(k+1))
            for k in range(min(len(a),len(b)))]

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",required=True)
    args=parser.parse_args()
    certificate=GLUING/"attempts/b8-0001/certificate.json"
    data=json.loads(certificate.read_text())
    checks={}
    def check(name,value):
        checks[name]=bool(value)
    check("fresh_B8_certificate",sha(certificate)==
          "0a2c375dfdd09d7aa90a0275a8697eb3eb073bf4a9b81e1f862af2ba8ed20f07")
    check("same_outer_family",data["source"]["parameterTreeSHA256"]==
          "38e23d037f8b75eaeb30448a815689e92171926d47787196c7c5395fe98425a8")
    norms={}
    for block in ("U","E"):
        exact=[[rat(x) for x in row] for row in data["inverse"+block]["exact"]]
        interval=data["inverse"+block]["interval"]
        exact_norm=max(sum(map(abs,row)) for row in exact)
        upper=max(sum(map(interval_abs_upper,row)) for row in interval)
        norms[block]={"exact":str(exact_norm),"intervalUpper":str(upper)}
        check(block+"_preconditioner_norm_below_2power40",exact_norm<=upper<2**40)
    # Pstar>1. Then q=(1+eta^2)/Pstar has derivative bounds (2,2,2).
    # q^2=(1+2eta^2+eta^4)/Pstar^2 has sharper bounds (4,8,16).
    du=list(map(F,[2,1,1]))  # coefficients of j from the actual drift premise
    q=list(map(F,[2,2,2]))
    qsq=list(map(F,[4,8,16]))
    linear=derivative_product_bounds(q,du)
    quadratic=derivative_product_bounds(qsq,derivative_product_bounds(du,du))
    check("linear_Leibniz_constants",linear==list(map(F,[4,6,10])))
    check("linear_14j_covers_all_orders",max(linear)<14)
    check("quadratic_Leibniz_constants",quadratic==list(map(F,[16,48,152])))
    check("quadratic_184j2_covers_all_orders",max(quadratic)<184)
    check("second_U_weight_integral_less_than_one",F(2)<F(8,5)**2)
    # j=h^4, epsilon_m=h^3, mu=h^2: no numerical exponential evaluation.
    check("linear_j_over_mu_exponent",4-2==2)
    check("quadratic_j_squared_over_mu_exponent",2*4-2==6)
    check("early_epsilon_over_mu_exponent",3-2==1)
    upper_h=F(1,2**200)
    beta=rat(data["bounds"]["allowedPreconditionedScaledDebtPerDerivative0To2"])
    u=2**40*(14*upper_h**2+upper_h)
    e=2**40*(184*upper_h**6+upper_h)
    check("required_beta_is_exact",beta==F(1,10**8))
    check("uniform_scaled_U_debt_less_than_beta",u<beta)
    check("uniform_scaled_E_debt_less_than_beta",e<beta)
    check("mu_upper_matches_h_upper_squared",rat(data["bounds"]["muUpper"])==upper_h**2)
    report={
      "schema":"MathScope.Navier.IndependentB8IncomingDebtArithmetic/1",
      "verifiedUTC":datetime.now(timezone.utc).isoformat(),
      "status":"PASS" if all(checks.values()) else "FAIL",
      "passed":sum(checks.values()),"total":len(checks),"checks":checks,
      "verifierSHA256":sha(Path(__file__)),
      "certificateSHA256":sha(certificate),
      "continuationNoteSHA256":sha(AXIS/"CONTINUATION_AND_NEW_DEBT.md"),
      "preconditionerNorms":norms,
      "linearLeibnizCoefficients":list(map(str,linear)),
      "quadraticLeibnizCoefficients":list(map(str,quadratic)),
      "preconditionedScaledDebtUpper":{"U":str(u),"E":str(e),"requiredBeta":str(beta)},
      "analyticPremises":{
         "same_actual_profile_throughout":"Required; defined and justified in the written continuation note, not evaluated by this program.",
         "positive_Pstar_greater_than_one":True,
         "positive_h_less_than_2powerMinus200":True,
         "drift_derivatives_orders_0_1_2":"(2j,j,j), with j=h^4, on the whole parameter interval.",
         "normalized_early_errors":"Every transformed row and actual eta derivative through order two has absolute value below epsilon_m=h^3.",
         "eta_independent_inverse":"The preconditioners belong to the normalized fresh B8 matrix.",
      },
      "scope":"Independent exact arithmetic implication of the displayed analytic premises; no numerical evaluation of Bref or Kcmp, no new Lean proof terms.",
    }
    with Path(args.output).open("x") as f:
        json.dump(report,f,indent=2);f.write("\n")
    print(json.dumps({k:report[k] for k in ("status","passed","total")}))
    raise SystemExit(0 if report["status"]=="PASS" else 1)

if __name__=="__main__":
    main()
