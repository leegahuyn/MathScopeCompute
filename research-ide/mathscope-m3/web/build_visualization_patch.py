"""Unique-anchor P7 3D update against the public v82 workspace, preserving M2."""
from pathlib import Path
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parent
SOURCE_NAMES = ["workspace.html", "workspace.css", "workspace.js", "p7-visualization.html", "p7-visualization.css", "p7-visualization.js", "p7-visual-models.js", "p7-visual-controller.js", "p7-visual-seeds.json"]


def build(original):
    patches = []
    candidate = original

    def patch(find, replace):
        nonlocal candidate
        if candidate.count(find) != 1:
            raise ValueError("Expected exactly one anchor: " + find[:90])
        patches.append({"operation": "replace", "find": find, "replace": replace})
        candidate = candidate.replace(find, replace, 1)

    def source(name):
        return (ROOT / name).read_text(encoding="utf-8")

    def block(pattern):
        matches = re.findall(pattern, original, re.S)
        if len(matches) != 1:
            raise ValueError("Expected one source block: " + pattern)
        return matches[0]

    controls = '''<div class="p7v-source-controls"><p id="p7v-source-state" role="status" aria-live="polite">저장된 실행 예제를 준비합니다.</p><label for="p7v-run-source">현재 조건의 실행 예제</label><select id="p7v-run-source"></select><button type="button" id="p7v-load-request">이 예제의 계산 입력 불러오기</button><a id="p7v-original-record" target="_blank" rel="noopener noreferrer">GitHub 원본 기록 ↗</a><p id="p7v-load-status" role="status" aria-live="polite"></p></div>'''
    visual = source("p7-visualization.html").replace('<div class="p7v-tabs"', controls + '\n  <div class="p7v-tabs"', 1)
    workspace = source("workspace.html").replace("<!-- P7_VISUALIZATION -->", visual)
    old_section = block(r'(<section class="view m1 m3".*?)(?=<section class="view m1 m2")')
    patch(old_section, workspace + "\n")
    patch(block(r'<style id="mathscope-m3-css">.*?</style>'), '<style id="mathscope-m3-css">\n' + source("workspace.css") + '\n' + source("p7-visualization.css") + '\n</style>')
    scripts = []
    for element_id, name in [("mathscope-m3-js", "workspace.js"), ("p7-visual-models-js", "p7-visual-models.js"), ("p7-visualization-js", "p7-visualization.js")]:
        scripts.append('<script id="' + element_id + '">\n' + source(name).replace('</script', '<\\/script') + '\n</script>')
    seeds = json.loads(source("p7-visual-seeds.json"))
    scripts.append('<script id="p7-visual-seeds" type="application/json">' + json.dumps(seeds, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c') + '</script>')
    scripts.append('<script id="p7-visual-controller-js">\n' + source("p7-visual-controller.js").replace('</script', '<\\/script') + '\n</script>')
    patch(block(r'<script id="mathscope-m3-js">.*?</script>'), '\n'.join(scripts))
    m2 = block(r'<script id="mathscope-m2-js">.*?</script>')
    if candidate.count(m2) != 1:
        raise ValueError("M2 script changed")
    sha = lambda s: hashlib.sha256(s.encode()).hexdigest()
    return patches, candidate, {"schema": "MathScope.M3.P7VisualizationPatch/1", "baseVersion": 82, "baseVersionHash": "36834e2c", "patchCount": len(patches), "newPages": 0, "newAssets": 0, "baselineSHA256": sha(original), "candidateSHA256": sha(candidate), "M2ScriptSHA256": sha(m2), "sources": {name: sha(source(name)) for name in SOURCE_NAMES}, "proofStatusPromoted": False, "wholeP7Complete": False, "wholeM3Complete": False}


if __name__ == "__main__":
    original = Path(sys.argv[1]).read_text(encoding="utf-8")
    output = Path(sys.argv[2])
    output.mkdir(parents=True, exist_ok=True)
    patches, candidate, manifest = build(original)
    (output / "p7-3d-patches.json").write_text(json.dumps(patches, ensure_ascii=False, indent=2), encoding="utf-8")
    (output / "p7-3d-build.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    if "--candidate" in sys.argv[3:]:
        (output / "v0.3.1.p7-3d.html").write_text(candidate, encoding="utf-8")
    print(json.dumps(manifest))
