import Mathlib.Data.Real.Basic
import Mathlib.Tactic.NormNum

example : (-(1 : ℝ) * 1 = -1 * 1 / 2) := by
  norm_num
