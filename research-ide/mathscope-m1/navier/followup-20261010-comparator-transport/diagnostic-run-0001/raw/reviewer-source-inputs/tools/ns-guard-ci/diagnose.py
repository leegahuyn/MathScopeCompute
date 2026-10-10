#!/usr/bin/env python3
"""Bounded A/B observation of the unchanged original guard and negative probes.

This is a diagnostic only. It neither runs Comparator nor grants N1-06 PASS.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import traceback
import uuid

from transport import process_state, run_transport, utc


PROBE = Path("/opt/mathscope-ci/probe.py")
PROBE_SHA256 = "ed35362b4f1b4ede2271357d5cdc5258eb6d5c5cdef11ad5957827261043fb0e"
PINS = Path("/opt/mathscope-ci/pins.json")
PINS_SHA256 = "e702d85ac8590d14c5ab131b6afaaab3ff56466b96da626739df4b0c364d4ae8"
WORK = Path("/home/mathscopeverify/audit/original-source")
GUARD_PATH = ":".join(("/home/mathscopeverify/audit/tool-bin",
    "/home/mathscopeverify/audit/lean-4.34.0-rc2-linux/bin",
    "/opt/mathscope-ci/go/bin", "/opt/mathscope-ci/rust/bin",
    "/usr/local/bin", "/usr/bin", "/bin"))
EXPECTED_UID = 1002
TIMEOUT_SECONDS = 25
PROPERTIES = ("LoadState", "ActiveState", "SubState", "Result", "ExecMainPID",
    "ExecMainCode", "ExecMainStatus", "RestrictAddressFamilies", "NoNewPrivileges",
    "StandardInput", "StandardOutput", "StandardError", "TTYPath", "TTYReset",
    "TTYVHangup", "TTYVTDisallocate", "ControlGroup", "InvocationID", "User")


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_json(path, value):
    with Path(path).open("x") as output:
        json.dump(value, output, indent=2, sort_keys=True)
        output.write("\n")


def query(command, env, timeout=3):
    """Preserve raw query failures, including already-collected transient units."""
    record = {"command": list(command), "startedUTC": utc(), "timeoutSeconds": timeout,
              "exitCode": None, "timedOut": False}
    try:
        result = subprocess.run(command, env=env, stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout, check=False)
        record.update(exitCode=result.returncode,
                      stdout=result.stdout.decode("utf-8", errors="replace"),
                      stderr=result.stderr.decode("utf-8", errors="replace"))
    except subprocess.TimeoutExpired as exc:
        record.update(timedOut=True,
                      stdout=(exc.stdout or b"").decode("utf-8", errors="replace"),
                      stderr=(exc.stderr or b"").decode("utf-8", errors="replace"))
    except OSError as exc:
        record["launchError"] = repr(exc)
    record["completedUTC"] = utc()
    return record


def unit_snapshot(unit, env, *, full=False):
    show = query(["systemctl", "--user", "show", unit, "--no-pager"] +
                 ["--property=" + key for key in PROPERTIES], env)
    record = {"unit": unit, "observedUTC": utc(), "show": show}
    properties = dict(line.split("=", 1) for line in show.get("stdout", "").splitlines() if "=" in line)
    record["properties"] = properties
    pid = properties.get("ExecMainPID", "0")
    if pid.isdecimal() and int(pid) > 0:
        record["serviceProcess"] = process_state(int(pid))
    if full:
        record["status"] = query(["systemctl", "--user", "status", unit, "--no-pager", "--full"], env)
        record["journal"] = query(["journalctl", "--user", "--unit", unit,
            "--no-pager", "--output=short-precise", "--lines=80"], env)
    return record


def cleanup_unit(unit, env):
    """Only this invocation's exact, randomly named diagnostic service is stopped."""
    return {"unit": unit, "beforeCleanup": unit_snapshot(unit, env),
            "stop": query(["systemctl", "--user", "stop", "--no-block", unit], env),
            "kill": query(["systemctl", "--user", "kill", "--kill-whom=all", "--signal=SIGKILL", unit], env)}


