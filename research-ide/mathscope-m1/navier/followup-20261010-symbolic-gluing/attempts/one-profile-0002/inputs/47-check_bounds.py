#!/usr/bin/env python3
"""Independent rational checks supporting REVIEW_EN.md, with analytic scope."""
from fractions import Fraction as F
from pathlib import Path
import hashlib
import json

HERE = Path(__file__).resolve().parent
REVIEWED_DERIVATION_SHA256 = "ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81"


def build():
    derivation_sha = hashlib.sha256((HERE.parent/"OUTER_DERIVATION.md").read_bytes()).hexdigest()
    if derivation_sha != REVIEWED_DERIVATION_SHA256:
        raise ValueError("The derivation differs from the independently reviewed revision; a new review is required.")
    ell, h = F(1, 100), F(1, 100)
    tiny = F(1, 2**200)
    cmin, cmax, vmax, gmin = F(1, 3), F(2259), F(116), F(1, 4)
    checks = {
        "S_factor_for_lambda_at_most_half": F(1, 2) * (1 + 2 * F(1, 2)) <= 1,
        "postpulse_N_coefficient_below_128": 64 + F(604, 25) * ell < 128,
        "postpulse_source_lower_barrier": 1 - F(1, 4) - F(1, 8) > F(1, 8),
        "release_energy_bound": F(3, 2) + h**8 + F(2, 3)*h**7 < 2,
        "exterior_N_coefficient_below_three": 2 * (F(2, 3) + F(51, 100)) < 3,
        "uniform_exterior_w_coefficient": 3 * 256 == 768,
        "postpulse_w_below_one_hundredth": 128 * tiny**98 < F(1, 100),
        "early_exterior_w_below_one_hundredth": 6 * tiny**99 < F(1, 100),
        "late_exterior_w_below_one_hundredth": 768 * tiny**100 * h**5 < F(1, 100),
        "postpulse_ratio_gap": 2 - F(1, 100)**2 == F(19999, 10000),
        "exterior_ratio_gap": 2 - 2*F(1, 100)**2 == F(9999, 5000),
        "pulse_c_lower": F(5, 4)/3 > cmin,
        "pulse_c_upper": 1 + F(15*301, 2) < cmax,
        "pulse_v_upper": 3 + F(15**2, 2) < vmax,
        "actual_stress_threshold": max((vmax+2)/cmin, 8*cmax*vmax/gmin) < 2**24,
        "reference_radial_scale": F(2**40, 3**8) > 2**24,
        "remaining_radial_scale": F(2**40, 64) > 2**24,
        "holomorphic_mass": 4 * F(256, 255)**2 < 5,
        "complex_endpoint_disk": F(1, 32) < F(1, 16),
        "corrected_pulse_inverse_row": 2 * F(11, 10) * 3 / 3 < 4,
        "interpolation_actual_linear_coefficient": ell + F(9, 128) < F(1, 10),
    }
    return {
        "schema": "MathScope.IndependentPostPulseReview/1",
        "status": "STATED_CONDITIONAL_BOUNDS_VERIFIED" if all(checks.values()) else "FAILED",
        "checks": checks, "passed": sum(checks.values()), "total": len(checks),
        "reviewSHA256": hashlib.sha256((HERE/"REVIEW_EN.md").read_bytes()).hexdigest(),
        "checkerSHA256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "reviewedDerivationSHA256": derivation_sha,
        "conditions": [
            "The preceding exact roots supply M=J=0, S(infinity)=0 and pressure neutrality.",
            "The preceding pulse estimates and scalar/convolution identities hold.",
            "The review covers the entire corrected postpulse and exterior regions through terminal coordinate one half.",
        ],
        "wholeAnalyticBridgeReviewedByThisChecker": False,
        "newLeanProof": False,
        "originalGateClosed": False,
    }


if __name__ == "__main__":
    result = build()
    (HERE/"checks.json").write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps({k: result[k] for k in ("status", "passed", "total")}))
    if result["status"] != "STATED_CONDITIONAL_BOUNDS_VERIFIED":
        raise SystemExit(1)
