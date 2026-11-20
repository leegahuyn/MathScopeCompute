"""Bind the C126 late Temporal swirl candidate inputs to genuine indexed waves."""
import argparse
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import inspect
import json
from pathlib import Path
import runpy
from types import FunctionType,SimpleNamespace

C125="continuation125/post-signed-theta-z-zt/"
PINS={
    "demand":("W","continuation126/late-swirl-time/replay.json","24591e84cd0c571fe18687b1884ea9def7945c3c6ece12dc51d3572b417dd34e"),
    "preProgram":("W",C125+"verify_pre_signed_theta_z_mixed.py","6c57b0de96648a039f817e0666f0ffed95ae9369bac4adc0e0a310e3384f1f93"),
    "postProgram":("W",C125+"verify_post_signed_theta_z_mixed.py","f62da0739e54918858a7dacd2f29fd25276a2fc215f7213030d6087e375b9e85"),
    "prePrior":("W",C125+"pre-signed-theta-z-mixed.json","5f2403894ec7808bf0f6e4493f026b024e27be978994f2487cea55787deeb7fe"),
    "postPrior":("W",C125+"post-signed-theta-z-mixed.json","f8c5e82cad7a51693d979232216a40a8ba07e0e7eba4045a3fd4c353cb0d9f8b"),
    "sigmaDemand":("W","continuation125/sigma-rzt-zzt/sigma-rzt-zzt-dependencies.json","569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b"),
    "spatial":("G","c105/late-grade/late-grade.json","d631c9776b543c2033e2c161d8deca2b5e59da886b87989486eb47c8af590bef"),
    "spatialJoin":("G","c108/first-k1-energy/k1-donor-join.json","8684f3f27a56f46d4b70feaaf738104c091b2ca35f31ba014c7a0c55005aee59"),
}
ZERO=(0,0,0,0)
R=(1,0,0,0)
Z=(0,1,0,0)
L=(0,0,0,1)
CURL_OFFSETS={
    "r":(ZERO,Z),
    "theta":(ZERO,R,Z,L),
    "z":(ZERO,R,L),
}
COMPONENTS={"rtheta":("r","theta"),"thetaz":("theta","z")}


class BytesOutput:
    def __init__(self):
        self.raw=b""

    def write_bytes(self,data):
        self.raw=data


def load(work,goal):
    roots={"W":work,"G":goal}
    d,paths={},{}
    for key,(root,name,digest) in PINS.items():
        path=roots[root]/name
        raw=path.read_bytes()
        assert sha256(raw).hexdigest()==digest, path
        paths[key]=path
        if path.suffix==".py":
            d[key]=runpy.run_path(str(path))
        else:
            d[key]=json.loads(raw)
    return d,paths


def adapt(fn,replacements=(),**extra):
    source=inspect.getsource(fn)
    for old,new in replacements:
        assert source.count(old)==1,old
        source=source.replace(old,new)
    env={**fn.__globals__,**extra}
    body={}
    exec(compile(source,inspect.getfile(fn),"exec"),env,body)
    return FunctionType(body[fn.__name__].__code__,env)


def plus(a,b):
    return tuple(x+y for x,y in zip(a,b,strict=True))


def down(a):
    return product(*(range(j+1) for j in a))


def needed(n,a):
    return {plus(b,v) for b in down(a) for comp in COMPONENTS[n] for v in CURL_OFFSETS[comp]}


def split_roles(d,post):
    assert d["demand"]["roots"]=={"temporalSwirl":22150797,"fiveSwirl":22151941,"directTotal":22154876}
    asks={(f,tuple(a)) for f,a in d["demand"]["temporalT"]["postSignedCovariance"]}
    assert len(asks)==16
    spatial={(f,tuple(a)) for f,a in d["spatial"]["premise"]["componentDirections"]}
    assert len(spatial)==d["spatialJoin"]["sourceInputs"]["covarianceInputs"]==127
    previous=asks&(spatial|{("thetaz",tuple(a)) for a in d["postPrior"]["RZTL"]})
    assert len(previous)==10
    sig=d["postProgram"]["sigma_hulls"](post)
    new_forced=set.union(*(needed(f,a) for f,a in asks))-{tuple(q) for q in d["prePrior"]["targetGaugeDirections"]}
    assert new_forced=={(0,0,0,4),(0,0,1,4),(1,0,0,3),(1,0,1,3),
                        (2,0,0,1),(2,0,0,2),(2,0,1,1),(2,0,1,2)}
    gap={(f,a):{g[:3] for g in needed(f,a) if g[:3] not in sig} for f,a in asks-previous}
    transfer={role for role,missing in gap.items() if not missing}
    postponed={role for role,missing in gap.items() if missing}
    assert transfer=={("rtheta",(0,0,1,l)) for l in range(4)}
    assert postponed=={("rtheta",(1,0,1,l)) for l in (0,2)}
    assert set.union(*(gap[role] for role in postponed))=={(2,0,1)}
    return asks,previous,new_forced,transfer,postponed


