"""Forward branch-context replay of the original First FiveMap radial range."""

import argparse
from collections import defaultdict
from fractions import Fraction as F
from functools import lru_cache
from hashlib import sha256
import json
from pathlib import Path
import runpy


PINS = {
    "base": "44d4cfc6b21e16259e3fceac38926c77dc02f5f9d22c5687004af1c915a0529c",
    "admissions": "0c4e22f12545b2b6f2bdf20daa545b4a0e1b0ece485fd388977f20289c0b141f",
    "control": "52c32735a9b279ff691e91d5c074715477f844d6e3f8513026822d0d6a506c07",
    "entry_local": "106142bae71d54af69b1d8857dd062fa7e4c0a659257f6567f35f01ae6711548",
    "reached": "5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459",
    "profile": "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a",
    "expr": "cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3",
    "runtime": "326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311",
}
UPPER = ("Y","X","s","w")
LOWER = ("nn","pos")
KINDS = UPPER+LOWER


def pinned(path,name):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==PINS[name],name
    return data


class BranchRanges:
    def __init__(self,nodes,edges,starts,*,source_signs=False):
        self.nodes=nodes
        self.edges=edges
        self.starts=starts
        self.order=sorted(nodes)
        self.source_signs=source_signs

    def rational(self,i):
        n=self.nodes[i]
        return F(*map(int,n["args"])) if n["op"]=="rational" else None

    def factor(self,i,j):
        n=self.nodes[i]
        if n["op"]=="multiply" and j in n["args"]:
            a,b=n["args"]
            return b if a==j else a
        return None

    @lru_cache(None)
    def normal(self,kind,i):
        n=self.nodes[i]
        op,a=n["op"],n["args"]
        q=self.rational(i)
        if kind=="Y":
            if q is not None and q<=4:
                return True
            x=self.factor(i,3454)
            if x is not None:
                return self.normal("X",x)
            e=self.factor(i,474)
            if e is not None and self.nodes[e]["op"]=="exp":
                return self.normal("s",self.nodes[e]["args"][0])
        if kind=="X":
            if i==3617 or q is not None and q<=0:
                return True
            e=self.factor(i,3617)
            if e is not None and self.nodes[e]["op"]=="exp":
                return self.normal("s",self.nodes[e]["args"][0])
            if op=="exp":
                return self.normal("w",a[0])
        if kind=="s":
            if i==3612 or q is not None and q<=0:
                return True
            f=self.factor(i,3612)
            if f is not None:
                qf=self.rational(f)
                if qf is not None and qf<=2:
                    return True
            if op=="log_positive":
                x=self.factor(a[0],3679)
                if x is not None:
                    return self.normal("X",x)
        if kind=="w" and op=="log_positive":
            return self.normal("X",a[0])
        if kind in LOWER:
            if q is not None and (q>=0 if kind=="nn" else q>0):
                return True
            # All expressions are considered only at defined real occurrences.
            # No monotone root and no loopILeft sign is inferred here.
            if i in (3454,3617,3612,3679) or op=="exp":
                return True
            if self.source_signs and i in (12,6257,7982):
                return True
            if kind=="nn" and (op=="sqrt_positive" or
                               op=="integer_power" and a[1]>=0 and a[1]%2==0):
                return True
            if op=="multiply":
                for positive in (3454,3617,3679,474):
                    j=self.factor(i,positive)
                    if j is not None:
                        return self.normal(kind,j)
                if self.source_signs and all(self.normal("pos",j) is True for j in a):
                    return True
        return kind,i

    @lru_cache(None)
    def depends(self,i,v):
        if i==v:
            return True
        n=self.nodes[i]
        if n["op"] not in ("rational","coordinate","source_parameter","multiply","add",
                           "integer_power","exp","inverse","log_positive","sqrt_positive",
                           "definite_integral"):
            return True  # an opaque expression never retains a fact across rebinding
        if n["op"]=="definite_integral":
            body,formal,lo,hi=n["args"]
            return self.depends(lo,v) or self.depends(hi,v) or formal!=v and self.depends(body,v)
        return any(self.depends(j,v) for j in self.edges[i])

    def raw_rules(self,i,childslot):
        n=self.nodes[i]
        a=n["args"]
        if n["op"]=="smooth_piecewise" and childslot>=3:
            x,l,r=a[:3]
            arm=childslot-3
            rules=[]
            if arm<2:
                upper=l if arm==0 else r
                rules.extend((self.normal(k,x),(self.normal(k,upper),)) for k in UPPER)
            if arm>0:
                if arm==1:
                    rules.extend((self.normal(k,x),(self.normal("nn",l),)) for k in LOWER)
                else:
                    rules.extend((self.normal(k,x),(self.normal(k,r),)) for k in LOWER)
            return rules
        if n["op"]=="definite_integral" and childslot==0:
            _,v,l,r=a
            return [(self.normal(k,v),(self.normal(k,l),self.normal(k,r))) for k in KINDS]
        return ()

    def walk(self,y,rows,*,drop_inside_upper=False,add_start=None):
        ids={r["id"] for r in rows}
        live=set(ids)
        for i in self.order:
            if any(j in live for j in self.edges[i]):
                live.add(i)
        needed={self.normal("Y",y),self.normal("nn",y)}-{True}
        events={}
        inv=defaultdict(set)
        for i in sorted(live):
            n=self.nodes[i]
            if n["op"] not in ("smooth_piecewise","definite_integral"):
                continue
            for s,j in enumerate(self.edges[i]):
                if j not in live:
                    continue
                rules=self.raw_rules(i,s)
                if drop_inside_upper and n["op"]=="smooth_piecewise" and s==4:
                    rules=[(p,q) for p,q in rules if p is True or p[0] not in UPPER]
                if rules:
                    events[i,s]=rules
                for p,qs in rules:
                    inv[p].update(q for q in qs if q is not True)
        frontier=list(needed)
        while frontier:
            p=frontier.pop()
            for q in inv[p]-needed:
                needed.add(q)
                frontier.append(q)
        bits={p:1<<j for j,p in enumerate(sorted(needed))}
        reset_cache={}
        def masks(p,qs):
            if p not in bits:
                return 0,0
            return bits[p],sum(bits[q] for q in set(qs)-{True})
        compiled={key:[masks(p,qs) for p,qs in rs if p in bits] for key,rs in events.items()}
        upper=bits.get(self.normal("Y",y),0)
        lower=bits.get(self.normal("nn",y),0)
        stack=[(i,0) for i in self.starts if i in live]
        if add_start is not None:
            stack.append((add_start,0))
        seen=set()
        witnessed=set()
        open_upper=set()
        open_lower=set()
        traced=set()
        while stack:
            state=stack.pop()
            if state in seen:
                continue
            seen.add(state)
            i,old=state
            if i in ids:
                witnessed.add(i)
                if old&upper!=upper:
                    open_upper.add(i)
                if old&lower!=lower:
                    open_lower.add(i)
            n=self.nodes[i]
            for slot,j in enumerate(self.edges[i]):
                if j not in live:
                    continue
                new=old
                if slot==0 and n["op"]=="definite_integral":
                    v=n["args"][1]
                    if v not in reset_cache:
                        reset_cache[v]=sum(bit for (_,atom),bit in bits.items() if self.depends(atom,v))
                    new &= ~reset_cache[v]
                for p,q in compiled.get((i,slot),()):
                    if old&q==q:
                        new|=p
                if new!=old:
                    traced.add((i,slot))
                stack.append((j,new))
        assert witnessed==ids
        return {"yOperand":y,"observedIds":sorted(ids),"openUpper":sorted(open_upper),
                "openLower":sorted(open_lower),"stateCount":len(seen),
                "guardOperandSlots":[list(item) for item in sorted(traced)]}


