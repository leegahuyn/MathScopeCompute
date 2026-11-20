"""Join both actual early Signed Sigma bounds at the 18 original slow directions."""
from argparse import ArgumentParser
from dataclasses import dataclass
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import inspect
from itertools import product
import json
from math import comb, factorial, prod
from pathlib import Path
import runpy
import sys

PINS={
    "frontier":"d7d5d99aa0285e99680f90563b9e27bce8a95877265134165061a7f7745e5cc8",
    "early":"c68fe265e3eecc53fd91963eb175d529da6cafda7775c6d5aaf09dee406b97da",
    "centered":"8debc1a74134334ab4aa1cac81e8e3cadf550f839b64283881e2e405d5734942",
    "pressureCode":"3e2651c95bdd6c3b81d84e6cd554332a8d14d7099b79ad1a3e69b62cc0382700",
    "one":"e58b46a729dd9029a35c5e5115f3156943e1d9f8eae33c9bff8d6ee2426a81d8",
    "two":"c892d8878e0607117077f08c41b6d8d79f3e8729dc85bf79f35e346daf9cfa9e",
    "twoCode":"a8c68fb4b028df9c225ec153c73066252d8237c435bb62b114adbf198b76db49",
    "forcedSource":"1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3",
    "middleJoin":"8e1974d3a62ffddb7cd9690a6b46588da9d5a9fd736b9db2365951555a490e7d",
    "stress":"97c679cc958b0e05f9d2feb19b52efd29c12e54b41fc034c08268e81b1633b12",
    "oldMean":"360b18bef09ba1afd09b160b342e70f38474c876b19a00a73fe0eb3169b9f650",
    "weightedCode":"e04b53553c683588dafc94d0e93744f39f9483fa376f8ab1a3557d4e6e477f87",
    "demand":"f24b678dd43fb5b92e7bca105a51f9e0741a38dad5a6f2210e0f0b8b3ae10cbb",
    "frame":"09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8",
    "covariance":"05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e",
    "geometry":"2b37b73515aff09625b0b8e8e433a651cfaf8ad3bfd273befa3eb6485b1006d8",
    "matrix":"e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36",
    "pulseReadme":"246b723f8de4c939193ab42c1230165a1dff7aad197f626bc09b0831e7850638",
    "pulseBound":"71b6c139f15491aa0c625a25c91c32987a4f58038ccd97fdce9ea888a6e892aa",
    "background":"1833785fc21ad6c73029361d6d6a44b2bb0baa099d57986709114093a53de9cc",
    "radialB":"789ebac9d163f4170581078e2a73e85cb4703582155d7ae8e71846915b6b08fc",
}
E=100000
K=1


def pinned(a,key):
    body=getattr(a,key).read_bytes()
    assert sha256(body).hexdigest()==PINS[key],key
    return body


def adjunction(fn,changes):
    code=inspect.getsource(fn)
    for old,new in changes:
        assert code.count(old)==1,old
        code=code.replace(old,new)
    ns={}
    exec(compile(code,inspect.getfile(fn),"exec"),fn.__globals__,ns)
    return ns[fn.__name__]


def pin_native(a,d):
    pinned(a,"pressureCode")
    mod=runpy.run_path(str(a.pressureCode))
    base=mod["BASE"]
    band=mod["BAND"]
    paths={"reader":base/"spatial-readback/source_stream.py","cache":base/"live-wave-gauge/signed/source_cache.py",
          "exact":Path("first-force-repair/verify_repaired_first_force.py"),
          "pressureChecker":band/"weighted-haar-shell/pressure/check_pressure_shell.py"}
    for name,p in paths.items():
        mod["pinned"](a.goal/p,name)
    sys.path[:0]=[str((a.goal/paths[k]).parent) for k in ("reader","cache","exact")]
    import source_stream
    import source_cache
    from verify_repaired_first_force import Exact
    folder=a.artifact/"first-correction-spatial-source"
    man=json.loads(mod["pinned"](folder/source_stream.MANIFEST,"manifest"))
    reg=source_stream.Native(folder,man)
    assert reg.pin==mod["PINS"]["registry"]
    stream=source_cache.load(source_stream,folder,man,22153782,a.cache)
    try:
        assert stream.verify==d["centered"]["sourceStream"]
        old=runpy.run_path(str(a.goal/paths["pressureChecker"]))
        graph=old["Graph"](stream)
        exact=Exact(graph)
        assert mod["current_stage"](stream,reg,exact)==d["centered"]["native"]
        assert old["check_live"](graph,reg,exact)==d["centered"]["originalShiftedPressure"]
        groups=mod["group_actual_haar"](stream,reg,exact)
        assert json.loads(json.dumps(groups))==d["centered"]["fullHaarGroups"]
        assert mod["pressure_algebra"](exact)==d["centered"]["pressureCentering"]
        return stream.verify
    finally:
        stream.__exit__()


