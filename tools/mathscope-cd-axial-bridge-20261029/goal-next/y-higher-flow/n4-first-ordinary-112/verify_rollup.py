"""Check caller membership, graph and receipt digests, and control counts."""

from collections import Counter
import hashlib
import json
from pathlib import Path
import sys


root = Path(sys.argv[1])
selected = {3: (125249, 123123), 5: (128769, 129547), 7: (128683, 130065)}
site_counts = {3: 30, 5: 26, 7: 15}
systems = {}
controls = {policy: Counter() for policy in ("binders", "guards", "radial-frame")}
prior = None
after = set()
for system, sites in selected.items():
    manifest = json.loads((root / "graphs" / f"system-{system}-manifest.json").read_bytes())
    assert manifest["system"] == system and manifest["originalCount"] == 112
    current_prior = set(manifest["originalPreviouslyChecked"])
    assert len(current_prior) == 41
    if prior is None:
        prior = current_prior
    assert prior == current_prior
    source = {row["caller"]: row for row in manifest["manifest"]}
    assert len(source) == site_counts[system] == len(manifest["manifest"])
    assert not set(source) & (prior | after)
    after.update(source)
    positive_json = (root / "checks" / f"system-{system}-positive.json").read_bytes()
    positive = json.loads(positive_json)
    assert positive["verified_sites"] == site_counts[system] and not positive["materialization_or_validator_errors"]
    assert {row["source_caller"] for row in positive["records"]} == set(source)
    counts = Counter()
    for row in positive["records"]:
        caller = row["source_caller"]
        registered = source[caller]
        assert registered["savedArgs"] == row["source_saved_args"]
        assert registered["freshNaturalCount"] == row["fresh_natural_targets"] == row["certified_fresh_natural_targets"]
        assert row["inherited_natural_targets"] == row["certified_inherited_natural_targets"]
        assert row["fresh_native_ingress_targets"] == row["certified_native_ingress_targets"]
        assert not (row["open_natural_targets"] or row["open_native_ingress_targets"])
        assert hashlib.sha256((root / "graphs" / registered["file"]).read_bytes()).hexdigest() == registered["sha256"]
        receipt = (root / "checks" / f"{caller}.json").read_bytes()
        assert hashlib.sha256(receipt).hexdigest() == row["receipt_sha256"]
        counts.update(rows=1, ordinary_nodes=row["reached_nodes"], fresh_y=row["certified_fresh_natural_targets"],
                      inherited_y=row["certified_inherited_natural_targets"], native_frames=sum(row["certified_native_ingress_targets"].values()))
        counts["top" if row["source_ingress_kind"] == "original top caller" else "lower"] += 1
    systems[system] = dict(counts)
    for policy in controls:
        suffix = "-".join(map(str, sites))
        negative = json.loads((root / "checks" / f"system-{system}-{policy}-{suffix}.json").read_bytes())
        assert len(negative["records"]) == 2 and not negative["materialization_or_validator_errors"]
        assert {row["source_caller"] for row in negative["records"]} == set(sites)
        assert negative["verified_sites"] == 0 and negative["open_natural_sum"] > 0
        for row in negative["records"]:
            receipt = (root / "checks" / f"{row['source_caller']}-no-{policy}.json").read_bytes()
            assert hashlib.sha256(receipt).hexdigest() == row["receipt_sha256"]
        controls[policy].update(open_y=negative["open_natural_sum"], open_native_frames=negative["open_explicit_native_sum"])

assert len(prior) + len(after) == 112
total = Counter()
for counts in systems.values():
    total.update(counts)
summary = {
    "status": "PASS_N4_112_FIRST_ORDINARY_FRESH_ARGUMENTS",
    "previously_verified_sites": sorted(prior),
    "newly_verified_sites": sorted(after),
    "systems": systems,
    "new_totals": dict(total),
    "controlled_callers": selected,
    "control_open_counts": {k: dict(v) for k, v in controls.items()},
    "remaining": ["typed native definition bodies", "unbounded recursion and native limits", "original bootstrap reused and explicit native frames beyond earlier scope", "whole Y and final jets"],
}
(root / "rollup.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
print(json.dumps({k: v for k,v in summary.items() if not k.endswith("_sites")}, indent=2))
