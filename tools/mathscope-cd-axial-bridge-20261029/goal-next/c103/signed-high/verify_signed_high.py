"""Transfer the original fixed Signed multiplier along the C103 slow requests."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path
import runpy


BAND = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
STAGE = BAND / "first-forced-budget"
PINS = {
    "frame": "5c66c394ca8ae4bf1d347628d4045e8aaf402b0e1895413b8f0ac5a829698603",
    "matrix": "e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36",
    "low": "4ddef46553be2e296df327c513257e75085753f8a16e822ddcd16e105ad726c3",
    "rankArithmetic": "911f9ce95ca23f90d42346b157fc824b8c21101bf17122e374793a1ebc85871c",
    "late": "1e6bea833b88a440caefeccb59ad58466e06b8f9ae95d0d699e7f44172c09e5b",
    "signed": "15eea2c0f984c5b3bb58dd372d9b01660e44a85526c1f329b41b41855b4c27e2",
    "inverse": "df6f10cda4c77b0b679ded7eb254979e528d133239b2da1ce0904479585d2116",
    "curl": "4276a850dbff4b5c357c47e1827eb7785b19c7e7c395c94ee4f22ef0c96d58d2",
    "indexed": "973136acf1571a75a307e374576ec8dbbe0340c19e90ee327373df7638100bec",
    "covarianceOperator": "8de6b94b5819ec7b7cdbf8312de32e0c7f8556d9e2d78fa250542f1d6ee3b759",
}


def pinned(name, path):
    content = path.read_bytes()
    assert sha256(content).hexdigest() == PINS[name], (name, path)
    return content


def source(args):
    m2, m3 = [args.runtime / "research-ide" / name / "navier"
              for name in ("mathscope-m2", "mathscope-m3")]
    files = {
        "signed": m3 / "generic-signed-source-kernel.mjs",
        "inverse": m2 / "actual-physical-residual-algebra.mjs",
        "curl": m2 / "actual-full-curl.mjs",
        "indexed": m3 / "generic-signed-162-indexed.mjs",
        "covarianceOperator": m2 / "actual-covariance-source-operator.mjs",
    }
    fragments = {
        "signed": ("G.sqrt(eps),da,band.cutoffs.chi,band.cutoffs.psi,x",
                   "weighted=amplitude.map(x=>G.mul(slowCutoff,x))",
                   "rawPotential=cross(G,f.frame.n,weighted).map(x=>G.div(x,G.mul(k,f.frame.nSquared)))"),
        "inverse": ("rhs=Sigma.map(x=>G.div(x,epsilon))",
                    "deltaAmplitude=dSigma.map((x,j)=>G.div(x,G.mul(G.q(2),a[j])))"),
        "curl": ("Dz=x=>G.mul(epsilon,G.derivative(x,Z))",
                 "remainder=[G.neg(axialDerivatives[1]),G.sub(axialDerivatives[0],radialDerivatives[2]),G.add(radialDerivatives[1],G.mul(ir,C[1]))]"),
        "indexed": ("rows[t.signIndex],half=G.q(1,2)",
                    "G.mul(half,lift(row.curl.leading[j])),G.mul(half,lift(row.curl.remainder[j]))",
                    "velocity:velocity.map(z=>C.conjugate(z))"),
        "covarianceOperator": ("k=G.ceiling(G.inv(G.sqrt(epsilon)))",),
    }
    for name, path in files.items():
        body = pinned(name, path).decode()
        assert all(item in body for item in fragments[name]), name


def transfer(args, directions):
    frame = json.loads(pinned("frame", args.goal / "c101/high-frame/high-frame.json"))
    matrix = json.loads(pinned("matrix", args.goal / BAND / "outer-fixed-label-norm/matrix/matrix-s-j.json"))
    low = json.loads(pinned("low", args.goal / STAGE / "signed-k1-frontier/signed-k1-frontier.json"))
    arithmetic = args.goal / STAGE / "signed-k1-frontier/verify_signed_k1_frontier.py"
    pinned("rankArithmetic", arithmetic)
    rec = runpy.run_path(str(arithmetic))
    product, inverse, scalar = (rec[name] for name in
                                 ("differential_product", "differential_inverse", "scalar"))
    catalogue = frame["frame"]["coefficientRanks"]
    maximum = max(map(sum, directions))
    assert maximum == 6
    gram = inverse(catalogue["gram"], tuple(catalogue["gramInverse"]), maximum)
    square_root = inverse(catalogue["squareRootWeight"], (17, 1, 1, 0), maximum)
    table = matrix["sharpBandDegreeAudit"]["exactDerivativeLedgers"]

    def rows(name):
        assert len(table[name]) > maximum
        return [scalar(Q(c).__ceil__(), (0, 6*a, 0, a))
                for c, a, _ in table[name][:maximum+1]]

    normal = product(rows("n"), rows("inverseNormalSquared"), maximum)
    core = product(product(gram, square_root, maximum), catalogue["tangent"], maximum)
    core = product(core, normal, maximum)
    baseline = low["conditionalCoefficientTransfer"]
    for key, result in (("HInverseCoefficientRankSeries", gram),
                        ("regularSquareRootReciprocalCoefficientRankSeries", square_root),
                        ("coreSignedMultiplierRankSeries", core)):
        assert list(map(list, result[:3])) == baseline[key], key

    checked = []
    for r, z in directions:
        degree = r + z
        for i in range(degree+1):
            # Collapse the mixed Leibniz sum into the Cj majorant.
            assert sum(comb(r, a) * comb(z, i-a) for a in range(r+1)
                       if 0 <= i-a <= z) == comb(degree, i)
        # Two coordinates in each cross-product entry and two target entries.
        rank = [core[degree][0]+2, *core[degree][1:]]
        band_power = Q(1, 4) + 2*degree
        assert Q(sum(rank), 2**128) + band_power / 2**32636 < Q(1, 2**112)
        checked.append({"RZ": [r,z], "logRanks": rank, "bandPower": str(band_power)})

    assert Q(1, 2) - 1 + Q(1, 2) == 0
    return {"requests": checked, "HInverseLogRanks": gram,
            "inverseSquareRootLogRanks": square_root,
            "oldOrders0Through2Reproduced": True,
            "conditionalCoreLogOverH": "2^-112",
            "rankChargeHypotheses": "log(2), log(Bnorm), log(Wprop), log(M) <= H/2^128; log(S) <= H/2^32636.",
            "scope": "Slow R,Z derivatives of the normalized core after factoring out the slow cutoff, chi and psi, with the original normalized frame and positive inverse/weight premises.",
            "epsilon": "sqrt(eps) * eps^-1 / ceil(eps^-1/2) <= 1, with no slow derivative of the fixed carrier."}


def principal_witness():
    # A real full-curl harmonic has Fourier coefficients (uRe ± i*uIm)/2.
    # Convolving the two opposite modes gives the imaginary product weight 1/2.
    half = Q(1, 2)
    imaginary_weight = 2*half*half

    # For Ctheta = q(R,Z,xi,L)*sigma(R,Z), the only contribution to
    # sigma_{Z^6}*sigma_R from dZ^5(urIm*uzIm) is the k=5 Leibniz split.
    matching = [i for i in range(6) if i+1 == 6 and 5-i == 0]
    assert matching == [5]
    coefficient = -imaginary_weight * comb(5, matching[0])

    # Local operator witness at R=1 with q=1. The input Taylor coefficients
    # in Z give the ordinary jets after multiplying by factorials.
    def observed_covariance(sigma):
        imaginary_r = [-(j+1)*sigma[j+1] for j in range(6)]  # Divide by epsilon.
        imaginary_z = [sigma[j]+int(j==0) for j in range(6)]  # (dR + 1/R) sigma.
        product = sum(imaginary_r[j]*imaginary_z[5-j] for j in range(6))
        return imaginary_weight*factorial(5)*product

    baseline = [Q(0)]*7
    perturbed = [*baseline[:6], Q(1, factorial(6))]
    assert baseline[:6] == perturbed[:6]
    assert observed_covariance(perturbed) - observed_covariance(baseline) == coefficient == Q(-1,2)
    return {"generalTerm": "-epsilon*q^2*D_Z^6(sigma)*D_R(sigma)/2 in D_Z^5(W_rz) for a single paired harmonic",
            "highestRealTerm": "The leading full curl has no derivative of sigma.",
            "weight": str(imaginary_weight), "coefficientAfterRemovingEpsilonAndQSquared": str(coefficient),
            "operatorWitness": "At (R,Z)=(1,0), q=1, changing sigma from R-1 to R-1+Z^6/6! changes D_Z^5(W_rz) by -epsilon/2.",
            "scope": "The paired full-curl operator distinguishes these test jets. No nonzero value is asserted for the native Sigma, its cover sum, or its Haar transform."}


def main(args):
    source(args)
    late = json.loads(pinned("late", args.late))
    demand = late["demand"]
    assert demand["highestPostSignedCovarianceRows"] == [["rz",[0,5,0,0]],["rz",[0,5,0,2]]]
    directions = demand["sufficientPreviousSignedSigmaDirectionsRZ"]
    assert len(directions) == 18
    assert [r for r in directions if sum(r)>2] == demand["sufficientPreviousSignedSigmaDirectionsAboveC2"]
    result = {"schema": "MathScope.C103.SignedHighCore/1", "status": "CONDITIONAL",
              "pins": PINS, "transfer": transfer(args, directions), "operator": principal_witness(),
              "open": ["Native Sigma bounds for the twelve new directions",
                       "High cutoff product, seam extension, and full late covariance bound"],
              "finalJets": 0, "release": "HOLD"}
    args.out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8", newline="\n")
    print("18 slow mixed core requests through C6; exact low recurrence and full-curl local witness passed")


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    for name in ("goal", "runtime", "late", "out"):
        parser.add_argument("--"+name, required=True, type=Path)
    main(parser.parse_args())
