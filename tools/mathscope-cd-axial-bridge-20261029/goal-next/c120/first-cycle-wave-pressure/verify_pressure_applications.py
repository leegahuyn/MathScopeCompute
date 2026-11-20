"""Bind original raw Repeat W pressure calls and every archived actual tuple."""
from argparse import ArgumentParser
from collections import Counter
from functools import cache
from hashlib import sha256
import gzip
import json
from pathlib import Path


AR="continuation71/stage2-delta/verified"
HO="continuation70/hosted-44582875351"
PINS={
 "active":(f"{HO}/active-n3-repeat-forced-candidate.json","20e3cb1dbf4d4af9ec8548c027f29e5c5225091012d6b0ae33fa6cce320be4ca"),
 "candidate":(f"{AR}/recovered-original/post-five-repeat-forced-candidate.json","43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf"),
 "registry":(f"{AR}/recovered-original/original-source-functions.json","5d8a751e5ad4b5d2bd4efa5a1f285dc465b0a5b19b3e0bbf8113f160bb582920"),
 "append":(f"{AR}/append-packet/repeat-appended-nodes.jsonl.gz","f0f90223c0230ab38f7316186d5a5e3a7df7e19aab78a97d6a172e9cdaf61719"),
 "seal":(f"{AR}/append-packet/repeat-append-seal.json","b9c7e7079cc9ea4dc559dc167462c3e9f64c496910810ecbb93b0f201b1734e1"),
 "frontier":("continuation120/active-repeat-radial-frontier/repeat-radial-operands.json","d17ce2cd317c62775c5208b2c75efab78a6e962f2c4539c2da1091c92a3e17c7"),
}
SLOTS={():"value",(1,):"R",(2,):"Z",(7,):"Y0",(8,):"Y1"}


def read(work,key):
    rel,sha=PINS[key]
    raw=(work/rel).read_bytes()
    assert sha256(raw).hexdigest()==sha,key
    return raw if key=="append" else json.loads(raw)


def main(a):
    archive=read(a.work,"candidate")
    active=read(a.work,"active")
    assert active["mode"]=="metadata"
    defs={row["id"]:row for row in json.loads(read(a.work,"registry")["definitions"])[0]}
    blob=gzip.decompress(read(a.work,"append"))
    seal=read(a.work,"seal")
    assert sha256(blob).hexdigest()==seal["appendedNodeRecordsSHA256"]
    first=seal["baseNodeCount"]
    assert first==4456994
    suffix=[json.loads(line) for line in blob.splitlines()]
    assert len(suffix)==225012
    assert active["preRepeatNodeCount"]==22155584 and active["postRepeatNodeCount"]==22380596
    active_roots={}
    report=[]
    archive_nodes=set()
    for ar,live in zip(archive["templates"],active["templates"],strict=True):
        key=ar["key"]
        assert live["key"]==key
        tag=f"PostFiveRepeatWave_{key}_"
        pressure={owner:df for owner,df in defs.items() if df["name"].startswith(tag) and df["name"].split("_")[-2]=="3"}
        assert len(pressure)==4
        for kind,template,offset in (("archive",ar,0),("active",live,14)):
            seen={}
            for leaf in template["rawSupport"]["waveJets"]:
                owner=f"coupled-expression:{int(leaf['system'].split(':')[1])-offset}"
                if owner not in pressure:
                    continue
                df=pressure[owner]
                assert len(df["parameters"])==len(leaf["orders"]), (kind,key,df["name"],len(df["parameters"]),len(leaf["orders"]))
                assert set(leaf["orders"])<={0,1}
                slot=SLOTS[tuple(i for i,x in enumerate(leaf["orders"]) if x)]
                body=leaf["actualBody"]
                seen.setdefault(owner,{"body":body,"slots":set(),"owner":leaf["system"]})
                assert seen[owner]["body"]==body
                seen[owner]["slots"].add(slot)
            assert set(seen)==set(pressure)
            assert all(set(item["slots"])==set(SLOTS.values()) for item in seen.values())
            if kind=="active":
                for owner,item in seen.items():
                    mode,_,part=pressure[owner]["name"].removeprefix(tag).split("_")
                    active_roots[key,int(mode),part]=item["body"]
                    report.append({"chart":key,"mode":int(mode),"part":part,"activeOwner":item["owner"],
                                   "activeBody":item["body"],"archivedOwner":owner,
                                   "archivedFormalTuple":pressure[owner]["parameters"],
                                   "fiveOriginalDerivativeSlots":sorted(item["slots"])})
        @cache
        def calls(i):
            if i<first:
                return frozenset()
            row=suffix[i-first]
            op,args=row["op"],row["args"]
            if op=="m3_coupled_expression_partial":
                owner,actual,orders=args
                if owner not in pressure:
                    return frozenset()
                assert actual==pressure[owner]["parameters"]
                slot=SLOTS[tuple(j for j,x in enumerate(orders) if x)]
                assert set(orders)<={0,1}
                mode,_,part=pressure[owner]["name"].removeprefix(tag).split("_")
                archive_nodes.add(i)
                return frozenset({(int(mode),part,slot)})
            assert op in ("add","multiply")
            return frozenset().union(*(calls(x) for x in args))
        for row in ar["rows"]:
            m=row["m"]
            for axis,vector in enumerate(row["raw"]):
                for part,i in vector.items():
                    if m in (3,4):
                        expect=set()
                    else:
                        opposite="imaginary" if part=="real" else "real"
                        expect={(m,opposite,"value")}
                        ordinary={0:{"R","Y0","Y1"},1:set(),2:{"Z"}}[axis]
                        expect|={(m,part,name) for name in ordinary}
                    assert calls(i)==expect,(key,m,axis,part,calls(i),expect)
    assert len(report)==len(active_roots)==40
    assert len(archive_nodes)==200
    actual=read(a.work,"frontier")["protectedModeTwoPressure"]
    assert len(actual)==20
    assert all(active_roots[x["chart"],2,x["part"]]==x["actualModeTwoPressure"] for x in actual)
    answer={"schema":"MathScope.C120.ExactRepeatPressureApplicationRouting/1",
      "status":"VERIFIED_ARCHIVED_NATIVE_APPLICATIONS_AND_ACTIVE_PROTECTED_BODY_READBACK",
      "pins":{k:v[1] for k,v in PINS.items()},
      "activePressureWrappers":report,"archivedExactPressureApplyNodes":sorted(archive_nodes),
      "archivedPressureRowsForModes":[1,2],"archivedNoPressureRowsForModes":[3,4],
      "sourceSlotsPerPressureWrapper":len(SLOTS),
      "scope":"Archived materialized raw applications and active protected pressure body/direction metadata. The same-run materialized active raw append remains a separate readback.",
      "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(answer,indent=2,ensure_ascii=False)+"\n").encode())
    print("PASS 200 exact archived W pressure applications; 40 active protected pressure capsule directions; all 240 raw scalar routing identities")


if __name__=="__main__":
    p=ArgumentParser()
    for key in ("work","out"):
        p.add_argument(f"--{key}",type=Path,required=True)
    main(p.parse_args())
