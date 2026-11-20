"""Extend the original C128/C129 pre-Signed recurrence to the next temporal-wave requests."""
from argparse import ArgumentParser
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import sys

p=ArgumentParser(description=__doc__)
for name in ("work","goal","runtime","prior","frontier","pointwise","late","sigma","out"):
    p.add_argument("--"+name,required=True,type=Path)
for name in ("requirements","schedule"):
    p.add_argument("--"+name,type=Path)
p.add_argument("--action",choices=("census","covariance"),required=True)
a=p.parse_args()

def read(path,pin):
    b=path.read_bytes()
    assert sha256(b).hexdigest()==pin,path
    return b

def replace(body,changes):
    for before,after,count in changes:
        assert body.count(before)==count,(before,body.count(before))
        body=body.replace(before,after)
    return body

def gauges_of(target):
    return {tuple(x+y for x,y in zip(b,e,strict=True))
            for b in product(*(range(x+1) for x in target))
            for e in ((0,0,0,0),(1,0,0,0),(0,1,0,0),(0,0,0,1))}

q=(0,3,1,2)
pointwise_pin="5db77c948687ee351a42ce0ac027513d6986c04e9a14b40b3ae181cf7c652f19"
pointwise=json.loads(read(a.pointwise,pointwise_pin))["pointwiseRequests"]
c126={tuple(r["targetRZTL"]):r for r in pointwise}
assert gauges_of(q)==set(map(tuple,c126[q]["radialSignedGaugeDirections"]+c126[q]["axialSignedGaugeDirections"]))
late_pin="d1ee3fa60dc761433c04659ccc73cce9292dc9955560b42f7d424831502b1332"
late=json.loads(read(a.late,late_pin))
assert late["actualSource"]["potential"]==22150943 and late["actualSource"]["pressureZ"]==22031648
source_requests={
    ("rz",(0,0,1,4)),("rz",(0,1,1,3)),("rz",(0,2,1,3)),("rz",(1,0,1,3)),
    ("thetatheta",(0,1,1,3)),("zz",(0,1,1,3)),("rz",(1,1,1,2)),
}
original_requests=set((name,tuple(idx)) for name,idx in late["combinedPostSignedCovariance"])
assert len(original_requests)==94 and source_requests<=original_requests
sigma_pin="792776a8535ffea5dea722ed53c363f18d1a9d56b1b882b16243808a0c2c221d"
sigma=json.loads(read(a.sigma,sigma_pin))
assert sigma["covarianceNotCoveredByC127C128AllSixRows"]==[["rtheta",[2,1,1]],["rz",[2,1,1]]]
sigma_duties={(*idx,0) for _,idx in sigma["covarianceNotCoveredByC127C128AllSixRows"]}
supplement_targets={q}|{idx for _,idx in source_requests}|sigma_duties
supplement_gauges=set().union(*(gauges_of(q0) for q0 in supplement_targets))

if a.action=="census":
    old=a.work/"continuation128/pressure-presigned/probe_high_pressure_presigned.py"
    body=read(old,"01366fee9f858dc108a4d340e1704e8c228b4a46c4bdfd5829ede34da90348fb").decode()
    body=replace(body,(
        ('{(*idx,0) for _,idx in prior["allRequiredCovarianceRoles"]})',
         '{(*idx,0) for _,idx in prior["allRequiredCovarianceRoles"]}|supplement_targets)',1),
        ('{tuple(x) for x in prior["gaugeDirectionsFromCovariance"]})',
         '{tuple(x) for x in prior["gaugeDirectionsFromCovariance"]}|supplement_gauges)',1),
        ('    "topPrimaryRows":',
         '    "L9PrimaryRows":sorted((f,q) for f,q in all_cov if q[3]==9),\n    "topPrimaryRows":',1)))
    sys.argv=[old.name]+[v for n in ("work","goal","runtime","prior","out")
                        for v in ("--"+n,str(getattr(a,n)))]
    sys.argv+=["--demand",str(a.frontier)]
    exec(compile(body,str(old),"exec"),{"supplement_targets":supplement_targets,"supplement_gauges":supplement_gauges})
