import Std

/-!
# Algebra used by actual pulse sensitivity, covariance inversion and curl

These are universal algebraic theorems, checked by the ordinary Lean kernel.
`Differential` records explicit Leibniz premises. It does not assert that any
particular source expression is differentiable or that a Volterra limit has
these derivatives. A `Ring` may be noncommutative, so matrix order is retained.

No theorem below constructs the actual NS field, proves a source norm, proves
positive covariance weights, or identifies a finite sum with an infinite one.
Those analytic and source-binding obligations remain separate.
-/

namespace MathScope.M2.Navier

open Lean.Grind

universe u

/-- A derivation on a unital ring; every law is an explicit structure field. -/
structure Differential (K : Type u) [Ring K] where
  apply : K → K
  map_add : ∀ x y, apply (x + y) = apply x + apply y
  map_mul : ∀ x y, apply (x * y) = apply x * y + x * apply y
  map_zero : apply 0 = 0
  map_one : apply 1 = 0

instance {K : Type u} [Ring K] : CoeFun (Differential K) (fun _ => K → K) :=
  ⟨Differential.apply⟩

namespace Differential

variable {K : Type u} [Ring K]

theorem map_neg (D : Differential K) (x : K) : D (-x) = -(D x) := by
  have h := D.map_add x (-x)
  simp [AddCommGroup.add_neg_cancel, D.map_zero] at h
  grind

theorem map_sub (D : Differential K) (x y : K) : D (x - y) = D x - D y := by
  rw [Ring.sub_eq_add_neg, D.map_add, D.map_neg, Ring.sub_eq_add_neg]

/-- Both cross terms occur. The derivations need not commute. -/
theorem mixed_product (D E : Differential K) (x y : K) :
    D (E (x * y)) = D (E x) * y + E x * D y + D x * E y + x * D (E y) := by
  simp only [E.map_mul, D.map_add, D.map_mul]
  grind

/-- The actual first-variation forcing is `(D M) * w`, in this order. -/
theorem first_variation_rhs (D : Differential K) (M w : K) :
    D (M * w) = M * D w + D M * w := by
  rw [D.map_mul, Semiring.add_comm]

/-- The mixed second-variation forcing retains all three forcing terms. -/
theorem mixed_variation_rhs (D E : Differential K) (M w : K) :
    D (E (M * w)) = M * D (E w) + D M * E w + E M * D w + D (E M) * w := by
  rw [mixed_product]
  grind

/-- Pure second derivatives have two equal first-variation cross terms. -/
theorem second_variation_rhs (D : Differential K) (M w : K) :
    D (D (M * w)) = M * D (D w) + (D M * D w + D M * D w) + D (D M) * w := by
  rw [mixed_variation_rhs]
  grind

/-- Differentiate `A*B=1`, then use the unchanged left inverse `B*A=1`. -/
theorem inverse_first (D : Differential K) (A B : K)
    (hAB : A * B = 1) (hBA : B * A = 1) :
    D B = -(B * D A * B) := by
  have h := congrArg (fun z => B * D z) hAB
  simp only [D.map_mul, D.map_one, Semiring.left_distrib,
    ← Semiring.mul_assoc, hBA, Semiring.one_mul, Semiring.mul_zero] at h
  grind

/-- Noncommutative mixed inverse formula; the two ordered products are distinct. -/
theorem inverse_mixed (D E : Differential K) (A B : K)
    (hAB : A * B = 1) (hBA : B * A = 1) :
    D (E B) = B * E A * B * D A * B + B * D A * B * E A * B - B * D (E A) * B := by
  rw [inverse_first E A B hAB hBA, D.map_neg]
  simp only [D.map_mul, inverse_first D A B hAB hBA,
    Semiring.left_distrib, Ring.neg_mul,
    Ring.mul_neg, Semiring.mul_assoc, Ring.sub_eq_add_neg]
  grind

/-- The first differentiated linear solve, using its actual two-sided inverse. -/
theorem solve_first (D : Differential K) (H J y target : K)
    (hJH : J * H = 1) (hsolve : H * y = target) :
    D y = J * (D target - D H * y) := by
  have h := congrArg (fun z => J * D z) hsolve
  simp only [D.map_mul, Semiring.left_distrib, ← Semiring.mul_assoc,
    hJH, Semiring.one_mul] at h
  simp only [Ring.sub_eq_add_neg, Semiring.left_distrib, Ring.mul_neg,
    ← Semiring.mul_assoc]
  grind

/-- The mixed solve formula may be used for actual covariance weights once
the analytic differentiation premises and inverse domain have been supplied. -/
theorem solve_mixed (D E : Differential K) (H J y target : K)
    (hJH : J * H = 1) (hsolve : H * y = target) :
    D (E y) = J * (D (E target) - D (E H) * y - E H * D y - D H * E y) := by
  have h := congrArg (fun z => J * D (E z)) hsolve
  simp only [mixed_product, Semiring.left_distrib, ← Semiring.mul_assoc,
    hJH, Semiring.one_mul] at h
  simp only [Ring.sub_eq_add_neg, Semiring.left_distrib, Ring.mul_neg,
    ← Semiring.mul_assoc]
  grind

end Differential

section Commutative

