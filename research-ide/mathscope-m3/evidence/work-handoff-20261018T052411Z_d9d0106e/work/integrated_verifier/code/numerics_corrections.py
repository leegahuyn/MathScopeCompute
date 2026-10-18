#!/usr/bin/env python3
"""Independent exact audit of Gaussian model arithmetic and saved stage losses.

No physical constants are fitted, no source code is imported, and no M3 item is
closed. Rational logarithm enclosures use a convergent atanh series with an
explicit remainder; displayed decimals are outward-rounded summaries.
"""
from __future__ import annotations
import argparse
from decimal import Decimal, localcontext, ROUND_FLOOR, ROUND_CEILING
from fractions import Fraction as Q
import hashlib
import json
from pathlib import Path


def log_interval(x: Q, terms: int = 100) -> tuple[Q, Q]:
    """Enclose ln(x) using exact fractions; reduce the argument to [1,2)."""
    x = Q(x)
    if x <= 0 or terms < 1:
        raise ValueError("Positive argument and nonzero series length required")
    k = 0
    while x >= 2:
        x /= 2
        k += 1
    while x < 1:
        x *= 2
        k -= 1

    def series(y):
        z = (y - 1) / (y + 1)
        s = sum((2 * z ** (2 * n + 1) / (2 * n + 1) for n in range(terms)), Q(0))
        remainder = 2 * z ** (2 * terms + 1) / ((2 * terms + 1) * (1 - z * z))
        return s, s + remainder

    lo, hi = series(x)
    l2, u2 = series(Q(2))
    return (lo + k * l2, hi + k * u2) if k >= 0 else (lo + k * u2, hi + k * l2)


def display_interval(iv: tuple[Q, Q], digits: int = 35) -> list[str]:
    values = []
    for q, rounding in zip(iv, (ROUND_FLOOR, ROUND_CEILING)):
        with localcontext() as ctx:
            ctx.prec = digits
            ctx.rounding = rounding
            values.append(str(Decimal(q.numerator) / Decimal(q.denominator)))
    return values


def gaussian_E(ell: Q, c=Q(1, 20), M=4, N=4, P=3) -> tuple[Q, Q]:
    if ell <= 0 or c <= 0 or min(M, N, P) < 0:
        raise ValueError("Require ell,c>0 and M,N,P>=0")
    l2, u2 = log_interval(Q(2))
    le, ue = log_interval(ell)
    base = -c * ell * ell
    return base + (M + N) * ell * l2 + 2 * P * le, base + (M + N) * ell * u2 + 2 * P * ue


def gaussian_dE(ell: Q, c=Q(1, 20), M=4, N=4, P=3) -> tuple[Q, Q]:
    l2, u2 = log_interval(Q(2))
    base = -2 * c * ell + Q(2 * P) / ell
    return base + (M + N) * l2, base + (M + N) * u2


