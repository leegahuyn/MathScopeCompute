"""Bounded single-web-worker job ownership and real process cancellation.

Only fixed numerical adapters execute. Tokens authorize status/cancellation;
neither submitted source code nor caller-specified executables are accepted.
"""
from __future__ import annotations

import atexit
import copy
import json
import math
import multiprocessing
import os
import secrets
import threading
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, ConfigDict, Field

GOLDEN = "golden.elliptic-torus.v1"
ZETA = "advanced.zeta-complex-surface.v1"
MAX_PAYLOAD_BYTES = 8 * 1024 * 1024
MAX_RESULT_BYTES = 16 * 1024 * 1024


class JobBodyLimitMiddleware:
    """Bound job request bytes while streaming, before JSON parsing."""
    def __init__(self, app: Any):
        self.app = app

    async def __call__(self, scope: dict, receive: Any, send: Any) -> None:
        if scope.get("type") != "http" or scope.get("method") != "POST" or scope.get("path") != "/v1/jobs":
            await self.app(scope, receive, send)
            return
        from starlette.responses import JSONResponse
        headers = dict(scope.get("headers", []))
        try:
            if int(headers.get(b"content-length", b"0")) > MAX_PAYLOAD_BYTES:
                await JSONResponse({"detail": "Job payload exceeds 8 MiB"}, status_code=413)(scope, receive, send)
                return
        except ValueError:
            await JSONResponse({"detail": "Invalid Content-Length"}, status_code=400)(scope, receive, send)
            return
        chunks, size = [], 0
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            chunk = message.get("body", b"")
            size += len(chunk)
            if size > MAX_PAYLOAD_BYTES:
                await JSONResponse({"detail": "Job payload exceeds 8 MiB"}, status_code=413)(scope, receive, send)
                return
            chunks.append(chunk)
            if not message.get("more_body", False):
                break
        delivered = False
        async def bounded_receive() -> dict:
            nonlocal delivered
            if not delivered:
                delivered = True
                return {"type": "http.request", "body": b"".join(chunks), "more_body": False}
            return await receive()
        await self.app(scope, bounded_receive, send)


class RunJobRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Literal["run"]
    adapter: Literal["golden.elliptic-torus.v1", "advanced.zeta-complex-surface.v1"] = GOLDEN
    inputSpec: dict[str, Any]
    environment: dict[str, Any] = Field(default_factory=dict)


class ReplayJobRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Literal["replay"]
    record: dict[str, Any]
    targetSessionId: str = Field(min_length=1, max_length=128)
    targetRevision: int = Field(ge=1, le=1000000, strict=True)


JobRequest = Annotated[Union[RunJobRequest, ReplayJobRequest], Field(discriminator="kind")]


class JobNotFound(Exception):
    pass


class JobCapacityExceeded(Exception):
    pass


def timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def json_bytes(value: Any, limit: int) -> bytes:
    # Check depth before serialization to bound recursive user-controlled data.
    stack = [(value, 0)]
    while stack:
        item, depth = stack.pop()
        if depth > 32:
            raise ValueError("Job JSON nesting exceeds 32 levels")
        if isinstance(item, dict):
            if any(not isinstance(k, str) for k in item):
                raise ValueError("Job JSON object keys must be strings")
            stack.extend((v, depth + 1) for v in item.values())
        elif isinstance(item, list):
            stack.extend((v, depth + 1) for v in item)
        elif item is not None and not isinstance(item, (str, int, float, bool)):
            raise ValueError("Job payload must contain JSON data only")
    try:
        encoded = json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")
    except (ValueError, TypeError) as exc:
        raise ValueError("Job JSON must contain finite JSON values") from exc
    if len(encoded) > limit:
        raise ValueError("Job JSON exceeds its bounded byte limit")
    return encoded


