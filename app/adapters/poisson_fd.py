from __future__ import annotations

from typing import Any

import numpy as np
from scipy.sparse import diags, eye, kron
from scipy.sparse.linalg import spsolve

from app.adapters.base import Adapter
from app.models import AdapterResult, Diagnostic, EvidenceRecord
from app.provenance import environment_fingerprint, sha256_json, utc_now


class PoissonFDAdapter(Adapter):
    name = "poisson.fd.v1"
    version = "0.1.0"

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        n = int(input_spec.get("gridN", 32))
        if n < 4 or n > 256:
            raise ValueError("gridN must be between 4 and 256")

        h = 1.0 / (n + 1)
        x = np.arange(1, n + 1, dtype=float) * h
        y = np.arange(1, n + 1, dtype=float) * h
        xx, yy = np.meshgrid(x, y, indexing="ij")

        rhs = 2.0 * np.pi**2 * np.sin(np.pi * xx) * np.sin(np.pi * yy)
        exact = np.sin(np.pi * xx) * np.sin(np.pi * yy)

        one_d = diags(
            [-np.ones(n - 1), 2.0 * np.ones(n), -np.ones(n - 1)],
            offsets=[-1, 0, 1],
            format="csr",
        ) / h**2
        a = kron(eye(n, format="csr"), one_d) + kron(one_d, eye(n, format="csr"))
        b = rhs.reshape(-1)
        u = spsolve(a, b).reshape(n, n)

        residual = a @ u.reshape(-1) - b
        residual_inf = float(np.linalg.norm(residual, ord=np.inf))
        max_error = float(np.max(np.abs(u - exact)))

        env = environment_fingerprint(environment)
        inputs_hash = sha256_json({"adapter": self.name, "inputSpec": input_spec})
        env_hash = sha256_json(env)
        repro_hash = sha256_json(
            {
                "adapter": self.name,
                "version": self.version,
                "inputsHash": inputs_hash,
                "environmentHash": env_hash,
                "residualInf": residual_inf,
                "maxGridError": max_error,
            }
        )

        representation = {
            "type": "FiniteScalarField",
            "domain": "(0,1)^2",
            "gridN": n,
            "spacing": h,
            "displayMap": "(x,y) -> (x,y,u_h)",
            "finiteApproximation": True,
            "values": u.tolist(),
        }

        evidence = EvidenceRecord(
            id=f"ev-{self.name}-{inputs_hash[:12]}",
            grade="NUMERICAL INDICATOR",
            claimRef=str(input_spec.get("claimRef", f"claim:{self.name}")),
            method="five-point finite difference + SciPy sparse direct solve",
            inputsHash=inputs_hash,
            environmentHash=env_hash,
            residuals={"linf": residual_inf, "maxGridError": max_error},
            errorBounds=None,
            assumptions=[
                "unit-square domain",
                "homogeneous Dirichlet boundary conditions",
                "uniform Cartesian grid",
                "floating-point arithmetic",
            ],
            generatedAt=utc_now(),
            adapterVersion=self.version,
            upstreamRevisions=list(input_spec.get("upstreamRevisions", [])),
            stale=False,
            scope="finite discrete Poisson system only",
        )

        diagnostics = []
        if residual_inf > 1e-8:
            diagnostics.append(
                Diagnostic(
                    level="warning",
                    code="RESIDUAL_HIGH",
                    message=f"Discrete residual infinity norm is {residual_inf:.3e}.",
                )
            )

        return AdapterResult(
            adapter=self.name,
            adapterVersion=self.version,
            status="completed",
            outputRepresentations=[representation],
            evidenceRecords=[evidence],
            diagnostics=diagnostics,
            residuals={"linf": residual_inf, "maxGridError": max_error},
            errorBounds=None,
            provenanceEdges=[
                {
                    "relation": "computedBy",
                    "from": "PDESpec",
                    "to": self.name,
                },
                {
                    "relation": "representedBy",
                    "from": "finite-solution",
                    "to": "FiniteScalarField",
                },
            ],
            reproducibilityHash=repro_hash,
            environment=env,
        )
