"""Exact Cartesian derivative and spatial-budget ledger for the outer Forced gauges."""

import argparse
from collections import Counter, defaultdict
from dataclasses import dataclass
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import factorial, prod
from pathlib import Path

BAND = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
PINS = {
    "geometry": (BAND / "first-forced-budget/geometry/outer-forced-geometry.json", "e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291"),
    "oldWeights": (BAND / "first-forced-budget/outer-weight-comparison/raw-weights/raw-weight-degrees-final.json", "836e8ed0b22ee3451f9ed3f09f176bf439fc05b5f9380fa58b08a3ba841efcc0"),
    "stageGate": (Path("final67/energy-1013-sharp/correction-budget/spatial-gauge/active-correction-bounds/late-spatial-gates.json"), "1fa33500726728505f74ed51aae5e113f4c10c452c5faa7a4f823d5a6d2d6a36"),
    "matrix": (BAND / "outer-fixed-label-norm/matrix/matrix-s-j.json", "e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36"),
    "scalar": (BAND / "first-forced-budget/outer-weight-comparison/outer-scalar-budget.json", "0d1e6635208ef369741a7073067b69e467608114495c03bb22c3575715d01873"),
    "modeOne": (BAND / "first-forced-budget/principal-mode-cancellation/mode-one/mode1-linear-cancellation.json", "02e82a22eb0d004f21ef1f06b88ee1d633dec1be41679e5ac587dd40f76ad364"),
    "modeTwo": (BAND / "first-forced-budget/principal-mode-cancellation/mode-two/mode-two-tangency.json", "f1ee11b6299572df500077ab3e565f112a210c008f0092d63950ac1bcc9d1f8a"),
}
SOURCE_SHA = "b8d5be0df034731fb0a14849058416bc3f15d476d6e9b8b1fe196678894a6a59"
COMMON = Q(99999, 100000)
SLACK = Q(1, 100000)


def atom(role, component=0, r=0, z=0, l=0):
    return role, component, r, z, l


def mono(*atoms):
    return {tuple(sorted(atoms)): 1}


def add(*operands):
    result = defaultdict(int)
    for p in operands:
        for term, scalar in p.items():
            result[term] += scalar
    return {term: scalar for term, scalar in result.items() if scalar}


def scale(p, multiplier):
    return {term: value * multiplier for term, value in p.items() if value * multiplier}


def multiply(p, q):
    result = defaultdict(int)
    for left, a in p.items():
        for right, b in q.items():
            result[tuple(sorted(left + right))] += a * b
    return {term: scalar for term, scalar in result.items() if scalar}


COS, SIN, INV_R, FAST, EPS, IK = map(atom, ("cos", "sin", "invR", "fast", "epsilon", "imk"))
Q_INV = atom("inverseNormalSquared")


def atom_derivative(var, direction):
    role, i, r, z, l = var
    if direction == "theta":
        if var == COS:
            return scale(mono(INV_R, SIN), -1)
        if var == SIN:
            return mono(INV_R, COS)
        return {}
    if direction == "z":
        if role in {"velocity", "n", "inverseNormalSquared"}:
            return mono(EPS, atom(role, i, r, z + 1, l))
        return {}
    assert direction == "r"
    if role == "velocity":
        return add(mono(atom(role, i, r + 1, z, l)),
                   mono(FAST, atom(role, i, r, z, l + 1)))
    if role in {"n", "inverseNormalSquared", "fast"}:
        return mono(atom(role, i, r + 1, z, l))
    if var == INV_R:
        return scale(mono(INV_R, INV_R), -1)
    return {}


def cylindrical(p, direction):
    pieces = []
    for term, value in p.items():
        for j, multiplicity in Counter(term).items():
            remainder = list(term)
            remainder.remove(j)
            pieces.append(scale(multiply(mono(*remainder), atom_derivative(j, direction)),
                                multiplicity * value))
    phase = mono(IK, atom("n", ("r", "theta", "z").index(direction)))
    return add(multiply(phase, p), *pieces)


