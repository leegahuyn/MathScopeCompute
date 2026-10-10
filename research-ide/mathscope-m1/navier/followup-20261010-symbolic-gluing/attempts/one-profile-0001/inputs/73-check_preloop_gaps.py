#!/usr/bin/env python3
"""Exact arithmetic and source binding for B8_AND_PRELOOP_GAPS_EN.md."""

import hashlib
import json
from datetime import datetime, timezone
from fractions import Fraction as F
from pathlib import Path


ROOT = Path(__file__).resolve().parent
NAVIER = ROOT.parent
AXIS = NAVIER / "followup-20261010-same-datum-axis"
SYMBOLIC = NAVIER / "followup-20261010-symbolic-gluing"
QMIN = CMIN = 2**260


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def exact(value):
    return F(int(value["numerator"]), int(value["denominator"]))


def bump_geometry_ok(certificate):
    g = certificate["geometry"]
    supports = [(exact(a), exact(b)) for a, b in g["supports"]]
    expected = [(F(i, 4096), F(i+1, 4096)) for i in [12, 14, 16, 18, 20]]
    return (supports == expected and g["unitMass"] is False
            and g["bump"] == "sigma'((x-left)/width)"
            and all(exact(m) == F(1, 4096) for m in g["integralMass"]))


def main():
    b8_path = SYMBOLIC / "attempts/b8-0001/certificate.json"
    continuation_path = AXIS / "continuation-debt-certificate.json"
    b8 = json.loads(b8_path.read_text())
    continuation = json.loads(continuation_path.read_text())
    bounds = b8["bounds"]
    hmax = F(1, 2**200)
    mumax = hmax**2
    checks = {}

    def check(name, result):
        checks[name] = bool(result)

    check("e_upper_11_over4", F(65, 24)+F(1, 100) < F(11, 4))
    check("b8_support_after_exp_minus6", F(12, 4096)*F(8, 3)**6 > 1)
    check("b8_support_before_exp_minus5", F(21, 4096)*F(11, 4)**5 < 1)
    check("restoration_ends_before_b8", F(12, 4096)*F(8, 3)**7 > 1)
    check("x_inverse_dyadic", 3**8 < 2**13)
    check("x_three_halves_inverse_dyadic", 3**12 < 2**20)
    check("early_S_row_unmixing_factor", 3+8+8+8 == 27)
    check("restoration_S_first_derivative", 16+8+4 == 28)
    check("restoration_J_first_derivative", 2*(2+1) == 6)
    check("actual_b8_field_eta_bound", 18*F(1, 10**6) < F(1, 1000))
    check("partial_J_density_bound", F(20, 1000)+F(4, 10**6) < 1)
    check("partial_S_density_bound", F(18, 1000)+F(3, 10**6) < 1)
    check("partial_Cp_density_bound", 2**13*(F(2, 1000)+F(1, 10**6)) < 17)
    check("complete_partial_debt_bound", 27+28+17 < 100)
    check("ideal_E_lower_P_over5", 3**4 < F(5, 2)**5)
    check("actual_E_lower_P_over6", F(1, 5)-F(9, 10**6) > F(1, 6))
    check("actual_bump_log_derivative", 21*128 == 2688)
    check("actual_radial_shear_relative_bound", 12*(2688+F(9, 10))*F(1, 10**6) < F(1, 4))
    check("actual_axial_shear_relative_bound", 12*2688*F(1, 10**6) < F(1, 4))
    check("restoration_axial_shear_smallness", 720*mumax < 1)
    check("a_between_point7_point9", mumax/4 < F(1, 10))
    check("v_strictly_below_one", F(9, 10)+F(1, 16)/F(7, 10) < 1)

    check("ideal_Q_lower_survives_error", F(9, 8)-F(5, 8)*hmax-F(1, 16) > 1)
    check("ideal_Q_upper", F(9, 8)+2*hmax+F(5, 8)*F(9, 2) < 4)
    check("deltaW_coefficient", 100*2**14 < 2**21)
    check("delta_angular_numerator_coefficient", 150+200 < 2**9)
    check("angular_denominator_coefficient", 6*2**20 < 2**23)
    check("inverse_E_relative_change", 6*F(9, 10**6) < 1)
    check("complete_Q_difference_coefficient", 2**21+2**32+7 < 2**40)
    check("muP_actual_exponent", -2*8002+2 == -16002)
    check("Q_difference_smallness", 40-16002*128 < -4)
    check("partial_moment_over_x_smallness", 100*2**13 < 2**40)
    check("ideal_S_value_bound", 16+F(5, 12) < 17)
    check("ideal_S_eta_bound", 32+F(5, 6) < 33)
    check("actual_pressure_value_bound", 5+F(5, 2)+100*mumax < 9)
    check("actual_pressure_eta_bound", 160+5+100*mumax < 256)
    check("full_Ns_bound", 20+5+18+34+27+256 < 2**20)
    check("w_bound", 6*2**20 < 2**24)
    check("b_w_over_a_coefficient", F(10, 7)*F(1, 4)*2**24 < 2**26)
    check("projected_stock_positive", 26-16002*128 < -2)
    check("actual_B8_radius_lower", 40-13 == 27)
    check("B8_projected_gap", F(3, 4)*2**27-2 > 1)

    check("activation_one_sixteenth_flat_bound", 4*3**256 < 2**408)
    check("activation_D_dyadic_exponent", 408-1 == 407)
    check("activation_Hq_dyadic_exponent", 2*408-2 == 814)
    check("C_minus1000_below_activation_dyadics", 260*1000 > 814)
    check("activation_a_power_bound", -120-1-1 == -122)
    check("common_gap_power_lower", 122 < 1000 < 100000)
    check("post_activation_comparison", F(4, CMIN**71) < F(1, 10))
    check("post_activation_v_small", F(1, CMIN**115)+F(4, CMIN**71) < F(1, 10))
    check("post_activation_projected_gap", F(11, 5)-F(1, 10) == F(21, 10))
    check("reference_endpoint_positive_integral", F(6, 5)*(100-F(1, 100)) > 3)
    check("final_transition_projected_gap", 3-F(1, 10) == F(29, 10))
    check("barrier_at_five_halves", 100-F(13, 20)*F(5, 2) > 0)
    eps = F(1, 50000)
    check("constant_postshift_source_above_one",
          F(11, 20)*(3-F(8, 1000)-F(1, 1000)-2*eps)
          -F(11, 1000)-F(1, 1000)**2/(2*F(49, 100))-2*eps > 1)
    check("outer_stock_above_C9", 110*CMIN > 3**8)
    check("outer_stock_above_two33", CMIN**9 > 2**33)
    check("outer_projected_c_minus2", F(1, 3)-F(2, 2**33) > F(1, 4))
    check("outer_projected_D", F(1, 3)-F(116, 2**33) > F(1, 6))
    check("outer_quadratic_gap", 4*F(2259*116, 2**33) < F(1, 8))
    check("left_loop_collar_vs_gap", F(21, 10)-2 == F(1, 10))
    check("loop_collars_exceed_S_inverse", CMIN > 10 and 100000 > 1)
    check("geometry_left_order", 0 < F(1, 16) < F(1, 8) < F(1, 4))
    check("geometry_right_constant_interval", 60*1000*128-25 > 2)
    check("geometry_J_ends_before_I2", 16 < 2**5)
    check("geometry_J_offloop_stays_constant", 16 < 2**25)

    parameter = continuation["parametersExactExpressions"]
    proof_hashes = continuation["sourceBinding"]["proofFilesSHA256"]
    bindings = {
        "actual_b8_certificate_passed": b8["allPassed"] and all(b8["checks"].values()),
        "actual_b8_geometry_and_mass": bump_geometry_ok(b8),
        "actual_b8_value_and_eta_roots": all(exact(bounds[k]) <= F(1, 10**6)
            for k in ["uRadius", "eRadius", "uEtaDerivative1", "eEtaDerivative1"]),
        "actual_step_derivative_bounds": exact(bounds["bumpSupremum"]) < 9 and exact(bounds["bumpDerivativeSupremum"]) < 128,
        "actual_positive_mu_range": exact(bounds["muUpper"]) == mumax,
        "actual_continuation_checks_passed": continuation["passed"] == continuation["total"] and all(continuation["checks"].values()),
        "actual_continuation_consumes_this_b8": continuation["sourceBinding"]["newB8CertificateSHA256"] == sha(b8_path),
        "same_outer_parameter_identity": continuation["sourceBinding"]["outerParameterExpressionSHA256"] == b8["source"]["parameterTreeSHA256"],
        "actual_continuation_source_files_match": all(sha(AXIS/name) == digest for name, digest in proof_hashes.items()),
        "actual_selected_Bref_Q300": parameter["BRefUpper"] == {"power": [{"ref": "Q"}, 300]},
        "actual_selected_width_C_minus120": parameter["t1"] == {"power": [{"ref": "CSelected"}, -120]}
            and all(parameter[k] == {"ref": "t1"} for k in ["kappa0", "omega1", "omega2"]),
        "actual_selected_mu_h_squared": parameter["muMoment"] == {"power": [{"ref": "h"}, 2]},
        "actual_selected_j_h_fourth": parameter["j0"] == {"power": [{"ref": "h"}, 4]},
        "actual_selected_epsilon_h_third": parameter["epsilonMoment"] == {"power": [{"ref": "h"}, 3]},
    }
    changed = json.loads(json.dumps(b8))
    changed["geometry"]["unitMass"] = True
    negative = {
        "incorrect_unit_mass_convention_rejected": not bump_geometry_ok(changed),
        "dropping_pressure_weight_bound_rejected": not (2**13*F(2, 1000) < 1),
        "small_radius_cannot_supply_projected_gap": not (F(3, 4)*2-2 > 1),
        "insufficient_outer_stock_rejected": not (4*F(2259*116, 1024) < F(1, 8)),
    }
    if not all(checks.values()) or not all(bindings.values()) or not all(negative.values()):
        raise ValueError({"scalar": [k for k,v in checks.items() if not v],
                          "binding": [k for k,v in bindings.items() if not v],
                          "negative": [k for k,v in negative.items() if not v]})

    outbase = ROOT / "preloop-gap-review"
    outbase.mkdir(exist_ok=True)
    number = 1
    while (outbase / f"{number:04d}").exists():
        number += 1
    out = outbase / f"{number:04d}"
    out.mkdir()
    proof = ROOT / "B8_AND_PRELOOP_GAPS_EN.md"
    for path in [proof, Path(__file__)]:
        (out / path.name).write_bytes(path.read_bytes())
    receipt = {
        "schema": "mathscope.actual-preloop-lower-gaps.v1",
        "generatedUTC": datetime.now(timezone.utc).isoformat(),
        "sourceBinding": {
            "paperSHA256": continuation["sourceBinding"]["paperSHA256"],
            "outerParameterExpressionSHA256": b8["source"]["parameterTreeSHA256"],
            "selectedContinuationParameterExpressionSHA256": continuation["parameterExpressionSHA256"],
            "continuationReceiptSHA256": sha(continuation_path),
            "B8CertificateSHA256": sha(b8_path),
            "continuationProofFilesSHA256": proof_hashes,
            "proofSHA256": sha(proof), "checkerSHA256": sha(__file__),
        },
        "fixedExpressions": {"C": "(1+Q^300)^10 exp(Q^200)", "S": "C^100000",
             "mu": "h^2", "muP": "exp(-16002*T)", "widths": "C^(-120)",
             "I": "[Xa exp(t1/8), XR exp(T+3)]",
             "J": "[Xa exp(t1/16), 16 XR exp(T+2+60B-25)]"},
        "scalarChecks": checks, "sourceBindings": bindings, "negativeControls": negative,
        "allPassed": True,
        "analyticClaimsOfAttachedProof": {
            "actualSameProfileRelaxedGapsAtLeastCMinus1000": True,
            "actualBothLoopCollarGapsAtLeastSInverse": True,
            "actualUnchangedJOutsideILowerGapsAtLeastSInverse": True,
            "actualB8PartialMomentRows0And1AtMost100Mu": True,
            "actualB8RelaxedGapsAboveOneHalf": True,
            "quantifiedEtaDomain": "all eta in [-1,1]",
            "continuousRadialDomain": True,
        },
        "claimBoundary": {
            "scalarChecksRequireAttachedContinuousProof": True,
            "actualUpperJetEnvelopeVerifiedByThisScript": False,
            "actualFiniteNChosenByThisScript": False,
            "fullTheorem46ProfileCertified": False,
            "newLeanProof": False,
        },
    }
    (out / "receipt.json").write_text(json.dumps(receipt, indent=2)+"\n")
    print(json.dumps({"allPassed": True, "scalarChecks": len(checks), "sourceBindings": len(bindings),
                      "negativeControls": len(negative), "receipt": str(out / "receipt.json")}, indent=2))


if __name__ == "__main__":
    main()
