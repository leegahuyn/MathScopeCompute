import NavierStokes.NaturalAxisData
import Mathlib.Analysis.SpecialFunctions.Exp
import Mathlib.Tactic.NormNum

/-! Actual small-parameter instantiation and positivity of the selected scale
formula. These theorems do not assert a global profile or analytic bound bundle. -/
set_option autoImplicit false

namespace MathScope.SourceCoherence

theorem actual_small_parameters :
    NavierStokes.NaturalAxisData.SmallParameters
      (3022314549036573 / 302231454903657293676544 : ℝ)
      (1 / 10000000000 : ℝ) := by
  constructor <;> norm_num

theorem positive_selected_scale (u b a ell : ℝ)
    (hu : 0 < u) (hb : 0 < b) (ha : 0 < a) :
    0 < (u / (100000000 * b ^ 20 * (1 + a))) * Real.exp (-24 * ell) := by
  apply mul_pos _ (Real.exp_pos _)
  apply div_pos hu
  exact mul_pos (mul_pos (by norm_num) (pow_pos hb _)) (by linarith)

theorem selected_scale_is_not_zero (u b a ell : ℝ)
    (hu : 0 < u) (hb : 0 < b) (ha : 0 < a) :
    (u / (100000000 * b ^ 20 * (1 + a))) * Real.exp (-24 * ell) ≠ 0 :=
  ne_of_gt (positive_selected_scale u b a ell hu hb ha)

#check actual_small_parameters
#print axioms actual_small_parameters
#check positive_selected_scale
#print axioms positive_selected_scale
#check selected_scale_is_not_zero
#print axioms selected_scale_is_not_zero

end MathScope.SourceCoherence
