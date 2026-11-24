"""Compare native registered expressions with the independent reconstructed wave data."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from functools import cache
from hashlib import sha256
import json
from pathlib import Path

BASE=22380596
N_A="622c11be9a484374a504bda29ec9d1216a4641c130333305b339de506b7fbcaa"
N_D="9ea1a0768973c3f57761d7131291000743a0d7a1dc82b46b3fa7fa11da9af6be"
O_A="3d0538045a0927ac3389281222d346139fa8c9647a061372dd4177696bab859f"
O_D="83dc44c8062e33fa36a0ed26852ff261ecb7fba426e3733c6edb9c9ef4aa1a73"

def read(path,h):
    d=path.read_bytes()
    assert sha256(d).hexdigest()==h,path
    return d

def normal(items):
    return tuple(sorted((k,v) for k,v in items.items() if v))

def plus(arr):
    ts=Counter()
    for item in arr:
        ts.update(dict(item))
    return normal(ts)

def times(a,b):
    ts=Counter()
    for k,v in a:
        for l,w in b:
            ts[tuple(sorted((*k,*l)))]+=v*w
    return normal(ts)

def comparison(native,offline,recorded,output):
    r=json.loads(recorded.read_bytes())
    nodes={int(k):v for k,v in r["records"].items()}
    shared=set(r["nativeDirect"])&set(r["offlineDirect"])
    rows=[
        [json.loads(x) for x in read(native/"active-repeat-indexed-append.jsonl",N_A).splitlines()],
        [json.loads(x) for x in read(offline/"offline-replay1-offline-append.jsonl",O_A).splitlines()],
    ]
    defs=[
        json.loads(read(native/"active-repeat-indexed-definitions.json",N_D)),
        json.loads(read(offline/"offline-replay1-offline-definitions.json",O_D)),
    ]
    intern={}
    annotation={}
    missing=set()

    def atom(key):
        if key not in intern:
            i=len(intern)+1
            intern[key]=i
            annotation[i]=key
        return (((intern[key],),Fraction(1)),)

    @cache
    def canon(side,i):
        r=rows[side][i-BASE] if i>=BASE else nodes.get(i)
        if r is None:
            missing.add(i)
            return atom(("old",i))
        op=r["op"]; args=r["args"]
        if op=="rational":
            v=Fraction(int(args[0]),int(args[1]))
            return (((),v),) if v else ()
        if i<BASE and i in shared:
            return atom(("old",i))
        def c(x):
            return canon(side,x)
        if op=="add":
            return plus(c(x) for x in args)
        if op=="multiply":
            assert len(args)==2
            return times(c(args[0]),c(args[1]))
        if op in {"cosine","sine"}:
            arg=c(args[0])
            if not arg:
                return (((),Fraction(1)),) if op=="cosine" else ()
            negative=arg[0][1]<0
            if negative:
                arg=tuple((k,-v) for k,v in arg)
            value=atom((op,arg))
            if negative and op=="sine":
                value=tuple((k,-v) for k,v in value)
            return value
        if op in {"inverse","exp","log_positive","sqrt_positive","integer_power","ceiling"}:
            return atom((op,c(args[0]),*args[1:]))
        if op=="smooth_piecewise":
            return atom((op,*(c(a) for a in args)))
        if op.endswith("_partial"):
            assert len(args)==3,(side,i,r)
            return atom((op,args[0],tuple(c(x) for x in args[1]),tuple(args[2])))
        if i<BASE:
            return atom(("old",i))
        assert op=="coordinate", (i,op)
        return atom(("new-coordinate",*args))

    left,right=defs
    different=[]
    for a,b in zip(left["expressions"],right["expressions"],strict=True):
        assert {n:v for n,v in a.items() if n!="body"}=={n:v for n,v in b.items() if n!="body"}
        ca,cb=canon(0,a["body"]),canon(1,b["body"])
        if ca!=cb:
            diff=sorted(set(ca)^set(cb))
            nd=diff[:6]
            print("MISMATCH",a["id"],a["body"],b["body"],len(ca),len(cb),len(diff))
            def trace(pa,pb,depth=0):
                if depth>=10:return
                if len(pa)==len(pb)==1 and len(pa[0][0])==len(pb[0][0])==1:
                    aa=annotation[pa[0][0][0]]; bb=annotation[pb[0][0][0]]
                    if aa[0]==bb[0]=="smooth_piecewise":
                        for pos,(ap,bp) in enumerate(zip(aa[1:],bb[1:],strict=True)):
                            if ap != bp:
                                print("branch",depth,pos)
                                trace(ap,bp,depth+1)
                        return
                for arr,other,tag in [(pa,pb,"native"),(pb,pa,"offline")]:
                    delta=set(arr)-set(other)
                    print(tag,"number differing",len(delta))
                    for k,v in sorted(delta)[:3]:
                        print(v,repr([annotation[x] for x in k])[:1200])
            if not different:
                trace(ca,cb)
            different.append((a["id"],a["body"],b["body"]))
    if different:
        print("simple atoms", {i:annotation.get(i) for i in [12,13,14,19,49,128,161]})
        print("missing prefix nodes",sorted(missing)[:75],len(missing))
        raise AssertionError(different)
    fields=0
    for a,b in zip(left["fields"],right["fields"],strict=True):
        assert {n:v for n,v in a.items() if n!="rows"}=={n:v for n,v in b.items() if n!="rows"}
        for r,s in zip(a["rows"],b["rows"],strict=True):
            assert {n:v for n,v in r.items() if n!="localBody"}=={n:v for n,v in s.items() if n!="localBody"}
            assert canon(0,r["localBody"])==canon(1,s["localBody"])
            fields+=1
    assert fields==648
    output.write_text(json.dumps({"math":"EXACT_RING_AND_TYPED_BRANCH_EQUIVALENCE_OF_NATIVE_AND_C147_WAVE",
        "expressions":16,"indexedRows":fields,"frozenLabelAndDerivativeDirectionsPreserved":True,
        "atomCount":len(intern),"opaqueUnparsedNodes":len(missing),
        "ordinaryGlobalGluing":"OPEN","release":"HOLD"},indent=2)+"\n",encoding="utf-8")
    print(output.read_text())

if __name__=="__main__":
    parser=ArgumentParser(description=__doc__)
    for n in ("native","offline","recorded","output"):
        parser.add_argument(n,type=Path)
    ns=parser.parse_args()
    comparison(ns.native,ns.offline,ns.recorded,ns.output)
