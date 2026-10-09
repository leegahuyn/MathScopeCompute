#!/usr/bin/env python3
"""Reject every A.6-compatible Md with logP=14 and the retained h.

This is an analytic parameter-family implication with exact rational scalar
checks. It does not replace the pressure datum or regenerate a source profile.
For each prospective Md it concerns that schedule's own exact A.21 pressure.
The ODE and positive-integral implications are derived in README.md; they are
not represented as a new Lean theorem by the scalar checks below.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from fractions import Fraction as F
from math import factorial
from pathlib import Path

HERE = Path(__file__).resolve().parent


def encode(x):
    x = F(x)
    return {"numerator": str(x.numerator), "denominator": str(x.denominator),
            "approximate": float(x)}


def build():
    axis = HERE.parent / "source-coherence/source-axis-cone-refined.json"
    source = json.loads(axis.read_text())
    par = source["sourcePressureCertificate"]["parametersExact"]
    h = F(par["h"])
    eta, d, f, jp = F(3, 4), F(7, 16), F(16, 25), F(24, 25)
    A, D, L = F(1, 2) + h, F(1, 2) - h, 1 - 2*h*eta**2
    Ceta = -h*(1-8*eta**2) + (D+4*d)*eta*jp
    a0 = 4*L-1
    q0 = (F(3, 5)*a0 + Ceta)/F(8, 5)
    c0, c1 = -h+D*eta*jp, 2*h*eta**2+d*eta*jp
    md_upper = F(7, 5)
    # A positive finite Taylor sum proves exp(7/5)>4, hence log(4)<7/5.
    exp_md_upper_lower = sum(md_upper**k/F(factorial(k)) for k in range(10))
    energy_lower = f**2 * 2**26
    remaining_mass_lower = 1-F(1, 2**11)
    n_upper = (F(9, 2)+27*h)/energy_lower - (2*A*eta+d*jp)*remaining_mass_lower
    minus_kprime_lower = 32/(md_upper*2)
    bsw_lower = 2*minus_kprime_lower*eta*(-n_upper)/3
    margin_upper = 2-bsw_lower
    pc_p1_upper = 1-bsw_lower/2
    # global log(X/XR)=exp(Md/2)>1, e>2, Q>1/3 and L<1.
    p1_xr_lower = F(2, 3)
    pc_xr_upper = p1_xr_lower*pc_p1_upper
    checks = {
        "originalCandidateAndPressureHRetained": F(par["Md"]) == 1 and F(par["logP"]) == 14 and str(h) == source["selectedParameters"]["h"],
        "positiveRetainedH": 0 < h < F(1, 1000),
        "lambdaLargerThanTwiceH": F(par["lambda"]) > 2*h,
        "logFourBelowSevenFifths": exp_md_upper_lower > 4,
        "idealQBetweenOneAndThree": 1 < q0 < 3,
        "firstTransitionLowerBarrier": a0 > 1 and Ceta > 1,
        "firstTransitionUpperBarrier": a0 < 3 and Ceta < 3,
        "axialSourceBetweenOneThirdAndThree": c0 > F(1, 3) and c1 > 0 and c0+4*c1 < 3,
        "positiveLBelowOne": 0 < L < 1,
        "positiveEnergyAndTailMass": energy_lower > 0 and remaining_mass_lower > 0,
        "actualNsUpperBelowMinusOne": n_upper < -1,
        "minusKPrimeUniformLowerIsEightySevenths": minus_kprime_lower == F(80, 7),
        "bsTimesWUniformLowerAboveSix": bsw_lower > 6,
        "firstMarginUniformUpperNegative": margin_upper < 0,
        "necessaryPcUniformUpperNegative": pc_p1_upper < 0 and pc_xr_upper < 0,
    }
    bounds = {"mdRationalUpper": md_upper,
              "expSevenFifthsTaylorLower": exp_md_upper_lower,
              "E2Lower": energy_lower, "remainingAxialPressureMassLower": remaining_mass_lower,
              "NsOverE2Upper": n_upper, "minusKPrimeLower": minus_kprime_lower,
              "bsTimesWLower": bsw_lower, "aMinusBsWUpper": margin_upper,
              "PcOverP1Upper": pc_p1_upper, "PcOverXRUpper": pc_xr_upper}
    return {
        "schema": "MathScope.FixedLogPOuterParameterFamilyRejection/1",
        "status": "ANALYTIC_FAMILY_REJECTION_WITH_EXACT_RATIONAL_CHECKS" if all(checks.values()) else "FAILED",
        "sourceAxisSHA256": hashlib.sha256(axis.read_bytes()).hexdigest(),
        "sourcePaperSHA256": "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
        "retainedSourceParameters": par,
        "prospectiveFamily": {"Md": "Every real 0 < Md < log(4)", "logP": "14", "h": str(h),
                              "eta": "3/4", "XR": "Every positive real XR",
                              "pressure": "Each prospective Md's own exact A.21 schedule pressure; not the unchanged original Pi0 reused across Md."},
        "analyticImplications": [
            "A.6 with logP=14 implies exp(Md)+10<14, hence 0<Md<log(4)<7/5.",
            "At the exact sigma midpoint, x=exp(Md/2) lies in (1,2), y=x-1 lies in (0,1), k=2, a=2 and -kPrime=32/(Md*x)>80/7.",
            "The first transition is independent of Md. The displayed barriers yield 1<Q<3 there and 1/3<Q<=3 in the following axial transition.",
            "E2=f2*exp(28-2/5-y)>f2*2^26, and the remaining axial length is x*x+11-x>11.",
            "The A.21 pressure's positive exact axial segment and nonnegative later derivative contributions give the same Ns/E2 upper bound for every member of this family.",
            "Pc/P1=1-bs*w/2 is uniformly negative; P1/XR>2/3. Thus every family member fails the necessary Pc>2 cone condition.",
        ],
        "bounds": {k: encode(v) for k, v in bounds.items()},
        "checks": checks, "passed": sum(checks.values()), "total": len(checks),
        "conclusion": {"varyingMdAloneWithinA6AtLogP14CannotRepair": all(checks.values()),
                       "candidateParametersChanged": False, "aNewCandidateConstructed": False,
                       "allPositiveMdRejected": False, "paperExistentialChoiceRefuted": False,
                       "globalNavierStokesClaim": False, "newLeanAnalyticTheorem": False,
                       "originalSnapshotPromoted": False},
        "derivation": "README.md, section 7",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=HERE / "fixed-logp-md-family-rejection.json")
    args = parser.parse_args()
    result = build()
    args.output.write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps({"status": result["status"], "passed": result["passed"], "total": result["total"],
                      "bounds": {k: v["approximate"] for k, v in result["bounds"].items()}}, indent=2))
    if not all(result["checks"].values()):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
