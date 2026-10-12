"""A bounded, unconditional explicit-formula enclosure at half-integer x.

We use Hildebrand's integrated explicit formula (Theorem 5.18, (5.32)):
  psi1(y) = y^2/2 - sum_rho y^(rho+1)/(rho*(rho+1))
            - y*log(2*pi) + zeta'(-1)/zeta(-1)
            - sum_{k>=1} y^(1-2*k)/(2*k*(2*k-1)).
For x=m+1/2, psi(x)=psi1(m+1)-psi1(m); there is no integer in
the open unit interval, and endpoint jumps have zero integral. Thus this
smoothed formula computes the original unsmoothed psi at the requested x.

The tail is NOT fitted to the prime-side residual, nor does it assume RH:
Hadamard's product and xi(s)=xi(1-s) give the absolutely convergent identity
  S = sum_rho Re(1/(rho*(1-rho))) = 2+EulerGamma-log(4*pi).
For rho=beta+i*t, 0<beta<1, put a=beta*(1-beta). Then
  q=Re(1/(rho*(1-rho)))=(t^2+a)/(t^4+(1-2*a)*t^2+a^2)>0,
and (t^2+1)*(t^2+a)-(t^4+(1-2*a)*t^2+a^2)
    =3*a*t^2+a-a^2 >= 0.
Consequently 1/t^2 <= (1+1/T^2)*q when |t|>T. A fresh complete
finite-height certificate supplies the exact critical-line zero boxes to
subtract from S. For all remaining zeros, |rho*(rho+1)|>=t^2 and
|y^(rho+1)|<=y^2. The unit-secant omitted zero tail is therefore bounded by
  (m^2+(m+1)^2)*(1+1/T^2)*(S-S_known).
All constants and finite sums are outward FLINT balls. This deliberately
coarse bound at T=20/30 is a certified band, not high-accuracy prime counting.

External analytic theorems and the elementary inequality above are recorded
dependencies, not a new Lean kernel proof. No global RH/BSD claim is issued.
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import json
from math import isqrt
from typing import Any

from .ball_backend import (
    BallBackendUnavailable, BallRequestError, arb_from_exact_component,
    flint_workprec, parse_exact_rational, serialize_arb,
)
from .zero_certificate import certify_zeros

try:
    import flint
    from flint import acb, arb
except ImportError:
    flint = None


SCHEMA = "MathScope.P7.ExplicitFormula/1"
ALGORITHM = "integrated-explicit-formula-unit-secant-positive-zero-mass/1"
DEFAULTS = {
    "x": "21/2", "height": "30", "precisionBits": 192,
    "tolerance": "16", "zeroTolerance": "1e-20", "trivialTerms": 16,
    "timeoutSeconds": 45, "maxCells": 16384, "maxDepth": 24,
    "maxEvaluations": 100000,
}
PRIMARY_SOURCES = [
    {
        "id": "HILDEBRAND-PSI1-5.32",
        "url": "https://eclass.uoa.gr/modules/document/file.php/MATH717/04.%20%CE%92%CE%BF%CE%B7%CE%B8%CE%AE%CE%BC%CE%B1%CF%84%CE%B1/Analytic-number-theory-Hildebrand.pdf",
        "locator": "A.J. Hildebrand, Introduction to Analytic Number Theory, 2013-01-07, Theorem 5.18, (5.32), p.166; absolute convergence p.167",
        "sourceFileSha256": "e882452e746c2c6daa2ae53209d5c3488dc692caad6ea586ad439f85e8e8279a",
    },
    {
        "id": "BRENT-ZERO-MASS",
        "url": "https://maths-people.anu.edu.au/~brent/pd/Brent-NTDU9.pdf",
        "locator": "R.P. Brent, A sum over non-trivial zeros of the Riemann zeta-function, slide 4: Identities and a comment on RH",
        "sourceFileSha256": "1efece76bf163ae7ad5e80791451b520e11927e7f70a15962d4df871a12985a2",
    },
    {"id": "DLMF-ZERO-STRIP", "url": "https://dlmf.nist.gov/25.10", "locator": "25.10(i)"},
    {"id": "DLMF-XI-REFLECTION", "url": "https://dlmf.nist.gov/25.4", "locator": "25.4.3-25.4.4"},
]


def _qstr(value: Fraction) -> str:
    return str(value.numerator) if value.denominator == 1 else f"{value.numerator}/{value.denominator}"


def _seal(result: dict[str, Any]) -> dict[str, Any]:
    encoded = json.dumps(result, ensure_ascii=True, sort_keys=True, separators=(",", ":"), allow_nan=False)
    result["computationSha256"] = hashlib.sha256(encoded.encode("ascii")).hexdigest()
    return result


def _request(request: Any):
    if not isinstance(request, dict) or set(request) - set(DEFAULTS):
        raise BallRequestError("expected only the documented explicit-formula request fields; supplied certificates are not accepted")
    config = {**DEFAULTS, **request}
    x = parse_exact_rational(config["x"])
    height = parse_exact_rational(config["height"])
    tolerance = parse_exact_rational(config["tolerance"])
    zero_tolerance = parse_exact_rational(config["zeroTolerance"])
    if x.denominator != 2 or not Fraction(5, 2) <= x <= Fraction(2001, 2):
        raise BallRequestError("x must be an exact half-integer in [5/2,2001/2]")
    if height not in (Fraction(20), Fraction(30)):
        raise BallRequestError("the complete finite-height input supports only T=20 or T=30")
    if not 0 < tolerance <= 1_000_000:
        raise BallRequestError("tolerance must be an exact positive width at most 1000000")
    if not 0 < zero_tolerance <= Fraction(1, 16):
        raise BallRequestError("zeroTolerance must lie in (0,1/16]")
    for key, lo, hi in (
        ("precisionBits", 32, 4096), ("trivialTerms", 1, 256),
        ("timeoutSeconds", 1, 60), ("maxCells", 1, 32768),
        ("maxDepth", 0, 32), ("maxEvaluations", 1, 200000),
    ):
        value = config[key]
        if isinstance(value, bool) or not isinstance(value, int) or not lo <= value <= hi:
            raise BallRequestError(f"{key} must be an integer in [{lo},{hi}]")
    for key, value in (("x", x), ("height", height), ("tolerance", tolerance), ("zeroTolerance", zero_tolerance)):
        config[key] = _qstr(value)
    return config, x, height, tolerance


def _prime_side(m: int):
    """Exact finite enumeration, separate from all zero-tail estimates."""
    sieve = [True] * (m + 1)
    sieve[0:2] = [False, False]
    for p in range(2, isqrt(m) + 1):
        if sieve[p]:
            for n in range(p * p, m + 1, p):
                sieve[n] = False
    entries = []
    product = 1
    for p in range(2, m + 1):
        if not sieve[p]:
            continue
        power = p
        while power <= m:
            entries.append({"prime": p, "primePower": power})
            product *= p
            power *= p
    entries.sort(key=lambda row: row["primePower"])
    return product, entries


def _checked_roots(certificate: dict[str, Any], height: Fraction):
    """Check fresh worker output structure, not a user receipt's authority."""
    roots = certificate.get("hardyRoots", [])
    count = certificate.get("positiveZeroCount")
    contour = certificate.get("contour", {})
    scope = certificate.get("scope", {})
    if (certificate.get("status") != "FINITE_RH_TO_T" or certificate.get("pass") is not True
            or scope.get("finiteRHToRequestedHeight") is not True
            or scope.get("upperBoundaryZeroFreeByWholeContour") is not True
            or certificate.get("request", {}).get("height") != _qstr(height)
            or contour.get("wholeSegmentCoverage") is not True
            or isinstance(count, bool) or not isinstance(count, int) or count != len(roots)
            or count <= 0 or contour.get("zeroCountIncludingMultiplicity") != 2 * count
            or certificate.get("countSaturation", {}).get("remainingZerosInRectangle") != 0):
        raise BallRequestError("fresh finite-height certificate is incomplete or inconsistent")
    bounds = []
    previous_upper = Fraction(0)
    for index, root in enumerate(roots, 1):
        lower = parse_exact_rational(root["lower"])
        upper = parse_exact_rational(root["upper"])
        if (not previous_upper < lower < upper < height
                or root.get("positiveZeroIndex") != index
                or root.get("oppositeSigns") is not True
                or root.get("uniqueAndSimpleByTotalCount") is not True):
            raise BallRequestError("fresh zero brackets must be disjoint, ordered, simple and complete")
        bounds.append((lower, upper))
        previous_upper = upper
    return bounds


