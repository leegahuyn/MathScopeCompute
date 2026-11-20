"""Replay the complete typed high covariance selection using the original C101 frame caps."""
from argparse import ArgumentParser
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy


def read(path, expected):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==expected,path
    return json.loads(raw)


def main(a):
    prior=read(a.frame,"5c66c394ca8ae4bf1d347628d4045e8aaf402b0e1895413b8f0ac5a829698603")
    crop=read(a.crop,"870ddc91570d4094896192360bd23dfe0b7391f95346c46a07b0072017252daf")
    source=runpy.run_path(str(a.program))
    select=source["selected"]
    raw=inspect.getsource(select)
    assert raw.count('assert len(demand) == 8')==raw.count('demand.extend(("W_rz",(0,10,l)) for l in (0,2))')==1
    text=raw.replace('assert len(demand) == 8 and {rzl[1] for _,rzl in demand} == {8,9}',
                     'assert len(demand) == 18 and {rzl[1] for _,rzl in demand} == {8,9,10}')
    text=text.replace('    demand.extend(("W_rz",(0,10,l)) for l in (0,2))\n','')
    assert text!=raw
    namespace={}
    exec(compile(text,inspect.getfile(select),"exec"),select.__globals__,namespace)
    native=crop["derivativeInventory"]["remainingSufficientNewCovarianceRequests"]
    old={ (r["component"],tuple(r["RZL"])):r for r in prior["selectedRows"]}
    witness=read(a.witness,"20399ca0d83b4565d5c9ef8189479fc80e0ac7fd808a1c63a70cabb1168dcf20")
    rows=namespace["selected"]({"crop":{"remainingSufficientNewTemporalCovarianceRows":native}},
                               witness,prior["primaryUniformLogRanks"])
    combined={ (r["component"],tuple(r["RZL"])):r for r in rows}
    assert {k:combined[k] for k in old} == old
    extra=sorted(set(combined)-set(old))
    assert extra==[(name,tuple(coord)) for name,coord in crop["derivativeInventory"]["outsidePreviousC101Ten"]]
    assert len(rows)==18 and len(extra)==8
    assert max(row["primaryMaximumSlowOrder"] for row in rows)==11
    assert all(row["coefficientLogCap"]=="H/2^112" for row in rows)
    result={
      "status":"VERIFIED_COMPLETE_TYPED_HIGH_SELECTION_CONDITIONAL_ON_ORIGINAL_CHART_AND_GRAM",
      "rows":rows,"additionalEight":extra,"earlierTenRecoveredExactly":True,
      "premise":"Apply the C101 archived physical background, matched target and normalized original frame on every shifted path.",
      "open":["Whole native Temporal and Forced estimates", "N7-06/N8-05 and final jets"],"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS all 18 compact-plus-Temporal rows fit C101 background and Primary finite budgets")


if __name__=="__main__":
    assert __debug__
    cli=ArgumentParser(description=__doc__)
    for key in ("frame","crop","program","witness","out"):
        cli.add_argument("--"+key,type=Path,required=True)
    main(cli.parse_args())
