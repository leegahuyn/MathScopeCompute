#!/usr/bin/env python3
"""Fresh P7 subprocess controls; replay rejection is not an RH/BSD proof.

No imported result or its hashes are a source of authority. Both positive and
negative replay execute the immutable P7 runner. The exported compact receipt
is itself untrusted serialized evidence and does not authenticate a later run.
"""
from __future__ import annotations

import argparse
from copy import deepcopy
from datetime import datetime, timezone
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import sys

M3_ROOT = Path(__file__).resolve().parents[2]
if str(M3_ROOT) not in sys.path:
    sys.path.insert(0, str(M3_ROOT))
import cli

SCHEMA = "MathScope.M3.P8.P7MutationAudit/1"
REQUESTS = {
    "zero-box": {"kind": "p7.zeta_zeros", "input": {
        "height": "20", "precisionBits": 128, "tolerance": "1e-12",
        "maxCells": 16384, "maxDepth": 24, "maxEvaluations": 100000,
        "timeoutSeconds": 45}},
    "rank-upper": {"kind": "p7.elliptic_local", "input": {
        "model": "37a1", "primes": [2, 3, 5, 7, 37], "coefficientLimit": 16}},
}
# These are an explicit audit fixture, not a claim to enumerate the whole app.
DEPENDENCY_EDGES = (
    ("zero-box", "finite-height-record"),
    ("finite-height-record", "zero-coverage-comparison"),
    ("zero-coverage-comparison", "conditional-rh-review"),
    ("rank-upper", "rank-bound-record"),
    ("rank-bound-record", "curve-rank-equality"),
    ("curve-rank-equality", "bsd-review"),
)


def dependency_invalidation(changed):
    if changed not in REQUESTS:
        raise ValueError("unsupported mutation dependency root")
    affected = {changed}
    while True:
        following = affected | {b for a, b in DEPENDENCY_EDGES if a in affected}
        if following == affected:
            break
        affected = following
    nodes = sorted({n for edge in DEPENDENCY_EDGES for n in edge} | {"unrelated-observation"})
    return {"scope": "DECLARED_AUDIT_DEPENDENCY_FIXTURE",
            "direction": "PREREQUISITE_TO_DEPENDENT",
            "edges": [{"from": a, "to": b} for a, b in DEPENDENCY_EDGES],
            "changedNode": changed, "revokedNodeIds": sorted(affected),
            "badges": [{"id": n, "status": "REVOKED" if n in affected else "UNCHANGED_UNVERIFIED_METADATA",
                        "proofAuthority": False} for n in nodes],
            "wholeApplicationGraphAudited": False, "certificateIssued": False}


def reseal_computation_hashes(value):
    """Use the existing zero backend's ASCII canonical computation seal."""
    if isinstance(value, list):
        for item in value:
            reseal_computation_hashes(item)
    elif isinstance(value, dict):
        for key, item in list(value.items()):
            if key != "computationSha256":
                reseal_computation_hashes(item)
        if "computationSha256" in value:
            body = {k: v for k, v in value.items() if k != "computationSha256"}
            encoded = json.dumps(body, ensure_ascii=True, sort_keys=True,
                                 separators=(",", ":"), allow_nan=False).encode("ascii")
            value["computationSha256"] = hashlib.sha256(encoded).hexdigest()


def reseal_record(record):
    reseal_computation_hashes(record["result"])
    record["mathematicalSHA256"] = cli.digest({"request": record["request"], "result": record["result"]})
    record["recordSHA256"] = cli.digest({k: v for k, v in record.items() if k != "recordSHA256"})
    return record


