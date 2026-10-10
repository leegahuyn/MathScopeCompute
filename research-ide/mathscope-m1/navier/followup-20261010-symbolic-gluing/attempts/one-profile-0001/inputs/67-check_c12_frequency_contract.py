#!/usr/bin/env python3
"""Exact arithmetic checks for C12_FREQUENCY_CONTRACT.md.

Checks fixed constants and power absorptions for every real R >= 8192.
Does not accept claimed profile norms and does not certify an actual R or N.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
RMIN = 8192
CHECKS: list[dict] = []


def scalar(name: str, value: F, upper: F, explanation: str) -> None:
    passed = value < upper
    CHECKS.append({
        "id": name, "passed": passed,
        "lowerQuantityAtWorstEndpoint": str(value), "strictUpperBound": str(upper),
        "argument": explanation,
    })
    if not passed:
        raise AssertionError(name)


def power(name: str, terms: list[tuple[int, int]], exponent: int) -> None:
    """All coefficients nonnegative; ratio decreases for R >= RMIN."""
    if not terms or any(c < 0 or k > exponent for c, k in terms):
        raise ValueError("Power majorant requires nonnegative coefficients and k <= p")
    ratio = sum((F(c, RMIN ** (exponent - k)) for c, k in terms), F(0))
    scalar(name, ratio, F(1),
           "After division by R^p every term is nonincreasing for R>=8192.")
    CHECKS[-1]["polynomial"] = [{"coefficient": c, "power": k} for c, k in terms]
    CHECKS[-1]["upperPower"] = exponent


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit(f"Refusing to overwrite historical receipt: {args.output}")

    proof = HERE / "C12_FREQUENCY_CONTRACT.md"
    operator = HERE / "attempts/0001/certificate.json"
    operator_hash = hashlib.sha256(operator.read_bytes()).hexdigest()
    if operator_hash != "a76539a30b9900a0275f2cfb25948c5aa13f222e3e578d3d5fb1f81617bccbe7":
        raise SystemExit("The source-bound continuous C2 certificate changed.")

    power("moment_density_envelope", [(20, 5)], 6)
    power("angular_stock_reciprocals", [(7, 1), (22, 3), (22, 7)], 8)
    power("first_stock_component", [(2, 9)], 10)
    power("axial_stock_numerator", [(24, 2), (8, 1), (3, 0)], 3)
    power("second_stock_component", [(4, 5), (80, 6)], 8)
    power("modulation_shear", [(9, 2)], 3)
    power("modulation_coordinate_envelope", [(1, 17), (1, 3)], 18)
    power("c2_second_row_including_both_terms", [(196, 6), (14, 4)], 7)
    power("c2_other_row_envelope", [(196, 4), (14, 4), (14, 3), (1, 3)], 7)
    power("physical_coefficient", [(8, 15)], 16)
    power("physical_bump_values", [(54, 16)], 17)
    power("physical_log_radial_bump_derivatives", [(3 * 14 * 404, 16)], 18)
    power("repair_shear_with_actual_denominator", [(12, 19)], 20)
    power("partial_repair_moments", [(5, 20)], 21)
    power("combined_repair_input", [(1, 21), (1, 17), (1, 6)], 22)
    power("repair_coordinate_envelope", [(1, 33), (1, 20)], 34)
    power("four_component_cone_lipschitz", [(256 * 2**10, 10)], 12)
    power("cone_gradient_termwise", [(128 * 2**7, 7), (64 * 2**10, 10)], 12)
    power("positive_field_after_repair", [(2, 23)], 50)
    power("positive_shear_box", [(2, 35)], 50)
    power("half_raw_cone_margin", [(2, 47)], 50)
    power("first_directional_margin", [(16, 2)], 10)
    power("second_directional_margin", [(2048, 7)], 10)
    power("preserved_collar_margin", [(1, 1)], 10)

    # N > R^50 implies beta=R^14/N < R^-36.
    beta = F(1, RMIN**36)
    lam = F(1, 2**200)
    quadratic_sum = F(32768 + 16384)
    scalar("actual_debt_per_derivative",
           2 * beta, F(1, 10**8), "beta<R^-36 and R>=8192; second derivative costs factor two.")
    scalar("c2_root_box", 2 * beta, F(1, 10**6),
           "The C2-norm branch lies in the original pointwise root box.")
    scalar("scaled_c2_self_map", F(1) + F(2, 16) + 4 * lam * quadratic_sum * beta,
           F(2), "Divide the radius-2beta map estimate by positive beta.")
    scalar("scaled_c2_contraction", F(1, 16) + 4 * lam * quadratic_sum * beta,
           F(1, 8), "Bilinear derivative bound on the radius-2beta Banach algebra ball.")

    negative = []
    try:
        power("invalid_negative_exponent_probe", [(1, 51)], 50)
    except ValueError:
        negative.append({"id": "growing_ratio_rejected", "passed": True})
    else:
        raise AssertionError("Invalid monotonicity was accepted")
    try:
        power("invalid_signed_coefficient_probe", [(-1, 2)], 3)
    except ValueError:
        negative.append({"id": "negative_majorant_coefficient_rejected", "passed": True})
    else:
        raise AssertionError("Invalid coefficient was accepted")

    receipt = {
        "schema": "mathscope.c12-frequency-contract.scalar-audit.v1",
        "minimumR": RMIN,
        "conditionalFrequencyExpression": "1 + ceil(R^50)",
        "conditionalDirectionalMarginExpression": "R^(-10)",
        "sources": {
            "proof": {"path": proof.name, "sha256": hashlib.sha256(proof.read_bytes()).hexdigest()},
            "operator": {"path": str(operator.relative_to(HERE)), "sha256": operator_hash},
            "checker": {"sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
        },
        "checks": CHECKS,
        "negativeProbes": negative,
        "summary": {"passed": len(CHECKS), "total": len(CHECKS), "negativeProbesPassed": len(negative)},
        "claimBoundary": {
            "exactPowerAbsorptionsVerified": True,
            "sameSourceContinuousOperatorBound": True,
            "actualWholeProfileRProvided": False,
            "actualFiniteNSelected": False,
            "analyticImplicationLeanFormalized": False,
            "fullTheorem46ProfileCertified": False,
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x") as out:
        json.dump(receipt, out, indent=2)
        out.write("\n")
    print(json.dumps({"passed": len(CHECKS), "total": len(CHECKS),
                      "negativeProbesPassed": len(negative),
                      "receipt": str(args.output), "actualNSelected": False}))


if __name__ == "__main__":
    main()
