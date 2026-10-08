# MathScopeCompute

Hybrid numerical, computational-topology and structural elliptic/index service for MathScope v0.3.1.

This repository is intentionally separate from the MathScope Lean/formal codebase.

## Architecture

MathScope keeps small deterministic reference adapters in the browser and sends heavier or independently replayable work to this Python service.

The service preserves MathScope's mathematical contract:

- numerical output is evidence, not a theorem;
- finite matrices are finite approximations, not infinite operators;
- finite sampled persistent homology is evidence about the selected filtered complex, not automatically a theorem about an unsampled continuum object;
- persistence-diagram similarity does not by itself establish homeomorphism or homotopy equivalence;
- a sampled principal-symbol display is not a K-theory class;
- finite cotangent-direction sampling alone does not prove ellipticity;
- index zero is not an invertibility or unique-solvability certificate;
- a nonzero local boundary obstruction must not be restated as “all boundary conditions are impossible”;
- every result carries input/environment hashes and provenance;
- adapter output follows the common `Adapter.run(inputSpec, environment)` envelope.

## Stack

- Python 3.10+
- FastAPI
- NumPy
- SciPy / ARPACK
- GUDHI 3.13+ — primary computational topology backend
- Ripser.py 0.6.15+ — optional fast Vietoris-Rips path

Planned optional heavy adapters:

- PETSc / petsc4py
- SLEPc / slepc4py
- DOLFINx / FEniCSx
- specialist pseudodifferential/K-theory backend

## API

- `GET /health`
- `GET /v1/capabilities`
- `GET /v1/self-test`
- `POST /v1/run`
- `POST /v1/replay` (bounded Golden numerical replay)
- `POST /v1/jobs` (isolated cancellable Golden run/replay or complex-zeta run)
- `GET /v1/jobs/{jobId}` (owned status/result)
- `POST /v1/jobs/{jobId}/cancel` (owned process termination and result discard)

Implemented adapters:

- `ode.ivp.v1`
- `optimization.poisson-amplitude.v1`
- `poisson.fd.v1`
- `spectrum.laplacian-grid.v1`
- `resolvent.matrix.v1`
- `topology.gudhi.v1`
- `topology.ripser.v1`
- `index.elliptic-reference.v1`
- `advanced.galois-reference.v1`
- `advanced.zeta-resolvent-reference.v1`
- `advanced.spectral-flow-reference.v1`
- `advanced.equivariant-k-reference.v1`
- `advanced.perturbation-reference.v1`
- `advanced.ricci-flow-reference.v1`
- `advanced.zeta-complex-surface.v1`
- `golden.elliptic-torus.v1`

## B7 topology contract

Primary backend: `topology.gudhi.v1`.

Optional fast path: `topology.ripser.v1`.

The topology adapters retain coefficient field, filtration, approximation metadata, persistence intervals, Betti data and the explicit status `topologyEquivalenceStatus = NOT ESTABLISHED`.

## Stage 6 D-layer reference contract

`index.elliptic-reference.v1` is a deterministic structural/reference adapter, not a full symbolic pseudodifferential package.

Reference models:

- `closed_scalar_laplacian`
- `nonlinear_elliptic_linearization`
- `custom_quadratic_symbol`
- `hyperbolic_counterexample`

Outputs:

- `DifferentialOperatorSpec`
- `PrincipalSymbolSpec`
- `EllipticityResult`
- `KTheorySpec`
- `IndexSpec`
- `BoundaryAnalysisSpec`
- optional `NonlinearIndexBridgeSpec`
- `FormalizationCoverageSpec`

The built-in closed scalar Laplacian deliberately demonstrates the guard

`index = 0 != invertible`

by recording kernel dimension 1, cokernel dimension 1 and index 0 in the connected closed reference case.

The service may emit explicit external theorem-mapping metadata, but its own EvidenceRecord remains `NUMERICAL INDICATOR`. A client must still apply the MathScope theorem/evidence contract before creating `THEOREM-BACKED` evidence.

## Stage 7 advanced-research contract

Stage 7 adds bounded reference adapters rather than pretending to be a general CAS/topology engine:

- Galois: built-in finite Galois presets carry explicit splitting-field/group/correspondence metadata; custom numerical roots never guess a Galois group.
- Zeta: Riemann zeta and spectral zeta are separate typed objects. Spacing correlation stays `EMPIRICAL CORRESPONDENCE`; no spectral identity is issued.
- Spectral flow: only an explicit self-adjoint Fredholm family gets a signed crossing count. The default fixture has +4, -1 and spectral flow 3.
- Equivariant K-theory/K-homology: finite representation/commutation checks may validate a reference symmetry, but abstract equivariant K-classes and K-homology remain partial/external.
- Perturbation: finite symmetric-matrix changes illustrate spectral motion; infinite-dimensional Fredholm index stability still requires explicit hypotheses.
- Ricci flow: constant-curvature reference evolutions are available. Surgery is a separate topology-changing event and never a dimension-lifting justification.

All Stage 7 compute evidence stays `NUMERICAL INDICATOR`. External theorem mapping metadata can be attached, but the compute service itself never emits `THEOREM-BACKED` or `FORMAL PASS`.

## Stage 8 connected Golden fixture and executable replay

The bounded Golden fixture uses the closed flat unit torus and
`F(u) = -Delta(u) + lambda*u - u^3`. Its default nonzero constant candidate
`lambda=1, u*=1` has zero residual and linearization `L=-Delta-2`.
The solver plan explicitly verifies a prescribed candidate; it does not search
for solutions or define a time evolution. Coordinate periodicity is not an
exterior boundary condition, and initial conditions are not applicable.

