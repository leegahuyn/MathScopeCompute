import Std

namespace MathScope.M3.Phi1Coefficient

open Lean.Grind

/- Algebra and exact scalar margins only. Complex analysis, Cauchy's
estimate, the source AST binding and the full fixed point are not asserted
by these Lean theorems. -/

theorem first_coefficient_numerator {K : Type} [CommRing K]
    (eta h D j : K) (exponents : 2*D + 2*h = 1) :
    (1 - 4*(1-eta*eta) - 2*D*eta*(4*eta+j)) +
      h*(1-2*eta*(4*eta+j)) = -3+h-j*eta := by
  grind

theorem cauchy_n1_weight (m : Nat) : m+1 ≤ 4^m := by
  induction m with
  | zero => decide
  | succ m ih =>
    simp only [Nat.pow_succ]
    omega

theorem tube_denominator_margin :
    (63 : Rat)*(54+28) < 6000 ∧ (6000 : Rat)/16384 < 1/2 := by
  grind

theorem tube_phi1_budget : ((2*(54:Rat)^2 + 165/16)/4) < 2048 := by
  grind

theorem source_Q_constant_budget :
    (163840 : Nat) < 1852673427797059126777135760139006525652319754650249024631321344126610074238976 ∧
    (2 : Nat)^64 < 1852673427797059126777135760139006525652319754650249024631321344126610074238976 := by
  decide

#print axioms first_coefficient_numerator
#print axioms cauchy_n1_weight
#print axioms tube_denominator_margin
#print axioms tube_phi1_budget
#print axioms source_Q_constant_budget

end MathScope.M3.Phi1Coefficient
