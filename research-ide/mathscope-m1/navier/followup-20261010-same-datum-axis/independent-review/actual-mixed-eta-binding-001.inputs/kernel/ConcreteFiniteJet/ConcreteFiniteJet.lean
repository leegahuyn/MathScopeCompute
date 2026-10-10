import ConcreteProducer
import SelectedReferenceBoxes

/-! The finite array belongs to the literal selected infinite nonlinear
fixed point. Analytic inputs, norm estimates and the axis identity are all
supplied by ConcreteProducer, rather than left as caller assumptions. -/

noncomputable section
set_option maxHeartbeats 4000000
set_option exponentiation.threshold 2048

namespace MathScope.ConcreteFiniteJet

open Set
open MathScope.SameDatumInputs MathScope.AxisFiniteJet MathScope.SelectedReferenceBoxes
open NavierStokes.AxisCoefficientSpace NavierStokes.AxisWeightEstimates
open NavierStokes.AxisEvaluation
open scoped BigOperators Topology

theorem actual_nonlinear_coefficient_boxes (n : ℕ) (hn : n ≤ 24) :
    actualLower n ≤ coefficient axisWindow (weight rho) selectedPhiCoefficients n 0 ∧
      coefficient axisWindow (weight rho) selectedPhiCoefficients n 0 ≤ actualUpper n :=
  nonlinear_coefficient_boxes selectedPhiCoefficients Q Q_ge_two_pow
    selectedPhi_reference_error (selectedPhi_axis_coefficient zero_in_window) n hn

def actualMidpoint (n : ℕ) : ℝ := (actualLower n + actualUpper n) / 2
def actualRadius (n : ℕ) : ℝ := (actualUpper n - actualLower n) / 2
def comparisonMidpoint (n : ℕ) : ℝ := (referenceLower n + referenceUpper n) / 2
def comparisonRadius (n : ℕ) : ℝ := (referenceUpper n - referenceLower n) / 2

theorem actual_coefficient_roundoff (n : ℕ) (hn : n ≤ 24) :
    |coefficient axisWindow (weight rho) selectedPhiCoefficients n 0 - actualMidpoint n| ≤
      actualRadius n := by
  have hb := actual_nonlinear_coefficient_boxes n hn
  rw [abs_le]
  dsimp [actualMidpoint, actualRadius]
  constructor <;> linarith [hb.1, hb.2]

theorem comparison_coefficient_roundoff (n : ℕ) (hn : n ≤ 24) :
    |coefficient axisWindow (weight rho) reference n 0 - comparisonMidpoint n| ≤
      comparisonRadius n := by
  have hb := reference_actual_boxes n hn
  rw [abs_le]
  dsimp [comparisonMidpoint, comparisonRadius]
  constructor <;> linarith [hb.1, hb.2]

theorem actual_finite_roundoff (k : ℕ) (Y : ℝ) :
    ‖finiteJet axisWindow rho selectedPhiCoefficients 25 k 0 (Y, 0) -
      roundedJet actualMidpoint 25 k Y‖ ≤ roundoffBound actualRadius 25 k Y := by
  apply finite_roundoff_error
  intro n hn
  exact actual_coefficient_roundoff n (by have hlt := Finset.mem_range.mp hn; omega)

theorem actual_mixed_truncation_and_roundoff {R Y eta : ℝ}
    (hR : 1 ≤ R) (hR20 : R < 20) (N k m : ℕ)
    (hY : |Y| ≤ R) (heta : eta ∈ Ioo axisWindow.left axisWindow.right)
    (c delta : ℕ → ℝ)
    (hround : ∀ n ∈ Finset.range N,
      |iteratedDeriv m (coefficient axisWindow (weight rho) reference n) eta - c n| ≤ delta n) :
    ‖iteratedDeriv m (fun x => iteratedDeriv k (fun y => selectedPhi (y, x)) Y) eta -
      roundedJet c N k Y‖ ≤
      jetBound rho R k m * (29 / Q ^ 53) +
        tailMajorant rho ‖reference‖ R N k m + roundoffBound delta N k Y :=
  actual_derivative_truncation_and_roundoff axisWindow rho_pos hR hR20
    selectedPhiCoefficients reference selectedPhi_reference_error N k m hY heta c delta hround

