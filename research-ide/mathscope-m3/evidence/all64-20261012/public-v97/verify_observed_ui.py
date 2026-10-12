#!/usr/bin/env python3
"""Verify already captured public DOM/WebMCP bytes; no browser or math execution."""
from __future__ import annotations

import gzip
import hashlib
import json
from datetime import datetime, timezone
from fractions import Fraction
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
REPO = next(p for p in HERE.parents if (p / "research-ide").is_dir())
M3 = REPO / "research-ide/mathscope-m3"


def raw(name: str) -> bytes:
    path = HERE / name
    return path.read_bytes() if path.exists() else gzip.decompress(path.with_suffix(path.suffix + ".gz").read_bytes())


def read(name: str):
    return json.loads(raw(name))


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def webmcp(name: str):
    envelope = read(name)
    return json.loads(next(x["text"] for x in envelope["content"] if x["type"] == "text"))


def pinned(path: Path):
    data = path.read_bytes()
    return {"path": str(path.relative_to(REPO)), "bytes": len(data), "sha256": sha(data)}


def main():
    checks = []

    def check(name, condition, evidence):
        checks.append({"id": name, "pass": bool(condition), "evidence": evidence})

    load = webmcp("n7-load-example-copy.json")
    run = webmcp("n7-run-webmcp.json")
    replay = webmcp("n7-replay-webmcp.json")
    exported = webmcp("n7-full-record-export-webmcp.json")
    record = read("n7-exported-execution-record.json")
    result = record["result"]
    archive = result["results"]
    certificate = archive["certificate"]
    selections = read("n7-all-five-ui-selections.json")
    dom = read("n7-public-dom-before.json")
    final_dom = read("n7-final-public-dom.json")
    expanded = read("n7-expanded-source-scopes.json")
    publication = read("publication-http-verification.json")
    depth_list = [0, 2, 4, 8, 12]
    artifact_path = REPO / archive["artifact"]["path"]
    original = json.loads(artifact_path.read_bytes())

    check("published-v97-exact-http-receipt", publication["version"] == 97 and publication["versionHash"] == "c13df808" and publication["exactCandidateMatch"] is True and publication["sha256"] == "2066585a2f452eacfc8cccce2785561a160f3ca26fa8181199c9acaa871ea9eb", pinned(HERE / "publication-http-verification.json"))
    check("registered-example-actual-worker-completed", load == {"ok": True, "status": "INPUT_LOADED"} and run["ok"] is True and run["execution"] == {"status": "COMPLETED", "backend": "STATIC_BROWSER_WORKER"} and record["request"] == {"kind": "navier", "input": {"operation": "inner-growth-record", "package": "N7"}}, {"operation": record["request"], "execution": run["execution"]})
    check("recorded-archive-verified-without-fresh-constructor", archive["status"] == "RECORDED_SOURCE_INNER_GROWTH_VERIFIED" and archive["archiveVerification"]["pass"] is True and archive["recordedOnly"] is True and archive["freshSourceConstructorExecuted"] is False and result["recordedOnly"] is True and result["freshSourceConstructorExecuted"] is False, {"archiveSHA256": archive["archiveSHA256"], "verification": archive["archiveVerification"], "sourceValidation": archive["sourceValidation"]})
    check("full-export-equals-immutable-source-certificate", certificate == original and sha(artifact_path.read_bytes()) == archive["artifact"]["sha256"] and archive["artifact"]["sha256"] == "7a72e1ca1293ba2542ed4ed2612ad67b95df7cb31eb49cf91be004f6ae16a5fe", {"originalArtifact": pinned(artifact_path), "exportedCertificateEqualParsedOriginal": certificate == original})

    program = certificate["formulaProgram"]
    program_sha = sha(json.dumps(program, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode())
    check("complete-scalar-formula-dag-retained", len(program["nodes"]) == len(program["sourceNodeIds"]) == certificate["graph"]["scalarNodeCount"] == 28966 and len(program["roots"]) == 54 and program_sha == certificate["graph"]["scalarProgramSHA256"] == "907acb6f5a875a473efc28efeb2537409928188a5be1098bda4cbb9ded75afb1" and program["valuesAreExactExpressions"] is True and program["underflowReplacedByZero"] is False, {"nodeCount": len(program["nodes"]), "rootCount": len(program["roots"]), "sourceNodeCount": len(program["sourceNodeIds"]), "canonicalSHA256": program_sha, "fullDAGPath": "record.result.results.certificate.formulaProgram", "entireSourceFamilyReexecutedInBrowser": False})

    rows = certificate["rows"]
    exact_rows = []
    for row in rows:
        d = row["depth"]
        lo, hi = map(Fraction, (row["leadingInterval"]["lower"], row["leadingInterval"]["upper"]))
        lower, upper = map(Fraction, (row["interval"]["lower"], row["interval"]["upper"]))
        radius = Fraction(row["remainderAbsUpper"])
        a, b = map(Fraction.from_float, row["displayEnclosure"])
        valid = lo > Fraction(1, 2) and hi >= lo and radius == Fraction(1, 2 ** (d + 2)) and lower == lo - radius and upper == hi + radius and a <= lower <= upper <= b and row["physicalVelocity"]["binary64"] is None and row["finiteSumMidpointUsed"] is False and row["externalSourceTheoremBridgeRequired"] is True
        exact_rows.append({"depth": d, "pass": valid, "leadingInterval": row["leadingInterval"], "exactInterval": row["interval"], "remainderAbsUpper": row["remainderAbsUpper"], "outwardDisplayEnclosure": row["displayEnclosure"]})
    check("five-exact-positive-leading-and-outward-tail-intervals", [r["depth"] for r in rows] == depth_list and all(r["pass"] for r in exact_rows), exact_rows)

    svg = ET.fromstring(dom["chart"]["svg"])
    groups = [e for e in svg.iter() if "data-depth" in e.attrib]
    bars = [e for e in svg.iter() if "data-enclosure-bar" in e.attrib]
    table = dom["tables"][0]
    table_matches = len(table["rows"]) == 5 and all(json.loads(cells[1])["exactInterval"] == row["interval"] and row["remainderAbsUpper"] in cells[2] for cells, row in zip(table["rows"], rows))
    three_lines_each = all(len([e for e in g if e.tag.rsplit("}", 1)[-1] == "line"]) == 3 for g in groups)
    no_midpoints_or_interpolation = not any(e.tag.rsplit("}", 1)[-1] in {"circle", "polyline", "path"} for e in svg.iter())
    check("five-bars-source-table-and-no-fabricated-spatial-points", [int(g.attrib["data-depth"]) for g in groups] == depth_list and len(bars) == 5 and three_lines_each and no_midpoints_or_interpolation and table_matches and result["observations"]["samples"] == [] and result["observations"]["curves"] == [] and run["audit"]["sourcePoints"] == run["audit"]["displayedPoints"] == 0, {"bars": len(bars), "caps": 10, "tableRows": len(table["rows"]), "depths": depth_list, "noMidpointOrInterpolatedCurve": no_midpoints_or_interpolation, "chartAriaLabel": dom["chart"]["ariaLabel"], "spatialPoints": 0})
    selections_valid = all(selections[str(r["depth"])]["exactSourceRow"] == r and selections[str(r["depth"])]["depth"] == r["depth"] and selections[str(r["depth"])]["runDigest"] == record["resultDigest"] and selections[str(r["depth"])]["sourceArtifact"]["sha256"] == archive["artifact"]["sha256"] and selections[str(r["depth"])]["sourceChangedBySelection"] is False and selections[str(r["depth"])]["scalarProgram"]["sha256"] == program_sha for r in rows)
    check("native-and-keyboard-selection-retains-exact-source", selections_valid and read("n7-native-selection-depth4.json") == selections["4"], {"initialDepth": 0, "screenshotGroundedNativeClick": {"coordinates": [695, 617], "selectedDepth": 4}, "keyboardEnterDepths": [2, 8, 12], "allFiveOriginalRowsEqual": selections_valid, "selectionMutatesResult": False})

    dependencies = certificate["claims"]["originalLocalizedPath"]
    external_text = " ".join(x["text"] for x in expanded)
    check("public-external-localized-field-bridge-explicit", all(x["open"] for x in expanded) and dependencies["status"] == "CONDITIONAL_ON_EXTERNAL_SOURCE_THEOREM_IDENTIFICATION" and len(dependencies["dependencies"]) == 2 and "Proposition9.9" in external_text and "Proposition10.1" in external_text, {"externalFinalFieldIdentification": dependencies, "scopesOpened": [x["summary"] for x in expanded]})
    check("export-complete-record-separate-from-dom-summary", exported["record"] == record and exported["byteLength"] == len(raw("n7-exported-execution-record.json").removesuffix(b"\n")) and "displaySummaryOnly" in final_dom["recordDisplayText"] and "전체 수식 DAG가 포함됩니다" in final_dom["recordDisplayText"], {"exportedJSONBytesWithoutFinalNewline": exported["byteLength"], "completeScalarDAGNodeCount": len(program["nodes"]), "DOMShowsSummaryOnly": True, "exportTransport": "REGISTERED_WEBMCP_READ_ONLY_EXPORT", "browserDownloadAttempted": False, "downloadCompletionClaimed": False})
    check("actual-archive-replay-match", replay["ok"] is True and replay["replay"]["status"] == "MATCH" and replay["replay"]["currentDigest"] == replay["replay"]["previousDigest"] == record["resultDigest"] and replay["audit"]["requestDigest"] == record["requestDigest"] and replay["result"]["freshSourceConstructorExecuted"] is False and replay["result"] == result, {"replay": replay["replay"], "archiveOnly": True, "newHeavyConstructorRun": False, "newLeanRun": False, "pageLocalSelectedDepthAfterReplay": final_dom["selection"]["depth"]})
    check("no-original-criterion-or-whole-field-promotion", certificate["claims"]["originalN7CriterionComplete"] is False and certificate["scope"]["originalCompleteN6FieldConstructed"] is False and archive["completeN6"] is False and archive["completeN7"] is False and archive["newLeanProofIssued"] is False and record["wholeM3Complete"] is False and record["formalProofIssued"] is False, {"originalN7CriterionComplete": False, "completeFinalN6Constructed": False, "completeN7": False, "newLeanProofIssued": False, "wholeM3Complete": False, "originalN707Assessment": "PARTIAL; actual original background inner path and explicit error completed, final localized field identification remains conditional"})

    # This child only hashes captured JSON and an immutable exported data constant.
    # It does not execute the archived constructor, any numerical solver, or a test suite.
    node = r'''import fs from 'node:fs'; import crypto from 'node:crypto'; import zlib from 'node:zlib';
import {INNER_GROWTH_ARCHIVE,INNER_GROWTH_ARCHIVE_SHA256} from './research-ide/mathscope-m3/navier/source-inner-growth-evidence-data.mjs';
const path=process.argv[1];const bytes=fs.existsSync(path)?fs.readFileSync(path):zlib.gunzipSync(fs.readFileSync(path+'.gz'));const r=JSON.parse(bytes);
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const sha=x=>crypto.createHash('sha256').update(canonical(x)).digest('hex');
console.log(JSON.stringify({requestDigest:sha(r.request),resultDigest:sha(r.result),presentationDigest:sha(r.presentation.payload),archiveDigest:sha(INNER_GROWTH_ARCHIVE),archiveExpected:INNER_GROWTH_ARCHIVE_SHA256,programSHA256:sha(r.result.results.certificate.formulaProgram)}));'''
    outcome = subprocess.run(["node", "--input-type=module", "-e", node, str(HERE / "n7-exported-execution-record.json")], cwd=REPO, text=True, capture_output=True, check=True)
    digests = json.loads(outcome.stdout)
    check("independent-captured-json-digest-recomputation", digests["requestDigest"] == record["requestDigest"] and digests["resultDigest"] == record["resultDigest"] and digests["presentationDigest"] == record["presentation"]["digest"] and digests["archiveDigest"] == digests["archiveExpected"] == archive["archiveSHA256"] and digests["programSHA256"] == program_sha, digests)

    artifacts = []
    for path in sorted(HERE.iterdir()):
        if path.is_file() and path.name != "n7-ui-acceptance.json":
            entry = pinned(path)
            if path.suffix == ".gz":
                decoded = gzip.decompress(path.read_bytes())
                entry["decodedOriginal"] = {"filename": path.stem, "bytes": len(decoded), "sha256": sha(decoded)}
            artifacts.append(entry)
    accepted = all(c["pass"] for c in checks)
    receipt = {"schema": "MathScope.N7.PublicRecordedInnerGrowthUIAcceptance/1", "recordedAt": datetime.now(timezone.utc).isoformat(), "status": "PASS" if accepted else "FAIL", "pass": accepted, "scope": "PUBLIC_V97_RECORDED_INNER_GROWTH_DISPLAY_SELECTION_EXPORT_AND_ARCHIVE_REPLAY_ONLY", "publication": publication, "observedFinalURL": raw("observed-final-url.txt").decode().strip(), "browser": {"provider": "CUA_CDP", "tabId": "4", "directDOMAndRegisteredWebMCPOnly": True, "externalBrowserAutomationUsed": False}, "checks": checks, "passedChecks": sum(c["pass"] for c in checks), "checkCount": len(checks), "originalCriterionComplete": False, "criterionAssessment": "N7-07 PARTIAL; this UI gate does not remove the original final localized field identification obligation.", "mathematicalExecutionScope": {"newBrowserArchiveValidation": True, "freshOriginalSourceConstructorExecuted": False, "sourceCertificateOriginalCriterionComplete": False, "fullScalarFormulaDAGExported": True, "scalarNodes": 28966, "actualFinalN6Constructed": False, "newLeanExecuted": False, "wholeM3Complete": False}, "methodNotes": ["One DOM JSON parse attempt encountered the intentionally appended summary/export explanation; the raw visible text was retained and the valid full record was obtained through registered WebMCP export.", "n7-selected-depth12.jpg is the viewport after keyboard depth12 selection; it shows a scrolled table and prior focused row. n7-depth12-chart-selected.jpg is the direct selected-depth12 chart screenshot.", "Archive replay resets the page-local depth selection to0 and preserves the exact mathematical result. Selection persistence across replay is not claimed.", "No download was attempted in this QA. Registered read-only WebMCP export succeeded and retained all exact rows and the full scalar formula DAG.", "The original bytes of losslessly compressed QA files are also retained in scratch; stored gzip entries carry their decoded length and SHA256."], "independentRecordedSourceEvidence": [pinned(M3 / "navier/evidence/inner-growth-20261012/attempt2/receipt.json"), pinned(artifact_path), pinned(M3 / "evidence/all64-20261012/ci-c971/receipt.json")], "artifacts": artifacts, "progressFilesChangedByThisReceipt": False}
    out = HERE / "n7-ui-acceptance.json"
    out.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"status": receipt["status"], "passed": receipt["passedChecks"], "total": len(checks), "failed": [c["id"] for c in checks if not c["pass"]], "receipt": pinned(out)}, ensure_ascii=False))
    return 0 if accepted else 1


if __name__ == "__main__":
    raise SystemExit(main())
