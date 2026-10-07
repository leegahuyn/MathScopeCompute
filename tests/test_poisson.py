from app.adapters.poisson_fd import PoissonFDAdapter


def test_poisson_residual_and_refinement():
    adapter = PoissonFDAdapter()
    coarse = adapter.run({"gridN": 8}, {"test": True})
    fine = adapter.run({"gridN": 16}, {"test": True})

    assert coarse.status == "completed"
    assert fine.status == "completed"
    assert fine.residuals["linf"] < 1e-9
    assert fine.residuals["maxGridError"] < coarse.residuals["maxGridError"]
    assert fine.evidenceRecords[0].grade == "NUMERICAL INDICATOR"
    assert "finite discrete" in fine.evidenceRecords[0].scope
