"""Bounded source-verified build for native Linux deployment.

The source pin is published by the PARI project. A cached source archive may be
supplied by a build administrator, but it must pass the very same byte-size and
SHA-256 checks. No database is downloaded. Every request later uses the installed
executable only; neither pip nor network access is invoked by the arithmetic API.
"""
from __future__ import annotations

from hashlib import sha256
import json
import os
from pathlib import Path
import platform
import signal
import shutil
import ssl
import subprocess
import tarfile
import tempfile
import time
import urllib.parse
import urllib.request

from . import PARI_VERSION, SOURCE_URL, SOURCE_SHA256, SOURCE_BYTES, PROVENANCE_NAME

BUILD_TIMEOUT_SECONDS = 600
DOWNLOAD_TIMEOUT_SECONDS = 180
SOURCE_DATE_EPOCH = "1790553600"  # 2026-09-28 00:00:00 UTC, official release date.


def verify_archive(path):
    path = Path(path)
    if path.stat().st_size != SOURCE_BYTES or sha256(path.read_bytes()).hexdigest() != SOURCE_SHA256:
        raise ValueError("The PARI source archive does not match the official 2.19.0 byte pin")


def _archive(destination):
    cached = os.environ.get("MATHSCOPE_PARI_SOURCE_ARCHIVE")
    if cached:
        verify_archive(cached)
        shutil.copyfile(cached, destination)
        verify_archive(destination)
        return {"transport": "local_build_cache", "tlsVerifiedDuringThisBuild": False}
    start = time.monotonic()
    # The default context checks both the certificate chain and host name.
    context = ssl.create_default_context()
    with urllib.request.urlopen(SOURCE_URL, context=context, timeout=30) as response:
        if urllib.parse.urlsplit(response.url).scheme != "https":
            raise ValueError("The official source download redirected away from HTTPS")
        count = 0
        with Path(destination).open("wb") as target:
            while True:
                if time.monotonic() - start > DOWNLOAD_TIMEOUT_SECONDS:
                    raise TimeoutError("The pinned PARI source download exceeded its time budget")
                # read1 performs at most one underlying read, so a slow stream
                # cannot indefinitely extend a buffered read of a full chunk.
                chunk = response.read1(65_536)
                if not chunk:
                    break
                count += len(chunk)
                if count > SOURCE_BYTES:
                    raise ValueError("The PARI source download exceeds its pinned byte count")
                target.write(chunk)
    verify_archive(destination)
    return {"transport": "official_https", "tlsVerifiedDuringThisBuild": True}


def _extract(archive, target):
    # Reject links, devices, oversized expansion and non-release paths before
    # extraction, even though the input has already passed its immutable pin.
    with tarfile.open(archive, "r:gz") as source:
        members = source.getmembers()
        if len(members) > 20_000 or sum(member.size for member in members) > 100_000_000:
            raise ValueError("The PARI source archive exceeds its extraction budget")
        for member in members:
            path = Path(member.name)
            if (path.is_absolute() or ".." in path.parts or not path.parts
                    or path.parts[0] != "pari-" + PARI_VERSION
                    or not (member.isfile() or member.isdir())):
                raise ValueError("Unexpected PARI source archive member")
        source.extractall(target, members=members, filter="data")


def _run(command, cwd, log, environment, deadline):
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise TimeoutError("The PARI build exceeded its total process time budget")
    with Path(log).open("wb") as stream:
        process = subprocess.Popen(command, cwd=cwd, env=environment, stdout=stream,
                                   stderr=subprocess.STDOUT, start_new_session=True)
        try:
            process.wait(timeout=remaining)
        except BaseException:
            # Build-time make/gcc children must not outlive the build deadline.
            # Arithmetic GP requests separately inherit the CLI lease group.
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            process.wait()
            raise
    if process.returncode:
        excerpt = Path(log).read_text(errors="replace")[-4000:]
        raise RuntimeError(f"PARI build command failed with exit {process.returncode}: {excerpt}")