def preforced(a,d,paths,asks):
    # Also retain the C125 pre-Signed cache targets and its embedded exact
    # initialized-mean and both-Forced source assertions.
    targets={b for _,alpha in asks for b in down(alpha)}
    targets.update(down((2,0,1,0)))
    targets.update(tuple(row["RZTL"]) for row in d["prePrior"]["covarianceRows"])
    fn=adapt(d["preProgram"]["main"],[
        ("{ (0,z,t,l) for z,t,l in product(range(2),range(2),range(3)) }","extensions"),
        ("MathScope.C125.OriginalFirstCycleCovarianceForPostSignedThetaZZT/1",
         "MathScope.C127.OriginalFirstCycleCovarianceForLateSwirlTime/1"),
    ],extensions=targets)
    capture=BytesOutput()
    fn(SimpleNamespace(work=a.work,goal=a.goal,runtime=a.runtime,
                       demand=paths["sigmaDemand"],out=capture))
    pre=json.loads(capture.raw)
    assert {(0,0,1,4),(2,0,1,2)} <= {tuple(x) for x in pre["targetGaugeDirections"]}
    assert {(1,0,1,2),(0,0,1,3)} <= {tuple(x["RZTL"]) for x in pre["covarianceRows"]}
    row,=[x for x in pre["covarianceRows"] if tuple(x["RZTL"])==(2,0,1,0)]
    assert row["allSixComponents"]
    for region, cap in row["regions"].items():
        assert Q(cap["minEpsilon"])>=1 and Q(cap["maxBand"])<=Q(101,2)
        assert Q(cap["maxPoleAfterModeTwoSpareGaussian"])<=(0 if region=="middle" else 36)
    a.pre_out.write_bytes(capture.raw)
    return pre,sha256(capture.raw).hexdigest()


def replay_post(a,d,post,transfer):
    pro=d["postProgram"]
    targets=tuple(sorted(j for f,j in transfer))
    # The original C125 pairing applies to any two components. Here the
    # left is radial and the right is angular. Supply their actual curl
    # offsets, including the new fourth transverse derivative of chi.
    alpha={b for j in targets for b in down(j)}
    deps={(j,b):sorted({plus(i,v) for i in down(b) for v in CURL_OFFSETS[f]})
          for b in alpha for j,f in ((1,"r"),(2,"theta"))}
    assert max(g[3] for rows in deps.values() for g in rows)==4
    assess=adapt(pro["signed_gauge_caps"],[
        ('for x in chi[:4]]==cutoff["transverseRanks"][:4]','for x in chi[:5]]==cutoff["transverseRanks"][:5]'),
        ("degree<=3 and j<=3","degree<=3 and j<=4"),
    ])
    gauges,sigma=assess(post,a.goal,deps)
    pair=adapt(pro["pair_bound"],TARGETS=targets)
    actual=pair(post,deps,gauges)
    assert len(actual)==4
    return actual,sigma


def main(a):
    d,paths=load(a.work,a.goal)
    post=d["postProgram"]["load"](a.work,a.goal)
    source=d["postProgram"]["bound_sources"](post)
    asks,prior,new_forced,transfer,postponed=split_roles(d,post)
    pre,digest=preforced(a,d,paths,asks)
    post={**post,"pre":pre}
    branches,sigma=replay_post(a,d,post,transfer)
    assert {(2,0,1)}=={q[:3] for f,j in postponed for q in needed(f,j)}-sigma.keys()
    # The exact cylindrical angular component contains -C_z,R/2.
    # After RT this is -C_z,RRT/2, independent of its axial partner.
    # The original protected normal has nonzero theta component, so the
    # compatible tangent n_theta e_z - n_z e_theta tests this slot.
    n=(1,2,3)
    tangent=(0,-n[2],n[1])
    assert sum(x*y for x,y in zip(n,tangent,strict=True))==0
    control=-Q(tangent[2],2)
    assert control==-1
    return {"schema":"MathScope.C127.OriginalLateTemporalSwirlCovarianceCoverage/1",
            "status":"CONDITIONAL_FOUR_ADDITIONAL_ACTUAL_POST_SIGNED_ROWS",
            "source":source,"pins":PINS,"temporalSource":22150797,
            "requiredCovariance":sorted(asks),"alreadyAttached":sorted(prior),
            "newConditionalWholePathRows":[[f,j,"99999/100000"] for f,j in sorted(transfer)],
            "newExactPairLedger":branches,
            "preSigned":{
                "newRowsRelativeToC125ExactlyNeeded":sorted(new_forced),
                "actualGaugeCount":len(pre["targetGaugeDirections"]),
                "actualCovarianceCount":len(pre["covarianceRows"]),
                "additionalSigmaRRTPreSignedCovariance":{"RZTL":[2,0,1,0],
                        "allSixComponents":True,"specificallyUsed":["rtheta","rz"],
                        "epsilon":"1","band":"101/2","collarPole":36,"middlePole":0,
                        "logCoefficientUnitsHOver2Pow128":pre["covarianceCommonLogRankHOver2Pow128"]},
                "actualInitializedMeanCount":len(pre["meanAndCompactDependencies"]["requested"]),
                "replaySHA256":digest,
            },
            "openCovariance":sorted(postponed),"onlyMissingSignedSlowSigmaRZT":[2,0,1],
            "minimalCurlRequest":{
                "row":"imaginary angular velocity coefficient",
                "term":"-1/2 partial_R^2 partial_T C_z",
                "guard":"C_z may have a tangent-compatible RRT perturbation without any lower-order jets at the test point.",
                "normalizedTangentControl":str(control),
                "scope":"Control for a general algebraic implication only. No original numerical nonzero claim.",
            },
            "scope":"All normalized covariance bounds use the original admitted coordinate charts, flat joins, positive frame, fixed pulse/lift and common Fourier realization. Separate swirl, axial pressure, Repeat closure and final gates remain open.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=argparse.ArgumentParser()
    for key in ("work","goal","runtime","pre-out","out"):
        p.add_argument("--"+key,type=Path,required=True)
    a=p.parse_args()
    result=main(a)
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS",len(result["alreadyAttached"]),"existing and",len(result["newConditionalWholePathRows"]),
          "new original W+ inputs. Still open",len(result["openCovariance"]))
