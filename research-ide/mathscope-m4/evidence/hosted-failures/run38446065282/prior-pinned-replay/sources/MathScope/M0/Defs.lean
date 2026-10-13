import Init

/-!
MathScope M0: concrete finite algebra definitions.

These integer modules are the D = 1 Cech--de Rham matrix fixture used in the
blueprint.  This file does not identify a finite truncation with a complete
prismatic complex.  The geometric comparison and the omitted weights require
separate certificates.
-/

namespace MathScope.M0

structure C0 where
  a : Int
  b : Int
  c : Int
  d : Int
  deriving DecidableEq, Repr

structure C1 where
  u : Int
  v : Int
  w : Int
  x : Int
  y : Int
  deriving DecidableEq, Repr

structure C2 where
  a : Int
  b : Int
  c : Int
  deriving DecidableEq, Repr

/-- Coordinates of the actual 5 by 4 integer matrix in the blueprint. -/
def d0 (v : C0) : C1 :=
  ⟨v.b, v.d, v.d, v.c - v.a, -v.b⟩

/-- Coordinates of the actual 3 by 5 integer matrix in the blueprint. -/
def d1 (v : C1) : C2 :=
  ⟨-v.v + v.w, 0, -v.u - v.y⟩

def zeroC2 : C2 := ⟨0, 0, 0⟩

/-- The literal matrices are retained for an independently evaluated certificate. -/
def matrixD0 : List (List Int) :=
  [[0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 0, 1],
   [-1, 0, 1, 0], [0, -1, 0, 0]]

def matrixD1 : List (List Int) :=
  [[0, -1, 1, 0, 0], [0, 0, 0, 0, 0], [-1, 0, 0, 0, -1]]

def dot (row column : List Int) : Int :=
  (row.zipWith (fun a b => a * b) column).foldl (fun a b => a + b) 0

/-- Fixed shape 3 by 5 times 5 by 4; no unbounded indexing is requested. -/
def matrixProduct : List (List Int) :=
  matrixD1.map fun row =>
    (List.range 4).map fun j => dot row (matrixD0.map fun input => input[j]!)

end MathScope.M0
