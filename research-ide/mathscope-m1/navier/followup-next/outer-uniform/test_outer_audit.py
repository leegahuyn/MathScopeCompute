#!/usr/bin/env python3
"""Reproduce the actual candidate rejection and exercise its input boundaries."""
from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from tempfile import TemporaryDirectory

from certify_axial_midpoint import build
from verify_axial_counterexample import box, verify
from verify_fixed_logp_md_family import build as build_family

HERE = Path(__file__).resolve().parent
AXIS = HERE.parent / "source-coherence/source-axis-cone-refined.json"


def rejected(action):
    try:
        action()
    except (ValueError, ArithmeticError):
        return True
    return False


def main():
    coarse, fine = build(AXIS, 128), build(AXIS, 512)
    checks = {
        "coarseContinuousCalculationRejectsActualCandidate": coarse["allCounterexampleChecksPassed"] and box(coarse["intervals"]["PcOverXR"])[1] < 0,
        "fineContinuousCalculationRejectsActualCandidate": fine["allCounterexampleChecksPassed"] and box(fine["intervals"]["PcOverXR"])[1] < 0,
        "coarseIndependentRationalReconstruction": all(verify(coarse).values()),
        "fineIndependentRationalReconstruction": all(verify(fine).values()),
    }
    for key in ["initialBIntegral", "initialCIntegral", "axialK1Integral", "axialK2Integral", "PcOverXR"]:
        x, y = box(coarse["intervals"][key]), box(fine["intervals"][key])
        checks[key+"RefinementNarrowsAndOverlaps"] = y[1]-y[0] < x[1]-x[0] and max(x[0], y[0]) <= min(x[1], y[1])
    for value in [True, 31, 8193]:
        checks["invalidPanelCountRejected:"+str(value)] = rejected(lambda: build(AXIS, value))
    with TemporaryDirectory(prefix="audit-source-control-", dir=HERE) as temp:
        source = json.loads(AXIS.read_text())
        changed = copy.deepcopy(source)
        changed["sourcePressureCertificate"]["parametersExact"]["Md"] = "2"
        path = Path(temp)/"changed-md.json"
        path.write_text(json.dumps(changed))
        checks["changedMdCannotReuseFixedWitness"] = rejected(lambda: build(path))
        changed = copy.deepcopy(source)
        changed["selectedParameters"]["h"] = "1/100"
        path.write_text(json.dumps(changed))
        checks["axisPressureHMismatchRejected"] = rejected(lambda: build(path))
    changed = copy.deepcopy(fine)
    changed["sourceBinding"]["parametersExact"]["co"] = "1/100"
    checks["unboundParameterMutationRejected"] = not verify(changed)["originalParametersRetained"]
    changed = copy.deepcopy(fine)
    changed["conclusion"]["globalCurrentDatumCandidateAdmissible"] = True
    checks["falseGlobalPromotionRejected"] = not verify(changed)["noEvidencePromotion"]
    reversed_box = {"lowerNumerator": "1", "upperNumerator": "0", "denominatorPowerOfTwo": 88}
    checks["reversedIntervalRejected"] = rejected(lambda: box(reversed_box))
    family = build_family()
    checks["fixedLogPProspectiveFamilyRejected"] = all(family["checks"].values()) and family["conclusion"]["varyingMdAloneWithinA6AtLogP14CannotRepair"]
    result = {
        "schema": "MathScope.OuterAuditReproductionTests/1",
        "checks": checks, "passed": sum(checks.values()), "total": len(checks),
        "allPassed": all(checks.values()),
        "sourceAxisSHA256": hashlib.sha256(AXIS.read_bytes()).hexdigest(),
        "generatorSHA256": hashlib.sha256((HERE/"certify_axial_midpoint.py").read_bytes()).hexdigest(),
        "independentVerifierSHA256": hashlib.sha256((HERE/"verify_axial_counterexample.py").read_bytes()).hexdigest(),
        "actualCandidateAdmissible": False, "newLeanAnalyticTheorem": False,
        "scope": "Continuous interval calculation at 128 and 512 cells, independent exact reconstruction, and invalid-domain/source-binding/falsification controls.",
    }
    (HERE/"outer-audit-tests.json").write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps(result, indent=2))
    if not result["allPassed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
