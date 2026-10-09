#!/usr/bin/env python3
"""Independent Fraction checks of the serialized candidate rejection.

This imports neither the producer nor its interval library.  It checks source
hashes and recomputes the rational interval implications from the enclosed
continuous integrals.  The analytic integral enclosures and their source
identification remain explicit in the producer and README, not inferred from
these downstream algebra checks alone.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent


def box(value):
    n = value["denominatorPowerOfTwo"]
    if not isinstance(n, int) or not 32 <= n <= 4096:
        raise ValueError("Invalid precision")
    result = F(int(value["lowerNumerator"]), 2**n), F(int(value["upperNumerator"]), 2**n)
    if result[0] > result[1]:
        raise ValueError("Reversed interval")
    return result


def constant(x):
    return F(x), F(x)


def add(a, b):
    return a[0] + b[0], a[1] + b[1]


def neg(a):
    return -a[1], -a[0]


def sub(a, b):
    return add(a, neg(b))


def mul(a, b):
    values = [x * y for x in a for y in b]
    return min(values), max(values)


def div(a, b):
    if b[0] <= 0 <= b[1]:
        raise ValueError("Unseparated denominator")
    return mul(a, (1 / b[1], 1 / b[0]))


def scale(a, b):
    return mul(a, constant(b))


def includes(outer, inner):
    return outer[0] <= inner[0] and inner[1] <= outer[1]


def verify(record, source_root=HERE.parent):
    x = {k: box(v) for k, v in record["intervals"].items()}
    binding = record["sourceBinding"]
    params = {k: F(v) for k, v in binding["parametersExact"].items()}
    h, eta = params["h"], F(record["witness"]["etaExact"])
    A, D, d = F(1, 2) + h, F(1, 2) - h, 1 - eta**2
    L, jp = 1 - 2 * h * eta**2, 2 * eta / (1 + eta**2)
    W = sub(constant(1), scale(x["kBar"], L))
    c_eta = -h * (1 - 8 * eta**2) + (D + 4*d) * eta * jp
    qs0 = add(constant(4*L-1), scale(x["initialRadialMomentRatio"], c_eta-(4*L-1)))
    qs = add(add(mul(x["axialDecay"], x["QsAtAxialStart"]),
                 scale(sub(constant(1), x["axialDecay"]), -h+D*eta*jp)),
             scale(mul(x["axialDecay"], x["axialK1Integral"]), 2*h*eta**2+d*eta*jp))
    sx = sub(scale(div(x["kSquaredAverage"], x["E2"]), eta**2), scale(x["energyPrefixOverCurrentXE2"], F(1, 2)))
    sxe = add(scale(div(x["kSquaredAverage"], x["E2"]), 2*eta), scale(x["energyPrefixOverCurrentXE2"], jp))
    ns = add(add(add(add(scale(div(x["W"], x["E2"]), -2*eta), scale(sx, 4*h*eta)),
                         scale(sxe, -d)), scale(x["PiOverE2"], 4*A*eta)),
             scale(x["PiEtaOverE2"], -d))
    bs_w = div(scale(mul(x["kPrime"], x["NsOverE2"]), 2*eta), x["Qs"])
    first = sub(constant(2), x["bsTimesW"])
    second = sub(sub(constant(2), scale(x["bsTimesW"], 2)), scale(x["bsSquared"], F(1, 2)))
    ratio = sub(constant(1), scale(x["bsTimesW"], F(1, 2)))
    pc = mul(x["P1OverXR"], x["PcOverP1"])
    axis = source_root / "source-coherence" / binding["axisCertificate"]
    actual_source = json.loads(axis.read_text())
    outer = source_root.parent / "followup-construction/outer.mjs"
    interval_library = source_root / "uniform-gluing/dyadic_interval.py"
    flags = record["conclusion"]
    return {
        "originalSourceHashMatches": hashlib.sha256(axis.read_bytes()).hexdigest() == binding["axisCertificateSHA256"],
        "originalOuterImplementationHashMatches": hashlib.sha256(outer.read_bytes()).hexdigest() == binding["outerSourceSHA256"],
        "intervalLibraryHashMatches": hashlib.sha256(interval_library.read_bytes()).hexdigest() == binding["intervalLibrarySHA256"],
        "originalParametersRetained": params == {k: F(v) for k, v in actual_source["sourcePressureCertificate"]["parametersExact"].items()} and params["Md"] == 1 and params["logP"] == 14 and params["h"] == F(1e-8) and params["lambda"] == F(.0002),
        "strictlyInteriorEta": eta == F(3, 4) and 0 < eta < 1,
        "WReconstructed": includes(x["W"], W),
        "initialQsReconstructed": includes(x["QsAtAxialStart"], qs0),
        "actualQsReconstructed": includes(x["Qs"], qs),
        "actualNsReconstructed": includes(x["NsOverE2"], ns),
        "bsWReconstructed": includes(x["bsTimesW"], bs_w),
        "firstMarginReconstructed": includes(x["firstSufficientConeMargin"], first),
        "secondMarginReconstructed": includes(x["secondSufficientConeMargin"], second),
        "PcRatioReconstructed": includes(x["PcOverP1"], ratio),
        "PcOverXRReconstructed": includes(x["PcOverXR"], pc),
        "positiveQsAndP1": x["Qs"][0] > 0 and x["P1OverXR"][0] > 0,
        "strictlyNegativePcForAllPositiveXR": x["PcOverXR"][1] < 0,
        "statusMatchesActualRejection": record["status"] == "CERTIFIED_POINTWISE_CONE_FAILURE" and flags["actualRelaxedConeFails"] is True,
        "noEvidencePromotion": not any(flags[k] for k in ["merelyFailedSufficientCondition", "globalCurrentDatumCandidateAdmissible", "paperExistentialConstructionRefuted", "generalNavierStokesConclusion", "previousLocalAxisOrJoiningResultsInvalidated", "originalAcceptanceSnapshotModified", "newLeanTheorem"]),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--certificate", type=Path, default=HERE / "axial-midpoint-certificate.json")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    record = json.loads(args.certificate.read_text())
    checks = verify(record)
    mutated = copy.deepcopy(record)
    mutated["conclusion"]["globalCurrentDatumCandidateAdmissible"] = True
    checks["falseGlobalPromotionRejected"] = not verify(mutated)["noEvidencePromotion"]
    mutated = copy.deepcopy(record)
    mutated["intervals"]["PcOverXR"]["upperNumerator"] = "0"
    checks["nonnegativePcEndpointRejected"] = not verify(mutated)["strictlyNegativePcForAllPositiveXR"]
    result = {"schema": "MathScope.OuterAxialIndependentRationalChecks/1",
              "certificateSHA256": hashlib.sha256(args.certificate.read_bytes()).hexdigest(),
              "checks": checks, "passed": sum(checks.values()), "total": len(checks),
              "expectedMd1RejectionVerified": all(checks.values()),
              "scope": "Independent exact rational reconstruction and falsification controls; the actual continuous integral enclosures retain their documented source/analytic boundary."}
    if args.output:
        args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))
    if not result["expectedMd1RejectionVerified"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
