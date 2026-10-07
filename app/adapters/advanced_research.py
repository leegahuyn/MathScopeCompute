from __future__ import annotations

import math
from typing import Any

import numpy as np

from app.adapters.base import Adapter
from app.models import AdapterResult, Diagnostic, EvidenceRecord
from app.provenance import environment_fingerprint, sha256_json, utc_now

GALOIS_REF = "Keith Conrad, The Galois Correspondence, University of Connecticut notes"
RIEMANN_REF = "NIST Digital Library of Mathematical Functions, §§25.2 and 25.10"
SPECTRAL_FLOW_REF = (
    "John D. Phillips, Self-Adjoint Fredholm Operators And Spectral Flow, "
    "Canadian Mathematical Bulletin 39 (1996), 460-467, doi:10.4153/CMB-1996-054-4"
)
EQUIVARIANT_REF = (
    "M. F. Atiyah and G. B. Segal, The Index of Elliptic Operators: II, "
    "Annals of Mathematics 87 (1968), 531-545"
)
KHOMOLOGY_REF = (
    "P. Baum and R. G. Douglas, K homology and index theory, "
    "Proc. Sympos. Pure Math. 38-I (1982), 117-173"
)
RICCI_REF = (
    "Richard S. Hamilton, Three-manifolds with positive Ricci curvature, "
    "J. Differential Geom. 17 (1982), 255-306"
)


def _refs(spec: dict[str, Any]) -> list[str]:
    raw = spec.get("sourceRevisionRefs", spec.get("upstreamRevisions", []))
    return [str(x) for x in raw] if isinstance(raw, list) else []


def _finish(
    *,
    adapter: str,
    version: str,
    input_spec: dict[str, Any],
    environment: dict[str, Any],
    outputs: list[dict[str, Any]],
    diagnostics: list[Diagnostic],
    residuals: dict[str, Any] | None,
    assumptions: list[str],
    scope: str,
    method: str,
    claim_ref: str,
    error_bounds: dict[str, Any] | None = None,
    provenance_edges: list[dict[str, Any]] | None = None,
) -> AdapterResult:
    env = environment_fingerprint(environment)
    inputs_hash = sha256_json({"adapter": adapter, "inputSpec": input_spec})
    env_hash = sha256_json(env)
    repro_hash = sha256_json(
        {
            "adapter": adapter,
            "version": version,
            "inputsHash": inputs_hash,
            "environmentHash": env_hash,
            "outputs": outputs,
        }
    )
    evidence = EvidenceRecord(
        id=f"ev-{adapter}-{inputs_hash[:12]}",
        grade="NUMERICAL INDICATOR",
        claimRef=str(input_spec.get("claimRef", claim_ref)),
        method=method,
        inputsHash=inputs_hash,
        environmentHash=env_hash,
        residuals=residuals,
        errorBounds=error_bounds,
        assumptions=assumptions,
        generatedAt=utc_now(),
        adapterVersion=version,
        upstreamRevisions=_refs(input_spec),
        stale=False,
        scope=scope,
    )
    return AdapterResult(
        adapter=adapter,
        adapterVersion=version,
        status="completed",
        outputRepresentations=outputs,
        evidenceRecords=[evidence],
        diagnostics=diagnostics,
        residuals=residuals,
        errorBounds=error_bounds,
        provenanceEdges=provenance_edges or [],
        reproducibilityHash=repro_hash,
        environment=env,
    )


