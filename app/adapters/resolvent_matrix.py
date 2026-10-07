from __future__ import annotations

from typing import Any

import numpy as np
from scipy.linalg import svdvals

from app.adapters.base import Adapter
from app.models import AdapterResult, EvidenceRecord
from app.provenance import environment_fingerprint, sha256_json, utc_now


class ResolventMatrixAdapter(Adapter):
    name = "resolvent.matrix.v1"
    version = "0.1.0"

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        raw = input_spec.get("matrix")
        if not isinstance(raw, list) or not raw:
            raise ValueError("matrix must be a non-empty square nested list")
        a = np.asarray(raw, dtype=float)
        if a.ndim != 2 or a.shape[0] != a.shape[1]:
            raise ValueError("matrix must be square")
        if a.shape[0] > 256:
            raise ValueError("matrix dimension must be <= 256 in the initial service")

        lam_spec = input_spec.get("lambda", {"real": 0.0, "imag": 0.0})
        lam = complex(float(lam_spec.get("real", 0.0)), float(lam_spec.get("imag", 0.0)))
        m = lam * np.eye(a.shape[0], dtype=complex) - a.astype(complex)

        svals = svdvals(m)
        sigma_min = float(np.min(svals))
        norm = float("inf") if sigma_min == 0.0 else 1.0 / sigma_min

        env = environment_fingerprint(environment)
        inputs_hash = sha256_json({"adapter": self.name, "inputSpec": input_spec})
        env_hash = sha256_json(env)
        repro_hash = sha256_json(
            {
                "adapter": self.name,
                "version": self.version,
                "inputsHash": inputs_hash,
                "environmentHash": env_hash,
                "sigmaMin": sigma_min,
            }
        )

        representation = {
            "type": "FiniteResolventSample",
            "lambda": {"real": lam.real, "imag": lam.imag},
            "resolventNorm2": norm,
            "smallestSingularValue": sigma_min,
            "finiteApproximation": True,
        }

        evidence = EvidenceRecord(
            id=f"ev-{self.name}-{inputs_hash[:12]}",
            grade="NUMERICAL INDICATOR",
            claimRef=str(input_spec.get("claimRef", f"claim:{self.name}")),
            method="finite matrix smallest singular value",
            inputsHash=inputs_hash,
            environmentHash=env_hash,
            residuals={"smallestSingularValue": sigma_min},
            assumptions=["finite matrix only"],
            generatedAt=utc_now(),
            adapterVersion=self.version,
            upstreamRevisions=list(input_spec.get("upstreamRevisions", [])),
            stale=False,
            scope="finite-matrix resolvent sample only",
        )

        return AdapterResult(
            adapter=self.name,
            adapterVersion=self.version,
            status="completed",
            outputRepresentations=[representation],
            evidenceRecords=[evidence],
            diagnostics=[],
            residuals={"smallestSingularValue": sigma_min},
            errorBounds=None,
            provenanceEdges=[{"relation": "resolventSampleOf", "from": "lambda", "to": "finite-matrix"}],
            reproducibilityHash=repro_hash,
            environment=env,
        )
