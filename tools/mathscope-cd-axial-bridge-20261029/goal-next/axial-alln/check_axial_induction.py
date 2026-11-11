"""Independent exact algebra for Lemma 5.2 Step 4 in the original X, eta variables."""
from fractions import Fraction
import json

import sympy as s


X, eta, h, n = s.symbols("X eta h n", real=True)
a, b, c = s.symbols("a b c", real=True)
D = s.Rational(1, 2) - h
A = s.Rational(1, 2) + h
d = 1 - eta**2
L = 1 - 2 * h * eta**2
nu = 2 * n * h
mu = 2 * (n - 1) * h
Ux, Px, Qx, VUx, Uprev, V, W = (
    s.Function(name)(X, eta) for name in ("U", "Pi", "Q", "VU", "Uprev", "V", "W")
)
checks = {}


def verify(name, lhs, rhs):
    difference = s.cancel(s.together(lhs - rhs))
    if difference != 0:
        raise AssertionError(f"{name}: {difference}")
    checks[name] = True


def T(exponent, f):
    return (-exponent * f + X * s.diff(f, X) + D * eta * s.diff(f, eta)) / L


def Z(exponent, f):
    return (2 * eta * (exponent * f - X * s.diff(f, X)) + d * s.diff(f, eta)) / L


def Tbar(exponent, f):
    return (-exponent * f + D * eta * s.diff(f, eta)) / L


def Zbar(exponent, f):
    return (2 * exponent * eta * f + d * s.diff(f, eta)) / L


def BT(f):
    return X * f / L


def BZ(f):
    return -2 * eta * X * f / L


# From 1-t=q*(1-eta^2), z=q^D*eta and X=r^2/(2q).
matrix = s.Matrix([[d, -2 * eta], [D * eta, 1]])
verify("similarity_jacobian", matrix.det(), L)
qt, eta_t_scaled = matrix.inv() * s.Matrix([-1, 0])
qz_scaled, eta_z_scaled = matrix.inv() * s.Matrix([0, 1])
verify("physical_time_chain_rule", a * qt * Ux - X * qt * s.diff(Ux, X)
       + eta_t_scaled * s.diff(Ux, eta), T(a, Ux))
verify("physical_axial_chain_rule", a * qz_scaled * Ux
       - X * qz_scaled * s.diff(Ux, X) + eta_z_scaled * s.diff(Ux, eta), Z(a, Ux))
verify("ordered_axial_pair_continuity_defect",
       s.diff(X * V * W, X) + Z(a + b, Ux * W)
       - (X * V * s.diff(W, X) + Ux * Z(b, W)),
       W * (s.diff(X * V, X) + Z(a, Ux)))

verify("common_physical_transport_power", -2 * A + nu - D, -A - 1 + nu)
verify("prior_physical_viscosity_power", -A + mu - 2 * D, -A - 1 + nu)
verify("scaled_current_axial_mass_power", 1 - A + nu, D + nu)
verify("scaled_axial_flux_pressure_power", 1 - 2 * A + nu, mu)
verify("previous_axial_mass_power_after_one_axial_derivative", 1 - A + mu - D, mu)

x_exp = -A + nu
q_exp = -2 * A + nu
previous_x_exp = -A + mu
previous_z = Z(previous_x_exp, Uprev)
raw = T(x_exp, Ux) + s.diff(X * VUx, X) + Z(q_exp, Qx + Px) \
    - 2 * (X * s.diff(Ux, X, 2) + s.diff(Ux, X)) - Z(previous_x_exp - D, previous_z)
moment_density = Tbar(D + nu, Ux) + Zbar(mu, Qx - X * s.diff(Px, X)) \
    - Zbar(mu, Zbar(D + mu, Uprev))
boundary = BT(Ux) + X * VUx + BZ(Qx + Px) + Zbar(mu, X * Px) \
    - 2 * X * s.diff(Ux, X) - BZ(previous_z) - Zbar(mu, BZ(Uprev))
verify("raw_axial_conservative_moment_density_with_all_seven_flux_terms",
       raw, moment_density + s.diff(boundary, X))
verify("axial_pressure_integration_by_parts_density",
       Px, -X * s.diff(Px, X) + s.diff(X * Px, X))

# Preserve derivatives of eta-dependent coefficients. The endpoint value of
# d is zero, but dropping its entire contribution before differentiating fails.
full_composition = Zbar(b, Zbar(a, s.S.One))
discarded_inner_product_rule = 2 * b * eta * Zbar(a, s.S.One) / L
for end in [-1, 1]:
    verify(f"endpoint_composition_value_{end:+d}",
           (full_composition - discarded_inner_product_rule).subs(eta, end), 0)
    verify(f"endpoint_derivative_of_omitted_term_{end:+d}",
           s.diff(full_composition - discarded_inner_product_rule, eta).subs(eta, end),
           -4 * a * end * (1 + 2 * h) / (1 - 2 * h) ** 3)
endpoint_negative_control = s.diff(full_composition - discarded_inner_product_rule, eta)
endpoint_negative_control = endpoint_negative_control.subs({a: 1, h: s.Rational(1, 32), eta: 1})
verify("endpoint_eta_derivative_negative_control", endpoint_negative_control, s.Rational(-17408, 3375))

# The original source's order-n eta radii and its independent natural radial
# radii have positive gaps at every fixed n >= 2.
delta, p256, p2 = s.symbols("delta p256 p2", positive=True)
previous_strip = delta / (8 * p256)
strip = delta / (8 * 256 * p256)
verify("recursive_eta_strip_ratio", previous_strip / strip, 256)
verify("recursive_eta_positive_cauchy_gap", previous_strip - 4 * strip, 252 * strip)
verify("recursive_auxiliary_radius_positive_gap", (6 + 2 / p2) - (6 + 1 / p2), 1 / p2)
for name, bound in [
    ("real_profile_L_strict_lower_bound", 1 - 2 * Fraction(1, 16) == Fraction(7, 8)),
    ("complex_tube_abs_L_strict_lower_bound",
     1 - 2 * Fraction(1, 16) * Fraction(33, 32) ** 2 == Fraction(7103, 8192)),
    ("complex_tube_abs_L_above_half", Fraction(7103, 8192) > Fraction(1, 2)),
    ("complex_tube_abs_d_below_three", 1 + Fraction(33, 32) ** 2 < 3),
]:
    if not bound:
        raise AssertionError(name)
    checks[name] = True

print(json.dumps({
    "schema": "MathScope.AxialInductionIndependentAlgebra/1",
    "method": f"SymPy {s.__version__} exact rational symbolic identities; no sampled equality",
    "checks": checks,
    "endpointNegativeControl": str(endpoint_negative_control),
    "scope": "All-n differential algebra and explicit domain denominators/strip gaps",
}, indent=2))

