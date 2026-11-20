"""Replay the pinned C128 original recurrence with the additional native L²Z³T path."""
from argparse import ArgumentParser
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import sys

p=ArgumentParser(description=__doc__)
for name in ("work","goal","runtime","prior","frontier","pointwise","requirements","schedule","out"):
    p.add_argument("--"+name,required=True,type=Path)
a=p.parse_args()

def pinned(path,pin):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==pin,path
    return data

q=(0,3,1,2)
pointwise_pin="5db77c948687ee351a42ce0ac027513d6986c04e9a14b40b3ae181cf7c652f19"
pointwise=json.loads(pinned(a.pointwise,pointwise_pin))["pointwiseRequests"]
assert q in {tuple(r["targetRZTL"]) for r in pointwise}
extra={tuple(x+y for x,y in zip(b,e)) for b in product(*(range(x+1) for x in q))
       for e in ((0,0,0,0),(1,0,0,0),(0,1,0,0),(0,0,0,1))}
assert len(extra)==62
old=a.work/"continuation128/pressure-presigned/verify_presigned_pressure_high.py"
body=pinned(old,"13646d4b8550392005a00d2b82ec7de6540c6dac8164e6290ebbbae3d3865738").decode()
adapt=(
 ('7f2447293946a24c64c4ee497fbebccfda78a05da5d1d8498eb1877472e1afd7',
  'a47c34f51785dc4cb36a11dc02b39819dd7d17eadbe667c5ce4cb5ee31bdb3ee',1),
 ('==[13,6]','==[13,7]',1),
 ('==60','==86',2),
 ('==18','==19',2),
 ('==364','==472',2),
 ('prior["gaugeDirectionsFromCovariance"]+frontier["newPreSignedGaugeDirections"]})',
  'prior["gaugeDirectionsFromCovariance"]+frontier["newPreSignedGaugeDirections"]}|supplement_gauges)',1),
 ('=={(*idx,0) for _,*idx in cov}', '=={(*idx,0) for _,*idx in cov}|{supplement_target}',1),
 ('"presignedRequirements":requirements_pin}', '"presignedRequirements":requirements_pin,"originalWPlusPointwiseDemand":pointwise_pin}',1),
 ('"gaugeDirectionsFromCovariance":req["gaugeDirections"],',
  '"gaugeDirectionsFromCovariance":req["gaugeDirections"],\n    "supplementalCovarianceRZTL":[supplement_target],',1),
 ("    ('PASS original 40 gauge directions','PASS original 60 gauge directions'),",
  "\n".join((
    """    ('targets=sorted({(*idx,0) for _,idx in demand["allRequiredCovarianceRoles"]})',""",
    """     'targets=sorted({(*idx,0) for _,idx in demand["allRequiredCovarianceRoles"]}|{tuple(row) for row in demand["supplementalCovarianceRZTL"]})'),""",
    """    ('PASS original 40 gauge directions','PASS original 86 gauge directions'),""")),1),
 ('OriginalFirstCycleCovarianceHigherLatePressure','OriginalFirstCycleCovarianceLatePressureWithL2',1),
)
for before,after,count in adapt:
    assert body.count(before)==count,(before,body.count(before))
    body=body.replace(before,after)
sys.argv=[old.name]+[v for n in ("work","goal","runtime","prior","frontier","requirements","schedule","out")
                    for v in ("--"+n,str(getattr(a,n)))]
exec(compile(body,str(old),"exec"),
     {"supplement_target":q,"supplement_gauges":extra,"pointwise_pin":pointwise_pin})
