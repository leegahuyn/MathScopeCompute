"""Replay original Y ledger admissions with a forward lexical-path audit."""

import argparse
from collections import defaultdict
from fractions import Fraction
import gzip
from hashlib import sha256
import json
from pathlib import Path


HASHES = {
    "reached": "5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459",
    "registry": "bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e",
    "profile": "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a",
    "previous": "f810fd2b7d8952f78f1c1e312358903ac9f208c1c6132b67fb861e4ce4404cbb",
    "a21": "1757c03287516aa17710ebd40cd7c80cbff5af3b9af76a85639e8854391132ee",
}
STREAM_SHA = "a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269"
NODES = 4_420_257
ROOTS = [4419697,4419698,4419699,4419702,4419723,4420035,4420037,4420039,4420249,4420251,4420253]
SELECTED = {10219,10283,10505,21297,21441,22268}

# y -> (bound coordinate, start, end). These are original node IDs.
BINDERS = {
    **{y:(y,0,3628) for y in (3640,3647,3656,3663,3672)},
    3684:(3682,3612,3625), 3703:(3701,3612,3625),
    **{y:(y,0,474) for y in (4487,4492,4501,4508,4516,6319,6326,6334)},
    28890:(28879,0,28823), 28908:(28906,0,28823), 28955:(28944,0,28823),
}


def pinned(path, key):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == HASHES[key], key
    return data


def ids_sha(ids):
    return sha256(json.dumps(sorted(ids),separators=(",",":")).encode()).hexdigest()


def operands(op, a):
    """Read ordinary AST pointers. A native body is a separate lexical entry."""
    if op in ("rational","coordinate","source_parameter"):
        return ()
    if op in ("add","multiply","maximum","smooth_piecewise"):
        return a
    if op in ("inverse","sqrt_positive","exp","log_positive","sine","cosine","ceiling",
              "integer_power","source_step_derivative"):
        return a[:1]
    if op == "definite_integral":
        return (a[0],a[2],a[3])
    if op == "actual_natural_series":
        return a[1:3]
    if op in ("actual_background_picard","actual_background_even_profile"):
        return a[2:4]
    if op == "actual_quadratic_root":
        return a[2:3]
    if op == "actual_monotone_root":
        return a[1:]
    if op in ("actual_covariance_volterra","actual_pulse_jet_volterra",
              "actual_pulse_sensitivity_volterra","actual_pulse_third_jet_volterra",
              "actual_n6_pulse_higher_jet_volterra","m3_global_pulse_jet"):
        return (a[2],*a[3])
    if op == "m3_forced_pulse_partial":
        return (a[3],*a[4])
    if op.endswith("_partial") and len(a)==3 and isinstance(a[1],list):
        return a[1]
    raise AssertionError((op,a))


def authenticate_stream(stream, records):
    whole = sha256()
    checked = 0
    with gzip.open(stream,"rb") as f:
        header=f.readline()
        assert json.loads(header) == {"schema":"MathScope.M3.FullNodesJSONL/1","node_count":NODES}
        whole.update(header)
        count=0
        for i,line in enumerate(f):
            whole.update(line)
            count+=1
            if i in records:
                assert json.loads(line)==records[i],i
                checked+=1
    assert count==NODES and checked==len(records)
    assert whole.hexdigest()==STREAM_SHA


def lexical_paths(starts, nodes, edges, targets, triple):
    """Forward two-state walk. Only matching integral bodies grant the interval."""
    variable, endpoint0, endpoint1 = triple
    live = set(targets)
    for i in sorted(nodes):
        if any(j in live for j in edges[i]):
            live.add(i)
    queue=[(i,False) for i in starts if i in live]
    seen=set()
    witnessed=set()
    open_ids=set()
    guards=set()
    while queue:
        state=queue.pop()
        if state in seen:
            continue
        seen.add(state)
        i, bound=state
        if i in targets:
            (witnessed if bound else open_ids).add(i)
        op, a = nodes[i]["op"],nodes[i]["args"]
        if op=="definite_integral" and a[1]==variable:
            # A shadowed local binder never inherits an outer interval.
            local=(a[2],a[3])==(endpoint0,endpoint1)
            if a[0] in live:
                queue.append((a[0],local))
                if local:
                    guards.add(i)
            queue.extend((j,bound) for j in a[2:] if j in live)
        else:
            queue.extend((j,bound) for j in edges[i] if j in live)
    return witnessed,open_ids,sorted(guards),len(seen)


