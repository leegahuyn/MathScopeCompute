"""Attach the protected W^+_rz,Z³T gauge and original Haar pairs."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import inspect
import json
from pathlib import Path
import runpy
from types import FunctionType

PINS={
    "base":("continuation125/post-signed-theta-z-zt/verify_post_signed_theta_z_mixed.py",
            "f62da0739e54918858a7dacd2f29fd25276a2fc215f7213030d6087e375b9e85"),
    "pressurePre":("continuation128/pressure-presigned/pressure-covariance.json",
                   "51e3a1190c574723990a28ad9af2f477d01bf2e1a6789122243f612115497a85"),
}
BASE=(0,0,0,0)
R=(1,0,0,0)
Z=(0,1,0,0)
L=(0,0,0,1)
TARGET=(0,3,1,0)


def pinned(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return json.loads(raw) if path.suffix==".json" else raw


def adapt(fn,replacements=(),**extra):
    source=inspect.getsource(fn)
    for old,new in replacements:
        assert source.count(old)==1,old
        source=source.replace(old,new)
    env={**fn.__globals__,**extra}
    compiled={}
    exec(compile(source,inspect.getfile(fn),"exec"),env,compiled)
    return FunctionType(compiled[fn.__name__].__code__,env)


def main(a):
    paths={key:a.work/rel for key,(rel,_) in PINS.items()}
    inputs={key:pinned(paths[key],digest) for key,(_,digest) in PINS.items()}
    module=runpy.run_path(str(paths["base"]))
    d=module["load"](a.work,a.goal)
    source=module["bound_sources"](d)
    assert a.sigma_sha=="c09bf88e3ad65ecf9b5f21e25fe229469cd3e491bacb2dd0ee5ead4627d6ef00"
    sigma=pinned(a.sigma,a.sigma_sha)
    assert sigma["schema"]=="MathScope.C128.OriginalHigherSignedSigmaTime/1"
    assert sigma["nativeSigmaRoots"]==[22001223,22001224]
    assert sigma["actualIncrementalPressureZ"]==22000443
    assert sigma["sourceEndpoints"]==[17743711,17743713]
    high={tuple(x) for x in sigma["targetsRZT"]}
    assert high=={(0,3,1),(0,4,1),(1,2,1),(1,3,1)}
    caps=sigma["common"]
    assert Q(caps["epsilon"])>=1 and caps["gaussian"]=="zeta"
    cap=Q(caps["band"]),caps["pole"],caps["logCoefficientUnitsHOver2Pow128"]
    assert cap[0]<=Q(137,2) and cap[1]<=54 and cap[2]<2**20
    higher={x:cap for x in high}
    d["pre"]=inputs["pressurePre"]

    # Each angular Haar pair takes the radial physical curl on one leg
    # and axial on the other. The original phase cancels between ±m.
    dirs=tuple(b for b,_,_ in module["splits"](TARGET))
    deps={(j,b):sorted({module["plus"](x,off) for x,_,_ in module["splits"](b)
                        for off in offsets})
          for b in dirs for j,offsets in ((1,(BASE,Z)),(2,(BASE,R,L)))}
    needed={x for ds in deps.values() for x in ds}
    assert len(needed)==26
    assert needed<={tuple(x) for x in d["pre"]["targetGaugeDirections"]}
    assert max(sum(g[:3]) for g in needed)==5 and max(g[3] for g in needed)==1
    apply_gauge=adapt(module["signed_gauge_caps"],[
        ("sigma=sigma_hulls(d)","sigma={**sigma_hulls(d),**higher}"),
        ("reciprocal_gaussians\"](3,log_s)","reciprocal_gaussians\"](5,log_s)"),
        ("[side][:4]","[side][:6]"),
        ("for x in slow[:4]]==cutoff[\"cutoffOrdinaryRanks\"][:4]",
         "for x in slow[:6]]==cutoff[\"cutoffOrdinaryRanks\"][:6]"),
        ("degree<=3 and j<=3","degree<=5 and j<=1"),
    ],higher=higher)
    gauges,available=apply_gauge(d,a.goal,deps)
    exact={(r,z,t) for r,z,t,_ in needed if t}
    assert exact<=available.keys() and high<=exact
    pair_apply=adapt(module["pair_bound"],[
        ('d["pre"]["covarianceCommonLogRankHOver2Pow128"]<2**18',
         'd["pre"]["covarianceCommonLogRankHOver2Pow128"]<2**19'),
        ('table[q]["prefactorLogRankHOver2Pow128"]<2**17',
         'table[q]["prefactorLogRankHOver2Pow128"]<2**18'),
        ("+1<96 and p<=60","+1<112 and p<=72"),
        ("(2**60*factorial(60)).bit_length()<512","(2**72*factorial(72)).bit_length()<1024"),
        ("2**22+512","2**22+1024"),
        ("Q(192,2**32636)","Q(224,2**32636)"),
        ('"unnormalizedBandBeforeDebit":"192","collarPoleBeforeGaussianAbsorption":120',
         '"unnormalizedBandBeforeDebit":"224","collarPoleBeforeGaussianAbsorption":144'),
    ],TARGETS=(TARGET,))
    rows=pair_apply(d,deps,gauges)
    return {"schema":"MathScope.C128.OriginalPostSignedWrzZ3TOrdinary/1",
            "status":"CONDITIONAL_ACTUAL_POST_SIGNED_W_RZ_Z3T",
            "pins":{**PINS,"sigmaHigh":a.sigma_sha},"source":source,
            "target":"W^+_rz","RZTL":TARGET,"pairedTrace":rows,
            "nativeGaugeRows":[[g,items] for g,items in sorted(gauges.items())],
            "exactPositiveTSigmaInputs":sorted(exact),
            "wholePathEpsilonGrade":"99999/100000",
            "open":"L squared companion needs independent supplementary first-wave L covariances and paired gauge inputs; the ordinary bound alone does not control the late pressure Fourier inverse.",
            "scope":"Conditional original same-label normalized torus, weighted native source realization, positive frame, and flat joins of the independently replayed original inputs.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=ArgumentParser()
    for f in ("work","goal","sigma","out"):
        p.add_argument("--"+f,type=Path,required=True)
    p.add_argument("--sigma-sha",required=True)
    a=p.parse_args()
    out=main(a)
    a.out.write_bytes((json.dumps(out,indent=2)+"\n").encode())
    print(out["status"],len(out["nativeGaugeRows"]),out["wholePathEpsilonGrade"])
