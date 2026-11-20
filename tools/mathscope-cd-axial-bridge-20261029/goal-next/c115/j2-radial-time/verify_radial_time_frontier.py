"""Recover the original repeat radial time demand and audit the attached donors."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from functools import cache
import gzip
from hashlib import sha1, sha256
import json
from pathlib import Path
import subprocess
import sys


PINS={
    "C110TailScript":"351b5b6c6f4a3c3f9b75a8a79a946f03da612270d60955a1cc9a1b43760f5cb2",
    "C112Radial":"03b909f35bb21785ac4216caf9065bd2d50c600c7109df5c8d2bacd5c20bea8e",
    "C113":"184ebe096a4ecdcbfbbfb5490c0213d2f71f92e89ca5e4f94f81afe7d05e69dc",
    "C107Mode1":"e58b46a729dd9029a35c5e5115f3156943e1d9f8eae33c9bff8d6ee2426a81d8",
    "C105Mode2":"c892d8878e0607117077f08c41b6d8d79f3e8729dc85bf79f35e346daf9cfa9e",
    "C106Chart":"25144d0df386b7522ac5076696aa78feadc1bee9c7188ab8847a9efaae4a6596",
    "C106RZT":"ba0830ec36ca4dcd8c7c9709e868a4523b938afc4ed0c97cb9ddbfbb160b823c",
    "C108Sigma":"d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f",
    "C107Signed":"449ced00be741aa9ed095a490a993ad728564776e62393ba75af49fbacfbca2a",
    "shareGlobalScalar":"b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36",
    "sameRunModulePins":"3f57354aca3da79d475e0bd0605ece51c36cf2633e7744cee35d59efe874b3f7",
    "harmonic":"339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20",
    "coupled":"5f83192211b649526a2616421a68c9e53004ace96776243e55e37b0a6973cf39",
    "nativePulse":"129423c917b3b8b1aae72b242f802e9f9934f17569fa895c669708785dbff924",
    "repeat":"4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7",
    "archiveRegistry":"5d8a751e5ad4b5d2bd4efa5a1f285dc465b0a5b19b3e0bbf8113f160bb582920",
    "archiveCandidate":"43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf",
    "archiveAppend":"f0f90223c0230ab38f7316186d5a5e3a7df7e19aab78a97d6a172e9cdaf61719",
    "archiveAppendSeal":"b9c7e7079cc9ea4dc559dc167462c3e9f64c496910810ecbb93b0f201b1734e1",
}
R,Z,T,Y0,Y1=17732748,17732749,17732750,17745430,17745431
ORIGINAL_DIRECTIONS={R:"R",Z:"Z",T:"T",Y0:"Y0",Y1:"Y1"}
SELECTED_BODY=22004387


def pin(path,key):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],(path,key)
    return raw


def source_rules(h,work,repo):
    modules=json.loads(pin(h/"pr30-source-pins.json","sameRunModulePins"))
    inventory={row["path"]:row for row in modules["verifiedFiles"]}
    runtime=work/"continuation66/stage2/runtime-exact"
    library="research-ide/mathscope-m3/navier/"
    harmonic=pin(runtime/(library+"source-harmonic-assembly.mjs"),"harmonic")
    coupled=pin(runtime/(library+"source-coupled-expressions.mjs"),"coupled")
    for name,body in (("source-harmonic-assembly.mjs",harmonic),("source-coupled-expressions.mjs",coupled)):
        entry=inventory[library+name]
        assert len(body)==entry["byteLength"]
        assert sha1(f"blob {len(body)}\0".encode()+body).hexdigest()==entry["gitBlobSHA"]
    share=pin(h/f"pr30-runtime-overlays/{PINS['shareGlobalScalar']}.mjs","shareGlobalScalar")
    assert b"free=[...G.freeCoordinates(body)].sort((a,b)=>a-b)" in share
    assert b"for(const child of coupledExpressionChildren(n))" in coupled
    assert b"Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))" in harmonic
    assert b"time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))" in harmonic
    assert b"S.add(time(x),S.neg(S.scale(epsilon,L[j])),grad[j])" in harmonic
    repeat=pin(runtime/"research-ide/mathscope-m3/post-signed-20261023/source-postfive-repeat-forced.mjs","repeat")
    assert b"PostFiveRepeatWave_" in repeat and b"exactAngularHarmonicPDE(G, { geometry, phase, k, rows: [mean, ...waves] })" in repeat
    native=subprocess.run(["git","-c",f"safe.directory={repo.resolve().as_posix()}","-C",str(repo),
        "show","059df9db3a188ce18f3c43a0dca3a92f2e02a4b2:research-ide/mathscope-m3/navier/source-forced-pulse.mjs"],
        check=True,capture_output=True).stdout
    assert sha256(native).hexdigest()==PINS["nativePulse"]
    assert b"this.derivative(root,s.directions[j])" in native
    assert b"gamma=alpha.map((n,j)=>n-beta[j])" in native and b"scale=this.q(binomial(alpha,beta))" in native


def free_coordinates(g):
    @cache
    def walk(i):
        row=g.record(i)
        op,args=row["op"],row["args"]
        if op=="coordinate":
            return frozenset((i,))
        if op in ("rational","source_parameter"):
            return frozenset()
        if op=="definite_integral":
            return (walk(args[0])-{args[1]})|walk(args[2])|walk(args[3])
        if op in ("add","multiply","inverse","exp","log_positive","sqrt_positive","sine","cosine","ceiling","maximum","smooth_piecewise"):
            children=args
        elif op in ("integer_power","source_step_derivative"):
            children=args[:1]
        elif op=="actual_monotone_root":
            children=args[1:]
        elif op=="m3_forced_pulse_partial":
            children=[args[3],*args[4]]
        elif op in ("m3_global_pulse_jet","actual_covariance_volterra"):
            children=[args[2],*args[3]]
        else:
            assert op.endswith("_partial"),(i,op,args)
            children=args[1]
        return frozenset().union(*(walk(j) for j in children))
    return walk


def archive_control(directory):
    archive=directory/"verified/recovered-original"
    comp=json.loads(pin(archive/"post-five-repeat-forced-candidate.json","archiveCandidate"))
    registry=json.loads(pin(archive/"original-source-functions.json","archiveRegistry"))
    defs={r["id"]:r for r in json.loads(registry["definitions"])[0]}
    raw=gzip.decompress(pin(directory/"verified/append-packet/repeat-appended-nodes.jsonl.gz","archiveAppend"))
    seal=json.loads(pin(directory/"verified/append-packet/repeat-append-seal.json","archiveAppendSeal"))
    assert sha256(raw).hexdigest()==seal["appendedNodeRecordsSHA256"]
    nodes=[json.loads(line) for line in raw.splitlines()]
    prefix=seal["baseNodeCount"]
    assert prefix==4456994 and len(nodes)==seal["appendedNodeCount"]==225012
    target=defs["coupled-expression:1349"]
    assert target["name"]=="PostFiveRepeatWave_0:1_1_0_imaginary"
    owner=target["id"]
    time_order=[int(i==622804) for i in target["parameters"]]
    call=[i for i,row in enumerate(nodes,prefix) if row=={"op":"m3_coupled_expression_partial",
          "args":[owner,target["parameters"],time_order]}]
    assert call==[4462803]

    def flatten(i,operation):
        if i>=prefix and nodes[i-prefix]["op"]==operation:
            for j in nodes[i-prefix]["args"]:
                yield from flatten(j,operation)
        else:
            yield i

    selected=comp["templates"][0]["rows"][0]
    assert comp["templates"][0]["key"]=="0:1" and selected["m"]==1
    found={}
    for kind in ("raw","subtraction","supported"):
        root=selected[kind][0]["imaginary"]
        found[kind]=[[term,*factors] for term in flatten(root,"add")
                     if call[0] in (factors:=list(flatten(term,"multiply")))]
    assert found=={"raw":[[4462826,20,622798,4462803]],"subtraction":[],
                  "supported":[[4462826,20,622798,4462803]]}
    return defs,{"archiveTimeApplication":call[0],"rows":found,
                  "archiveSelectedRoots":{kind:selected[kind][0]["imaginary"] for kind in found}}


def census(g,n,candidate,archived,c82):
    free=free_coordinates(g)
    assert sorted(free(17732744))==[17732737]
    grouped=Counter()
    time=[]
    roots=set()
    owners=set()
    for t in candidate["templates"]:
        chart=t["key"]
        for x in t["rawSupport"]["waveJets"]:
            body=x["actualBody"]
            roots.add(body)
            owner=x["system"]
            owners.add(owner)
            old_id="coupled-expression:"+str(int(owner.split(":")[1])-14)
            declared=archived[old_id]
            assert declared["name"].startswith("PostFiveRepeatWave_"+chart+"_")
            m,component,part=declared["name"].split("_")[-3:]
            m,component=int(m),int(component)
            actual=sorted(free(body))
            orders=x["orders"]
            assert len(actual)==len(orders) and body<g.count
            directions=tuple(ORIGINAL_DIRECTIONS[j] for j,o in zip(actual,orders,strict=True) for _ in range(o))
            grouped[m,"pressure" if component==3 else "velocity",directions]+=1
            if "T" in directions:
                assert directions==("T",) and component!=3
                time.append({"chart":chart,"harmonic":m,"component":component,"part":part,"reportedOwner":owner,
                             "protectedBody":body,"inferredOrderedFormals":actual,"reportedOrders":orders})
    assert len(roots)==len(owners)==160 and sum(grouped.values())==1760
    assert Counter(x["harmonic"] for x in time)=={1:60,2:60}
    case=next(r for r in time if r["protectedBody"]==SELECTED_BODY and r["chart"]=="0:1")
    assert case["reportedOwner"]=="coupled-expression:1363" and case["inferredOrderedFormals"][3]==T
    endpoints=[]
    for c in c82["cases"]:
        p=n.pulses[c["nativeSystem"]]
        roots=[c["v"],c["xi"],p["length"],*c["H_w"]]
        assert all(T not in free(i) for i in roots)
        assert p["directions"]==list(ORIGINAL_DIRECTIONS) and p["parameters"][2]==T
        counts={kind:sum(T in free(i) for i in values) for kind,values in
                (("matrix",[i for row in p["matrix"] for i in row]),
                 ("forcing",[i for value in p["forcing"] for i in value.values()]))}
        endpoints.append({"chart":c["key"],"harmonic":c["mode"],"system":p["id"],
                          "fixedVXiLengthAndPullback":roots,"retainedCoordinateSupportIncludingT":counts})
    assert len(endpoints)==20 and all(r["retainedCoordinateSupportIncludingT"]["forcing"] for r in endpoints)
    directions_rows=[{"harmonic":m,"field":f,"directions":list(order),"count":count}
                     for (m,f,order),count in sorted(grouped.items())]
    return directions_rows,time,case,endpoints


def stored_pulse_orders(g,n):
    counts=Counter()
    g.backing.seek(0)
    for i,line in enumerate(g.backing,1):
        if not line.startswith(b'{"op":"m3_forced_pulse_partial"'):
            continue
        owner,part,component,at,parameters,orders=json.loads(line)["args"]
        system=n.pulses[owner]
        assert part in ("real","imaginary") and 0<=component<=2
        assert len(parameters)==len(system["parameters"]) and system["directions"]==list(ORIGINAL_DIRECTIONS)
        counts[tuple(orders)]+=1
    assert i==g.count and counts=={(0,0,0,0,0):1080}
    return [{"orders":list(orders),"nodes":val} for orders,val in counts.items()]


def donor_boundary(work,goal):
    c113=json.loads(pin(work/"continuation113/k1-end-to-end/final/k1-end-to-end.json","C113"))
    c107=json.loads(pin(work/"continuation107/forced-mode-one-join/final/mode-one-high-join.json","C107Mode1"))
    c105=json.loads(pin(work/"continuation105/forced-mode-two-high/final/forced-mode-two-high.json","C105Mode2"))
    chart=json.loads(pin(work/"continuation106/background16/final/chart-geometry-c16.json","C106Chart"))
    rzt=json.loads(pin(work/"continuation106/background16/final/chart16.json","C106RZT"))
    sigma=json.loads(pin(work/"continuation108/early-sigma-c6/final/early-sigma-c6.json","C108Sigma"))
    signed=json.loads(pin(goal/"c107/post-signed-gauge/signed-gauge-cutoffs.json","C107Signed"))
    m1={tuple(r["RZL"]) for r in c107["collars"]}
    m2={tuple(r["RZL"]) for r in c105["conditionalGaugeRows"]}
    assert len(m1)==len(m2)==50 and m1==m2
    assert chart["order"]==16 and rzt["totalDirections"]==969
    assert rzt["additionalDirections"][0]["RZT"]==[0,0,16]
    assert sigma["SigmaApplications"]==[22001223,22001224]
    assert {sigma["pins"][i] for i in ("one","two")}=={PINS["C107Mode1"],PINS["C105Mode2"]}
    assert all(c113["pins"][i]==PINS[p] for i,p in (("earlyModeOne","C107Mode1"),("sigma","C108Sigma"),("signedGauge","C107Signed")))
    assert len(signed["rows"])==79 and all(len(row["RZL"])==3 for row in signed["rows"])
    assert c113["release"]=="HOLD"
    return {"fixedGaugeDirections":"R,Z,L", "sameModeOneAndModeTwoDirections":len(m1),
            "regularBackgroundChartOrderWithTime":chart["order"],
            "regularBackgroundChartRZTDirections":rzt["totalDirections"],"signedOuterGaugeRZLRows":len(signed["rows"]),
            "actualSignedSigmaApplications":sigma["SigmaApplications"],
            "nativeGap":"First pulse coefficient variations M_T and F_T (not merely v_T or derivative of the scalar cutoff) and their mixed spatial derivatives for curl; original Signed Sigma/H/a time variation; same-body shell-decay envelopes for the resulting physical time wave directions or exact original cancellations."}


def countermodel():
    width=Fraction(1,16)
    relative_min=1-width
    amplitude_c=relative_min**2
    assert width*(1+Fraction(1,4))<Fraction(1,2)
    assert amplitude_c==Fraction(225,256)
    return {"radialCenters":"d_n=2^(-n), n≥1",
            "radialWidthOverCenterSquared":str(width),
            "disjointness":"delta_n+delta_(n+1)=(5/64)d_n^2<d_n/2=d_n-d_(n+1)",
            "amplitudes":"a_n=exp(-c/d_n^2), c>0",
            "testFunction":"sum_n a_n rho((d-d_n)/delta_n) sin((T-T0)/a_n), rho smooth compactly supported in (-1,1), rho(0)=1",
            "jointSpatialDecay":"For each k, abs(partial_d^k f) ≤ C_k*d^(-2k)*exp(-(225/256)c/d^2) uniformly in all T; let f be independent of other spatial variables.",
            "timeTrace":"partial_T f(d_n,T0)=1 for every n, although f and all spatial derivatives have zero radial traces.",
            "actualSourceCounterexample":False}


def main():
    cli=ArgumentParser(description=__doc__)
    for arg in ("work","goal","c110","c112","repo","out"):
        cli.add_argument("--"+arg,type=Path,required=True)
    args=cli.parse_args()
    h=args.work/"continuation70/hosted-44582875351"
    source_rules(h,args.work,args.repo)
    prior=json.loads(pin(args.c112/"radial-shell-minimum.json","C112Radial"))
    assert prior["originalTraceWitness"]["protectedWaveBody"]==SELECTED_BODY
    scope=args.goal/"primary-forced-join/active-n3-c5-binding"
    reader=scope/"spatial-readback"
    cache_reader=scope/"live-wave-gauge/signed"
    pin(args.c110/"verify_predecessor_cutoff_tails.py","C110TailScript")
    sys.path[:0]=[str(args.c110),str(reader),str(cache_reader)]
    from verify_predecessor_cutoff_tails import PINS as PREVIOUS, pinned
    pinned(reader/"source_stream.py","reader")
    pinned(cache_reader/"source_cache.py","cacheReader")
    import source_stream as st
    from source_cache import load
    directory=h/"first-correction-spatial-source"
    manifest=json.loads(pinned(directory/st.MANIFEST,"manifest"))
    candidate=json.loads(pinned(h/"active-n3-repeat-forced-candidate.json","metadata"))
    c82=json.loads(pinned(args.work/"continuation82/forced-seams/forced-seams-final.json","C82"))
    native=st.Native(directory,manifest)
    assert native.pin==PREVIOUS["registry"]
    assert candidate["mode"]=="metadata" and c82["originalStreamSHA256"]==manifest["node_stream_sha256"]
    archived,control=archive_control(args.work/"continuation71/stage2-delta")
    g=load(st,directory,manifest,22153782,args.work/"continuation80/signed-wave/cache")
    try:
        inventory,time,witness,fixed=census(g,native,candidate,archived,c82)
        stored=stored_pulse_orders(g,native)
    finally:
        g.__exit__(None,None,None)
    donors=donor_boundary(args.work,args.goal)
    out={"schema":"MathScope.C114.ActiveRepeatRadialTimeDemandFirstMissingRow/1",
         "status":"VERIFIED_PROTECTED_TIME_DEMAND_AND_COUNTERMODEL_ACTUAL_SHELL_TRACE_OPEN",
         "source":{"nodes":manifest["node_count"],"sha256":manifest["node_stream_sha256"],"registrySHA256":native.pin},
         "pins":PINS,"reportedJetOperands":1760,"reportedOrdinaryTimeDerivatives":120,"directions":inventory,
         "protectedTimeOperands":time,"protectedSelectedTimeOperand":witness,
         "archiveRawAndSupportedExplicitMinusEpsilonTimesTControl":control,
         "retainedPulseTimeDirections":fixed,"storedProtectedPrimitivePulseOrders":stored,
         "auditedDonorScope":donors,"countermodel":countermodel(),
         "minimumOriginalInequality":"For example, a same-chart admitted ordinary bound abs(partial_T W_(1,R,Im))≤C*d^(-p)*exp(-c/d^2), c>0, for the exact protected source body #22004387; repeat for the actual retained time rows or establish an independent aggregate cancellation. Its time node and unaltered coefficient still require active append attachment.",
         "activeNativeRegistryAndActualRawDemand":"OPEN","allRadialAggregateTraces":"OPEN","finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(out,indent=2)+"\n").encode())
    print(out["status"],1760,120)


if __name__=="__main__":
    assert __debug__
    main()
