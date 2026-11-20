"""Join the original pulse collar proof to the actual second Forced source append."""

from argparse import ArgumentParser
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

from verify_active_j2_full_source import (
    ACTIVE_PREFIX, ACTIVE_RUN, ARCHIVE_PREFIX, MANIFEST, PARTS, PINS, REGISTRY,
    load, node_children, protected_prefix, registry, scan, strip_guards,
)


RAW_IDEAL="6d09619cebde2ae5c3a6dcfba20b38918022a108588dccefece4f4971ad374c8"
EXACT_ALGEBRA="260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75"
ARCHIVE_CLOSED="547c4079aa37fbf0afb6463a34f392e52eb25cf1915dbfb05ad86b50ba5c7ed6"
ACTIVE_WAVES="2d326dee551a7c4b83908aab1244fcbd9916d398fa3d77af17eb73698106256b"
ACTIVE_TAILS="7932abec4bdcc8db898e8c3c7fb8c5b8e217879fe31937eedf437874154b7f03"


class Graph:
    def __init__(self,appendix,protected,prefix):
        self.appendix=appendix
        self.protected=protected
        self.prefix=prefix

    def node(self,i):
        row=self.record(i)
        return row["op"],row["args"]

    def record(self,i):
        return self.appendix[i-self.prefix] if i>=self.prefix else self.protected(i)


def signed_tails(g,template,defs,pulse,length,exact):
    a=exact(g)
    seen=set()

    @cache
    def bounds(v):
        scale=a.mul(a.scalar(20),a.of(v),a.inv(a.of(length)))
        return a.sub(scale,a.scalar(4)),a.sub(a.scalar(16),scale)

    @cache
    def zero(i,v,side):
        if i==0:
            return True
        op,args=g.node(i)
        if op=="add":
            return all(zero(k,v,side) for k in args)
        if op=="multiply":
            return any(zero(k,v,side) for k in args)
        if op=="integer_power":
            return args[1]>0 and zero(args[0],v,side)
        if op=="source_step_derivative":
            matching=[j for j,edge in enumerate(bounds(v)) if edge==a.of(args[0])]
            if matching and (args[1]>0 or side in matching):
                seen.add((i,v,args[1]))
                return True
        if op in defs:
            row=defs[op][args[0]]
            formals=row["parameters"]
            if args[1]==formals:
                return zero(row["body"],v,side)
            arguments=[f for f,k in zip(formals,args[1],strict=True) if k==v]
            if len(arguments)==1:
                return zero(row["body"],arguments[0],side)
        return False

    first=template["rows"][0]
    assert first["m"]==1
    tails,=[r["value"] for r in first["terms"] if r["family"]=="signed-cutoff-derivative"]
    assert len(tails)==3
    for j,z in enumerate(tails):
        assert z["imaginary"]==0 and z["real"]>=g.prefix
        op,args=g.node(z["real"])
        d=defs[op][args[0]]
        assert d["name"]==f"PostFiveSignedPrincipalTail_{template['key']}_{j}"
        assert args[1]==d["parameters"] and not any(args[2])
        assert all(zero(z["real"],pulse,side) for side in (0,1)),(template["key"],j,d["body"])
    assert seen and any(order>0 for *_,order in seen)
    return {"roots":tails,"originalStepUses":[list(x) for x in sorted(seen)]}


def verify(g,registry,candidate,waves,active,raw_prover,exact):
    raw,groups,_=registry
    base=raw["base"]
    defs={"m3_coupled_expression_partial":{r["id"]:r for r in groups[0]},
          "m3_aux_expression_partial":dict(enumerate(json.loads(base["expressionDefinitions"]))),
          "actual_expression_partial":dict(enumerate(json.loads(base["base"]["expression"])))}
    if active:
        waves={c["chart"]:c for c in waves["charts"]}
    rows=[]
    for template in candidate["templates"]:
        key=template["key"]
        raw_proof=raw_prover(g,template,defs["m3_coupled_expression_partial"],
                             lambda row:node_children(row["op"],row["args"]),g.prefix)
        first=template["rows"][0]
        v,lower,length=strip_guards(g.record,first["guarded"][0]["real"],first["supported"][0]["real"])[-1]
        assert lower==0
        if active:
            owners={r["system"]:r["actualBody"] for r in template["rawSupport"]["waveJets"]}
            assert sorted(owners.items())==[tuple(x) for x in waves[key]["reportedOwnersAndVerifiedProtectedBodyRoots"]]
            assert all(defs["m3_coupled_expression_partial"][owner]["body"]==body for owner,body in owners.items())
            assert waves[key]["v"]==v and waves[key]["Ls"]==length
        signed=signed_tails(g,template,defs,v,length,exact)
        rows.append({"chart":key,"pulse":[v,lower,length],"independentRawIdeal":raw_proof,
                     "signedCutoffDerivative":signed})
    assert len(rows)==10 and sum(len(r["independentRawIdeal"]["checks"]) for r in rows)==240
    return rows


