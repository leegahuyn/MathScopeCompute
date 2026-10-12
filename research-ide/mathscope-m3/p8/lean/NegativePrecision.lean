import MathScope.P8.Finite
theorem invalid_guard_digit :
    (((0 : ℤ)-0^3)/3) % 27 = (((27 : ℤ)-27^3)/3) % 27 := by decide
