import Mathlib

namespace MathScope.M3.CD

/-- The common torus uses the palette of ell-2 with the physical reference
    scale of ell. This retains uniform two-sided inverse-band bounds. -/
theorem mean_reference_palette_window {ell Tg c shift : ℝ}
    (hell : 8 ≤ ell) (hTg : 0 < Tg)
    (hcLo : 1 / (Tg * (ell - 2) ^ 2) < c)
    (hcHi : c ≤ 1 / (ell - 2) ^ 2)
    (hsLo : 1 / 8 ≤ shift) (hsHi : shift ≤ 1 / 4) :
    1 / (8 * Tg * ell ^ 2) < c * shift ∧ c * shift ≤ 1 / ell ^ 2 := by
  have hellPos : 0 < ell := by linarith
  have hprev : 0 < ell - 2 := by linarith
  have hprevSq : 0 < (ell - 2) ^ 2 := pow_pos hprev 2
  have hellSq : 0 < ell ^ 2 := pow_pos hellPos 2
  have hc : 0 < c := (div_pos (by norm_num : (0 : ℝ) < 1)
    (mul_pos hTg hprevSq)).trans hcLo
  have hshift : 0 ≤ shift := by linarith
  have horder : (ell - 2) ^ 2 ≤ ell ^ 2 :=
    pow_le_pow_left₀ hprev.le (by linarith) 2
  have hinv : 1 / (Tg * ell ^ 2) ≤ 1 / (Tg * (ell - 2) ^ 2) :=
    div_le_div_of_nonneg_left (by norm_num) (mul_pos hTg hprevSq)
      (mul_le_mul_of_nonneg_left horder hTg.le)
  have hquarter : (1 / 4) * ell ^ 2 ≤ (ell - 2) ^ 2 := by
    calc
      (1 / 4) * ell ^ 2 = (ell / 2) ^ 2 := by ring
      _ ≤ (ell - 2) ^ 2 := pow_le_pow_left₀ (by positivity) (by linarith) 2
  constructor
  · calc
      1 / (8 * Tg * ell ^ 2) = (1 / (Tg * ell ^ 2)) / 8 := by
        field_simp [hTg.ne', hellPos.ne']
      _ < c / 8 := div_lt_div_of_pos_right (hinv.trans_lt hcLo) (by norm_num)
      _ ≤ c * shift := by
        simpa only [div_eq_mul_inv, one_mul] using mul_le_mul_of_nonneg_left hsLo hc.le
  · calc
      c * shift ≤ (1 / (ell - 2) ^ 2) * (1 / 4) :=
        mul_le_mul hcHi hsHi hshift (by positivity)
      _ ≤ 1 / ell ^ 2 := (le_div_iff₀ hellSq).2 (by
        calc
          (1 / (ell - 2) ^ 2 * (1 / 4)) * ell ^ 2 =
              ((1 / 4) * ell ^ 2) / (ell - 2) ^ 2 := by ring
          _ ≤ 1 := (div_le_iff₀ hprevSq).2 (by simpa only [one_mul] using hquarter))

#print axioms mean_reference_palette_window

end MathScope.M3.CD
