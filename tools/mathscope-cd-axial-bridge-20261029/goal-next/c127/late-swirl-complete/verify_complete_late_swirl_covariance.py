"""Finish the 16 original late-swirl covariance rows with independently bound Sigma_RRT."""
import argparse
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path
import runpy

REL="continuation127/late-swirl-covariance/"
PINS={"program":"26e40a6201647e3d8005c57b9bee58720082f6c848a2bc441d6847e529ee0923",
      "pre":"0efb18ed928286bb7a21683dffcc6a6979f5e6008de19f78c52ecf19bca7efe9",
      "coverage":"df14af42b160413ebc3f9786136bedab485a4ceb5cd0784bae817847f6184988"}


def read(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return json.loads(raw) if path.suffix==".json" else raw


def rrt_limit(source):
    roots=source.get("nativeSigmaRoots",source.get("roots"))
    assert roots[:2]==[22001223,22001224]
    pressure=source.get("actualIncrementalPressureZ",source.get("pressureRoot"))
    assert pressure==22000443
    endpoints=source.get("sourceEndpoints",source.get("fixedEndpoints"))
    assert endpoints==[17743711,17743713]
    common=source["common"]
    eps,band=Q(common["epsilon"]),Q(common["band"])
    rank=common.get("logCoefficientUnitsHOver2Pow128",common.get("coefficientInHOver2Pow128"))
    pole=common.get("pole",common.get("collarPole"))
    assert eps>=1 and common["gaussian"]=="zeta"
    assert band<=Q(131,2) and pole<=48 and rank<2**20
    return band,pole,rank


def main(a):
    root=a.work/REL
    program=root/"verify_late_swirl_covariance.py"
    read(program,PINS["program"])
    base=runpy.run_path(str(program))
    frozen=read(root/"late-swirl-covariance.json",PINS["coverage"])
    pre=read(root/"pre-signed-late-swirl.json",PINS["pre"])
    d,paths=base["load"](a.work,a.goal)
    post=d["postProgram"]["load"](a.work,a.goal)
    source=d["postProgram"]["bound_sources"](post)
    assert source==frozen["source"]
    asks,prior,new_force,transfer,postponed=base["split_roles"](d,post)
    assert len(prior)+len(transfer)+len(postponed)==len(asks)==16
    if not a.sigma:
        assert not a.sigma_sha
        return {"schema":"MathScope.C127.OriginalLateTemporalSwirlCompleteCovariance/1",
                "status":"OPEN_NEEDS_INDEPENDENT_SIGMA_RRT_RECEIPT","missing":[2,0,1],"finalJets":0,"release":"HOLD"}
    assert a.sigma_sha=="e59a7141b801536964f6991ff99a38112e4a997cd29a3a25fe3807566fdfec3c"
    sigma_source=read(a.sigma,a.sigma_sha)
    assert sigma_source["targetsRZT"]==[[2,0,1]]
    rrt=rrt_limit(sigma_source)
    post={**post,"pre":pre}
    pro=d["postProgram"]
    targets=tuple(sorted(j for _,j in postponed))
    directions={b for a in targets for b in base["down"](a)}
    deps={(j,b):sorted({base["plus"](v,w) for v in base["down"](b)
                        for w in base["CURL_OFFSETS"][f]})
          for b in directions for j,f in ((1,"r"),(2,"theta"))}
    assert max(sum(g[:3]) for values in deps.values() for g in values)==3
    assert max(g[3] for values in deps.values() for g in values)==3
    attach=base["adapt"](pro["signed_gauge_caps"],[
        ("sigma=sigma_hulls(d)","sigma={**sigma_hulls(d),(2,0,1):rrt_limit}"),
    ],rrt_limit=rrt)
    gauges,sigma=attach(post,a.goal,deps)
    assert sigma[(2,0,1)]==rrt
    pair=base["adapt"](pro["pair_bound"],TARGETS=targets)
    ledger=pair(post,deps,gauges)
    assert len(ledger)==2
    return {"schema":"MathScope.C127.OriginalLateTemporalSwirlCompleteCovariance/1",
            "status":"CONDITIONAL_ALL_16_ORIGINAL_COVARIANCE_REQUESTS_ATTACHED",
            "pins":{**PINS,"sigmaRRT":a.sigma_sha},"source":source,
            "actualTemporalSwirl":22150797,"requiredCovariance":sorted(asks),
            "previouslyAttached":[[f,j] for f,j in sorted(prior|transfer)],
            "lastTwoConditionalCovariance":[[f,j,"99999/100000"] for f,j in sorted(postponed)],
            "originalLastTwoPairedTrace":ledger,
            "scope":"Conditional original fixed-label chart and flat joins; this attaches the full typed covariance input set to the late temporal swirl derivative. Fourier tail realization and older mean inputs are separate. The direct FiveMap swirl, axial pressure, full Repeat residual and final jets are open.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=argparse.ArgumentParser()
    for k in ("work","goal","out"):
        p.add_argument("--"+k,type=Path,required=True)
    p.add_argument("--sigma",type=Path)
    p.add_argument("--sigma-sha")
    a=p.parse_args()
    report=main(a)
    a.out.write_bytes((json.dumps(report,indent=2)+"\n").encode())
    print(report["status"])
