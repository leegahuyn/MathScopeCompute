"""Replay the original C128 two-mode transfer for the L² post-Signed W-rz input."""
from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import sys

PREV="continuation128/pressure-presigned/"
PINS={
    "program":(PREV+"verify_presigned_pressure_high.py",
               "13646d4b8550392005a00d2b82ec7de6540c6dac8164e6290ebbbae3d3865738"),
    "sigmaC131":("continuation131/high-sigma/frontier.json",
                 "06f1c8ec97ef6361764453bc6cd65e1e4bd09d6ded2615cc1a032c2e0bed4b55"),
    "prior":("continuation125/sigma-rzt-zzt/sigma-rzt-zzt-dependencies.json",
             "569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b"),
    "frontier":("continuation127/late-wrz-sigma-dependencies/late-wrz-sigma-dependencies.json",
                "79d91f601780ea4bf9696927d60529f5ce11cfc868fafa1d0193ada978b37d36"),
    "matrix9":("continuation131/fivemap-presigned-high/matrix-order9.json",
               "234adcb53fc323ddbce451e2948348f9c3260d1f50cd51c6da7bcb782e0a194d"),
}
REQ_PIN="ae77202c65b6cc83012badc9029d77b296f12fc82160376d0ce42984542d2f76"


def read(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return raw


def run(a):
    paths={k:a.work/rel for k,(rel,_) in PINS.items()}
    docs={k:read(paths[k],sha) for k,(_,sha) in PINS.items()}
    source=json.loads(docs["sigmaC131"])
    assert source["nativeSigmaRoots"]==[22001223,22001224]
    assert source["actualIncrementalPressureZ"]==22000443
    assert source["sourceEndpoints"]==[17743711,17743713]
    req=json.loads(read(a.requirements,REQ_PIN))
    assert req["maximumPrimarySlowAndL"]==[14,7]
    assert req["cutoffMaximumOrdinaryOrder"]==13
    assert req["compactMomentRequiredOrders"]=={"P":10,"Jz":10,"Jtheta":11}
    assert sorted(req["topPrimaryRows"])==[["W_rz",[0,13,1,0]],["W_rz",[0,13,1,2]]]
    extra_positive={tuple((name,*j)) for name,j in source["missingPreSignedCovariance"]}
    assert extra_positive=={("rtheta",1,4,1),("rz",0,7,1),("rz",1,4,1)}
    extra_tt={tuple((name,*j)) for name,j in source["compactNotInPinnedMeanRosters"]}
    assert extra_tt=={("beta",0,6,2),("gamma",0,5,2),("v",0,5,2)}
    matrix9=json.loads(docs["matrix9"])
    assert matrix9["maximumSuppliedOrder"]==9 and matrix9["oldC89ExactPrefixRows"]==9
    assert matrix9["allRZTMatrixAuditCount"]==816
    body=docs["program"].decode()
    for old,new in (
        ("7f2447293946a24c64c4ee497fbebccfda78a05da5d1d8498eb1877472e1afd7",REQ_PIN),
        ("==[13,6]","==[14,7]"),
        ('==12\nassert req["compactMomentRequiredOrders"]','==13\nassert req["compactMomentRequiredOrders"]'),
        ('{"P":9,"Jz":9,"Jtheta":10}','{"P":10,"Jz":10,"Jtheta":11}'),
        ('==60 and len(req["targetCovarianceDirections"])==18','==102 and len(req["targetCovarianceDirections"])==21'),
        ('req["requestedMeanDirections"]==364','req["requestedMeanDirections"]==553'),
        ('second={tuple((name,*idx))','cov.update(extra_positive)\nsecond={tuple((name,*idx))'),
        ('expected_gauges=sorted','second.update(extra_tt)\nexpected_gauges=sorted'),
        ('prior["gaugeDirectionsFromCovariance"]+frontier["newPreSignedGaugeDirections"]})',
         'prior["gaugeDirectionsFromCovariance"]+frontier["newPreSignedGaugeDirections"]+req["newC131GaugeDirections"]})'),
        ('=={(*idx,0) for _,*idx in cov}', '=={(*idx,0) for _,*idx in cov}|{(0,4,1,2)}'),
        ('"gaugeDirectionsFromCovariance":req["gaugeDirections"],',
         '"gaugeDirectionsFromCovariance":req["gaugeDirections"],\n    "supplementalCovarianceRZTL":[[0,4,1,2]],'),
        ('"presignedRequirements":requirements_pin}', '"presignedRequirements":requirements_pin,"originalHighSigmaC131":sigma_c131_pin,"originalMatrixOrder9":matrix9_pin}'),
        ('"assert j<=10","assert j<=13"','"assert j<=10","assert j<=14"'),
        ("outer_cost<2**33 and inner_cost<2**75","outer_cost<2**44 and inner_cost<2**88"),
        ("75 if j==13 else 66 if j==12 else 63 if j==11 else 54",
         "88 if j==14 else 75 if j==13 else 66 if j==12 else 63 if j==11 else 54"),
        ('assert len(directions)==60','assert len(directions)==102'),
        ('10<=sum(k[1][:3])<=13','10<=sum(k[1][:3])<=14'),
        ('"order"]>=12','"order"]>=13'),
        ('"max_order=10"','"max_order=11"'),
        ('"bell[-1]==115975"','"bell[-1]==678570"'),
        ('FaadiBrunoPartitionCountAtTen','FaadiBrunoPartitionCountAtEleven'),
        ('"range(6)","range(11)"','"range(6)","range(12)"'),
        ('"32+5**7"','"32+(8**9).bit_length()"'),
        ('a[0]+a[1]+a[3]<=8 and a[2]<=1','a[0]+a[1]+a[3]<=9 and a[2]<=1'),
        ('if sum(r["RZTL"][:3])==13','if sum(r["RZTL"][:3])==14'),
        ('("W_rz",(0,12,1,0)),("W_rz",(0,12,1,2))',
         '("W_rz",(0,13,1,0)),("W_rz",(0,13,1,2))'),
        ('"slowThirteenPrimaryRows"','"slowFourteenPrimaryRows"'),
        ('assert len(requests)==364 and len(targets)==18','assert len(requests)==553 and len(targets)==21'),
        ("OriginalFirstCycleCovarianceHigherLatePressure","OriginalFirstCycleCovarianceFiveMapTimeL2Supplement"),
        ("PASS original 60 gauge directions","PASS original 102 gauge directions"),
    ):
        if old==new:
            continue
        assert body.count(old)==1,(old,body.count(old))
        body=body.replace(old,new)
    attach='scope={"__name__":"_presigned_high", "schedule_sources":record["sourcePins"]}'
    extended_scope='scope={"__name__":"_presigned_high", "schedule_sources":record["sourcePins"], "matrix9":matrix9}'
    close='scope["main"](Namespace(work=a.work,goal=a.goal,runtime=a.runtime,demand=a.schedule,out=a.out))'
    assert body.count(attach)==body.count(close)==1
    # Guard the raw factor count and exactly pay every finite angular
    # Mode Two spare half-pole through ceil(56/2), up from the old 25.
    code_add="""matrix_anchor='    time["check_sources"](inputs)'
assert body.count(matrix_anchor)==1
matrix_patch='\\n    old_ledger=inputs["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]\\n    assert all(rows[:9]==old_ledger[key] for key,rows in matrix9.items())\\n    inputs["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]=matrix9\\n    original_variation=time["variation"]\\n    variation_cache={}\\n    def cached_variation(alpha,ledger):\\n        assert ledger is matrix9\\n        if alpha not in variation_cache:\\n            variation_cache[alpha]=original_variation(alpha,ledger)\\n        return variation_cache[alpha]\\n    time={**time,"variation":cached_variation}'
body=body.replace(matrix_anchor,matrix_anchor+matrix_patch)
factors='    recipe=cap["groupProgram"]["grouped_recipes"]()'
assert body.count(factors)==1
body=body.replace(factors,factors+'\\n    assert max(len(t) for terms in recipe.values() for t in terms)<=8')
assert body.count('factorial(25).bit_length()')==1
body=body.replace('factorial(25).bit_length()','(2**28*factorial(28)).bit_length()')
write='    a.out.write_bytes((json.dumps(ans,indent=2,ensure_ascii=False)+"\\\\n").encode())'
assert body.count(write)==1
body=body.replace(write,write+'\\n    return cap["temporal"]')
"""
    schedule_change='    (\x27targets=sorted({(*idx,0) for _,idx in demand["allRequiredCovarianceRoles"]})\x27,\n     \x27targets=sorted({(*idx,0) for _,idx in demand["allRequiredCovarianceRoles"]}|{tuple(row) for row in demand["supplementalCovarianceRZTL"]})\x27),\n'
    sequence='    (\x27assert len(directions)==40\x27'
    assert body.count(sequence)==1
    body=body.replace(sequence,schedule_change+sequence)
    body=body.replace(attach,code_add+extended_scope)
    body=body.replace(close,"original_noncompact="+close)
    sys.argv=[str(paths["program"]),*(v for k,x in (
        ("work",a.work),("goal",a.goal),("runtime",a.runtime),("prior",paths["prior"]),
        ("frontier",paths["frontier"]),("requirements",a.requirements),("schedule",a.schedule),
        ("out",a.out)) for v in ("--"+k,str(x)))]
    env={"__name__":"_c131_fivemap_presigned","extra_positive":extra_positive,"extra_tt":extra_tt,
         "sigma_c131_pin":PINS["sigmaC131"][1],"matrix9_pin":PINS["matrix9"][1],
         "matrix9":matrix9["exactDerivativeLedgers"]}
    exec(compile(body,str(paths["program"]),"exec"),env)
    rows=env["original_noncompact"]
    assert all(len(rows[m])==553 for m in ("inner","outer","middle"))
    a.means_out.write_bytes((json.dumps(rows,indent=2)+"\n").encode())
    ans=json.loads(a.out.read_bytes())
    cap=ans["covarianceCommonLogRankHOver2Pow128"]
    exact={tuple(v["RZTL"]):v for v in ans["covarianceRows"]}
    assert set(map(tuple,req["newC131Targets"]))<=exact.keys()
    assert cap<2**19
    for k in ((0,7,1,0),(1,4,1,0),(0,4,1,2)):
        assert exact[k]["allSixComponents"]
        print("New first-wave covariance",k,[v["minEpsilon"] for v in exact[k]["regions"].values()],
              [v["maxBand"] for v in exact[k]["regions"].values()],
              [v["maxPoleAfterModeTwoSpareGaussian"] for v in exact[k]["regions"].values()])


if __name__=="__main__":
    p=ArgumentParser()
    for flag in ("work","goal","runtime","requirements","schedule","out","means-out"):
        p.add_argument("--"+flag,type=Path,required=True)
    run(p.parse_args())
