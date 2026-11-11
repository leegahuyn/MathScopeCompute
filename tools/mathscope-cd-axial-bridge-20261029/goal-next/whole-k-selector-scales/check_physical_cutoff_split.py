"""Bind the exact common cutoff and fourth correction faces to physical K."""
from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
from subprocess import check_output

import sympy as sp

LOCALIZATION_REV = "9595b4de5a1065b694d225c0ad2a14d5aa4435a9"
LOCALIZATION_PATH = "research-ide/mathscope-m3/navier/source-localization.mjs"
PINS = {
    "scales": "a4c58765594add6fe9d5d460d2f5c6861003f7ed9d13f31f3c2828ab3f756d96",
    "chart": "af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9",
    "tail": "7f1b591721b768ea0c73cfed346d102d7a92752ab9f2c21487fed33b180ef18b",
}


def read(path, name):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[name]
    return json.loads(raw)


def exact_geometry():
    rho = sp.Symbol("rho", positive=True)
    half = sp.Rational(1, 2)
    total = sp.sqrt(2)*half
    lower_third = sp.integrate(2*sp.sqrt(1-rho), (rho, half, 1))
    assert sp.simplify(lower_third/total) == sp.Rational(2, 3)
    cap = sp.Rational(16, 27)
    assert cap-half == sp.Rational(5, 54)
    axial_time_cap = sp.integrate(2*sp.sqrt(cap-rho), (rho, half, cap))
    assert sp.simplify(axial_time_cap-sp.Rational(4, 3)*(cap-half)**sp.Rational(3, 2)) == 0
    # C^-h < exp(1/16) < 16/15 by C>1/2 and the positive series.
    squared_ratio = Fraction(4, 3)**2 * 2 * Fraction(16, 15)**2 * Fraction(5, 54)**3
    assert squared_ratio < Fraction(1, 16)**2
    return {
        "normalizedFullAxialTimeMeasure": "1/sqrt(2)",
        "positiveThirdCutoffAxialTimeMeasure": "sqrt(2)/3",
        "positiveThirdCutoffFractionOfKSlab": "2/3",
        "fourthCorrectionAxialTimeMeasureUpper": "(4/3)*(16/27)^(-h)*(5/54)^(3/2)",
        "fourthCorrectionFractionOfKSlabStrictUpper": "1/16",
        "fourthCorrectionFractionSquaredRationalUpper": str(squared_ratio),
    }


def main():
    parser = ArgumentParser(description=__doc__)
    for option in ("repo", "scales", "chart", "tail", "out"):
        parser.add_argument("--"+option, type=Path, required=True)
    args = parser.parse_args()
    scales = read(args.scales, "scales")
    chart = read(args.chart, "chart")
    tail = read(args.tail, "tail")
    assert scales["exactRatios"] == {"b1*qBig": 1, "b2*qBig": 16, "b3*qBig": 32}
    assert chart["variables"]["rho"] == "tau/tau0 with tau=1-t and tau0=qBig/32"
    assert chart["variables"]["chart_equation"] == "Q - sigma * Q^(2h) = rho"
    assert chart["variables"]["bounds"] == ["1/2 <= Q < 2", "|eta| < 3/4", "q < qBig/16"]
    assert chart["background"]["first_flat_zero_order"] == 4
    assert "Q<16/27" in tail["stageSupport"]["stage4PossibleSupport"]
    raw = check_output(["git", "show", f"{LOCALIZATION_REV}:{LOCALIZATION_PATH}"], cwd=args.repo)
    for marker in (
        "tau=q*(1-eta^2), z=q^D*eta, X=r^2/(2q)",
        "tau0===G.div(qStar,q(32))&&z0===G.exp(G.mul(D,G.log(tau0)))&&r0===G.one",
        "compactK:{definition:'{x1^2+x2^2<=r0^2/2, x3^2<=z0^2/2}'",
    ):
        assert marker.encode() in raw
    result = {
        "schema": "MathScope.N7.OriginalPhysicalCutoffSplit/1",
        "status": "VERIFIED_PHYSICAL_CUTOFF_PARTITION",
        "pinnedSHA256": PINS,
        "localization": {"commit": LOCALIZATION_REV, "path": LOCALIZATION_PATH, "sha256": sha256(raw).hexdigest()},
        "normalizedCoordinateDomain": "rho in [1/2,1], zeta^2<=1/2, r^2<=r0^2/2",
        "strictMonotonicityProof": "On 1/2<=Q<=2, Q^(2h-1)<=2 for 0<h<1/16; therefore d(Q-zeta^2 Q^(2h))/dQ >= 1-2h > 7/8.",
        "thirdSeam": "Q=1 iff rho+zeta^2=1; positive cutoff iff rho+zeta^2<1.",
        "physicalCutoffs": {
            "order1": "chi(Q/32)=1",
            "order2": "chi(Q/2), equal to one on rho+zeta^2<=1, positive everywhere",
            "order3": "chi(Q), flat zero on rho+zeta^2>=1",
            "order4AndAbove": "flat zero on K",
        },
        "physicalOmittedScaleGuards": {
            "N0AndN1": "fail on K",
            "N2": "hold iff rho+zeta^2>=1",
            "N3": "hold on K",
            "frozenRepresentative": "Separate simultaneous source guard",
        },
        "fourthCorrectionPossibleSupport": "rho+(16/27)^(2h)*zeta^2<16/27 and 1/2<=rho",
        "measure": exact_geometry(),
        "scope": "Exact physical cutoff sectors and support measures. Current/pressure chart admission, representative guards, and actual annular jet values are separate.",
        "N7_06": "OPEN",
        "N8_05": "OPEN",
        "finalJets": 0,
        "release": "HOLD",
    }
    encoded = (json.dumps(result, indent=2)+"\n").encode()
    args.out.write_bytes(encoded)
    print("PASS exact physical third cutoff seam and fourth correction support volume")
    print(f"{sha256(encoded).hexdigest()}  {args.out.name}")


if __name__ == "__main__":
    main()
