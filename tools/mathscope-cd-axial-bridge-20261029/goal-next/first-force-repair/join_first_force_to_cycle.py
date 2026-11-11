"""Check that the longer corrected run retains every first-Forced graph node."""
from argparse import ArgumentParser
from hashlib import sha256
import gzip
import json
from pathlib import Path


def manifest(directory, scope):
    metadata = json.loads((directory / "original-source-export-manifest.json").read_bytes())
    assert metadata["scope"] == scope and metadata["extended_coupled_registry_included"] is True
    assert metadata["final_all_cycle_A_b_p"] is False and metadata["actual_final_67_jets_certified"] == 0
    data = (directory / "original-source-functions.json").read_bytes()
    assert sha256(data).hexdigest() == metadata["definitions_sha256"]
    return metadata


def stream_header(stream, metadata):
    line = stream.readline()
    assert json.loads(line) == {"schema": "MathScope.M3.FullNodesJSONL/1",
        "node_count": metadata["node_count"]}
    return sha256(line)


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--first-forced", type=Path, required=True)
    parser.add_argument("--full-cycle", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    assert __debug__
    first = manifest(args.first_forced, "REPAIRED_FIRST_FORCED_ONLY")
    full = manifest(args.full_cycle, "CORRECTED_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT")
    assert first["original_pr30_commit"] == full["original_pr30_commit"]
    assert first["node_count"] < full["node_count"]
    name = "original-source-nodes.jsonl.gz"
    with gzip.open(args.first_forced / name, "rb") as short, gzip.open(args.full_cycle / name, "rb") as long:
        short_hash, long_hash = stream_header(short, first), stream_header(long, full)
        matched, extra = 0, 0
        for line in short:
            assert line == long.readline(), f"First-Forced node #{matched} differs from the full run"
            short_hash.update(line)
            long_hash.update(line)
            matched += 1
        for line in long:
            long_hash.update(line)
            extra += 1
    assert matched == first["node_count"] and matched + extra == full["node_count"]
    assert short_hash.hexdigest() == first["node_stream_sha256"]
    assert long_hash.hexdigest() == full["node_stream_sha256"]
    result = {
        "schema": "MathScope.M3.CorrectedFirstForceToCyclePrefix/1",
        "matchedPrefixNodes": matched, "fullGraphExtraNodes": extra,
        "firstForceCommit": first["executing_commit"], "fullCycleCommit": full["executing_commit"],
        "firstForceGraphSHA256": short_hash.hexdigest(), "fullCycleGraphSHA256": long_hash.hexdigest(),
        "completeAdditiveFlatResidual": False, "uniformSourceDerivativeBounds": False,
        "finalJets": 0, "release": "HOLD",
    }
    args.out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"{matched:,} first-Forced source nodes preserved in the corrected full cycle")


if __name__ == "__main__":
    main()
