"""Independently read back original highest-order mean source records."""

from argparse import ArgumentParser
from copy import deepcopy
from gzip import open as open_gzip
from hashlib import sha256
import json
from pathlib import Path


ADJOINT = "2c645d920a496c426e3cf2b17800af564c8ee895830d47b8e4032251f9884b32"
GRAPH = "ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf"
REGISTRY = "657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333"


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("graph", "adjoint", "out"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    adjoint = args.adjoint.read_bytes()
    assert sha256(adjoint).hexdigest() == ADJOINT
    evidence = json.loads(adjoint)["source"]
    assert evidence["graphSHA256"] == GRAPH and evidence["registrySHA256"] == REGISTRY
    expected = {int(key): value for key, value in evidence["exactRecords"].items()}
    assert len(expected) == evidence["selectedOriginalRows"] == 72
    assert sha256((args.graph / "original-source-functions.json").read_bytes()).hexdigest() == REGISTRY

    digest = sha256()
    found = {}
    with open_gzip(args.graph / "original-source-nodes.jsonl.gz", "rb") as source:
        header = next(source)
        digest.update(header)
        for n, line in enumerate(source):
            digest.update(line)
            if n in expected:
                node = json.loads(line)
                found[n] = [node["op"], node["args"]]
    assert n + 1 == evidence["graphNodes"] == 4_456_994
    assert digest.hexdigest() == GRAPH
    assert found == expected
    assert found[643800] == ["m3_aux_indexed_partial", [
        2, [643595, 622803, 622804, 622791, 643602, 643604], [0, 2, 0, 0, 0],
    ]]
    assert found[643806][1][0:2] == found[643807][1][0:2] == [643805, 643595]
    dropped_shift = deepcopy(found)
    dropped_shift[643800][1][1][-2:] = [635044, 635045]
    assert dropped_shift != expected
    wrong_binder = deepcopy(found)
    wrong_binder[643806][1][1] = 622802
    assert wrong_binder != expected
    result = {
        "status": "VERIFIED_ORIGINAL_HIGHEST_MEAN_SOURCE_ROWS",
        "graphNodes": n + 1,
        "graphSHA256": GRAPH,
        "registrySHA256": REGISTRY,
        "adjointReceiptSHA256": ADJOINT,
        "selectedRows": sorted(found),
        "rejectedControls": ["unshifted torus arguments", "outer radius substituted for integral binder"],
        "release": "HOLD",
    }
    args.out.write_bytes((json.dumps(result, indent=2) + "\n").encode())
    print(f"PASS {len(found)} original rows in {n + 1} source records")


if __name__ == "__main__":
    main()
