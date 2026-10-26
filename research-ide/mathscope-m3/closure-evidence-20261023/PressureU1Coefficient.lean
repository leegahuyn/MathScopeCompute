import Std

namespace MathScope.M3.PressureU1Coefficient
open Lean.Grind

/- Algebra and scalar margins. Source binding, quadrature correctness,
complex analysis and the full infinite fixed point are separate proofs. -/

theorem nonpressure_numerator {K : Type} [CommRing K]
    (e A D j : K) (exponents : A+D=1) :
    A*(1-2*e*(4*e+j))*(4*e+j) + 4*(D*e+(1-e*e)*(4*e+j)) =
    j*(A+4)+(20-2*A*j*j)*e-j*(16*A+4)*e*e-(32*A+16)*e*e*e := by
  grind

theorem even_second_bracket {K : Type} [CommRing K]
    (A h : K) (exponent : 2*A=1+2*h) :
    (A+4)*2*h-(16*A+4) = -12-7*h+2*h*h := by
  grind

theorem even_fourth_bracket {K : Type} [CommRing K]
    (A h : K) (exponent : 2*A=1+2*h) :
    24*((A+4)*2*h-(16*A+4)) = -288-168*h+48*h*h := by
  grind

theorem positive_wait_margins : (31 : Rat)/16 > 1 ∧ (32 : Rat)/8191 < 1 := by
  grind

theorem pressure_strip_mass_margin : ((20+8+10*4+4+4 : Rat)/2) < 64 := by
  grind

theorem u1_tube_margin :
    (17:Rat)/32*(1+2*(17/8)*(19/2))*(19/2)+4*54 < 512 ∧
    (512:Rat)+(353/64)*1024+4*(17/32)*(17/8)*64 < 8192 := by
  grind

theorem pair_norm_source_budget :
    (163840+80*8192 : Nat) <
      1852673427797059126777135760139006525652319754650249024631321344126610074238976 := by
  decide

#print axioms nonpressure_numerator
#print axioms even_second_bracket
#print axioms even_fourth_bracket
#print axioms positive_wait_margins
#print axioms pressure_strip_mass_margin
#print axioms u1_tube_margin
#print axioms pair_norm_source_budget

end MathScope.M3.PressureU1Coefficient
