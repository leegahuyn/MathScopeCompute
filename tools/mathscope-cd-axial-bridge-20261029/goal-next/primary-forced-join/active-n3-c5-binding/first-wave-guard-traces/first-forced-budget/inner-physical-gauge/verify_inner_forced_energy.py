"""Join the authenticated inner Gaussian, primitive, and physical energy ledgers."""

import argparse
from collections import defaultdict
from copy import deepcopy
from fractions import Fraction as Q
from hashlib import sha256
import importlib.util
import inspect
import json
from math import factorial
from pathlib import Path

BAND = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
FORCED = BAND / "first-forced-budget"
PINS = {
    "outerCoefficientModule": (FORCED / "verify_first_forced_log_budget.py", "6e31e50922d6ad0cfae876a3d740fe748f4227779db9fdae310c833250fd77ba"),
    "meanModule": (BAND / "initial-mean-norm/verify_initial_mean_caps.py", "aadb2c753dd3d3fb3528e49529d220744af64eb4e809f566135d71cf140d08e7"),
    "centered": (BAND / "signed-polynomial-shell/initial-temporal/initial-temporal.json", "8c2c1641bf425268451c2ef8564777c942eceb4a3a9092602a0686c88c49c460"),
    "cutoff": (BAND / "signed-shell/signed-shell.json", "5fe379bdc734b5f1c17248bd4ad5b879afa19206e15d74a6f29204846cec8308"),
    "physical": (FORCED / "outer-physical-gauge/outer-forced-energy-slice.json", "a3c39cd72a19f6ab1d9354c0ea2d1db5d34897065b42ab0db4751f9e575d1ffd"),
    "extendedGauge": (FORCED / "outer-physical-gauge/source/forced-gauge-spatial.json", "b8d5be0df034731fb0a14849058416bc3f15d476d6e9b8b1fe196678894a6a59"),
}
SOURCE_SHA = "8228b3442a46ee6e6843ed8212184d1f3fce56f331852096e78b156a6187ff61"
KAPPA = Q(1, 100000)


def read_pinned(path, digest=None):
    raw = path.read_bytes()
    actual = sha256(raw).hexdigest()
    assert digest is None or digest == actual, path
    return raw, actual


def load_module(path, name, digest):
    read_pinned(path, digest)
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    import sys
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def specialize(function, *edits, **extra):
    """Exact substitutions in a named, pinned predecessor function."""
    text = inspect.getsource(function)
    for old, new in edits:
        assert text.count(old) == 1, old
        text = text.replace(old, new)
    names = dict(function.__globals__, **extra)
    exec(compile(text, function.__code__.co_filename, "exec"), names)
    return names[function.__name__]