def _finite_formula(config, x, height, tolerance, certificate):
    bounds = _checked_roots(certificate, height)
    m = x.numerator // 2
    left, right = arb(m), arb(m + 1)
    x_ball = arb_from_exact_component(_qstr(x))
    log_two_pi = (2 * arb.pi()).log()
    zero_sum, raw_zero_sum, known_mass = arb(0), arb(0), arb(0)
    rows = []
    for index, (lower, upper) in enumerate(bounds, 1):
        t = arb_from_exact_component({"lower": _qstr(lower), "upper": _qstr(upper)})
        rho = acb(arb_from_exact_component("1/2"), t)
        kernel = ((acb(right) ** (rho + 1) - acb(left) ** (rho + 1)) / (rho * (rho + 1)))
        contribution = 2 * kernel.real
        raw_contribution = 2 * (acb(x_ball) ** rho / rho).real
        mass = 2 / (arb_from_exact_component("1/4") + t * t)
        zero_sum += contribution
        raw_zero_sum += raw_contribution
        known_mass += mass
        rows.append({
            "positiveZeroIndex": index, "lower": _qstr(lower), "upper": _qstr(upper),
            "conjugatePairMultiplicity": 2,
            "unitSecantContribution": serialize_arb(contribution),
            "unsmoothedContribution": serialize_arb(raw_contribution),
            "positiveZeroMassContribution": serialize_arb(mass),
        })
    total_mass = 2 + arb.const_euler() - (4 * arb.pi()).log()
    remaining_mass = total_mass - known_mass
    if not remaining_mass.is_finite() or not remaining_mass > 0:
        raise BallRequestError("the omitted positive zero-mass enclosure must be strictly positive")
    t_ball = arb_from_exact_component(_qstr(height))
    factor = (left * left + right * right) * (1 + 1 / (t_ball * t_ball))
    zero_tail = factor * remaining_mass
    trivial_correction = arb(0)
    for k in range(1, config["trivialTerms"] + 1):
        trivial_correction += (left ** (1 - 2 * k) - right ** (1 - 2 * k)) / (2 * k * (2 * k - 1))
    k = config["trivialTerms"]
    trivial_tail = left ** (-2 * k - 1) / ((2 * k + 2) * (2 * k + 1) * (1 - left ** -2))
    finite = x_ball - log_two_pi - zero_sum + trivial_correction
    # The trivial omitted terms are positive; using [0,B] retains this fact.
    enclosure = finite + arb(0, zero_tail.upper()) + arb(0).union(trivial_tail.upper())
    output = serialize_arb(enclosure, tolerance)
    if output["kind"] != "finite":
        raise ArithmeticError("the explicit formula produced a nonfinite enclosure")
    product, powers = _prime_side(m)
    prime = arb(product).log()
    if not enclosure.contains(prime):
        raise ArithmeticError("the independently evaluated prime side escaped the theoretical zero-side band")
    raw_truncated = x_ball - log_two_pi - raw_zero_sum - (1 - x_ball ** -2).log() / 2
    return {
        "psiEnclosure": output,
        "finiteUnitSecantValue": serialize_arb(finite),
        "symmetricSmoothedZeroSum": serialize_arb(zero_sum),
        "zeroContributions": rows,
        "primeSide": {
            "definition": "psi(x)=sum_{p^k<=x} log(p)",
            "primePowers": powers, "exactLogArgument": str(product),
            "exactExpression": f"log({product})", "value": serialize_arb(prime),
            "containedInZeroSideBand": True,
            "usedToChooseTailBound": False, "intersectedWithZeroSideBand": False,
        },
        "unsmoothedFiniteDiagnostic": {
            "symmetricZeroSum": serialize_arb(raw_zero_sum),
            "truncatedValue": serialize_arb(raw_truncated),
            "hasOwnCertifiedTail": False,
            "note": "The certified band belongs to the unit-secant formula. This unsmoothed partial sum is a diagnostic, not another certified enclosure.",
        },
        "errorBudget": {
            "finiteComputationRoundingAndZeroBoxRadius": serialize_arb(finite.rad()),
            "nontrivialZeroTailAbsoluteBound": serialize_arb(zero_tail.upper()),
            "trivialZeroSeriesTailUpperBound": serialize_arb(trivial_tail.upper()),
            "trivialZeroTailSign": "nonnegative",
            "requestedTotalWidth": config["tolerance"],
            "totalWidthToleranceMet": output["toleranceMet"],
            "independentOfObservedPrimeResidual": True,
            "primitiveBackendRoundingSeparatelyExposed": False,
        },
        "tailCertificate": {
            "method": "positive Hadamard zero mass after complete finite-height subtraction",
            "totalZeroMassIdentity": "sum_rho Re[1/(rho*(1-rho))]=2+EulerGamma-log(4*pi)",
            "totalZeroMass": serialize_arb(total_mass),
            "knownZeroMass": serialize_arb(known_mass),
            "remainingPositiveZeroMass": serialize_arb(remaining_mass),
            "majorantFactor": serialize_arb(factor),
            "nontrivialBoundFormula": "(m^2+(m+1)^2)*(1+1/T^2)*(totalZeroMass-knownZeroMass)",
            "trivialBoundFormula": "m^(-2*K-1)/((2*K+2)*(2*K+1)*(1-m^(-2)))",
            "globalRHAssumed": False,
            "unlistedZerosAllowedOffCriticalLine": True,
            "finiteHeightBoundaryExcluded": True,
        },
    }


