"""Authenticate the original FTC faces and isolate their positive transport."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
import gzip
from hashlib import sha256
import json
from pathlib import Path


RECEIPT = "5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e"


def check_face(nodes, face, mask, lower, upper, group, orders):
    arguments = lower.copy()
    derivatives = orders.copy()
    for axis in range(2):
        if mask & (1 << axis):
            op, values = nodes[face]
            assert op == "definite_integral"
            face, binder, left, right = values
            assert (left, right) == (lower[axis], upper[axis])
            assert nodes[binder][0] == "coordinate"
            arguments[axis] = binder
            derivatives[axis] += 1
    assert sum(derivatives) <= 10
    op, [radicand] = nodes[face]
    assert op == "sqrt_positive"
    op, inputs = nodes[radicand]
    assert op == "add" and len(inputs) == 2 and 1 in inputs
    [square] = set(inputs) - {1}
    op, [operand, exponent] = nodes[square]
    assert (op, exponent) == ("integer_power", 2)
    assert nodes[operand] == ("actual_expression_partial", [group["system"], arguments, derivatives])


def additive_terms(nodes, root, atoms):
    stack = [root]
    terms = []
    while stack:
        i = stack.pop()
        if i in atoms:
            terms.append(i)
        else:
            op, args = nodes[i]
            assert op == "add"
            stack.extend(args)
    return Counter(terms)


def trace(nodes, roots, ftc):
    stack = list(roots)
    visited = {}
    substitutions = {}
    source_parameters = set()
    while stack:
        i = stack.pop()
        if i in visited:
            continue
        op, args = nodes[i]
        if i in ftc:
            name = "ftc_" + ftc[i]
            substitutions[i] = name
            visited[i] = {"op": "source_parameter", "args": [name]}
            continue
        visited[i] = {"op": op, "args": args}
        if op == "source_parameter":
            assert len(args) == 1 and args[0] in {"h", "C12EnvelopeR"}
            source_parameters.add(args[0])
        elif op == "rational":
            assert Fraction(*map(int, args)) >= 0
        elif op == "integer_power":
            assert len(args) == 2 and type(args[1]) is int and args[1] >= 0
            assert 0 <= args[0] < i
            stack.append(args[0])
        else:
            assert op in {"add", "multiply", "maximum"}, (i, op, args)
            assert args and all(0 <= child < i for child in args)
            stack.extend(args)
    return {
        "roots": roots,
        "nodes": [{"id": i, "node": n} for i, n in sorted(visited.items())],
        "sourceParameters": sorted(source_parameters),
        "substitutedArchivedFTCRoots": substitutions,
        "nonArithmeticBoundaries": [],
    }


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("certificate", "graph", "out"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    data = args.certificate.read_bytes()
    assert sha256(data).hexdigest() == RECEIPT
    cert = json.loads(data)
    digest, prefix = sha256(), sha256()
    nodes = []
    with gzip.open(args.graph, "rb") as stream:
        header_raw = stream.readline()
        header = json.loads(header_raw)
        assert header["schema"] == "MathScope.N7.ActualBackgroundDirectionalNormGraph/1"
        digest.update(header_raw)
        for i, line in enumerate(stream):
            if i < 123870:
                prefix.update(line)
            digest.update(line)
            n = json.loads(line)
            nodes.append((n["op"], n["args"]))
    assert len(nodes) == header["nodeCount"] == cert["graph"]["nodeCount"] == 152308
    assert digest.hexdigest() == cert["graph"]["uncompressedSHA256"]
    definitions = json.loads(header["definitions"]["expression"])
    lower, upper = (cert["box"][s] for s in ("lower", "upper"))
    assert nodes[lower[0]] == ("multiply", [19, 3617])
    assert nodes[19] == ("rational", ["1", "2"])
    assert nodes[3617] == ("source_parameter", ["Xa"])
    assert nodes[upper[0]] == ("multiply", [24, 28826])
    assert nodes[24] == ("rational", ["2", "1"])
    assert nodes[28826] == ("multiply", [12, 28825])
    assert nodes[28825] == ("exp", [319])
    assert nodes[12] == ("source_parameter", ["XR"])
    assert nodes[lower[1]] == ("rational", ["-1", "1"])
    assert nodes[upper[1]] == ("rational", ["1", "1"])
    ftc = {}
    for group in cert["groups"]:
        system = group["system"]
        record = definitions[system]
        assert record["body"] == group["body"]
        formals = record["parameters"]
        assert nodes[group["sourceRoot"]] == ("actual_expression_partial", [system, formals, [0, 0]])
        assert len(group["rows"]) == 45
        for row in group["rows"]:
            orders = row["orders"]
            assert nodes[row["jet"]] == ("actual_expression_partial", [system, formals, orders])
            for mask, face in enumerate(row["faces"]):
                check_face(nodes, face, mask, lower, upper, group, orders)
            assert len(row["faces"]) == 4
            assert additive_terms(nodes, row["root"], row["faces"]) == Counter(row["faces"])
            assert row["root"] not in ftc
            ftc[row["root"]] = str(group["order"]) + ":" + group["field"]
    assert len(ftc) == 360
    F, G = ([r[k] for r in cert["bounds"]] for k in ("F", "G"))
    channels = {"F": trace(nodes, F, ftc), "G": trace(nodes, G, ftc)}
    for name, channel in channels.items():
        field = "U" if name == "G" else "F"
        assert set(channel["substitutedArchivedFTCRoots"].values()) == {
            f"ftc_{n}:{field}" for n in range(4)
        }
        assert len(channel["substitutedArchivedFTCRoots"]) == 180
    result = {
        "schema": "MathScope.N7.OriginalBackgroundFTCFaceAndTransportReadback/1",
        "originalPrefix": {"nodes": 123870, "sha256": prefix.hexdigest()},
        "originalGraphSHA256": digest.hexdigest(),
        "box": cert["box"], "checkedNativeFunctions": len(cert["groups"]),
        "checkedFTCRoots": len(ftc), "checkedFaces": 4 * len(ftc),
        "trace": channels, "release": "HOLD",
    }
    args.out.write_bytes((json.dumps(result, separators=(",", ":")) + "\n").encode())
    print("PASS 360 archived FTC rows and 1440 actual native derivative faces")


if __name__ == "__main__":
    main()
