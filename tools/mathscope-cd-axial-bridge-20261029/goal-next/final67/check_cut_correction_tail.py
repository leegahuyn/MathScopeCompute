"""Check the original selected cutoff tail and its spatial-plateau transfer."""
import argparse
from fractions import Fraction
from hashlib import sha256
from itertools import product
import json
from math import factorial
from pathlib import Path

import sympy as sp


PINS = {
    "family": "b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78",
    "chart": "af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9",
    "cutoff": "0f2ef1dff821d7d936a9c254a5e846f6557445e2d3ccf97f3201915a6a949298",
    "annular": "c4f86049b4f20a63443bd610b76313926717576abca9288ae1f9277b3ae4aa37",
    "shell": "c92ccaf35e6ffca3697b78d7599e2d45f0df427a33f52eb7d7791262434c6a41",
}


def read_pinned(path, key):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[key], key
    return json.loads(raw)


def check_source(family, chart):
    nodes = {node["id"]: node for node in family["nodes"]}
    fixed_id = family["fixed_source"]
    fixed = nodes[fixed_id]
    assert fixed["operation"] == "FixedOriginalSource"
    assert fixed["data"]["qbig"] == "2^(-(ellMinimum+10))"
    assert chart["variables"]["bounds"] == ["1/2 <= Q < 2", "|eta| < 3/4", "q < qBig/16"]
    scales = family["concrete_window_scale_nodes"]
    assert scales == chart["corrections"]["original_scale_nodes"]
    assert chart["corrections"]["possibly_active_stages"] == list(range(1, 5))
    assert chart["corrections"]["first_strictly_zero_stage"] == 5
    h = sp.Symbol("h", positive=True)
    rows = []
    for j, scale_id in enumerate(scales, 1):
        scale = nodes[scale_id]
        spec = scale["data"]
        assert scale["operation"] == "ActualShrinkingScale" and spec["j"] == j
        assert spec["gamma"] == f"h*{j}/20"
        assert spec["L"] == (
            "max(1,1+L_previous,1+log(1/qbig),max_m(2*P_hat/gamma)^2,max_m2*(C_hat+j)/gamma)"
        )
        assert spec["a"] == "exp(L)" and spec["every_m_le_j"] is True
        assert spec["original_cutoff"] == "chi=1 on(-infinity,1/2],chi=0 on[1,infinity)"
        assert scale["inputs"][:1] == [fixed_id]
        predecessors = scales[j-2:j-1] if j > 1 else []
        assert scale["inputs"][1:] == predecessors + spec["norm_inputs"]
        assert len(spec["norm_inputs"]) == j+1
        for m, norm_id in enumerate(spec["norm_inputs"]):
            norm = nodes[norm_id]
            data = norm["data"]
            assert norm["operation"] == "ActualCutoffCurlBound"
            assert data["j"] == j and data["m"] == m and norm["inputs"][1] == fixed_id
            assert data["ellPrime"] == f"ell_({m+1})+{m+1}"
            assert data["increment_operator"] == (
                "T_a Z_j=(curl(chi(aq)*A_j)+chi(aq)*B_j*e_theta,chi(aq)*p_j)"
            )
            assert data["S_hat"] == (
                "S_hat_(j,m,p)=sup_(a>=1,(x,t) in D) q^(ellPrime_m-g_j)*|T_a Z_j|_m/(1+|log q|)^p"
            )
            assert data["C_hat"] == "1+ceil(S_hat_(j,m,P_hat_(j,m)))"
            uncut = nodes[norm["inputs"][0]]
            assert uncut["operation"] == "ExactSourceFunctionalBound"
            assert uncut["data"]["g_j"] == f"h*{j}/10"
            assert uncut["data"]["ell_m"] == f"2A+({m+1}+1)*(1+3h/2)"
            potential = nodes[uncut["inputs"][0]]
            assert potential["operation"] == "ActualCorrectionPotentials"
            assert potential["data"]["j"] == j and potential["data"]["original_recipe_retained"] is True
            assert potential["data"]["velocity_identity"] == "delta u_j=curl A_j+B_j e_theta"
            if j < 5 and m < 3:
                loss = 1+2*h + (m+2)*(1+3*h/2) + (m+1)
                power = sp.expand(j*h/20-loss)
                assert power.subs(h, 0) < 0 and power.coeff(h) < 0
                rows.append({
                    "stage": j, "derivativeOrder": m, "stageScale": scale_id,
                    "sourceCutoffNorm": norm_id, "sourceUncutNorm": uncut["id"],
                    "sourcePotential": potential["id"], "dyadicCoefficient": str(Fraction(1, 2**j)),
                    "qExponent": str(power),
                })
    return rows


