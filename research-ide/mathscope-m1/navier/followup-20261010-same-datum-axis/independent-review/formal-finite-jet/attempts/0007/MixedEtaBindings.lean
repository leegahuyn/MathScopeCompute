import ConcreteProducer
import SelectedReferenceBoxes

/-! Literal parameter and coordinate bounds used by the accepted mixed
interval calculation. All quantities below are the actual selected ones. -/

noncomputable section
set_option maxHeartbeats 2000000

namespace MathScope.MixedEtaBindings

open Set
open MathScope.SameDatumInputs MathScope.SelectedReferenceBoxes
open NavierStokes.AxisCoefficientSpace NavierStokes.AxisWeightEstimates

theorem actual_h_dyadic_bound : h ≤ 1 / (2 : ℝ) ^ (4096 : ℕ) := by
  have he1 : (2 : ℝ) ≤ Real.exp 1 := by
    simpa using Real.add_one_le_exp (1 : ℝ)
  have he : (2 : ℝ) ^ (4096 : ℕ) ≤ Real.exp (8002 * T) := by
    calc
      (2 : ℝ) ^ (4096 : ℕ) ≤ (Real.exp 1) ^ (4096 : ℕ) := by gcongr
      _ = Real.exp (4096 : ℝ) := by rw [← Real.exp_nat_mul]; norm_num
      _ ≤ Real.exp (8002 * T) := Real.exp_le_exp.mpr (by linarith [T_ge_1280])
  have hi := one_div_le_one_div_of_le (by positivity : (0 : ℝ) < 2 ^ (4096 : ℕ)) he
  unfold h
  rw [show -8002 * T = -(8002 * T) by ring, Real.exp_neg]
  simpa only [one_div] using hi

theorem actual_j_dyadic_bound : j ≤ 1 / (2 : ℝ) ^ (16384 : ℕ) := by
  calc
    j = h ^ (4 : ℕ) := rfl
    _ ≤ (1 / (2 : ℝ) ^ (4096 : ℕ)) ^ (4 : ℕ) := by gcongr; exact actual_h_dyadic_bound
    _ = _ := by rw [div_pow, one_pow, ← pow_mul]

theorem actual_j_squared_dyadic_bound : j ^ 2 ≤ 1 / (2 : ℝ) ^ (32768 : ℕ) := by
  calc
    j ^ 2 = h ^ (8 : ℕ) := by unfold j; ring
    _ ≤ (1 / (2 : ℝ) ^ (4096 : ℕ)) ^ (8 : ℕ) := by gcongr; exact actual_h_dyadic_bound
    _ = _ := by rw [div_pow, one_pow, ← pow_mul]

theorem actual_positive_interval_inputs :
    h ∈ Icc (0 : ℝ) (1 / (2 : ℝ) ^ (4096 : ℕ)) ∧
      j ^ 2 ∈ Icc (0 : ℝ) (1 / (2 : ℝ) ^ (32768 : ℕ)) ∧ h ≠ 0 ∧ j ≠ 0 :=
  ⟨⟨h_pos.le, actual_h_dyadic_bound⟩,
    ⟨sq_nonneg j, actual_j_squared_dyadic_bound⟩, h_pos.ne', j_pos.ne'⟩

theorem actual_transport_polynomial (xi : ℝ) :
    NavierStokes.NaturalAxisData.H h j (j * xi) / j =
      1 + (9 / 2 - h) * xi - j ^ 2 * xi ^ 2 - 4 * j ^ 2 * xi ^ 3 := by
  unfold NavierStokes.NaturalAxisData.H NavierStokes.NaturalAxisData.D
    NavierStokes.NaturalAxisData.d NavierStokes.NaturalAxisData.U
  field_simp [j_pos.ne']
  ring

def transportPolynomial (xi : ℝ) : ℝ :=
  1 + (9 / 2 - h) * xi - j ^ 2 * xi ^ 2 - 4 * j ^ 2 * xi ^ 3

theorem actual_chi_normalized_coordinate (xi : ℝ) :
    NavierStokes.NaturalAxisData.chi h j sigma (j * xi) =
      transportPolynomial xi ^ 2 / (transportPolynomial xi ^ 2 + 1 / 4000000) := by
  have hH : NavierStokes.NaturalAxisData.H h j (j * xi) = j * transportPolynomial xi := by
    have hid := actual_transport_polynomial xi
    apply (div_eq_iff j_pos.ne').mp at hid
    simpa [transportPolynomial, mul_comm] using hid
  rw [NavierStokes.NaturalAxisData.chi, hH, sigma]
  have hleft : (j * transportPolynomial xi) ^ 2 + (j / 2000) ^ 2 ≠ 0 := by positivity [j_pos]
  have hright : transportPolynomial xi ^ 2 + 1 / 4000000 ≠ 0 := by positivity
  field_simp [hleft, hright]
  <;> ring

theorem actual_chart_interior {eta : ℝ} (heta : |eta| ≤ rho / 4) :
    eta ∈ Ioo axisWindow.left axisWindow.right := by
  have habs := abs_le.mp heta
  change -33 / 32 < eta ∧ eta < 33 / 32
  constructor <;> linarith [habs.1, habs.2, rho_le_sixteenth]

theorem actual_chart_xi_small {eta : ℝ} (heta : |eta| ≤ rho / 4) :
    |eta / j| ≤ 1 / (2 : ℝ) ^ (16000 : ℕ) := by
  have hrho : rho / 4 ≤ j ^ 2 := by
    unfold rho sigma
    nlinarith [sq_nonneg j]
  have hx : |eta / j| ≤ j := by
    rw [abs_div, abs_of_pos j_pos]
    apply (div_le_iff₀ j_pos).mpr
    nlinarith [heta.trans hrho]
  have hpow : (2 : ℝ) ^ (16000 : ℕ) ≤ (2 : ℝ) ^ (16384 : ℕ) :=
    pow_le_pow_right₀ (by norm_num) (by norm_num)
  exact hx.trans (actual_j_dyadic_bound.trans
    (one_div_le_one_div_of_le (by positivity) hpow))

theorem actual_chart_positive : 0 < rho / (4 * j) := by positivity [rho_pos, j_pos]

theorem actual_chart_inside_comparison_radius {eta : ℝ} (heta : |eta| ≤ rho / 4) :
    |eta / j| < 1 / 16 := by
  have hsmall := actual_chart_xi_small heta
  have hp : (2 : ℝ) ^ (5 : ℕ) ≤ (2 : ℝ) ^ (16000 : ℕ) :=
    pow_le_pow_right₀ (by norm_num) (by norm_num)
  have hi := one_div_le_one_div_of_le (by norm_num : (0 : ℝ) < 2 ^ (5 : ℕ)) hp
  have hi' : 1 / (2 : ℝ) ^ (16000 : ℕ) ≤ 1 / 32 := by simpa using hi
  linarith

end MathScope.MixedEtaBindings

#print axioms MathScope.MixedEtaBindings.actual_h_dyadic_bound
#print axioms MathScope.MixedEtaBindings.actual_j_squared_dyadic_bound
#print axioms MathScope.MixedEtaBindings.actual_positive_interval_inputs
#print axioms MathScope.MixedEtaBindings.actual_transport_polynomial
#print axioms MathScope.MixedEtaBindings.actual_chi_normalized_coordinate
#print axioms MathScope.MixedEtaBindings.actual_chart_interior
#print axioms MathScope.MixedEtaBindings.actual_chart_xi_small
#print axioms MathScope.MixedEtaBindings.actual_chart_positive
#print axioms MathScope.MixedEtaBindings.actual_chart_inside_comparison_radius
