from __future__ import annotations

import math
from typing import Any

import numpy as np

from app.adapters.base import Adapter
from app.models import AdapterResult, Diagnostic, EvidenceRecord
from app.provenance import environment_fingerprint, sha256_json, utc_now

AT_SINGER_REF = (
    "M. F. Atiyah and I. M. Singer, The Index of Elliptic Operators I, "
    "Annals of Mathematics 87 (1968), 484-530"
)
ATIYAH_SYMBOL_REF = (
    "M. F. Atiyah, The index of elliptic operators on compact manifolds, "
    "Seminaire Bourbaki, Exp. 253 (1964)"
)


def _source_refs(spec: dict[str, Any]) -> list[str]:
    refs = spec.get("sourceRevisionRefs", spec.get("upstreamRevisions", []))
    return [str(x) for x in refs] if isinstance(refs, list) else []


def _dimension(spec: dict[str, Any]) -> int:
    n = int(spec.get("manifoldDimension", 2))
    if n < 1 or n > 6:
        raise ValueError("manifoldDimension must be between 1 and 6")
    return n


def _quadratic_form(spec: dict[str, Any], n: int, model: str) -> np.ndarray:
    raw = spec.get("quadraticForm")
    if raw is None:
        if model == "hyperbolic_counterexample":
            if n != 2:
                raise ValueError("hyperbolic_counterexample currently requires manifoldDimension=2")
            return np.diag([1.0, -1.0])
        return np.eye(n, dtype=float)
    a = np.asarray(raw, dtype=float)
    if a.shape != (n, n):
        raise ValueError(f"quadraticForm must have shape {n}x{n}")
    if not np.all(np.isfinite(a)):
        raise ValueError("quadraticForm must contain only finite numbers")
    if np.max(np.abs(a - a.T)) > 1e-10:
        raise ValueError("quadraticForm must be symmetric in the Stage 6 reference adapter")
    return a


def _directions(n: int, count: int, seed: int) -> np.ndarray:
    count = max(16, min(2048, int(count)))
    if n == 1:
        return np.array([[1.0], [-1.0]])
    if n == 2:
        theta = np.linspace(0.0, 2.0 * math.pi, count, endpoint=False)
        return np.column_stack((np.cos(theta), np.sin(theta)))
    rng = np.random.default_rng(seed)
    x = rng.normal(size=(count, n))
    norms = np.linalg.norm(x, axis=1)
    norms[norms == 0] = 1.0
    return x / norms[:, None]


def _characteristic_directions_2d(a: np.ndarray, count: int = 1440) -> list[list[float]]:
    theta = np.linspace(0.0, 2.0 * math.pi, count, endpoint=False)
    dirs = np.column_stack((np.cos(theta), np.sin(theta)))
    vals = np.einsum("bi,ij,bj->b", dirs, a, dirs)
    order = np.argsort(np.abs(vals))
    found: list[list[float]] = []
    for idx in order[:32]:
        if abs(vals[idx]) > 2e-3:
            break
        v = dirs[idx]
        if all(abs(float(np.dot(v, np.asarray(w)))) < 0.995 for w in found):
            found.append([float(v[0]), float(v[1])])
        if len(found) >= 4:
            break
    return found


