"""Check original signed-row guards, Repeat cutoff attachments, and palette separation counts."""

import argparse
from collections import Counter
import hashlib
from itertools import combinations, product
import json
from pathlib import Path


GOAL = Path("work/goal-next")
RUNTIME = GOAL / "continuation66/stage2/runtime-exact/research-ide"
HOSTED = GOAL / "continuation132/hosted-44682703381"
CANDIDATE = HOSTED / "active-n3-repeat-forced-candidate.json"
FUNCTIONS = HOSTED / "active-n3-repeat-forced-source/original-source-functions.json"
READBACK = GOAL / "continuation132/active-repeat-source/active-readback.json"
REPEAT_PRODUCER_HASH = "4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7"
PINS = {
    CANDIDATE: "b9c43c30c8782034650ba432ff20d3e7a258bb752f81e2fa0bf3a7211621430e",
    FUNCTIONS: "62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce",
    READBACK: "49c39b69df109650688cb21e8331fe53ffc65da1e8f899d1fa97c61a67cce2c4",
    GOAL / "continuation135/indexed-registration/build_repeat_indexed_increments.mjs":
        "2fd4786663f5f745b1c991798f72c86cb1e6b9a0d9bb460e7e8a014476911827",
    GOAL / "continuation138/fast-corners/MANIFEST.json":
        "0c2118039fc25b2770b3698af37d6560d7b3843f7c12c14dded110e18a976238",
    GOAL / "continuation137/actual-radial-c1/MANIFEST.json":
        "8cb111e3ffbb6c0111a3303c5820a88afb11531d472bc6b84982c3bf53f83f13",
    RUNTIME / "mathscope-m2/navier/source-support.mjs":
        "3cc1397c28894bcabc8f78705b1774e5785f75c6317f4c5d9af56a6ccea66ed9",
    RUNTIME / "mathscope-m2/navier/actual-covariance-source-certificate.mjs":
        "c5b619ac5b4377c93daefefc65f6ddc4336a7ffac3a9118981a32969890a0681",
    RUNTIME / "mathscope-m2/navier/actual-covariance-global-assembly.mjs":
        "bd0f09f78a2f93cad9fdb679ba25509ecb2891ba86eee1bc3e57df6da74e37cc",
    RUNTIME / "mathscope-m3/navier/source-global-forced-current.mjs":
        "1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3",
    RUNTIME / "mathscope-m3/post-signed-20261023/source-postfive-repeat-forced.mjs":
        REPEAT_PRODUCER_HASH,
    RUNTIME / "mathscope-m3/navier/source-global-band.mjs":
        "a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b",
    RUNTIME / "mathscope-m3/navier/source-mapped-forced-curl.mjs":
        "3764b705d26c3333578db9fbc15004779d825026d2a487d3809320fd41cb62bd",
    RUNTIME / "mathscope-m3/navier/source-forced-pulse.mjs":
        "866d8ec69758b9f036b73e6e8f04fb88cfb248e7a01d32e7b048df535c1020f9",
    RUNTIME / "mathscope-m3/navier/source-global-pressure.mjs":
        "c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4",
    RUNTIME / "mathscope-m3/navier/source-initialized-angular.mjs":
        "4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e",
}
FORCED_FAMILIES = ["first-forced-remaining-source", "first-forced-cutoff-derivative"]
PRINCIPAL_FAMILIES = ["primary-cutoff-derivative", "signed-cutoff-derivative"]
HARMONIC_FAMILIES = {1: FORCED_FAMILIES + PRINCIPAL_FAMILIES, 2: FORCED_FAMILIES, 3: [], 4: []}
PARTS = ("real", "imaginary")
J = ((3, 1), (1, 5))
IDENTITY = ((1, 0), (0, 1))
MODULUS = 1 << 20
PALETTE = 2250
R0_DENOMINATOR = (1 << 14) * MODULUS


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def matrix_product(left, right):
    return tuple(tuple(sum(row[j] * right[j][i] for j in range(2)) for i in range(2)) for row in left)


def parse_row(row):
    label = row["label"]
    return (*map(int, label["key"].split(":")), label["sign"])


