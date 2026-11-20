"""Replay the original projected fast PostFive cofactor on both radial collars."""
from argparse import ArgumentParser
from hashlib import sha256
from itertools import product
import inspect
import json
from pathlib import Path
import runpy
from types import SimpleNamespace

PINS = {
    "native": ("work","continuation135/radial-mean-cofactors/native-mean-cofactors.json","d8e7199c846f822c554f569e555d2718ec38810851cd8ba8e224f7cc837d8cb3"),
    "ordinary": ("work","continuation135/radial-mean-cofactors/late-ordinary.json","3c9cf3fbf41b554761a6cc195d183f5035b25065425473059bf25134db414e80"),
    "fast": ("work","continuation134/repeat-eikonal-fast-mean/protected-fast-mean.json","ad7ff7ce03985e2114a5881a8e8fc2bc2b576fe944c8d441b6b2468bca1a5221"),
    "fastReplay": ("work","continuation134/repeat-eikonal-fast-mean/verify_protected_fast_mean.py","f460d3b518d43441dec63eeb49208402402bfbbdee147c78faa04cf45175c12d"),
    "pulse": ("work","continuation135/radial-pulse-vv/radial-pulse-vv.json","21f501d7ebcb63a32871a992b15c95d31ed4abdb18240f311295e9e2032b5824"),
    "c134": ("work","continuation134/radial-time-gaussian/verify_radial_time_gaussian.py","73cd66c070f1e1ed9468aa1db1bb27c0c502b832f4e6d29f8fe0f72487e2a3c1"),
    "sigma0": ("work","continuation108/early-sigma-c6/final/early-sigma-c6.json","d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f"),
    "sigmaT": ("work","continuation118/pure-sigma-time-join/pure-sigma-time.json","b128b6131412a2aef44c6a945b00ca03b38c04308a57c141e03476ea82d5c796"),
    "sigmaRT_ZT": ("work","continuation119/signed-mixed-native-time/signed-mixed-sigma-time.json","d43d7d90c831c82b13c9fb68be5e4ab3acd8212fb7a1bd894e4d061d26673014"),
    "sigmaRZT_ZZT": ("work","continuation125/sigma-mixed-join/sigma-mixed-join.json","ec610109784540efae884f7ddcb5a5c8da354cbd9e94c0c7aee8dd2790b65f0a"),
    "sigmaRRT": ("work","continuation127/sigma-rrt/join.json","e59a7141b801536964f6991ff99a38112e4a997cd29a3a25fe3807566fdfec3c"),
    "forcedModule": ("runtime","mathscope-m3/navier/source-global-forced-current.mjs","1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3"),
    "signedIndexedModule": ("runtime","mathscope-m3/navier/generic-signed-162-indexed.mjs","973136acf1571a75a307e374576ec8dbbe0340c19e90ee327373df7638100bec"),
    "sigmaTime": ("work","continuation128/sigma-high-time/sigma-high-time.json","c09bf88e3ad65ecf9b5f21e25fe229469cd3e491bacb2dd0ee5ead4627d6ef00"),
    "lateOps": ("goal","c105/late-grade/verify_late_grade.py","b7df296fa485ae391e0d53762e58c6a9eb469f53842083acb5189e220d81c4cc"),
}
PAIRS = {"rr":("beta","beta"),"rtheta":("beta","v"),"rz":("beta","gamma"),
         "thetatheta":("v","v"),"thetaz":("v","gamma"),"zz":("gamma","gamma")}
OFFSETS = ((0,0,0,0,0),(1,0,0,0,0),(0,1,0,0,0),(0,0,0,1,0))


def read(roots, k):
    key,rel,digest=PINS[k]
    p=roots[key]/rel
    blob=p.read_bytes()
    assert sha256(blob).hexdigest()==digest,(k,p)
    return runpy.run_path(str(p)) if p.suffix==".py" else json.loads(blob) if p.suffix==".json" else blob.decode()


