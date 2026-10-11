"""Pinned FLINT complex-ball evaluations for the first MathScope M3 P7 step.

Coordinates are exact strings, never Python floats.  A finite result certifies
an enclosure of the requested value or derivative; its actual component widths
are checked separately from the working precision.  This module does not supply
a Taylor remainder for a nonzero displacement, a zero count, or a P7 completion
certificate.  See BALL_BACKEND_KO.md for the normalization and source references.
"""

from __future__ import annotations

from contextlib import contextmanager
from fractions import Fraction
import hashlib
import json
import math
import re
from threading import RLock
from typing import Any

try:
    import flint
    from flint import acb, acb_series, arb, ctx, fmpq
except ImportError:  # Pure exact parsing remains usable before installation.
    flint = None


SCHEMA = "MathScope.M3.P7.BallEvaluation/1"
BACKEND_VERSION = "0.9.0"
FLINT_VERSION = "3.6.0"
MAX_DERIVATIVE_ORDER = 16
MAX_PRECISION_BITS = 4096
MAX_COMPONENT_ABSOLUTE_VALUE = Fraction(10000)
MAX_COMPONENT_WIDTH = Fraction(1, 4)
MAX_INPUT_CHARACTERS = 4096
MAX_DECIMAL_EXPONENT = 10000
MAX_DYADIC_SHIFT = 1_000_000

_LOCK = RLock()
_INTEGER = re.compile(r"-?(?:0|[1-9][0-9]*)\Z")
_RATIONAL = re.compile(r"([+-]?[0-9]+)/([+-]?[0-9]+)\Z")
_DECIMAL = re.compile(
    r"([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?\Z"
)
_FUNCTIONS = {"zeta", "zeta_deflated", "gamma", "rgamma", "lgamma", "xi"}
_REQUEST_KEYS = {"operation", "s", "precisionBits", "tolerance", "derivativeOrder"}


class BallRequestError(ValueError):
    """Malformed or out-of-budget request, before a backend computation."""


class BallBackendUnavailable(RuntimeError):
    """The exact, pinned backend has not been installed."""


def parse_exact_rational(value: str) -> Fraction:
    """Parse a rational or decimal/scientific string without a float round trip.

    Strings such as ``'1/2'``, ``'0.5'`` and ``'5e-1'`` represent exactly the
    same rational.  Numbers, booleans, whitespace, NaN and infinity are rejected.
    """
    if not isinstance(value, str):
        raise BallRequestError("coordinates and tolerance must be exact strings, not numbers")
    if not value or len(value) > MAX_INPUT_CHARACTERS or value != value.strip():
        raise BallRequestError("empty, oversized, or whitespace-padded exact input")
    match = _RATIONAL.fullmatch(value)
    if match:
        numerator, denominator = (int(v) for v in match.groups())
        if denominator == 0:
            raise BallRequestError("zero rational denominator")
        return Fraction(numerator, denominator)
    match = _DECIMAL.fullmatch(value)
    if not match:
        raise BallRequestError("expected an exact rational or decimal string")
    sign, integer, fraction, leading_fraction, exponent = match.groups()
    fraction = leading_fraction if integer is None else (fraction or "")
    integer = integer or "0"
    # Bound the exponent string before converting it to an integer.
    if exponent is not None and len(exponent.lstrip("+-")) > 5:
        raise BallRequestError("decimal exponent exceeds the exact-input budget")
    exponent_value = int(exponent or "0")
    if abs(exponent_value) > MAX_DECIMAL_EXPONENT:
        raise BallRequestError("decimal exponent exceeds the exact-input budget")
    digits = integer + fraction
    numerator = int(digits)
    if sign == "-":
        numerator = -numerator
    power = exponent_value - len(fraction)
    result = Fraction(numerator * 10**power) if power >= 0 else Fraction(numerator, 10 ** (-power))
    # Keep the canonical request readable by the same parser on replay.  Check
    # size before Python's integer-to-decimal conversion limit can be reached.
    if max(abs(result.numerator).bit_length(), result.denominator.bit_length()) > 13000:
        raise BallRequestError("expanded exact rational exceeds the canonical-input budget")
    if len(_fraction_string(result)) > MAX_INPUT_CHARACTERS:
        raise BallRequestError("expanded exact rational exceeds the canonical-input budget")
    return result


