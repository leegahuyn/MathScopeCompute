import Mathlib.Basic.Real.Basic

/-!
Conditional real spectral statements.

`GapAt` is a predicate on a set of real numbers in one fixed energy unit.
Its arguments and hypotheses are explicit; this is not a construction of a
Hilbert space, a self-adjoint Hamiltonian, a quantum field theory, or a
continuum limit.  No interchange of limits, sums or derivatives is used.
-/

namespace MathScope.M0.Analytic

/-- A positive lower bound on every positive member of a real spectrum. -/
def GapAt (spectrum : Set ℝ) (delta : ℝ) : Prop :=
  0 < delta ∧ ∀ energy ∈ spectrum, 0 < energy → delta ≤ energy

/-- A supplied gap excludes all positive energies strictly below it. -/
theorem gap_excludes_interval (spectrum : Set ℝ) (delta : ℝ)
    (hGap : GapAt spectrum delta) :
    ∀ energy, 0 < energy → energy < delta → energy ∉ spectrum := by
  intro energy hPositive hBelow hMember
  exact (not_lt_of_ge (hGap.2 energy hMember hPositive)) hBelow

/-- The same spectrum retains every smaller positive certified lower bound. -/
theorem smaller_positive_gap (spectrum : Set ℝ) (delta epsilon : ℝ)
    (hGap : GapAt spectrum delta) (hPositive : 0 < epsilon)
    (hSmaller : epsilon ≤ delta) : GapAt spectrum epsilon := by
  refine ⟨hPositive, ?_⟩
  intro energy hMember hEnergy
  exact le_trans hSmaller (hGap.2 energy hMember hEnergy)

/-- An observed superset is sufficient; an arbitrary channel subset is not. -/
theorem gap_transfer (original observed : Set ℝ) (delta : ℝ)
    (hObserved : GapAt observed delta) (hInclusion : original ⊆ observed) :
    GapAt original delta := by
  refine ⟨hObserved.1, ?_⟩
  intro energy hOriginal hPositive
  exact hObserved.2 energy (hInclusion hOriginal) hPositive

set_option pp.fullNames true

#check gap_excludes_interval
#print axioms gap_excludes_interval
#check smaller_positive_gap
#print axioms smaller_positive_gap
#check gap_transfer
#print axioms gap_transfer

end MathScope.M0.Analytic
