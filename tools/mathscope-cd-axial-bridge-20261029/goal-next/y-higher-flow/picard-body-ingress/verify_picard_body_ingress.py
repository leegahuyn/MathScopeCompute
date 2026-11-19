"""Prove real input bounds in the ten original N4 Picard coefficient bodies."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from functools import cache
import gzip
from hashlib import sha256
from itertools import chain
import json
from pathlib import Path
import sys


STREAM_HASH = "ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd"
REGISTRY_HASH = "049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad"
HELPER_HASH = "37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758"
LOWER_HASH = "27448911ef14d62c722dbac2e611a5e661729adb561e6c7ae0159c4a15dcb806"
ACTUAL_SYSTEMS = (0, 3, 5, 7, 9)
AUXILIARY_SYSTEMS = (1, 2, 4, 6, 8)
XA, LAMBDA, T1 = 3617, 3454, 3612


def read_pinned(path, pin):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == pin, path
    return json.loads(data)


def read_original(archive):
    registry = read_pinned(archive / "original-source-functions.json", REGISTRY_HASH)
    base = registry
    while "picard" not in base:
        base = base["base"]
    systems = json.loads(base["picard"])
    assert len(systems) == 10
    digest = sha256()
    nodes = []
    with gzip.open(archive / "original-source-nodes.jsonl.gz", "rb") as graph:
        header = next(graph)
        digest.update(header)
        assert json.loads(header)["node_count"] == 7358162
        for index, line in enumerate(graph):
            digest.update(line)
            if index <= 130347:
                nodes.append(json.loads(line))
    assert index + 1 == 7358162 and digest.hexdigest() == STREAM_HASH
    return nodes, systems


def audit(nodes, systems, actual_children, old_lower, system_id, control):
    system = systems[system_id]
    xi = system["xi"]
    assert system["eta"] == 2
    assert system["diagonal"] == [0, 0, 2, 0, 3, 1]
    assert system["radialDomain"][0] == 0
    auxiliary = system_id in AUXILIARY_SYSTEMS
    assert system["order"] == (AUXILIARY_SYSTEMS if auxiliary else ACTUAL_SYSTEMS).index(system_id) + 1
    assert (system.get("kind") == "auxiliary") == auxiliary
    assert system.get("kind") == (None if system_id == 0 else ("auxiliary" if auxiliary else "actual"))
    assert nodes[xi]["op"] == "coordinate"
    assert len(system["A0"]) == len(system["A1"]) == len(system["forcing"]) == 6
    roots = set(chain(*system["A0"], *system["A1"], system["forcing"]))
    reachable = set()
    pending = list(roots)
    while pending:
        index = pending.pop()
        if index not in reachable:
            reachable.add(index)
            children = actual_children(nodes[index])
            assert all(child < index for child in children)
            pending.extend(children)

    def node(index):
        row = nodes[index]
        return row["op"], row["args"]

    @cache
    def literal(index):
        op, args = node(index)
        return Fraction(*map(int, args)) if op == "rational" else None

    @cache
    def factors(index):
        op, args = node(index)
        if op == "multiply":
            return tuple(chain.from_iterable(factors(child) for child in args))
        return (index,)

    def divide_factor(index, fixed_factor):
        op, args = node(index)
        if op == "multiply" and len(args) == 2 and fixed_factor in args:
            return args[1] if args[0] == fixed_factor else args[0]
        return None

    assert node(2) == ("coordinate", ["eta"])
    assert node(474) == ("rational", ["4", "1"])
    assert node(3679) == ("inverse", [XA])
    assert node(XA) == ("source_parameter", ["Xa"])
    assert node(LAMBDA) == ("source_parameter", ["Lambda"])
    assert node(T1) == ("source_parameter", ["t1"])
    assert node(24806) == ("sqrt_positive", [24805])
    assert node(24805) == ("multiply", [XA, 24804])
    op, (time,) = node(24804)
    assert op == "exp" and literal(divide_factor(time, T1)) == Fraction(1, 16)
    if auxiliary:
        op, (r_squared,) = node(system["radialDomain"][1])
        assert op == "sqrt_positive"
        # The exact real radial a_n^2 is r_n/Lambda. All nodes used below
        # have this fixed radial domain, not the actual cutoff collar.
        op, children = node(r_squared)
        assert op == "multiply" and len(children) == 2
        [natural_radius] = [child for child in children if literal(child) is not None]
        [reciprocal] = [child for child in children if child != natural_radius]
        assert node(reciprocal) == ("inverse", [LAMBDA])
        assert literal(natural_radius) == Fraction(6) + Fraction(1, 2 ** (system["order"] - 1))
    else:
        assert system["radialDomain"] == [0, 24806]

    natural = {
        index: nodes[index]["args"][1] for index in reachable
        if nodes[index]["op"] == "actual_natural_series"
    }
    assert all(nodes[index]["args"][2] == 2 for index in natural)
    lower = {
        index: nodes[index]["args"] for index in reachable
        if nodes[index]["op"] == "actual_background_even_profile"
    }
    other_native = {
        nodes[index]["op"] for index in reachable if nodes[index]["op"].startswith(("actual_", "m3_"))
    } - {"actual_natural_series", "actual_background_even_profile"}
    assert not other_native, other_native
    if not auxiliary:
        assert set(lower) == old_lower[system_id]
    for target, component, radial, eta, _, _ in lower.values():
        assert 0 <= component <= 3 and eta == 2
        assert systems[target]["order"] < system["order"]
        assert (target in AUXILIARY_SYSTEMS) == auxiliary
        if auxiliary:
            assert node(radial) == ("integer_power", [xi, 2])
    debts = {}
    events = Counter()
    escaped_scope = set()

    @cache
    def need(kind, index):
        op, args = node(index)
        q = literal(index)
        unresolved = frozenset({(kind, index)})
        if kind == "defined":
            if op in ("coordinate", "source_parameter", "rational"):
                return frozenset()
            if op in ("multiply", "add", "exp") or (op == "integer_power" and args[1] >= 0):
                return merge(need("defined", j) for j in actual_children(nodes[index]))
            if op == "log_positive":
                return need("positive", args[0]) | need("defined", args[0])
            if index == 3679:
                return frozenset()
        if kind in ("positive", "nonnegative"):
            if (q is not None and (q > 0 or (q == 0 and kind == "nonnegative"))) or index in (XA, T1, LAMBDA, 3679):
                return frozenset()
            if index == xi and kind == "nonnegative" and control != "radius":
                return frozenset()
            if op == "exp":
                return need("defined", args[0])
            if op == "integer_power" and args[1] >= 0 and args[1] % 2 == 0 and kind == "nonnegative":
                return need("defined", args[0])
            for factor in (474, XA, LAMBDA, 3679):
                other = divide_factor(index, factor)
                if other is not None:
                    return need(kind, other)
        if kind == "unit" and q is not None and 0 <= q <= 1:
            return frozenset()
        if kind == "Y_upper":
            if q is not None and q <= 4:
                return frozenset()
            other = divide_factor(index, LAMBDA)
            if other is not None:
                return need("radial", other)
            other = divide_factor(index, 474)
            if other is not None and node(other)[0] == "exp":
                return need("time", node(other)[1][0])
        if kind == "time":
            if index == T1 or (q is not None and q <= 0):
                return frozenset()
            coefficient = divide_factor(index, T1)
            if coefficient is not None and literal(coefficient) is not None and literal(coefficient) <= 2:
                return frozenset()
            if op == "log_positive":
                other = divide_factor(args[0], 3679)
                if other is not None:
                    return need("radial", other) | need("defined", index)
        if kind == "log_radial" and op == "log_positive":
            return need("radial", args[0]) | need("defined", index)
        if kind == "radius" and control != "radius":
            parts = factors(index)
            if parts.count(xi) == 1:
                return merge(need("unit", j) for j in parts if j != xi)
        if kind == "radial":
            if index == XA and not auxiliary:
                return frozenset()
            if op == "exp":
                return need("log_radial", args[0])
            other = divide_factor(index, XA)
            if other is not None and node(other)[0] == "exp":
                return need("time", node(other)[1][0])
            parts = factors(index)
            squares = [j for j in parts if node(j)[0] == "integer_power" and node(j)[1][1] == 2]
            if len(squares) == 1:
                (square,) = squares
                return need("radius", node(square)[1][0]) | merge(need("unit", j) for j in parts if j != square)
        return unresolved

    @cache
    def free_of(index, variable):
        if index == variable:
            return False
        op, args = node(index)
        if op == "definite_integral":
            body, binder, left, right = args
            return free_of(left, variable) and free_of(right, variable) and (variable == binder or free_of(body, variable))
        return all(free_of(child, variable) for child in actual_children(nodes[index]))

    free_coordinates = {
        candidate for candidate in reachable if nodes[candidate]["op"] == "coordinate"
        and any(not free_of(root, candidate) for root in roots)
    }
    assert free_coordinates <= {xi, 2}, free_coordinates

    target_bits = {index: 1 << offset for offset, index in enumerate(sorted(natural))}

    def joined(sources):
        result = {}
        for source in sources:
            for obligation, targets in source.items():
                result[obligation] = result.get(obligation, 0) | targets
        return result

    def append(out, obligations, targets):
        for obligation in obligations:
            out[obligation] = out.get(obligation, 0) | targets

    for index in sorted(reachable):
        op, args = node(index)
        if op == "definite_integral":
            body, variable, left, right = args
            out = joined([debts[left], debts[right]])
            for (kind, tested), affected in debts[body].items():
                if tested == variable and control != "binders":
                    append(out, need(kind, left) | need(kind, right), affected)
                    events["binder_endpoint_transfer"] += 1
                elif not free_of(tested, variable):
                    escaped_scope.add((index, kind, tested, affected))
                else:
                    append(out, [(kind, tested)], affected)
        elif op == "smooth_piecewise":
            x, left, right, *branches = args
            arms = []
            for arm, branch in enumerate(branches):
                proof = dict(debts[branch])
                if control != "guards":
                    for (kind, tested) in list(proof):
                        if tested != x:
                            continue
                        if arm != 0 and kind in ("positive", "nonnegative") and not need(kind, left if arm == 1 else right):
                            del proof[(kind, tested)]
                            events["guard_lower_discharge"] += 1
                        if arm != 2 and kind in ("Y_upper", "radial", "time", "log_radial") and not need(kind, left if arm == 0 else right):
                            del proof[(kind, tested)]
                            events["guard_upper_discharge"] += 1
                arms.append(proof)
            out = joined([debts[x], debts[left], debts[right], *arms])
        else:
            out = joined(debts[child] for child in actual_children(nodes[index]))
        if index in natural:
            tested = natural[index]
            proof = need("Y_upper", tested) | need("nonnegative", tested) | need("defined", tested)
            append(out, proof, target_bits[index])
        debts[index] = out
    open_at_roots = joined(debts[root] for root in roots)
    unproved = 0
    for targets in chain(open_at_roots.values(), (record[3] for record in escaped_scope)):
        unproved |= targets
    failed = [index for index in sorted(natural) if unproved & target_bits[index]]
    return {
        "system": system_id, "order": system["order"], "kind": "auxiliary" if auxiliary else "actual",
        "coefficientRoots": sorted(roots), "radialDomain": system["radialDomain"],
        "freeCoordinates": sorted(free_coordinates), "eta": 2,
        "reachedNodes": len(reachable), "naturalCalls": len(natural),
        "naturalDerivativeOrderMax": [max(nodes[index]["args"][k] for index in natural) for k in (3, 4)],
        "lowerCalls": len(lower), "lowerSystems": sorted({args[0] for args in lower.values()}),
        "upperY": str(literal(natural_radius)) if auxiliary else "4*exp(2*t1)<256/63<5",
        "unproved": failed, "events": dict(sorted(events.items())),
        "openRootFacts": [[kind, tested, targets.bit_count(), nodes[tested]] for (kind, tested), targets in sorted(open_at_roots.items())],
        "openBoundFacts": [[binder, kind, tested, targets.bit_count(), nodes[tested]] for (binder, kind, tested, targets) in sorted(escaped_scope)],
    }


def merge(conditions):
    return frozenset().union(*conditions)


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("archive", "helper", "lower", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--control", choices=("binders", "guards", "radius"))
    args = parser.parse_args()
    if not __debug__:
        parser.error("assertions are required")
    assert sha256(args.helper.read_bytes()).hexdigest() == HELPER_HASH
    sys.path.insert(0, str(args.helper.parent))
    from native_reference_scopes import actual_children

    previous = read_pinned(args.lower, LOWER_HASH)
    old_lower = {
        item["system"]: {call for group in item["groups"] for call in group["calls"]}
        for item in previous["systems"]
    }
    nodes, systems = read_original(args.archive)
    rows = [audit(nodes, systems, actual_children, old_lower, i, args.control) for i in range(10)]
    open_count = sum(len(row["unproved"]) for row in rows)
    report = {
        "status": "CONTROL" if args.control else ("PASS_BODY_INGRESS" if not open_count else "PARTIAL_BODY_INGRESS"),
        "sourceStreamSHA256": STREAM_HASH, "sourceRegistrySHA256": REGISTRY_HASH,
        "checkedLowerReceiptSHA256": LOWER_HASH, "control": args.control,
        "sourceSystems": rows, "openCount": open_count,
        "actualDirectNaturalRoles": sum(rows[i]["naturalCalls"] for i in ACTUAL_SYSTEMS),
        "auxiliaryDirectNaturalRoles": sum(rows[i]["naturalCalls"] for i in AUXILIARY_SYSTEMS),
        "actualRecursionEdges": sum(rows[i]["lowerCalls"] for i in ACTUAL_SYSTEMS),
        "auxiliaryRecursionEdges": sum(rows[i]["lowerCalls"] for i in AUXILIARY_SYSTEMS),
        "scope": "A0, A1 and forcing body calls under original admitted real xi and eta, through N4 export systems of mathematical orders 1 to 5.",
    }
    with args.out.open("x", encoding="utf-8", newline="\n") as output:
        json.dump(report, output, indent=2)
        output.write("\n")
    print(report["status"], file=sys.stdout, flush=True)
    for row in rows:
        print(row["system"], row["naturalCalls"], row["lowerCalls"], len(row["unproved"]), flush=True)


if __name__ == "__main__":
    main()
