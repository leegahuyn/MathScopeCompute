"""Original noncompact Temporal through two T derivatives on retained collars."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
from math import comb, factorial
from pathlib import Path
import json
import runpy


PINS={
    "c103Program":("goal","c103/initialized-mean/verify_initialized_mean.py","7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe"),
    "c103":("goal","c103/initialized-mean/initialized-mean.json","c6f1aaf7d81c4810c5d72671357eacf7caf7f50904fe6e4a62582b6ee29f1cb8"),
    "premean":("work","continuation97/middle-covariance/premean/final/verify_premean_whole_path.py","0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f"),
    "weightedProgram":("work","continuation102/signed-weighted-mean/final/verify_signed_weighted_initial_mean.py","e04b53553c683588dafc94d0e93744f39f9483fa376f8ab1a3557d4e6e477f87"),
    "weighted":("work","continuation102/signed-weighted-mean/final/signed-weighted-mean.json","6c9830a81a121c0b1cbd76c1a06cc9bc87774f22ba694cfb8ccb4da5fa4f7f26"),
    "covariance":("work","continuation98/covariance/final/global-primary-covariance.json","05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e"),
    "paths":("work","continuation110/k1-path-compacts/final/k1-path-compacts.json","32004b3c7de4b1ac526852301c180db649601785e578f3074f8ee3eae72657f0"),
    "directionalInverse":("work","continuation110/k1-analytic-seams/final/directional-inverse-seams.json","0e3821bd9a51f8961153416df12af8c4f0dcc5327a624daa781040532e6d3865"),
    "potential":("runtime","source-temporal-potential.mjs","c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8"),
    "temporal":("runtime","source-global-temporal.mjs","16c13ea7a6ba49f78514e1c2a94e29499086e3b11c463e07f6513b8e31f32f1b"),
    "pressure":("runtime","source-global-pressure.mjs","c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4"),
    "shift":("runtime","source-pressure.mjs","fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f"),
    "current":("runtime","source-global-current.mjs","b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36"),
}
NAMES=("beta","v","gamma")


def pin(roots,key):
    root,relative,digest=PINS[key]
    path=roots[root]/relative
    assert sha256(path.read_bytes()).hexdigest()==digest,(key,path)
    return path


def audit_source(d):
    for key,text in [
        ("shift","G.simultaneousSubstitute(body,[R,...Y],[r,...shiftedY])"),
        ("shift","left=G.integral(integrand,r,innerRadius,R),whole=G.integral(integrand,r,innerRadius,outerRadius)"),
        ("shift","fixed-band-radial-shift-independent-of-Z-T-Y"),
        ("current","global-radial-envelope-fixed-in-slow-calculus"),
        ("pressure","normalizedTemporalOperator:'-epsilon*partial_T+ci0*N'"),
        ("potential","cutoffRemainder=G.div(G.mul(G.derivative(chi,R),integrals.whole),R)"),
        ("potential","beta=G.neg(Dz(psi)),gamma=De(psi,1)"),
        ("temporal","exactInverseEquation:'N inverse = actual E - normalized Haar mean(actual E)'"),
    ]:
        assert text in d[key]
    density=d["paths"]["nativeMeanDensity"]
    assert (density["fixedLower"],density["fixedUpper"])==(17743711,17743713)
    source=d["directionalInverse"]["source"]
    assert source["commonTorusArguments"]==[17745430,17745431]
    assert source["originalInitialCenteredSources"]==[17754253,17754268]
    assert source["radialDerivativeOfShift"]==17745446
    assert d["c103"]["counts"]["oldWithSlowTime"]==51
    geometry=d["weighted"]["shortPathGeometry"]
    assert geometry["fullOppositeGaussianKept"]
    assert geometry["maxPrimitiveInputPole"]==512
    assert Q(geometry["innerDerivativeLower"])>1 and Q(geometry["outerDerivativeLower"])>4


def derivative(poly):
    return {power-1:p*power for power,p in poly.items() if power}


def audit_moving_faces():
    # Exact monomials test second Leibniz at a(T)=T^2, fixed upper R.
    # Evaluate just the moving end polynomial −T^q*(T^2)^(p+1)/(p+1).
    for p,q in product(range(4),repeat=2):
        n=q+2*(p+1)
        direct=derivative(derivative({n:-Q(1,p+1)}))
        terms=Counter()
        if q>=2:
            terms[n-2]-=Q(q*(q-1),p+1)
        if q:
            terms[n-2]-=4*q
        if p:
            terms[n-2]-=4*p
        terms[n-2]-=2
        assert direct==dict(terms)
    # Give the boundary-sensitive negative control f=1, a=T^2.
    assert derivative(derivative({2:-1}))=={0:-2}
    return {"exactPolynomialChecks":16,"constantNonFlatControl":"-2",
            "movingLowerTerms":"-2*a_T*f_T(a)-a_T^2*f_R(a)-a_TT*f(a)",
            "movingUpperTerms":"+2*b_T*f_T(b)+b_T^2*f_R(b)+b_TT*f(b)"}


def collar(table,base,requests):
    add, scale, summary, shift=(table[n] for n in ("add","scale","summary","shift"))
    RATE=table["RATE"]
    cov=set()
    inverse=set()
    primitives=set()
    max_pole=[0]

    @cache
    def geometry(f,a,exponent,inside=False):
        r,z,t,l=a
        getter=primitive if inside else calc
        return add(*(scale(getter(f,(r-k,z,t,l)),g=1,c=comb(r,k)*factorial(k))
                     for k in range(r+1) if exponent==-1 or k<=1))

    @cache
    def primitive(f,a):
        r,z,t,l=a
        primitives.add((f,a))
        if not r:
            rows=calc(f,a)
            high=max(row[2] for row in rows)
            max_pole[0]=max(max_pole[0],high)
            assert high<=512 and min(row[2] for row in rows)>=3
            return scale(rows,p=-3,g=1)
        return add(calc(f,(r-1,z,t,l)),
                   *(scale(primitive(f,(k,z,t,l+1)),e=-1,g=1,c=comb(r-1,k)) for k in range(r)))

    @cache
    def calc(f,a):
        r,z,t,l=a
        j=r+z+t
        if f.startswith("W_"):
            cov.add((f,a))
            return {(RATE,Q(1,2)+3*j,base+3*j,0):Q(1)}
        if f=="pressure_density":
            return add(geometry("W_rr",shift(a,1),-1),scale(calc("W_rz",shift(a,1,2)),e=RATE),
                       geometry("W_thetatheta",shift(a,1),-1))
        if f=="pressureZ":
            return add(calc("W_rr",shift(a,1)),primitive("pressure_density",a))
        if f in ("Etheta","Ez"):
            radial,axial,e=("W_rtheta","W_thetaz",2) if f=="Etheta" else ("W_rz","W_zz",1)
            terms=[calc(radial,shift(a,0)),scale(geometry(radial,a,-1),c=e),scale(calc(axial,shift(a,1)),e=RATE)]
            terms.extend(scale(calc(radial,(r-k,z,t,l+1)),e=-1,g=1,c=comb(r,k)) for k in range(r+1))
            if f=="Ez":
                terms.append(scale(calc("pressureZ",a),e=RATE))
            return add(*terms)
        if f in ("v","gamma"):
            g="Etheta" if f=="v" else "Ez"
            b=shift(a,3,2)
            inverse.update(((g,a),(g,b)))
            return scale(add(scale(calc(g,a),c=Q(85,6)),scale(calc(g,b),c=Q(85,216))),s=1,c=48)
        if f=="Rgamma_Z":
            return geometry("gamma",shift(a,1),1)
        assert f=="beta"
        return scale(geometry("Rgamma_Z",a,-1,True),e=RATE)

    rows=[]
    for f,a in requests:
        summary_row=summary(calc(f,a))
        assert summary_row["pole"]==base+3+3*sum(a[:3])
        rows.append({"field":f,"RZTL":a,**summary_row})
    return rows,cov,inverse,primitives,max_pole[0]


def mass_bits(value):
    q=Q(value)
    return ((q.numerator+q.denominator-1)//q.denominator).bit_length()


def main(a):
    roots=vars(a)
    d={}
    for key in PINS:
        path=pin(roots,key)
        d[key]=runpy.run_path(str(path)) if path.suffix==".py" else json.loads(path.read_bytes()) if path.suffix==".json" else path.read_text(encoding="utf-8")
    audit_source(d)
    directions=sorted(a for a in product(range(2),range(2),range(3),range(2)) if a[0]+a[1]+a[3]<=1)
    requests=[(f,a) for f in NAMES for a in directions]
    assert len(requests)==36 and sum(x[1][2]==2 for x in requests)==12
    assert ("beta",(0,1,2,0)) in requests
    inner=collar(d["weightedProgram"],6,requests)
    outer=collar(d["weightedProgram"],9,requests)
    assert inner[1:-1]==outer[1:-1]
    direct,tables=d["c103Program"]["whole_recipe"](d["premean"])
    whole_rows=[{"field":f,"RZTL":a,**direct(f,a)} for f,a in requests]
    all_sources=set(tables[0])|inner[1]
    max_slow=max(sum(a[:3]) for _,a in all_sources)
    max_l=max(a[3] for _,a in all_sources)
    max_time=max(a[2] for _,a in all_sources)
    assert (max_slow,max_time)==(6,2) and max_l<=8
    assert {(f,b) for f,b in all_sources if sum(b[:3])==6}<={("W_rz",(0,4,2,l)) for l in range(9)}
    w=d["covariance"]["ordinaryDerivativeBudget"]
    assert w["mixedDirections"]==1080
    for f,b in all_sources:
        j=sum(b[:3])
        row=w["radialRows"][j]
        assert row["slowOrder"]==j and Q(row["exactBandPower"])==Q(1,2)+3*j
        assert row["innerPole"]==6+3*j and row["outerPole"]==9+3*j
    rank=sum(d["covariance"]["coefficientBudget"]["commonGlobalCovarianceRanks"])
    assert rank==26981
    charge_collar=max(rank+mass_bits(row["coefficientMass"])+8*row["geometryPower"]+32 for row in inner[0]+outer[0])
    charge_middle=max(rank+mass_bits(row["coefficientMass"])+8*row["geometryPower"]+33 for row in whole_rows)
    assert max(charge_collar,charge_middle)<2**15
    assert max(map(sum,tables[2]))<=9
    grades={n:str(min([Q(r["epsilon"]) for r in inner[0] if r["field"]==n]+
                      [Q(r["minEpsilon"]) for r in whole_rows if r["field"]==n])) for n in NAMES}
    report={"schema":"MathScope.C116.OriginalNoncompactTemporalTwoTimeDerivatives/1",
            "status":"ORIGINAL_FIXED_PATH_T2_WITH_CONDITIONAL_PRIMARY_C98_AND_ORDINARY_INVERSE",
            "pins":{key:value[2] for key,value in PINS.items()},
            "movingBoundaryAudit":audit_moving_faces(),
            "roots":{"fixedRadialLimits":[17743711,17743713],"centeredSources":[17754253,17754268],
                     "shiftArguments":[17745430,17745431],"shiftRadialDerivative":17745446},
            "directionBasis":["R","Z","T","L"],
            "sameBodyPrimaryDerivativeCoverage":{"allExactSources":sorted(all_sources),"maxSlow":max_slow,
                    "maxTransverse":max_l,"maxT":max_time,"upperC98Slow":7,"upperC98L":8,
                    "requiresHighPrimaryOrPostForced":False},
            "requestedNoncompactDirections":requests,
            "innerRows":inner[0],"outerRows":outer[0],
            "wholeFixedPathRows":whole_rows,
            "wholeCutoffRows":sorted(tables[2]),
            "collars":{"maxPrimitiveInputPoles":[inner[4],outer[4]],"shortPrimitiveCounts":[len(inner[3]),len(outer[3])],
                       "exactInversePairs":sorted(inner[2]),"zeta":"one full original zeta",
                       "scope":"Original flat shell and original narrow plateau of chi. T differentiation commutes with fixed shifts and fixed radial endpoints before shortening the interval."},
            "combined":{"epsilonByField":grades,"conditionalLogCap":"H/2^113",
                        "coefficientRanksInHOver2Pow128":[charge_collar,charge_middle],
                        "middleWeight":"One original zeta restored with the same original complement inverse bound; both fixed intervals and the original chi_R remain."},
            "open":"Compact FiveMap T2, the whole Signed time estimate, protected Repeat closure, and final jet gates remain separate.",
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(report,indent=2,ensure_ascii=False)+"\n").encode())
    print(f"PASS 36 noncompact Temporal rows (12 T2), maximum seed derivatives slow={max_slow}, L={max_l}; all in C98")


if __name__=="__main__":
    p=ArgumentParser()
    for k in ("work","goal","runtime","out"):
        p.add_argument(f"--{k}",type=Path,required=True)
    main(p.parse_args())
