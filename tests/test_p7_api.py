"""Transport boundaries plus actual isolated P7 calculations and replay."""
from copy import deepcopy
import threading
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from app import p7_api

app = FastAPI()
app.include_router(p7_api.router)
client = TestClient(app)
REQUEST = {"kind": "p7.special_function", "input": {
    "operation": "zeta", "s": {"real": "2", "imag": "0"},
    "precisionBits": 192, "tolerance": "1e-40"}}


def test_capabilities_bind_source_and_keep_milestone_open():
    data = client.get("/v1/p7/capabilities").json()
    assert "p7.elliptic_analytic" in data["kinds"]
    assert len(data["sourceBinding"]["files"]) >= 4
    assert data["predecessor"]["M2Commit"] == "90e977ba9225bfaa20fd3dcc97db7f794c5ed4c9"
    assert not data["wholeP7Complete"] and not data["wholeM3Complete"]


def test_actual_run_replay_and_forged_result():
    response = client.post("/v1/p7/run", json=REQUEST)
    assert response.status_code == 200, response.text
    record = response.json()
    assert record["execution"]["status"] == "COMPLETED", record["execution"]
    assert record["result"]["toleranceMet"]
    assert record["execution"]["observedChildResourceLimits"]["addressSpaceBytes"] == [384 * 1024**2] * 2
    replayed = client.post("/v1/p7/replay", json=record)
    assert replayed.status_code == 200
    assert replayed.json()["status"] == "MATCH"
    forged = deepcopy(record)
    forged["result"]["value"]["real"]["lower"]["mantissa"] = "123"
    cli = p7_api.runtime()
    forged["mathematicalSHA256"] = cli.digest({"request": forged["request"], "result": forged["result"]})
    forged["recordSHA256"] = cli.digest({k: v for k, v in forged.items() if k != "recordSHA256"})
    result = client.post("/v1/p7/replay", json=forged)
    assert result.status_code == 200
    assert result.json()["status"] == "MISMATCH_OR_UNRESOLVED"


@pytest.mark.parametrize("model,rank", [("11a1", 0), ("37a1", 1)])
def test_analytic_rank_endpoint(model, rank):
    response = client.post("/v1/p7/run", json={"kind": "p7.elliptic_analytic", "input": {"model": model}})
    assert response.status_code == 200
    record = response.json()
    assert record["execution"]["status"] == "COMPLETED", record["execution"]
    assert record["result"]["analyticRank"]["exactRank"] == rank
    assert record["wholeP7Complete"] is False


@pytest.mark.parametrize("kind,status", [
    ("p7.explicit_formula", "CERTIFIED_ENCLOSURE"),
    ("p7.taylor_remainder", "CERTIFIED_TAYLOR_ENCLOSURE"),
    ("p7.operator_audit", "REFERENCE_CONTRACT_AUDITED"),
])
def test_new_certified_contract_endpoints(kind, status):
    response = client.post("/v1/p7/run", json={"kind": kind, "input": {}})
    assert response.status_code == 200
    record = response.json()
    assert record["execution"]["status"] == "COMPLETED", record["execution"]
    assert record["result"]["status"] == status
    assert record["wholeP7Complete"] is False


@pytest.mark.parametrize("body", ['{"kind":"a","kind":"b","input":{}}', '{"x":NaN}', '[]'])
def test_malformed_requests_do_not_execute(body):
    response = client.post("/v1/p7/run", content=body, headers={"Content-Type": "application/json"})
    assert response.status_code in (400, 422)


@pytest.mark.parametrize("route", ["run", "replay"])
@pytest.mark.parametrize("body", [
    b'{"kind":"p7.special_function","input":{"x":1e309}}',
    b'{"kind":"p7.special_function","input":{"x":-1e309}}',
    b'{"kind":"p7.special_function","input":{"x":"\\ud800"}}',
    b'{"kind":"p7.special_function","input":{"\\ud800":1,"\\ud800":2}}',
])
def test_noncanonical_json_rejected_before_worker_dispatch(route, body):
    with patch.object(p7_api, "_execute") as execute:
        response = client.post("/v1/p7/" + route, content=body,
                               headers={"Content-Type": "application/json"})
    assert response.status_code == 400
    execute.assert_not_called()


def test_streamed_input_limit_before_parse():
    with patch.object(p7_api, "MAX_RUN_BYTES", 16):
        response = client.post("/v1/p7/run", content=(b" " * 17))
    assert response.status_code == 413


def test_concurrent_work_rejected_without_releasing_first_owner():
    acquired = p7_api._admission.acquire(blocking=False)
    assert acquired
    try:
        response = client.post("/v1/p7/run", json=REQUEST)
        assert response.status_code == 429
        assert p7_api._admission.locked()
    finally:
        p7_api._admission.release()


def test_rehashed_completion_promotion_rejected():
    record = client.post("/v1/p7/run", json=REQUEST).json()
    record["wholeM3Complete"] = True
    cli = p7_api.runtime()
    record["recordSHA256"] = cli.digest({k: v for k, v in record.items() if k != "recordSHA256"})
    response = client.post("/v1/p7/replay", json=record)
    assert response.status_code == 422


def test_admission_enforced_across_processes():
    lock_path = str(Path(tempfile.gettempdir()) / "mathscope-p7-admission.lock")
    child = subprocess.Popen([sys.executable, "-c",
        "import fcntl,sys,time; f=open(sys.argv[1],'a'); fcntl.flock(f.fileno(),fcntl.LOCK_EX); print('locked',flush=True); time.sleep(15)",
        lock_path], stdout=subprocess.PIPE, text=True)
    try:
        assert child.stdout.readline().strip() == "locked"
        assert client.post("/v1/p7/run", json=REQUEST).status_code == 429
        assert not p7_api._admission.locked()
    finally:
        child.terminate()
        child.wait(timeout=5)