def validate_submission(request: RunJobRequest | ReplayJobRequest) -> dict[str, Any]:
    from app.adapters.golden_elliptic import normalize_spec
    from app.golden import wire_hash
    payload = request.model_dump()
    json_bytes(payload, MAX_PAYLOAD_BYTES)
    if request.kind == "replay":
        record = request.record
        if record.get("schema") != "MathScopeNumericalReplay/1" or record.get("adapter") != GOLDEN:
            raise ValueError("Only the fixed Golden numerical replay record is supported")
        if record.get("recordHash") != wire_hash({k: v for k, v in record.items() if k != "recordHash"}):
            raise ValueError("Replay record integrity hash mismatch")
        normalize_spec(record.get("inputSpec"))
        normalize_spec({**record["inputSpec"], "sessionId": request.targetSessionId, "revision": request.targetRevision})
        json_bytes(record.get("requestEnvironment", {}), 8192)
    elif request.adapter == GOLDEN:
        payload["inputSpec"] = normalize_spec(request.inputSpec)
        json_bytes(request.environment, 8192)
    else:
        spec = request.inputSpec
        json_bytes(spec, 32768)
        json_bytes(request.environment, 8192)
        values = {k: spec.get(k, v) for k, v in {"realMin": .2, "realMax": 1.4, "imagMin": 0, "imagMax": 32, "realSamples": 23, "imagSamples": 35, "precisionDps": 30, "poleExclusionRadius": .075, "heightCap": 8}.items()}
        if any(type(v) not in (int, float) or not math.isfinite(v) for v in values.values()):
            raise ValueError("Zeta job parameters must be finite numbers")
        x0, x1, y0, y1 = (values[k] for k in ("realMin", "realMax", "imagMin", "imagMax"))
        nx, ny, dps = (values[k] for k in ("realSamples", "imagSamples", "precisionDps"))
        if any(type(x) is not int for x in (nx, ny, dps)) or not (4 <= nx <= 45 and 4 <= ny <= 45 and nx * ny <= 1600):
            raise ValueError("Zeta job grid must be 4..45 per axis and at most 1600 points")
        if not (-3 <= x0 < x1 <= 4 and -60 <= y0 < y1 <= 60 and 20 <= dps <= 50 and .02 <= values["poleExclusionRadius"] <= .4 and 2 <= values["heightCap"] <= 16):
            raise ValueError("Zeta job domain/precision/pole/height limits exceeded")
    return payload


def worker_telemetry(started: float) -> dict[str, Any]:
    try:
        import resource
        r = resource.getrusage(resource.RUSAGE_SELF)
        import sys
        peak = int(r.ru_maxrss if sys.platform == "darwin" else r.ru_maxrss * 1024)
        user, system, source = r.ru_utime, r.ru_stime, "resource.getrusage(RUSAGE_SELF)"
    except ImportError:
        import ctypes
        from ctypes import wintypes
        class Counters(ctypes.Structure):
            _fields_ = [("cb", wintypes.DWORD), ("PageFaultCount", wintypes.DWORD)] + [(n, ctypes.c_size_t) for n in ("PeakWorkingSetSize", "WorkingSetSize", "QuotaPeakPagedPoolUsage", "QuotaPagedPoolUsage", "QuotaPeakNonPagedPoolUsage", "QuotaNonPagedPoolUsage", "PagefileUsage", "PeakPagefileUsage")]
        counters = Counters()
        counters.cb = ctypes.sizeof(counters)
        query = ctypes.windll.psapi.GetProcessMemoryInfo
        query.argtypes = [wintypes.HANDLE, ctypes.POINTER(Counters), wintypes.DWORD]
        process = ctypes.windll.kernel32.GetCurrentProcess
        process.restype = wintypes.HANDLE
        ok = query(process(), ctypes.byref(counters), ctypes.sizeof(counters))
        peak = counters.PeakWorkingSetSize if ok else None
        times = os.times()
        user, system, source = times.user, times.system, "os.times + Windows GetProcessMemoryInfo"
    return {"scope": "ISOLATED_SERVER_WORKER_PROCESS", "cpuUserSeconds": user, "cpuSystemSeconds": system, "cpuTotalSeconds": user + system, "peakRSSBytes": peak, "workerExecutionMs": (time.monotonic() - started) * 1000, "measurementSource": source, "cpuIncludesProcessStartupAndImports": True, "browserCpuMeasured": False}


def job_worker(connection: Any, payload: dict[str, Any], job_id: str) -> None:
    """Spawn entry point. Caller input cannot select any executable or function."""
    started, started_at = time.monotonic(), timestamp()
    try:
        from app.adapters.golden_elliptic import GoldenEllipticAdapter
        from app.adapters.zeta_complex import ComplexZetaSurfaceAdapter
        from app.golden import ReplayRequest, replay
        connection.send_bytes(b'{"event":"executing"}')
        if payload["kind"] == "replay":
            result = replay(ReplayRequest(record=payload["record"], targetSessionId=payload["targetSessionId"], targetRevision=payload["targetRevision"]))
            adapter_result = result["result"]
        else:
            adapter = GoldenEllipticAdapter() if payload["adapter"] == GOLDEN else ComplexZetaSurfaceAdapter()
            adapter_result = adapter.run(payload["inputSpec"], payload["environment"])
            result = None
        adapter_result = adapter_result.model_copy(update={"jobId": job_id, "startedAt": started_at, "completedAt": timestamp(), "elapsedMs": (time.monotonic() - started) * 1000, "logs": ["isolated-worker=true", "adapter=" + adapter_result.adapter]})
        if result is None:
            result = adapter_result.model_dump(mode="json")
        else:
            result["result"] = adapter_result.model_dump(mode="json")
        message = {"event": "result", "ok": True, "result": result, "telemetry": worker_telemetry(started)}
        connection.send_bytes(json_bytes(message, MAX_RESULT_BYTES))
    except Exception as exc:
        error = {"event": "result", "ok": False, "error": {"failureKind": "INVALID_INPUT" if isinstance(exc, ValueError) else "COMPUTATION_FAILED", "message": str(exc)[:500] if isinstance(exc, ValueError) else "The isolated numerical worker failed", "exceptionType": type(exc).__name__, "executionScope": "SERVER_WORKER", "jobId": job_id, "cancellationConfirmed": False}, "telemetry": worker_telemetry(started)}
        try:
            connection.send_bytes(json_bytes(error, MAX_RESULT_BYTES))
        except (BrokenPipeError, EOFError, OSError):
            pass
    finally:
        connection.close()


