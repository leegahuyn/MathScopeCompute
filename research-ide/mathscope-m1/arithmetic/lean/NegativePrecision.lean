import MathScope.M1.Arithmetic.Precision
/-- Deliberately invents the unknown guard digit. -/
theorem invalid_delta_precision :
    (((0 : ℤ)-0^3)/3) % 27 = (((27 : ℤ)-27^3)/3) % 27 := by decide
