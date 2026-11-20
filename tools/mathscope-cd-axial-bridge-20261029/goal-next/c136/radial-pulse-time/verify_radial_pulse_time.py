"""Bind the original mixed T,v wave variation for the radial collar."""

import argparse
from hashlib import sha256
import json
from pathlib import Path
import runpy


PINS = {
    "algebra": ("c135/radial-pulse-vv/verify_radial_pulse_vv.py",
                "ffd162b7c9c875dd57ac3d0adb8eaff3ad75cbe8df49e1bd38a65e373a0183e5"),
    "time": ("c134/radial-time-gaussian/radial-time-gaussian.json",
             "a69531c3a1be1d2c8fdf2a56f2b41d50c84f89b806134540c5072ea281091d23"),
    "pulse": ("c135/radial-pulse-vv/radial-pulse-vv.json",
              "21f501d7ebcb63a32871a992b15c95d31ed4abdb18240f311295e9e2032b5824"),
    "owners": ("c135/radial-all-tt/all-wave-tt.json",
               "0b2bc4cb556d2fcf45f2cc513f3e3fad2753bc01b256aa8226c6c5fe4037171d"),
}


def verify(goal):
    data = {}
    for key, (relative, expected) in PINS.items():
        path = goal / relative
        raw = path.read_bytes()
        assert sha256(raw).hexdigest() == expected
        if key == "algebra":
            data[key] = runpy.run_path(str(path))
        else:
            data[key] = json.loads(raw)
    time = data["time"]
    owners = data["owners"]
    assert time["status"] == "CONDITIONAL_FIXED_LABEL_ORIGINAL_RADIAL_WAVE_TT_TRACE"
    assert owners["sourceCensus"]["typedTimeUses"] == len(owners["rows"]) == 120
    assert owners["sourceCensus"]["exactForcedCurlComparisons"] == 120
    assert owners["sourceCensus"]["exactSignedCurlComparisons"] == 60
    assert all(row["subtractionCoefficient"] == 0 for row in owners["rows"])
    # Reuse the exact polynomial ring from the independent pulse replay.
    algebra = data["algebra"]
    add, neg, diff = (algebra[name] for name in ("add", "neg", "diff"))
    mul, atom, dot = (algebra[name] for name in ("mul", "atom", "dot"))
    vector, matrix, mv = (algebra[name] for name in ("vector", "matrix", "mv"))
    t, f, n = (vector(name) for name in ("t", "f", "n"))
    M, Pi = (matrix(name, 3, 3) for name in ("M", "Pi"))
    t_v = tuple(add(a, neg(b)) for a, b in zip(mv(M, t), mv(Pi, f), strict=True))
    actual = tuple(diff(term, "T") for term in t_v)
    M_T = tuple(tuple(diff(c, "T") for c in row) for row in M)
    Pi_T = tuple(tuple(diff(c, "T") for c in row) for row in Pi)
    first = mv(M_T, t)
    second = mv(M, tuple(diff(c, "T") for c in t))
    third = mv(Pi_T, f)
    fourth = mv(Pi, tuple(diff(c, "T") for c in f))
    formula = tuple(add(a, b, neg(c), neg(d))
                    for a, b, c, d in zip(first, second, third, fourth, strict=True))
    assert actual == formula and all(len(c) == 12 for c in actual)
    assert all(c != add(c, d) for c, d in zip(actual, third, strict=True))
    assert all(c != add(c, d) for c, d in zip(actual, fourth, strict=True))
    # Compare both differentiations of the exact mapped potential's product.
    # The n cross psi*t vector is checked using the same cyclic components.
    psi, inv_q = (atom(name) for name in ("psi", "invQ"))
    potential = tuple(mul(mul(psi, inv_q), add(mul(n[j], t[k]), neg(mul(n[k], t[j]))))
                      for j, k in ((1, 2), (2, 0), (0, 1)))
    for term in potential:
        assert diff(diff(term, "T"), "v") == diff(diff(term, "v"), "T")
    # Differentiate the norm geometry rather than treating its variation constant.
    q = dot(n, n)
    assert diff(diff(q, "T"), "v") == diff(diff(q, "v"), "T")
    return {
        "status": "CONDITIONAL_ORIGINAL_FIXED_LABEL_MIXED_PULSE_TIME_WAVE_TRACE",
        "pins": PINS, "nativeWaveOwners": len(owners["rows"]),
        "mixedForcedTermsPerComponent": len(actual[0]),
        "mixedForcedIdentity": "t_Tv=M_T*t+M*t_T-Pi_T*f-Pi*f_T",
        "sameMixedPotentialByBothOrders": True,
        "sourceInterpretation": [
            "v, xi, Ls, c_i and the original palette label are fixed under native T",
            "The original fast operator equals the v derivative after the original fixed-lift pullback",
            "Both commuting curl directions R and Z, and L, are inside the C134 first-T forcing downset",
            "Original derivative powers: harmonic one at least sqrt(zeta), harmonic two at least zeta",
        ],
        "wholeRadialC1": "OPEN", "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--goal", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    args = p.parse_args()
    result = verify(args.goal)
    args.out.write_bytes((json.dumps(result, sort_keys=True, indent=2) + "\n").encode())
    print(result["status"])
