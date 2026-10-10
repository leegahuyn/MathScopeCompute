import FieldBounds
import ThresholdBridge

noncomputable section
set_option maxHeartbeats 2000000
namespace MathScope.SameDatumInputs

open Set Metric MeasureTheory Complex
open NavierStokes.AxisCoefficientSpace NavierStokes.AxisWeightEstimates
open NavierStokes.AnalyticCoefficientBounds NavierStokes.NaturalAxisCoefficients
open NavierStokes.AxisContraction NavierStokes.AxisOperators NavierStokes.AxisResolvent
open scoped Topology ContDiff

private local instance (I : Window) (eps : ℝ) : NormedAddCommGroup (AxisSpace I eps) := inferInstance
private local instance (I : Window) (eps : ℝ) : NormedSpace ℝ (AxisSpace I eps) := inferInstance

def Q : ℝ := 2 ^ (260 : ℕ) * Pstar ^ 2 / sigma ^ 2
def selectedLambda : ℝ := Q ^ (64 : ℕ)
def selectedC : ℝ := (1 + Q ^ (300 : ℕ)) ^ (10 : ℕ) * Real.exp (Q ^ (200 : ℕ))

theorem Q_pos : 0 < Q := by unfold Q; positivity [Pstar_pos, sigma_pos]
theorem sigma_sq_le_one : sigma ^ 2 ≤ 1 := pow_le_one₀ sigma_pos.le sigma_le_one
theorem Pstar_sq_ge_one : 1 ≤ Pstar ^ 2 := by nlinarith [Pstar_ge_two]
theorem Q_mul_sigma_sq : Q * sigma ^ 2 = 2 ^ (260 : ℕ) * Pstar ^ 2 := by
  unfold Q
  exact div_mul_cancel₀ _ (sq_pos_of_pos sigma_pos).ne'

theorem Q_ge_scale : 2 ^ (260 : ℕ) * Pstar ^ 2 ≤ Q := by
  unfold Q
  apply (le_div_iff₀ (sq_pos_of_pos sigma_pos)).mpr
  simpa only [mul_one] using mul_le_mul_of_nonneg_left sigma_sq_le_one
    (show 0 ≤ (2 : ℝ) ^ (260 : ℕ) * Pstar ^ 2 by positivity)

theorem Q_ge_two_pow : (2 : ℝ) ^ (260 : ℕ) ≤ Q := by
  calc
    _ = 2 ^ (260 : ℕ) * 1 := by ring
    _ ≤ 2 ^ (260 : ℕ) * Pstar ^ 2 := mul_le_mul_of_nonneg_left Pstar_sq_ge_one (by positivity)
    _ ≤ Q := Q_ge_scale

theorem two_pow_260_ge_1048576 : (1048576 : ℝ) ≤ 2 ^ (260 : ℕ) := by
  calc 1048576 = (2 : ℝ) ^ (20 : ℕ) := by norm_num
       _ ≤ _ := pow_le_pow_right₀ (by norm_num) (by norm_num)

theorem Q_ge_one : 1 ≤ Q := (by linarith [two_pow_260_ge_1048576]).trans Q_ge_two_pow
theorem Q_ge_5120 : 5120 ≤ Q := (by linarith [two_pow_260_ge_1048576]).trans Q_ge_two_pow

theorem Q_mul_rho : Q * rho = 2 ^ (244 : ℕ) * Pstar ^ 2 := by
  rw [rho, ← mul_div_assoc, Q_mul_sigma_sq]
  have hid : (2 : ℝ) ^ (260 : ℕ) = 2 ^ (244 : ℕ) * 65536 := by
    rw [show (260 : ℕ) = 244 + 16 by rfl, pow_add]
    norm_num
  rw [hid]
  ring

theorem Q_ge_operator_scale : 5120 / rho ≤ Q := by
  apply (div_le_iff₀ rho_pos).mpr
  rw [Q_mul_rho]
  have hc : (5120 : ℝ) ≤ 2 ^ (244 : ℕ) := by
    calc 5120 ≤ (2 : ℝ) ^ (13 : ℕ) := by norm_num
         _ ≤ _ := pow_le_pow_right₀ (by norm_num) (by norm_num)
  calc 5120 ≤ (2 : ℝ) ^ (244 : ℕ) := hc
       _ = 2 ^ (244 : ℕ) * 1 := by ring
       _ ≤ _ := mul_le_mul_of_nonneg_left Pstar_sq_ge_one (by positivity)

