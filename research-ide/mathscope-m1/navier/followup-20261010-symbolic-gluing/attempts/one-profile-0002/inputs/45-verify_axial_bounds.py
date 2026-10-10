#!/usr/bin/env python3
"""Independent exact bounds for a replacement's whole axial stage.

This certifies scalar inequalities and a whole-cell smooth-step derivative
bound supporting the accompanying analytic derivation. It is not a Lean
formalization, a complete outer construction, or a completed global profile.
No enormous positive real is rounded to zero, infinity, or a binary64 input.
"""
from __future__ import annotations

import hashlib
import json
import sys
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parents[1]
INTERVAL_SOURCE = NAVIER / "followup-next/uniform-gluing/dyadic_interval.py"
sys.path.insert(0, str(INTERVAL_SOURCE.parent))
from dyadic_interval import BITS, sigma_prime_box  # noqa: E402


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def exp_upper(x, n=24):
    """S_n + first omitted term / (1 - x/(n+2)), all rational."""
    x = F(x)
    if x < 0 or x >= n + 2:
        raise ValueError("positive Taylor tail ratio must be below one")
    term = total = F(1)
    for k in range(1, n + 1):
        term *= x / k
        total += term
    return total + term * x / (n + 1) / (1 - x / (n + 2))


def add(*polys):
    out = {}
    for p in polys:
        for power, coefficient in p.items():
            out[power] = out.get(power, F(0)) + coefficient
    return {k: v for k, v in out.items() if v}


def scale(p, q):
    return {k: v * q for k, v in p.items() if v * q}


def mul(p, q):
    out = {}
    for x, u in p.items():
        for y, v in q.items():
            z = tuple(a + b for a, b in zip(x, y))
            out[z] = out.get(z, F(0)) + u * v
    return {k: v for k, v in out.items() if v}


def sq(p):
    return mul(p, p)


def cone_identity():
    """Check the cleared denominator a^3 by exact polynomial coefficients."""
    a, b, w = ({(1, 0, 0): F(1)}, {(0, 1, 0): F(1)}, {(0, 0, 1): F(1)})
    aw, bw = mul(a, w), mul(b, w)
    lhs = add(
        scale(mul(a, sq(add(a, scale(bw, -1)))), 2),
        scale(mul(add(sq(a), sq(b), scale(a, -2)), sq(add(aw, b))), -1),
    )
    delta_times_a = add(
        scale(a, 2), scale(mul(a, bw), -2), scale(sq(b), -1),
        scale(mul(add(sq(a), scale(a, -2)), sq(w)), -1),
    )
    rhs = mul(add(sq(a), sq(b)), delta_times_a)
    return lhs == rhs, len(lhs)