else:
    require_pin="c483bbb141289f23dbaed8c7f3b4c123af778dfce6b06da5c11c1477ec66c0e3"
    req=json.loads(read(a.requirements,require_pin))
    assert req["L9PrimaryRows"]==[
        ["W_rtheta",[0,0,0,9]],["W_rtheta",[0,0,1,9]],
        ["W_rz",[0,0,0,9]],["W_rz",[0,0,1,9]],["W_rz",[0,1,0,9]],["W_rz",[0,1,1,9]],
    ]
    assert max(q[3] for q in req["gaugeDirections"])==5
    frame_pin="09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8"
    frame=json.loads(read(a.goal/"c106/frame15/frame-c15.json",frame_pin))
    assert frame["matrixDirections"]==816 and frame["cutoffOrder"]==19
    oldL9_pin="b01790ea041aa3a5ad4d998e61c52aceb7cb0dd40bd6a68282ae74b03639ad41"
    oldL9=json.loads(read(a.goal/"c108/mode-one-late-mean/late-mode-one-mean.json",oldL9_pin))
    assert oldL9["pins"]["frame"]==frame_pin
    past={(r["component"],tuple(r["RZTL"])):r for r in oldL9["newHighPrimaryCoefficients"]}
    assert all(past[(f,tuple(q))]["potentialMaximumLOrder"]==10
               for f,q in req["L9PrimaryRows"] if q[2]==0)
    old=a.work/"continuation128/pressure-presigned/verify_presigned_pressure_high.py"
    body=read(old,"13646d4b8550392005a00d2b82ec7de6540c6dac8164e6290ebbbae3d3865738").decode()
    body=replace(body,(
        ('7f2447293946a24c64c4ee497fbebccfda78a05da5d1d8498eb1877472e1afd7',require_pin,1),
        ('==[13,6]','==[13,9]',1),
        ('==60','==116',2),
        ('==18','==25',2),
        ('==364','==586',2),
        ('prior["gaugeDirectionsFromCovariance"]+frontier["newPreSignedGaugeDirections"]})',
         'prior["gaugeDirectionsFromCovariance"]+frontier["newPreSignedGaugeDirections"]}|supplement_gauges)',1),
        ('=={(*idx,0) for _,*idx in cov}', '=={(*idx,0) for _,*idx in cov}|supplement_targets',1),
        ('"presignedRequirements":requirements_pin}',
         '"presignedRequirements":requirements_pin,"originalWPlusPointwiseDemand":pointwise_pin,'
         '"originalTemporalCoverage":late_pin,"postedSigmaR2ZTDependencies":sigma_pin,"actualC106Frame":frame_pin,"independentC108L9":oldL9_pin}',1),
        ('"gaugeDirectionsFromCovariance":req["gaugeDirections"],',
         '"gaugeDirectionsFromCovariance":req["gaugeDirections"],\n    "supplementalCovarianceRZTL":sorted(supplement_targets),',1),
        ("    ('PASS original 40 gauge directions','PASS original 60 gauge directions'),",
         "\n".join((
            """    ('targets=sorted({(*idx,0) for _,idx in demand["allRequiredCovarianceRoles"]})',""",
            """     'targets=sorted({(*idx,0) for _,idx in demand["allRequiredCovarianceRoles"]}|{tuple(row) for row in demand["supplementalCovarianceRZTL"]})'),""",
            """    ('if sum(k[1][:3])<=9},src["frame11"])','if sum(k[1][:3])<=9 and not (k[1][2]>0 and k[1][3]>8)},src["frame11"])'),""",
            """    ('10<=sum(k[1][:3])<=13},src["frame15"])','10<=sum(k[1][:3])<=13 or (k[1][2]>0 and k[1][3]>8)},src["frame15"])'),""",
            """    ('PASS original 40 gauge directions','PASS original 116 gauge directions'),""",
         )),1),
        ('OriginalFirstCycleCovarianceHigherLatePressure','OriginalFirstCycleCovarianceTemporalSupplement',1),
    ))
    sys.argv=[old.name]+[v for n in ("work","goal","runtime","prior","frontier","requirements","schedule","out")
                        for v in ("--"+n,str(getattr(a,n)))]
    exec(compile(body,str(old),"exec"),{
        "supplement_targets":supplement_targets,"supplement_gauges":supplement_gauges,
        "pointwise_pin":pointwise_pin,"late_pin":late_pin,"sigma_pin":sigma_pin,"frame_pin":frame_pin,"oldL9_pin":oldL9_pin,
    })
