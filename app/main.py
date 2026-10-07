from __future__ import annotations

import os
import time
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.adapters import ADAPTERS
from app.models import AdapterResult, RunRequest
from app.provenance import APP_VERSION, utc_now

app = FastAPI(
    title="MathScopeCompute",
    version=APP_VERSION,
    description=(
        "Hybrid numerical backend for MathScope. "
        "Numerical outputs remain numerical evidence and never auto-promote to theorem/formal status."
    ),
)

default_origins = (
    "https://project29770.websitepublisher.ai,"
    "http://localhost:3000,"
    "http://localhost:5173"
)
origins = [
    item.strip()
    for item in os.getenv("MATHSCOPE_ALLOWED_ORIGINS", default_origins).split(",")
    if item.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "service": "MathScopeCompute",
        "version": APP_VERSION,
    }


@app.get("/v1/capabilities")
def capabilities() -> dict:
    return {
        "service": "MathScopeCompute",
        "version": APP_VERSION,
        "implemented": [
            {
                "name": "ode.ivp.v1",
                "scope": "sampled numerical IVP trajectories",
                "evidence": "NUMERICAL INDICATOR",
            },
            {
                "name": "optimization.poisson-amplitude.v1",
                "scope": "finite-grid one-parameter PDE optimization",
                "evidence": "NUMERICAL INDICATOR",
            },
            {
                "name": "poisson.fd.v1",
                "scope": "finite-grid Dirichlet Poisson solve",
                "evidence": "NUMERICAL INDICATOR",
            },
            {
                "name": "spectrum.laplacian-grid.v1",
                "scope": "finite sparse spectrum via SciPy/ARPACK",
                "evidence": "NUMERICAL INDICATOR",
            },
            {
                "name": "resolvent.matrix.v1",
                "scope": "finite matrix resolvent-norm sample",
                "evidence": "NUMERICAL INDICATOR",
            },
        ],
        "planned": [
            "PETSc/petsc4py adapter",
            "SLEPc/slepc4py adapter",
            "DOLFINx/FEniCSx adapter",
            "queue-backed long-running jobs",
        ],
        "adapterContract": {
            "outputs": ["outputRepresentations", "evidenceRecords", "diagnostics", "residuals", "errorBounds", "provenanceEdges", "reproducibilityHash"],
            "jobMetadata": ["jobId", "startedAt", "completedAt", "elapsedMs", "logs"],
        },
        "trustBoundary": {
            "maySetFormalPass": False,
            "maySetTheoremBackedWithoutTheoremMap": False,
            "finiteApproximationIsInfiniteOperator": False,
        },
    }


@app.get("/v1/self-test")
def self_test() -> dict:
    checks = []
    try:
        ode = ADAPTERS["ode.ivp.v1"].run(
            {"model": "linear_scalar", "a": -1.0, "t0": 0.0, "t1": 1.0, "y0": 1.0, "samples": 40},
            {"selfTest": True},
        )
        checks.append({"name": "ode", "pass": ode.status == "completed" and (ode.residuals or {}).get("maxExactError", 1.0) < 1e-5})
    except Exception as exc:
        checks.append({"name": "ode", "pass": False, "error": type(exc).__name__})
    try:
        pde = ADAPTERS["poisson.fd.v1"].run({"gridN": 8}, {"selfTest": True})
        checks.append({"name": "poisson", "pass": pde.status == "completed" and (pde.residuals or {}).get("linf", 1.0) < 1e-8})
    except Exception as exc:
        checks.append({"name": "poisson", "pass": False, "error": type(exc).__name__})
    try:
        spec = ADAPTERS["spectrum.laplacian-grid.v1"].run({"gridN": 8, "k": 4}, {"selfTest": True})
        rep = spec.outputRepresentations[0]
        checks.append({"name": "finite-spectrum", "pass": rep.get("mode") == "finiteApprox" and rep.get("exactInfinite") is False})
    except Exception as exc:
        checks.append({"name": "finite-spectrum", "pass": False, "error": type(exc).__name__})
    try:
        opt = ADAPTERS["optimization.poisson-amplitude.v1"].run({"gridN": 8, "targetAmplitude": 1.0}, {"selfTest": True})
        checks.append({"name": "optimization", "pass": opt.status == "completed" and (opt.residuals or {}).get("gradientAtSolution", 1.0) < 1e-10})
    except Exception as exc:
        checks.append({"name": "optimization", "pass": False, "error": type(exc).__name__})
    return {"pass": all(item["pass"] for item in checks), "checks": checks}


@app.post("/v1/run", response_model=AdapterResult)
def run_adapter(request: RunRequest) -> AdapterResult:
    adapter = ADAPTERS.get(request.adapter)
    if adapter is None:
        raise HTTPException(status_code=404, detail=f"Unknown adapter: {request.adapter}")
    job_id = str(uuid.uuid4())
    started_at = utc_now()
    started = time.perf_counter()
    try:
        result = adapter.run(request.inputSpec, request.environment)
        completed_at = utc_now()
        elapsed_ms = (time.perf_counter() - started) * 1000.0
        return result.model_copy(
            update={
                "jobId": job_id,
                "startedAt": started_at,
                "completedAt": completed_at,
                "elapsedMs": elapsed_ms,
                "logs": [
                    f"adapter={request.adapter}",
                    f"status={result.status}",
                    f"elapsedMs={elapsed_ms:.3f}",
                ],
            }
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Adapter execution failed") from exc
