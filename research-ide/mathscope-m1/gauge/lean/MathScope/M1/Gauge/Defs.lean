import Init

/-!
Finite exact Gaussian-integer matrix operations used for explicit fixtures.
All tested matrices have their recorded square shape. This is not a definition
of a Hilbert-space quantum Yang-Mills theory or a general matrix Lie-group API.
-/
namespace MathScope.M1.Gauge

structure CI where
  re : Int
  im : Int
  deriving DecidableEq, Repr, Inhabited

def ciAdd (a b : CI) : CI := ⟨a.re + b.re, a.im + b.im⟩
def ciNeg (a : CI) : CI := ⟨-a.re, -a.im⟩
def ciMul (a b : CI) : CI := ⟨a.re*b.re-a.im*b.im, a.re*b.im+a.im*b.re⟩
def ciConj (a : CI) : CI := ⟨a.re, -a.im⟩
def ciScale (c : Int) (a : CI) : CI := ⟨c*a.re,c*a.im⟩
def ciZero : CI := ⟨0,0⟩
abbrev Mat := List (List CI)
def matZero (n : Nat) : Mat := List.replicate n (List.replicate n ciZero)
def matId (n : Nat) : Mat := (List.range n).map fun i => (List.range n).map fun j => if i == j then ⟨1,0⟩ else ciZero
def matAdd (a b : Mat) : Mat := a.zipWith (fun x y => x.zipWith ciAdd y) b
def matScale (c : Int) (a : Mat) : Mat := a.map (fun row => row.map (ciScale c))
def matNeg (a : Mat) : Mat := matScale (-1) a
def matMul (a b : Mat) : Mat := a.map fun row => (List.range b.length).map fun j =>
  (row.zipWith (fun x input => ciMul x (input[j]!)) b).foldl ciAdd ciZero
def matDagger (a : Mat) : Mat := (List.range a.length).map fun i => (List.range a.length).map fun j => ciConj (a[j]![i]!)
def matBracket (a b : Mat) : Mat := matAdd (matMul a b) (matNeg (matMul b a))
def matTrace (a : Mat) : CI := ((List.range a.length).map fun i => a[i]![i]!).foldl ciAdd ciZero
def matrixLinearCombination (n : Nat) (basis : List Mat) (coeff : List Int) : Mat :=
  (basis.zip coeff).foldl (fun a (x,c) => if c == 0 then a else matAdd a (matScale c x)) (matZero n)
def squareShape (n : Nat) (a : Mat) : Bool := (a.length == n) && a.all (fun r => r.length == n)
def antiHermitian (a : Mat) : Bool := matDagger a == matNeg a
abbrev BracketRow := Nat × Nat × List Int
def checkBracketRows (n : Nat) (basis : List Mat) (rows : List BracketRow) : Bool :=
 rows.all fun (a,b,c) => matBracket basis[a]! basis[b]! == matrixLinearCombination n basis c

def bracketJacobi (a b c : Mat) : Mat :=
 matAdd (matAdd (matBracket a (matBracket b c)) (matBracket b (matBracket c a)))
   (matBracket c (matBracket a b))

def gramTrace (basis : List Mat) : List (List Int) :=
 basis.map fun a => basis.map fun b => -(matTrace (matMul a b)).re

def gaugeLink (gx u gy : Mat) : Mat := matMul (matMul gx u) (matDagger gy)
def holonomy3 (u v w : Mat) : Mat := matMul (matMul u v) w

end MathScope.M1.Gauge
