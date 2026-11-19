import Mathlib

namespace MathScope.M3.CD

/-- The two original band thresholds bound the same product before
either scale is replaced by a separate numerical enclosure. -/
theorem band_thresholds_bound_stability {ell b h : ℝ}
    (hb : 0 ≤ b) (hh : 0 < h) (hb2 : b ^ 2 ≤ ell)
    (hh2 : (64 / h) ^ 2 ≤ ell) :
    64 * b ≤ h * ell := by
  have hy : 0 ≤ (64 : ℝ) / h := by positivity
  have hp : b * (64 / h) ≤ ell := by
    by_cases hby : b ≤ 64 / h
    · calc
        b * (64 / h) ≤ (64 / h) * (64 / h) := mul_le_mul_of_nonneg_right hby hy
        _ = (64 / h) ^ 2 := by ring
        _ ≤ ell := hh2
    · calc
        b * (64 / h) ≤ b * b := mul_le_mul_of_nonneg_left (le_of_not_ge hby) hb
        _ = b ^ 2 := by ring
        _ ≤ ell := hb2
  calc
    64 * b = h * (b * (64 / h)) := by field_simp [ne_of_gt hh] <;> ring
    _ ≤ h * ell := mul_le_mul_of_nonneg_left hp hh.le

/-- The original stability exponent `3*b*length` can be absorbed into
the same logarithmic band margin used to bound the covariance gain. -/
theorem mean_stability_log_allowance {ell b h length logTwo : ℝ}
    (hb : 0 ≤ b) (hh : 0 < h) (hb2 : b ^ 2 ≤ ell)
    (hh2 : (64 / h) ^ 2 ≤ ell) (hLength : length ≤ 1 / (2 : ℝ) ^ 30)
    (hlog : 1 / 2 ≤ logTwo) :
    3 * b * length ≤ h * (ell + 13) * logTwo / (2 : ℝ) ^ 33 := by
  have hband := band_thresholds_bound_stability hb hh hb2 hh2
  have hEll : 0 ≤ ell := le_trans (sq_nonneg b) hb2
  have hShift : h * ell ≤ h * (ell + 13) := by
    exact mul_le_mul_of_nonneg_left (by linarith) hh.le
  have hLogScale := mul_le_mul_of_nonneg_left hlog
    (mul_nonneg hh.le (by linarith : 0 ≤ ell + 13))
  have hLengthScale := mul_le_mul_of_nonneg_left hLength (by positivity : 0 ≤ 3 * b)
  norm_num at hLengthScale ⊢
  linarith [mul_nonneg hh.le hEll]

/-- The source Laurent degree bounds and residual-coefficient allowance leave
at least half of the logarithmic covariance gain. -/
theorem initialized_mean_log_gain {L seasonal fast coefficient alpha : ℝ}
    (hL : 0 ≤ L) (hSeasonal : seasonal ≤ L / (2 : ℝ) ^ 33)
    (hFast : fast ≤ 1 + L / 100000)
    (hCoeff : coefficient + 6 ≤ L / 16)
    (hAlpha : (99998 : ℝ) / 100000 ≤ alpha) :
    coefficient + 187 * seasonal + 6 * fast - alpha * L ≤ -L / 2 := by
  have hSeasonalScaled := mul_le_mul_of_nonneg_left hSeasonal (by norm_num : (0 : ℝ) ≤ 187)
  have hFastScaled := mul_le_mul_of_nonneg_left hFast (by norm_num : (0 : ℝ) ≤ 6)
  have hAlphaScaled := mul_le_mul_of_nonneg_right hAlpha hL
  norm_num at hSeasonalScaled ⊢
  linarith

/-- The full mean-cutoff geometric allowance preserves a strict margin
against a positive normalized budget larger than one. -/
theorem initialized_mean_energy_below_budget {L logGeometry energy budget : ℝ}
    (hL : 0 < L) (hGeometry : logGeometry ≤ L / 4)
    (hEnergy : energy ≤ Real.exp logGeometry * Real.exp (-L / 2) ^ 2)
    (hBudget : 1 < budget) :
    energy < budget := by
  have hProduct : Real.exp logGeometry * Real.exp (-L / 2) ^ 2 =
      Real.exp (logGeometry - L) := by
    rw [pow_two, ← Real.exp_add, ← Real.exp_add]
    congr 1
    ring
  rw [hProduct] at hEnergy
  have hStrict : Real.exp (logGeometry - L) < 1 := by
    rw [← Real.exp_zero]
    exact Real.exp_lt_exp.mpr (by linarith)
  exact lt_trans (lt_of_le_of_lt hEnergy hStrict) hBudget

#print axioms band_thresholds_bound_stability
#print axioms mean_stability_log_allowance
#print axioms initialized_mean_log_gain
#print axioms initialized_mean_energy_below_budget

end MathScope.M3.CD
