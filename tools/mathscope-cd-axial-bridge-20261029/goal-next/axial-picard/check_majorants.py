"""Exact side inequalities for the original arbitrary-order Picard majorants."""
from fractions import Fraction as F
import json
from math import factorial
import sympy as s


checks = {}
def verify(name, condition):
    if not condition:
        raise AssertionError(name)
    checks[name] = True


# Coefficientwise row bounds imply the source's matrixBound bounds induced
# max-row-sum norms, which is stronger than separate entrywise estimates.
E, H, V, Z = s.symbols("E H V Z", nonnegative=True)
matrix_bound = 512 * (1 + E) * (1 + H + V + Z)
for name, row in {
    "A0_row_0": 1, "A0_row_1": 1, "A0_row_2": 1, "A0_row_3": 4 * H,
    "A0_row_4": 80*E*H + 4*E + 3*V + 2*Z + 2 + 8*H,
    "A0_row_5": 48*E*H + 20*E + 40*H + V + 2*Z + 2,
    "A1_row_4": 8 + 60*H, "A1_row_5": 20 + 36*H,
}.items():
    verify(name, all(c >= 0 for c in s.Poly(matrix_bound - row, E,H,V,Z).coeffs()))

eta = F(33, 32)
d = F(3)
Linv = F(2)
L_eta = 4*F(1,16)*eta
d_eta = 2*eta
P_over_a = 2*eta*Linv
P_eta_over_a = 2*Linv + 2*eta*Linv**2*L_eta
R = d*Linv
R_eta = d_eta*Linv + d*Linv**2*L_eta
verify("Z_P_lt_5_times_exponent", P_over_a < 5)
verify("Z_Q_and_Qx_lt_5", P_over_a < 5)
verify("Z_R_at_most_6", R <= 6)
verify("Z_eta_P_lt_16_times_exponent", P_eta_over_a < 16)
verify("Z_eta_Q_and_R_below_64", max(P_eta_over_a, R_eta) < 64)
verify("Z_eta_combined_first_derivative_coefficients", P_eta_over_a + R_eta < 69)
verify("regular_v_factor", 8 + 8 + 24 <= 128)
verify("forcing_z_pressure_factor", 4*eta*Linv < 16)
verify("time_eta_coefficient_below_2", F(1,2)*eta < 2)

# Genuinely complex natural leading g: Hstar is the same original
# D*eta + d*(4*eta+j0); no replacement of the source g.
Ustar = 4*eta + 1
Hstar = F(1,2)*eta + d*Ustar
Hstar_eta = F(1,2) + 2*eta*Ustar + 4*d
verify("natural_Ustar_lt_41_over_8_or_equal_bound", Ustar == F(41,8))
verify("natural_Hstar_lt_16", Hstar < 16)
verify("natural_Hstar_eta_lt_24", Hstar_eta < 24)
verify("natural_denominator_above_sigma_squared_over_2", 1-F(768,4*65536) > F(1,2))
verify("natural_Brho_geometric_norm_multiplier_lt_3",
       1/(1-F(8,20)-F(1,4)) < 3)
verify("natural_tube_eta_bound", 1 + F(1,4*65536) < eta)
verify("natural_integration_path_length_lt_2", eta < 2)

# Tail threshold and elementary majorization of the solution norm.
verify("four_to_minus_m_threshold", F(9,2*72) == F(1,16))
verify("exact_geometric_tail_multiplier", F(1,4)/(1-F(1,4)) == F(1,3))
verify("norm_small_x_threshold", (F(2,3))**2 == F(4,3)/3 and F(2,3) < F(3,4))
verify("norm_large_x_threshold", F(4,3)/4 == F(1,3))
verify("collar_radial_majorant_margin", F(3,2) < 64)
verify("strip_gaps", F(1,2)-F(1,4) == F(1,4) and F(1,4)-F(1,8) == F(1,8)
       and F(1,8) > F(1,64))

# Exact independent sparse operator test for two unrelated A1 matrices.
left = s.zeros(6)
right = s.zeros(6)
D = s.diag(*s.symbols("d0:6"))
for i in (4,5):
    for j in range(4):
        left[i,j] = s.Symbol(f"ell{i}{j}")
        right[i,j] = s.Symbol(f"right{i}{j}")
verify("A1_diagonal_A1_zero", left*D*right == s.zeros(6))

# Falling factorial form and exact kernel factor for the original iterated
# even-axis averaging formula. The ratio proof holds symbolically in r.
r = s.symbols("r", integer=True, nonnegative=True)
verify("even_kernel_coefficient_ratio", s.cancel((r+1)/((2*r+2)*(2*r+1))
       -1/(2*(2*r+1))) == 0)
for order in range(17):
    coeff = F(1,2**order)
    for j in range(order):
        coeff /= 2*j+1
    verify(f"even_axis_average_{order}", coeff == F(factorial(order), factorial(2*order)))

print(json.dumps({
    "schema":"MathScope.OriginalPicardMajorantSideChecks/1",
    "checks": checks,
    "count": len(checks),
    "scope":"Exact rational and symbolic side checks. No finite sample stands in for the attached analytic derivation.",
}, indent=2))

