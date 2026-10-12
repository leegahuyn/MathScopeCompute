#!/usr/bin/env python3
"""Compile the pinned real finite Y7 bridge and actual hypothesis-removal controls.

All transported receipts remain observations. This audit never treats an authored
proof, a failed dependency download, or an absent hypothesis as a successful proof.
"""
from __future__ import annotations

import argparse
import datetime as dt
import importlib.util
import json
from pathlib import Path
import re
import sys

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
LEAN = HERE / "lean"
HELPER = HERE.parent / "p8/tools/audit_lean.py"
SPEC = importlib.util.spec_from_file_location("mathscope_real_audit_helpers", HELPER)
helpers = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(helpers)
sha, canonical, command = helpers.sha, helpers.canonical, helpers.command
PREFIX = "MathScope.M3.Gauge.RealSpectral."
TARGETS = [PREFIX + name for name in [
    "finite_weighted_exp_envelope",
    "log_ratio_lower_bound",
    "log_gap_positive",
    "conservative_log_lower_bound",
    "TransferEnclosure.nonvacuum_lower_bound",
    "TransferEnclosure.certified_gap",
    "TransferEnclosure.nonvacuum_exp_envelope",
    "four_state_certified_gap",
]]


def source_manifest():
    paths = [LEAN / "RealSpectralBridge.lean", LEAN / "lakefile.lean",
             LEAN / "lean-toolchain", LEAN / "real-pins.json", HERE / "verify_real_lean.py",
             HELPER, REPO / ".github/workflows/gauge-real-spectral-verification.yml"]
    return [{"path": p.relative_to(REPO).as_posix(), "sha256": sha(p.read_bytes())}
            for p in sorted(paths)]


def check_static():
    pins = json.loads((LEAN / "real-pins.json").read_text())
    if (LEAN / "lean-toolchain").read_text().strip() != pins["leanToolchain"]:
        raise ValueError("Lean toolchain pin mismatch")
    if pins["mathlibCommit"] not in (LEAN / "lakefile.lean").read_text():
        raise ValueError("Mathlib source pin mismatch")
    source = helpers.strip_comments((LEAN / "RealSpectralBridge.lean").read_text())
    if re.search(r"\b(?:sorry|admit|axiom|unsafe|native_decide|implemented_by)\b", source):
        raise ValueError("Unsupported proof construct in real finite bridge")
    for row in removal_sources():
        if row["positiveSource"].count(row["removedBinder"]) != 1:
            raise ValueError("Hypothesis removal is not a unique literal source edit")
        if row["removedBinder"] in row["negativeSource"]:
            raise ValueError("Hypothesis was retained in negative source")
    source_manifest()
    return pins


def audit_source():
    lines = ["import RealSpectralBridge", "set_option pp.fullNames true",
             "set_option pp.universes false", ""]
    for name in TARGETS:
        lines.extend([f'#eval IO.println "Y7_REAL_AUDIT_BEGIN {name}"',
                      f"#check {name}", f"#print axioms {name}",
                      f'#eval IO.println "Y7_REAL_AUDIT_END {name}"', ""])
    return "\n".join(lines)