def replace(text, source, target, expected_count=1):
    assert text.count(source)==expected_count,(source,text.count(source))
    return text.replace(source,target)


def required(native):
    assert native["directionOrder"]==["R","Z","T","Y0","Y1"]
    assert len(native["actualMeanApplications"])==15
    assert native["conditionalFiveMapCofactorTrace"]["freshFiveMapOnBothRadialCollars"]=="identically zero"
    all_native=set()
    for details in native["requiredCofactorDirections"].values():
        positive={tuple(j) for j in details["union"]}
        assert len(positive)==19
        if all_native:
            assert all_native==positive
        all_native=positive
    # Each untranslated Y derivative has an L and N component. The fixed
    # irrational two-dimensional eigenbasis is invertible.
    new={(r,z,t,l+n-x,x) for r,z,t,l,n in all_native for x in range(l+n+1)}
    targets=sorted(j for j in new if j[4])
    assert len(targets)==6 and all(sum(a)<=2 for a in targets)
    assert sum(1 for j in new if not j[4])==13
    return targets


def compile_probe(ops, fast_replay):
    original=inspect.getsource(ops["calculus"])
    body=original[original.index("    def background"):original.index("    @cache\n    def Q0")]
    body=replace(body,"if a[3]:","if a[3] or a[4]:")
    body=replace(body,"r,z,t,l=a","r,z,t,l,n=a",4)
    body=replace(body,"f((r-i,z,t,l))","f((r-i,z,t,l,n))",2)
    body=replace(body,"(r-i-1,z,t,l+1),whole","(r-i-1,z,t,l+1,n),whole")
    body=replace(body,"((r-1,z,t,l))","((r-1,z,t,l,n))")
    body=replace(body,"(r-i,z-j,t-k,l),True","(r-i,z-j,t-k,l,n),True")
    body=replace(body,"return add(primitive_part(name,a,False),cutoff_whole(name,a))",
                 "return primitive_part(name,a,False)")
    # Retain the admitted short-primitive endpoint derivative. Remove the
    # whole-cutoff terms only after fixing an open collar where chi is constant.
    core=inspect.getsource(fast_replay["arithmetic"])
    i=core.index("    @cache\n    def initial_pressure_z")
    j=core.index("    zero_dir=",i)
    original_fast=core[i:j]
    probe="""def probe(component,a):
    waveseen,oldseen,primary_seen,bgseen,cutoff,primitive,forcing=(set() for _ in range(7))
    zero=NORM(10*EPS,0,0,0)
    E=EPS
    def W(f,a):
        waveseen.add((f,a))
        return NORM(0,0,1,0)
    def W0(f,a):
        primary_seen.add((f,a))
        return NORM(0,0,1,0)
    def old(f,a):
        oldseen.add((f,a))
        return NORM(0,0,1,0)
"""+body+original_fast+"""    if component=="v":
        nonfast("theta",a)
    elif component=="beta":
        z=shift(a,1)
        radial_flux(z)
        rad_weight(lambda j:Tchi("fastWeightedZ",j),z,-1)
    else:
        assert component=="gamma"
        De(radial_flux,a,1)
        residual(a)
    return {"Wplus":waveseen,"W0":primary_seen,"old":oldseen,"background":bgseen,
            "cutoff":cutoff,"shortPrimitive":primitive,"nonfastTheta":forcing}
"""
    ns=dict(ops)
    exec(compile(probe, "original C105+C134 collar dependency probe", "exec"),ns)
    return ns["probe"]


def plus(a,b):
    return tuple(x+y for x,y in zip(a,b,strict=True))


def orders(a):
    return product(*(range(i+1) for i in a))


def hull(roles):
    a=list(roles)
    return {"count":len(a),"slow":max(sum(j[:3]) for j in a),"T":max(j[2] for j in a),
            "L":max(j[3] for j in a),"N":max(j[4] for j in a)}


