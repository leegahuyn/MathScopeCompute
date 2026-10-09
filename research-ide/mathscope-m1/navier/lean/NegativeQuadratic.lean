import Mathlib.Tactic.Ring
import Mathlib.Data.Real.Basic
example (u du : ℝ) : (u+du)^2-u^2 = 2*u*du := by ring