```json
{
  "adapter": "golden.elliptic-torus.v1",
  "inputSpec": {
    "sessionId": "research-session-1",
    "revision": 1,
    "lambda": 1,
    "candidateValue": 1,
    "gridN": 16,
    "refinements": [8, 16, 32],
    "seed": 0
  },
  "environment": {"purpose": "golden-session"}
}
```

Send this to `/v1/run`. The first `outputRepresentations` entry is a
`GoldenSessionSpec`, containing a client-ready `typedBundle`, actual periodic
mesh and field values in `numericalSnapshot`, and an `executableReplayRecord`.
All A/B/C/D nodes bind the same session revision and upstream/evidence graph.
The finite spectrum uses Fourier diagonalization; GUDHI computes source/display
homology with candidate lower-star filtration. The 3D display preserves this
finite triangulation but distorts the source flat metric. Perturbation checks,
C2 commutation, principal-symbol samples and an explicit finite spectral-flow
family all refer to this same linearization. Changing the candidate or parameter
recomputes residuals and IDs. A failed candidate produces `gate.pass=false`.

To rerun an imported numerical bundle, post the **entire unchanged**
`executableReplayRecord` to `/v1/replay`:

```json
{
  "record": {"...": "the complete executableReplayRecord from /v1/run"},
  "targetSessionId": "new-imported-session",
  "targetRevision": 1
}
```

The response includes `pass`, `status`, `result` (a fresh `AdapterResult`),
`checks`, `environmentCompatible`, `exactMatch`, `numericallyEquivalent`, and
source/target session IDs and revisions. `sourceRecord` remains available for
audit; new typed nodes bind the target session. Numerical hashes exclude session
identity and revision. Hashes are server-generated and opaque to JavaScript;
Golden-only JSON normalization handles integral floats and rejects non-finite
or unsafe large numbers, so browser parse/stringify preserves the replay record.
Checksums detect corruption, not authorship or authenticity.

Replay validates the source graph, then actually executes the computation. It
compares both exact numerical hashes and numerical tolerance (`1e-10` absolute
and relative). A changed runtime fingerprint requires review even when the
numbers match (`ENVIRONMENT_CHANGED_REVIEW_REQUIRED`, `pass=false`). Invalid
record integrity or graph/session/revision bindings return HTTP 422.

All compute evidence remains `NUMERICAL INDICATOR`. Infinite kernel/cokernel and
invertibility remain unclaimed; index zero is only scoped analytic-reference
metadata. Nonlinear stability, continuum topology, an advanced index theorem,
and formal verification are not established by this adapter. Its integration
gate does not authorize a release freeze. The separate local-algebra Lean
fixture in `formal/` proves only its explicitly stated algebraic claims.

## Cancellable numerical jobs

Submit a bounded job using `POST /v1/jobs`:

```json
{"kind":"run","adapter":"golden.elliptic-torus.v1","inputSpec":{"sessionId":"s","revision":1,"gridN":16},"environment":{}}
```

The allowlist also supports `advanced.zeta-complex-surface.v1`. For Golden
replay, submit `kind:"replay"` with `record`, `targetSessionId` and
`targetRevision`, as in the synchronous replay contract above. Arbitrary
adapters, source code or executables are not accepted.

HTTP 202 returns a `jobId` and unpredictable per-job `token`. Keep the token only
in transient client memory. Poll `GET /v1/jobs/{jobId}` or request cancellation
with `POST /v1/jobs/{jobId}/cancel`, both using `Authorization: Bearer <token>`.
Never place this secret in URLs, logs, ResearchSession exports or evidence.

Each job runs in a spawned process. Status is `running` until the worker exits,
then `completed` (with `result`) or `failed` (with `error`). Cancellation performs
terminate/join and kill/join fallback. It returns `cancelled` with
`cancellationConfirmed:true` only after actual process exit. If termination is
not confirmed, status remains `cancelling`. The supervisor also enforces the
90-second worker limit, reporting `timed_out`/`TIMEOUT` after stopping the process.
Cancelled/timed-out jobs never return results. Cancellation is idempotent and
also discards a completed-but-uncommitted result. Clients must suppress late
commits when a cancel click races completion, and await the submit ticket before
cancelling if the click raced submission. Aborting fetch alone is not server
cancellation.

Default limits are one concurrent worker, 16 retained jobs, 300-second terminal
TTL, an 8-MiB streamed request cap, 32 JSON nesting levels, an 8-KiB environment,
a 16-MiB result cap and 32-MiB aggregate result reservation/storage. Existing
Golden grid and complex-zeta domain/point/precision bounds apply. Capacity
returns 429/`Retry-After`; invalid inputs return 422 and oversized HTTP bodies
return 413. Status/cancel require the owning token; wrong/absent tokens return
404. Browser origins retain the existing allowlist; credentials stay disabled.

The manager requires **one web worker and one service instance**. In-memory
tickets/results expire and do not survive restart. It is not a persistent or
distributed queue. Existing synchronous APIs remain available; their transport
abort does not cancel server computation.

Completed job envelopes report actual worker CPU user/system/total time and peak
RSS (POSIX `getrusage`, Windows process memory counters). Metrics include process
startup/import work and are separate from the numerical result/hash. They are
not browser CPU or FPS measurements. Killed workers that could not report final
metrics leave them unavailable. Job completion or cancellation creates no
mathematical/formal evidence.

## Local development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Run tests:

```bash
pytest -q
```

## Render

Repository:

https://github.com/leegahuyn/MathScopeCompute

Live service:

https://mathscope-compute.onrender.com

## Trust boundary

This service never emits `FORMAL PASS` or `THEOREM-BACKED` evidence by itself. Its default evidence grade is `NUMERICAL INDICATOR`.
