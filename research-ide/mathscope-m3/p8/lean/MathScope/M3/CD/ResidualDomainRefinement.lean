import Mathlib

namespace MathScope.M3.CD

/-- The original fixed-envelope bump mass has a useful rational lower
bound given its ordinary compact-integral lower estimate. -/
theorem original_mean_bump_mass_gt_inv_five_thousand {mass : ℝ}
    (hIntegral : Real.exp (-((16 : ℝ) / 3)) / 20 ≤ mass) :
    (1 : ℝ) / 5000 < mass := by
  have hBound := Real.one_sub_div_pow_le_exp_neg (n := 128) (t := (16 : ℝ) / 3)
    (by norm_num)
  have hRational : (1 : ℝ) / 250 < (1 - ((16 : ℝ) / 3) / 128) ^ 128 := by
    norm_num
  have hExp : (1 : ℝ) / 250 < Real.exp (-((16 : ℝ) / 3)) :=
    lt_of_lt_of_le hRational hBound
  linarith

/-- The actual slow-chart inverse denominator is positive even on the
closed eta interval. -/
theorem original_slow_inverse_denominator_margin {h eta : ℝ}
    (hh : 0 < h) (hSmall : h < 1 / 16) (hEta : eta^2 ≤ 1) :
    (7 : ℝ) / 8 < 1 - 2 * h * eta^2 := by
  have hterm := mul_le_mul_of_nonneg_left hEta (by positivity : 0 ≤ 2 * h)
  linarith

/-- A common error reduction propagates through the complete quadratic
error radius, including the product of the two errors. -/
theorem quadratic_error_radius_contraction
    {a b aOld bOld aNew bNew factor : ℝ}
    (ha : 0 ≤ a) (hb : 0 ≤ b) (haOld : 0 ≤ aOld) (hbOld : 0 ≤ bOld)
    (hbNew : 0 ≤ bNew) (hFactor : 0 ≤ factor) (hFactorOne : factor ≤ 1)
    (haNew : aNew ≤ factor * aOld) (hbNewLe : bNew ≤ factor * bOld) :
    a * bNew + b * aNew + aNew * bNew ≤
      factor * (a * bOld + b * aOld + aOld * bOld) := by
  have hab : aNew * bNew ≤ (factor * aOld) * (factor * bOld) := by
    calc
      _ ≤ (factor * aOld) * bNew := mul_le_mul_of_nonneg_right haNew hbNew
      _ ≤ _ := mul_le_mul_of_nonneg_left hbNewLe (mul_nonneg hFactor haOld)
  have hFactorSq : factor * factor ≤ factor := by
    simpa only [mul_one] using mul_le_mul_of_nonneg_left hFactorOne hFactor
  calc
    _ ≤ a * (factor * bOld) + b * (factor * aOld) +
        (factor * aOld) * (factor * bOld) :=
      add_le_add (add_le_add (mul_le_mul_of_nonneg_left hbNewLe ha)
        (mul_le_mul_of_nonneg_left haNew hb)) hab
    _ = factor * (a * bOld + b * aOld) + (factor * factor) * (aOld * bOld) := by ring
    _ ≤ factor * (a * bOld + b * aOld) + factor * (aOld * bOld) :=
      add_le_add_left (mul_le_mul_of_nonneg_right hFactorSq (mul_nonneg haOld hbOld)) _
    _ = _ := by ring

#print axioms original_mean_bump_mass_gt_inv_five_thousand
#print axioms original_slow_inverse_denominator_margin
#print axioms quadratic_error_radius_contraction

end MathScope.M3.CD
