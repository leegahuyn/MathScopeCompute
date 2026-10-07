from app.adapters.spectrum_laplacian import LaplacianSpectrumAdapter


def test_finite_spectrum_stays_finite():
    result = LaplacianSpectrumAdapter().run({"gridN": 8, "k": 4}, {"test": True})
    spec = result.outputRepresentations[0]

    assert result.status == "completed"
    assert spec["mode"] == "finiteApprox"
    assert spec["exactInfinite"] is False
    assert spec["truncationN"] == 64
    assert result.evidenceRecords[0].grade == "NUMERICAL INDICATOR"
