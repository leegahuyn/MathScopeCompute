import RealSpectralBridge
open MathScope.M3.Gauge.RealSpectral
open scoped BigOperators

example (spacing r : ℝ)
  (hAt : 0 < spacing)
  (hRatioPositive : 0 < r)
  (hRatioBelowOne : r < 1)
  : 0 < -Real.log r / spacing := by
  exact log_gap_positive spacing r hAt hRatioPositive hRatioBelowOne