def _fraction_string(value: Fraction) -> str:
    if value.denominator == 1:
        return str(value.numerator)
    return f"{value.numerator}/{value.denominator}"


def _component_bounds(value: Any) -> tuple[Fraction, Fraction]:
    if isinstance(value, str):
        point = parse_exact_rational(value)
        return point, point
    if not isinstance(value, dict) or set(value) != {"lower", "upper"}:
        raise BallRequestError("a component must be a string or {lower:string, upper:string}")
    lower, upper = parse_exact_rational(value["lower"]), parse_exact_rational(value["upper"])
    if lower > upper:
        raise BallRequestError("reversed input interval")
    return lower, upper


def _require_backend() -> None:
    if flint is None:
        raise BallBackendUnavailable("install the pinned python-flint 0.9.0 wheel first")
    if flint.__version__ != BACKEND_VERSION or flint.__FLINT_VERSION__ != FLINT_VERSION:
        raise BallBackendUnavailable(
            f"expected python-flint {BACKEND_VERSION} / FLINT {FLINT_VERSION}; "
            f"found {flint.__version__} / {flint.__FLINT_VERSION__}"
        )


@contextmanager
def flint_workprec(precision_bits: int, cap: int | None = None):
    """Save/restore both FLINT precisions and serialize this module's calls.

    Other users of the process-wide FLINT context must use the same lock/context
    or avoid simultaneous threads.  Independent worker processes are safe.
    """
    _require_backend()
    if isinstance(precision_bits, bool) or not isinstance(precision_bits, int) or precision_bits < 2:
        raise BallRequestError("working precision must be an integer of at least 2 bits")
    if cap is not None and (isinstance(cap, bool) or not isinstance(cap, int) or cap < 1):
        raise BallRequestError("series cap must be a positive integer")
    with _LOCK:
        old_precision, old_cap = ctx.prec, ctx.cap
        try:
            ctx.prec = precision_bits
            if cap is not None:
                ctx.cap = cap
            yield
        finally:
            ctx.cap = old_cap
            ctx.prec = old_precision


def arb_from_exact_component(value: Any):
    """Outward enclosure of one exact component in the current FLINT precision."""
    _require_backend()
    lower, upper = _component_bounds(value)
    left = arb(fmpq(lower.numerator, lower.denominator))
    if lower == upper:
        return left
    right = arb(fmpq(upper.numerator, upper.denominator))
    return left.union(right)


def _canonical_dyadic(mantissa: int, exponent: int) -> dict[str, str]:
    if mantissa == 0:
        return {"mantissa": "0", "exponent": "0"}
    trailing = (abs(mantissa) & -abs(mantissa)).bit_length() - 1
    return {"mantissa": str(mantissa >> trailing), "exponent": str(exponent + trailing)}


def _read_dyadic(value: Any) -> tuple[int, int]:
    if not isinstance(value, dict) or set(value) != {"mantissa", "exponent"}:
        raise BallRequestError("dyadic endpoint must have exactly mantissa and exponent")
    for key in ("mantissa", "exponent"):
        item = value[key]
        if not isinstance(item, str) or len(item) > MAX_INPUT_CHARACTERS or not _INTEGER.fullmatch(item):
            raise BallRequestError("dyadic mantissa/exponent must be canonical integer strings")
    mantissa, exponent = int(value["mantissa"]), int(value["exponent"])
    if abs(exponent) > MAX_DYADIC_SHIFT:
        raise BallRequestError("dyadic exponent exceeds the serialization budget")
    if value != _canonical_dyadic(mantissa, exponent):
        raise BallRequestError("noncanonical dyadic endpoint")
    return mantissa, exponent


def dyadic_to_fraction(value: Any) -> Fraction:
    """Decode a checked finite endpoint exactly; does not certify its provenance."""
    mantissa, exponent = _read_dyadic(value)
    return Fraction(mantissa << exponent) if exponent >= 0 else Fraction(mantissa, 1 << -exponent)


def _dyadic_from_exact_arb(value) -> dict[str, str]:
    mantissa, exponent = value.man_exp()
    result = _canonical_dyadic(int(mantissa), int(exponent))
    _read_dyadic(result)
    return result


