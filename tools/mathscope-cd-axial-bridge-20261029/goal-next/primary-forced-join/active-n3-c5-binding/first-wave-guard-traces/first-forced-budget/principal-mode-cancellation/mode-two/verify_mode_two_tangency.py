"""Replay tangential carrier cancellation in all original first Forced +2 rows."""

import argparse
from collections import Counter, defaultdict
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


PINS = {
    "source": "dc39e6b516bb4f6dd5ee8b639c8f78c1c034684a5ab58cfa03144eca97bc894d",
    "geometry": "e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291",
    "primary": "a72f12c82dd35106862cf6a874be1af79502a99d6de0e37e06db8794b66e5244",
    "weights": "836e8ed0b22ee3451f9ed3f09f176bf439fc05b5f9380fa58b08a3ba841efcc0",
    "scalar": "0d1e6635208ef369741a7073067b69e467608114495c03bb22c3575715d01873",
    "registry": "e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03",
}
CARRIER_ROLES = ("twiceKNormalR", "twiceKNormalTheta", "twiceKNormalZ")
PARTS = ("real", "imaginary")


def read_pinned(path, key):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[key], path
    return json.loads(raw)


def term_key(*roots):
    return tuple(sorted(Counter(roots).items()))


def compact(polynomial):
    return {term: value for term, value in polynomial.items() if value}


def expected_carrier(carriers, slots, component, part, tangential=False):
    result = defaultdict(int)
    for i, normal in enumerate(carriers):
        real_i, imag_i = slots[i]
        real_j, imag_j = slots[component]
        if part == "real":
            if not tangential:
                result[term_key(normal, real_i, imag_j)] -= 1
            result[term_key(normal, imag_i, real_j)] -= 1
        else:
            if not tangential:
                result[term_key(normal, real_i, real_j)] += 1
            result[term_key(normal, imag_i, imag_j)] -= 1
    return compact(result)