@dataclass
class Job:
    id: str
    token: str
    kind: str
    adapter: str
    process: Any
    connection: Any
    submitted_at: str
    started: float
    state: str = "running"
    phase: str = "starting"
    finished: float | None = None
    finished_at: str | None = None
    result: Any = None
    result_bytes: int = 0
    error: Any = None
    telemetry: dict[str, Any] | None = None
    cancellation_confirmed: bool = False
    termination_method: str | None = None
    pending_message: dict[str, Any] | None = None
    terminal_target: str = "cancelled"


class JobManager:
    def __init__(self, *, max_concurrent: int = 1, max_retained: int = 16, runtime_seconds: float = 90, retention_seconds: float = 300, max_result_storage_bytes: int = 32 * 1024 * 1024, monitor_interval: float = .05):
        if not (1 <= max_concurrent <= 2 and 1 <= max_retained <= 64 and 0 < runtime_seconds <= 300 and 0 < retention_seconds <= 3600):
            raise ValueError("Invalid bounded job manager configuration")
        self.max_concurrent, self.max_retained = max_concurrent, max_retained
        self.runtime_seconds, self.retention_seconds = runtime_seconds, retention_seconds
        self.max_result_storage_bytes = max_result_storage_bytes
        self.jobs: dict[str, Job] = {}
        self.context = multiprocessing.get_context("spawn")
        self.lock = threading.RLock()
        self.stop = threading.Event()
        self.monitor_interval = monitor_interval
        self.monitor = threading.Thread(target=self._monitor, name="mathscope-job-supervisor", daemon=True)
        self.monitor.start()

    def _monitor(self) -> None:
        while not self.stop.wait(self.monitor_interval):
            with self.lock:
                self._sweep()

    def _finish(self, job: Job, state: str) -> None:
        job.state, job.phase = state, "finished"
        job.finished, job.finished_at = time.monotonic(), timestamp()
        job.connection.close()

    def _terminate(self, job: Job, target: str) -> None:
        job.result, job.result_bytes, job.pending_message = None, 0, None
        job.terminal_target = target
        job.termination_method = "already-stopped-result-discarded"
        if job.process.is_alive():
            job.termination_method = "terminate-and-join"
            job.process.terminate()
            job.process.join(timeout=1)
        if job.process.is_alive():
            job.termination_method = "kill-and-join"
            job.process.kill()
            job.process.join(timeout=1)
        job.process.join(timeout=0)
        stopped = not job.process.is_alive()
        job.cancellation_confirmed = stopped
        if stopped:
            self._finish(job, target)
        else:
            job.state, job.phase = "cancelling", "termination-requested"
        job.error = {"failureKind": "TIMEOUT" if target == "timed_out" else "CANCELLED", "message": "Server worker exceeded its execution limit" if target == "timed_out" else "Server worker cancellation requested", "executionScope": "SERVER_WORKER", "jobId": job.id, "cancellationConfirmed": stopped}
        if job.telemetry is None:
            job.telemetry = {"scope": "ISOLATED_SERVER_WORKER_PROCESS", "available": False, "reason": "Worker stopped before final metrics; CPU and memory values are not inferred", "browserCpuMeasured": False}

    def _sweep(self) -> None:
        current = time.monotonic()
        for job_id, job in list(self.jobs.items()):
            if job.finished is not None:
                if current - job.finished >= self.retention_seconds:
                    job.process.close()
                    del self.jobs[job_id]
                continue
            if job.state == "cancelling":
                self._terminate(job, job.terminal_target)
                continue
            if current - job.started >= self.runtime_seconds and job.process.is_alive():
                self._terminate(job, "timed_out")
                continue
            try:
                while job.connection.poll():
                    data = job.connection.recv_bytes(MAX_RESULT_BYTES)
                    message = json.loads(data)
                    if message.get("event") == "executing":
                        job.phase = "executing"
                    elif message.get("event") == "result":
                        job.pending_message = message
                        job.result_bytes = len(data)
            except (EOFError, OSError, ValueError):
                pass
            # A result is not released until the process has actually exited.
            if not job.process.is_alive():
                job.process.join(timeout=0)
                message = job.pending_message
                job.pending_message = None
                if message and message.get("ok") is True and job.process.exitcode == 0:
                    job.result, job.telemetry = message["result"], message.get("telemetry")
                    self._finish(job, "completed")
                else:
                    job.result, job.result_bytes = None, 0
                    job.error = message.get("error") if message else {"failureKind": "COMPUTATION_FAILED", "message": "Worker exited without a completed result", "executionScope": "SERVER_WORKER", "jobId": job.id, "cancellationConfirmed": False}
                    job.telemetry = message.get("telemetry") if message else None
                    self._finish(job, "failed")

    def submit(self, request: RunJobRequest | ReplayJobRequest) -> dict[str, Any]:
        payload = validate_submission(request)
        with self.lock:
            if self.stop.is_set():
                raise JobCapacityExceeded("Job manager is shutting down")
            self._sweep()
            active = sum(j.finished is None for j in self.jobs.values())
            stored = sum(j.result_bytes for j in self.jobs.values())
            if active >= self.max_concurrent or len(self.jobs) >= self.max_retained or stored + (active + 1) * MAX_RESULT_BYTES > self.max_result_storage_bytes:
                raise JobCapacityExceeded("Bounded job capacity reached; cancel an owned job or retry after results expire")
            job_id, token = str(uuid.uuid4()), secrets.token_urlsafe(32)
            receiver, sender = self.context.Pipe(duplex=False)
            process = self.context.Process(target=job_worker, args=(sender, payload, job_id), name="mathscope-numerical-job", daemon=True)
            job = Job(job_id, token, request.kind, payload.get("adapter", GOLDEN), process, receiver, timestamp(), time.monotonic())
            try:
                process.start()
            except BaseException:
                receiver.close()
                sender.close()
                raise
            sender.close()
            self.jobs[job_id] = job
            return {**self._view(job), "token": token}

    def _owned(self, job_id: str, token: str) -> Job:
        job = self.jobs.get(job_id)
        if job is None or not isinstance(token, str) or not token.isascii() or not secrets.compare_digest(job.token, token):
            raise JobNotFound("Job not found or ownership token invalid")
        return job

    def _view(self, job: Job) -> dict[str, Any]:
        expiry = datetime.fromisoformat(job.finished_at or job.submitted_at) + timedelta(seconds=self.retention_seconds if job.finished_at else self.runtime_seconds + self.retention_seconds)
        result = {"jobId": job.id, "kind": job.kind, "adapter": job.adapter, "status": job.state, "phase": job.phase, "submittedAt": job.submitted_at, "finishedAt": job.finished_at, "expiresAt": expiry.isoformat(), "pollAfterMs": 300, "executionScope": "SERVER_WORKER", "cancellationConfirmed": job.cancellation_confirmed, "terminationMethod": job.termination_method, "workerStopped": not job.process.is_alive(), "workerExitCode": job.process.exitcode, "elapsedMs": ((job.finished or time.monotonic()) - job.started) * 1000, "telemetry": copy.deepcopy(job.telemetry)}
        if job.state == "completed":
            result["result"] = copy.deepcopy(job.result)
        if job.error:
            result["error"] = copy.deepcopy(job.error)
        return result

    def status(self, job_id: str, token: str) -> dict[str, Any]:
        with self.lock:
            self._sweep()
            return self._view(self._owned(job_id, token))

    def cancel(self, job_id: str, token: str) -> dict[str, Any]:
        with self.lock:
            self._sweep()
            job = self._owned(job_id, token)
            if job.state not in ("cancelled", "timed_out"):
                self._terminate(job, "cancelled")
            return self._view(job)

    def close(self) -> None:
        self.stop.set()
        with self.lock:
            for job in self.jobs.values():
                if job.finished is None:
                    self._terminate(job, "cancelled")
        if threading.current_thread() is not self.monitor:
            self.monitor.join(timeout=3)
        with self.lock:
            for job in self.jobs.values():
                if not job.process.is_alive():
                    job.process.close()
            self.jobs.clear()


_manager: JobManager | None = None
_manager_lock = threading.Lock()


def get_job_manager() -> JobManager:
    global _manager
    with _manager_lock:
        if _manager is None:
            _manager = JobManager()
        return _manager


def close_job_manager() -> None:
    global _manager
    with _manager_lock:
        manager, _manager = _manager, None
    if manager is not None:
        manager.close()


atexit.register(close_job_manager)
