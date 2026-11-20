"""Trace the exact original Sigma arithmetic for the two mixed-time demands."""

from argparse import ArgumentParser
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import runpy


PINS={
    "arithmetic":"f0dff0510af992c4f54115fcfb62daf4ea78bea9d77a8c8f54b2221b2ff4f6b8",
    "pure":"b128b6131412a2aef44c6a945b00ca03b38c04308a57c141e03476ea82d5c796",
    "modeOne":"d054f016d52aaba3159f82954e20ef693cb1d1d64557bed42d96cde9c9ac9965",
    "modeTwo":"188d2db5d5b9b860bb4826d4d2da056ea93ac0273ec870f00a36adf20f484e7a",
    "compact":"3ec640563531208b18f019167174e7c39db1c744e937f834d313eeefafd86e14",
    "noncompact":"75dae2662614f581f41ac7db09fe41dc01a0fed81cf7e0853f1fcfc3be5e4126",
    "localStress":"3ec60e03a9ae128ed546bc67256692ed2241e76be3261b8618761264ebcb9dd5",
}
MEAN_PAIRS={
    "rr":("beta","beta"),"rtheta":("beta","v"),"rz":("beta","gamma"),
    "thetatheta":("v","v"),"thetaz":("v","gamma"),"zz":("gamma","gamma"),
}
REGIONS=("inner","outer","middle")


def read(path,key):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],path
    return raw


class FormalCarrier:
    """Return the same neutral carrier while recording the formal operand key."""
    def __init__(self,value):
        self.value=value
        self.keys=set()

    def __contains__(self,key):
        return True

    def __getitem__(self,key):
        self.keys.add(key)
        return self.value


class MeanProducts:
    def __init__(self,split):
        self.split=split

    def __contains__(self,key):
        return True

    def __getitem__(self,key):
        tag,order=key
        left,right=MEAN_PAIRS[tag]
        assert order[3]==0
        return [(left,(*beta,0),right,(*gamma,0),k) for beta,gamma,k in self.split(order[:3])]


def case(ops,region,order):
    compact=FormalCarrier({"minEpsilon":"0","bandIntercept":"0"})
    p={r:(None,FormalCarrier({"epsilon":"0","band":"0"}),0) for r in ("inner","outer")}
    cov=FormalCarrier(ops["Bound"](0,0,0,1))
    downward=[list(x) for x in product(*(range(n+1) for n in order))]
    demand={"weightedSigmaSpatialOrders":[list(order)],"localWeightedRadialFlux":downward}
    # The pinned arithmetic always traverses the original demand. The
    # neutral carriers exist solely to collect requests. Discard the
    # computed Bound rows and use no resulting numerical amount.
    _,trace=ops["arithmetic"]({},demand,compact,MeanProducts(ops["splits"]),p,cov,region)
    assert set(trace["covariance"])==cov.keys
    compact_plan={key for key in compact.keys}
    noncompact_plan=set()
    if region in p:
        for field,alpha in p[region][1].keys:
            a,b=MEAN_PAIRS[field]
            for beta,gamma,_ in ops["splits"](alpha):
                noncompact_plan.update(((a,(*beta,0)),(b,(*gamma,0))))
    return trace,compact_plan,noncompact_plan


def gauge_required(orders):
    result=set()
    for a in orders:
        for r,z,t in product(*(range(n+1) for n in a)):
            result.update(((r,z,t,0),(r+1,z,t,0),(r,z+1,t,0),(r,z,t,1)))
    return result


