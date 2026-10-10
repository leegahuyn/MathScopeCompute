import ConcreteProducer

/-! Projection of the literal nonlinear fixed-point equation to every
radial/angular coefficient and every finite rectangular Taylor block.
This is an exact identity for the selected infinite coefficients; it
does not claim that the full nonlinear expression DAG has been evaluated. -/

noncomputable section
namespace MathScope.SameDatumInputs

open Set
open NavierStokes.AxisCoefficientSpace NavierStokes.AxisWeightEstimates
open NavierStokes.AxisContraction
open scoped BigOperators Topology

def selectedReferenceCoefficient (n : ℕ) (eta : ℝ) : ℝ :=
  (-NavierStokes.NaturalAxisData.chi h j sigma eta / 2) ^ n /
    ((n.factorial : ℝ) * ((n + 1).factorial : ℝ))

theorem selectedReference_coefficient_all_eta (n : ℕ) {eta : ℝ}
    (heta : eta ∈ axisWindow.interval) :
    coefficient axisWindow (weight rho) selectedReference.1 n eta =
      selectedReferenceCoefficient n eta := by
  have he0 : coefficient axisWindow (weight rho) oneInput 0 eta = 1 := by
    simp only [oneInput_coefficient 0 heta, ite_true]
  have he : NavierStokes.NaturalAxisBridge.RadiallyConstant axisWindow rho oneInput := by
    rw [← selectedElement_one]
    exact selectedElement_radial .one
  rw [selectedReference_phi_eq, NavierStokes.AxisReference.reference_coefficient
    axisWindow rho_pos chiInput oneInput selectedAxisData_compatible.chi_radial he heta he0 n]
  rw [chiInput_coefficient 0 heta]
  rfl

theorem selectedReference_derivative_all_eta (n m : ℕ) {eta : ℝ}
    (heta : eta ∈ Ioo axisWindow.left axisWindow.right) :
    iteratedDeriv m (coefficient axisWindow (weight rho) selectedReference.1 n) eta =
      iteratedDeriv m (selectedReferenceCoefficient n) eta := by
  have he : coefficient axisWindow (weight rho) selectedReference.1 n =ᶠ[nhds eta]
      selectedReferenceCoefficient n := by
    filter_upwards [Icc_mem_nhds heta.1 heta.2] with x hx
    exact selectedReference_coefficient_all_eta n hx
  exact Filter.EventuallyEq.iteratedDeriv_eq m he

theorem selected_coefficient_derivative_error (n m : ℕ) {eta : ℝ}
    (heta : eta ∈ Ioo axisWindow.left axisWindow.right) :
    |iteratedDeriv m (coefficient axisWindow (weight rho) selectedPhiCoefficients n) eta -
      iteratedDeriv m (selectedReferenceCoefficient n) eta| ≤
      (29 / Q ^ 53) * weight rho n m := by
  have hn : ‖selectedPhiCoefficients - selectedReference.1‖ ≤ 29 / Q ^ 53 :=
    (norm_fst_le (selectedFixedPoint - selectedReference)).trans selectedFixedPoint_error
  have hb := MathScope.AxisFiniteJet.coefficient_jet_error axisWindow rho_pos
    selectedPhiCoefficients selectedReference.1 hn n m heta
  rw [selectedReference_derivative_all_eta n m heta] at hb
  exact hb

theorem selected_normalized_xi_jet_error (n m : ℕ) {eta : ℝ}
    (heta : eta ∈ Ioo axisWindow.left axisWindow.right) :
    |(j ^ m / (m.factorial : ℝ)) *
        iteratedDeriv m (coefficient axisWindow (weight rho) selectedPhiCoefficients n) eta -
      (j ^ m / (m.factorial : ℝ)) * iteratedDeriv m (selectedReferenceCoefficient n) eta| ≤
      (j ^ m / (m.factorial : ℝ)) * (29 / Q ^ 53) * weight rho n m := by
  have hs : 0 ≤ j ^ m / (m.factorial : ℝ) := by positivity [j_pos]
  rw [← mul_sub, abs_mul, abs_of_nonneg hs]
  simpa only [mul_assoc] using mul_le_mul_of_nonneg_left
    (selected_coefficient_derivative_error n m heta) hs

def selectedRemainder : AxisSpace axisWindow rho × AxisSpace axisWindow rho :=
  naturalRemainder selectedOperators selectedAxisData selectedResolvent (1 / selectedLambda)
    actualAmplitudeInput selectedFixedPoint

theorem selectedPhi_jet_recurrence (n m : ℕ) (eta : ℝ) :
    jet axisWindow (weight rho) selectedPhiCoefficients.1 n m eta =
      jet axisWindow (weight rho) selectedReference.1.1 n m eta +
        (1 / (2 * selectedLambda)) * jet axisWindow (weight rho) selectedRemainder.1.1 n m eta := by
  have he := congrArg
    (fun x : AxisSpace axisWindow rho × AxisSpace axisWindow rho =>
      jet axisWindow (weight rho) x.1.1 n m eta) selectedFixedPoint_spec.2.1
  change jet axisWindow (weight rho)
    (selectedReference.1 + (1 / (2 * selectedLambda)) • selectedRemainder.1).1 n m eta =
      jet axisWindow (weight rho) selectedPhiCoefficients.1 n m eta at he
  simp only [Submodule.coe_add, Submodule.coe_smul, jet_add, jet_smul] at he
  exact he.symm

