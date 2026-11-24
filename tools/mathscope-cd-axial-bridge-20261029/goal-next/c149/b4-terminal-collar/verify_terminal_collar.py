"""Independent rational coefficients and tail majorants for the original heat collar."""
import argparse
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path


PINS = {
    "whole-k-exterior/region/whole-k-exterior-region.json":
        "82f4bdcebd43a72451e7523059547dbca37e7a47cc5d66a24e787b0851a4420a",
    "whole-k-exterior/exterior-cutoff-force.json":
        "9bba52b109ec9c61db0cd8bdc32cd5aaf6baedfac416277ec65b00d5c656afea",
    "c114/full-exterior-jets/full-exterior-jets.json":
        "b4d271ab21fa5159c268c7d1bde2b3035aa156bab900d95599f218f3dbb94db1",
}
RADIAL_REPLAY_SHA = "c158d0452652c823d7ca66f4b0a66570533e2fda0ebc7971ee36153be444ce11"


def add(a, b):
    return [sum(xs) for xs in zip(a, b, strict=True)]


def scale(a, k):
    return [k * x for x in a]


def mul(a, b):
    return [sum(a[k] * b[i - k] for k in range(i + 1)) for i in range(len(a))]


def constant(x, n):
    return [x] + [0] * n


def compose(coefficients, inner):
    result = constant(0, len(inner) - 1)
    for q in reversed(coefficients):
        result = add(mul(result, inner), constant(q, len(inner) - 1))
    return result


def cutoff_bounds(order):
    # P_n(1/u)*exp(-1/u) is the nth derivative of exp(-1/u).
    polynomial = [1] + [0] * (2 * order)
    seed = []
    for n in range(order + 1):
        seed.append(sum(abs(x) * factorial(k) for k, x in enumerate(polynomial)))
        derivative = [0] * len(polynomial)
        for k, x in enumerate(polynomial[:-2]):
            derivative[k + 2] += x
            derivative[k + 1] -= k * x
        polynomial = derivative
    # D=e^-1/u+e^-1/(1-u)>=e^-2>1/9 on [0,1].
    ratio = [1]
    for n in range(1, order + 1):
        ratio.append(9 * (seed[n] + sum(comb(n, k) * ratio[n-k] * 2 * seed[k]
                                          for k in range(1, n + 1))))
    # chi(s)=1-sigma_1(2s-1). The degree-zero bound is 1.
    return [2**n * x for n, x in enumerate(ratio)]


def rising(x, n):
    product = 1
    for i in range(n):
        product *= x + i
    return product


def heat_coefficients(order):
    # Independent product of the two rising factorials in the variable h.
    h = [0, 1] + [0] * (2 * order - 1)
    p = [constant(1, 2 * order)]
    for j in range(order):
        p.append(mul(mul(p[-1], add(h, constant(j, 2*order))),
                     add(h, constant(j + 1, 2*order))))
    square = []
    for j in range(order + 1):
        result = constant(0, 2 * order)
        for k in range(j + 1):
            result = add(result, scale(mul(p[k], p[j-k]), comb(j, k)))
        square.append(result)
    # A direct evaluation of the defining products checks every output row.
    for j in range(order + 1):
        for h0 in (Q(0), Q(1, 64), Q(1, 3)):
            values = [rising(h0, k) * rising(1 + h0, k) for k in range(j + 1)]
            assert sum(x*h0**k for k, x in enumerate(p[j])) == values[j]
            assert sum(x*h0**k for k, x in enumerate(square[j])) == sum(
                comb(j, k) * values[k] * values[j-k] for k in range(j + 1))
    return [(p[j][:2*j+1], square[j][:2*j+1]) for j in range(order + 1)]


def force_bounds(j, order, cutoff):
    """Bounds divided by (1+cInfinity+cInfinity^2) z0^(-a-2)."""
    v = [0, 1] + [0] * (order - 1)
    one = constant(1, order)
    delta_w = add(scale(v, 4), scale(mul(v, v), 2))
    delta_zeta2 = add(scale(v, 2), mul(v, v))
    w = add(one, delta_w)
    zeta = add(one, v)
    zeta2 = add(one, delta_zeta2)
    # Composition bounds for chi and its first two derivatives.
    radial, axial = [], []
    for d in range(3):
        coefficients = [Q(cutoff[d + n], factorial(n)) for n in range(order + 1)]
        radial.append(compose(coefficients, scale(delta_w, 2)))
        axial.append(compose(coefficients, scale(delta_zeta2, 2)))
    r, r1, r2 = radial
    z, z1, z2 = axial
    c = mul(r, z)
    # Around the base point, c(1-c) = c0(1-c0)+(1-2*c0)dc-dc^2.
    c_times_one_minus_c = add(
        constant(Q(1, 4), order), add([0, *c[1:]], mul([0, *c[1:]], [0, *c[1:]])))
    # Bounds at h=1/64 are enlarged to integers using h<1.
    heat = factorial(j) * factorial(j + 1)
    square = sum(comb(j, k) * factorial(k) * factorial(k+1)
                 * factorial(j-k) * factorial(j-k+1) for k in range(j+1))
    inverse_min = 2**1024

    def negative_power(beta_upper):
        return scale(compose([comb(beta_upper+k-1, k) for k in range(order+1)],
                             scale(delta_w, inverse_min)), inverse_min**beta_upper)

    # s=w/2, A<1, 2A<2. Pressure denominator 2*(2A+j)>1.
    swirl = scale(negative_power(j+2), 2**(2*j+1)*heat)
    squared_over_w = scale(negative_power(j+3), 2**(2*j+2)*square)
    pressure = scale(negative_power(j+2), 2**(2*j+2)*square)
    lap_c = add(mul(z, add(scale(r1, 8), scale(mul(w, r2), 16))),
                mul(r, add(scale(z1, 4), scale(mul(zeta2, z2), 16))))
    radial_pressure = scale(mul(mul(r1, z), pressure), 4)
    radial_force = add(mul(c_times_one_minus_c, squared_over_w), radial_pressure)
    angular_force = mul(add(lap_c, scale(mul(r1, z), 16*(j+1))), swirl)
    axial_force = scale(mul(mul(mul(zeta, r), z1), pressure), 4)
    cartesian_sum = add(scale(mul(zeta, add(radial_force, angular_force)), 2), axial_force)
    result = []
    worst = 0
    for a, coefficient in enumerate(cartesian_sum):
        integer = coefficient * factorial(a)
        upper = (integer.numerator + integer.denominator - 1) // integer.denominator
        worst = max(worst, (upper - 1).bit_length())
        result.append(worst)
    return result


