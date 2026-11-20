"""Recover all original C127 noncompact mean rows from the frozen pre-wave replay."""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import runpy
from types import SimpleNamespace

REL="continuation127/late-swirl-covariance/"
CODE_SHA="26e40a6201647e3d8005c57b9bee58720082f6c848a2bc441d6847e529ee0923"
FROZEN_PRE_SHA="0efb18ed928286bb7a21683dffcc6a6979f5e6008de19f78c52ecf19bca7efe9"


def exact_pre(a):
    program=a.work/REL/"verify_late_swirl_covariance.py"
    frozen=(a.work/REL/"pre-signed-late-swirl.json").read_bytes()
    assert sha256(program.read_bytes()).hexdigest()==CODE_SHA
    assert sha256(frozen).hexdigest()==FROZEN_PRE_SHA
    run=runpy.run_path(str(program))
    d,paths=run["load"](a.work,a.goal)
    asks={(f,tuple(a)) for f,a in d["demand"]["temporalT"]["postSignedCovariance"]}
    targets={b for _,alpha in asks for b in run["down"](alpha)}
    targets.update(run["down"]((2,0,1,0)))
    targets.update(tuple(row["RZTL"]) for row in d["prePrior"]["covarianceRows"])
    fn=run["adapt"](d["preProgram"]["main"],[
        ("{ (0,z,t,l) for z,t,l in product(range(2),range(2),range(3)) }","extensions"),
        ("MathScope.C125.OriginalFirstCycleCovarianceForPostSignedThetaZZT/1",
         "MathScope.C127.OriginalFirstCycleCovarianceForLateSwirlTime/1"),
        ('    a.out.write_bytes((json.dumps(ans,indent=2,ensure_ascii=False)+"\\n").encode())',
         '    a.out.write_bytes((json.dumps(ans,indent=2,ensure_ascii=False)+"\\n").encode())\n    return cap["temporal"]'),
    ],extensions=targets)
    capture=run["BytesOutput"]()
    ordinary=fn(SimpleNamespace(work=a.work,goal=a.goal,runtime=a.runtime,
                                demand=paths["sigmaDemand"],out=capture))
    assert capture.raw==frozen
    assert all(len(ordinary[region])==346 for region in ("inner","outer","middle"))
    for region in ("inner","outer","middle"):
        roster={(row["field"],tuple(row["RZTL"])) for row in ordinary[region]}
        assert ("beta",(2,0,1,0)) in roster
    return ordinary


if __name__=="__main__":
    p=argparse.ArgumentParser()
    for f in ("work","goal","runtime","out"):
        p.add_argument("--"+f,type=Path,required=True)
    a=p.parse_args()
    data=exact_pre(a)
    a.out.write_bytes((json.dumps(data,indent=2)+"\n").encode())
    print("PASS re-emitted 346 exact C127 noncompact mean rows on all three regions")