def build():
    checks = {}

    def check(name, condition):
        checks[name] = bool(condition)

    # Whole closed cells, not sampled maxima. The first endpoint collar uses
    # the analytic bound in sigma_prime_box; symmetry covers [1/2,1].
    n = 256
    cells = []
    for i in range(n):
        left, right = F(i, 2 * n), F(i + 1, 2 * n)
        enclosure = sigma_prime_box(left, right)
        cells.append({"left": str(left), "right": str(right),
                      "derivative": enclosure.json()})
    step_max = max(F(int(c["derivative"]["upperNumerator"]), 1 << BITS) for c in cells)
    check("whole_cell_step_derivative_below_nine", step_max < 9)
    check("exact_half_interval_coverage",
          F(cells[0]["left"]) == 0 and F(cells[-1]["right"]) == F(1, 2)
          and all(cells[i]["right"] == cells[i + 1]["left"] for i in range(n - 1)))

    Md, Tmin, hmax, rhomax = F(2**20), F(11), F(1, 100), F(1, 1000)
    ed = 36 / Md
    check("reference_Q_above_one",
          (F(9, 5) - F(29, 5) * hmax) / F(8, 5) > 1)
    check("exp_eight_fifths_below_five", exp_upper(F(8, 5)) < 5)
    check("initial_Q_at_least_one_sixth", F(1, 5) - hmax >= F(1, 6))
    check("D_at_least_49_over_100", F(1, 2) - hmax >= F(49, 100))
    # The expression is affine separately in s=eta^2 and z=exp(-y);
    # these four corners prove it is nonnegative throughout the square.
    q_corner_values = {}
    for s in (F(0), F(1)):
        for z in (F(0), F(1)):
            value = z / 6 + F(49, 100) * s * (1 - z) - (s + z) / 12
            q_corner_values[f"s={s},z={z}"] = str(value)
            check(f"Q_bilinear_corner_s{s}_z{z}", value >= 0)
    check("Q_loss_absorption", F(1, 12) - F(1, 48) == F(1, 16))
    check("Q_eta_coefficient", F(1, 12) >= F(1, 16))
    # exp(t)>1+t for t>0; the enormous expressions are kept symbolic.
    check("symbolic_h_below_one_hundredth", 1 + 8002 * Tmin > 100)
    check("symbolic_h_times_expT_below_one_over_48", 1 + 8001 * Tmin > 48)
    check("symbolic_lambda_positive_and_below_half", 1 + 1000 * Tmin > 2)
    check("symbolic_h_below_lambda_over_two", 1 + 7002 * Tmin > 2)
    check("rho_bound_from_co_and_h", hmax / 256 < rhomax)
    check("exp_one_below_three", exp_upper(F(1)) < 3)
    check("exp_one_above_two", 1 + F(1) + F(1, 2) > 2)
    check("profile_interpolation_slope", F(9, 128) < F(1, 10))
    flat_coefficient = 9 / (512 * (1 - hmax / 256))
    qp_over_h = 27 / (256 * (1 - hmax / 256))
    q_before_wait_lower = 4 * (1 - hmax) * 8002 * Tmin / 3
    check("terminal_log_derivative_below_h_over_four", flat_coefficient < F(1, 4))
    check("terminal_linear_coefficient_positive", 1 - hmax > 0)
    check("terminal_Qp_coefficient", qp_over_h == F(900, 8533))
    check("terminal_Qend_above_Qp", q_before_wait_lower > qp_over_h * hmax)
    check("terminal_Qend_above_116189", q_before_wait_lower > 116189)
    check("exp_T_minus_two_fifths_above_four", 1 + Tmin - F(2, 5) > 4)
    check("exp_six_fifths_below_four", exp_upper(F(6, 5)) < 4)
    check("energy_primitive_constant_below_five", F(5, 6) + 4 < 5)

    E2lower = 1 + 2 * Tmin + (2 * Tmin)**2 / 2
    geometric = (44 + 64 * hmax) / E2lower
    pressure = (2 * (F(1, 2) + hmax) + 2) / (1 - rhomax)**2
    check("geometric_Ns_coefficient_below_one", geometric < 1)
    check("energy_Ns_coefficient_below_three", 2 * hmax + 2 < 3)
    check("pressure_Ns_coefficient_below_seven", pressure < 7)
    check("Ns_constant_below_24", 1 + 3 * 5 + 7 < 24)
    check("Ns_y_coefficient_at_most_24", F(3) <= 24)
    check("bsw_exact_coefficient", 2 * 24 * 16 * ed == F(27, 1024))
    bsw_bound, bs2_over_a = 768 * ed, 2 * ed**2
    check("bsw_below_one_over_32", bsw_bound < F(1, 32))

    cmin, cmax, V, gmin = F(63, 64), F(65, 64), F(65, 32), F(31, 16)
    check("c_lower_margin", 1 - bsw_bound / 2 > cmin)
    check("c_upper_margin", 1 + bsw_bound / 2 < cmax)
    check("v_upper_margin", 2 + bs2_over_a < V)
    check("A24_gap_above_31_over_16", 2 - 2 * bsw_bound - bs2_over_a > gmin)
    identity_ok, identity_terms = cone_identity()
    check("exact_cone_polynomial_identity", identity_ok)
    P = F(9)
    threshold_1, threshold_2 = (V + 2) / cmin, 8 * cmax * V / gmin
    check("P_exceeds_first_actual_cone_threshold", P > threshold_1)
    check("P_exceeds_second_actual_cone_threshold", P > threshold_2)
    check("Pc_strictly_above_v_and_two", P * cmin > max(V, F(2)))
    check("actual_cone_polynomial_positive",
          gmin - 4 * cmax * V / P > gmin / 2)
    check("physical_radial_threshold", 128 * 2 / F(16) > P)
    # Two false promotion controls distinguish necessary downstream failures.
    check("small_Md_cannot_pass_this_bound", not 27648 / F(1) < F(1, 32))
    check("axis_center_not_strictly_admissible", not F(2) > 2)

    parameter_expressions = {
        "Md": {"integer": 2**20},
        "T": {"sum": [{"exp": {"ref": "Md"}}, {"integer": 10}]},
        "logP": {"product": [{"integer": 2}, {"ref": "T"}]},
        "Pstar": {"exp": {"ref": "logP"}},
        "lambda": {"exp": {"product": [{"integer": -1000}, {"ref": "T"}]}},
        "h": {"exp": {"product": [{"integer": -8002}, {"ref": "T"}]}},
        "co": {"rational": "1/256"},
        "Tf": {"integer": 128},
    }
    canonical_parameters = json.dumps(parameter_expressions, sort_keys=True, separators=(",", ":")).encode()
    return {
        "schema": "MathScope.IndependentAxialReselection/1",
        "status": "AXIAL_STAGE_INEQUALITIES_VERIFIED" if all(checks.values()) else "FAILED",
        "sourceBinding": {
            "paperSHA256": "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
            "paperAnchors": ["A.2", "A.21", "A.24-A.26", "B.35", "Lemma 4.5"],
            "outerSourceSHA256": sha(NAVIER / "followup-construction/outer.mjs"),
            "intervalLibrarySHA256": sha(INTERVAL_SOURCE),
            "verifierSHA256": sha(__file__),
            "derivationSHA256": sha(HERE / "DERIVATION_EN.md"),
            "parameterExpressionSHA256": hashlib.sha256(canonical_parameters).hexdigest(),
        },
        "parametersExactExpressions": parameter_expressions,
        "domain": {
            "eta": "[-1,1]",
            "localAxialY": "[0,T]",
            "logXOverXR": "[1,1+T]",
            "requiredXR": "XR >= 128",
            "pressure": "The exact unedited A.21 schedule for these new parameters",
        },
        "claims": {
            "stepDerivativeUpper": "9",
            "Qlower": "(eta^2+exp(-y))/16",
            "NsOverE2AbsoluteUpper": "24*abs(eta)*(1+y)",
            "bswAbsoluteUpper": str(bsw_bound),
            "E2lower": "exp(2*T)",
            "uneditedA21TerminalWaitPositiveAndFinite": all(checks.values()),
            "actualRelaxedConeOnAxialStage": all(checks.values()),
            "admissibleConeWhereVStrictlyAboveTwo": all(checks.values()),
            "strictAdmissibleConeAtEveryAxialPoint": False,
            "wholeOuterConstructionCertified": False,
            "newA21AxisOrJoiningCertificatesGenerated": False,
            "globalProfileCertified": False,
            "originalAcceptanceGateClosed": False,
            "newLeanAnalyticTheorem": False,
        },
        "rationalBounds": {
            "stepDerivativeUpperFromCells": str(step_max),
            "QbilinearCorners": q_corner_values,
            "geometricNsCoefficient": str(geometric),
            "pressureNsCoefficient": str(pressure),
            "terminalLogDerivativeOverHUpper": str(flat_coefficient),
            "terminalQpOverHUpper": str(qp_over_h),
            "terminalQBeforeWaitLower": str(q_before_wait_lower),
            "bsSquaredOverALowerUpper": ["0", str(bs2_over_a)],
            "cLower": str(cmin), "cUpper": str(cmax),
            "vUpper": str(V), "G_lower": str(gmin),
            "Pthreshold1": str(threshold_1), "Pthreshold2": str(threshold_2),
            "selectedPthreshold": str(P), "coneIdentityMonomials": identity_terms,
        },
        "checks": checks,
        "passed": sum(checks.values()), "total": len(checks),
        "stepDerivativeCertificate": {
            "bits": BITS, "method": "Whole closed dyadic cells plus analytic endpoint collar and exact symmetry",
            "finitePointSamplesUsedAsSupremum": False,
            "halfIntervalCells": cells,
        },
        "proofBoundary": [
            "The analytic identification, differentiation and variation-of-constants arguments are derived in DERIVATION_EN.md, not in Lean.",
            "The new real parameters are explicit exp-expression objects; the former binary64 pressure producer is not claimed to accept them.",
            "The pulse, exact correction roots, corrected pressure, heat replacement, full modulation and same final field are not supplied here.",
            "Future exact pressure-neutral corrections preserve the axial pressure; no unverified residual is treated as zero.",
        ],
    }


if __name__ == "__main__":
    result = build()
    target = HERE / "independent-axial-certificate.json"
    target.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({k: result[k] for k in ("status", "passed", "total", "claims")}, indent=2))
    if result["status"] != "AXIAL_STAGE_INEQUALITIES_VERIFIED":
        raise SystemExit(1)
