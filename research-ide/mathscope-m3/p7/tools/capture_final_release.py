#!/usr/bin/env python3
"""Capture fresh bounded CLI executions and independent process replays.

Run after the P7 mathematical source/CLI freeze. The output directory must
not exist, so an unsuccessful attempt cannot silently replace prior evidence.
This is an execution receipt generator, not a mathematical certificate or CI.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
import cli


def now():
    return datetime.now(timezone.utc).isoformat()


def write_new(path, value):
    with Path(path).open("xb") as stream:
        stream.write((json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode())


def file_receipt(path, directory):
    payload = path.read_bytes()
    return {"path": str(path.relative_to(directory)), "bytes": len(payload),
            "sha256": hashlib.sha256(payload).hexdigest()}


def cases():
    example_dir = ROOT / "p7/examples"

    def example(filename):
        return cli.read_json_file(example_dir / filename)

    def request(kind, data):
        return {"kind": kind, "input": data}

    operator = example("registered-operator.json")
    universal = example("universal-bsd-research.json")
    universal["input"]["researchHypotheses"] = [
        {"id": "OPERATOR-" + key, "statement": statement, "role": "ASSUMPTION"}
        for key, statement in operator["input"]["registration"]["hypotheses"].items()
    ]
    return [
        ("zeta-2", "ζ(2) · 도함수와 전역 정규화", request("p7.special_function", {
            "operation": "zeta", "s": {"real": "2", "imag": "0"}, "precisionBits": 192, "tolerance": "1e-40"})),
        ("zeta-em-critical", "ζ(1/2+14i) · Euler–Maclaurin 오차 분리", request("p7.zeta_em", {"s": {"real": "1/2", "imag": "14"}})),
        ("euler-finite", "유한 Euler 곱 · 수렴영역 안의 탐색", request("p7.euler_product", {
            "s": {"real": "2", "imag": "0"}, "primes": [2, 3, 5, 7, 11, 13]})),
        ("zeros-20", "T=20 · 전체 개수와 Hardy 영점 분리", request("p7.zeta_zeros", {
            "height": "20", "precisionBits": 128, "tolerance": "1e-20"})),
        ("zeros-30", "T=30 · 중복도를 포함한 전체 영점 개수", request("p7.zeta_zeros", {
            "height": "30", "precisionBits": 128, "tolerance": "1e-20"})),
        ("elliptic-local", "37a1 · 정확한 국소 인자와 유리점", request("p7.elliptic_local", {
            "model": "37a1", "primes": [2, 3, 5, 7, 11, 13, 37], "coefficientLimit": 64})),
        ("central-11a1", "11a1 · 중앙값 비영 구간", request("p7.elliptic_analytic", {"model": "11a1"})),
        ("central-37a1", "37a1 · parity 영값과 비영 도함수", request("p7.elliptic_analytic", {"model": "37a1"})),
        ("complex-37a1", "37a1 · 일반 복소 Mellin 연속", request("p7.elliptic_complex", {
            "model": "37a1", "s": {"real": "1/2", "imag": "7/3"}})),
        ("complex-additive-32", "Conductor 32 · additive 인자와 복소 L", request("p7.elliptic_complex", {
            "model": [0, 0, 0, -1, 0], "s": {"real": "1", "imag": "2"}})),
        ("arithmetic-11a1", "11a1 · 독립 산술 rank 0", request("p7.elliptic_arithmetic", {
            "model": "11a1", "coefficientLimit": 64, "precisionBits": 192, "heightIterations": 7})),
        ("arithmetic-37a1", "37a1 · descent 상계·높이·전체 포화", request("p7.elliptic_arithmetic", {
            "model": "37a1", "coefficientLimit": 64, "precisionBits": 192, "heightIterations": 7})),
        ("explicit-psi", "ψ(10.5) · log(2520)과 T=30 명시적 공식", request("p7.explicit_formula", {})),
        ("taylor-zeta", "ζ · 유한 변위 Taylor 나머지", request("p7.taylor_remainder", {})),
        ("operator-reference", "ℓ² 기준 연산자 · 무한 꼬리와 반증", request("p7.operator_audit", {})),
        ("operator-registered", "등록 연산자 · 절단 2개와 실제 음성 대조", operator),
        ("modular-11a1", "11a1 · 정확한 modular-symbol 비영값", request("p7.modular_symbols", {"model": "11a1"})),
        ("modular-37a1", "37a1 · 정확한 modular-symbol 영값", request("p7.modular_symbols", {"model": "37a1"})),
        ("typed-finite-20", "유한 높이 결과 타입 · T=20", example("finite-zero-20.json")),
        ("typed-rank-37a1", "특정 곡선 결과 타입 · rank equality", example("specific-rank-37a1.json")),
        ("typed-refined-37a1", "Leading term 결과 타입 · Sha 가정 구분", example("refined-37a1-conditional.json")),
        ("typed-universal-open", "보편 추측 결과 타입 · 연구 가정 Lean 목록", universal),
        ("typed-omitted-coefficient-prime", "누락 거부 · 계수 17과 소수 37", example("reject-omitted-coefficient-and-prime.json")),
        ("typed-omitted-zero", "누락 거부 · T=20 첫 양의 영점", example("reject-omitted-zero.json")),
        ("typed-finite-field-copy", "승격 거부 · 유한체에서 classical RH", example("reject-finite-field-rh-copy.json")),
    ]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--max-seconds", type=int, default=90)
    parser.add_argument("--memory-mib", type=int, default=384)
    args = parser.parse_args()
    directory = args.output.resolve()
    directory.mkdir(parents=True, exist_ok=False)
    initial_source = cli.source_binding()
    source_epoch = cli.digest(initial_source)
    base = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
    prepared = cases()
    assert {request["kind"] for _, _, request in prepared} == cli.KINDS
    manifest = {
        "schema": "MathScope.M3.P7FrozenExecutionRelease/1", "startedAt": now(),
        "baseCommitAtExecution": base, "sourceBinding": initial_source,
        "sourceEpochSHA256": source_epoch,
        "sourceEpochMeaning": "SHA256 of canonical complete CLI sourceBinding, not a claim that working source equals baseCommitAtExecution",
        "predecessor": cli.predecessor(), "producer": {"path": "p7/tools/capture_final_release.py", "sha256": cli.file_hash(__file__)},
        "requestedLimits": {"maxSeconds": args.max_seconds, "memoryLimitMiB": args.memory_mib},
        "expectedKinds": sorted(cli.KINDS), "runs": [], "failures": [],
        "authority": "LOCAL_FRESH_PROCESS_EXECUTIONS_AND_REPLAYS; NOT_CI_OR_PUBLIC_DEPLOYMENT",
        "wholeP7Complete": False, "wholeM3Complete": False, "formalLeanProofIssued": False,
    }
    write_new(directory / "source-epoch.json", {key: manifest[key] for key in (
        "schema", "startedAt", "baseCommitAtExecution", "sourceBinding", "sourceEpochSHA256", "sourceEpochMeaning", "predecessor", "producer")})
    begin = time.monotonic()
    for name, title, request in prepared:
        if cli.source_binding() != initial_source:
            manifest["failures"].append({"id": name, "reason": "SOURCE_CHANGED_BEFORE_EXECUTION"})
            break
        request_path = directory / (name + "-request.json")
        output_path = directory / (name + ".json.gz")
        replay_path = directory / (name + "-replay.json.gz")
        write_new(request_path, request)
        commands = []
        row = {"id": name, "title": title, "kind": request["kind"], "request": file_receipt(request_path, directory)}
        try:
            for action, input_path, result_path in (("run", request_path, output_path), ("replay", output_path, replay_path)):
                command = [sys.executable, str(ROOT / "cli.py"), action, str(input_path), "--output", str(result_path),
                           "--max-seconds", str(args.max_seconds), "--memory-mib", str(args.memory_mib)]
                started = now()
                process = subprocess.run(command, cwd=ROOT, capture_output=True, check=False)
                stdout_path, stderr_path = directory / (name + "-" + action + ".stdout"), directory / (name + "-" + action + ".stderr")
                stdout_path.write_bytes(process.stdout)
                stderr_path.write_bytes(process.stderr)
                commands.append({"action": action, "argv": command, "startedAt": started, "finishedAt": now(),
                                 "observedExitCode": process.returncode, "stdout": file_receipt(stdout_path, directory),
                                 "stderr": file_receipt(stderr_path, directory)})
                if process.returncode != 0:
                    raise RuntimeError(action + " CLI process exited " + str(process.returncode))
                observed = cli.read_json_file(result_path)
                if action == "run":
                    cli.validate_record(observed)
                    record = observed
                    if record["sourceBinding"] != initial_source:
                        raise RuntimeError("Execution belongs to a different source epoch")
                    row.update({"artifact": file_receipt(output_path, directory), "execution": record["execution"],
                                "recordSHA256": record["recordSHA256"], "mathematicalSHA256": record["mathematicalSHA256"],
                                "inputSHA256": record["inputSHA256"], "environmentSHA256": record["environmentSHA256"],
                                "resultStatus": record["result"].get("status"), "resultType": record["result"].get("resultType"),
                                "toleranceMet": record["result"].get("toleranceMet"), "scope": record["result"].get("scope")})
                else:
                    cli.validate_record(observed["fresh"])
                    if (observed["status"] != "MATCH" or observed["previousRecordSHA256"] != record["recordSHA256"]
                            or observed["fresh"]["mathematicalSHA256"] != record["mathematicalSHA256"]
                            or observed["fresh"]["sourceBinding"] != initial_source):
                        raise RuntimeError("Fresh replay did not match its original mathematical result and source")
                    row.update({"replay": file_receipt(replay_path, directory), "replayStatus": observed["status"],
                                "replayFreshRecordSHA256": observed["fresh"]["recordSHA256"], "freshReplayExecuted": True})
            row["passed"] = True
        except Exception as exc:
            row["passed"] = False
            manifest["failures"].append({"id": name, "type": type(exc).__name__, "reason": str(exc)})
        row["processes"] = commands
        manifest["runs"].append(row)
        print(json.dumps({"id": name, "passed": row["passed"], "resultStatus": row.get("resultStatus"),
                          "replayStatus": row.get("replayStatus"), "completed": len(manifest["runs"]), "total": len(prepared)}), flush=True)
    manifest.update({"finishedAt": now(), "elapsedSeconds": time.monotonic()-begin,
                     "sourceUnchanged": cli.source_binding() == initial_source,
                     "observedKinds": sorted({row["kind"] for row in manifest["runs"] if row["passed"]}),
                     "completedRunCount": sum(row["passed"] for row in manifest["runs"]),
                     "freshCLIChildExecutionCount": sum(len(row["processes"]) for row in manifest["runs"]),
                     "allKindsCovered": {row["kind"] for row in manifest["runs"] if row["passed"]} == cli.KINDS})
    manifest["status"] = "PASS" if (manifest["sourceUnchanged"] and manifest["allKindsCovered"]
                                         and not manifest["failures"] and len(manifest["runs"]) == len(prepared)) else "FAILED"
    write_new(directory / "manifest.json", manifest)
    print(json.dumps({"status": manifest["status"], "sourceEpochSHA256": source_epoch,
                      "runs": manifest["completedRunCount"], "kinds": len(manifest["observedKinds"]),
                      "manifest": str(directory / "manifest.json")}), flush=True)
    return 0 if manifest["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
