"""Scoped numerical complex Riemann-zeta surface for MathScope Stage 8.

This is a complex-analytic *reference visualization*, not a proof of zeros,
a Riemann-hypothesis claim, or an exact spectral identity.
"""
from __future__ import annotations

import math
from typing import Any

from mpmath import mp

from app.adapters.base import Adapter
from app.models import AdapterResult, Diagnostic, EvidenceRecord
from app.provenance import environment_fingerprint, sha256_json, utc_now


class ComplexZetaSurfaceAdapter(Adapter):
    name = "advanced.zeta-complex-surface.v1"
    version = "0.1.0"

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        x0 = float(input_spec.get("realMin", 0.2))
        x1 = float(input_spec.get("realMax", 1.4))
        y0 = float(input_spec.get("imagMin", 0.0))
        y1 = float(input_spec.get("imagMax", 32.0))
        nx = int(input_spec.get("realSamples", 23))
        ny = int(input_spec.get("imagSamples", 35))
        dps = int(input_spec.get("precisionDps", 30))
        radius = float(input_spec.get("poleExclusionRadius", 0.075))
        height_cap = float(input_spec.get("heightCap", 8.0))
        if not all(math.isfinite(q) for q in (x0, x1, y0, y1, radius, height_cap)):
            raise ValueError("all bounds must be finite")
        if not (-3 <= x0 < x1 <= 4 and -60 <= y0 < y1 <= 60):
            raise ValueError("real domain [-3,4], imaginary domain [-60,60], nonempty intervals required")
        if not (4 <= nx <= 45 and 4 <= ny <= 45 and nx * ny <= 1600):
            raise ValueError("grid must be 4..45 on each axis and at most 1600 samples")
        if not (20 <= dps <= 50 and 0.02 <= radius <= 0.4 and 2 <= height_cap <= 16):
            raise ValueError("precision/pole-radius/height-cap out of limits")

        ctx = mp.clone()  # independent precision context, no mutation of global mpmath mp.dps
        vertices: list[dict[str, Any]] = []
        masked = 0
        clipped = 0
        max_discrepancy = 0.0
        near_zero = 0
        sample_count = 0

        for j in range(ny):
            y = y0 + (y1 - y0) * j / (ny - 1)
            for i in range(nx):
                x = x0 + (x1 - x0) * i / (nx - 1)
                sample_count += 1
                if math.hypot(x - 1.0, y) < radius:
                    masked += 1
                    vertices.append({"x": x, "y": y, "status": "POLE_MASKED", "height": None,
                                     "phase": None, "magnitude": None, "re": None, "im": None,
                                     "precisionDiscrepancy": None})
                    continue
                s = ctx.mpc(x, y)
                try:
                    with ctx.workdps(dps):
                        z_lo = +ctx.zeta(s)
                    with ctx.workdps(dps + 12):
                        z_hi = +ctx.zeta(s)
                        magnitude = float(abs(z_hi))
                        angle = float(ctx.arg(z_hi))
                        re = float(ctx.re(z_hi))
                        im = float(ctx.im(z_hi))
                        discrepancy = float(abs(z_hi - z_lo))
                    if not all(math.isfinite(v) for v in (magnitude, angle, re, im, discrepancy)):
                        raise ArithmeticError("nonfinite zeta evaluation")
                    height_raw = math.log1p(magnitude)
                    saturated = height_raw > height_cap
                    if saturated:
                        clipped += 1
                    if magnitude < 0.05:
                        near_zero += 1
                    max_discrepancy = max(max_discrepancy, discrepancy)
                    vertices.append({
                        "x": x, "y": y,
                        "height": min(height_raw, height_cap),
                        "phase": angle,
                        "magnitude": magnitude, "re": re, "im": im,
                        "precisionDiscrepancy": discrepancy,
                        "status": "HEIGHT_CLIPPED" if saturated else "SAMPLED",
                    })
                except (ValueError, ZeroDivisionError, OverflowError, ArithmeticError):
                    masked += 1
                    vertices.append({"x": x, "y": y, "status": "EVALUATION_MASKED", "height": None,
                                     "phase": None, "magnitude": None, "re": None, "im": None,
                                     "precisionDiscrepancy": None})

        spec = {
            "id": "complex-zeta-surface-stage8",
            "type": "ComplexZetaSurfaceSpec",
            "functionRef": "RiemannZetaSpec",
            "functionName": "Riemann zeta",
            "domain": {"realMin": x0, "realMax": x1, "imagMin": y0, "imagMax": y1},
            "grid": {"realSamples": nx, "imagSamples": ny, "pointCount": nx * ny, "ordering": "imag-major"},
            "representation": {
                "id": "complex-zeta-representation-stage8",
                "type": "RepresentationSpec",
                "sourceObjectRef": "RiemannZetaSpec",
                "method": "complex-domain-height-phase",
                "mapDefinition": "(Re s, Im s, log(1+|zeta(s)|)), phase arg(zeta(s)) -> hue",
                "displayDim": 3,
                "lostCoordinates": ["Re zeta(s)", "Im zeta(s) as independent spatial coordinates"],
                "phaseEncodedAsColor": True,
                "phaseIsSpatialDimension": False,
                "intrinsicComplexGeometryPreserved": False,
                "fidelityVector": {"precisionDiscrepancyMax": max_discrepancy, "poleMaskedCount": masked, "heightClippedCount": clipped},
                "evidenceGrade": "NUMERICAL INDICATOR",
                "status": "NUMERICAL VISUALIZATION ONLY",
            },
            "vertices": vertices,
            "pole": {"at": {"re": 1, "im": 0}, "order": 1, "maskRadius": radius},
            "heightScale": "log1p(abs(zeta(s)))",
            "phaseScale": "arg(zeta(s)) radians",
            "analyticContinuation": "mpmath zeta; analytic continuation used away from Re(s)>1",
            "precisionDps": dps,
            "precisionDiscrepancyIsCertifiedBound": False,
            "nearZeroThreshold": 0.05,
            "nearZeroSampleCount": near_zero,
            "maskedCount": masked,
            "heightClippedCount": clipped,
            "riemannZetaEqualsSpectralZeta": False,
            "zeroCertification": "NONE",
            "status": "NUMERICALLY SAMPLED / NOT THEOREM",
            "reference": "NIST DLMF §25.2; mpmath zeta(s) documentation",
        }
        env = environment_fingerprint(environment)
        inputs_hash = sha256_json({"adapter": self.name, "inputSpec": input_spec})
        environment_hash = sha256_json(env)
        result_hash = sha256_json({"adapter": self.name, "version": self.version, "input": inputs_hash,
                                   "environment": environment_hash, "representation": spec})
        evidence = EvidenceRecord(
            id=f"ev-complex-zeta-{inputs_hash[:12]}",
            grade="NUMERICAL INDICATOR",
            claimRef=str(input_spec.get("claimRef", "claim:complex-zeta-visualization")),
            method="mpmath complex zeta sampling at two working precisions",
            inputsHash=inputs_hash,
            environmentHash=environment_hash,
            residuals={"maxPrecisionDiscrepancy": max_discrepancy, "nearZeroSamples": near_zero},
            errorBounds=None,
            assumptions=["finite complex grid", "s=1 pole excluded by radius",
                         "precision discrepancy is not a certified numerical error bound",
                         "phase is shown as color, not spatial coordinate",
                         "Riemann zeta is distinct from spectral zeta"],
            generatedAt=utc_now(),
            adapterVersion=self.version,
            upstreamRevisions=[str(x) for x in input_spec.get("sourceRevisionRefs", [])],
            stale=False,
            scope="scoped 3D Riemann-zeta reference only / no proof or spectral identity",
        )
        return AdapterResult(
            adapter=self.name, adapterVersion=self.version, status="completed",
            outputRepresentations=[spec], evidenceRecords=[evidence],
            diagnostics=[
                Diagnostic(level="warning", code="ZETA_3D_PROJECTION", message="3D height/phase is a representation, not the original complex graph or proof."),
                Diagnostic(level="warning", code="NUMERICAL_UNCERTAINTY", message="Differences between working precisions are diagnostics, NOT rigorous absolute error bounds."),
            ],
            residuals={"maxPrecisionDiscrepancy": max_discrepancy, "maskedCount": masked,
                       "heightClippedCount": clipped},
            errorBounds=None,
            provenanceEdges=[{"relation": "representedBy", "from": "RiemannZetaSpec",
                              "to": "complex-zeta-representation-stage8"}],
            reproducibilityHash=result_hash, environment=env,
        )
