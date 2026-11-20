"""Authenticate the first full-repeat attempt's completed and missing source boundaries."""
from argparse import ArgumentParser
from gzip import open as gzip_open
from hashlib import file_digest, sha256
import json
from pathlib import Path


FAILED=44668251828
RETRY=44682703381
FAILED_HEAD="1fddc8f30728d1590c6ff6c5c76d7072c65c6015"
RETRY_HEAD="287ca9eeaf2ab61f8405949c40e490af915cc1b0"
STREAM="original-source-nodes.jsonl.gz"
REGISTRY="original-source-functions.json"
MANIFEST="original-source-export-manifest.json"
CANONICAL_STREAM="faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
CANONICAL_REGISTRY="e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03"
CANONICAL_DIRECT="51057fc92e13cd7fc9a875e71c2926c6769cc3536ee1a13f2bea7ddd630cd94a"
CANONICAL_REFERENCE="74a686bc95f4c094f1de834062b8b402aa5b861940fa3e109aa0f1913d52d529"


def read_json(path):
    return json.loads(path.read_bytes())


def digest(path):
    with path.open("rb") as source:
        return file_digest(source,"sha256").hexdigest()


def raw_graph(path):
    sha=sha256()
    records=size=0
    with gzip_open(path,"rb") as native:
        while block:=native.read(8*1024**2):
            sha.update(block)
            records+=block.count(b"\n")
            size+=len(block)
    return sha.hexdigest(),records,size


def main(a):
    failed=read_json(a.failed_run)
    retry=read_json(a.retry_run)
    assert (failed["databaseId"],failed["headSha"],failed["status"],failed["conclusion"])==(FAILED,FAILED_HEAD,"completed","failure")
    assert (retry["databaseId"],retry["headSha"],retry["event"])==(RETRY,RETRY_HEAD,"workflow_dispatch")
    steps=failed["jobs"][0]["steps"]
    failed_step=[s for s in steps if s["conclusion"]=="failure"]
    assert len(failed_step)==1 and failed_step[0]["name"].startswith("Build the same-family original")
    assert any(s["name"]=="Run actions/upload-artifact@v4" and s["conclusion"]=="success" for s in steps)
    failure=read_json(a.artifact/"active-n3-repeat-forced-failure.json")
    assert failure["code"]=="SOURCE_TIME_LIMIT" and failure["sameRunFirstCycleVerified"]
    assert failure["completeSecondCorrection"]=="OPEN"
    assert not (a.artifact/"active-n3-repeat-forced-source").exists()
    assert not (a.artifact/"active-n3-repeat-forced-candidate.json").exists()
    first=read_json(a.artifact/"first-cycle.json")
    assert first["status"]=="VERIFIED_FIRST_CYCLE_SOURCE_CONSTRUCTION"
    assert first["split"]["nodeCount"]==22153782
    attempt=read_json(a.artifact/"primary-c5-native.json")
    assert attempt["limits"]=={"rssBytes":12884901888,"durationMinutes":120,
                                "familyNodes":25000000,"bandNodes":25000000}
    manifest=read_json(a.artifact/"first-correction-spatial-source"/MANIFEST)
    assert manifest["executing_commit"]==FAILED_HEAD
    assert manifest["node_count"]==22155584
    assert manifest["node_stream_sha256"]==CANONICAL_STREAM
    assert manifest["definitions_sha256"]==CANONICAL_REGISTRY
    registry=a.artifact/"first-correction-spatial-source"/REGISTRY
    assert digest(registry)==CANONICAL_REGISTRY

    raw=a.artifact/"first-correction-spatial-source"/STREAM
    exact,lines,actual_size=raw_graph(raw)
    assert exact==CANONICAL_STREAM
    assert lines==22155585 and actual_size==manifest["node_stream_uncompressed_bytes"]
    live=read_json(a.artifact/"independent-direct-split.json")
    assert live["status"]=="VERIFIED_ACTUAL_DIRECT_SPLIT_RATIONAL_IDENTITIES"
    assert not live["actualConservativeResidualProvedZero"]
    assert (live["zeroPolynomials"],live["directResidualMonomials"])==(4,[953,1053,3134])
    assert live["closureSHA256"]==CANONICAL_DIRECT
    closure_manifest=read_json(a.artifact/"direct-split-arithmetic-manifest.json")
    assert closure_manifest["currentReceipt"]==first
    assert closure_manifest["ignoredVolatileReceiptFields"]==["stages[].rssBytes"]
    assert live["firstCycleReceiptSHA256"]==closure_manifest["firstCycleReceiptSHA256"]==CANONICAL_REFERENCE
    assert digest(a.artifact/"direct-split-arithmetic-closure.json")==CANONICAL_DIRECT
    full=a.failed_log.read_text(encoding="utf-8-sig")
    for fragment in ("code: 'SOURCE_TIME_LIMIT'","emitActiveN3RepeatCandidate","Artifact ID 14605361045"):
        assert fragment in full,fragment
    return {
        "schema":"MathScope.C121.FullRepeatSourceRunRecovery/1","failedRun":FAILED,"retryRun":RETRY,
        "failedHead":FAILED_HEAD,"retryHead":RETRY_HEAD,"failureClassification":"SOURCE_TIME_LIMIT",
        "activeAppendedRecordsEmitted":0,
        "verifiedProtectedSpatialRecords":manifest["node_count"],
        "protectedRawSHA256":exact,"protectedRegistrySHA256":CANONICAL_REGISTRY,
        "originalPressureRoot":22153227,
        "independentlyReproducedDirectSplitZeroPolynomials":4,
        "actualDirectResidualMonomials":[953,1053,3134],
        "priorOwnedLimits":{"minutes":120,"rssGiB":12,"nodes":25000000},
        "retryOwnedLimits":{"minutes":175,"jobMinutes":195,"rssGiB":12,"nodes":25000000},
        "retryExport":"Build the same predecessor operands and serialize those records once in the full extended source stream.",
        "linkToPartialArtifact":"https://github.com/leegahuyn/MathScopeCompute/actions/runs/44668251828/artifacts/14605361045",
        "activeFullAppend":"OPEN","completeSecondCorrection":"OPEN","finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for flag in ("artifact","failed-run","retry-run","failed-log","out"):
        p.add_argument("--"+flag,type=Path,required=True)
    a=p.parse_args()
    result=main(a)
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS protected spatial prefix readback and owned SOURCE_TIME_LIMIT",result["verifiedProtectedSpatialRecords"])
