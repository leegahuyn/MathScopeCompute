"""Validate and package the actual same-family N3 and high Picard evidence."""

from argparse import ArgumentParser
import gzip
from hashlib import sha256
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile

from assemble_continuation31 import PARENTS as EARLIER, entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENTS = {
    **EARLIER,
    "MathScope_Goal_Continuation31_Delta_20261113.zip":
        "093030663aeeda4f180e0c4d894370546ef8e8b27834227e87058928f1070138",
}
PARENT = "09bed4b121701cdb5f18a3f0b062a42c7634346d"
LABEL = "MathScope_Goal_Continuation32"
DATE = "20261113"
JOIN = "primary-forced-join/active-n3-c5-binding/"
MODE_ONE = "primary-forced-join/active-n3-mode-one/"
HOSTED = JOIN + "hosted-43296617887/"
LEAN = "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/HigherEvenAxisTail.lean"
ALLOWED = {
    LEAN,
    ".github/workflows/mathscope-cd-axial-bridge-20261029.yml",
    ".github/workflows/mathscope-original-primary-c5.yml",
    ".github/workflows/mathscope-active-n3-same-family-forced.yml",
    ".github/workflows/mathscope-active-n3-full-first-forced.yml",
}


def verify(source, git, status):
    assert status["M3"]["accepted"] == 62 and status["jets"]["accepted"] == 0
    assert status["M4"]["accepted"] == 16 and status["M4"]["publicReadback"]["currentR108"] == "OPEN"
    assert status["Y"]["verifiedExplicitN1SourceIngress"] == 523
    assert status["release"] == "HOLD" and not status["goal_complete"]
    scope = status["continuation32"]
    assert scope["advancedOfficialCounts"] is False

    def checked(path, digest):
        raw = source(path)
        assert entry(raw)["sha256"] == digest, path
        return json.loads(raw)

    live = scope["sameLiveN3C5AndModeTwo"]
    native = checked(HOSTED + "same-family-mode-two.json", live["nativeReceiptSHA256"])
    primary = checked(HOSTED + "primary-c5-native.json", live["primaryReceiptSHA256"])
    witness = checked(HOSTED + "original-active-mode-two-witness.json", live["witnessSHA256"])
    readback = checked(HOSTED + "independent-readback-local.json", live["readbackSHA256"])
    assert native["status"] == "VERIFIED_SAME_LIVE_N3_PRIMARY_C5_AND_SELECTED_FORCED_INPUTS"
    assert primary["status"] == "VERIFIED_ORIGINAL_NATIVE_N3_PRIMARY_C5_CLASS"
    assert native["normRoots"]["K"] == primary["normRoot"] == live["normRoot"] == 18310069
    assert native["normRoots"]["classRows"] == primary["classRows"]
    assert all(row["pass"] for row in primary["nativeChecks"])
    assert native["stages"][-1]["nodes"] == live["initializedAngularNodes"] == 21620247
    assert witness["initializedNodeCount"] == live["forcedStartAfterExactBindingNodes"] == 21661707
    assert live["initializedAngularNodes"] < live["forcedStartAfterExactBindingNodes"] < live["graphNodes"]
    assert native["stages"][-3]["name"] == "same-family-temporal"
    assert native["stages"][-3]["nodes"] == 21374032
    assert [(r["key"], r["harmonic"], r["system"]) for r in native["rows"]] == [("0:1", 2, 1), ("1:1", 2, 5)]
    assert readback["status"] == "ACTIVE_SOURCE_MODE_TWO_OPERAND_READBACK"
    assert readback["inputReceiptSHA256"] == live["witnessSHA256"]
    assert readback["priorEdges"] == live["typedEdges"] == 43980655
    assert [r["system"] for r in readback["rows"]] == [1, 5]
    assert all(not r["completeForcedSeal"] for r in (native, witness, readback))

    one = scope["activeN3ModeOne"]
    first = checked(MODE_ONE + "active-mode-one-readback.json", one["readbackSHA256"])
    assert [(r["key"], r["system"]) for r in first["rows"]] == [("0:1", 0), ("1:1", 4)]
    assert all(r["swappedSourceRejected"] and len(r["components"]) == 6 for r in first["rows"])
    mean = checked(MODE_ONE + "mean-c4/active-mean-c4-demand.json", one["meanDemandSHA256"])
    assert mean["meanIndicesPerComponent"] == one["meanIndicesPerComponent"] == 121
    assert mean["positiveLongitudinalIndices"] == 52 and mean["zeroLongitudinalIndices"] == 69
    assert not mean["fullC3ModeOneBound"]

    endpoint = scope["activeN3ModeTwoEndpoint"]
    ep = checked(JOIN + "endpoint/n3-same-family-active-endpoint.json", endpoint["sameLiveEndpointSHA256"])
    assert ep["sameLiveNormFamily"] and ep["sourceWitnessSHA256"] == live["witnessSHA256"]
    assert ep["priorEdges"] == live["typedEdges"] and not ep["completeForcedSeal"]
    bounds = checked(JOIN + "endpoint/n3-same-family-active-endpoint-bounds.json", endpoint["sameLiveBoundsSHA256"])
    assert bounds["sameLiveNormFamily"] and bounds["exactEndpointSHA256"] == endpoint["sameLiveEndpointSHA256"]
    transport = checked(JOIN + "endpoint/n3-same-family-physical-transport.json", endpoint["sameLivePhysicalTransportSHA256"])
    assert transport["endpointBoundsSHA256"] == endpoint["sameLiveBoundsSHA256"]
    assert not transport["activeFrameBoundChecked"] and not transport["finalCartesianJetIntervals"]

    higher = scope["higherY"]
    forcing = checked("y-higher-flow/forcing-regularity/forcing-dependencies.json", higher["forcingBinderSHA256"])
    assert forcing["status"] == "PASS"
    assert [r["lexicalRadialGuardedPicardCalls"] for r in forcing["rows"]] == higher["forcingLowerCalls"] == [0, 19, 37, 48, 59]
    cutoff = checked("y-higher-flow/forcing-regularity/cutoff-chain.json", higher["cutoffChainSHA256"])
    assert cutoff["status"] == "PASS" and cutoff["source_step_bounds"][-1] == "422521605120"
    coefficients = checked("y-higher-flow/high-picard-tail/coefficient-receipt.json", higher["coefficientsSHA256"])
    assert coefficients["status"] == "PASS" and coefficients["even_and_optional_odd_coefficients"][3]["even"] == "1/120"
    logbase = f"ci-{higher['githubLeanRun']}/"
    lean_sha = higher["leanSourceSHA256"]
    assert entry(git("show", higher["leanCommit"] + ":" + LEAN))["sha256"] == lean_sha
    assert (lean_sha + "  MathScope/M3/CD/HigherEvenAxisTail.lean\n").encode() in source(logbase + "source-sha256.txt")
    log = source(logbase + "HigherEvenAxisTail.log")
    assert entry(log)["sha256"] == higher["leanLogSHA256"]
    assert [line for line in log.decode().splitlines() if "depends on axioms" in line] == [
        f"'MathScope.M3.CD.{name}' depends on axioms: [propext, Classical.choice, Quot.sound]"
        for name in ("weightedEvenAxisAverageBound", "evenAxisJetFactor_succ", "higherEvenAxisAverageBound")
    ]
    axial = checked("axial-alln/independent-scope/scope-receipt.json", scope["axialScopeSHA256"])
    assert axial["finite_source_replay_orders"] == [1, 2, 3] and axial["negative_eta_endpoint_fraction"] == "-17408/3375"
    m4 = checked("m4/r108/operational-replay-audit/gate.json", scope["m4PrivateCriterionReadbackSHA256"])
    assert m4["registeredPrivateScope"] == "CRITERION_ACCEPTED" and not m4["publicationConfirmed"]
    return live, witness["snapshot"], readback


