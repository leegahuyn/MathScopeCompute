import RealSpectralBridge
open MathScope.M3.Gauge.RealSpectral
open scoped BigOperators

example (spacing ratio r : ℝ)
  (hRatio : 0 < ratio)
  (hUpper : ratio ≤ r)
  : -Real.log r / spacing ≤ -Real.log ratio / spacing := by
  exact log_ratio_lower_bound spacing ratio r hAt hRatio hUpper
