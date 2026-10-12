"""Capture actual public P7 execution and fresh replay without accepting saved authority."""
from pathlib import Path
import argparse
import datetime
import gzip
import hashlib
import json
import shutil
import time
import urllib.error
import urllib.request


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


parser = argparse.ArgumentParser()
parser.add_argument("--repo", type=Path, required=True)
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--deployment-commit", required=True)
parser.add_argument("--deployment-receipt", type=Path, required=True)
args = parser.parse_args()
m3 = args.repo / "research-ide/mathscope-m3"
frozen = m3 / "p7/evidence/final-all64-20261012/attempt1"
manifest = json.loads((frozen / "manifest.json").read_bytes())
base_url = "https://mathscope-compute.onrender.com"
args.output.mkdir(parents=True, exist_ok=False)
shutil.copy2(__file__, args.output / "runner.py")
deployment_bytes = args.deployment_receipt.read_bytes()
deployment = json.loads(deployment_bytes)
assert deployment["status"] == "live" and deployment["commit"]["id"] == args.deployment_commit
(args.output / "render-deployment.json").write_bytes(deployment_bytes)
receipt = {"schema": "MathScope.M3.PublicP7APIAcceptance/1", "startedAt": now(),
           "apiURL": base_url, "deploymentCommit": args.deployment_commit,
           "deploymentID": deployment["id"], "renderDeploymentReceiptSHA256": hashlib.sha256(deployment_bytes).hexdigest(),
           "frozenManifestSHA256": hashlib.sha256((frozen / "manifest.json").read_bytes()).hexdigest(),
           "expectedSourceEpochSHA256": manifest["sourceEpochSHA256"],
           "status": "IN_PROGRESS", "runs": [], "wholeM3Complete": False}


def save_receipt():
    (args.output / "receipt.json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n")


def http(path, name, value=None):
    request = urllib.request.Request(base_url + path, data=canonical(value) if value is not None else None,
                                     headers={"Accept": "application/json", "Content-Type": "application/json"})
    start = time.monotonic()
    try:
        with urllib.request.urlopen(request, timeout=110) as response:
            raw, code = response.read(), response.status
    except urllib.error.HTTPError as exc:
        raw, code = exc.read(), exc.code
    payload = gzip.compress(raw, mtime=0)
    path = args.output / (name + ".json.gz")
    with path.open("xb") as stream:
        stream.write(payload)
    meta = {"file": path.name, "rawSHA256": hashlib.sha256(raw).hexdigest(),
            "gzipSHA256": hashlib.sha256(payload).hexdigest(), "rawBytes": len(raw),
            "gzipBytes": len(payload), "statusCode": code,
            "elapsedSeconds": time.monotonic() - start}
    assert code == 200, (path.name, code, raw[:1000])
    return json.loads(raw), meta


def verify_record(record, request, capabilities):
    assert record["schema"] == "MathScope.M3.P7Execution/1"
    assert record["request"] == request and record["inputSHA256"] == digest(request)
    assert record["recordSHA256"] == digest({k: v for k, v in record.items() if k != "recordSHA256"})
    assert record["sourceBinding"] == capabilities["sourceBinding"] == manifest["sourceBinding"]
    assert record["predecessor"] == capabilities["predecessor"] == manifest["predecessor"]
    assert record["environmentSHA256"] == digest(record["environment"])
    environment = record["environment"]
    assert environment["system"] == "Linux" and environment["implementation"] == "CPython"
    if request["kind"] == "p7.elliptic_local":
        assert environment["numericBackend"] is None
    else:
        numeric = environment["numericBackend"]
        assert (numeric["pythonFlint"], numeric["FLINT"], numeric["FLINTRelease"]) == ("0.9.0", "3.6.0", 30600)
        assert numeric["importedPackageMatchesDistribution"] is True and numeric["observedModuleOriginsChecked"] is True
        assert numeric["runtimeFileCount"] > 0 and len(numeric["runtimeFilesSHA256"]) == 64
    if request["kind"] in {"p7.elliptic_arithmetic", "p7.elliptic_complex", "p7.result_claim", "p7.modular_symbols"}:
        assert environment["arithmeticBackend"] == capabilities["arithmeticBackend"]["fingerprint"]
    execution = record["execution"]
    assert execution["status"] == "COMPLETED" and execution["observedExitCode"] == 0
    assert not execution["timedOut"]
    assert execution["maxSeconds"] == 90 and execution["memoryLimitMiB"] == 384
    assert execution["observedChildResourceLimits"] == {"addressSpaceBytes": [402653184, 402653184], "cpuSeconds": [90, 91]}
    assert execution["observedChildEnvironmentSHA256"] == record["environmentSHA256"]
    assert record["mathematicalSHA256"] == digest({"request": request, "result": record["result"]})
    assert all(record[k] is False for k in ("formalLeanProofIssued", "wholeP7Complete", "wholeM3Complete"))
    assert record["serializedAuthority"] == "UNTRUSTED_REQUIRES_REEXECUTION"


