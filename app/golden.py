"""Executable, integrity-checked numerical replay. Checksums are NOT signatures."""
from __future__ import annotations

import copy
import json
import math
from typing import Any

from pydantic import BaseModel, Field

from app.provenance import environment_fingerprint, sha256_json as base_sha256_json


def wire_tree(value: Any) -> Any:
    """Normalize only Golden JSON so JS parse/stringify preserves its hash input.

    Hashes are calculated on the server, never by assuming JavaScript and Python
    have identical float serialization. A returned JSON number is parsed back
    to the same binary64 value; integral floats are normalized on both routes.
    """
    if isinstance(value, bool) or value is None or isinstance(value, str):
        return value
    if type(value) in (int, float):
        if not math.isfinite(value) or abs(value) > 9007199254740991:
            raise ValueError("Golden JSON numbers must be finite and within the JavaScript safe integer bound")
        return int(value) if value == int(value) else value
    if isinstance(value, list):
        return [wire_tree(v) for v in value]
    if isinstance(value, dict) and all(isinstance(k, str) for k in value):
        return {k: wire_tree(v) for k, v in value.items()}
    raise ValueError("Golden payload must contain JSON data only")


def wire_hash(value: Any) -> str:
    return base_sha256_json(wire_tree(value))


class ReplayRequest(BaseModel):
    record: dict[str, Any]
    targetSessionId: str = Field(min_length=1, max_length=128)
    targetRevision: int = Field(ge=1, le=1000000, strict=True)


def strict_json(value: Any) -> None:
    try:
        text = json.dumps(value, allow_nan=False)
    except (TypeError, ValueError) as exc:
        raise ValueError("Replay requires finite JSON data") from exc
    if len(text) > 8000000:
        raise ValueError("Replay record exceeds bounded fixture size")


def make_replay_record(spec: dict[str, Any], request_env: dict[str, Any], env: dict[str, Any], snap: dict[str, Any], nodes: list[dict[str, Any]]) -> dict[str, Any]:
    from app.adapters.golden_elliptic import NAME, VERSION
    record = wire_tree({"schema": "MathScopeNumericalReplay/1", "adapter": NAME, "adapterVersion": VERSION, "sourceSessionId": spec["sessionId"], "sourceRevision": spec["revision"], "inputSpec": spec, "requestEnvironment": request_env, "environmentFingerprint": env, "expectedInputsHash": wire_hash({"adapter": NAME, "inputSpec": spec}), "expectedEnvironmentHash": wire_hash(env), "expectedNumericalHash": wire_hash(snap), "numericalSnapshot": snap, "sourceNodes": nodes, "hashAlgorithm": "SHA256 server-canonical-json-v1: finite binary64, integral floats normalized to safe integers, Python sorted compact UTF8 JSON; hashes opaque to JS", "authenticityClaimed": False})
    strict_json(record)
    record["recordHash"] = wire_hash(record)
    return record


def equivalent(left: Any, right: Any) -> bool:
    if type(left) in (int, float) and type(right) in (int, float):
        return math.isclose(left, right, rel_tol=1e-10, abs_tol=1e-10)
    if type(left) is not type(right):
        return False
    if isinstance(left, dict):
        return left.keys() == right.keys() and all(equivalent(left[k], right[k]) for k in left)
    if isinstance(left, list):
        return len(left) == len(right) and all(equivalent(a, b) for a, b in zip(left, right))
    return left == right


