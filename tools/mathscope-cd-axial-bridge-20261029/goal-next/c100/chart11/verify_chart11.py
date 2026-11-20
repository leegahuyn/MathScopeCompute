"""Original ordinary R/Z/T pointwise chart coefficients through order eleven."""

from argparse import ArgumentParser
from fractions import Fraction
from functools import cache
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path


KERNEL = "384daafdcb5cad2e57b4bbb0440bc4b2e4a5912b4835e2d7510c21301a44ff15"
CHART10 = "5e770e398e3db1376bafacfcc06e5b5cb92a582db8eca4432f520873caf582c3"
INHERITED = "f15c6f354276be183238c3d829c335b71e33d3d08f28a0fae49ca17e46d35eb5"


def pinned(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


@cache
def support(alpha):
    if not any(alpha):
        return frozenset({(0, 0, 0)})
    axis = max(i for i, order in enumerate(alpha) if order)
    parent = tuple(n - (i == axis) for i, n in enumerate(alpha))
    prior = support(parent)
    directions = (1,) if axis == 0 else (0, 1, 2)
    return prior | frozenset(
        tuple(n + (i == j) for i, n in enumerate(beta))
        for beta in prior for j in directions
    )


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("kernel", "chart10", "inherited", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    a = parser.parse_args()
    source = pinned(a.kernel, KERNEL).decode()
    for literal in (
        "[G.zero,G.div(R,s),G.zero]",
        "[G.mul(q(2),eta,inverseD,inverseL),G.neg(G.mul(q(2),eta,X,inverseD,inverseL)),G.mul(d,inverseD,inverseL)]",
        "[G.div(inverseL,s),G.neg(G.div(G.mul(X,inverseL),s)),G.neg(G.div(G.mul(D,eta,inverseL),s))]",
        "alpha.findLastIndex(x=>x>0)",
        "put([...term.profileOrders],chart.derivative(term.coefficient,axis));",
        "put(beta,G.mul(term.coefficient,chart.coefficients[axis][j]));",
    ):
        assert literal in source, literal
    old = json.loads(pinned(a.chart10, CHART10))
    exact_box = json.loads(pinned(a.inherited, INHERITED))
    assert old["originalC8CoefficientProofSHA256"] == INHERITED
    assert old["sourceKernelSHA256"] == KERNEL
    assert exact_box["box"] == {"s": ["1/2", "2"], "X": ["Xa/2", "2Xb"], "eta": ["-1", "1"]}
    assert exact_box["initialMultipliers"] == ["s^(-A-1/2)", "s^(-A)", "s^(-A-1/2)/sqrt(2X)", "s^(-A)"]

    atom_order = 12
    # On the complex eta disk of radius 1/4, |1-2h*eta^2|>1/2.
    assert 1 - 2*Fraction(1, 64)*Fraction(5, 4)**2 > Fraction(1, 2)
    reciprocal = 2*4**atom_order*factorial(atom_order)
    half_integer_power = factorial(atom_order + 1)
    s_bound = 2**(atom_order + 2)*half_integer_power
    # |X^-1| <= Hc and X <= Hc^2. One algebraic X-power per coefficient.
    x_geometry = atom_order + 2
    # Four-factor total-order product, then convert an Euler-s coefficient.
    base = 8*4**atom_order*s_bound*half_integer_power*reciprocal
    atom_dyadic = 176
    assert 2*2**atom_order*base < 2**atom_dyadic
    step_debit = 15
    assert 6*2**atom_order < 2**step_debit
    assert atom_order - 11 == 1
    recurrence = [{"order": j, "dyadic": atom_dyadic+j*(atom_dyadic+step_debit),
                   "geometry": x_geometry*(j+1)} for j in range(12)]
    term_count = comb(14, 3)
    assert term_count == 364 and 4*term_count < 2**11
    rows = []
    for r in range(12):
        for z in range(12-r):
            for t in range(12-r-z):
                alpha = (r, z, t)
                upper = sorted(support(alpha))
                assert max(map(sum, upper)) == sum(alpha) and len(upper) <= term_count
                rows.append({"ordinarySlowOrders": list(alpha), "profileUpperSupport": [list(x) for x in upper],
                             "positiveProfileTermCap": len(upper),
                             "leadingProfileTermCap": sum(x[0] == 0 for x in upper)})
    assert len(rows) == term_count
    assert [row for row in rows if sum(row["ordinarySlowOrders"]) <= 10] == old["slowOrders"]
    top = recurrence[-1]
    assert (top["dyadic"], top["geometry"]) == (2277, 168)
    proof = {
        "status": "VERIFIED_SOURCE_CHART_RECURRENCE_CONDITIONAL_ORIGINAL_REALIZATION",
        "sourceKernelSHA256": KERNEL, "previousPointwiseSHA256": CHART10, "originalBoxSHA256": INHERITED,
        "atomDerivativeOrder": atom_order, "atomCoefficientCap": "2^176*Hc^14",
        "coefficientRecurrence": recurrence, "ordinaryDirections": len(rows), "newOrderElevenDirections": 78,
        "combinedPointwiseFactor": "2^2288*Hc^168", "slowOrders": rows,
        "open": ["Original C11 physical profile bound", "Original C10 target and Primary frame",
                 "Complete C11 FTC faces and final field jets"],
        "finalJets": "0/67", "release": "HOLD",
    }
    with a.out.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(proof, handle, indent=2)
        handle.write("\n")
    print("PASS original pointwise chart recurrence: 364 RZT orders, including 78 at degree eleven.")


if __name__ == "__main__":
    main()
