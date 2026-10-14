"""Pinned initial-state and full Cartesian residual audit, standard-library only.

The source snapshot is streamed, never materialized as four million Python
objects. A formal Cartesian jet identity is checked independently, and is
explicitly distinct from recomputing those jets from the actual source bodies.
No historical PASS bit supplies a class, domain, divergence or PDE proof.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import platform
from fractions import Fraction
from pathlib import Path
from datetime import datetime, timezone

from source_dag import stream_snapshot, open_header, pinned_json, verify_capture

BASE = "research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291/"
PINS = {
    "mean": "22c878e7ace454c61f00c9ee4952738f7f9fa7b1c269eca538ca224dd8fcb96b",
    "angular": "ba60de00a1e41f9c448da3aabcbf791bc4649b5fcfd99cff7a71865463db8b14",
    "index": "ba251f2f3401d2d81467a8ac3c5ceb0da7c6ddc3899aab6d9d580755ff0fd1f3",
    "parent_nodes": "7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f",
}
SEQUENCE = ["primary-current-pressure", "temporal-8.20", "post-temporal-8.12", "five-moments-8.25-on-new-P-J", "post-moment-8.12"]


def require(value, message):
    if not value:
        raise ValueError(message)


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()


def poly_atom(name):
    return {(name,): Fraction(1)}


def poly_add(*items):
    result = {}
    for item in items:
        for monomial, coefficient in item.items():
            result[monomial] = result.get(monomial, Fraction(0)) + coefficient
    return {key: value for key, value in result.items() if value}


def poly_scale(item, scalar):
    return {key: value * scalar for key, value in item.items() if value * scalar}


def poly_multiply(a, b):
    result = {}
    for ma, ca in a.items():
        for mb, cb in b.items():
            key = tuple(sorted(ma + mb))
            result[key] = result.get(key, Fraction(0)) + ca * cb
    return {key: value for key, value in result.items() if value}


def polynomial_record(value):
    return [{"monomial": list(key), "coefficient": str(coefficient)} for key, coefficient in sorted(value.items())]


def cartesian_update_identity():
    """Expand the three physical Cartesian components with independent jets.

    R_i(u,p)=dt(u_i)-sum_j d_jj(u_i)+d_i(p)+sum_j u_j*d_j(u_i).
    This uses advection and does not assume divergence is zero. Replacing
    advection by div(du tensor du) separately requires div(du)=0.
    """
    u = [poly_atom(f"u[{i}]") for i in range(3)]
    du = [poly_atom(f"du[{i}]") for i in range(3)]
    after = [poly_add(u[i], du[i]) for i in range(3)]
    rows = []
    for i in range(3):
        linear_u = poly_add(poly_atom(f"dt(u[{i}])"), poly_atom(f"d{i}(p)"), *[poly_scale(poly_atom(f"d{j}{j}(u[{i}])"), -1) for j in range(3)])
        linear_du = poly_add(poly_atom(f"dt(du[{i}])"), poly_atom(f"d{i}(dp)"), *[poly_scale(poly_atom(f"d{j}{j}(du[{i}])"), -1) for j in range(3)])
        old = poly_add(linear_u, *[poly_multiply(u[j], poly_atom(f"d{j}(u[{i}])")) for j in range(3)])
        updated = poly_add(linear_u, linear_du, *[poly_multiply(after[j], poly_add(poly_atom(f"d{j}(u[{i}])"), poly_atom(f"d{j}(du[{i}])"))) for j in range(3)])
        cross_u_du = poly_add(*[poly_multiply(u[j], poly_atom(f"d{j}(du[{i}])")) for j in range(3)])
        cross_du_u = poly_add(*[poly_multiply(du[j], poly_atom(f"d{j}(u[{i}])")) for j in range(3)])
        quadratic = poly_add(*[poly_multiply(du[j], poly_atom(f"d{j}(du[{i}])")) for j in range(3)])
        decomposed = poly_add(old, linear_du, cross_u_du, cross_du_u, quadratic)
        difference = poly_add(updated, poly_scale(decomposed, -1))
        negative_controls = {
            "omit_quadratic_self_interaction": bool(quadratic),
            "omit_old_velocity_times_increment_gradient": bool(cross_u_du),
            "omit_increment_times_old_velocity_gradient": bool(cross_du_u),
            "omit_latest_pressure_increment": bool(poly_atom(f"d{i}(dp)")),
        }
        require(not difference and all(negative_controls.values()), "An independently expanded Cartesian identity or its missing-term controls failed.")
        rows.append({"component": i, "difference": polynomial_record(difference), "quadratic": polynomial_record(quadratic), "termsAfterExpansion": len(updated), "negativeControlsDetectMissingTerms": negative_controls})
    return {"arithmetic": "Exact Fraction coefficients of commutative physical Cartesian jet monomials; three components and all three spatial directions.", "rows": rows, "formalIdentityVerified": True,
            "actualSourceDerivativeBodiesIndependentlyVerified": False, "finiteFixtureOrFormalIdentityUsedAsSourceProof": False,
            "advectiveToConservativeConversionRequiresExactDivergence": True}


def class_obligations(mean, angular):
    """Every original finite-state condition is a separate open obligation."""
    post = mean["stages"]["moments"]
    return [
        {"id": "9.8-wave-B0", "required": "Every grouped source nonzero harmonic in W^(7/10), all fixed derivative orders on one original q<q_big domain.", "sourceRoots": angular["global"]["assembledResidual"], "proved": False, "minimalLemma": "Actual primary complete-curl W^(1/2) estimates, primary linear residual W^(1-3*kappa_s), nonlinear and mean-wave products, full nonzero angular modes, every fixed-order source constant and tail."},
        {"id": "9.8-mean-C0", "required": "Exact Etheta and Ez in M^(6/5).", "sourceRoots": [post["mean"]["Etheta"], post["mean"]["Ez"]], "proved": False, "minimalLemma": "Actual leading covariance/partition cancellation (9.11); Haar residual M^1.49; temporal zero-mean source M^(1-kappa_s), full four-extra-derivative Fourier inverse and actual cutoff tails."},
        {"id": "9.8-defects-C0", "required": "Actual P,Jtheta,Jz in S^(6/5).", "sourceRoots": [post["mean"][k] for k in ("P", "Jtheta", "Jz")], "proved": False, "minimalLemma": "Fresh temporal defects S^(1-kappa_s); fixed lambda/a mean matrix inverse; full (8.26)/(8.27) remainder class and full radial/Haar integration constants."},
        {"id": "9.9-total-wave", "required": "Complete wave w in W^(1/2).", "sourceRoots": angular["global"]["velocity"], "proved": False, "minimalLemma": "Uniform actual full-potential curl primary bound, source-positive covariance weights, full support and locally finite cover; total velocity roots cannot alone certify wave class."},
        {"id": "9.9-curl-remainder", "required": "w-w0_tan in W^(17/25)=W^0.68.", "sourceRoots": angular["global"]["velocity"], "proved": False, "minimalLemma": "Original rm and cutoff/connection terms have W^(1-kappa_s), and mean interactions preserve the required grouped harmonic bounds."},
        {"id": "9.9-tangential-and-pressure", "required": "v,gamma,p_m in M^(9/10).", "sourceRoots": [post["velocity"]["v"], post["velocity"]["gamma"], post["pressure"]["value"]], "proved": False, "minimalLemma": "Actual full source input seminorms for temporal, T1, five-moment and T0 operators; support and every required slow/auxiliary derivative."},
        {"id": "9.9-radial", "required": "beta in M^(19/10).", "sourceRoots": [post["velocity"]["beta"]], "proved": False, "minimalLemma": "Actual azimuthal-potential realization gives the epsilon radial gain, including the differentiated endpoint/cutoff terms."},
        {"id": "9.10-angular-moment", "required": "Integral_0^infinity R^2 <v>Y dR=0, every (Z,T).", "sourceRoots": [post["velocity"]["v"]], "proved": False, "minimalLemma": "Independent full Fourier zero mode, actual Haar translation/Fubini justification and supported five-bump zero row; stored conservation=0 is a source declaration, not a new integral proof."},
        {"id": "9.10-axial-moment", "required": "Integral_0^infinity R <gamma>Y dR=0, every (Z,T).", "sourceRoots": [post["velocity"]["gamma"]], "proved": False, "minimalLemma": "Full T1/A1 axial realization and zero weighted Haar integral, including the actual temporal cutoff remainder; exact five-bump axial zero row."},
        {"id": "9.4-common-domain-support-divergence", "required": "Fixed label phases, finite grouped harmonics, supported potentials, smooth zero extensions, exact divergence and one original common domain.", "sourceRoots": [angular["global"]["direct"]["divergence"]], "proved": False, "minimalLemma": "Independent source-body closure, full potential curls, chart covariance, source disjointness/flat joins and domain positivity/endpoint hypotheses."},
    ]


def run(repo, output):
    started = datetime.now(timezone.utc).isoformat()
    capture = verify_capture(repo)
    mean = pinned_json(repo / (BASE + "initialized-mean-construction.json"), PINS["mean"])
    angular = pinned_json(repo / (BASE + "initialized-angular-construction.json"), PINS["angular"])
    index = pinned_json(repo / (BASE + "checkpoint-index.json"), PINS["index"])
    require(mean["source"]["exactSequence"] == SEQUENCE, "Original Prop9.5 update order changed.")
    require(mean["graph"]["nodeCount"] == 3615866 and angular["graph"]["nodeCount"] == 3825351, "Initial source prefixes changed.")
    require(index["checkpoints"][0]["nodeCount"] == 3892594 and index["checkpoints"][0]["nodesSHA256"] == PINS["parent_nodes"], "Full saved parent identity changed.")
    require(mean["nonlinear"]["remaindersDeclaredZero"] is False, "Original nonlinear remainder was removed.")
    require(mean["scope"]["initializedJ0"] is False and angular["scope"]["initializedJ0"] is False, "The original open j0 outcome was rewritten.")
    header = open_header(repo)
    post, previous, full = mean["stages"]["moments"], mean["stages"]["temporal"], angular["global"]
    root_groups = {
        "post_temporal_mean": list(previous["velocity"].values()) + [previous["pressure"]["value"], previous["pressure"]["cutoffRemainder"]],
        "post_moment_mean": list(post["velocity"].values()) + [post["pressure"]["value"], post["pressure"]["cutoffRemainder"]],
        "post_moment_mean_residuals_and_defects": [post["mean"][key] for key in ("Etheta", "Ez", "P", "Jtheta", "Jz")],
        "fresh_post_temporal_moment_targets": list(mean["bumps"]["actualInputDefects"].values()),
        "original_full_stress": list(post["mean"]["fullOriginalStress"]),
        "full_velocity_and_pressure": full["velocity"] + [full["pressure"]],
        "full_direct_advective": full["direct"]["advectiveResidual"], "full_direct_conservative": full["direct"]["conservativeResidual"],
        "full_direct_divergence": [full["direct"]["divergence"]], "full_assembled": full["assembledResidual"],
        "original_flat_background": [x["real"] for row in full["oldFlatResidual"]["local"] for x in row["value"]],
        "actual_nonzero_defect_remainders": list(mean["nonlinear"]["remainderDefects"].values()),
    }
    requested = {node for roots in root_groups.values() for node in roots}
    requested.update(v for v in full["geometry"].values() if type(v) is int)
    requested.update(x for v in full["geometry"].values() if isinstance(v, list) for x in v if type(x) is int)
    selected, count = {}, 0
    for node_id, node in stream_snapshot(repo):
        count += 1
        if node_id in requested:
            selected[node_id] = node
    require(count == 3892594 and requested <= selected.keys(), "Full source stream or a mandatory actual root is missing.")
    require(isinstance(angular.get("templates"), list) and sorted(row["key"] for row in angular["templates"]) == sorted(f"{level}:{sign}" for level in range(5) for sign in (-1, 1)), "An original fixed-palette branch or sign was lost or duplicated.")
    source = {"paperSHA256": mean["source"]["paperSHA256"], "parameterExpressionSHA256": mean["source"]["parameterExpressionSHA256"], "meanCertificateSHA256": PINS["mean"], "angularCertificateSHA256": PINS["angular"], "fullParentNodesSHA256": PINS["parent_nodes"], "fullParentNodeCount": count, "retainedNodeCount": len(selected), "all155OriginalDependenciesUnchanged": True, "captureVerification": capture if isinstance(capture, dict) else {"executed": True}, "operatorDefinitionsSHA256": digest(header["definitions"])}
    bindings = {key: [{"sourceNode": node, "node": selected[node], "nodeSHA256": digest(selected[node])} for node in roots] for key, roots in root_groups.items()}
    initial = {"schema": "MathScope.N6.InitialStateSourceAudit/1", "source": source, "orderedOriginalUpdates": SEQUENCE,
               "actualVelocityAndLatestPressureRoots": bindings, "requirements": class_obligations(mean, angular),
               "minimalUnprovedClassLemmas": ["Actual primary/covariance/complete-curl all-order input seminorm binding", "Actual (9.11) leading partition/covariance cancellation and derivative losses", "Actual temporal Fourier + radial pressure/potential/moment operator input classes", "Actual nonlinear defect integration + cutoff/flat tails on one original domain"],
               "sourceSupport": {"innerRadius": full["geometry"]["innerRadius"], "outerRadius": full["geometry"]["outerRadius"], "commonIndex": full["geometry"]["commonIndex"], "allTenPaletteBranchesDeclared": isinstance(angular.get("templates"), list) and len(angular["templates"]) == 10, "sourceSupportAndClassIndependentlyProved": False},
               "mathematicalStatus": "INITIAL_J0_SOURCE_BINDINGS_VERIFIED_9_8_TO_9_10_OPEN", "originalN601Complete": False, "originalProgressChanged": False}
    identity = cartesian_update_identity()
    residual = {"schema": "MathScope.N6.FullCartesianResidualSourceAudit/1", "source": source, "sourceBindings": bindings,
                "actualFieldDefinition": {"components": "u_phys=Q^(-A)*(u_r*cos(theta)-u_theta*sin(theta),u_r*sin(theta)+u_theta*cos(theta),u_z)", "pressure": "p_phys=Q^(-2A)*p_star", "completeCurrentCylindricalVelocity": full["velocity"], "completeCurrentPressure": full["pressure"], "updatedMeanVelocity": post["velocity"], "updatedMeanPressure": post["pressure"]["value"], "previousMeanVelocity": previous["velocity"], "previousMeanPressure": previous["pressure"]["value"], "increment": "Same complete wave/pressure harmonics retained; du is the rotated Q-scaled difference of the actual post-moment and post-temporal mean components; dp is the latest full mean pressure difference."},
                "cartesianUpdateIdentity": identity, "independentCartesianResidualTemplate": {"components": 3, "spatialDirections": 3, "formula": "R_i=dt(u_i)-sum_j d_jj(u_i)+d_i(p)+sum_j u_j*d_j(u_i)", "sourceMeanInsteadOfFullFieldUsed": False, "allPressureAndQuadraticCrossTermsRetained": True},
                "physicalDerivativeGuards": {"geometry": full["geometry"], "Dr": "partial_R+radialFast*(vr0*partial_Y0+vr1*partial_Y1)", "Dz": "epsilon*partial_Z", "time": "-epsilon*partial_T+ci*(vt0*partial_Y0+vt1*partial_Y1)", "cartesianFrameConnectionTermsRequired": True, "fixedQChartAndLabelsMustRemainFrozen": True, "actualDerivativeBodiesIndependentlyRecomputed": False},
                "storedDirectVersusAssembledRootComparisons": [{"component": i, "direct": full["direct"]["conservativeResidual"][i], "assembled": full["assembledResidual"][i], "sameExactNode": full["direct"]["conservativeResidual"][i] == full["assembledResidual"][i], "algebraicEqualityIndependentlyVerified": False} for i in range(3)],
                "stops": [{"code": "ACTUAL_FULL_CARTESIAN_SOURCE_JETS_NOT_RECOMPUTED", "sourceNodes": full["velocity"] + [full["pressure"]], "reason": "The independent formal three-dimensional update identity is exact, but natural/quadratic/monotone/indexed/Volterra source derivatives and physical chart captures remain separate unproved obligations."}, {"code": "WHOLE_SOURCE_NUMERICAL_ENCLOSURE_OPEN", "reason": "No actual whole-domain PDE residual or pressure enclosure/tail error budget has been computed."}],
                "oldFlatResidual": full["oldFlatResidual"], "mathematicalStatus": "FULL_FIELD_ROOTS_BOUND_FORMAL_CARTESIAN_IDENTITY_MATCH_ACTUAL_SOURCE_PDE_OPEN", "originalN602Complete": False, "sourceAllOrderClassesCertified": False, "wholePhysicalCartesianPDEVerified": False, "originalProgressChanged": False}
    output.mkdir(parents=True, exist_ok=True)
    artifacts = []
    for filename, value in (("initial-state-audit.json", initial), ("full-residual-audit.json", residual)):
        raw = (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()
        require(len(raw) <= 2 * 1024 * 1024, "Source audit unexpectedly exceeded its compact output budget.")
        with (output / filename).open("xb") as file:
            file.write(raw)
        artifacts.append({"path": filename, "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()})
    execution = {"schema": "MathScope.N6.InitialResidualExecution/1", "startedAt": started, "finishedAt": datetime.now(timezone.utc).isoformat(), "pythonVersion": platform.python_version(), "scriptSHA256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), "sourceSnapshotStreamVerified": True, "artifacts": artifacts, "auditExecutionReturned": True, "originalN601Complete": False, "originalN602Complete": False, "countsChanged": False}
    with (output / "initial-residual-execution.json").open("x", encoding="utf-8") as file:
        json.dump(execution, file, ensure_ascii=False, indent=2)
        file.write("\n")
    print(json.dumps({"status": residual["mathematicalStatus"], "fullSourceNodeCount": count, "retainedNodes": len(selected), "formalCartesianComponentsVerified": 3, "openInitialStateRequirements": len(initial["requirements"]), "originalN601Complete": False, "originalN602Complete": False, "artifacts": artifacts}, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[3])
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    run(args.repo.resolve(), args.output.resolve())
