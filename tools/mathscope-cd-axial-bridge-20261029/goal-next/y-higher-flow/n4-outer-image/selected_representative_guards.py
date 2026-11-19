"""Actual local support guards before the original fixed representative inverse."""
import argparse
import collections
import hashlib
import json
from pathlib import Path
import sys

if not __debug__:
    raise RuntimeError("Exact source checks require Python assertions.")

p = argparse.ArgumentParser()
for key in ("reached", "registry", "helper", "output"):
    p.add_argument(key, type=Path)
p.add_argument("--drop-local-guards", action="store_true")
a = p.parse_args()


def read(path, pin):
    raw = path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == pin
    return raw


read(a.helper, "37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758")
sys.path.insert(0, str(a.helper.parent))
from native_reference_scopes import actual_children

d = json.loads(read(a.reached, "1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc"))
n, bs = dict(d["nodes"]), dict(d["sourceBodies"])
base = json.loads(read(a.registry, "049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad"))["base"]
expr = json.loads(base["expression"])
target = 4588852
assert n[target] == {"op": "actual_monotone_root", "args": [2, 4588838, 4588851]}
guards = {
    "shell": (4587658, 3617, 28826),
    "meshR": (4590112, 4590108, 120836),
    "meshZ": (4590147, 4590108, 120836),
    "meshT": (4590182, 4590108, 120836),
    "band": (4590076, 4590108, 120836),
}
assert n[4590108] == {"op": "rational", "args": ["-3", "4"]}
assert n[120836] == {"op": "rational", "args": ["3", "4"]}
keys = {signature: 1 << i for i, signature in enumerate(guards.values())}
reference_coordinates = {4587636, 4587637, 4587638, 4587625, 4588772, 4588773, 4588774}
edges = {i: [(j, False) for j in actual_children(v) if j in n] +
         [(j, True) for j in bs.get(i, []) if j in n] for i, v in n.items()}
parents = collections.defaultdict(list)
for i in n:
    for child, _ in edges[i]:
        parents[child].append(i)
ancestors = {target}
q = collections.deque([target])
while q:
    for i in parents[q.popleft()]:
        if i not in ancestors:
            ancestors.add(i)
            q.append(i)
known = {i: 0 for i in d["roots"] if i in ancestors}
q = collections.deque(known)
resets = collections.Counter()
updates = 0
while q:
    i = q.popleft()
    node, state = n[i], known[i]
    for child, native in edges[i]:
        if child not in ancestors:
            continue
        incoming = state
        if native:
            preserve = False
            if node["op"] == "actual_expression_partial":
                definition = expr[node["args"][0]]
                mapping = dict(zip(definition["parameters"], node["args"][1]))
                preserve = all(mapping.get(formal, formal) == formal for formal in reference_coordinates)
            if not preserve:
                incoming = 0
                resets[node["op"]] += 1
        av = node["args"]
        if (not a.drop_local_guards and node["op"] == "smooth_piecewise"
                and tuple(av[:3]) in keys and child == av[4]
                and child not in av[:4] and child != av[5]):
            assert av[3] == av[5] == 0
            incoming |= keys[tuple(av[:3])]
        previous = known.get(child)
        new = incoming if previous is None else previous & incoming
        if previous != new:
            known[child] = new
            q.append(child)
            updates += 1
mask = known.get(target, 0)
facts = {name: bool(mask & keys[signature]) for name, signature in guards.items()}
out = {
    "schema": "MathScope.Y.N4.SelectedRepresentativeGuardDominance/1",
    "status": "PASS_SELECTED_REPRESENTATIVE_ACTIVE_GUARDS" if all(facts.values()) else "OPEN_REPRESENTATIVE_GUARDS",
    "targetInverse": target, "targetArguments": n[target]["args"][1:],
    "allOriginalRootPaths": True, "ancestors": len(ancestors), "updates": updates,
    "guards": {name: list(signature) for name, signature in guards.items()},
    "factsAtInverse": facts, "nativeContextResets": dict(resets),
    "referenceCoordinates": sorted(reference_coordinates),
    "droppedLocalGuards": a.drop_local_guards,
    "scope": "Exact finite original paths before evaluating the selected representative inverse. Every native definition edge that rebinds a slow or label coordinate clears facts. The guards supply the current point's active shell, three mesh intervals and local band. Physical T>=0 and the actual local source inverse image, source lazy guards and exact native binding are premises for turning these facts into nonempty representative-box geometry.",
    "release": "HOLD", "checkerSHA256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
}
if a.drop_local_guards:
    out["status"] = "NEGATIVE_LOCAL_GUARDS_WITHHELD"
with a.output.open("x", encoding="utf8", newline="\n") as report:
    json.dump(out, report, indent=2)
    report.write("\n")
print(json.dumps({"status": out["status"], "facts": facts, "ancestors": len(ancestors),
                  "nativeContextResets": dict(resets)}))
