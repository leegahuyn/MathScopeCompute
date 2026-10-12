import FiniteSpectral
open MathScope.M3.Gauge
-- This interval contains an actual finite positive level. Removing the gap
-- hypothesis cannot turn the conditional exclusion into an unconditional one.
example : ¬ ((fun energy : Nat => energy = 1) 1) := by decide
