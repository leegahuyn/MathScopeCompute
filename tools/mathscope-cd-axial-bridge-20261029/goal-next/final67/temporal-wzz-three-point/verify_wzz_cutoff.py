"""Verify the archived original Wzz shape and three-sample inverse comparison."""

import argparse
import json
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from pathlib import Path


WORKSPACE = Path(__file__).resolve().parents[4]
WORK = WORKSPACE / "work/goal-next"
GOAL = WORKSPACE / "work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next"
XI, CHI, V = 17733037, 17733045, 17732751
BODY = {1: (17738743, 17738736), -1: (17742161, 17742154)}
PINS = {
    "slab": (WORK / "continuation73/prehaar-wrz/source-slab.json", "8152230d5531fd00bb0685fbcb380ad1b7a116d8833ee871d92803663aee19e9"),
    "temporal": (WORK / "continuation74/time-inverse/source-native-final.json", "b63588358fd2ee676ffdbba6104d5f0c644828cdecff4215e0d87f09037f6f2c"),
    "registry": (WORK / "continuation34/hosted-43296617887-n3/witness/original-source-functions.json", "364425db9d5bbd317f8aaad681fdfdd3206f97e0f46d2beb78b6e7d5a30a3111"),
    "wrz": (WORK / "continuation75/wrz-anisotropic/anisotropic-final.json", "f549235f4f126ffc2141f4d1a3b3280d25206402a8ba332a961121da0295e013"),
    "fourier": (GOAL / "whole-k-annular-wrz/transverse-wrz-bound.json", "12cc99ba7c3b47c88555e5eaca310fab7471d307e720c40340de78e104d9634d"),
    "cover": (GOAL / "primary-forced-join/active-n3-c5-binding/mean-c4/common-w4/common-w4-weighted-v4.json", "9da54bbb2bd959e097c8ef610eabaf8ef8b163e540c73169dd82fcdaa784bc69"),
    "admission": (WORK / "continuation73/primary-paths/path-admission.json", "7913987530f25c6c93ea383611d56dc99882046037439b08ddb232aa71f32f4a"),
    "temporal-source": (WORK / "continuation31/pressure-parity/runtimes/original/research-ide/mathscope-m3/navier/source-temporal-potential.mjs", "c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8"),
}


def decode(rows):
    return json.loads(rows) if isinstance(rows, str) else rows


def read_inputs():
    result = {}
    for name, (path, expected) in PINS.items():
        raw = path.read_bytes()
        assert sha256(raw).hexdigest() == expected, name
        result[name] = json.loads(raw) if path.suffix == ".json" else raw.decode()
    return result


