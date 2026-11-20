"""Find the exact input orders needed by the higher pre-Signed pressure covariance."""
from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import runpy

p = ArgumentParser(description=__doc__)
for name in ("work","goal","runtime","demand","prior","out"):
    p.add_argument("--"+name,required=True,type=Path)
a = p.parse_args()

def pinned(path, expected):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==expected, path
    return data

source=a.work/"continuation118/mode-one-signed-time/final/verify_mode_one_signed_time.py"
pinned(source,"ab13665bf50b8e9da1b8da475b09b9f82ad196751cf0b3a92aed6f6eef028501")
pre=runpy.run_path(str(source))
prior=json.loads(pinned(a.prior,"569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b"))
demand=json.loads(pinned(a.demand,"79d91f601780ea4bf9696927d60529f5ce11cfc868fafa1d0193ada978b37d36"))
assert demand["roots"]==prior["roots"]==[22001223,22001224,22000443]
duties=[tuple(map(int,idx)) for _,idx in demand["newPreSignedCovariance"]]
targets=sorted({(*idx,0) for idx in duties}|{(*idx,0) for _,idx in prior["allRequiredCovarianceRoles"]})
directions=sorted({tuple(x) for x in demand["newPreSignedGaugeDirections"]}|{tuple(x) for x in prior["gaugeDirectionsFromCovariance"]})
src={k:pre["read"](getattr(a, t)/r, pin) for k, (t,r,pin) in pre["PINS"].items()}
c118=src["gaugeCode"]
add, subs=(c118[k] for k in ("add","subs"))
requests={(f,add(sub,delta)) for f in ("beta","v","gamma") for q in directions
          for sub in subs(q) for delta in pre["AXES"]}
requests|={(f,(*idx,0)) for f,idx in demand["newCompactMeanSecondTimeOnly"]}
requests|={(f,(*idx,0)) for f,idx in prior["secondTimeMeanRoles"]}
requests=sorted(requests)
base=src["meanCode"]
data={}
for name in base["PINS"]:
    path=base["pin"](vars(a),name)
    data[name]=runpy.run_path(str(path)) if path.suffix==".py" else json.loads(path.read_bytes()) if path.suffix==".json" else path.read_text(encoding="utf-8")
base["audit_source"](data)
inner=base["collar"](data["weightedProgram"],6,requests)
outer=base["collar"](data["weightedProgram"],9,requests)
direct,tables=data["c103Program"]["whole_recipe"](data["premean"])
for name, order in requests:
    direct(name,order)
moment, linear, quadratic=data["c103Program"]["compact_demand"](requests)
for _, _, f, b, g, c, _, _ in quadratic:
    direct(f,b)
    direct(g,c)
direct_cov=set(tables[0])|inner[1]|outer[1]
all_cov=direct_cov|linear
max_slow=max(sum(order[:3]) for _,order in all_cov)
max_l=max(order[3] for _,order in all_cov)
result={
    "targetCovarianceDirections":targets,
    "gaugeDirections":directions,
    "requestedMeanDirections":len(requests),
    "directCovarianceRoles":len(direct_cov),
    "compactLinearRoles":sorted(linear),
    "compactMomentRequiredOrders":{f:max(map(sum,items)) for f,items in moment.items()},
    "compactQuadraticBranches":len(quadratic),
    "cutoffMaximumOrdinaryOrder":max(map(sum,tables[2])),
    "maximumPrimarySlowAndL":[max_slow,max_l],
    "topPrimaryRows":sorted((f,q) for f,q in all_cov if sum(q[:3])==max_slow),
}
a.out.write_bytes((json.dumps(result,indent=2,sort_keys=True)+"\n").encode())
print("PASS exact source demand",len(targets),len(directions),len(requests),max_slow,max_l,result["compactMomentRequiredOrders"],result["cutoffMaximumOrdinaryOrder"])
