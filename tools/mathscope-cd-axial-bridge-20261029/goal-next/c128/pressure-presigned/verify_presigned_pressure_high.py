"""Replay the original both-mode covariance on the higher late-pressure schedule."""
from argparse import ArgumentParser, Namespace
from hashlib import sha256
import json
from pathlib import Path

p = ArgumentParser(description=__doc__)
for name in ("work","goal","runtime","prior","frontier","requirements","schedule","out"):
    p.add_argument("--"+name,required=True,type=Path)
a=p.parse_args()

def digest(raw):
    return sha256(raw).hexdigest()

def load(path,pin):
    data=path.read_bytes()
    assert digest(data)==pin, path
    return json.loads(data)

prior_pin="569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b"
frontier_pin="79d91f601780ea4bf9696927d60529f5ce11cfc868fafa1d0193ada978b37d36"
prior=load(a.prior,prior_pin)
frontier=load(a.frontier,frontier_pin)
requirements_pin="7f2447293946a24c64c4ee497fbebccfda78a05da5d1d8498eb1877472e1afd7"
req=load(a.requirements,requirements_pin)
assert req["maximumPrimarySlowAndL"]==[13,6]
assert req["cutoffMaximumOrdinaryOrder"]==12
assert req["compactMomentRequiredOrders"]=={"P":9,"Jz":9,"Jtheta":10}
assert len(req["gaugeDirections"])==60 and len(req["targetCovarianceDirections"])==18
assert req["requestedMeanDirections"]==364
cov={tuple((name,*idx)) for name,idx in prior["allRequiredCovarianceRoles"]+frontier["newPreSignedCovariance"]}
second={tuple((name,*idx)) for name,idx in prior["secondTimeMeanRoles"]+frontier["newCompactMeanSecondTimeOnly"]}
expected_gauges=sorted({tuple(row) for row in prior["gaugeDirectionsFromCovariance"]+frontier["newPreSignedGaugeDirections"]})
assert list(map(tuple,req["gaugeDirections"]))==expected_gauges
assert {tuple(row) for row in req["targetCovarianceDirections"]}=={(*idx,0) for _,*idx in cov}
record={
    "roots":[22001223,22001224,22000443],
    "sourcePins":{"priorSigmaRoles":prior_pin,"latePressureRoles":frontier_pin,
                  "presignedRequirements":requirements_pin},
    "allRequiredCovarianceRoles":[[name,idx] for name,*idx in sorted(cov)],
    "gaugeDirectionsFromCovariance":req["gaugeDirections"],
    "secondTimeMeanRoles":[[name,idx] for name,*idx in sorted(second)],
    "newSecondTimeMeanRoles":[[name,idx] for name,*idx in sorted(second)],
}
raw=(json.dumps(record,indent=2,sort_keys=True)+"\n").encode()
a.schedule.write_bytes(raw)
base=a.goal/"c125/forced-mixed-rzt-z4t/verify_forced_rzt_z4t.py"
original=base.read_bytes()
assert digest(original)=="da0d2c7df1c6de708b399a4288d3e233594506d93e3e6347b0fca0b558291cbf"
body=original.decode()
linear={ (name,tuple(idx)) for name,idx in req["compactLinearRoles"] if sum(idx[:3])>7 or idx[3]>8}
linear_literal="{"+", ".join(repr(x) for x in sorted(linear))+"}"
for old,new in (
    (f'DEMAND="{prior_pin}"',f'DEMAND="{digest(raw)}"'),
    ('"assert j<=10","assert j<=11"','"assert j<=10","assert j<=13"'),
    ('outer_cost<2**26 and inner_cost<2**63','outer_cost<2**33 and inner_cost<2**75'),
    ('63 if j==11 else 54','75 if j==13 else 66 if j==12 else 63 if j==11 else 54'),
    ('assert len(directions)==40','assert len(directions)==60'),
    ("== {('W_rz',(0,7,1,0)),('W_thetaz',(0,7,1,0))}", "== "+linear_literal),
    ("10<=sum(k[1][:3])<=11","10<=sum(k[1][:3])<=13"),
    ('high_compact["cutoff"]["order"]>=10','high_compact["cutoff"]["order"]>=12'),
    ('("max_order=7","max_order=8")','("max_order=7","max_order=10")'),
    ('"bell[-1]==4140"','"bell[-1]==115975"'),
    ('"x in bump)<80"','"x in bump)<128"'),
    ('FaadiBrunoPartitionCountAtEight','FaadiBrunoPartitionCountAtTen'),
    ('("range(6)","range(9)")','("range(6)","range(11)")'),
    ('assert row["pole"]<=36','assert row["pole"]<=48'),
    ('a[0]+a[1]+a[3]<=6 and a[2]<=1','a[0]+a[1]+a[3]<=8 and a[2]<=1'),
    ('"factorial(18).bit_length()"','"factorial(22).bit_length()"'),
    ('"32+5**6"','"32+5**7"'),
    ('"geometries=32768"','"geometries=81920"'),
    ('("geometries=8192","geometries=81920"),','("geometries=8192","geometries=81920"),("assert charge<2**17","assert charge<2**18"),'),
    ('assert g_rank<2**17','assert g_rank<2**18'),
    ('assert covariance_rank<2**18','assert covariance_rank<2**19'),
    ('assert p<=50','assert p<=56'),
    ('assert all(len(rows)==4 for rows in tt_rows.values())','assert all(len(rows)==len(tt_requests) for rows in tt_rows.values())'),
    ('if sum(r["RZTL"][:3])==11','if sum(r["RZTL"][:3])==13'),
    ('assert high11=={("W_rz",(0,10,1,0)),("W_rz",(0,10,1,2))}',
     'assert high11=={("W_rz",(0,12,1,0)),("W_rz",(0,12,1,2))}'),
    ('"slowElevenPrimaryRows"','"slowThirteenPrimaryRows"'),
    ('evidence["highLinearMomentRows"]=[["W_rz",[0,7,1,0]],["W_thetaz",[0,7,1,0]]]',
     f'evidence["highLinearMomentRows"]={sorted(linear)!r}'),
    ('assert len(requests)==250 and len(targets)==12','assert len(requests)==364 and len(targets)==18'),
    ('assert profile["compactChargeInHOver2Pow128"]==58901','assert profile["compactChargeInHOver2Pow128"]<2**16'),
    ('assert covariance_rank==258240','assert 0<covariance_rank<2**19'),
    ('OriginalFirstCycleCovarianceSignedRZTZZT','OriginalFirstCycleCovarianceHigherLatePressure'),
    ('"exactMixedSignedDemand":DEMAND','"exactMixedSignedDemand":DEMAND,"sealedScheduleSources":schedule_sources'),
    ('"covarianceCommonLogCap":"H/2^110"','"covarianceCommonLogCap":"H/2^109"'),
    ('PASS original 40 gauge directions','PASS original 60 gauge directions'),
):
    assert old in body, old
    body=body.replace(old,new,1)
scope={"__name__":"_presigned_high", "schedule_sources":record["sourcePins"]}
exec(compile(body,str(base),"exec"),scope)
scope["main"](Namespace(work=a.work,goal=a.goal,runtime=a.runtime,demand=a.schedule,out=a.out))
