"""Read original active N3 repeat operands and compare the archived append layout."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
import gzip
from hashlib import sha256
import json
from pathlib import Path


PINS={
    "active":"20e3cb1dbf4d4af9ec8548c027f29e5c5225091012d6b0ae33fa6cce320be4ca",
    "activeReplay":"424fcc1a91ae3a0ec265fdbd4f320e825424aabe3a934161749a5310722df8a4",
    "old":"43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf",
    "oldGauge":"55b855b7a3aade117887f361ffbb665d241eb5468d447a88b792bbdf483b4ba6",
    "oldAppendSeal":"b9c7e7079cc9ea4dc559dc167462c3e9f64c496910810ecbb93b0f201b1734e1",
    "oldAppend":"f0f90223c0230ab38f7316186d5a5e3a7df7e19aab78a97d6a172e9cdaf61719",
    "family":"b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78",
}
OLD_PREFIX=4456994
ACTIVE_PREFIX=22155584
APPEND=225012
SHIFT=ACTIVE_PREFIX-OLD_PREFIX
EXPRESSION_SHIFT=14
COMPLEX=("real","imaginary")


def pin(path,key):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],(key,path)
    return raw


def read(path,key):
    return json.loads(pin(path,key))


def graph_children(op,a):
    if op in ("add","multiply","maximum","smooth_piecewise","definite_integral"):
        return a
    if op in ("inverse","integer_power","sqrt_positive","exp","log_positive","ceiling","source_step_derivative"):
        return a[:1]
    if op in ("actual_expression_partial","m3_coupled_expression_partial"):
        return a[1]
    if op=="m3_forced_pulse_partial":
        return [a[3],*a[4]]
    if op=="actual_covariance_volterra":
        return [a[2],*a[3]]
    assert op=="coordinate",op
    return []


def compare_layout(active,old,old_gauge):
    modes={(row["key"],row["m"]):row for row in old["systems"]}
    gauges={(row["template"],row["mode"]):row for row in old_gauge["candidateRoots"]}
    assert len(modes)==len(gauges)==40
    templates={r["key"]:r for r in old["templates"]}
    stats=Counter()
    appended={}
    pre={}

    def pair(kind,o,n):
        assert type(o) is type(n) is int,(kind,o,n)
        if o>=OLD_PREFIX:
            assert ACTIVE_PREFIX<=n<ACTIVE_PREFIX+APPEND
            assert n-o==SHIFT,(kind,o,n)
            assert o not in appended or appended[o]==n
            appended[o]=n
            stats[kind+"Append"]+=1
        else:
            assert n<ACTIVE_PREFIX
            assert o not in pre or pre[o]==n,(kind,o,n,pre.get(o))
            pre[o]=n
            stats[kind+"Prefix"]+=1

    def complex_pair(kind,o,n):
        for part in COMPLEX:
            pair(kind,o[part],n[part])

    def vector(kind,o,n):
        for a,b in zip(o,n,strict=True):
            complex_pair(kind,a,b)

    def expression_ids(old_id,active_id):
        prefix="coupled-expression:"
        assert old_id.startswith(prefix) and active_id.startswith(prefix)
        assert int(active_id.removeprefix(prefix))-int(old_id.removeprefix(prefix))==EXPRESSION_SHIFT

    for a,b in zip(old["precedingConservativeResidual"],active["precedingConservativeResidual"],strict=True):
        pair("predecessorResidual",a,b)
    for o,n in zip(old["fields"],active["fields"],strict=True):
        assert o["field"]==n["field"]
        pair("predecessorIndexedField",o["root"],n["root"])
    vector("updatedMean",old["mean"]["velocity"],active["mean"]["velocity"])
    complex_pair("updatedMean",old["mean"]["pressure"],active["mean"]["pressure"])
    for n in active["templates"]:
        o=templates[n["key"]]
        assert (o["sign"],o["difference"])==(n["sign"],n["difference"])
        pair("phase",o["phase"],n["phase"])
        for u,v in zip(o["rows"],n["rows"],strict=True):
            assert u["m"]==v["m"]
            for shape in ("raw","subtraction","supported","guarded"):
                vector(shape,u[shape],v[shape])
            for x,y in zip(u["terms"],v["terms"],strict=True):
                assert x["family"]==y["family"]
                vector("subtractedSourceTerm",x["value"],y["value"])
        u,v=o["rawSupport"],n["rawSupport"]
        assert len(u["checks"])==len(v["checks"])==24
        for a,b in zip(u["checks"],v["checks"],strict=True):
            assert a["pass"] and b["pass"] and a["id"]==b["id"]
            for root in ("source","reduced","expression"):
                pair("waveSupportReduction",a[root],b[root])
        for a,b in zip(u["waveSystems"],v["waveSystems"],strict=True):
            expression_ids(a,b)
        for a,b in zip(u["waveJets"],v["waveJets"],strict=True):
            expression_ids(a["system"],b["system"])
            assert a["orders"]==b["orders"]
            pair("waveZeroInput",a["actualBody"],b["actualBody"])

    for n in active["systems"]:
        key=n["key"],n["m"]
        o=modes[key]
        assert n["system"]==o["system"]
        for polarity in ("positive","negative"):
            assert n[polarity]["m"]==o[polarity]["m"]
            vector("returnedVelocity",o[polarity]["velocity"],n[polarity]["velocity"])
            complex_pair("returnedPressure",o[polarity]["pressure"],n[polarity]["pressure"])
        for x,y in zip(o["pullback"],n["pullback"],strict=True):
            for part in COMPLEX:
                for form in ("body","shared","mapped","invariant"):
                    pair("pullback",x[part][form],y[part][form])
        for form,x in o["mappedCutoff"].items():
            y=n["mappedCutoff"][form]
            if type(x) is int:
                pair("mappedCutoff",x,y)
            elif type(x) is list:
                vector("mappedCutoff",x,y)
            else:
                complex_pair("mappedCutoff",x,y)
        for g,v in zip(gauges[key]["complexPotential"],n["mappedPotentialCoefficients"],strict=True):
            for part,name in (("real","physicalReal"),("imaginary","physicalImaginary")):
                x,y=g[name],v[part]
                assert x["multiplier"]==y["sign"]
                expression_ids(x["system"],y["system"])
                pair("gaugeBodies",x["body"],y["rawBody"])
                pair("gaugeCalls",x["root"],y["id"])
                for a,b in zip(x["exactArguments"],y["actualArguments"],strict=True):
                    pair("gaugeArguments",a,b)
    assert stats["returnedVelocityAppend"]+stats["returnedPressureAppend"]==640
    assert stats["gaugeCallsAppend"]==stats["gaugeBodiesAppend"]==240
    return stats,pre,appended


def branch_family(family):
    assert family["numerical_field_evaluator"] is family["numerical_supremum_evaluator"] is False
    ns={row["id"]:row for row in family["nodes"]}
    rows=[]
    stage=next(v for v in ns.values() if v["operation"]=="CompletedActualStage" and v["data"]["j"]==2)
    prior=stage["data"]["complete_cycle_predecessor"]
    assert ns[prior]["operation"]=="CompletedActualStage" and ns[prior]["data"]["j"]==1
    p=stage
    while p["id"]!=prior:
        rows.append({"operator":p["operation"],"id":p["id"],"inputs":p["inputs"]})
        p=ns[p["inputs"][0]]
    assert [r["operator"] for r in rows]==["CompletedActualStage","FullPressureAndResidualRefresh","OriginalFiveMap",
        "FullPressureAndResidualRefresh","OriginalTemporalMap","FullPressureAndResidualRefresh","OriginalSignedMap",
        "FullPressureAndResidualRefresh","OriginalForcedMap"]
    forced=rows[-1]
    assert ns[forced["inputs"][1]]["operation"]=="GroupedSupportedNonzeroResidual"
    selector=ns[family["concrete_window_scale_nodes"][1]]
    source=[]
    for norm in selector["data"]["norm_inputs"]:
        row=ns[norm]
        assert row["operation"]=="ActualCutoffCurlBound"
        source.append({"root":norm,"order":row["data"]["m"],"domain":row["data"]["uniform_scale_domain"],
                       "uncutBound":row["inputs"][0],"potential":ns[row["inputs"][0]]["inputs"][0]})
    assert len({x["potential"] for x in source})==1
    target=ns[source[0]["potential"]]
    assert target["inputs"]==[prior,stage["id"]]
    assert target["data"]["velocity_identity"]=="delta u_j=curl A_j+B_j e_theta"
    return {"completeStage":stage["id"],"actualPredecessor":prior,"cycleBackwards":rows,
            "cutoffSupremumInputs":source,"scale":selector["id"],"canonicalPointProbe":{"a":1,
                "domain":"Any actual positive original D point with q<min(qBig,1/2) and all native guards admitted.",
                "identity":"chi(q)=1 locally. T_1 Z_2=(delta u_2,p_2), with the complete j=2 increments.",
                "quotedLower":"weighted tested point lower divided by (1+abs(log q))^P_hat is a valid S_hat lower.",
                "certifiedInactiveRule":"For any tested order m, S_hat > ceil(h*(B+log64)/20-2)-2 suffices for C_hat via its original integer ceiling.",
                "actualSourceEvaluation":"OPEN after the full repeat cycle, not supplied by a Forced-only candidate."}}


def main(args):
    active=read(args.active,"active")
    current=read(args.active_replay,"activeReplay")
    old=read(args.old,"old")
    old_gauge=read(args.old_gauge,"oldGauge")
    seal=read(args.old_append_seal,"oldAppendSeal")
    assert active["mode"]=="metadata" and active["graphSnapshot"] is None
    assert current["missingRepeatRawStreamAndRegistry"] and current["completeSecondCorrection"]=="OPEN"
    assert active["preRepeatNodeCount"]==current["preRepeatNodeCount"]==ACTIVE_PREFIX
    assert active["postRepeatNodeCount"]==current["postRepeatNodeCount"]==ACTIVE_PREFIX+APPEND
    assert seal["baseNodeCount"]==OLD_PREFIX and seal["appendedNodeCount"]==APPEND==current["repeatAppendNodesReported"]
    assert active["sourceModuleSHA256"]=="4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7"
    stats,pre,appended=compare_layout(active,old,old_gauge)
    bytes=gzip.decompress(pin(args.old_append,"oldAppend"))
    assert sha256(bytes).hexdigest()==seal["appendedNodeRecordsSHA256"]
    rows=bytes.splitlines()
    assert len(rows)==APPEND
    shape=Counter()
    fringe=set()
    exemplars={}
    for i,line in enumerate(rows,OLD_PREFIX):
        rec=json.loads(line)
        op=rec["op"]
        shape[op]+=1
        for source in graph_children(op,rec["args"]):
            if source<OLD_PREFIX:
                fringe.add(source)
                exemplars.setdefault(source,i)
            else:
                assert source<i,(i,op,source)
    missing=sorted(fringe-pre.keys())
    assert missing
    stats={key:value for key,value in sorted(stats.items())}
    proof=branch_family(read(args.family,"family"))
    roots=[]
    for a in active["systems"]:
        roots.append({"chart":a["key"],"mode":a["m"],"system":a["system"],"positive":a["positive"],
                      "negative":a["negative"],"pairedMappedGauge":a["mappedPotentialCoefficients"],
                      "readbackStatus":"same-process reported IDs; native append bodies unavailable"})
    assert len(roots)==40
    assert Q(17,1024)*(Q(11,4)**4)<1
    result={"schema":"MathScope.C109.ActiveOriginalJ2PredecessorOperandFrontier/1",
      "status":"VERIFIED_ACTIVE_METADATA_AND_ARCHIVED_OFFSET_AGREEMENT_STAGE_TWO_SOURCE_OPEN",
      "pins":PINS,"sourceScope":{"activeOriginalPrefix":ACTIVE_PREFIX,"archiveN1Prefix":OLD_PREFIX,
        "activeReportedAppend":APPEND,"archiveAuthenticatedAppend":APPEND,
        "sameShiftAcrossMatchedAppendNodes":SHIFT,"sameShiftAcrossReportedCoupledExpressionSlots":EXPRESSION_SHIFT,
        "matchedUniqueAppendNodes":len(appended),"matchedUniquePrefixNodes":len(pre),"matchedForms":stats},
      "archiveFrontier":{"arithmeticNodes":len(rows),"operations":dict(sorted(shape.items())),
        "distinctReferencedPrefixNodes":len(fringe),"matchedBySameRunMetadata":len(fringe&pre.keys()),
        "missingActivePrefixRemappingCount":len(missing),
        "sampleArchivedPrefixDependenciesStillUnmapped":[{"oldId":k,"firstArchivedUse":exemplars[k]} for k in missing[:16]]},
      "actualStageTwoOriginalRecurrence":proof,"actualRepeatTypedSourceRoots":roots,
      "remainingExecutableObligation":"Export the original active N3 repeat append and registry from the same-process private PDE owner. Bind guarded versus supported operators before constructing the full Forced state and fresh Signed/Temporal/FiveMap successors. The archived arithmetic body and the active metadata offset agreement do not fill either obligation.",
      "actualStageTwoCutoffLower":"OPEN","actualStageTwoBound":"OPEN","N706":"OPEN","finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("Active j2 operand readback", len(appended), "append", len(pre), "prefix", len(missing), "unmapped archived prefix inputs")


if __name__=="__main__":
    assert __debug__
    parser=ArgumentParser(description=__doc__)
    for name in ("active","active-replay","old","old-gauge","old-append-seal","old-append","family","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    main(parser.parse_args())
