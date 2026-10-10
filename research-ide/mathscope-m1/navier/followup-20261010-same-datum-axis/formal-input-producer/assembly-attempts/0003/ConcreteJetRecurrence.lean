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
open scoped BigOperators

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
