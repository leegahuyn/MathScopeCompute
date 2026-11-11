"""Verify exact I3-03 statement and target coverage against current source and CI."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess


PIN = "325a5ff7b57e4d3b6de9e9927fee5425321b097f"
RUN = "42996997312"
REQUIRED_KINDS = {
    "completeness", "uniform_convergence", "derivative_and_limit_interchange",
    "semigroup_bound", "spectral_measure", "stability_constants",
}
M4_MODULES = ("Defs", "Finite", "Analytic", "Comparison", "Conditional", "Open")
ANALYTIC = ("Analytic", "Comparison", "Conditional")
NONANALYTIC = ("Defs", "Finite", "Open", "FiniteAcceptance")
M4_SOURCE_ROOT = "research-ide/mathscope-m4/lean/MathScope/M4/"
M0_SOURCE_ROOT = "research-ide/mathscope-m0/lean/MathScope/M0/"
ROOT = "tools/mathscope-cd-axial-bridge-20261029"
THEOREMS = re.compile(r"^theorem\s+([A-Za-z0-9_']+)\b", re.M)
AXIOMS = re.compile(r"^axiom\s+([A-Za-z0-9_']+)\b", re.M)
EXPECTED_M0 = {
    "Defs": [],
    "Finite": ["matrix_product_zero", "differential_squared_zero", "integer_fixture"],
    "Analytic": ["gap_excludes_interval", "smaller_positive_gap", "gap_transfer"],
    "Comparison": ["transport_gap"],
    "Conditional": ["selected_gap_excludes_interval"],
    "Open": [],
}
EXPECTED_M4 = {
    "Defs": [],
    "Finite": [
        "delta_two_numerator", "differential_squared_zero", "scalar_chain_map",
        "prime_interval_fixture", "bracket_antisymmetric", "bracket_jacobi",
        "shear_plaquette",
    ],
    "Analytic": ["uniform_limit_uniformly_continuous"],
    "Comparison": ["uniform_continuity_adapter"],
    "Conditional": ["assumed_cauchy_limit"],
    "Open": [],
    "FiniteAcceptance": [
        "delta_numerator_factor", "delta_two_exact_quotient",
        "delta_two_input_residues", "delta_two_quotient_from_wider_numerator",
        "delta_two_precision", "delta_two_same_width_counterexample",
        "coefficient_swap_is_involutive", "coefficient_swap_preserves_add_mul",
        "coefficient_swap_preserves_one", "coefficient_swap_nonidentity",
        "swap_additive", "product_differential_squared_zero",
        "nonidentity_semilinear_chain_map",
    ],
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def lean_code_only(text):
    """Blank nested comments and strings, preserving declaration line starts."""
    output = []
    index = 0
    depth = 0
    while index < len(text):
        if depth:
            if text.startswith("/-", index):
                depth += 1
                index += 2
            elif text.startswith("-/", index):
                depth -= 1
                index += 2
                if not depth:
                    output.append(" ")
            else:
                if text[index] == "\n":
                    output.append("\n")
                index += 1
        elif text.startswith("/-", index):
            depth = 1
            index += 2
        elif text.startswith("--", index):
            line_end = text.find("\n", index)
            index = len(text) if line_end == -1 else line_end
        elif text[index] == '"':
            output.append(" ")
            index += 1
            while index < len(text):
                if text[index] == "\\":
                    index += 2
                elif text[index] == '"':
                    index += 1
                    break
                else:
                    if text[index] == "\n":
                        output.append("\n")
                    index += 1
            else:
                raise ValueError("Unterminated Lean string literal")
        else:
            output.append(text[index])
            index += 1
    if depth:
        raise ValueError("Unterminated Lean block comment")
    return "".join(output)


def audit(args):
    if not __debug__:
        raise RuntimeError("Run with integrity checks enabled.")
    repo = args.repo.resolve()
    ci = args.ci.resolve()
    here = Path(__file__).resolve().parent
    git = ["git", "-c", "core.longpaths=true", "-C", str(repo)]
    head = subprocess.check_output(git + ["rev-parse", "HEAD"]).decode().strip()

    def git_bytes(commit, path):
        return subprocess.check_output(git + ["show", f"{commit}:{path}"])

    def unchanged(path):
        pinned = git_bytes(PIN, path)
        assert git_bytes(head, path) == pinned, path
        return pinned

    current_paths = subprocess.check_output(
        git + ["ls-tree", "-r", "--name-only", head, "research-ide/mathscope-m4/lean"]
    ).decode().splitlines()
    assert set(current_paths) == {M4_SOURCE_ROOT + name + ".lean" for name in M4_MODULES}

    original_spec_path = "research-ide/mathscope-m4/analytic-obligations.json"
    original_spec_bytes = unchanged(original_spec_path)
    original_spec = json.loads(original_spec_bytes)
    new_spec_bytes = (here / "exact-analytic-obligations.json").read_bytes()
    spec = json.loads(new_spec_bytes)
    assert spec["originalCriterion"] == "I3-03"
    obligations = {row["id"]: row for row in spec["obligations"]}
    assert len(obligations) == 6 and {row["kind"] for row in obligations.values()} == REQUIRED_KINDS
    assert set(obligations) == {row["id"] for row in original_spec["obligations"]}
    for row in obligations.values():
        assert all(isinstance(row[key], str) and row[key].strip()
                   for key in ("domain", "normOrMetric", "quantifiers", "statement", "boundary"))
        if row["status"] == "OPEN_SPECIFICATION":
            assert row["leanDeclaration"] is None and not row["consumedBy"]
        else:
            assert row["leanDeclaration"] and row["consumedBy"]

    receipt_bytes = (ci / "receipt.json").read_bytes()
    ci_receipt = json.loads(receipt_bytes)
    assert ci_receipt["githubRunId"] == RUN and ci_receipt["commit"] == PIN
    assert ci_receipt["verdict"] == "PASS"
    compile_results = {row["label"]: row for row in ci_receipt["executions"]}
    sources = {row["path"]: row for row in ci_receipt["sources"]}
    files = []
    actual = {}
    for name in (*M4_MODULES, "FiniteAcceptance"):
        path = (ROOT + "/m4-finite/FiniteAcceptance.lean"
                if name == "FiniteAcceptance" else M4_SOURCE_ROOT + name + ".lean")
        code = unchanged(path)
        module = "MathScope/M4/" + name
        archived = (ci / "sources" / (module + ".lean")).read_bytes()
        assert archived == code
        assert digest(code) == sources[module + ".lean"]["sha256"]
        assert sources[module + ".lean"]["repoPath"] == path
        execution = compile_results["compile-" + module.replace("/", "-")]
        log = (ci / execution["log"]).read_bytes()
        assert digest(log) == execution["logSHA256"]
        assert execution["exitCode"] == 0 and not execution["usesSorry"]
        text = lean_code_only(code.decode())
        declarations = THEOREMS.findall(text)
        axioms = AXIOMS.findall(text)
        assert declarations == EXPECTED_M4[name], (name, declarations)
        assert axioms == (["assumedComplete"] if name == "Conditional" else []), (name, axioms)
        if name in ANALYTIC:
            for local_name in declarations:
                full = module.replace("/", ".") + "." + local_name
                assert full.encode() in log, full
                actual[full] = {"module": module, "compileLogSHA256": digest(log)}
        else:
            assert name in NONANALYTIC
        files.append({
            "repoPath": path, "sourceSHA256": digest(code),
            "theorems": declarations, "axioms": axioms,
            "scope": "ANALYTIC_ANNOTATIONS_REQUIRED" if name in ANALYTIC else "FINITE_OR_REGISTRY_DATA",
        })

    annotated = {row["target"]: row for row in spec["actualAnalyticTargets"]}
    assert set(annotated) == set(actual)
    for name, row in annotated.items():
        assert row["module"] == actual[name]["module"] and row["obligations"]
        for obligation in row["obligations"]:
            assert name in obligations[obligation]["consumedBy"]
    for obligation in obligations.values():
        for target in obligation["consumedBy"]:
            assert obligation["id"] in annotated[target]["obligations"]
    conditional = (ci / compile_results["compile-MathScope-M4-Conditional"]["log"]).read_text(encoding="utf-8")
    assert "depends on axioms: [MathScope.M4.Conditional.assumedComplete]" in conditional

    # The inherited real spectral targets use sets of supplied real energies.
    # Their source-pinned declarations are not part of this fresh core build.
    inherited_m0 = []
    for name in M4_MODULES:
        path = M0_SOURCE_ROOT + name + ".lean"
        code = unchanged(path)
        text = lean_code_only(code.decode())
        names = THEOREMS.findall(text)
        axioms = AXIOMS.findall(text)
        assert names == EXPECTED_M0[name], (name, names)
        assert axioms == (["selectedSpectrum", "userAssumedGapAtOne"] if name == "Conditional" else []), (name, axioms)
        inherited_m0.append({
            "repoPath": path, "sourceSHA256": digest(code), "theorems": names,
            "axioms": axioms,
            "scope": "SUPPLIED_REAL_SPECTRUM_SET" if name in ANALYTIC else "FINITE_OR_REGISTRY_DATA",
        })

    report = {
        "schema": "MathScope.M4.AnalyticScopeAudit/1",
        "originalCriterion": "I3-03",
        "currentSourceCommit": head,
        "githubCompilerSourceCommit": PIN,
        "githubCompilerRunId": RUN,
        "githubCompilerReceiptSHA256": digest(receipt_bytes),
        "originalSpecSHA256": digest(original_spec_bytes),
        "explicitSpecSHA256": digest(new_spec_bytes),
        "coveredObligationKinds": sorted(REQUIRED_KINDS),
        "currentM4Modules": files,
        "actualM4AnalyticTargets": [
            {**annotated[name], **actual[name]} for name in sorted(actual)
        ],
        "inheritedM0ModulesSourceScope": inherited_m0,
        "openSpecifications": [
            row["id"] for row in obligations.values() if row["status"] == "OPEN_SPECIFICATION"
        ],
        "proofOfNewOpenAdapters": False,
        "verdict": "PASS_EXACT_ANALYTIC_SPECIFICATIONS_AND_ACTUAL_TARGET_COVERAGE",
    }
    with args.out.open("x", encoding="utf-8", newline="\n") as output:
        json.dump(report, output, ensure_ascii=False, indent=2)
        output.write("\n")
    print(json.dumps({
        "verdict": report["verdict"], "coveredKinds": len(REQUIRED_KINDS),
        "actualM4AnalyticTargets": len(actual), "openSpecifications": len(report["openSpecifications"]),
    }))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--ci", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    audit(parser.parse_args())
