"""Extract the genuine C106 pulse matrix degree-nine ledger with the C89 prefix intact."""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import runpy
from types import SimpleNamespace

PINS={
    "program":("continuation106/frame15/verify_frame_c15.py",
               "6018cacecb6b5f5c5a3282091e379e6fa32e5b799c7ce767885bec77f690b219"),
    "chart":("continuation106/background16/final/chart16.json",
             "ba0830ec36ca4dcd8c7c9709e868a4523b938afc4ed0c97cb9ddbfbb160b823c"),
    "frame":("continuation106/frame15/frame-c15.json",
             "09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8"),
    "old":("continuation89/matrix/final/matrix-s-j.json",
           "e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36"),
}


def read(path,expected):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==expected,path
    return json.loads(raw) if path.suffix==".json" else raw


def main(a):
    paths={k:a.work/name for k,(name,_) in PINS.items()}
    inputs={k:read(paths[k],digest) for k,(_,digest) in PINS.items()}
    recipe=runpy.run_path(str(paths["program"]))
    context=SimpleNamespace(goal=a.goal,chart14=paths["chart"])
    coefficient_recurrence,prior=recipe["frame15"](context)
    matrix,catalog,band,cutoff,gaussian,ranks=coefficient_recurrence(context)
    asjson=lambda x:json.loads(json.dumps(x))
    assert matrix["distinctMixedMultiIndicesAudited"]==inputs["frame"]["matrixDirections"]==816
    assert asjson(ranks)==inputs["frame"]["uniformLogRanks"]
    assert asjson(catalog)==inputs["frame"]["catalogue"]
    assert asjson(gaussian)==inputs["frame"]["gaussians"]
    assert cutoff["maximumOrdinaryOrder"]==inputs["frame"]["cutoffOrder"]==19
    before=inputs["old"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    actual=matrix["exactDerivativeLedgers"]
    assert set(before)==set(actual)
    assert all(len(rows)==9 and asjson(actual[key][:9])==rows for key,rows in before.items())
    used={key:asjson(rows[:10]) for key,rows in actual.items()}
    assert all(len(rows)==10 and rows[-1][-1]<=9 for rows in used.values())
    return {"schema":"MathScope.C131.OriginalC106PulseMatrixOrderNine/1",
            "status":"VERIFIED_EXISTING_EXACT_C106_ORDINARY_MATRIX_EXTENSION",
            "pins":PINS,"allRZTMatrixAuditCount":816,"oldC89ExactPrefixRows":9,
            "maximumSuppliedOrder":9,"exactDerivativeLedgers":used}


if __name__=="__main__":
    p=argparse.ArgumentParser()
    for key in ("work","goal","out"):
        p.add_argument("--"+key,type=Path,required=True)
    a=p.parse_args()
    j=main(a)
    a.out.write_bytes((json.dumps(j,indent=2)+"\n").encode())
    print(j["status"],j["maximumSuppliedOrder"])
