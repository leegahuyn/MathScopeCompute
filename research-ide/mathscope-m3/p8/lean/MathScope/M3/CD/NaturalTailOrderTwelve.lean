import Mathlib

namespace MathScope.M3.CD

/-- The integer majorant retains the factorial in eta derivatives through
order twelve. The analytic coefficient bound is a separate premise. -/
theorem natural_tail_polynomial_order_twelve (n : ℕ) (hn : 257 ≤ n) :
    ((n : ℝ) + 12) ^ 24 ≤ (2 : ℝ) ^ n := by
  induction n, hn using Nat.le_induction with
  | base =>
    have hbase : (269 : ℕ) ^ 24 ≤ 2 ^ 257 := by decide
    exact_mod_cast hbase
  | succ n hn ih =>
    have hnReal : (257 : ℝ) ≤ (n : ℝ) := by exact_mod_cast hn
    have hlin : 269 * ((n : ℝ) + 13) ≤ 270 * ((n : ℝ) + 12) := by linarith
    have hpow : (269 * ((n : ℝ) + 13)) ^ 24 ≤
        (270 * ((n : ℝ) + 12)) ^ 24 := by gcongr
    rw [mul_pow, mul_pow] at hpow
    have hratio : (270 : ℝ) ^ 24 ≤ 2 * (269 : ℝ) ^ 24 := by norm_num
    have hnum := mul_le_mul_of_nonneg_right hratio
      (show 0 ≤ ((n : ℝ) + 12) ^ 24 by positivity)
    have hstep : ((n : ℝ) + 13) ^ 24 ≤ 2 * ((n : ℝ) + 12) ^ 24 := by
      have hscaled : (269 : ℝ) ^ 24 * ((n : ℝ) + 13) ^ 24 ≤
          (269 : ℝ) ^ 24 * (2 * ((n : ℝ) + 12) ^ 24) := by
        calc
          _ ≤ (270 : ℝ) ^ 24 * ((n : ℝ) + 12) ^ 24 := hpow
          _ ≤ (2 * (269 : ℝ) ^ 24) * ((n : ℝ) + 12) ^ 24 := hnum
          _ = _ := by ring
      by_contra! hfail
      have hstrict := mul_lt_mul_of_pos_left hfail
        (show 0 < (269 : ℝ) ^ 24 by positivity)
      exact (not_lt_of_ge hscaled) hstrict
    calc
      ((↑(n + 1) : ℝ) + 12) ^ 24 = ((n : ℝ) + 13) ^ 24 := by
        congr 1
        push_cast
        ring
      _ ≤ 2 * ((n : ℝ) + 12) ^ 24 := hstep
      _ ≤ 2 * (2 : ℝ) ^ n := mul_le_mul_of_nonneg_left ih (by norm_num)
      _ = (2 : ℝ) ^ (n + 1) := by rw [pow_succ]; ring

#print axioms natural_tail_polynomial_order_twelve

end MathScope.M3.CD
