"""Actual N4 forward residual integrals and point terms in the pressure/stress context."""

import argparse
import collections
from functools import lru_cache
from fractions import Fraction
import gzip
import hashlib
import json
from pathlib import Path
import sys

if not __debug__:
    raise RuntimeError("Source certificates require Python assertions to be enabled.")

parser = argparse.ArgumentParser()
for name in ("reached", "registry", "helper", "profile", "graph", "output"):
    parser.add_argument(name, type=Path)
parser.add_argument("--drop-physical-input", action="store_true")
parser.add_argument("--drop-upper-guards", action="store_true")
parser.add_argument("--drop-integral-facts", action="store_true")
args = parser.parse_args()


def pinned(path, digest):
    raw = path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == digest, path
    return raw


pinned(args.helper, "37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758")
sys.path.insert(0, str(args.helper.parent))
from native_reference_scopes import actual_children

data = json.loads(pinned(args.reached, "1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc"))
nodes = dict(data["nodes"])
bodies = dict(data["sourceBodies"])
registry = json.loads(pinned(args.registry, "049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad"))["base"]
expressions = json.loads(registry["expression"])
picard = json.loads(registry["picard"])
monotone = json.loads(registry["monotone"])
profile_raw = pinned(args.profile, "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a")
parameter_definitions = json.loads(profile_raw.decode().split("export const PINNED_N3 = ", 1)[1].strip()[:-1])["parametersExactExpressions"]
assert parameter_definitions["Xa"] == {"quotient": [{"integer": 4}, {"ref": "Lambda"}]}
assert parameter_definitions["Lambda"] == {"power": [{"ref": "Q"}, 64]}
assert parameter_definitions["t1"] == {"power": [{"ref": "CSelected"}, -120]}
assert parameter_definitions["CSelected"] == {"exp": {"ref": "logCSelected"}}
assert parameter_definitions["Pstar"] == {"exp": {"ref": "logP"}}
assert parameter_definitions["XR"] == {"product": [{"integer": 110},
    {"power": [{"product": [{"ref": "CSelected"}, {"ref": "Pstar"}]}, 10]}]}


def positive_parameter_expression(value):
    if "integer" in value:
        return int(value["integer"]) > 0
    if "ref" in value:
        return positive_parameter_expression(parameter_definitions[value["ref"]])
    if "exp" in value:
        return True
    if "product" in value or "quotient" in value:
        return all(positive_parameter_expression(x) for x in next(iter(value.values())))
    if "power" in value:
        return positive_parameter_expression(value["power"][0])
    return False


assert all(positive_parameter_expression({"ref": name}) for name in ("Xa", "XR", "t1", "Lambda"))
roots = [4587818, 4587828, 4587859, 4587867, 4588698, 4588705,
         4599038, 4599048, 4599058, 4599067, 4599170, 4599179, 4599188, 4599196]
assert nodes[4587654] == {"op": "actual_monotone_root", "args": [2, 4587637, 4587638]}
assert monotone[2]["left"] == 19 and monotone[2]["right"] == 24
assert nodes[19] == {"op": "rational", "args": ["1", "2"]}
assert nodes[24] == {"op": "rational", "args": ["2", "1"]}
assert nodes[4587658] == {"op": "multiply", "args": [4587655, 4587657]}
assert nodes[4587655] == {"op": "integer_power", "args": [4587636, 2]}
assert nodes[4587663] == {"op": "multiply", "args": [4587637, 4587662]}
expected_nodes = {
    0: ("rational", ["0", "1"]), 9: ("source_parameter", ["h"]), 20: ("rational", ["-1", "1"]),
    21: ("multiply", [9, 20]), 22: ("add", [19, 21]), 25: ("multiply", [9, 24]),
    4587645: ("integer_power", [4587637, 2]), 4587646: ("log_positive", [4587644]),
    4587647: ("multiply", [25, 4587646]), 4587648: ("exp", [4587647]),
    4587649: ("multiply", [4587645, 4587648]), 4587650: ("multiply", [20, 4587649]),
    4587651: ("add", [4587644, 4587650]), 4587652: ("multiply", [20, 4587638]),
    4587653: ("add", [4587651, 4587652]), 4587656: ("multiply", [24, 4587654]),
    4587657: ("inverse", [4587656]), 4587659: ("log_positive", [4587654]),
    4587660: ("multiply", [22, 4587659]), 4587661: ("exp", [4587660]),
    4587662: ("inverse", [4587661]),
    3617: ("source_parameter", ["Xa"]), 3612: ("source_parameter", ["t1"]),
    28816: ("rational", ["1", "64"]), 28817: ("multiply", [3612, 28816]),
    28818: ("exp", [28817]), 28819: ("multiply", [3617, 28818]),
    28820: ("rational", ["1", "32"]), 28821: ("multiply", [3612, 28820]),
    28822: ("exp", [28821]), 28823: ("multiply", [3617, 28822]),
    24802: ("rational", ["1", "16"]), 24803: ("multiply", [3612, 24802]),
    24804: ("exp", [24803]), 24805: ("multiply", [3617, 24804]),
}
for i, (op, av) in expected_nodes.items():
    assert nodes[i] == {"op": op, "args": av}, (i, nodes[i])
