"""Cross-check the original N3 repeat metadata from hosted run 44582875351."""

from argparse import ArgumentParser
from collections import Counter
from hashlib import sha256
from pathlib import Path
import gzip
import json


RUN, HEAD = 44582875351, "059df9db3a188ce18f3c43a0dca3a92f2e02a4b2"
SPLIT, PRE, POST = 22153782, 22155584, 22380596
RESIDUAL = [22153560, 22153562, 22153564]
SPLIT_ROOTS = [22153774, 22153776, 22153778]
PARTS = ("real", "imaginary")
KINDS = ("raw", "subtraction", "supported", "guarded")
KEYS = [f"{d}:{sign}" for d in range(5) for sign in (1, -1)]
CASES = [(key, m) for key in KEYS for m in range(1, 5)]
COMMON_ARGS = [17732748, 17732749, 17732750, 17745430, 17745431, 17732737,
               17733857, 17733856, 17733858]
LABEL_ARGS = {21435315, 21435316, 21435317, 21435318, 21435319}
ORIGINAL_REPEAT = "4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7"
REFERENCE = "74a686bc95f4c094f1de834062b8b402aa5b861940fa3e109aa0f1913d52d529"

FILES = {
    "candidate": ("active-n3-repeat-forced-candidate.json", "20e3cb1dbf4d4af9ec8548c027f29e5c5225091012d6b0ae33fa6cce320be4ca"),
    "first": ("first-cycle.json", "42885290951e7d4b9fa689c7f67e0d390b39d101cc80d2af08c14188f25baef3"),
    "ingress": ("first-correction-spatial-ingress.json", "20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f"),
    "export": ("first-correction-spatial-export.json", "a06d409faf6818d1f494e685334d0e420b3a659ddf793f7752a83c30db99dc0c"),
    "manifest": ("first-correction-spatial-source/original-source-export-manifest.json", "8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a"),
    "registry": ("first-correction-spatial-source/original-source-functions.json", "e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03"),
    "direct": ("independent-direct-split.json", "bc91034dffc735ef809dc9c4efd21e6ae6efa21c4af48ae0a027d2ba31110455"),
    "direct_manifest": ("direct-split-arithmetic-manifest.json", "ad9540564b65fb29a1352c09c336854ea5d8bd3ffd3fb34d7e8866dcf19c1291"),
    "direct_closure": ("direct-split-arithmetic-closure.json", "51057fc92e13cd7fc9a875e71c2926c6769cc3536ee1a13f2bea7ddd630cd94a"),
    "progress": ("native-run.log", "ef6e291de93cab99dafdfec4bceda5b53b05f0b7b29e44ef173a6a0209e67e98"),
}


def ids(complex_row):
    assert set(complex_row) == set(PARTS)
    result = [complex_row[part] for part in PARTS]
    assert all(type(i) is int and 0 <= i < POST for i in result)
    return result


