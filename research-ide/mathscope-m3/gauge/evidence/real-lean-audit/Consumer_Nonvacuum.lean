import RealSpectralBridge
open MathScope.M3.Gauge.RealSpectral
open scoped BigOperators

example (model : FiniteSpectralModel)
  (certificate : TransferEnclosure model) (j : Fin model.dimension)
  (hNonvacuum : j ∈ certificate.excited)
  : certificate.gap ≤ certificate.energy j := by
  exact (certificate.nonvacuum_lower_bound j hNonvacuum).2.2
