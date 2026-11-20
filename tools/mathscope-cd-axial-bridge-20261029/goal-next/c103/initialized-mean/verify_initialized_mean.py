"""Replay four-axis initialized-mean demands of the original C103 late stage."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
import json
from math import comb, factorial, prod
from pathlib import Path
import runpy

NAMES = ("beta", "v", "gamma")
PINS = {
    "c103": "1e6bea833b88a440caefeccb59ad58466e06b8f9ae95d0d699e7f44172c09e5b",
    "premean": "0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f",
    "c11": "5c66c394ca8ae4bf1d347628d4045e8aaf402b0e1895413b8f0ac5a829698603",
    "c101joined": "4ad8582a8d107446cbdab41c0fc06b7415241fb7f09e795aa0e587be07b2637d",
    "c98": "05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e",
    "c102": "84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e",
    "sourceInit": "cde60a57a820915c1403d8ce7b13fdbf8e75cb33e5821c8423ab9ac569fcd584",
    "sourceUpdated": "6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07",
}
MOMENT_QUADRATIC = {
    "P": (("beta", "beta", 0), ("v", "v", 0), ("beta", "gamma", 1)),
    "Jz": (("beta", "beta", 0), ("v", "v", 0), ("gamma", "gamma", 0), ("beta", "gamma", 1)),
    "Jtheta": (("v", "gamma", 0),),
}


def pin(p, key):
    raw = p.read_bytes()
    assert sha256(raw).hexdigest() == PINS[key], p
    return raw


def slow(a):
    return sum(a[:3])


def shift(a, axis, amount=1):
    return tuple(s+(amount if j==axis else 0) for j,s in enumerate(a))


def spatial_suborders(a):
    return product(*(range(x+1) for x in a))


def whole_recipe(ops):
    add, scale = (ops[n] for n in ("add", "scale"))
    eps = ops["RATE_DENOMINATOR"]
    W, integrals, chi, inverse = set(), set(), set(), set()

    def radius(f,a,e=1):
        r,z,t,l=a
        return add(*(scale(bound(f,(r-k,z,t,l)),comb(r,k),geometry=1)
                     for k in range(r+1) if e == -1 or k <= 1))

    @cache
    def radial_int(f,a,whole):
        integrals.add((f,a,whole))
        r,z,t,l=a
        if not r:
            return scale(bound(f,a),geometry=1)
        terms=[scale(radial_int(f,(r-1-k,z,t,l+1),whole),comb(r-1,k),eps=-1,geometry=1)
               for k in range(r)]
        if not whole:
            terms.append(bound(f,(r-1,z,t,l)))
        return add(*terms)

    def chi_whole(f,a,chi_r=0):
        r,z,t,l=a
        terms=[]
        for i,j,k in spatial_suborders(a[:3]):
            b=(i+chi_r,j,k)
            chi.add(b)
            terms.append(scale(radial_int(f,(r-i,z-j,t-k,l),True),
                               comb(r,i)*comb(z,j)*comb(t,k),geometry=int(any(b))))
        return add(*terms)

    def centered_int(f,a):
        return add(radial_int(f,a,False),chi_whole(f,a))

    @cache
    def bound(f,a):
        r,z,t,l=a
        if f.startswith("W_"):
            W.add((f,a))
            return {(Q(1,2)+3*slow(a),eps,0):Q(1)}
        if f=="pressure_integrand":
            return add(radius("W_rr",a,-1),scale(bound("W_rz",shift(a,1)),eps=eps),
                       radius("W_thetatheta",a,-1))
        if f=="pZ":
            b=shift(a,1)
            return add(bound("W_rr",b),centered_int("pressure_integrand",b))
        if f in {"Etheta","Ez"}:
            radial,axial,e=("W_rtheta","W_thetaz",2) if f=="Etheta" else ("W_rz","W_zz",1)
            terms=[bound(radial,shift(a,0)),scale(radius(radial,a,-1),e),
                   scale(bound(axial,shift(a,1)),eps=eps),
                   *(scale(bound(radial,(r-k,z,t,l+1)),comb(r,k),eps=-1,geometry=1) for k in range(r+1))]
            if f=="Ez":
                terms.append(scale(bound("pZ",a),eps=eps))
            return add(*terms)
        if f in {"v","gammaDesired"}:
            source="Etheta" if f=="v" else "Ez"
            b=shift(a,3,2)
            inverse.update(((source,a),(source,b)))
            return scale(add(scale(bound(source,a),Q(85,6)),scale(bound(source,b),Q(85,216))),48,band=1)
        if f=="RgammaDesired":
            return radius("gammaDesired",a)
        if f=="T0_RgammaDesired":
            return centered_int("RgammaDesired",a)
        if f=="A1numerator":
            return chi_whole("RgammaDesired",a,chi_r=1)
        if f=="gamma":
            return add(bound("gammaDesired",a),radius("A1numerator",a,-1))
        assert f=="beta"
        return scale(radius("T0_RgammaDesired",shift(a,1),-1),eps=eps)

    def row(f,a):
        result=bound(f,a)
        return {"bandIntercept":str(max(s for s,_,_ in result)-3*slow(a)),
                "minEpsilon":str(Q(min(e for _,e,_ in result),eps)),
                "geometryPower":max(g for _,_,g in result),
                "coefficientMass":str(sum(result.values()))}

    return row,(W,integrals,chi,inverse)


def compact_demand(old):
    # These fields live on the compact bump, and derivatives in L vanish.
    # Radial differentiation can land entirely on its profile and never
    # raises the native Z,T orders of the three coefficients.
    compact={n:{(z,t) for f,(_,z,t,l) in old if f==n and not l} for n in NAMES}
    moments={
        "P":compact["v"],
        "Jz":compact["v"],
        "Jtheta":compact["gamma"]|{(z+1,t) for z,t in compact["beta"]},
    }
    moments={n:{(z,t) for a in asks for z,t in spatial_suborders(a)} for n,asks in moments.items()}
    linear = set()
    quadratic=[]
    for name,asks in moments.items():
        for z,t in sorted(asks):
            a=(0,z,t,0)
            if name in ("P","Jz"):
                linear.update((f,a) for f in ("W_rr","W_thetatheta"))
                linear.add(("W_rz",shift(a,1)))
            if name in ("Jtheta","Jz"):
                linear.add(("W_thetaz" if name=="Jtheta" else "W_zz",a))
            for f,g,dz in MOMENT_QUADRATIC[name]:
                for j,k in spatial_suborders((z+dz,t)):
                    q=(0,j,k,0)
                    p=(0,z+dz-j,t-k,0)
                    quadratic.append((name,a,f,q,g,p,dz,comb(z+dz,j)*comb(t,k)))
    return moments,linear,sorted(quadratic)


def replay_prior(ops,old):
    # Independent reproduction of every old T^0 row using the original 3-axis program.
    dirs=sorted({(r,z,l) for _,(r,z,t,l) in old if not t})
    baseline,*_=ops["record"](dirs)
    row,_=whole_recipe(ops)
    for f,rs in baseline.items():
        for r in rs:
            j=set(r)-{"RZL"}
            a,b,c=r["RZL"]
            assert row(f,(a,b,0,c))=={k:r[k] for k in j}
    return 3*len(dirs)


def high_covariance_rows(orders,c11):
    # C101 frame rows use all ordinary mixed RZT directions, but its previous
    # final Leibniz dispatch listed only pure Z. Apply the same recurrence to
    # the exact mixed multi-indices listed here.
    cap=c11["primaryUniformLogRanks"]
    rows=[]
    for f,a in sorted(orders):
        r,z,t,l=a
        j=slow(a)
        assert j<=10 and l<=14
        words=0
        for i,k,h,b in spatial_suborders(a):
            half_1=Q(1,4)+3*(i+k+h)
            half_2=Q(1,4)+3*(j-i-k-h)
            assert half_1+half_2==Q(1,2)+3*j
            words+=prod(comb(s,d) for s,d in zip(a,(i,k,h,b)))
        assert words==2**sum(a)
        outer,inner=9+3*j,6+3*j
        eo,ei=(outer+1)//2,(inner+1)//2
        outer_cost=Q(factorial(eo),4**eo)
        inner_cost=factorial(ei)
        assert outer_cost<2**23 and inner_cost<2**54
        band=Q(1,2)+3*j
        cover=prod([162,16,2,2**band.__ceil__(),4**j,81**l,words,4])
        ranks=[2*cap[0]+cover.bit_length()+54,*(2*x for x in cap[1:])]
        assert sum(ranks)<2**16
        rows.append({"component":f,"RZTL":a,"epsilonGrade":"1","bandPower":str(band),
                     "primaryMaximumOrdinarySlowOrder":j+1,"potentialMaximumLOrder":l+1,
                     "outerAndInnerPoles":[outer,inner],"exactLeibnizSum":words,
                     "logDegreeRanks":ranks,"logCap":"H/2^112"})
    return rows


def main(a):
    late=json.loads(pin(a.c103,"c103"))
    old=sorted((f,tuple(b)) for f,b in late["demand"]["initialMeanOrdinaryInputOrders"])
    assert len(old)==223
    c11=json.loads(pin(a.c11,"c11"))
    c101joined=json.loads(pin(a.c101joined,"c101joined"))
    c98=json.loads(pin(a.c98,"c98"))
    c102=json.loads(pin(a.c102,"c102"))
    assert c11["frame"]["auditedDirections"]==comb(14,3)
    assert c101joined["pins"]["frame"]==PINS["c11"]
    assert c101joined["backgroundOrdinaryOrder"]==12
    assert c101joined["regularTargetOrdinaryOrder"]==11
    assert set(c101joined["targetThreeRegions"])=={"inner","middle","outer"}
    assert c11["cutoff"]["maximumOrder"]==15
    assert c98["ordinaryDerivativeBudget"]["mixedDirections"]==1080
    assert c98["coefficientBudget"]["wholePathCovarianceLogCap"]=="H/2^113"
    # Preserve the original native Temporal-before-FiveMap construction.
    init=pin(a.runtime/"source-global-initial-mean.mjs","sourceInit").decode()
    updated=pin(a.runtime/"source-updated-mean-pressure.mjs","sourceUpdated").decode()
    assert "afterTemporal=reconstructUpdatedFullMeanPressure" in init
    assert "actualInputDefects={P:afterTemporal.mean.P,Jtheta:afterTemporal.mean.Jtheta,Jz:afterTemporal.mean.Jz}" in init
    assert "G.integral(integrand,r,geometry.innerRadius,R)" in init
    assert "G.neg(G.mul(epsilon,G.derivative(psi,Z)))" in init
    assert "exactNormalizedHaar(G,raw.fluxTheta,Y)" in updated
    assert "exactNormalizedHaar(G,raw.fluxZ,Y)" in updated
    pin(a.premean,"premean")
    ops=runpy.run_path(str(a.premean))
    baseline_count=replay_prior(ops,old)
    temporal,lists=whole_recipe(ops)
    direct=[(f,b,temporal(f,b)) for f,b in old]
    direct_sets=[set(table) for table in lists]
    moments,linear,quadratic=compact_demand(old)
    qrows=[]
    for name,order,f,b,g,c,dz,multiplicity in quadratic:
        u,v=temporal(f,b),temporal(g,c)
        grade=Q(u["minEpsilon"])+Q(v["minEpsilon"])+dz
        surplus=Q(u["bandIntercept"])+Q(v["bandIntercept"])+3*dz-Q(1,2)
        # Budget for two independent high Primary caps plus chart/integration
        # constants. S exponent is retained in the grade-one result.
        assert (grade-1)/2>Q(2,2**112)+Q(2**14,2**128)+surplus/2**32636
        qrows.append((name,order,f,b,g,c,dz,multiplicity,str(grade),str(surplus)))
    cov=lists[0]|linear
    high={row for row in cov if slow(row[1])>7 or row[1][3]>8}
    high_rows=high_covariance_rows(high,c11)
    highest=max(slow(b) for _,b in cov)
    assert highest==9
    transverse=max(b[3] for _,b in cov)
    assert transverse==9
    assert max(row["primaryMaximumOrdinarySlowOrder"] for row in high_rows)==10
    assert max(row["potentialMaximumLOrder"] for row in high_rows)==10
    lows=[min(Q(r["minEpsilon"]) for f,_,r in direct if f==n) for n in NAMES]
    assert lows==[Q(199997,100000),Q(99999,100000),Q(24999,25000)]
    max_mass=max(Q(r["coefficientMass"]) for _,_,r in direct)
    max_geometry=max(r["geometryPower"] for _,_,r in direct)
    assert max_geometry==10 and max_mass<2**24
    counts={"old":len(old),"oldWithSlowTime":sum(bool(b[2]) for _,b in old),
            "preFiveMapCovariance":len(direct_sets[0]),"allPrimaryCovariance":len(cov),
            "highPrimaryCovariance":len(high),"highPrimaryCovarianceWithSlowTime":sum(bool(b[2]) for _,b in high),
            "radialIntegralRoles":len(lists[1]),"cutoffRoles":len(lists[2]),"inverseRoles":len(lists[3]),
            "compactQuadraticBranches":len(qrows)}
    assert tuple(counts.values())==(223,51,978,1030,40,5,534,41,257,289)
    assert {(f,b) for f,b in high if b[3]==9}=={("W_rz",(0,0,0,9))}
    assert {(f,b) for f,b in high if b[2]}=={("W_rz",(0,7,1,l)) for l in range(5)}
    assert max(map(sum,lists[2]))==8
    # The original mixed RZT implicit and cutoff bounds through nine are
    # already audited in C102. Temporal composes one W operand per summand.
    assert c102["extendedCutoffGeometry"]["order"]==9
    geometry=c102["extendedCutoffGeometry"]["coefficientLog2Ceilings"]
    assert max(geometry.values())<256
    high_charge=max(sum(row["logDegreeRanks"]) for row in high_rows)
    direct_charge=high_charge+max_geometry+24
    # In the compact donor, linear covariance directions are all in C98.
    # The original bump computation is multivariate through total order
    # seven and enters via the RZT coefficient bound, so its charge applies
    # to the selected T directions with the same total derivative order.
    compact=c102["compactFiveMap"]
    assert compact["compactIndependentOfL"] and compact["compactZeroOnBothSourceCollars"]
    assert max(slow(b) for _,b in linear)==7
    compact_charge=compact["compactChargeInHOver2Pow128"]
    coeff_charge=max(direct_charge,compact_charge)+1
    assert coeff_charge<2**16
    assert Q(1,2)>Q(3,2**32636)
    result={"schema":"MathScope.C103.OriginalFourAxisInitializedMeanLateDemands/1",
            "status":"VERIFIED_DERIVATIVE_CENSUS_WITH_CONDITIONAL_CAP_FROM_ORIGINAL_C11_FRAME",
            "pins":PINS,"counts":counts,"reproducedOldThreeAxisCoefficientRows":baseline_count,
            "initializedMeanMicrolocalAxes":["R","Z","T","L"],
            "directTemporal":direct,"directMinEpsilon":dict(zip(NAMES,map(str,lows))),
            "directMaxBandIntercept":{n:str(max(Q(r["bandIntercept"]) for f,_,r in direct if f==n)) for n in NAMES},
            "directMaxCoefficientMass":str(max_mass),"directMaxGeometryPower":max_geometry,
            "fullPrimaryCovarianceOrders":sorted(cov),"additionalHighRows":high_rows,
            "allNeededChiOrders":sorted(lists[2]),"cutoffMaxSlowOrder":max(map(sum,lists[2])),
            "compactMomentZTDirections":{key:sorted(j) for key,j in moments.items()},
            "compactDistinctNecessaryLinearCovariance":sorted(linear),
            "compactMaximumTotalZT":{key:max(map(sum,j)) for key,j in moments.items()},
            "compactQuadraticMinimumEpsilon":str(min(Q(row[-2]) for row in qrows)),
            "compactQuadraticMaximumBandSurplus":str(max(Q(row[-1]) for row in qrows)),
            "compactQuadraticLeibnizRows":qrows,
            "covarianceAndCoefficientBudget":{"maxConservativeCovarianceSlow":highest,
                "maxConservativeCovarianceL":transverse,
                "highExtraPoolCap":"H/2^112",
                "coefficientChargeInHOver2Pow128":coeff_charge,
                "fullInitializedMeanCoefficientLogCap":"H/2^112",
                "compactLinearEpsilonPaysExtraBand":"S^3",
                "compactEpsilon":[2,1,1],"compactBandIntercept":["7/2","1/2","1/2"]},
            "claimBoundary":"Four-axis absolute derivative composition under original admitted shifted charts, fixed radial lift coefficients, flat endpoints, Primary C11 frame, support and finite derivative reproducibility. No post-Signed covariance or late energy bound follows.",
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS C103 late initialized mean",counts)
    print("Compact ZT depths",result["compactMaximumTotalZT"],"cutoff",result["cutoffMaxSlowOrder"])
    print("Ordinary grade",result["directMinEpsilon"],"band",result["directMaxBandIntercept"],
          "coefficient charge",coeff_charge)


if __name__=="__main__":
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for key in ("c103","premean","c11","c101joined","c98","c102","runtime","out"):
        p.add_argument("--"+key,type=Path,required=True)
    main(p.parse_args())
