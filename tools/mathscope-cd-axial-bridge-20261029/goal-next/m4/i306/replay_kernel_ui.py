import argparse
from hashlib import sha256
import gzip
import importlib.util
import json
from pathlib import Path
import re
import sys

parser = argparse.ArgumentParser()
parser.add_argument("repo", type=Path)
parser.add_argument("baseline", type=Path)
parser.add_argument("fixture_manifest", type=Path)
parser.add_argument("pinned", type=Path)
parser.add_argument("core", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()

def read(path):
    return json.loads(path.read_bytes())

def digest(data):
    return sha256(data).hexdigest()

def save(name, data):
    (args.output / name).write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

run = read(args.output / "hosted-run.json")
assert run["databaseId"] == 42998472759 and run["conclusion"] == "success"
pinned = read(args.pinned / "receipt.json")
core = read(args.core / "receipt.json")
assert pinned["sourceCommit"] == core["sourceCommit"] == run["headSha"]
assert pinned["cleanWorkDirectory"] and pinned["actualKernelExecuted"] and pinned["allPinnedTargetsVerified"]
assert pinned["exitCode"] == core["exitCode"] == 0
for key in ("leanVersion", "leanCommit", "mathlibCommit", "mathlibLakeManifestSha256", "runtimeLibrarySha256"):
    assert pinned["actualEnvironment"][key] == pinned["expectedEnvironment"][key], key
assert core["environment"]["leanCommit"] == pinned["expectedEnvironment"]["leanCommit"]
assert digest((args.pinned / "mathlib-lake-manifest.json").read_bytes()) == pinned["actualEnvironment"]["mathlibLakeManifestSha256"]

def audit(root, receipt):
    source_paths = {}
    for row in receipt["sources"]:
        path = root / "sources" / row["path"]
        if row["path"] in {"lakefile.lean", "lean-toolchain"}:
            path = root / row["path"]
        data = path.read_bytes()
        assert len(data) == row["bytes"] and digest(data) == row["sha256"], path
        source_paths[row["path"]] = path
    compiled = {}
    runs = {}
    logs = {}
    for row in receipt["executions"]:
        name = row["name"]
        data = (root / row["logPath"]).read_bytes()
        assert digest(data) == row["logSha256"], name
        logs[name] = data.decode("utf-8")
        assert row["elapsedMilliseconds"] >= 0 and row["warnings"] == [], row
        if name.startswith("compile-"):
            assert row["exitCode"] == 0
            assert not re.search(r"(?im)^.*\bwarning:|\bsorryAx\b|\buses 'sorry'\b", logs[name]), name
            compiled[name] = logs[name]
        runs[name] = {k: row[k] for k in ("exitCode", "elapsedMilliseconds", "warnings", "logPath", "logSha256")}
    for row in receipt["targets"]:
        name = row["target"]
        type_and_axioms = [v for v in compiled.values() if name + "'" in v]
        assert len(type_and_axioms) == 1 and row["targetType"] in type_and_axioms[0], name
        lines = type_and_axioms[0]
        assert all(axiom in lines for axiom in row["axioms"]), name
        assert "sorryAx" not in row["axioms"]
    false = next(row for row in receipt["negativeControls"] if row["name"] == "NegativeFalse")
    false_name = next(name for name in logs if "negativefalse" in name.lower())
    assert false["exitCode"] != 0 and false["rejectedForExpectedReason"] and runs[false_name]["exitCode"] == false["exitCode"]
    assert "Tactic `rfl` failed" in logs[false_name] and "0 = 1" in logs[false_name]
    false_source = source_paths["NegativeFalse.lean"].read_text(encoding="utf-8")
    assert re.search(r"(?:\(0\s*:\s*Nat\)|0)\s*=\s*1[^\n]*:= by", false_source) and re.search(r"\brfl\b", false_source)
    return {"sources": len(source_paths), "successfulCompiles": len(compiled), "targets": len(receipt["targets"]),
            "usesSorry": False, "runs": runs, "falseRflExitCode": false["exitCode"]}

audits = {"pinned": audit(args.pinned, pinned), "core": audit(args.core, core)}
save("kernel-audit.json", {"run": run, "environment": pinned["actualEnvironment"], "audits": audits})
kernel = {"run": run, "pinned": pinned, "core": core}
observed = gzip.decompress(args.baseline.read_bytes())
assert digest(observed) == "e6ebde6250a861296554f26305cb40200b0a70e822acb3f588e9dca423d6e784"
sys.dont_write_bytecode = True
builder_path = args.repo / "research-ide/mathscope-m4/web/build-release-lab.py"
spec = importlib.util.spec_from_file_location("mathscope_release_lab_builder", builder_path)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
verification = read(args.fixture_manifest)
assert verification["pass"] is True
catalog = read(args.repo / "research-ide/mathscope-m4/release-lab/catalog.json")
_, candidate, manifest = builder.build(observed.decode("utf-8"), catalog, verification, kernel)
assert manifest["reversible"] and manifest["unrelatedBytesPreserved"]
assert digest(candidate.encode()) == manifest["candidateSHA256"]
(args.output / "candidate.html").write_bytes(candidate.encode())
save("browser-build.json", {**manifest, "builderSHA256": digest(builder_path.read_bytes()),
    "fixtureManifestSHA256": digest(args.fixture_manifest.read_bytes())})
print(f"I3-06 verified {len(pinned['targets'])} pinned and {len(core['targets'])} core kernel target logs")
