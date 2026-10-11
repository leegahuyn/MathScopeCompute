"""Run the nine published inputs and three genuinely fresh CLI replays."""
from datetime import datetime, timezone
import hashlib
from pathlib import Path
import re
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import cli

NAMES = ("zeta-2", "gamma-half", "zeta-critical-jet", "xi-removable-one", "xi-critical",
         "zeros-to-20", "zeros-to-30", "elliptic-11a1", "elliptic-37a1")
REPLAYS = ("zeta-critical-jet", "zeros-to-30", "elliptic-37a1")


def reference(path):
    data = path.read_bytes()
    return {"path": path.relative_to(ROOT).as_posix(), "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest()}


def main():
    attempt = sys.argv[1] if len(sys.argv) == 2 else "attempt1"
    if not re.fullmatch(r"attempt[1-9][0-9]*", attempt):
        raise SystemExit("expected attemptN")
    output = ROOT / f"evidence/p7-release-20261011/{attempt}"
    output.mkdir(parents=True, exist_ok=False)
    before = cli.source_binding()
    rows = []
    for action, name in [("run", n) for n in NAMES] + [("replay", n) for n in REPLAYS]:
        # The released records use plain JSON. Two earlier compressed height-30
        # files changed after successful initial reads; their cause is unknown
        # and their original process/integrity observations are retained.
        extension = ".json"
        input_path = ROOT / f"examples/{name}.json" if action == "run" else output / f"{name}{extension}"
        output_path = output / f"{name}{'-replay' if action == 'replay' else ''}{extension}"
        command = [sys.executable, str(ROOT / "cli.py"), action, str(input_path), "--output", str(output_path)]
        started = datetime.now(timezone.utc).isoformat()
        tick = time.monotonic()
        child = subprocess.Popen(command, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        timed_out = False
        try:
            log, _ = child.communicate(timeout=120)
        except subprocess.TimeoutExpired:
            timed_out = True
            child.kill()
            log, _ = child.communicate()
        elapsed = time.monotonic() - tick
        log_path = output / f"{name}{'-replay' if action == 'replay' else ''}.log"
        with log_path.open("xb") as stream:
            stream.write(log)
        row = {"action": action, "name": name, "command": command, "input": reference(input_path),
               "startedAt": started, "finishedAt": datetime.now(timezone.utc).isoformat(),
               "elapsedSeconds": elapsed, "observedExitCode": child.returncode, "timedOut": timed_out,
               "log": reference(log_path), "output": reference(output_path) if output_path.exists() else None,
               "success": False}
        if child.returncode == 0 and not timed_out and output_path.exists():
            saved = cli.read_json_file(output_path)
            if action == "replay":
                row.update(status=saved["status"], success=saved["status"] == "MATCH",
                           mathematicalSHA256=saved["fresh"]["mathematicalSHA256"],
                           importedProofStatusAdopted=saved["importedProofStatusAdopted"])
            else:
                value = saved["result"]
                row.update(status=saved["execution"]["status"], mathematicalSHA256=saved["mathematicalSHA256"])
                kind = saved["request"]["kind"]
                if kind == "p7.special_function":
                    row.update(resultStatus=value["status"], toleranceMet=value["toleranceMet"],
                               success=value["status"] == "finite" and value["toleranceMet"])
                elif kind == "p7.zeta_zeros":
                    row.update(resultStatus=value["status"], positiveZeroCount=value.get("positiveZeroCount"),
                               success=value["status"] == "FINITE_RH_TO_T" and value["pass"])
                else:
                    row.update(resultStatus=value["global"]["status"], conductor=value["global"]["conductor"],
                               rootNumber=value["global"]["globalRootNumber"],
                               success=value["global"]["allBadFactorsCertified"] and value["dirichletCoefficients"] is not None)
                row["success"] = row["success"] and saved["execution"]["status"] == "COMPLETED"
        rows.append(row)
        cli.write_new(output / f"{name}{'-replay' if action == 'replay' else ''}-process.json", row)
        print(f"{action} {name}: exit={child.returncode} success={row['success']} ({elapsed:.3f}s)", flush=True)
    after = cli.source_binding()
    success = len(rows) == 12 and all(row["success"] for row in rows) and before == after
    receipt = {"schema": "MathScope.M3.P7.ObservedReleaseExamples/1", "success": success,
               "sourceBindingBefore": before, "sourceBindingAfter": after, "sourceBytesUnchanged": before == after,
               "examplesRun": 9, "freshCLIReplaysRun": 3, "runs": rows,
               "runner": reference(Path(__file__).resolve()), "M2Predecessor": cli.predecessor(),
               "formalLeanProofIssued": False, "wholeP7Complete": False, "wholeM3Complete": False}
    cli.write_new(output / "release-examples.json", receipt)
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
