#!/usr/bin/env python3
"""Certify the continuous B.8/C.2 five-bump maps in parameter-free units.

This constructs actual integral enclosures, not quadrature difference estimates.
It proves a uniform small-debt implicit-function neighbourhood. It deliberately
does not assert that the missing whole-eta, whole-profile upstream discrepancy
lies in that neighbourhood. Existing measured debts are membership diagnostics.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from fractions import Fraction as F
from pathlib import Path
from time import monotonic

from dyadic_interval import (I, BITS, SCALE, sigma, sigma_prime_box, sigma_second_box, power, exp_negative,
                            inverse_rational, matmul, matvec,
                            identity_matrix, infinity_norm_upper)

HERE = Path(__file__).resolve().parent
M1 = HERE.parents[2]
OLD = M1 / "navier/followup-construction"
INNER = OLD / "source-inner-gluing-fixture.json"
C12 = OLD / "source-radial-modulation-fixtures.json"
INNER_SHA = "b315186cd611b96678a2a3db268193f36d9aa93c50fa75ab17f24116d6cdd5f0"
C12_SOURCE_SHA = "4db08935854063f75a7422288339110364d00e0173da24e0cac7fef6d857864c"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rat(x):
    x = F(x)
    return {"numerator": str(x.numerator), "denominator": str(x.denominator),
            "approximate": float(x)}


def to_json(x):
    if isinstance(x, I):
        return x.json()
    if isinstance(x, F):
        return rat(x)
    if isinstance(x, dict):
        return {k: to_json(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [to_json(v) for v in x]
    return x


def profile_specs():
    if sha(INNER) != INNER_SHA:
        raise ValueError("pinned inner source fixture changed")
    inner = json.loads(INNER.read_text())["result"]
    c12 = json.loads(C12.read_text())
    if sha(OLD / "source-radial-modulation.mjs") != C12_SOURCE_SHA:
        raise ValueError("pinned C.12 producer changed")
    return [
        dict(name="B8_inner_patch", alpha=F(1, 10),
             supports=[[F(x) for x in s] for s in inner["etaStencilCorrections"][0]["supports"]],
             unit_mass=False, source=INNER, source_sha=INNER_SHA,
             producer=OLD / "source-inner-gluing.mjs", fixture=inner,
             u_radius=F(1, 20000), e_radius=F(3, 100000),
             debt_u_preconditioned=F(1, 25000), debt_e_preconditioned=F(1, 1000000)),
        dict(name="C2_first_patch", alpha=F(-7, 10),
             supports=[[F(x) for x in s] for s in c12["large"]["slices"][0]["repair"]["supports"]],
             unit_mass=True, source=C12, source_sha=sha(C12),
             producer=OLD / "source-radial-modulation.mjs", fixture=c12["large"],
             u_radius=F(1, 100000), e_radius=F(1, 10000),
             debt_u_preconditioned=F(1, 1000000), debt_e_preconditioned=F(1, 1000000)),
    ]


def interval_matrix_mid_inverse(a):
    exact = inverse_rational([[x.midpoint() for x in row] for row in a])
    enclosed = [[I(x) for x in row] for row in exact]
    prod = matmul(enclosed, a)
    resid = [[I(int(i == j)) - prod[i][j] for j in range(len(a))] for i in range(len(a))]
    z = infinity_norm_upper(resid)
    return dict(exact=exact, interval=enclosed, residual=resid, z=z,
                inverse_bound=infinity_norm_upper(enclosed) / (1 - z) if z < 1 else None)


def coefficients(spec, panels):
    if panels < 64 or panels > 32768 or panels % 32:
        raise ValueError("panels must be a multiple of 32 in [64,32768]")
    if len(spec["supports"]) != 5 or any(l <= 0 or l >= r for l, r in spec["supports"]):
        raise ValueError("five positive support intervals are required")
    if any(spec["supports"][j][1] >= spec["supports"][j + 1][0] for j in range(4)):
        raise ValueError("all five ordered supports must be disjoint")
    if spec["alpha"] in (F(-1, 2), F(1, 2), F(3, 2)):
        raise ValueError("power weights coalesce; no uniform inverse is claimed")
    if spec["name"] == "B8_inner_patch":
        if not (I(spec["supports"][0][0]).lo > exp_negative(I(6)).hi
                and I(spec["supports"][-1][1]).hi < exp_negative(I(5)).lo):
            raise ValueError("B.8 support leaves the specified logarithmic patch")
    elif spec["name"] == "C2_first_patch":
        if not (spec["supports"][0][0] > 8 and spec["supports"][-1][1] < 16):
            raise ValueError("C.2 support leaves the specified patch")
    # The two endpoint collars use analytic monotone majorants, not a sample.
    # Every central cell is integrated against positive d sigma, whose mass
    # is enclosed by sigma(v)-sigma(u). This avoids derivative quadrature.
    grid = [F(0)] + [F(k, panels) for k in range(panels // 16, 15 * panels // 16 + 1)] + [F(1)]
    s = [sigma(t) for t in grid]
    cells = []
    for j, (a, b) in enumerate(zip(grid, grid[1:])):
        mass = s[j + 1] - s[j]
        mass = I(max(0, mass.lo), mass.hi, raw=True)
        deriv = sigma_prime_box(a, b)
        cells.append((a, b, mass, deriv))
    linear = [[I(0) for _ in range(5)] for _ in range(5)]
    quadratic = [[I(0) for _ in range(5)] for _ in range(5)]
    root2 = power(I(2), F(1, 2))
    mass_enclosures = []
    for column, (left, right) in enumerate(spec["supports"]):
        width = right - left
        # b = sigma'(t)/width for C.2, b = sigma'(t) for the deployed B.8.
        factor = 1 / width if spec["unit_mass"] else F(1)
        factor_i, width_i = I(factor), I(width)
        moments = {}
        for exponent in {F(0), spec["alpha"] + F(1, 2), F(1, 2), spec["alpha"], spec["alpha"] - 1}:
            total = I(0)
            for a, b, mass, _ in cells:
                x = I(left + width * a, left + width * b)
                weight = power(x, exponent)
                total = total + weight * mass
            moments[exponent] = total * width_i * factor_i
        # Integral b is known exactly from the fundamental theorem of calculus.
        moments[F(0)] = I(width * factor)
        mass_enclosures.append(moments[F(0)])
        square, reciprocal_square = I(0), I(0)
        for a, b, mass, deriv in cells:
            x = I(left + width * a, left + width * b)
            square = square + deriv * mass
            reciprocal_square = reciprocal_square + deriv * mass / x
        square = square * width_i * factor_i ** 2
        reciprocal_square = reciprocal_square * width_i * factor_i ** 2
        if column < 2:
            linear[0][column] = moments[F(0)]
            linear[1][column] = root2 * moments[spec["alpha"] + F(1, 2)]
            quadratic[3][column] = square
        else:
            linear[2][column] = root2 * moments[F(1, 2)]
            linear[3][column] = -moments[spec["alpha"]]
            linear[4][column] = moments[spec["alpha"] - 1]
            quadratic[3][column] = -square / 2
            quadratic[4][column] = reciprocal_square / 2
    au = [[linear[i][j] for j in range(2)] for i in range(2)]
    ae = [[linear[i][j] for j in range(2, 5)] for i in range(2, 5)]
    iu, ie = interval_matrix_mid_inverse(au), interval_matrix_mid_inverse(ae)
    q_u = [[quadratic[i][j] for j in range(2)] for i in range(2, 5)]
    q_e = [[quadratic[i][j] for j in range(2, 5)] for i in range(2, 5)]
    # Signed products are accumulated before absolute values. This exploits
    # genuine algebraic cancellation between the S and Cp rows without
    # dropping any quadratic coefficient.
    pre_q_u = matmul(ie["interval"], q_u)
    pre_q_e = matmul(ie["interval"], q_e)
    bu, be = infinity_norm_upper(pre_q_u), infinity_norm_upper(pre_q_e)
    ru, re = spec["u_radius"], spec["e_radius"]
    beta_u, beta_e = spec["debt_u_preconditioned"], spec["debt_e_preconditioned"]
    u_image = beta_u + iu["z"] * ru
    e_image = beta_e + bu * ru ** 2 + ie["z"] * re + be * re ** 2
    e_lipschitz = ie["z"] + 2 * be * re
    max_bump = max(d.upper() for _, _, _, d in cells)
    max_bump_derivative = max(sigma_second_box(a, b).abs().upper() for a, b, _, _ in cells)
    max_e_factor = max(F(1) / (r - l) if spec["unit_mass"] else F(1)
                       for l, r in spec["supports"][2:])
    emin = min(power(I(l, r), spec["alpha"]).lower() for l, r in spec["supports"][2:])
    positivity = emin - re * max_bump * max_e_factor
    derivative_deviation = max(
        2 * re * (r * max_bump_derivative * (1 / (r - l) ** 2 if spec["unit_mass"] else 1 / (r - l))
                  + abs(spec["alpha"]) * max_bump * (1 / (r - l) if spec["unit_mass"] else 1)) / positivity
        for l, r in spec["supports"][2:]) if positivity > 0 else None
    u_shear_bound = max(
        2 * r * ru * max_bump_derivative * (1 / (r - l) ** 2 if spec["unit_mass"] else 1 / (r - l))
        / min(power(I(l, r), spec["alpha"]).lower(), positivity)
        for l, r in spec["supports"][:2]) if positivity > 0 else None
    passed = (iu["z"] < 1 and ie["z"] < 1 and u_image < ru
              and e_image < re and e_lipschitz < 1 and positivity > 0)
    return dict(spec=spec, linear=linear, quadratic=quadratic, inverse_u=iu, inverse_e=ie,
                cells=len(cells), panels=panels, mass_enclosures=mass_enclosures,
                pre_q_u=pre_q_u, pre_q_e=pre_q_e, bu=bu, be=be,
                u_image=u_image, e_image=e_image, e_lipschitz=e_lipschitz,
                max_bump=max_bump, max_bump_derivative=max_bump_derivative,
                shear_deviation=derivative_deviation, u_shear_bound=u_shear_bound,
                positivity=positivity, passed=passed)


def measure_membership(result):
    spec = result["spec"]
    if spec["name"] == "B8_inner_patch":
        records = spec["fixture"]["etaStencilCorrections"]
        selected = [(r["eta"], r["actualDebtFloat64"], I(1) / (1 + I(F(r["eta"])) ** 2), 4 * F(r["eta"]))
                    for r in records]
    else:
        # The reference input has lambda=1/5 and a 2:1 modulation radius, so
        # Kout=2**(1/10). The existing Float64 implementation is a diagnostic
        # source, not a certified integral or derivative oracle.
        selected = [(r["eta"], r["momentDebt"]["moments"], power(I(2), F(1, 10)), F(0))
                    for r in spec["fixture"]["slices"]]
    out = []
    for eta, raw, k, u0 in selected:
        d = [I(F(x)) for x in raw]
        normalized = [d[0] / k, (d[2] - u0 * d[1]) / k ** 2, d[1] / k,
                      (d[3] - 2 * u0 * d[0]) / k ** 2, d[4] / k ** 2]
        pu = matvec(result["inverse_u"]["interval"], normalized[:2])
        pe = matvec(result["inverse_e"]["interval"], normalized[2:])
        bound_u = max(x.abs().upper() for x in pu)
        bound_e = max(x.abs().upper() for x in pe)
        out.append(dict(eta=eta, transformed_debt=normalized,
                        preconditioned_debt_u=pu, preconditioned_debt_e=pe,
                        norm_u_upper=bound_u, norm_e_upper=bound_e,
                        lies_in_uniform_debt_neighborhood=(bound_u <= spec["debt_u_preconditioned"]
                                                          and bound_e <= spec["debt_e_preconditioned"]),
                        originalContinuousDebtEnclosed=False,
                        wholeEtaMembershipCertified=False,
                        interpretation="Existing measured Float64 debts interpreted as exact dyadic numbers for membership only; no quadrature-error enclosure is attached to those upstream debts."))
    return out


def serialize(result):
    spec = result["spec"]
    return to_json(dict(
        name=spec["name"], passed=result["passed"], grade="EXACT_OUTWARD_CONTINUOUS_MAP_AND_UNIFORM_IF_ENCLOSURE",
        source=dict(fixture=str(spec["source"].relative_to(M1)), fixtureSHA256=spec["source_sha"],
                    producer=str(spec["producer"].relative_to(M1)), producerSHA256=sha(spec["producer"])),
        geometry=dict(supports=spec["supports"], alpha=spec["alpha"], unitMass=spec["unit_mass"],
                      radiusConvention="The published numerical support endpoints are interpreted as exact IEEE754 dyadic rationals; every support remains strictly within its source patch.",
                      allFiveSupportsDisjoint=all(spec["supports"][j][1] < spec["supports"][j + 1][0] for j in range(4))),
        normalization=dict(base="E0=K*x^alpha, U0=c; K>0 and c are parameters constant in x on the patch",
                           perturbation="delta U=K*(v0*b0+v1*b1), delta E=K*(v2*b2+v3*b3+v4*b4)",
                           rows=["M/K", "(J-c*I)/K^2", "I/K", "(S-2*c*M)/K^2", "Cp/K^2"],
                           parameterIndependence="Every map coefficient below is independent of K, c, eta and Pstar. K(eta)>0 and c(eta) may vary smoothly.",
                           wholeEtaStatement="For every eta in [-1,1] and every smooth K(eta)>0,c(eta), the same neighbourhood applies whenever the same normalized debt bounds hold."),
        quadrature=dict(method="Positive Riemann-Stieltjes enclosures: sum range(weight,cell)*(sigma(right)-sigma(left)); squares use sigma_prime(cell)*d_sigma.",
                        continuousIntegralsEnclosed=True, dyadicBits=BITS, cells=result["cells"], nominalPanels=result["panels"],
                        exactBumpMass=result["mass_enclosures"], sampledGaussAgreementUsedAsProof=False),
        linearMap=result["linear"], quadraticDiagonal=result["quadratic"],
        exactPreconditionerU=result["inverse_u"]["exact"], exactPreconditionerE=result["inverse_e"]["exact"],
        inverseResidualU=result["inverse_u"]["residual"], inverseResidualE=result["inverse_e"]["residual"],
        inverseResidualNormU=result["inverse_u"]["z"], inverseResidualNormE=result["inverse_e"]["z"],
        inverseNormBoundU=result["inverse_u"]["inverse_bound"], inverseNormBoundE=result["inverse_e"]["inverse_bound"],
        nonlinearBounds=dict(preconditionedUQuadraticNorm=result["bu"], preconditionedEQuadraticNorm=result["be"],
                             uRadius=spec["u_radius"], eRadius=spec["e_radius"],
                             allowedPreconditionedDebtU=spec["debt_u_preconditioned"], allowedPreconditionedDebtE=spec["debt_e_preconditioned"],
                             uImageRadius=result["u_image"], eImageRadius=result["e_image"],
                             eContractionFactor=result["e_lipschitz"],
                             positivityLowerInUnitsOfK=result["positivity"],
                             strictInclusion=result["passed"],
                             jacobianInvertibleThroughoutCertifiedBall=result["passed"]),
        radialBounds=dict(bumpSupremum=result["max_bump"], normalizedBumpDerivativeSupremum=result["max_bump_derivative"],
                          absoluteDeviationOfAFromBase=result["shear_deviation"], absoluteAxialShearBound=result["u_shear_bound"],
                          baseA=1-2*spec["alpha"], allRadialPointsInFiveSupports=True,
                          pressureAndParameterDerivativeBoundsStillRequired=True),
        derivativeBounds=dict(
            first="u1 <= betaU1/(1-zU); e1 <= (betaE1+2*BU*ru*u1)/(1-qE)",
            second="u2 <= betaU2/(1-zU); e2 <= (betaE2+2*BU*(u1^2+ru*u2)+2*BE*e1^2)/(1-qE)",
            meaning="betaUj=||RU d_U^(j)||_infinity and betaEj=||RE d_E^(j)||_infinity on the same eta interval; these are input bounds, not inferred from point samples.",
            higherOrders="The polynomial map has degree two. Repeated differentiation and the same uniformly invertible Jacobian give finite bounds at every fixed order.",
            sourceDerivativeBoundsSupplied=False),
        sourceDebtMembershipDiagnostics=measure_membership(result),
        scope=dict(wholeContinuousPatchMapCertified=result["passed"], uniformParametersOfCorrectionOperatorCertified=result["passed"],
                   wholeSourceEtaDebtCertified=False, sourceContinuationCertified=False,
                   finalProfileConeCertified=False, newLeanKernelProof=False,
                   originalCriterionN305="BLOCKED: upstream whole-eta discrepancy/derivative and common-profile bounds still unavailable",
                   originalCriterionN306="BLOCKED: C.12 on the same full profile and the whole-domain cone remain unavailable")))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--panels", type=int, default=2048)
    ap.add_argument("--output", type=Path, default=HERE / "uniform-moment-certificate.json")
    args = ap.parse_args()
    started = monotonic()
    results = []
    for spec in profile_specs():
        result = coefficients(spec, args.panels)
        record = serialize(result)
        results.append(record)
        print(spec["name"], "PASS" if result["passed"] else "FAIL",
              "zU", float(result["inverse_u"]["z"]), "zE", float(result["inverse_e"]["z"]),
              "qE", float(result["e_lipschitz"]), "imageE", float(result["e_image"]), flush=True)
    payload = dict(schema="MathScope.UniformContinuousMomentMap/1", generatedUTC=datetime.now(timezone.utc).isoformat(),
                   allPassed=all(r["passed"] for r in results),
                   implementationSHA256=sha(Path(__file__)), arithmeticSHA256=sha(HERE / "dyadic_interval.py"),
                   elapsedSeconds=monotonic() - started, results=results)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(args.output, sha(args.output), flush=True)
    raise SystemExit(0 if payload["allPassed"] else 1)


if __name__ == "__main__":
    main()
