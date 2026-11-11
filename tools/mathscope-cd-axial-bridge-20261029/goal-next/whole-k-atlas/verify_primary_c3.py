"""Read back the finite original Primary C3 export and its exact parents."""
import gzip
from hashlib import sha256
import json
from pathlib import Path
import sys


def read(path):
    return json.loads(path.read_bytes())


def digest(stream):
    sha, count = sha256(), 0
    for block in iter(lambda: stream.read(1 << 20), b""):
        sha.update(block)
        count += len(block)
    return sha.hexdigest(), count


def verify(directory):
    receipt = read(directory / "original-whole-k-prefix.json")
    prefix = receipt["requestedPrefix"]
    assert prefix in (2, 3, 4) and receipt["primaryC3"] and receipt["selectorDiagonalOnly"]
    assert receipt["sourceCommit"] == "f8cb4034e86d7b669d52a6f2248aebba156b51b5"
    assert receipt["currentStage"] == "COMPLETE" and receipt["release"] == "HOLD"
    assert receipt["finalJets"] == 0
    data = receipt["primaryC3Result"]
    assert data["originalCurrentPrivateSeal"] and data["finalJets"] == 0
    assert receipt["selector"]["familyRequest"]["derivativeOrder"] == 6
    assert data["backgroundRow"]["derivativeOrder"] == 4
    assert data["backgroundRow"]["backgroundDerivativeOrder"] == 6
    assert data["referenceWindow"]["coefficientOrder"] == prefix
    assert [row["pole"] for row in data["targetRows"]] == [3, 6, 9, 12, 15]
    assert data["nativeScope"]["actualFiniteDerivativeOrder"] == 3
    assert data["nativeScope"]["actualOriginalPotentialWOneClassCertified"] is True
    assert data["nativeScope"]["actualOriginalPrimaryPressureWOneClassCertified"] is True
    assert data["nativeScope"]["actualForcedInputWClassCertified"] is False
    assert data["nativeScope"]["completeN6"] is False
    assert data["nativeChecks"] and all(row["pass"] is True for row in data["nativeChecks"])
    assert set(data["files"]) == {
        "primary-C3-certificate.json", "primary-C3-additive-program.json", "primary-C3-target-program.json",
    }
    for name, info in data["files"].items():
        with (directory / name).open("rb") as stream:
            assert digest(stream) == (info["sha256"], info["bytes"])
    cert = read(directory / "primary-C3-certificate.json")
    add = read(directory / "primary-C3-additive-program.json")
    assert cert["scope"] == add["record"]["scope"] == data["nativeScope"]
    assert cert["checks"] == add["record"]["checks"] == data["nativeChecks"]
    assert add["record"]["request"]["order"] == 3
    assert cert["graph"]["sha256"] == data["files"]["primary-C3-additive-program.json"]["sha256"]
    assert add["targetBase"] == cert["sourceTarget"]["graph"]
    assert add["currentBase"] == cert["sourceCurrent"]["graph"]
    assert add["targetBase"]["sha256"] == data["files"]["primary-C3-target-program.json"]["sha256"]
    assert add["norm"]["start"] == add["targetBase"]["nodeCount"]
    assert len(add["norm"]["nodes"]) == cert["graph"]["normAddedNodes"]
    assert len(add["current"]["nodes"]) == cert["graph"]["currentAddedNodes"]
    path = directory / "original-whole-k-primary-current-graph"
    manifest = read(path / "original-source-export-manifest.json")
    assert data["currentSnapshot"] == manifest and manifest["executing_commit"] == receipt["executingCommit"]
    assert add["current"]["start"] == add["currentBase"]["nodeCount"]
    assert add["current"]["start"] + len(add["current"]["nodes"]) == manifest["node_count"]
    assert manifest["scope"] == f"ORIGINAL_WHOLE_K_N{prefix}_PRIMARY_C3_CURRENT"
    assert manifest["actual_final_67_jets_certified"] == 0
    assert sha256((path / "original-source-functions.json").read_bytes()).hexdigest() == manifest["definitions_sha256"]
    hasher, byte_count, node_count = sha256(), 0, 0
    with gzip.open(path / "original-source-nodes.jsonl.gz", "rb") as stream:
        header = stream.readline()
        assert json.loads(header) == {"schema": "MathScope.M3.FullNodesJSONL/1", "node_count": manifest["node_count"]}
        hasher.update(header)
        byte_count += len(header)
        start = add["current"]["start"]
        for index, line in enumerate(stream):
            hasher.update(line)
            byte_count += len(line)
            node_count += 1
            if index >= start:
                assert json.loads(line) == add["current"]["nodes"][index-start], index
    assert node_count == manifest["node_count"]
    assert (hasher.hexdigest(), byte_count) == (manifest["node_stream_sha256"], manifest["node_stream_uncompressed_bytes"])
    result = {
        "status": "VERIFIED_ORIGINAL_PRIMARY_C3_ON_ADMITTED_PREFIX",
        "prefix": prefix,
        "executingCommit": receipt["executingCommit"],
        "currentNodes": manifest["node_count"],
        "currentGraphSHA256": manifest["node_stream_sha256"],
        "classProgramSHA256": cert["graph"]["sha256"],
        "exactPrefixDomain": data["exactPrefixDomain"],
        "actualFinalJets": 0,
        "release": "HOLD",
    }
    (directory / "primary-C3-independent-readback.json").write_bytes((json.dumps(result, indent=2)+"\n").encode())
    print(f"PASS original C6/C4/Primary C3 source and parent links on N{prefix}")


if __name__ == "__main__":
    verify(Path(sys.argv[1]))
