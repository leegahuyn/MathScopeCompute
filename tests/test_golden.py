import copy
import json
import math
import shutil
import subprocess

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.adapters.golden_elliptic import GoldenEllipticAdapter, fd_modes, periodic_laplacian, validate_graph
from app.golden import ReplayRequest, replay, wire_hash, wire_tree
from app.main import app
from app.golden import wire_hash as sha256_json


@pytest.fixture(scope="module")
def result():
    return GoldenEllipticAdapter().run({"sessionId": "research-original", "revision": 3, "gridN": 8}, {"seed": 0, "requestedPrecision": "float64"})


@pytest.fixture
def golden(result):
    return copy.deepcopy(result.outputRepresentations[0])


def rehash(record):
    record["recordHash"] = sha256_json({k: v for k, v in record.items() if k != "recordHash"})
    return record


def test_scientific_invariants_against_independent_matrix_and_formulas(golden):
    s = golden["numericalSnapshot"]
    assert s["candidate"]["residualLinf"] == 0
    assert s["candidate"]["accepted"]
    assert s["operator"]["potential"] == -2
    assert s["spectrum"]["lowModes"][0] == {"kx": 0, "ky": 0, "value": -2.0, "continuousReference": -2.0}
    # Construct an independent 2-D periodic finite-difference matrix by neighbors.
    n = 8
    matrix = np.zeros((n * n, n * n))
    for i in range(n):
        for j in range(n):
            row = i * n + j
            matrix[row, row] = 4 * n * n - 2
            for x, y in (((i + 1) % n, j), ((i - 1) % n, j), (i, (j + 1) % n), (i, (j - 1) % n)):
                matrix[row, x * n + y] -= n * n
    np.testing.assert_allclose(np.linalg.eigvalsh(matrix), s["spectrum"]["allFiniteEigenvalues"], atol=1e-10)
    np.testing.assert_allclose(matrix, periodic_laplacian(n).toarray() - 2 * np.eye(n * n))
    assert s["spectrum"]["selectedEigenmodeResidual"] < 1e-10
    errors = [r["absoluteError"] for r in s["spectrum"]["refinement"]]
    assert errors[0] > errors[1] > errors[2] > 0
    assert errors[0] / errors[1] == pytest.approx(4, rel=.03)
    assert s["topology"]["sourceBetti"] == s["topology"]["displayBetti"] == [1, 2, 1]
    assert [p["birth"] for p in s["topology"]["persistence"]] == [1, 1, 1, 1]
    assert s["topology"]["finiteComplexEqual"]
    assert s["symmetry"]["commutatorLinf"] == 0
    assert s["spectralFlow"]["spectralFlow"] == 1
    assert s["spectralFlow"]["crossings"] == [{"kx": 0, "ky": 0, "parameter": 2.0, "orientation": 1}]
    assert golden["gate"]["pass"]


def test_actual_mesh_fidelity_and_no_infinite_or_formal_promotion(result, golden):
    s = golden["numericalSnapshot"]
    assert len(s["mesh"]["vertices"]) == 64 and len(s["mesh"]["triangles"]) == 128
    assert all(len(v["source4D"]) == 4 and len(v["display3D"]) == 3 for v in s["mesh"]["vertices"])
    assert all(v["candidateValue"] == 1 for v in s["mesh"]["vertices"])
    assert s["fidelity"]["displayToSourceEdgeLengthRatioMin"] > 1
    assert s["fidelity"]["displayIsometry"] is False
    assert s["index"]["kernelDimension"] is None and s["index"]["invertible"] is None
    assert s["index"]["indexZeroImpliesInvertible"] is False
    assert s["boundary"]["present"] is False
    assert s["formalCoverage"]["numericalResultIsFormalPass"] is False
    assert s["formalCoverage"]["advancedIndexTheoremFormalized"] is False
    assert all(ev.grade == "NUMERICAL INDICATOR" for ev in result.evidenceRecords)
    assert golden["gate"]["formalPass"] is False and golden["gate"]["releaseFreezeAuthorized"] is False
    assert s["stress"]["lambdaSweep"][0]["accepted"] is False
    assert s["stress"]["lambdaSweep"][1]["accepted"] is True
    assert s["stress"]["nonconstantCandidatePerturbation"]["accepted"] is False