def validate_profile(data,nodes):
    profile=json.loads(data.decode().split("export const PINNED_N3 = ",1)[1].strip().rstrip(";"))["parametersExactExpressions"]
    assert profile["Lambda"]=={"power":[{"ref":"Q"},64]}
    assert profile["Xa"]=={"quotient":[{"integer":4},{"ref":"Lambda"}]}
    assert profile["t1"]=={"power":[{"ref":"CSelected"},-120]}
    assert profile["CSelected"]=={"exp":{"ref":"logCSelected"}}
    assert profile["logCSelected"]["sum"][1]=={"power":[{"ref":"Q"},200]}
    assert profile["K"]=={"power":[{"ref":"Pstar"},2]}
    assert profile["Pstar"]=={"exp":{"ref":"logP"}}
    assert profile["logP"]=={"product":[{"integer":2},{"ref":"T"}]}
    assert profile["T"]=={"sum":[{"exp":{"ref":"Md"}},{"integer":10}]}
    assert profile["h"]=={"exp":{"product":[{"integer":-8002},{"ref":"T"}]}}
    assert profile["j0"]=={"power":[{"ref":"h"},4]}
    assert profile["sigmaStar"]=={"quotient":[{"ref":"j0"},{"integer":2000}]}
    q=profile["Q"]["quotient"]
    assert int(q[0]["product"][0]["integer"])==2**260
    assert q[0]["product"][1]=={"ref":"K"} and q[1]=={"power":[{"ref":"sigmaStar"},2]}
    expected = {
        0:("rational",["0","1"]), 2:("coordinate",["eta"]),
        474:("rational",["4","1"]), 24:("rational",["2","1"]),
        3454:("source_parameter",["Lambda"]), 3612:("source_parameter",["t1"]),
        3617:("source_parameter",["Xa"]), 3623:("exp",[3612]),
        3624:("multiply",[3617,3623]), 3625:("multiply",[24,3612]),
        3628:("multiply",[3454,3624]), 28820:("rational",["1","32"]),
        28821:("multiply",[3612,28820]), 28822:("exp",[28821]),
        28823:("multiply",[3617,28822]),
    }
    for i,(op,args) in expected.items():
        assert nodes[i]=={"op":op,"args":args},i
    # 0<t1<2^-120 gives 2*t1<1/64. For 0<=s<=2*t1,
    # the positive exponential series sums below its geometric upper bound.
    assert Fraction(2,2**120)<Fraction(1,64)
    assert 4/(1-Fraction(1,64))==Fraction(256,63)<5
    for y,(v,lo,hi) in BINDERS.items():
        assert nodes[v]["op"]=="coordinate"
        if lo==3612:
            e,=nodes[y]["args"][1:]
            assert nodes[y]=={"op":"multiply","args":[474,e]}
            assert nodes[e]=={"op":"exp","args":[v]}
            assert hi==3625
        elif hi==28823:
            assert nodes[y]=={"op":"multiply","args":[3454,v]} and lo==0
        else:
            assert y==v and lo==0 and hi in (474,3628)