def run(a):
    pinned(a.base,"base")
    code=runpy.run_path(str(a.base))
    reached=json.loads(pinned(a.reached,"reached"))
    old=json.loads(pinned(a.admissions,"admissions"))
    control=json.loads(pinned(a.control,"control"))
    entry_local=json.loads(pinned(a.entry_local,"entry_local"))
    assert control["negativeControlDroppedLoopLeftSign"]
    assert not control["nativeActualTransportEnabled"] and not control["allowsPositiveBracketAtDefinedRoot2"]
    first=dict(reached["nodes"])
    code["authenticate_stream"](a.stream,first)
    raw_profile=pinned(a.profile,"profile")
    code["validate_profile"](raw_profile,first)
    profile=json.loads(raw_profile.decode().split("export const PINNED_N3 = ",1)[1].strip().rstrip(";"))["parametersExactExpressions"]
    assert profile["loopILeft"]=={"product":[{"quotient":[{"integer":4},{"ref":"Lambda"}]},
                                            {"exp":{"quotient":[{"ref":"t1"},{"integer":8}]}}]}
    assert profile["XR"]=={"product":[{"integer":110},{"power":[{"product":[{"ref":"CSelected"},{"ref":"Pstar"}]},10]}]}
    assert profile["I1Right"]=={"product":[{"ref":"X0I1"},{"exp":{"integer":5}}]}
    assert profile["X0I1"]=={"product":[{"ref":"XR"},{"exp":{"sum":[{"ref":"T"},{"integer":2},
                                               {"product":[{"integer":60},{"ref":"BOuter"}]},{"integer":-25}]}}]}
    for i,key in [(12,"XR"),(6257,"loopILeft"),(7982,"I1Right")]:
        assert first[i]=={"op":"source_parameter","args":[key]}
    producer=pinned(a.expr,"expr").decode()
    runtime=pinned(a.runtime,"runtime").decode()
    assert 'v=ev(x<=a?args[3]:x>=b?args[5]:args[4],env);' in producer
    assert "env,[name]:lo+k*h" in producer
    assert "if(x===b)return this.substitute(args[5],variable,value);" in runtime
    assert "if(x===a||x===this.zero&&this.sourcePositiveGeometry(a))return this.substitute(args[3],variable,value);" in runtime
    for i,expected in {3679:{"op":"inverse","args":[3617]},4756:{"op":"coordinate","args":["X"]}}.items():
        assert first[i]==expected
    body_entries={i for _,entry in reached["sourceBodies"] for i in entry}
    assert body_entries==set(reached["entries"])
    assert reached["roots"]==code["ROOTS"] and len(body_entries)==1745
    edges={i:code["operands"](n["op"],n["args"]) for i,n in first.items()}
    assert all(j<i and j in first for i,ch in edges.items() for j in ch)
    remaining=old["remainingOriginalRows"]
    excluded={r["id"] for r in control["openCalls"]}
    candidates=[r for r in remaining if r["id"] not in excluded]
    assert len(candidates)==223 and len(excluded)==158
    assert entry_local["certifiedRangeCount"]==511 and entry_local["openRangeCount"]==12
    assert not entry_local["nativeActualTransportEnabled"] and not entry_local["allowsPositiveBracketAtDefinedRoot2"]
    still_open={r["id"] for r in entry_local["openCalls"]}
    source_sign_candidates=[r for r in remaining if r["id"] in excluded-still_open]
    assert len(source_sign_candidates)==146 and still_open<=excluded
    starts=set(reached["roots"])|body_entries

    def batch(rows,source_signs):
        proof=BranchRanges(first,edges,starts,source_signs=source_signs)
        groups=defaultdict(list)
        for r in rows:
            assert first[r["id"]]=={"op":"actual_natural_series","args":[r["component"],r["y"],r["eta"],r["k"],r["m"]]}
            groups[r["y"]].append(r)
        results=[proof.walk(y,rs) for y,rs in sorted(groups.items())]
        admitted={}
        for group in results:
            open_=set(group["openUpper"])|set(group["openLower"])
            admitted.update({r["id"]:r for r in groups[group["yOperand"]] if r["id"] not in open_})
        return proof,groups,results,admitted

    proof,groups,results,admitted=batch(candidates,False)
    assert len(admitted)==223
    _,_,source_results,source_admitted=batch(source_sign_candidates,True)
    assert len(source_admitted)==146
    negative=proof.walk(3845,groups[3845],drop_inside_upper=True)
    assert negative["openUpper"]
    unbound=proof.walk(3845,groups[3845],add_start=10205)
    assert unbound["openUpper"]==[10205]
    all_admitted=admitted|source_admitted
    assert len(all_admitted)==len(admitted)+len(source_admitted)==369
    assert {r["id"] for r in remaining if r["id"] not in all_admitted}==still_open
    return {"schema":"MathScope.C146.OriginalRealYForwardBranchAudit/1","pins":PINS,
            "candidateRows":369,"newSourceBoundRows":len(all_admitted),
            "localRadialEvidenceCount":142+len(all_admitted),
            "rows":[all_admitted[i] for i in sorted(all_admitted)],
            "withoutLoopLeftSign":{"newSourceBoundRows":len(admitted),"groups":results},
            "pinnedSourceSignBatch":{"newSourceBoundRows":len(source_admitted),"groups":source_results},
            "remainingOriginalRows":[r for r in remaining if r["id"] not in all_admitted],
            "negativeControls":{"droppedInsideUpperOpenIds":negative["openUpper"],
                                "extraUnboundOriginalCallOpenIds":unbound["openUpper"]},
            "slowInverseImageUsed":False,"nativeActualTransportUsed":False,
            "newlyPromotedOfficialRows":0,"finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    for name in (*PINS,"stream","output"):
        parser.add_argument(name,type=Path)
    a=parser.parse_args()
    r=run(a)
    a.output.write_bytes((json.dumps(r,sort_keys=True,indent=2)+"\n").encode())