def check_source(data):
    prefix = data["slab"]
    temporal = data["temporal"]
    assert prefix["verifiedSourceStream"] == temporal["originalStreamSHA256"]
    assert temporal["nodeCount"] == 21681493
    nodes = {int(k): v for k, v in prefix["nodes"].items()}
    later = {int(k): v for k, v in temporal["nodes"].items()}
    registry = data["registry"]["base"]
    field_rz, field_zz = (decode(registry["fieldDefinitions"])[i] for i in (2, 5))
    assert field_zz["name"] == "GlobalCompleteCommonTorus_zz"
    assert len(field_rz["rows"]) == len(field_zz["rows"]) == data["wrz"]["actual"]["rows"] == 162
    assert field_rz["parameters"] == field_zz["parameters"]
    assert field_rz["directions"] == field_zz["directions"]
    assert nodes[17753403] == ["m3_aux_indexed_partial", [5, field_zz["parameters"], [0]*5]]
    assert nodes[17754263] == ["m3_aux_indexed_partial", [5, field_zz["parameters"], [0, 1, 0, 0, 0]]]
    assert nodes[17754264] == ["multiply", [17732744, 17754263]]
    assert nodes[17754266] == ["add", [17754262, 17754264]]
    assert nodes[17754267] == ["add", [17754265, 17754266]]
    assert nodes[17754268] == ["add", [17744195, 17754267]]
    assert decode(registry["inverseDefinitions"])[1]["body"] == 17754268
    at_radial = [21374535, *field_zz["parameters"][1:]]
    assert later[21374536] == ["m3_aux_indexed_partial", [5, at_radial, [0]*5]]
    assert later[21374560] == ["integer_power", [21374558, 2]]
    assert later[21374562] == ["add", [21374536, 21374561]]
    assert later[21374563] == ["multiply", [21374535, 21374562]]
    assert later[21374564] == ["definite_integral", [21374563, 17745430, 0, 1]]
    assert later[21374565] == ["definite_integral", [21374564, 17745431, 0, 1]]
    assert later[21374566] == ["definite_integral", [21374565, 21374535, 17743711, 17743713]]
    assert later[21374575] == ["add", [21374566, 21374574]]
    assert decode(registry["expressionDefinitions"])[17]["body"] == 21374575
    assert "gammaIdentity=globalGraphEqual(G,realizedGammaFromFTC,G.sub(gammaDesired,cutoffRemainder)" in data["temporal-source"]
    assert "cutoffRemainder=G.div(G.mul(G.derivative(chi,R),integrals.whole),R)" in data["temporal-source"]
    assert data["wrz"]["actual"]["cutoff"] == CHI
    assert data["cover"]["fixedLabelJacobian"] == "L xi=Lambda^delta, N xi=0, L v=0, N v=Tg^delta/ci_label; 0<=delta<=4"
    assert data["admission"]["originalGeometry"]["activeOwnLabelOffsets"] == [14, 15, 16]
    for rz, zz in zip(field_rz["rows"], field_zz["rows"]):
        assert zz["localBody"] == BODY[zz["label"]["sign"]][0]
        assert zz["localParameters"][7:] == [XI, V]
        for key in ("localParameters", "values", "derivativeMaps", "coefficient", "guards", "label"):
            assert zz[key] == rz[key], key

    potentials = {int(k): v for k, v in data["wrz"]["actual"]["nativePotentialBodies"].items()}
    native = decode(registry["base"]["expression"])

    def rat(i):
        op, args = nodes[i]
        assert op == "rational"
        return Q(*map(int, args))

    @cache
    def depends(i):
        if i <= XI:
            return i == XI
        op, args = nodes[i]
        if op in ("rational", "coordinate", "source_parameter"):
            return False
        if op == "definite_integral":
            kids = args[2:] if args[1] == XI else [args[0], *args[2:]]
        elif op in ("integer_power", "source_step_derivative"):
            kids = args[:1]
        elif op in ("actual_expression_partial", "m3_aux_expression_partial", "m3_aux_indexed_partial", "m3_global_indexed_partial"):
            kids = args[1]
        elif op in ("actual_covariance_volterra", "m3_global_pulse_jet"):
            kids = [args[2], *args[3]]
        elif op in ("actual_quadratic_root", "actual_monotone_root"):
            kids = args[1] if isinstance(args[1], list) else args[1:]
        elif op in ("actual_background_picard", "actual_background_even_profile"):
            kids = args[2:4]
        elif op == "actual_natural_series":
            kids = args[1:3]
        else:
            assert op in ("add", "multiply", "inverse", "sqrt_positive", "log_positive", "exp", "ceiling", "maximum", "smooth_piecewise", "sine", "cosine"), (i, op)
            kids = args
        assert all(child < i for child in kids)
        return any(depends(k) for k in kids)

    apps = set()

    @cache
    def powers(i, allow_potential=False):
        if not depends(i):
            return frozenset({(0, 0)})
        if i == CHI:
            return frozenset({(1, 0)})
        op, args = nodes[i]
        if op == "actual_expression_partial" and allow_potential:
            system, values, orders = args
            assert system in potentials and len(values) == len(orders) == 12 and values[3] == XI
            assert all(j == 3 or not depends(x) for j, x in enumerate(values))
            degree = orders[3]
            assert degree in (0, 1)
            apps.add(i)
            return frozenset({(1-degree, degree)})
        if op == "add":
            return frozenset().union(*(powers(x, allow_potential) for x in args))
        assert op == "multiply", (i, op)
        result = {(0, 0)}
        for child in args:
            result = {(a+x, b+y) for a, b in result for x, y in powers(child, allow_potential)}
        return frozenset(result)

    for system, body in potentials.items():
        assert native[system]["body"] == body and native[system]["parameters"][3] == XI
        assert not native[system]["unspecifiedOracle"] and powers(body) == {(1, 0)}

    verified = {}
    for sign, (guarded, raw) in BODY.items():
        cursor = guarded
        xi_guards, other_guards = [], []
        while nodes[cursor][0] == "smooth_piecewise":
            x, lo, hi, zero, inner, other = nodes[cursor][1]
            assert zero == other == 0 and not depends(lo) and not depends(hi)
            if depends(x):
                assert x == XI and rat(lo) == -Q(1, 2**34) and rat(hi) == Q(1, 2**34)
                xi_guards.append(cursor)
            else:
                other_guards.append(cursor)
            cursor = inner
        assert cursor == raw and len(xi_guards) == 1 and len(other_guards) == 6
        op, (half, terms) = nodes[raw]
        assert op == "multiply" and rat(half) == Q(1, 2)
        op, (leading, remainder) = nodes[terms]
        assert op == "add"
        op, (a, aa) = nodes[leading]
        assert op == "multiply" and a == aa and powers(a, True) == {(1, 0)}
        op, (b, bb) = nodes[remainder]
        assert op == "multiply" and b == bb and powers(b, True) == {(1, 0), (0, 1)}
        assert powers(raw, True) == {(2, 0), (1, 1), (0, 2)}
        verified[sign] = {"guarded": guarded, "interior": raw, "xiGuard": xi_guards[0], "xiIndependentGuards": other_guards,
                          "axialLeading": a, "axialImaginaryCurl": b, "leadingSquare": leading, "curlSquare": remainder}
    return {"field": 5, "application": 17753403, "actualEarlyEz": 17754268, "actualWzzZInEz": [17754263, 17754264],
            "actualFreshJzWzzAndGammaSquare": [21374536, 21374560], "jzFluxIntegral": 21374566,
            "jzBody": 21374575, "rowsWithExactC75SiblingMaps": 162, "cutoff": CHI, "xi": XI,
            "verifiedBranches": verified, "actualPotentialApplications": sorted(apps),
            "transverseMonomials": ["chi^2", "chi*chi_prime", "chi_prime^2"]}


