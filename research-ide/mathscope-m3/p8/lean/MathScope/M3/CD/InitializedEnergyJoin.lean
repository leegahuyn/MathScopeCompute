import Mathlib

namespace MathScope.M3.CD

/-- The exact degree bounds leave room for the fixed source coefficient. -/
theorem primary_wave_log_allowance {L stability fast coefficient : ℝ}
    (hL : 0 ≤ L) (hStability : stability ≤ L / (2 : ℝ) ^ 33)
    (hFast : fast ≤ 1 + L / 100000)
    (hCoefficient : coefficient + 2 ≤ L / 16) :
    coefficient + 34 * stability + 2 * fast ≤ L / 8 := by
  norm_num at hStability
  linarith only [hL, hStability, hFast, hCoefficient]

private theorem less_of_square_less {a b : ℝ}
    (h : a ^ 2 < b ^ 2) (hb : 0 < b) : a < b := by
  by_contra! hba
  have hsum : 0 ≤ a + b := by linarith
  have hproduct := mul_nonneg (sub_nonneg.mpr hba) hsum
  nlinarith only [hproduct, h]

/-- The budgets combine by triangle alone. `scale^2` is the common positive
force scale and the energies are squares of the same physical norm. -/
theorem initialized_energy_of_three_component_bounds
    {scale mean slow wave initial : ℝ}
    (hScale : 0 < scale) (hInitial : 0 ≤ initial)
    (hTriangle : initial ≤ mean + slow + wave)
    (hMean : mean ^ 2 < scale ^ 2 / (2 : ℝ) ^ 32)
    (hSlow : slow ^ 2 < scale ^ 2 / (2 : ℝ) ^ 28)
    (hWave : wave ^ 2 < scale ^ 2 / (2 : ℝ) ^ 32) :
    initial ^ 2 < 9 * scale ^ 2 / (2 : ℝ) ^ 30 ∧
      9 * scale ^ 2 / (2 : ℝ) ^ 30 < scale ^ 2 / (2 : ℝ) ^ 26 := by
  norm_num at hMean hSlow hWave ⊢
  have hm : mean < scale / 65536 := by
    apply less_of_square_less
    · nlinarith only [hMean]
    · positivity
  have hs : slow < scale / 16384 := by
    apply less_of_square_less
    · nlinarith only [hSlow]
    · positivity
  have hw : wave < scale / 65536 := by
    apply less_of_square_less
    · nlinarith only [hWave]
    · positivity
  have hnorm : initial < 3 * scale / 32768 := by linarith
  have hsum : 0 < 3 * scale / 32768 + initial := by linarith
  have hproduct := mul_pos (sub_pos.mpr hnorm) hsum
  have hscaleSquare : 0 < scale ^ 2 := by positivity
  constructor
  · nlinarith only [hproduct]
  · nlinarith only [hscaleSquare]

/-- Apply the original cutoff-before-curl operator to the three additive
pieces of the first correction, then use its common force-scaled norm. -/
theorem first_correction_energy_of_three_slice_bounds
    {scale forced signed late total : ℝ}
    (hScale : 0 < scale) (hTotal : 0 ≤ total)
    (hTriangle : total ≤ forced + signed + late)
    (hForced : forced ^ 2 < scale ^ 2 / (2 : ℝ) ^ 30)
    (hSigned : signed ^ 2 < scale ^ 2 / (2 : ℝ) ^ 32)
    (hLate : late ^ 2 < scale ^ 2 / (2 : ℝ) ^ 32) :
    total ^ 2 < scale ^ 2 / (2 : ℝ) ^ 28 ∧
      scale ^ 2 / (2 : ℝ) ^ 28 < scale ^ 2 / (2 : ℝ) ^ 26 := by
  have hPiece {x : ℝ} (hx : x ^ 2 < scale ^ 2 / (2 : ℝ) ^ 32) :
      x < scale / 65536 := by
    apply less_of_square_less
    · norm_num at hx ⊢
      nlinarith only [hx]
    · positivity
  have hWholeForced : forced < scale / 32768 := by
    apply less_of_square_less
    · norm_num at hForced ⊢
      nlinarith only [hForced]
    · positivity
  have hSum : total < scale / 16384 :=
    by linarith [hWholeForced, hPiece hSigned, hPiece hLate]
  have hPositive : 0 < scale / 16384 + total := by linarith
  have hSquares := mul_pos (sub_pos.mpr hSum) hPositive
  have hScaleSquared : 0 < scale ^ 2 := by positivity
  constructor
  · norm_num
    nlinarith only [hSquares]
  · norm_num
    nlinarith only [hScaleSquared]

#print axioms first_correction_energy_of_three_slice_bounds

/-- Orthogonality on each angular slice bounds the sum of the supremum
kinetic energy and the integrated dissipation. The separate time suprema
can occur at different times, so the combination only uses an inequality. -/
theorem first_correction_energy_with_angular_split
    {scale forced signed late wave total : ℝ}
    (hScale : 0 < scale) (hWave : 0 ≤ wave)
    (hWaveTriangle : wave ≤ forced + signed)
    (hSplit : total ^ 2 ≤ wave ^ 2 + late ^ 2)
    (hForced : forced ^ 2 < scale ^ 2 / (2 : ℝ) ^ 30)
    (hSigned : signed ^ 2 < scale ^ 2 / (2 : ℝ) ^ 32)
    (hLate : late ^ 2 < scale ^ 2 / (2 : ℝ) ^ 32) :
    total ^ 2 < 5 * scale ^ 2 / (2 : ℝ) ^ 31 := by
  have hForcedNorm : forced < scale / 32768 := by
    apply less_of_square_less
    · norm_num at hForced ⊢
      nlinarith only [hForced]
    · positivity
  have hSignedNorm : signed < scale / 65536 := by
    apply less_of_square_less
    · norm_num at hSigned ⊢
      nlinarith only [hSigned]
    · positivity
  have hWaveNorm : wave < 3 * scale / 65536 := by
    linarith only [hWaveTriangle, hForcedNorm, hSignedNorm]
  have hPositive : 0 < 3 * scale / 65536 + wave := by
    linarith only [hScale, hWave]
  have hWaveSquare :=
    mul_pos (sub_pos.mpr hWaveNorm) hPositive
  norm_num at hLate ⊢
  nlinarith only [hWaveSquare, hLate, hSplit]

#print axioms first_correction_energy_with_angular_split
#print axioms primary_wave_log_allowance
#print axioms initialized_energy_of_three_component_bounds

end MathScope.M3.CD
