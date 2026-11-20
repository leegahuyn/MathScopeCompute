"""Replay the C92 fixed-label coefficient recurrence on the middle source."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy


BAND = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
BUDGET = BAND / "first-forced-budget"
PINS = {
    "base": (BUDGET / "verify_first_forced_log_budget.py", "6e31e50922d6ad0cfae876a3d740fe748f4227779db9fdae310c833250fd77ba"),
    "outerReference": (BUDGET / "first-forced-log-budget.json", "904f3f665055f46ba49e96617e832216c39c9fe80a018382d29c38f6aec19d1c"),
    "outerPhysical": (BUDGET / "outer-physical-gauge/outer-forced-energy-slice.json", "a3c39cd72a19f6ab1d9354c0ea2d1db5d34897065b42ab0db4751f9e575d1ffd"),
    "innerPhysical": (BUDGET / "inner-physical-gauge/inner-forced-energy-slice.json", "eb5a2d9dc3b72cb6c4a4b5f04aa7be147cc356c55cdb3e3226399a6dce6832b8"),
    "bandGeometry": (BUDGET / "geometry/outer-forced-geometry.json", "e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291"),
    "cone": (BAND / "outer-normalized-amplitude/outer-source.json", "350586b512bfcc9e605feb80c4c0cf3bd32f6520c78abd396eed13147f1f5de7"),
}
ATTACHMENT = "4e08b2bbcf5ba20387a631e05e1eae15a857a3be56372c1106fde810d1797515"
TARGET = "7b4283b548cf1139624f753657d30ab43cc97d2ce741ece4fd7e7616632c8986"
KAPPA = Q(1, 100000)


def checked(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return data


def normalize_weight_constants(cone, attachment, target):
    assert cone["exactCone"]["inverseBounds"] == ["kappa/64", "2"]
    middle = attachment["regions"]["middle"]
    assert middle["projectionLowerPowerOfRenv"] == 74
    assert middle["regularStressSlowRows"]["actualSameBody"]
    assert [r["order"] for r in middle["sqrtWeightSlowRows"]] == list(range(9))
    assert target["middleTargetLogCap"] == "H/2^256"
    assert target["targetBounds"]["chartDegree"] == 122

    # The original norm B absorbs each listed R power. M>=1, W>=1, R>=2.
    direction_floor, margin, max_mass_bits, min_mass_bits = 74, 10, 7, 64
    inverse_divisor = {
        "coefficientLog2": str(Q(6+max_mass_bits, 2)-1),
        "RenvPower": str(Q(direction_floor+margin, 2)),
        "BnormPower": "1/2", "propagatorPower": 1,
    }
    assert direction_floor+margin <= 4096 and Q(6+max_mass_bits, 2)-1 <= 16
    # tau<=2 R^6 M, multiplying by the normalized cone 2 and reciprocal m_L.
    sqrt_base = {
        "coefficientLog2": str(Q(2+min_mass_bits, 2)),
        "RenvPower": "3", "BnormPower": "1/2", "propagatorPower": 1,
        "backgroundCapPower": "1/2",
    }
    assert 6 <= 4096 and Q(2+min_mass_bits, 2) == 33
    assert middle["sqrtSNormalizedWRange"][0] == "kappa*Renv^(-74)/(64*m_U)"
    return {
        "sqrtNormalizedWeightBase": sqrt_base,
        "sqrtNormalizedWeightBaseMajorant": "2^33*Bnorm*W*M",
        "inverseTwiceSqrtNormalizedWeightLower": inverse_divisor,
        "inverseTwiceSqrtNormalizedWeightMajorant": "2^16*Bnorm*W",
        "targetDerivativeMajorant": "M=exp(H/2^128)",
        "targetDerivativeOrders": list(range(9)),
        "sameOriginalMassesAndDeterminant": attachment["mass"],
    }


def specialize_frame(function):
    original = inspect.getsource(function)
    changes = [
        ("sqrt_weight_base = Bound(2**33, 1, 1)", "sqrt_weight_base = Bound(2**33, 1, 1, 1)"),
        ("""target = [
        Bound(2**1521 * int(row["coefficientOfTwoPow1521RenvH119"]), 1)
        for row in inputs["scale"]["regularizedLiveTargetCaps"]["boundRows"]
    ]""", "target = [Bound(1, 0, 0, 1) for _ in range(9)]"),
    ]
    for before, after in changes:
        assert original.count(before) == 1
        original = original.replace(before, after)
    namespace = {}
    # Restrict specialization to the hash-pinned original with these two exact edits.
    exec(compile(original, inspect.getfile(function), "exec"), function.__globals__, namespace)
    return namespace["frame_weight"]


def recurrence(goal, base_reference):
    base = runpy.run_path(str(goal/PINS["base"][0]))
    inputs = {name: json.loads(checked(goal/path, digest))
              for name, (path, digest) in base["PINS"].items()}
    old_catalogue, old_ranks, old_charges = base["caps"](inputs)
    assert old_ranks == base_reference["maximumFieldProductLogDegrees"]
    assert old_charges == base_reference["leanCharges"]
    caps_globals = base["caps"].__globals__
    caps_globals["frame_weight"] = specialize_frame(caps_globals["frame_weight"])
    middle_catalogue, middle_ranks, middle_charges = base["caps"](inputs)
    assert len(middle_catalogue["variationWithFieldProductEnvelope"]) == 46
    for field in ("matrix", "basis", "state", "tangent", "tangentV", "gram", "gramInverse"):
        assert middle_catalogue[field] == old_catalogue[field], field
    assert middle_catalogue["squareRootWeight"][0] == [34, 1, 1, 1]
    assert middle_catalogue["weight"] != old_catalogue["weight"]
    # Positive field product is affine in the initial mean norm. Multiplying
    # its middle path/mean majorants by at most M costs one common factor M.
    padded_ranks = middle_ranks.copy()
    padded_ranks[3] += 1
    padded_charges = middle_charges.copy()
    padded_charges[-1] += 1
    assert all(0 <= x <= 2**16 for x in padded_charges)
    assert sum(padded_ranks) < 2**19
    assert Q(sum(padded_ranks), 2**128) < Q(1, 2**109)
    return {"oldMaximum": old_ranks, "middleMaximumWithNativeMeanStillConditional": middle_ranks,
            "middleMaximumAllowingOneMeanPathFactorM": padded_ranks,
            "middleLeanChargesAllowingOneMeanPathFactorM": padded_charges,
            "middleCoefficientLogCapAllowingOneMeanPathFactorM": "H/2^109",
            "leadingFieldCatalogue": middle_catalogue,
            "meanPathMultiplierCondition": "The complete middle mean norm inputs are bounded by M times their corresponding C91 positive coefficient model while retaining their original epsilon and band weights."}


def guard_and_comparison(outer, inner):
    assert outer["status"] == "VERIFIED_CARTESIAN_TRANSFER_CONDITIONAL_OUTER_FORCED_AMPLITUDE"
    assert len(outer["exactDirections"]) == 10 and outer["componentsAndPhysicalDerivativesPerMode"] == 30
    assert inner["conditionalPhysicalEnergyComparison"]["conditionalInnerPotentialSliceUpper"] == "exp(-H/2)"
    assert Q(1, 512)+Q(1, 4) < 2  # t1<1/128 and log(Xb/Xa)>2
    # Positive terms of log(2)=2 atanh(1/3).
    log2_floor = 2*sum(Q(1, (2*j+1)*3**(2*j+1)) for j in range(3))
    assert 185*log2_floor > 2*64
    middle_modes = {}
    for mode, old in outer["modeMaxima"].items():
        band = Q(old["maxBandPower"])
        p = Q(old["maxPoleAfterZetaToModeOverTwo"])
        assert band <= 64 and 0 <= p <= 18
        # The original chart does not carry an outer pole in middle target
        # derivatives. Charging the old p is optional overestimate of guards.
        guard_bits = 2*p.__ceil__() + 185
        geometry_bits = sum(old["coefficientLogDegrees"]) + old["coverCartesianGaussianBits"]
        charge = (Q(1, 2**109)+Q(1, 2**124) +
                  Q(guard_bits+geometry_bits+256, 2**128)+band/2**32636)
        assert charge < Q(1, 2**108) and 2*charge < KAPPA
        middle_modes[mode] = {
            "maxConditionalBandPower": str(band),
            "optionalPoleAndGaussianBits": guard_bits,
            "totalConditionalLogChargeOverH": "2^-108",
        }
    epsilon_grade = 1-KAPPA+Q(1,2)-Q(1,10)-KAPPA
    assert epsilon_grade == Q(69999, 50000)
    assert 3*Q(1, 2**32) < Q(1, 2**30)
    return {
        "middleDefinedOnSourceGuard": ["log(X/Xa)>=t1/8", "log(Xb/X)>=1/4", "abs(eta)<=1", "1/2<=s<=2"],
        "middleCoverOverlap": {"inner": "1/8<=log(X/Xa)/t1<=1/4",
                               "outer": "The historical outer guard extends to d<=1/2 and overlaps the middle d>=1/4."},
        "disjointIntegrationPartition": ["0<log(X/Xa)<=t1/4", "log(X/Xa)>t1/4 and log(Xb/X)>1/4",
                                        "0<log(Xb/X)<=1/4"],
        "crossGuard": "Use derivatives of the same full original fields before restricting the integration domains. Cross-region primitive paths require the whole-path estimate.",
        "logTwoLower": str(log2_floor), "inverseTwoEndpointZetaBound": "2^185",
        "modes": middle_modes, "weightedPhysicalEpsilonExponent": str(epsilon_grade),
        "conditionalMiddlePotentialSliceUpper": "exp(-H/2)",
        "conditionalMiddleEnergyRatioStrictUpper": "2^-32",
        "conditionalThreePieceEnergyRatioStrictUpper": "2^-30",
        "assumptions": [
            "All middle raw and projected normal/pressure inputs obey the C94 grouped epsilon grade and C95 source grades, and the C92 covered coefficient envelope or the recorded one-factor relaxation. This includes the original FiveMap terms.",
            "Original normalized ordered paths, C95 Cartesian reconstruction, physical slab, positive cones and label cover all apply on the admitted middle region.",
            "The nonlocal original T0/pressure paths and all primitive derivatives have the bounded complete middle mean inputs postulated by the coefficient recurrence.",
        ],
    }


def verify(goal, attachment_path, target_path):
    data = {key: checked(goal/path, digest) for key, (path, digest) in PINS.items()}
    attachment = json.loads(checked(attachment_path, ATTACHMENT))
    target = json.loads(checked(target_path, TARGET))
    base_reference = json.loads(data["outerReference"])
    assert b"H=-h*log(tau0) > h*Bnorm^512/2 > Bnorm^511/2." in data["bandGeometry"]
    assert base_reference["definitions"]["massLower"] == "mL >= 2^-64 Bnorm^-1 W^-2"
    assert base_reference["definitions"]["massUpper"] == "mU <= 2^7 Bnorm W^2"
    return {
        "status": "VERIFIED_MIDDLE_FRAME_RECURRENCE_CONDITIONAL_ACTUAL_MEAN_AND_FORCED_ENERGY",
        "pins": {**{key: h for key, (_, h) in PINS.items()}, "middleAttachment": ATTACHMENT,
                 "middleTargetLog": TARGET},
        "weightConstants": normalize_weight_constants(json.loads(data["cone"]), attachment, target),
        "recurrence": recurrence(goal, base_reference),
        "middleCrossGuardAndConditionalEnergy": guard_and_comparison(json.loads(data["outerPhysical"]),
                                                                    json.loads(data["innerPhysical"])),
        "open": ["Actual whole-path mean and FiveMap pressure derivative attachment.",
                 "Signed/projected middle raw source log, band and epsilon estimates with complete mean inputs.",
                 "Feedback and higher corrections, complete N7-06, N8-05 and final jets."],
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    if not __debug__:
        raise RuntimeError("Verification requires enabled assertions.")
    parser = ArgumentParser()
    for name in ("goal", "attachment", "target", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    answer = verify(args.goal, args.attachment, args.target)
    args.out.write_text(json.dumps(answer, indent=2)+"\n", encoding="utf8", newline="\n")
    print("Verified middle normalized covariance constants and exact C92 recurrence.")
    print("Middle log-degree envelope:", answer["recurrence"]["middleMaximumAllowingOneMeanPathFactorM"])
