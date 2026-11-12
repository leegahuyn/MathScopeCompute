"""Verify and archive the active N3 Primary C5 and even-axis evidence."""

from argparse import ArgumentParser
from hashlib import sha256
import gzip
import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

from assemble_continuation30 import PARENTS as EARLIER_PARENTS, entry
from assemble_continuation_delta import BRANCH, CURRENT, encode, file_sha


PARENTS = {
    **EARLIER_PARENTS,
    "MathScope_Goal_Continuation30_Delta_20261113.zip":
        "1c39282f3ea8e6ed86fe6a23ba9069029ca82785d61a948254686880e5cc4b48",
}
PARENT = "7b9e0b5c342869714740321ee93adbe6d930f3b5"
LABEL = "MathScope_Goal_Continuation31"
DATE = "20261113"
LEAN = "research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/EvenAxisTail.lean"
ALLOWED = {
    ".github/workflows/mathscope-original-primary-c5.yml",
    ".github/workflows/mathscope-cd-axial-bridge-20261029.yml",
    ".github/workflows/mathscope-active-mode-two-witness.yml",
    ".github/workflows/mathscope-active-n3-same-family-forced.yml",
    LEAN,
}
C5 = "primary-forced-weights/live-c5/"
EVEN = "y-higher-flow/picard-even-axis/"
WITNESS = "primary-forced-join/active-mode-two-witness/hosted-43288360518/"


