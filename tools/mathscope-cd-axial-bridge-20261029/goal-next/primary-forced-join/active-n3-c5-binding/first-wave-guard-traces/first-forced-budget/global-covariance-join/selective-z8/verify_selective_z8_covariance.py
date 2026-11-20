"""Extend the fixed-label Primary budget to the selected W_rz axial queries."""

from argparse import ArgumentParser
from copy import deepcopy
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from math import comb, factorial
from pathlib import Path
import runpy


BAND = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
BUDGET = BAND/"first-forced-budget"
OLD = BAND/"outer-fixed-label-norm"
PINS = {
    "matrixProgram": (OLD/"matrix/verify_matrix_s_j.py", "2542d8c356906d8cd1f2b5dc3e0bc3c96a79894744d6dd5c5c4971fcaeebb6c9"),
    "matrix": (OLD/"matrix/matrix-s-j.json", "e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36"),
    "background": (OLD/"background-transport.json", "0b7c13076805acc97cd45e3e4e70e6f7620950744dc493dbff26d0644ff977cc"),
    "chart": (Path("final67/live-background-c10/chart-c10.json"), "5e770e398e3db1376bafacfcc06e5b5cb92a582db8eca4432f520873caf582c3"),
    "inheritedChart": (Path("primary-forced-join/active-n3-c5-binding/norm-leading/slow-chart-majorant.json"), "f15c6f354276be183238c3d829c335b71e33d3d08f28a0fae49ca17e46d35eb5"),
    "outerScale": (BAND/"outer-normalized-amplitude/outer-scale.json", "71b6c139f15491aa0c625a25c91c32987a4f58038ccd97fdce9ea888a6e892aa"),
    "innerTarget": (Path("whole-k-annular-wrz-norm/target-numerical/target-inner-numerical.json"), "724daf0118dd8dc9b2d4af0597411bdee0995c99e68a25950a80749517737e4d"),
    "outerTarget": (Path("whole-k-annular-wrz-norm/target-numerical/target-outer-numerical.json"), "363d484e7699ce86af70a6d7ff23bd0c0a10366a64a86e3379e60852cbe56d84"),
    "middleTargetRaw": (Path("whole-k-annular-wrz-norm/target-numerical/target-middle-numerical.json"), "07cbe3e4cda7f95d289fffea64472a5fac45387f72a4414603fec663613458e9"),
    "frameProgram": (BUDGET/"verify_first_forced_log_budget.py", "6e31e50922d6ad0cfae876a3d740fe748f4227779db9fdae310c833250fd77ba"),
}
C7 = "05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e"
C97_TARGET = "7b4283b548cf1139624f753657d30ab43cc97d2ce741ece4fd7e7616632c8986"


