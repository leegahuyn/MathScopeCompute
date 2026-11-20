"""Authenticate the failed full-source workflow's original predecessor and cause."""

from argparse import ArgumentParser
from datetime import datetime
from hashlib import sha256
import gzip
import json
from pathlib import Path
import re
import subprocess


RUN=44668251828
HEAD="1fddc8f30728d1590c6ff6c5c76d7072c65c6015"
OLD_HEAD="059df9db3a188ce18f3c43a0dca3a92f2e02a4b2"
PROOF="tools/mathscope-cd-axial-bridge-20261029/goal-next/"
RUNNER=PROOF+"primary-forced-weights/live-c5/run_live_primary_c5.mjs"
EMITTER=PROOF+"primary-forced-join/active-n3-c5-binding/repeat-candidate-preflight/emit_active_n3_repeat_candidate.mjs"
ANCHOR=PROOF+"primary-forced-join/active-n3-c5-binding/run_anchored_repeat_candidate.mjs"
WORKFLOW=".github/workflows/mathscope-active-n3-first-cycle.yml"
BUILDER=".github/workflows/mathscope-original-primary-c5.yml"
SOURCE="first-correction-spatial-source"
MANIFEST="original-source-export-manifest.json"
REGISTRY="original-source-functions.json"
STREAM="original-source-nodes.jsonl.gz"
PINS={
    "oldManifest":"8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a",
    "failedManifest":"a125e21a7eba91085e13768d987be77a6a5cfc15c402cf789b6b535eae530ac3",
    "registry":"e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03",
    "nodes":"faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96",
    "terminal":"8654916b24cb095a0aa9a49cad2a6549e0561c8e65a84a67308a19f594aecc35",
    "failedRunnerLog":"4fc1ad3ee82859d86779c2bd9b56aad61da463dde1e21e386a4c65d64558eb08",
    "nativeLog":"88af0b851349e349990eea39b91a04378b53145d7ba787245a5d291b61bb49b4",
    "failure":"51d2ffca4de289a377ff2bf7e5ea3ee73d76d4ba4160de343fb439e0a7c219c1",
}


def pin(path,key):
    body=path.read_bytes()
    assert sha256(body).hexdigest()==PINS[key],path
    return body


def probe_bytes(path):
    h=sha256()
    with path.open("rb") as f:
        while block:=f.read(8*1024*1024):
            h.update(block)
    return h.hexdigest()


def verify_graph(old,current):
    p=json.loads(pin(old/MANIFEST,"oldManifest"))
    q=json.loads(pin(current/MANIFEST,"failedManifest"))
    assert p.keys()==q.keys() and [key for key in q if p[key]!=q[key]]==["executing_commit"]
    assert p["executing_commit"]==OLD_HEAD and q["executing_commit"]==HEAD
    assert q["node_count"]==22155584 and q["node_stream_sha256"]==PINS["nodes"]
    assert q["definitions_sha256"]==PINS["registry"]
    assert q["extended_coupled_function_counts"]==[1355,29,2,20,0]
    assert q["extended_coupled_registry_included"] is True
    assert pin(old/REGISTRY,"registry")==pin(current/REGISTRY,"registry")
    count=0
    size=0
    h=sha256()
    with gzip.open(old/STREAM,"rb") as a,gzip.open(current/STREAM,"rb") as b:
        while block:=a.read(8*1024*1024):
            assert block==b.read(len(block))
            h.update(block)
            size+=len(block)
            count+=block.count(b"\n")
        assert not b.read(1)
    assert count==q["node_count"]+1 and size==q["node_stream_uncompressed_bytes"]==1024352367
    assert h.hexdigest()==q["node_stream_sha256"]
    return {"nodes":q["node_count"],"matchedUncompressedBytes":size,"nodeStreamSHA256":h.hexdigest(),
            "registrySHA256":PINS["registry"],"protectedRegistryCounts":q["extended_coupled_function_counts"],
            "onlyManifestFieldDifference":"executing_commit",
            "oldGzipSHA256":probe_bytes(old/STREAM),"failedRunGzipSHA256":probe_bytes(current/STREAM)}


def committed(repo,path):
    return subprocess.run(["git","-c",f"safe.directory={repo.resolve().as_posix()}","-C",str(repo),
                           "show",f"{HEAD}:{path}"],check=True,capture_output=True).stdout


