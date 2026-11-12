"""Resolve numerical inputs of every initialized annular jet by source namespace."""

from argparse import ArgumentParser
from collections import defaultdict
import gzip
from hashlib import sha256
import json
from pathlib import Path


FILES = {
    "stage-zero": ("whole-k-initialized-gauge/initialized-stage-zero-atoms.json", "ac0c5dd82edad9dfef71266ef444b6448d77e6e9fc0739666fc55f5d53ff9a7a"),
    "initialized-mean-positive": ("whole-k-annular-pressure-lower/lower-covariance-pressure.json", "5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328"),
    "initialized-pressure-positive": ("whole-k-angular-pressure/initialized-angular-pressure.json", "b4f45002e74e8fc397d9a43079ba2e5fa958bfe68a355f37d4a006f6f8b08e0d"),
    "initialized-primary-positive": ("whole-k-primary-potential-c3/initialized-primary-potential-c3.json", "6c3a65a40767e74e2093ddc6869e33fe024f154eb60a1b77a22ac365b4c6140d"),
    "fixed-radial": ("whole-k-annular-mean-sharp/fixed-operators.json", "e0ca526ca37d3697a655a419af9386d1e6e291a228e05f26e30a73225b3e9633"),
}
SOURCE_SHA = "ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf"
SOURCE_COUNT = 4456994
HOSTED_RECORDS = {6, 8, 9, 20, 24, 127, 474, 3612, 3622, 4030, 216823,
                  300170, 300171, 617289, 617432, 622750, 622751}
HOSTED_BOUNDARIES = {
    300170: {"op": "add", "args": [215531, 300169]},
    617432: {"op": "ceiling", "args": [617431]},
}
PRESSURE_GEOMETRY = {
    12: {"op": "source_parameter", "args": ["XR"]},
    24: {"op": "rational", "args": ["2", "1"]},
    319: {"op": "add", "args": [261, 294]},
    3617: {"op": "source_parameter", "args": ["Xa"]},
    28825: {"op": "exp", "args": [319]},
    28826: {"op": "multiply", "args": [12, 28825]},
    633682: {"op": "source_parameter", "args": ["X0Imean"]},
    633710: {"op": "sqrt_positive", "args": [3617]},
    633711: {"op": "sqrt_positive", "args": [28826]},
    633712: {"op": "multiply", "args": [24, 633711]},
    633724: {"op": "definite_integral", "args": [633723, 633709, 633710, 633712]},
    633725: {"op": "inverse", "args": [633724]},
}
FIXED_BOUNDARIES = {
    239: {"op": "definite_integral", "args": [238, 226, 0, 1]},
    257: {"op": "definite_integral", "args": [256, 246, 0, 1]},
    275: {"op": "definite_integral", "args": [274, 262, 1, 261]},
}


def read_pinned(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return json.loads(data)


def arithmetic_children(node):
    op, args = node["op"], node["args"]
    if op in {"rational", "source_parameter"}:
        return []
    if op in {"inverse", "exp", "log_positive", "sqrt_positive", "integer_power", "ceiling"}:
        return args[:1]
    assert op in {"add", "multiply", "maximum"}, node
    return args


def arithmetic_trace(nodes, roots, boundaries):
    seen = set()
    pending = list(roots)
    parameters = set()
    while pending:
        index = pending.pop()
        if index in seen:
            continue
        seen.add(index)
        node = nodes[index]
        if index in boundaries:
            assert node == boundaries[index]
            continue
        if node["op"] == "source_parameter":
            parameters.add(node["args"][0])
        pending.extend(arithmetic_children(node))
    assert set(boundaries) <= seen
    return {
        "roots": sorted(roots),
        "nodes": [{"id": i, "node": nodes[i]} for i in sorted(seen)],
        "nonArithmeticBoundaries": [{"id": i, "node": nodes[i]} for i in sorted(boundaries)],
        "sourceParameters": sorted(parameters),
    }


def main():
    parser = ArgumentParser(description=__doc__)
    for key in ("goal", "source_stream", "out"):
        parser.add_argument(key, type=Path)
    args = parser.parse_args()
    receipts = {name: read_pinned(args.goal / path, digest) for name, (path, digest) in FILES.items()}
    graphs = {name: data["nodes"] for name, data in receipts.items() if "nodes" in data}
    visited = defaultdict(set)
    leaves = defaultdict(set)
    initial = receipts["stage-zero"]["roots"]["all"]
    pending = [("stage-zero", i) for i in initial.values()]
    while pending:
        namespace, index = pending.pop()
        if namespace not in graphs:
            leaves[namespace].add(index)
            continue
        if index in visited[namespace]:
            continue
        visited[namespace].add(index)
        node = graphs[namespace][index]
        if node["op"] == "authenticated_source_norm_root":
            pending.append(tuple(node["args"]))
        else:
            children = arithmetic_children(node)
            assert all(0 <= child < index for child in children)
            pending.extend((namespace, child) for child in children)

    digest = sha256()
    hosted = {}
    count = 0
    with gzip.open(args.source_stream, "rb") as stream:
        header = stream.readline()
        assert json.loads(header)["node_count"] == SOURCE_COUNT
        digest.update(header)
        for index, line in enumerate(stream):
            digest.update(line)
            if index in HOSTED_RECORDS or index in PRESSURE_GEOMETRY:
                hosted[index] = json.loads(line)
            count += 1
    assert count == SOURCE_COUNT and digest.hexdigest() == SOURCE_SHA
    assert hosted.keys() == HOSTED_RECORDS | PRESSURE_GEOMETRY.keys()
    assert {i: hosted[i] for i in PRESSURE_GEOMETRY} == PRESSURE_GEOMETRY
    fixed = {int(k): v for k, v in receipts["fixed-radial"]["unweightedArithmeticClosure"].items()}
    assert fixed[319] == hosted[319]
    fixed_trace = arithmetic_trace(fixed, leaves["fixed-radial"] | {319}, FIXED_BOUNDARIES)
    hosted_trace = arithmetic_trace(hosted, leaves["hosted-original"], HOSTED_BOUNDARIES)
    assert len(initial) == 67 and len(leaves["slow-background-atom"]) == 44
    assert len(leaves["slow-background-pressure-atom"]) == 4
    assert len(leaves["background-c8"]) == 18 and len(leaves["target-c7"]) == 16
    assert len(fixed_trace["roots"]) == 16 and len(hosted_trace["roots"]) == 11
    result = {
        "schema": "MathScope.N7.StageZeroNumericalInputs/1",
        "status": "VERIFIED_EXACT_TRANSITIVE_INPUTS",
        "sourceNodes": count, "sourceSHA256": SOURCE_SHA, "initializedAtoms": len(initial),
        "leaves": {key: sorted(items) for key, items in sorted(leaves.items())},
        "visited": {key: len(items) for key, items in sorted(visited.items())},
        "fixed-radial": fixed_trace, "hosted-original": hosted_trace,
        "pressureMassGeometry": PRESSURE_GEOMETRY, "release": "HOLD",
    }
    args.out.write_bytes((json.dumps(result, indent=2) + "\n").encode())
    print("PASS transitive input trace for 67 initialized jets")


if __name__ == "__main__":
    main()
