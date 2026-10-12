#!/usr/bin/env python3
"""Bounded P7 execution and exact replay; serialized records carry no proof authority."""
from __future__ import annotations

import argparse
import gzip
import hashlib
import importlib.metadata
import json
import math
from pathlib import Path
import platform
import resource
import subprocess
import sys
import time
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent
VERSION = "0.2.0"
KINDS = {"p7.special_function", "p7.zeta_zeros", "p7.elliptic_local", "p7.elliptic_analytic", "p7.explicit_formula"}
MAX_JSON_BYTES = 32 * 1024 * 1024


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()


def file_hash(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def _pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def parse_json(data):
    if len(data.encode() if isinstance(data, str) else data) > MAX_JSON_BYTES:
        raise ValueError("JSON exceeds the 32 MiB input limit")
    def reject(value):
        raise ValueError(f"nonfinite JSON constant: {value}")
    try:
        return json.loads(data, object_pairs_hook=_pairs, parse_constant=reject)
    except RecursionError as exc:
        raise ValueError("JSON nesting exceeds the parser limit") from exc


def validate_request(request):
    if not isinstance(request, dict) or set(request) != {"kind", "input"}:
        raise ValueError("request must contain exactly kind and input")
    if not isinstance(request["kind"], str) or request["kind"] not in KINDS or not isinstance(request["input"], dict):
        raise ValueError("unsupported P7 kind or input")
    return request


def source_binding():
    paths = [ROOT / "cli.py", *sorted((ROOT / "p7").glob("*.py"))]
    return {"version": VERSION, "files": [{"path": str(p.relative_to(ROOT)), "sha256": file_hash(p)} for p in paths]}


def predecessor():
    entry_path = ROOT / "M3_ENTRY.json"
    entry = parse_json(entry_path.read_bytes())
    gate = ROOT.parent / "mathscope-m2/navier/research/M2_COMPLETION_GATE.json"
    if file_hash(gate) != entry["M2GateFileSHA256"]:
        raise ValueError("the recorded M2 predecessor gate has changed")
    return {"entrySHA256": file_hash(entry_path), "M2Commit": entry["afterM2Commit"], "M2AssessmentSHA256": entry["M2AssessmentSHA256"]}


def environment(kind):
    result = {"python": platform.python_version(), "implementation": platform.python_implementation(),
              "system": platform.system(), "machine": platform.machine(), "numericBackend": None}
    if kind != "p7.elliptic_local":
        import flint
        if flint.__version__ != "0.9.0" or flint.__FLINT_VERSION__ != "3.6.0":
            raise ValueError("this release requires python-flint 0.9.0 / FLINT 3.6.0")
        dist = importlib.metadata.distribution("python-flint")
        expected_origin = Path(dist.locate_file("flint/__init__.py")).resolve()
        if Path(flint.__file__).resolve() != expected_origin:
            raise ValueError("imported flint package does not match the fingerprinted distribution")
        files = []
        fingerprinted_paths = set()
        for item in sorted(dist.files or [], key=str):
            name = str(item)
            if "__pycache__" in name or name.endswith(".pyc"):
                continue
            if not (name.endswith(".py") or any(ext in Path(name).name for ext in (".so", ".pyd", ".dll", ".dylib"))):
                continue
            p = Path(dist.locate_file(item))
            if p.is_file():
                fingerprinted_paths.add(p.resolve())
                files.append({"path": name, "sha256": file_hash(p)})
        for name, module in list(sys.modules.items()):
            if name == "flint" or name.startswith("flint."):
                origin = getattr(module, "__file__", None)
                if origin is not None and Path(origin).resolve() not in fingerprinted_paths:
                    raise ValueError(f"loaded {name} is outside the fingerprinted distribution")
        result["numericBackend"] = {"pythonFlint": flint.__version__, "FLINT": flint.__FLINT_VERSION__,
                                    "FLINTRelease": flint.__FLINT_RELEASE__, "runtimeFilesSHA256": digest(files),
                                    "runtimeFileCount": len(files), "licenseExpression": dist.metadata.get("License-Expression"),
                                    "importedPackageMatchesDistribution": True, "observedModuleOriginsChecked": True,
                                    "fingerprintScope": "Python modules and dynamic binaries; excludes installer bookkeeping and local paths"}
    return result


def dispatch(request):
    validate_request(request)
    kind, data = request["kind"], request["input"]
    if kind == "p7.special_function":
        from p7.ball_backend import evaluate
        return evaluate(data)
    if kind == "p7.zeta_zeros":
        from p7.zero_certificate import certify_zeros
        return certify_zeros(data)
    if kind == "p7.explicit_formula":
        from p7.explicit_formula import evaluate_explicit_formula
        return evaluate_explicit_formula(data)
    if kind == "p7.elliptic_analytic":
        from p7.elliptic_analytic import elliptic_central_certificate
        if set(data) - {"model", "precisionBits", "coefficientLimit", "tolerance"} or "model" not in data:
            raise ValueError("elliptic analytic input requires model and supported precision/tail controls")
        return elliptic_central_certificate(data["model"], precision_bits=data.get("precisionBits", 192),
                                            coefficient_limit=data.get("coefficientLimit", 128),
                                            tolerance=data.get("tolerance", "1e-40"))
    from p7.elliptic_local import curve_certificate
    if set(data) - {"model", "primes", "coefficientLimit"} or "model" not in data:
        raise ValueError("elliptic input requires model, with optional primes and coefficientLimit")
    primes = data.get("primes", [2, 3, 5, 7, 11, 13])
    if not isinstance(primes, list) or len(primes) > 64:
        raise ValueError("primes must be a list of at most 64 entries")
    return curve_certificate(data["model"], tuple(primes), coefficient_limit=data.get("coefficientLimit"))


def execute(request, max_seconds=90, memory_mib=1536):
    request = validate_request(request)
    if type(max_seconds) is not int or type(memory_mib) is not int or not 1 <= max_seconds <= 300 or not 128 <= memory_mib <= 4096:
        raise ValueError("resource limits must be 1..300 seconds and 128..4096 MiB")
    source, env, before = source_binding(), environment(request["kind"]), predecessor()
    started = datetime.now(timezone.utc).isoformat()
    begin = time.monotonic()
    command = [sys.executable, str(ROOT / "cli.py"), "_compute", str(memory_mib), str(math.ceil(max_seconds))]
    child = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=str(ROOT))
    timeout = False
    try:
        stdout, stderr = child.communicate(canonical(request), timeout=max_seconds)
    except subprocess.TimeoutExpired:
        timeout = True
        child.kill()
        stdout, stderr = child.communicate()
    result = None
    failure = None
    observed_limits = None
    observed_environment_sha = None
    status = "UNRESOLVED" if timeout else "REJECTED"
    if not timeout:
        try:
            reply = parse_json(stdout)
            if not isinstance(reply, dict):
                raise ValueError("child reply must be an object")
            observed_limits = reply.get("resourceLimits")
            observed_environment_sha = reply.get("environmentSHA256")
            if child.returncode == 0 and reply.get("ok") is True and "value" in reply:
                result, status = reply["value"], "COMPLETED"
            else:
                failure = reply.get("error", "child process failed")
                if isinstance(failure, dict) and failure.get("type") == "MemoryError":
                    status = "UNRESOLVED"
        except (ValueError, UnicodeDecodeError) as exc:
            failure = f"child did not return valid JSON: {exc}"
    if child.returncode is not None and child.returncode < 0:
        status = "UNRESOLVED"
        failure = {"type": "ProcessSignal", "signal": -child.returncode,
                   "detail": "child terminated without a completed numerical record; no input-invalidity inference"}
    if status == "COMPLETED" and observed_environment_sha != digest(env):
        status, failure = "ENVIRONMENT_CHANGED", "the actual child backend differs from the parent fingerprint"
    if source_binding() != source:
        status, failure = "SOURCE_CHANGED", "source files changed during this execution"
    record = {"schema": "MathScope.M3.P7Execution/1", "request": request, "inputSHA256": digest(request),
              "sourceBinding": source, "environment": env, "environmentSHA256": digest(env), "predecessor": before,
              "execution": {"status": status, "startedAt": started, "finishedAt": datetime.now(timezone.utc).isoformat(),
                            "elapsedSeconds": time.monotonic() - begin, "observedExitCode": child.returncode,
                            "timedOut": timeout, "maxSeconds": max_seconds, "memoryLimitMiB": memory_mib,
                            "observedChildResourceLimits": observed_limits,
                            "observedChildEnvironmentSHA256": observed_environment_sha,
                            "failure": failure, "stderr": stderr.decode(errors="replace")},
              "result": result, "mathematicalSHA256": digest({"request": request, "result": result}) if result is not None else None,
              "serializedAuthority": "UNTRUSTED_REQUIRES_REEXECUTION", "formalLeanProofIssued": False,
              "wholeP7Complete": False, "wholeM3Complete": False}
    record["recordSHA256"] = digest(record)
    return record


