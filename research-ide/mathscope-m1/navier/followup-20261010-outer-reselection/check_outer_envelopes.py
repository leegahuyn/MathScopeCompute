#!/usr/bin/env python3
"""Check explicit outer-reselection scalar bounds and exact expression bindings.

The continuous calculus arguments are in OUTER_DERIVATION.md. This program
does not turn those arguments into a Lean theorem or run the new B.2 axis.
Large positive numbers remain exact expression trees; no exp(T) is evaluated.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from fractions import Fraction as F
from math import factorial
from pathlib import Path

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent
T_LOWER = 128
LAMBDA_UPPER = F(1, 2**200)
H_UPPER = F(1, 100)
EPS_UPPER = F(1, 2**60)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def encode(x):
    x = F(x)
    return {"numerator": str(x.numerator), "denominator": str(x.denominator),
            "approximate": float(x)}


def exp_box(x, n=160):
    """Rational positive Taylor sum and the entire geometric remainder."""
    x = F(x)
    if x < 0:
        lo, hi = exp_box(-x, n)
        return 1/hi, 1/lo
    if x >= n+2:
        raise ValueError("Taylor remainder ratio is not separated from one")
    term = total = F(1)
    for k in range(1, n+1):
        term *= x/k
        total += term
    next_term = term*x/(n+1)
    return total, total+next_term/(1-x/(n+2))


def parameter_expressions():
    ref = lambda name: {"ref": name}
    integer = lambda n: {"integer": n}
    times = lambda n, name: {"product": [integer(n), ref(name)]}
    return {
        "Md": integer(2**20),
        "T": {"sum": [{"exp": ref("Md")}, integer(10)]},
        "logP": times(2, "T"),
        "Pstar": {"exp": ref("logP")},
        "lambda": {"exp": times(-1000, "T")},
        "h": {"exp": times(-8002, "T")},
        "co": {"rational": "1/256"},
        "Tf": integer(128),
    }


def monomial_absorption(coefficient, t_power, exp_t, lambda_power, target_exp_t):
    """Sufficient exact bound c*T^k*exp(q*T)*lambda^p<=exp(target*T).

    For T>=128, 0<c<=2^128 implies c<=exp(T), and T<=exp(T/2).
    Thus the displayed sufficient exponent is q+1+k/2-1000*p.
    All inputs and comparisons are rational. This intentionally sacrifices
    a factor exp(T) even for c=1 to keep the rule uniform and reviewable.
    """
    c, q, p, target = map(F, (coefficient, exp_t, lambda_power, target_exp_t))
    if c <= 0 or t_power < 0 or int(t_power) != t_power:
        raise ValueError("Expected a positive monomial and nonnegative integer power")
    exponent = q+1+F(t_power, 2)-1000*p
    return {"coefficient": encode(c), "tPower": t_power,
            "expTCoefficient": encode(q), "lambdaPower": encode(p),
            "sufficientExponent": encode(exponent), "targetExponent": encode(target),
            "coefficientFitsElementaryEnvelope": c <= 2**T_LOWER,
            "passed": c <= 2**T_LOWER and exponent <= target}


def build():
    axial_path = HERE/"independent-axial/independent-axial-certificate.json"
    axial = json.loads(axial_path.read_text())
    step_path = NAVIER/"followup-next/uniform-gluing/smooth-derivative-certificate.json"
    step = json.loads(step_path.read_text())
    original_outer = NAVIER/"followup-construction/outer.mjs"
    parameters = parameter_expressions()
    ell, h, eps = LAMBDA_UPPER, H_UPPER, EPS_UPPER
    rho = h/F(256)
    checks = {}

    def check(name, predicate):
        if name in checks:
            raise ValueError("Duplicate check name")
        checks[name] = bool(predicate)

    check("same_parameter_expression_tree_as_independent_axial", parameters == axial["parametersExactExpressions"])
    check("independent_axial_all_checks_pass", axial["passed"] == axial["total"] and all(axial["checks"].values()))
    check("independent_axial_actual_relaxed_cone_claim", axial["claims"]["actualRelaxedConeOnAxialStage"])
    check("actual_T_exceeds_used_lower_bound", 2**20+11 > T_LOWER)
    check("source_paper_binding_unchanged", axial["sourceBinding"]["paperSHA256"] == "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f")
    check("original_outer_source_binding", digest(original_outer) == axial["sourceBinding"]["outerSourceSHA256"])
    for name, limit in [("sigma1",9),("sigma2",128),("sigma3",8192)]:
        b = step["bounds"][name]
        check(name+"_certified_upper", F(int(b["numerator"]),int(b["denominator"])) < limit)

    e_lo,e_hi=exp_box(1)
    check("two_below_e_below_three", 2 < e_lo < e_hi < 3)
    check("lambda_below_two_to_minus_200", 1000*T_LOWER > 200)
    check("h_below_lambda_to_eight", 8002 > 8*1000)
    check("h_expT_below_one_over_192", 1+8001*T_LOWER > 192)
    check("h_below_lambda_squared", 8002 > 2*1000)
    check("epsilon_below_two_to_minus_60", 186*T_LOWER > 60)
    check("lambda_below_epsilon", -1000 < -186)
    check("fo_log_slope_below_h_over_four", F(9,512)/(1-rho) < F(1,4))
    check("interpolation_l_loss_below_one_tenth", F(9,128) < F(1,10))
    check("interpolation_one_plus_l_above_nine_tenths", 1-F(1,100)-F(9,128) > F(9,10))
    check("positive_terminal_wait_lower_bound", F(4)*F(99,100)*8002*T_LOWER/3 > 1)
    check("terminal_Qp_upper_below_h_over_eight", exp_box(3)[1]/(1-rho)**2 < 32)
    check("terminal_Qp_positive_factor", F(1,256) > 0)
    check("release_energy_bound_below_two", F(3,2)+h**8+F(2,3)*h**7 < 2)
    check("exterior_N_over_E_squared_below_three", 2*(F(2,3)+F(51,100)) < 3)

    # Unit mass bump weights on widths 3/10. Bounds enclose whole supports.
    check("pulse_bump_weight_lower", exp_box(F(-3,40))[0] > F(9,10))
    check("pulse_bump_weight_upper", exp_box(F(3,40))[1] < F(11,10))
    check("pulse_exponential_separation", exp_box(F(24,25))[0] > 2)
    check("pulse_determinant_lower_three_lambda", F(9,10)**2*2*2 > 3)
    check("pulse_inverse_norm_below_four_over_lambda", 2*F(11,10)*3/3 < 4)
    check("angular_bump_weight_lower", exp_box(F(-153,1000))[0] > F(4,5))
    check("angular_bump_weight_upper", exp_box(F(153,1000))[1] < F(6,5))
    check("angular_positive_weight_center_above_seven", exp_box(F(99,50))[0] > 7)
    check("angular_negative_weight_center_below_quarter", exp_box(-2)[1] < F(1,4))
    check("angular_positive_weight_center_below_eight", exp_box(2)[1] < 8)
    det = 2*F(4,5)**2*(7-F(1,4))
    check("angular_determinant_lower", det == F(216,25))
    inverse_upper=(2*F(6,5)*F(1,4)+F(6,5)*8)/det
    check("angular_inverse_below_four", inverse_upper < 4)
    qnorm=30*F(6,5)*(1+F(1,4))
    check("angular_quadratic_norm_below_64", qnorm < 64)
    radius=1024*ell**29
    check("angular_contraction_below_quarter", 512*radius < F(1,4))
    check("angular_strict_ball_inclusion", radius/2+256*radius**2 < radius)
    check("angular_inverse_eta_bound_below_six", 4/(1-512*radius) < 6)
    beta1,beta2,beta3=F(30),F(12800,9),F(8192000,27)
    relative_edit=2*radius*beta1
    slope_edit=2*radius*beta2/(1-relative_edit)
    eta_edit=2*768*ell**29*beta1/(1-relative_edit)
    check("angular_E_stays_positive", relative_edit < F(1,1000))
    check("angular_slope_and_source_edit_below_lambda_over_eight", slope_edit+eta_edit < ell/8)
    check("angular_eta_log_derivative_below_one", eta_edit < 1)

    # Elementary exp(B)>=B^2/2 controls the tiny affine pulse coefficients.
    check("pulse_log_prefactor_absorbed_by_exp_minus_half_over_lambda", F(2,5)*500000*T_LOWER**2 >= 2020*T_LOWER)
    check("pulse_affine_coefficients_below_lambda_200", F(1,2)*500000*T_LOWER**2 >= 200000*T_LOWER)
    check("pulse_bump_C2_xi_below_lambda_180", 10*beta3*ell**18 < 1)
    check("pulse_supports_disjoint_from_main", 2/ell-F(63,20) > 0)
    check("two_pulse_supports_disjoint", F(3,10) < 2)
    check("R0_second_derivative_bound", 50*9+2*9+11*128 < 2048)
    check("R_second_derivative_bound", F(6,5)*2048+1 < 4096)
    check("R_first_derivative_absolute_bound", F(6,5)*100+1 < 128)
    check("R_value_absolute_bound", F(6,5)*11+F(1,1000) < 14)
    check("m_convolution_remainder_constant", F(4096)/F(49,100)**3 < 65536)
    check("pulse_m_absolute_bound", 1+F(14)/F(49,100) < 30)
    check("pulse_Sq_bracket_below_sixteen", ell*(2*30+1)+2*ell**8*14+14 < 16)
    check("pulse_geometric_N_remainder_below_2000E", (2*30+1)*14 < 2000)

    # Exact integral of exp(-2*xi)*(xi-.02)^2 on [.02,9].
    upper_u=F(449,50)
    kb_lower=exp_box(F(-1,25))[0]*(F(1,4)-exp_box(-2*upper_u)[1]*(upper_u**2/2+upper_u/2+F(1,4)))
    check("actual_Kb_polynomial_minorant_above_one_fifth", kb_lower > F(1,5))
    check("amplitude_lower_endpoint_negative", F(81,100)*F(1,4)-(1-exp_box(-26)[1])/4 < F(-47,1000))
    check("amplitude_upper_endpoint_positive", F(36,25)*F(1,5)-F(1,4) > F(37,1000))
    check("amplitude_derivative_separated", F(9,25)-F(1,1000) > F(7,20))
    check("amplitude_eta_inverse_below_three", F(20,7) < 3)
    # The root error polynomial has positive coefficients; use monomial rules.
    root_linear=32*(1+60*1000)+256*30*1000
    root_constant=32+256*(128+3)
    check("root_error_linear_coefficient_record", root_linear == 9600032)
    check("root_error_constant_record", root_constant == 33568)

    # Cd bound holds on an interval, not only at lambda's chosen upper endpoint.
    # With h/lambda<=lambda and D<=1/2,
    # Cd <= 2/[(1-2lambda)^2(1-lambda)] <= 2+32lambda.
    # The denominator is >=1-5lambda; cross multiplication leaves
    # 22lambda-160lambda^2>=0 on [0,1/100].
    check("Cd_rational_uniform_remainder", F(22)-160*F(1,100) > 0)
    check("Cd_selected_bound", 2+32*ell < F(201,100))
    cross=F(201,100)*F(6,5)
    qfirst=cross**2/8
    qsecond=(2*cross)**2/14
    check("pulse_quadratic_first_margin", qfirst+315*eps < F(3,4))
    check("pulse_quadratic_second_margin", qsecond+181000*eps < F(7,4))
    check("pulse_main_w_absolute_bound", 2*14+F(201,100)*128 < 300)
    check("pulse_total_b_absolute_bound", 14+eps < 15)
    check("pulse_total_w_absolute_bound", 300+eps < 301)
    check("pulse_first_cross_error_315", 300+14+eps < 315)
    check("pulse_second_error_181000", 2*315+14+eps/2+180002 < 181000)
    check("pulse_small_positive_slope_term", 2*(300+eps)**2 < 180002)
    check("pulse_end_E_below_lambda_100", F(13,2)*500000*T_LOWER**2 >= (2+70*1000)*T_LOWER)
    check("postpulse_w_below_one_hundredth", 128*ell**98 < F(1,100))
    check("exterior_prehold_w_below_one_hundredth", 6*ell**99 < F(1,100))
    check("exterior_posthold_w_below_one_hundredth", 768*ell**100*h**5 < F(1,100))
    check("postpulse_ratio_second_margin", 2-F(1,100)**2 > F(7,4))
    check("exterior_ratio_second_margin", 2-2*F(1,100)**2 > F(7,4))

    absorptions={
        "Tw_energy_factor_small":monomial_absorption(120002,1,0,1,-1),
        "root_error_linear":monomial_absorption(root_linear,1,0,1,18-1000),
        "root_error_constant":monomial_absorption(root_constant,0,0,1,18-1000),
        "root_error_pulse_quadratic":monomial_absorption(10**6,0,0,401,18-1000),
        "root_eta_derivative_small":monomial_absorption(3,0,20,1,-1),
        "pulse_m_eta_derivative_small":monomial_absorption(1,0,24,1,-1),
        "pulse_Q_forcing_error":monomial_absorption(48,0,2,30,3-30000),
        "pulse_Q_incoming_error":monomial_absorption(16,0,0,59,3-30000),
        "intermediate_ratio_second_term":monomial_absorption(2,0,32,1,-1),
        "pulse_shear_error":monomial_absorption(512,0,0,1,-190),
        "pulse_eta_singular_ratio_error":monomial_absorption(4,0,32,F(1,2),-190),
        "pulse_moment_error":monomial_absorption(4,0,31,28,-190),
        "pulse_initial_mean_error":monomial_absorption(4,0,18,28,-190),
    }
    for name, record in absorptions.items():
        check("analytic_monomial_absorption_"+name,record["passed"])
    check("four_error_envelopes_below_epsilon", 4 <= 2**(4*T_LOWER))
    check("three_root_error_envelopes_fit_exp20T_lambda", 3 <= 2**(2*T_LOWER))
    check("exp_minus_T_below_one_quarter", T_LOWER >= 2)

    cmin,cmax,V,gmin=F(1,3),F(2259),F(116),F(1,4)
    threshold1=(V+2)/cmin
    threshold2=8*cmax*V/gmin
    check("pulse_c_lower", F(5,4)/3 > cmin)
    check("pulse_c_upper", 1+F(15*301,2) < cmax)
    check("pulse_v_upper", 3+F(225,2) < V)
    check("actual_cone_threshold_below_two_to_24", max(threshold1,threshold2) < 2**24)
    check("reference_radial_threshold", F(2**40,3**8) > 2**24)
    check("other_pre_pulse_radial_threshold", F(2**40,64) > 2**24)
    check("pulse_radial_q_factor", (59*1000+1)*T_LOWER+2 > 8)
    check("posthold_radial_q_factor", 3*8002*T_LOWER > 256)
    check("axis_choice_XR_automatically_above_two_to_40", 20*T_LOWER > 40)
    check("holomorphic_pressure_mass_upper", 4*F(256,255)**2 < 5)
    check("holomorphic_denominator_lower_positive", F(1)-F(1,16)**2 == F(255,256))

    bounds={
        "KbLowerFromIntegratedMinorant":kb_lower,
        "angularInverseInfinityUpper":inverse_upper,
        "angularQuadraticRowUpper":qnorm,
        "pulseFirstQuadraticMaximum":qfirst,
        "pulseSecondQuadraticMaximum":qsecond,
        "cMinimum":cmin,"cMaximum":cmax,"vMaximum":V,"GMinimum":gmin,
        "pS1Threshold1":threshold1,"pS1Threshold2":threshold2,
        "selectedPS1Threshold":2**24,"selectedXRLowerBound":2**40,
        "lambdaUpperForScalarComparisons":ell,"epsilonUpperForScalarComparisons":eps,
    }
    return {
        "schema":"MathScope.QuantitativeOuterReselectionEnvelopes/1",
        "status":"SUFFICIENT_SCALAR_INEQUALITIES_VERIFIED" if all(checks.values()) else "FAILED",
        "parametersExactExpressions":parameters,
        "parameterExpressionSHA256":hashlib.sha256(json.dumps(parameters,sort_keys=True,separators=(',',':')).encode()).hexdigest(),
        "sourceBindings":{
            "paperSHA256":axial["sourceBinding"]["paperSHA256"],
            "originalOuterSourceSHA256":digest(original_outer),
            "independentAxialCertificateSHA256":digest(axial_path),
            "stepDerivativeCertificateSHA256":digest(step_path),
            "derivationSHA256":digest(HERE/"OUTER_DERIVATION.md"),
            "checkerSHA256":digest(Path(__file__)),
        },
        "domain":{"eta":"[-1,1]","innerStartXOverXR":"exp(-8)",
                  "outerEnd":"terminal local y=1/2, exactly the A.4 finite interval",
                  "XR":"every real XR>=2^40"},
        "exactRationalBounds":{k:encode(v) for k,v in bounds.items()},
        "monomialAbsorptions":absorptions,
        "checks":checks,"passed":sum(checks.values()),"total":len(checks),
        "analyticBridge":{
            "file":"OUTER_DERIVATION.md",
            "continuousIdentitiesRequired":["4.9 and 4.16 moment identities","positive convolution and ODE comparison",
               "unit-mass bump moment matrices","uniform contraction for the actual angular two-moment polynomial",
               "actual total-S amplitude polynomial and uniform simple-root argument",
               "twice-integrated pulse convolution remainder","exact pressure-neutrality and S(infinity)=0 identities",
               "positive A.13 terminal integral and source-specific finite waiting time",
               "differentiation and analytic integration on one complex neighborhood"],
            "claimedAsNewLeanProof":False,
            "scalarChecksAloneProveContinuousIdentities":False,
        },
        "interpretation":{
            "currentFixedLogPFamilyRejectionPreserved":True,
            "newOuterFunctionSpecifiedByExactIntegralEquations":True,
            "allStageSufficientInequalitiesHaveExplicitBounds":True,
            "independentAuditOfWholeAnalyticBridgeComplete":False,
            "newB2AxisOrB8JoiningRegenerated":False,
            "oldAxisPressureReused":False,
            "globalC12FrequencyAndIncomingMomentsCertified":False,
            "A7HeatEndpointCollarIncluded":False,
            "fullOriginalProfileCompleted":False,
            "originalN3GatePromoted":False,
        },
    }


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=Path,default=HERE/"outer-envelope-certificate.json")
    args=parser.parse_args()
    result=build()
    args.output.write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps({"status":result["status"],"passed":result["passed"],"total":result["total"],
                      "failed":[k for k,v in result["checks"].items() if not v],
                      "parametersRemainExactExpressions":True,
                      "fullOriginalProfileCompleted":False},indent=2))
    if not all(result["checks"].values()):
        raise SystemExit(1)


if __name__=="__main__":
    main()
