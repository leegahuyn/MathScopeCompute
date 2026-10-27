import Mathlib
/-! Original #622820 conditional chart facts; global source-image membership OPEN. -/
namespace MathScope.M3.CD
noncomputable section
def originalChartF (s Z T h : ℝ) : ℝ := s - Z^2 * s ^ (2*h) - T
theorem chart_axis_s_one (η h : ℝ) :
    originalChartF 1 η (1-η^2) h = 0 := by
  simp [originalChartF]
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