def build_runtime(destination):
    if platform.system() != "Linux":
        raise RuntimeError("This pinned PARI build recipe supports native Linux only")
    if shutil.which("gcc") is None or shutil.which("make") is None:
        raise RuntimeError("Building the pinned PARI runtime requires gcc and make")
    destination = Path(destination).resolve()
    destination.mkdir(parents=True, exist_ok=True)
    logs = destination / "build-logs"
    logs.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="mathscope-pari-") as temporary:
        temporary = Path(temporary)
        archive = temporary / ("pari-" + PARI_VERSION + ".tar.gz")
        transport = _archive(archive)
        _extract(archive, temporary)
        source = temporary / ("pari-" + PARI_VERSION)
        environment = os.environ.copy()
        environment.update({"LC_ALL": "C", "LANG": "C", "TZ": "UTC",
                            "SOURCE_DATE_EPOCH": SOURCE_DATE_EPOCH, "CC": "gcc",
                            "CFLAGS": f"-O2 -ffile-prefix-map={source}=/usr/src/pari-{PARI_VERSION}"})
        commands = [
            ["sh", "Configure", "--static", "--without-gmp", "--without-readline",
             "--graphic=none", "--prefix=/opt/mathscope/pari-" + PARI_VERSION],
            ["make", "-j2", "gp"],
        ]
        deadline = time.monotonic() + BUILD_TIMEOUT_SECONDS
        _run(commands[0], source, logs / "configure.log", environment, deadline)
        _run(commands[1], source, logs / "compile.log", environment, deadline)
        executables = list(source.glob("Olinux-*/gp-sta"))
        if len(executables) != 1:
            raise RuntimeError("The pinned PARI build did not produce exactly one static GP executable")
        executable = destination / "gp"
        shutil.copyfile(executables[0], executable)
        executable.chmod(0o755)
        _run([str(executable), "--version"], source, logs / "version.log", environment, deadline)
        version = (logs / "version.log").read_text()
        if "GP/PARI CALCULATOR Version " + PARI_VERSION + " (released)" not in version:
            raise RuntimeError("The built GP executable did not report the pinned released version")
        compiler = subprocess.run(["gcc", "--version"], stdout=subprocess.PIPE,
                                  stderr=subprocess.STDOUT, timeout=10, check=True).stdout.decode()
        for license_name in ("COPYING", "LICENSE"):
            shutil.copyfile(source / license_name, destination / ("PARI-" + license_name))
        result = {
            "schema": "MathScope.P7.PARI.Build/1", "pariVersion": PARI_VERSION,
            "source": {"url": SOURCE_URL, "sha256": SOURCE_SHA256, "bytes": SOURCE_BYTES,
                       "officialHashSource": "https://pari.math.u-bordeaux.fr/download.html",
                       "sha256VerifiedBeforeExtraction": True, **transport},
            "recipe": {"commands": commands, "makeJobs": 2,
                       "processTimeBudgetSeconds": BUILD_TIMEOUT_SECONDS,
                       "downloadSoftDeadlineSeconds": DOWNLOAD_TIMEOUT_SECONDS,
                       "downloadSocketTimeoutSeconds": 30,
                       "downloadMaximumSeconds": DOWNLOAD_TIMEOUT_SECONDS + 30,
                       "sourceDateEpoch": SOURCE_DATE_EPOCH,
                       "CFLAGS": "-O2 -ffile-prefix-map=<source>=/usr/src/pari-" + PARI_VERSION,
                       "databasesDownloaded": False, "gmpRequired": False,
                       "readlineRequired": False, "pariLibraryStatic": True},
            "platform": {"system": platform.system(), "machine": platform.machine(),
                         "compiler": compiler},
            "binary": {"name": "gp", "bytes": executable.stat().st_size,
                       "sha256": sha256(executable.read_bytes()).hexdigest(), "versionOutput": version},
            "logsSha256": {path.name: sha256(path.read_bytes()).hexdigest()
                           for path in sorted(logs.iterdir()) if path.is_file()},
            "buildSourceSha256": sha256(Path(__file__).read_bytes()).hexdigest(),
        }
        (destination / PROVENANCE_NAME).write_text(json.dumps(result, indent=2) + "\n")
        return result
