import Mathlib.Data.Real.Basic
import Mathlib.Tactic.NormNum
example : (305719 / 1152000 - 1 / 318 : ℝ) ≤ 1 / 4 := by norm_num