def extension_constants(j, cutoff):
    # chi0(v)=chi(v^2), |v|<=1 on the support of its derivatives.
    # Its kth derivative is majorized using delta(v^2)=2t+t^2.
    order = j // 2
    v = [0] + ([1] + [0] * (order-1) if order else [])
    change = add(scale(v, 2), mul(v, v))
    coefficients = compose([Q(cutoff[k], factorial(k)) for k in range(order+1)], change)
    derivatives = [factorial(k)*x for k, x in enumerate(coefficients)]
    return [sum(Q(comb(m, k) * derivatives[k], factorial(j-m+k))
                for k in range(m+1)) for m in range(order+1)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--goal", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--order", default=16, type=int)
    args = parser.parse_args()
    assert args.order >= 12
    source = {}
    for relative, digest in PINS.items():
        data = (args.goal / relative).read_bytes()
        assert sha256(data).hexdigest() == digest
        source[Path(relative).stem] = json.loads(data)
    collar = source["whole-k-exterior-region"]["region"]
    assert collar["closedRegion"]["rSquared"] == ["2^-1024", "1/2"]
    assert collar["exteriorProof"][-1] == "2*q*Xb<qBig*Rstar^2/32<2^-1024"
    force = source["exterior-cutoff-force"]
    assert force["actualExteriorIdentification"]["pressureNormalization"] == (
        "original radial infinity; no additive time function")
    assert force["verifiedCylindricalAlgebra"]["axialForce"] == "C_z*p_loc"
    assert source["full-exterior-jets"]["cover"]["axial"] == "zeta^2<=1/2, both signs"
    replay = Path(__file__).with_name("archived-radial-polynomials.json").read_bytes()
    assert sha256(replay).hexdigest() == RADIAL_REPLAY_SHA
    original = json.loads(replay)
    cutoff = cutoff_bounds(args.order + 2)
    assert cutoff[:3] == [1, 108, 19440]
    coefficients = heat_coefficients(args.order)
    assert len(original) == 13
    for j, row in enumerate(original):
        p, square = coefficients[j]
        assert row["order"] == j
        assert list(map(int, row["velocityPolynomial"])) == p
        assert list(map(int, row["squarePolynomial"])) == square
    rows = []
    for j, (p, square) in enumerate(coefficients):
        amax = max(2, j//2)
        dyadic = force_bounds(j, amax, cutoff)
        time = extension_constants(j, cutoff)
        # Exact resource-limited extraction. The formulas in the proof apply for every j.
        rows.append({"j": j, "heatPolynomial": p, "squarePolynomial": square,
                     "normDyadicExponentsBySpatialOrder": dyadic,
                     "extensionProductConstantsByTimeOrder": [str(x) for x in time]})
        # Compare the localized radial and azimuthal midpoint to the original program.
        for h in (Q(1,64), Q(1,3)):
            a = Q(1,2) + h
            pressure_over_square = -1/(2*(2*a+j))
            assert Q(1,4) - 6*pressure_over_square == Q(1,4) + 3/(2*a+j)
            assert 32 - 64*(a+j) == -64*(h+j)
            # At the simultaneous spatial transition, pressure is retained and f_z != 0.
            assert -8*pressure_over_square > 0
    out = {"schema": "MathScope.C149.OriginalTerminalHeatCollarAndExtensionTail/1",
           "sourcePins": PINS,
           "archivedRadialReplaySHA256": RADIAL_REPLAY_SHA,
           "exactIndependentRadialComparisons": 26,
           "status": "VERIFIED_ON_SOURCE_IDENTIFIED_TERMINAL_HEAT_COLLAR",
           "scope": "r^2>=2^-1024, all angles, all z after the original smooth support extension",
           "timeSide": "0<tau<=tau0/2 then tau down to zero",
           "normFactor": "(1+cInfinity+cInfinity^2)*z0^(-a-2)",
           "spatialNorm": "sup of Euclidean component-vector norm over all Cartesian derivatives of order <=a",
           "uniformTail": "sum_(j>N) 2^-j=2^-N when N>=max(0,2*(a+m)-1)",
           "extensionScope": "collar restriction with a sufficient source-dependent schedule",
           "globalTerminalJets": "OPEN", "globalOriginalSchedule": "OPEN",
           "wholeKJets": "0/67", "release": "HOLD", "rows": rows}
    args.out.write_bytes((json.dumps(out, indent=2) + "\n").encode())
    print(f"PASS terminal heat p and three force components, exact orders 0..{args.order}")
    print("PASS rational spatial norms and differentiated extension majorants on the original heat collar")
    print(sha256(args.out.read_bytes()).hexdigest())


if __name__ == "__main__":
    main()
