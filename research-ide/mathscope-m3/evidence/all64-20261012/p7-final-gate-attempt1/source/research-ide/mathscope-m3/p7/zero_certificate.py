"""A finite, executed zero certificate at height 20 or 30.

This is a separate counting algorithm from FLINT's zero-list/Turing routines,
but uses the same FLINT ball arithmetic and zeta evaluator.  It proves a
continuous argument on every *whole* contour segment by enclosing a positive
two-dimensional tube in a right half-plane after division by the starting
zeta value.  Point samples alone are never accepted as a contour certificate.

The returned JSON is numerical evidence, not an independently checked formal
kernel proof, and it never asserts the unrestricted Riemann hypothesis.
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import json
from time import monotonic
from typing import Any

from .ball_backend import (
    BallBackendUnavailable,
    BallRequestError,
    arb_from_exact_component,
    dyadic_to_fraction,
    flint_workprec,
    parse_exact_rational,
    serialize_acb,
    serialize_arb,
)

try:
    import flint
    from flint import acb, arb
except ImportError:
    flint = None


SCHEMA = "MathScope.P7.FiniteZeroCertificate/1"
ALGORITHM = "whole-tube-right-half-plane-contour-winding/1"
SUPPORTED_HEIGHTS = (Fraction(20), Fraction(30))
DEFAULTS = {
    "height": "20",
    "precisionBits": 192,
    "tolerance": "1e-30",
    "maxCells": 16384,
    "maxDepth": 24,
    "maxEvaluations": 100000,
    "timeoutSeconds": 45,
}
_ROOT_SEARCH_BOXES = ((14, 15), (21, 22), (25, 26))
_SOURCES = [
    "https://dlmf.nist.gov/25.10",
    "https://dlmf.nist.gov/25.4",
    "https://dlmf.nist.gov/25.2",
    "https://python-flint.readthedocs.io/en/latest/acb.html",
    "https://python-flint.readthedocs.io/en/latest/arb.html",
    "https://flintlib.org/doc/acb_dirichlet.html",
]


class _Unresolved(RuntimeError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def _qstr(value: Fraction) -> str:
    return str(value.numerator) if value.denominator == 1 else f"{value.numerator}/{value.denominator}"


def _point_json(point: tuple[Fraction, Fraction]) -> dict[str, str]:
    return {"real": _qstr(point[0]), "imag": _qstr(point[1])}


def _point(point: tuple[Fraction, Fraction]):
    return acb(arb_from_exact_component(_qstr(point[0])), arb_from_exact_component(_qstr(point[1])))


def _request(request: Any) -> tuple[dict[str, Any], Fraction, Fraction]:
    if not isinstance(request, dict) or set(request) - set(DEFAULTS):
        raise BallRequestError("expected a request with only the documented zero-certificate fields")
    config = {**DEFAULTS, **request}
    height = parse_exact_rational(config["height"])
    tolerance = parse_exact_rational(config["tolerance"])
    if height not in SUPPORTED_HEIGHTS:
        raise BallRequestError("this first finite certificate supports exactly height '20' or '30'")
    if not 0 < tolerance <= Fraction(1, 16):
        raise BallRequestError("tolerance must be an exact positive string at most 1/16")
    ranges = {
        "precisionBits": (32, 4096),
        "maxCells": (1, 32768),
        "maxDepth": (0, 32),
        "maxEvaluations": (1, 200000),
        "timeoutSeconds": (1, 60),
    }
    for name, (lower, upper) in ranges.items():
        value = config[name]
        if isinstance(value, bool) or not isinstance(value, int) or not lower <= value <= upper:
            raise BallRequestError(f"{name} must be an integer in [{lower}, {upper}]")
    config["height"], config["tolerance"] = _qstr(height), _qstr(tolerance)
    return config, height, tolerance


class _Budget:
    def __init__(self, config: dict[str, Any]):
        self.config = config
        self.deadline = monotonic() + config["timeoutSeconds"]
        self.evaluations = 0
        self.accepted_cells = 0
        self.rejected_cells = 0
        self.maximum_depth = 0

    def check(self) -> None:
        if monotonic() >= self.deadline:
            raise _Unresolved("TIME_BUDGET", "the bounded numerical deadline was reached")

    def evaluate(self) -> None:
        self.check()
        if self.evaluations >= self.config["maxEvaluations"]:
            raise _Unresolved("EVALUATION_BUDGET", "the declared evaluation budget was exhausted")
        self.evaluations += 1

    def stats(self) -> dict[str, Any]:
        return {
            "evaluationRequests": self.evaluations,
            "acceptedContourCells": self.accepted_cells,
            "rejectedContourCells": self.rejected_cells,
            "maximumSubdivisionDepth": self.maximum_depth,
            "evaluationBudgetUnit": "one zeta, Hardy-Z composite, or FLINT list/count request",
        }


def _finite_complex(value) -> bool:
    return bool(value.real.is_finite() and value.imag.is_finite())


def _segment_tube(a: tuple[Fraction, Fraction], b: tuple[Fraction, Fraction]):
    """A strictly padded rational rectangle containing the closed segment.

    Padding is one eighth of the largest half-length, in both coordinates.
    All outer endpoints are formed as exact rationals, then enclosed outward.
    Therefore even a horizontal or vertical segment has a genuine open
    neighbourhood inside its tube.  This is not a zero-width sample grid.
    """
    middle = tuple((x + y) / 2 for x, y in zip(a, b))
    radius = tuple(abs(x - y) / 2 for x, y in zip(a, b))
    padding = max(radius) / 8
    if padding <= 0:
        raise ValueError("a contour segment must have positive length")
    components = [
        {"lower": _qstr(m - r - padding), "upper": _qstr(m + r + padding)}
        for m, r in zip(middle, radius)
    ]
    box = acb(*(arb_from_exact_component(c) for c in components))
    return box, {"real": components[0], "imag": components[1], "padding": _qstr(padding)}


def _branch_tube_test(tube, start_value):
    """Return the actual enclosing images only if the whole tube is certified.

    zeta is meromorphic with its sole pole at 1.  Excluding that point proves
    holomorphy on this tube and an open neighbourhood of the segment.  A
    strictly positive real part for zeta(tube)/zeta(a) fixes one continuous
    logarithm on the whole segment and makes its endpoint argument valid.
    """
    if tube.contains(1):
        return None
    zeta_tube = tube.zeta()
    if not _finite_complex(zeta_tube) or zeta_tube.contains(0):
        return None
    if not _finite_complex(start_value) or start_value.contains(0):
        return None
    quotient_tube = zeta_tube / start_value
    if not _finite_complex(quotient_tube) or not quotient_tube.real > 0:
        return None
    absolute_lower = zeta_tube.abs_lower()
    if not absolute_lower > 0:
        return None
    return zeta_tube, quotient_tube, absolute_lower


def _contour(height: Fraction, tolerance: Fraction, budget: _Budget, out: dict[str, Any]):
    vertices = [(-Fraction(1), -height), (Fraction(2), -height),
                (Fraction(2), height), (-Fraction(1), height)]
    edge_names = ("bottom", "right", "top", "left")
    cells: list[dict[str, Any]] = []
    out.update({
        "algorithm": ALGORITHM,
        "orientation": "counterclockwise",
        "vertices": [_point_json(v) for v in vertices],
        "wholeSegmentCoverage": False,
        "cells": cells,
        "poleCountInsideRectangle": 1,
        "pole": {"real": "1", "imag": "0", "order": 1},
        "trivialZerosInsideRectangle": 0,
        "branchJustification": "Re(zeta(tube)/zeta(start)) > 0 on every padded whole-segment tube",
        "sampledNonzeroIsInsufficient": True,
    })
    cache: dict[tuple[Fraction, Fraction], Any] = {}
    arguments = []

    def endpoint(p):
        if p not in cache:
            budget.evaluate()
            cache[p] = _point(p).zeta()
        return cache[p]

    def visit(a, b, edge, depth):
        budget.check()
        budget.maximum_depth = max(budget.maximum_depth, depth)
        tube, exact_tube = _segment_tube(a, b)
        start = endpoint(a)
        # Count attempted tube evaluations even if a pole enclosure rejects it.
        budget.evaluate()
        branch = _branch_tube_test(tube, start)
        if branch is not None:
            zeta_tube, quotient_tube, absolute_lower = branch
            end = endpoint(b)
            endpoint_quotient = end / start
            increment = endpoint_quotient.arg()
            if (not _finite_complex(end) or not _finite_complex(endpoint_quotient)
                    or not endpoint_quotient.real > 0 or not increment.is_finite()):
                branch = None
            else:
                if budget.accepted_cells >= budget.config["maxCells"]:
                    raise _Unresolved("CELL_BUDGET", "the declared contour-cell budget was exhausted")
                budget.accepted_cells += 1
                arguments.append(increment)
                cells.append({
                    "edge": edge, "depth": depth, "start": _point_json(a), "end": _point_json(b),
                    "exactTube": exact_tube,
                    "tube": serialize_acb(tube),
                    "zetaTube": serialize_acb(zeta_tube),
                    "zetaStart": serialize_acb(start),
                    "zetaEnd": serialize_acb(end),
                    "quotientTube": serialize_acb(quotient_tube),
                    "zetaAbsoluteLower": serialize_arb(absolute_lower),
                    "quotientRealLower": serialize_arb(quotient_tube.real.lower()),
                    "endpointQuotient": serialize_acb(endpoint_quotient),
                    "argumentIncrement": serialize_arb(increment),
                    "holomorphicOnWholeTube": True,
                    "nonzeroOnWholeTube": True,
                    "continuousArgumentBranch": True,
                })
                return
        budget.rejected_cells += 1
        if depth >= budget.config["maxDepth"]:
            raise _Unresolved("SUBDIVISION_DEPTH", "a whole-segment branch could not be certified at maxDepth")
        middle = tuple((x + y) / 2 for x, y in zip(a, b))
        visit(a, middle, edge, depth + 1)
        visit(middle, b, edge, depth + 1)

    for a, b, edge in zip(vertices, vertices[1:] + vertices[:1], edge_names):
        visit(a, b, edge, 0)
    # Besides construction, explicitly verify the stored exact path coverage.
    if not cells or cells[0]["start"] != _point_json(vertices[0]) or cells[-1]["end"] != cells[0]["start"]:
        raise _Unresolved("CONTOUR_COVERAGE", "the stored contour did not close")
    if any(a["end"] != b["start"] for a, b in zip(cells, cells[1:])):
        raise _Unresolved("CONTOUR_COVERAGE", "the stored contour has a gap")
    out["wholeSegmentCoverage"] = True
    argument_sum = sum(arguments, arb(0))
    winding = argument_sum / (2 * arb.pi())
    winding_serialized = serialize_arb(winding, tolerance)
    out["argumentSum"] = serialize_arb(argument_sum)
    out["windingInterval"] = winding_serialized
    out["windingWidthTolerance"] = _qstr(tolerance)
    integer = winding.unique_fmpz() if winding.is_finite() else None
    if integer is None or not winding_serialized["toleranceMet"]:
        raise _Unresolved("WINDING_WIDTH", "the actual winding interval did not isolate one integer at the requested width")
    integer = int(integer)
    zero_count = integer + 1
    if zero_count < 0 or zero_count % 2:
        raise _Unresolved("COUNT_PARITY", "the contour count was incompatible with the required conjugate-pair saturation")
    out.update({"windingInteger": integer, "zeroCountIncludingMultiplicity": zero_count,
                "positiveHeightCountCandidate": zero_count // 2,
                "argumentPrincipleEquation": "W = number_of_zeros - 1 = 2*N(T) - 1"})
    return zero_count // 2


def _hardy_z(t: Fraction, budget: _Budget):
    budget.evaluate()
    t_ball = arb_from_exact_component(_qstr(t))
    theta = acb(arb_from_exact_component("1/4"), t_ball / 2).lgamma().imag - t_ball * arb.pi().log() / 2
    value = acb(0, theta).exp() * acb(arb_from_exact_component("1/2"), t_ball).zeta()
    if not _finite_complex(value) or not value.imag.contains(0):
        raise _Unresolved("HARDY_Z_EVALUATION", "the actual Hardy-Z evaluation was nonfinite or inconsistent with reality")
    return value.real


def _sign(value) -> int:
    return 1 if value > 0 else -1 if value < 0 else 0


def _root_bracket(a: Fraction, b: Fraction, tolerance: Fraction, budget: _Budget) -> dict[str, Any]:
    za, zb = _hardy_z(a, budget), _hardy_z(b, budget)
    sa, sb = _sign(za), _sign(zb)
    if not sa * sb == -1:
        raise _Unresolved("HARDY_SIGN", "the actual candidate endpoints did not certify opposite Hardy-Z signs")
    initial = {"lower": _qstr(a), "upper": _qstr(b),
               "hardyLower": serialize_arb(za), "hardyUpper": serialize_arb(zb)}
    iterations = 0
    # Width is a separate gate, not inferred from the working precision.
    while b - a > tolerance / 4:
        middle = (a + b) / 2
        zm = _hardy_z(middle, budget)
        sm = _sign(zm)
        if sm == 0:
            raise _Unresolved("HARDY_SIGN_PRECISION", "a bisection sign was unresolved at the requested working precision")
        if sm == sa:
            a, za, sa = middle, zm, sm
        else:
            b, zb, sb = middle, zm, sm
        iterations += 1
    root_box = acb(arb_from_exact_component("1/2"),
                   arb_from_exact_component({"lower": _qstr(a), "upper": _qstr(b)}))
    serialized = serialize_acb(root_box, tolerance)
    left_value, right_value = serialize_arb(za, tolerance), serialize_arb(zb, tolerance)
    if not serialized["toleranceMet"] or not left_value["toleranceMet"] or not right_value["toleranceMet"]:
        raise _Unresolved("ROOT_WIDTH", "a root enclosure or its actual endpoint evaluation exceeded the requested width")
    budget.evaluate()
    zeta_image = root_box.zeta()
    if not _finite_complex(zeta_image) or not zeta_image.contains(0):
        raise _Unresolved("ROOT_IMAGE_CONSISTENCY", "the evaluated image contradicted the independently established sign bracket")
    return {
        "initialSearchBracket": initial,
        "lower": _qstr(a), "upper": _qstr(b), "bracketWidth": _qstr(b - a),
        "rootEnclosure": serialized,
        "hardyLower": left_value, "hardyUpper": right_value,
        "lowerSign": sa, "upperSign": sb, "oppositeSigns": True,
        "existenceMethod": "continuity of real Hardy Z and actual opposite endpoint signs",
        "zetaImageAtBracket": serialize_acb(zeta_image),
        "imageContainsZeroUsedForExistence": False,
        "bisectionSteps": iterations,
    }


def _flint_observations(height: Fraction, roots: list[dict[str, Any]], tolerance: Fraction,
                        budget: _Budget) -> dict[str, Any]:
    budget.evaluate()
    counted = arb_from_exact_component(_qstr(height)).zeta_nzeros()
    counted_json = serialize_arb(counted, tolerance)
    counted_integer = counted.unique_fmpz() if counted.is_finite() else None
    budget.evaluate()
    listed = acb.zeta_zeros(1, len(roots))
    entries = []
    for index, (zero, bracket) in enumerate(zip(listed, roots), start=1):
        item = serialize_acb(zero, tolerance)
        interval = arb_from_exact_component({"lower": bracket["lower"], "upper": bracket["upper"]})
        matches = bool(_finite_complex(zero) and zero.real == arb_from_exact_component("1/2")
                       and interval.contains(zero.imag))
        entries.append({"index": index, "zero": item, "containedInSignBracket": matches})
    count_matches = counted_integer is not None and int(counted_integer) == len(roots)
    passed = bool(counted_json["toleranceMet"] and count_matches and len(entries) == len(roots)
                  and all(row["zero"]["toleranceMet"] and row["containedInSignBracket"] for row in entries))
    return {
        "count": counted_json,
        "countInteger": int(counted_integer) if counted_integer is not None else None,
        "listedZeros": entries,
        "pass": passed,
        "listAndCountIndependent": False,
        "reason": "FLINT zero isolation and zeta_nzeros use related Gram/Turing counting mechanisms",
        "contourUsesTheseRoutines": False,
        "sharedArithmeticAndZetaBackendWithContour": True,
        "listedBallInclusionIsNotOurExistenceProof": True,
    }


def _seal(result: dict[str, Any]) -> dict[str, Any]:
    encoded = json.dumps(result, ensure_ascii=True, sort_keys=True, separators=(",", ":"), allow_nan=False)
    result["computationSha256"] = hashlib.sha256(encoded.encode("ascii")).hexdigest()
    return result


def certify_zeros(request: dict[str, Any]) -> dict[str, Any]:
    """Execute a bounded finite certificate and return deterministic JSON.

    The wall-clock budget is operational only; elapsed time/timestamps belong
    in the caller's external process receipt.  Failure, exhausted budgets, or
    insufficient actual widths return UNRESOLVED with no finite-RH claim.
    Serialized output is evidence and must never be treated as a private
    authentication token on replay; the caller should rerun this function.
    """
    result: dict[str, Any] = {
        "schema": SCHEMA, "status": "UNRESOLVED", "pass": False,
        "request": None, "contour": {}, "hardyRoots": [], "flintObservations": None,
        "checks": [],
        "scope": {
            "finiteHeightOnly": True, "globalRHProved": False, "formalKernelProof": False,
            "finiteRHToRequestedHeight": False,
            "algorithmIndependentOfFlintZeroCounting": True,
            "independentSoftwareImplementation": False,
            "arithmeticBackendShared": True,
            "serializedReceiptAuthenticatesNewComputation": False,
            "completeP7Milestone": False,
        },
        "mathematicalDependencies": [
            "zeta is meromorphic with its only pole, simple, at 1",
            "the argument principle counts zeros with multiplicity minus poles",
            "a right-half-plane quotient on a whole segment has one continuous argument branch",
            "Hardy Z(t)=exp(i theta(t))*zeta(1/2+it) is continuous and real for real t",
            "complex conjugation pairs the positive and negative nonreal zeta zeros",
            "all nontrivial zeta zeros are in 0<Re(s)<1; trivial zeros are -2,-4,...",
        ],
        "primarySources": _SOURCES,
    }
    budget = None
    try:
        config, height, tolerance = _request(request)
        result["request"] = config
        budget = _Budget(config)
        with flint_workprec(config["precisionBits"]):
            result["backend"] = {"pythonFlint": flint.__version__, "FLINT": flint.__FLINT_VERSION__}
            count = _contour(height, tolerance, budget, result["contour"])
            result["checks"].append({"name": "wholeContourAndUniqueInteger", "pass": True})
            boxes = [(Fraction(a), Fraction(b)) for a, b in _ROOT_SEARCH_BOXES if Fraction(b) < height]
            # These are candidate search boxes, never a hard-coded zero count.
            for a, b in boxes:
                result["hardyRoots"].append(_root_bracket(a, b, tolerance, budget))
            roots = result["hardyRoots"]
            disjoint = all(parse_exact_rational(a["upper"]) < parse_exact_rational(b["lower"])
                           for a, b in zip(roots, roots[1:]))
            saturation = count == len(roots) and disjoint and all(root["oppositeSigns"] for root in roots)
            if not saturation:
                raise _Unresolved("COUNT_SATURATION", "the disjoint sign brackets did not exhaust the actual contour zero count")
            for index, root in enumerate(roots, start=1):
                root["positiveZeroIndex"] = index
                root["uniqueAndSimpleByTotalCount"] = True
            result["checks"].append({"name": "disjointCriticalLineBracketsExhaustCount", "pass": True})
            observations = _flint_observations(height, roots, tolerance, budget)
            result["flintObservations"] = observations
            if not observations["pass"]:
                raise _Unresolved("FLINT_CROSSCHECK", "the finite list/count observations did not agree at the required widths")
            result["checks"].append({"name": "relatedFlintListAndCountAgree", "pass": True})
            budget.check()
            result["status"] = "FINITE_RH_TO_T"
            result["pass"] = True
            result["positiveZeroCount"] = count
            result["scope"]["finiteRHToRequestedHeight"] = True
            result["scope"]["heightInterval"] = {"lower": "0", "upper": _qstr(height),
                                                "lowerOpen": True, "upperClosed": True}
            result["scope"]["upperBoundaryZeroFreeByWholeContour"] = True
            result["countSaturation"] = {
                "positiveSignBrackets": len(roots), "conjugateNegativeBrackets": len(roots),
                "zerosInRectangleWithMultiplicity": 2 * count,
                "remainingZerosInRectangle": 0,
                "conclusion": "all zeros with 0<Im(s)<=height are the simple critical-line zeros in the recorded brackets",
            }
    except (BallRequestError, ValueError, TypeError) as error:
        result["failure"] = {"code": "INVALID_REQUEST", "message": str(error)}
    except BallBackendUnavailable as error:
        result["failure"] = {"code": "BACKEND_UNAVAILABLE", "message": str(error)}
    except _Unresolved as error:
        result["failure"] = {"code": error.code, "message": str(error)}
    except (ArithmeticError, RuntimeError, OverflowError) as error:
        result["failure"] = {"code": "NUMERICAL_FAILURE", "message": str(error)}
    if budget is not None:
        result["statistics"] = budget.stats()
    return _seal(result)
