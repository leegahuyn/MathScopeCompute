#!/usr/bin/env python3
"""Read-only independent checks of the new symbolic axial-stage certificate.

Writes only this review directory. Run with Python -B to avoid bytecode in
the reviewed source directories. No source executable's __main__ is invoked.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORK = HERE.parents[1]
TARGET = HERE.parent / "independent-axial"


class Laurent:
    """Three-variable exact Laurent polynomials, independent of target code."""
    def __init__(self, coefficients):
        self.p = {e: F(c) for e, c in coefficients.items() if c}

    @staticmethod
    def scalar(c):
        return Laurent({(0, 0, 0): F(c)})

    def __add__(self, other):
        other = other if isinstance(other, Laurent) else Laurent.scalar(other)
        out = dict(self.p)
        for e, c in other.p.items():
            out[e] = out.get(e, F(0)) + c
        return Laurent(out)

    __radd__ = __add__

    def __neg__(self):
        return Laurent({e: -c for e, c in self.p.items()})

    def __sub__(self, other):
        other = other if isinstance(other, Laurent) else Laurent.scalar(other)
        return self + (-other)

    def __rsub__(self, other):
        return (-self) + other

    def __mul__(self, other):
        other = other if isinstance(other, Laurent) else Laurent.scalar(other)
        out = {}
        for e, c in self.p.items():
            for f, d in other.p.items():
                ef = tuple(x+y for x, y in zip(e, f))
                out[ef] = out.get(ef, F(0)) + c*d
        return Laurent(out)

    __rmul__ = __mul__


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if not sys.dont_write_bytecode:
        raise SystemExit("Run this read-only review with python3 -B")
    files = [TARGET/n for n in ["DERIVATION_EN.md", "verify_axial_bounds.py", "independent-axial-certificate.json"]]
    before = {f.name: sha(f) for f in files}
    spec = importlib.util.spec_from_file_location("reviewed_axial_certificate", TARGET/"verify_axial_bounds.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    result = module.build()
    stored = json.loads((TARGET/"independent-axial-certificate.json").read_text())

    a, b, w = (Laurent({p: 1}) for p in [(1, 0, 0), (0, 1, 0), (0, 0, 1)])
    inva = Laurent({(-1, 0, 0): 1})
    c, j, v = 1-b*w*inva, w+b*inva, a+b*b*inva
    gap = 2-2*b*w-b*b*inva-(a-2)*w*w
    G = 2*c*c-(v-2)*j*j
    difference = G-v*inva*gap

    hmax, co = F(1, 100), F(1, 256)
    rho = co*hmax
    terminal_slope_ratio = co*F(9, 2)/(1-rho)
    # e<3, hence e^3<27. Integral fo'/fo <= rho/(1-rho).
    Qp_over_h = 27*co/(1-rho)
    # The -1 hold contributes (1-h)*4*log(1/h), and the subsequent
    # one-unit flattening loses at most exp(-1)>1/3 of this positive Q.
    Qafter = (1-hmax)*4*8002*11/3
    cmin, cmax, vmax, gmin = F(63, 64), F(65, 64), F(65, 32), F(31, 16)
    P = F(9)
    checks = {
        "in_memory_regeneration_matches_stored_JSON": result == stored,
        "all_target_arithmetic_checks_pass": all(result["checks"].values()),
        "independent_unscaled_Laurent_cone_identity": difference.p == {},
        "terminal_fo_slope_ratio_exact": terminal_slope_ratio == F(150, 8533),
        "terminal_source_slope_condition": 0 < terminal_slope_ratio < F(1, 4),
        "Tf_source_condition_without_decimal_log": F(9, 128) < F(1, 10),
        "terminal_Qp_over_h_bound_exact": Qp_over_h == F(900, 8533),
        "terminal_Qp_upper_below_one": 0 < Qp_over_h*hmax < 1,
        "terminal_Q_after_flattening_above_one": Qafter > 1,
        "terminal_Q_after_above_Qp": Qafter > Qp_over_h*hmax,
        "first_actual_cone_threshold_independent": (vmax+2)/cmin == F(86, 21) < P,
        "second_actual_cone_threshold_independent": 8*cmax*vmax/gmin == F(4225, 496) < P,
        "actual_polynomial_has_strict_margin_at_P9": gmin-4*cmax*vmax/P > gmin/2 > 0,
        "eta_zero_not_promoted_to_strict_admissible": stored["claims"]["strictAdmissibleConeAtEveryAxialPoint"] is False,
        "global_and_Lean_claims_remain_false": not any(stored["claims"][k] for k in ["wholeOuterConstructionCertified", "globalProfileCertified", "originalAcceptanceGateClosed", "newLeanAnalyticTheorem"]),
        "review_did_not_change_target_files": before == {f.name: sha(f) for f in files},
    }
    record = {
        "schema": "MathScope.AxialReselectionIndependentReview/1",
        "status": "REVIEW_CHECKS_PASS" if all(checks.values()) else "REVIEW_FAILURE",
        "sourceSHA256": before,
        "targetCheckCount": {"passed": result["passed"], "total": result["total"]},
        "reviewChecks": checks, "passed": sum(checks.values()), "total": len(checks),
        "additionalExactBounds": {
            "foPrimeOverFoOverHUpper": str(terminal_slope_ratio),
            "TfSlopeMagnitudeUpperUsingLog2BelowOne": "9/128",
            "QpOverHUpper": str(Qp_over_h),
            "QAfterFlattenLower": str(Qafter),
        },
        "analyticBoundary": "The review derives the Q barriers, exact reference moments, pressure bound and terminal-wait existence in REVIEW_EN.md. The scalar checks do not themselves formalize these analytic implications.",
        "scope": "Only the stated literal unedited reference axial stage and its own A.21 pressure. No corrected angular root, full exterior, replacement axis, global modulation or original gate is certified.",
        "originalSourceOrRepoChanged": False,
        "newLeanAnalyticTheorem": False,
    }
    (HERE/"checks.json").write_text(json.dumps(record, indent=2)+"\n")
    print(json.dumps(record, indent=2))
    if not all(checks.values()):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
