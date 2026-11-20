"""Read Repeat radial operand classes and the active pulse/pressure frontier."""

from argparse import ArgumentParser
from collections import Counter
from functools import cache
from hashlib import sha256
import gzip
import json
from pathlib import Path
import sys


PINS={
    "c114Code":"0d4f2be79494851dd1e82d2c6587af40f3f1d39d5da53d1b3c204df06448178f",
    "c110Code":"351b5b6c6f4a3c3f9b75a8a79a946f03da612270d60955a1cc9a1b43760f5cb2",
    "c119Curl":"2efe3573d8c7a9b41bb2ba6682307140a017436ada61291f6d131c24ff25cf2a",
    "c119PhysicalT":"2ad6fcd043b1be18b4482cd7b055bbd94a528621e57badd4c6860e487e76f9ff",
    "c120Fast":"9d58464ea8182764e9354867105ebd9cb8454ddf53d6a70b359fe488849f0b35",
    "archivedPulse":"547c4079aa37fbf0afb6463a34f392e52eb25cf1915dbfb05ad86b50ba5c7ed6",
}
Y=(17745430,17745431)
ORDINARY=(17732748,17732749,17732750)
R0=14220486
LENGTH=17733029
EPS=17732744
K=17732747


def pin(path,digest):
    body=path.read_bytes()
    assert sha256(body).hexdigest()==digest,path
    return body


def archived(work,original):
    d=work/"continuation71/stage2-delta/verified"
    exp=d/"recovered-original"
    v=lambda filename,key:json.loads(pin(exp/filename,original[key]))
    candidate=v("post-five-repeat-forced-candidate.json","archiveCandidate")
    regs=v("original-source-functions.json","archiveRegistry")
    registry={r["id"]:r for r in json.loads(regs["definitions"])[0]}
    data=gzip.decompress(pin(d/"append-packet/repeat-appended-nodes.jsonl.gz",original["archiveAppend"]))
    seal=json.loads(pin(d/"append-packet/repeat-append-seal.json",original["archiveAppendSeal"]))
    assert sha256(data).hexdigest()==seal["appendedNodeRecordsSHA256"]
    p=seal["baseNodeCount"]
    a=[json.loads(line) for line in data.splitlines()]
    assert p==4456994 and len(a)==225012
    hist=Counter()
    shape=Counter()
    for t in candidate["templates"]:
        key=t["key"]
        wave=set(t["rawSupport"]["waveSystems"])
        means={f"PostFiveRepeatMeanVelocity_{i}" for i in range(3)}

        @cache
        def degree(i):
            if i==0:
                return frozenset()
            if i<p:
                return frozenset({(0,0)})
            node=a[i-p]
            op,args=node["op"],node["args"]
            hist[op]+=1
            if op=="m3_coupled_expression_partial":
                owner,actual,order=args
                d=registry[owner]
                if owner in wave:
                    assert args[1]==d["parameters"]
                    is_pressure=d["name"].split("_")[-2]=="3"
                    return frozenset({(0,1) if is_pressure else (1,0)})
                assert d["name"] in means and len(actual)==len(d["parameters"])
                return frozenset({(0,0)})
            if op=="add":
                return frozenset().union(*(degree(k) for k in args))
            assert op=="multiply"
            result={(0,0)}
            for k in args:
                result={(i+r,j+s) for i,j in result for r,s in degree(k)}
            return frozenset(result)

        for row in t["rows"]:
            wanted={(0,1),(1,0),(2,0)} if row["m"] in (1,2) else {(2,0)}
            for vector in row["raw"]:
                for cell in vector.values():
                    assert degree(cell)==wanted,(key,row["m"],cell,degree(cell))
                    shape[row["m"]]+=1
    assert shape=={i:60 for i in range(1,5)}
    assert hist=={"multiply":16140,"add":13160,"m3_coupled_expression_partial":1910}
    path=json.loads(pin(work/"continuation71/repeat-support/closed-pulse-final/closed-pulse.json",PINS["archivedPulse"]))["pathRows"][0]["originalPath"]
    assert path["levelDifference"]==0 and len(path["Y"])==2 and path["vt"][1]==1
    ci,vt0=path["ci"],path["vt"][0]
    owner=registry["coupled-expression:1349"]
    assert owner["name"]=="PostFiveRepeatWave_0:1_1_0_imaginary"
    derivatives=(4460884,4460886)
    for y,i in zip(path["Y"],derivatives,strict=True):
        orders=[int(f==y) for f in owner["parameters"]]
        assert a[i-p]=={"op":"m3_coupled_expression_partial","args":[owner["id"],owner["parameters"],orders]}
    assert a[4462827-p]=={"op":"multiply","args":[vt0,derivatives[0]]}
    assert a[4462828-p]=={"op":"add","args":[derivatives[1],4462827]}
    assert a[4462829-p]=={"op":"multiply","args":[ci,4462828]}

    @cache
    def descendants(i):
        if i<p:
            return frozenset()
        if i==4462829:
            return frozenset({i})
        row=a[i-p]
        return frozenset().union(*(descendants(j) for j in row["args"])) if row["op"] in ("add","multiply") else frozenset()

    row=candidate["templates"][0]["rows"][0]
    witness={label:row[label][0]["imaginary"] for label in ("raw","supported","subtraction")}
    assert [bool(descendants(witness[i])) for i in witness]==[True,True,False]
    return registry,{"sourceSlots":dict(sorted(shape.items())),"newOperandOperationVisits":dict(sorted(hist.items())),
        "lowModeDegreeClassesInVelPressure":[[0,1],[1,0],[2,0]],"highModeDegreeClassesInVelPressure":[[2,0]],
        "newRawReciprocalNodes":0,"archivedLongitudinalTerm":4462829,"archivedLongitudinalWavePartials":derivatives,
        "archivedAffectedRawSupportedAndSubtraction":witness}