assert monotone[2]["body"] == 4587653 and monotone[2]["parameters"] == [4587637, 4587638]
graph_hash = hashlib.sha256()
endpoint = None
count = 0
with gzip.open(args.graph, "rb") as graph:
    line = graph.readline()
    graph_hash.update(line)
    assert json.loads(line)["node_count"] == 7358162
    for line in graph:
        graph_hash.update(line)
        if count == 24806:
            endpoint = json.loads(line)
        count += 1
assert count == 7358162
assert graph_hash.hexdigest() == "ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd"
assert endpoint == {"op": "sqrt_positive", "args": [24805]}
for root in roots:
    call = nodes[root]
    assert call["op"] == "actual_expression_partial"
    definition = expressions[call["args"][0]]
    mapping = dict(zip(definition["parameters"], call["args"][1]))
    assert mapping[4756] == 4587658 and mapping[2] == 4587663
residual_integrals = [
    (4598833, 4598830, 127213), (4598841, 4598838, 123842),
    (4598849, 4598846, 120792), (4598855, 4598854, 117049),
    (4598994, 4598992, 127222), (4599001, 4598999, 123851),
    (4599008, 4599006, 120801), (4599014, 4599013, 117055),
]
point_calls = [4599070, 4599199]
assert nodes[28814] == {"op": "multiply", "args": [3617, 28813]}
assert nodes[28813]["op"] == "exp"
residual_rows = []
for integral, call, coordinate in residual_integrals:
    node = nodes[integral]
    assert node["op"] == "definite_integral" and node["args"][1:] == [coordinate, 28814, 4587658]
    actual = nodes[call]
    assert actual["op"] == "actual_expression_partial" and actual["args"][1] == [coordinate, 4587663]
    definition = expressions[actual["args"][0]]
    assert definition["parameters"] == [4756, 2] and actual["args"][2] == [0, 0]
    residual_rows.append({"integral": integral, "call": call, "coordinate": coordinate,
        "definition": actual["args"][0], "definitionName": definition["name"], "sourceBody": definition["body"],
        "left": 28814, "right": 4587658})
for call, definition_id, body in ((4599070, 0, 117048), (4599199, 1, 117047)):
    assert nodes[call] == {"op": "actual_expression_partial",
                          "args": [definition_id, [4587658, 4587663], [0, 0]]}
    assert expressions[definition_id]["body"] == body
roots = [row[0] for row in residual_integrals] + point_calls

edges = {i: [(j, False) for j in actual_children(node) if j in nodes] +
         [(j, True) for j in bodies.get(i, []) if j in nodes] for i, node in nodes.items()}
descendants = set(roots)
queue = collections.deque(roots)
while queue:
    for child, _ in edges[queue.popleft()]:
        if child not in descendants:
            descendants.add(child)
            queue.append(child)
profiles = {i for i in descendants if nodes[i]["op"] == "actual_background_even_profile"}
parents = collections.defaultdict(list)
for i in descendants:
    for j, _ in edges[i]:
        parents[j].append(i)
ancestor = set(profiles)
queue = collections.deque(profiles)
while queue:
    for parent in parents[queue.popleft()]:
        if parent not in ancestor:
            ancestor.add(parent)
            queue.append(parent)
active = ancestor & descendants
coordinates = [i for i in sorted(nodes) if nodes[i]["op"] == "coordinate"]
bits = {i: 1 << k for k, i in enumerate(coordinates)}
upper_ids = set(coordinates) | {nodes[i]["args"][2] for i in profiles}
upper_ids |= {nodes[i]["args"][0] for i in active if nodes[i]["op"] == "smooth_piecewise"}
upper_bits = {i: 1 << k for k, i in enumerate(sorted(upper_ids))}
positive_parameters = {"Xa", "XR"}
positive_parameters_consumed = set()