def closure(d, roots, leaves):
    wplus=leaves["Wplus"]
    assert all(f in PAIRS for f,_ in wplus)
    # Exact gauge derivative classes are a subset of these four maximum
    # offsets. Both feet of each original covariance product are retained.
    waveder={b for _,a in wplus for b in orders(a)}
    gauge={plus(a,b) for a in waveder for b in OFFSETS}
    old=set(leaves["old"])
    primary=set(leaves["W0"])
    recipe=d["c134"]["load"](roots,"modeOneRecipe")["grouped_recipes"]()
    translate={"Db":"beta","Dv":"v","Dg":"gamma"}
    for a in gauge:
        # t_v has no f_v. A pure N direction of the output from the pressure
        # equations is first pulse at worst. We retain f_N too as independent
        # conservative finite overcover of the raw grouping.
        for b in orders(a):
            for family in recipe.values():
                for factors in family:
                    for f,o in factors:
                        n=plus(b,(*o,0))
                        if f in ("U","Uo","P"):
                            primary.add((f,n))
                        elif f in translate:
                            old.add((translate[f],n))
            primary.update(("Umode2",plus(b,off)) for off in OFFSETS)
    mean=d["c134"]["load"](roots,"meanCollar")["collar"]
    algebra=d["c134"]["load"](roots,"meanAlgebra")
    for n in sorted({a[4] for _,a in old}):
        _, w, _, _, _=mean(algebra,6,sorted({(f,a[:4]) for f,a in old if a[4]==n}))
        primary.update(("PrimaryCovariance_"+f,(*a,n)) for f,a in w)
    return {
        "WplusWaveFactorOrders":sorted(waveder),
        "WplusGaugeOrders":sorted(gauge),
        "signedSigmaRZTOrders":sorted({a[:3] for a in gauge}),
        "primaryExpansionRoles":sorted(primary),
        "primaryEnvelope":hull({a for _,a in primary}),
        "initializedAllRoles":sorted(old),
    }


def sigma_and_covariance(d, need, roots):
    # Use every genuine native Sigma component required by the curl overcover.
    original_roots=[22001223,22001224]
    require={(f,a) for f in ("theta","z") for a in need["signedSigmaRZTOrders"]}
    eps_source=d["sigma0"]
    assert eps_source["SigmaApplications"]==original_roots
    spatial={(r["field"],tuple(r["RZT"])) for r in eps_source["regions"]["inner"]["rows"]}
    assert spatial=={(r["field"],tuple(r["RZT"])) for r in eps_source["regions"]["outer"]["rows"]}
    source_at={k:"C108 original spatial collar recurrence" for k in spatial}
    for k,name,shape in (("sigmaT","C118","absoluteBound"),("sigmaRT_ZT","C119","mixedCommon"),
       ("sigmaRZT_ZZT","C125","common"),("sigmaRRT","C127","common"),("sigmaTime","C128","common")):
        source=d[k]
        assert source["actualNativeSigma" if k=="sigmaT" else "nativeSigmaRoots"]==original_roots
        assert source[shape]["gaussian"]=="zeta"
        raw_targets=(source["mixedRZT"] if k=="sigmaRT_ZT" else
                     [(0,0,1)] if k=="sigmaT" else source["targetsRZT"])
        if isinstance(raw_targets[0],int):
            raw_targets=[raw_targets]
        for a in map(tuple,raw_targets):
            for f in ("theta","z"):
                source_at[f,a]=name
    assert require<=set(source_at),(require-set(source_at))

    signed=d["signedIndexedModule"]
    forced=d["forcedModule"]
    assert "waveRows=sumModes(C,old.waveRows,signedRows)" in signed
    assert "services.covariance(G,{rows:waveRows,theta:pressure.current.band.coordinates.theta})" in signed
    assert "updatedCovariance=Object.fromEntries(names.map(k=>[k,G.add(oldW[k],roots.covariance[k])]))" in signed
    assert "at.get(-row.m).velocity[j]" in forced
    assert "partner:-row.m" in forced
    assert "zeroDataPreservesTransverseSupport" in forced
    envelope=need["primaryEnvelope"]
    primary=d["c134"]["load"](roots,"primary")["weightedQuotientLedger"]
    assert envelope["slow"]<=11 and envelope["L"]<=primary["transverseDerivativeCoverage"]["normalizedVelocityL"]
    assert envelope["N"]==1 and envelope["T"]<=2
    assert primary["firstPulseDerivativeCoverage"]["normalizedAmplitudePotentialVelocity"]
    assert d["pulse"]["traceScope"]["finiteFixedLabelPole"] is True
    return [{"component":f,"RZT":a,"attachment":source_at[f,a]} for f,a in sorted(require)]


