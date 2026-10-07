import math

from app.adapters.ode_ivp import ODEIVPAdapter


def test_linear_ode_matches_exact_solution():
    result = ODEIVPAdapter().run(
        {"model": "linear_scalar", "a": -1.0, "t0": 0.0, "t1": 1.0, "y0": 1.0, "samples": 100},
        {"test": True},
    )
    assert result.status == "completed"
    assert result.residuals["maxExactError"] < 1e-5
    assert math.isclose(result.outputRepresentations[0]["state"][-1], math.e ** -1, rel_tol=1e-5)
    assert result.evidenceRecords[0].grade == "NUMERICAL INDICATOR"
