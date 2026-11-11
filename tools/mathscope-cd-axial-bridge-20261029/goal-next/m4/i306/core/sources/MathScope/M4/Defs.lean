import Init

/-! Small exact algebra and precision-indexed uniform-space definitions.
The precision k denotes an explicitly chosen neighbourhood scale. A concrete
real norm/metric adapter must supply its ball laws separately. -/
namespace MathScope.M4

structure Mat2 where
  a : Int
  b : Int
  c : Int
  d : Int
  deriving DecidableEq, Repr

def mul (A B : Mat2) : Mat2 :=
  ⟨A.a*B.a+A.b*B.c, A.a*B.b+A.b*B.d,
   A.c*B.a+A.d*B.c, A.c*B.b+A.d*B.d⟩
def sub (A B : Mat2) : Mat2 := ⟨A.a-B.a,A.b-B.b,A.c-B.c,A.d-B.d⟩
def add (A B : Mat2) : Mat2 := ⟨A.a+B.a,A.b+B.b,A.c+B.c,A.d+B.d⟩
def bracket (A B : Mat2) : Mat2 := sub (mul A B) (mul B A)
def zero : Mat2 := ⟨0,0,0,0⟩
def identity : Mat2 := ⟨1,0,0,1⟩
def shear (t : Int) : Mat2 := ⟨1,t,0,1⟩
def primeTrial (n : Nat) : Bool :=
  n ≥ 2 && ((List.range n).drop 2).all (fun d => n % d != 0)

structure PrecisionMetric (X : Type) where
  close : Nat → X → X → Prop
  reflexive : ∀ k x, close k x x
  symmetric : ∀ k x y, close k x y → close k y x
  triangle : ∀ k x y z, close (k+1) x y → close (k+1) y z → close k x z
  finer : ∀ k x y, close (k+1) x y → close k x y

def Converges {X : Type} (m : PrecisionMetric X) (u : Nat → X) (x : X) : Prop :=
  ∀ k, ∃ N, ∀ n, N ≤ n → m.close k (u n) x
def Cauchy {X : Type} (m : PrecisionMetric X) (u : Nat → X) : Prop :=
  ∀ k, ∃ N, ∀ n p, N ≤ n → N ≤ p → m.close k (u n) (u p)
def Complete {X : Type} (m : PrecisionMetric X) : Prop :=
  ∀ u : Nat → X, Cauchy m u → ∃ x, Converges m u x
def UniformConverges {X Y : Type} (m : PrecisionMetric Y)
    (u : Nat → X → Y) (f : X → Y) : Prop :=
  ∀ k, ∃ N, ∀ n, N ≤ n → ∀ x, m.close k (u n x) (f x)
def UniformContinuous {X Y : Type} (mx : PrecisionMetric X) (my : PrecisionMetric Y)
    (f : X → Y) : Prop :=
  ∀ k, ∃ l, ∀ x y, mx.close l x y → my.close k (f x) (f y)

end MathScope.M4