def compare(data):
    c0, c1, c2, c3 = data["fourier"]["fixedCutoff"]["chiSup"]
    assert c0 == 1
    r0, u = Q(1, 2**34), Q(1, 2)
    sigma_prime = u*(1-u)*(2/u**3+2/(1-u)**3)
    assert sigma_prime == 8
    slope = 2*sigma_prime/r0
    assert slope == 2**38
    half_cross = u*slope
    square = slope**2
    assert 2*half_cross*square == 2**114
    c_bound = 1/half_cross
    d_bound = Q(5, 4)/square
    assert c_bound == Q(1, 2**37) and d_bound == Q(5, 2**78)
    second = 2*c1**2 + 2*c2 + c_bound*(3*c1*c2+c3) + d_bound*(2*c2**2+2*c1*c3)
    assert second == 73480008268573299053216957202432
    fourier = data["fourier"]["fourier"]
    inv_f, inv_l2 = Q(fourier["pointwiseL2Constant"]), Q(fourier["pointwiseL2TransverseSecondConstant"])
    assert (inv_f, inv_l2) == (Q(85, 6), Q(85, 216))
    per_row = inv_f + inv_l2*Q(13, 5)**8*second
    choices = []
    for axial, time, bits in ((3, 1, 130), (5, 1, 132)):
        exponent_max = 2*(1+time) + axial
        assert 2**exponent_max == {3: 128, 5: 512}[axial]
        for beta in (Q(1), Q(2)-Q(2, 100000)):
            assert Q(exponent_max, 2) - (axial+beta-2)*Q(1, 64) > 0
        coefficient = 162 * 2**exponent_max * per_row
        assert coefficient < 2**bits
        choices.append({"maximumWzzSlowOrder": [0, axial, time], "bandFactor": 2**exponent_max,
                        "inverseOverallFactor": str(coefficient), "strictOverallFactorUpper": f"2^{bits}"})
    return {"r0": str(r0), "sampleOrder": ["0", "+r0/2", "-r0/2"],
            "samplingMatrix": [["1", "0", "0"], ["1/4", str(-half_cross), str(square)], ["1/4", str(half_cross), str(square)]],
            "coefficientRatioBounds": ["1", str(c_bound), str(d_bound)], "localSecondXiFactor": str(second),
            "commonTorusInverseBeforeAllRowFactors": str(per_row), "referenceCases": choices,
            "fourier": "||N^-1 P_perp f||inf <= (85/6)||f||2 + (85/216)||L^2 f||2",
            "extraSlowDerivativesForCollocationAndInverse": 0}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("out", type=Path)
    args = parser.parse_args()
    inputs = read_inputs()
    result = {"status": "VERIFIED_ARCHIVED_N3_WZZ_SHAPE_CONDITIONAL_THREE_SAMPLE_TEMPORAL_INVERSE",
              "inputSHA256": {k: expected for k, (_, expected) in PINS.items()},
              "actual": check_source(inputs), "arithmetic": compare(inputs),
              "directPath": "Jz0 direct radial integral of R*Haar(Wzz) has no N inverse; through Z^2 T it uses only the corresponding Wzz slow derivatives.",
              "temporalPath": "The Wzz contribution to the desired gamma is -epsilon/ci0 N^-1 P_perp (partial_Z Wzz). Exact T1 realization adds its retained radial cutoff remainder, using the original Y translation.",
              "conditionalScope": "Original fixed-support charts, correct positive source class at the existing pure-slow orders, original flat extension and locally uniform source inverse estimates. Only this Wzz leg and its pre-Haar transfer are covered.",
              "open": ["Source cutoff mixed derivative caps and total radial/product bounds for the full gamma squares and weighted gr.",
                       "Other original pressure/Temporal source components, hosted later graph association and final jets."],
              "finalJets": "0/67", "release": "HOLD"}
    with args.out.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    print(result["status"])


if __name__ == "__main__":
    main()
