"""Bind the low mixed-time mean inputs to the original Temporal and compact FiveMap."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
from pathlib import Path
import json
import runpy

STAGE = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget")
PINS = {
    "primaryC7": "05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e",
    "initialized": "7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe",
    "preMean": "0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f",
    "mixedPrior": "c6f1aaf7d81c4810c5d72671357eacf7caf7f50904fe6e4a62582b6ee29f1cb8",
    "geometry": "84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e",
    "compactRecurrence": "32e360aa6f7449772151622bc6528681f013eba81cc39a0e7c8e70b529540554",
    "compactSource": "3f7477153115e9d5601626e8c37716a6b592523f6af8cbdc851095100c5fc102",
    "raw": "9cec4ad5ae9860a47d4d448cf2d3b0cdce3de697d77d42a805f51711cf20a028",
}


def checked(key, file):
    raw = file.read_bytes()
    assert sha256(raw).hexdigest() == PINS[key], (key, file)
    return raw


def data(key, file):
    return json.loads(checked(key, file))


def program(key, file):
    checked(key, file)
    return runpy.run_path(str(file))


def envelope(goal, primary_file):
    primary = data("primaryC7", primary_file)
    source = goal / STAGE
    initialized_dir = goal / "c103/initialized-mean"
    compact_dir = goal / "c102/mode-one-attachment"
    initialized = program("initialized", initialized_dir / "verify_initialized_mean.py")
    premean = program("preMean", source / "middle-premean-whole-path/verify_premean_whole_path.py")
    compact = program("compactRecurrence", compact_dir / "verify_mode_one_attachment.py")
    prior = data("mixedPrior", initialized_dir / "initialized-mean.json")
    old_src = data("raw", goal / "c105/forced-mode-one-high/mode-one-high-dependencies.json")
    geometry = data("geometry", compact_dir / "mode-one-attachment.json")["extendedCutoffGeometry"]
    five = data("compactSource", source / "after-temporal-five-map/after-temporal-five-map.json")
    names = initialized["NAMES"]
    assert prior["counts"]["oldWithSlowTime"] == 51
    assert geometry["order"] == 9
    assert primary["ordinaryDerivativeBudget"]["mixedDirections"] == 1080
    assert [r["slowOrder"] for r in primary["ordinaryDerivativeBudget"]["radialRows"]] == list(range(8))
    assert primary["coefficientBudget"]["wholePathCovarianceLogCap"] == "H/2^113"

    # Each exact C94 mean or increment factor in the grouped forcing carries
    # at most one original R/Z/L derivative prior to taking the new jet.
    # Allow all distributions of the incoming R/Z/L order <= 2, and T <= 1.
    # The low Signed seed needs second-T means including the beta_ZTT term.
    first = {(m, (r, z, t, l)) for m in names
             for r, z, l in product(range(4), repeat=3) if r + z + l <= 3
             for t in (0, 1)}
    second = {(m, (r, z, 2, l)) for m in names
              for r, z, l in product(range(2), repeat=3) if r + z + l <= 1}
    assert (len(first), len(second)) == (120, 12)
    for role, i, (r, z, l) in old_src["meanDemands"]:
        assert role in {"mean", "increment"}
        if r + z + l <= 3:
            assert (names[i], (r, z, 1, l)) in first
    assert ("beta", (0, 1, 2, 0)) in second
    queries = sorted(first | second)
    fn, (cov, shifted, cutoff, inverse) = initialized["whole_recipe"](premean)
    direct = [(m, a, fn(m, a)) for m, a in queries]
    assert len(direct) == 132
    prior_by = {(m, tuple(a)): r for m, a, r in prior["directTemporal"]}
    common_rows = [(m, a) for m, a, r in direct if (m, a) in prior_by]
    assert all(r == prior_by[(m, a)] for m, a, r in direct if (m, a) in prior_by)

    moments, linear, products = initialized["compact_demand"](queries)
    rows = []
    for moment, a, f, b, g, c, extra_z, coefficient in products:
        u, v = fn(f, b), fn(g, c)
        grade = Q(u["minEpsilon"]) + Q(v["minEpsilon"]) + extra_z
        surplus = Q(u["bandIntercept"]) + Q(v["bandIntercept"]) + 3*extra_z - Q(1, 2)
        rows.append((moment, a, f, b, g, c, extra_z, coefficient, str(grade), str(surplus)))
    required = sorted(cov | linear)
    high = {(m, a) for m, a in required if sum(a[:3]) > 7 or a[3] > 8}
    assert high == {("W_rz", (0, 7, 1, l)) for l in (0, 2)}
    high_donors = [r for r in prior["additionalHighRows"]
                   if (r["component"], tuple(r["RZTL"])) in high]
    assert {(r["component"], tuple(r["RZTL"])) for r in high_donors} == high
    assert not high & linear
    assert max(map(sum, cutoff)) <= geometry["order"]
    assert {m: max(map(sum, vals)) for m, vals in moments.items()} == {"P":4,"Jz":4,"Jtheta":5}
    positive_time_moments = {m: sum(t > 0 for _, t in vals) for m, vals in moments.items()}
    primary_rank = sum(primary["coefficientBudget"]["commonGlobalCovarianceRanks"])
    high_rank = max(sum(r["logDegreeRanks"]) for r in high_donors)
    cap = compact["compact_budget"]({
        "fiveMap": five,
        "crop": {"gradeAbsorption": {
            "minimumQuadraticEpsilonByMoment": {
                m: str(min(Q(x[-2]) for x in rows if x[0] == m)) for m in moments},
            "maximumQuadraticBandSurplusBeforeAbsorption": {
                m: str(max(Q(x[-1]) for x in rows if x[0] == m)) for m in moments},
        }},
    }, primary_rank, max(primary_rank, high_rank), geometry)
    assert cap["compactZeroOnBothSourceCollars"] and cap["motionOfSRetained"]
    assert cap["compactChargeInHOver2Pow128"] < 2**16
    # Restore one full annular Gaussian on compact support using its
    # original u>128,d>3. e < 4 adds two bits to the live coefficient.
    assert Q(1, 128)**2 + Q(4, 9) < 1
    report = {
        "schema": "MathScope.C116.OriginalLowMixedTimeMeanOperands/1",
        "formalStatus": "VERIFIED_SOURCE_RECURRENCE_CONDITIONAL_ON_C98_C103_ALL_PATH_COVARIANCE",
        "pins": PINS,
        "forcedMeanQueries": len(first),
        "extraSecondTimeQueries": len(second),
        "reproducedEarlierDirections": common_rows,
        "temporalMeanRows": direct,
        "requiredCovariance": required,
        "unchangedC103HighCovarianceDonors": high_donors,
        "shiftedIntegrals": len(shifted),
        "cutoffRoles": sorted(cutoff),
        "fourierInverseRoles": len(inverse),
        "compactMomentZT": {m: sorted(vals) for m, vals in moments.items()},
        "positiveTimeMomentCounts": positive_time_moments,
        "compactDirectPrimaryCovariance": sorted(linear),
        "compactWholeRadialFixedMomentBranches": rows,
        "compactProfile": cap,
        "compactConditionalGaussianLogCharge": cap["compactChargeInHOver2Pow128"] + 2,
        "frontier": ["Apply the noncompact signed collar integral estimates to the same low mixed-time operands.",
                     "Join the new mean bounds to the actual complete forced and Signed source."],
        "finalJets": 0, "release": "HOLD",
    }
    print("PASS conditional original mixed-time mean operand recipe", len(direct), len(required),
          len(rows), positive_time_moments, cap["compactChargeInHOver2Pow128"])
    return report


if __name__ == "__main__":
    cli = ArgumentParser(description=__doc__)
    for name in ("goal", "primary", "out"):
        cli.add_argument("--" + name, type=Path, required=True)
    args = cli.parse_args()
    receipt = envelope(args.goal, args.primary)
    args.out.write_bytes((json.dumps(receipt, indent=2) + "\n").encode())
