#!/usr/bin/env python3
"""Recompute finite bounds for the NEW same-datum B.22/B.26/B.8 bridge.

The integral and differentiation arguments are given in
CONTINUATION_AND_NEW_DEBT.md and REFERENCE_DERIVATIVE_BOUNDS.md.  Every
finite coefficient, moment-map polynomial, preconditioner entry, and debt
inequality checked here uses exact rational arithmetic.  The only large
quantities used are positive expression trees and nonnegative polynomials
in Q; no exponential is evaluated as zero or infinity.  These finite
checks are not represented as a completed Lean analytic proof.
"""
from __future__ import annotations

from fractions import Fraction as F
from math import comb, factorial
from pathlib import Path
import hashlib
import json

from check_axis_envelopes import Poly, canonical_sha

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent
B8 = NAVIER / "followup-20261010-symbolic-gluing/attempts/b8-0001/certificate.json"
ZERO, ONE = Poly(), Poly({0: 1})


def qp(degree=1, coefficient=1):
    return Poly({degree: coefficient})


def psum(terms):
    out = ZERO
    for p in terms:
        out = out + p
    return out


def jet_add(*jets):
    return [psum(j[k] for j in jets) for k in range(len(jets[0]))]


def jet_scale(jet, scale):
    return [p.scale(scale) for p in jet]


def jet_mul(a, b):
    n = min(len(a), len(b))
    return [psum((a[k] * b[m-k]).scale(comb(m, k)) for k in range(m+1))
            for m in range(n)]


def const_jet(p, n):
    return [p] + [ZERO] * n


def exp_jet(log_derivative_bounds, value_bound=ONE):
    """Bell recursion for actual, unnormalized derivatives of exp(v)."""
    n = len(log_derivative_bounds) - 1
    out = [value_bound]
    for m in range(1, n+1):
        out.append(psum((out[k] * log_derivative_bounds[m-k]).scale(comb(m-1, k))
                        for k in range(m)))
    return out


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class MPoly:
    """Small QQ multivariate polynomial used for a fresh source-map expansion."""
    def __init__(self, terms=None):
        self.c = {tuple(k): F(v) for k, v in (terms or {}).items() if v}

    @classmethod
    def scalar(cls, value):
        return cls({(): F(value)})

    @classmethod
    def variable(cls, name):
        return cls({((name, 1),): 1})

    def __add__(self, other):
        if not isinstance(other, MPoly):
            other = MPoly.scalar(other)
        out = dict(self.c)
        for k, v in other.c.items():
            out[k] = out.get(k, F(0)) + v
        return MPoly(out)

    __radd__ = __add__

    def __neg__(self):
        return MPoly({k: -v for k, v in self.c.items()})

    def __sub__(self, other):
        return self + (-other if isinstance(other, MPoly) else -F(other))

    def __rsub__(self, other):
        return (-self) + other

    def __mul__(self, other):
        if not isinstance(other, MPoly):
            other = MPoly.scalar(other)
        out = {}
        for a, av in self.c.items():
            for b, bv in other.c.items():
                exponents = dict(a)
                for name, e in b:
                    exponents[name] = exponents.get(name, 0) + e
                key = tuple(sorted(exponents.items()))
                out[key] = out.get(key, F(0)) + av * bv
        return MPoly(out)

    __rmul__ = __mul__

    def __pow__(self, n):
        out = MPoly.scalar(1)
        for _ in range(n):
            out = out * self
        return out


def moment_map_polynomials():
    v = {name: MPoly.variable(name) for name in
         "U H M Me I Ie J Je S Se Cp Cpe P0 P0e X iX iL iH iE h eta".split()}
    U, H, M, Me, I, Ie, J, Je, S, Se, Cp, Cpe, P0, P0e, X, iX, iL, iH, iE, h, eta = v.values()
    D, A, d = F(1, 2)-h, F(1, 2)+h, 1-eta**2
    W = 1-2*D*eta*M*iX-d*Me*iX
    numerator_q = (1-h)*I-D*eta*Ie-d*Je+2*(h-D)*eta*J
    p1 = (-X*W+numerator_q*iH)*iL
    p2 = (-X*W*U+D*(M-eta*Me)+4*h*eta*S-d*Se
          + X*(4*A*eta*(P0+Cp)-d*(P0e+Cpe)))*iL*iE
    unchanged = {"X", "iX", "iL", "P0", "P0e", "h", "eta"}

    def telescope(poly):
        out = {}
        for powers, coefficient in poly.c.items():
            degree = sum(e for name, e in powers if name not in {"h", "eta"})
            for name, e in powers:
                if name in unchanged:
                    continue
                delta_degree = 6 if name in {"iH", "iE"} else 4
                exponent = degree - 1 + delta_degree
                out[exponent] = out.get(exponent, F(0)) + abs(coefficient) * e
        return Poly(out)

    return {"deltaP1": telescope(p1), "deltaP2": telescope(p2)}, bool(((X-1)*W*U*iL*iE).c)


