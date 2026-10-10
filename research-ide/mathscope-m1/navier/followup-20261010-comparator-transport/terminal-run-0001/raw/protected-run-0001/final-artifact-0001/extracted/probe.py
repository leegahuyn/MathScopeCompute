#!/usr/bin/env python3
"""Negative probes for the *documented* Comparator guard on a fresh CI host."""
import errno
import json
import os
from pathlib import Path
import socket
import sys

assert os.geteuid() != 0, "Verification user must be unprivileged"
status = dict(line.split(":", 1) for line in Path("/proc/self/status").read_text().splitlines() if ":" in line)
assert int(status["CapEff"].strip(), 16) == 0, "Effective capabilities must be empty"
if sys.argv[1] == "unix-socket":
    try:
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    except OSError as exc:
        assert exc.errno in (errno.EPERM, errno.EACCES, errno.EAFNOSUPPORT), repr(exc)
        print(json.dumps({"probe": "AF_UNIX socket creation", "blocked": True,
                          "errno": exc.errno, "uid": os.getuid()}))
    else:
        sock.close()
        raise AssertionError("Required RestrictAddressFamilies guard was ineffective")
elif sys.argv[1] == "write-outside":
    try:
        Path(sys.argv[2]).write_text("This write must be denied by Landlock.\n")
    except OSError as exc:
        assert exc.errno in (errno.EACCES, errno.EPERM), repr(exc)
        print(json.dumps({"probe": "Landlock write outside writable paths", "blocked": True,
                          "errno": exc.errno, "uid": os.getuid()}))
    else:
        raise AssertionError("Landlock did not enforce the required filesystem restriction")
else:
    raise ValueError("Unknown probe")
