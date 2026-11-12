import Mathlib
/-! Original #622820 conditional chart facts; global source-image membership OPEN. -/
namespace MathScope.M3.CD
noncomputable section
def originalChartF (s Z T h : ℝ) : ℝ := s - Z^2 * s ^ (2*h) - T
theorem chart_axis_s_one (η h : ℝ) :
    originalChartF 1 η (1-η^2) h = 0 := by
  simp [originalChartF]

/-- Genuine source-coordinate image identity for every positive s and real h.
    This does NOT imply all actual free Z/T runtime inputs have this form. -/
theorem chart_full_source_image (s η h : ℝ) (hs : 0 < s) :
    originalChartF s (s ^ ((1/2:ℝ)-h) * η) (s*(1-η^2)) h = 0 := by
  have hp : ((s ^ ((1/2:ℝ)-h))^2) * s^(2*h) = s := by
    have hsquare : ((s ^ ((1/2:ℝ)-h))^2) =
        s ^ (((1/2:ℝ)-h) + ((1/2:ℝ)-h)) := by
      calc
        _ = s ^ ((1/2:ℝ)-h) * s ^ ((1/2:ℝ)-h) := by ring
        _ = _ := (Real.rpow_add hs _ _).symm
    rw [hsquare, ← Real.rpow_add hs]
    have hsum : ((1/2:ℝ)-h) + ((1/2:ℝ)-h) + (2*h) = 1 := by ring
    rw [hsum]
    simp
  have hm : (s ^ ((1/2:ℝ)-h) * η)^2 * s^(2*h) = s*η^2 := by
    calc
      _ = (((s ^ ((1/2:ℝ)-h))^2) * s^(2*h)) * η^2 := by ring
      _ = s*η^2 := by rw [hp]
  unfold originalChartF
  rw [hm]
  ring

theorem chart_zero_Z (s T h : ℝ) :
    originalChartF s 0 T h = s-T := by
  simp [originalChartF]
theorem chart_unique_on_certified_domain
    (Z T h s₁ s₂ : ℝ)
    (hm : StrictMono (fun s : ℝ => originalChartF s Z T h))
    (h₁ : originalChartF s₁ Z T h = 0)
    (h₂ : originalChartF s₂ Z T h = 0) : s₁ = s₂ :=
  hm.injective (h₁.trans h₂.symm)
theorem chart_radial_nonnegative (R s : ℝ) (hs : 0 < s) :
    0 ≤ R^2 / (2*s) := by
  positivity

