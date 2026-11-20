from argparse import ArgumentParser
from collections import Counter, defaultdict
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


AUDITS = {
    "primary": ("initial-mean-norm/primary/primary-quotient-ledger.json", "a72f12c82dd35106862cf6a874be1af79502a99d6de0e37e06db8794b66e5244"),
    "chart": ("first-forced-budget/native-mean-pressure/mean-pressure-enclosure.json", "3212a321563d65e5d7972cb7ab0c97f03f1ee0917276542a7a45074912fe34ff"),
    "global": ("first-forced-budget/global-covariance-join/global-primary-covariance.json", "05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e"),
    "radial": ("first-forced-budget/geometry/outer-forced-geometry.json", "e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291"),
    "matrix": ("outer-fixed-label-norm/matrix/matrix-s-j.json", "e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36"),
    "signed": ("first-forced-budget/signed-k1-frontier/signed-k1-frontier.json", "4ddef46553be2e296df327c513257e75085753f8a16e822ddcd16e105ad726c3"),
    "log": ("first-forced-budget/first-forced-log-budget.json", "904f3f665055f46ba49e96617e832216c39c9fe80a018382d29c38f6aec19d1c"),
    "band": ("first-forced-budget/outer-weight-comparison/outer-scalar-budget.json", "0d1e6635208ef369741a7073067b69e467608114495c03bb22c3575715d01873"),
    "physical": ("first-forced-budget/outer-physical-gauge/outer-forced-energy-slice.json", "a3c39cd72a19f6ab1d9354c0ea2d1db5d34897065b42ab0db4751f9e575d1ffd"),
}
SIGNED = ("signed/source-context/generic-signed-source-kernel.mjs", "15eea2c0f984c5b3bb58dd372d9b01660e44a85526c1f329b41b41855b4c27e2")
RUNTIME = {
    "actual-covariance-source-operator.mjs": "8de6b94b5819ec7b7cdbf8312de32e0c7f8556d9e2d78fa250542f1d6ee3b759",
    "actual-physical-full-curl.mjs": "539753a76375338653ff7420752270b600dc8c78893212ce541c47484b2f6454",
    "actual-common-band-physical-curl.mjs": "60001a58480274c646856bba803b62fd234db0f9bca33b9d81421963d19b5b70",
}


