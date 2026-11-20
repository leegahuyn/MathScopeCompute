"""Conditional absolute norm transfer for the actual late Temporal and FiveMap K1 terms."""
from argparse import ArgumentParser
from collections import Counter, namedtuple
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
import json
from math import comb, prod
from pathlib import Path

PINS={
    "late":"1e6bea833b88a440caefeccb59ad58466e06b8f9ae95d0d699e7f44172c09e5b",
    "old":"c6f1aaf7d81c4810c5d72671357eacf7caf7f50904fe6e4a62582b6ee29f1cb8",
    "bg":"95155cca443e1a62c0cbc6234a24ba7f8180bac15003e70c46d035309b96c18b",
    "radialB":"4dad32cb7f509b0fbb10590bc4dccd0c12f833ab5cf7bc2307c5040eac16d6b8",
    "compact":"84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e",
    "energy":"1fa33500726728505f74ed51aae5e113f4c10c452c5faa7a4f823d5a6d2d6a36",
    "lean":"0cb7cfef4f66265cf0022131e17a5da4eb4360d76c4e565b83929d56c079113e",
    "sourceFull":"2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76",
    "ingress":"20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f",
}
NORM=namedtuple("Norm",("e","s","m","c"))
EPS=100000
K=1
ABSOLUTE_POST_SIGNED_W_EPSILON=90000
RAW_POST_SIGNED_W_BAND=128
RAW_POST_SIGNED_W_LOG_COST=2**28


def pin(a,key):
    p=getattr(a,key)
    raw=p.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],p
    return raw


def scale(u,*,e=0,s=0,m=1,c=0):
    return NORM(u.e+e,u.s+s,u.m*m,u.c+c)


def add(*terms):
    return NORM(min(u.e for u in terms),max(u.s for u in terms),
                sum(u.m for u in terms),max(u.c for u in terms))


def mul(*terms):
    return NORM(sum(u.e for u in terms),sum(u.s for u in terms),
                prod(u.m for u in terms),sum(u.c for u in terms))


def shift(a,j,n=1):
    return tuple(x+(n if i==j else 0) for i,x in enumerate(a))


def subtract(a,b):
    return tuple(x-y for x,y in zip(a,b,strict=True))


def leibniz(a):
    for b in product(*(range(x+1) for x in a)):
        yield b,subtract(a,b),prod(comb(x,y) for x,y in zip(a,b,strict=True))


def encode(u):
    mass_bits=u.m.__ceil__().bit_length()
    return {"epsilon":str(Q(u.e,EPS)),"band":str(u.s),
            "coefficientMass":str(u.m),"totalCoefficientChargeInHOver2Pow128":u.c+mass_bits}


