import Mathlib

namespace MathScope.M3.CD

section

variable {V : Type*} [SeminormedAddCommGroup V] [NormedSpace ℝ V]

/-- The norm of the regular radial expression. The average bound is the
integral estimate for the weight t^c on [0,1]. -/
theorem regularPicardRadialBound {rhs average radial : V} {c B : ℝ}
    (hc : 0 ≤ c) (hrhs : ‖rhs‖ ≤ B)
    (haverage : ‖average‖ ≤ B / (c + 1))
    (hradial : radial = rhs - c • average) :
    ‖radial‖ ≤ 2 * B := by
  have hdenom : 0 < c + 1 := by linarith
  have havg : c * (B / (c + 1)) ≤ B := by
    rw [← mul_div_assoc]
    apply (div_le_iff₀ hdenom).2
    have hB : 0 ≤ B := (norm_nonneg rhs).trans hrhs
    nlinarith
  calc
    ‖radial‖ = ‖rhs - c • average‖ := by rw [hradial]
    _ ≤ ‖rhs‖ + ‖c • average‖ := norm_sub_le _ _
    _ = ‖rhs‖ + c * ‖average‖ := by rw [norm_smul, Real.norm_eq_abs, abs_of_nonneg hc]
    _ ≤ B + c * (B / (c + 1)) := add_le_add hrhs (mul_le_mul_of_nonneg_left haverage hc)
    _ ≤ 2 * B := by linarith

/-- Transfer a bound for the preceding Picard error and its Cauchy estimate to
the first regular radial derivative. The original source coefficient row
bounds enter through the two bounds with prefactor C/2. -/
theorem actualPicardFirstRadialTail {rhs average radial : V} {c C s e eEta : ℝ}
    (hc : 0 ≤ c) (hC : 0 ≤ C) (hEta : eEta ≤ (2 / s) * e)
    (hrhs : ‖rhs‖ ≤ (C / 2) * (e + eEta))
    (haverage : ‖average‖ ≤ ((C / 2) * (e + eEta)) / (c + 1))
    (hradial : radial = rhs - c • average) :
    ‖radial‖ ≤ C * (1 + 2 / s) * e := by
  have hsum : e + eEta ≤ e + (2 / s) * e := add_le_add (le_refl e) hEta
  calc
    ‖radial‖ ≤ 2 * ((C / 2) * (e + eEta)) :=
      regularPicardRadialBound hc hrhs haverage hradial
    _ ≤ 2 * ((C / 2) * (e + (2 / s) * e)) :=
      mul_le_mul_of_nonneg_left
        (mul_le_mul_of_nonneg_left hsum (by linarith)) (by norm_num)
    _ = C * (1 + 2 / s) * e := by ring

#print axioms regularPicardRadialBound
#print axioms actualPicardFirstRadialTail

end

end MathScope.M3.CD