def test_full_graph_same_session_revision_and_same_operator(golden):
    bundle = golden["typedBundle"]
    validate_graph(bundle, "research-original", 3)
    nodes = [n for group in bundle.values() for n in group]
    assert {n["sessionId"] for n in nodes} == {"research-original"}
    assert {n["sessionRevision"] for n in nodes} == {3}
    linear = bundle["operators"][0]
    assert bundle["spectra"][0]["operatorRef"] == linear["id"]
    assert bundle["symmetries"][0]["operatorRef"] == linear["id"]
    assert bundle["kclasses"][0]["operatorRef"] == linear["id"]
    assert bundle["kclasses"][1]["operatorRef"] == linear["id"]
    assert {n["stage"] for n in bundle["evidence"]} == {"A", "B", "C", "D"}
    assert bundle["representations"][0]["mesh"] == golden["numericalSnapshot"]["mesh"]
    assert bundle["pdes"][0]["boundaryConditions"]["exteriorBoundaryPresent"] is False
    assert bundle["pdes"][0]["initialConditions"]["applicable"] is False
    assert bundle["pdes"][0]["solverPlan"]["gridN"] == 8
    assert bundle["pdes"][0]["solverPlan"]["seed"] == 0
    assert bundle["representations"][0]["fieldChannels"]["eigenmode"]["operatorRef"] == linear["id"]


@pytest.mark.parametrize("mutation", ["session", "revision", "upstream"])
def test_cross_session_or_revision_rejected(golden, mutation):
    bundle = golden["typedBundle"]
    node = bundle["operators"][0]
    if mutation == "session":
        node["sessionId"] = "unrelated"
    elif mutation == "revision":
        node["sessionRevision"] = 9
    else:
        node["upstreamRevisions"].append("other-node:r9")
    with pytest.raises(ValueError):
        validate_graph(bundle, "research-original", 3)


@pytest.mark.parametrize("change", [{"candidateValue": 1.01}, {"lambda": 1.25}])
def test_mutation_invalidates_candidate_and_rebuilds_operator(golden, change):
    spec = {**golden["inputSpec"], **change, "revision": 4}
    mutated = GoldenEllipticAdapter().run(spec, {}).outputRepresentations[0]
    s = mutated["numericalSnapshot"]
    assert not s["candidate"]["accepted"] and not mutated["gate"]["pass"]
    assert s["operator"]["potential"] == pytest.approx(spec["lambda"] - 3 * spec["candidateValue"] ** 2)
    assert mutated["numericalHash"] != golden["numericalHash"]
    assert set(n["id"] for n in mutated["nodes"]).isdisjoint(n["id"] for n in golden["nodes"])
    assert all(n["sessionRevision"] == 4 for n in mutated["nodes"])


def test_executable_replay_recomputes_in_new_session(golden):
    # JSON round-trip simulates the numerical payload after ZIP extraction.
    record = json.loads(json.dumps(golden["executableReplayRecord"]))
    replayed = replay(ReplayRequest(record=record, targetSessionId="imported-new", targetRevision=1))
    assert replayed["pass"] and replayed["exactMatch"] and replayed["environmentCompatible"]
    assert replayed["numericallyEquivalent"] and replayed["formalPass"] is False
    assert replayed["sourceRecord"] == record
    assert replayed["sourceSessionId"] == "research-original"
    g = replayed["result"].outputRepresentations[0]
    assert g["sessionId"] == "imported-new" and g["sessionRevision"] == 1
    validate_graph(g["typedBundle"], "imported-new", 1)
    assert g["numericalHash"] == golden["numericalHash"]
    assert set(n["id"] for n in g["nodes"]).isdisjoint(n["id"] for n in golden["nodes"])


