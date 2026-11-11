import Mathlib

namespace MathScope.M3.CD

/-- The integer window supplied by the two source maximum arms contains L+2. -/
theorem reference_band_label (ellZero L M : ℤ)
    (hL : ellZero + 4 ≤ L) (hM : L + 4 ≤ M) :
    max ellZero L ≤ L + 2 ∧ L + 2 ≤ M - 1 ∧ ellZero + 6 ≤ L + 2 := by
  constructor
  · apply max_le <;> omega
  · omega

/-- Use the normalized chart equation on the positive domain. A strict
decrease on this domain follows from either a nonzero axial coordinate
or positive time. -/
theorem positive_reference_root_unique {s₁ s₂ Z T a : ℝ}
    (ha : 0 < a) (hT : 0 ≤ T) (hnonzero : Z ≠ 0 ∨ 0 < T)
    (h₁ : 0 < s₁) (h₂ : 0 < s₂)
    (hr₁ : Z ^ 2 / s₁ ^ a + T / s₁ = 1)
    (hr₂ : Z ^ 2 / s₂ ^ a + T / s₂ = 1) :
    s₁ = s₂ := by
  have strictDecrease (x y : ℝ) (hx : 0 < x) (hy : 0 < y) (hxy : x < y) :
      Z ^ 2 / y ^ a + T / y < Z ^ 2 / x ^ a + T / x := by
    have hxpow : 0 < x ^ a := Real.rpow_pos_of_pos hx _
    have hypow : 0 < y ^ a := Real.rpow_pos_of_pos hy _
    have hp : x ^ a < y ^ a := Real.rpow_lt_rpow hx.le hxy ha
    rcases hnonzero with hz | ht
    · have hzlt : Z ^ 2 / y ^ a < Z ^ 2 / x ^ a := by
        apply (div_lt_div_iff₀ hypow hxpow).2
        exact mul_lt_mul_of_pos_left hp (sq_pos_of_ne_zero hz)
      have htLe : T / y ≤ T / x := by
        apply (div_le_div_iff₀ hy hx).2
        exact mul_le_mul_of_nonneg_left hxy.le hT
      exact add_lt_add_of_lt_of_le hzlt htLe
    · have hzLe : Z ^ 2 / y ^ a ≤ Z ^ 2 / x ^ a := by
        apply (div_le_div_iff₀ hypow hxpow).2
        exact mul_le_mul_of_nonneg_left hp.le (sq_nonneg _)
      have htLt : T / y < T / x := by
        apply (div_lt_div_iff₀ hy hx).2
        exact mul_lt_mul_of_pos_left hxy ht
      exact add_lt_add_of_le_of_lt hzLe htLt
  rcases lt_trichotomy s₁ s₂ with hlt | heq | hgt
  · have h := strictDecrease s₁ s₂ h₁ h₂ hlt
    rw [hr₁, hr₂] at h
    exact (lt_irrefl _ h).elim
  · exact heq
  · have h := strictDecrease s₂ s₁ h₂ h₁ hgt
    rw [hr₁, hr₂] at h
    exact (lt_irrefl _ h).elim

/-- A replacement of the time coordinate alone can destroy existence in the
registered bracket. This is a control for transport into nested frames. -/
theorem zero_axial_time_below_reference_bracket {s T a : ℝ}
    (hs : 1 / 2 ≤ s) (hT : T < 1 / 2) :
    ¬ ((0 : ℝ) ^ 2 / s ^ a + T / s = 1) := by
  have hpos : 0 < s := by linarith
  intro h
  have hdiv : T / s = 1 := by simpa using h
  have htime : T = 1 * s := (div_eq_iff hpos.ne').mp hdiv
  linarith

#print axioms reference_band_label
#print axioms positive_reference_root_unique
#print axioms zero_axial_time_below_reference_bracket

end MathScope.M3.CD