def main():
    cli=ArgumentParser(description=__doc__)
    for arg in ("work","goal","out"):
        cli.add_argument("--"+arg,type=Path,required=True)
    args=cli.parse_args()
    code=args.work/"continuation108/early-sigma-c6/final/verify_sigma_c6.py"
    raw=read(code,"arithmetic")
    assert b"return fields[name]((r-1,z,t))" in raw
    assert b"return add(local,t,z,correction)" in raw
    ops=runpy.run_path(str(code))
    p=json.loads(read(args.work/"continuation118/pure-sigma-time-join/pure-sigma-time.json","pure"))
    c1=json.loads(read(args.work/"continuation118/mode-one-signed-time/final/mode-one-signed-time.json","modeOne"))
    c2=json.loads(read(args.goal/"c116/mode-two-signed-time/mode-two-signed-time.json","modeTwo"))
    compact=json.loads(read(args.goal/"c116/mean-time-operands/mean-time-operands.json","compact"))
    noncompact=json.loads(read(args.goal/"c117/noncompact-temporal-mixed/noncompact-temporal-mixed.json","noncompact"))
    stress=json.loads(read(args.goal/"c117/signed-local-stress-time/signed-local-time-stress.json","localStress"))
    assert p["actualNativeSigma"]==[22001223,22001224] and stress["sourceResiduals"]==[21999622,22000445]
    assert p["pins"]["modeOne"]==PINS["modeOne"] and p["pins"]["modeTwo"]==PINS["modeTwo"]
    cov1={tuple(row["RZTL"][:3]) for row in c1["covarianceRows"]}
    cov2={tuple(row["RZTL"][:3]) for row in c2["covarianceRowsAllSixTensorComponents"]}
    available_compact={(field,tuple(direction)) for field,direction,row in compact["temporalMeanRows"]}
    ranges=[]
    for region in REGIONS:
        pure,_,_=case(ops,region,(0,0,1))
        assert json.loads(json.dumps(pure))==p["physicalDirections"][region]["typedSourceTrace"]
        gauge1={tuple(r["RZTL"]) for r in c1["threeRegionGauges"][region]["rows"]}
        gauge2={tuple(r["RZTL"]) for r in c2["gaugeRows"]}
        background_available=({(r["field"],tuple(r["RZTL"])) for r in noncompact[region]} if region!="middle" else set())
        for name,order in (("RT",(1,0,1)),("ZT",(0,1,1))):
            full,compact_plan,noncompact_plan=case(ops,region,order)
            new={kind:sorted(set(items)-set(pure[kind])) for kind,items in full.items()}
            want={tuple(v) for _,v in full["covariance"]}
            gauges=gauge_required(want)
            ranges.append({"region":region,"direction":name,"order":order,"exactNewTypedOperands":new,
                           "missingAttachedModeOneCovarianceDirections":sorted(want-cov1),
                           "missingAttachedModeTwoCovarianceDirections":sorted(want-cov2),
                           "uncoveredDirectModeOneGaugeDirectionsBeforeAnyCancellation":sorted(gauges-gauge1),
                           "uncoveredDirectModeTwoGaugeDirectionsBeforeAnyCancellation":sorted(gauge_required(want-cov2)-gauge2),
                           "uncoveredC116CompactMeanRows":sorted(compact_plan-available_compact),
                           "uncoveredC117NoncompactMeanRows":sorted(noncompact_plan-background_available)})
    assert len(ranges)==6
    rt,zt=ranges[:2]
    assert rt["exactNewTypedOperands"]["covariance"]==[("rtheta",(1,0,1)),("rz",(1,0,1))]
    assert rt["missingAttachedModeOneCovarianceDirections"]==[(1,0,1)]
    assert not rt["missingAttachedModeTwoCovarianceDirections"]
    assert (0,3,1) in zt["missingAttachedModeOneCovarianceDirections"] and (0,3,1) in zt["missingAttachedModeTwoCovarianceDirections"]
    assert (0,3,0) in ranges[-1]["missingAttachedModeOneCovarianceDirections"]
    result={"schema":"MathScope.C119.OriginalMixedSignedSigmaDemandAfterFTC/1",
            "status":"VERIFIED_EXACT_TYPED_DEPENDENCY_TRACE_NUMERICAL_MIXED_DONORS_OPEN",
            "nativeSigmaRoots":p["actualNativeSigma"],"pins":PINS,"cases":ranges,"pureTimeTraceReproducedInAllRegions":True,
            "radialFTC":"The derivative of a short Tchi primitive queries the integrand at one lower R order. The local radial flux is still differentiated in R,T. The middle carries original cutoff and density whole-moment correction.",
            "open":"Exact weighted same-source values for the uncovered operands or an independent source regrouping proving the needed aggregate cancellation.",
            "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print(result["status"],len(ranges))


if __name__=="__main__":
    assert __debug__
    main()
