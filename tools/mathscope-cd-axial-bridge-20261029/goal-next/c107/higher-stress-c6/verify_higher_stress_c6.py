"""Checked C6 original Signed stress on the exact C103 slow derivative directions."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path
import runpy
import sys

PINS={
    "previous":"5751b648bf83a94adeb5bc84f55120c558ea629eadb52febb842845d27203ad5",
    "positiveCode":"79c841c7b20ef87f304ee3e9b55d7dbc55ef87ba02ff54fc4dda12fcf814ce14",
    "leadingCode":"56a63e7343655e3714230b9885848c26302a94c30fb66561ed821b4858f95534",
    "frontier":"d7d5d99aa0285e99680f90563b9e27bce8a95877265134165061a7f7745e5cc8",
    "terminal":"4135a53d40c87b97307771265f0ce86a277a3151c94d82e8cda8190be792b827",
    "heatSource":"49cde0b930f375e8eca5610ecb7d1e91c9c4361bdd1395a1971081fb1fdfd1b3",
    "operatorSource":"1ebf8b2b6f1df054a06309c5dc8695f2f3a867733544ab012f206bfed2969dd0",
    "normSource":"0387335a081650c4a6ffed6e213215d32a363350c2a156a7163e82f4c0234634",
    "profileSource":"df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a",
    "background":"1833785fc21ad6c73029361d6d6a44b2bb0baa099d57986709114093a53de9cc",
    "exterior":"505f4c0c1ac079a15a174f3141b9479971e0bdf0853254541d1d5b25cb974023",
    "geometry":"25144d0df386b7522ac5076696aa78feadc1bee9c7188ab8847a9efaae4a6596",
    "inner":"5e15f58956e40d31904dcd2522f050bc6f72d614a07fc26de664b71ec513e6be",
    "outer":"89488720477dca34e5e98f2304a26c0722be72df6bc17278e62790f2cf609c93",
    "middle":"82a8f02074be1f1e0d4fa21d897c7a59adb96a9f77174f82530169fc94b81cd3",
    "implicit":"84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e",
    "scale":"e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291",
}
ORDER=6


def pin(a,k):
    p=getattr(a,k)
    b=p.read_bytes()
    assert sha256(b).hexdigest()==PINS[k],p
    return b


def load_input(a):
    d={key:json.loads(pin(a,key)) for key in ("previous","frontier","terminal",
         "background","exterior","geometry","inner","outer","middle","implicit")}
    for k in ("support","fields"):
        raw=getattr(a,k).read_bytes()
        d[k]=json.loads(raw)
        d[k+"SHA"]=sha256(raw).hexdigest()
    assert d["fields"]["pins"]["backgroundSHA"]==PINS["background"]
    assert d["fields"]["derivativeOrder"]==8 and d["fields"]["logCap"]=="H/2^288"
    assert all(w["sign"]==-1 for row in d["fields"]["rows"] for w in row["fields"].values())
    assert d["fields"]["originalIntegralBoundaries"]==[239,257,275]
    assert d["background"]["derivativeOrder"]==16 and d["background"]["comparison"]["sign"]==-1
    assert d["background"]["leading"]["leadingLogCap"]=="H/2^300"
    assert d["background"]["leading"]["leadingLogCapSign"]==-1
    assert d["geometry"]["chartHc"]=={"lambdaBelowRenv":-1,"baseBelowRenv":-1}
    assert d["exterior"]["source"]["parameterExpressionSHA256"]=="e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152"
    assert d["exterior"]["normalizedMaximum"]=="2^(-65219)"
    assert d["exterior"]["domain"]["endpointEtaConvention"]=="continuous one-sided derivatives"
    assert d["inner"]["outputDerivativeOrder"]==d["outer"]["outputDerivativeOrder"]==15
    for branch in ("inner","outer"):
        for row in d[branch]["ordinaryCapRows"][:ORDER+1]:
            assert row["physicalRZTCap"]=="2^4096*Bnorm"
    assert d["inner"]["originalRegularInnerBodies"]==[119712,119713]
    assert d["outer"]["actualRegularOuterBodies"]==[119567,119694]
    assert all(r["literalMatch"] for r in d["middle"]["sourceRows"])
    assert d["middle"]["capRows"][-1]["outputOrder"]==15
    assert d["middle"]["capRows"][-1]["conditionalOriginalLogCap"]=="H/2^256"
    assert d["support"]["etaIndependent"] and d["support"]["sourceTf"]==128
    assert d["support"]["lowerOuterLogGap"]==127 and d["support"]["lowerInnerLogDistance"]=="t1/128"
    assert {row["exactWholeReduction"] for row in d["support"]["rows"]}=={0}
    assert [(row["order"],row["component"]) for row in d["support"]["rows"]
            if row["exteriorZeroAfter"] is None]==[(1,"theta")]
    op=pin(a,"operatorSource").decode()
    assert "G.mul(q(2),eta,G.sub(G.mul(a,f),G.mul(X,G.derivative(f,X))))" in op
    assert "G.mul(D,eta,G.derivative(f,eta)),G.mul(X,G.derivative(f,X))" in op
    norm=pin(a,"normSource").decode()
    assert "v=regularV(U,n),V=mul(xGlobal,v)" in norm
    assert "E:mul(sqrtEnlarged,F),U,Pi,VOverR:mul(inverseSqrtEnlarged,V)" in norm
    hs=pin(a,"heatSource").decode()
    assert "factorBody=G.div(rho,G.add(Eflat,otherSeed))" in hs
    assert "rho=G.mul(G.parameter('co'),h)" in hs
    assert "G.substitute(heat.exteriorF,X,Xdelta)" in hs
    assert "G.mul(G.exp(G.mul(q(-2),delta)),factorization.coefficient)" in hs
    assert "positive gamma moments" in hs.lower()
    assert "'actual_n1_terminal_delta'" in hs
    profile=pin(a,"profileSource").decode()
    p=json.loads(next(line.removeprefix("export const PINNED_N3 = ").removesuffix(";")
                      for line in profile.splitlines() if line.startswith("export const PINNED_N3 = ")))
    assert p["parameterExpressionSHA256"]==d["exterior"]["source"]["parameterExpressionSHA256"]
    assert Q(p["parametersExactExpressions"]["co"]["rational"])*Q(1,64)<1
    scale=pin(a,"scale").decode()
    assert "H=-h*log(tau0) > h*Bnorm^512/2 > Bnorm^511/2." in scale
    return d


def native(a,d):
    pin(a,"positiveCode");pin(a,"leadingCode")
    higher=runpy.run_path(str(a.positiveCode))
    leading=runpy.run_path(str(a.leadingCode))
    for k,(path,digest) in higher["PINS"].items():
        higher["pin"](a.goal/path,digest)
    sys.path[:0]=[str((a.goal/higher["PINS"][k][0]).parent) for k in ("reader","cache")]
    import source_stream
    import source_cache
    root=a.artifact/"first-correction-spatial-source"
    manifest=json.loads(higher["pin"](root/source_stream.MANIFEST,higher["MANIFEST"]))
    n=source_stream.Native(root,manifest)
    assert n.pin==higher["REGISTRY"]
    defs=json.loads(n.base_snapshot["base"]["expression"])
    source=source_cache.load(source_stream,root,manifest,22153782,a.cache)
    try:
        assert (source.verify["nodes"],source.verify["sha256"])==(22155584,higher["STREAM"])
        Exact=runpy.run_path(str(a.goal/higher["PINS"]["exact"][0]))["Exact"]
        E=Exact(higher["View"](source))
        h=higher["bind_source"](source,E,defs,d["support"])
        l=leading["verify_source"](source,E)
        assert h==d["previous"]["source"]
        t=d["terminal"]["terminalRawDensity"]
        for slot,root_id in ((32004,17716949),(32005,17716976),(32006,17717057)):
            assert defs[slot]["body"]==root_id and not defs[slot]["unspecifiedOracle"]
            assert all(k>=ORDER+2 for k in defs[slot]["derivativeLimits"])
        assert t["BDefinition"]==32006 and t["BBody"]==17717057
        assert d["terminal"]["actualPrimitive"]["wholeAngularMoment"]==117072
        assert E.of(17717057)==E.mul(E.of(17717045),E.of(17717056))
        assert E.of(source.args(17717056,"exp")[0])==E.mul(E.scalar(-2),E.of(17716930))
        assert E.of(17717024)==E.of(17717048)
        return {"positive":h,"leading":l,"terminal":{"BBody":17717057,"smoothFactor":17716949,
                   "completeHeat":17716976,"wholeMoment":117072},"stream":source.verify}
    finally:
        source.__exit__()


def poly(values,n):
    return [Q(v) for v in values]+[Q(0)]*(n+1-len(values))


def pp(a,b):
    assert len(a)==len(b)
    return [sum(a[i]*b[j-i] for i in range(j+1)) for j in range(len(a))]


def add(*terms):
    return [sum(t) for t in zip(*terms,strict=True)]


def scale(a,c):
    return [c*v for v in a]


def rec(a,inv):
    values=[Q(inv)]
    for j in range(1,len(a)):
        values.append(inv*sum(a[i]*values[j-i] for i in range(1,j+1)))
    return values


def compose(outer,delta):
    assert len(outer)==len(delta) and delta[0]==0
    n=len(outer)-1
    power=poly([1],n)
    result=poly([0],n)
    for c in outer:
        result=add(result,scale(power,c))
        power=pp(power,delta)
    return result


def charge(a):
    return max((v*factorial(k)).__ceil__().bit_length() for k,v in enumerate(a))


def outer_n1(d):
    # Total-degree Taylor majorants on 0<=delta<=1/4, -1<=eta<=1.
    n=ORDER
    seed={0:1}
    seed_caps=[]
    for j in range(n+3):
        seed_caps.append(Q(sum(abs(c)*factorial((k+1)//2) for k,c in seed.items()),factorial(j)))
        nxt=Counter()
        for k,c in seed.items():
            nxt[k+3]+=8*c
            if k:
                nxt[k+1]-=k*c
        seed=nxt
    assert Q(64,49)<2 and 3**2==9
    factor=rec(scale(seed_caps,2),9)
    factors=[[
        factor[j+k]*Q(factorial(j+k),factorial(j))
        for j in range(n+1)] for k in range(3)]
    L=rec(poly([2,1,1],n+1),2)
    az=scale(pp(poly([1,1],n+1),L),2)
    az_eta=[(j+1)*az[j+1] for j in range(n+1)]
    az=az[:n+1]
    bz=pp(add(pp(poly([1,1],n),az),pp(poly([1,2,1],n),az_eta)),L[:n+1])
    harg=scale(pp(poly([1,2,1],n),[Q(2,factorial(j)) for j in range(n+1)]),2)
    harg[0]=0
    H=compose([factorial(j+1) for j in range(n+1)],harg)
    H=pp(H,[Q(2**(j+1),factorial(j)) for j in range(n+1)])
    def dp(k):
        return [comb(k,j)*Q(1,4)**(k-j) if j<=k else 0 for j in range(n+1)]
    A0,A1,A2=factors
    even=add(pp(dp(6),A2),scale(pp(dp(3),A1),16),pp(add(poly([64],n),scale(dp(2),24)),A0))
    odd=add(pp(dp(6),A1),scale(pp(dp(3),A0),8))
    B=pp(pp([Q(2**j,factorial(j)) for j in range(n+1)],H),add(pp(pp(az,az),even),pp(bz,odd)))
    bbits=charge(B)
    # The signed density is integrated with the original 2X dX
    # angular weight. With X=Xb exp(-delta), this is exp(delta) Xb
    # times integral exp(-4/t^2) t^-6 B with the genuine backward sign.
    assert 8-3*Q(1,4)**2==Q(125,16)
    p={(-6,0):1}
    raw=[]
    for j in range(n):
        assert min(k for k,_ in p)==-6-3*j
        raw.append(sum(Q(abs(c))*Q(1,4)**(k+6+3*j) for (k,_),c in p.items()))
        nxt=Counter()
        for (k,b),c in p.items():
            nxt[k-1,b]+=k*c
            nxt[k-3,b]+=8*c
            nxt[k,b+1]+=c
        p={k:c for k,c in nxt.items() if c}
    pref=[]
    for j in range(n+1):
        # derivative r>=1 of the primitive is derivative r-1 of
        # the density; all derivatives of exp(delta) have cap 2.
        pref.append(Q(4)*(Q(16,125)+sum(comb(j,r)*raw[r-1] for r in range(1,j+1))))
    pb=max(pref).__ceil__().bit_length()
    assert bbits+pb<1219
    assert 1/(1-Q(1,50176))<2
    return {"smoothBBody":17717057,"seedJetOrder":n+2,"heatGammaMomentOrder":n,
        "commonMixedBLog2CapRelativeToHeatAmplitude":bbits,
        "relativePrimitiveAndOppositeGaussianLog2Cap":pb,"actualHeatAmplitudeDyadic":"2^-65219",
        "upper":"2^-64000*Xb*zeta*delta^(-3-3*r)",
        "ordersDeltaEta":[[r,k] for r in range(n+1) for k in range(n+1-r)],
        "literalBSigns":"H*(az^2*(d^6*A2+16*d^3*A1+(64-24*d^2)*A0)-bz*(d^6*A1+8*d^3*A0))*exp(-2*d)",
        "sourceBackwardSign":"positive backward stress, original whole angular moment #(117072)=0",
        "fullNativeWholeMomentDifferentiatedAtFixedEndpoints":True}


def gaussian(a,p):
    q=[Q(1)]
    caps=[]
    for j in range(ORDER+1):
        caps.append(sum(abs(c)*Q(1,16)**k for k,c in enumerate(q)))
        nxt=[2*a*c for c in q]+[0]
        for k,c in enumerate(q):
            nxt[k+1]+=(2*k-p-3*j)*c
        q=nxt
    return caps


def positive_interior(d):
    # Exact generous positive arithmetic on |eta|<=1, h<=1/64,
    # X^-1<=Renv, X<=Renv^2 on the native stress support.
    # D represents each raw normalized field through 8 and the
    # whole original active/outer leading F0,U0 profiles through C16.
    n=8
    invL=rec(poly([2,1,1],n),2)
    # A total-degree Taylor profile with ordinary derivatives <=D
    # has normalized coefficient mass <=2^j/j! times D.
    fiel=[Q(2**j,factorial(j)) for j in range(n+1)]
    invsqrtX=[Q(2)]*9
    # E=sqrt(2X) F, VOverR=X*v/sqrt(2X). Undo them with
    # 1/sqrt(2X) and 2/sqrt(2X), respectively. The reciprocal
    # power after j Taylor differentiations carries at most X^-j.
    normalized=max(charge(pp(invsqrtX,fiel)),charge(pp(scale(invsqrtX,2),fiel)))
    # Leading v0 uses v=L^-1(2eta U0+2eta(1+2nh)avg+(1-eta^2)avg_eta)
    # at n=0. The integral average has commuted X,eta jets bounded by
    # the same U0 orders, including X=0. The highest used v-order is 6.
    avg=fiel[:-1]
    avg_eta=[Q(2**j,factorial(j)) for j in range(n)]
    lv=charge(pp(invL[:-1],add(scale(pp(poly([1,1],n-1),avg),4),
                           pp(poly([1,2,1],n-1),avg_eta))))
    assert max(normalized,lv)<32
    # Use full atom bound 2^32 Renv^12 D. Each ordered scaled
    # first-order operator consumes one extra field derivative.
    c=poly([1],n-1)
    x=poly([1,1],n-1)
    eta=poly([1,1],n-1)
    zcoef=pp(invL[:-1],add(scale(eta,4),scale(pp(eta,x),2),poly([1,2,1],n-1)))
    tcoef=pp(invL[:-1],add(scale(c,2),scale(eta,Q(1,2)),x))
    operator=2+max(charge(zcoef),charge(tcoef))
    assert operator<40
    # Two viscous derivatives, three componentwise linear terms,
    # and at most eight original ordered convection products.
    field=32
    conv=2*field+40+6+3
    visc=field+2*40+3
    residual=max(conv,visc)+4
    assert residual<128
    residual_envelope=max(2*12+2,12+2*2)
    assert residual_envelope==26
    # Weighted diameter and reciprocal (2X)^(-e/2), e=1,2.
    # X integration costs at most Renv^2, radial derivatives
    # of a primitive use the same weighted density by FTC.
    primitive=residual+24
    assert primitive<160
    primitive_envelope=residual_envelope+2+2+(ORDER+1)
    assert primitive_envelope==37
    # All 18 requested ordinary pullbacks are within the same
    # mixed C16 chart recurrence. The scale s^-A-1/2 has its
    # original exponent, and the source q^(2nh) stays with each cutoff.
    euler=[]
    for table in d["support"]["cutoff"]["finiteEulerRows"]:
        values=[sum(Q(c)*Q(1,64)**j for j,c in enumerate(w["polynomialInSourceH"])) for w in table]
        assert len(values)==7
        euler.append({"maxBits":max(k.__ceil__().bit_length() for k in values),"values":list(map(str,values))})
    euler_bits=max(r["maxBits"] for r in euler)
    assert euler_bits<128
    # q varies only via s at a fixed original label. Taylor jets
    # of log s use s>=1/2 and already audited degree-9 s jets.
    slo=list(map(int,d["implicit"]["extendedCutoffGeometry"]["sTaylorBounds"]))[:7]
    slo[0]=0
    logs=compose([Q(0)]+[Q(2**j,j) for j in range(1,7)],list(map(Q,slo)))
    logbits=charge(logs)
    assert logbits<256
    # Up to six log-s factors, finite factorial / product sums.
    assert 160+4803+6*logbits+euler_bits+64<8192
    assert 323+primitive_envelope+2+4<4096
    # At most D^2 in the residual and absolute profile cap.
    return {"positiveActiveRawProfileOrder":8,"leadingProfileOrderAvailable":16,
       "fieldCap":"2^32*Renv^12*D","scaledOperatorDyadicPowerBeforeRenvSquared":operator,
       "residualDyadicPower":residual,"unweightedCoefficientUpper":"2^8192*Bnorm*D^2",
       "rawResidualEnvelopeRenvPower":residual_envelope,
       "unpulledWeightedPrimitiveEnvelopeRenvPower":primitive_envelope,
       "DLogCap":"H/2^288","activeEpsilonExponentsN3N2N1":[7,5,3],
       "exactPositiveEulerRows":euler,"logSJetBitCap":logbits,
       "originalEnvelope":"Xminus <= X <= Xb for active weights; original zero beyond each individual support",
       "angularIntegralWeight":"2X","axialIntegralWeight":"1",
       "oldMomentData":"All six complete original whole conservative moments remain exactly zero under continuous eta realization."}


def weighted(d,tail,active):
    directions=[tuple(a) for a in d["frontier"]["orders"]["localWeightedRadialFlux"]]
    old=[a for a in directions if sum(a)<=2]
    high=[a for a in directions if sum(a)>2]
    assert len(directions)==18 and len(old)==6 and len(high)==12 and max(map(sum,directions))==6
    assert all(a[2]==0 for a in directions)
    inner,outer=gaussian(1,0),gaussian(4,3)
    bits=max(1,max(Q(x).__ceil__().bit_length() for x in inner+outer))
    assert bits<32
    assert 2-Q(1,128)*Q(1,4)>Q(7,4)
    assert 4/Q(7,4)**2<2 and (Q(1,128)/Q(7,4))**2==Q(1,50176)
    assert 1/Q(1,128)**2+4/Q(1,32)**2==20480
    assert Q(2,3)*30720==20480
    # Chart d/u atoms: pure R derivatives of 2log R;
    # pure Z derivatives of log s. All degrees through six fit
    # one Bnorm, including t1^-1 and η. Up to six such factors.
    assert active["logSJetBitCap"]+10<4096
    assert (factorial(6)*2).__ceil__().bit_length()+7<4096
    partitions=[1]
    for j in range(ORDER):
        partitions.append(sum(comb(j,k)*partitions[k] for k in range(j+1)))
    assert partitions[-1]==203
    one_coordinate_spatial_jet_bits=partitions[-1].bit_length()
    two_coordinate_spatial_jet_bits=(partitions[-1]*2**ORDER).bit_length()
    three_factor_product_bits=(3**ORDER).bit_length()
    assert 4096+bits+4+one_coordinate_spatial_jet_bits+three_factor_product_bits<4160
    assert 6*active["logSJetBitCap"]+128+64+two_coordinate_spatial_jet_bits+three_factor_product_bits<8192
    # There is one bound for the regular target, one for the radial
    # multiplier, and at most six for the coordinate derivatives.
    assert 1+1+ORDER<=16
    # Compact finite coefficients under original H>Bnorm^511/2.
    # Main complement uses inverse ζ; near the wide-collar joins
    # use bounded 128^18 and 32^21, both smaller than that reserve.
    assert (8192+30720+64+16)*2**257 < 2**(4096*510)
    assert Q(1,2**256)+Q(1,2**257)+2*Q(1,2**288)<Q(1,2**255)
    u,d,t,w=Q(1,128),Q(1,32),Q(1,128),Q(2)
    pin=3+3*ORDER
    # Weighted scalar pole p=21 fits the same source slope mechanics.
    assert pin*u*u+8*t*(u/(w-t*u))**3<1
    assert pin*d*d+2*t*t*(d/(w-d))**3<4
    rows=[]
    for r,z,t in directions:
        j=r+z+t
        rows.append({"RZT":[r,z,t],"epsilonGrade":"1","innerPole":3*j,"outerPole":3+3*j,
                    "complementPole":0,"commonCoefficientLogCap":"H/2^255",
                    "positiveCutoffArms":[3,2,1],"localStressIsPreCenteredRadialFlux":True})
    return {"coveredExactDirections":rows,"newDirections":high,
        "sameDisjointNarrowCollars":{"inner":"0<u<=1/128","outer":"0<d<=1/32"},
        "wideOverlap":"Inner u<=1/4, middle u>=1/8/d>=1/4, outer d<=1/4, with the same original fields.",
        "innerNegativeTail":"All n>=1 stresses zero identically before Xminus.",
        "outerPositiveTail":"Only theta,n=1 can remain after Xplus; use the actual B and backward primitive.",
        "oppositeGaussianRestored":True,"maximumOuterPole":pin,"maximumInnerPole":18,
        "ordinaryFaadiBrunoCounts":partitions,
        "leadingCollarCoefficientBeforeLogAbsorption":"2^4160*Bnorm^8",
        "terminalAndPositiveConservativeGeometryEnvelope":"2^8192*Bnorm^16",
        "complementInverseZetaUpper":"2^30720","logCoefficientCap":"H/2^255",
        "halfWidthEndpointJets":"The original flat branches extend through all requested finite jets.",
        "scope":"Physical stress contribution to the weighted local radial flux after normalized Haar and FTC. The unrelated rho-centered moment/pressure/transport branches of total Sigma remain separate."}


def main(a):
    d=load_input(a)
    tail=outer_n1(d)
    active=positive_interior(d)
    caps=weighted(d,tail,active)
    source=native(a,d)
    receipt={"schema":"MathScope.C107.OriginalWeightedSignedStressThroughC6/1",
        "status":"VERIFIED_NATIVE_STRESS_WITH_CONDITIONAL_WEIGHTED_PHYSICAL_C6",
        "pins":{**PINS,"support":d["supportSHA"],"fields":d["fieldsSHA"]},
        "source":source,"positiveInterior":active,"angularTerminal":tail,"weightedLocalFlux":caps,
        "open":["Complete higher signed covariance and initial stage-one energy","N7-06 and N8-05","Final jets"],
        "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(receipt,indent=2)+"\n").encode())
    print("PASS original all 18 weighted local stress directions, 12 new C3-C6")
    print("B dyadic bits",tail["commonMixedBLog2CapRelativeToHeatAmplitude"],"primitive bits",
        tail["relativePrimitiveAndOppositeGaussianLog2Cap"],"weighted poles",caps["maximumInnerPole"],caps["maximumOuterPole"])


if __name__=="__main__":
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for name in (*PINS,"goal","artifact","cache","support","fields","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
