"""Join the archived inverse inputs to the cutoff recipes without double counting."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


def load(path, expected=None):
    data = path.read_bytes()
    digest = sha256(data).hexdigest()
    if expected is not None:
        assert digest == expected, (path, digest, expected)
    return json.loads(data), digest


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    base = Path(__file__).resolve().parent.parent
    raw, raw_sha = load(base / "f1-mean/raw-first-forced-binding.json",
        "656229e69c3eb24487055822093ada2c10763a8ce7c38eaa8e09626225827d3c")
    formal, formal_sha = load(base / "flat/principal-flat-subtraction.json")
    forced, forced_sha = load(base / "flat/forced-principal-cutoffs.json",
        formal["firstForcedCutoffsSHA256"])
    hom, hom_sha = load(base / "flat-homogeneous/homogeneous-principal-cutoffs.json",
        formal["homogeneousCutoffsSHA256"])
    assert raw["graphSHA256"] == forced["firstPostFiveGraphSHA256"] == hom["graphSHA256"]
    assert raw["registrySHA256"] == forced["nativeRegistrySHA256"] == hom["registrySHA256"]
    assert raw["sourceGenerationImplementsPreForcedPrimaryTailExclusion"] is False
    actual_raw = {(r["key"], r["mode"], r["component"], r["part"]): r
        for r in raw["exactRawSourceBindings"]}
    assert len(actual_raw) == 120
    forced_by_mode = {(r["difference"], r["sign"], r["mode"]): r for r in forced["bindings"]}
    for binding in forced["bindings"]:
        for j, components in enumerate(binding["components"]):
            for part, r in components.items():
                source = actual_raw[binding["key"], binding["mode"], j, part]
                assert binding["system"] == source["system"]
                assert r["formalPathSource"] == source["formalPathSource"]
                assert r["sourceBody"] == source["mappedRawWrapperBody"]

    rows = []
    primary_overlap = 0
    for case in formal["cases"]:
        difference, sign = case["difference"], case["sign"]
        for mode, entries in case["modes"].items():
            m = int(mode)
            for j, entry in enumerate(entries):
                archive_terms, earlier_primary = [], None
                for term in entry["subtract"]:
                    if term[0] == "forcedComplex":
                        binding = forced_by_mode[difference, sign, abs(m)]
                        assert term[1] == binding["components"][j]["real"]["expected"]
                        assert term[2] == binding["components"][j]["imaginary"]["expected"]
                        assert term[3] == (1 if m > 0 else -1)
                        archive_terms.append(term)
                    else:
                        tag, index, family, derivative = term
                        assert tag == "homogeneousReal" and abs(m) == 1
                        h = hom["bindings"][index]
                        assert (h["difference"], h["sign"], h["component"]) == (difference, sign, j)
                        assert derivative == h["mappedPulseDerivative"]
                        assert family in ("primary", "signed") and h[family]["uncutHalfLeading"]
                        if family == "primary":
                            assert earlier_primary is None
                            earlier_primary = term
                            primary_overlap += 1
                        else:
                            archive_terms.append(term)
                assert (earlier_primary is not None) == (abs(m) == 1)
                assert len(archive_terms) == int(abs(m) <= 2) + int(abs(m) == 1)
                rows.append({"difference": difference, "sign": sign, "mode": m, "component": j,
                    "residualRecipe": entry["residualRecipe"],
                    "archivedPrincipalFlatTerms": archive_terms,
                    "removeStandalonePrimaryFromEarlierRecipe": earlier_primary})
    assert len(rows) == 240 and primary_overlap == 60

    # Polynomials over the distinct symbols G, P, psi, and T.
    raw_residual = Counter({("G",): 1, ("P",): 1})
    raw_after_force = raw_residual.copy()
    raw_after_force.update({("G", "psi"): -1, ("P", "psi"): -1, ("T",): 1})
    wrong_ledger = raw_after_force.copy()
    wrong_ledger.update({("P",): 1})
    discrepancy = raw_after_force.copy()
    discrepancy.subtract(wrong_ledger)
    assert +discrepancy == Counter() and -discrepancy == Counter({("P",): 1})
    repaired_after_force = raw_residual.copy()
    repaired_after_force.update({("G", "psi"): -1, ("T",): 1})
    assert repaired_after_force == Counter({("P",): 1, ("G",): 1, ("G", "psi"): -1, ("T",): 1})
    psi, primary = Fraction(1, 2), Fraction(1)
    actual = (1 - psi) * primary
    assert actual == Fraction(1, 2) and actual + primary == Fraction(3, 2)
    result = {
        "schema": "MathScope.M3.ArchivedFirstForcedCutoffReconciliation/1",
        "sourceCommit": raw["sourceCommit"], "graphSHA256": raw["graphSHA256"],
        "registrySHA256": raw["registrySHA256"],
        "receiptsSHA256": {"raw": raw_sha, "forced": forced_sha, "homogeneous": hom_sha,
            "supersededFormalComposition": formal_sha},
        "archivedRawSource": "f_raw = G0 + P",
        "archivedPrincipalFlat": "(1-psi)*f_raw + psiPrime*t_raw + signedTail",
        "archiveLedgerOvercount": "The standalone P adds one extra primary tail.",
        "paperAlignedPrincipalFlat": "P + (1-psi)*G0 + psiPrime*t_repaired + signedTail_repaired",
        "componentBinds": len(actual_raw), "principalRecipes": len(rows),
        "extraStandalonePrimaryRecipesRemoved": primary_overlap,
        "countermodel": {"psi": str(psi), "P": str(primary), "G0": "0", "psiPrimeTimesT": "0",
            "archived": str(actual), "earlierRecipe": str(actual + primary)},
        "rows": rows, "completeFirstCycleFlatResidual": False,
        "correctedDownstreamRegenerated": False, "liveSecondForcingInput": False,
    }
    args.out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(actual_raw)} exact archived raw components, {len(rows)} principal recipes, "
          f"{primary_overlap} standalone primary overlaps removed")


if __name__ == "__main__":
    main()
