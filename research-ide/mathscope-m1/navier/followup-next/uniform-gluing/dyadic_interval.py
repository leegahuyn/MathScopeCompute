"""Small exact, outward dyadic interval arithmetic for the moment certificate.

All endpoints are integers divided by 2**BITS. Elementary arithmetic uses
integer floor/ceiling. Rational powers use an exact integer root comparison;
exp(-x) uses a positive Taylor series with a geometric remainder and range
reduction. No binary floating-point value is used to justify an enclosure.
"""
from __future__ import annotations

from fractions import Fraction
from math import factorial

BITS = 88
SCALE = 1 << BITS


def ceildiv(a: int, b: int) -> int:
    if b <= 0:
        raise ValueError("positive denominator required")
    return -((-a) // b)


def nthroot_floor(a: int, n: int) -> int:
    if a < 0 or n < 1:
        raise ValueError("nonnegative integer and positive root required")
    if a < 2 or n == 1:
        return a
    x = 1 << ((a.bit_length() + n - 1) // n)
    while True:
        y = ((n - 1) * x + a // x ** (n - 1)) // n
        if y >= x:
            while (x + 1) ** n <= a:
                x += 1
            while x ** n > a:
                x -= 1
            return x
        x = y


class I:
    __slots__ = ("lo", "hi")

    def __init__(self, value=0, upper=None, *, raw=False):
        if isinstance(value, I):
            self.lo, self.hi = value.lo, value.hi
            return
        if raw:
            self.lo, self.hi = int(value), int(upper)
        else:
            a, b = Fraction(value), Fraction(value if upper is None else upper)
            self.lo = (a.numerator * SCALE) // a.denominator
            self.hi = ceildiv(b.numerator * SCALE, b.denominator)
        if self.lo > self.hi:
            raise ValueError("reversed interval")

    def __add__(self, other):
        other = I(other)
        return I(self.lo + other.lo, self.hi + other.hi, raw=True)

    __radd__ = __add__

    def __neg__(self):
        return I(-self.hi, -self.lo, raw=True)

    def __sub__(self, other):
        return self + -I(other)

    def __rsub__(self, other):
        return I(other) - self

    def __mul__(self, other):
        other = I(other)
        vals = [a * b for a in (self.lo, self.hi) for b in (other.lo, other.hi)]
        return I(min(vals) // SCALE, ceildiv(max(vals), SCALE), raw=True)

    __rmul__ = __mul__

    def reciprocal(self):
        if self.lo <= 0 <= self.hi:
            raise ValueError("division interval contains zero")
        if self.hi < 0:
            return -(-self).reciprocal()
        return I(SCALE * SCALE // self.hi, ceildiv(SCALE * SCALE, self.lo), raw=True)

    def __truediv__(self, other):
        return self * I(other).reciprocal()

    def __rtruediv__(self, other):
        return I(other) / self

    def __pow__(self, n):
        if not isinstance(n, int):
            raise TypeError("integer exponent required; use power for rational exponents")
        if n < 0:
            return (self ** (-n)).reciprocal()
        if n == 0:
            return I(1)
        if n == 2:
            vals = [self.lo * self.lo, self.hi * self.hi]
            low = 0 if self.lo <= 0 <= self.hi else min(vals)
            return I(low // SCALE, ceildiv(max(vals), SCALE), raw=True)
        result, base = I(1), self
        while n:
            if n & 1:
                result = result * base
            base = base * base
            n >>= 1
        return result

    def abs(self):
        if self.lo >= 0:
            return self
        if self.hi <= 0:
            return -self
        return I(0, max(-self.lo, self.hi), raw=True)

    def lower(self):
        return Fraction(self.lo, SCALE)

    def upper(self):
        return Fraction(self.hi, SCALE)

    def midpoint(self):
        return Fraction(self.lo + self.hi, 2 * SCALE)

    def contains(self, value):
        q = Fraction(value)
        return self.lower() <= q <= self.upper()

    def contains_interval(self, other):
        other = I(other)
        return self.lo <= other.lo and other.hi <= self.hi

    def json(self):
        return {"lowerNumerator": str(self.lo), "upperNumerator": str(self.hi),
                "denominatorPowerOfTwo": BITS,
                "approximate": [float(self.lower()), float(self.upper())]}

    def __repr__(self):
        return f"I({float(self.lower()):.12g}, {float(self.upper()):.12g})"


def power(x, exponent):
    """Enclose x**(p/q), x>0, by integer qth-root comparisons."""
    x, exponent = I(x), Fraction(exponent)
    if x.lo <= 0:
        raise ValueError("rational power requires a positive interval")
    if exponent == 0:
        return I(1)
    if exponent < 0:
        return power(x, -exponent).reciprocal()
    p, q = exponent.numerator, exponent.denominator
    vals = []
    for endpoint in (x.lo, x.hi):
        exact = Fraction(endpoint, SCALE) ** p * SCALE ** q
        n = nthroot_floor(exact.numerator // exact.denominator, q)
        vals.append((n, n if Fraction(n ** q) == exact else n + 1))
    return I(vals[0][0], vals[1][1], raw=True)


def _exp_negative_point(x):
    x = Fraction(x)
    if x < 0:
        raise ValueError("nonnegative exponent argument required")
    if x == 0:
        return I(1)
    # e > 2, so exp(-x) < 2**(-BITS) whenever x >= BITS.
    if x >= BITS:
        return I(0, 1, raw=True)
    reductions = 0
    while x > Fraction(1, 8):
        x /= 2
        reductions += 1
    y = I(x)
    term = I(1)
    total = I(1)
    degree = 24
    for n in range(1, degree + 1):
        term = term * y / n
        total = total + term
    first_omitted = term * y / (degree + 1)
    remainder = first_omitted / (1 - y / (degree + 2))
    value = I(total.lo, total.hi + remainder.hi, raw=True).reciprocal()
    for _ in range(reductions):
        value = value ** 2
    return value


def exp_negative(x):
    x = I(x)
    if x.lo < 0:
        raise ValueError("nonnegative argument required")
    lower = _exp_negative_point(x.upper())
    upper = _exp_negative_point(x.lower())
    return I(lower.lo, upper.hi, raw=True)


def sigma(t):
    """Pinned flat step at an exact rational point, outward enclosure."""
    t = Fraction(t)
    if t <= 0:
        return I(0)
    if t >= 1:
        return I(1)
    if t > Fraction(1, 2):
        return 1 - sigma(1 - t)
    z = 1 / t ** 2 - 1 / (1 - t) ** 2
    e = exp_negative(I(z))
    return e / (1 + e)


def sigma_interval(a, b):
    low, high = sigma(a), sigma(b)
    return I(low.lo, high.hi, raw=True)


def sigma_prime_box(a, b):
    """Whole-cell derivative bound, including endpoint collars.

    For 0<t<=b<=1/2, sigma'(t) <= 4 t^-3 exp(4-t^-2).
    This majorant increases up to t=sqrt(2/3), hence the first collar is bounded
    at its positive right endpoint without evaluating t^-3 at zero.
    """
    a, b = Fraction(a), Fraction(b)
    if a < 0 or b > 1 or a > b:
        raise ValueError("step cell must lie in [0,1]")
    if a >= Fraction(1, 2) and b > Fraction(1, 2):
        return sigma_prime_box(1 - b, 1 - a)
    if b > Fraction(1, 2):
        left, right = sigma_prime_box(a, Fraction(1, 2)), sigma_prime_box(Fraction(1, 2), b)
        return I(min(left.lo, right.lo), max(left.hi, right.hi), raw=True)
    if a == 0:
        if b == 0:
            return I(0)
        upper = I(4 / b ** 3) * exp_negative(I(1 / b ** 2 - 4))
        return I(0, upper.hi, raw=True)
    t = I(a, b)
    s = sigma_interval(a, b)
    val = s * (1 - s) * (2 / t ** 3 + 2 / (1 - t) ** 3)
    return I(max(0, val.lo), val.hi, raw=True)


def sigma_second_box(a, b):
    """Whole-cell second derivative. Endpoint collars use an analytic bound."""
    a, b = Fraction(a), Fraction(b)
    if a < 0 or b > 1 or a > b:
        raise ValueError("step cell must lie in [0,1]")
    if a >= Fraction(1, 2) and b > Fraction(1, 2):
        return -sigma_second_box(1 - b, 1 - a)
    if b > Fraction(1, 2):
        left, right = sigma_second_box(a, Fraction(1, 2)), sigma_second_box(Fraction(1, 2), b)
        return I(min(left.lo, right.lo), max(left.hi, right.hi), raw=True)
    if a == 0:
        if b == 0:
            return I(0)
        # (16*t^-6+12*t^-4)*exp(4-t^-2) increases on (0,1/2].
        upper = I(16 / b ** 6 + 12 / b ** 4) * exp_negative(I(1 / b ** 2 - 4))
        return I(-upper.hi, upper.hi, raw=True)
    t, s, sp = I(a, b), sigma_interval(a, b), sigma_prime_box(a, b)
    zp = 2 / t ** 3 + 2 / (1 - t) ** 3
    zpp = -6 / t ** 4 + 6 / (1 - t) ** 4
    return sp * (1 - 2 * s) * zp + s * (1 - s) * zpp


def max_upper(intervals):
    return Fraction(max(I(v).hi for v in intervals), SCALE)


def identity_matrix(n):
    return [[I(int(i == j)) for j in range(n)] for i in range(n)]


def matmul(a, b):
    return [[sum((a[i][k] * b[k][j] for k in range(len(b))), I(0))
             for j in range(len(b[0]))] for i in range(len(a))]


def matvec(a, v):
    return [sum((x * y for x, y in zip(row, v)), I(0)) for row in a]


def inverse_rational(matrix):
    """Exact rational inverse, used only as a preconditioner."""
    n = len(matrix)
    a = [[Fraction(x) for x in row] + [Fraction(int(i == j)) for j in range(n)]
         for i, row in enumerate(matrix)]
    for j in range(n):
        k = next((k for k in range(j, n) if a[k][j]), None)
        if k is None:
            raise ValueError("singular rational preconditioner")
        a[j], a[k] = a[k], a[j]
        pivot = a[j][j]
        a[j] = [x / pivot for x in a[j]]
        for k in range(n):
            if k != j:
                factor = a[k][j]
                a[k] = [x - factor * y for x, y in zip(a[k], a[j])]
    return [row[n:] for row in a]


def infinity_norm_upper(matrix):
    return max(sum((I(x).abs().upper() for x in row), Fraction(0)) for row in matrix)

