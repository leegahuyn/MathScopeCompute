import Std
namespace MathScope.M3.ActualNaturalValuesAlgebra
open Lean.Grind

/- Source substitution and scalar portions only, not full analytic proof. -/
theorem scaled_source_H {K : Type} [CommRing K] (D j x : K) :
    D*(j*x)+(1-(j*x)^2)*(4*(j*x)+j) =
      j*(1+(D+4)*x-j*j*x*x-4*j*j*x*x*x) := by
  grind

theorem source_Y_cancellation {K : Type} [CommRing K]
    (l xa t : K) (h : l*xa=4) : l*(xa*t)=4*t := by
  grind

theorem actual_positivity_margin :
    (305719 : Rat)/1152000-1/(2^32) > 53/200 := by
  grind

theorem cubic_endpoint :
    (1 : Rat)-(41/20)/2+(41/20)^2/12-(41/20)^3/144 =
      305719/1152000 := by
  grind

theorem exact_chi_axis : (1 : Rat)/(1+1/4000000)=4000000/4000001 := by
  grind

theorem scaled_complex_denominator_margin :
    (4 : Rat)/9-1/4000000>2/5 := by
  grind

theorem comparison_tail_ratio : (5 : Rat)/(31*35)<1 := by
  grind

theorem nonlinear_exponent_budget : (20 : Nat)+4096 < 38*32768 := by
  decide

#print axioms scaled_source_H
#print axioms source_Y_cancellation
#print axioms actual_positivity_margin
#print axioms cubic_endpoint
#print axioms exact_chi_axis
#print axioms scaled_complex_denominator_margin
#print axioms comparison_tail_ratio
#print axioms nonlinear_exponent_budget
end MathScope.M3.ActualNaturalValuesAlgebra