def verify_gaussian_model() -> dict:
    # Exact parameters from v5, explicitly unrelated to the unevaluated actual c.
    c, M, N, P = Q(1, 20), 4, 4, 3
    # E''=-2c-2P/ell^2<0 makes E' strictly decreasing on ell>0.
    left, right = Q(56), Q(57)
    assert gaussian_dE(left)[0] > 0 and gaussian_dE(right)[1] < 0
    for _ in range(160):
        mid = (left + right) / 2
        lo, hi = gaussian_dE(mid)
        if lo > 0:
            left = mid
        elif hi < 0:
            right = mid
        else:
            raise ArithmeticError("Log enclosure too wide for stationary-point isolation")
    threshold = 57
    while gaussian_E(Q(threshold))[0] > -500:
        threshold += 1
    prev, curr = gaussian_E(Q(threshold - 1)), gaussian_E(Q(threshold))
    assert prev[0] > -500 and curr[1] < -500 and gaussian_dE(Q(threshold))[1] < 0
    assert gaussian_E(Q(1))[0] > -500
    # Before the maximum E increases; after it E decreases. These endpoint
    # inequalities therefore certify the least integer ell>=1, not just a scan.
    l2, u2 = log_interval(Q(2))
    lp, up = log_interval(Q(2 * P) / c)
    coarse = (N * l2 + P * lp + Q((M + N) ** 2) / (2 * c),
              N * u2 + P * up + Q((M + N) ** 2) / (2 * c))
    tight = (N * l2 + P * lp + Q((M + N) ** 2) * l2 * l2 / (2 * c),
             N * u2 + P * up + Q((M + N) ** 2) * u2 * u2 / (2 * c))
    bands = {}
    for ell in [40, 56, 57, 60, 80, 120, 172, 173, 180, 240, 300]:
        e, de = gaussian_E(Q(ell)), gaussian_dE(Q(ell))
        bands[str(ell)] = {"E_enclosure": display_interval(e), "E_prime_enclosure": display_interval(de),
                           "strictly_decreasing_here": de[1] < 0, "E_below_minus_500": e[1] < -500,
                           "exp_E_strictly_positive": True}
    return {
        "grade": "VERIFIER_TEST_ONLY_EXACT_RATIONAL_MODEL_CERTIFICATE",
        "parameters": {"c": str(c), "M": M, "N": N, "P": P},
        "actual_source_c_evaluated": False,
        "actual_physical_derivative_constants_supplied": False,
        "stationary_point_enclosure": display_interval((left, right)),
        "least_integer_ell_for_E_le_minus_500": threshold,
        "threshold_proof": {"E_previous_gt_minus500": prev[0] > -500, "E_threshold_lt_minus500": curr[1] < -500,
                            "strict_decrease_thereafter": True, "E_second_derivative": "-2c-2P/ell^2<0 for ell>0"},
        "supercritical_sample_bands": [60, 80, 120, 180, 240, 300],
        "bands": bands,
        "log_C_N_coarse_enclosure": display_interval(coarse),
        "log_C_N_tight_enclosure": display_interval(tight),
        "universal_bound_proof": [
            "Split -c ell^2 into two halves.",
            "b ell-c ell^2/2 <= b^2/(2c), b=(M+N)ln2, by completing the square.",
            "P ln(ell^2)-c ell^2/2 <= P ln(2P/c)-P <= P ln(2P/c).",
            "Retain N ln2 because q>=Q/2. Therefore N ln2+E(ell)<=the tight bound for every ell>=1.",
            "The coarse bound follows from (ln2)^2<1. This proof is not a finite-grid extrapolation."],
        "last_resolved_physical_tau": None,
        "new_M3_completions": 0,
    }


def affine(record: dict) -> tuple[Q, Q]:
    return Q(record["constant"]), Q(record.get("slope", record.get("h_coefficient")))


def subtract(a, b):
    return a[0] - b[0], a[1] - b[1]


def producer_losses(m: int) -> dict:
    if type(m) is not int or m < 0:
        raise ValueError("Derivative order must be a nonnegative integer")
    return {"ell_m": (Q(m + 2), Q(3 * m + 7, 2)),
            "K_m": (Q(2 * m + 7, 2), Q(3 * m + 10, 2)),
            "ell_prime_m": (Q(2 * m + 4), Q(3 * m + 10, 2))}


