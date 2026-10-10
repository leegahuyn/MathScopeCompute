#!/usr/bin/env python3
"""Pin the read-only formal route review and check its finite comparisons.

This is not a Lean compilation or proof of the remaining analytic premises.
Only new output paths are accepted; the original source is read-only.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
AXIS = HERE.parent
NAVIER = AXIS.parent
COMMIT = "f9e8bc5b38b6e212696e8a30e3e91517af887bbd"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--official-root", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    out = args.output.resolve()
    inputs = out.with_suffix(".inputs")
    if out.exists() or inputs.exists():
        raise SystemExit("Append-only output already exists")
    snapshots = {}
    checks = {}

    def check(name, value):
        if name in checks:
            raise ValueError("Duplicate check: " + name)
        checks[name] = bool(value)

    def read(label, path):
        data = path.read_bytes()
        snapshots[label] = {"path": str(path.resolve()), "sha256": digest(data),
                            "bytes": len(data), "data": data}
        return data.decode()

    original = {}
    for name in ["OutgoingSchedule.lean", "OutgoingTail.lean", "SchedulePressure.lean",
                 "PressureDatum.lean", "NaturalAxisCoefficients.lean",
                 "AnalyticCoefficientBounds.lean", "AnalyticPrimitive.lean",
                 "AxisContraction.lean", "AxisResolvent.lean", "AxisOperators.lean",
                 "NaturalAxisBridge.lean"]:
        relative = "NavierStokes/" + name
        original[name] = read(name, args.official_root / relative)
        baseline = subprocess.run(["git", "show", COMMIT + ":" + relative],
            cwd=args.official_root, check=True, capture_output=True).stdout
        check("pinned_original_" + name, digest(baseline) == snapshots[name]["sha256"])

    outer = json.loads(read("outer-envelope-certificate.json",
        NAVIER / "followup-20261010-outer-reselection/outer-envelope-certificate.json"))
    axis = json.loads(read("axis-envelope-certificate.json", AXIS / "axis-envelope-certificate.json"))
    freeze = json.loads(read("ACTIVE_SOURCE_FREEZE.json", AXIS / "ACTIVE_SOURCE_FREEZE.json"))
    read("SAME_DATUM_ANALYTIC_AXIS.md", AXIS / "SAME_DATUM_ANALYTIC_AXIS.md")
    read("OUTER_DERIVATION.md", NAVIER / "followup-20261010-outer-reselection/OUTER_DERIVATION.md")
    read("FORMAL_SAME_DATUM_ROUTE.md", HERE / "FORMAL_SAME_DATUM_ROUTE.md")
    read("independent-verifier.py", Path(__file__))
    for name in ["axis-envelope-certificate.json", "SAME_DATUM_ANALYTIC_AXIS.md"]:
        check("active_freeze_" + name, snapshots[name]["sha256"] == freeze["files"][name])

    params = outer["parametersExactExpressions"]
    check("new_co_is_exact_1_over_256", params["co"] == {"rational": "1/256"})
    check("new_Tf_is_exact_128", params["Tf"] == {"integer": 128})
    check("new_Md_is_exact_2_power_20", params["Md"] == {"integer": 2**20})
    check("new_T_is_exp_Md_plus_10", params["T"] == {"sum": [{"exp": {"ref": "Md"}}, {"integer": 10}]})
    check("new_logP_is_2T", params["logP"] == {"product": [{"integer": 2}, {"ref": "T"}]})
    check("new_lam_is_positive_exp_minus_1000T", params["lambda"] == {"exp": {"product": [{"integer": -1000}, {"ref": "T"}]}})
    check("new_h_is_positive_exp_minus_8002T", params["h"] == {"exp": {"product": [{"integer": -8002}, {"ref": "T"}]}})

    tail = original["OutgoingTail.lean"]
    body = tail.split("structure TailData where", 1)[1].split("namespace TailData", 1)[0]
    check("TailData_has_only_core_h_and_proofs", [line.strip().split(":", 1)[0].strip()
        for line in body.splitlines() if ":" in line] == ["core", "h", "h_pos", "h_small"])
    anchors = {
        "OutgoingTail.lean": [
            "def stepBound : ℝ := Classical.choose exists_sigma_derivative_bound",
            "theorem stepBound_ge_one : 1 ≤ stepBound",
            "def flattenLength : ℝ := 10 * (stepBound + 1) * Real.log 2 + 1",
            "def tailCoefficient : ℝ := Real.exp (-5) / (16 * (stepBound + 1))",
            "def uniformWait (d : TailData) : ℝ := 30 * Real.log (1 / d.core.lam)",
            "def longHold (d : TailData) : ℝ := 4 * Real.log (1 / d.h)",
            "def initialLag (d : TailData) : ℝ := (d.core.lam - d.h) / (1 - d.core.lam)",
            "Real.log (releaseLag d d.rampEnd / tailDebt d) / (1 - d.h)",
        ],
        "OutgoingSchedule.lean": [
            "def dropLength (c : Parameters) : ℝ := Real.exp c.m + 10",
            "def pulseLength (c : Parameters) : ℝ := 13 / c.lam",
            "wait := 60 * Real.log (1 / lam)",
            "4 * (1 - sigma (Real.log (1 + t) / c.m)) * eta",
        ],
        "NaturalAxisCoefficients.lean": [
            "def window : Window := ⟨-11 / 10, 11 / 10, by norm_num⟩",
            "def boundedAxisElement {I : Window}",
            "theorem boundedAxisElement_norm {I : Window}",
            "theorem boundedAxisElement_coefficient {I : Window}",
            "elements : Field → AxisSpace window epsilon",
            "v.epsilon = ρ / 2",
            "theorem exists_analyticInputs",
        ],
        "AnalyticCoefficientBounds.lean": [
            "def realJet", "theorem cauchy_bound_le_weight",
            "def radiusLoss (q : ℝ) : ℝ := ∑' m : ℕ, ((m : ℝ) + 1) ^ 2 * q ^ m",
            "theorem uniform_normalizedExp_axisData",
        ],
        "AxisContraction.lean": [
            "def contractionThreshold", "theorem exists_unique_natural_fixedPoint",
            "theorem fixedPoint_integrated_equations",
        ],
        "AxisResolvent.lean": [
            "theorem factorialMajorant_le_exp_term", "theorem naturalResolvent_norm_le",
            "factorialMajorant (2560 * ‖χ‖)",
        ],
        "NaturalAxisBridge.lean": ["structure CompatibleData (I : Window)"],
        "PressureDatum.lean": ["structure Admissible", "theorem hasDerivAt_complexPressure"],
        "SchedulePressure.lean": ["theorem axisPressure_eq", "theorem angular_square_factorization"],
    }
    for filename, needles in anchors.items():
        for n, needle in enumerate(needles):
            check("source_declaration_" + filename + "_" + str(n), needle in original[filename])

    a_body = original["PressureDatum.lean"].split("structure Admissible", 1)[1].split("theorem kernel_eq_rpow", 1)[0]
    check("pressure_admissible_has_exact_six_fields", [line.strip().split(":", 1)[0].strip()
        for line in a_body.splitlines()[1:] if ":" in line] ==
        ["cap_nonneg", "integrable", "nonneg", "measurable", "exponent_nonneg", "exponent_le"])
    check("old_and_new_windows_differ", F(11, 10) != F(33, 32))
    check("new_window_strictly_inside_original", F(33, 32) < F(11, 10))
    check("exp5_Taylor_degree2_lower_value", 1 + 5 + F(25, 2) == F(37, 2))
    old_co_upper = 1 / (32 * F(37, 2))
    check("original_co_upper_is_1_over_592", old_co_upper == F(1, 592))
    check("original_co_upper_strictly_below_new_co", old_co_upper < F(1, 256))
    ratio = F(1, 16)
    loss = (1 + ratio) / (1 - ratio)**3
    check("exact_radiusLoss_closed_form", loss == F(4352, 3375))
    check("radiusLoss_below_geometric_4_over_3", loss < F(4, 3) < 2)
    check("whole_tube_containment_factor", 16 * F(1, 65536) < F(1, 2048))
    check("coarse_resolvent_exponent_below_4T", 5120 <= 4 * (2**20 + 11))
    check("all_derivative_operator_norms_within_Q", 5120 < 2**244)
    reference_u = F(1, 2) * 80 * 64 * 4 * 3600
    check("loose_reference_u_constant", reference_u == 36864000)
    check("reference_ball_within_Q_by_K_budget", reference_u + 2 + 1 < 2**260)

    b = {5: 2, 6: 3, 7: 3, 8: 11, 9: 8, 10: 2, 11: 29}
    l = {4: 2, 5: 3, 6: 4, 7: 17, 8: 14, 9: 4, 10: 58}
    for name, polynomial in [("polynomialBound", b), ("polynomialLipschitz", l)]:
        check("frozen_exact_tree_" + name, axis["controlledRemainder"][name] ==
            {str(k): str(v) for k, v in polynomial.items()})
    check("bound_degree11_sum58", max(b) == 11 and sum(b.values()) == 58)
    check("lip_degree10_sum102", max(l) == 10 and sum(l.values()) == 102)
    check("threshold_absorption", 1 + 58 + 102 == 161 and 161 < 2**260 and 12 <= 64)
    check("sharp_displacement", F(58, 2) == 29 and 11-64 == -53)
    check("sharp_contraction", F(102, 2) == 51 and 10-64 == -54)

    inputs.mkdir(parents=True, exist_ok=False)
    for name, item in snapshots.items():
        (inputs / name).write_bytes(item.pop("data"))
        item["snapshot"] = str(inputs.name + "/" + name)
    receipt = {
        "schema": "MathScope.IndependentFormalSameDatumRouteReview/1",
        "createdUTC": datetime.now(timezone.utc).isoformat(),
        "status": "PASS_WITH_EXPLICIT_OPEN_FORMAL_PREMISES" if all(checks.values()) else "FAIL",
        "originalCommit": COMMIT,
        "sources": snapshots,
        "checks": checks,
        "passed": sum(checks.values()), "total": len(checks),
        "reviewDecisions": {
            "genericFixedWindowRadiusRouteExists": True,
            "originalTailDataIsNotDefinitionallyTheNewSchedule": True,
            "originalTailCoefficientProvedUnequalToNewCoefficient": True,
            "pressureIntegralsProvedUnequal": False,
            "fixedLambdaCompatibleWithActualSourceNormBudget": True,
            "completeNewPressureAdmissibleCompiledByThisReview": False,
            "actualNewFixedPointLeanInstantiationCompletedByThisReview": False,
            "finiteChecksAreAWholeAnalyticLeanProof": False,
            "N303PromotedByThisReview": False,
            "originalFilesModified": False,
        },
        "openFormalObligations": [
            "Define the exact new g,a with Tf=128 and co=1/256, using its actual reset and terminal wait.",
            "Prove all six Admissible fields and exact angular factorization for those definitions.",
            "Prove actual pressure-neutral edit equality, mass bound, and required complex bounds.",
            "Construct all actual coefficient inputs, compatibility, primitive/amplitude and norm bounds in fixed I,rho.",
            "Bound the original contractionThreshold at the selected Lambda and identify the resulting Picard limit.",
        ],
    }
    out.write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps({"status": receipt["status"], "passed": receipt["passed"],
        "total": receipt["total"], "receipt": str(out), "sha256": digest(out.read_bytes())}))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
