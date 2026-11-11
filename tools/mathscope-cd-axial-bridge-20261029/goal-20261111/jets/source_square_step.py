"""Outward rational enclosures for the original square-seed step and its jets."""
from fractions import Fraction as Q
from functools import lru_cache
from math import comb, isqrt

from certified_bounded_transcendentals import exp_positive_bounded
from rigorous_rational_intervals import Interval, UncertifiedExpression


def point(value):
    q = Q(value)
    return Interval(q, q)


def round_out(interval, bits=128):
    scale = 1 << bits
    lo = (interval.lo * scale).__floor__()
    hi = (interval.hi * scale).__ceil__()
    return Interval(Q(lo, scale), Q(hi, scale))


@lru_cache(maxsize=8192)
def bounded_exp(q):
    """Certified exp on [-64, 64], using the existing kernel on [-16, 16]."""
    return round_out(exp_positive_bounded(point(q / 4), terms=24).power(4))


@lru_cache(maxsize=13)
def seed_polynomial(order):
    """P_n(y) with g^(n)(x)=P_n(1/x) exp(-1/x^2)."""
    coefficients = {0: 1}
    for _ in range(order):
        nxt = {}
        for k, coefficient in coefficients.items():
            nxt[k + 3] = nxt.get(k + 3, 0) + 2 * coefficient
            if k:
                nxt[k + 1] = nxt.get(k + 1, 0) - k * coefficient
        coefficients = {k: v for k, v in nxt.items() if v}
    return tuple(sorted(coefficients.items()))


def sqrt_bracket(q, bits=96):
    scale = 1 << bits
    n = isqrt(q.numerator * scale * scale // q.denominator)
    lower = Q(n, scale)
    return Interval(lower, lower if lower * lower == q else Q(n + 1, scale))


@lru_cache(maxsize=64)
def critical_value(k):
    q = Q(k, 2)
    return round_out(sqrt_bracket(q).power(k) * bounded_exp(-q))


def monomial_at(y, k):
    # For y>=8, y^k exp(-y²) is decreasing for every k<=36.
    if y is None:
        return point(0)
    if y > 8:
        return Interval(Q(0), (point(8**k) * bounded_exp(Q(-64))).hi)
    return round_out(point(y**k) * bounded_exp(-y*y))


def monomial_range(ylo, yhi, k):
    ends = (monomial_at(ylo, k), monomial_at(yhi, k))
    upper = max(v.hi for v in ends)
    critical_square = Q(k, 2)
    if k and ylo*ylo <= critical_square and (yhi is None or critical_square <= yhi*yhi):
        upper = max(upper, critical_value(k).hi)
    return Interval(min(v.lo for v in ends), upper)


def seed_jet(x, order):
    if x.hi <= 0:
        return point(0)
    ylo = 1 / x.hi
    yhi = 1 / x.lo if x.lo > 0 else None
    result = point(0)
    for k, coefficient in seed_polynomial(order):
        result += point(coefficient) * monomial_range(ylo, yhi, k)
    return round_out(result)


def square_step_jet(x, order):
    """Enclose d^order/dx^order of sigma for an exact rational closed interval."""
    if not isinstance(x, Interval) or not all(isinstance(q, Q) for q in (x.lo, x.hi)):
        raise UncertifiedExpression('Exact rational input interval required')
    if type(order) is not int or not 0 <= order <= 12:
        raise UncertifiedExpression('Original source step supports orders 0..12')
    if x.hi <= 0 or x.lo >= 1:
        return point(int(order == 0 and x.lo >= 1))
    if x.lo == x.hi == Q(1, 2):
        if order == 0:
            return point(Q(1, 2))
        if order == 1:
            return point(8)
        if order % 2 == 0:
            return point(0)

    interior = Interval(max(Q(0), x.lo), min(Q(1), x.hi))
    reflected = point(1) - interior
    g = [seed_jet(interior, n) for n in range(order + 1)]
    denominator = [g[n] + point((-1)**n) * seed_jet(reflected, n) for n in range(order + 1)]
    # At least one seed argument is >=1/2, so its value is >=exp(-4).
    denominator[0] = Interval(max(denominator[0].lo, bounded_exp(Q(-4)).lo), denominator[0].hi)
    sigma = []
    for n in range(order + 1):
        correction = sum((point(comb(n, k)) * denominator[k] * sigma[n-k]
                          for k in range(1, n + 1)), point(0))
        value = round_out((g[n] - correction) / denominator[0])
        if n == 0:
            value = Interval(max(Q(0), value.lo), min(Q(1), value.hi))
        elif n == 1:
            value = Interval(max(Q(0), value.lo), value.hi)
        sigma.append(value)

    value = sigma[order]
    if x.lo <= 0:
        value = Interval(min(Q(0), value.lo), max(Q(0), value.hi))
    if x.hi >= 1:
        flat = Q(int(order == 0))
        value = Interval(min(flat, value.lo), max(flat, value.hi))
    return value
