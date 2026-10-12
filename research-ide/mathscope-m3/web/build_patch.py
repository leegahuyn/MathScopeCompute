"""Build five unique-anchor patches against a preserved public v81 response."""
from pathlib import Path
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parent
baseline = Path(sys.argv[1])
output = Path(sys.argv[2])
output.mkdir(parents=True, exist_ok=True)
original = baseline.read_text(encoding="utf-8")
candidate = original
patches = []


def patch(find, replace):
    global candidate
    if candidate.count(find) != 1:
        raise ValueError("Expected one anchor: " + repr(find))
    patches.append({"operation": "replace", "find": find, "replace": replace})
    candidate = candidate.replace(find, replace, 1)


nav = '        <button class="nav-btn" data-view-target="research-m2"><span class="nav-icon">M2</span><span>Extensions & Evidence</span></button>'
patch(nav, '        <button class="nav-btn" data-view-target="research-m3"><span class="nav-icon">M3</span><span>P7 · Certified Computation</span></button>\n' + nav)
section = '<section class="view m1 m2" data-view="research-m2" id="mathscopeResearchM2" lang="ko">'
patch(section, (ROOT / "workspace.html").read_text(encoding="utf-8") + "\n" + section)
patch('</head>', '<style id="mathscope-m3-css">\n' + (ROOT / "workspace.css").read_text(encoding="utf-8") + '\n</style>\n</head>')
guard = "&& !location.hash.startsWith('#research-m2'))btn.click();"
patch(guard, "&& !location.hash.startsWith('#research-m2') && !location.hash.startsWith('#research-m3'))btn.click();")
script_anchor = '<script id="mathscope-m2-js">'
script = (ROOT / "workspace.js").read_text(encoding="utf-8").replace("</script", "<\\/script")
patch(script_anchor, '<script id="mathscope-m3-js">\n' + script + '\n</script>\n' + script_anchor)
(output / "p7-page-patches.json").write_text(json.dumps(patches, ensure_ascii=False, indent=2), encoding="utf-8")
if "--candidate" in sys.argv[3:]:
    (output / "v0.3.1.p7-candidate.html").write_text(candidate, encoding="utf-8")
sha = lambda value: hashlib.sha256(value.encode()).hexdigest()
manifest = {"schema": "MathScope.M3.P7BrowserPatch/1", "baseVersion": 81, "baseVersionHash": "17383723", "patchCount": len(patches), "newPages": 0, "newAssets": 0, "publicResponseSHA256": sha(original), "candidateSHA256": sha(candidate), "sourceFiles": {name: sha((ROOT / name).read_text(encoding="utf-8")) for name in ["workspace.html", "workspace.css", "workspace.js"]}, "published": False, "wholeP7Complete": False, "wholeM3Complete": False}
(output / "p7-build-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print(json.dumps(manifest))
