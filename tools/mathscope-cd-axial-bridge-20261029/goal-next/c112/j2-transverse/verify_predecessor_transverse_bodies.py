"""Verify transverse zero for the active original repeat-wave protected bodies."""

from argparse import ArgumentParser
from fractions import Fraction
from functools import cache
import json
from pathlib import Path
import sys

from verify_active_j2_full_source import load as read
from verify_predecessor_cutoff_tails import PINS, pinned


RADIAL_TRANSVERSE_RADIUS=14220486
PULSE_PROOF="2d326dee551a7c4b83908aab1244fcbd9916d398fa3d77af17eb73698106256b"


def verify(graph,native,first,c82,pulse_proof,exact,equality):
    assert graph.rational(RADIAL_TRANSVERSE_RADIUS)==Fraction(1,2**34)
    definitions={
        "m3_coupled_expression_partial":{r["id"]:r for r in native.expressions},
        "m3_aux_expression_partial":{-i-1:r for i,r in enumerate(json.loads(native.base_snapshot["expressionDefinitions"]))},
        "actual_expression_partial":dict(enumerate(json.loads(native.base_snapshot["base"]["expression"]))),
    }
    wrappers={(r["name"],r["body"],tuple(r["parameters"])):r for r in native.expressions
              if r["name"].startswith("CoupledForced_source_")}
    by_chart={(r["key"],r["mode"]):r for r in c82["cases"]}
    first_rows={(r["key"],r["harmonic"]):r for r in first["full"]["rows"]}
    algebra=exact(graph)
    rows=[]
    for entry in pulse_proof["charts"]:
        chart=entry["chart"]
        cases=[by_chart[chart,m] for m in (1,2)]
        xi,pulse=cases[0]["xi"],cases[0]["v"]
        assert (xi,pulse)==(cases[1]["xi"],cases[1]["v"]) and pulse==entry["v"]
        systems={}
        raw_owners={}
        cutoffs=set()
        source_states=set()
        source_inputs=set()
        for case in cases:
            row=first_rows[chart,case["mode"]]
            p=native.pulses[row["system"]]
            assert p["id"]==case["nativeSystem"] and p["variable"]==case["w"]
            assert p["left"]==0 and p["initial"]==[{"imaginary":0,"real":0}]*3
            assert row["H_w"]==case["H_w"] and row["projected"]==p["forcing"]
            systems[p["id"]]=p
            for j,z in enumerate(row["originalSource"]):
                for part,root in z.items():
                    share=wrappers[f"CoupledForced_source_{j}_{part}",root,(p["variable"],*p["parameters"])]
                    raw_owners[share["id"]]=p["parameters"]
        assert len(systems)==2 and len(raw_owners)==12

        @cache
        def zero(root,x,v):
            if root==0:
                return True
            op,args=graph.node(root)
            same=lambda k:zero(k,x,v)
            if op=="add":
                return all(map(same,args))
            if op=="multiply":
                return any(map(same,args))
            if op=="integer_power":
                return args[1]>0 and same(args[0])
            if op=="smooth_piecewise":
                norm,_,hi,_,_,right=args
                r,args_r=graph.node(norm)
                if right==0 and graph.node(hi)[0]=="rational" and graph.rational(hi)==Fraction(3,4) and r=="sqrt_positive":
                    p,args_p=graph.node(args_r[0])
                    ratio=algebra.mul(algebra.of(x),algebra.inv(algebra.of(RADIAL_TRANSVERSE_RADIUS)))
                    if p=="integer_power" and args_p[1]==2 and equality(algebra,algebra.of(args_p[0]),ratio):
                        cutoffs.add((root,x))
                        return True
                return all(map(same,args[3:]))
            if op=="m3_forced_pulse_partial":
                owner,part,j,at,parameters,orders=args
                if owner in systems and at==v and parameters==systems[owner]["parameters"] and sum(orders)<=3:
                    assert part in ("real","imaginary") and j in (0,1,2)
                    source_states.add(root)
                    return True
            if op in definitions:
                owner,actual,orders=args
                definition=definitions[op][owner]
                if owner in raw_owners and actual==[v,*raw_owners[owner]] and sum(orders)<=3:
                    source_inputs.add(root)
                    return True
                formals=definition["parameters"]
                if formals==actual:
                    return same(definition["body"])
                x_args=[f for f,k in zip(formals,actual,strict=True) if k==x]
                v_args=[f for f,k in zip(formals,actual,strict=True) if k==v]
                if len(x_args)==1 and len(v_args)<=1:
                    return zero(definition["body"],x_args[0],v_args[0] if v_args else v)
            return False

        operands=entry["reportedOwnersAndVerifiedProtectedBodyRoots"]
        assert len(operands)==16 and all(zero(root,xi,pulse) for _,root in operands)
        proof={"literalTransverseCutoffOccurrences":sorted(cutoffs),
               "sameOriginalNativeStateCalls":sorted(source_states),"sameOriginalFullForcingCalls":sorted(source_inputs)}
        other=next(row["xi"] for row in c82["cases"] if row["xi"]!=xi)
        wrong=sum(not zero(root,other,pulse) for _,root in operands)
        # All Forced-only roots can still vanish under the genuine C82 state
        # premise. A shifted transverse coordinate must fail a direct chi use.
        assert wrong>0 and all(proof.values())
        rows.append({"chart":chart,"xi":xi,"v":pulse,"reportedOwnersAndVerifiedProtectedBodyRoots":operands,
                     **proof,"wrongXiProofRejections":wrong})
    assert len(rows)==10
    return rows


