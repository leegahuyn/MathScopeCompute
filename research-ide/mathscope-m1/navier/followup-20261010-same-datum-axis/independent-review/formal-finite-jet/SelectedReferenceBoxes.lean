import FieldBounds
import AxisFiniteJet

/-! Exact selected coefficient enclosures. The copied dyadic endpoints come
from evaluated-phi-mixed-comparison.json, SHA256 eb7e2448416c4be63d86c41d2be7ad6c6c11c057bc2a852b30b95807232e49b5.
Every endpoint inequality below is checked again by the original Lean kernel.
The nonlinear coefficients are enclosed using the original coefficient norm;
they are not identified with the centers of the comparison intervals. -/

noncomputable section
set_option maxHeartbeats 4000000
set_option exponentiation.threshold 2048

namespace MathScope.SelectedReferenceBoxes

open Set
open MathScope.SameDatumInputs MathScope.AxisFiniteJet
open NavierStokes.AxisCoefficientSpace NavierStokes.AxisWeightEstimates
open NavierStokes.AxisEvaluation NavierStokes.NaturalAxisBridge
open scoped BigOperators Topology

def reference : AxisSpace axisWindow rho :=
  NavierStokes.AxisResolvent.naturalResolvent axisWindow rho_pos chiInput oneInput

theorem zero_in_window : (0 : ℝ) ∈ axisWindow.interval := by
  norm_num [Window.interval, axisWindow]

theorem zero_in_interior : (0 : ℝ) ∈ Ioo axisWindow.left axisWindow.right := by
  norm_num [axisWindow]

theorem actual_chi_zero : NavierStokes.NaturalAxisData.chi h j sigma 0 =
    (4000000 : ℝ) / 4000001 := by
  have hH : NavierStokes.NaturalAxisData.H h j 0 = j := by
    simp [NavierStokes.NaturalAxisData.H, NavierStokes.NaturalAxisData.d,
      NavierStokes.NaturalAxisData.U]
  rw [NavierStokes.NaturalAxisData.chi, hH, sigma]
  apply (div_eq_iff (show j ^ 2 + (j / 2000) ^ 2 ≠ 0 by positivity [j_pos])).mpr
  ring

theorem chi_radial : RadiallyConstant axisWindow rho chiInput := by
  intro n hn x hx
  simp [chiInput_coefficient n hx, hn]

theorem one_radial : RadiallyConstant axisWindow rho oneInput := by
  intro n hn x hx
  simp [oneInput_coefficient n hx, hn]

def exactReference (n : ℕ) : ℝ :=
  (-(4000000 / 4000001 : ℝ) / 2) ^ n /
    ((n.factorial : ℝ) * ((n + 1).factorial : ℝ))

theorem actual_reference_coefficient (n : ℕ) :
    coefficient axisWindow (weight rho) reference n 0 = exactReference n := by
  have he0 : coefficient axisWindow (weight rho) oneInput 0 0 = 1 := by
    simp [oneInput_coefficient 0 zero_in_window]
  rw [reference, NavierStokes.AxisReference.reference_coefficient axisWindow rho_pos
    chiInput oneInput chi_radial one_radial zero_in_window he0 n]
  rw [chiInput_coefficient 0 zero_in_window]
  simp only [ite_true, actual_chi_zero]
  rfl