def run(args):
    reached=json.loads(pinned(args.reached,"reached"))
    pinned(args.registry,"registry")
    previous=json.loads(pinned(args.previous,"previous"))
    a21=json.loads(pinned(args.a21,"a21"))
    nodes=dict(reached["nodes"])
    assert len(nodes)==159655
    authenticate_stream(args.stream,nodes)
    assert reached["roots"]==ROOTS
    starts=set(ROOTS)|set(reached["entries"])
    assert len(reached["entries"])==1745
    assert set(reached["entries"])=={j for _,js in reached["sourceBodies"] for j in js}
    edges={i:operands(n["op"],n["args"]) for i,n in nodes.items()}
    assert all(j in nodes and j<i for i,children in edges.items() for j in children)
    validate_profile(pinned(args.profile,"profile"),nodes)

    source_calls={r["id"]:r for r in reached["calls"]}
    assert len(source_calls)==523
    assert ids_sha(source_calls)=="962a016d25ad21fe54cf285ecd8192d2a7a47d9a6451a957c6bc9fac5b3d2b00"
    prior=set()
    groups=defaultdict(set)
    for i,r in source_calls.items():
        assert nodes[i]=={"op":"actual_natural_series","args":[r["component"],r["y"],r["eta"],r["k"],r["m"]]}
        if r["y"] in (474,3628):
            prior.add(i)
        if r["y"] in BINDERS:
            groups[r["y"]].add(i)
    assert len(prior)==33 and ids_sha(prior)=="862033a6f22e1a3ad4dddbb993853a113bbeead7e4be867ca1679c68c943b490"

    independently_admissible=set()
    audit=[]
    for y,triple in BINDERS.items():
        found,open_ids,integrals,states=lexical_paths(starts,nodes,edges,groups[y],triple)
        assert found==groups[y] and not open_ids
        assert integrals
        independently_admissible.update(found)
        audit.append({"yOperand":y,"originalBinderVariable":triple[0],"endpointNodes":triple[1:],
                      "allAdmittedIds":sorted(found),"enclosingIntegrals":integrals,
                      "checkedLexicalStates":states,"openIds":[]})

    control_target=10219
    found,open_ids,_,_=lexical_paths(starts|{control_target},nodes,edges,{control_target},BINDERS[3703])
    assert found==open_ids=={control_target}
    assert len(independently_admissible)==109
    assert independently_admissible.isdisjoint(prior)
    assert prior|independently_admissible==set(previous["certifiedRealYCallIds"])
    remaining=set(source_calls)-(prior|independently_admissible)
    assert len(remaining)==381
    c144_rows={row["id"]:row for row in a21["rawThirdEtaDerivativeBoundaryEnclosures"]["calls"]}
    for i,r in c144_rows.items():
        assert i in source_calls
        s=source_calls[i]
        assert (s["component"],s["y"],s["eta"],s["k"],s["m"])==(r["component"],r["YOperand"],2,r["radialOrder"],r["etaOrder"])
    assert len(c144_rows)==32 and len(prior&set(c144_rows))==4
    assert independently_admissible&set(c144_rows)==SELECTED
    additions=[]
    for i in sorted(SELECTED):
        row=source_calls[i]
        matching=next(a for a in audit if a["yOperand"]==row["y"])
        additions.append({"call":row,"fixedBinder":matching,"originalLedgerStatus":"prior-open",
                          "sourceYRange":"[0, 256/63), subset of [0, 5]",
                          "C144RawCenterAtEtaMinusOne":c144_rows[i]["rawCenter"],
                          "C144RawRadiusAtEtaMinusOne":c144_rows[i]["radius"]})
    return {
        "schema":"MathScope.C145.OriginalRealYLedgerAdmissionAppendix/1",
        "status":"INDEPENDENT_ORIGINAL_REAL_Y_RANGE_ADMISSION_EVIDENCE",
        "pins":{**HASHES,"originalStream":STREAM_SHA},
        "originalScope":"first-FiveMap eleven original physical roots; real radial Y range of every defined occurrence",
        "priorOfficialCount":33,"totalOriginalCallIds":523,
        "priorOfficialRows":[source_calls[i] for i in sorted(prior)],
        "evidenceBranchAdmissionAppendix":{"newlyAdmissible":109,"locallyCertifiedCount":142,
                                          "remainingOriginalRows":381,"groups":audit,
                                          "newRows":[source_calls[i] for i in sorted(independently_admissible)]},
        "remainingOriginalRows":[source_calls[i] for i in sorted(remaining)],
        "c144Crosswalk":{"allOriginal":32,"alreadyInPriorOfficial":4,"additionalFixedBinder":6,
                         "outsideFixedBinderProof":22,"intersectingNewRows":additions},
        "negativeControl":{"addedUnboundRoot":control_target,"openIds":[control_target]},
        "definitionConditions":"Original source profile and original real integral/binder semantics",
        "requiresActualChartImageOrQWindowAssumptions":False,
        "preservesPublishedLedgerFiles":True,"finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    p=argparse.ArgumentParser(description=__doc__)
    for name in (*HASHES,"stream","output"):
        p.add_argument(name,type=Path)
    args=p.parse_args()
    report=run(args)
    args.output.write_bytes((json.dumps(report,sort_keys=True,indent=2)+"\n").encode())
