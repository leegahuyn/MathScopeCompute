"""Bind the first native-T derivative of the original local Signed stress."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path

PINS = {
    "band": "a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b",
    "current": "b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36",
    "stress": "97c679cc958b0e05f9d2feb19b52efd29c12e54b41fc034c08268e81b1633b12",
    "chart": "25144d0df386b7522ac5076696aa78feadc1bee9c7188ab8847a9efaae4a6596",
    "fields": "bf6d98986f160644071cb72b911a81fab06026729ae6f89636e46afa8dfdba5f",
    "implicit": "84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e",
}


def pin(key, path):
    body = path.read_bytes()
    assert sha256(body).hexdigest() == PINS[key], (key,path)
    return body.decode()


def sparse(index, weight=1):
    # Independent symbols alpha,D and a monomial number for each live source
    # column (value, q, X, eta). The common physical scale and sign are factored.
    return {(index,): Q(weight)}


def plus(*terms):
    result = {}
    for term in terms:
        for k,v in term.items():
            result[k] = result.get(k, Q(0))+v
    return {k:v for k,v in result.items() if v}


def multiply(a, b):
    return plus(*({tuple(sorted(k+l)): v*w} for k,v in a.items() for l,w in b.items()))


def exact_chain(order):
    sigma, chi, chi_prime, profile, radial, eta_jet, eta, X, alpha, D = [
        sparse(k) for k in ("sigma","chi","chiPrime","profile","profileX",
                            "profileEta","eta","X","alpha","D")]
    weight = chi if order else {():Q(1)}
    # Product rule on chi(b_n q) q^(2nh) and s^-alpha after factoring q^(2nh).
    neg = {():Q(-1)}
    prefactor = multiply(multiply(neg, alpha), weight)
    euler = plus(multiply(sigma,chi_prime), multiply(sparse("h",2*order),chi)) if order else {}
    radial_part = multiply(multiply(multiply(neg, X),radial),weight)
    eta_part = multiply(multiply(multiply(multiply(neg,D),eta),eta_jet),weight)
    original = plus(multiply(plus(prefactor,euler),profile),radial_part,eta_part)
    proposed = plus(*[
        {tuple(sorted(k)): Q(c)} for k,c in (
            ((["chi"] if order else [])+["alpha","profile"],-1),
            ((["chi"] if order else [])+["X","profileX"],-1),
            ((["chi"] if order else [])+["D","eta","profileEta"],-1),
        )])
    if order:
        proposed = plus(proposed, {("chiPrime","profile","sigma"):Q(1),("chi","h","profile"):Q(2*order)})
    assert original == proposed
    assert plus(original,multiply(neg,plus(proposed,multiply(multiply(alpha,weight),profile))))
    assert plus(original,multiply(neg,plus(proposed,multiply(multiply(multiply(D,eta),eta_jet),weight))))
    if order:
        assert plus(original,multiply(neg,plus(proposed,multiply(neg,multiply(multiply(sigma,chi_prime),profile)))))
    return [["*".join(k),str(c)] for k,c in sorted(original.items())]


def main(goal, runtime):
    band = pin("band",runtime/"source-global-band.mjs")
    source = pin("current",runtime/"source-global-current.mjs")
    stress = json.loads(pin("stress",goal/"c107/higher-stress-c6/higher-stress-c6.json"))
    chart = json.loads(pin("chart",goal/"c106/background16/chart-geometry-c16.json"))
    field = json.loads(pin("fields",goal/"c107/higher-stress-c6/field-log-bounds-c8.json"))
    implicit = json.loads(pin("implicit",goal/"c102/mode-one-attachment/mode-one-attachment.json"))["extendedCutoffGeometry"]
    assert "chartBody=G.sub(G.sub(sv,G.mul(G.pow(Z,2),power(sv,G.mul(q(2),h)))),T)" in band
    assert "derivativeLower:q(1,2),derivativeUpper:G.one" in band
    assert "X=G.div(G.pow(R,2),G.mul(q(2),s)),eta=G.div(Z,power(s,D)),qActual=G.mul(Q,s)" in band
    assert "epsilon=power(Q,h)" in band and "ell=window.ell,Q=window.Q" in band
    assert "sigma=G.mul(selected.scale,q0),chi=G.expressionValue(sourceCutoff.system,[sigma])" in band
    assert "powerQ=power(q0,G.mul(q(2*n),h))" in band
    assert "TthetaTerms.push(G.mul(weight,sourceRoots.Ttheta));TzTerms.push(G.mul(weight,sourceRoots.Tz))" in band
    assert "stressScale=G.mul(epsilon,g.power(g.s,G.neg(G.add(band.constants.A,q(1,2)))))" in source
    assert "fullOriginalStress=[background.normalizedBodies.Ttheta,background.normalizedBodies.Tz].map(x=>G.mul(stressScale,at(x)))" in source
    assert chart["chartHc"] == {"lambdaBelowRenv":-1,"baseBelowRenv":-1}
    assert implicit["order"]==9
    assert field["derivativeOrder"]==8 and field["logCap"]=="H/2^288"
    assert all(x["sign"]==-1 for row in field["rows"] for x in row["fields"].values())
    raw=stress["source"]
    rows=raw["positive"]["rows"]
    assert raw["positive"]["fullHaarResiduals"]==[21999622,22000445]
    assert [(r["E"],r["radialPower"]) for r in raw["leading"]]==[(21999622,2),(22000445,1)]
    assert all(r["localConservativeFlux"]=="-epsilon*R^e*s^(-A-1/2)*T0" for r in raw["leading"])
    assert sorted((r["physicalOrder"],r["component"]) for r in rows)==[(n,m) for n in range(1,4) for m in ("theta","z")]
    assert all(r["wholeConservativeReduction"]==0 and r["literalExponentInH"]==2*r["physicalOrder"] for r in rows)
    tail=stress["angularTerminal"]
    assert tail["fullNativeWholeMomentDifferentiatedAtFixedEndpoints"]
    assert [0,1] in tail["ordersDeltaEta"] and [1,0] in tail["ordersDeltaEta"]
    active=stress["positiveInterior"]
    assert active["positiveActiveRawProfileOrder"]==8
    assert active["activeEpsilonExponentsN3N2N1"]==[7,5,3]
    assert active["logSJetBitCap"]<256
    old=stress["weightedLocalFlux"]
    assert old["logCoefficientCap"]=="H/2^255" and old["oppositeGaussianRestored"]
    assert old["maximumInnerPole"]==18 and old["maximumOuterPole"]==21
    # The implicit positive chart has s>=1/2 and ds/dT<=2,
    # so 0<a=s_T/s<=4. Each first X/eta derivative is already
    # covered by C107; the inner X derivative is X∂X=t1^-1∂u
    # and the outer X derivative is X∂X=-∂d. Both retain ζ.
    # The C107 per-order coefficient already absorbs a conservative
    # six log-s factors. Charge an additional 2^16384 Bnorm^32
    # for all first-chart factors, one Euler derivative, and finite sums.
    assert 32768*2**257 < 2**(4096*510)
    assert Q(1,2**255)+Q(1,2**256)<Q(1,2**254)
    u,d,t,w=Q(1,128),Q(1,32),Q(1,128),Q(2)
    assert 6*u*u+8*t*(u/(w-t*u))**3<1
    assert 6*d*d+2*t*t*(d/(w-d))**3<4
    return {
        "schema":"MathScope.C117.OriginalSignedLocalTimeStress/1",
        "source":"VERIFIED_SOURCE_AND_NATIVE_CHART_RULE_CONDITIONAL_WEIGHTED_ONE_T",
        "pins":PINS,"sourceResiduals":[21999622,22000445],"eulerByDegree":{str(n):exact_chain(n) for n in range(4)},
        "chart":"a=s_T/s; 0<a<=4; X_T=-aX, eta_T=-aD eta, q_T=a q; R and epsilon fixed",
        "factoredPhysicalMultiplier":"-a epsilon R^e s^(-A-1/2); e=2 for theta, e=1 for z; order weight q^(2nh)",
        "guardedSourceRows":[[r["physicalOrder"],r["component"],r["sourceValue"]] for r in rows],
        "wholeMomentsUnchanged":6,"wrongControls":["omit D eta_eta chain","omit scaling","omit chiPrime"],
        "acceptedScope":"Only ∂T of the local weighted radial stress in the same two early Signed applications.",
        "conditionalCap":{"epsilon":"1","gaussian":"zeta","innerPole":3,"outerPole":6,"middlePole":0,
                          "logCoefficient":"H/2^254"},
        "fullSigmaT":"OPEN","finalJets":0,"release":"HOLD",
    }


if __name__ == "__main__":
    p = ArgumentParser(description=__doc__)
    for flag in ("goal","runtime","out"):
        p.add_argument("--"+flag,type=Path,required=True)
    a = p.parse_args()
    result=main(a.goal,a.runtime)
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS original Signed local stress T: two components, six positive source rows, source Euler omissions")