def original_row_inventory(candidate, registry):
    coupled_fields = {row["id"]: row for row in json.loads(registry["definitions"])[1]}
    ids = [field["field"] for field in candidate["fields"]]
    assert ids == [f"coupled-field:{index}" for index in (9, 10, 11, 12, 16, 17, 18, 19)]
    assert not any("RepeatIncrement" in row["name"] for row in coupled_fields.values())
    old = coupled_fields[ids[0]]
    labels = [parse_row(row) for row in old["rows"]]
    keys = ("values", "guards", "derivativeMaps", "coefficient", "label")
    row_binding = [[row[key] for key in keys] for row in old["rows"]]
    assert len(old["parameters"]) == 7
    assert len(old["directions"]) == 6
    assert len(labels) == 162
    assert set(labels) == {(*offsets, sign) for offsets in product((-1, 0, 1), repeat=4) for sign in (-1, 1)}
    for field_id in ids:
        field = coupled_fields[field_id]
        assert field["parameters"] == old["parameters"]
        assert field["directions"] == old["directions"]
        assert [[row[key] for key in keys] for row in field["rows"]] == row_binding
    for row in old["rows"]:
        assert len(row["values"]) == 16
        assert len(row["derivativeMaps"]) == 6
        assert len(row["guards"]) == 5
        assert row["guards"][0] == [17732770, 3617, 28826]
        assert all(guard[1:] == [17735192, 120836] for guard in row["guards"][1:])
        assert row["label"]["countBoxOnce"]
    return ids, labels


def repeat_inventory(candidate, proof, registry):
    templates = {(t["difference"], t["sign"]): t for t in candidate["templates"]}
    assert set(templates) == set(product(range(5), (-1, 1)))
    all_jets = set()
    family_counts = Counter()
    family_literal_zeros = Counter()
    per_chart_cutoff = {}
    raw_checks = 0
    pulse_registry = json.loads(registry["definitions"])[3]
    assert len(pulse_registry) == 60
    assert pulse_registry[20]["name"].startswith("ActualPostFiveRepeatForced_")

    for template in templates.values():
        key = template["key"]
        rows = template["rows"]
        assert [row["m"] for row in rows] == [1, 2, 3, 4]
        support = template["rawSupport"]
        assert support["wholeMeanCoefficientKept"] and support["sourcePressureWaveJetsKept"]
        assert support["originalSupportAndFlatnessStillRequiresAuthentication"]
        assert not support["sourceAuthenticated"]
        systems = set(support["waveSystems"])
        assert len(systems) == 16
        assert not all_jets & systems
        all_jets |= systems
        expected = {z[part] for row in rows for z in row["raw"] for part in PARTS}
        assert {check["source"] for check in support["checks"]} == expected
        assert len(support["checks"]) == 24
        raw_checks += len(support["checks"])
        assert all(row["pass"] and row["reduced"] == 0 for row in support["checks"])
        for row in rows:
            assert [term["family"] for term in row["terms"]] == HARMONIC_FAMILIES[row["m"]]
            for term in row["terms"]:
                assert len(term["value"]) == 3
                family = term["family"]
                for z in term["value"]:
                    for part in PARTS:
                        family_counts[family] += 1
                        if z[part] == 0:
                            family_literal_zeros[family] += 1
        chart_guard = proof["mechanics"]["guardTriplesByChart"][key]
        assert len(chart_guard) == 7
        assert chart_guard[4] == [17732770, 3617, 28826]
        assert all(guard[1:] == [17735192, 120836] for guard in chart_guard[:4])
        assert chart_guard[5][1:] == [17733047, 14220486]
        assert chart_guard[6][1:] == [0, 17733029]

    pulse_ids = set()
    chart_modes = set()
    for system in candidate["systems"]:
        chart, mode = system["key"], system["m"]
        assert (chart, mode) not in chart_modes
        chart_modes.add((chart, mode))
        assert system["positive"]["m"] == mode and system["negative"]["m"] == -mode
        assert system["system"] not in pulse_ids
        pulse_ids.add(system["system"])
        assert pulse_registry[system["system"]]["name"] == f"ActualPostFiveRepeatForced_{chart}_m{mode}"
        cutoff = system["mappedCutoff"]
        assert system["positive"]["pressure"] == cutoff["pressure"]
        pair = [cutoff["psi"], cutoff["dpsi"]]
        assert per_chart_cutoff.setdefault(chart, pair) == pair

    assert pulse_ids == set(range(20, 60))
    assert chart_modes == {(t["key"], m) for t in templates.values() for m in range(1, 5)}
    assert raw_checks == 240 and len(all_jets) == 160
    return raw_checks, family_counts, family_literal_zeros, per_chart_cutoff