def replay(data):
    source, geo, primary = (data[key] for key in ("source", "geometry", "primary"))
    assert source["sourceStream"]["nodes"] == geo["sourceStream"]["nodes"] == 22155584
    by_id = {row["id"]: row for row in json.loads(data["registry"]["definitions"])[0]}
    chart_overlays = {row["key"]: row for row in primary["exactSameBody"]["tenCharts"]}
    case_geometries = {row["chart"]: row for row in geo["chartRows"] if row["mode"] == 2}
    assert all(row["realCurlReducesToHalfAmplitudeOnPositiveFrameDomain"]
               for row in primary["exactSameBody"]["families"].values())
    geometry_grades = {}
    for role, table in geo["conditionalCoefficientCaps"]["actualCoefficientProfiles"].items():
        geometry_grades[role] = min(Fraction(epsilon) - Fraction(carrier) / 2
                                    for order in table["envelopesBySlowOrder"]
                                    for _, epsilon, carrier, _ in order)
    velocity = primary["weightedQuotientLedger"]["bounds"]
    grade = {
        part: min(Fraction(row["epsilonPower"]) + Fraction(row["inverseCarrierPower"], 2)
                  for row in velocity if row["role"].startswith(f"velocity{part.capitalize()}"))
        for part in PARTS
    }
    assert grade == {"real": Fraction(1, 2), "imaginary": Fraction(99999, 100000)}
    charts = []
    counts = Counter()
    worst = defaultdict(list)
    for case in source["cases"]:
        if case["mode"] != 2:
            continue
        key = case["chart"]
        g = case_geometries[key]
        assert case["system"] == g["sourceSystem"]
        assert case["powerRemainingAfterDivisionByP"] == 1
        assert g["torusDirectionLDoesNotDifferentiateCollapsedCoefficients"]
        roles = {int(node): role for node, role in g["matchedOpaqueFactors"].items()}
        assert len(roles) == len(set(roles.values())) == 7
        carriers = tuple(next(node for node, role in roles.items() if role == wanted)
                         for wanted in CARRIER_ROLES)
        overlay = chart_overlays[key]
        assert str(overlay["sign"]) in primary["exactSameBody"]["families"]
        bindings = overlay["completeSameBodyBindings"]
        field_atoms = {}
        slots = [[None] * 2 for _ in range(3)]
        args = None
        for atom in case["rawJetAtoms"]:
            definition = by_id[atom["nativeDefinition"]]
            name = definition["name"]
            assert atom["role"] == "u" and atom["factorDegree"] == 1
            assert name.startswith(f"InitializedOriginalWave_{key.replace(':', '_')}_")
            assert definition["body"] == bindings[name]
            assert len(atom["orders"]) == len(atom["arguments"]) == len(definition["parameters"])
            component, part = name.rsplit("_", 2)[-2:]
            field_atoms[atom["root"]] = part
            pulled = atom["applicationPointAfterPullback"]
            if args is None:
                args = pulled
            assert pulled == args and all(a >= 0 for a in atom["orders"])
            if not any(atom["orders"]):
                i, j = int(component), PARTS.index(part)
                assert slots[i][j] is None
                slots[i][j] = atom["root"]
        assert all(None not in pair for pair in slots)

        chart_rows = []
        for row in case["scalars"]:
            j, part = row["coordinate"], row["part"]
            selected = defaultdict(Fraction)
            unphased = []
            reduced = expected_carrier(carriers, slots, j, part, tangential=True)
            for coeff, entries in row["termsAfterFactoringPToMode"]:
                monomial = tuple(map(tuple, entries))
                assert monomial == tuple(sorted(monomial))
                assert all(exp >= 1 for _, exp in monomial)
                fields = [field_atoms[i] for i, exp in monomial for _ in range(exp) if i in field_atoms]
                assert len(fields) == 2
                if any(i in carriers for i, _ in monomial):
                    selected[monomial] += Fraction(coeff)
                    continue
                assert all(i in roles or i in field_atoms for i, _ in monomial)
                unphased.append(sum(grade[p] for p in fields) +
                                sum(exp * geometry_grades[roles[i]] for i, exp in monomial if i in roles))
            selected = compact(selected)
            expected = expected_carrier(carriers, slots, j, part)
            assert selected == expected, (key, j, part)
            # Change both signs in a polynomial that is formally nonzero. This
            # distinguishes the raw operator even before applying n dot Re U = 0.
            assert selected and selected != {term: -val for term, val in expected.items()}
            assert set(reduced) <= set(selected) and all(0 < val * selected[x] and abs(val) <= abs(selected[x]) for x, val in reduced.items())
            carrier_grade = min(sum(exp * (grade[field_atoms[i]] if i in field_atoms else
                                            geometry_grades[roles[i]]) for i, exp in mono)
                                for mono in reduced)
            min_unphased = min(unphased)
            counts.update({"originalCarrierMonomials": len(selected), "retainedCarrierMonomials": len(reduced),
                           "originalNoncarrierMonomials": len(unphased)})
            worst["unphased"].append(min_unphased)
            worst[f"carrier_{part}"].append(carrier_grade)
            chart_rows.append({
                "component": j, "part": part, "originalRawRoot": row["raw"],
                "originalCarrierTerms": len(selected), "retainedCarrierTerms": len(reduced),
                "noncarrierTerms": len(unphased), "noncarrierLowerGrade": str(min_unphased),
                "retainedCarrierLowerGrade": str(carrier_grade),
            })
        assert {(r["component"], r["part"]) for r in chart_rows} == {(j, q) for j in range(3) for q in PARTS}
        charts.append({"chart": key, "nativeSystem": case["system"], "carrierNodes": list(carriers),
                       "actualPrimarySlots": slots, "commonAfterPullbackArguments": args, "rows": chart_rows})
    assert len(charts) == 10 and sum(len(r["rows"]) for r in charts) == 60
    assert counts["originalCarrierMonomials"] + counts["originalNoncarrierMonomials"] == 1270
    min_by_family = {family: min(items) for family, items in worst.items()}
    assert min_by_family == {"carrier_real": Fraction(99999, 100000),
                             "carrier_imaginary": Fraction(74999, 50000),
                             "unphased": Fraction(99999, 100000)}
    weights = data["weights"]["conditionalOrderedVariation"]["2"]["physicalOverP"]
    assert len(weights) == 23
    assert max(Fraction(row["velocityOverPBandPower"]) for row in weights) == 22
    assert max(row["additionalLogPoleAfterGToMode"] for row in weights) == 21
    assert data["scalar"]["actualWeightLedgerSHA256"] == PINS["weights"]
    loss = Fraction(data["scalar"]["conditionalScalarConclusion"]["epsilonLossUpper"])
    raw_minimum = min(min_by_family.values())
    weighted_exponent = raw_minimum - loss
    assert loss == Fraction(1, 100000) and weighted_exponent == Fraction(49999, 50000)
    return {
        "status": "VERIFIED_ORIGINAL_MODE_TWO_CARRIER_AND_CONDITIONAL_WEIGHTED_GAIN",
        "inputPins": PINS, "sourceNodes": 22155584,
        "chartCount": 10, "scalarCount": 60, "counts": dict(counts), "chartRows": charts,
        "carrierBeforeTangency": "2 i k (n dot U) U",
        "carrierAfterTangency": "-2 k (n dot Im U) U",
        "nativeLeadingTangency": "n dot Re U = 0 for the actual C91 full-curl real amplitude on its positive frame domain.",
        "epsilonGradeBeforeBands": str(raw_minimum),
        "conditionalWeightedComparison": {
            "directionCount": 23, "mode": 2, "maximumBandPower": "22",
            "maxAdditionalPoleAfterG2": 21, "explicitEpsilonAfterC93Charge": str(weighted_exponent),
            "actualAmplitudeBound": "P(v) * epsilon^(49999/50000) * g(d)^2 * d^(-21)",
            "originalZetaForm": "P(v) * epsilon^(49999/50000) * zeta * d^(-24)",
            "scope": "All C91-C93 original outer slab, positive frame/covariance, and shifted-path admission assumptions. Epsilon gain is separate from the remaining radial poles.",
        },
        "epsilonGradesByFamily": {k: str(v) for k, v in min_by_family.items()},
        "wrongCarrierSignRejectedScalars": 60,
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    assert __debug__
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--band", type=Path, required=True)
    parser.add_argument("--registry", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    opts = parser.parse_args()
    comparison = opts.band / "first-forced-budget/outer-weight-comparison"
    paths = {
        "source": opts.band / "forced-normalized-variation/source/normalized-first-forced.json",
        "primary": opts.band / "initial-mean-norm/primary/primary-quotient-ledger.json",
        "geometry": opts.band / "first-forced-budget/geometry/outer-forced-geometry.json",
        "weights": comparison / "raw-weights/raw-weight-degrees-final.json",
        "scalar": comparison / "outer-scalar-budget.json",
        "registry": opts.registry,
    }
    result = replay({key: read_pinned(path, key) for key, path in paths.items()})
    with opts.out.open("x", encoding="utf-8", newline="\n") as out:
        json.dump(result, out, indent=2)
        out.write("\n")
    print("PASS 60 original mode-two carrier equalities,", result["counts"],
          "conditional epsilon grade", result["conditionalWeightedComparison"]["explicitEpsilonAfterC93Charge"])
