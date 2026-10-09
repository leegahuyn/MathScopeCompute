import MathScope.M1.Arithmetic.Algebra
open MathScope.M1.Arithmetic
/-- Deliberately wrong sign: the correct positive h1 is -v, not v. -/
theorem invalid_positive_contraction :
    negH1 (posA (3 : ℤ) 1) = 1 := by decide
