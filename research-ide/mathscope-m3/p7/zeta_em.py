"""Zeta continuation with separately executed finite series and infinite tails.

Euler--Maclaurin is used as an identity with a periodic Bernoulli integral.
Each unit interval of its finite part is integrated by a binomial series with
an explicit geometric remainder. The remaining improper integral has its own
absolute bound. No zeta routine or finite Euler product supplies the value.
"""
from __future__ import annotations

from fractions import Fraction
from functools import lru_cache
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path

from . import ball_backend as balls
from .normalization import zeta_normalization_ledger

SCHEMA = "MathScope.M3.P7.ZetaEulerMaclaurin/1"
PRIMARY_SOURCES = [
    {"url": "https://dlmf.nist.gov/25.2#iii", "use": "Euler--Maclaurin continuation; the even-Bernoulli remainder follows by integration by parts."},
    {"url": "https://dlmf.nist.gov/24.8#i", "use": "The periodic Bernoulli Fourier bound |B_(2m)(x)| <= |B_(2m)|."},
    {"url": "https://python-flint.readthedocs.io/en/latest/acb.html", "use": "Outward real/imaginary enclosures for the finite arithmetic and elementary powers."},
]


def exact_point(data, *, maximum=128):
    if not isinstance(data, dict) or set(data) != {"real", "imag"}:
        raise balls.BallRequestError("s needs exactly real and imag exact rational strings")
    pair = tuple(balls.parse_exact_rational(data[key]) for key in ("real", "imag"))
    if any(abs(value) > maximum for value in pair):
        raise balls.BallRequestError("This continuation request exceeds its declared exact-point budget")
    return pair


def integer_control(data, key, default, minimum, maximum):
    value = data.get(key, default)
    if type(value) is not int or not minimum <= value <= maximum:
        raise balls.BallRequestError(f"{key} must be an integer in [{minimum},{maximum}]")
    return value


def rational_arb(value):
    value = Fraction(value)
    return balls.arb(balls.fmpq(value.numerator, value.denominator))


def source_binding(*names):
    root = Path(__file__).resolve().parent
    return {name: sha256((root / name).read_bytes()).hexdigest() for name in names}


def seal(record):
    record["computationSha256"] = sha256(json.dumps(record, sort_keys=True, ensure_ascii=True,
                                                      separators=(",", ":"), allow_nan=False).encode()).hexdigest()
    return record


def with_absolute_error(value, error):
    radius = error.upper()
    return value + balls.acb(balls.arb(0, radius), balls.arb(0, radius))


@lru_cache(maxsize=32)
def bernoulli_polynomial_moments(order, count):
    """Exact integrals of B_order(u+1/2)*u^k on [-1/2,1/2]."""
    coefficients = []
    for j in range(order + 1):
        n = order-j
        bernoulli = Fraction(str(balls.fmpq.bernoulli(n)))
        at_half = (Fraction(2) ** (1-n) - 1) * bernoulli
        coefficients.append(Fraction(comb(order, j))*at_half)
    moments = tuple(sum((coefficient / (2**(j+k)*(j+k+1))
                         for j, coefficient in enumerate(coefficients) if (j+k) % 2 == 0), Fraction(0))
                    for k in range(count))
    return tuple(coefficients), moments


