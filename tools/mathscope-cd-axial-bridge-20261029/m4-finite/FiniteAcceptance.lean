import MathScope.M4.Finite
import Init.Data.Int.DivMod.Lemmas

/-!
# M4 finite acceptance: exact quotient precision and a semilinear chain map

The inherited finite module gives the integer numerator, d²=0, trial-prime
interval, matrix bracket, and shear holonomy. The added theorems establish
integer quotient/residue precision for p=2 and a genuine nonidentity
semilinear chain map on the product of two copies of the same D=1 complex.
-/

namespace MathScope.M4.FiniteAcceptance

def deltaNumerator (x y : Int) : Int := (x+y)*(x+y)-x*x-y*y

def deltaTwo (x y : Int) : Int := deltaNumerator x y / 2

theorem delta_numerator_factor (x y : Int) : deltaNumerator x y = 2 * (x * y) :=
  (MathScope.M4.Finite.delta_two_numerator x y).trans (Int.mul_assoc 2 x y)

/-- Exact division is valid for all integer inputs, including negatives. -/
theorem delta_two_exact_quotient (x y : Int) : deltaTwo x y = x * y := by
  rw [deltaTwo, delta_numerator_factor]
  exact Int.mul_ediv_cancel_left (x * y) (by decide)

/-- The quotient is stable under replacement by input representatives. -/
theorem delta_two_input_residues (x y m : Int) :
    deltaTwo (x % m) (y % m) % m = deltaTwo x y % m := by
  simp only [delta_two_exact_quotient]
  exact (Int.mul_emod x y m).symm

theorem delta_two_quotient_from_wider_numerator (x y m : Int) :
    (deltaNumerator x y % (2 * m)) / 2 = deltaTwo x y % m := by
  rw [delta_numerator_factor, Int.mul_emod_mul_of_pos (x*y) m (by decide),
    delta_two_exact_quotient]
  exact Int.mul_ediv_cancel_left ((x*y) % m) (by decide)

/-- For an output modulo 2^N, a numerator reduced modulo twice that modulus
suffices. This is exact finite integer arithmetic at p=2. -/
theorem delta_two_precision (x y : Int) (N : Nat) :
    (deltaNumerator x y % (2 * (2 : Int)^N)) / 2 = deltaTwo x y % (2 : Int)^N :=
  delta_two_quotient_from_wider_numerator x y ((2 : Int)^N)

/-- A same-width numerator can lose the quotient residue. -/
theorem delta_two_same_width_counterexample :
    (deltaNumerator 3 3 % 16) / 2 ≠ deltaTwo 3 3 % 16 := by decide

open MathScope.M0

abbrev Coeff := Int × Int

def swapPair {A : Type} (x : A × A) : A × A := (x.2, x.1)

def pairAdd (x y : Coeff) : Coeff := (x.1+y.1, x.2+y.2)

def pairMul (x y : Coeff) : Coeff := (x.1*y.1, x.2*y.2)

theorem coefficient_swap_is_involutive (x : Coeff) :
    swapPair (swapPair x) = x := by
  cases x
  rfl

theorem coefficient_swap_preserves_add_mul (x y : Coeff) :
    swapPair (pairAdd x y) = pairAdd (swapPair x) (swapPair y) ∧
    swapPair (pairMul x y) = pairMul (swapPair x) (swapPair y) :=
  ⟨rfl, rfl⟩

theorem coefficient_swap_preserves_one : swapPair ((1, 1) : Coeff) = (1, 1) := rfl

theorem coefficient_swap_nonidentity : swapPair ((0, 1) : Coeff) ≠ (0, 1) := by decide

def scalarC0 (s : Int) (v : C0) : C0 := ⟨s*v.a, s*v.b, s*v.c, s*v.d⟩
def scalarC1 (s : Int) (v : C1) : C1 := ⟨s*v.u, s*v.v, s*v.w, s*v.x, s*v.y⟩
def scalarC2 (s : Int) (v : C2) : C2 := ⟨s*v.a, s*v.b, s*v.c⟩

def scalarPair {A : Type} (scale : Int → A → A) (s : Coeff) (v : A × A) : A × A :=
  (scale s.1 v.1, scale s.2 v.2)

def pairZip {A : Type} (f : A → A → A) (x y : A × A) : A × A :=
  (f x.1 y.1, f x.2 y.2)

theorem swap_additive {A : Type} (add : A → A → A) (x y : A × A) :
    swapPair (pairZip add x y) = pairZip add (swapPair x) (swapPair y) := rfl

def pairD0 (v : C0 × C0) : C1 × C1 := (d0 v.1, d0 v.2)
def pairD1 (v : C1 × C1) : C2 × C2 := (d1 v.1, d1 v.2)

theorem product_differential_squared_zero (v : C0 × C0) :
    pairD1 (pairD0 v) = (zeroC2, zeroC2) := by
  simp [pairD0, pairD1, MathScope.M4.Finite.differential_squared_zero]

/-- Component exchange is semilinear for the coefficient automorphism that
exchanges the two factors of Z × Z. It commutes with both differentials. -/
theorem nonidentity_semilinear_chain_map (s : Coeff)
    (x : C0 × C0) (y : C1 × C1) (z : C2 × C2) :
    swapPair (scalarPair scalarC0 s x) = scalarPair scalarC0 (swapPair s) (swapPair x) ∧
    swapPair (scalarPair scalarC1 s y) = scalarPair scalarC1 (swapPair s) (swapPair y) ∧
    swapPair (scalarPair scalarC2 s z) = scalarPair scalarC2 (swapPair s) (swapPair z) ∧
    pairD0 (swapPair x) = swapPair (pairD0 x) ∧
    pairD1 (swapPair y) = swapPair (pairD1 y) :=
  ⟨rfl, rfl, rfl, rfl, rfl⟩

set_option pp.fullNames true
#check delta_two_exact_quotient
#print axioms delta_two_exact_quotient
#check delta_two_input_residues
#print axioms delta_two_input_residues
#check delta_two_precision
#print axioms delta_two_precision
#check delta_two_same_width_counterexample
#print axioms delta_two_same_width_counterexample
#check coefficient_swap_nonidentity
#print axioms coefficient_swap_nonidentity
#check nonidentity_semilinear_chain_map
#print axioms nonidentity_semilinear_chain_map
#check product_differential_squared_zero
#print axioms product_differential_squared_zero

end MathScope.M4.FiniteAcceptance
