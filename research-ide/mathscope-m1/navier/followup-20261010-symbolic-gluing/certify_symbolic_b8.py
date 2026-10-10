#!/usr/bin/env python3
"""Fresh continuous B.8 operator, bound to the new datum with scale mu=h^2.

This reuses the pinned arithmetic algorithm, not an old pressure, axis,
debt, or certificate. Every integral is recomputed for exact new supports.
"""
from __future__ import annotations
import argparse
import json
from datetime import datetime, timezone
from fractions import Fraction as F
from pathlib import Path
from time import monotonic

import certify_symbolic_c2 as base
import certify_uniform_moment_map as engine
from dyadic_interval import I, power

HERE = Path(__file__).resolve().parent
MU_MAX = F(1, 2**400)
SUPPORTS = tuple((F(n, 2048), F(2*n+1, 4096)) for n in range(6, 11))


def compute(panels=1024):
    source = base.source_binding()
    source["physicalScale"] = {
        "coordinate": "X=XR*x", "XR": "110*(C*Pstar)^10; final C not yet fixed here",
        "K": "Pstar/(1+eta^2)", "c": "4*eta",
        "patch": "exp(-6)<x<exp(-5)",
        "baseField": "E=K*x^(1/10), U=c",
        "sameDatumRequirement": "Any incoming axis/continuation must use this exact A.21 datum and these parameters.",
    }
    source["baseField"] = "U=4*eta; E=Pstar/(1+eta^2)*x^(1/10)"
    source["scaleExpression"] = "mu=h^2=exp(-16004*T)>0"
    ru = re = F(1, 10**6)
    beta = F(1, 10**8)
    spec = {"name": "B8_inner_patch", "alpha": F(1,10), "supports": SUPPORTS,
            "unit_mass": False, "u_radius": ru, "e_radius": re,
            "debt_u_preconditioned": beta, "debt_e_preconditioned": beta}
    raw = engine.coefficients(spec, panels)
    zu, ze, bu, be = raw["inverse_u"]["z"], raw["inverse_e"]["z"], raw["bu"], raw["be"]
    u_image = beta+zu*ru
    e_image = beta+MU_MAX*bu*ru**2+ze*re+MU_MAX*be*re**2
    qe = ze+2*MU_MAX*be*re
    u1 = beta/(1-zu) if zu < 1 else F(10**100)
    e1 = (beta+2*MU_MAX*bu*ru*u1)/(1-qe) if qe < 1 else F(10**100)
    u2 = u1
    e2 = (beta+2*MU_MAX*bu*(u1*u1+ru*u2)+2*MU_MAX*be*e1*e1)/(1-qe) if qe < 1 else F(10**100)
    emin = min(power(I(a,b),F(1,10)).lower() for a,b in SUPPORTS)
    pos = emin-MU_MAX*re*raw["max_bump"]
    da = max(2*re*(b*raw["max_bump_derivative"]/(b-a)+F(1,10)*raw["max_bump"])/pos
             for a,b in SUPPORTS[2:]) if pos > 0 else None
    db = max(2*b*ru*raw["max_bump_derivative"]/(b-a)/emin for a,b in SUPPORTS[:2])
    checks = {
        "sameNewPressureBound": source["parameterTreeSHA256"] == base.PARAMETER_SHA,
        "allFiveContinuousIntegralsRecomputed": raw["cells"] > 0,
        "uLinearInverse": zu < 1, "eLinearInverse": ze < 1,
        "strictUInclusion": u_image < ru, "strictEInclusion": e_image < re,
        "contraction": qe < 1,
        "firstDerivativesInsideRadius": u1 < ru and e1 < re,
        "secondDerivativesInsideRadius": u2 < ru and e2 < re,
        "positiveE": pos > 0,
        "scaledRadialShearBoundBelowQuarter": da is not None and da < F(1,4),
        "scaledAxialShearBoundBelowQuarter": db < F(1,4),
    }
    return {
        "schema": "MathScope.SymbolicB8ContinuousMomentMap/1",
        "generatedUTC": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "geometry": {"supports": SUPPORTS, "bump": "sigma'((x-left)/width)",
                     "unitMass": False, "integralMass": [b-a for a,b in SUPPORTS],
                     "allSupportsDisjoint": True},
        "arithmetic": {"bits": base.BITS, "panels": panels, "wholeCells": raw["cells"],
                       "implementationSHA256": base.sha(__file__), "dependencies": base.PINS,
                       "c2SupportAndBindingCodeSHA256": base.sha(base.__file__)},
        "normalization": {
            "physicalUnknown": "v=mu*z; mu=h^2>0; deltaU=K*mu*(z0*b0+z1*b1), deltaE=K*mu*(z2*b2+z3*b3+z4*b4)",
            "equation": "A*z+mu*Q(z)=scaledDebt",
            "rowsBeforeDivisionByMu": ["dM/(XR*K)", "(dJ-c*dI)/(XR^(3/2)*K^2)",
                                       "dI/(XR^(3/2)*K)", "(dS-2*c*dM)/(XR*K^2)", "dCp/K^2"],
            "etaDerivativeMeaning": "Derivative bounds apply AFTER all factors K(eta), c(eta), and their derivatives have been included in the normalized debt; mu and XR are eta-independent.",
        },
        "linearMap": raw["linear"], "quadraticDiagonal": raw["quadratic"],
        "inverseU": raw["inverse_u"], "inverseE": raw["inverse_e"],
        "preconditionedQuadraticU": raw["pre_q_u"], "preconditionedQuadraticE": raw["pre_q_e"],
        "bounds": {"muUpper": MU_MAX, "BU": bu, "BE": be, "uRadius": ru, "eRadius": re,
                   "allowedPreconditionedScaledDebtPerDerivative0To2": beta,
                   "uImage": u_image, "eImage": e_image, "eContraction": qe,
                   "uEtaDerivative1": u1, "eEtaDerivative1": e1,
                   "uEtaDerivative2": u2, "eEtaDerivative2": e2,
                   "positiveEOverK": pos, "radialShearErrorOverMu": da,
                   "axialShearErrorOverMu": db, "bumpSupremum": raw["max_bump"],
                   "bumpDerivativeSupremum": raw["max_bump_derivative"]},
        "checks": checks, "allPassed": all(checks.values()),
        "claimBoundary": {"continuousOperatorCertified": all(checks.values()),
                          "sameNewDatumBound": True, "actualIncomingAxisDebtCertified": False,
                          "fullProfileCertified": False, "formalLeanProof": False,
                          "note": "Uniform inclusion for the fresh map, conditional on the actual normalized incoming C2 debt. No old source debt or axis certificate was used."},
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--panels", type=int, default=1024)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise FileExistsError("Use a fresh certificate path")
    start = monotonic()
    result = compute(args.panels)
    result["elapsedSeconds"] = monotonic()-start
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(base.encode(result),indent=2)+"\n")
    print(json.dumps({"allPassed": result["allPassed"], "checks": result["checks"],
                      "zU": float(result["inverseU"]["z"]), "zE": float(result["inverseE"]["z"]),
                      "daOverMu": float(result["bounds"]["radialShearErrorOverMu"]),
                      "elapsedSeconds": result["elapsedSeconds"], "sha256": base.sha(args.output)}))
    if not result["allPassed"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
