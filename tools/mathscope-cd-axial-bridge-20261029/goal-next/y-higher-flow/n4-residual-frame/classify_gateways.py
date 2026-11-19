"""Exact original root paths through the previously verified profile ingress gates."""
import argparse
import collections
import hashlib
import json
from pathlib import Path
import sys

if not __debug__:
    raise RuntimeError("Source certificates require Python assertions to be enabled.")

p = argparse.ArgumentParser()
for name in ("reached", "registry", "helper", "physical", "selector", "pressure", "output"):
    p.add_argument(name, type=Path)
a = p.parse_args()


def read(path, digest):
    raw = path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == digest
    return raw


read(a.helper, "37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758")
sys.path.insert(0, str(a.helper.parent))
from native_reference_scopes import actual_children

d = json.loads(read(a.reached, "1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc"))
n = dict(d["nodes"])
bodies = dict(d["sourceBodies"])
reg = json.loads(read(a.registry, "049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad"))["base"]
ex = json.loads(reg["expression"])
physical = json.loads(read(a.physical, "e2a30ba0678dbe201350865ef86d8066e0f3121a1891368695f8fdd8bce865e1"))
selector = json.loads(read(a.selector, "2a3793078d70f1e5310175c547366475c42459309f7c9c379f79f39a72e09c85"))
pressure = json.loads(read(a.pressure, "802fbb3512741de2416ae9d90b070db66eefe35280680f54d04885ca0e7aed52"))
assert physical["status"] == "PASS_ACTUAL_PHYSICAL_FRAME_INPUT_FLOW"
assert selector["status"] == "PASS_ACTUAL_SELECTOR_FRAME_INPUT_FLOW"
assert pressure["status"] == "PASS_ACTUAL_RESIDUAL_INTEGRAL_INPUT_FLOW"
profile_ids = {i for i, v in n.items() if v["op"] == "actual_background_even_profile"}
natural_ids = {row["id"] for row in d["calls"]}
assert len(profile_ids) == 259 and len(natural_ids) == 597
physical_gates = set(physical["physicalApplications"])
selector_gates = set(selector["selectorRoots"])
prior_gates = physical_gates | selector_gates
pressure_gates = set(pressure["residualIntegralRoots"]) | set(pressure["pointCallRoots"])
gates = prior_gates | pressure_gates
assert len(physical_gates) == 14 and len(selector_gates) == 5 and len(prior_gates) == 19
assert len(pressure_gates) == 10 and len(gates) == 29
assert {r["call"] for r in physical["profileRows"]} == {r["call"] for r in pressure["profileRows"]}
assert len(physical["profileRows"]) == len(pressure["profileRows"]) == 182
profile_bits = {i: 1 << k for k, i in enumerate(sorted(profile_ids))}
natural_bits = {i: 1 << k for k, i in enumerate(sorted(natural_ids))}
edges = {i: [j for j in actual_children(v) + bodies.get(i, []) if j in n] for i, v in n.items()}
reached, natural_reached, cut_reached, prior_cut_reached = {}, {}, {}, {}
for i in sorted(n):
    profile = profile_bits.get(i, 0)
    natural = natural_bits.get(i, 0)
    cut = profile
    prior_cut = profile
    for child in edges[i]:
        assert child < i
        profile |= reached.get(child, 0)
        natural |= natural_reached.get(child, 0)
        cut |= cut_reached.get(child, 0)
        prior_cut |= prior_cut_reached.get(child, 0)
    if profile:
        reached[i] = profile
    if natural:
        natural_reached[i] = natural
    if cut and i not in gates:
        cut_reached[i] = cut
    if prior_cut and i not in prior_gates:
        prior_cut_reached[i] = prior_cut
root_rows = []
for root in d["roots"]:
    profile_count = reached.get(root, 0).bit_count()
    escaped = [i for i in sorted(profile_ids) if cut_reached.get(root, 0) & profile_bits[i]]
    old_escaped = [i for i in sorted(profile_ids) if prior_cut_reached.get(root, 0) & profile_bits[i]]
    root_rows.append({"root": root, "profileSites": profile_count, "escapedProfileSites": escaped,
                      "beforePressureEscapedProfileSites": old_escaped})

physical_eta_calls = []
for i in sorted(n):
    v = n[i]
    if v["op"] != "actual_expression_partial" or not reached.get(i, 0) and not natural_reached.get(i, 0):
        continue
    definition = ex[v["args"][0]]
    mapping = dict(zip(definition["parameters"], v["args"][1]))
    if mapping.get(2) != 4587663:
        continue
    physical_eta_calls.append({"call": i, "definition": v["args"][0], "name": definition.get("name"),
        "parameters": definition["parameters"], "actual": v["args"][1], "orders": v["args"][2],
        "body": definition["body"], "profileDescendants": reached.get(i, 0).bit_count(),
        "naturalDescendants": natural_reached.get(i, 0).bit_count(),
        "sameXEtaGate": i in physical_gates})
assert len(physical_eta_calls) == 24
assert {r["call"] for r in physical_eta_calls} == physical_gates | {
    row["call"] for row in pressure["residualRows"]} | set(pressure["pointCallRoots"])

out = {"schema": "MathScope.Y.N4.OriginalProfileIngressGatewayClosure/1",
       "status": "PASS_PROFILE_GATEWAY_CLOSURE" if all(not row["escapedProfileSites"] for row in root_rows)
       else "OPEN_PROFILE_GATEWAY_CLOSURE",
       "profileSites": len(profile_ids), "physicalGates": sorted(physical_gates),
       "selectorGates": sorted(selector_gates), "pressureGates": sorted(pressure_gates), "rootRows": root_rows,
       "physicalEtaCalls": physical_eta_calls,
       "overlap": {"physicalLiteralProfileSites": 182, "pressureLiteralProfileSites": 182,
                   "sharedPhysicalPressureSiteIDs": 182, "selectorLiteralProfileSites": 259,
                   "verifiedInputGates": 29, "simultaneousPhysicalEtaApplications": 24},
       "checkerSHA256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
       "scope": "Exact finite typed graph paths and frame inventory. All original root-to-profile paths pass through the29 input gates from the three pinned domain receipts. Physical and pressure contexts use the same182 profile IDs with different actual argument frames. This closure is conditional on each receipt's source and physical premises. It does not establish outer indexed-frame physical image, derivative/limit semantics, runtime-generated nodes or actual field values.",
       "release": "HOLD"}
with a.output.open("x", encoding="utf8", newline="\n") as report:
    json.dump(out, report, indent=2)
    report.write("\n")
print(json.dumps({"status": out["status"], "physicalEtaCalls": len(physical_eta_calls),
                  "remainingPhysicalEtaOnlyCalls": [r for r in physical_eta_calls if not r["sameXEtaGate"]],
                  "rootEscapes": {r["root"]: len(r["escapedProfileSites"]) for r in root_rows}}))
