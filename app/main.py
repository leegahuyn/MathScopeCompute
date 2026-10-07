from __future__ import annotations

import os
import time
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.adapters import ADAPTERS
from app.models import AdapterResult, RunRequest
from app.provenance import APP_VERSION, environment_fingerprint, utc_now

app = FastAPI(
    title="MathScopeCompute",
    version=APP_VERSION,
    description=(
        "Hybrid numerical, computational-topology, elliptic/index and Stage 7 advanced-research backend for MathScope. "
        "Outputs remain scoped evidence and never auto-promote to theorem/formal status."
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
        "environment": environment_fingerprint(),
    }


@app.get("/v1/capabilities")
def capabilities() -> dict:
    return {
        "service": "MathScopeCompute",
        "version": APP_VERSION,
        "implemented": [
            {"name": "ode.ivp.v1", "scope": "sampled numerical IVP trajectories", "evidence": "NUMERICAL INDICATOR"},
            {"name": "optimization.poisson-amplitude.v1", "scope": "finite-grid one-parameter PDE optimization", "evidence": "NUMERICAL INDICATOR"},
            {"name": "poisson.fd.v1", "scope": "finite-grid Dirichlet Poisson solve", "evidence": "NUMERICAL INDICATOR"},
            {"name": "spectrum.laplacian-grid.v1", "scope": "finite sparse spectrum via SciPy/ARPACK", "evidence": "NUMERICAL INDICATOR"},
            {"name": "resolvent.matrix.v1", "scope": "finite matrix resolvent-norm sample", "evidence": "NUMERICAL INDICATOR"},
            {"name": "topology.gudhi.v1", "scope": "primary computational-topology adapter: cubical, Vietoris-Rips, SimplexTree and persistence-diagram comparison", "evidence": "NUMERICAL INDICATOR"},
            {"name": "topology.ripser.v1", "scope": "optional fast Vietoris-Rips persistence for point clouds and distance matrices", "evidence": "NUMERICAL INDICATOR"},
            {
                "name": "index.elliptic-reference.v1",
                "scope": "Stage 6 structural reference: differential operator -> principal symbol -> ellipticity -> K-class metadata -> analytic/topological index -> boundary semantics -> nonlinear linearization bridge",
                "evidence": "NUMERICAL INDICATOR + explicit external theorem mapping metadata",
            },
            {"name": "advanced.galois-reference.v1", "scope": "Stage 7 finite Galois reference presets plus custom-root no-guess guard", "evidence": "NUMERICAL INDICATOR + explicit theorem mapping metadata"},
            {"name": "advanced.zeta-resolvent-reference.v1", "scope": "Stage 7 Riemann-zeta versus finite spectral-zeta/resolvent semantics", "evidence": "NUMERICAL INDICATOR"},
            {"name": "advanced.spectral-flow-reference.v1", "scope": "Stage 7 signed zero crossings for explicit self-adjoint Fredholm reference families", "evidence": "NUMERICAL INDICATOR"},
            {"name": "advanced.equivariant-k-reference.v1", "scope": "Stage 7 finite symmetry/commutation reference with equivariant-K and K-homology metadata", "evidence": "NUMERICAL INDICATOR + external theorem metadata"},
            {"name": "advanced.perturbation-reference.v1", "scope": "Stage 7 finite symmetric perturbation laboratory with explicit infinite-Fredholm guard", "evidence": "NUMERICAL INDICATOR"},
            {"name": "advanced.ricci-flow-reference.v1", "scope": "Stage 7 constant-curvature Ricci-flow reference evolution", "evidence": "NUMERICAL INDICATOR + external theorem metadata"},
        ],
        "planned": [
            "PETSc/petsc4py adapter",
            "SLEPc/slepc4py adapter",
            "DOLFINx/FEniCSx adapter",
            "queue-backed long-running jobs",
            "specialist pseudodifferential/K-theory backend",
        ],
        "topologyPolicy": {
            "primary": "topology.gudhi.v1",
            "optionalFastPath": "topology.ripser.v1",
            "supportedHomologyDimensions": [0, 1, 2],
            "visualSimilarityImpliesTopologyEquivalence": False,
            "persistenceDiagramEqualityImpliesHomeomorphism": False,
        },
        "indexPolicy": {
            "referenceAdapter": "index.elliptic-reference.v1",
            "sampledSymbolIsKClass": False,
            "sampledEllipticityIsTheorem": False,
            "indexZeroImpliesInvertible": False,
            "indexAloneDeterminesSolvability": False,
            "boundaryObstructionImpliesAllBCImpossible": False,
            "fullAtiyahSingerFormalizationClaimed": False,
        },
        "stage7Policy": {
            "visualResemblanceImpliesGaloisRelation": False,
            "riemannZetaIsSpectralZeta": False,
            "spectralCorrelationImpliesIdentity": False,
            "spectralFlowRequiresSelfAdjointFredholmFamily": True,
            "equivariantDisplayIsKClass": False,
            "perturbationIndexStabilityRequiresHypotheses": True,
            "ricciFlowJustifiesDimensionLifting": False,
            "advancedFormalCoverageClaimedFull": False,
        },
        "adapterContract": {
            "outputs": ["outputRepresentations", "evidenceRecords", "diagnostics", "residuals", "errorBounds", "provenanceEdges", "reproducibilityHash"],
            "jobMetadata": ["jobId", "startedAt", "completedAt", "elapsedMs", "logs"],
        },
        "trustBoundary": {
            "maySetFormalPass": False,
            "maySetTheoremBackedWithoutTheoremMap": False,
            "finiteApproximationIsInfiniteOperator": False,
            "finitePersistenceIsTopologyTheoremForContinuum": False,
            "sampledSymbolDisplayIsKTheoryClass": False,
            "indexZeroIsInvertibilityCertificate": False,
            "visualResemblanceIsGaloisEvidence": False,
            "zetaStatisticsAreSpectralIdentity": False,
            "spectralFlowWithoutSelfAdjointFredholmFamily": False,
            "equivariantFiniteCommutationIsFullKTheory": False,
            "ricciFlowIsDimensionLiftingProof": False,
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
    try:
        gudhi_result = ADAPTERS["topology.gudhi.v1"].run(
            {
                "complexKind": "simplex",
                "coefficientField": 2,
                "maxHomologyDimension": 1,
                "minPersistence": -1.0,
                "simplices": [
                    {"vertices": [0], "filtration": 0.0},
                    {"vertices": [1], "filtration": 0.0},
                    {"vertices": [2], "filtration": 0.0},
                    {"vertices": [3], "filtration": 0.0},
                    {"vertices": [0, 1], "filtration": 0.0},
                    {"vertices": [1, 2], "filtration": 0.0},
                    {"vertices": [2, 3], "filtration": 0.0},
                    {"vertices": [3, 0], "filtration": 0.0},
                ],
            },
            {"selfTest": True},
        )
        topology = gudhi_result.outputRepresentations[0]
        betti = {x["dimension"]: x["value"] for x in topology.get("bettiNumbers", [])}
        checks.append({"name": "topology-gudhi", "pass": gudhi_result.status == "completed" and betti.get(0) == 1 and betti.get(1) == 1})
    except Exception as exc:
        checks.append({"name": "topology-gudhi", "pass": False, "error": type(exc).__name__})
    try:
        ripser_result = ADAPTERS["topology.ripser.v1"].run(
            {
                "points": [[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0]],
                "coefficientField": 2,
                "maxHomologyDimension": 1,
                "maxEdgeLength": 1.1,
            },
            {"selfTest": True},
        )
        topology = ripser_result.outputRepresentations[0]
        betti = {x["dimension"]: x["value"] for x in topology.get("bettiNumbers", [])}
        checks.append({"name": "topology-ripser", "pass": ripser_result.status == "completed" and betti.get(0) == 1 and betti.get(1) == 1})
    except Exception as exc:
        checks.append({"name": "topology-ripser", "pass": False, "error": type(exc).__name__})
    try:
        idx = ADAPTERS["index.elliptic-reference.v1"].run(
            {
                "model": "closed_scalar_laplacian",
                "analysisMode": "theorem",
                "manifoldDimension": 2,
                "lambda": 0.0,
                "boundary": {"present": False, "condition": "none"},
            },
            {"selfTest": True},
        )
        reps = {x.get("type"): x for x in idx.outputRepresentations}
        index_rep = reps["IndexSpec"]
        k_rep = reps["KTheorySpec"]
        ell = reps["EllipticityResult"]
        checks.append(
            {
                "name": "stage6-index",
                "pass": (
                    ell.get("status") == "THEOREM-BACKED ELLIPTIC"
                    and k_rep.get("visualizationIsKClass") is False
                    and index_rep.get("analyticIndex") == 0
                    and index_rep.get("kernelDimension") == 1
                    and index_rep.get("cokernelDimension") == 1
                    and index_rep.get("invertible") is False
                ),
            }
        )
    except Exception as exc:
        checks.append({"name": "stage6-index", "pass": False, "error": type(exc).__name__})
    try:
        bad = ADAPTERS["index.elliptic-reference.v1"].run(
            {
                "model": "hyperbolic_counterexample",
                "analysisMode": "symbolic",
                "manifoldDimension": 2,
            },
            {"selfTest": True},
        )
        reps = {x.get("type"): x for x in bad.outputRepresentations}
        checks.append(
            {
                "name": "stage6-ellipticity-fail",
                "pass": reps["EllipticityResult"].get("status") == "FAIL"
                and reps["PrincipalSymbolSpec"].get("characteristicDirectionFound") is True,
            }
        )
    except Exception as exc:
        checks.append({"name": "stage6-ellipticity-fail", "pass": False, "error": type(exc).__name__})
    try:
        galois = ADAPTERS["advanced.galois-reference.v1"].run({"preset": "quadratic_sqrt2"}, {"selfTest": True})
        reps = {x.get("type"): x for x in galois.outputRepresentations}
        checks.append({"name": "stage7-galois", "pass": reps["GaloisLabSpec"].get("galoisGroup") == "C2" and reps["GaloisLabSpec"].get("shapeResemblanceCreatesGaloisRelation") is False})
    except Exception as exc:
        checks.append({"name": "stage7-galois", "pass": False, "error": type(exc).__name__})
    try:
        zeta = ADAPTERS["advanced.zeta-resolvent-reference.v1"].run({"sReal": 2.0, "terms": 1000}, {"selfTest": True})
        reps = {x.get("type"): x for x in zeta.outputRepresentations}
        checks.append({"name": "stage7-zeta", "pass": reps["ZetaCorrespondenceSpec"].get("spectralIdentityEstablished") is False and reps["SpectralZetaSpec"].get("exactInfiniteSpectrum") is False})
    except Exception as exc:
        checks.append({"name": "stage7-zeta", "pass": False, "error": type(exc).__name__})
    try:
        flow = ADAPTERS["advanced.spectral-flow-reference.v1"].run({}, {"selfTest": True})
        rep = flow.outputRepresentations[0]
        checks.append({"name": "stage7-spectral-flow", "pass": rep.get("positiveCrossings") == 4 and rep.get("negativeCrossings") == 1 and rep.get("spectralFlow") == 3})
    except Exception as exc:
        checks.append({"name": "stage7-spectral-flow", "pass": False, "error": type(exc).__name__})
    try:
        eq = ADAPTERS["advanced.equivariant-k-reference.v1"].run({"preset": "c2_commuting"}, {"selfTest": True})
        reps = {x.get("type"): x for x in eq.outputRepresentations}
        checks.append({"name": "stage7-equivariant", "pass": reps["EquivariantKTheorySpec"].get("equivariantOperator") is True and reps["EquivariantKTheorySpec"].get("displayIsEquivariantKClass") is False})
    except Exception as exc:
        checks.append({"name": "stage7-equivariant", "pass": False, "error": type(exc).__name__})
    try:
        ricci = ADAPTERS["advanced.ricci-flow-reference.v1"].run({"preset": "round_s2", "tEnd": 0.4}, {"selfTest": True})
        rep = ricci.outputRepresentations[0]
        checks.append({"name": "stage7-ricci", "pass": rep.get("surgeryEvents") == [] and rep.get("surgeryUsedAsDimensionLiftingJustification") is False and rep.get("metricScale", [1])[-1] < 1})
    except Exception as exc:
        checks.append({"name": "stage7-ricci", "pass": False, "error": type(exc).__name__})
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
