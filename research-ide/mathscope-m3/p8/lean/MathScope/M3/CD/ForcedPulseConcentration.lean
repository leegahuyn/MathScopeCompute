import Mathlib

open Set MeasureTheory

namespace MathScope.M3.CD

/-- Retain the mass of the original forcing profile at the innermost
    time in an ordered Volterra term. The other times contribute at
    most the indicated power of the pulse length. -/
theorem forced_weighted_word_bound {f p : ℝ → ℝ} {v L C J : ℝ} (k : ℕ)
    (hv : 0 ≤ v) (hvL : v ≤ L) (hC : 0 ≤ C)
    (hp : IntervalIntegrable p volume 0 v)
    (hpoint : ∀ t ∈ Ioc (0 : ℝ) v,
      0 ≤ p t ∧ ‖f t‖ ≤ C * (v - t) ^ k * p t)
    (hMass : (∫ t in (0 : ℝ)..v, p t) ≤ J) :
    ‖∫ t in (0 : ℝ)..v, f t‖ ≤ (C * L ^ k) * J := by
  have hL := hv.trans hvL
  have hbound : ∀ t ∈ Ioc (0 : ℝ) v, ‖f t‖ ≤ (C * L ^ k) * p t := by
    intro t ht
    have hpwr : (v - t) ^ k ≤ L ^ k := by
      apply pow_le_pow_left₀ (sub_nonneg.mpr ht.2) _ k
      linarith only [hvL, ht.1]
    exact (hpoint t ht).2.trans
      (mul_le_mul_of_nonneg_right (mul_le_mul_of_nonneg_left hpwr hC)
        (hpoint t ht).1)
  have hg : IntervalIntegrable (fun t => (C * L ^ k) * p t) volume 0 v :=
    hp.const_mul _
  have hnorm := intervalIntegral.norm_integral_le_of_norm_le hv
    (Filter.Eventually.of_forall hbound) hg
  rw [intervalIntegral.integral_const_mul] at hnorm
  exact hnorm.trans (mul_le_mul_of_nonneg_left hMass (mul_nonneg hC (pow_nonneg hL k)))

/-- A Gaussian mass proportional to the square root of a pulse window
    has only a half power of the dyadic band size. -/
theorem forced_pulse_sqrt_band {L Lmax S g : ℝ}
    (hLmax : 0 ≤ Lmax) (hg : 0 < g) (hL : L ≤ Lmax * S) :
    Real.sqrt (L / g) ≤ Real.sqrt (Lmax / g) * Real.sqrt S := by
  calc
    Real.sqrt (L / g) ≤ Real.sqrt ((Lmax * S) / g) :=
      Real.sqrt_le_sqrt (div_le_div_of_nonneg_right hL hg.le)
    _ = Real.sqrt ((Lmax / g) * S) := by congr 1; ring
    _ = Real.sqrt (Lmax / g) * Real.sqrt S :=
      Real.sqrt_mul (div_nonneg hLmax hg.le) S

#print axioms forced_weighted_word_bound
#print axioms forced_pulse_sqrt_band

end MathScope.M3.CD
