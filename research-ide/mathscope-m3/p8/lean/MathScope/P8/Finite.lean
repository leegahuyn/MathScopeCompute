import MathScope.M1.Arithmetic.Algebra
import MathScope.M1.Arithmetic.Precision
import Mathlib.Data.Nat.Prime.Basic
import Lean.Elab.Tactic.Omega

/-! Exact finite consumers. No geometric comparison, infinite Euler product,
    elliptic extension-field point-count theorem, or global conjecture is assumed. -/
namespace MathScope.P8

theorem inherited_d_squared (v : MathScope.M1.Arithmetic.C0 ℤ) :
    MathScope.M1.Arithmetic.d1 (MathScope.M1.Arithmetic.d0 v) = ⟨0,0,0⟩ :=
  MathScope.M1.Arithmetic.p1_d_squared_zero v

theorem inherited_unit_contraction (k x u v w : ℤ) :
    MathScope.M1.Arithmetic.weightB k (MathScope.M1.Arithmetic.posA k x) = 0 ∧
    MathScope.M1.Arithmetic.posH1 (MathScope.M1.Arithmetic.posA k x) = x ∧
    MathScope.M1.Arithmetic.posA k (MathScope.M1.Arithmetic.posH1 (u,v)) +
      MathScope.M1.Arithmetic.weightH2 (MathScope.M1.Arithmetic.weightB k (u,v)) = (u,v) ∧
    MathScope.M1.Arithmetic.weightB k (MathScope.M1.Arithmetic.weightH2 w) = w :=
  MathScope.M1.Arithmetic.positive_weight_contractible k x u v w

theorem inherited_precision_reduction (p a : ℤ) (N M : ℕ) (h : N ≤ M) :
    (a % p^M) % p^N = a % p^N :=
  MathScope.M1.Arithmetic.precision_reduction_composes p a N M h

/-- A finite list of every residue pair solving y² = x³ - x modulo p. -/
def affinePoints (p : ℕ) : List (ℕ × ℕ) :=
  ((List.range p).flatMap fun x => (List.range p).map fun y => (x,y)).filter
    (fun xy => ((xy.2 : ℤ)^2 % (p : ℤ)) ==
      (((xy.1 : ℤ)^3 - (xy.1 : ℤ)) % (p : ℤ)))

/-- The explicitly declared projective completion adds its one infinity point. -/
def pointCount (p : ℕ) : ℕ := (affinePoints p).length + 1

structure Mat2 where
  a : ℤ
  b : ℤ
  c : ℤ
  d : ℤ
  deriving DecidableEq, Repr

def mmul (A B : Mat2) : Mat2 :=
  ⟨A.a*B.a+A.b*B.c, A.a*B.b+A.b*B.d,
   A.c*B.a+A.d*B.c, A.c*B.b+A.d*B.d⟩
def mtrace (A : Mat2) : ℤ := A.a + A.d
def mdet (A : Mat2) : ℤ := A.a*A.d - A.b*A.c
def mpow (A : Mat2) : ℕ → Mat2
  | 0 => ⟨1,0,0,1⟩
  | n+1 => mmul A (mpow A n)
def tracePrefix (A : Mat2) (length : ℕ) : List ℤ :=
  (List.range length).map fun n => mtrace (mpow A n)

/-- The 2 by 2 Cayley-Hamilton trace identity, including arbitrary test matrix B. -/
theorem trace_cayley_hamilton (A B : Mat2) :
    mtrace (mmul A (mmul A B)) =
      mtrace A * mtrace (mmul A B) - mdet A * mtrace B := by
  dsimp [mtrace, mmul, mdet]
  ring

theorem matrix_trace_recurrence (A : Mat2) (n : ℕ) :
    mtrace (mpow A (n+2)) =
      mtrace A * mtrace (mpow A (n+1)) - mdet A * mtrace (mpow A n) := by
  change mtrace (mmul A (mmul A (mpow A n))) =
    mtrace A * mtrace (mmul A (mpow A n)) - mdet A * mtrace (mpow A n)
  exact trace_cayley_hamilton A (mpow A n)

def boundedResidues (modulus residue : ℤ) (bound : ℕ) : List ℤ :=
  ((List.range (2*bound+1)).map fun (n : ℕ) => (n : ℤ) - (bound : ℤ)).filter
    (fun x => x % modulus == residue % modulus)

/-- Exact uniqueness in this printed bounded interval; the bound is a hypothesis. -/
theorem residue_625_unique (x y : ℤ) (hx : -5 ≤ x ∧ x ≤ 5)
    (hy : -5 ≤ y ∧ y ≤ 5) (h : x % 625 = y % 625) : x = y := by
  omega

/-- Truncated ascending coefficient convolution. It makes no analytic tail claim. -/
def truncatedProduct (a b : List ℤ) (length : ℕ) : List ℤ :=
  (List.range length).map fun n =>
    ((List.range (n+1)).map fun i =>
      (a[i]?).getD 0 * (b[n-i]?).getD 0).sum

/-- A polynomial identity over any commutative ring, with a separate variable per place. -/
theorem finite_euler_regrouping {R : Type*} [CommRing R]
    (p q Tp Tq : R) :
    ((1-Tp)*(1-p*Tp))*((1-Tq)*(1-q*Tq)) =
      ((1-Tp)*(1-Tq))*((1-p*Tp)*(1-q*Tq)) := by
  ring

end MathScope.P8
