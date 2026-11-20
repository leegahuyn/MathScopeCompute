"""Read original N3 protected source factors on each fixed slow cutoff face."""

from argparse import ArgumentParser
from fractions import Fraction as F
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys


PARTS=("real","imaginary")
AXES={
    "band":(17735160,17735193,{17732737,17732749,17732750}),
    "R":(17735196,17735228,{17732737,17732748,17733856}),
    "Z":(17735231,17735263,{17732737,17732749,17733857}),
    "T":(17735266,17735298,{17732737,17732750,17733858}),
}
DIGESTS={
    "C110ProtectedWaves":"2d326dee551a7c4b83908aab1244fcbd9916d398fa3d77af17eb73698106256b",
    "C110CutoffTails":"7932abec4bdcc8db898e8c3c7fb8c5b8e217879fe31937eedf437874154b7f03",
    "C110Script":"351b5b6c6f4a3c3f9b75a8a79a946f03da612270d60955a1cc9a1b43760f5cb2",
    "guardChart":"b8d5be0df034731fb0a14849058416bc3f15d476d6e9b8b1fe196678894a6a59",
}


def pin(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return raw


def chart(g,n,a):
    R,Z,T=17732748,17732749,17732750
    S,X,eta,q,Q=17732766,17732770,17732775,17732776,17732740
    ell=17732737
    assert g.args(S,"actual_monotone_root")==[2,Z,T]
    d=json.loads(n.base_snapshot["base"]["monotone"])[2]
    s=d["variable"]
    assert d["parameters"]==[Z,T] and d["numericOracle"] is False
    assert g.rational(d["left"])==F(1,2) and g.rational(d["right"])==2
    h=a.of(9)
    assert g.node(9)==("source_parameter",["h"])
    assert a.of(22)==a.sub(a.scalar(F(1,2)),h) and a.of(25)==a.mul(a.scalar(2),h)
    expected=a.sub(a.sub(a.of(s),a.mul(a.pow(a.of(Z),2),a.of(17732760))),a.of(T))
    assert a.of(d["body"])==expected
    assert g.args(17732760,"exp")==[17732759] and g.args(17732758,"log_positive")==[s]
    assert a.of(17732759)==a.mul(a.scalar(2),h,a.of(17732758))
    assert a.of(X)==a.mul(a.pow(a.of(R),2),a.inv(a.mul(a.scalar(2),a.of(S))))
    assert a.of(q)==a.mul(a.of(Q),a.of(S))
    assert g.args(127,"log_positive")==[24] and g.rational(24)==2
    [logQ]=g.args(Q,"exp")
    assert a.of(logQ)==a.mul(a.scalar(-1),a.of(ell),a.of(127))
    [logEtaScale]=g.args(17732773,"exp")
    assert g.args(17732771,"log_positive")==[S] and a.of(logEtaScale)==a.mul(a.of(22),a.of(17732771))
    assert a.of(eta)==a.mul(a.of(Z),a.inv(a.of(17732773)))
    band=AXES["band"][0]
    [logq]=g.args(17735156,"log_positive")
    assert logq==q
    assert a.of(band)==a.sub(a.mul(a.scalar(-1),a.of(17735156),a.inv(a.of(127))),a.of(ell))
    for axis,pos,label in zip(("R","Z","T"),(R,Z,T),(17733856,17733857,17733858),strict=True):
        assert a.of(AXES[axis][0])==a.sub(a.mul(a.pow(a.of(ell),6),a.of(pos)),a.of(label))
    return {"s":S,"X":X,"eta":eta,"q":q,"Q":Q,"RZT":[R,Z,T],"bandLabel":ell,
            "slowInverseDefinition":d,"shellThresholds":[3617,28826]}


def factors(g,a,guards):
    def addends(i):
        op,args=g.node(i)
        if op=="add":
            for v in args:
                yield from addends(v)
        else:
            yield i

    rows={}
    for axis,(offset,factor,fixed) in AXES.items():
        x,lo,hi,left,middle,right=g.args(factor,"smooth_piecewise")
        assert g.rational(lo)==F(-3,4) and g.rational(hi)==F(3,4)
        assert [x,left,right]==[offset,0,0]
        assert all([x,lo,hi] in values[:4] for values in guards.values())
        central,invroot=g.args(middle,"multiply")
        [sqrt]=g.args(invroot,"inverse")
        [den]=g.args(sqrt,"sqrt_positive")
        bumps={}
        steps={}
        for squ in addends(den):
            root,degree=g.args(squ,"integer_power")
            assert degree==2
            norm,blo,bhi,one,step,zero=g.args(root,"smooth_piecewise")
            assert g.rational(blo)==F(1,4) and g.rational(bhi)==F(3,4) and (one,zero)==(1,0)
            [square]=g.args(norm,"sqrt_positive")
            raw,degree=g.args(square,"integer_power")
            assert degree==2
            shift,=[j for j in (-1,0,1) if a.of(raw)==a.sub(a.of(offset),a.scalar(j))]
            argument,order=g.args(step,"source_step_derivative")
            assert order==0 and a.of(argument)==a.sub(a.scalar(F(3,2)),a.mul(a.scalar(2),a.of(norm)))
            assert shift not in bumps
            bumps[shift]=root
            steps[shift]=argument
        assert set(bumps)=={-1,0,1} and bumps[0]==central
        faces={}
        for face in (F(-3,4),F(3,4)):
            values=[int(abs(face-j)<=F(1,4)) for j in (-1,0,1)]
            assert all(abs(face-j)<=F(1,4) or abs(face-j)>=F(3,4) for j in (-1,0,1))
            assert values[1]==0 and sum(x*x for x in values)==1
            faces[str(face)]=values
        rows[axis]={"guard":[offset,lo,hi],"normalizedFactor":factor,"denominatorBeforeSqrt":den,
                    "centralStepArgument":steps[0],"fixedArgumentCoordinates":sorted(fixed),
                    "bumpsInOrderMinusOneZeroOne":[bumps[j] for j in (-1,0,1)],"faceValues":faces}
    return rows


def support(g,n,first,c82,wave_proof,axes):
    defs={
        "m3_coupled_expression_partial":{r["id"]:r for r in n.expressions},
        "m3_aux_expression_partial":{-i-1:r for i,r in enumerate(json.loads(n.base_snapshot["expressionDefinitions"]))},
        "actual_expression_partial":dict(enumerate(json.loads(n.base_snapshot["base"]["expression"]))),
    }
    names={r["name"]:r for r in n.expressions}
    wrappers={(r["name"],r["body"],tuple(r["parameters"])):r for r in n.expressions
              if r["name"].startswith("CoupledForced_source_")}
    c82_rows={(r["key"],r["mode"]):r for r in c82["cases"]}
    first_rows={(r["key"],r["harmonic"]):r for r in first["full"]["rows"]}
    results=[]
    for t in wave_proof["charts"]:
        key=t["chart"]
        level,sign=key.split(":")
        v=t["v"]
        seed_names=[f"InitializedOriginalWave_{level}_{sign}_{j}_{part}" for j in range(3) for part in PARTS]
        seed_names.extend(f"InitializedOriginalPrimaryPressure_{level}_{sign}_{part}" for part in PARTS)
        seed_names.extend(f"OriginalPrimaryPrincipalFlat_{level}_{sign}_{j}" for j in range(3))
        seeds={names[name]["id"]:names[name]["body"] for name in seed_names if name in names}
        waves=dict(t["reportedOwnersAndVerifiedProtectedBodyRoots"])
        rows={}
        source_calls={}
        pulses={}
        for m in (1,2):
            c=c82_rows[key,m]
            row=first_rows[key,m]
            p=n.pulses[row["system"]]
            assert p["id"]==c["nativeSystem"] and p["variable"]==c["w"]
            assert c["v"]==v and c["H_w"]==row["H_w"] and row["projected"]==p["forcing"]
            assert p["left"]==0 and p["initial"]==[{"imaginary":0,"real":0}]*3
            pulses[p["id"]]=p
            for j,z in enumerate(row["originalSource"]):
                for part,root in z.items():
                    d=wrappers[f"CoupledForced_source_{j}_{part}",root,(p["variable"],*p["parameters"])]
                    source_calls[d["id"]]=p["parameters"]
        assert len(source_calls)==12 and len(pulses)==2 and len(waves)==16
        for axis,binding in axes.items():
            factor=binding["normalizedFactor"]
            step=binding["centralStepArgument"]
            fixed=binding["fixedArgumentCoordinates"]
            witnesses=set()

            @cache
            def zero(i,allow_first_solution):
                if i==0:
                    return True
                if i==factor:
                    witnesses.add(i)
                    return True
                op,args=g.node(i)
                cond=lambda j:zero(j,allow_first_solution)
                if op=="add":
                    return all(map(cond,args))
                if op=="multiply":
                    return any(map(cond,args))
                if op=="integer_power":
                    return args[1]>0 and cond(args[0])
                if op=="smooth_piecewise":
                    return all(map(cond,args[3:]))
                if op=="source_step_derivative":
                    if args[0]==step:
                        witnesses.add(i)
                        return True
                if op=="m3_forced_pulse_partial":
                    owner,part,j,at,params,orders=args
                    return allow_first_solution and owner in pulses and at==v and params==pulses[owner]["parameters"] and sum(orders)<=3
                if op in defs:
                    owner,actual,orders=args
                    d=defs[op][owner]
                    if allow_first_solution and owner in source_calls and actual==[v,*source_calls[owner]] and sum(orders)<=3:
                        return True
                    substitution=dict(zip(d["parameters"],actual,strict=True))
                    return all(substitution.get(k,k)==k for k in fixed) and cond(d["body"])
                return False

            assert all(zero(i,False) for i in seeds.values()),(key,axis)
            assert all(zero(i,True) for i in waves.values()),(key,axis)
            assert witnesses,(key,axis)
            rows[axis]={"flatFactorAndStepUseRoots":sorted(witnesses),
                        "primarySeedBodies":len(seeds),"repeatWaveBodies":len(waves)}
        results.append({"chart":key,"primarySeeds":seeds,"reportedWaveOwners":waves,"axisChecks":rows})
    assert len(results)==10
    assert sum(len(r["primarySeeds"]) for r in results)==100
    return results


def main():
    cli=ArgumentParser(description=__doc__)
    for arg in ("work","goal","previous","out"):
        cli.add_argument("--"+arg,type=Path,required=True)
    args=cli.parse_args()
    scope=args.goal/"primary-forced-join/active-n3-c5-binding"
    reader=scope/"spatial-readback"
    cache_reader=scope/"live-wave-gauge/signed"
    helpers=args.work/"continuation82/forced-seams"
    pin(args.previous/"verify_predecessor_cutoff_tails.py",DIGESTS["C110Script"])
    sys.path[:0]=[str(args.previous),str(reader),str(cache_reader),str(helpers)]
    from verify_predecessor_cutoff_tails import PINS, pinned
    pinned(reader/"source_stream.py","reader")
    pinned(cache_reader/"source_cache.py","cacheReader")
    pinned(helpers/"verify_forced_seams.py","c82Reader")
    pinned(args.work/"continuation80/forced-wave/verify_forced_wave.py","c80Reader")
    pinned(args.goal/"first-force-repair/verify_repaired_first_force.py","exactAlgebra")
    import source_stream as st
    from source_cache import load
    from verify_forced_seams import Exact
    h=args.work/"continuation70/hosted-44582875351"
    source=h/"first-correction-spatial-source"
    manifest=json.loads(pinned(source/st.MANIFEST,"manifest"))
    first=json.loads(pinned(h/"same-family-mode-two.json","firstRows"))
    c82=json.loads(pinned(helpers/"forced-seams-final.json","C82"))
    waves=json.loads(pin(args.previous/"protected-wave-bodies.json",DIGESTS["C110ProtectedWaves"]))
    tails=json.loads(pin(args.previous/"protected-cutoff-tails.json",DIGESTS["C110CutoffTails"]))
    assert waves["predecessor"]["streamSHA256"]==tails["sourceStreamSHA256"]==c82["originalStreamSHA256"]==manifest["node_stream_sha256"]
    assert tails["counts"]["firstSupportedSourcesInPulseZeroIdeal"]==120
    native=st.Native(source,manifest)
    assert native.pin==PINS["registry"]
    guard_path=scope/"first-wave-guard-traces/first-forced-budget/outer-physical-gauge/source/forced-gauge-spatial.json"
    guard_data=json.loads(pin(guard_path,DIGESTS["guardChart"]))
    g_rows={r["chart"]:r["cutoffGuards"] for r in guard_data["liveForcedGauge"]["charts"] if r["mode"]==1}
    assert len(g_rows)==10
    graph=load(st,source,manifest,22153782,args.work/"continuation80/signed-wave/cache")
    def node(i):
        row=graph.record(i)
        return row["op"],row["args"]
    graph.node=node
    try:
        algebra=Exact(graph)
        geometry=chart(graph,native,algebra)
        axes=factors(graph,algebra,g_rows)
        checks=support(graph,native,first,c82,waves,axes)
    finally:
        graph.__exit__(None,None,None)
    value={"schema":"MathScope.C112.ActiveRepeatProtectedSlowFaceBinding/1",
           "status":"VERIFIED_ACTIVE_PROTECTED_SLOW_FACTORS_CONDITIONAL_FOUR_FACE_APPLICATION",
           "source":{"nodes":manifest["node_count"],"sha256":manifest["node_stream_sha256"],"registrySHA256":native.pin},
           "geometry":geometry,"inputPins":DIGESTS,"axisFactors":axes,"support":checks,
           "seedBodyAxisChecks":400,"waveBodyAxisChecks":640,
           "chartScope":"Fixed original labels, T>0, strict slow inverse bracket and shell; other slow and fast guards admitted. Native and ordinary cofactors and required finite regularity are assumed through the selected face.",
           "appendNeeded":"Same-running exact native registry and raw ideal for 240 slots; original nonzero Signed tail operands; active formal gate and source alignment.",
           "radialShell":"OPEN. Ordinary regularity of the selected slow face does not constrain the physical radial shell where the target y and derivative marginals can degenerate.",
           "wholeStageTwo":"OPEN","finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(value,indent=2)+"\n").encode())
    print(value["status"],400,640)


if __name__=="__main__":
    assert __debug__
    main()