def removal_sources():
    prefix = "import RealSpectralBridge\nopen MathScope.M3.Gauge.RealSpectral\nopen scoped BigOperators\n\n"
    weighted = prefix + """example (model : FiniteSpectralModel)
  (weight excess : Fin model.dimension → ℝ) (delta time : ℝ)
  (hDelta : 0 < delta)
  (hTime : 0 ≤ time)
  (hWeight : ∀ j, 0 ≤ weight j)
  (hExcess : ∀ j, 0 ≤ excess j)
  : 0 < delta ∧ spectralSum model weight excess delta time ≤
      Real.exp (-delta * time) * ∑ j, weight j := by
  exact finite_weighted_exp_envelope model weight excess delta time hDelta hTime hWeight hExcess
"""
    ratio = prefix + """example (spacing ratio r : ℝ)
  (hAt : 0 < spacing)
  (hRatio : 0 < ratio)
  (hUpper : ratio ≤ r)
  : -Real.log r / spacing ≤ -Real.log ratio / spacing := by
  exact log_ratio_lower_bound spacing ratio r hAt hRatio hUpper
"""
    positive = prefix + """example (spacing r : ℝ)
  (hAt : 0 < spacing)
  (hRatioPositive : 0 < r)
  (hRatioBelowOne : r < 1)
  : 0 < -Real.log r / spacing := by
  exact log_gap_positive spacing r hAt hRatioPositive hRatioBelowOne
"""
    nonvacuum = prefix + """example (model : FiniteSpectralModel)
  (certificate : TransferEnclosure model) (j : Fin model.dimension)
  (hNonvacuum : j ∈ certificate.excited)
  : certificate.gap ≤ certificate.energy j := by
  exact (certificate.nonvacuum_lower_bound j hNonvacuum).2.2
"""
    cases = [
        ("Delta", weighted, "hDelta", "  (hDelta : 0 < delta)\n"),
        ("Weight", weighted, "hWeight", "  (hWeight : ∀ j, 0 ≤ weight j)\n"),
        ("Excess", weighted, "hExcess", "  (hExcess : ∀ j, 0 ≤ excess j)\n"),
        ("ForwardTime", weighted, "hTime", "  (hTime : 0 ≤ time)\n"),
        ("TimeSpacing", ratio, "hAt", "  (hAt : 0 < spacing)\n"),
        ("PositiveRatio", ratio, "hRatio", "  (hRatio : 0 < ratio)\n"),
        ("RatioEnclosure", ratio, "hUpper", "  (hUpper : ratio ≤ r)\n"),
        ("RatioBelowOne", positive, "hRatioBelowOne", "  (hRatioBelowOne : r < 1)\n"),
        ("Nonvacuum", nonvacuum, "hNonvacuum", "  (hNonvacuum : j ∈ certificate.excited)\n"),
    ]
    return [{"id": name, "hypothesis": hypothesis, "removedBinder": binder,
             "positiveSource": source, "negativeSource": source.replace(binder, "", 1)}
            for name, source, hypothesis, binder in cases]


