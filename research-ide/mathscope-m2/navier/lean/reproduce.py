#!/usr/bin/env python3
"""Compile the additive M2 algebra lemmas with the pinned official kernel.

The optional C entry point only supplies Lean's installation/search path. Its
source is the unchanged M0 driver and it calls the official frontend directly.
No source, kernel, imported object, or verifier guard is modified.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
from datetime import datetime, timezone


ALLOWED_AXIOMS = {"propext", "Classical.choice", "Quot.sound"}
TARGETS = [
    "Differential.mixed_product",
    "Differential.first_variation_rhs",
    "Differential.mixed_variation_rhs",
    "Differential.second_variation_rhs",
    "Differential.inverse_first",
    "Differential.inverse_mixed",
    "Differential.solve_first",
    "Differential.solve_mixed",
    "covariance_density_mixed",
    "square_root_first_relation",
    "square_root_mixed_relation",
    "full_cylindrical_curl_divergence",
    "square_root_first",
    "two_column_inverse",
]
PREFIX = "MathScope.M2.Navier."


def sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def run(command: list[str], *, env: dict[str, str], timeout: int = 60) -> dict:
    completed = subprocess.run(command, capture_output=True, text=True, env=env,
                               timeout=timeout, check=False)
    return {"command": command, "exitCode": completed.returncode,
            "stdout": completed.stdout, "stderr": completed.stderr}


def axiom_rows(output: str) -> list[dict]:
    rows = []
    pattern = re.compile(
        r"'(?P<name>MathScope\.M2\.Navier\.[^']+)' "
        r"(?:does not depend on any axioms|depends on axioms:\s*\[(?P<axioms>[^]]*)\])")
    for found in pattern.finditer(output):
        axioms = [x.strip() for x in (found.group("axioms") or "").split(",") if x.strip()]
        rows.append({"declaration": found.group("name"), "axioms": axioms,
                     "permittedOnly": set(axioms) <= ALLOWED_AXIOMS})
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lean-root", required=True, type=Path)
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--work", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--normal-frontend", action="store_true")
    args = parser.parse_args()
    local = Path(__file__).resolve().parent
    repo = local.parents[3]
    source = local / "MathScope/M2/Navier/DifferentialAlgebra.lean"
    negative = local / "NegativeFalse.lean"
    pins_path = repo / "tools/ns-original-ci/pins.json"
    pins = json.loads(pins_path.read_text())
    toolchain = (local / "lean-toolchain").read_text().strip()
    if toolchain != pins["toolchain"]:
        raise RuntimeError("The new algebra module must retain its exact pinned toolchain")
    root = args.lean_root.resolve()
    kernel = root / "lib/lean/libleanshared.so"
    kernel_before = sha(kernel)
    if kernel_before != pins["leanKernelSHA256"]:
        raise RuntimeError("The official shared kernel hash differs from the pinned archive")
    archive = None
    if args.archive:
        archive = {"path": str(args.archive.resolve()), "sha256": sha(args.archive)}
        if archive["sha256"] != pins["leanArchiveSHA256"]:
            raise RuntimeError("The Lean release archive hash is not the pinned official archive")
    work = (args.work or Path(tempfile.mkdtemp(prefix="mathscope-m2-lean-"))).resolve()
    work.mkdir(parents=True, exist_ok=True)
    output = (args.output or local / "evidence").resolve()
    output.mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    compiled = work / "compiled"
    module = compiled / "MathScope/M2/Navier/DifferentialAlgebra.olean"
    module.parent.mkdir(parents=True, exist_ok=True)
    env["LEAN_PATH"] = str(compiled)
    driver_source = repo / "research-ide/mathscope-m0/lean/lean-embed-check.c"
    driver_source_before = sha(driver_source)
    if args.normal_frontend:
        command = [str(root / "bin/lean")]
        driver = {"kind": "official-cli"}
    else:
        binary = work / "lean-embed-check"
        build = run(["cc", "-O2", "-I", str(root / "include"), str(driver_source),
                     "-L", str(root / "lib/lean"),
                     "-Wl,-rpath," + str(root / "lib/lean"), "-lleanshared",
                     "-o", str(binary)], env=env)
        if build["exitCode"] != 0:
            raise RuntimeError("The unchanged frontend entry-point driver did not build: " + build["stderr"])
        command = [str(binary), str(root)]
        driver = {"kind": "explicit-search-path-official-frontend",
                  "source": str(driver_source.relative_to(repo)),
                  "sourceSHA256": driver_source_before,
                  "binarySHA256": sha(binary), "compileCommand": build["command"]}
    version = run(command + ["--version"], env=env)
    if version["exitCode"] != 0 or "version 4.34.0-rc2" not in version["stdout"]:
        raise RuntimeError("The actual frontend version is not the pinned toolchain")
    text = source.read_text()
    if re.search(r"\b(sorry|admit|axiom|unsafe)\b", text):
        raise RuntimeError("An unproved or unsafe declaration was found in the positive source")
    records = []
    positive = run(command + ["-o", str(module), str(source)], env=env)
    positive["id"] = "positive-source"
    positive["sourceSHA256"] = sha(source)
    positive["expectedExit"] = 0
    positive["pass"] = positive["exitCode"] == 0 and "sorryAx" not in positive["stdout"]
    records.append(positive)

    imported = work / "AuditImported.lean"
    imported.write_text("import MathScope.M2.Navier.DifferentialAlgebra\n" +
                        "\n".join("#print axioms " + PREFIX + target for target in TARGETS) + "\n")
    replay = run(command + [str(imported)], env=env)
    replay["id"] = "fresh-import-audit"
    replay["expectedExit"] = 0
    rows = axiom_rows(replay["stdout"])
    replay["pass"] = (replay["exitCode"] == 0 and
                      {row["declaration"] for row in rows} == {PREFIX + target for target in TARGETS} and
                      all(row["permittedOnly"] for row in rows))
    records.append(replay)

    negative_run = run(command + [str(negative)], env=env)
    negative_run.update({"id": "false-must-fail", "sourceSHA256": sha(negative),
                         "expectedExit": "nonzero"})
    negative_run["pass"] = negative_run["exitCode"] != 0 and "grind" in negative_run["stdout"]
    records.append(negative_run)

    changes = [
        ("mixed-cross-term-must-fail",
         "D (E x) * y + E x * D y + D x * E y + x * D (E y)",
         "D (E x) * y + D x * E y + x * D (E y)"),
        ("cylindrical-frame-term-must-fail",
         "w * (nr * Ct - nt * Cr) + Dr Ct + ir * Ct",
         "w * (nr * Ct - nt * Cr) + Dr Ct"),
    ]
    for identifier, old, new in changes:
        if text.count(old) != 1:
            raise RuntimeError("A negative mutation does not match exactly one source expression")
        mutated = work / (identifier + ".lean")
        mutated.write_text(text.replace(old, new))
        mutation = run(command + [str(mutated)], env=env)
        mutation.update({"id": identifier, "expectedExit": "nonzero",
                         "mutation": {"old": old, "new": new},
                         "sourceSHA256": sha(mutated)})
        mutation["pass"] = (mutation["exitCode"] != 0 and "grind" in mutation["stdout"] and
                            "failed to locate" not in mutation["stdout"] and
                            "unknown module" not in mutation["stdout"])
        records.append(mutation)
    for record in records:
        log = output / (record["id"] + ".log")
        log.write_text(record["stdout"] + record["stderr"])
        record["log"] = log.name
        record["logSHA256"] = sha(log)
        del record["stdout"]
        del record["stderr"]
    unchanged = kernel_before == sha(kernel) and driver_source_before == sha(driver_source)
    result = {"schema": "MathScope.M2.Navier.LeanDifferentialAlgebraAudit/1",
              "generatedAt": datetime.now(timezone.utc).isoformat(),
              "toolchain": toolchain, "version": version["stdout"].strip(),
              "officialArchive": archive, "officialArchiveURL": pins["leanArchive"],
              "pinsSHA256": sha(pins_path), "kernelSHA256": kernel_before,
              "officialFrontendSHA256": sha(root / "bin/lean"), "driver": driver,
              "source": str(source.relative_to(repo)), "sourceSHA256": sha(source),
              "compiledArtifacts": [{"name": file.name, "sha256": sha(file)}
                                    for file in sorted(module.parent.glob("DifferentialAlgebra.*"))],
              "declarations": rows, "primaryTheoremCount": len(TARGETS),
              "allowedFoundationalAxioms": sorted(ALLOWED_AXIOMS),
              "positiveSourceContainsNewAxiomOrSorry": False,
              "officialKernelAndExistingDriverUnchanged": unchanged,
              "runs": records, "pass": unchanged and all(r["pass"] for r in records),
              "scope": {"universalAlgebraTheoremsKernelChecked": True,
                        "noncommutativeMatrixOrderRetained": True,
                        "analyticDifferentiabilityPremisesDischarged": False,
                        "actualProfileInstantiatedInLean": False,
                        "actualCovariancePositivityKernelProved": False,
                        "actualPulseConvergenceKernelProved": False,
                        "globalPhysicalResidualKernelProved": False,
                        "fullSameProfileN5": False}}
    (output / "audit.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"pass": result["pass"], "primaryTheoremCount": len(TARGETS),
                      "runs": [{"id": r["id"], "exitCode": r["exitCode"], "pass": r["pass"]}
                               for r in records], "audit": str(output / "audit.json")}))
    if not result["pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