class GaloisReferenceAdapter(Adapter):
    name = "advanced.galois-reference.v1"
    version = "0.1.0"

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        preset = str(input_spec.get("preset", "quadratic_sqrt2"))
        diagnostics: list[Diagnostic] = [
            Diagnostic(
                level="warning",
                code="GALOIS_SHAPE_GUARD",
                message="3D or visual resemblance is not evidence of a Galois relation; explicit field extension and group data are required.",
            )
        ]
        theorem_map: dict[str, Any] | None = None
        correspondence: list[dict[str, Any]] = []
        if preset == "quadratic_sqrt2":
            coeffs = [1.0, 0.0, -2.0]
            roots = [math.sqrt(2.0), -math.sqrt(2.0)]
            splitting = "Q(sqrt(2))"
            degree = 2
            group = "C2"
            group_order = 2
            generators = [{"name": "tau", "action": "sqrt(2) -> -sqrt(2)", "rootPermutation": "(1 2)"}]
            correspondence = [
                {"subgroup": "C2", "fixedField": "Q", "orderReversing": True},
                {"subgroup": "{e}", "fixedField": "Q(sqrt(2))", "orderReversing": True},
            ]
            theorem_map = {"reference": GALOIS_REF, "applicability": "finite Galois extension Q(sqrt(2))/Q"}
            status = "THEOREM-MAPPED REFERENCE"
        elif preset == "quadratic_i":
            coeffs = [1.0, 0.0, 1.0]
            roots = [1j, -1j]
            splitting = "Q(i)"
            degree = 2
            group = "C2"
            group_order = 2
            generators = [{"name": "conjugation", "action": "i -> -i", "rootPermutation": "(1 2)"}]
            correspondence = [
                {"subgroup": "C2", "fixedField": "Q", "orderReversing": True},
                {"subgroup": "{e}", "fixedField": "Q(i)", "orderReversing": True},
            ]
            theorem_map = {"reference": GALOIS_REF, "applicability": "finite Galois extension Q(i)/Q"}
            status = "THEOREM-MAPPED REFERENCE"
        elif preset == "cubic_x3_minus_2":
            r = 2.0 ** (1.0 / 3.0)
            omega = complex(-0.5, math.sqrt(3.0) / 2.0)
            coeffs = [1.0, 0.0, 0.0, -2.0]
            roots = [r, r * omega, r * omega.conjugate()]
            splitting = "Q(cuberoot(2), zeta_3)"
            degree = 6
            group = "S3"
            group_order = 6
            generators = [
                {"name": "sigma", "action": "cycles the three roots", "rootPermutation": "(1 2 3)"},
                {"name": "tau", "action": "complex conjugation", "rootPermutation": "(2 3)"},
            ]
            correspondence = [
                {"subgroup": "S3", "fixedField": "Q", "orderReversing": True},
                {"subgroup": "A3", "fixedField": "Q(sqrt(-3))", "orderReversing": True},
                {"subgroup": "<transposition>", "fixedField": "a cubic subfield", "orderReversing": True},
                {"subgroup": "{e}", "fixedField": splitting, "orderReversing": True},
            ]
            theorem_map = {
                "reference": GALOIS_REF,
                "applicability": "reference splitting field for irreducible x^3-2 with nonsquare discriminant -108",
            }
            status = "THEOREM-MAPPED REFERENCE"
        elif preset == "custom":
            raw = input_spec.get("coefficients")
            if not isinstance(raw, list) or len(raw) < 2 or len(raw) > 9:
                raise ValueError("custom coefficients must be a numeric list of length 2..9")
            coeffs = [float(x) for x in raw]
            if not all(math.isfinite(x) for x in coeffs) or abs(coeffs[0]) < 1e-15:
                raise ValueError("custom polynomial must have finite coefficients and nonzero leading coefficient")
            roots = [complex(x) for x in np.roots(np.asarray(coeffs, dtype=float))]
            splitting = "UNKNOWN"
            degree = None
            group = "UNKNOWN"
            group_order = None
            generators = []
            status = "NUMERICAL ROOTS ONLY"
            diagnostics.append(
                Diagnostic(
                    level="warning",
                    code="GALOIS_GROUP_NOT_INFERRED",
                    message="Numerical roots do not determine the splitting field or Galois group; no group is inferred for a custom polynomial.",
                )
            )
        else:
            raise ValueError("unsupported Galois preset")

        roots_out = [{"re": float(complex(z).real), "im": float(complex(z).imag)} for z in roots]
        group_spec = {
            "id": f"group-stage7-{preset}",
            "type": "GroupTheorySpec",
            "group": group,
            "order": group_order,
            "generators": generators,
            "actionOn": "polynomial roots",
            "visualResemblanceCreatesRelation": False,
            "status": status,
        }
        galois = {
            "id": f"galois-stage7-{preset}",
            "type": "GaloisLabSpec",
            "baseField": "Q",
            "polynomialCoefficients": coeffs,
            "roots": roots_out,
            "splittingField": splitting,
            "extensionDegree": degree,
            "galoisGroup": group,
            "groupRef": group_spec["id"],
            "fieldTower": ["Q", splitting] if splitting != "UNKNOWN" else ["Q", "UNKNOWN"],
            "galoisCorrespondence": correspondence,
            "correspondenceStatus": "EXPLICIT" if correspondence else "NOT ESTABLISHED",
            "theoremMapping": theorem_map,
            "shapeResemblanceCreatesGaloisRelation": False,
            "requiresExplicitFieldExtension": True,
            "sourceRevisionRefs": _refs(input_spec),
        }
        rep = {
            "id": f"rep-theory-stage7-{preset}",
            "type": "RepresentationTheorySpec",
            "groupRef": group_spec["id"],
            "representation": "permutation action on roots",
            "validity": "EXPLICIT REFERENCE" if generators else "UNKNOWN",
            "invariantSubspaces": "NOT COMPUTED",
            "operatorCommutation": "NOT APPLICABLE",
            "irreducibleDecomposition": "PLACEHOLDER / EXTERNAL",
        }
        return _finish(
            adapter=self.name,
            version=self.version,
            input_spec=input_spec,
            environment=environment,
            outputs=[group_spec, galois, rep],
            diagnostics=diagnostics,
            residuals={"rootResidualMax": float(max(abs(np.polyval(coeffs, complex(z))) for z in roots)) if roots else None},
            assumptions=[
                "theorem-mapped Galois correspondence is only attached to built-in finite Galois reference presets",
                "custom numerical roots do not establish a splitting field or Galois group",
                "visual or 3D similarity has no Galois-theoretic evidential force",
            ],
            scope="finite-field-extension/Galois reference semantics",
            method="deterministic Galois reference adapter",
            claim_ref="claim:stage7-galois-semantics",
            provenance_edges=[
                {"relation": "actsOn", "from": group_spec["id"], "to": galois["id"]},
                {"relation": "representedBy", "from": group_spec["id"], "to": rep["id"]},
            ],
        )