theorem Q_ge_gradient_scale : 200 / sigma ^ 2 ≤ Q := by
  unfold Q
  apply div_le_div_of_nonneg_right _ (sq_nonneg sigma)
  calc 200 ≤ (2 : ℝ) ^ (260 : ℕ) := by linarith [two_pow_260_ge_1048576]
       _ = 2 ^ (260 : ℕ) * 1 := by ring
       _ ≤ _ := mul_le_mul_of_nonneg_left Pstar_sq_ge_one (by positivity)

theorem selectedElement_norm_Q (k : Field) : ‖selectedElement k‖ ≤ Q := by
  have hb := selectedElement_norm k
  have hsmall : (80 : ℝ) ≤ Q := (by norm_num : (80 : ℝ) ≤ 5120).trans Q_ge_5120
  cases k <;> dsimp only [fixedFieldBound] at hb
  all_goals first | exact hb.trans (by linarith)
  · apply hb.trans
    calc 2 * (262144 * Pstar ^ 2) = 524288 * Pstar ^ 2 := by ring
         _ ≤ 2 ^ (260 : ℕ) * Pstar ^ 2 :=
           mul_le_mul_of_nonneg_right (by linarith [two_pow_260_ge_1048576]) (sq_nonneg Pstar)
         _ ≤ Q := Q_ge_scale
  · apply hb.trans
    calc 2 * (100 / sigma ^ 2) = 200 / sigma ^ 2 := by ring
         _ ≤ Q := Q_ge_gradient_scale

def selectedOperators : NaturalOperators (AxisSpace axisWindow rho) := coefficientOperators axisWindow rho_pos
def selectedResolvent : AxisSpace axisWindow rho →L[ℝ] AxisSpace axisWindow rho :=
  naturalResolvent axisWindow rho_pos chiInput
def selectedReference : AxisSpace axisWindow rho × AxisSpace axisWindow rho :=
  referencePair selectedOperators selectedAxisData selectedResolvent

theorem T_ge_1280 : (1280 : ℝ) ≤ T := by
  have he := Real.add_one_le_exp Md
  dsimp [T, Md]
  norm_num [Md] at he
  norm_num
  linarith

theorem exp_5120_le_Pstar_sq : Real.exp 5120 ≤ Pstar ^ 2 := by
  have he : Real.exp 5120 ≤ Real.exp (4 * T) := Real.exp_le_exp.mpr (by linarith [T_ge_1280])
  have hid : Pstar ^ 2 = Real.exp (4 * T) := by
    rw [Pstar, pow_two, ← Real.exp_add]
    congr 1
    ring
  exact hid ▸ he

theorem selectedResolvent_norm : ‖selectedResolvent‖ ≤ Pstar ^ 2 := by
  have hn : 0 ≤ 2560 * ‖chiInput‖ := by positivity
  have hsum := (summable_factorialMajorant hn).tsum_le_tsum
    (fun k => factorialMajorant_le_exp_term hn k)
    (Real.summable_pow_div_factorial (2560 * ‖chiInput‖))
  have he := naturalResolvent_norm_le axisWindow rho_pos chiInput
  have hexp : Real.exp (2560 * ‖chiInput‖) ≤ Real.exp 5120 :=
    Real.exp_le_exp.mpr (by nlinarith [chiInput_norm])
  calc
    ‖selectedResolvent‖ ≤ ∑' k : ℕ, factorialMajorant (2560 * ‖chiInput‖) k := he
    _ ≤ ∑' k : ℕ, (2560 * ‖chiInput‖) ^ k / (k.factorial : ℝ) := hsum
    _ = Real.exp (2560 * ‖chiInput‖) := (Real.hasSum_exp _).tsum_eq
    _ ≤ Real.exp 5120 := hexp
    _ ≤ Pstar ^ 2 := exp_5120_le_Pstar_sq