def separation_counts(labels):
    cases = Counter()
    for left, right in combinations(labels, 2):
        b1, *m1, sign1 = left
        b2, *m2, sign2 = right
        gap = abs(b1 - b2)
        if gap >= 2:
            cases["bandGuardsDisjoint"] += 1
        elif gap == 1:
            # Across bands the mesh is rescaled. Count every adjacent-band pair
            # as potentially overlapping and use the uniform palette proof.
            assert b1 % 9 != b2 % 9
            cases["adjacentBandRequiresPalette"] += 1
        elif any(abs(a - b) >= 2 for a, b in zip(m1, m2, strict=True)):
            cases["sameBandMeshGuardsDisjoint"] += 1
        elif m1 != m2:
            assert [x % 5 for x in m1] != [x % 5 for x in m2]
            cases["sameBandDistinctBoxRequiresPalette"] += 1
        else:
            assert sign1 != sign2
            cases["sameBoxOppositeSignsRequiresPalette"] += 1
    assert cases == {
        "bandGuardsDisjoint": 2916,
        "sameBandMeshGuardsDisjoint": 2316,
        "adjacentBandRequiresPalette": 5832,
        "sameBandDistinctBoxRequiresPalette": 1896,
        "sameBoxOppositeSignsRequiresPalette": 81,
    }
    return cases


def exact_palette():
    powers = [IDENTITY]
    for _ in range(4):
        powers.append(matrix_product(powers[-1], J))
    row_norm = max(map(sum, powers[-1]))
    perturbation_numerator = 3 * (row_norm + 1)
    assert perturbation_numerator * MODULUS < R0_DENOMINATOR
    minima = []
    for matrix in powers[1:]:
        residues = [(matrix[1][0] * center) % MODULUS for center in range(1, PALETTE + 1)]
        minima.append(min(min(residue, MODULUS - residue) for residue in residues))
    assert minima == [1, 8, 50, 288]
    return {
        "matrixPowers": powers,
        "verticalSeparationNumerators": minima,
        "separationDenominator": MODULUS,
        "enlargedRectanglePerturbationNumerator": perturbation_numerator,
        "enlargedRectanglePerturbationDenominator": R0_DENOMINATOR,
        "strictRemainingGapNumerator": (1 << 14) - perturbation_numerator,
        "strictRemainingGapDenominator": R0_DENOMINATOR,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    args = parser.parse_args()
    for path, expected in PINS.items():
        assert hashlib.sha256((args.root / path).read_bytes()).hexdigest() == expected, path
    candidate = load(args.root / CANDIDATE)
    proof = load(args.root / READBACK)
    registry = load(args.root / FUNCTIONS)
    assert candidate["sourceModuleSHA256"] == REPEAT_PRODUCER_HASH
    original_ids, labels = original_row_inventory(candidate, registry)
    raw_checks, family_sizes, family_zeros, cutoff_ids = repeat_inventory(candidate, proof, registry)
    cases = separation_counts(labels)
    cases_sum = sum(cases.values())
    result = {
        "originalIndexedFieldIds": original_ids,
        "originalSignedRows": len(labels),
        "differentSignedRowPairs": {
            "unordered": cases_sum,
            "ordered": 2 * cases_sum,
            "cases": cases,
            "conservativePotentialSlowOverlapUnordered": sum(
                count for case, count in cases.items() if case.endswith("RequiresPalette")
            ),
        },
        "rawIdealScalarChecks": raw_checks,
        "subtractionFamilyScalars": family_sizes,
        "subtractionFamilyLiteralZeroScalars": family_zeros,
        "mappedCutoffAndDerivativeIdByChart": cutoff_ids,
        "palette": exact_palette(),
        "status": {
            "candidateInventoryAndPairArithmetic": "VERIFIED",
            "mappedDerivativeSupport": "CONDITIONAL_ON_ORIGINAL_ADMISSION_AND_REGULARITY",
            "newLiveIndexedRegistrationCheckedInThisPacket": False,
            "unclippedGlobalSecondCorrectionProved": False,
            "release": "HOLD",
        },
    }
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
