import MathScope.M1.Gauge.Fixtures
open MathScope.M1.Gauge
-- The actual Gram diagonal is 2 after clearing the denominator. Index two
-- would require 4 in this fixed normalization and must be rejected.
example : gramTrace su3EmbeddingScaled = [[4,0,0],[0,4,0],[0,0,4]] := by decide
