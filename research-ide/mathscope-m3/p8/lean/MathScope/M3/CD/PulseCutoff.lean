import Mathlib

namespace MathScope.M3.CD

/-- The two exact terms left by multiplication of the principal forced
equation by a scalar cutoff. The four inputs are the original derivative,
linear term, force and pressure, before multiplication by the cutoff. -/
theorem forced_principal_cutoff_terms
    (ψ dψ t dt linear force pressure : ℂ)
    (principal : dt + linear + force + pressure = 0) :
    (dψ * t + ψ * dt) + ψ * linear + force + ψ * pressure =
      (1 - ψ) * force + dψ * t := by
  calc
    (dψ * t + ψ * dt) + ψ * linear + force + ψ * pressure =
        ψ * (dt + linear + force + pressure) + (1 - ψ) * force + dψ * t := by
          ring
    _ = (1 - ψ) * force + dψ * t := by rw [principal, mul_zero, zero_add]

/-- For the original pair of step arguments the derivative of the
longitudinal cutoff vanishes outside the two open transition intervals.
The hypothesis is the flat endpoint rule for the source step derivative. -/
theorem pulse_cutoff_derivative_outside_transitions
    (step dstep : ℝ → ℝ) {v L : ℝ} (hL : 0 < L)
    (hflat : ∀ x : ℝ, x ≤ 0 ∨ 1 ≤ x → dstep x = 0)
    (hfirst : v ≤ L / 5 ∨ L / 4 ≤ v)
    (hsecond : v ≤ 3 * L / 4 ∨ 4 * L / 5 ≤ v) :
    20 / L * (dstep (20 * v / L - 4) * step (16 - 20 * v / L) -
      step (20 * v / L - 4) * dstep (16 - 20 * v / L)) = 0 := by
  have ha : dstep (20 * v / L - 4) = 0 := by
    apply hflat
    rcases hfirst with h | h
    · left
      have bound : 20 * v / L ≤ 4 := (div_le_iff₀ hL).2 (by linarith)
      linarith
    · right
      have bound : 5 ≤ 20 * v / L := (le_div_iff₀ hL).2 (by linarith)
      linarith
  have hb : dstep (16 - 20 * v / L) = 0 := by
    apply hflat
    rcases hsecond with h | h
    · right
      have bound : 20 * v / L ≤ 15 := (div_le_iff₀ hL).2 (by linarith)
      linarith
    · left
      have bound : 16 ≤ 20 * v / L := (le_div_iff₀ hL).2 (by linarith)
      linarith
  rw [ha, hb]
  ring

#print axioms forced_principal_cutoff_terms
#print axioms pulse_cutoff_derivative_outside_transitions

end MathScope.M3.CD