class ZetaResolventReferenceAdapter(Adapter):
    name = "advanced.zeta-resolvent-reference.v1"
    version = "0.1.0"

    _zero_ordinates = [
        14.134725141734694,
        21.022039638771555,
        25.01085758014569,
        30.424876125859513,
        32.93506158773919,
        37.586178158825675,
        40.918719012147495,
        43.327073280914999,
        48.005150881167159,
        49.773832477672302,
    ]

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        s = float(input_spec.get("sReal", 2.0))
        n = int(input_spec.get("terms", 5000))
        if not (s > 1.0 and math.isfinite(s)):
            raise ValueError("Stage 7 reference Riemann-zeta evaluation currently requires real s > 1")
        if n < 16 or n > 200000:
            raise ValueError("terms must be between 16 and 200000")
        ks = np.arange(1, n + 1, dtype=float)
        partial = float(np.sum(ks ** (-s)))
        tail_lo = (n + 1) ** (1.0 - s) / (s - 1.0)
        tail_hi = n ** (1.0 - s) / (s - 1.0)
        riemann_mid = partial + 0.5 * (tail_lo + tail_hi)
        riemann_err = 0.5 * (tail_hi - tail_lo)

        raw_eigs = input_spec.get("spectralEigenvalues")
        if raw_eigs is None:
            raw_eigs = [float(k * k) for k in range(1, 21)]
        eigs = np.asarray([float(x) for x in raw_eigs], dtype=float)
        if eigs.ndim != 1 or len(eigs) < 2 or len(eigs) > 20000 or np.any(~np.isfinite(eigs)) or np.any(eigs <= 0):
            raise ValueError("spectralEigenvalues must contain 2..20000 positive finite values")
        spectral_zeta = float(np.sum(eigs ** (-s)))
        cursor = float(input_spec.get("resolventLambda", 0.5))
        distances = np.abs(eigs - cursor)
        resolvent_norm = float("inf") if np.min(distances) <= 1e-14 else float(1.0 / np.min(distances))

        zeros = np.asarray(input_spec.get("riemannZeroOrdinates", self._zero_ordinates), dtype=float)
        zeros = zeros[np.isfinite(zeros)]
        sorted_eigs = np.sort(eigs)
        corr = None
        if len(zeros) >= 4 and len(sorted_eigs) >= 4:
            a = np.diff(np.sort(zeros))
            b = np.diff(sorted_eigs[: min(len(sorted_eigs), len(zeros))])
            m = min(len(a), len(b))
            if m >= 3 and np.std(a[:m]) > 0 and np.std(b[:m]) > 0:
                corr = float(np.corrcoef((a[:m] - np.mean(a[:m])) / np.std(a[:m]), (b[:m] - np.mean(b[:m])) / np.std(b[:m]))[0, 1])

        riemann = {
            "id": "riemann-zeta-stage7",
            "type": "RiemannZetaSpec",
            "definition": "zeta(s) = sum_{n>=1} n^{-s} for Re(s)>1, with analytic continuation elsewhere",
            "s": s,
            "approximation": riemann_mid,
            "errorBound": riemann_err,
            "terms": n,
            "reference": RIEMANN_REF,
            "zeroOrdinatesReferenceSample": [float(x) for x in zeros[:10]],
            "status": "CERTIFIED BY ELEMENTARY TAIL BOUND IN Re(s)>1",
        }
        spectral = {
            "id": "spectral-zeta-stage7",
            "type": "SpectralZetaSpec",
            "definition": "zeta_T(s) = sum lambda_j^{-s} for the supplied finite positive spectrum",
            "s": s,
            "value": spectral_zeta,
            "eigenvalueCount": int(len(eigs)),
            "mode": "FINITE/TRUNCATED",
            "exactInfiniteSpectrum": False,
            "operatorRef": input_spec.get("operatorRef"),
            "sourceEigenvalues": [float(x) for x in eigs[:256]],
            "status": "FINITE SPECTRAL ZETA",
        }
        comparison = {
            "id": "zeta-comparison-stage7",
            "type": "ZetaCorrespondenceSpec",
            "riemannZetaRef": riemann["id"],
            "spectralZetaRef": spectral["id"],
            "spacingCorrelation": corr,
            "status": "EMPIRICAL CORRESPONDENCE" if corr is not None else "RESEARCH HYPOTHESIS",
            "spectralIdentityEstablished": False,
            "riemannZetaEqualsSpectralZeta": False,
            "guard": "statistical agreement or matching zero/eigenvalue patterns do not establish spectral identity",
            "reference": "NIST DLMF §25.17 records analogies between Riemann-zero statistics and semiclassical spectra without turning them into an identity theorem",
        }
        resolvent = {
            "id": "zeta-resolvent-stage7",
            "type": "ResolventComparisonSpec",
            "operatorRef": input_spec.get("operatorRef"),
            "lambdaCursor": cursor,
            "finiteResolventNorm": resolvent_norm,
            "mode": "FINITE DIAGONAL REFERENCE",
            "finiteApproximationWarning": True,
        }
        return _finish(
            adapter=self.name,
            version=self.version,
            input_spec=input_spec,
            environment=environment,
            outputs=[riemann, spectral, comparison, resolvent],
            diagnostics=[
                Diagnostic(
                    level="warning",
                    code="ZETA_IDENTITY_GUARD",
                    message="Riemann zeta and spectral zeta are distinct typed objects; empirical statistics never establish a spectral identity.",
                ),
                Diagnostic(
                    level="warning",
                    code="FINITE_SPECTRAL_ZETA",
                    message="The spectral zeta value is computed from a finite supplied spectrum and is not an exact infinite-dimensional spectral zeta.",
                ),
            ],
            residuals={"spacingCorrelation": corr, "finiteResolventNorm": resolvent_norm},
            error_bounds={"riemannZetaAbsoluteBound": riemann_err},
            assumptions=[
                "Riemann-zeta numerical evaluation is restricted to real s>1 in this reference adapter",
                "spectral zeta is computed only from the supplied finite positive eigenvalue list",
                "zero/eigenvalue spacing comparison is exploratory evidence only",
            ],
            scope="Riemann-zeta versus finite spectral-zeta/resolvent research semantics",
            method="bounded Dirichlet-series and finite spectral-zeta reference computation",
            claim_ref="claim:stage7-zeta-semantics",
            provenance_edges=[
                {"relation": "compares", "from": comparison["id"], "to": riemann["id"]},
                {"relation": "compares", "from": comparison["id"], "to": spectral["id"]},
            ],
        )