def forge_record(actual, case):
    forged = deepcopy(actual)
    if case == "zero-box":
        box = forged["result"]["hardyRoots"][0]
        before = {key: box[key] for key in ("lower", "upper", "bracketWidth")}
        # Preserve width and declared sign/multiplicity metadata. Fresh Hardy
        # evaluation, not a trivial reversed-interval check, must catch this.
        for key in ("lower", "upper"):
            box[key] = str(Fraction(box[key]) + 1)
        after = {key: box[key] for key in before}
        changes = [{"fieldPath": "result.hardyRoots[0]", "before": before, "after": after}]
    elif case == "rank-upper":
        rank = forged["result"]["arithmeticRank"]
        before = deepcopy(rank)
        rank.update({"upperBound": 1, "exactRank": 1, "descentPerformed": True,
                     "selmerBoundComputed": True,
                     "upperBoundCertificate": {"kind": "FORGED_SELMER_UPPER_BOUND",
                                                "bound": 1, "verified": True}})
        forged["result"]["scope"]["arithmeticRankUpperBoundComputed"] = True
        changes = [{"fieldPath": "result.arithmeticRank", "before": before, "after": deepcopy(rank)},
                   {"fieldPath": "result.scope.arithmeticRankUpperBoundComputed", "before": False, "after": True}]
    else:
        raise ValueError("unsupported fixed mutation")
    return reseal_record(forged), changes


def _receipt(record):
    return {"schema": record["schema"], "recordSHA256": record["recordSHA256"],
            "mathematicalSHA256": record["mathematicalSHA256"],
            "inputSHA256": record["inputSHA256"], "environmentSHA256": record["environmentSHA256"],
            "sourceBindingSHA256": cli.digest(record["sourceBinding"]),
            "predecessorSHA256": cli.digest(record["predecessor"]),
            "execution": deepcopy(record["execution"]),
            "serializedAuthority": record["serializedAuthority"],
            "formalLeanProofIssued": record["formalLeanProofIssued"],
            "wholeP7Complete": record["wholeP7Complete"], "wholeM3Complete": record["wholeM3Complete"]}


def _completed(record):
    return (record["execution"]["status"] == "COMPLETED"
            and record["execution"]["observedExitCode"] == 0
            and record["execution"]["timedOut"] is False)


def binding_rejections(actual):
    controls = []
    variants = []
    source = deepcopy(actual)
    source["sourceBinding"]["files"][0]["sha256"] = "0" * 64
    variants.append(("source", source))
    inputs = deepcopy(actual)
    if actual["request"]["kind"] == "p7.zeta_zeros":
        inputs["request"]["input"]["height"] = "30"
        precision = deepcopy(actual)
        precision["request"]["input"]["precisionBits"] = 192
        variants.append(("precision", precision))
    else:
        inputs["request"]["input"]["coefficientLimit"] = 17
    variants.append(("input", inputs))
    for name, altered in variants:
        # Keep the old input digest deliberately: a saved result cannot borrow
        # different inputs/precision merely by resealing its outer envelope.
        reseal_record(altered)
        rejected, reason = False, None
        try:
            cli.validate_record(altered)
        except ValueError as exc:
            rejected, reason = True, str(exc)
        controls.append({"axis": name, "status": "REJECTED" if rejected else "FAILED_TO_REJECT",
                         "stage": "P7_VALIDATE_RECORD_BEFORE_REPLAY", "reason": reason,
                         "outerAndMathematicalHashesResealed": True,
                         "originalInputHashPreserved": altered["inputSHA256"] == actual["inputSHA256"],
                         "proofStatusAdopted": False})
    return controls