def verify_sources(a):
    eq=pin(a,"sourceFull").decode()
    for text in (
        "time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))",
        "G.neg(De(G.add(G.mul(q(2),b,beta),G.pow(beta,2),W.rr),1))",
        "G.neg(Dz(G.add(G.mul(b,gamma),G.mul(G0,beta),G.mul(beta,gamma),W.rz)))",
        "G.div(G.add(G.mul(q(2),V,v),G.pow(v,2),W.thetatheta),R)",
        "G.mul(epsilon,lapVector(beta))",
        "De(G.add(G.mul(b,v),G.mul(beta,V),G.mul(beta,v),W.rtheta),2)",
        "De(G.add(G.mul(b,gamma),G.mul(beta,G0),G.mul(beta,gamma),W.rz),1)",
        "Dz(G.add(G.mul(G0,v),G.mul(V,gamma),G.mul(gamma,v),W.thetaz))",
        "Dz(G.add(G.mul(q(2),G0,gamma),G.pow(gamma,2),W.zz,pressure))",
        "G.neg(De(stress[0],2))","G.neg(De(stress[1],1))",
    ):
        assert text in eq,text
    d={n:json.loads(pin(a,n)) for n in ("late","old","bg","radialB","compact","energy","lean","ingress")}
    late=d["late"]
    assert late["source"]["latePsi"]==22150943 and late["source"]["lateFivePsi"]==22151952
    assert late["source"]["directSwirlSum"]==22154876
    assert late["source"]["centeredSource"]==[22032006,22032008]
    assert late["source"]["freshPostLateTemporalMoments"]==[22151513,22151576,22151635]
    assert d["ingress"]["input"]["meanPotentials"]==[22150943,22151952]
    assert d["ingress"]["input"]["directSwirl"]==22154876
    assert d["ingress"]["physicalMultipliers"]["A"]=="Q^(1/2-A)"
    assert d["ingress"]["physicalMultipliers"]["U"]=="Q^(-A)"
    assert {r["multiplier"] for r in d["ingress"]["spatialJetAtoms"] if r["label"]=="b@0,0,0"}=={"Q^(-A-1/2)"}
    assert d["bg"]["derivativeOrder"]==14 and d["bg"]["comparison"]["sign"]==-1
    assert d["radialB"]["originalLiveSlabThresholdComparison"]==-1
    assert d["radialB"]["normalizedB"].startswith("b/epsilon=s^(-1/2)")
    assert d["radialB"]["analyticSourceConditionsRetained"] and len(d["radialB"]["profileRoots"])==4
    assert d["old"]["covarianceAndCoefficientBudget"]["fullInitializedMeanCoefficientLogCap"]=="H/2^112"
    assert d["old"]["counts"]["old"]==223
    stage=d["energy"]["stages"][0]["requiredWeightedPhysicalNorms"]
    assert stage["A_orders"]==[0,1,2] and stage["Bvector_orders"]==[0,1]
    assert stage["A_weight"]=="q^(A-1/2-j*h/10+r*sx)"
    assert stage["Bvector_weight"]=="q^(A-j*h/10+r*sx)"
    assert d["lean"]["conclusion"]=="success" and d["lean"]["run"]==44641150504
    compact=d["compact"]["compactFiveMap"]
    assert compact["compactZeroOnBothSourceCollars"] and compact["compactIndependentOfL"]
    assert compact["motionOfSRetained"] and compact["finiteScalarCoefficientBits"]==1512
    return d


def cartesian(raw):
    # Polynomial key: sin, cos, inverse R, a, a', derivative R,Z,L,
    # explicit epsilon exponent of D_z. Coefficients are ordinary integers.
    def entry(u,i,n=1):
        return shift(u,i,n)

    def differentiate(polynomial,x):
        out=Counter()
        def put(k,c):
            if c:
                out[k]+=c
        for k,c in polynomial.items():
            s,t,inv,a,ar,r,z,l,e=k
            if x==2:
                put(entry(entry(k,6),8),c)
                continue
            kR=entry(k,1 if x==0 else 0)
            put(entry(kR,5),c)
            put(entry(entry(kR,3),7),c)
            if inv:
                put(entry(kR,2),-inv*c)
            if a:
                put(entry(entry(kR,3,-1),4),a*c)
            # The input is already axisymmetric in the native Y lift.
            kTheta=entry(entry(k,0 if x==0 else 1),2)
            sign=-1 if x==0 else 1
            if s:
                put(entry(entry(kTheta,0,-1),1),sign*s*c)
            if t:
                put(entry(entry(kTheta,1,-1),0),-sign*t*c)
        return {k:c for k,c in out.items() if c}

    available={name:{(r,z,l) for f,(r,z,_,l),_ in raw if f==name}
               for name in ("A_T","A_F","B_sum")}
    rows=[]
    for name in ("A_T","A_F","B_sum"):
        for comp in range(3):
            k=(int(comp==0),int(comp==1),0,0,0,0,0,0,0)
            base={} if comp==2 else {k:(-1 if comp==0 else 1)}
            cap=1 if name=="B_sum" else 2
            for r in range(cap+1):
                for q in product(range(3),repeat=r):
                    terms=base
                    for x in q:
                        terms=differentiate(terms,x)
                    assert all(k[5:8] in available[name] for k in terms)
                    cost=max((k[3]+k[4] for k in terms),default=0)
                    geom=max((sum(k[2:5]) for k in terms),default=0)
                    coeff=sum(abs(c) for c in terms.values())
                    assert cost<=r and geom<=r
                    rows.append({"field":name,"component":comp,"CartWord":q,
                              "termCount":len(terms),"coefficientMass":coeff,
                              "radialFastFactors":cost,"geometryFactors":geom})
    return rows


