import NavierStokes.Flatness
import NavierStokes.ProblemStatement

/-! Actual import adapters to two unchanged files from the pinned external repository.
This is a component check on Lean/mathlib 4.34.1, not the repository's pinned
4.34.0-rc2 full build or the C/D Comparator theorem verification.
-/
open Filter Topology
namespace MathScope.Navier.SourceAdapter

theorem imported_flatness_fixed_loss {alpha : Type*} {l : Filter alpha}
    {q f : alpha → ℝ} (hf : NavierStokes.Flatness.PowerFlat l q f)
    (hq : ∀ᶠ x in l, q x ≠ 0) (loss : ℕ) :
    NavierStokes.Flatness.PowerFlat l q (fun x => f x / q x^loss) := by
  exact NavierStokes.Flatness.PowerFlat.div_pow hf hq loss

theorem imported_zero_velocity_negative_control :
    ¬ NavierStokes.ProblemStatement.SpeedUnboundedAtOne (fun _ => 0) := by
  exact NavierStokes.ProblemStatement.zero_velocity_not_unbounded

set_option pp.fullNames true
#check NavierStokes.ProblemStatement.navierStokesResidual
#check NavierStokes.ProblemStatement.CandidateProperties
#check imported_flatness_fixed_loss
#print axioms imported_flatness_fixed_loss
#check imported_zero_velocity_negative_control
#print axioms imported_zero_velocity_negative_control
end MathScope.Navier.SourceAdapter
