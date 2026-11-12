import Mathlib

namespace MathScope.M3.CD

noncomputable section

private theorem gaussianTail (n : ℕ) {a y : ℝ} (ha : 0 < a) (hy : 0 < y) :
    Real.exp (-(a / y ^ 2)) * ((y ^ 2)⁻¹) ^ n ≤ (n.factorial : ℝ) * (a⁻¹) ^ n := by
  let x : ℝ := a / y ^ 2
  have hx : 0 ≤ x := by dsimp [x]; positivity
  have hfac : 0 < (n.factorial : ℝ) := by exact_mod_cast Nat.factorial_pos n
  have hpower : x ^ n ≤ Real.exp x * (n.factorial : ℝ) :=
    (div_le_iff₀ hfac).mp (Real.pow_div_factorial_le_exp x hx n)
  have htail : Real.exp (-x) * x ^ n ≤ (n.factorial : ℝ) := by
    calc
      Real.exp (-x) * x ^ n ≤ Real.exp (-x) * (Real.exp x * (n.factorial : ℝ)) :=
        mul_le_mul_of_nonneg_left hpower (Real.exp_pos _).le
      _ = (n.factorial : ℝ) := by
        rw [← mul_assoc, ← Real.exp_add, neg_add_cancel, Real.exp_zero, one_mul]
  have hscale : x * a⁻¹ = (y ^ 2)⁻¹ := by
    dsimp [x]
    field_simp [ha.ne', hy.ne'] <;> ring
  change Real.exp (-x) * ((y ^ 2)⁻¹) ^ n ≤ _
  calc
    Real.exp (-x) * ((y ^ 2)⁻¹) ^ n = (Real.exp (-x) * x ^ n) * (a⁻¹) ^ n := by
      rw [mul_assoc, ← mul_pow, hscale]
    _ ≤ (n.factorial : ℝ) * (a⁻¹) ^ n := mul_le_mul_of_nonneg_right htail (by positivity)

/-- The minimum of the two logarithmic distances and one gives the three
    original branches of the annular Gaussian absorption bound. -/
theorem annularGaussianPole (n : ℕ) {a b y d : ℝ}
    (ha : 0 < a) (hb : 0 < b) (hy : 0 < y) (hd : 0 < d) :
    Real.exp (-(a / y ^ 2) - b / d ^ 2) *
        (((min 1 (min y d)) ^ 2)⁻¹) ^ n ≤
      1 + (n.factorial : ℝ) * ((a⁻¹) ^ n + (b⁻¹) ^ n) := by
  have heA : Real.exp (-(a / y ^ 2)) ≤ 1 := Real.exp_le_one_iff.mpr (by
    have : 0 ≤ a / y ^ 2 := by positivity
    linarith)
  have heB : Real.exp (-(b / d ^ 2)) ≤ 1 := Real.exp_le_one_iff.mpr (by
    have : 0 ≤ b / d ^ 2 := by positivity
    linarith)
  have hconst : Real.exp (-(a / y ^ 2) - b / d ^ 2) ≤ 1 := by
    rw [sub_eq_add_neg, Real.exp_add]
    calc
      Real.exp (-(a / y ^ 2)) * Real.exp (-(b / d ^ 2)) ≤ 1 * Real.exp (-(b / d ^ 2)) :=
        mul_le_mul_of_nonneg_right heA (Real.exp_pos _).le
      _ ≤ 1 := by simpa only [one_mul] using heB
  have hya : Real.exp (-(a / y ^ 2) - b / d ^ 2) * ((y ^ 2)⁻¹) ^ n ≤
      (n.factorial : ℝ) * (a⁻¹) ^ n := by
    rw [sub_eq_add_neg, Real.exp_add, mul_comm (Real.exp (-(a / y ^ 2))), mul_assoc]
    calc
      Real.exp (-(b / d ^ 2)) * (Real.exp (-(a / y ^ 2)) * ((y ^ 2)⁻¹) ^ n) ≤
          1 * (Real.exp (-(a / y ^ 2)) * ((y ^ 2)⁻¹) ^ n) :=
        mul_le_mul_of_nonneg_right heB (by positivity)
      _ ≤ _ := by simpa only [one_mul] using gaussianTail n ha hy
  have hdb : Real.exp (-(a / y ^ 2) - b / d ^ 2) * ((d ^ 2)⁻¹) ^ n ≤
      (n.factorial : ℝ) * (b⁻¹) ^ n := by
    rw [sub_eq_add_neg, Real.exp_add, mul_assoc]
    calc
      Real.exp (-(a / y ^ 2)) * (Real.exp (-(b / d ^ 2)) * ((d ^ 2)⁻¹) ^ n) ≤
          1 * (Real.exp (-(b / d ^ 2)) * ((d ^ 2)⁻¹) ^ n) :=
        mul_le_mul_of_nonneg_right heA (by positivity)
      _ ≤ _ := by simpa only [one_mul] using gaussianTail n hb hd
  have hposA : 0 ≤ (n.factorial : ℝ) * (a⁻¹) ^ n := by positivity
  have hposB : 0 ≤ (n.factorial : ℝ) * (b⁻¹) ^ n := by positivity
  rw [mul_add]
  rcases le_total y d with hyd | hdy
  · rw [min_eq_left hyd]
    rcases le_total 1 y with h1 | h1
    · rw [min_eq_left h1]
      simp only [one_pow, inv_one, mul_one]
      linarith
    · rw [min_eq_right h1]
      linarith
  · rw [min_eq_right hdy]
    rcases le_total 1 d with h1 | h1
    · rw [min_eq_left h1]
      simp only [one_pow, inv_one, mul_one]
      linarith
    · rw [min_eq_right h1]
      linarith

#print axioms annularGaussianPole

end

end MathScope.M3.CD
