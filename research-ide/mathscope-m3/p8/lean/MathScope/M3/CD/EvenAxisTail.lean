import Mathlib

/-!
Conditional algebraic part of the first even-X error estimate.

The source Picard tail, eta Cauchy bound, coefficient-xi suprema, and the
regular even-axis integral identity are inputs. This file does not establish
any of those analytic hypotheses or identify a native Picard limit.
-/

namespace MathScope.M3.CD

/-- Combine a first-xi derivative tail, a second-xi Volterra error estimate,
and a bound obtained from the regular even-axis averaging identity. -/
theorem evenAxisErrorBound
    (s C D T V Z gamma error : ℝ)
    (hs : 0 < s) (hC : 0 ≤ C)
    (hgamma : 0 ≤ gamma)
    (hfirst : V ≤ C * (1 + 4 / s) * T)
    (hsecond : Z ≤ 2 * (1 + 4 / s) * (D * T + (C / 2) * V))
    (haxis : |error| ≤ (gamma / 2) * Z) :
    |error| ≤ gamma * (1 + 4 / s) *
      (D + (C ^ 2 / 2) * (1 + 4 / s)) * T := by
  have hhalfC : 0 ≤ C / 2 := by positivity
  have htwoq : 0 ≤ (2 : ℝ) * (1 + 4 / s) := by positivity
  have hhalfgamma : 0 ≤ gamma / 2 := by positivity
  have hv : (C / 2) * V ≤ (C / 2) * (C * (1 + 4 / s) * T) :=
    mul_le_mul_of_nonneg_left hfirst hhalfC
  have hi : D * T + (C / 2) * V ≤
      D * T + (C / 2) * (C * (1 + 4 / s) * T) :=
    add_le_add (le_refl (D * T)) hv
  have hz : Z ≤ 2 * (1 + 4 / s) *
      (D * T + (C / 2) * (C * (1 + 4 / s) * T)) :=
    le_trans hsecond (mul_le_mul_of_nonneg_left hi htwoq)
  calc
    |error| ≤ (gamma / 2) * Z := haxis
    _ ≤ (gamma / 2) * (2 * (1 + 4 / s) *
        (D * T + (C / 2) * (C * (1 + 4 / s) * T))) :=
      mul_le_mul_of_nonneg_left hz hhalfgamma
    _ = gamma * (1 + 4 / s) *
        (D + (C ^ 2 / 2) * (1 + 4 / s)) * T := by ring

/-- The source geometric tail and the m-th eta-Cauchy factor specialize the
abstract conditional estimate. The natural k is the tail exponent N-2. -/
theorem evenAxisGeometricTail
    (s C D V Z error : ℝ) (k m : ℕ)
    (hs : 0 < s) (hC : 0 ≤ C)
    (hfirst : V ≤ C * (1 + 4 / s) * (1 / (3 * (4 : ℝ) ^ k)))
    (hsecond : Z ≤ 2 * (1 + 4 / s) *
      (D * (1 / (3 * (4 : ℝ) ^ k)) + (C / 2) * V))
    (haxis : |error| ≤ ((Nat.factorial m : ℝ) * (2 / s) ^ m / 2) * Z) :
    |error| ≤ (Nat.factorial m : ℝ) * (2 / s) ^ m * (1 + 4 / s) *
      (D + (C ^ 2 / 2) * (1 + 4 / s)) * (1 / (3 * (4 : ℝ) ^ k)) := by
  have hgamma : 0 ≤ (Nat.factorial m : ℝ) * (2 / s) ^ m := by positivity
  exact evenAxisErrorBound s C D (1 / (3 * (4 : ℝ) ^ k)) V Z
    ((Nat.factorial m : ℝ) * (2 / s) ^ m) error hs hC hgamma
    hfirst hsecond haxis

#print axioms evenAxisErrorBound
#print axioms evenAxisGeometricTail

end MathScope.M3.CD
