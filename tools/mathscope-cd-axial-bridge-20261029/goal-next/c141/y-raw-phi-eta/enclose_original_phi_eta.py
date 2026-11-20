"""Check raw original Phi eta enclosures and scaled literal dyadic intervals."""

import argparse
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import factorial
from pathlib import Path


PINS = {
    "axis": "1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920",
    "profile": "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a",
    "expanded": "797b0331d34b8e1011c7e5c0e993e3cd2e0fdc864b410085c69c126e14b971b7",
    "transport": "4b182213f17d389426fd355eb7f254915e87134ae91762b512114751d373ba37",
}


def pinned(path, name):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[name], name
    return raw


def reciprocal(a, degree):
    result = [1 / a[0]]
    for i in range(1, degree + 1):
        result.append(-sum(a[j] * result[i - j] for j in range(1, min(i, len(a) - 1) + 1)) / a[0])
    return result


def product(a, b, degree):
    return [sum(a[j] * b[i - j] for j in range(max(0, i - len(b) + 1), min(i + 1, len(a))))
            for i in range(degree + 1)]


def bessel_derivative_interval(x, order):
    degree = 0
    term = Q((-1)**order, 2**order * factorial(order + 1))
    partial = term
    while True:
        next_term = -term * x / (2 * (degree + 1) * (degree + order + 2))
        assert abs(next_term) < abs(term)
        if abs(next_term) < Q(1, 2**320):
            return min(partial, partial + next_term), max(partial, partial + next_term), degree
        term = next_term
        partial += term
        degree += 1


def literal_intervals(literal_rows):
    tau = Q(1, 4_000_000)
    max_order = 4
    h_center = [Q(1), Q(9, 2)]  # limiting scaled profile Z_0(s)
    z0_squared = product(h_center, h_center, 2)
    denominator = z0_squared.copy()
    denominator[0] += tau
    chi = product(z0_squared, reciprocal(denominator, max_order), max_order)
    assert chi[0] == Q(4_000_000, 4_000_001)
    x = 4 * chi[0]
    bessel = [bessel_derivative_interval(x, ell) for ell in range(max_order + 1)]

    # Uniform complex disk bounds for Z_h(s) and Z_0(s), |s|<=1/32.
    r = Q(1, 32)
    assert Q(9, 2) * r + r*r + 4*r**3 < Q(1, 6)
    assert r + r*r + 4*r**3 < Q(1, 16)
    assert Q(5, 6)**2 - tau > Q(1, 2)
    assert Q(5, 6)**2 > 2 * tau  # |chi_h|, |chi_0| < 2
    assert tau * Q(7, 3) * Q(1, 16) * 4 < 1
    assert Q(3**4, 2) < 41   # |f0'(x)| < 41 for complex |x|<=8
    assert factorial(4) * 32**4 * 4 * 41 < 2**33
    assert 8002 * 2 - 33 == 15971  # h = exp(-8002*T) < 2^(-16004)

    # Expand f0(x+4*(chi(s)-chi(0))) up to degree 4 in formal s.
    delta = [Q(0)] + chi[1:]
    power = [Q(1)]
    polynomial_rows = []
    for ell in range(max_order + 1):
        polynomial_rows.append(power)
        power = product(power, delta, max_order)
    pad = Q(1, 2**300)
    assert Q(1, 2**15971) + Q(1, 2**12460) < pad
    grid = 2**260
    intervals = []
    for row in literal_rows:
        m = row["m"]
        lo = hi = Q(0)
        for ell in range(1, m + 1):
            weight = factorial(m) * Q(4**ell, factorial(ell)) * polynomial_rows[ell][m]
            lower, upper, _ = bessel[ell]
            lo += min(weight * lower, weight * upper)
            hi += max(weight * lower, weight * upper)
        lo -= pad
        hi += pad
        assert hi - lo < Q(1, 2**264)
        lower_integer = (lo * grid).__floor__()
        upper_integer = (hi * grid).__ceil__()
        assert Q(lower_integer, grid) <= lo <= hi <= Q(upper_integer, grid)
        assert upper_integer - lower_integer == 1
        intervals.append({
            "call": row["id"], "etaOrder": m, "eta": 0, "Y": 4,
            "quantity": f"j0^{m} * d_eta^{m} Phi(4,0)",
            "lowerNumerator": str(lower_integer), "upperNumerator": str(upper_integer),
            "commonDenominator": "2^260", "exactWidth": "2^-260",
        })
    return intervals, [interval[2] for interval in bessel]