def primitive_controls(mean_module, mean):
    demands = sorted({tuple(x["RZL"]) for x in mean["rows"]["beta"]} | {(0, 0, 3)})
    assert len(demands) == 44
    powers = set()
    enumerate_marked = specialize(
        mean_module.concrete_caps,
        ("return scale(base,Q(1,8),p=-3,A=1)",
         "primitive_input_poles.update(p for _,_,p,_ in base)\n"
         "                return scale(base,Q(1,8),p=-3,A=101)"),
        primitive_input_poles=powers,
    )
    plain, source_inputs, primitives, fourier = mean_module.concrete_caps(demands)
    marked, check_inputs, check_primitives, check_fourier = enumerate_marked(demands)
    assert (source_inputs, primitives, fourier) == (check_inputs, check_primitives, check_fourier)
    assert (len(source_inputs), len(primitives), len(fourier)) == (604, 153, 171)
    maximum_power = 0
    for role, rows in plain.items():
        assert len(rows) == 44
        for expected, candidate in zip(rows, marked[role], strict=True):
            expected_terms = {(s, e, p, a): Q(c) for s, e, p, a, c in expected["terms"]}
            projected = defaultdict(Q)
            for s, e, p, a, c in candidate["terms"]:
                primitive_count, geometry_exponent = divmod(a, 100)
                maximum_power = max(maximum_power, primitive_count)
                projected[s, e, p, geometry_exponent] += Q(c)
            assert dict(projected) == expected_terms
    assert powers and max(powers) <= 60
    assert maximum_power == 2
    assert Q(1, 128) * Q(1, 4) < Q(1, 4)
    opposite_half_exponent = Q(2, 1) / (2-Q(1, 512))**2
    assert opposite_half_exponent < 1
    # For x<=u, set z=x^-2-u^-2. The resulting integrand is bounded
    # by e^-z (1+z)^n with n=max(0,ceil((p-3)/2)).
    # Exp(4/(width-t1*u)^2) < exp(2) < 9; use 16.
    n = max(0, (max(powers) - 3 + 1)//2)
    assert n <= 29
    primitive = 16 * (n + 1) * factorial(n) // 2
    assert primitive >= 1
    inflation = (8 * primitive) ** maximum_power
    assert factorial(14) < 2**40
    return {
        "primitiveInputPoles": sorted(powers), "primitiveCountPerTerm": maximum_power,
        "newRadiusPath": "source alpha-to-R; positive moving support Ra-to-R; u=y/t1 increases with R at fixed s",
        "resultWeight": "T0 maps zeta*u^-p to C * zeta*u^(3-p), with original geometric Jacobian",
        "oppositeFactorForPrimitive": 16, "exponentialMomentDegree": n,
        "primitiveCoefficientBeforeRadiusGeometry": primitive,
        "ratioOnAllInitialMeanCoefficientRows": inflation,
        "covariances": len(source_inputs), "shiftedPrimitives": len(primitives), "FourierTailRoles": len(fourier),
    }


def pure_gaussian_controls():
    p = [1]
    maxima = []
    for order in range(9):
        # D_u^j exp(-1/(2u^2)) = exp(-1/(2u^2)) u^(-3j) P_j(u^2).
        maxima.append(sum((Q(abs(c), 16**i) for i, c in enumerate(p)), Q(0)))
        nxt = [0] * (len(p) + 1)
        for i, c in enumerate(p):
            nxt[i] += c
            nxt[i+1] += (2*i-3*order)*c
        p = nxt
    assert max(maxima) < 2**40
    return list(map(str, maxima))


def coefficient_budget(goal, module, mean_module):
    original = {}
    for name, (path, digest) in module.PINS.items():
        raw, _ = read_pinned(goal/path, digest)
        original[name] = json.loads(raw)
    primitive = primitive_controls(mean_module, original["mean"])
    flat = pure_gaussian_controls()
    inner = deepcopy(original)
    # C96's regular target removes exactly exp(-1/u²), retaining the original
    # activation denominator in the regular target. Its nine caps are <=2^4096 B.
    rows = [{"coefficientOfTwoPow1521RenvH119": str(2**(4096-1521))} for _ in range(9)]
    inner["scale"]["regularizedLiveTargetCaps"]["boundRows"] = rows
    assemble_caps = specialize(
        module.caps,
        ("gaussian = Bound(2**900, 64)", "gaussian = Bound(2**903, 72)"),
        ("* covariance * mean_geometry ** row[\"maxGeometryPower\"] * tail_absorption",
         "* covariance * mean_geometry ** row[\"maxGeometryPower\"] * tail_absorption * Bound(primitive_charge)"),
        primitive_charge=primitive["ratioOnAllInitialMeanCoefficientRows"],
    )
    catalog, ranks, charges = assemble_caps(inner)
    return primitive, flat, catalog, ranks, charges


def compare_energy(physical, ranks, charges):
    assert physical["status"] == "VERIFIED_CARTESIAN_TRANSFER_CONDITIONAL_OUTER_FORCED_AMPLITUDE"
    assert physical["componentsAndPhysicalDerivativesPerMode"] == 30
    assert physical["newDirection"] == [0, 0, 2]
    assert all(0 <= c <= 2**16 for c in charges)
    assert sum(ranks) < 2**19
    assert len(physical["exactDirections"]) == 10
    # Inner g_i = exp(-1/(2u²))*u^-3/2 is an upper weight for the
    # regularized native amplitude. Absorb 1/4 of the normalized Gaussian
    # without converting u back to a dimensional pole.
    log_factors = {}
    for mode, prev in physical["modeMaxima"].items():
        pole = Q(prev["maxPoleAfterZetaToModeOverTwo"])
        n = (pole/2).__ceil__()
        assert n <= 9
        gaussian_extra = 2*n + 3  # (1/4)^(-n), and the opposite-face ratio.
        geometry_bits = sum(prev["coefficientLogDegrees"]) + prev["coverCartesianGaussianBits"]
        band = Q(prev["maxBandPower"])
        assert band <= 64
        # C92's valid separated log cap, plus C94's grouped coefficients,
        # C95's Cartesian gauge and support count, and the inner pole charge.
        log_charge = (Q(1, 2**109) + Q(1, 2**124) +
                      Q(geometry_bits+gaussian_extra+256, 2**128) + band/2**32636)
        assert log_charge < Q(1, 2**108)
        assert 2*log_charge < KAPPA
        log_factors[mode] = {
            "maxPoleAfterZeta": str(pole), "innerGaussianMomentPower": n,
            "maximumS": str(band), "extraBitsAgainstOuterGaussian": gaussian_extra,
            "wholeLogChargeOverHUpper": "2^-108",
        }
    weighted_grade = 1 - KAPPA + Q(1,2) - Q(1,10) - KAPPA
    assert weighted_grade == Q(69999, 50000) > 1
    assert 40 * Q(1, 2**128) < Q(1,100)
    assert 40 - 2*36 == -32
    assert Q(1,512)+Q(1,4) < 2  # the two retained collars do not overlap
    return {
        "logModes": log_factors,
        "weightedPhysicalEpsilonExponent": str(weighted_grade),
        "conditionalInnerPotentialSliceUpper": "exp(-H/2)",
        "conditionalInnerEnergyRatioStrictUpper": "2^-32",
        "conditionalInnerOuterDisjointEnergyRatioStrictUpper": "2^-31",
        "energy": "Apply the original first-stage cutoff to the actual Forced gauge and integrate only over the two admitted radial pieces; add the two nonnegative integrals.",
    }


def check_ast_operands(centered, cutoff, scales):
    assert centered["pressureZ"] == 17754234
    assert (centered["pressurePaths"][0]["left"], centered["pressurePaths"][1]["left"]) == (
        17753667, 17754191
    )
    assert centered["pressureZFormula"].startswith("I_Z-chi*J_Z-chi_Z*J")
    assert centered["sourceStream"]["nodes"] == cutoff["sourceStream"]["nodes"] == 22155584
    defs = scales["definitions"]
    assert defs["t1"] == {"power": [{"ref": "CSelected"}, -120]}
    assert defs["Xa"] == {"quotient": [{"integer": 4}, {"ref": "Lambda"}]}
    assert defs["sourceEnvelopeS"] == {"power": [{"ref": "CSelected"}, 100000]}
    assert defs["C12EnvelopeR"] == {"exp": {"power": [{"ref": "sourceEnvelopeS"}, 256]}}


def main():
    assert __debug__
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("goal","source","scales","out"):
        parser.add_argument("--"+name, type=Path, required=True)
    args = parser.parse_args()
    coefficient_module = load_module(args.goal / PINS["outerCoefficientModule"][0], "c96_outer_bounds", PINS["outerCoefficientModule"][1])
    mean_module = load_module(args.goal / PINS["meanModule"][0], "c96_initial_mean", PINS["meanModule"][1])
    raw, scale_pin = read_pinned(args.scales, "03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0")
    scales = json.loads(raw)
    inputs = {key: json.loads(read_pinned(args.goal/path, expected)[0])
              for key, (path,expected) in PINS.items() if key not in {"outerCoefficientModule","meanModule"}}
    check_ast_operands(inputs["centered"], inputs["cutoff"], scales)
    inner_raw, source_digest = read_pinned(args.source, SOURCE_SHA)
    source = json.loads(inner_raw)
    assert source["status"] == "VERIFIED_ORIGINAL_INNER_COVARIANCE_TARGET_BINDING_CONDITIONAL_NATIVE_PULSE_AND_ANALYTIC_CAPS"
    assert source["mass"]["massPowerS"] == "-1/2" and source["mass"]["detLowerPowerS"] == "-1"
    inner = source["regions"]["inner"]
    assert inner["projectionUpperPowerOfRenv"] == 8
    sqrt_rows = inner["sqrtWeightSlowRows"]
    assert len(sqrt_rows) == 9
    assert all(Q(row["sqrtWeightPowerS"]) == 2*row["order"]+Q(1,4) for row in sqrt_rows)
    assert inner["projectionLowerPowerOfRenv"] == 55
    assert inner["regularActivation"]["includedInHistoricalRegularBody"]
    target_rows = inner["regularStressSlowRows"]
    assert len(target_rows) == 9
    for order, row in enumerate(target_rows):
        assert row["order"] == order and row["profileOrdinaryLogCPower"] == 608 + 120*order
        assert row["physicalSlowCap"] == "2^4096*Bnorm"
        assert row["RenvPowerBeforeChartAbsorption"] == 1 + 2*order
    primitive, gaussian, coefficients, ranks, charges = coefficient_budget(args.goal, coefficient_module, mean_module)
    mean_l3 = inputs["extendedGauge"]["pureL2NativeForcedExtension"]["byMode"]
    assert all(Q(row["rawEpsilonGradeBeforeBand"]) == 1-KAPPA for row in mean_l3.values())
    energy = compare_energy(inputs["physical"], ranks, charges)
    result = {
        "status": "VERIFIED_INNER_FORWARD_PRIMITIVE_AND_CONDITIONAL_ORIGINAL_INNER_ENERGY",
        "inputPins": {name: {"path": path.as_posix(), "sha256": digest} for name, (path, digest) in PINS.items()},
        "numericScaleDefinitionsSHA256": scale_pin, "sourceInnerTargetSHA256": source_digest,
        "innerDomain": "0 < u=log(X/Xa)/t1 <= 1/4, fixed original label, qBig/64 <= q < qBig/16",
        "innerPressureRoots": {"pressureZ": 17754234, "forward": [17753667,17754191]},
        "primitiveReplay": primitive, "pureGaussianDerivativeBoundsThrough8": gaussian,
        "actualRegularTargetUpper": "2^4096 Bnorm through physical order 8",
        "actualRegularDirectionalLower": "Renv^-55 on the original positive cone",
        "coefficientLogDegreeOrder": ["log(2)", "log(Bnorm)", "log(propagator)", "log(backgroundCap)"],
        "recomputedInnerCoefficientCatalogue": coefficients,
        "maximumInnerFieldProductLogDegrees": ranks, "innerLeanLogCharges": charges,
        "conditionalPhysicalEnergyComparison": energy,
        "premises": "Original smooth fixed-label chart, regular target realization, applicable positive covariance cone and propagator, all actual short shifted source paths and original flat boundary interpretation.",
        "open": ["middle and its nonzero initial FiveMap", "full Signed/Temporal/FiveMap and subsequent corrections", "full N7-06, N8-05 and final jets"],
        "finalJets": 0, "release": "HOLD",
    }
    with args.out.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    print("PASS inner native pressure and mean paths, primitive cap, conditional J_inner^2/S_R < 2^-32")


if __name__ == "__main__":
    main()
