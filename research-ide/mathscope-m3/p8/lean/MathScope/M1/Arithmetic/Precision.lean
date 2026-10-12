import Mathlib.Data.Int.ModEq
import Mathlib.Algebra.Divisibility.Basic
import Mathlib.Tactic.Ring
import Mathlib.Tactic.NormNum

namespace MathScope.M1.Arithmetic

theorem precision_reduction_composes (p a : ℤ) (N M : ℕ) (h : N ≤ M) :
    (a % p^M) % p^N = a % p^N :=
  Int.emod_emod_of_dvd a (pow_dvd_pow p h)

theorem integral_map_preserves_precision (p a b c : ℤ) (N : ℕ)
    (h : p^N ∣ a-b) : p^N ∣ c*a-c*b := by
  obtain ⟨z,hz⟩ := h
  refine ⟨c*z,?_⟩
  calc c*a-c*b = c*(a-b) := by ring
       _ = c*(p^N*z) := by rw [hz]
       _ = p^N*(c*z) := by ring

theorem delta_numerator_precision (modulus a b : ℤ) (p : ℕ)
    (h : Int.ModEq modulus a b) :
    Int.ModEq modulus (a-a^p) (b-b^p) :=
  h.sub (Int.ModEq.pow p h)

/-- Dividing a divisible numerator by p consumes one known p-adic digit. -/
theorem guard_digit_division (p x y : ℤ) (N : ℕ) (hp : p ≠ 0)
    (h : p^(N+1) ∣ p*x-p*y) : p^N ∣ x-y := by
  obtain ⟨z,hz⟩ := h
  refine ⟨z,?_⟩
  apply mul_left_cancel₀ hp
  calc p*(x-y) = p*x-p*y := by ring
       _ = p^(N+1)*z := hz
       _ = p*(p^N*z) := by rw [pow_succ]; ring

/-- A finite fixture demonstrating that an unknown guard digit cannot be inferred. -/
theorem delta_guard_digit_counterexample :
    (0 : ℤ) % 27 = 27 % 27 ∧
    ((0 : ℤ)-0^3)/3 % 27 ≠ ((27 : ℤ)-27^3)/3 % 27 := by
  norm_num

theorem derived_reduction_zero_differential : (3 : ℤ) % 3 = 0 := by decide

theorem finite_ring_nonunit_fixture :
    ∀ x : Fin 27, (3*x.val) % 27 ≠ 1 := by decide

theorem finite_ring_kernel_fixture :
    ((List.range 27).filter (fun x => (3*x)%27 == 0)) = [0,9,18] := by decide

set_option pp.fullNames true
#check precision_reduction_composes
#print axioms precision_reduction_composes
#check integral_map_preserves_precision
#print axioms integral_map_preserves_precision
#check delta_numerator_precision
#print axioms delta_numerator_precision
#check guard_digit_division
#print axioms guard_digit_division
#check delta_guard_digit_counterexample
#print axioms delta_guard_digit_counterexample
#check derived_reduction_zero_differential
#print axioms derived_reduction_zero_differential
#check finite_ring_nonunit_fixture
#print axioms finite_ring_nonunit_fixture
#check finite_ring_kernel_fixture
#print axioms finite_ring_kernel_fixture
end MathScope.M1.Arithmetic
