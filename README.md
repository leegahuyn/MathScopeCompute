# MathScopeCompute

Hybrid numerical and computational-topology service for MathScope v0.3.1.

This repository is intentionally separate from the MathScope Lean/formal codebase.

## Architecture

MathScope keeps small deterministic reference adapters in the browser and sends heavier numerical work to this Python service.

The service preserves MathScope's mathematical contract:

- numerical output is evidence, not a theorem;
- finite matrices are finite approximations, not infinite operators;
- finite sampled persistent homology is evidence about the selected filtered complex, not automatically a theorem about an unsampled continuum object;
- persistence-diagram similarity does not by itself establish homeomorphism or homotopy equivalence;
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

## API

- `GET /health`
- `GET /v1/capabilities`
- `GET /v1/self-test`
- `POST /v1/run`

Implemented adapters:

- `ode.ivp.v1`
- `optimization.poisson-amplitude.v1`
- `poisson.fd.v1`
- `spectrum.laplacian-grid.v1`
- `resolvent.matrix.v1`
- `topology.gudhi.v1`
  - `complexKind=rips`
  - `complexKind=cubical`
  - `complexKind=simplex`
  - `operation=compareRipsPointClouds`
- `topology.ripser.v1`
  - point-cloud or distance-matrix Vietoris-Rips persistence
  - optional greedy-permutation `nPerm`

## B7 topology contract

Primary backend: `topology.gudhi.v1`.

Optional fast path: `topology.ripser.v1`.

Common topology output records:

- backend / complex kind
- coefficient field
- max homology dimension
- Betti numbers
- persistent Betti numbers when a query window is requested
- persistence intervals
- barcode and persistence-diagram data
- approximation / sparsification metadata
- source revision references
- diagnostics and provenance
- `topologyEquivalenceStatus = NOT ESTABLISHED`

The last field is deliberate: matching persistence signatures can support a finite filtered-complex comparison but cannot silently become a proof that the original mathematical objects are topologically equivalent.

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

The service is intentionally separate from `mathscope-cloud-lean`.

Repository:

https://github.com/leegahuyn/MathScopeCompute

Live service:

https://mathscope-compute.onrender.com

## Trust boundary

This service never emits `FORMAL PASS` or `THEOREM-BACKED` by itself. Its default evidence grade is `NUMERICAL INDICATOR`.
