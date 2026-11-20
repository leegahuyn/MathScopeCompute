"""Verify the four higher native Signed local stress derivatives."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path
import runpy

PINS={
    "scope":"79d91f601780ea4bf9696927d60529f5ce11cfc868fafa1d0193ada978b37d36",
    "prior":"31834de8587e52da76dbe98dc4c97065846097f9a1fd5b39a4d13f568252833c",
    "algebra":"36960cdfd627539c36cbb6e453f2cacfd711044b00ca6ebe667cff0b46786710",
    "stress":"97c679cc958b0e05f9d2feb19b52efd29c12e54b41fc034c08268e81b1633b12",
    "fields":"bf6d98986f160644071cb72b911a81fab06026729ae6f89636e46afa8dfdba5f",
    "support":"4015850c3f7760bed8dcf86808c31fe4fe77f9203a5639704df9c53aca2184b1",
    "chart":"84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e",
    "slab":"4d9c3154390b57f5ac498ef90dbce34d22ae45171a830cfb70a8a3af5a67bd46",
}
DIRECTIONS=((0,3,1),(0,4,1),(1,2,1),(1,3,1))

def read(path,key,as_json=True):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],key
    return json.loads(raw) if as_json else raw

def power(poly,n,mul,term):
    out=term()
    for _ in range(n):
        out=mul(poly,out)
    return out

def stress_chains(alg,prior):
    term,add,scale,mul,diff,L=(alg[k] for k in ("term","add","scale","mul","derivative","euler"))
    a_b={x+"Z"*i:term(x+"Z"*(i+1)) for x in ("a","b") for i in range(5)}

    def rules(poly,carried):
        out=[]
        for atoms,coeff in poly.items():
            for j,x in enumerate(atoms):
                if x in carried:
                    rest=atoms[:j]+atoms[j+1:]
                    out.append(mul(term(*rest,multiple=coeff),carried[x]))
        return add(*out)

    def E(poly):
        return diff(poly,"eta")

    def apply_R(poly):
        return add(mul(term("e"),poly),mul(term("X",multiple=2),diff(poly,"X")))

    def apply_Z(poly):
        return add(rules(poly,{**a_b,"c":term("D","b","c",multiple=-1)}),
                   mul(term("b"),L(poly)),mul(term("c"),E(poly)))

    def normal_step(groups):
        out={}
        for (p,j),coef in groups.items():
            for key,poly in (((p,j),rules(coef,a_b)),((p+1,j),mul(term("b"),coef)),((p,j+1),coef)):
                out[key]=add(out.get(key,{}),poly)
        return {k:poly for k,poly in out.items() if poly}

    W=term("J:")
    lp=[W]
    for _ in range(5):
        lp.append(L(lp[-1]))
    direct=[mul(term("a"),lp[1])]
    normal=[{(1,0):term("a")}]
    for _ in range(4):
        direct.append(apply_Z(direct[-1]))
        normal.append(normal_step(normal[-1]))
    assert E(lp[1])==add(L(E(W)),term("D","J:eta",multiple=-1))
    for poly,groups in zip(direct,normal,strict=True):
        terms=[]
        for (p,j),coef in groups.items():
            body=lp[p]
            for _ in range(j):
                body=E(body)
            terms.append(mul(mul(power(term("c"),j,mul,term),coef),body))
        assert add(*terms)==poly
    def encoded(poly):
        return sorted([[list(atoms),str(coef)] for atoms,coef in poly.items()])
    assert encoded(apply_R(direct[1]))==prior["operators"]["RZT"]["substitutedPolynomial"]
    assert encoded(direct[2])==prior["operators"]["ZZT"]["substitutedPolynomial"]
    report=[]
    for r,z,t in DIRECTIONS:
        p=apply_R(direct[z]) if r else direct[z]
        if r:
            alternate=apply_R(direct[0])
            for _ in range(z):
                alternate=apply_Z(alternate)
            assert p==alternate
        coefficient_atom="a"+"Z"*z
        shortened={m:c for m,c in p.items() if coefficient_atom not in m}
        assert shortened and shortened!=p
        requested=set()
        for atoms in p:
            [label]=[x for x in atoms if x.startswith("J:")]
            axes=label.split(":")[1:]
            requested.add(tuple(axes.count(x) for x in ("q","X","eta")))
        assert max(q+x+y for q,x,y in requested)==r+z+t
        assert max(q for q,_,_ in requested)==z+t
        slots={str(k):sum(v.count(k) for v in p) for k in ("D","alpha","e","q","X","eta")}
        mass=sum(abs(c)*2**(m.count("alpha")+m.count("e")) for m,c in p.items())
        mass_bits=mass.__ceil__().bit_length()
        assert mass_bits<24
        normal_rows=[{"LambdaPower":h,"etaPower":j,"coefficient":encoded(c)}
                     for (h,j),c in sorted(normal[z].items())]
        report.append({"direction":[r,z,t],"normalOrderedTerms":normal_rows,
                       "radialOperatorApplied":bool(r),"exactFreeJetTerms":len(p),
                       "polynomialMassBits":mass_bits,"profileSlots_q_X_eta":sorted(requested),
                       "maxEulerOrder":z+t,"maxOriginalProfileOrder":r+z+t,
                       "highestLogSJetRetained":coefficient_atom,"atomOccurrences":slots,
                       "freeJetPolynomial":encoded(p)})
    return report

def cutoff_euler():
    # Keys are (power of 2nh, power of sigma, order of chi).
    def step(p):
        out=Counter()
        for (a,s,k),v in p.items():
            out[a+1,s,k]+=v
            out[a,s,k]+=s*v
            out[a,s+1,k+1]+=v
        return +out
    order=[Counter({(0,0,0):1})]
    stirling=[{0:1}]
    for n in range(1,6):
        order.append(step(order[-1]))
        stirling.append({k:k*stirling[-1].get(k,0)+stirling[-1].get(k-1,0) for k in range(n+1)})
        independent=Counter({(n-m,k,k):comb(n,m)*v
                             for m in range(n+1) for k,v in stirling[m].items() if v})
        assert order[-1]==independent
        assert order[-1][0,n,n]==1
        assert order[-1][n,0,0]==1
    return [[[*k,v] for k,v in sorted(poly.items())] for poly in order]

def chart_log_majorant(chart):
    order=5
    s=[Q(0),*map(Q,chart["sTaylorBounds"][1:order+1])]
    def product_poly(p,q):
        return [sum(p[i]*q[j-i] for i in range(j+1)) for j in range(order+1)]
    v=[Q(1)]+[Q(0)]*order
    log=[Q(0)]*(order+1)
    for k in range(1,order+1):
        v=product_poly(v,s)
        log=[u+Q(2**k,k)*w for u,w in zip(log,v,strict=True)]
    bits=[(factorial(j)*m).__ceil__().bit_length() for j,m in enumerate(log)]
    assert chart["order"]>=5 and max(bits)<256
    return bits

def main(a):
    goal=a.goal
    c107=goal/"c107/higher-stress-c6"
    dep=read(a.dependencies,"scope")
    prior=read(a.prior_local,"prior")
    stress=read(c107/"higher-stress-c6.json","stress")
    support=read(c107/"support-replay.json","support")
    fields=read(c107/"field-log-bounds-c8.json","fields")
    slab=read(goal/"c120/whole-k-order-support/whole-k-order-support.json","slab")
    chart=read(goal/"c102/mode-one-attachment/mode-one-attachment.json","chart")["extendedCutoffGeometry"]
    algebra=goal/"c119/signed-local-mixed-time/verify_signed_local_mixed_time.py"
    read(algebra,"algebra",False)
    assert set(map(tuple,dep["newLocalStressDirections"]))==set(DIRECTIONS)
    assert dep["fixedEndpoints"]==[17743711,17743713]
    assert prior["originalResiduals"]==[r["E"] for r in stress["source"]["leading"]]==[21999622,22000445]
    assert [r["radialPower"] for r in stress["source"]["leading"]]==[2,1]
    assert prior["originalSourceStreamSHA256"]==stress["source"]["stream"]["sha256"]
    rows=stress["source"]["positive"]["rows"]
    assert len(rows)==len(support["rows"])==prior["fixedWholeMomentCount"]==6
    assert all(r["wholeConservativeReduction"]==0 and r["literalExponentInH"]==2*r["physicalOrder"] for r in rows)
    assert {r["exactWholeReduction"] for r in support["rows"]}=={0} and support["etaIndependent"]
    assert [(r["order"],r["component"]) for r in support["rows"] if r["exteriorZeroAfter"] is None]==[(1,"theta")]
    assert support["lowerInnerLogDistance"]=="t1/128" and support["lowerOuterLogGap"]==127
    assert slab["background"]["exactB1ThroughB4TimesQBig"]==[1,16,32,64]
    assert slab["background"]["allHigherOrdersExactlyFlatZeroFrom"]==4 and Q(1,16)<Q(1,2)
    terminal=stress["angularTerminal"]
    assert terminal["fullNativeWholeMomentDifferentiatedAtFixedEndpoints"]
    assert {tuple(x) for x in terminal["ordersDeltaEta"]}=={(i,j) for i in range(7) for j in range(7-i)}
    assert terminal["upper"]=="2^-64000*Xb*zeta*delta^(-3-3*r)"
    assert fields["derivativeOrder"]==8 and fields["logCap"]=="H/2^288"
    assert all(row["sign"]==-1 for r in fields["rows"] for row in r["fields"].values())
    assert fields["originalIntegralBoundaries"]==[239,257,275]
    assert stress["positiveInterior"]["unweightedCoefficientUpper"]=="2^8192*Bnorm*D^2"
    weighted=stress["weightedLocalFlux"]
    assert weighted["leadingCollarCoefficientBeforeLogAbsorption"]=="2^4160*Bnorm^8"
    assert weighted["terminalAndPositiveConservativeGeometryEnvelope"]=="2^8192*Bnorm^16"
    assert weighted["complementInverseZetaUpper"]=="2^30720" and weighted["oppositeGaussianRestored"]
    assert weighted["sameDisjointNarrowCollars"]=={"inner":"0<u<=1/128","outer":"0<d<=1/32"}
    for key,rel in (("inner","c106/inner-target15/regular-inner-c15.json"),
                    ("outer","c106/background16/regular-outer-c15.json")):
        raw=(goal/rel).read_bytes()
        assert sha256(raw).hexdigest()==stress["pins"][key]
        donor=json.loads(raw)
        assert donor["outputDerivativeOrder"]==15 and len(donor["ordinaryCapRows"])>=6
        assert all(r["physicalRZTCap"]=="2^4096*Bnorm" for r in donor["ordinaryCapRows"][:6])
    euler=[]
    for table in support["cutoff"]["finiteEulerRows"]:
        assert [row["eulerOrder"] for row in table]==list(range(7))
        coeffs=[sum(Q(v)*Q(1,64)**j for j,v in enumerate(row["polynomialInSourceH"])) for row in table[:6]]
        euler.append([v.__ceil__().bit_length() for v in coeffs])
    assert len(euler)==3 and max(max(r) for r in euler)<128
    chains=stress_chains(runpy.run_path(str(algebra)),prior)
    assert [x["exactFreeJetTerms"] for x in chains]==[295,849,200,653]
    assert [x["polynomialMassBits"] for x in chains]==[12,16,11,15]
    third_to_fifth=cutoff_euler()
    chart_bits=chart_log_majorant(chart)
    assert chart_bits==[0,6,17,30,43,57]
    # Same positive atoms as in C107's common order-six composition.
    # Use its larger finite geometry reserve and independently charge
    # the exact fifth-order word length and absolute monomial sums.
    extra=10*256+128+max(x["polynomialMassBits"] for x in chains)+64
    assert extra+8192<16384 and 16+10+2<=32
    assert extra+4160<16384 and 8+10+2<=32
    assert (16384+64)*2**258<2**(4096*510)
    assert Q(1,2**253)+Q(1,2**256)<Q(1,2**252)
    u,d,tu,w=Q(1,128),Q(1,32),Q(1,128),Q(2)
    assert 18*u*u+8*tu*(u/(w-tu*u))**3<1
    assert 18*d*d+2*tu*tu*(d/(w-d))**3<4
    result={
        "schema":"MathScope.C127.OriginalSignedLocalHigherMixedTime/1",
        "status":"VERIFIED_EXACT_NATIVE_SOURCE_AND_CHAIN_CONDITIONAL_WEIGHTED_LOCAL_FLUX",
        "pins":PINS,"originalResiduals":prior["originalResiduals"],
        "originalSourceStreamSHA256":prior["originalSourceStreamSHA256"],
        "retainedNativeHigherSources":[[x["physicalOrder"],x["component"],x["sourceValue"]] for x in rows],
        "fixedWholeMomentCount":6,"fixedEndpoints":dep["fixedEndpoints"],"analyticTerminalProfileMaxDerivative":6,
        "highestNeededPrimitiveProfileDerivative":5,"chartLogSMixedDerivativeBitCaps":chart_bits,
        "cutoffWeightedEulerPolynomials":third_to_fifth,"originalCutoffEulerMajorantDyadicBits":euler,
        "chainRows":chains,
        "conditionalRows":[{"direction":a,"epsilonGrade":"1","band":"0","gaussian":"zeta",
                            "innerPole":3*sum(a),"outerPole":3+3*sum(a),"middlePole":0,
                            "logCoefficient":"H/2^252"} for a in DIRECTIONS],
        "scope":"Original local weighted radial flux before centering. Fixed label, inverse chart, original smooth profile and flat seam hypotheses, exact fixed endpoint whole moments and terminal backward primitive.",
        "fullSigmaHigherMixedTime":"OPEN","finalJets":0,"release":"HOLD"
    }
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS original higher Signed local stresses",
          [(tuple(r["direction"]),r["exactFreeJetTerms"],r["maxEulerOrder"]) for r in chains])

if __name__=="__main__":
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for name in ("goal","dependencies","prior-local","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
