"""Forward native-argument sign proof for the original First FiveMap."""

import argparse
from collections import defaultdict
from hashlib import sha256
import json
from pathlib import Path
import runpy


PINS = {
    "lexical": "44d4cfc6b21e16259e3fceac38926c77dc02f5f9d22c5687004af1c915a0529c",
    "branch": "f5446354bf5f9df694cce63035e4b2fc5779d1288e0f97c6c0acdc65d55187fe",
    "frontier": "31f151667e4161e3790e8628642d07d2afef607b2acfdf9235c708a68ca0741a",
    "reached": "5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459",
    "registry": "bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e",
    "profile": "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a",
    "runtime": "326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311",
}
FINAL_FOUR={4758,4784,5177,5299}
NEW_EIGHT={6518,6525,6533,6782,6790,6829,6904,7115}


def pinned(path,key):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],key
    return raw


def binding_rules(app,body,registry,nodes):
    """Decode only the actual registered owner/actual pair for this body."""
    op,a=app["op"],app["args"]
    expressions, monotones=registry
    if op=="actual_expression_partial":
        definition=expressions[a[0]]
        if definition["body"]!=body:
            return ()
        actuals=a[1]
        assert len(a[2])==len(actuals)==len(definition["derivativeLimits"])
        assert all(0<=order<=cap for order,cap in zip(a[2],definition["derivativeLimits"]))
    elif op=="actual_monotone_root" and a[0] in (0,1):
        definition=monotones[a[0]]
        if definition["body"]!=body:
            return ()
        actuals=a[1:]
    else:
        return ()
    formals=definition["parameters"]
    assert len(formals)==len(actuals)==len(set(formals))
    assert all(nodes[v]["op"]=="coordinate" for v in formals)
    return tuple(zip(formals,actuals))


def walk(proof,all_edges,native,nodes,y,targets,*,transfer):
    ids={r["id"] for r in targets}
    live=set(ids)
    for i in proof.order:
        if any(j in live for j in all_edges[i]):
            live.add(i)
    normal=proof.normal
    facts={normal("Y",y),normal("nn",y)}-{True}
    event_rules={}
    sign_bindings={}
    causes=defaultdict(set)
    for i in sorted(live):
        for slot,j in enumerate(all_edges[i]):
            if j not in live:
                continue
            if slot < len(proof.edges[i]):
                rules=proof.raw_rules(i,slot)
            else:
                supported = transfer=="all" or transfer=="expression-only" and nodes[i]["op"]=="actual_expression_partial"
                binds=native[i,slot] if supported else ()
                rules=[(normal("nn",f),(normal("nn",v),)) for f,v in binds]
                sign_bindings[i,slot]=binds
            if rules:
                event_rules[i,slot]=rules
            for p,qs in rules:
                causes[p].update(q for q in qs if q is not True)
    queue=list(facts)
    while queue:
        p=queue.pop()
        for q in causes[p]-facts:
            facts.add(q)
            queue.append(q)
    bit={p:1<<i for i,p in enumerate(sorted(facts))}
    compiled={edge:[(bit[p],sum(bit[q] for q in set(qs)-{True}))
                    for p,qs in rules if p in bit] for edge,rules in event_rules.items()}
    upper=bit.get(normal("Y",y),0)
    lower=bit.get(normal("nn",y),0)
    stack=[(r,0) for r in proof.starts if r in live]
    seen=set()
    reached=set()
    failure_upper=set()
    failure_lower=set()
    reset={}
    used=set()
    while stack:
        state=stack.pop()
        if state in seen:
            continue
        seen.add(state)
        i,before=state
        if i in ids:
            reached.add(i)
            if before&upper!=upper:
                failure_upper.add(i)
            if before&lower!=lower:
                failure_lower.add(i)
        for slot,j in enumerate(all_edges[i]):
            if j not in live:
                continue
            next_facts=before
            if (i,slot) in native:
                next_facts=0
            elif slot==0 and nodes[i]["op"]=="definite_integral":
                v=nodes[i]["args"][1]
                if v not in reset:
                    reset[v]=sum(b for (_,p),b in bit.items() if proof.depends(p,v))
                next_facts &= ~reset[v]
            for p,q in compiled.get((i,slot),()):
                if before&q==q:
                    next_facts|=p
            if (i,slot) in native:
                for formal,actual in sign_bindings[i,slot]:
                    dest=bit.get(normal("nn",formal),0)
                    if dest and next_facts&dest:
                        used.add((i,j,formal,actual))
            stack.append((j,next_facts))
    assert reached==ids
    return {"Y":y,"originalCallIds":sorted(ids),"openUpper":sorted(failure_upper),
            "openLower":sorted(failure_lower),"states":len(seen),
            "actualNonnegativeTransfers":[list(a) for a in sorted(used)]}