def check_predecessor(data, run):
    first, direct, arithmetic, ingress, export, manifest, registry = (
        data[k] for k in ("first", "direct", "direct_manifest", "ingress", "export", "manifest", "registry")
    )
    assert run["databaseId"] == RUN and run["headSha"] == HEAD
    assert (run["status"], run["conclusion"]) == ("completed", "success")
    assert len(run["jobs"]) == 1 and run["jobs"][0]["conclusion"] == "success"
    assert any(step["name"] == "Run actions/upload-artifact@v4" and step["conclusion"] == "success"
               for step in run["jobs"][0]["steps"])
    assert first["prefix"] == 3 and first["status"] == "VERIFIED_FIRST_CYCLE_SOURCE_CONSTRUCTION"
    assert first["stages"][-1]["conservativeResidual"] == RESIDUAL
    assert first["stages"][-1]["velocity"] == ingress["input"]["latest"]
    assert first["split"] == {"roots": SPLIT_ROOTS, "divergence": 22153781, "nodeCount": SPLIT, "differencesProvedZero": False}
    assert arithmetic["currentReceipt"] == first and arithmetic["sourceGraphNodes"] == SPLIT
    assert arithmetic["originalPrivatePDESealRevalidated"] is True
    assert direct["closureSHA256"] == arithmetic["closureSHA256"] == FILES["direct_closure"][1]
    assert direct["firstCycleReceiptSHA256"] == arithmetic["firstCycleReceiptSHA256"] == ingress["sourceReferenceReceiptSHA256"] == REFERENCE
    assert direct["status"] == "VERIFIED_ACTUAL_DIRECT_SPLIT_RATIONAL_IDENTITIES" and direct["zeroPolynomials"] == 4
    assert direct["roots"] == {"conservativeDifferences": SPLIT_ROOTS,
                               "divergenceDifference": 22153781, "directResidualControls": RESIDUAL}
    assert direct["actualConservativeResidualProvedZero"] is False and direct["quantitativeClosure"] == "OPEN"
    assert ingress["originalPrefix"] == SPLIT and ingress["materializedNodes"] == PRE
    assert ingress["sameLiveOriginalSourceAsserted"] and ingress["sameRunDirectSplitOutcome"] == "VERIFIED"
    assert ingress["mode"] == "full-source" and export["snapshot"] == manifest
    groups = ingress["normalizedRoots"]
    operands = groups["U"] + [x for row in groups["G_U"] for x in row] + groups["A"] + [x for row in groups["G_A"] for x in row]
    extras = ingress["input"]
    roots = operands + ingress["gaugeDifferenceRootsForIndependentCheck"] + [x["root"] for x in ingress["spatialJetAtoms"]]
    roots += [extras["temporalDesiredAxial"], *extras["temporalRawCenteredSources"], extras["fiveWhole"], extras["fiveCompactCandidate"]]
    assert len(operands) == 24 and len(set(roots)) == 63
    assert export["roots"] == manifest["original_root_ids"] == list(dict.fromkeys(roots))
    assert manifest["node_count"] == PRE and manifest["executing_commit"] == HEAD
    assert manifest["definitions_sha256"] == FILES["registry"][1]
    assert sum(manifest["operation_histogram"].values()) == PRE
    assert manifest["function_registry_capture_kind"] == "EXTENDED_COUPLED_FACADE"
    definitions = json.loads(registry["definitions"])
    assert [len(group) for group in definitions] == registry["counts"] == manifest["extended_coupled_function_counts"] == [1355, 29, 2, 20, 0]
    assert manifest["actual_final_67_jets_certified"] == 0 and manifest["release"] == "HOLD"
    assert first["N706"] == first["N805"] == "OPEN" and first["release"] == "HOLD"
    return definitions, roots


