#!/usr/bin/env python3
"""Exact finite checks supporting the NEW A.21 analytic axis construction.

The actual infinite-dimensional and calculus arguments are in
SAME_DATUM_ANALYTIC_AXIS.md.  This program does not evaluate an enormous
exponential, replace a small positive number by zero, or assert an
unproved analytic premise as a Lean proof.
"""
from __future__ import annotations

import hashlib
import json
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent
OUTER = NAVIER / "followup-20261010-outer-reselection"
PINNED_ORIGINAL = {
    "AxisContraction.lean":"d9151673815948eef8e8e2db3e93c95119ce7be80fc6a01d8a83f2bc4cd4df9d",
    "NaturalAxisBridge.lean":"9d1d98bdc48199dd483ab6cc8cd5a356847373faab7aca2908c166cd6d0c754f",
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical_sha(data):
    return hashlib.sha256(json.dumps(data, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


# Exact nonnegative polynomials in Q. No sampled value of Q decides a bound.
class Poly:
    def __init__(self, coefficients=None):
        self.c = {int(k): F(v) for k, v in (coefficients or {}).items() if v}

    def __add__(self, other):
        out = dict(self.c)
        for k, v in other.c.items():
            out[k] = out.get(k, F(0)) + v
        return Poly(out)

    def __mul__(self, other):
        out = {}
        for k, v in self.c.items():
            for l, w in other.c.items():
                out[k+l] = out.get(k+l, F(0)) + v*w
        return Poly(out)

    def scale(self, x):
        return Poly({k: F(x)*v for k, v in self.c.items()})

    def record(self):
        return {str(k): str(v) for k, v in sorted(self.c.items())}

    def below_power(self, degree):
        # For all Q>=2^260, c Q^d <= Q^(d+1) if c<=2^260.
        return bool(self.c) and all(v >= 0 for v in self.c.values()) and \
            max(self.c) < degree and sum(self.c.values()) <= 2**260


ZERO, ONE, Q = Poly(), Poly({0: 1}), Poly({1: 1})


def controlled_tree():
    """Triangle/Lipschitz propagation of the literal naturalRemainder tree.

    Every fixed-field norm, operator norm and argument norm is bounded by Q.
    Actual amplitude norm <=2 is used, and |1/Lambda|<=1. A pair is bounded
    by the sum, which bounds the product-space maximum norm used by Lean.
    Signs are discarded only when passing to nonnegative upper bounds.
    """
    const = lambda b: (b, ZERO)
    add = lambda x, y: (x[0]+y[0], x[1]+y[1])
    scale = lambda c, x: (x[0].scale(c), x[1].scale(c))
    linear = lambda op, x: (op*x[0], op*x[1])
    bilinear = lambda op, x, y: (op*x[0]*y[0], op*(x[1]*y[0]+x[0]*y[1]))
    product = lambda x, y: bilinear(Q, x, y)
    total = lambda rows: __import__("functools").reduce(add, rows, const(ZERO))
    field = {name: const(Q) for name in ["one", "eta", "d", "inverseL", "uStar",
             "uStarEta", "wStar", "hStar", "normalizedGradient", "zStar"]}
    phi, u = (Q, ONE), (Q, ONE)
    bu = linear(Q, u)
    # |A|, |D|, |h|<=1, retaining numerical factors 2 and 4 exactly.
    angular_linear = total([field["wStar"], field["one"],
                            scale(2, product(field["eta"], field["uStar"]))])
    angular_quadratic = product(field["d"], field["normalizedGradient"])
    average = scale(2, field["eta"])
    slow = scale(2, field["eta"])
    axial_linear = total([field["one"], scale(4, product(field["eta"], field["uStar"])),
                          product(field["d"], field["uStarEta"])])
    axial_quadratic = scale(2, field["eta"])
    lin1 = total([linear(Q, product(angular_linear, phi)),
                  bilinear(Q, field["wStar"], phi), bilinear(Q, phi, field["hStar"])])
    quad1 = linear(Q, product(product(angular_quadratic, u), phi))
    slow1 = total([
        linear(Q, product(add(product(average, bu), product(slow, u)), phi)),
        bilinear(Q, bu, product(field["d"], phi)),
        bilinear(Q, product(average, bu), phi),
        product(field["d"], bilinear(Q, bu, phi)),
        bilinear(Q, phi, product(field["d"], u)),
    ])
    lin2 = total([linear(Q, product(axial_linear, u)),
                  bilinear(Q, field["wStar"], u), bilinear(Q, u, field["hStar"])])
    slow2 = total([
        linear(Q, product(axial_quadratic, product(u, u))),
        bilinear(Q, product(average, bu), u),
        product(field["d"], bilinear(Q, bu, u)),
        bilinear(Q, u, product(field["d"], u)),
    ])
    amplitude = const(ONE.scale(2))
    source = product(product(amplitude, amplitude), product(phi, phi))
    pressure = linear(Q, total([
        product(scale(4, field["eta"]), linear(Q, source)),
        product(field["d"], linear(Q, source)),
        product(scale(2, field["eta"]), linear(Q, source)),
    ]))
    first = linear(Q, product(field["inverseL"], total([lin1, quad1, slow1])))
    second = product(field["inverseL"], total([lin2, slow2, pressure]))
    result = add(first, second)
    return result, {name: {"bound": value[0].record(), "lipschitz": value[1].record()}
                    for name, value in [("lin1",lin1),("quad1",quad1),("slow1",slow1),
                                        ("lin2",lin2),("slow2",slow2),("pressure",pressure),
                                        ("first",first),("second",second)]}


def build(official_root=None):
    outer = json.loads((OUTER/"outer-envelope-certificate.json").read_text())
    # The provenance is read from the actual current parameter tree, not an old
    # finite pressure certificate. This script only accepts the new family.
    params = outer["parametersExactExpressions"]
    expected = {
        "Md": {"integer": 2**20},
        "T": {"sum": [{"exp": {"ref": "Md"}}, {"integer": 10}]},
        "logP": {"product": [{"integer": 2}, {"ref": "T"}]},
        "Pstar": {"exp": {"ref": "logP"}},
        "lambda": {"exp": {"product": [{"integer": -1000}, {"ref": "T"}]}},
        "h": {"exp": {"product": [{"integer": -8002}, {"ref": "T"}]}},
        "co": {"rational": "1/256"}, "Tf": {"integer": 128},
    }
    checks = {}

    def check(name, statement):
        if name in checks:
            raise ValueError("Repeated exact check")
        checks[name] = bool(statement)

    check("new_outer_expression_tree_exact", params == expected)
    if official_root is not None:
        official_root = Path(official_root)
        for name, pinned_hash in PINNED_ORIGINAL.items():
            check("live_original_"+name.replace(".","_"),
                  sha(official_root/"NavierStokes"/name) == pinned_hash)
    check("T_lower_at_least_128", 2**20+11 > 128)
    check("h_and_j_below_one_over_1000", 1+8002*128 > 1000)
    # Low-H collar: -j/3<eta<-j/6, then pressure sign has a fixed margin.
    hmax, jmax = F(1,1000), F(1,1000)
    check("D_lower", F(1,2)-hmax == F(499,1000))
    check("negative_outer_H_collar", F(499,3000) > F(1,100))
    check("right_small_negative_H_margin",
          -F(1,12)+(1-jmax*jmax/F(36))/3 > F(1,100))
    check("nonnegative_H_eta_below_half", F(3,4) > F(1,100))
    check("nonnegative_H_eta_above_half", F(499,2000) > jmax/100)
    adverse = F(501,1000)*(1+F(2,9)*jmax*jmax)/3
    positive_margin = F(1,3)-adverse-F(1,25)
    check("Z_on_low_H_exceeds_delta", positive_margin > F(1,10))
    check("low_Z_chi_lower", F(400,401) > F(99,100))
    w = F(33,32)
    outside_subtraction = (w*w-1)*(4*w+jmax)
    check("outside_unit_interval_H_stays_separated", F(499,1000)-outside_subtraction > F(1,5))
    # Entire complex tube, not sampled complex points.
    zmax = F(17,16)
    sigma_max = jmax/2000
    Rmax = sigma_max*sigma_max/2048
    check("tube_inside_modulus_bound", F(33,32)+Rmax < zmax)
    Hsup = F(9,2)*zmax+4*zmax**3+jmax*(1+zmax*zmax)
    Hprime = F(9,2)+12*zmax*zmax+2*jmax*zmax
    check("complex_H_bound_ten", Hsup < 10)
    check("complex_H_derivative_bound_twenty", Hprime < 20)
    check("quadratic_denominator_perturbation", F(400,2048)+400*sigma_max**2/F(2048**2) < F(1,4))
    check("L_lower_99_over_100", 1-2*hmax*zmax*zmax > F(99,100))
    check("one_plus_z_squared_real_part", 1-Rmax*Rmax > F(99,100))
    check("pressure_derivative_disk_fits", Rmax+F(1,32) < F(1,16))
    check("zeta_upper", F(2)*10/F(3,4) < 32)
    # One uses |H^2| <= H(real)^2+qdev and denominator >= H(real)^2+sigma²-qdev.
    check("chi_sup_at_most_one_from_quarter_perturbation", F(1,4) <= 1-F(1,4))
    check("coefficient_cauchy_loss_below_two", (1+F(1,16))/(1-F(1,16))**3 < 2)
    check("complex_Z_sup_below_1024K", 1*(1+2*2*5)*5+4*10+3*160+4*1*2*5 < 1024)
    check("all_operator_constants_below_Q", 5120*65536 < 2**260)
    check("all_field_constants_below_Q", 2*1024 < 2**260)
    check("gradient_constant_below_Q", 2*32 < 2**260)
    # Resolvent factorial series <= exp(160) < 2^256.
    check("resolvent_argument_below_80_squared", 2560*2 < 80**2)
    check("exp160_below_two256", 3**160 < 2**256)
    check("reference_axial_norm_bound", 40*64*4*2048 < 2**25)
    check("reference_ball_below_Q", 2**256+2**25+1 < 2**260)
    result, tree = controlled_tree()
    check("literal_tree_bound_below_Q32", result[0].below_power(32))
    check("literal_tree_lipschitz_below_Q32", result[1].below_power(32))
    check("sharp_remainder_degree11_coefficient_sum58", max(result[0].c)==11 and sum(result[0].c.values())==58)
    check("sharp_lipschitz_degree10_coefficient_sum102", max(result[1].c)==10 and sum(result[1].c.values())==102)
    check("sharp_eta_source_residual_absorbs_fixed_coefficient", F(29,4)*F(200,159)**2*40 < 2**260)
    check("Lambda_Q64_dominates_threshold", 1+2*2**(260*32) < 2**(260*64))
    check("selfmap_and_lipschitz_below_half", F(1,2*2**(260*32)) < F(1,2))
    check("uniform_Phi_margin", F(305719,1152000)-F(1,2**100) > F(1,4))
    # Every k,m<=2 on |Y|<=5; actual factorial/derivative coefficient bound.
    import math
    mixed = {}
    for k in range(3):
        for m in range(3):
            scalar = F(math.factorial(k+m), (m+1)**2*20**k)*(F(4,3)**(k+m+1))
            mixed[f"{k},{m}"] = str(scalar)
            check(f"mixed_evaluation_scalar_{k}_{m}_below_128", scalar < 128)
    check("rho_inverse_below_Q", 65536 < 2**260)
    check("mixed_error_below_Q_minus_29", 64 < 2**260)
    check("pressure_norm_bound", 80*64**3*4 < 2**260)
    expressions = {
        **params,
        "K": {"power": [{"ref":"Pstar"},2]},
        # The companion continuation receipt makes the final matching choice.
        # This local checker alone does not assert the incoming B.8 debt.
        "epsilonMoment": {"power":[{"ref":"h"},3]},
        "muMoment": {"power":[{"ref":"h"},2]},
        "j0": {"power":[{"ref":"h"},4]},
        "deltaStar": {"quotient":[{"ref":"j0"},{"integer":10}]},
        "sigmaStar": {"quotient":[{"ref":"j0"},{"integer":2000}]},
        "outerComplexRadius": {"quotient":[{"power":[{"ref":"sigmaStar"},2]},{"integer":2048}]},
        "rho": {"quotient":[{"power":[{"ref":"sigmaStar"},2]},{"integer":65536}]},
        "Q": {"quotient":[{"product":[{"integer":2**260},{"ref":"K"}]},{"power":[{"ref":"sigmaStar"},2]}]},
        "Lambda": {"power":[{"ref":"Q"},64]},
        "logCaxis": {"sum":[{"quotient":[{"product":[{"integer":64},{"ref":"Lambda"}]},{"power":[{"ref":"sigmaStar"},2]}]},{"integer":1}]},
        "Caxis": {"exp":{"ref":"logCaxis"}},
    }
    return {
        "schema":"MathScope.Navier.SameDatumAxisEnvelopes/1",
        "status":"EXACT_SCALAR_CHECKS_SUPPORT_WRITTEN_LOCAL_AXIS_PROOF",
        "sourceBinding":{
            "paperSHA256":"0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
            "officialCommit":"f9e8bc5b38b6e212696e8a30e3e91517af887bbd",
            "outerDerivationSHA256":sha(OUTER/"OUTER_DERIVATION.md"),
            "outerParameterExpressionSHA256":canonical_sha(params),
            "officialAxisContractionSHA256":PINNED_ORIGINAL["AxisContraction.lean"],
            "officialNaturalAxisBridgeSHA256":PINNED_ORIGINAL["NaturalAxisBridge.lean"],
            "originalSourceVerification":"live supplied checkout" if official_root else "portable pinned hashes, previously read from the unchanged original source",
        },
        "parametersExactExpressions":expressions,
        "parameterExpressionSHA256":canonical_sha(expressions),
        "checks":checks,"passed":sum(checks.values()),"total":len(checks),
        "controlledRemainder":{"polynomialBound":result[0].record(),"polynomialLipschitz":result[1].record(),"tree":tree,
           "uniformRange":"Every Q>=2^260 and every actual coefficient-space input in the radius-one ball; all fields and operators have derived norms <=Q.",
           "boundExponent":32,"lambdaExponent":64,
           "sharpDisplacement":"29*Q^(-53)","sharpContraction":"51*Q^(-54)"},
        "lowHMarginOverJLower":str(positive_margin),
        "mixedEvaluationScalarBounds":mixed,
        "boundaries":{
            "writtenProofSuppliesInfiniteFixedPoint":True,
            "finiteChecksAloneProveAnalyticClaims":False,
            "oldPressureCertificateReused":False,
            "positiveExponentialsEvaluatedAsFloat":False,
            "fullAnalyticPremisesProvedInLean":False,
            "oldBinary64JetIdentified":False,
            "B8IncomingDebtProvedByThisLocalCheckerAlone":False,
            "finalJChoiceAndDebtSuppliedInCompanionReceipt":"continuation-debt-certificate.json",
            "fullN3Completion":False,
        },
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--official-root", type=Path)
    args = parser.parse_args()
    result = build(args.official_root)
    if args.write:
        (HERE/"axis-envelope-certificate.json").write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps({"passed":result["passed"],"total":result["total"],"status":result["status"],
                      "failed":[k for k,v in result["checks"].items() if not v]}))
    raise SystemExit(result["passed"] != result["total"])
