"""Read original mixed-time Forced variation operands for the repeat value trace."""

from argparse import ArgumentParser
from hashlib import sha256
from itertools import product
import json
from math import comb
from pathlib import Path
import sys

from verify_radial_time_frontier import ORIGINAL_DIRECTIONS, T, free_coordinates


FRONTIER="c728ecb801c59bfdf3a60f5e79ca3b474616b80284464fbfe8f30419555ac6fc"
RADIAL_FAST=17735155
AXIAL_SCALE=17732744
L_SECOND=17733068
LS=17733029
E=(0,0,1,0,0)
SPATIAL_AXES=(0,1,3,4)


def stencil():
    mixed={tuple(x+int(i==j) for i,x in enumerate(E)) for j in SPATIAL_AXES}
    targets=sorted({E,*mixed},key=lambda row:(sum(row),row))
    union=set()
    rows=[]
    for alpha in targets:
        lower=sorted(product(*(range(x+1) for x in alpha)),key=lambda row:(sum(row),row))
        union.update(lower)
        block=[]
        for beta in lower:
            gamma=tuple(a-b for a,b in zip(alpha,beta,strict=True))
            weight=1
            for a,b in zip(alpha,beta,strict=True):
                weight*=comb(a,b)
            assert weight==1
            block.append({"stateOrder":beta,"coefficientOrder":gamma,"integerCoefficient":weight})
        assert len(block)==2**sum(alpha)
        rows.append({"forcingOrder":alpha,"coefficientProducts":block})
    assert len(targets)==5 and len(union)==10 and sum(x[2]>0 for x in union)==5
    return rows


def read(g,n,frontier):
    sets=free_coordinates(g)
    assert sorted(sets(RADIAL_FAST))==[17732737,17732748]
    assert sorted(sets(AXIAL_SCALE))==[17732737] and not sets(L_SECOND)
    assert sorted(sets(LS))==[17732737]
    assert g.args(L_SECOND,"add")==[1,17733067]
    assert g.args(17733067,"multiply")==[20,3622]
    [radical]=g.args(3622,"sqrt_positive")
    assert g.rational(radical)==2
    assert all(T not in sets(i) for i in (RADIAL_FAST,AXIAL_SCALE,L_SECOND,LS))
    assert all(T not in sets(i) for c in frontier["retainedPulseTimeDirections"] for i in c["fixedVXiLengthAndPullback"])
    rows=[]
    for row in frontier["retainedPulseTimeDirections"]:
        p=n.pulses[row["system"]]
        assert p["parameters"][:5]==p["directions"]==list(ORIGINAL_DIRECTIONS)
        assert p["left"]==0 and p["initial"]==[{"real":0,"imaginary":0}]*3 and p["length"]==LS
        assert row["retainedCoordinateSupportIncludingT"]=={"matrix":9,"forcing":6}
        rows.append({"chart":row["chart"],"harmonic":row["harmonic"],"nativeForcedSystem":p["id"],
                     "originalFormalArguments":p["parameters"],"originalPulseVariable":p["variable"],
                     "matrixCoefficientRoots":p["matrix"],"projectedForcingCoefficientRoots":p["forcing"]})
    assert len(rows)==20
    return rows


def main():
    cli=ArgumentParser(description=__doc__)
    for arg in ("work","goal","out"):
        cli.add_argument("--"+arg,type=Path,required=True)
    args=cli.parse_args()
    data=(Path(__file__).parent/"radial-time-frontier.json").read_bytes()
    assert sha256(data).hexdigest()==FRONTIER
    frontier=json.loads(data)
    c110=args.work/"continuation110/active-j2-full-source"
    scope=args.goal/"primary-forced-join/active-n3-c5-binding"
    reader=scope/"spatial-readback"
    cache_reader=scope/"live-wave-gauge/signed"
    sys.path[:0]=[str(c110),str(reader),str(cache_reader)]
    from verify_predecessor_cutoff_tails import PINS, pinned
    pinned(reader/"source_stream.py","reader")
    pinned(cache_reader/"source_cache.py","cacheReader")
    import source_stream as st
    from source_cache import load
    archive=args.work/"continuation70/hosted-44582875351/first-correction-spatial-source"
    manifest=json.loads(pinned(archive/st.MANIFEST,"manifest"))
    native=st.Native(archive,manifest)
    assert native.pin==PINS["registry"]==frontier["source"]["registrySHA256"]
    g=load(st,archive,manifest,22153782,args.work/"continuation80/signed-wave/cache")
    try:
        operands=read(g,native,frontier)
    finally:
        g.__exit__(None,None,None)
    rows=stencil()
    sizes={"nativeSystems":len(operands),"TOrdersPerSystem":len(rows),"nativeCoefficientOrderPairs":len(operands)*len(rows),
           "formalMatrixScalarRequests":len(operands)*len(rows)*9,
           "formalProjectedSourceScalarRequests":len(operands)*len(rows)*6}
    result={"schema":"MathScope.C114.OriginalForcedMixedTimeStencil/1",
            "status":"VERIFIED_ORIGINAL_COEFFICIENT_DEMANDS_WEIGHTED_TIME_ENVELOPES_OPEN",
            "radialTimeFrontierSHA256":FRONTIER,"sourceStreamSHA256":manifest["node_stream_sha256"],
            "orderedDirections":list(ORIGINAL_DIRECTIONS.values()),"fixedOrdinaryTimeCoefficients":{
                "radialFast":RADIAL_FAST,"epsilon":AXIAL_SCALE,"LSecondCoefficient":L_SECOND,"pulseLength":LS},
            "inheritance":"D_R=∂R+radialFast*L and D_Z=epsilon*∂Z commute with ∂T on these fixed original labels. L=∂Y0+(1-√2)∂Y1. The original psi(v) and fixed pulse endpoint also have zero T derivative. The actual normal, square norm inverse, forcing, matrix and phase derivatives remain.",
            "minimalCoordinateStencilForDirectPhysicalCurl":rows,"coefficientOperands":operands,"counts":sizes,
            "analyticAlternative":"Paired T and L estimates may pay the combined T,Y0 and T,Y1 direction instead of estimating each separately if the same original directional variation is proved.",
            "scope":"This stencil gives the first native time derivatives needed for the value trace. The actual waveform pressure and Signed quotient, higher aggregate ordinary traces, and complete second stage stay open.",
            "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print(result["status"],sizes)


if __name__=="__main__":
    assert __debug__
    main()
