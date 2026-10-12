"""Independent numerical comparisons and omission/normalization boundaries."""
from copy import deepcopy
from fractions import Fraction
import subprocess

import pytest

from p7 import ball_backend as b
from p7 import elliptic_complex as complex_l
from p7.elliptic_analytic import elliptic_central_certificate
from p7.normalization import elliptic_normalization_ledger
from p7.pari_backend import _executable


def endpoints(ball):
    return b.dyadic_to_fraction(ball["lower"]), b.dyadic_to_fraction(ball["upper"])


@pytest.mark.parametrize("model,ainvs,real,imag", [
    ("11a1", [0, -1, 1, -10, -20], "1", "3"),
    ("37a1", [0, 0, 1, -1, 0], "1/2", "7/3"),
    ([0, 0, 0, -1, 0], [0, 0, 0, -1, 0], "1", "2"),
])
def test_complex_enclosure_contains_independent_eighty_digit_lfun(model, ainvs, real, imag):
    # Only fixed test constants enter this script. The production computation
    # never calls lfun and never treats this floating reference as a bound.
    script = ("default(realprecision,80);E=ellinit(" + str(ainvs).replace(" ", "")
              + ");v=lfun(E,(" + real + ")+(" + imag
              + ")*I);print(real(v));print(imag(v));quit;\n")
    run = subprocess.run([str(_executable()), "-q", "-f"], input=script,
                         text=True, capture_output=True, timeout=45, check=True)
    reference = run.stdout.strip().splitlines()
    assert len(reference) == 2, (run.stdout, run.stderr)
    record = complex_l.evaluate_elliptic_complex({"model": model, "s": {"real": real, "imag": imag}})
    for component, decimal in zip(("real", "imag"), reference):
        lower, upper = endpoints(record["values"]["L"][component])
        assert lower <= Fraction(decimal.replace(" ", "")) <= upper
    assert record["toleranceMet"]
    assert record["global"]["allBadFactorsCertified"]
    assert record["coefficientData"]["allBadFactorsIncluded"]
    assert record["method"]["analyticRankOrDatabaseValueUsed"] is False
    assert record["scope"]["analyticRankCertifiedByThisRequest"] is False
    assert endpoints(record["errorAccounting"]["coefficientSeriesTailUpper"])[0] > 0


@pytest.mark.parametrize("model", ["11a1", "37a1"])
def test_center_agrees_with_separate_exponential_and_e1_algorithm(model):
    value = complex_l.evaluate_elliptic_complex({"model": model, "s": {"real": "1", "imag": "0"}})
    reference = elliptic_central_certificate(model)
    for name in ("L", "Lambda"):
        left, right = endpoints(value["values"][name]["real"])
        ref_left, ref_right = endpoints(reference["values"][name])
        assert max(left, ref_left) <= min(right, ref_right)
        im_left, im_right = endpoints(value["values"][name]["imag"])
        assert im_left <= 0 <= im_right
    if model == "37a1":
        assert value["method"]["exactCentralParityZero"]
        assert endpoints(value["values"]["Lambda"]["real"]) == (0, 0)
        assert endpoints(value["errorAccounting"]["coefficientSeriesTailUpper"]) == (0, 0)


@pytest.mark.parametrize("real", ["0", "-1", "-2"])
def test_reciprocal_gamma_removes_poles_and_preserves_trivial_zero_distinction(real):
    record = complex_l.evaluate_elliptic_complex({"s": {"real": real, "imag": "0"}})
    assert endpoints(record["values"]["L"]["real"]) == (0, 0)
    assert endpoints(record["values"]["L"]["imag"]) == (0, 0)
    assert endpoints(record["values"]["Lambda"]["real"])[0] > 0
    assert record["normalizationLedger"]["pointConversion"]["trivialLZeroForcedExactly"]


def test_short_coefficient_sum_retains_infinite_tail_and_fails_requested_tolerance():
    base = {"model": "37a1", "s": {"real": "1", "imag": "3"}, "coefficientLimit": 1}
    short = complex_l.evaluate_elliptic_complex(base)
    longer = complex_l.evaluate_elliptic_complex({**base, "coefficientLimit": 64})
    assert short["toleranceMet"] is False
    assert short["status"] == "CERTIFIED_COMPLEX_MELLIN_ENCLOSURE"
    assert endpoints(short["errorAccounting"]["coefficientSeriesTailUpper"])[0] > endpoints(longer["errorAccounting"]["coefficientSeriesTailUpper"])[1]
    assert short["errorAccounting"]["tailCertificate"]["fittedToResidual"] is False
    assert short["scope"]["universalBSDProved"] is False


@pytest.mark.parametrize("mutation", ["bad-factor", "series-label", "coefficient"])
def test_good_only_or_tampered_local_data_cannot_supply_a_completed_function(monkeypatch, mutation):
    local = complex_l.complete_local_certificate("11a1", coefficient_limit=128)
    broken = deepcopy(local)
    if mutation == "bad-factor":
        broken["dirichletCoefficients"]["allBadFactorsIncluded"] = False
    elif mutation == "series-label":
        broken["dirichletCoefficients"]["seriesLabel"] = "L^S"
    else:
        broken["dirichletCoefficients"]["coefficients"][0] = 0
    monkeypatch.setattr(complex_l, "complete_local_certificate", lambda *args, **kwargs: broken)
    with pytest.raises((ValueError, ArithmeticError)):
        complex_l.evaluate_elliptic_complex({})


@pytest.mark.parametrize("data", [
    {"s": {"real": "17", "imag": "0"}}, {"s": {"real": 0.5, "imag": "0"}},
    {"coefficientLimit": True}, {"coefficientLimit": 257}, {"precisionBits": 32},
    {"tolerance": "0"}, {"analyticRank": 1},
])
def test_malformed_inputs_cannot_select_a_fallback(data):
    with pytest.raises((b.BallRequestError, ValueError)):
        complex_l.evaluate_elliptic_complex(data)


@pytest.mark.parametrize("real", ["0", "1", "-2"])
def test_zeta_and_xi_evaluations_include_automatic_exceptional_point_ledger(real):
    zeta = b.evaluate({"operation": "zeta", "s": {"real": real, "imag": "0"}})
    xi = b.evaluate({"operation": "xi", "s": {"real": real, "imag": "0"}})
    assert zeta["normalizationLedger"]["pointConversion"]["zeroMultiplicityTransferred"] is False
    assert xi["normalizationLedger"]["evaluatedFunction"] == "xi"
    assert xi["status"] == "finite"
    if real in {"0", "1"}:
        lower, upper = endpoints(xi["value"]["real"])
        assert lower <= Fraction(1, 2) <= upper
    else:
        assert endpoints(zeta["value"]["real"]) == (0, 0)
        assert endpoints(xi["value"]["real"])[0] > 0
    if real == "1":
        assert zeta["status"] == "nonfinite" and zeta["value"] is None


@pytest.mark.parametrize("kwargs", [
    {"conductor": 11, "root_number": 1, "all_bad_factors": False},
    {"conductor": 0, "root_number": 1}, {"conductor": 11, "root_number": True},
])
def test_normalization_rejects_missing_local_factors_or_invalid_constants(kwargs):
    with pytest.raises(ValueError):
        elliptic_normalization_ledger({"real": "1", "imag": "0"}, **kwargs)
