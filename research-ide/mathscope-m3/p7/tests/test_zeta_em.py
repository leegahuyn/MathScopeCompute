from fractions import Fraction

import pytest

from p7 import ball_backend as b
from p7.zeta_em import evaluate_zeta_em, bernoulli_polynomial_moments
from p7.euler_product import evaluate_euler_product


def endpoints(ball):
    return b.dyadic_to_fraction(ball["lower"]), b.dyadic_to_fraction(ball["upper"])


def contains_exact(ball, value):
    lower, upper = endpoints(ball)
    return lower <= value <= upper


@pytest.mark.parametrize("real,expected", [("-3", Fraction(1, 120)), ("-1", Fraction(-1, 12)), ("-2", Fraction(0)), ("-4", Fraction(0))])
def test_independent_exact_special_values_and_vanishing_remainders(real, expected):
    result = evaluate_zeta_em({"s": {"real": real, "imag": "0"}})
    assert contains_exact(result["value"]["real"], expected)
    assert contains_exact(result["value"]["imag"], Fraction(0))
    assert endpoints(result["errorAccounting"]["seriesTruncationUpper"]) == (0, 0)
    assert endpoints(result["errorAccounting"]["infiniteTailUpper"]) == (0, 0)


@pytest.mark.parametrize("real,imag", [("2", "0"), ("1/2", "14"), ("1/2", "30"), ("-5/2", "7"), ("7/3", "-31/2")])
def test_contains_independently_computed_high_precision_values(real, imag):
    result = evaluate_zeta_em({"s": {"real": real, "imag": imag}})
    with b.flint_workprec(384):
        point = b.acb(b.arb_from_exact_component(real), b.arb_from_exact_component(imag))
        reference = b.acb(b.arb.pi()**2/6) if (real, imag) == ("2", "0") else point.zeta()
        exact = b.serialize_acb(reference)
    for name in ("real", "imag"):
        lower, upper = endpoints(result["value"][name])
        ref_lower, ref_upper = endpoints(exact[name])
        assert lower <= ref_lower <= ref_upper <= upper
    assert result["toleranceMet"] is True
    assert result["method"]["zetaRoutineCalledForValue"] is False
    assert result["method"]["finiteEulerProductUsed"] is False


def test_exact_bernoulli_integral_moments_and_independent_error_controls():
    polynomial, moments = bernoulli_polynomial_moments(2, 4)
    assert polynomial == (Fraction(-1, 12), 0, 1)
    assert moments == (0, 0, Fraction(1, 180), 0)
    base = {"s": {"real": "1/2", "imag": "10"}, "sumCutoff": 8, "bernoulliOrder": 3, "integralEnd": 12, "integralSeriesTerms": 4}
    low = evaluate_zeta_em(base)
    more_series = evaluate_zeta_em({**base, "integralSeriesTerms": 12})
    longer_tail = evaluate_zeta_em({**base, "integralEnd": 24})
    key = "errorAccounting"
    assert endpoints(more_series[key]["seriesTruncationUpper"])[1] < endpoints(low[key]["seriesTruncationUpper"])[0]
    assert more_series[key]["infiniteTailUpper"] == low[key]["infiniteTailUpper"]
    assert endpoints(longer_tail[key]["infiniteTailUpper"])[1] < endpoints(low[key]["infiniteTailUpper"])[0]


@pytest.mark.parametrize("data", [
    {"s": {"real": "1", "imag": "0"}},
    {"s": {"real": "-3", "imag": "1"}, "bernoulliOrder": 1},
    {"s": {"real": 0.5, "imag": "14"}},
    {"integralEnd": 1}, {"integralSeriesTerms": True}, {"finiteEulerProduct": True},
])
def test_invalid_analytic_requests_have_no_finite_fallback(data):
    with pytest.raises(b.BallRequestError):
        evaluate_zeta_em(data)


@pytest.mark.parametrize("family,real", [("zeta", "1/2"), ("zeta", "1"), ("elliptic", "1"), ("elliptic", "3/2")])
def test_euler_products_are_rejected_including_boundary(family, real):
    with pytest.raises(b.BallRequestError, match="entire input rectangle"):
        evaluate_euler_product({"function": family, "s": {"real": real, "imag": "14"}})


def test_euler_domain_uses_whole_rectangle_not_midpoint():
    with pytest.raises(b.BallRequestError, match="entire input rectangle"):
        evaluate_euler_product({"s": {"real": {"lower": "1", "upper": "5/4"}, "imag": "0"}})


def test_finite_products_retain_exact_expression_and_omission_scope():
    result = evaluate_euler_product({"s": {"real": "2", "imag": "0"}, "primes": [2, 3]})
    assert contains_exact(result["value"]["real"], Fraction(3, 2))
    assert result["scope"]["certifiedInfiniteZetaValue"] is False
    assert result["completeness"]["remainingInfinitePrimeTail"] == "NOT_BOUNDED"
    elliptic = evaluate_euler_product({"function": "elliptic", "model": "11a1", "primes": [2, 3, 11]})
    assert elliptic["completeness"]["goodOnlyNotation"] == "L^S"
    assert elliptic["completeness"]["omittedPrimesAtOrBelowLargestRequested"] == [5, 7, 11]
    assert elliptic["scope"]["certifiedCompleteLValue"] is False
    assert {row["prime"] for row in elliptic["localRows"]} == {2, 3}
