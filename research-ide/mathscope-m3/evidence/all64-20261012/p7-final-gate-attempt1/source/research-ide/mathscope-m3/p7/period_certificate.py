"""Certified real elliptic period by exact root isolation and bounded integration.

Complete the square and translate x to write Y²=X³+A X+B while preserving
dx/(2y+a1*x+a3)=dX/(2Y). If r is the largest real root, the period of the
identity component is I=integral_r^infinity dX/sqrt(X³+A X+B). Substituting
X=r+(t/(1-t))² removes both endpoint singularities:

I=integral_0^1 2/sqrt(t^4+3*r*t²*(1-t)²+(3*r²+A)*(1-t)^4) dt.

The full real period integral_E(R)|omega| is I for negative discriminant
and 2I for positive discriminant. Root isolation uses exact Sturm variations;
the complex-ball integrator must verify its square-root analytic branch.
"""
from __future__ import annotations

from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path

from . import ball_backend as balls
from .elliptic_local import as_curve, weierstrass_invariants, _rational_text

SCHEMA = "MathScope.M3.P7.RealPeriodCertificate/1"


def _trim(a):
    a = list(a)
    while a and a[-1] == 0:
        a.pop()
    return a


def _remainder(a, b):
    a, b = _trim(a), _trim(b)
    if not b:
        raise ArithmeticError("Division by the zero Sturm polynomial")
    while len(a) >= len(b):
        factor, shift = a[-1]/b[-1], len(a)-len(b)
        for i, coefficient in enumerate(b):
            a[i+shift] -= factor*coefficient
        a = _trim(a)
    return a


def _value(poly, x):
    out = Fraction(0)
    for coefficient in reversed(poly):
        out = out*x + coefficient
    return out


def _sturm(a, b):
    sequence = [[b, a, Fraction(0), Fraction(1)], [a, Fraction(0), Fraction(3)]]
    while True:
        remainder = _remainder(sequence[-2], sequence[-1])
        if not remainder:
            break
        sequence.append([-value for value in remainder])
    if len(sequence[-1]) != 1:
        raise ValueError("The period cubic is not squarefree")
    return sequence


def _variations(sequence, x):
    signs = [(1 if value > 0 else -1) for value in (_value(poly, x) for poly in sequence) if value]
    return sum(left != right for left, right in zip(signs, signs[1:]))


