import MathScope.M4.Defs

namespace MathScope.M4.Analytic
open MathScope.M4

/-- A genuine uniform-limit theorem for the explicit precision balls.
Each approximant is uniformly continuous; uniform convergence supplies one
N for all x. The proof derives a new continuity modulus using triangle twice.
No derivative/sum interchange, completeness or continuum physics is used. -/
theorem uniform_limit_uniformly_continuous {X Y : Type}
    (mx : PrecisionMetric X) (my : PrecisionMetric Y)
    (u : Nat → X → Y) (f : X → Y)
    (hUniform : UniformConverges my u f)
    (hContinuous : ∀ n, UniformContinuous mx my (u n)) :
    UniformContinuous mx my f := by
  intro k
  obtain ⟨N, hN⟩ := hUniform (k+2)
  obtain ⟨l, hl⟩ := hContinuous N (k+2)
  refine ⟨l, ?_⟩
  intro x y hxy
  have hfx := my.symmetric (k+2) (u N x) (f x) (hN N (Nat.le_refl N) x)
  have hmid := hl x y hxy
  have hfy := hN N (Nat.le_refl N) y
  have hleft := my.triangle (k+1) (f x) (u N x) (u N y) hfx hmid
  exact my.triangle k (f x) (u N y) (f y) hleft (my.finer (k+1) (u N y) (f y) hfy)

set_option pp.fullNames true
#check uniform_limit_uniformly_continuous
#print axioms uniform_limit_uniformly_continuous
end MathScope.M4.Analytic
