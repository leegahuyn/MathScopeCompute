"""Inspect the real append of the original active N3 second Forced cycle."""

from argparse import ArgumentParser
from array import array
from collections import Counter, defaultdict
from fractions import Fraction
from functools import cache
from hashlib import sha256
import gzip
import json
from pathlib import Path
import re
from tempfile import TemporaryFile


ACTIVE_RUN = 44682703381
ACTIVE_COMMIT = "287ca9eeaf2ab61f8405949c40e490af915cc1b0"
ACTIVE_PREFIX = 22155584
ARCHIVE_PREFIX = 4456994
APPEND = 225012
PARTS = ("real", "imaginary")
STREAM = "original-source-nodes.jsonl.gz"
REGISTRY = "original-source-functions.json"
MANIFEST = "original-source-export-manifest.json"
NODE = re.compile(rb'^\{"op":"([A-Za-z_0-9]+)","args":\[')
GAUGE = re.compile(r'ActualPostFiveRepeatCurl_([0-4]:(?:-1|1))_m([1-4])_(real|imaginary)_([0-2])\Z')
EXPECTED_DIFF = [914,0,0,40,0]
PINS = {
    "activePredecessorManifest":"8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a",
    "activePredecessorRegistry":"e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03",
    "activePredecessorStream":"faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96",
    "activeOldMetadata":"20e3cb1dbf4d4af9ec8548c027f29e5c5225091012d6b0ae33fa6cce320be4ca",
    "activeGuard":"b8d5be0df034731fb0a14849058416bc3f15d476d6e9b8b1fe196678894a6a59",
    "archiveManifest":"8ea8adbfeec6025371a6062afe50d0f28bacece88b0fe07d792739417ac87135",
    "archiveCandidate":"43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf",
    "archiveMappedGauge":"55b855b7a3aade117887f361ffbb665d241eb5468d447a88b792bbdf483b4ba6",
    "archivePrefixRecords":"86315e712782e48ce9cf7dbf6b046bde55152e00d69de6983c06fe487f43a359",
    "archivePredecessorManifest":"c7adae44498f9705aa7cec4c3b99092c054bd23469701afebbd86470a3adcecc",
    "repeatOriginalModule":"4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7",
}


def load(path,pin=None):
    raw=path.read_bytes()
    digest=sha256(raw).hexdigest()
    assert pin is None or digest==pin,path
    return json.loads(raw),digest


def require(test,message):
    if not test:
        raise AssertionError(message)


def registry(path,manifest):
    raw,digest=load(path,manifest["definitions_sha256"])
    groups=json.loads(raw["definitions"])
    actual=[len(x) for x in groups]
    assert len(groups)==5 and actual==raw["counts"]==manifest["extended_coupled_function_counts"]
    assert manifest["function_registry_capture_kind"]=="EXTENDED_COUPLED_FACADE"
    assert manifest["extended_coupled_registry_included"] is True
    return raw,groups,digest


def protected_prefix(new,old):
    nr,ng,_=new
    pr,pg,_=old
    assert {k:v for k,v in nr.items() if k not in ("counts","definitions")} == {
        k:v for k,v in pr.items() if k not in ("counts","definitions")}
    for a,b,delta in zip(ng,pg,EXPECTED_DIFF,strict=True):
        require(len(a)-len(b)==delta and a[:len(b)]==b,"protected registry group changed")
    return pr["counts"]


def registry_targets(groups,prefix):
    defs={}
    append_gauge={}
    for i,row in enumerate(groups[0]):
        key=f"coupled-expression:{i}"
        assert row["id"]==key
        defs[key]=row
        if match:=GAUGE.fullmatch(row["name"]):
            assert row["body"]>=prefix
            chart,mode,part,component=match.groups()
            slot=(chart,int(mode),part,int(component))
            assert slot not in append_gauge
            append_gauge[slot]=row
    assert len(append_gauge)==240
    extra=[row for row in groups[3] if row["id"]>=20]
    assert [row["id"] for row in extra]==list(range(20,60))
    return defs,append_gauge,{row["id"]:row for row in extra}


def node_children(op,args):
    if op in ("add","multiply","maximum","smooth_piecewise","definite_integral"):
        return args
    if op in ("inverse","integer_power","sqrt_positive","exp","log_positive",
              "ceiling","source_step_derivative","sine","cosine"):
        return args[:1]
    if op in ("actual_expression_partial","m3_coupled_expression_partial"):
        return args[1]
    if op=="m3_forced_pulse_partial":
        return [args[3],*args[4]]
    if op=="actual_covariance_volterra":
        return [args[2],*args[3]]
    require(op in ("coordinate","rational"),f"unclassified append operation {op}")
    return []


