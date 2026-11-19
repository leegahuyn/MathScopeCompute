import Mathlib

namespace MathScope.M3.CD

/-- The first and second axial derivatives of the product cutoff give
the per-component velocity and gradient coefficients before rescaling. -/
theorem correction_cutoff_component_constants :
    (20 : ℕ) + 2 * 20 = 60 ∧
    (732 : ℕ) + 2 * 20 * 20 * 2 + 692 * 4 = 5100 ∧
    (2 : ℕ) + 60 + 1 = 63 ∧
    (2 : ℕ) + 2 * 60 + 5100 + 60 + 1 + 60 = 5343 ∧
    (96 : ℕ) * (3 * (4 * 63)^2 + 18 * (4 * 5343)^2) < 2^40 := by
  norm_num

/-- The common amplitude condition is sufficient in the positive
logarithmic scale of the original force ratio. -/
theorem correction_energy_log_gate
    {stageLoss logTwo logX logK logRatio : ℝ}
    (hAmplitude : logK ≤ stageLoss - 2 * logX - 33 * logTwo)
    (hRatio : logRatio ≤ 40 * logTwo + 4 * logX + 2 * logK - 2 * stageLoss) :
    logRatio ≤ -26 * logTwo := by
  linarith

/-- Using uncut velocity and only first-order gauge bounds retains the
extra cutoff powers. Here `d = τ₀^h`, `s = √d` and the four inequalities
give separate positive caps for the uncut velocity and the potential. -/
theorem correction_commutator_caps
    {d s U0 U1 A0 A1 velocity gradient cap : ℝ}
    (hs : 0 ≤ s) (hsEq : s^2 = d) (hd : 120 * d ≤ 1)
    (hU0 : 0 ≤ U0) (hA0 : 0 ≤ A0)
    (hVelocity : velocity ≤ U0 + 120 * (d * s) * A0)
    (hGradient : gradient ≤ U1 + 120 * (d * s) * (U0 + A1) + 10200 * (d * s)^2 * A0)
    (hu0 : s * U0 ≤ cap / 4) (hu1 : U1 ≤ cap / 4)
    (ha0 : 480 * d^2 * A0 ≤ cap) (ha1 : 480 * (d * s) * A1 ≤ cap) :
    s * velocity ≤ cap / 2 ∧ gradient ≤ cap := by
  have hpotentialVelocity : s * (120 * (d * s) * A0) = 120 * d^2 * A0 := by
    calc
      _ = 120 * d * s^2 * A0 := by ring
      _ = _ := by rw [hsEq]; ring
  have hcutVelocity := mul_le_mul_of_nonneg_left hVelocity hs
  rw [mul_add, hpotentialVelocity] at hcutVelocity
  have hcutUncut : 120 * (d * s) * U0 ≤ s * U0 := by
    calc
      _ = (120 * d) * (s * U0) := by ring
      _ ≤ 1 * (s * U0) := mul_le_mul_of_nonneg_right hd (mul_nonneg hs hU0)
      _ = _ := one_mul _
  have hsmall : 10200 * d ≤ 120 := by linarith only [hd]
  have hcutPotential : 10200 * (d * s)^2 * A0 ≤ cap / 4 := by
    have hnonneg := mul_nonneg (sq_nonneg d) hA0
    calc
      _ = 10200 * d^2 * s^2 * A0 := by ring
      _ = (10200 * d) * (d^2 * A0) := by rw [hsEq]; ring
      _ ≤ 120 * (d^2 * A0) := mul_le_mul_of_nonneg_right hsmall hnonneg
      _ ≤ _ := by linarith only [ha0]
  constructor
  · linarith only [hcutVelocity, hu0, ha0]
  · rw [mul_add] at hGradient
    linarith only [hGradient, hcutUncut, hcutPotential, hu0, hu1, ha1]

#print axioms correction_cutoff_component_constants
#print axioms correction_energy_log_gate
#print axioms correction_commutator_caps

end MathScope.M3.CD