def evaluate_explicit_formula(request: dict[str, Any]) -> dict[str, Any]:
    """Run a fresh count/zero isolation, then a certified half-integer formula.

    ``certified`` and requested width are independent. A wide rigorous result
    is WIDTH_UNRESOLVED/pass=False when it misses the user's width. No supplied
    list of zeros, saved PASS flag, or prime-side residual controls the bound.
    """
    result: dict[str, Any] = {
        "schema": SCHEMA, "algorithm": ALGORITHM, "request": None,
        "status": "UNRESOLVED", "certified": False, "pass": False,
        "toleranceMet": False, "primarySources": PRIMARY_SOURCES,
        "scope": {
            "function": "Riemann zeta / Chebyshev psi", "halfIntegersOnly": True,
            "formulaVariant": "integrated explicit formula, unit secant",
            "globalRHProved": False, "globalRHAssumed": False,
            "universalBSDProved": False, "formalKernelProof": False,
            "completeP7Milestone": False, "savedCertificateIsAuthority": False,
        },
        "analyticDependencies": [
            {"id": "HILDEBRAND-PSI1-5.32", "grade": "EXTERNAL_THEOREM", "claim": "integrated explicit formula and absolute convergence"},
            {"id": "BRENT-ZERO-MASS", "grade": "EXTERNAL_THEOREM", "claim": "Hadamard sum identity, without RH"},
            {"id": "DLMF-ZERO-STRIP", "grade": "EXTERNAL_THEOREM", "claim": "0<Re(rho)<1 and conjugation symmetry"},
            {"id": "P7-POSITIVE-ZERO-MASS-MAJORANT", "grade": "EXPLICIT_DERIVATION_NOT_LEAN", "claim": "1/t^2 <= (1+1/T^2)*Re[1/(rho*(1-rho))] for |t|>T; proof in module docstring"},
            {"id": "P7-HALF-INTEGER-SECANT", "grade": "EXPLICIT_DERIVATION_NOT_LEAN", "claim": "psi(m+1/2)=psi1(m+1)-psi1(m), since no integer lies in the open unit interval"},
        ],
    }
    try:
        config, x, height, tolerance = _request(request)
        result["request"] = config
        zero_request = {key: config[key] for key in ("height", "precisionBits", "timeoutSeconds", "maxCells", "maxDepth", "maxEvaluations")}
        zero_request["tolerance"] = config["zeroTolerance"]
        certificate = certify_zeros(zero_request)
        result["zeroCertificate"] = certificate
        if certificate.get("pass") is not True:
            result["failure"] = {"code": "ZERO_CERTIFICATE_UNRESOLVED", "message": "A fresh complete finite-height count and sign-bracket certificate is required", "cause": certificate.get("failure")}
            return _seal(result)
        with flint_workprec(config["precisionBits"]):
            result["backend"] = {"pythonFlint": flint.__version__, "FLINT": flint.__FLINT_VERSION__}
            result.update(_finite_formula(config, x, height, tolerance, certificate))
        m = x.numerator // 2
        result["endpointConvention"] = {
            "psi": "sum of log(p) over p^k<=x; half-integer x is not a prime-power jump",
            "unitInterval": {"lower": str(m), "upper": str(m + 1)},
            "endpointJumps": "irrelevant to the integral; the open interval contains no integer",
        }
        result["certified"] = True
        result["toleranceMet"] = bool(result["psiEnclosure"]["toleranceMet"])
        result["pass"] = result["toleranceMet"]
        result["status"] = "CERTIFIED_ENCLOSURE" if result["pass"] else "WIDTH_UNRESOLVED"
    except (BallRequestError, ValueError, TypeError, KeyError) as error:
        result["failure"] = {"code": "INVALID_REQUEST_OR_CERTIFICATE", "message": str(error)}
    except BallBackendUnavailable as error:
        result["failure"] = {"code": "BACKEND_UNAVAILABLE", "message": str(error)}
    except (ArithmeticError, RuntimeError, OverflowError) as error:
        result["failure"] = {"code": "NUMERICAL_FAILURE", "message": str(error)}
    return _seal(result)