def _boundary_spec(spec: dict[str, Any], model: str) -> dict[str, Any]:
    boundary = spec.get("boundary", {})
    present = bool(boundary.get("present", False))
    condition = str(boundary.get("condition", "none"))
    if not present:
        return {
            "id": "boundary-stage6",
            "type": "BoundaryAnalysisSpec",
            "manifoldBoundary": False,
            "boundaryCondition": "none",
            "boundarySymbol": None,
            "boundaryClass": None,
            "atiyahBottObstruction": "NOT APPLICABLE",
            "localEllipticBCEligibility": "NOT APPLICABLE",
            "apsOrGlobalAlternative": "NOT REQUIRED",
            "status": "NO BOUNDARY",
            "allBoundaryConditionsImpossible": False,
            "coverage": "NOT APPLICABLE",
        }
    if condition == "synthetic_nonzero_obstruction":
        return {
            "id": "boundary-stage6",
            "type": "BoundaryAnalysisSpec",
            "manifoldBoundary": True,
            "boundaryCondition": condition,
            "boundarySymbol": "SEMANTIC FIXTURE ONLY",
            "boundaryClass": "SEMANTIC FIXTURE: NONZERO OBSTRUCTION",
            "atiyahBottObstruction": "NONZERO (SEMANTIC REGRESSION FIXTURE)",
            "localEllipticBCEligibility": "OBSTRUCTED",
            "apsOrGlobalAlternative": "POSSIBLE / REQUIRES SEPARATE ANALYSIS",
            "status": "REQUIRES FURTHER ANALYSIS",
            "allBoundaryConditionsImpossible": False,
            "coverage": "SEMANTIC GUARD FIXTURE; NOT A CLAIM ABOUT A SPECIFIC OPERATOR",
        }
    if condition in {"dirichlet", "neumann", "robin"} and model in {
        "closed_scalar_laplacian",
        "nonlinear_elliptic_linearization",
    }:
        return {
            "id": "boundary-stage6",
            "type": "BoundaryAnalysisSpec",
            "manifoldBoundary": True,
            "boundaryCondition": condition,
            "boundarySymbol": "Laplace-type reference boundary symbol",
            "boundaryClass": "EXTERNAL THEOREM MAPPING REQUIRED",
            "atiyahBottObstruction": "NOT COMPUTED BY THIS ADAPTER",
            "localEllipticBCEligibility": "REFERENCE-ELIGIBLE / THEOREM MAPPING REQUIRED",
            "apsOrGlobalAlternative": "AVAILABLE AS SEPARATE GLOBAL/SPECTRAL OPTION",
            "status": "PARTIAL / EXTERNAL THEOREM",
            "allBoundaryConditionsImpossible": False,
            "coverage": "PARTIAL",
        }
    if condition == "aps":
        return {
            "id": "boundary-stage6",
            "type": "BoundaryAnalysisSpec",
            "manifoldBoundary": True,
            "boundaryCondition": "APS",
            "boundarySymbol": "GLOBAL / SPECTRAL CONDITION",
            "boundaryClass": "NOT REDUCED TO A LOCAL BC CLASS",
            "atiyahBottObstruction": "LOCAL-BC QUESTION SEPARATED",
            "localEllipticBCEligibility": "NOT THE SELECTED MODE",
            "apsOrGlobalAlternative": "SELECTED",
            "status": "GLOBAL / SPECTRAL BC MODE",
            "allBoundaryConditionsImpossible": False,
            "coverage": "EXTERNAL THEOREM / PARTIAL",
        }
    return {
        "id": "boundary-stage6",
        "type": "BoundaryAnalysisSpec",
        "manifoldBoundary": True,
        "boundaryCondition": condition,
        "boundarySymbol": "UNKNOWN",
        "boundaryClass": "UNKNOWN",
        "atiyahBottObstruction": "UNKNOWN",
        "localEllipticBCEligibility": "UNKNOWN",
        "apsOrGlobalAlternative": "REQUIRES FURTHER ANALYSIS",
        "status": "UNKNOWN",
        "allBoundaryConditionsImpossible": False,
        "coverage": "UNKNOWN",
    }


