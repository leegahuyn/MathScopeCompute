import math
import pytest
from app.adapters.zeta_complex import ComplexZetaSurfaceAdapter

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

def test_pole_is_masked():
    r,s=spec({"realMin":0.5,"realMax":1.5,"imagMin":-0.4,"imagMax":0.4,"realSamples":5,"imagSamples":5,"precisionDps":25,"poleExclusionRadius":0.075})
    assert any(v["status"]=="POLE_MASKED" for v in s["vertices"])
    assert s["maskedCount"] >= 1

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