class SpectralFlowReferenceAdapter(Adapter):
    name = "advanced.spectral-flow-reference.v1"
    version = "0.1.0"

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        t0 = float(input_spec.get("t0", 0.0))
        t1 = float(input_spec.get("t1", 1.0))
        if not (math.isfinite(t0) and math.isfinite(t1) and t1 > t0):
            raise ValueError("require finite t1 > t0")
        tracks = input_spec.get(
            "tracks",
            [
                {"a": -0.8, "b": 1.6},
                {"a": -0.6, "b": 1.4},
                {"a": -0.4, "b": 1.2},
                {"a": -0.2, "b": 0.9},
                {"a": 0.7, "b": -1.4},
            ],
        )
        if not isinstance(tracks, list) or not tracks or len(tracks) > 256:
            raise ValueError("tracks must be a nonempty list with at most 256 affine eigenvalue tracks")
        self_adjoint = bool(input_spec.get("selfAdjoint", True))
        fredholm = bool(input_spec.get("fredholm", True))
        samples = int(input_spec.get("samples", 101))
        samples = max(21, min(501, samples))
        ts = np.linspace(t0, t1, samples)
        out_tracks: list[dict[str, Any]] = []
        pos = neg = 0
        endpoint_hits = 0
        for i, row in enumerate(tracks):
            a = float(row.get("a", 0.0))
            b = float(row.get("b", 0.0))
            vals = a + b * ts
            crossing_t = None
            sign = 0
            if abs(b) > 1e-15:
                z = -a / b
                if t0 < z < t1:
                    crossing_t = float(z)
                    sign = 1 if b > 0 else -1
                    if sign > 0:
                        pos += 1
                    else:
                        neg += 1
                elif abs(z - t0) <= 1e-12 or abs(z - t1) <= 1e-12:
                    endpoint_hits += 1
            out_tracks.append(
                {
                    "track": i,
                    "a": a,
                    "b": b,
                    "values": [float(x) for x in vals],
                    "crossingT": crossing_t,
                    "crossingSign": sign,
                }
            )
        valid = self_adjoint and fredholm
        sf = pos - neg if valid else None
        flow = {
            "id": "spectral-flow-stage7",
            "type": "SpectralFlowSpec",
            "family": "D_t = diag(a_i + b_i t)",
            "parameter": {"name": "t", "start": t0, "end": t1, "samples": samples},
            "selfAdjoint": self_adjoint,
            "fredholmCondition": fredholm,
            "finiteDimensionalReference": True,
            "eigenvalueTracks": out_tracks,
            "positiveCrossings": pos,
            "negativeCrossings": neg,
            "endpointZeroHits": endpoint_hits,
            "spectralFlow": sf,
            "status": "VALID FINITE REFERENCE" if valid else "INVALID PRECONDITIONS",
            "reference": SPECTRAL_FLOW_REF,
            "signedCrossingConvention": "negative-to-positive = +1; positive-to-negative = -1 for transverse affine crossings",
        }
        return _finish(
            adapter=self.name,
            version=self.version,
            input_spec=input_spec,
            environment=environment,
            outputs=[flow],
            diagnostics=[
                Diagnostic(
                    level="warning" if valid else "error",
                    code="SPECTRAL_FLOW_PRECONDITIONS",
                    message=(
                        "Spectral flow is scoped to an explicit self-adjoint Fredholm family; the finite diagonal fixture satisfies this when both flags are true."
                        if valid
                        else "Spectral flow is not issued because self-adjoint/Fredholm preconditions are not both satisfied."
                    ),
                )
            ],
            residuals={"positiveCrossings": pos, "negativeCrossings": neg, "spectralFlow": sf, "endpointZeroHits": endpoint_hits},
            assumptions=[
                "the reference family is diagonal, real and finite-dimensional",
                "crossings are counted only when transverse and strictly inside the parameter interval",
                "general infinite-dimensional spectral flow requires its own continuity/Fredholm hypotheses",
            ],
            scope="self-adjoint Fredholm spectral-flow reference semantics",
            method="deterministic signed zero-crossing count for affine eigenvalue tracks",
            claim_ref="claim:stage7-spectral-flow",
        )


