#!/usr/bin/env python3
"""Record the executing guard process, then run the unchanged original probe."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import runpy
import sys


PROBE = Path("/opt/mathscope-ci/probe.py")
PROBE_SHA256 = "ed35362b4f1b4ede2271357d5cdc5258eb6d5c5cdef11ad5957827261043fb0e"


def main():
    source = PROBE.read_bytes()
    actual_sha = hashlib.sha256(source).hexdigest()
    if actual_sha != PROBE_SHA256:
        raise RuntimeError("Original probe bytes differ from the fixed source")
    status = dict(line.split(":", 1) for line in Path("/proc/self/status").read_text().splitlines() if ":" in line)
    metadata = {
        "event": "guard-process-before-original-probe",
        "pid": os.getpid(), "uid": os.getuid(), "euid": os.geteuid(),
        "gid": os.getgid(), "effectiveCapabilitiesHex": status["CapEff"].strip(),
        "effectiveCapabilities": int(status["CapEff"].strip(), 16),
        "noNewPrivileges": int(status["NoNewPrivs"].strip()),
        "sessionId": os.getsid(0), "processGroup": os.getpgrp(),
        "probeSHA256": actual_sha, "fd": {},
    }
    for fd in (0, 1, 2):
        state = {"isatty": os.isatty(fd)}
        for key, operation in (("target", lambda: os.readlink(f"/proc/self/fd/{fd}")),
                               ("ttyName", lambda: os.ttyname(fd)),
                               ("foregroundProcessGroup", lambda: os.tcgetpgrp(fd))):
            try:
                state[key] = operation()
            except OSError as exc:
                state[key + "Error"] = {"errno": exc.errno, "message": str(exc)}
        metadata["fd"][str(fd)] = state
    print(json.dumps(metadata, sort_keys=True), flush=True)
    sys.argv = [str(PROBE), "unix-socket"]
    runpy.run_path(str(PROBE), run_name="__main__")
    print(json.dumps({"event": "guard-process-after-original-probe",
                      "pid": os.getpid(), "uid": os.getuid(),
                      "probeSHA256": actual_sha}), flush=True)


if __name__ == "__main__":
    main()
