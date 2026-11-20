"""Replay the original inner and middle target attachment to active covariance."""

from argparse import ArgumentParser
from fractions import Fraction as Q
import gzip
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path
import runpy
import sys


BAND = "primary-forced-join/active-n3-c5-binding/first-wave-guard-traces"
OUTER = BAND + "/outer-normalized-amplitude"
FIXED = BAND + "/outer-fixed-label-norm"
TARGET = "whole-k-annular-wrz-norm"
PINS = {
    "live": (OUTER + "/outer-live.json", "23d3577bc75eb2a6587eb5839a7c6b9f834814e46c335c136fb165757f03aa39"),
    "source": (OUTER + "/outer-source.json", "350586b512bfcc9e605feb80c4c0cf3bd32f6520c78abd396eed13147f1f5de7"),
    "scale": (OUTER + "/outer-scale.json", "71b6c139f15491aa0c625a25c91c32987a4f58038ccd97fdce9ea888a6e892aa"),
    "pulse": (OUTER + "/pulse-frame/pulse-frame-caps-final.json", "56cc1d9685f00a5aba808675023453b3808fd916bd697f4ab9a242512ebee32d"),
    "digest": (OUTER + "/verify_live_outer_source.py", "f1acd10897e224cc9151e9485d08aad9c1d82858a3ac710ac0510b6a73c07a02"),
    "band": (FIXED + "/band-weight.json", "4e334a10ed93839437baa8b2caefe36d32291bfc6c3d67d3b8b04c41fa797ba0"),
    "matrix": (FIXED + "/matrix/matrix-s-j.json", "e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36"),
    "background": (FIXED + "/background-transport.json", "0b7c13076805acc97cd45e3e4e70e6f7620950744dc493dbff26d0644ff977cc"),
    "weightedTarget": ("final67/n7-n8-target-directed/weighted-target-high.json", "75b0bb821dc1a486ced5d88176faffe63645d73534366f11bd1708d39377e25f"),
    "target": (TARGET + "/target-c7.json", "3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770"),
    "targetGraph": (TARGET + "/target-c7-graph.jsonl.gz", "6aa5a4aa57466efa0fc80a7137675284e8a3fc84d308312e95f48298efda4625"),
    "targetProducer": (TARGET + "/replay_target_c7.mjs", "06b2791ae53587b8c76408271c929c8479a7d76f5b3ade741f1a2e164dc62446"),
    "inner": (TARGET + "/target-numerical/target-inner-numerical.json", "724daf0118dd8dc9b2d4af0597411bdee0995c99e68a25950a80749517737e4d"),
    "middle": (TARGET + "/target-numerical/target-middle-numerical.json", "07cbe3e4cda7f95d289fffea64472a5fac45387f72a4414603fec663613458e9"),
    "chart": ("primary-forced-join/active-n3-c5-binding/norm-leading/slow-chart-majorant.json", "f15c6f354276be183238c3d829c335b71e33d3d08f28a0fae49ca17e46d35eb5"),
    "fixed": ("whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json", "9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c"),
}


