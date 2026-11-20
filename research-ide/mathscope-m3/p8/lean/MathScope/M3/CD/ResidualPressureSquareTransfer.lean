import Mathlib

namespace MathScope.M3.CD

/-- Transfer a squared-force estimate after adding a square-integrable
correction. The supplied Cauchy bound refers to the same normalization for
the two force squares and their inner product. -/
theorem residual_force_square_transfer
    {full base error cross δ : ℝ}
    (hbase : 0 ≤ base) (herr : 0 ≤ error) (hδ : 0 < δ)
    (hcauchy : cross^2 ≤ base * error)
    (hdiff : full - base = 2 * cross + error) :
    |full - base| ≤ δ * base + (1 + 1 / δ) * error := by
  let budget : ℝ := δ * base + error / δ
  have hbudget : 0 ≤ budget :=
    add_nonneg (mul_nonneg hδ.le hbase) (div_nonneg herr hδ.le)
  have hcancel : (δ * base) * (error / δ) = base * error := by
    field_simp [hδ.ne']
  have hsq : (2 * |cross|)^2 ≤ budget^2 := by
    dsimp [budget]
    have habs : |cross|^2 = cross^2 := sq_abs cross
    nlinarith only [hcauchy, habs, hcancel, sq_nonneg (δ * base - error / δ)]
  have hcross : 2 * |cross| ≤ budget := by
    by_contra! h
    have hsum : 0 < 2 * |cross| + budget := by linarith
    have hprod := mul_pos (sub_pos.mpr h) hsum
    nlinarith only [hprod, hsq]
  calc
    |full - base| = |2 * cross + error| := by rw [hdiff]
    _ ≤ |2 * cross| + |error| := abs_add_le _ _
    _ = 2 * |cross| + error := by rw [abs_mul, abs_of_nonneg (by norm_num : 0 ≤ (2 : ℝ)), abs_of_nonneg herr]
    _ ≤ budget + error := by linarith only [hcross]
    _ = δ * base + (1 + 1 / δ) * error := by dsimp [budget]; ring

set_option exponentiation.threshold 2048 in
set_option maxRecDepth 4096 in
/-- The dyadic pressure-error allowance in the selected N3 paths. -/
theorem residual_force_square_pressure_allowance
    {full base error cross reference : ℝ}
    (hbase : 0 ≤ base) (herr : 0 ≤ error) (href : 0 < reference)
    (hsmall : error < (1 / 2^1024) * reference)
    (hcauchy : cross^2 ≤ base * error)
    (hdiff : full - base = 2 * cross + error) :
    |full - base| < (1 / 2^256) * base + (1 / 2^767) * reference := by
  let δ : ℝ := 1 / 2^256
  have hδ : 0 < δ := by dsimp [δ]; norm_num
  have hcoef : 0 < 1 + 1 / δ := by positivity
  have hdyadic : (1 + 1 / δ) * (1 / 2^1024) < 1 / 2^767 := by
    dsimp [δ]
    norm_num
  have herror : (1 + 1 / δ) * error < (1 / 2^767) * reference := calc
    (1 + 1 / δ) * error < (1 + 1 / δ) * ((1 / 2^1024) * reference) :=
      mul_lt_mul_of_pos_left hsmall hcoef
    _ = ((1 + 1 / δ) * (1 / 2^1024)) * reference := (mul_assoc _ _ _).symm
    _ < (1 / 2^767) * reference := mul_lt_mul_of_pos_right hdyadic href
  calc
    |full - base| ≤ δ * base + (1 + 1 / δ) * error :=
      residual_force_square_transfer hbase herr hδ hcauchy hdiff
    _ < (1 / 2^256) * base + (1 / 2^767) * reference := by
      change δ * base + (1 + 1 / δ) * error < δ * base + (1 / 2^767) * reference
      linarith only [herror]

#print axioms residual_force_square_transfer
#print axioms residual_force_square_pressure_allowance

/-- The original exterior pressure cancels the homogeneous radial acceleration.
After localizing both fields, a single factor of the temporal cutoff remains. -/
theorem exterior_localized_radial_force
    {cut K r pressureR : ℝ} (hPressure : pressureR = K ^ 2 / r) :
    cut * pressureR - (cut * K) ^ 2 / r =
      cut * (1 - cut) * K ^ 2 / r := by
  rw [hPressure]
  ring

/-- The original time variable is tau = 1 - t, so the transition force
contains the negative physical time derivative of the cutoff profile. -/
theorem exterior_localized_swirl_time_derivative
    (cut K : ℝ → ℝ) {t tau₀ cutR Kt : ℝ}
    (hCut : HasDerivAt cut cutR ((1 - t) / tau₀))
    (hK : HasDerivAt K Kt t) :
    HasDerivAt (fun s => cut ((1 - s) / tau₀) * K s)
      (cut ((1 - t) / tau₀) * Kt - cutR * K t / tau₀) t := by
  have hReverse : HasDerivAt (fun s : ℝ => 1 - s) (-1) t := by
    simpa using (hasDerivAt_const t (1 : ℝ)).sub (hasDerivAt_id t)
  convert (hCut.comp t (hReverse.div_const tau₀)).mul hK using 1 <;> ring

#print axioms exterior_localized_radial_force
#print axioms exterior_localized_swirl_time_derivative

end MathScope.M3.CD
