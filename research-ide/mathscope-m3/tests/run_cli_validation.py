"""Record an actual bounded unittest child exit and immutable source bytes."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import cli


def reference(path):
    data = path.read_bytes()
    return {"path": path.relative_to(ROOT).as_posix(), "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest()}


def main():
    attempt = sys.argv[1] if len(sys.argv) == 2 else "attempt1"
    if not re.fullmatch(r"attempt[1-9][0-9]*", attempt):
        raise SystemExit("expected attemptN")
    output = ROOT / "evidence/p7-cli-20261011"
    output.mkdir(parents=True, exist_ok=True)
    receipt_path = output / f"cli-validation-{attempt}.json"
    log_path = output / f"cli-validation-{attempt}.log"
    if receipt_path.exists() or log_path.exists():
        raise SystemExit("refusing to overwrite an existing validation attempt")
    paths = [ROOT / "cli.py", *sorted((ROOT / "p7").glob("*.py")),
             ROOT / "tests/test_cli.py", Path(__file__).resolve(), ROOT / "M3_ENTRY.json"]
    before = [reference(path) for path in paths]
    command = [sys.executable, "-m", "unittest", "discover", "-s", "tests", "-p", "test_cli.py", "-v"]
    started = datetime.now(timezone.utc).isoformat()
    tick = time.monotonic()
    process = subprocess.Popen(command, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    timed_out = False
    try:
        log, _ = process.communicate(timeout=180)
    except subprocess.TimeoutExpired:
        timed_out = True
        process.kill()
        log, _ = process.communicate()
    finished = datetime.now(timezone.utc).isoformat()
    elapsed = time.monotonic() - tick
    with log_path.open("xb") as stream:
        stream.write(log)
    text = log.decode("utf-8", errors="replace")
    count = re.search(r"Ran (\d+) tests? in", text)
    tests = int(count.group(1)) if count else None
    after = [reference(path) for path in paths]
    success = process.returncode == 0 and not timed_out and before == after and tests == 13
    receipt = {"schema": "MathScope.M3.P7.CLIObservedValidation/1", "command": command,
               "startedAt": started, "finishedAt": finished, "elapsedSeconds": elapsed,
               "observedExitCode": process.returncode, "timedOut": timed_out, "testCount": tests,
               "success": success, "sourceFilesBefore": before, "sourceFilesAfter": after,
               "sourceBytesUnchanged": before == after, "log": reference(log_path),
               "actualFreshSubprocessReplays": True, "fullyRehashedForgedEndpointComparedByFreshExecution": True,
               "testAssertionsOnlyCountedOnObservedSuccess": True,
               "resourceFailureControl": "explicit synthetic child MemoryError/SIGXCPU injection; not a production resource-exhaustion observation",
               "formalLeanProofIssued": False, "wholeP7Complete": False, "wholeM3Complete": False}
    cli.write_new(receipt_path, receipt)
    print(text, end="")
    print(json.dumps({"receipt": str(receipt_path), "success": success, "testCount": tests,
                      "observedExitCode": process.returncode, "elapsedSeconds": elapsed}))
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