def main():
    cli=ArgumentParser(description=__doc__)
    for arg in ("work","goal","pulse-proof","out"):
        cli.add_argument("--"+arg,type=Path,required=True)
    args=cli.parse_args()
    scope=args.goal/"primary-forced-join/active-n3-c5-binding"
    reader=scope/"spatial-readback"
    cache_reader=scope/"live-wave-gauge/signed"
    helpers=args.work/"continuation82/forced-seams"
    pinned(reader/"source_stream.py","reader")
    pinned(cache_reader/"source_cache.py","cacheReader")
    pinned(helpers/"verify_forced_seams.py","c82Reader")
    pinned(args.work/"continuation80/forced-wave/verify_forced_wave.py","c80Reader")
    pinned(args.goal/"first-force-repair/verify_repaired_first_force.py","exactAlgebra")
    sys.path[:0]=[str(reader),str(cache_reader),str(helpers)]
    import source_stream as st
    from source_cache import load
    from verify_forced_seams import Exact, equality
    archive=args.work/"continuation70/hosted-44582875351"
    directory=archive/"first-correction-spatial-source"
    manifest,_=read(directory/st.MANIFEST,PINS["manifest"])
    first,_=read(archive/"same-family-mode-two.json",PINS["firstRows"])
    c82,_=read(helpers/"forced-seams-final.json",PINS["C82"])
    pulse_proof,_=read(args.pulse_proof,PULSE_PROOF)
    native=st.Native(directory,manifest)
    assert manifest["node_stream_sha256"]==pulse_proof["predecessor"]["streamSHA256"]==c82["originalStreamSHA256"]
    assert native.pin==PINS["registry"]
    g=load(st,directory,manifest,22153782,args.work/"continuation80/signed-wave/cache")
    def node(i):
        row=g.record(i)
        return row["op"],row["args"]
    g.node=node
    try:
        rows=verify(g,native,first,c82,pulse_proof,Exact,equality)
    finally:
        g.__exit__(None,None,None)
    result={"schema":"MathScope.C110.ActiveOriginalRepeatProtectedTransverseBodies/1",
            "status":"VERIFIED_PROTECTED_WAVE_BODIES_CONDITIONAL_TRANSVERSE_COLLAR_ZERO",
            "originalNodes":manifest["node_count"],"originalStreamSHA256":manifest["node_stream_sha256"],
            "originalRegistrySHA256":native.pin,"originalTransverseRadius":RADIAL_TRANSVERSE_RADIUS,
            "protectedPulseBodiesSHA256":PULSE_PROOF,"protectedWaveBodies":160,"charts":rows,
            "premise":"Other guards are admitted and original ordinary/native operands are defined in the fixed chart. At |xi|>3r0/4 the protected same-chart first source and state are zero by the original C82 zero-data closed-pulse argument; the bound first pressure retains that exact source.",
            "open":"Same-running raw-source application and Signed cutoff derivative tail joins; other ordinary and cross-label faces; complete second correction.",
            "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print(result["status"],160,"protected wave bodies")


if __name__=="__main__":
    assert __debug__
    main()