def donors(a,d):
    orders=d["frontier"]["orders"]
    assert len(orders["weightedSigmaSpatialOrders"])==18
    assert d["stress"]["weightedLocalFlux"]["maximumOuterPole"]==21
    assert d["stress"]["weightedLocalFlux"]["logCoefficientCap"]=="H/2^255"
    assert [x["RZT"] for x in d["stress"]["weightedLocalFlux"]["coveredExactDirections"]]==orders["localWeightedRadialFlux"]
    assert d["radialB"]["ordinaryDerivativeOrder"]==10 and d["radialB"]["originalLiveSlabThresholdComparison"]==-1
    assert d["background"]["derivativeOrder"]==16 and d["background"]["comparison"]["sign"]==-1
    assert d["oldMean"]["cutoff"]["order"]==11
    assert d["oldMean"]["cutoff"]["rhoMassLower"]=="2^-16"
    assert d["oldMean"]["cutoff"]["cutoffAndNormalizedDensityBound"]=="Bnorm"
    assert d["oldMean"]["actualCompactProfile"]["compactZeroOnBothSourceCollars"]
    assert d["oldMean"]["actualCompactProfile"]["conditionalLogCoefficient"]=="H/2^111"
    assert d["centered"]["finiteGaussianTransfer"]["maximumInputPole"]==512

    pinned(a,"weightedCode")
    old=runpy.run_path(str(a.weightedCode))
    means,branches=adjunction(old["sigmas"],[
        ('    assert max(j[1] for j in mean["beta"])==max(j[1] for j in mean["gamma"])==4\n',''),
        ('    assert max(j[1] for j in mean["v"])==3\n',''),
    ])(orders)
    collar=adjunction(old["collar"],[
        ('    assert max_field==7 and max(j[3] for f,j in cov)<=8\n',''),
        ('    assert {f for f,j in cov if sum(j[:3])==7}=={"W_rz"}\n',''),
    ])
    old_rows={(f,tuple(b)):rec for f,b,rec in d["oldMean"]["meanOrders"]}
    assert len(old_rows)==117
    assert all((f,p) in old_rows for f,j in means.items() for p in j)
    assert all((f,tuple(p)+(0,)) in old_rows for f,j in orders["compactFiveMapOrders"].items() for p in j)
    high_cov={(r["component"],tuple(r["RZTL"])):r for r in d["oldMean"]["covarianceHighOrders"]}
    collar_data={}
    for area,base in (("inner",6),("outer",9)):
        cr=collar(base,means,branches)
        assert len(cr["exactCovarianceRows"])==437
        hi={(name,tuple(b)) for name,b in cr["exactCovarianceRows"] if sum(b[:3])>7 or b[3]>8}
        assert len(hi)==40 and hi<=set(high_cov)
        assert max(b[3] for name,b in cr["exactCovarianceRows"])==6
        assert cr["maximumCovarianceSlow"]==11
        assert cr["maximumQuadraticPoleBeforeExtraGaussianUse"]==(42 if area=="inner" else 48)
        assert d["covariance"]["coefficientBudget"]["wholePathCovarianceLogCap"]=="H/2^113"
        assert all(high_cov[k]["logCap"]=="H/2^111" for k in hi)
        mass=max(Q(row["coefficientMass"]).__ceil__().bit_length() for v in cr["pairRows"].values() for row in v)
        poles=cr["maximumQuadraticPoleBeforeExtraGaussianUse"]
        absorption=factorial((poles+1)//2).bit_length()
        rank=2*(2**17)+mass+absorption+192
        assert rank<2**19
        dd={(f,tuple(row["RZT"])):row for f,rows in cr["pairRows"].items() for row in rows}
        collar_data[area]=(cr,dd,rank)
    return orders,old_rows,branches,collar_data


def waves(a,d,orders):
    am=d["one"];bm=d["two"];requested={tuple(w) for w in d["demand"]["requests"]}
    one={tuple(r["RZL"]):r for r in am["collars"]}
    mid={tuple(r["RZL"]):r for r in am["middle"]}
    two={tuple(r["RZL"]):r["gaugeAfterCarrierFactorRemoved"] for r in bm["conditionalGaugeRows"]}
    assert len(requested)==len(one)==len(mid)==len(two)==50
    assert requested==set(one)==set(mid)==set(two)
    assert d["demand"]["pairedCases"]==2970
    assert requested=={tuple(q) for row in d["demand"]["roles"] for q in row["sufficientGaugeDirectionsRZL"]}
    assert len(d["demand"]["roles"])==93
    assert all(tuple(aa) in requested for a in requested for aa in product(*(range(k+1) for k in a)))
    assert max(sum(a[:2]) for a in requested)==9
    assert all(Q(q["gaugeEpsilonAfterOneDebit"])>=Q(149993,E) for q in one.values())
    assert all(Q(q["nativeBandSPower"])<=Q(71,4)+3*sum(a[:2]) and
               Q(q["gaugePoleAfterSqrtZeta"])<=Q(21,2)+3*sum(a[:2])
               for a,q in one.items())
    assert all(Q(q["bandPower"])<=10+3*sum(a[:2]) and
               max(q["outerPoleAfterZeta"],q["conservativeInnerPoleAfterZeta"])<=12+3*sum(a[:2])
               for a,q in two.items())
    assert all(q["inverseCarrierFactor"]=="1/(2*k)" for q in two.values())
    assert Q(bm["conditionallyAbsorbedEpsilonGrade"])==Q(49999,50000)
    assert all(q["gaugeCoefficientCap"]=="H/2^111" for q in list(one.values())+list(mid.values()))
    assert all(q["logCap"]=="H/2^112" for q in two.values())
    assert all(Q(q["gaugePoleAfterSqrtZeta"])==0 for q in mid.values())
    assert all(sum(q["positiveLogRanks"])<2**16 for q in two.values())
    pulse=pinned(a,"pulseReadme").decode()
    assert "The same is true of the reference rates, " in pulse and "#17733391" in pulse and "#17733724" in pulse
    assert d["pulseBound"]["gaussianLengthGain"]["originalPulseAmplitude"]=="P(v)<=exp(-gL*(v-Ls/2)^2/Ls)"
    tied=d["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]["n"]
    assert len(tied)==9 and all(row[2]<=1 for row in tied)
    normal_cost=max(Q(row[0]).__ceil__().bit_length()+7*row[1] for row in tied)
    assert normal_cost<128
    assert d["geometry"]["actualGeometryLogRankMaxima"]["originalMonomials"]<64
    source=pinned(a,"forcedSource").decode()
    assert "waveRows=sumStateRows(G,old.waveRows,increment),covariance=exactAngularWaveCovariance" in source
    assert "partner:-row.m,value:C.mul(row.velocity[i],at.get(-row.m).velocity[j])" in source
    assert "f=>f.contributions===162" in source
    assert "velocity:source.mean.stages.moments.velocity,covariance,stress:" in source
    # The native middle has the same regular positive target slots and
    # the same normalization in both modes. The C105 mode-two polynomial
    # uses two Primary inputs and geometry only. On the middle these
    # have the same pole-free regular estimates used by C107 mode one.
    # Its original ordered coefficient recurrence contains no Gaussian
    # assumptions other than the upstream scalar factor. A final
    # multiplication by zeta uses the actual admitted inverse cap 2^185.
    midjoin=d["middleJoin"]
    assert midjoin["regularTargetOrder"]==13 and midjoin["backgroundOrder"]==14
    assert midjoin["regularTargetLogCaps"]["middle"]=="H/2^256"
    assert d["one"]["middleTarget"]["actualRootSlots"]==[32017,32018]
    assert any("2^185" in s for s in d["one"]["sourceBranchRules"])
    mode_two_source=pinned(a,"twoCode").decode()
    assert "rank[0] += raw_coefficient_bits+2*sum(a)+185+32" in mode_two_source
    assert "sum(m for _,m in fields) == 2" in mode_two_source
    assert bm["sourceMonomialCount"]==1270 and bm["sourceScalarCount"]==60
    assert bm["requiredOrdinaryPrimaryVelocityOrder"]==10
    assert not bm["initializedMeanOperandRequired"]
    assert Q(bm["rawMaxRationalCoefficientSum"])==26
    assert all(Q(q["rawBandPower"])<=Q(19,2)+3*sum(q["RZL"][:2]) for q in bm["raw"])
    assert d["frame"]["cutoffOrder"]>=15
    middle_mode_two_rank=max(sum(q["positiveLogRanks"]) for q in two.values())+185+32
    assert middle_mode_two_rank<2**17
    mode_one_rank=max(q["gaugeLogRankInHOver2Pow128"] for q in list(one.values())+list(mid.values()))
    # One uniform forced velocity rank includes the n multiplication,
    # slow/radial curl, native reindex factors in [1/4,4] and at most
    # 2^8 ordinary Leibniz coefficients.
    assert max(mode_one_rank,middle_mode_two_rank)+normal_cost+256<2**18

    # The common derivatives are at fixed v and original label. P is
    # constant in these directions and ≤1. k*n uses up at most the
    # retained inverse carrier; the alternate differentiated curl has
    # one extra slow order or L with the small original radial-fast cost.
    assert (1-Q(K,E))>0 and Q(1,2)>Q(K,E)
    vcap={
        "P":(Q(1,2),Q(1,2),Q(1,4),Q(9,2)),
        "1":(Q(99992,E),Q(1,2),Q(83,4),Q(27,2)),
        "2":(Q(99997,E),Q(1),Q(13),Q(15)),
    }
    combos=[("P","P"),("P","1"),("1","1"),("2","2")]
    rows={}
    for f,dirs in orders["forcedCovarianceSupremumOrders"].items():
        for b in map(tuple,dirs):
            assert b[2]==0
            j=sum(b)
            branches=[]
            for aa,bb in combos:
                x,y=vcap[aa],vcap[bb]
                assert x[1]+y[1]>=1
                branches.append((x[0]+y[0],x[2]+y[2]+3*j,x[3]+y[3]+3*j))
            rows[f,b]=Bound(min(e for e,s,p in branches)*E,
                            max(s for e,s,p in branches),int(max(p for e,s,p in branches)),2**19)
    assert len(rows)==93 and max(q.p for q in rows.values())==54
    assert max(q.s for q in rows.values())==Q(131,2)
    assert min(q.e for q in rows.values())==E
    assert (162*3**2*2*2**8).bit_length()<32
    return rows,{"pairCases":2970,"certifiedDirections":50,"pairedCovarianceOrders":len(rows),
       "pairedFamilies":[list(q) for q in combos],"indices":162,"maxPole":54,"maxBand":"131/2",
       "originalPhysicalPulse":"P<=1 at fixed v and label, original roots #17733391/#17733724",
       "middleModeTwoCoefficientChargeInHOver2Pow128":middle_mode_two_rank,
       "modeTwoMiddleExtension":"Same positive normalized frame and ordered coefficients on the actual piecewise regular middle chart. Remove the finite outer pole and restore the middle zeta with its existing inverse bound.",
       "absoluteBoundsDoNotUseFurtherRadialOrHaarIntegrationByParts":True}


@dataclass(frozen=True)
class Bound:
    e:Q
    s:Q
    p:int
    c:int

    def output(self):
        return {"epsilon":str(Q(self.e,E)),"band":str(self.s),"pole":self.p,"coefficientInHOver2Pow128":self.c}


ZERO=None


def add(*args):
    t=[u for u in args if u is not ZERO]
    if not t:
        return ZERO
    return Bound(min(u.e for u in t),max(u.s for u in t),max(u.p for u in t),max(u.c for u in t)+(len(t)-1).bit_length())


def mul(*args):
    if any(x is ZERO for x in args):
        return ZERO
    return Bound(*(sum(vals) for vals in zip(*[(q.e,q.s,q.p,q.c) for q in args],strict=True)))


def scalar(u,eps=0,rank=0):
    return ZERO if u is ZERO else Bound(u.e+eps,u.s,u.p,u.c+rank)


def sh(a,k,n=1):
    return tuple(j+(n if i==k else 0) for i,j in enumerate(a))


def splits(a):
    for b in product(*(range(j+1) for j in a)):
        yield b,tuple(j-k for j,k in zip(a,b,strict=True)),prod(comb(j,k) for j,k in zip(a,b,strict=True))


def arithmetic(d,orders,old_rows,mean_branches,collar_data,waves,region):
    collar=region in collar_data
    crosstrace=set()
    owntrace=set()
    wave_trace=set()
    compact_trace=set()
    stress_trace=set()
    bg_trace=set()
    for p in (54,48,21):
        assert factorial((p+1)//2).bit_length()<2**8
    width=Q(2)
    u,v,t=Q(1,128),Q(1,32),Q(1,128)
    assert 54*u*u+8*t*(u/(width-t*u))**3<1
    assert 54*v*v+2*t*t*(v/(width-v))**3<4
    assert 128**2+4*32**2==20480 and Q(2,3)*30720==20480
    assert 30720*2**129<2**(4096*510)

    def chi(a):
        crosstrace.add(("chi",a))
        assert sum(a)<=11
        return Bound(0,0,0,1)

    def rho(a):
        crosstrace.add(("rho",a))
        assert sum(a)<=11
        return Bound(0,0,0,1)

    def compact(f,a,always=False):
        compact_trace.add((f,a))
        # h=0 outside the compact source. Forced doesn't update this
        # mean, so its original FiveMap component still gives all Haar.
        if collar and not always:
            return ZERO
        assert (f,(*a,0)) in old_rows,(f,a)
        return Bound(2*E if f=="beta" else E,
                     (Q(7,2) if f=="beta" else Q(1,2))+3*sum(a),0,54920)

    def bkg(f,a):
        bg_trace.add((f,a))
        assert sum(a)<=10
        return Bound(E if f=="b" else 0,0,0,2 if f=="V0" else 1)

    def product_f(f,g,a):
        return add(*(scalar(mul(f(b),g(c)),rank=k.bit_length()) for b,c,k in splits(a)))

    def rw(f,a,power):
        r,z,t=a
        jmax=r if power<0 else min(r,power)
        return add(*(scalar(f((r-i,z,t)),rank=1+comb(r,i).bit_length()) for i in range(jmax+1)))

    def W(f,a):
        wave_trace.add((f,a))
        assert (f,a) in waves,(f,a)
        b=waves[f,a]
        return b if collar else Bound(b.e,b.s,0,b.c+256)

    def quadratic(f,a):
        if collar:
            group,ranks=collar_data[region][1:]
            row=group[f,a]
            return Bound(Q(row["epsilon"])*E,Q(row["band"]),0,ranks)
        assert (f,(*a,0)) in mean_branches,(f,a)
        terms=[]
        for f,i,g,j,k in mean_branches[f,(*a,0)]:
            p,q=old_rows[f,i],old_rows[g,j]
            e=min(Q(p["minEpsilon"])*E,2*E if f=="beta" else E)
            v=min(Q(q["minEpsilon"])*E,2*E if g=="beta" else E)
            bs=max(Q(p["bandIntercept"]),Q(7,2) if f=="beta" else Q(1,2))
            cs=max(Q(q["bandIntercept"]),Q(7,2) if g=="beta" else Q(1,2))
            terms.append(Bound(e+v,bs+cs+3*sum(a),0,2**19+k.bit_length()))
        return add(*terms)

    def C(f,a):
        return add(W(f,a),quadratic(f,a))

    def Tchi(name,a):
        owntrace.add((name,a))
        r,z,t=a
        if collar:
            if r:
                return fields[name]((r-1,z,t))
            m=fields[name](a)
            return ZERO if m is ZERO else Bound(m.e,m.s,max(0,m.p-3),m.c+2)
        # Left ordinary FTC and differentiated whole chi term. Fixed
        # endpoints mean no whole term differentiated in R except chi.
        left=scalar(fields[name](a),rank=2) if not r else fields[name]((r-1,z,t))
        terms=[]
        for i,j,k in product(range(r+1),range(z+1),range(t+1)):
            if i==r:
                w=mul(chi((i,j,k)),scalar(fields[name]((0,z-j,t-k)),rank=2))
                terms.append(scalar(w,rank=(comb(z,j)*comb(t,k)).bit_length()))
        return add(left,*terms)

    def T_rho(a):
        return ZERO if collar else Tchi("rho",a)

    def oldmean(f):
        return lambda a:compact(f,a)

    b=lambda a:bkg("b",a)
    F=lambda a:bkg("V0",a)
    G=lambda a:bkg("G0",a)
    bt=oldmean("beta")
    vv=oldmean("v")
    gg=oldmean("gamma")

    def U(a):
        return add(scalar(product_f(b,bt,a),rank=1),C("rr",a))

    def V(a):
        return add(product_f(b,gg,a),product_f(G,bt,a),C("rz",a))

    def B(a):
        return add(scalar(product_f(F,vv,a),rank=1),C("thetatheta",a))

    def Fp(a):
        return add(U(a),scalar(add(bt(sh(a,0)),rw(bt,a,-1)),eps=E))

    def density(a):
        return add(rw(lambda b:add(U(b),B(b)),a,-1),scalar(V(sh(a,1)),eps=E),
                   scalar(bt(sh(a,2)),eps=E),scalar(bt(sh(a,1,2)),eps=3*E))

    @cache
    def moment_data(z,t):
        # Whole paths need an absolute, unweighted bound on each donor.
        # They are defined only in the complement branch of this calculus.
        assert not collar
        a=(0,z,t)
        P=scalar(density(a),rank=2)
        theta=scalar(rw(lambda q:add(product_f(G,vv,q),product_f(F,gg,q),C("thetaz",q)),a,2),rank=2)
        z_flux=scalar(rw(lambda q:add(scalar(product_f(G,gg,q),rank=1),C("zz",q)),a,1),rank=2)
        z_moment=add(z_flux,scalar(rw(Fp,a,1),rank=2),scalar(rw(density,a,2),rank=3))
        return P,theta,z_moment

    def cRho(a):
        assert a[0]==0
        return scalar(rw(rho,a,2),rank=3)

    def D(name,a):
        assert a[0]==0
        P,Jtheta,Jz=moment_data(a[1],a[2])
        if name=="theta":
            return Jtheta
        return add(Jz,product_f(cRho,lambda b:moment_data(b[1],b[2])[0],a))

    @cache
    def pressure(a):
        p=add(Fp(a),Tchi("pressureDensity",a))
        if not collar:
            def P(b):
                return ZERO if b[0] else moment_data(b[1],b[2])[0]
            p=add(p,product_f(P,T_rho,a))
        return p

    def sourceStress(a):
        stress_trace.add(a)
        assert list(a) in orders["localWeightedRadialFlux"]
        j=sum(a)
        pole=3*j if region=="inner" else 3+3*j if region=="outer" else 0
        return Bound(E,0,pole,1)

    @cache
    def radial(f,a):
        if f=="theta":
            fflux=rw(lambda b:add(product_f(bkg_b,vv,b),product_f(F,bt,b),C("rtheta",b)),a,2)
            viscosity=scalar(add(rw(lambda b:vv(sh(b,0)),a,2),rw(vv,a,1)),eps=E)
        else:
            fflux=rw(V,a,1)
            viscosity=scalar(rw(lambda b:gg(sh(b,0)),a,1),eps=E)
        return add(fflux,viscosity,sourceStress(a))

    def axial(f,a):
        if f=="theta":
            holder=rw(lambda b:add(product_f(G,vv,b),product_f(F,gg,b),C("thetaz",b)),a,2)
            return add(holder,scalar(rw(lambda b:vv(sh(b,1)),a,2),eps=2*E))
        holder=rw(lambda b:add(scalar(product_f(G,gg,b),rank=1),C("zz",b),pressure(b)),a,1)
        return add(holder,scalar(rw(lambda b:gg(sh(b,1)),a,1),eps=2*E))

    def time(f,a):
        return rw(lambda b:compact("v" if f=="theta" else "gamma",sh(b,2)),a,2 if f=="theta" else 1)

    bkg_b=b
    fields={"pressureDensity":density,"rho":rho}
    for f in ("theta","z"):
        fields[f+"Axial"]=lambda a,f=f:axial(f,sh(a,1))
        fields[f+"Time"]=lambda a,f=f:time(f,a)

    def flux(f,a):
        local=radial(f,a)
        t=scalar(Tchi(f+"Time",a),eps=E)
        z=scalar(Tchi(f+"Axial",a),eps=E)
        correction=ZERO
        if not collar:
            def Dz(b):
                return ZERO if b[0] else D(f,sh(b,1))
            correction=scalar(product_f(Dz,T_rho,a),eps=E)
        return add(local,t,z,correction)

    result=[]
    for f in ("theta","z"):
        for a in map(tuple,orders["weightedSigmaSpatialOrders"]):
            out=rw(lambda a:flux(f,a),a,-2 if f=="theta" else -1)
            if not collar:
                # Restore exactly one zeta pointwise on the complement,
                # with one H/2^128 unit paying the dyadic 2^30720.
                out=scalar(out,rank=1)
            result.append({"field":f,"RZT":a,**out.output()})
    return result,{"pressureAndSignedPrimitives":sorted(owntrace),"cutoffAndDensity":sorted(crosstrace),
                   "covariance":sorted(wave_trace),"compactMean":sorted(compact_trace),
                   "localStress":sorted(stress_trace),"background":sorted(bg_trace)}


def main(a):
    code_only={"pressureCode","weightedCode","pulseReadme","twoCode","forcedSource"}
    d={k:json.loads(pinned(a,k)) for k in PINS if k not in code_only}
    orders,old_rows,branches,collar=donors(a,d)
    wcov,wed=waves(a,d,orders)
    regions={}
    for name in ("inner","outer","complement"):
        rows,trace=arithmetic(d,orders,old_rows,branches,collar,wcov,name)
        regions[name]={"rows":rows,"trace":trace}
    rs=[v for area in regions.values() for v in area["rows"]]
    e=min(Q(r["epsilon"]) for r in rs)
    s=max(Q(r["band"]) for r in rs)
    p=max(r["pole"] for r in rs)
    c=max(r["coefficientInHOver2Pow128"] for r in rs)
    assert e==1>=Q(24,25)
    assert s==Q(131,2) and p==48 and c==524590<2**20<2**36
    evidence=pin_native(a,d)
    result={"schema":"MathScope.C108.OriginalEarlySignedSigmaC6/1",
            "status":"VERIFIED_NATIVE_TWO_SIGMA_WEIGHTED_C6_CONDITIONAL_ORIGINAL_ANALYTIC_AND_CHART_PREMISES",
            "pins":PINS,"source":evidence,"SigmaApplications":[22001223,22001224],"incrementalPressureZ":22000443,
            "normalizedBumpRoot":17743730,"normalizedCutoffRoot":17743734,
            "fixedRadialEndpoints":[17743711,17743713],
            "postForcedWaveCovarianceEvidence":wed,
            "oldMeanWeightedCoverage":{"rows":93,"initialPrimaryRoles":437,"highRows":40,"outerBeforeSpareGaussianPole":48},
            "formula":"Signed minus R^-e of (F-F(alpha)-chi*(F(beta)-F(alpha))-epsilon*Tchi W_T+epsilon*Tchi G_Z-epsilon*D_Z*Tchi rho).",
            "pressure":"Fp+Tchi fp-P*Tchi rho with both relative fixed endpoints and P=J(fp). On collars the compact Tchi rho exact zero leaves the two oriented short primitives.",
            "D":"Dtheta=Jtheta; Dz=Jz+cRho*P keeps complete product, and Jz=J(raw axial flux)+J(R Fp)-1/2 J(R² fp).",
            "regions":regions,
            "commonBound":{"retainedGaussian":"zeta","epsilon":str(e),"band":str(s),"pole":p,
                "coefficientInHOver2Pow128":c,"logCap":"H/2^108","requiredC107InputLogCap":"H/2^92","meetsC107LateWavePremise":True},
            "premises":["Original genuine same-reference fixed-label torus/flat joins, admitted real source paths and finite derivative regularity, normalized P and positive Gram on every crossed native chart.",
                        "Original weighted analytic Fourier inverse realizes its inputs on the entire shifted paths. The original Haar Fourier pairing and full pressure rho moment are differentiable on the retained fixed interval.",
                        "Original collar and middle source normalizations and same body early Forced solutions apply to the verified gauge directions. No mode two deformation of the original profile is made."],
            "open":["Post-Signed late waveform and complete K1 energy join", "N7-06/N8-05", "Final jets"],
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS original early Sigma high bound",e,s,p,c)


if __name__=="__main__":
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for k in (*PINS,"goal","artifact","cache","out"):
        p.add_argument("--"+k,type=Path,required=True)
    main(p.parse_args())