theorem actual_radial_truncation_and_roundoff {R Y : ℝ}
    (hR : 1 ≤ R) (hR20 : R < 20) (k : ℕ) (hY : |Y| ≤ R) :
    ‖iteratedDeriv k (fun y => selectedPhi (y, 0)) Y -
      roundedJet comparisonMidpoint 25 k Y‖ ≤
      jetBound rho R k 0 * (29 / Q ^ 53) +
        tailMajorant rho ‖reference‖ R 25 k 0 + roundoffBound comparisonRadius 25 k Y := by
  have hb := actual_mixed_truncation_and_roundoff hR hR20 25 k 0 hY zero_in_interior
    comparisonMidpoint comparisonRadius (fun n hn => by
      simpa only [iteratedDeriv_zero] using comparison_coefficient_roundoff n
        (by have hlt := Finset.mem_range.mp hn; omega))
  simpa only [iteratedDeriv_zero] using hb

theorem selected_reference_profile (Y : ℝ) :
    profile axisWindow rho reference (Y, 0) =
      NavierStokes.AxisSeries.bessel 1 (((4000000 : ℝ) / 4000001 / 2) * Y) := by
  have he0 : coefficient axisWindow (weight rho) oneInput 0 0 = 1 := by
    simp [oneInput_coefficient 0 zero_in_window]
  rw [reference, NavierStokes.AxisReference.reference_profile_eq_series axisWindow rho_pos
    chiInput oneInput chi_radial one_radial zero_in_window he0 Y]
  rw [chiInput_coefficient 0 zero_in_window]
  simp only [ite_true, actual_chi_zero, NavierStokes.AxisSeries.profile]

theorem selected_reference_finite (Y : ℝ) :
    finiteJet axisWindow rho reference 25 0 0 (Y, 0) =
      ∑ n ∈ Finset.range 25,
        NavierStokes.AxisSeries.term 1 n (((4000000 : ℝ) / 4000001 / 2) * Y) := by
  apply Finset.sum_congr rfl
  intro n hn
  change polynomialJet n 0 Y * coefficient axisWindow (weight rho) reference n 0 = _
  rw [actual_reference_coefficient]
  simp only [polynomialJet, Nat.descFactorial_zero, Nat.cast_one, one_mul, Nat.sub_zero,
    exactReference, NavierStokes.AxisSeries.term]
  rw [← mul_div_assoc, ← mul_pow]
  congr 2
  ring

theorem selected_reference_truncation {Y : ℝ} (hY : |Y| ≤ 5) :
    ‖profile axisWindow rho reference (Y, 0) - finiteJet axisWindow rho reference 25 0 0 (Y, 0)‖ <
      1 / (2 : ℝ) ^ (120 : ℕ) := by
  rw [selected_reference_profile, selected_reference_finite]
  apply selected_reference_factorial_tail
  rw [abs_mul]
  norm_num
  nlinarith

theorem jetBound_zero_five : jetBound rho 5 0 0 = 4 / 3 := by
  simp only [jetBound, majorant, pow_zero, Nat.factorial_zero, Nat.cast_one,
    Nat.cast_zero, zero_add, mul_one, one_mul]
  rw [tsum_geometric_of_lt_one (by norm_num : (0 : ℝ) ≤ 5 / 20)
    (by norm_num : (5 / 20 : ℝ) < 1)]
  norm_num

theorem actual_profile_comparison_error {Y : ℝ} (hY : |Y| ≤ 5) :
    ‖selectedPhi (Y, 0) - profile axisWindow rho reference (Y, 0)‖ ≤
      (4 / 3 : ℝ) / (2 : ℝ) ^ (512 : ℕ) := by
  have hb := (mixedSeries_sub_bound axisWindow rho_pos (by norm_num : (1 : ℝ) ≤ 5)
    (by norm_num : (5 : ℝ) < 20) selectedPhiCoefficients reference 0 0 (p := (Y, 0)) hY).trans
    (mul_le_mul_of_nonneg_left
      (selectedPhi_reference_error.trans (sharp_error_smaller_than_rounding Q Q_ge_two_pow))
      (jetBound_nonneg rho_pos (by norm_num : (1 : ℝ) ≤ 5) 0 0))
  simpa only [mixedSeries_zero, selectedPhi, jetBound_zero_five, mul_one_div] using hb

theorem comparison_radius_upper (n : ℕ) (hn : n ≤ 24) :
    comparisonRadius n ≤ 1 / (2 : ℝ) ^ (256 : ℕ) := by
  interval_cases n <;> norm_num [comparisonRadius, referenceLower, referenceUpper]

