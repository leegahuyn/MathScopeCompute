"""Check the last four original Y bounds under an explicit external admission premise."""

import argparse
from hashlib import sha256
import json
from pathlib import Path
import runpy


PINS = {
    "lexical": "44d4cfc6b21e16259e3fceac38926c77dc02f5f9d22c5687004af1c915a0529c",
    "branch": "f5446354bf5f9df694cce63035e4b2fc5779d1288e0f97c6c0acdc65d55187fe",
    "transfer": "f94ee642ab9ff739b4f9e7a87b6faa3c6d33acf5077027803e86ee7993cfe7fb",
    "baseline": "4b2bd7263c3b0c77c39b72262f14715c20f8771b588a8316c77dbc98a27bae4b",
    "frontier": "31f151667e4161e3790e8628642d07d2afef607b2acfdf9235c708a68ca0741a",
    "reached": "5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459",
    "registry": "bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e",
    "profile": "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a",
}
FINAL=[4758,4784,5177,5299]
ASSUMPTION={
    "schema":"MathScope.C148.ExternalOriginalInverseAdmissionAssumption/1",
    "quantifier":"every actually used original first-FiveMap lexical frame",
    "nativeCall":622820,"nativeSystem":2,"actualOperands":[622803,622804],
    "originalBracketNodes":[19,24],"originalBracket":["1/2","2"],
    "assumeDefinedInBracket":True,"independentAdmissionEvidenceSupplied":False,
}


def pinned(path,key):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],key
    return raw


def authenticate_inverse(nodes,system):
    assert system["name"]=="ActualCommonBandSlowInverse"
    assert (system["body"],system["variable"],system["parameters"])==(622819,622810,[622803,622804])
    assert (system["left"],system["right"],system["derivativeLower"],system["derivativeUpper"])==(19,24,19,1)
    assert system["numericOracle"] is False
    shape={
        9:("source_parameter",["h"]),19:("rational",["1","2"]),
        20:("rational",["-1","1"]),24:("rational",["2","1"]),25:("multiply",[9,24]),
        622811:("integer_power",[622803,2]),622812:("log_positive",[622810]),
        622813:("multiply",[25,622812]),622814:("exp",[622813]),
        622815:("multiply",[622811,622814]),622816:("multiply",[20,622815]),
        622817:("add",[622810,622816]),622818:("multiply",[20,622804]),
        622819:("add",[622817,622818]),622820:("actual_monotone_root",[2,622803,622804]),
        622821:("integer_power",[622802,2]),622822:("multiply",[24,622820]),
        622823:("inverse",[622822]),622824:("multiply",[622821,622823]),
        633728:("integer_power",[633709,2]),634081:("multiply",[622823,633728]),
    }
    for i,(op,args) in shape.items():
        assert nodes[i]=={"op":op,"args":args},i


def run(a):
    for key in ("lexical","branch","transfer"):
        pinned(getattr(a,key),key)
    lexical=runpy.run_path(str(a.lexical))
    ranges=runpy.run_path(str(a.branch))["BranchRanges"]
    transfer=runpy.run_path(str(a.transfer))
    baseline=json.loads(pinned(a.baseline,"baseline"))
    assert baseline["localRadialEvidenceCount"]==519 and baseline["openNominalIds"]==FINAL
    source=json.loads(pinned(a.reached,"reached"))
    nodes=dict(source["nodes"])
    lexical["authenticate_stream"](a.stream,nodes)
    lexical["validate_profile"](pinned(a.profile,"profile"),nodes)
    assert source["roots"]==lexical["ROOTS"]
    orig=json.loads(pinned(a.registry,"registry"))["base"]["base"]
    registry=json.loads(orig["expression"]),json.loads(orig["monotone"])
    authenticate_inverse(nodes,registry[1][2])
    parsed=json.loads(a.assumption.read_bytes())
    assert parsed==ASSUMPTION
    assert parsed["independentAdmissionEvidenceSupplied"] is False

    frontier=json.loads(pinned(a.frontier,"frontier"))
    rows=[r for r in frontier["remainingOriginalRows"] if r["id"] in FINAL]
    assert [r["id"] for r in rows]==FINAL
    for r in rows:
        assert r["y"]==4757 and nodes[r["id"]]=={
            "op":"actual_natural_series","args":[r["component"],4757,r["eta"],r["k"],r["m"]],
        }
    ordinary={i:tuple(lexical["operands"](n["op"],n["args"])) for i,n in nodes.items()}
    bodies=dict(source["sourceBodies"])
    assert {j for js in bodies.values() for j in js}==set(source["entries"])
    native={}
    edges={}
    for i,n in nodes.items():
        arms=tuple(bodies.get(i,()))
        edges[i]=ordinary[i]+arms
        for slot,body in enumerate(arms,len(ordinary[i])):
            native[i,slot]=transfer["binding_rules"](n,body,registry,nodes)
    assert all(j<i and j in nodes for i,children in edges.items() for j in children)
    assert not any(v for (i,_),v in native.items() if i==622820)

    # Only these exact historical nodes receive the assumed sign. In particular,
    # every other system 2 occurrence retains the ordinary C147 treatment.
    class UnderExternalAdmission(ranges):
        def normal(self,kind,i):
            if kind in ("nn","pos") and i in (622820,622822,622823):
                return True
            if kind=="nn" and i in (622824,634081):
                return True
            return super().normal(kind,i)

    def check(cls):
        proof=cls(nodes,ordinary,set(source["roots"]),source_signs=True)
        return transfer["walk"](proof,edges,native,nodes,4757,rows,transfer="all")

    negative=check(ranges)
    assert negative["openUpper"]==[] and negative["openLower"]==FINAL
    conditional=check(UnderExternalAdmission)
    assert conditional["openUpper"]==conditional["openLower"]==[]
    return {
        "schema":"MathScope.C148.ConditionalLastFourOriginalYRanges/1","pins":PINS,
        "exactOriginalRows":rows,"verifiedBaselineWithoutExternalAdmission":519,
        "conditionalTotal":523,"explicitExternalAssumption":parsed,
        "negativeControlWithoutPremise":negative,"positiveUnderPremise":conditional,
        "originalRootBody":"s - Z^2*exp(2*h*log(s)) - T, original AST #622819",
        "originalSquaresRequireOnlyBracketPositivity":[622824,634081],
        "unrestrictedGlobalChartCertified":False,"publishedLedgerUpdated":False,
        "finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    p=argparse.ArgumentParser(description=__doc__)
    for key in (*PINS,"assumption","stream","output"):
        p.add_argument(key,type=Path)
    a=p.parse_args()
    answer=run(a)
    a.output.write_bytes((json.dumps(answer,sort_keys=True,indent=2)+"\n").encode())
