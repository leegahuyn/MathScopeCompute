import MathScope.M4.Analytic

namespace MathScope.M4.Conditional
open MathScope.M4

/-- Named user axiom for the audit rejection demonstration ONLY. -/
axiom assumedComplete (X : Type) (m : PrecisionMetric X) : Complete m
theorem assumed_cauchy_limit {X : Type} (m : PrecisionMetric X)
    (u : Nat → X) (hCauchy : Cauchy m u) : ∃ x, Converges m u x :=
  assumedComplete X m u hCauchy
set_option pp.fullNames true
#check assumed_cauchy_limit
#print axioms assumed_cauchy_limit
end MathScope.M4.Conditional