theorem selectedReference_norm : ‖selectedReference‖ ≤ (2 : ℝ)^34 * Pstar ^ 2 := by
  have ho : ‖selectedAxisData.one‖ ≤ 2 := by simpa [selectedAxisData, fixedFieldBound] using selectedElement_norm .one
  have hi : ‖selectedAxisData.inverseL‖ ≤ 4 := by simpa [selectedAxisData, fixedFieldBound] using selectedElement_norm .inverseL
  have hz : ‖selectedAxisData.zStar‖ ≤ 524288 * Pstar ^ 2 := by
    have hb := selectedElement_norm .zStar
    dsimp only [fixedFieldBound] at hb
    change ‖selectedElement .zStar‖ ≤ _
    nlinarith only [hb]
  have hs : ‖selectedResolvent selectedAxisData.one‖ ≤ 2 * Pstar ^ 2 := by
    calc
      _ ≤ ‖selectedResolvent‖ * ‖selectedAxisData.one‖ := selectedResolvent.le_opNorm _
      _ ≤ Pstar ^ 2 * 2 := by gcongr; exact selectedResolvent_norm
      _ = _ := by ring
  have hp : ‖selectedOperators.product selectedAxisData.inverseL selectedAxisData.zStar‖ ≤
      134217728 * Pstar ^ 2 := by
    calc
      _ ≤ ‖selectedOperators.product‖ * ‖selectedAxisData.inverseL‖ * ‖selectedAxisData.zStar‖ :=
        selectedOperators.product.le_opNorm₂ _ _
      _ ≤ 64 * 4 * (524288 * Pstar ^ 2) := by
        gcongr
        exact norm_product_le axisWindow rho_pos
      _ = _ := by ring
  have hj : ‖selectedOperators.j1
      (selectedOperators.product selectedAxisData.inverseL selectedAxisData.zStar)‖ ≤
      10737418240 * Pstar ^ 2 := by
    calc
      _ ≤ ‖selectedOperators.j1‖ *
          ‖selectedOperators.product selectedAxisData.inverseL selectedAxisData.zStar‖ :=
        selectedOperators.j1.le_opNorm _
      _ ≤ 80 * (134217728 * Pstar ^ 2) := by
        gcongr
        exact norm_regularInverse_le axisWindow rho_pos 1 (by norm_num)
      _ = _ := by ring
  have hu : ‖-(1 / 2 : ℝ) • selectedOperators.j1
      (selectedOperators.product selectedAxisData.inverseL selectedAxisData.zStar)‖ ≤
      5368709120 * Pstar ^ 2 := by
    rw [norm_smul, Real.norm_eq_abs]
    norm_num
    nlinarith
  rw [selectedReference, referencePair, Prod.norm_def, max_le_iff]
  constructor <;> nlinarith [sq_nonneg Pstar]

theorem selectedReference_radius_Q : ‖selectedReference‖ + 1 ≤ Q := by
  have hb := selectedReference_norm
  have hQ := Q_ge_scale
  have hc : (2 : ℝ) ^ (34 : ℕ) + 1 ≤ 2 ^ (260 : ℕ) := by
    calc _ ≤ (2 : ℝ) ^ (35 : ℕ) := by norm_num
         _ ≤ _ := pow_le_pow_right₀ (by norm_num) (by norm_num)
  have hm := mul_le_mul_of_nonneg_right hc (sq_nonneg Pstar)
  nlinarith [Pstar_sq_ge_one]

