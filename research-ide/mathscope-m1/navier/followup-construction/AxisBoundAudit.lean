import NavierStokes.AxisContraction
import NavierStokes.NaturalAxisCoefficients
import NavierStokes.NaturalAxisData
import NavierStokes.NaturalAxisBridge
import NavierStokes.AxisModelBounds
import Mathlib.Tactic.NormNum
import Mathlib.Tactic.Linarith

/- Exact original theorem type/axiom audit plus finite scalar gates.
   This file does not prove that the JS analytic-input producer supplies every
   hypothesis of the imported nonlinear fixed-point/bridge theorem. -/
namespace MathScope.FollowupAxis
noncomputable def boundB : ℝ := 2636240628197767772084893579547737966293500888907548977913277276271421019814459066572472320
noncomputable def boundL : ℝ := 544620873082259470332694657234348631711410145550633655691604844481601608065936442654720
noncomputable def selectedLambda : ℝ := 527248125639553554416978715909547593258700177781509795582655455254284203962891813314494464000
noncomputable def selectedLogC : ℝ := 124605440450970487202262263129522548304693417090247016651789069123465812759792436944981808470769532928001
noncomputable def phaseUpper : ℝ := 236331689752

theorem scalarBanachGates :
    0 < selectedLambda ∧ 1 + boundB + boundL ≤ selectedLambda ∧
    boundB / (2 * selectedLambda) = (1 / 400 : ℝ) ∧
    boundL / (2 * selectedLambda) ≤ (1 / 2 : ℝ) := by
  norm_num [boundB, boundL, selectedLambda]

theorem complexNormalizationGate :
    selectedLambda * phaseUpper + 1 ≤ selectedLogC := by
  norm_num [selectedLambda, phaseUpper, selectedLogC]

theorem wholeIntervalPhiMargin :
    (1 / 4 : ℝ) < 305719 / 1152000 - 1 / 318 := by norm_num

theorem comparisonDerivativeUpper (z : ℝ) (hz : z ≤ 41 / 10) :
    -(1 / 4 : ℝ) + z / 24 ≤ -(19 / 240 : ℝ) := by linarith
end MathScope.FollowupAxis

#check NavierStokes.AxisOperators.norm_product_le
#print axioms NavierStokes.AxisOperators.norm_product_le
#check NavierStokes.AxisOperators.norm_parameterPrimitive_le
#print axioms NavierStokes.AxisOperators.norm_parameterPrimitive_le
#check NavierStokes.AxisOperators.norm_inverseMixed_le
#print axioms NavierStokes.AxisOperators.norm_inverseMixed_le
#check NavierStokes.AxisOperators.norm_inverseDotProduct_le
#print axioms NavierStokes.AxisOperators.norm_inverseDotProduct_le
#check NavierStokes.AxisResolvent.naturalOperator_pow_bound
#print axioms NavierStokes.AxisResolvent.naturalOperator_pow_bound
#check NavierStokes.AxisResolvent.naturalResolvent_norm_le
#print axioms NavierStokes.AxisResolvent.naturalResolvent_norm_le
#check NavierStokes.AxisContraction.exists_fixedPoint_of_controlled
#print axioms NavierStokes.AxisContraction.exists_fixedPoint_of_controlled
#check NavierStokes.AxisContraction.norm_naturalRemainder_le
#print axioms NavierStokes.AxisContraction.norm_naturalRemainder_le
#check NavierStokes.AxisContraction.naturalRemainder_sub_le
#print axioms NavierStokes.AxisContraction.naturalRemainder_sub_le
#check NavierStokes.AxisContraction.exists_unique_natural_fixedPoint
#print axioms NavierStokes.AxisContraction.exists_unique_natural_fixedPoint
#check NavierStokes.AnalyticCoefficientBounds.cauchy_bound_le_weight
#print axioms NavierStokes.AnalyticCoefficientBounds.cauchy_bound_le_weight
#check NavierStokes.AnalyticCoefficientBounds.normalizedExp_unitHolomorphic
#print axioms NavierStokes.AnalyticCoefficientBounds.normalizedExp_unitHolomorphic
#check NavierStokes.NaturalAxisData.exists_root_with_positive_Z
#print axioms NavierStokes.NaturalAxisData.exists_root_with_positive_Z
#check NavierStokes.NaturalAxisData.exists_sigma
#print axioms NavierStokes.NaturalAxisData.exists_sigma
#check NavierStokes.NaturalAxisBridge.exists_scaled_profiles
#print axioms NavierStokes.NaturalAxisBridge.exists_scaled_profiles
#check NavierStokes.AxisModelBounds.model_bounds
#print axioms NavierStokes.AxisModelBounds.model_bounds
#check MathScope.FollowupAxis.scalarBanachGates
#print axioms MathScope.FollowupAxis.scalarBanachGates
#check MathScope.FollowupAxis.complexNormalizationGate
#print axioms MathScope.FollowupAxis.complexNormalizationGate
#check MathScope.FollowupAxis.wholeIntervalPhiMargin
#print axioms MathScope.FollowupAxis.wholeIntervalPhiMargin
#check MathScope.FollowupAxis.comparisonDerivativeUpper
#print axioms MathScope.FollowupAxis.comparisonDerivativeUpper
