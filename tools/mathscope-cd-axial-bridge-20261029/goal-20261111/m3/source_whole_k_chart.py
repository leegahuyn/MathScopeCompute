"""Replay the normalized physical chart and finite cutoff scope on the actual N7 slab."""

import argparse
import hashlib
import itertools
import json
import math
import subprocess
from collections import Counter
from fractions import Fraction
from pathlib import Path


REVISION = "9595b4de5a1065b694d225c0ad2a14d5aa4435a9"
FIRST_FIVE_COMMIT = "f8cb4034e86d7b669d52a6f2248aebba156b51b5"
FAMILY = "7a44a4737d386903272ebc706d53aeff256be6e2"
FAMILY_SHA256 = "b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78"
REQUEST = "47d5dbc4933eb5064538d4914ed65dceaaafd080"
GRID = "26bc1a52f7898e910c6ef81047614a23e4806ecf"
BASE = "research-ide/mathscope-m3"
FILES = {
    "localization": (f"{BASE}/navier/source-localization.mjs",
                     "ed0d61b905f91ef417ea49e52f6ed36b2d141435"),
    "criteria": (f"{BASE}/ORIGINAL_M3_M4_CRITERIA.json",
                 "fa6c7b0c7aa1c6d9c8e699d394e04f70715fd759"),
    "window": (f"{BASE}/navier/final-summation/source-final-summation.mjs",
               "dd00b8715e2b3faaad837a855218a260fa288c69"),
    "threshold": (f"{BASE}/navier/shrinking-cutoff-summation.mjs",
                  "a59099809f7ac715524e6fe5325427ee82fcb110"),
    "common_background": ("research-ide/mathscope-m2/navier/actual-common-admissible-family.mjs",
                          "614c59419ec1a6d7e37a52084d10b6a3b4e5d30b"),
}
RUNTIME_FILES = {
    "actual_runner": (f"{BASE}/extended-signed-run-20261023/run_real_original_signed162.mjs",
                      "690e1f7a842bafcfcfb768093b8a777656f8ce0d"),
    "first_forced": (f"{BASE}/navier/source-global-forced-current.mjs",
                     "03c3e125d93a5bd9e66d00c5f237b100c7b48b50"),
}
HALF = Fraction(1, 2)
DELTA = Fraction(1, 2**20)
EXP_TAYLOR = {
    j: sum((Fraction(j**k, math.factorial(k)) for k in range(15)), Fraction())
    for j in range(1, 6)
}


def require(ok, detail):
    if not ok:
        raise ValueError(detail)


def git(repo, *args):
    return subprocess.check_output(["git", *args], cwd=repo)


def blob(repo, sha):
    data = git(repo, "cat-file", "blob", sha)
    git_digest = hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()
    require(git_digest == sha, f"blob digest differs: {sha}")
    return data


