"""Check the original node stream and list the inputs for numerical replay."""

from argparse import ArgumentParser
from collections import Counter, defaultdict
from fractions import Fraction
import gzip
from hashlib import sha256
import json
from pathlib import Path


PRIMARY = "6c3a65a40767e74e2093ddc6869e33fe024f154eb60a1b77a22ac365b4c6140d"
INITIAL = "ac0c5dd82edad9dfef71266ef444b6448d77e6e9fc0739666fc55f5d53ff9a7a"
SOURCE = "ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf"
REGISTRY = "657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333"
NODE_COUNT = 4456994


def pinned_json(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return json.loads(raw)


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("goal_next", "graph", "out"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    primary = pinned_json(args.goal_next / "whole-k-primary-potential-c3/initialized-primary-potential-c3.json", PRIMARY)
    initial = pinned_json(args.goal_next / "whole-k-initialized-gauge/initialized-stage-zero-atoms.json", INITIAL)
    assert primary["sourceSHA256"] == initial["sourceSHA256"] == SOURCE
    assert primary["registrySHA256"] == REGISTRY
    pinned_json(args.graph / "original-source-functions.json", REGISTRY)
    original_records = {int(k): v for k, v in primary["native"]["sourceRecords"].items()}
    source_ids = {value for value in initial["source"].values() if type(value) is int}
    required = set(original_records) | source_ids

    nodes = initial["nodes"]
    roots = initial["roots"]["all"]
    assert Counter(name.split("@", 1)[0] for name in roots) == {
        "A0": 19, "A1": 19, "A2": 19, "b": 6, "p": 4,
    }
    stack = list(roots.values())
    visited = set()
    external = defaultdict(set)
    while stack:
        index = stack.pop()
        if index in visited:
            continue
        assert 0 <= index < len(nodes)
        visited.add(index)
        node = nodes[index]
        op, values = node["op"], node["args"]
        if op == "rational":
            assert Fraction(*map(int, values)) >= 0
            continue
        if op == "authenticated_source_norm_root":
            namespace, root = values
            if namespace == "slow-background-atom":
                assert root in roots
            else:
                assert type(root) is int and root >= 0
            external[namespace].add(root)
            continue
        if op == "integer_power":
            assert len(values) == 2 and type(values[1]) is int and values[1] >= 0
            children = values[:1]
        else:
            assert op in {"multiply", "add", "exp", "maximum", "inverse"}
            children = values
        assert all(type(child) is int and 0 <= child < index for child in children)
        stack.extend(children)
    required.update(external["hosted-original"])

    source_digest = sha256()
    actual = {}
    count = 0
    with gzip.open(args.graph / "original-source-nodes.jsonl.gz", "rb") as stream:
        header = stream.readline()
        source_digest.update(header)
        assert json.loads(header) == {"schema": "MathScope.M3.FullNodesJSONL/1", "node_count": NODE_COUNT}
        for index, line in enumerate(stream):
            source_digest.update(line)
            if index in required:
                actual[index] = json.loads(line)
            count += 1
    assert count == NODE_COUNT and source_digest.hexdigest() == SOURCE
    assert actual.keys() == required
    for index, node in original_records.items():
        assert actual[index] == node, index
    assert initial["scope"]["numericalNormEvaluation"] is False
    receipt = {
        "status": "VERIFIED_ORIGINAL_SOURCE_STREAM_AND_INITIAL_NUMERICAL_INPUT_INVENTORY",
        "sourceSHA256": SOURCE, "registrySHA256": REGISTRY, "sourceNodes": count,
        "exactSourceRecords": len(original_records), "selectedOriginalNodes": len(actual),
        "initialSymbolicRoots": len(roots), "reachablePositiveNodes": len(visited),
        "reachableExternalRootsByNamespace": {name: sorted(values) for name, values in sorted(external.items())},
        "hostedOriginalLeafOperations": dict(sorted(Counter(
            actual[index]["op"] for index in external["hosted-original"]
        ).items())),
        "numericalEvaluation": "OPEN", "finalJets": "0/67", "release": "HOLD",
    }
    args.out.write_bytes((json.dumps(receipt, indent=2) + "\n").encode())
    print(f"PASS {count} original nodes, {len(original_records)} exact records, {len(roots)} symbolic roots")


if __name__ == "__main__":
    main()