def validate_record(record):
    if not isinstance(record, dict) or record.get("schema") != "MathScope.M3.P7Execution/1":
        raise ValueError("unsupported execution record")
    body = {k: v for k, v in record.items() if k != "recordSHA256"}
    if digest(body) != record.get("recordSHA256"):
        raise ValueError("execution record hash mismatch")
    required = {"request", "inputSHA256", "sourceBinding", "environment", "environmentSHA256", "predecessor",
                "execution", "result", "mathematicalSHA256", "serializedAuthority", "formalLeanProofIssued",
                "wholeP7Complete", "wholeM3Complete"}
    if not required <= set(record) or not isinstance(record["execution"], dict):
        raise ValueError("incomplete execution record")
    if (record["serializedAuthority"] != "UNTRUSTED_REQUIRES_REEXECUTION"
            or any(record[key] is not False for key in ("formalLeanProofIssued", "wholeP7Complete", "wholeM3Complete"))):
        raise ValueError("the saved envelope claims unsupported proof authority or completion")
    request = validate_request(record["request"])
    if record.get("execution", {}).get("status") != "COMPLETED" or record.get("result") is None:
        raise ValueError("only a completed result record can be compared by replay")
    if digest(request) != record["inputSHA256"]:
        raise ValueError("input hash mismatch")
    if digest({"request": request, "result": record["result"]}) != record["mathematicalSHA256"]:
        raise ValueError("mathematical result hash mismatch")
    if digest(record["environment"]) != record["environmentSHA256"]:
        raise ValueError("environment hash mismatch")
    if record["sourceBinding"] != source_binding() or record["environment"] != environment(request["kind"]):
        raise ValueError("replay requires the same source and backend; run the original input separately for a new environment")
    if record["predecessor"] != predecessor():
        raise ValueError("M2 predecessor differs")
    return request


