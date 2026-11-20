"""Ensure direct first-wave gauge recipes stay inside their prior L8 Primary limit."""
from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import runpy

p=ArgumentParser(description=__doc__)
for name in ("work","requirements","out"):
    p.add_argument("--"+name,required=True,type=Path)
a=p.parse_args()

def pinned(path,want):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==want,path
    return raw

pin="30822610edec2f4c2aea7d0ce9b92a1980d53bab14225b9f1e1c373598e8eb9c"
path=a.work/"continuation107/forced-mode-one-join/final/verify_mode_one_high_join.py"
pinned(path,pin)
recipes=runpy.run_path(str(path))["grouped_recipes"]()
requirements=json.loads(pinned(a.requirements,"c483bbb141289f23dbaed8c7f3b4c123af778dfce6b06da5c11c1477ec66c0e3"))
gauge_max=max(q[3] for q in requirements["gaugeDirections"])
direct_offset={tag:max(a0[3] for terms in recipes.values() for term in terms for role,a0 in term if role==tag)
               for tag in ("U","Uo","P")}
direct_upper={k:v+gauge_max for k,v in direct_offset.items()}
assert max(direct_upper.values())<=8
result={"schema":"MathScope.C130.DirectFirstWavePrimaryTransverseSupport/1",
        "originalRecipePin":pin,"gaugeMaximumL":gauge_max,"sourcePrimaryLOffsets":direct_offset,
        "directPrimaryLUpper":direct_upper,"independentAcceptedVelocityL":8,
        "scope":"The bound includes every Leibniz product allocation of the source recipes. The separate shifted initialized mean has its own L9 pre-Primary covariance witness."}
a.out.write_bytes((json.dumps(result,indent=2,sort_keys=True)+"\n").encode())
print("PASS every direct Primary operand remains within the prior L8 range",direct_upper)
