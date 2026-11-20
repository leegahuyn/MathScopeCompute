"""Bind the active N3 repeat cutoff operands that already live in its protected prefix."""

from argparse import ArgumentParser
from collections import Counter
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys


PARTS=("real","imaginary")
PINS={
    "reader":"2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb",
    "cacheReader":"909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f",
    "manifest":"8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a",
    "registry":"e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03",
    "metadata":"20e3cb1dbf4d4af9ec8548c027f29e5c5225091012d6b0ae33fa6cce320be4ca",
    "firstRows":"6bf1e8c538e67bec6ea52e5960fd5cb23a556442d413d120025c49f30f117c27",
    "C82":"888b8575fb5f02c9fac90e37cc757261b2bb7eaf8fea62d1a6ca6b4c544532b1",
    "c82Reader":"72d0330e9e8aa09ee585a6d359660de468d22c2c0b1953f33ecaf8500721b709",
    "c80Reader":"6d434e778c6802a8a57397654a45d745c0302a36f0942e28133f0a84258b8b98",
    "exactAlgebra":"260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75",
    "originalStep":"cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3",
}


def pinned(path,name):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==PINS[name],name
    return data


def verify(g,n,candidate,first,c82,exact,equality):
    names={r["name"]:r for r in n.expressions}
    definitions={r["id"]:r for r in n.expressions}
    original_definitions={k:r for k,r in enumerate(json.loads(n.base_snapshot["base"]["expression"]))}
    auxiliary_definitions={k:r for k,r in enumerate(json.loads(n.base_snapshot["expressionDefinitions"]))}
    by_op={"m3_coupled_expression_partial":definitions,"actual_expression_partial":original_definitions,
           "m3_aux_expression_partial":auxiliary_definitions}
    chart_rows={(r["key"],r["harmonic"]):r for r in first["full"]["rows"]}
    c82_rows={(r["key"],r["mode"]):r for r in c82["cases"]}
    count=Counter()
    records=[]
    for template in candidate["templates"]:
        key=template["key"]
        level,sign=key.split(":")
        case=c82_rows[key,1]
        psi,pulse=case["psi"],case["v"]
        L=n.pulses[case["nativeSystem"]]["length"]
        algebra=exact(g)
        @cache
        def affine(v):
            term=algebra.mul(algebra.scalar(20),algebra.of(v),algebra.inv(algebra.of(L)))
            return algebra.sub(term,algebra.scalar(4)),algebra.sub(algebra.scalar(16),term)
        sigma={}
        for atom in g.args(psi,"multiply"):
            raw,k=g.args(atom,"source_step_derivative")
            assert k==0 and algebra.of(raw) in affine(pulse)
            sigma[affine(pulse).index(algebra.of(raw))]=atom
        assert sorted(sigma)==[0,1]
        dsigma={key:g.args(i,"source_step_derivative")[0] for key,i in sigma.items()}

        @cache
        def zero(root,which,v=pulse):
            if root==0:
                return True
            op,args=g.node(root)
            if op=="add":
                return all(zero(i,which,v) for i in args)
            if op=="multiply":
                return any(zero(i,which,v) for i in args)
            if op=="integer_power":
                return args[1]>0 and zero(args[0],which,v)
            if op=="smooth_piecewise":
                return all(zero(i,which,v) for i in args[3:])
            if op=="source_step_derivative":
                return any((which==i or args[1]>0) and algebra.of(args[0])==affine(v)[i] for i in sigma)
            if op in by_op:
                definition=by_op[op][args[0]]
                formals=definition["parameters"]
                if formals==args[1]:
                    return zero(definition["body"],which,v)
                original=[f for f,i in zip(formals,args[1],strict=True) if i==v]
                if len(original)==1:
                    return zero(definition["body"],which,original[0])
            return False

        def derivative(root):
            seen=set()
            for term in g.args(root,"add"):
                step,companion,coefficient=None,None,[]
                for atom in product(term):
                    op,args=g.node(atom)
                    if op=="source_step_derivative":
                        if args[1]==0:
                            companion=atom
                        else:
                            assert args[1]==1
                            step=next(i for i,inner in dsigma.items() if args[0]==inner)
                    else:
                        coefficient.append(atom)
                assert step in sigma and companion==sigma[1-step]
                assert step not in seen
                seen.add(step)
                value=algebra.mul(algebra.of(L),*(algebra.of(i) for i in coefficient))
                assert value==algebra.scalar(20 if step==0 else -20)
            assert seen=={0,1}

        def product(i):
            op,args=g.node(i)
            if op=="multiply":
                for j in args:
                    yield from product(j)
            else:
                yield i

        seed_keys=[f"InitializedOriginalWave_{level}_{sign}_{j}_{part}" for j in range(3) for part in PARTS]
        seed_keys.extend(f"InitializedOriginalPrimaryPressure_{level}_{sign}_{part}" for part in PARTS)
        seed_keys.extend(f"OriginalPrimaryPrincipalFlat_{level}_{sign}_{j}" for j in range(3))
        seeds={names[k]["id"]:names[k] for k in seed_keys if k in names}
        unexplained=[(s["name"],s["body"],g.node(s["body"]),zero(s["body"],0),zero(s["body"],1))
                     for s in seeds.values() if not(zero(s["body"],0) and zero(s["body"],1))]
        assert seeds and not unexplained,(key,psi,pulse,unexplained)
        count["firstSourceZeroPrimarySeedBodies"]+=len(seeds)
        derivatives=set()
        for row in template["rows"][:2]:
            mode=row["m"]
            first_row=chart_rows[key,mode]
            source=n.pulses[first_row["system"]]
            assert source["id"]==c82_rows[key,mode]["nativeSystem"]
            assert c82_rows[key,mode]["v"]==pulse and c82_rows[key,mode]["psi"]==psi
            assert source["initial"]==[{"imaginary":0,"real":0}]*3 and source["left"]==0
            terms={t["family"]:t["value"] for t in row["terms"]}
            assert set(terms)==({"first-forced-remaining-source","first-forced-cutoff-derivative"} |
                               ({"primary-cutoff-derivative","signed-cutoff-derivative"} if mode==1 else set()))
            if mode==1:
                assert terms["primary-cutoff-derivative"]==first_row["principal"]
                assert all(zero(i,0) and zero(i,1) for z in first_row["principal"] for i in z.values())
                assert all(z["imaginary"]==0 and z["real"]>=g.count for z in terms["signed-cutoff-derivative"])
                count["primaryCutoffNativeSlots"]+=6
                count["signedRealSlotsPendingActiveAppend"]+=3
            for j in range(3):
                for part in PARTS:
                    root=first_row["supported"][j][part]
                    @cache
                    def ideal(i):
                        if i==0:
                            return True
                        op,args=g.node(i)
                        if op=="m3_coupled_expression_partial" and args[0] in seeds:
                            return args[1]==seeds[args[0]]["parameters"]
                        if op=="add":
                            return all(ideal(z) for z in args)
                        if op=="multiply":
                            return any(ideal(z) for z in args)
                        if op=="integer_power":
                            return args[1]>0 and ideal(args[0])
                        if op=="smooth_piecewise":
                            return all(ideal(z) for z in args[3:])
                        return False
                    if not ideal(root):
                        a=exact(g)
                        ordinary=a.of
                        a.of=lambda i:a.zero if ideal(i) else ordinary(i)
                        assert equality(a,a.of(root),a.zero),(key,mode,j,part,root)
                    count["firstSupportedSourcesInPulseZeroIdeal"]+=1
                    remainder=terms["first-forced-remaining-source"][j][part]
                    two=g.args(remainder,"multiply")
                    wrapped,change=([i for i in two if g.node(i)[0]==op][0] for op in ("m3_coupled_expression_partial","add"))
                    assert len(two)==2
                    one_minus=g.args(change,"add")
                    other,=[i for i in one_minus if i!=1]
                    assert len(one_minus)==2 and sorted(g.args(other,"multiply"))==sorted([20,psi])
                    owner,actual,orders=g.args(wrapped,"m3_coupled_expression_partial")
                    d=definitions[owner]
                    assert not any(orders) and d["name"]==f"CoupledForced_source_{j}_{part}"
                    assert actual==[pulse,*source["parameters"]]
                    assert d["parameters"]==[source["variable"],*source["parameters"]]
                    assert d["body"]==first_row["originalSource"][j][part]
                    call=g.args(d["body"],"m3_coupled_expression_partial")
                    actual_def=definitions[call[0]]
                    pair=dict(zip(source["directions"][-2:],first_row["H_w"],strict=True))
                    assert actual_def["name"]==f"ActualWholeNonzeroSource_{key}_{mode}_{j}_{part}"
                    assert actual_def["body"]==root and not any(call[2])
                    assert call[1]==[pair.get(slot,slot) for slot in actual_def["parameters"]]
                    count["remainingSourceFullyBoundSlots"]+=1
                    tail=terms["first-forced-cutoff-derivative"][j][part]
                    two=g.args(tail,"multiply")
                    state,dp=([i for i in two if g.node(i)[0]==op][0] for op in ("m3_forced_pulse_partial","add"))
                    assert len(two)==2
                    assert g.args(state,"m3_forced_pulse_partial")==[source["id"],part,j,pulse,source["parameters"],[0]*5]
                    derivative(dp)
                    assert all(zero(dp,i) for i in (0,1))
                    assert not any(zero(state,i) for i in (0,1))
                    derivatives.add(dp)
                    count["cutoffDerivativeFullyBoundSlots"]+=1
                    records.append([key,mode,j,part,remainder,wrapped,root,tail,state,dp])
        assert len(derivatives)==1
    assert count=={"firstSourceZeroPrimarySeedBodies":100,"firstSupportedSourcesInPulseZeroIdeal":120,
                   "remainingSourceFullyBoundSlots":120,"cutoffDerivativeFullyBoundSlots":120,
                   "primaryCutoffNativeSlots":60,"signedRealSlotsPendingActiveAppend":30},count
    return count,records


