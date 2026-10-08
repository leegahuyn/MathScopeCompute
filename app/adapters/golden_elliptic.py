"""One bounded, connected A -> B -> C -> D numerical research fixture.

The source metric is the flat unit torus, never the distorted display torus.
Finite computations and external analytic facts remain distinct from Lean proofs.
"""
from __future__ import annotations

import math
import re
from typing import Any

import gudhi
import numpy as np
from scipy import sparse

from app.adapters.base import Adapter
from app.models import AdapterResult, Diagnostic, EvidenceRecord
from app.provenance import environment_fingerprint, utc_now
from app.golden import wire_hash as sha256_json


NAME = "golden.elliptic-torus.v1"
VERSION = "0.1.0"
GRADE = "NUMERICAL INDICATOR"


def normalize_spec(raw: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ValueError("Golden inputSpec must be a JSON object")
    allowed = {"sessionId", "revision", "lambda", "candidateValue", "gridN", "refinements", "seed"}
    if set(raw) - allowed:
        raise ValueError("Unsupported Golden input fields: " + ", ".join(sorted(set(raw) - allowed)))
    sid = raw.get("sessionId")
    if not isinstance(sid, str) or not re.fullmatch(r"[A-Za-z0-9_.:-]{1,128}", sid):
        raise ValueError("sessionId must be a bounded ResearchSession identifier")
    revision = raw.get("revision")
    if type(revision) is not int or not 1 <= revision <= 1000000:
        raise ValueError("revision must be a positive integer")
    n = raw.get("gridN", 16)
    if type(n) is not int or n not in (8, 16, 32):
        raise ValueError("gridN must be 8, 16 or 32")
    ns = raw.get("refinements", [8, 16, 32])
    if not isinstance(ns, list) or len(ns) < 2 or any(type(x) is not int or x not in (8, 16, 32, 64) for x in ns) or ns != sorted(set(ns)):
        raise ValueError("refinements must be increasing distinct grids from 8,16,32,64")
    lam, candidate = raw.get("lambda", 1.0), raw.get("candidateValue", 1.0)
    if any(type(x) not in (int, float) or not math.isfinite(x) or abs(x) > 4 for x in (lam, candidate)):
        raise ValueError("lambda and candidateValue must be finite numbers in [-4,4]")
    if type(raw.get("seed", 0)) is not int or raw.get("seed", 0) != 0:
        raise ValueError("This deterministic Fourier fixture only supports seed=0")
    return {"sessionId": sid, "revision": revision, "lambda": float(lam), "candidateValue": float(candidate), "gridN": n, "refinements": ns, "seed": 0}


def scientific_input(spec: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in spec.items() if k not in ("sessionId", "revision")}


def periodic_laplacian(n: int) -> sparse.csr_matrix:
    one = sparse.diags([-np.ones(n - 1), 2 * np.ones(n), -np.ones(n - 1)], [-1, 0, 1], format="lil")
    one[0, n - 1] = one[n - 1, 0] = -1
    one = one.tocsr() * n * n
    return (sparse.kron(one, sparse.eye(n)) + sparse.kron(sparse.eye(n), one)).tocsr()


def fd_modes(n: int, potential: float) -> list[dict[str, Any]]:
    modes = [{"kx": k, "ky": l, "value": float(4 * n * n * (math.sin(math.pi * k / n) ** 2 + math.sin(math.pi * l / n) ** 2) + potential), "continuousReference": float(4 * math.pi ** 2 * (k * k + l * l) + potential)} for k in range(-n // 2, n // 2) for l in range(-n // 2, n // 2)]
    return sorted(modes, key=lambda x: (x["value"], x["kx"], x["ky"]))


def torus_mesh(n: int, c: float) -> dict[str, Any]:
    vertices, triangles = [], []
    for i in range(n):
        for j in range(n):
            x, y = i / n, j / n
            a, b = 2 * math.pi * x, 2 * math.pi * y
            vertices.append({"id": i * n + j, "x": x, "y": y, "source4D": [math.cos(a) / (2 * math.pi), math.sin(a) / (2 * math.pi), math.cos(b) / (2 * math.pi), math.sin(b) / (2 * math.pi)], "display3D": [(2 + .65 * math.cos(b)) * math.cos(a), (2 + .65 * math.cos(b)) * math.sin(a), .65 * math.sin(b)], "candidateValue": c, "eigenmodeValue": math.cos(a)})
            p = i * n + j
            q, r, s = ((i + 1) % n) * n + j, i * n + (j + 1) % n, ((i + 1) % n) * n + (j + 1) % n
            triangles.extend([[p, q, s], [p, s, r]])
    return {"gridN": n, "vertices": vertices, "triangles": triangles, "periodicCoordinates": True, "sourceMetric": "dx^2+dy^2 on (R/Z)^2", "displayIsSourceMetric": False, "eigenmode": {"kx": 1, "ky": 0, "formula": "cos(2*pi*x)"}}


def mesh_topology(mesh: dict[str, Any]) -> dict[str, Any]:
    # Compute both complexes, not a claimed continuum homeomorphism from a picture.
    trees = []
    for _ in range(2):
        tree = gudhi.SimplexTree()
        for triangle in mesh["triangles"]:
            tree.insert(triangle, filtration=max(mesh["vertices"][v]["candidateValue"] for v in triangle))
        tree.persistence(homology_coeff_field=2, min_persistence=0, persistence_dim_max=True)
        trees.append(tree)
    source, display = trees
    bars = [{"dimension": d, "birth": float(a), "death": None if math.isinf(b) else float(b)} for d, (a, b) in source.persistence(homology_coeff_field=2, min_persistence=0, persistence_dim_max=True)]
    bars.sort(key=lambda b: (b["dimension"], b["birth"], b["death"] or 0))
    return {"method": "GUDHI SimplexTree, candidate lower-star filtration", "coefficientField": 2, "sourceBetti": source.betti_numbers(), "displayBetti": display.betti_numbers(), "persistence": bars, "finiteComplexEqual": list(source.get_filtration()) == list(display.get_filtration()), "numVertices": source.num_vertices(), "numSimplices": source.num_simplices(), "continuumHomeomorphismProved": False, "metricTopologyInference": False}


def numerical_snapshot(spec: dict[str, Any]) -> dict[str, Any]:
    n, lam, c = spec["gridN"], spec["lambda"], spec["candidateValue"]
    a = periodic_laplacian(n)
    u = np.full(n * n, c)
    potential = lam - 3 * c * c
    operator = a + potential * sparse.eye(n * n, format="csr")
    residual = a @ u + lam * u - u ** 3
    modes = fd_modes(n, potential)
    values = np.array([m["value"] for m in modes])
    mesh = torus_mesh(n, c)
    topology = mesh_topology(mesh)
    eigenmode = np.array([v["eigenmodeValue"] for v in mesh["vertices"]])
    eigenvalue = 4 * n * n * math.sin(math.pi / n) ** 2 + potential
    eigen_residual = float(np.max(np.abs(operator @ eigenmode - eigenvalue * eigenmode)))
    refinements = [{"gridN": size, "firstPositiveMode": float(4 * size * size * math.sin(math.pi / size) ** 2 + potential), "continuousReference": float(4 * math.pi ** 2 + potential), "absoluteError": float(abs(4 * size * size * math.sin(math.pi / size) ** 2 - 4 * math.pi ** 2))} for size in spec["refinements"]]
    # Half-period x translation is a C2 action on this even periodic grid.
    permutation = [((i + n // 2) % n) * n + j for i in range(n) for j in range(n)]
    commutator = operator[permutation, :][:, permutation] - operator
    commutator_norm = float(np.max(np.abs(commutator.data))) if commutator.nnz else 0.0
    edges = set()
    for triangle in mesh["triangles"]:
        for p, q in ((triangle[0], triangle[1]), (triangle[1], triangle[2]), (triangle[0], triangle[2])):
            edges.add(tuple(sorted((p, q))))
    ratios = []
    for p, q in sorted(edges):
        v, w = mesh["vertices"][p], mesh["vertices"][q]
        dx, dy = min(abs(v["x"] - w["x"]), 1 - abs(v["x"] - w["x"])), min(abs(v["y"] - w["y"]), 1 - abs(v["y"] - w["y"]))
        ratios.append(float(np.linalg.norm(np.array(v["display3D"]) - w["display3D"]) / math.hypot(dx, dy)))
    parameter_stress = [{"lambda": q, "candidateValue": c, "residualLinf": abs(q * c - c ** 3), "accepted": abs(q * c - c ** 3) <= 1e-10} for q in (lam - .25, lam, lam + .25)]
    perturb = u + .01 * eigenmode
    perturbed_residual = a @ perturb + lam * perturb - perturb ** 3
    # Explicit finite family L(t)=L+tI; NOT a nonlinear solution branch.
    t0, t1 = -.5, 2.5
    crossings = [{"kx": m["kx"], "ky": m["ky"], "parameter": -m["value"], "orientation": 1} for m in modes if t0 < -m["value"] < t1]
    endpoints_regular = min(abs(m["value"] + t) for m in modes for t in (t0, t1)) > 1e-10
    circle = [{"xi": [math.cos(2 * math.pi * j / 32), math.sin(2 * math.pi * j / 32)], "value": math.cos(2 * math.pi * j / 32) ** 2 + math.sin(2 * math.pi * j / 32) ** 2} for j in range(32)]
    return {
        "fixture": "flat-unit-torus-constant-candidate", "input": scientific_input(spec),
        "candidate": {"lambda": lam, "value": c, "residualLinf": float(np.max(np.abs(residual))), "residualL2": float(np.linalg.norm(residual) / n), "accepted": bool(np.max(np.abs(residual)) <= 1e-10), "tolerance": 1e-10, "equation": "-Delta(u)+lambda*u-u^3=0"},
        "operator": {"expression": "-Delta+(lambda-3*candidateValue^2)", "potential": potential, "domain": "H^2(T^2) -> L^2(T^2)", "sourceMetric": "flat unit torus", "boundary": "closed; periodic coordinates", "matrixSymmetryResidual": float(abs(operator - operator.T).max()), "finiteSize": n * n, "continuumSelfAdjointness": "external analytic structure under real smooth constant potential", "compactResolvent": "external analytic structure on compact smooth closed torus; not a numerical or Lean proof"},
        "spectrum": {"potential": potential, "lowModes": modes[:16], "allFiniteEigenvalues": values.tolist(), "refinement": refinements, "finiteKernelDimension": int(np.sum(np.abs(values) <= 1e-10)), "finiteCokernelDimension": int(np.sum(np.abs(values) <= 1e-10)), "nearestZeroDistance": float(np.min(np.abs(values))), "selectedEigenvalue": eigenvalue, "selectedEigenmodeResidual": eigen_residual, "finiteApprox": True, "infiniteSpectrumCertified": False, "firstPositiveModeLabelCaveat": "refinement tracks (1,0); it need not be positive for other parameters"},
        "mesh": mesh, "topology": topology,
        "fidelity": {"sameFiniteCombinatorics": topology["finiteComplexEqual"], "scalarFieldMaxError": 0.0, "displayToSourceEdgeLengthRatioMin": min(ratios), "displayToSourceEdgeLengthRatioMax": max(ratios), "displayIsometry": False, "sourceAmbientDimension": 4, "displayDimension": 3, "lostDimensions": ["flat product metric of source R4 embedding"], "inverseStatus": "angular coordinates modulo Z; source flat metric not recovered by display Euclidean distances", "curvature": {"sourceFlatGaussianCurvature": 0.0, "displayCurvatureIsSourceCurvature": False}, "ricciFlow": {"applicableReference": "flat source metric is stationary", "executed": False, "dimensionLiftingClaimed": False}},
        "geometry": {"candidateGradientLinf": 0.0, "criticalSet": "entire constant field; no isolated Morse critical points", "isolatedSingularitiesCertified": False, "energyDensity": .5 * lam * c * c - .25 * c ** 4, "constantDirectionSecondVariation": potential, "nonlinearStabilityProved": False},
        "stress": {"lambdaSweep": parameter_stress, "nonconstantCandidatePerturbation": {"amplitude": .01, "mode": [1, 0], "residualLinf": float(np.max(np.abs(perturbed_residual))), "accepted": bool(np.max(np.abs(perturbed_residual)) <= 1e-10)}, "meshConvergenceMonotone": all(refinements[i + 1]["absoluteError"] < refinements[i]["absoluteError"] for i in range(len(refinements) - 1)), "counterexampleSearchExhaustive": False},
        "symmetry": {"group": "C2", "action": "x -> x+1/2 mod 1", "permutation": permutation, "commutatorLinf": commutator_norm, "candidateInvarianceLinf": float(np.max(np.abs(u[permutation] - u))), "evenSubspaceDimension": n * n // 2, "oddSubspaceDimension": n * n // 2, "equivariantKClassProved": False},
        "symbol": {"formula": "xi_x^2+xi_y^2", "order": 2, "samples": circle, "sampledMinimum": min(p["value"] for p in circle), "samplingIsEllipticityProof": False, "lowerOrderPotential": potential, "kClass": {"status": "STRUCTURAL METADATA", "bundle": "trivial complex line on T^2", "base": "T*(T^2)", "representative": "scalar principal symbol outside zero section", "visualizationIsKClass": False}},
        "index": {"analyticIndexReference": 0, "referenceReason": "self-adjoint elliptic realization on closed torus: kernel and adjoint kernel agree", "grade": "EXTERNAL ANALYTIC REFERENCE", "kernelDimension": None, "cokernelDimension": None, "invertible": None, "indexZeroImpliesInvertible": False, "formalized": False},
        "boundary": {"present": False, "condition": "none; periodic chart identification is not an exterior boundary condition", "obstruction": "NOT_APPLICABLE_CLOSED_MANIFOLD", "allBoundaryConditionsImpossible": False},
        "spectralFlow": {"family": "L(t)=L+tI on the same finite periodic grid", "parameterInterval": [t0, t1], "crossings": crossings, "spectralFlow": len(crossings) if endpoints_regular else None, "endpointsRegular": endpoints_regular, "selfAdjointFiniteFamily": True, "infiniteFredholmFamilyProved": False, "nonlinearSolutionContinuation": False},
        "formalCoverage": {"numericalResultIsFormalPass": False, "target": "lambda=1,c=1 imply lambda*c-c^3=0 and lambda-3*c^2=-2", "targetApplicable": lam == 1 and c == 1, "status": "NOT_VERIFIED_BY_NUMERICAL_ADAPTER", "advancedIndexTheoremFormalized": False},
    }


def validate_graph(bundle: dict[str, list[dict[str, Any]]], sid: str, revision: int) -> None:
    nodes = [node for group in bundle.values() for node in group]
    by_id = {node["id"]: node for node in nodes}
    if len(by_id) != len(nodes):
        raise ValueError("Duplicate Golden node IDs")
    by_revision = {node["revision"]: node for node in nodes}
    for node in nodes:
        if node.get("sessionId") != sid or node.get("sessionRevision") != revision or node.get("revision") != node["id"] + ":r" + str(revision):
            raise ValueError("Cross-session or cross-revision Golden node")
        for ref in node.get("upstreamRevisions", []):
            if ref not in by_revision:
                raise ValueError("Unresolved or cross-revision Golden upstream reference")
        for ref in node.get("evidenceRefs", []):
            if ref not in by_id or by_id[ref].get("type") != "EvidenceRecord":
                raise ValueError("Unresolved Golden evidence reference")
        if node.get("grade") in ("FORMAL PASS", "THEOREM-BACKED"):
            raise ValueError("Numerical graph cannot create formal evidence")


def typed_bundle(spec: dict[str, Any], snap: dict[str, Any], env: dict[str, Any]) -> tuple[dict[str, Any], list[EvidenceRecord]]:
    scientific_hash = sha256_json({"adapter": NAME, "version": VERSION, "input": scientific_input(spec)})
    prefix = "golden-" + scientific_hash[:12] + "-" + sha256_json(spec["sessionId"])[:8] + "-r" + str(spec["revision"]) + "-"
    groups: dict[str, list[dict[str, Any]]] = {}
    built: dict[str, dict[str, Any]] = {}
    def add(group: str, key: str, kind: str, stage: str, upstream: list[str], **fields: Any) -> dict[str, Any]:
        ident = prefix + key
        node = {"id": ident, "type": kind, "sessionId": spec["sessionId"], "sessionRevision": spec["revision"], "revision": ident + ":r" + str(spec["revision"]), "stage": stage, "upstreamRevisions": [built[k]["revision"] for k in upstream], "evidenceRefs": [prefix + "evidence-" + stage], "assumptions": ["Closed flat unit torus", "real constant candidate and potential", "finite periodic grid computations"], "provenance": {"adapter": NAME, "adapterVersion": VERSION, "scientificInputsHash": scientific_hash}, **fields}
        groups.setdefault(group, []).append(node)
        built[key] = node
        return node
    add("objects", "manifold", "ObjectSpec", "A", [], label="Flat unit torus T2", baseField="R", intrinsicDim=2, ambientDim=4, structures=["smooth", "compact", "closed", "flat Riemannian"], hash=sha256_json({"manifold": "(R/Z)^2", "metric": "dx2+dy2"}))
    add("objects", "candidate", "ObjectSpec", "A", ["manifold"], label="Constant candidate u*", baseField="R", intrinsicDim=2, ambientDim=4, structures=["scalar field"], hash=sha256_json(snap["candidate"]), sourceObjectRef=built["manifold"]["id"], data=snap["candidate"])
    add("functionSpaces", "spaces", "FunctionSpaceSpec", "A", ["manifold"], domain="H^2(T^2)", codomain="L^2(T^2)", realVariationSpace="H^1(T^2)")
    add("pdes", "pde", "PDESpec", "A", ["candidate", "spaces"], expression="-Delta(u)+lambda*u-u^3=0", parameters={"lambda": spec["lambda"]}, candidateRef=built["candidate"]["id"], residual=snap["candidate"], boundaryConditions={"exteriorBoundaryPresent": False, "kind": "periodic coordinate identification on the closed torus", "periods": [1, 1]}, initialConditions={"applicable": False, "reason": "stationary elliptic equation; no time evolution is specified"}, solverPlan={"mode": "prescribed-candidate verification; no nonlinear solution search", "spatialOperator": "five-point periodic finite differences", "spectrumMethod": "complete finite Fourier diagonalization", "topologyMethod": "GUDHI lower-star filtration of candidate values on periodic triangulation", "gridN": spec["gridN"], "refinements": spec["refinements"], "candidateResidualTolerance": 1e-10, "eigenmodeResidualTolerance": 1e-8, "precision": "binary64", "seed": spec["seed"]})
    add("operators", "linearization", "OperatorSpec", "A", ["pde", "spaces"], **snap["operator"], linearizedAt=built["candidate"]["id"])
    add("spectra", "spectrum", "SpectrumSpec", "A", ["linearization"], data=snap["spectrum"], operatorRef=built["linearization"]["id"])
    add("representations", "representation", "RepresentationSpec", "B", ["candidate", "spectrum"], sourceObjectRef=built["candidate"]["id"], method="embedding", displayDim=3, mapDefinition="((2+0.65cos(2pi*y))*cos(2pi*x),(2+0.65cos(2pi*y))*sin(2pi*x),0.65sin(2pi*y))", parameters={"majorRadius": 2, "minorRadius": .65}, sampling={"gridN": spec["gridN"], "periodic": True}, injectivityStatus="EMBEDDING_OF_ABSTRACT_TORUS_NOT_ISOMETRY", ambiguityRef=None, fidelityVector=snap["fidelity"], mesh=snap["mesh"], fieldChannels={"candidate": {"vertexField": "candidateValue", "sourceObjectRef": built["candidate"]["id"]}, "eigenmode": {"vertexField": "eigenmodeValue", "spectrumRef": built["spectrum"]["id"], "operatorRef": built["linearization"]["id"], "mode": [1, 0], "eigenvalue": snap["spectrum"]["selectedEigenvalue"], "eigenResidualLinf": snap["spectrum"]["selectedEigenmodeResidual"]}})
    add("geometries", "geometry", "GeometrySpec", "B", ["representation", "pde"], data=snap["geometry"], fidelity=snap["fidelity"])
    add("topologies", "topology", "TopologySpec", "B", ["representation"], data=snap["topology"])
    add("geometries", "stress", "StressTestSpec", "C", ["spectrum", "topology", "geometry"], data=snap["stress"])
    add("symmetries", "symmetry", "SymmetrySpec", "C", ["linearization", "stress"], data=snap["symmetry"], operatorRef=built["linearization"]["id"])
    add("claims", "stability-hypothesis", "ClaimSpec", "C", ["pde", "spectrum", "stress"], status="RESEARCH HYPOTHESIS", statement="Investigate nonlinear dynamical stability under a separately specified flow; stationary PDE alone does not define evolution", finiteNegativeDirection=snap["geometry"]["constantDirectionSecondVariation"] < 0, formalPass=False)
    add("claims", "formal-target", "FormalTargetSpec", "C", ["pde", "linearization"], **snap["formalCoverage"], formalPass=False)
    add("kclasses", "symbol", "PrincipalSymbolSpec", "D", ["linearization", "symmetry"], data=snap["symbol"], operatorRef=built["linearization"]["id"])
    add("kclasses", "index", "IndexSpec", "D", ["symbol", "spectrum"], **snap["index"], operatorRef=built["linearization"]["id"])
    add("kclasses", "boundary", "BoundarySpec", "D", ["index", "manifold"], **snap["boundary"])
    add("spectra", "flow", "SpectralFlowSpec", "D", ["linearization", "boundary"], data=snap["spectralFlow"], operatorRef=built["linearization"]["id"])
    evidence_models = []
    stages = {"A": ["spectrum", "pde"], "B": ["topology", "geometry"], "C": ["stress", "symmetry", "formal-target"], "D": ["symbol", "index", "boundary", "flow"]}
    for stage, upstream in stages.items():
        claim = add("claims", "claim-" + stage, "ClaimSpec", stage, upstream, status="NUMERICAL INDICATOR", statement="Stage " + stage + " bounded connected computation", formalPass=False)
        model = EvidenceRecord(id=prefix + "evidence-" + stage, grade=GRADE, claimRef=claim["id"], method="periodic-finite-difference/Fourier/GUDHI-connected-fixture", inputsHash=sha256_json({"adapter": NAME, "inputSpec": spec}), environmentHash=sha256_json(env), residuals={"candidateLinf": snap["candidate"]["residualLinf"], "selectedEigenmode": snap["spectrum"]["selectedEigenmodeResidual"]}, assumptions=["finite computations only", "external analytic references are not formal verification"], generatedAt=utc_now(), adapterVersion=VERSION, upstreamRevisions=[built[k]["revision"] for k in upstream], scope="Connected Golden stage " + stage + "; numerical support, no nonlinear stability theorem, no infinite index proof")
        evidence = add("evidence", "evidence-" + stage, "EvidenceRecord", stage, upstream, **{k: v for k, v in model.model_dump().items() if k not in ("id", "upstreamRevisions", "assumptions")})
        evidence["evidenceRefs"] = []
        evidence_models.append(model)
    validate_graph(groups, spec["sessionId"], spec["revision"])
    return groups, evidence_models


class GoldenEllipticAdapter(Adapter):
    name = NAME
    version = VERSION

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        from app.golden import make_replay_record
        spec = normalize_spec(input_spec)
        env = environment_fingerprint(environment)
        snap = numerical_snapshot(spec)
        bundle, evidence = typed_bundle(spec, snap, env)
        nodes = [{k: node[k] for k in ("id", "type", "stage", "sessionId", "sessionRevision", "revision", "upstreamRevisions", "evidenceRefs")} for group in bundle.values() for node in group]
        checks = [
            {"name": "candidate residual", "pass": snap["candidate"]["accepted"]},
            {"name": "same-L Fourier eigenmode residual", "pass": snap["spectrum"]["selectedEigenmodeResidual"] < 1e-8},
            {"name": "grid refinement convergence", "pass": snap["stress"]["meshConvergenceMonotone"]},
            {"name": "computed finite torus homology", "pass": snap["topology"]["sourceBetti"] == snap["topology"]["displayBetti"] == [1, 2, 1]},
            {"name": "C2 operator commutation", "pass": snap["symmetry"]["commutatorLinf"] < 1e-10},
            {"name": "closed boundary semantics and index guard", "pass": snap["boundary"]["present"] is False and snap["index"]["invertible"] is None},
        ]
        numerical_hash = sha256_json(snap)
        golden = {"type": "GoldenSessionSpec", "id": "golden-run-" + sha256_json(spec)[:20], "sessionId": spec["sessionId"], "sessionRevision": spec["revision"], "inputSpec": spec, "typedBundle": bundle, "nodes": nodes, "numericalSnapshot": snap, "numericalHash": numerical_hash, "gate": {"pass": all(x["pass"] for x in checks), "scope": "A-B-C-D numerical integration only; separate formal proof and browser/export/replay release gates required", "checks": checks, "formalPass": False, "releaseFreezeAuthorized": False}, "executableReplayRecord": make_replay_record(spec, environment, env, snap, nodes)}
        return AdapterResult(adapter=NAME, adapterVersion=VERSION, status="completed", outputRepresentations=[golden], evidenceRecords=evidence, diagnostics=[Diagnostic(level="warning", code="NUMERICAL_NOT_FORMAL", message="This connected fixture does not prove continuum invertibility, nonlinear stability, or an index theorem. Lean local algebra is a separate receipt.")], residuals={"candidateLinf": snap["candidate"]["residualLinf"], "eigenmodeLinf": snap["spectrum"]["selectedEigenmodeResidual"]}, provenanceEdges=[{"from": ref, "to": node["revision"], "relation": "derived-from"} for node in nodes for ref in node["upstreamRevisions"]], reproducibilityHash=numerical_hash, environment=env)
