from __future__ import annotations

from typing import Any

import numpy as np
from scipy.sparse import diags, eye, kron
from scipy.sparse.linalg import eigsh

from app.adapters.base import Adapter
from app.models import AdapterResult, EvidenceRecord
from app.provenance import environment_fingerprint, sha256_json, utc_now


class LaplacianSpectrumAdapter(Adapter):
    name = "spectrum.laplacian-grid.v1"
    version = "0.1.0"

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        n = int(input_spec.get("gridN", 32))
        k = int(input_spec.get("k", 8))
        if n < 4 or n > 256:
            raise ValueError("gridN must be between 4 and 256")
        dim = n * n
        if k < 1 or k >= dim:
            raise ValueError("k must satisfy 1 <= k < gridN^2")
        k = min(k, 32)

        h = 1.0 / (n + 1)
        one_d = diags(
            [-np.ones(n - 1), 2.0 * np.ones(n), -np.ones(n - 1)],
            offsets=[-1, 0, 1],
            format="csr",
        ) / h**2
        a = kron(eye(n, format="csr"), one_d) + kron(one_d, eye(n, format="csr"))

        eigenvalues, eigenvectors = eigsh(a, k=k, which="SM")
        order = np.argsort(eigenvalues)
        eigenvalues = eigenvalues[order]
        eigenvectors = eigenvectors[:, order]

        residuals = []
        for idx, lam in enumerate(eigenvalues):
            vec = eigenvectors[:, idx]
            residuals.append(float(np.linalg.norm(a @ vec - lam * vec)))

        env = environment_fingerprint(environment)
        inputs_hash = sha256_json({"adapter": self.name, "inputSpec": input_spec})
        env_hash = sha256_json(env)
        repro_hash = sha256_json(
            {
                "adapter": self.name,
                "version": self.version,
                "inputsHash": inputs_hash,
                "environmentHash": env_hash,
                "eigenvalues": eigenvalues.tolist(),
                "residuals": residuals,
            }
        )

        representation = {
            "type": "SpectrumSpec",
            "mode": "finiteApprox",
            "operator": "five-point Dirichlet Laplacian",
            "truncationN": dim,
            "basis": "uniform Cartesian interior grid",
            "projection": "finite-difference matrix A_N",
            "pointSpectrum": [
                {"value": float(v), "residual2": residuals[i]} for i, v in enumerate(eigenvalues)
            ],
            "continuousSpectrum": {"status": "NOT REPRESENTED BY FINITE MATRIX"},
            "residualSpectrum": {"status": "NOT REPRESENTED BY FINITE MATRIX"},
            "exactInfinite": False,
            "pollutionRisk": "NOT ASSESSED",
        }

        evidence = EvidenceRecord(
            id=f"ev-{self.name}-{inputs_hash[:12]}",
            grade="NUMERICAL INDICATOR",
            claimRef=str(input_spec.get("claimRef", f"claim:{self.name}")),
            method="SciPy eigsh / ARPACK on finite-difference matrix",
            inputsHash=inputs_hash,
            environmentHash=env_hash,
            residuals={"eigenpairResidual2": residuals},
            assumptions=[
                "finite grid",
                "symmetric sparse matrix",
                "finite approximation is not the infinite operator spectrum",
            ],
            generatedAt=utc_now(),
            adapterVersion=self.version,
            upstreamRevisions=list(input_spec.get("upstreamRevisions", [])),
            stale=False,
            scope="finite-dimensional approximation only",
        )

        return AdapterResult(
            adapter=self.name,
            adapterVersion=self.version,
            status="completed",
            outputRepresentations=[representation],
            evidenceRecords=[evidence],
            diagnostics=[],
            residuals={"eigenpairResidual2": residuals},
            errorBounds=None,
            provenanceEdges=[
                {"relation": "spectrumOf", "from": representation["type"], "to": "A_N"},
                {"relation": "approximates", "from": "A_N", "to": "Dirichlet Laplacian"},
            ],
            reproducibilityHash=repro_hash,
            environment=env,
        )