@pytest.mark.parametrize("target_revision", [2, 3])
def test_replay_rejects_reused_or_older_source_identity_before_computing(golden, monkeypatch, target_revision):
    def unexpected_run(*args, **kwargs):
        pytest.fail("A replay that reuses source identities must not run the adapter")

    monkeypatch.setattr(GoldenEllipticAdapter, "run", unexpected_run)
    record = golden["executableReplayRecord"]
    with pytest.raises(ValueError, match="same-session replay requires a newer target revision"):
        replay(ReplayRequest(record=record, targetSessionId=record["sourceSessionId"], targetRevision=target_revision))


def test_replay_same_session_new_revision_uses_fresh_node_ids(golden):
    record = golden["executableReplayRecord"]
    target_revision = record["sourceRevision"] + 1
    replayed = replay(ReplayRequest(record=record, targetSessionId=record["sourceSessionId"], targetRevision=target_revision))
    assert replayed["pass"]
    target = replayed["result"].outputRepresentations[0]
    validate_graph(target["typedBundle"], record["sourceSessionId"], target_revision)
    assert {n["id"] for n in target["nodes"]}.isdisjoint(n["id"] for n in golden["nodes"])
    assert {n["revision"] for n in target["nodes"]}.isdisjoint(n["revision"] for n in golden["nodes"])


def test_api_replay_rejects_source_identity(golden, monkeypatch):
    def unexpected_run(*args, **kwargs):
        pytest.fail("Rejected API replay must not run the adapter")

    monkeypatch.setattr(GoldenEllipticAdapter, "run", unexpected_run)
    record = golden["executableReplayRecord"]
    response = TestClient(app).post("/v1/replay", json={"record": record, "targetSessionId": record["sourceSessionId"], "targetRevision": record["sourceRevision"]})
    assert response.status_code == 422
    assert "same-session replay requires a newer target revision" in response.json()["detail"]


def test_wire_normalization_integral_floats_and_safe_numbers(golden):
    assert wire_hash({"zero": -0.0, "n": 1.0, "array": [2.0]}) == wire_hash({"zero": 0, "n": 1, "array": [2]})
    assert wire_tree({"one": 1.0, "fraction": 1e-7}) == {"one": 1, "fraction": 1e-7}
    record = wire_tree(golden["executableReplayRecord"])
    assert replay(ReplayRequest(record=record, targetSessionId="wire-roundtrip", targetRevision=1))["pass"]
    for unsafe in (float("nan"), float("inf"), 9007199254740992, -9007199254740992):
        with pytest.raises(ValueError):
            wire_tree({"callerEnvironment": unsafe})


@pytest.mark.skipif(shutil.which("node") is None, reason="Node is needed only for the actual JavaScript wire round-trip check")
def test_actual_node_parse_stringify_replays(golden):
    record = golden["executableReplayRecord"]
    actual_js = subprocess.run(["node", "-e", "let s='';process.stdin.setEncoding('utf8');process.stdin.on('data',v=>s+=v);process.stdin.on('end',()=>process.stdout.write(JSON.stringify(JSON.parse(s))));"], input=json.dumps(record), text=True, capture_output=True, check=True)
    parsed = json.loads(actual_js.stdout)
    assert replay(ReplayRequest(record=parsed, targetSessionId="actual-javascript-roundtrip", targetRevision=1))["pass"]


def test_rehashed_detached_source_graph_is_rejected(golden):
    record = golden["executableReplayRecord"]
    record["sourceNodes"][4]["upstreamRevisions"] = []
    rehash(record)
    with pytest.raises(ValueError, match="executed adapter graph"):
        replay(ReplayRequest(record=record, targetSessionId="detached", targetRevision=1))


@pytest.mark.parametrize("mutation", ["candidate", "hash", "cross-session", "cross-revision", "dangling-edge"])
def test_imported_mutation_or_cross_binding_rejected(golden, mutation):
    record = golden["executableReplayRecord"]
    if mutation == "candidate":
        record["inputSpec"]["candidateValue"] = 1.1
    elif mutation == "hash":
        record["expectedNumericalHash"] = "0" * 64
    elif mutation == "cross-session":
        record["sourceSessionId"] = "other"
        rehash(record)
    elif mutation == "cross-revision":
        record["sourceNodes"][0]["sessionRevision"] = 100
        rehash(record)
    else:
        record["sourceNodes"][0]["upstreamRevisions"].append("other:r100")
        rehash(record)
    with pytest.raises(ValueError):
        replay(ReplayRequest(record=record, targetSessionId="new", targetRevision=1))


