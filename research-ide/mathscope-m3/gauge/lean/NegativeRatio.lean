import FiniteSpectral
open MathScope.M3.Gauge
def invalidRatio : TransferCertificate :=
  { fourState with ratioNumerator := 1, ratioDenominator := 3 }
example : invalidRatio.valid = true := by decide
