"""Pin the actual full PostFive field to which four provisional Repeat roots would be added."""
import argparse
import gzip
from hashlib import sha256
import json
from pathlib import Path


STREAM_SHA = "7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2"
REGISTRY_SHA = "62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce"
BASE_RUN = 44682703381
COUNT = 22_380_596
FILES = {
    "first-cycle.json": "4d8280cdef8cd103445d613b32d142445668bcba58f8f6d5fb4dfffe2e55a3f2",
    "active-n3-repeat-forced-candidate.json": "b9c43c30c8782034650ba432ff20d3e7a258bb752f81e2fa0bf3a7211621430e",
    "active-n3-repeat-forced-export.json": "4c8085b90e4fbe017a03ccb5a897eec8b6e4539f096e72950066af27e77b3e7a",
}
VELOCITY = (22153222, 22153223, 22153224)
SIGNED_VELOCITY = (22031659, 22031660, 22031661)
MEAN_INCREMENT = (22153217, 22153219, 22153221)
PRESSURE, SIGNED_PRESSURE = 22153227, 22031665
RESIDUAL = (22153560, 22153562, 22153564)


def pinned(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected, path
    return json.loads(raw)


def main(directory):
    current, repeat, export = (pinned(directory / name, pin) for name, pin in FILES.items())
    field = current["stages"][-1]
    assert field["name"] == "original-post-five-physical-residual"
    assert tuple(field["velocity"]) == VELOCITY and field["pressure"] == PRESSURE
    assert field["divergence"] == 22153248
    assert tuple(field["conservativeResidual"]) == tuple(repeat["precedingConservativeResidual"]) == RESIDUAL
    previous = current["stages"][1]
    assert previous["name"] == "original-signed-162-successor"
    assert tuple(previous["roots"]["velocity"]) == SIGNED_VELOCITY
    assert previous["roots"]["pressure"] == SIGNED_PRESSURE
    assert not current["split"]["differencesProvedZero"]
    assert export["snapshot"]["node_stream_sha256"] == STREAM_SHA
    existing = tuple(row["field"] for row in repeat["fields"])
    assert existing == tuple(f"coupled-field:{i}" for i in (9,10,11,12,16,17,18,19))
    assert export["completeSecondCorrection"] == "OPEN" and export["finalJets"] == 0
    location = directory / "active-n3-repeat-forced-source"
    registry = pinned(location / "original-source-functions.json", REGISTRY_SHA)
    assert registry["counts"] == [2269, 29, 2, 60, 0]
    wanted = {*VELOCITY, *SIGNED_VELOCITY, *MEAN_INCREMENT, PRESSURE, SIGNED_PRESSURE, *RESIDUAL,
              *range(22153216,22153228), 22153248, 22153530, 22153544, 22153558,
              22153559, 22153561, 22153563, 20}
    records = {}
    digest = sha256()
    with gzip.open(location / "original-source-nodes.jsonl.gz", "rb") as stream:
        header = stream.readline()
        digest.update(header)
        assert json.loads(header)["node_count"] == COUNT
        for index, line in enumerate(stream):
            digest.update(line)
            if index in wanted:
                records[index] = json.loads(line)
    assert index + 1 == COUNT and digest.hexdigest() == STREAM_SHA and set(records) == wanted
    for full_id, prior_id, increment_id in zip(VELOCITY, SIGNED_VELOCITY, MEAN_INCREMENT, strict=True):
        assert records[full_id] == {"op": "add", "args": [prior_id, increment_id]}
        assert records[increment_id]["op"] == "add"
    assert records[PRESSURE] == {"op": "add", "args": [SIGNED_PRESSURE, 22153226]}
    assert records[20] == {"op": "rational", "args": ["-1", "1"]}
    assert records[22153226]["op"] == "add" and 22153225 in records[22153226]["args"]
    assert records[22153225]["op"] == "multiply" and 20 in records[22153225]["args"]
    assert all(records[root]["op"] == "add" for root in RESIDUAL)
    return {
        "originalCompletedBaseRun": BASE_RUN, "originalStreamPin": STREAM_SHA, "streamRecords": COUNT,
        "originalRegistryPin": REGISTRY_SHA, "upstreamReceipts": FILES,
        "actualPriorFullVelocity": VELOCITY, "actualPriorFullPressure": PRESSURE,
        "actualPriorFullDivergence": field["divergence"], "actualPriorConservativeResidual": RESIDUAL,
        "observedPriorFullNodes": {str(i): records[i] for i in [*VELOCITY,PRESSURE,22153225,22153226]},
        "archivedPDEWasProvedZero": False, "existingPrivateIndexedFieldsWhichAreNotRepeat": existing,
        "fourRepeatIndexedRoots": "AWAITING_ACTUAL_ATTACHMENT_RECEIPT_RUN_44698543085",
        "pressureNeedsSubsequentWholeMeanRefresh": True,
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_run", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    data = main(args.base_run)
    args.output.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