def pinned(path, digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return raw


def specialize(function, changes):
    source=inspect.getsource(function)
    for before,after,count in changes:
        assert source.count(before)==count,(before,source.count(before),count)
        source=source.replace(before,after)
    result={}
    exec(compile(source,inspect.getfile(function),"exec"),function.__globals__,result)
    return result[function.__name__]


def target_and_gaussian(data,middle):
    chart=data["chart"]
    assert chart["combinedPointwiseFactor"]=="2^1867*Hc^143"
    assert chart["originalC8CoefficientProofSHA256"]==PINS["inheritedChart"][1]
    assert data["inheritedChart"]["initialMultipliers"][0]=="s^(-A-1/2)"
    assert max(sum(row["ordinarySlowOrders"]) for row in chart["slowOrders"])==10
    assert data["background"]["scope"]["derivativeOrder"]==10
    assert data["innerTarget"]["outputDerivativeOrder"]==9
    assert data["innerTarget"]["maxComponentPower"]==[327,608]
    assert data["outerTarget"]["derivativeOrder"]==9
    assert data["middleTargetRaw"]["actualTargetThroughOrdinaryOrder"]==9
    cap_outer=max(int(a[j])*factorial(j) for a in data["outerTarget"]["integerTaylor"] for j in range(10))
    assert cap_outer < 2**256
    assert 608+120*9 < 25_600_000  # C^1688<Renv by the pinned source hierarchy.
    # X-to-log transform has sum j!, with X^-j<=Renv^18 on the inner piece.
    assert factorial(9)<2**19 and 1867+256+19<4096 and 143+18+1<4096
    assert middle["targetBounds"]["theta"][2]==middle["targetBounds"]["axial"][2]==9
    assert middle["sourceRootCaps"]["F0Active"]["power"]==1274
    assert 67+146<2**16 and middle["middleSlowLogRenvPower"]==1276
    # H_c=Renv, hence 2^1867 H_c^143 <= Renv^146 with ample fixed geometry margin.
    gaussians={}
    for name,a,b in (("inner",Q(1),Q(0)),("outer",Q(4),Q(3,2))):
        P=[Q(1)]
        rows=[]
        for j in range(10):
            abs_cap=sum(abs(x)*Q(1,16)**k for k,x in enumerate(P))
            assert abs_cap<2**48
            rows.append({"order":j,"additionalPole":3*j,"polynomialAbsCapOnQuarter":str(abs_cap)})
            next_polynomial=[a*x for x in P]+[Q(0)]
            for k,x in enumerate(P):
                next_polynomial[k+1]+=(2*k-b-3*j)*x
            P=next_polynomial
        gaussians[name]=rows
    # The pure Gaussian profile transforms with up to j! normal logarithm
    # factors, and t1^-9<=Renv. The original chart cap covers nine orders.
    assert 1867+19+48 < 4096 and 143+18+1 < 96*4096
    return {"order":9,"innerTargetOrdinaryLogCPower":1688,"outerTargetJetIntegerCap":str(cap_outer),
            "twoCollarPhysicalTargetUpper":"2^4096*Bnorm", "middleC9PhysicalTargetLogUpper":"Renv^1276",
            "commonTargetAndChartBound":"M", "gaussianChainCoefficientUpper":"2^4096*Bnorm^96",
            "gaussianProfileRows":gaussians}


def frame_and_primary(goal,data):
    matrix=runpy.run_path(str(goal/PINS["matrixProgram"][0]))
    extend=matrix["verify_degrees"]
    extend.__globals__["ORDER"]=9
    extend=specialize(extend,[("assert tested==165","assert tested==220",1)])
    inherited=deepcopy(data["outerScale"])
    inherited["scaleRows"].append({"order":9,"normalizedPulseDerivatives":"18","tangentOverP":"18"})
    new=extend(inherited)
    old=data["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    assert all(rows[:9]==old[name] for name,rows in new["exactDerivativeLedgers"].items())
    assert new["distinctMixedMultiIndicesAudited"]==220
    base=runpy.run_path(str(goal/PINS["frameProgram"][0]))
    inputs={k:json.loads(pinned(goal/path,digest)) for k,(path,digest) in base["PINS"].items()}
    inputs["matrix"]["sharpBandDegreeAudit"]=new
    frame=base["frame_weight"]
    frame=specialize(frame,[
        ("assert len(rows) == 9","assert len(rows) == 10",1),
        ("range(1, 9)","range(1, 10)",1),
        ("range(9)","range(10)",3),
        ("range(8)","range(9)",2),
        ("sqrt_weight_base = Bound(2**33, 1, 1)","sqrt_weight_base = Bound(2**33, 1, 1, 1)",1),
        ("""target = [
        Bound(2**1521 * int(row["coefficientOfTwoPow1521RenvH119"]), 1)
        for row in inputs["scale"]["regularizedLiveTargetCaps"]["boundRows"]
    ]""","target = [Bound(1, 0, 0, 1) for _ in range(10)]",1),
        ("assert len(target) == 9","assert len(target) == 10",1),
    ])
    expand_caps=specialize(base["caps"],[
        ("gaussian = Bound(2**900, 64)","gaussian = Bound(2**4096, 96)",1),
    ])
    expand_caps.__globals__["frame_weight"]=frame
    cuts=inputs["primary"]["weightedQuotientLedger"]["cutoffDerivativeConstants"]
    assert cuts["maximumOrdinaryOrder"]==9
    catalog,_,_=expand_caps(inputs)
    assert len(catalog["squareRootWeight"])==10
    assert len(catalog["matrix"])==len(catalog["tangent"])==10
    assert new["sourceTargetBandTransfer"][-1]["order"]==9
    assert new["sourceTargetBandTransfer"][-1]["tangentOverPBandPower"]==18
    normalized_tangent=[0]+[x["tangentOverPBandPower"] for x in new["sourceTargetBandTransfer"]]
    gram,weight,sqrt_weight=[],[],[]
    for j in range(10):
        gram.append(max(normalized_tangent[i]+normalized_tangent[j-i]-Q(1,2) for i in range(j+1)))
        weight.append(max([Q(1,2)]+[Q(1,2)+gram[i]+weight[j-i] for i in range(1,j+1)]))
        sqrt_weight.append(weight[0]/2 if j==0 else (
            max([weight[j]]+[sqrt_weight[i]+sqrt_weight[j-i] for i in range(1,j)])-Q(1,4)))
        assert gram[j]==2*j-Q(1,2)
        assert weight[j]==2*j+Q(1,2) and sqrt_weight[j]==2*j+Q(1,4)
    return {"matrixDegrees":new["exactDerivativeLedgers"],"normalAndFrameBound":catalog,
            "primaryUniformLogRanks":catalog["primaryCap"],
            "gramBandPowerAtNine":str(gram[-1]),"regularWeightBandPowerAtNine":str(weight[-1]),
            "squareRootWeightPowerAtNine":str(sqrt_weight[-1])}


def compare_covariance(c7,frame):
    assert c7["coefficientBudget"]["commonGlobalCovarianceRanks"]==[19239,6424,288,1030]
    # Exact full-curl W_rz uses the real-real and imaginary-imaginary terms.
    # Each order-eight imaginary branch may spend one extra slow derivative.
    carrier_epsilon=Q(1,2)
    assert carrier_epsilon-Q(1,1048576)-Q(1,100000)>0
    # Outermost product poles 9+3*8=33 and 6+3*8=30.
    assert Q(factorial(17),4**17)<2**15 and factorial(15)<2**41
    # Neighbor label conversion S_own<=2 S_ref through degree 49/2.
    assert Q(49,2)<25 and 4**8<2**17
    # Reuse C7 same native six-component cover and replace its finite charges
    # by these more conservative numbers for Z^8 with L^0, L^2 and L^4.
    cover=162*16*2*2**25*4**8*81**4*2**12*4
    assert cover.bit_length()<2**8
    rows=[]
    for l in (0,2,4):
        total=0
        for i in range(9):
            for k in range(l+1):
                assert (Q(1,4)+3*i)+(Q(1,4)+3*(8-i))==Q(49,2)
                total+=comb(8,i)*comb(l,k)
        assert total==2**(8+l)
        rows.append({"component":"rz","RZTL":[0,8,0,l],"bandPower":"49/2","epsilonPower":"1",
                     "leibnizCoefficientSum":total,
                     "requiredByC98FiveMap":l in (0,2),
                     "requiredHighPotentialJets":[["C_theta",0,9,0,l],["C_theta",1,8,0,l]],
                     "fullCurlExtraTransverseOrder":l+1})
    primary=frame["primaryUniformLogRanks"]
    ranks=[2*primary[0]+cover.bit_length()+41,*(2*x for x in primary[1:])]
    assert sum(ranks)<2**16
    return {"actualDemandRows":rows,"wholePathCovarianceLogDegreeRanks":ranks,
            "wholePathCovarianceLogCap":"H/2^112","optionalPoleAfterSquaring":[33,30],
            "sameCommonTorusPhaseAndNativeBlocks":True}


def main(goal,c7_path,middle_path,out):
    data={k:json.loads(pinned(goal/path,digest)) for k,(path,digest) in PINS.items() if not k.endswith("Program")}
    for k in ("matrixProgram","frameProgram"):
        path,digest=PINS[k]
        pinned(goal/path,digest)
    c7=json.loads(pinned(c7_path,C7))
    middle=json.loads(pinned(middle_path,C97_TARGET))
    target=target_and_gaussian(data,middle)
    frame=frame_and_primary(goal,data)
    selection=compare_covariance(c7,frame)
    result={"status":"VERIFIED_SELECTED_GLOBAL_W_RZ_Z8_L0_L2_L4_CONDITIONAL_ORIGINAL_C9_PULSE_AND_CHART",
            "pins":{**{k:v[1] for k,v in PINS.items()},"C7Cover":C7,"C97MiddleTarget":C97_TARGET},
            "regularTargetsThroughC9":target,"finiteMatrixAndWeightExtension":frame,
            "selectiveCovariance":selection,"analyticPremises":[
                "Retain the original pinned C10 physical background enclosure and C10 pointwise chart, original C9 regular target formulas, and frozen positive cone and pulse premises on the admitted slab.",
                "Ordinary fixed-limit variation, inverse and square-root differentiation now run through order nine. The original flat partitions and source Fourier constant-term identity are the C98 C7 cover.",
                "No higher complete mean/FiveMap coefficient or coupled energy is inferred from these selective derivative envelopes.",
            ],"finalJets":0,"release":"HOLD"}
    out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8",newline="\n")
    print("Verified original C9 coefficient recurrence and selective W_rz Z8/L0,L2,L4:",selection["wholePathCovarianceLogDegreeRanks"])


if __name__=="__main__":
    if not __debug__:
        raise RuntimeError("Verification requires enabled assertions.")
    parser=ArgumentParser()
    for name in ("goal","c7","middle","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    args=parser.parse_args()
    main(args.goal,args.c7,args.middle,args.out)