def pinned_sources(repo):
    sources = {}
    pins = {}
    for revision, files in ((REVISION, FILES), (FIRST_FIVE_COMMIT, RUNTIME_FILES)):
        for label, (path, sha) in files.items():
            actual = git(repo, "rev-parse", f"{revision}:{path}").decode().strip()
            require(actual == sha, f"revision path differs: {path}")
            sources[label] = blob(repo, sha).decode()
            pins[label] = {"commit": revision, "path": path, "git_blob": sha}
    checks = {
        "localization": [
            "tau0===G.div(qStar,q(32))",
            "z0===G.exp(G.mul(D,G.log(tau0)))",
            "r0===G.one",
            "tau=q*(1-eta^2), z=q^D*eta, X=r^2/(2q)",
            "x1^2+x2^2<=r0^2/2, x3^2<=z0^2/2",
            "exponent.upperBoundExact==='2^-4096'",
            "matching derivatives of every order at1/2 and1",
            "dt=G.neg(G.derivative(c,tau))",
        ],
        "window": [
            "relativeLogWindow:['1','3/2']",
            "return G.choose(s,G.q(1,2),G.one,G.one,inside,G.zero)",
        ],
        "threshold": [
            "L=G.maximum(G.one,G.add(G.one,previousLogScale),G.add(G.one,logQ0Reciprocal)",
            "a=G.exp(L)",
        ],
        "common_background": [
            "growth=G.add(previous,G.log(q(n===2?16:2)))",
            "smallBand=n===1?G.mul(G.add(ellMinimum,q(10)),log2):G.zero",
            "logScale=G.maximum(old.logScale,growth,smallBand",
        ],
        "actual_runner": [
            "attachGlobalForcedCurrent(initial,context)",
            "attachActualPostSignedFiveMap(actualTemporal,context)",
            "attachActualPostFiveFull3DPDE(actualFive,context)",
            "receipt.actual_final_emitted_gauge_A_b_p_roots=null",
            "FOUR_STAGE_ITERATION_ALL_ORDER_ESTIMATES_AND_FINAL67_NUMERIC_OPEN",
        ],
        "first_forced": [
            "assertGlobalInitializedAngular(source)",
            "actual-all20-forced-positive-source-systems",
            "actual-after-forced-all162-covariance-and-wave-fields",
            "actual-after-forced-all-new-current-harmonics",
        ],
    }
    for label, terms in checks.items():
        require(all(term in sources[label] for term in terms), f"{label} source expression changed")
    require(sources["actual_runner"].count("attachGlobalForcedCurrent(") == 1,
            "first FiveMap producer now has another forced call")
    family_bytes = blob(repo, FAMILY)
    require(hashlib.sha256(family_bytes).hexdigest() == FAMILY_SHA256,
            "family SHA-256 differs")
    family = json.loads(family_bytes)
    request = json.loads(blob(repo, REQUEST))
    grid = json.loads(blob(repo, GRID))
    require(request["actual_family_sha256"] == FAMILY_SHA256
            and request["actual_last_resolved_tau"] is None,
            "original energy request scope changed")
    scales = [node for node in family["nodes"] if node["operation"] == "ActualShrinkingScale"]
    require([node["id"] for node in scales] == request["frozen_scale_nodes"],
            "actual energy scale nodes differ")
    require(len(scales) == 5 and family["numerical_field_evaluator"] is False
            and family["numerical_supremum_evaluator"] is False,
            "functional family scope changed")
    for index, scale in enumerate(scales, 1):
        data = scale["data"]
        require(data["j"] == index and data["a"] == "exp(L)"
                and data["previous"] == ("log(1/qbig)" if index == 1 else "L_(j-1)")
                and data["L"].startswith("max(1,1+L_previous,1+log(1/qbig),")
                and data["original_cutoff"] == "chi=1 on(-infinity,1/2],chi=0 on[1,infinity)"
                and data["all_order_rule"].startswith("same rule for every finite j;")
                and (index == 1 or scales[index - 2]["id"] in scale["inputs"]),
                f"original shrinking scale row {index} differs")
    require(grid["settings"]["normalized_time"] == ["1/2", "1"]
            and grid["coordinates"]["tau0"] == "qbig/32"
            and grid["coordinates"]["qbig"] == "2^(-(ellMinimum+10))"
            and grid["coordinates"]["z0"] == "tau0^(1/2-h)",
            "grid is not the original whole-K cutoff slab")
    pins["family"] = {"git_blob": FAMILY, "sha256": FAMILY_SHA256}
    pins["request"] = {"git_blob": REQUEST}
    pins["grid"] = {"git_blob": GRID}
    criteria = json.loads(sources["criteria"])
    criteria = [item for group in criteria.values() if isinstance(group, list)
                for item in group if isinstance(item, dict) and item.get("id") in ("N7-06", "N8-05")]
    require({item["id"] for item in criteria} == {"N7-06", "N8-05"}, "criteria missing")
    stage_one = family["actual_stages"][1]
    nodes = {node["id"]: node for node in family["nodes"]}
    grouped = [node for node in family["nodes"]
               if node["operation"] == "GroupedSupportedNonzeroResidual"
               and node["inputs"] == [stage_one]]
    require(len(grouped) == 1 and grouped[0]["data"]["all_generated_harmonics"] == "0<|m|<=2^2",
            "second cycle grouped source differs")
    forced = [node for node in family["nodes"]
              if node["operation"] == "OriginalForcedMap" and grouped[0]["id"] in node["inputs"]]
    require(len(forced) == 1 and forced[0]["inputs"][0] == stage_one,
            "second cycle forced successor differs")
    first_norms = [nodes[node_id] for node_id in scales[0]["data"]["norm_inputs"]]
    require([node["data"]["m"] for node in first_norms] == [0, 1]
            and all(node["operation"] == "ActualCutoffCurlBound"
                    and node["data"]["j"] == 1
                    and node["data"]["numeric_value"] is None for node in first_norms),
            "first selector norm scope changed")
    frontier = {
        "archived_stage": "first post-Signed FiveMap and whole-3D residual AST",
        "actual_runner_commit": FIRST_FIVE_COMMIT,
        "stage_one_functional": stage_one,
        "next_grouped_nonzero_source": grouped[0],
        "next_forced_operation": forced[0],
        "first_scale_norms_with_no_numerical_value": [node["id"] for node in first_norms],
        "scope": "The archived runner calls the first Forced constructor once on the privately "
                 "initialized input. It emits no second-cycle call and no final gauge roots.",
    }
    return pins, criteria, grid, [node["id"] for node in scales], frontier


def squared_range(lo, hi):
    lower = Fraction() if lo <= 0 <= hi else min(lo * lo, hi * hi)
    return lower, max(lo * lo, hi * hi)