def scan(directory,manifest,prefix,prefix_manifest,backing):
    count=manifest["node_count"]
    assert count==prefix+APPEND
    size=0
    h=sha256()
    ph=sha256()
    prh=sha256()
    ah=sha256()
    ph.update((json.dumps({"schema":"MathScope.M3.FullNodesJSONL/1","node_count":prefix},separators=(",",":"))+"\n").encode())
    hist=Counter()
    appendix=[]
    fringe={}
    references=0
    offsets=array('Q')
    with gzip.open(directory/STREAM,"rb") as stream:
        header=stream.readline()
        assert json.loads(header)=={"schema":"MathScope.M3.FullNodesJSONL/1","node_count":count}
        h.update(header)
        size=len(header)
        for i,line in enumerate(stream):
            match=NODE.match(line)
            require(match is not None and line.endswith(b']}\n'),f"node stream framing at {i}")
            hist[match[1].decode()]+=1
            h.update(line)
            size+=len(line)
            if i<prefix:
                ph.update(line)
                prh.update(line)
                offsets.append(backing.tell())
                backing.write(line)
            else:
                node=json.loads(line)
                for child in node_children(node["op"],node["args"]):
                    assert type(child) is int and 0<=child<i,(i,node["op"],child)
                    if child<prefix:
                        references+=1
                        fringe.setdefault(child,i)
                appendix.append(node)
                ah.update(line)
    assert len(appendix)==APPEND and len(offsets)==prefix
    assert sum(hist.values())==count and dict(hist)==manifest["operation_histogram"]
    assert size==manifest["node_stream_uncompressed_bytes"] and h.hexdigest()==manifest["node_stream_sha256"]
    if prefix_manifest:
        assert ph.hexdigest()==prefix_manifest["node_stream_sha256"]
    else:
        assert prh.hexdigest()==PINS["archivePrefixRecords"]
        assert len(fringe)==1868
    @cache
    def protected(i):
        assert 0<=i<prefix
        backing.seek(offsets[i])
        return json.loads(backing.readline())
    fringe_hash=sha256()
    for i in sorted(fringe):
        backing.seek(offsets[i])
        fringe_hash.update(str(i).encode()+b":"+str(fringe[i]).encode()+b":"+backing.readline())
    return appendix,protected,{"nodes":count,"uncompressedBytes":size,"sha256":h.hexdigest(),
            "protectedPrefixNodes":prefix,"protectedPrefixCompleteHash":ph.hexdigest(),
            "protectedPrefixRecordsHash":prh.hexdigest(),"appendRecordsSHA256":ah.hexdigest(),
            "directProtectedReferenceOccurrences":references,"distinctDirectProtectedReferences":len(fringe),
            "directProtectedReferencesAndBytesSHA256":fringe_hash.hexdigest(),
            "first16DirectProtectedReferences":[[i,fringe[i]] for i in sorted(fringe)[:16]]}


def strip_guards(record,outer,expected):
    root=outer
    triples=[]
    for _ in range(7):
        row=record(root)
        require(row["op"]=="smooth_piecewise" and len(row["args"])==6,f"seven lazy wrappers at {outer}")
        v,lo,hi,low,body,high=row["args"]
        require(low==high==0,f"guard zero before evaluation at {root}")
        assert 0<=body<root
        triples.append([v,lo,hi])
        root=body
    require(root==expected,f"literal true branch identity at {outer}: {root}, {expected}")
    require(triples[4][1:]==[3617,28826] and triples[6][1]==0,f"native shell or pulse guard at {outer}")
    return triples


def arithmetic_relation(record,root,terms):
    """Exact signed linear identity over typed operand roots."""
    @cache
    def walk(i):
        if i==0:
            return {}
        node=record(i)
        args=node["args"]
        if node["op"]=="rational":
            return {('one',):Fraction(int(args[0]),int(args[1]))}
        if node["op"]=="add":
            poly=Counter()
            for j in args:
                poly.update(walk(j))
            return dict(poly)
        if node["op"]=="multiply":
            scalar=Fraction(1)
            others=[]
            for j in args:
                sub=record(j)
                if sub["op"]=="rational":
                    scalar*=Fraction(*map(int,sub["args"]))
                else:
                    others.append(j)
            if len(others)==1:
                return {k:scalar*v for k,v in walk(others[0]).items()}
            if not others:
                return {('one',):scalar}
            return {('product',*sorted(others)):scalar}
        return {('atom',i):1}

    expected=Counter()
    for atom,factor in terms:
        expected.update({key:factor*v for key,v in walk(atom).items()})
    assert {k:v for k,v in walk(root).items() if v}=={k:v for k,v in expected.items() if v},(root,terms)


