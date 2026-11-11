"""Run the M4 core Lean closure gate in an isolated GitHub Actions build."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time


EXPECTED_COMMIT = "5045d0056413266e57c625dcd7c365b10e377c52"
SOURCE_MODULES = (
    ("mathscope-m0", "MathScope/M0/Defs"),
    ("mathscope-m0", "MathScope/M0/Finite"),
    ("mathscope-m4", "MathScope/M4/Defs"),
    ("mathscope-m4", "MathScope/M4/Finite"),
    ("mathscope-m4", "MathScope/M4/Analytic"),
    ("mathscope-m4", "MathScope/M4/Comparison"),
    ("mathscope-m4", "MathScope/M4/Conditional"),
    ("mathscope-m4", "MathScope/M4/Open"),
)
AUDIT_IMPORTS = (
    "import MathScope.M4.Finite\n"
    "import MathScope.M4.FiniteAcceptance\n"
    "import MathScope.M4.Comparison\n"
    "import M4ClosureAudit\n"
)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def run(args):
    root = args.repo.resolve()
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=False)
    git = ["git", "-C", str(root)]
    commit = subprocess.check_output(git + ["rev-parse", "HEAD"]).decode().strip()
    receipt = {
        "schema": "MathScope.M4.UnconditionalClosureBuild/1",
        "commit": commit,
        "githubRunId": os.getenv("GITHUB_RUN_ID"),
        "githubRunAttempt": os.getenv("GITHUB_RUN_ATTEMPT"),
        "leanCommit": EXPECTED_COMMIT,
        "leanExecutableSHA256": sha256(args.lean.read_bytes()),
        "mathlibCommit": None,
        "usesMathlib": False,
        "sources": [],
        "executions": [],
        "verdict": "FAIL",
    }
    source_dir = out / "sources"
    compiled = out / "compiled"
    source_dir.mkdir()
    compiled.mkdir()
    env = {**os.environ, "LEAN_PATH": str(compiled)}

    def save():
        (out / "receipt.json").write_text(
            json.dumps(receipt, indent=2) + "\n", encoding="utf-8"
        )

    def materialize(module, data, git_path=None):
        relative = module + ".lean"
        target = source_dir / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        receipt["sources"].append({
            "path": relative, "repoPath": git_path,
            "sha256": sha256(data), "bytes": len(data),
        })
        return relative

    def execute(label, options, expected=0, expected_output=()):
        started = time.monotonic()
        proc = subprocess.run(
            [str(args.lean), *options],
            cwd=source_dir, env=env, stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, timeout=120, check=False,
        )
        log = proc.stdout.decode("utf-8", errors="replace")
        log_path = label + ".log"
        (out / log_path).write_bytes(proc.stdout)
        entry = {
            "label": label,
            "commandOptions": options,
            "exitCode": proc.returncode,
            "expectedExitCode": expected,
            "elapsedMilliseconds": round((time.monotonic() - started) * 1000),
            "log": log_path,
            "logSHA256": sha256(proc.stdout),
            "warnings": [line for line in log.splitlines() if "warning:" in line],
            "usesSorry": "sorryAx" in log or "declaration uses 'sorry'" in log,
            "expectedOutput": list(expected_output),
        }
        receipt["executions"].append(entry)
        save()
        print(label, "exit", proc.returncode, flush=True)
        print(log, end="" if log.endswith("\n") or not log else "\n", flush=True)
        if proc.returncode != expected or not all(x in log for x in expected_output):
            raise RuntimeError(f"Unexpected Lean result for {label}")
        if entry["usesSorry"] or (expected == 0 and entry["warnings"]):
            raise RuntimeError(f"Unexpected warning or sorry in {label}")
        return log

    def compile_module(module, data, git_path=None):
        source = materialize(module, data, git_path)
        artifact = compiled / (module + ".olean")
        artifact.parent.mkdir(parents=True, exist_ok=True)
        extra = ()
        if module.endswith("/Conditional"):
            extra = ("depends on axioms:", "MathScope.M4.Conditional.assumedComplete")
        elif module.endswith("/FiniteAcceptance"):
            extra = tuple(
                f"MathScope.M4.FiniteAcceptance.{name}" for name in (
                    "delta_two_exact_quotient", "delta_two_input_residues",
                    "delta_two_precision", "delta_two_same_width_counterexample",
                    "nonidentity_semilinear_chain_map",
                    "product_differential_squared_zero",
                )
            )
        memory_mib = 3072 if module == "M4ClosureAudit" else 1536
        execute(
            "compile-" + module.replace("/", "-"),
            [f"--memory={memory_mib}", "--threads=1", "-o", str(artifact), source],
            expected_output=extra,
        )
        receipt["executions"][-1]["oleanSHA256"] = sha256(artifact.read_bytes())
        save()

    def probe(name, body, expected=0, expected_output=()):
        relative = materialize(name, body.encode("utf-8"))
        memory_mib = 3072 if "#audit_m4_unconditional" in body else 512
        execute(
            name, [f"--memory={memory_mib}", "--threads=1", relative],
            expected, expected_output,
        )

    try:
        receipt["leanVersion"] = execute(
            "lean-version", ["--version"], expected_output=("commit " + EXPECTED_COMMIT,)
        ).strip()
        for section, module in SOURCE_MODULES:
            path = f"research-ide/{section}/lean/{module}.lean"
            data = subprocess.check_output(git + ["show", f"{commit}:{path}"])
            compile_module(module, data, path)

        finite_path = (
            "tools/mathscope-cd-axial-bridge-20261029/m4-finite/FiniteAcceptance.lean"
        )
        finite_data = subprocess.check_output(git + ["show", f"{commit}:{finite_path}"])
        compile_module("MathScope/M4/FiniteAcceptance", finite_data, finite_path)

        helper_path = Path(__file__).with_name("M4ClosureAudit.lean")
        helper_relative = helper_path.resolve().relative_to(root).as_posix()
        helper_data = subprocess.check_output(git + ["show", f"{commit}:{helper_relative}"])
        compile_module("M4ClosureAudit", helper_data, helper_relative)

        probe(
            "UnconditionalClosure", AUDIT_IMPORTS + "#audit_m4_unconditional\n",
            expected_output=("M4_UNCONDITIONAL_CLOSURE_CLEAN",),
        )
        probe(
            "NegativeOpenImport",
            AUDIT_IMPORTS + "import MathScope.M4.Open\n#audit_m4_unconditional\n",
            1, ("M4_OPEN_MODULE_IMPORTED",),
        )
        probe(
            "NegativeConditionalImport",
            AUDIT_IMPORTS + "import MathScope.M4.Conditional\n#audit_m4_unconditional\n",
            1, ("M4_CONDITIONAL_MODULE_IMPORTED",),
        )
        compile_module(
            "MathScope/M4/ClosureInjected",
            b"import Init\nnamespace MathScope.M4.ClosureInjected\n"
            b"axiom freshUserAxiom : (0 : Nat) = 1\n"
            b"theorem dependentTheorem : (0 : Nat) = 1 := freshUserAxiom\n"
            b"end MathScope.M4.ClosureInjected\n",
        )
        probe(
            "NegativeTransitiveUserAxiom",
            AUDIT_IMPORTS + "import MathScope.M4.ClosureInjected\n#audit_m4_unconditional\n",
            1, ("M4_USER_AXIOM_IN_TRANSITIVE_CLOSURE", "dependentTheorem", "freshUserAxiom"),
        )
        probe(
            "NegativeFalseRfl", "import Init\nexample : (0 : Nat) = 1 := by rfl\n",
            1, ("error:", "rfl"),
        )
        probe(
            "FiniteFixturePositive",
            "import MathScope.M4.FiniteAcceptance\n"
            "open MathScope.M4 MathScope.M4.FiniteAcceptance\n"
            "example : deltaTwo 3 (-3) = -9 := by decide\n"
            "example : (deltaNumerator 3 3 % 32) / 2 = 9 := by decide\n"
            "example : primeTrial 29 = true := by decide\n",
        )
        probe(
            "NegativePrimeCertificate",
            "import MathScope.M4.Defs\n"
            "example : MathScope.M4.primeTrial 21 = true := by decide\n",
            1, ("error:", "decide", "primeTrial 21"),
        )
        probe(
            "NegativeDeltaPrecision",
            "import MathScope.M4.FiniteAcceptance\n"
            "open MathScope.M4.FiniteAcceptance\n"
            "example : (deltaNumerator 3 3 % 16) / 2 = deltaTwo 3 3 % 16 := by decide\n",
            1, ("error:", "decide", "deltaNumerator 3 3"),
        )
        receipt["verdict"] = "PASS"
        receipt["originalCriterionScope"] = [
            "I3-01 core Lean module and axiom closure",
            "I3-02 scoped finite algebra, exact p=2 quotient precision, and certificate controls",
        ]
        receipt["additionalControlScope"] = "I3-06 false rfl control only"
    except Exception as error:
        receipt["error"] = str(error)
        raise
    finally:
        save()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--lean", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    run(parser.parse_args())
