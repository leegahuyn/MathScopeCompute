import MathScope.M0.Analytic

/-!
Explicit USER_AXIOM demonstration, deliberately isolated from Finite and
Analytic import paths.  The selected spectrum is an uninterpreted object.
It is not defined to be the spectrum of a quantum Yang--Mills Hamiltonian.
The selected bound is 1 in a fixed, declared energy unit; the source changes
when that assumption changes.
-/

namespace MathScope.M0.Conditional

open MathScope.M0.Analytic

axiom selectedSpectrum : Set ℝ

axiom userAssumedGapAtOne : GapAt selectedSpectrum 1

/-- Conditional consequence, with both custom dependencies printed below. -/
theorem selected_gap_excludes_interval :
    ∀ energy, 0 < energy → energy < (1 : ℝ) → energy ∉ selectedSpectrum :=
  gap_excludes_interval selectedSpectrum 1 userAssumedGapAtOne

set_option pp.fullNames true

#check selectedSpectrum
#check userAssumedGapAtOne
#check selected_gap_excludes_interval
#print axioms selected_gap_excludes_interval

end MathScope.M0.Conditional