class EquivariantKReferenceAdapter(Adapter):
    name = "advanced.equivariant-k-reference.v1"
    version = "0.1.0"

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        preset = str(input_spec.get("preset", "c2_commuting"))
        rho = np.diag([1.0, -1.0])
        if preset == "c2_commuting":
            op = np.diag([2.0, 3.0])
        elif preset == "c2_noncommuting":
            op = np.array([[0.0, 1.0], [1.0, 0.0]])
        else:
            raise ValueError("unsupported equivariant preset")
        comm = op @ rho - rho @ op
        comm_norm = float(np.linalg.norm(comm, ord=2))
        equivariant = comm_norm <= 1e-12
        rep = {
            "id": f"equivariant-rep-stage7-{preset}",
            "type": "RepresentationTheorySpec",
            "group": "C2",
            "representation": "rho(g)=diag(1,-1)",
            "representationValidity": "EXACT FINITE",
            "operatorMatrix": op.tolist(),
            "commutatorNorm": comm_norm,
            "operatorCommutation": "PASS" if equivariant else "FAIL",
            "invariantSubspaces": ["span(e1)", "span(e2)"] if equivariant else ["group action explicit; operator does not preserve the isotypic splitting"],
        }
        eq = {
            "id": f"equivariant-k-stage7-{preset}",
            "type": "EquivariantKTheorySpec",
            "groupAction": "C2 acts on the reference fibre by diag(1,-1)",
            "equivariantBundle": "finite reference C^2 bundle surrogate",
            "equivariantOperator": equivariant,
            "equivariantSymbol": "REFERENCE METADATA" if equivariant else "UNAVAILABLE: COMMUTATION FAIL",
            "equivariantKClass": "EXTERNAL/PARTIAL" if equivariant else None,
            "equivariantIndex": "NOT COMPUTED / THEOREM MAPPING REQUIRED",
            "symmetryGraphIntegration": True,
            "reference": EQUIVARIANT_REF,
            "fullFormalizationClaimed": False,
            "displayIsEquivariantKClass": False,
        }
        kh = {
            "id": f"k-homology-stage7-{preset}",
            "type": "KHomologySpec",
            "operatorClass": "elliptic/Fredholm-module metadata placeholder",
            "fredholmModuleMetadata": {
                "hilbertSpace": "finite reference surrogate",
                "representationRef": rep["id"],
                "operatorRef": eq["id"],
            },
            "spaceAssumptions": ["compact/smooth framework must be stated for geometric theorem mappings"],
            "singularSpaceFramework": "NOT SELECTED",
            "externalTheoremReference": KHOMOLOGY_REF,
            "coverage": "PARTIAL / EXTERNAL THEOREM",
            "formalPassClaimed": False,
        }
        return _finish(
            adapter=self.name,
            version=self.version,
            input_spec=input_spec,
            environment=environment,
            outputs=[rep, eq, kh],
            diagnostics=[
                Diagnostic(
                    level="warning" if equivariant else "error",
                    code="EQUIVARIANCE_CHECK",
                    message=(
                        "Finite commutation check passed; this validates the selected reference symmetry but does not compute an abstract equivariant K-class."
                        if equivariant
                        else "The selected operator does not commute with the C2 action, so no equivariant K-class is attached."
                    ),
                )
            ],
            residuals={"commutatorNorm": comm_norm},
            assumptions=[
                "finite matrix commutation is a reference symmetry check, not full equivariant index theory",
                "equivariant K-class and K-homology objects remain partial/external unless a theorem/formal backend is attached",
            ],
            scope="finite representation/equivariant-K/K-homology reference semantics",
            method="finite representation and operator commutator reference check",
            claim_ref="claim:stage7-equivariant-semantics",
            provenance_edges=[
                {"relation": "actsOn", "from": rep["id"], "to": eq["id"]},
                {"relation": "derivedFrom", "from": eq["id"], "to": kh["id"]},
            ],
        )