def is_negative(record,negative,positive):
    if negative==positive==0:
        return True
    body=record(negative)
    return body["op"]=="multiply" and sorted(body["args"])==sorted([20,positive])


def verify_native(candidate,groups,prefix,appendix,protected,original_guards=None):
    expressions,gauge,pulses=registry_targets(groups,prefix)

    def record(i):
        return appendix[i-prefix] if i>=prefix else protected(i)

    def summands(i):
        node=record(i)
        if node["op"]=="add":
            for argument in node["args"]:
                yield from summands(argument)
        else:
            yield node

    def projection_terms(i):
        signed=record(i)
        require(signed["op"]=="multiply" and 20 in signed["args"],"projected forcing negative sign")
        operands=[j for j in signed["args"] if j!=20]
        assert len(operands)==1
        for term in summands(operands[0]):
            assert term["op"]=="multiply"
            yield term["args"]

    def application(i):
        op=record(i)
        assert op["op"]=="m3_coupled_expression_partial"
        key,args,orders=op["args"]
        assert len(args)==len(orders) and not any(orders)
        return expressions[key],args

    def changed_at(definition,actual):
        return {old:new for old,new in zip(definition["parameters"],actual,strict=True) if old!=new}

    forcing_prefix="CoupledForced_source_"
    predecessor={}
    for pulse in groups[3][:20]:
        if pulse["name"].endswith("_m1"):
            chart=pulse["name"].removeprefix("ActualOriginalForced_").removesuffix("_m1")
            predecessor[chart]=pulse
    assert len(predecessor)==10
    original_path={}
    original_projection={}
    for chart,pulse in predecessor.items():
        ys=pulse["directions"][-2:]
        for j,forcing in enumerate(pulse["forcing"]):
            for factors in projection_terms(forcing["real"]):
                wrapped=[i for i in factors if record(i)["op"]=="m3_coupled_expression_partial"
                         and expressions[record(i)["args"][0]]["name"].startswith(forcing_prefix)]
                assert len(wrapped)==1
                definition,actual=application(wrapped[0])
                assert actual==definition["parameters"]==[pulse["variable"],*pulse["parameters"]]
                name=definition["name"].removeprefix(forcing_prefix)
                k,part=name.split("_")
                assert part=="real"
                original_projection[chart,j,int(k)]=tuple(sorted(i for i in factors if i!=wrapped[0]))
                native,mapped=application(definition["body"])
                actual_path=changed_at(native,mapped)
                assert list(actual_path)==ys
                assert original_path.setdefault(chart,actual_path)==actual_path
    assert len(original_projection)==90

    assert record(20)=={"op":"rational","args":["-1","1"]}
    assert record(0)=={"op":"rational","args":["0","1"]}
    native_applications=defaultdict(list)
    forcing_definitions=defaultdict(list)
    for expression in expressions.values():
        if expression["name"].startswith("CoupledForced_source_"):
            forcing_definitions[expression["name"],expression["body"]].append(expression)
    instances=defaultdict(list)
    targets={r["id"]:r for r in gauge.values()}
    for i,node in enumerate(appendix,prefix):
        if node["op"]!="m3_coupled_expression_partial":
            continue
        key,actual,orders=node["args"]
        if not any(orders) and actual==expressions[key]["parameters"]:
            if key in targets:
                native_applications[key].append(i)
            if expressions[key]["name"].startswith("CoupledForced_source_"):
                instances[key].append(i)
    assert set(native_applications)==set(targets) and all(len(v)==1 for v in native_applications.values())

    @cache
    def reach_gauge(i):
        if i<prefix:
            return frozenset()
        node=record(i)
        op,arguments=node["op"],node["args"]
        if op=="m3_coupled_expression_partial":
            if arguments[0] in targets:
                assert arguments[1]==targets[arguments[0]]["parameters"]
                return frozenset({arguments[0]})
            return frozenset()
        if op in ("add","multiply","inverse"):
            return frozenset().union(*(reach_gauge(j) for j in arguments))
        if op=="integer_power":
            return reach_gauge(arguments[0])
        return frozenset()

    positive=[]
    template={r["key"]:r for r in candidate["templates"]}
    per_chart={}
    staged={}
    algebra_rows=0
    originals=0
    for key,t in template.items():
        assert [r["m"] for r in t["rows"]]==[1,2,3,4]
        for row in t["rows"]:
            for j in range(3):
                for part in PARTS:
                    inner=row["supported"][j][part]
                    outer=row["guarded"][j][part]
                    triples=strip_guards(record,outer,inner)
                    if original_guards:
                        assert triples==original_guards[key],(key,triples,original_guards[key])
                    if key in per_chart:
                        assert triples==per_chart[key]
                    else:
                        per_chart[key]=triples
                    sub=row["subtraction"][j][part]
                    raw=row["raw"][j][part]
                    arithmetic_relation(record,sub,[(term["value"][j][part],1) for term in row["terms"]])
                    arithmetic_relation(record,inner,[(raw,1),(sub,-1)])
                    algebra_rows+=2
                    originals+=1
            staged[key,row["m"]]=row
    assert originals==240 and algebra_rows==480

    for row in candidate["systems"]:
        key,mode=row["key"],row["m"]
        p,n=row["positive"],row["negative"]
        assert (p["m"],n["m"])==(mode,-mode)
        for a,b in zip(p["velocity"]+[p["pressure"]],n["velocity"]+[n["pressure"]],strict=True):
            require(a["real"]==b["real"] and is_negative(record,b["imaginary"],a["imaginary"]),"actual conjugate sign")
        pulse=pulses[row["system"]]
        assert pulse["name"]==f"ActualPostFiveRepeatForced_{key}_m{mode}"
        assert pulse["initial"]==[{"imaginary":0,"real":0}]*3 and pulse["left"]==0
        assert pulse["finitePartialSumIsExactSolution"] is False
        for field in ("directions","length","variable"):
            assert pulse[field]==predecessor[key][field]
        # The retained forced pulse stores -P f, where P is the normal
        # projection. Its six registered wrappers each retain the exact
        # selected chart/mode pullback; real and imaginary are projected
        # by the same symmetric matrix of coefficient roots.
        roots={}
        for j,pull in enumerate(row["pullback"]):
            for part in PARTS:
                shared,formal=application(pull[part]["shared"])
                mapped,actual=application(pull[part]["mapped"])
                assert shared==mapped and formal==shared["parameters"]
                assert shared["name"]==f"PostFiveRepeatPullback_{key}_{mode}_{j}_{part}"
                assert shared["body"]==staged[key,mode]["guarded"][j][part]
                assert changed_at(mapped,actual)==original_path[key]
                definitions=forcing_definitions[f"CoupledForced_source_{j}_{part}",pull[part]["mapped"]]
                matching=[d for d in definitions if d["parameters"]==[pulse["variable"],*pulse["parameters"]]]
                assert len(matching)==1
                bindings=instances[matching[0]["id"]]
                assert len(bindings)==1
                roots[bindings[0]]=(j,part)
        matrix={}
        for j,forced in enumerate(pulse["forcing"]):
            for part in PARTS:
                coverage=set()
                for factors in projection_terms(forced[part]):
                    applied=[i for i in factors if i in roots]
                    require(len(applied)==1,"projected forcing does not retain its own pullback")
                    k,realpart=roots[applied[0]]
                    assert realpart==part and k not in coverage
                    coverage.add(k)
                    coefficients=tuple(sorted(i for i in factors if i!=applied[0]))
                    assert coefficients==original_projection[key,j,k]
                    if part=="real":
                        matrix[j,k]=coefficients
                    else:
                        assert matrix[j,k]==coefficients
                assert coverage=={0,1,2}
        assert all(matrix[j,k]==matrix[k,j] for j in range(3) for k in range(3))
        system_gauge=set()
        for j,native_parts in enumerate(row["mappedPotentialCoefficients"]):
            for part,raw,sgn in (("real","imaginary",-1),("imaginary","real",1)):
                native=native_parts[part]
                definition=gauge[key,mode,raw,j]
                k=native["system"]
                assert native["sign"]==sgn and definition["id"]==k
                assert native["rawBody"]==definition["body"]
                assert native["actualArguments"]==definition["parameters"]
                assert native_applications[k]==[native["id"]]
                for arg in definition["parameters"]:
                    assert record(arg)["op"]=="coordinate"
                system_gauge.add(k)
            assert all(row["pullback"][j][part]["body"]==staged[key,mode]["guarded"][j][part] for part in PARTS)
        reached=frozenset().union(*(reach_gauge(u) for value in p["velocity"] for u in value.values()))
        require(reached==system_gauge,"borrowed or missing mapped gauge component")
        assert not any(reach_gauge(i) for i in p["pressure"].values())
        positive.append({"chart":key,"mode":mode,"nativeForcedSystem":row["system"],
                         "velocityAndPressureConjugate":True,"typedGaugeApplicationCount":len(reached)})
    assert len(positive)==40

    # Negative controls independently tamper one guard body/endpoint, a
    # mapped potential harmonic, and one imaginary sign. Node bytes stay intact.
    first=candidate["templates"][0]["rows"][0]
    outer=first["guarded"][0]["real"]
    inner=first["supported"][0]["real"]
    modified=record(outer).copy()
    modified["args"]=record(outer)["args"].copy()
    modified["args"][3]=1
    for thunk in (lambda:strip_guards(lambda i:modified if i==outer else record(i),outer,inner),
                  lambda:strip_guards(record,outer,first["supported"][0]["imaginary"])):
        try:
            thunk()
        except AssertionError:
            pass
        else:
            raise AssertionError("mutated guard was accepted")
    a,b=candidate["systems"][:2]
    assert a["m"]!=b["m"] and a["key"]==b["key"]
    assert reach_gauge(a["positive"]["velocity"][0]["real"])!=reach_gauge(b["positive"]["velocity"][0]["real"])
    pv=a["positive"]["velocity"][0]["imaginary"]
    assert pv!=0 and not is_negative(record,pv,pv)
    return {"sourceScalars":originals,"exactSourceSubtractIdentities":algebra_rows,
            "interiorLiteralSupportedEquality":240,"everyFailedGuardLazyZero":True,
            "guardTriplesByChart":per_chart,"candidatePulseSystems":positive,
            "registeredMappedGaugeCalls":len(native_applications),"registeredExactPullbackWrappers":240,
            "exactNativePathsByChart":original_path,"sameOriginalProjectionSystems":40,
            "sharedSymmetricComplexProjectionSystems":40,"explicitSignedConjugates":640,
            "rejectedIndependentControls":["nonzero guard exterior","adjacent supported branch","borrowed harmonic gauge","unnegated imaginary"],
            "globalUnclippedSupportedEquality":"OPEN. Needs original supported-source zero and smooth ordinary derivatives on every guard complement and seam."}


