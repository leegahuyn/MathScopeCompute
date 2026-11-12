"""Read the original N3 archive with exact JSON integer and typed edge checks."""

import argparse
from collections import Counter
from fractions import Fraction
import gzip
from hashlib import sha256
import json
from pathlib import Path


GRAPH = "f59857c4616e90727e64d9aa77b8ee8a51082274c16cff53098ea7f5db5f511c"
REGISTRY = "75c53ba678b7db51dc53527d6b753d76e1fc013d515ff253b7b581513b0b53a0"
MANIFEST = "45a457d4701ddb327603e596137a190a7e56e77036e3da3174fcbdb4983e2ac5"
PREFIX = "ec36d9c4fda80ae2f431cc27b4ab8c2d635c1e2a874bec2d1a4d3426f01341a5"
SCALES = "5a6ecee45d797d582e3218c36f980d5eb131619c860cec1bfb4d57aea89cdf56"
COMPARISON = "f02566f58e5364cba32a8c077a1fa2eb9c2a686b512f8b4242b0461e18d2d15f"
NODE_COUNT = 3_914_395
LOCAL = [2086981, 2086982, 2086983, 2086970, 2088089, 2088090, 2088091, 2087270, 2086984]
FORMALS = [2086981, 2086982, 2086983, 2087270, 2086984, 2086986, 2086987, 2086988,
           2086970, 2088089, 2088090, 2088091]
FROZEN = FORMALS[:5] + [2088184, 2088189, 2088169] + FORMALS[8:]


def decode(value):
    return json.loads(value) if isinstance(value, str) else value


def pinned(path, expected, output):
    assert path.resolve() != output.resolve(), path
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected, path
    return json.loads(raw)


def edges(op, args):
    if op in {"coordinate", "source_parameter"}:
        assert len(args) == 1 and isinstance(args[0], str)
        return ()
    if op == "rational":
        assert len(args) == 2 and all(isinstance(x, str) for x in args)
        assert str(int(args[0])) == args[0] and str(int(args[1])) == args[1] and int(args[1]) > 0
        return ()
    if op in {"add", "multiply", "maximum"}:
        assert len(args) >= 1
        return args
    if op in {"inverse", "log_positive", "exp", "sqrt_positive", "sine", "cosine", "ceiling"}:
        assert len(args) == 1
        return args
    if op in {"integer_power", "source_step_derivative"}:
        assert len(args) == 2 and type(args[1]) is int
        assert op != "source_step_derivative" or args[1] >= 0
        return args[:1]
    if op in {"definite_integral", "smooth_piecewise"}:
        assert len(args) == (4 if op == "definite_integral" else 6)
        return args
    if op == "actual_natural_series":
        assert len(args) == 5 and isinstance(args[0], str)
        assert all(type(x) is int and x >= 0 for x in args[3:])
        return args[1:3]
    if op in {"actual_background_picard", "actual_background_even_profile", "actual_quadratic_root"}:
        assert len(args) == {"actual_background_picard": 5, "actual_background_even_profile": 6,
                             "actual_quadratic_root": 3}[op]
        assert all(type(x) is int and x >= 0 for x in args)
        return args[2:3] if op == "actual_quadratic_root" else args[2:4]
    if op == "actual_monotone_root":
        assert len(args) >= 2 and type(args[0]) is int and args[0] >= 0
        return args[1:]
    if op in {"actual_covariance_volterra", "m3_global_pulse_jet"}:
        assert len(args) == (4 if op == "actual_covariance_volterra" else 5)
        assert all(type(x) is int and x >= 0 for x in args[:2])
        assert isinstance(args[3], list)
        if op == "m3_global_pulse_jet":
            assert all(type(x) is int and x >= 0 for x in args[4])
        return [args[2], *args[3]]
    if op in {"actual_expression_partial", "m3_aux_expression_partial", "m3_aux_indexed_partial",
              "m3_global_indexed_partial"}:
        assert len(args) == 3 and type(args[0]) is int
        assert isinstance(args[1], list) and isinstance(args[2], list)
        assert all(type(x) is int and x >= 0 for x in args[2])
        if op.endswith("_expression_partial"):
            assert len(args[1]) == len(args[2])
        return args[1]
    raise AssertionError(f"Unsupported original operation {op}")


