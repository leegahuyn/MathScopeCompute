"""Independent exact canonicalization of a retained source comparator input."""

from functools import cache
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
import json
from pathlib import Path
import sys
import threading


def compare(request):
    nodes = request["nodes"]
    definitions = request["expressionSystems"]
    free = request["freeCoordinates"]
    atoms = set(request["atomicNodes"])
    entries = []
    index = {}

    def intern(operation, operands):
        key = (operation, operands)
        if key not in index:
            index[key] = len(entries)
            entries.append(key)
        return index[key]

    def visit(node_id, environment, depth=0):
        if node_id in atoms:
            values = tuple(environment[k] if k in environment
                           else intern("free_coordinate", (k,)) for k in free[node_id])
            return intern("source_operand", (node_id, values))
        bindings = tuple((k, environment[k]) for k in free[node_id] if k in environment)
        return cached(node_id, bindings, depth)

    @cache
    def cached(node_id, bindings, depth):
        # The same expansion may occur under distinct outer coordinates.
        # The serialized free-coordinate set safely prunes unused bindings.
        environment = dict(bindings)
        entry = nodes[node_id]
        op, raw = entry["op"], entry["args"]

        def denotation(child):
            return visit(child, environment, depth)

        if op == "coordinate":
            return environment[node_id] if node_id in environment else intern("free_coordinate", (node_id,))
        if op in ("rational", "source_parameter"):
            return intern(op, tuple(raw))
        if op == "definite_integral":
            body, binder, lo, hi = raw
            local = {**environment, binder: intern("bound_coordinate", (depth,))}
            return intern(op, (visit(body, local, depth + 1), denotation(lo), denotation(hi)))
        if op == "actual_expression_partial":
            definition, args, orders = raw
            arguments = tuple(map(denotation, args))
            if all(order == 0 for order in orders):
                template = definitions[definition]
                local = environment | dict(zip(template["parameters"], arguments, strict=True))
                return visit(template["body"], local, depth)
            return intern(op, (definition, arguments, tuple(orders)))
        if op in ("integer_power", "source_step_derivative"):
            return intern(op, (denotation(raw[0]), raw[1]))
        source_layouts = {
            "actual_natural_series": (1, 2),
            "actual_background_even_profile": (2, 3),
            "actual_background_picard": (2, 3),
            "actual_quadratic_root": (2,),
        }
        if op in source_layouts:
            positions = source_layouts[op]
            return intern(op, tuple(denotation(arg) if j in positions else arg
                                    for j, arg in enumerate(raw)))
        if op == "actual_monotone_root":
            return intern(op, (raw[0], *map(denotation, raw[1:])))
        children = tuple(map(denotation, raw))
        if op in ("add", "multiply"):
            descendants = []
            for child in children:
                child_op, child_children = entries[child]
                descendants.extend(child_children if child_op == op else (child,))
            children = tuple(sorted(descendants))
        return intern(op, children)

    a = visit(request["left"], {})
    b = visit(request["right"], {})
    return {
        "left": request["left"], "right": request["right"], "normalForms": [a, b],
        "pass": a == b, "visited": cached.cache_info().currsize, "canonicalNodeCount": len(entries),
    }


if __name__ == "__main__":
    sys.setrecursionlimit(20_000)
    threading.stack_size(32 * 1024 * 1024)
    payload = Path(sys.argv[1]).read_bytes()
    with ThreadPoolExecutor(max_workers=1) as executor:
        result = executor.submit(compare, json.loads(payload)).result()
    result["inputSHA256"] = sha256(payload).hexdigest()
    print(json.dumps(result))