def pulse(g,e,ensure_equal,free,c82,polar):
    values=(17733391,17733724)
    frozen=[17733951,17733956,17733936]
    assert all(not set(ORDINARY).intersection(free(i)) for i in frozen)
    witnesses=[]
    for root in values:
        [integral]=g.args(root,"exp")
        f,variable,left,right=g.args(integral,"definite_integral")
        assert right==17732751 and variable!=right
        assert sorted(free(root))==[17732737,17732751,17732753,17732754,17732755]
        witnesses.append({"P":root,"rate":f,"formalPulseBinder":variable,"fixedStart":left,"formalEndpoint":right})
    results=[]
    e_r=17733068
    tg=e.add(e.scalar(4),e.of(3622))
    ci=e.mul(e.scalar(2),e.of(R0),e.inv(e.of(LENGTH)))

    def derivative(f,y):
        terms={}
        for monomial,coefficient in f.items():
            powers=dict(monomial)
            if y in powers:
                assert powers[y]>=1
                r=powers[y]
                forms=tuple((j,count) for j,count in monomial if j!=y or count!=1)
                forms=tuple((j,count-1 if j==y else count) for j,count in forms)
                terms[forms]=terms.get(forms,0)+r*coefficient
        return {m:c for m,c in terms.items() if c}

    for case in c82["cases"]:
        if case["mode"]!=1:
            continue
        key=case["key"]
        level=int(key.split(":")[0])
        fac=e.mul(ci,e.pow(tg,-level))
        p,q=e.of(case["v"]),e.of(case["xi"])
        for f in (p,q):
            for monomial in f:
                tagged=[a for a,b in monomial if a in Y]
                assert not tagged or len(tagged)==1 and dict(monomial)[tagged[0]]==1
        du=[derivative(p,y) for y in Y]
        dx=[derivative(q,y) for y in Y]
        L=(e.one,e.of(e_r))
        N=(e.neg(e.of(e_r)),e.one)
        assert ensure_equal(e,e.dot(L,du),e.zero)
        assert ensure_equal(e,e.dot(N,dx),e.zero)
        assert ensure_equal(e,e.mul(fac,e.dot(N,du)),e.one)
        assert ensure_equal(e,e.dot(L,dx),e.pow(e.of(17734041),level))
        assert not set(ORDINARY).intersection(free(case["v"])|free(case["xi"])|free(LENGTH))
        c=polar[key]
        assert any(row["part"]=="imaginary" and row["component"]==0 for row in c["actualSignedAddends"])
        azimuth,=[r for r in c["ordinaryMixedRequests"] if r["potentialComponent"]==1 and r["direction"]=="Z"]
        zt=azimuth["afterOrdinaryTOrders"]
        zv=zt.copy()
        zv[2]=0
        zv[4]=1
        results.append({"chart":key,"v":case["v"],"xi":case["xi"],"affineLVZero":True,
                        "affineNXiZero":True,"effectiveCiNVOne":True,
                        "ordinaryMixedZVRequest":{"sameOriginalDefinition":azimuth["definition"],
                                                  "actualArguments":azimuth["actualArguments"],"orders":zv}})
    assert len(results)==10
    return witnesses,results