/-- The actual normalized slow inverse has a strictly positive derivative
on the closed reference bracket under the original physical axial bound. -/
theorem chart_bracket_derivative {Z T h x : ℝ} (h₀ : 0 < h) (h₁ : h < 1 / 16)
    (hZ : Z ^ 2 ≤ 2) (hx : x ∈ Set.Icc (1 / 2 : ℝ) 2) :
    let slope := 1 - Z ^ 2 * (2 * h * x ^ (2 * h - 1))
    HasDerivAt (fun u => originalChartF u Z T h) slope x ∧
      1 / 2 < slope ∧ slope ≤ 1 := by
  have hx₀ : 0 < x := lt_of_lt_of_le (by norm_num) hx.1
  have hp := Real.hasDerivAt_rpow_const (x := x) (p := 2 * h) (Or.inl hx₀.ne')
  have hp₀ := Real.rpow_nonneg hx₀.le (2 * h - 1)
  have hp₂ : x ^ (2 * h - 1) ≤ 2 := by
    by_cases hx₁ : x ≤ 1
    · calc
        _ ≤ x ^ (-1 : ℝ) := Real.rpow_le_rpow_of_exponent_ge hx₀ hx₁ (by linarith)
        _ = 1 / x := by rw [Real.rpow_neg_one, one_div]
        _ ≤ 2 := (div_le_iff₀ hx₀).2 (by linarith [hx.1])
    · exact (Real.rpow_le_one_of_one_le_of_nonpos (le_of_not_ge hx₁) (by linarith)).trans (by norm_num)
  have hupper : Z ^ 2 * (2 * h * x ^ (2 * h - 1)) ≤ 8 * h := by
    calc
      _ ≤ 2 * (2 * h * x ^ (2 * h - 1)) := mul_le_mul_of_nonneg_right hZ (by positivity)
      _ = (4 * h) * x ^ (2 * h - 1) := by ring
      _ ≤ (4 * h) * 2 := mul_le_mul_of_nonneg_left hp₂ (by positivity)
      _ = 8 * h := by ring
  have hnonnegative : 0 ≤ Z ^ 2 * (2 * h * x ^ (2 * h - 1)) := by positivity
  refine ⟨?_, by linarith, by linarith⟩
  simpa only [originalChartF, id_eq] using
    (((hasDerivAt_id x).sub (hp.const_mul (Z ^ 2))).sub_const T)

/-- Each point supplied by the original reference image has the unique
registered slow root, including the two bracket faces. -/
theorem chart_source_image_exists_unique {s η h : ℝ}
    (hs : s ∈ Set.Icc (1 / 2 : ℝ) 2) (hη : |η| ≤ 1)
    (h₀ : 0 < h) (h₁ : h < 1 / 16) :
    ∃! x : ℝ, x ∈ Set.Icc (1 / 2 : ℝ) 2 ∧
      originalChartF x (s ^ ((1 / 2 : ℝ) - h) * η) (s * (1 - η ^ 2)) h = 0 := by
  let Z := s ^ ((1 / 2 : ℝ) - h) * η
  let T := s * (1 - η ^ 2)
  change ∃! x : ℝ, x ∈ Set.Icc (1 / 2 : ℝ) 2 ∧ originalChartF x Z T h = 0
  have hs₀ : 0 < s := lt_of_lt_of_le (by norm_num) hs.1
  have hη₂ : η ^ 2 ≤ 1 := by
    have hh := pow_le_pow_left₀ (abs_nonneg η) hη 2
    rw [sq_abs] at hh
    simpa using hh
  have hZ₂ : Z ^ 2 ≤ 2 := by
    have hp : (s ^ ((1 / 2 : ℝ) - h)) ^ 2 = s ^ (1 - 2 * h) := by
      rw [pow_two, ← Real.rpow_add hs₀]
      congr 1
      ring
    have hP : s ^ (1 - 2 * h) ≤ 2 := by
      calc
        _ ≤ (2 : ℝ) ^ (1 - 2 * h) := Real.rpow_le_rpow hs₀.le hs.2 (by linarith)
        _ ≤ (2 : ℝ) ^ (1 : ℝ) := Real.rpow_le_rpow_of_exponent_le (by norm_num) (by linarith)
        _ = 2 := Real.rpow_one 2
    calc
      Z ^ 2 = s ^ (1 - 2 * h) * η ^ 2 := by rw [Z, mul_pow, hp]
      _ ≤ s ^ (1 - 2 * h) * 1 := mul_le_mul_of_nonneg_left hη₂ (Real.rpow_nonneg hs₀.le _)
      _ ≤ 2 := by simpa only [mul_one] using hP
  have hf : ContinuousOn (fun x => originalChartF x Z T h) (Set.Icc (1 / 2) 2) := by
    intro x hx
    exact (chart_bracket_derivative h₀ h₁ hZ₂ hx).1.continuousAt.continuousWithinAt
  have hm : StrictMonoOn (fun x => originalChartF x Z T h) (Set.Icc (1 / 2) 2) := by
    apply strictMonoOn_of_deriv_pos (convex_Icc (1 / 2) 2) hf
    intro x hx
    have hd := chart_bracket_derivative h₀ h₁ hZ₂ (interior_subset hx)
    rw [hd.1.deriv]
    exact lt_trans (by norm_num) hd.2.1
  have hr : originalChartF s Z T h = 0 := chart_full_source_image s η h hs₀
  exact ⟨s, ⟨hs, hr⟩, fun x hx => hm.injOn hx.1 hs (hx.2.trans hr.symm)⟩

#print axioms chart_bracket_derivative
#print axioms chart_source_image_exists_unique
end
end MathScope.M3.CD
