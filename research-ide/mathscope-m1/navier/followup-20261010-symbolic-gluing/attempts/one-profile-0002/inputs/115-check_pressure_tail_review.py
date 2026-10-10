#!/usr/bin/env python3
"""Independent exact constants for the literal A.21 tail argument."""

import hashlib
import json
from datetime import datetime, timezone
from fractions import Fraction as F
from pathlib import Path


ROOT = Path(__file__).resolve().parent
NAVIER = ROOT.parent
SYMBOLIC = NAVIER / "followup-20261010-symbolic-gluing"
REVIEWED_DATUM_SHA = "8dfd40a7206871b425e69894ead0321fe6f476c338f0532739c1d055a920386d"
REVIEWED_OUTER_SHA = "ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81"


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    checks = {
        "reference_pressure_coefficient": F(1, 2)/F(1, 5) == F(5, 2),
        "first_transition_E_log_slope": F(3, 5)-F(1, 2) == F(1, 10),
        "first_transition_E_squared_slope": 2*F(1, 10) == F(1, 5),
        "first_transition_E_squared_sigma": 2*F(3, 5) == F(6, 5),
        "exact_axial_start_amplitude": F(1, 10)-F(3, 5)*F(1, 2) == -F(1, 5),
        "exact_axial_start_squared_amplitude": 2*(-F(1, 5)) == -F(2, 5),
        "terminal_log_slope_negative": -1+F(1, 4) == -F(3, 4),
        "whole_strip_positive_real_part": 1-F(1, 16)**2 == F(255, 256),
        "whole_strip_angular_square_bound": F(256, 255)**2 < 2,
        "pressure_half_angular_bound": F(1, 2)*F(256, 255)**2 < 1,
        "T_positive_series_bound": F((2**20)**2, 2) == 2**39,
        "T_exceeds_1024": 2**39 > 1024,
        "e_positive_partial_series": sum(F(1, n) for n in [1, 1, 2, 6]) == F(8, 3),
        "tail_below_two_minus1400": 2*F(3, 8)**1024 < F(1, 2**1400),
        "degree48_Cauchy_error_still_tiny": -1400+4*48 < -256,
        "prefix_cP_coarse_bound": F(5, 2)+1+F(1, 2) == 4,
    }
    datum = SYMBOLIC / "PRESSURE_DATUM_INTERVAL.md"
    outer = NAVIER / "followup-20261010-outer-reselection/OUTER_DERIVATION.md"
    bindings = {
        "reviewed_actual_datum_revision": sha(datum) == REVIEWED_DATUM_SHA,
        "reviewed_literal_outer_revision": sha(outer) == REVIEWED_OUTER_SHA,
    }
    if not all(checks.values()) or not all(bindings.values()):
        raise ValueError({"scalar": [k for k,v in checks.items() if not v],
                          "binding": [k for k,v in bindings.items() if not v]})
    base = ROOT / "pressure-tail-review"
    base.mkdir(exist_ok=True)
    number = 1
    while (base / f"{number:04d}").exists():
        number += 1
    out = base / f"{number:04d}"
    out.mkdir()
    proof = ROOT / "PRESSURE_TAIL_REVIEW_EN.md"
    for path in [proof, Path(__file__)]:
        (out / path.name).write_bytes(path.read_bytes())
    receipt = {
        "schema": "mathscope.actual-A21-tail.independent-scalar-review.v1",
        "generatedUTC": datetime.now(timezone.utc).isoformat(),
        "sourceBinding": {"paperSHA256": "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
            "datumProofSHA256": sha(datum), "outerProofSHA256": sha(outer),
            "reviewSHA256": sha(proof), "checkerSHA256": sha(__file__),
            "acceptedPrefixReceiptSHA256": sha(SYMBOLIC / "attempts/pressure-prefix-0002/receipt.json")},
        "checks": checks, "sourceBindings": bindings, "allPassed": True,
        "reviewConclusion": {
            "literalAxialFieldHasThetaOneThroughout": True,
            "actualAllStagePostAxialLogCoefficientSlopeAtMostMinusHalf": True,
            "actualA21TailErrorBelowTwoExpMinusT": True,
            "wholeHorizontalStrip": "|Im z| <= 1/16",
            "dyadicErrorUpperBound": "2^(-1400)",
            "datumReplacedByRationalApproximation": False,
            "independentPrefixQuadratureRerunByThisScript": False,
            "fullProfileCertified": False,
            "newLeanProof": False,
        },
    }
    (out / "receipt.json").write_text(json.dumps(receipt, indent=2)+"\n")
    print(json.dumps({"allPassed": True, "scalarChecks": len(checks), "sourceBindings": len(bindings),
                      "receipt": str(out / "receipt.json")}, indent=2))


if __name__ == "__main__":
    main()
