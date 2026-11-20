"""Census the original pre-Signed support for the two next high mixed-time Sigma applications."""
from argparse import ArgumentParser
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import sys

PINS={
    "prior":("continuation125/sigma-rzt-zzt/sigma-rzt-zzt-dependencies.json",
             "569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b"),
    "frontier128":("continuation127/late-wrz-sigma-dependencies/late-wrz-sigma-dependencies.json",
                   "79d91f601780ea4bf9696927d60529f5ce11cfc868fafa1d0193ada978b37d36"),
    "frontier131":("continuation131/high-sigma/frontier.json",
                   "06f1c8ec97ef6361764453bc6cd65e1e4bd09d6ded2615cc1a032c2e0bed4b55"),
    "probe":("continuation128/pressure-presigned/probe_high_pressure_presigned.py",
             "01366fee9f858dc108a4d340e1704e8c228b4a46c4bdfd5829ede34da90348fb"),
}
POSITIVES={("rtheta",(1,4,1)),("rz",(0,7,1)),("rz",(1,4,1))}
TT={("beta",(0,6,2)),("gamma",(0,5,2)),("v",(0,5,2))}
NEW_TARGETS={(0,7,1,0),(1,4,1,0)}


def read(w,key):
    path=w/PINS[key][0]
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key][1],path
    return json.loads(raw) if path.suffix==".json" else raw.decode()


def plus(a,b):
    return tuple(x+y for x,y in zip(a,b,strict=True))


def gauge_closure(indices):
    axes=((0,0,0,0),(1,0,0,0),(0,1,0,0),(0,0,0,1))
    return {plus(q,axis) for a in indices for q in product(*(range(j+1) for j in a)) for axis in axes}


def main(a):
    front=read(a.work,"frontier131")
    old=read(a.work,"frontier128")
    prior=read(a.work,"prior")
    assert front["nativeSigmaRoots"]==prior["roots"][:2]==[22001223,22001224]
    assert front["actualIncrementalPressureZ"]==prior["roots"][-1]==22000443
    assert front["sourceEndpoints"]==old["fixedEndpoints"]==prior["fixedEndpoints"]==[17743711,17743713]
    assert {tuple(q) for q in front["targetsRZT"]}=={(0,5,1),(1,4,1)}
    assert {(f,tuple(q)) for f,q in front["missingPreSignedCovariance"]}==POSITIVES
    assert {(*q,0) for _,q in POSITIVES}==NEW_TARGETS
    assert {(f,tuple(q)) for f,q in front["compactNotInPinnedMeanRosters"]}==TT
    current={(f,tuple(q)) for f,q in front["allRoles"]["covariance"]}
    assert POSITIVES<=current
    new_gauges=gauge_closure(NEW_TARGETS)
    body=read(a.work,"probe")
    for before,after in (
        ('{(*idx,0) for _,idx in prior["allRequiredCovarianceRoles"]})',
         '{(*idx,0) for _,idx in prior["allRequiredCovarianceRoles"]}|new_targets)'),
        ('{tuple(x) for x in prior["gaugeDirectionsFromCovariance"]})',
         '{tuple(x) for x in prior["gaugeDirectionsFromCovariance"]}|new_gauge_directions)'),
        ('requests=sorted(requests)','requests=sorted(requests|{(f,(*a,0)) for f,a in new_TT})'),
        ('        "topPrimaryRows":','        "topPrimaryRows":'),
    ):
        if before==after:
            continue
        assert body.count(before)==1,before
        body=body.replace(before,after)
    body=body.replace('    "topPrimaryRows":','    "newC131Targets":sorted(new_targets),\n    "newC131GaugeDirections":sorted(new_gauge_directions-({tuple(a) for a in demand["newPreSignedGaugeDirections"]}|{tuple(a) for a in prior["gaugeDirectionsFromCovariance"]})),\n    "topPrimaryRows":')
    arguments={k:getattr(a,k) for k in ("work","goal","runtime","out")}
    arguments["prior"]=a.work/PINS["prior"][0]
    arguments["demand"]=a.work/PINS["frontier128"][0]
    sys.argv=[str(a.work/PINS["probe"][0]),*(v for k,p in arguments.items() for v in ("--"+k,str(p)))]
    env={"__name__":"_c131_high_original_input_probe","new_targets":NEW_TARGETS,
         "new_gauge_directions":new_gauges,"new_TT":TT}
    exec(compile(body,str(a.work/PINS["probe"][0]),"exec"),env)
    req=json.loads(a.out.read_bytes())
    assert set(map(tuple,req["newC131Targets"]))==NEW_TARGETS
    assert len(req["targetCovarianceDirections"])==20
    print("Primary potential cutoff requirements",req["maximumPrimarySlowAndL"][0]+1,
          req["cutoffMaximumOrdinaryOrder"])


if __name__=="__main__":
    p=ArgumentParser()
    for k in ("work","goal","runtime","out"):
        p.add_argument("--"+k,type=Path,required=True)
    main(p.parse_args())