save_receipt()
try:
    health, receipt["healthHTTP"] = http("/health", "health")
    assert health["ok"] is True and health["service"] == "MathScopeCompute"
    receipt["health"] = health
    caps, receipt["capabilitiesHTTP"] = http("/v1/p7/capabilities", "capabilities")
    assert caps["sourceBinding"] == manifest["sourceBinding"]
    assert digest(caps["sourceBinding"]) == manifest["sourceEpochSHA256"]
    assert sorted(caps["kinds"]) == sorted(manifest["expectedKinds"])
    assert caps["arithmeticBackend"]["status"] == "AVAILABLE"
    pari = caps["arithmeticBackend"]["fingerprint"]
    assert pari["version"] == "2.19.0" and pari["sourceArchiveSHA256"] == "f317b9722eb5d9094a60303774f066f3a83e3ec1f170be8546c44d7583f30b6d"
    assert pari["sourceVerifiedBeforeBuild"] is True and pari["observedVersionMatchesBuild"] is True
    assert pari["databasesUsed"] is False and pari["binaryBytes"] > 0 and len(pari["binarySHA256"]) == 64
    assert caps["limits"]["maxConcurrent"] == 1 and caps["limits"]["maxSeconds"] == 90 and caps["limits"]["memoryMiB"] == 384
    assert all(caps[k] is False for k in ("wholeP7Complete", "wholeM3Complete", "universalRHProved", "universalBSDProved"))
    receipt["capabilitiesVerified"] = True
    for original in manifest["runs"]:
        request_path = frozen / original["request"]["path"]
        request_bytes = request_path.read_bytes()
        assert hashlib.sha256(request_bytes).hexdigest() == original["request"]["sha256"]
        request = json.loads(request_bytes)
        record, run_http = http("/v1/p7/run", original["id"] + "-run", request)
        verify_record(record, request, caps)
        assert record["result"].get("status") == original["resultStatus"]
        replay, replay_http = http("/v1/p7/replay", original["id"] + "-replay", record)
        assert replay["schema"] == "MathScope.M3.P7Replay/1" and replay["status"] == "MATCH"
        assert replay["previousRecordSHA256"] == record["recordSHA256"]
        assert replay["importedProofStatusAdopted"] is False
        verify_record(replay["fresh"], request, caps)
        assert replay["fresh"]["environment"] == record["environment"]
        assert replay["fresh"]["mathematicalSHA256"] == record["mathematicalSHA256"]
        assert replay["fresh"]["recordSHA256"] != record["recordSHA256"]
        row = {"id": original["id"], "kind": request["kind"], "runHTTP": run_http,
               "replayHTTP": replay_http, "recordSHA256": record["recordSHA256"],
               "mathematicalSHA256": record["mathematicalSHA256"],
               "sameMathematicalHashAsLocalFrozenRun": record["mathematicalSHA256"] == original["mathematicalSHA256"],
               "semanticComparisonStatus": "EXACT_RESULT_MATCH" if record["mathematicalSHA256"] == original["mathematicalSHA256"] else "DIFFERENT_REQUIRES_REVIEW",
               "executionStatus": record["execution"]["status"], "resultStatus": record["result"].get("status"),
               "replayStatus": replay["status"], "sourceAndEnvironmentVerified": True}
        receipt["runs"].append(row)
        save_receipt()
        print(json.dumps({"completed": len(receipt["runs"]), "total": len(manifest["runs"]),
                          "id": row["id"], "resultStatus": row["resultStatus"], "replay": "MATCH"}), flush=True)
    caps_after, receipt["capabilitiesAfterHTTP"] = http("/v1/p7/capabilities", "capabilities-after")
    assert caps_after["sourceBinding"] == caps["sourceBinding"]
    assert caps_after["arithmeticBackend"] == caps["arithmeticBackend"] and caps_after["limits"] == caps["limits"]
    assert len(receipt["runs"]) == 25
    all_exact = all(row["sameMathematicalHashAsLocalFrozenRun"] for row in receipt["runs"])
    receipt.update(status="PASS" if all_exact else "EXECUTION_REPLAY_PASS_SEMANTIC_REVIEW_REQUIRED",
                   acceptanceReady=all_exact, finishedAt=now(), sourceUnchanged=True, actualRuns=25, freshReplays=25,
                   scope="Observed public HTTP execution and fresh replay; every result differing from the local frozen result requires a separate exact semantic review before acceptance.")
    save_receipt()
except BaseException as exc:
    receipt.update(status="FAILED", finishedAt=now(), failure={"type": type(exc).__name__, "detail": str(exc)})
    save_receipt()
    raise
