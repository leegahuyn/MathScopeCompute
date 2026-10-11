"""External observed-test receipt; no fabricated success on bounded failure."""

from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import resource
import re
import sys
from time import monotonic
import unittest

import test_zero_certificate as tests


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "evidence" / "p7-zero-certificate-20261011"


def record(path):
    data = path.read_bytes()
    return {"path": path.relative_to(ROOT).as_posix(), "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest()}


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=True, indent=2, allow_nan=False) + "\n")


def main():
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    attempt = sys.argv[1] if len(sys.argv) == 2 else "attempt1"
    if not re.fullmatch(r"attempt[1-9][0-9]*", attempt):
        raise SystemExit("expected attemptN")
    receipt_path = EVIDENCE / f"zero-certificate-validation-{attempt}.json"
    if receipt_path.exists():
        raise SystemExit("Refusing to overwrite the immutable first execution receipt")
    paths = [ROOT / "p7" / "zero_certificate.py", ROOT / "p7" / "ball_backend.py",
             Path(tests.__file__).resolve(), Path(__file__).resolve()]
    before = [record(path) for path in paths]
    started = datetime.now(timezone.utc).isoformat()
    tick = monotonic()
    buffer = io.StringIO()
    suite = unittest.defaultTestLoader.loadTestsFromModule(tests)
    result = unittest.TextTestRunner(stream=buffer, verbosity=2).run(suite)
    elapsed = monotonic() - tick
    after = [record(path) for path in paths]
    log_path = EVIDENCE / f"zero-certificate-validation-{attempt}.log"
    log_path.write_text(buffer.getvalue())
    print(buffer.getvalue(), end="")
    cases = []
    for height, certificate in tests.RESULTS.items():
        path = EVIDENCE / f"zero-certificate-height{height}-{attempt}.json"
        if path.exists():
            raise RuntimeError("refusing to overwrite an earlier actual case")
        write_json(path, certificate)
        cases.append({**record(path), "height": height, "status": certificate["status"],
                      "pass": certificate["pass"], "computationSha256": certificate["computationSha256"],
                      "wholeContourCells": certificate["statistics"]["acceptedContourCells"],
                      "winding": certificate["contour"].get("windingInteger"),
                      "positiveZeroCount": certificate.get("positiveZeroCount")})
    success = result.wasSuccessful() and before == after
    receipt = {
        "schema": "MathScope.M3.P7.ObservedZeroCertificateTests/1",
        "startedAt": started, "finishedAt": datetime.now(timezone.utc).isoformat(),
        "elapsedSeconds": elapsed, "maxResidentBytes": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024,
        "testCount": result.testsRun, "failures": len(result.failures), "errors": len(result.errors),
        "success": success, "intendedExitCode": 0 if success else 1,
        "actualChildProcessExitObservedByThisInProcessRunner": False,
        "sourceFilesBefore": before, "sourceFilesAfter": after, "sourceBytesUnchanged": before == after,
        "cases": cases, "log": record(log_path),
        "scope": {"actualFlintEvaluationsExecuted": True, "independentCountingAlgorithm": True,
                  "independentArithmeticImplementation": False, "globalRHProved": False,
                  "P7Complete": False},
    }
    write_json(receipt_path, receipt)
    print(json.dumps({"receipt": str(receipt_path), "success": success, "tests": result.testsRun,
                      "cases": cases, "elapsedSeconds": elapsed}, ensure_ascii=True))
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
