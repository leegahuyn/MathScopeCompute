"""Replay RZT and ZZT of the original Signed local weighted radial stresses."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import factorial
from pathlib import Path
import runpy

PINS={
    "mixed":"8a6d9bd9fa6c1717380c6255aa45736a67cf42df8b63996fe22b74e27c451804",
    "mixedCode":"36960cdfd627539c36cbb6e453f2cacfd711044b00ca6ebe667cff0b46786710",
    "source":"97c679cc958b0e05f9d2feb19b52efd29c12e54b41fc034c08268e81b1633b12",
    "fields":"bf6d98986f160644071cb72b911a81fab06026729ae6f89636e46afa8dfdba5f",
    "support":"4015850c3f7760bed8dcf86808c31fe4fe77f9203a5639704df9c53aca2184b1",
    "chart":"84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e",
    "demand":"569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b",
}

def read(path,key,as_json=True):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],key
    return json.loads(raw) if as_json else raw

def cutoff_identity(term,add,scale,mul):
    def step(poly):
        shifts=[]
        for atoms,coef in poly.items():
            for j,atom in enumerate(atoms):
                rest=atoms[:j]+atoms[j+1:]
                if atom=="sigma":
                    shifts.append(term(*atoms,multiple=coef))
                elif atom.startswith("chi"):
                    order=int(atom[3:])
                    shifts.append(term(*rest,"sigma","chi"+str(order+1),multiple=coef))
        return add(mul(term("a_n"),poly),*shifts)
    third=step(step(step(term("chi0"))))
    closed=add(term("a_n","a_n","a_n","chi0"),
               term("a_n","a_n","sigma","chi1",multiple=3),
               term("a_n","sigma","chi1",multiple=3),
               term("sigma","chi1"),
               term("a_n","sigma","sigma","chi2",multiple=3),
               term("sigma","sigma","chi2",multiple=3),
               term("sigma","sigma","sigma","chi3"))
    assert third==closed
    assert any("chi3" in m for m in third)  # Omitting this exact slot is detected.
    return sorted([[list(m),str(c)] for m,c in third.items()])

def chain(algebra):
    term,add,scale,mul,diff,L=(algebra[k] for k in ("term","add","scale","mul","derivative","euler"))
    def E(poly):
        return diff(poly,"eta")
    def R(poly):
        return add(mul(term("e"),poly),mul(term("X",multiple=2),diff(poly,"X")))
    def PZ(poly):
        coeff={"a":term("aZ"),"aZ":term("aZZ"),"b":term("bZ"),"c":term("D","b","c",multiple=-1)}
        shifts=[]
        for atoms,value in poly.items():
            for pos,atom in enumerate(atoms):
                if atom in coeff:
                    shifts.append(mul(term(*atoms[:pos],*atoms[pos+1:],multiple=value),coeff[atom]))
        # Weighted pullback of s^-alpha, q, X, eta.
        return add(*shifts,mul(term("b"),L(poly)),mul(term("c"),E(poly)))
    W=term("J:")
    L1,L2,L3=L(W),L(L(W)),L(L(L(W)))
    F=mul(term("a"),L1)
    ZT=PZ(F)
    assert ZT==add(mul(term("aZ"),L1),mul(term("a","b"),L2),mul(term("a","c"),E(L1)))
    RZT=R(ZT)
    assert RZT==PZ(R(F))
    ZZT=PZ(ZT)
    pieces=[
        mul(term("aZZ"),L1),
        mul(add(term("aZ","b",multiple=2),term("a","bZ")),L2),
        mul(term("a","b","b"),L3),
        mul(term("aZ","c",multiple=2),E(L1)),
        mul(term("a","b","c",multiple=2),E(L2)),
        mul(term("a","c","c"),E(E(L1))),
    ]
    assert ZZT==add(*pieces)
    assert all(ZZT!=add(*(pieces[:i]+pieces[i+1:])) for i in range(len(pieces)))
    assert E(L1)==add(L(E(W)),term("D","J:eta",multiple=-1))
    results={}
    for tag,value in (("RZT",RZT),("ZZT",ZZT)):
        requested=set()
        for m in value:
            jet=next(a for a in m if a.startswith("J:"))
            axes=jet.split(":")[1:]
            requested.add(tuple(axes.count(d) for d in ("q","X","eta")))
            assert len(axes)<=3
        results[tag]={"exactFreeJetTerms":len(value),"actualProfileSlots_q_X_eta":sorted(requested),
                      "substitutedPolynomial":sorted([[list(m),str(c)] for m,c in value.items()])}
    return results,cutoff_identity(term,add,scale,mul)

def main(a):
    stress_root=a.goal/"c107/higher-stress-c6"
    mixed_root=a.goal/"c119/signed-local-mixed-time"
    mixed=read(mixed_root/"signed-local-mixed-time.json","mixed")
    mixed_code=mixed_root/"verify_signed_local_mixed_time.py"
    read(mixed_code,"mixedCode",False)
    source=read(stress_root/"higher-stress-c6.json","source")
    fields=read(stress_root/"field-log-bounds-c8.json","fields")
    support=read(stress_root/"support-replay.json","support")
    chart=read(a.goal/"c102/mode-one-attachment/mode-one-attachment.json","chart")["extendedCutoffGeometry"]
    demand=read(a.demand,"demand")
    local_roots=[21999622,22000445]
    assert [row["E"] for row in source["source"]["leading"]]==mixed["originalResiduals"]==local_roots
    assert [row["radialPower"] for row in source["source"]["leading"]]==[2,1]
    assert source["source"]["positive"]["fullHaarResiduals"]==local_roots
    rows=source["source"]["positive"]["rows"]
    assert sorted((r["physicalOrder"],r["component"]) for r in rows)==[(n,m) for n in (1,2,3) for m in ("theta","z")]
    assert all(r["wholeConservativeReduction"]==0 and r["literalExponentInH"]==2*r["physicalOrder"] for r in rows)
    assert len(support["rows"])==6 and {r["exactWholeReduction"] for r in support["rows"]}=={0}
    assert [(r["order"],r["component"]) for r in support["rows"] if r["exteriorZeroAfter"] is None]==[(1,"theta")]
    assert support["etaIndependent"] and support["lowerInnerLogDistance"]=="t1/128"
    assert support["lowerOuterLogGap"]==127
    assert demand["localStressRequests"]==[[0,1,1],[0,2,1],[1,1,1]]
    assert mixed["conditionalCap"]["logCoefficient"]=="H/2^253"
    assert mixed["conditionalCap"]["innerPole"]==6 and mixed["conditionalCap"]["outerPole"]==9
    assert chart["order"]==9 and max(chart["coefficientLog2Ceilings"].values())<256
    assert fields["derivativeOrder"]==8 and fields["logCap"]=="H/2^288"
    assert fields["originalIntegralBoundaries"]==[239,257,275]
    assert all(w["sign"]==-1 for r in fields["rows"] for w in r["fields"].values())
    terminal=source["angularTerminal"]
    assert terminal["fullNativeWholeMomentDifferentiatedAtFixedEndpoints"]
    assert {(i,j) for i in range(4) for j in range(4-i)}<={tuple(r) for r in terminal["ordersDeltaEta"]}
    assert terminal["upper"]=="2^-64000*Xb*zeta*delta^(-3-3*r)"
    assert source["positiveInterior"]["positiveActiveRawProfileOrder"]==8
    assert source["positiveInterior"]["activeEpsilonExponentsN3N2N1"]==[7,5,3]
    assert source["positiveInterior"]["unweightedCoefficientUpper"]=="2^8192*Bnorm*D^2"
    assert source["weightedLocalFlux"]["oppositeGaussianRestored"]
    assert source["weightedLocalFlux"]["sameDisjointNarrowCollars"]=={"inner":"0<u<=1/128","outer":"0<d<=1/32"}
    assert source["weightedLocalFlux"]["complementInverseZetaUpper"]=="2^30720"
    assert source["weightedLocalFlux"]["leadingCollarCoefficientBeforeLogAbsorption"]=="2^4160*Bnorm^8"
    assert source["weightedLocalFlux"]["terminalAndPositiveConservativeGeometryEnvelope"]=="2^8192*Bnorm^16"
    for branch,rel in (
        ("inner","c106/inner-target15/regular-inner-c15.json"),
        ("outer","c106/background16/regular-outer-c15.json"),
    ):
        donor_bytes=(a.goal/rel).read_bytes()
        assert sha256(donor_bytes).hexdigest()==source["pins"][branch]
        donor=json.loads(donor_bytes)
        assert donor["outputDerivativeOrder"]==15
        assert len(donor["ordinaryCapRows"])>=4
        assert all(r["physicalRZTCap"]=="2^4096*Bnorm" for r in donor["ordinaryCapRows"][:4])
    finite_euler=[]
    for table in support["cutoff"]["finiteEulerRows"]:
        assert [r["eulerOrder"] for r in table]==list(range(7))
        vals=[sum(Q(c)*Q(1,64)**j for j,c in enumerate(r["polynomialInSourceH"])) for r in table[:4]]
        finite_euler.append(max(v.__ceil__().bit_length() for v in vals))
    assert max(finite_euler)<128 and len(finite_euler)==3
    operators,third_cutoff=chain(runpy.run_path(str(mixed_code)))
    assert all(q+x+z<=3 for row in operators.values() for q,x,z in row["actualProfileSlots_q_X_eta"])

    # The same log-s composition pays a,b,aZ,bZ,aZZ. Through three
    # derivatives m!, 2^256 and the unchanged s>=1/2 cover each
    # positive chart coefficient. Check coefficient sums of both fully
    # expanded polynomials with e<=2, alpha<=2 and D<=1.
    table=chart["sTaylorBounds"]
    s1,s2,s3=map(Q,table[1:4])
    log_jets=(2*s1,2*s2+2*s1**2,2*s3+4*s1*s2+Q(8,3)*s1**3)
    log_bits=(max(log_jets)*factorial(3)).__ceil__().bit_length()
    assert log_bits<256
    polynomial_mass_bits=max(
        (sum(abs(Q(coeff))*2**(atoms.count("alpha")+atoms.count("e"))
             for atoms,coeff in value["substitutedPolynomial"])).__ceil__().bit_length()
        for value in operators.values()
    )
    assert polynomial_mass_bits<16
    assert max(value["exactFreeJetTerms"] for value in operators.values())==90
    compound_bits=6*256+128+polynomial_mass_bits+64
    assert compound_bits<8192
    assert 4160+compound_bits<16384 and 8+6+2<=32
    assert 8192+compound_bits<16384 and 16+6+2<=32
    assert (16384+64)*2**258 < 2**(4096*510)
    assert Q(1,2**253)+Q(1,2**256)<Q(1,2**252)
    # Conservative collar slope tests for the actual maximal pole 12.
    u,d,t,w=Q(1,128),Q(1,32),Q(1,128),Q(2)
    assert 12*u*u+8*t*(u/(w-t*u))**3<1
    assert 12*d*d+2*t*t*(d/(w-d))**3<4
    regions={"inner":{"pole":9},"outer":{"pole":12},"middle":{"pole":0}}
    exact_rows=[
        {"direction":[1,1,1],"epsilonGrade":"1","band":"0","gaussian":"zeta","innerPole":9,"outerPole":12,"middlePole":0,"logCoefficient":"H/2^252"},
        {"direction":[0,2,1],"epsilonGrade":"1","band":"0","gaussian":"zeta","innerPole":9,"outerPole":12,"middlePole":0,"logCoefficient":"H/2^252"},
    ]
    result={
        "schema":"MathScope.C125.OriginalSignedLocalRZTZZT/1",
        "status":"VERIFIED_ORIGINAL_LOCAL_STRESS_CHAIN_CONDITIONAL_WEIGHTED_RZT_ZZT",
        "pins":PINS,"originalResiduals":local_roots,
        "originalSourceStreamSHA256":source["source"]["stream"]["sha256"],
        "sourceRoots":[[r["physicalOrder"],r["component"],r["sourceValue"]] for r in rows],
        "fixedWholeMomentCount":6,"operators":operators,"thirdEulerCutoffPolynomial":third_cutoff,
        "finiteEulerDyadicCeilings":finite_euler,"mixedLogSJetDyadicCeiling":log_bits,
        "conditionalCap":{"directions":[[1,1,1],[0,2,1]],"epsilon":"1","band":"0",
                          "gaussian":"zeta","innerPole":9,"outerPole":12,"middlePole":0,
                          "logCoefficient":"H/2^252"},
        "conditionalRows":exact_rows,"conditionalRadialRegions":regions,
        "scope":"Same local weighted radial flux inside original Signed source before centering. Original fixed-label physical chart, analytic profiles, six whole-moment identities, retained reflected primitives and original flat extensions are assumed.",
        "fullSigmaMixedTime":"OPEN","finalJets":0,"release":"HOLD",
    }
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS exact local RZT/ZZT", [s["exactFreeJetTerms"] for s in operators.values()], "grade 1 poles 9/12/0")

if __name__=="__main__":
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for name in ("goal","demand","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
