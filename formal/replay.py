"""Replay the fixed Golden algebra source in Lean; never accept supplied code.

This receipt is local evidence, not an authenticated cloud response. An imported
receipt must remain historical until a trusted verifier runs the source again.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parent
CLAIM = "GOLDEN-NONLINEAR-ALGEBRA-001"
SOURCE_HASH = "6e5dca8c5675e0c262d80ddd351b3cb6ea0ff5111b00873435893e3ed513daeb"
TOOLCHAIN = "leanprover/lean4:v4.34.0-rc2"
LEAN_COMMIT = "6a10ac8c22beadecabdbb0919c2b50214762f91d"
THEOREMS = ["MathScope.GoldenElliptic." + name for name in (
    "exact_perturbation", "constant_one_stationary", "constant_one_linear_coefficient")]
AXIOMS = ["Classical.choice", "Quot.sound", "propext"]


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def valid_audit(output: str) -> bool:
    rows = re.findall(r"'([^']+)' depends on axioms: \[([^\]]*)\]", output)
    if len(rows) != len(THEOREMS) or "sorryAx" in output:
        return False
    return all(len(matches := [row for row in rows if row[0] == name]) == 1
               and sorted(x.strip() for x in matches[0][1].split(",") if x.strip()) == AXIOMS
               for name in THEOREMS)


def check_package() -> dict:
    source = (ROOT / "GoldenAlgebra.lean").read_bytes()
    manifest_bytes = (ROOT / "golden-manifest.json").read_bytes()
    manifest = json.loads(manifest_bytes)
    if (digest(source) != SOURCE_HASH or manifest["sourceHash"] != SOURCE_HASH
            or manifest["claimId"] != CLAIM
            or (ROOT / "lean-toolchain").read_text().strip() != TOOLCHAIN):
        raise ValueError("Golden source/toolchain integrity failure")
    return {"source": source.decode(), "sourceHash": SOURCE_HASH,
            "dependencyLockHash": digest(manifest_bytes), "manifest": manifest}


def replay() -> dict:
    package = check_package()
    lean = shutil.which("lean")
    if lean is None:
        raise RuntimeError("Lean runtime missing; no formal verification performed")
    version = subprocess.run([lean, "--version"], cwd=ROOT, capture_output=True,
                             text=True, timeout=10, check=True).stdout.strip()
    if "version 4.34.0-rc2," not in version or LEAN_COMMIT not in version:
        raise RuntimeError("Pinned Lean runtime unavailable or changed")
    environment_hash = digest(canonical({"toolchain": TOOLCHAIN, "leanVersion": version,
                                        "dependencies": "Lean core only; no external packages"}))
    started = time.monotonic()
    try:
        completed = subprocess.run([lean, "GoldenAlgebra.lean"], cwd=ROOT,
                                   capture_output=True, text=True, timeout=90)
        code, stdout, stderr, timed_out = completed.returncode, completed.stdout, completed.stderr, False
    except subprocess.TimeoutExpired as error:
        code, stdout, stderr, timed_out = None, "", str(error), True
    audit = stdout.strip()
    formal = code == 0 and not timed_out and not stderr.strip() and valid_audit(audit)
    return {
        "id": str(uuid.uuid4()), "claimId": CLAIM, "service": "local-lean-replay",
        "mode": "restricted-golden-algebra", "verificationMode": "fresh-lean-process-per-request",
        "state": {"run": "SUCCESS" if formal else "ERROR", "evidence": "FORMAL" if formal else "NONE",
                  "truth": "SUPPORTED" if formal else "OPEN", "freshness": "CURRENT"},
        "source": package["source"], "sourceHash": SOURCE_HASH, "toolchain": TOOLCHAIN,
        "leanVersion": version, "environmentHash": environment_hash,
        "dependencyLockHash": package["dependencyLockHash"],
        "formalScope": package["manifest"]["formalScope"],
        "assumptions": package["manifest"]["assumptions"],
        "excludedClaims": package["manifest"]["excludedClaims"],
        "theoremNames": THEOREMS, "expectedAxioms": AXIOMS,
        "exitCode": code, "timedOut": timed_out, "elapsedMs": round((time.monotonic() - started) * 1000),
        "stdout": stdout, "stderr": stderr, "axiomAuditOutput": audit,
        "proofHash": digest(canonical({"sourceHash": SOURCE_HASH, "environmentHash": environment_hash,
                                        "axiomAuditOutput": audit})) if formal else None,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="Save the local replay receipt")
    args = parser.parse_args()
    result = replay()
    payload = json.dumps(result, indent=2, ensure_ascii=False)
    if args.output:
        args.output.write_text(payload + "\n", encoding="utf-8")
    else:
        print(payload)
    raise SystemExit(0 if result["state"]["run"] == "SUCCESS" else 1)
