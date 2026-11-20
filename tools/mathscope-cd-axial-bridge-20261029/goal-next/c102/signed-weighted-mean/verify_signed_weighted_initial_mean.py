"""Original initial Temporal quadratic mean on the narrow Signed collars."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import inspect
from itertools import product
import json
from math import comb, factorial, prod
from pathlib import Path
import runpy


PINS={
    "signed":"8debc1a74134334ab4aa1cac81e8e3cadf550f839b64283881e2e405d5734942",
    "covariance":"05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e",
    "initialTemporal":"8c2c1641bf425268451c2ef8564777c942eceb4a3a9092602a0686c88c49c460",
    "weightedTransfer":"c347d10e54d4bfd2ff845892047b09d38ef1bcec596369694ad0a8e73dbbd45b",
    "fiveMap":"3f7477153115e9d5601626e8c37716a6b592523f6af8cbdc851095100c5fc102",
    "modeOneAttachment":"84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e",
    "premean":"0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f",
}
PAIR={"rr":("beta","beta"),"rtheta":("beta","v"),"rz":("beta","gamma"),
      "thetatheta":("v","v"),"thetaz":("v","gamma"),"zz":("gamma","gamma")}
RATE=100000


def checked(path,key):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],path
    return json.loads(raw)


def shift(j,i,k=1):
    return tuple(x+(k if i==a else 0) for a,x in enumerate(j))


def add(*rows):
    ans=Counter()
    for row in rows:
        ans.update(row)
    return dict(ans)


def scale(row,e=0,s=0,p=0,g=0,c=1):
    return {(a+e,b+s,d+p,f+g):c*v for (a,b,d,f),v in row.items()}


def summary(row):
    return {"epsilon":str(Q(min(e for e,s,p,g in row),RATE)),
            "band":str(max(s for e,s,p,g in row)),"pole":max(p for e,s,p,g in row),
            "geometryPower":max(g for e,s,p,g in row),"coefficientMass":str(sum(row.values()))}


def sigmas(reference):
    # Keep each normalized Haar Leibniz term with its original component.
    asks={f:{tuple(a)+(0,) for a in rows} for f,rows in reference["forcedCovarianceSupremumOrders"].items()}
    assert set(asks)==set(PAIR)
    assert all(t==l==0 for ds in asks.values() for r,z,t,l in ds)
    mean={f:set() for f in ("beta","v","gamma")}
    branches={}
    for f,rows in asks.items():
        a,b=PAIR[f]
        for j in sorted(rows):
            terms=[]
            for k in product(*(range(n+1) for n in j)):
                m=tuple(n-x for n,x in zip(j,k,strict=True))
                weight=prod(comb(n,x) for n,x in zip(j,k,strict=True))
                mean[a].add(k)
                mean[b].add(m)
                terms.append((a,k,b,m,weight))
            assert sum(c for a,k,b,m,c in terms)==2**sum(j)
            branches[f,j]=terms
    assert max(j[1] for j in mean["beta"])==max(j[1] for j in mean["gamma"])==4
    assert max(j[1] for j in mean["v"])==3
    return mean,branches


def collar(base,means,branches):
    cov, inverses, primitive=set(),set(),set()

    @cache
    def product_r(name,j,power,inside=False):
        # R and 1/R coefficients are independent of Z,T,L. D_R^k/R
        # is bounded by k! times one original radius-geometry factor.
        r,z,t,l=j
        getter=T if inside else calc
        return add(*(scale(getter(name,(r-k,z,t,l)),g=1,c=comb(r,k)*factorial(k))
                     for k in range(r+1) if power==-1 or k<=1))

    @cache
    def T(f,j):
        r,z,t,l=j
        primitive.add((f,j))
        if not r:
            origin=calc(f,j)
            assert min(p for _,_,p,_ in origin)>=3
            return scale(origin,p=-3,g=1)
        # ∂R Tχ f = f−a L Tχ f on both oriented short integrals.
        return add(calc(f,(r-1,z,t,l)),
                   *(scale(T(f,(k,z,t,l+1)),e=-1,g=1,c=comb(r-1,k)) for k in range(r)))

    @cache
    def calc(f,j):
        r,z,t,l=j
        if f.startswith("W_"):
            cov.add((f,j))
            assert not t
            return {(RATE,Q(1,2)+3*(r+z),base+3*(r+z),0):Q(1)}
        if f=="pressure_density":
            return add(product_r("W_rr",shift(j,1),-1),
                       scale(calc("W_rz",shift(j,1,2)),e=RATE),
                       product_r("W_thetatheta",shift(j,1),-1))
        if f=="pressureZ":
            return add(calc("W_rr",shift(j,1)),T("pressure_density",j))
        if f in ("Etheta","Ez"):
            radial,axial,e=("W_rtheta","W_thetaz",2) if f=="Etheta" else ("W_rz","W_zz",1)
            branches=[calc(radial,shift(j,0)),scale(product_r(radial,j,-1),c=e),
                      scale(calc(axial,shift(j,1)),e=RATE)]
            for k in range(r+1):
                # All needed radial derivatives of a retain one original
                # epsilon^(-kappa) factor, as in C97.
                branches.append(scale(calc(radial,(r-k,z,t,l+1)),e=-1,g=1,c=comb(r,k)))
            if f=="Ez":
                branches.append(scale(calc("pressureZ",j),e=RATE))
            return add(*branches)
        if f in ("v","gamma"):
            g="Etheta" if f=="v" else "Ez"
            inverses.update(((g,j),(g,shift(j,3,2))))
            return scale(add(scale(calc(g,j),c=Q(85,6)),scale(calc(g,shift(j,3,2)),c=Q(85,216))),
                         s=1,c=48)
        if f=="Rgamma_Z":
            return product_r("gamma",shift(j,1),1)
        assert f=="beta"
        return scale(product_r("Rgamma_Z",j,-1,True),e=RATE)

    mins={}
    mean_rows={}
    for name,orders in means.items():
        result=[]
        for j in sorted(orders):
            terms=calc(name,j)
            r,z,t,l=j
            found=summary(terms)
            assert found["pole"]==base+3+3*(r+z)
            assert Q(found["band"])<={"beta":Q(21,2),"v":Q(9,2),"gamma":Q(15,2)}[name]+3*(r+z)
            minimum=Q(found["epsilon"])
            mins[name]=str(min(minimum,Q(mins.get(name,3))))
            result.append({"RZTL":j,**found})
        mean_rows[name]=result

    pair_rows={}
    for (component,j),terms in branches.items():
        h=Counter()
        for a,k,b,m,binomial in terms:
            for (e1,s1,p1,g1),c1 in calc(a,k).items():
                for (e2,s2,p2,g2),c2 in calc(b,m).items():
                    h[e1+e2,s1+s2,p1+p2,g1+g2]+=binomial*c1*c2
        q=summary(h)
        assert q["pole"]==2*(base+3)+3*sum(j[:3])
        assert Q(q["epsilon"])>=2-2*Q(1,RATE)
        pair_rows.setdefault(component,[]).append({"RZT":j[:3],"weight":"zeta^2",**q})
    max_field=max(sum(j[:3]) for f,j in cov)
    assert max_field==7 and max(j[3] for f,j in cov)<=8
    assert {f for f,j in cov if sum(j[:3])==7}=={"W_rz"}
    early_max=max(r["pole"] for rows in pair_rows.values() for r in rows)
    return {"inputCovariancePoleIntercept":base,"exactCovarianceRows":sorted(cov),
            "operationCounts":[len(cov),len(primitive),len(inverses)],
            "maximumCovarianceSlow":max_field,"meanRows":mean_rows,"minimumMeanGrades":mins,
            "pairRows":pair_rows,"maximumQuadraticPoleBeforeExtraGaussianUse":early_max,
            "maximumQuadraticBand":str(max(Q(x["band"]) for rr in pair_rows.values() for x in rr))}


def transfer_geometry(signed,five,weighted,init):
    assert five["beta"]["wholeGammaMomentZero"]
    assert weighted["radialIdentities"]["gamma"].endswith("with chi_R=0 on the collar")
    assert init["pressureZ"]==17754234 and init["actualChi"]==17743734
    assert init["centeredInitialTemporal"][1]["actualZeroModeSubtraction"]==19563365
    u,d,t1,w,p=Q(1,128),Q(1,32),Q(1,128),Q(2),512
    # d/dx of zeta*x^(3-p), after division by zeta*x^(-p).
    lower_inner=2-p*u**2-8*t1*u**3/(w-t1*u)**3
    lower_outer=8-p*d**2-2*t1**2*d**3/(w-d)**3
    assert lower_inner>1 and lower_outer>4
    assert t1*u<1 and 5-d>2
    assert signed["finiteGaussianTransfer"]["maximumInputPole"]==512
    assert 4/(w-t1*u)**2<2 and t1**2/(w-d)**2<Q(2,3)
    return {"uMaximum":"1/128","dMaximum":"1/32","maxPrimitiveInputPole":512,
            "innerDerivativeLower":str(lower_inner),"outerDerivativeLower":str(lower_outer),
            "innerRadialJacobian":"dR/du=t1*R/2","outerRadialJacobian":"-dR/dd=R/2",
            "fixedCutoffIdentity":"The native χ is 0 near Xa and 1 near Xb; all positive jets of χ and ρ vanish locally. Tχ is I on inner and minus the short right integral on outer.",
            "fullOppositeGaussianKept":True,
            "pressureRhoP":"Its exact torus-independent contribution is zero under the centered inverse. Fixed endpoint Wrr traces vanish by original flatness.",
            "realizedGammaA1":"A1=χ_R/R times the original whole integral, hence zero on each narrow open collar.",
            "meanPotentialBeta":"The native left-minus-cutoff-whole primitive retains both translated endpoints before replacing it by its short oriented interval."}


def coefficients(data,cov):
    rank=sum(cov["coefficientBudget"]["commonGlobalCovarianceRanks"])
    assert rank==26981
    # finite Fourier/Leibniz/radial products, and converting the pure
    # covariance Gaussian to full zeta, are charged by integer ranks.
    all_mean=[r for region in data for rs in region["meanRows"].values() for r in rs]
    all_pair=[r for region in data for rs in region["pairRows"].values() for r in rs]
    mass_mean=max(Q(r["coefficientMass"]) for r in all_mean)
    mass_pair=max(Q(r["coefficientMass"]) for r in all_pair)
    complexity_mean=max(r["geometryPower"] for r in all_mean)
    complexity_pair=max(r["geometryPower"] for r in all_pair)
    mean_charge=rank+mass_mean.__ceil__().bit_length()+complexity_mean*8+32
    pair_charge=2*rank+mass_pair.__ceil__().bit_length()+complexity_pair*8+64
    assert mean_charge<2**15 and pair_charge<2**16
    assert max(Q(r["band"]) for r in all_pair)==30
    min_grade=min(Q(r["epsilon"]) for r in all_pair)
    assert min_grade==2-Q(2,RATE)
    assert 2*Q(1,2**112)+30*Q(1,2**32636)<Q(1,RATE)
    assert factorial(18)<2**53
    return {"meanLogCap":"H/2^113","quadraticLogCap":"H/2^112","meanLogCharge":mean_charge,
            "quadraticLogCharge":pair_charge,"quadraticBeforeAbsorptionEpsilon":str(min_grade),
            "quadraticAfterBandAndCoefficientEpsilon":str(min_grade-Q(1,RATE)),
            "optionalSecondGaussianPoleAbsorption":"Use exp(-1/x^2)*x^-p <= ceil(p/2)! for p<=36, costing at most 2^53."}


def complement(premean,means,branches,mode,cov,finite):
    assert sha256(premean.read_bytes()).hexdigest()==PINS["premean"]
    p=runpy.run_path(str(premean))["record"]
    raw=inspect.getsource(p)
    marker="for order in demands:"
    assert raw.count(marker)==1
    ns={}
    exec(compile(raw.replace(marker,"for order in demands[name]:"),str(premean),"exec"),
         p.__globals__,ns)
    rows,W,_,cutoff,_=ns["record"]({n:sorted((r,z,l) for r,z,t,l in dirs) for n,dirs in means.items()})
    assert max(sum(a[:2]) for _,a in W)==7 and max(sum(a) for a in cutoff)<=6
    assert max(r["geometryPower"] for body in rows.values() for r in body)<=16
    assert max(Q(r["coefficientMass"]) for body in rows.values() for r in body)<2**32
    row_lookup={(name,tuple(x["RZL"])):x for name,body in rows.items() for x in body}
    compact=mode["compactFiveMap"]
    assert compact["compactIndependentOfL"] and compact["compactZeroOnBothSourceCollars"]
    assert compact["linearCompactCovarianceUsesOnlyC7"]
    bound_compact={"v":(1,Q(1,2)),"gamma":(1,Q(1,2)),"beta":(2,Q(7,2))}
    q=[]
    for (name,j),parts in branches.items():
        robust=[]
        for a,k,b,m,_ in parts:
            first=row_lookup[a,(k[0],k[1],k[3])]
            second=row_lookup[b,(m[0],m[1],m[3])]
            eps=Q(first["minEpsilon"])+Q(second["minEpsilon"])
            band=Q(first["bandIntercept"])+Q(second["bandIntercept"])+3*sum(j[:3])
            ceps=bound_compact[a][0]+bound_compact[b][0]
            cband=bound_compact[a][1]+bound_compact[b][1]+3*sum(j[:3])
            robust.append((min(eps,ceps),max(band,cband)))
        q.append({"component":name,"RZT":j[:3],"epsilon":str(min(e for e,s in robust)),
                  "band":str(max(s for e,s in robust)),"weight":"zeta^2","pole":0})
    least=min(Q(r["epsilon"]) for r in q)
    assert least>=2-Q(4,RATE) and max(Q(r["band"]) for r in q)==30,(least,max(Q(r["band"]) for r in q))
    # Over the complement both endpoint distances stay outside the narrow
    # collars. The inverse square of the full Gaussian has the finite cost
    # exp(40960)<2^61440, paid as less than H/2^128 from Bnorm>=2^4096.
    inverse_square_cost=2*(128**2+4*32**2)
    assert inverse_square_cost==40960 and Q(2,3)*61440==inverse_square_cost
    assert 61440*2**129<2**(4096*511)
    uniform_direct=sum(cov["coefficientBudget"]["commonGlobalCovarianceRanks"])+32+16*8+64
    paired=2*max(uniform_direct,compact["compactChargeInHOver2Pow128"])+16
    log_charge=max(paired,finite["quadraticLogCharge"])
    assert log_charge<2**16
    return {"domain":"u>1/128 and d>1/32 on the admitted open annulus",
            "inverseZetaSquareCost":"<2^61440","newUnweightedTemporalCovarianceRows":len(W),
            "mixedTemporalFiveMapHaar":"Exactly zero since FiveMap is torus-independent and normalized Temporal Haar is zero.",
            "compactProductSupport":"e*X0<X<e^2*X0; actual compact field provided by C102 through these mixed derivatives.",
            "allProductRows":q,"conditionalCommonProductLogCap":"H/2^112",
            "commonProductLogChargeInHOver2Pow128":log_charge,
            "minimumEpsilonAcrossComplementProducts":str(least),
            "scope":"The complement plus the two disjoint narrow collars covers the admitted annulus for all 36 requested product jets."}


def main(a):
    d={k:checked(getattr(a,name),k) for k,name in (("signed","signed"),("covariance","covariance"),
        ("initialTemporal","initial_temporal"),("weightedTransfer","weighted_transfer"),("fiveMap","five_map"),
        ("modeOneAttachment","mode_one_attachment"))}
    geom=transfer_geometry(d["signed"],d["fiveMap"],d["weightedTransfer"],d["initialTemporal"])
    means,branches=sigmas(d["signed"]["numericalFrontier"])
    i,o=collar(6,means,branches),collar(9,means,branches)
    assert [i["maximumQuadraticPoleBeforeExtraGaussianUse"],o["maximumQuadraticPoleBeforeExtraGaussianUse"]]==[30,36]
    finite=coefficients((i,o),d["covariance"])
    mid=complement(a.premean,means,branches,d["modeOneAttachment"],d["covariance"],finite)
    assert len(mid["allProductRows"])==36
    grade=Q(mid["minimumEpsilonAcrossComplementProducts"])
    assert grade==Q(199997,100000)
    one_gaussian_log=mid["commonProductLogChargeInHOver2Pow128"]+53
    assert one_gaussian_log<2**16
    uniform={"ordinaryProductRows":36,"allPhysicalRegions":True,
             "coordinates":"Original ordinary (R,Z,T), T=0 for every requested derivative",
             "bandPower":30,"radialPoleWithOneZeta":0,
             "commonCoefficientLogUpper":"H/2^112",
             "commonCoefficientChargeInHOver2Pow128":one_gaussian_log,
             "epsilonBeforeOneBandAndCoefficientDebit":str(grade),
             "epsilonAfterOneBandAndCoefficientDebit":str(grade-Q(1,RATE))}
    result={"schema":"MathScope.C102.SignedNarrowWeightedTemporalMean/1",
            "status":"VERIFIED_ORIGINAL_INITIAL_TEMPORAL_HAAR_QUADRATICS_CONDITIONAL_SAME_CHART_NARROW_COLLARS",
            "pins":PINS,"shortPathGeometry":geom,"inner":i,"outer":o,"logBudget":finite,"complement":mid,
            "uniformSingleGaussianProductBudget":uniform,
            "scope":"All original initialized mean quadratic products needed by C99, on the narrow collars plus their complement. Centered Temporal has zero Haar mean, and FiveMap has zero jets on the narrow collars. The original C99 linear compact terms, Forced covariance, exterior stress and downstream global Sigma require their separate joins.",
            "finalJets":0,"release":"HOLD"}
    a.out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8",newline="\n")
    print(result["logBudget"],i["operationCounts"],o["operationCounts"])


if __name__=="__main__":
    if not __debug__:
        raise RuntimeError("Verification requires assertions.")
    p=ArgumentParser()
    for n in ("signed","covariance","initial-temporal","weighted-transfer","five-map","mode-one-attachment","premean","out"):
        p.add_argument("--"+n,type=Path,required=True)
    main(p.parse_args())
