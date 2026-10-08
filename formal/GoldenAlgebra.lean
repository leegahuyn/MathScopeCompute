import Lean

/-!
Golden nonlinear elliptic algebra, version 1.

This file proves exact commutative-ring identities for the reaction polynomial
and the coefficient of a formal perturbation. D is an abstract map; its stated
linearity property and D(1)=0 are assumptions. Instantiating D as the Laplacian
of a closed flat torus, analytic Frechet differentiability, domain/regularity,
existence/uniqueness, spectrum, Fredholm index and global nonlinear assertions
are NOT theorems in this file. C-014 is a different claim and is not used.
-/

namespace MathScope.GoldenElliptic

variable {R : Type} [Lean.Grind.CommRing R]

def residual (D : R → R) (lam u : R) : R := -(D u) + lam * u - u ^ 3
def linearCoefficient (D : R → R) (lam u v : R) : R := -(D v) + (lam - 3 * u ^ 2) * v

/-- Exact polynomial remainder identity under the explicitly assumed D relation. -/
theorem exact_perturbation
    (D : R → R) (lam u v t : R)
    (hD : D (u + t * v) = D u + t * D v) :
    residual D lam (u + t * v) = residual D lam u + t * linearCoefficient D lam u v - t ^ 2 * (3 * u * v ^ 2 + t * v ^ 3) := by
  unfold residual linearCoefficient
  rw [hD]
  grind

/-- The lambda=1, u=1 algebraic residual is zero when D annihilates one. -/
theorem constant_one_stationary (D : R → R) (hD : D 1 = 0) :
    residual D 1 1 = 0 := by
  unfold residual
  rw [hD]
  grind

/-- The formal perturbation coefficient at lambda=1, u=1 is -D(v)-2*v. -/
theorem constant_one_linear_coefficient (D : R → R) (v : R) :
    linearCoefficient D 1 1 v = -(D v) - 2 * v := by
  unfold linearCoefficient
  grind

#print axioms exact_perturbation
#print axioms constant_one_stationary
#print axioms constant_one_linear_coefficient

end MathScope.GoldenElliptic
