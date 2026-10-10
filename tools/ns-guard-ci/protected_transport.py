"""Protected long-command transport derived from the validated PTY diagnostic.

The low-level transport preserves argv and environment. The guarded wrapper
retains every original guard/security argument, adds a unique owned unit, and
owns bounded cleanup of that unit. Transport success alone is no theorem PASS.
"""
from __future__ import annotations

from datetime import datetime, timezone
import errno
import fcntl
import os
from pathlib import Path
import pty
import hashlib
import re
import selectors
import signal
import subprocess
import termios
import time
import traceback
import uuid


def utc():
    return datetime.now(timezone.utc).isoformat()


def process_state(pid):
    out = {"pid": pid}
    for label, operation in (("sessionId", os.getsid), ("processGroup", os.getpgid)):
        try:
            out[label] = operation(pid)
        except OSError as exc:
            out[label + "Error"] = str(exc)
    for fd in (0, 1, 2):
        try:
            out[f"fd{fd}"] = os.readlink(f"/proc/{pid}/fd/{fd}")
        except OSError as exc:
            out[f"fd{fd}Error"] = str(exc)
    try:
        status = dict(line.split(":", 1) for line in Path(f"/proc/{pid}/status").read_text().splitlines() if ":" in line)
        out["status"] = {key: status[key].strip() for key in ("Name", "State", "Uid", "Gid", "CapEff", "NoNewPrivs") if key in status}
        out["stat"] = Path(f"/proc/{pid}/stat").read_text().strip()
    except OSError as exc:
        out["procReadError"] = str(exc)
    return out


def _controlling_terminal():
    # Called only by the single-threaded launcher, before exec in the PTY child.
    os.setsid()
    fcntl.ioctl(0, termios.TIOCSCTTY, 0)


