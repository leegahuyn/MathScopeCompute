"""Reproduce fixed-label finite coefficient charges with exact integers."""
import argparse
from dataclasses import dataclass
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import comb, factorial, prod
from pathlib import Path

BAND = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
PINS = {
    "scale": (BAND / "outer-normalized-amplitude/outer-scale.json", "71b6c139f15491aa0c625a25c91c32987a4f58038ccd97fdce9ea888a6e892aa"),
    "matrix": (BAND / "outer-fixed-label-norm/matrix/matrix-s-j.json", "e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36"),
    "label": (BAND / "outer-fixed-label-norm/band-weight.json", "4e334a10ed93839437baa8b2caefe36d32291bfc6c3d67d3b8b04c41fa797ba0"),
    "background": (BAND / "outer-fixed-label-norm/background-transport.json", "0b7c13076805acc97cd45e3e4e70e6f7620950744dc493dbff26d0644ff977cc"),
    "primary": (BAND / "initial-mean-norm/primary/primary-quotient-ledger.json", "a72f12c82dd35106862cf6a874be1af79502a99d6de0e37e06db8794b66e5244"),
    "cutoffs": (Path("final67/n7-n8-primary-cutoff-orders/primary-cutoff-orders.json"), "d3dab84d038b542253e76a27b5eb84d4730fd5660f8db9fc26774a09bb5d43d9"),
    "mean": (BAND / "initial-mean-norm/initial-mean-caps.json", "2d172188703c2ddb81925eae70fd91252f8df9a743b8ff96ba325a6ac7f9bd1a"),
    "variation": (BAND / "forced-normalized-variation/weighted-variation.json", "c3ec1fb8ea1bf30ec18c09111440099e921a26c3417d5a47e083e5aa6e85dc37"),
}


@dataclass(frozen=True)
class Bound:
    """Positive majorant c B^b W^w M^m on bases at least one."""

    c: int
    b: int = 0
    w: int = 0
    m: int = 0

    def __add__(self, other):
        return Bound(self.c + other.c, max(self.b, other.b), max(self.w, other.w), max(self.m, other.m))

    def __mul__(self, other):
        return Bound(self.c * other.c, self.b + other.b, self.w + other.w, self.m + other.m)

    def __pow__(self, power):
        assert power >= 0
        return Bound(self.c ** power, self.b * power, self.w * power, self.m * power)

    def log_degrees(self):
        return [self.c.bit_length(), self.b, self.w, self.m]


def total(values):
    return sum(values, Bound(0))


def jet_product(left, right, order):
    return total(Bound(comb(order, i)) * left[i] * right[order - i] for i in range(order + 1))


def common(rows):
    return Bound(max(row.c for row in rows), max(row.b for row in rows),
                 max(row.w for row in rows), max(row.m for row in rows))


def serialize(rows):
    return [row.log_degrees() for row in rows]