def verify_recorded_losses(inputs: Path) -> dict:
    stage = json.loads((inputs / "stage_tail_connection.json").read_text(encoding="utf-8-sig"))
    schedule = json.loads((inputs / "STAGE_CYCLE_AND_TAIL_SCHEDULE.json").read_text(encoding="utf-8-sig"))
    saved = stage["source_loss_bridge"]["acceptance_loss_discrepancies"]
    by_key = {(r["stage"], r["order"], r["quantity"]): r for r in saved}
    if len(by_key) != len(saved):
        raise ValueError("Duplicate discrepancy rows")
    rows = []
    observed = set()
    stage_ids = []
    for sj, stage_row in enumerate(schedule["n6_07_progression"]["stages"]):
        # Existing schedule stores j; never silently substitute enumeration if present.
        j = stage_row.get("j", sj)
        stage_ids.append(j)
        for r in stage_row["derivative_rows"]:
            m = r["m"]
            for quantity, prod in producer_losses(m).items():
                acc = affine(r[quantity])
                delta = subtract(prod, acc)
                expected = {"ell_m": (Q(0), Q(0)), "K_m": (Q(2), Q(3)), "ell_prime_m": (Q(m + 1), Q(0))}[quantity]
                if delta != expected:
                    raise ValueError("Recorded acceptance loss does not match its stated comparison")
                key = (j, m, quantity)
                if delta != (0, 0):
                    old = by_key.get(key)
                    if old is None or affine(old["acceptance"]) != acc or affine(old["producer_sufficient_loss"]) != prod or affine(old["producer_minus_acceptance"]) != delta:
                        raise ValueError("Discrepancy record is absent or inconsistent")
                    observed.add(key)
                rows.append({"stage_j": j, "order_m": m, "quantity": quantity,
                             "acceptance_affine": [str(v) for v in acc], "producer_affine": [str(v) for v in prod],
                             "difference_affine": [str(v) for v in delta]})
    if observed != set(by_key):
        raise ValueError("Unmatched discrepancy records")
    return {
        "grade": "EXACT_RECHECK_OF_RECORDED_SOURCE_BOUND_LOSS_FORMULAS",
        "stage_indices": stage_ids,
        "orders": sorted({r["order_m"] for r in rows}),
        "stage_order_combinations": len(rows) // 3,
        "discrepancy_records": len(observed),
        "comparisons": len(rows),
        "difference_formulas": {"ell_m": "0", "K_m": "2+3h", "ell_prime_m": "m+1"},
        "m_zero": {"ell_m": "0", "K_m": "2+3h", "ell_prime_m": "1"},
        "m_ge_one": {"ell_m": "0", "K_m": "2+3h", "ell_prime_m": "m+1"},
        "stage_independent_algebra": True,
        "paper_vs_producer": {"ell_m": "Paper p114 sufficient ell_m=2A+(m+1)(1+3h/2), exactly the recorded producer ell_m.",
                              "K_m": "Paper (9.18) asserts existence, not the explicit sufficient producer formula.",
                              "ell_prime_m": "Lemma5.4 asserts existence depending on m and ell_(m+1), not an explicit offset or m=0 branch."},
        "v5_rejected_claim": "Its 6x21 artificial comparisons with deltaell=(1+h)/2 and deltaK=2A+(1+h)/2 neither load nor reproduce these 126 saved discrepancy records. Its text 1/2-3h/2 is also inconsistent with its own artificial arithmetic.",
        "actual_stage_fields_constructed": False,
        "all_fixed_order_source_bounds_discharged": False,
        "new_M3_completions": 0,
        "rows": rows,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inputs", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    result = {"schema": "MathScope.IndependentNumericalCorrections/1",
              "gaussian_model": verify_gaussian_model(), "recorded_stage_losses": verify_recorded_losses(args.inputs),
              "source_files": {name: {"sha256": hashlib.sha256((args.inputs / name).read_bytes()).hexdigest(),
                                      "bytes": (args.inputs / name).stat().st_size}
                               for name in ("stage_tail_connection.json", "STAGE_CYCLE_AND_TAIL_SCHEDULE.json", "GAUSSIAN_TAIL_CONNECTION.json")}}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "EXACT_AUDIT_PASSED", "new_M3_completions": 0,
                      "Gaussian_threshold": result["gaussian_model"]["least_integer_ell_for_E_le_minus_500"],
                      "saved_loss_discrepancies_rechecked": result["recorded_stage_losses"]["discrepancy_records"]}))


if __name__ == "__main__":
    main()
