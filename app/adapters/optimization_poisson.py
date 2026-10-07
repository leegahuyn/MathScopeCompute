from __future__ import annotations

from typing import Any

import numpy as np

from app.adapters.base import Adapter
from app.models import AdapterResult, EvidenceRecord
from app.provenance import environment_fingerprint, sha256_json


class PoissonAmplitudeOptimizationAdapter(Adapter):
    name = "optimization.poisson-amplitude.v1"
    version = "0.1.0"

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        n = int(input_spec.get("gridN", 32))
        target = float(input_spec.get("targetAmplitude", 1.0))
        regularizer = float(input_spec.get("regularizer", 1e-3))
        if n < 4 or n > 512:
            raise ValueError("gridN must be between 4 and 512")
        if regularizer < 0:
            raise ValueError("regularizer must be nonnegative")

        h = 1.0 / (n + 1)
        lambda_h = 8.0 / h**2 * np.sin(np.pi * h / 2.0) ** 2
        gain = 2.0 * np.pi**2 / lambda_h

        x = np.arange(1, n + 1) * h
        xx, yy = np.meshgrid(x, x, indexing="ij")
        phi = np.sin(np.pi * xx) * np.sin(np.pi * yy)
        weight = float(np.mean(phi**2))

        denom = gain * gain * weight + regularizer
        m_star = 0.0 if denom == 0.0 else gain * weight * target / denom
        achieved = gain * m_star
        objective = 0.5 * weight * (achieved - target) ** 2 + 0.5 * regularizer * m_star**2
        gradient = gain * weight * (achieved - target) + regularizer * m_star

        env = environment_fingerprint(environment)
        inputs_hash = sha256_json({"adapter": self.name, "inputSpec": input_spec})
        env_hash = sha256_json(env)
        repro_hash = sha256_json(
            {
                "adapter": self.name,
                "version": self.version,
                "inputsHash": inputs_hash,
                "environmentHash": env_hash,
                "mStar": m_star,
                "objective": objective,
            }
        )

        representation = {
            "type": "OptimizationResult",
            "control": "sourceAmplitude",
            "controlValue": float(m_star),
            "objective": float(objective),
            "targetAmplitude": target,
            "achievedAmplitude": float(achieved),
            "gradientAtSolution": float(gradient),
            "method": "closed-form scalar reduced optimization",
            "finiteApproximation": True,
        }
        evidence = EvidenceRecord(
            grade="NUMERICAL INDICATOR",
            method="finite-grid reduced scalar optimization",
            inputsHash=inputs_hash,
            environmentHash=env_hash,
            residuals={"gradientAtSolution": float(abs(gradient))},
            assumptions=[
                "manufactured single-mode Poisson model",
                "uniform Cartesian grid",
                "quadratic objective",
            ],
            adapterVersion=self.version,
            scope="finite-grid one-parameter optimization only",
        )
        return AdapterResult(
            adapter=self.name,
            adapterVersion=self.version,
            status="completed",
            outputRepresentations=[representation],
            evidenceRecords=[evidence],
            diagnostics=[],
            residuals={"gradientAtSolution": float(abs(gradient))},
            errorBounds=None,
            provenanceEdges=[{"relation": "optimizes", "from": "OptimizationSpec", "to": "PDESpec"}],
            reproducibilityHash=repro_hash,
            environment=env,
        )