def _request(data):
    allowed = {"s", "precisionBits", "tolerance", "sumCutoff", "bernoulliOrder", "integralEnd", "integralSeriesTerms"}
    if not isinstance(data, dict) or set(data)-allowed:
        raise balls.BallRequestError("Unknown Euler--Maclaurin continuation input")
    point = exact_point(data.get("s", {"real": "1/2", "imag": "14"}))
    bits = integer_control(data, "precisionBits", 192, 64, 4096)
    cutoff = integer_control(data, "sumCutoff", 32, 2, 256)
    order = integer_control(data, "bernoulliOrder", 16, 1, 32)
    end = integer_control(data, "integralEnd", max(cutoff, 64), cutoff, cutoff+256)
    terms = integer_control(data, "integralSeriesTerms", 16, 2, 96)
    if (end-cutoff)*terms > 16384:
        raise balls.BallRequestError("The finite integral series exceeds its declared work budget")
    tolerance = balls.parse_exact_rational(data.get("tolerance", "1e-25"))
    if not 0 < tolerance <= 1:
        raise balls.BallRequestError("tolerance must be an exact rational string in (0,1]")
    if point == (Fraction(1), Fraction(0)):
        raise balls.BallRequestError("zeta has a genuine simple pole at s=1; no finite ball is returned")
    if point[0]+2*order-1 <= 0:
        raise balls.BallRequestError("The selected Bernoulli order needs Re(s)+2*M-1>0")
    request = {"s": dict(zip(("real", "imag"), map(balls._fraction_string, point))),
               "precisionBits": bits, "tolerance": balls._fraction_string(tolerance),
               "sumCutoff": cutoff, "bernoulliOrder": order, "integralEnd": end,
               "integralSeriesTerms": terms}
    return request, point, tolerance


