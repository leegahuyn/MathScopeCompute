"""Replay the original cutoff factors required by the six high Primary L9 seeds."""
from argparse import ArgumentParser
from hashlib import sha256
from math import comb
import inspect
import json
from pathlib import Path
import runpy

p=ArgumentParser(description=__doc__)
for name in ("goal","runtime","requirements","out"):
    p.add_argument("--"+name,required=True,type=Path)
a=p.parse_args()

stage="primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/"
primary=stage+"initial-mean-norm/primary/"
global_cov=stage+"first-forced-budget/global-covariance-join/"
data={
    "protectedReader":(a.goal/global_cov/"verify_global_primary_covariance.py","303947e4f79f68c5eb72ffaf1ac380913d929cb92cd1e4a5718bb4e147841fca"),
    "protectedNativeTransverse":(a.goal/global_cov/"live-transverse-replay.json","958080d2e9444fbea108d8c51404d878e41e1512ee03543882442412a7aad742"),
    "protectedCovariance":(a.goal/global_cov/"global-primary-covariance.json","05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e"),
    "protectedPrimary":(a.goal/primary/"primary-quotient-ledger.json","a72f12c82dd35106862cf6a874be1af79502a99d6de0e37e06db8794b66e5244"),
    "originalCutoffConstants":(a.goal/primary/"verify_primary_quotient.py","f54f5f4cecdbcb3fa6fe8297afba0d679b8b65c4aae62a852288ec616c09bb74"),
    "C106Frame15":(a.goal/"c106/frame15/frame-c15.json","09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8"),
    "C108SpatialL9":(a.goal/"c108/mode-one-late-mean/late-mode-one-mean.json","b01790ea041aa3a5ad4d998e61c52aceb7cb0dd40bd6a68282ae74b03639ad41"),
    "exactDemand":(a.requirements,"c483bbb141289f23dbaed8c7f3b4c123af778dfce6b06da5c11c1477ec66c0e3"),
}
s={}
for name,(path,want) in data.items():
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==want,path
    s[name]=runpy.run_path(str(path)) if path.suffix==".py" else json.loads(raw)

native=s["protectedReader"]["source_binding"](a.runtime,s["protectedNativeTransverse"],s["protectedPrimary"])
assert json.loads(json.dumps(native))==s["protectedCovariance"]["sameLiveCovariance"]
assert [r["LxiUpper"] for r in native["coverMatrices"]]==[1,3,9,27,81]
assert all(r["LvExact"]==0 for r in native["coverMatrices"])
assert native["slowDerivativeJacobian"]==["ratio^(1/2)","ratio^D","ratio"]

frame=s["C106Frame15"]
assert frame["matrixDirections"]==816 and frame["cutoffOrder"]==19
assert frame["uniformLogRanks"]==[20981,5949,270,956]
assert all(len(frame["catalogue"][name])>=16 for name in ("squareRootWeight","tangent"))
assert len(frame["catalogue"]["tangentV"])>=15
original=s["originalCutoffConstants"]["cutoff_constants"]
source=inspect.getsource(original)
assert source.count("maximum=9")==1
expanded={}
exec(compile(source.replace("maximum=9","maximum=19"),inspect.getfile(original),"exec"),original.__globals__,expanded)
full=expanded["cutoff_constants"]()
for key,value in original().items():
    if isinstance(value,list):
        assert full[key][:len(value)]==value
bump=list(map(int,full["bumpInDimensionlessOffset"]))
assert len(bump)==20 and all(bump[j]*2**(34*j)<2**1536 for j in range(20))

old=s["C108SpatialL9"]
assert old["pins"]["frame"]==data["C106Frame15"][1]
past={(r["component"],tuple(r["RZTL"])):r for r in old["newHighPrimaryCoefficients"]}
rows=[]
for field,q in s["exactDemand"]["L9PrimaryRows"]:
    chart=[r for r in native["sameLiveLocalBlocks"] if r["field"]==field.removeprefix("W_")]
    assert len(chart)==2 and sorted(r["sign"] for r in chart)==[-1,1]
    assert all(r["cutoffMonomials"]==[[1,1],[2,0]] for r in chart)
    assert q[3]==9 and sum(q[:3])<3
    if q[2]==0:
        assert past[field,tuple(q)]["potentialMaximumLOrder"]==10
    details=[]
    for factors in ((0,0),(0,1)):
        mass=0
        charges={}
        for a0 in range(q[3]+1):
            indices=(factors[0]+a0,factors[1]+q[3]-a0)
            binomial=comb(q[3],a0)
            mass+=binomial
            charges[indices]=binomial*bump[indices[0]]*bump[indices[1]]*2**(34*sum(indices))*81**q[3]
        assert mass==512
        details.append({"cutoffFactorsAtStart":factors,
                        "maximumChiDerivative":max(max(k) for k in charges),
                        "totalTransverseBinomialMass":mass,
                        "dimensionlessCoefficientBitLength":sum(charges.values()).bit_length()})
    assert max(r["maximumChiDerivative"] for r in details)==10
    assert all(r["dimensionlessCoefficientBitLength"]<2*1536+512 for r in details)
    rows.append({"component":field,"RZTL":q,"protectedBothSignBlocks":chart,"exactCutoffProductTransfer":details,
                 "maximumVelocityL":9,"maximumPotentialL":10,"slowFrameDerivativeNeeded":sum(q[:3])+1})

out={"schema":"MathScope.C130.OriginalPrimaryL9NativeTransverse/1",
     "status":"VERIFIED_NATIVE_SHAPE_AND_CONSTANTS_CONDITIONAL_ORIGINAL_FRAME",
     "pins":{k:h for k,(_,h) in data.items()},"requires":{"degreeCutoff":10,"degreeSlowFrame":3},
     "actualFrameCutoffOrder":19,"actualFrameRZTOrder":15,"sourceRows":rows,
     "scope":"L acts on the original transverse cutoff factors at fixed label and v. RZT acts on the smooth same-reference frame, guarded source and flat traces. The original cover contributes at most 81^L and no S or Laurent degree for L. The independent direct C118 gauge recurrence retains its own L8 limit."}
a.out.write_bytes((json.dumps(out,indent=2,sort_keys=True)+"\n").encode())
print("PASS six actual native Primary L9 seeds; original χχ' and χ²; maximum χ and potential L10; original C106 cutoff19 and RZT15")
