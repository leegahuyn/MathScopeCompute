"""Attach authenticated new donors to the two original mixed Signed fluxes."""
import argparse
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import inspect
import json
from math import factorial
from pathlib import Path
import runpy
from types import SimpleNamespace

REGIONS=("inner","outer","middle")
TARGETS=((1,1,1),(0,2,1))
MEAN_PAIRS={"rr":("beta","beta"),"rtheta":("beta","v"),"rz":("beta","gamma"),
            "thetatheta":("v","v"),"thetaz":("v","gamma"),"zz":("gamma","gamma")}
WARNING_SLOTS={("beta",(0,3,2)),("gamma",(0,2,2)),("v",(0,2,2))}
C125="continuation125/"
COV=C125+"forced-mixed-rzt-z4t/"
DEP=C125+"sigma-rzt-zzt/sigma-rzt-zzt-dependencies.json"
PINS={
    "arithmetic":("G","c108/early-sigma-c6/verify_sigma_c6.py",
                  "f0dff0510af992c4f54115fcfb62daf4ea78bea9d77a8c8f54b2221b2ff4f6b8"),
    "dependency":("W",DEP,"569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b"),
    "forcedProgram":("W",COV+"verify_forced_rzt_z4t.py",
                     "da0d2c7df1c6de708b399a4288d3e233594506d93e3e6347b0fca0b558291cbf"),
    "forced":("W",COV+"forced-rzt-z4t.json",
              "8844998bb26a96ccb276e107fa04e8b108229e7d0a71077d60f867bd8e63695f"),
    "priorLocal":("G","c119/signed-local-mixed-time/signed-local-mixed-time.json",
                  "8a6d9bd9fa6c1717380c6255aa45736a67cf42df8b63996fe22b74e27c451804"),
    "priorSigma":("G","c119/signed-mixed-native-time/signed-mixed-sigma-time.json",
                  "d43d7d90c831c82b13c9fb68be5e4ab3acd8212fb7a1bd894e4d061d26673014"),
}


