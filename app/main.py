from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.adapters import ADAPTERS
from app.models import AdapterResult, RunRequest
from app.provenance import APP_VERSION

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
        "trustBoundary": {
            "maySetFormalPass": False,
            "maySetTheoremBackedWithoutTheoremMap": False,
            "finiteApproximationIsInfiniteOperator": False,
        },
    }


@app.post("/v1/run", response_model=AdapterResult)
def run_adapter(request: RunRequest) -> AdapterResult:
    adapter = ADAPTERS.get(request.adapter)
    if adapter is None:
        raise HTTPException(status_code=404, detail=f"Unknown adapter: {request.adapter}")
    try:
        return adapter.run(request.inputSpec, request.environment)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Adapter execution failed") from exc