@lru_cache(None)
def literal(i):
    node = nodes[i]
    if node["op"] == "rational":
        return Fraction(*map(int, node["args"]))
    return None


@lru_cache(None)
def nonnegative_requirements(i):
    node = nodes[i]
    op, av = node["op"], node["args"]
    value = literal(i)
    if value is not None:
        return 0 if value >= 0 else None
    if op == "coordinate":
        return bits[i]
    if op == "source_parameter" and av[0] in positive_parameters:
        positive_parameters_consumed.add(av[0])
        return 0
    if op in ("exp", "sqrt_positive"):
        return 0
    if op == "actual_monotone_root" and i == 4587654 and not args.drop_physical_input:
        return 0
    if op == "integer_power":
        return 0 if av[1] % 2 == 0 else nonnegative_requirements(av[0])
    if op == "inverse":
        return nonnegative_requirements(av[0])
    if op in ("multiply", "add"):
        result = 0
        for child in av:
            needed = nonnegative_requirements(child)
            if needed is None:
                return None
            result |= needed
        return result
    return None


def nonnegative(i, state):
    needed = nonnegative_requirements(i)
    return needed is not None and state[0] & needed == needed


def eta_in_range(i, state):
    value = literal(i)
    if value is not None:
        return -1 <= value <= 1
    if i == 4587663 and not args.drop_physical_input:
        return True
    return i in bits and bool(state[1] & bits[i])


def bounded_by_xcut(i, state):
    if i in upper_bits and state[2] & upper_bits[i]:
        return True
    if i in (0, 28819, 28823):
        return True
    node = nodes[i]
    if node["op"] == "multiply":
        a, b = node["args"]
        return (bounded_by_xcut(a, state) and nonnegative(b, state) and eta_in_range(b, state)
                or bounded_by_xcut(b, state) and nonnegative(a, state) and eta_in_range(a, state))
    return False


def transfer_native(i, state):
    node = nodes[i]
    op, av = node["op"], node["args"]
    if op == "actual_expression_partial":
        definition = expressions[av[0]]
        params, actual = definition["parameters"], av[1]
        assert len(params) == len(actual) and len(set(params)) == len(params)
        # Rebuild every coordinate fact on a native definition edge from
        # that call's actual parameters. Ambient formal facts are cleared.
        nn, eta, upper = 0, 0, 0
        for formal, actual in zip(params, actual):
            assert formal in bits
            if nonnegative(actual, state):
                nn |= bits[formal]
            if eta_in_range(actual, state):
                eta |= bits[formal]
            if bounded_by_xcut(actual, state):
                upper |= upper_bits[formal]
        return nn, eta, upper
    if op in ("actual_background_picard", "actual_background_even_profile"):
        definition = picard[av[0]]
        assert definition["eta"] == 2 and definition["radialDomain"] == [0, 24806]
        nn, eta = 0, 0
        if nonnegative(av[2], state):
            nn |= bits[definition["xi"]]
        if eta_in_range(av[3], state):
            eta |= bits[2]
        return nn, eta, 0
    if op == "actual_monotone_root":
        return state
    unresolved_native.add(op)
    return 0, 0, 0


known = {root: (0, 0, 0) for root in roots if root in active}
queue = collections.deque(known)
unresolved_native = set()
updates = 0
while queue:
    i = queue.popleft()
    state = known[i]
    node = nodes[i]
    op, av = node["op"], node["args"]
    for child, native in edges[i]:
        if child not in active:
            continue
        incoming = transfer_native(i, state) if native else state
        nn, eta, upper = incoming
        if op == "definite_integral" and child == av[0] and child not in av[2:]:
            coordinate, left, right = av[1:]
            assert coordinate in bits
            nn &= ~bits[coordinate]
            eta &= ~bits[coordinate]
            upper &= ~upper_bits[coordinate]
            if not args.drop_integral_facts and nonnegative(left, state) and nonnegative(right, state):
                nn |= bits[coordinate]
            lo, hi = literal(left), literal(right)
            if not args.drop_integral_facts and lo is not None and hi is not None and -1 <= lo <= hi <= 1:
                eta |= bits[coordinate]
            if not args.drop_integral_facts and bounded_by_xcut(left, state) and bounded_by_xcut(right, state):
                upper |= upper_bits[coordinate]
        if not args.drop_upper_guards and op == "smooth_piecewise":
            safe = []
            unsafe = [av[0], av[1], av[2], av[5]]
            for arm, bound in ((av[3], av[1]), (av[4], av[2])):
                (safe if bound in (28819, 28823) else unsafe).append(arm)
            if child in safe and child not in unsafe:
                upper |= upper_bits[av[0]]
        incoming = nn, eta, upper
        previous = known.get(child)
        new = incoming if previous is None else (previous[0] & nn, previous[1] & eta, previous[2] & upper)
        if previous != new:
            known[child] = new
            queue.append(child)
            updates += 1