def expected_removal(log, exit_code, filename, hypothesis):
    errors = [line.strip() for line in log.splitlines()
              if re.search(r": error(?:\([^)]*\))?:", line)]
    pattern = (r"(?:.*[/\\])?" + re.escape(filename) +
               r":\d+:\d+: error(?:\(lean\.unknown(?:Identifier|Constant)\))?: " +
               r"Unknown (?:identifier|constant) [`']" + re.escape(hypothesis) + r"[`']")
    return exit_code > 0 and len(errors) == 1 and bool(re.fullmatch(pattern, errors[0]))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check-static", action="store_true")
    parser.add_argument("--output", type=Path, default=HERE / "evidence/real-lean-audit")
    args = parser.parse_args()
    if args.check_static:
        check_static()
        print("Real spectral source/pin checks passed; Lean has not run.")
        return
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    result = {"schema": "MathScope.M3.GaugeRealLeanAudit/1", "status": "FAILED",
              "checkedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
              "serializedAuthority": "UNTRUSTED_REQUIRES_REEXECUTION",
              "scope": "Printed real finite spectral declarations for the declared model/cutoff; no continuum or infinite-volume reconstruction.",
              "wholeY7Complete": False, "wholeM3Complete": False,
              "continuumMassGapProved": False, "targets": [], "hypothesisRemovalControls": []}
    try:
        pins = check_static()
        before = source_manifest()
        _, version = command(["lake", "env", "lean", "--version"], LEAN, output, "lean-version")
        if not re.search(r"version\s+" + re.escape(pins["leanVersion"]) + r"(?:\D|$)", version) or pins["leanCommit"][:12] not in version:
            raise ValueError("Unexpected Lean version/commit")
        _, prefix = command(["lake", "env", "lean", "--print-prefix"], LEAN, output, "lean-prefix")
        lean_root = Path(prefix.strip())
        _, commit = command(["git", "rev-parse", "HEAD"], LEAN / ".lake/packages/mathlib", output, "mathlib-commit")
        if commit.strip() != pins["mathlibCommit"]:
            raise ValueError("Mathlib checkout pin mismatch")
        artifact = LEAN / ".lake/build/lib/lean/RealSpectralBridge.olean"
        artifact.parent.mkdir(parents=True, exist_ok=True)
        build, _ = command(["lake", "env", "lean", "-o", str(artifact), "RealSpectralBridge.lean"], LEAN, output, "build-real-spectral")
        result["build"] = build
        audit_file = output / "AuditReal.lean"
        audit_file.write_text(audit_source())
        audit_run, log = command(["lake", "env", "lean", str(audit_file)], LEAN, output, "fresh-real-consumer-audit")
        # Reuse the strict, source-bound parser; marker renaming does not alter
        # any theorem type or printed axiom list.
        targets = helpers.parse_targets(log.replace("Y7_REAL_AUDIT_", "P8_AUDIT_"), TARGETS)
        result.update(targets=targets, consumerAudit=audit_run,
                      positiveOleanSha256=sha(artifact.read_bytes()))
        for source in removal_sources():
            good = output / ("Consumer_" + source["id"] + ".lean")
            bad = output / ("Removed_" + source["id"] + ".lean")
            good.write_text(source["positiveSource"])
            bad.write_text(source["negativeSource"])
            accepted, _ = command(["lake", "env", "lean", str(good)], LEAN, output, good.stem)
            rejected, diagnostics = command(["lake", "env", "lean", str(bad)], LEAN, output, bad.stem, check=False)
            observed = expected_removal(diagnostics, rejected["exitCode"], bad.name, source["hypothesis"])
            result["hypothesisRemovalControls"].append({
                "id": source["id"], "hypothesis": source["hypothesis"],
                "positiveSourceSha256": sha(good.read_bytes()),
                "negativeSourceSha256": sha(bad.read_bytes()),
                "removedBinder": source["removedBinder"], "sourceRegenerated": True,
                "positiveControl": accepted, "negativeControl": rejected,
                "expectedDiagnostic": "Unknown identifier " + source["hypothesis"],
                "expectedRejectionObserved": observed})
            if not observed:
                raise ValueError("Hypothesis removal lacked its exact semantic rejection: " + source["id"])
        previous_modules = helpers.MODULES
        try:
            helpers.MODULES = ["RealSpectralBridge"]
            closure = helpers.closure_manifest(LEAN, lean_root)
        finally:
            helpers.MODULES = previous_modules
        closure_bytes = canonical(closure) + b"\n"
        (output / "import-closure.json").write_bytes(closure_bytes)
        if source_manifest() != before:
            raise ValueError("Sources changed during audit")
        result.update(status="KERNEL_CHECKED_REAL_FINITE_SCOPES", sourceFiles=before,
                      sourceManifestSha256=sha(canonical(before)), customAxioms=[], absenceOfSorry=True,
                      environment={"leanVersion": version.strip(), "leanCommit": pins["leanCommit"],
                                   "mathlibCommit": commit.strip(),
                                   "leanBinarySha256": sha((lean_root / "bin/lean").read_bytes()),
                                   "runtimeLibrarySha256": sha((lean_root / "lib/lean/libleanshared.so").read_bytes()),
                                   "lakeManifestSha256": sha((LEAN / "lake-manifest.json").read_bytes()),
                                   "importClosureSha256": sha(closure_bytes),
                                   "importedModuleCount": len(closure["modules"]),
                                   "kernelModified": False, "runtimeModified": False})
    except Exception as exc:
        result["error"] = {"type": type(exc).__name__, "message": str(exc)}
    (output / "audit.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(result["status"])
    if result["status"] != "KERNEL_CHECKED_REAL_FINITE_SCOPES":
        print(result.get("error"), file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
