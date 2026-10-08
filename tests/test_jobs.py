import copy
import asyncio
import multiprocessing
import time
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.adapters.golden_elliptic import GoldenEllipticAdapter
from app.golden import wire_hash
from app.jobs import JobManager, JobNotFound, JobCapacityExceeded, JobBodyLimitMiddleware, RunJobRequest, ReplayJobRequest, validate_submission, MAX_PAYLOAD_BYTES, MAX_RESULT_BYTES
from app.main import app


def golden_request():
    return RunJobRequest(kind="run", inputSpec={"sessionId": "async-job-source", "revision": 1, "gridN": 8}, environment={"purpose": "job-test"})


def zeta_request(big=False):
    return RunJobRequest(kind="run", adapter="advanced.zeta-complex-surface.v1", inputSpec={"realSamples": 40 if big else 4, "imagSamples": 40 if big else 4, "precisionDps": 50 if big else 20})


def wait_for(manager, ticket, states, timeout=25):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        status = manager.status(ticket["jobId"], ticket["token"])
        if status["status"] in states or status["phase"] in states:
            return status
        time.sleep(.02)
    raise AssertionError("Worker did not reach " + str(states))


@pytest.fixture
def manager():
    instance = JobManager(runtime_seconds=45, monitor_interval=.01)
    yield instance
    instance.close()


@pytest.fixture(scope="module")
def record():
    req = golden_request()
    return GoldenEllipticAdapter().run(req.inputSpec, req.environment).outputRepresentations[0]["executableReplayRecord"]


def test_real_process_golden_run_and_measured_telemetry(manager, record):
    ticket = manager.submit(golden_request())
    assert ticket["status"] == "running" and len(ticket["token"]) >= 40
    assert ticket["jobId"] != ticket["token"]
    done = wait_for(manager, ticket, {"completed", "failed", "timed_out"})
    assert done["status"] == "completed", done
    assert done["workerStopped"] and done["result"]["jobId"] == ticket["jobId"]
    assert "token" not in done
    assert done["result"]["outputRepresentations"][0]["gate"]["pass"]
    assert done["result"]["reproducibilityHash"] == record["expectedNumericalHash"]
    assert all(e["grade"] == "NUMERICAL INDICATOR" for e in done["result"]["evidenceRecords"])
    metrics = done["telemetry"]
    assert metrics["cpuUserSeconds"] >= 0 and metrics["cpuSystemSeconds"] >= 0
    assert metrics["cpuTotalSeconds"] > 0 and metrics["peakRSSBytes"] > 0
    assert not metrics["browserCpuMeasured"]
    assert "telemetry" not in done["result"]["outputRepresentations"][0]["numericalSnapshot"]


def test_real_process_golden_replay(manager, record):
    ticket = manager.submit(ReplayJobRequest(kind="replay", record=record, targetSessionId="async-imported", targetRevision=2))
    done = wait_for(manager, ticket, {"completed", "failed", "timed_out"})
    assert done["status"] == "completed", done
    replay = done["result"]
    assert replay["pass"] and replay["exactMatch"] and replay["environmentCompatible"]
    assert replay["sourceSessionId"] == "async-job-source" and replay["targetSessionId"] == "async-imported"
    assert replay["result"]["jobId"] == ticket["jobId"]


def test_real_process_zeta_run(manager):
    ticket = manager.submit(zeta_request())
    done = wait_for(manager, ticket, {"completed", "failed", "timed_out"})
    assert done["status"] == "completed", done
    assert done["result"]["outputRepresentations"][0]["grid"]["pointCount"] == 16
    assert done["result"]["evidenceRecords"][0]["grade"] == "NUMERICAL INDICATOR"


def test_actual_executing_child_terminated_joined_and_never_returns_late_result(manager):
    ticket = manager.submit(zeta_request(big=True))
    executing = wait_for(manager, ticket, {"executing", "completed", "failed"})
    assert executing["phase"] == "executing" and executing["status"] == "running"
    process = manager.jobs[ticket["jobId"]].process
    assert process.is_alive()
    cancelled = manager.cancel(ticket["jobId"], ticket["token"])
    assert cancelled["status"] == "cancelled" and cancelled["cancellationConfirmed"]
    assert cancelled["workerStopped"] and not process.is_alive() and process.exitcode is not None
    assert cancelled["terminationMethod"] in ("terminate-and-join", "kill-and-join")
    assert "result" not in cancelled and cancelled["error"]["failureKind"] == "CANCELLED"
    assert cancelled["error"]["executionScope"] == "SERVER_WORKER"
    time.sleep(.06)
    later = manager.status(ticket["jobId"], ticket["token"])
    assert later["status"] == "cancelled" and "result" not in later
    assert manager.cancel(ticket["jobId"], ticket["token"])["status"] == "cancelled"


