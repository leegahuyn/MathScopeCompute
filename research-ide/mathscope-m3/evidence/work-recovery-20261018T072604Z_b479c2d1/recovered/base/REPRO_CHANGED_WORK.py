#!/usr/bin/env python3
"""Verify package bytes and replay only the changed scoped checks.

This does not rerun the supplied Windows launcher or the initial 1260 duties.
Exit 0 certifies this replay, not a mathematical M3 closure.
"""
import argparse
import hashlib
import json
import platform
from pathlib import Path
import subprocess
import shutil
import sys
import time
from datetime import datetime, timezone


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--actual-signed', action='store_true', help='Also repeat the expensive actual signed stage, in a fresh copy.')
    parser.add_argument('--actual-finite-cycle', action='store_true', help='Also repeat the approximately 29-minute actual N6-02 cycle in a fresh copy.')
    options = parser.parse_args()
    root = Path(__file__).resolve().parent
    manifest = json.loads((root / "FILE_INDEX.json").read_text(encoding="utf-8"))
    for entry in manifest["files"]:
        source = root / entry["path"]
        raw = source.read_bytes()
        if len(raw) != entry["size_bytes"] or hashlib.sha256(raw).hexdigest() != entry["sha256"]:
            raise SystemExit("Package hash mismatch: " + entry["path"])
    output = root / ("repro_output_" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ"))
    output.mkdir()
    py = [sys.executable, "-X", "utf8", "-B"]
    node = shutil.which('node')
    if not node:
        raise SystemExit('Node.js is required for the source-module and actual-core checks.')
    jobs = [
        ("integrated_tests", root / "work/integrated_verifier/code", py + ["-m", "unittest", "-v", "test_all_eight_items.py", "test_numerics_corrections.py"]),
        ("integrated_cli", root, py + [str(root / "work/integrated_verifier/code/verify_all_eight_items.py"), "--root", str(root / "work/integrated_verifier"), "--out", str(output / "INTEGRATED_RESULTS.json")]),
        ("recovered_input_tests", root / "work/recovered_input_fix/workspace", py + ["-m", "unittest", "-v", "test_wave_source_connection.py"]),
        ("recovered_input_cli", root / "work/recovered_input_fix/workspace", py + ["wave_source_connection.py", "--root", str(root / "work/recovered_input_fix/workspace"), "--out", str(output / "RECOVERED_INPUT_RESULT.json")]),
        ("transport_application", root, py + [str(root / "work/theorem_connection/transport/verify_transport_application.py"), "--workspace", str(root), "--output-dir", str(output / "transport")]),
        ("stage_connection", root, py + [str(root / "work/theorem_connection/code/verify_stage_connection.py"), "--root", str(root), "--out", str(output / "STAGE_SOURCE_APPLICATION.json")]),
    ]
    extra = root / "REPRO_ADDITIONAL_JOBS.json"
    if extra.exists():
        for job in json.loads(extra.read_text(encoding="utf-8")):
            args = [arg.replace("{ROOT}", str(root)).replace("{OUT}", str(output)) for arg in job["args"]]
            runtime = [node] if job.get('runtime') == 'node' else py
            jobs.append((job["name"], root / job.get("cwd", "."), runtime + args))
    signed = output / 'signed_replay'
    shutil.copytree(root / 'work/recovered_input_fix/signed_pressure_repair', signed)
    jobs += [
        ('signed_module_syntax', signed, [node, '--check', 'overlay/research-ide/mathscope-m3/navier/source-global-signed-full-pressure.mjs']),
        ('signed_private_boundary', signed, [node, 'check_private_boundary.mjs']),
    ]
    if options.actual_signed:
        archived = signed / 'archived_previous_run'
        archived.mkdir(exist_ok=True)
        for name in ['ACTUAL_CONSTRUCTION_RECEIPT.json','ACTUAL_RUN_PROCESS.json','FINAL_SUMMARY.json','BOUNDARY_CHECK.json']:
            previous = signed / name
            if previous.exists():
                shutil.move(str(previous), str(archived / name))
        jobs.append(('actual_signed_stage', signed, [node, '--max-old-space-size=4096', 'run_actual_signed_stage.mjs']))
    finite = output / 'finite_cycle_replay'
    shutil.copytree(root / 'work/n602_continuation', finite)
    jobs += [
        ('finite_cycle_source_integrity', finite, py + ['verify_source_inputs.py']),
        ('finite_cycle_module_syntax', finite, [node, '--check', 'source/research-ide/mathscope-m3/navier/source-finite-cycle-continuation.mjs']),
        ('finite_cycle_kernel_syntax', finite, [node, '--check', 'source/research-ide/mathscope-m3/navier/source-continuation-kernels.mjs']),
        ('finite_cycle_private_boundary', finite, [node, 'test_private_boundaries.mjs']),
    ]
    if options.actual_finite_cycle:
        archived = finite / 'archived_previous_run'
        archived.mkdir(exist_ok=True)
        old_logs = finite / 'logs'
        if old_logs.exists():
            shutil.move(str(old_logs), str(archived / 'logs'))
        old_logs.mkdir()
        for name in ['ACTUAL_FINITE_CYCLE_RECEIPT.json','ACTUAL_PROCESS.json','ACTUAL_PROCESS_RUNNING.json','FINITE_CYCLE_RESULT.json','FINITE_CYCLE_RESULT.md']:
            previous = finite / name
            if previous.exists():
                shutil.move(str(previous), str(archived / name))
        jobs.append(('actual_finite_cycle', finite, py + ['run_actual_finite_cycle.py']))
    receipt = {"python": sys.version, "platform": platform.platform(), "scope": "Changed checks only; no initial1260 or original Windows launcher rerun; pass does not imply M3 closure", "expensive_actual_signed_stage_requested": options.actual_signed, "expensive_actual_finite_cycle_requested": options.actual_finite_cycle, "input_hashes_verified": len(manifest["files"]), "steps": []}
    for name, cwd, args in jobs:
        started = time.monotonic()
        result = subprocess.run(args, cwd=cwd, capture_output=True)
        duration = time.monotonic() - started
        (output / (name + ".stdout.log")).write_bytes(result.stdout)
        (output / (name + ".stderr.log")).write_bytes(result.stderr)
        (output / (name + ".exit.txt")).write_text(str(result.returncode) + "\n", encoding="utf-8")
        receipt["steps"].append({"name": name, "cwd": str(cwd), "command": args, "exit_code": result.returncode})
        if name == 'actual_signed_stage':
            (signed / 'ACTUAL_RUN_PROCESS.json').write_text(json.dumps({'scope':'Fresh optional reproduction, distinct from archived successful execution.','command':args,'exit_code':result.returncode,'duration_seconds':duration,'passed':result.returncode == 0},indent=2)+'\n',encoding='utf-8')
        print(name + ": exit " + str(result.returncode), flush=True)
    receipt["passed"] = all(step["exit_code"] == 0 for step in receipt["steps"])
    (output / "REPRO_RECEIPT.json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0 if receipt["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
