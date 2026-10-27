import Std

namespace MathScope.M3.WholeBrhoAlgebra
open Lean.Grind

/- These check the actual remainder expansions and scalar margins.
   They do not formalize the Banach/complex-analytic proof. -/

theorem R1_twelve_terms {K : Type} [CommRing K]
    (w e D x av d ea h U u z p dx H dp : K) :
    ((w+e*(-2*D*x*av-d*ea))+h*(1-2*x*(U+e*u))+d*u*z)*p +
      (w+e*(-2*D*x*av-d*ea))*dx+(H+e*d*u)*dp =
    w*p-2*e*D*x*av*p-e*d*ea*p+h*p-2*h*x*U*p-2*h*x*e*u*p+
      d*u*z*p+w*dx-2*e*D*x*av*dx-e*d*ea*dx+H*dp+e*d*u*dp := by
  grind

theorem R2_ten_terms {K : Type} [CommRing K]
    (a u A x e w D av d ea dx H du p dp yp : K) :
    a*u-2*A*x*e*u*u+(w+e*(-2*D*x*av-d*ea))*dx+H*du+
      d*e*u*du-4*A*x*p+d*dp-2*x*yp =
    a*u-2*A*x*e*u*u+w*dx-2*e*D*x*av*dx-e*d*ea*dx+H*du+
      e*d*u*du-4*A*x*p+d*dp-2*x*yp := by
  grind

theorem scalar_Cauchy_weight_step (m : Rat) (hm : 0 ≤ m) :
    (m+2)^2 ≤ 4*(m+1)^2 := by
  have hm2 : 0 ≤ m^2 := OrderedRing.sq_nonneg
  grind

theorem mixed_index_fraction (i j n v : Rat)
    (hi : 0 ≤ i) (hj : 0 ≤ j) (hn : i+1 ≤ n+1)
    (hv : j ≤ n+v) : (i+1)*j ≤ (n+1)*(n+v) := by
  have hN : 0 ≤ n+1 := by grind
  have hleft := Rat.mul_le_mul_of_nonneg_right hn hj
  have hright := Rat.mul_le_mul_of_nonneg_left hv hN
  exact Rat.le_trans hleft hright

theorem actual_operator_constant_budget :
    (20480*65536 : Nat) <
      1852673427797059126777135760139006525652319754650249024631321344126610074238976 := by
  decide

theorem exact_resolvent_tail_ratio : (30720 : Rat)/(258*259) < 1 := by
  grind

theorem common_domain_margin : (1 : Rat)/4+1/2 < 1 := by
  grind

#print axioms R1_twelve_terms
#print axioms R2_ten_terms
#print axioms scalar_Cauchy_weight_step
#print axioms mixed_index_fraction
#print axioms actual_operator_constant_budget
#print axioms exact_resolvent_tail_ratio
#print axioms common_domain_margin

end MathScope.M3.WholeBrhoAlgebra
