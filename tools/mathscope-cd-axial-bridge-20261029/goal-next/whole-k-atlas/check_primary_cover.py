"""Bind the original Primary potential certificates to the physical reference windows."""

from argparse import ArgumentParser
from contextlib import ExitStack
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent / "diagonal-n2"))
from compare_selector_exports import Compare, Difference, Export, shared_registry_prefix


PINS = {
    3: (
        "f59857c4616e90727e64d9aa77b8ee8a51082274c16cff53098ea7f5db5f511c",
        "c98ff451947397d01dccf53d33a9987ec5f732dd40583f1f48caa5687788ae62",
        "14cd0804d7b45b7c2faece1cf044895d771dc7028e6969a284bbca2aad18c050",
    ),
    4: (
        "ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd",
        "2e3d0f1e6ddf359e75ae724cadb0918c2693eecffdca5e2d53082450b815c28a",
        "4fd10ba364416e06a4f9cebe4b50739da9f558537ea0415964bbefe178f1d6ca",
    ),
}
SCALE_SHA = "5a6ecee45d797d582e3218c36f980d5eb131619c860cec1bfb4d57aea89cdf56"


def pinned(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected, path
    return json.loads(raw)


def check(n, diagonal_path, primary_path):
    with ExitStack() as stack:
        diagonal, primary = (Export(path, stack) for path in (diagonal_path, primary_path))
        diagonal_sha, primary_sha, readback_sha = PINS[n]
        assert diagonal.manifest["node_stream_sha256"] == diagonal_sha
        assert primary.manifest["node_stream_sha256"] == primary_sha
        readback = pinned(primary_path / "primary-C3-independent-readback.json", readback_sha)
        assert readback["prefix"] == n and readback["actualFinalJets"] == 0
        assert readback["currentGraphSHA256"] == primary_sha
        assert readback["status"] == "VERIFIED_ORIGINAL_PRIMARY_POTENTIAL_C3_ON_ADMITTED_PREFIX"
        assert readback["nativePrimaryClassOrder"] == 2
        assert (readback["potentialOrderThree"]["power"],readback["potentialOrderThree"]["pole"]) == (1283,18)
        shared, early = shared_registry_prefix(diagonal, primary)
        matcher = Compare(diagonal, primary, shared)
        old_window, window = diagonal.selector["window"], primary.selector["window"]
        selected = []
        try:
            for order in range(n, n + 2):
                left = diagonal.selector["rows"][order - 1]
                right = primary.selector["rows"][order - 1]
                assert left["order"] == right["order"] == order
                for kind in ("logScale", "scale"):
                    matcher.compare(left[kind], right[kind])
                selected.append([order, left["scale"], right["scale"]])
            for name in ("commonEll0", "commonEllMinimum"):
                matcher.compare(diagonal.selector[name], primary.selector[name])
            assert window == primary.receipt["primaryC3Result"]["referenceWindow"]
            for name in ("lower", "upper", "nextSourceScale", "nextSourceLogScale"):
                matcher.compare(old_window[name], window[name])
            matcher.compare(old_window["Q"], window["Q"], ((old_window["ell"], window["ell"]),))
        except Difference as exc:
            raise RuntimeError((n, exc.reason, exc.frames)) from None
        next_row = primary.selector["rows"][n]
        active = primary.selector["rows"][n - 1]
        assert primary.node(127) == ("log_positive", [24])
        assert primary.node(24) == ("rational", ["2", "1"])
        assert primary.node(next_row["growth"]) == ("add", [127, active["logScale"]])
        op, choices = primary.node(next_row["logScale"])
        assert op == "maximum" and next_row["growth"] in choices
        assert primary.node(next_row["scale"]) == ("exp", [next_row["logScale"]])
        assert window["nextSourceScale"] == next_row["scale"]
        assert window["domain"]["qOverQ"] == ["1/2","2"]
        return {
            "prefix": n, "diagonalGraph": diagonal_sha, "primaryGraph": primary_sha,
            "literalCommonPrefixRecords": shared, "earlyNativeDefinitions": early,
            "sameSelectorRoots": selected, "sameWindowRoots": {
                key: [old_window[key], window[key]] for key in ("lower", "upper", "Q")
            }, "nativeNextGrowthRoot": next_row["growth"],
        }


def compare_common_diagonal_scales(n3, n4):
    with ExitStack() as stack:
        left, right = (Export(path, stack) for path in (n3, n4))
        shared, _ = shared_registry_prefix(left, right)
        matcher = Compare(left, right, shared)
        rows = []
        try:
            matcher.compare(left.selector["commonEllMinimum"], right.selector["commonEllMinimum"])
            for n in (3,4):
                old, new = (graph.selector["rows"][n-1] for graph in (left,right))
                for name in ("logScale", "scale"):
                    matcher.compare(old[name],new[name])
                rows.append([n,old["scale"],new["scale"]])
        except Difference as exc:
            raise RuntimeError((exc.reason, exc.frames)) from None
        return rows


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("diagonal3","diagonal4","primary3","primary4","fourth","out"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    sys.setrecursionlimit(8000)
    scale = pinned(args.fourth, SCALE_SHA)
    assert scale["exactRatios"] == {"b1*qBig":1,"b2*qBig":16,"b3*qBig":32,"b4*qBig":64}
    rows = [check(3,args.diagonal3,args.primary3),check(4,args.diagonal4,args.primary4)]
    common_scales = compare_common_diagonal_scales(args.diagonal3,args.diagonal4)
    low, mid, high = Fraction(1,64), Fraction(1,32), Fraction(1,16)
    assert low*64 == mid*32 == 1
    assert mid*64 == high*32 == 2
    assert low*128 == mid*64 == 2
    assert 1 - Fraction(54,22**6) > Fraction(1,2)
    data = {
        "status": "SOURCE_BOUND_TWO_REFERENCE_WINDOWS_WITH_FROZEN_TAIL_MARGIN",
        "scaleReceiptSHA256": SCALE_SHA, "rows": rows, "commonDiagonalScales": common_scales,
        "physicalSlab": {
            "N4": {"qOverQBig": ["1/64","1/32"], "referenceEll": "ellMinimum+16", "s": "[1,2]", "omittedTimesQ": ">=2"},
            "N3": {"qOverQBig": ["1/32","1/16"], "referenceEll": "ellMinimum+15", "s": "[1,2)", "omittedTimesQ": ">=2"},
        },
        "frozenRepresentative": "Under the original active box guard, |srep-s'|<=27/ell'^6 and s'>1/2 imply qrep/q>1/2. The first omitted scale times qrep is strictly greater than one.",
        "scope": "Reference and first-omitted cutoff membership for the authenticated original potential certificates. Active chart and seam hypotheses, numerical FTC values, correction stages and final jets remain separate.",
    }
    raw = (json.dumps(data,indent=2) + "\n").encode()
    args.out.write_bytes(raw)
    print("PASS two exact physical reference windows and fixed-representative cutoff margins",sha256(raw).hexdigest())


if __name__ == "__main__":
    main()