def _dyadic_difference(upper: dict[str, str], lower: dict[str, str]) -> dict[str, str]:
    um, ue = _read_dyadic(upper)
    lm, le = _read_dyadic(lower)
    if um == 0:
        return _canonical_dyadic(-lm, le)
    if lm == 0:
        return _canonical_dyadic(um, ue)
    exponent = min(ue, le)
    if max(ue, le) - exponent > MAX_DYADIC_SHIFT:
        raise BallRequestError("dyadic width exceeds the serialization budget")
    return _canonical_dyadic((um << (ue - exponent)) - (lm << (le - exponent)), exponent)


def _tolerance_fraction(tolerance: Fraction | str | None) -> Fraction | None:
    if tolerance is None:
        return None
    value = tolerance if isinstance(tolerance, Fraction) else parse_exact_rational(tolerance)
    if value <= 0:
        raise BallRequestError("tolerance must be strictly positive")
    return value


def serialize_arb(value, tolerance: Fraction | str | None = None) -> dict[str, Any]:
    """Serialize directed dyadic endpoints and their exact full width.

    FLINT lower()/upper() round toward opposite infinities at the current
    precision; no decimal midpoint string is used as a certified endpoint.
    """
    _require_backend()
    tolerance_value = _tolerance_fraction(tolerance)
    if not isinstance(value, arb):
        raise BallRequestError("serialize_arb requires an actual arb value")
    if not value.is_finite():
        return {"kind": "nonfinite", "representation": str(value), "lower": None,
                "upper": None, "width": None, "exact": False, "containsZero": None,
                "toleranceMet": False if tolerance_value is not None else None}
    lower, upper = _dyadic_from_exact_arb(value.lower()), _dyadic_from_exact_arb(value.upper())
    width = _dyadic_difference(upper, lower)
    exact_width = dyadic_to_fraction(width)
    if exact_width < 0:
        raise ArithmeticError("backend returned reversed outward endpoints")
    return {"kind": "finite", "lower": lower, "upper": upper, "width": width,
            "exact": bool(value.is_exact()), "containsZero": bool(value.contains(0)),
            "toleranceMet": None if tolerance_value is None else exact_width <= tolerance_value}


def serialize_acb(value, tolerance: Fraction | str | None = None) -> dict[str, Any]:
    """Serialize an actual rectangular complex ball with a component-width test."""
    _require_backend()
    if not isinstance(value, acb):
        raise BallRequestError("serialize_acb requires an actual acb value")
    real, imag = serialize_arb(value.real, tolerance), serialize_arb(value.imag, tolerance)
    finite = real["kind"] == imag["kind"] == "finite"
    if finite:
        width = max((real["width"], imag["width"]), key=dyadic_to_fraction)
    else:
        width = None
    return {"kind": "finite" if finite else "nonfinite", "real": real, "imag": imag,
            "maxComponentWidth": width,
            "widthCriterion": "max(real full width, imaginary full width) <= tolerance",
            "toleranceMet": None if tolerance is None else bool(real["toleranceMet"] and imag["toleranceMet"])}


def _canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, ensure_ascii=True, separators=(",", ":"), allow_nan=False).encode("ascii")


def _seal(result: dict[str, Any]) -> dict[str, Any]:
    result["computationSha256"] = hashlib.sha256(_canonical_json(result)).hexdigest()
    return result


def _parse_request(request: Any) -> dict[str, Any]:
    if not isinstance(request, dict) or set(request) - _REQUEST_KEYS:
        raise BallRequestError("unknown request fields or non-object request")
    operation = request.get("operation")
    if not isinstance(operation, str):
        raise BallRequestError("operation must be a supported string")
    family = operation.removesuffix("_derivatives")
    if family not in _FUNCTIONS or operation not in {family, family + "_derivatives"}:
        raise BallRequestError("unsupported operation")
    s = request.get("s")
    if not isinstance(s, dict) or set(s) - {"real", "imag"} or "real" not in s:
        raise BallRequestError("s must contain real and optionally imag components")
    re_bounds, im_bounds = _component_bounds(s["real"]), _component_bounds(s.get("imag", "0"))
    bits, order = request.get("precisionBits", 192), request.get("derivativeOrder", 0)
    if isinstance(bits, bool) or not isinstance(bits, int) or not 16 <= bits <= MAX_PRECISION_BITS:
        raise BallRequestError(f"precisionBits must be an integer in [16,{MAX_PRECISION_BITS}]")
    if isinstance(order, bool) or not isinstance(order, int) or not 0 <= order <= MAX_DERIVATIVE_ORDER:
        raise BallRequestError(f"derivativeOrder must be an integer in [0,{MAX_DERIVATIVE_ORDER}]")
    tolerance = parse_exact_rational(request.get("tolerance", "1e-40"))
    if tolerance <= 0:
        raise BallRequestError("tolerance must be strictly positive")
    canonical = {"operation": operation,
                 "s": {name: {"lower": _fraction_string(bounds[0]), "upper": _fraction_string(bounds[1])}
                       for name, bounds in (("real", re_bounds), ("imag", im_bounds))},
                 "precisionBits": bits, "tolerance": _fraction_string(tolerance), "derivativeOrder": order}
    return {"canonical": canonical, "family": family, "allOrders": operation.endswith("_derivatives"),
            "re": re_bounds, "im": im_bounds, "bits": bits, "order": order, "tolerance": tolerance}