def calculus(d):
    census=d["late"]["demand"]
    allowed_W={(f,tuple(a)) for f,a in census["postSignedCovarianceOrders"]}
    allowed_old={(f,tuple(a)) for f,a in census["initialMeanOrdinaryInputOrders"]}
    cutoff=set()
    waveseen=set()
    oldseen=set()
    compact_oldseen=set()
    bgseen=set()
    primitive=set()
    forcing=set()
    zero=NORM(10*EPS,0,0,0)
    old_data=d["old"]
    old_charges=old_data["covarianceAndCoefficientBudget"]["coefficientChargeInHOver2Pow128"]

    def W(f,a):
        waveseen.add((f,a))
        assert (f,a) in allowed_W,(f,a)
        return NORM(ABSOLUTE_POST_SIGNED_W_EPSILON-K,0,1,0)

    def old(f,a,compact=False):
        assert (f,a) in allowed_old,(f,a,compact)
        if compact:
            assert not a[3]
            compact_oldseen.add((f,a))
            e=2*EPS if f=="beta" else EPS
            s=Q(7,2) if f=="beta" else Q(1,2)
        else:
            e=Q(old_data["directMinEpsilon"][f])*EPS
            s=Q(old_data["directMaxBandIntercept"][f])
            oldseen.add((f,a))
        return NORM(int(e),s+3*sum(a[:3]),1,old_charges)

    def background(f,a):
        if a[3]:
            return zero
        bgseen.add((f,a))
        assert sum(a[:3])<=5,(f,a)
        # b/epsilon and F,G each fit the original live growth gate.
        # V=R F adds one radius coefficient.
        return NORM(EPS if f=="b" else 0,0,1,2 if f=="V" else 1)

    def product_field(f,g,a):
        return add(*(scale(mul(f(b),g(k)),m=c) for b,k,c in leibniz(a)))

    def rad_weight(f,a,power):
        r,z,t,l=a
        ordermax=r if power<0 else min(r,power)
        # Integer coefficients of the R powers or their inverses are
        # bounded by a single Bnorm charge on the admitted annulus.
        return add(*(scale(f((r-i,z,t,l)),m=comb(r,i),c=1) for i in range(ordermax+1)))

    def a_product(f,a,power=1):
        r,z,t,l=a
        if power==1:
            return add(*(scale(f((r-i,z,t,l)),e=-K,m=comb(r,i),c=1) for i in range(r+1)))
        return a_product(lambda b:a_product(f,b,power-1),a)

    def radial(f,a):
        return add(f(shift(a,0)),a_product(lambda b:f(shift(b,3)),a))

    def De(f,a,e):
        return add(radial(f,a),scale(rad_weight(f,a,-1),m=e))

    @cache
    def primitive_part(name,a,whole):
        primitive.add((name,a,whole))
        r,z,t,l=a
        if not r:
            return scale(fields[name](a),c=1)
        terms=[scale(primitive_part(name,(r-i-1,z,t,l+1),whole),e=-K,m=comb(r-1,i),c=1)
               for i in range(r)]
        if not whole:
            terms.append(fields[name]((r-1,z,t,l)))
        return add(*terms)

    def cutoff_whole(name,a,additional_r=0):
        r,z,t,l=a
        terms=[]
        for i,j,k in product(range(r+1),range(z+1),range(t+1)):
            c=(i+additional_r,j,k)
            cutoff.add(c)
            terms.append(scale(primitive_part(name,(r-i,z-j,t-k,l),True),
                               m=comb(r,i)*comb(z,j)*comb(t,k),c=int(any(c))))
        return add(*terms)

    def Tchi(name,a):
        return add(primitive_part(name,a,False),cutoff_whole(name,a))

    def lap(f,a,is_vector):
        # The radial Cartesian operator is D_r^2+R^-1 D_r; the
        # centrifugal vector connection is retained separately.
        base=add(radial(lambda b:radial(f,b),a),
                 rad_weight(lambda b:radial(f,b),a,-1),
                 scale(f(shift(a,1,2)),e=2*EPS))
        return add(base,rad_weight(f,a,-2)) if is_vector else base

    beta=lambda a:old("beta",a)
    v=lambda a:old("v",a)
    gamma=lambda a:old("gamma",a)
    b=lambda a:background("b",a)
    V=lambda a:background("V",a)
    G=lambda a:background("G",a)

    def U(a):
        return add(scale(product_field(b,beta,a),m=2),product_field(beta,beta,a),W("rr",a))

    def Zflux(a):
        return add(product_field(b,gamma,a),product_field(G,beta,a),
                   product_field(beta,gamma,a),W("rz",a))

    def Bflux(a):
        return add(scale(product_field(V,v,a),m=2),product_field(v,v,a),W("thetatheta",a))

    @cache
    def p_density(a):
        return add(rad_weight(U,a,-1),rad_weight(Bflux,a,-1),
                   scale(Zflux(shift(a,1)),e=EPS),scale(beta(shift(a,2)),e=EPS),
                   scale(beta(shift(a,1,2)),e=3*EPS))

    def p_far(a):
        # D_r of the translated pressure flux is integrated exactly;
        # flat boundary values of the original flux are kept as premises.
        z=shift(a,1)
        radial_visc=scale(De(beta,z,1),e=EPS)
        return add(U(z),radial_visc,Tchi("pressureDensity",z))

    def flux(f,a,radial_branch):
        if f=="theta" and radial_branch:
            return add(product_field(b,v,a),product_field(beta,V,a),product_field(beta,v,a),W("rtheta",a))
        if f=="theta":
            return add(product_field(G,v,a),product_field(V,gamma,a),product_field(gamma,v,a),W("thetaz",a))
        if radial_branch:
            return Zflux(a)
        return add(scale(product_field(G,gamma,a),m=2),product_field(gamma,gamma,a),W("zz",a))

    @cache
    def nonfast(f,a):
        forcing.add((f,a))
        target=v if f=="theta" else gamma
        terms=add(scale(target(shift(a,2)),e=EPS),
                  De(lambda k:flux(f,k,True),a,2 if f=="theta" else 1),
                  scale(flux(f,shift(a,1),False),e=EPS),
                  scale(lap(target,a,is_vector=f=="theta"),e=EPS))
        # Projecting the source removes the genuine torus-independent
        # stress; the axial pressure branch is retained in the z source.
        if f=="z":
            terms=add(terms,scale(p_far(a),e=EPS))
        return terms

    @cache
    def Q0(f,a):
        rhs=add(scale(nonfast(f,a),m=Q(85,6)),
                scale(nonfast(f,shift(a,3,2)),m=Q(85,216)))
        return scale(rhs,m=96,s=1)

    @cache
    def desired_nonfast(a):
        # The fast pressure beta piece survives as +epsilon Pi0 d_Z T_chi beta.
        pressure_time=scale(Tchi("oldBeta",shift(a,1)),e=EPS,m=2)
        return add(Q0("z",a),pressure_time)

    @cache
    def old_temporal_psi(a):
        # Exact original initialized beta, gamma relation is already
        # bound for all higher old C103 requests. At this order the
        # original potential equals R^-1 I(R gamma_T) by the physical
        # shifted FTC and the original zero left-endpoint.
        return rad_weight(lambda b:primitive_part("weightedOldCenteredGamma",b,False),a,-1)

    @cache
    def psi(a):
        return add(old_temporal_psi(a),rad_weight(lambda b:Tchi("weightedDesiredNonfast",b),a,-1))

    @cache
    def late(f,a):
        if f=="beta":
            return scale(psi(shift(a,1)),e=EPS)
        if f=="v":
            return add(scale(v(a),m=2),Q0("theta",a))
        assert f=="gamma"
        correction=rad_weight(lambda b:cutoff_whole("weightedDesiredNonfast",b,additional_r=1),a,-1)
        return add(scale(gamma(a),m=2),desired_nonfast(a),correction)

    fields={"pressureDensity":p_density,"oldBeta":beta,
            "weightedDesiredNonfast":lambda a:rad_weight(desired_nonfast,a,+1),
            "weightedOldCenteredGamma":lambda a:rad_weight(lambda b:scale(gamma(b),m=2),a,+1)}

    for label,output in (("psiLate","psi"),("betaLate","beta"),("vLate","v"),("gammaLate","gamma")):
        for a in map(tuple,census["lateAllMeanOutputOrders"][label]):
            psi(a) if output=="psi" else late(output,a)

    def updated(f,a):
        return add(old(f,a),late(f,a))

    def moment_fields(name,z):
        a=(0,z,0,0)
        mBeta=lambda a:old("beta",a,compact=True)
        mV=lambda a:old("v",a,compact=True)
        mGamma=lambda a:old("gamma",a,compact=True)
        moment_v=lambda a:updated("v",a)
        moment_gamma=lambda a:updated("gamma",a)
        moment_beta=lambda a:updated("beta",a)
        if name=="Jtheta":
            original=add(product_field(G,mV,a),product_field(V,mGamma,a),
                         product_field(moment_v,moment_gamma,a),W("thetaz",a))
            return scale(original,c=2)
        Ur=add(scale(product_field(b,mBeta,a),m=2),product_field(moment_beta,moment_beta,a), W("rr",a))
        Br=add(scale(product_field(V,mV,a),m=2),product_field(moment_v,moment_v,a), W("thetatheta",a))
        az=shift(a,1)
        Vr=add(product_field(b,mGamma,az),product_field(G,mBeta,az),
               product_field(moment_beta,moment_gamma,az),W("rz",az))
        p=add(scale(add(Br,Ur),c=1),scale(Vr,e=EPS),
              scale(mBeta(shift(a,2)),e=EPS),scale(mBeta(shift(a,1,2)),e=3*EPS))
        if name=="P":
            return scale(p,c=1)
        assert name=="Jz"
        j=add(scale(product_field(G,mGamma,a),m=2),
              product_field(moment_gamma,moment_gamma,a),W("zz",a))
        # The flat radial-flux FTC leaves R Fp. The actual weighted
        # radial viscosity integrates to [R beta]=0 at the fixed ends.
        return add(scale(j,c=2),scale(p,m=Q(1,2),c=2),scale(Ur,c=2))

    moments={name:{z:moment_fields(name,z) for z in range(1+through)}
             for name,through in census["freshCompactFiveMapTargetZMax"].items()}
    compact=d["compact"]["compactFiveMap"]
    compact_charge=compact["finiteScalarCoefficientBits"]+compact["finiteScalarGeometryBPower"]
    # The native homogeneous angular whole moment is exactly zero; the
    # finite moving-profile/normalized inverse cap is linear in the fresh
    # P/J input. Charge all spatial coefficient derivatives at its C7 cap.
    raw=[]
    for a in map(tuple,census["spatialPsiK1Orders"]):
        raw.append(("A_T",a,psi(a)))
        theta=moments["Jtheta"]
        compact_psi=(zero if a[3] else scale(add(*(theta[z] for z in range(a[1]+1))),c=compact_charge))
        raw.append(("A_F",a,compact_psi))
    for a in map(tuple,census["spatialDirectSwirlK1Orders"]):
        compact_v=(zero if a[3] else scale(add(*(moments[n][z] for z in range(a[1]+1)
                                              for n in ("P","Jz"))),c=compact_charge))
        raw.append(("B_sum",a,add(late("v",a),compact_v)))
    return raw,{"old":oldseen,"compactOld":compact_oldseen,"background":bgseen,"postSignedW":waveseen,
                "cutoff":cutoff,"shiftedPrimitive":primitive,"centeredNonfast":forcing},moments


