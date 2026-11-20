import Mathlib

namespace MathScope.M3.CD

variable {E F : Type*} [NormedAddCommGroup E] [NormedSpace ℝ E]
  [NormedAddCommGroup F] [NormedSpace ℝ F]

/-- A fixed continuous linear inverse commutes with ordinary time differentiation
in the norm in which the source derivative is verified. -/
theorem fixed_inverse_time_derivative (inverse : E →L[ℝ] F)
    {source : ℝ → E} {sourceDerivative : E} {time : ℝ}
    (hSource : HasDerivAt source sourceDerivative time) :
    HasDerivAt (fun s => inverse (source s)) (inverse sourceDerivative) time := by
  simpa only [Function.comp_apply] using inverse.hasFDerivAt.comp_hasDerivAt time hSource

/-- The same transfer holds for a time derivative taken within the source time
interval, with the operator norm multiplying the source derivative bound. -/
theorem fixed_inverse_time_derivativeWithin_bound (inverse : E →L[ℝ] F)
    {source : ℝ → E} {sourceDerivative : E} {time bound : ℝ} {interval : Set ℝ}
    (hSource : HasDerivWithinAt source sourceDerivative interval time)
    (hBound : ‖sourceDerivative‖ ≤ bound) :
    HasDerivWithinAt (fun s => inverse (source s)) (inverse sourceDerivative) interval time ∧
      ‖inverse sourceDerivative‖ ≤ ‖inverse‖ * bound := by
  constructor
  · simpa only [Function.comp_apply] using
      inverse.hasFDerivAt.comp_hasDerivWithinAt time hSource
  · exact (inverse.le_opNorm sourceDerivative).trans
      (mul_le_mul_of_nonneg_left hBound (norm_nonneg inverse))

#print axioms fixed_inverse_time_derivative
#print axioms fixed_inverse_time_derivativeWithin_bound

end MathScope.M3.CD