class EllipticIndexReferenceAdapter(Adapter):
    name = "index.elliptic-reference.v1"
    version = "0.1.0"

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        model = str(input_spec.get("model", "closed_scalar_laplacian"))
        if model not in {
            "closed_scalar_laplacian",
            "nonlinear_elliptic_linearization",
            "custom_quadratic_symbol",
            "hyperbolic_counterexample",
        }:
            raise ValueError("unsupported Stage 6 reference model")
        analysis_mode = str(input_spec.get("analysisMode", "theorem"))
        if analysis_mode not in {"theorem", "symbolic", "sampled"}:
            raise ValueError("analysisMode must be theorem, symbolic, or sampled")
        n = _dimension(input_spec)
        seed = int(input_spec.get("seed", 0))
        sample_count = int(input_spec.get("samples", 96))
        tolerance = float(input_spec.get("tolerance", 1e-9))
        lam = float(input_spec.get("lambda", 0.0))
        connected = bool(input_spec.get("connected", True))
        compact = bool(input_spec.get("compact", True))
        smooth = bool(input_spec.get("smooth", True))
        boundary = input_spec.get("boundary", {})
        boundary_present = bool(boundary.get("present", False))
        a = _quadratic_form(input_spec, n, model)

        eig = np.linalg.eigvalsh(a)
        definite_positive = bool(np.min(eig) > tolerance)
        definite_negative = bool(np.max(eig) < -tolerance)
        exact_elliptic = definite_positive or definite_negative
        exact_fail = not exact_elliptic

        dirs = _directions(n, sample_count, seed)
        values = np.einsum("bi,ij,bj->b", dirs, a, dirs)
        abs_values = np.abs(values)
        min_sample = float(np.min(abs_values))
        max_sample = float(np.max(abs_values))
        min_idx = int(np.argmin(abs_values))
        min_dir = [float(x) for x in dirs[min_idx].tolist()]
        phases = [0.0 if x >= 0 else math.pi for x in values[: min(64, len(values))]]
        characteristic = _characteristic_directions_2d(a) if n == 2 and exact_fail else []

        built_in_elliptic = model in {
            "closed_scalar_laplacian",
            "nonlinear_elliptic_linearization",
        } and np.allclose(a, np.eye(n), atol=1e-12)

        if exact_fail:
            ellipticity_status = "FAIL"
        elif analysis_mode == "theorem" and built_in_elliptic:
            ellipticity_status = "THEOREM-BACKED ELLIPTIC"
        else:
            ellipticity_status = "NUMERICALLY CONSISTENT"

        local_warnings: list[str] = []
        if analysis_mode == "sampled" and exact_elliptic:
            local_warnings.append(
                "Sampled directions are incomplete evidence; finite sampling alone does not prove ellipticity."
            )
        if exact_fail:
            local_warnings.append("Characteristic direction exists for the supplied symmetric principal quadratic form.")
        if boundary_present:
            local_warnings.append("Closed-manifold Atiyah-Singer edge is not applied unchanged to the boundary problem.")

        operator_id = "op-stage6-" + model
        symbol_id = "symbol-stage6-" + model
        kclass_id = "kclass-stage6-" + model
        index_id = "index-stage6-" + model

        operator = {
            "id": operator_id,
            "type": "DifferentialOperatorSpec",
            "model": model,
            "operatorOrder": 2,
            "differentialOrder": 2,
            "bundles": {"E": "real/complex scalar line bundle", "F": "same scalar line bundle"},
            "domainManifold": {
                "dimension": n,
                "compact": compact,
                "smooth": smooth,
                "connected": connected,
                "boundary": boundary_present,
            },
            "principalPart": "-sum_ij A_ij partial_i partial_j",
            "lowerOrderTerm": f"lambda={lam:g}" if model == "nonlinear_elliptic_linearization" else None,
            "symbolGenerationHook": "replace highest-order derivatives by cotangent variables xi",
            "quadraticForm": a.tolist(),
            "sourceRevisionRefs": _source_refs(input_spec),
        }

        symbol = {
            "id": symbol_id,
            "type": "PrincipalSymbolSpec",
            "operatorRef": operator_id,
            "order": 2,
            "basePoint": input_spec.get("basePoint", "generic x"),
            "cotangentNormalization": "|xi| = 1",
            "formula": "sigma_2(D)(x,xi) = xi^T A xi",
            "matrixRepresentation": "1x1 scalar symbol",
            "quadraticForm": a.tolist(),
            "quadraticFormEigenvalues": [float(x) for x in eig.tolist()],
            "determinantSamples": [float(x) for x in values[: min(128, len(values))].tolist()],
            "smallestSingularValueSampleMin": min_sample,
            "smallestSingularValueSampleMax": max_sample,
            "minimumSampleDirection": min_dir,
            "eigenvaluePhaseSamples": phases,
            "invertibilityStatus": "INVERTIBLE FOR ALL NONZERO xi" if exact_elliptic else "NOT INVERTIBLE ON CHARACTERISTIC LOCUS",
            "characteristicDirectionFound": exact_fail,
            "characteristicDirections": characteristic,
            "sampleCount": int(len(dirs)),
            "analysisMode": analysis_mode,
            "sourceRevisionRefs": _source_refs(input_spec),
        }

        ellipticity = {
            "id": "ellipticity-stage6-" + model,
            "type": "EllipticityResult",
            "operatorRef": operator_id,
            "principalSymbolRef": symbol_id,
            "status": ellipticity_status,
            "theoremMode": analysis_mode == "theorem",
            "symbolicMode": analysis_mode == "symbolic",
            "sampledNumericalMode": analysis_mode == "sampled",
            "xiNonzeroConditionExplicit": True,
            "unitCotangentReductionUsed": True,
            "sampledMinimumSingularValue": min_sample,
            "characteristicDirectionFound": exact_fail,
            "incompleteSamplingWarning": analysis_mode == "sampled",
            "localWarnings": local_warnings,
            "theoremMapping": (
                {
                    "reference": ATIYAH_SYMBOL_REF,
                    "claim": "Ellipticity is invertibility of the principal symbol away from the zero section.",
                    "applicability": "built-in Laplace-type reference symbol",
                }
                if built_in_elliptic and analysis_mode == "theorem"
                else None
            ),
        }

        kclass = {
            "id": kclass_id,
            "type": "KTheorySpec",
            "operatorRef": operator_id,
            "principalSymbolRef": symbol_id,
            "ellipticityStatus": ellipticity_status,
            "symbolClassRef": kclass_id + ":symbol-class" if exact_elliptic else None,
            "classStatus": "ABSTRACT ELLIPTIC SYMBOL CLASS AVAILABLE" if exact_elliptic else "UNAVAILABLE: SYMBOL NOT ELLIPTIC",
            "compactSupportSemantics": (
                "elliptic symbol defines a class in compactly supported K-theory of T*M; numerical display is only a representative"
                if exact_elliptic
                else "not applicable until ellipticity is established"
            ),
            "representative": {
                "kind": "sampled principal-symbol field",
                "unitCotangentSamples": int(len(dirs)),
                "determinantPhaseSamples": phases,
            },
            "invariantData": {
                "quadraticFormSignature": {
                    "positive": int(np.sum(eig > tolerance)),
                    "negative": int(np.sum(eig < -tolerance)),
                    "nearZero": int(np.sum(np.abs(eig) <= tolerance)),
                }
            },
            "theoremAssumptions": [
                "smooth vector bundles E,F over a smooth manifold",
                "principal symbol invertible for xi != 0",
            ],
            "displayWarning": "DISPLAY IS NOT THE K-CLASS ITSELF",
            "visualizationIsKClass": False,
            "evidenceRefs": [],
        }

        closed_reference = (
            built_in_elliptic
            and compact
            and smooth
            and connected
            and not boundary_present
        )
        kernel_dim = None
        cokernel_dim = None
        analytic_index = None
        topological_index = None
        invertible: bool | None = None
        solvability = "UNKNOWN"
        theorem_edge = "NOT APPLIED"

        if closed_reference:
            analytic_index = 0
            topological_index = 0
            theorem_edge = "EXTERNAL THEOREM MAPPED / NOT FORMALLY VERIFIED"
            if abs(lam) <= 1e-12:
                kernel_dim = 1
                cokernel_dim = 1
                invertible = False
                solvability = "NOT FOR ARBITRARY f; Laplace reference requires compatibility with the constant-mode cokernel"
            else:
                invertible = None
                solvability = "CASE-DEPENDENT; lower-order parameter may change kernel/cokernel dimensions"

        index_spec = {
            "id": index_id,
            "type": "IndexSpec",
            "operatorRef": operator_id,
            "kTheoryRef": kclass_id,
            "kernelDimension": kernel_dim,
            "cokernelDimension": cokernel_dim,
            "analyticIndex": analytic_index,
            "topologicalIndex": topological_index,
            "comparison": "MATCH" if analytic_index is not None and analytic_index == topological_index else "NOT EVALUATED",
            "indexTheoremEdge": theorem_edge,
            "indexTheoremReference": AT_SINGER_REF if closed_reference else None,
            "theoremAssumptions": [
                "compact smooth manifold without boundary",
                "elliptic differential operator between smooth vector bundles",
            ],
            "theoremAssumptionsSatisfied": closed_reference,
            "invertible": invertible,
            "solvability": solvability,
            "indexZeroImpliesInvertible": False,
            "indexAloneDeterminesSolvability": False,
            "kernelCokernelTrackedSeparately": True,
            "coverage": "EXTERNAL THEOREM / PARTIAL FORMAL COVERAGE" if closed_reference else "PARTIAL / NOT EVALUATED",
        }

        boundary_spec = _boundary_spec(input_spec, model)

        outputs: list[dict[str, Any]] = [operator, symbol, ellipticity, kclass, index_spec, boundary_spec]

        if model == "nonlinear_elliptic_linearization":
            bridge = {
                "id": "nonlinear-index-bridge-stage6",
                "type": "NonlinearIndexBridgeSpec",
                "nonlinearEquation": "F(u) = -Delta_g u + lambda u - u^3 = 0",
                "candidate": input_spec.get("candidate", "u*=0"),
                "linearization": "L = DF(u*) = -Delta_g + lambda - 3(u*)^2",
                "linearizedOperatorRef": operator_id,
                "principalSymbolRef": symbol_id,
                "ellipticityRef": ellipticity["id"],
                "kTheoryRef": kclass_id,
                "indexRef": index_id,
                "kernelDimension": kernel_dim,
                "cokernelDimension": cokernel_dim,
                "localModuliVirtualDimension": analytic_index,
                "bifurcationWarning": bool(kernel_dim and kernel_dim > 0),
                "globalNonlinearSolvabilityStatus": "NOT ESTABLISHED",
                "globalNonlinearStabilityStatus": "NOT ESTABLISHED",
                "guard": "K-theory/index is applied to the linearization, not directly to the nonlinear equation.",
            }
            outputs.append(bridge)

        coverage = {
            "id": "formal-coverage-stage6",
            "type": "FormalizationCoverageSpec",
            "finiteIndexArithmetic": "FULL / elementary reference arithmetic",
            "fredholmAnalyticLayer": "PARTIAL",
            "pseudodifferentialSymbolCalculus": "EXTERNAL THEOREM / PARTIAL",
            "topologicalKTheory": "PARTIAL / EXTERNAL THEOREM",
            "fullAtiyahSinger": "NOT FULLY FORMALIZED IN CURRENT MATHSCOPE ENVIRONMENT",
            "boundaryIndexTheory": "EXTERNAL THEOREM / PARTIAL",
            "formalPassClaimed": False,
        }
        outputs.append(coverage)

        env = environment_fingerprint(environment)
        inputs_hash = sha256_json({"adapter": self.name, "inputSpec": input_spec})
        env_hash = sha256_json(env)
        repro_hash = sha256_json(
            {
                "adapter": self.name,
                "version": self.version,
                "inputsHash": inputs_hash,
                "environmentHash": env_hash,
                "outputs": outputs,
            }
        )

        evidence = EvidenceRecord(
            id=f"ev-{self.name}-{inputs_hash[:12]}",
            grade="NUMERICAL INDICATOR",
            claimRef=str(input_spec.get("claimRef", "claim:stage6-elliptic-structure")),
            method="deterministic Stage 6 symbol/index reference adapter",
            inputsHash=inputs_hash,
            environmentHash=env_hash,
            residuals={
                "sampledMinimumSingularValue": min_sample,
                "sampledMaximumSingularValue": max_sample,
                "quadraticFormEigenvalues": [float(x) for x in eig.tolist()],
                "analyticIndexReference": analytic_index,
                "topologicalIndexReference": topological_index,
            },
            errorBounds=None,
            assumptions=[
                "the adapter output is scoped to the supplied principal quadratic form and explicit built-in reference model",
                "sampled symbol values alone do not prove ellipticity",
                "the displayed symbol representative is not the K-class itself",
                "index zero does not imply invertibility or solvability",
                "boundary obstruction semantics do not imply all boundary conditions are impossible",
            ],
            generatedAt=utc_now(),
            adapterVersion=self.version,
            upstreamRevisions=_source_refs(input_spec),
            stale=False,
            scope="Stage 6 structural symbol/ellipticity/index reference evidence",
        )

        diagnostics = [
            Diagnostic(
                level="warning",
                code="KCLASS_DISPLAY_NOT_CLASS",
                message="A sampled principal-symbol visualization is only a representative and must not be labeled as the K-theory class itself.",
            ),
            Diagnostic(
                level="warning",
                code="INDEX_ZERO_NOT_INVERTIBLE",
                message="Index zero is not an invertibility or unique-solvability certificate; kernel and cokernel remain separate fields.",
            ),
        ]
        if analysis_mode == "sampled":
            diagnostics.append(
                Diagnostic(
                    level="warning",
                    code="ELLIPTICITY_SAMPLING_INCOMPLETE",
                    message="Finite cotangent-direction sampling is incomplete evidence and cannot certify ellipticity by itself.",
                )
            )
        if boundary_present:
            diagnostics.append(
                Diagnostic(
                    level="warning",
                    code="BOUNDARY_REQUIRES_SEPARATE_THEORY",
                    message="Boundary problems require boundary-symbol/obstruction analysis; the closed-manifold index theorem edge is not reused unchanged.",
                )
            )

        return AdapterResult(
            adapter=self.name,
            adapterVersion=self.version,
            status="completed",
            outputRepresentations=outputs,
            evidenceRecords=[evidence],
            diagnostics=diagnostics,
            residuals={
                "sampledMinimumSingularValue": min_sample,
                "characteristicDirectionFound": exact_fail,
                "indexTheoremEdge": theorem_edge,
            },
            errorBounds=None,
            provenanceEdges=[
                {"relation": "principalSymbolOf", "from": symbol_id, "to": operator_id},
                {"relation": "classifiesSymbolOf", "from": kclass_id, "to": operator_id},
                {"relation": "indexOf", "from": index_id, "to": operator_id},
                {"relation": "boundaryAnalysisOf", "from": boundary_spec["id"], "to": operator_id},
            ],
            reproducibilityHash=repro_hash,
            environment=env,
        )
