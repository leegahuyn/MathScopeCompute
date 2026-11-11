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


def potential_operand(cert, additive):
    bounds = cert["bounds"]
    weighted = bounds["degreeProgram"]["weighted"]
    assert weighted["potential"][3] == {"power": 1283, "pole": 18}
    assert weighted["curlRows"][2]["fastTerms"][0] == {"power": 1284, "pole": 18}
    assert weighted["targetPoles"][:4] == [3, 6, 9, 12]
    norm = additive["norm"]
    root = bounds["K"]
    assert norm["start"] <= root < norm["start"]+len(norm["nodes"])
    node = norm["nodes"][root-norm["start"]]
    assert node["op"] == "maximum"
    required = {bounds["backgroundRow"]["B_m"], bounds["coefficientConstants"]["maximum"],
                *(row["N_m"] for row in bounds["targetRows"][:4])}
    assert required <= set(node["args"])
    return {
        "nativePrimaryClassOrder": cert["request"]["order"],
        "originalKRoot": root, "power": 1283, "pole": 18,
        "KRequiredOperands": sorted(required),
        "bound": "K^1283*S^1283*epsilon*sqrt(zeta)*delta^(-18)*P(v)",
    }


def verify(directory):
    receipt = read(directory / "original-whole-k-prefix.json")
    prefix = receipt["requestedPrefix"]
    order = receipt.get("primaryOrder", 3)
    assert order in (2, 3)
    assert prefix in (2, 3, 4) and receipt["primaryC3"] and receipt["selectorDiagonalOnly"]
    assert receipt["sourceCommit"] == "f8cb4034e86d7b669d52a6f2248aebba156b51b5"
    assert receipt["currentStage"] == "COMPLETE" and receipt["release"] == "HOLD"
    assert receipt["finalJets"] == 0
    data = receipt["primaryC3Result"]
    assert data["originalCurrentPrivateSeal"] and data["finalJets"] == 0
    assert receipt["selector"]["familyRequest"]["derivativeOrder"] == order+3
    assert data["backgroundRow"]["derivativeOrder"] == order+1
    assert data["backgroundRow"]["backgroundDerivativeOrder"] == order+3
    assert data["referenceWindow"]["coefficientOrder"] == prefix
    assert [row["pole"] for row in data["targetRows"]] == [3*(i+1) for i in range(order+2)]
    assert data["nativeScope"]["actualFiniteDerivativeOrder"] == order
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
    assert add["record"]["request"]["order"] == order
    operand = potential_operand(cert, add)
    assert all(data["potentialOrderThree"][name] == operand[name] for name in operand if name != "KRequiredOperands")
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
        "status": "VERIFIED_ORIGINAL_PRIMARY_POTENTIAL_C3_ON_ADMITTED_PREFIX",
        "prefix": prefix,
        "nativePrimaryClassOrder": order,
        "potentialOrderThree": operand,
        "executingCommit": receipt["executingCommit"],
        "currentNodes": manifest["node_count"],
        "currentGraphSHA256": manifest["node_stream_sha256"],
        "classProgramSHA256": cert["graph"]["sha256"],
        "exactPrefixDomain": data["exactPrefixDomain"],
        "actualFinalJets": 0,
        "release": "HOLD",
    }
    (directory / "primary-C3-independent-readback.json").write_bytes((json.dumps(result, indent=2)+"\n").encode())
    print(f"PASS original C{order+3}/C{order+1}/Primary C{order} and potential C3 source on N{prefix}")


def verify_baseline(directory, output):
    status = read(directory / "status.json")
    assert status["sourceCommit"] == "f8cb4034e86d7b669d52a6f2248aebba156b51b5"
    assert status["status"] == "PASS" and status["release"] == "HOLD"
    for name in ("primary-certificate.json", "primary-additive-program.json"):
        with (directory / name).open("rb") as stream:
            info = status["files"][name]
            assert digest(stream) == (info["sha256"], info["bytes"])
    cert = read(directory / "primary-certificate.json")
    add = read(directory / "primary-additive-program.json")
    assert cert["graph"]["sha256"] == status["primaryHash"]
    assert cert["request"]["order"] == 2 and cert["scope"]["actualOriginalPotentialWOneClassCertified"] is True
    assert cert["bounds"]["backgroundRow"]["backgroundDerivativeOrder"] == 5
    assert cert["domain"]["actualWindow"]["coefficientOrder"] == 1
    result = {
        "schema": "MathScope.N7.ActualC2ProofPotentialC3Operand/1",
        "originalGitHubRun": 43035074273,
        "sourceCommit": status["sourceCommit"],
        "primaryProgramSHA256": status["primaryHash"],
        "originalCoefficientWindow": 1,
        "potentialOrderThree": potential_operand(cert, add),
        "scope": "Original norm operand on its admitted N1 window. Same-source N2/N3 replay and physical transport are required on whole K.",
        "finalJets": 0,
        "release": "HOLD",
    }
    output.write_bytes((json.dumps(result, indent=2)+"\n").encode())
    print("PASS actual curl C2 source already contains the potential C3 norm operand")


if __name__ == "__main__":
    if sys.argv[1] == "--baseline":
        verify_baseline(Path(sys.argv[2]), Path(sys.argv[3]))
    else:
        verify(Path(sys.argv[1]))