def replay(record, max_seconds=90, memory_mib=1536):
    request = validate_record(record)
    fresh = execute(request, max_seconds, memory_mib)
    match = fresh["execution"]["status"] == "COMPLETED" and fresh["mathematicalSHA256"] == record["mathematicalSHA256"]
    return {"schema": "MathScope.M3.P7Replay/1", "status": "MATCH" if match else "MISMATCH_OR_UNRESOLVED",
            "previousRecordSHA256": record["recordSHA256"], "importedProofStatusAdopted": False, "fresh": fresh}


def read_json_file(path):
    path = Path(path)
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rb") as stream:
        data = stream.read(MAX_JSON_BYTES + 1)
    return parse_json(data)


def write_new(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = (json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")
    if len(payload) > MAX_JSON_BYTES:
        raise ValueError("serialized record exceeds the 32 MiB replay limit")
    with path.open("xb") as stream:
        if path.suffix == ".gz":
            with gzip.GzipFile(filename="", mode="wb", fileobj=stream, mtime=0) as compressed:
                compressed.write(payload)
        else:
            stream.write(payload)


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "_compute":
        memory, seconds = int(sys.argv[2]), int(sys.argv[3])
        resource.setrlimit(resource.RLIMIT_AS, (memory * 1024 * 1024,) * 2)
        resource.setrlimit(resource.RLIMIT_CPU, (seconds, seconds + 1))
        observed = {"addressSpaceBytes": list(resource.getrlimit(resource.RLIMIT_AS)),
                    "cpuSeconds": list(resource.getrlimit(resource.RLIMIT_CPU))}
        actual_environment_sha = None
        try:
            request = validate_request(parse_json(sys.stdin.buffer.read(MAX_JSON_BYTES + 1)))
            actual_environment_sha = digest(environment(request["kind"]))
            value = dispatch(request)
            sys.stdout.buffer.write(canonical({"ok": True, "value": value, "resourceLimits": observed,
                                              "environmentSHA256": actual_environment_sha}))
            return 0
        except Exception as exc:
            sys.stdout.buffer.write(canonical({"ok": False, "error": {"type": type(exc).__name__, "message": str(exc)},
                                              "resourceLimits": observed, "environmentSHA256": actual_environment_sha}))
            return 2
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    for action in ["run", "replay"]:
        command = sub.add_parser(action)
        command.add_argument("input", type=Path)
        command.add_argument("--output", required=True, type=Path)
        command.add_argument("--max-seconds", type=int, default=90)
        command.add_argument("--memory-mib", type=int, default=1536)
    args = parser.parse_args()
    try:
        value = read_json_file(args.input)
        result = execute(value, args.max_seconds, args.memory_mib) if args.command == "run" else replay(value, args.max_seconds, args.memory_mib)
        write_new(args.output, result)
        status = result.get("execution", {}).get("status", result.get("status"))
        print(json.dumps({"output": str(args.output), "status": status, "mathematicalSHA256": result.get("mathematicalSHA256")}, ensure_ascii=False))
        return 0 if status in {"COMPLETED", "MATCH"} else 2
    except (ValueError, OSError, EOFError, ModuleNotFoundError) as exc:
        print(json.dumps({"status": "REJECTED", "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
