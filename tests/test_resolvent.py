import math

from app.adapters.resolvent_matrix import ResolventMatrixAdapter


def test_resolvent_identity_matrix():
    result = ResolventMatrixAdapter().run(
        {
            "matrix": [[1.0, 0.0], [0.0, 1.0]],
            "lambda": {"real": 2.0, "imag": 0.0},
        },
        {"test": True},
    )
    sample = result.outputRepresentations[0]
    assert math.isclose(sample["resolventNorm2"], 1.0, rel_tol=1e-12)
    assert sample["finiteApproximation"] is True
