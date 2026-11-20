"""Replay the exact original mode-two formula on the additional late covariance directions."""

from argparse import ArgumentParser
from hashlib import sha256
from io import BytesIO
import inspect
import json
from pathlib import Path
import runpy
from types import SimpleNamespace


PINS={
    "program":"a8c68fb4b028df9c225ec153c73066252d8237c435bb62b114adbf198b76db49",
    "old":"c892d8878e0607117077f08c41b6d8d79f3e8729dc85bf79f35e346daf9cfa9e",
    "late":"e3a2f7903bc28324bb09f436fb0ff399ab56f334ef95362c64f715ca4cbc00f8",
}


def pinned(path,key):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],(path,key)
    return raw


def main(a):
    folder=a.goal/"c105/forced-mode-two-high"
    original=folder/"verify_forced_mode_two_high.py"
    pinned(original,"program")
    old=json.loads(pinned(folder/"forced-mode-two-high.json","old"))
    late=json.loads(pinned(a.demand,"late"))
    requested=set(map(tuple,late["directions"]))
    prior=set(map(tuple,old["directions"]))
    assert len(requested)==79 and len(requested-prior)==43
    # All transverse derivatives act only on the source transverse
    # factors. The raw modes have one additional ordinary field derivative.
    assert max(d[2] for d in requested)==6 and max(d[2]+1 for d in requested)<=8
    table=runpy.run_path(str(original))
    main_code=inspect.getsource(table["main"])
    old_call="    by_cov, directions = signed_directions(signed,demand)"
    assert main_code.count(old_call)==1
    main_code=main_code.replace(old_call,old_call+"\n    directions = tuple(sorted(set(directions) | LATE))")
    ns={}
    exec(compile(main_code,str(original),"exec"),{**table["main"].__globals__,"LATE":requested},ns)
    output=BytesIO()
    ns["main"](SimpleNamespace(goal=a.goal,frame=a.goal/"c104/frame13/selected-frame-c13.json",
        signed=a.goal/"c103/signed-high/signed-high-upstream.json",
        demand=a.goal/"c105/forced-mode-one-high/forced-gauge-demand.json",
        out=SimpleNamespace(write_bytes=output.write)))
    result=json.loads(output.getvalue())
    assert set(map(tuple,result["directions"]))==requested|prior
    for key in ("raw","native","conditionalGaugeRows"):
        assert [row for row in result[key] if tuple(row["RZL"]) in prior]==old[key],key
    selected=[row for row in result["conditionalGaugeRows"] if tuple(row["RZL"]) in requested]
    assert len(selected)==79 and max(row["gaugeAfterCarrierFactorRemoved"]["outerPoleAfterZeta"] for row in selected)<=39
    assert max(sum(row["gaugeAfterCarrierFactorRemoved"]["positiveLogRanks"]) for row in selected)<2**16
    result.update(schema="MathScope.C107.OriginalModeTwoLateCovarianceGaugeDirections/1",
                  status="VERIFIED_ORIGINAL_MODE_TWO_DIRECTION_EXTENSION_CONDITIONAL_TARGET_AND_CHART",
                  extraPins=PINS, totalCombinedDirections=len(prior|requested),oldGaugeRowsIdentical=True,
                  directions=sorted(requested), conditionalGaugeRows=selected,
                  raw=[row for row in result["raw"] if tuple(row["RZL"]) in requested],
                  native=[row for row in result["native"] if tuple(row["RZL"]) in requested])
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS original mode two on all 79 late directions, with 43 additional native requests")


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("goal","demand","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