def evaluate_zeta_em(data):
    request, point, tolerance = _request(data)
    bits, N, M, B, K = (request[key] for key in ("precisionBits", "sumCutoff", "bernoulliOrder", "integralEnd", "integralSeriesTerms"))
    with balls.flint_workprec(bits):
        acb, arb = balls.acb, balls.arb
        sigma = rational_arb(point[0])
        s = acb(sigma, rational_arb(point[1]))
        Nball = acb(N)
        base = sum((acb(n)**(-s) for n in range(1, N)), acb(0))
        base += Nball**(1-s)/(s-1) + Nball**(-s)/2
        rising = acb(1)
        corrections = []
        for j in range(1, 2*M+1):
            rising *= s+j-1
            if j % 2:
                coefficient = balls.fmpq.bernoulli(j+1) / factorial(j+1)
                term = coefficient*rising*Nball**(-s-j)
                base += term
                corrections.append({"order": j+1, "bernoulliOverFactorial": str(coefficient),
                                    "term": balls.serialize_acb(term)})
        prefactor = rising / factorial(2*M)
        bernoulli = abs(balls.fmpq.bernoulli(2*M))
        bernoulli_bound = arb(bernoulli)
        alpha = s+2*M
        alpha_upper = alpha.abs_upper()
        coefficients, moments = bernoulli_polynomial_moments(2*M, K)
        moment_balls = [rational_arb(value) for value in moments]
        integral = acb(0)
        series_error = arb(0)
        cells = []
        for n in range(N, B):
            q = arb(n)+arb(1)/2
            r = 1/(2*q)
            # For every k>=K, |(alpha+k)/(k+1)|*r is no larger
            # than r*max(1,(|alpha|+K)/(K+1)). Use the conservative
            # max as a certified upper bound, including |alpha|<1.
            slope_upper = ((alpha_upper+K)/(K+1)).upper()
            ratio = (r*max(arb(1), slope_upper)).upper()
            if not ratio < 1:
                raise balls.BallRequestError("The finite binomial series has no certified geometric tail at these controls")
            coefficient = acb(1)
            finite = acb(0)
            for k in range(K):
                finite += coefficient*moment_balls[k]
                coefficient *= -(alpha+k)/(k+1)/q
            factor = acb(q)**(-alpha)
            cell = factor*finite
            # coefficient is (-1)^K*(alpha)_K/(K!*q^K).
            # |u|<=1/2. Each cell has length one.
            omitted = coefficient.abs_upper()/2**K/(1-ratio)
            error = prefactor.abs_upper()*bernoulli_bound*factor.abs_upper()*omitted
            integral += cell
            series_error += error
            cells.append({"left": n, "right": n+1, "center": str(Fraction(2*n+1, 2)),
                          "ratioUpper": balls.serialize_arb(ratio.upper()),
                          "finiteIntegral": balls.serialize_acb(cell),
                          "contributionRemainderUpper": balls.serialize_arb(error.upper())})
        finite_value = base-prefactor*integral
        exponent = sigma+2*M-1
        tail_error = prefactor.abs_upper()*bernoulli_bound*arb(B)**(-exponent)/exponent
        if not tail_error >= 0 or not series_error >= 0:
            raise ArithmeticError("Euler--Maclaurin error-bound positivity was not established")
        final = with_absolute_error(finite_value, series_error+tail_error)
        if not final.is_finite():
            raise ArithmeticError("The selected controls did not produce a finite continuation ball")
        value = balls.serialize_acb(final, tolerance)
        record = {
            "schema": SCHEMA, "request": request, "status": "CERTIFIED_ANALYTIC_ENCLOSURE",
            "function": "zeta(s)", "value": value, "toleranceMet": value["toleranceMet"],
            "method": {"name": "Euler--Maclaurin with separately integrated finite Bernoulli remainder",
                       "identity": "zeta(s)=sum_(n=1)^(N-1)n^(-s)+N^(1-s)/(s-1)+N^(-s)/2+sum_(k=1)^M B_(2k)/(2k)!*(s)_(2k-1)*N^(1-s-2k)-(s)_(2M)/(2M)!*integral_N^infinity Btilde_(2M)(x)*x^(-s-2M) dx",
                       "exactBernoulliPolynomial": [balls._fraction_string(c) for c in coefficients],
                       "exactIntegratedMoments": [balls._fraction_string(v) for v in moments],
                       "corrections": corrections, "finiteIntegralCells": cells,
                       "zetaRoutineCalledForValue": False, "finiteEulerProductUsed": False},
            "errorAccounting": {
                "finiteArithmeticBall": balls.serialize_acb(finite_value),
                "roundingEnclosure": {"realRadius": balls.serialize_arb(finite_value.real.rad()),
                                       "imagRadius": balls.serialize_arb(finite_value.imag.rad()),
                                       "includes": "Exact-input conversion, outward finite arithmetic, and elementary power/log/exp evaluation enclosures. Internal elementary-function roundoff and approximation are not split further."},
                "seriesTruncationUpper": balls.serialize_arb(series_error.upper()),
                "infiniteTailUpper": balls.serialize_arb(tail_error.upper()),
                "seriesFormula": "Sum over unit cells of |(s)_(2M)/(2M)!|*|B_(2M)|*|q^(-alpha)|*|(alpha)_K|/(K!*(2q)^K)/(1-ratio)",
                "tailFormula": "|(s)_(2M)/(2M)!|*|B_(2M)|*B^(1-Re(s)-2M)/(Re(s)+2M-1)",
                "sumRule": "The two distinct analytic absolute bounds are added symmetrically to each component of the finite arithmetic ball.",
                "separateRoundoffSeriesAndInfiniteTailAccounting": True,
                "boundFittedToObservedResidual": False},
            "domainCertificate": {"exactPointInput": True, "realPart": request["s"]["real"],
                                  "required": "Re(s)+2*M-1>0 and s!=1", "checked": True,
                                  "criticalStripAllowed": True, "EulerProductDomainRequired": False},
            "backend": {"pythonFlint": balls.BACKEND_VERSION, "FLINT": balls.FLINT_VERSION, "precisionBits": bits},
            "scope": {"analyticContinuationEnclosed": True, "finiteEulerProductIsCertifiedZeta": False,
                      "zeroCountCertified": False, "universalRHProved": False, "formalLeanProofIssued": False},
            "primarySources": PRIMARY_SOURCES,
            "normalizationLedger": zeta_normalization_ledger(request["s"]),
            "sourceSha256": source_binding("zeta_em.py", "ball_backend.py", "normalization.py"),
        }
    return seal(record)