def archive_candidate(directory,gauge_path):
    candidate,digest=load(directory/"post-five-repeat-forced-candidate.json",PINS["archiveCandidate"])
    gauge,_=load(gauge_path,PINS["archiveMappedGauge"])
    entries={(r["template"],r["mode"]):r["complexPotential"] for r in gauge["candidateRoots"]}
    for r in candidate["systems"]:
        r["mappedPotentialCoefficients"]=[{part:{"id":node["root"],"sign":node["multiplier"],
            "system":node["system"],"rawBody":node["body"],"actualArguments":node["exactArguments"]}
            for part,node in zip(PARTS,(v["physicalReal"],v["physicalImaginary"]),strict=True)}
            for v in entries[r["key"],r["m"]]]
    return candidate,digest


def main(args):
    if args.archive_control:
        directory=args.artifact
        prefix=ARCHIVE_PREFIX
        manifest,mhash=load(directory/MANIFEST,PINS["archiveManifest"])
        old_manifest,_=load(args.predecessor/MANIFEST,PINS["archivePredecessorManifest"])
        candidate,csha=archive_candidate(directory,args.archive_mapped_gauge)
        assert candidate["snapshot"]==manifest
        active_guards=None
        terminal_scope=None
    else:
        prefix=ACTIVE_PREFIX
        directory=args.artifact/"active-n3-repeat-forced-source"
        needed=[directory/f for f in (STREAM,REGISTRY,MANIFEST)]
        require(all(p.is_file() for p in needed),"metadata-only artifact: missing actual active node stream or native registry")
        terminal,termsha=load(args.terminal_run)
        require(terminal["databaseId"]==ACTIVE_RUN and terminal["status"]=="completed"
                and terminal["conclusion"]=="success" and terminal["headSha"]==ACTIVE_COMMIT,
                "expected successful terminal GitHub run on the exact isolated commit")
        assert any(job["conclusion"]=="success" and any(x["name"]=="Run actions/upload-artifact@v4" and x["conclusion"]=="success" for x in job["steps"])
                   for job in terminal["jobs"])
        manifest,mhash=load(directory/MANIFEST)
        assert manifest["executing_commit"]==terminal["headSha"]
        assert manifest["scope"]=="SAME_LIVE_ACTIVE_N3_POST_FIVE_REPEAT_FORCED_CONDITIONAL_SOURCE"
        candidate,csha=load(args.artifact/"active-n3-repeat-forced-candidate.json")
        export,_=load(args.artifact/"active-n3-repeat-forced-export.json")
        assert export["snapshot"]==manifest and export["candidate"]=="active-n3-repeat-forced-candidate.json"
        assert export["guardedMatchesOriginalSupportedSource"]==export["completeSecondCorrection"]=="OPEN"
        assert export["finalJets"]==0 and export["release"]=="HOLD"
        assert candidate["mode"]=="full-source" and candidate["postRepeatNodeCount"]==prefix+APPEND
        assert candidate["sourceModuleSHA256"]==PINS["repeatOriginalModule"]
        assert candidate["graphSnapshot"] is None # The original writer puts it in the separate export JSON.
        old,_=load(args.old_metadata,PINS["activeOldMetadata"])
        assert candidate.keys()==old.keys() and old["mode"]=="metadata"
        assert all(v==old[k] for k,v in candidate.items() if k!="mode")
        assert candidate["rootIds"]==manifest["original_root_ids"] and len(candidate["rootIds"])==1444
        old_manifest,_=load(args.predecessor/MANIFEST,PINS["activePredecessorManifest"])
        assert old_manifest["node_stream_sha256"]==PINS["activePredecessorStream"]
        assert old_manifest["definitions_sha256"]==PINS["activePredecessorRegistry"]
        active_guards,_=load(args.active_guards,PINS["activeGuard"])
        active_guards={r["chart"]:r["cutoffGuards"] for r in active_guards["liveForcedGauge"]["charts"] if r["mode"]==1}
        assert len(active_guards)==10
        terminal_scope={"run":ACTIVE_RUN,"commit":terminal["headSha"],"terminalSha256":termsha}
    assert old_manifest["node_count"]==prefix and manifest["node_count"]==prefix+APPEND
    assert manifest["original_pr30_commit"]==old_manifest["original_pr30_commit"]
    actual=registry(directory/REGISTRY,manifest)
    prior=registry(args.predecessor/REGISTRY,old_manifest)
    protected_counts=protected_prefix(actual,prior)
    with TemporaryFile(dir=args.out.parent) as backing:
        appendix,protected,stream=scan(directory,manifest,prefix,old_manifest,backing)
        mechanics=verify_native(candidate,actual[1],prefix,appendix,protected,active_guards)
        stream["retainedPrefixLookups"]=protected.cache_info().currsize
    status=("VERIFIED_ARCHIVED_NATIVE_CONTROL_NOT_ACTIVE_N3" if args.archive_control else
            "VERIFIED_ACTUAL_ACTIVE_N3_REPEAT_APPEND_AND_GUARD_INTERIOR_STAGE_TWO_OPEN")
    out={"schema":"MathScope.C110.OriginalRepeatJ2FullSourceReadback/1","status":status,
         "terminalRun":terminal_scope,"manifestSHA256":mhash,"candidateSHA256":csha,
         "registrySHA256":actual[2],"protectedRegistryCounts":protected_counts,
         "appendedRegistryCounts":EXPECTED_DIFF,"stream":stream,"originalAppendNodes":APPEND,
         "mechanics":mechanics,"stageTwoComplete":"OPEN","canonicalScaleValues":"OPEN",
         "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(out,indent=2)+"\n").encode())
    print(status,"protected",prefix,"append",APPEND,"native scalar",mechanics["sourceScalars"])


if __name__=="__main__":
    assert __debug__
    cli=ArgumentParser(description=__doc__)
    cli.add_argument("--archive-control",action="store_true")
    for name in ("artifact","predecessor","out"):
        cli.add_argument("--"+name,type=Path,required=True)
    for name in ("terminal-run","old-metadata","active-guards","archive-mapped-gauge"):
        cli.add_argument("--"+name,type=Path)
    main(cli.parse_args())
