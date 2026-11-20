"""Verify the two actual W^+_{theta,z} mixed directions of the first Signed cycle."""
import argparse
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from math import comb,factorial,prod
from pathlib import Path
import runpy
from types import SimpleNamespace

PRE="continuation125/post-signed-theta-z-zt/"
NAVIER="continuation66/stage2/runtime-exact/research-ide/mathscope-m3/navier/"
PINS={
    "pre":("W",PRE+"pre-signed-theta-z-mixed.json","5f2403894ec7808bf0f6e4493f026b024e27be978994f2487cea55787deeb7fe"),
    "sigma3":("W","continuation125/sigma-mixed-join/sigma-mixed-join.json","ec610109784540efae884f7ddcb5a5c8da354cbd9e94c0c7aee8dd2790b65f0a"),
    "sigma2":("G","c119/signed-mixed-native-time/signed-mixed-sigma-time.json","d43d7d90c831c82b13c9fb68be5e4ab3acd8212fb7a1bd894e4d061d26673014"),
    "sigma1":("G","c118/pure-sigma-time-join/pure-sigma-time.json","b128b6131412a2aef44c6a945b00ca03b38c04308a57c141e03476ea82d5c796"),
    "sigmaSpatial":("G","c108/early-sigma-c6/early-sigma-c6.json","d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f"),
    "protectedCurl":("G","c119/signed-curl-mixed-t/signed-mixed-curl.json","2efe3573d8c7a9b41bb2ba6682307140a017436ada61291f6d131c24ff25cf2a"),
    "cutoff":("G","c107/post-signed-gauge/signed-gauge-cutoffs.json","449ced00be741aa9ed095a490a993ad728564776e62393ba75af49fbacfbca2a"),
    "cutoffProgram":("G","c107/post-signed-gauge/verify_signed_gauge_cutoffs.py","831da007a6df9a67a891daad090d2f400e2730dde65332aa4b59f2fd70efb367"),
    "frame":("G","c106/frame15/frame-c15.json","09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8"),
    "indexed":("W",NAVIER+"generic-signed-162-indexed.mjs","973136acf1571a75a307e374576ec8dbbe0340c19e90ee327373df7638100bec"),
    "harmonic":("W",NAVIER+"source-global-forced-current.mjs","1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3"),
    "bridge":("W",NAVIER+"original-signed-162-bridge.mjs","9838590f11d94e00977fc51344ee3e55f2a714463643624eb9f6695fcfd27af9"),
}
REGIONS=("inner","outer","middle")
TARGETS=((0,1,1,0),(0,1,1,2))
WAVE_LEGS=("Primary","Forced1","Signed")
BASE=(0,0,0,0)
R=(1,0,0,0)
Z=(0,1,0,0)
L=(0,0,0,1)


def plus(a,b):
    return tuple(x+y for x,y in zip(a,b,strict=True))


def minus(a,b):
    return tuple(x-y for x,y in zip(a,b,strict=True))


def splits(a):
    for b in product(*(range(n+1) for n in a)):
        yield b,minus(a,b),prod(comb(u,v) for u,v in zip(a,b,strict=True))


def load(work,goal):
    roots={"W":work,"G":goal}
    d={}
    for key,(root,name,digest) in PINS.items():
        path=roots[root]/name
        raw=path.read_bytes()
        assert sha256(raw).hexdigest()==digest,path
        d[key]=(runpy.run_path(str(path)) if name.endswith(".py")
                else json.loads(raw) if name.endswith(".json") else raw.decode())
    return d


def bound_sources(d):
    strings={
        "indexed":("waveRows=sumModes(C,old.waveRows,signedRows)",
                   "after=services.covariance(G,{rows:waveRows,theta:",
                   "updatedCovariance=Object.fromEntries(names.map(k=>[k,G.add(oldW[k],roots.covariance[k])]))"),
        "bridge":("covariance:exactAngularWaveCovariance",),
        "harmonic":("partner:-row.m,value:C.mul(row.velocity[i],at.get(-row.m).velocity[j])",
                    "full-W-conjugate-", "full-W-real-angular-mean-"),
    }
    for key,parts in strings.items():
        assert all(t in d[key] for t in parts),key
    protect=d["protectedCurl"]
    assert protect["sourceStreamSHA256"]=="faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
    assert len(protect["cases"])==10 and len(protect["originalDefinitions"])==6
    assert "no xi remaining in B" in protect["transverseReduction"]
    assert [x["radialFast"] for x in protect["originalRadialChart"]["localAndCommonReference"]]==[17735155,17745446]
    return {"protectedPrefixSHA256":protect["sourceStreamSHA256"],
            "protectedRegistrySHA256":protect["registrySHA256"],
            "signedGaugeDefinitions":protect["originalDefinitions"],
            "protectedChartCount":len(protect["cases"]),
            "sameCarrierBothSigns":True,"angularModePair":"m and -m",
            "transverse":"L^k C=(L xi)^k chi^(k)(xi) B at fixed label. No division at a cutoff zero."}