class PerturbationReferenceAdapter(Adapter):
    name = "advanced.perturbation-reference.v1"
    version = "0.1.0"

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        base = np.asarray(input_spec.get("baseMatrix", [[-2.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 3.0]]), dtype=float)
        k1 = np.asarray(input_spec.get("K1", [[0.1, 0.05, 0.0], [0.05, -0.1, 0.02], [0.0, 0.02, 0.0]]), dtype=float)
        k2 = np.asarray(input_spec.get("K2", [[-0.05, 0.0, 0.02], [0.0, 0.08, 0.0], [0.02, 0.0, -0.03]]), dtype=float)
        if base.ndim != 2 or base.shape[0] != base.shape[1] or base.shape[0] > 12 or base.shape != k1.shape or base.shape != k2.shape:
            raise ValueError("baseMatrix, K1 and K2 must be square matrices of the same size <=12")
        if max(float(np.max(np.abs(x - x.T))) for x in (base, k1, k2)) > 1e-10:
            raise ValueError("Stage 7 perturbation reference requires real symmetric matrices")
        mats = [base, base + k1, base + k1 + k2]
        eigs = [[float(x) for x in np.linalg.eigvalsh(m)] for m in mats]
        spec = {
            "id": "perturbation-stage7",
            "type": "PerturbationSpec",
            "operators": ["D", "D+K1", "D+K1+K2"],
            "selfAdjointFiniteReference": True,
            "eigenvalues": eigs,
            "perturbationClass": "finite-rank/compact in the finite reference model",
            "finiteSquareFredholmIndex": [0, 0, 0],
            "indexStabilityApplies": "TRIVIAL FINITE-SQUARE REFERENCE ONLY",
            "infiniteFredholmIndexStability": "THEOREM MAPPING REQUIRED",
            "guard": "finite matrix index constancy is not evidence that an arbitrary infinite-dimensional perturbation preserves Fredholm index",
        }
        return _finish(
            adapter=self.name,
            version=self.version,
            input_spec=input_spec,
            environment=environment,
            outputs=[spec],
            diagnostics=[
                Diagnostic(
                    level="warning",
                    code="PERTURBATION_SCOPE_GUARD",
                    message="Index stability is only shown in a finite square surrogate here; infinite-dimensional Fredholm stability needs explicit compact/Fredholm hypotheses.",
                )
            ],
            residuals={"maxK1Norm": float(np.linalg.norm(k1, ord=2)), "maxK2Norm": float(np.linalg.norm(k2, ord=2))},
            assumptions=["real symmetric finite matrices", "finite-rank perturbations in the reference model"],
            scope="finite perturbation/index-stability reference semantics",
            method="finite symmetric-matrix perturbation reference computation",
            claim_ref="claim:stage7-perturbation",
        )


