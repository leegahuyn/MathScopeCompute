import Mathlib

namespace MathScope.M3.CD

/-- The original cutoff samples are at zero and half of the transverse
radius. The quantity `scaled` is eight times the mixed coefficient
divided by that radius. -/
theorem covariance_cutoff_two_point_bound
    {M B scaled halfSample : ℝ} (hB : |B| ≤ M)
    (hhalf : |halfSample| ≤ M) (hsample : halfSample = B / 4 - scaled) :
    |scaled| ≤ 5 / 4 * M := by
  have hid : scaled = B / 4 + -halfSample := by linarith
  have hquarter : |B / 4| ≤ M / 4 := by
    rw [abs_div, abs_of_nonneg (by norm_num : (0 : ℝ) ≤ 4)]
    exact div_le_div_of_nonneg_right hB (by norm_num)
  calc
    |scaled| = |B / 4 + -halfSample| := by rw [hid]
    _ ≤ |B / 4| + |-halfSample| := abs_add_le _ _
    _ ≤ 5 / 4 * M := by rw [abs_neg]; linarith only [hquarter, hhalf]

/-- Exact second-derivative coefficient after applying the original
transverse product rule to the two cutoff factors. -/
theorem covariance_cutoff_curvature_coefficients
    (x x1 x2 x3 B C : ℝ) :
    (2 * x1 * x1 + 2 * x * x2) * B
        + (x2 * x1 + 2 * x1 * x2 + x * x3) * C =
      2 * (x1^2 + x * x2) * B + (3 * x1 * x2 + x * x3) * C := by
  ring

/-- The two opposite half-radius samples separate the odd contribution
from the square of the cutoff derivative. The two unknowns are scaled so the
sample coefficients are unit coefficients. -/
theorem covariance_cutoff_three_point_bounds
    {M B scaledCross scaledSquare plusSample minusSample : ℝ}
    (hB : |B| ≤ M) (hplus : |plusSample| ≤ M) (hminus : |minusSample| ≤ M)
    (hplusSample : plusSample = B / 4 - scaledCross + scaledSquare)
    (hminusSample : minusSample = B / 4 + scaledCross + scaledSquare) :
    |scaledCross| ≤ M ∧ |scaledSquare| ≤ 5 / 4 * M := by
  have hcross : minusSample + -plusSample = 2 * scaledCross := by linarith
  have hcrossBound := abs_add_le minusSample (-plusSample)
  rw [hcross, abs_mul, abs_of_nonneg (by norm_num : (0 : ℝ) ≤ 2), abs_neg] at hcrossBound
  refine ⟨by linarith only [hcrossBound, hplus, hminus], ?_⟩
  have havg : |(plusSample + minusSample) / 2| ≤ M := by
    rw [abs_div, abs_of_nonneg (by norm_num : (0 : ℝ) ≤ 2)]
    linarith only [abs_add_le plusSample minusSample, hplus, hminus]
  have hquarter : |B / 4| ≤ M / 4 := by
    rw [abs_div, abs_of_nonneg (by norm_num : (0 : ℝ) ≤ 4)]
    exact div_le_div_of_nonneg_right hB (by norm_num)
  have hsquare : scaledSquare = (plusSample + minusSample) / 2 + -(B / 4) := by
    linarith
  calc
    |scaledSquare| = |(plusSample + minusSample) / 2 + -(B / 4)| := by rw [hsquare]
    _ ≤ |(plusSample + minusSample) / 2| + |-(B / 4)| := abs_add_le _ _
    _ ≤ 5 / 4 * M := by rw [abs_neg]; linarith only [havg, hquarter]

/-- The third transverse coefficient, the square of the first cutoff
derivative, supplies its own second-derivative product terms. -/
theorem covariance_cutoff_squared_derivative_coefficients (x1 x2 x3 D : ℝ) :
    ((x3 * x1 + x2 * x2) + (x2 * x2 + x1 * x3)) * D =
      2 * (x2^2 + x1 * x3) * D := by
  ring

#print axioms covariance_cutoff_two_point_bound
#print axioms covariance_cutoff_curvature_coefficients
#print axioms covariance_cutoff_three_point_bounds
#print axioms covariance_cutoff_squared_derivative_coefficients

end MathScope.M3.CD
