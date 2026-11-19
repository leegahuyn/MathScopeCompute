import Mathlib

namespace MathScope.M3.CD

/-- The common-band size controls the propagator's logarithmic charge. -/
theorem first_forced_propagator_charge {B H L : ℝ}
    (hB : (2 : ℝ) ^ 128 ≤ B) (hH : B ^ 511 ≤ 2 * H)
    (hL : L ≤ 1) : 3 * B ^ 256 * L ≤ H / (2 : ℝ) ^ 128 := by
  have hb : 0 ≤ B := le_trans (by positivity) hB
  have h1 : 1 ≤ B := le_trans (by norm_num) hB
  have hrest : 1 ≤ B ^ 253 := one_le_pow₀ h1
  have hsquare : ((2 : ℝ) ^ 128) ^ 2 ≤ B ^ 2 :=
    pow_le_pow_left₀ (by positivity) hB 2
  have hhigh : 6 * (2 : ℝ) ^ 128 ≤ B ^ 255 := by
    calc
      6 * (2 : ℝ) ^ 128 ≤ ((2 : ℝ) ^ 128) ^ 2 := by norm_num
      _ ≤ B ^ 2 := hsquare
      _ = B ^ 2 * 1 := by ring
      _ ≤ B ^ 2 * B ^ 253 :=
        mul_le_mul_of_nonneg_left hrest (pow_nonneg hb 2)
      _ = B ^ 255 := by rw [← pow_add]
  have hscale := mul_le_mul_of_nonneg_right hhigh (pow_nonneg hb 256)
  have hlarge : 6 * (2 : ℝ) ^ 128 * B ^ 256 ≤ 2 * H := by
    calc
      _ ≤ B ^ 255 * B ^ 256 := hscale
      _ = B ^ 511 := by rw [← pow_add]
      _ ≤ 2 * H := hH
  calc
    3 * B ^ 256 * L ≤ 3 * B ^ 256 * 1 :=
      mul_le_mul_of_nonneg_left hL (by positivity)
    _ ≤ H / (2 : ℝ) ^ 128 := by
      apply (le_div_iff₀ (by positivity : (0 : ℝ) < 2 ^ 128)).2
      linarith only [hlarge, show (3 * B ^ 256 * 1) * (2 : ℝ) ^ 128 =
        (6 * (2 : ℝ) ^ 128 * B ^ 256) / 2 by ring]

/-- A finite product certificate with five independent logarithmic input
    budgets. The checked coefficient degrees are inserted externally. -/
theorem first_forced_combined_log_charge
    {H a b c d e aL bL cL dL eL : ℝ} (hH : 0 ≤ H)
    (ha : 0 ≤ a ∧ a ≤ (2 : ℝ) ^ 16)
    (hb : 0 ≤ b ∧ b ≤ (2 : ℝ) ^ 16)
    (hc : 0 ≤ c ∧ c ≤ (2 : ℝ) ^ 16)
    (hd : 0 ≤ d ∧ d ≤ (2 : ℝ) ^ 16)
    (he : 0 ≤ e ∧ e ≤ (2 : ℝ) ^ 16)
    (haL : aL ≤ H / (2 : ℝ) ^ 128) (hbL : bL ≤ H / (2 : ℝ) ^ 128)
    (hcL : cL ≤ H / (2 : ℝ) ^ 128) (hdL : dL ≤ H / (2 : ℝ) ^ 128)
    (heL : eL ≤ H / (2 : ℝ) ^ 128) :
    a * aL + b * bL + c * cL + d * dL + e * eL ≤ H / (2 : ℝ) ^ 109 := by
  have hcap : 0 ≤ H / (2 : ℝ) ^ 128 := by positivity
  have cost (x y : ℝ) (hx : 0 ≤ x ∧ x ≤ (2 : ℝ) ^ 16)
      (hy : y ≤ H / (2 : ℝ) ^ 128) : x * y ≤ (2 : ℝ) ^ 16 * (H / 2 ^ 128) :=
    (mul_le_mul_of_nonneg_left hy hx.1).trans (mul_le_mul_of_nonneg_right hx.2 hcap)
  have ca := cost a aL ha haL
  have cb := cost b bL hb hbL
  have cc := cost c cL hc hcL
  have cd := cost d dL hd hdL
  have ce := cost e eL he heL
  norm_num at ca cb cc cd ce ⊢
  linarith

#print axioms first_forced_propagator_charge
#print axioms first_forced_combined_log_charge

end MathScope.M3.CD
