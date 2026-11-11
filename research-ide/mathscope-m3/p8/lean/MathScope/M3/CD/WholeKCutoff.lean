import Mathlib.Analysis.Complex.ExponentialBounds
import Mathlib.Tactic

/-!
# Physical chart and cutoff scope on the N7 transition slab

The accompanying exact replay pins the source cutoff recurrences and slab.
These lemmas concern their real arguments. They require the original
functions to supply the stated recurrences and do not construct their fields.
-/

namespace MathScope.M3.CD

/-- Every positive root of the normalized physical chart lies in the
source bracket on the whole cutoff slab. The root equation is obtained by
substituting `q = tau0 * Q`, `z = tau0^D * zeta`, `tau = tau0 * rho`,
and `sigma = zeta^2`. -/
theorem whole_k_normalized_q_bounds {Q rho sigma alpha : ℝ}
    (hQ : 0 < Q) (hrho₀ : 1 / 2 ≤ rho) (hrho₁ : rho ≤ 1)
    (hsigma₀ : 0 ≤ sigma) (hsigma₁ : sigma ≤ 1 / 2)
    (halpha : alpha < 1) (hroot : Q - sigma * Q ^ alpha = rho) :
    1 / 2 ≤ Q ∧ Q < 2 := by
  have hp : 0 ≤ Q ^ alpha := Real.rpow_nonneg hQ.le _
  constructor
  · linarith [mul_nonneg hsigma₀ hp]
  · by_contra! h
    have hpow : Q ^ alpha < Q := by
      simpa only [Real.rpow_one] using
        (Real.rpow_lt_rpow_of_exponent_lt (show 1 < Q by linarith) halpha)
    have hmul : sigma * Q ^ alpha ≤ (1 / 2) * Q ^ alpha :=
      mul_le_mul_of_nonneg_right hsigma₁ hp
    linarith

private theorem exp_five_gt_sixtyfour : (64 : ℝ) < Real.exp 5 := by
  have hbase : (5 / 2 : ℝ) < Real.exp 1 :=
    lt_trans (by norm_num) Real.exp_one_gt_d9
  have hpow : (5 / 2 : ℝ) ^ (5 : ℕ) < Real.exp 1 ^ (5 : ℕ) :=
    pow_lt_pow_left₀ hbase (by norm_num) (by decide)
  have hnat : Real.exp 5 = Real.exp 1 ^ (5 : ℕ) := by
    simpa using Real.exp_nat_mul 1 5
  rw [hnat]
  exact lt_trans (by norm_num) hpow