def main(roots):
    d={k:read(roots,k) for k in PINS}
    assert d["native"]["fastIdentitySHA256"]==PINS["fast"][2]
    assert d["ordinary"]["counts"]["W"]==280 and d["ordinary"]["counts"]["old"]==373
    replay=d["fastReplay"]
    assert replay["source"](replay["load"](SimpleNamespace(**roots)))["originalLateCenteredSources"]==[22032006,22032008]
    p=compile_probe(d["lateOps"],replay)
    want=required(d["native"])
    all_leaves={}
    by_row=[]
    for name in ("beta","v","gamma"):
        for a in want:
            before=(*a[:4],a[4]-1)
            leaves=p(name,before)
            for typ,content in leaves.items():
                all_leaves.setdefault(typ,set()).update(content)
            by_row.append({"field":name,"RZTLN":a,"neededSourceAfterOneN":before,
                           "counts":{key:len(v) for key,v in leaves.items()}})
    assert not all_leaves["cutoff"]
    assert all(not whole for _,_,whole in all_leaves["shortPrimitive"])
    assert set(a[4] for _,a in all_leaves["Wplus"])=={0,1}
    oldW={(f,tuple(a)) for f,a in d["ordinary"]["inputs"]["W"]}
    oldO={(f,tuple(a)) for f,a,_ in d["ordinary"]["inputs"]["old"]}
    need=closure(d,roots,all_leaves)
    sigma=sigma_and_covariance(d,need,roots)
    return {
        "schema":"MathScope.C136.OriginalRadialMeanFastCofactorDependencies/1",
        "status":"CONDITIONAL_FIXED_LABEL_ORIGINAL_POSITIVE_N_MEAN_COFACTOR",
        "PINS":PINS,"directionOrder":["R","Z","T","L","N"],
        "positiveNTargetsPerVelocityComponent":want,"positiveNOutputRows":by_row,
        "untouchedN0CofactorPass":False,"exactFastRoleCounts":{k:len(v) for k,v in all_leaves.items()},
        "WplusEnvelope":hull({a for _,a in all_leaves["Wplus"]}),
        "initializedEnvelope":hull({a for _,a in all_leaves["old"]}),
        "W0Envelope":hull({a for _,a in all_leaves["W0"]}),
        "unions":{k:sorted(v) for k,v in all_leaves.items()},
        "additionalWplusBeyondOrdinaryCofactorCrop":sorted((f,a) for f,a in all_leaves["Wplus"] if a[4] or (f,a[:4]) not in oldW),
        "additionalOldBeyondOrdinaryCofactorCrop":sorted((f,a) for f,a in all_leaves["old"] if a[4] or (f,a[:4]) not in oldO),
        "conservativeWaveClosure":need,"sigmaDonorAttachments":sigma,
        "conditionalWeights":{"oldMean":"zeta","W0":"zeta","Wplus":"zeta","projectedNMean":"zeta"},
        "uniformEpsilonClaim":False,"fullSupportedRepeatC1Claim":False,
        "finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    p=ArgumentParser()
    for k in ("work","goal","runtime","out"):
        p.add_argument("--"+k,type=Path,required=True)
    args=vars(p.parse_args())
    args["out"].write_bytes((json.dumps(main(args),indent=2,sort_keys=True)+"\n").encode())