def cartesian(p, direction):
    if direction == "z":
        return cylindrical(p, "z")
    radial, angular = cylindrical(p, "r"), cylindrical(p, "theta")
    if direction == "x":
        return add(multiply(mono(COS), radial), scale(multiply(mono(SIN), angular), -1))
    assert direction == "y"
    return add(multiply(mono(SIN), radial), multiply(mono(COS), angular))


def all_polynomials():
    radial, angular, axial = [
        add(mono(Q_INV, atom("n", (i + 1) % 3), atom("velocity", (i + 2) % 3)),
            scale(mono(Q_INV, atom("n", (i + 2) % 3), atom("velocity", (i + 1) % 3)), -1))
        for i in range(3)
    ]
    gauges = (
        add(multiply(mono(COS), radial), scale(multiply(mono(SIN), angular), -1)),
        add(multiply(mono(SIN), radial), multiply(mono(COS), angular)),
        axial,
    )
    rows = []
    for i, gauge in enumerate(gauges):
        rows.append((i, "", gauge))
        for j, direction in enumerate("xyz"):
            derivative = cartesian(gauge, direction)
            rows.append((i, direction, derivative))
            for next_direction in "xyz"[j:]:
                rows.append((i, direction + next_direction, cartesian(derivative, next_direction)))
    assert len(rows) == 30
    return rows


@dataclass(frozen=True)
class Coefficient:
    integer: int = 1
    b: int = 0
    m: int = 0
    s: Q = Q(0)

    def __mul__(self, other):
        return Coefficient(self.integer * other.integer, self.b + other.b, self.m + other.m, self.s + other.s)

    def tuple(self):
        return self.integer, self.b, self.m, str(self.s)


def coefficient(var, ledgers, intercept):
    role, _, r, z, l = var
    if role in {"n", "inverseNormalSquared"}:
        entry, degree_a, degree_s = ledgers[role][r + z]
        assert l == 0 and degree_s <= r + z
        # The C92 input cap is A = Bnorm^6 M.
        return Coefficient(Q(entry).__ceil__(), 6 * degree_a, degree_a, Q(degree_s))
    if role == "velocity":
        # Octant signs do not change the t / P upper. This is the
        # C94 post-cancellation pre-absorption S power plus the L² extension.
        return Coefficient(s=intercept + 3 * (r + z))
    if role == "fast":
        assert z == l == 0 and r <= 1
        return Coefficient(2**20, 12, 1)
    if role == "invR":
        return Coefficient(2, 1)
    if role == "imk":
        return Coefficient(4)
    assert role in {"cos", "sin", "epsilon"}
    return Coefficient()


def read(path, digest=None):
    raw = path.read_bytes()
    actual = sha256(raw).hexdigest()
    assert digest is None or actual == digest, path
    return json.loads(raw), actual


