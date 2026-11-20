"""Calculate the original initial-mean inputs of the late Temporal velocity time paths."""
from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import runpy
from types import FunctionType


def verified(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected, path
    return raw


p = ArgumentParser(description=__doc__)
for name in ("work","goal","runtime","frontier","out"):
    p.add_argument("--"+name, required=True, type=Path)
a=p.parse_args()
frontier_pin="d1ee3fa60dc761433c04659ccc73cce9292dc9955560b42f7d424831502b1332"
frontier=json.loads(verified(a.frontier,frontier_pin))
requests=sorted((name,tuple(q)) for name,q in frontier["combinedOldMean"])
assert len(requests)==len(set(requests))==172
assert len(frontier["combinedOldNotInPinnedReceipts"])==24
source=a.work/"continuation118/mode-one-signed-time/final/verify_mode_one_signed_time.py"
source_pin="ab13665bf50b8e9da1b8da475b09b9f82ad196751cf0b3a92aed6f6eef028501"
verified(source,source_pin)
pre=runpy.run_path(str(source))
src={k:pre["read"](getattr(a,t)/rel,pin) for k,(t,rel,pin) in pre["PINS"].items()}
gauge=src["gaugeCode"]
cap={k:gauge["read"](a.work,k) for k in gauge["PINS"]}
inputs=cap["timeProgram"]["load"]({"work":a.work,"runtime":a.runtime})
cap["timeProgram"]["check_sources"](inputs)
assert inputs["frame"]["matrixDirections"]==816
src["frame15"]={"primaryUniformLogRanks":inputs["frame"]["uniformLogRanks"]}
geometry=a.work/"continuation106/high-compact-mode-one/compact-mode-one-c15.json"
geometry_pin="00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884"
high_compact=json.loads(verified(geometry,geometry_pin))
assert high_compact["cutoff"]["order"]==13
assert high_compact["compactMomentMaximumZT"]=={"P":10,"Jz":10,"Jtheta":11}
src["cutoffs"]={**src["cutoffs"],"extendedCutoffGeometry":high_compact["cutoff"]}
adapt=pre["adapt"]
src["compactCode"]["compact_budget"]=adapt(src["compactCode"]["compact_budget"],[
    ("max_order=7","max_order=10"),
    ("assert max(g.values())<256","assert max(g.values())<512"),
    ("bell[-1]==877","bell[-1]==115975"),
    ("x in bump)<64","x in bump)<128"),
    ("+7*(5+gs)","+max_order*(5+gs)"),
    ('"FaadiBrunoPartitionCountAtSeven"','"FaadiBrunoPartitionCountAtTen"'),
    ('"linearCompactCovarianceUsesOnlyC7":True','"linearCompactCovarianceUsesSameHighSource":True'),
])
original_mean_pin="7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe"

def mean_input(path):
    if path.name!="verify_initialized_mean.py":
        return runpy.run_path(str(path))
    verified(path,original_mean_pin)
    module=runpy.run_path(str(path))
    module["high_covariance_rows"]=adapt(module["high_covariance_rows"],[
        ("assert j<=10","assert j<=13"),
        ("outer_cost<2**23 and inner_cost<2**54","outer_cost<2**33 and inner_cost<2**75"),
        ("cover.bit_length()+54","cover.bit_length()+(75 if j==13 else 66 if j==12 else 63 if j==11 else 54)"),
    ])
    return module

means=adapt(pre["mean_packet"],[
    ("d[name]=runpy.run_path(str(p)) if","d[name]=mean_input(p) if"),
    ("assert not any(is_high(x) for x in linear)",
     "assert all(sum(idx[:3])<=10 and idx[3]==0 for name,idx in linear), sorted(linear)"),
    ('},low_rank,high_rank,src["cutoffs"]','},max(low_rank,high_rank),high_rank,src["cutoffs"]'),
    ('compact["compactChargeInHOver2Pow128"]==28589','compact["compactChargeInHOver2Pow128"]<2**16'),
    ('high=d["c103Program"]["high_covariance_rows"](high_set,src["frame11"])',
     'high=d["c103Program"]["high_covariance_rows"]({k for k in high_set if sum(k[1][:3])<=9},src["frame11"])+d["c103Program"]["high_covariance_rows"]({k for k in high_set if 10<=sum(k[1][:3])<=13},src["frame15"])\n    assert len(high)==len(high_set), sorted(high_set - {(r["component"],r["RZTL"]) for r in high})'),
])
means=FunctionType(means.__code__,{**means.__globals__,"mean_input":mean_input})
direct, compact, evidence=means(a,src,requests)
for region in ("inner","outer","middle"):
    assert sorted((row["field"],tuple(row["RZTL"])) for row in direct[region])==requests
assert all(max(map(sum,orders))<=10 for orders in evidence["compactMomentOrders"].values())
assert len(evidence["exactHighSeeds"])>0
assert max(row["primaryMaximumOrdinarySlowOrder"] for row in evidence["exactHighSeeds"])<=15
assert max(row["potentialMaximumLOrder"] for row in evidence["exactHighSeeds"])<=8
result={
    "schema":"MathScope.C129.LateTemporalVelocityInitializedMeanInputs/1",
    "status":"CONDITIONAL_ORIGINAL_INITIALIZED_MEAN_INPUTS",
    "pins":{"originalClaim":frontier_pin,"oldArithmetic":source_pin,"C106OriginalChart":geometry_pin,
            "originalInitializedMean":original_mean_pin},
    "requiredCount":172,"additionalAgainstPriorFrontierPins":24,
    "originalDirectionTable":direct,"compactProfile":compact,"evidence":evidence,
    "premises":["Original jointly admitted fixed labels and ordinary mixed profiles.",
                "Exact source positivity, flat guards and the original shifted and Fourier path estimates."],
    "open":["Post-Signed covariance and late Temporal centered inverse are checked independently.",
            "The complete late velocity, the FiveMap correction and final jet tests require separate evidence."],
    "finalJets":0,"release":"HOLD",
}
a.out.write_bytes((json.dumps(result,indent=2,sort_keys=True)+"\n").encode())
print("PASS all 172 original mean requests, 24 beyond earlier pins", direct["common"],compact["compactChargeInHOver2Pow128"])
