import Init
-- The explicit signed-weight counterexample fails at discrete time one:
-- -1 * (1/4) <= -1 * (1/2) is false; multiply by four.
example : (-1 : Int) ≤ -2 := by decide
