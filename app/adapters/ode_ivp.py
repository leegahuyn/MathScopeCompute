from __future__ import annotations

from typing import Any

import numpy as np
from scipy.integrate import solve_ivp

from app.adapters.base import Adapter
from app.models import AdapterResult, EvidenceRecord
from app.provenance import environment_fingerprint, sha256_json


class ODEIVPAdapter(Adapter):
    name = "ode.ivp.v1"
    version = "0.1.0"

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        model = str(input_spec.get("model", "linear_scalar"))
        t0 = float(input_spec.get("t0", 0.0))
        t1 = float(input_spec.get("t1", 10.0))
        y0 = float(input_spec.get("y0", 1.0))
        samples = int(input_spec.get("samples", 200))
        rtol = float(input_spec.get("rtol", 1e-8))
        atol = float(input_spec.get("atol", 1e-10))
        if not (t1 > t0):
            raise ValueError("t1 must be greater than t0")
        if samples < 10 or samples > 5000:
            raise ValueError("samples must be between 10 and 5000")

        params: dict[str, float]
        exact = None
        if model == "linear_scalar":
            a = float(input_spec.get("a", -1.0))
            params = {"a": a}

            def rhs(t: float, y: np.ndarray) -> np.ndarray:
                return np.array([a * y[0]])

            exact = lambda t: y0 * np.exp(a * (t - t0))
        elif model == "logistic":
            r = float(input_spec.get("r", 1.0))
            k = float(input_spec.get("K", 1.0))
            if k <= 0:
                raise ValueError("K must be positive")
            params = {"r": r, "K": k}

            def rhs(t: float, y: np.ndarray) -> np.ndarray:
                return np.array([r * y[0] * (1.0 - y[0] / k)])
        else:
            raise ValueError("model must be linear_scalar or logistic")

        t_eval = np.linspace(t0, t1, samples)
        sol = solve_ivp(rhs, (t0, t1), [y0], t_eval=t_eval, rtol=rtol, atol=atol)
        if not sol.success:
            raise ValueError("solve_ivp did not converge")

        max_exact_error = None
        if exact is not None:
            max_exact_error = float(np.max(np.abs(sol.y[0] - exact(sol.t))))

        env = environment_fingerprint(environment)
        inputs_hash = sha256_json({"adapter": self.name, "inputSpec": input_spec})
        env_hash = sha256_json(env)
        repro_hash = sha256_json(
            {
                "adapter": self.name,
                "version": self.version,
                "inputsHash": inputs_hash,
                "environmentHash": env_hash,
                "nfev": sol.nfev,
                "lastValue": float(sol.y[0, -1]),
            }
        )

        representation = {
            "type": "ODESolutionSample",
            "model": model,
            "time": sol.t.tolist(),
            "state": sol.y[0].tolist(),
            "parameters": params,
            "finiteSampling": True,
        }
        evidence = EvidenceRecord(
            grade="NUMERICAL INDICATOR",
            method="SciPy solve_ivp",
            inputsHash=inputs_hash,
            environmentHash=env_hash,
            residuals={"maxExactError": max_exact_error, "nfev": int(sol.nfev)},
            assumptions=["finite time interval", "floating-point numerical integration"],
            adapterVersion=self.version,
            scope="sampled numerical IVP trajectory only",
        )

        return AdapterResult(
            adapter=self.name,
            adapterVersion=self.version,
            status="completed",
            outputRepresentations=[representation],
            evidenceRecords=[evidence],
            diagnostics=[],
            residuals={"maxExactError": max_exact_error, "nfev": int(sol.nfev)},
            errorBounds=None,
            provenanceEdges=[{"relation": "solvedBy", "from": "ODESpec", "to": self.name}],
            reproducibilityHash=repro_hash,
            environment=env,
        )
