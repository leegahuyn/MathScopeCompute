import Mathlib

/-!
Bounds for the nested averages that remove apparent singularities in even radial jets.
The analytic identification of these averages with the actual source derivatives is
a separate input. Every radius in this file can be zero.
-/

open MeasureTheory

namespace MathScope.M3.CD

theorem weightedEvenAxisAverageBound
    (f : ℝ → ℝ) (B : ℝ) (d : ℕ)
    (hbound : ∀ t ∈ Set.Ioc (0 : ℝ) 1, |f t| ≤ B) :
    |(1 / 2 : ℝ) * (∫ t in (0 : ℝ)..1, t ^ d * f t)| ≤ B / (2 * ((d : ℝ) + 1)) := by
  have hint : IntervalIntegrable (fun t : ℝ => t ^ d * B) volume 0 1 :=
    ((continuous_id.pow d).mul continuous_const).intervalIntegrable 0 1
  have hnorm := intervalIntegral.norm_integral_le_of_norm_le
    (a := (0 : ℝ)) (b := (1 : ℝ)) (f := fun t => t ^ d * f t)
    (g := fun t => t ^ d * B) (by norm_num)
    (Filter.Eventually.of_forall (fun t ht => by
      have htPow : 0 ≤ t ^ d := pow_nonneg ht.1.le d
      rw [Real.norm_eq_abs, abs_mul, abs_of_nonneg htPow]
      exact mul_le_mul_of_nonneg_left (hbound t ht) htPow)) hint
  have hpow : (∫ t in (0 : ℝ)..1, t ^ d) = 1 / ((d : ℝ) + 1) := by
    rw [integral_pow]
    simp
  rw [intervalIntegral.integral_mul_const, hpow, Real.norm_eq_abs] at hnorm
  calc
    |(1 / 2 : ℝ) * (∫ t in (0 : ℝ)..1, t ^ d * f t)| =
        (1 / 2 : ℝ) * |∫ t in (0 : ℝ)..1, t ^ d * f t| := by
          rw [abs_mul, abs_of_nonneg (by norm_num : 0 ≤ (1 / 2 : ℝ))]
    _ ≤ (1 / 2 : ℝ) * (1 / ((d : ℝ) + 1) * B) :=
      mul_le_mul_of_nonneg_left hnorm (by norm_num)
    _ = B / (2 * ((d : ℝ) + 1)) := by
      have hd : (d : ℝ) + 1 ≠ 0 := by positivity
      field_simp
      <;> ring

noncomputable def evenAxisJetFactor (m : ℕ) : ℝ :=
  (m.factorial : ℝ) / ((2 * m).factorial : ℝ)

theorem evenAxisJetFactor_succ (m : ℕ) :
    evenAxisJetFactor (m + 1) = evenAxisJetFactor m / (2 * (2 * (m : ℝ) + 1)) := by
  unfold evenAxisJetFactor
  have hidx : 2 * (m + 1) = (2 * m + 1) + 1 := by omega
  rw [hidx, Nat.factorial_succ m, Nat.factorial_succ (2 * m + 1), Nat.factorial_succ (2 * m)]
  push_cast
  have hfac : (0 : ℝ) < ((2 * m).factorial : ℝ) := by exact_mod_cast Nat.factorial_pos (2 * m)
  have hm : 0 < (m : ℝ) + 1 := by positivity
  have hodd : 0 < 2 * (m : ℝ) + 1 := by positivity
  have heven : 0 < 2 * (m : ℝ) + 1 + 1 := by positivity
  field_simp
  <;> ring

noncomputable def higherEvenAxisAverage : ℕ → (ℝ → ℝ) → ℝ → ℝ
  | 0, f, r => f r
  | m + 1, f, r =>
      (1 / 2 : ℝ) * (∫ t in (0 : ℝ)..1, t ^ (2 * m) * higherEvenAxisAverage m f (t * r))

/-- The axis jet transfer has sharp total weight m!/(2m)!. -/
theorem higherEvenAxisAverageBound
    (f : ℝ → ℝ) (R B : ℝ) (m : ℕ)
    (hbound : ∀ r ∈ Set.Icc (0 : ℝ) R, |f r| ≤ B)
    (r : ℝ) (hr : r ∈ Set.Icc (0 : ℝ) R) :
    |higherEvenAxisAverage m f r| ≤ evenAxisJetFactor m * B := by
  induction m generalizing r with
  | zero =>
      simpa [higherEvenAxisAverage, evenAxisJetFactor] using hbound r hr
  | succ m ih =>
      rw [higherEvenAxisAverage, evenAxisJetFactor_succ]
      have h := weightedEvenAxisAverageBound (fun t => higherEvenAxisAverage m f (t * r))
        (evenAxisJetFactor m * B) (2 * m) (fun t ht => by
          have htr : t * r ≤ r := by
            simpa only [one_mul] using mul_le_mul_of_nonneg_right ht.2 hr.1
          exact ih (t * r) ⟨mul_nonneg ht.1.le hr.1, htr.trans hr.2⟩)
      refine h.trans_eq ?_
      push_cast
      ring

#print axioms weightedEvenAxisAverageBound
#print axioms evenAxisJetFactor_succ
#print axioms higherEvenAxisAverageBound

end MathScope.M3.CD
