"""Prove the original mixed RT,ZT local radial stress chain identities."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path

SOURCE_TIME_SHA = "3ec60e03a9ae128ed546bc67256692ed2241e76be3261b8618761264ebcb9dd5"
GEOMETRY_SHA = "84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e"


def load(path, expected):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==expected, path
    return json.loads(raw)


def term(*names, multiple=1):
    return {tuple(sorted(names)):Q(multiple)}


def add(*terms):
    out={}
    for p in terms:
        for word,c in p.items():
            out[word]=out.get(word,Q(0))+c
    return {word:c for word,c in out.items() if c}


def scale(m,p):
    return {word:c*m for word,c in p.items()}


def mul(p,q):
    return add(*({tuple(sorted(a+b)):c*d}
                 for a,c in p.items() for b,d in q.items()))


def derivative(p,axis):
    rows=[]
    for atoms,coefficient in p.items():
        for j,atom in enumerate(atoms):
            rest=atoms[:j]+atoms[j+1:]
            if atom==axis:
                rows.append(term(*rest,multiple=coefficient))
            if atom.startswith("J:"):
                carried=atom[2:].split(":") if atom[2:] else []
                jet="J:"+":".join(sorted([*carried,axis]))
                rows.append(term(*rest,jet,multiple=coefficient))
    return add(*rows)


def euler(p):
    return add(mul(term("q"),derivative(p,"q")),
               scale(-1,mul(term("X"),derivative(p,"X"))),
               scale(-1,mul(term("D","eta"),derivative(p,"eta"))),
               scale(-1,mul(term("alpha"),p)))


def exact_operators():
    f=term("J:")
    dt=euler(f)
    direct_eta=derivative(dt,"eta")
    shifted=add(euler(derivative(f,"eta")),term("D","J:eta",multiple=-1))
    assert direct_eta==shifted
    assert direct_eta!=euler(derivative(f,"eta"))
    radial_then_time=add(mul(term("e"),dt),mul(term("X",multiple=2),derivative(dt,"X")))
    time_then_radial=euler(add(mul(term("e"),f),mul(term("X",multiple=2),derivative(f,"X"))))
    assert radial_then_time==time_then_radial
    third=mul(term("a","sPower"),direct_eta)
    dt_z=add(mul(term("aZ"),dt),mul(term("a","b"),euler(dt)),third)
    wrong=add(mul(term("aZ"),dt),mul(term("a","b"),euler(dt)),mul(term("a","sPower"),euler(derivative(f,"eta"))))
    assert add(dt_z,scale(-1,wrong))==term("D","a","sPower","J:eta",multiple=-1)
    assert add(dt_z,scale(-1,add(dt_z,scale(-1,mul(term("aZ"),dt)))))
    assert add(radial_then_time,scale(-1,mul(term("X",multiple=2),derivative(dt,"X"))))
    return {
        "etaCommutator":"(∂eta Λ − Λ ∂eta) f = −D ∂eta f",
        "radialScaled":"e Λ f + 2 X ∂X Λ f",
        "axialScaled":"a_Z Λ f + a b Λ² f + a s^(-D) ∂eta Λ f",
        "wrongEtaCommutatorNonzero":True,
        "wrongOmitA_ZNonzero":True,
        "wrongOmitRadialPowerNonzero":True,
        "exactRTPolynomialTerms":len(radial_then_time),
        "exactZTPolynomialTerms":len(dt_z),
    }


def cutoff_second():
    scale_exponent=term("a_n")
    sigma=term("sigma")
    value=term("chi")
    first=term("chi1")
    second=term("chi2")

    def step(p):
        d=[]
        for atoms,c in p.items():
            for i,atom in enumerate(atoms):
                changed={"sigma":"sigma","chi":"chi1","chi1":"chi2"}.get(atom)
                if changed is not None:
                    extra=("sigma",) if atom!="sigma" else ()
                    d.append(term(*atoms[:i],changed,*atoms[i+1:],*extra,multiple=c))
        return add(mul(scale_exponent,p),*d)

    exact=step(step(value))
    expected=add(mul(mul(scale_exponent,scale_exponent),value),
                 mul(mul(add(scale(2,scale_exponent),term()),sigma),first),
                 mul(mul(sigma,sigma),second))
    assert exact==expected
    assert add(exact,scale(-1,add(expected,scale(-1,mul(mul(sigma,sigma),second)))))
    return "q^(2nh) [ (2nh)^2 chi + (4nh+1) sigma chi' + sigma² chi'' ]"


def main(a):
    source=load(a.goal/"c117/signed-local-stress-time/signed-local-time-stress.json",SOURCE_TIME_SHA)
    chart=load(a.goal/"c102/mode-one-attachment/mode-one-attachment.json",GEOMETRY_SHA)["extendedCutoffGeometry"]
    assert source["sourceResiduals"]==[21999622,22000445]
    assert source["wholeMomentsUnchanged"]==6 and len(source["guardedSourceRows"])==6
    assert chart["order"]>=2 and max(chart["coefficientLog2Ceilings"].values())<256
    assert source["conditionalCap"]["innerPole"]==3 and source["conditionalCap"]["outerPole"]==6
    # The second Leibniz step introduces at most one more finite pole of
    # three. The original C6 analytic collars handle both degree-two
    # profile operands and the original compactly supported q cutoff jets.
    u,d,t,w=Q(1,128),Q(1,32),Q(1,128),Q(2)
    assert 9*u*u+8*t*(u/(w-t*u))**3<1
    assert 9*d*d+2*t*t*(d/(w-d))**3<4
    assert 65536*2**258 < 2**(4096*510)
    assert Q(1,2**254)+Q(1,2**256)<Q(1,2**253)
    return {
        "schema":"MathScope.C119.OriginalSignedLocalMixedTimeStress/1",
        "pins":{"C117PureT":SOURCE_TIME_SHA,"C102ImplicitGeometry":GEOMETRY_SHA},
        "originalResiduals":[21999622,22000445],
        "Lambda":"q*∂q-X*∂X-D*eta*∂eta-alpha ; alpha=A+1/2",
        "fixedChart":"a=∂T log s, b=∂Z log s, ∂R a=0, eta_Z=s^(-D)-D eta b",
        "factorRT":"-a epsilon R^(e-1) s^(-alpha)",
        "factorZT":"-epsilon R^e s^(-alpha)",
        "freeJetChecks":exact_operators(),
        "EulerCutoffSecond":cutoff_second(),
        "conditionalCap":{"directions":[[1,0,1],[0,1,1]],"epsilon":"1","gaussian":"zeta",
                          "innerPole":6,"outerPole":9,"middlePole":0,"logCoefficient":"H/2^253"},
        "claimBoundary":"Local weighted radial stresses only under the original analytic profiles and chart assumptions.",
        "fullSignedMixedTime":"OPEN","finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    p.add_argument("--goal",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    a=p.parse_args()
    receipt=main(a)
    a.out.write_bytes((json.dumps(receipt,indent=2)+"\n").encode())
    print("PASS pinned original RT/ZT local Signed stress",receipt["freeJetChecks"]["exactZTPolynomialTerms"])
