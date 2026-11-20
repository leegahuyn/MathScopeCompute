"""Trace the next upstream derivatives for the late Signed target bounds."""

from argparse import ArgumentParser
from hashlib import sha256
import inspect
import json
from math import comb
from pathlib import Path
import runpy


STAGE = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget")
INPUTS = {
    "pressure": ("signed-centered-flux/verify_signed_pressure.py",
                 "3e2651c95bdd6c3b81d84e6cd554332a8d14d7099b79ad1a3e69b62cc0382700"),
    "premean": ("middle-premean-whole-path/verify_premean_whole_path.py",
                "0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f"),
}
LATE_SHA = "1e6bea833b88a440caefeccb59ad58466e06b8f9ae95d0d699e7f44172c09e5b"
WITNESS_PINS = {
    "compactAnalyticWitness": "20399ca0d83b4565d5c9ef8189479fc80e0ac7fd808a1c63a70cabb1168dcf20",
    "compactPolynomialCode": "1204b461f89f4f505db25942dfc51829ad1d4885e077196effa1dff0309a63dc",
    "equations": "2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76",
    "moments": "6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07",
}


def pin(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return data


def adapt(fn, changes):
    source = inspect.getsource(fn)
    for old, new in changes:
        assert source.count(old) == 1, old
        source = source.replace(old, new)
    ns = {}
    exec(compile(source, inspect.getfile(fn), "exec"), fn.__globals__, ns)
    return ns[fn.__name__]


def angular_operator_witness(args):
    navier = args.runtime / "research-ide/mathscope-m3/navier"
    equations = pin(navier / "source-full-mean-equations.mjs", WITNESS_PINS["equations"]).decode()
    moments = pin(navier / "source-updated-mean-pressure.mjs", WITNESS_PINS["moments"]).decode()
    assert "fluxTheta=G.mul(G.pow(R,2),G.add(G.mul(G0,v),G.mul(V,gamma),G.mul(gamma,v),W.thetaz))" in equations
    assert "Jtheta=scalar(G,whole(exactNormalizedHaar(G,raw.fluxTheta,Y)),tag+'_Jtheta')" in moments
    directory = args.goal / "c101/compact-z10"
    pin(directory / "compact-z10.json", WITNESS_PINS["compactAnalyticWitness"])
    program = directory / "verify_compact_z10.py"
    pin(program, WITNESS_PINS["compactPolynomialCode"])
    poly = runpy.run_path(str(program))
    product, derivative, value, primitive, integral, divide_r = (
        poly[n] for n in ("product","derivative","value","primitive","integral","divide_r"))

    # Replay the two shifted FTC reductions on the same co-moving mode used
    # by C101. With a profile b(R)=R*(R-1)^2*(R-3)^2, their endpoint
    # moments vanish. This only tests the ordinary angular source operator.
    a, b = 1, 3
    shape = product({0:a*a,1:-2*a,2:1}, {0:b*b,1:-2*b,2:1})
    weighted_profile = product({2:1}, shape)
    centered_pressure = divide_r(derivative(weighted_profile))
    perturbation = derivative(centered_pressure)
    assert all(value(f, r) == 0 for f in (weighted_profile, centered_pressure) for r in (a,b))
    assert primitive(perturbation,a) == centered_pressure
    assert primitive(product({1:1}, centered_pressure),a) == weighted_profile

    # In Z-order 10, only gamma changes. Take a zero-order v equal to
    # centered_pressure times the same real unit harmonic, whose Haar
    # square is 1/2. The linear V*gamma variation integrates to zero.
    gamma_orders, v_orders = {10:1}, {0:1}
    assert [comb(10,j)*gamma_orders.get(j,0)*v_orders.get(10-j,0)
            for j in range(11)] == [0]*10+[1]
    weighted = derivative(weighted_profile)
    moment = integral(product(weighted,weighted),a,b)/2
    assert moment > 0
    return {"variation": "A co-moving centered W_rz Z^12 perturbation yields delta psi_Z^10=b*h; all lower gamma axial jets and every v jet are unchanged.",
            "angularMoment": "delta Jtheta_Z^10 = (1/2)*integral ((R*b)'(R))^2 dR; positive for any nonzero smooth compact b with v_0=((R*b)'/R)*h.",
            "exactRationalProfileValue": str(moment),
            "scope": "The polynomial witness checks the two centered primitive identities and the output coefficient. The free perturbation is an operator test, with no claim that the original numeric covariance subjects have these values."}


def main(args):
    programs = {}
    for name, (relative, dig) in INPUTS.items():
        path = args.goal / STAGE / relative
        pin(path, dig)
        programs[name] = runpy.run_path(str(path))
    late = json.loads(pin(args.late, LATE_SHA))
    native = late["demand"]["sufficientPreviousSignedSigmaDirectionsRZ"]
    high = {(r,z,0) for r,z in native}
    low = {(r,z,0) for r,z in native if r+z<=2}

    # Preserve the old exact Leibniz and endpoint rules. Replace the fixed
    # order-two assertions by checks on the replay of the old input below.
    previous = programs["pressure"]["norm_frontier"]
    frontier = adapt(previous, [
        ("def norm_frontier():", "def norm_frontier(spatial):"),
        ("    spatial={(r,z,0) for r in range(3) for z in range(3-r)}\n", ""),
        ("    assert sorted(axial)==[(0,1,0),(0,2,0),(0,3,0),(1,1,0)]\n", ""),
        ("    assert sorted(time)==[(0,0,1),(0,1,1),(0,2,1),(1,0,1)]\n", ""),
        ("    assert max(z for r,z,t in beta)==5\n", ""),
        ("    assert (0,6,0) in gamma_from_beta\n", ""),
        ("    assert (0,4,0) in forced_cov['rz']\n", ""),
        ("    assert max(r+z+t for f in forced_cov.values() for r,z,t in f)==4\n", ""),
        ("'betaRZT':[0,5,0]", "'betaRZT':[0,max(z for r,z,t in beta),0]"),
        ("'requiresBeforeFiveMapJthetaRZT':[0,6,0]", "'requiresBeforeFiveMapJthetaRZT':[0,max(z for r,z,t in gamma_from_beta),0]"),
    ])
    assert frontier(low) == previous()
    out = frontier(high)
    raw_cov = out["forcedCovarianceSupremumOrders"]
    assert (0,8,0) in raw_cov["rz"] and max(z for _,z,_ in raw_cov["rz"]) == 8
    assert all(max(z for _,z,_ in rows) <= 7 for name,rows in raw_cov.items() if name!="rz")
    assert out["independentCompactHighOrder"]["betaRZT"] == [0,9,0]
    assert out["independentCompactHighOrder"]["requiresBeforeFiveMapJthetaRZT"] == [0,10,0]

    # The top compact input is the zero mode's angular moment Jtheta. Its
    # original quadratic piece is Haar(v_T * gamma_T), with no derivative
    # on the zero-order factor in the top split. Record the endpoint-retaining
    # ordinary demand before any optional same-source IBP cancellation.
    record = adapt(programs["premean"]["record"],
                   [("for order in demands:", "for order in demands[name]:")])
    typed = {"beta": [], "v": [(0,10,0)], "gamma": [(0,10,0)]}
    records, cov, integrals, cutoffs, inverses = record(typed)
    top = sorted((name,order) for name,order in cov if order[1]>=11)
    rz12 = [(name,o) for name,o in top if o[1]>=12]
    assert rz12 == [("W_rz",(0,12,0)),("W_rz",(0,12,2))]
    assert all(sum(order[:2])<=12 for _,order in cov)

    report = {"schema": "MathScope.C103.SignedHighUpstreamFrontier/1", "status": "OPEN_NATIVE_BOUNDS",
              "inputs": {"late": LATE_SHA, **{n:d for n,(_,d) in INPUTS.items()}, **WITNESS_PINS},
              "orders": out, "reproducedOriginalC2Inventory": True,
              "topCompactAngularMomentOrdinaryRows": records,
              "topCompactAngularMomentCovarianceRowsZ11andHigher": top,
              "topCompactAngularMomentPrimitiveCount": len(integrals),
              "topCompactAngularMomentCutoffCount": len(cutoffs),
              "topCompactAngularMomentInverseCount": len(inverses),
              "operatorWitness": angular_operator_witness(args),
              "scope": "Sufficient native derivative inventory before optional additional radial/Haar integration by parts. It does not assert these values are nonzero for the actual solution or that every request is minimal.",
              "next": "Bound or remove the surviving high early Forced and old Temporal covariance paths by exact same-source identities.",
              "finalJets": 0, "release": "HOLD"}
    args.out.write_bytes((json.dumps(report,indent=2)+"\n").encode())
    print("Higher Signed frontier: Forced W_rz Z8, compact beta Z9, pre-FiveMap Jtheta Z10, top Temporal W_rz Z12 and L^2 Z12")


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    for name in ("goal","late","runtime","out"):
        parser.add_argument("--"+name, required=True, type=Path)
    main(parser.parse_args())