def read(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,(path,digest)
    return raw


def adapt(function,replacements):
    source=inspect.getsource(function)
    for old,new in replacements:
        assert source.count(old)==1,old
        source=source.replace(old,new)
    local={}
    exec(compile(source,inspect.getfile(function),"exec"),function.__globals__,local)
    return local[function.__name__]


class BytesOutput:
    def __init__(self):
        self.raw=b""

    def write_bytes(self,raw):
        self.raw=raw


def read_actual_noncompact(a,paths,blobs):
    # Recompute the exact original Forced receipt because its archived JSON
    # omits most noncompact mean rows. Capture those rows without modifying it.
    program=runpy.run_path(str(paths["forcedProgram"]))
    invoke=adapt(program["main"],[
        ('    a.out.write_bytes((json.dumps(ans,indent=2,ensure_ascii=False)+"\\n").encode())',
         '    a.out.write_bytes((json.dumps(ans,indent=2,ensure_ascii=False)+"\\n").encode())\n    return cap["temporal"]'),
    ])
    capture=BytesOutput()
    out=invoke(SimpleNamespace(work=a.work,goal=a.goal,runtime=a.runtime,demand=paths["dependency"],out=capture))
    assert capture.raw==blobs["forced"]
    return out


def target_mean_tables(ops,noncompact,cov_roles):
    modes={region:{(q["field"],tuple(q["RZTL"])):q for q in noncompact[region]} for region in REGIONS}
    compact_conditions={}
    for name,a in cov_roles:
        f,g=MEAN_PAIRS[name]
        compact_conditions[name,(*a,0)]=[(f,(*b,0),g,(*c,0),k)
                                         for b,c,k in ops["splits"](a)]
    bounds={}
    ranks=noncompact["common"]["coefficientRanksInHOver2Pow128"]
    for region in ("inner","outer"):
        values={}
        max_charge=0
        for (tensor,j),terms in compact_conditions.items():
            hull=[]
            for f,b,g,c,k in terms:
                x,y=modes[region][f,b],modes[region][g,c]
                pole=x["pole"]+y["pole"]
                log_charge=factorial((pole+1)//2).bit_length()+64
                assert log_charge<256
                max_charge=max(max_charge,log_charge+k.bit_length())
                hull.append((Q(x["epsilon"])+Q(y["epsilon"]),Q(x["band"])+Q(y["band"])))
            values[tensor,j[:3]]={"epsilon":str(min(e for e,_ in hull)),
                                   "band":str(max(s for _,s in hull))}
        assert 2*ranks[0]+max_charge<2**17
        bounds[region]=(None,values,2**17)
    return modes["middle"],compact_conditions,bounds


def covariance_cap(ops,data,region):
    rows={}
    coefficient=data["covarianceCommonLogRankHOver2Pow128"]
    assert coefficient==258240<2**18
    for item in data["covarianceRows"]:
        r,z,t,l=item["RZTL"]
        assert l==0 and item["allSixComponents"]
        values=item["regions"][region]
        assert {tuple(x["orderedProduct"]) for x in values["pairs"]}=={
            ("Primary","Primary"),("Primary","Forced1"),("Forced1","Primary"),
            ("Forced1","Forced1"),("Forced2","Forced2"),
        }
        e,s,p=Q(values["minEpsilon"]),Q(values["maxBand"]),Q(values["maxPoleAfterModeTwoSpareGaussian"])
        assert e>=1 and s<=Q(83,2)+3*(r+z+t) and p<=27+3*(r+z+t)
        assert p.denominator==1
        for name in MEAN_PAIRS:
            rows[name,(r,z,t)]=ops["Bound"](e*ops["E"],s,int(p),coefficient)
    return rows


def local_cap(ops,prior,new):
    all_stress={}
    for data,targets in ((prior,{(0,1,1)}),(new,set(TARGETS))):
        assert data["originalResiduals"]==[21999622,22000445]
        c=data["conditionalCap"]
        assert targets <= {tuple(x) for x in c["directions"]}
        assert c["gaussian"]=="zeta" and Q(c["epsilon"])>=1
        assert 0<=Q(c.get("band","0"))<=1
        numerator,denominator=c["logCoefficient"].split("/2^")
        assert numerator=="H" and int(denominator)>=128
        for region in REGIONS:
            for a in targets:
                key={"inner":"innerPole","outer":"outerPole","middle":"middlePole"}[region]
                assert 0<=c[key]<=12
                all_stress[region,a]=ops["Bound"](Q(c["epsilon"])*ops["E"],Q(c.get("band","0")),c[key],1)
    return all_stress


def compact_cap(ops,independent):
    assert independent["c125DemandSHA256"]==PINS["dependency"][2]
    profile=independent["compactProfile"]
    assert profile["compactZeroOnBothSourceCollars"] and profile["motionOfSRetained"]
    assert profile["compactIndependentOfL"] and profile["linearCompactCovarianceUsesOnlyC7"]
    assert independent["compactBetaZZZTT"]["sourceJtheta"]==21374531
    assert independent["compactBetaZZZTT"]["sourceBeta"]==21374944
    rows={}
    for f,key in (("beta","compactBetaZZZTT"),("gamma","compactGammaZZTT"),("v","compactVZZTT")):
        item=independent[key]
        a=tuple(item["RZT"])
        e,s,c=Q(item["epsilonPower"]),Q(item["bandPower"]),item["logChargeHOver2Pow128"]
        assert e>=(2 if f=="beta" else 1) and s<=(Q(7,2) if f=="beta" else Q(1,2))+3*sum(a)
        assert c==profile["compactChargeInHOver2Pow128"]==51952
        rows[f,a]=ops["Bound"](e*ops["E"],s,0,c)
    assert WARNING_SLOTS==rows.keys()
    assert {(f,tuple(a[:3])) for f,a in independent["targets"]}==rows.keys()
    return rows

def main(a):
    roots={"W":a.work,"G":a.goal}
    paths={key:roots[root]/name for key,(root,name,_) in PINS.items()}
    blobs={key:read(paths[key],digest) for key,(_,_,digest) in PINS.items()}
    dep=json.loads(blobs["dependency"])
    cov=json.loads(blobs["forced"])
    prior=json.loads(blobs["priorSigma"])
    assert prior["nativeSigmaRoots"]==dep["roots"][:2]
    assert prior["actualIncrementalPressureZ"]==dep["roots"][-1]==22000443
    assert prior["sourceEndpoints"]==dep["fixedEndpoints"]==[17743711,17743713]
    assert set(map(tuple,dep["newSigmaRequests"]))==set(TARGETS)
    assert len(cov["covarianceRows"])==12
    if not (a.local and a.local_sha and a.compact and a.compact_sha):
        assert not any((a.local,a.local_sha,a.compact,a.compact_sha))
        return {"schema":"MathScope.C125.MixedSigmaIndependentWitnessIntake/1",
                "nativeSigmaRoots":dep["roots"][:2],"actualIncrementalPressureZ":dep["roots"][-1],
                "sourceEndpoints":dep["fixedEndpoints"],"targetsRZT":TARGETS,
                "status":"OPEN_AWAITING_AUTHENTICATED_LOCAL_AND_COMPACT_BOUNDS",
                "requiredLocalStress":["RZT","ZZT"],
                "requiredCompactTT":sorted(WARNING_SLOTS),"attachedCovarianceRows":len(cov["covarianceRows"]),
                "release":"HOLD","finalJets":0}

    assert a.local_sha=="31834de8587e52da76dbe98dc4c97065846097f9a1fd5b39a4d13f568252833c"
    assert a.compact_sha=="b880bac8b64973a0bb7076d0b04105f7bcb84671585aa810701c96f5a271865e"
    local=json.loads(read(a.local,a.local_sha))
    assert local["schema"]=="MathScope.C125.OriginalSignedLocalRZTZZT/1"
    assert local["originalSourceStreamSHA256"]=="faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
    compact=json.loads(read(a.compact,a.compact_sha))
    ops=runpy.run_path(str(paths["arithmetic"]))
    scopes=local_cap(ops,json.loads(blobs["priorLocal"]),local)
    compact_inputs=compact_cap(ops,compact)
    noncompact=read_actual_noncompact(a,paths,blobs)
    roles={(f,tuple(x)) for f,x in dep["allRequiredCovarianceRoles"]}
    middle,branches,collars=target_mean_tables(ops,noncompact,roles)
    # Use the same conservative recurrence after supplying the independently
    # scoped local stress and normalized compact bound at the exact lookups.
    old_compact="return Bound(2*E if f==\"beta\" else E,"
    arith=adapt(ops["arithmetic"],[
        (old_compact,"if (f,a) in d[\"compactInputs\"]:\n            return d[\"compactInputs\"][f,a]\n        "+old_compact),
        (")+3*sum(a),0,54920)",")+3*sum(a),0,d[\"generalCompactLogRank\"])"),
        ("return Bound(E,0,pole,1)","return d[\"localInputs\"][region,a]"),
    ])
    report={}
    capdata={"compactInputs":compact_inputs,
             "generalCompactLogRank":cov["compactMomentGeometryCharge"]+2,"localInputs":scopes}
    for region in REGIONS:
        rows=[]
        traces={}
        wave=covariance_cap(ops,cov,region)
        for target in TARGETS:
            asks={"weightedSigmaSpatialOrders":[list(target)],
                  "localWeightedRadialFlux":[list(i) for i in product(*(range(j+1) for j in target))]}
            vals,trace=arith(capdata,asks,middle,branches,collars,wave,region)
            assert json.loads(json.dumps(trace))==dep["newSourceTraces"][str(target)][region],(region,target)
            rows+=vals
            traces[str(target)]=trace
        report[region]={"bounds":rows,"sourceTrace":traces}
    rows=[r for s in report.values() for r in s["bounds"]]
    e=min(Q(x["epsilon"]) for x in rows)
    s=max(Q(x["band"]) for x in rows)
    p=max(x["pole"] for x in rows)
    c=max(x["coefficientInHOver2Pow128"] for x in rows)
    assert e>=1 and s<=Q(131,2) and p<=48 and c<2**20
    return {"schema":"MathScope.C125.OriginalSignedSigmaRZTZZTBound/1",
            "status":"CONDITIONAL_AUTHENTICATED_ORIGINAL_MIXED_SIGMA",
            "pins":{**{k:row[2] for k,row in PINS.items()},"local":a.local_sha,"compact":a.compact_sha},
            "nativeSigmaRoots":dep["roots"][:2],"actualIncrementalPressureZ":dep["roots"][-1],
            "sourceEndpoints":dep["fixedEndpoints"],"targetsRZT":TARGETS,"regions":report,
            "common":{"epsilon":str(e),"band":str(s),"pole":p,"logCoefficientUnitsHOver2Pow128":c,"gaussian":"zeta"},
            "release":"HOLD","finalJets":0}


if __name__=="__main__":
    p=argparse.ArgumentParser()
    for flag in ("work","goal","runtime","out"):
        p.add_argument("--"+flag,type=Path,required=True)
    for flag in ("local","compact"):
        p.add_argument("--"+flag,type=Path)
        p.add_argument("--"+flag+"-sha")
    a=p.parse_args()
    report=main(a)
    a.out.write_bytes((json.dumps(report,indent=2)+"\n").encode())
    print(report["status"],report.get("common"))
