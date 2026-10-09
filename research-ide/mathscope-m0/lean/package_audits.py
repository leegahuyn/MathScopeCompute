#!/usr/bin/env python3
"""Package already completed local audits as immutable release fixtures.

This is a release-time operation.  Browser imports cannot execute this script
or update the allowlist.  Review the raw logs and negative controls first.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEAN = ROOT / "lean"
EVIDENCE = ROOT / "evidence"

def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()

def main():
    validation = json.loads((EVIDENCE / "lean-validation.json").read_text())
    assert validation["absenceOfSorry"]
    assert validation["environment"]["unresolvedImportCount"] == 0
    assert all(x["rejected"] for x in validation["negativeControls"])
    builds = {b["module"].split(".")[-1]: b for b in validation["builds"]}
    sources = {}
    for module, build in builds.items():
        source = LEAN / build["sourceFile"]
        assert hashlib.sha256(source.read_bytes()).hexdigest() == build["sourceSha256"], "Stale compiled source"
        sources[module] = {"path": build["sourceFile"], "content": source.read_text(), "sha256": build["sourceSha256"]}
    definitions = [
        {
            "id": "m0-finite-d2", "module": "Finite", "target": "differential_squared_zero",
            "claimId": "M0.FINITE.D_SQUARED_ZERO", "grade": "EXACT_FINITE", "modules": ["Defs", "Finite"],
            "label": "Finite complex · d² = 0 for every integer vector",
            "scope": "Universal v in Z^4 for the fixed D1 and D0 matrices of the D=1 Cech–de Rham fixture. No full prismatic comparison or omitted-weight claim.",
            "context": {"modelId": "p1-cech-de-rham-D1-integer-complex", "domain": "Z^4", "truncationD": 1, "inputShape": [5, 4], "outputShape": [3, 5]},
            "assumptions": [],
            "explanation": {
                "student": "For these two fixed integer matrices, applying the two differentials in succession gives the zero vector for every integer input. This verifies the finite chain condition.",
                "expert": "The kernel checks ∀ v : C0, d1 (d0 v) = zeroC2. Its only foundational dependency is propext. This does not prove a geometric comparison or a cohomology rank statement."
            },
        },
        {
            "id": "m0-finite-integer", "module": "Finite", "target": "integer_fixture",
            "claimId": "M0.FINITE.INTEGER_FIXTURE", "grade": "EXACT_FINITE", "modules": ["Defs", "Finite"],
            "label": "Exact integer fixture · no axiom dependencies",
            "scope": "One exact integer vector (-7, 9007199254740993, 11, -13) under the specified finite differentials. This is a concrete fixture, not a universal theorem.",
            "context": {"modelId": "p1-cech-de-rham-D1-integer-fixture", "input": ["-7", "9007199254740993", "11", "-13"], "numericType": "Int"},
            "assumptions": [],
            "explanation": {
                "student": "This exact calculation includes an integer beyond JavaScript's safe Number range. Lean computes the result without rounding.",
                "expert": "The theorem integer_fixture is kernel-evaluated, and #print axioms returns no dependencies. Its quantifier scope is the single displayed vector."
            },
        },
        {
            "id": "m0-analytic-gap", "module": "Analytic", "target": "gap_excludes_interval",
            "claimId": "M0.ANALYTIC.GAP_EXCLUSION", "grade": "CONDITIONAL_FORMAL", "modules": ["Analytic"],
            "label": "Real spectral implication · explicit gap hypothesis",
            "scope": "For any subset of real energies and a supplied GapAt hypothesis in one fixed energy unit, no positive energy below the bound belongs to that set. No self-adjoint operator, semigroup, QFT or continuum construction is provided.",
            "context": {"modelId": "real-spectral-set-interface", "energyDomain": "mathlib Real", "variables": ["spectrum : Set Real", "delta : Real"], "energyUnit": "fixed shared energy unit"},
            "assumptions": [
                {"id": "M0.HYP.GAP_AT", "kind": "HYPOTHESIS", "statement": "hGap : GapAt spectrum delta; equivalently 0 < delta and every positive energy in spectrum is at least delta.", "source": "MathScope/M0/Analytic.lean", "status": "EXPLICIT_PARAMETER"}
            ],
            "explanation": {
                "student": "If a positive gap has already been established or supplied as a hypothesis, this theorem rules out energies between zero and that gap. The theorem does not establish the gap itself.",
                "expert": "The real-valued universal implication retains hGap in its full Lean type. Only propext, Classical.choice and Quot.sound are used; there is no custom axiom. No limiting or differentiability operation is formalized."
            },
        },
        {
            "id": "m0-conditional-user-gap", "module": "Conditional", "target": "selected_gap_excludes_interval",
            "claimId": "M0.CONDITIONAL.SELECTED_GAP", "grade": "CONDITIONAL_FORMAL", "modules": ["Analytic", "Conditional"],
            "label": "User-assumed Δ = 1 · conditional corollary",
            "scope": "Consequence of two named custom axioms about one uninterpreted real spectrum and a gap at 1. It does not identify this spectrum with any Yang–Mills Hamiltonian.",
            "context": {"modelId": "user-axiom-gap-interface", "delta": "1", "deltaRole": "DECLARED_GAP_BOUND", "energyUnit": "fixed shared energy unit", "fieldIsRecomputed": False},
            "assumptions": [
                {"id": "M0.AXIOM.SELECTED_SPECTRUM", "kind": "USER_AXIOM", "declaration": "MathScope.M0.Conditional.selectedSpectrum", "statement": "selectedSpectrum : Set Real (uninterpreted spectrum object)", "source": "MathScope/M0/Conditional.lean", "status": "ASSUMED"},
                {"id": "M0.AXIOM.GAP_ONE", "kind": "USER_AXIOM", "declaration": "MathScope.M0.Conditional.userAssumedGapAtOne", "statement": "userAssumedGapAtOne : GapAt selectedSpectrum 1", "source": "MathScope/M0/Conditional.lean", "status": "ASSUMED"}
            ],
            "explanation": {
                "student": "The gap at 1 is deliberately assumed. Lean verifies its consequence and keeps the names of both assumptions visible. Changing that assumption requires a different audit.",
                "expert": "#print axioms includes MathScope.M0.Conditional.selectedSpectrum and MathScope.M0.Conditional.userAssumedGapAtOne in addition to the three standard dependencies. The selected set is an interface, not a quantum construction."
            },
        },
        {
            "id": "m0-comparison-gap", "module": "Comparison", "target": "transport_gap",
            "claimId": "M0.COMPARISON.GAP_TRANSFER", "grade": "CONDITIONAL_FORMAL", "modules": ["Analytic", "Comparison"],
            "label": "Comparison adapter · explicit spectrum inclusion",
            "scope": "A gap on an observed superset transfers to an original subset when the explicit SpectrumComparison.inclusion field is supplied in the same energy unit.",
            "context": {"modelId": "spectral-inclusion-adapter", "inclusionDirection": "original subset observed", "energyUnit": "fixed shared energy unit"},
            "assumptions": [
                {"id": "M0.HYP.SPECTRUM_INCLUSION", "kind": "HYPOTHESIS", "statement": "comparison : SpectrumComparison original observed, containing original subset observed.", "source": "MathScope/M0/Comparison.lean", "status": "EXPLICIT_PARAMETER"},
                {"id": "M0.HYP.OBSERVED_GAP", "kind": "HYPOTHESIS", "statement": "hObserved : GapAt observed delta", "source": "MathScope/M0/Comparison.lean", "status": "EXPLICIT_PARAMETER"}
            ],
            "explanation": {
                "student": "A gap seen in a larger certified set applies to its subsets. An arbitrary observation channel usually gives a subset, so this direction must be checked before transferring a conclusion.",
                "expert": "The adapter theorem requires original ⊆ observed; no projection or channel certificate is inferred from a picture. Prismatic, RH/BSD and paper-level NS imports remain separate reference or development tasks."
            },
        },
    ]
    bundles = []
    for spec in definitions:
        build = builds[spec["module"]]
        target_name = f"MathScope.M0.{spec['module']}.{spec['target']}"
        target = next(t for t in build["targets"] if t["target"] == target_name)
        graph = {"nodes": [{"id": spec["claimId"], "kind": "theorem", "statement": target["targetType"]}], "edges": []}
        for assumption in spec["assumptions"]:
            graph["nodes"].append({"id": assumption["id"], "kind": assumption["kind"].lower(), "statement": assumption["statement"]})
            graph["edges"].append({"from": spec["claimId"], "to": assumption["id"], "type": "DEPENDS_ON"})
        relevant_builds = [builds[x] for x in spec["modules"]]
        audit = {
            "schemaVersion": "mathscope.lean-audit/1", "checkedAt": validation["checkedAt"],
            "target": target_name, "targetType": target["targetType"], "axioms": target["axioms"],
            "compileExitCode": build["exitCode"], "sorry": target["sorry"],
            "warnings": build["warnings"], "elapsedSeconds": build["elapsedSeconds"],
            "environmentDigest": validation["environmentDigest"],
            "moduleBuilds": [{k: b[k] for k in ["module", "sourceFile", "sourceSha256", "exitCode", "logFile", "logSha256", "outputOleanSha256"]} for b in relevant_builds],
            "targetModuleLog": build["log"],
            "negativeControls": [{k: n[k] for k in ["name", "sourceFile", "sourceSha256", "exitCode", "rejected", "logFile", "logSha256"]} for n in validation["negativeControls"]],
            "fullEnvironmentEvidence": "evidence/lean-environment.json",
            "fullValidationEvidence": "evidence/lean-validation.json",
            "compilerTrust": "Official Lean shared library and normal kernel; installation path explicitly supplied; unchanged kernel/runtime/guards.",
        }
        bundle = {
            "schemaVersion": "mathscope.shipped-proof/1", "id": spec["id"], "label": spec["label"],
            "scope": spec["scope"], "explanation": spec["explanation"],
            "jobSpec": {"claimId": spec["claimId"], "target": target_name, "requestedGrade": spec["grade"],
                        "sourceFiles": [sources[x] for x in spec["modules"]], "assumptions": spec["assumptions"],
                        "dependencyGraph": graph, "context": spec["context"], "environment": validation["environment"]},
            "audit": audit,
        }
        bundles.append(bundle)
    authorities = {b["id"]: digest(b) for b in bundles}
    output = (
        "// Generated after actual pinned Lean checks. Review raw evidence before updating.\n"
        "// Imported browser data cannot mutate this module's release authority.\n"
        "export const SHIPPED_AUDIT_DIGESTS = " + json.dumps(authorities, ensure_ascii=False, indent=2) + ";\n"
        "export const SHIPPED_PROOF_BUNDLES = " + json.dumps(bundles, ensure_ascii=False, indent=2) + ";\n"
    )
    (LEAN / "shipped-proof-data.mjs").write_text(output)
    (EVIDENCE / "lean-shipped-audit-digests.json").write_text(json.dumps(authorities, indent=2) + "\n")
    print(f"Packaged {len(bundles)} proof bundles; {len(output.encode())} browser bytes")

if __name__ == "__main__":
    main()
