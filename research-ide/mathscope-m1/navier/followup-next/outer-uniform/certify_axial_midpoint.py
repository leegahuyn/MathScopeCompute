#!/usr/bin/env python3
"""Enclose an actual A.2 axial-transition state for the existing Md=1 datum.

The elementary functions and positive continuous integrals are enclosed with
outward 88-bit dyadic arithmetic.  The pressure tail uses explicit whole-tail
envelopes for the actual A.21 unedited schedule.  It is never replaced by a
finite-radius truncation or a user-supplied pressure value.

This is a pointwise counterexample to the cone of this specific candidate,
not a counterexample to the paper's existential choice of sufficiently large
Md, and not a new Lean theorem.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
FOLLOWUP = HERE.parent
sys.path.insert(0, str(FOLLOWUP / "uniform-gluing"))
from dyadic_interval import BITS, I, exp_negative, sigma  # noqa: E402


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def exp_box(x) -> I:
    """Monotone outward exp, retaining small positive upper endpoints."""
    x = I(x)
    if x.lower() >= 0:
        return exp_negative(x).reciprocal()
    if x.upper() <= 0:
        return exp_negative(-x)
    lo = exp_negative(I(-x.lower()))
    hi = exp_negative(I(x.upper())).reciprocal()
    return I(lo.lo, hi.hi, raw=True)


def first_stage_integrals(panels: int):
    """Enclose exact integrals using whole-cell ranges of the step primitive.

    S(t)=integral_0^t sigma.  Monotonicity gives a lower/upper Riemann bound for
    each increment of S; every later exponential is evaluated on the entire
    closed t/S rectangle, not just at quadrature nodes.
    """
    points = [F(j, panels) for j in range(panels + 1)]
    steps = [sigma(t) for t in points]
    primitives = [I(0)]
    for j in range(panels):
        width = points[j + 1] - points[j]
        slope = I(steps[j].lo, steps[j + 1].hi, raw=True)
        primitives.append(primitives[-1] + width * slope)
    if not primitives[-1].contains(F(1, 2)):
        raise ArithmeticError("Step primitive failed its exact symmetry mass")
    # sigma(1-t)=1-sigma(t) implies S(1)=1/2 exactly.
    primitives[-1] = I(F(1, 2))
    integral_b, integral_c = I(0), I(0)
    for j in range(panels):
        t = I(points[j], points[j + 1])
        primitive = I(primitives[j].lo, primitives[j + 1].hi, raw=True)
        width = points[j + 1] - points[j]
        integral_b += width * exp_box(F(8, 5) * t - F(3, 5) * primitive)
        integral_c += width * exp_box(F(6, 5) * t - F(6, 5) * primitive)
    return integral_b, integral_c, {
        "panels": panels,
        "primitiveAtOne": primitives[-1].json(),
        "method": "Monotone step-mass enclosures followed by whole-cell interval exponential integration",
        "sampledSupremumUsed": False,
    }


def axial_prefix_integrals(panels: int):
    """Use q=log(1+y), so the midpoint endpoint is the exact q=1/2.

    K_m = integral_0^(exp(1/2)-1) k(y)^m exp(y) dy,
    with k(y)=4(1-sigma(log(1+y))).  The substitution has Jacobian exp(q).
    """
    points = [F(j, 2 * panels) for j in range(panels + 1)]
    steps = [sigma(t) for t in points]
    k1, k2 = I(0), I(0)
    for j in range(panels):
        q = I(points[j], points[j + 1])
        step = I(steps[j].lo, steps[j + 1].hi, raw=True)
        k = 4 * (1 - step)
        jacobian_weight = exp_box(exp_box(q) - 1 + q)
        width = points[j + 1] - points[j]
        k1 += width * k * jacobian_weight
        k2 += width * k**2 * jacobian_weight
    return k1, k2


def build(axis_path: Path, panels: int = 256):
    if not isinstance(panels, int) or isinstance(panels, bool) or panels < 32 or panels > 8192:
        raise ValueError("panels must be an integer in [32,8192]")
    source = json.loads(axis_path.read_text())
    pressure = source["sourcePressureCertificate"]
    parameters = {k: F(v) for k, v in pressure["parametersExact"].items()}
    if source["selectedParameters"]["h"] != pressure["parameterHExact"]:
        raise ValueError("Axis h differs from the actual pressure h")
    if parameters["Md"] != 1 or parameters["logP"] != 14:
        raise ValueError("This preserved counterexample is for the existing Md=1, logP=14 datum")
    h, lam, co = parameters["h"], parameters["lambda"], parameters["co"]
    if not 0 < h < lam / 2 < F(1, 100):
        raise ValueError("Pinned schedule h/lambda domain failed")
    rho = co * h
    if not 0 < rho < F(1, 100):
        raise ValueError("The terminal flat factor must be positive")
    eta = F(3, 4)
    d, D, A = 1 - eta**2, F(1, 2) - h, F(1, 2) + h
    L = 1 - 2 * h * eta**2
    f, j0prime = 1 / (1 + eta**2), 2 * eta / (1 + eta**2)
    half_exponential = exp_box(F(1, 2))
    y = half_exponential - 1
    global_y = half_exponential
    td = exp_box(1) + 10
    remaining_axial = td - y
    if remaining_axial.lower() <= 11:
        raise ArithmeticError("The actual remaining axial interval was not enclosed")
    k = F(2)
    # sigma(1/2)=1/2 and sigma'(1/2)=8 by the exact A.5 formula.
    kprime = -32 * exp_box(F(-1, 2))
    e2 = f**2 * exp_box(2 * parameters["logP"] - F(2, 5) - y)
    b_integral, c_integral, quadrature = first_stage_integrals(panels)
    k1, k2 = axial_prefix_integrals(panels)
    decay = exp_box(-y)
    r_i = exp_box(F(-13, 10)) * (F(5, 8) + b_integral)
    r_energy = exp_box(F(-3, 5)) * (F(5, 6) + c_integral) + y
    kbar = decay * (4 + k1)
    u2bar = decay * (16 + k2)
    W = 1 - L * kbar
    C_eta = -h * (1 - 8 * eta**2) + (D + 4 * d) * eta * j0prime
    a0 = 4 * L - 1
    q_start = a0 + (C_eta - a0) * r_i
    c0, c1 = -h + D * eta * j0prime, 2 * h * eta**2 + d * eta * j0prime
    qs = decay * q_start + c0 * (1 - decay) + c1 * decay * k1
    if qs.lower() <= 0:
        raise ArithmeticError("Cannot divide by an unseparated Qs enclosure")
    # Beyond this point the unedited angular schedule has theta in [0,1].
    # Relative to the current E, its squared tail is <= exp(-s)/(1-rho)^2.
    # On the remaining axial interval it is exactly exp(-s), with theta=1.
    tail_factor = 1 / (1 - rho)**2
    axial_mass = 1 - exp_box(-remaining_axial)
    pressure_over_e2 = I(-tail_factor / 2, -(axial_mass / 2).lower())
    pressure_eta_over_e2 = I((j0prime * axial_mass).lower(), j0prime * tail_factor)
    u2_over_e2 = eta**2 * u2bar / e2
    s_over_x_e2 = u2_over_e2 - r_energy / 2
    s_eta_over_x_e2 = 2 * eta * u2bar / e2 + j0prime * r_energy
    ns_over_e2 = (
        -W * k * eta / e2
        + 4 * h * eta * s_over_x_e2
        - d * s_eta_over_x_e2
        + 4 * A * eta * pressure_over_e2
        - d * pressure_eta_over_e2
    )
    bs_w = 2 * kprime * eta * ns_over_e2 / qs
    bs_squared = 4 * kprime**2 * eta**2 / e2
    a = F(2)
    first_margin = a - bs_w
    second_margin = 2 - 2 * bs_w - bs_squared / a
    pc_over_p1 = 1 - bs_w / a
    p1_over_xr = exp_box(global_y) * qs / L
    pc_over_xr = p1_over_xr * pc_over_p1
    verified = qs.lower() > 0 and pc_over_xr.upper() < 0
    simple_checks = {
        "etaStrictlyInsidePhysicalParameterInterval": 0 < eta < 1,
        "actualRemainingAxialLengthAboveEleven": remaining_axial.lower() > 11,
        "actualE2AboveTwoTo24": e2.lower() > 2**24,
        "actualMinusKPrimeAboveSixteen": (-kprime).lower() > 16,
        "actualQsBetweenOneFifthAndThree": qs.lower() > F(1, 5) and qs.upper() < 3,
        "actualNsOverE2BelowMinus49EtaOver100": ns_over_e2.upper() < -F(49, 100) * eta,
        "bsTimesWAbove147Over50": bs_w.lower() > F(147, 50),
        "firstConeMarginBelowMinus47Over50": first_margin.upper() < -F(47, 50),
        "PcNegativeForEveryPositiveXR": pc_over_xr.upper() < 0,
    }
    intervals = {
        "localAxialY": y, "globalLogXOverXR": global_y,
        "Td": td, "remainingAxialLength": remaining_axial,
        "kPrime": kprime, "E2": e2, "axialDecay": decay,
        "initialBIntegral": b_integral, "initialCIntegral": c_integral,
        "axialK1Integral": k1, "axialK2Integral": k2,
        "initialRadialMomentRatio": r_i, "energyPrefixOverCurrentXE2": r_energy,
        "kBar": kbar, "kSquaredAverage": u2bar, "W": W,
        "QsAtAxialStart": q_start, "Qs": qs,
        "PiOverE2": pressure_over_e2, "PiEtaOverE2": pressure_eta_over_e2,
        "NsOverE2": ns_over_e2, "bsTimesW": bs_w, "bsSquared": bs_squared,
        "firstSufficientConeMargin": first_margin,
        "secondSufficientConeMargin": second_margin,
        "PcOverP1": pc_over_p1, "P1OverXR": p1_over_xr, "PcOverXR": pc_over_xr,
    }
    return {
        "schema": "MathScope.OuterAxialCounterexample/1",
        "status": "CERTIFIED_POINTWISE_CONE_FAILURE" if verified else "UNRESOLVED",
        "sourceBinding": {
            "axisCertificate": axis_path.name, "axisCertificateSHA256": sha(axis_path),
            "pressureFamily": "source-outer-A21",
            "parametersExact": {k: str(v) for k, v in parameters.items()},
            "hIsOriginalBinary64Rational": str(h) == pressure["parameterHExact"],
            "outerSourceSHA256": sha(HERE.parents[1] / "followup-construction/outer.mjs"),
            "intervalLibrarySHA256": sha(FOLLOWUP / "uniform-gluing/dyadic_interval.py"),
            "sourcePaperSHA256": "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
        },
        "witness": {
            "etaExact": str(eta), "axialStepArgumentExact": "1/2",
            "localAxialYExact": "exp(1/2)-1", "globalLogXOverXRExact": "exp(1/2)",
            "kExact": "2", "kPrimeExact": "-32*exp(-1/2)", "aExact": "2",
            "XR": "Every positive real XR, including the actual common source radius",
        },
        "arithmetic": {"kind": "OUTWARD_DYADIC_INTERVALS", "bits": BITS,
                       "continuousIntegration": quadrature, "axialPanels": panels,
                       "binary64UsedForProof": False, "unboundedTailTruncated": False},
        "intervals": {k: v.json() for k, v in intervals.items()},
        "checks": simple_checks,
        "allCounterexampleChecksPassed": all(simple_checks.values()),
        "conclusion": {
            "actualRelaxedConeFails": verified,
            "reason": "Pc/XR is strictly negative, whereas the original relaxed cone requires Pc>2.",
            "merelyFailedSufficientCondition": False,
            "largerXRCannotRepair": verified,
            "globalCurrentDatumCandidateAdmissible": False,
            "paperExistentialConstructionRefuted": False,
            "generalNavierStokesConclusion": False,
            "previousLocalAxisOrJoiningResultsInvalidated": False,
            "originalAcceptanceSnapshotModified": False,
            "newLeanTheorem": False,
        },
        "proofBoundary": {
            "implemented": "Actual source coefficients, continuous initial/axial integrals, whole-tail pressure enclosures, and direct Pc reconstruction for the pinned candidate.",
            "analyticSteps": "Step monotonicity and symmetry, positive tail integration, source moment identities, and the literal A.2 schedule; derived in README.md.",
            "futureCorrections": "Forward pressure uses the fixed A.21 datum. Later pressure-neutral edits cannot alter this point. No uncertified numerical correction residual is asserted zero.",
            "formal": "The arithmetic and source formula evaluation are executable; their complete analytic correspondence has not been encoded as a Lean theorem.",
        },
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--axis", type=Path, default=FOLLOWUP / "source-coherence/source-axis-cone-refined.json")
    parser.add_argument("--panels", type=int, default=256)
    parser.add_argument("--output", type=Path, default=HERE / "axial-midpoint-certificate.json")
    args = parser.parse_args()
    result = build(args.axis, args.panels)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"status": result["status"], "checks": result["checks"],
                      "bounds": {k: result["intervals"][k]["approximate"] for k in
                                 ["Qs", "NsOverE2", "bsTimesW", "firstSufficientConeMargin", "PcOverXR"]}}, indent=2))
    if not result["allCounterexampleChecksPassed"]:
        raise SystemExit("The current execution did not verify every counterexample bound")


if __name__ == "__main__":
    main()