def test_cancel_completed_uncommitted_result_discards_it(manager):
    ticket = manager.submit(golden_request())
    assert wait_for(manager, ticket, {"completed"})["result"]
    cancelled = manager.cancel(ticket["jobId"], ticket["token"])
    assert cancelled["status"] == "cancelled" and cancelled["cancellationConfirmed"]
    assert "result" not in cancelled
    assert "result" not in manager.status(ticket["jobId"], ticket["token"])


def test_ownership_token_required_for_read_and_cancel(manager):
    ticket = manager.submit(zeta_request(big=True))
    for token in ("", ticket["jobId"], "x" * 43, "한글"):
        with pytest.raises(JobNotFound):
            manager.status(ticket["jobId"], token)
        with pytest.raises(JobNotFound):
            manager.cancel(ticket["jobId"], token)
    assert manager.status(ticket["jobId"], ticket["token"])["status"] == "running"
    manager.cancel(ticket["jobId"], ticket["token"])
    other = manager.submit(zeta_request(big=True))
    assert other["token"] != ticket["token"]
    with pytest.raises(JobNotFound):
        manager.cancel(other["jobId"], ticket["token"])


def test_concurrency_boundary_is_atomic_under_parallel_submissions(manager):
    def submit(_):
        try:
            return manager.submit(zeta_request(big=True))
        except JobCapacityExceeded:
            return None
    with ThreadPoolExecutor(max_workers=8) as executor:
        answers = list(executor.map(submit, range(8)))
    accepted = [a for a in answers if a]
    assert len(accepted) == 1 and len(manager.jobs) == 1
    manager.cancel(accepted[0]["jobId"], accepted[0]["token"])
    assert manager.submit(golden_request())["status"] == "running"


def test_timeout_really_stops_worker():
    manager = JobManager(runtime_seconds=.05, monitor_interval=.01)
    try:
        ticket = manager.submit(zeta_request(big=True))
        process = manager.jobs[ticket["jobId"]].process
        timed = wait_for(manager, ticket, {"timed_out"})
        assert timed["cancellationConfirmed"] and timed["workerStopped"] and not process.is_alive()
        assert timed["error"]["failureKind"] == "TIMEOUT" and "result" not in timed
    finally:
        manager.close()


def test_terminal_ttl_and_maximum_retained_jobs():
    manager = JobManager(max_retained=1, retention_seconds=.12, monitor_interval=.01)
    try:
        ticket = manager.submit(zeta_request(big=True))
        manager.cancel(ticket["jobId"], ticket["token"])
        with pytest.raises(JobCapacityExceeded):
            manager.submit(golden_request())
        time.sleep(.18)
        with pytest.raises(JobNotFound):
            manager.status(ticket["jobId"], ticket["token"])
        assert manager.submit(golden_request())["status"] == "running"
    finally:
        manager.close()


def test_manager_shutdown_terminates_all_children():
    manager = JobManager()
    ticket = manager.submit(zeta_request(big=True))
    pid = manager.jobs[ticket["jobId"]].process.pid
    manager.close()
    assert pid not in {p.pid for p in multiprocessing.active_children()}
    assert manager.jobs == {}


def test_result_storage_reservation_is_bounded():
    manager = JobManager(max_result_storage_bytes=MAX_RESULT_BYTES - 1)
    try:
        with pytest.raises(JobCapacityExceeded):
            manager.submit(golden_request())
        assert manager.jobs == {}
    finally:
        manager.close()


def test_deep_json_rejected_before_starting_worker():
    nested = 0
    for _ in range(40):
        nested = {"nested": nested}
    req = golden_request().model_copy(update={"environment": {"deep": nested}})
    with pytest.raises(ValueError, match="nesting"):
        validate_submission(req)


