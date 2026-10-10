import OperatorBounds
import AmplitudeInput
import AmplitudeDynamics
import PressureSelection
import AxisFiniteJet

/-! A concrete inhabitant of the original coefficient-space fixed-point problem.
The pressure, radius, fixed fields, operators, normalization and contraction scale
are all the selected same-datum objects. No analytic norm premise is an input. -/

noncomputable section
set_option maxHeartbeats 2000000
set_option exponentiation.threshold 1024

namespace MathScope.SameDatumInputs

open Set Metric
open NavierStokes.AxisCoefficientSpace NavierStokes.AxisWeightEstimates
open NavierStokes.NaturalAxisCoefficients NavierStokes.AxisContraction
open NavierStokes.NaturalAxisBridge
open scoped Topology ContDiff

private local instance (I : Window) (eps : ℝ) : NormedAddCommGroup (AxisSpace I eps) := inferInstance
private local instance (I : Window) (eps : ℝ) : NormedSpace ℝ (AxisSpace I eps) := inferInstance

theorem selectedAmplitude_scale : actualAmplitudeLambda = selectedLambda := rfl
theorem selectedAmplitude_normalization : actualAmplitudeC = selectedC := rfl

theorem selectedElement_one : selectedElement .one = oneInput := by
  apply coefficient_ext axisWindow (weight rho) (fun n m => (weight_pos rho_pos n m).ne')
  intro n eta heta
  rw [selectedElement_coefficient .one n heta, oneInput_coefficient n heta]
  rfl

theorem selectedReference_phi_eq : selectedReference.1 =
    NavierStokes.AxisResolvent.naturalResolvent axisWindow rho_pos chiInput oneInput := by
  change selectedResolvent (selectedElement .one) = _
  rw [selectedElement_one]
  rfl

def selectedFixedPoint : AxisSpace axisWindow rho × AxisSpace axisWindow rho :=
  Classical.choose (actual_fixedPoint_at_selectedLambda actualAmplitudeInput actualAmplitudeInput_norm)

theorem selectedFixedPoint_spec :
    ‖selectedFixedPoint - selectedReference‖ ≤ 1 ∧
    selectedReference + (1 / (2 * selectedLambda)) •
      naturalRemainder selectedOperators selectedAxisData selectedResolvent (1 / selectedLambda)
        actualAmplitudeInput selectedFixedPoint = selectedFixedPoint ∧
    ‖selectedFixedPoint - selectedReference‖ ≤ 29 / Q ^ 53 ∧
    ∀ y : AxisSpace axisWindow rho × AxisSpace axisWindow rho,
      ‖y - selectedReference‖ ≤ 1 →
      selectedReference + (1 / (2 * selectedLambda)) •
        naturalRemainder selectedOperators selectedAxisData selectedResolvent (1 / selectedLambda)
          actualAmplitudeInput y = y → y = selectedFixedPoint :=
  Classical.choose_spec (actual_fixedPoint_at_selectedLambda actualAmplitudeInput actualAmplitudeInput_norm)

theorem selectedFixedPoint_error : ‖selectedFixedPoint - selectedReference‖ ≤ 29 / Q ^ 53 :=
  selectedFixedPoint_spec.2.2.1

theorem selectedFixedPoint_unique (y : AxisSpace axisWindow rho × AxisSpace axisWindow rho)
    (hy : ‖y - selectedReference‖ ≤ 1)
    (hfix : selectedReference + (1 / (2 * selectedLambda)) •
      naturalRemainder selectedOperators selectedAxisData selectedResolvent (1 / selectedLambda)
        actualAmplitudeInput y = y) : y = selectedFixedPoint :=
  selectedFixedPoint_spec.2.2.2 y hy hfix

def selectedPhiCoefficients : AxisSpace axisWindow rho := selectedFixedPoint.1
def selectedUCoefficients : AxisSpace axisWindow rho := selectedFixedPoint.2

theorem selectedPhi_reference_error :
    ‖selectedPhiCoefficients -
      NavierStokes.AxisResolvent.naturalResolvent axisWindow rho_pos chiInput oneInput‖ ≤ 29 / Q ^ 53 := by
  rw [← selectedReference_phi_eq]
  exact (norm_fst_le (selectedFixedPoint - selectedReference)).trans selectedFixedPoint_error

theorem selectedU_reference_error : ‖selectedUCoefficients - selectedReference.2‖ ≤ 29 / Q ^ 53 :=
  (norm_snd_le (selectedFixedPoint - selectedReference)).trans selectedFixedPoint_error

theorem selectedFixedPoint_integrated :
    selectedFixedPoint.1 + NavierStokes.AxisResolvent.naturalOperator axisWindow rho_pos chiInput selectedFixedPoint.1 =
      selectedAxisData.one + (1 / (2 * selectedLambda)) •
        (naturalRemainder selectedOperators selectedAxisData (ContinuousLinearMap.id ℝ _)
          (1 / selectedLambda) actualAmplitudeInput selectedFixedPoint).1 ∧
    selectedFixedPoint.2 = -(1 / 2 : ℝ) • selectedOperators.j1
      (selectedOperators.product selectedAxisData.inverseL selectedAxisData.zStar) +
      (1 / (2 * selectedLambda)) •
        (naturalRemainder selectedOperators selectedAxisData (ContinuousLinearMap.id ℝ _)
          (1 / selectedLambda) actualAmplitudeInput selectedFixedPoint).2 :=
  fixedPoint_integrated_equations selectedOperators selectedAxisData selectedResolvent
    (NavierStokes.AxisResolvent.naturalOperator axisWindow rho_pos chiInput)
    (NavierStokes.AxisResolvent.naturalResolvent_equation axisWindow rho_pos chiInput)
    (1 / selectedLambda) (1 / (2 * selectedLambda)) actualAmplitudeInput selectedFixedPoint
    selectedFixedPoint_spec.2.1

def selectedPhi : ℝ × ℝ → ℝ := NavierStokes.AxisEvaluation.profile axisWindow rho selectedPhiCoefficients
def selectedU : ℝ × ℝ → ℝ := NavierStokes.AxisEvaluation.profile axisWindow rho selectedUCoefficients
def selectedAverage : ℝ × ℝ → ℝ := NavierStokes.AxisEvaluation.profile axisWindow rho
  (NavierStokes.AxisOperators.average axisWindow rho_pos selectedUCoefficients)
def selectedPressureCorrection : ℝ × ℝ → ℝ := NavierStokes.AxisEvaluation.profile axisWindow rho
  (pressureCoefficient axisWindow rho_pos actualAmplitudeInput selectedPhiCoefficients)

theorem selected_scaled_solution :
    IsScaledSolution axisWindow (parameters axisWindow rho chiInput selectedAxisData)
      (1 / selectedLambda) (inputValue axisWindow rho actualAmplitudeInput)
      selectedPhi selectedU selectedAverage selectedPressureCorrection := by
  have hscale : 2 * (1 / (2 * selectedLambda)) = 1 / selectedLambda := by
    unfold selectedLambda
    field_simp [Q_pos.ne']
  exact integrated_solution axisWindow rho_pos chiInput selectedAxisData selectedAxisData_compatible
    (1 / selectedLambda) (1 / (2 * selectedLambda)) hscale actualAmplitudeInput actualAmplitudeInput_radial
    selectedFixedPoint selectedFixedPoint_integrated.1 selectedFixedPoint_integrated.2

theorem selected_uniform_mixed_error :
    UniformMixedError axisWindow rho (29 / Q ^ 53) selectedPhi selectedU
      (NavierStokes.AxisEvaluation.profile axisWindow rho selectedReference.1)
      (NavierStokes.AxisEvaluation.profile axisWindow rho selectedReference.2) :=
  uniformMixedError_of_norm axisWindow rho_pos selectedFixedPoint selectedReference
    (29 / Q ^ 53) selectedFixedPoint_error

theorem selected_reference_leading_solution :
    IsLeadingSolution axisWindow (parameters axisWindow rho chiInput selectedAxisData)
      (NavierStokes.AxisEvaluation.profile axisWindow rho selectedReference.1)
      (NavierStokes.AxisEvaluation.profile axisWindow rho selectedReference.2) :=
  reference_isLeadingSolution axisWindow rho_pos chiInput selectedAxisData selectedAxisData_compatible

theorem selectedPhi_axis_coefficient {eta : ℝ} (heta : eta ∈ axisWindow.interval) :
    coefficient axisWindow (weight rho) selectedPhiCoefficients 0 eta = 1 := by
  have hzero : |(0 : ℝ)| < 20 := by norm_num
  have he := congrArg (fun A => NavierStokes.AxisEvaluation.profile axisWindow rho A (0, eta))
    selectedFixedPoint_integrated.1
  simp only [selectedOperators] at he
  simp only [profile_add axisWindow rho_pos _ _ (p := (0, eta)) hzero,
    naturalOperator_axis_zero axisWindow rho_pos chiInput selectedFixedPoint.1 heta,
    profile_smul,
    (remainder_axis_zero axisWindow rho_pos selectedAxisData (1 / selectedLambda)
      actualAmplitudeInput selectedFixedPoint heta).1,
    profile_inputValue axisWindow rho selectedAxisData.one selectedAxisData_compatible.one_radial (p := (0, eta)) heta,
    selectedAxisData_compatible.one_value eta heta, add_zero, mul_zero] at he
  simpa only [selectedPhiCoefficients, NavierStokes.AxisEvaluationAlgebra.profile_axis] using he

theorem selected_actual_amplitude {eta : ℝ} (heta : eta ∈ axisWindow.interval) :
    inputValue axisWindow rho actualAmplitudeInput eta = realAmplitude h j sigma selectedLambda selectedC eta :=
  actualAmplitudeInput_value heta

theorem selected_actual_amplitude_logDerivative {eta : ℝ} (heta : eta ∈ axisWindow.interval) :
    deriv (realAmplitude h j sigma selectedLambda selectedC) eta /
      realAmplitude h j sigma selectedLambda selectedC eta = selectedLambda * realGradient h j sigma eta :=
  actualRealAmplitude_logDerivative heta

theorem selected_actual_pressure : NavierStokes.NaturalAxisData.PressureData newPressure :=
  newPressure_pressureData

theorem selected_actual_pressure_integral (eta : ℝ) :
    newPressure eta = -(1 / 2 : ℝ) * ∫ y : ℝ, newAngular y eta ^ 2 :=
  newPressure_is_literal_integral eta

end MathScope.SameDatumInputs

#print axioms MathScope.SameDatumInputs.selectedElement_one
#print axioms MathScope.SameDatumInputs.selectedFixedPoint_spec
#print axioms MathScope.SameDatumInputs.selectedPhi_reference_error
#print axioms MathScope.SameDatumInputs.selectedPhi_axis_coefficient
#print axioms MathScope.SameDatumInputs.selected_scaled_solution
#print axioms MathScope.SameDatumInputs.selected_uniform_mixed_error
#print axioms MathScope.SameDatumInputs.selected_reference_leading_solution
#print axioms MathScope.SameDatumInputs.selected_actual_pressure_integral
#print axioms MathScope.SameDatumInputs.selected_actual_amplitude_logDerivative
