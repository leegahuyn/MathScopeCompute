"""Test the original compact FiveMap input at the highest axial derivative."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import comb
from pathlib import Path


PINS = {
    "highCrop": "43ec151882813aca8c17f0048df8a250967e9a0f90ccca069746c196683658e2",
    "source-global-pressure.mjs": "fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d",
    "source-temporal-potential.mjs": "c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8",
    "source-full-mean-equations.mjs": "2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76",
    "source-updated-mean-pressure.mjs": "6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07",
}


def pin(path, name):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[name], name
    return raw


def source_formulas(runtime, crop):
    receipt = json.loads(pin(crop,"highCrop"))
    assert receipt["status"] == "VERIFIED_TEMPORAL_HIGH_CROP_AND_SURVIVING_PRESSURE_OPERATOR"
    g,p,f,u = (pin(runtime/name,name).decode() for name in list(PINS)[1:])
    assert "G.neg(Dz(W.rz))" in g and "G.mul(epsilon,pZ)" in g
    assert "G.neg(G.div(inverseZ,ci))" in p and "beta=G.neg(Dz(psi))" in p
    assert "G.sub(integrals.left,G.mul(chi,integrals.whole))" in p
    assert "gamma=De(psi,1)" in p
    assert "G.neg(Dz(G.add(G.mul(b,gamma),G.mul(G0,beta),G.mul(beta,gamma),W.rz)))" in f
    assert "G.neg(De(G.add(G.mul(q(2),b,beta),G.pow(beta,2),W.rr),1))" in f
    assert "G.mul(epsilon,lapVector(beta))" in f
    assert "fluxZ=G.mul(R,G.add(G.mul(q(2),G0,gamma),G.pow(gamma,2),W.zz))" in f
    assert "P=scalar(G,whole(haarGr)" in u
    assert "G.sub(whole(exactNormalizedHaar(G,raw.fluxZ,Y)),G.mul(G.q(1,2),whole(G.mul(G.pow(R,2),haarGr))))" in u
    return receipt["sourceNodes"]


def product(f,g):
    result = Counter()
    for p,c in f.items():
        for q,d in g.items():
            result[p+q] += c*d
    return {p:c for p,c in result.items() if c}


def derivative(f):
    return {p-1:p*c for p,c in f.items() if p}


def value(f,r):
    return sum(c*r**p for p,c in f.items())


def primitive(f,a):
    result = {p+1:Q(c,p+1) for p,c in f.items()}
    v = value(result,a)
    if v:
        result[0] = -v
    return result


def integral(f,a,b):
    return value(primitive(f,a),b)


def divide_r(f):
    assert 0 not in f
    return {p-1:c for p,c in f.items()}


def rational_witness():
    a, b = 1, 3
    r = {1:1}
    shape = product(product({2:1,1:-2*a,0:a*a},{2:1,1:-2*b,0:b*b}), {0:1})
    high = product(r,shape)
    weighted_high = product(r,high)
    pressure_inner = divide_r(derivative(weighted_high))
    rz10 = derivative(pressure_inner)
    assert all(value(f,z) == 0 for f in (shape,weighted_high,pressure_inner) for z in (a,b))
    assert integral(rz10,a,b) == 0
    assert primitive(rz10,a) == pressure_inner
    assert integral(product(r,pressure_inner),a,b) == 0
    assert primitive(product(r,pressure_inner),a) == weighted_high
    # (R b)'/R has polynomial form here. The low gamma is (R a)'/R;
    # the R in the high test function cancels that denominator exactly.
    moment_density = product(shape,derivative(product(r,shape)))
    P = integral(moment_density,a,b)/2
    Jz = -integral(product({2:1},moment_density),a,b)/4
    square = product(shape,shape)
    assert P == integral(square,a,b)/4 and P > 0
    assert Jz == integral(product({2:1},square),a,b)/8 and Jz > 0
    # Order-seven Leibniz rule encounters exactly the top beta and bottom
    # gamma for the perturbation. No perturbation enters gamma through 7.
    beta_variation = {7:-1}
    gamma_lower = {0:1}
    assert [(k,comb(7,k)*beta_variation.get(k,0)*gamma_lower.get(7-k,0))
            for k in range(8) if beta_variation.get(k,0)*gamma_lower.get(7-k,0)] == [(7,-1)]
    return {"P_Z6PerEpsilonSquared":str(P), "Jz_Z6PerEpsilonSquared":str(Jz),
            "lowerRzOrdinaryAxialJetsThroughNineUnchanged": True,
            "quadraticHaarTransfer": "P_Z6=epsilon^2/4*integral(a^2), Jz_Z6=epsilon^2/8*integral(R^2*a^2)"}


def main(args):
    nodes = source_formulas(args.runtime,args.crop)
    result = {"status":"VERIFIED_NONZERO_COMPACT_FIVEMAP_HAAR_W_RZ_Z10_OPERATOR",
              "pins":PINS,
              "pressurePathNativeNodes":nodes,
              "originalMomentShape":{"P":"integral(Haar(gr))", "Jz":"integral(Haar(fluxZ))-1/2*integral(R^2*Haar(gr))",
                                     "uniqueHighChannel":"-epsilon*partial_Z Haar(beta_T*gamma_T)",
                                     "variationFirstOrders":{"psi":8,"beta":7,"gamma":8}},
              "witness":rational_witness(),
              "assumptions":["Co-moving nonconstant Fourier harmonic with nonzero N multiplier. The fixed native basis, phase translation and centered N^-1 are kept.",
                             "Compact smooth radial a and b=R*a. The nonzero test uses squared polynomial endpoint factors for exact integrals; compact smooth bumps give the same signed identities.",
                             "A low Wzz,Z input produces psi=a*h. The Wrz,Z10 perturbation is (ci/epsilon^2)N[((Rb)'/R)'*h] and gives delta psi_Z8=b*h through the exact two centered primitives.",
                             "Formal dependence of the actual operator. Original Primary realizability and quantitative source enclosures are independent conditions."],
              "finalJets":0,"release":"HOLD"}
    args.out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8",newline="\n")
    print(result["witness"]["P_Z6PerEpsilonSquared"],result["witness"]["Jz_Z6PerEpsilonSquared"])


if __name__ == "__main__":
    if not __debug__:
        raise RuntimeError("Verification requires assertions.")
    p = ArgumentParser()
    for name in ("runtime","crop","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
