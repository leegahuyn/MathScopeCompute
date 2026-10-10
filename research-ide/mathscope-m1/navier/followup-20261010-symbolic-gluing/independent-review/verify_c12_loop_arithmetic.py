#!/usr/bin/env python3
"""Independent exact constant audit for the written C12/loop implications.

Uses its own termwise recovery estimates and QQ series algebra. Does not
import the producer and does not assert that a source S or R is available.
"""
from datetime import datetime, timezone
from fractions import Fraction as F
from math import factorial
from pathlib import Path
import argparse
import hashlib
import json

HERE=Path(__file__).resolve().parent
BASE=HERE.parent

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def rat(v):return F(int(v["numerator"]),int(v["denominator"]))
def convolution(a,b,n):
    return [sum(a[j]*b[k-j] for j in range(k+1)) for k in range(n+1)]
def inverse(a,n):
    b=[1/a[0]]
    for k in range(1,n+1):b.append(-sum(a[j]*b[k-j] for j in range(1,k+1))/a[0])
    return b

def main():
    p=argparse.ArgumentParser();p.add_argument("--output",required=True,type=Path);a=p.parse_args()
    checks={};ratios={}
    def check(name,x):checks[name]=bool(x)
    def dominates(name,base,terms,target):
        # Each exponent minus target is nonpositive: endpoint evaluation
        # bounds the ratio on the entire half-line, not only at the endpoint.
        assert all(c>=0 and d<=target for c,d in terms)
        ratio=sum(F(c)*F(base)**(d-target) for c,d in terms)
        ratios[name]=str(ratio);check(name,ratio<1)
    r=8192;s=2**20
    c2path=BASE/"attempts/0001/certificate.json";c2=json.loads(c2path.read_text())
    check("fresh_C2_source_tree",c2["source"]["parameterTreeSHA256"]==
          "38e23d037f8b75eaeb30448a815689e92171926d47787196c7c5395fe98425a8")
    for tag in ("U","E"):
        inv=c2["inverse"+tag]
        matrix=[[rat(v) for v in row] for row in inv["preconditioner"]]
        check(tag+"_preconditioner_below_7500",max(sum(map(abs,row)) for row in matrix)<7500)
        check(tag+"_residual_below_1_over_16",rat(inv["residualNorm"])<F(1,16))
    bu,be=rat(c2["bounds"]["BU"]),rat(c2["bounds"]["BE"])
    check("actual_fixed_quadratic_bounds",bu<32768 and be<16384)
    check("actual_bump_value_bound",2*rat(c2["bounds"]["bumpSupremum"])<18)
    check("actual_bump_x_derivative_bound",4*rat(c2["bounds"]["bumpDerivativeSupremum"])<404)
    # Independent bounds for density differences, with epsilon=4 R^2/N.
    for name,terms in {
      "M":[(4,3)],"I":[(4,4)],"J":[(8,5),(4,4)],
      "S":[(12,4),(6,3)],"Cp":[(4,5),(2,4)]}.items():
        dominates("density_"+name,r,[(F(c,20),d) for c,d in terms],5)
    dominates("angular_recovery_Qs",r,[(7,1),(22,3),(22,7)],8)
    dominates("angular_recovery_ps1",r,[(2,9)],10)
    dominates("absolute_Ns",r,[(F(8,20),3),(F(8,20),2),(F(8,20),1)],3)
    dominates("difference_Ns",r,[(16,2),(8,1),(4,0)],3)
    dominates("axial_recovery_ps2",r,[(4,5),(80,6)],8)
    dominates("entire_second_divided_difference_row",r,[(196,6),(14,4)],7)
    dominates("normalization_with_actual_preconditioner",r,[(7500*196,12),(7500*14,10)],14)
    dominates("two_derivatives_debt_beta",r,[(2*10**8,-36)],0)
    lam=F(1,2**200);beta=F(1,10**8)
    check("C2_algebra_U_radius_two_beta",F(16,15)<2)
    check("C2_algebra_E_selfmap",1+F(2,16)+4*lam*(bu+be)*beta<2)
    check("C2_algebra_E_contraction",F(1,16)+4*lam*be*beta<1)
    check("C2_algebra_ball_inside_original_root_box",2*beta<F(1,10**6))
    dominates("physical_coefficient",r,[(8,15)],16)
    dominates("repair_bump_value",r,[(18,16)],17)
    dominates("repair_log_radial_derivative",r,[(14*404,16)],18)
    dominates("repair_shear_denominator_retained",r,[(4,19),(4,18)],20)
    dominates("repair_partial_moments",r,[(2,20),(1,19)],21)
    dominates("combined_recovery_input",r,[(1,21),(1,17),(1,6)],22)
    dominates("cone_gradient_bound",r,[(256*2**10,10)],12)
    dominates("strict_half_gap",r,[(2,-3)],0)
    dominates("coordinate_segment_positive_a",r,[(2,-15)],0)
    dominates("directional_first_gap",r,[(16,-8)],0)
    dominates("directional_quadratic_gap",r,[(2048,-3)],0)
    # QQ even series independently checks the zero-variance removable limit.
    n=8
    M=[F(0)]*(n+1)
    for k in range(5):M[2*k]=F(1,4**k*factorial(k)**2)
    Minv=inverse(M,n)
    ratio=convolution([M[k]*2**k for k in range(n+1)],convolution(Minv,Minv,n),n)
    check("M_series_value_and_evenness",M[0]==1 and all(M[k]==0 for k in range(1,n+1,2)))
    check("variance_ratio_value_and_first_derivative",ratio[0]==1 and ratio[1]==0)
    check("removable_Q_zero_equals_half",ratio[2]==F(1,2))
    check("signed_W_derivative_zero_is_nondegenerate",ratio[2]>0)
    dominates("variance_bracket_for_all_S",s,[(1,0),(32,2),(2**31,9)],12)
    # For exponential budgets, log S<=S and log 2<1. The recorded positive
    # polynomial is therefore an upper bound on the logarithm of each product.
    for name,terms,target in [
      ("real_t",[(2,13),(12,1),(1,0)],14),
      ("real_j",[(1,14),(1,1),(1,0)],15),
      ("loop_delta",[(2,15),(2,1),(5,0)],16),
      ("raw_cone_margin",[(1,16),(3,0)],17),
      ("R_eight_derivatives",[(40,13),(128,0)],15),
      ("Q_positive_inverse",[(4,13),(1,0)],14),
      ("sqrt_Q_third",[(3,15),(3,14),(20,0)],17),
      ("W_partial_jet",[(1,17),(64,1),(20,0)],19),
      ("Wmu_inverse",[(6,13),(1,1),(5,0)],14),
      ("cutoff_composition",[(3,16),(3,1),(2064,0)],18),
      ("root_rhs",[(1,18),(3,16),(16,1),(32,0)],20),
      ("implicit_first",[(1,22),(1,14),(4,0)],23),
      ("implicit_second",[(1,22),(2,23),(1,14),(16,0)],26),
      ("implicit_third",[(1,22),(3,26),(1,14),(20,0)],30),
      ("actual_t",[(1,17),(3,31),(1,30),(40,0)],35),
      ("circle_density",[(2,35),(3,20),(1,1),(24,0)],38),
      ("inverse_circle_third",[(1,39),(3,43),(2,1),(32,0)],48),
      ("actual_composed_loop",[(6,35),(1,35),(1,20),(3,48),(96,0)],55),
      ("all_twenty_loop_indices",[(1,55),(5,0)],56),
      ("actual_primitives",[(1,56),(1,1),(6,0)],60),
      ("final_R",[(1,60),(1,17)],256),
    ]:dominates("exp_"+name,s,terms,target)
    # Independent literal derivative polynomials: P_(k+1)=-x^2 P'_k+2x^3P_k.
    poly={0:1};cutoff=[]
    for k in range(9):
        cutoff.append({"order":k,"polynomial":{str(m):v for m,v in sorted(poly.items())}})
        check(f"cutoff_literal_polynomial_{k}",max(poly)<=3*k and sum(abs(v) for v in poly.values())<2**40)
        nxt={}
        for m,c in poly.items():
            if m:nxt[m+1]=nxt.get(m+1,0)-m*c
            nxt[m+3]=nxt.get(m+3,0)+2*c
        poly={m:c for m,c in nxt.items() if c}
    check("cutoff_monomial_bound",12**12<2**44)
    check("cutoff_denominator_lower",3**4<2**7)
    check("reciprocal_Taylor_induction_all_eight_orders",max(F(k,2**8) for k in range(1,9))<1)
    check("source_step_all_eight_derivatives",9*2**128*2**1296*2**16<2**2048)
    proof_paths=[BASE/"C12_FREQUENCY_CONTRACT.md",BASE/"QUANTITATIVE_LOOP_SELECTION.md",BASE/"LOOP_DERIVATIVE_ENVELOPE.md"]
    source={p.name:sha(p) for p in proof_paths}
    source["newC2Certificate"]=sha(c2path);source["independentVerifier"]=sha(Path(__file__))
    report={"schema":"MathScope.IndependentC12LoopArithmetic/1",
      "verifiedUTC":datetime.now(timezone.utc).isoformat(),
      "status":"PASS" if all(checks.values()) else "FAIL","passed":sum(checks.values()),"total":len(checks),
      "checks":checks,"uniformEndpointRatios":ratios,"sourceSHA256":source,
      "MExactSeriesThrough8":list(map(str,M)),"varianceRatioExactSeriesThrough8":list(map(str,ratio)),
      "literalCutoffDerivativePolynomials":cutoff,
      "claimBoundary":{"producerImported":False,"actualSourceEnvelopeCertifiedByThisAudit":False,
        "actualFrequencyIssuedByThisAudit":False,"analyticImplicitProofIsLeanTerm":False},
      "scope":"Independent exact arithmetic checks and source-reviewed analytic identities for the conditional C12/loop bounds; no source norm is inferred from a claimed JSON field."}
    with a.output.with_suffix(".verifier.py").open("xb") as f:f.write(Path(__file__).read_bytes())
    for proof in proof_paths:
        snapshot=a.output.with_name(a.output.stem+"."+proof.name)
        with snapshot.open("xb") as f:f.write(proof.read_bytes())
    with a.output.open("x") as f:json.dump(report,f,indent=2);f.write("\n")
    print(json.dumps({k:report[k] for k in ("status","passed","total")}))
    for name,ok in checks.items():
        if not ok:print("FAILED",name)
    raise SystemExit(0 if report["status"]=="PASS" else 1)

if __name__=="__main__":main()
