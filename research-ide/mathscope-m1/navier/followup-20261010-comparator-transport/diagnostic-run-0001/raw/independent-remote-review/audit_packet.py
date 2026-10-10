#!/usr/bin/env python3
"""Independent, read-only byte and observation audit of the remote guard A/B.

Does not import the diagnostic or its portable verifier, run a probe, change
a unit, or modify an existing packet. Only a new reviewer receipt is written.
"""
from pathlib import Path
import argparse
import datetime
import hashlib
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parent
PACKET = ROOT.parent / "remote-diagnostic-0001"
REPO = Path("/workspace/scratch/9a6c38c54c2e/MathScopeCompute")
PROBE_HASH = "ed35362b4f1b4ede2271357d5cdc5258eb6d5c5cdef11ad5957827261043fb0e"
PINS_HASH = "e702d85ac8590d14c5ab131b6afaaab3ff56466b96da626739df4b0c364d4ae8"
ZIP_HASH = "b99bc876ebfdb71cd641247bca1b6cad38c757d9431ba81f7c70ca28a122f2ba"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load(path):
    return json.loads(path.read_text())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--packet", type=Path, default=PACKET)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    if args.output.exists():
        raise ValueError("Reviewer receipts are append-only")
    packet = args.packet.resolve()
    extracted = packet / "extracted"
    checks, bindings = [], {}

    def check(name, value):
        checks.append({"name": name, "passed": bool(value)})

    def pin(path):
        data = path.read_bytes()
        bindings[str(path)] = {"sha256": digest(data), "bytes": len(data)}
        return data

    pin(Path(__file__))
    archive = packet / "original-guard-diagnostic-38013278865-1.zip"
    zip_bytes = pin(archive)
    check("archive exact bytes and SHA256", len(zip_bytes) == 44015 and digest(zip_bytes) == ZIP_HASH)
    with zipfile.ZipFile(archive) as z:
        members = [entry for entry in z.infolist() if not entry.is_dir()]
        check("exactly 25 uniquely named file members", len(members) == 25 and
              len({entry.filename for entry in members}) == 25)
        for entry in members:
            check("ZIP bytes: " + entry.filename, z.read(entry) == pin(extracted / entry.filename))
    source_receipt = load(packet / "actual-diagnostic-audit.json")
    pin(packet / "actual-diagnostic-audit.json")
    for item in source_receipt["inputs"]:
        data = pin(packet / item["path"])
        check("portable audit input: " + item["path"],
              digest(data) == item["sha256"] and len(data) == item["bytes"])
    check("portable audit 136 recorded checks passed", source_receipt["checksPassed"] ==
          source_receipt["checksTotal"] == len(source_receipt["checks"]) == 136 and
          all(row["passed"] for row in source_receipt["checks"]))
    result = load(extracted / "result.json")
    for name, expected in [("probe.py", PROBE_HASH), ("pins.json", PINS_HASH)]:
        check("fixed original bytes: " + name, digest(pin(REPO / "tools/ns-original-ci" / name)) ==
              digest(pin(extracted / name)) == digest(pin(extracted / ("source-" + name))) == expected)
    for name in ["diagnose.py", "transport.py", "metadata_probe.py"]:
        check("reviewed executed source: " + name, pin(REPO / "tools/ns-guard-ci" / name) ==
              pin(extracted / name) == pin(extracted / ("source-" + name)))
    for name, item in result["evidenceFiles"].items():
        data = pin(extracted / name)
        check("producer evidence pin: " + name, digest(data) == item["sha256"] and len(data) == item["bytes"])
    raw_response = load(packet / "job-log-response.json")["structuredContent"]["content"].encode()
    raw_log = pin(packet / "job-114097893399.raw.log")
    check("canonical raw log equals returned bytes", raw_log == raw_response)
    check("initial display copy differs only by one newline",
          pin(packet / "job-114097893399.log") == raw_log + b"\n")
    for phrase in ["DIAGNOSTIC_PASS", "N106Completed", "Uploaded bytes 44015", ZIP_HASH,
                   "Artifact ID 11655127117"]:
        check("raw job observation: " + phrase, phrase.encode() in raw_log)
    check("diagnostic scope only", result["N106Completed"] is False and
          result["originalComparatorExecuted"] is False and result["originalLeanKernelExecuted"] is False)
    cases = {case["label"]: case for case in result["cases"]}
    check("five unique actual cases", len(result["cases"]) == len(cases) == 5)
    observed = []
    for label, case in cases.items():
        check(label + " exact global/per-case identity", load(extracted / (label + ".json")) == case)
        log = pin(extracted / case["log"])
        check(label + " log bytes and digest", len(log) == case["logBytes"] and digest(log) == case["logSHA256"])
        events = [json.loads(line.strip()) for line in log.decode().splitlines() if line.strip().startswith("{")]
        check(label + " events parsed from actual byte log", events == case["events"])
        command, unit = case["command"], case["unit"]
        check(label + " protected argv", command[:6] == ["systemd-run", "--user", "--pty", "--wait", "--collect",
              "--property=RestrictAddressFamilies=~AF_UNIX"] and command[6] == "-E" and command[7] ==
              "PATH=" + result["environment"]["PATH"] and command[8] ==
              "--working-directory=/home/mathscopeverify/audit/original-source" and command[9:] and
              command[9] == "--unit=" + unit and command[10] == "--")
        check(label + " no capture error", case["captureError"] is None and not case.get("cleanupIncomplete") and "error" not in case)
        if label.endswith("-pipe"):
            pre = case["unitCleanup"]["beforeCleanup"]
            properties = dict(line.split("=", 1) for line in pre["show"]["stdout"].splitlines() if "=" in line)
            check(label + " actual successful show query", pre["show"]["exitCode"] == 0 and
                  pre["show"]["timedOut"] is False and properties == pre["properties"])
            check(label + " service exited before cleanup", all(properties[k] == v for k, v in {
                "ActiveState": "inactive", "SubState": "dead", "Result": "success",
                "ExecMainCode": "1", "ExecMainStatus": "0", "RestrictAddressFamilies": "~AF_UNIX"}.items()))
            check(label + " client still pending at 25 seconds", case["timedOut"] is True and
                  case["timeoutSeconds"] == 25 and case["elapsedSeconds"] >= 25 and
                  case["exitCodeBeforeCleanup"] is None and case["eofObservedBeforeCleanup"] is False)
            check(label + " cleanup exit zero never promoted", case["finalClientExitCode"] == 0 and
                  case["passed"] is False and case["actualProcessAndEOFPassed"] is False and events == [])
        else:
            check(label + " original result before cleanup", case["timedOut"] is False and
                  case["elapsedSeconds"] < 0.1 and case["exitCodeBeforeCleanup"] ==
                  case["finalClientExitCode"] == 0 and case["eofObservedBeforeCleanup"] is True and
                  case["cleanup"] == [] and case["passed"] is True)
        observed.append({"case": label, "seconds": case["elapsedSeconds"], "timedOut": case["timedOut"],
                         "exitBeforeCleanup": case["exitCodeBeforeCleanup"], "exitAfterCleanup": case["finalClientExitCode"],
                         "events": events})
    for kind, event in [("af", {"blocked": True, "errno": 97, "probe": "AF_UNIX socket creation", "uid": 1002}),
                        ("landlock", {"blocked": True, "errno": 13, "probe": "Landlock write outside writable paths", "uid": 1002})]:
        a, b = cases[kind + "-pipe"], cases[kind + "-outer-pty"]
        check(kind + " identical argv apart from unit", [x for x in a["command"] if not x.startswith("--unit=")] ==
              [x for x in b["command"] if not x.startswith("--unit=")])
        check(kind + " exact original denial result", b["events"] == [event])
    check("direct original AF payload", cases["af-outer-pty"]["command"][11:] ==
          ["/usr/bin/python3", "/opt/mathscope-ci/probe.py", "unix-socket"])
    check("unchanged Landrun restrictions and original payload", cases["landlock-outer-pty"]["command"][11:] ==
          [result["landrun"]["path"], "--best-effort", "--ro", "/", "--rw", "/dev", "-ldd", "-add-exec",
           "--", "/usr/bin/python3", "/opt/mathscope-ci/probe.py", "write-outside", result["forbiddenPath"]])
    before, denied, after = cases["af-outer-pty-metadata"]["events"]
    check("actual guarded UID CapEff NNP", before["uid"] == before["euid"] == after["uid"] == 1002 and
          before["effectiveCapabilities"] == 0 and before["noNewPrivileges"] == 1)
    check("actual same PID and controlling TTY", before["pid"] == after["pid"] == before["sessionId"] == before["processGroup"] and
          set(before["fd"]) == {"0", "1", "2"} and all(fd["isatty"] and fd["foregroundProcessGroup"] == before["pid"]
          for fd in before["fd"].values()))
    check("metadata original probe byte identity", before["probeSHA256"] == after["probeSHA256"] == PROBE_HASH)
    check("write control and absent forbidden path", result["writeOutsideControl"]["succeededWithoutLandlock"] is True and
          result["writeOutsideControl"]["uid"] == 1002 and result["writeOutsideControl"]["path"] ==
          result["forbiddenPath"] and result["forbiddenPathAbsentAfterProbes"] is True)
    check("all reviewed input bytes still unchanged", all(digest(Path(path).read_bytes()) == item["sha256"]
          for path, item in bindings.items()))
    receipt = {"schema": "MathScope.IndependentRemoteGuardObservationReview/1",
        "completedUTC": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": "PASS" if all(row["passed"] for row in checks) else "FAIL",
        "checksPassed": sum(row["passed"] for row in checks), "checksTotal": len(checks),
        "checks": checks, "observedCases": observed, "inputBindings": bindings,
        "N106Completed": False, "originalComparatorExecutedByReviewer": False,
        "allowedInterpretation": "In this controlled reproduction, both guarded services had terminated with success while the PIPE systemd-run clients still awaited completion and delivered no probe JSON. A real outer PTY delivered the unchanged negative probes and normal client exit/EOF. This identifies a client transport/completion stall in the reproduction and validates an execution repair candidate.",
        "unestablishedInterpretations": ["The historical cancelled run had the identical internal unit state",
            "A particular internal systemd function is the root cause", "Comparator or nanoda has completed", "N1-06 has passed"]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x") as f:
        json.dump(receipt, f, indent=2)
        f.write("\n")
    print(json.dumps({"status": receipt["status"], "checks": f'{receipt["checksPassed"]}/{receipt["checksTotal"]}',
                      "receipt": str(args.output), "sha256": digest(args.output.read_bytes())}))


if __name__ == "__main__":
    main()
