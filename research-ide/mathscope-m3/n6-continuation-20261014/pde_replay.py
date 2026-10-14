"""Bounded continuation of the pinned run's full residual evidence.

This replays the 1068 exported direct-minus-assembled terms, without reopening
the 3.9 million node producer or substituting a value for an unknown jet.
The only new polynomial relation is the source constant sqrt(2)^2 = 2.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import sys
import time

HERE = Path(__file__).resolve().parent
MAX_BYTES = 130_000_000
MAX_SECONDS = 120
MAX_TERMS = 2000
CATEGORY_OPS = {
    "IMPLICIT": {"actual_monotone_root", "actual_quadratic_root"},
    "NATURAL_SERIES": {"actual_natural_series"},
    "CUTOFF_OR_JOIN": {"smooth_piecewise", "source_step_derivative"},
    "CYLINDRICAL_TRIG": {"sine", "cosine"},
    "FINITE_INTEGRAL": {"definite_integral"},
    "FOURIER_INVERSE": {"m3_aux_inverse_partial", "m3_coupled_inverse_partial"},
    "DISCRETE_SELECTOR": {"maximum", "ceiling"},
    "BACKGROUND_LIMIT": {"actual_background_picard", "actual_background_even_profile"},
    "VOLTERRA_LIMIT": {"actual_covariance_volterra", "m3_global_pulse_jet", "m3_forced_pulse_partial"},
}


class EvidenceError(ValueError):
    pass


def require(value, message):
    if not value:
        raise EvidenceError(message)


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def js_hash(value):
    # Every checked scalar node uses integer operands and ordinary strings.
    return digest(json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode())


def json_read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def powers(key):
    if not key:
        return {}
    result = dict(tuple(map(int, pair.split(":"))) for pair in key.split(","))
    require(all(k >= 0 and p > 0 for k, p in result.items()), "Malformed source monomial.")
    require(len(result) == len(key.split(",")), "Repeated uncombined source factor.")
    return result


def encode(row):
    return ",".join(f"{k}:{p}" for k, p in sorted(row.items()) if p)


def direct_categories(node):
    op = node["op"]
    labels = [key for key, ops in CATEGORY_OPS.items() if op in ops]
    if "indexed" in op:
        labels.append("INDEXED_COVER")
    if op.endswith("_partial"):
        orders = node["args"][-1]
        if isinstance(orders, list) and all(isinstance(v, int) for v in orders):
            labels.append("DERIVATIVE_JET" if sum(orders) else "REGISTERED_VALUE")
    if op in ("sqrt_positive", "log_positive", "exp"):
        labels.append("ELEMENTARY_DOMAIN")
    if not labels:
        labels.append("COORDINATE_OR_EXACT_PARAMETER" if op in ("coordinate", "source_parameter") else "OTHER_SOURCE_ATOM")
    return labels


def reduce_sqrt2(numerator, source_nodes, sqrt_id=3622):
    require(source_nodes[sqrt_id] == {"op": "sqrt_positive", "args": [24]}, "Source sqrt(2) binding changed.")
    require(source_nodes[24] == {"op": "rational", "args": ["2", "1"]}, "Source radicand changed.")
    reduced, provenance, transformed = {}, defaultdict(list), []
    require(len(numerator) <= MAX_TERMS, "Bounded exported term limit exceeded.")
    for index, term in enumerate(numerator):
        row = powers(term["monomial"])
        coefficient = Fraction(term["coefficient"])
        exponent = row.get(sqrt_id, 0)
        coefficient *= 2 ** (exponent // 2)
        if exponent:
            row[sqrt_id] = exponent % 2
        key = encode(row)
        reduced[key] = reduced.get(key, Fraction(0)) + coefficient
        provenance[key].append(index)
        if exponent >= 2:
            transformed.append({"inputIndex": index, "sqrt2Exponent": exponent, "outputMonomial": key, "outputCoefficientBeforeCombination": str(coefficient)})
    terms = [{"monomial": key, "coefficient": str(value), "inputTermIndices": provenance[key]} for key, value in sorted(reduced.items()) if value]
    canceled = [{"monomial": key, "inputTermIndices": provenance[key]} for key, value in sorted(reduced.items()) if not value]
    return terms, transformed, canceled


def annotate(term, atoms, definitions):
    factors, direct, closure = [], set(), set()
    for source_id, exponent in powers(term["monomial"]).items():
        atom = atoms[source_id]
        node, key = atom["node"], atom["definitionKey"]
        labels = direct_categories(node)
        direct.update(labels)
        closure.update(atom["labels"])
        factor = {"sourceNode": source_id, "power": exponent, "operation": node["op"], "directCategories": labels,
                  "definitionKey": key, "definitionName": definitions.get(key, {}).get("name")}
        if node["op"].endswith("_partial"):
            factor["literalMultiIndex"] = node["args"][-1]
        factors.append(factor)
    return {**term, "factors": factors, "directFactorCategories": sorted(direct), "definingClosureLabels": sorted(closure)}


def count_labels(terms, key):
    return dict(sorted(Counter(label for term in terms for label in term[key]).items()))


def denominator_ledger(factors, source_nodes):
    out = []
    for factor in factors:
        entry = dict(factor)
        ids = sorted({node for t in factor["polynomial"] for node in powers(t["monomial"])})
        entry["sourceAtoms"] = [{"sourceNode": n, "node": source_nodes[n]} for n in ids]
        if ids == [623015]:
            require(source_nodes[623015] == {"op": "log_positive", "args": [300172]}, "Constant log binding changed.")
            require(source_nodes[300172] == {"op": "add", "args": [474, 3622]}, "Constant log argument changed.")
            require(source_nodes[474] == {"op": "rational", "args": ["4", "1"]}, "Constant four changed.")
            entry.update(status="PROVED_NONZERO_EXACT_CONSTANT", proof="sqrt(2)>0, hence 4+sqrt(2)>1 and log(4+sqrt(2))>0.")
        elif ids in ([623024], [635062]):
            require(source_nodes[ids[0]]["op"] == "exp", "Source exponential binding changed.")
            entry.update(status="NONZERO_CONDITIONAL_ON_FINITE_DEFINED_ARGUMENT", proof="exp(z) is nonzero for every finite defined real or complex z.", sourceArgumentDefinednessProved=False)
        elif ids == [622802]:
            entry.update(status="UNPROVED_SOURCE_ACTIVE_RADIAL_DOMAIN", required="R != 0 for these exact global roots, including their support/axis extension.")
        else:
            expected = [{"monomial": "622820:1", "coefficient": "1"}, {"monomial": "9:1,622803:2,633904:1", "coefficient": "-2"}]
            require(factor["polynomial"] == expected, "Unexpected surviving source denominator.")
            require(source_nodes[633904] == {"op": "exp", "args": [633903]}, "Implicit exponent changed.")
            require(source_nodes[633903] == {"op": "multiply", "args": [25, 622825]}, "Implicit exponent coefficient changed.")
            require(source_nodes[25] == {"op": "multiply", "args": [9, 24]}, "Implicit 2h binding changed.")
            require(source_nodes[622825] == {"op": "log_positive", "args": [622820]}, "Implicit log binding changed.")
            implicit_body = {
                622819: {"op": "add", "args": [622817, 622818]},
                622818: {"op": "multiply", "args": [20, 622804]},
                622817: {"op": "add", "args": [622810, 622816]},
                622816: {"op": "multiply", "args": [20, 622815]},
                622815: {"op": "multiply", "args": [622811, 622814]},
                622811: {"op": "integer_power", "args": [622803, 2]},
                622814: {"op": "exp", "args": [622813]},
                622813: {"op": "multiply", "args": [25, 622812]},
                622812: {"op": "log_positive", "args": [622810]},
                20: {"op": "rational", "args": ["-1", "1"]},
                19: {"op": "rational", "args": ["1", "2"]},
                21: {"op": "multiply", "args": [9, 20]},
                22: {"op": "add", "args": [19, 21]},
            }
            for node_id, value in implicit_body.items():
                require(source_nodes[node_id] == value, "Actual implicit source body changed.")
            entry.update(status="CONDITIONAL_CHART_LOWER_BOUND_PROVED_SOURCE_SCOPE_UNPROVED", sourceArgumentDefinednessProved=False,
                actualImplicitScalarBodySourceVerified=True,
                sourceExponentD={"sourceNode": 22, "formula": "1/2-h", "sourceScalarBodyVerified": True},
                relation="H=s-2h*Z^2*s^(2h)=s*F_s(s), F(s)=s-Z^2*s^(2h)-T.",
                premises=["0<h<1/16", "s and s0 in [1/2,2]", "Z=s0^(1/2-h)*eta", "eta in [-1,1]", "the actual root is s on this image"],
                proof=["Z^2<=2^(1-2h)<=2.", "s^(2h-1)<=2^(1-2h)<=2.", "F_s=1-2h*Z^2*s^(2h-1)>=1-8h>1/2.", "H=s*F_s>1/4."],
                appliesToAllActualGlobalSourceRoots=False)
        out.append(entry)
    return out


def inventory_jets(cartesian, atoms, source_nodes, definitions):
    program = cartesian["scalarProgram"]
    requests, grouped = [], defaultdict(list)
    for request in cartesian["diagnostics"]["unresolvedActualJetRequests"]:
        base = request["base"]
        n = program[base]
        # A substituted opaque operand needs its full uncomputed substitution;
        # never assign its base's original function a fabricated value.
        while n["op"] == "unresolved_opaque_substitution":
            base = n["args"][0]
            n = program[base]
        source_id = n["args"][0] if n["op"] == "actual_opaque_value" else None
        source = source_nodes.get(source_id)
        atom = atoms.get(source_id, {})
        key = atom.get("definitionKey")
        coordinates = [{"scalarNode": x, "node": program[x]} for x in request["orderedDifferentiationCoordinates"]]
        categories = direct_categories(source) if source else ["UNRESOLVED_SUBSTITUTED_OR_DERIVED_OPERAND", *direct_categories(n)]
        row = {**request, "baseSourceNode": source_id, "baseSourceOperation": source["op"] if source else None,
               "definitionKey": key, "definitionName": definitions.get(key, {}).get("name"),
               "coordinates": coordinates, "categories": categories, "uncomputedBaseScalarNode": program[request["base"]], "substitutionDiscarded": False}
        requests.append(row)
        grouped[(source_id, key)].append(row)
    groups = [{"baseSourceNode": source_id, "definitionKey": key, "definitionName": definitions.get(key, {}).get("name"),
               "requestCount": len(rows), "maximumDerivativeOrder": max(len(r["orderedDifferentiationCoordinates"]) for r in rows),
               "jetValuesComputed": False} for (source_id, key), rows in sorted(grouped.items(), key=lambda x: str(x[0]))]
    return {"requests": requests, "byActualBase": groups, "totalUnresolvedRequests": len(requests),
            "categoryCounts": dict(sorted(Counter(c for r in requests for c in r["categories"]).items())),
            "conditionalDomainHypotheses": cartesian["diagnostics"]["conditionalDomainHypotheses"],
            "mixedPartialsCommutedByThisReplay": False, "actualCartesianPDEVerified": False}


def replay(artifact_root, output_dir):
    started = time.monotonic()
    manifest = json_read(HERE / "pde_input_manifest.json")
    direct = artifact_root / "residual-audit-summary.json"
    folder = artifact_root if direct.is_file() else artifact_root / f"mean-proof-residual-{manifest['cloudRun']}"
    require(folder.is_dir(), "Pinned residual artifact directory is missing.")
    require(sum(r["bytes"] for r in manifest["members"]) <= MAX_BYTES, "Input byte bound exceeded.")
    inputs = {}
    for pin in manifest["members"]:
        path = folder / pin["path"]
        require(path.stat().st_size == pin["bytes"], f"Changed input length: {pin['path']}")
        raw = path.read_bytes()
        require(digest(raw) == pin["sha256"], f"Changed pinned cloud bytes: {pin['path']}")
        inputs[pin["path"]] = json.loads(raw)
        require(time.monotonic() - started < MAX_SECONDS, "Continuation elapsed-time bound exceeded.")
    summary, frontier = inputs["residual-audit-summary.json"], inputs["residual-actual-atoms-and-frontier.json"]
    require(inputs["receipt.json"]["sourceCommit"] == manifest["sourceCommit"], "Cloud source commit changed.")
    require(summary["source"]["sourceNodeSHA256"] == manifest["originalNodesSHA256"], "Original source graph binding changed.")
    source_nodes = {}
    for witness in frontier["sourceWitnesses"] + summary["sourceRoots"] + inputs["residual-independent-cartesian-jets.json"]["diagnostics"]["sourceBindings"]:
        require(js_hash(witness["node"]) == witness["nodeSHA256"], "Malformed source witness hash.")
        node_id = witness["sourceNode"]
        require(node_id not in source_nodes or source_nodes[node_id] == witness["node"], "Conflicting source witness.")
        source_nodes[node_id] = witness["node"]
    atoms = {row["sourceNode"]: row for row in frontier["atomicRecords"]}
    definitions = {row["key"]: row for row in frontier["definitionBindings"]}
    output_dir.mkdir(parents=True, exist_ok=True)
    saved = []

    def save(name, value):
        raw = (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()
        with (output_dir / name).open("xb") as stream:
            stream.write(raw)
        saved.append({"path": name, "bytes": len(raw), "sha256": digest(raw)})

    rows = []
    for component, expected in enumerate((175, 203, 690)):
        original = inputs[f"residual-component-{component}-all-terms.json"]
        numerator = original["comparison"]["numerator"]
        require(len(numerator) == expected and len(original["terms"]) == expected, "Actual original residual term count changed.")
        require(numerator == [{"monomial": t["monomial"], "coefficient": t["coefficient"]} for t in original["terms"]], "Exported source classification and numerator disagree.")
        before = [annotate({"inputIndex": i, **t}, atoms, definitions) for i, t in enumerate(numerator)]
        reduced, transformed, canceled = reduce_sqrt2(numerator, source_nodes)
        after = [annotate(t, atoms, definitions) for t in reduced]
        trig_ids = [n for n in original["comparison"]["actualAtomicNodes"] if source_nodes[n]["op"] in CATEGORY_OPS["CYLINDRICAL_TRIG"]]
        row = {"component": component, "directSourceRoot": original["directRoot"], "assembledSourceRoot": original["assembledRoot"],
               "expressionMeaning": "direct conservative residual minus assembled residual; this is not an independently evaluated Cartesian PDE residual",
               "originalNumeratorTerms": before, "reducedNumeratorTerms": after,
               "inputMonomials": expected, "reducedMonomials": len(after),
               "relation": {"sourceNode": 3622, "radicandSourceNode": 24, "formula": "sqrt_positive(2)^2=2", "status": "PROVED_EXACT_DEFINED_CONSTANT", "transformedTerms": transformed, "canceledCombinedMonomials": canceled},
               "directFactorCategoryCounts": count_labels(before, "directFactorCategories"),
               "reducedDirectFactorCategoryCounts": count_labels(after, "directFactorCategories"),
               "definingClosureCategoryCounts": count_labels(before, "definingClosureLabels"),
               "directTrigonometricAtoms": trig_ids, "samePhaseTrigonometricReductionApplicableAtOuterPolynomial": bool(trig_ids),
               "denominatorFactors": denominator_ledger(original["comparison"]["denominatorFactorPolynomials"], source_nodes),
               "originalSourceDenominatorOperands": original["comparison"]["denominatorOperands"],
               "originalNestedPoleDomainsDischarged": False, "actualSourceDerivativeBodiesVerified": False,
               "allRemainingTermsExported": True, "residualZero": len(after) == 0, "actualCartesianPDEVerified": False, "originalN602Complete": False}
        require(not row["residualZero"], "Unexpected zero residual; review new reduction before promotion.")
        require(len(after) == (169, 197, 654)[component], "Exact constant quotient count changed.")
        save(f"pde_component_{component}.json", row)
        rows.append({k: row[k] for k in ("component", "directSourceRoot", "assembledSourceRoot", "inputMonomials", "reducedMonomials", "directFactorCategoryCounts", "reducedDirectFactorCategoryCounts", "directTrigonometricAtoms", "residualZero")})
    cartesian = inputs["residual-independent-cartesian-jets.json"]
    jets = inventory_jets(cartesian, atoms, source_nodes, definitions)
    require(jets["totalUnresolvedRequests"] == 393, "Original opaque Cartesian jet frontier changed.")
    save("pde_cartesian_jet_frontier.json", jets)
    retained_opaque_categories = {category: [r["sourceNode"] for r in frontier["actualOpaqueFrontier"] if r["node"]["op"] in ops] for category, ops in CATEGORY_OPS.items()}
    complete_source_syntax = {category: sorted(n for n, value in source_nodes.items() if value["op"] in ops) for category, ops in CATEGORY_OPS.items()}
    cover = [{"key": k, "name": d["name"], "rowCount": len(d["definition"].get("rows", [])), "requiredSourcePremises": d["definition"].get("requiredSourcePremises", []), "definitionSHA256": d["definitionSHA256"], "sourceAuthenticatedBitsUsedAsProof": False} for k, d in definitions.items() if d["definition"].get("rows")]
    result = {"schema": "MathScope.N6.PDEArtifactContinuation/1", "cloudRun": manifest["cloudRun"], "sourceCommit": manifest["sourceCommit"],
              "originalNodesSHA256": manifest["originalNodesSHA256"], "status": "EXACT_CONSTANT_REDUCTION_WITH_FULL_ANALYTIC_AND_CARTESIAN_FRONTIER_OPEN",
              "components": rows, "inputMonomials": 1068, "reducedMonomials": sum(r["reducedMonomials"] for r in rows),
              "unresolvedCartesianJetRequests": 393, "opaqueDefiningClosureCategories": retained_opaque_categories, "completeDefiningClosureSyntaxCategories": complete_source_syntax, "completeIndexedCoverDefinitions": cover,
              "classificationScopes": {"directFactorCategories": "actual outer polynomial factors only", "definingClosureLabels": "dependency reachability; not a causal or exclusive partition of PDE defects"},
              "proofBoundary": {"heavyPassedProducerRerun": False, "pinnedCloudBytesVerified": True, "exactConstantRelationApplied": True,
                 "allOriginalAndRemainingTermsRetained": True, "trigonometricIdentityAtOuterFrontierApplicable": False,
                 "opaqueJetReplacedByZero": False, "coverDisjointnessProved": False, "sourceDomainPremisesDischarged": False,
                 "fullActualCartesianPDEVerified": False, "originalN601Complete": False, "originalN602Complete": False, "original56Of64Changed": False},
              "remaining": ["Actual all-162 indexed cover joins, maps and nonlinear cross-label products.", "Same-body pressure/Fourier inverse and actual local field derivatives.", "All global source domains and raw nested denominator operands, including cutoff endpoints.", "393 actual independently uncomputed Cartesian leaf jets.", "Natural/quadratic/Picard/Volterra existence and required mixed derivatives throughout this complete source closure."]}
    save("pde_summary.json", result)
    require(time.monotonic() - started < MAX_SECONDS, "Continuation elapsed-time bound exceeded.")
    save("pde_execution.json", {"schema": "MathScope.N6.PDEArtifactContinuation.Execution/1", "finishedAtUTC": datetime.now(timezone.utc).isoformat(),
       "elapsedSeconds": time.monotonic() - started, "python": sys.version, "limits": {"inputBytes": MAX_BYTES, "seconds": MAX_SECONDS, "termsPerComponent": MAX_TERMS},
       "inputs": manifest, "implementationSHA256": digest(Path(__file__).read_bytes()), "artifacts": list(saved), "successMeans": "pinned-evidence continuation arithmetic completed; no unconditional mathematical certification"})
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        result = replay(args.artifacts, args.output)
    except Exception as error:
        args.output.mkdir(parents=True, exist_ok=True)
        failure = {"status": "FAILED", "type": type(error).__name__, "message": str(error), "actualCartesianPDEVerified": False, "originalN602Complete": False}
        target = args.output / "pde_failure.json"
        if not target.exists():
            target.write_text(json.dumps(failure, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        raise
    print(json.dumps({"status": result["status"], "inputMonomials": result["inputMonomials"], "reducedMonomials": result["reducedMonomials"], "unresolvedCartesianJetRequests": result["unresolvedCartesianJetRequests"], "actualCartesianPDEVerified": False}))


if __name__ == "__main__":
    main()
