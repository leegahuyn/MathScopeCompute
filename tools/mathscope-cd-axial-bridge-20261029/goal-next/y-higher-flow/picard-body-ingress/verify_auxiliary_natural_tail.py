"""Check explicit geometric natural tail moduli on the original auxiliary domains."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
from math import comb, factorial, prod
import json
from pathlib import Path


PINS = {
    "actual-continuation-exact-functions.mjs": "326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311",
    "actual-continuation-exact-tail.mjs": "fa569df96f7950e4c1d908405d8a30bcb73088b1e2d3af7a0baa047d4b2a3df0",
    "actual-continuation-exact-inner.mjs": "3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8",
    "actual-residual-order-induction-source.mjs": "30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047",
    "SAME_DATUM_ANALYTIC_AXIS.md": "1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920",
}


def read(path, markers):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[path.name], path
    for marker in markers:
        assert raw.count(marker.encode()) == 1, (path.name, marker)


def check_geometric_tail(radius, eta_ratio, threshold, small_control):
    raw_ratio = radius / 20 / (1 - eta_ratio)
    comparison = 1 / (2 * raw_ratio)
    assert comparison > 1
    assert (threshold + 12) ** 24 <= comparison ** threshold
    assert Fraction(threshold + 13, threshold + 12) ** 24 <= comparison
    assert (small_control + 12) ** 24 > comparison ** small_control
    # Once the worst degree-24 polynomial satisfies both comparisons,
    # its ratio decreases and comparison^n dominates it for every n.
    controls = 0
    for k in range(13):
        for m in range(13):
            n = threshold
            rising_falling = factorial(m) * comb(n + m, m) * prod(range(n - k + 1, n + 1))
            assert rising_falling <= (n + m) ** (k + m) <= (n + 12) ** 24
            # Exact rising-binomial Taylor identity for a further eta
            # displacement from a real centre, including the m! factor.
            for displacement_order in range(4):
                lhs = Fraction(factorial(m + displacement_order) * comb(n + m + displacement_order, m + displacement_order), factorial(displacement_order))
                rhs = factorial(m) * comb(n + m, m) * comb(n + m + displacement_order, displacement_order)
                assert lhs == rhs
                controls += 1
    return {
        "radius": str(radius), "etaDisplacementOverRho": str(eta_ratio),
        "ratioBeforePolynomial": str(raw_ratio), "comparisonBase": str(comparison),
        "minimumRetainedDegreeForThisCertificate": threshold,
        "rejectedSmallerSufficientThreshold": small_control,
        "derivativeOrders": {"Y": [0, 12], "eta": [0, 12]},
        "TaylorCoefficientIntegerControls": controls,
        "tail": "Q*rho^(-m)*(1-etaDisplacementOverRho)^(-m-1)*2^(-N)",
        "conservativeBitsDegree": "ceil((m+1)*131072*T)+m+1+bits",
    }


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("source", "analysis", "ingress", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    if not __debug__:
        parser.error("assertions are required")
    read(args.source / "actual-continuation-exact-functions.mjs", (
        "this.simultaneousSubstitute(id,[s.xi,s.eta],[xi,eta])",
        "this.picardRhs(system,component,this.mul(t,xi),eta,etaOrder)",
        "this.substitute(f,s.xi,this.mul(t,s.xi))",
        "this.simultaneousSubstitute(body,[s.xi,s.eta],[this.mul(this.sqrt(X),...variables),eta])",
    ))
    read(args.source / "actual-continuation-exact-tail.mjs", (
        "This uniform actual-core tail uses 0<=Y<=5.",
        "power(Y,n-k)",
    ))
    read(args.source / "actual-continuation-exact-inner.mjs", (
        "const delta=G.div(rho,G.mul(q(1024),Q))",
        "loss=G.div(delta,q(8))",
    ))
    read(args.source / "actual-residual-order-induction-source.mjs", (
        "strip=G.div(delta,q(8n*256n**BigInt(n))),sourceStrip=G.mul(q(4),strip)",
        "radius=G.add(q(6),q(1,1n<<BigInt(n-1)))",
        "atXi=id=>G.substitute(id,X,G.pow(xi,2))",
    ))
    read(args.analysis, (
        "where each `E_(n,m)` is an outward enclosure error", "coefficient weight and the binomial-series identity",
        "`B_n=u_n/(n+1)`, the coefficients of the regular radial average",
    ))
    ingress_bytes = args.ingress.read_bytes()
    ingress = json.loads(ingress_bytes)
    assert ingress["status"] == "PASS_BODY_INGRESS"
    auxiliary = [row for row in ingress["sourceSystems"] if row["kind"] == "auxiliary"]
    assert [row["system"] for row in auxiliary] == [1, 2, 4, 6, 8]
    assert [Fraction(row["upperY"]) for row in auxiliary] == [6 + Fraction(1, 2 ** n) for n in range(5)]
    assert all(not row["unproved"] and max(row["naturalDerivativeOrderMax"]) <= 12 for row in auxiliary)
    # delta=rho/(1024Q), Q>=1. The largest retained source strip is
    # the bootstrap delta/4; all the auxiliary strips are smaller.
    original_strip_over_rho_upper = Fraction(1, 4096)
    assert Fraction(1, 2 * 256 * 1024) < original_strip_over_rho_upper < Fraction(1, 8)
    receipt = {
        "status": "PASS_EXACT_GEOMETRIC_MODULUS_CONDITIONAL_ON_ORIGINAL_COEFFICIENT_NORM",
        "sourcePins": PINS, "typedCoefficientIngressSHA256": sha256(ingress_bytes).hexdigest(),
        "sourceStripOverRhoUpper": str(original_strip_over_rho_upper),
        "realAuxiliaryTail": check_geometric_tail(Fraction(7), Fraction(0), 512, 256),
        "complexAuxiliaryCoreTail": check_geometric_tail(Fraction(8), Fraction(1, 8), 4096, 1024),
        "finiteNativeRadiusTransfer": "Both ordinary Volterra value constructors use t*xi with t in [0,1]. The even-profile constructor uses sqrt(X) times a product of such binders. The same original eta is retained.",
        "conditions": [
            "The original coefficient-space bound Q and analytic interpretation used in source equation (20) apply to the same coefficients.",
            "The threshold is sufficient for the source derivative orders 0 through 12. The same polynomial versus geometric argument gives a finite threshold for any fixed derivative orders.",
        ],
        "open": [
            "The native exact coefficient producer and its displayed finite evaluator are separate from this mathematical remainder estimate.",
            "The public original tail numerical API only accepts real 0<=Y<=5. The proof does not change that API.",
            "Derivative materialization, ordinary-to-native Picard limit agreement, source coefficient majorants at all orders, and all original chart ingresses remain separate.",
        ],
    }
    with args.out.open("x", encoding="utf-8", newline="\n") as file:
        json.dump(receipt, file, indent=2)
        file.write("\n")
    print(receipt["status"])


if __name__ == "__main__":
    main()
