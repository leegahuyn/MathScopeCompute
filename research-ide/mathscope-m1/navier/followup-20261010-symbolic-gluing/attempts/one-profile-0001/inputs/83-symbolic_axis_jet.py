#!/usr/bin/env python3
"""The exact radial jet of the new source-bound analytic Picard limit.

This is an analytic expression DAG, not an evaluated floating-point jet.
Pressure and derivative nodes have fixed mathematical meanings; they are
never assigned user-supplied residuals or theorem-truth flags.
"""
from __future__ import annotations

import hashlib
import json
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent


class DAG:
    def __init__(self):
        self.nodes = []
        self.cache = {}
        self.zero = self.rat(0)
        self.one = self.rat(1)

    def node(self, op, *args):
        key = (op, *args)
        if key not in self.cache:
            self.cache[key] = len(self.nodes)
            self.nodes.append({"op": op, "args": list(args)})
        return self.cache[key]

    def rat(self, x):
        x = F(x)
        return self.node("rational", str(x.numerator), str(x.denominator))

    def ref(self, name):
        return self.node("positive_parameter", name)

    def israt(self, a):
        return self.nodes[a]["op"] == "rational"

    def value(self, a):
        n,d = self.nodes[a]["args"]
        return F(int(n), int(d))

    def add(self, a, b):
        if a == self.zero: return b
        if b == self.zero: return a
        if self.israt(a) and self.israt(b): return self.rat(self.value(a)+self.value(b))
        return self.node("add", *sorted((a,b)))

    def mul(self, a, b):
        if self.zero in (a,b): return self.zero
        if a == self.one: return b
        if b == self.one: return a
        if self.israt(a) and self.israt(b): return self.rat(self.value(a)*self.value(b))
        return self.node("multiply", *sorted((a,b)))

    def scale(self, x, a): return self.mul(self.rat(x),a)
    def sub(self, a, b): return self.add(a,self.scale(-1,b))
    def square(self, a): return self.mul(a,a)

    def inv(self, a):
        if self.israt(a): return self.rat(1/self.value(a))
        return self.node("inverse_nonzero",a)

    def derivative(self, a):
        op,args = self.nodes[a]["op"], self.nodes[a]["args"]
        if op in ("rational", "positive_parameter"): return self.zero
        if op == "eta": return self.one
        if op == "eta_derivative": return self.node("eta_derivative",args[0],args[1]+1)
        return self.node("eta_derivative",a,1)

    def total(self, values):
        out = self.zero
        for a in values: out = self.add(out,a)
        return out