def referenceLower : ℕ → ℝ
  | 0 => (115792089237316195423570985008687907853269984665640564039457584007913129639936 : ℝ) / 2 ^ (256 : ℕ)
  | 1 => (-28948015072325280774572552609033824704861319951080153239826086045456771045792 : ℝ) / 2 ^ (256 : ℕ)
  | 2 => (2412333986276943495311838889459763027131019879835042811224804364253639857072 : ℝ) / 2 ^ (256 : ℕ)
  | 3 => (-100513890966399904038017277556504070337774910549399146451246902365509402668 : ℝ) / 2 ^ (256 : ℕ)
  | 4 => (2512846645948336113866403472311733680510952635996819662076257040073475048 : ℝ) / 2 ^ (256 : ℕ)
  | 5 => (-41880766962280527994308059294847404296664803100412885931382801155524296 : ℝ) / 2 ^ (256 : ℕ)
  | 6 => (498580434429659582993533528936229721855245763574426796052620048220277 : ℝ) / 2 ^ (256 : ℕ)
  | 7 => (-4451609908790911936142851044075004354956462721370273193615809169444 : ℝ) / 2 ^ (256 : ℕ)
  | 8 => (30913949971449395583087569811961743918983900263540720181596407166 : ℝ) / 2 ^ (256 : ℕ)
  | 9 => (-171744123572021304678493662665260688790293915001747472794222953 : ℝ) / 2 ^ (256 : ℕ)
  | 10 => (780654911981823389446396559606590501944619582034865731257307 : ℝ) / 2 ^ (256 : ℕ)
  | 11 => (-2957025442492970397387690651587149610578580620638427155762 : ℝ) / 2 ^ (256 : ℕ)
  | 12 => (9477643279605110859580267962584129900693744764507485654 : ℝ) / 2 ^ (256 : ℕ)
  | 13 => (-26037475028007921183679780900340846070540528421207142 : ℝ) / 2 ^ (256 : ℕ)
  | 14 => (61993972663430456008290238166347234771621136669018 : ℝ) / 2 ^ (256 : ℕ)
  | 15 => (-129154077426960759943748010242887511718999438311 : ℝ) / 2 ^ (256 : ℕ)
  | 16 => (237415524151561535535623487864141842271523693 : ℝ) / 2 ^ (256 : ℕ)
  | 17 => (-387933766009306104757825914896694220714556 : ℝ) / 2 ^ (256 : ℕ)
  | 18 => (567154486879954456557914975867300215506 : ℝ) / 2 ^ (256 : ℕ)
  | 19 => (-746255717225484452257722430131629593 : ℝ) / 2 ^ (256 : ℕ)
  | 20 => (888399441263811651020566328348453 : ℝ) / 2 ^ (256 : ℕ)
  | 21 => (-961471016411262835518237363243 : ℝ) / 2 ^ (256 : ℕ)
  | 22 => (950069936801945478879477477 : ℝ) / 2 ^ (256 : ℕ)
  | 23 => (-860570379786703494338146 : ℝ) / 2 ^ (256 : ℕ)
  | 24 => (717141803870135277747 : ℝ) / 2 ^ (256 : ℕ)
  | _ => 0

def referenceUpper : ℕ → ℝ
  | 0 => (115792089237316195423570985008687907853269984665640564039457584007913129639936 : ℝ) / 2 ^ (256 : ℕ)
  | 1 => (-28948015072325280774572552609033824704861319951080153239826086045456771045791 : ℝ) / 2 ^ (256 : ℕ)
  | 2 => (2412333986276943495311838889459763027131019879835042811224804364253639857073 : ℝ) / 2 ^ (256 : ℕ)
  | 3 => (-100513890966399904038017277556504070337774910549399146451246902365509402667 : ℝ) / 2 ^ (256 : ℕ)
  | 4 => (2512846645948336113866403472311733680510952635996819662076257040073475049 : ℝ) / 2 ^ (256 : ℕ)
  | 5 => (-41880766962280527994308059294847404296664803100412885931382801155524295 : ℝ) / 2 ^ (256 : ℕ)
  | 6 => (498580434429659582993533528936229721855245763574426796052620048220278 : ℝ) / 2 ^ (256 : ℕ)
  | 7 => (-4451609908790911936142851044075004354956462721370273193615809169443 : ℝ) / 2 ^ (256 : ℕ)
  | 8 => (30913949971449395583087569811961743918983900263540720181596407167 : ℝ) / 2 ^ (256 : ℕ)
  | 9 => (-171744123572021304678493662665260688790293915001747472794222952 : ℝ) / 2 ^ (256 : ℕ)
  | 10 => (780654911981823389446396559606590501944619582034865731257308 : ℝ) / 2 ^ (256 : ℕ)
  | 11 => (-2957025442492970397387690651587149610578580620638427155761 : ℝ) / 2 ^ (256 : ℕ)
  | 12 => (9477643279605110859580267962584129900693744764507485655 : ℝ) / 2 ^ (256 : ℕ)
  | 13 => (-26037475028007921183679780900340846070540528421207140 : ℝ) / 2 ^ (256 : ℕ)
  | 14 => (61993972663430456008290238166347234771621136669019 : ℝ) / 2 ^ (256 : ℕ)
  | 15 => (-129154077426960759943748010242887511718999438310 : ℝ) / 2 ^ (256 : ℕ)
  | 16 => (237415524151561535535623487864141842271523694 : ℝ) / 2 ^ (256 : ℕ)
  | 17 => (-387933766009306104757825914896694220714555 : ℝ) / 2 ^ (256 : ℕ)
  | 18 => (567154486879954456557914975867300215507 : ℝ) / 2 ^ (256 : ℕ)
  | 19 => (-746255717225484452257722430131629592 : ℝ) / 2 ^ (256 : ℕ)
  | 20 => (888399441263811651020566328348454 : ℝ) / 2 ^ (256 : ℕ)
  | 21 => (-961471016411262835518237363242 : ℝ) / 2 ^ (256 : ℕ)
  | 22 => (950069936801945478879477478 : ℝ) / 2 ^ (256 : ℕ)
  | 23 => (-860570379786703494338145 : ℝ) / 2 ^ (256 : ℕ)
  | 24 => (717141803870135277748 : ℝ) / 2 ^ (256 : ℕ)
  | _ => 0