def main():
    cli=ArgumentParser(description=__doc__)
    cli.add_argument("--archive-control",action="store_true")
    for arg in ("artifact","predecessor","goal","out"):
        cli.add_argument("--"+arg,type=Path,required=True)
    for arg in ("closed-pulse","native-readback","protected-waves","protected-tails"):
        cli.add_argument("--"+arg,type=Path)
    args=cli.parse_args()
    original=args.goal/"first-force-repair"
    for path,pin in ((original/"check_repeat_raw_support_ideal.py",RAW_IDEAL),
                     (original/"verify_repaired_first_force.py",EXACT_ALGEBRA)):
        assert sha256(path.read_bytes()).hexdigest()==pin,path
    sys.path.insert(0,str(original))
    from check_repeat_raw_support_ideal import verify_case
    from verify_repaired_first_force import Exact
    active=not args.archive_control
    if active:
        prefix=ACTIVE_PREFIX
        directory=args.artifact/"active-n3-repeat-forced-source"
        manifest,mhash=load(directory/MANIFEST)
        candidate,_=load(args.artifact/"active-n3-repeat-forced-candidate.json")
        live,_=load(args.native_readback)
        assert live["terminalRun"]["run"]==ACTIVE_RUN and live["manifestSHA256"]==mhash
        assert live["status"]=="VERIFIED_ACTUAL_ACTIVE_N3_REPEAT_APPEND_AND_GUARD_INTERIOR_STAGE_TWO_OPEN"
        assert live["candidateSHA256"]==sha256((args.artifact/"active-n3-repeat-forced-candidate.json").read_bytes()).hexdigest()
        waves,_=load(args.protected_waves,ACTIVE_WAVES)
        tails,_=load(args.protected_tails,ACTIVE_TAILS)
        assert tails["sourceStreamSHA256"]==waves["predecessor"]["streamSHA256"]
    else:
        prefix=ARCHIVE_PREFIX
        directory=args.artifact
        manifest,mhash=load(directory/MANIFEST,PINS["archiveManifest"])
        candidate,_=load(directory/"post-five-repeat-forced-candidate.json",PINS["archiveCandidate"])
        waves,_=load(args.closed_pulse,ARCHIVE_CLOSED)
        assert waves["componentSlots"]==240 and waves["graphNodes"]==manifest["node_count"]
    old_manifest,_=load(args.predecessor/MANIFEST,
                        PINS["activePredecessorManifest" if active else "archivePredecessorManifest"])
    current=registry(directory/REGISTRY,manifest)
    prior=registry(args.predecessor/REGISTRY,old_manifest)
    counts=protected_prefix(current,prior)
    with TemporaryFile(dir=args.out.parent) as backing:
        appendix,protected,stream=scan(directory,manifest,prefix,old_manifest,backing)
        g=Graph(appendix,protected,prefix)
        truth=verify(g,current,candidate,waves,active,verify_case,Exact)
    out={"schema":"MathScope.C110.SecondForcedClosedPulseCollarReadback/1",
         "status":("CONDITIONAL_ACTIVE_ORIGINAL_CLOSED_PULSE_EQUALITY" if active else "VERIFIED_ARCHIVED_RAW_IDEAL_AND_SIGNED_TAIL_CONTROL"),
         "manifestSHA256":mhash,"sourceStreamSHA256":stream["sha256"],"protectedRegistryCounts":counts,
         "sourceScalarSlots":240,"nonzeroSignedDerivativeTails":30,"rows":truth,
         "closedPulseConclusion":"On the fixed closed original native pulse [0,Ls], with the four slow offset guards, shell guard, transverse guard and all ordinary operands admitted, the guarded candidate equals the original unclipped supported source. Both pulse faces have zero one-sided ordinary jets through the order supplied by the native source realization.",
         "equalityOutsideOtherGuards":"OPEN. Ordinary slow, radial shell, transverse, mixed seam and global cycle require separate proofs.",
         "completeSecondCorrection":"OPEN","finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(out,indent=2)+"\n").encode())
    print(out["status"],"raw slots",240,"nonzero Signed tails",30)


if __name__=="__main__":
    assert __debug__
    main()