theorem selectedU_jet_recurrence (n m : ℕ) (eta : ℝ) :
    jet axisWindow (weight rho) selectedUCoefficients.1 n m eta =
      jet axisWindow (weight rho) selectedReference.2.1 n m eta +
        (1 / (2 * selectedLambda)) * jet axisWindow (weight rho) selectedRemainder.2.1 n m eta := by
  have he := congrArg
    (fun x : AxisSpace axisWindow rho × AxisSpace axisWindow rho =>
      jet axisWindow (weight rho) x.2.1 n m eta) selectedFixedPoint_spec.2.1
  change jet axisWindow (weight rho)
    (selectedReference.2 + (1 / (2 * selectedLambda)) • selectedRemainder.2).1 n m eta =
      jet axisWindow (weight rho) selectedUCoefficients.1 n m eta at he
  simp only [Submodule.coe_add, Submodule.coe_smul, jet_add, jet_smul] at he
  exact he.symm

theorem selectedPhi_coefficient_recurrence (n : ℕ) (eta : ℝ) :
    coefficient axisWindow (weight rho) selectedPhiCoefficients n eta =
      coefficient axisWindow (weight rho) selectedReference.1 n eta +
        (1 / (2 * selectedLambda)) * coefficient axisWindow (weight rho) selectedRemainder.1 n eta :=
  selectedPhi_jet_recurrence n 0 eta

theorem selectedPhi_derivative_recurrence (n m : ℕ) {eta : ℝ}
    (heta : eta ∈ Ioo axisWindow.left axisWindow.right) :
    iteratedDeriv m (coefficient axisWindow (weight rho) selectedPhiCoefficients n) eta =
      iteratedDeriv m (coefficient axisWindow (weight rho) selectedReference.1 n) eta +
        (1 / (2 * selectedLambda)) *
          iteratedDeriv m (coefficient axisWindow (weight rho) selectedRemainder.1 n) eta := by
  simpa only [NavierStokes.AxisEvaluation.coefficient_iteratedDeriv axisWindow rho
    selectedPhiCoefficients n m heta,
    NavierStokes.AxisEvaluation.coefficient_iteratedDeriv axisWindow rho selectedReference.1 n m heta,
    NavierStokes.AxisEvaluation.coefficient_iteratedDeriv axisWindow rho selectedRemainder.1 n m heta]
    using selectedPhi_jet_recurrence n m eta

def rectangularTaylor (A : AxisSpace axisWindow rho) (N M : ℕ)
    (center Y eta : ℝ) : ℝ :=
  ∑ n ∈ Finset.range N, ∑ m ∈ Finset.range M,
    (jet axisWindow (weight rho) A.1 n m center / (m.factorial : ℝ)) *
      Y ^ n * (eta - center) ^ m

theorem selectedPhi_finite_jet_recurrence (N M : ℕ) (center Y eta : ℝ) :
    rectangularTaylor selectedPhiCoefficients N M center Y eta =
      rectangularTaylor selectedReference.1 N M center Y eta +
        (1 / (2 * selectedLambda)) * rectangularTaylor selectedRemainder.1 N M center Y eta := by
  unfold rectangularTaylor
  simp only [Finset.mul_sum, ← Finset.sum_add_distrib]
  apply Finset.sum_congr rfl
  intro n hn
  apply Finset.sum_congr rfl
  intro m hm
  rw [selectedPhi_jet_recurrence]
  ring

theorem selectedPhi_N24_M4_recurrence (Y eta : ℝ) :
    rectangularTaylor selectedPhiCoefficients 25 5 0 Y eta =
      rectangularTaylor selectedReference.1 25 5 0 Y eta +
        (1 / (2 * selectedLambda)) * rectangularTaylor selectedRemainder.1 25 5 0 Y eta :=
  selectedPhi_finite_jet_recurrence 25 5 0 Y eta

end MathScope.SameDatumInputs

#print axioms MathScope.SameDatumInputs.selectedPhi_jet_recurrence
#print axioms MathScope.SameDatumInputs.selectedU_jet_recurrence
#print axioms MathScope.SameDatumInputs.selectedPhi_coefficient_recurrence
#print axioms MathScope.SameDatumInputs.selectedPhi_derivative_recurrence
#print axioms MathScope.SameDatumInputs.selectedPhi_finite_jet_recurrence
#print axioms MathScope.SameDatumInputs.selectedPhi_N24_M4_recurrence
#print axioms MathScope.SameDatumInputs.selectedReference_coefficient_all_eta
#print axioms MathScope.SameDatumInputs.selectedReference_derivative_all_eta
#print axioms MathScope.SameDatumInputs.selected_coefficient_derivative_error
#print axioms MathScope.SameDatumInputs.selected_normalized_xi_jet_error
