import RealSpectralBridge
open MathScope.M3.Gauge.RealSpectral
open scoped BigOperators

example (model : FiniteSpectralModel)
  (weight excess : Fin model.dimension → ℝ) (delta time : ℝ)
  (hDelta : 0 < delta)
  (hTime : 0 ≤ time)
  (hWeight : ∀ j, 0 ≤ weight j)
  (hExcess : ∀ j, 0 ≤ excess j)
  : 0 < delta ∧ spectralSum model weight excess delta time ≤
      Real.exp (-delta * time) * ∑ j, weight j := by
  exact finite_weighted_exp_envelope model weight excess delta time hDelta hTime hWeight hExcess
