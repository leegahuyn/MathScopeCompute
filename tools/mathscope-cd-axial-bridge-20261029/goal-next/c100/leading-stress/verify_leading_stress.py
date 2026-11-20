"""Replay the original leading stress and bound its weighted physical C2 rows."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import runpy
import sys


BASE = Path("primary-forced-join/active-n3-c5-binding")
BAND = BASE / "first-wave-guard-traces"
BUDGET = BAND / "first-forced-budget"
PATHS = {
    "reader": (BASE / "spatial-readback/source_stream.py", "2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb"),
    "cache": (BASE / "live-wave-gauge/signed/source_cache.py", "909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f"),
    "exact": (Path("first-force-repair/verify_repaired_first_force.py"), "260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75"),
    "inner": (BUDGET / "inner-physical-gauge/source/inner-covariance.json", "8228b3442a46ee6e6843ed8212184d1f3fce56f331852096e78b156a6187ff61"),
    "outer": (BAND / "outer-normalized-amplitude/outer-scale.json", "71b6c139f15491aa0c625a25c91c32987a4f58038ccd97fdce9ea888a6e892aa"),
    "middle": (BUDGET / "middle-covariance/middle-coeff-log.json", "7b4283b548cf1139624f753657d30ab43cc97d2ce741ece4fd7e7616632c8986"),
    "transfer": (BUDGET / "global-covariance-join/selective-z8/selective-z8-covariance.json", "c4c57f2e2531d04da6b8c795c73c8e8322cd8fc118550a3f2165f10bfa55a9df"),
    "signed": (BUDGET / "signed-centered-flux/signed-pressure-flux.json", "8debc1a74134334ab4aa1cac81e8e3cadf550f839b64283881e2e405d5734942"),
}


def pin(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return data


class View:
    def __init__(self, stream):
        self.stream = stream

    def node(self, index):
        row = self.stream.record(index)
        return row["op"], row["args"]


def verify_source(stream, exact):
    radius, x, s, eta = 17743710, 17744284, 17732766, 17732775
    eps, scale = 17732744, 17732886
    assert stream.args(s, "actual_monotone_root") == [2, 17732749, 17732750]
    assert stream.args(eta, "multiply") == [17732749, 17732774]
    assert stream.args(17732774, "inverse") == [17732773]
    assert stream.args(17732773, "exp") == [17732772]
    assert stream.args(17732772, "multiply") == [22, 17732771]
    assert stream.args(scale, "exp") == [17732885]
    assert stream.args(17732885, "multiply") == [25246, 17732771]
    assert stream.args(25246, "multiply") == [20, 25245]
    assert stream.args(25245, "add") == [19, 23] and stream.args(23, "add") == [9, 19]
    assert stream.args(17732771, "log_positive") == [s]
    assert stream.args(19, "rational") == ["1", "2"]
    assert stream.args(20, "rational") == ["-1", "1"]
    assert stream.args(9, "source_parameter") == ["h"]
    assert stream.args(eps, "exp") == [17732743]
    assert stream.args(17732743, "multiply") == [9, 17732742]
    assert stream.args(17732742, "log_positive") == [17732740]
    assert stream.args(17732740, "exp") == [17732739]
    assert stream.args(17732739, "multiply") == [20, 17732738]
    assert stream.args(17732738, "multiply") == [127, 17732737]
    pol = exact.of
    assert pol(x) == exact.mul(exact.scalar(Fraction(1, 2)), exact.pow(pol(radius), 2), exact.inv(pol(s)))
    rows = []
    for raw, e, slot, value, derivative, higher in [
        (21999622, 2, 32017, 17744338, 17744315, [17744332, 17744336, 17744341]),
        (22000445, 1, 32018, 17744453, 17744430, [17744447, 17744451, 17744456]),
    ]:
        for node, orders in ((value, [0, 0]), (derivative, [1, 0])):
            assert stream.args(node, "actual_expression_partial") == [slot, [x, eta], orders]
        leading = {mon: c for mon, c in pol(raw).items()
                   if value in dict(mon) or derivative in dict(mon)}
        expected = exact.neg(exact.mul(pol(eps), pol(scale), exact.add(
            exact.mul(pol(radius), exact.inv(pol(s)), pol(derivative)),
            exact.mul(exact.scalar(e), exact.inv(pol(radius)), pol(value)))))
        assert len(leading) == 2 and leading == expected
        assert all(any(node in dict(mon) for mon in pol(raw)) for node in higher)
        rows.append({"E": raw, "radialPower": e, "activeSlot": slot, "value": value,
                     "derivative": derivative, "boundArgs": [x, eta], "remainingHigherValues": higher,
                     "verifiedLeadingDivergence": "-epsilon*s^(-A-1/2)*((R/s)*T0_X+e*T0/R)",
                     "localConservativeFlux": "-epsilon*R^e*s^(-A-1/2)*T0"})
    return rows


def check_envelope(reads):
    inner, outer, mid, higher, signed = (reads[name] for name in ("inner", "outer", "middle", "transfer", "signed"))
    main = inner["regions"]["inner"]
    assert main["openRange"] == ["0", "1/4"]
    assert main["targetFactorization"] == "Tbar=exp(-1/u^2)*s^(-A-1/2)*(#119712,#119713)"
    assert all(row["physicalSlowCap"] == "2^4096*Bnorm" for row in main["regularStressSlowRows"][:3])
    assert [row["activeSlot"] for row in inner["bindings"]["historicalMiddleComparisonToActiveT0"]] == [32017, 32018]
    assert outer["regularizedLiveTargetCaps"]["factorRetained"] == ["s^(-A-1/2)", "delta^6 in axial profile"]
    assert mid["middleTargetLogCap"] == "H/2^256"
    combined = next(value for value in higher.values()
                    if isinstance(value, dict) and "twoCollarPhysicalTargetUpper" in value)
    assert combined["order"] == 9 and combined["twoCollarPhysicalTargetUpper"] == "2^4096*Bnorm"
    assert combined["middleC9PhysicalTargetLogUpper"] == "Renv^1276"
    chart = signed["compactInitializedFiveMapAttachment"]["mixedRZTChartAndCutoffCoefficientBitsThrough7"]
    assert chart["sOrdinary"] == 85
    assert signed["finiteGaussianTransfer"]["complementInverseWeight"] == "< 2^7680"

    # R, its reciprocal and t1^-1 are bounded by the admitted radial envelope.
    # s >= 1/2, and |D^j log s| <= 2^174 through ordinary order two.
    assert 2 * 2**85 + 4 * 2**170 <= 2**174
    # For d and u the log-radius contributes at most 2*Renv^2, with one more
    # Renv factor on u. Constants and powers fit into Bnorm >= Renv^4096.
    assert 175 + 3 < 4096 and 4 + 2 < 4096
    rows = []
    for name, a, p, end, opposite in (
        ("inner", 1, 0, Fraction(1, 4), 8),
        ("outer", 4, 3, Fraction(1, 2), 2),
    ):
        first = 2*a + p*end**2
        second = 4*a*a + (4*p+6)*a*end**2 + p*(p+1)*end**4
        chain = opposite * max(1, first, first+second)
        assert chain < 2**12
        # One four-term product rule for the regular profile, and one for R^e.
        assert 4 * 4 * 2**12 * 2**4096 < 2**4120
        rows.append({"region": name, "poleCoordinate": "u" if name == "inner" else "d",
                     "overlapProfileUpper": str(end), "regularPhysicalCap": "2^4096*Bnorm",
                     "firstPolynomialCap": str(first), "secondPolynomialCap": str(second),
                     "oppositeGaussianReciprocalCap": opposite,
                     "poleByOrdinaryOrder": [p, p+3, p+6],
                     "epsilonZetaCoefficientCap": "2^4120*Bnorm^4"})
    assert 2 - Fraction(1, 128)*Fraction(1, 4) > Fraction(7, 4)
    assert 4 / Fraction(7, 4)**2 < 2
    assert (Fraction(1, 128)/Fraction(3, 2))**2 < Fraction(2, 3)
    # On the middle use the existing middle bound where both wide collars
    # have ended; use the regular profiles on the rest of the complement.
    # log B <= B, log 2 < 1, B >= 2^4096.
    assert 4120 + 5*9 + 4 < 8192
    assert 7680 + 2 < 8192
    assert 1276 < 4096 and 13 + 129 < 4096*510
    return {
        "orders": [[r, z, j-r-z] for j in range(3) for r in range(j+1) for z in range(j-r+1)],
        "chart": "X=R^2/(2s); u=log(X/Xa)/t1; d=log(Xb/X); epsilon fixed at each label",
        "collars": rows,
        "partition": ["0<u<=1/32", "0<d<=1/32", "u,d>1/32"],
        "intersectionProof": "width >=2 and t1<=1/128 exclude intersection of endpoint collars",
        "complement": {
            "gapRows": "use the same wide-collar bounds, with poles bounded by 32^9",
            "trueMiddle": "u>=1/4, d>=1/2 inside the pinned middle domain u>=1/8, d>=1/4",
            "epsilonZetaCoefficientLogCap": "H/2^128",
        },
        "endpoint": "Gaussian beats every fixed pole, so value and ordinary C2 jets extend by zero on each flat face.",
    }


def main():
    assert __debug__
    parser = ArgumentParser(description=__doc__)
    for name in ("goal", "artifact", "cache", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    reads = {}
    for key, (path, digest) in PATHS.items():
        data = pin(args.goal/path, digest)
        if path.suffix == ".json":
            reads[key] = json.loads(data)
    envelope = check_envelope(reads)
    sys.path[:0] = [str((args.goal/PATHS[key][0]).parent) for key in ("reader", "cache")]
    import source_stream
    import source_cache
    Exact = runpy.run_path(str(args.goal/PATHS["exact"][0]))["Exact"]
    folder = args.artifact/"first-correction-spatial-source"
    digest = "8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a"
    manifest = json.loads(pin(folder/source_stream.MANIFEST, digest))
    native = source_stream.Native(folder, manifest)
    assert native.pin == "e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03"
    stream = source_cache.load(source_stream, folder, manifest, 22153782, args.cache)
    try:
        assert stream.verify["nodes"] == 22155584
        assert stream.verify["sha256"] == "faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
        rows = verify_source(stream, Exact(View(stream)))
        result = {
            "status": "VERIFIED_ACTUAL_LEADING_SOURCE_CONDITIONAL_FULL_COLLAR_C2_DONOR",
            "inputs": {key: val[1] for key, val in PATHS.items()}, "source": stream.verify,
            "actualLeading": rows, "weightedLeadingC2": envelope,
            "premises": ["Original admitted fixed label and representative, same column, pulse and profile bounds",
                         "Same compact radial chart and operative real heat profile, inward at eta boundaries"],
            "open": ["Other stress arms and full weighted Sigma control", "M3 final energy, convergence and jets"],
            "finalJets": "0/67", "release": "HOLD",
        }
        args.out.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        print("Verified 4 leading original monomials from 22155584 pinned source nodes; conditional C2 donor in 3 regions.")
    finally:
        stream.__exit__()


if __name__ == "__main__":
    main()