def build(N=24):
    if not 2 <= N <= 64: raise ValueError("radial degree must be 2..64")
    envelope=json.loads((HERE/"axis-envelope-certificate.json").read_text())
    if envelope["passed"] != envelope["total"]: raise ValueError("new axis bound checks failed")
    continuation=json.loads((HERE/"continuation-debt-certificate.json").read_text())
    if continuation["passed"]!=continuation["total"]: raise ValueError("new final continuation checks failed")
    d=DAG(); eta=d.node("eta"); one=d.one; zero=d.zero
    h,j,lam=d.ref("h"),d.ref("j0"),d.ref("Lambda")
    invlam=d.inv(lam); sig=d.ref("sigmaStar")
    A=d.add(d.rat(F(1,2)),h); D=d.sub(d.rat(F(1,2)),h)
    dd=d.sub(one,d.square(eta)); L=d.sub(one,d.scale(2,d.mul(h,d.square(eta))))
    invL=d.inv(L); Us=d.add(d.scale(4,eta),j)
    Hs=d.add(d.mul(D,eta),d.mul(dd,Us))
    Ws=d.sub(d.sub(one,d.scale(4,dd)),d.scale(2,d.mul(d.mul(D,eta),Us)))
    den=d.add(d.square(Hs),d.square(sig)); chi=d.mul(d.square(Hs),d.inv(den))
    zeta=d.scale(-1,d.mul(d.mul(L,Hs),d.inv(den)))
    P=d.node("new_A21_pressure")
    # This function is exp(2 Lambda integral_0^eta zeta -2 logCSelected).
    g2=d.node("new_positive_normalized_amplitude_squared")
    Z=d.total([d.scale(-1,d.mul(d.mul(A,d.sub(one,d.scale(2,d.mul(eta,Us)))),Us)),
               d.scale(-4,Hs),d.scale(-1,d.mul(dd,d.derivative(P))),d.scale(4,d.mul(d.mul(A,eta),P))])
    phi=[one]; u=[zero]

    def convolution(a,b,n):
        return d.total(d.mul(a[k] if k<len(a) else zero,b[n-k] if n-k<len(b) else zero)
                       for k in range(n+1))

    def derivative(rows): return [d.derivative(x) for x in rows]
    def radial_dot(rows): return [d.scale(k,x) for k,x in enumerate(rows)]

    for n in range(N):
        average=[d.scale(F(1,k+1),x) for k,x in enumerate(u)]
        Wcorr=[d.sub(d.scale(-2,d.mul(d.mul(D,eta),x)),d.mul(dd,d.derivative(x))) for x in average]
        W=[d.add(d.mul(invlam,x),Ws if k==0 else zero) for k,x in enumerate(Wcorr)]
        U=[d.add(d.mul(invlam,x),Us if k==0 else zero) for k,x in enumerate(u)]
        Hc=[d.add(d.mul(invlam,d.mul(dd,x)),Hs if k==0 else zero) for k,x in enumerate(u)]
        pref=[d.total([W[k],d.mul(h,d.sub(one if k==0 else zero,d.scale(2,d.mul(eta,U[k])))),
                       d.mul(d.mul(dd,u[k]),zeta)]) for k in range(n+1)]
        R1=d.mul(invL,d.total([convolution(pref,phi,n),convolution(W,radial_dot(phi),n),
                               convolution(Hc,derivative(phi),n)]))
        p=[zero]+[d.scale(F(1,k),d.mul(g2,convolution(phi,phi,k-1))) for k in range(1,n+1)]
        alpha=d.add(d.mul(A,d.sub(one,d.scale(4,d.mul(eta,Us)))),d.scale(4,dd))
        R2=d.mul(invL,d.total([
            d.mul(alpha,u[n]),d.scale(-2,d.mul(d.mul(d.mul(A,eta),invlam),convolution(u,u,n))),
            convolution(W,radial_dot(u),n),d.mul(Hs,d.derivative(u[n])),
            d.mul(d.mul(dd,invlam),convolution(u,derivative(u),n)),
            d.scale(-4,d.mul(d.mul(A,eta),p[n])),d.mul(dd,d.derivative(p[n])),
            d.scale(-2*n,d.mul(eta,p[n])),
        ]))
        phi.append(d.scale(F(1,2*(n+1)*(n+2)),d.add(d.scale(-1,d.mul(chi,phi[n])),d.mul(invlam,R1))))
        u.append(d.scale(F(1,2*(n+1)**2),d.add(d.scale(-1,d.mul(invL,Z)) if n==0 else zero,d.mul(invlam,R2))))
    p=[zero]+[d.scale(F(1,k),d.mul(g2,convolution(phi,phi,k-1))) for k in range(1,N+1)]
    result={
        "schema":"MathScope.Navier.ExactSourceAxisExpressionJet/1",
        "status":"EXACT_SYMBOLIC_RADIAL_JET_OF_NEW_ANALYTIC_FIXED_POINT",
        "basis":{
            "sourceBinding":envelope["sourceBinding"],
            "axisParameterExpressionSHA256":envelope["parameterExpressionSHA256"],
            "parametersExactExpressions":envelope["parametersExactExpressions"],
            "amplitudeSelection":"CSelected=(1+Q^300)^10 exp(Q^200), the final member in continuation-debt-certificate.json",
            "finalContinuationParameterExpressionSHA256":continuation["parameterExpressionSHA256"],
            "finalContinuationParametersExactExpressions":continuation["parametersExactExpressions"],
            "finalContinuationReceiptSHA256":hashlib.sha256((HERE/"continuation-debt-certificate.json").read_bytes()).hexdigest(),
        },
        "radialDegree":N,"nodes":d.nodes,
        "coefficients":{"Phi":phi,"u":u,"p":p},
        "fixedFields":{"eta":eta,"h":h,"j":j,"Lambda":lam,"sigma":sig,"A":A,"D":D,"d":dd,
                       "L":L,"UStar":Us,"HStar":Hs,"WStar":Ws,"ZStar":Z,"chi":chi,"zeta":zeta,"P":P,"gSquared":g2},
        "semantics":{
            "new_A21_pressure":"-integral (1+eta^2)^(-2 theta(y)) dmu(y), for exactly the new outer schedule in the source binding",
            "new_positive_normalized_amplitude_squared":"exp(2 Lambda integral_0^eta zeta(w)dw - 2 log(CSelected)); strictly positive on the real interval",
            "eta_derivative":"The exact ordinary derivative of its referenced analytic expression; no top derivative is truncated or set to zero",
            "inverse_nonzero":"A reciprocal with nonvanishing proved for the actual expression in SAME_DATUM_ANALYTIC_AXIS.md",
            "positive_parameter":"An exact eta-independent positive real expression from the basis",
        },
        "proof":{"coefficientIdentity":"Triangular induction using B.14/B.15, proved in section 8 of SAME_DATUM_ANALYTIC_AXIS.md",
                 "finiteArithmeticRoundoff":"0, for the expression graph representation only",
                 "infiniteTail":"Formula (20) in the same note; solution coefficient norm <=Q",
                 "oldBinary64ArrayIdentity":False,"evaluatedAllEtaIntervalJet":False,"allAnalyticPremisesProvedInLean":False},
    }
    return result


if __name__ == "__main__":
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument("--degree",type=int,default=24)
    parser.add_argument("--write",action="store_true");args=parser.parse_args()
    result=build(args.degree)
    encoded=json.dumps(result,separators=(",", ":"))
    if args.write: (HERE/f"axis-symbolic-jet-N{args.degree}.json").write_text(encoded+"\n")
    print(json.dumps({"status":result["status"],"radialDegree":args.degree,"nodes":len(result["nodes"]),
                      "bytes":len(encoded),"SHA256":hashlib.sha256((encoded+"\n").encode()).hexdigest()}))