def replay(request: ReplayRequest) -> dict[str, Any]:
    from app.adapters.golden_elliptic import GoldenEllipticAdapter, NAME, VERSION, normalize_spec, typed_bundle
    record = copy.deepcopy(request.record)
    strict_json(record)
    if record.get("schema") != "MathScopeNumericalReplay/1" or record.get("adapter") != NAME or record.get("adapterVersion") != VERSION:
        raise ValueError("Unsupported executable replay schema or adapter version")
    if record.get("recordHash") != wire_hash({k: v for k, v in record.items() if k != "recordHash"}):
        raise ValueError("Replay record integrity hash mismatch")
    spec = normalize_spec(record.get("inputSpec", {}))
    if spec != record["inputSpec"] or spec["sessionId"] != record.get("sourceSessionId") or type(record.get("sourceRevision")) is not int or spec["revision"] != record.get("sourceRevision"):
        raise ValueError("Replay source session/revision binding mismatch")
    if record.get("expectedInputsHash") != wire_hash({"adapter": NAME, "inputSpec": spec}) or record.get("expectedNumericalHash") != wire_hash(record.get("numericalSnapshot")):
        raise ValueError("Replay input or numerical hash mismatch")
    env, request_env = record.get("environmentFingerprint"), record.get("requestEnvironment")
    if not isinstance(env, dict) or not isinstance(request_env, dict) or record.get("expectedEnvironmentHash") != wire_hash(env) or env.get("requestEnvironment", {}) != request_env:
        raise ValueError("Replay environment binding mismatch")
    nodes = record.get("sourceNodes")
    if not isinstance(nodes, list) or not nodes or any(not isinstance(n, dict) or not isinstance(n.get("id"), str) or not isinstance(n.get("revision"), str) or not isinstance(n.get("upstreamRevisions"), list) or not isinstance(n.get("evidenceRefs"), list) or any(not isinstance(ref, str) for ref in n["upstreamRevisions"] + n["evidenceRefs"]) for n in nodes):
        raise ValueError("Replay source provenance graph missing")
    known_revisions, known_ids = {n.get("revision") for n in nodes}, {n.get("id") for n in nodes}
    if len(known_ids) != len(nodes) or len(known_revisions) != len(nodes):
        raise ValueError("Replay source graph has duplicate nodes")
    for node in nodes:
        if node.get("sessionId") != spec["sessionId"] or node.get("sessionRevision") != spec["revision"] or node.get("revision") != str(node.get("id")) + ":r" + str(spec["revision"]) or any(ref not in known_revisions for ref in node.get("upstreamRevisions", [])) or any(ref not in known_ids for ref in node.get("evidenceRefs", [])):
            raise ValueError("Replay graph cross-session/revision or unresolved reference")
    target_spec = {**spec, "sessionId": request.targetSessionId, "revision": request.targetRevision}
    result = GoldenEllipticAdapter().run(target_spec, request_env)
    golden = result.outputRepresentations[0]
    source_bundle, _ = typed_bundle(spec, golden["numericalSnapshot"], env)
    expected_nodes = [{k: node[k] for k in ("id", "type", "stage", "sessionId", "sessionRevision", "revision", "upstreamRevisions", "evidenceRefs")} for group in source_bundle.values() for node in group]
    if nodes != expected_nodes:
        raise ValueError("Replay source provenance graph differs from the executed adapter graph")
    exact = golden["numericalHash"] == record["expectedNumericalHash"]
    numerical_match = equivalent(record["numericalSnapshot"], golden["numericalSnapshot"])
    compatible = environment_fingerprint(request_env) == env
    checks = [
        {"name": "record integrity and source graph", "pass": True, "detail": "Hashes, source session, revision and all upstream references validated; hash is not authentication."},
        {"name": "runtime environment", "pass": compatible, "detail": "Exact captured runtime fingerprint comparison, including requested configuration."},
        {"name": "numerical exact hash", "pass": exact, "detail": "Session identity, revision and timestamps are excluded from the scientific snapshot."},
        {"name": "numerical tolerance comparison", "pass": numerical_match, "detail": "Recursive comparison at absolute and relative tolerance 1e-10."},
        {"name": "candidate and integration gates", "pass": golden["gate"]["pass"], "detail": "Candidate residual, same operator, mesh convergence, computed topology and guards."},
    ]
    passed = compatible and numerical_match and golden["gate"]["pass"]
    return {"pass": passed, "status": "NUMERICAL_REPLAY_PASS" if passed else "ENVIRONMENT_CHANGED_REVIEW_REQUIRED" if not compatible else "NUMERICAL_REPLAY_FAILED", "result": result, "checks": checks, "environmentCompatible": compatible, "exactMatch": exact, "numericallyEquivalent": numerical_match, "sourceSessionId": spec["sessionId"], "sourceRevision": spec["revision"], "targetSessionId": request.targetSessionId, "targetRevision": request.targetRevision, "sourceRecord": record, "formalPass": False}
