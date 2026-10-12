"""Five unique-anchor P8 patches against public v83; no new page or asset.

The only alteration to existing P7 code is its exact route guard, which must
exclude the new P8 route. All other existing M2/P7 script bytes are checked.
The original page and candidate stay in memory unless explicitly requested.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re
import urllib.request

ROOT = Path(__file__).resolve().parent
PUBLIC_URL = "https://project29770.websitepublisher.ai/v0.3.1.html"
SOURCE_NAMES = ["p8-workspace.html", "p8-workspace.css", "p8-engine.bundle.js",
                "p8-visual-models.js", "p8-visualization.js", "p8-workspace.js"]
OLD_P7_GUARD = "if(!location.hash.startsWith('#research-m3'))return;"
NEW_P7_GUARD = "if(!location.hash.startsWith('#research-m3')||location.hash.startsWith('#research-m3-p8'))return;"


def sha(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def fetch_baseline(url=PUBLIC_URL):
    request = urllib.request.Request(url, headers={"Cache-Control": "no-cache"})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read().decode("utf-8")


def build(original):
    if 'id="mathscopeResearchM3P8"' in original:
        raise ValueError("P8 is already present; this builder expects the v83 baseline")
    sources = {name: (ROOT / name).read_text(encoding="utf-8") for name in SOURCE_NAMES}
    if not sources["p8-engine.bundle.js"].strip():
        raise ValueError("The real P8 engine bundle must exist and be nonempty")
    patches, candidate = [], original

    def patch(find, replacement):
        nonlocal candidate
        if candidate.count(find) != 1:
            raise ValueError("Expected exactly one anchor: " + find[:110])
        patches.append({"operation": "replace", "find": find, "replace": replacement})
        candidate = candidate.replace(find, replacement, 1)

    def existing_script(element_id):
        matches = re.findall(r'<script id="' + re.escape(element_id) + r'"[^>]*>.*?</script>', original, re.S)
        if len(matches) != 1:
            raise ValueError("Expected one existing script: " + element_id)
        return matches[0]

    nav_matches = re.findall(r'<button class="nav-btn" data-view-target="research-m3">.*?</button>', original, re.S)
    if len(nav_matches) != 1:
        raise ValueError("Expected one existing P7 navigation button")
    nav = nav_matches[0]
    patch(nav, nav + '\n        <button class="nav-btn" data-view-target="research-m3-p8"><span class="nav-icon">P8</span><span>Structure &amp; Review</span></button>')
    section_anchor = '<section class="view m1 m2"'
    patch(section_anchor, sources["p8-workspace.html"].rstrip() + '\n' + section_anchor)
    patch('</head>', '<style id="mathscope-m3-p8-css">\n' + sources["p8-workspace.css"] + '\n</style>\n</head>')
    script_blocks = []
    for element_id, name in [("mathscope-m3-p8-engine-js", "p8-engine.bundle.js"),
                             ("p8-visual-models-js", "p8-visual-models.js"),
                             ("p8-visualization-js", "p8-visualization.js"),
                             ("p8-workspace-js", "p8-workspace.js")]:
        safe_script = re.sub(r'</script', lambda m: '<\\/script', sources[name], flags=re.I)
        script_blocks.append('<script id="' + element_id + '">\n' + safe_script + '\n</script>')
    patch('<script id="mathscope-m2-js">', '\n'.join(script_blocks) + '\n<script id="mathscope-m2-js">')
    patch(OLD_P7_GUARD, NEW_P7_GUARD)

    preserved = {}
    for element_id in ["mathscope-m2-js", "p7-visual-models-js", "p7-visualization-js", "p7-visual-seeds", "p7-visual-controller-js"]:
        script = existing_script(element_id)
        if candidate.count(script) != 1:
            raise ValueError("Existing script changed: " + element_id)
        preserved[element_id] = sha(script)
    p7_script = existing_script("mathscope-m3-js")
    expected_p7 = p7_script.replace(OLD_P7_GUARD, NEW_P7_GUARD, 1)
    if p7_script.count(OLD_P7_GUARD) != 1 or candidate.count(expected_p7) != 1:
        raise ValueError("P7 changes exceed the agreed route guard")
    # Reverse every patch to detect accidental mutations outside these anchors.
    restored = candidate
    for item in reversed(patches):
        if restored.count(item["replace"]) != 1:
            raise ValueError("Patch is not uniquely reversible")
        restored = restored.replace(item["replace"], item["find"], 1)
    if restored != original:
        raise ValueError("Unexpected changes outside the five patches")
    return patches, candidate, {
        "schema": "MathScope.M3.P8PagePatch/1", "baseVersion": 83,
        "baseVersionHash": "f052cafd", "patchCount": len(patches),
        "newPages": 0, "newAssets": 0, "baselineSHA256": sha(original),
        "candidateSHA256": sha(candidate), "preservedScriptsSHA256": preserved,
        "P7RouteGuard": {"beforeSHA256": sha(p7_script), "afterSHA256": sha(expected_p7),
                         "onlyChange": {"find": OLD_P7_GUARD, "replace": NEW_P7_GUARD}},
        "sources": {name: sha(value) for name, value in sources.items()},
        "proofStatusPromoted": False, "wholeP8Complete": False, "wholeM3Complete": False,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--baseline", type=Path, help="Optional existing baseline instead of HTTP")
    parser.add_argument("--candidate", action="store_true", help="Opt in to saving a large candidate page")
    args = parser.parse_args()
    original = args.baseline.read_text(encoding="utf-8") if args.baseline else fetch_baseline()
    patches, candidate, manifest = build(original)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "p8-page-patches.json").write_text(json.dumps(patches, ensure_ascii=False, indent=2), encoding="utf-8")
    (args.output / "p8-build-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    if args.candidate:
        (args.output / "v0.3.1.p8.html").write_text(candidate, encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False))