def inspect(args):
    graph_dir = args.archive / "original-whole-k-current-pressure-graph"
    manifest = pinned(graph_dir / "original-source-export-manifest.json", MANIFEST, args.out)
    registry = pinned(graph_dir / "original-source-functions.json", REGISTRY, args.out)
    prefix = pinned(args.archive / "original-whole-k-prefix.json", PREFIX, args.out)
    scales = pinned(args.goal / "whole-k-selector-scales/fourth/fourth-selector-maxima.json", SCALES, args.out)
    comparison = pinned(args.goal / "whole-k-atlas/n3-n4-live-band.json", COMPARISON, args.out)
    assert comparison["originalGraphPins"]["3"] == [GRAPH, REGISTRY]
    assert comparison["scaleReceiptSHA256"] == SCALES
    assert scales["exactRatios"] == {f"b{n}*qBig": x for n, x in enumerate([1, 16, 32, 64], 1)}
    assert manifest["node_count"] == NODE_COUNT and manifest["node_stream_sha256"] == GRAPH
    assert manifest["definitions_sha256"] == REGISTRY
    assert manifest["extended_coupled_registry_included"] is False
    assert prefix["requestedPrefix"] == 3 and prefix["scope"]["originalCurrentPressurePrivateSeals"]
    assert prefix["scope"]["exactPrefixDomain"]["nextScale"] == 2081695
    base = decode(registry["base"])
    expression = decode(base["expression"])
    aux_expression = decode(registry["expressionDefinitions"])
    aux_fields = decode(registry["fieldDefinitions"])
    global_fields = decode(base["m3GlobalFields"])
    pulses = decode(base["m3GlobalPulses"])
    mon = decode(base["monotone"])
    assert mon[2]["name"] == "ActualCommonBandSlowInverse"
    assert mon[2]["parameters"] == LOCAL[1:3]
    assert mon[2]["left"] == 19 and mon[2]["right"] == 24
    row = next(r for r in aux_fields[0]["rows"] if r["label"]["key"] == "0:0:0:0" and r["label"]["sign"] == 1)
    assert row["localParameters"] == LOCAL
    assert row["values"] == [2096457, 2096461, 2096462, 2096413, 2096470, 2096474, 2096478, 2105453, 2105458]
    assert row["localBody"] == aux_expression[-1 - row["localSystem"]]["body"] == 2090251
    assert not any("InitializedAngular" in item["name"] or "ActualOriginalForced" in item["name"]
                   for item in expression + aux_expression + aux_fields)

    readback = {}
    stream_path = graph_dir / "original-source-nodes.jsonl.gz"
    assert stream_path.resolve() != args.out.resolve()
    digest = sha256()
    histogram = Counter()
    size = 0
    edge_count = 0
    all_native = {
        "actual_expression_partial": expression,
        "m3_aux_expression_partial": aux_expression,
        "m3_aux_indexed_partial": aux_fields,
        "m3_global_indexed_partial": global_fields,
    }
    with gzip.open(stream_path, "rb") as stream:
        header = next(stream)
        assert json.loads(header) == {"schema": "MathScope.M3.FullNodesJSONL/1", "node_count": NODE_COUNT}
        digest.update(header)
        size += len(header)
        for node_id, line in enumerate(stream):
            size += len(line)
            digest.update(line)
            node = json.loads(line)
            assert node.keys() == {"op", "args"}
            op, args_ = node["op"], node["args"]
            assert isinstance(args_, list)
            histogram[op] += 1
            operands = edges(op, args_)
            for operand in operands:
                assert type(operand) is int and 0 <= operand < node_id, (node_id, op, operand)
            edge_count += len(operands)
            if op in all_native:
                native_id = -1 - args_[0] if op == "m3_aux_expression_partial" else args_[0]
                assert 0 <= native_id < len(all_native[op]), (node_id, op, native_id)
                definition = all_native[op][native_id]
                assert len(args_[1]) == len(definition["parameters"]), (node_id, op)
                order_count = len(definition.get("directions", definition["parameters"]))
                assert len(args_[2]) == order_count, (node_id, op)
            if 2086960 <= node_id <= 2105473 or node_id in {19, 20, 24, 25, 28826, 3617, 560581}:
                readback[node_id] = node
    assert sum(histogram.values()) == NODE_COUNT
    assert histogram == manifest["operation_histogram"]
    assert size == manifest["node_stream_uncompressed_bytes"]
    assert digest.hexdigest() == GRAPH

    checked = []

    def expect(node_id, op, args_):
        assert readback[node_id] == {"op": op, "args": args_}, node_id
        checked.append(node_id)

    expect(2086999, "actual_monotone_root", [2, 2086982, 2086983])
    expect(2087009, "multiply", [2086973, 2086999])
    expect(2098732, "multiply", [2081695, 2087009])
    expect(2088169, "actual_monotone_root", [2, 2088155, 2088168])
    expect(2088184, "multiply", [2088181, 2088183])
    expect(2088189, "multiply", [2088155, 2088188])
    expect(2087262, "multiply", [560583, 2087261])
    expect(560581, "rational", ["1", "17179869184"])
    for source_row in prefix["selector"]["activeBackgroundRows"]:
        expect(source_row["sigma"], "multiply", [2081477, source_row["scale"]])
        node = readback[source_row["chi"]]
        expect(source_row["chi"], "actual_expression_partial", [node["args"][0], [source_row["sigma"]], [0]])
        assert expression[node["args"][0]]["name"] == "CommonOriginalTimeCutoff"
    for system, body, value in zip(range(1778, 1781), range(2089556, 2089559), range(2089559, 2089562)):
        assert expression[system]["parameters"] == FORMALS and expression[system]["body"] == body
        expect(value, "actual_expression_partial", [system, FORMALS, [0] * 12])
    for system, family in zip(range(1778, 1781), [2089562, 2089566, 2089570]):
        expect(family, "actual_expression_partial", [system, FORMALS, [1] + [0] * 11])
        expect(family + 1, "actual_expression_partial", [system, FORMALS, [0, 0, 0, 1] + [0] * 8])
    for system, axial in zip(range(1778, 1781), [2089574, 2089576, 2089578]):
        expect(axial, "actual_expression_partial", [system, FORMALS, [0, 1] + [0] * 10])
    for j, (potential, f) in enumerate([(1780, 2090219), (1779, 2090232), (1779, 2090239)]):
        expect(f, "actual_expression_partial", [potential, FROZEN, [0, int(j == 2)] + [0] * 10])
    expect(2089598, "multiply", [20, 2089577])
    expect(2089600, "add", [2089575, 2089599])
    expect(2089602, "add", [2089569, 2089601])
    for node_id, carrier_operand in [(2090182, 1776), (2090185, 1777), (2090191, 1776)]:
        expect(node_id, "actual_expression_partial",
               [carrier_operand, [2090179, 2090180, 2090181], [int(node_id != 2090191), 0, 0]])

    s = Fraction(4, 5)
    args_live = [Fraction(factor, 32) * s for factor in [1, 16, 32, 64]]
    assert args_live == list(map(Fraction, ["1/40", "2/5", "4/5", "8/5"]))
    ell = 23  # lower bound from the actual ellMinimum >= 8
    mesh = ell ** 6
    w = Fraction(3, 4 * mesh)
    assert Fraction(1, 2 * mesh) + w ** 2 / 2 < Fraction(1, 100)
    assert Fraction(5, 4) ** 4 < 8 and Fraction(5, 4) ** 2 < 2
    rep = [Fraction(79, 100), Fraction(81, 100)]
    args_frozen = [[Fraction(factor, 32) * x for x in rep] for factor in [1, 16, 32, 64]]
    assert args_frozen[2][1] < 1 < args_frozen[3][0]
    return {
        "schema": "MathScope.ActiveN3PythonGraphReadback/1", "status": "PASS",
        "graphSHA256": GRAPH, "registrySHA256": REGISTRY, "nodeCount": NODE_COUNT,
        "nodeOperandEdgesChecked": edge_count, "exactSelectedRoots": sorted(set(checked)),
        "archivedCoverKey": row["label"]["key"], "formalPotentialArguments": FORMALS,
        "frozenPotentialArguments": FROZEN, "liveSelectorArguments": list(map(str, args_live)),
        "frozenSelectorIntervals": [[str(x) for x in bound] for bound in args_frozen],
        "archivedScope": "Original N3 Current/Pressure graph, not an Initialized Angular or Forced private archive",
        "edgeScope": "Node operand edges only. Native registry indices and value/derivative slot counts are checked for expression and indexed partials; opaque solution semantics and cross-registry body graph reachability are separate.",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--goal", type=Path, required=True)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    if not __debug__:
        raise RuntimeError("Run the graph replay with assertions enabled")
    result = inspect(args)
    payload = json.dumps(result, separators=(",", ":"), ensure_ascii=True) + "\n"
    args.out.write_bytes(payload.encode("ascii"))
    print(f"PASS {result['nodeCount']:,} source records, {result['nodeOperandEdgesChecked']:,} typed prior edges, "
          f"{len(result['exactSelectedRoots'])} exact source roots, SHA256 {sha256(payload.encode()).hexdigest()}")


if __name__ == "__main__":
    main()
