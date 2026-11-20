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

/-- A positive log-slope reserve gains three powers of the distance in the
short endpoint integral, including the original opposite-end weight. -/
theorem weighted_shell_endpoint_integral_cubic {a b width p d C : ℝ} {f : ℝ → ℝ}
    (ha : 0 < a) (hb : 0 ≤ b) (hp : 0 ≤ p) (hd : 0 < d) (hdw : d < width)
    (hC : 0 ≤ C)
    (hcollar : p * d ^ 2 + 2 * b * (d / (width - d)) ^ 3 ≤ a)
    (hsource : ∀ x ∈ Ioc (0 : ℝ) d, ‖f x‖ ≤ C * Real.exp (shellLogWeight a b width p x)) :
    ‖∫ x in (0 : ℝ)..d, f x‖ ≤
      (C * Real.exp (shellLogWeight a b width p d)) * (d ^ 3 / a) := by
  let k := a / d ^ 3
  have hk : 0 < k := div_pos ha (pow_pos hd 3)
  let shifted := shellLogWeight a b width p - fun x : ℝ => k * x
  have hdiff : ∀ x ∈ Ioc (0 : ℝ) d, HasDerivAt shifted
      ((2 * a - p * x ^ 2 - 2 * b * (x / (width - x)) ^ 3) / x ^ 3 - k) x := by
    intro x hx
    simpa only [shifted, id_eq, mul_one] using
      (hasDerivAt_shellLogWeight (a := a) (b := b) (p := p) hx.1 (hx.2.trans_lt hdw)).sub
        ((hasDerivAt_id x).const_mul k)
  have hmono : MonotoneOn shifted (Ioc 0 d) := by
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
    have hpole := mul_le_mul_of_nonneg_left
      (pow_le_pow_left₀ hx'.1.le hx'.2 2) hp
    have hother := mul_le_mul_of_nonneg_left
      (pow_le_pow_left₀ (div_nonneg hx'.1.le hw.le) hratio 3)
      (mul_nonneg (by norm_num : (0 : ℝ) ≤ 2) hb)
    apply sub_nonneg.mpr
    calc
      k ≤ a / x ^ 3 := by
        exact div_le_div_of_nonneg_left ha.le (pow_pos hx'.1 3)
          (pow_le_pow_left₀ hx'.1.le hx'.2 3)
      _ ≤ _ := div_le_div_of_nonneg_right
        (by linarith only [hcollar, hpole, hother]) (pow_nonneg hx'.1.le 3)
  let C₀ := C * Real.exp (shellLogWeight a b width p d)
  let g := fun x => C₀ * Real.exp (k * (x - d))
  have hg : Continuous g := by
    unfold g
    fun_prop
  have hgres : ∀ x ∈ Ioc (0 : ℝ) d, ‖f x‖ ≤ g x := by
    intro x hx
    have hshift := hmono hx ⟨hd, le_rfl⟩ hx.2
    change shellLogWeight a b width p x - k * x ≤
      shellLogWeight a b width p d - k * d at hshift
    have hlog : shellLogWeight a b width p x ≤ shellLogWeight a b width p d + k * (x - d) := by
      linarith only [hshift, mul_sub k x d]
    calc
      ‖f x‖ ≤ C * Real.exp (shellLogWeight a b width p x) := hsource x hx
      _ ≤ C * Real.exp (shellLogWeight a b width p d + k * (x - d)) :=
        mul_le_mul_of_nonneg_left (Real.exp_le_exp.mpr hlog) hC
      _ = g x := by simp only [g, C₀, Real.exp_add, mul_assoc]
  let F := fun x => (C₀ / k) * Real.exp (k * (x - d))
  have hF (x : ℝ) : HasDerivAt F (g x) x := by
    have hx : HasDerivAt (fun y : ℝ => y - d) 1 x := by
      simpa only [id_eq] using (hasDerivAt_id x).sub_const d
    have hExp := (hx.const_mul k).exp.const_mul (C₀ / k)
    convert hExp using 1 <;> dsimp [F, g] <;> field_simp [hk.ne'] <;> ring
  have hi := intervalIntegral.integral_eq_sub_of_hasDerivAt
    (fun x _ => hF x) (hg.intervalIntegrable (μ := volume) 0 d)
  calc
    ‖∫ x in (0 : ℝ)..d, f x‖ ≤ ∫ x in (0 : ℝ)..d, g x :=
      intervalIntegral.norm_integral_le_of_norm_le hd.le
        (Filter.Eventually.of_forall hgres) (hg.intervalIntegrable 0 d)
    _ = F d - F 0 := hi
    _ ≤ C₀ / k := by
      have h0 : 0 ≤ F 0 := by
        exact mul_nonneg (div_nonneg (mul_nonneg hC (Real.exp_pos _).le) hk.le)
          (Real.exp_pos _).le
      simpa only [F, sub_self, mul_zero, Real.exp_zero, mul_one] using
        (sub_le_self (F d) h0)
    _ = C₀ * (d ^ 3 / a) := by
      dsimp [k]
      field_simp [hd.ne', ha.ne']

#print axioms weighted_shell_endpoint_integral_cubic

/-- The forward radial path stays on the zero side of the actual mean
cutoff. The physical slow coordinates, and hence s, are fixed on the path. -/
theorem inner_forward_path_below_mean_cutoff
    {s r R Xa Xmean y : ℝ}
    (hs : 0 < s) (hr : 0 ≤ r) (hrR : r ≤ R)
    (hXa : 0 < Xa) (hXm : Xa < Xmean) (hy : y < 1)
    (hR : R ^ 2 / (2 * s) ≤ Xa * Real.exp y) :
    r ^ 2 / (2 * s) < Xmean * Real.exp 1 := by
  have hsq := pow_le_pow_left₀ hr hrR 2
  have hden : 0 ≤ 2 * s := by positivity
  calc
    r ^ 2 / (2 * s) ≤ R ^ 2 / (2 * s) := div_le_div_of_nonneg_right hsq hden
    _ ≤ Xa * Real.exp y := hR
    _ < Xa * Real.exp 1 := mul_lt_mul_of_pos_left (Real.exp_lt_exp.mpr hy) hXa
    _ ≤ Xmean * Real.exp 1 :=
      mul_le_mul_of_nonneg_right hXm.le (Real.exp_pos 1).le

/-- Retaining the opposite radial Gaussian on the original inner collar
costs less than one unit in the logarithm of the half-Gaussian. -/
theorem inner_half_gaussian_opposite_exponent
    {width t u : ℝ}
    (hwidth : 2 ≤ width) (ht : 0 ≤ t) (htU : t ≤ 1 / 128)
    (hu : u ≤ 1 / 4) :
    2 / (width - t * u) ^ 2 < 1 := by
  have htu : t * u ≤ 1 / 512 := by
    calc
      t * u ≤ t * (1 / 4) := mul_le_mul_of_nonneg_left hu ht
      _ ≤ (1 / 128 : ℝ) * (1 / 4) :=
        mul_le_mul_of_nonneg_right htU (by norm_num)
      _ = 1 / 512 := by norm_num
  have hfloor : (7 / 4 : ℝ) ≤ width - t * u := by linarith only [hwidth, htu]
  have hp : 0 < (width - t * u) ^ 2 := by
    exact pow_pos (lt_of_lt_of_le (by norm_num : (0 : ℝ) < 7 / 4) hfloor) 2
  apply (div_lt_iff₀ hp).2
  calc
    2 < (7 / 4 : ℝ) ^ 2 := by norm_num
    _ ≤ (width - t * u) ^ 2 := pow_le_pow_left₀ (by norm_num) hfloor 2
    _ = 1 * (width - t * u) ^ 2 := by ring

#print axioms inner_forward_path_below_mean_cutoff
#print axioms inner_half_gaussian_opposite_exponent

end

end MathScope.M3.CD
