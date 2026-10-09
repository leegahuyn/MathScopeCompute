import json
from pathlib import Path
import subprocess
import sys


def test_documented_benchmark_command_runs_from_repository_root():
    completed = subprocess.run(
        [sys.executable, "tools/benchmark_stage8.py"],
        cwd=Path(__file__).resolve().parents[1],
        capture_output=True, text=True, timeout=60, check=True,
    )
    report = json.loads(completed.stdout)
    assert report["benchmark"] == "stage8-reference"
    assert report["releasePassFromSpeedAlone"] is False
    assert {row["name"] for row in report["results"]} == {
        "advanced.zeta-complex-surface.v1", "advanced.spectral-flow-reference.v1",
    }
    assert all(row["grade"] == "NUMERICAL INDICATOR" for row in report["results"])
