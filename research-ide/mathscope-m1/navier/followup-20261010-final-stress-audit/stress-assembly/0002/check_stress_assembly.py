#!/usr/bin/env python3
"""Exact scalar audit of the same-profile stress assembly implication.

This checks arithmetic and binds the continuous proofs used by the
assembly. It does not turn an asserted whole-profile source envelope
into an evaluated input, or replace the continuous proofs by tests.
"""

import hashlib
import json
from datetime import datetime, timezone
from fractions import Fraction as F
from pathlib import Path


ROOT = Path(__file__).resolve().parent
NAVIER = ROOT.parent
SYMBOLIC = NAVIER / "followup-20261010-symbolic-gluing"
AXIS = NAVIER / "followup-20261010-same-datum-axis"
QMIN = 2**260
RMIN = 8192


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def below_power(xmin, terms, power):
    """Nonnegative polynomial comparison, uniform for x >= xmin."""
    if xmin < 1 or any(c < 0 or p > power for c, p in terms):
        raise ValueError("A monotone normalized majorant is required")
    return sum(F(c) * F(xmin)**(p-power) for c, p in terms) < 1


def main():
    checks = {}

    def check(name, value):
        checks[name] = bool(value)

    # In S1, log C >= Q^200, C >= Q >= QMIN, and
    # T < log(Q)/64016 < Q/64016.  Only these exact implications
    # are used below; no enormous exponential is evaluated as a float.
    check("T_denominator_from_h_and_Q", 8*8002 == 64016)
    check("outer_T_coefficient", 1+90*1000+4*8002 == 122009)
    check("outer_T_terms_below_2Q", F(122009, 64016) < 2)
    check("pulse_13_over_lambda_below_Q", QMIN**7 > 13**8)
    check("release_Qb_below_Q", below_power(QMIN, [(3, 0), (F(1, 2), 1)], 1))
    check("wait_below_3Q", below_power(QMIN, [(F(16, 3), 0), (F(3, 4), 1)], 1))
    check("outer_length_below_8Q", below_power(QMIN, [(F(135, 8), 0), (F(3, 4), 1)], 1))
    check("log110_below_7", 110 < 2**7)
    check("XR_remaining_log_below_9Q", below_power(QMIN, [(7, 0), (F(20, 64016), 1)], 1))
    check("9Q_below_logC", below_power(QMIN, [(9, 1)], 200))
    check("outer_amplitude_lower", below_power(QMIN, [(1, 0), (12, 1)], 200))
    check("rho_lower_C_minus2", below_power(QMIN, [(4, 0), (F(1, 16), 1)], 200))
    check("reference_exp_lower", below_power(QMIN, [(34, 66)], 200))

    # Literal activation width and preservation of the overlapping collar.
    check("activation_linear_error", F(1, QMIN**71) < F(1, 10))
    check("activation_quadratic_error", F(1, QMIN**137) < 1)
    check("collar_loop_cutoff_zero", F(21, 10) > 2+F(1, 10)/4)
    check("right_collar_constant_interval", 0 < F(1, 2) < 1 < 60*1000*128)
    check("right_collar_gap_dominates_loop_cutoff", 2 > F(1, 4))
    check("deltaL_below_lambda_from_S", (2**20)**16 >= 2**20)
    check("modulation_ends_before_first_repair", 60*1000*128-25 > 2)
    check("last_I1_bump_before_J_right", F(27, 2) < 16)
    check("J_right_within_original_reserved_patch", 16 < 2**5)
    check("C_large_for_reference_lower", QMIN >= 4)
    check("inner_direction_denominator", below_power(QMIN, [(2, 0), (2, 6)], 8))
    check("inner_stress_exponents", -3-8 == -11)

    # S5 -> S6 -> S7: exact normalization by the same P = ps,1.
    pmin, cmax, vmax = 2**33, 2260, 116
    check("outer_linear_gap", F(vmax, pmin) < F(1, 8))
    check("outer_quadratic_gap", 4*F(cmax*vmax, pmin) < F(1, 16))
    check("outer_norm_of_shear_below_19", 4**2+15**2 < 19**2)
    check("outer_stock_norm_bound", 1+F(1, 2**60)+F(19, pmin) < 2)
    check("outer_projection_coefficient", F(1, 8)/3 == F(1, 24))
    check("outer_quadratic_direction_dyadic", 16*cmax**2 < 2**27)
    check("log24_below_5", 24 < 2**5)
    check("outer_projection_above_C_minus2", below_power(QMIN, [(F(5, 2), 0), (F(8, 64016), 1)], 200))
    check("C_minus2_below_2_minus27", QMIN**2 > 2**27)

    # Actual J estimates supplied by the C12 contract after one fixed N.
    check("J_F_lower_R_minus2", RMIN >= 8)
    check("J_shear_ratio", F(2, 1)/F(1, 2) == 4)
    check("J_direction_denominator", 1+16*RMIN**4 <= 25*RMIN**4)
    check("J_stress_lower_R_minus8", RMIN**3 >= 10)
    check("J_margin_smaller_than_preserved", RMIN > 1)

    # Remaining three exterior pieces.
    check("exterior_E_lower_C_minus2", F(3, 8)*QMIN >= 1)
    check("sqrt2Xb_below_C6", 2 <= QMIN)
    check("exterior_F_exponents", -2-6 == -8)
    check("exterior_t_below_8", F(15, 2) < 8)
    check("exterior_direction_denominator", 1+F(15, 2)**2 < 9**2)
    check("exterior_P_over72", pmin >= 72)
    check("terminal_sigma_at_quarter", 2*3**16 < 2**27)
    check("terminal_middle_constant", F(1, 2)*F(1, 2)*F(1, 2**27) == F(1, 2**29))
    check("terminal_middle_C_absorption", QMIN >= 2**29)
    check("outer_flat_v_exponent", F(3, 4)**-2 < 2)
    check("outer_flat_derivative_constant", F(1, 9)*F(1, 4)*8 == F(2, 9))
    check("outer_flat_boundary_heat_factor", 2*F(1, 2)*F(2, 9) == F(2, 9))
    check("outer_flat_C_absorption", F(2, 9)*QMIN >= 1)
    check("outer_flat_distance_power", F(1, 2)**-3 >= 1)
    check("outer_flat_exponents", -2-1-6-1 == -10)
    check("five_covering_regions_overlap", 0 < F(1, 8) < F(1, 4) and F(1, 2) < F(5, 2) and 3-F(5, 2) == F(1, 2))

    # Preserve failures of majorants or physical-size inputs.
    negative = {
        "insufficient_pressure_rejected": not (4*F(cmax*vmax, 1024) < F(1, 16)),
        "insufficient_Q_rejected": not below_power(1, [(1, 0), (12, 1)], 200),
        "insufficient_outer_flat_C_rejected": not (F(2, 9)*4 >= 1),
    }
    try:
        below_power(QMIN, [(1, 201)], 200)
    except ValueError:
        negative["growing_normalized_majorant_rejected"] = True
    else:
        negative["growing_normalized_majorant_rejected"] = False

    heat = json.loads((ROOT / "attempts/0001/receipt.json").read_text())
    activation = json.loads((ROOT / "activation-review/0002/receipt.json").read_text())
    c12 = json.loads((SYMBOLIC / "attempts/c12-0001/receipt.json").read_text())
    bindings = {
        "heat_proof_matches_accepted_scalar_receipt": heat["allPassed"] and heat["inputs"]["proofSHA256"] == sha(ROOT / "HEAT_COMPENSATION_PROOF_EN.md"),
        "activation_proof_matches_fixed_width_receipt": activation["allPassed"] and activation["proofSHA256"] == sha(ROOT / "ACTIVATION_COLLAR_BOUNDS_EN.md"),
        "C12_proof_matches_scalar_receipt": c12["summary"]["passed"] == c12["summary"]["total"] and c12["sources"]["proof"]["sha256"] == sha(SYMBOLIC / "C12_FREQUENCY_CONTRACT.md"),
        "C12_operator_matches_heat_operator": c12["sources"]["operator"]["sha256"] == heat["inputs"]["continuousOperatorCertificateSHA256"] == sha(SYMBOLIC / "attempts/0001/certificate.json"),
    }
    if not all(checks.values()) or not all(negative.values()) or not all(bindings.values()):
        raise ValueError({"failedScalar": [k for k,v in checks.items() if not v],
                          "failedNegative": [k for k,v in negative.items() if not v],
                          "failedBinding": [k for k,v in bindings.items() if not v]})

    sources = [ROOT / "GLOBAL_STRESS_ASSEMBLY_EN.md", ROOT / "HEAT_COMPENSATION_PROOF_EN.md",
               ROOT / "ACTIVATION_COLLAR_BOUNDS_EN.md", SYMBOLIC / "C12_FREQUENCY_CONTRACT.md",
               SYMBOLIC / "LOOP_DERIVATIVE_ENVELOPE.md", AXIS / "REFERENCE_DERIVATIVE_BOUNDS.md"]
    base = ROOT / "stress-assembly"
    base.mkdir(exist_ok=True)
    number = 1
    while (base / f"{number:04d}").exists():
        number += 1
    out = base / f"{number:04d}"
    out.mkdir()
    for path in [Path(__file__), ROOT / "GLOBAL_STRESS_ASSEMBLY_EN.md"]:
        (out / path.name).write_bytes(path.read_bytes())
    receipt = {
        "schema": "mathscope.same-final-stress.scalar-audit.v1",
        "generatedUTC": datetime.now(timezone.utc).isoformat(),
        "sources": [{"path": str(p.relative_to(NAVIER)), "sha256": sha(p)} for p in sources],
        "checkerSHA256": sha(__file__),
        "scalarChecks": checks, "negativeControls": negative, "sourceBindings": bindings,
        "allPassed": True,
        "actualExpressions": {
            "C": "(1+Q^300)^10 exp(Q^200)", "allFourTransitionWidths": "C^(-120)",
            "preservedOuterDirectionalMarginLowerBound": "C^(-2)",
            "globalStressLowerBoundConstant": "min(C^(-11), R^(-8))",
            "flatWeight": "exp(-t1^2/log(X/Xa)^2 - 4/log(Xb/X)^2)",
            "finalDirectionalMargin": "R^(-10)",
        },
        "claimBoundary": {
            "exactScalarImplicationVerified": True,
            "continuousProofRequiredAlongsideReceipt": True,
            "sameFinalAxisAndB8SourceInputsVerifiedByThisScript": False,
            "actualWholeProfileRProvidedByThisScript": False,
            "fullTheorem46ProfileCertified": False,
            "N3_07AutomaticallyPromoted": False,
            "newLeanProof": False,
        },
    }
    (out / "receipt.json").write_text(json.dumps(receipt, indent=2)+"\n")
    print(json.dumps({"allPassed": True, "scalarChecks": len(checks),
                      "negativeControls": len(negative), "sourceBindings": len(bindings),
                      "receipt": str(out / "receipt.json"),
                      "fullProfileCertified": False}, indent=2))


if __name__ == "__main__":
    main()
