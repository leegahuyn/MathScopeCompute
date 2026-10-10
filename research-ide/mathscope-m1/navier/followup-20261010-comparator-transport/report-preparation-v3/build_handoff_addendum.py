#!/usr/bin/env python3
"""Prepare a dated appendix without conflating a failed run and a later gate run.

Validation is the default. --finalize needs an actual subsequent protected run,
its final API observation, archive, independent audit and reviewed final input.
An N1-06 PASS also needs a new unchanged-criteria assessment. No PDF is generated
while any required final fact is missing. The original 15 pages stay unchanged.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sys
from xml.sax.saxutils import escape
import zipfile
from zoneinfo import ZoneInfo

sys.dont_write_bytecode = True
BASE_SHA = "cad9a136c0f4986f16f7f2347e5fc45441f230687e6f544a89e19354ea332888"
ASSESSMENT_SHA = "e57681b7bb751967b406ad440942728ecfd8fe47eb9672129ff19c8a7eb6634c"
HISTORICAL_SHA = "913faa68844dc0f8108ea6b3e0a2144dfcd6e2d2213c4861954f67e99ab476a9"
CRITERIA_SHA = "854f67efad0f6d0cda7ab784611e5352b753ddd297fbac5a1382f4032ba02dc2"
NS_GATES_SHA = "57e993971939ef47ad5d81506e3e568ff256c4621bc5ade091c6e089ba895080"
OLD_RUN, OLD_JOB, OLD_ARTIFACT = 37979127351, 113984853927, 11654200401
OLD_ZIP_SHA = "1af31713f8f021605af509bab4634fed7ab041636f6f1670be2bd3e3c61788d2"
OLD_PRESERVATION_SHA = "4feddf1cbbda6b42b56123783fb73432d6d191227d3e498ed6a213f6ff6c0166"
PUBLICATION3_COMMIT = "c61d35806bb3579131eb7ff8c55187ae26209ade"
PUBLICATION3_TREE = "dec1b5e96dc7a6c02ac5139dd9d7eee5e453dd98"
PUBLICATION3_ZIP = "94bb85e441a322cd57102b5fc2bfb159d53f82b37c35de119f79a97d9f4447c8"
AUDIT_SCHEMA = "MathScope.OriginalProtectedComparatorPortableAudit/1"
TERMINAL_AUDIT_SCHEMA = "MathScope.OriginalProtectedComparatorTerminalAudit/1"
TERMINAL_VERIFIER_SHA = "81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef"
HISTORICAL_TRUST_SHA = "48341732c4eac4a991ed5b65b786beedc9f1d7098a97698ce99c89dead22a273"
HISTORICAL_TRUST_COMMIT = "8c4271aa5a35b1d34c30279fb306a099944e4823"
ACTUAL_RUN_BINDING_SHA = "5f728471bfac35a987f927fccb722452f60635f5a2707cb2b4cf1c8bc646bcab"
COUNTS69 = {"PASS": 69, "PARTIAL": 1, "BLOCKED": 0, "total": 70}
COUNTS70 = {"PASS": 70, "PARTIAL": 0, "BLOCKED": 0, "total": 70}
PINNED_INPUTS: dict[str, str] = {}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for block in iter(lambda: handle.read(2**20), b""):
            digest.update(block)
    return digest.hexdigest()


def bound_file(reference):
    require(isinstance(reference, dict), "A supplied file reference must be an object")
    require(set(reference) == {"path", "sha256"}, "File references have exactly path and sha256")
    path = Path(reference["path"])
    require(path.is_absolute(), "Input file paths must be absolute")
    require(re.fullmatch(r"[0-9a-f]{64}", reference["sha256"]) is not None, "A real SHA-256 is required")
    path = path.resolve()
    value = sha(path)
    require(value == reference["sha256"], "Input hash changed: " + str(path))
    if str(path) in PINNED_INPUTS:
        require(PINNED_INPUTS[str(path)] == value, "Conflicting input binding")
    PINNED_INPUTS[str(path)] = value
    return path


def bound_json(reference):
    return json.loads(bound_file(reference).read_text(encoding="utf-8"))


def parse_time(value):
    date = datetime.fromisoformat(value.replace("Z", "+00:00"))
    require(date.tzinfo is not None, "An observation timestamp must have a timezone")
    return date.astimezone(timezone.utc)


def display_time(value):
    date = parse_time(value)
    kst = date.astimezone(ZoneInfo("Asia/Seoul")).strftime("%Y-%m-%d %H:%M:%S KST")
    return kst + " (원시 UTC " + value + ")"


def validate_input_shape(data):
    """Validate the exact subset used by our bundled schema, with stdlib only.

    This is a scoped contract reader, not a general JSON Schema implementation.
    The full published JSON Schema is also provided for external validators.
    """
    schema_path = Path(__file__).with_name("input-schema.json")
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    PINNED_INPUTS[str(schema_path.resolve())] = sha(schema_path)

    def visit(rule, value, where):
        if "$ref" in rule:
            require(rule["$ref"].startswith("#/$defs/"), "Only bundled schema definitions are supported")
            visit(schema["$defs"][rule["$ref"].split("/")[-1]], value, where)
        if "anyOf" in rule:
            matched = False
            for candidate in rule["anyOf"]:
                try:
                    visit(candidate, value, where)
                    matched = True
                    break
                except (ValueError, TypeError, KeyError):
                    pass
            require(matched, "Schema alternatives do not match: " + where)
        for child in rule.get("allOf", []):
            visit(child, value, where)
        if "if" in rule:
            try:
                visit(rule["if"], value, where)
                matched = True
            except (ValueError, TypeError, KeyError):
                matched = False
            if matched and "then" in rule:
                visit(rule["then"], value, where)
        if "const" in rule:
            require(value == rule["const"] and (type(value) is type(rule["const"])), "Frozen contract value changed: " + where)
        if "enum" in rule:
            require(any(value == v and type(value) is type(v) for v in rule["enum"]), "Contract enum mismatch: " + where)
        kind = rule.get("type")
        types = {"object": dict, "array": list, "string": str, "integer": int, "boolean": bool, "null": type(None)}
        if kind is not None:
            require(kind in types and type(value) is types[kind], "Contract type mismatch: " + where)
        if isinstance(value, dict):
            require(all(k in value for k in rule.get("required", [])), "Required contract field missing: " + where)
            props = rule.get("properties", {})
            if rule.get("additionalProperties") is False:
                require(set(value) <= set(props), "Unknown contract field: " + where)
            for key, child in props.items():
                if key in value:
                    visit(child, value[key], where + "." + key)
        if isinstance(value, list):
            require(len(value) >= rule.get("minItems", 0), "Too few contract items: " + where)
            require(len(value) <= rule.get("maxItems", len(value)), "Too many contract items: " + where)
            if "items" in rule:
                for index, item in enumerate(value):
                    visit(rule["items"], item, where + f"[{index}]")
        if isinstance(value, str):
            require(len(value) >= rule.get("minLength", 0) and len(value) <= rule.get("maxLength", len(value)), "Contract string length mismatch: " + where)
            if "pattern" in rule:
                require(re.search(rule["pattern"], value) is not None, "Contract string pattern mismatch: " + where)
            if rule.get("format") == "date-time":
                parse_time(value)
        if type(value) is int and "minimum" in rule:
            require(value >= rule["minimum"], "Contract integer minimum mismatch: " + where)
    visit(schema, data, "input")


def structured_payloads(observation):
    """Read raw connector observations, including Promise.allSettled wrappers."""
    def visit(node):
        if isinstance(node, dict):
            if isinstance(node.get("structuredContent"), dict):
                yield node["structuredContent"]
            for key in ("results", "value"):
                if key in node:
                    yield from visit(node[key])
        elif isinstance(node, list):
            for child in node:
                yield from visit(child)
    yield from visit(observation)


def observed_job(observation, run_id, job_id):
    candidates = [j for block in structured_payloads(observation)
                  for j in block.get("jobs", []) if j.get("id") == job_id]
    require(bool(candidates), "Supplied job is absent from the actual observation")
    require(all(j == candidates[0] for j in candidates), "Conflicting job records in observation")
    require(candidates[0].get("run_id") == run_id, "Observed job belongs to a different run")
    return candidates[0]


def observed_artifact(observation, run_id, artifact_id):
    candidates = [a for block in structured_payloads(observation)
                  for a in block.get("artifacts", []) if a.get("id") == artifact_id]
    require(bool(candidates), "Supplied artifact is absent from the actual observation")
    require(all(a == candidates[0] for a in candidates), "Conflicting artifact records")
    require(candidates[0].get("workflow_run", {}).get("id") == run_id, "Artifact belongs to a different run")
    return candidates[0]


def positive_id(value):
    return type(value) is int and value > 0


def git_blob_sha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()


def relative_bound_file(parent, name, item):
    require(isinstance(name, str) and Path(name).name == name and name not in ("", ".", ".."), "A trusted input must be a single safe filename")
    path = bound_file({"path": str((parent / name).resolve()), "sha256": item["sha256"]})
    require(path.parent == parent.resolve(), "Trusted input escaped its bound directory")
    if "bytes" in item:
        require(type(item["bytes"]) is int and item["bytes"] == path.stat().st_size, "Trusted input byte count mismatch: " + name)
    if "gitBlobSHA1" in item:
        require(git_blob_sha(path.read_bytes()) == item["gitBlobSHA1"], "Trusted Git blob mismatch: " + name)
    return path


def validate_terminal_source_binding(gate, loaded):
    """Bind actual inputs now; no run result is inferred from this binding.

    The eight historical TRUST inputs deliberately retain the historical
    commit. The separate eight runtime files and observed run bind the new
    commit. Runtime archive bytes are checked only when a real archive exists.
    """
    if "auditVerifier" in loaded:
        require(gate["auditVerifier"]["sha256"] == TERMINAL_VERIFIER_SHA, "Unreviewed terminal auditor source hash")
    if "auditInputsManifest" in loaded:
        manifest = loaded["auditInputsManifest"]
        require(gate["auditInputsManifest"]["sha256"] == HISTORICAL_TRUST_SHA, "Historical TRUST manifest hash changed")
        require(manifest["schema"] == "MathScope.N106PortableAuditorInputs/1" and manifest["mathscopeCommit"] == HISTORICAL_TRUST_COMMIT and len(manifest["files"]) == 8, "Historical TRUST identity or eight-input inventory changed")
        parent = Path(gate["auditInputsManifest"]["path"]).resolve().parent
        for name, item in manifest["files"].items():
            relative_bound_file(parent, name, item)
    if "actualRunBinding" not in loaded:
        return None
    binding = loaded["actualRunBinding"]
    require(gate["actualRunBinding"]["sha256"] == ACTUAL_RUN_BINDING_SHA, "Actual run-binding hash differs from frozen terminal auditor")
    require(binding["schema"] == "MathScope.ActualProtectedComparatorRunBinding/1", "Unsupported actual runtime binding")
    require((binding["runId"], binding["jobId"], binding["mathscopeCommit"]) == (gate["runId"], gate["jobId"], gate["headCommit"]), "Actual run binding does not match gate run/job/commit")
    require(binding["originalAcceptanceSHA256"] == CRITERIA_SHA, "Runtime binding changed the original acceptance criteria")
    require(binding["workflowPath"] == ".github/workflows/ns-comparator-verification.yml" and binding["branch"] == "main", "Actual protected workflow identity changed")
    require(binding["actualRunStatusAtBinding"] == "in_progress" and binding["actualRunConclusionAtBinding"] is None and binding["N106CompletedAtBinding"] is False, "Initial running binding must not be relabelled as a final result")
    expected_names = {"run_protected.py", "protected_transport.py", "metadata_probe.py", "test_protected_transport.py", "ns-comparator-verification.yml", "source-original-run.py", "pins.json", "probe.py"}
    require(set(binding["files"]) == expected_names, "Actual runtime eight-file inventory changed")
    parent = Path(gate["actualRunBinding"]["path"]).resolve().parent
    runtime_files = {}
    for name, item in binding["files"].items():
        require(item["artifactName"] == name and re.fullmatch(r"[0-9a-f]{40}", item["gitBlobSHA1"]) is not None, "Runtime artifact name or Git blob is missing")
        runtime_files[name] = relative_bound_file(parent, name, item)
    initial_record = binding["initialObservation"]
    initial_path = relative_bound_file(parent, initial_record["path"], initial_record)
    initial_observation = json.loads(initial_path.read_text(encoding="utf-8"))
    initial_job = observed_job(initial_observation, gate["runId"], gate["jobId"])
    require(initial_job["status"] == binding["actualRunStatusAtBinding"] and initial_job["conclusion"] is binding["actualRunConclusionAtBinding"], "Initial actual job observation/binding mismatch")
    require(not any(block.get("artifacts", []) for block in structured_payloads(initial_observation)), "Initial no-artifact observation changed")
    metadata_record = binding["runMetadata"]
    metadata_path = relative_bound_file(parent, metadata_record["path"], metadata_record)
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    records = []
    for block in structured_payloads(metadata):
        raw = block.get("content")
        if isinstance(raw, str):
            try:
                record = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if isinstance(record, dict) and record.get("id") == gate["runId"] and "head_sha" in record:
                records.append(record)
    require(bool(records) and all(row == records[0] for row in records), "Actual run metadata is missing or conflicting")
    record = records[0]
    require(record["head_sha"] == gate["headCommit"] and record["head_branch"] == binding["branch"] and record["path"] == binding["workflowPath"], "Actual observed run source/workflow mismatch")
    require(record["status"] == "in_progress" and record["conclusion"] is None, "Initial run metadata was not a final result")
    require(parse_time(binding["boundUTC"]) >= parse_time(initial_observation["receivedUTC"]) and parse_time(binding["boundUTC"]) >= parse_time(metadata["receivedUTC"]), "Runtime binding predates its actual observations")
    return {"binding": binding, "runtimeFiles": runtime_files, "initialObservation": initial_observation, "initialJob": initial_job}


def require_terminal_pass_outcome(audit):
    """A terminal PASS cannot use the historical postcheck-only exception."""
    require(audit["actualJobStatus"] == "completed" and audit["actualJobConclusion"] == "success", "Terminal PASS requires actual completed/success GitHub job")
    require(audit["actualControllerStatus"] == "PASS" and type(audit["actualControllerExitCode"]) is int and audit["actualControllerExitCode"] == 0, "Terminal PASS requires actual controller PASS and integer exit 0")
    require(type(audit["actualProtectedComparatorExitCode"]) is int and audit["actualProtectedComparatorExitCode"] == 0, "Terminal PASS requires actual protected Comparator integer exit 0")
    require(audit.get("postcheckOnlyFailure") is False, "Terminal PASS cannot use a postcheck-only failure exception")


def validate_old_failure(data):
    old = data["oldFailedExecution"]
    require((old["runId"], old["jobId"], old["artifactId"]) == (OLD_RUN, OLD_JOB, OLD_ARTIFACT), "Old failed execution identity changed")
    require(old["role"] == "HISTORICAL_FAILED_RUN_ONLY", "Old run must remain historical")
    preservation = bound_json(old["preservationReceipt"])
    require(old["preservationReceipt"]["sha256"] == OLD_PRESERVATION_SHA, "Old preservation receipt changed")
    require(preservation["status"] == "PRESERVATION_PASS" and preservation["N106Completed"] is False, "Preservation is not a gate PASS")
    observation = bound_json(old["finalObservation"])
    job = observed_job(observation, OLD_RUN, OLD_JOB)
    artifact = observed_artifact(observation, OLD_RUN, OLD_ARTIFACT)
    audit = bound_json(old["independentAudit"])
    received = bound_json(old["receivedReceipt"])
    archive = bound_file(old["artifactZIP"])
    require(job["status"] == "completed" and job["conclusion"] == "cancelled", "Actual old cancellation must remain literal")
    require(audit["schema"] == AUDIT_SCHEMA and audit["N106Completed"] is False, "Old run cannot prove N1-06")
    require(audit["status"] == "FAIL_OR_INCOMPLETE" and (audit["passed"], audit["total"]) == (138, 163), "Old incomplete audit changed")
    require(audit["githubObservationSHA256"] == old["finalObservation"]["sha256"], "Old observation/audit binding changed")
    require(audit["actualProtectedComparatorExitCode"] is None, "Old protected command never recorded an exit")
    require(received["actualComparatorStagePresent"] is False and received["afterSourceHashesPresent"] is False, "Old missing execution/preservation scope changed")
    require(sha(archive) == OLD_ZIP_SHA == audit["archiveSHA256"] and archive.stat().st_size == 135397, "Old original artifact changed")
    require(artifact["digest"] == "sha256:" + OLD_ZIP_SHA and artifact["size_in_bytes"] == 135397, "Old archive/API identity mismatch")
    require(preservation["finalObservationSHA256"] == old["finalObservation"]["sha256"], "Old preservation observation mismatch")
    return {"job": job, "audit": audit, "received": received, "preservation": preservation, "observation": observation}


def validate_publication(publication, *, frozen3):
    main = bound_json(publication["mainPublicationReceipt"])
    download = bound_json(publication["downloadVerification"])
    ci = bound_json(publication["publishedCI"])
    downloaded = bound_file(publication["downloadedZIP"])
    require(main["publishedMain"] == publication["mainCommit"] and main["tree"] == publication["tree"], "Publication commit/tree mismatch")
    require(main["releaseTag"] == publication["tag"], "Main publication tag mismatch")
    require(download["schema"] == "MathScope.PublishedReleaseDownloadVerification/1", "Unsupported public-download receipt")
    require(download["releaseId"] == publication["releaseId"] and download["assetId"] == publication["assetId"], "Publication release/asset ID mismatch")
    require(download["commit"] == publication["mainCommit"] and download["releaseTag"] == publication["tag"], "Download commit/tag mismatch")
    require(download["publicDownloadURL"] == publication["downloadURL"], "Public download URL mismatch")
    require(download["downloadMatchesLocallyVerifiedPackage"] is True, "No actual local/public package comparison")
    require(download["downloadedSha256"] == download["expectedSha256"] == main["localZIPsha256"] == sha(downloaded), "Public package digest mismatch")
    require(download["downloadedBytes"] == download["expectedBytes"] == downloaded.stat().st_size, "Public package size mismatch")
    require(ci["schema"] == "MathScope.PublishedReleaseCIObservation/1" and ci["commit"] == publication["mainCommit"], "Publication CI commit/schema mismatch")
    require(ci["allThreeWorkflowsSuccessful"] is True and len(ci["observations"]) == 3, "Publication CI is not actually complete")
    for entry in ci["observations"]:
        require(bool(entry["jobs"]), "Empty workflow jobs are not success")
        require(all(j["run_id"] == entry["runId"] and j["status"] == "completed" and j["conclusion"] == "success" for j in entry["jobs"]), "A publication job is not successful")
    if frozen3:
        require(publication["mainPublicationReceipt"]["sha256"] == "ffc49ccf5d1ab44d4d587fc7bc83ac08693a7507fed217ba97856b3c4156bfa8", "Frozen .3 main receipt changed")
        require(publication["downloadVerification"]["sha256"] == "6333d017b716a10aeeda87b86df2984049f8afd4f71f5c1793bc0045967f83a6", "Frozen .3 download receipt changed")
        require(publication["publishedCI"]["sha256"] == "f98b804d42a84c36fdc039648baea93cadab497c09da5ac8938d4959203a2500", "Frozen .3 CI receipt changed")
        require(publication["mainCommit"] == PUBLICATION3_COMMIT and publication["tree"] == PUBLICATION3_TREE, "Frozen .3 commit/tree changed")
        require(publication["tag"] == "mathscope-research-en-2026.10.10.3" and publication["releaseId"] == 408456908 and publication["assetId"] == 626581803, "Frozen .3 release identity changed")
        require(sha(downloaded) == PUBLICATION3_ZIP and downloaded.stat().st_size == 114184222, "Frozen .3 public ZIP changed")
        require({x["runId"] for x in ci["observations"]} == {38009577252, 38009577186, 38009577173}, "Frozen .3 workflow IDs changed")
        require(publication["prerelease"] is True, "Frozen .3 release type changed")
        require(publication["releaseURL"] == "https://github.com/leegahuyn/MathScopeCompute/releases/tag/mathscope-research-en-2026.10.10.3", "Frozen .3 release URL changed")
        require(publication["localZIP"]["sha256"] == PUBLICATION3_ZIP, "Historical local ZIP hash changed")
        # Its old dist/ path can later hold .4. The .3 local/public equality was
        # already observed in the frozen receipt. Recheck the immutable public
        # download bytes here, without relabelling a public copy as a local copy.
    else:
        require(publication["tag"] != "mathscope-research-en-2026.10.10.3", "A follow-up publication cannot relabel .3")
        local = bound_file(publication["localZIP"])
        require(sha(local) == sha(downloaded) and local.stat().st_size == downloaded.stat().st_size, "Follow-up local/public ZIP mismatch")
        release_observation = bound_json(publication["releaseObservation"])
        def walk(node):
            if isinstance(node, dict):
                if node.get("id") == publication["releaseId"] and "tag_name" in node:
                    yield node
                for value in node.values():
                    yield from walk(value)
            elif isinstance(node, list):
                for value in node:
                    yield from walk(value)
        records = list(walk(release_observation))
        require(bool(records), "Actual follow-up release API record is missing")
        release = records[0]
        require(all(r == release for r in records), "Conflicting release observations")
        require(release["tag_name"] == publication["tag"] and release["target_commitish"] == publication["mainCommit"], "Actual release tag/target mismatch")
        require(release["html_url"] == publication["releaseURL"] and release["prerelease"] == publication["prerelease"], "Actual release URL/type mismatch")
        parse_time(release["published_at"])
        asset = next((a for a in release.get("assets", []) if a.get("id") == publication["assetId"]), None)
        require(asset is not None, "Actual published ZIP asset is absent")
        require(asset["size"] == downloaded.stat().st_size and asset["digest"] == "sha256:" + sha(downloaded) and asset["browser_download_url"] == publication["downloadURL"], "Actual release asset bytes/URL mismatch")
    return {"main": main, "download": download, "ci": ci}


def validate(data):
    PINNED_INPUTS.clear()
    validate_input_shape(data)
    require(data["schema"] == "MathScope.FinalHandoffAddendumInput/3", "Unsupported input schema")
    require(data["displayTimezone"] == "Asia/Seoul", "Reader-facing timezone must be KST")
    blockers = []
    base = bound_file(data["baseReport"])
    require(sha(base) == BASE_SHA, "The original 15-page PDF changed")
    qa = bound_json(data["baseVisualQA"])
    require(qa["pdfSHA256"] == BASE_SHA and qa["pages"] == 15 and qa["status"] == "PASS", "Frozen base visual QA mismatch")
    historical = bound_json(data["historicalAssessment68_2"])
    prior = bound_json(data["assessment69_1"])
    require(data["historicalAssessment68_2"]["sha256"] == HISTORICAL_SHA and historical["separateDatedDeltaCounts"]["PASS"] == 68, "Historical 68/2 assessment changed")
    require(data["assessment69_1"]["sha256"] == ASSESSMENT_SHA and prior["remainingGateIds"] == ["N1-06"] and prior["separateDatedDeltaCounts"] == COUNTS69, "Frozen 69/1 assessment changed")
    original = bound_json(data["originalCriteria"])
    require(data["originalCriteria"]["sha256"] == CRITERIA_SHA, "Original 70 criteria changed")
    bound_file(data["originalNsGates"])
    require(data["originalNsGates"]["sha256"] == NS_GATES_SHA, "Original NS gates changed")
    criteria = {row["id"]: row for row in original}
    require(len(criteria) == 70, "Original criterion count changed")
    for row in prior["gates"]:
        require(row["criterionText"] == criteria[row["id"]]["accept"] and row["criterionDetailText"] == criteria[row["id"]]["detail"], "Frozen assessment criterion text mismatch")
    old = validate_old_failure(data)
    publication3 = validate_publication(data["publication3Frozen"], frozen3=True)
    followup_publication = None
    if data.get("publicationFollowup") is not None:
        followup_publication = validate_publication(data["publicationFollowup"], frozen3=False)

    excluded_runs = {OLD_RUN}
    diagnostic_records = []
    for diagnostic in data["diagnosticHistory"]:
        require(diagnostic["role"] == "TRANSPORT_DIAGNOSTIC_ONLY", "Diagnostic scope is required")
        require(positive_id(diagnostic["runId"]) and positive_id(diagnostic["jobId"]), "Invalid actual diagnostic identity")
        observation = bound_json(diagnostic["observation"])
        job = observed_job(observation, diagnostic["runId"], diagnostic["jobId"])
        excluded_runs.add(diagnostic["runId"])
        diagnostic_records.append({"input": diagnostic, "observation": observation, "job": job})

    gate = data["gateExecution"]
    require(gate["role"] == "ORIGINAL_PROTECTED_COMPARATOR_GATE", "Gate execution must have the protected Comparator scope")
    terminal = gate["expectedAuditSchema"] == TERMINAL_AUDIT_SCHEMA
    for key in ("runId", "jobId", "artifactId"):
        if gate.get(key) is None:
            blockers.append("Actual subsequent protected " + key + " is missing")
        else:
            require(positive_id(gate[key]), "A run/job/artifact ID must be a positive integer")
    if gate.get("runId") is not None:
        require(gate["runId"] not in excluded_runs, "The historical failed run or a diagnostic run cannot be used as the subsequent N1-06 gate execution")
    if gate.get("headCommit") is None:
        blockers.append("Actual subsequent protected source commit is missing")
    else:
        require(re.fullmatch(r"[0-9a-f]{40}", gate["headCommit"]) is not None, "A real source commit is required")

    for key in ("actualJobStatus", "actualJobConclusion"):
        if gate[key] is None:
            blockers.append("Actual subsequent protected " + key + " is missing")
    required_refs = ["finalObservation", "independentAudit", "auditVerifier", "auditInputsManifest", "artifactZIP"]
    if terminal:
        required_refs.append("actualRunBinding")
    else:
        require(gate["actualRunBinding"] is None, "Historical portable branch must not relabel an actual terminal binding")
    loaded = {}
    for key in required_refs:
        if gate.get(key) is None:
            blockers.append("Actual subsequent protected " + key + " is missing")
        else:
            loaded[key] = bound_file(gate[key]) if key in ("auditVerifier", "artifactZIP") else bound_json(gate[key])
    terminal_binding = validate_terminal_source_binding(gate, loaded) if terminal else None
    observation, job, artifact, audit = loaded.get("finalObservation"), None, None, loaded.get("independentAudit")
    ids_ready = all(positive_id(gate.get(key)) for key in ("runId", "jobId", "artifactId"))
    if observation is not None and ids_ready:
        job = observed_job(observation, gate["runId"], gate["jobId"])
        artifact = observed_artifact(observation, gate["runId"], gate["artifactId"])
        require(artifact["workflow_run"]["head_sha"] == gate["headCommit"], "Actual gate artifact source commit mismatch")
        if gate["actualJobStatus"] is not None:
            require(gate["actualJobStatus"] == job["status"], "Supplied final status changes the actual GitHub job outcome")
        if gate["actualJobConclusion"] is not None:
            require(gate["actualJobConclusion"] == job["conclusion"], "Supplied final conclusion changes the actual GitHub job outcome")
        if job.get("status") != "completed" or job.get("conclusion") is None:
            blockers.append("The actual subsequent protected job has no final status/conclusion")
    if audit is not None:
        require(audit.get("schema") == gate["expectedAuditSchema"], "A diagnostic, historical or unrelated receipt is not the selected protected Comparator audit schema")
        if terminal:
            require(audit.get("postcheckOnlyFailure") is False, "Terminal audit cannot import the historical postcheck-only exception")
        require(type(audit.get("N106Completed")) is bool, "The actual N106Completed audit result is required")
        if ids_ready:
            require((audit["runId"], audit["jobId"], audit["artifactId"]) == (gate["runId"], gate["jobId"], gate["artifactId"]), "Actual gate audit identity mismatch")
        if observation is not None:
            require(audit["githubObservationSHA256"] == gate["finalObservation"]["sha256"], "Gate audit is not bound to the supplied final observation")
        if job is not None:
            require(audit["actualJobStatus"] == job["status"] and audit["actualJobConclusion"] == job["conclusion"], "Audit hides or changes actual GitHub outcome")
        if "auditVerifier" in loaded:
            require(audit["verifierSHA256"] == gate["auditVerifier"]["sha256"], "Auditor source hash mismatch")
        if "auditInputsManifest" in loaded:
            require(audit["portableInputManifestSHA256"] == gate["auditInputsManifest"]["sha256"], "Auditor input-manifest hash mismatch")
            if not terminal:
                require(loaded["auditInputsManifest"]["mathscopeCommit"] == gate["headCommit"], "Auditor inputs belong to a different source commit")
        if terminal and "actualRunBinding" in loaded:
            require(audit["actualRunBindingSHA256"] == gate["actualRunBinding"]["sha256"] == ACTUAL_RUN_BINDING_SHA, "Audit is not bound to the actual subsequent run/runtime sources")
        if "artifactZIP" in loaded:
            archive = loaded["artifactZIP"]
            require(audit["archiveSHA256"] == sha(archive) and audit["archiveBytes"] == archive.stat().st_size, "Gate audit/archive bytes mismatch")
            if artifact is not None:
                require(artifact["digest"] == "sha256:" + sha(archive) and artifact["size_in_bytes"] == archive.stat().st_size, "Gate archive/API digest or size mismatch")
            with zipfile.ZipFile(archive) as zipped:
                members = audit["members"]
                archive_names = [m.filename for m in zipped.infolist() if not terminal or not m.is_dir()]
                require(len(members) == len(archive_names) and len({m["name"] for m in members}) == len(members), "Gate archive/member inventory mismatch")
                require({m["name"] for m in members} == set(archive_names), "Gate audit member names mismatch")
                for member in members:
                    content = zipped.read(member["name"])
                    require(len(content) == member["bytes"] and hashlib.sha256(content).hexdigest() == member["sha256"], "Gate audit member digest mismatch")
                if terminal_binding is not None:
                    for name, runtime_path in terminal_binding["runtimeFiles"].items():
                        require(name in archive_names and zipped.read(name) == runtime_path.read_bytes(), "Actual runtime Git-blob source differs from artifact: " + name)
        require(all(type(x.get("pass")) is bool for x in audit["checks"]), "Audit checks need literal boolean results")
        require(audit["total"] == len(audit["checks"]) and audit["passed"] == sum(x["pass"] for x in audit["checks"]), "Audit check counts do not match its actual checks")

    audit_pass = bool(audit is not None and audit["N106Completed"] is True)
    gate_fully_bound = bool(ids_ready and gate.get("headCommit") is not None
                            and all(key in loaded for key in required_refs)
                            and job is not None and artifact is not None
                            and job.get("status") == "completed"
                            and job.get("conclusion") is not None
                            and gate["actualJobStatus"] == job.get("status")
                            and gate["actualJobConclusion"] == job.get("conclusion")
                            and (not terminal or terminal_binding is not None))
    if audit_pass:
        require(audit["status"] == "PASS" and audit["total"] > 0 and audit["passed"] == audit["total"] and all(x["pass"] is True for x in audit["checks"]), "N106Completed requires a complete independent PASS audit")
        require(audit["actualProtectedComparatorExitCode"] == 0, "No successful actual protected Comparator exit")
        require(audit["trackedFileCount"] == 2669, "Original source inventory count mismatch")
        require(set(audit["theoremAxioms"]) == {"NavierStokes.Comparator.navier_stokes_breakdown_R3", "NavierStokes.Comparator.navier_stokes_breakdown_periodic"}, "Actual submitted theorem audit is missing")
        require(all(set(values) <= {"propext", "Quot.sound", "Classical.choice"} for values in audit["theoremAxioms"].values()), "Submitted theorem axioms exceed the original allowed set")
        if terminal:
            require_terminal_pass_outcome(audit)
        else:
            # This historical schema retains its original narrowly accepted
            # postcheck exception. It is never shared with the terminal branch.
            require(audit["actualControllerStatus"] == "PASS" or audit.get("postcheckOnlyFailure") is True, "Controller failure lacks the existing auditor's narrow accepted explanation")
        if data.get("newAssessmentAfterComparator") is None:
            blockers.append("An independent PASS needs a new unchanged-criteria assessment before 70/0")
        if not gate_fully_bound:
            blockers.append("A PASS audit is not yet bound to the complete actual final execution evidence")

    current = prior
    new_assessment = None
    if data.get("newAssessmentAfterComparator") is not None:
        require(audit is not None, "A new assessment cannot replace missing actual Comparator audit")
        require(gate_fully_bound, "A new assessment cannot precede complete actual run/job/archive/auditor binding")
        new_assessment = bound_json(data["newAssessmentAfterComparator"])
        rows = {r["id"]: r for r in new_assessment["gates"]}
        prior_rows = {r["id"]: r for r in prior["gates"]}
        require(set(rows) == set(prior_rows) and len(rows) == 9, "A new assessment must preserve the same nine gates")
        for key, row in rows.items():
            require(row["criterionText"] == criteria[key]["accept"] and row["criterionDetailText"] == criteria[key]["detail"], "A new assessment changed an original criterion")
            wanted = "PASS" if key != "N1-06" or audit_pass else "PARTIAL"
            require(row["currentStatus"] == wanted, "A gate status is unsupported by this continuation")
        require(any(r.get("sha256") == gate["independentAudit"]["sha256"] for r in rows["N1-06"]["sourceRefs"]), "N1-06 assessment does not cite the actual later audit")
        require(new_assessment["original70AcceptanceJSON"]["sha256"] == CRITERIA_SHA and new_assessment["originalNsGates"]["sha256"] == NS_GATES_SHA, "New assessment source criteria differ")
        require(new_assessment["parameterExpressionSHA256"] == prior["parameterExpressionSHA256"] and new_assessment["profileEvidenceSHA256"] == prior["profileEvidenceSHA256"], "New assessment changed the already completed same profile")
        require(new_assessment["separateDatedDeltaCounts"] == (COUNTS70 if audit_pass else COUNTS69), "New counts are not supported by actual N106 evidence")
        require(new_assessment["allOriginalNineConditionsComplete"] is audit_pass and new_assessment["allOriginal70ConditionsComplete"] is audit_pass, "New all-complete flags do not match actual N106 evidence")
        require(new_assessment["remainingGateIds"] == ([] if audit_pass else ["N1-06"]), "Remaining gate list mismatch")
        require(parse_time(new_assessment["generatedUTC"]) >= parse_time(prior["generatedUTC"]), "New assessment predates its baseline")
        current = new_assessment

    findings = gate["findingsKO"]
    require(isinstance(findings, list) and len(findings) <= 3 and all(isinstance(s, str) and 0 < len(s) <= 480 for s in findings), "Use at most three concise factual Korean findings")
    if not findings:
        blockers.append("Final factual findings for the actual subsequent gate execution are missing")
    if data.get("finalizedUTC") is None:
        blockers.append("Final observation timestamp is missing")
    else:
        final_time = parse_time(data["finalizedUTC"])
        if observation is not None:
            require(final_time >= parse_time(observation["receivedUTC"]), "Final addendum timestamp predates actual final job observation")
        if new_assessment is not None:
            require(final_time >= parse_time(new_assessment["generatedUTC"]), "Final addendum predates the new assessment")
    if data["state"] != "FINAL_ACTUAL_RESULTS_VERIFIED":
        blockers.append("Input remains in preparation mode")
    pages = data["renderingPlan"]["appendixPages"]
    require(type(pages) is int and pages in (2, 3), "Appendix must have 2 or 3 pages")
    require(data["renderingPlan"]["mergedPagesWhenFinalized"] == 15 + pages, "Planned combined page count mismatch")
    if followup_publication is not None and pages != 3:
        blockers.append("Select three appendix pages when a follow-up public release is supplied")
    require(data["renderingPlan"]["noPDFBeforeActualFinalGateEvidence"] is True, "The actual-evidence guard cannot be disabled")
    completed = audit_pass and new_assessment is not None and not blockers
    return {"base": base, "prior": prior, "current": current, "old": old,
            "publication3": publication3, "publicationFollowup": followup_publication,
            "diagnostics": diagnostic_records, "observation": observation, "job": job,
            "audit": audit, "terminalBinding": terminal_binding,
            "N106IndependentAuditComplete": audit_pass and gate_fully_bound,
            "N106Completed": completed, "blockers": blockers}


def make_appendix(path, data, checked, font_dir):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfgen import canvas
    from reportlab.platypus import Paragraph, Table, TableStyle

    for filename, name in (("NanumGothic-Regular.ttf", "Nanum"), ("NanumGothic-Bold.ttf", "NanumBold")):
        font = font_dir / filename
        pdfmetrics.registerFont(TTFont(name, str(font)))
        PINNED_INPUTS[str(font.resolve())] = sha(font)
    pdfmetrics.registerFontFamily("Nanum", normal="Nanum", bold="NanumBold", italic="Nanum", boldItalic="NanumBold")
    width, height = A4
    margin, usable = 43, width - 86
    ink, teal = colors.HexColor("#172D40"), colors.HexColor("#146B69")
    pale, muted = colors.HexColor("#EDF5F4"), colors.HexColor("#526879")
    styles = {
        "body": ParagraphStyle("body", fontName="Nanum", fontSize=9.6, leading=15.2, textColor=ink, wordWrap="CJK"),
        "small": ParagraphStyle("small", fontName="Nanum", fontSize=8.2, leading=12.5, textColor=muted, wordWrap="CJK"),
        "title": ParagraphStyle("title", fontName="NanumBold", fontSize=21, leading=28, textColor=ink, wordWrap="CJK"),
        "cell": ParagraphStyle("cell", fontName="Nanum", fontSize=8.7, leading=13.0, textColor=ink, wordWrap="CJK"),
        "head": ParagraphStyle("head", fontName="NanumBold", fontSize=8.7, leading=13.0, textColor=colors.white, wordWrap="CJK"),
        "hash": ParagraphStyle("hash", fontName="Courier", fontSize=7.4, leading=10.6, textColor=ink),
    }
    count = data["renderingPlan"]["appendixPages"]
    document = canvas.Canvas(str(path), pagesize=A4, invariant=1)
    document.setTitle("MathScope 실제 공개·보호 Comparator 후속 관측 부록")
    lowest, y = [], 0

    def put(item, gap=8):
        nonlocal y
        _, h = item.wrap(usable, height)
        require(y - h >= 55, "Appendix content would overflow; shorten prose or use the third page. No clipping is allowed.")
        item.drawOn(document, margin, y-h)
        y -= h + gap

    def para(value, kind="body"):
        put(Paragraph(value, styles[kind]), 8 if kind == "body" else 6)

    def table(rows):
        cells = [[Paragraph(escape(str(v)), styles["head"] if n == 0 else styles["cell"]) for v in row] for n, row in enumerate(rows)]
        item = Table(cells, colWidths=[usable * .29, usable * .71])
        item.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), ink), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                 ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                                 ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                                 ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, pale]),
                                 ("LINEBELOW", (0, 0), (-1, -1), .35, colors.HexColor("#D5DFE5"))]))
        put(item, 10)

    def begin(title):
        nonlocal y
        document.setFillColor(teal)
        document.rect(0, height - 10, width, 10, fill=1, stroke=0)
        document.setFont("NanumBold", 9)
        document.drawString(margin, height - 34, "MATHSCOPE / 날짜별 최종 인수인계 부록")
        y = height - 64
        put(Paragraph(title, styles["title"]), 12)
        para("최종 관측: " + display_time(data["finalizedUTC"]), "small")

    def end(number):
        lowest.append(round(y, 2))
        document.setStrokeColor(colors.HexColor("#D5DFE5"))
        document.line(margin, 40, width - margin, 40)
        document.setFillColor(muted)
        document.setFont("Nanum", 7)
        document.drawString(margin, 27, "앞 15쪽은 동결 원본; 새 부록은 이후의 실제 관측과 판정을 추가함")
        document.drawRightString(width - margin, 27, f"{15+number} / {15+count} · 부록 {number}/{count}")
        document.showPage()

    def release_block(publication, receipt, title):
        download = receipt["download"]
        table([[title, "실제 공개·다운로드 검증"],
               ["tag / release / asset", f"{publication['tag']} / {publication['releaseId']} / {publication['assetId']}"],
               ["대상 commit", publication["mainCommit"]],
               ["실제 ZIP", f"{download['downloadedBytes']:,} bytes; 로컬 검증 패키지와 일치"],
               ["다운로드 검증 시각", display_time(download["recordedUTC"])],
               ["동일 commit의 CI", ", ".join(str(x["runId"]) for x in receipt["ci"]["observations"]) + "; 모두 completed/success"]])
        para(download["downloadedSha256"], "hash")
        url = publication["releaseURL"]
        para('<link href="' + escape(url, {'"': '&quot;'}) + '" color="#146B69">' + escape(url) + "</link>", "small")

    def old_block():
        preserved = checked["old"]["preservation"]
        table([["기존 실패 실행", "원문 그대로 보존한 실제 결과"],
               ["run / job", f"{OLD_RUN} / {OLD_JOB}"],
               ["실제 GitHub 결론", "completed / cancelled"],
               ["마지막 stage", "guard-preflight; 시작 뒤 종료 코드·완료 시각 없음"],
               ["실제 취소 시각", display_time(preserved["rawCancellationMarkerUTC"])],
               ["본체·최종 보존", "Comparator/nanoda 수용·제출 정리 감사·after-source 미실행"],
               ["원래 독립 감사", "138/163; FAIL_OR_INCOMPLETE; N106Completed=false"]])
        para("첫 preflight의 시작 기록에서 취소 메시지까지 5시간 46분 42.957611초가 경과했다. 원래 ZIP 34개 파일과 실제 로그를 보존했으며, 이 기록을 후속 실행의 성공 증거로 바꾸지 않는다.")
        para(OLD_ZIP_SHA, "hash")

    begin("부록 A  공개 기록과 후속 실행의 구분")
    para("앞의 15쪽은 2026-10-10 09:21:48 KST에 동결한 69/1 판정과 당시 관측을 보존한다. 아래 부록은 이후 실제 공개·실패·보호 실행 결과를 날짜별로 추가한다.")
    release_block(data["publication3Frozen"], checked["publication3"], "동결한 .3 공개 기록")
    if count == 2:
        old_block()
    elif checked["publicationFollowup"] is not None:
        release_block(data["publicationFollowup"], checked["publicationFollowup"], "실제 후속 공개 기록")
    else:
        para("이 부록에 검증된 추가 공개 릴리스는 입력되지 않았다. 실제 후속 보호 실행 결과는 별도 관측과 artifact 감사에 근거한다.")
    para("공개 CI와 ZIP 다운로드의 성공은 보호 Comparator의 별도 수용 판정을 대신하지 않는다.", "small")
    end(1)

    if count == 3:
        begin("부록 B  기존 취소 실행과 진단의 범위")
        old_block()
        para("기존 보호 명령의 --pty, AF_UNIX 제한, 비특권 사용자와 Landlock을 유지한 후속 실행만 별도의 N1-06 판정 입력으로 받는다. 다음 진단 관측은 운영 경로를 확인하기 위한 자료이며 정리 수용 결과가 아니다.")
        for item in checked["diagnostics"]:
            job = item["job"]
            para(f"진단 run {item['input']['runId']} / job {item['input']['jobId']}: {job['status']} / {job['conclusion']}; " + display_time(item["observation"]["receivedUTC"]), "small")
        para("62개 원시 파일과 경로·SHA 매핑을 별도 보존했으며, 252/252 보존 검사 수를 163개 Comparator 수용 검사에 합산하지 않는다. 25개 미충족 수용 검사는 미실행·증거 부재를 포함하며 정리 반례나 nanoda 거절을 뜻하지 않는다.")
        end(2)

    begin(("부록 B" if count == 2 else "부록 C") + "  후속 보호 Comparator 실제 판정")
    gate, job, audit = data["gateExecution"], checked["job"], checked["audit"]
    table([["실제 후속 보호 실행", "원래 기준에 대한 최종 관측"],
           ["run / job / artifact", f"{gate['runId']} / {gate['jobId']} / {gate['artifactId']}"],
           ["실행 source commit", gate["headCommit"]],
           ["최종 관측 시각", display_time(checked["observation"]["receivedUTC"])],
           ["실제 GitHub job", f"{job['status']} / {job['conclusion']}"],
           ["실제 controller / exit", f"{audit['actualControllerStatus']} / {audit['actualControllerExitCode']}"],
           ["실제 보호 Comparator exit", str(audit["actualProtectedComparatorExitCode"])],
           ["독립 artifact 감사", f"{audit['status']}; {audit['passed']}/{audit['total']}"],
           ["N1-06 원래 기준", "PASS" if checked["N106Completed"] else "PARTIAL"]])
    for finding in gate["findingsKO"]:
        para(escape(finding))
    if checked["N106Completed"]:
        para("실제 보호 Comparator, mandatory nanoda/Lean 수용, 실제 제출 정리의 type/axiom 감사와 최종 source/kernel 보존이 독립 감사에서 확인되었다. 새 원래 기준 판정은 9개 중 9개 충족, 70 PASS / 0 PARTIAL / 0 BLOCKED이다.")
        para("이는 원래 M0/M1 완료 기준에 대한 판정이다. 전역 continuation·stress 전체를 Lean 안에서 형식화했다는 추가 주장은 하지 않는다.", "small")
    else:
        para("실제 후속 증거로 N1-06의 원래 수용 조건을 모두 충족하지 못했다. 현재 판정은 9개 중 8개 충족, 69 PASS / 1 PARTIAL / 0 BLOCKED이며 전체 완료 플래그는 false다.")
    para("후속 실제 감사 SHA-256", "small")
    para(gate["independentAudit"]["sha256"], "hash")
    if data["newAssessmentAfterComparator"] is not None:
        para("새 원래 기준 판정 SHA-256", "small")
        para(data["newAssessmentAfterComparator"]["sha256"], "hash")
    para("원래 70개 기준과 역사적 61/7/2, 68/2, 69/1 판정은 보존된다. 입력과 build manifest에 실행·artifact·감사기·판정·공개 파일의 SHA-256을 각각 기록한다.", "small")
    end(count)
    document.save()
    return lowest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--finalize", action="store_true")
    parser.add_argument("--font-dir", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        data = json.loads(args.input.read_text(encoding="utf-8"))
        checked = validate(data)
    except (KeyError, TypeError, ValueError, OSError, zipfile.BadZipFile) as exc:
        print(json.dumps({"status": "INVALID_INPUT", "error": str(exc), "PDFGenerated": False}, ensure_ascii=False, indent=2))
        return 1
    PINNED_INPUTS[str(args.input.resolve())] = sha(args.input)
    result = {"status": "PENDING_ACTUAL_RESULTS" if checked["blockers"] else "READY_TO_RENDER",
              "blockers": checked["blockers"], "PDFGenerated": False,
              "N106IndependentAuditComplete": checked["N106IndependentAuditComplete"],
              "N106Completed": checked["N106Completed"], "basePDFUnchanged": True,
              "counts": checked["current"]["separateDatedDeltaCounts"]}
    if checked["blockers"] or not args.finalize:
        if args.finalize and checked["blockers"]:
            result["finalizationRefused"] = True
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 2 if checked["blockers"] else 0
    if not args.output or not args.font_dir:
        parser.error("--output and --font-dir are required for final rendering")
    appendix = args.output.with_name(args.output.stem + "_Addendum.pdf")
    manifest_path = args.output.with_suffix(".build.json")
    if args.output.resolve() == checked["base"] or any(p.exists() for p in (args.output, appendix, manifest_path)):
        parser.error("Existing or frozen output paths will not be replaced")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    lowest = make_appendix(appendix, data, checked, args.font_dir)
    from pypdf import PdfReader, PdfWriter
    original, supplement = PdfReader(checked["base"]), PdfReader(appendix)
    appendix_pages = data["renderingPlan"]["appendixPages"]
    require(len(original.pages) == 15 and len(supplement.pages) == appendix_pages, "Unexpected PDF page count")
    writer = PdfWriter()
    for page in original.pages:
        writer.add_page(page)
    for page in supplement.pages:
        writer.add_page(page)
    writer.add_metadata({"/Title": "MathScope M0/M1 최종 인수인계 | 2026-10-10", "/Author": "MathScope Research IDE"})
    with args.output.open("xb") as handle:
        writer.write(handle)
    merged = PdfReader(args.output)
    require(len(merged.pages) == 15 + appendix_pages, "Merged PDF page count mismatch")
    for n in range(15):
        require(original.pages[n].get_contents().get_data() == merged.pages[n].get_contents().get_data(), "Frozen page content stream changed")
        require(original.pages[n].extract_text() == merged.pages[n].extract_text(), "Frozen page text changed")
        require(original.pages[n].mediabox == merged.pages[n].mediabox, "Frozen page box changed")
    require(sha(checked["base"]) == BASE_SHA, "Original PDF bytes changed")
    require(all("\x00" not in (page.extract_text() or "") for page in merged.pages), "Missing-glyph marker found")
    PINNED_INPUTS[str(Path(__file__).resolve())] = sha(Path(__file__))
    manifest = {"schema": "MathScope.FinalHandoffPDFBuild/3", "builtUTC": datetime.now(timezone.utc).isoformat(),
                "inputFinalizedUTC": data["finalizedUTC"], "displayTimezone": "Asia/Seoul",
                "basePDFSHA256": BASE_SHA, "basePDFBytesUnchanged": True,
                "first15DecodedContentStreamsTextAndMediaBoxesUnchanged": True,
                "pages": 15 + appendix_pages, "appendixPages": appendix_pages,
                "outputPath": str(args.output.resolve()), "outputSHA256": sha(args.output),
                "appendixPath": str(appendix.resolve()), "appendixSHA256": sha(appendix),
                "appendixLowestBodyY": lowest, "inputsSHA256": PINNED_INPUTS,
                "oldFailedRunId": OLD_RUN, "gateRunId": data["gateExecution"]["runId"],
                "gateJobId": data["gateExecution"]["jobId"],
                "gateAuditSchema": data["gateExecution"]["expectedAuditSchema"],
                "historicalAuditInputsManifestSHA256": data["gateExecution"]["auditInputsManifest"]["sha256"],
                "actualRunBindingSHA256": (data["gateExecution"]["actualRunBinding"]["sha256"] if data["gateExecution"]["actualRunBinding"] is not None else None),
                "currentCounts": checked["current"]["separateDatedDeltaCounts"],
                "N106Completed": checked["N106Completed"], "visualRenderQARequiredBeforeDelivery": True}
    with manifest_path.open("x", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(json.dumps({"status": "BUILT_REQUIRES_VISUAL_QA", "output": str(args.output), "sha256": sha(args.output), "pages": 15 + appendix_pages}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
