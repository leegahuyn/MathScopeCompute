"""Bind the original inner-core jet request to the Stokes gauge on X<Xa."""
from argparse import ArgumentParser
from collections import Counter
from hashlib import sha256
from itertools import product
from pathlib import Path
import json
import sys

import fitz
from sympy import Function, diff, expand, integrate, Rational, symbols

PAPER = "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f"
PAGES = {
    77: ("support in the closed active shell", "smooth zero extension across all these support"),
    78: ("preserve the specified slow, transverse, and shell supports",),
    90: ("with smooth zero extension across both radial edges",),
    104: ("mean coefficients have smooth zero extension outside the active shell",),
    114: ("vanish near the axis for each fixed",),
    115: ("(9.21)", "All annular representatives vanish in a neighborhood"),
    116: ("Step 5: The inner velocity growth", "All annular corrections vanish there"),
    117: ("(10.1)", "chosen vector potential A is smooth at the axis",
          "a smooth scalar a", "all the annular corrections vanish near the axis"),
    118: ("(10.4)", "u = curl(cA)", "includes every derivative of the cutoffs"),
}


def require(predicate, detail):
    if not predicate:
        raise AssertionError(detail)


def paper_scope(path):
    require(sha256(path.read_bytes()).hexdigest() == PAPER, "original paper SHA256")
    with fitz.open(path) as document:
        require(len(document) == 166, "original 166-page paper")
        for page, anchors in PAGES.items():
            text = " ".join(document[page - 1].get_text().split())
            require(all(anchor in text for anchor in anchors), (page, anchors))
    return {
        "paperSHA256": PAPER,
        "paperPages": list(PAGES),
        "domain": "tau>0, q<qStar, 0<=X=s/(2q)<Xa",
        "extension": "smooth Cartesian axis included, strict inequality at the annular boundary",
        "construction": "Proposition 9.9 and (9.21), using annular support and (10.1)",
        "gauge": "A0=-y*a(s,z,tau), A1=x*a(s,z,tau), A2=0, s=x^2+y^2",
        "stream": "a_n=q^(-A+2*n*h)/2 * integral_0^1 U_n(v*X,eta) dv",
        "streamAtAxis": "partial_X^j of integral at 0 = partial_X^j U_n(0,eta)/(j+1)",
        "historicalCutoff": "a=a_0+sum_{n>=1} chi(c_n*q)*a_n; locally finite with source c_n",
        "outerLocalization": "A,b,p_loc are operands before (10.4); C has its own 13 jet requests",
    }


# Each term key is (scalar s derivative, z derivative, tau derivative, x power, y power).
def differentiate(terms, coordinate):
    result = Counter()
    for (ds, dz, dt, x, y), coefficient in terms.items():
        if coordinate == 0:
            if x:
                result[ds, dz, dt, x - 1, y] += coefficient * x
            result[ds + 1, dz, dt, x + 1, y] += 2 * coefficient
        elif coordinate == 1:
            if y:
                result[ds, dz, dt, x, y - 1] += coefficient * y
            result[ds + 1, dz, dt, x, y + 1] += 2 * coefficient
        else:
            result[ds, dz + int(coordinate == 2), dt + int(coordinate == 3), x, y] += coefficient
    return {key: value for key, value in result.items() if value}