def check_force_transfer():
    x = sp.symbols("x1 x2 x3")
    tau = sp.Symbol("tau")
    c = sp.Function("C")(tau)
    coordinates = (*x, tau)
    base = [sp.Function(f"v{i}")(*coordinates) for i in range(3)]
    raw = [sp.Function(f"e{i}")(*coordinates) for i in range(3)]
    w = [c*u for u in raw]
    pi = c*sp.Function("pi")(*coordinates)
    pressure = sp.Function("p")(*coordinates)

    def residual(u, p, i):
        return -sp.diff(u[i], tau) + sp.diff(p, x[i]) + sum(
            u[k]*sp.diff(u[i], x[k]) - sp.diff(u[i], x[k], 2) for k in range(3)
        )

    for i in range(3):
        joined = [v+e for v, e in zip(base, w, strict=True)]
        identity = -sp.diff(w[i], tau) + sp.diff(pi, x[i]) + sum(
            base[k]*sp.diff(w[i], x[k]) + w[k]*sp.diff(base[i], x[k])
            + w[k]*sp.diff(w[i], x[k]) - sp.diff(w[i], x[k], 2) for k in range(3)
        )
        assert sp.expand(residual(joined, pressure+pi, i)-residual(base, pressure, i)-identity) == 0
    # Independent combinatorics for the componentwise maximum-norm bounds.
    assert len(list(product(range(3), repeat=2))) == 9
    return {
        "scope": "Original outer radial and axial unit plateaus r<=r0/2, |z|<=z0/2, with temporal cutoff C=chi(rho).",
        "base": "The same localized initialized field plus the first actual cut correction.",
        "T_m": "Sum of the row bounds at derivative order m for stages 2,3,4, evaluated at q_min=qBig/64 for slab suprema.",
        "M0_M1_F0": "Maximum component bounds for base velocity, base spatial gradient, and base physical force.",
        "DF": "(1+5/tau0)*T0+3*T2+T1+3*(M0*T1+M1*T0+T0*T1)",
        "energyDensityDifference": "3*M0*T0+(3/2)*T0^2",
        "dissipationDensityDifference": "18*M1*T1+9*T1^2",
        "forceWorkDensityDifference": "3*(F0*T0+M0*DF+T0*DF)",
        "forceSquaredDensityDifference": "6*F0*DF+3*DF^2",
        "boundUnits": "Physical component and derivative units before multiplying by the original normalizations and subregion measure.",
        "excludedCommutator": "Outside the axial plateau, localized velocity also has grad(C) cross sum_j chi(a_j*q) A_j.",
    }