theorem comparison_roundoff_bound {Y : ℝ} (hY : |Y| ≤ 5) :
    roundoffBound comparisonRadius 25 0 Y < 1 / (2 : ℝ) ^ (192 : ℕ) := by
  have hbound : roundoffBound comparisonRadius 25 0 Y ≤
      25 * (5 : ℝ) ^ (24 : ℕ) / (2 : ℝ) ^ (256 : ℕ) := by
    unfold roundoffBound
    calc
      _ ≤ ∑ n ∈ Finset.range 25, (5 : ℝ) ^ (24 : ℕ) * (1 / (2 : ℝ) ^ (256 : ℕ)) := by
        apply Finset.sum_le_sum
        intro n hn
        have hn24 : n ≤ 24 := by have hlt := Finset.mem_range.mp hn; omega
        have hp : |polynomialJet n 0 Y| ≤ (5 : ℝ) ^ (24 : ℕ) := by
          simp only [polynomialJet, Nat.descFactorial_zero, Nat.cast_one, one_mul, Nat.sub_zero, abs_pow]
          calc |Y| ^ n ≤ (5 : ℝ) ^ n := by gcongr
               _ ≤ _ := pow_le_pow_right₀ (by norm_num) hn24
        calc
          _ ≤ |polynomialJet n 0 Y| * (1 / (2 : ℝ) ^ (256 : ℕ)) :=
            mul_le_mul_of_nonneg_left (comparison_radius_upper n hn24) (abs_nonneg _)
          _ ≤ _ := mul_le_mul_of_nonneg_right hp (by positivity)
      _ = _ := by simp; ring
  apply hbound.trans_lt
  norm_num

/-- The actual selected nonlinear infinite profile is enclosed by a finite
25-coefficient dyadic polynomial. All three error sources are controlled:
nonlinear comparison, factorial truncation, and finite coefficient rounding. -/
theorem actual_profile_finite_enclosure {Y : ℝ} (hY : |Y| ≤ 5) :
    ‖selectedPhi (Y, 0) - roundedJet comparisonMidpoint 25 0 Y‖ <
      1 / (2 : ℝ) ^ (118 : ℕ) := by
  have ha := actual_profile_comparison_error hY
  have ht := selected_reference_truncation hY
  have hr := finite_roundoff_error axisWindow rho reference 25 0 0 (Y, 0)
    comparisonMidpoint comparisonRadius (fun n hn =>
      comparison_coefficient_roundoff n (by have hlt := Finset.mem_range.mp hn; omega))
  have hr' := hr.trans_lt (comparison_roundoff_bound hY)
  have htri1 : ‖selectedPhi (Y, 0) - roundedJet comparisonMidpoint 25 0 Y‖ ≤
      ‖selectedPhi (Y, 0) - profile axisWindow rho reference (Y, 0)‖ +
        ‖profile axisWindow rho reference (Y, 0) - roundedJet comparisonMidpoint 25 0 Y‖ := by
    simpa only [dist_eq_norm] using dist_triangle (selectedPhi (Y, 0))
      (profile axisWindow rho reference (Y, 0)) (roundedJet comparisonMidpoint 25 0 Y)
  have htri2 : ‖profile axisWindow rho reference (Y, 0) - roundedJet comparisonMidpoint 25 0 Y‖ ≤
      ‖profile axisWindow rho reference (Y, 0) - finiteJet axisWindow rho reference 25 0 0 (Y, 0)‖ +
        ‖finiteJet axisWindow rho reference 25 0 0 (Y, 0) - roundedJet comparisonMidpoint 25 0 Y‖ := by
    simpa only [dist_eq_norm] using dist_triangle (profile axisWindow rho reference (Y, 0))
      (finiteJet axisWindow rho reference 25 0 0 (Y, 0)) (roundedJet comparisonMidpoint 25 0 Y)
  have htotal : (4 / 3 : ℝ) / (2 : ℝ) ^ (512 : ℕ) +
      1 / (2 : ℝ) ^ (120 : ℕ) + 1 / (2 : ℝ) ^ (192 : ℕ) <
        1 / (2 : ℝ) ^ (118 : ℕ) := by norm_num
  linarith

end MathScope.ConcreteFiniteJet

#print axioms MathScope.ConcreteFiniteJet.actual_nonlinear_coefficient_boxes
#print axioms MathScope.ConcreteFiniteJet.actual_coefficient_roundoff
#print axioms MathScope.ConcreteFiniteJet.actual_finite_roundoff
#print axioms MathScope.ConcreteFiniteJet.actual_mixed_truncation_and_roundoff
#print axioms MathScope.ConcreteFiniteJet.actual_radial_truncation_and_roundoff
#print axioms MathScope.ConcreteFiniteJet.selected_reference_truncation
#print axioms MathScope.ConcreteFiniteJet.actual_profile_comparison_error
#print axioms MathScope.ConcreteFiniteJet.comparison_roundoff_bound
#print axioms MathScope.ConcreteFiniteJet.actual_profile_finite_enclosure
