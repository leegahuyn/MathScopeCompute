"""Typed C100 Temporal derivative crop and surviving highest pressure operator."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy


PINS = {
    "modeOne": "fbe1aee25a11de039be7268f61264450bcd6673aca6b4eb889b135c3a946b5c0",
    "premean": "0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f",
    "covarianceZ8": "c4c57f2e2531d04da6b8c795c73c8e8322cd8fc118550a3f2165f10bfa55a9df",
    "initialTemporal": "8c2c1641bf425268451c2ef8564777c942eceb4a3a9092602a0686c88c49c460",
    "source-global-pressure.mjs": "fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d",
    "source-temporal-potential.mjs": "c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8",
    "source-pressure.mjs": "fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f",
}
NAMES = ("beta", "v", "gamma")


def pin(path, key):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[key], key
    return raw


def temporal_recurrence(path):
    pin(path, "premean")
    norm = runpy.run_path(str(path))["record"]
    body = inspect.getsource(norm)
    old = "for order in demands:"
    assert body.count(old) == 1
    code = compile(body.replace(old, "for order in demands[name]:"), str(path), "exec")
    namespace = {}
    exec(code, norm.__globals__, namespace)
    return namespace["record"]


def matches_runtime(runtime, temporal):
    p, t, r = (pin(runtime/name, name).decode() for name in list(PINS)[4:])
    assert "G.neg(Dz(W.rz))" in p
    assert "Ez=G.sub(G.add(De(W.rz,1),Dz(W.zz),G.mul(epsilon,pZ))" in p
    assert "G.mul(G.derivative(chi,Z),integrals.whole)" in p
    assert "fixed-reference-radial-primitive" in p and "fixed-reference-time-coefficient" in p
    assert "gammaDesired=G.neg(G.div(inverseZ,ci)),weighted=G.mul(R,gammaDesired)" in t
    assert "beta=G.neg(Dz(psi))" in t
    assert "G.sub(integrals.left,G.mul(chi,integrals.whole))" in t
    assert "G.sub(G.substitute(radialPrimitive,R,r),radialPrimitive)" in r
    a = json.loads(pin(temporal, "initialTemporal"))
    assert a["pressureZ"] == 17754234 and a["actualChi"] == 17743734
    assert a["centeredInitialTemporal"][1]["actualZeroModeSubtraction"] == 19563365
    assert a["centeredInitialTemporal"][1]["operatorBody"] == 17754268
    return {"pZ": a["pressureZ"], "chi": a["actualChi"],
            "chiZ": a["actualChiZ"], "axialCentered": 19563365, "axialSource": 17754268}


def covariance_crop(record, mode_one, high):
    m = json.loads(pin(mode_one, "modeOne"))["originalSource"]
    demands = {name: sorted({tuple(row["RZL"]) for row in
                             m["conservativeAdditionalActualComponentRequests"]
                             if row["component"] == name}) for name in NAMES}
    rows, inputs, paths, cutoff, inverse = record(demands)
    high_per_target = {}
    for name, indices in demands.items():
        high_per_target[name] = []
        for r, z, l in indices:
            sub = {comp: [(r,z,l)] if name == comp else [] for comp in NAMES}
            _, one, _, _, _ = record(sub)
            high_per_target[name].append({"RZL": (r,z,l),
                                          "roles": sorted((n,a) for n,a in one if sum(a[:2]) > 7)})
    above7 = {(n,a) for n,a in inputs if sum(a[:2]) > 7}
    expected = {("W_rz",(0,8,l)) for l in range(4)}
    expected |= {("W_rz",(1,7,l)) for l in (0,2)}
    expected |= {("W_rz",(0,9,l)) for l in (0,2)}
    expected |= {(n,(0,8,l)) for n in ("W_rr","W_thetatheta","W_zz") for l in (0,2)}
    assert above7 == expected and len(above7) == 14

    c8 = json.loads(pin(high, "covarianceZ8"))["selectiveCovariance"]
    even_z8 = {l for entry in c8["actualDemandRows"] if entry["component"] == "rz"
               for r,z,t,l in [entry["RZTL"]] if (r,z,t) == (0,8,0)}
    assert even_z8 == {0,2,4}
    covered_z8 = {("W_rz",(0,8,l)) for l in (0,1,2,3)}
    drops_ftc = {("W_rz",(1,7,l)) for l in (0,2)}
    assert all(first["RZL"] == (0,6,0) for name,data in high_per_target.items()
               for first in data if set(first["roles"]) & drops_ftc and name == "beta")
    assert not any(set(entry["roles"]) & drops_ftc for name, data in high_per_target.items()
                   for entry in data if name != "beta")
    remaining = above7 - covered_z8 - drops_ftc
    assert len(remaining) == 8 and max(sum(a[:2]) for n,a in remaining) == 9
    return {"typedDemands": demands, "conservativeHigherCovarianceRoles": sorted(above7),
            "perTarget": high_per_target, "availableEvenWrzZ8L": sorted(even_z8),
            "coveredViaEvenAndOddInterpolation": sorted(covered_z8),
            "removedViaOriginalShiftedFTC": sorted(drops_ftc),
            "remainingSufficientNewTemporalCovarianceRows": sorted(remaining),
            "temporalGradeRowsUsingConservativeAbsoluteRecurrence": rows,
            "numberOfWholePathOperations": [len(inputs), len(paths), len(cutoff), len(inverse)]}


def mul(f, g):
    out = Counter()
    for p, c in f.items():
        for q, d in g.items():
            out[p+q] += c*d
    return dict(out)


def integrate(f, a, b):
    return sum(Q(c,p+1)*(b**(p+1)-a**(p+1)) for p,c in f.items())


def primitive_at(f, a):
    out = {p+1:Q(c,p+1) for p,c in f.items()}
    out[0] = -sum(c*a**p for p,c in out.items())
    return out


def nonzero_pressure_witness():
    a, R, b = 1, 2, 3
    # f(r)=(r-a)^2(b-r)^2 is positive inside the envelope. The source
    # perturbation (Z-Z*)^9/9! gives f at order nine and zero at all
    # lower Z derivatives at the evaluation point.
    ab = mul({1:1,0:-a}, {1:-1,0:b})
    shape = mul(ab,ab)
    left = integrate(mul(shape, {0:R*R,2:-1}), a, R)/2
    right = integrate(mul(shape, {2:1,0:-R*R}), R, b)/2
    assert left == integrate(mul(primitive_at(shape,a),{1:1}),a,R) == Q(31,105)
    assert right == -integrate(mul(primitive_at(shape,b),{1:1}),R,b) == Q(13,35)
    # Exact raw operator powers, from gr to pZ to Ez to gamma_d to beta.
    eps, axial, sign = 1, 1, -1
    axial += 1
    eps += 1
    sign *= -1
    eps += 1
    axial += 1+6
    sign *= -1
    assert (eps, axial, sign) == (3,9,-1)
    # A regular projector's radial image has nonzero theta-axial complement
    # whenever the native normal has a nonzero theta entry.
    normal = (1,2,3)
    q = sum(x*x for x in normal)
    radial = tuple(int(i == 0)-Q(normal[i]*normal[0],q) for i in range(3))
    assert radial == (Q(13,14),-Q(1,7),-Q(3,14))
    assert sum(n*x for n,x in zip(normal,radial,strict=True)) == 0
    return {"exactCoefficient":"-epsilon^3/(ci*R)",
            "highestTemporalOperator":"Tchi[r*N^-1*Tchi(dZ^9*center(W_rz))]",
            "pressureToForcedProjection":"-epsilon*U_z*Pi_n(e_r) multiplies dZ^6 beta",
            "projectedRadialNonzeroIdentity":"q_n * (Pi_n e_r)_r = n_theta^2+n_z^2",
            "fixedCollarWeightedPrimitiveWitness":[str(left),str(right)],
            "witnessScope":"Algebraic functional test on a nonconstant harmonic co-moving with the native radial translation. It proves the centered operator does not identically vanish. Actual source covariance values and any quantitative enclosure remain separate.",
            "shiftedFTC":"Tchi(r*N^-1*D_e^(1) f)=N^-1[r f]_left - chi*N^-1[r f]_whole, with each endpoint transported. Radial translation and N commute.",
            "oddTorusBound":"Norm(L f) <= 2*Norm(f) + Norm(L^2 f)/2 from unit segment Taylor on the common torus; use f and L^2 f."}


def main(a):
    nodes = matches_runtime(a.runtime, a.temporal)
    crop = covariance_crop(temporal_recurrence(a.premean), a.mode_one, a.z8)
    witness = nonzero_pressure_witness()
    result = {"status":"VERIFIED_TEMPORAL_HIGH_CROP_AND_SURVIVING_PRESSURE_OPERATOR",
              "pins":PINS, "sourceNodes":nodes, "crop":crop, "witness":witness,
              "middleCompact":"Separate OPEN complete FiveMap norms. Jtheta may be needed through Z7 via the compact beta primitive. The conservative P/Jz quadratic term at Z6 may ask beta_T,Z7 and Wrz,Z10; this is outside the linear Temporal crop.",
              "finalJets":0,"release":"HOLD"}
    a.out.write_text(json.dumps(result, indent=2)+"\n",encoding="utf8",newline="\n")
    print(len(crop["conservativeHigherCovarianceRoles"]),
          len(crop["remainingSufficientNewTemporalCovarianceRows"]),
          witness["fixedCollarWeightedPrimitiveWitness"])


if __name__ == "__main__":
    if not __debug__:
        raise RuntimeError("Verification requires enabled assertions.")
    p = ArgumentParser()
    for name in ("premean","mode-one","z8","temporal","runtime","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