def verify(source, git, status):
    assert status["M3"]["accepted"] == 62 and status["jets"]["accepted"] == 0
    assert status["M4"]["accepted"] == 16 and status["M4"]["publicReadback"]["currentR108"] == "OPEN"
    assert status["Y"]["verifiedExplicitN1SourceIngress"] == 523
    assert status["release"] == "HOLD" and not status["goal_complete"]
    scope = status["continuation31"]
    assert scope["advancedOfficialCounts"] is False

    def checked(path, digest):
        raw = source(path)
        assert entry(raw)["sha256"] == digest, path
        return json.loads(raw)

    n3 = scope["nativeActiveN3PrimaryC5"]
    primary = checked(f"{C5}hosted-{n3['run']}-n3/primary-c5-native.json", n3["receiptSHA256"])
    assert primary["status"] == n3["status"] == "VERIFIED_ORIGINAL_NATIVE_N3_PRIMARY_C5_CLASS"
    assert primary["requested"] == {
        "prefix": 3, "selectorThroughOrder": 4, "familyC": 8, "weightedTargetC": 6, "primaryC": 5,
    }
    stages = primary["stages"]
    assert len(stages) == 6
    assert stages[0]["nodeCount"] == n3["backgroundNodes"] == 17732727
    assert stages[-2]["nodeCount"] == n3["targetNodes"] == 17761759
    assert stages[-1]["nodeCount"] == n3["finalNodes"] == 18310172
    assert primary["normRoot"] == n3["normRoot"] == 18310069
    assert len(primary["nativeChecks"]) == n3["nativeChecks"] == 9
    assert all(row["pass"] for row in primary["nativeChecks"])
    assert primary["scope"]["actualFiniteDerivativeOrder"] == 5
    assert not primary["scope"]["actualForcedInputWClassCertified"]
    assert primary["finalJets"] == "0/67"

    n4 = scope["activeN4ReachedWeightedC6"]
    partial = checked(f"{C5}hosted-{n4['run']}-n4/primary-c5-native.json", n4["receiptSHA256"])
    assert partial["requested"]["prefix"] == 4
    assert partial["stages"][-1]["name"] == "same-source-C6-weighted-target"
    assert partial["stages"][-1]["nodeCount"] == n4["targetNodes"] == 23572162
    assert partial["currentStage"] == n4["stopStage"] == "original-phase-free-wave-C5"
    assert partial["limits"]["familyNodes"] == n4["nodeLimit"] == 24000000
    assert partial["error"]["code"] == n4["stopCode"] == "RESOURCE_LIMIT"
    assert not n4["actualPrimaryC5Certified"]
    n4_final = scope["nativeActiveN4PrimaryC5"]
    primary4 = checked(f"{C5}hosted-{n4_final['run']}-n4/primary-c5-native.json", n4_final["receiptSHA256"])
    assert primary4["status"] == n4_final["status"] == "VERIFIED_ORIGINAL_NATIVE_N4_PRIMARY_C5_CLASS"
    assert primary4["requested"] == {
        "prefix": 4, "selectorThroughOrder": 5, "familyC": 8, "weightedTargetC": 6, "primaryC": 5,
    }
    assert primary4["limits"]["familyNodes"] == 25000000
    assert len(primary4["stages"]) == 6
    assert primary4["stages"][0]["nodeCount"] == n4_final["backgroundNodes"] == 23543130
    assert primary4["stages"][-2]["nodeCount"] == n4_final["targetNodes"] == n4["targetNodes"]
    assert primary4["stages"][-1]["nodeCount"] == n4_final["finalNodes"] == 24120575
    assert primary4["normRoot"] == n4_final["normRoot"] == 24120472
    assert len(primary4["nativeChecks"]) == n4_final["nativeChecks"] == 9
    assert all(row["pass"] for row in primary4["nativeChecks"])
    assert not primary4["scope"]["actualForcedInputWClassCertified"]
    assert primary4["finalJets"] == "0/67"
    original = status["pendingHostedCalculations"]["activeN3N4FamilyPrimaryC5BudgetRetry"]
    for prefix, nodes in ((3, 16764850), (4, 16001770)):
        stopped = checked(
            f"{C5}hosted-{original['run']}-n{prefix}/primary-c5-native.json",
            original["receipts"][str(prefix)],
        )
        assert stopped["progress"][-1]["nodeCount"] == nodes
        assert stopped["error"]["message"] == "Map maximum size exceeded"
    segmented = scope["segmentedIntern"]
    base = C5 + "compact-lookup/"
    forks = checked(base + "segmented-native-forks.json", segmented["originalForksSHA256"])
    assert forks["status"] == "VERIFIED_ORIGINAL_FORK_CONSTRUCTOR_AND_INTERN_PARITY"
    limit = json.loads(source(base + "segmented-limit-run.json"))
    assert limit["status"] == "PASS" and limit["entries"] == segmented["crossNativeMapLimitTestEntries"] > 2**24
    assert limit["nodeIDOrderPreserved"]

    bound = scope["activeN3ModeTwoC4"]
    mode2 = checked(
        "primary-forced-join/active-n3-c5-binding/n3-mode-two-degrees-pulled.json", bound["receiptSHA256"],
    )
    assert mode2["rawNativeC5ReceiptSHA256"] == n3["receiptSHA256"]
    assert mode2["normGraph"]["K"] == n3["normRoot"]
    for name, key in (("raw", "rawPower"), ("projected", "projectedPower"), ("projectedAfterHw", "pulledBackPower")):
        assert mode2[name][-1] == {
            "power": bound[key], "pole": 42, "epsilon_units": 99999, "zeta_half_units": 2, "gaussian": 2,
        }
    assert not bound["numericEndpointCertified"] and bound["activeVolterraOutputBound"] == "OPEN"
    inverse = checked(
        "primary-forced-join/active-n3-c5-binding/active-inverse/n3-active-inverse-degrees.json",
        bound["conditionalStableInverseSHA256"],
    )
    assert inverse["inputSHA256"] == bound["receiptSHA256"] and inverse["sourceK"] == n3["normRoot"]
    for name, power, epsilon in (("nativeVelocity", 3134, 99999), ("cutoffGauge", 3165, 149999),
                                  ("cutoffPressure", 3172, 149999)):
        assert inverse["bounds"][name][-1] == {
            "power": power, "pole": 42, "epsilon_units": epsilon, "zeta_half_units": 2, "gaussian": 1,
        }
    historical = json.loads(source("primary-forced-join/active-mode-two-witness/historical-n1-control.json"))
    assert historical["status"] == "HISTORICAL_N1_CONTROL_ONLY" and not historical["completeForcedSeal"]
    pressure = scope["nativePressureStorageParity"]
    base = "primary-forced-join/active-c5/pressure-parity/"
    left, right = [checked(base + name + ".json", pressure["bothReceiptsSHA256"]) for name in ("original", "overlay")]
    assert left == right and left["nodes"] == pressure["nodes"] == 1635639
    assert left["mutationAndEquivalentReplacementControls"]
    assert len(left["checks"]) == 11 and all(row["pass"] for row in left["checks"])
    assert entry(source(base + "old-helper.mjs"))["sha256"] == pressure["helperSHA256"]
    current_base = "primary-forced-join/active-c5/pressure-current-parity/"
    current = checked(current_base + "overlay-current.json", pressure["bothReceiptsSHA256"])
    assert current == left and pressure["latestHelperEndToEndParity"] == "VERIFIED_N1_C2"
    assert entry(source(current_base + "current-helper.mjs"))["sha256"] == pressure["latestHelperSHA256"]
    n4_overlay = json.loads(source(f"{C5}hosted-{n4_final['run']}-n4/bounded-seal-overlays.json"))
    assert n4_overlay["helperSHA256"] == pressure["latestHelperSHA256"]

    even = scope["evenAxisTail"]
    parity = checked(EVEN + "parity.json", even["paritySHA256"])
    assert parity["negativeWrongParityRejected"]
    assert sum(row["nonzeroEntriesChecked"] for row in parity["rows"]) == even["parityEntries"] == 110
    derivatives = checked(EVEN + "coefficient-derivatives.json", even["derivativeSHA256"])
    assert derivatives["addedNodes"] == even["newDerivativeNodes"] == 2940
    dependency = checked(EVEN + "coefficient-dependencies.json", even["dependencySHA256"])
    assert dependency["nonzeroCoefficientDerivatives"] == even["coefficientDerivativeRoots"] == 95
    assert all(row["lowerPicardNodes"] == 0 and row["naturalSeriesNodes"] == 103 for row in dependency["rows"])
    estimate = checked(EVEN + "even-estimate.json", even["estimateSHA256"])
    assert estimate["actualSystems"] == [0, 3, 5, 7, 9] and estimate["algebraExactRationalTests"] == 36
    majorant = checked(EVEN + "matrix-derivative-majorant.json", even["matrixMajorantSHA256"])
    assert majorant["status"] == "PASS" and majorant["source_assignment_count"] == 18
    seam = checked(EVEN + "seam-receipt.json", even["seamAlgebraSHA256"])
    assert seam["status"] == "PASS" and seam["formal_jet_orders_checked"] == list(range(7))
    slopes = checked(EVEN + "actual-seam/receipt.json", even["actualSourceSlopeSHA256"])
    assert slopes["status"] == "PASS" and len(slopes["checks"]) == 4
    domain = checked(EVEN + "actual-seam/domain-receipt.json", even["actualActivationDomainSHA256"])
    assert domain["status"] == "PASS" and "beta=1, blend=0" in domain["conclusion"]
    natural = checked(EVEN + "actual-seam/natural-bridge-receipt.json", even["naturalLeadingDataSHA256"])
    assert natural["status"] == "PASS" and natural["same_actual_parameter_keys"] == 12
    assert natural["original_axis_scalar_checks"] == "51/51" and "63/256" in natural["phi_bound"]
    for name in ("SAME_DATUM_ANALYTIC_AXIS.md", "axis-envelope-certificate.json"):
        assert entry(source(EVEN + "actual-seam/natural-source/" + name))["sha256"] == natural["pins"][name]
    assert even["actualForcingC1"] == even["nativeInfinitePicardLimit"] == "OPEN"
    for result, stem in ((even, "firstLean"), (even["averageLeanVerified"], "lean")):
        lean_sha = result[stem + "SourceSHA256"]
        assert entry(git("show", result[stem + "SourceCommit"] + ":" + LEAN))["sha256"] == lean_sha
        logs = f"ci-{result[stem + 'Run']}/"
        assert (lean_sha + "  MathScope/M3/CD/EvenAxisTail.lean\n").encode() in source(logs + "source-sha256.txt")
        log = source(logs + "EvenAxisTail.log")
        assert entry(log)["sha256"] == result[stem + "LogSHA256"]
        assert log.decode().splitlines() == [
            f"'MathScope.M3.CD.{name}' depends on axioms: [propext, Classical.choice, Quot.sound]"
            for name in result[stem + "Theorems"]
        ]
    return {
        "verifiedNativeN3PrimaryC5Nodes": n3["finalNodes"],
        "verifiedNativeN4PrimaryC5Nodes": n4_final["finalNodes"],
        "verifiedEarlierNativeN4C6Nodes": n4["targetNodes"],
        "verifiedN3ProjectedModeTwoConditionalPower": bound["pulledBackPower"],
        "verifiedOriginalPicardParityEntries": even["parityEntries"],
        "verifiedOriginalPicardDerivativeRoots": even["coefficientDerivativeRoots"],
    }


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", type=Path, required=True)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--active-witness", type=Path, required=True)
    args = parser.parse_args()
    outputs = args.workspace / "outputs"

    def git(*params):
        return subprocess.check_output(["git", "-c", "core.longpaths=true", *params], cwd=args.repo)

    head = git("rev-parse", "HEAD").decode().strip()
    assert git("branch", "--show-current").decode().strip() == BRANCH
    source = lambda path: git("show", f"{head}:{CURRENT}/{path}")
    preservation = json.loads(source("preservation-continuation31.json"))
    refs = {f"refs/heads/{name}": sha for name, sha in preservation["remoteBaselineRefs"].items()}
    refs[preservation["onlyPushRef"]] = head
    remote = git("ls-remote", "origin", *refs).decode().splitlines()
    assert {ref: sha for sha, ref in (line.split() for line in remote)} == refs
    page = preservation["readOnlyOperationalPage"]
    assert page["http"] == 200 and page["bytes"] == 30707818 and not page["publishedOrModified"]

    older = {}
    for name, digest in PARENTS.items():
        path = outputs / name
        assert file_sha(path) == digest, name
        with ZipFile(path) as ancestor:
            older.update(json.loads(ancestor.read("SHA256.json")))

    report, status = source("REPORT_KO.md"), source("STATUS.json")
    parsed = json.loads(status)
    checks = verify(source, git, parsed)
    witness = parsed["continuation31"]["activeN3SourceWitness"]
    witness_raw = source(WITNESS + "original-active-mode-two-witness.json")
    assert entry(witness_raw)["sha256"] == witness["witnessReceiptSHA256"]
    original = json.loads(witness_raw)
    assert original["initializedNodeCount"] == 5999692
    assert [row["key"] for row in original["rows"]] == ["0:1", "1:1"]
    assert not original["completeForcedSeal"] and not original["uniformClassOrJetBound"]
    snapshot = original["snapshot"]
    graph = args.active_witness / "original-source-nodes.jsonl.gz"
    registry = args.active_witness / "original-source-functions.json"
    assert file_sha(graph) == witness["compressedGraphSHA256"]
    assert file_sha(registry) == snapshot["definitions_sha256"] == witness["registrySHA256"]
    digest = sha256()
    nodes = size = 0
    with gzip.open(graph, "rb") as stream:
        header = stream.readline()
        assert json.loads(header) == {"schema": "MathScope.M3.FullNodesJSONL/1",
                                     "node_count": snapshot["node_count"]}
        digest.update(header)
        size += len(header)
        for block in iter(lambda: stream.read(1 << 20), b""):
            digest.update(block)
            nodes += block.count(b"\n")
            size += len(block)
    assert nodes == snapshot["node_count"] == witness["nodes"] == 6019418
    assert size == snapshot["node_stream_uncompressed_bytes"]
    assert digest.hexdigest() == snapshot["node_stream_sha256"] == witness["nodeStreamSHA256"]
    readback_raw = source(WITNESS + "n3-active-mode-two-readback.json")
    assert entry(readback_raw)["sha256"] == witness["independentReadbackSHA256"]
    readback = json.loads(readback_raw)
    assert readback["status"] == "ACTIVE_SOURCE_MODE_TWO_OPERAND_READBACK"
    assert readback["inputReceiptSHA256"] == witness["witnessReceiptSHA256"]
    assert readback["graphSHA256"] == witness["nodeStreamSHA256"]
    assert readback["registrySHA256"] == witness["registrySHA256"]
    assert [row["key"] for row in readback["rows"]] == witness["originalKeys"]
    assert readback["priorEdges"] == witness["typedPriorEdges"] == 12835313
    assert readback["negativeControl"] == "swapped H_w rejected"
    assert not readback["completeForcedSeal"] and not readback["classBounds"]
    assert entry(source("primary-forced-join/active-mode-two-witness/check_active_mode_two.py"))["sha256"] == witness["checkerSHA256"]
    defect_raw = source(WITNESS + "radical-defect.json")
    assert entry(defect_raw)["sha256"] == "891f6d2440a5dd8c4de0c10d3b639afac308bdb85471a4f9c6c4fe4f188dddd0"
    defect = json.loads(defect_raw)
    assert defect["inputSHA256"] == witness["witnessReceiptSHA256"] and defect["nodeCount"] == nodes
    assert defect["rows"][1]["radical"] == 3622 and defect["rows"][1]["unitPerturbationRejected"]
    assert [part["termsAfterLiteralSqrt"] for part in defect["rows"][1]["parts"]] == [0, 0]
    earlier_checker = git("show", "891ca1646b8a3e4512ed33fc6b0876a46855aa92:" + CURRENT
                          + "/primary-forced-join/active-mode-two-witness/check_active_mode_two.py")
    assert entry(earlier_checker)["sha256"] == "ecbf621f9aa917c3dfad34ff134d25ce64588b2eb4996eebc7024c9c86dd7362"
    delta = outputs / f"{LABEL}_Delta_{DATE}.zip"
    pending = delta.with_suffix(".zip.tmp")
    files = {}
    with ZipFile(pending, "w", compression=ZIP_DEFLATED, compresslevel=5) as bundle:
        def add(name, data):
            assert name not in files
            bundle.writestr(name, data)
            files[name] = entry(data)

        changes = git("diff", "--name-status", "--no-renames", PARENT, head).decode().splitlines()
        for row in changes:
            kind, path = row.split("\t")
            assert kind in {"A", "M"} and (path.startswith(CURRENT + "/") or path in ALLOWED), path
            assert git("hash-object", "--path=" + path, "--", path).strip() == git(
                "rev-parse", head + ":" + path
            ).strip(), path
            if kind == "M" and path in older:
                assert entry(git("show", PARENT + ":" + path)) == older[path], path
            add(path, git("show", head + ":" + path))

        add(f"{CURRENT}/{WITNESS}{graph.name}", graph.read_bytes())
        add(f"{CURRENT}/{WITNESS}{registry.name}", registry.read_bytes())
        add(f"{CURRENT}/{WITNESS}check_active_mode_two.pre_radical.py", earlier_checker)
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
        **checks, "activeN3WitnessNodes": nodes, "activeN3VerifiedTypedEdges": readback["priorEdges"],
        "verifiedDeltaManifest": True,
    }
    (outputs / f"{LABEL}_Report_{DATE}_KO.md").write_bytes(report)
    (outputs / f"{LABEL}_Receipt_{DATE}.json").write_bytes(encode(receipt))
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