def _domain_check(parsed: dict[str, Any]) -> tuple[str | None, str | None]:
    real, imag, family = parsed["re"], parsed["im"], parsed["family"]
    if any(abs(endpoint) > MAX_COMPONENT_ABSOLUTE_VALUE for pair in (real, imag) for endpoint in pair):
        return "unsupported", "input magnitude exceeds the initial finite computation budget"
    if any(pair[1] - pair[0] > MAX_COMPONENT_WIDTH for pair in (real, imag)):
        return "unsupported", "wide input rectangle: subdivide each component to width <= 1/4"
    contains_real_axis = imag[0] <= 0 <= imag[1]
    if contains_real_axis and family == "zeta" and real[0] <= 1 <= real[1]:
        return "nonfinite", "requested rectangle contains the genuine simple pole of zeta at s=1"
    if contains_real_axis and family in {"gamma", "lgamma"}:
        left_integer = -((-real[0].numerator) // real[0].denominator)
        right_integer = real[1].numerator // real[1].denominator
        if left_integer <= min(0, right_integer):
            return "nonfinite", "requested rectangle contains a gamma pole at a nonpositive integer"
    if contains_real_axis and family == "lgamma" and real[0] <= 0:
        return "unsupported", "lgamma analytic branch requires a rectangle disjoint from (-infinity,0]"
    return None, None


def _evaluate_series(parsed: dict[str, Any], center):
    order, family = parsed["order"], parsed["family"]
    s = acb_series([center, acb(1)], prec=order + 1)
    if family == "xi":
        reflected = parsed["re"][1] < Fraction(1, 2)
        w = 1 - s if reflected else s
        # Exact identity with zeta's simple pole removed.  Reflection makes
        # Gamma(1+w/2) regular even at the negative even integers of s.
        result = (1 + w / 2).gamma() * (-w * arb.pi().log() / 2).exp()
        result *= 1 + (w - 1) * w.zeta(deflate=True)
        formula = {"normalization": "xi(s)=s*(s-1)*pi^(-s/2)*Gamma(s/2)*zeta(s)/2",
                   "evaluation": "Gamma(1+w/2)*exp(-w*log(pi)/2)*(1+(w-1)*zeta_deflated(w))",
                   "deflation": "zeta_deflated(w)=zeta(w)-1/(w-1)",
                   "w": "1-(s+x)" if reflected else "s+x", "reflectionUsed": reflected,
                   "removableValues": {"xi(0)": "1/2", "xi(1)": "1/2"}}
    elif family == "zeta_deflated":
        result = s.zeta(deflate=True)
        formula = {"evaluation": "acb_series.zeta(deflate=True)", "deflation": "zeta(s)-1/(s-1)"}
    else:
        result = getattr(s, family)()
        formula = {"evaluation": f"acb_series.{family}()"}
        if family == "lgamma":
            formula["branch"] = "analytic log-Gamma on C minus (-infinity,0], real on the positive axis"
            formula["isPrincipalLogOfGammaValue"] = False
    return result, formula


def evaluate(request: dict[str, Any]) -> dict[str, Any]:
    """Evaluate the strict JSON request and return a deterministic ball record.

    ``foo_derivatives`` returns orders 0..derivativeOrder; ``foo`` returns just
    the requested derivative.  ``status='finite'`` never implies toleranceMet.
    Malformed input raises BallRequestError.  Unsupported domains and genuine
    poles produce explicit records without fabricated finite endpoints.
    """
    parsed = _parse_request(request)
    _require_backend()
    result: dict[str, Any] = {
        "schema": SCHEMA, "request": parsed["canonical"],
        "backend": {"pythonFlint": flint.__version__, "FLINT": flint.__FLINT_VERSION__,
                    "FLINTRelease": int(flint.__FLINT_RELEASE__), "arithmetic": "Arb/ACB balls"},
        "precisionBits": parsed["bits"], "tolerance": _fraction_string(parsed["tolerance"]),
        "status": None, "reason": None, "toleranceMet": False,
        "inputBall": None, "formula": None, "derivatives": [], "value": None,
        "errorAccounting": {
            "totalEnclosure": "certified real/imaginary dyadic endpoints of the FLINT output ball",
            "widthCriterion": "each full component width <= exact requested tolerance",
            "inputConversionAndPropagationIncluded": True,
            "internalRoundingBound": None, "internalTruncationBound": None,
            "internalSplitStatus": "not exposed separately by the pinned python-flint API",
            "taylorCoefficientMeaning": "coefficient of x^k in f(s+x) multiplied by exact k!",
            "finiteDisplacementTaylorRemainder": None,
            "finiteDisplacementTaylorRemainderStatus": "not requested or certified by this operation"},
        "scope": {"actualBackendExecution": False, "rigorousEnclosure": False,
                  "normalizedRiemannXi": parsed["family"] == "xi", "zeroCounting": False,
                  "allP7Complete": False, "RiemannHypothesisProof": False, "BSDProof": False},
    }
    status, reason = _domain_check(parsed)
    if status is not None:
        result.update(status=status, reason=reason)
        return _seal(result)
    with flint_workprec(parsed["bits"], parsed["order"] + 1):
        center = acb(arb_from_exact_component(parsed["canonical"]["s"]["real"]),
                     arb_from_exact_component(parsed["canonical"]["s"]["imag"]))
        result["inputBall"] = serialize_acb(center)
        series, formula = _evaluate_series(parsed, center)
        result["formula"] = formula
        orders = range(parsed["order"] + 1) if parsed["allOrders"] else (parsed["order"],)
        rows = []
        for order in orders:
            factor = math.factorial(order)
            ball = serialize_acb(series[order] * factor, parsed["tolerance"])
            rows.append({"order": order, "taylorCoefficientMultiplier": str(factor), "ball": ball})
        finite = all(row["ball"]["kind"] == "finite" for row in rows)
        result.update(status="finite" if finite else "nonfinite", derivatives=rows,
                      value=rows[0]["ball"] if len(rows) == 1 else None,
                      toleranceMet=finite and all(row["ball"]["toleranceMet"] for row in rows))
        if not finite:
            result["reason"] = "FLINT returned a nonfinite enclosure; no finite accuracy claim is made"
        elif not result["toleranceMet"]:
            result["reason"] = "certified output is wider than requested; increase precision or subdivide input"
        result["scope"].update(actualBackendExecution=True, rigorousEnclosure=finite)
    return _seal(result)


def replay_evaluation(record: dict[str, Any]) -> dict[str, Any]:
    """Recompute a saved request and compare the complete deterministic result.

    A SHA by itself is not a source certificate.  This function re-evaluates
    the request and rejects altered endpoints, flags or widths.  A domain-only
    rejection is recomputed without executing a FLINT special function.
    """
    if not isinstance(record, dict) or record.get("schema") != SCHEMA:
        raise BallRequestError("not a P7 ball evaluation record")
    digest = record.get("computationSha256")
    payload = {key: value for key, value in record.items() if key != "computationSha256"}
    if not isinstance(digest, str) or hashlib.sha256(_canonical_json(payload)).hexdigest() != digest:
        raise BallRequestError("saved evaluation content hash mismatch")
    actual = evaluate(record.get("request"))
    if _canonical_json(actual) != _canonical_json(record):
        raise BallRequestError("saved evaluation does not match a fresh pinned-backend computation")
    return {"schema": "MathScope.M3.P7.BallReplay/1", "matches": True,
            "computationSha256": digest, "evaluationRecomputed": True,
            "backendRecomputed": actual["scope"]["actualBackendExecution"]}
