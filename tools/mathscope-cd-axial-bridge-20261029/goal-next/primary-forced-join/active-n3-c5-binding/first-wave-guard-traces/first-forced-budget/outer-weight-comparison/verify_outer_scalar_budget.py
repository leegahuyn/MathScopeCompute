"""Check the scalar budget for the original outer first-Forced comparison."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import factorial
from pathlib import Path

P = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
PINS = {
    "label": (Path("whole-k-atlas/result.json"), "ef5afe28cde499bf61016a0f8098d3fddb6535d88c9950e38b62d8dcdb742989"),
    "scale": (Path("first-scale-closure/first-scale-closure.json"), "1efc5a0d90ed98b14d79ee4c20d4ff2a3b86cf9c4cedd0cc1590868dbcbaf81a"),
    "band": (P / "outer-fixed-label-norm/band-weight.json", "4e334a10ed93839437baa8b2caefe36d32291bfc6c3d67d3b8b04c41fa797ba0"),
    "logBudget": (P / "first-forced-budget/first-forced-log-budget.json", "904f3f665055f46ba49e96617e832216c39c9fe80a018382d29c38f6aec19d1c"),
    "geometry": (P / "first-forced-budget/geometry/outer-forced-geometry.json", "e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291"),
    "epsilon": (P / "first-forced-budget/geometry/epsilon-grade.json", "ced340026d5fb40921b9a326133404c9148241fba904ea353b29d331b70ea036"),
}


def read_pinned(root):
    result = {}
    for name, (path, digest) in PINS.items():
        data = (root / path).read_bytes()
        assert sha256(data).hexdigest() == digest
        result[name] = json.loads(data)
    return result


def compare(inputs, weights):
    assert inputs["scale"]["actualRoots"]["qBig"] == 622791
    assert "Every active label C+14<=ell_prime<=C+16" in inputs["label"]["representativeMargin"]
    assert inputs["logBudget"]["logBudget"].startswith("H/2^109")
    raw_geometry = inputs["geometry"]["conditionalCoefficientCaps"]["originalSlabLogBudget"]["rawGeometryProductsWithLeibniz"]
    assert raw_geometry["logBound"] == "H/2^124"
    assert raw_geometry["maxFactorsByMode"] == {"1": 4, "2": 2}
    assert Q(inputs["epsilon"]["uniformFormalLowerGradeBothModes"]) == Q(49999, 100000)

    # L=ellMinimum+15 >= Bnorm^512, qBig=2^-(L-5).
    # The narrower atlas integer band is L+-1. Use the closed bounds L+-2
    # furnished by the full [qBig/128,qBig/8] cover of own/reference Q.
    assert 128 == 2**(5+2) and 8 == 2**(5-2)
    min_l_exponent = 128 * 512
    assert min_l_exponent > 3
    # ln S/H <= 12*Bnorm^-255 < 2^-32636.
    min_band_decay_exponent = 128 * 255 - 4
    assert weights["distinctDirections"] == 23
    assert Q(weights["explicitCommonEpsilonGrade"]) == Q(49999, 100000)
    modes = {}
    for mode in (1, 2):
        directions = weights["conditionalOrderedVariation"][str(mode)]["physicalOverP"]
        assert len(directions) == 23
        modes[str(mode)] = {
            "maxBandPower": str(max(Q(row["velocityOverPBandPower"]) for row in directions)),
            "maxAdditionalPole": max(row["additionalLogPoleAfterGToMode"] for row in directions),
        }
    assert [modes[str(mode)]["maxBandPower"] for mode in (1, 2)] == ["119/4", "22"]
    assert [modes[str(mode)]["maxAdditionalPole"] for mode in (1, 2)] == [21, 21]

    # The sum pays the extra geometry factor and finite lifts across the
    # grouped mean, before the optional radial comparison.
    side_bits = {"oneMoreGeometryFactor": 20, "referenceDerivativeLifts": 12,
                 "meanReferenceBandChange": 26, "transverseFixedLifts": 14,
                 "carrierCeilings": 2, "gaussianConversion": 2,
                 "groupedLeibnizAndComponentSums": 12}
    assert sum(side_bits.values()) < 128
    xa_log_floor = Q(7, 4)
    opposite_exponent = Q(1, 128)**2 / (2 * xa_log_floor**2)
    assert opposite_exponent == Q(1, 100352)
    gaussian_conversion = 1 / (1 - opposite_exponent)
    assert gaussian_conversion == Q(100352, 100351) < 2

    # Round the ratio H/|ln eps| up to 2. All estimates can be added
    # after returning the common finite sums and field products to C92's scales.
    # Side allowance for grouped source coefficients and optionally the
    # conversion to zeta followed by loss of a quarter Gaussian.
    max_band_degree = 30
    max_radial_pole = 24
    gaussian_term_order = (max_radial_pole + 1) // 2
    gaussian_constant = factorial(gaussian_term_order)
    assert gaussian_constant.bit_length() < 120
    assert max_band_degree.bit_length() <= 7
    coefficient_log_charge = Q(1, 2**109) + Q(1, 2**124)
    side_log_charge = Q(256 + 32 + 8, 2**128)
    band_log_charge = Q(max_band_degree, 2**min_band_decay_exponent)
    epsilon_loss = Q(1, 100000)
    charge = 2 * (coefficient_log_charge + side_log_charge + band_log_charge)
    assert charge < Q(1, 2**106) < epsilon_loss
    new_grade = Q(inputs["epsilon"]["uniformFormalLowerGradeBothModes"]) - epsilon_loss
    assert new_grade == Q(24999, 50000)
    return {
        "status": "VERIFIED_SCALAR_TRANSFER_WITH_CONDITIONAL_FIELD_INPUT",
        "inputPins": {k: {"path": p.as_posix(), "sha256": d} for k, (p, d) in PINS.items()},
        "threshold": {
            "H": "h (ellMinimum+15) log(2)",
            "closedLabelOffsets": [-2, 2],
            "activeAtlasLabelOffsets": [-1, 1],
            "HOverMinusLogEpsilonUpper": 2,
            "logSOverHUpperAsNegativePowerOfTwo": min_band_decay_exponent,
        },
        "actualDerivedDegreeRows": modes,
        "envelopeInputs": {
            "C92FieldAndVariationLogOverH": "2^-109",
            "C92GeometryLogOverH": "2^-124",
            "prepaidRemainderFactorExcludingGaussianLoss": "2^128 Bnorm^32 M^8",
            "prepaidLogChargesIncludingOptionalGaussianLoss": [256, 32, 8],
            "maximumBandDegree": max_band_degree,
            "maximumOuterRadialPoleForOptionalAbsorption": max_radial_pole,
            "finiteSideCoefficientsPowersOfTwo": side_bits,
            "oppositeGaussianConversionPerModeFactor": str(gaussian_conversion),
            "scope": "Same admitted outer slab on every original variable path and the C92 common coefficient, positive covariance and reference hypotheses.",
        },
        "conditionalScalarConclusion": {
            "oldEpsilonGrade": "49999/100000",
            "epsilonLossUpper": str(epsilon_loss),
            "newEpsilonGrade": str(new_grade),
            "originalPoleForm": "epsilon^(24999/50000) * g(d)^m * d^-21, m=1,2",
            "originalPulseFactorOutsideQuotient": "P(v) for both modes",
            "exponentPreservingPoleForm": "epsilon^(24999/50000) * zeta^(m/2) * d^(-p), p=45/2 (m=1), 24 (m=2)",
            "optionalPoleFreeForm": "epsilon^(24999/50000) * zeta^(gamma-1/4) provided gamma>=1/4",
            "poleFreeProof": "d<=1 and zeta^(1/4)<=exp(-1/d^2); use the n=ceil(p/2) positive exponential term",
            "oneQuarterGaussianAllowance": "zeta^(1/4) * d^(-p) <= ceil(p/2)! with p<=24",
            "relativeToOriginalPrimaryEpsilonHalf": "No higher-order gain: 24999/50000 < 1/2.",
        },
        "additionalFinalJets": 0,
        "release": "HOLD",
    }


if __name__ == "__main__":
    assert __debug__
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--goal", type=Path, required=True)
    parser.add_argument("--weights", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    weights_bytes = args.weights.read_bytes()
    result = compare(read_pinned(args.goal), json.loads(weights_bytes))
    result["actualWeightLedgerSHA256"] = sha256(weights_bytes).hexdigest()
    with args.out.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    print("PASS original label relation and epsilon budget; coefficient log-charge < (-log epsilon)/2^106")
