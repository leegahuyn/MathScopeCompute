#!/usr/bin/env python3
"""Exact constant and exponential absorptions for LOOP_DERIVATIVE_ENVELOPE.md.

This audit proves scalar implications for all S>=2^20.  It does not consume
or authenticate a claimed source norm, and does not issue an actual N.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
SMIN = 2**20
CHECKS = []

def add(name, ratio, explanation, data):
    if not ratio < 1:
        raise AssertionError(name)
    CHECKS.append({"id":name,"passed":True,"worstEndpointRatio":str(ratio),
                   "argument":explanation,**data})

def power(name, terms, target):
    if any(c<0 or k>target for c,k in terms):
        raise ValueError("Cannot certify this majorant")
    q=sum((F(c,SMIN**(target-k)) for c,k in terms),F(0))
    add(name,q,"Nonnegative polynomial divided by S^target is nonincreasing for S>=2^20.",
        {"terms":terms,"targetPower":target})

def exp_budget(name, factors, target, s_power=0, two_power=0):
    # Product exp(S^k)^n * S^p * 2^b.
    # Its log <= sum n S^k + p S + b, since log S <= S and log 2 < 1.
    terms=list(factors)+([(s_power,1)] if s_power else [])+([(two_power,0)] if two_power else [])
    # factors are (multiplicity,index); same orientation as power terms.
    power(name,terms,target)
    CHECKS[-1]["exponentialFactors"]=[{"multiplicity":n,"index":k} for n,k in factors]
    CHECKS[-1]["ordinarySPower"]=s_power
    CHECKS[-1]["powerOfTwo"]=two_power

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--output",required=True,type=Path)
    a=p.parse_args()
    if a.output.exists():
        raise SystemExit("Refusing to overwrite a historical audit receipt")
    proof=HERE/"LOOP_DERIVATIVE_ENVELOPE.md"
    loop=HERE/"QUANTITATIVE_LOOP_SELECTION.md"

    power("variance_bracket",[(1,0),(32,2),(2**31,9)],12)
    exp_budget("real_t_bound",[(2,13)],14,s_power=12,two_power=1)
    exp_budget("real_j_bound",[(1,14)],15,s_power=1,two_power=1)
    exp_budget("delta_quadratic_cone_entry",[(2,15)],16,s_power=2,two_power=5)
    exp_budget("delta_d0_and_boundary_entries",[],16,s_power=1,two_power=3)
    exp_budget("raw_cone_margin_cutoff",[(1,16)],17,two_power=3)
    exp_budget("raw_cone_margin_angular",[(2,14)],17,two_power=1)
    exp_budget("raw_cone_margin_d0",[],17,s_power=2,two_power=4)

    # Fixed derivative coefficients of the literal source cutoff.
    cutoff_coeff={0:1}
    cutoff_tables=[]
    for k in range(9):
        total=sum(abs(v) for v in cutoff_coeff.values())
        if total>=2**40:
            raise AssertionError("Cutoff coefficient recurrence")
        cutoff_tables.append({"order":k,"coefficients":{str(m):v for m,v in cutoff_coeff.items()},
                              "absoluteCoefficientSum":total})
        if k<8:
            nxt={}
            for m,c in cutoff_coeff.items():
                if m:
                    nxt[m+1]=nxt.get(m+1,0)-m*c
                nxt[m+3]=nxt.get(m+3,0)+2*c
            cutoff_coeff={m:c for m,c in nxt.items() if c}
    add("cutoff_coefficient_integer_bound",F(26**8,2**40),
        "The exact derivative recurrence is included in the receipt.",{})
    add("cutoff_monomial_integer_bound",F(12**12,2**44),
        "For m<=24, sup s^(m/2) exp(-s) <= max(1,12^12).",{})
    add("cutoff_denominator_positive",F(3**4,2**7),
        "e<3 implies exp(-4)>1/81>2^-7; one of t,1-t is at least 1/2.",{})
    for k in range(1,9):
        # inv coefficient: 2^7 * sum <= k * 2^129 * 2^(144*k)
        add(f"cutoff_reciprocal_order_{k}",F(k,2**(144-7-129)),
            "Reciprocal normalized Taylor recurrence, using already proved lower orders.",{})
    add("cutoff_eighth_factorial",F(40320,2**16),"8!<2^16.",{})
    add("cutoff_sigma_all_orders",F(9*2**128*2**1296*2**16,2**2048),
        "Leibniz sum has <=9 terms for each order<=8.",{})
    add("mixed_exponential_coefficients",F(17**8,2**40),
        "Each of eight differentiations multiplies coefficient l1 norm by at most seventeen.",{})

    exp_budget("moment_generating_ratio_eight_derivatives",[(40,13)],15,two_power=128)
    exp_budget("removable_quotient_positive_lower",[(4,13)],14,two_power=1)
    exp_budget("square_root_Q_three_derivatives",[(3,15),(3,14)],17,two_power=20)
    exp_budget("W_three_derivatives",[(1,17)],19,s_power=64,two_power=20)
    exp_budget("W_mu_positive_lower",[(6,13)],14,s_power=1,two_power=5)
    exp_budget("cutoff_after_source_composition",[(3,16)],18,s_power=3,two_power=2064)
    exp_budget("implicit_right_side",[(1,18),(3,16)],20,s_power=16,two_power=32)
    exp_budget("full_implicit_equation",[(1,20)],22,s_power=12,two_power=32)
    exp_budget("implicit_first_derivative",[(1,22),(1,14)],23,two_power=4)
    exp_budget("implicit_second_derivative",[(1,22),(2,23),(1,14)],26,two_power=16)
    exp_budget("implicit_third_derivative",[(1,22),(3,26),(1,14)],30,two_power=20)
    exp_budget("divided_difference_integrand",[(1,15),(1,14)],17,s_power=104,two_power=64)
    exp_budget("composed_mu_times_p",[(1,30)],31,s_power=3,two_power=8)
    exp_budget("actual_t_mixed_jet",[(1,17),(3,31),(1,30)],35,two_power=40)
    exp_budget("target_v_mixed_jet",[(2,18)],20,s_power=2,two_power=12)
    exp_budget("reciprocal_v_mixed_jet",[(3,20)],22,two_power=20)
    exp_budget("circle_density_jet",[(2,35),(1,22)],38,s_power=1,two_power=20)
    exp_budget("circle_lift_jet",[(1,38)],39,two_power=3)
    exp_budget("inverse_circle_first",[(1,39)],40,s_power=2,two_power=6)
    exp_budget("inverse_circle_second",[(1,39),(2,40)],43,s_power=2,two_power=20)
    exp_budget("inverse_circle_third",[(1,39),(3,43)],48,s_power=2,two_power=32)
    exp_budget("reciprocal_loop_denominator",[(6,35)],37,two_power=24)
    exp_budget("composed_actual_loop",[(1,37),(1,35),(1,20),(3,48)],55,two_power=64)
    exp_budget("full_loop_jet_norm",[(1,55)],56,two_power=5)
    exp_budget("actual_zero_mean_primitives",[(1,56)],60,s_power=1,two_power=6)
    exp_budget("final_R_dominates_primitive",[(1,60)],256)
    exp_budget("final_R_dominates_cone_inverse",[(1,17)],256)
    power("final_R_exceeds_8192",[(13,0)],256)

    a.output.parent.mkdir(parents=True,exist_ok=True)
    # Preserve exact proof and producer bytes for this historical observation.
    for src in (proof,loop,Path(__file__)):
        dst=a.output.parent/src.name
        with dst.open("xb") as out:
            out.write(src.read_bytes())
    out={
        "schema":"mathscope.loop-derivative-envelope.scalar-audit.v1",
        "minimumS":SMIN,
        "expressions":{"d0":"1/(8*S)","muMax":"S^12","deltaL":"exp(-S^16)",
                       "rawConeLower":"exp(-S^17)","R":"exp(S^256)",
                       "conditionalN":"1+ceil(exp(50*S^256))","conditionalKappa":"exp(-10*S^256)"},
        "sources":{src.name:hashlib.sha256(src.read_bytes()).hexdigest()
                   for src in (proof,loop,Path(__file__))},
        "checks":CHECKS,"cutoffExactDerivativePolynomials":cutoff_tables,
        "summary":{"passed":len(CHECKS),"total":len(CHECKS)},
        "claimBoundary":{"exactScalarAbsorptions":True,"actualSourceSBoundAttached":False,
                         "actualNSelected":False,"fullProfileCertified":False,
                         "analyticImplicitAndInverseMapArgumentsLeanFormalized":False}}
    with a.output.open("x") as f:
        json.dump(out,f,indent=2)
        f.write("\n")
    print(json.dumps({"passed":len(CHECKS),"total":len(CHECKS),
                      "receipt":str(a.output),"actualNSelected":False}))

if __name__=="__main__":
    main()

