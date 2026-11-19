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

#print axioms primary_wave_log_allowance
#print axioms initialized_energy_of_three_component_bounds

end MathScope.M3.CD