def normalized_q_interval(rho, sigma):
    """Q=q/tau0, sigma=zeta^2, on the original active cutoff slab.

    Q is the unique positive root of Q - sigma*Q^(2h) = rho.
    The two endpoints 1/2 and 2 bracket it. Thus
    1-DELTA <= Q^(2h) <= (1-DELTA)^(-1).
    """
    lo = max(HALF, rho[0] + sigma[0] * (1 - DELTA))
    hi = min(Fraction(2), rho[1] + sigma[1] / (1 - DELTA))
    require(lo <= hi, "invalid chart enclosure")
    return lo, hi


def background_order_status(order, rho, sigma, qlo):
    # b1*qbig >= 1, b2*qbig >=16, b3*qbig >=32.
    minimum_factor = (1, 16, 32)[order - 1]
    argument_lower = minimum_factor * qlo / 32
    if argument_lower >= 1 or (order == 3 and rho[0] + sigma[0] >= 1):
        return "FLAT_ZERO"
    if argument_lower > HALF:
        return "TRANSITION_OR_ZERO"
    return "PLATEAU_TRANSITION_OR_ZERO"


def correction_stage_status(stage, qlo):
    # exp(stage) is strictly greater than the positive truncated Taylor sum.
    argument_strict_lower = EXP_TAYLOR[stage] * qlo / 32
    if argument_strict_lower >= 1:
        return "FLAT_ZERO"
    if argument_strict_lower >= HALF:
        return "TRANSITION_OR_ZERO"
    return "PLATEAU_TRANSITION_OR_ZERO"


def evaluate_cells(grid_count, time_count):
    edges = tuple(Fraction(-1) + Fraction(2 * i, grid_count) for i in range(grid_count + 1))
    times = tuple(HALF + Fraction(i, 2 * time_count) for i in range(time_count + 1))
    squared = [squared_range(a, b) for a, b in zip(edges, edges[1:])]
    cells = {}
    exterior = 0
    for ix, iy, iz, it in itertools.product(range(grid_count), range(grid_count),
                                             range(grid_count), range(time_count)):
        x2, y2, zeta2 = squared[ix], squared[iy], squared[iz]
        radial_min = x2[0] + y2[0]
        if radial_min >= HALF or zeta2[0] >= HALF:
            exterior += 1
            continue
        rho = times[it], times[it + 1]
        sigma = zeta2[0], min(HALF, zeta2[1])
        lo, hi = normalized_q_interval(rho, sigma)
        radial_max = min(HALF, x2[1] + y2[1])
        x_bounds = radial_min / (2 * hi), radial_max / (2 * lo)
        # eta^2 = 1 - rho/Q. Since Q=rho+sigma*Q^(2h), the ratio sigma*Q^(2h)/rho
        # directly bounds eta^2 without subtracting two almost equal intervals.
        z_term_lo = sigma[0] * (1 - DELTA)
        z_term_hi = sigma[1] / (1 - DELTA)
        eta_squared = z_term_lo / (z_term_lo + rho[1]), z_term_hi / (z_term_hi + rho[0])
        require(eta_squared[1] < Fraction(9, 16), "physical eta leaves verified interval")
        cells[(ix, iy, iz, it)] = {
            "q_over_tau0": (lo, hi),
            "tau0_times_X": x_bounds,
            "eta_squared": eta_squared,
            "background": [background_order_status(n, rho, sigma, lo) for n in range(1, 4)],
            "correction": [correction_stage_status(j, lo) for j in range(1, 5)],
        }
    require(exterior + len(cells) == grid_count**3 * time_count, "incomplete cell partition")
    return cells, exterior


def table(grid_count, time_count, cells, exterior):
    background = [Counter(cell["background"][i] for cell in cells.values()) for i in range(3)]
    correction = [Counter(cell["correction"][i] for cell in cells.values()) for i in range(4)]
    return {
        "spatial_grid": grid_count,
        "temporal_cells": time_count,
        "all_cells": grid_count**3 * time_count,
        "exact_exterior_cells": exterior,
        "interior_or_crossing_cells": len(cells),
        "max_q_enclosure_width_over_tau0": str(max(hi - lo for lo, hi in
                                                (cell["q_over_tau0"] for cell in cells.values()))),
        "background_status_counts_n1_to_n3": background,
        "correction_status_counts_j1_to_j4": correction,
    }


