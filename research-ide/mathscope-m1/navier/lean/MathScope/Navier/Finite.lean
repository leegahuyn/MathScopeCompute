import Mathlib.Tactic.NormNum
import Mathlib.Tactic.Ring
import Mathlib.Algebra.BigOperators.Group.Finset.Basic
import Mathlib.Data.Rat.Defs
import Mathlib.Data.Real.Basic

namespace MathScope.Navier.Finite
open Finset

def comparisonPartial (z : ℚ) (N : ℕ) : ℚ :=
  ∑ n ∈ Finset.range (N+1), (-z/2)^n / ((Nat.factorial n : ℚ) * (Nat.factorial (n+1) : ℚ))

set_option maxRecDepth 10000
set_option maxHeartbeats 2000000

theorem comparison_at_zero : comparisonPartial 0 8 = 1 := by
  norm_num [comparisonPartial, Finset.sum_range_succ, Nat.factorial]

/-- A finite rational series fixture; it does not identify the full nonlinear axis profile. -/
theorem comparison_finite_bracket :
    (271 : ℚ)/1000 < comparisonPartial (41/10) 12 ∧
    comparisonPartial (41/10) 12 < (272 : ℚ)/1000 := by
  norm_num [comparisonPartial, Finset.sum_range_succ, Nat.factorial]

/-- The exact bilinear increment that a nonlinear residual updater must retain. -/
theorem quadratic_increment (u du : ℝ) : (u+du)^2-u^2 = 2*u*du+du^2 := by ring

set_option pp.fullNames true
#check comparison_at_zero
#print axioms comparison_at_zero
#check comparison_finite_bracket
#print axioms comparison_finite_bracket
#check quadratic_increment
#print axioms quadratic_increment
end MathScope.Navier.Finite
