import math
import pytest

from app.adapters.index_elliptic import EllipticIndexReferenceAdapter


def _by_type(result):
    return {row["type"]: row for row in result.outputRepresentations}


def test_closed_laplacian_is_elliptic_but_index_zero_not_invertible():
    result = EllipticIndexReferenceAdapter().run(
        {
            "model": "closed_scalar_laplacian",
            "analysisMode": "theorem",
            "manifoldDimension": 2,
            "lambda": 0.0,
            "boundary": {"present": False, "condition": "none"},
        },
        {"test": True},
    )
    rep = _by_type(result)
    assert rep["EllipticityResult"]["status"] == "THEOREM-BACKED ELLIPTIC"
    assert rep["PrincipalSymbolSpec"]["characteristicDirectionFound"] is False
    assert math.isclose(rep["PrincipalSymbolSpec"]["smallestSingularValueSampleMin"], 1.0, rel_tol=0, abs_tol=1e-12)
    assert rep["KTheorySpec"]["displayWarning"] == "DISPLAY IS NOT THE K-CLASS ITSELF"
    assert rep["KTheorySpec"]["visualizationIsKClass"] is False
    assert rep["IndexSpec"]["analyticIndex"] == 0
    assert rep["IndexSpec"]["topologicalIndex"] == 0
    assert rep["IndexSpec"]["kernelDimension"] == 1
    assert rep["IndexSpec"]["cokernelDimension"] == 1
    assert rep["IndexSpec"]["invertible"] is False
    assert rep["IndexSpec"]["indexZeroImpliesInvertible"] is False
    assert result.evidenceRecords[0].grade == "NUMERICAL INDICATOR"


def test_hyperbolic_quadratic_symbol_fails_ellipticity():
    result = EllipticIndexReferenceAdapter().run(
        {
            "model": "hyperbolic_counterexample",
            "analysisMode": "symbolic",
            "manifoldDimension": 2,
        },
        {"test": True},
    )
    rep = _by_type(result)
    assert rep["EllipticityResult"]["status"] == "FAIL"
    assert rep["PrincipalSymbolSpec"]["characteristicDirectionFound"] is True
    assert rep["KTheorySpec"]["symbolClassRef"] is None


def test_sampled_custom_symbol_never_becomes_theorem_by_sampling():
    result = EllipticIndexReferenceAdapter().run(
        {
            "model": "custom_quadratic_symbol",
            "analysisMode": "sampled",
            "manifoldDimension": 2,
            "quadraticForm": [[2.0, 0.1], [0.1, 1.0]],
            "samples": 64,
        },
        {"test": True},
    )
    rep = _by_type(result)
    assert rep["EllipticityResult"]["status"] == "NUMERICALLY CONSISTENT"
    assert rep["EllipticityResult"]["incompleteSamplingWarning"] is True
    assert result.evidenceRecords[0].grade == "NUMERICAL INDICATOR"


def test_nonzero_boundary_obstruction_fixture_never_says_all_bc_impossible():
    result = EllipticIndexReferenceAdapter().run(
        {
            "model": "closed_scalar_laplacian",
            "analysisMode": "theorem",
            "manifoldDimension": 2,
            "boundary": {"present": True, "condition": "synthetic_nonzero_obstruction"},
        },
        {"test": True},
    )
    rep = _by_type(result)
    b = rep["BoundaryAnalysisSpec"]
    assert "NONZERO" in b["atiyahBottObstruction"]
    assert b["localEllipticBCEligibility"] == "OBSTRUCTED"
    assert "POSSIBLE" in b["apsOrGlobalAlternative"]
    assert b["allBoundaryConditionsImpossible"] is False


def test_nonlinear_bridge_explicitly_passes_through_linearization():
    result = EllipticIndexReferenceAdapter().run(
        {
            "model": "nonlinear_elliptic_linearization",
            "analysisMode": "theorem",
            "manifoldDimension": 2,
            "lambda": 0.0,
            "candidate": "u*=0",
            "boundary": {"present": False, "condition": "none"},
        },
        {"test": True},
    )
    rep = _by_type(result)
    bridge = rep["NonlinearIndexBridgeSpec"]
    assert "DF" in bridge["linearization"]
    assert bridge["principalSymbolRef"] == rep["PrincipalSymbolSpec"]["id"]
    assert bridge["globalNonlinearSolvabilityStatus"] == "NOT ESTABLISHED"
    assert bridge["globalNonlinearStabilityStatus"] == "NOT ESTABLISHED"


@pytest.mark.parametrize("candidate", ["u*=1", "arbitrary field u*", {"values": [1, 2]}])
def test_nonzero_or_unevaluated_candidate_does_not_inherit_laplace_kernel(candidate):
    result = EllipticIndexReferenceAdapter().run(
        {"model": "nonlinear_elliptic_linearization", "lambda": 0, "candidate": candidate}, {})
    rep = _by_type(result)
    assert rep["IndexSpec"]["kernelDimension"] is None
    assert rep["IndexSpec"]["cokernelDimension"] is None
    assert rep["IndexSpec"]["invertible"] is None
    assert rep["NonlinearIndexBridgeSpec"]["bifurcationWarning"] is None
    assert rep["NonlinearIndexBridgeSpec"]["candidateResidualStatus"] == "NOT EVALUATED BY STRUCTURAL ADAPTER"
    assert "- 3(u*)^2" in rep["DifferentialOperatorSpec"]["lowerOrderTerm"]


def test_small_positive_definite_symbol_is_unresolved_not_a_false_counterexample():
    result = EllipticIndexReferenceAdapter().run(
        {"model": "custom_quadratic_symbol", "quadraticForm": [[1, 0], [0, 1e-12]]}, {})
    rep = _by_type(result)
    assert rep["EllipticityResult"]["status"] == "UNRESOLVED NEAR TOLERANCE"
    assert rep["EllipticityResult"]["characteristicDirectionFound"] is False
    assert rep["PrincipalSymbolSpec"]["characteristicDirections"] == []
    assert rep["KTheorySpec"]["symbolClassRef"] is None


def test_small_nonzero_potential_does_not_inherit_exact_laplace_kernel():
    result = EllipticIndexReferenceAdapter().run(
        {"model": "nonlinear_elliptic_linearization", "lambda": 1e-13, "candidate": "u*=0"}, {})
    assert _by_type(result)["IndexSpec"]["kernelDimension"] is None


@pytest.mark.parametrize("bad", [-1, float("nan"), float("inf")])
def test_invalid_symbol_tolerance_is_rejected(bad):
    with pytest.raises(ValueError):
        EllipticIndexReferenceAdapter().run({"tolerance": bad}, {})
