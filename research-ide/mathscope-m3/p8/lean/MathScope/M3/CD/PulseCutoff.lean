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

/-- For Q=2^(-ell) and S=ell^2, an explicit band threshold absorbs
Q^(-M) S^P exp(-c S) into Q^N. The actual uniform coefficient estimate is
the input to this inequality. -/
theorem gaussian_dyadic_flat {ell c M N P : ℝ}
    (hell : 1 ≤ ell) (hP : 0 ≤ P)
    (hthreshold : (M + N) * Real.log 2 + 2 * P ≤ c * ell) :
    Real.exp ((M * Real.log 2) * ell + 2 * P * Real.log ell - c * ell ^ 2) ≤
      Real.exp (-(N * Real.log 2) * ell) := by
  have hpos : 0 < ell := by linarith
  have hlog : Real.log ell ≤ ell := by
    linarith [Real.log_le_sub_one_of_pos hpos]
  have hp := mul_le_mul_of_nonneg_left hlog (show 0 ≤ 2 * P by positivity)
  have hs := mul_le_mul_of_nonneg_right hthreshold hpos.le
  apply Real.exp_le_exp.mpr
  nlinarith

/-- Two translated closed coordinate intervals stay disjoint when the
center gap exceeds the sum of the two allowed displacements. -/
theorem strict_gap_excludes_overlap {x y u v r s : ℝ}
    (hgap : r + s < |x - y|) (hu : |u| ≤ r) (hv : |v| ≤ s) :
    x + u ≠ y + v := by
  intro h
  obtain ⟨hul, huu⟩ := abs_le.mp hu
  obtain ⟨hvl, hvu⟩ := abs_le.mp hv
  have bound : |x - y| ≤ r + s := abs_le.mpr ⟨by linarith, by linarith⟩
  exact (not_lt_of_ge bound) hgap

#print axioms forced_principal_cutoff_terms
#print axioms pulse_cutoff_derivative_outside_transitions
#print axioms gaussian_dyadic_flat
#print axioms strict_gap_excludes_overlap

end MathScope.M3.CD
