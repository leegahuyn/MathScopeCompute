#!/usr/bin/env python3
"""Whole-cell C.2 moment certificate for the new positive symbolic lambda.

The original U block loses numerical rank as lambda -> 0. We perform an
EXACT row operation before enclosure, using (x**(-lambda)-1)/lambda,
and set the physical bump coefficients v=lambda*z. This does not set
lambda to zero or remove the original inverse-lambda loss from the debt.
No incoming full-profile debt is fabricated by this program.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from datetime import datetime, timezone
from fractions import Fraction as F
from pathlib import Path
from time import monotonic

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent
ARITH = NAVIER / "followup-next/uniform-gluing"
OUTER = NAVIER / "followup-20261010-outer-reselection"
PINS = {
    "dyadic_interval.py": "20664d56cab022014273c2bfecff3ff1fb59c6e737123e0f337d49f248b74b4c",
    "logarithmic_interval.py": "4a83ee73f387f483acf2cb57933b0548b1487ee23e673f5a5601ce38493f66d6",
    "certify_uniform_moment_map.py": "b9cbad7d99428e42cb50d041980e3ff2ca09cf94401061b95b247f2abbdda9f5",
}
OUTER_SHA = "ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81"
PARAMETER_SHA = "38e23d037f8b75eaeb30448a815689e92171926d47787196c7c5395fe98425a8"
OUTER_PRODUCER_SHA = "b5a84d2408d1acc29c170e97db2a8d79600da93e46c678123f7b6a8547fc6889"


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


for filename, expected in PINS.items():
    if sha(ARITH / filename) != expected:
        raise ValueError(f"Immutable arithmetic dependency changed: {filename}")
sys.path.insert(0, str(ARITH))
from dyadic_interval import (I, BITS, sigma, sigma_prime_box, sigma_second_box,
                            power, inverse_rational, matmul, infinity_norm_upper)
from logarithmic_interval import log_interval

LAMBDA_MAX = F(1, 2**200)
SUPPORTS = tuple((F(n), F(2*n+1, 2)) for n in range(9, 14))


def rational(x):
    x = F(x)
    return {"numerator": str(x.numerator), "denominator": str(x.denominator),
            "approximate": float(x)}


def encode(x):
    if isinstance(x, I):
        return x.json()
    if isinstance(x, F):
        return rational(x)
    if isinstance(x, dict):
        return {k: encode(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [encode(v) for v in x]
    return x


def source_binding():
    if sha(OUTER / "OUTER_DERIVATION.md") != OUTER_SHA:
        raise ValueError("The new outer mathematical source has changed")
    path = OUTER / "check_outer_envelopes.py"
    if sha(path) != OUTER_PRODUCER_SHA:
        raise ValueError("The new outer parameter source has changed")
    spec = importlib.util.spec_from_file_location("pinned_outer_expressions", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    parameters = module.parameter_expressions()
    canonical = json.dumps(parameters, sort_keys=True, separators=(",", ":")).encode()
    if hashlib.sha256(canonical).hexdigest() != PARAMETER_SHA:
        raise ValueError("Unexpected new outer parameter tree")
    # These are comparisons of exponents, not evaluation of exp(exp(Md)).
    # T>=128 implies 0<exp(-1000*T)<2^-200, using exp(1)>2.
    checks = {
        "TLowerIsValid": 2**20 + 1 + 10 >= 128,
        "lambdaUpperByExponent": 1000 * 128 > 200,
        "hUpperByExponent": 8002 * 128 > 200,
        "supportsPositiveDisjoint": all(a > 0 and a < b for a, b in SUPPORTS)
        and all(SUPPORTS[j][1] < SUPPORTS[j+1][0] for j in range(4)),
        "supportsInside8To16": SUPPORTS[0][0] > 8 and SUPPORTS[-1][1] < 16,
        "logSupportInside0To5": log_interval(I(SUPPORTS[0][0])).lower() > 0
        and log_interval(I(SUPPORTS[-1][1])).upper() < 5,
        "reservedIntervalsFit": 60 * 1000 * 128 > 25,
    }
    if not all(checks.values()):
        raise ValueError("Source geometry or parameter implication failed")
    return {
        "outerDerivationSHA256": OUTER_SHA,
        "parameterTreeSHA256": PARAMETER_SHA,
        "parameterExpressions": parameters,
        "strictLambdaMeaning": "lambda=exp(-1000*T)>0, T=exp(2^20)+10; never replaced by 0",
        "lambdaUpper": LAMBDA_MAX,
        "checks": checks,
        "baseField": "U=0; E=K(eta)*x^(-1/2-lambda), K(eta)=e_star/(1+eta^2)>0",
        "physicalScale": {
            "B": "1000*T",
            "constantSlopeStart": "X=XR*exp(T+2)",
            "constantSlopeStartAmplitude": "Pstar*exp(-T/2-7/10-lambda/2)",
            "patchOffsets": [25, 20, 14, 8],
            "X0i": "XR*exp(T+2+60*B-offset_i)",
            "e_star_i": "Pstar*exp(-T/2-7/10-lambda/2-(1/2+lambda)*(60*B-offset_i))",
            "coordinate": "X=X0i*x; each support has log(x) in (0,5)",
            "roles": ["I1: cone-restoration", "I2: heat-compensation", "I3: background-reserved", "I4: mean-reserved"],
            "XR": "Any later exact XR>=2^40; not a fabricated fixed final core radius",
        },
    }


def divided_weight(x, lambda_upper=LAMBDA_MAX):
    """For 0<lambda<=upper and x>1, enclose the exact divided difference.

    w_lambda(x)=-integral_0^log(x) exp(-lambda*s) ds.
    0 <= w_lambda(x)+log(x) <= lambda*log(x)^2/2.
    All the nonzero remainder, including outward rounding, is retained.
    """
    x = I(x)
    if x.lower() <= 1 or not 0 < lambda_upper <= LAMBDA_MAX:
        raise ValueError("Requires x>1 and a valid strictly positive lambda upper bound")
    l = log_interval(x)
    remainder = F(lambda_upper) * l.upper()**2 / 2
    return I(-l.upper(), -l.lower() + remainder)


def small_power_factor(x, lambda_upper=LAMBDA_MAX):
    """Uniform enclosure of x**(-lambda) on x>1, lambda in (0,upper]."""
    x = I(x)
    if x.lower() <= 1 or not 0 < lambda_upper <= LAMBDA_MAX:
        raise ValueError("Requires x>1 and a valid strictly positive lambda upper bound")
    l = log_interval(x)
    return I(1 - lambda_upper*l.upper(), 1)


def inverse_certificate(matrix):
    exact = inverse_rational([[x.midpoint() for x in row] for row in matrix])
    enclosed = [[I(x) for x in row] for row in exact]
    product = matmul(enclosed, matrix)
    residual = [[I(int(i == j)) - product[i][j] for j in range(len(matrix))]
                for i in range(len(matrix))]
    z = infinity_norm_upper(residual)
    return {"preconditioner": exact, "enclosedPreconditioner": enclosed,
            "residual": residual, "residualNorm": z,
            "preconditionerNorm": infinity_norm_upper(enclosed),
            "inverseNormBound": infinity_norm_upper(enclosed)/(1-z) if z < 1 else None}


def compute(panels=1024):
    if panels < 128 or panels > 8192 or panels % 32:
        raise ValueError("panels must be a multiple of 32 in [128,8192]")
    binding = source_binding()
    grid = [F(0)] + [F(k, panels) for k in range(panels//16, 15*panels//16+1)] + [F(1)]
    step_values = [sigma(t) for t in grid]
    cells = []
    for j, (a, b) in enumerate(zip(grid, grid[1:])):
        mass = step_values[j+1] - step_values[j]
        mass = I(max(0, mass.lo), mass.hi, raw=True)
        cells.append((a, b, mass, sigma_prime_box(a, b)))
    linear = [[I(0) for _ in range(5)] for _ in range(5)]
    quadratic = [[I(0) for _ in range(5)] for _ in range(5)]
    root2 = power(I(2), F(1,2))
    coefficient_integrals = []
    for column, (left, right) in enumerate(SUPPORTS):
        width = right-left
        w, half, minus_half, minus_three_halves, square, reciprocal_square = [I(0) for _ in range(6)]
        for a, b, mass, derivative in cells:
            x = I(left + width*a, left + width*b)
            factor = small_power_factor(x)
            root = power(x, F(1,2))
            w += divided_weight(x)*mass
            half += root*mass
            minus_half += factor/root*mass
            minus_three_halves += factor/(x*root)*mass
            # b(x)=sigma'((x-left)/width)/width has exact integral one.
            square += derivative*mass/width
            reciprocal_square += derivative*mass/(width*x)
        coefficient_integrals.append({"mass": I(1), "dividedLog": w, "sqrt": half,
                                      "minusHalfLambda": minus_half,
                                      "minusThreeHalvesLambda": minus_three_halves,
                                      "bumpSquared": square, "bumpSquaredOverX": reciprocal_square})
        if column < 2:
            linear[0][column] = I(1)
            linear[1][column] = w
            quadratic[3][column] = square
        else:
            linear[2][column] = root2*half
            linear[3][column] = -minus_half
            linear[4][column] = minus_three_halves
            quadratic[3][column] = -square/2
            quadratic[4][column] = reciprocal_square/2
    au = [row[:2] for row in linear[:2]]
    ae = [row[2:] for row in linear[2:]]
    iu, ie = inverse_certificate(au), inverse_certificate(ae)
    pre_qu = matmul(ie["enclosedPreconditioner"], [row[:2] for row in quadratic[2:]])
    pre_qe = matmul(ie["enclosedPreconditioner"], [row[2:] for row in quadratic[2:]])
    bu, be = infinity_norm_upper(pre_qu), infinity_norm_upper(pre_qe)
    ru = re = F(1, 10**6)
    beta = F(1, 10**8)
    zu, ze = iu["residualNorm"], ie["residualNorm"]
    image_u = beta + zu*ru
    image_e = beta + LAMBDA_MAX*bu*ru**2 + ze*re + LAMBDA_MAX*be*re**2
    lipschitz_e = ze + 2*LAMBDA_MAX*be*re
    up = beta/(1-zu) if zu < 1 else F(10**9)
    ep = (beta + 2*LAMBDA_MAX*bu*ru*up)/(1-lipschitz_e) if lipschitz_e < 1 else F(10**9)
    upp = up
    epp = (beta+2*LAMBDA_MAX*bu*(up**2+ru*upp)+2*LAMBDA_MAX*be*ep**2)/(1-lipschitz_e) if lipschitz_e < 1 else F(10**9)
    max_bump = max(d.upper() for _, _, _, d in cells)
    max_bump_derivative = max(sigma_second_box(a,b).abs().upper() for a,b,_,_ in cells)
    emin = min((small_power_factor(I(a,b))/power(I(a,b),F(1,2))).lower() for a,b in SUPPORTS)
    correction_e_bound_over_lambda = re*max_bump*2  # every width is exactly 1/2
    positivity = emin - LAMBDA_MAX*correction_e_bound_over_lambda
    da_over_lambda = max(2*re*(b*max_bump_derivative/(b-a)**2
                              +(F(1,2)+LAMBDA_MAX)*max_bump/(b-a))/positivity
                         for a,b in SUPPORTS[2:]) if positivity > 0 else None
    db_over_lambda = max(2*b*ru*max_bump_derivative/(b-a)**2/emin
                         for a,b in SUPPORTS[:2])
    checks = {
        "newOuterInputBound": all(binding["checks"].values()),
        "allContinuousCellsCovered": grid[0] == 0 and grid[-1] == 1 and all(a < b for a,b,_,_ in cells),
        "uInverseResidualBelowOne": zu < 1,
        "eInverseResidualBelowOne": ze < 1,
        "strictUInclusion": image_u < ru,
        "strictEInclusion": image_e < re,
        "eContraction": lipschitz_e < 1,
        "allEtaFirstDerivativeInsideSameRadii": up < ru and ep < re,
        "allEtaSecondDerivativeInsideSameRadii": upp < ru and epp < re,
        "positiveCorrectedAzimuthalField": positivity > 0,
        "radialShearErrorBelowLambdaOver4": da_over_lambda is not None and da_over_lambda < F(1,4),
        "axialShearErrorBelowLambdaOver4": db_over_lambda < F(1,4),
        "strictBaseShearPersists": da_over_lambda is not None and da_over_lambda < 2,
    }
    return {
        "schema": "MathScope.SymbolicLambdaContinuousMomentMap/1",
        "generatedUTC": datetime.now(timezone.utc).isoformat(),
        "source": binding,
        "geometry": {"supports": SUPPORTS, "allSupportsDisjoint": True,
                     "bump": "sigma'((x-left)/width)/width", "unitMass": True},
        "arithmetic": {"bits": BITS, "panels": panels, "wholeCells": len(cells),
                       "dependencies": PINS, "implementationSHA256": sha(__file__),
                       "lambdaRemainderRetained": True,
                       "method": "Exact outward Riemann-Stieltjes cells; endpoint collars use analytic derivative bounds; positive measure d(sigma)."},
        "normalization": {
            "physicalUnknown": "v=lambda*z; delta U=K*lambda*sum(z0*b0+z1*b1), delta E=K*lambda*sum(z2*b2+z3*b3+z4*b4)",
            "originalMomentRows": ["M", "I", "J", "S", "Cp"],
            "scaledDebtRows": ["dM/(X0*K*lambda)",
                               "(dJ/(sqrt(2)*X0^(3/2)*K^2)-dM/(X0*K))/lambda^2",
                               "dI/(X0^(3/2)*K*lambda)", "dS/(X0*K^2*lambda)", "dCp/(K^2*lambda)"],
            "equation": "A_lambda*z+lambda*Q(z)=scaledDebt",
            "exactRowEquivalenceRequires": "lambda>0; K>0; X0>0; pairwise disjoint bump supports",
            "limitUse": "lambda=0 is only a continuous enclosure limit; never an allowed original C.2 source",
            "etaScope": "The same matrix enclosures cover every eta in [-1,1], because eta enters only the exact positive K and the debt.",
        },
        "coefficientIntegrals": coefficient_integrals,
        "linearMap": linear, "quadraticDiagonal": quadratic,
        "inverseU": iu, "inverseE": ie,
        "preconditionedQuadraticU": pre_qu, "preconditionedQuadraticE": pre_qe,
        "bounds": {
            "BU": bu, "BE": be, "scaledURadius": ru, "scaledERadius": re,
            "allowedPreconditionedDebtPerEtaDerivativeOrder0To2": beta,
            "uImage": image_u, "eImage": image_e, "eContraction": lipschitz_e,
            "uEtaDerivative1": up, "eEtaDerivative1": ep,
            "uEtaDerivative2": upp, "eEtaDerivative2": epp,
            "bumpSupremum": max_bump, "bumpDerivativeSupremum": max_bump_derivative,
            "positiveEOverK": positivity, "eCorrectionOverKLambda": correction_e_bound_over_lambda,
            "radialShearErrorOverLambda": da_over_lambda, "axialShearErrorOverLambda": db_over_lambda,
        },
        "checks": checks, "allPassed": all(checks.values()),
        "claimBoundary": {
            "sameNewOuterParameterBound": True,
            "physicalReservedPatchBound": True,
            "continuousIntegralMapCertified": all(checks.values()),
            "uniformEtaConditionalInclusionCertified": all(checks.values()),
            "actualModulationIncomingDebtEnclosed": False,
            "infiniteAxisConstructedHere": False,
            "fullProfileCertified": False,
            "formalLeanProof": False,
            "missing": "Actual same-source incoming scaled debts and final global cone; operator inclusion alone does not close N3-05 or N3-06.",
        },
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--panels", type=int, default=1024)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise FileExistsError("Use a fresh certificate path; old observations are immutable")
    start = monotonic()
    result = compute(args.panels)
    result["elapsedSeconds"] = monotonic()-start
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(encode(result), indent=2)+"\n")
    print(json.dumps({"allPassed": result["allPassed"],
                      "checks": result["checks"],
                      "zU": float(result["inverseU"]["residualNorm"]),
                      "zE": float(result["inverseE"]["residualNorm"]),
                      "rENorm": float(result["inverseE"]["preconditionerNorm"]),
                      "daOverLambda": float(result["bounds"]["radialShearErrorOverLambda"]),
                      "elapsedSeconds": result["elapsedSeconds"], "outputSHA256": sha(args.output)}))
    if not result["allPassed"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