def pressure(g,n,e,prior,c82,archived,candidate,first):
    definitions={r["id"]:r for r in n.expressions}
    pulse_cases={(c["key"],c["mode"]):c for c in c82["cases"]}
    source_cases={(r["key"],r["harmonic"]):r for r in first["full"]["rows"]}
    active_pressure={}
    for t in candidate["templates"]:
        key=t["key"]
        for wave in t["rawSupport"]["waveJets"]:
            old_id=f"coupled-expression:{int(wave['system'].split(':')[1])-14}"
            named=archived[old_id]["name"]
            prefix=f"PostFiveRepeatWave_{key}_2_3_"
            if named.startswith(prefix):
                part=named.removeprefix(prefix)
                active_pressure[key,part]=wave["actualBody"]
    assert len(active_pressure)==20

    def parts(i,op,stop=()):
        row=g.record(i)
        if i not in stop and row["op"]==op:
            for j in row["args"]:
                yield from parts(j,op,stop)
        else:
            yield i

    cases=[]
    for (key,part),root in active_pressure.items():
        c=pulse_cases[key,2]
        static=source_cases[key,2]
        p=n.pulses[c["nativeSystem"]]
        assert p["id"]==static["system"]
        ps=c["psi"]
        factors=list(parts(root,"multiply",stop=(ps,)))
        assert factors.count(ps)==1
        factors.remove(ps)
        if part=="real":
            factors.remove(20)
        numer,=[i for i in factors if g.node(i)[0]=="add"]
        inv,=[i for i in factors if g.node(i)[0]=="inverse"]
        assert len(factors)==2
        [d]=g.args(inv,"inverse")
        dterms=list(parts(d,"multiply"))
        assert 24 in dterms and K in dterms
        n2,=[i for i in dterms if i not in (24,K)]
        squares=list(parts(n2,"add"))
        ambient=set()
        for square in squares:
            args=g.args(square,"multiply")
            assert len(args)==2 and args[0]==args[1]
            ambient.add(args[0])
        assert len(ambient)==3
        winding=prior[key]["phaseThetaCoefficient"]
        theta,=[i for i in ambient if e.of(i)==e.mul(e.of(winding),e.inv(e.of(ORDINARY[0])))]
        target_part="imaginary" if part=="real" else "real"
        states={}
        forcing={}
        for term in parts(numer,"add"):
            factors=list(parts(term,"multiply"))
            pulse,=[i for i in factors if g.node(i)[0]=="m3_forced_pulse_partial"] or [None]
            if pulse is not None:
                k,r,j,v,args,order=g.args(pulse,"m3_forced_pulse_partial")
                assert (k,r,v,args,order)==(p["id"],target_part,c["v"],p["parameters"],[0]*5)
                assert j not in states
                states[j]=pulse
            raw=[i for i in factors if g.node(i)[0]=="m3_coupled_expression_partial"
                 and definitions[g.node(i)[1][0]]["name"].startswith("CoupledForced_source_")]
            if raw:
                assert len(raw)==1 and pulse is None
                g0=raw[0]
                cid,args,o=g.args(g0,"m3_coupled_expression_partial")
                df=definitions[cid]
                j,name=df["name"].removeprefix("CoupledForced_source_").split("_")
                j=int(j)
                assert name==target_part and not any(o) and args==[c["v"],*p["parameters"]]
                assert df["parameters"]==[p["variable"],*p["parameters"]]
                assert df["body"]==static["originalSource"][j][target_part]
                normal,=[i for i in ambient if e.of(term)==e.mul(e.of(i),e.of(g0))]
                assert normal==theta if j==1 else normal!=theta
                forcing[j]=(g0,normal)
        assert set(states)==set(forcing)=={0,1,2}
        cases.append({"chart":key,"part":part,"actualModeTwoPressure":root,"cutoff":ps,
                      "normalSquared":n2,"carrierDenominator":d,"azimuthalNormal":theta,"winding":winding,
                      "numerator":numer,"originalNativeStates":states,"unprojectedNormalForcing":forcing})
    assert len(cases)==20
    return cases


