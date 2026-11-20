"""Bind every actual Signed subtraction to its own original nonradial guard."""

from argparse import ArgumentParser
from fractions import Fraction as F
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile


PINS={
    "archivedGuards":"722f8227d71d18041b62449d10e957ce237625ab791c50b84d2ebedb754273d1",
    "archivePulseControl":"ae04751221b6b53efd3205010e603b14242db8dc63ee06d37a78f66b057ccd92",
    "activeSlow":"c6cc14cede238f252f31996abd2dabdbb8c8c34aae972e3288c40866241fc249",
    "activeTransverse":"92efd7b6e297e59a8d74f0692313e485e7b6d60340330406ae0a42cb55777ce0",
    "pulseVerifier":"906166bca23bfbd7a275ddef59462b84ed54666ed7aa22bb45e98da5ee29434f",
    "algebra":"260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75",
}
AXIS_NAMES=("band","T","Z","R")


def read(path,pin=None):
    content=path.read_bytes()
    digest=sha256(content).hexdigest()
    assert pin is None or digest==pin,path
    return json.loads(content),digest


def archived_axes(g,axis_rows,guard):
    out={}
    for axis,index,fixed in zip(AXIS_NAMES,range(4),
            ({622791,622803,622804},{622791,622804,623857},
             {622791,622803,623856},{622791,622802,623855}),strict=True):
        cutoff=next(r for r in axis_rows if r["offset"]==guard[index][0])
        bump=cutoff["bumps"]["0"]
        op,args=g.node(bump)
        assert op=="smooth_piecewise"
        op,step=g.node(args[4])
        assert op=="source_step_derivative" and step[1]==0
        out[axis]={"guard":guard[index],"normalizedFactor":cutoff["factor"],
                   "centralStepArgument":step[0],"fixedArgumentCoordinates":sorted(fixed)}
    return out


def signed(g,native,candidate,pulse_rows,axes,strip_guards,exact):
    defs={r["id"]:r for r in native[0]}
    pulses={r["chart"]:r["pulse"] for r in pulse_rows}
    result=[]
    for t in candidate["templates"]:
        key=t["key"]
        row=t["rows"][0]
        assert row["m"]==1
        guard=strip_guards(g.record,row["guarded"][0]["real"],row["supported"][0]["real"])
        xi,_,r0=guard[-2]
        assert guard[-1]==pulses[key] and all(axes[a]["guard"] in guard[:4] for a in AXIS_NAMES)
        a=exact(g)
        assert a.of(r0)==a.scalar(F(1,2**34))
        witnesses={}

        @cache
        def vanish(i,axis,x):
            if i==0:
                return True
            b=axes[axis] if axis!="xi" else None
            if b and i==b["normalizedFactor"]:
                witnesses.setdefault(axis,set()).add(i)
                return True
            op,args=g.node(i)
            cond=lambda n:vanish(n,axis,x)
            if op=="add":
                return all(map(cond,args))
            if op=="multiply":
                return any(map(cond,args))
            if op=="integer_power":
                return args[1]>0 and cond(args[0])
            if op=="source_step_derivative" and b and args[0]==b["centralStepArgument"]:
                witnesses.setdefault(axis,set()).add(i)
                return True
            if op=="smooth_piecewise":
                if axis=="xi":
                    norm,_,upper,_,_,end=args
                    normop,normargs=g.node(norm)
                    if end==0 and a.of(upper)==a.scalar(F(3,4)) and normop=="sqrt_positive":
                        square,powers=g.node(normargs[0])
                        if square=="integer_power" and powers[1]==2 and a.of(powers[0])==a.mul(a.of(x),a.inv(a.of(r0))):
                            witnesses.setdefault(axis,set()).add(i)
                            return True
                return all(map(cond,args[3:]))
            if op=="m3_coupled_expression_partial":
                owner,actual,orders=args
                d=defs[owner]
                binding=dict(zip(d["parameters"],actual,strict=True))
                if b:
                    return all(binding.get(n,n)==n for n in b["fixedArgumentCoordinates"]) and cond(d["body"])
                if actual==d["parameters"]:
                    return cond(d["body"])
                selected=[f for f,value in binding.items() if value==x]
                if len(selected)==1:
                    return vanish(d["body"],axis,selected[0])
            return False

        tails,=[p["value"] for p in row["terms"] if p["family"]=="signed-cutoff-derivative"]
        cases=[]
        for j,z in enumerate(tails):
            assert z["imaginary"]==0 and z["real"]>=g.prefix
            op,args=g.node(z["real"])
            d=defs[args[0]]
            assert op=="m3_coupled_expression_partial" and not any(args[2]) and args[1]==d["parameters"]
            assert d["name"]==f"PostFiveSignedPrincipalTail_{key}_{j}"
            assert all(vanish(z["real"],axis,xi) for axis in (*AXIS_NAMES,"xi")),(key,j,z["real"])
            cases.append({"component":j,"root":z["real"],"registeredBody":d["body"]})
        assert len(cases)==3 and set(witnesses)==set((*AXIS_NAMES,"xi"))
        result.append({"chart":key,"xiGuard":guard[-2],"nativeSignedTailCases":cases,
                       "originalFlatFactorUsesByAxis":{name:sorted(ids) for name,ids in witnesses.items()}})
    assert len(result)==10
    return result


