import MathScope.M1.Arithmetic.Prime
set_option maxRecDepth 10000
theorem invalid_prime_certificate : Nat.Prime 341 := by decide