def run_case(case, *, max_seconds=90, memory_mib=768):
    request = deepcopy(REQUESTS[case])
    actual = cli.execute(request, max_seconds=max_seconds, memory_mib=memory_mib)
    if not _completed(actual):
        raise RuntimeError(f"{case} baseline did not complete: {actual['execution']}")
    result = actual["result"]
    if case == "zero-box" and not (result["status"] == "FINITE_RH_TO_T" and result["pass"] is True):
        raise RuntimeError("zero baseline did not produce its finite-height certificate")
    if case == "rank-upper" and not (result["arithmeticRank"]["lowerBound"] == 1
                                     and result["arithmeticRank"]["upperBound"] is None
                                     and result["scope"]["arithmeticRankUpperBoundComputed"] is False):
        raise RuntimeError("rank baseline no longer has the expected explicit open upper bound")
    original_bytes = cli.canonical(actual)
    positive = cli.replay(actual, max_seconds=max_seconds, memory_mib=memory_mib)
    forged, changes = forge_record(actual, case)
    # A fully self-consistent serialization must pass this structural gate.
    cli.validate_record(forged)
    negative = cli.replay(forged, max_seconds=max_seconds, memory_mib=memory_mib)
    protected = ("request", "inputSHA256", "sourceBinding", "environment", "environmentSHA256", "predecessor")
    binding = {key: actual[key] == forged[key] == negative["fresh"][key] for key in protected}
    rejections = binding_rejections(actual)
    positive_ok = positive["status"] == "MATCH" and _completed(positive["fresh"])
    negative_ok = (negative["status"] == "MISMATCH_OR_UNRESOLVED" and _completed(negative["fresh"])
                   and negative["fresh"]["mathematicalSHA256"] == actual["mathematicalSHA256"]
                   and negative["fresh"]["mathematicalSHA256"] != forged["mathematicalSHA256"])
    unchanged = cli.canonical(actual) == original_bytes
    passed = (positive_ok and negative_ok and unchanged and all(binding.values())
              and all(row["status"] == "REJECTED" for row in rejections)
              and positive["importedProofStatusAdopted"] is False
              and negative["importedProofStatusAdopted"] is False)
    return {"id": case, "status": "PASS" if passed else "FAILED",
            "request": request, "baseline": _receipt(actual),
            "positiveControl": {"status": positive["status"], "passed": positive_ok,
                                "importedProofStatusAdopted": positive["importedProofStatusAdopted"],
                                "fresh": _receipt(positive["fresh"])},
            "negativeControl": {"status": negative["status"], "passed": negative_ok,
                                "freshCompletedRequired": True, "unresolvedCountsAsRejection": False,
                                "allPresentComputationHashesResealed": True,
                                "mathematicalAndRecordHashesResealed": True,
                                "structuralValidationPassedBeforeReplay": True,
                                "importedProofStatusAdopted": negative["importedProofStatusAdopted"],
                                "mutations": changes, "forged": _receipt(forged),
                                "fresh": _receipt(negative["fresh"])},
            "bindingPreserved": binding, "bindingRejectionControls": rejections,
            "originalRecordUnchanged": unchanged,
            "downstream": dependency_invalidation(case),
            "mathematicalScope": {"mutationDetection": "FRESH_P7_RESULT_COMPARISON",
                                  "rankUpperBoundComputed": False, "rankUpperBoundStatus": "OPEN",
                                  "globalRHProved": False, "globalBSDProved": False,
                                  "finiteHeightOnly": case == "zero-box"},
            "certificateIssued": False}


def run_audit(*, max_seconds=90, memory_mib=768):
    started = datetime.now(timezone.utc).isoformat()
    rows = [run_case(case, max_seconds=max_seconds, memory_mib=memory_mib) for case in REQUESTS]
    report = {"schema": SCHEMA, "status": "PASS" if all(r["status"] == "PASS" for r in rows) else "FAILED",
              "criterion": "P8-06", "cases": rows,
              "execution": {"startedAt": started, "finishedAt": datetime.now(timezone.utc).isoformat(),
                            "freshP7ChildExecutions": 6, "maxSecondsPerChild": max_seconds,
                            "memoryLimitMiB": memory_mib},
              "auditSourceSHA256": cli.file_hash(__file__), "sourceBinding": cli.source_binding(),
              "serializedAuthority": "UNTRUSTED_REQUIRES_REEXECUTION",
              "receiptMeaning": "Recorded execution of two finite negative controls; loading this JSON never reruns a validator.",
              "originalP8CriterionComplete": False, "wholeP8Complete": False, "wholeM3Complete": False,
              "formalLeanProofIssued": False, "globalRHProved": False, "globalBSDProved": False,
              "arithmeticRankUpperBoundComputed": False, "certificateIssued": False}
    report["reportSHA256"] = cli.digest(report)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--max-seconds", type=int, default=90)
    parser.add_argument("--memory-mib", type=int, default=768)
    args = parser.parse_args()
    report = run_audit(max_seconds=args.max_seconds, memory_mib=args.memory_mib)
    if args.output:
        cli.write_new(args.output, report)
        print(json.dumps({"status": report["status"], "output": str(args.output),
                          "reportSHA256": report["reportSHA256"]}))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False))
    return 0 if report["status"] == "PASS" else 2


if __name__ == "__main__":
    raise SystemExit(main())
