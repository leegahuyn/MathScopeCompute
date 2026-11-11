import MathScope.M0.Defs

/-!
Universal integer-coordinate statement for one fixed finite complex.
No claim about all prismatic complexes, cohomology ranks, omitted Laurent
weights, or Frobenius follows from this single finite theorem.
-/

namespace MathScope.M0.Finite

open MathScope.M0

/-- Literal 3 by 4 product evaluated by the kernel; audit dependencies below. -/
theorem matrix_product_zero :
    matrixProduct = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]] := by
  decide

/-- D1 D0 = 0 for every vector in Z^4, for the specified matrices. -/
theorem differential_squared_zero (v : C0) : d1 (d0 v) = zeroC2 := by
  change C2.mk (-v.d + v.d) 0 (-v.b - -v.b) = C2.mk 0 0 0
  rw [Int.add_left_neg, Int.sub_self]

/-- Exact integer fixture, including negative and large coordinates. -/
theorem integer_fixture :
    d1 (d0 ⟨-7, 9007199254740993, 11, -13⟩) = zeroC2 := by
  decide

set_option pp.fullNames true

#check matrix_product_zero
#print axioms matrix_product_zero
#check differential_squared_zero
#print axioms differential_squared_zero
#check integer_fixture
#print axioms integer_fixture

end MathScope.M0.Finite
