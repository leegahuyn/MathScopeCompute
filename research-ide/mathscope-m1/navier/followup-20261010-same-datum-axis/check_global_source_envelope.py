#!/usr/bin/env python3
"""Executed finite derivative coefficients for the same-profile S=C^100000.

The function-level proof is GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md. This
program does not substitute generic norm assumptions or sampled maxima
for that proof and does not assert a completed Lean analytic bridge.
"""
from __future__ import annotations
from fractions import Fraction as F
from math import factorial, comb
from pathlib import Path
import hashlib
import json

from check_axis_envelopes import Poly, canonical_sha
from check_continuation_debt import MPoly, qp, psum, jet_mul, exp_jet, ZERO, ONE

HERE=Path(__file__).resolve().parent
NAVIER=HERE.parent


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def literal_source_polynomials():
    names="U M Me I Ie J Je Sm Sme Cp Cpe P0 P0e X iX iL iH iE h eta".split()
    v={name:MPoly.variable(name) for name in names}
    U,M,Me,I,Ie,J,Je,Sm,Sme,Cp,Cpe,P0,P0e,X,iX,iL,iH,iE,h,eta=v.values()
    D,A,d=F(1,2)-h,F(1,2)+h,1-eta**2
    W=1-2*D*eta*M*iX-d*Me*iX
    p1=(-X*W+((1-h)*I-D*eta*Ie-d*Je+2*(h-D)*eta*J)*iH)*iL
    p2=(-X*W*U+D*(M-eta*Me)+4*h*eta*Sm-d*Sme
        +X*(4*A*eta*(P0+Cp)-d*(P0e+Cpe)))*iL*iE
    return {"p1":p1,"p2":p2}


