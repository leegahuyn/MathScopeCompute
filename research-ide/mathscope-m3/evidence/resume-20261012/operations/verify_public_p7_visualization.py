"""Read-only integrity verification of the published eight-criterion P7 view."""
from pathlib import Path
import hashlib
import importlib.util
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location("builder", ROOT / "web/build_visualization_patch.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
baseline = Path(sys.argv[1]).read_text(encoding="utf-8")
_, expected, manifest = builder.build(baseline)
url = "https://project29770.websitepublisher.ai/v0.3.1.html"
with urllib.request.urlopen(url, timeout=60) as response:
    public = response.read().decode("utf-8")
sha = lambda s: hashlib.sha256(s.encode()).hexdigest()


def block(html, pattern):
    values = re.findall(pattern, html, re.S)
    if len(values) != 1:
        raise ValueError("Expected exactly one published block: " + pattern)
    return values[0]


patterns = {name: '<script id="' + name + '"[^>]*>.*?</script>' for name in ["mathscope-m3-js", "p7-visual-models-js", "p7-visualization-js", "p7-visual-seeds", "p7-visual-controller-js", "mathscope-m2-js"]}
patterns["workspace-style"] = r'<style id="mathscope-m3-css">.*?</style>'
patterns["workspace-markup"] = r'(<section class="view m1 m3".*?)(?=<section class="view m1 m2")'
checks = []
for name, pattern in patterns.items():
    left, right = block(expected, pattern), block(public, pattern)
    check = {"block": name, "expectedSHA256": sha(left), "publicSHA256": sha(right), "bytesMatch": left == right, "matches": left == right}
    if name == "p7-visual-seeds":
        left_value = json.loads(left.split('>', 1)[1].rsplit('</script>', 1)[0])
        right_value = json.loads(right.split('>', 1)[1].rsplit('</script>', 1)[0])
        check["jsonValuesMatch"] = left_value == right_value
        check["matches"] = left_value == right_value
        check["normalization"] = "Publisher unescapes JSON Unicode sequences for less-than signs; exact parsed JSON values are compared separately from bytes."
    checks.append(check)
if not all(c["matches"] for c in checks):
    raise ValueError(json.dumps(checks))
result = {"schema": "MathScope.M3.P7VisualizationPublicIntegrity/1", "checkedAtUTC": datetime.now(timezone.utc).isoformat(), "url": url, "pageVersion": 83, "pageVersionHash": "f052cafd", "sourceCommit": "94a3a3fcc1feb04e6f3400c66ac7a670c4778342", "mainMergeCommit": "bb691a991a80e9181b790a1f41ce6a2d265e6c19", "expectedPageSHA256": sha(expected), "publicPageSHA256": sha(public), "allBlocksMatch": True, "blocks": checks, "localOnlyFaultInjectionAbsent": "p7vTestNoWebgl" not in public, "M2Preserved": True, "browserQAIsSeparate": True, "wholeP7Complete": False, "wholeM3Complete": False}
target = ROOT / "evidence/resume-20261012/visualization-3d/public-http-integrity.json"
target.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps({k: v for k, v in result.items() if k != "blocks"}))