def upstream(inputs, source):
    assert source["status"] == "VERIFIED_ACTUAL_FORCED_GAUGE_SLOTS_AND_CONDITIONAL_L2_CLOSURE"
    assert source["pureL2NativeForcedExtension"]["newDirection"] == [0, 0, 2]
    first = inputs["modeOne"]
    second = inputs["modeTwo"]
    assert Q(first["postCancellationConditionalGrades"]["commonPostCancellationConditionalEpsilonDegree"]) == COMMON
    assert Q(second["epsilonGradeBeforeBands"]) == COMMON
    assert first["postCancellationUniformWeights"]["postCancellationPrefactorLogCap"] == "H/2^108"
    assert inputs["scalar"]["threshold"]["logSOverHUpperAsNegativePowerOfTwo"] == 32636
    assert inputs["scalar"]["threshold"]["HOverMinusLogEpsilonUpper"] == 2
    mode2_from_c93 = inputs["modeTwo"]["conditionalWeightedComparison"]
    assert mode2_from_c93["directionCount"] == 23 and mode2_from_c93["maxAdditionalPoleAfterG2"] == 21
    geometry = inputs["geometry"]["conditionalCoefficientCaps"]["actualCoefficientProfiles"]
    for name in ("radialFast", "radialFastR"):
        assert geometry[name]["envelopesBySlowOrder"][0] == [["0", "-1/100000", "0", "1"]]
    second_rows = inputs["oldWeights"]["conditionalOrderedVariation"]["2"]["physicalOverP"]
    assert len(second_rows) == 23 and all(
        Q(row["velocityOverPBandPower"]) == 10 + 3 * sum(row["RZL"][:2])
        and row["additionalLogPoleAfterGToMode"] == 9 + 3 * sum(row["RZL"][:2]) for row in second_rows
    )
    pure_l2 = source["pureL2NativeForcedExtension"]["byMode"]
    assert set(pure_l2) == {"1", "2"}
    for mode, intercept in (("1", Q(71, 4)), ("2", Q(10))):
        row = pure_l2[mode]
        assert Q(row["nativeVelocityOverPBandPower"]) <= intercept
        assert row["additionalPoleAfterGToMode"] <= 9
        assert Q(row["rawEpsilonGradeBeforeBand"]) >= COMMON
        assert row["foldedPrefactorLogBound"] == "H/2^108"
    old_rows = first["postCancellationUniformWeights"]["rows"]
    requested = {(r, z, l) for r in range(3) for z in range(3-r) for l in range(3-r-z)}
    assert requested - {tuple(x["RZL"]) for x in old_rows} == {(0, 0, 2)}
    assert all(Q(row["nativeVelocityOverPBandPower"]) <= Q(71, 4) + 3 * row["slowRZ"]
               and row["nativeVelocityPoleAfterG"] <= 9 + 3 * row["slowRZ"]
               for row in old_rows)
    assert "33log2" in inputs["stageGate"]["energyGate"]
    assert inputs["stageGate"]["stages"][0]["sourcePotential"] == "f_ac81b63855489a21bb407b2d"


