"""Check captured source coordinates without using the source free-coordinate evaluator."""

from hashlib import sha256
import json
from pathlib import Path
import sys


NONSTANDARD_CHILDREN = {
    "integer_power": (0,),
    "source_step_derivative": (0,),
    "actual_natural_series": (1, 2),
    "actual_quadratic_root": (2,),
    "actual_background_picard": (2, 3),
    "actual_background_even_profile": (2, 3),
}


def check(body):
    nodes = body["nodes"]
    reported = body["freeCoordinates"]
    assert len(nodes) == len(reported)
    free = []
    binders = involved = 0
    for node_id, node in enumerate(nodes):
        op, args = node["op"], node["args"]
        if op == "coordinate":
            v = {node_id}
        elif op in ("source_parameter", "rational"):
            v = set()
        else:
            if op == "definite_integral":
                integrand, binder, lower, upper = args
                assert all(type(i) is int and 0 <= i < node_id for i in args)
                assert nodes[binder]["op"] == "coordinate"
                v = (free[integrand] - {binder}) | free[lower] | free[upper]
                binders += 1
            else:
                if op == "actual_expression_partial":
                    selector, children, orders = args
                    expression = body["expressionSystems"][selector]
                    assert len(children) == len(orders) == len(expression["parameters"])
                    involved += 1
                elif op == "actual_monotone_root":
                    children = args[1:]
                elif op in NONSTANDARD_CHILDREN:
                    children = [args[j] for j in NONSTANDARD_CHILDREN[op]]
                else:
                    children = args
                assert all(type(i) is int and 0 <= i < node_id for i in children), (node_id, op)
                v = set().union(*(free[i] for i in children))
        assert sorted(v) == reported[node_id], (node_id, op)
        free.append(v)
    for function in body["expressionSystems"]:
        parameters = function["parameters"]
        assert len(parameters) == len(set(parameters))
        assert all(nodes[i]["op"] == "coordinate" for i in parameters)
        assert free[function["body"]] <= set(parameters), function["name"]
    return {"nodes": len(nodes), "integralBinders": binders, "sourceApplicationArguments": involved,
            "formalSignatures": len(body["expressionSystems"])}


if __name__ == "__main__":
    raw = Path(sys.argv[1]).read_bytes()
    result = check(json.loads(raw))
    result.update(inputSHA256=sha256(raw).hexdigest(), status="PASS_INDEPENDENT_FREE_COORDINATES")
    print(json.dumps(result))