def main(a):
    d=verify_sources(a)
    # The H-comparison spends one kappa on the high W premise itself.
    assert Q(1,2**100)+Q(RAW_POST_SIGNED_W_BAND,2**32636)<Q(K,2*EPS)
    raw,roles,moments=calculus(d)
    profile_rows=[{"field":f,"RZTL":a,**encode(g)} for f,a,g in raw if g.m]
    raw_grade=min(g.e for _,_,g in raw if g.m)
    raw_s=max(g.s for _,_,g in raw)
    raw_charge=max(row["totalCoefficientChargeInHOver2Pow128"] for row in profile_rows)
    assert raw_grade==89996 and raw_s==59 and raw_charge==195678<2**18
    assert roles["postSignedW"]=={(f,tuple(a)) for f,a in d["late"]["demand"]["postSignedCovarianceOrders"]}
    assert roles["cutoff"]=={(0,z,0) for z in range(5)}|{(1,z,0) for z in range(3)}|{(2,0,0)}
    assert max(sum(b[:3]) for f,b in roles["background"] if f=="b")==5
    cart=cartesian(raw)
    cart_mass=max(r["coefficientMass"] for r in cart)
    cart_geom=max(r["geometryFactors"] for r in cart)
    assert max(r["radialFastFactors"] for r in cart)==2
    # Include both A potentials and the bounded q/Q scale factor. For
    # r<=2, A=1/2+h, and h<1/64, the s power has absolute exponent <2.
    assert Q(1,10)*Q(1,64)+2*(Q(1,2)+Q(1,128))+Q(1,64)<2
    physical_charge=raw_charge+cart_mass.bit_length()+cart_geom+3
    assert physical_charge<2**18
    native=d["late"]["conditionalCoefficientRoute"]
    assert Q(native["uniformRawEpsilonSufficient"])==Q(4,5)
    assert Q(native["originalStageOneNormalizationDebit"])==Q(1,10)
    assert d["energy"]["comparisonWithExistingGate"]["newLogK"]=="(j/10)*H-2logXb-33log2"
    # In the actual physical stage weights A and B have Q exponents
    # 1/2-A and -A, respectively. Each physical spatial derivative
    # carries Q^-1/2, each axial one an additional epsilon, and the
    # common normalized spatial target contributes q^(r*s_x).
    # We ignore these gains and charge two radial-fast factors. The
    # original combined cutoff applies its known axial product rule.
    cutoff_energy_rank=Q(1,2**110)+Q(raw_s,2**32636)
    assert cutoff_energy_rank<Q(K,2*EPS)
    physical=Q(raw_grade-2*K-K,EPS)-Q(1,10)
    eps_log=1-Q(2,2**128)
    assert physical*eps_log>Q(1,2)
    assert Q(1,2)+Q(1,10)>Q(40,2**128)
    assert 40-2*36==-32
    result={"schema":"MathScope.C105.OriginalConditionalLateMeanK1NormTransfer/1",
            "status":"VERIFIED_EXACT_ARITHMETIC_CONDITIONAL_ON_HIGH_ORIGINAL_POST_SIGNED_COVARIANCE",
            "pins":PINS,"premise":{"componentDirections":sorted(roles["postSignedW"]),
            "absoluteEpsilonGrade":str(Q(ABSOLUTE_POST_SIGNED_W_EPSILON,EPS)),
            "maximumSExponent":RAW_POST_SIGNED_W_BAND,"maximumCoefficientLog":"H/2^100",
            "wholePath":"Original common torus and fixed radial envelope, all crossed admitted physical labels and original flat support, with the same C103 shifted FTC and C98 nonfast inverse realization."},
            "roleCounts":{key:len(val) for key,val in roles.items()},
            "roleInventory":{key:sorted(val) for key,val in roles.items()},
            "rawMeanCoefficientRows":profile_rows,"exactPhysicalCartesianCoefficientRows":cart,
            "freshFiveMapMomentRows":{n:{z:encode(g) for z,g in r.items()} for n,r in moments.items()},
            "rawGate":{"grade":str(Q(raw_grade,EPS)),"band":str(raw_s),
            "coefficientChargeInHOver2Pow128":raw_charge,"commonLogCap":"H/2^110"},
            "physicalGate":{"gradeAfterStageLabelCoefficientAndFastDebits":str(physical),
            "lateAAndBNormalizedUpper":"exp(-H/2)","conditionalReferenceGate":"N7-06 late stage-one slice",
            "targetOriginalATheta":[22150943,22151952],"targetOriginalBTheta":22154876,
            "coefficientChargeInHOver2Pow128BeforeFinalDebit":physical_charge,
            "conditionalLateSliceEnergyRatioUpper":"<2^-32",
            "scope":"On the original directed early slab and same admitted fixed-label and flat seam hypotheses.",
            "retainedStageCutoff":"Original cutoff before curl, with proved axial-only derivative bounds on original annular plateau."},
            "open":["High same-source post-Signed covariance, especially W_rz pure Z5 and L^2 Z5 over the full shifted domain",
                    "N7-06 whole-stage total and independent N8-05",
                    "Final jet acceptance"],"finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS late mean grade roles",result["roleCounts"])
    print(result["rawGate"],result["physicalGate"])


if __name__=="__main__":
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for k in (*PINS,"out"):
        p.add_argument("--"+k,type=Path,required=True)
    main(p.parse_args())