def isolate_largest_real_root(a, b, precision_bits):
    a, b = Fraction(a), Fraction(b)
    sequence = _sturm(a, b)
    magnitude = 2 + max(abs(a.numerator)//a.denominator, abs(b.numerator)//b.denominator)
    low, high = Fraction(-magnitude), Fraction(magnitude)
    total = _variations(sequence, low)-_variations(sequence, high)
    if total not in (1, 3):
        raise ArithmeticError("Unexpected real-root count for a squarefree real cubic")
    tolerance = Fraction(1, 2**precision_bits)
    steps = 0
    while high-low > tolerance:
        middle = (low+high)/2
        right_count = _variations(sequence, middle)-_variations(sequence, high)
        at_middle = _value(sequence[0], middle)
        if right_count:
            low = middle
        elif at_middle == 0:
            low = high = middle
        else:
            high = middle
        steps += 1
        if steps > precision_bits + 512:
            raise ValueError("Largest-root isolation exceeded its bisection budget")
    if low != high and _variations(sequence, low)-_variations(sequence, high) != 1:
        raise ArithmeticError("The final interval does not isolate the largest real root")
    return {
        "polynomial": [_rational_text(x) for x in sequence[0]],
        "sturmSequence": [[_rational_text(x) for x in row] for row in sequence],
        "initialCauchyBound": magnitude, "allRealRootCount": total,
        "lower": _rational_text(low), "upper": _rational_text(high),
        "rationalRootExact": low == high, "bisectionSteps": steps,
        "largestRealRootIsolated": True,
    }


def real_period_certificate(model, *, precision_bits=192):
    if type(precision_bits) is not int or not 64 <= precision_bits <= 4096:
        raise ValueError("precisionBits must be an integer in [64,4096]")
    curve = as_curve(model)
    inv = weierstrass_invariants(curve)
    a, b = -inv["c4"]/48, -inv["c6"]/864
    isolation = isolate_largest_real_root(a, b, precision_bits+32)
    low, high = Fraction(isolation["lower"]), Fraction(isolation["upper"])
    components = 2 if inv["Delta"] > 0 else 1
    calls = {"all": 0, "analytic": 0}
    with balls.flint_workprec(precision_bits):
        midpoint, radius = (low+high)/2, (high-low)/2
        r = balls.arb(balls.fmpq(midpoint.numerator, midpoint.denominator),
                      balls.arb(balls.fmpq(radius.numerator, radius.denominator)).upper())
        aa = balls.arb(balls.fmpq(a.numerator, a.denominator))
        derivative = 3*r*r + aa
        if not bool(derivative > 0):
            raise ArithmeticError("The largest real root has no certified positive derivative")

        def integrand(t, analytic):
            calls["all"] += 1
            calls["analytic"] += bool(analytic)
            complement = 1-t
            radicand = t**4 + 3*r*t*t*complement*complement + derivative*complement**4
            return 2/radicand.sqrt(analytic=analytic)

        goal = balls.arb(2)**(-precision_bits+24)
        integral = balls.acb.integral(integrand, 0, 1, abs_tol=goal, rel_tol=goal,
                                     deg_limit=128, eval_limit=100_000, depth_limit=64)
        if not integral.is_finite() or not integral.imag.contains(0) or not bool(integral.real > 0):
            raise ArithmeticError("The real period integral did not yield a finite positive certified enclosure")
        component_period = balls.serialize_arb(integral.real)
        full_period = balls.serialize_arb(components*integral.real)
        root_ball = balls.serialize_arb(r)
        derivative_ball = balls.serialize_arb(derivative)
    source_names = ("period_certificate.py", "elliptic_local.py", "ball_backend.py")
    result = {
        "schema": SCHEMA, "modelHash": curve.model_hash,
        "request": {"model": [_rational_text(x) for x in curve.ainvs], "precisionBits": precision_bits},
        "completedSquareAndTranslation": {"A": _rational_text(a), "B": _rational_text(b),
                                          "X": "x+b2/12", "Y": "y+(a1*x+a3)/2",
                                          "invariantDifferential": "dx/(2y+a1*x+a3)=dX/(2Y)"},
        "largestRootIsolation": isolation, "largestRootBall": root_ball,
        "positiveDerivativeAtLargestRoot": derivative_ball,
        "identityComponentPeriod": component_period,
        "realConnectedComponents": components, "realPeriodOmega": full_period,
        "normalization": "Omega=integral over all E(R) of |dx/(2y+a1*x+a3)|; use a global minimal equation for the BSD period",
        "integral": {"interval": ["0", "1"],
                     "integrand": "2/sqrt(t^4+3*r*t^2*(1-t)^2+(3*r^2+A)*(1-t)^4)",
                     "substitution": "X=r+(t/(1-t))^2",
                     "endpointSingularitiesRemoved": True, "analyticBranchFlagForwarded": True,
                     "algorithm": "FLINT acb_calc_integrate via python-flint acb.integral",
                     "evaluationBudget": 100_000, "depthBudget": 64, "degreeBudget": 128,
                     "observedCalls": calls},
        "backend": {"pythonFlint": balls.BACKEND_VERSION, "FLINT": balls.FLINT_VERSION},
        "sourceSha256": {name: sha256((Path(__file__).parent/name).read_bytes()).hexdigest() for name in source_names},
        "scope": {"certifiedRealPeriod": True, "ManinConstantAssumed": False,
                  "shaComputed": False, "bsdEqualityProved": False, "formalLeanProofIssued": False},
    }
    result["computationSha256"] = sha256(json.dumps(result, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()).hexdigest()
    return result
