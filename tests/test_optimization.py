from app.adapters.optimization_poisson import PoissonAmplitudeOptimizationAdapter


def test_poisson_amplitude_optimization_stationarity():
    result = PoissonAmplitudeOptimizationAdapter().run(
        {"gridN": 16, "targetAmplitude": 1.0, "regularizer": 1e-3},
        {"test": True},
    )
    assert result.status == "completed"
    assert result.residuals["gradientAtSolution"] < 1e-10
    assert result.evidenceRecords[0].grade == "NUMERICAL INDICATOR"