theorem selectedInputNormBounds : MathScope.ThresholdBridge.InputNormBounds
    selectedOperators selectedAxisData selectedResolvent (‖selectedReference‖ + 1) Q := by
  have h80 : (80 : ℝ) ≤ Q := (by norm_num : (80 : ℝ) ≤ 5120).trans Q_ge_5120
  have h64 : (64 : ℝ) ≤ Q := (by norm_num : (64 : ℝ) ≤ 80).trans h80
  have h1 : (1 : ℝ) ≤ Q := Q_ge_one
  have h80rho : 80 / rho ≤ Q :=
    (div_le_div_of_nonneg_right (by norm_num : (80 : ℝ) ≤ 5120) rho_pos.le).trans Q_ge_operator_scale
  refine {
    radius := selectedReference_radius_Q
    resolvent := selectedResolvent_norm.trans ?_
    product := (norm_product_le axisWindow rho_pos).trans h64
    average := (norm_average_le axisWindow rho_pos).trans h1
    primitive := (norm_primitive_le axisWindow rho_pos).trans h80
    parameterPrimitive := (norm_parameterPrimitive_le axisWindow rho_pos).trans h80rho
    mulY := (norm_mulY_le axisWindow rho_pos).trans h80
    j1 := (norm_regularInverse_le axisWindow rho_pos 1 (by norm_num)).trans h80
    j2 := (norm_regularInverse_le axisWindow rho_pos 2 (by norm_num)).trans h80
    param1 := (norm_inverseParamProduct_le axisWindow rho_pos 1 (by norm_num)).trans Q_ge_operator_scale
    param2 := (norm_inverseParamProduct_le axisWindow rho_pos 2 (by norm_num)).trans Q_ge_operator_scale
    dot1 := (norm_inverseDotProduct_le axisWindow rho_pos 1 (by norm_num)).trans Q_ge_5120
    dot2 := (norm_inverseDotProduct_le axisWindow rho_pos 2 (by norm_num)).trans Q_ge_5120
    mixed1 := (norm_inverseMixed_le axisWindow rho_pos 1 (by norm_num)).trans Q_ge_operator_scale
    mixed2 := (norm_inverseMixed_le axisWindow rho_pos 2 (by norm_num)).trans Q_ge_operator_scale
    one := selectedElement_norm_Q .one
    eta := selectedElement_norm_Q .eta
    dataD := selectedElement_norm_Q .d
    inverseL := selectedElement_norm_Q .inverseL
    uStar := selectedElement_norm_Q .uStar
    uStarEta := selectedElement_norm_Q .uStarEta
    wStar := selectedElement_norm_Q .wStar
    hStar := selectedElement_norm_Q .hStar
    normalizedGradient := selectedElement_norm_Q .gradient
    zStar := selectedElement_norm_Q .zStar
    absA := ?_
    absD := ?_
    absH := ?_
  }
  · have hm := mul_le_mul_of_nonneg_right (show (1 : ℝ) ≤ 2 ^ (260 : ℕ) by linarith [two_pow_260_ge_1048576]) (sq_nonneg Pstar)
    nlinarith [Q_ge_scale]
  · simpa [selectedAxisData, Complex.norm_real, Real.norm_eq_abs] using complex_A_norm
  · simpa [selectedAxisData, Complex.norm_real, Real.norm_eq_abs] using complex_D_norm
  · change |h| ≤ 1
    rw [abs_of_pos h_pos]
    exact h_le_one

theorem actual_fixedPoint_at_selectedLambda (a : AxisSpace axisWindow rho) (ha : ‖a‖ ≤ 2) :
    ∃ x : AxisSpace axisWindow rho × AxisSpace axisWindow rho,
      ‖x - selectedReference‖ ≤ 1 ∧
      selectedReference + (1 / (2 * selectedLambda)) •
        naturalRemainder selectedOperators selectedAxisData selectedResolvent (1 / selectedLambda) a x = x ∧
      ‖x - selectedReference‖ ≤ 29 / Q ^ 53 ∧
      ∀ y : AxisSpace axisWindow rho × AxisSpace axisWindow rho,
        ‖y - selectedReference‖ ≤ 1 →
        selectedReference + (1 / (2 * selectedLambda)) •
          naturalRemainder selectedOperators selectedAxisData selectedResolvent (1 / selectedLambda) a y = y →
        y = x :=
  MathScope.ThresholdBridge.exists_unique_fixedPoint_at_Q64
    selectedOperators selectedAxisData selectedResolvent selectedReference Q
    Q_ge_two_pow selectedInputNormBounds a ha

end MathScope.SameDatumInputs

#print axioms MathScope.SameDatumInputs.Q_ge_two_pow
#print axioms MathScope.SameDatumInputs.selectedResolvent_norm
#print axioms MathScope.SameDatumInputs.selectedReference_radius_Q
#print axioms MathScope.SameDatumInputs.selectedInputNormBounds
#print axioms MathScope.SameDatumInputs.actual_fixedPoint_at_selectedLambda
