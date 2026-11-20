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
    field_simp [ha.ne', hy.ne']
  change Real.exp (-x) * ((y ^ 2)⁻¹) ^ n ≤ _
  calc
    Real.exp (-x) * ((y ^ 2)⁻¹) ^ n = (Real.exp (-x) * x ^ n) * (a⁻¹) ^ n := by
      rw [mul_assoc, ← mul_pow, hscale]
    _ ≤ (n.factorial : ℝ) * (a⁻¹) ^ n := mul_le_mul_of_nonneg_right htail (by positivity)

/-- A fixed Gaussian pays for a finite pole and any specified even power
of decay at the same face. -/
theorem gaussianPole_even_decay (n m : ℕ) {a y : ℝ}
    (ha : 0 < a) (hy : 0 < y) :
    Real.exp (-(a / y ^ 2)) * ((y ^ 2)⁻¹) ^ n ≤
      ((n + m).factorial : ℝ) * (a⁻¹) ^ (n + m) * (y ^ 2) ^ m := by
  have hcancel : ((y ^ 2)⁻¹) ^ (n + m) * (y ^ 2) ^ m = ((y ^ 2)⁻¹) ^ n := by
    rw [pow_add, mul_assoc, ← mul_pow, inv_mul_cancel₀ (pow_ne_zero 2 hy.ne'), one_pow, mul_one]
  calc
    Real.exp (-(a / y ^ 2)) * ((y ^ 2)⁻¹) ^ n =
        (Real.exp (-(a / y ^ 2)) * ((y ^ 2)⁻¹) ^ (n + m)) * (y ^ 2) ^ m := by
      rw [mul_assoc, hcancel]
    _ ≤ _ := mul_le_mul_of_nonneg_right (gaussianTail (n + m) ha hy) (by positivity)

/-- A face coordinate dominated by ambient distance gives quadratic
decay for a Gaussian times any fixed even pole. -/
theorem gaussianPole_face_quadratic (n : ℕ) {a d dist C L : ℝ}
    (ha : 0 < a) (hd : 0 < d) (hC : 0 ≤ C) (hL : 0 ≤ L)
    (hdist : 0 ≤ dist) (hlip : d ≤ L * dist) :
    C * (Real.exp (-(a / d ^ 2)) * ((d ^ 2)⁻¹) ^ n) ≤
      C * (((n + 1).factorial : ℝ) * (a⁻¹) ^ (n + 1) * (L ^ 2 * dist ^ 2)) := by
  have hsq : d ^ 2 ≤ (L * dist) ^ 2 := by
    nlinarith only [mul_nonneg (sub_nonneg.mpr hlip)
      (add_nonneg (mul_nonneg hL hdist) hd.le)]
  calc
    _ ≤ C * (((n + 1).factorial : ℝ) * (a⁻¹) ^ (n + 1) * (d ^ 2) ^ 1) :=
      mul_le_mul_of_nonneg_left (gaussianPole_even_decay n 1 ha hd) hC
    _ = C * (((n + 1).factorial : ℝ) * (a⁻¹) ^ (n + 1) * d ^ 2) := by rw [pow_one]
    _ ≤ C * (((n + 1).factorial : ℝ) * (a⁻¹) ^ (n + 1) * (L * dist) ^ 2) :=
      mul_le_mul_of_nonneg_left (mul_le_mul_of_nonneg_left hsq (by positivity)) hC
    _ = _ := by rw [mul_pow]

/-- The quotient after division by ambient distance has linear decay. -/
theorem gaussianPole_face_quotient (n : ℕ) {a d dist C L : ℝ}
    (ha : 0 < a) (hd : 0 < d) (hC : 0 ≤ C) (hL : 0 ≤ L)
    (hdist : 0 < dist) (hlip : d ≤ L * dist) :
    C * (Real.exp (-(a / d ^ 2)) * ((d ^ 2)⁻¹) ^ n) / dist ≤
      C * (((n + 1).factorial : ℝ) * (a⁻¹) ^ (n + 1) * (L ^ 2 * dist)) := by
  apply (div_le_iff₀ hdist).2
  convert gaussianPole_face_quadratic n ha hd hC hL hdist.le hlip using 1
  ring

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
#print axioms gaussianPole_even_decay
#print axioms gaussianPole_face_quadratic
#print axioms gaussianPole_face_quotient

end

end MathScope.M3.CD