def check_candidate(data, definitions):
    c, ingress = data["candidate"], data["ingress"]
    assert c["schema"] == "MathScope.N8.SameLiveActiveN3RepeatForcedCandidate/1"
    assert c["status"] == "ORIGINAL_REPEAT_FORCED_CANDIDATES_CONSTRUCTED_STAGE2_OPEN"
    assert (c["mode"], c["graphSnapshot"], c["sourceModuleSHA256"]) == ("metadata", None, ORIGINAL_REPEAT)
    assert (c["firstCycleSplitNodeCount"], c["preRepeatNodeCount"], c["postRepeatNodeCount"]) == (SPLIT, PRE, POST)
    assert c["precedingConservativeResidual"] == RESIDUAL
    assert c["registeredPositiveSystems"] == 40 and c["typedMappedPotentialApplications"] == 240
    assert [row["key"] for row in c["templates"]] == KEYS
    assert [(row["key"], row["m"]) for row in c["systems"]] == CASES
    assert [row["system"] for row in c["systems"]] == list(range(len(definitions[3]), 60))
    spatial_rows = {row["key"]: row for row in ingress["wave"]["perTemplate"]}
    assert set(spatial_rows) == set(KEYS)
    root_ids, shape_cases = RESIDUAL.copy(), {}
    operand_rows, earlier_prefix, gauges, gauge_systems, gauge_bodies = set(), set(), set(), set(), set()
    actual_argument_sets, pulled_roots, support_checks = set(), set(), 0
    terms_for_mode = {1: ("first-forced-remaining-source", "first-forced-cutoff-derivative",
                          "primary-cutoff-derivative", "signed-cutoff-derivative"),
                      2: ("first-forced-remaining-source", "first-forced-cutoff-derivative"), 3: (), 4: ()}
    for tmp in c["templates"]:
        key = tmp["key"]
        assert (tmp["difference"], tmp["sign"]) == tuple(map(int, key.split(":")))
        assert tmp["phase"] == spatial_rows[key]["phase"] < SPLIT
        assert tmp["sign"] == spatial_rows[key]["sign"]
        assert [row["m"] for row in tmp["rows"]] == [1, 2, 3, 4]
        support = tmp["rawSupport"]
        assert len(support["waveSystems"]) == len(set(support["waveSystems"])) == 16
        assert len(support["waveJets"]) == 176 and len(support["checks"]) == 24
        assert all(jet["system"] in support["waveSystems"] and 0 <= jet["actualBody"] < POST for jet in support["waveJets"])
        assert support["wholeMeanCoefficientKept"] and support["sourcePressureWaveJetsKept"]
        assert support["originalSupportAndFlatnessStillRequiresAuthentication"] and not support["sourceAuthenticated"]
        for row in tmp["rows"]:
            m = row["m"]
            shape_cases[key, m] = row
            assert tuple(item["family"] for item in row["terms"]) == terms_for_mode[m]
            for item in row["terms"]:
                assert len(item["value"]) == 3
                for root in item["value"]:
                    ids(root)
            for kind in KINDS:
                assert len(row[kind]) == 3
                for z in row[kind]:
                    root_ids.extend(ids(z))
            if m in (3, 4):
                assert row["supported"] == row["raw"]
                assert all(ids(z) == [0, 0] for z in row["subtraction"])
            for component, z in enumerate(row["raw"]):
                for part in PARTS:
                    check = support["checks"][6*(m-1) + 2*component + PARTS.index(part)]
                    assert check["id"] == f"actual-forcing-wave-support-{m}-{component}-{part}"
                    assert check["source"] == z[part] and check["pass"] and check["reduced"] == check["expression"] == 0
                    assert check["numeratorMonomials"] == 0 and check["numerator"] == []
                    support_checks += 1

    wanted_fields = [9, 10, 11, 12, 16, 17, 18, 19]
    assert [row["field"] for row in c["fields"]] == [f"coupled-field:{i}" for i in wanted_fields]
    assert c["mean"]["m"] == 0
    for z in [*c["mean"]["velocity"], c["mean"]["pressure"]]:
        a, b = ids(z)
        assert PRE <= a and b == 0
    field_records = {}
    for field in c["fields"]:
        assert 0 < field["root"] < SPLIT
        definition = next(row for row in definitions[1] if row["id"] == field["field"])
        assert len(definition["rows"]) == 162
        field_records[field["root"]] = definition

    for row in c["systems"]:
        key, m = row["key"], row["m"]
        raw_case = shape_cases[key, m]
        assert len(row["pullback"]) == len(row["mappedPotentialCoefficients"]) == 3
        for component, pullback in enumerate(row["pullback"]):
            assert set(pullback) == set(PARTS)
            for part in PARTS:
                record = pullback[part]
                assert record["body"] == raw_case["guarded"][component][part]
                assert PRE <= record["body"] < record["shared"] <= record["mapped"] <= record["invariant"] < POST
                pulled_roots.update(record.values())
        assert row["positive"]["m"] == m == -row["negative"]["m"]
        assert row["mappedCutoff"]["pressure"] == row["positive"]["pressure"]
        for side in ("positive", "negative"):
            assert len(row[side]["velocity"]) == 3
            for z in [*row[side]["velocity"], row[side]["pressure"]]:
                root_ids.extend(ids(z))
        for pos, neg in zip([*row["positive"]["velocity"], row["positive"]["pressure"]],
                            [*row["negative"]["velocity"], row["negative"]["pressure"]]):
            assert pos["real"] == neg["real"]
        local_args = set()
        suffix = [21435317, 21435319, 21435316, 21435318] if key.startswith("0:") else [21435319, 21435317, 21435318, 21435316]
        if m < 4:
            suffix.append(21435315)
        for gauge in row["mappedPotentialCoefficients"]:
            for part, sign in zip(PARTS, (-1, 1)):
                record = gauge[part]
                assert record["sign"] == sign
                assert PRE <= record["rawBody"] < record["id"] < POST
                assert int(record["system"].removeprefix("coupled-expression:")) >= len(definitions[0])
                args = record["actualArguments"]
                assert args == COMMON_ARGS + suffix and len(args) == len(set(args))
                local_args.add(tuple(args))
                gauges.add(record["id"])
                gauge_bodies.add(record["rawBody"])
                gauge_systems.add(record["system"])
                root_ids.append(record["id"])
        assert len(local_args) == 1
        actual_argument_sets.update(local_args)
    assert support_checks == 240 and len(gauges) == len(gauge_bodies) == len(gauge_systems) == 240
    assert len(actual_argument_sets) == 4
    assert c["rootIds"] == list(dict.fromkeys(root_ids)) and len(c["rootIds"]) == 1444
    earlier_prefix = {i for i in c["rootIds"] if i < PRE}
    assert len(earlier_prefix) == 94
    assert c["scope"] == {"principalCutoffTermsRetained": True, "completeFlatRemainderVerified": False,
                          "independentGlobalConservativeProjectionEquality": "OPEN",
                          "equalityOfGuardedCandidateAndUnclippedSupportedSource": "OPEN",
                          "fixedLabelSmoothJoinsAndUniformClassBounds": "OPEN",
                          "nativeCandidateInverseSystems": 40, "completeSecondForcedState": False,
                          "finalJets": 0, "release": "HOLD"}
    stages = {"post-five-repeat-supported-source-candidate": [], "post-five-repeat-inverse-candidate": []}
    for line in data["progress"].splitlines():
        if line.startswith("{"):
            item = json.loads(line)
            if item.get("name") in stages:
                stages[item["name"]].append(item["nodeCount"])
    supported, inverse = stages.values()
    assert len(supported) == 10 and len(inverse) == 40
    assert [PRE, *supported, *inverse] == sorted(set([PRE, *supported, *inverse])) and inverse[-1] == POST
    needed = earlier_prefix | set(field_records) | set(COMMON_ARGS) | LABEL_ARGS | {x["phase"] for x in c["templates"]}
    return {"templates": KEYS, "nativePositiveSystemIds": [20, 59], "positiveInverseCount": 40,
            "signedReturnedHarmonics": 80, "typedGaugeMetadataRecords": 240, "exactRawSupportRecordCount": support_checks,
            "finiteTermsByMode": {str(k): list(v) for k, v in terms_for_mode.items()},
            "uniqueDeclaredRoots": 1444, "earlierPrefixRoots": len(earlier_prefix), "repeatAppendRoots": 1350,
            "formalArgumentTuples": [list(x) for x in sorted(actual_argument_sets)],
            "phaseRoots": {x["key"]: x["phase"] for x in c["templates"]},
            "pullbackDistinctReferencedRecords": len(pulled_roots)}, needed, field_records


