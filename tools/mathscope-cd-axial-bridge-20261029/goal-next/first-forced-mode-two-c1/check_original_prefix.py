"""Compare the actual initialized prefix and source mode-two component IDs."""

from argparse import ArgumentParser
import gzip
from hashlib import sha256
import json
from pathlib import Path


PREFIX_COUNT = 3860185
PREFIX_SHA = "2524f35161dfad02368893371e2dd121af3d72c1d5884cf0068b6ef1bdfe6598"
FORCED = (4197115, "1ab376e369484c63e17b0d891eebcc18ddedf53f8e6acb907bc9ec8c05d51fc3")
CYCLE = (4456994, "ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf")


def check_stream(folder, expected):
    full, prefix = sha256(), sha256()
    count = 0
    with gzip.open(folder / "original-source-nodes.jsonl.gz", "rb") as stream:
        header = stream.readline()
        assert json.loads(header)["node_count"] == expected[0]
        full.update(header)
        for count, line in enumerate(stream, 1):
            full.update(line)
            if count <= PREFIX_COUNT:
                prefix.update(line)
    assert (count, full.hexdigest()) == expected
    assert prefix.hexdigest() == PREFIX_SHA


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("forced_graph", "cycle_graph", "out"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    check_stream(args.forced_graph, FORCED)
    check_stream(args.cycle_graph, CYCLE)
    data = (args.forced_graph / "corrected-first-force.json").read_bytes()
    assert sha256(data).hexdigest() == "c7d429adb927a3020b870df3fb755806061727ed2efc7d8df8736c785e65f835"
    rows = [row for row in json.loads(data)["rows"] if row["m"] == 2]
    assert {row["key"] for row in rows} == {f"{i}:{sign}" for i in range(5) for sign in (1, -1)}
    assert len(rows) == 10
    for row in rows:
        assert len(row["components"]) == 6 and row["changed"] == 0
        for c in row["components"]:
            assert c["raw"] == c["supported"] and c["primary"] == 0
            assert all(0 <= c[name] < FORCED[0] for name in ("raw", "mapped", "formalPathSource"))
    receipt = {
        "status": "VERIFIED_ORIGINAL_MODE_TWO_PREFIX_AND_RAW_SUPPORTED_IDS",
        "forcedNodeCount": FORCED[0], "forcedSHA256": FORCED[1],
        "cycleNodeCount": CYCLE[0], "cycleSHA256": CYCLE[1],
        "sharedNodeCount": PREFIX_COUNT, "sharedSHA256": PREFIX_SHA,
        "modeTwoRows": len(rows), "modeTwoComponents": sum(len(row["components"]) for row in rows),
        "scope": "Archived fixed-label N1 source paths", "release": "HOLD",
    }
    args.out.write_bytes((json.dumps(receipt, indent=2) + "\n").encode())
    print(f"PASS two authenticated streams, {PREFIX_COUNT} shared nodes and 60 raw/support IDs")


if __name__ == "__main__":
    main()
