"""Cross-check all 34 independently computed compact inputs of the high Sigma join."""
from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
from fractions import Fraction as Q

PINS={
    "sigma":("continuation128/sigma-high-time/sigma-high-time.json","c09bf88e3ad65ecf9b5f21e25fe229469cd3e491bacb2dd0ee5ead4627d6ef00"),
    "dependency":("continuation127/late-wrz-sigma-dependencies/late-wrz-sigma-dependencies.json",
                  "79d91f601780ea4bf9696927d60529f5ce11cfc868fafa1d0193ada978b37d36"),
    "compact":("continuation128/compact-pressure-coverage/coverage.json",
               "3ac0131ed8c4082dd3be8b25797c818114b3c8a0cd81837927ae52066529aeb6"),
}


def main(work):
    all_data={}
    for key,(rel,digest) in PINS.items():
        raw=(work/rel).read_bytes()
        assert sha256(raw).hexdigest()==digest,key
        all_data[key]=json.loads(raw)
    sigma,dep,compact=(all_data[k] for k in ("sigma","dependency","compact"))
    assert sigma["sourceEndpoints"]==dep["fixedEndpoints"]==compact["fixedEndpoints"]
    assert compact["status"]=="CONDITIONAL_ALL_34_SOURCE_BOUND_COMPACT_MEAN_ROWS"
    used={(f,tuple(j)) for values in sigma["regions"].values()
          for tr in values["sourceTrace"].values() for f,j in tr["compactMean"]}
    wanted={(f,tuple(a)) for f,a in dep["newCompactMeanAllOrders"]}
    booked={(r["field"],tuple(r["RZT"])):r for r in compact["rows"]}
    tt={(f,tuple(a)) for f,a in dep["newCompactMeanSecondTimeOnly"]}
    assert set(booked)==wanted and wanted<=used and len(wanted)==34
    assert len(tt)==6
    for key,row in booked.items():
        f,a=key
        assert Q(row["epsilonPower"])==(2 if f=="beta" else 1)
        assert Q(row["bandPower"])==(Q(7,2) if f=="beta" else Q(1,2))+3*sum(a)
        assert row["unweightedCoefficientHOver2Pow128"]==59326
        assert row["oneGaussianCoefficientHOver2Pow128"]==59327
        assert row["oneGaussianCoefficientHOver2Pow128"] <= (61386 if key in tt else 59328)
        assert row["independentHighTTWitness"]==(key in tt)
    return {"status":"PASS_ALL_34_INDEPENDENT_COMPACT_BOUNDS_FIT_ORIGINAL_SIGMA_TRANSFERS",
            "pins":PINS,"exactNewRoles":sorted(wanted),"separateSecondTimeRoles":sorted(tt)}


if __name__=="__main__":
    parser=ArgumentParser()
    for key in ("work","out"):
        parser.add_argument("--"+key,type=Path,required=True)
    args=parser.parse_args()
    result=main(args.work)
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print(result["status"])