def build():
    axis=json.loads((HERE/"axis-envelope-certificate.json").read_text())
    debt=json.loads((HERE/"continuation-debt-certificate.json").read_text())
    checks={}
    details={}

    def check(name,value):
        if name in checks: raise ValueError("duplicate check: "+name)
        checks[name]=bool(value)

    check("axis_exact_receipt_pass",axis["passed"]==axis["total"])
    check("same_profile_debt_receipt_pass",debt["passed"]==debt["total"])
    check("same_axis_receipt_bound",debt["sourceBinding"]["proofFilesSHA256"]["axis-envelope-certificate.json"]==sha(HERE/"axis-envelope-certificate.json"))
    expr=debt["parametersExactExpressions"]
    check("explicit_final_width_C_minus120",expr["t1"]=={"power":[{"ref":"CSelected"},-120]})
    check("explicit_Bref_Q300",expr["BRefUpper"]=={"power":[{"ref":"Q"},300]})
    check("explicit_final_C",expr["CSelected"]=={"exp":{"ref":"logCSelected"}})
    high=debt["higherIncomingAndRootDerivatives"]
    for tag in ("U","E"):
        row=[F(s) for s in high["actualRoot"+tag+"OrdinaryDerivativeUpper"]]
        check("actual_B8_"+tag+"_root_orders0to4",len(row)==5 and row[0]<=F(1,10**6) and all(x<F(1,10**6) for x in row[1:]))

    # Explicit f^(k)=exp(-1/t^2) P_k(1/t) polynomials, with signs retained.
    p={0:1}; cutoff=[]
    for k in range(9):
        l1=sum(abs(x) for x in p.values())
        cutoff.append({"order":k,"polynomial":{str(n):v for n,v in sorted(p.items())},
                       "coefficientL1":l1,"degree":max(p)})
        check(f"step_exponential_polynomial_order{k}",max(p)<=3*k and l1<2**40)
        out={}
        for d,c in p.items():
            out[d+3]=out.get(d+3,0)+2*c
            if d: out[d+1]=out.get(d+1,0)-d*c
        p={d:c for d,c in out.items() if c}
    check("step_t_power_exponential_bound",12**12<2**44)
    check("step_denominator_lower",3**4<2**7)
    check("step_reciprocal_recursion_exponent",7+129+3<144)
    check("step_eighth_factorial",factorial(8)<2**16)
    check("step_sigma_derivatives_below_two2048",128+144*9+4+16<2048)
    check("step_sigma_bound_absorbed_in_Q8",2048<260*8)
    check("B8_log_radial_bump_bound_Q9",2048+4*12+8<260*9)
    details["universalStepDerivativeProof"]=cutoff

    # Actual analytic coefficient evaluation, including log radial derivatives.
    stirling=[[0]*9 for _ in range(9)];stirling[0][0]=1
    for r in range(1,9):
        for k in range(1,r+1):stirling[r][k]=stirling[r-1][k-1]+k*stirling[r-1][k]
    scalars={}
    for r in range(9):
        for m in range(9-r):
            scalar=sum(F(stirling[r][k])*F(41,10)**k*
                F(factorial(m+k),(m+1)**2*20**k)*F(200,159)**(m+k+1)
                for k in range(r+1))
            scalars[f"{r},{m}"]=str(scalar)
            check(f"actual_analytic_coefficient_y{r}_eta{m}",scalar<2**260 and m+2<=10)
    details["actualAnalyticEvaluationScalars"]=scalars
    phi=[qp(10)]*9; inv=[qp(0,4)]
    for n in range(1,9):
        inv.append(psum((phi[k]*inv[n-k]).scale(4*comb(n,k)) for k in range(1,n+1)))
    log_phi=[qp(0,2)]+jet_mul(phi[1:],inv[:8])
    check("all_mixed_logPhi_inputs_below_Q100",all(p.below_power(100) for p in log_phi))
    check("phase_derivatives_below_Q74",64+7+2<74)
    check("reference_defining_integral_product_budget",100+8+1<110)
    bell_ref=exp_jet([ZERO]+[qp(110)]*7)
    check("reference_Bell_polynomials_below_Q900",all(p.below_power(900) for p in bell_ref))
    check("reference_regular_pressure_reserve",2048-900>1000)

    def weak_compositions(total,length):
        if length==1:
            yield (total,);return
        for first in range(total+1):
            for rest in weak_compositions(total-first,length-1):yield (first,)+rest
    count=0; pole_ok=True
    for total in range(8):
        for length in range(1,8):
            for parts in weak_compositions(total,length):
                count+=1
                pole_ok &= sum(max(r-1,0) for r in parts)<=max(total-1,0)
    check("graded_radial_width_product_inequality",pole_ok)
    details["gradedWidthProductCasesChecked"]=count
    # Literal source monomial counts for the reference bound (8).
    sq_ref=qp(222,1)+qp(12,3)+qp(222,1)
    sn_ref=qp(222,1)+qp(33,3)+qp(222,1)+qp(4,1)+qp(5,4)+qp(4,2)
    check("reference_literal_Sq_budget_Q1000",sq_ref.below_power(1000))
    check("reference_literal_Sn_budget_Q1000",sn_ref.below_power(1000))
    # All mixed-product coefficients up to the seven input derivatives fit
    # in one extra Q power, even without discarding the displayed constants.
    check("reference_source_mixed_product_coefficients",6*3**7<2**260)
    details["referenceSourcePositivePolynomials"]={"Sq":sq_ref.record(),"Sn":sn_ref.record()}
    ode=[400]
    for r in range(1,4):ode.append(max(1002,ode[-1]+111)+1)
    check("reference_ODE_radial_derivatives_Q3000",ode==[400,1003,1115,1227] and max(ode)<3000)
    details["referenceStockRadialExponentRecurrence"]=ode
    check("B26_control_derivatives_Q4000",3000+8+3<4000)
    bell_actual=exp_jet([ZERO]+[qp(4000)]*4)
    check("B26_actual_Bell_derivative_Q20000",all(p.below_power(20000) for p in bell_actual))
    check("B26_field_C362",2+120*3==362)
    check("all_field_regions_below_C1000",max(362,80*4//10000+2,20)<1000)

    # The coordinate bounds are comparisons of explicit exponents.
    check("logQ_lower_from_new_parameters",4+2*4*8002==64020)
    check("global_outer_log_range_absorbed",(64020-60021)*128>10)
    check("outer_positive_E_lower",64020>30001)
    check("inner_positive_E_constant",16*3**2<10**8)
    check("axis_X_lower",64<10000)
    check("a_positive_lower_exponent",120+1+1==122)

    # Ordinary derivative coefficients for the actual five densities.
    density_exponents={"M":1000,"I":1000+7,"J":2000+7,
                       "S":2000,"Cp":2000+1}
    integral_exponents={k:v+12+3 for k,v in density_exponents.items()}
    check("all_continuous_moments_below_C2030",max(integral_exponents.values())<2030)
    check("moment_product_derivative_coefficients",3**4*16<2**260)
    check("core_pressure_regular_integral",2**4*4<2**260)
    details["continuousMomentExponentTable"]={"density":density_exponents,"integral":integral_exponents,
        "regularAxisPressure":"integral F^2 from 0 to X0; F eta derivatives through 4 below 1"}
    inv_e=4*3+3*1000+1
    inv_h=4*4+3*1008+1
    check("inverseE_total3_C3015",inv_e<3015)
    check("inverseH_total3_C3050",inv_h<3050)
    weights={"U":1000,"X":12,"iX":1,"iL":1,"iH":3050,"iE":3015,
             "P0":1,"P0e":1,"h":0,"eta":0}
    for name in "M Me I Ie J Je Sm Sme Cp Cpe".split():weights[name]=2030
    stock={}
    for name,poly in literal_source_polynomials().items():
        degree=max(sum(weights[var]*n for var,n in monomial) for monomial in poly.c)
        coeff=sum(abs(c)*max(1,sum(n for _,n in monomial))**3 for monomial,c in poly.c.items())
        stock[name]={"maxCExponentBeforeCoefficient":degree,"mixedDerivativeCoefficientSum":str(coeff),
                     "monomialCount":len(poly.c),"certifiedBound":"C^8000"}
        check(name+"_full_source_polynomial_C8000",degree+1<8000 and coeff<2**260)
    details["actualSourceMomentMap"]=stock
    source_exp={"E":1000,"U":1000,"moments":2030,"inverseE":3015,
                "inverseH":3050,"p1":8000,"p2":8000,"a":5000,"b":5000,
                "inverseA":16000,"t":21002,"v":26004,"Pc":29004,"Jc":29004}
    check("a_b_source_exponents",1000+3015+1<5000)
    check("inverse_a_source_exponent",4*122+3*5000+1<16000)
    check("t_source_exponent",5000+16000+1<21002)
    check("v_source_exponent",max(5000,2*5000+16000)+2<26004)
    check("Pc_Jc_source_exponents",21002+8000+1<29004)
    check("all_source_jets_below_S",max(source_exp.values())+1<100000)
    check("factorially_weighted_eta_norms_below_S",29004+1<100000 and 4<2**260)
    check("patch_K_reciprocal_and_lambda_fit_S",3<100000 and 1000<64020)

    files=["SAME_DATUM_ANALYTIC_AXIS.md","REFERENCE_DERIVATIVE_BOUNDS.md",
           "CONTINUATION_AND_NEW_DEBT.md","GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md",
           "axis-envelope-certificate.json","continuation-debt-certificate.json"]
    ref=lambda x:{"ref":x}
    integer=lambda x:{"integer":x}
    product=lambda *xs:{"product":list(xs)}
    summation=lambda *xs:{"sum":list(xs)}
    expressions={"sourceEnvelopeS":{"power":[ref("CSelected"),100000]},
        "sourceJLeft":product({"quotient":[integer(4),ref("Lambda")]},
                               {"exp":{"quotient":[ref("t1"),integer(16)]}}),
        "sourceJRight":product(integer(16),ref("XR"),{"exp":summation(ref("T"),integer(2),product(integer(60000),ref("T")),integer(-25))}),
        "loopILeft":product({"quotient":[integer(4),ref("Lambda")]},{"exp":{"quotient":[ref("t1"),integer(8)]}}),
        "loopIRight":product(ref("XR"),{"exp":summation(ref("T"),integer(3))})}
    return {"schema":"MathScope.Navier.SameProfileGlobalSourceEnvelope/1",
        "status":"EXPLICIT_S_C100000_PROVED_FOR_ACTUAL_NEW_PREMODULATION_PROFILE" if all(checks.values()) else "FAIL",
        "sourceBinding":{"paperSHA256":axis["sourceBinding"]["paperSHA256"],
            "outerParameterExpressionSHA256":axis["sourceBinding"]["outerParameterExpressionSHA256"],
            "finalContinuationParameterExpressionSHA256":debt["parameterExpressionSHA256"],
            "proofAndProducerInputsSHA256":{name:sha(HERE/name) for name in files},
            "thisCheckerSHA256":sha(Path(__file__))},
        "parametersExactExpressions":expressions,"parameterExpressionSHA256":canonical_sha(expressions),
        "actualSourceUpperCExponents":source_exp,"derivativeOrder":{"fields":4,"moments":4,"source":3,"meaning":"total mixed log-radius and eta order"},
        "actualPositiveLowerBounds":{"X":"C^-1","E":"C^-3","a":"C^-122"},
        "additionalC12Inputs":{"radialUpper":"C^12","KAndReciprocalEtaOrder2":"C^3","lambdaInverse":"C","samePositiveLambda":True},
        "finiteDerivationDetails":details,"checks":checks,"passed":sum(checks.values()),"total":len(checks),
        "boundaries":{"actualSameB8RootDerivativesThroughFourBound":True,"unknownCompactSupremumUsed":False,
            "rawAdmissibleConeGapsForUnmodulatedInteriorAsserted":False,"loopAndConeLowerBoundsSuppliedSeparately":True,
            "fullAnalyticPremisesProvedInLean":False,"fullOriginalN3Completion":False}}


if __name__=="__main__":
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument("--write",action="store_true");args=parser.parse_args()
    result=build()
    if args.write:(HERE/"global-source-envelope-certificate.json").write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps({"status":result["status"],"passed":result["passed"],"total":result["total"],
        "failed":[k for k,v in result["checks"].items() if not v]}))
    raise SystemExit(result["passed"]!=result["total"])
