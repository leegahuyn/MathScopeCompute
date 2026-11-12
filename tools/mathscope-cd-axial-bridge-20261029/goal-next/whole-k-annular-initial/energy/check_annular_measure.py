"""Build exact additive measure brackets for the original moving annulus."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
from itertools import product
import json
from pathlib import Path


CHART_SHA = "af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9"
COLLAR_SHA = "254868bebdad829d656c06cfa903a5b5cdf288d35cf5ec9bdf52461c3a7e008b"


def pinned(path, expected):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == expected, path
    return json.loads(data)


def atan_bracket(denominator, terms):
    assert terms % 2 == 0
    partial = sum(Fraction((-1)**j, (2*j+1)*denominator**(2*j+1)) for j in range(terms))
    return partial, partial + Fraction(1, (2*terms+1)*denominator**(2*terms+1))


def partition(lower, upper, count):
    step = (upper-lower)/count
    return [(lower+j*step, lower+(j+1)*step) for j in range(count)]


def cube_measure(v, u, rho):
    dv = v[1]-v[0]
    du = u[1]-u[0]
    dt = rho[1]-rho[0]
    axial = dv*dt*(u[1]**3-u[0]**3)/6
    base = axial + dv*du*(rho[1]**2-rho[0]**2)/2
    return base, axial


def slice_measure(v, u, rho):
    dv = v[1]-v[0]
    axial = dv*(u[1]**3-u[0]**3)/6
    return axial + dv*(u[1]-u[0])*rho, axial


def grid(counts):
    ranges = [partition(Fraction(lo), Fraction(hi), n)
              for (lo, hi), n in zip(((0, 1), (-1, 1), (Fraction(1, 2), 1)), counts, strict=True)]
    cells = {i: cube_measure(*(ranges[j][k] for j, k in enumerate(i)))
             for i in product(*(range(n) for n in counts))}
    faces = {i: slice_measure(*(ranges[j][k] for j, k in enumerate(i)), Fraction(1, 2))
             for i in product(*(range(n) for n in counts[:2]))}
    return cells, faces


def sums(values):
    pairs = list(values)
    return sum(pair[0] for pair in pairs), sum(pair[1] for pair in pairs)


def verify_subdivision(parent, child, ratios):
    for parent_index, original in parent.items():
        ranges = [range(j*ratio, (j+1)*ratio) for j, ratio in zip(parent_index, ratios, strict=True)]
        assert sums(child[k] for k in product(*ranges)) == original


def encode(cells):
    return [{"index": index, "central": str(base), "axial": str(axial)}
            for index, (base, axial) in cells.items()]


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("chart", "collar", "output"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    chart = pinned(args.chart, CHART_SHA)
    collar = pinned(args.collar, COLLAR_SHA)
    assert chart["variables"]["chart_equation"] == "Q - sigma * Q^(2h) = rho"
    assert chart["variables"]["rho"] == "tau/tau0 with tau=1-t and tau0=qBig/32"
    assert chart["variables"]["zeta"] == "z/z0 with z0=tau0^(1/2-h)"
    assert collar["geometry"]["wholeK"] == "0<=r^2<=1/2, zeta^2<=1/2, 1/2<=rho<=1"
    assert collar["geometry"]["radialProof"] == ["q<qBig/16", "4*Xb<=Rstar^2", "qBig*Rstar^2<2/3"]

    # F(Q)=Q-sigma*Q^(2h) is increasing for Q>=1/2. The lower
    # bracket is rho, and F(2) > rho. Use e^x <= 1/(1-x) for x<1.
    half = Fraction(1, 2)
    two_power_upper = Fraction(32, 31)
    assert 2-half*two_power_upper > 1
    assert 1-Fraction(1, 32)*two_power_upper > 0
    assert 1-half/(half+half*two_power_upper) < Fraction(9, 16)
    # On this bracket, 1-2h <= Q^(2h) <= 1+4h.
    assert (1-Fraction(1, 32))*2 > 1
    a, b = atan_bracket(5, 32)
    c, d = atan_bracket(239, 10)
    pi = (16*a-4*d, 16*b-4*c)
    assert 3 < pi[0] < pi[1] < Fraction(22, 7)
    assert pi[1]-pi[0] < Fraction(1, 10**40)

    layouts = {"base": (2, 4, 2), "spaceOnly": (4, 8, 2), "timeOnly": (2, 4, 4), "both": (4, 8, 4)}
    tables = {name: grid(counts) for name, counts in layouts.items()}
    for name in ("spaceOnly", "timeOnly", "both"):
        ratios = tuple(n//d for n, d in zip(layouts[name], layouts["base"], strict=True))
        verify_subdivision(tables["base"][0], tables[name][0], ratios)
        verify_subdivision(tables["base"][1], tables[name][1], ratios[:2])
    for cells, endpoint in tables.values():
        assert sums(cells.values()) == (Fraction(11, 12), Fraction(1, 6))
        assert sums(endpoint.values()) == (Fraction(4, 3), Fraction(1, 3))
        assert all(base-Fraction(1, 32)*axial > 0 for base, axial in (*cells.values(), *endpoint.values()))

    report = {
        "schema": "MathScope.N7.OriginalMovingAnnulusMeasure/1",
        "status": "VERIFIED_ADDITIVE_ORIGINAL_CHART_MEASURE",
        "source": {"chartSHA256": CHART_SHA, "collarSHA256": COLLAR_SHA},
        "coordinates": {"radial": "v=(X-Xa)/(Xb-Xa)", "axial": "u=sqrt(2)*z/z0", "time": "rho=tau/tau0"},
        "commonFactor": "sqrt(2)*pi*tau0*(Xb-Xa)",
        "pointwiseQBracket": "rho+(1-2h)*u^2/2 <= Q <= rho+(1+4h)*u^2/2",
        "cellBracket": "[central-2*h*axial, central+4*h*axial] times commonFactor",
        "piBracket": [str(x) for x in pi],
        "slabTotals": {"central": "11/12", "axial": "1/6"},
        "endpointTotalsAtRhoHalf": {"central": "4/3", "axial": "1/3"},
        "layouts": {name: {"divisions": layouts[name], "slab": encode(cells), "endpoint": encode(endpoint)}
                    for name, (cells, endpoint) in tables.items()},
        "finalFieldIntegrandsEvaluated": False,
    }
    args.output.write_bytes((json.dumps(report, indent=2) + "\n").encode())
    print("PASS original moving annulus measure on four exact additive layouts")


if __name__ == "__main__":
    main()
