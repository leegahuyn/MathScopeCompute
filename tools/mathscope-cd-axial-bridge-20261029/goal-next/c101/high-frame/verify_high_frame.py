"""Check the selected original high covariance derivative budgets through Primary C11."""

from argparse import ArgumentParser
from copy import deepcopy
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from math import comb, factorial, prod
from pathlib import Path
import runpy


BAND = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
BUDGET = BAND/"first-forced-budget"
PINNED = {
    "matrixSource": (BAND/"outer-fixed-label-norm/matrix/verify_matrix_s_j.py", "2542d8c356906d8cd1f2b5dc3e0bc3c96a79894744d6dd5c5c4971fcaeebb6c9"),
    "frameSource": (BUDGET/"verify_first_forced_log_budget.py", "6e31e50922d6ad0cfae876a3d740fe748f4227779db9fdae310c833250fd77ba"),
    "cutoffSource": (BAND/"initial-mean-norm/primary/verify_primary_quotient.py", "f54f5f4cecdbcb3fa6fe8297afba0d679b8b65c4aae62a852288ec616c09bb74"),
    "selectiveC8": (BUDGET/"global-covariance-join/selective-z8/selective-z8-covariance.json", "c4c57f2e2531d04da6b8c795c73c8e8322cd8fc118550a3f2165f10bfa55a9df"),
    "highCrop": (Path("c100/mode-one-high-crop/high-mean-crop.json"), "43ec151882813aca8c17f0048df8a250967e9a0f90ccca069746c196683658e2"),
}
WITNESS = "20399ca0d83b4565d5c9ef8189479fc80e0ac7fd808a1c63a70cabb1168dcf20"
INNER = "79c6471329316eeb52668dea299949866ff80f8d29ecebe34cac9a9d4cc44a0a"