def sigma_hulls(d):
    exact={}
    for item in d["sigmaSpatial"]["regions"].values():
        for row in item["rows"]:
            a=tuple(row["RZT"])
            if a[2]==0:
                exact.setdefault(a,[]).append(row)
    s0=d["sigmaSpatial"]["commonBound"]
    p=d["sigma1"]["absoluteBound"]
    s1=d["sigma2"]["mixedCommon"]
    s2=d["sigma3"]["common"]
    assert d["sigma3"]["nativeSigmaRoots"]==d["sigma2"]["nativeSigmaRoots"]==[22001223,22001224]
    assert d["sigma1"]["actualNativeSigma"]==[22001223,22001224]
    assert d["sigma3"]["targetsRZT"]==[[1,1,1],[0,2,1]]
    for a,cap in (
            ((0,0,1),p),((1,0,1),s1),((0,1,1),s1),((1,1,1),s2),((0,2,1),s2)):
        exact[a]=[cap]
    result={}
    for a,limits in exact.items():
        assert min(Q(x["epsilon"]) for x in limits)>=1
        b=max(Q(x["band"]) for x in limits)
        pole=max(x["pole"] if "pole" in x else x["collarPole"] for x in limits)
        rank=max(x["coefficientInHOver2Pow128"] if "coefficientInHOver2Pow128" in x
                 else x["logCoefficientUnitsHOver2Pow128"] for x in limits)
        assert b<=Q(131,2) and pole<=48 and rank<2**20
        result[a]=b,pole,rank
    assert s0["retainedGaussian"]==p["gaussian"]==s1["gaussian"]==s2["gaussian"]=="zeta"
    return result


def wave_curl_dependencies():
    rows={}
    alpha_set={b for a in TARGETS for b,_,_ in splits(a)}
    for a in sorted(alpha_set):
        # Entire complex coefficient is local gauge leading plus exact
        # ordinary remainder. D_r adds R or one transverse derivative and
        # D_z adds Z. Other coefficient derivatives can only lower orders.
        for j in (1,2):
            rows[j,a]=sorted({plus(b,axis) for b,_,_ in splits(a)
                              for axis in ((BASE,R,Z,L) if j==1 else (BASE,R,L))})
    return rows


def signed_gauge_caps(d,goal,dependencies):
    frame=d["frame"]
    assert frame["matrixDirections"]==816 and frame["cutoffOrder"]==19
    catalog=frame["catalogue"]
    assert len(catalog["gramInverse"])==4 and len(catalog["squareRootWeight"])>=16
    assert len(catalog["tangent"])>=16
    sigma=sigma_hulls(d)
    cutoff=d["cutoff"]
    op=d["cutoffProgram"]
    slow,chi,log_s=op["cutoff_series"](SimpleNamespace(goal=goal),6)
    rad=op["reciprocal_gaussians"](3,log_s)
    assert json.loads(json.dumps({side:cutoff["GaussianReciprocal"][side][:4] for side in rad}))==rad
    assert [int(Q(x).__ceil__()).bit_length() for x in slow[:4]]==cutoff["cutoffOrdinaryRanks"][:4]
    assert [int(Q(x).__ceil__()).bit_length() for x in chi[:4]]==cutoff["transverseRanks"][:4]
    maxima={}
    all_gauges={q for values in dependencies.values() for q in values}
    for a in sorted(all_gauges):
        rzt,j=a[:3],a[3]
        degree=sum(rzt)
        assert degree<=3 and j<=3
        possibilities=[]
        for si,other,w_sigma in splits(rzt):
            s,p,c=sigma[si]
            for core,other,w_core in splits(other):
                for reciprocal,partition,w_reciprocal in splits(other):
                    q=sum(reciprocal)
                    # Same all-RZT positive Gram/frame derivative bound as
                    # C119. C107's log-X chain bounds R,Z,T under C106's
                    # directed implicit-s chart, with endpoints fixed.
                    band=s+Q(1,4)+3*(sum(core)+sum(partition))
                    pole=p+max(rad[side][q]["extraPole"] for side in rad)
                    charge=(c+sum(frame["uniformLogRanks"])+
                            max(rad[side][q]["ordinaryLogRankAfterGeometry"] for side in rad)+
                            (slow[sum(partition)]*chi[j]).__ceil__().bit_length()+
                            (w_sigma*w_core*w_reciprocal).bit_length()+64)
                    possibilities.append((band,pole,charge))
        assert max(x[2] for x in possibilities)+len(possibilities).bit_length()<2**21
        maxima[a]=[str(max(row[0] for row in possibilities)),max(row[1] for row in possibilities),
                   max(row[2] for row in possibilities)+len(possibilities).bit_length()]
    return maxima,sigma


