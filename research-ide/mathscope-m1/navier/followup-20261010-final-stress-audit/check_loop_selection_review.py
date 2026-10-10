#!/usr/bin/env python3
"""Exact scalar checks attached to an independent continuous C.1 review."""

import hashlib
import json
from datetime import datetime, timezone
from fractions import Fraction as F
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent / "followup-20261010-symbolic-gluing/QUANTITATIVE_LOOP_SELECTION.md"
SOURCE_SHA = "937cfaace88466009c5f47a763e0f983d983c350fd754cd4cc57ad148d5897e6"


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if sha(SOURCE) != SOURCE_SHA:
        raise ValueError("The reviewed loop derivation has changed")
    upper_m1 = F(5, 4) + F(1, 64)/(1-F(1, 36))
    checks = {
        "correctFirstGeometricTailRatio": F(1, 4*3**2) == F(1, 36),
        "smallArgumentNormalizer": upper_m1**2 < 2,
        "smallArgumentVarianceConstant": F(1, 2)/2 == F(1, 4),
        "largeArgumentRatioConstant": F(1, 12)/F(1, 2) == F(1, 6),
        "largeArgumentThreshold": 144 == 12**2 and F(12, 6)-1 >= F(12, 12),
        "middleArgumentComparison": F(1, 4) >= F(12, 48),
        "commonLargeArgumentDenominator": F(1, 12) >= F(1, 64) and F(1, 48) >= F(1, 64),
        "smallBranchBracketCoefficient": F(4**2, 4) == 4,
        "largeBranchBracketCoefficient": 2**16 == 256**2 and F(256, 64) == 4,
        "bracketExceedsRequiredVariance": 4 > 3,
        "signedRootDerivativePrefactor": F(1, 2*2) == F(1, 4),
        "signedRootDerivativeExponent": 4+2 == 6,
        "signedRootAtZero": F(1, 2) > F(1, 4)**2,
        "deltaBelowOne": F(1, 2) < 1,
        "fullFamilyLinearGap": 4-1-1 == 2,
        "fullFamilyQuadraticGap": 2*2**2-4 == 4,
        "activeCutoffLinearGap": 4-1-F(1, 2) == F(5, 2),
        "activeCutoffQuadraticGap": 2*F(5, 2)**2-2 == F(21, 2) and F(21, 2) > 4,
        "unchangedCutoffVGap": F(1, 4) > F(1, 8),
        "boundaryCutoffExclusion": 2 > F(1, 4),
    }
    if not all(checks.values()):
        raise ValueError([key for key, value in checks.items() if not value])
    outbase = ROOT / "loop-review"
    outbase.mkdir(exist_ok=True)
    number = 1
    while (outbase / f"{number:04d}").exists():
        number += 1
    out = outbase / f"{number:04d}"
    out.mkdir()
    receipt = {
        "schema": "mathscope-independent-c1-loop-review-v1",
        "generatedUTC": datetime.now(timezone.utc).isoformat(),
        "sourceSHA256": sha(SOURCE),
        "reviewSHA256": sha(ROOT / "LOOP_SELECTION_INDEPENDENT_REVIEW_EN.md"),
        "checkerSHA256": sha(Path(__file__)),
        "checks": checks,
        "allPassed": True,
        "continuousArgumentsReviewedSeparatelyInNamedDocument": True,
        "actualFinalSourceBoundsSupplied": False,
        "finiteModulationNSelected": False,
        "modulationDebtCertified": False,
        "N3_06AutomaticallyPromoted": False,
        "newLeanProof": False,
    }
    (out / "receipt.json").write_text(json.dumps(receipt, indent=2)+"\n")
    print(json.dumps({"allPassed": True, "scalarChecks": len(checks),
                      "receipt": str(out / "receipt.json"),
                      "finiteModulationNSelected": False}, indent=2))


if __name__ == "__main__":
    main()