def run(args):
    source = pinned(args.axis, "axis").decode()
    profile = pinned(args.profile, "profile").decode()
    g = json.loads(pinned(args.expanded, "expanded"))
    t = json.loads(pinned(args.transport, "transport"))
    assert g["calls"] == t["newly"] and t["certifiedRangeCount"] == 567
    assert not t["nativeRootExistenceCertified"]
    for fragment in (
        r"|chi(z)|<=1",
        r"R_\Omega=\sigma^2/2048,\quad r=\sigma^2/4096",
        r"\rho=\sigma^2/65536",
        r"D=\tfrac12-h,\quad A=\tfrac12+h,\quad d=1-\eta^2",
        r"U_*=4\eta+j",
        r"H_*=D\eta+dU_*",
        r"\|F(x)-x_0\|\le\varepsilon_{sharp}:=29Q^{-53}",
        r"\rho^{-m}",
        r"\frac{(m+k)!}{(m+1)^2 20^k}",
        r"(1-|Y|/20)^{-m-k-1}. \tag{16}",
    ):
        assert fragment in source, fragment
    parameters = json.loads(profile.split("export const PINNED_N3 = ", 1)[1].rstrip()[:-1])["parametersExactExpressions"]
    assert parameters["T"] == {"sum": [{"exp": {"ref": "Md"}}, {"integer": 10}]}
    assert parameters["Md"] == {"integer": 2**20}
    assert parameters["h"] == {"exp": {"product": [{"integer": -8002}, {"ref": "T"}]}}
    assert parameters["j0"] == {"power": [{"ref": "h"}, 4]}
    assert parameters["sigmaStar"] == {"quotient": [{"ref": "j0"}, {"integer": 2000}]}
    assert parameters["rho"] == {"quotient": [{"power": [{"ref": "sigmaStar"}, 2]}, {"integer": 65536}]}
    assert parameters["Lambda"] == {"power": [{"ref": "Q"}, 64]}
    assert parameters["K"] == {"power": [{"ref": "Pstar"}, 2]}
    assert parameters["Pstar"] == {"exp": {"ref": "logP"}}
    assert parameters["logP"] == {"product": [{"integer": 2}, {"ref": "T"}]}
    q_prod = parameters["Q"]["quotient"]
    assert int(q_prod[0]["product"][0]["integer"]) == 2**260
    assert q_prod[0]["product"][1] == {"ref": "K"} and q_prod[1] == {"power": [{"ref": "sigmaStar"}, 2]}

    rows = [call for call in g["calls"] if call["component"] == "Phi" and call["m"]]
    signatures = Counter((row["k"], row["m"]) for row in rows)
    assert len(rows) == 186 and len(signatures) == 11
    nodes = dict(g["nodes"])
    for row in rows:
        expected = ["Phi", row["y"], row["eta"], row["k"], row["m"]]
        assert nodes[row["id"]] == {"op": "actual_natural_series", "args": expected}
        assert nodes[row["eta"]] == {"op": "coordinate", "args": ["eta"]}
    literal_rows = [row for row in rows if nodes[row["y"]]["op"] == "rational"]
    assert nodes[474] == {"op": "rational", "args": ["4", "1"]}
    assert [(row["id"], row["y"], row["k"], row["m"]) for row in literal_rows] == [
        (5748, 474, 0, 1), (10450, 474, 0, 2), (20811, 474, 0, 3), (81559, 474, 0, 4)
    ]
    costs = []
    for (k, m), count in sorted(signatures.items()):
        prefactor = Q(29*factorial(k + m), (m + 1)**2 * 20**k) * Q(200, 159)**(k + m + 1)
        assert prefactor < 2**12 and m <= 5
        assert factorial(k) * factorial(m) * Q(10, 9)**k < 2**8
        costs.append({"radialOrder": k, "etaOrder": m, "callCount": count, "sourceErrorPrefactor": str(prefactor)})
    assert (53 - 5)*260 - 12 == 12468 > 12460

    # For the finite comparison-series alternative, preserve the true
    # complex tail before mixed Cauchy differentiation near the real chart.
    assert Q(5, 2)**3 / (factorial(3)*factorial(4)) < Q(1, 2**3)
    assert Q(5, 2) / (4*5) < Q(1, 2)
    assert Q(256, 63) < Q(41, 10)
    assert 9 + 260 == 269
    assert 260 + 22 + 2*64020 < 131072  # e<4, T>1, 4000000<2^22
    intervals, bessel_degrees = literal_intervals(literal_rows)
    return {
        "schema": "MathScope.C142.OriginalRawMixedPhiEnclosures/1",
        "status": "CONDITIONAL_RAW_ETA_JET_SYMBOLIC_ENCLOSURES_AND_SCALED_LITERAL_DYADICS",
        "pins": PINS,
        "symbolicRawEta": {
            "count": len(rows), "distinctYArguments": len({r["y"] for r in rows}),
            "domain": "0<=Y<=41/10, -1<=eta<=1 (real original arguments)",
            "center": "d_Y^k d_eta^m f0(Y*chi(eta)), exact entire comparison",
            "f0": "sum_(n>=0) (-x/2)^n/(n!*(n+1)!)",
            "errorUpper": "2^-12468 (strict)",
            "enclosureRadius": "2^-12460", "width": "2^-12459",
            "signatures": costs, "calls": rows,
        },
        "finiteCenterAlternative": {
            "degree": "ceil(131072*m*T) + 269",
            "center": "differentiate the degree-N radial partial sum of the exact comparison",
            "enclosureRadius": "2^-260", "evaluatedAtDegree": False,
        },
        "scaledLiteralAtEtaZero": {
            "coordinate": "s=eta/j0; j0=h^4",
            "limitingComparisonArgument": "4*(1+(9/2)*s)^2/((1+(9/2)*s)^2+1/4000000)",
            "scaledComparisonProfilePerturbationUpper": "2^-15971 (strict)",
            "besselDegrees": bessel_degrees, "intervals": intervals,
        },
        "premises": [
            "Original same-datum A.21 nonlinear B_rho solution with written source displacement (14a)",
            "Real eta in the original interval and C139 native branches defined with their original premises",
        ],
        "originalNumericalAcceptanceIncrement": 0,
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in (*PINS, "output"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    answer = run(args)
    args.output.write_bytes((json.dumps(answer, indent=2, sort_keys=True) + "\n").encode())