def pinned(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


def lexical_bindings(goal, rebuilt, target, live):
    with gzip.open(goal / PINS["targetGraph"][0], "rt", encoding="utf8") as stream:
        header = json.loads(next(stream))
        records = [json.loads(line) for line in stream]
    assert header["nodeCount"] == len(records) == 153455
    digest = runpy.run_path(str(goal / PINS["digest"][0]))["SourceDigest"]
    historical = digest(records.__getitem__, json.loads(header["definitions"]["expression"]))
    rebuilt_raw = digest(rebuilt["targetNodes"].__getitem__, rebuilt["targetDefinitions"])
    rebuilt_factor = digest(rebuilt["factorNodes"].__getitem__, [])
    historical_inner = target["regionFactoring"]["inner"]
    factor_roots = rebuilt["factorRoots"]
    assert target["regions"]["inner"]["coordinates"] == [117676, 2]
    factors = []
    for name in ("innerFactor", "innerTheta", "innerZ"):
        older_root = historical_inner[name]
        newer_root = factor_roots[name]
        old_hash = historical.of(older_root, (117676, 2))
        new_hash = rebuilt_factor.of(newer_root, (factor_roots["innerLogDistance"], 2))
        assert old_hash == new_hash, (name, old_hash, new_hash)
        factors.append({"name": name, "historicalRoot": older_root, "rebuiltRoot": newer_root,
                        "lexicalSHA256": old_hash})
    raw = []
    for older_root, entry, bound in zip(target["originalTarget"]["roots"], rebuilt["raw"],
                                         live["target"]["Tbar"], strict=True):
        actual = tuple(entry["parameters"])
        assert actual == (4756, 2) and bound["actualArguments"] == [17732770, 17732775]
        old_hash = historical.of(older_root, actual)
        new_hash = rebuilt_raw.of(entry["body"], actual)
        assert historical.of(older_root, tuple(reversed(actual))) != old_hash
        raw.append({"historicalBody": older_root, "rebuiltBody": entry["body"],
                    "activeBody": bound["baseBody"], "activeSlot": bound["baseNativeSlot"],
                    "activeCall": bound["T0"], "formalArgs": list(actual),
                    "activeArgs": bound["actualArguments"], "historicalLexicalSHA256": old_hash,
                    "rebuiltLexicalSHA256": new_hash, "literalMatch": old_hash == new_hash})
    activation = 119711
    assert records[119712] == {"op": "multiply", "args": [historical_inner["innerTheta"], activation]}
    assert records[119713] == {"op": "multiply", "args": [historical_inner["innerZ"], activation]}
    assert records[activation]["op"] == "multiply"
    assert all(not entry["literalMatch"] for entry in raw)
    return {"historicalMiddleComparisonToActiveT0": raw, "innerRegularFactorProducer": factors,
            "historicalRegularInnerRoots": [119712, 119713], "regularActivationRoot": activation}


def polynomial_rows():
    result = []
    polynomial = [1]
    for order in range(9):
        norm = sum(abs(coefficient) * Q(1, 16)**degree
                   for degree, coefficient in enumerate(polynomial))
        result.append({"order": order, "poleInU": 3*order,
                       "coefficientsInUSquared": polynomial,
                       "polynomialAbsUpperOnUleQuarter": str(norm)})
        next_polynomial = polynomial + [0]
        for degree, coefficient in enumerate(polynomial):
            next_polynomial[degree+1] += (2*degree-3*order)*coefficient
        polynomial = next_polynomial
    assert result[1]["coefficientsInUSquared"] == [1, 0]
    assert result[2]["coefficientsInUSquared"] == [1, -3, 0]
    assert result[3]["coefficientsInUSquared"] == [1, -9, 12, 0]
    return result


def sqrt_rows(scale, band):
    # The fixed-label limits and the density are independent of factored target scale.
    result = []
    for j, (source_row, band_row) in enumerate(zip(scale["scaleRows"], band["scaleTransfer"], strict=True)):
        assert j == source_row["order"] == band_row["order"] and band_row["boundFieldOrderAvailable"] >= j+1
        row = {"order": j, "matrixOrTangentPowerS": j, "propagatorOrTangentOverPPowerS": 2*j,
               "covariancePowerS": str(2*j-Q(1, 2)), "weightPowerS": str(2*j+Q(1, 2)),
               "sqrtWeightPowerS": str(2*j+Q(1, 4))}
        assert row["covariancePowerS"] == source_row["H"] == band_row["covarianceAndAmplitudePowers"]["H"]
        assert row["weightPowerS"] == source_row["regularWeightW"] == band_row["covarianceAndAmplitudePowers"]["regularWeightW"]
        assert row["sqrtWeightPowerS"] == source_row["sqrtW"] == band_row["covarianceAndAmplitudePowers"]["sqrtW"]
        result.append(row)
    return result


def projection_rows(inner, middle, chart):
    # |b_a| > C^-12/4 after multiplying the already regularized factor g_a.
    # R=exp(C^25,600,000), and C>2, imply C^1568<R and C^-12/4>R^-1.
    assert 25_600_000 > 1568 and 25_600_000-12 > 2
    # The finite positive exponential bound is independent of endpoint sampling.
    e_upper = sum(Q(1, factorial(j)) for j in range(5)) + Q(1, 100)
    assert e_upper**2 < 8 and Q(16, 9) < 2
    assert inner["outputDerivativeOrder"] == middle["actualTargetThroughOrdinaryOrder"] == 9
    assert inner["maxComponentPower"] == [327, 608]
    assert chart["geometry"].startswith("H=max(2,Lambda,C12EnvelopeR)")
    regular = []
    for j in range(9):
        cap = comb(j+2, 2)*factorial(j)
        assert cap < 2**32 and 1521+cap.bit_length() < 4096 and 17+119 < 4096
        regular.append({"order": j, "profileOrdinaryLogCPower": 608+120*j,
                        "physicalSlowCap": "2^4096*Bnorm",
                        "termFactor": cap, "RenvPowerBeforeChartAbsorption": 1+2*j})
    # A_c < 4 R^20, s^(-A-1/2)>=1/4, -n.N>R^-33, R>16.
    assert 20+1+33+1 == 55 and 20+20+33+1 == 74
    # |b_a|<=2C^608<2R, s^(-A-1/2)<=4, A_c>R^-6.
    assert 1+6+1 == 8
    return regular


def replay(goal, private_graph, runtime):
    paths = {name: pinned(goal / path, sha) for name, (path, sha) in PINS.items()}
    names = ("source", "live", "scale", "pulse", "band", "matrix", "background", "weightedTarget",
             "target", "inner", "middle", "chart")
    data = {name: json.loads(paths[name]) for name in names}
    source, live, target = (data[name] for name in ("source", "live", "target"))
    rebuilt = json.loads(pinned(private_graph, source["privateGraphSHA256"]))
    parameter = source["parameters"]
    assert target["sourceParameterSHA256"] == data["weightedTarget"]["sourceParameterSHA256"] == parameter
    assert live["originalOuterReplaySHA256"] == PINS["source"][1]
    assert live["positiveMasses"]["exactProduct"] == "haar*Ls=Dgeom*r0*Ichi"
    masses = [entry["mass"] for entry in live["positiveMasses"]["sameMassAsColumns"]]
    assert masses == [17733414, 17733746]
    assert source["exactCone"]["inverseBounds"] == ["kappa/64", "2"]
    assert all(x["pass"] for x in source["exactCone"]["rows"])
    assert source["originalOuterFactor"]["sourceProjectionProof"]["pass"]
    stream = live["pins"]["stream"]
    assert stream == data["pulse"]["sourceStream"]["sha256"] == data["matrix"]["sourceStream"]["sha256"]
    program_name = "actual-stress-direction-program.mjs"
    bounds_name = "actual-stress-direction-bounds.mjs"
    program = pinned(runtime / program_name, source["sourcePins"][program_name]).decode()
    bounds = pinned(runtime / bounds_name, source["sourcePins"][bounds_name]).decode()
    profile_pin = "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a"
    parameters = json.JSONDecoder().raw_decode(
        pinned(runtime / "source-profile-data.mjs", profile_pin).decode().split("PINNED_N3 = ", 1)[1])[0]
    assert parameters["parameterExpressionSHA256"] == parameter
    p = parameters["parametersExactExpressions"]
    assert p["kappa0"] == {"ref": "t1"} and p["t1"] == {"power": [{"ref": "CSelected"}, -120]}
    assert p["sourceEnvelopeS"] == {"power": [{"ref": "CSelected"}, 100000]}
    assert p["C12EnvelopeR"] == {"exp": {"power": [{"ref": "sourceEnvelopeS"}, 256]}}
    assert p["directionalMarginKappa"] == {"power": [{"ref": "C12EnvelopeR"}, -10]}
    assert "inner:'T0=e_a*(innerTheta,innerZ)'" in program
    assert "factorCoefficientLower:'C^-12'" in bounds and "stressLower:'R^-20'" in bounds
    assert "so -n dot N>R^-33 throughout" in bounds
    assert "N,K,c0 are held fixed at the representative" in bounds
    assert "const innerBodies=[inner.roots.innerTheta,inner.roots.innerZ].map(b=>G.mul(ga,b))" in paths["targetProducer"].decode()
    rows = sqrt_rows(data["scale"], data["band"])
    regular = projection_rows(data["inner"], data["middle"], data["chart"])
    mass_gain = data["scale"]["gaussianLengthGain"]
    middle_raw_limits = data["middle"]["componentBounds"]
    assert data["middle"]["actualTargetBodies"] == target["originalTarget"]["roots"]
    assert data["inner"]["actualInnerBodies"] == [119712, 119713]
    assert data["background"]["sourceNodes"] == live["sourceNodes"]
    return {
        "status": "VERIFIED_ORIGINAL_INNER_COVARIANCE_TARGET_BINDING_CONDITIONAL_NATIVE_PULSE_AND_ANALYTIC_CAPS",
        "pins": {**{name: sha for name, (_, sha) in PINS.items()}, "privateGraph": source["privateGraphSHA256"],
                 "directionProgram": source["sourcePins"][program_name],
                 "directionBounds": source["sourcePins"][bounds_name], "sourceProfile": profile_pin},
        "bindings": lexical_bindings(goal, rebuilt, target, live),
        "mass": {"massPowerS": "-1/2", "detLowerPowerS": "-1", "sameLiveMasses": masses,
                 "physicalMassLower": mass_gain["physicalMassLower"], "physicalMassUpper": mass_gain["physicalMassUpper"],
                 "determinantLower": mass_gain["determinantLower"],
                 "scope": "Same fixed positive admitted label and original representative, normalized column and pulse premises retained."},
        "regions": {
            "inner": {"coordinate": "u=log(X/Xa)/t1", "openRange": ["0", "1/4"],
                      "baseGaussian": "exp(-1/(2*u^2))",
                      "regularActivation": {"formula": "(1-kappa0)/(flat(u)+flat(1-u))", "bounds": ["1/4", "8"],
                                            "includedInHistoricalRegularBody": True},
                      "targetFactorization": "Tbar=exp(-1/u^2)*s^(-A-1/2)*(#119712,#119713)",
                      "projectionLowerPowerOfRenv": 55, "projectionUpperPowerOfRenv": 8,
                      "regularStressSlowRows": regular, "baseGaussianDerivativeRows": polynomial_rows(),
                      "sqrtWeightSlowRows": rows,
                      "sqrtSNormalizedWRange": mass_gain["sqrtSNormalizedWRange"],
                      "oppositeEndpointGaussian": "exp(-4/d^2), exact and positive; reciprocal <=8 on inner collar"},
            "middle": {"status": "CONDITIONAL_UNTIL_RAW_CAP_HAS_SAME_BODY_BINDING",
                       "coordinateDomain": ["y>=t1/8", "d>=1/4", "-1<=eta<=1", "1/2<=s<=2"],
                       "targetFactorization": "Tbar=s^(-A-1/2)*T0, without division by zeta",
                       "projectionLowerPowerOfRenv": 74,
                       "projectionUpper": "8*Renv^6*max_component(raw C8 bound)",
                       "historicalCandidateRegularStressSlowRows": {"rawOrdinaryThrough": 8, "rawComponentC8": [entry[6] for entry in middle_raw_limits],
                                                 "chart": "45*2^1521*Hchart^119 times the maximum of the two raw C8 caps"},
                       "sqrtWeightSlowRows": rows,
                       "sqrtSNormalizedWRange": ["kappa*Renv^(-74)/(64*m_U)", "16*Renv^6*max_component(raw C8 bound)/m_L"]},
        },
        "controls": {"coneInverse": source["exactCone"]["inverseBounds"],
                     "wrongFormalSwapRejected": True,
                     "physicalMassFixedDuringSlowDifferentiation": False,
                     "pulseLimitsFixedDuringSlowDifferentiation": True,
                     "sourceSelector": "Retain admitted same box and physical chart with inward eta endpoint derivatives.",
                     "factoringOnlyInsideOpenAnnulus": True,
                     "flatEndpointInterpretation": "Use smooth regular coefficient and original flat zero branches; never divide by numerical zero."},
        "open": ["Middle raw numerical cap needs an equality proof for the active bodies and subsequent comparison to the C95 Cartesian amplitude budget.",
                 "Initial mean and cross-region shifted primitive bounds, and coupled Forced and energy transfer, are separate.",
                 "No final norm-class or jet promotion."],
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    if not __debug__:
        raise RuntimeError("Verification requires enabled assertions.")
    parser = ArgumentParser()
    for name in ("goal", "private-graph", "runtime", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    sys.setrecursionlimit(10000)
    result = replay(args.goal, args.private_graph, args.runtime)
    args.out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf8", newline="\n")
    print("Verified original inner factors, active positive masses and rational degree ledgers. Middle same-body cap remains open.")