def verify_failure(work,h,repo):
    terminal=json.loads(pin(work/f"terminal-{RUN}.json","terminal"))
    assert terminal["headSha"]==HEAD and terminal["databaseId"]==RUN
    assert terminal["event"]=="workflow_dispatch" and terminal["status"]=="completed" and terminal["conclusion"]=="failure"
    job,=terminal["jobs"]
    steps={row["number"]:row for row in job["steps"]}
    assert steps[8]["conclusion"]=="failure" and steps[9]["conclusion"]=="skipped"
    assert steps[10]["name"]=="Run actions/upload-artifact@v4" and steps[10]["conclusion"]=="success"
    workflow=committed(repo,WORKFLOW)
    builder=committed(repo,BUILDER)
    assert b"repeat_mode" in workflow and b"full-source" in workflow
    assert b"uses: ./.github/workflows/mathscope-original-primary-c5.yml" in workflow
    assert b'cp "$live/run_live_primary_c5.mjs" "$runner"' in builder
    runner=committed(repo,RUNNER)
    assert b"const limits = {rssBytes: 12 * 1024 ** 3, durationMinutes: 120," in runner
    assert b"stats.elapsedMs > limits.durationMinutes * 60_000" in runner
    assert b"code: stats.rssBytes > limits.rssBytes ? 'SOURCE_RSS_LIMIT' : 'SOURCE_TIME_LIMIT'" in runner
    check_call=runner.decode().splitlines()[73]
    assert "throw Object.assign" in check_call
    emitter=committed(repo,EMITTER)
    line67=emitter.decode().splitlines()[66].strip()
    assert line67=="context.checkCancelled?.();" and b"const result = constructPostFiveRepeatInverses(pde," in emitter
    assert emitter.index(b"const definitions = G.captureFunctionDefinitions();")<emitter.index(b"const result = constructPostFiveRepeatInverses(pde,")
    anchor=committed(repo,ANCHOR)
    assert b"process.env.GITHUB_EVENT_PATH" in anchor and b".inputs?.repeat_mode" in anchor
    assert b"mode:'metadata'" in anchor and b"mode === 'full-source'" in anchor
    assert b"active-n3-repeat-forced-source" in anchor and b"active-n3-repeat-forced-export.json" in anchor
    native=pin(h/"native-run.log","nativeLog")
    log=pin(work/f"failed-{RUN}.log","failedRunnerLog")
    assert b"repeat_mode: full-source" in log
    failure=json.loads(pin(h/"active-n3-repeat-forced-failure.json","failure"))
    assert failure["schema"]=="MathScope.N8.SameLiveRepeatCandidateFailure/1" and failure["code"]=="SOURCE_TIME_LIMIT"
    assert failure["sameRunFirstCycleVerified"] is True and failure["completeSecondCorrection"]=="OPEN"
    assert failure["finalJets"]==0 and failure["release"]=="HOLD"
    assert all(k in native and k in log for k in (
        b"SOURCE_TIME_LIMIT",b"run_live_primary_c5.mjs:74:27",b"emit_active_n3_repeat_candidate.mjs:67:27",
        b"original-post-five-physical-residual",b'"directResidualMonomials": [953, 1053, 3134]',
    ))
    assert b"SOURCE_RSS_LIMIT" not in native
    assert b'"stage":"post-five-repeat-supported-source-candidate"' not in native
    assert b'"stage":"post-five-repeat-inverse-candidate"' not in native
    assert not any((h/name).exists() for name in (
        "active-n3-repeat-forced-candidate.json","active-n3-repeat-forced-export.json","active-n3-repeat-forced-source",
    ))
    p5=json.loads((h/"primary-c5-native.json").read_bytes())
    assert p5["executingCommit"]==HEAD and p5["status"]=="VERIFIED_ORIGINAL_NATIVE_N3_PRIMARY_C5_CLASS"
    assert p5["limits"]=={"rssBytes":12884901888,"durationMinutes":120,"familyNodes":25000000,"bandNodes":25000000}
    stopped=re.search(rb"(2026-11-20T[0-9:.]+Z) Error: Original Primary C5 exceeded the owned RSS or time limit.",log)
    assert stopped
    stamp=stopped[1].decode()
    entered=datetime.fromisoformat(steps[8]["startedAt"])
    logged=datetime.fromisoformat(stamp)
    seconds=(logged-entered).total_seconds()
    assert seconds>120*60
    return {"githubRun":RUN,"executingCommit":HEAD,"builderJob":job["databaseId"],
            "builderEntry":steps[8]["startedAt"],"recordedErrorAt":stamp,"approximateBuilderSecondsBeforeError":int(seconds),
            "configuredOwnedMinutes":p5["limits"]["durationMinutes"],"configuredOwnedRssBytes":p5["limits"]["rssBytes"],
            "cause":"SOURCE_TIME_LIMIT by the original owned predicate, which emits a different code when the measured RSS exceeds its limit.",
            "stage":"At the original entry cancellation check, before invoking constructPostFiveRepeatInverses.",
            "exactMeasuredRssAtStop":"Not recorded in the returned receipt.",
            "nativePrefixExportPresent":True,"activeRepeatAppendPresent":False,"independentBuilderReadbackStep":"skipped",
            "diagnosticArtifactUploadStep":"success",
            "dispatchRequestedFullSource":True,
            "expectedFullSourceArtifactLayout":"Anchored adapter writes metadata-mode candidate plus an independent full-source export and its graph/registry. Only the diagnostic and original protected prefix were uploaded here.",
            "sourceBytesSHA256":{k:sha256(v).hexdigest() for k,v in
                                 (("workflow",workflow),("builder",builder),("runner",runner),("emitter",emitter),("anchor",anchor))}}


def main():
    cli=ArgumentParser(description=__doc__)
    for name in ("work","repo","out"):
        cli.add_argument("--"+name,type=Path,required=True)
    args=cli.parse_args()
    c118=args.work/"continuation118"
    h=c118/f"hosted-{RUN}"
    result={
        "schema":"MathScope.C121.FailedOriginalActiveRepeatCaptureReadback/1",
        "status":"VERIFIED_FAILED_CAPTURE_PREDECESSOR_BYTE_IDENTICAL_REPEAT_OPEN","pins":PINS,
        "failure":verify_failure(c118,h,args.repo),
        "protectedOriginalGraph":verify_graph(args.work/"continuation70/hosted-44582875351"/SOURCE,h/SOURCE),
        "sameRunningActiveAppend":"OPEN","secondStageComplete":"OPEN","finalJets":0,"release":"HOLD",
    }
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print(result["status"],result["protectedOriginalGraph"]["nodes"],result["failure"]["approximateBuilderSecondsBeforeError"])


if __name__=="__main__":
    assert __debug__
    main()
