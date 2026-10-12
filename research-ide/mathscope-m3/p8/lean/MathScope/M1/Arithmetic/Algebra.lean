import Mathlib.Algebra.Ring.Basic
import Mathlib.Tactic.Ring
import Mathlib.Data.Int.Basic

/-! Exact universal identities for the actual standard two-chart P1 complex.
The geometric crystalline/prismatic comparison is not an axiom or theorem here.
The all-weight formulas hold over every commutative coefficient ring, so p|k
does not invalidate them. Restricted families are defined by p-power divisibility.
-/
namespace MathScope.M1.Arithmetic

variable {R : Type*} [CommRing R]

def posA (k x : R) : R × R := (k*x, -x)
def negA (k x : R) : R × R := (-k*x, x)
def weightB (k : R) (z : R × R) : R := -z.1-k*z.2
def posH1 (z : R × R) : R := -z.2
def negH1 (z : R × R) : R := z.2
def weightH2 (w : R) : R × R := (-w,0)

theorem positive_weight_contractible (k x u v w : R) :
    weightB k (posA k x) = 0 ∧
    posH1 (posA k x) = x ∧
    posA k (posH1 (u,v)) + weightH2 (weightB k (u,v)) = (u,v) ∧
    weightB k (weightH2 w) = w := by
  dsimp [weightB, posA, posH1, weightH2]
  constructor
  · ring
  constructor
  · ring
  constructor
  · ext <;> dsimp <;> ring
  · ring

theorem negative_weight_contractible (k x u v w : R) :
    weightB k (negA k x) = 0 ∧
    negH1 (negA k x) = x ∧
    negA k (negH1 (u,v)) + weightH2 (weightB k (u,v)) = (u,v) ∧
    weightB k (weightH2 w) = w := by
  dsimp [weightB, negA, negH1, weightH2]
  constructor
  · ring
  constructor
  · rfl
  constructor
  · ext <;> dsimp <;> ring
  · ring

structure C0 (R : Type*) where
  a : R
  b : R
  c : R
  d : R
structure C1 (R : Type*) where
  u : R
  v : R
  w : R
  x : R
  y : R
structure C2 (R : Type*) where
  a : R
  b : R
  c : R

def d0 (v : C0 R) : C1 R := ⟨v.b,v.d,v.d,v.c-v.a,-v.b⟩
def d1 (v : C1 R) : C2 R := ⟨-v.v+v.w,0,-v.u-v.y⟩
def h1 (v : C1 R) : C0 R := ⟨0,-v.y,v.x,v.w⟩
def h2 (v : C2 R) : C1 R := ⟨-v.c,-v.a,0,0,0⟩
def i0 (x : R) : C0 R := ⟨x,0,x,0⟩
def i2 (x : R) : C2 R := ⟨0,x,0⟩
def r0 (v : C0 R) : R := v.a
def r2 (v : C2 R) : R := v.b

theorem p1_d_squared_zero (v : C0 R) : d1 (d0 v) = ⟨0,0,0⟩ := by
  cases v
  simp [d0,d1]

theorem p1_retraction (x : R) : r0 (i0 x) = x ∧ r2 (i2 x) = x := by
  constructor <;> rfl

theorem p1_homotopy_degree_zero (v : C0 R) :
    h1 (d0 v) = ⟨v.a - (i0 (r0 v)).a,
      v.b - (i0 (r0 v)).b, v.c - (i0 (r0 v)).c,
      v.d - (i0 (r0 v)).d⟩ := by
  cases v
  simp [h1,d0,i0,r0]

theorem p1_homotopy_degree_one (v : C1 R) :
    C1.mk ((d0 (h1 v)).u + (h2 (d1 v)).u)
      ((d0 (h1 v)).v + (h2 (d1 v)).v)
      ((d0 (h1 v)).w + (h2 (d1 v)).w)
      ((d0 (h1 v)).x + (h2 (d1 v)).x)
      ((d0 (h1 v)).y + (h2 (d1 v)).y) = v := by
  cases v
  simp only [h1,h2,d0,d1]
  congr <;> ring

theorem p1_homotopy_degree_two (v : C2 R) :
    d1 (h2 v) = ⟨v.a-(i2 (r2 v)).a,
      v.b-(i2 (r2 v)).b, v.c-(i2 (r2 v)).c⟩ := by
  cases v
  simp [d1,h2,i2,r2]

def weightF1 (p : R) (z : R × R) : R × R := (p*z.1,z.2)

theorem frobenius_positive_chain_map (p k x : R) (z : R × R) :
    posA (p*k) x = weightF1 p (posA k x) ∧
    weightB (p*k) (weightF1 p z) = p*weightB k z := by
  constructor
  · apply Prod.ext
    · dsimp [posA,weightF1]; ring
    · rfl
  · dsimp [weightB,weightF1]; ring

