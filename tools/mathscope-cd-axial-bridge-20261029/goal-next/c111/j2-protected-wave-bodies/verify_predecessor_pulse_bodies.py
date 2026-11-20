"""Verify the original protected wave operands reported by the active repeat emitter."""

from argparse import ArgumentParser
from functools import cache
import json
from hashlib import sha256
from pathlib import Path
import sys

from verify_predecessor_cutoff_tails import PINS, pinned


TAIL_PROOF_SHA256="7932abec4bdcc8db898e8c3c7fb8c5b8e217879fe31937eedf437874154b7f03"


def verify(g,n,candidate,c82,exact):
    definitions={"m3_coupled_expression_partial":{r["id"]:r for r in n.expressions},
                 "actual_expression_partial":dict(enumerate(json.loads(n.base_snapshot["base"]["expression"]))),
                 "m3_aux_expression_partial":dict(enumerate(json.loads(n.base_snapshot["expressionDefinitions"])))}
    cases={r["key"]:r for r in c82["cases"] if r["mode"]==1}
    algebra=exact(g)

    @cache
    def affine(length,x):
        term=algebra.mul(algebra.scalar(20),algebra.of(x),algebra.inv(algebra.of(length)))
        return algebra.sub(term,algebra.scalar(4)),algebra.sub(algebra.scalar(16),term)

    @cache
    def zero(root,length,pulse,side):
        if root==0:
            return True
        op,args=g.node(root)
        condition=lambda i:zero(i,length,pulse,side)
        if op=="add":
            return all(map(condition,args))
        if op=="multiply":
            return any(map(condition,args))
        if op=="integer_power":
            return args[1]>0 and condition(args[0])
        if op=="smooth_piecewise":
            return all(map(condition,args[3:]))
        if op=="source_step_derivative":
            return any((side==i or args[1]>0) and algebra.of(args[0])==term
                       for i,term in enumerate(affine(length,pulse)))
        if op in definitions:
            row=definitions[op][args[0]]
            formals=row["parameters"]
            if formals==args[1]:
                return condition(row["body"])
            argument=[f for f,x in zip(formals,args[1],strict=True) if x==pulse]
            if len(argument)==1:
                return zero(row["body"],length,argument[0],side)
        return False

    output=[]
    wrong_chart_rejected=0
    for template in candidate["templates"]:
        chart=template["key"]
        case=cases[chart]
        v=case["v"]
        L=n.pulses[case["nativeSystem"]]["length"]
        roots={}
        support=template["rawSupport"]
        for wave in support["waveJets"]:
            owner=wave["system"]
            body=wave["actualBody"]
            assert roots.setdefault(owner,body)==body<g.count
            assert sum(wave["orders"])<=2
        assert len(roots)==16 and roots.keys()==set(support["waveSystems"])
        assert all(zero(root,L,v,side) for root in roots.values() for side in (0,1))
        other=next(r["v"] for r in cases.values() if r["v"]!=v)
        wrong_chart_rejected+=sum(not all(zero(root,L,other,side) for side in (0,1)) for root in roots.values())
        output.append({"chart":chart,"v":v,"Ls":L,"reportedJetUses":len(support["waveJets"]),
                       "reportedOwnersAndVerifiedProtectedBodyRoots":sorted(roots.items())})
    assert len(output)==10 and sum(r["reportedJetUses"] for r in output)==1760
    assert wrong_chart_rejected>0
    return output,wrong_chart_rejected


def main():
    cli=ArgumentParser(description=__doc__)
    for arg in ("work","goal","tail-proof","out"):
        cli.add_argument("--"+arg,type=Path,required=True)
    args=cli.parse_args()
    archive=args.work/"continuation70/hosted-44582875351"
    directory=archive/"first-correction-spatial-source"
    scope=args.goal/"primary-forced-join/active-n3-c5-binding"
    reader=scope/"spatial-readback"
    cache_reader=scope/"live-wave-gauge/signed"
    algebra=args.goal/"first-force-repair"
    pinned(reader/"source_stream.py","reader")
    pinned(cache_reader/"source_cache.py","cacheReader")
    pinned(algebra/"verify_repaired_first_force.py","exactAlgebra")
    sys.path[:0]=[str(reader),str(cache_reader),str(algebra)]
    import source_stream as st
    from source_cache import load
    from verify_repaired_first_force import Exact
    tail_bytes=args.tail_proof.read_bytes()
    assert sha256(tail_bytes).hexdigest()==TAIL_PROOF_SHA256
    tail=json.loads(tail_bytes)
    candidate=json.loads(pinned(archive/"active-n3-repeat-forced-candidate.json","metadata"))
    manifest=json.loads(pinned(directory/st.MANIFEST,"manifest"))
    c82=json.loads(pinned(args.work/"continuation82/forced-seams/forced-seams-final.json","C82"))
    assert manifest["node_stream_sha256"]==tail["sourceStreamSHA256"]==c82["originalStreamSHA256"]
    assert candidate["mode"]=="metadata"
    native=st.Native(directory,manifest)
    assert native.pin==PINS["registry"]
    graph=load(st,directory,manifest,22153782,args.work/"continuation80/signed-wave/cache")
    def node(i):
        row=graph.record(i)
        return row["op"],row["args"]
    graph.node=node
    try:
        rows,rejected=verify(graph,native,candidate,c82,Exact)
    finally:
        graph.__exit__(None,None,None)
    result={"schema":"MathScope.C110.ActiveOriginalRepeatProtectedWaveBodies/1",
            "status":"VERIFIED_PROTECTED_WAVE_BODIES_CONDITIONAL_PULSE_COLLAR_ZERO",
            "candidateMetadataSHA256":PINS["metadata"],"upstreamTailProofSHA256":TAIL_PROOF_SHA256,
            "predecessor":{"nodes":manifest["node_count"],"streamSHA256":manifest["node_stream_sha256"],
                           "registrySHA256":native.pin},
            "charts":rows,"reportedTypedApplications":1760,"protectedBodiesWithTwoZeroCollars":160,
            "wrongChartPulseProofRejectedFor":rejected,
            "conditions":["Ordinary fixed-label source operands are admitted on the pulse collar. A source native partial remains on that admitted chart.",
                          "The original H_w keeps the slow coordinates and transverse lift fixed and maps v to w."],
            "appendOpen":["Same-running active native owner definitions, actual derivative application tuples and formal raw-source ideal",
                          "Thirty nonzero Signed subtraction tails", "All ordinary-side and global extensions"],
            "completeSecondCorrection":"OPEN","finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print(result["status"],result["protectedBodiesWithTwoZeroCollars"],"wrong chart proof rejections",rejected)


if __name__=="__main__":
    assert __debug__
    main()
