"""Read the authentic hosted run without invoking Lean."""
from io import BytesIO
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile
import json
import subprocess
import sys


repo = "leegahuyn/MathScopeCompute"
run_id = 42996997312
head = "325a5ff7b57e4d3b6de9e9927fee5425321b097f"
output = Path(sys.argv[1]).resolve()
current = Path(sys.argv[2]).resolve()
output.mkdir(parents=True, exist_ok=True)


def api(path):
    return subprocess.check_output(["gh", "api", f"repos/{repo}/{path}"])


def digest(raw):
    return sha256(raw).hexdigest()


metadata = json.loads(api(f"actions/runs/{run_id}"))
assert (metadata["id"], metadata["conclusion"], metadata["status"], metadata["head_sha"]) == (
    run_id, "success", "completed", head,
)
artifacts = json.loads(api(f"actions/runs/{run_id}/artifacts"))["artifacts"]
(artifact,) = [item for item in artifacts if item["name"] == "mathscope-m4-closure"]
assert not artifact["expired"]
archive = api(f"actions/artifacts/{artifact['id']}/zip")
assert artifact["digest"] == f"sha256:{digest(archive)}"
assert artifact["size_in_bytes"] == len(archive)
archive_path = output / "github-run-42996997312.zip"
archive_path.write_bytes(archive)

modules = {
    "Analytic": "uniform_limit_uniformly_continuous",
    "Comparison": "uniform_continuity_adapter",
}
verified = []
with ZipFile(BytesIO(archive)) as zip_file:
    assert zip_file.testzip() is None
    raw_receipt = zip_file.read("receipt.json")
    receipt = json.loads(raw_receipt)
    assert receipt["githubRunId"] == str(run_id)
    assert receipt["commit"] == head and receipt["verdict"] == "PASS"
    for module, target in modules.items():
        source_path = f"MathScope/M4/{module}.lean"
        (source,) = [item for item in receipt["sources"] if item["path"] == source_path]
        source_bytes = zip_file.read("sources/" + source_path)
        assert digest(source_bytes) == source["sha256"]
        assert (current / source["repoPath"]).read_bytes() == source_bytes
        (execution,) = [
            item for item in receipt["executions"]
            if item["label"] == "compile-MathScope-M4-" + module
        ]
        assert execution["exitCode"] == 0 and not execution["warnings"] and not execution["usesSorry"]
        log = zip_file.read(execution["log"])
        olean = zip_file.read(f"compiled/MathScope/M4/{module}.olean")
        assert digest(log) == execution["logSHA256"]
        assert digest(olean) == execution["oleanSHA256"]
        fqname = f"MathScope.M4.{module}.{target}"
        exact_type, conclusion = log.decode("utf-8").split(f"'{fqname}'")
        assert exact_type.startswith(fqname + " ")
        assert conclusion.strip() == "does not depend on any axioms"
        verified.append({
            "module": f"MathScope.M4.{module}",
            "target": fqname,
            "targetType": exact_type.strip(),
            "sourcePath": source["repoPath"],
            "sourceSha256": source["sha256"],
            "logSha256": execution["logSHA256"],
            "oleanSha256": execution["oleanSHA256"],
            "axioms": [],
        })
    adapter_source = zip_file.read("sources/MathScope/M4/Comparison.lean").decode()
    assert "import MathScope.M4.Analytic\n" in adapter_source
    assert "  MathScope.M4.Analytic.uniform_limit_uniformly_continuous mx my u f hUniform hContinuous\n" in adapter_source

assert len({row["targetType"][len(row["target"]):] for row in verified}) == 1
report = {
    "schema": "MathScope.M4.I304.GitHubReadback/1",
    "runId": run_id,
    "runUrl": metadata["html_url"],
    "sourceCommit": head,
    "conclusion": metadata["conclusion"],
    "executedAt": metadata["updated_at"],
    "artifactId": artifact["id"],
    "archiveSha256": digest(archive),
    "receiptSha256": digest(raw_receipt),
    "leanVersion": receipt["leanVersion"],
    "targets": verified,
    "currentKernelExecuted": False,
}
(output / "github-readback.json").write_bytes((json.dumps(report, indent=2) + "\n").encode())
print(json.dumps(report, indent=2))
