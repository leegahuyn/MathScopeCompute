"""Authenticate and extend exact C128 source recipes by the single L²Z³T request."""
from argparse import ArgumentParser
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import sys

p=ArgumentParser(description=__doc__)
for name in ("work","goal","runtime","demand","prior","frontier","out"):
    p.add_argument("--"+name,required=True,type=Path)
a=p.parse_args()

def pinned(path,pin):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==pin,path
    return data

q=(0,3,1,2)
rows={tuple(r["targetRZTL"]):r for r in json.loads(pinned(a.frontier,"5db77c948687ee351a42ce0ac027513d6986c04e9a14b40b3ae181cf7c652f19"))["pointwiseRequests"]}
assert q in rows
extra={tuple(x+y for x,y in zip(b,e)) for b in product(*(range(x+1) for x in q))
       for e in ((0,0,0,0),(1,0,0,0),(0,1,0,0),(0,0,0,1))}
assert len(extra)==62
old=a.work/"continuation128/pressure-presigned/probe_high_pressure_presigned.py"
body=pinned(old,"01366fee9f858dc108a4d340e1704e8c228b4a46c4bdfd5829ede34da90348fb").decode()
for before,after in (
 ('{(*idx,0) for _,idx in prior["allRequiredCovarianceRoles"]})',
  '{(*idx,0) for _,idx in prior["allRequiredCovarianceRoles"]}|{supplement_target})'),
 ('{tuple(x) for x in prior["gaugeDirectionsFromCovariance"]})',
  '{tuple(x) for x in prior["gaugeDirectionsFromCovariance"]}|supplement_gauges)'),
):
    assert body.count(before)==1,before
    body=body.replace(before,after,1)
sys.argv=[old.name]+[v for n in ("work","goal","runtime","demand","prior","out")
                    for v in ("--"+n,str(getattr(a,n)))]
exec(compile(body,str(old),"exec"),{"supplement_target":q,"supplement_gauges":extra})
