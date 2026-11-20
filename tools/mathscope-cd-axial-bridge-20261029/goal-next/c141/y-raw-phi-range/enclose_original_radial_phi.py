"""Certify narrow raw Phi enclosures over the original active real source range."""

import argparse
from collections import Counter
from fractions import Fraction
from hashlib import sha256
import json
from math import factorial
from pathlib import Path


BASE_PINS = {
    "expanded": "797b0331d34b8e1011c7e5c0e993e3cd2e0fdc864b410085c69c126e14b971b7",
    "reach": "e7a22f8745f4c80bf72d165d6372b20043bab5b5e43d929f58807d42f115a295",
    "transport": "4b182213f17d389426fd355eb7f254915e87134ae91762b512114751d373ba37",
    "c140": "07f6667669f5bcce05e515b00592b179e74ccbf8c2ab6be2bb7371857dd1323e",
    "c140_proof": "f1f11ec115c6e25fd80fe2142c19ee156a76ea482b93c01c38c5a1678033b4b7",
}


def read_pinned(path, name):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == BASE_PINS[name], name
    return raw


def falling(n, k):
    return factorial(n) // factorial(n - k)


def highest_tail_term(k, n, y_max):
    return Fraction(falling(n, k), 2**n * factorial(n) * factorial(n + 1)) * y_max ** (n - k)


def certify_radial_order(k, y_max):
    # A positive-series majorant for all weights (n)_k Y^(n-k)/5^n.
    # The sum of the weights at Y=y_max is k! * 5/(5-y_max)^(k+1).
    weight_sum = factorial(k) * 5 / (5 - y_max) ** (k + 1)
    assert weight_sum < 64
    radial_perturbation = Fraction(64, 2**15852)
    assert radial_perturbation < Fraction(1, 2**264)

    # For n >= degree+1 these ratios decrease in n; the terms alternate.
    degree = k
    while highest_tail_term(k, degree + 1, y_max) >= Fraction(1, 2**264):
        degree += 1
    first_omitted = degree + 1
    first_omitted_magnitude = highest_tail_term(k, first_omitted, y_max)
    ratio = y_max / (2 * (first_omitted + 1 - k) * (first_omitted + 2))
    assert 0 < ratio < 1
    assert first_omitted_magnitude + radial_perturbation < Fraction(1, 2**262)
    return {
        "k": k, "m": 0, "degree": degree,
        "radialWeightSum": str(weight_sum),
        "alternatingRatioUpper": str(ratio),
        "firstOmittedMagnitudeAtMaximum": str(first_omitted_magnitude),
    }


def run(paths):
    g, r, t, c = (json.loads(read_pinned(getattr(paths, name), name))
                  for name in ("expanded", "reach", "transport", "c140"))
    proof = read_pinned(paths.c140_proof, "c140_proof")
    assert b"sum |d_n| Y^n" in proof and b"2^-15852" in proof
    assert g["calls"] == r["calls"] == t["newly"]
    assert len(g["calls"]) == t["certifiedRangeCount"] == 567
    assert t["openRangeCount"] == 0 and not t["unsupported"]
    assert not t["nativeRootExistenceCertified"]
    assert c["originalPhiVsRecurrenceBound"].startswith(
        "|a(Y,eta)-b(Y,eta)| <= 256 Q^(-61) < 2^(-15852)"
    )
    assert c["bRecurrence"] == "b_0=1, b_(n+1)=-chi*b_n/(2(n+1)(n+2))"
    y_max = Fraction(41, 10)
    assert Fraction(256, 63) < y_max < 5

    nodes = dict(g["nodes"])
    literal_calls = [call for call in g["calls"] if nodes[call["y"]]["op"] == "rational"]
    assert len(literal_calls) == 15
    assert {call["y"] for call in literal_calls} == {474}
    assert nodes[474] == {"op": "rational", "args": ["4", "1"]}
    literal_phi = [call for call in literal_calls if call["component"] == "Phi"]
    assert [(call["id"], call["k"], call["m"]) for call in literal_phi] == [
        (4468, 0, 0), (5748, 0, 1), (10450, 0, 2), (20811, 0, 3), (81559, 0, 4)
    ]

    rows = [call for call in g["calls"] if call["component"] == "Phi" and call["m"] == 0]
    counts = Counter(row["k"] for row in rows)
    assert counts == {0: 51, 1: 20, 2: 5, 3: 1}
    for row in rows:
        expect = ["Phi", row["y"], row["eta"], row["k"], row["m"]]
        assert nodes[row["id"]] == {"op": "actual_natural_series", "args": expect}
        assert nodes[row["eta"]] == {"op": "coordinate", "args": ["eta"]}
    signatures = [certify_radial_order(k, y_max) for k in range(4)]
    expected_degrees = [38, 38, 38, 39]
    assert [signature["degree"] for signature in signatures] == expected_degrees
    return {
        "schema": "MathScope.C141.OriginalRawPhiSourceRangeEnclosures/1",
        "status": "CONDITIONAL_RAW_PHI_SYMBOLIC_ENCLOSURE_ON_DEFINED_NATIVE_BRANCHES",
        "pins": BASE_PINS,
        "literalYArguments": [{"node": 474, "value": 4, "allComponentsCount": 15, "PhiCalls": literal_phi}],
        "scope": {
            "enclosedCallCount": len(rows), "radialSignatureCounts": counts,
            "distinctYArgumentNodes": len({row["y"] for row in rows}),
            "remainingEtaDerivativeLiteralPhiCalls": [row["id"] for row in literal_phi if row["m"]],
        },
        "enclosure": {
            "target": "d_Y^k Phi(Y,eta)",
            "center": "sum_{n=k}^{degree_k} (-chi(eta))^n (n)_k Y^(n-k)/(2^n n! (n+1)!)",
            "chi": "Hstar(eta)^2 / (Hstar(eta)^2 + sigmaStar^2), exact original profile",
            "radius": "2^-262", "fullWidth": "2^-261",
            "uniformRange": "0<=Y<=41/10, -1<=eta<=1, both real",
            "rawRadialPerturbationUpper": "2^-15846 (strict)",
            "signatures": signatures,
        },
        "premises": [
            "C140 original A.21 and same-datum ordinary B_rho coefficient norm",
            "C139 native branches and all used original chart premises are defined",
            "Original real formal eta lies in [-1,1]",
        ],
        "numericalAcceptanceIncrement": 0,
        "finalJets": 0, "release": "HOLD",
        "calls": rows,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in (*BASE_PINS, "output"):
        parser.add_argument(arg, type=Path)
    args = parser.parse_args()
    report = run(args)
    args.output.write_bytes((json.dumps(report, indent=2, sort_keys=True) + "\n").encode())
