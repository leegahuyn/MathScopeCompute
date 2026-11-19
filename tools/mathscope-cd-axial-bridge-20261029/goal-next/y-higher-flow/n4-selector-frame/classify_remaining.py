"""Locate the unaccounted N4 literal profiles in actual original root families."""
import argparse
import collections
import hashlib
import json
from pathlib import Path
import sys

p = argparse.ArgumentParser()
for name in ("reached", "helper", "covered", "output"):
    p.add_argument(name, type=Path)
a = p.parse_args()


def read(path, digest):
    b = path.read_bytes()
    assert hashlib.sha256(b).hexdigest() == digest
    return b


read(a.helper, "37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758")
sys.path.insert(0, str(a.helper.parent))
from native_reference_scopes import actual_children

d = json.loads(read(a.reached, "1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc"))
n = dict(d["nodes"])
bodies = dict(d["sourceBodies"])
covered = json.loads(read(a.covered, "e2a30ba0678dbe201350865ef86d8066e0f3121a1891368695f8fdd8bce865e1"))
assert covered["status"] == "PASS_ACTUAL_PHYSICAL_FRAME_INPUT_FLOW"
prior = {r["call"] for r in covered["profileRows"]}
profiles = {i for i, node in n.items() if node["op"] == "actual_background_even_profile"}
remaining = profiles - prior
assert len(profiles) == 259 and len(prior) == 182 and len(remaining) == 77
target_bits = {i: 1 << k for k, i in enumerate(sorted(remaining))}
edges = {i: [j for j in actual_children(node) + bodies.get(i, []) if j in n] for i, node in n.items()}
reached = {}
cut_fifth_selector = {}
for i in sorted(n):
    value = target_bits.get(i, 0)
    cut_value = target_bits.get(i, 0)
    for child in edges[i]:
        assert child < i
        value |= reached.get(child, 0)
        cut_value |= cut_fifth_selector.get(child, 0)
    if value:
        reached[i] = value
    if cut_value and i != 4582351:
        cut_fifth_selector[i] = cut_value
rows = []
for root in d["roots"]:
    mask = reached.get(root, 0)
    targets = [i for i in sorted(remaining) if mask & target_bits[i]]
    cut_targets = [i for i in sorted(remaining) if cut_fifth_selector.get(root, 0) & target_bits[i]]
    rows.append({"root": root, "node": n[root], "remainingProfiles": len(targets),
                 "targets": targets, "afterCutFifthSelector": len(cut_targets)})
selector_roots = d["roots"][-5:]
assert selector_roots == [4582068, 4582117, 4582180, 4582258, 4582351]
selector_union = 0
for root in selector_roots:
    selector_union |= reached.get(root, 0)
selector_targets = [i for i in sorted(remaining) if selector_union & target_bits[i]]
assert len(selector_targets) == 77
assert all(row["afterCutFifthSelector"] == 0 for row in rows)
out = {"schema": "MathScope.Y.N4.RemainingOriginalProfileRootClassification/1",
       "status": "VERIFIED_EXACT_REMAINING_PROFILE_ROOT_INVENTORY",
       "allOriginalProfiles": len(profiles), "priorPhysicalProfiles": len(prior),
       "remainingProfiles": len(remaining), "remainingBySystem": dict(collections.Counter(n[i]["args"][0] for i in remaining)),
       "rootRows": rows, "selectorRoots": selector_roots, "remainingBelowSelectorRoots": len(selector_targets),
       "remainingOutsideSelectorRoots": sorted(remaining - set(selector_targets)),
       "scope": "Exact source descendant inventory only. A source root path does not establish input domains or selected guards.",
       "release": "HOLD"}
a.output.write_text(json.dumps(out, indent=2) + "\n", encoding="utf8")
print(json.dumps({k: out[k] for k in ("status", "remainingBySystem", "remainingBelowSelectorRoots", "remainingOutsideSelectorRoots")}))
