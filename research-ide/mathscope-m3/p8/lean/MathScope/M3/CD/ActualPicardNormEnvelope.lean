import Mathlib

namespace MathScope.M3.CD

/-- The closed sum of the original even and odd Volterra word envelopes
is bounded by the simpler exponential with the same source scale. -/
theorem picard_closed_word_norm {x y : ℝ}
    (hx : 0 ≤ x) (hy : 0 ≤ y) (hxy : x ^ 2 ≤ y) :
    ((1 + x) * Real.exp y - 1) / 2 ≤ Real.exp (2 * y) := by
  have hfactor : (1 + x) / 2 ≤ Real.exp y := by
    by_cases hxOne : x ≤ 1
    · have hExpOne : 1 ≤ Real.exp y := by
        simpa only [Real.exp_zero] using Real.exp_le_exp.mpr hy
      linarith
    · have hxSq : x ≤ x ^ 2 := by
        nlinarith [mul_nonneg hx (show 0 ≤ x - 1 by linarith)]
      linarith [Real.add_one_le_exp y]
  calc
    _ = ((1 + x) / 2) * Real.exp y - 1 / 2 := by ring
    _ ≤ ((1 + x) / 2) * Real.exp y := by linarith
    _ ≤ Real.exp y * Real.exp y := mul_le_mul_of_nonneg_right hfactor (Real.exp_pos y).le
    _ = Real.exp (2 * y) := by rw [← Real.exp_add]; congr 1; ring

/-- The closed word estimate therefore fits the original prescribed
norm envelope, without increasing its exponent. -/
theorem picard_prescribed_norm_envelope {x y : ℝ}
    (hx : 0 ≤ x) (hy : 0 ≤ y) (hxy : x ^ 2 ≤ y) :
    ((1 + x) * Real.exp y - 1) / 2 ≤ Real.exp (9 * y / 2) :=
  (picard_closed_word_norm hx hy hxy).trans (Real.exp_le_exp.mpr (by linarith))

#print axioms picard_closed_word_norm
#print axioms picard_prescribed_norm_envelope

/-- A common Picard operator with norm at most one half amplifies a
perturbation of its forcing by at most two along every finite iterate. -/
theorem finite_picard_shared_forcing_cap (d : ℕ → ℝ) {ρ forcing : ℝ}
    (hρ₀ : 0 ≤ ρ) (hρ₁ : ρ ≤ 1 / 2) (hForcing : 0 ≤ forcing)
    (hZero : d 0 ≤ forcing)
    (hStep : ∀ n, d (n + 1) ≤ ρ * d n + forcing) :
    ∀ n, d n ≤ 2 * forcing := by
  intro n
  induction n with
  | zero => linarith
  | succ n ih =>
    have hMultiply := mul_le_mul_of_nonneg_left ih hρ₀
    have hHalf := mul_le_mul_of_nonneg_right hρ₁
      (show 0 ≤ 2 * forcing by linarith)
    linarith [hStep n]

/-- The same cap follows directly for the fixed point comparison. -/
theorem fixed_picard_shared_forcing_cap {d ρ forcing : ℝ}
    (hd : 0 ≤ d) (hρ : ρ ≤ 1 / 2)
    (hComparison : d ≤ ρ * d + forcing) : d ≤ 2 * forcing := by
  linarith [mul_le_mul_of_nonneg_right hρ hd]

#print axioms finite_picard_shared_forcing_cap
#print axioms fixed_picard_shared_forcing_cap

end MathScope.M3.CD