def main():
    parser=ArgumentParser(description=__doc__)
    for name in ("work","goal","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    args=parser.parse_args()
    scope=args.goal/"primary-forced-join/active-n3-c5-binding"
    reader=scope/"spatial-readback"
    cache_reader=scope/"live-wave-gauge/signed"
    helpers=args.work/"continuation82/forced-seams"
    pinned(reader/"source_stream.py","reader")
    pinned(cache_reader/"source_cache.py","cacheReader")
    pinned(helpers/"verify_forced_seams.py","c82Reader")
    pinned(args.work/"continuation80/forced-wave/verify_forced_wave.py","c80Reader")
    pinned(args.goal/"first-force-repair/verify_repaired_first_force.py","exactAlgebra")
    original=(args.work/"continuation66/stage2/runtime-exact/research-ide/"
              "mathscope-m2/navier/actual-global-source-expressions.mjs")
    step=pinned(original,"originalStep")
    assert b"if(x<=0||x>=1)return n===0?(x>=1?1:0):0;" in step
    sys.path[:0]=[str(reader),str(cache_reader),str(helpers)]
    import source_stream as st
    from source_cache import load
    from verify_forced_seams import Exact, equality
    hosted=args.work/"continuation70/hosted-44582875351"
    directory=hosted/"first-correction-spatial-source"
    manifest=json.loads(pinned(directory/st.MANIFEST,"manifest"))
    n=st.Native(directory,manifest)
    assert n.pin==PINS["registry"]
    g=load(st,directory,manifest,22153782,args.work/"continuation80/signed-wave/cache")
    def node(i):
        row=g.record(i)
        return row["op"],row["args"]
    g.node=node
    c82=json.loads(pinned(helpers/"forced-seams-final.json","C82"))
    assert c82["originalStreamSHA256"]==manifest["node_stream_sha256"]
    try:
        candidate=json.loads(pinned(hosted/"active-n3-repeat-forced-candidate.json","metadata"))
        first=json.loads(pinned(hosted/"same-family-mode-two.json","firstRows"))
        counts,rows=verify(g,n,candidate,first,c82,Exact,equality)
    finally:
        g.__exit__(None,None,None)
    value={"schema":"MathScope.C110.ActiveOriginalRepeatPredecessorCutoffTails/1",
           "status":"VERIFIED_ACTUAL_PROTECTED_TAILS_CONDITIONAL_FAST_COLLAR_APPLICATION",
           "pins":PINS,
           "sourceStreamSHA256":manifest["node_stream_sha256"],"originalNodeCount":manifest["node_count"],
           "counts":dict(sorted(counts.items())),"rows":rows,
           "pulseCollar":"On the source-admitted interval, original first remaining source vanishes on both pulse collars by the zero-seed ideal and v(H_w)=w. The mapped first state is not set zero in the right collar; the exact psi derivative kills its retained product.",
           "premises":["Original native pulse and all ordinary cofactors are defined on the indicated fixed-label admitted neighborhood.",
                       "Original C82 fixed-lift affine map preserves the three slow coordinates and transverse xi, and v evaluated at H_w equals w.",
                       "Original flat step is identically zero on the negative half-line, identically one above one, and all positive order derivatives vanish in those constant regions."],
           "open":"30 nonzero Signed cutoff tails and the actual repeater raw ideal need full active append. Shell and full slow seam/source closure remain separate.",
           "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(value,indent=2)+"\n").encode())
    print(value["status"],dict(counts))


if __name__=="__main__":
    assert __debug__
    main()
