"""Bounded subprocess transport; EOF and process exit are separate evidence.

This module grants no validation PASS. It never changes a command's arguments,
permissions, or environment. The caller owns cleanup of named systemd units.
"""
from __future__ import annotations

from datetime import datetime, timezone
import errno
import fcntl
import os
from pathlib import Path
import pty
import selectors
import signal
import subprocess
import termios
import time


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
                  on_spawn=None, on_timeout=None):
    """Run one literal argv through PIPE or a real controlling outer PTY.

    timeout_seconds bounds the normal observation loop. Caller callbacks must
    themselves be bounded. Cleanup has at most two two-second child waits plus
    a half-second output drain. Timeout remains failure evidence even when the
    cleanup makes the child return zero. No background reader thread is used.
    """
    if transport not in ("pipe", "outer-pty"):
        raise ValueError("Unknown transport")
    if not 0 < timeout_seconds <= 30:
        raise ValueError("Diagnostic timeout must be positive and at most 30 seconds")
    log_path = Path(log_path)
    started = time.monotonic()
    record = {"command": list(map(str, command)), "cwd": str(cwd),
              "transport": transport, "startedUTC": utc(),
              "timeoutSeconds": timeout_seconds, "timedOut": False,
              "parentStdinIsTTY": os.isatty(0), "parentStdoutIsTTY": os.isatty(1),
              "eofObservedBeforeCleanup": False, "exitCodeBeforeCleanup": None,
              "captureError": None, "cleanup": []}
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
