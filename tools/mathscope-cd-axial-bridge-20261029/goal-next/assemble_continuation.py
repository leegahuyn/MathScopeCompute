"""Archive the current branch and verify both evidence checkpoints."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--workspace", type=Path, default=Path.cwd())
parser.add_argument("--checkpoint", default="Continuation")
parser.add_argument("--corrected-first-artifact", type=Path)
parser.add_argument("--corrected-cycle-artifact", type=Path)
parser.add_argument("--n2-artifact", type=Path)
parser.add_argument("--isolated-candidate", type=Path)
parser.add_argument("--second-candidate-artifact", type=Path)
parser.add_argument("--y-replay-dir", type=Path)
parser.add_argument("--final-functionals", type=Path)
parser.add_argument("--first-gauge-graph", type=Path)
parser.add_argument("--localization-source", type=Path)
parser.add_argument("--r108-deploy-archive", type=Path)
parser.add_argument("--primary-order2-artifact", type=Path)
parser.add_argument("--whole-k-n0-artifact", type=Path)
parser.add_argument("--core-runtime", type=Path)
parser.add_argument("--diagonal-n2-artifact", type=Path)
parser.add_argument("--diagonal-n3-artifact", type=Path)
parser.add_argument("--diagonal-n4-artifact", type=Path)
parser.add_argument("--n2-y-reached", type=Path)
parser.add_argument("--historical-scale-input", type=Path)
args = parser.parse_args()
TASK = args.workspace.resolve()
REPO = TASK / "work/MathScopeCompute-CD"
OUT = TASK / "outputs"
PREVIOUS = OUT / "MathScope_Goal_Evidence_20261111.zip"
DEST = OUT / f"MathScope_Goal_{args.checkpoint}_20261111.zip"
PREFIX = "tools/mathscope-cd-axial-bridge-20261029"
CURRENT = PREFIX + "/goal-next"
AUDITOR = "research-ide/mathscope-m4/acceptance.mjs"
EXTRAS = [
    AUDITOR, ".github/workflows/mathscope-m4-generated-jobs.yml",
    ".github/workflows/mathscope-cd-axial-bridge-20261029.yml",
    ".github/workflows/mathscope-corrected-first-force.yml",
    ".github/workflows/mathscope-corrected-first-cycle.yml",
    ".github/workflows/mathscope-second-forced-candidates.yml",
    ".github/workflows/mathscope-original-axial-n2.yml",
    ".github/workflows/mathscope-primary-order2.yml",
    ".github/workflows/mathscope-primary-forced-join.yml",
    ".github/workflows/mathscope-original-whole-k-prefix.yml",
    PREFIX + "/axial-exterior/check_source_guards.py",
    PREFIX + "/goal-20261111/y/exact_original_node_children.mjs",
    PREFIX + "/goal-20261111/y/original_native_semantic_definitions.mjs",
    PREFIX + "/goal-20261111/m3/whole-k-chart.json",
    "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/WholeKCutoff.lean",
    "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/AxialMomentBridge.lean",
    "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/ReferenceIngress.lean",
    "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/PulseCutoff.lean",
    "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/NextPulse.lean",
    "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/CycleOrders.lean",
    "research-ide/mathscope-m3/navier/source-initialized-angular.mjs",
    "research-ide/mathscope-m3/navier/source-global-forced-current.mjs",
    "research-ide/mathscope-m3/post-signed-20261023/source-postfive-repeat-forced.mjs",
    "research-ide/mathscope-m3/post-signed-20261023/source-postfive-repeat-forced.test.mjs",
    "research-ide/mathscope-m4/research-boundaries.json",
    "research-ide/mathscope-m4/formal-claims.mjs",
    "research-ide/mathscope-m4/release-lab/catalog.json",
    *["research-ide/mathscope-m4/web/" + name for name in (
        "build-release-lab.py", "release-lab.html", "release-lab.js",
        "formal-claim-view.html", "formal-claim-view.js", "formal-claim-view.mjs",
    )],
]

def git(*args):
    return subprocess.check_output(["git", "-c", "core.longpaths=true", *args], cwd=REPO)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def encode(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()

commit = git("rev-parse", "HEAD").decode().strip()
branch = git("branch", "--show-current").decode().strip()
assert branch == "mathscope-cd-axial-source-bridge-20261029"
remote = git("ls-remote", "origin", "refs/heads/" + branch).decode().split()
assert remote[0] == commit, "Branch head has not been pushed"
sha_manifest = {}
with zipfile.ZipFile(DEST, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=5) as target:
    def add(name, data):
        assert name not in sha_manifest, name
        sha_manifest[name] = {"sha256": digest(data), "bytes": len(data)}
        target.writestr(name, data)

    with zipfile.ZipFile(PREVIOUS) as previous:
        checks = json.loads(previous.read("SHA256.json"))
        assert set(previous.namelist()) == set(checks) | {"SHA256.json"}
        for path, entry in checks.items():
            data = previous.read(path)
            assert entry == {"sha256": digest(data), "bytes": len(data)}, path
            name = "history/20261111/" + path if path in ("REPORT_KO.md", "STATUS.json", AUDITOR) else path
            add(name, data)

    branch_entries = git("ls-tree", "-r", "--name-only", commit, CURRENT, PREFIX + "/m4-generated").decode().splitlines()
    candidate_paths = [name for name in branch_entries if "/m4/candidates/" in name]
    direct_artifacts = {
        item["path"] for path in candidate_paths
        for item in json.loads(git("show", commit + ":" + path))["artifacts"]
        if item["path"].startswith("research-ide/")
    }
    for path in sorted(set(branch_entries + EXTRAS) | direct_artifacts):
        data = git("show", commit + ":" + path)
        if path.startswith(CURRENT + "/"):
            assert (REPO / path).read_bytes() == data, path
        if path in sha_manifest:
            assert sha_manifest[path]["sha256"] == digest(data), path
        else:
            add(path, data)

    report = git("show", commit + ":" + CURRENT + "/REPORT_KO.md")
    status = git("show", commit + ":" + CURRENT + "/STATUS.json")
    if args.corrected_first_artifact:
        artifact = args.corrected_first_artifact.resolve()
        run = json.loads((artifact / "corrected-first-forced-run.json").read_bytes())
        graph = artifact / "corrected-first-forced-graph"
        manifest = json.loads((graph / "original-source-export-manifest.json").read_bytes())
        replay = json.loads(git("show", commit + ":" + CURRENT +
            "/first-force-repair/independent-repaired-first-force.json"))
        assert run["status"] == "CORRECTED_FIRST_FORCE_VERIFIED"
        assert manifest["scope"] == "REPAIRED_FIRST_FORCED_ONLY"
        assert manifest["executing_commit"] == run["executing_commit"]
        assert replay["snapshot"] == manifest and replay["positiveSystems"] == 20
        assert replay["exactComplexSourceComponents"] == 120
        assert run["real_original_forced_seal_issued"] is True
        assert json.loads(status)["secondCycle"]["correctedFirstForced"]["status"] == "VERIFIED"
        assert manifest["actual_final_67_jets_certified"] == 0
        for relative in ("corrected-first-forced-run.json",
            "corrected-first-forced-graph/corrected-first-force.json",
            "corrected-first-forced-graph/original-source-export-manifest.json",
            "corrected-first-forced-graph/original-source-functions.json",
            "corrected-first-forced-graph/original-source-nodes.jsonl.gz"):
            add("inputs/corrected-first-forced/" + relative, (artifact / relative).read_bytes())
    if args.corrected_cycle_artifact:
        artifact = args.corrected_cycle_artifact.resolve()
        run = json.loads((artifact / "corrected-first-cycle-run.json").read_bytes())
        graph = artifact / "corrected-first-cycle-graph"
        manifest = json.loads((graph / "original-source-export-manifest.json").read_bytes())
        audit = json.loads(git("show", commit + ":" + CURRENT +
            "/corrected-flat/corrected-cycle-ledger.json"))["correctedFullCycle"]
        assert run["post_five_full_three_dimensional_PDE_AST_checked"] is True
        assert run["first_fivemap_graph_exported"] is True
        assert manifest["scope"] == "CORRECTED_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT"
        assert manifest["node_stream_sha256"] == audit["graphSHA256"]
        assert audit["verifiedHostedRun"]["conclusion"] == "success"
        assert manifest["actual_final_67_jets_certified"] == 0
        for relative in ("corrected-first-cycle-run.json",
            "corrected-first-cycle-graph/original-source-export-manifest.json",
            "corrected-first-cycle-graph/original-source-functions.json",
            "corrected-first-cycle-graph/original-source-nodes.jsonl.gz"):
            add("inputs/corrected-first-cycle/" + relative, (artifact / relative).read_bytes())
    if args.n2_artifact:
        artifact = args.n2_artifact.resolve()
        run = json.loads((artifact / "original-n2-prefix.json").read_bytes())
        graph = artifact / "original-n2-current-pressure-graph"
        manifest = json.loads((graph / "original-source-export-manifest.json").read_bytes())
        domains = json.loads(git("show", commit + ":" + CURRENT + "/axial-recursion/n2-order-one-faces.json"))
        selector = json.loads(git("show", commit + ":" + CURRENT + "/axial-recursion/n2-selector-readback.json"))
        assert run["snapshot"] == manifest and run["currentStage"] == "COMPLETE"
        assert manifest["scope"] == "ORIGINAL_N2_CURRENT_PRESSURE_PREFIX"
        assert selector["executingCommit"] == manifest["executing_commit"]
        assert run["selector"]["rows"][2]["order"] == 3 and len(run["selector"]["rows"][2]["constraints"]) == 20
        assert manifest["node_stream_sha256"] == domains["graphSHA256"]
        assert len(domains["reachableDescriptors"]) == 18 and len(domains["binderSiteMaps"]) == 12
        assert manifest["actual_final_67_jets_certified"] == 0
        for relative in ("original-n2-prefix.json",
            "original-n2-current-pressure-graph/original-source-export-manifest.json",
            "original-n2-current-pressure-graph/original-source-functions.json",
            "original-n2-current-pressure-graph/original-source-nodes.jsonl.gz"):
            add("inputs/original-axial-n2/" + relative, (artifact / relative).read_bytes())
    if args.isolated_candidate:
        candidate = args.isolated_candidate.read_bytes()
        current = json.loads(status)["M4"]["publicReadback"]
        assert len(candidate) == 28_928_002 and digest(candidate) == current["candidateHTMLSHA256"]
        add("inputs/m4-r108-isolated-candidate/candidate.html", candidate)
    if args.second_candidate_artifact:
        artifact = args.second_candidate_artifact.resolve()
        graph = artifact / "post-five-repeat-forced-graph"
        metadata = json.loads((artifact / "github-run-43015175416.json").read_bytes())
        candidate = json.loads((graph / "post-five-repeat-forced-candidate.json").read_bytes())
        manifest = json.loads((graph / "original-source-export-manifest.json").read_bytes())
        audit = json.loads(git("show", commit + ":" + CURRENT +
            "/first-force-repair/independent-second-forced-candidates.json"))
        assert metadata["databaseId"] == audit["run"] == 43015175416
        assert metadata["status"] == "completed" and metadata["conclusion"] == "success"
        assert metadata["headSha"] == candidate["commit"] == manifest["executing_commit"] == audit["commit"]
        assert candidate["snapshot"] == manifest and manifest["node_stream_sha256"] == audit["graphSHA256"]
        assert candidate["registeredPositiveSystems"] == len(audit["systems"]) == 40
        assert candidate["scope"]["completeSecondForcedState"] is False
        assert audit["checkedRealAndImaginaryCoefficients"] == 240 and audit["finalJets"] == 0
        for relative in ("github-run-43015175416.json", "repeat-forced-controls.tap",
            "post-five-repeat-forced-graph/original-source-export-manifest.json",
            "post-five-repeat-forced-graph/original-source-functions.json",
            "post-five-repeat-forced-graph/original-source-nodes.jsonl.gz",
            "post-five-repeat-forced-graph/post-five-repeat-forced-candidate.json"):
            add("inputs/second-forced-candidates/" + relative, (artifact / relative).read_bytes())
    if args.y_replay_dir:
        sources = {
            "reached.json": "5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459",
            "range-flow-no-bracket.json": "f1e4832fe0540da6fb8d6f3b27ccb1112b54ad0232d653230232b2d49d9e1e55",
            "range-flow-transport.json": "124b2741bc0ab7f16b230e35de639cd434d45b3a7d88294f6b214c180c5ce7bf",
            "reference-inverse-paths.json": "217d2bc9b3e212b947a5dc1e65206924c7c32653bfb320f83acb242e7e563e68",
        }
        for name, expected in sources.items():
            data = (args.y_replay_dir / name).read_bytes()
            assert digest(data) == expected, name
            add("inputs/original-y-replay/" + name, data)
    if args.final_functionals:
        data = args.final_functionals.read_bytes()
        assert digest(data) == "b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78"
        add("inputs/final-functionals/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json", data)
    if args.first_gauge_graph:
        graph = args.first_gauge_graph.resolve()
        manifest = json.loads((graph / "original-source-export-manifest.json").read_bytes())
        gauge = json.loads(status)["finalInputSubproofs"]["firstCycleGaugeOperands"]["explicitN1NativeChart"]
        assert manifest["node_count"] == gauge["graphNodes"]
        assert manifest["node_stream_sha256"] == gauge["graphSHA256"]
        assert manifest["definitions_sha256"] == gauge["nativeRegistrySHA256"]
        for name in ("original-source-export-manifest.json",
                     "original-source-functions.json", "original-source-nodes.jsonl.gz"):
            add("inputs/first-gauge-joined/" + name, (graph / name).read_bytes())
    if args.localization_source:
        paths = [
            "research-ide/mathscope-m3/recovery-20261019/outer_cutoff.py",
            "research-ide/mathscope-m3/navier/source-localization.mjs",
            "research-ide/mathscope-m3/navier/evidence/source-localization-20261012/attempt1/localization.json",
        ]
        recovery = "research-ide/mathscope-m3/evidence/work-recovery-20261018T072604Z_b479c2d1"
        paths.extend(recovery + "/" + path for path in (
            "work/prune_recovery/energy/evidence/ACTUAL_ENERGY_OPERATOR_BINDING.json",
            "recovered/base/work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json",
        ))
        for path in paths:
            add("inputs/localization-source/" + path, (args.localization_source / path).read_bytes())
    if args.r108_deploy_archive:
        data = args.r108_deploy_archive.read_bytes()
        isolated = json.loads(git("show", commit + ":" + CURRENT +
            "/m4/r108/r108-hosted-screen/isolated-deployment.json"))
        assert isolated["deployment"]["status"] == "succeeded"
        assert len(data) == isolated["source"]["archiveBytes"] and digest(data) == isolated["source"]["archiveSHA256"]
        add("inputs/m4-r108-isolated-candidate/deploy.tar.gz", data)
    if args.primary_order2_artifact:
        artifact = args.primary_order2_artifact.resolve()
        run = json.loads((artifact / "status.json").read_bytes())
        verify = json.loads((artifact / "independent-readback.json").read_bytes())
        primary = json.loads(status)["secondCycle"]["primaryOrderTwoNativeClass"]
        assert run["status"] == verify["status"] == "PASS"
        assert run["sourceCommit"] == verify["sourceCommit"] == primary["sourceCommit"]
        assert run["primaryHash"] == verify["primaryHash"] == primary["programSHA256"]
        for name, entry in sorted(run["files"].items()):
            data = (artifact / name).read_bytes()
            assert digest(data) == entry["sha256"] and len(data) == entry["bytes"], name
            add("inputs/original-primary-order2/" + name, data)
        for name in ("status.json", "independent-readback.json", "checkpoints.jsonl", "native-run.log"):
            add("inputs/original-primary-order2/" + name, (artifact / name).read_bytes())
    if args.whole_k_n0_artifact:
        artifact = args.whole_k_n0_artifact.resolve()
        graph = artifact / "original-whole-k-current-pressure-graph"
        manifest = json.loads((graph / "original-source-export-manifest.json").read_bytes())
        run = json.loads((artifact / "original-whole-k-prefix.json").read_bytes())
        assert run["currentStage"] == "COMPLETE" and run["requestedPrefix"] == 0
        assert run["snapshot"] == manifest and manifest["node_count"] == 983154
        assert manifest["executing_commit"] == "fbad12e9331c63b45da8292601a2b0fb6f54731e"
        assert manifest["scope"] == "ORIGINAL_WHOLE_K_N0_CURRENT_PRESSURE_PREFIX"
        assert manifest["actual_final_67_jets_certified"] == 0
        assert manifest["definitions_sha256"] == digest((graph / "original-source-functions.json").read_bytes())
        for relative in ("original-whole-k-prefix.json",
                         "original-whole-k-current-pressure-graph/original-source-export-manifest.json",
                         "original-whole-k-current-pressure-graph/original-source-functions.json",
                         "original-whole-k-current-pressure-graph/original-source-nodes.jsonl.gz"):
            add("inputs/original-whole-k-n0/" + relative, (artifact / relative).read_bytes())
        github_zip = (artifact.parent / "hosted-n0-artifact.zip").read_bytes()
        assert digest(github_zip) == "83f02c00e2f6dec890a725c740910d5bb48b3c4b9cc153c4f20595e58ed8a4f5"
        add("inputs/original-whole-k-n0/hosted-n0-artifact.zip", github_zip)
    if args.core_runtime:
        sources = [("mathscope-m2/navier/" + name) for name in (
            "actual-core-evaluator.mjs", "actual-background-data.mjs",
            "source-profile-data.mjs", "source-profile.mjs",
        )]
        sources.append("mathscope-m1/navier/numerics.mjs")
        for name in sources:
            relative = "research-ide/" + name
            source = (args.core_runtime / relative).read_bytes()
            assert source == git("show", "f8cb4034e86d7b669d52a6f2248aebba156b51b5:" + relative), relative
            add("inputs/original-core-runtime/" + relative, source)
        endpoint = json.loads(git("show", commit + ":" + CURRENT + "/whole-k-center-n3/endpoint-third-bound.json"))
        runtime = endpoint["runtime"]
        annular = json.loads(git("show", commit + ":" + CURRENT + "/whole-k-annular-slow/annular-slow-jet-bounds.json"))
        inner = json.loads(git("show", commit + ":" + CURRENT + "/whole-k-inner-axis/inner-axis-jet-bounds.json"))
        runtime_blobs = dict(runtime["runtimeGitBlobs"])
        for sources in (inner["originalRuntime"]["runtimeGitBlobs"], annular["sourceRuntimeGitBlobs"]):
            assert all(runtime_blobs.get(name, blob) == blob for name, blob in sources.items())
            runtime_blobs.update(sources)
        for relative, blob in runtime_blobs.items():
            source = git("show", runtime["sourceCommit"] + ":" + relative)
            assert hashlib.sha1(f"blob {len(source)}\0".encode() + source).hexdigest() == blob
            name = "inputs/original-core-runtime/" + relative
            if name in sha_manifest:
                assert sha_manifest[name]["sha256"] == digest(source), relative
            else:
                add(name, source)
    selector_base = ("research-ide/mathscope-m2/navier/research/evidence/physical-full-jets-20261011/"
                     "actual-physical-center-full-jet-source-attempt4")
    selector_receipt = json.loads(git("show", commit + ":" + CURRENT + "/whole-k-selector-scales/common-b-scales.json"))
    exact_archive_hashes = selector_receipt["archiveComparison"]["archiveSHA256"]
    for suffix, key in ((".json", "final"), ("-closed-selector-and-physical-scales.json", "closedScales"),
                        ("-first-selector-ftc-upper-bounds.json.gz", "upperBounds"),
                        ("-selection-trace.json", "trace")):
        original = selector_base + suffix
        data = git("show", selector_receipt["originalCommit"] + ":" + original)
        if suffix.endswith(".gz"):
            check = gzip.decompress(data)
        else:
            check = data
        assert digest(check) == exact_archive_hashes[key], original
        add("inputs/original-selector-scales/" + Path(original).name, data)
    if args.diagonal_n2_artifact:
        artifact = args.diagonal_n2_artifact.resolve()
        graph = artifact / "original-whole-k-current-pressure-graph"
        manifest = json.loads((graph / "original-source-export-manifest.json").read_bytes())
        run = json.loads((artifact / "original-whole-k-prefix.json").read_bytes())
        comparison = json.loads(git("show", commit + ":" + CURRENT +
                                   "/whole-k-atlas/diagonal-n2/diagonal-n2-comparison.json"))
        assert run["currentStage"] == "COMPLETE" and run["requestedPrefix"] == 2
        assert run["selectorDiagonalOnly"] is True and run["snapshot"] == manifest
        assert manifest["node_count"] == 2326849 and manifest["actual_final_67_jets_certified"] == 0
        assert manifest["executing_commit"] == comparison["rightExecutingCommit"]
        assert comparison["matchedClauses"] == 43 and comparison["typedExpressionPairs"] == 86
        assert manifest["node_stream_sha256"] == comparison["nodeSHA256"][1]
        assert manifest["definitions_sha256"] == comparison["registrySHA256"][1]
        for name in ("original-source-export-manifest.json", "original-source-functions.json",
                     "original-source-nodes.jsonl.gz"):
            add("inputs/original-axial-n2-diagonal/original-whole-k-current-pressure-graph/" + name,
                (graph / name).read_bytes())
        for name in ("original-whole-k-prefix.json", "diagonal-overlay.json"):
            add("inputs/original-axial-n2-diagonal/" + name, (artifact / name).read_bytes())
    for prefix, artifact_arg in ((3, args.diagonal_n3_artifact), (4, args.diagonal_n4_artifact)):
        if artifact_arg is None:
            continue
        artifact = artifact_arg.resolve()
        run = json.loads((artifact / "original-whole-k-prefix.json").read_bytes())
        evidence_path = commit + ":" + CURRENT + f"/whole-k-atlas/diagonal-n{prefix}/"
        audit = json.loads(git("show", evidence_path + "independent-hosted-prefix.json"))
        comparison = json.loads(git("show", evidence_path + f"common-n{prefix-1}-n{prefix}.json"))
        assert run["currentStage"] == "COMPLETE" and run["requestedPrefix"] == prefix
        assert audit["executingCommit"] == run["executingCommit"] == comparison["rightExecutingCommit"]
        expected_clauses = {3: 43, 4: 68}[prefix]
        assert comparison["matchedClauses"] == expected_clauses
        assert comparison["typedExpressionPairs"] == 2*expected_clauses
        snapshots = [("snapshot", "currentPressure", "original-whole-k-current-pressure-graph")]
        if prefix == 3:
            snapshots.append(("bandSnapshot", "band", "original-whole-k-selector-band-graph"))
            assert audit["literalBandPrefixRecords"] == run["bandSnapshot"]["node_count"] == 2088092
        for receipt_key, audit_key, directory in snapshots:
            graph = artifact / directory
            manifest = json.loads((graph / "original-source-export-manifest.json").read_bytes())
            assert manifest == run[receipt_key] == audit[audit_key]
            assert manifest["actual_final_67_jets_certified"] == 0
            assert digest((graph / "original-source-functions.json").read_bytes()) == manifest["definitions_sha256"]
            node_digest = hashlib.sha256()
            with gzip.open(graph / "original-source-nodes.jsonl.gz", "rb") as stream:
                for block in iter(lambda: stream.read(1 << 20), b""):
                    node_digest.update(block)
            assert node_digest.hexdigest() == manifest["node_stream_sha256"]
            for name in ("original-source-export-manifest.json", "original-source-functions.json",
                         "original-source-nodes.jsonl.gz"):
                add(f"inputs/original-whole-k-n{prefix}-diagonal/{directory}/{name}", (graph / name).read_bytes())
        assert comparison["nodeSHA256"][1] == run["snapshot"]["node_stream_sha256"]
        names = ["original-whole-k-prefix.json", "diagonal-overlay.json", "band-budget-overlay.json"]
        if prefix == 4:
            names.append("graph-copy-budget-overlay.json")
        for name in names:
            add(f"inputs/original-whole-k-n{prefix}-diagonal/" + name, (artifact / name).read_bytes())
    if args.n2_y_reached:
        data = args.n2_y_reached.read_bytes()
        assert digest(data) == "4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32"
        add("inputs/original-axial-n2/y-reached.json", data)
        guards = json.loads(git("show", commit + ":" + CURRENT + "/y-n2-lexical/original-source-guards.json"))
        for path, expected in guards["verifiedBlobsSHA256"].items():
            raw = git("show", guards["sourceCommit"] + ":" + path)
            assert digest(raw) == expected
            name = "inputs/original-core-runtime/" + path
            if name in sha_manifest:
                assert sha_manifest[name]["sha256"] == expected
            else:
                add(name, raw)
    if args.historical_scale_input:
        data = args.historical_scale_input.read_bytes()
        historical = json.loads(git("show", commit + ":" + CURRENT +
                                    "/whole-k-selector-scales/historical-scale-arithmetic-result.json"))
        assert historical["complete"] and digest(data) == historical["inputSHA256"]
        add("inputs/original-selector-scales/historical-scale-arithmetic-input.json", data)
        for relative, expected in historical["sourcePins"].items():
            raw = git("show", historical["sourceRevision"] + ":" + relative)
            assert digest(raw) == expected, relative
            name = "inputs/original-core-runtime/" + relative
            if name in sha_manifest:
                assert sha_manifest[name]["sha256"] == expected
            else:
                add(name, raw)
    add("REPORT_KO.md", report)
    add("STATUS.json", status)
    target.writestr("SHA256.json", encode(sha_manifest))

with zipfile.ZipFile(DEST) as archive:
    assert archive.testzip() is None
    assert set(archive.namelist()) == set(sha_manifest) | {"SHA256.json"}
    for name, entry in sha_manifest.items():
        data = archive.read(name)
        assert entry == {"sha256": digest(data), "bytes": len(data)}, name
    wanted = {name for name in sha_manifest if "/m4/candidates/" in name}
    assert wanted
    for candidate in wanted:
        for artifact in json.loads(archive.read(candidate))["artifacts"]:
            path = artifact["path"]
            wanted_artifact = sha_manifest[path]
            assert wanted_artifact["sha256"] == artifact["sha256"], path
    needed = wanted | {AUDITOR, "research-ide/mathscope-m4/criteria.mjs",
        "research-ide/mathscope-m0/proof.mjs", "research-ide/mathscope-m0/lean/shipped-proof-data.mjs",
        CURRENT + "/m4/verify_registration.mjs",
        "research-ide/mathscope-m4/research-boundaries.json"}
    for candidate in wanted:
        needed.update(row["path"] for row in json.loads(archive.read(candidate))["artifacts"])
    with tempfile.TemporaryDirectory(prefix="ms-readback-") as root:
        for name in needed:
            archive.extract(name, root)
        output = Path(root) / "verified-assessment.json"
        subprocess.run(["node", str(Path(root) / (CURRENT + "/m4/verify_registration.mjs")),
            root, str(output)], capture_output=True, check=True)
        assessment = json.loads(output.read_bytes())
        assert len(assessment["accepted"]) == json.loads(status)["M4"]["accepted"]
        assert assessment["publicationConfirmed"] is False
        assert assessment["canFreeze"] is False

(OUT / f"MathScope_Goal_{args.checkpoint}_Report_20261111_KO.md").write_bytes(report)
receipt = {"file": DEST.name, "files": len(sha_manifest) + 1, "bytes": DEST.stat().st_size,
    "sha256": digest(DEST.read_bytes()), "branch_head": commit,
    "verified_archive_manifest_and_assessment": True,
    "verified_M4": len(assessment["accepted"])}
(OUT / f"MathScope_Goal_{args.checkpoint}_Receipt_20261111.json").write_bytes(encode(receipt))
print(json.dumps(receipt))
