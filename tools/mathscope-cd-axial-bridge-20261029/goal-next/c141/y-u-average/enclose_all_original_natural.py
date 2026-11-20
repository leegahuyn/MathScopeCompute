"""Bind written same-datum enclosures to all original live natural calls."""

import argparse
from collections import Counter
from fractions import Fraction
from hashlib import sha256
import json
from math import factorial
from pathlib import Path


PINS = {
    "axis": "1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920",
    "profile": "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a",
    "core": "d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815",
    "runtime": "326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311",
    "primitive": "afedc437cad409b6b49bcc7903149678fffa103324c6141468d730148a3d5ba6",
    "expanded": "797b0331d34b8e1011c7e5c0e993e3cd2e0fdc864b410085c69c126e14b971b7",
    "transport": "4b182213f17d389426fd355eb7f254915e87134ae91762b512114751d373ba37",
}

CENTER = {
    "Phi": "f0(Y*chi(eta))",
    "u": "-Y*Zstar(eta)/(2*L(eta))",
    "average": "-Y*Zstar(eta)/(4*L(eta))",
}


def pinned(path, name):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[name], name
    return raw


def read_source(paths):
    axis, profile, core, runtime, primitive = (
        pinned(getattr(paths, name), name).decode()
        for name in ("axis", "profile", "core", "runtime", "primitive")
    )
    for fragment in (
        r"P(z)=-\int (1+z^2)^{-2\theta(y)}\,d\mu(y)",
        r"x0=(S 1,-Y Z_*/(2L))",
        r"\|F(x)-x_0\|\le\varepsilon_{sharp}:=29Q^{-53}",
        r"\frac{(m+k)!}{(m+1)^2 20^k}",
        r"(1-|Y|/20)^{-m-k-1}. \tag{16}",
        r"H_*=D\eta+dU_*",
        r"Z_*=-A(1-2\eta U_*)U_*-4H_*-dP'+4A\eta P.",
        r"u_{n+1}=\frac{-L^{-1}Z_*\,1_{n=0}+\Lambda^{-1}(R_2)_n}",
    ):
        assert fragment in axis, fragment
    for fragment in (
        "L=G.sub(G.one,G.mul(G.q(2),h,G.pow(eta,2)))",
        "Us=G.add(G.mul(G.q(4),eta),j)",
        "const Hs=G.add(G.mul(D,eta),G.mul(d,Us))",
        "const P=pressure.pressure,Z=G.add(G.neg(G.mul(A,G.sub(G.one,G.mul(G.q(2),eta,Us)),Us)),G.neg(G.mul(G.q(4),Hs)),G.neg(G.mul(d,G.derivative(P,eta))),G.mul(G.q(4),A,eta,P))",
        "const phi=[G.one],u=[G.zero]",
        "u.push(G.div(G.add(n===0?G.neg(G.mul(invL,Z)):G.zero,G.mul(invLambda,r2)),G.q(2*(n+1)**2)))",
        "average=u.map((x,k)=>G.div(x,G.q(k+1)))",
        "return {G,program,pressure,outer,rootFields,coefficients:{Phi:phi,u,p,average}}",
    ):
        assert fragment in core, fragment
    for fragment in (
        "this.naturalKernel={implementation:'actual-continuation-exact-functions.mjs:materializeActualNaturalSeries'",
        "meaning:'Limit of the exact generated radial coefficient partial sums.",
        "rows=coefficients[component].map(c=>{for(let j=0;j<m;j++)c=G.derivative(c,eta);return c;})",
        "rows[n],G.pow(y,n-k)",
    ):
        assert fragment in runtime, fragment
    assert "average_n=u_n/(n+1), for every integer n>=0" in primitive
    assert "gives uniform convergence of the series and each fixed derivative" in primitive

    p = json.loads(profile.split("export const PINNED_N3 = ", 1)[1].rstrip()[:-1])["parametersExactExpressions"]
    assert p["T"] == {"sum": [{"exp": {"ref": "Md"}}, {"integer": 10}]}
    assert p["Md"] == {"integer": 2**20}
    assert p["h"] == {"exp": {"product": [{"integer": -8002}, {"ref": "T"}]}}
    assert p["j0"] == {"power": [{"ref": "h"}, 4]}
    assert p["sigmaStar"] == {"quotient": [{"ref": "j0"}, {"integer": 2000}]}
    assert p["rho"] == {"quotient": [{"power": [{"ref": "sigmaStar"}, 2]}, {"integer": 65536}]}
    assert p["K"] == {"power": [{"ref": "Pstar"}, 2]}
    assert p["Pstar"] == {"exp": {"ref": "logP"}}
    assert p["logP"] == {"product": [{"integer": 2}, {"ref": "T"}]}
    q_product = p["Q"]["quotient"]
    assert int(q_product[0]["product"][0]["integer"]) == 2**260
    assert q_product[0]["product"][1] == {"ref": "K"}
    assert q_product[1] == {"power": [{"ref": "sigmaStar"}, 2]}
    assert 65536 < 2**260 and 2000**2 > 1


def coefficient_error(component, k, m):
    factor = Fraction(29*factorial(k + m), (m + 1)**2 * 20**k)
    factor *= Fraction(200, 159)**(k + m + 1)
    if component == "average":
        factor /= k + 1
    assert factor < 2**12 and 0 <= m <= 5
    return factor