def test_environment_change_requires_review_even_matching_numbers(golden):
    record = golden["executableReplayRecord"]
    record["environmentFingerprint"]["python"] = "different-version"
    record["expectedEnvironmentHash"] = sha256_json(record["environmentFingerprint"])
    rehash(record)
    replayed = replay(ReplayRequest(record=record, targetSessionId="new", targetRevision=1))
    assert not replayed["pass"] and not replayed["environmentCompatible"]
    assert replayed["exactMatch"] and replayed["numericallyEquivalent"]
    assert replayed["status"] == "ENVIRONMENT_CHANGED_REVIEW_REQUIRED"


@pytest.mark.parametrize("failure", ["snapshot", "candidate-gate"])
def test_numerical_failure_takes_priority_over_changed_environment(golden, failure):
    if failure == "candidate-gate":
        # Preserve a reproducible snapshot while making the actual candidate fail.
        golden = GoldenEllipticAdapter().run({**golden["inputSpec"], "candidateValue": 1.01}, {}).outputRepresentations[0]
    record = golden["executableReplayRecord"]
    record["environmentFingerprint"]["python"] = "different-version"
    record["expectedEnvironmentHash"] = sha256_json(record["environmentFingerprint"])
    if failure == "snapshot":
        record["numericalSnapshot"]["operator"]["potential"] = 10
        record["expectedNumericalHash"] = sha256_json(record["numericalSnapshot"])
    rehash(record)
    replayed = replay(ReplayRequest(record=record, targetSessionId="failed-replay", targetRevision=1))
    assert not replayed["pass"] and not replayed["environmentCompatible"]
    assert replayed["numericallyEquivalent"] is (failure == "candidate-gate")
    assert replayed["result"].outputRepresentations[0]["gate"]["pass"] is (failure == "snapshot")
    assert replayed["status"] == "NUMERICAL_REPLAY_FAILED"


def test_bad_expected_snapshot_cannot_pass_by_rehashing(golden):
    record = golden["executableReplayRecord"]
    record["numericalSnapshot"]["operator"]["potential"] = 10
    record["expectedNumericalHash"] = sha256_json(record["numericalSnapshot"])
    rehash(record)
    replayed = replay(ReplayRequest(record=record, targetSessionId="new", targetRevision=1))
    assert not replayed["pass"] and not replayed["numericallyEquivalent"]
    assert replayed["status"] == "NUMERICAL_REPLAY_FAILED"


@pytest.mark.parametrize("change", [{"gridN": 1000}, {"lambda": float("nan")}, {"candidateValue": True}, {"revision": True}, {"refinements": [16, 8]}, {"sessionId": "invalid space"}, {"seed": 8}])
def test_invalid_or_unbounded_inputs(change):
    with pytest.raises(ValueError):
        GoldenEllipticAdapter().run({"sessionId": "test", "revision": 1, **change}, {})


def test_api_run_and_replay_contract_and_invalid_status():
    client = TestClient(app)
    run = client.post("/v1/run", json={"adapter": "golden.elliptic-torus.v1", "inputSpec": {"sessionId": "api-source", "revision": 1, "gridN": 8}, "environment": {"mode": "test"}})
    assert run.status_code == 200
    result = run.json()
    assert result["jobId"] and result["elapsedMs"] > 0
    record = result["outputRepresentations"][0]["executableReplayRecord"]
    response = client.post("/v1/replay", json={"record": record, "targetSessionId": "api-target", "targetRevision": 2})
    assert response.status_code == 200 and response.json()["pass"]
    record["recordHash"] = "tampered"
    assert client.post("/v1/replay", json={"record": record, "targetSessionId": "api-target", "targetRevision": 2}).status_code == 422
    assert any(a["name"] == "golden.elliptic-torus.v1" for a in client.get("/v1/capabilities").json()["implemented"])
