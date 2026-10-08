import Init.Grind.Ring.CommSolver

/-!
Golden nonlinear elliptic algebra, version 1.

This file proves exact commutative-ring identities for the reaction polynomial
and the coefficient of a formal perturbation. D is an abstract map; its stated
linearity property and D(1)=0 are assumptions. Instantiating D as the Laplacian
of a closed flat torus, analytic Frechet differentiability, domain/regularity,
existence/uniqueness, spectrum, Fredholm index and global nonlinear assertions
are NOT theorems in this file. C-014 is a different claim and is not used.

The explicit Expr syntax trees below use the core commutative-ring reflection
theorem Expr.eq_of_toPoly_eq. Each Eq.refl true certificate reduces equality
of the normalized polynomials in Lean's kernel; no native_decide, external
oracle, cached proof artifact, or grind tactic execution is used here.
The theorem statements and mathematical assumptions are unchanged.
-/

namespace MathScope.GoldenElliptic

variable {R : Type} [Lean.Grind.CommRing R]

def residual (D : R → R) (lam u : R) : R := -(D u) + lam * u - u ^ 3
def linearCoefficient (D : R → R) (lam u v : R) : R := -(D v) + (lam - 3 * u ^ 2) * v

open Lean.Grind.CommRing in
/-- Exact polynomial remainder identity under the explicitly assumed D relation.
The reflection context maps indices 0..5 to D u, D v, lam, u, v, t.
congrArg first applies hD; the AST equality then proves the remaining ring identity. -/
theorem exact_perturbation
    (D : R → R) (lam u v t : R)
    (hD : D (u + t * v) = D u + t * D v) :
    residual D lam (u + t * v) = residual D lam u + t * linearCoefficient D lam u v - t ^ 2 * (3 * u * v ^ 2 + t * v ^ 3) :=
  Eq.trans (congrArg (fun d => -d + lam * (u + t * v) - (u + t * v) ^ 3) hD)
    (Expr.eq_of_toPoly_eq
      (.branch 1 (.leaf (D u)) (.branch 2 (.leaf (D v)) (.branch 3 (.leaf lam) (.branch 4 (.leaf u) (.branch 5 (.leaf v) (.leaf t))))))
      (.sub (.add (.neg (.add (.var 0) (.mul (.var 5) (.var 1))))
        (.mul (.var 2) (.add (.var 3) (.mul (.var 5) (.var 4)))))
        (.pow (.add (.var 3) (.mul (.var 5) (.var 4))) 3))
      (.sub (.add (.sub (.add (.neg (.var 0)) (.mul (.var 2) (.var 3))) (.pow (.var 3) 3))
        (.mul (.var 5) (.add (.neg (.var 1)) (.mul (.sub (.var 2) (.mul (.num 3) (.pow (.var 3) 2))) (.var 4)))))
        (.mul (.pow (.var 5) 2) (.add (.mul (.mul (.num 3) (.var 3)) (.pow (.var 4) 2)) (.mul (.var 5) (.pow (.var 4) 3)))))
      (Eq.refl true))

open Lean.Grind.CommRing in
/-- The lambda=1, u=1 algebraic residual is zero when D annihilates one. -/
theorem constant_one_stationary (D : R → R) (hD : D 1 = 0) :
    residual D 1 1 = 0 :=
  Eq.trans (congrArg (fun d : R => -d + 1 * 1 - 1 ^ 3) hD)
    (Expr.eq_of_toPoly_eq (.leaf (0 : R))
      (.sub (.add (.neg (.num 0)) (.mul (.num 1) (.num 1))) (.pow (.num 1) 3))
      (.num 0) (Eq.refl true))

open Lean.Grind.CommRing in
/-- The formal perturbation coefficient at lambda=1, u=1 is -D(v)-2*v.
The reflection context maps indices 0 and 1 to D v and v. -/
theorem constant_one_linear_coefficient (D : R → R) (v : R) :
    linearCoefficient D 1 1 v = -(D v) - 2 * v :=
  Expr.eq_of_toPoly_eq (.branch 1 (.leaf (D v)) (.leaf v))
    (.add (.neg (.var 0)) (.mul (.sub (.num 1) (.mul (.num 3) (.pow (.num 1) 2))) (.var 1)))
    (.sub (.neg (.var 0)) (.mul (.num 2) (.var 1)))
    (Eq.refl true)

#print axioms exact_perturbation
#print axioms constant_one_stationary
#print axioms constant_one_linear_coefficient

end MathScope.GoldenElliptic
