"""Bind original late K1 mean and compute its selected source derivative frontier."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
import json
from math import comb, factorial
from pathlib import Path
import sys


B=Path("primary-forced-join/active-n3-c5-binding")
E=17732737
R,Z,T=17732748,17732749,17732750
Y=[17745430,17745431]
ALPHA,OMEGA=17743711,17743713
PINS={
    "reader":"2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb",
    "cache":"909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f",
    "manifest":"8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a",
    "stream":"faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96",
    "registry":"e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03",
    "frontier":"4ddef46553be2e296df327c513257e75085753f8a16e822ddcd16e105ad726c3",
    "earlySigma":"c68fe265e3eecc53fd91963eb175d529da6cafda7775c6d5aaf09dee406b97da",
}
RUNTIME={
    "frontierSource":("navier/source-signed-temporal-frontier.mjs","cd5c3d2089a1b83628e7021cd247301ffece546c5fc53e7532b905208b397f2f"),
    "equations":("navier/source-full-mean-equations.mjs","2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76"),
    "lateTemporal":("post-signed-20261023/source-signed-actual-temporal-inverse.mjs","5299e02c6d7b67c5fedb919be8d359a79678bd903183e27def736a65926bd628"),
    "lateFive":("post-signed-20261023/source-signed-actual-five-map.mjs","22976ece2c801beb9e51045820749cc077ddf2c198e364f2033a53789989466d"),
}
COMP=("rr","rtheta","rz","thetatheta","thetaz","zz")
ZERO=(0,0,0,0)


def pinned(p,h):
    raw=p.read_bytes()
    assert sha256(raw).hexdigest()==h,p
    return raw


def source(a):
    files={k:pinned(a.runtime/path,h).decode() for k,(path,h) in RUNTIME.items()}
    assert "source.map((x,j)=>G.sub(x,means[j]))" in files["frontierSource"]
    assert "updatedMean.mean.fullAngularCovariance!==stage.updatedCovariance" in files["frontierSource"]
    assert "covariance:updated.updatedCovariance" in files["lateTemporal"]
    assert "source=temporal.postTemporal.updatedMeanPressure" in files["lateFive"]
    assert "newPostSignedTemporalDefects" in files["lateFive"]
    assert "compactPsi=G.div(G.sub(primitive,G.mul(pressure.pressure.chi,whole)),R)" in files["lateFive"]
    eq=files["equations"]
    assert "time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))" in eq
    assert "G.neg(Dz(G.add(G.mul(b,gamma),G.mul(G0,beta),G.mul(beta,gamma),W.rz)))" in eq
    assert "G.mul(epsilon,lapVector(beta))" in eq and "G.neg(G.mul(epsilon,lap(gamma)))" in eq
    read=a.goal/B/"spatial-readback/source_stream.py"
    ca=a.goal/B/"live-wave-gauge/signed/source_cache.py"
    pinned(read,PINS["reader"]);pinned(ca,PINS["cache"])
    sys.path[:0]=[str(read.parent),str(ca.parent)]
    import source_stream,source_cache
    m=json.loads(pinned(a.artifact/source_stream.MANIFEST,PINS["manifest"]))
    n=source_stream.Native(a.artifact,m)
    assert n.pin==PINS["registry"]
    s=source_cache.load(source_stream,a.artifact,m,22153782,a.cache)
    try:
        assert s.verify["sha256"]==PINS["stream"] and s.verify["nodes"]==22155584
        assert s.args(22154876,"add")==[22150797,22151941]
        slow=[E,R,Z,T,*Y]
        assert s.args(22150943,"m3_coupled_expression_partial")==["coupled-expression:1329",slow,[0]*6]
        assert n.expressions[1329]["body"]==22150942
        assert s.args(22150942,"multiply")==[17733137,22150941]
        assert s.args(22150941,"add")==[22150838,22150940]
        assert s.args(22150838,"definite_integral")==[22150837,22150801,ALPHA,R]
        assert s.args(22150839,"definite_integral")==[22150837,22150801,ALPHA,OMEGA]
        assert s.args(22150940,"multiply")==[20,22150939]
        assert s.args(22150939,"multiply")==[17743734,22150839]
        assert s.args(22151952,"multiply")==[17733137,22151950]
        assert s.args(22151950,"definite_integral")==[22151949,22151946,ALPHA,R]
        assert s.args(22151951,"definite_integral")==[22151949,22151946,ALPHA,OMEGA]
        assert s.args(22151948,"m3_coupled_expression_partial")==["coupled-expression:1336",[E,22151946,Z,T],[0]*4]
        assert s.args(22151941,"m3_coupled_expression_partial")==["coupled-expression:1335",slow[:4],[0]*4]
        assert s.args(22150797,"multiply")==[20,22150796]
        assert s.args(22150796,"multiply")==[19570770,22032009]
        assert s.args(19570770,"inverse")==[17745449]
        for inv,body,x,negative,haar,inner in ((0,22032006,22031277,22032005,22032002,22032001),
                                               (1,22032008,22031652,22032007,22032004,22032003)):
            assert n.inverses[inv]["body"]==body and n.inverses[inv]["Y"]==Y
            assert n.inverses[inv]["directions"]==[R,Z,T,*Y]
            assert s.args(body,"add")==[x,negative] and s.args(negative,"multiply")==[20,haar]
            assert s.args(haar,"definite_integral")==[inner,Y[1],0,1]
            assert s.args(inner,"definite_integral")==[x,Y[0],0,1]
        assert s.args(22031651,"multiply")==[17732744,22031648]
        assert [n.expressions[i]["body"] for i in (1332,1333,1334)]==[22151513,22151576,22151635]
        assert all(n.expressions[i]["parameters"]==[E,Z,T] for i in (1332,1333,1334))
        assert all(n.fields[k]["name"]=="GenericSigned162_covariance_delta_"+nm and len(n.fields[k]["rows"])==162
                   for k,nm in enumerate(COMP,20))
        return {"graph":s.verify,"latePsi":22150943,"lateSwirl":22150797,"lateFivePsi":22151952,
                "lateFiveSwirl":22151941,"directSwirlSum":22154876,"fiveWholeRoot":22151951,
                "centeredSource":[22032006,22032008],"unaveragedSources":[22031277,22031652],
                "signedPressureZ":22031648,"freshPostLateTemporalMoments":[22151513,22151576,22151635],
                "signedCovarianceDeltaFields":list(range(20,26)),"sameSourceSignedCovarianceUnchangedByTemporal":True}
    finally:
        s.__exit__()


def shift(a,axis,n=1):
    return tuple(x+(n if k==axis else 0) for k,x in enumerate(a))


def suborders(a):
    return tuple(product(*(range(x+1) for x in a)))


def demand():
    wave,old,primitive,forcings,fast_cancel=set(),set(),set(),set(),set()

    @cache
    def centered_int(f,a):
        # Every available whole/cumulative term is a translated T_chi.
        # When a radial derivative hits the moving end, use the source
        # endpoint and the previous radial order. The other factor is a L
        # derivative of its actual reference translation.
        primitive.add((f,a))
        r,z,t,l=a
        for i in range(r+1):
            for j in range(z+1):
                for k in range(t+1):
                    b=(i,j,k,l+r-i)
                    if i:
                        calc(f,(i-1,j,k,l+r-i))
                    calc(f,(0,j,k,l+r-i))

    def old_product(names,a):
        for field in names:
            for b in suborders(a):
                old.add((field,b))

    def W(field,a):
        wave.add((field,a))

    def radial_calls(f,a):
        r,z,t,l=a
        f(shift(a,0))
        for i in range(r+1):
            f((i,z,t,l))
            f((i,z,t,l+1))

    def lap(field,a):
        for b in (shift(a,0,2),shift(shift(a,0),3),shift(a,3,2),shift(a,1,2)):
            old_product((field,),b)

    @cache
    def calc(f,a):
        if f=="pDensity":
            W("rr",a);W("thetatheta",a);W("rz",shift(a,1))
            old_product(("beta","v"),a)
            old_product(("beta","gamma"),shift(a,1))
            old_product(("beta",),shift(a,2))
            old_product(("beta",),shift(a,1,2))
            return
        if f=="pZ":
            b=shift(a,1)
            # Original pressure D_r flux and the radial part of beta
            # viscosity are integrated exactly using shifted FTC.
            W("rr",b)
            old_product(("beta",),b)
            radial_calls(lambda j:old_product(("beta",),j),b)
            centered_int("pDensity",b)
            fast_cancel.add(("pZ_Nbeta",b))
            centered_int("oldBeta",b)
            return
        if f=="oldBeta":
            old_product(("beta",),a)
            return
        if f in ("Etheta","Ez"):
            forcings.add((f,a))
            is_theta=f=="Etheta"
            target=("v" if is_theta else "gamma",)
            radial,axial=("rtheta","thetaz") if is_theta else ("rz","zz")
            radial_calls(lambda j: W(radial,j),a)
            W(axial,shift(a,1))
            radial_calls(lambda j:old_product(("beta",*target),j),a)
            old_product(("v","gamma") if is_theta else ("gamma",),shift(a,1))
            old_product(target,shift(a,2))
            lap(target[0],a)
            if not is_theta:
                calc("pZ",a)
            return
        if f in ("vLate","gammaDesired"):
            rhs="Etheta" if f=="vLate" else "Ez"
            fast_cancel.add((rhs+"_ciN",a))
            old_product(("v" if f=="vLate" else "gamma",),a)
            calc(rhs,a)
            calc(rhs,shift(a,3,2))
            return
        if f=="psiLate":
            centered_int("gammaDesired",a)
            return
        if f=="gammaLate":
            calc("gammaDesired",a)
            centered_int("gammaDesired",a)  # retain the original chi_R * whole A1 factor
            return
        assert f=="betaLate"
        calc("psiLate",shift(a,1))

    spatial_psi={(r,z,0,l) for r,z,l in product(range(3),repeat=3) if r+z+l<=2}
    spatial_v={(r,z,0,l) for r,z,l in product(range(2),repeat=3) if r+z+l<=1}
    compact={"P":1,"Jz":1,"Jtheta":2}
    all_late={"psiLate":spatial_psi,"vLate":spatial_v|{(0,z,0,0) for z in range(3)},
              "gammaLate":{(0,z,0,0) for z in range(3)},"betaLate":{(0,z,0,0) for z in range(3)}}
    for name,ds in all_late.items():
        for a in ds:
            calc(name,a)
    # Same current covariance enters the post-Late-Temporal FiveMap.
    for z in range(2):
        for f in ("rr","thetatheta","zz"):
            W(f,(0,z,0,0))
        W("rz",(0,z+1,0,0))
    for z in range(3):
        W("thetaz",(0,z,0,0))
    assert max(z for _,(_,z,_,_) in wave)==5
    assert {(f,a) for f,a in wave if a[1]==5}=={("rz",(0,5,0,l)) for l in (0,2)}
    assert not any(a[2] for _,a in wave)
    assert ("beta",(0,4,1,2)) in old and ("beta",(0,6,0,2)) in old
    sufficient_sigma=set()
    for field,(r,z,t,l) in wave:
        for b in ((r,z),(r+1,z),(r,z+1)):
            sufficient_sigma.update(product(*(range(x+1) for x in b)))
    beyond_c2=sorted(a for a in sufficient_sigma if sum(a)>2)
    assert (0,6) in beyond_c2 and max(map(sum,sufficient_sigma))==6
    summary={}
    for field in COMP:
        rows=[a for f,a in wave if f==field]
        summary[field]={"count":len(rows),"maxOrdinarySlow":max(sum(x[:3]) for x in rows),
                        "maxL":max(x[3] for x in rows),"maxComponentOrders":[max(x[i] for x in rows) for i in range(4)]}
    return {"spatialPsiK1Orders":sorted(spatial_psi),"spatialDirectSwirlK1Orders":sorted(spatial_v),
            "freshCompactFiveMapTargetZMax":compact,"lateAllMeanOutputOrders":{k:sorted(v) for k,v in all_late.items()},
            "postSignedCovarianceByComponent":summary,"postSignedCovarianceOrders":sorted(wave),
            "initialMeanOrdinaryInputOrders":sorted(old),"originalShiftedPrimitiveOrders":sorted(primitive),
            "centeredNonfastForcingRows":sorted(forcings),"fastTimeIdentitiesKept":sorted(fast_cancel),
            "sufficientPreviousSignedSigmaDirectionsRZ":sorted(sufficient_sigma),
            "sufficientPreviousSignedSigmaDirectionsAboveC2":beyond_c2,
            "highestPostSignedCovarianceRows":sorted((f,a) for f,a in wave if a[1]==5),
            "highestPureZCovariancePath":"W_rz,Z5 -> pressureZ,Z3 -> centered Ez,Z3 -> late psi,Z3 -> late beta,Z2 -> fresh P_Z and Jz_Z",
            "conservativeSignedPotentialOrderSufficient":"Ordinary pure Z6 feeds full curl at W_rz,Z5. The early C102 signed gauge envelope is spatial C2 only."}


def coefficient_gate():
    k=Q(1,100000)
    raw=Q(4,5)
    sqrt_cutoff_stage=Q(1,10)
    band=128
    rank=Q(1,2**90)+band*Q(1,2**32636)
    assert 2*rank<k
    # Normalized chart scale satisfies -log(epsilon)>H(1-2/2^128).
    physical=raw-sqrt_cutoff_stage-2*k-k
    assert physical==Q(69997,100000)
    eps_log=1-Q(2,2**128)
    assert physical*eps_log>Q(1,2)
    assert Q(1,2)+Q(1,10)>Q(40,2**128)
    return {"uniformRawEpsilonSufficient":str(raw),"uniformRawBandPowerSufficient":band,
            "maximumInputCoefficientLogOverH":"2^-90","originalStageOneNormalizationDebit":str(sqrt_cutoff_stage),
            "twoRadialFastDerivativesDebit":str(2*k),"extraBandAndCoefficientDebit":str(k),
            "resultingPhysicalGrade":str(physical),"conditionalNormalizedLatePotentialAndSwirlBound":"exp(-H/2)",
            "scope":"Input grades here are assumed for the completed late normalized mean coefficients, with their listed derivative orders. The packet supplies no measured bound for the new input covariances or complete late inverse coefficient."}


def fifth_nonzero_witness():
    # Compact meridional test F has a low psi=a and high delta psi_Z3=R*a
    # on a co-moving nonconstant mode. Its pressure W_rz input can be
    # chosen by two radial endpoint-exact derivatives in the T_chi kernel.
    a,b=1,3
    def mul(f,g):
        p=Counter()
        for i,c in f.items():
            for j,d in g.items():
                p[i+j]+=c*d
        return dict(p)
    x=mul({2:1,1:-2*a,0:a*a},{2:1,1:-2*b,0:b*b})
    square=mul(x,x)
    density=mul(x,{p:(p+1)*c for p,c in x.items()})
    def integrate(f):
        return sum(Q(c,p+1)*(b**(p+1)-a**(p+1)) for p,c in f.items())
    raw_p=integrate(density)/2
    raw_j=-integrate(mul({2:1},density))/4
    assert raw_p==integrate(square)/4==Q(64,315)
    assert raw_j==integrate(mul({2:1},square))/8==Q(32,77)
    assert comb(2,2)==1 and 5-2==3 and 3-1==2
    return {"P_ZPerEpsilonSquared":str(raw_p),"Jz_ZPerEpsilonSquared":str(raw_j),
            "orders":"delta W_rz first Z5; delta psi first Z3; delta beta first Z2; fresh P and Jz first Z1.",
            "scope":"Co-moving normalized Haar/radial operator witness with two exact translated primitives whose whole boundary differences vanish. It shows the fifth axial coefficient can survive for smooth supported inputs; no actual source lower bound is inferred."}


def main(a):
    frontier=json.loads(pinned(a.frontier,PINS["frontier"]))
    sigma=json.loads(pinned(a.early_sigma,PINS["earlySigma"]))
    assert frontier["status"].startswith("VERIFIED") and sigma["sourceSigmaRoots"]==[22001223,22001224]
    assert max(sum(a) for a in sigma["ordinarySpatialOrders"])==2
    res={"schema":"MathScope.C103.OriginalPostSignedLateMeanK1Frontier/1",
         "status":"VERIFIED_ORIGINAL_LATE_MEAN_ROOTS_AND_DERIVATIVE_INVENTORY",
         "source":source(a),"demand":demand(),
         "fifthOrderPressureWitness":fifth_nonzero_witness(),
         "fastTimeReduction":"N^-1 Pi_0(ci N mu)/ci=Pi_0 mu since ci and every original radial translator are torus-independent. The initialized meridional T_chi primitive inverts its own cylindrical derivative with both actual zero endpoint values, so this piece is minus its original potential. The pressure term from -ci N beta uses epsilon*Pi_0*D_Z T_chi beta.",
         "conditionalCoefficientRoute":coefficient_gate(),
         "open":["Actual post-Signed covariance mixed and pure axial high norms, including W_rz,Z5 and its L² partner",
                 "Higher initialized mean time/viscous rows","Same-body late Fourier tails/weighted uniform estimates and physical late K1 energy"],
         "release":"HOLD","finalJets":0}
    a.out.write_text(json.dumps(res,indent=2)+"\n",encoding="utf8",newline="\n")
    print(len(res["demand"]["postSignedCovarianceOrders"]),len(res["demand"]["initialMeanOrdinaryInputOrders"]))


if __name__=="__main__":
    if not __debug__:
        raise RuntimeError("Verification requires assertions.")
    p=ArgumentParser()
    for n in ("goal","artifact","cache","runtime","frontier","early-sigma","out"):
        p.add_argument("--"+n,type=Path,required=True)
    main(p.parse_args())