def main():
    cli=ArgumentParser(description=__doc__)
    for arg in ("work","goal","out"):
        cli.add_argument("--"+arg,type=Path,required=True)
    args=cli.parse_args()
    c110=args.work/"continuation110/active-j2-full-source"
    c114=args.work/"continuation114/j2-radial-joint"
    pin(c110/"verify_predecessor_cutoff_tails.py",PINS["c110Code"])
    pin(c114/"verify_radial_time_frontier.py",PINS["c114Code"])
    scope=args.goal/"primary-forced-join/active-n3-c5-binding"
    reader=scope/"spatial-readback"
    cache_reader=scope/"live-wave-gauge/signed"
    helpers=args.work/"continuation82/forced-seams"
    sys.path[:0]=[str(c110),str(c114),str(reader),str(cache_reader),str(helpers)]
    from verify_predecessor_cutoff_tails import PINS as OLD, pinned
    from verify_radial_time_frontier import PINS as PRIOR, free_coordinates
    pinned(reader/"source_stream.py","reader")
    pinned(cache_reader/"source_cache.py","cacheReader")
    pinned(helpers/"verify_forced_seams.py","c82Reader")
    pinned(args.work/"continuation80/forced-wave/verify_forced_wave.py","c80Reader")
    pinned(args.goal/"first-force-repair/verify_repaired_first_force.py","exactAlgebra")
    import source_stream as st
    from source_cache import load
    from verify_forced_seams import Exact, equality
    h=args.work/"continuation70/hosted-44582875351"
    directory=h/"first-correction-spatial-source"
    mf=json.loads(pinned(directory/st.MANIFEST,"manifest"))
    active=json.loads(pinned(h/"active-n3-repeat-forced-candidate.json","metadata"))
    first=json.loads(pinned(h/"same-family-mode-two.json","firstRows"))
    c82=json.loads(pinned(helpers/"forced-seams-final.json","C82"))
    curl=json.loads(pin(args.work/"continuation119/signed-curl-mixed-t/signed-mixed-curl.json",PINS["c119Curl"]))
    physical=json.loads(pin(args.work/"continuation119/signed-mixed-native-time/signed-physical-time.json",PINS["c119PhysicalT"]))
    fast=json.loads(pin(args.work/"continuation120/signed-pulse-time/signed-fast-pulse.json",PINS["c120Fast"]))
    by_chart={c["chart"]:c for c in curl["cases"]}
    n=st.Native(directory,mf)
    assert n.pin==OLD["registry"] and curl["sourceStreamSHA256"]==mf["node_stream_sha256"]
    assert physical["pins"]["curl"]==PINS["c119Curl"] and physical["physicalSlowTerm"]["gaussian"]=="sqrt(zeta)"
    assert fast["mixedGauge"]["weights"]==fast["phaseFreeVelocityPulse"]["weights"]=="P*sqrt(zeta)"
    assert fast["phaseFreeVelocityPulse"]["epsilon"]=="1/2" and fast["restoredHarmonicPulse"]["epsilon"]=="0"
    regs,archive=archived(args.work,PRIOR)
    g=load(st,directory,mf,22153782,args.work/"continuation80/signed-wave/cache")
    def node(i):
        row=g.record(i)
        return row["op"],row["args"]
    g.node=node
    try:
        e=Exact(g)
        P,pulse_cases=pulse(g,e,equality,free_coordinates(g),c82,by_chart)
        pressure_cases=pressure(g,n,e,by_chart,c82,regs,active,first)
    finally:
        g.__exit__(None,None,None)
    result={"schema":"MathScope.C120.OriginalRepeatRadialOperandFrontier/1",
            "status":"VERIFIED_PROTECTED_GEOMETRY_AND_ARCHIVE_RAW_RADIAL_CLASSES_ACTIVE_AGGREGATE_OPEN",
            "sourceStreamSHA256":mf["node_stream_sha256"],"registrySHA256":n.pin,"pins":PINS,
            "archivedExactRawCensus":archive,"protectedActualGaussianP":P,"protectedPulseCoordinateChecks":pulse_cases,
            "protectedModeTwoPressure":pressure_cases,"attachedConditionalSignedTime":physical["physicalSlowTerm"],
            "attachedConditionalSignedFastGauge":fast["mixedGauge"],
            "attachedConditionalRestoredSignedFastTerm":fast["restoredHarmonicPulse"],
            "projection":"n² includes the square of the true fixed winding divided by R, so positive original winding and a compact positive-radius shell bound give a lower bound independent of the Cramer Gaussian. The native complete pressure still contains the unprojected normal force.",
            "normalPressureControl":"For F=n lambda, the projected source is zero and its state can be zero, while n dot F=lambda |n|². Thus pressure cannot be estimated just from the projected state or gauge.",
            "separatePulseInequality":"The independent source needs ∂Z∂v C_theta of original owner coupled-expression:1279 in chart 0:1; direct Signed radial imaginary coefficient derivative is -epsilon/2 times this value. The C120 fast packet supplies a conditional P*sqrt(zeta) envelope for this gauge derivative. After restoring the harmonic, the carrier factor reaches only epsilon grade zero.",
            "pressureInequality":"For low modes independently transfer the weighted bounds for the actual nonprojected force and normal row to the original spatial pressure derivatives. The native normal and original fixed P introduce no new radial Gaussian pole on the fixed-label compact shell.",
            "actualAggregateRadialTrace":"OPEN until same-run active raw bindings and direct same-source projected and unprojected pressure, full velocity and subtraction trace estimates. The phase-restored Signed fast bound alone does not prove positive epsilon margin for the aggregate.",
            "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print(result["status"],sum(archive["sourceSlots"].values()),len(pulse_cases),len(pressure_cases))


if __name__=="__main__":
    assert __debug__
    main()
