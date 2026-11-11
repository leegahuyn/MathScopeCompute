import MathScope.M4.Analytic

namespace MathScope.M4.Comparison
open MathScope.M4

/-- A concrete exported Lean theorem adapter, with its exact premises.
External prism/trace/BSD/NS literature is never promoted by this adapter. -/
theorem uniform_continuity_adapter {X Y : Type}
    (mx : PrecisionMetric X) (my : PrecisionMetric Y)
    (u : Nat → X → Y) (f : X → Y)
    (hUniform : UniformConverges my u f)
    (hContinuous : ∀ n, UniformContinuous mx my (u n)) :
    UniformContinuous mx my f :=
  MathScope.M4.Analytic.uniform_limit_uniformly_continuous mx my u f hUniform hContinuous
set_option pp.fullNames true
#check uniform_continuity_adapter
#print axioms uniform_continuity_adapter
end MathScope.M4.Comparison
