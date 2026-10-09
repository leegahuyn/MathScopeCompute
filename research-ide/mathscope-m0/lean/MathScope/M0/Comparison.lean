import MathScope.M0.Analytic

/-!
An explicit local adapter theorem with its necessary inclusion hypothesis.
Prismatic comparison, global trace formulas, BSD and the attached PDE paper
remain THEOREM REFERENCE until exact exported Lean statements are imported
and their adapter obligations are proved.  A URL is not such an adapter.
-/

namespace MathScope.M0.Comparison

open MathScope.M0.Analytic

structure SpectrumComparison (original observed : Set ℝ) where
  inclusion : original ⊆ observed

theorem transport_gap (original observed : Set ℝ) (delta : ℝ)
    (comparison : SpectrumComparison original observed)
    (hObserved : GapAt observed delta) : GapAt original delta :=
  gap_transfer original observed delta hObserved comparison.inclusion

set_option pp.fullNames true

#check transport_gap
#print axioms transport_gap

end MathScope.M0.Comparison