def run_transport(command, *, cwd, env, transport, timeout_seconds, log_path,
                  on_spawn=None, on_timeout=None, on_chunk=None):
    """Run one literal argv through PIPE or a real controlling outer PTY.

    timeout_seconds bounds the normal observation loop. Caller callbacks must
    themselves be bounded. Cleanup has at most two two-second child waits plus
    a half-second output drain. Timeout remains failure evidence even when the
    cleanup makes the child return zero. No background reader thread is used.
    """
    if transport not in ("pipe", "outer-pty"):
        raise ValueError("Unknown transport")
    if not 0 < timeout_seconds <= 330 * 60:
        raise ValueError("Protected timeout must be positive and at most 330 minutes")
    log_path = Path(log_path)
    started = time.monotonic()
    record = {"command": list(map(str, command)), "cwd": str(cwd),
              "transport": transport, "startedUTC": utc(),
              "timeoutSeconds": timeout_seconds, "timedOut": False,
              "parentStdinIsTTY": os.isatty(0), "parentStdoutIsTTY": os.isatty(1),
              "eofObservedBeforeCleanup": False, "exitCodeBeforeCleanup": None,
              "captureError": None, "cleanup": [], "streamedBytes": 0}
    master = slave = None
    process = None
    stream = None
    selector = selectors.DefaultSelector()
    eof = False
    try:
        if transport == "outer-pty":
            master, slave = pty.openpty()
            record["outerTTYPath"] = os.ttyname(slave)
            process = subprocess.Popen(record["command"], cwd=cwd, env=env,
                stdin=slave, stdout=slave, stderr=slave, close_fds=True,
                preexec_fn=_controlling_terminal)
            os.close(slave)
            slave = None  # The parent must not keep the slave alive.
            descriptor = master
        else:
            process = subprocess.Popen(record["command"], cwd=cwd, env=env,
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, close_fds=True)
            stream = process.stdout
            descriptor = stream.fileno()
        record["pid"] = process.pid
        record["clientProcessAtStart"] = process_state(process.pid)
        os.set_blocking(descriptor, False)
        selector.register(descriptor, selectors.EVENT_READ)
        if on_spawn:
            record["onSpawn"] = on_spawn(process.pid)
        with log_path.open("xb") as output:
            def read_ready(wait):
                nonlocal eof
                if eof:
                    time.sleep(min(wait, 0.03))
                    return
                for key, _ in selector.select(wait):
                    try:
                        chunk = os.read(key.fd, 65536)
                    except BlockingIOError:
                        continue
                    except OSError as exc:
                        if transport == "outer-pty" and exc.errno == errno.EIO:
                            chunk = b""
                            record["ptyEIOObserved"] = True
                        else:
                            record["captureError"] = repr(exc)
                            chunk = b""
                    if chunk:
                        output.write(chunk)
                        output.flush()
                        if on_chunk:
                            on_chunk(chunk)
                            record["streamedBytes"] += len(chunk)
                    else:
                        eof = True
                        selector.unregister(key.fd)
            deadline = started + timeout_seconds
            while True:
                read_ready(min(0.1, max(0, deadline - time.monotonic())))
                code = process.poll()
                if code is not None and eof:
                    if time.monotonic() > deadline:
                        record["timedOut"] = True
                    break
                if time.monotonic() >= deadline:
                    record["timedOut"] = True
                    break
            record["exitCodeBeforeCleanup"] = process.poll()
            record["eofObservedBeforeCleanup"] = eof
            record["observationEndedUTC"] = utc()
            if record["timedOut"]:
                if on_timeout:
                    try:
                        record["unitCleanup"] = on_timeout(process.pid)
                    except Exception as exc:
                        record["unitCleanupError"] = repr(exc)
                for sig, label in ((signal.SIGTERM, "SIGTERM"), (signal.SIGKILL, "SIGKILL")):
                    if process.poll() is not None:
                        break
                    try:
                        process.send_signal(sig)
                        process.wait(timeout=2)
                        record["cleanup"].append({"signal": label, "exitCode": process.returncode})
                    except ProcessLookupError as exc:
                        record["cleanup"].append({"signal": label, "processAlreadyGone": str(exc)})
                        try:
                            process.wait(timeout=2)
                        except subprocess.TimeoutExpired:
                            record["cleanup"].append({"signal": label, "reapTimedOut": True})
                    except subprocess.TimeoutExpired:
                        record["cleanup"].append({"signal": label, "waitTimedOut": True})
                drain_end = time.monotonic() + 0.5
                while not eof and time.monotonic() < drain_end:
                    read_ready(0.05)
            record["finalClientExitCode"] = process.poll()
            record["eofObservedAfterCleanup"] = eof
    finally:
        selector.close()
        if stream is not None:
            stream.close()
        if slave is not None:
            os.close(slave)
        if master is not None:
            os.close(master)
        if process is not None and process.poll() is None:
            try:
                process.kill()
            except ProcessLookupError:
                pass
            try:
                process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                record["cleanupIncomplete"] = True
        if process is not None:
            record["finalClientExitCode"] = process.poll()
    record["completedUTC"] = utc()
    record["elapsedSeconds"] = time.monotonic() - started
    return record


UNIT_PROPERTIES = ("LoadState", "ActiveState", "SubState", "Result", "ExecMainPID",
    "ExecMainCode", "ExecMainStatus", "RestrictAddressFamilies", "NoNewPrivileges",
    "StandardInput", "StandardOutput", "StandardError", "TTYPath", "ControlGroup",
    "InvocationID")


def bounded_query(command, env):
    record = {"command": list(command), "startedUTC": utc(), "timeoutSeconds": 3,
              "exitCode": None, "timedOut": False}
    try:
        result = subprocess.run(command, env=env, stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=3, check=False)
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