def guard_argv(unit, payload):
    # The single added --unit option is used identically in A and B, solely to
    # collect status and clean this diagnostic's own service. All old guard
    # arguments and the original direct probe payload are retained literally.
    return ["systemd-run", "--user", "--pty", "--wait", "--collect",
        "--property=RestrictAddressFamilies=~AF_UNIX", "-E", "PATH=" + GUARD_PATH,
        "--working-directory=" + str(WORK), "--unit=" + unit, "--"] + list(map(str, payload))


def json_events(log):
    records = []
    for raw in log.decode("utf-8", errors="replace").splitlines():
        # systemd may include terminal color/reset bytes before a JSON line.
        start, end = raw.find("{"), raw.rfind("}")
        if start >= 0 and end >= start:
            try:
                value = json.loads(raw[start:end + 1])
                if isinstance(value, dict):
                    records.append(value)
            except json.JSONDecodeError:
                pass
    return records


def process_pass(record):
    return (record.get("timedOut") is False and record.get("captureError") is None
            and not record.get("cleanupIncomplete", False)
            and record.get("exitCodeBeforeCleanup") == 0
            and record.get("finalClientExitCode") == 0
            and record.get("eofObservedBeforeCleanup") is True
            and "error" not in record)


def probe_pass(events, kind):
    name = "AF_UNIX socket creation" if kind == "unix-socket" else "Landlock write outside writable paths"
    allowed = (1, 13, 97) if kind == "unix-socket" else (1, 13)
    matches = [event for event in events if event.get("probe") == name]
    return (len(matches) == 1 and matches[0].get("blocked") is True
            and matches[0].get("uid") == EXPECTED_UID
            and matches[0].get("errno") in allowed)


def one_case(label, transport, payload, kind, output, env):
    unit = "mathscope-guard-" + label + "-" + uuid.uuid4().hex[:12] + ".service"
    command = guard_argv(unit, payload)
    path = output / (label + ".log")
    record = {"label": label, "unit": unit, "command": command, "transport": transport,
              "startedUTC": utc(), "diagnosticOnly": True}
    completed_transport = False
    try:
        record.update(run_transport(command, cwd=WORK, env=env, transport=transport,
            timeout_seconds=TIMEOUT_SECONDS, log_path=path,
            on_spawn=lambda pid: unit_snapshot(unit, env),
            on_timeout=lambda pid: cleanup_unit(unit, env)))
        completed_transport = True
    except Exception as exc:
        record["error"] = repr(exc)
        record["traceback"] = traceback.format_exc()
    finally:
        # Includes launch/callback exceptions. Never rely on killing the client
        # to stop the transient service. No other workflow's units are touched.
        if not completed_transport or record.get("timedOut") or record.get("finalClientExitCode") is None:
            record["exceptionOrTimeoutCleanup"] = cleanup_unit(unit, env)
        record["afterObservation"] = unit_snapshot(unit, env, full=True)
        if path.exists():
            content = path.read_bytes()
            record.update(log=path.name, logBytes=len(content), logSHA256=sha(path),
                          events=json_events(content))
        else:
            record.update(events=[], missingLog=True)
        record["actualProcessAndEOFPassed"] = process_pass(record)
        record["originalNegativeProbePassed"] = probe_pass(record["events"], kind)
        record["passed"] = record["actualProcessAndEOFPassed"] and record["originalNegativeProbePassed"]
        record["completedUTC"] = utc()
        write_json(output / (label + ".json"), record)
    return record


