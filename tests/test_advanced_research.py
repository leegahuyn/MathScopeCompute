import math

from app.adapters.advanced_research import (
    EquivariantKReferenceAdapter,
    GaloisReferenceAdapter,
    PerturbationReferenceAdapter,
    RicciFlowReferenceAdapter,
    SpectralFlowReferenceAdapter,
    ZetaResolventReferenceAdapter,
)


def _by_type(result):
    return {row["type"]: row for row in result.outputRepresentations}


def test_galois_reference_requires_explicit_structure_not_shape():
    result = GaloisReferenceAdapter().run({"preset": "quadratic_sqrt2"}, {"test": True})
    rep = _by_type(result)
    assert rep["GaloisLabSpec"]["galoisGroup"] == "C2"
    assert rep["GaloisLabSpec"]["correspondenceStatus"] == "EXPLICIT"
    assert rep["GaloisLabSpec"]["shapeResemblanceCreatesGaloisRelation"] is False
    assert result.evidenceRecords[0].grade == "NUMERICAL INDICATOR"


def test_custom_polynomial_does_not_guess_a_galois_group():
    result = GaloisReferenceAdapter().run(
        {"preset": "custom", "coefficients": [1, 0, -2, 1]},
        {"test": True},
    )
    rep = _by_type(result)
    assert rep["GaloisLabSpec"]["galoisGroup"] == "UNKNOWN"
    assert rep["GaloisLabSpec"]["correspondenceStatus"] == "NOT ESTABLISHED"


def test_riemann_and_spectral_zeta_remain_distinct():
    result = ZetaResolventReferenceAdapter().run(
        {"sReal": 2.0, "terms": 4000, "spectralEigenvalues": [1, 4, 9, 16, 25, 36]},
        {"test": True},
    )
    rep = _by_type(result)
    assert rep["RiemannZetaSpec"]["id"] != rep["SpectralZetaSpec"]["id"]
    assert rep["SpectralZetaSpec"]["exactInfiniteSpectrum"] is False
    assert rep["ZetaCorrespondenceSpec"]["spectralIdentityEstablished"] is False
    assert rep["ZetaCorrespondenceSpec"]["riemannZetaEqualsSpectralZeta"] is False


def test_spectral_flow_reference_counts_signed_crossings():
    result = SpectralFlowReferenceAdapter().run({}, {"test": True})
    rep = _by_type(result)["SpectralFlowSpec"]
    assert rep["positiveCrossings"] == 4
    assert rep["negativeCrossings"] == 1
    assert rep["spectralFlow"] == 3
    assert rep["selfAdjoint"] is True
    assert rep["fredholmCondition"] is True


def test_spectral_flow_refuses_missing_preconditions():
    result = SpectralFlowReferenceAdapter().run({"selfAdjoint": False}, {"test": True})
    rep = _by_type(result)["SpectralFlowSpec"]
    assert rep["spectralFlow"] is None
    assert rep["status"] == "INVALID PRECONDITIONS"


def test_equivariant_k_requires_operator_commutation():
    good = _by_type(EquivariantKReferenceAdapter().run({"preset": "c2_commuting"}, {"test": True}))
    bad = _by_type(EquivariantKReferenceAdapter().run({"preset": "c2_noncommuting"}, {"test": True}))
    assert good["EquivariantKTheorySpec"]["equivariantOperator"] is True
    assert good["EquivariantKTheorySpec"]["displayIsEquivariantKClass"] is False
    assert good["KHomologySpec"]["coverage"] == "PARTIAL / EXTERNAL THEOREM"
    assert bad["EquivariantKTheorySpec"]["equivariantOperator"] is False
    assert bad["EquivariantKTheorySpec"]["equivariantKClass"] is None


def test_perturbation_reference_does_not_claim_infinite_index_stability():
    result = PerturbationReferenceAdapter().run({}, {"test": True})
    rep = _by_type(result)["PerturbationSpec"]
    assert rep["finiteSquareFredholmIndex"] == [0, 0, 0]
    assert rep["infiniteFredholmIndexStability"] == "THEOREM MAPPING REQUIRED"


def test_round_s2_ricci_reference_shrinks_without_dimension_lifting_claim():
    result = RicciFlowReferenceAdapter().run({"preset": "round_s2", "tEnd": 0.4}, {"test": True})
    rep = _by_type(result)["RicciFlowSpec"]
    assert math.isclose(rep["metricScale"][-1], 0.2, abs_tol=1e-12)
    assert rep["scalarCurvature"][-1] > rep["scalarCurvature"][0]
    assert rep["surgeryEvents"] == []
    assert rep["surgeryUsedAsDimensionLiftingJustification"] is False
