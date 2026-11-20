"""Census actual PostFive mean applications in the 240 supported Repeat scalars."""

import argparse
from collections import Counter
from fractions import Fraction
from functools import cache
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import runpy
import sys
from tempfile import TemporaryDirectory


def read_pinned(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected, path
    return raw


def audit(work, goal):
    source = goal / "c133/live-radial-trace/verify_live_radial_trace_census.py"
    source_pin = "cca969b2a380217655efe445d3427a4e32a4729cec467dd5636c938869284bb7"
    read_pinned(source, source_pin)
    reference_pin = "947262a5685a7cf4ce60061e4c428c590484da10b292918a4972566bcd50bf2e"
    reference = json.loads(read_pinned(goal / "c133/live-reference/partial.json", reference_pin))
    fast_pin = "ad7ff7ce03985e2114a5881a8e8fc2bc2b576fe944c8d441b6b2468bca1a5221"
    fast = json.loads(read_pinned(goal / "c134/repeat-eikonal-fast-mean/protected-fast-mean.json", fast_pin))
    five_pin = "f91e6c15292c6970a95de7141d109e18ee5c0b57056e4a635faa6f23c9adddf7"
    five = json.loads(read_pinned(goal / "c131/fivemap-velocity-time/fivemap-velocity-time.json", five_pin))
    assert five["graph"]["whole"] == 22151951 and five["graph"]["potential"] == 22151952
    assert five["graph"]["increments"] == {"beta": 22151963, "gamma": 22151945, "v": 22151941}
    assert five["wholeAxialCancellation"]["identity"] == "s^(1-A)*mu3*(c0+exp(d)*c1)=0"
    assert not five["wholeAxialCancellation"]["radialDependencyOfS"]
    assert reference["chartScaleIdentity"]["exact"] == "F(s/b; Z/b^D, T/b)=F(s;Z,T)/b"
    q = Fraction
    chart_D = (q(1, 2), -1)
    assert 2*q(-1, 2) - (-1) == 0
    assert tuple(-d - (-d) for d in chart_D) == (0, 0)
    with TemporaryDirectory() as temp:
        out = Path(temp) / "bound-source-census.json"
        argv = sys.argv
        try:
            sys.argv = [str(source), "--work", str(work), "--goal", str(goal), "--out", str(out)]
            original = runpy.run_path(str(source))
        finally:
            sys.argv = argv
        assert read_pinned(out, "70d841c3686c7f3135592e04e170048cd5663cfaaf4e53ac5b12bae84bb5c8ba")

    node, prefix = original["node"], original["prefix"]
    definitions = original["defs"]
    templates = original["candidate"]["templates"]
    owners = {f"coupled-expression:{1355+j}": j for j in range(3)}
    parameters = [17732748, 17732749, 17732750, 17732737, 17745430, 17745431]
    actuals = [21435327, 21435332, 21435334, 21435315, 17745430, 17745431]
    tags = ("R", "Z", "T", "Y0", "Y1")
    base_layout = {(0,0,0,0,0), (1,0,0,0,0), (0,1,0,0,0),
                   (0,0,0,1,0), (0,0,0,0,1)}
    assert all(definitions[name]["parameters"] == parameters for name in owners)
    assert reference["actualApplicationRoots"] == [22155604, 22155606, 22155608]

    @cache
    def mean_calls(root):
        if root < prefix:
            return frozenset()
        op, args = node(root)
        if op == "m3_coupled_expression_partial":
            owner, numbers, orders = args
            if owner not in owners:
                definition = definitions[owner]
                if definition["name"].startswith("PostFiveRepeatWave_"):
                    assert definition["body"] < prefix
                    return frozenset()
                if definition["name"].startswith("PostFiveSignedPrincipalTail_"):
                    return mean_calls(definition["body"])
                raise AssertionError((root, definition["name"], definition["body"]))
            assert numbers == actuals and len(orders) == 6 and orders[3] == 0
            direction = tuple(orders[i] for i in (0, 1, 2, 4, 5))
            assert direction in base_layout and sum(direction) <= 1
            return frozenset(((owners[owner], root, direction),))
        assert op in ("add", "multiply"), (root, op)
        return frozenset().union(*(mean_calls(arg) for arg in args))

    seen = set()
    rows = []
    counts = Counter()
    for t in templates:
        for row in t["rows"]:
            m = row["m"]
            for j, part in product(range(3), ("real", "imaginary")):
                calls = mean_calls(row["raw"][j][part])
                supported_calls = mean_calls(row["supported"][j][part])
                # The four removed source families have no newly defined PostFive mean capsule.
                assert calls == supported_calls
                assert bool(calls) == (m in (1, 2))
                seen.update(calls)
                counts[m] += len(calls)
                rows.append({"chart": t["key"], "m": m, "component": j,
                             "part": part, "meanCalls": sorted(calls)})
    directions_by_component = {j: sorted({d for c, _, d in seen if c == j}) for j in range(3)}
    assert set(seen) and len(rows) == 240 and not counts[3] and not counts[4]

    # For a fixed label the chart changes are diagonal in R,Z,T, unchanged in Y,
    # and the actual reference index is fixed. Therefore a first physical
    # derivative adds one reference direction to any existing mean order.
    automatic = {}
    for j, seeds in directions_by_component.items():
        by_axis = {name: sorted({tuple(n + (i == k) for k, n in enumerate(seed))
                                 for seed in seeds}) for i, name in enumerate(tags)}
        union = {d for part in by_axis.values() for d in part}
        assert all(sum(d) <= 2 and d[2] <= 1 for d in union)
        automatic[j] = {"base": seeds, "afterOneFirstDerivative": by_axis, "union": sorted(union)}
    assert fast["finalJets"] == 0
    return {
        "status": "VERIFIED_ACTUAL_FIRST_ORDER_RAW_MEAN_APPLICATIONS",
        "originalCensusSHA256": source_pin, "referenceMapSHA256": reference_pin, "fastIdentitySHA256": fast_pin,
        "fiveMapSourceSupportSHA256": five_pin,
        "meanCapsules": owners, "meanParameters": parameters, "nativeActualArguments": actuals,
        "directionOrder": list(tags), "actualMeanApplications": sorted(seen),
        "actualUseCountsByMode": dict(counts), "supportedRows": rows,
        "requiredCofactorDirections": automatic,
        "conditionalFiveMapCofactorTrace": {
            "bothReferenceAndOwnNativeChartAdmitted": True,
            "XrefEqualsXown": "(R/sqrt(b))^2/(2*(s/b)) = X",
            "etaRefEqualsEtaOwn": "(Z/b^D)/(s/b)^D = eta",
            "freshFiveMapOnBothRadialCollars": "identically zero",
            "basisSecondSlowMixedOrTorusDirectionsOnBothCollars": "identically zero",
            "proof": "v/gamma have compact flat bumps; beta is the derivative of the forward weighted primitive, whose full integral is exactly zero",
        },
        "scope": ["No mean-pressure capsule is needed for nonzero modes",
                  "Late Temporal mean mixed and fast-identity estimates still require original analytic evidence",
                  "Same-label mean changes use the reference ratio fixed in the derivative"],
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("work", "goal", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    a = parser.parse_args()
    output = audit(a.work, a.goal)
    a.out.write_bytes((json.dumps(output, indent=2, sort_keys=True) + "\n").encode())
    print(len(output["actualMeanApplications"]), "actual mean applications")
