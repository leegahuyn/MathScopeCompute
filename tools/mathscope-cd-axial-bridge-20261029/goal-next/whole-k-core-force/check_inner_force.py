"""Bind the original core-jet intervals to the full localized force and energy integrands."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import json
import sys

import sympy as sp

HERE = Path(__file__).resolve().parent
NEXT = HERE.parent
PINS = {
    "intervals": "8b967ea80d1fb815925950f7cbf5ff4fe020226abc6e3dd3a38e3f7ccbb4441f",
    "inner": "4422bdae491795b5582ff4f1be09d2c58734fcbfc26749f2921c535050842638",
    "annularSlow": "3e3bd5d76fcdac202d2d4da51ca490ddc8dd5d020c1a57aed6a2ecd7985a3a69",
    "heatCell": "254868bebdad829d656c06cfa903a5b5cdf288d35cf5ec9bdf52461c3a7e008b",
    "gauge": "1f342570c0ac63a919441ed999860c835574299b73a2c36fb1b1c658b386876f",
    "chart": "af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9",
    "cutoff": "0f2ef1dff821d7d936a9c254a5e846f6557445e2d3ccf97f3201915a6a949298",
}


def pinned(path, kind=None):
    data = path.read_bytes()
    digest = sha256(data).hexdigest()
    if kind:
        assert digest == PINS[kind], (kind, digest)
    return json.loads(data), digest


def field_algebra(binding, gauge, intervals, whole_inner):
    x, y = sp.symbols("x y")
    jets = {}
    cuts = {}

    def cut(z, t):
        if t > 1 or (not whole_inner and z > 0):
            return sp.S.Zero
        return cuts.setdefault((z, t), sp.Symbol(f"C{z}{t}"))

    c, ct = cut(0, 0), cut(0, 1)

    def jet(field, index):
        name = field + "@" + ",".join(map(str, index))
        if name not in jets:
            jets[name] = sp.Symbol(name)
        return jets[name]

    def d(value, axis):
        if axis < 2:
            result = sp.diff(value, (x, y)[axis])
            order = (1, 0, 0)
            scale = 2 * (x, y)[axis]
        else:
            result = sp.S.Zero
            for (z, t), symbol in tuple(cuts.items()):
                if symbol in value.free_symbols:
                    result += sp.diff(value, symbol) * cut(z + int(axis==2), t + int(axis==3))
            order = (0, 1, 0) if axis == 2 else (0, 0, 1)
            scale = 1
        for name, symbol in tuple(jets.items()):
            if symbol not in value.free_symbols:
                continue
            field, suffix = name.split("@")
            new_index = tuple(a+b for a, b in zip(map(int, suffix.split(",")), order))
            result += sp.diff(value, symbol) * scale * jet(field, new_index)
        return sp.expand(result)

    atom = {}
    for name, terms in gauge["formulas"].items():
        atom[name] = sum((term["integer"] * x ** term["xyPower"][0] * y ** term["xyPower"][1] *
                          jet(term["scalar"], term["derivative"]) for term in terms), sp.S.Zero)
    for name in binding["requiredAtoms"]:
        if name.startswith("C@"):
            radial,z,t = map(int,name.split("@")[1].split(","))
            atom[name] = sp.S.Zero if radial else cut(z,t)
    atom.update({"x0": x, "x1": y})
    assert set(atom) == set(binding["requiredAtoms"])

    def original(row):
        return sp.expand(sum((sp.Rational(term["coefficient"]) *
                              sp.prod(atom[name] for name in term["monomial"].split("*"))
                              for term in row), sp.S.Zero))

    s = x*x + y*y
    a, az, a_s = [jet("a", order) for order in ((0,0,0),(0,1,0),(1,0,0))]
    b, pressure = jet("b", (0,0,0)), c * jet("p_loc", (0,0,0))
    meridional = c*az + cut(1,0)*a
    u = (-x*meridional-y*c*b, -y*meridional+x*c*b, 2*c*(a+s*a_s))
    grad = tuple(tuple(d(component, axis) for axis in range(3)) for component in u)
    linear = tuple(-d(component, 3)-sum(d(grad[i][j], j) for j in range(3))
                   + d(pressure, i) for i, component in enumerate(u))
    nonlinear = tuple(sum(u[j]*grad[i][j] for j in range(3)) for i in range(3))
    force = tuple(sp.expand(linear[i]+nonlinear[i]) for i in range(3))
    poly = binding["exactPolynomials"]
    assert all(sp.expand(original(row)-actual) == 0 for row, actual in zip(poly["velocity"],u,strict=True))
    assert all(original(row) == actual for rows, actuals in zip(poly["velocityGradient"],grad,strict=True)
               for row, actual in zip(rows,actuals,strict=True))
    assert original(poly["pressure"]) == pressure
    assert all(original(row) == actual for row, actual in zip(poly["directForce"],force,strict=True))
    assert sp.expand(sum(grad[i][i] for i in range(3))) == 0
    assert all(sp.expand(2*d(component,3)) != 0 for component in u)
    assert all(d(pressure,i) != 0 for i in range(3))

    cutoff_names = {(0,0):"1",(0,1):"C_tau",(1,0):"C_z",(2,0):"C_zz",
                    (3,0):"C_zzz",(1,1):"C_z_tau"}
    symbols = {x: "R", y: "R", **{symbol: cutoff_names[key] for key,symbol in cuts.items()}}
    symbols.update({symbol: "I_" + name for name, symbol in jets.items()
                    if name in intervals["scalarIntervals"]})

    def upper(expr):
        generator = sorted(expr.free_symbols, key=lambda v: v.name)
        assert all(symbol in symbols for symbol in generator)
        counts = Counter()
        for powers, coefficient in sp.Poly(expr, *generator).terms():
            factors = tuple(sorted(symbols[symbol] for symbol, power in zip(generator,powers,strict=True)
                                   for _ in range(power) if symbols[symbol] != "1"))
            counts[factors] += abs(Fraction(str(coefficient)))
        return [{"coefficient": str(value), "factors": list(term)} for term, value in sorted(counts.items())]

    source_counts = {
        "velocity": [len(row) for row in poly["velocity"]],
        "velocityGradient": [[len(row) for row in rows] for rows in poly["velocityGradient"]],
        "directForce": [len(row) for row in poly["directForce"]],
    }
    return {
        "exactSourceTermCounts": source_counts,
        "verifiedRestrictedIdentities": 16,
        "divergence": "exact zero",
        "negativeControls": ["reversed physical time sign", "dropped spatial pressure gradient"],
        "componentUpperPrograms": {
            "velocity": [upper(component) for component in u],
            "gradient": [[upper(component) for component in row] for row in grad],
            "pressure": upper(pressure),
            "directForce": [upper(component) for component in force],
        },
    }


def geometry(chart, cutoff, region, chi_jets):
    full_axial = region != "strictCore"
    assert chart["variables"]["bounds"] == ["1/2 <= Q < 2","|eta| < 3/4","q < qBig/16"]
    assert cutoff["linearSeedCutoffProof"]["integerDerivativeUppers"][0] == 5
    qmax = Fraction(16,15)
    assert qmax / 4 < Fraction(1,2)
    assert 5*qmax < 16
    # τ0<2^-23 and Λ>1 from the pinned whole-K geometry.
    assert 2*5*qmax*Fraction(1,2**23) < Fraction(1,2)
    assert Fraction(22,7) / 2 * qmax**3 < 2
    assert 2*16*Fraction(1,2**23) < Fraction(1,2)
    if full_axial:
        maxima = [Fraction(0)]*4
        for j in range(256):
            left = Fraction(1,2)+Fraction(j,512)
            bounds = chi_jets(left,left+Fraction(1,512),96)
            for order,value in enumerate(bounds):
                maxima[order] = max(maxima[order], abs(value.lo), abs(value.hi))
        assert maxima[1] < 5 and maxima[2] < 42
        m = -(-maxima[3].numerator//maxima[3].denominator)
        cutoff_factors = {
            "C_tau":"5/tau0", "C_z":"20/z0", "C_zz":"692/z0^2",
            "C_zzz":f"{64*m+2016}/z0^3","C_z_tau":"100/(z0*tau0)",
            "R":"4*sqrt(tau0/Lambda)",
            "I_field@orders":"exact absolute radius in the pinned scalarIntervals",
        }
    else:
        cutoff_factors = {"R":"4*sqrt(tau0/Lambda)","C_tau":"5/tau0",
                          "I_field@orders":"exact absolute radius in the pinned scalarIntervals"}
        maxima = None
    Y, eta, rho, tau0, scale, D, h = sp.symbols("Y eta rho tau0 Lambda D h", positive=True)
    Q = rho/(1-eta**2)
    zeta = eta*Q**D
    s = 2*tau0*Q*Y/scale
    L = 1-2*h*eta**2
    assert sp.simplify((sp.diff(zeta,eta) - Q**D*L/(1-eta**2)).subs(D,sp.Rational(1,2)-h)) == 0
    assert sp.simplify((sp.diff(s,Y)*sp.diff(zeta,eta)/2 -
                        tau0/scale*Q**(D+1)*L/(1-eta**2)).subs(D,sp.Rational(1,2)-h)) == 0
    domains = {
        "strictCore": ("2<=Y<=5/2, |eta|<=1/4, 1/2<=rho<=1, all theta",
                       "2*tau0/Lambda","tau0/Lambda"),
        "wholeInner": ("0<=Y<=4, source whole-K |eta|<3/4, |zeta|<=1, 1/2<=rho<=1, all theta",
                       "(704/7)*tau0/Lambda","(352/7)*tau0/Lambda"),
        "annularSlow": ("Xa<=X<=Xb, source whole-K |eta|<3/4, |zeta|<=1, 1/2<=rho<=1, all theta",
                        "(44/7)*tau0*Rstar^2","(22/7)*tau0*Rstar^2"),
    }
    if region == "annularSlow":
        cutoff_factors["R"] = "Rstar*sqrt(tau0)"
    domain, slice_volume, slab_volume = domains[region]
    return {
        "sliceMap": {"zeta": "eta*Q^D", "rSquared": "2*tau0*Q*Y/Lambda", "Q": "rho/(1-eta^2)"},
        "volumeDensity": "tau0/Lambda * Q^(D+1) * (1-2*h*eta^2)/(1-eta^2)",
        "coordinateDomain": domain,
        "outerCutoffSpatialDerivatives": ("radial cutoff flat; axial and mixed derivatives retained" if full_axial
                                         else "zero on strict spatial plateau"),
        "factors": cutoff_factors,
        "directedCutoffDerivativeMaxima": [str(value) for value in maxima] if maxima else None,
        "sliceNormalizedMeasureUpper": slice_volume,
        "slabNormalizedMeasureUpper": slab_volume,
        "startSliceEnergy": "[0,0], flat original time cutoff at rho=1",
    }


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--localization-source", type=Path, required=True)
    parser.add_argument("--chart", type=Path, required=True)
    region = parser.add_mutually_exclusive_group()
    region.add_argument("--whole-inner-intervals",type=Path,help="Use original axis-inclusive intervals")
    region.add_argument("--annular-slow-intervals",type=Path,help="Use only original slow annular intervals")
    parser.add_argument("--out", type=Path, default=HERE/"strict-core-force-energy.json")
    args = parser.parse_args()

    sys.path.insert(0,str(args.localization_source/"research-ide/mathscope-m3/recovery-20261019"))
    from outer_cutoff import ActualOuterCutoff, chi_jets

    outer = ActualOuterCutoff(args.localization_source)
    zone = "strictCore"
    if args.whole_inner_intervals:
        zone = "wholeInner"
        intervals,intervals_hash = pinned(args.whole_inner_intervals,"inner")
        assert intervals["schema"] == "MathScope.N7.ActualInnerAxisFieldAtomBounds/1", intervals["schema"]
        assert len(intervals["scalarIntervals"]) == 22 and len(intervals["fieldAtomIntervals"]) == 67
    elif args.annular_slow_intervals:
        zone = "annularSlow"
        intervals,intervals_hash = pinned(args.annular_slow_intervals,"annularSlow")
        assert intervals["schema"] == "MathScope.N7.ActualAnnularSlowFieldAtomBounds/1"
        assert len(intervals["scalarIntervals"]) == 22 and len(intervals["slowFieldAtomIntervals"]) == 67
        assert intervals["radialTransfer"].endswith("r<=Rstar*sqrt(tau0)")
        cell,_ = pinned(NEXT/"whole-k-exterior/whole-k-exterior-cell.json","heatCell")
        assert cell["geometry"]["radialProof"] == ["q<qBig/16","4*Xb<=Rstar^2","qBig*Rstar^2<2/3"]
    else:
        intervals,intervals_hash = pinned(NEXT/"whole-k-core-jet-bounds/strict-core-jet-bounds.json","intervals")
    gauge,_ = pinned(NEXT/"whole-k-core/inner-gauge-atoms.json","gauge")
    chart,_ = pinned(args.chart,"chart")
    cutoff, cutoff_hash = pinned(NEXT/"final67/first-scale-selector.json","cutoff")
    operators = field_algebra(outer.binding,gauge,intervals,zone != "strictCore")
    geom = geometry(chart,cutoff,zone,chi_jets)
    measures = {
        "normalization": "velocity=tau0^A*u, force=tau0^(A+1)*f; normalized spatial dx dy dzeta, time d rho",
        "rangeConvention": "nonnegative energy, dissipation and norm squared in [0, upper]; signed work in [-upper, upper]",
        "endpointEnergyUpper": "sliceNormalizedMeasureUpper * tau0^(2*A)*sum_i U_i^2",
        "transverseDissipationWithTimeWeightUpper": "slabNormalizedMeasureUpper * tau0^(2*A+1)*sum_i,j=0,1 G_ij^2",
        "axialDissipationWithTimeWeightUpper": "slabNormalizedMeasureUpper * tau0^(2*A+1)*sum_i G_i2^2",
        "normalizedForceSquaredSpacetimeUpper": "slabNormalizedMeasureUpper * tau0^(2*A+2)*sum_i F_i^2",
        "normalizedAbsoluteWorkUpper": "slabNormalizedMeasureUpper * tau0^(2*A+1)*sum_i U_i*F_i",
        "localFluxNote": "The moving restricted region has spatial boundary and moving-boundary flux; no closed local energy balance claimed.",
    }
    report = {
        "schema": "MathScope.N7.InnerOriginalForceEnergy/1",
        "region": zone,
        "status": "SOURCE_THEOREM_BOUND_FACTORED_CELL_INTERVALS",
        "inputSHA256": {**PINS,"intervals":intervals_hash,"timeCutoffDerivative":cutoff_hash},
        "geometry": geom,
        "originalOperators": operators,
        "energyAndWork": measures,
        "scope": {"sameOriginalCommonBField":True,"fullPointwiseForceOnCell":zone!="annularSlow",
                  "pureSlowBackgroundForce":zone=="annularSlow",
                  "originalNormFactorsNumericallyEvaluated":False,
                  "integralsOnWholeK":False,"independentWholeKRefinements":False,
                  "N7-06":"OPEN","N8-05":"OPEN","wholeKJets":"0/67","release":"HOLD"},
    }
    if zone == "annularSlow":
        U, V, dU, dV = sp.symbols("U V dU dV")
        assert sp.expand((U+V)*(dU+dV)-U*dU) == V*dU+U*dV+V*dV
        report["correctionObligations"] = {
            "velocity": "write full localized velocity as U_B+w and pressure as p_B+pi",
            "directForceIncrement": "-partial_tau w - Laplacian w + grad pi + U_B dot grad w + w dot grad U_B + w dot grad w",
            "required": "same original initialization, active Forced, Signed, Temporal and FiveMap gauge corrections, including cutoff derivatives",
        }
    args.out.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8",newline="\n")
    print("PASS original inner jet intervals, all localized force/energy polynomial rows, and physical volume Jacobian")
    print(sha256(args.out.read_bytes()).hexdigest(),args.out.name)


if __name__ == "__main__":
    main()