class RicciFlowReferenceAdapter(Adapter):
    name = "advanced.ricci-flow-reference.v1"
    version = "0.1.0"

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        preset = str(input_spec.get("preset", "round_s2"))
        samples = max(16, min(400, int(input_spec.get("samples", 80))))
        if preset == "round_s2":
            t_end = float(input_spec.get("tEnd", 0.45))
            if not (0.0 < t_end < 0.5):
                raise ValueError("round_s2 unnormalized reference requires 0 < tEnd < 0.5")
            ts = np.linspace(0.0, t_end, samples)
            scale = 1.0 - 2.0 * ts
            scalar = 2.0 / scale
            volume = 4.0 * math.pi * scale
            eigen = 2.0 / scale
            status = "THEOREM-MAPPED CONSTANT-CURVATURE REFERENCE"
            theorem_map = {"reference": RICCI_REF, "equation": "partial_t g = -2 Ric(g)"}
            singular_time = 0.5
        elif preset == "flat_torus":
            t_end = float(input_spec.get("tEnd", 1.0))
            if not (0.0 < t_end <= 100.0):
                raise ValueError("flat_torus requires 0 < tEnd <= 100")
            ts = np.linspace(0.0, t_end, samples)
            scale = np.ones(samples)
            scalar = np.zeros(samples)
            volume = np.ones(samples)
            eigen = np.full(samples, 4.0 * math.pi * math.pi)
            status = "RICCI-FLAT FIXED REFERENCE"
            theorem_map = {"reference": RICCI_REF, "equation": "partial_t g = -2 Ric(g), Ric=0 gives a stationary metric"}
            singular_time = None
        else:
            raise ValueError("unsupported Ricci-flow preset")
        flow = {
            "id": f"ricci-flow-stage7-{preset}",
            "type": "RicciFlowSpec",
            "preset": preset,
            "equation": "partial_t g = -2 Ric(g)",
            "time": [float(x) for x in ts],
            "metricScale": [float(x) for x in scale],
            "scalarCurvature": [float(x) for x in scalar],
            "volume": [float(x) for x in volume],
            "selectedSpectrum": [float(x) for x in eigen],
            "singularTime": singular_time,
            "surgeryEvents": [],
            "surgeryIsSeparateTopologyRevision": True,
            "surgeryUsedAsDimensionLiftingJustification": False,
            "status": status,
            "theoremMapping": theorem_map,
        }
        return _finish(
            adapter=self.name,
            version=self.version,
            input_spec=input_spec,
            environment=environment,
            outputs=[flow],
            diagnostics=[
                Diagnostic(
                    level="warning",
                    code="RICCI_LIFTING_GUARD",
                    message="Ricci flow and surgery are geometry-evolution tools; they are not automatic justification for low-dimensional to high-dimensional lifting.",
                )
            ],
            residuals={"finalMetricScale": float(scale[-1]), "finalScalarCurvature": float(scalar[-1])},
            assumptions=[
                "the round-sphere fixture is a constant-curvature reference, not a general Ricci-flow solver",
                "surgery is modeled as a separate topology-changing event and is not performed by this adapter",
            ],
            scope="Ricci-flow constant-curvature reference semantics",
            method="closed-form constant-curvature Ricci-flow reference computation",
            claim_ref="claim:stage7-ricci-flow",
        )