def pair_bound(d,dep,gauges):
    left={tuple(x["RZTL"]):x for x in d["pre"]["covarianceRows"]}
    mode_two={tuple(r["RZTL"]):r for r in d["pre"]["modeTwoGauges"]}
    assert set(TARGETS)<=left.keys()
    assert d["pre"]["covarianceCommonLogRankHOver2Pow128"]<2**18
    sources={region:{tuple(r["RZTL"]):r for r in d["pre"]["threeRegionModeOneGauges"][region]}
             for region in REGIONS}
    cases={}
    for alpha in TARGETS:
        ledger=[]
        for b,c,w in splits(alpha):
            required=dep[1,b]+dep[2,c]
            assert set(required)<=mode_two.keys()
            assert all(Q(mode_two[q]["epsilon"])>=Q(99999,100000) and
                       mode_two[q]["explicitCarrier"]=="1/(2k)" and
                       Q(mode_two[q]["band"])<64 and mode_two[q]["poleAfterZeta"]<40 and
                       mode_two[q]["logRank"]<2**16 for q in required)
            for region,table in sources.items():
                assert set(required)<=table.keys()
                assert all(Q(table[q]["phaseFreeGradeAfterOneDebit"])>=Q(29999,20000) and
                           table[q]["prefactorLogRankHOver2Pow128"]<2**17 and
                           Q(table[q]["bandAfterNativeTransfer"])<64 and
                           Q(table[q]["poleAfterHalfGaussian"])<40 for q in required)
            for q in required:
                s,p,c0=gauges[q]
                assert Q(s)+3*(sum(alpha[:3])+1)+1<96 and p<=60 and c0<2**21
            for first,second in product(WAVE_LEGS,repeat=2):
                ledger.append([1,first,second,b,c,w])
            ledger.append([2,"Forced2","Forced2",b,c,w])
        # Recover the true negative mode partners via 2*Re. The full
        # primitive cover retains no cross-label contributions.
        multiplicity=162*2*2*sum(r[-1] for r in ledger)
        assert sum(x[-1] for x in ledger)==10*2**sum(alpha)
        # On a collar 2m>=120 pays both exhibited half-Gaussian poles.
        # In the complementary chart the unweighted middle cap has no pole.
        assert (2**60*factorial(60)).bit_length()<512
        rank=2**22+512+multiplicity.bit_length()+2**15
        assert rank<2**23
        assert 2*(Q(rank,2**128)+Q(192,2**32636))<Q(1,100000)
        cases[str(alpha)]={"originalProductLeibnizLedger":ledger,
                           "unnormalizedBandBeforeDebit":"192","collarPoleBeforeGaussianAbsorption":120,
                           "epsilonAfterBandLogAndGaussianDebit":"99999/100000"}
    return cases


def main(a):
    d=load(a.work,a.goal)
    bound=bound_sources(d)
    dep=wave_curl_dependencies()
    gauges,sigma=signed_gauge_caps(d,a.goal,dep)
    pair=pair_bound(d,dep,gauges)
    return {"schema":"MathScope.C125.OriginalNarrowPostSignedThetaZZTWithAuxiliary/1",
            "status":"CONDITIONAL_NARROW_ACTUAL_POST_SIGNED_COVARIANCE",
            "pins":PINS,"source":bound,"target":"W^+_{theta,z}",
            "RZTL":TARGETS,"pairedTrace":pair,
            "gaugeRows":[[a,values] for a,values in sorted(gauges.items())],
            "sigmaSlowInputs":[list(a) for a in sorted({g[:3] for g in gauges})],
            "fullWholeShiftedCommonTorusInput":{"epsilon":"99999/100000","band":"0",
                         "application":"centered late Temporal swirl Fourier pair at ZT and ZTL^2 only"},
            "premises":"Original admissible fixed-label charts, flat joins, positive frame and same torus/Fourier realization. Full post-Signed W_rz,ZZZT remains outside this narrow result.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=argparse.ArgumentParser()
    for name in ("work","goal","out"):
        p.add_argument("--"+name,type=Path,required=True)
    args=p.parse_args()
    result=main(args)
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS original post-Signed theta-z W_ZT and L^2 W_ZT conditional pair budgets")