failures = []
profile_rows = []
census = collections.Counter()
for i in sorted(profiles):
    av = nodes[i]["args"]
    state = known.get(i, (0, 0, 0))
    nn, eta = nonnegative(av[2], state), eta_in_range(av[3], state)
    upper = bounded_by_xcut(av[2], state)
    profile_rows.append({"call": i, "system": av[0], "component": av[1], "X": av[2], "eta": av[3],
                         "orders": av[4:], "nonnegativeX": nn, "etaInRange": eta, "upperXcut": upper})
    census["all" if nn and eta and upper else "missing_condition"] += 1
    if not nn or not eta or not upper:
        failures.append({"call": i, "system": av[0], "X": av[2], "eta": av[3],
                         "nonnegativeX": nn, "etaInRange": eta, "upperXcut": upper})
result = {
    "schema": "MathScope.Y.N4.ActualResidualIntegralInputFlow/1",
    "status": "PASS_ACTUAL_RESIDUAL_INTEGRAL_INPUT_FLOW" if not failures and not unresolved_native else "OPEN_RESIDUAL_INTEGRAL_INPUT_FLOW",
    "residualIntegralRoots": roots[:8], "pointCallRoots": point_calls, "residualRows": residual_rows,
    "sourceProfileDescendants": len(profiles), "activeAncestorNodes": len(active),
    "dataflowUpdates": updates, "coordinateFacts": len(bits), "census": dict(census),
    "failures": failures, "unresolvedNativeKinds": sorted(unresolved_native),
    "physicalInputDisabled": args.drop_physical_input,
    "upperGuardsDisabled": args.drop_upper_guards,
    "integralFactsDisabled": args.drop_integral_facts,
    "positiveParametersConsumed": sorted(positive_parameters_consumed),
    "profileRows": profile_rows,
    "nativeDefinitionFactsRebuiltFromActualParameters": True,
    "sourceGraphSHA256": graph_hash.hexdigest(),
    "sourceNodes": count,
    "originalRadiusEndpoint": {"id": 24806, "node": endpoint, "square": "Xa*exp(t1/16)"},
    "argumentConclusion": (
        f"At every one of the reached {len(profiles)} literal profile sites in these actual residual integrals and point terms, all inspected paths give 0<=X<=Xcut=Xa*exp(t1/32)<a^2 and |eta|<=1. Thus sqrt(X) is in the original [0,a] radial domain."
        if not failures and not unresolved_native else
        "Proof facts are deliberately withheld in this control. The recorded failures are unresolved abstract obligations, with no asserted counterexample to the original source."),
    "physicalPremises": ["the actual registered slow inverse is defined and selects a root in [1/2,2]",
        "physical normalized time T>=0", "original exponent 0<h<1/16"],
    "scope": "Eight original actual forward residual integral roots and two n=1 point calls in the N4 pressure/stress path. The integral endpoints are positive Xstart and nonnegative physical X, so interval nonnegativity holds for either orientation. The underlying physical source inverse and T>=0 premises are explicit. Actual source formal substitution, native partial derivatives, integrals and lazy guards are assumed to have their registered meanings. No all-order axial moment equality, Picard convergence, final pressure value or jet certification is asserted.",
    "release": "HOLD",
}
if args.drop_physical_input or args.drop_upper_guards or args.drop_integral_facts:
    result["status"] = "NEGATIVE_WITHHELD_SOURCE_FACTS"
result["checkerSHA256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
with args.output.open("x", encoding="utf8", newline="\n") as report:
    json.dump(result, report, indent=2)
    report.write("\n")
print(json.dumps({key: result[key] for key in ("status", "sourceProfileDescendants", "activeAncestorNodes", "census", "unresolvedNativeKinds")}))
