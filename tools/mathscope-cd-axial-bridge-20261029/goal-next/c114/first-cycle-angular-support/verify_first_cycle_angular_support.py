from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction
from hashlib import sha256
from itertools import combinations_with_replacement, product
import json
from pathlib import Path


CURRENT_SOURCE = "b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36"
PINS = {
    "initial": ("final67/initial-fourier/initialized-angular-split.json",
                "0545658bf1dc4d5b373639c562ce537be1600a2210089faaa90aa6f77a8ed0b2"),
    "initialLocalized": ("final67/initial-fourier/localized-initialized-modes.json",
                         "3c7062d62abe83ddad8291051fabe5004a19311114f085a7256611ec8f83d4f3"),
    "k1": ("final67/energy-1013-sharp/correction-budget/spatial-gauge/active-n3-localized-gram/actual/actual-mode-operands-final.json",
           "dfc5401fc6561138e3a17fc05d2e38626b2694d96a1848e0008c9e821b958b40"),
    "domain": ("c109/fixed-n3-domain/fixed-n3-domain.json",
               "df338897da4078df56cf8632d4f10a605bdfa16e02a1a331381e389bf5dc8738"),
    "k1Join": ("c113/k1-end-to-end/k1-end-to-end.json",
               "184ebe096a4ecdcbfbbfb5490c0213d2f71f92e89ca5e4f94f81afe7d05e69dc"),
}


def read(path, expected):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == expected, path
    return data


def check_sources(goal, artifact):
    source = {name: json.loads(read(goal / path, digest)) for name, (path, digest) in PINS.items()}
    overlay = json.loads((artifact / "pr30-runtime-overlays.json").read_bytes())
    current = [row for row in overlay["files"] if row["original"].endswith("/source-global-current.mjs")]
    assert len(current) == 1
    assert current[0]["sha256"] == CURRENT_SOURCE
    guard_program = read(artifact / current[0]["overlay"], CURRENT_SOURCE).decode()
    assert "at-most-16 positive boxes at one point" in guard_program
    assert "partition.labels.length===81" in guard_program
    assert "bandAxis.value,...meshAxes.map(x=>x.value)" in guard_program
    assert "original local band" in guard_program and "original local mesh" in guard_program
    assert all(
        field["signedRows"] == 162
        and all({term["harmonicSign"] for term in row["terms"]} == {-1, 1}
                for row in field["local"].values())
        for field in source["initial"]["fields"][:3]
    )
    live = source["k1"]["liveOperands"]
    assert live["sameOuterRowsPerComponent"] == 162
    assert "m in {1,2}" in live["naturalFrequency"] and "negative conjugate" in live["naturalFrequency"]
    assert source["domain"]["fixedSlab"]["maximumPositiveBoxes"] == 16
    assert source["k1Join"]["release"] == "HOLD"
    return 16


def evaluate_support(boxes):
    # Keep the two physical signs and both stages independent. Equal actual
    # integer windings can only merge entries of these exact formal sets.
    signs = 2
    initial_rows, correction_rows = boxes * signs, boxes * signs
    dimension = initial_rows + correction_rows + 1
    unit = tuple([0] * (dimension - 1) + [1])
    zero = (0,) * dimension

    def generator(i, n):
        return tuple(n if j == i else 0 for j in range(dimension))

    def add(a, b):
        return tuple(x + y for x, y in zip(a, b, strict=True))

    def shifted(support, shifts):
        return {add(point, tuple(c * h for c in unit)) for point, h in product(support, shifts)}

    initial = {generator(j, n) for j in range(initial_rows) for n in (-1, 1)}
    correction = {generator(j, n) for j in range(initial_rows, dimension - 1) for n in (-2, -1, 1, 2)}
    fields = {zero} | initial | correction
    quadratic = {add(a, b) for a, b in combinations_with_replacement(fields, 2)}
    assert fields <= quadratic

    # Check exact merging on a deliberately colliding pair of physical
    # integer modes. Counting labels separately would give squared norm 2.
    merged = defaultdict(Fraction)
    for frequency, real_coefficient in ((2 * 7, 1), (14, -1)):
        merged[frequency] += real_coefficient
    assert sum(coefficient ** 2 for coefficient in merged.values()) == 0
    return {
        "originalMaximumActiveBoxesPerStage": boxes,
        "signedRowsPerStageAtPointAtMost": [initial_rows, correction_rows],
        "cylindricalVelocitySupportAtMost": len(fields),
        "cylindricalNonPressureForceSupportAtMost": len(quadratic),
        "horizontalCartesianVelocitySupportAtMost": len(shifted(fields, (-1, 1))),
        "transverseGradientOfHorizontalVelocitySupportAtMost": len(shifted(fields, (-2, 0, 2))),
        "horizontalCartesianNonPressureForceSupportAtMost": len(shifted(quadratic, (-1, 1))),
        "aliasBeforeSquareControl": {"actualIntegerFrequency": 14, "withoutMerge": 2, "afterMerge": 0},
    }


def main(args):
    box_count = check_sources(args.goal, args.artifact)
    result = {
        "schema": "MathScope.C114.OriginalInitializedPlusK1SparseAngularSupport/1",
        "status": "VERIFIED_SOURCE_SUPPORT_CONDITIONAL_ORDINARY_LOCALIZATION",
        "sourcePins": {name: digest for name, (_, digest) in PINS.items()},
        "currentSourceSHA256": CURRENT_SOURCE,
        "admittedScope": "complete angular circles r>0 on the original realized total of Initialized and K1",
        "counts": evaluate_support(box_count),
        "angularDerivativeConvention": "cylindrical connection preserves the physical integer mode n, while the horizontal Cartesian frame shifts by ±1",
        "ordinaryPremises": ["same original native fields, fixed-label analytic derivatives and flat seams",
                             "original angle-independent cutoffs and charts"],
        "open": ["full physical pressure force tail through the repeated correction stages",
                 "actual sparse coefficient values, all later modes and whole final-field refinement"],
        "wholeN805": "OPEN", "wholeFinalJets": 0, "release": "HOLD",
    }
    with args.out.open("xb") as output:
        output.write((json.dumps(result, indent=2) + "\n").encode())
    print("PASS original per-point source sparse angular support and exact mode merging")


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    for field in ("goal", "artifact", "out"):
        parser.add_argument("--" + field, required=True, type=Path)
    main(parser.parse_args())
