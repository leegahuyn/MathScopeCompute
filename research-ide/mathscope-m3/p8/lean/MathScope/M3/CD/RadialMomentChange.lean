import Mathlib

namespace MathScope.M3.CD

open MeasureTheory

/-- On a fixed axial-time slice, (s) is constant along the radial integral.
The transformation (X=r^2/(2s)) has the exact cylindrical Jacobian
(r\,dr=s\,dX). -/
theorem radial_moment_change_of_variables
    (f : ℝ → ℝ) (hf : Continuous f) {a b s : ℝ} (hs : 0 < s) :
    (∫ r in a..b, r * f (r ^ 2 / (2 * s))) =
      s * (∫ X in a ^ 2 / (2 * s)..b ^ 2 / (2 * s), f X) := by
  have hJacobian (r : ℝ) :
      HasDerivAt (fun u : ℝ => u ^ 2 / (2 * s)) (r / s) r := by
    convert (((hasDerivAt_id r).pow 2).div_const (2 * s)) using 1
    norm_num [id]
    field_simp [hs.ne']
  have hSub :
      (∫ r in a..b, f (r ^ 2 / (2 * s)) * (r / s)) =
        ∫ X in a ^ 2 / (2 * s)..b ^ 2 / (2 * s), f X :=
    intervalIntegral.integral_comp_mul_deriv
      (fun r _ => hJacobian r) (continuous_id.div_const s).continuousOn hf
  calc
    (∫ r in a..b, r * f (r ^ 2 / (2 * s))) =
        ∫ r in a..b, s * (f (r ^ 2 / (2 * s)) * (r / s)) := by
      apply intervalIntegral.integral_congr
      intro r _
      field_simp [hs.ne']
    _ = s * (∫ X in a ^ 2 / (2 * s)..b ^ 2 / (2 * s), f X) := by
      rw [intervalIntegral.integral_const_mul, hSub]

/-- A zero whole-profile moment transfers to the original radial primitive
when its actual endpoints produce the same profile interval. -/
theorem radial_moment_zero_of_profile_zero
    (f : ℝ → ℝ) (hf : Continuous f) {a b s : ℝ} (hs : 0 < s)
    (hMoment : (∫ X in a ^ 2 / (2 * s)..b ^ 2 / (2 * s), f X) = 0) :
    (∫ r in a..b, r * f (r ^ 2 / (2 * s))) = 0 := by
  rw [radial_moment_change_of_variables f hf hs, hMoment, mul_zero]

#print axioms radial_moment_change_of_variables
#print axioms radial_moment_zero_of_profile_zero

end MathScope.M3.CD
