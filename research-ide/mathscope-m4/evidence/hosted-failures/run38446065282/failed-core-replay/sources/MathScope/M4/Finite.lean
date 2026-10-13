import MathScope.M4.Defs
import MathScope.M0.Finite

namespace MathScope.M4.Finite
open MathScope.M4

/-- Exact p=2 numerator identity on all integer inputs. Division/other primes
require their own integrality and precision certificate. -/
theorem delta_two_numerator (x y : Int) :
    (x+y)*(x+y)-x*x-y*y = 2*x*y := by grind

/-- Universal coordinates, fixed inherited D=1 complex. -/
theorem differential_squared_zero (v : MathScope.M0.C0) :
    MathScope.M0.d1 (MathScope.M0.d0 v) = MathScope.M0.zeroC2 :=
  MathScope.M0.Finite.differential_squared_zero v

/-- The coefficient endomorphism is the identity on Z: the supported
semilinear fixture is a linear chain map, with no claim about Frobenius. -/
theorem scalar_chain_map (s : Int) (v : MathScope.M0.C0) :
    MathScope.M0.d0 ⟨s*v.a,s*v.b,s*v.c,s*v.d⟩ =
    let w := MathScope.M0.d0 v
    MathScope.M0.C1.mk (s*w.u) (s*w.v) (s*w.w) (s*w.x) (s*w.y) := by
  cases v
  simp [MathScope.M0.d0]
  grind

/-- Every trial divisor 2 ≤ d < n is checked, exact bounded fixture. -/
theorem prime_interval_fixture :
    (List.range 30).filter primeTrial = [2,3,5,7,11,13,17,19,23,29] := by decide

theorem bracket_antisymmetric (A B : Mat2) :
    add (bracket A B) (bracket B A) = zero := by
  cases A; cases B
  simp [add, bracket, sub, mul, zero]
  grind

theorem bracket_jacobi (A B C : Mat2) :
    add (add (bracket A (bracket B C)) (bracket B (bracket C A)))
      (bracket C (bracket A B)) = zero := by
  cases A; cases B; cases C
  simp [add, bracket, sub, mul, zero]
  grind

/-- Exact holonomy for the integer shear subgroup. It is neither a
nonabelian continuum limit nor a general SU2/SU3/G2 claim. -/
theorem shear_plaquette (s t : Int) :
    mul (mul (mul (shear s) (shear t)) (shear (-s))) (shear (-t)) = identity := by
  simp [mul, shear, identity]
  grind

set_option pp.fullNames true
#check delta_two_numerator
#print axioms delta_two_numerator
#check differential_squared_zero
#print axioms differential_squared_zero
#check scalar_chain_map
#print axioms scalar_chain_map
#check prime_interval_fixture
#print axioms prime_interval_fixture
#check bracket_antisymmetric
#print axioms bracket_antisymmetric
#check bracket_jacobi
#print axioms bracket_jacobi
#check shear_plaquette
#print axioms shear_plaquette
end MathScope.M4.Finite