def validate_graph(path, snapshot, expected):
    assert file_sha(path) == expected["graphSHA256"]
    digest = sha256()
    count = 0
    with gzip.open(path, "rb") as graph:
        header = graph.readline()
        assert json.loads(header) == {"schema": "MathScope.M3.FullNodesJSONL/1", "node_count": snapshot["node_count"]}
        digest.update(header)
        size = len(header)
        for block in iter(lambda: graph.read(1 << 20), b""):
            digest.update(block)
            count += block.count(b"\n")
            size += len(block)
    assert count == expected["graphNodes"] == 21681493 and size == snapshot["node_stream_uncompressed_bytes"]
    assert digest.hexdigest() == snapshot["node_stream_sha256"]


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("workspace", "repo", "same-family-witness"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    outputs = args.workspace / "outputs"

    def git(*params):
        return subprocess.check_output(["git", "-c", "core.longpaths=true", *params], cwd=args.repo)

    head = git("rev-parse", "HEAD").decode().strip()
    assert git("branch", "--show-current").decode().strip() == BRANCH

    def source(path):
        return git("show", f"{head}:{CURRENT}/{path}")

    preserved = json.loads(source("preservation-continuation31.json"))
    refs = {f"refs/heads/{name}": sha for name, sha in preserved["remoteBaselineRefs"].items()}
    refs[preserved["onlyPushRef"]] = head
    assert {ref: sha for sha, ref in (line.split() for line in
            git("ls-remote", "origin", *refs).decode().splitlines())} == refs
    older = {}
    for name, digest in PARENTS.items():
        path = outputs / name
        assert file_sha(path) == digest, name
        with ZipFile(path) as ancestor:
            older.update(json.loads(ancestor.read("SHA256.json")))
    report, raw_status = source("REPORT_KO.md"), source("STATUS.json")
    live, snapshot, readback = verify(source, git, json.loads(raw_status))
    graph = args.same_family_witness / "original-source-nodes.jsonl.gz"
    registry = args.same_family_witness / "original-source-functions.json"
    validate_graph(graph, snapshot, live)
    assert file_sha(registry) == live["registrySHA256"] == snapshot["definitions_sha256"]
    assert readback["graphSHA256"] == snapshot["node_stream_sha256"]
    assert readback["registrySHA256"] == snapshot["definitions_sha256"]

    delta = outputs / f"{LABEL}_Delta_{DATE}.zip"
    pending = delta.with_suffix(".zip.tmp")
    files = {}
    with ZipFile(pending, "w", compression=ZIP_DEFLATED, compresslevel=5) as bundle:
        def add(name, data):
            assert name not in files
            bundle.writestr(name, data)
            files[name] = entry(data)

        changes = git("diff", "--name-status", "--no-renames", PARENT, head).decode().splitlines()
        for line in changes:
            kind, path = line.split("\t")
            assert kind in {"A", "M"} and (path.startswith(CURRENT + "/") or path in ALLOWED), path
            assert git("hash-object", "--path=" + path, "--", path).strip() == git(
                "rev-parse", head + ":" + path
            ).strip(), path
            if kind == "M" and path in older:
                assert entry(git("show", PARENT + ":" + path)) == older[path], path
            add(path, git("show", head + ":" + path))
        graph_name = f"{CURRENT}/{HOSTED}{graph.name}"
        bundle.write(graph, graph_name, compress_type=ZIP_STORED)
        files[graph_name] = {"sha256": live["graphSHA256"], "bytes": graph.stat().st_size}
        add(f"{CURRENT}/{HOSTED}{registry.name}", registry.read_bytes())
        add("REPORT_KO.md", report)
        add("STATUS.json", raw_status)
        add("CHECKPOINT.json", encode({
            "schema": "MathScope.GoalEvidenceDelta/1", "parentsInOrder": PARENTS,
            "parentCommit": PARENT, "deltaCommit": head,
            "filesThatSupersedeParents": sorted(set(files) & set(older)), "release": "HOLD",
        }))
        bundle.writestr("SHA256.json", encode(files))
    with ZipFile(pending) as bundle:
        assert bundle.testzip() is None
        assert set(bundle.namelist()) == set(files) | {"SHA256.json"}
        assert json.loads(bundle.read("SHA256.json")) == files
        for path, expected in files.items():
            digest = sha256()
            with bundle.open(path) as content:
                for block in iter(lambda: content.read(1 << 20), b""):
                    digest.update(block)
            assert digest.hexdigest() == expected["sha256"]
            assert bundle.getinfo(path).file_size == expected["bytes"]
    pending.replace(delta)
    receipt = {
        "file": delta.name, "bytes": delta.stat().st_size, "files": len(files) + 1,
        "sha256": file_sha(delta), "branchHead": head, "verifiedParentsInOrder": PARENTS,
        "sameLiveGraphNodes": live["graphNodes"], "sameLiveTypedEdges": live["typedEdges"],
        "verifiedDeltaManifest": True,
    }
    (outputs / f"{LABEL}_Report_{DATE}_KO.md").write_bytes(report)
    (outputs / f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
