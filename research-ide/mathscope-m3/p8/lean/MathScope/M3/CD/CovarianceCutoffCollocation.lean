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

#print axioms covariance_cutoff_two_point_bound
#print axioms covariance_cutoff_curvature_coefficients

end MathScope.M3.CD
