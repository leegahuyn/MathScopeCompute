"""Write compact, source-bound continuation evidence, without rerunning M2."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import cli


def main():
    target = ROOT / "evidence" / "resume-20261012" / sys.argv[1]
    target.mkdir(parents=True, exist_ok=False)
    source = cli.source_binding()
    requests = {
        "zeta-2": cli.read_json_file(ROOT / "examples/zeta-2.json"),
        "elliptic-local": cli.read_json_file(ROOT / "examples/elliptic-37a1.json"),
        "central-11a1": {"kind": "p7.elliptic_analytic", "input": {"model": "11a1"}},
        "central-37a1": {"kind": "p7.elliptic_analytic", "input": {"model": "37a1"}},
        "explicit-psi": {"kind": "p7.explicit_formula", "input": {}},
        "taylor-zeta": {"kind": "p7.taylor_remainder", "input": {}},
        "operator-reference": {"kind": "p7.operator_audit", "input": {}},
    }
    manifest = {"schema": "MathScope.M3.P7ContinuationExecution/1", "startedAt": datetime.now(timezone.utc).isoformat(),
                "sourceBinding": source, "predecessor": cli.predecessor(), "runs": [], "replays": [],
                "M2Reexecuted": False, "wholeP7Complete": False, "wholeM3Complete": False}
    success = True
    for name, request in requests.items():
        inp = target / (name + "-request.json")
        cli.write_new(inp, request)
        output = target / (name + ".json.gz")
        command = [sys.executable, str(ROOT / "cli.py"), "run", str(inp), "--output", str(output),
                   "--max-seconds", "90", "--memory-mib", "384"]
        process = subprocess.run(command, capture_output=True, text=True, timeout=105)
        record = cli.read_json_file(output) if output.exists() else {}
        result = record.get("result") or {}
        row = {"id": name, "kind": request["kind"], "observedExitCode": process.returncode,
               "execution": record.get("execution"), "resultStatus": result.get("status"),
               "toleranceMet": result.get("toleranceMet"), "analyticRank": result.get("analyticRank"),
               "mathematicalSHA256": record.get("mathematicalSHA256"), "recordSHA256": record.get("recordSHA256"),
               "artifact": output.name, "bytes": output.stat().st_size if output.exists() else None,
               "sha256": cli.file_hash(output) if output.exists() else None, "stdout": process.stdout, "stderr": process.stderr}
        manifest["runs"].append(row)
        success &= process.returncode == 0 and record.get("sourceBinding") == source
        print(json.dumps({"run": name, "exit": process.returncode, "resultStatus": row["resultStatus"]}), flush=True)
        if name in ("central-37a1", "explicit-psi", "taylor-zeta") and process.returncode == 0:
            replay_path = target / (name + "-replay.json.gz")
            replay_command = [sys.executable, str(ROOT / "cli.py"), "replay", str(output), "--output", str(replay_path),
                              "--max-seconds", "90", "--memory-mib", "384"]
            replayed = subprocess.run(replay_command, capture_output=True, text=True, timeout=105)
            replay = cli.read_json_file(replay_path) if replay_path.exists() else {}
            manifest["replays"].append({"id": name, "observedExitCode": replayed.returncode, "status": replay.get("status"),
                "artifact": replay_path.name, "bytes": replay_path.stat().st_size if replay_path.exists() else None,
                "sha256": cli.file_hash(replay_path) if replay_path.exists() else None,
                "stdout": replayed.stdout, "stderr": replayed.stderr})
            success &= replayed.returncode == 0 and replay.get("status") == "MATCH"
            print(json.dumps({"replay": name, "exit": replayed.returncode, "status": replay.get("status")}), flush=True)
    manifest["sourceUnchanged"] = cli.source_binding() == source
    success &= manifest["sourceUnchanged"]
    manifest.update(finishedAt=datetime.now(timezone.utc).isoformat(), allRequestedProcessesSucceeded=bool(success))
    cli.write_new(target / "manifest.json", manifest)
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
