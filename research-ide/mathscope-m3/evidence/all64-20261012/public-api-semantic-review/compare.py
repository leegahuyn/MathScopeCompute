"""Read-only JSON/hash comparison; never imports or invokes P7/GP/API code."""
from __future__ import annotations
import argparse
import datetime
import gzip
import hashlib
import json
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
M3 = HERE.parents[2]
LOCAL = M3 / "p7/evidence/final-all64-20261012/attempt1"
PUBLIC = M3 / "evidence/all64-20261012/public-api-3eb-attempt1"
MANIFEST_SHA = "3c6e378b624a48ef0d03068d28b363e4e245266041d463770d308183a76d458d"
EPOCH = "72564078d6fd9d19dc076eb3c4a6842108fad523898f786d0ec98c18b895b041"
PARI_SOURCE = "f317b9722eb5d9094a60303774f066f3a83e3ec1f170be8546c44d7583f30b6d"
HASH = re.compile(r"^[0-9a-f]{64}$")
BUILD_KEYS = {"binaryBytes", "binarySHA256", "buildProvenanceSHA256", "versionOutput"}


def digest(value, ascii_only=False):
    return hashlib.sha256(json.dumps(
        value, sort_keys=True, ensure_ascii=ascii_only,
        separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def pointer(tokens):
    return "/" + "/".join(str(x).replace("~", "~0").replace("/", "~1") for x in tokens)


def differences(a, b, tokens=("result",)):
    if type(a) is not type(b):
        return {tokens: {"kind": "TYPE_CHANGE", "local": type(a).__name__, "public": type(b).__name__}}
    if isinstance(a, dict):
        if set(a) != set(b):
            return {tokens: {"kind": "KEY_SET_CHANGE", "local": sorted(a), "public": sorted(b)}}
        answer = {}
        for key in sorted(a):
            answer.update(differences(a[key], b[key], tokens + (key,)))
        return answer
    if isinstance(a, list):
        if len(a) != len(b):
            return {tokens: {"kind": "LENGTH_CHANGE", "local": len(a), "public": len(b)}}
        answer = {}
        for i, (x, y) in enumerate(zip(a, b)):
            answer.update(differences(x, y, tokens + (i,)))
        return answer
    return {} if a == b else {tokens: {"kind": "VALUE_CHANGE", "local": a, "public": b}}


def dict_pairs(a, b, tokens=("result",)):
    if isinstance(a, dict) and isinstance(b, dict) and set(a) == set(b):
        yield tokens, a, b
        for key in sorted(a):
            yield from dict_pairs(a[key], b[key], tokens + (key,))
    elif isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        for i, (x, y) in enumerate(zip(a, b)):
            yield from dict_pairs(x, y, tokens + (i,))


def is_child(path, root):
    return path[:len(root)] == root


def same_except_compile_line(a, b):
    old = a.splitlines()
    new = b.splitlines()
    old_compile = [i for i, line in enumerate(old) if line.strip().startswith("compiled:")]
    new_compile = [i for i, line in enumerate(new) if line.strip().startswith("compiled:")]
    if len(old_compile) != 1 or old_compile != new_compile or len(old) != len(new):
        return False
    index = old_compile[0]
    return ("gcc version " in old[index] and "gcc version " in new[index]
            and all(x == y for i, (x, y) in enumerate(zip(old, new)) if i != index))


def classify(local_record, public_record):
    old, new = local_record["result"], public_record["result"]
    changes = differences(old, new)
    resolved, mappings, candidates, errors = {}, {}, [], []
    pairs = list(dict_pairs(old, new))

    for path, a, b in pairs:
        if path[-1] == "backend" and a.get("name") == "PARI/GP":
            valid = (
                a == local_record["environment"].get("arithmeticBackend")
                and b == public_record["environment"].get("arithmeticBackend")
                and {k: v for k, v in a.items() if k not in BUILD_KEYS}
                == {k: v for k, v in b.items() if k not in BUILD_KEYS}
                and a.get("version") == b.get("version") == "2.19.0"
                and a.get("sourceArchiveSHA256") == b.get("sourceArchiveSHA256") == PARI_SOURCE
                and a.get("databasesUsed") is b.get("databasesUsed") is False
                and a.get("observedVersionMatchesBuild") is b.get("observedVersionMatchesBuild") is True
                and a.get("sourceVerifiedBeforeBuild") is b.get("sourceVerifiedBeforeBuild") is True
                and all(type(x["binaryBytes"]) is int and x["binaryBytes"] > 0
                        and HASH.fullmatch(x["binarySHA256"])
                        and HASH.fullmatch(x["buildProvenanceSHA256"]) for x in (a, b))
                and same_except_compile_line(a["versionOutput"], b["versionOutput"])
            )
            if not valid:
                errors.append({"path": pointer(path), "reason": "PARI metadata is not the exact recorded environment or its fixed source/version/trust contract differs."})
                continue
            for key in BUILD_KEYS:
                leaf = path + (key,)
                if leaf in changes:
                    resolved[leaf] = {
                        "kind": "RECORDED_PARI_BUILD_METADATA",
                        "evidence": "Equal to this record's arithmeticBackend; only the compiler line, binary bytes/SHA and build-sidecar SHA differ.",
                    }
                    if key.endswith("SHA256"):
                        mappings[(a[key], b[key])] = {"path": pointer(leaf), "kind": "RECORDED_RUNTIME_DIGEST_REFERENCE"}

        # Recompute complete structured hashes independently of producer code.
        # A digest is classified only after every changed dependency is already
        # explained. A changed number, witness, flag, claim or assumption blocks it.
        for key in ("computationSha256", "certificateSHA256", "independentCoefficientDataSHA256"):
            leaf = path + (key,)
            if leaf not in changes or not isinstance(a.get(key), str) or not HASH.fullmatch(a[key]) or not HASH.fullmatch(b[key]):
                continue
            if key == "independentCoefficientDataSHA256":
                if "independentCoefficientData" not in a:
                    continue
                left, right = a["independentCoefficientData"], b["independentCoefficientData"]
                dependency_root = path + ("independentCoefficientData",)
                rule = "SHA256(canonical independentCoefficientData)"
            else:
                left = {k: v for k, v in a.items() if k != key}
                right = {k: v for k, v in b.items() if k != key}
                dependency_root = path
                rule = "SHA256(canonical complete containing object with only its own digest field omitted)"
            encodings = [ascii_only for ascii_only in (False, True)
                         if digest(left, ascii_only) == a[key] and digest(right, ascii_only) == b[key]]
            if not encodings:
                errors.append({"path": pointer(leaf), "reason": "The declared derived digest does not recompute over its complete stated referent."})
                continue
            dependencies = {p for p in changes if p != leaf and is_child(p, dependency_root)}
            candidates.append((leaf, dependencies, rule, encodings[0]))

    while True:
        count = len(resolved)
        for path, value in changes.items():
            if path in resolved or value["kind"] != "VALUE_CHANGE":
                continue
            a, b = value["local"], value["public"]
            if isinstance(a, str) and isinstance(b, str) and (a, b) in mappings:
                resolved[path] = {"kind": "VERIFIED_DIGEST_REFERENCE", "referent": mappings[(a, b)]}
        for path, deps, rule, ascii_only in candidates:
            if path not in resolved and all(p in resolved for p in deps):
                resolved[path] = {
                    "kind": "INDEPENDENTLY_RECOMPUTED_DERIVED_HASH",
                    "rule": rule, "ensureAscii": ascii_only,
                    "changedDependencies": [pointer(p) for p in sorted(deps, key=pointer)],
                }
                v = changes[path]
                mappings[(v["local"], v["public"])] = {"path": pointer(path), "kind": "RECOMPUTED_COMPLETE_REFERENT"}
        if len(resolved) == count:
            break
    unresolved = [pointer(p) for p in changes if p not in resolved]
    return {
        "status": ("EXACT_RESULT_EQUAL" if not changes and not errors else
                   "EXACT_MATHEMATICAL_VALUES_AND_CERTIFICATE_MEANING_WITH_BUILD_PROVENANCE_DIFF"
                   if not unresolved and not errors else "UNEXPLAINED_DIFFERENCE_REQUIRES_REVIEW"),
        "resultLeafDifferenceCount": len(changes),
        "allChangesIndividuallyExplained": not unresolved and not errors,
        "unresolvedPaths": unresolved, "errors": errors,
        "differences": [{"path": pointer(p), **value, "classification": resolved.get(p)}
                        for p, value in sorted(changes.items(), key=lambda x: pointer(x[0]))],
    }


def valid_envelope(record):
    body = {k: v for k, v in record.items() if k != "recordSHA256"}
    assert record["schema"] == "MathScope.M3.P7Execution/1"
    assert digest(body) == record["recordSHA256"], "Invalid complete record digest"
    assert digest(record["request"]) == record["inputSHA256"], "Invalid input digest"
    assert digest({"request": record["request"], "result": record["result"]}) == record["mathematicalSHA256"], "Invalid complete mathematical digest"
    assert digest(record["environment"]) == record["environmentSHA256"], "Invalid environment digest"
    assert digest(record["sourceBinding"]) == EPOCH, "Different mathematical source epoch"
    e = record["execution"]
    assert e["status"] == "COMPLETED" and e["observedExitCode"] == 0
    assert e["timedOut"] is False and e["failure"] is None and e["stderr"] == ""
    assert e["maxSeconds"] == 90 and e["memoryLimitMiB"] == 384
    assert e["observedChildResourceLimits"] == {"addressSpaceBytes": [402653184, 402653184], "cpuSeconds": [90, 91]}
    assert e["observedChildEnvironmentSHA256"] == record["environmentSHA256"]
    for key in ("wholeP7Complete", "wholeM3Complete", "formalLeanProofIssued"):
        assert record[key] is False
    assert record["serializedAuthority"] == "UNTRUSTED_REQUIRES_REEXECUTION"


def public_file(row, field):
    info = row[field]
    assert info["statusCode"] == 200
    path = PUBLIC / info["file"]
    compressed = path.read_bytes()
    raw = gzip.decompress(compressed)
    assert sha(compressed) == info["gzipSHA256"] and len(compressed) == info["gzipBytes"]
    assert sha(raw) == info["rawSHA256"] and len(raw) == info["rawBytes"]
    return json.loads(raw), {"path": str(path.relative_to(M3)), "gzipSHA256": sha(compressed), "rawSHA256": sha(raw)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, help="New JSON basename under this review directory")
    args = parser.parse_args()
    assert Path(args.output).name == args.output and args.output.endswith(".json")
    output = HERE / args.output
    assert not output.exists(), "Keep earlier review snapshots immutable"
    manifest_bytes = (LOCAL / "manifest.json").read_bytes()
    assert sha(manifest_bytes) == MANIFEST_SHA
    manifest = json.loads(manifest_bytes)
    local_rows = {row["id"]: row for row in manifest["runs"]}
    receipt_bytes = (PUBLIC / "receipt.json").read_bytes()
    receipt = json.loads(receipt_bytes)
    assert receipt["expectedSourceEpochSHA256"] == EPOCH
    assert receipt["deploymentCommit"] == "3eb8427c6031dddded7d6d1b6527221cdb292017"
    rows = []
    for row in receipt["runs"]:
        item = {"id": row["id"], "kind": row["kind"]}
        try:
            local_info = local_rows[row["id"]]["artifact"]
            compressed = (LOCAL / local_info["path"]).read_bytes()
            assert sha(compressed) == local_info["sha256"] and len(compressed) == local_info["bytes"]
            local_record = json.loads(gzip.decompress(compressed))
            public_record, run_info = public_file(row, "runHTTP")
            replay, replay_info = public_file(row, "replayHTTP")
            fresh = replay["fresh"]
            for record in (local_record, public_record, fresh):
                valid_envelope(record)
            assert public_record["request"] == local_record["request"] == fresh["request"]
            assert public_record["sourceBinding"] == local_record["sourceBinding"] == fresh["sourceBinding"]
            assert public_record["predecessor"] == local_record["predecessor"] == fresh["predecessor"]
            assert replay["schema"] == "MathScope.M3.P7Replay/1" and replay["status"] == "MATCH"
            assert replay["importedProofStatusAdopted"] is False
            assert replay["previousRecordSHA256"] == public_record["recordSHA256"]
            assert public_record["recordSHA256"] != fresh["recordSHA256"]
            assert public_record["result"] == fresh["result"]
            assert public_record["mathematicalSHA256"] == fresh["mathematicalSHA256"]
            assert public_record["environment"] == fresh["environment"]
            item.update({
                "localArtifact": local_info, "publicOriginal": run_info, "publicFreshReplay": replay_info,
                "localMathematicalSHA256": local_record["mathematicalSHA256"],
                "publicMathematicalSHA256": public_record["mathematicalSHA256"],
                "publicFreshMathematicalSHA256": fresh["mathematicalSHA256"],
                "sameWholeResultDigestAcrossEnvironments": local_record["mathematicalSHA256"] == public_record["mathematicalSHA256"],
                "publicFreshReplayExactlyMatches": True,
                "sourceInputPredecessorAndObservedLimitsVerified": True,
                "comparison": classify(local_record, public_record),
            })
        except (AssertionError, KeyError, TypeError, ValueError, OSError) as error:
            item["comparison"] = {"status": "INVALID_OR_INCOMPLETE_RECORDED_EVIDENCE", "error": str(error)}
        rows.append(item)
    statuses = [row["comparison"]["status"] for row in rows]
    unresolved = [row["id"] for row in rows if row["comparison"]["status"] not in {
        "EXACT_RESULT_EQUAL", "EXACT_MATHEMATICAL_VALUES_AND_CERTIFICATE_MEANING_WITH_BUILD_PROVENANCE_DIFF"}]
    complete = len(rows) == len(local_rows) == 25 and {row["id"] for row in rows} == set(local_rows)
    report = {
        "schema": "MathScope.M3.PublicP7SemanticReview/1",
        "reviewedAtUTC": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": ("REQUIRES_REVIEW" if unresolved else "PASS" if complete and receipt["status"] != "IN_PROGRESS" else "PARTIAL_CAPTURE_VERIFIED"),
        "captureStatusAtReview": receipt["status"], "captureReceiptSHA256": sha(receipt_bytes),
        "captureReceipt": str((PUBLIC / "receipt.json").relative_to(M3)),
        "deploymentCommit": receipt["deploymentCommit"], "sourceEpochSHA256": EPOCH,
        "localManifestSHA256": MANIFEST_SHA, "analysisSourceSHA256": sha(Path(__file__).read_bytes()),
        "complete25CaseCoverage": complete, "reviewedCases": len(rows),
        "exactWholeResultMatches": statuses.count("EXACT_RESULT_EQUAL"),
        "buildProvenanceOnlyExplainedCases": statuses.count("EXACT_MATHEMATICAL_VALUES_AND_CERTIFICATE_MEANING_WITH_BUILD_PROVENANCE_DIFF"),
        "unresolvedCaseIds": unresolved, "rows": rows,
        "method": [
            "Read immutable captured JSON and gzip only; no HTTP, GP, P7 producer or CLI was executed.",
            "Recompute complete record/input/environment/mathematical hashes; compare all 25-source epochs, input, predecessor, and actual 90s/384MiB child limits.",
            "Compare every mathematical result leaf, including exact fractions/balls, witnesses, claims, statuses, assumptions and completeness ledgers.",
            "Allow only the four explicitly named PARI build metadata leaves when they equal each record's observed arithmetic environment and fixed version/source/trust fields are identical.",
            "Independently recompute complete structured digest referents, then resolve every changed digest reference through an acyclic explanation from the observed build metadata.",
            "A numerical, witness, status, domain, assumption or unexplained leaf difference remains unresolved; hashes are never generically ignored.",
            "Each production record has a separate recorded production fresh replay with exact result/hash/environment agreement; no cross-environment replay was performed.",
        ],
        "limits": [
            "This reviews already captured execution evidence and exact data equivalence; it is not another backend run or a Lean proof.",
            "No compiler binary or build-sidecar file was independently downloaded in this review; their identities are the runtime's source-bound observations.",
            "Full result SHA values remain different where build metadata is embedded. This review does not rewrite or relabel those hashes as equal.",
        ],
        "newMathematicalExecutionPerformed": False, "HTTPRequestsPerformed": False,
        "originalRecordsModified": False, "universalRHProved": False, "universalBSDProved": False,
        "wholeM3Complete": False,
    }
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"path": str(output), "sha256": sha(output.read_bytes()),
                      **{key: report[key] for key in ("status", "reviewedCases", "exactWholeResultMatches", "buildProvenanceOnlyExplainedCases", "unresolvedCaseIds")}}, ensure_ascii=False))


if __name__ == "__main__":
    main()
