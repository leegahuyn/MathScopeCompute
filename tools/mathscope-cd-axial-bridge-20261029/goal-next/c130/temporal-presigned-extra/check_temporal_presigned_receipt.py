"""Check replay determinism and freeze the supplemental native pre-Signed donor."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from pathlib import Path

p=ArgumentParser(description=__doc__)
for name in ("first","second","schedule","schedule-repeat","requirements","l9","out"):
    p.add_argument("--"+name,required=True,type=Path)
a=p.parse_args()

sources={
    "full":(a.first,"797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac"),
    "schedule":(a.schedule,"54746d872260a61961769a6fa150c155b394b0f026e9de76130f14c76773ca7c"),
    "requirements":(a.requirements,"c483bbb141289f23dbaed8c7f3b4c123af778dfce6b06da5c11c1477ec66c0e3"),
    "protectedPrimaryL9":(a.l9,"12d869922e481f5468455a11b200d8d5faf75429be7fd0fc5381e262eb9f82eb"),
}
s={}
for key,(path,h) in sources.items():
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==h,path
    s[key]=json.loads(raw)
assert a.first.read_bytes()==a.second.read_bytes()
assert a.schedule.read_bytes()==a.schedule_repeat.read_bytes()
result=s["full"]
req=s["requirements"]
assert len(req["targetCovarianceDirections"])==25 and len(req["gaugeDirections"])==116 and req["requestedMeanDirections"]==586
assert result["pins"]["exactMixedSignedDemand"]==sources["schedule"][1]
assert result["pins"]["sealedScheduleSources"]["postedSigmaR2ZTDependencies"]=="792776a8535ffea5dea722ed53c363f18d1a9d56b1b882b16243808a0c2c221d"
assert result["covarianceCommonLogRankHOver2Pow128"]==357940
assert result["modeOneGaugeMaxLogRank"]==170778
regions=("inner","outer","middle")
gauges=set(map(tuple,req["gaugeDirections"]))
assert set(map(tuple,result["targetGaugeDirections"]))==gauges
assert max(x[3] for x in gauges)==5
for rows in (*(result["threeRegionModeOneGauges"][region] for region in regions),result["modeTwoGauges"]):
    assert {tuple(x["RZTL"]) for x in rows}==gauges
assert len(result["meanAndCompactDependencies"]["requested"])==586

old={(f,tuple(q)) for f,q in req["L9PrimaryRows"]}
l9={(row["component"],tuple(row["RZTL"])):row for row in s["protectedPrimaryL9"]["sourceRows"]}
paid={(row["component"],tuple(row["RZTL"])):row for row in result["meanAndCompactDependencies"]["exactHighSeeds"] if row["RZTL"][3]==9}
assert set(l9)==set(paid)==old
for key in old:
    assert l9[key]["maximumPotentialL"]==paid[key]["potentialMaximumLOrder"]==10
    assert l9[key]["slowFrameDerivativeNeeded"]==paid[key]["primaryMaximumOrdinarySlowOrder"]
    assert l9[key]["exactCutoffProductTransfer"][1]["dimensionlessCoefficientBitLength"]==544

wanted={(0,0,1,4):("89/2",30),(0,1,1,3):("95/2",33),(0,2,1,3):("101/2",36),
        (1,0,1,3):("95/2",33),(1,1,1,2):("101/2",36),(2,1,1,0):("107/2",39)}
cov={tuple(x["RZTL"]):x for x in result["covarianceRows"]}
assert set(cov)==set(map(tuple,req["targetCovarianceDirections"]))
assert set(wanted)<=set(cov)
output=[]
axes=((0,0,0,0),(1,0,0,0),(0,1,0,0),(0,0,0,1))
for q,(band,pole) in sorted(wanted.items()):
    item=cov[q]
    assert item["allSixComponents"]
    need={tuple(a+b for a,b in zip(x,y,strict=True)) for x in product(*(range(d+1) for d in q)) for y in axes}
    assert need<=gauges
    cap={}
    for region in regions:
        row=item["regions"][region]
        assert row["minEpsilon"]=="1" and row["maxBand"]==band
        assert row["maxPoleAfterModeTwoSpareGaussian"]==str(0 if region=="middle" else pole)
        assert all(Q(p["epsilon"])>=1 for p in row["pairs"])
        cap[region]={"epsilon":"1","band":band,"pole":0 if region=="middle" else pole,"retainedGaussian":"zeta"}
    output.append({"RZTL":q,"nativeDirectionsRequired":len(need),"regions":cap})

receipt={"schema":"MathScope.C130.OriginalTemporalPreSignedSupplement/1",
         "status":"VERIFIED_EXACT_SOURCE_ARITHMETIC_CONDITIONAL_ON_ORIGINAL_ADMITTED_ANALYTIC_PROFILES",
         "pins":{k:h for k,(_,h) in sources.items()},
         "extraAllSixWminusCovariance":output,
         "sigmaExtraTypedRoles":[["W_rtheta",[2,1,1,0]],["W_rz",[2,1,1,0]]],
         "sourceRequirements":{"covarianceTargets":25,"modeGaugeDirections":116,"meanRoles":586},
         "sixPrimaryL9RowsWithActualC106Support":req["L9PrimaryRows"],
         "covarianceCommonLogRankHOver2Pow128":357940,
         "conditions":"Original fixed-label chart, guarded radial paths, common torus and flat endpoints, and the admitted smooth uniformly bounded analytic profiles used by the pinned C128 recurrence.",
         "scope":"Pre-Signed wave and covariance donor for additional post-Signed phase-free transfers. The protected value and output source closures for Repeat and final jets remain open.",
         "finalJets":0,"release":"HOLD"}
a.out.write_bytes((json.dumps(receipt,indent=2,sort_keys=True)+"\n").encode())
print("PASS both replays, 25 all-six covariance directions, 6 absolutely required L9 Primary rows, original Sigma R2ZT inputs")
