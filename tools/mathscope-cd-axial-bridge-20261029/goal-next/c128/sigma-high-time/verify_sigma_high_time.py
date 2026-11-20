"""Join the exact four original high time Signed flux directions with independent witnesses."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import runpy
import sys
from tempfile import TemporaryDirectory

C125="continuation125/"
C128="continuation128/"
PRESSURE=C128+"pressure-presigned/"
PINS={
    "c125Join":("W",C125+"sigma-mixed-join/verify_sigma_mixed_join.py",
                "6e9f98be7a7890fc00e4f84b0296947bb2a285f3c4f94a7cd807b3eedd1d058d"),
    "oldDep":("W",C125+"sigma-rzt-zzt/sigma-rzt-zzt-dependencies.json",
              "569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b"),
    "demandTraceProgram":("W",C125+"sigma-rzt-zzt/verify_sigma_rzt_zzt.py",
                          "12966c42c9ffba95b8696f48be5b7718b8bd56d3f33be1a8507882e0726fb8ec"),
    "highDep":("W","continuation127/late-wrz-sigma-dependencies/late-wrz-sigma-dependencies.json",
               "79d91f601780ea4bf9696927d60529f5ce11cfc868fafa1d0193ada978b37d36"),
    "highCov":("W",PRESSURE+"pressure-covariance.json",
               "51e3a1190c574723990a28ad9af2f477d01bf2e1a6789122243f612115497a85"),
    "highCovProgram":("W",PRESSURE+"verify_presigned_pressure_high.py",
                      "13646d4b8550392005a00d2b82ec7de6540c6dac8164e6290ebbbae3d3865738"),
    "schedule":("W",PRESSURE+"pressure-covariance-schedule.json",
                "bad611209a5daa99feae301649502bdd92291f444c9c9183c4135f1933f3dffc"),
    "requirements":("W",PRESSURE+"requirements.json",
                    "7f2447293946a24c64c4ee497fbebccfda78a05da5d1d8498eb1877472e1afd7"),
    "highCompact":("W",C128+"compact-high-tt/compact-high-tt.json",
                   "cb3c664e8c43e15b9dbe9fe0f290cdea881b7c01a557a0c62149ba1b275e2ef7"),
    "localHigh":("W","continuation127/signed-local-high-time/signed-local-high-time.json",
                 "78bd955033b7c2342d4e0ea255ea078b79c5c9077dee0cdea71ba3cb2112c037"),
    "oldCompact":("W",C125+"sigma-extra-mean/replay1.json",
                  "b880bac8b64973a0bb7076d0b04105f7bcb84671585aa810701c96f5a271865e"),
    "local2":("W",C125+"signed-local-rzt-zzt/signed-local-rzt-zzt.json",
              "31834de8587e52da76dbe98dc4c97065846097f9a1fd5b39a4d13f568252833c"),
    "local1":("G","c119/signed-local-mixed-time/signed-local-mixed-time.json",
              "8a6d9bd9fa6c1717380c6255aa45736a67cf42df8b63996fe22b74e27c451804"),
    "local0":("G","c117/signed-local-stress-time/signed-local-time-stress.json",
              "3ec60e03a9ae128ed546bc67256692ed2241e76be3261b8618761264ebcb9dd5"),
    "spatial":("G","c108/early-sigma-c6/early-sigma-c6.json",
               "d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f"),
    "arithmetic":("G","c108/early-sigma-c6/verify_sigma_c6.py",
                  "f0dff0510af992c4f54115fcfb62daf4ea78bea9d77a8c8f54b2221b2ff4f6b8"),
}
REGIONS=("inner","outer","middle")
TARGETS=((0,3,1),(0,4,1),(1,2,1),(1,3,1))
TARGET_LABELS=("Z3T","Z4T","RZ2T","RZ3T")
T0=(0,0,1)


def loaded(a):
    paths,docs={},{}
    for key,(root,rel,digest) in PINS.items():
        path=(a.goal if root=="G" else a.work)/rel
        raw=path.read_bytes()
        assert sha256(raw).hexdigest()==digest,path
        paths[key]=path
        docs[key]=json.loads(raw) if path.suffix==".json" else raw
    return paths,docs


def direct_noncompact_receipt(a,paths,d):
    # The authenticated high pressure replay computes the entire noncompact
    # roster. Capture it while checking its original two output streams.
    wrapper=d["highCovProgram"].decode()
    position='scope={"__name__":"_presigned_high", "schedule_sources":record["sourcePins"]}'
    ending='scope["main"](Namespace(work=a.work,goal=a.goal,runtime=a.runtime,demand=a.schedule,out=a.out))'
    assert wrapper.count(position)==wrapper.count(ending)==1
    write='    a.out.write_bytes((json.dumps(ans,indent=2,ensure_ascii=False)+"\\n").encode())'
    unique_return=write+'\n    return cap["temporal"]'
    wrapper=wrapper.replace(position,
        "assert body.count("+repr(write)+")==1\nbody=body.replace("+repr(write)+","+repr(unique_return)+")\n"+position)
    wrapper=wrapper.replace(ending,"noncompact="+ending)
    env={"__name__":"_capture_original_pressure","__file__":str(paths["highCovProgram"])}
    with TemporaryDirectory(dir=a.out.parent) as area:
        scratch=Path(area)
        schedule=scratch/"schedule.json"
        cov=scratch/"covariance.json"
        original_argv=sys.argv
        sys.argv=[str(paths["highCovProgram"]),"--work",str(a.work),"--goal",str(a.goal),
                  "--runtime",str(a.runtime),"--prior",str(paths["oldDep"]),
                  "--frontier",str(paths["highDep"]),"--requirements",str(paths["requirements"]),
                  "--schedule",str(schedule),"--out",str(cov)]
        try:
            exec(compile(wrapper,str(paths["highCovProgram"]),"exec"),env)
        finally:
            sys.argv=original_argv
        assert schedule.read_bytes()==paths["schedule"].read_bytes()
        assert cov.read_bytes()==paths["highCov"].read_bytes()
    original_rows=env["noncompact"]
    assert all(len(original_rows[x])==364 for x in REGIONS)
    assert original_rows["common"]["coefficientRanksInHOver2Pow128"]==d["highCov"]["directMeanRanks"]
    return original_rows


def censuses(paths,d,ops):
    source=d["demandTraceProgram"].decode()
    bank="directions = tuple(product(range(4),range(7),range(3)))"
    assert source.count(bank)==1
    enlarged=source.replace(bank,"directions = tuple(product(range(4),range(9),range(3)))")
    env={"__name__":"_higher_original_c125","__file__":str(paths["demandTraceProgram"])}
    exec(compile(enlarged,str(paths["demandTraceProgram"]),"exec"),env)
    dep,prior=d["highDep"],d["oldDep"]
    assert dep["roots"]==prior["roots"]==d["schedule"]["roots"]==[22001223,22001224,22000443]
    assert dep["fixedEndpoints"]==prior["fixedEndpoints"]==d["highCompact"]["fixedEndpoints"]==[17743711,17743713]
    assert d["schedule"]["sourcePins"]["priorSigmaRoles"]==PINS["oldDep"][2]
    assert d["schedule"]["sourcePins"]["latePressureRoles"]==PINS["highDep"][2]
    assert d["schedule"]["sourcePins"]["presignedRequirements"]==PINS["requirements"][2]
    assert tuple(map(tuple,dep["targetRZT"]))==TARGETS
    traces={a:{region:env["trace"](ops,a,region) for region in REGIONS} for a in TARGETS}
    old={(f,tuple(a)) for f,a in prior["allRequiredCovarianceRoles"]}
    used=env["roles"](traces,"covariance")
    for key,target in zip(TARGET_LABELS,TARGETS,strict=True):
        new=env["roles"]({target:traces[target]},"covariance")-old
        assert new=={(f,tuple(a)) for f,a in dep["perTarget"][key]},key
    assert used-old=={(f,tuple(a)) for f,a in dep["newPreSignedCovariance"]}
    return traces,used


def local_caps(ops,d,traces):
    lookup={}
    for name in ("local0","local1","local2","localHigh"):
        doc=d[name]
        assert doc.get("originalResiduals",doc.get("sourceResiduals"))==[21999622,22000445]
        if "conditionalRows" in doc:
            per_direction=[(tuple(row["direction"]),row) for row in doc["conditionalRows"]]
        else:
            cap=doc["conditionalCap"]
            per_direction=[(tuple(a),cap) for a in cap.get("directions",[T0])]
        for a,row in per_direction:
            assert row.get("epsilonGrade",row.get("epsilon"))=="1"
            assert row["gaussian"]=="zeta" and Q(row.get("band","0"))==0
            assert int(row["logCoefficient"].split("/2^")[-1])>=128
            for region in REGIONS:
                pole=row[{"inner":"innerPole","outer":"outerPole","middle":"middlePole"}[region]]
                assert 0<=pole<=18
                lookup[region,a]=ops["Bound"](ops["E"],0,pole,1)
    actual={(r,tuple(x)) for values in traces.values() for r,tr in values.items() for x in tr["localStress"]}
    assert actual<=lookup.keys(),sorted(actual-lookup.keys())
    return lookup


def compact_caps(ops,d,j):
    caps=j["compact_cap"](ops,d["oldCompact"])
    actual=d["highCompact"]
    assert actual["status"]=="VERIFIED_ORIGINAL_RECURRENCE_CONDITIONAL_ALL_SIX_COMPACT_TT"
    assert actual["staticGeometry"]["torusIndependent"] and actual["staticGeometry"]["originalWholeAngularMomentZero"]
    expected={(f,tuple(a)) for f,a in d["highDep"]["newCompactMeanSecondTimeOnly"]}
    slots=set()
    for cap in actual["conditionalRows"]:
        f=cap["field"]
        a=tuple(cap["RZTL"])
        assert a[-1]==0 and a[2]==2 and cap["pole"]==0 and cap["compactZeroOnBothOriginalCollars"]
        e,b,c=Q(cap["epsilonPower"]),Q(cap["bandPower"]),cap["logChargeHOver2Pow128"]
        assert c==61386 and e==(2 if f=="beta" else 1)
        assert b==(Q(7,2) if f=="beta" else Q(1,2))+3*sum(a[:3])
        caps[f,a[:3]]=ops["Bound"](e*ops["E"],b,0,c)
        slots.add((f,a[:3]))
    assert slots==expected and len(slots)==6
    return caps


def join(a):
    paths,d=loaded(a)
    j=runpy.run_path(str(paths["c125Join"]))
    ops=runpy.run_path(str(paths["arithmetic"]))
    high=d["highCov"]
    assert len(high["covarianceRows"])==18 and len(high["targetGaugeDirections"])==60
    assert high["covarianceCommonLogRankHOver2Pow128"]==357940
    traces,roles=censuses(paths,d,ops)
    local=local_caps(ops,d,traces)
    compact=compact_caps(ops,d,j)
    direct=direct_noncompact_receipt(a,paths,d)
    mean,branches,collars=j["target_mean_tables"](ops,direct,roles)
    cov_cap=j["adapt"](j["covariance_cap"],[("coefficient==258240<2**18","coefficient==357940<2**19")])
    arith=j["adapt"](ops["arithmetic"],[
        ('return Bound(2*E if f=="beta" else E,','if (f,a) in d["compactInputs"]:\n            return d["compactInputs"][f,a]\n        return Bound(2*E if f=="beta" else E,'),
        (")+3*sum(a),0,54920)",")+3*sum(a),0,d[\"generalCompactLogRank\"])"),
        ("return Bound(E,0,pole,1)","return d[\"localInputs\"][region,a]"),
    ])
    exact_spatial={(f,tuple(q)) for v in d["spatial"]["regions"].values() for f,q in v["trace"]["covariance"]}
    attached={}
    capdata={"compactInputs":compact,"generalCompactLogRank":high["compactMomentGeometryCharge"]+2,
             "localInputs":local}
    for region in REGIONS:
        wave=cov_cap(ops,high,region)
        missing=roles-wave.keys()
        assert missing<=exact_spatial and not any(a[2] for _,a in missing)
        cap=d["spatial"]["postForcedWaveCovarianceEvidence"]
        for f,q in missing:
            wave[f,q]=ops["Bound"](ops["E"],Q(cap["maxBand"]),0 if region=="middle" else cap["maxPole"],2**20)
        rows=[]
        by_target={}
        for target in TARGETS:
            asks={"weightedSigmaSpatialOrders":[list(target)],
                  "localWeightedRadialFlux":[list(q) for q in product(*(range(j+1) for j in target))]}
            vals,trace=arith(capdata,asks,mean,branches,collars,wave,region)
            assert trace==traces[target][region],(region,target)
            rows+=vals
            by_target[str(target)]=trace
        attached[region]={"bounds":rows,"sourceTrace":by_target}
    actual=[row for region in attached.values() for row in region["bounds"]]
    e=min(Q(row["epsilon"]) for row in actual)
    b=max(Q(row["band"]) for row in actual)
    p=max(row["pole"] for row in actual)
    c=max(row["coefficientInHOver2Pow128"] for row in actual)
    assert e>=1 and p<=54 and b<=Q(137,2) and c<2**21
    return {"schema":"MathScope.C128.OriginalHigherSignedSigmaTime/1",
            "status":"CONDITIONAL_AUTHENTICATED_FOUR_ORIGINAL_HIGHER_SIGMA_TIME_ROWS",
            "pins":PINS,"nativeSigmaRoots":[22001223,22001224],"actualIncrementalPressureZ":22000443,
            "sourceEndpoints":[17743711,17743713],"targetsRZT":TARGETS,"regions":attached,
            "common":{"epsilon":str(e),"band":str(b),"pole":p,"logCoefficientUnitsHOver2Pow128":c,"gaussian":"zeta"},
            "premises":"Only the original admitted analytic frame, stable original source paths, fixed labels, smooth cutoff and Fourier realization hypotheses of the independent witnesses. Post-Signed covariance and complete late axial pressure remain separate.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=ArgumentParser()
    for k in ("work","goal","runtime","out"):
        p.add_argument("--"+k,type=Path,required=True)
    a=p.parse_args()
    report=join(a)
    a.out.write_bytes((json.dumps(report,indent=2)+"\n").encode())
    print(report["status"],report["common"])