def run(a):
    pinned(a.lexical,"lexical")
    pinned(a.branch,"branch")
    base=runpy.run_path(str(a.lexical))
    ranges=runpy.run_path(str(a.branch))["BranchRanges"]
    runtime=pinned(a.runtime,"runtime").decode()
    for fragment in (
        "const out=this.simultaneousSubstitute(body,s.parameters,values);",
        "Every free coordinate of a shared expression body must be an explicit parameter.",
        "return this.node('actual_monotone_root',[system,...values]);",
    ):
        assert fragment in runtime
    original=json.loads(pinned(a.reached,"reached"))
    frontier=json.loads(pinned(a.frontier,"frontier"))
    nodes=dict(original["nodes"])
    base["authenticate_stream"](a.stream,nodes)
    base["validate_profile"](pinned(a.profile,"profile"),nodes)
    assert original["roots"]==base["ROOTS"] and frontier["localRadialEvidenceCount"]==511
    params=json.loads(pinned(a.registry,"registry"))["base"]["base"]
    registry=json.loads(params["expression"]),json.loads(params["monotone"])
    assert len(registry[1])==3
    assert [(s["body"],s["parameters"][0]) for s in registry[1][:2]]==[(7450,4756),(7539,4756)]
    body_edges=dict(original["sourceBodies"])
    assert set(original["entries"])=={j for js in body_edges.values() for j in js}
    ordinary={i:tuple(base["operands"](n["op"],n["args"])) for i,n in nodes.items()}
    all_edges={}
    native={}
    for i,n in nodes.items():
        children=ordinary[i]
        b=tuple(body_edges.get(i,()))
        all_edges[i]=children+b
        for slot,body in enumerate(b,len(children)):
            native[i,slot]=binding_rules(n,body,registry,nodes)
    assert all(j<i and j in nodes for i,children in all_edges.items() for j in children)
    assert nodes[622820]=={"op":"actual_monotone_root","args":[2,622803,622804]}
    assert not any(v for (i,_),v in native.items() if i==622820)
    rows={x["id"]:x for x in frontier["remainingOriginalRows"]}
    assert set(rows)==NEW_EIGHT|FINAL_FOUR
    by_y=defaultdict(list)
    for i,r in rows.items():
        assert nodes[i]=={"op":"actual_natural_series","args":[r["component"],r["y"],r["eta"],r["k"],r["m"]]}
        by_y[r["y"]].append(r)
    p=ranges(nodes,ordinary,set(original["roots"]),source_signs=True)
    nominal=[walk(p,all_edges,native,nodes,y,rs,transfer="all") for y,rs in sorted(by_y.items())]
    negative=[walk(p,all_edges,native,nodes,y,rs,transfer="none") for y,rs in sorted(by_y.items())]
    expression_only=[walk(p,all_edges,native,nodes,y,rs,transfer="expression-only") for y,rs in sorted(by_y.items())]
    open_ids=lambda groups:{i for g in groups for i in g["openLower"]+g["openUpper"]}
    assert open_ids(nominal)==FINAL_FOUR
    assert open_ids(negative)==NEW_EIGHT|FINAL_FOUR
    assert open_ids(expression_only)==NEW_EIGHT|FINAL_FOUR
    assert all(not g["openUpper"] for g in nominal)
    selected_transfers={
        tuple(t) for g in nominal for t in g["actualNonnegativeTransfers"]
        if nodes[t[0]]["op"]=="actual_monotone_root"
    }
    assert len(selected_transfers)==12
    assert {t[1] for t in selected_transfers}=={7450,7539}
    assert {t[2] for t in selected_transfers}=={4756}
    return {
        "schema":"MathScope.C147.OriginalForwardNativeYArgumentTransfer/1","pins":PINS,
        "nominalGroups":nominal,"controlWithoutBindingSign":negative,
        "controlWithoutMonotoneBindingSign":expression_only,
        "openNominalIds":sorted(open_ids(nominal)),"openWithoutSignTransferIds":sorted(open_ids(negative)),
        "openWithoutMonotoneTransferIds":sorted(open_ids(expression_only)),
        "decisiveOriginalMonotoneOwnerOperands":[list(t) for t in sorted(selected_transfers)],
        "newlyAdmissibleRows":[rows[i] for i in sorted(set(rows)-open_ids(nominal))],
        "localRadialEvidenceCount":519,
        "root2BracketSignUsed":False,"newlyPromotedOfficialRows":0,"finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    p=argparse.ArgumentParser(description=__doc__)
    for key in (*PINS,"stream","output"):
        p.add_argument(key,type=Path)
    a=p.parse_args()
    answer=run(a)
    a.output.write_bytes((json.dumps(answer,sort_keys=True,indent=2)+"\n").encode())