def actualLower : ℕ → ℝ
  | 0 => (115792089237316195423570985008687907853269984665640564039457584007913129639936 : ℝ) / 2 ^ (256 : ℕ)
  | 1 => (-28948015072325280774572552609033824704861319951080153239826086045456771045793 : ℝ) / 2 ^ (256 : ℕ)
  | 2 => (2412333986276943495311838889459763027131019879835042811224804364253639857071 : ℝ) / 2 ^ (256 : ℕ)
  | 3 => (-100513890966399904038017277556504070337774910549399146451246902365509402669 : ℝ) / 2 ^ (256 : ℕ)
  | 4 => (2512846645948336113866403472311733680510952635996819662076257040073475047 : ℝ) / 2 ^ (256 : ℕ)
  | 5 => (-41880766962280527994308059294847404296664803100412885931382801155524297 : ℝ) / 2 ^ (256 : ℕ)
  | 6 => (498580434429659582993533528936229721855245763574426796052620048220276 : ℝ) / 2 ^ (256 : ℕ)
  | 7 => (-4451609908790911936142851044075004354956462721370273193615809169445 : ℝ) / 2 ^ (256 : ℕ)
  | 8 => (30913949971449395583087569811961743918983900263540720181596407165 : ℝ) / 2 ^ (256 : ℕ)
  | 9 => (-171744123572021304678493662665260688790293915001747472794222954 : ℝ) / 2 ^ (256 : ℕ)
  | 10 => (780654911981823389446396559606590501944619582034865731257306 : ℝ) / 2 ^ (256 : ℕ)
  | 11 => (-2957025442492970397387690651587149610578580620638427155763 : ℝ) / 2 ^ (256 : ℕ)
  | 12 => (9477643279605110859580267962584129900693744764507485653 : ℝ) / 2 ^ (256 : ℕ)
  | 13 => (-26037475028007921183679780900340846070540528421207143 : ℝ) / 2 ^ (256 : ℕ)
  | 14 => (61993972663430456008290238166347234771621136669017 : ℝ) / 2 ^ (256 : ℕ)
  | 15 => (-129154077426960759943748010242887511718999438312 : ℝ) / 2 ^ (256 : ℕ)
  | 16 => (237415524151561535535623487864141842271523692 : ℝ) / 2 ^ (256 : ℕ)
  | 17 => (-387933766009306104757825914896694220714557 : ℝ) / 2 ^ (256 : ℕ)
  | 18 => (567154486879954456557914975867300215505 : ℝ) / 2 ^ (256 : ℕ)
  | 19 => (-746255717225484452257722430131629594 : ℝ) / 2 ^ (256 : ℕ)
  | 20 => (888399441263811651020566328348452 : ℝ) / 2 ^ (256 : ℕ)
  | 21 => (-961471016411262835518237363244 : ℝ) / 2 ^ (256 : ℕ)
  | 22 => (950069936801945478879477476 : ℝ) / 2 ^ (256 : ℕ)
  | 23 => (-860570379786703494338147 : ℝ) / 2 ^ (256 : ℕ)
  | 24 => (717141803870135277746 : ℝ) / 2 ^ (256 : ℕ)
  | _ => 0