def atom_formulas(binding):
    require(binding["coordinateConvention"]["axisymmetricCoordinate"] == "s=x^2+y^2" and
            binding["coordinateConvention"]["physicalTimeDerivative"] == "-partial_tau",
            "same source physical and axisymmetric variables")
    x, y, z, tau, s = symbols("x y z tau s")
    xyz = (x, y, z, tau)
    scalar_variables = (s, z, tau)
    point = {s: x**2 + y**2}
    # An arbitrary degree-three Taylor polynomial has every independent scalar jet.
    a = sum(symbols(f"a_{i}{j}{k}") * s**i * z**j * tau**k
            for i, j, k in product(range(4), repeat=3) if i+j+k <= 3)
    source = {
        "A0": ("a", {(0, 0, 0, 0, 1): -1}, -y*a.subs(point)),
        "A1": ("a", {(0, 0, 0, 1, 0): 1}, x*a.subs(point)),
        "A2": ("a", {}, 0),
        "p": ("p_loc", {(0, 0, 0, 0, 0): 1}, Function("p_loc")(x, y, z, tau)),
        "b": ("b", {(0, 0, 0, 0, 0): 1}, Function("b")(s, z, tau)),
    }
    result = {}
    for atom in binding["requiredAtoms"]:
        kind, _, suffix = atom.partition("@")
        if kind not in source:
            continue
        field, terms, target = source[kind]
        indices = tuple(map(int, suffix.split(",")))
        if kind == "b":
            # The b input is already in (s,z,tau), as declared by the operator.
            terms = {(*indices, 0, 0): 1}
            candidate = diff(target, *zip(scalar_variables, indices))
            reference = diff(Function("b")(s,z,tau), *zip(scalar_variables, indices))
        elif kind == "p":
            # The p input is in Cartesian coordinates. Axisymmetry is used on this core.
            target = Function("p_loc")(x*x+y*y, z, tau)
            for axis, count in enumerate(indices):
                for _ in range(count):
                    terms = differentiate(terms, axis)
            p = Function("p_loc")(s,z,tau)
            candidate = sum(c*x**i*y**j * diff(p, (s,d), (z,e), (tau,f)).subs(point)
                            for (d,e,f,i,j), c in terms.items())
            reference = diff(target, *zip(xyz, indices))
        else:
            for axis, count in enumerate(indices):
                for _ in range(count):
                    terms = differentiate(terms, axis)
            candidate = sum(c*x**i*y**j * diff(a, (s,d), (z,e), (tau,f)).subs(point)
                            for (d,e,f,i,j), c in terms.items())
            reference = diff(target, *zip(xyz, indices))
        require(expand(candidate - reference) == 0, ("independent derivative", atom))
        result[atom] = [
            {"scalar": field, "derivative": [d,e,f], "xyPower": [i,j], "integer": c}
            for (d,e,f,i,j), c in sorted(terms.items())
        ]
    require(len(result) == 67 and sum(not row for row in result.values()) == 19,
            "original 67 field atoms, including 19 exact zeros")
    primitive = symbols("v")
    for n in range(4):
        require(integrate(primitive**n, (primitive, 0, 1)) == Rational(1, n+1),
                ("axis integral monomial", n))
    return result


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--paper", type=Path, required=True)
    parser.add_argument("--localization-source", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=Path(__file__).with_name("inner-gauge-atoms.json"))
    args = parser.parse_args()
    sys.path.insert(0, str(args.localization_source / "research-ide/mathscope-m3/recovery-20261019"))
    from outer_cutoff import ActualOuterCutoff

    outer = ActualOuterCutoff(args.localization_source)
    formulas = atom_formulas(outer.binding)
    receipt = {
        "schema": "MathScope.N7.ActualInnerGaugeAtoms/1",
        "status": "VERIFIED_INNER_SOURCE_GAUGE_ATOM_FORMULAS",
        "sourceScope": paper_scope(args.paper),
        "formulas": formulas,
        "remainingScalarDerivativeInputs": {
            field: sorted({tuple(term["derivative"]) for row in formulas.values()
                           for term in row if term["scalar"] == field})
            for field in ("a", "b", "p_loc")
        },
        "localExactZeroAtoms": [atom for atom, terms in formulas.items() if not terms],
        "completeWholeKJetIntervals": 0,
        "open": ["actual core scalar intervals on all active cells",
                 "annular and cutoff-transition jets on the same final field",
                 "whole-K energy, force and independent refinements"],
        "release": "HOLD",
    }
    args.out.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8", newline="\n")
    print("PASS 67 original inner gauge atom formulas, including 19 exact zero A2 atoms.")
    print("Receipt SHA256", sha256(args.out.read_bytes()).hexdigest())


if __name__ == "__main__":
    main()

