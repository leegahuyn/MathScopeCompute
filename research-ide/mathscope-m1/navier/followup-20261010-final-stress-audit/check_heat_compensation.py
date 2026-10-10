#!/usr/bin/env python3
"""Exact scalar checks for HEAT_COMPENSATION_PROOF_EN.md.

This checks the constants in a continuous mathematical argument and binds
its operator input. It does not replace that argument, re-evaluate the
continuous cell enclosure from scratch, or prove a final profile in Lean.
No giant exponential is converted to a floating-point number.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
from datetime import datetime, timezone
from fractions import Fraction as F
from pathlib import Path


ROOT = Path(__file__).resolve().parent
NAVIER = ROOT.parent
OUTER = NAVIER / "followup-20261010-outer-reselection"
GLUING = NAVIER / "followup-20261010-symbolic-gluing"
OUTER_SHA = "ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81"
TREE_SHA = "38e23d037f8b75eaeb30448a815689e92171926d47787196c7c5395fe98425a8"
PAPER_SHA = "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f"
TMIN = 128
HMAX = F(1, 100)
LMAX = F(1, 2**200)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def frac(value: dict) -> F:
    """Never read an approximate field as mathematical evidence."""
    return F(int(value["numerator"]), int(value["denominator"]))


def interval(value: dict) -> tuple[F, F]:
    den = 2 ** int(value["denominatorPowerOfTwo"])
    return (F(int(value["lowerNumerator"]), den),
            F(int(value["upperNumerator"]), den))


def interval_matrix_norm(matrix: list) -> F:
    return max(sum(max(abs(lo), abs(hi)) for lo, hi in map(interval, row))
               for row in matrix)


def require(condition: bool, label: str) -> None:
    if not condition:
        raise ValueError(label)


def bind_operator(cert: dict) -> dict[str, bool]:
    """Fail closed on the input properties actually used by this proof."""
    source, geometry, bounds = cert["source"], cert["geometry"], cert["bounds"]
    canonical = json.dumps(source["parameterExpressions"],
                           sort_keys=True, separators=(",", ":")).encode()
    require(source["outerDerivationSHA256"] == OUTER_SHA,
            "The operator names a different outer derivation")
    require(source["parameterTreeSHA256"] == TREE_SHA and
            hashlib.sha256(canonical).hexdigest() == TREE_SHA,
            "The operator parameter expressions differ")
    require(frac(source["lambdaUpper"]) == LMAX,
            "The operator does not cover the intended lambda interval")
    expected = [(F(n), F(2*n+1, 2)) for n in range(9, 14)]
    require([tuple(map(frac, support)) for support in geometry["supports"]] == expected,
            "The five actual bump supports differ")
    require(geometry["bump"] == "sigma'((x-left)/width)/width" and
            geometry["unitMass"] is True,
            "The operator has a different bump or mass convention")
    scale = source["physicalScale"]
    require(scale["patchOffsets"] == [25, 20, 14, 8] and
            scale["constantSlopeStartAmplitude"] ==
            "Pstar*exp(-T/2-7/10-lambda/2)" and
            scale["X0i"] == "XR*exp(T+2+60*B-offset_i)",
            "The physical scale or I2 selection differs")
    require(cert["normalization"]["scaledDebtRows"][2:] == [
        "dI/(X0^(3/2)*K*lambda)", "dS/(X0*K^2*lambda)",
        "dCp/(K^2*lambda)"], "The E debt normalization differs")
    require(cert["allPassed"] is True and
            all(value is True for value in cert["checks"].values()),
            "The continuous operator reports a failed check")
    inv = cert["inverseE"]
    exact_rnorm = max(sum(abs(frac(x)) for x in row)
                      for row in inv["preconditioner"])
    enclosed_rnorm = interval_matrix_norm(inv["enclosedPreconditioner"])
    for rrow, irow in zip(inv["preconditioner"], inv["enclosedPreconditioner"]):
        for r, i in zip(rrow, irow):
            lo, hi = interval(i)
            require(lo <= frac(r) <= hi, "A preconditioner entry is not enclosed")
    require(exact_rnorm <= enclosed_rnorm == frac(inv["preconditionerNorm"]) < 7500,
            "The E preconditioner norm is not below 7500")
    require(interval_matrix_norm(inv["residual"]) == frac(inv["residualNorm"]) < F(1, 16),
            "The E inverse residual is not below 1/16")
    require(frac(bounds["BE"]) < 10000 and
            frac(bounds["eContraction"]) < F(1, 16),
            "The E quadratic or contraction bound is too large")
    # The JSON fields are raw sigma' and sigma'' bounds. A unit-mass
    # beta on width 1/2 has supremum 2*sigma' and derivative 4*sigma''.
    require(2*frac(bounds["bumpSupremum"]) < 18 and
            4*frac(bounds["bumpDerivativeSupremum"]) < 404,
            "An actual width-1/2 bump envelope exceeds the bound used here")
    require(frac(bounds["scaledERadius"]) == F(1, 10**6) and
            frac(bounds["allowedPreconditionedDebtPerEtaDerivativeOrder0To2"]) == F(1, 10**8),
            "The radius or allowed all-eta debt differs")
    require(frac(bounds["eImage"]) < F(1, 10**6) and
            frac(bounds["eEtaDerivative1"]) < F(1, 10**6) and
            frac(bounds["eEtaDerivative2"]) < F(1, 10**6),
            "The E branch or its first two derivatives leave the certified box")
    require(frac(bounds["positiveEOverK"]) > F(1, 4) and
            frac(bounds["radialShearErrorOverLambda"]) < F(1, 4),
            "Positivity or radial shear preservation fails")
    return {
        "sameOuterAndParameterExpressions": True,
        "actualFiveSupportsAndI2PhysicalScale": True,
        "sameExactMomentNormalization": True,
        "preconditionerAndResidualRecomputedWithFractions": True,
        "requiredContinuousOperatorBounds": True,
    }


def scalar_checks() -> tuple[dict[str, bool], list[dict]]:
    checks: dict[str, bool] = {}
    absorptions: list[dict] = []

    def check(label: str, condition: bool) -> None:
        checks[label] = bool(condition)
        require(condition, label)

    def exp_bound(label: str, power: int, decay: int, offset: int,
                  target_power: int) -> None:
        """Verify 2^power exp(-decay*T+offset) < 2^target_power.

        For positive s, exp(-s)<2^-s because exp(1)>2.
        All calculations therefore reduce to exact integer exponents at
        T>=128. The record retains every exponent for inspection.
        """
        minimum_decay = decay*TMIN-offset
        check(label, decay > 0 and minimum_decay > 0 and
              power-minimum_decay < target_power)
        absorptions.append({
            "name": label, "expression": f"2^{power} * exp(-{decay}*T+{offset})",
            "TLower": TMIN, "strictUpperPowerOfTwo": target_power,
            "integerExponentAtTLower": power-minimum_decay,
        })

    check("TAtLeast128", 2**20 + 1 + 10 >= TMIN)
    exp_bound("lambdaAtMost2ToMinus200", 0, 1000, 0, -200)
    exp_bound("hAtMostOneHundredth", 0, 8002, 0, -7)
    check("twoToMinus7BelowOneHundredth", F(1, 2**7) < HMAX)
    check("hBelowLambdaSquared", 8002 > 2*1000)
    check("hBelowLambdaExpMinusT", 8002 > 1000+1)
    check("correctI2Exponent", 1+60*1000 == 60001 and 2-20 == -18)
    check("correctLambdaI2Exponent", 60001-1000 == 59001)
    check("correctHI2Exponent", 60001-8002 == 51999)
    check("eStarAtMostOne", -F(59997, 2)*TMIN+F(93, 10) < 0 and
          F(39, 2)-60000*TMIN < 0)
    check("allSupportsWithinXBounds", 8 < 9 and F(27, 2) < 16)
    check("logSupportsInsideFive", 16 < 2**5)  # exp(5)>2^5.
    check("heatHPrimeBound", 1+HMAX < 2)
    check("heatHSecondBound", (1+HMAX)**2*(2+HMAX) < 3)
    check("heatHValueBound", 2*(1+HMAX) < 3)
    check("heatEtaFirstBound", 4*2 <= 8)
    check("heatEtaSecondBound", 4**2*3 + 4*2 <= 64)
    check("heatSquareEtaSecondBound", 2*8**2*HMAX+2*64 < 256)
    check("pressureImproperIntegralConstant", F(512, 2) <= 256)
    check("energyImproperIntegralConstant", 512 <= 512)
    check("angularImproperIntegralConstant", 2*128**2 < 256**2)
    check("normalizingEtaProductBound", (4+2*8+16)*512 < 2**15 and
          (2+2*2+2)*512 < 2**15)
    check("preconditionedDebtConstant", 7500*2**15 < 2**28)
    exp_bound("preconditionedActualDebtBelow2ToMinus27", -12, 59001, 18, -27)
    check("twoToMinus27BelowAllowedDebt", F(1, 2**27) < F(1, 10**8))
    check("rootTwiceDifferentiatedQuadraticAbsorption",
          8*LMAX*10000*F(1, 10**8) < 1)
    check("physicalRootConstant", 4*2**28 == 2**30)
    exp_bound("physicalRootBelow2ToMinus10", -10, 60001, 18, -10)
    check("physicalRootPositiveDenominator", 72*F(1, 2**10) < F(1, 4))
    check("actualUnitMassBumpScaling", 9/F(1, 2) == 18 and 101/F(1, 2)**2 == 404)
    check("partialAngularMomentConstant", (3*4*2)**2*2 < 64**2)
    check("partialEnergyMomentConstant", 9+108*F(1, 16) < 64)
    check("partialQConstant",
          (96*8 + 16*72)*F(4, 3) < 2**12)
    check("partialNConstant", (1+4*HMAX+4*(F(1, 2)+HMAX)+1)*64 < 384)
    check("partialNRatioConstant", 384*8*256 <= 2**20)
    exp_bound("partialRelativeQBelowOneQuarter", 10, 51999, 18, -2)
    check("partialWConstant", 8*2**20*2**30 <= 2**54)
    exp_bound("partialWBelowEpsilon", 14, 51797, 18, 0)
    exp_bound("epsilonBelow2ToMinus60", 0, 186, 0, -60)
    exp_bound("newI2QuadraticRatioGap", 4, 968, 0, -2)  # 9 < 2^4.
    check("postPatchQConstant", F(3, 2)*256*2 <= 2**10)
    check("postPatchNConstant",
          (1+4*HMAX)*512 + (4*(F(1, 2)+HMAX)+1)*256 < 2048)
    check("postPatchNRatioConstant", 2048*256 == 2**19)
    check("postPatchWConstant", 2**20+2**19 <= 2**21)
    exp_bound("postPatchWBelowEpsilon", -19, 51797, 18, 0)
    # Each of the three loss terms is separately <1/32, hence total<1/8.
    exp_bound("ratioMarginLossTerm1", 5, 186, 0, -5)   # 30 < 32.
    exp_bound("ratioMarginLossTerm2", 2, 170, 0, -5)
    exp_bound("ratioMarginLossTerm3", 1, 372, 0, -5)
    check("ratioMarginRemaining", 3*F(1, 32) < F(1, 8))
    check("spliceQConstant", (F(3, 2)*256+6*HMAX)*2 < 2**11)
    exp_bound("spliceRelativeQBelowOneQuarter", -21, 51999, 18, -2)
    exp_bound("spliceWBelowEpsilon", -17, 51797, 18, 0)
    check("heatRadialDerivativeConstant", 30*3+3 == 93 and 2*2*93 == 372)
    check("spliceStrictShear", 2**40 > 744)
    check("spliceWBelowOneFiftieth", F(1, 100)+F(1, 2**60) < F(1, 50))
    check("intermediateCRemainsAboveQuarter", F(1, 3)-F(15, 2**61) > F(1, 4))
    check("intermediateCBelow2260", 2259+F(15, 2**61) < 2260)
    check("actualConeThreshold", max((116+2)*4, 8*2260*116*8) < 2**26)
    check("actualRadialPExceedsThreshold", F(2**40, 64*2) == 2**33 and 2**33 > 2**26)
    check("heatCollarPositiveAngularExponent", F(3, 2)-(F(1, 2)+HMAX) > 0)
    check("heatCollarRadiusRatio", 3**5 < 16**2)
    check("heatCollarRatioPrefactor", 2*(16-1) < 32)
    check("heatCollarTailRatio", 64*LMAX**100 < F(1, 100))
    check("heatCollarHAboveHalf", 1-3*HMAX/F(2**40) > F(1, 2))
    check("heatCollarHeatShear", 6/F(2**40) < F(1, 4))
    check("heatCollarFoShear", F(1, 256)*9/(2*(1-HMAX/256)) < F(1, 4))
    check("terminalNormalizedConeKappaHalf", 1+F(1, 100)**2 < 4 and
          2*HMAX*F(1, 100)**2 < F(3, 2))
    check("terminalEndpointPositiveCoefficient", 16*F(1, 2) == 8)
    return checks, absorptions


def negative_controls(cert: dict) -> dict[str, bool]:
    """Meaningful failure checks on input bindings and consumed bounds."""
    mutations = {
        "rejectDifferentOuterPressureSource": lambda c: c["source"].__setitem__("outerDerivationSHA256", "0"*64),
        "rejectChangedLambdaRange": lambda c: c["source"]["lambdaUpper"].__setitem__("numerator", "0"),
        "rejectDifferentPhysicalPatch": lambda c: c["source"]["physicalScale"].__setitem__("patchOffsets", [25, 21, 14, 8]),
        "rejectWrongMomentNormalization": lambda c: c["normalization"]["scaledDebtRows"].__setitem__(2, "dI"),
        "rejectUnenclosedPreconditioner": lambda c: c["inverseE"]["preconditioner"][0][0].__setitem__("numerator", "0"),
        "rejectLargeQuadraticBound": lambda c: c["bounds"].__setitem__("BE", {"numerator": "10001", "denominator": "1"}),
        "rejectLostStrictShear": lambda c: c["bounds"].__setitem__("radialShearErrorOverLambda", {"numerator": "1", "denominator": "4"}),
    }
    results = {}
    for name, mutation in mutations.items():
        changed = copy.deepcopy(cert)
        mutation(changed)
        try:
            bind_operator(changed)
        except (ValueError, KeyError):
            results[name] = True
        else:
            raise ValueError(f"A negative control was accepted: {name}")
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--certificate", type=Path,
                        default=GLUING / "attempts/0001/certificate.json")
    args = parser.parse_args()
    cert = json.loads(args.certificate.read_text())
    require(sha(OUTER / "OUTER_DERIVATION.md") == OUTER_SHA,
            "The actual outer derivation has changed")
    require(sha(GLUING / "certify_symbolic_c2.py") == cert["arithmetic"]["implementationSHA256"],
            "The operator certificate producer has changed")
    operator = bind_operator(cert)
    scalars, absorptions = scalar_checks()
    negatives = negative_controls(cert)
    base = ROOT / "attempts"
    base.mkdir(exist_ok=True)
    number = 1
    while (base / f"{number:04d}").exists():
        number += 1
    out = base / f"{number:04d}"
    out.mkdir()
    receipt = {
        "schema": "mathscope-heat-compensation-scalar-audit-v1",
        "generatedUTC": datetime.now(timezone.utc).isoformat(),
        "inputs": {
            "originalPaperSHA256": PAPER_SHA,
            "outerDerivationSHA256": sha(OUTER / "OUTER_DERIVATION.md"),
            "parameterTreeSHA256": TREE_SHA,
            "continuousOperatorCertificateSHA256": sha(args.certificate),
            "proofSHA256": sha(ROOT / "HEAT_COMPENSATION_PROOF_EN.md"),
            "checkerSHA256": sha(Path(__file__)),
        },
        "operatorBindings": operator,
        "scalarChecks": scalars,
        "exponentialAbsorptions": absorptions,
        "negativeControls": negatives,
        "allPassed": True,
        "scope": {
            "sameNewOuter": True,
            "actualHeatDebtDefinedByContinuousIntegrals": True,
            "allEtaC2DebtBoundSuppliedToSameOperator": True,
            "sameA21DatumForHeatPreparedOuter": True,
            "partialMomentBoundsUsedBetweenSeparatedSupports": True,
            "terminalStressConclusionRequiresSameRegularAxis": True,
            "originalPaperMathematicsTrustedAsSource": True,
            "continuousProofIndependentlyReviewed": False,
            "newLeanProof": False,
            "fullTheorem46ProfileCertified": False,
            "N3_02AutomaticallyPromoted": False,
            "N3_07AutomaticallyPromoted": False,
        },
    }
    (out / "receipt.json").write_text(json.dumps(receipt, indent=2)+"\n")
    print(json.dumps({"allPassed": True, "operatorBindings": len(operator),
                      "scalarChecks": len(scalars), "negativeControls": len(negatives),
                      "receipt": str(out / "receipt.json"),
                      "fullTheorem46ProfileCertified": False}, indent=2))


if __name__ == "__main__":
    main()