def unit_snapshot(unit, env, full=False):
    show = bounded_query(["systemctl", "--user", "show", unit, "--no-pager"] +
        ["--property=" + key for key in UNIT_PROPERTIES], env)
    properties = dict(line.split("=", 1) for line in show.get("stdout", "").splitlines() if "=" in line)
    record = {"unit": unit, "observedUTC": utc(), "show": show, "properties": properties}
    pid = properties.get("ExecMainPID", "0")
    if pid.isdecimal() and int(pid) > 0:
        record["serviceProcess"] = process_state(int(pid))
    if full:
        record["status"] = bounded_query(["systemctl", "--user", "status", unit, "--no-pager", "--full"], env)
        record["journal"] = bounded_query(["journalctl", "--user", "--unit", unit,
            "--no-pager", "--output=short-precise", "--lines=80"], env)
    return record


def cleanup_unit(unit, env):
    return {"unit": unit, "beforeCleanup": unit_snapshot(unit, env),
        "stop": bounded_query(["systemctl", "--user", "stop", "--no-block", unit], env),
        "kill": bounded_query(["systemctl", "--user", "kill", "--kill-whom=all", "--signal=SIGKILL", unit], env)}


def run_guarded(label, command, *, cwd, env, timeout_seconds, log_path, on_chunk):
    """Retain the original guard, add an owned unit, and record every failure.

    Call on the main thread. The temporary signal handlers turn an interruption
    of this guard stage into failure evidence and exact-unit cleanup. The
    caller must require ``passed`` and must never use a cleanup exit as success.
    """
    command = list(map(str, command))
    if not re.fullmatch(r"[a-z0-9-]+", label):
        raise ValueError("Invalid guard stage label")
    expected = ["systemd-run", "--user", "--pty", "--wait", "--collect",
                "--property=RestrictAddressFamilies=~AF_UNIX", "-E", "PATH=" + env["PATH"],
                "--working-directory=" + str(cwd), "--"]
    if command[:10] != expected:
        raise ValueError("The original guard prefix must be retained exactly")
    if not 0 < timeout_seconds <= 330 * 60:
        raise ValueError("Protected observation exceeds its 330-minute bound")
    unit = "mathscope-protected-" + label + "-" + uuid.uuid4().hex[:12] + ".service"
    command.insert(9, "--unit=" + unit)
    record = {"label": label, "unit": unit, "command": command, "cwd": str(cwd),
              "startedUTC": utc(), "timeoutSeconds": timeout_seconds,
              "passed": False, "exitCodeBeforeCleanup": None, "captureError": None}
    complete = False
    handlers = {}

    def interrupted(signum, frame):
        raise InterruptedError("Protected stage interrupted by signal " + str(signum))

    try:
        for signum in (signal.SIGTERM, signal.SIGINT):
            handlers[signum] = signal.getsignal(signum)
            signal.signal(signum, interrupted)
        record.update(run_transport(command, cwd=cwd, env=env, transport="outer-pty",
            timeout_seconds=timeout_seconds, log_path=log_path, on_chunk=on_chunk,
            on_spawn=lambda pid: unit_snapshot(unit, env),
            on_timeout=lambda pid: cleanup_unit(unit, env)))
        complete = True
    except BaseException as exc:
        record["transportException"] = repr(exc)
        record["traceback"] = traceback.format_exc()
    finally:
        for signum, previous in handlers.items():
            signal.signal(signum, previous)
        if not complete or record.get("timedOut") or record.get("finalClientExitCode") is None:
            record["exceptionOrTimeoutCleanup"] = cleanup_unit(unit, env)
        record["afterObservation"] = unit_snapshot(unit, env, full=True)
        log_path = Path(log_path)
        if log_path.exists():
            record["logBytes"] = log_path.stat().st_size
            record["logSHA256"] = hashlib.sha256(log_path.read_bytes()).hexdigest()
        record["completedUTC"] = utc()
    record["passed"] = (complete and record.get("timedOut") is False
        and record.get("captureError") is None and not record.get("cleanupIncomplete", False)
        and record.get("exitCodeBeforeCleanup") == 0 and record.get("finalClientExitCode") == 0
        and record.get("eofObservedBeforeCleanup") is True
        and "transportException" not in record
        and record.get("streamedBytes") == record.get("logBytes"))
    return record