def actualUpper : ℕ → ℝ
  | 0 => (115792089237316195423570985008687907853269984665640564039457584007913129639936 : ℝ) / 2 ^ (256 : ℕ)
  | 1 => (-28948015072325280774572552609033824704861319951080153239826086045456771045790 : ℝ) / 2 ^ (256 : ℕ)
  | 2 => (2412333986276943495311838889459763027131019879835042811224804364253639857074 : ℝ) / 2 ^ (256 : ℕ)
  | 3 => (-100513890966399904038017277556504070337774910549399146451246902365509402666 : ℝ) / 2 ^ (256 : ℕ)
  | 4 => (2512846645948336113866403472311733680510952635996819662076257040073475050 : ℝ) / 2 ^ (256 : ℕ)
  | 5 => (-41880766962280527994308059294847404296664803100412885931382801155524294 : ℝ) / 2 ^ (256 : ℕ)
  | 6 => (498580434429659582993533528936229721855245763574426796052620048220279 : ℝ) / 2 ^ (256 : ℕ)
  | 7 => (-4451609908790911936142851044075004354956462721370273193615809169442 : ℝ) / 2 ^ (256 : ℕ)
  | 8 => (30913949971449395583087569811961743918983900263540720181596407168 : ℝ) / 2 ^ (256 : ℕ)
  | 9 => (-171744123572021304678493662665260688790293915001747472794222951 : ℝ) / 2 ^ (256 : ℕ)
  | 10 => (780654911981823389446396559606590501944619582034865731257309 : ℝ) / 2 ^ (256 : ℕ)
  | 11 => (-2957025442492970397387690651587149610578580620638427155760 : ℝ) / 2 ^ (256 : ℕ)
  | 12 => (9477643279605110859580267962584129900693744764507485656 : ℝ) / 2 ^ (256 : ℕ)
  | 13 => (-26037475028007921183679780900340846070540528421207139 : ℝ) / 2 ^ (256 : ℕ)
  | 14 => (61993972663430456008290238166347234771621136669020 : ℝ) / 2 ^ (256 : ℕ)
  | 15 => (-129154077426960759943748010242887511718999438309 : ℝ) / 2 ^ (256 : ℕ)
  | 16 => (237415524151561535535623487864141842271523695 : ℝ) / 2 ^ (256 : ℕ)
  | 17 => (-387933766009306104757825914896694220714554 : ℝ) / 2 ^ (256 : ℕ)
  | 18 => (567154486879954456557914975867300215508 : ℝ) / 2 ^ (256 : ℕ)
  | 19 => (-746255717225484452257722430131629591 : ℝ) / 2 ^ (256 : ℕ)
  | 20 => (888399441263811651020566328348455 : ℝ) / 2 ^ (256 : ℕ)
  | 21 => (-961471016411262835518237363241 : ℝ) / 2 ^ (256 : ℕ)
  | 22 => (950069936801945478879477479 : ℝ) / 2 ^ (256 : ℕ)
  | 23 => (-860570379786703494338144 : ℝ) / 2 ^ (256 : ℕ)
  | 24 => (717141803870135277749 : ℝ) / 2 ^ (256 : ℕ)
  | _ => 0


theorem reference_numeric_boxes (n : ℕ) (hn : n ≤ 24) :
    referenceLower n ≤ exactReference n ∧ exactReference n ≤ referenceUpper n := by
  interval_cases n <;>
    norm_num [referenceLower, referenceUpper, exactReference, Nat.factorial]

theorem reference_actual_boxes (n : ℕ) (hn : n ≤ 24) :
    referenceLower n ≤ coefficient axisWindow (weight rho) reference n 0 ∧
      coefficient axisWindow (weight rho) reference n 0 ≤ referenceUpper n := by
  rw [actual_reference_coefficient]
  exact reference_numeric_boxes n hn

theorem nonlinear_rounding_reserve (n : ℕ) (hn : n ≤ 24) (hn0 : n ≠ 0) :
    actualLower n ≤ referenceLower n - 1 / (2 : ℝ) ^ (512 : ℕ) ∧
      referenceUpper n + 1 / (2 : ℝ) ^ (512 : ℕ) ≤ actualUpper n := by
  interval_cases n <;> norm_num [actualLower, actualUpper, referenceLower, referenceUpper] at *

theorem weight_zero_le_one (epsilon : ℝ) (n : ℕ) : weight epsilon n 0 ≤ 1 := by
  simp only [weight, pow_zero, Nat.factorial_zero, Nat.cast_one, Nat.add_zero,
    Nat.choose_zero_right, mul_one, Nat.cast_zero, zero_add, one_pow]
  have hd : 0 < ((n : ℝ) + 1) ^ 2 := by positivity
  apply (div_le_iff₀ hd).mpr
  have hp : (1 / 20 : ℝ) ^ n ≤ 1 := pow_le_one₀ (by norm_num) (by norm_num)
  nlinarith [show (0 : ℝ) ≤ (n : ℝ) by positivity, sq_nonneg (n : ℝ)]

