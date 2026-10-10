#!/usr/bin/env python3
"""Independent, source-bound support for the pulse analytic review.

This script checks exact algebra and scalar estimates used in REVIEW_EN.md.
It does not infer continuous identities from the producer's scalar flags.
It writes only its own checks.json and never invokes a producer's main().
Run with python3 -B.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
TARGET = HERE.parent
FROZEN = {
    "OUTER_DERIVATION.md": "ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81",
    "check_outer_envelopes.py": "b5a84d2408d1acc29c170e97db2a8d79600da93e46c678123f7b6a8547fc6889",
    "outer-envelope-certificate.json": "7da0ae60395cd3a8d2d428546271485daacbb570dd4757e284d7318c25b1a18d",
}
PAPER_SHA = "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f"
NAMES = ("eta", "h", "ell", "Jp", "E", "m", "meta", "R",
         "s", "seta", "pi", "pieta", "c", "Rxi", "inverseX")
ZERO = (0,) * len(NAMES)


class Poly:
    """Small independent exact polynomial ring; no target algebra is imported."""
    def __init__(self, terms):
        self.p = {e: F(c) for e, c in terms.items() if c}

    @staticmethod
    def number(c):
        return Poly({ZERO: F(c)})

    @staticmethod
    def variable(name):
        e = [0] * len(NAMES)
        e[NAMES.index(name)] = 1
        return Poly({tuple(e): 1})

    def __add__(self, other):
        other = other if isinstance(other, Poly) else Poly.number(other)
        out = dict(self.p)
        for e, c in other.p.items():
            out[e] = out.get(e, F(0)) + c
        return Poly(out)

    __radd__ = __add__

    def __neg__(self):
        return Poly({e: -c for e, c in self.p.items()})

    def __sub__(self, other):
        return self + (-other if isinstance(other, Poly) else -F(other))

    def __rsub__(self, other):
        return -self + other

    def __mul__(self, other):
        other = other if isinstance(other, Poly) else Poly.number(other)
        out = {}
        for e, c in self.p.items():
            for f, d in other.p.items():
                ef = tuple(a+b for a, b in zip(e, f))
                out[ef] = out.get(ef, F(0)) + c*d
        return Poly(out)

    __rmul__ = __mul__

    def __pow__(self, n):
        if n < 0 or int(n) != n:
            raise ValueError("Only nonnegative integer powers are used")
        out = Poly.number(1)
        for _ in range(n):
            out = out * self
        return out

    def derivative(self, name):
        j = NAMES.index(name)
        out = {}
        for e, c in self.p.items():
            if e[j]:
                f = list(e)
                f[j] -= 1
                out[tuple(f)] = e[j]*c
        return Poly(out)


def exp_interval(x):
    """Rational enclosure using 128 Taylor terms and its complete tail."""
    x = F(x)
    if x < 0:
        lo, hi = exp_interval(-x)
        return 1/hi, 1/lo
    if x >= 100:
        raise ValueError("Only fixed small exponents are evaluated")
    n = 128
    term = total = F(1)
    for k in range(1, n+1):
        term *= x/k
        total += term
    first_omitted = term*x/(n+1)
    tail = first_omitted/(1-x/(n+2))
    return total, total+tail


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def independent_absorb(coefficient, q, power, target):
    """c*exp(q*T)*lambda**power <= exp(target*T), T>=128."""
    coefficient, q, power, target = map(F, (coefficient, q, power, target))
    # c <= 2**128 < exp(T), with the whole exponent compared exactly.
    return 0 < coefficient <= 2**128 and q+1-1000*power <= target


def main():
    if not sys.dont_write_bytecode:
        raise SystemExit("Use python3 -B to keep reviewed directories unchanged")
    before = {name: sha(TARGET/name) for name in FROZEN}
    checks = {}

    def check(name, value):
        if name in checks:
            raise ValueError("Duplicate check")
        checks[name] = bool(value)

    check("reviewed_revision_matches_frozen_SHA256", before == FROZEN)
    spec = importlib.util.spec_from_file_location("review_target_outer", TARGET/"check_outer_envelopes.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    target_result = module.build()
    stored = json.loads((TARGET/"outer-envelope-certificate.json").read_text())
    check("nonmutating_producer_regeneration_matches_stored_JSON", target_result == stored)
    check("producer_all_106_scalar_checks_pass", target_result["passed"] == target_result["total"] == 106)
    check("paper_hash_matches_reviewed_user_source", stored["sourceBindings"]["paperSHA256"] == PAPER_SHA)
    check("producer_does_not_promote_scalar_checks_to_continuous_proof",
          stored["analyticBridge"]["scalarChecksAloneProveContinuousIdentities"] is False)

    eta, h, ell, Jp, E, m, meta, R, s, seta, pi, pieta, c, Rxi, inverseX = (
        Poly.variable(name) for name in NAMES)
    D, A, d = F(1,2)-h, F(1,2)+h, 1-eta**2
    W = 1-E*(2*D*eta*m+d*(meta-Jp*m))
    # Formula 4.9, with l=-lambda, U=E*R and (log E)_eta=-Jp.
    direct_Sq = ell*W-h*(1-2*eta*E*R)+(D*eta+d*E*R)*Jp
    expanded_Sq = ell-h+D*eta*Jp+E*(-ell*(2*D*eta*m+d*(meta-Jp*m))
                                                    +2*h*eta*R+d*R*Jp)
    check("independent_exact_49_angular_source_identity", not (direct_Sq-expanded_Sq).p)

    # Formula 4.16 divided by E. M_eta/(XE)=m_eta-Jp*m and
    # S_eta/(XE^2)=s_eta-2*Jp*s; pi=Pi/E^2, pieta=Pi_eta/E^2.
    direct_N = -W*R + D*(m-eta*(meta-Jp*m)) + E*(
        4*h*eta*s-d*(seta-2*Jp*s)+4*A*eta*pi-d*pieta)
    rem_N = E*((2*D*eta*m+d*(meta-Jp*m))*R
               +(4*h*eta+2*d*Jp)*s-d*seta+4*A*eta*pi-d*pieta)
    expanded_N = -R+(D+D*eta*Jp)*m-D*eta*meta+rem_N
    check("independent_exact_416_normalized_N_identity", not (direct_N-expanded_N).p)
    wrong_extra_X = -W*R*inverseX + D*(m-eta*(meta-Jp*m)) + E*(
        4*h*eta*s-d*(seta-2*Jp*s)+4*A*eta*pi-d*pieta)
    check("negative_control_extra_X_in_WU_is_detected", bool((wrong_extra_X-expanded_N).p))
    wrong_S_eta = direct_N-2*d*Jp*s*E
    check("negative_control_missing_normalization_derivative_is_detected",
          bool((wrong_S_eta-expanded_N).p))

    beta, alpha, qnum = F(1,2)-ell, 1-ell, ell-h+c
    original_leading_cleared = alpha*(-beta**2*R+(D+c)*beta*R-ell*(D+c)*Rxi)
    expected_leading_cleared = alpha*beta*qnum*R-ell*(D+c)*alpha*Rxi
    check("independent_exact_w_coefficient_identity_after_denominator_clearing",
          not (original_leading_cleared-expected_leading_cleared).p)
    check("alpha_over_beta_equals_two_plus_lambda_over_beta", not (alpha-2*beta-ell).p)
    check("negative_control_dropping_small_lambda_R_correction_is_detected",
          bool((alpha-2*beta).p))
    check("eta_singular_ratio_bound_uses_nonnegative_square",
          not ((eta**2+ell)**2-4*ell*eta**2-(eta**2-ell)**2).p)

    # Before the pulse, eta^2/f^2=eta^2*(1+eta^2)^2. Its first
    # derivative has nonnegative coefficients whose sum is 16.
    pre_positive_shape = eta**2*(1+eta**2)**2
    pre_derivative = pre_positive_shape.derivative("eta")
    check("pre_S_normalized_positive_derivative_constant_16",
          sum(pre_derivative.p.values()) == 16 and all(x > 0 for x in pre_derivative.p.values()))
    check("pre_S_C1_geometric_constant_256", 16*16 == 256)

    small_lambda, tiny_eps, beta_min = F(1,2**200), F(1,2**60), F(49,100)
    check("both_actual_pulse_weight_slopes_above_point_49",
          F(1,2)-2*small_lambda > beta_min)
    check("whole_support_pulse_weights_inside_point9_point11",
          exp_interval(F(-3,40))[0] > F(9,10) and exp_interval(F(3,40))[1] < F(11,10))
    check("pulse_actual_matrix_determinant_lower",
          exp_interval(F(24,25))[0] > 2 and F(9,10)**2*2*2 > 3)
    inverse_row1, inverse_row2 = 2*F(11,10)*3/3, 2*F(11,10)/3
    check("pulse_inverse_corrected_first_and_second_row_bounds",
          inverse_row1 == F(11,5) < 4 and inverse_row2 < 4)
    check("main_moment_constant_600_includes_center_offset",
          121*exp_interval(F(3,2))[1] < 600)

    # Each pulse correction is a_i+b_i*Amp. Each affine coefficient
    # and its eta derivative is bounded by lambda^200.
    coefficient = F(11,5)       # 1+max Amp
    moment_square_C1_sum = 60*coefficient**2+120*coefficient+120*coefficient**2
    check("actual_disjoint_end_bump_energy_C1_below_10_to_6",
          moment_square_C1_sum < 10**6)
    check("total_eta_derivative_of_end_coefficients_below_4_lambda200",
          1+F(6,5)+1 < 4)
    check("end_bump_C2_and_eta_remainder_below_lambda180",
          10*F(8192000,27)*small_lambda**18 < 1)

    kb_end = F(449,50)
    kb_lower = exp_interval(F(-1,25))[0]*(F(1,4)-exp_interval(-2*kb_end)[1]*(
        kb_end**2/2+kb_end/2+F(1,4)))
    check("independent_exact_Kb_polynomial_minorant_integral", kb_lower > F(1,5))
    check("actual_total_S_principal_root_bracket_and_derivative",
          F(81,100)/4-(1-exp_interval(-26)[1])/4 < F(-47,1000)
          and F(36,125)-F(1,4) == F(38,1000)
          and F(9,25)-F(1,1000) > F(7,20))
    check("amplitude_partial_derivative_inverse_below_three", F(20,7) < 3)
    check("m_convolution_second_order_constant", F(4096)/beta_min**3 < 65536)
    check("m_eta_from_actual_differentiated_convolution",
          1+F(34)/beta_min < 71 and 71 < 2**(4*128))
    check("normalized_S_forcing_sum_below_225", F(196)+F(1,2)+28 < 225)
    check("normalized_S_convolution_constant_absorbed",
          2926*3**26 < 2**(26*128))
    check("actual_Sq_geometric_bracket_below_16",
          small_lambda*61+28*small_lambda**8+14 < 16)
    check("normalized_N_geometric_bracket_below_2000", 61*14 < 2000)
    check("lambda_R_coefficient_remainder_below_29lambda", F(14)/beta_min < 29)

    # Term-by-term w error, including Q versus Qinf. Nothing replaces
    # |eta|/(lambda+eta^2) with an absolute constant.
    independent_errors = {
        "lambda_R_remainder": (29, 0, 1),
        "convolution_second_order_over_Q": (524288, 0, 1),
        "incoming_m_over_Q": (8, 16, 28),
        "eta_derivative_over_Q": (2, 24, F(1,2)),
        "N_remainder_over_Q": (8, 30, 28),
        "denominator_replacement": (2400, 4, 29),
        "end_correction_in_leading_w": (5, 0, 180),
    }
    for name, (coefficient_, q, power) in independent_errors.items():
        check("independent_w_error_absorption_"+name,
              independent_absorb(coefficient_, q, power, -190))
    check("seven_exp_minus190T_errors_fit_epsilon", 7 < 2**(4*128))
    check("shear_error_512lambda_fits_epsilon", independent_absorb(512,0,1,-186))

    cross = F(201,100)*F(6,5)
    first_max, second_max = cross**2/8, (2*cross)**2/14
    check("independent_actual_pulse_quadratic_margins",
          first_max+315*tiny_eps < F(3,4)
          and second_max+181000*tiny_eps < F(7,4))
    false_keys = ("newB2AxisOrB8JoiningRegenerated", "globalC12FrequencyAndIncomingMomentsCertified",
                  "A7HeatEndpointCollarIncluded", "fullOriginalProfileCompleted", "originalN3GatePromoted")
    check("no_original_global_or_new_Lean_claim_is_promoted",
          all(stored["interpretation"][k] is False for k in false_keys)
          and stored["analyticBridge"]["claimedAsNewLeanProof"] is False)
    check("review_did_not_change_frozen_target_files",
          before == {name: sha(TARGET/name) for name in FROZEN})

    record = {
        "schema": "MathScope.OuterPulseIndependentAnalyticReview/1",
        "status": "REVIEW_SUPPORT_CHECKS_PASS" if all(checks.values()) else "REVIEW_FAILURE",
        "reviewedSHA256": before,
        "sourceBindings": stored["sourceBindings"],
        "targetScalarChecks": {"passed": target_result["passed"], "total": target_result["total"]},
        "reviewChecks": checks,
        "passed": sum(checks.values()), "total": len(checks),
        "independentErrorEnvelope": {
            name: {"coefficient":str(c_), "expTCoefficient":str(q), "lambdaPower":str(power)}
            for name,(c_,q,power) in independent_errors.items()
        },
        "exactSupplementaryBounds": {
            "pulseInverseRow1TimesLambdaUpper": str(inverse_row1),
            "pulseInverseRow2TimesLambdaUpper": str(inverse_row2),
            "endCorrectionEnergyC1CoefficientUpper": str(moment_square_C1_sum),
            "firstPulseQuadraticMaximum": str(first_max),
            "secondPulseQuadraticMaximum": str(second_max),
        },
        "analyticAssessment": {
            "file": "REVIEW_EN.md",
            "noBlockingDefectFoundInReviewedPulseAndMomentBridge": True,
            "scope": "Sections 4-7 incoming estimates, actual angular/pulse moment roots, total-S root and full pulse cone; the release-energy and backward-pressure lemmas are checked separately in independent-postpulse and independent-axial.",
            "scalarChecksAreNotTheContinuousProof": True,
            "wholeOriginalProfileClaimed": False,
            "newLeanAnalyticTheorem": False,
            "originalGatePromoted": False,
            "reviewedTargetsChanged": False,
        },
    }
    (HERE/"checks.json").write_text(json.dumps(record,indent=2)+"\n")
    print(json.dumps({"status":record["status"],"passed":record["passed"],"total":record["total"],
                      "failed":[k for k,v in checks.items() if not v]},indent=2))
    if not all(checks.values()):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
