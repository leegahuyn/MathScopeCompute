"""Execute the current P7 source/API suite and retain both outcomes and bytes."""
from pathlib import Path
import hashlib
import json
import os
import platform
import re
import resource
import subprocess
import sys
import time

root = Path(__file__).resolve().parents[4]
out = Path(__file__).resolve().parent / sys.argv[1]
out.mkdir(parents=True, exist_ok=False)
m3 = root / "research-ide/mathscope-m3"
files = [m3 / "cli.py", root / "app/p7_api.py", *sorted((m3 / "p7").glob("*.py")),
         *sorted((m3 / "p7/tests").glob("test_*.py")), root / "tests/test_p7_api.py",
         m3 / "tests/test_cli_process_cleanup.py"]

def snapshot():
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}

before = snapshot()
for path in files:
    target = out / "source" / path.relative_to(root)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(path.read_bytes())
command = [sys.executable, "-m", "pytest", "-q", "tests/test_p7_api.py",
           "research-ide/mathscope-m3/p7/tests", "research-ide/mathscope-m3/tests/test_cli_process_cleanup.py"]
env = dict(os.environ, PYTHONPATH=os.pathsep.join([str(m3), str(root)]), PYTHONDONTWRITEBYTECODE="1")
started = time.monotonic()
with (out / "pytest.log").open("wb") as log:
    process = subprocess.run(command, cwd=root, env=env, stdout=log, stderr=subprocess.STDOUT, timeout=1200)
elapsed, after = time.monotonic() - started, snapshot()
log = (out / "pytest.log").read_text(errors="replace")
counts = {key: int(value) for value, key in re.findall(r"(\d+) (passed|failed|skipped|xfailed|deselected|errors?)", log[-2000:])}
receipt = {"schema": "MathScope.M3.All64.P7CurrentSourceGate/1", "command": command,
           "moduleSearchRoots": ["research-ide/mathscope-m3", "."], "exitCode": process.returncode,
           "elapsedSeconds": elapsed, "counts": counts, "python": platform.python_version(),
           "sourceFilesBefore": before, "sourceFilesAfter": after, "sourceBytesUnchanged": before == after,
           "maximumChildRssBytes": resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss * 1024,
           "logPath": str((out / "pytest.log").relative_to(root)),
           "logSha256": hashlib.sha256((out / "pytest.log").read_bytes()).hexdigest(),
           "wholeM3Complete": False,
           "status": "PASS" if process.returncode == 0 and before == after else "FAIL"}
(out / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
print(json.dumps({k: v for k, v in receipt.items() if k not in {"sourceFilesBefore", "sourceFilesAfter", "command"}}))
print(log[-3500:])
sys.exit(0 if receipt["status"] == "PASS" else 1)