theorem sharp_error_smaller_than_rounding (q : ℝ) (hq : (2 : ℝ) ^ (260 : ℕ) ≤ q) :
    29 / q ^ (53 : ℕ) ≤ 1 / (2 : ℝ) ^ (512 : ℕ) := by
  have hq10 : (2 : ℝ) ^ (10 : ℕ) ≤ q :=
    (pow_le_pow_right₀ (by norm_num : (1 : ℝ) ≤ 2) (by norm_num : (10 : ℕ) ≤ 260)).trans hq
  have hqp : 0 < q := lt_of_lt_of_le (by norm_num) hq10
  have hp : ((2 : ℝ) ^ (10 : ℕ)) ^ (53 : ℕ) ≤ q ^ (53 : ℕ) := by gcongr
  calc
    29 / q ^ (53 : ℕ) ≤ 29 / (((2 : ℝ) ^ (10 : ℕ)) ^ (53 : ℕ)) :=
      div_le_div_of_nonneg_left (by norm_num) (by positivity) hp
    _ ≤ 1 / (2 : ℝ) ^ (512 : ℕ) := by norm_num

theorem nonlinear_coefficient_boxes (A : AxisSpace axisWindow rho) (q : ℝ)
    (hq : (2 : ℝ) ^ (260 : ℕ) ≤ q)
    (herror : ‖A - reference‖ ≤ 29 / q ^ (53 : ℕ))
    (haxis : coefficient axisWindow (weight rho) A 0 0 = 1)
    (n : ℕ) (hn : n ≤ 24) :
    actualLower n ≤ coefficient axisWindow (weight rho) A n 0 ∧
      coefficient axisWindow (weight rho) A n 0 ≤ actualUpper n := by
  by_cases hn0 : n = 0
  · subst n
    rw [haxis]
    norm_num [actualLower, actualUpper]
  · have href := reference_actual_boxes n hn
    have hreserve := nonlinear_rounding_reserve n hn hn0
    have herrsmall := herror.trans (sharp_error_smaller_than_rounding q hq)
    have hc := coefficient_jet_error axisWindow rho_pos A reference herrsmall n 0 zero_in_interior
    simp only [iteratedDeriv_zero] at hc
    have hw := weight_zero_le_one rho n
    have hc' : |coefficient axisWindow (weight rho) A n 0 -
        coefficient axisWindow (weight rho) reference n 0| ≤ 1 / (2 : ℝ) ^ (512 : ℕ) := by
      apply hc.trans
      nlinarith [mul_le_mul_of_nonneg_left hw
        (by positivity : (0 : ℝ) ≤ 1 / (2 : ℝ) ^ (512 : ℕ))]
    have hb := abs_le.mp hc'
    constructor <;> linarith [href.1, href.2, hreserve.1, hreserve.2, hb.1, hb.2]

theorem selected_reference_factorial_tail {t : ℝ} (ht : |t| ≤ 3) :
    ‖NavierStokes.AxisSeries.bessel 1 t -
      ∑ n ∈ Finset.range 25, NavierStokes.AxisSeries.term 1 n t‖ <
        1 / (2 : ℝ) ^ (120 : ℕ) := by
  have hb := bessel_finite_tail_error (by norm_num : (1 : ℕ) ≤ 1)
    (by norm_num : (2 : ℕ) ≤ 25) ht
  apply hb.trans_lt
  norm_num [Nat.factorial]

end MathScope.SelectedReferenceBoxes

#print axioms MathScope.SelectedReferenceBoxes.actual_chi_zero
#print axioms MathScope.SelectedReferenceBoxes.actual_reference_coefficient
#print axioms MathScope.SelectedReferenceBoxes.reference_numeric_boxes
#print axioms MathScope.SelectedReferenceBoxes.reference_actual_boxes
#print axioms MathScope.SelectedReferenceBoxes.nonlinear_rounding_reserve
#print axioms MathScope.SelectedReferenceBoxes.sharp_error_smaller_than_rounding
#print axioms MathScope.SelectedReferenceBoxes.nonlinear_coefficient_boxes
#print axioms MathScope.SelectedReferenceBoxes.selected_reference_factorial_tail
