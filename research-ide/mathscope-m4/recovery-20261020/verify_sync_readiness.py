#!/usr/bin/env python3
"""Audit repository evidence and preserve HOLD; never promotes acceptance rows."""
from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[3]
M3 = "research-ide/mathscope-m3/recovery-20261019"
M4 = "research-ide/mathscope-m4/recovery-20261019"


def read_json(relative: str):
    path = ROOT / relative
    return json.loads(path.read_text(encoding="utf-8"))


def git_blob_sha(path: Path) -> str:
    data = path.read_bytes()
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path, help="Optional JSON report path (prefer a path outside the repository in CI).")
    args = parser.parse_args()

    checks = []
    blockers = []

    def check(name: str, ok: bool, detail: str):
        checks.append({"name": name, "pass": bool(ok), "detail": detail})

    checkpoint = read_json("CHECKPOINT.json")
    m3_path = ROOT / f"{M3}/M3_CURRENT_ORIGINAL_LEDGER.json"
    m4_path = ROOT / f"{M4}/M4_ORIGINAL_ACCEPTANCE_MATRIX.json"
    m3 = json.loads(m3_path.read_text(encoding="utf-8"))
    m4 = json.loads(m4_path.read_text(encoding="utf-8"))
    cutoff_path = ROOT / f"{M3}/evidence/OUTER_CUTOFF_RUN.json"
    cutoff = json.loads(cutoff_path.read_text(encoding="utf-8"))
    native_path = ROOT / f"{M3}/native/evidence/ACTUAL_SLOW_INVERSE_VALIDATION.json"
    native = json.loads(native_path.read_text(encoding="utf-8"))
    capsule_path = ROOT / f"{M3}/native/evidence/SOURCE_CAPSULE.json"
    capsule = json.loads(capsule_path.read_text(encoding="utf-8"))

    check("m3_github_blob_pin", git_blob_sha(m3_path) == checkpoint["m3"]["githubBlobSha"],
          f"current={git_blob_sha(m3_path)} expected={checkpoint['m3']['githubBlobSha']}")
    check("m4_github_blob_pin", git_blob_sha(m4_path) == checkpoint["m4"]["githubBlobSha"],
          f"current={git_blob_sha(m4_path)} expected={checkpoint['m4']['githubBlobSha']}")
    check("m3_original_frontier_unchanged",
          m3.get("M3", {}).get("inherited_completed") == 62
          and m3.get("M3", {}).get("total") == 64
          and m3.get("M3", {}).get("newly_closed") == 0
          and set(m3.get("M3", {}).get("open", [])) == {"N7-06", "N8-05"}
          and m3.get("actual_last_resolved_tau") is None,
          "requires 62/64 inherited scope, zero newly closed, N7-06/N8-05 OPEN, tau=null")
    check("cutoff_receipt_scope_honest",
          cutoff.get("run_hash") == checkpoint["existingCutoffEvidence"]["runHash"]
          and cutoff.get("source_pins_unchanged") is True
          and cutoff.get("original_field_jets_remaining") == 67
          and cutoff.get("actual_nonzero_field_evaluated") is False
          and cutoff.get("N706_closed") is False
          and cutoff.get("N805_closed") is False
          and cutoff.get("actual_last_resolved_tau") is None,
          "authenticates the saved cutoff receipt without promoting it to energy/refinement closure")
    output_checks = []
    for row in cutoff.get("outputs", []):
        p = ROOT / row["path"]
        ok = p.is_file() and p.stat().st_size == row["bytes"] and sha256(p) == row["sha256"]
        output_checks.append(ok)
        check("cutoff_output_digest:" + row["path"], ok,
              f"exists={p.is_file()} expected_bytes={row['bytes']} expected_sha256={row['sha256']}")
    check("cutoff_all_output_digests", bool(output_checks) and all(output_checks),
          f"verified {sum(output_checks)} of {len(output_checks)} saved output hashes")
    check("native_source_capsule_binding",
          native.get("source_capsule_sha256") == capsule.get("capsule_payload_sha256"),
          "native result must refer to the exact saved source capsule")
    check("native_result_scope_honest",
          native.get("N7_06_closed") is False
          and native.get("N8_05_closed") is False
          and native.get("new_M3_closures") == 0
          and native.get("actual_global_last_resolved_tau") is None
          and native.get("actual_caller_coordinates_evaluated") is False,
          "native scalar inverse validation does not claim caller/global energy closure")

    expected_ids = {*(f"I3-{i:02d}" for i in range(1, 9)), *(f"R1-{i:02d}" for i in range(1, 9))}
    rows = m4.get("rows", [])
    counts = Counter(row.get("status") for row in rows)
    check("m4_original_16_rows",
          m4.get("originalCriteria") == 16 and len(rows) == 16 and {r.get("id") for r in rows} == expected_ids,
          "all original I3-01..08 and R1-01..08 rows must remain present")
    check("m4_statuses_not_promoted",
          counts == Counter({"PARTIAL": 14, "OPEN": 2})
          and m4.get("overallRelease") == "HOLD"
          and m4.get("finalAcceptance") == "UNCONFIRMED"
          and m4.get("acceptedCurrentRelease") is None,
          f"status_counts={dict(counts)} overall={m4.get('overallRelease')}")
    check("m4_external_state_not_claimed",
          m4.get("currentBrowserInspection") is False
          and m4.get("githubSaved") is False
          and m4.get("sitePublished") is False,
          "the original matrix still says browser inspection/GitHub save/site publication are unconfirmed")

    # Planned publication artifacts are release blockers, not integrity failures.
    # This audit is allowed to PASS_HOLD_PRESERVED when provenance is sound while
    # releaseReady remains false and missing publication inputs are reported below.
    planned_artifact_paths = [
        "public/v0.3.1.html",
        "public/websitepublisher-v118-followup-bundle.json",
        f"{M3}/evidence/FINITE_VS_CONTINUUM_N706_N805_RECEIPT.json",
        "research-ide/mathscope-m4/acceptance-review-20261019/evidence/followup-20261020/M4_FOLLOWUP_VERIFICATION_RECEIPT.json",
        "research-ide/mathscope-m4/acceptance-review-20261019/sync_m3_m4_and_v031.py",
        "research-ide/mathscope-m4/acceptance-review-20261019/verify_m4_modules.mjs",
    ]
    planned_artifacts = []
    for relative in planned_artifact_paths:
        present = (ROOT / relative).is_file()
        planned_artifacts.append({
            "path": relative,
            "present": present,
            "requiredForPublication": True,
        })
        if not present:
            blockers.append({"kind": "missing_repo_artifact", "path": relative})

    publisher = checkpoint["websitePublisherObserved"]
    blockers.append({"kind": "website_not_synchronized",
                     "detail": f"page v{publisher['page']['version']}/{publisher['page']['versionHash']}; runtime v{publisher['runtimeFragment']['version']}/{publisher['runtimeFragment']['versionHash']}"})
    blockers.append({"kind": "m3_continuum_open", "items": ["N7-06", "N8-05"], "actual_last_resolved_tau": None})
    blockers.append({"kind": "m4_acceptance_open", "counts": dict(counts), "overallRelease": "HOLD"})

    failed = [row for row in checks if not row["pass"]]
    report = {
        "schema": "MathScope.SyncReadinessAudit/1",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "repository": checkpoint["baseline"]["repository"],
        "branch": checkpoint["baseline"]["branch"],
        "auditReferenceCommit": checkpoint["baseline"]["headCommitBeforeCheckpoint"],
        "auditStatus": "PASS_HOLD_PRESERVED" if not failed else "FAIL_INTEGRITY_CHECK",
        "invariantChecksPassed": len(checks) - len(failed),
        "invariantChecksTotal": len(checks),
        "failedChecks": failed,
        "releaseReady": False,
        "overallRelease": "HOLD",
        "blockers": blockers,
        "plannedArtifacts": planned_artifacts,
        "checks": checks,
        "meaning": "Audit PASS means integrity invariants and HOLD/OPEN statuses are consistent. Missing publication inputs remain blockers and releaseReady stays false; audit PASS does not mean M3/M4 acceptance or publication is complete."
    }
    serialized = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(serialized, encoding="utf-8")
    print(serialized, end="")
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