variable {K : Type u} [CommRing K]

/-- Algebraic covariance-density mixed derivative for each component product. -/
theorem covariance_density_mixed (D E : Differential K) (radial tangent : K) :
    D (E (radial * tangent)) =
      D (E radial) * tangent + D radial * E tangent +
      E radial * D tangent + radial * D (E tangent) := by
  rw [Differential.mixed_product]
  grind

/-- Necessary derivative identity for a chosen square root. Positivity and
existence of a smooth root are not conclusions of this algebraic theorem. -/
theorem square_root_first_relation (D : Differential K) (s y : K)
    (hs : s * s = y) : (s + s) * D s = D y := by
  have h := congrArg D.apply hs
  simp only [D.map_mul] at h
  grind

/-- The second root derivative retains the product of first derivatives. -/
theorem square_root_mixed_relation (D E : Differential K) (s y : K)
    (hs : s * s = y) :
    (s + s) * D (E s) + (D s * E s + D s * E s) = D (E y) := by
  have h := congrArg (fun z => D (E z)) hs
  simp only [Differential.mixed_product] at h
  grind

/-- The normalized full curl's radial component. `w` denotes `i*k*m`. -/
def curlRadial (Dz : Differential K) (w nt nz Ct Cz : K) : K :=
  w * (nt * Cz - nz * Ct) - Dz Ct

def curlTheta (Dr Dz : Differential K) (w nr nz Cr Cz : K) : K :=
  w * (nz * Cr - nr * Cz) + Dz Cr - Dr Cz

def curlAxial (Dr : Differential K) (w nr nt ir Cr Ct : K) : K :=
  w * (nr * Ct - nt * Cr) + Dr Ct + ir * Ct

/-- Exact oscillatory cylindrical divergence of the full potential curl.
The geometric and mixed-derivative premises are explicit; no source regularity
or positivity theorem is hidden inside the statement. -/
theorem full_cylindrical_curl_divergence
    (Dr Dz : Differential K) (w nr nt nz ir Cr Ct Cz : K)
    (hwR : Dr w = 0) (hwZ : Dz w = 0)
    (hntR : Dr nt = -(ir * nt)) (hntZ : Dz nt = 0)
    (hgradient : Dr nz = Dz nr) (hirZ : Dz ir = 0)
    (hmixed : Dr (Dz Ct) = Dz (Dr Ct)) :
    Dr (curlRadial Dz w nt nz Ct Cz) + ir * curlRadial Dz w nt nz Ct Cz +
      Dz (curlAxial Dr w nr nt ir Cr Ct) +
      w * (nr * curlRadial Dz w nt nz Ct Cz +
        nt * curlTheta Dr Dz w nr nz Cr Cz +
        nz * curlAxial Dr w nr nt ir Cr Ct) = 0 := by
  simp only [curlRadial, curlTheta, curlAxial, Dr.map_sub, Dr.map_mul,
    Dz.map_add, Dz.map_sub, Dz.map_mul, hwR, hwZ, hntR, hntZ,
    hgradient, hirZ, hmixed]
  grind

end Commutative

section Field

variable {K : Type u} [Field K]

/-- The literal two-column adjugate inverse used for covariance matching.
Its determinant premise is required even when a symbolic inverse exists. -/
theorem two_column_inverse (a b c d u v : K) (hdet : a * d - b * c ≠ 0) :
    a * ((d * u - b * v) / (a * d - b * c)) +
      b * ((-c * u + a * v) / (a * d - b * c)) = u ∧
    c * ((d * u - b * v) / (a * d - b * c)) +
      d * ((-c * u + a * v) / (a * d - b * c)) = v := by
  have hinv := Field.mul_inv_cancel hdet
  simp only [Field.div_eq_mul_inv]
  grind

/-- Solve the root derivative only when its actual denominator is nonzero. -/
theorem square_root_first (D : Differential K) (s y : K)
    (hs : s * s = y) (hnonzero : s + s ≠ 0) :
    D s = (s + s)⁻¹ * D y := by
  have h := square_root_first_relation D s y hs
  have hinv := Field.inv_mul_cancel hnonzero
  grind

end Field

set_option pp.fullNames true

#check Differential.mixed_product
#print axioms Differential.mixed_product
#check Differential.first_variation_rhs
#print axioms Differential.first_variation_rhs
#check Differential.mixed_variation_rhs
#print axioms Differential.mixed_variation_rhs
#check Differential.second_variation_rhs
#print axioms Differential.second_variation_rhs
#check Differential.inverse_first
#print axioms Differential.inverse_first
#check Differential.inverse_mixed
#print axioms Differential.inverse_mixed
#check Differential.solve_first
#print axioms Differential.solve_first
#check Differential.solve_mixed
#print axioms Differential.solve_mixed
#check covariance_density_mixed
#print axioms covariance_density_mixed
#check square_root_first_relation
#print axioms square_root_first_relation
#check square_root_mixed_relation
#print axioms square_root_mixed_relation
#check full_cylindrical_curl_divergence
#print axioms full_cylindrical_curl_divergence
#check square_root_first
#print axioms square_root_first
#check two_column_inverse
#print axioms two_column_inverse

end MathScope.M2.Navier
