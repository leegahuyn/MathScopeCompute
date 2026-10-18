#!/usr/bin/env python3
"""Prepare two guarded fragment patches against recovered, published v118.

This is new reconstruction after a scratch reset. It does not recreate the
unrecovered followup-1 requests or logs. No network or publication occurs here.
"""
import argparse
import hashlib
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PREFIX = "msr-20261019-cf98-a0aece9b"
BEGIN = "<!-- MathScope M3 integrated 20261016 BEGIN -->"
END = "<!-- MathScope M3 integrated 20261016 END -->"
PUBLIC_SHA = "bade76b34a07352e7cdce793ddc4af18e75e031976357bc6e030bd101a1187bb"
DATA_SHA = "a0aece9bfb60d7ca3d7632c5e61c3d4f32b5a2bd495642b9517a3c0e03e23e85"


def sha(value):
    return hashlib.sha256(value if isinstance(value, bytes) else value.encode()).hexdigest()


def json_bytes(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()


def stripped_model(text):
    return re.sub(r"(?m)^export ", "", text)


def compiled(model, runtime):
    return "(() => {\n" + stripped_model(model) + "\n" + runtime + "\n})();"


def replay(original, patches):
    result = original
    for patch in patches:
        assert patch["operation"] == "replace"
        assert result.count(patch["find"]) == 1, "Patch anchor must occur exactly once"
        result = result.replace(patch["find"], patch["replace"], 1)
    return result


def build(public_path):
    base = HERE / "baseline/v118-published"
    fragments = HERE / "generated/fragments"
    out = HERE / "generated/followup-2"
    out.mkdir(parents=True, exist_ok=True)
    model_before = (base / "recovery-model.mjs").read_text()
    model_after = (HERE / "recovery-model.mjs").read_text()
    runtime_before = (base / "recovery-runtime.js").read_text()
    runtime_after = (HERE / "recovery-runtime.js").read_text()
    panel_before = (base / "recovery-panel.html").read_text()
    panel_after = (HERE / "recovery-panel.html").read_text()
    layout_before = (fragments / (PREFIX + "-layout.html")).read_text()
    script_before = (fragments / (PREFIX + "-runtime.html")).read_text()
    assert sha(layout_before).startswith("2f963bd3")
    assert sha(script_before).startswith("535225cf")
    script_open, script_close = '<script id="ms3ip-recovery-runtime">\n', '\n</script>'
    assert script_before == script_open + compiled(model_before, runtime_before) + script_close

    old_open = next(line for line in panel_before.splitlines() if line.startswith("#ms3ip-open{"))
    next_panel = panel_after.splitlines()
    new_open_index = next(i for i, line in enumerate(next_panel) if line.startswith("#ms3ip-open{"))
    new_open = "\n".join(next_panel[new_open_index:new_open_index + 3])
    old_mobile = next(line for line in panel_before.splitlines() if line.startswith("@media(max-width:700px)"))
    new_mobile = next(line for line in next_panel if line.startswith("@media(max-width:700px)"))
    layout_patches = [
        {"operation": "replace", "find": old_open, "replace": new_open},
        {"operation": "replace", "find": old_mobile, "replace": new_mobile},
    ]
    assert replay(panel_before, layout_patches) == panel_after
    layout_after = replay(layout_before, layout_patches)

    assert model_after.startswith(model_before), "Existing model must remain byte-identical"
    helper = stripped_model(model_after[len(model_before):])
    model_anchor = stripped_model(model_before[model_before.index("export function intervalDisplay(row) {"):])
    listener = "panel.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => view(el.dataset.view)));"
    installation = "\nannotateHistoricalPanels(document);\nif (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => annotateHistoricalPanels(document), {once: true});"
    assert runtime_after == runtime_before.replace(listener, listener + installation, 1)
    script_patches = [
        {"operation": "replace", "find": model_anchor, "replace": model_anchor + helper},
        {"operation": "replace", "find": listener, "replace": listener + installation},
    ]
    script_after = replay(script_before, script_patches)
    compiled_after = compiled(model_after, runtime_after)
    assert script_after == script_open + compiled_after + script_close
    assert "</script" not in compiled_after.lower()
    (out / "runtime.js").write_text(compiled_after)

    records = []
    for short, before, after, patches, version in [
        ("layout", layout_before, layout_after, layout_patches, "2f963bd3"),
        ("runtime", script_before, script_after, script_patches, "535225cf"),
    ]:
        request = {
            "project_id": 29770,
            "operation": "patch",
            "name": PREFIX + "-" + short,
            "base_version_hash": version,
            "patches": patches,
            "patch_summary": "Repair three existing launcher hit areas and identify three preserved historical status panels. Preserve all stored evidence, original engines, M3 62/64, M4 acceptance unconfirmed, and actual energy/tau null.",
        }
        encoded = json_bytes(request)
        assert len(encoded) < 5000
        (out / (short + "-patch.json")).write_bytes(encoded)
        (out / (short + ".html")).write_text(after)
        records.append({
            "name": request["name"], "baseVersionHash": version,
            "requestPath": str((out / (short + "-patch.json")).relative_to(ROOT)),
            "requestBytes": len(encoded), "requestSha256": sha(encoded),
            "contentPath": str((out / (short + ".html")).relative_to(ROOT)),
            "beforeBytes": len(before.encode()), "beforeSha256": sha(before),
            "afterBytes": len(after.encode()), "afterSha256": sha(after),
            "operations": len(patches),
        })

    data = (HERE / "generated/RECOVERY_UI_DATA.json").read_bytes()
    assert sha(data) == DATA_SHA
    stored = (fragments / "stored-block.html").read_text()
    rendered_before = (fragments / "rendered-block.html").read_text()
    rendered_after = stored
    original_plan = json.loads((fragments / "FRAGMENT_PUBLICATION_PLAN.json").read_text())
    for record in original_plan["fragments"]:
        name = record["name"]
        content = layout_after if name.endswith("-layout") else script_after if name.endswith("-runtime") else (fragments / (name + ".html")).read_text()
        token = '<!--#wps-include fragment="' + name + '" -->'
        assert rendered_after.count(token) == 1
        rendered_after = rendered_after.replace(token, content, 1)
    assert rendered_after == rendered_before.replace(layout_before, layout_after, 1).replace(script_before, script_after, 1)
    (out / "rendered-block.html").write_text(rendered_after)

    public = public_path.read_bytes()
    assert sha(public) == PUBLIC_SHA, "Actual public baseline changed; stop before preparing a patch"
    public_text = public.decode("utf-8")
    start = public_text.index(BEGIN)
    stop = public_text.index(END, start) + len(END)
    assert public_text[start:stop] == rendered_before
    proposed = public_text[:start] + rendered_after + public_text[stop:]
    outside_before = public_text[:start] + public_text[stop:]
    new_start = proposed.index(BEGIN)
    new_stop = proposed.index(END, new_start) + len(END)
    assert outside_before == proposed[:new_start] + proposed[new_stop:]
    proposed_path = public_path.parent / "production-followup-2-proposed.html"
    proposed_path.write_text(proposed)
    outside_scripts = re.findall(r"<script\b[^>]*>.*?</script\s*>", outside_before, re.S | re.I)
    assert len(outside_scripts) == 39
    report = {
        "schema": "MathScope.FragmentFollowupPlan/2", "preparedOnly": True,
        "noRemoteWrites": True, "reconstruction": "New followup-2 from hash-verified recovered v118 baseline; unrecovered followup-1 bytes/logs are not represented as recovered",
        "projectId": 29770, "pageSlug": "v0.3.1.html", "pageVersionAtBaseline": 118,
        "storedPageVersionHash": "9a0eebc5", "storedPageSSIUnchanged": True,
        "requiresFreshFragmentVersionReadBeforeWrite": True,
        "patches": records, "dataSha256": DATA_SHA, "dataPartCount": 12,
        "original80CriteriaUnchanged": True, "actualGlobalLastResolvedTau": None,
        "wholeKActualEnergy": None, "m3Complete": 62, "m4OriginalAcceptance": "UNCONFIRMED",
        "noticeHostIds": ["ms-m3eight-dialog", "ms-m4-dialog", "n3-picard-audit"],
        "beforePublicBytes": len(public), "beforePublicSha256": sha(public),
        "proposedPublicBytes": len(proposed.encode()), "proposedPublicSha256": sha(proposed),
        "beforeRenderedBlockSha256": sha(rendered_before),
        "renderedBlockBytes": len(rendered_after.encode()), "renderedBlockSha256": sha(rendered_after),
        "outsideMarkerBytesIdentical": True, "outsideScriptCount": len(outside_scripts),
        "mobileInspection": "UNVERIFIED: CSS geometry tests are not actual mobile viewport or touch inspection",
        "publication": "NOT_SENT; parent owns all remote writes", "newPagesOrAssets": False,
        "paidChangeOrDeleteOrForce": False,
    }
    (out / "FOLLOWUP_PLAN.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--public-baseline", type=pathlib.Path, default=ROOT.parent / "website_audit/production-resume-public.html")
    args = parser.parse_args()
    result = build(args.public_baseline)
    print(json.dumps({"patches": result["patches"], "proposedPublicBytes": result["proposedPublicBytes"], "proposedPublicSha256": result["proposedPublicSha256"], "noRemoteWrites": True}, ensure_ascii=False, indent=2))
