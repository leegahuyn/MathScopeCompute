import FiniteSpectral
open MathScope.M3.Gauge
def invalidTime : TransferCertificate := { fourState with atNumerator := 0 }
example : invalidTime.valid = true := by decide