def normalized_even_polynomial(component, m):
    # The power series of (A+4-(16A+4)*eta^2)/(1-2h*eta^2).
    # Store the resulting polynomial in h in increasing degree order.
    power = m // 2
    plus = [Fraction(9, 2), Fraction(1)]
    minus = [Fraction(12), Fraction(16)]
    out = [Fraction(0)] * (power + 2)
    for j in range(2):
        out[power + j] += 2**power * plus[j]
        if power:
            out[power - 1 + j] -= 2**(power - 1) * minus[j]
    scale = (2 if component == "u" else 1) * factorial(m)
    return [scale * value for value in out]


def fixed_even_literals(rows, nodes):
    literal = [row for row in rows if row["component"] != "Phi" and row["m"] % 2 == 0
               and nodes[row["y"]]["op"] == "rational"]
    assert [(row["id"], row["component"], row["m"]) for row in literal] == [
        (4469, "u", 0), (4483, "average", 0), (9836, "average", 2),
        (9839, "u", 2), (80392, "average", 4), (80395, "u", 4),
    ]
    # T>2 and e>2 give h<2^-16004. Since Q>j0^-2, the normalized
    # nonlinear error at any even m<=4 is below 2^12*j0^97 < h/2.
    assert 8002*2 == 16004 and 2*(53 - 4) - 1 == 97
    assert 16004*(4*97 - 1) - 12 > 1
    grid = 2**260
    result = []
    for row in literal:
        component, k, m = row["component"], row["k"], row["m"]
        assert k == 0 and row["y"] == 474
        a = normalized_even_polynomial(component, m)
        tail_cost = sum(abs(c) for c in a[2:])
        assert abs(a[1]) - tail_cost/4 >= 1
        assert abs(a[1]) + tail_cost + 1 < 2**14
        assert 16004 - 14 > 260
        sign = 1 if a[1] > 0 else -1
        scaled_base = a[0] * grid
        assert scaled_base.denominator == 1
        lower = scaled_base.numerator + min(sign, 0)
        upper = scaled_base.numerator + max(sign, 0)
        assert upper - lower == 1 and max(abs(lower), abs(upper)) < 64*grid
        assert 4*16004 - 6 > 260
        raw_sign = 1 if lower >= 0 else -1
        assert (lower >= 0) or (upper <= 0)
        result.append({
            "call": row["id"], "component": component, "etaOrder": m,
            "point": {"Y": 4, "eta": 0},
            "normalized": {
                "gauge": "multiply derivative by j0^-1",
                "comparisonPolynomialInH": [str(value) for value in a],
                "dyadicNumerators": [str(lower), str(upper)], "denominator": "2^260",
            },
            "raw": {"dyadicNumerators": [min(raw_sign, 0), max(raw_sign, 0)], "denominator": "2^260"},
        })
    return result


def run(args):
    read_source(args)
    graph = json.loads(pinned(args.expanded, "expanded"))
    transport = json.loads(pinned(args.transport, "transport"))
    calls = graph["calls"]
    assert calls == transport["newly"] and len(calls) == transport["certifiedRangeCount"] == 567
    assert transport["openRangeCount"] == 0 and not transport["nativeRootExistenceCertified"]
    assert len({row["id"] for row in calls}) == len(calls)
    assert Fraction(256, 63) < Fraction(41, 10)
    nodes = dict(graph["nodes"])
    assert nodes[474] == {"op": "rational", "args": ["4", "1"]}
    assert nodes[2] == {"op": "coordinate", "args": ["eta"]}
    covered = []
    no_pressure = []
    signatures = Counter()
    for row in calls:
        component, k, m = row["component"], row["k"], row["m"]
        node = {"op": "actual_natural_series", "args": [component, row["y"], 2, k, m]}
        assert nodes[row["id"]] == node and row["eta"] == 2
        signatures[(component, k, m)] += 1
        zero_center = component != "Phi" and k >= 2
        if zero_center:
            no_pressure.append(row["id"])
        covered.append({
            **row, "center": "0" if zero_center else "d_Y^k d_eta^m " + CENTER[component],
            "radius": f"2^-{260*(53 - m) - 12}",
        })
    totals = Counter(row["component"] for row in calls)
    assert totals == {"Phi": 263, "u": 190, "average": 114}
    assert len(no_pressure) == 17 and all(row["m"] <= 1 for row in calls if row["id"] in no_pressure)
    assert 260*(53 - 1) - 12 == 13508
    signature_table = [
        {"component": component, "k": k, "m": m, "count": count,
         "sourceErrorPrefactor": str(coefficient_error(component, k, m))}
        for (component, k, m), count in sorted(signatures.items())
    ]
    assert len(signature_table) == 41
    return {
        "schema": "MathScope.C142.AllOriginalNaturalSymbolicEnclosures/1",
        "status": "CONDITIONAL_SOURCE_SYMBOLIC_ENCLOSURE_567_OF_567",
        "pins": PINS,
        "counts": {"enclosed": 567, "components": totals, "distinctYArgumentNodes": len({row["y"] for row in calls})},
        "signatures": signature_table,
        "averageIdentity": "average_n=u_n/(n+1) for all n; integral_0^1 u(t*Y,eta) dt; all mixed derivatives factor t^k",
        "premises": [
            "Original written (14a)/(16) for the same-datum A.21 nonlinear fixed point",
            "Real original eta in [-1,1], with the original native branches and C139 chart assumptions defined",
        ],
        "pressureFreeNonlinearResidual": {"count": len(no_pressure), "ids": no_pressure, "uniformRadius": "2^-13508"},
        "specializations": fixed_even_literals(calls, nodes),
        "calls": covered,
        "originalNumericalAcceptanceIncrement": 0,
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in (*PINS, "output"):
        parser.add_argument(arg, type=Path)
    args = parser.parse_args()
    result = run(args)
    args.output.write_bytes((json.dumps(result, indent=2, sort_keys=True) + "\n").encode())
