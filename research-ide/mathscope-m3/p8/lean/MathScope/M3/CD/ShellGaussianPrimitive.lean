import Mathlib

open Set MeasureTheory

namespace MathScope.M3.CD

noncomputable section

/-- Logarithm of the two-ended Gaussian with an inverse power of the
distance to the chosen face. Swap the two positive coefficients for the
other face. -/
def shellLogWeight (a b width p x : ℝ) : ℝ :=
  -a / x ^ 2 + (-b) / (width - x) ^ 2 - p * Real.log x

/-- Logarithmic derivative with both ends retained. -/
theorem hasDerivAt_shellLogWeight {a b width p x : ℝ}
    (hx : 0 < x) (hxw : x < width) :
    HasDerivAt (shellLogWeight a b width p)
      ((2 * a - p * x ^ 2 - 2 * b * (x / (width - x)) ^ 3) / x ^ 3) x := by
  have hx' : HasDerivAt (fun y : ℝ => y) 1 x := hasDerivAt_id x
  have hw' : HasDerivAt (fun y : ℝ => width - y) (-1) x := by
    change HasDerivAt ((fun _ : ℝ => width) - fun y => y) (-1) x
    simpa only [zero_sub] using (hasDerivAt_const x width).sub hx'
  have hw : width - x ≠ 0 := (sub_pos.mpr hxw).ne'
  have h₁ := (hasDerivAt_const x (-a)).div (hx'.pow 2) (pow_ne_zero 2 hx.ne')
  have h₂ := (hasDerivAt_const x (-b)).div (hw'.pow 2) (pow_ne_zero 2 hw)
  have h₃ := (Real.hasDerivAt_log hx.ne').const_mul p
  convert (h₁.add h₂).sub h₃ using 1
  · funext y
    rfl
  · (try simp) <;> field_simp [hx.ne', hw] <;> ring

/-- On the original logarithmic collar the elementary pointwise envelope is
largest at the current radius. The condition keeps the full opposite-face
Gaussian, so the endpoint comparison has constant one. -/
theorem shellLogWeight_monoOn {a b width p d : ℝ}
    (hb : 0 ≤ b) (hp : 0 ≤ p) (hd : 0 < d) (hdw : d < width)
    (hcollar : p * d ^ 2 + 2 * b * (d / (width - d)) ^ 3 ≤ 2 * a) :
    MonotoneOn (shellLogWeight a b width p) (Ioc 0 d) := by
  have hdiff : ∀ x ∈ Ioc (0 : ℝ) d, HasDerivAt (shellLogWeight a b width p)
      ((2 * a - p * x ^ 2 - 2 * b * (x / (width - x)) ^ 3) / x ^ 3) x :=
    fun x hx => hasDerivAt_shellLogWeight hx.1 (hx.2.trans_lt hdw)
  refine monotoneOn_of_deriv_nonneg (convex_Ioc _ _)
    (fun x hx => (hdiff x hx).continuousAt.continuousWithinAt)
    (fun x hx => (hdiff x (interior_subset hx)).differentiableAt.differentiableWithinAt) ?_
  intro x hx
  have hx' : x ∈ Ioc (0 : ℝ) d := interior_subset hx
  rw [(hdiff x hx').deriv]
  have hw : 0 < width - x := sub_pos.mpr (hx'.2.trans_lt hdw)
  have hwd : 0 < width - d := sub_pos.mpr hdw
  have hwpos : 0 ≤ width := (hd.trans hdw).le
  have hratio : x / (width - x) ≤ d / (width - d) := by
    apply (div_le_div_iff₀ hw hwd).2
    nlinarith only [mul_le_mul_of_nonneg_right hx'.2 hwpos]
  have hpole : p * x ^ 2 ≤ p * d ^ 2 :=
    mul_le_mul_of_nonneg_left (pow_le_pow_left₀ hx'.1.le hx'.2 2) hp
  have hother : 2 * b * (x / (width - x)) ^ 3 ≤ 2 * b * (d / (width - d)) ^ 3 :=
    mul_le_mul_of_nonneg_left (pow_le_pow_left₀ (div_nonneg hx'.1.le hw.le) hratio 3)
      (mul_nonneg (by norm_num) hb)
  exact div_nonneg (by linarith only [hcollar, hpole, hother]) (pow_nonneg hx'.1.le 3)

/-- A weighted pointwise source estimate on the open logarithmic collar
transfers to the short endpoint integral with the same Gaussian exponent.
The norm envelope may absorb the change-of-variable Jacobian and the
original radial factor. The exterior endpoint is outside the Ioc domain. -/
theorem weighted_shell_endpoint_integral {a b width p d C : ℝ} {f : ℝ → ℝ}
    (hb : 0 ≤ b) (hp : 0 ≤ p) (hd : 0 < d) (hdw : d < width) (hC : 0 ≤ C)
    (hcollar : p * d ^ 2 + 2 * b * (d / (width - d)) ^ 3 ≤ 2 * a)
    (hsource : ∀ x ∈ Ioc (0 : ℝ) d, ‖f x‖ ≤ C * Real.exp (shellLogWeight a b width p x)) :
    ‖∫ x in (0 : ℝ)..d, f x‖ ≤
      C * Real.exp (shellLogWeight a b width p d) * d := by
  have hmono := shellLogWeight_monoOn hb hp hd hdw hcollar
  have hbound : ∀ x ∈ uIoc (0 : ℝ) d, ‖f x‖ ≤ C * Real.exp (shellLogWeight a b width p d) := by
    rw [uIoc_of_le hd.le]
    intro x hx
    exact (hsource x hx).trans <| mul_le_mul_of_nonneg_left
      (Real.exp_le_exp.mpr (hmono hx ⟨hd, le_rfl⟩ hx.2)) hC
  simpa [sub_zero, abs_of_nonneg hd.le] using
    intervalIntegral.norm_integral_le_of_norm_le_const hbound

#print axioms hasDerivAt_shellLogWeight
#print axioms shellLogWeight_monoOn
#print axioms weighted_shell_endpoint_integral

end

end MathScope.M3.CD