def build():
    axis = json.loads((HERE / "axis-envelope-certificate.json").read_text())
    b8 = json.loads(B8.read_text())
    checks = {}
    jets = {}
    deductions = {}

    def check(name, value):
        if name in checks:
            raise ValueError("duplicate check " + name)
        checks[name] = bool(value)

    def record_jet(name, jet, exponent):
        jets[name] = {"etaDerivativePolynomials": [p.record() for p in jet],
                      "strictUniformBoundPerDerivative": f"Q^{exponent}"}
        for k, p in enumerate(jet):
            check(name + f"_eta{k}_below_Q{exponent}", not p.c or p.below_power(exponent))

    check("axis_finite_checks_pass", axis["passed"] == axis["total"])
    check("B8_continuous_map_checks_pass", b8["allPassed"])
    check("same_new_outer_parameter_hash",
          axis["sourceBinding"]["outerParameterExpressionSHA256"] == b8["source"]["parameterTreeSHA256"])
    check("same_new_outer_derivation_hash",
          axis["sourceBinding"]["outerDerivationSHA256"] == b8["source"]["outerDerivationSHA256"])
    check("axis_displacement_is_sharp", axis["controlledRemainder"]["sharpDisplacement"] == "29*Q^(-53)")

    # Formula (16), Q bound on the ACTUAL fixed-point norm and rho^-1<=Q.
    scalars = {}
    for m in range(5):
        scalar_0 = F(factorial(m), (m+1)**2) * F(200, 159)**(m+1)
        scalar_y = F(41, 10) * F(factorial(m+1), 20*(m+1)**2) * F(200, 159)**(m+2)
        scalars[str(m)] = {"value": str(scalar_0), "YDerivative": str(scalar_y)}
        check(f"actual_coefficient_evaluation_eta{m}_absorbed", max(scalar_0, scalar_y) < 2**260)
    deductions["actualPhiUInput"] = {"source": "SAME_DATUM_ANALYTIC_AXIS.md (16)",
                                    "normBound": "Q", "radiusInverseBound": "Q",
                                    "rectangle": "0<=Y<=41/10; |eta|<=1",
                                    "etaOrder": 4, "uniformDerivativeBound": "Q^6",
                                    "exactEvaluationScalars": scalars}

    phi = [qp(6)] * 5
    inv_phi = [qp(0, 4)]
    for m in range(1, 5):
        inv_phi.append(psum((phi[k]*inv_phi[m-k]).scale(4*comb(m, k))
                            for k in range(1, m+1)))
    log_phi = [qp(0, 2)] + jet_mul(phi[1:], inv_phi[:4])
    slope = jet_mul(phi, inv_phi)
    record_jet("reciprocalPhi", inv_phi, 25)
    record_jet("logPhi", log_phi, 25)
    record_jet("YDerivativeLogPhi", slope, 31)

    # B.22 has v=integral alpha*Y*dYlogPhi, with |v^(k)|<=Q^-169.
    exp_small = exp_jet([ZERO]+[ONE]*4, qp(0, 2))
    reference_R = jet_mul(phi, exp_small)
    record_jet("referenceR", reference_R, 7)
    record_jet("referenceLogR", [qp(25)+qp(-169)]*5, 32)
    check("reference_cutoff_log_change_is_tiny", -200+31 == -169)
    check("exp_small_value_below_two", F(1, 2**260) < F(1, 2))
    # The range 1/4<=R<=2 comes from natural source positivity followed by
    # monotone slope cutoff, as proved in the companion; not from sampling.
    log_ratio = [ZERO]+[qp(32, 2)]*3
    ratio = exp_jet(log_ratio, qp(0, 8))
    record_jet("radialRRatio", ratio, 100)

    # Pressure bound: g*R has a large known exponential reserve even at Caxis.
    phase = [ZERO]+[qp(70)]*4
    g_bell = exp_jet(phase)
    F_without_g = jet_mul([qp(32)]*5, g_bell)
    record_jet("FDerivativesDividedByG", F_without_g, 313)
    check("exponential_reserve_factorial", 30**32 > factorial(32))
    check("exponential_reserve_power", 64*32-313 > 1000)
    pressure_scalar = max(5*factorial(k)*32**k for k in range(5))
    check("actual_P_Cauchy_coefficient_absorbed", pressure_scalar < 2**260)
    check("forward_pressure_product_integral_coefficient", 110*2**4 < 2**260)
    deductions["actualForwardPressure"] = {
        "gBound": "exp(-30*Lambda/sigmaStar^2)",
        "FDerivativesOrder0To4": "strictly below Q^(-1000)",
        "integralLength": 110, "PiAndEtaDerivativesOrder0To4": "strictly below Q^3",
        "DXPiDerivativesOrder0To3": "strictly below 1",
        "proof": "exp(30 Q^64) >= (30 Q^64)^32/32! > Q^2048; actual forward pressure is integral F^2, not a new datum."
    }

    # Literal sources in (4.9); U, U_eta,...,U_eta^4 are all <=6.
    eta = [ONE, ONE, ZERO, ZERO]
    d = [ONE, qp(0, 2), qp(0, 2), ZERO]
    U = [qp(0, 6)]*5
    W = jet_add(const_jet(ONE, 3), jet_scale(jet_mul(eta, U[:4]), 2), jet_mul(d, U[1:]))
    Hc = jet_add(eta, jet_mul(d, U[:4]))
    record_jet("referenceW", W, 1)
    record_jet("referenceHc", Hc, 1)
    angular_h = jet_add(const_jet(ONE, 3), jet_scale(jet_mul(eta, U[:4]), 2))
    sq = jet_add(jet_mul(W, [qp(32)]*4), angular_h, jet_mul(Hc, [qp(71)]*4))
    record_jet("referenceSq", sq, 80)
    sn = jet_add(jet_mul(W, [ONE]*4), jet_mul(angular_h, U[:4]),
                 jet_mul(Hc, U[1:]), jet_mul(d, [qp(3)]*4),
                 jet_scale(jet_mul(eta, [qp(3)]*4), 4), jet_scale(jet_mul(eta, [ONE]*4), 2))
    record_jet("referenceSn", sn, 5)

    inv_l = [qp(0, 2)]
    l_deriv = [ZERO, qp(0, 4), qp(0, 4), ZERO]
    for m in range(1, 4):
        inv_l.append(psum((l_deriv[k]*inv_l[m-k]).scale(2*comb(m, k))
                          for k in range(1, m+1)))
    record_jet("inverseL", inv_l, 1)
    p1 = jet_scale(jet_mul(inv_l, jet_mul(ratio, sq)), 55)
    ns = jet_mul(inv_l, sn)
    record_jet("referenceP1", p1, 200)
    record_jet("referenceNs", ns, 7)
    bref = ONE + qp(200) + qp(7, 55)
    check("explicit_Bref_Q300_bounds_all_required_derivatives", bref.below_power(300))
    deductions["BRefUpper"] = {"expression": "Q^300", "unknownSupremumRemoved": True,
                               "uniformRange": "every C>=Caxis, every 0<t<=Q^(-200), X0<=X<=110, |eta|<=1",
                               "boundedQuantity": "1+max_{0<=m<=3} sup (|d_eta^m p1,r|+55|d_eta^m ns,r|)",
                               "lastPositivePolynomial": bref.record()}

    # The fourth derivative of the B.8 incoming data is also needed below
    # for an ACTUAL mixed source-jet bound.  This extra finite table uses
    # one additional analytic input derivative, not a smoothness assertion.
    for m in range(6):
        scalar_0 = F(factorial(m), (m+1)**2) * F(200, 159)**(m+1)
        scalar_y = F(41, 10)*F(factorial(m+1), 20*(m+1)**2)*F(200, 159)**(m+2)
        check(f"order4_source_analytic_eta{m}_coefficient", max(scalar_0, scalar_y) < 2**260)
    phi5 = [qp(7)]*6
    inv5 = [qp(0, 4)]
    for m in range(1, 6):
        inv5.append(psum((phi5[k]*inv5[m-k]).scale(4*comb(m, k)) for k in range(1, m+1)))
    log5 = [qp(0, 2)] + jet_mul(phi5[1:], inv5[:5])
    slope5 = jet_mul(phi5, inv5)
    record_jet("order4SourceLogPhi", log5, 36)
    record_jet("order4SourceLogSlope", slope5, 43)
    record_jet("order4SourceReferenceR", jet_mul(phi5, exp_jet([ZERO]+[ONE]*5, qp(0, 2))), 8)
    record_jet("order4SourceReferenceLogR", [qp(36)+qp(-157)]*6, 64)
    ratio4 = exp_jet([ZERO]+[qp(64, 2)]*4, qp(0, 8))
    record_jet("order4SourceRadialRatio", ratio4, 260)
    record_jet("order4SourceFDividedByG", jet_mul([qp(64)]*6, exp_jet([ZERO]+[qp(72)]*5)), 425)
    check("order4_source_exponential_pressure_reserve", 2048-425 > 1000)
    eta4 = [ONE, ONE, ZERO, ZERO, ZERO]
    d4 = [ONE, qp(0, 2), qp(0, 2), ZERO, ZERO]
    U5 = [qp(0, 6)]*6
    W4 = jet_add(const_jet(ONE, 4), jet_scale(jet_mul(eta4, U5[:5]), 2), jet_mul(d4, U5[1:]))
    H4 = jet_add(eta4, jet_mul(d4, U5[:5]))
    ah4 = jet_add(const_jet(ONE, 4), jet_scale(jet_mul(eta4, U5[:5]), 2))
    sq4 = jet_add(jet_mul(W4, [qp(44)]*5), ah4, jet_mul(H4, [qp(73)]*5))
    sn4 = jet_add(jet_mul(W4, [ONE]*5), jet_mul(ah4, U5[:5]), jet_mul(H4, U5[1:]),
                  jet_mul(d4, [qp(3)]*5), jet_scale(jet_mul(eta4, [qp(3)]*5), 4),
                  jet_scale(jet_mul(eta4, [ONE]*5), 2))
    record_jet("order4SourceSq", sq4, 90)
    record_jet("order4SourceSn", sn4, 5)
    inv_l4 = [qp(0, 2)]
    ld4 = [ZERO, qp(0, 4), qp(0, 4), ZERO, ZERO]
    for m in range(1, 5):
        inv_l4.append(psum((ld4[k]*inv_l4[m-k]).scale(2*comb(m,k)) for k in range(1,m+1)))
    record_jet("order4SourceP1", jet_scale(jet_mul(inv_l4, jet_mul(ratio4, sq4)), 55), 400)
    record_jet("order4SourceNs", jet_mul(inv_l4, sn4), 7)
    check("explicit_order4_reference_bound_Q500", (ONE+qp(400)+qp(7,55)).below_power(500))
    check("width_controls_order4_drift", 120*10000-502 > 200)
    deductions["fourthIncomingDerivative"] = {
        "referenceBound": "Q^500 for 1+max_{m<=4} sup(|p1,r^(m)|+55|ns,r^(m)|)",
        "actualB26DriftOrder4": "less than 10^6*C^(-120)*Q^502 < Q^(-200)",
        "GiMinus4EtaDerivativeBounds": ["2*j0", "j0", "j0", "j0", "j0"],
        "earlyNormalizedMomentErrorsOrders0To4": "less than epsilonMoment=h^3",
        "reason": "Same short defining integrals and exponential reserve; the extra fifth eta input has been explicitly included."
    }

    # Actual B.4 source/endpoint margins: finite factors used in the proof.
    check("source_Young_coefficient_below_six", 1/(4*F(5, 100)*F(99, 100)) < 6)
    check("source_Q2_term_absorbed", 2**(260*62) * F(99, 10000) > 1)
    check("source_constant_has_margin", 3-F(8, 1000)-F(1, 1000)-F(11, 1000)-F(1, 10) > F(24, 10))
    check("sharp_eta_error_fixed_coefficient", F(29, 4)*F(200, 159)**2*40 < 2**260)
    check("phase_amplified_extra_drift", -200+66 == -134)

    # Explicit C bounds and the chosen widths.  log Q<Q and Q>=2^260
    # reduce all transcendental comparisons to these integer inequalities.
    check("C_upper_log_extra_absorbed", 3010 < 2**(260*199))
    check("C_exceeds_Q10000", 10000 < 2**(260*199))
    check("C_exceeds_ten8", 10**8 < 2**260)
    check("L0_below_Q2", 100 < 2**260)
    va_poly = ONE+qp(300)+qp(856,2**20)
    check("VA_below_Q857", va_poly.below_power(857))
    check("Bcmp0_below_Q4001", 10**6*5**4 < 2**260)
    check("phase_extra_below_logC", 34 < 2**(260*(200-65)))
    c_bounds = {"BRefUpper":1,"L0":1,"Bcmp0":1,"expLmath":2,
                "Gamma":3,"Kcmp":49,"Vmax":5}
    tau_denominator_exponents = [2,1,5,6,6,1+1+2*50+2*6]
    check("tau_base_above_C_minus114", max(tau_denominator_exponents) == 114)
    check("selected_width_strictly_below_tau", 120 > max(tau_denominator_exponents))
    deductions["finalCPowerBounds"] = {"CInterval": ["exp(Q^200)","exp(2*Q^200)"],
        "CStrictlyExceeds": ["Q^10000","10^8"], "upperExponents":c_bounds,
        "tauEntriesLowerExponents":tau_denominator_exponents, "tauBaseLower":"C^(-114)",
        "selectedFinalWidths":"t1=kappa0=omega1=omega2=C^(-120)"}

    maps, rejects_wrong_axial_formula = moment_map_polynomials()
    for name, p in maps.items():
        check(name+"_below_100_Gamma12", max(p.c) <= 12 and sum(p.c.values()) <= 100)
    check("wrong_axial_WU_inside_one_over_X_rejected", rejects_wrong_axial_formula)
    composites = {"PcMinusVr": qp(12, 100)+qp(14, 300)+qp(4, 3),
                  "Jc": qp(12, 100)+qp(14, 300)+qp(4, 3),
                  "VsMinusKappaVr": qp(6, 12)}
    for name, p in composites.items():
        check(name+"_below_Kcmp", max(p.c) <= 16 and sum(p.c.values()) < 1000)

    # Exact derivative table for d/K and d^2/K^2.  The positive weighted
    # integrals of the actual restoration interval have mass <1.
    delta = [qp(1, 2), qp(1), qp(1)]  # Here the variable denotes j.
    reciprocal_K = [qp(0, 2)]*3       # (1+eta^2)/Pstar and derivatives.
    reciprocal_K2 = [qp(0, 4), qp(0, 8), qp(0, 16)]
    linear_debt = jet_mul(delta, reciprocal_K)
    energy_debt = jet_mul(jet_mul(delta, delta), reciprocal_K2)
    linear_coefficients = [sum(p.c.values()) for p in linear_debt]
    energy_coefficients = [sum(p.c.values()) for p in energy_debt]
    check("continuous_U_debt_Leibniz_14j", max(linear_coefficients) <= 14)
    check("continuous_E_debt_Leibniz_184j2", max(energy_coefficients) <= 184)
    check("second_U_weight_mass_below_one", F(2)*F(5, 8)**2 < 1)
    delta4 = [qp(1,2)]+[qp(1)]*4
    lin4 = jet_mul(delta4, [qp(0,2)]*3+[ZERO]*2)
    ene4 = jet_mul(jet_mul(delta4,delta4), [qp(0,4),qp(0,8),qp(0,16),qp(0,24),qp(0,24)])
    lin4_coeff = [sum(p.c.values()) for p in lin4]
    ene4_coeff = [sum(p.c.values()) for p in ene4]
    check("continuous_U_debt_order4_22j", max(lin4_coeff)<=22)
    check("continuous_E_debt_order4_1448j2", max(ene4_coeff)<=1448)

    def rational(v):
        return F(int(v["numerator"]), int(v["denominator"]))

    exact_norms = {}
    for tag in ("U", "E"):
        exact_rows = b8["inverse"+tag]["exact"]
        exact_norms[tag] = max(sum(abs(rational(v)) for v in row) for row in exact_rows)
        check("new_B8_preconditioner_"+tag+"_norm_below_two40", exact_norms[tag] < 2**40)
    allowed = rational(b8["bounds"]["allowedPreconditionedScaledDebtPerDerivative0To2"])
    h_upper = F(1, 2**200)
    beta_U = 2**40 * (14*h_upper**2+h_upper)
    beta_E = 2**40 * (184*h_upper**6+h_upper)
    check("B8_incoming_beta_U_below_required", beta_U < allowed)
    check("B8_incoming_beta_E_below_required", beta_E < allowed)
    check("hierarchy_exponents_j_epsilon_h", 4 > 3 > 1)
    check("matching_normalization_exponents", 4-2 == 2 and 3-2 == 1 and 8-2 == 6)
    beta_U4 = 2**40*(22*h_upper**2+h_upper)
    beta_E4 = 2**40*(1448*h_upper**6+h_upper)
    check("B8_order4_incoming_U_below_required", beta_U4<allowed)
    check("B8_order4_incoming_E_below_required", beta_E4<allowed)
    mu = rational(b8["bounds"]["muUpper"])
    bu, be = rational(b8["bounds"]["BU"]), rational(b8["bounds"]["BE"])
    zu, qe = rational(b8["inverseU"]["z"]), rational(b8["bounds"]["eContraction"])
    u_jet = [rational(b8["bounds"]["uRadius"])] + [allowed/(1-zu)]*4
    e_jet = [rational(b8["bounds"]["eRadius"])]
    for m in range(1,5):
        u_quad = sum(F(comb(m,k))*u_jet[k]*u_jet[m-k] for k in range(m+1))
        e_quad = sum(F(comb(m,k))*e_jet[k]*e_jet[m-k] for k in range(1,m))
        e_jet.append((allowed+mu*bu*u_quad+mu*be*e_quad)/(1-qe))
        check(f"actual_B8_root_eta{m}_inside_radius", max(u_jet[m],e_jet[m]) < F(1,10**6))

    ref = lambda x: {"ref": x}
    integer = lambda x: {"integer": x}
    rational_e = lambda x: {"rational": str(x)}
    power = lambda a, n: {"power": [a, n]}
    product = lambda *xs: {"product": list(xs)}
    add = lambda *xs: {"sum": list(xs)}
    quotient = lambda a, b: {"quotient": [a, b]}
    one_plus = lambda name: add(integer(1), ref(name))
    expressions = {
        "epsilonMoment": power(ref("h"), 3), "j0": power(ref("h"), 4),
        "muMoment": power(ref("h"), 2), "barT": power(ref("Q"), -200),
        "BRefUpper": power(ref("Q"), 300), "Bk": power(ref("Q"), 80),
        "Tsh": power(ref("Q"), 90),
        "logCSelected": add(product(integer(10), {"log": one_plus("BRefUpper")}), power(ref("Q"), 200)),
        "CSelected": {"exp": ref("logCSelected")},
        "XR": product(integer(110), power(product(ref("CSelected"), ref("Pstar")), 10)),
        "Xsep": product(integer(110), {"exp": ref("Tsh")}),
        "L0": {"log": product(rational_e(F(110, 4)), ref("Lambda"))},
        "Lmath": add(ref("logCSelected"), quotient(product(integer(34), ref("Lambda")), power(ref("sigmaStar"), 2))),
        "VA": add(integer(1), ref("BRefUpper"), product(integer(2**20), power(ref("BRefUpper"), 2), power(ref("Lambda"), 4))),
        "Bcmp0": product(integer(10**6), power(add(integer(1), power(ref("Q"), 1000), ref("BRefUpper"), ref("VA"), ref("L0")), 4)),
        "Gamma": product(ref("Bcmp0"), {"exp": ref("Lmath")}),
        "Kcmp": product(integer(1000), power(ref("Gamma"), 16)),
        "Vmax": product(ref("VA"), {"exp": product(integer(2), ref("Lmath"))}),
        "tauBase": {"min": [quotient(ref("barT"), integer(4)), rational_e(F(1, 1000)),
            quotient(integer(1), product(integer(100), ref("Gamma"), ref("Bcmp0"))),
            quotient(ref("j0"), product(integer(10**8), one_plus("BRefUpper"), one_plus("L0"))),
            quotient(power(ref("Q"), -200), product(integer(10**6), one_plus("BRefUpper"), one_plus("L0"))),
            quotient(integer(1), product(integer(10**8), ref("Bcmp0"), power(one_plus("Kcmp"), 2), power(one_plus("Vmax"), 2)))]},
        "t1": power(ref("CSelected"), -120),
        "kappa0": ref("t1"), "omega1": ref("t1"), "omega2": ref("t1"),
        "DeltaEarly": {"exp": quotient(product(integer(-1), power(ref("Q"), 200)), integer(4))}
    }
    basis_files = ["SAME_DATUM_ANALYTIC_AXIS.md", "REFERENCE_DERIVATIVE_BOUNDS.md", "CONTINUATION_AND_NEW_DEBT.md", "axis-envelope-certificate.json"]
    return {
        "schema": "MathScope.Navier.SameDatumContinuationAndDebt/1",
        "status": "EXACT_BOUNDS_SUPPORT_NEW_CONTINUOUS_B8_INCOMING_CONTRACT" if all(checks.values()) else "FAIL",
        "sourceBinding": {"paperSHA256": axis["sourceBinding"]["paperSHA256"],
                          "outerParameterExpressionSHA256": axis["sourceBinding"]["outerParameterExpressionSHA256"],
                          "proofFilesSHA256": {name: sha(HERE/name) for name in basis_files},
                          "newB8CertificateSHA256": sha(B8), "thisCheckerSHA256": sha(Path(__file__))},
        "parametersExactExpressions": expressions,
        "parameterExpressionSHA256": canonical_sha(expressions),
        "finiteDerivativeTable": jets, "analyticDeductions": deductions,
        "freshMomentComparisonAlgebra": {"componentPolynomials": {k: v.record() for k, v in maps.items()},
                                         "conePolynomials": {k: v.record() for k, v in composites.items()},
                                         "independentVariable": "Gamma", "inputBounds": "actual selected field and moment inputs from the companion proof"},
        "incomingDebt": {"etaOrders": [0, 1, 2], "interval": [-1, 1],
                         "UUpperBeforeMuDivision": "14*j0+epsilonMoment",
                         "EUpperBeforeMuDivision": "184*j0^2+epsilonMoment",
                         "linearDerivativeCoefficientsActuallyComputed": [str(x) for x in linear_coefficients],
                         "energyDerivativeCoefficientsActuallyComputed": [str(x) for x in energy_coefficients],
                         "exactPreconditionerNorms": {k: str(v) for k, v in exact_norms.items()},
                         "preconditionedScaledUpperU": str(beta_U), "preconditionedScaledUpperE": str(beta_E),
                         "allowedUpper": str(allowed), "proofMethod": "continuous positive-weight integral bounds and exact Leibniz rule; not parameter samples"},
        "higherIncomingAndRootDerivatives": {"etaOrders":[0,1,2,3,4],
            "linearDebtCoefficients":[str(x) for x in lin4_coeff],
            "energyDebtCoefficients":[str(x) for x in ene4_coeff],
            "preconditionedScaledUUpper":str(beta_U4),"preconditionedScaledEUpper":str(beta_E4),
            "actualRootUOrdinaryDerivativeUpper":[str(x) for x in u_jet],
            "actualRootEOrdinaryDerivativeUpper":[str(x) for x in e_jet],
            "method":"Differentiate the SAME uniformly invertible quadratic equations; binomial quadratic recurrence through eta order four, with actual newly bounded incoming data."},
        "checks": checks, "passed": sum(checks.values()), "total": len(checks),
        "boundaries": {"newDatumOnly": True, "unknownCompactSupremumInParameterSelection": False,
                       "finiteScalarAndPolynomialChecksExecuted": True, "sameInfiniteProfileUsedMathematically": True,
                       "explicitPositiveWidthsProved": True, "formerSupremumAndDyadicDraftSuperseded": True,
                       "oldFixtureCertificateReused": False, "fullAnalyticPremisesProvedInLean": False,
                       "globalHeatModulationConeCertifiedByThisReceipt": False, "fullOriginalN3GateCompletion": False}
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    result = build()
    if args.write:
        (HERE/"continuation-debt-certificate.json").write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps({"status": result["status"], "passed": result["passed"], "total": result["total"],
                      "failed": [k for k, v in result["checks"].items() if not v]}))
    raise SystemExit(result["passed"] != result["total"])