def metadata_pass(record):
    before = [event for event in record["events"] if event.get("event") == "guard-process-before-original-probe"]
    after = [event for event in record["events"] if event.get("event") == "guard-process-after-original-probe"]
    return (record["passed"] and len(before) == len(after) == 1
        and before[0].get("uid") == before[0].get("euid") == EXPECTED_UID
        and after[0].get("uid") == EXPECTED_UID
        and before[0].get("effectiveCapabilities") == 0
        and before[0].get("probeSHA256") == after[0].get("probeSHA256") == PROBE_SHA256
        and before[0].get("pid") == after[0].get("pid")
        and all(before[0].get("fd", {}).get(str(fd), {}).get("isatty") is True for fd in (0, 1, 2)))


def classify(a, b):
    if a["passed"] and b["passed"]:
        return "BOTH_TRANSPORTS_PASSED"
    if a.get("timedOut") is True and b["passed"]:
        return "PIPE_TIMED_OUT_OUTER_PTY_PASSED"
    if b["passed"]:
        return "PIPE_FAILED_OUTER_PTY_PASSED"
    return "OUTER_PTY_NOT_ESTABLISHED"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--landrun", type=Path)
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    env = os.environ.copy()
    for key in ("GITHUB_TOKEN", "GH_TOKEN", "LEAN_PATH", "LEAN_SRC_PATH", "LEAN_SYSROOT"):
        env.pop(key, None)
    for key in list(env):
        if key.startswith("COMPARATOR_"):
            env.pop(key)
    env["PATH"] = GUARD_PATH
    result = {"schema": "MathScope.OriginalGuardTransportDiagnostic/1",
        "status": "RUNNING", "startedUTC": utc(), "exitCode": None,
        "N106Completed": False, "originalComparatorExecuted": False,
        "originalLeanKernelExecuted": False, "originalGuardArgumentsPreserved": True,
        "diagnosticAddition": "Unique --unit name only; payload metadata case is separately labeled",
        "normalCaseTimeoutSeconds": TIMEOUT_SECONDS, "cases": [],
        "sourceFiles": {}, "uid": os.getuid(), "euid": os.geteuid(),
        "parentProcess": process_state(os.getpid()), "kernel": os.uname().release,
        "environment": {key: env.get(key) for key in ("PATH", "XDG_RUNTIME_DIR", "DBUS_SESSION_BUS_ADDRESS")},
        "scope": "Transport/probe diagnosis only; no theorem, nanoda, Lean replay, Quot, or source-after validation"}
    write_json(output / "start.json", result)
    try:
        for source in (PROBE, PINS, Path(__file__), Path(__file__).with_name("transport.py"),
                       Path(__file__).with_name("metadata_probe.py")):
            result["sourceFiles"][str(source)] = {"sha256": sha(source), "bytes": source.stat().st_size}
            (output / ("source-" + source.name)).write_bytes(source.read_bytes())
        if sha(PROBE) != PROBE_SHA256 or sha(PINS) != PINS_SHA256:
            raise RuntimeError("The original probe or pin file differs from its fixed source")
        if os.getuid() != EXPECTED_UID or os.geteuid() != EXPECTED_UID:
            raise RuntimeError("The diagnostic must run as the original UID 1002")
        if int(result["parentProcess"]["status"]["CapEff"], 16) != 0:
            raise RuntimeError("The diagnostic parent has effective capabilities")
        WORK.mkdir(parents=True, exist_ok=True)
        if any(WORK.iterdir()):
            raise RuntimeError("The diagnostic working directory must be empty")
        result["workingDirectory"] = {"path": str(WORK), "empty": True,
            "meaning": "Empty diagnostic path; no original source checkout is prepared or executed"}
        result["systemdVersion"] = query(["systemd-run", "--version"], env)
        result["userManager"] = query(["systemctl", "--user", "is-active", "default.target"], env)
        if result["userManager"]["exitCode"] != 0:
            raise RuntimeError("The original user DBus/systemd manager is not active")
        payload = ["/usr/bin/python3", PROBE, "unix-socket"]
        a = one_case("af-pipe", "pipe", payload, "unix-socket", output, env)
        result["cases"].append(a)
        b = one_case("af-outer-pty", "outer-pty", payload, "unix-socket", output, env)
        result["cases"].append(b)
        strip_unit = lambda command: [arg for arg in command if not arg.startswith("--unit=")]
        result["afCommandIdenticalApartFromUnit"] = strip_unit(a["command"]) == strip_unit(b["command"])
        result["afTransportObservation"] = classify(a, b)
        if args.landrun:
            landrun = args.landrun.resolve()
            if not landrun.is_file() or not os.access(landrun, os.X_OK):
                raise RuntimeError("The supplied pinned Landrun is not an executable file")
            result["landrun"] = {"path": str(landrun), "sha256": sha(landrun), "bytes": landrun.stat().st_size}
            forbidden = WORK.parent / ("diagnostic-forbidden-" + uuid.uuid4().hex)
            if forbidden.exists():
                raise RuntimeError("The forbidden probe destination already exists")
            # Establish that this user can write here before Landlock is applied.
            # This short-lived file belongs only to this diagnostic invocation.
            control = b"Diagnostic write control outside Landlock.\n"
            with forbidden.open("xb") as stream:
                stream.write(control)
            result["writeOutsideControl"] = {"path": str(forbidden),
                "uid": os.getuid(), "bytes": forbidden.stat().st_size,
                "sha256": sha(forbidden), "succeededWithoutLandlock": forbidden.read_bytes() == control}
            forbidden.unlink()
            if not result["writeOutsideControl"]["succeededWithoutLandlock"]:
                raise RuntimeError("The unguarded write control did not preserve its bytes")
            payload = [landrun, "--best-effort", "--ro", "/", "--rw", "/dev", "-ldd", "-add-exec",
                       "--", "/usr/bin/python3", PROBE, "write-outside", forbidden]
            la = one_case("landlock-pipe", "pipe", payload, "write-outside", output, env)
            result["cases"].append(la)
            lb = one_case("landlock-outer-pty", "outer-pty", payload, "write-outside", output, env)
            result["cases"].append(lb)
            result["landlockCommandIdenticalApartFromUnit"] = strip_unit(la["command"]) == strip_unit(lb["command"])
            result["landlockTransportObservation"] = classify(la, lb)
            result["forbiddenPath"] = str(forbidden)
            result["forbiddenPathAbsentAfterProbes"] = not forbidden.exists()
            result["landlockOuterPassed"] = lb["passed"] and not forbidden.exists()
        else:
            result["landlock"] = {"executed": False, "reason": "No --landrun path supplied"}
        meta = one_case("af-outer-pty-metadata", "outer-pty",
            ["/usr/bin/python3", Path(__file__).with_name("metadata_probe.py")], "unix-socket", output, env)
        result["cases"].append(meta)
        result["actualGuardProcessMetadataPassed"] = metadata_pass(meta)
        result["diagnosticPassed"] = (b["passed"] and result["afCommandIdenticalApartFromUnit"]
            and result["actualGuardProcessMetadataPassed"]
            and (not args.landrun or (result["landlockOuterPassed"] and result["landlockCommandIdenticalApartFromUnit"])))
        result["status"] = "DIAGNOSTIC_PASS" if result["diagnosticPassed"] else "DIAGNOSTIC_FAILED"
        result["exitCode"] = 0 if result["diagnosticPassed"] else 1
    except Exception as exc:
        result.update(status="DIAGNOSTIC_ERROR", exitCode=1, error=repr(exc), traceback=traceback.format_exc())
    finally:
        result["completedUTC"] = utc()
        result["evidenceFiles"] = {path.name: {"sha256": sha(path), "bytes": path.stat().st_size}
                                   for path in sorted(output.iterdir()) if path.is_file()}
        write_json(output / "result.json", result)
    print(json.dumps({key: result.get(key) for key in ("status", "exitCode", "N106Completed",
        "afTransportObservation", "landlockTransportObservation", "actualGuardProcessMetadataPassed")}), flush=True)
    return result["exitCode"]


if __name__ == "__main__":
    raise SystemExit(main())
