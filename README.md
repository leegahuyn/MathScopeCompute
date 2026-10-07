# MathScopeCompute

Hybrid numerical compute service for MathScope v0.3.1.

This repository is intentionally separate from the MathScope Lean/formal codebase.

## Architecture

MathScope keeps small deterministic reference adapters in the browser and sends heavier numerical work to this Python service.

The service preserves MathScope's mathematical contract:

- numerical output is evidence, not a theorem;
- finite matrices are finite approximations, not infinite operators;
- every result carries input/environment hashes and provenance;
- adapter output follows the common `Adapter.run(inputSpec, environment)` envelope.

Initial stack:

- Python 3.12+
- FastAPI
- NumPy
- SciPy / ARPACK

Planned optional adapters, not enabled by this scaffold:

- PETSc / petsc4py
- SLEPc / slepc4py
- DOLFINx / FEniCSx

## API

- `GET /health`
- `GET /v1/capabilities`
- `POST /v1/run`

Currently implemented adapters:

- `poisson.fd.v1`
- `spectrum.laplacian-grid.v1`
- `resolvent.matrix.v1`

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

`render.yaml` is included for a Python web service. The service is intentionally separate from `mathscope-cloud-lean`.

Repository:

https://github.com/leegahuyn/MathScopeCompute

After deployment, place both the repository URL and Render service URL in the MathScope Stage 3 UI.

## Trust boundary

This service never emits `FORMAL PASS` or `THEOREM-BACKED` by itself. Its default evidence grade is `NUMERICAL INDICATOR`.