def pin(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


def specialize(f, replacements):
    text = inspect.getsource(f)
    for old, new, count in replacements:
        assert text.count(old) == count, (old, text.count(old), count)
        text = text.replace(old, new)
    namespace = {}
    exec(compile(text, inspect.getfile(f), "exec"), f.__globals__, namespace)
    return namespace[f.__name__]


def matrix_and_frame(args, base, inputs, previous):
    program = runpy.run_path(str(args.goal/PINNED["matrixSource"][0]))
    function = program["verify_degrees"]
    function.__globals__["ORDER"] = 11
    function = specialize(function, [("assert tested==165", "assert tested==364", 1)])
    scale = deepcopy(inputs["scale"])
    scale["scaleRows"].extend({"order":j, "normalizedPulseDerivatives":str(2*j),
                               "tangentOverP":str(2*j)} for j in range(9,12))
    matrix = function(scale)
    inherited = previous["finiteMatrixAndWeightExtension"]["matrixDegrees"]
    rows = matrix["exactDerivativeLedgers"]
    assert all(entries[:10] == inherited[name] for name, entries in rows.items())
    assert matrix["distinctMixedMultiIndicesAudited"] == 364
    assert matrix["sourceTargetBandTransfer"][-1]["tangentOverPBandPower"] == 22
    inputs["matrix"]["sharpBandDegreeAudit"] = matrix
    frame = specialize(base["frame_weight"], [
        ("assert len(rows) == 9", "assert len(rows) == 12", 1),
        ("range(1, 9)", "range(1, 12)", 1),
        ("range(9)", "range(12)", 3),
        ("range(8)", "range(11)", 2),
        ("sqrt_weight_base = Bound(2**33, 1, 1)", "sqrt_weight_base = Bound(2**33, 1, 1, 1)", 1),
        ("""target = [
        Bound(2**1521 * int(row["coefficientOfTwoPow1521RenvH119"]), 1)
        for row in inputs["scale"]["regularizedLiveTargetCaps"]["boundRows"]
    ]""", "target = [Bound(1, 0, 0, 1) for _ in range(12)]", 1),
        ("assert len(target) == 9", "assert len(target) == 12", 1),
    ])
    catalog, sigma, tangent, potential, pressure = frame(inputs)
    old = previous["finiteMatrixAndWeightExtension"]["normalAndFrameBound"]
    for name in ("matrix", "basis", "state", "tangent", "tangentV", "gram", "weight", "squareRootWeight"):
        assert catalog[name][:len(old[name])] == old[name]
    normal = [0]+[v["tangentOverPBandPower"] for v in matrix["sourceTargetBandTransfer"]]
    gram, weight, root = [], [], []
    for j in range(12):
        gram.append(max(normal[k]+normal[j-k]-Q(1,2) for k in range(j+1)))
        weight.append(max([Q(1,2)]+[Q(1,2)+gram[k]+weight[j-k] for k in range(1,j+1)]))
        root.append(weight[0]/2 if j == 0 else
                    max([weight[j]]+[root[k]+root[j-k] for k in range(1,j)])-Q(1,4))
        assert gram[j] == 2*j-Q(1,2) and weight[j] == 2*j+Q(1,2) and root[j] == 2*j+Q(1,4)
    return matrix, catalog, [str(x) for x in (gram[-1],weight[-1],root[-1])], (sigma,tangent,potential,pressure)


def cutoff_and_gaussian(args, inputs, chart):
    program = runpy.run_path(str(args.goal/PINNED["cutoffSource"][0]))
    cutoff = specialize(program["cutoff_constants"], [("maximum=9", "maximum=15", 1)])()
    old = inputs["primary"]["weightedQuotientLedger"]["cutoffDerivativeConstants"]
    for name,value in old.items():
        if isinstance(value,list):
            assert cutoff[name][:len(value)] == value
    mesh = max(map(int,cutoff["normalizedFixedLabelPartitionInDimensionlessOffset"]))
    transverse = max(int(value)*2**(34*j) for j,value in enumerate(cutoff["bumpInDimensionlessOffset"]))
    longitudinal = max(map(int,cutoff["psiDerivativeCapBeforeLengthScale"]))
    assert max(mesh,transverse,longitudinal) < 2**1536
    assert chart["pointwiseCoefficientCap"] == "2^2699*Hc^195"
    assert 2699+factorial(13).bit_length()+80 < 8192
    assert 195+2*13+1 < 4096
    gaussian = {}
    for name, a, pole in (("inner", 1, Q(0)), ("outer", 4, Q(3,2))):
        pol = [Q(1)]
        rows = []
        for j in range(12):
            ceiling = sum(abs(c)*Q(1,16)**k for k,c in enumerate(pol))
            assert ceiling < 2**80
            rows.append({"order":j, "additionalPole":3*j, "polynomialCapOnQuarter":str(ceiling)})
            nxt = [a*c for c in pol]+[Q(0)]
            for k,c in enumerate(pol):
                nxt[k+1] += (2*k-pole-3*j)*c
            pol=nxt
        gaussian[name]=rows
    # C98's same normalized transverse direction and same fixed pulse length.
    constant = 2**(4096+100+60+33)*mesh**3*transverse*longitudinal
    return cutoff, gaussian, constant


def selected(previous, witness, cap):
    demand = [(name,tuple(rzl)) for name,rzl in previous["crop"]["remainingSufficientNewTemporalCovarianceRows"]]
    assert len(demand) == 8 and {rzl[1] for _,rzl in demand} == {8,9}
    assert witness["originalMomentShape"]["variationFirstOrders"] == {"psi":8, "beta":7, "gamma":8}
    demand.extend(("W_rz",(0,10,l)) for l in (0,2))
    rows = []
    for name,(r,z,l) in sorted(demand):
        assert r == 0 and l in (0,2)
        words = 0
        for j in range(z+1):
            for k in range(l+1):
                assert (Q(1,4)+3*j)+(Q(1,4)+3*(z-j)) == Q(1,2)+3*z
                words += comb(z,j)*comb(l,k)
        assert words == 2**(z+l)
        outer,inner = 9+3*z,6+3*z
        eo,ei = (outer+1)//2,(inner+1)//2
        assert Q(factorial(eo),4**eo)<2**23 and factorial(ei)<2**54
        band=Q(1,2)+3*z
        # 162 common-torus summands, same label boxes and same Fourier cover.
        cover=prod([162,16,2,2**(band.__ceil__()),4**z,81**l,words,4])
        ranks=[2*cap[0]+cover.bit_length()+54,*(2*x for x in cap[1:])]
        assert sum(ranks) < 2**16
        rows.append({"component":name, "RZL":[r,z,l], "epsilonGrade":"1","bandPower":str(band),
                     "primaryMaximumSlowOrder":z+1, "potentialMaximumTransverseOrder":l+1,
                     "outerAndInnerPoles":[outer,inner], "exactLeibnizSum":words,
                     "logDegreeRanks":ranks, "coefficientLogCap":"H/2^112"})
    return rows


def main(args):
    assert __debug__
    received = {key:pin(args.goal/path,digest) for key,(path,digest) in PINNED.items()}
    base = runpy.run_path(str(args.goal/PINNED["frameSource"][0]))
    inputs={key:json.loads(pin(args.goal/path,digest)) for key,(path,digest) in base["PINS"].items()}
    earlier=json.loads(received["selectiveC8"])
    chart=json.loads(pin(args.chart,"2b67932e63182154d7f529d767c77180b7de458d4c049da2eb6c7fabdb4df337"))
    assert chart["totalDirections"] == 455 and chart["kernelSHA256"] == "384daafdcb5cad2e57b4bbb0440bc4b2e4a5912b4835e2d7510c21301a44ff15"
    inner=json.loads(pin(args.inner,INNER))
    witness=json.loads(pin(args.witness,WITNESS))
    matrix,catalog,band,values=matrix_and_frame(args,base,inputs,earlier)
    cuts,gaussian,constant=cutoff_and_gaussian(args,inputs,chart)
    Bound=base["Bound"]
    sigma,tangent,potential,pressure=values
    amplitude=Bound(2)*sigma*tangent*Bound(constant,1)*Bound(2**8192,128)
    primary=Bound(2**32)*Bound(2**60,10)*amplitude*(Bound(1)+potential+pressure)
    grade=Q(1,2)-Q(1,1048576)-Q(1,100000)
    assert grade>0
    rows=selected(json.loads(received["highCrop"]),witness,primary.log_degrees())
    result = {
        "schema":"MathScope.C101.OriginalHighFrameAndSelectiveCovarianceBudget/1",
        "status":"VERIFIED_NATIVE_RECURRENCES_AND_CONDITIONAL_SELECTED_COVARIANCE_CAP",
        "pins":{**{k:v[1] for k,v in PINNED.items()},"inner":INNER,"witness":WITNESS,
                "chart":sha256(args.chart.read_bytes()).hexdigest()},
        "frame":{"auditedDirections":matrix["distinctMixedMultiIndicesAudited"],
                 "sourceNormalizedTangentBand":22,"gramWeightSquareRootBandAtEleven":band,
                 "coefficientRanks":catalog},
        "cutoff":{"maximumOrder":cuts["maximumOrdinaryOrder"],"lastPartitionBits":int(cuts["normalizedFixedLabelPartitionInDimensionlessOffset"][-1]).bit_length(),
                  "sourceSigmaBounds":[str(x) for x in cuts["sigma2DerivativeBounds"]]},
        "gaussianChain":{"standaloneCoefficient":"2^8192*Bnorm^128","polynomials":gaussian},
        "primaryUniformLogRanks":primary.log_degrees(),"selectedRows":rows,
        "sameSourceInnerTargetStatus":inner["status"],
        "premises":["Original selected same-label positive Gram, stable pulse and real collar support",
                    "Ordinary original F/G background through order 12 and regular target through 11",
                    "Common original radial and auxiliary charts with Renv dominating t1^-13",
                    "The H-normalized coefficient bound retains the original W and M ceilings"],
        "open":["Whole-label physical background C11/C12 and matching outer/middle high target",
                "Original higher Temporal/FiveMap upper bounds and complete Signed stage"],
        "finalJets":"0/67","release":"HOLD",
    }
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS C11 frame, C15 cutoff, 10 selected covariance rows conditional on original high source donors",
          primary.log_degrees())


if __name__ == "__main__":
    cli=ArgumentParser(description=__doc__)
    for key in ("goal","chart","inner","witness","out"):
        cli.add_argument("--"+key,type=Path,required=True)
    main(cli.parse_args())
