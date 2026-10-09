import Lake
open Lake DSL
package mathscopeGauge where
lean_lib MathScope where
  roots := #[`MathScope.M1.Gauge.SU3, `MathScope.M1.Gauge.G2,
             `MathScope.M1.Gauge.Transport, `MathScope.M1.Gauge.Conditional]
