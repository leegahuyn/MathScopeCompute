"""Verify the exact Y bound for one generated native operand of #121999."""
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
parser.add_argument("--drop-binders", action="store_true")
parser.add_argument("--drop-guards", action="store_true")
parser.add_argument("--all-baseline-time", action="store_true")
args = parser.parse_args()
compressed = args.graph.read_bytes()
compressed_sha = hashlib.sha256(compressed).hexdigest()
assert compressed_sha == "a03d0431f725251e46c8d1d5331c52998fd3b94851ed5bb1b2888eb0ed3dd025"
data = json.loads(gzip.decompress(compressed))
nodes = dict(data["nodes"])
assert data["schema"] == "MathScope.Y.N4.B22SingleSiteMovingEndpoint/1"
assert data["graphSha"] == "ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd"
assert (data["caller"], data["system"], data["component"], data["X"], data["eta"], data["radialOrder"], data["etaOrder"]) == (121999, 3, 1, 120241, 2, 2, 1)
[target] = data["targets"]
root = data["expression"]
assert len(nodes) == 82848 and data["freshNaturalCount"] == 1221
assert nodes[target]["op"] == "actual_natural_series" and nodes[target]["args"][1:3] == [3845, 2]
assert nodes[3845] == {"op": "multiply", "args": [474, 3844]}
assert nodes[3844] == {"op": "exp", "args": [3843]}
assert nodes[3843] == {"op": "coordinate", "args": ["B22_U$33"]}
assert nodes[474] == {"op": "rational", "args": ["4", "1"]}
assert nodes[3612] == {"op": "source_parameter", "args": ["t1"]}
assert nodes[3617] == {"op": "source_parameter", "args": ["Xa"]}
assert nodes[3679] == {"op": "inverse", "args": [3617]}

target_times = {target: 3843}
if args.all_baseline_time:
    for i, n in nodes.items():
        if i <= data["prefixEnd"] or n["op"] != "actual_natural_series":
            continue
        y, eta = n["args"][1:3]
        expression = nodes[y]
        if expression["op"] != "multiply" or 474 not in expression["args"]:
            continue
        [exponential] = [j for j in expression["args"] if j != 474]
        if nodes[exponential]["op"] != "exp":
            continue
        [time] = nodes[exponential]["args"]
        if nodes[time]["op"] != "coordinate":
            continue
        assert eta == 2
        target_times[i] = time
    assert len(target_times) == 10


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
            return frozenset()
    if kind == "positive":
        if (q is not None and q > 0) or i in (3612, 3617, 3679):
            return frozenset()
        if op == "exp":
            return need("defined", a[0])
        for factor in (3617, 3679):
            j = other(i, factor)
            if j is not None:
                return need(kind, j)
    if kind == "unit":
        if q is not None and 0 <= q <= 1:
            return frozenset()
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
        if i in (data["X"], 3617):
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
                return frozenset().union(*(need("unit", j) for j in radial if j != roots[0]))
    return atom()


def obligations_under_guard(child_debts, arm, x, left, right):
    if args.drop_guards:
        return child_debts
    result = set(child_debts)
    if arm != 0 and ("positive", x) in result:
        cutoff = left if arm == 1 else right
        if not need("positive", cutoff):
            result.remove(("positive", x))
            events["guard_discharge_positive"] += 1
    if arm != 2:
        cutoff = left if arm == 0 else right
        for kind in ("radial", "log_radial", "time"):
            fact = (kind, x)
            alternative = need(kind, cutoff)
            if fact in result and not alternative:
                result.remove(fact)
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


obligations = {}
sealed = {}
events = Counter()
records = []
for i in sorted(nodes):
    op, a = node(i)
    edges = children(op, a)
    assert all(j < i and j in nodes for j in edges)
    sealed[i] = frozenset().union(*(sealed[j] for j in edges))
    if i in target_times:
        obligations[i] = set(need("time", target_times[i])).union(*(obligations[j] for j in edges))
    elif op == "definite_integral":
        body, variable, left, right = a
        body_debts = obligations[body]
        out = obligations[left] | obligations[right]
        for kind, identifier in body_debts:
            if identifier == variable and not args.drop_binders:
                reduced = need(kind, left) | need(kind, right)
                out.update(reduced)
                events["binder_endpoint_transfer"] += 1
                records.append([i, variable, left, right, kind, sorted(reduced)])
            elif not free_of(identifier, variable):
                sealed[i] = sealed[i] | {(i, kind, identifier)}
            else:
                out.add((kind, identifier))
        obligations[i] = out
    elif op == "smooth_piecewise":
        x, left, right, *branches = a
        out = obligations[x] | obligations[left] | obligations[right]
        for arm, branch in enumerate(branches):
            out.update(obligations_under_guard(obligations[branch], arm, x, left, right))
        obligations[i] = out
    else:
        obligations[i] = set().union(*(obligations[j] for j in edges))

remaining = sorted(obligations[root])
scoped = sorted(sealed[root])
receipt = {
    "status": "PASS_B22_MOVING_ENDPOINT" if not (remaining or scoped) else "OPEN_B22_MOVING_ENDPOINT",
    "source_caller": data["caller"],
    "generated_target": target,
    "selected_generated_targets_and_time_coordinates": sorted(target_times.items()),
    "graph_sha256": compressed_sha,
    "reached_nodes": len(nodes),
    "events": dict(sorted(events.items())),
    "endpoint_transfers": sorted(records),
    "open_root_obligations": [[kind, i, nodes[i]] for kind, i in remaining],
    "open_bound_obligations": [[binder, kind, identifier] for binder, kind, identifier in scoped],
    "negative_controls": {"without_binders": args.drop_binders, "without_guards": args.drop_guards},
}
args.receipt.write_bytes((json.dumps(receipt, indent=2) + "\n").encode())
print(json.dumps({**receipt, "endpoint_transfers": len(records)}))