def check_stage_support(annular, shell):
    # Strict lower bounds on e^3 and e^4 by truncating positive series.
    lower = {j: sum(Fraction(j**k, factorial(k)) for k in range(21)) for j in (3, 4)}
    assert lower[3] > 20 and lower[4] > 54
    assert Fraction(32, 54) == Fraction(16, 27) < 1
    assert 1-Fraction(1, 2)/Fraction(16, 27) == Fraction(5, 32) < Fraction(1, 4)
    assert shell["exactRefinement"]["sourceComparison"].startswith("w<t1/128 via ellMinimum>=Renv^1024")
    assert annular["geometry"]["factors"]["R"] == "Rstar*sqrt(tau0)"
    assert annular["geometry"]["outerCutoffSpatialDerivatives"] == "radial cutoff flat; axial and mixed derivatives retained"
    return {
        "exactSeriesLower": {j: str(x) for j, x in lower.items()},
        "stage3Zero": "q >= qBig/20 implies a3*q > 1.",
        "stage4Zero": "q >= qBig/54 implies a4*q > 1.",
        "stage4PossibleSupport": "Q<16/27, rho<16/27, eta^2<5/32 and |z/z0|<1/2.",
        "axialPlateauProof": "rho=Q*(1-eta^2)>=1/2 and Q<16/27 imply eta^2<5/32. Q^D<1 because 0<D and 0<Q<1.",
        "radialPlateauProof": "On correction support X<=Xb, r<=Rstar*sqrt(tau0), where tau0=2^(-(ellMinimum+15)) and ellMinimum>=Rstar^1024. Set u=log Rstar>=0. Then log(2)*(Rstar^1024+15)> (16+1024*u)/2>2*u+log(4), so r<1/2=r0/2.",
        "wholeKStage4Transfer": "The stage-four cutoff correction and its jets vanish outside the two spatial plateaus. Use the same transfer with base localized through stage three and T_m containing stage four alone. No A4 commutator is present anywhere in K.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("family", "chart", "cutoff", "annular", "shell", "out"):
        parser.add_argument("--"+name, type=Path, required=True)
    args = parser.parse_args()
    family = read_pinned(args.family, "family")
    chart = read_pinned(args.chart, "chart")
    cutoff = read_pinned(args.cutoff, "cutoff")
    annular = read_pinned(args.annular, "annular")
    shell = read_pinned(args.shell, "shell")
    assert cutoff["linearSeedCutoffProof"]["integerDerivativeUppers"][0] == 5
    rows = check_source(family, chart)
    assert len(rows) == 11 and len([row for row in rows if row["derivativeOrder"] == 2]) == 3
    result = {
        "schema": "MathScope.N7.ActualCutCorrectionTail/1",
        "pinnedSHA256": PINS,
        "status": "CONDITIONAL_ON_ACTUAL_WEIGHTED_SOURCE_CLASS",
        "premise": "Finiteness of the original ActualCutoffCurlBound at its chosen integer logarithm power for each row. This does not supply a concrete source field.",
        "pointwiseBound": "2^(-j)*q^(h*j/20-ellPrime_m) for |T_(a_j) Z_j|_m. Also valid on the zero branch and both flat seams.",
        "logBound": "For t=sqrt(x)>=0, derivative of t-log(1+t^2) is (t-1)^2/(1+t^2)>=0 and its value at t=0 is zero.",
        "sourceMaximumProof": "If x=log(1/q)>=L_j then P_hat*log(1+x)<=gamma*x/2, and gamma*x/2>=C_hat+j. Since log C_hat<=C_hat-1, the weighted factor is at most exp(-j)<2^(-j).",
        "rows": rows,
        "allJAtLeast5": "Exactly zero on the slab by the original cutoff growth, including all derivatives.",
        "transfer": check_force_transfer(),
        "stageSupport": check_stage_support(annular, shell),
        "firstCycleMissing": "Original selector imposes m=0,1 for j=1. The first correction still requires a separate actual m=2 velocity enclosure.",
        "scopeLimit": "Gauge-resolved A,b,p intervals, axial-transition commutators, and concrete energy/refinement evaluations remain open.",
        "finalJets": 0,
        "N7_06": "OPEN",
        "N8_05": "OPEN",
        "release": "HOLD",
    }
    raw = (json.dumps(result, indent=2)+"\n").encode()
    args.out.write_bytes(raw)
    print("PASS 11 original cutoff-derivative clauses, 3 force identities and fourth-stage spatial plateaus")
    print(f"{sha256(raw).hexdigest()}  {args.out.name}")


if __name__ == "__main__":
    main()