/-- With the actual initial log-scale and unit growth, all stage arguments
from five onward lie strictly inside the zero branch throughout the slab. -/
theorem whole_k_correction_cutoff_argument {qBig q : ℝ} (L : ℕ → ℝ)
    (hqBig : 0 < qBig) (hq : qBig / 64 ≤ q)
    (hL₀ : L 0 = Real.log (1 / qBig)) (hL : ∀ j, L j + 1 ≤ L (j + 1))
    {j : ℕ} (hj : 5 ≤ j) :
    1 < Real.exp (L j) * q := by
  have hlinear : ∀ n : ℕ, Real.log (1 / qBig) + (n : ℝ) ≤ L n := by
    intro n
    induction n with
    | zero => simp [hL₀]
    | succ n ih =>
      rw [Nat.cast_succ]
      linarith [hL n]
  have hcast : (5 : ℝ) ≤ (j : ℝ) := by exact_mod_cast hj
  have hlog : Real.log (1 / qBig) + 5 ≤ L j := by linarith [hlinear j]
  have hExp : Real.exp (Real.log (1 / qBig) + 5) ≤ Real.exp (L j) :=
    Real.exp_le_exp.mpr hlog
  rw [Real.exp_add, Real.exp_log (by positivity : 0 < 1 / qBig)] at hExp
  have hDiv : (1 / qBig) * (64 : ℝ) < (1 / qBig) * Real.exp 5 :=
    mul_lt_mul_of_pos_left exp_five_gt_sixtyfour (by positivity)
  calc
    1 = ((1 / qBig) * 64) * (qBig / 64) := by field_simp [hqBig.ne'] <;> ring
    _ < ((1 / qBig) * Real.exp 5) * (qBig / 64) :=
      mul_lt_mul_of_pos_right hDiv (by positivity)
    _ ≤ Real.exp (L j) * (qBig / 64) :=
      mul_le_mul_of_nonneg_right hExp (by positivity)
    _ ≤ Real.exp (L j) * q := mul_le_mul_of_nonneg_left hq (Real.exp_pos _).le

/-- The pinned common-background selector anchors b1 and gives a factor
16 at order two, then at least two. At order four equality at the
cutoff seam is allowed. -/
theorem whole_k_background_cutoff_argument {qBig q : ℝ} (b : ℕ → ℝ)
    (hqBig : 0 < qBig) (hq : qBig / 64 ≤ q)
    (hb₁ : 1 ≤ b 1 * qBig) (hb₂ : 16 * b 1 ≤ b 2)
    (hb₃ : 2 * b 2 ≤ b 3) (hb₄ : 2 * b 3 ≤ b 4)
    (hb : ∀ n : ℕ, 4 ≤ n → b 4 ≤ b n) {n : ℕ} (hn : 4 ≤ n) :
    1 ≤ b n * q := by
  have h₂ := mul_le_mul_of_nonneg_right hb₂ hqBig.le
  have h₃ := mul_le_mul_of_nonneg_right hb₃ hqBig.le
  have h₄ := mul_le_mul_of_nonneg_right hb₄ hqBig.le
  have hbound : 64 ≤ b 4 * qBig := by nlinarith
  have hbnonneg : 0 ≤ b 4 := by
    by_contra! h
    have hnegative : b 4 * qBig < 0 := mul_neg_of_neg_of_pos h hqBig
    linarith
  have hq₀ : 0 ≤ q := le_trans (by positivity : 0 ≤ qBig / 64) hq
  calc
    1 ≤ b 4 * (qBig / 64) := by linarith
    _ ≤ b 4 * q := mul_le_mul_of_nonneg_left hq hbnonneg
    _ ≤ b n * q := mul_le_mul_of_nonneg_right (hb n hn) hq₀

/-- At rho=1/2 the axis has Q=1/2 and zeta=2/3 has Q>7/8. Even a
window [a,exp(1/2)*a] that covers both of these interior spatial points
would contradict the source's narrow-window width. -/
theorem whole_k_narrow_q_window_obstruction {Q a alpha : ℝ}
    (hQ : 0 < Q) (halpha : alpha < 1)
    (hroot : Q - (4 / 9) * Q ^ alpha = 1 / 2) :
    ¬ (a ≤ 1 / 2 ∧ Q ≤ Real.exp (1 / 2) * a) := by
  have hQlarge : 7 / 8 < Q := by
    by_contra! h
    have hpow : Q < Q ^ alpha := by
      simpa only [Real.rpow_one] using
        (Real.rpow_lt_rpow_of_exponent_gt hQ (show Q < 1 by linarith) halpha)
    linarith
  have heSquare : (Real.exp (1 / 2)) ^ (2 : ℕ) = Real.exp 1 := by
    rw [pow_two, ← Real.exp_add]
    norm_num
  have he : Real.exp (1 / 2) < 7 / 4 := by
    by_contra! h
    have hp := pow_le_pow_left₀ (by norm_num : 0 ≤ (7 / 4 : ℝ)) h 2
    rw [heSquare] at hp
    linarith [Real.exp_one_lt_three]
  intro hcover
  have hm := mul_le_mul_of_nonneg_left hcover.1 (Real.exp_pos (1 / 2)).le
  linarith [hcover.2]

#print axioms whole_k_normalized_q_bounds
#print axioms whole_k_correction_cutoff_argument
#print axioms whole_k_background_cutoff_argument
#print axioms whole_k_narrow_q_window_obstruction

end MathScope.M3.CD