def scan_original_prefix(path, manifest, needed, fields):
    """Hash the earlier exported stream and read only selected lines."""
    keep = {}
    digest, total = sha256(), 0
    with gzip.open(path, "rb") as stream:
        header = stream.readline()
        digest.update(header)
        total += len(header)
        assert json.loads(header) == {"schema": "MathScope.M3.FullNodesJSONL/1", "node_count": PRE}
        leftover, start = b"", 0
        while block := stream.read(8*1024*1024):
            digest.update(block)
            total += len(block)
            complete, separator, tail = (leftover + block).rpartition(b"\n")
            if not separator:
                leftover = tail
                continue
            n = complete.count(b"\n") + 1
            here = [i for i in needed if start <= i < start+n]
            if here:
                rows = complete.split(b"\n")
                for i in here:
                    keep[i] = json.loads(rows[i-start])
            start += n
            leftover = tail
        assert leftover == b"" and start == PRE and set(keep) == needed
    assert digest.hexdigest() == manifest["node_stream_sha256"] and total == manifest["node_stream_uncompressed_bytes"]
    for i in set(COMMON_ARGS) | LABEL_ARGS:
        assert keep[i]["op"] == "coordinate"
    for i, definition in fields.items():
        assert keep[i] == {"op": "m3_coupled_indexed_partial", "args": [definition["id"], definition["parameters"], [0]*6]}
    return {"uncompressedSHA256": digest.hexdigest(), "uncompressedBytes": total, "nodeCount": PRE,
            "directlyReadPrefixNodes": len(keep), "gaugeArgumentNames": {str(k): keep[k]["args"][0] for k in sorted(set(COMMON_ARGS) | LABEL_ARGS)},
            "indexedPrefixReadback": {str(k): v["name"] for k, v in fields.items()}}


