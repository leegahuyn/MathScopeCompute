import Mathlib

namespace MathScope.M3.CD

/-- The fixed-label time derivative and the azimuthal and axial background transport
cancel the undifferentiated angular frequency. -/
theorem repeat_background_transport
    {dtPhi b nR rf nTheta g nZ p f pz epsilon v omega omegaT omegaZ : ℝ}
    (ht : dtPhi = -omega + epsilon * v * omegaT)
    (hTheta : rf * nTheta = p * f)
    (hZ : nZ = pz - epsilon * v * omegaZ)
    (hOmega : omega = p * f + pz * g) :
    dtPhi + b * nR + rf * nTheta + g * nZ =
      b * nR + epsilon * v * (omegaT - g * omegaZ) := by
  rw [ht, hTheta, hZ, hOmega]
  ring

/-- Combine the original baseline and mean-increment exponents at the fixed-label
point. The logarithmic hypothesis records the available factor of two. -/
theorem repeat_transport_epsilon_bound
    {epsilon baseline increment : ℝ}
    (hEpsilon : 0 < epsilon) (hUnit : epsilon ≤ 1)
    (hDebit : Real.log 2 ≤ -(Real.log epsilon) / 100000)
    (hBaseline : |baseline| ≤ epsilon ^ (49999 / 100000 : ℝ))
    (hIncrement : |increment| ≤ epsilon ^ (39994 / 100000 : ℝ)) :
    |baseline + increment| ≤ epsilon ^ (39993 / 100000 : ℝ) := by
  have hTwo : (2 : ℝ) ≤ epsilon ^ (-(1 / 100000) : ℝ) := by
    rw [Real.rpow_def_of_pos hEpsilon]
    calc
      (2 : ℝ) = Real.exp (Real.log 2) := (Real.exp_log (by norm_num)).symm
      _ ≤ _ := Real.exp_le_exp.mpr (by linarith)
  have hPower : epsilon ^ (49999 / 100000 : ℝ) ≤ epsilon ^ (39994 / 100000 : ℝ) :=
    Real.rpow_le_rpow_of_exponent_ge hEpsilon hUnit (by norm_num)
  calc
    |baseline + increment| ≤ |baseline| + |increment| := abs_add_le _ _
    _ ≤ epsilon ^ (49999 / 100000 : ℝ) + epsilon ^ (39994 / 100000 : ℝ) :=
      add_le_add hBaseline hIncrement
    _ ≤ epsilon ^ (39994 / 100000 : ℝ) + epsilon ^ (39994 / 100000 : ℝ) :=
      add_le_add hPower (le_refl _)
    _ = 2 * epsilon ^ (39994 / 100000 : ℝ) := by ring
    _ ≤ epsilon ^ (-(1 / 100000) : ℝ) * epsilon ^ (39994 / 100000 : ℝ) :=
      mul_le_mul_of_nonneg_right hTwo (Real.rpow_nonneg hEpsilon.le _)
    _ = epsilon ^ (39993 / 100000 : ℝ) := by
      rw [← Real.rpow_add hEpsilon]
      congr 1
      norm_num

#print axioms repeat_background_transport
#print axioms repeat_transport_epsilon_bound

end MathScope.M3.CD