def test_streamed_body_limit_does_not_trust_content_length():
    async def probe():
        sent, reached = [], []
        messages = iter([{"type": "http.request", "body": b"x" * MAX_PAYLOAD_BYTES, "more_body": True}, {"type": "http.request", "body": b"x", "more_body": False}])
        async def receive():
            return next(messages)
        async def send(message):
            sent.append(message)
        async def downstream(*args):
            reached.append(True)
        await JobBodyLimitMiddleware(downstream)({"type": "http", "method": "POST", "path": "/v1/jobs", "headers": []}, receive, send)
        assert not reached
        assert sent[0]["status"] == 413
    asyncio.run(probe())


@pytest.mark.parametrize("payload", [
    {"kind": "run", "adapter": "arbitrary.shell", "inputSpec": {}},
    {"kind": "run", "inputSpec": {}, "source": "arbitrary code"},
])
def test_arbitrary_code_or_adapter_is_not_an_accepted_request(payload):
    with pytest.raises(ValidationError):
        RunJobRequest(**payload)


@pytest.mark.parametrize("job_request", [
    RunJobRequest(kind="run", inputSpec={"sessionId": "s", "revision": 1, "gridN": 1000}),
    RunJobRequest(kind="run", inputSpec={"sessionId": "s", "revision": 1}, environment={"huge": "x" * 9000}),
    RunJobRequest(kind="run", adapter="advanced.zeta-complex-surface.v1", inputSpec={"realSamples": 45, "imagSamples": 45}),
    RunJobRequest(kind="run", adapter="advanced.zeta-complex-surface.v1", inputSpec={"precisionDps": 1000}),
    RunJobRequest(kind="run", adapter="advanced.zeta-complex-surface.v1", inputSpec={"realMax": float("nan")}),
])
def test_bounded_inputs_rejected_before_process_start(job_request):
    with pytest.raises(ValueError):
        validate_submission(job_request)


def test_invalid_replay_graph_fails_inside_worker_without_formal_result(manager, record):
    bad = copy.deepcopy(record)
    bad["sourceSessionId"] = "wrong-binding"
    bad["recordHash"] = wire_hash({k: v for k, v in bad.items() if k != "recordHash"})
    ticket = manager.submit(ReplayJobRequest(kind="replay", record=bad, targetSessionId="new", targetRevision=1))
    done = wait_for(manager, ticket, {"failed", "completed"})
    assert done["status"] == "failed" and "result" not in done
    assert done["error"]["failureKind"] == "INVALID_INPUT"


def test_http_contract_cors_ownership_and_capacity(monkeypatch, manager):
    import app.main as main
    monkeypatch.setattr(main, "get_job_manager", lambda: manager)
    with TestClient(app) as client:
        origin = "https://project29770.websitepublisher.ai"
        preflight = client.options("/v1/jobs/some/cancel", headers={"Origin": origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,content-type"})
        assert preflight.status_code == 200
        assert "authorization" in preflight.headers["access-control-allow-headers"].lower()
        assert "access-control-allow-credentials" not in preflight.headers
        assert client.post("/v1/jobs", json=golden_request().model_dump(), headers={"Origin": "https://unrelated.invalid"}).status_code == 403
        submitted = client.post("/v1/jobs", json=zeta_request(big=True).model_dump(), headers={"Origin": origin})
        assert submitted.status_code == 202 and submitted.headers["cache-control"] == "no-store"
        ticket = submitted.json()
        location = "/v1/jobs/" + ticket["jobId"]
        assert client.get(location).status_code == 404
        assert client.post(location + "/cancel", headers={"Authorization": "Bearer wrong"}).status_code == 404
        busy = client.post("/v1/jobs", json=golden_request().model_dump())
        assert busy.status_code == 429 and busy.headers["retry-after"] == "2"
        auth = {"Authorization": "Bearer " + ticket["token"]}
        assert client.get(location, headers=auth).status_code == 200
        cancelled = client.post(location + "/cancel", headers=auth)
        assert cancelled.status_code == 200 and cancelled.json()["cancellationConfirmed"]
        assert "result" not in cancelled.json()
        assert client.post("/v1/jobs", json={"kind": "run", "adapter": "arbitrary", "inputSpec": {}}).status_code == 422
        oversized = client.post("/v1/jobs", content=b"{}", headers={"Content-Type": "application/json", "Content-Length": str(MAX_PAYLOAD_BYTES + 1)})
        assert oversized.status_code == 413
