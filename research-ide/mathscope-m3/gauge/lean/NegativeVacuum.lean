import FiniteSpectral
open MathScope.M3.Gauge
def missingVacuum : TransferCertificate :=
  { degenerateVacuum with vacuumIndices := [0] }
example : missingVacuum.valid = true := by decide
