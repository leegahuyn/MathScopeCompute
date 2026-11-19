import Mathlib

namespace MathScope.M3.CD

/-- At a frozen dyadic label with `S = ell ^ 2`, an `S ^ k` loss
consumes at most `rho` of the exponent of the original `epsilon`. -/
theorem fixed_band_weighted_polynomial {ell k rate gamma rho : ℝ}
    (hEll : 0 < ell) (hK : 0 ≤ k)
    (hBand : 4 * k ≤ rho * rate * Real.sqrt ell) :
    Real.exp (2 * k * Real.log ell) * Real.exp (-(gamma * rate * ell)) ≤
      Real.exp (-((gamma - rho) * rate * ell)) := by
  have hRoot : 0 < Real.sqrt ell := Real.sqrt_pos.2 hEll
  have hSquare := Real.sq_sqrt hEll.le
  have hLog : Real.log ell ≤ 2 * Real.sqrt ell := by
    calc
      Real.log ell = Real.log (Real.sqrt ell * Real.sqrt ell) := by
        rw [← pow_two, hSquare]
      _ = Real.log (Real.sqrt ell) + Real.log (Real.sqrt ell) :=
        Real.log_mul hRoot.ne' hRoot.ne'
      _ ≤ 2 * Real.sqrt ell := by
        linarith [Real.log_le_sub_one_of_pos hRoot]
  have hLeft := mul_le_mul_of_nonneg_left hLog (by positivity : 0 ≤ 2 * k)
  have hRight := mul_le_mul_of_nonneg_right hBand hRoot.le
  rw [← Real.exp_add]
  apply Real.exp_le_exp.mpr
  calc
    2 * k * Real.log ell + -(gamma * rate * ell) ≤
        (4 * k) * Real.sqrt ell + -(gamma * rate * ell) := by linarith
    _ ≤ (rho * rate * Real.sqrt ell) * Real.sqrt ell + -(gamma * rate * ell) := by
      linarith only [hRight]
    _ = -((gamma - rho) * rate * ell) := by
      rw [mul_assoc (rho * rate), ← pow_two, hSquare]
      ring

#print axioms fixed_band_weighted_polynomial

end MathScope.M3.CD