def nesting(base, children, refine_space, refine_time):
    count = 0
    for key, child in children.items():
        parent_key = tuple(i // refine_space for i in key[:3]) + (key[3] // refine_time,)
        parent = base[parent_key]
        for field in ("q_over_tau0", "tau0_times_X", "eta_squared"):
            a, b = parent[field]
            lo, hi = child[field]
            require(a <= lo <= hi <= b, f"non-nested {field} at {key}")
        count += 1
    return count


def json_cells(cells):
    result = []
    for key, cell in cells.items():
        row = {"index": key}
        for label, values in cell.items():
            row[label] = [str(value) for value in values]
        result.append(row)
    return result


def build_report(repo):
    pins, criteria, prior_grid, scale_nodes, frontier = pinned_sources(repo)
    baseline, ext_base = evaluate_cells(8, 1)
    spatial, ext_space = evaluate_cells(16, 1)
    temporal, ext_time = evaluate_cells(8, 2)
    prior_active = {tuple(row["index"]) + (0,) for row in prior_grid["cells"]
                    if row["status"] == "MISSING_ACTUAL_FIELD_JETS"}
    require(prior_active == set(baseline), "baseline active cells differ from prior pinned grid")
    require(ext_base == prior_grid["exact_zero_cells"] == 320
            and len(baseline) == prior_grid["missing_field_cells"] == 192
            and ext_space == prior_grid["spatial_refinement"][1]["exact_zero_cells"] == 2656,
            "whole-K support counts differ")
    require(EXP_TAYLOR[5] > 64 and (1 << 4095) > (1 << 20), "positive scale bounds")
    require(Fraction(35, 72) < HALF and Fraction(7, 4)**2 > 3,
            "incompatible narrow source q window witness")
    space_nested = nesting(baseline, spatial, 2, 1)
    time_nested = nesting(baseline, temporal, 1, 2)
    return {
        "schema": "MathScope.OriginalWholeKChartCutoffSlab/1",
        "status": "CHART_AND_CUTOFF_SCOPE_REPLAYED",
        "source_commit": REVISION,
        "source_pins": pins,
        "criteria": criteria,
        "scope": "Original normalized whole-K localization slab 1/2 <= rho <= 1",
        "variables": {
            "rho": "tau/tau0 with tau=1-t and tau0=qBig/32",
            "zeta": "z/z0 with z0=tau0^(1/2-h)",
            "sigma": "zeta^2",
            "Q": "q/tau0",
            "chart_equation": "Q - sigma * Q^(2h) = rho",
            "bounds": ["1/2 <= Q < 2", "|eta| < 3/4", "q < qBig/16"],
            "log_power_parameter_error": str(DELTA),
            "space_measure": "z0 dx dy dzeta",
            "time_measure": "dt = -tau0 d rho, reversed time integration limits",
            "physical_q_t": "-1/(1-2h*eta^2)",
        },
        "background": {
            "selector_lower_bounds_b_n_times_qBig": ["1", "16", "32", "64"],
            "possibly_active_orders": [0, 1, 2, 3],
            "first_flat_zero_order": 4,
            "seam": "a cutoff argument equal to 1 has zero value and all derivatives zero",
        },
        "corrections": {
            "original_scale_nodes": scale_nodes,
            "recurrence": "L_0=log(1/qBig), L_j>=L_(j-1)+1, a_j=exp(L_j)",
            "strictly_zero_tail": "a_j*q >= exp(j)/64 > 1 for every j >= 5",
            "exp5_lower": str(EXP_TAYLOR[5]),
            "possibly_active_stages": [1, 2, 3, 4],
            "first_strictly_zero_stage": 5,
            "original_scale_norms_materialized": False,
        },
        "narrow_window_obstruction": {
            "source_width_ratio": "exp(1/2)",
            "active_points_same_rho": {"rho": "1/2", "zeta": ["0", "2/3"], "r": "0"},
            "q_ratio_strict_lower": "7/4",
            "bound": "exp(1/2) < sqrt(3) < 7/4",
            "conclusion": "The current single fixed-J q window cannot cover the whole original slab.",
        },
        "materialization_frontier": frontier,
        "refinement": [
            table(8, 1, baseline, ext_base),
            table(16, 1, spatial, ext_space),
            table(8, 2, temporal, ext_time),
        ],
        "refinement_nested_cell_checks": {"space_only": space_nested, "time_only": time_nested},
        "baseline_active_cell_enclosures": json_cells(baseline),
        "whole_K_field_or_energy_evaluated": False,
        "four_axis_final_field_comparison_evaluated": False,
        "last_resolved_tau": None,
        "remaining": {
            "N7-06": "Full source stage and coefficient roots plus actual cell field enclosures, then independently refined global energy, dissipation, work and force norm.",
            "N8-05": "Final-field spatial, Fourier, coefficient and precision refinements with uniform tails. Chart support work gives no final last-resolved tau.",
        },
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    report = build_report(args.repo)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: report[key] for key in ("status", "refinement", "refinement_nested_cell_checks")}, indent=2))


if __name__ == "__main__":
    main()