def main():
    cli=ArgumentParser(description=__doc__)
    cli.add_argument("--archive-control",action="store_true")
    for arg in ("artifact","predecessor","goal","c110","pulse","out"):
        cli.add_argument("--"+arg,type=Path,required=True)
    for arg in ("archived-guards","active-slow","active-transverse"):
        cli.add_argument("--"+arg,type=Path)
    args=cli.parse_args()
    assert sha256((args.c110/"verify_native_j2_pulse.py").read_bytes()).hexdigest()==PINS["pulseVerifier"]
    origin=args.goal/"first-force-repair"
    assert sha256((origin/"verify_repaired_first_force.py").read_bytes()).hexdigest()==PINS["algebra"]
    sys.path[:0]=[str(args.c110),str(origin)]
    from verify_active_j2_full_source import (
        ACTIVE_PREFIX, ARCHIVE_PREFIX, MANIFEST, REGISTRY, PINS as SOURCE, protected_prefix, registry, scan, strip_guards,
    )
    from verify_native_j2_pulse import Graph
    from verify_repaired_first_force import Exact

    active=not args.archive_control
    if active:
        prefix=ACTIVE_PREFIX
        directory=args.artifact/"active-n3-repeat-forced-source"
        manifest,mhash=read(directory/MANIFEST)
        candidate,_=read(args.artifact/"active-n3-repeat-forced-candidate.json")
        pulse,pulse_sha=read(args.pulse)
        assert pulse["status"]=="CONDITIONAL_ACTIVE_ORIGINAL_CLOSED_PULSE_EQUALITY"
        slow,_=read(args.active_slow,PINS["activeSlow"])
        trans,_=read(args.active_transverse,PINS["activeTransverse"])
        assert slow["source"]["sha256"]==trans["originalStreamSHA256"]==SOURCE["activePredecessorStream"]
    else:
        prefix=ARCHIVE_PREFIX
        directory=args.artifact
        manifest,mhash=read(directory/MANIFEST,SOURCE["archiveManifest"])
        candidate,_=read(directory/"post-five-repeat-forced-candidate.json",SOURCE["archiveCandidate"])
        pulse,pulse_sha=read(args.pulse,PINS["archivePulseControl"])
        assert pulse["status"]=="VERIFIED_ARCHIVED_RAW_IDEAL_AND_SIGNED_TAIL_CONTROL"
        guards,_=read(args.archived_guards,PINS["archivedGuards"])
    assert pulse["manifestSHA256"]==mhash and pulse["sourceStreamSHA256"]==manifest["node_stream_sha256"]
    old,_=read(args.predecessor/MANIFEST,SOURCE["activePredecessorManifest" if active else "archivePredecessorManifest"])
    native=registry(directory/REGISTRY,manifest)
    protected_prefix(native,registry(args.predecessor/REGISTRY,old))
    with TemporaryFile(dir=args.out.parent) as backing:
        append,protected,stream=scan(directory,manifest,prefix,old,backing)
        graph=Graph(append,protected,prefix)
        binding=(slow["axisFactors"] if active else
                 archived_axes(graph,guards["slowAxes"],guards["sourceCases"][0]["sourceGuards"]))
        rows=signed(graph,native[1],candidate,pulse["rows"],binding,strip_guards,Exact)
        if active:
            for actual,conditional in zip(rows,trans["charts"],strict=True):
                assert actual["chart"]==conditional["chart"] and actual["xiGuard"][0]==conditional["xi"]
    result={"schema":"MathScope.C112.NativeOriginalSecondForcedNonradialAppend/1",
            "status":("CONDITIONAL_ACTUAL_NONRADIAL_FACE_ATTACHMENTS" if active else "VERIFIED_ORIGINAL_ARCHIVE_NONRADIAL_SIGNED_TAIL_CONTROL"),
            "streamSHA256":stream["sha256"],"pulseClosureSHA256":pulse_sha,"rows":rows,
            "checkedSignedBodies":30,"axisChecks":150,
            "conditional":"On each selected fixed-label nonradial face, the exact guarded and unclipped source have the same zero ordinary trace when all other guards are strict and original ordinary/native coefficients admit the required derivatives. Combine with the exact prior closed-pulse, raw wave-ideal and protected original argument obligations.",
            "radialOrdinaryExtension":"OPEN","completeStageTwo":"OPEN","finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print(result["status"],result["checkedSignedBodies"],result["axisChecks"])


if __name__=="__main__":
    assert __debug__
    main()