theorem frobenius_negative_chain_map (p k x : R) (z : R × R) :
    negA (p*k) x = weightF1 p (negA k x) ∧
    weightB (p*k) (weightF1 p z) = p*weightB k z := by
  constructor
  · apply Prod.ext
    · dsimp [negA,weightF1]; ring
    · rfl
  · dsimp [weightB,weightF1]; ring

/-- Uniform p-adic restrictedness; this is not a real absolute-value cutoff. -/
def Restricted (p : R) (f : ℤ → R) : Prop :=
  ∀ N : ℕ, ∃ B : ℕ, ∀ k : ℤ, B < k.natAbs → ∃ a : R, f k = p^N*a

theorem restricted_neg (p : R) (f : ℤ → R) (hf : Restricted p f) :
    Restricted p (fun k => -f k) := by
  intro N
  obtain ⟨B,hB⟩ := hf N
  refine ⟨B,?_⟩
  intro k hk
  obtain ⟨a,ha⟩ := hB k hk
  refine ⟨-a,?_⟩
  dsimp only
  rw [ha]
  ring

/-- Even unbounded integer weights are p-adically bounded multipliers. -/
theorem restricted_mul_weight (p : R) (f : ℤ → R) (w : ℤ → R)
    (hf : Restricted p f) : Restricted p (fun k => w k * f k) := by
  intro N
  obtain ⟨B,hB⟩ := hf N
  refine ⟨B,?_⟩
  intro k hk
  obtain ⟨a,ha⟩ := hB k hk
  refine ⟨w k*a,?_⟩
  dsimp only
  rw [ha]
  ring

theorem restricted_add (p : R) (f g : ℤ → R)
    (hf : Restricted p f) (hg : Restricted p g) :
    Restricted p (fun k => f k+g k) := by
  intro N
  obtain ⟨B,hB⟩ := hf N
  obtain ⟨C,hC⟩ := hg N
  refine ⟨max B C,?_⟩
  intro k hk
  obtain ⟨a,ha⟩ := hB k (lt_of_le_of_lt (le_max_left B C) hk)
  obtain ⟨b,hb⟩ := hC k (lt_of_le_of_lt (le_max_right B C) hk)
  refine ⟨a+b,?_⟩
  dsimp only
  rw [ha,hb]
  ring

theorem restricted_select (p : R) (f g : ℤ → R) (P : ℤ → Prop)
    [DecidablePred P] (hf : Restricted p f) (hg : Restricted p g) :
    Restricted p (fun k => if P k then f k else g k) := by
  intro N
  obtain ⟨B,hB⟩ := hf N
  obtain ⟨C,hC⟩ := hg N
  refine ⟨max B C,?_⟩
  intro k hk
  by_cases h : P k
  · simpa [h] using hB k (lt_of_le_of_lt (le_max_left B C) hk)
  · simpa [h] using hC k (lt_of_le_of_lt (le_max_right B C) hk)

/-- A coefficient identity valid at every precision is an inverse-system identity. -/
theorem inverse_system_identity {A : ℕ → Type*}
    (f g : (N : ℕ) → ℤ → A N) (h : ∀ N k, f N k = g N k) : f = g := by
  funext N k
  exact h N k

/-- The H2 generator is dt/t; pullback multiplies its coefficient by p. -/
theorem p1_frobenius_degree_two (p x : R) :
    r2 (C2.mk 0 (p*x) 0) = p*x := rfl

set_option pp.fullNames true
#check positive_weight_contractible
#print axioms positive_weight_contractible
#check negative_weight_contractible
#print axioms negative_weight_contractible
#check p1_d_squared_zero
#print axioms p1_d_squared_zero
#check p1_retraction
#print axioms p1_retraction
#check p1_homotopy_degree_zero
#print axioms p1_homotopy_degree_zero
#check p1_homotopy_degree_one
#print axioms p1_homotopy_degree_one
#check p1_homotopy_degree_two
#print axioms p1_homotopy_degree_two
#check frobenius_positive_chain_map
#print axioms frobenius_positive_chain_map
#check frobenius_negative_chain_map
#print axioms frobenius_negative_chain_map
#check restricted_neg
#print axioms restricted_neg
#check restricted_mul_weight
#print axioms restricted_mul_weight
#check restricted_add
#print axioms restricted_add
#check restricted_select
#print axioms restricted_select
#check inverse_system_identity
#print axioms inverse_system_identity
#check p1_frobenius_degree_two
#print axioms p1_frobenius_degree_two
end MathScope.M1.Arithmetic
