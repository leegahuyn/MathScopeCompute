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
end
end MathScope.M3.CD
