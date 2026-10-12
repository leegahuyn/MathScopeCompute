import MathScope.P8.Generated
open MathScope.P8
/-- Enlarging the interval beyond half the modulus admits -5 and 5 as well. -/
theorem invalid_dropped_bound : boundedResidues 5 0 5 = [0] := by decide