def audit(inputs, source):
    upstream(inputs, source)
    ledgers = inputs["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    exact = all_polynomials()
    maps = []
    all_derivatives = set()
    mode_maxima = {}
    for mode, intercept in (("1", Q(71, 4)), ("2", Q(10))):
        rows = []
        for component, word, polynomial in exact:
            degree = len(word)
            monomial_bounds = []
            poles = []
            velocity_directions = set()
            for term, scalar in polynomial.items():
                assert sum(x[0] in ("imk", "fast") for x in term) <= degree
                field, = [x for x in term if x[0] == "velocity"]
                velocity_directions.add(field[2:])
                assert sum(field[2:]) <= degree
                poles.append(9 + 3 * (field[2] + field[3]))
                monomial_bounds.append(Coefficient(abs(scalar)) *
                                     prod((coefficient(x, ledgers, intercept) for x in term), start=Coefficient()))
            all_derivatives.update(velocity_directions)
            bound = Coefficient(sum(c.integer for c in monomial_bounds),
                                max(c.b for c in monomial_bounds), max(c.m for c in monomial_bounds),
                                max(c.s for c in monomial_bounds))
            rows.append({
                "component": "xyz"[component], "physicalDerivative": word or "value",
                "expandedMonomials": len(polynomial), "positiveCoefficientCap": bound.tuple(),
                "logCoefficientDegrees": [bound.integer.bit_length(), bound.b, bound.m],
                "maxPoleAfterG": max(poles), "nativeVelocityDirections": sorted(velocity_directions),
            })
        max_bits = max(row["logCoefficientDegrees"][0] for row in rows)
        max_b = max(row["logCoefficientDegrees"][1] for row in rows)
        max_m = max(row["logCoefficientDegrees"][2] for row in rows)
        max_s = max(Q(row["positiveCoefficientCap"][3]) for row in rows)
        max_pole = max(row["maxPoleAfterG"] for row in rows) + Q(3*int(mode), 2)
        assert (max_s, max_pole) == (intercept + 6, 15 + Q(3*int(mode), 2))
        # Charge the existing source comparison and the added mapping at once.
        # The new geometric n/q, two radial-fast factors, carrier ceilings,
        # chart weights and Gaussian charge are accounted here, prior to slack.
        # The factors 4 are for the two modes and their conjugates, the s
        # rescaling, the g->zeta comparison, and component complex modulus.
        log_cover_allowance = (162 * 4**4 * factorial(9)).bit_length()
        chart_weight = Q(9,10) / 64 + 2 * (Q(1,2) + Q(1,128))
        assert chart_weight < 2 and max_pole <= 18
        log_charge = Q(1, 2**108) + Q(max_bits + max_b + max_m + log_cover_allowance, 2**128)
        log_charge += max_s / 2**32636
        assert log_charge < Q(1, 2**107)
        assert 2 * log_charge < SLACK
        mode_maxima[mode] = {
            "maxBandPower": str(max_s), "maxPoleAfterZetaToModeOverTwo": str(max_pole),
            "coefficientLogDegrees": [max_bits, max_b, max_m],
            "coverCartesianGaussianBits": log_cover_allowance,
            "logChargeOverHUpper": "2^-107",
            "sameSingleEpsilonLoss": str(SLACK),
        }
        maps.append({"mode": int(mode), "rows": rows})
    expected = {(r, z, l) for r in range(3) for z in range(3-r) for l in range(3-r-z)}
    assert all_derivatives == expected
    assert len(expected) == 10
    epsilon_exponent = COMMON + Q(1, 2) - Q(1, 10) - SLACK
    assert epsilon_exponent == Q(69999, 50000) > 1
    assert Q(40, 2**128) < Q(1, 100)
    # In the original q slab, qBig=32 tau0. The whole-region spatial
    # volume upper and original stage cutoff apply also to an integral
    # restricted to the admitted physical points of the outer collar.
    assert (Q(32, 64), Q(32, 16)) == (Q(1, 2), Q(2))
    assert inputs["stageGate"]["energyDyadicUpper"] == "2^40"
    dyadic_energy_exponent = 40 - 2*36
    assert dyadic_energy_exponent == -32
    return {
        "status": "VERIFIED_CARTESIAN_TRANSFER_CONDITIONAL_OUTER_FORCED_AMPLITUDE",
        "exactDirections": sorted(all_derivatives), "newDirection": [0, 0, 2],
        "componentsAndPhysicalDerivativesPerMode": 30,
        "allowedSourceCoverageCount": 162,
        "polynomialMaps": maps, "modeMaxima": mode_maxima,
        "firstStagePotentialSlice": {
            "physicalScaling": "Q^(1/2-A-r/2) with q=Q*s and s in [1/2,2]",
            "perDerivativeEpsilonLossAtMost": "1/2",
            "inverseCarrierGain": "1/2",
            "stageOneNormalizationCost": "1/10",
            "commonOriginalNativeEpsilonGrade": str(COMMON),
            "coefficientAndBandEpsilonBudget": str(SLACK),
            "weightedPhysicalEpsilonExponent": str(epsilon_exponent),
            "combinedCountedOuterSliceUpper": "exp(-H/2)",
            "acceptedForceAmplitudeReserve": "strictly below 2^-36 Xb^-2 exp(H/10) on the admitted outer slice",
            "conditionalOriginalLocalForceEnergyRatio": "J_outer(first Forced two-mode velocity with original first-stage cutoff)^2 / S_R < 2^-32",
            "energyRatioScope": "Integrate the original localized velocity and its gradient on the admitted outer slice only. No derivative of a collar indicator is taken. Bvector is zero for the first Forced gauge slice.",
        },
        "covered": "Actual first Forced modes 1 and 2 pre-curl physical Cartesian potential, orders 0,1,2, fixed original charts and admitted outer paths.",
        "open": ["first Forced inner and middle annulus", "guard seams where original local smooth extension is not supplied",
                 "Signed, Temporal and FiveMap contributions and direct angular vector", "whole K1 and N7-06",
                 "N8-05 and final jets"],
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    assert __debug__
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--goal", type=Path, required=True)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    options = parser.parse_args()
    inputs = {name: read(options.goal / path, digest)[0] for name, (path, digest) in PINS.items()}
    source, source_sha = read(options.source, SOURCE_SHA)
    result = audit(inputs, source)
    result["inputPins"] = {name: {"path": path.as_posix(), "sha256": digest}
                           for name, (path, digest) in PINS.items()}
    result["actualGaugeSourceSHA256"] = source_sha
    with options.out.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    print("PASS 30 Cartesian roots per mode, 10 native directions, amplitude exponent 69999/50000")
