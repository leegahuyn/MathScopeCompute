"""Verify and package the original C8, archived forcing and Picard evidence."""

from argparse import ArgumentParser
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation28 import PARENTS as PREVIOUS_PARENTS, entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENTS = {
    **PREVIOUS_PARENTS,
    "MathScope_Goal_Continuation28_Delta_20261113.zip":
        "ccd41a88f59212917c2a5d75974b8678be3bf7ad11ecb68bfcf82492ded9f45f",
}
PARENT = "f6226b4418e9b758dc70731b616d7e90b80a18fb"
LABEL = "MathScope_Goal_Continuation30"
DATE = "20261113"
LEAN = "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/ActualPicardRadialTail.lean"
ALLOWED = {
    ".github/workflows/mathscope-original-primary-c5.yml",
    ".github/workflows/mathscope-cd-axial-bridge-20261029.yml",
    LEAN,
}


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("workspace", "repo"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    outputs = args.workspace / "outputs"

    def git(*params):
        return subprocess.check_output(["git", "-c", "core.longpaths=true", *params], cwd=args.repo)

    head = git("rev-parse", "HEAD").decode().strip()
    assert git("branch", "--show-current").decode().strip() == BRANCH
    assert git("ls-remote", "origin", "refs/heads/" + BRANCH).decode().split()[0] == head
    older = {}
    for name, digest in PARENTS.items():
        path = outputs / name
        assert file_sha(path) == digest, name
        with ZipFile(path) as ancestor:
            older.update(json.loads(ancestor.read("SHA256.json")))

    def source(path):
        return git("show", f"{head}:{CURRENT}/{path}")

    def checked(path, digest):
        raw = source(path)
        assert entry(raw)["sha256"] == digest, path
        return json.loads(raw)

    report, status = source("REPORT_KO.md"), source("STATUS.json")
    summary = json.loads(status)
    assert summary["M3"]["accepted"] == 62 and summary["jets"]["accepted"] == 0
    assert summary["M4"]["accepted"] == 16 and summary["M4"]["publicReadback"]["currentR108"] == "OPEN"
    assert summary["Y"]["verifiedExplicitN1SourceIngress"] == 523
    assert summary["release"] == "HOLD" and not summary["goal_complete"]
    scope = summary["continuation30"]
    assert scope["advancedOfficialCounts"] is False

    c5 = "primary-forced-weights/live-c5/"
    native = scope["nativeBackgroundC8"]
    c8 = checked(f"{c5}hosted-{native['sourceRun']}/primary-c5-native.json", native["receiptSHA256"])
    background = c8["originalBackgroundC8"]
    assert background["status"] == "VERIFIED_NATIVE_ORIGINAL_ALL_BAND_BACKGROUND_C8"
    assert background["nodeCount"] == native["sourceNodes"] == 14220509
    assert len(background["checks"]) == native["backgroundChecks"] == 12
    assert all(row["pass"] for row in background["checks"])
    assert background["row"]["backgroundDerivativeOrder"] == 8
    assert not background["scope"]["actualNumericalConstantsEnclosed"]
    assert [r["order"] for r in c8["progress"] if r["name"] == "positive-primitive-complete"] == list(range(1, 9))
    assert c8["progress"][-1]["nodeCount"] == native["pressureStringStopNodes"]
    assert c8["error"]["message"] == "Invalid string length" and not c8["stages"]
    n1 = scope["nativeN1PrimaryC5"]
    primary = checked(f"{c5}hosted-{n1['run']}/primary-c5-native.json", n1["receiptSHA256"])
    assert primary["status"] == n1["status"] == "VERIFIED_ORIGINAL_NATIVE_N1_PRIMARY_C5_CLASS"
    assert primary["requested"] == {"prefix": 1, "familyC": 8, "weightedTargetC": 6, "primaryC": 5}
    assert len(primary["stages"]) == n1["stages"] == 6
    assert primary["stages"][-1]["nodeCount"] == n1["finalNodes"] == 15122428
    assert primary["normRoot"] == n1["normRoot"] == 15122325
    assert len(primary["nativeChecks"]) == n1["nativeChecks"] == 9
    assert all(row["pass"] for row in primary["nativeChecks"])
    assert primary["scope"]["actualFiniteDerivativeOrder"] == 5
    assert not primary["scope"]["actualForcedInputWClassCertified"]
    assert primary["domain"]["prefixOrder"] == 1 and primary["finalJets"] == "0/67"
    assert [row["pole"] for row in primary["targetRows"]] == list(range(3, 22, 3))
    active_first_run = summary["pendingHostedCalculations"]["activeN3N4FamilyPrimaryC5"]
    for order, last_nodes in ((3, 15959555), (4, 15135387)):
        raw = checked(
            f"{c5}hosted-{active_first_run['run']}-n{order}/primary-c5-native.json",
            active_first_run["receipts"][str(order)],
        )
        assert raw["requested"]["prefix"] == order and raw["requested"]["selectorThroughOrder"] == order + 1
        assert raw["originalBackgroundC8"]["nodeCount"] == 14220509
        assert raw["limits"]["familyNodes"] == 16000000 and raw["error"]["code"] == "RESOURCE_LIMIT"
        assert raw["progress"][-1]["nodeCount"] == last_nodes and not raw["stages"]
    parity = scope["lowerOrderStorageParity"]
    left, right = (
        checked(f"{c5}large-pack/native-chain-{name}.json", parity[f"{name}SHA256"])
        for name in ("original", "bounded")
    )
    assert left["attestations"] == right["attestations"]
    assert len(left["attestations"]) == parity["stages"] == 6
    assert all(row["graphMutationRejected"] and row["programMutationRejected"] for row in (left, right))

    archive = scope["archivedFirstForced"]
    base = "primary-forced-weights/"
    one = checked(base + "mixed-wave/archived-mode-one-c2.json", archive["modeOneC2SHA256"])
    two = checked(base + "archived-mode-two/mode-two-input-c3-numerical.json", archive["modeTwoInputC3SHA256"])
    inverse = checked(base + "archived-mode-two/mode-two-inverse-c3-numerical.json", archive["modeTwoInverseC3SHA256"])
    readback = checked(base + "archived-mode-two/mode-two-inverse-c3-readback.json", archive["modeTwoInverseC3ReadbackSHA256"])
    assert sum(len(c) for r in one["results"] for c in r["components"]) == archive["modeOneC2OutputBounds"] == 126
    assert not one["application"]["coversPhysicalWholeKInterior"]
    assert len(two["rows"]) == archive["modeTwoC3MixedIndices"] == 56
    assert len(inverse["ordinaryRows"]) == readback["ordinaryIndices"] == 56
    assert len(inverse["upperEndpoints"]) == readback["upperEndpoints"] == archive["modeTwoInverseC3DirectedRoots"] == 200
    assert readback["status"] == "PASS" and readback["receiptSHA256"] == archive["modeTwoInverseC3SHA256"]
    active = scope["activeN3LocalModeTwo"]
    local = checked(base + "active-mode-two/active-n3-mode-two-path.json", active["localReplaySHA256"])
    nodes = checked(base + "active-mode-two/active-n3-python-readback.json", active["nodeReadbackSHA256"])
    assert nodes["status"] == "PASS" and nodes["graphSHA256"] == local["archive"]["graphSHA"]
    assert nodes["nodeCount"] == local["archive"]["nodeCount"] == active["sourceNodes"] == 3914395
    assert nodes["nodeOperandEdgesChecked"] == active["originalOperandEdges"] == 8345579
    assert local["activeOriginalChart"]["physicalSelectorArguments"] == ["1/40", "2/5", "4/5", "8/5"]
    assert not active["nativeInitializedForcedExport"]
    fast = checked(base + "active-mode-two/active-n3-physical-fast-support.json", active["physicalFastSupportSHA256"])
    assert fast["status"] == "VERIFIED_PHYSICAL_FAST_SUPPORT_EXISTS_IN_SELECTED_N3_CELL"
    assert fast["activeReceiptSHA256"] == active["localReplaySHA256"]
    assert fast["pythonReadbackSHA256"] == active["nodeReadbackSHA256"]
    assert fast["chart"]["q"] == "qBig/40" and fast["directed"]["strictComparison"]
    assert fast["exactBounds"]["actualFastCoordinateGuards"][-1] == "chi=psi=1"
    picard = scope["originalPicardCalls"]
    tail = checked("y-higher-flow/fixed-n-radial-tail/tail-parameters.json", picard["n4RadialTailParametersSHA256"])
    assert tail["nodeCount"] == picard["n4GraphNodes"] == 7358162
    assert len(tail["rows"]) == picard["fixedActualTailSystems"] == 5
    assert tail["exactTailThresholdRationalTests"] == 100
    value_tail = checked("y-higher-flow/fixed-n-radial-tail/value-tail.json", picard["n4ValueTailSHA256"])
    assert value_tail["sourceTailReceiptSHA256"] == picard["n4RadialTailParametersSHA256"]
    assert value_tail["sourceActualOrders"] == list(range(1, 6))
    assert value_tail["badMaskControlDetected"] and value_tail["exactRationalThresholdTests"] == 100
    n2 = checked("y-higher-flow/fixed-n-limit/n2-python-ast.json", picard["n2AstAuditSHA256"])
    assert n2["nodeCount"] == 2852905
    base = "y-higher-flow/y-picard-callers/"
    lower = checked(base + "lower-calls.json", picard["n4LowerCallSHA256"])
    top = checked(base + "top-calls.json", picard["n4OtherCallSHA256"])
    assert lower["totalDirectLowerCalls"] == top["priorLowerProfiles"] == 163
    assert top["otherProfiles"] == 96 and top["allOtherCallSitesBoundAndGuarded"]
    assert top["reachedActualEvenProfiles"] == picard["n4ReachedLiteralProfiles"] == 259
    for file, field, failures in (
        ("top-reset-native.json", "n4ResetNativeSHA256", 0),
        ("top-no-guards.json", "n4NoGuardSHA256", 96),
        ("top-no-binders.json", "n4NoBinderSHA256", 54),
    ):
        control = checked(base + file, picard[field])
        assert control["failed"] == failures and control["passed"] == 96 - failures

    cutoff = summary["pendingHostedCalculations"]["sameN1FamilyPrimaryC5"]
    cutoff_receipt = checked(f"{c5}hosted-{cutoff['run']}/primary-c5-native.json", cutoff["receiptSHA256"])
    assert cutoff_receipt["error"]["message"] == "Invalid string length"
    assert "attachActualNormalizedCutoffs" in cutoff_receipt["error"]["stack"]

    forced = summary["pendingHostedCalculations"]["sameN1FamilyPrimaryC3"]
    receipt = checked(f"primary-forced-join/hosted-{forced['run']}/native-receipt.json", forced["receiptSHA256"])
    assert not receipt["real_original_forced_seal_issued"]
    assert sum(r.get("stage", r.get("phase")) == "actual-forced-complete-body-coefficient-comparison-passed"
               for r in receipt["progress"]) == 10

    lean = scope["actualPicardRadialTailLean"]
    lean_sha = entry(git("show", head + ":" + LEAN))["sha256"]
    assert lean_sha == lean["sourceSHA256"]
    ci = f"ci-{lean['run']}/"
    assert (lean_sha + "  MathScope/M3/CD/ActualPicardRadialTail.lean\n").encode() in source(ci + "source-sha256.txt")
    lean_log = source(ci + "ActualPicardRadialTail.log")
    assert entry(lean_log)["sha256"] == lean["logSHA256"]
    assert lean_log.decode().splitlines() == [
        f"'MathScope.M3.CD.{name}' depends on axioms: [propext, Classical.choice, Quot.sound]"
        for name in lean["theorems"]
    ]

    delta = outputs / f"{LABEL}_Delta_{DATE}.zip"
    pending = delta.with_suffix(".zip.tmp")
    files = {}
    with ZipFile(pending, "w", compression=ZIP_DEFLATED, compresslevel=5) as bundle:
        def add(name, data):
            assert name not in files
            bundle.writestr(name, data)
            files[name] = entry(data)

        for row in git("diff", "--name-status", "--no-renames", PARENT, head).decode().splitlines():
            kind, path = row.split("\t")
            assert kind in {"A", "M"} and (path.startswith(CURRENT + "/") or path in ALLOWED), path
            assert git("hash-object", "--path=" + path, "--", path).strip() == git(
                "rev-parse", head + ":" + path
            ).strip(), path
            if kind == "M" and path in older:
                assert entry(git("show", PARENT + ":" + path)) == older[path], path
            add(path, git("show", head + ":" + path))

        add("REPORT_KO.md", report)
        add("STATUS.json", status)
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
            assert entry(bundle.read(path)) == expected, path
    pending.replace(delta)
    receipt = {
        "file": delta.name, "bytes": delta.stat().st_size, "files": len(files) + 1,
        "sha256": file_sha(delta), "branchHead": head, "verifiedParentsInOrder": PARENTS,
        "verifiedC8BackgroundNodes": native["sourceNodes"],
        "verifiedNativeN1PrimaryC5Nodes": n1["finalNodes"],
        "verifiedPicardLeanSourceSHA256": lean_sha,
        "verifiedArchivedModeOneOutputBounds": archive["modeOneC2OutputBounds"],
        "verifiedN4ConditionalPicardSites": picard["n4ReachedLiteralProfiles"],
        "verifiedDeltaManifest": True,
    }
    (outputs / f"{LABEL}_Report_{DATE}_KO.md").write_bytes(report)
    (outputs / f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
