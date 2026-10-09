import math
import pytest
from fastapi.testclient import TestClient

from app.adapters.zeta_complex import ComplexZetaSurfaceAdapter
from app.main import app


POLE_ONLY_GRID = {
    "realMin": 0.99, "realMax": 1.01, "imagMin": -0.01, "imagMax": 0.01,
    "realSamples": 4, "imagSamples": 4, "poleExclusionRadius": 0.4,
}


def test_fully_pole_masked_grid_has_no_success_evidence():
    with pytest.raises(ValueError, match="no valid sampled points"):
        spec(POLE_ONLY_GRID)


def test_fully_pole_masked_grid_is_an_api_error():
    response = TestClient(app).post("/v1/run", json={
        "adapter": ComplexZetaSurfaceAdapter.name, "inputSpec": POLE_ONLY_GRID,
    })
    assert response.status_code == 422
    assert "no valid sampled points" in response.json()["detail"]
    assert "evidenceRecords" not in response.json()


@pytest.mark.parametrize("nonfinite", [False, True])
def test_all_failed_evaluations_have_no_success_evidence(monkeypatch, nonfinite):
    from app.adapters.zeta_complex import mp

    ctx = mp.clone()

    def failing_zeta(value):
        if nonfinite:
            return ctx.mpf("inf")
        raise ArithmeticError("simulated evaluation failure")

    monkeypatch.setattr(ctx, "zeta", failing_zeta)
    monkeypatch.setattr(mp, "clone", lambda: ctx)
    with pytest.raises(ValueError, match="no valid sampled points"):
        spec({"realMin": 2, "realMax": 2.1, "imagMin": 0, "imagMax": 0.1,
              "realSamples": 4, "imagSamples": 4})

def spec(req=None):
    r=ComplexZetaSurfaceAdapter().run(req or {"realMin":0.25,"realMax":1.25,"imagMin":0.0,"imagMax":16.0,"realSamples":7,"imagSamples":7,"precisionDps":25}, {"test":True})
    return r, r.outputRepresentations[0]

def test_complex_zeta_returns_distinct_typed_surface():
    r,s=spec()
    assert s["type"]=="ComplexZetaSurfaceSpec"
    assert s["representation"]["displayDim"]==3
    assert s["representation"]["intrinsicComplexGeometryPreserved"] is False
    assert s["representation"]["phaseIsSpatialDimension"] is False
    assert s["riemannZetaEqualsSpectralZeta"] is False
    assert s["zeroCertification"]=="NONE"
    assert r.evidenceRecords[0].grade=="NUMERICAL INDICATOR"
    assert r.errorBounds is None
    assert s["precisionDiscrepancyIsCertifiedBound"] is False
    assert r.environment["mpmath"]

def test_pole_is_masked():
    r,s=spec({"realMin":0.5,"realMax":1.5,"imagMin":-0.4,"imagMax":0.4,"realSamples":5,"imagSamples":5,"precisionDps":25,"poleExclusionRadius":0.075})
    assert any(v["status"]=="POLE_MASKED" for v in s["vertices"])
    assert s["maskedCount"] >= 1


def test_partial_evaluation_failures_are_separate_from_the_pole_mask(monkeypatch):
    from app.adapters.zeta_complex import mp

    ctx = mp.clone()
    original_zeta = ctx.zeta

    def partially_failing_zeta(value):
        if ctx.re(value) >= 1.25:
            raise ArithmeticError("simulated evaluation failure")
        return original_zeta(value)

    monkeypatch.setattr(ctx, "zeta", partially_failing_zeta)
    monkeypatch.setattr(mp, "clone", lambda: ctx)
    result, surface = spec({
        "realMin": 0.5, "realMax": 1.5, "imagMin": -0.4, "imagMax": 0.4,
        "realSamples": 5, "imagSamples": 5, "poleExclusionRadius": 0.075,
    })
    assert result.status == "completed"
    expected = {"sampledCount": 14, "poleMaskedCount": 1, "evaluationMaskedCount": 10,
                "maskedCount": 11, "heightClippedCount": 0}
    for counts in (surface, surface["representation"]["fidelityVector"], result.residuals,
                   result.evidenceRecords[0].residuals):
        for name, count in expected.items():
            assert counts[name] == count
    assert sum(v["status"] == "EVALUATION_MASKED" for v in surface["vertices"]) == 10
    assert any(d.code == "ZETA_EVALUATION_MASKED" for d in result.diagnostics)


@pytest.mark.parametrize("refs,expected", [
    ({"upstreamRevisions": ["source:r1"]}, ["source:r1"]),
    ({"sourceRevisionRefs": ["source:r2"]}, ["source:r2"]),
    ({"sourceRevisionRefs": [], "upstreamRevisions": ["ignored:r1"]}, []),
    ({"sourceRevisionRefs": None}, []),
    ({"upstreamRevisions": "not-a-revision-list"}, []),
])
def test_zeta_evidence_preserves_supported_upstream_revisions(refs, expected):
    result, _ = spec({"realMin": 2, "realMax": 2.1, "imagMin": 0, "imagMax": 0.1,
                      "realSamples": 4, "imagSamples": 4, **refs})
    assert result.evidenceRecords[0].upstreamRevisions == expected


def test_zeta_source_refs_resolve_to_a_concrete_function_object():
    result, surface = spec()
    objects = {item["id"]: item for item in result.outputRepresentations}
    representation = surface["representation"]
    objects[representation["id"]] = representation
    function = objects[surface["functionRef"]]
    assert function["type"] == "RiemannZetaSpec"
    assert function["id"] != function["type"]
    assert representation["sourceObjectRef"] == function["id"]
    assert {"relation": "representedBy", "from": function["id"],
            "to": representation["id"]} in result.provenanceEdges
    for edge in result.provenanceEdges:
        assert edge["from"] in objects
        assert edge["to"] in objects

def test_zeta_2_reference_value_and_phase():
    r,s=spec({"realMin":2,"realMax":2.1,"imagMin":0,"imagMax":0.1,"realSamples":4,"imagSamples":4,"precisionDps":30})
    z=s["vertices"][0]
    assert abs(z["re"]-math.pi*math.pi/6)<1e-12
    assert abs(z["im"])<1e-12
    assert z["height"]==pytest.approx(math.log1p(math.pi*math.pi/6),abs=1e-12)

def test_grid_and_precision_limits():
    with pytest.raises(ValueError):
        spec({"realSamples":45,"imagSamples":45})
    with pytest.raises(ValueError):
        spec({"realMin":0.2,"realMax":1.4,"imagMin":0,"imagMax":30,"realSamples":4,"imagSamples":4,"precisionDps":12})

def test_critical_line_near_zero_is_indicator_not_certificate():
    r,s=spec({"realMin":0.5,"realMax":0.6,"imagMin":14.13472514,"imagMax":14.23472514,"realSamples":4,"imagSamples":4,"precisionDps":30})
    assert s["vertices"][0]["magnitude"]<0.001
    assert s["nearZeroSampleCount"]>=1
    assert s["zeroCertification"]=="NONE"
