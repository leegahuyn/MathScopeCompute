"""Finite-displacement Taylor balls with an explicit Cauchy remainder.

Let f be analytic on a neighbourhood of |z-c|<=R and bounded there by M.
Cauchy's coefficient formula gives |a_k|<=M/R^k. For |h|<=r<R,
  |f(c+h)-sum_{k=0}^n a_k*h^k|
       <= M * (r/R)^(n+1) / (1-r/R).
This is an explicit geometric tail, not a residual or a last-term estimate.

The whole square c+[-R,R]+i[-R,R] is enclosed and evaluated by FLINT;
its absolute upper bound supplies M for the entire disk, including its
boundary. A sampled circle maximum is never used. Zeta's pole at 1 and
Gamma's poles at nonpositive integers are excluded from the *closed square*
by exact rational comparisons. This conservative safe subset guarantees an
open analytic neighbourhood of the circle. Reciprocal Gamma is entire.

FLINT's Taylor coefficients include their internal rounding/truncation
enclosures. That combined backend enclosure is kept separate from the new
explicit finite-displacement tail, without inventing an unavailable internal
rounding-versus-backend-truncation split. Cauchy and analytic continuation are
external mathematical dependencies, not newly compiled Lean theorems.
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import json
from math import ceil, floor
from typing import Any

from .ball_backend import (
    BallBackendUnavailable, BallRequestError, arb_from_exact_component,
    flint_workprec, parse_exact_rational, serialize_acb, serialize_arb,
)

try:
    import flint
    from flint import acb, acb_series, arb
except ImportError:
    flint = None


SCHEMA = "MathScope.P7.TaylorRemainder/1"
DEFAULTS = {
    "operation": "zeta", "center": {"real": "2", "imag": "0"},
    "displacement": {"real": "1/100", "imag": "0"},
    "radius": "1/4", "displacementRadius": "1/100",
    "order": 10, "precisionBits": 192, "tolerance": "1e-12",
}
PRIMARY_SOURCES = [
    {"id": "CAUCHY-COEFFICIENT", "url": "https://dlmf.nist.gov/1.10.E7", "claim": "Cauchy's coefficient formula; absolute coefficient bound follows from the circle integral"},
    {"id": "TAYLOR-ANALYTIC-DISK", "url": "https://dlmf.nist.gov/1.10.E1", "claim": "Taylor expansion on an analytic disk"},
    {"id": "ZETA-MEROMORPHY", "url": "https://dlmf.nist.gov/25.2", "claim": "zeta has only the simple pole at 1"},
    {"id": "GAMMA-RGAMMA-DOMAIN", "url": "https://dlmf.nist.gov/5.2", "claim": "Gamma poles at nonpositive integers; reciprocal Gamma entire"},
    {"id": "ACB-OUTWARD-BOUND", "url": "https://python-flint.readthedocs.io/en/latest/acb.html#flint.acb.abs_upper", "claim": "rectangular complex balls and an upward rounded absolute upper bound"},
]


class _UnsupportedDomain(ValueError):
    pass


def _qstr(q: Fraction) -> str:
    return str(q.numerator) if q.denominator == 1 else f"{q.numerator}/{q.denominator}"


def _point(value: Any, label: str):
    if not isinstance(value, dict) or set(value) - {"real", "imag"} or "real" not in value:
        raise BallRequestError(f"{label} must be an exact point with real and optional imag strings")
    pair = (parse_exact_rational(value["real"]), parse_exact_rational(value.get("imag", "0")))
    if any(abs(q) > 10000 for q in pair):
        raise BallRequestError(f"{label} components exceed the supported magnitude 10000")
    return pair


def _parse(request):
    if not isinstance(request, dict) or set(request) - set(DEFAULTS):
        raise BallRequestError("expected only the documented Taylor-remainder request fields")
    config = {**DEFAULTS, **request}
    if config["operation"] not in ("zeta", "gamma", "rgamma"):
        raise BallRequestError("operation must be zeta, gamma or rgamma")
    c = _point(config["center"], "center")
    h = _point(config["displacement"], "displacement")
    radius = parse_exact_rational(config["radius"])
    small_radius = parse_exact_rational(config["displacementRadius"])
    tolerance = parse_exact_rational(config["tolerance"])
    if not 0 < radius <= 1:
        raise BallRequestError("radius R must be an exact string in (0,1]")
    if not 0 <= small_radius < radius:
        raise BallRequestError("displacementRadius r must satisfy 0<=r<R exactly")
    if h[0] ** 2 + h[1] ** 2 > small_radius ** 2:
        raise BallRequestError("the actual complex displacement must satisfy |h|<=r")
    if tolerance <= 0:
        raise BallRequestError("tolerance must be an exact positive string")
    for key, lo, hi in (("order", 0, 16), ("precisionBits", 32, 4096)):
        value = config[key]
        if isinstance(value, bool) or not isinstance(value, int) or not lo <= value <= hi:
            raise BallRequestError(f"{key} must be an integer in [{lo},{hi}]")
    config["center"] = {"real": _qstr(c[0]), "imag": _qstr(c[1])}
    config["displacement"] = {"real": _qstr(h[0]), "imag": _qstr(h[1])}
    config["radius"], config["displacementRadius"], config["tolerance"] = map(_qstr, (radius, small_radius, tolerance))
    return config, c, h, radius, small_radius, tolerance


def _analytic_square(operation, c, radius):
    real = (c[0] - radius, c[0] + radius)
    imag = (c[1] - radius, c[1] + radius)
    intersects_real_axis = imag[0] <= 0 <= imag[1]
    if operation == "zeta" and intersects_real_axis and real[0] <= 1 <= real[1]:
        raise _UnsupportedDomain("the closed bounding square touches or includes the zeta pole at 1; choose a smaller R or another center")
    if operation == "gamma" and intersects_real_axis and ceil(real[0]) <= min(0, floor(real[1])):
        raise _UnsupportedDomain("the closed bounding square touches or includes a Gamma pole at a nonpositive integer")
    return {
        "real": {"lower": _qstr(real[0]), "upper": _qstr(real[1])},
        "imag": {"lower": _qstr(imag[0]), "upper": _qstr(imag[1])},
    }


def _acb_point(pair):
    return acb(*(arb_from_exact_component(_qstr(q)) for q in pair))


def _finite(value):
    return bool(value.real.is_finite() and value.imag.is_finite())


def _seal(result):
    data = json.dumps(result, sort_keys=True, ensure_ascii=True, separators=(",", ":"), allow_nan=False)
    result["computationSha256"] = hashlib.sha256(data.encode("ascii")).hexdigest()
    return result


def evaluate_taylor_remainder(request: dict[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {
        "schema": SCHEMA, "request": None, "status": "UNRESOLVED",
        "certified": False, "pass": False, "toleranceMet": False,
        "primarySources": PRIMARY_SOURCES,
        "scope": {
            "supportedFunctions": ["zeta", "gamma", "rgamma"],
            "exactPointCenterAndDisplacement": True,
            "formalKernelProof": False, "globalRHProved": False,
            "universalBSDProved": False, "completeP7Milestone": False,
            "backendInternalRoundingSplitExposed": False,
        },
        "analyticDependencies": [
            {"id": "CAUCHY-COEFFICIENT", "grade": "EXTERNAL_THEOREM"},
            {"id": "TAYLOR-ANALYTIC-DISK", "grade": "EXTERNAL_THEOREM"},
            {"id": "P7-GEOMETRIC-TAIL", "grade": "EXPLICIT_DERIVATION_NOT_LEAN", "statement": "sum_{k=n+1}^infinity M*(r/R)^k = M*(r/R)^(n+1)/(1-r/R), for 0<=r<R"},
        ],
    }
    try:
        config, c, h, radius, small_radius, tolerance = _parse(request)
        result["request"] = config
        square = _analytic_square(config["operation"], c, radius)
        result["domainCertificate"] = {
            "center": config["center"], "circleRadius": config["radius"],
            "exactBoundingSquare": square,
            "closedSquareFreeOfFunctionPoles": True,
            "analyticOnNeighborhoodOfClosedDisk": True,
            "reciprocalGammaEntire": config["operation"] == "rgamma",
            "displacementNormSquared": _qstr(h[0] ** 2 + h[1] ** 2),
            "displacementRadiusSquared": _qstr(small_radius ** 2),
            "normInequalityCheckedWithExactRationals": True,
            "strictRadiusRatio": _qstr(small_radius / radius),
            "conservativeSquareTest": True,
        }
        with flint_workprec(config["precisionBits"], config["order"] + 1):
            result["backend"] = {"pythonFlint": flint.__version__, "FLINT": flint.__FLINT_VERSION__}
            box = acb(arb_from_exact_component(square["real"]), arb_from_exact_component(square["imag"]))
            image = getattr(box, config["operation"])()
            if not _finite(image):
                raise ArithmeticError("FLINT could not enclose the whole bounding square; no sampled maximum is substituted")
            maximum = image.abs_upper()
            if not maximum.is_finite():
                raise ArithmeticError("the whole-square absolute upper bound is nonfinite")
            series = getattr(acb_series([_acb_point(c), acb(1)], prec=config["order"] + 1), config["operation"])()
            coefficients = [series[k] for k in range(config["order"] + 1)]
            if not all(_finite(value) for value in coefficients):
                raise ArithmeticError("a Taylor coefficient enclosure is nonfinite")
            displacement = _acb_point(h)
            polynomial = acb(0)
            for coefficient in reversed(coefficients):
                polynomial = polynomial * displacement + coefficient
            q = small_radius / radius
            exact_factor = q ** (config["order"] + 1) / (1 - q)
            tail = maximum * arb_from_exact_component(_qstr(exact_factor))
            bound = tail.upper()
            widened = polynomial + acb(arb(0, bound), arb(0, bound))
            output = serialize_acb(widened, tolerance)
            if output["kind"] != "finite":
                raise ArithmeticError("the Taylor-plus-remainder enclosure is nonfinite")
            # Direct evaluation is a consistency observation. It neither
            # chooses nor tightens the Cauchy tail, and shares the same backend.
            target = _acb_point((c[0] + h[0], c[1] + h[1]))
            direct = getattr(target, config["operation"])()
            direct_finite = _finite(direct)
            overlaps = bool(widened.overlaps(direct)) if direct_finite else None
            if direct_finite and not overlaps:
                raise ArithmeticError("the direct value and Taylor enclosure are disjoint")
            result.update({
                "value": output,
                "polynomialValue": serialize_acb(polynomial),
                "coefficients": [{"order": k, "meaning": "f^(k)(center)/k!", "ball": serialize_acb(value)} for k, value in enumerate(coefficients)],
                "uniformBound": {
                    "method": "actual FLINT evaluation on one whole outward complex rectangle",
                    "inputRectangle": serialize_acb(box), "imageRectangle": serialize_acb(image),
                    "absoluteUpperBound": serialize_arb(maximum),
                    "containsEntireClosedCauchyCircle": True, "sampledMaximumUsed": False,
                },
                "remainderCertificate": {
                    "formula": "M*(r/R)^(n+1)/(1-r/R)",
                    "exactGeometricFactor": _qstr(exact_factor),
                    "absoluteUpperBound": serialize_arb(bound),
                    "appliesTo": "complex norm of the full omitted Taylor series at the exact requested displacement",
                    "componentExpansion": "each real/imaginary component expanded by the same complex absolute bound",
                    "source": "Cauchy coefficient estimate plus convergent geometric sum",
                    "observedResidualUsed": False,
                },
                "errorAccounting": {
                    "backendCoefficientAndPolynomialEnclosure": serialize_acb(polynomial),
                    "finiteDisplacementTaylorTail": serialize_arb(bound),
                    "internalRoundingBound": None, "internalBackendTruncationBound": None,
                    "internalSplitStatus": "not separately exposed by the pinned python-flint API; both included in backend balls",
                    "targetValueWasNotUsedToTightenEnclosure": True,
                },
                "directEvaluationObservation": {
                    "value": serialize_acb(direct), "overlapsTaylorEnclosure": overlaps,
                    "independentSoftwareImplementation": False,
                    "usedForTailBound": False,
                },
            })
        result["certified"] = True
        result["toleranceMet"] = bool(output["toleranceMet"])
        result["pass"] = result["toleranceMet"]
        result["status"] = "CERTIFIED_TAYLOR_ENCLOSURE" if result["pass"] else "WIDTH_UNRESOLVED"
    except _UnsupportedDomain as error:
        result["failure"] = {"code": "UNSUPPORTED_BOUNDING_SQUARE", "message": str(error)}
    except (BallRequestError, ValueError, TypeError, KeyError) as error:
        result["failure"] = {"code": "INVALID_REQUEST", "message": str(error)}
    except BallBackendUnavailable as error:
        result["failure"] = {"code": "BACKEND_UNAVAILABLE", "message": str(error)}
    except (ArithmeticError, RuntimeError, OverflowError) as error:
        result["failure"] = {"code": "NUMERICAL_FAILURE", "message": str(error)}
    return _seal(result)
