#!/usr/bin/env python3
"""Exact constants for the B.29 activation-collar implication."""

import hashlib
import json
from datetime import datetime, timezone
from fractions import Fraction as F
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    checks = {
        "referenceMargin": F(11, 5)-2*F(1, 10) == 2,
        "absolutePcMargin": F(11, 5)-F(1, 10) == F(21, 10),
        "flatExponentAtOneEighth": F(1, 8)**-2 == 64,
        "sigmaDenominatorBound": F(1, 2)*F(1, 2) == F(1, 4),
        "dyadicFlatLowerBound": 4*3**64 < 2**104,
        "flatUpperExponentAtOneQuarter": -F(1, 4)**-2+F(3, 4)**-2 == -F(128, 9),
        "flatUpperDyadicExponent": F(128, 9) > 14,
        "leftCollarShearGap": (1-F(1, 2**14))*F(11, 5)-F(1, 10*2**14) > F(21, 10),
        "quadraticGapCoefficient": 2-F(1, 4) == F(7, 4) and F(7, 4) > 1,
        "absoluteDyadicLinearGap": 2*F(1, 2**104) == F(1, 2**103),
        "absoluteDyadicQuadraticGap": 4*F(1, 2**104)**2 == F(1, 2**206),
        "loopD0": 4*F(1, 40) == F(1, 10),
        "directionalLinearMargin": 1+F(1, 20)**2 < 4,
        "directionalQuadraticMargin": F(1, 4) < 2-F(1, 2),
        "analyticAndModulationOrdering": 0 < F(1, 16) < F(1, 8) < F(1, 4) < 1,
        "widthSelectorLinearSmallness": F(1, 10**8) < F(1, 10),
        "widthSelectorQuadraticSmallness": F(1, 10**16) < 1,
        "fixedWidthLinearExponent": 49-120 == -71 and F(1, 4**71) < F(1, 10),
        "fixedWidthQuadraticExponent": 5+2*49-2*120 == -137 and F(1, 4**137) < 1,
        "fixedWidthShearLowerExponent": -120-1-1 == -122,
    }
    if not all(checks.values()):
        raise ValueError([k for k, v in checks.items() if not v])
    outbase = ROOT / "activation-review"
    outbase.mkdir(exist_ok=True)
    number = 1
    while (outbase / f"{number:04d}").exists():
        number += 1
    out = outbase / f"{number:04d}"
    out.mkdir()
    receipt = {
        "schema": "mathscope-activation-collar-implication-v1",
        "generatedUTC": datetime.now(timezone.utc).isoformat(),
        "proofSHA256": sha(ROOT / "ACTIVATION_COLLAR_BOUNDS_EN.md"),
        "checkerSHA256": sha(Path(__file__)),
        "checks": checks,
        "allPassed": True,
        "requiredActualInputs": ["the same B.29 comparison bounds A1", "positive width satisfying A2", "the same B.30 smooth factorization"],
        "newUniformBounds": {"activationPcMinus2": "1/10", "activationAwayFromEdgePcMinusV": "2^-103", "activationAwayFromEdgeQuadraticGap": "2^-206", "closedFirstCollarVMinus2": "1/10", "closedFirstCollarNormalizedKappa": "1/2"},
        "wholeFinalSourceInputsVerifiedByThisScript": False,
        "fullProfileCertified": False,
        "N3_06AutomaticallyPromoted": False,
        "newLeanProof": False,
    }
    (out / "receipt.json").write_text(json.dumps(receipt, indent=2)+"\n")
    print(json.dumps({"allPassed": True, "scalarChecks": len(checks),
                      "receipt": str(out / "receipt.json"),
                      "fullProfileCertified": False}, indent=2))


if __name__ == "__main__":
    main()