def main():
    cli = ArgumentParser(description=__doc__)
    cli.add_argument("artifact", type=Path)
    cli.add_argument("terminal_run", type=Path)
    cli.add_argument("out", type=Path)
    args = cli.parse_args()
    data = {}
    for logical, (path, expected) in FILES.items():
        raw = (args.artifact / path).read_bytes()
        assert sha256(raw).hexdigest() == expected, logical
        data[logical] = raw.decode() if logical == "progress" else json.loads(raw)
    terminal_raw = args.terminal_run.read_bytes()
    run = json.loads(terminal_raw)
    definitions, earlier_roots = check_predecessor(data, run)
    candidate, needed, fields = check_candidate(data, definitions)
    prefix = scan_original_prefix(args.artifact / "first-correction-spatial-source/original-source-nodes.jsonl.gz",
                                  data["manifest"], needed | set(earlier_roots), fields)
    result = {"status": "VERIFIED_SAME_LIVE_HOSTED_N3_REPEAT_METADATA_PREDECESSOR_READBACK_STAGE_TWO_OPEN",
              "run": RUN, "executingCommit": HEAD, "terminalRunSHA256": sha256(terminal_raw).hexdigest(),
              "inputSHA256": {k: expected for k, (_, expected) in FILES.items()},
              "splitNodeCount": SPLIT, "preRepeatNodeCount": PRE, "postRepeatNodeCount": POST, "repeatAppendNodesReported": POST-PRE,
              "predecessorConservativeRoots": RESIDUAL, "separateExactDirectSplitRoots": SPLIT_ROOTS + [22153781],
              "historicalReferenceSHA256": REFERENCE, "sameRunDirectSplitManifestContainsExactCurrentReceipt": True,
              "prefixRawReadback": prefix, "candidateMetadata": candidate,
              "missingRepeatRawStreamAndRegistry": True, "candidateSignedImaginaryNegationsVerifiedFromAppend": False,
              "completeFirstCorrectionNumerical": False, "completeSecondCorrection": "OPEN", "finalJets": "0/67", "release": "HOLD"}
    with args.out.open("x", encoding="utf8", newline="\n") as stream:
        stream.write(json.dumps(result, indent=2) + "\n")
    print(result["status"])


if __name__ == "__main__":
    main()
