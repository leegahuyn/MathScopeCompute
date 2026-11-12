"""Check the collar FTC bindings and retain the original 16-root arithmetic."""

from argparse import ArgumentParser
from collections import Counter
import gzip
from hashlib import sha256
import json
from pathlib import Path


TARGET_SHA = "3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770"
MIDDLE_SHA = "2afed7192b136698b4ff4df92cab416c372406736bae4292a2adc49eae6481b1"
FIXED = {
    239: ("definite_integral", [238, 226, 0, 1]),
    257: ("definite_integral", [256, 246, 0, 1]),
    275: ("definite_integral", [274, 262, 1, 261]),
}


def pinned(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest
    return json.loads(data)


def minus(nodes, upper, binder, coordinate):
    op, children = nodes[coordinate]
    assert op == "add" and len(children) == 2 and upper in children
    [negative] = set(children) - {upper}
    assert nodes[negative] == ("multiply", [20, binder])


def check_face(nodes, region, row, mask, ident, collar):
    lower, upper = region["lower"], region["upper"]
    binders = lower.copy()
    orders = row["orders"].copy()
    for axis in range(2):
        if mask & (1 << axis):
            op, values = nodes[ident]
            assert op == "definite_integral"
            ident, binder, left, right = values
            assert (left, right) == (lower[axis], upper[axis])
            assert nodes[binder][0] == "coordinate"
            binders[axis] = binder
            orders[axis] += 1
    op, [radicand] = nodes[ident]
    assert op == "sqrt_positive"
    op, children = nodes[radicand]
    assert op == "add" and len(children) == 2 and 1 in children
    [square] = set(children) - {1}
    op, [operand, exponent] = nodes[square]
    assert (op, exponent) == ("integer_power", 2)
    if collar:
        if mask & 1:
            op, [sign, operand] = nodes[operand]
            assert op == "multiply" and sign == 20
        op, [system, arguments, actual_orders] = nodes[operand]
        assert op == "actual_expression_partial"
        assert system == region["systems"][row["component"]] and actual_orders == orders
        assert arguments[1] == binders[1]
        if mask & 1:
            minus(nodes, upper[0], binders[0], arguments[0])
        else:
            assert arguments[0] == upper[0]


def terms(nodes, root, stop):
    stack = [root]
    result = Counter()
    while stack:
        i = stack.pop()
        if i in stop:
            result[i] += 1
        else:
            op, args = nodes[i]
            assert op == "add"
            stack.extend(args)
    return result


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("certificate", "graph", "middle_reduction", "out"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    cert = pinned(args.certificate, TARGET_SHA)
    middle = pinned(args.middle_reduction, MIDDLE_SHA)
    digest = sha256()
    nodes = []
    with gzip.open(args.graph, "rb") as stream:
        line = stream.readline()
        digest.update(line)
        header = json.loads(line)
        for line in stream:
            digest.update(line)
            node = json.loads(line)
            nodes.append((node["op"], node["args"]))
    assert header["schema"] == "MathScope.N7.ActualTargetDirectionalNormGraph/1"
    assert len(nodes) == header["nodeCount"] == cert["graph"]["nodeCount"] == 153455
    assert digest.hexdigest() == cert["graph"]["uncompressedSHA256"] == middle["sourceGraphSHA256"]
    definitions = json.loads(header["definitions"]["expression"])
    assert nodes[0] == ("rational", ["0", "1"]) and nodes[1] == ("rational", ["1", "1"])
    assert nodes[19] == ("rational", ["1", "2"]) and nodes[20] == ("rational", ["-1", "1"])
    assert nodes[119695] == ("multiply", [847, 3612])
    assert nodes[847] == ("rational", ["1", "4"]) and nodes[3612] == ("source_parameter", ["t1"])
    assert cert["regions"]["inner"]["upper"] == [119695, 1]
    assert cert["regions"]["outer"]["upper"] == [19, 1]
    assert cert["regions"]["inner"]["lower"] == cert["regions"]["outer"]["lower"] == [0, 20]
    ftc = {}
    for name, region in cert["regions"].items():
        assert len(region["rows"]) == 72
        for i, system in enumerate(region["systems"]):
            assert definitions[system]["parameters"] == region["coordinates"]
            assert definitions[system]["body"] == region["bodies"][i]
        for row in region["rows"]:
            assert len(row["faces"]) == 4 and sum(row["orders"]) <= 7
            for mask, face in enumerate(row["faces"]):
                check_face(nodes, region, row, mask, face, name != "middle")
            assert terms(nodes, row["root"], row["faces"]) == Counter(row["faces"])
            assert row["root"] not in ftc
            ftc[row["root"]] = name
    assert len(ftc) == 216
    assert [row["root"] for row in cert["regions"]["middle"]["rows"]] == [
        row["root"] for row in middle["actualMiddleRows"]
    ]
    roots = [i for row in cert["bounds"] for i in row["component"]]
    assert roots == list(range(153439, 153455))
    assert all(nodes[i][0] == "maximum" and 1 in nodes[i][1] for i in roots)
    stack, visited, stops, parameters = roots.copy(), {}, set(), set()
    substitutions = {}
    while stack:
        i = stack.pop()
        if i in visited:
            continue
        op, operands = nodes[i]
        if i in ftc:
            key = f"ftc_{i}"
            substitutions[i] = key
            visited[i] = {"op": "source_parameter", "args": [key]}
            continue
        visited[i] = {"op": op, "args": operands}
        if i in FIXED:
            assert nodes[i] == FIXED[i]
            stops.add(i)
        elif op == "source_parameter":
            parameters.add(operands[0])
        elif op in {"inverse", "exp", "log_positive", "sqrt_positive", "integer_power"}:
            stack.append(operands[0])
        elif op in {"add", "multiply", "maximum"}:
            stack.extend(operands)
        else:
            assert op == "rational", (i, op)
    assert set(substitutions) == set(ftc)
    assert stops == set(FIXED)
    result = {
        "schema": "MathScope.N7.OriginalTargetC7FTCFaceAndArithmeticReadback/1",
        "originalGraphSHA256": digest.hexdigest(), "checkedFTCRoots": len(ftc), "checkedFaces": 4*len(ftc),
        "regions": {name: sorted(i for i, region in ftc.items() if region == name) for name in cert["regions"]},
        "trace": {"roots": roots, "nodes": [{"id": i, "node": n} for i, n in sorted(visited.items())],
                  "sourceParameters": sorted(parameters), "substitutions": substitutions,
                  "nonArithmeticBoundaries": [{"id": i, "node": visited[i]} for i in sorted(stops)]},
        "release": "HOLD",
    }
    args.out.write_bytes((json.dumps(result, separators=(",", ":")) + "\n").encode())
    print("PASS original target regions, 216 FTC roots and 864 retained faces")


if __name__ == "__main__":
    main()
