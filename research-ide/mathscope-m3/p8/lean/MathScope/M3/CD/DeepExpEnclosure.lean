import Mathlib

namespace MathScope.M3.CD

noncomputable section

/-- A fixed, exactly represented perturbation of a nested exponential seed. -/
def deepExpDyadicShift : ℝ := ((2 : ℝ) ^ (128 : ℕ))⁻¹

/-- Exponential iteration with the outermost exponential applied last. -/
def deepExp : ℕ → ℝ → ℝ
  | 0, x => x
  | n + 1, x => Real.exp (deepExp n x)

theorem deepExp_eq_iterate (n : ℕ) (x : ℝ) :
    deepExp n x = (Real.exp^[n]) x := by
  induction n with
  | zero => rfl
  | succ n ih =>
      simpa only [deepExp, Function.iterate_succ_apply', ih]

theorem two_pow_le_exp_nat (n : ℕ) :
    (2 : ℝ) ^ n ≤ Real.exp (n : ℝ) := by
  have he : (2 : ℝ) ≤ Real.exp 1 := by
    linarith [Real.add_one_le_exp (1 : ℝ)]
  induction n with
  | zero => norm_num
  | succ n ih =>
      calc
        (2 : ℝ) ^ (n + 1) = (2 : ℝ) ^ n * 2 := pow_succ _ _
        _ ≤ Real.exp (n : ℝ) * Real.exp 1 :=
          mul_le_mul ih he (by norm_num) (Real.exp_nonneg _)
        _ = Real.exp ((n + 1 : ℕ) : ℝ) := by
          rw [Nat.cast_add, Nat.cast_one, Real.exp_add]

theorem deepExpDyadicShift_mul_exp {x : ℝ} (hx : 256 ≤ x) :
    1 ≤ deepExpDyadicShift * Real.exp x := by
  have hx128 : (128 : ℝ) ≤ x := by linarith
  have hp : (2 : ℝ) ^ (128 : ℕ) ≤ Real.exp x := by
    exact (two_pow_le_exp_nat 128).trans (Real.exp_le_exp.mpr hx128)
  calc
    (1 : ℝ) = deepExpDyadicShift * (2 : ℝ) ^ (128 : ℕ) := by
      norm_num [deepExpDyadicShift]
    _ ≤ deepExpDyadicShift * Real.exp x :=
      mul_le_mul_of_nonneg_left hp (by unfold deepExpDyadicShift; positivity)

/-- A perturbation amplified by exp x to at least one doubles the next
outer exponential. This statement records the finite numerical margin. -/
theorem double_exp_le_perturbed {x δ : ℝ} (hmargin : 1 ≤ δ * Real.exp x) :
    2 * Real.exp (Real.exp x) ≤ Real.exp (Real.exp (x + δ)) := by
  have hgap : Real.exp x + 1 ≤ Real.exp (x + δ) := by
    rw [Real.exp_add]
    have hlinear : δ + 1 ≤ Real.exp δ := Real.add_one_le_exp δ
    have hmul := mul_le_mul_of_nonneg_left hlinear (Real.exp_nonneg x)
    nlinarith
  have he : (2 : ℝ) ≤ Real.exp 1 := by
    linarith [Real.add_one_le_exp (1 : ℝ)]
  calc
    2 * Real.exp (Real.exp x) ≤ Real.exp (Real.exp x) * Real.exp 1 := by
      simpa only [mul_comm] using
        mul_le_mul_of_nonneg_right he (Real.exp_nonneg (Real.exp x))
    _ = Real.exp (Real.exp x + 1) := (Real.exp_add _ _).symm
    _ ≤ Real.exp (Real.exp (x + δ)) := Real.exp_le_exp.mpr hgap

theorem deepExp_one_le {x : ℝ} (hx : 1 ≤ x) (n : ℕ) :
    1 ≤ deepExp n x := by
  induction n with
  | zero => exact hx
  | succ n ih =>
      change 1 ≤ Real.exp (deepExp n x)
      linarith [Real.add_one_le_exp (deepExp n x)]

theorem two_mul_exp_le_exp_of_double {y z : ℝ}
    (hy : 1 ≤ y) (hyz : 2 * y ≤ z) :
    2 * Real.exp y ≤ Real.exp z := by
  have he : (2 : ℝ) ≤ Real.exp y := by
    linarith [Real.add_one_le_exp y]
  calc
    2 * Real.exp y ≤ Real.exp y * Real.exp y :=
      mul_le_mul_of_nonneg_right he (Real.exp_nonneg y)
    _ = Real.exp (2 * y) := by
      rw [show (2 : ℝ) * y = y + y by ring, Real.exp_add]
    _ ≤ Real.exp z := Real.exp_le_exp.mpr hyz

theorem two_mul_deepExp_shift {x : ℝ} (hx : 256 ≤ x) (n : ℕ) :
    2 * deepExp (n + 2) x ≤ deepExp (n + 2) (x + deepExpDyadicShift) := by
  induction n with
  | zero =>
      simpa only [deepExp] using
        double_exp_le_perturbed (deepExpDyadicShift_mul_exp hx)
  | succ n ih =>
      change 2 * Real.exp (deepExp (n + 2) x) ≤
        Real.exp (deepExp (n + 2) (x + deepExpDyadicShift))
      exact two_mul_exp_le_exp_of_double
        (deepExp_one_le (by linarith : (1 : ℝ) ≤ x) (n + 2)) ih

/-- Every depth at least two absorbs a factor two using the same small
dyadic seed perturbation; the theorem includes every finite depth. -/
theorem iterated_exp_small_dyadic_shift {x : ℝ} (hx : 256 ≤ x)
    {d : ℕ} (hd : 2 ≤ d) :
    2 * (Real.exp^[d]) x ≤ (Real.exp^[d]) (x + deepExpDyadicShift) := by
  have h := two_mul_deepExp_shift hx (d - 2)
  rw [Nat.sub_add_cancel hd] at h
  simpa only [deepExp_eq_iterate] using h

theorem nested_exp_sum_absorption {x a b : ℝ} (hx : 256 ≤ x)
    {d : ℕ} (hd : 2 ≤ d)
    (ha : a ≤ (Real.exp^[d]) x) (hb : b ≤ (Real.exp^[d]) x) :
    a + b ≤ (Real.exp^[d]) (x + deepExpDyadicShift) := by
  have h := iterated_exp_small_dyadic_shift hx hd
  linarith

#print axioms deepExpDyadicShift_mul_exp
#print axioms double_exp_le_perturbed
#print axioms iterated_exp_small_dyadic_shift
#print axioms nested_exp_sum_absorption

end
end MathScope.M3.CD