def frame_weight(inputs):
    a = Bound(1, 6, 0, 1)
    propagator = Bound(1, 0, 1)
    source = inputs["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]

    def series(role, multiplier=1):
        rows = []
        for j, (coefficient, a_power, s_power) in enumerate(source[role]):
            assert 0 <= s_power <= j
            rows.append(Bound(multiplier * Q(coefficient).__ceil__()) * a ** a_power)
        assert len(rows) == 9
        return rows

    matrix = series("normalizedMode1And2MatrixInfinityNorm")
    basis = series("movingBasisInfinityNorm")
    basis_v = series("BPrime", 2)
    state = [propagator]
    for j in range(1, 9):
        state.append(propagator * total(
            Bound(comb(j, i)) * matrix[i] * state[j - i] for i in range(1, j + 1)
        ))
    tangent = [jet_product(basis, state, j) for j in range(9)]
    state_v = [jet_product(matrix, state, j) for j in range(8)]
    tangent_v = [jet_product(basis_v, state, j) + jet_product(basis, state_v, j) for j in range(8)]

    # The Gaussian-Haar constants use Renv^4096 <= B and the positive C88 cone.
    assert inputs["scale"]["gaussianLengthGain"]["gL"].endswith("Renv^(-41)/8")
    k_gaussian = Bound(32, 1)
    det_reciprocal = Bound(2**128, 3, 4)
    sqrt_weight_base = Bound(2**33, 1, 1)
    sqrt_derivative_divisor_reciprocal = Bound(2**16, 1, 1)
    gram = [Bound(2) * k_gaussian * jet_product(tangent, tangent, j) for j in range(9)]
    gram_inverse = Bound(2) * gram[0] * det_reciprocal
    target = [
        Bound(2**1521 * int(row["coefficientOfTwoPow1521RenvH119"]), 1)
        for row in inputs["scale"]["regularizedLiveTargetCaps"]["boundRows"]
    ]
    assert len(target) == 9
    weight = []
    sigma = [sqrt_weight_base]
    for j in range(9):
        weight.append(gram_inverse * (target[j] + total(
            Bound(comb(j, i)) * gram[i] * weight[j - i] for i in range(1, j + 1)
        )))
        if j:
            sigma.append(sqrt_derivative_divisor_reciprocal * (weight[j] + total(
                Bound(comb(j, i)) * sigma[i] * sigma[j - i] for i in range(1, j)
            )))
    n = common(series("n"))
    n_v = common(series("nPrime"))
    q_inv = common(series("inverseNormalSquared"))
    k = common(series("cylindricalK"))
    potential = Bound(2**25) * (n * q_inv + n_v * q_inv + n**2 * n_v * q_inv**2)
    pressure = Bound(2**25) * (n * k + n_v) * q_inv
    catalog = {
        "matrix": serialize(matrix), "basis": serialize(basis), "state": serialize(state),
        "tangent": serialize(tangent), "tangentV": serialize(tangent_v), "gram": serialize(gram),
        "gramInverse": gram_inverse.log_degrees(), "weight": serialize(weight),
        "squareRootWeight": serialize(sigma),
    }
    return catalog, common(sigma), common(tangent + tangent_v), potential, pressure


def caps(inputs):
    catalog, sigma, tangent, potential, pressure = frame_weight(inputs)
    ledger = inputs["primary"]["weightedQuotientLedger"]
    cutoff = ledger["cutoffDerivativeConstants"]
    mesh = max(map(int, cutoff["normalizedFixedLabelPartitionInDimensionlessOffset"]))
    transverse = max(int(value) * 2**(34*j) for j, value in enumerate(cutoff["bumpInDimensionlessOffset"]))
    longitudinal = max(map(int, cutoff["psiDerivativeCapBeforeLengthScale"]))
    assert cutoff["maximumOrdinaryOrder"] == 9
    assert max(mesh, transverse, longitudinal) < 2**1024
    # The finite Leibniz, fixed-lift and one inverse pulse-length factors.
    cutoffs = Bound(2**(4096 + 100 + 60 + 33) * mesh**3 * transverse * longitudinal, 1)
    flat = ledger["flatRadialGaussianDerivativeChecks"]
    assert len(flat) == 9
    assert max(Q(row["absolutePolynomialCapOnDAtMostQuarter"]) for row in flat) < 2**40
    gaussian = Bound(2**900, 64)
    radius = Bound(2**60, 10)
    amplitude = Bound(2) * sigma * tangent * cutoffs * gaussian
    # Apply these coefficient bounds with the separate weights of the C91 table.
    primary = Bound(2**32) * radius * amplitude * (Bound(1) + potential + pressure)

    transfer = inputs["mean"]["primaryCovarianceTransfer"]
    assert (transfer["maximumRequiredSlow"], transfer["maximumRequiredL"]) == (7, 8)
    mean_transfer = int(transfer["coefficientMultiplierOnUniformPrimaryCapSquared"])
    assert mean_transfer == prod(transfer["coverUpperFactors"])
    covariance = Bound(mean_transfer) * primary**2
    temporal = {}
    mean_geometry = Bound(2**24, 7)
    tail_absorption = Bound(2**40)
    assert Q(factorial(14), 4**14) < tail_absorption.c
    for name, row in inputs["mean"]["globalTemporalMajorants"].items():
        temporal[name] = (
            Bound(Q(row["constant"]).__ceil__())
            * covariance * mean_geometry ** row["maxGeometryPower"] * tail_absorption
        )
    mean_increment = total(temporal.values())

    a = Bound(1, 6, 0, 1)
    propagator = Bound(1, 0, 1)
    variation = {}
    for row in inputs["variation"]["rows"]:
        multipliers = []
        for term in row["physicalOverPPolynomial"]:
            assert term["remainingOrderedWindowPower"] >= 0
            multipliers.append(
                Bound(Q(term["coefficient"]).__ceil__())
                * a ** term["maxSourceConstantPower"] * propagator ** term["propagatorPower"]
            )
        # Lmax <= 1. The extra mode-two mass coefficient is <= 16 B.
        bound = total(multipliers)
        variation[",".join(map(str, row["RZL"]))] = [bound, Bound(16, 1) * bound]
    assert len(variation) == 23

    # Shapes of the Primary and initial-mean products. A separate coefficient
    # vector controls the raw forcing multipliers on these shapes.
    field_shapes = primary * (Bound(1) + primary + mean_increment)
    joined = [field_shapes * piece for rows in variation.values() for piece in rows]
    catalog.update({
        "primaryAmplitude": amplitude.log_degrees(), "primaryCap": primary.log_degrees(),
        "covarianceCap": covariance.log_degrees(),
        "temporalIncrementCaps": {k: v.log_degrees() for k, v in temporal.items()},
        "meanIncrementCap": mean_increment.log_degrees(),
        "variationMultipliersByRZL": {k: serialize(v) for k, v in variation.items()},
        "fieldProductEnvelope": field_shapes.log_degrees(),
        "variationWithFieldProductEnvelope": serialize(joined),
    })
    ranks = [row.log_degrees() for row in joined]
    maximum = [max(row[i] for row in ranks) for i in range(4)]
    bit_charge = min(2**16, maximum[0])
    lean_charges = [bit_charge, maximum[0] - bit_charge, *maximum[1:]]
    assert all(0 <= degree <= 2**16 for degree in lean_charges), lean_charges
    assert sum(maximum) < 2**19
    assert 5 * 2**16 < 2**19
    return catalog, maximum, lean_charges


def main():
    if not __debug__:
        raise SystemExit("Python assertions are required")
    parser = argparse.ArgumentParser()
    parser.add_argument("--goal", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    inputs = {}
    for name, (path, expected) in PINS.items():
        raw = (args.goal / path).read_bytes()
        assert sha256(raw).hexdigest() == expected, path
        inputs[name] = json.loads(raw)
    rows, maximum, lean_charges = caps(inputs)
    receipt = {
        "status": "CONDITIONAL",
        "logDegreeOrder": ["log(2)", "log(Bnorm)", "log(propagator)", "log(backgroundCap)"],
        "inputPins": {name: {"path": path.as_posix(), "sha256": digest} for name, (path, digest) in PINS.items()},
        "definitions": {
            "propagator": "W = exp(3 Bnorm^256 Lmax)",
            "backgroundCap": "M = exp(H/2^128)",
            "H": "h (ellMinimum + 15) log(2)",
            "massLower": "mL >= 2^-64 Bnorm^-1 W^-2",
            "massUpper": "mU <= 2^7 Bnorm W^2",
            "geometryOfMean": "G <= 2^24 Bnorm^7",
        },
        "variationRows": 23,
        "normalizedFrameDerivativeOrder": 8,
        "primarySlowAndTransverseOrders": [7, 8],
        "coefficientsOnly": rows,
        "maximumFieldProductLogDegrees": maximum,
        "leanCharges": lean_charges,
        "leanChargeOrder": ["first log(2) charge", "second log(2) charge", "log(Bnorm)", "log(propagator)", "log(backgroundCap)"],
        "logBudget": "H/2^109 for the field product and variation coefficient under the original source hypotheses",
        "excludedFromThisBudget": ["raw forcing multipliers", "epsilon and k", "radial weights", "explicit bandwidth powers"],
        "scope": "Fixed source labels in the positive outer collar 0 < log(Xb/X) <= 1/4, with qBig/64 <= q < qBig/16, the original chart, positive Gram cone and entire same-physical-point shifted paths admitted.",
        "finalJets": "0/67",
        "release": "HOLD",
    }
    with args.out.open("x", encoding="utf-8", newline="\n") as output:
        json.dump(receipt, output, indent=2)
        output.write("\n")
    print("PASS exact coefficient recurrences; 23 directions; maximum field-product log degrees:", maximum)


if __name__ == "__main__":
    main()
