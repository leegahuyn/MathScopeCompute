"""Transport C72's exact range proof on pinned original N4 materializations."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from functools import lru_cache
import gzip
import hashlib
import json
from pathlib import Path


parser = ArgumentParser()
parser.add_argument("graph", type=Path)
parser.add_argument("receipt", type=Path)
parser.add_argument("manifest", type=Path)
parser.add_argument("ingress", type=Path)
parser.add_argument("lower", type=Path)
parser.add_argument("--drop-binders", action="store_true")
parser.add_argument("--drop-guards", action="store_true")
parser.add_argument("--drop-radial-frame", action="store_true")
parser.add_argument("--include-native-ingress", action="store_true")
args = parser.parse_args()
compressed = args.graph.read_bytes()
compressed_sha = hashlib.sha256(compressed).hexdigest()
manifest_bytes = args.manifest.read_bytes()
manifest = json.loads(manifest_bytes)
[entry] = [r for r in manifest["manifest"] if r["file"] == args.graph.name]
assert compressed_sha == entry["sha256"]
caller = entry["caller"]
system, component, X, eta, radial_order, eta_order = entry["savedArgs"]
assert manifest["system"] == system and caller not in manifest["originalPreviouslyChecked"]
assert len(manifest["originalPreviouslyChecked"]) == 41 and manifest["originalCount"] == 112
data = json.loads(gzip.decompress(compressed))
nodes = dict(data["nodes"])
assert data["schema"] == "MathScope.Y.N4.HigherSiteArguments/2"
assert data["graphSha"] == "ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd"
assert data["nodeCount"] == 7358162 and data["prefixEnd"] == 130347
assert data["caller"] == caller
assert [data[key] for key in ("system", "component", "X", "eta", "radialOrder", "etaOrder")] == entry["savedArgs"]
assert eta == 2 and radial_order in (1, 2) and eta_order in (0, 1, 2)
root = data["expression"]
assert root == entry["expression"] and len(nodes) == entry["reached"]
assert data["freshNaturalCount"] == entry["freshNaturalCount"]
native_operators = {row["op"] for row in nodes.values() if row["op"].startswith("actual_")}
assert native_operators <= {"actual_natural_series", "actual_background_even_profile", "actual_background_picard"}
for i, expected in {
    474: {"op": "rational", "args": ["4", "1"]},
    3612: {"op": "source_parameter", "args": ["t1"]},
    3617: {"op": "source_parameter", "args": ["Xa"]},
    3679: {"op": "inverse", "args": [3617]},
    3454: {"op": "source_parameter", "args": ["Lambda"]},
}.items():
    if i in nodes:
        assert nodes[i] == expected
ingress_raw = args.ingress.read_bytes()
ingress_sha = hashlib.sha256(ingress_raw).hexdigest()
assert ingress_sha == "54ef4870cf5a839a54b770b55a03e5deb7b8065f0e8eb291e769c3fe63d1cd0a"
lower_raw = args.lower.read_bytes()
lower_sha = hashlib.sha256(lower_raw).hexdigest()
assert lower_sha == "27448911ef14d62c722dbac2e611a5e661729adb561e6c7ae0159c4a15dcb806"
top = [g for g in json.loads(ingress_raw)["groups"] if caller in g["calls"]]
lower = [(s, g) for s in json.loads(lower_raw)["systems"] for g in s["groups"] if caller in g["calls"]]
assert len(top) + len(lower) == 1
if top:
    [source_ingress] = top
    assert (source_ingress["system"], source_ingress["argument"]) == (system, X)
    assert source_ingress["allMatchingGuardAndBinderPaths"] is True
    binder = source_ingress["binder"]
    if binder is None:
        assert X == 4756 and nodes[X] == {"op": "coordinate", "args": ["X"]}
    else:
        assert nodes[X]["op"] == "multiply" and set(nodes[X]["args"]) == {4756, binder}
    ingress_kind = "original top caller"
else:
    [(owner, source_ingress)] = lower
    assert (source_ingress["lowerSystem"], source_ingress["radialArgument"]) == (system, X)
    assert source_ingress["unguardedCalls"] == 0
    square = nodes[X]
    binder = source_ingress["unitBinder"]
    if binder is not None:
        assert source_ingress["unboundCalls"] == 0 and square["op"] == "multiply" and binder in square["args"]
        [square_id] = [i for i in square["args"] if i != binder]
        square = nodes[square_id]
    assert square == {"op": "integer_power", "args": [owner["xi"], 2]}
    ingress_kind = "original lower-system coefficient caller"
natural_targets = {
    i: n["args"][1]
    for i, n in nodes.items()
    if n["op"] == "actual_natural_series"
}
fresh_natural = {i for i in natural_targets if i > data["prefixEnd"]}
inherited_natural = set(natural_targets) - fresh_natural
assert len(fresh_natural) == data["freshNaturalCount"]
assert all(nodes[i]["args"][2] == 2 for i in natural_targets)
native_targets = {}
native_kinds = {}
if args.include_native_ingress:
    for i, row in nodes.items():
        if row["op"] == "actual_background_even_profile":
            assert row["args"][0] in (0, 3, 5) and row["args"][0] < system and row["args"][3] == 2
            native_targets[i] = row["args"][2]
            native_kinds[i] = "scaled_square"
        if row["op"] == "actual_background_picard":
            assert row["args"][0] == system and row["args"][3] == 2
            native_targets[i] = row["args"][2]
            native_kinds[i] = "scaled_radius"
targets = natural_targets | native_targets
target_ids = sorted(targets)
target_bits = {i: 1 << index for index, i in enumerate(target_ids)}


def node(i):
    row = nodes[i]
    return row["op"], row["args"]


def children(op, a):
    if op in ("coordinate", "rational", "source_parameter"):
        return []
    if op in ("integer_power", "source_step_derivative"):
        return a[:1]
    if op == "actual_natural_series":
        return a[1:3]
    if op in ("actual_background_picard", "actual_background_even_profile"):
        return a[2:4]
    if op == "actual_expression_partial":
        return a[1]
    if op == "actual_quadratic_root":
        return a[2:]
    if op == "actual_monotone_root":
        return a[1:]
    if op == "definite_integral":
        return [a[0], a[2], a[3]]
    return a


def literal(i):
    op, values = node(i)
    return Fraction(*map(int, values)) if op == "rational" else None


def other(i, factor):
    op, values = node(i)
    if op == "multiply" and factor in values:
        return values[1] if values[0] == factor else values[0]
    return None


def product_factors(i):
    op, values = node(i)
    return tuple(factor for j in values for factor in product_factors(j)) if op == "multiply" else (i,)


@lru_cache(None)
def need(kind, i):
    """Decompose a sufficient property into exact operand obligations."""
    op, a = node(i)
    q = literal(i)
    def atom():
        return frozenset({(kind, i)})

    if kind == "defined":
        if op in ("coordinate", "rational", "source_parameter"):
            return frozenset()
        if op in ("multiply", "add", "exp") or (op == "integer_power" and a[1] >= 0):
            return frozenset().union(*(need(kind, j) for j in children(op, a)))
        if op == "log_positive":
            return need("defined", a[0]) | need("positive", a[0])
        if op == "inverse" and a[0] == 3617:
            return frozenset()
        if op == "sqrt_positive" and a[0] == data["X"]:
            return need("nonnegative", a[0])
    if kind in ("positive", "nonnegative"):
        if (q is not None and (q > 0 or q == 0 and kind == "nonnegative")) or i in (3454, 3612, 3617, 3679):
            return frozenset()
        if i == data["X"] and kind == "nonnegative" and not args.drop_radial_frame:
            return frozenset()
        if op == "exp":
            return need("defined", a[0])
        if op == "integer_power" and a[1] >= 0 and a[1] % 2 == 0 and kind == "nonnegative":
            return need("defined", a[0])
        for factor in (474, 3454, 3617, 3679):
            j = other(i, factor)
            if j is not None:
                return need(kind, j)
    if kind == "Y_upper":
        if q is not None and q <= 4:
            return frozenset()
        j = other(i, 3454)
        if j is not None:
            return need("radial", j)
        e = other(i, 474)
        if e is not None and node(e)[0] == "exp":
            return need("time", node(e)[1][0])
    if kind == "unit":
        if q is not None and 0 <= q <= 1:
            return frozenset()
    if kind == "caller_domain" and i == data["X"] and not args.drop_radial_frame:
        return frozenset()
    if kind == "scaled_radius":
        factors = product_factors(i)
        roots = [j for j in factors if node(j) == ("sqrt_positive", [data["X"]])]
        if len(roots) == 1:
            return need("caller_domain", data["X"]).union(*(need("unit", j) for j in factors if j != roots[0]))
    if kind == "scaled_square":
        factors = product_factors(i)
        squares = [j for j in factors if node(j)[0] == "integer_power" and node(j)[1][1] == 2]
        if len(squares) == 1:
            return need("scaled_radius", node(squares[0])[1][0]).union(*(need("unit", j) for j in factors if j != squares[0]))
    if kind == "time":
        if i == 3612 or (q is not None and q <= 0):
            return frozenset()
        scale = other(i, 3612)
        if scale is not None and literal(scale) is not None and literal(scale) <= 2:
            return frozenset()
        if op == "log_positive":
            j = other(a[0], 3679)
            if j is not None:
                return need("radial", j) | need("defined", i)
    if kind == "log_radial" and op == "log_positive":
        return need("radial", a[0]) | need("defined", i)
    if kind == "radial":
        if i == 3617 or i == data["X"] and not args.drop_radial_frame:
            return frozenset()
        e = other(i, 3617)
        if e is not None and node(e)[0] == "exp":
            return need("time", node(e)[1][0])
        if op == "exp":
            return need("log_radial", a[0])
        if op == "integer_power" and a[1] == 2:
            radial = product_factors(a[0])
            roots = [j for j in radial if node(j) == ("sqrt_positive", [data["X"]])]
            if len(roots) == 1:
                return need("radial", data["X"]).union(*(need("unit", j) for j in radial if j != roots[0]))
    return atom()


def obligations_under_guard(child_debts, arm, x, left, right):
    if args.drop_guards:
        return child_debts
    result = dict(child_debts)
    if arm != 0:
        cutoff = left if arm == 1 else right
        for kind in ("positive", "nonnegative"):
            fact = (kind, x)
            if fact in result and not need(kind, cutoff):
                result.pop(fact)
                events["guard_discharge_" + kind] += 1
    if arm != 2:
        cutoff = left if arm == 0 else right
        for kind in ("radial", "log_radial", "time", "Y_upper"):
            fact = (kind, x)
            if fact in result and not need(kind, cutoff):
                result.pop(fact)
                events["guard_discharge_upper"] += 1
    return result


@lru_cache(None)
def free_of(i, variable):
    if i == variable:
        return False
    op, a = node(i)
    if op == "definite_integral":
        body, binder, left, right = a
        return free_of(left, variable) and free_of(right, variable) and (binder == variable or free_of(body, variable))
    return all(free_of(j, variable) for j in children(op, a))


def union(*parts):
    out = {}
    for part in parts:
        for condition, bits in part.items():
            out[condition] = out.get(condition, 0) | bits
    return out


def append(out, conditions, bits):
    for condition in conditions:
        out[condition] = out.get(condition, 0) | bits


obligations = {}
scoped = {}
events = Counter()
records = []
for i in sorted(nodes):
    op, a = node(i)
    edges = children(op, a)
    assert all(j < i and j in nodes for j in edges)
    if i in targets:
        y = targets[i]
        if i in native_kinds:
            seed = need(native_kinds[i], y)
        else:
            seed = need("Y_upper", y) | need("nonnegative", y) | need("defined", y)
        obligations[i] = union(*(obligations[j] for j in edges))
        append(obligations[i], seed, target_bits[i])
    elif op == "definite_integral":
        body, variable, left, right = a
        body_debts = obligations[body]
        out = union(obligations[left], obligations[right])
        for (kind, identifier), bits in body_debts.items():
            if identifier == variable and not args.drop_binders:
                reduced = need(kind, left) | need(kind, right)
                append(out, reduced, bits)
                events["binder_endpoint_transfer"] += 1
                records.append([i, variable, left, right, kind, sorted(reduced), bits.bit_count()])
            elif not free_of(identifier, variable):
                append(scoped, [(i, kind, identifier)], bits)
            else:
                append(out, [(kind, identifier)], bits)
        obligations[i] = out
    elif op == "smooth_piecewise":
        x, left, right, *branches = a
        arms = (obligations_under_guard(obligations[branch], arm, x, left, right) for arm, branch in enumerate(branches))
        obligations[i] = union(obligations[x], obligations[left], obligations[right], *arms)
    else:
        obligations[i] = union(*(obligations[j] for j in edges))

remaining = obligations[root]
all_open = 0
for bits in (*remaining.values(), *scoped.values()):
    all_open |= bits
closed_ids = [i for i in target_ids if not all_open & target_bits[i]]
open_ids = [i for i in target_ids if all_open & target_bits[i]]
closed_natural_ids = [i for i in closed_ids if i in natural_targets]
open_natural_ids = [i for i in open_ids if i in natural_targets]


def shape(y):
    op, a = node(y)
    if op != "multiply":
        return op
    for factor in (474, 3454):
        other_factor = other(y, factor)
        if other_factor is not None:
            return f"{factor}*{node(other_factor)[0]}"
    return op


receipt = {
    "status": "PASS_ALL_HIGHER_FAMILY_ARGUMENTS" if not open_ids else "PARTIAL_HIGHER_FAMILY_ARGUMENTS",
    "source_caller": data["caller"],
    "source_system": system,
    "source_saved_args": entry["savedArgs"],
    "source_ingress_kind": ingress_kind,
    "graph_sha256": compressed_sha,
    "caller_ingress_receipt_sha256": ingress_sha,
    "lower_ingress_receipt_sha256": lower_sha,
    "manifest_sha256": hashlib.sha256(manifest_bytes).hexdigest(),
    "reached_nodes": len(nodes),
    "fresh_natural_targets": len(fresh_natural),
    "inherited_natural_targets": len(inherited_natural),
    "certified_natural_targets": len(closed_natural_ids),
    "certified_fresh_natural_targets": len(fresh_natural.intersection(closed_natural_ids)),
    "certified_inherited_natural_targets": len(inherited_natural.intersection(closed_natural_ids)),
    "open_natural_targets": len(open_natural_ids),
    "certified_natural_shapes": dict(Counter(shape(targets[i]) for i in closed_natural_ids)),
    "open_natural_shapes": dict(Counter(shape(targets[i]) for i in open_natural_ids)),
    "fresh_native_ingress_targets": dict(Counter(native_kinds.values())),
    "certified_native_ingress_targets": dict(Counter(native_kinds[i] for i in closed_ids if i in native_kinds)),
    "open_native_ingress_targets": dict(Counter(native_kinds[i] for i in open_ids if i in native_kinds)),
    "events": dict(events),
    "endpoint_transfers": records,
    "certified_target_ids": closed_ids,
    "open_target_ids": open_ids,
    "open_root_obligations": [[kind, i, nodes[i], bits.bit_count()] for (kind, i), bits in sorted(remaining.items())],
    "open_bound_obligations": [[binder, kind, identifier, bits.bit_count()] for (binder, kind, identifier), bits in sorted(scoped.items())],
    "negative_controls": {
        "without_binders": args.drop_binders,
        "without_guards": args.drop_guards,
        "without_radial_frame": args.drop_radial_frame,
    },
}
args.receipt.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf8")
print(json.dumps({k: v for k, v in receipt.items() if k not in (
    "endpoint_transfers", "certified_target_ids", "open_target_ids", "open_root_obligations", "open_bound_obligations"
)}, indent=2))
