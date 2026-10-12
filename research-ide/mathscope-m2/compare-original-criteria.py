"""Rebuild the original 20/39/5 status delta without changing criterion text."""
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
BASE = "2fc532bd8f5adf28e061282e34064cefbd50e8e6"
REL = "research-ide/mathscope-m2/evidence/m2-criteria-status.json"
sha = lambda data: hashlib.sha256(data).hexdigest()
previous_bytes = subprocess.check_output(["git", "show", f"{BASE}:{REL}"], cwd=REPO)
assert sha(previous_bytes) == "0f54ea2e368bfb636aca85f73c9603abb9b47961b598e6ddda7572932a1ab920"
current_bytes = (ROOT / "evidence/m2-criteria-status.json").read_bytes()
extraction_bytes = (ROOT / "evidence/original-m2-criteria.json").read_bytes()
previous = json.loads(previous_bytes)
current = json.loads(current_bytes)
extraction = json.loads(extraction_bytes)
old = {r["id"]: r for r in previous["criteria"]}
new = {r["id"]: r for r in current["criteria"]}
original = {r["id"]: r for p in extraction["packages"].values() for r in p["criteria"]}
assert len(old) == len(new) == len(original) == 64
assert set(old) == set(new) == set(original)
transitions = defaultdict(list)
records = []
for key, row in new.items():
    before = old[key]
    for field in ("id", "title", "criteria", "sourcePage"):
        assert before[field] == row[field], (key, field, "changed since baseline")
        extracted = original[key][field]
        if isinstance(extracted, str):
            extracted = extracted.replace("\\n", "\n")
        assert row[field] == extracted, (key, field, "differs from original")
    assert before["status"] != "PASS" or row["status"] == "PASS", key
    transition = f'{before["status"]}->{row["status"]}'
    transitions[transition].append(key)
    records.append({
        **{field: row[field] for field in ("id", "title", "criteria", "sourcePage")},
        "previousStatus": before["status"], "currentStatus": row["status"],
        "transition": transition,
        "newlyPassed": before["status"] != "PASS" and row["status"] == "PASS",
        "originalTextPreserved": True,
        "currentImplementedScope": row.get("implementedScope"),
        "currentAcceptanceScope": row.get("acceptanceScope"),
        "remainingObligations": row.get("remainingObligations", []),
        "evidencePaths": row.get("evidencePaths", []),
    })

def counts(rows):
    c = Counter(r["status"] for r in rows)
    return {status: c[status] for status in ("PASS", "PARTIAL", "OPEN")}

assert counts(old.values()) == {"PASS": 20, "PARTIAL": 39, "OPEN": 5}
assert counts(new.values()) == current["counts"]
newly_passed = [r["id"] for r in records if r["newlyPassed"]]
result = {
    "schema": "MathScope.M2OriginalCriterionStatusDelta/1",
    "dateUTC": "2026-10-10",
    "scope": "Verbatim ID/title/acceptance/page comparison and declared status transitions; not an independent mathematical certificate or a browser test. Extraction's literal newline escapes are decoded, without other text normalization.",
    "blueprint": {"name": extraction["sourceName"], "sha256": extraction["sourceSHA256"], "extractionPath": "evidence/original-m2-criteria.json", "extractionSha256": sha(extraction_bytes)},
    "previous": {"gitCommit": BASE, "path": REL, "sha256": sha(previous_bytes), "counts": counts(old.values())},
    "current": {"path": "evidence/m2-criteria-status.json", "sha256": sha(current_bytes), "counts": counts(new.values()), "fullM2Complete": current["fullM2Complete"]},
    "verification": {key: True for key in ("same64CriterionIDs", "titlesUnchanged", "acceptanceTextUnchanged", "sourcePagesUnchanged", "bothStatesMatchOriginalExtraction", "noPreviousPassRegressed", "countsRecomputedFromIndividualRows", "pass")},
    "transitionCounts": {key: len(ids) for key, ids in transitions.items()},
    "transitionIDs": dict(transitions),
    "newlyPassedCount": len(newly_passed), "newlyPassedIDs": newly_passed,
    "remainingPartialIDs": [r["id"] for r in records if r["currentStatus"] == "PARTIAL"],
    "packages": [{"id": package, "originalCount": 8, "previousCounts": counts(r for key, r in old.items() if key.startswith(package + "-")), "currentCounts": counts(r for key, r in new.items() if key.startswith(package + "-")), "newlyPassedIDs": [key for key in newly_passed if key.startswith(package + "-")]} for package in ("P4", "P5", "P6", "Y3", "Y4", "N4", "N5", "I2")],
    "criteria": records,
}
(ROOT / "evidence/original-status-delta.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"counts": result["current"]["counts"], "transitions": result["transitionCounts"], "pass": True}))