def pinned(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return data


def atom(name, index=0, r=0, z=0):
    return name, index, r, z


COS, SIN, PS, PC, KR, INV_R = map(atom, ("cosTheta", "sinTheta", "sinPhase", "cosPhase", "k", "invR"))
FAST, CUT, CHI, PSI = map(atom, ("fast", "fixedSlowCutoff", "chi", "psi"))


def monomial(*factors):
    return {tuple(sorted(factors)): 1}


def add(*pieces):
    out = defaultdict(int)
    for poly in pieces:
        for term, scalar in poly.items():
            out[term] += scalar
    return {term: scalar for term, scalar in out.items() if scalar}


def scale(poly, multiplier):
    return {term: scalar * multiplier for term, scalar in poly.items() if scalar * multiplier}


def derivative_atom(factor, axis):
    name, index, r, z = factor
    if factor in (PS, PC):
        normal = atom("normal", {"r":0, "theta":1, "z":2}[axis])
        return scale(monomial(KR, normal, PC if factor == PS else PS), 1 if factor == PS else -1)
    if axis == "theta":
        if factor == COS:
            return scale(monomial(INV_R, SIN), -1)
        if factor == SIN:
            return monomial(INV_R, COS)
        return {}
    if axis == "r" and factor == INV_R:
        return scale(monomial(INV_R, INV_R), -1)
    if name == "chi" and axis == "r":
        return monomial(FAST, atom(name, index, r + 1, 0))
    if name == "fast" and axis == "r":
        return monomial(atom(name, index, r + 1, z))
    if name in {"fixedSlowCutoff", "normal", "sigma", "core"}:
        if axis == "r":
            return monomial(atom(name, index, r + 1, z))
        return monomial(atom("epsilon"), atom(name, index, r, z + 1))
    return {}


def cylindrical(poly, axis):
    pieces = []
    for term, scalar in poly.items():
        for factor, count in Counter(term).items():
            rest = list(term)
            rest.remove(factor)
            pieces.append({tuple(sorted(tuple(rest) + new)): scalar * count * coefficient
                           for new, coefficient in derivative_atom(factor, axis).items()})
    return add(*pieces)


def multiplied(poly, factor):
    return {tuple(sorted(term + (factor,))): coefficient for term, coefficient in poly.items()}


def cartesian(poly, axis):
    if axis == "z":
        return cylindrical(poly, "z")
    radial, theta = cylindrical(poly, "r"), cylindrical(poly, "theta")
    if axis == "x":
        return add(multiplied(radial, COS), scale(multiplied(theta, SIN), -1))
    return add(multiplied(radial, SIN), multiplied(theta, COS))


def potential_words():
    components = [
        add(*(monomial(atom("core", 2*i+j), atom("sigma", j), CUT, CHI, PSI, PS)
              for j in range(2)))
        for i in range(3)
    ]
    roots = [add(multiplied(components[0], COS), scale(multiplied(components[1], SIN), -1)),
             add(multiplied(components[0], SIN), multiplied(components[1], COS)),
             components[2]]
    for component, root in zip("xyz", roots):
        yield component, "", root
        for i, first in enumerate("xyz"):
            d = cartesian(root, first)
            yield component, first, d
            for second in "xyz"[i:]:
                yield component, first+second, cartesian(d, second)


def same_source(root, runtime):
    data = {k:json.loads(pinned(root / file, digest)) for k,(file,digest) in AUDITS.items()}
    signed = pinned(root / SIGNED[0], SIGNED[1]).decode()
    rt = {k:pinned(runtime / k, digest).decode() for k,digest in RUNTIME.items()}
    assert all(fragment in signed for fragment in (
        "G.sqrt(eps),da,band.cutoffs.chi,band.cutoffs.psi,x",
        "weighted=amplitude.map(x=>G.mul(slowCutoff,x))",
        "rawPotential=cross(G,f.frame.n,weighted).map(x=>G.div(x,G.mul(k,f.frame.nSquared)))",
    ))
    assert "r0=q(1,1n<<34n)" in rt["actual-covariance-source-operator.mjs"]
    assert "meshCoordinates=[R,Z,T].map(x=>G.mul(G.pow(operator.geometry.ell,6),x))" in rt["actual-physical-full-curl.mjs"]
    physical = rt["actual-common-band-physical-curl.mjs"]
    assert "phaseGradient=[G.derivative(f.phase,map.coordinates.R),G.div(G.derivative(f.phase,map.coordinates.theta),map.coordinates.R),G.mul(epsilon,G.derivative(f.phase,map.coordinates.Z))]" in physical
    assert "G.mul(map.radialFast,G.derivative(x,xi))" in physical
    frontier = data["signed"]["originalSignedFrontier"]
    assert frontier["nativeSignedSigmaRoots"] == [22001223,22001224]
    assert frontier["signedPotentialBodies"] == [22001304,22001305,22001306,22001468,22001469,22001470]
    data["frontier"] = frontier
    return data


def geometry(data):
    primary = data["primary"]
    exact = primary["exactSameBody"]
    assert len(exact["tenCharts"]) == 10
    assert exact["fixedGeometry"]["transverseXiCutoff"] == 17733045
    assert exact["fixedGeometry"]["fastTimeCutoff"] == 17733057
    table = primary["weightedQuotientLedger"]["cutoffDerivativeConstants"]
    p0, p1, p2 = map(int, table["normalizedFixedLabelPartitionInDimensionlessOffset"][:3])
    assert p0 == 1
    chi = [int(v)*81**j*2**(34*j) for j,v in enumerate(table["bumpInDimensionlessOffset"][:3])]
    assert chi[0] == 1
    palette = data["global"]["sameLiveCovariance"]["coverMatrices"]
    assert [row["LxiUpper"] for row in palette] == [1,3,9,27,81]
    assert all(row["LvExact"] == 0 for row in palette)
    assert len(data["global"]["sameLiveCovariance"]["commonNativeSelector"]) == 3
    chart = data["chart"]["ordinaryGeometry"]
    s1, s2 = [chart["sTaylorBounds"][j]*w for j,w in [(1,1),(2,2)]]
    assert [s1,s2] == [16,33800]
    # On [1/2,2], d(log s)=ds/s, d²(log s)=d²s/s-(ds)^2/s².
    log_s1 = 2*2*s1
    log_s2 = 2*(2*s2+4*s1*s1)
    assert log_s1 <= 64 and log_s2 < 2**18
    # Slow cutoff: three mesh factors and one band factor. Each mesh
    # derivative costs S^3, with the band offset -log(s)/log(2).
    slow = [1, 4*64*p1, 4*(64**2*p2+2**18*p1) + 12*(64*p1)**2]
    radial = data["radial"]["conditionalCoefficientCaps"]["actualCoefficientProfiles"]
    for key in ("radialFast", "radialFastR"):
        assert radial[key]["envelopesBySlowOrder"][0] == [["0","-1/100000","0","1"]]
        assert radial[key]["everyPositiveLDerivativeAtFixedEndpointIsZero"]
    assert data["band"]["threshold"]["logSOverHUpperAsNegativePowerOfTwo"] == 32636
    assert data["log"]["logBudget"] == "H/2^109 for the field product and variation coefficient under the original source hypotheses"
    assert data["physical"]["componentsAndPhysicalDerivativesPerMode"] == 30
    assert data["physical"]["firstStagePotentialSlice"]["perDerivativeEpsilonLossAtMost"] == "1/2"
    old = data["signed"]["conditionalCoefficientTransfer"]
    assert old["coreSignedMultiplierRankSeries"] == [[163,71,8,11],[510,286,25,46],[859,501,42,81]]
    assert old["innerAndOuterHalfGaussianFiniteChargeBits"] == 168
    assert old["withInverseAndRadialDerivativesPoleAtMost"] == 70
    assert old["epsilonProductBeforeSigma"] == "epsilon^(1/2)*epsilon^(-1)*epsilon^(1/2)=epsilon^0"
    return slow, chi, old


def bound_words(data, slow, chi, old):
    n_table = data["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]["n"]
    def bound(factor):
        name, index, r, z = factor
        j = r+z
        if name == "fixedSlowCutoff":
            return (slow[j].bit_length(),0,0,0), 3*j, 0
        if name == "chi":
            assert z == 0
            return (chi[j].bit_length(),0,0,0), 0, 0
        if name == "fast":
            assert z == 0 and j<=1
            return (20,12,0,1), 0, Fraction(1,100000)
        if name == "normal":
            c, a, band = n_table[j]
            return (Fraction(c).__ceil__().bit_length(),6*a,0,a), band, 0
        if name == "core":
            return old["coreSignedMultiplierRankSeries"][j], Fraction(1,4)+2*j, 0
        if name == "sigma":
            return (0,0,0,0), 3*j, 0
        if name == "k":
            return (1,0,0,0), 0, Fraction(1,2)
        if name == "invR":
            return (1,1,0,0), 0, 0
        assert name in {"cosTheta","sinTheta","sinPhase","cosPhase","epsilon","psi"}
        return (0,0,0,0), 0, 0
    directions = set()
    rows = []
    cover = (2*3**4*4**4).bit_length()
    for component, word, poly in potential_words():
        rank_rows, powers, losses = [], [], []
        for term, scalar in poly.items():
            demands = [x for x in term if x[0] == "sigma"]
            target, = demands
            directions.add(target[2:])
            assert sum(target[2:]) <= len(word)
            factors = [bound(factor) for factor in term]
            rank = list(map(sum, zip(*(x[0] for x in factors),strict=True)))
            rank[0] += abs(scalar).bit_length()
            rank_rows.append(rank)
            powers.append(sum(x[1] for x in factors))
            losses.append(sum(x[2] for x in factors))
        degree = len(word)
        assert max(powers) <= Fraction(1,4)+3*degree
        assert max(losses) <= Fraction(degree,2)
        rank = list(map(max,zip(*rank_rows,strict=True)))
        rank[0] += len(poly).bit_length()+cover+old["innerAndOuterHalfGaussianFiniteChargeBits"]
        charge = Fraction(sum(rank),2**128) + max(powers)/2**32636
        assert sum(rank) < 2**16 and charge < Fraction(1,2**112)
        rows.append({"component":component, "word":word or "value",
                     "termCount":len(poly), "maxRawEpsilonLoss":str(max(losses)),
                     "maxBandPowerAboveSigmaIntercept":str(max(powers)),
                     "nonSigmaLogRanks":rank})
    assert directions == {(0,0),(1,0),(0,1),(2,0),(1,1),(0,2)}
    assert len(rows) == 30
    assert Fraction(1,2**109)+Fraction(1,2**112) < Fraction(1,2**108)
    return rows


def main(args):
    data = same_source(args.guards,args.runtime)
    slow, chi, old = geometry(data)
    rows = bound_words(data,slow,chi,old)
    result = {
        "schema":"MathScope.C102.SignedFixedGeometry/1",
        "sourceStatus":"VERIFIED_ORIGINAL_SIGNED_SOURCE_FACTORS_AND_SIX_SIGMA_SPATIAL_DIRECTIONS",
        "ordinaryStatus":"CONDITIONAL_ON_ORIGINAL_ADMITTED_FRAME_CORE_AND_WEIGHTED_SIGMA_INPUT",
        "inputs": {**{name:digest for name,(_,digest) in AUDITS.items()}, "Signed kernel":SIGNED[1], **RUNTIME},
        "originalSigma":data["frontier"]["nativeSignedSigmaRoots"],
        "sameOriginalCutoffNorms": {"slowAfterBandPowers":slow,"transverse81AtR0":chi,"spatialPsiDerivativesIdenticallyZero":True},
        "geometryConstants": {"bandOffsetFirstAndSecond":[64,2**18],"sourceR0":"2^-34","coverRows":162,
                              "radialFastAndR":"2^20 Bnorm^12 M eps^(-1/100000)"},
        "expandedPotentialWords":rows,"numPhysicalWords":len(rows),
        "sumLogRankMax":max(sum(row["nonSigmaLogRanks"]) for row in rows),
        "maxBandPowerAboveSigmaIntercept":"25/4",
        "nonSigmaLogCapAfterFiniteBand":"H/2^112",
        "sufficientSeparateSigmaCoefficientCap":"H/2^109",
        "sufficientSeparateSigmaEpsilonGrade":"30001/50000",
        "sufficientInputPoleAtMost":64,
        "unpaid":"Verified input budgets still require the uniform same-source Sigma two-component weighted envelopes and their ordinary path realizations.",
        "finalJets":0,"release":"HOLD",
    }
    args.out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8",newline="\n")
    print("PASS: 30 Signed physical words; original nonSigma geometry, carrier, palette and Gaussian charge < H/2^112")


if __name__ == "__main__":
    parser = ArgumentParser()
    for name in ("guards","runtime","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    main(parser.parse_args())
